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
        const date = moment().toISOString()
        const data = { day: date, amount: guildData?.messageCounter! }
        const dummy = guildData
        dummy?.messageHistory.push(data)
        await guildRepo.update({ guildID: guild!.id }, { messageCounter: 0, messageHistory: dummy?.messageHistory });
        const channel = guild!.channels.cache.get(client.config.statsChannel);
        if (!channel || !channel.isText()) return;
        let msg;
        msg = channel.messages.cache.get(client.config.statsMessage);
        if (msg) msg = channel.send("Temporary");
        const embed = new MessageEmbed()
            .setAuthor(client.user?.username!, client.user?.displayAvatarURL())
            .addField("Message Sent today", `${guildData?.messageCounter}`)
            .setColor(client.config.color as ColorResolvable)
            .setFooter(`Last Updated ${moment().format("LLLL")}`);
        await channel.send({ embeds: [embed] });
    } catch (e) {
        throw new Error(e as any);
    }
    return;
}
