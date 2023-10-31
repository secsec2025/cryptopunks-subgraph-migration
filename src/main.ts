import {TypeormDatabase} from '@subsquid/typeorm-store';
import {processor} from './processor';
import {EntityCache} from "./entity-cache";

import {CRYPTOPUNKS_CONTRACT_ADDRESS, WRAPPEDPUNKS_CONTRACT_ADDRESS, ERC721SALE_CONTRACT_ADDRESS,
    RARIBLE_V1_CONTRACT_ADDRESS, OPENSEA_CONTRACT_ADDRESS} from './constants';

import {events as cryptoPunksEvents } from './abi/cryptopunks';
import {events as wrappedPunksEvents } from './abi/wrappedpunks';
import {events as erc721SaleEvents } from './abi/ERC721Sale';
import {events as raribleV1Events } from './abi/RaribleExchangeV1';
import {events as openSeaEvents } from './abi/Opensea';

import {handleAssign, handlePunkTransfer, handleTransfer} from './mapping';

processor.run(new TypeormDatabase({supportHotBlocks: true}), async (ctx) => {
    console.log(`Batch Size - ${ctx.blocks.length} blocks`);

    const entityCache: EntityCache = new EntityCache(ctx);

    for (const c of ctx.blocks) {
        for (const e of c.logs) {
            // handleAssign
            if (e.address.toLowerCase() === CRYPTOPUNKS_CONTRACT_ADDRESS && e.topics[0] === cryptoPunksEvents.Assign.topic) {
                const {punkIndex, to} = cryptoPunksEvents.Assign.decode(e);
                await handleAssign(punkIndex, to.toLowerCase(), CRYPTOPUNKS_CONTRACT_ADDRESS, e, entityCache);
            }

            // handlePunkTransfer
            if (e.address.toLowerCase() === CRYPTOPUNKS_CONTRACT_ADDRESS && e.topics[0] === cryptoPunksEvents.PunkTransfer.topic) {
                const {punkIndex, from, to} = cryptoPunksEvents.PunkTransfer.decode(e);
                await handlePunkTransfer(from.toLowerCase(), to.toLowerCase(), punkIndex, e, entityCache);
            }

            // handleTransfer
            if (e.address.toLowerCase() === CRYPTOPUNKS_CONTRACT_ADDRESS && e.topics[0] === cryptoPunksEvents.Transfer.topic) {
                const {from, to, value} = cryptoPunksEvents.Transfer.decode(e);
                await handleTransfer(from.toLowerCase(), to.toLowerCase(), value, e, entityCache);
            }

        }
    }

    await entityCache.persistCacheToDatabase(false);
})
