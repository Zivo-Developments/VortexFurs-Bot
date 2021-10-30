import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./Member";

@Entity()
export class ModCase {
    @PrimaryGeneratedColumn()
    _id: number;
    @Column({ default: null })
    guildID: string;
    @Column({ default: null })
    userID: string;
    @Column({ default: null })
    issuerID: string;
    @Column({ type: "text", default: null })
    type: "warn" | "ban" | "mute" | "kick";
    @Column({ default: null })
    appealed: boolean;
    @Column({ type: "simple-array" })
    rulesViolated: string[];
    @Column({ default: null })
    reason: string;
    @Column({ type: "simple-array" })
    actionsTaken: string[];
    @ManyToOne(() => Member, (member) => member.cases)
    violator: Member;
}
