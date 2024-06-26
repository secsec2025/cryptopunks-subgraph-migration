import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Punk} from "./punk.model"
import {Event} from "./event.model"
import {Offer} from "./offer.model"

@Entity_()
export class Account {
    constructor(props?: Partial<Account>) {
        Object.assign(this, props)
    }

    /**
     * Ethereum Address
     */
    @PrimaryColumn_()
    id!: string

    /**
     * All Punks owned by Account
     */
    @OneToMany_(() => Punk, e => e.owner)
    punksOwned!: Punk[]

    /**
     * Events to Account
     */
    @OneToMany_(() => Event, e => e.to)
    eventsTo!: Event[]

    /**
     * Events from Account
     */
    @OneToMany_(() => Event, e => e.from)
    eventsFrom!: Event[]

    /**
     * Offers (ASK/BID) by Account
     */
    @OneToMany_(() => Offer, e => e.from)
    offers!: Offer[]

    /**
     * Total number of Punks owned by account
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfPunksOwned!: bigint

    /**
     * Total number of Punks assigned to account
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfPunksAssigned!: bigint

    /**
     * Total number of transfer by Account
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfTransfers!: bigint

    /**
     * Total number of sales by Account
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfSales!: bigint

    /**
     * Total number of purchases by Account
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfPurchases!: bigint

    /**
     * Total amount spent buying Punks by Account
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    totalSpent!: bigint

    /**
     * Total amount earned by Account from selling Punks
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    totalEarned!: bigint

    /**
     * Average amount spent buying Punks by Account
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    averageAmountSpent!: bigint

    /**
     * Account URL
     */
    @Column_("text", {nullable: false})
    accountUrl!: string
}
