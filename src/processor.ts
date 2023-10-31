import {EvmBatchProcessor} from '@subsquid/evm-processor';
import {lookupArchive} from '@subsquid/archive-registry';

import {events as cryptoPunksEvents } from './abi/cryptopunks';
import {events as wrappedPunksEvents } from './abi/wrappedpunks';
import {events as erc721SaleEvents } from './abi/ERC721Sale';
import {events as raribleV1Events } from './abi/RaribleExchangeV1';
import {events as openSeaEvents } from './abi/Opensea';

import {CRYPTOPUNKS_CONTRACT_ADDRESS, WRAPPEDPUNKS_CONTRACT_ADDRESS, ERC721SALE_CONTRACT_ADDRESS,
    RARIBLE_V1_CONTRACT_ADDRESS, OPENSEA_CONTRACT_ADDRESS} from './constants';

export const processor = new EvmBatchProcessor()
    .setDataSource({
        archive: lookupArchive('eth-mainnet'),
        chain: 'https://rpc.ankr.com/eth',
    })
    .setFinalityConfirmation(75)
    .addLog({
        address: [CRYPTOPUNKS_CONTRACT_ADDRESS],
        topic0: [
            cryptoPunksEvents.Assign.topic,
            cryptoPunksEvents.PunkTransfer.topic,
            cryptoPunksEvents.Transfer.topic,
            cryptoPunksEvents.PunkOffered.topic,
            cryptoPunksEvents.PunkBidEntered.topic,
            cryptoPunksEvents.PunkBidWithdrawn.topic,
            cryptoPunksEvents.PunkBought.topic,
            cryptoPunksEvents.PunkNoLongerForSale.topic
        ],
        range: { from: 3914494 }
    })
    .addLog({
        address: [WRAPPEDPUNKS_CONTRACT_ADDRESS],
        topic0: [
            wrappedPunksEvents.Transfer.topic,
            wrappedPunksEvents.ProxyRegistered.topic
        ],
        range: { from: 10821736 }
    })
    .addLog({
        address: [ERC721SALE_CONTRACT_ADDRESS],
        topic0: [
            erc721SaleEvents.Buy.topic
        ],
        range: { from: 10786971 }
    })
    .addLog({
        address: [RARIBLE_V1_CONTRACT_ADDRESS],
        topic0: [
            raribleV1Events.Buy.topic
        ],
        range: { from: 11274515 }
    })
    .addLog({
        address: [OPENSEA_CONTRACT_ADDRESS],
        topic0: [
            openSeaEvents.OrdersMatched.topic
        ],
        range: { from: 5774644 }
    }).setFields({
        log: {
            address: true,
            topics: true,
            data: true,
            transactionHash: true
        }
    });
