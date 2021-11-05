import { ColorResolvable, MessageEmbed, TextChannel } from "discord.js";
import moment from "moment";
import { Schedule } from "../entity/Schedules";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories";

export async function task(client: FuzzyClient, record: Schedule) {
    client._logger.debug("GLOBAL Minute has been executed");
    try {
        const guild = client.guilds.cache.get(client.config.guildID);
        const guildRepo = client.database.getCustomRepository(GuildRepo);
        const guildData = await guildRepo.findOne({ guildID: client.config.guildID });
        const msg = (guild?.channels.cache.get(client.config.statsChannel) as TextChannel).messages.cache.get(
            client.config.statsMessage,
        );
        msg?.fetch()
        const embed = new MessageEmbed()
            .setAuthor(client.user?.username!, client.user?.displayAvatarURL())
            .addField("Message Sent today", `${guildData?.messageCounter}`)
            .setColor(client.config.color as ColorResolvable)
            .setFooter(`Last Updated ${moment().format("LLLL")}`);
        await msg?.channel.send({ embeds: [embed] });
    } catch (e) {
        throw new Error(e as any);
    }
    return;
}
