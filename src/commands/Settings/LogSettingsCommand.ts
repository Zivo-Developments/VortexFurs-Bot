import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import { GuildRepo } from "../../repositories/GuildRepository";
import BaseSlashCommand from "../../structures/BaseCommand";

export default class LogSettingsCommand extends BaseSlashCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "settings",
			shortDescription: "Set the bot's Logging Settings",
			cooldown: 0,
			args: [
				{
					name: "logging",
					description: "Manage Logging-Related Settings",
					type: "SUB_COMMAND",
				},
			],
			userPermissions: ["MANAGE_GUILD"],
			botPermissions: [],
		});
	}
	async run(interaction: CommandInteraction) {
		const guildRepo = this.client.database.getCustomRepository(GuildRepo);
		const guildData = await guildRepo.findOne({ guildID: interaction.guild?.id });
		if (interaction.options.getSubcommand() === 'logging') {
			const embed = new MessageEmbed()
				.setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }))
				.addFields([
					{
						name: "autoModLogChannelID",
						value: `${guildData!["autoModLogChannelID"] ? guildData!["autoModLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "banLogChannelID",
						value: `${guildData!["banLogChannelID"] ? guildData!["banLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "channelLogChannelID",
						value: `${guildData!["channelLogChannelID"] ? guildData!["channelLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "flagLogChannelID",
						value: `${guildData!["flagLogChannelID"] ? guildData!["flagLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "imageLogChannelID",
						value: `${guildData!["imageLogChannelID"] ? guildData!["imageLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "joinLogChannelID",
						value: `${guildData!["joinLogChannelID"] ? guildData!["joinLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "kickLogChannelID",
						value: `${guildData!["kickLogChannelID"] ? guildData!["kickLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "leaveLogChannelID",
						value: `${guildData!["leaveLogChannelID"] ? guildData!["leaveLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "membersLogChannelID",
						value: `${guildData!["membersLogChannelID"] ? guildData!["membersLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "messageLogChannelID",
						value: `${guildData!["messageLogChannelID"] ? guildData!["messageLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "modCMDsLogChannelID",
						value: `${guildData!["modCMDsLogChannelID"] ? guildData!["modCMDsLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "modmailLogChannelID",
						value: `${guildData!["modmailLogChannelID"] ? guildData!["modmailLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "nickNameLogChannelID",
						value: `${guildData!["nickNameLogChannelID"] ? guildData!["nickNameLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "vcLogChannelID",
						value: `${guildData!["vcLogChannelID"] ? guildData!["vcLogChannelID"] : "Not Set"}`,
						inline: true,
					},
					{
						name: "verificationLogChannelID",
						value: `${guildData!["verificationLogChannelID"] ? guildData!["verificationLogChannelID"] : "Not Set"}`,
						inline: true,
					},
				])
				.setColor(this.client.config.color)
				.setFooter(`User ID: ${interaction.user.id}`);
			const actionButtons = new MessageActionRow().addComponents(
				new MessageButton().setCustomId("edit-logging").setLabel("Edit").setStyle("PRIMARY"),
				new MessageButton().setCustomId("close").setLabel("Close").setStyle("DANGER")
			);
            return interaction.reply({ embeds: [embed], components: [actionButtons], ephemeral: true })
            
		}
	}
}