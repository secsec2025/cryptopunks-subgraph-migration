import {
    Account,
    Contract,
    CToken,
    Event,
    EventType,
    MetaData,
    MetaDataTrait,
    Offer,
    OfferType,
    Punk,
    Trait,
    TraitType,
    UserProxy
} from './model';
import {Store} from "@subsquid/typeorm-store";
import {CONTRACT_URI, CRYPTOPUNKS_CONTRACT_ADDRESS, TOKEN_URI} from "./constants";
import {getCryptoPunksContractDetails} from "./helpers/contract-helper";
import {DataHandlerContext} from "@subsquid/evm-processor";
import {getGlobalId} from "./utils";

export class EntityCache {

    public accounts!: Map<string, Account>;
    public contracts!: Map<string, Contract>;
    public metadata!: Map<string, MetaData>;
    public eventEntities!: Map<string, Event>;
    public traits!: Map<string, Trait>;
    public punks!: Map<string, Punk>;
    public userProxies!: Map<string, UserProxy>;
    public offers!: Map<string, Offer>;
    public cTokens!: Map<string, CToken>;

    public metaDataTraits!: MetaDataTrait[];

    public ctx: DataHandlerContext<Store, {}>;

    constructor(ctx: DataHandlerContext<Store, {}>) {
        this.ctx = ctx;
        this.initializeMaps();
    }

    private initializeMaps = () => {
        this.accounts = new Map<string, Account>();
        this.metadata = new Map<string, MetaData>();
        this.contracts = new Map<string, Contract>();
        this.eventEntities = new Map<string, Event>();
        this.traits = new Map<string, Trait>();
        this.punks = new Map<string, Punk>();
        this.userProxies = new Map<string, UserProxy>();
        this.offers = new Map<string, Offer>;
        this.cTokens = new Map<string, CToken>;

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

    saveAccount = (account: Account, persist?: boolean) => {
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
                toId: toAccount.id,
                nftId: punk.id,
                timestamp: BigInt(logEvent.block.timestamp),
                contractId: contract.id,
                blockNumber: BigInt(logEvent.block.height),
                logNumber: BigInt(logEvent.logIndex),
                txHash: new Uint8Array(Buffer.from(logEvent.transactionHash, 'utf8')),
                blockHash: new Uint8Array(Buffer.from(logEvent.block.hash, 'utf8')),
            });

            this.eventEntities.set(eventID, assignEvent);

        }

        // punk.metadata = metadata;
        punk.assignedToId = toAccount.id;
        punk.transferedToId = toAccount.id;

        return assignEvent;
    }

    getOrCreateTransferEvent = async (punk: Punk, contractAddress: string, logEvent: any): Promise<Event> => {
        const eventID: string = getGlobalId(logEvent).concat('-TRANSFER');
        let transferEvent = await this.getEvent(eventID);

        if (!transferEvent) {
            transferEvent = new Event({
                id: eventID
            });
        }

        transferEvent.timestamp = BigInt(logEvent.block.timestamp);
        transferEvent.contractId = contractAddress;
        transferEvent.blockNumber = BigInt(logEvent.block.height);
        transferEvent.txHash = new Uint8Array(Buffer.from(logEvent.transactionHash, 'utf8'));
        transferEvent.logNumber = BigInt(logEvent.logIndex);
        transferEvent.blockHash = new Uint8Array(Buffer.from(logEvent.block.hash, 'utf8'));
        transferEvent.type = EventType.TRANSFER;

        this.eventEntities.set(transferEvent.id, transferEvent);
        return transferEvent;
    }

    getOrCreateSale = async (punkIndex: bigint, fromAddress: string, logEvent: any): Promise<Event> => {
        const eventID: string = getGlobalId(logEvent).concat('-SALE');
        let saleEvent = await this.getEvent(eventID);

        if (!saleEvent) {
            saleEvent = new Event({
                id: eventID,
                type: EventType.SALE,
                timestamp: BigInt(logEvent.block.timestamp),
                contractId: CRYPTOPUNKS_CONTRACT_ADDRESS,
                blockNumber: BigInt(logEvent.block.height),
                logNumber: BigInt(logEvent.logIndex),
                txHash: new Uint8Array(Buffer.from(logEvent.transactionHash, 'utf8')),
                blockHash: new Uint8Array(Buffer.from(logEvent.block.hash, 'utf8')),
            });
        }
        saleEvent.fromId = fromAddress;
        saleEvent.nftId = punkIndex.toString();

        this.eventEntities.set(saleEvent.id, saleEvent);
        return saleEvent;
    }

    saveEvent = (ev: Event): void => {
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


    getCToken = async (cTokenID: string): Promise<CToken | undefined> => {
        // Check if entity exists in cache
        if (this.cTokens.has(cTokenID)) return this.cTokens.get(cTokenID);

        // Check if exists in DB and save it to cache
        const t = await this.ctx.store.get(CToken, cTokenID);
        if (t) this.cTokens.set(cTokenID, t);
        return t;
    }

    getOrCreateCToken = async (logEvent: any): Promise<CToken> => {
        const cTokenID: string = getGlobalId(logEvent);
        let cToken = await this.getCToken(cTokenID);

        if (!cToken) {
            cToken = new CToken({
                id: cTokenID,
                referenceId: cTokenID,
                blockNumber: BigInt(logEvent.block.height),
                blockHash: new Uint8Array(Buffer.from(logEvent.block.hash, 'utf8')),
                txHash: new Uint8Array(Buffer.from(logEvent.transactionHash, 'utf8')),
                timestamp: BigInt(logEvent.block.timestamp)
            });
            this.cTokens.set(cTokenID, cToken);
        }
        return cToken;
    }

    getOwnerFromCToken = async (logEvent: any): Promise<string | undefined> => {
        const transferEventCTokenID = getGlobalId(logEvent, -1);
        const cToken = await this.getCToken(transferEventCTokenID);
        return cToken?.owner;
    }

    saveCToken = (c: CToken) => {
        this.cTokens.set(c.id, c);
    }


    getOffer = async (offerID: string): Promise<Offer | undefined> => {
        // Check if entity exists in cache
        if (this.offers.has(offerID)) return this.offers.get(offerID);

        // Check if exists in DB and save it to cache
        const o = await this.ctx.store.get(Offer, offerID);
        if (o) this.offers.set(offerID, o);
        return o;
    }

    getOrCreateAskOffer = async (punkOwnerAddress: string, logEvent: any): Promise<Offer> => {
        const offerID: string = getGlobalId(logEvent).concat('-ASK');

        let ask = await this.getOffer(offerID);
        if (!ask) {
            ask = new Offer({
                id: offerID,
                offerType: OfferType.ASK,
                fromId: punkOwnerAddress,
                open: true
            });
        }

        return ask;
    }

    getOrCreateBidOffer = async (fromAddress: string, logEvent: any): Promise<Offer> => {
        const offerID: string = getGlobalId(logEvent).concat('-BID');

        let bid = await this.getOffer(offerID); //Should not be null
        if (!bid) {
            bid = new Offer({
                id: offerID,
                fromId: fromAddress,
                offerType: OfferType.BID,
                open: true
            });
        }
        return bid;
    }

    saveOffer = (offer: Offer, persist?: boolean) => {
        this.offers.set(offer.id, offer);
    }


    getPunkByID = async (punkIndex: bigint): Promise<Punk | undefined> => {
        const id: string = punkIndex.toString();
        // Check if entity exists in cache
        if (this.punks.has(id)) return this.punks.get(id);

        // Check if exists in DB and save it to cache
        const p = await this.ctx.store.get(Punk, id);
        if (p) this.punks.set(id, p);
        return p;
    }


    savePunk = (p: Punk) => {
        this.punks.set(p.id, p);
    }



    getUserProxy = async (proxyID: string): Promise<UserProxy | undefined> => {
        // Check if entity exists in cache
        if (this.userProxies.has(proxyID)) return this.userProxies.get(proxyID);

        // Check if exists in DB and save it to cache
        const up = await this.ctx.store.get(UserProxy, proxyID);
        if (up) this.userProxies.set(proxyID, up);
        return up;
    }


    mapMetaDataWithTraits = (metaData: MetaData, traitsList: Trait[]) => {
        for (const t of traitsList) {
            this.metaDataTraits.push(new MetaDataTrait({
                id: metaData.id.concat('-').concat(t.id),
                traitId: t.id,
                metadataId: metaData.id
            }));
        }
    };


    persistCacheToDatabase = async (flushCache: boolean, initialOrder?: boolean) => {

        if (initialOrder) {
            await this.ctx.store.upsert([...this.accounts.values()]);
            await this.ctx.store.upsert([...this.contracts.values()]);
            await this.ctx.store.upsert([...this.traits.values()]);
            await this.ctx.store.upsert([...this.punks.values()]);
            await this.ctx.store.upsert([...this.metadata.values()]);
            await this.ctx.store.upsert([...this.eventEntities.values()]);
            await this.ctx.store.upsert([...this.userProxies.values()]);
            await this.ctx.store.upsert([...this.offers.values()]);
            await this.ctx.store.upsert([...this.cTokens.values()]);
        } else {
            await this.ctx.store.upsert([...this.accounts.values()]);
            await this.ctx.store.upsert([...this.contracts.values()]);
            await this.ctx.store.upsert([...this.traits.values()]);
            await this.ctx.store.upsert([...this.metadata.values()]);
            await this.ctx.store.upsert([...this.eventEntities.values()]);
            await this.ctx.store.upsert([...this.userProxies.values()]);
            await this.ctx.store.upsert([...this.offers.values()]);
            await this.ctx.store.upsert([...this.cTokens.values()]);
            await this.ctx.store.upsert([...this.punks.values()]);
        }



        await this.ctx.store.upsert([...this.metaDataTraits]);

        if (flushCache) {
            this.initializeMaps();
        }
    }
}