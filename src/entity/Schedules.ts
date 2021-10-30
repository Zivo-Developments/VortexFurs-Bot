import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./Member";

@Entity()
export class Schedule {
    @PrimaryGeneratedColumn()
    _id: number;
    @Column({ default: null })
    uid: string;
    @Column({ default: null })
    task: string;
    @Column({ type: "jsonb" })
    data: object;
    @Column({ default: null })
    lastRun: string;
    @Column({ default: null })
    nextRun: string;
    @Column({ default: null })
    catchUp: boolean;
    @Column({ default: null })
    cron: string;
}
