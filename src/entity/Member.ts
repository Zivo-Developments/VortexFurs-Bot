import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { ModCase } from "./ModCase";
import { Fursona } from "./Fursona";

@Entity()
export class Member {
    @PrimaryGeneratedColumn()
    _id: number;
    @Column({ default: null })
    userID: string;
    @Column({ default: null })
    guildID: string;
    @Column({ default: 0 })
    tokens: number;
    @Column({ type: "text", default: null })
    bio: string;
    @Column({ default: false })
    muted: boolean;
    @Column({ default: 0 })
    xp: number;
    @Column({ default: false })
    created: boolean;
    @Column({ default: 0 })
    messages: number
    @OneToMany(() => Fursona, (sona) => sona.owner)
    sonas: Fursona[];
    @OneToMany(() => ModCase, (cases) => cases.violator)
    cases: ModCase[];
}
