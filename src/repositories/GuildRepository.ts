import { Guild } from "../entity/Guild";
import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import FuzzyClient from "../lib/FuzzyClient";

@EntityRepository(Guild)
export class GuildRepo extends Repository<Guild> {
	public async findOrCreate(condition: FindConditions<Guild>, create: DeepPartial<Guild>) {
		const guild = await this.findOne(condition);
		if (!guild) await this.save(this.create(create));
		return guild;
	}
}
