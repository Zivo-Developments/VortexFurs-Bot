import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Partners {
    @PrimaryGeneratedColumn()
    _id: number;
    @Column({ default: null })
    rep: string;
    @Column({ default: null })
    partnerID: string;
    @Column({ default: null })
    serverName: string;
    @Column({ default: null })
    summary: string;
    @Column({ default: null })
    iconURL: string;
    @Column({ default: null })
    affliates: boolean;
    @Column({ default: null })
    invite: string;
}
