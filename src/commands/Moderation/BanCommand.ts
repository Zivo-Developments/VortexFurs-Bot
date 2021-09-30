import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";
import { IssueDiscipline } from "../../utils/IssueDiscipline";
import { usernameResolver } from "../../utils/resolvers";

export default class PingCommand extends BaseCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "ban",
			botPermissions: ["BAN_MEMBERS"],
			shortDescription: "Bans a member!",
			userPermissions: ["BAN_MEMBERS"],
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
				{
					name: "duration",
					description: "Duration in DAYS",
					type: "NUMBER",
				},
			],
			cooldown: 0,
			extendedDescription: "Bans the member from the server",
		});
	}
	async run(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const target = interaction.options.getString("member", true);
		const reason = interaction.options.getString("reason", true);
		const rules = interaction.options.getString("rules", true);
		const user = await usernameResolver(this.client, interaction, target);
		const duration = interaction.options.getNumber("duration", false);
		if (user === interaction.user) throw new Error("You cannot ban yourself");
		const banned = await interaction.guild?.bans.fetch(user).catch(() => {});
		if (banned) throw new Error("The User is already banned!");
		const member = interaction.guild?.members.cache.get(user.id);
		if (member) {
			const [passed, failedMessage] = await this.client.utils.checkPosition(interaction.member as GuildMember, member);
			if (!passed) throw new Error(failedMessage as string);
		}
		const mod = new IssueDiscipline(this.client, interaction.guild, interaction.user, user, "ban");
		for(let rule in rules.split(",")) mod.addRules(rule)
		await mod.setReason(reason);
		await mod.setBanDuration(duration);
		await mod.setMuteDuration(null)
		if(!duration) mod.setBanDuration(0)
		await mod.setInfo();
		await mod.finish().then(async (discipline) => {
			const embed = new MessageEmbed()
				.setTitle("Ban")
				.setAuthor(`Issued By: ${discipline.issuer.tag}`, discipline.issuer.displayAvatarURL({ dynamic: true }))
				.addField("Violator", `${discipline.violator.tag} (${discipline.violator.id})`)
				.addField("Reason:", discipline.reason)
				.setTimestamp()
				.setFooter(`Issuer ID: ${discipline.issuer.id}`)
				.setColor("RED");
			await interaction.reply({ embeds: [embed] });
		});
	}
}
