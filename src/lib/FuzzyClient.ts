import { ApplicationCommand, ApplicationCommandData, ApplicationCommandOptionData, ChatInputApplicationCommandData, Client, ClientOptions, Collection, ColorResolvable } from "discord.js";
import fs from "fs";
import { NamespaceExport } from "typescript";
import BaseCommand from "../structures/BaseCommand";

export default class FuzzyClient extends Client {
	commands: Collection<string, BaseCommand>;
	aliases: Collection<string, string>;
	arrayOfSlashCommands: (ChatInputApplicationCommandData & BaseCommand)[];
	config: { color: ColorResolvable, guildID: string, ownerID: string };
	constructor(opts: ClientOptions) {
		super(opts);
		this.config = require('../../config.json')
		this.commands = new Collection();
		this.aliases = new Collection();
		this.arrayOfSlashCommands = []
	}

	public async loadCommands() {
		console.log(`Loading Slash Commands`);
		fs.readdirSync("dist/commands/").forEach((category) => {
			console.log(`Loading (/) Category: ${category}`);
			fs.readdirSync(`dist/commands/${category}`).forEach((command) => {
				const file: BaseCommand = new (require(`../commands/${category}/${command}`).default)(this);
				if (!file || !file.name) return;
				this.commands.set(file.name, file);
				if(file.userPermissions.length > 0 || file.ownerOnly) file.defaultPermission = false 
				this.arrayOfSlashCommands.push(file);
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


}
