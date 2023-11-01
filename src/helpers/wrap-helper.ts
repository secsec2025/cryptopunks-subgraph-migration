import {Event, EventType} from "../model";
import {getGlobalId} from "../utils";
import {WRAPPEDPUNKS_CONTRACT_ADDRESS} from "../constants";

export function createWrap(fromAccount: string, tokenID: bigint, logEvent: any): Event {
    return new Event({
        id: getGlobalId(logEvent),
        type: EventType.WRAP,
        nftId: tokenID.toString(),
        fromId: fromAccount,
        logNumber: BigInt(logEvent.logIndex),
        timestamp: BigInt(logEvent.block.timestamp),
        blockNumber: BigInt(logEvent.block.height),
        txHash: new Uint8Array(Buffer.from(logEvent.transactionHash, 'utf8')),
        blockHash: new Uint8Array(Buffer.from(logEvent.block.hash, 'utf8')),
        contractId: WRAPPEDPUNKS_CONTRACT_ADDRESS
    });
}

export function createUnwrap(fromAccount: string, toAccount: string, tokenID: bigint, logEvent: any): Event {
    return new Event({
        id: getGlobalId(logEvent),
        type: EventType.UNWRAP,
        nftId: tokenID.toString(),
        fromId: fromAccount,
        toId: toAccount,
        logNumber: BigInt(logEvent.logIndex),
        timestamp: BigInt(logEvent.block.timestamp),
        blockNumber: BigInt(logEvent.block.height),
        txHash: new Uint8Array(Buffer.from(logEvent.transactionHash, 'utf8')),
        blockHash: new Uint8Array(Buffer.from(logEvent.block.hash, 'utf8')),
        contractId: WRAPPEDPUNKS_CONTRACT_ADDRESS
    });
}