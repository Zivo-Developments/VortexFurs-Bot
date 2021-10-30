import {
    Interaction,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    TextBasedChannels,
    TextChannel,
} from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import { VerificationRepo } from "../repositories/VerificationRepo";
import BaseEvent from "../structures/BaseEvent";
import Verification from "../utils/Verification";

export default class InteractionCreateEvent extends BaseEvent {
    constructor(client: FuzzyClient) {
        super(client, {
            eventName: "interactionCreate",
        });
    }
    async run(client: FuzzyClient, interaction: Interaction) {
        if (interaction.isCommand()) {
            if (!interaction.guild)
                interaction.reply({
                    content:
                        "Heya, I can only respond to Guild Commands! If you wish to contact staff please use the `/staff` command",
                });
            const cmd = client.commands.get(interaction.commandName);
            if (!cmd)
                return interaction
                    .followUp("This command doesn't exist anymore!")
                    .then(() =>
                        client.guilds.cache.get(client.config.guildID)?.commands.delete(interaction.commandName),
                    );
            if (cmd.userPermissions.length > 0) {
                cmd.userPermissions.forEach((perm) => {
                    const userPerms = interaction.guild?.members.cache.get(interaction.member!.user.id)?.permissions;
                    if (!userPerms?.has(perm))
                        return interaction.reply({
                            content: `:warning: You don't have permission to run this command! Permissions Needed: \`${cmd.userPermissions.join(
                                "``, `",
                            )}\``,
                            ephemeral: true,
                        });
                });
            }

            if (cmd.botPermissions.length > 0) {
                cmd.botPermissions.forEach((perm) => {
                    const perms = interaction.guild?.me!.permissions;
                    if (!perms?.has(perm))
                        return interaction.reply({
                            content: `:warning: The bot don't have permission to run this command! Permissions Needed: \`${cmd.userPermissions.join(
                                "``, `",
                            )}\``,
                            ephemeral: true,
                        });
                });
            }

            if (cmd.ownerOnly) {
                if (client.config.ownerID !== interaction.user.id)
                    return interaction.reply({
                        content: `:warning: This command can be only ran by the Owner of the Bot!`,
                        ephemeral: true,
                    });
            }
            try {
                await cmd.run(interaction);
            } catch (e: unknown) {
                client._logger.error(e instanceof Error ? `${e.message}\n${e.stack}` : (e as string));
                const embed = new MessageEmbed()
                    .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }))
                    .setColor("RED")
                    .setDescription(`${e}`)
                    .setFooter(
                        `If this isn't a fixable problem on your side please dm ${
                            client.users.cache.get(client.config.ownerID)!.tag
                        }`,
                    );
                return interaction.reply({ embeds: [embed] });
            }
        }

        if (interaction.isButton()) {
            const filter: (m: MessageComponentInteraction) => boolean = (m) => {
                m.deferUpdate();
                return m.user.id === interaction.user.id;
            };
            // Der the button
            interaction.deferUpdate();
            if (interaction.customId === "start-verification") {
                const verify = new Verification(client, interaction.user, interaction.guild!);
                const embed = new MessageEmbed()
                    .setTitle("Welcome to Frenzy Furs Verification!")
                    .setDescription(
                        `This verification will have ${verify.questions.length} questions and should only take less than 5 minutes`,
                    )
                    .setColor("#ff1493")
                    .setFooter("Please make sure put effort and be specific with your answers");
                // Make a button row w/ a button
                const buttonRow = new MessageActionRow().addComponents(
                    new MessageButton({
                        customId: "continue",
                        label: "Continue",
                        style: "SUCCESS",
                    }),
                );

                const m = await interaction.user.send({ embeds: [embed], components: [buttonRow] }).catch(() => {
                    return interaction.channel?.send(
                        `${interaction.user}, your dms are closed! Please make sure they're open so I can dm you! `,
                    );
                });
                const msg = await interaction.channel!.send(`Check your DMs ${interaction.user}!`);
                setTimeout(() => msg.delete(), 60000);
                // Wait for the button to be pushed
                const buttonPush = await m!
                    .awaitMessageComponent({
                        filter,
                        time: 60000 * 10,
                    })
                    .catch((e) => client._logger.error(e));
                if (buttonPush) {
                    // Begin the Verification process
                    await verify.beginVerification();
                    return;
                }
            } else if (["BAN", "KICK", "ACCEPT", "DENY", "QUESTION"].includes(interaction.customId.split("-")[0])) {
                // Check if the database is active and it's being pressed inside a guild
                if (!client.database || !interaction.guild) return;
                let messages;
                let buffer;
                let data: string;
                // Get the Guild, Verification Stuff
                const guild = client.guilds.cache.get(interaction.guild.id);
                const verifyRepo = client.database.getCustomRepository(VerificationRepo);
                const verify = await verifyRepo.findOne({
                    guildID: guild!.id,
                    pendingVerificationID: interaction.message.id,
                });

                if (verify) {
                    const guildRepo = client.database.getCustomRepository(GuildRepo);
                    const guildData = await guildRepo.findOne({ guildID: guild?.id });
                    const loggingChannel =
                        (await guild?.channels.cache.get(guildData!.verificationLogChannelID)) || null;
                    const pendingVerificationMsg = await interaction.channel?.messages.fetch(interaction.message.id);
                    // Get the member being verified
                    const verifyingMember = guild?.members.cache.get(verify.userID);
                    // If the bot is unable to get the user, assume that the user left.
                    if (!verifyingMember) {
                        if (guildData?.verificationLogChannelID) {
                            if (loggingChannel && loggingChannel.isText()) {
                                loggingChannel.send({
                                    embeds: [
                                        pendingVerificationMsg?.embeds[0].addField(`STATUS`, `MEMBER LEFT THE SERVER`)!,
                                    ],
                                });
                            }
                        }
                        pendingVerificationMsg!.delete();
                        return;
                    }

                    switch (interaction.customId.split("-")[0]) {
                        // Ban Buttons was pushed
                        case `BAN`:
                            const banReason = await client.utils.awaitReply(
                                interaction.channel!,
                                "Why are you wanting to ban that member?",
                                {
                                    filter: (m) => m.author.id === interaction.user.id,
                                    max: 1,
                                    time: 60000 * 10,
                                },
                                true,
                            );
                            if (banReason && banReason.content.toLowerCase() !== "cancel") {
                                verifyingMember.send(`You're banned from ${guild!.name} for ${banReason.content}`);
                                verifyingMember.ban({
                                    reason: `Banned from the verification for ${banReason.content}`,
                                });
                                const bannedmsg = await pendingVerificationMsg?.channel
                                    .send("User has been banned!")
                                    .catch(async (m) => {
                                        let unability = await m.channel.send("Unable to ban user!");
                                        setTimeout(() => unability!.delete(), 10000);
                                    });
                                setTimeout(() => bannedmsg!.delete(), 10000);
                                if (loggingChannel && loggingChannel?.isText()) {
                                    if (interaction.guild.channels.cache.get(verify.questionChannelID)) {
                                        const questionChannel = interaction.guild.channels.cache.get(
                                            verify.questionChannelID,
                                        )! as TextChannel;
                                        data = `ARCHIVE (cached messages only) of deleted text channel ${
                                            questionChannel.name
                                        }, ID ${questionChannel.id}\nCreated on ${moment(
                                            questionChannel.createdAt,
                                        ).format()}\nDeleted on ${moment().format()}\n\n`;
                                        // Iterate through the messages, sorting by ID, and add them to data
                                        messages = questionChannel.messages.cache;
                                        messages.toJSON().map((message) => {
                                            // Write each message to data
                                            data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}+++\n`;
                                            data += `-Time: ${moment(message.createdAt).format()}\n`;
                                            // Write attachment URLs
                                            message.attachments.toJSON().map((attachment) => {
                                                data += `-Attachment: ${attachment.url}\n`;
                                            });
                                            // Write embeds as JSON
                                            message.embeds.map((embed) => {
                                                data += `-Embed: ${JSON.stringify(embed)}\n`;
                                            });
                                            // Write the clean version of the message content
                                            data += `${message.cleanContent}\n\n\n`;
                                        });

                                        // Create a buffer with the data
                                        buffer = Buffer.from(data, "utf-8");
                                        loggingChannel.send({
                                            embeds: [
                                                pendingVerificationMsg?.embeds[0]
                                                    .addField(`STATUS`, `DENIED/BANNED BY ${interaction.member}`)
                                                    .setDescription(`Deny Reason: ${banReason.content}`)
                                                    .setColor("RED")!,
                                            ],
                                            files: [
                                                {
                                                    attachment: buffer,
                                                    name: `${questionChannel.name}.txt`,
                                                },
                                            ],
                                        });
                                    } else {
                                        loggingChannel.send({
                                            embeds: [
                                                pendingVerificationMsg?.embeds[0]
                                                    .addField(`STATUS`, `DENIED/BANNED BY ${interaction.member}`)
                                                    .setDescription(`Deny Reason: ${banReason.content}`)
                                                    .setColor("RED")!,
                                            ],
                                        });
                                    }
                                }
                                pendingVerificationMsg!.delete();
                                verifyRepo.delete({ userID: verifyingMember.user.id, guildID: interaction.guild.id });
                            } else {
                                return;
                            }
                            break;
                        // Kick Button was pushed
                        case `KICK`:
                            const kickReason = await client.utils.awaitReply(
                                interaction.channel!,
                                "Why are you wanting to kick this member based on their verification.",
                                {
                                    filter: (m) => m.author.id === interaction.user.id,
                                    max: 1,
                                    time: 60000 * 10,
                                },
                                true,
                            );
                            if (kickReason && kickReason.content.toLowerCase() !== "cancel") {
                                verifyingMember.send(`You're kicked from ${guild!.name} for ${kickReason.content}`);
                                verifyingMember.kick(`Kicked from verification for ${kickReason.content}`);
                                const kickedmsg = await pendingVerificationMsg?.channel.send("User has been kicked!");
                                setTimeout(() => kickedmsg!.delete(), 10000);
                                if (loggingChannel && loggingChannel?.isText()) {
                                    if (interaction.guild.channels.cache.get(verify.questionChannelID)) {
                                        const questionChannel = interaction.guild.channels.cache.get(
                                            verify.questionChannelID,
                                        )! as TextChannel;
                                        data = `ARCHIVE (cached messages only) of deleted text channel ${
                                            questionChannel.name
                                        }, ID ${questionChannel.id}\nCreated on ${moment(
                                            questionChannel.createdAt,
                                        ).format()}\nDeleted on ${moment().format()}\n\n`;
                                        // Iterate through the messages, sorting by ID, and add them to data
                                        messages = questionChannel.messages.cache;
                                        messages.toJSON().map((message) => {
                                            // Write each message to data
                                            data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}+++\n`;
                                            data += `-Time: ${moment(message.createdAt).format()}\n`;
                                            // Write attachment URLs
                                            message.attachments.toJSON().map((attachment) => {
                                                data += `-Attachment: ${attachment.url}\n`;
                                            });
                                            // Write embeds as JSON
                                            message.embeds.map((embed) => {
                                                data += `-Embed: ${JSON.stringify(embed)}\n`;
                                            });
                                            // Write the clean version of the message content
                                            data += `${message.cleanContent}\n\n\n`;
                                        });

                                        // Create a buffer with the data
                                        buffer = Buffer.from(data, "utf-8");
                                        loggingChannel.send({
                                            embeds: [
                                                pendingVerificationMsg?.embeds[0]
                                                    .addField(`STATUS`, `DENIED/BANNED BY ${interaction.member}`)
                                                    .setDescription(`Deny Reason: ${kickReason.content}`)
                                                    .setColor("RED")!,
                                            ],
                                            files: [
                                                {
                                                    attachment: buffer,
                                                    name: `${questionChannel.name}.txt`,
                                                },
                                            ],
                                        });
                                    } else {
                                        loggingChannel.send({
                                            embeds: [
                                                pendingVerificationMsg?.embeds[0]
                                                    .addField(`STATUS`, `DENIED/KICKED BY ${interaction.member}`)
                                                    .setDescription(`Deny Reason: ${kickReason.content}`)
                                                    .setColor("RED")!,
                                            ],
                                        });
                                    }
                                }
                                pendingVerificationMsg!.delete();
                                if (interaction.guild.channels.cache.get(verify.questionChannelID)) {
                                    interaction.guild.channels.cache.get(verify.questionChannelID)?.delete();
                                }
                                verifyRepo.delete({ userID: verifyingMember.user.id, guildID: interaction.guild.id });
                            } else {
                                return;
                            }
                            break;
                        // Accept button was pushed
                        case `ACCEPT`:
                            verifyingMember.roles.add(guild?.roles.cache.get(guildData?.verifiedRoleID!)!).catch(() => {
                                interaction.channel?.send(
                                    "Unable to give the user the verified role please check your settings!",
                                );
                            });

                            if (loggingChannel && loggingChannel?.isText()) {
                                if (loggingChannel && loggingChannel?.isText()) {
                                    if (interaction.guild.channels.cache.get(verify.questionChannelID)) {
                                        const questionChannel = interaction.guild.channels.cache.get(
                                            verify.questionChannelID,
                                        )! as TextChannel;
                                        data = `ARCHIVE (cached messages only) of deleted text channel ${
                                            questionChannel.name
                                        }, ID ${questionChannel.id}\nCreated on ${moment(
                                            questionChannel.createdAt,
                                        ).format()}\nDeleted on ${moment().format()}\n\n`;
                                        // Iterate through the messages, sorting by ID, and add them to data
                                        messages = questionChannel.messages.cache;
                                        messages.toJSON().map((message) => {
                                            // Write each message to data
                                            data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}+++\n`;
                                            data += `-Time: ${moment(message.createdAt).format()}\n`;
                                            // Write attachment URLs
                                            message.attachments.toJSON().map((attachment) => {
                                                data += `-Attachment: ${attachment.url}\n`;
                                            });
                                            // Write embeds as JSON
                                            message.embeds.map((embed) => {
                                                data += `-Embed: ${JSON.stringify(embed)}\n`;
                                            });
                                            // Write the clean version of the message content
                                            data += `${message.cleanContent}\n\n\n`;
                                        });

                                        // Create a buffer with the data
                                        buffer = Buffer.from(data, "utf-8");
                                        loggingChannel.send({
                                            embeds: [
                                                pendingVerificationMsg?.embeds[0]
                                                    .addField(`STATUS`, `ACCEPTED BY ${interaction.member}`)
                                                    .setColor("GREEN")!,
                                            ],
                                            files: [
                                                {
                                                    attachment: buffer,
                                                    name: `${questionChannel.name}.txt`,
                                                },
                                            ],
                                        });
                                    } else {
                                        loggingChannel.send({
                                            embeds: [
                                                pendingVerificationMsg?.embeds[0]
                                                    .addField(`STATUS`, `ACCEPTED BY ${interaction.member}`)
                                                    .setColor("GREEN")!,
                                            ],
                                        });
                                    }
                                }
                            }

                            pendingVerificationMsg?.delete();
                            if (interaction.guild.channels.cache.get(verify.questionChannelID)) {
                                interaction.guild.channels.cache.get(verify.questionChannelID)?.delete();
                            }
                            verifyRepo.delete({ userID: verifyingMember.user.id, guildID: interaction.guild.id });

                            if (guildData?.generalChannel) {
                                const generalChannel = guild?.channels.cache.get(guildData.generalChannel);
                                if (!guildData.welcomeMessage || !generalChannel || !generalChannel?.isText()) return;
                                const welcomeMessage = guildData.welcomeMessage
                                    .replace("%member", `${verifyingMember}`)
                                    .replace("%guild", interaction.guild.name);
                                const embed = new MessageEmbed()
                                    .setAuthor(
                                        verifyingMember.user.tag,
                                        verifyingMember.user.displayAvatarURL({ dynamic: true }),
                                    )
                                    .setDescription(welcomeMessage)
                                    .setThumbnail(verifyingMember.user.displayAvatarURL({ dynamic: true }))
                                    .setColor("#ff1493")
                                    .setFooter(`If for some reason you need assistance feel free to make a ticket!`);
                                return generalChannel.send({
                                    embeds: [embed],
                                    content: `${
                                        guild?.roles.cache.get(guildData.welcomeRoleID)
                                            ? guild?.roles.cache.get(guildData.welcomeRoleID)
                                            : "[*Welcome role was not set/deleted*]"
                                    } | ${verifyingMember}`,
                                });
                            }

                            break;
                        // Deny Button was pushed
                        case `DENY`:
                            const denyReason = await client.utils.awaitReply(
                                interaction.channel!,
                                "Why are you denying this person?",
                                {
                                    max: 1,
                                    filter: (m) => m.author.id === interaction.user.id,
                                    time: 60000 * 10,
                                },
                                true,
                            );
                            if (denyReason && denyReason.content.toLowerCase() !== "cancel") {
                                denyReason.delete();
                                if (loggingChannel && loggingChannel?.isText()) {
                                    if (interaction.guild.channels.cache.get(verify.questionChannelID)) {
                                        const questionChannel = interaction.guild.channels.cache.get(
                                            verify.questionChannelID,
                                        )! as TextChannel;
                                        data = `ARCHIVE (cached messages only) of deleted text channel ${
                                            questionChannel.name
                                        }, ID ${questionChannel.id}\nCreated on ${moment(
                                            questionChannel.createdAt,
                                        ).format()}\nDeleted on ${moment().format()}\n\n`;
                                        // Iterate through the messages, sorting by ID, and add them to data
                                        messages = questionChannel.messages.cache;
                                        messages.toJSON().map((message) => {
                                            // Write each message to data
                                            data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}+++\n`;
                                            data += `-Time: ${moment(message.createdAt).format()}\n`;
                                            // Write attachment URLs
                                            message.attachments.toJSON().map((attachment) => {
                                                data += `-Attachment: ${attachment.url}\n`;
                                            });
                                            // Write embeds as JSON
                                            message.embeds.map((embed) => {
                                                data += `-Embed: ${JSON.stringify(embed)}\n`;
                                            });
                                            // Write the clean version of the message content
                                            data += `${message.cleanContent}\n\n\n`;
                                        });

                                        // Create a buffer with the data
                                        buffer = Buffer.from(data, "utf-8");
                                        loggingChannel.send({
                                            embeds: [
                                                pendingVerificationMsg?.embeds[0]
                                                    .addField(`STATUS`, `DENIED BY ${interaction.member}`)
                                                    .setDescription(`Deny Reason: ${denyReason.content}`)
                                                    .setColor("RED")!,
                                            ],
                                            files: [
                                                {
                                                    attachment: buffer,
                                                    name: `${questionChannel.name}.txt`,
                                                },
                                            ],
                                        });
                                    } else {
                                        loggingChannel.send({
                                            embeds: [
                                                pendingVerificationMsg?.embeds[0]
                                                    .addField(`STATUS`, `DENIED/KICKED BY ${interaction.member}`)
                                                    .setDescription(`Deny Reason: ${denyReason.content}`)
                                                    .setColor("RED")!,
                                            ],
                                        });
                                    }
                                    const embed = new MessageEmbed()
                                        .setTitle("❌ You're Verification has been denied")
                                        .setAuthor(
                                            verifyingMember.user.tag,
                                            verifyingMember.user.displayAvatarURL({ dynamic: true }),
                                        )
                                        .addField(`Reason`, `${denyReason.content}`)
                                        .setColor("#ff1493")
                                        .setFooter(`You may redo the application`);
                                    verifyingMember.send({ embeds: [embed] });
                                    pendingVerificationMsg!.delete();
                                    if (interaction.guild.channels.cache.get(verify.questionChannelID)) {
                                        interaction.guild.channels.cache.get(verify.questionChannelID)?.delete();
                                    }
                                    verifyRepo.delete({
                                        userID: verifyingMember.user.id,
                                        guildID: interaction.guild.id,
                                    });
                                } else {
                                    return;
                                }
                            }
                            break;
                        // Question Button was pushed
                        case `QUESTION`:
                            if (!interaction.guild.channels.cache.get(verify.questionChannelID)) {
                                const verificationCategory = (pendingVerificationMsg!.channel as TextChannel).parent;
                                await guild?.channels
                                    .create(`Questioning-${verifyingMember.user.username}`, {
                                        parent: verificationCategory?.id,
                                        permissionOverwrites: (pendingVerificationMsg!.channel as TextChannel)
                                            .permissionOverwrites.cache,
                                        reason: `Questioning ${verifyingMember.user.username} started by ${interaction.user.tag}`,
                                    })
                                    .then((chan) => {
                                        const userEmbed = new MessageEmbed()
                                            .setTitle("Staff would like you to ask some questions")
                                            .setThumbnail(verifyingMember.user.displayAvatarURL({ dynamic: true }))
                                            .setAuthor(
                                                verifyingMember.user.tag,
                                                verifyingMember.user.displayAvatarURL({ dynamic: true }),
                                            )
                                            .setColor("#ff1493")
                                            .setDescription(
                                                `Heya ${verifyingMember.user}, Staff would like to ask you a couple of questions in here, you're not in trouble but we're doing this to ensure that you didn't came for trouble to send a message or reply to the staff's question you simply send a message here and I'll send it to the staff`,
                                            )
                                            .setFooter(
                                                "Please be honest with your responses. The Bot will send the staff's question here",
                                            );
                                        const embed = new MessageEmbed(pendingVerificationMsg!.embeds[0]);
                                        chan.send({
                                            content: `You're questioning: ${verifyingMember}\n\nHere's a couple of tips\n- In order to send a message without sending it to the user start it with \`//\`\n- \`!!accept\`, \`!!deny\`, \`!!ban\`, and \`!!kick\` should be used.\n\n${interaction.member}`,
                                            embeds: [embed],
                                        });
                                        verifyingMember.user.send({
                                            embeds: [userEmbed],
                                        });
                                        verify.questioning = true;
                                        verify.questionChannelID = chan.id;
                                        verifyRepo.save(verify);
                                    });
                            } else {
                                interaction.channel?.send(
                                    `Please refer to ${interaction.guild.channels.cache.get(verify.questionChannelID)}`,
                                );
                                (
                                    interaction.guild.channels.cache.get(verify.questionChannelID) as TextBasedChannels
                                ).send(
                                    `${interaction.member} pssst this questioning channel is still open! There's no need to make more!`,
                                );
                            }
                            break;
                    }
                }
            }
        }

        if (interaction.isSelectMenu()) {
        }
    }
}
