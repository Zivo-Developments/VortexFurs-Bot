import { GuildMember, InviteStageInstance, Message, MessageEmbed } from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver } from "../utils/resolvers";

export default class MemberCreateEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "messageUpdate",
		});
	}
	async run(client: FuzzyClient, oldMsg: Message, newMsg: Message) {
		if (!newMsg.guild) return;
		const guildData = await client.database.getCustomRepository(GuildRepo).findOne({ guildID: newMsg.guild.id });
		const messageLogsChannel = await channelResolver(client, guildData?.messageLogChannelID!);
		if (newMsg) if (newMsg.partial) await newMsg.fetch();
		if (newMsg.author.id === client.user!.id || newMsg.channel.type === "DM") return;
		const display = new MessageEmbed()
			.setTitle("A message was edited")
			.addField("Old", `${oldMsg.partial ? "Unknown Message" : oldMsg.cleanContent}`)
			.addField("New", `${newMsg.partial ? "Unknown Message" : newMsg.cleanContent}`)
			.setAuthor(`${newMsg.author.tag}`, `${newMsg.author.displayAvatarURL({ dynamic: true })}`)
			.setColor("AQUA")
			.setTimestamp()
			.setFooter(`Channel ID: ${newMsg.channel.id} | Message ID: ${newMsg.id}`);
		if (messageLogsChannel && messageLogsChannel?.isText()) {
			messageLogsChannel.send({ embeds: [display] });
		}
	}
}
