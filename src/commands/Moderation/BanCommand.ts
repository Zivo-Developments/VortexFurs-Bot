import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import { duration } from "moment";
import ms from "ms";
import { ModCase } from "../../entity/ModCase";
import FuzzyClient from "../../lib/FuzzyClient";
import { ModcaseRepo } from "../../repositories/ModcaseRepository";
import BaseCommand from "../../structures/BaseCommand";
import { usernameResolver } from "../../utils/resolvers";

export default class BanCommand extends BaseCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "ban",
			botPermissions: [],
			shortDescription: "Ban a member!",
			userPermissions: ["BAN_MEMBERS"],
			args: [
				{
					description: "Member you're wanting to ban!",
					name: "member",
					type: "STRING",
					required: true,
				},
				{
					name: "reason",
					description: "Reason why are you banning this member",
					type: "STRING",
					required: true,
				},
				{
					name: "rules",
					description: 'Rule Number(s) violated, make sure you seperate them with ",". 0 for none',
					type: "STRING",
					required: true,
				},
			],
			cooldown: 0,
			extendedDescription: "Ban a member off the guild",
		});
	}
	async run(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const member = interaction.guild.members.cache.get(interaction.user.id);
		const violator = await usernameResolver(this.client, interaction, interaction.options.getString("member", true));
		const reason = interaction.options.getString("reason", true);
		const rules = interaction.options.getString("rules", true);
		if (violator instanceof GuildMember) {
			const [pass, err] = await this.client.utils.checkPosition(member!, violator);
			if (!pass) throw new Error(err?.toString());
			await this.client.database.getCustomRepository(ModcaseRepo).createBan(this.client, interaction, violator, reason, rules);
			const embed = new MessageEmbed()
				.setAuthor(violator.user.tag, violator.user.displayAvatarURL())
				.setTitle(`You have been banned from ${interaction.guild.name}`)
				.setColor("RED")
				.addField("Reason", reason);
			if (!rules.split(" ").includes("0")) {
				embed.addField("Rules Violated", rules);
			}
			try {
				violator.send({ embeds: [embed] });
			} catch (e) {
				interaction.reply({ content: "Their ban message haven't been sent, possibly closed dms", ephemeral: true });
			} finally {
				violator.ban({ reason: reason }).then(() => {
					interaction.reply({ content: `User has been banned off the server for ${reason}`, ephemeral: true });
				});
			}
		}
	}
}
