import {
	ApplicationCommand,
	ApplicationCommandData,
	ApplicationCommandOptionData,
	ChatInputApplicationCommandData,
	Client,
	ClientOptions,
	Collection,
	ColorResolvable,
} from "discord.js";
import fs from "fs";
import { NamespaceExport } from "typescript";
import BaseCommand from "../structures/BaseCommand";
import Yiffy from "yiffy";
import { Connection, createConnection } from "typeorm";
import Utils from "../utils/Utils";
import { ScheduleRepo } from "../repositories/SchduleRepository";
import ScheduleManager from "../utils/SchedulingManager";

export default class FuzzyClient extends Client {
	commands: Collection<string, BaseCommand>;
	aliases: Collection<string, string>;
	schedules: any;
	furryAPI: Yiffy;
	arrayOfSlashCommands: (ChatInputApplicationCommandData & BaseCommand)[];
	scheduleRepo: ScheduleRepo;
	scheduleManager: ScheduleManager
	config: { color: ColorResolvable; guildID: string; ownerID: string; devLogsID: string };
	utils: Utils;
	database: Connection;
	constructor(opts: ClientOptions) {
		super(opts);
		this.config = require("../../config.json");
		this.commands = new Collection();
		this.aliases = new Collection();
		this.furryAPI = new Yiffy();
		this.schedules = {};
		this.arrayOfSlashCommands = [];
		this.utils = new Utils();
		this.scheduleManager = new ScheduleManager(this)
	}

	public async loadDatabase() {
		this.database = await createConnection({
			type: "postgres",
			host: process.env.DB_HOST,
			port: Number(process.env.DB_PORT),
			username: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME,
			entities: ["dist/entity/**/*.js"],
			migrations: ["dist/migration/**/*.js"],
			synchronize: true,
			logging: false,
		}).catch((e) => {
			console.log(`Unable to load database! ${e}`);
			return process.exit();
		});
		this.scheduleRepo = this.database.getCustomRepository(ScheduleRepo);
	}

	public async loadCommands() {
		console.log(`Loading Slash Commands`);
		fs.readdirSync("dist/commands/").forEach((category) => {
			console.log(`Loading (/) Category: ${category}`);
			fs.readdirSync(`dist/commands/${category}`).forEach((command) => {
				console.log(`Loading (/) Command: ${command}`);
				const file: BaseCommand = new (require(`../commands/${category}/${command}`).default)(this);
				if (!file || !file.name) return;
				this.commands.set(file.name, file);
				if (file.userPermissions.length > 0 || file.ownerOnly) file.defaultPermission = false;
				const commandOptions: ApplicationCommandOptionData[] = [];
				file.args?.forEach((arg) => {
					commandOptions.push({
						name: arg.name,
						description: arg.description,
						type: arg.type,
						choices: arg.choices,
						required: arg.required,
						// @ts-ignore
						options: arg.options,
					});
				});
				this.arrayOfSlashCommands.push({
					...file,
					options: commandOptions,
					run: file.run,
				});
			});
		});
	}

	public async loadEvents() {
		console.log(`Loading Events`);
		fs.readdirSync("dist/events/").forEach((evt) => {
			try {
				const event = new (require(`../events/${evt}`).default)(this);
				this.on(event.eventName, event.run.bind(null, this));
			} catch (e) {
				console.error(`Error Loading ${evt.split(".")[0]} ${e}`);
			}
		});
	}

	public async loadSchedules() {
		console.debug("Setting Up Schedules");
		const records = await this.scheduleRepo.getAll();
		records.forEach(async (record) => {
			await this.scheduleManager.addSchedule(record)
				.then(() => {
					console.debug("Loaded Schedule: " + record.uid);
				})
				.catch((e) => console.error("Problem Loading Schedule: " + record.uid + "Error:\n" + e));
		});
	}
}
