import { Guild } from "../entity/Guild";
import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import FuzzyClient from "../lib/FuzzyClient";
import { Member } from "../entity/Member";
import { ModCase } from "../entity/ModCase";
import { CommandInteraction, GuildMember } from "discord.js";
import { MemberRepo } from "./MemberRepository";

@EntityRepository(ModCase)
export class ModcaseRepo extends Repository<ModCase> {
	public async createBan(client: FuzzyClient, interation: CommandInteraction, violator: GuildMember, reason: string, rules: string) {
		const member = await client.database.getCustomRepository(MemberRepo).findOne({ userID: violator.user.id });
		await this.save(
			this.create({
				actionsTaken: [],
				appealed: false,
				guildID: interation.guild!.id,
				issuerID: interation.user.id,
				reason,
				rulesViolated: rules.split(" "),
				type: "ban",
				userID: violator.user.id,
				violator: member,
			})
		);
		return true;
	}

	public async createKick(client: FuzzyClient, interation: CommandInteraction, violator: GuildMember, reason: string) {
		const member = await client.database.getCustomRepository(MemberRepo).findOne({ userID: violator.user.id });
		await this.save(
			this.create({
				actionsTaken: [],
				appealed: false,
				guildID: interation.guild!.id,
				issuerID: interation.user.id,
				reason,
				rulesViolated: ["0"],				
				type: "kick",
				userID: violator.user.id,
				violator: member,
			})
		);
		return true;
	}

	public async createWarn(client: FuzzyClient, interation: CommandInteraction, violator: GuildMember, reason: string) {
		const member = await client.database.getCustomRepository(MemberRepo).findOne({ userID: violator.user.id });
		await this.save(
			this.create({
				actionsTaken: [],
				appealed: false,
				guildID: interation.guild!.id,
				issuerID: interation.user.id,
				reason,
				rulesViolated: ["0"],				
				type: "warn",
				userID: violator.user.id,
				violator: member,
			})
		);
		return true;
	}
}
