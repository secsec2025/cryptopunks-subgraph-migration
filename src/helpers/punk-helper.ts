import {Account, Punk} from "../model";
import {calculateAverage} from "../utils";

export function createPunk(tokenId: bigint, owner: Account): Punk {
    return new Punk({
        id: tokenId.toString(),
        tokenId: tokenId,
        wrapped: false,
        ownerId: owner.id,
        numberOfTransfers: 0n,
        numberOfSales: 0n,
        totalAmountSpentOnPunk: 0n,
        averageSalePrice: 0n
    });
}


export function updatePunkSaleAggregates(punk: Punk, price: bigint): void {
    //Update punk aggregates
    punk.totalAmountSpentOnPunk = punk.totalAmountSpentOnPunk + price;
    punk.numberOfSales = punk.numberOfSales + 1n;

    //We only calculate average sale price if there are more than 0 sales, so we don't divide by 0
    if (punk.numberOfSales !== 0n) {
        punk.averageSalePrice = calculateAverage(punk.totalAmountSpentOnPunk, punk.numberOfSales);
    }
}


export function updatePunkOwner(punk: Punk, toAccount: string): void {
    //Update Punk entity
    punk.purchasedById = toAccount;
    punk.ownerId = toAccount;
}
