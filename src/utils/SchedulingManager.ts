import { CronJob } from "cron";
import moment from "moment";
import { Schedule } from "../entity/Schedules";
import FuzzyClient from "../lib/FuzzyClient";

export default class ScheduleManager {
    constructor(public client: FuzzyClient) {
        this.client = client;
    }

    public async addSchedule(record: Schedule) {
        this.client.scheduleRepo.find({ uid: record.uid }).then(async (data) => {
            if (!data) return;
            this.removeSchedule(record);
            if (record.nextRun && !record.cron) {
                if (moment().isAfter(record.nextRun)) {
                    if (record.catchUp) await this.executeTasks(record);
                    await this.client.scheduleRepo.delete({ uid: record.uid }).catch((e) => console.error(e));
                }
                (async (record: Schedule) => {
                    this.client.schedules[record.uid] = new CronJob(
                        moment(record.nextRun).toDate(),
                        async () => {
                            await this.executeTasks(record);
                            await this.client.scheduleRepo.delete({ uid: record.uid }).catch((e) => console.error(e));
                        },
                        null,
                        true,
                    );
                })(record);
            } else if (record.cron) {
                if (record.nextRun && moment().isBefore(moment(record.nextRun))) {
                    (async (record: Schedule) => {
                        this.client.schedules[record.uid] = new CronJob(
                            moment(record.nextRun).toDate(),
                            async () => {
                                this.client.schedules[record.uid].stop();
                                this.client.schedules[record.uid] = new CronJob(
                                    record.cron,
                                    async () => {
                                        await this.executeTasks(record);
                                        this.client.scheduleRepo.update(
                                            { uid: record.uid },
                                            { lastRun: moment().format() },
                                        );
                                    },
                                    null,
                                    true,
                                    "UTC",
                                    null,
                                    true,
                                );
                            },
                            null,
                            true,
                        );
                    })(record);
                } else {
                    (async (record: Schedule) => {
                        this.client.schedules[record.uid] = new CronJob(
                            record.cron,
                            async () => {
                                await this.executeTasks(record);
                                await this.client.scheduleRepo.update(
                                    { uid: record.uid },
                                    { lastRun: moment().format() },
                                );
                            },
                            null,
                            true,
                            "UTC",
                        );
                    })(record);
                }
            }
        });
    }

    public async updateSchedule(record: Schedule) {
        this.client.schedules[record.uid].stop();
        delete this.client.schedules[record.uid];
        return this.addSchedule(record);
    }

    public async removeSchedule(record: Schedule) {
        if (typeof this.client.schedules[record.uid] !== "undefined") {
            this.client.schedules[record.uid].stop();
            delete this.client.schedules[record.uid];
        }
    }

    public async executeTasks(record: Schedule) {
        if (record.task) {
            const { task } = await import(`./../tasks/${record.task}`);
            task(this.client, record).catch((e: string) => {
                console.error(`There was an error executing ${record.task} ${e}`);
            });
        }
    }
}
