import { Contract as CryptoPunksContract } from '../abi/cryptopunks';
import { Contract as WrappedPunksContract } from '../abi/wrappedpunks';
import {Contract as ContractEntity} from '../model';


export const getCryptoPunksContractDetails = async (address: string, context: any): Promise<{
    symbol: string,
    name: string,
    imageHash: string,
    totalSupply: bigint
}> => {
    const contract: CryptoPunksContract
        = new CryptoPunksContract(context, context.blocks[context.blocks.length - 1].header, address);

    try {
        const symbol = await contract.symbol();
        const name = await contract.name();
        const imageHash = await contract.imageHash();
        const totalSupply = await contract.totalSupply();
        return {symbol, name, imageHash, totalSupply};
    } catch (e) {
        console.log(e);
        console.log(`Unable to get details from the contract ${address}`);
        return {
            symbol: 'UNKNOWN',
            name: 'Unknown',
            imageHash: '-',
            totalSupply: 0n
        };
    }

}


export const getWrappedCryptoPunksContractDetails = async (address: string, context: any): Promise<{
    symbol: string,
    name: string,
    totalSupply: bigint
}> => {
    const contract: WrappedPunksContract
        = new WrappedPunksContract(context, context.blocks[context.blocks.length - 1].header, address);

    try {
        const symbol = await contract.symbol();
        const name = await contract.name();
        const totalSupply = await contract.totalSupply();
        return {symbol, name, totalSupply};
    } catch (e) {
        console.log(`Unable to get details from the contract ${address}`);
        return {
            symbol: 'UNKNOWN',
            name: 'Unknown',
            totalSupply: 0n
        };
    }

}


export function updateContractAggregates(contract: ContractEntity, price: bigint): void {
    //Update contract aggregates
    contract.totalSales = contract.totalSales + 1n;
    contract.totalAmountTraded = contract.totalAmountTraded + price;
}