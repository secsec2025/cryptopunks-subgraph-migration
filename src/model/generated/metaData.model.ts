import {
    Entity as Entity_,
    Column as Column_,
    PrimaryColumn as PrimaryColumn_,
    OneToOne as OneToOne_,
    Index as Index_,
    OneToMany as OneToMany_,
    JoinColumn
} from "typeorm"
import * as marshal from "./marshal"
import {Punk} from "./punk.model"
import {MetaDataTrait} from "./metaDataTrait.model"

@Entity_()
export class MetaData {
    constructor(props?: Partial<MetaData>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    tokenId!: bigint

    /**
     * URI of Punk
     */
    @Column_("text", {nullable: false})
    tokenURI!: string

    /**
     * Punk image
     */
    @Column_("text", {nullable: true})
    image!: string | undefined | null

    /**
     * Punk Svg image
     */
    @Column_("text", {nullable: true})
    svg!: string | undefined | null

    /**
     * Contract URI
     */
    @Column_("text", {nullable: false})
    contractURI!: string

    /**
     * Punk
     */
    @Index_()
    @OneToOne_(() => Punk, punk => punk.metadata, {nullable: true})
    @JoinColumn()
    // @JoinColumn({ name: 'punkId' })
    punk!: Punk

    @Column_({nullable: true})
    punkId!: string;

    /**
     * Punk Traits
     */
    @OneToMany_(() => MetaDataTrait, e => e.metadata)
    traits!: MetaDataTrait[]
}
