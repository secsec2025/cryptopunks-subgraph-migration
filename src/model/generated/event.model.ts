import {
    Entity as Entity_,
    Column as Column_,
    PrimaryColumn as PrimaryColumn_,
    ManyToOne as ManyToOne_,
    Index as Index_,
    OneToOne as OneToOne_
} from "typeorm"
import * as marshal from "./marshal"
import {Contract} from "./contract.model"
import {Punk} from "./punk.model"
import {Account} from "./account.model"
import {EventType} from "./_eventType"
import {Offer} from "./offer.model";

@Entity_()
export class Event {
    constructor(props?: Partial<Event>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    /**
     * Contract metadata
     */
    @Index_()
    @ManyToOne_(() => Contract, {nullable: true})
    contract!: Contract | undefined | null

    @Column_({nullable: true})
    contractId!: string;

    /**
     * Punk that was assigned
     */
    @Index_()
    @ManyToOne_(() => Punk, {nullable: true})
    nft!: Punk | undefined | null

    @Column_({nullable: true})
    nftId!: string | undefined | null;

    /**
     * Account that claimed Punk
     */
    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    to!: Account | undefined | null

    @Column_({nullable: true})
    toId!: string | undefined | null;

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    amount!: bigint | undefined | null

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    from!: Account | undefined | null

    @Column_({nullable: true})
    fromId!: string | undefined | null;

    @Column_("varchar", {length: 11, nullable: false})
    type!: EventType

    @OneToOne_(() => Offer, offer => offer.created, {nullable: true})
    offerCreated!: Offer | undefined | null;

    // @OneToOne_(() => Offer, offer => offer.removed, {nullable: true})
    // offerRemoved!: Offer | undefined | null;

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    logNumber!: bigint

    /**
     * Transaction details
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    blockNumber!: bigint

    @Column_("bytea", {nullable: false})
    blockHash!: Uint8Array

    @Column_("bytea", {nullable: false})
    txHash!: Uint8Array

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    timestamp!: bigint
}
