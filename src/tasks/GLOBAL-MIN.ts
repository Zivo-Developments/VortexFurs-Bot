import { ColorResolvable, MessageEmbed, TextChannel } from "discord.js";
import moment from "moment";
import { Schedule } from "../entity/Schedules";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories";
import { messageResolver } from "../utils";

export async function task(client: FuzzyClient, record: Schedule) {
    client._logger.debug("GLOBAL Minute has been executed");
    try {
        const guild = client.guilds.cache.get(client.config.guildID);
        const guildRepo = client.database.getCustomRepository(GuildRepo);
        const guildData = await guildRepo.findOne({ guildID: client.config.guildID });
        const channel = guild!.channels.cache.get(client.config.statsChannel) as TextChannel;
        let msg = await messageResolver(channel, client.config.statsMessage);
        if (msg.partial) msg.fetch();
        if (!msg) return
        const embed = new MessageEmbed()
            .setAuthor(client.user?.username!, client.user?.displayAvatarURL())
            .addField("Message Sent today", `${guildData?.messageCounter}`)
            .setColor(client.config.color as ColorResolvable)
            .setFooter(`Last Updated ${moment().format("LLLL")}`);
        await msg.edit({ embeds: [embed] });
    } catch (e) {
        throw new Error(e as any);
    }
    return;
}
