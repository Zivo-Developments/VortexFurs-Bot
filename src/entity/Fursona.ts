import { Column, PrimaryGeneratedColumn } from "typeorm";

export class Fursona {
    @PrimaryGeneratedColumn()
    _id: number
    @Column()
    ownerUserID: string
    @Column()
    sonaName: string
    @Column()
    species: string
    @Column()
    age: number
    @Column()
    height: string
    @Column()
    likes: string[]
    @Column()
    dislikes: string[]
    @Column()
    sonaSexuality: string
}