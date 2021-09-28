import { Fursona } from "../entity/Fursona";
import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import FuzzyClient from "../lib/FuzzyClient";
import { CommandInteraction } from "discord.js";

@EntityRepository(Fursona)
export class FursonaRepo extends Repository<Fursona> {
	public async findOrCreate(condition: FindConditions<Fursona>, create: DeepPartial<Fursona>) {
		const fursona = await this.findOne(condition);
		if (!fursona) await this.save(this.create(create));
		return fursona;
	}

	public async createSona(create: DeepPartial<Fursona>) {
		const fursona = await this.save(this.create(create));
		return fursona;
	}
}
