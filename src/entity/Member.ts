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
    @Column({ default: null })
    tokens: number;
    @Column({ type: "text", default: null })
    bio: string;
    @Column({ default: null })
    muted: boolean;
    @Column({ default: null })
    xp: number;
    @Column({ default: false })
    created: boolean;
    @Column({ default: null })
    messages: number
    @OneToMany(() => Fursona, (sona) => sona.owner)
    sonas: Fursona[];
    @OneToMany(() => ModCase, (cases) => cases.violator)
    cases: ModCase[];
}
