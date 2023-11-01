import {Event, EventType} from "../model";
import {getGlobalId} from "../utils";
import {CRYPTOPUNKS_CONTRACT_ADDRESS} from "../constants";

export function createBidCreatedEvent(punkIndex: bigint, fromAddress: string, logEvent: any): Event {
    return new Event({
        id: getGlobalId(logEvent),
        type: EventType.BID_CREATED,
        nftId: punkIndex.toString(),
        fromId: fromAddress,
        logNumber: BigInt(logEvent.logIndex),
        timestamp: BigInt(logEvent.block.timestamp),
        blockNumber: BigInt(logEvent.block.height),
        txHash: new Uint8Array(Buffer.from(logEvent.transactionHash, 'utf8')),
        blockHash: new Uint8Array(Buffer.from(logEvent.block.hash, 'utf8')),
        contractId: CRYPTOPUNKS_CONTRACT_ADDRESS
    });
}
