import {Account} from "../model";
import {calculateAverage} from "../utils";

export function updateAccountHoldings(toAccount: Account, fromAccount: Account): void {
    //Update toAccount holdings
    toAccount.numberOfPunksOwned = toAccount.numberOfPunksOwned + 1n;

    //Update fromAccount holdings
    fromAccount.numberOfPunksOwned = fromAccount.numberOfPunksOwned - 1n;
}


export function updateAccountAggregates(fromAccount: Account, toAccount: Account, price: bigint): void {
    //Update fromAccount aggregates
    fromAccount.numberOfSales = fromAccount.numberOfSales + 1n;
    fromAccount.totalEarned = fromAccount.totalEarned + price;

    //Update toAccount aggregates
    toAccount.totalSpent = toAccount.totalSpent + price;
    toAccount.numberOfPurchases = toAccount.numberOfPurchases + 1n;

    //We only calculate average amount spent if there are more than 0 purchases, so we don't divide by 0
    if (toAccount.numberOfPurchases !== 0n) {
        toAccount.averageAmountSpent = calculateAverage(toAccount.totalSpent, toAccount.numberOfPurchases)
    }
}