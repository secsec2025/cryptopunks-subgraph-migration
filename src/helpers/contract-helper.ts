import { Contract } from '../abi/cryptopunks';


export const getCryptoPunksContractDetails = async (address: string, context: any): Promise<{
    symbol: string,
    name: string,
    imageHash: string,
    totalSupply: bigint
}> => {
    const lastBlock = context.blocks[context.blocks.length - 1];

    const contract: Contract = new Contract(context, lastBlock, address);

    try {
        const symbol = await contract.symbol();
        const name = await contract.name();
        const imageHash = await contract.imageHash();
        const totalSupply = await contract.totalSupply();
        return {symbol, name, imageHash, totalSupply};
    } catch (e) {
        console.log(`Unable to get details from the contract ${address}`);
        return {
            symbol: 'UNKNOWN',
            name: 'Unknown',
            imageHash: '-',
            totalSupply: 0n
        };
    }


}