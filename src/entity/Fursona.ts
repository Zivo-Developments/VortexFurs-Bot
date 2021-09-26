import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./Member";

@Entity()
export class Fursona {
	@PrimaryGeneratedColumn()
	_id: number;
	@ManyToOne(() => Member, (member) => member.sonas)
	owner: Member[];
	@Column({ default: null })
	sonaName: string;
	@Column({ default: null })
	species: string;
	@Column({ default: null })
	age: number;
	@Column({ default: null })
	height: string;
	@Column({ type: "simple-array" })
	likes: string[];
	@Column({ type: "simple-array" })
	dislikes: string[];
	@Column({ default: null })
	sonaSexuality: string;
}
