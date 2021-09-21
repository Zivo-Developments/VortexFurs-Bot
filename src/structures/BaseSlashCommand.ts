import { CommandOptionChoiceResolvableType, CommandOptionDataTypeResolvable, Interaction, Message, PermissionResolvable } from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";
import type { CommandsOptions } from "../utils/types";

export default abstract class BaseSlashCommand {
    public client?: FuzzyClient
	public args?: ICommandArgsOptions[];
	public cooldown?: number;
	public extendedDescription?: string;
	public group?: string;
	public name?: string;
	public description: string
	public ownerOnly?: boolean;
	public runIn?: 'both' | 'dms' | 'servers';
	public usage?: string;
	constructor(client: FuzzyClient, options: ICommandOptions) {
		this.client = client;
        this.args = options.args 
        this.cooldown = options.cooldown 
        this.extendedDescription = options.extendedDescription 
        this.group = options.group 
        this.name = options.name 
        this.ownerOnly = options.ownerOnly 
        this.runIn = options.runIn 
        this.usage = options.usage 
		this.description = options.shortDescription
	}
    abstract run(interaction: Interaction): void;
}


export interface ICommandOptions {
	args?: ICommandArgsOptions[];
	cooldown?: number;
	extendedDescription?: string;
	group?: string;
	name?: string;
	ownerOnly?: boolean;
	runIn?: 'both' | 'dms' | 'servers';
	shortDescription: string;
	usage?: string;
}

export interface ICommandArgsOptions {
	choices?: CommandOptionChoiceResolvableType[];
	description: string;
	name: string;
	options?: ICommandArgsOptions[];
	required?: boolean;
	type: CommandOptionDataTypeResolvable;
}