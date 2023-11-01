import {EntityCache} from "./entity-cache";
import {getTrait} from "./subgraph/traits";
import {createPunk, updatePunkOwner, updatePunkSaleAggregates} from "./helpers/punk-helper";
import {OfferType, Trait, TraitType} from "./model";
import {CRYPTOPUNKS_CONTRACT_ADDRESS, WRAPPEDPUNKS_CONTRACT_ADDRESS, ZERO_ADDRESS} from "./constants";
import {updateAccountAggregates, updateAccountHoldings} from "./helpers/accounts-helper";
import {closeOldAsk, createAskCreatedEvent} from "./helpers/ask-helpers";
import {closeOldBid, createBidCreatedEvent, createBidRemovedEvent} from "./helpers/bid-helpers";
import {updateSale} from "./helpers/sale-helper";
import {updateContractAggregates} from "./helpers/contract-helper";


export async function handleAssign(punkIndex: bigint, to: string, contractAddress: string, logEvent: any, entityCache: EntityCache): Promise<void> {
    // This event fires when the user claims a Punk

    let trait = getTrait(Number(punkIndex));
    let tokenId = punkIndex;
    let account = await entityCache.getOrCreateAccount(to);
    let metadata = entityCache.createMetadata(tokenId)
    let contract = await entityCache.getOrCreateCryptoPunkContract(contractAddress)

    //Assign is always the first EVENTS that actually creates the punk
    let punk = createPunk(tokenId, account);
    let assign = await entityCache.getOrCreateAssignEvent(contract, account, punk, metadata, logEvent);

    if (trait) {
        let traits = new Array<Trait>();
        let type = await entityCache.getOrCreateTrait(trait.type, TraitType.TYPE);
        type.numberOfNfts = type.numberOfNfts + 1n;
        entityCache.saveTrait(type);
        traits.push(type);

        for (let i = 0; i < trait.accessories.length; i++) {
            let accessoryName = trait.accessories[i];
            let acessoryId = accessoryName.split(' ').join('-');
            let accessory = await entityCache.getOrCreateTrait(acessoryId, TraitType.ACCESSORY);
            accessory.numberOfNfts = accessory.numberOfNfts + 1n;
            entityCache.saveTrait(accessory);
            traits.push(accessory);
        }

        entityCache.mapMetaDataWithTraits(metadata, traits);
    }

    //Update account punk holdings
    account.numberOfPunksOwned = account.numberOfPunksOwned + 1n;
    account.numberOfPunksAssigned = account.numberOfPunksAssigned + 1n;

    //Write
    entityCache.saveAccount(account);
    entityCache.saveEvent(assign);
    entityCache.saveContract(contract);
    entityCache.saveMetaData(metadata);
    entityCache.savePunk(punk);
}


export async function handlePunkTransfer(sender: string, receiver: string, tokenID: bigint, logEvent: any, entityCache: EntityCache) {
    let fromProxy = await entityCache.getUserProxy(sender);
    let toProxy = await entityCache.getUserProxy(receiver);

    if (toProxy) {
        // log.debug('PunkTransfer to proxy detected toProxy: {} ', [toProxy.id])
        return
    } else if (receiver !== WRAPPEDPUNKS_CONTRACT_ADDRESS && sender !== WRAPPEDPUNKS_CONTRACT_ADDRESS) {
        // log.debug('Regular punk transfer check: {} ', [tokenId]);

        let toAccount = await entityCache.getOrCreateAccount(receiver);
        let fromAccount = await entityCache.getOrCreateAccount(sender);
        let punk = await entityCache.getPunkByID(tokenID);
        if (!punk) return;

        punk.numberOfTransfers = punk.numberOfTransfers + 1n;
        let transfer = await entityCache.getOrCreateTransferEvent(punk, CRYPTOPUNKS_CONTRACT_ADDRESS, logEvent);
        transfer.fromId = fromAccount.id;
        transfer.toId = toAccount.id;
        transfer.nftId = punk.id;

        //We close the oldBid if the bidder was transferred the punk
        let toBid = punk.currentBidId;
        if (toBid) {
            let oldBid = await entityCache.getOffer(toBid);
            if (oldBid && oldBid.offerType === OfferType.BID && oldBid.fromId === toAccount.id) {
                oldBid.createdId = punk.currentBidCreatedId;
                oldBid.open = false;
                entityCache.saveOffer(oldBid);
            }
        }

        updateAccountHoldings(toAccount, fromAccount);
        toAccount.numberOfTransfers = toAccount.numberOfTransfers + 1n;
        fromAccount.numberOfTransfers = fromAccount.numberOfTransfers + 1n;

        //Capture punk transfers and owners if not transferred to WRAPPED PUNK ADDRESS
        punk.ownerId = toAccount.id;

        //Write
        entityCache.saveEvent(transfer);
        entityCache.saveAccount(toAccount);
        entityCache.saveAccount(fromAccount);
        entityCache.savePunk(punk);

    } else if (fromProxy && sender === fromProxy.id && receiver === WRAPPEDPUNKS_CONTRACT_ADDRESS) {
        // log.info('Wrap detected of punk: {} ', [tokenId])

        let punk = await entityCache.getPunkByID(tokenID);
        if (!punk) return;
        punk.wrapped = true;

        //Write
        entityCache.savePunk(punk);
    } else if (sender === WRAPPEDPUNKS_CONTRACT_ADDRESS) {
        //Burn/Unwrap
        // log.debug('Unwrapped detected. From: {}, punk: {}', [sender.toHexString(), tokenId]);

        let punk = await entityCache.getPunkByID(tokenID);
        if (!punk) return;
        punk.wrapped = false

        //Write
        entityCache.savePunk(punk);
    }


}


export async function handleTransfer(from: string, to: string, value: bigint, logEvent: any, entityCache: EntityCache) {
    /**
     @summary cToken as helper entity
      e.g: https://etherscan.io/tx/0x23d6e24628dabf4fa92fa93630e5fa6f679fac75071aab38d7e307a3c0f4a3ca#eventlog
     */
    if (to === ZERO_ADDRESS) return;

    let fromAccount = await entityCache.getOrCreateAccount(from);
    let toAccount = await entityCache.getOrCreateAccount(to);
    let cToken = await entityCache.getOrCreateCToken(logEvent);

    cToken.fromId = fromAccount.id;
    cToken.toId = toAccount.id;
    cToken.owner = to;
    cToken.amount = value;

    //Write
    entityCache.saveCToken(cToken);
    entityCache.saveAccount(toAccount);
    entityCache.saveAccount(fromAccount);
}


export async function handlePunkOffered(punkIndex: bigint, minValue: bigint, toAddress: string, logEvent: any, entityCache: EntityCache) {
    // console.log(`handlePunkOffered ${punkIndex} to ${toAddress}`);
    /**
     @description:
      - createAskCreatedEVENT
      - create Ask
      - create relationship between Ask and AskCreated to provide information on creation EVENT
     */

    let punk = await entityCache.getPunkByID(punkIndex);
    if (!punk) return;
    let askCreated = createAskCreatedEvent(punkIndex, logEvent);
    let fromAccount = await entityCache.getOrCreateAccount(punk.ownerId);
    let toAccount = await entityCache.getOrCreateAccount(toAddress);
    await closeOldAsk(punk, fromAccount, entityCache);

    let ask = await entityCache.getOrCreateAskOffer(punk.ownerId, logEvent);
    ask.nftId = punk.id;
    ask.fromId = punk.ownerId;
    ask.amount = minValue;
    ask.createdId = askCreated.id
    ask.open = true

    askCreated.toId = toAddress;
    askCreated.fromId = punk.ownerId;
    askCreated.amount = minValue;

    punk.currentAskCreatedId = askCreated.id;
    //Update the currentAsk for the punk in Punk entity for future reference
    punk.currentAskId = ask.id;

    //Write
    entityCache.saveEvent(askCreated);
    entityCache.saveOffer(ask);
    entityCache.savePunk(punk);

}


export async function handlePunkBidEntered(punkIndex: bigint, fromAddress: string, value: bigint, logEvent: any, entityCache: EntityCache) {
    // console.log(`handlePunkBidEntered ${punkIndex} to ${fromAddress}`);
    /**
     @summary This event first only fires when a bid is created
     @description:
      - createBidCreatedEVENT
      - create Bid
      - create relationship between Bid and BidCreated to provide information on creation EVENT
     */

    const bidCreated = createBidCreatedEvent(punkIndex, fromAddress, logEvent);
    const punk = await entityCache.getPunkByID(punkIndex);
    if (!punk) return;
    const account = await entityCache.getOrCreateAccount(fromAddress);
    const bid = await entityCache.getOrCreateBidOffer(fromAddress, logEvent);

    bid.amount = value;
    bid.nftId = punk.id;
    bid.fromId = account.id;
    bid.createdId = bidCreated.id;

    bidCreated.amount = value;

    //Update the currentBid for the punk in Punk entity for future reference
    punk.currentBidId = bid.id;
    punk.currentBidCreatedId = bidCreated.id;

    //Write
    entityCache.saveOffer(bid);
    entityCache.savePunk(punk);
    entityCache.saveAccount(account);
    entityCache.saveEvent(bidCreated);
}


export async function handlePunkBidWithdrawn(punkIndex: bigint, fromAddress: string, value: bigint, logEvent: any, entityCache: EntityCache) {
    // console.log(`handlePunkBidWithdrawn ${punkIndex} to ${fromAddress}`);
    /**
     @summary: The event fires anytime a bidder withdraws their bid
     @description:
      - createBidRemovedEVENT
      - close Old Bid
      - create relationship between Bid and BidRemoved
     */

    const fromAccount = await entityCache.getOrCreateAccount(fromAddress);
    const punk = await entityCache.getPunkByID(punkIndex);
    if (!punk) return;
    const bidRemoved = createBidRemovedEvent(punkIndex, fromAddress, logEvent);
    bidRemoved.amount = value;
    bidRemoved.nftId = punk.id;

    let oldBidId = punk.currentBidId;
    if (oldBidId) {
        const oldBid = await entityCache.getOffer(oldBidId);
        if (oldBid) {
            oldBid.createdId = punk.currentBidCreatedId;
            oldBid.fromId = fromAccount.id;
            oldBid.open = false;
            oldBid.removedId = bidRemoved.id;
            entityCache.saveOffer(oldBid);
        }
    }

    //Update Punk fields with current bid removal EVENT, so we can reference them elsewhere
    punk.currentBidRemovedId = bidRemoved.id;

    //Write
    entityCache.savePunk(punk);
    entityCache.saveAccount(fromAccount);
    entityCache.saveEvent(bidRemoved);
}


export async function handlePunkBought(punkIndex: bigint, value: bigint, fromAddress: string, toAddress: string, logEvent: any, entityCache: EntityCache) {
    if (toAddress === ZERO_ADDRESS) {
        // console.log(`handlePunkBought ${punkIndex} -NULL ADDRESS`);
        /**
         * @summary
         - Logic for tracking acceptBidForPunk(), BidAccepted
         e.g https://etherscan.io/tx/0x23d6e24628dabf4fa92fa93630e5fa6f679fac75071aab38d7e307a3c0f4a3ca#eventlog

         @description:
          - createBidRemovedEvent
          - close Old Bid only if bidder is the buyer
          - close Old Ask since it has been sold
          - createSaleEvent
          - update aggregates for Account, Contract and Punk
         */

        const punk = await entityCache.getPunkByID(punkIndex);
        if (!punk) return;
        const contract = await entityCache.getOrCreateCryptoPunkContract(CRYPTOPUNKS_CONTRACT_ADDRESS);
        const fromAccount = await entityCache.getOrCreateAccount(fromAddress);
        const ownerAddress = await entityCache.getOwnerFromCToken(logEvent);
        if (!ownerAddress) return;
        const toAccount = await entityCache.getOrCreateAccount(ownerAddress);

        const bidRemoved = createBidRemovedEvent(punkIndex, fromAddress, logEvent);
        let sale = await entityCache.getOrCreateSaleEvent(punkIndex, fromAddress, logEvent);
        await closeOldAsk(punk, fromAccount, entityCache);

        //Close old bid if the bidder is the buyer & use the bid amount to update sale
        let oldPunkBidId = punk.currentBidId;
        if (oldPunkBidId) {
            let oldBid = await entityCache.getOffer(oldPunkBidId);
            if (!oldBid) return;
            if (oldBid && oldBid.offerType === OfferType.BID && oldBid.fromId === toAccount.id) {
                oldBid.createdId = punk.currentBidCreatedId;
                oldBid.removedId = bidRemoved.id;
                oldBid.nftId = punk.id;
                oldBid.open = false;

                entityCache.saveOffer(oldBid);
            }
            updateSale(sale, oldBid.amount, ownerAddress);
            updateAccountAggregates(fromAccount, toAccount, oldBid.amount);
            updatePunkSaleAggregates(punk, oldBid.amount);
            updateContractAggregates(contract, oldBid.amount);
        }

        updatePunkOwner(punk, ownerAddress);
        updateAccountHoldings(toAccount, fromAccount);

        //Save the current BidRemoved for future reference
        punk.currentBidRemovedId = bidRemoved.id;

        //Write
        entityCache.saveContract(contract);
        entityCache.savePunk(punk);
        entityCache.saveEvent(sale);
        entityCache.saveEvent(bidRemoved);
        entityCache.saveAccount(toAccount);
        entityCache.saveAccount(fromAccount);

    } else {

        // console.log(`handlePunkBought ${punkIndex} -NORMAL ADDRESS`);
        /**
         @summary Logic for tracking Regular PunkBought
         @description: This also implicitly captures AskAccepted for Punk which is updated in PunkNoLongerForSaleEVENT(Close Ask)
          Example: https://etherscan.io/tx/0x0004ba250b29b0e2cda2e882c8bf5a14e7d2133e63bf0334fb1f44c716ccb187#eventlog
          - buyPunk() does not emit a PunkTransfer event, so we need to keep track
          - createSaleEvent
          - close Old Bid if bidder is buyer
          - close Old Ask
         */

        const price = value;
        const seller = fromAddress;
        const buyer = toAddress;

        const punk = await entityCache.getPunkByID(punkIndex);
        if (!punk) return;
        const contract = await entityCache.getOrCreateCryptoPunkContract(CRYPTOPUNKS_CONTRACT_ADDRESS);
        const fromAccount = await entityCache.getOrCreateAccount(seller);
        const toAccount = await entityCache.getOrCreateAccount(buyer);

        const sale = await entityCache.getOrCreateSaleEvent(punkIndex, seller, logEvent);

        updateSale(sale, price, buyer);
        await closeOldBid(punk, toAccount.id, entityCache);
        await closeOldAsk(punk, fromAccount, entityCache);
        updatePunkOwner(punk, buyer);
        updatePunkSaleAggregates(punk, price);
        updateContractAggregates(contract, price);
        updateAccountHoldings(toAccount, fromAccount);
        updateAccountAggregates(fromAccount, toAccount, price);

        //Write
        entityCache.savePunk(punk);
        entityCache.saveAccount(fromAccount);
        entityCache.saveAccount(toAccount);
        entityCache.saveContract(contract);
        entityCache.saveEvent(sale);
    }
}

