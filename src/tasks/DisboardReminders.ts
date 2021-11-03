import { ColorResolvable, MessageEmbed, TextChannel } from "discord.js";
import { Schedule } from "../entity/Schedules";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories";
import { channelResolver } from "../utils";

export async function task(client: FuzzyClient, record: Schedule) {
    client._logger.debug("Disboard Reminders has been executed");
    const GuildRepoC = client.database.getCustomRepository(GuildRepo);
    const guildData = await GuildRepoC.findOne({ guildID: record.data.guildID });
    const guild = client.guilds.cache.get(record.data.guildID!);
    if (!guild) if (!guildData?.disboardChannel) return;
    const disboardChannel = (await channelResolver(client, guildData?.disboardChannel!)) as TextChannel;
    const embed = new MessageEmbed()
        .setAuthor(guild?.name!, guild?.iconURL({ dynamic: true })!)
        .setTitle("Bump Reminder!")
        .setColor(client.config.color as ColorResolvable)
        .setDescription(
            "Bump this server by doing `!d bump` here. Doing this will boost our server to the top of the page making it visible for newcomers to join, When you can please bump the server!",
        )
        .setFooter("Thanks ~ Frenzy Furs Staff Team");
    disboardChannel.send({ embeds: [embed], content: `<@&${client.config.bumpReminderRoleID}>` });
    return;
}
