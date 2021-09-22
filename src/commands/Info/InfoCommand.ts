import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseSlashCommand from "../../structures/BaseCommand";

export default class PingCommand extends BaseSlashCommand {
    constructor(client: FuzzyClient){
        super(client, {
            name: "info",
            shortDescription: "Get the bot's information",
            args: [],
            cooldown: 0,
            userPermissions: ["MANAGE_CHANNELS"],
            botPermissions: [],
        })
    }
    async run(interaction: CommandInteraction){
        const embed = new MessageEmbed()
        .setTitle("Information")
        .setDescription("Discord Bot made for Frenzy Furs!")
        .addField("GitHub", "Repository is Private at the moment 🙂")
        .addField("Bugs/Feature Request", `Please DM ${interaction.client.users.cache.get("852070153804972043")}!`)
        .addField("Contributors", "None")
        .setColor(this.client?.config.color!)
        .setThumbnail(interaction.guild?.iconURL({ dynamic: true })!)
        .setFooter(`Bot made by ${interaction.client.users.cache.get("852070153804972043")!.tag}`)
        interaction.reply({ embeds: [embed] })
    }
}