import {EntityCache} from "./entity-cache";
import {getTrait} from "./subgraph/traits";
import {createPunk} from "./helpers/punk-helper";
import {Trait, TraitType} from "./model";


export async function handleAssign(punkIndex: bigint, to: string, contractAddress: string, logEvent: any, entityCache: EntityCache): Promise<void> {
    console.log(`handleAssign(${punkIndex})`);
    // This event fires when the user claims a Punk

    let trait = getTrait(Number(punkIndex));
    let tokenId = punkIndex;
    let account = await entityCache.getOrCreateAccount(to);
    let metadata = entityCache.createMetadata(tokenId)
    let contract = await entityCache.getOrCreateCryptoPunkContract(contractAddress)

    //Assign is always the first EVENTS that actually creates the punk
    let punk = createPunk(tokenId, account);
    let assign = await entityCache.getOrCreateAssignEvent(contract, account, punk, metadata, logEvent);

    if (trait !== null) {
        let traits = new Array<Trait>();
        let type = await entityCache.getOrCreateTrait(trait.type, TraitType.TYPE);
        type.numberOfNfts = type.numberOfNfts + 1n;
        entityCache.saveTrait(type);
        traits.push(type);

        for (let i = 0; i < trait.accessories.length; i++) {
            let accessoryName = trait.accessories[i];
            let acessoryId = accessoryName.split(' ').join('-');
            let accessory = await entityCache.getOrCreateTrait(acessoryId, TraitType.ACCESSORY);
            accessory.numberOfNfts = accessory.numberOfNfts + 1n;
            entityCache.saveTrait(accessory);
            traits.push(accessory);
        }

        entityCache.mapMetaDataWithTraits(metadata, traits);
    }

    //Update account punk holdings
    account.numberOfPunksOwned = account.numberOfPunksOwned + 1n;
    account.numberOfPunksAssigned = account.numberOfPunksAssigned + 1n;

    //Write
    entityCache.saveAccount(account);
    entityCache.saveEvent(assign);
    entityCache.saveContract(contract);
    entityCache.saveMetaData(metadata);
    entityCache.savePunk(punk);
}