import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import { duration } from "moment";
import ms from "ms";
import { ModCase } from "../../entity/ModCase";
import FuzzyClient from "../../lib/FuzzyClient";
import { ModcaseRepo } from "../../repositories/ModcaseRepository";
import BaseCommand from "../../structures/BaseCommand";
import { usernameResolver } from "../../utils/resolvers";

export default class KickCommand extends BaseCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "kick",
			botPermissions: [],
			shortDescription: "Kick a member!",
			userPermissions: ["KICK_MEMBERS"],
			args: [
				{
					description: "Member you're wanting to ban! (Username, Mention, User ID)",
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
			],
			cooldown: 0,
			extendedDescription: "Kick a member off the guild",
		});
	}
	async run(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const member = interaction.guild.members.cache.get(interaction.user.id);
		const violator = interaction.guild.members.cache.get(
			(await usernameResolver(this.client, interaction, interaction.options.getString("member", true))).id
		);
		const reason = interaction.options.getString("reason", true);
		if (violator) {
			const [pass, err] = await this.client.utils.checkPosition(member!, violator);
			if (!pass) throw new Error(err);
			await this.client.database.getCustomRepository(ModcaseRepo).createKick(this.client, interaction, violator, reason);
			const embed = new MessageEmbed()
				.setAuthor(violator.user.tag, violator.user.displayAvatarURL())
				.setTitle(`You have been kicked from ${interaction.guild.name}`)
				.setColor("YELLOW")
				.addField("Reason", reason);
			try {
				violator.send({ embeds: [embed] });
			} catch (e) {
				interaction.reply({ content: "Their ban message haven't been sent, possibly closed dms", ephemeral: true });
			} finally {
				violator.kick(reason).then(() => {
					interaction.reply({ content: `User has been Kicked off the server for ${reason}`, ephemeral: true });
				});
			}
		}
	}
}
