import { Interaction, Message, MessageActionRow, MessageEmbed, MessageSelectMenu, TextChannel } from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver } from "../utils/resolvers";

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
					content: "Heya, I can only respond to Guild Commands! If you wish to contact staff please use the `/staff` command",
				});
			const cmd = client.commands.get(interaction.commandName);
			if (!cmd)
				return interaction
					.followUp("This command doesn't exist anymore!")
					.then(() => client.guilds.cache.get(client.config.guildID)?.commands.delete(interaction.commandName));
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
			try {
				await cmd.run(interaction);
			} catch (e) {
				const embed = new MessageEmbed()
					.setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }))
					.setColor("RED")
					.setDescription(`${e}`)
					.setFooter(`If this isn't a fixable problem on your side please dm ${client.users.cache.get(client.config.ownerID)!.tag}`);
				interaction.reply({ embeds: [embed] });
			}
		}

		if (interaction.isButton()) {
			switch (interaction.customId) {
				case "edit-logging":
					const embed = new MessageEmbed()
						.setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }))
						.setColor(client.config.color)
						.setDescription("Please Select from the menu what you want to change!")
						.setFooter(`User ID: ${interaction.user.id}`);
					const menu = new MessageActionRow().addComponents(
						new MessageSelectMenu({
							customId: "menu-change-logging",
							placeholder: "Logging",
							maxValues: 1,
							minValues: 1,
							options: [
								{ label: "Auto-Mod Log Channel", value: "autoModLogChannelID" },
								{ label: "Ban Log Channel", value: "banLogChannelID" },
								{ label: "Channel Log Channel", value: "channelLogChannelID" },
								{ label: "Flag Log Channel", value: "flagLogChannelID" },
								{ label: "Image Log Channel", value: "imageLogChannelID" },
								{ label: "Join log Channel", value: "joinLogChannelID" },
								{ label: "Kick Log Channel", value: "kickLogChannelID" },
								{ label: "Leave Log Channel", value: "leaveLogChannelID" },
								{ label: "Members Log Channel", value: "membersLogChannelID" },
								{ label: "Message Log Channel", value: "messageLogChannelID" },
								{ label: "Mod Commands Log Channel", value: "modCMDsLogChannelID" },
								{ label: "Modmail Log Channel", value: "modmailLogChannelID" },
								{ label: "Nickname Log Channel", value: "nickNameLogChannelID" },
								{ label: "Voice Log Channel", value: "vcLogChannelID" },
								{ label: "Verification Log Channel", value: "verificationLogChannelID" },
							],
						})
					);
					const msg = await interaction.channel?.messages.fetch(interaction.message.id);
					if (!msg) {
						return interaction.reply("Unable to get the message!");
					}
					interaction.reply({ embeds: [embed], components: [menu], ephemeral: true });
					break;
				case "close":
					interaction.deleteReply();
					break;
			}
		}

		if (interaction.isSelectMenu()) {
			await interaction.deferUpdate();
			switch (interaction.customId) {
				case "menu-change-logging":
					const response = await client.utils.awaitReply(
						interaction.channel!,
						"What channel would you like the log to send",
						{
							max: 1,
							time: 60000 * 10,
							filter: (m) => m.author.id === interaction.user.id,
						},
						true
					);
					let channel = await channelResolver(client, response.content);
					const guildRepo = client.database.getCustomRepository(GuildRepo);
					const guildData = await guildRepo.findOne({ guildID: interaction.guild?.id });
					if (channel && channel.isText() && channel instanceof TextChannel) {
						// @ts-expect-error
						if (guildData[interaction.values[0]] === channel.id) {
							return interaction.editReply("**You can't set the channel to what it currently is**");
						}
						guildRepo.update({ guildID: interaction.guild!.id }, { [interaction.values[0]]: channel.id }).then(() => {
							const success = new MessageEmbed()
								.setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }))
								.setColor(client.config.color)
								.setDescription(`${interaction.values[0]} is now set to ${channel}!`)
								.setFooter(`User ID: ${interaction.user.id}`);
							interaction.channel?.send({ embeds: [success] }).then((m) => {
								setTimeout(() => {
									m.delete();
								}, 60000);
							});
						});
					} else {
						do {
							const response = await client.utils.awaitReply(
								interaction.channel!,
								"**We cannot find the channel! Make sure you mention or provide the id of that channel** Please send the channel (in a correct form)",
								{
									max: 1,
									time: 60000 * 10,
									filter: (m) => m.author.id === interaction.user.id,
								},
								true
							);
							channel = await channelResolver(client, response.content);
						} while (!channel);
						guildRepo.update({ guildID: interaction.guild!.id }, { [interaction.values[0]]: channel.id }).then(() => {
							const success = new MessageEmbed()
								.setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }))
								.setColor(client.config.color)
								.setDescription(`${interaction.values[0]} is now set to ${channel}!`)
								.setFooter(`User ID: ${interaction.user.id}`);
							interaction.channel?.send({ embeds: [success] }).then((m) => {
								setTimeout(() => {
									m.delete();
								}, 60000);
							});
						});
					}
			}
		}
	}
}
