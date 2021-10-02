import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Verification {
	@PrimaryGeneratedColumn()
	id: number;
	@Column()
	userID: string;
	@Column()
	questioning: boolean;
	@Column()
	pendingVerificationID: string;
	@Column()
	guildID: string;
	@Column({ default: null })
	questionChannelID: string;
}