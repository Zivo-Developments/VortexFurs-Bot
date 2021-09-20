import { Message, PermissionResolvable } from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";
import type { CommandsOptions } from "../utils/types";

export default abstract class BaseCommand {
	public client: FuzzyClient;
	public name: string;
	public description: string;
	public aliases: string[];
	public examples: string[];
	public userPermissions: Array<PermissionResolvable>;
	public botPermissions: Array<PermissionResolvable>;
	public category: string;
	constructor(client: FuzzyClient, options: CommandsOptions) {
		this.client = client;
		this.name = options.name;
		this.category = options.category;
		this.aliases = options.aliases || [];
		this.botPermissions = options.botPermissions || [];
		this.description = options.description;
		this.examples = options.examples;
	}
    abstract run(message: Message, args: string[]): void;
}
