import { DeepPartial, EntityRepository, Repository } from "typeorm";
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
}
