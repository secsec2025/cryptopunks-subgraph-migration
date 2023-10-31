import {Account, Punk} from "../model";

export function createPunk(tokenId: bigint, owner: Account): Punk {
    return new Punk({
        id: tokenId.toString(),
        tokenId: tokenId,
        wrapped: false,
        owner: owner,
        numberOfTransfers: 0n,
        numberOfSales: 0n,
        totalAmountSpentOnPunk: 0n,
        averageSalePrice: 0n
    });
}