import { GuildMember, InviteStageInstance, Message, MessageEmbed } from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver } from "../utils/resolvers";

export default class MemberCreateEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "messageDelete",
		});
	}
	async run(client: FuzzyClient, message: Message) {
		if (!message.guild) return;
		const guildData = await client.database.getCustomRepository(GuildRepo).findOne({ guildID: message.guild.id });
		const messageLogsChannel = await channelResolver(client, guildData?.messageLogChannelID!);
		if (message) if (message.partial) await message.fetch();
		if (message.author.id === client.user!.id || message.channel.type === "DM") return;
		setTimeout(async () => {
			const fetchedLogs: any = await message.guild?.fetchAuditLogs({
				limit: 5,
				type: "MESSAGE_DELETE",
			});
			const auditLog = fetchedLogs.entries.find((entry: any) => entry.target.id === message.id);
			if (!messageLogsChannel?.isText() || messageLogsChannel.type === "DM") return;
			// Create an embed for the event log channel
			const display = new MessageEmbed()
				.setTitle("A message was deleted")
				.setDescription(`${message.cleanContent}`)
				.setAuthor(`${message.author.tag}`, `${message.author.displayAvatarURL({ dynamic: true })}`)
				.setColor("RED")
				.setTimestamp()
				.setFooter(`Channel ID: ${message.channel.id} | Message ID: ${message.id}`);
			if (auditLog) {
				display.setFooter(
					`Deleted by ${auditLog.executor.tag} | User ID: ${auditLog.executor.id} | Message ID: ${message.id}`,
					`${auditLog.executor.displayAvatarURL({ dynamic: true })}`
				);
			}
			await messageLogsChannel.send({ embeds: [display] });
		}, 1000);
	}
}
