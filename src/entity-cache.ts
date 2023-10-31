import {Account, Contract, Event, EventType, MetaData, MetaDataTrait, Punk, Trait, TraitType} from './model';
import {Store} from "@subsquid/typeorm-store";
import {CONTRACT_URI, TOKEN_URI} from "./constants";
import {getCryptoPunksContractDetails} from "./helpers/contract-helper";
import {DataHandlerContext} from "@subsquid/evm-processor";
import {getGlobalId} from "./utils";

export class EntityCache {

    public accounts: Map<string, Account>;
    public contracts: Map<string, Contract>;
    public metadata: Map<string, MetaData>;
    public eventEntities: Map<string, Event>;
    public traits: Map<string, Trait>;
    public punks: Map<string, Punk>;

    public metaDataTraits: MetaDataTrait[];

    public ctx: DataHandlerContext<Store, {}>;

    constructor(ctx: DataHandlerContext<Store, {}>) {
        this.ctx = ctx;

        this.accounts = new Map<string, Account>();
        this.metadata = new Map<string, MetaData>();
        this.contracts = new Map<string, Contract>();
        this.eventEntities = new Map<string, Event>();
        this.traits = new Map<string, Trait>();
        this.punks = new Map<string, Punk>();

        this.metaDataTraits = [];
    }


    private getAccount = async (address: string): Promise<Account | undefined> => {
        // Check if entity exists in cache
        if (this.accounts.has(address)) return this.accounts.get(address);

        // Check if exists in DB and save it to cache
        const a = await this.ctx.store.get(Account, address);
        if (a) this.accounts.set(address, a);
        return a;
    }

    getOrCreateAccount = async (address: string): Promise<Account> => {
        let a = await this.getAccount(address);
        const url = 'https://cryptopunks.app/cryptopunks/accountinfo?account=';

        if (!a) {
            a = new Account({
                id: address,
                numberOfPunksOwned: 0n,
                numberOfSales: 0n,
                totalEarned: 0n,
                numberOfTransfers: 0n,
                numberOfPunksAssigned: 0n,
                numberOfPurchases: 0n,
                totalSpent: 0n,
                averageAmountSpent: 0n,
                accountUrl: url.concat(address)
            });
            this.accounts.set(address, a);
        }

        return a;
    }

    saveAccount = (account: Account) => {
        this.accounts.set(account.id, account);
    }

    createMetadata = (punkId: bigint): MetaData => {
        const metadata = new MetaData({
            id: punkId.toString(),
            tokenURI: TOKEN_URI.concat(punkId.toString()),
            contractURI: CONTRACT_URI,
            tokenId: punkId,
            punkId: punkId.toString()
        });

        this.metadata.set(punkId.toString(), metadata);
        return metadata;
    }

    saveMetaData = (m: MetaData) => {
        this.metadata.set(m.id, m);
    }


    getOrCreateCryptoPunkContract = async (address: string): Promise<Contract> => {
        let contract;
        if (this.contracts.has(address))
            contract = this.contracts.get(address);
        else {
            contract = await this.ctx.store.get(Contract, address);
            if (contract) this.contracts.set(address, contract);
        }

        if (!contract) {
            contract = new Contract({
                id: address,
                totalAmountTraded: 0n,
                totalSales: 0n
            });
            const {name, symbol, imageHash, totalSupply}
                = await getCryptoPunksContractDetails(address, this.ctx);

            contract.name = name;
            contract.symbol = symbol;
            contract.imageHash = imageHash;
            contract.totalSupply = totalSupply;

            this.contracts.set(address, contract);
        }

        return contract;
    }

    saveContract = (c: Contract) => {
        this.contracts.set(c.id, c);
    }


    private getEvent = async (eventID: string): Promise<Event | undefined> => {
        // Check if entity exists in cache
        if (this.eventEntities.has(eventID)) return this.eventEntities.get(eventID);

        // Check if exists in DB and save it to cache
        const ev = await this.ctx.store.get(Event, eventID);
        if (ev) this.eventEntities.set(eventID, ev);
        return ev;
    }

    getOrCreateAssignEvent = async (contract: Contract, toAccount: Account, punk: Punk, metadata: MetaData, logEvent: any): Promise<Event> => {
        const eventID: string = getGlobalId(logEvent);
        let assignEvent = await this.getEvent(eventID);

        if (!assignEvent) {
            assignEvent = new Event({
                id: eventID,
                type: EventType.ASSIGN,
                to: toAccount,
                nft: punk,
                timestamp: BigInt(logEvent.block.timestamp),
                contract: contract,
                blockNumber: BigInt(logEvent.block.height),
                logNumber: BigInt(logEvent.logIndex),
                txHash: new Uint8Array(Buffer.from(logEvent.transactionHash, 'utf8')),
                blockHash: new Uint8Array(Buffer.from(logEvent.block.hash, 'utf8')),
            });

            this.eventEntities.set(eventID, assignEvent);

        }

        punk.metadata = metadata;
        punk.assignedTo = toAccount;
        punk.transferedTo = toAccount;

        return assignEvent;
    }

    saveEvent = (ev: Event) => {
        this.eventEntities.set(ev.id, ev);
    }

    private getTrait = async (traitID: string): Promise<Trait | undefined> => {
        // Check if entity exists in cache
        if (this.traits.has(traitID)) return this.traits.get(traitID);

        // Check if exists in DB and save it to cache
        const t = await this.ctx.store.get(Trait, traitID);
        if (t) this.traits.set(traitID, t);
        return t;
    }
    getOrCreateTrait = async (traitID: string, traitType: TraitType) => {
        let trait = await this.getTrait(traitID);

        if (!trait) {
            trait = new Trait({
                id: traitID,
                type: traitType,
                numberOfNfts: 0n
            });

            this.traits.set(traitID, trait);
        }

        return trait;
    }

    saveTrait = (trait: Trait) => {
        this.traits.set(trait.id, trait);
    }


    savePunk = (p: Punk) => {
        this.punks.set(p.id, p);
    }


    mapMetaDataWithTraits = (metaData: MetaData, traitsList: Trait[]) => {
        for (const t of traitsList) {
            this.metaDataTraits.push(new MetaDataTrait({
                id: metaData.id.concat('-').concat(t.id),
                trait: t,
                metadata: metaData
            }));
        }
    };


    persistCacheToDatabase = async (flushCache: boolean) => {
        await this.ctx.store.upsert([...this.accounts.values()]);
        await this.ctx.store.upsert([...this.contracts.values()]);
        await this.ctx.store.upsert([...this.traits.values()]);
        await this.ctx.store.upsert([...this.punks.values()]);
        await this.ctx.store.upsert([...this.metadata.values()]);
        await this.ctx.store.upsert([...this.eventEntities.values()]);

        await this.ctx.store.upsert([...this.metaDataTraits]);

        if (flushCache) {
            this.accounts = new Map<string, Account>();
            this.metadata = new Map<string, MetaData>();
            this.contracts = new Map<string, Contract>();
            this.eventEntities = new Map<string, Event>();
            this.traits = new Map<string, Trait>();
            this.punks = new Map<string, Punk>();

            this.metaDataTraits = [];
        }
    }
}