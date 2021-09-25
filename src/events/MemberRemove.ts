import { GuildMember, InviteStageInstance, MessageEmbed } from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver } from "../utils/resolvers";

export default class MemberCreateEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "guildMemberRemove",
		});
	}
	async run(client: FuzzyClient, member: GuildMember) {
		const guildData = await client.database.getCustomRepository(GuildRepo).findOne({ guildID: member.guild.id });
		if (guildData?.leaveLogChannelID) {
			const leaveChannel = await channelResolver(client, guildData.leaveLogChannelID);
			const evtChannel = await channelResolver(client, guildData.eventLogChannel);

			member.guild.invites.fetch().then((inv) => {
				inv.filter((invite) => typeof invite.inviter === "undefined" || invite.inviter === null || invite.inviter.id === member.id).each(
					async (delInv) => {
						delInv.delete().then(() => {
							if (evtChannel && evtChannel.isText()) {
								evtChannel.send(`**Deleted Invite** ${delInv.code}`);
							}
						});
					}
				);
			});

			if (leaveChannel && leaveChannel.isText()) {
				// TODO: Once Moderation System is Setup make it so it can show how many moderation action was taken on them and info
				const embed = new MessageEmbed()
					.setAuthor(`${member.user.tag} (${member.user.id})`, member.user.displayAvatarURL({ dynamic: true }))
					.setColor("RED")
					.setTitle("A Member Joined the Guild!")
					.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
					.addField(`Time Spent in the Guild`, `<t:${member.joinedAt}:R>`)
					.addField(`Roles`, member.roles.cache.map((role) => role).join(", "))
					.setTimestamp()
					.setFooter(`User ID: ${member.user.id}`);
				leaveChannel.send({ embeds: [embed] });
			}
		}
	}
}
