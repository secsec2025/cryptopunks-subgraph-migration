import {getContractAddress, getMakerAddress, getPriceAfterRaribleCut} from "../utils";
import {EntityCache} from "../entity-cache";
import {WRAPPEDPUNKS_CONTRACT_ADDRESS} from "../constants";
import {updateSale} from "../helpers/sale-helper";
import {updateContractAggregates} from "../helpers/contract-helper";
import {updateAccountAggregates} from "../helpers/accounts-helper";
import {updatePunkSaleAggregates} from "../helpers/punk-helper";

export async function handleExchangeV1Buy(owner: string, buyerParams: string, price: bigint, buyTokenId: bigint, sellTokenId: bigint, logEvent: any, entityCache: EntityCache): Promise<void> {
    // console.log(`handleExchangeV1Buy Rarible ${buyTokenId}`);
    /**
     @summary RaribleExchangeV1 Contract - Track WRAPPEDPUNK SALE
     @description
     ROOT ISSUE:  Punk 509 was sold while wrapped.
     - Account: https://cryptopunks.app/cryptopunks/accountinfo?account=0x0eb9a7ff5cbf719251989caf1599c1270eafb531
     - We want to capture this so we can calculate average prices & update other aggregates both for punk & account
     - We filter out wrappedPunk transactions by ensuring
     - both events occur in the same transaction.
     - the wrappedPunk contract address emitted it.
     */

    let wrappedPunkContractAddress = await getContractAddress(logEvent, entityCache);
    if (wrappedPunkContractAddress && wrappedPunkContractAddress === WRAPPEDPUNKS_CONTRACT_ADDRESS) {
        let trueBuyer = await getMakerAddress(logEvent, entityCache);
        if (trueBuyer && trueBuyer === owner) {
            /**
             @summary Logic for validating a bidAccepted sale
             @description
             A wrapped punk bid can be accepted on RaribleExchangeV1.
             - Example: https://etherscan.io/tx/0x26ad41d72737442ef108460bc25a69764b30e3df96344d95f8f3a03a551fd787#eventlog
             - We know this through the buyer address.
             - The major difference between this sale and a regular sale is that
             - the owner address in Ordermatched becomes the buyer --> (toAccount)
             - the seller address becomes the buyer --> (fromAccount)
             - RaribleExchangeV1 takes 2.5% fee on all bids accepted transactions, so we need to remove that to get the actual sale price
             */
            const buyer = owner;
            const seller = buyerParams;
            const tokenId = buyTokenId;

            const bidPrice = getPriceAfterRaribleCut(price);

            let contract = await entityCache.getOrCreateWrappedPunkContract(wrappedPunkContractAddress);
            let fromAccount = await entityCache.getOrCreateAccount(seller);
            let toAccount = await entityCache.getOrCreateAccount(buyer);
            let punk = await entityCache.getPunkByID(tokenId);
            if (!punk) return;
            let sale = await entityCache.getOrCreateSaleEvent(tokenId, seller, logEvent);

            updateSale(sale, bidPrice, buyer);
            updateContractAggregates(contract, bidPrice);
            updateAccountAggregates(fromAccount, toAccount, bidPrice);
            updatePunkSaleAggregates(punk, bidPrice);

            //Write
            entityCache.saveAccount(toAccount);
            entityCache.saveAccount(fromAccount);
            entityCache.saveEvent(sale);
            entityCache.saveContract(contract);
            entityCache.savePunk(punk);

            // console.log(`Saving Rarible Transfer (1) ${tokenId}`);
        } else if (trueBuyer && trueBuyer === buyerParams) {
            /**
             @summary - Logic for Regular Sale
              - Example: https://etherscan.io/tx/0x51583622e0dcfda43c6481ba073eb1bbd6b7f3ef98c28d3564918491344d8ce3#eventlog
             */
            let buyer = buyerParams;
            let seller = owner;
            let tokenId = sellTokenId;

            let contract = await entityCache.getOrCreateWrappedPunkContract(wrappedPunkContractAddress);
            let fromAccount = await entityCache.getOrCreateAccount(seller);
            let toAccount = await entityCache.getOrCreateAccount(buyer);
            let punk = await entityCache.getPunkByID(tokenId);
            if (!punk) return;
            let sale = await entityCache.getOrCreateSaleEvent(tokenId, seller, logEvent);

            updateSale(sale, price, buyer)
            updateContractAggregates(contract, price)
            updateAccountAggregates(fromAccount, toAccount, price)
            updatePunkSaleAggregates(punk, price)

            //Write
            entityCache.saveAccount(toAccount);
            entityCache.saveAccount(fromAccount);
            entityCache.saveEvent(sale);
            entityCache.saveContract(contract);
            entityCache.savePunk(punk);

            // console.log(`Saving Rarible Transfer (2) ${tokenId}`);
        }
    }
}
