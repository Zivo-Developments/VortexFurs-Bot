import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import { ModCase } from "./ModCase";
import { Fursona } from "./Fursona";

@Entity()
export class Member {
    @PrimaryGeneratedColumn()
    _id: number
    @Column()
    userID: string
    @Column()
    guildID: string
    @Column()
    tokens: number
    @Column()
    muted: boolean
    @Column()
    xp: number
    @Column({ default: null })
	verified: boolean;
    @OneToMany(() => Fursona, sona => sona.owner)
    sonas: Fursona[]
    @OneToMany(() => ModCase, cases => cases.violator)
    cases: ModCase[]
}
