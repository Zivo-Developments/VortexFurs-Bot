import { Guild } from "../entity/Guild";
import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import FuzzyClient from "../lib/FuzzyClient";
import { Member } from "../entity/Member";
import { ModCase } from "../entity/ModCase";
import { CommandInteraction, GuildMember } from "discord.js";
import { MemberRepo } from "./MemberRepository";

@EntityRepository(ModCase)
export class ModcaseRepo extends Repository<ModCase> {
	public async Issue(createData: DeepPartial<ModCase>) {
		await this.save(this.create(createData));
		return true;
	}
}
