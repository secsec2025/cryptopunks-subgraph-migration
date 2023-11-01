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

