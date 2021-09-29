import { GuildMember, MessageEmbed } from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver } from "../utils/resolvers";

export default class MemberCreateEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "guildMemberAdd",
		});
	}
	async run(client: FuzzyClient, member: GuildMember) {
		const guildData = await client.database.getCustomRepository(GuildRepo).findOne({ guildID: member.guild.id });
		if (guildData?.joinLogChannelID) {
			const joinChannel = await channelResolver(client, guildData.joinLogChannelID);
			const flagChannel = await channelResolver(client, guildData.flagLogChannelID);
			// TODO: Once Moderation System is Setup make it so it can show how many moderation action was taken on them and info
			if (joinChannel && joinChannel.isText()) {
				const embed = new MessageEmbed()
					.setAuthor(`${member.user.tag} (${member.user.id})`, member.user.displayAvatarURL({ dynamic: true }))
					.setColor("GREEN")
					.setTitle("A Member Joined the Guild!")
					.addField(
						`Account Created`,
						`<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:F> (<t:${Math.floor(
							member.user.createdAt.getTime() / 1000
						)}:R>)`
					)
					.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
					.setTimestamp()
					.setFooter(`User ID: ${member.user.id}`);
				if (moment().subtract(7, "days").isBefore(moment(member.user.createdAt))) {
					embed.addField("🚩 Red Flag!", "The user's account is new!");
				}
				joinChannel.send({ embeds: [embed] });
			}
			if (moment().subtract(7, "days").isBefore(moment(member.user.createdAt)) && flagChannel && flagChannel.isText()) {
				flagChannel.send(`🚩 Red Flag! The ${member}'s (${member.user.id}) account is new!`);
			}
		}
	}
}
