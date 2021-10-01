import { ApplicationCommandPermissions, Interaction, PermissionFlags } from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";
import type { ICommandArgsOptions, ICommandOptions } from "../utils/types";

export default abstract class BaseCommand {
    public client: FuzzyClient
	public args?: ICommandArgsOptions[];
	public cooldown?: number;
	public extendedDescription?: string;
	public group?: string;
	public name: string;
	public description: string
	public ownerOnly?: boolean;
	public runIn?: 'both' | 'dms' | 'servers';
	public usage?: string;
	public userPermissions: Array<keyof PermissionFlags>
	public botPermissions:  Array<keyof PermissionFlags>
	public permissions?: ApplicationCommandPermissions[]
	public defaultPermission: boolean
	constructor(client: FuzzyClient, options: ICommandOptions) {
		this.client = client;
        this.args = options.args 
        this.cooldown = options.cooldown 
        this.extendedDescription = options.extendedDescription 
        this.group = options.group 
        this.name = options.name 
        this.ownerOnly = options.ownerOnly || false
        this.runIn = options.runIn 
        this.usage = options.usage 
		this.description = options.shortDescription
		this.userPermissions = options.userPermissions || []
		this.botPermissions  = options.botPermissions || []
		
	}
    abstract run(interaction: Interaction): void;
}


