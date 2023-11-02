import {TypeormDatabase} from '@subsquid/typeorm-store';
import {processor} from './processor';
import {EntityCache} from "./entity-cache";

import {
    CRYPTOPUNKS_CONTRACT_ADDRESS, WRAPPEDPUNKS_CONTRACT_ADDRESS, ERC721SALE_CONTRACT_ADDRESS,
    RARIBLE_V1_CONTRACT_ADDRESS, OPENSEA_CONTRACT_ADDRESS, ZERO_ADDRESS
} from './constants';

import {events as cryptoPunksEvents } from './abi/cryptopunks';
import {events as wrappedPunksEvents } from './abi/wrappedpunks';
import {events as erc721SaleEvents } from './abi/ERC721Sale';
import {events as raribleV1Events } from './abi/RaribleExchangeV1';
import {events as openSeaEvents } from './abi/Opensea';

import {
    handleAssign, handleProxyRegistered,
    handlePunkBidEntered,
    handlePunkBidWithdrawn, handlePunkBought, handlePunkNoLongerForSale,
    handlePunkOffered,
    handlePunkTransfer,
    handleTransfer, handleWrappedPunkTransfer
} from './mapping';
import {handleBuy} from "./marketplaces/ERC721Sale";
import {handleExchangeV1Buy} from "./marketplaces/RaribleExchangeV1";
import {handleOpenSeaSale} from "./marketplaces/OpenSea";
import {fetchPunkMetadataFromContract} from "./helpers/metadata-helper";

processor.run(new TypeormDatabase({supportHotBlocks: true}), async (ctx) => {
    console.log(`Batch Size - ${ctx.blocks.length} blocks`);

    const entityCache: EntityCache = new EntityCache(ctx);

    // Initial Run to save the Punks using ASSIGN
    for (const c of ctx.blocks) {
        for (const e of c.logs) {
            // handleAssign
            if (e.address.toLowerCase() === CRYPTOPUNKS_CONTRACT_ADDRESS && e.topics[0] === cryptoPunksEvents.Assign.topic) {
                const {punkIndex, to} = cryptoPunksEvents.Assign.decode(e);
                await handleAssign(punkIndex, to.toLowerCase(), CRYPTOPUNKS_CONTRACT_ADDRESS, e, entityCache);
            }
        }
    }

    // Save created punks before going further
    await entityCache.persistCacheToDatabase(false, true);


    for (const c of ctx.blocks) {
        for (const e of c.logs) {
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

            // handlePunkOffered
            if (e.address.toLowerCase() === CRYPTOPUNKS_CONTRACT_ADDRESS && e.topics[0] === cryptoPunksEvents.PunkOffered.topic) {
                const {punkIndex, minValue, toAddress} = cryptoPunksEvents.PunkOffered.decode(e);
                await handlePunkOffered(punkIndex, minValue, toAddress.toLowerCase(), e, entityCache);
            }

            // handlePunkBidEntered
            if (e.address.toLowerCase() === CRYPTOPUNKS_CONTRACT_ADDRESS && e.topics[0] === cryptoPunksEvents.PunkBidEntered.topic) {
                const {punkIndex, fromAddress, value} = cryptoPunksEvents.PunkBidEntered.decode(e);
                await handlePunkBidEntered(punkIndex, fromAddress.toLowerCase(), value, e, entityCache);
            }

            // handlePunkBidWithdrawn
            if (e.address.toLowerCase() === CRYPTOPUNKS_CONTRACT_ADDRESS && e.topics[0] === cryptoPunksEvents.PunkBidWithdrawn.topic) {
                const {punkIndex, fromAddress, value} = cryptoPunksEvents.PunkBidWithdrawn.decode(e);
                await handlePunkBidWithdrawn(punkIndex, fromAddress.toLowerCase(), value, e, entityCache);
            }

            // handlePunkBought
            if (e.address.toLowerCase() === CRYPTOPUNKS_CONTRACT_ADDRESS && e.topics[0] === cryptoPunksEvents.PunkBought.topic) {
                const {punkIndex, value, fromAddress, toAddress} = cryptoPunksEvents.PunkBought.decode(e);
                await handlePunkBought(punkIndex, value, fromAddress.toLowerCase(), toAddress.toLowerCase(), e, entityCache);
            }

            // handlePunkNoLongerForSale
            if (e.address.toLowerCase() === CRYPTOPUNKS_CONTRACT_ADDRESS && e.topics[0] === cryptoPunksEvents.PunkNoLongerForSale.topic) {
                const {punkIndex} = cryptoPunksEvents.PunkNoLongerForSale.decode(e);
                await handlePunkNoLongerForSale(punkIndex, e, entityCache);
            }

            // handleWrappedPunkTransfer
            if (e.address.toLowerCase() === WRAPPEDPUNKS_CONTRACT_ADDRESS && e.topics[0] === wrappedPunksEvents.Transfer.topic) {
                const {from, to, tokenId} = wrappedPunksEvents.Transfer.decode(e);
                await handleWrappedPunkTransfer(tokenId, from.toLowerCase(), to.toLowerCase(), e, entityCache);
            }

            // handleProxyRegistered
            if (e.address.toLowerCase() === WRAPPEDPUNKS_CONTRACT_ADDRESS && e.topics[0] === wrappedPunksEvents.ProxyRegistered.topic) {
                const {user, proxy} = wrappedPunksEvents.ProxyRegistered.decode(e);
                await handleProxyRegistered(user.toLowerCase(), proxy.toLowerCase(), e, entityCache);
            }

            // handleBuy
            if (e.address.toLowerCase() === ERC721SALE_CONTRACT_ADDRESS && e.topics[0] === erc721SaleEvents.Buy.topic) {
                const { tokenId, seller, buyer, price} = erc721SaleEvents.Buy.decode(e);
                await handleBuy(tokenId, buyer.toLowerCase(), seller.toLowerCase(), price, e, entityCache);
            }

            // handleExchangeV1Buy
            if (e.address.toLowerCase() === RARIBLE_V1_CONTRACT_ADDRESS && e.topics[0] === raribleV1Events.Buy.topic) {
                const {owner, buyValue, buyer, buyTokenId, sellTokenId} = raribleV1Events.Buy.decode(e);
                await handleExchangeV1Buy(owner.toLowerCase(), buyer.toLowerCase(), buyValue, buyTokenId, sellTokenId, e, entityCache);
            }

            // handleOpenSeaSale
            if (e.address.toLowerCase() === OPENSEA_CONTRACT_ADDRESS && e.topics[0] === openSeaEvents.OrdersMatched.topic) {
                const {taker, maker, price} = openSeaEvents.OrdersMatched.decode(e);
                await handleOpenSeaSale(taker.toLowerCase(), maker.toLowerCase(), price, e, entityCache);
            }

        }
    }

    await entityCache.persistCacheToDatabase(false);


    // Fetch CryptoPunk Metadata after finalizing the block processing
    if (ctx.isHead) {
        await fetchPunkMetadataFromContract(ctx);
    }

})
