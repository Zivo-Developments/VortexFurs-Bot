import { Guild } from "../entity/Guild";
import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import FuzzyClient from "../lib/FuzzyClient";
import { Member } from "../entity/Member";

@EntityRepository(Guild)
export class MemberRepo extends Repository<Member> {
	public async findOrCreate(condition: FindConditions<Member>, create: DeepPartial<Member>[]) {
		const member = await this.findOne(condition);
		if (!member) await this.save(this.create(create));
		return member;
	}
}
