import { Message, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";

export default class PingCommand extends BaseCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "ping",
			aliases: ["pong"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: [],
			category: "Information",
			description: "Ping the bot and check it's latency",
			examples: ["<prefix>ping"],
            client: client
		});
	}
	async run(message: Message, args: string[]) {
		const embed = new MessageEmbed()
			.setTitle("Ping Command")
			.setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
			.setColor("#8800FF")
			.addField("API Latency", `${Math.floor(this.client.ws.ping)}ms`)
			.setThumbnail(this.client.user?.displayAvatarURL()!)
			.setFooter(`User ID: ${message.author.id}`, message.author.displayAvatarURL({ dynamic: true }));
		message.reply({ embeds: [embed] });
	}
}