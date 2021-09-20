import { ApplicationCommand, ApplicationCommandOptionData, Client, ClientOptions, Collection } from "discord.js";
import BaseCommand from "../structures/BaseCommand";
import fs from "fs";
import BaseSlashCommand from "../structures/BaseSlashCommand";

export default class FuzzyClient extends Client {
	commands: Collection<string, BaseCommand>;
	aliases: Collection<string, string>;
	slashCommands: Collection<string, BaseSlashCommand>;
    arrayOfSlashCommands: ApplicationCommand[]
	config: { [index: string]: {} };
	constructor(opts: ClientOptions) {
		super(opts);
		this.commands = new Collection();
		this.aliases = new Collection();
		this.slashCommands = new Collection();
	}

	public async loadCommands() {
		console.log(`Loading Commands`);
		fs.readdirSync("dist/commands/").forEach((category) => {
			console.log(`Loading Category: ${category}`);
			fs.readdirSync(`dist/commands/${category}`).forEach((command) => {
				try {
					console.log(`Loading ${command}`);
					const cmd: BaseCommand = new (require(`../commands/${category}/${command}`).default)(this);
					this.commands.set(cmd.name, cmd);
					cmd.aliases.forEach((alias: string) => {
						this.aliases.set(alias, cmd.name);
					});
					console.log(`Loaded ${cmd.name}`);
				} catch (e) {
					console.error(`Unable to load ${command.split(".")[0]} ${e}`);
				}
			});
		});
		console.log(`Loaded All Commands`);
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

    public async loadSlashCommands(){
        console.log(`Loading Slash Commands`);
		fs.readdirSync("dist/slashCommands/").forEach((category) => {
			console.log(`Loading (/) Category: ${category}`);
			fs.readdirSync(`dist/slashCommands/${category}`).map((command) => {
                const file: BaseSlashCommand = new (require(`../slashCommands/${category}/${command}`).default)(this)
                if(!file || !file.name) return
                this.slashCommands.set(file.name, file)
                // @ts-expect-error
                this.arrayOfSlashCommands.push(file)
                console.log(file)
                const commandOptions: ApplicationCommandOptionData[] = [];

					command.args?.forEach((arg) => {
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
		});
    }
}
