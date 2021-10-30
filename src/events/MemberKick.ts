import { GuildMember, MessageEmbed } from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver } from "../utils/resolvers";

export default class MemberKickEvent extends BaseEvent {
    constructor(client: FuzzyClient) {
        super(client, {
            eventName: "guildMemberRemove",
        });
    }
    async run(client: FuzzyClient, member: GuildMember) {
        const guildData = await client.database.getCustomRepository(GuildRepo).findOne({ guildID: member.guild.id });
        if (guildData?.kickLogChannelID) {
            setTimeout(async () => {
                const fetchedLogs = await member.guild.fetchAuditLogs({
                    limit: 5,
                    type: "MEMBER_KICK",
                });
                const auditLog = fetchedLogs.entries.filter(entry => entry.action === 'MEMBER_KICK').find((entry: any) => entry.target.id === member.id);
                const kickChannel = await channelResolver(client, guildData.kickLogChannelID);

                if (kickChannel && kickChannel.isText() && auditLog?.action === 'MEMBER_KICK') {
                    const embed = new MessageEmbed()
                        .setAuthor(
                            `${member.user.tag} (${member.user.id})`,
                            member.user.displayAvatarURL({ dynamic: true }),
                        )
                        .setColor("RED")
                        .setTitle("A Member has been kicked from the Guild!")
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .addField("Kick Reason", auditLog?.reason ? auditLog.reason : "None Specified")
                        .addField("Issuer", `${auditLog?.executor?.tag}`)
                        .setTimestamp()
                        .setFooter(`User ID: ${member.user.id}`);
                    kickChannel.send({ embeds: [embed] });
                }
            }, 1000);
        }
    }
}
