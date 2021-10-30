import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Client {
    @PrimaryGeneratedColumn()
    _id: number;
    @Column()
    clientID: string;
    @Column()
    maintenanceMode: boolean;
}
