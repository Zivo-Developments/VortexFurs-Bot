import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./Member";

@Entity()
export class Roles {
    @PrimaryGeneratedColumn()
    _id: number;
    @Column({ default: null })
    guildID: string;
    @Column({ default: null })
    name: string;
    @Column({ default: null })
    uid: string;
    @Column({ default: "select" })
    type: "select" | "checkbox";
    @Column({
        type: "jsonb",
        array: false,
        default: () => "'[]'",
        nullable: false,
    })
    roles: Array<{
        roleUID: string;
        roleID: string;
        roleName: string;
    }>;
}
