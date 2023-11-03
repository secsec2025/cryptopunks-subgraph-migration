import {DataHandlerContext} from "@subsquid/evm-processor";
import {Store} from "@subsquid/typeorm-store";
import {MetaData} from "../model";
import {Contract} from '../abi/CryptoPunksData';
import {CRYPTOPUNKS_DATA_CONTRACT_ADDRESS} from "../constants";

async function getPunksWithoutMetadata(ctx: DataHandlerContext<Store, {}>): Promise<MetaData[]> {
    return await ctx.store.find(MetaData, {
        where: [
            {image: ''},
            {svg: ''}
        ]
    });
}

async function getMetaDataForAPunk(punkIndex: number, ctx: any): Promise<{ image: string, svg: string } | undefined> {
    const contract = new Contract(ctx, {height: 18482610}, CRYPTOPUNKS_DATA_CONTRACT_ADDRESS);

    try {
        const image = await contract.punkImage(punkIndex);
        const svg = await contract.punkImageSvg(punkIndex);
        return { image, svg };
    } catch (e) {
        console.log(`Contract call failed while fetching metadata for punk ID ${punkIndex}`);
        return undefined;
    }
}


/*async function getPunkImages(ctx: any, metaDataList: MetaData[]) {
    const lastBlock = ctx.blocks[ctx.blocks.length - 1].header;

    const multiCall = new Multicall(ctx, {height: 18482610}, '0x5ba1e12693dc8f9c48aad8770482f4739beed696');
    const args = metaDataList.map(md => parseInt(md.punkId));

    // const results = await multiCall.tryAggregate(functions.punkImage, args.map(a => [CRYPTOPUNKS_DATA_CONTRACT_ADDRESS, a]) as any[], 100);
    const results = await multiCall.tryAggregate(functions.punkImage, CRYPTOPUNKS_DATA_CONTRACT_ADDRESS, args.map(a => [a]) as any[], 100);

    results.forEach((res, index) => {
        if (res.success) {
            metaDataList[index].image = res.value;
        }
    });

    return metaDataList;
}*/


/*async function getPunkImageSVGs(ctx: any, metaDataList: MetaData[]) {
    const lastBlock = ctx.blocks[ctx.blocks.length - 1].header;

    const multiCall = new Multicall(ctx, lastBlock, '0x5ba1e12693dc8f9c48aad8770482f4739beed696');
    const args = metaDataList.map(md => Number(md.tokenId));

    // const results = await multiCall.tryAggregate(functions.punkImage, args.map(a => [CRYPTOPUNKS_DATA_CONTRACT_ADDRESS, a]) as [], 100);
    const results = await multiCall.tryAggregate(functions.punkImageSvg, CRYPTOPUNKS_DATA_CONTRACT_ADDRESS, args.map(a => [a]), 100);

    results.forEach((res, index) => {
        if (res.success) {
            metaDataList[index].svg = res.value;
        }
    });

    return metaDataList;
}*/


export async function fetchPunkMetadataFromContract(ctx: DataHandlerContext<Store, {}>) {
    let metaDataList: MetaData[] = await getPunksWithoutMetadata(ctx);
    console.log(`Fetching metadata for ${metaDataList.length} punks`);

    for (let i = 0; i < metaDataList.length; i++) {
        const m = metaDataList[i];
        const res = await getMetaDataForAPunk(parseInt(m.punkId), ctx);
        if (!res) break;
        m.image = res.image;
        m.svg = res.svg;
    }

    await ctx.store.upsert(metaDataList);
}
