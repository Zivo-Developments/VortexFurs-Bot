import { CommandInteraction, Interaction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseSlashCommand from "../../structures/BaseSlashCommand";

export default class PingCommand extends BaseSlashCommand {
    constructor(client: FuzzyClient){
        super(client, {
            name: "info",
            shortDescription: "Get the bot's information",
            args: [],
            cooldown: 0,
        })
    }
    async run(interaction: CommandInteraction){
        const embed = new MessageEmbed()
        .setTitle("Information")
        .setDescription("Discord Bot made for Frenzy Furs!")
        .setColor("#8800FF")
        .setFooter(`Bot made by ${interaction.client.users.cache.get("852070153804972043")!.tag}`)
        interaction.reply({ embeds: [embed] })
    }
}