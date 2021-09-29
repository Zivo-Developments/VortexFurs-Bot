import { GuildBan, MessageEmbed } from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver } from "../utils/resolvers";

export default class MemberBanEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "guildBanAdd",
		});
	}
	async run(client: FuzzyClient, member: GuildBan) {
		const guildData = await client.database.getCustomRepository(GuildRepo).findOne({ guildID: member.guild.id });
		if (guildData?.banLogChannelID) {
            setTimeout(async () => {
                const fetchedLogs = await member.guild.fetchAuditLogs({
                    limit: 5,
                    type: "MEMBER_BAN_ADD",
                });
                const auditLog = fetchedLogs.entries.find((entry: any) => entry.target.id === member.user.id);
                const banChannel = await channelResolver(client, guildData.banLogChannelID);
                
                if (banChannel && banChannel.isText()) {
                    const embed = new MessageEmbed()
					.setAuthor(`${member.user.tag} (${member.user.id})`, member.user.displayAvatarURL({ dynamic: true }))
					.setColor("RED")
					.setTitle("A Member has been banned from the Guild!")
					.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
					.addField("Ban Reason", member.reason ? member.reason : "None Specified")
					.addField("Issuer", `${auditLog?.executor?.tag}`)
					.setTimestamp()
					.setFooter(`User ID: ${member.user.id}`);
                    banChannel.send({ embeds: [embed] });
                }
            }, 1000)
        }
	}
}
