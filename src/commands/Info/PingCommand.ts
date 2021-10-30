import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";

export default class PingCommand extends BaseCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "ping",
            botPermissions: [],
            shortDescription: "Ping the bot!",
            userPermissions: [],
            args: [],
            cooldown: 100,
            extendedDescription: "Ping the bot and get it's latency",
        });
    }
    async run(interaction: CommandInteraction) {
        const reply = await interaction.channel!.send("Pinging");
        const embed = new MessageEmbed()
            .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor("#ff1493"!)
            .addField("Message Latency", `${Math.floor(reply.createdTimestamp - interaction.createdTimestamp)}ms`)
            .addField("API Latency", `${this.client.ws.ping}ms`)
            .setFooter(
                `If there's an Issue please report them to ${
                    this.client.users.cache.get(this.client.config.ownerID)?.tag
                }`,
            );
        reply.delete();
        interaction.reply({ embeds: [embed] });
    }
}
