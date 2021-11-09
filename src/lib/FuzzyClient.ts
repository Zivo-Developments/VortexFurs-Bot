import { ApplicationCommandData, ApplicationCommandOptionData, Client, ClientOptions, Collection } from "discord.js";
import fs from "fs";
import { Connection, createConnection } from "typeorm";
import Yiffy from "yiffy";
import { ScheduleRepo } from "../repositories/SchduleRepository";
import BaseCommand from "../structures/BaseCommand";
import ScheduleManager from "../utils/SchedulingManager";
import Utils from "../utils/Utils";
import * as config from "../config.json";
import Logger from "../utils/Logger";
import moment from "moment";
import { api } from "../api";
import * as Sentry from "@sentry/node";

export default class FuzzyClient extends Client {
    _logger: Logger;
    commands: Collection<string, BaseCommand>;
    aliases: Collection<string, string>;
    schedules: any;
    furryAPI: Yiffy;
    arrayOfSlashCommands: (BaseCommand & ApplicationCommandData)[];
    scheduleRepo: ScheduleRepo;
    scheduleManager: ScheduleManager;
    xpCooldown: string[];
    utils: Utils;
    config: typeof config;
    database: Connection;
    constructor(opts: ClientOptions) {
        super(opts);
        this.config = require("../config.json");
        this.commands = new Collection();
        this.aliases = new Collection();
        this.furryAPI = new Yiffy();
        this.schedules = {};
        this.arrayOfSlashCommands = [];
        this.xpCooldown = [];
        this.utils = new Utils();
        this.scheduleManager = new ScheduleManager(this);
        this._logger = new Logger(this);
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
            this._logger.info(`Unable to load database! ${e}`);
            return process.exit();
        });
        this.scheduleRepo = this.database.getCustomRepository(ScheduleRepo);
    }

    public async loadCommands() {
        this._logger.info(`Loading Slash Commands`);
        fs.readdirSync("dist/commands/").forEach((category) => {
            this._logger.info(`Loading (/) Category: ${category}`);
            fs.readdirSync(`dist/commands/${category}`).forEach((command) => {
                this._logger.info(`Loading (/) Command: ${command}`);
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
        this._logger.info(`Loading Events`);
        fs.readdirSync("dist/events/").forEach((evt) => {
            try {
                const event = new (require(`../events/${evt}`).default)(this);
                this.on(event.eventName, event.run.bind(null, this));
            } catch (e) {
                console.error(`Error Loading ${evt.split(".")[0]} ${e}`);
            }
        });
    }

    public async initalizeSentry() {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
        });
    }

    public async loadSchedules() {
        this._logger.debug("Setting Up Schedules");
        await this.scheduleRepo.findOrCreate(
            { uid: "GLOBAL-MIN" },
            {
                uid: "GLOBAL-MIN",
                task: "GLOBAL-MIN",
                catchUp: true,
                data: {},
                nextRun: moment().add(1, "minute").toISOString(true),
                cron: "0 * * * * *",
            },
        );
        await this.scheduleRepo.findOrCreate(
            {
                uid: "DISCORDME",
            },
            {
                uid: "DISCORDME",
                task: "discordme",
                catchUp: true,
                data: {
                    guildID: this.config.guildID,
                },
                cron: "0 59 5,11,17,23 * * *",
            },
        );
        const records = await this.scheduleRepo.getAll();
        records.forEach(async (record) => {
            await this.scheduleManager
                .addSchedule(record)
                .then(() => {
                    this._logger.debug("Loaded Schedule: " + record.uid);
                })
                .catch((e) => this._logger.error("Problem Loading Schedule: " + record.uid + "Error:\n" + e));
        });
    }

    public async login(token: string | undefined) {
        await this.loadDatabase();
        await this.loadCommands();
        await this.initalizeSentry();
        await this.loadSchedules();
        await this.loadEvents();
        api(this);
        return super.login(token);
    }
}
