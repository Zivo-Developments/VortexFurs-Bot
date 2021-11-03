import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import { Member } from "../entity/Member";
import { Schedule } from "../entity/Schedules";

@EntityRepository(Schedule)
export class ScheduleRepo extends Repository<Schedule> {
    public async createSchedule(createData: DeepPartial<Schedule>) {
        const data = await this.save(this.create(createData));
        return data;
    }

    public async getAll() {
        return await this.find({});
    }

    public async findOrCreate(condition: FindConditions<Schedule>, create: DeepPartial<Schedule>) {
        const schedule = await this.findOne(condition);
        if (!schedule) await this.save(this.create(create));
        return schedule;
    }
}