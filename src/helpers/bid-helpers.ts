import {Event, EventType, OfferType, Punk} from "../model";
import {getGlobalId} from "../utils";
import {CRYPTOPUNKS_CONTRACT_ADDRESS} from "../constants";
import {EntityCache} from "../entity-cache";

export function createBidCreatedEvent(punkIndex: bigint, fromAddress: string, logEvent: any): Event {
    return new Event({
        id: getGlobalId(logEvent).concat('-BID_CREATED'),
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


export function createBidRemovedEvent(punkIndex: bigint, fromAddress: string, logEvent: any): Event {
    return new Event({
        id: getGlobalId(logEvent).concat('-BID_REMOVED'),
        type: EventType.BID_REMOVED,
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


export async function closeOldBid(punk: Punk, toAccount: string, entityCache: EntityCache): Promise<void> {
    const oldBidId = punk.currentBidId;

    if (oldBidId) {
        const oldBid = await entityCache.getOffer(oldBidId);
        if (oldBid && oldBid.offerType === OfferType.BID && oldBid.fromId === toAccount) {
            oldBid.createdId = punk.currentBidCreatedId;
            oldBid.open = false;
            entityCache.saveOffer(oldBid);
        }
    }
}


