import {EntityCache} from "./entity-cache";

export function getGlobalId(event: any, relativeLogIndex?: number): string {
    if (!relativeLogIndex) relativeLogIndex = 0;
    return event.transactionHash
        .concat('-')
        .concat((event.logIndex + relativeLogIndex).toString());
}

/**
 @description This function calculates the average given two values
 @param totalAmount
 @param qty
 @returns Returns the average in `BigInt`
 */
export function calculateAverage(totalAmount: bigint, qty: bigint): bigint {
    return totalAmount / qty;
}

export async function getContractAddress(logEvent: any, entityCache: EntityCache): Promise<string | null> {
    //The transfer always come first, so we need to provide the correct logIndex for cToken
    const cTokenLogIndex = logEvent.logIndex - 1;
    const id = logEvent.transactionHash.concat('-').concat(cTokenLogIndex.toString());

    /**
     * We only care about transactions concerning WrappedPunk contract
     * cToken should exist with the given ID.
     */
    let cToken = await entityCache.getCToken(id);
    // if it doesn't then it's not a WrappedPunk transaction
    if (!cToken) {
        return null;
    }

    // if it does, then return the contract Address to enable us validate the transaction in handleBuy()
    return cToken.referenceId
}

