import { Collection, GuildAuditLogs, Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver } from "../utils/resolvers";

export default class MessageDeleteBulk extends BaseEvent {
    constructor(client: FuzzyClient) {
        super(client, {
            eventName: "messageDeleteBulk",
        });
    }
    async run(client: FuzzyClient, messages: Collection<Snowflake, Message>) {
        const guild = messages.first()?.guild;
        if (!guild) return;
        let data = "";
        messages.toJSON().map(async (message) => {
            data += `+++Message by ${message.author.username}#${message.author.discriminator} (${
                message.author.id
            }), ID ${message.id}, channel ${(message.channel as TextChannel).name}+++\n`;
            data += `-Time: ${moment(message.createdAt).format()}\n`;
            // Write attachment URLs
            message.attachments.toJSON().map((attachment) => {
                data += `-Attachment: ${attachment.url}\n`;
            });
            // Write embeds as JSON
            message.embeds.forEach((embed) => {
                data += `-Embed: ${JSON.stringify(embed)}\n`;
            });
            // Write the clean version of the message content
            data += `${message.cleanContent}\n\n\n`;
        });
        // Create a buffer with the data
        let buffer = Buffer.from(data, "utf-8");

        const guildData = await client.database.getCustomRepository(GuildRepo).findOne({ guildID: guild.id });
        const messageLogsChannel = await channelResolver(client, guildData?.messageLogChannelID!);
        setTimeout(async () => {
            const fetchedLogs: GuildAuditLogs<"MESSAGE_BULK_DELETE"> = await guild?.fetchAuditLogs({
                limit: 1,
                type: "MESSAGE_BULK_DELETE",
            });
            const auditLog = fetchedLogs.entries.first();
            if (!auditLog) return;
            if (!messageLogsChannel?.isText() || messageLogsChannel.type === "DM") return;
            // Create an embed for the event log channel
            const embed = new MessageEmbed()
                .setTitle("A Bulk of messages have been deleted")
                .setDescription(`Deleted ${messages.size} messages from ${messages.first()?.channel.toString()}`)
                .setAuthor(`${auditLog.executor?.tag}`, `${auditLog.executor?.displayAvatarURL({ dynamic: true })}`)
                .setColor("RED")
                .setTimestamp()
                .setFooter(`Channel ID: ${messages.first()?.channel.id}`);
            await messageLogsChannel.send({
                embeds: [embed],
                files: [{ attachment: buffer, name: `bulkDelete_${moment().valueOf()}.txt` }],
            });
        }, 0);
    }
}
