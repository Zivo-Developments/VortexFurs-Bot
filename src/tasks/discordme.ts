import {
    ButtonInteraction,
    ColorResolvable,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    TextChannel,
} from "discord.js";
import { Schedule } from "../entity/Schedules";
import FuzzyClient from "../lib/FuzzyClient";
import { channelResolver } from "../utils";

export async function task(client: FuzzyClient, record: Schedule) {
    client._logger.debug("DiscordME Task has been executed");
    const guild = client.guilds.cache.get(record.data.guildID!);
    const staffChat = (await channelResolver(client, client.config.discordMeChannel!)) as TextChannel;
    const supressBtn = new MessageActionRow().addComponents(
        new MessageButton({ customId: "supress", label: "Supress", style: "PRIMARY" }),
    );
    const filter: (m: MessageComponentInteraction) => boolean = (m) => {
        m.deferUpdate();
        return true;
    };
    const embed = new MessageEmbed()
        .setAuthor(guild?.name!, guild?.iconURL({ dynamic: true })!)
        .setTitle("Bump Reminder!")
        .setColor(client.config.color as ColorResolvable)
        .setURL("https://disboard.org/dashboard")
        .setDescription(
            "Bump this server by doing [Going to https://disboard.org/dashboard](https://disboard.org/dashboard) and clicking on the bump button as soon as it hits 00:00:02.",
        )
        .setFooter("Press the supress button to supress the bump reminder");
    const m = await staffChat.send({
        embeds: [embed],
        content: `<@&${client.config.discordMeVoteRoleID}>`,
        components: [supressBtn],
    });
    const buttonPush = await m!
        .awaitMessageComponent({
            filter,
            time: 60000 * 60,
        })
        .catch((e) => client._logger.error(e));
    if (buttonPush) {
        m.edit(`Bump Supressed. Thanks ${buttonPush.user}!`);
    }

    return;
}
