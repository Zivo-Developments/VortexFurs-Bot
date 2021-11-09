import { GuildMember, Message, MessageAttachment, MessageEmbed, TextChannel } from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver, messageResolver } from "../utils/resolvers";
import { VerificationRepo } from "../repositories/VerificationRepo";
import Verification from "../utils/Verification";
import { config, getLevelFromXP, getLevelingFromMsg } from "../utils/Leveling";
import { MemberRepo } from "../repositories";

export default class MemberCreateEvent extends BaseEvent {
    constructor(client: FuzzyClient) {
        super(client, {
            eventName: "messageCreate",
        });
    }
    async run(client: FuzzyClient, message: Message) {
        if (message.author.id === "302050872383242240") {
            // If the message is sent by disboard
            if (message.embeds && message.embeds[0].description) {
                // If bump was successful, start the timer
                if (message.embeds[0].description.includes("Bump done")) {
                    await client.scheduleRepo
                        .createSchedule({
                            uid: `disboard`,
                            task: "DisboardReminders",
                            data: { guildID: message.guild!.id },
                            nextRun: moment().add(2, "hours").toISOString(true),
                        })
                        .then(async (data) => {
                            client._logger.debug("Adding Bump to the Schedule");
                            await client.scheduleManager.addSchedule(data);
                        });
                    message.channel.send(
                        `Thanks for Bumping!\nThe next reminder will be at <t:${moment(Date.now())
                            .add(2, "hours")
                            .unix()}:t>`,
                    );
                } else {
                    // IF the bump wasn't success check if the reminder exist otherwise make it

                    // Then send the failed message
                    if (message.embeds[0].description.includes(" minutes")) {
                        let duration = null;
                        message.embeds[0].description.split(" ").forEach((word) => {
                            if (parseInt(word)) duration = word;
                        });
                        const scheduleData = await client.scheduleRepo.findOne({
                            uid: `disboard`,
                            data: { guildID: message.guild!.id },
                        });
                        if (!scheduleData) {
                            await client.scheduleRepo
                                .createSchedule({
                                    uid: `disboard`,
                                    task: "DisboardReminders",
                                    data: { guildID: message.guild!.id },
                                    nextRun: moment().add(duration, "minutes").toISOString(true),
                                })
                                .then(async (data) => {
                                    await client.scheduleManager.addSchedule(data);
                                });
                        }

                        message.channel.send(
                            `Aww Bump didn't go through... try again at <t:${moment(Date.now())
                                .add(duration, "minutes")
                                .unix()}:t>`,
                        );
                    }
                }
            }
            return;
        }
        if (message.author.bot || client.user!.id === message.author.id) return;
        // Check if it was a dm, if so check if they have a verification question open
        const verifyRepo = client.database.getCustomRepository(VerificationRepo);
        const guildRepo = client.database.getCustomRepository(GuildRepo);
        if (message.channel.type == "DM") {
            const verify = await verifyRepo.findOne({ userID: message.author.id, questioning: true });
            if (verify) {
                const verifyingGuild = client.guilds.cache.get(verify.guildID);
                const questioningChannel = verifyingGuild!.channels.cache.get(verify.questionChannelID) as TextChannel;
                if (message.attachments) {
                    const files: MessageAttachment[] = [];
                    message.attachments.forEach((attachment) => {
                        files.push(attachment);
                    });
                    return await questioningChannel
                        .send({
                            content: `**${message.author} || (${message.author.id})**: ${message.content}`,
                            files,
                        })
                        .then(() => message.react("✅"));
                } else {
                    return await questioningChannel
                        .send({ content: `**${message.author} || (${message.author.id})**: ${message.content}` })
                        .then(() => message.react("✅"));
                }
            }
            return;
        } else {
            const verify = await verifyRepo.findOne({ questionChannelID: message.channel.id, questioning: true });
            if (verify) {
                const guildData = await guildRepo.findOne({ guildID: message.guild?.id })!;
                if (!message.content.startsWith("//")) {
                    const verifyingUser = client.users.cache.get(verify.userID);
                    if (!verifyingUser) {
                        message.channel.send("User has left the server");
                        const questioningChannel = message.guild!.channels.cache.get(
                            verify.questionChannelID,
                        ) as TextChannel;
                        questioningChannel.delete();
                        await Verification.DeleteVerification(client, verify.userID, verify.guildID);
                        const pendingChannel = message.guild?.channels.cache.get(
                            guildData?.pendingVerficiatonChannelID!,
                        ) as TextChannel;
                        if (pendingChannel) {
                            pendingChannel.messages.fetch(verify.pendingVerificationID).then((msg) => {
                                msg.delete();
                            });
                        }
                        return;
                    }

                    if (message.content.startsWith("!!")) {
                        let data: string;
                        let buffer;
                        let messages;
                        const verifyingMember = message.guild?.members.cache.get(verifyingUser.id)!;
                        const pendingChannel = message.guild?.channels.cache.get(
                            guildData?.pendingVerficiatonChannelID!,
                        ) as TextChannel;
                        let pendingMsg = await pendingChannel.messages.fetch(verify.pendingVerificationID);
                        if (pendingMsg?.partial) {
                            pendingMsg.fetch();
                        }
                        let loggingChannel =
                            (await message.guild?.channels.cache.get(guildData!.verificationLogChannelID)) || null;
                        switch (message.content.slice(2).trim().split(/ +/g)[0]) {
                            case "ban":
                                const banReason = message.content.split(" ").slice(1).join(" ");
                                if (banReason) {
                                    verifyingMember.send(`You're banned from ${message.guild!.name} for ${banReason}`);
                                    verifyingMember.ban({
                                        reason: `Banned from verification in ${
                                            message.guild!.name
                                        } (For ServerProtector Users) for ${banReason}`,
                                    });
                                    const bannedmsg = await pendingMsg?.channel
                                        .send("User has been banned!")
                                        .catch(async (m) => {
                                            let unability = await m.channel.send("Unable to ban user!");
                                            setTimeout(() => unability!.delete(), 10000);
                                        });
                                    setTimeout(() => bannedmsg!.delete(), 10000);
                                    if (loggingChannel && loggingChannel?.isText()) {
                                        data = `ARCHIVE (cached messages only) of deleted text channel ${
                                            message.channel.name
                                        }, ID ${message.channel.id}\nCreated on ${moment(
                                            message.channel.createdAt,
                                        ).format()}\nDeleted on ${moment().format()}\n\n`;
                                        // Iterate through the messages, sorting by ID, and add them to data
                                        messages = message.channel.messages.cache;
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
                                                pendingMsg?.embeds[0]
                                                    .addField(`STATUS`, `DENIED/BANNED BY ${message.member}`)
                                                    .setDescription(`Deny Reason: ${banReason}`)
                                                    .setColor("RED")!,
                                            ],
                                            files: [{ attachment: buffer, name: `${message.channel.name}.txt` }],
                                        });
                                    }
                                    await Verification.DeleteVerification(client, verify.userID, verify.guildID);
                                    await message.channel.delete().catch((e) => {
                                        message.channel.send(`Unable to delete channel, here's why ${e}`);
                                    });
                                    pendingMsg!.delete();
                                } else {
                                    message.channel.send("Make sure you provide a reason for your bans").then((m) => {
                                        setTimeout(() => m.delete(), 1000 * 60 * 1);
                                    });
                                }
                                break;
                            case "kick":
                                const kickReason = message.content.split(" ").slice(1).join(" ");
                                if (kickReason) {
                                    verifyingMember.send(`You're kicked from ${message.guild!.name} for ${kickReason}`);
                                    verifyingMember.kick(`Kicked from verification for ${kickReason}`);
                                    const kickedmsg = await pendingMsg?.channel.send("User has been kicked!");
                                    setTimeout(() => kickedmsg!.delete(), 10000);
                                    if (loggingChannel && loggingChannel?.isText()) {
                                        data = `ARCHIVE (cached messages only) of deleted text channel ${
                                            message.channel.name
                                        }, ID ${message.channel.id}\nCreated on ${moment(
                                            message.channel.createdAt,
                                        ).format()}\nDeleted on ${moment().format()}\n\n`;
                                        // Iterate through the messages, sorting by ID, and add them to data
                                        messages = message.channel.messages.cache;
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
                                                pendingMsg?.embeds[0]
                                                    .addField(`STATUS`, `DENIED/KICKED BY ${message.member}`)
                                                    .setDescription(`Deny Reason: ${kickReason}`)
                                                    .setColor("RED")!,
                                            ],
                                            files: [{ attachment: buffer, name: `${message.channel.name}.txt` }],
                                        });
                                    }
                                    await Verification.DeleteVerification(client, verify.userID, verify.guildID);
                                    await message.channel.delete().catch((e) => {
                                        message.channel.send(`Unable to delete channel, here's why ${e}`);
                                    });
                                } else {
                                    message.channel.send("Make sure you provide a reason for your kick").then((m) => {
                                        setTimeout(() => m.delete(), 1000 * 60 * 1);
                                    });
                                }
                                pendingMsg!.delete();
                                break;
                            case "accept":
                                pendingMsg!.delete();
                                const r = message.guild?.roles.cache.get(guildData?.verifiedRoleID!);
                                if (!r) return;
                                verifyingMember.roles.add(r);
                                if (loggingChannel && loggingChannel?.isText()) {
                                    data = `ARCHIVE (cached messages only) of deleted text channel ${
                                        message.channel.name
                                    }, ID ${message.channel.id}\nCreated on ${moment(
                                        message.channel.createdAt,
                                    ).format()}\nDeleted on ${moment().format()}\n\n`;
                                    // Iterate through the messages, sorting by ID, and add them to data
                                    messages = message.channel.messages.cache;
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
                                            pendingMsg?.embeds[0]
                                                .addField(`STATUS`, `ACCEPTED BY ${message.member}`)
                                                .setColor("GREEN")!,
                                        ],
                                        files: [{ attachment: buffer, name: `${message.channel.name}.txt` }],
                                    });
                                }
                                if (guildData?.generalChannel) {
                                    await message.channel.delete().catch((e) => {
                                        message.channel.send(`Unable to delete channel, here's why ${e}`);
                                    });
                                    const generalChannel = message.guild?.channels.cache.get(guildData.generalChannel);
                                    if (!guildData.welcomeMessage || !generalChannel || !generalChannel?.isText())
                                        return;
                                    const welcomeMessage = guildData.welcomeMessage
                                        .replace("%member", `${verifyingMember}`)
                                        .replace("%guild", message.guild!.name);
                                    const embed = new MessageEmbed()
                                        .setAuthor(
                                            verifyingMember.user.tag,
                                            verifyingMember.user.displayAvatarURL({ dynamic: true }),
                                        )
                                        .setDescription(welcomeMessage)
                                        .setThumbnail(verifyingMember.user.displayAvatarURL({ dynamic: true }))
                                        .setColor("#ff1493")
                                        .setFooter(
                                            `If for some reason you need assistance feel free to make a ticket!`,
                                        );
                                    generalChannel.send({
                                        embeds: [embed],
                                        content: `${
                                            message.guild?.roles.cache.get(guildData.welcomeRoleID)
                                                ? message.guild?.roles.cache.get(guildData.welcomeRoleID)
                                                : "[*Welcome role was not set/deleted*]"
                                        } | ${verifyingMember}`,
                                    });
                                }
                                break;
                            case "deny":
                                const denyReason = message.content.split(" ").slice(1).join(" ");

                                if (denyReason) {
                                    if (loggingChannel && loggingChannel?.isText()) {
                                        data = `ARCHIVE (cached messages only) of deleted text channel ${
                                            message.channel.name
                                        }, ID ${message.channel.id}\nCreated on ${moment(
                                            message.channel.createdAt,
                                        ).format()}\nDeleted on ${moment().format()}\n\n`;
                                        // Iterate through the messages, sorting by ID, and add them to data
                                        messages = message.channel.messages.cache;
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
                                                pendingMsg?.embeds[0]
                                                    .addField(`STATUS`, `DENIED BY ${message.member}`)
                                                    .setDescription(`Deny Reason: ${denyReason}`)
                                                    .setColor("RED")!,
                                            ],
                                            files: [{ attachment: buffer, name: `${message.channel.name}.txt` }],
                                        });
                                    }
                                    const embed = new MessageEmbed()
                                        .setTitle("❌ You're Verification has been denied")
                                        .setAuthor(verifyingUser.tag, verifyingUser.displayAvatarURL({ dynamic: true }))
                                        .setColor("#ff1493")
                                        .setDescription(`Reason: ${denyReason}\nYou may redo the application`);
                                    verifyingUser.send({ embeds: [embed] });
                                    await message.channel.delete().catch((e) => {
                                        message.channel.send(`Unable to delete channel, here's why ${e}`);
                                    });
                                    pendingMsg!.delete();
                                } else {
                                    message.channel.send("Make sure you provide a reason for your deny").then((m) => {
                                        setTimeout(() => m.delete(), 1000 * 60 * 1);
                                    });
                                }
                                break;
                        }
                        return;
                    } else {
                        if (message.attachments) {
                            const files: MessageAttachment[] = [];
                            message.attachments.forEach((attachment) => {
                                files.push(attachment);
                            });

                            return verifyingUser
                                .send({ content: `**Staff Member**: ${message.content}`, files })
                                .then(() => {
                                    message.react("✅");
                                });
                        } else {
                            return verifyingUser.send({ content: `**Staff Member**: ${message.content}` }).then(() => {
                                message.react("✅");
                            });
                        }
                    }
                }
            }
            const guild = await guildRepo.findOne({ guildID: message.guild!.id });
            await guildRepo.update({ guildID: message.guild!.id }, { messageCounter: guild?.messageCounter! + 1 });
            if (!client.xpCooldown.includes(message.author.id)) {
                const xp = getLevelingFromMsg(message);
                const profile = await client.database
                    .getCustomRepository(MemberRepo)
                    .findOne({ guildID: message.guild!.id, userID: message.author.id });
                if (!profile) return;
                const earningXP = profile.xp + xp;
                const oldLevel = getLevelFromXP(profile.xp);
                const newLevel = getLevelFromXP(earningXP);
                await client.database
                    .getCustomRepository(MemberRepo)
                    .update({ userID: message.author.id, guildID: message.guild!.id }, { xp: earningXP });
                if (newLevel > oldLevel) {
                    let rewarded = false;
                    let reward;
                    if (newLevel % 5 === 0) {
                        reward = config.levelRoles[newLevel];
                        if (reward) {
                            if (reward.add) {
                                reward.add.forEach((roleID) => {
                                    message.member?.roles
                                        .add(message.guild?.roles.cache.get(roleID)!)
                                        .catch((e) => console.error(e));
                                });
                            }
                            if (reward.remove) {
                                reward.remove.forEach((roleID) => {
                                    message.member?.roles
                                        .remove(message.guild?.roles.cache.get(roleID)!)
                                        .catch((e) => console.error(e));
                                });
                            }
                            rewarded = true;
                        }
                    }
                    const embed = new MessageEmbed()
                        .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                        .setTitle("Level Up!")
                        .setDescription(`Congrats, ${message.author.username}! You're now level **${newLevel}**`)
                        .setTimestamp()
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                        .setFooter(`User ID: ${message.author.id}`);
                    if (rewarded) {
                        embed.addField(
                            "Added Roles",
                            reward?.add.map((r) => message.guild?.roles.cache.get(r)!.name).join(", ")!,
                        );
                        embed.addField(
                            "Removed Roles",
                            reward?.remove.map((r) => message.guild?.roles.cache.get(r)!.name).join(", ")!,
                        );
                    }
                    message.channel.send({ embeds: [embed] });
                }
                this.client.xpCooldown.push(message.author.id);
                setInterval(() =>
                    this.client.xpCooldown.splice(this.client.xpCooldown.indexOf(message.author.id), 60000 * 5),
                );
            }
        }
    }
}
