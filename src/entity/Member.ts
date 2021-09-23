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
    xp: number

}
