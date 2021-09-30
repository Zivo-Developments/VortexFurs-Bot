import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";
import { IssueDiscipline } from "../../utils/IssueDiscipline";
import { usernameResolver } from "../../utils/resolvers";

export default class PingCommand extends BaseCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "kick",
			botPermissions: ["KICK_MEMBERS"],
			shortDescription: "Kicks a member!",
			userPermissions: ["KICK_MEMBERS"],
			args: [
				{
					name: "member",
					description: "Member to ban (User ID, Mention, or Name/Nick)",
					type: "STRING",
					required: true,
				},
				{
					name: "reason",
					description: "Reason for the ban",
					type: "STRING",
					required: true,
				},
			],
			cooldown: 0,
			extendedDescription: "Kicks the member from the server",
		});
	}
	async run(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const target = interaction.options.getString("member", true);
		const reason = interaction.options.getString("reason", true);
		const user = await usernameResolver(this.client, interaction, target);
		if (user === interaction.user) throw new Error("You cannot kick yourself");
		const member = interaction.guild?.members.cache.get(user.id);
		if (!member) throw new Error("You can only kick members that are in the guild");
		const [passed, failedMessage] = await this.client.utils.checkPosition(
			interaction.member as GuildMember,
			member
		);
		if (!passed) throw new Error(failedMessage as string);
		const mod = new IssueDiscipline(this.client, interaction.guild, interaction.user, user, "kick");
		await mod.setReason(reason);
		await mod.addRules("0");
		await mod.kickUser();
		await mod.finish().then(async (discipline) => {
			const embed = new MessageEmbed()
				.setTitle("Kick")
				.setAuthor(`Issued By: ${discipline.issuer.tag}`, discipline.issuer.displayAvatarURL({ dynamic: true }))
				.addField("Violator", `${discipline.violator.username}(${discipline.violator.id})`)
				.addField("Reason:", discipline.reason)
				.setTimestamp()
				.setFooter(`Issuer ID: ${discipline.issuer.id}`)
				.setColor("RED");
			await interaction.reply({ embeds: [embed] });
		});
	}
}
