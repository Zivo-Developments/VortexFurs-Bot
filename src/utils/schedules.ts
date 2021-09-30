import { CronJob } from "cron";
import moment from "moment";
import { Schedule } from "../entity/Schedules";
import FuzzyClient from "../lib/FuzzyClient";

export async function addSchedule(client: FuzzyClient, record: Schedule) {
	await client.scheduleRepo.find({ uid: record.uid }).then(async (data) => {
		if (!data) return;
		removeSchedule(client, record);
		if (record.nextRun && !record.cron) {
			if (moment().isAfter(record.nextRun)) {
				if (record.catchUp) await executeTask(client, record);
				await client.scheduleRepo.delete({ uid: record.uid }).catch((e) => console.error(e));
			}
			(async (record: Schedule) => {
				client.schedules[record.uid] = new CronJob(
					moment(record.nextRun).toDate(),
					async () => {
						await executeTask(client, record);
						await client.scheduleRepo.delete({ uid: record.uid }).catch((e) => console.error(e));
					},
					null,
					true
				);
			})(record);
		} else if (record.cron) {
			if (record.nextRun && moment().isBefore(moment(record.nextRun))) {
				(async (record: Schedule) => {
					client.schedules[record.uid] = new CronJob(
						moment(record.nextRun).toDate(),
						async () => {
							client.schedules[record.uid].stop();
							client.schedules[record.uid] = new CronJob(
								record.cron,
								async () => {
									await executeTask(client, record);
									client.scheduleRepo.update(
										{ uid: record.uid },
										{
											lastRun: moment().format(),
										}
									);
								},
								null,
								true,
								"UTC",
								null,
								true
							);
						},
						null,
						true
					);
				})(record);
			} else {
				(async (record: Schedule) => {
					client.schedules[record.uid] = new CronJob(
						record.cron,
						async () => {
							await executeTask(client, record);
							await client.scheduleRepo.update({ uid: record.uid }, { lastRun: moment().format() });
						},
						null,
						true,
						"UTC"
					);
				})(record);
			}
		}
	});
}

export async function updateSchedule(client: FuzzyClient, record: Schedule) {
	client.schedules[record.uid].stop();
	delete client.schedules[record.uid];
	return addSchedule(client, record);
}

export async function removeSchedule(client: FuzzyClient, record: Schedule) {
	if (typeof client.schedules[record.uid] !== "undefined") {
		client.schedules[record.uid].stop();
		delete client.schedules[record.uid];
	}
}

export async function executeTask(client: FuzzyClient, record: Schedule) {
	if (record.task) {
		const { task } = await import(`./../tasks/${record.task}`);
		task(client, record).catch((e: string) => {
			console.error(`There was an error executing ${record.task} ${e}`);
		});
	}
}
