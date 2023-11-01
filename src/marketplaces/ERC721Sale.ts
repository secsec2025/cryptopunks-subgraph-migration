import {EntityCache} from "../entity-cache";
import {getContractAddress} from "../utils";
import {WRAPPEDPUNKS_CONTRACT_ADDRESS} from "../constants";
import {updateSale} from "../helpers/sale-helper";
import {closeOldBid} from "../helpers/bid-helpers";
import {updateAccountAggregates} from "../helpers/accounts-helper";
import {updateContractAggregates} from "../helpers/contract-helper";
import {updatePunkSaleAggregates} from "../helpers/punk-helper";

export async function handleBuy(tokenID: bigint, buyer: string, seller: string, price: bigint, logEvent: any, entityCache: EntityCache) {
    /**
     @summary ERC721Sale Contract - Track WRAPPEDPUNK SALE
     @description
     ROOT ISSUE:  Punk 4216 was sold while wrapped.
     Account: https://cryptopunks.app/cryptopunks/accountinfo?account=0x0c8e854729144ab6405939819f461764647f52ed
     Example: https://etherscan.io/tx/0xae3fc4123415e985850f9d41dc162a84c0b6a976ead1deedecf0c2bad66685e2#eventlog
     - We want to capture this, so we can calculate average prices & update other aggregates both for punk & account

     - We filter out wrappedPunk transactions by ensuring
     - both events occur in the same transaction
     - the wrappedPunk contract address emitted it
     */

    let wrappedPunkContractAddress = await getContractAddress(logEvent, entityCache);
    if (wrappedPunkContractAddress && wrappedPunkContractAddress === WRAPPEDPUNKS_CONTRACT_ADDRESS) {
        const contract = await entityCache.getOrCreateWrappedPunkContract(wrappedPunkContractAddress);
        let fromAccount = await entityCache.getOrCreateAccount(seller);
        let toAccount = await entityCache.getOrCreateAccount(buyer);
        let punk = await entityCache.getPunkByID(tokenID);
        if (!punk) return;
        let sale = await entityCache.getOrCreateSaleEvent(tokenID, seller, logEvent);

        updateSale(sale, price, buyer);
        await closeOldBid(punk, toAccount.id, entityCache);
        updateAccountAggregates(fromAccount, toAccount, price)
        updateContractAggregates(contract, price)
        updatePunkSaleAggregates(punk, price)

        entityCache.saveAccount(toAccount);
        entityCache.saveAccount(fromAccount);
        entityCache.saveEvent(sale);
        entityCache.savePunk(punk);
        entityCache.saveContract(contract);
    }
}