import { Guild } from "../entity/Guild";
import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import FuzzyClient from "../lib/FuzzyClient";
import { Member } from "../entity/Member";
import { ModCase } from "../entity/ModCase";
import { CommandInteraction, GuildMember } from "discord.js";
import { MemberRepo } from "./MemberRepository";
import { Schedule } from "../entity/Schedules";

@EntityRepository(Schedule)
export class ScheduleRepo extends Repository<Schedule> {
	public async createSchedule(createData: DeepPartial<Schedule>) {
		await this.save(this.create(createData));
		return true;
	}

	public async getAll() {
		return await this.find({});
	}
}
