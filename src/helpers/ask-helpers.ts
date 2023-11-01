import {Account, Event, EventType, OfferType, Punk} from "../model";
import {getGlobalId} from "../utils";
import {CRYPTOPUNKS_CONTRACT_ADDRESS} from "../constants";
import {EntityCache} from "../entity-cache";

export function createAskCreatedEvent(punkIndex: bigint, logEvent: any): Event {
    return new Event({
        id: getGlobalId(logEvent).concat('-ASK_CREATED'),
        type: EventType.ASK_CREATED,
        nftId: punkIndex.toString(),
        logNumber: BigInt(logEvent.logIndex),
        timestamp: BigInt(logEvent.block.timestamp),
        blockNumber: BigInt(logEvent.block.height),
        txHash: new Uint8Array(Buffer.from(logEvent.transactionHash, 'utf8')),
        blockHash: new Uint8Array(Buffer.from(logEvent.block.hash, 'utf8')),
        contractId: CRYPTOPUNKS_CONTRACT_ADDRESS
    });
}

export async function closeOldAsk(punk: Punk, fromAccount: Account, entityCache: EntityCache): Promise<void> {
    let oldAskId = punk.currentAskId;
    if (oldAskId) {
        let oldAsk = await entityCache.getOffer(oldAskId);
        if (!oldAsk) return;
        /**
         Create a relationship between OldAsk and currentAskRemoved to provide information on the Ask that was removed
         current askRemoved can be gotten from the punk which we closed in PunkNoLongerForSale
         */
        oldAsk.removedId = punk.currentAskRemovedId;
        oldAsk.open = false;

        //Summon currentAskCreated from Punk entity to update Old Ask with askCreation information
        oldAsk.createdId = punk.currentAskCreatedId; //we opened the Punk in PunkOffered() and saved the currentAskCreated to a field in the Punk entity

        oldAsk.fromId = fromAccount.id;

        //Write
        entityCache.saveOffer(oldAsk);
    }
}


export function createAskRemovedEvent(punkIndex: bigint, logEvent: any): Event {
    return new Event({
        id: getGlobalId(logEvent).concat('-ASK_REMOVED'),
        type: EventType.ASK_REMOVED,
        nftId: punkIndex.toString(),
        logNumber: BigInt(logEvent.logIndex),
        timestamp: BigInt(logEvent.block.timestamp),
        blockNumber: BigInt(logEvent.block.height),
        txHash: new Uint8Array(Buffer.from(logEvent.transactionHash, 'utf8')),
        blockHash: new Uint8Array(Buffer.from(logEvent.block.hash, 'utf8')),
        contractId: CRYPTOPUNKS_CONTRACT_ADDRESS
    });
}