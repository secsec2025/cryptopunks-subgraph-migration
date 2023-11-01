import {
    Entity as Entity_,
    Column as Column_,
    PrimaryColumn as PrimaryColumn_,
    ManyToOne as ManyToOne_,
    OneToOne as OneToOne_,
    Index as Index_,
    JoinColumn
} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"
import {Punk} from "./punk.model"
import {Event} from "./event.model"
import {OfferType} from "./_offerType"

@Entity_()
export class Offer {
    constructor(props?: Partial<Offer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    /**
     * Punk owner
     */
    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    from!: Account

    @Column_({nullable: true})
    fromId!: string;

    /**
     * Open Status of Punk. Asks/Bids can be either Open or Closed
     */
    @Column_("bool", {nullable: false})
    open!: boolean

    /**
     * Bid/Ask for Punk in ETH
     */
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount!: bigint

    /**
     * Punk being offered/bidded
     */
    @Index_()
    @ManyToOne_(() => Punk, {nullable: true})
    nft!: Punk | undefined | null

    @Column_({nullable: true})
    nftId!: string | undefined | null;

    /**
     * Created at. Could be ASK or BID
     */
    @Index_()
    @OneToOne_(() => Event, event => event.offerCreated, {nullable: true})
    @JoinColumn()
    created!: Event | undefined | null

    @Column_({nullable: true})
    createdId!: string | undefined | null;

    /**
     * Removed at. Could be ASK or BID
     */
    @Index_()
    @ManyToOne_(() => Event, {nullable: true})
    removed!: Event | undefined | null

    @Column_({nullable: true})
    removedId!: string | undefined | null;

    @Column_("varchar", {length: 3, nullable: false})
    offerType!: OfferType
}
