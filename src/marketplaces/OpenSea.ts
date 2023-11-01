import {EntityCache} from "../entity-cache";
import {getContractAddress, getMakerAddress, getPunkId} from "../utils";
import {WRAPPEDPUNKS_CONTRACT_ADDRESS} from "../constants";
import {updateSale} from "../helpers/sale-helper";
import {updateAccountAggregates} from "../helpers/accounts-helper";
import {updateContractAggregates} from "../helpers/contract-helper";
import {updatePunkSaleAggregates} from "../helpers/punk-helper";

export async function handleOpenSeaSale(taker: string, maker: string, price: bigint, logEvent: any, entityCache: EntityCache): Promise<void> {
    /**
     @summary OpenSea Contract - Track WRAPPEDPUNK sale
     @description:
      ROOT ISSUE:  Punk 7443 was sold on Opensea while wrapped.
      - Account: https://cryptopunks.app/cryptopunks/accountinfo?account=0x0eb9a7ff5cbf719251989caf1599c1270eafb531
      - Example: https://etherscan.io/tx/0xac6acdca9aeb00238ff885dcd4e697afd1cfa8ba75ef69622f786b96f8d164cf#eventlog
      - We want to capture this, so we can calculate average prices & update other aggregates both for punk & account

      - We filter out wrappedPunk transactions by ensuring
      - both events occur in the same transaction
      - the wrappedPunk contract address emitted it
     */
    let wrappedPunkContractAddress = await getContractAddress(logEvent, entityCache);
    if (wrappedPunkContractAddress && wrappedPunkContractAddress === WRAPPEDPUNKS_CONTRACT_ADDRESS) {
        //We get the tokenId from the Transfer event because OrderMatched doesn't emit it.
        let tokenId = await getPunkId(logEvent, entityCache);
        //We need the makerAddress to differentiate a regular sale from a bidAccepted sale
        let makerAddress = await getMakerAddress(logEvent, entityCache);

        //All the operations below wouldn't make sense without the punkId, so we ensure it exists.
        if (tokenId) {
            let punk = await entityCache.getPunkByID(BigInt(tokenId));
            if (!punk) return;
            let contract = await entityCache.getOrCreateWrappedPunkContract(wrappedPunkContractAddress);

            if (makerAddress && makerAddress === taker) {
                //Regular wrappedPunk sale
                let buyer = taker;
                let seller = maker;

                let fromAccount = await entityCache.getOrCreateAccount(seller);
                let toAccount = await entityCache.getOrCreateAccount(buyer);
                let sale = await entityCache.getOrCreateSaleEvent(BigInt(tokenId), seller, logEvent);

                updateSale(sale, price, buyer);
                updateAccountAggregates(fromAccount, toAccount, price);
                updateContractAggregates(contract, price);
                updatePunkSaleAggregates(punk, price);

                entityCache.savePunk(punk);
                entityCache.saveContract(contract);
                entityCache.saveEvent(sale);
                entityCache.saveAccount(toAccount);
                entityCache.saveAccount(fromAccount);

            } else if (makerAddress && makerAddress === maker) {
                /**
                 @summary Logic for validating bidAccepted sale:
                 @description
                 - We want to capture this sale.
                 - The major difference between this sale and a regular sale is that
                 - the maker becomes the buyer --> (toAccount)
                 - the taker becomes the seller --> (fromAccount)
                 - Example:
                 https://etherscan.io/tx/0x0e44a5eb1d553ab2daacf43fd50bcd73f030e739de009368a9f2897150e1215d#eventlog

                 - Getting the maker address from the toAccount in the wrappedPunk Transfer event confirms that
                 this is a bid-accepted sale because the maker is the buyer, but in the OrderMatched event, the maker is the seller.
                 */
                let seller = taker;
                let buyer =maker;

                let sale = await entityCache.getOrCreateSaleEvent(BigInt(tokenId), seller, logEvent);
                let fromAccount = await entityCache.getOrCreateAccount(seller);
                let toAccount = await entityCache.getOrCreateAccount(buyer);

                updateSale(sale, price, buyer);
                updateAccountAggregates(fromAccount, toAccount, price);
                updateContractAggregates(contract, price);
                updatePunkSaleAggregates(punk, price);

                entityCache.savePunk(punk);
                entityCache.saveContract(contract);
                entityCache.saveEvent(sale);
                entityCache.saveAccount(toAccount);
                entityCache.saveAccount(fromAccount);
            }
        }
    }
}

