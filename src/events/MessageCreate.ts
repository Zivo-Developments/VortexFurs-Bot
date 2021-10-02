import { GuildMember, Message, MessageEmbed, TextChannel } from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver, messageResolver } from "../utils/resolvers";
import { VerificationRepo } from "../repositories/VerificationRepo";

export default class MemberCreateEvent extends BaseEvent {
    constructor(client: FuzzyClient) {
        super(client, {
            eventName: "messageCreate",
        });
    }
    async run(client: FuzzyClient, message: Message) {
        if(message.author.bot || client.user!.id === message.author.id) return;
        // Check if it was a dm, if so check if they have a verification question open
        const verifyRepo = client.database.getCustomRepository(VerificationRepo);
        const guildRepo = client.database.getCustomRepository(GuildRepo);
        if (message.channel.type == "DM") {
            const verify = await verifyRepo.findOne({ userID: message.author.id, questioning: true });
            if (verify) {
                const verifyingGuild = client.guilds.cache.get(verify.guildID);
                const questioningChannel = verifyingGuild!.channels.cache.get(verify.questionChannelID) as TextChannel;
                return await questioningChannel
                    .send(`**${message.author} || (${message.author.id})**: ${message.content}`)
                    .then(() => message.react("✅"));
            }
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
                        verifyRepo.delete({ userID: verify.userID, guildID: message.guild!.id });
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
                                const banReason = await this.client.utils.awaitReply(
                                    message.channel,
                                    "Why are you wanting to ban this member?",
                                    {
                                        max: 1,
                                        filter: (m) => m.author.id === message.author.id,
                                        time: 60000,
                                    },
                                    true,
                                );
                                if (banReason) {
                                    verifyingMember.send(
                                        `You're banned from ${message.guild!.name} for ${banReason.content}`,
                                    );
                                    verifyingMember.ban({
                                        reason: `Banned from verification in ${
                                            message.guild!.name
                                        } (For ServerProtector Users) for ${banReason.content}`,
                                    });
                                    const bannedmsg = await pendingMsg?.channel
                                        .send("User has been banned!")
                                        .catch(async (m) => {
                                            let unability = await m.channel.send("Unable to ban user!");
                                            setTimeout(() => unability!.delete(), 10000);
                                        });
                                    setTimeout(() => bannedmsg!.delete(), 10000);
                                }
                                if (loggingChannel && loggingChannel?.isText()) {
                                    loggingChannel.send({
                                        embeds: [
                                            pendingMsg?.embeds[0]
                                                .addField(`STATUS`, `DENIED/BANNED BY ${message.member}`)
                                                .setDescription(`Deny Reason: ${banReason.content}`)
                                                .setColor("RED")!,
                                        ],
                                    });
                                }
                                verifyRepo.delete({ userID: verify.userID, guildID: message.guild!.id });
                                await message.channel.delete().catch((e) => {
                                    message.channel.send(`Unable to delete channel, here's why ${e}`);
                                });
                                pendingMsg!.delete();
                                banReason.delete();
                                break;
                            case "kick":
                                const kickReason = await this.client.utils.awaitReply(
                                    message.channel,
                                    "Why are you wanting to kick this member?",
                                    {
                                        max: 1,
                                        filter: (m) => m.author.id === message.author.id,
                                        time: 60000,
                                    },
                                    true,
                                );
                                if (kickReason) {
                                    verifyingMember.send(
                                        `You're kicked from ${message.guild!.name} for ${kickReason.content}`,
                                    );
                                    verifyingMember.kick(`Kicked from verification for ${kickReason.content}`);
                                    const kickedmsg = await pendingMsg?.channel.send("User has been kicked!");
                                    setTimeout(() => kickedmsg!.delete(), 10000);
                                }
                                if (loggingChannel && loggingChannel?.isText()) {
                                    loggingChannel.send({
                                        embeds: [
                                            pendingMsg?.embeds[0]
                                                .addField(`STATUS`, `DENIED/KICKED BY ${message.member}`)
                                                .setDescription(`Deny Reason: ${kickReason.content}`)
                                                .setColor("RED")!,
                                        ],
                                    });
                                }
                                verifyRepo.delete({ userID: verify.userID, guildID: message.guild!.id });
                                await message.channel.delete().catch((e) => {
                                    message.channel.send(`Unable to delete channel, here's why ${e}`);
                                });
                                pendingMsg!.delete();
                                kickReason.delete();
                                break;
                            case "accept":
                                await message.channel.delete().catch((e) => {
                                    message.channel.send(`Unable to delete channel, here's why ${e}`);
                                });
                                pendingMsg!.delete();
                                const r = message.guild?.roles.cache.get(guildData?.verifiedRoleID!);
                                if (r) {
                                    verifyingMember.roles.add(r);
                                }
                                if (loggingChannel && loggingChannel?.isText()) {
                                    loggingChannel.send({
                                        embeds: [
                                            pendingMsg?.embeds[0]
                                                .addField(`STATUS`, `ACCEPTED BY ${message.member}`)
                                                .setColor("GREEN")!,
                                        ],
                                    });
                                }
                                if (guildData?.generalChannel) {
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
                                        .setColor(client.config.color)
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
                                const denyReason = await this.client.utils.awaitReply(
                                    message.channel,
                                    "Why are you denying this person?",
                                    {
                                        max: 1,
                                        filter: (m) => m.author.id === message.author.id,
                                        time: 60000,
                                    },
                                    true,
                                );

                                if (denyReason) {
                                    denyReason.delete();
                                    if (loggingChannel && loggingChannel?.isText()) {
                                        loggingChannel.send({
                                            embeds: [
                                                pendingMsg?.embeds[0]
                                                    .addField(`STATUS`, `DENIED BY ${message.member}`)
                                                    .setDescription(`Deny Reason: ${denyReason.content}`)
                                                    .setColor("RED")!,
                                            ],
                                        });
                                    }
                                    const embed = new MessageEmbed()
                                        .setTitle("❌ You're Verification has been denied")
                                        .setAuthor(verifyingUser.tag, verifyingUser.displayAvatarURL({ dynamic: true }))
                                        .setColor(client.config.color)
                                        .setDescription(`Reason: ${denyReason.content}\nYou may redo the application`);
                                    verifyingUser.send({ embeds: [embed] });
                                }
                                await message.channel.delete().catch((e) => {
                                    message.channel.send(`Unable to delete channel, here's why ${e}`);
                                });
                                pendingMsg!.delete();
                                denyReason.delete();
                                break;
                        }
                        return;
                    } else {
                        return verifyingUser.send(`**Staff Member**: ${message.content}`).then(() => {
                            message.react("✅");
                        });
                    }
                }
            }
        }
    }
}
