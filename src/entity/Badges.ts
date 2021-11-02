import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./Member";

@Entity()
export class Badges {
    @PrimaryGeneratedColumn()
    _id: number;
    @Column({ default: null })
    guildID: string;
    @Column({ default: null })
    name: string;
    @Column({ default: null })
    referenceName: string;
    @Column({ default: null })
    info: string;
    @Column({ default: null })
    icon: string;
    @Column({ default: null })
    uid: string;
    @Column({ default: false })
    gold: boolean;
}
