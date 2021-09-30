import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";
import { IssueDiscipline } from "../../utils/IssueDiscipline";
import { usernameResolver } from "../../utils/resolvers";

export default class PingCommand extends BaseCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "warn",
			botPermissions: [],
			shortDescription: "Kicks a member!",
			userPermissions: ["MANAGE_MESSAGES"],
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
				{
					name: "rules",
					description: "Rules violated for the ban seperated with commas",
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
		const member = interaction.guild?.members.cache.get(user.id);
		if (!member) throw new Error("You can only warn members that are in the guild");
		const mod = new IssueDiscipline(this.client, interaction.guild, interaction.user, user, "warning");
		await mod.setReason(reason);
		await mod.addRules("0");
		await mod.warnUser();
		await mod.finish().then(async (discipline) => {
			const embed = new MessageEmbed()
				.setTitle("Warn")
				.setAuthor(`Issued By: ${discipline.issuer.tag}`, discipline.issuer.displayAvatarURL({ dynamic: true }))
				.addField("Violator", `${discipline.violator.tag} (${discipline.violator.id})`)
				.addField("Reason:", discipline.reason)
				.setTimestamp()
				.setFooter(`Issuer ID: ${discipline.issuer.id}`)
				.setColor("YELLOW");
			await interaction.reply({ embeds: [embed] });
		});
	}
}
