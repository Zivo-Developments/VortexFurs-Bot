import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import { Fursona } from "./Fursona";

@Entity()
export class Member {
    @PrimaryGeneratedColumn()
    _id: number
    @Column()
    userID: string
    @Column()
    tokens: number
    @Column()
    
    @Column()
    xp: number
    @OneToMany(() => Fursona, fursona => fursona.ownerUserID)
    fursonas: Fursona[]
}
