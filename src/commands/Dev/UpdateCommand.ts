import beautify from "beautify";
import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseSlashCommand from "../../structures/BaseCommand";
import { exec } from "child_process";

export default class UpdateCommand extends BaseSlashCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "update",
			shortDescription: "Update the Bot!",
			args: [],
			cooldown: 0,
			userPermissions: [],
			botPermissions: [],
			ownerOnly: true,
		});
	}
	async run(interaction: CommandInteraction) {
		// Sends an embed showing the it's updating the bot
		const embed = new MessageEmbed()
			.setAuthor(`${interaction.user.tag}`, `${interaction.user.displayAvatarURL({ dynamic: true })}`)
			.setTitle("📥  Update - Updating bot...")
			.setColor(this.client.config.color!)
			.setDescription("⏲️ This may take a bit...")
			.setTimestamp()
			.setFooter(`User ID: ${interaction.user.id}`);

		// Makes what is sent a message variable
		interaction.reply({ embeds: [embed] });
		exec("git stash", (err, res) => {
			if (err) throw new Error(err.message);
			embed.addField("📥 Git Stash", res);
		});

		exec("git pull origin master", (err, res) => {
			if (err) throw new Error(err.message);
			embed.addField("📥 Git Pull", res);
		});
		exec("yarn", (err, res) => {
			if (err) throw new Error(err.message);
			embed.addField("🧶 Yarn", res);
		});

		embed.setTitle("Update Complete!");
		await interaction.editReply({ embeds: [embed] });
	}
}
