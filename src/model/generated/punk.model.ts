import {
    Entity as Entity_,
    Column as Column_,
    PrimaryColumn as PrimaryColumn_,
    ManyToOne as ManyToOne_,
    Index as Index_,
    OneToMany as OneToMany_,
    OneToOne as OneToOne_
} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"
import {MetaData} from "./metaData.model"
import {Contract} from "./contract.model"
import {Event} from "./event.model"
import {Offer} from "./offer.model"

@Entity_()
export class Punk {
    constructor(props?: Partial<Punk>) {
        Object.assign(this, props)
    }

    /**
     * Punk ID
     */
    @PrimaryColumn_()
    id!: string

    /**
     * Account that received Punk
     */
    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    transferedTo!: Account | undefined | null

    @Column_({nullable: true})
    transferedToId!: string | undefined | null;

    /**
     * Account that claimed Punk
     */
    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    assignedTo!: Account | undefined | null

    @Column_({nullable: true})
    assignedToId!: string | undefined | null;

    /**
     * Punk buyers
     */
    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    purchasedBy!: Account | undefined | null

    @Column_({nullable: true})
    purchasedById!: string | undefined | null;

    @OneToOne_(() => MetaData, metadata => metadata.punk, {nullable: true})
    metadata!: MetaData | undefined | null

    /**
     * Contract data
     */
    @Index_()
    @ManyToOne_(() => Contract, {nullable: true})
    contract!: Contract | undefined | null

    @Column_({nullable: true})
    contractId!: string | undefined | null;

    /**
     * Punk tokenId
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    tokenId!: bigint

    /**
     * Current owner of Punk
     */
    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    owner!: Account

    @Column_({nullable: true})
    ownerId!: string;

    /**
     * Wrap Status
     */
    @Column_("bool", {nullable: false})
    wrapped!: boolean

    /**
     * All Punk events
     */
    @OneToMany_(() => Event, e => e.nft)
    events!: Event[]

    /**
     * Current Ask for Punk
     */
    @Index_()
    @ManyToOne_(() => Offer, {nullable: true})
    currentAsk!: Offer | undefined | null

    @Column_({nullable: true})
    currentAskId!: string | undefined | null;

    /**
     * Current Bid for Punk
     */
    @Index_()
    @ManyToOne_(() => Offer, {nullable: true})
    currentBid!: Offer | undefined | null

    @Column_({nullable: true})
    currentBidId!: string | undefined | null;

    /**
     * Current AskCreated event
     */
    @Index_()
    @ManyToOne_(() => Event, {nullable: true})
    currentAskCreated!: Event | undefined | null

    @Column_({nullable: true})
    currentAskCreatedId!: string | undefined | null;

    /**
     * Current BidCreated event
     */
    @Index_()
    @ManyToOne_(() => Event, {nullable: true})
    currentBidCreated!: Event | undefined | null

    @Column_({nullable: true})
    currentBidCreatedId!: string | undefined | null;

    /**
     * Number of times Punk has been transferred
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfTransfers!: bigint

    /**
     * Number of times Punk was sold
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfSales!: bigint

    /**
     * Current AskRemoved event
     */
    @Index_()
    @ManyToOne_(() => Event, {nullable: true})
    currentAskRemoved!: Event | undefined | null

    @Column_({nullable: true})
    currentAskRemovedId!: string | undefined | null;

    /**
     * Current BidRemoved event
     */
    @Index_()
    @ManyToOne_(() => Event, {nullable: true})
    currentBidRemoved!: Event | undefined | null

    @Column_({nullable: true})
    currentBidRemovedId!: string | undefined | null;

    /**
     * Total amount spent purchasing Punk across OpenSea & Rarible marketplaces
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    totalAmountSpentOnPunk!: bigint

    /**
     * Average price for Punk across OpenSea & Rarible marketplaces
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    averageSalePrice!: bigint
}
