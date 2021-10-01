import {
    ButtonInteraction,
    CollectorFilter,
    CommandInteraction,
    Interaction,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    MessageSelectMenu,
} from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";
import { GuildRepo } from "../../repositories/GuildRepository";
import { channelResolver } from "../../utils/resolvers";
import { TextChannel } from "discord.js";

export default class ConfigCommand extends BaseCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "config",
            botPermissions: [],
            shortDescription: "Configure the bot!",
            userPermissions: ["MANAGE_GUILD"],
            args: [
                {
                    name: "logging",
                    type: "SUB_COMMAND",
                    description: "Change logging configurations",
                },
                {
                    name: "verification",
                    type: "SUB_COMMAND",
                    description: "Change logging configurations",
                },
            ],
            cooldown: 100,
            extendedDescription: "Ping the bot and get it's latency",
        });
    }
    async run(interaction: CommandInteraction) {
        interaction.reply("Settings");
        const guildRepo = this.client.database.getCustomRepository(GuildRepo);
        const guildData = await guildRepo.findOne({
            guildID: interaction.guild!.id,
        });
        const loggingSettings = [
            "autoModLogChannelID",
            "banLogChannelID",
            "channelLogChannelID",
            "flagLogChannelID",
            "imageLogChannelID",
            "joinLogChannelID",
            "kickLogChannelID",
            "leaveLogChannelID",
            "membersLogChannelID",
            "messageLogChannelID",
            "modCMDsLogChannelID",
            "modmailLogChannelID",
            "nickNameLogChannelID",
            "vcLogChannelID",
            "modLogChannelID",
            "eventLogChannel",
            "verificationLogChannelID",
        ];
        const filter: (m: MessageComponentInteraction) => boolean = (m) => {
            m.deferUpdate();
            return m.user.id === interaction.user.id;
        };

        switch (interaction.options.getSubcommand()) {
            case "verification":
                interaction.reply("This part is not setup!");
            case "logging":
                const button = new MessageActionRow().addComponents(
                    new MessageButton().setStyle("PRIMARY").setEmoji("✏️").setLabel("Edit").setCustomId("edit-logging"),
                );
                const info = new MessageEmbed()
                    .setAuthor(
                        interaction.user.tag,
                        interaction.user.displayAvatarURL({
                            dynamic: true,
                        }),
                    )
                    .setTitle("Logging Settings")
                    .setColor(this.client.config.color);
                loggingSettings.forEach((setting) =>
                    info.addField(
                        setting,
                        // @ts-expect-error
                        guildData[setting]
                            ? // @ts-expect-error: Should get the settings
                              guildData[setting]
                            : "Not Set",
                        true,
                    ),
                );
                const msg = await interaction.channel!.send({ embeds: [info], components: [button] });
                const buttonPush = await msg
                    .awaitMessageComponent({
                        filter,
                        componentType: "BUTTON",
                        time: 60000 * 5,
                    })
                    .catch(() => msg.delete().catch(() => {}));
                if (buttonPush) {
                    msg.delete();
                    const embed = new MessageEmbed()
                        .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }))
                        .setColor(this.client.config.color)
                        .setDescription("Please Select from the menu what you want to change!")
                        .setFooter(`User ID: ${interaction.user.id}`);
                    const menu = new MessageActionRow().addComponents(
                        new MessageSelectMenu({
                            customId: "menu-change-logging",
                            placeholder: "Logging",
                            maxValues: 1,
                            minValues: 1,
                            options: [
                                {
                                    label: "Auto-Mod Log Channel",
                                    value: "autoModLogChannelID",
                                    description: "This is used to log any auto-moderation stuff",
                                },
                                {
                                    label: "Ban Log Channel",
                                    value: "banLogChannelID",
                                    description: "This is used to log any bans",
                                },
                                {
                                    label: "Channel Log Channel",
                                    value: "channelLogChannelID",
                                    description: "This is used to log any channel add/delete events",
                                },
                                {
                                    label: "Flag Log Channel",
                                    value: "flagLogChannelID",
                                    description: "This is used to log any channels with any susipious factors",
                                },
                                {
                                    label: "Image Log Channel",
                                    value: "imageLogChannelID",
                                    description: "This will be used to log any deleted images",
                                },
                                {
                                    label: "Join log Channel",
                                    value: "joinLogChannelID",
                                    description: "This is used to log Joins",
                                },
                                {
                                    label: "Kick Log Channel",
                                    value: "kickLogChannelID",
                                    description: "This is used to log Kicks",
                                },
                                {
                                    label: "Leave Log Channel",
                                    value: "leaveLogChannelID",
                                    description: "This is used to log Joins",
                                },
                                {
                                    label: "Members Log Channel",
                                    value: "membersLogChannelID",
                                    description:
                                        "This is used to log Member changes with Profile Pictures and Usernames",
                                },
                                {
                                    label: "Message Log Channel",
                                    value: "messageLogChannelID",
                                    description: "This is used to log Any Edited/Deleted Messages",
                                },
                                {
                                    label: "Mod Commands Log Channel",
                                    value: "modCMDsLogChannelID",
                                    description: "This is used to Moderation Commands used",
                                },
                                {
                                    label: "Modmail Log Channel",
                                    value: "modmailLogChannelID",
                                    description: "This is used to log any modmail threads",
                                },
                                {
                                    label: "Nickname Log Channel",
                                    value: "nickNameLogChannelID",
                                    description: "This is used to log Nickname Changes",
                                },
                                {
                                    label: "Voice Log Channel",
                                    value: "vcLogChannelID",
                                    description: "This is any VC Changes Join/Leaves or moves",
                                },
                                {
                                    label: "Verification Log Channel",
                                    value: "verificationLogChannelID",
                                    description: "This is used to log any verification actions",
                                },
                                {
                                    label: "Event Log Channel",
                                    value: "eventLogChannel",
                                    description: "This is used to log any bot events",
                                },
                                {
                                    label: "Mod Log Channel",
                                    value: "modLogChannelID",
                                    description: "Place where all moderation actions goes",
                                },
                            ],
                        }),
                    );

                    const messageTwo = await interaction.channel!.send({ embeds: [embed], components: [menu] });
                    const itemSelected = await messageTwo
                        .awaitMessageComponent({
                            filter,
                            componentType: "SELECT_MENU",
                            time: 60000 * 5,
                        })
                        .catch(() => msg.delete().catch(() => {}));
                    if (itemSelected) {
                        messageTwo.delete();
                        const response = await this.client.utils.awaitReply(
                            interaction.channel!,
                            "What channel would you like the log to send",
                            {
                                max: 1,
                                time: 60000 * 10,
                                filter: (m) => m.author.id === interaction.user.id,
                            },
                            true,
                        );
                        if (response.content !== "cancel") {
                            let channel = await channelResolver(this.client, response.content);
                            if (channel && channel.isText() && channel instanceof TextChannel) {
                                // @ts-expect-error
                                if (guildData[itemSelected.values[0]] === channel.id) {
                                    return interaction.channel!.send(
                                        "**You can't set the channel to what it currently is**",
                                    );
                                }

                                await guildRepo
                                    .update(
                                        { guildID: interaction.guild!.id },
                                        // @ts-expect-error
                                        { [itemSelected.values[0]]: channel.id },
                                    )
                                    .then(() => {
                                        const success = new MessageEmbed()
                                            .setAuthor(
                                                interaction.user.tag,
                                                interaction.user.displayAvatarURL({ dynamic: true }),
                                            )
                                            .setColor(this.client.config.color)
                                            // @ts-expect-error
                                            .setDescription(`${itemSelected.values[0]} is now set to ${channel}!`)
                                            .setFooter(`User ID: ${interaction.user.id}`);
                                        interaction.channel?.send({ embeds: [success] }).then((m) => {
                                            setTimeout(() => {
                                                m.delete();
                                            }, 60000);
                                        });
                                    });
                            } else {
                                do {
                                    const response = await this.client.utils.awaitReply(
                                        interaction.channel!,
                                        "**We cannot find the channel! Make sure you mention or provide the id of that channel** Please send the channel (in a correct form)",
                                        {
                                            max: 1,
                                            time: 60000 * 10,
                                            filter: (m) => m.author.id === interaction.user.id,
                                        },
                                        true,
                                    );
                                    channel = await channelResolver(this.client, response.content);
                                } while (!channel);
                                await guildRepo
                                    // @ts-expect-error
                                    .update({ guildID: interaction.guild!.id }, { [interaction.values[0]]: channel.id })
                                    .then(() => {
                                        const success = new MessageEmbed()
                                            .setAuthor(
                                                interaction.user.tag,
                                                interaction.user.displayAvatarURL({ dynamic: true }),
                                            )
                                            .setColor(this.client.config.color)
                                            // @ts-expect-error
                                            .setDescription(`${interaction.values[0]} is now set to ${channel}!`)
                                            .setFooter(`User ID: ${interaction.user.id}`);
                                        interaction.editReply({ embeds: [success] });
                                    });
                            }
                        }
                        return;
                    }
                }
        }
    }
}
