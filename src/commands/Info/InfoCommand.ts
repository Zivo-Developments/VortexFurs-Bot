import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseSlashCommand from "../../structures/BaseCommand";

export default class PingCommand extends BaseSlashCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "info",
            shortDescription: "Get the bot's information",
            args: [],
            type: "CHAT_INPUT",
            cooldown: 0,
            userPermissions: [],
            botPermissions: [],
        });
    }
    async run(interaction: CommandInteraction) {
        const embed = new MessageEmbed()
            .setTitle("Information")
            .setDescription(`Discord Bot made for Frenzy Furs!\nDev Team:\n<@852070153804972043> (Lead Dev)\n<@315098355913064461> <@811393103881306123> (Developers)`)
            .addField("GitHub (BOT)", "https://github.com/Frenzy-Furs/Bot")
            .addField("GitHub (WEB)", "Coming Soon")
            .addField("Bugs/Feature Request", `Please DM ${interaction.client.users.cache.get("852070153804972043")}!`)
            .setColor("#ff1493"!)
            .setThumbnail(interaction.guild?.iconURL({ dynamic: true })!)
            .setFooter(`Bot made by Frenzy Furs Development Team`);
        interaction.reply({ embeds: [embed] });
    }
}
