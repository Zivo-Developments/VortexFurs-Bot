import { GuildMember, MessageEmbed, TextChannel } from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { VerificationRepo } from "../repositories";
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
        const verificationRepo = await client.database.getCustomRepository(VerificationRepo);
        const verification = await verificationRepo.findOne({ guildID: member.guild.id, userID: member.user.id });
        if (guildData?.leaveLogChannelID) {
            const leaveChannel = await channelResolver(client, guildData.leaveLogChannelID);
            const evtChannel = await channelResolver(client, guildData.eventLogChannel);
            const pendingVerificationChannel = (await channelResolver(
                client,
                guildData.pendingVerficiatonChannelID,
            )) as TextChannel;
            const loggingChannel = (await channelResolver(client, guildData.verificationLogChannelID)) as TextChannel;
            if (verification) {
                let pendingMsg = await pendingVerificationChannel.messages.fetch(verification.pendingVerificationID);
                if (guildData?.verificationLogChannelID) {
                    if (verification.questionChannelID) {
                        let questioningChannel = (await channelResolver(
                            client,
                            verification.questionChannelID,
                        )!) as TextChannel;
                        let data: string;
                        let buffer;
                        let messages;
                        data = `ARCHIVE (cached messages only) of deleted text channel ${
                            questioningChannel!.name
                        }, ID ${questioningChannel?.id}\nCreated on ${moment(
                            questioningChannel.createdAt,
                        ).format()}\nDeleted on ${moment().format()}\n\n`;
                        // Iterate through the messages, sorting by ID, and add them to data
                        messages = questioningChannel.messages.cache;
                        messages.toJSON().map((message) => {
                            // Write each message to data
                            data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}+++\n`;
                            data += `-Time: ${moment(message.createdAt).format()}\n`;
                            // Write attachment URLs
                            message.attachments.toJSON().map((attachment) => {
                                data += `-Attachment: ${attachment.url}\n`;
                            });
                            // Write embeds as JSON
                            message.embeds.map((embed) => {
                                data += `-Embed: ${JSON.stringify(embed)}\n`;
                            });
                            // Write the clean version of the message content
                            data += `${message.cleanContent}\n\n\n`;
                        });

                        // Create a buffer with the data
                        buffer = Buffer.from(data, "utf-8");
                        loggingChannel.send({
                            embeds: [pendingMsg?.embeds[0].addField(`STATUS`, `MEMBER LEFT THE SERVER`)!],
                            files: [{ attachment: buffer, name: `${questioningChannel.name}.txt` }],
                        });
                        verificationRepo.delete({ userID: member.user.id, guildID: member.guild!.id });
                        await questioningChannel.delete().catch((e) => {
                            questioningChannel.send(`Unable to delete channel, here's why ${e}`);
                        });
                    } else {
                        if (loggingChannel && loggingChannel.isText()) {
                            loggingChannel.send({
                                embeds: [pendingMsg?.embeds[0].addField(`STATUS`, `MEMBER LEFT THE SERVER`)!],
                            });
                        }
                    }
                    pendingMsg.delete();
                }
            }
            if (leaveChannel && leaveChannel.isText()) {
                // TODO: Once Moderation System is Setup make it so it can show how many moderation action was taken on them and info
                const embed = new MessageEmbed()
                    .setAuthor(
                        `${member.user.tag} (${member.user.id})`,
                        member.user.displayAvatarURL({ dynamic: true }),
                    )
                    .setColor("RED")
                    .setTitle("A Member Left the Guild!")
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .addField(
                        `Time Spent in the Guild`,
                        `${moment.duration(moment().diff(moment(member.joinedAt)), "milliseconds").humanize()}`,
                    )
                    .addField(`Roles`, member.roles.cache.map((role) => role).join(", "))
                    .setTimestamp()
                    .setFooter(`User ID: ${member.user.id}`);
                leaveChannel.send({ embeds: [embed] });
            }
        }
    }
}
