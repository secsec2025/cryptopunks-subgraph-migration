import {Account} from "../model";

export function updateAccountHoldings(toAccount: Account, fromAccount: Account): void {
    //Update toAccount holdings
    toAccount.numberOfPunksOwned = toAccount.numberOfPunksOwned + 1n;

    //Update fromAccount holdings
    fromAccount.numberOfPunksOwned = fromAccount.numberOfPunksOwned - 1n;
}