import { Interaction } from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";
import BaseEvent from "../structures/BaseEvent";

export default class ReadyEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "interactionCreate",
		});
	}
	async run(client: FuzzyClient, interaction: Interaction) {
		if (interaction.isCommand()) {
			if (!interaction.guild)
				interaction.reply({
					content:
						"Heya, I can only respond to Guild Commands! If you wish to contact staff please use the `/staff` command",
				});
			const cmd = client.commands.get(interaction.commandName);
			if (!cmd)
				return interaction
					.followUp("This command doesn't exist anymore!")
					.then(() =>
						client.guilds.cache.get(client.config.guildID)?.commands.delete(interaction.commandName)
					);
			if (cmd.userPermissions.length > 0) {
				cmd.userPermissions.forEach((perm) => {
					const userPerms = interaction.guild?.members.cache.get(interaction.member!.user.id)?.permissions;
					if (!userPerms?.has(perm))
						return interaction.reply({
							content: `:warning: You don't have permission to run this command! Permissions Needed: \`${cmd.userPermissions.join(
								"``, `"
							)}\`
							 `,
							ephemeral: true,
						});
				});
			}

			if (cmd.botPermissions.length > 0) {
				cmd.botPermissions.forEach((perm) => {
					const perms = interaction.guild?.me!.permissions;
					if (!perms?.has(perm))
						return interaction.reply({
							content: `:warning: The bot don't have permission to run this command! Permissions Needed: \`${cmd.userPermissions.join(
								"``, `"
							)}\``,
							ephemeral: true,
						});
				});
			}

			if (cmd.ownerOnly) {
				if (client.config.ownerID !== interaction.user.id)
					return interaction.reply({
						content: `:warning: This command can be only ran by the Owner of the Bot!`,
						ephemeral: true,
					});
			}

			cmd.run(interaction);
		}
	}
}
