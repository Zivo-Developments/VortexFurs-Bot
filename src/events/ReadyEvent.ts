import {
	ApplicationCommandData,
	ApplicationCommandPermissionData,
	ApplicationCommandPermissions,
	GuildApplicationCommandPermissionData,
} from "discord.js";
import { Client } from "../entity/Client";
import { Guild } from "../entity/Guild";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import { MemberRepo } from "../repositories/MemberRepository";
import BaseEvent from "../structures/BaseEvent";

export default class ReadyEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "ready",
		});
	}
	async run(client: FuzzyClient) {
		const guild = client.guilds.cache.get(client.config.guildID);
		if (!guild) {
			console.error("Cannot find the guild!");
			process.exit();
		}
		const memberRepo = client.database.getCustomRepository(MemberRepo);

		guild.members.cache.each((member) =>
			memberRepo.findOrCreate(
				{ userID: member.id, guildID: guild.id },
				{ guildID: guild.id, userID: member.user.id }
			)
		);

		const fullPerms: GuildApplicationCommandPermissionData[] = [];
		const guildRepo = client.database.getCustomRepository(GuildRepo);
		const guildData = guildRepo.findOrCreate({ guildID: guild.id }, { guildID: guild.id });
		await guild!.commands.set(client.arrayOfSlashCommands).then(async (cmd) => {
			console.log("Setting (/) Permissions");
			const getRoles = (cmdName: string) => {
				const permsRequired = client.arrayOfSlashCommands.find((x) => x.name === cmdName)!.userPermissions;
				if (permsRequired.length === 0) return;
				return guild?.roles.cache.filter((x) => x.permissions.has(permsRequired) && !x.managed);
			};

			const checkOwner = (cmdName: string) => {
				return client.arrayOfSlashCommands.find((x) => x.name === cmdName)!.ownerOnly;
			};

			cmd.forEach((command) => {
				if (checkOwner(command.name)) {
					fullPerms.push({
						id: command.id,
						permissions: [
							{
								id: client.config.ownerID,
								permission: true,
								type: "USER",
							},
						],
					});
				}

				const roles = getRoles(command.name);
				if (!roles) return;
				roles.forEach((role) => {
					let temp: GuildApplicationCommandPermissionData = {
						id: command.id,
						permissions: [
							{
								id: role.id,
								permission: true,
								type: "ROLE",
							},
						],
					};
					fullPerms.push(temp);
				});
			});
			guild?.commands.permissions.set({ fullPermissions: fullPerms });
		});
	}
}
