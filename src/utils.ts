export function getGlobalId(event: any): string {
    return event.transactionHash
        .concat('-')
        .concat(event.logIndex.toString());
}