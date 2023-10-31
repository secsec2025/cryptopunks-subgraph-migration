import {EntityCache} from "./entity-cache";
import {getTrait} from "./subgraph/traits";
import {createPunk} from "./helpers/punk-helper";
import {OfferType, Trait, TraitType} from "./model";
import {CRYPTOPUNKS_CONTRACT_ADDRESS, WRAPPEDPUNKS_CONTRACT_ADDRESS, ZERO_ADDRESS} from "./constants";
import {updateAccountHoldings} from "./helpers/accounts-helper";


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

    if (trait !== null) {
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
    } else if (receiver != WRAPPEDPUNKS_CONTRACT_ADDRESS && sender != WRAPPEDPUNKS_CONTRACT_ADDRESS) {
        // log.debug('Regular punk transfer check: {} ', [tokenId]);

        let toAccount = await entityCache.getOrCreateAccount(receiver);
        let fromAccount = await entityCache.getOrCreateAccount(sender);
        let punk = await entityCache.getPunkByID(tokenID);
        if (!punk) return;

        punk.numberOfTransfers = punk.numberOfTransfers + 1n;
        let transfer = await entityCache.getOrCreateTransferEvent(punk, CRYPTOPUNKS_CONTRACT_ADDRESS, logEvent);
        transfer.from = fromAccount;
        transfer.to = toAccount;
        transfer.nft = punk;

        //We close the oldBid if the bidder was transferred the punk
        let toBid = punk.currentBid;
        if (toBid) {
            let oldBid = await entityCache.getOffer(toBid.id);
            if (oldBid && oldBid.offerType === OfferType.BID && oldBid.from.id == toAccount.id) {
                oldBid.created = punk.currentBidCreated;
                oldBid.open = false;
                entityCache.saveOffer(oldBid);
            }
        }

        updateAccountHoldings(toAccount, fromAccount);
        toAccount.numberOfTransfers = toAccount.numberOfTransfers + 1n;
        fromAccount.numberOfTransfers = fromAccount.numberOfTransfers + 1n;

        //Capture punk transfers and owners if not transferred to WRAPPED PUNK ADDRESS
        punk.owner = toAccount;

        //Write
        entityCache.saveEvent(transfer);
        entityCache.saveAccount(toAccount);
        entityCache.saveAccount(fromAccount);
        entityCache.savePunk(punk);

    } else if (fromProxy && sender == fromProxy.id && receiver === WRAPPEDPUNKS_CONTRACT_ADDRESS) {
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
    console.log(`Transfer Event ${value}`);
    /**
     @summary cToken as helper entity
      e.g: https://etherscan.io/tx/0x23d6e24628dabf4fa92fa93630e5fa6f679fac75071aab38d7e307a3c0f4a3ca#eventlog
     */
    if (to === ZERO_ADDRESS) return;

    let fromAccount = await entityCache.getOrCreateAccount(from);
    let toAccount = await entityCache.getOrCreateAccount(to);
    let cToken = await entityCache.getOrCreateCToken(logEvent);

    cToken.from = fromAccount;
    cToken.to = toAccount;
    cToken.owner = to;
    cToken.amount = value;

    //Write
    entityCache.saveCToken(cToken);
    entityCache.saveAccount(toAccount);
    entityCache.saveAccount(fromAccount);
}