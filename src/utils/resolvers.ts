import {
    Channel,
    CommandInteraction,
    Emoji,
    Guild,
    GuildMember,
    Message,
    MessageEmbed,
    Role,
    Snowflake,
    TextChannel,
    User,
} from "discord.js";
import _ from "lodash";
import FuzzyClient from "../lib/FuzzyClient";
import DiscordMenu from "./DiscordMenu";
import unicodeEmojiRegex from "emoji-regex";

// Regex
const channelRegex = /^(?:<#)?(\d{17,19})>?$/;
const emojiRegex = /^(?:<a?:\w{2,32}:)?(\d{17,19})>?$/;
const snowflakeRegex = /^(\d{17,19})$/;
const userOrMemberRegex = /^(?:<@!?)?(\d{17,19})>?$/;
const roleRegex = /^(?:<@&)?(\d{17,19})>?$/;

export async function channelResolver(client: FuzzyClient, mention: string): Promise<Channel | null> {
    // Regular Channel support
    const channel = channelRegex.test(mention)
        ? await client.channels.fetch(channelRegex.exec(mention)![1]).catch(() => null)
        : null;
    if (channel) return channel as TextChannel;
    return null;
}

export async function emojiResolver(client: FuzzyClient, mention: string): Promise<Emoji | null> {
    // @ts-expect-error
    let emoji = emojiRegex.test(mention) ? regex.test(mention) : null;
    if (emoji) return emoji;
    return null;
}

export async function checkEmoji(mention: string): Promise<boolean> {
    const regex = unicodeEmojiRegex();
    return emojiRegex.test(mention) || regex.test(mention);
}

export async function guildResolver(client: FuzzyClient, snowflake: Snowflake): Promise<Guild> {
    const guild = snowflakeRegex.test(snowflake) ? client.guilds.resolve(snowflake) : null;
    if (guild) return guild;
    throw new Error(`Invalid guild: ${snowflake}`);
}

export async function memberResolver(guild: Guild, mention: string): Promise<GuildMember> {
    const member = userOrMemberRegex.test(mention)
        ? await guild?.members.fetch(userOrMemberRegex.exec(mention)![1]).catch(() => null)
        : null;
    if (member) return member;

    throw new Error(`Invalid Member: ${mention}. Remember, members exist in the guild`);
}

export async function messageResolver(channel: TextChannel, snowflake: string): Promise<Message> {
    const msg = snowflakeRegex.test(snowflake)
        ? await channel.messages.fetch(snowflake).catch(() => null)
        : undefined;
    if (msg) return msg;

    throw new Error(`Invalid Message: ${snowflake} Remember, the bot can only resolve message in the same channel `);
}

export async function roleNameResolver(message: Message, roleName: string): Promise<Role> {
    const regExpEsc = (str: string) => str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    if (!message.guild) {
        throw new Error("Invalid: rolename arguments cannot be used outside of a guild.");
    }
    const resRole = resolveRole(roleName, message.guild);
    if (resRole) return resRole;

    const results = [];
    const reg = new RegExp(regExpEsc(roleName), "i");
    for (const role of message.guild.roles.cache.values()) {
        if (reg.test(role.name)) results.push(role);
    }

    let querySearch: any;
    if (results.length > 0) {
        const regWord = new RegExp(`\\b${regExpEsc(roleName)}\\b`, "i");
        const filtered = results.filter((role) => regWord.test(role.name));
        querySearch = filtered.length > 0 ? filtered : results;
    } else {
        querySearch = results;
    }

    switch (querySearch.length) {
        case 0:
            throw new Error(`Sorry, I could not find any roles that matched ${roleName}.`);
        case 1:
            return querySearch[0];
        default:
            return await new Promise(async (resolve, reject) => {
                const children: any[] = [];
                let _children: any[] = [];
                const children2: any[] = [];
                const childrenMain: any[] = [];
                querySearch.forEach((option: string) => {
                    children.push(option);
                    childrenMain.push(option);
                });

                // Now, break the roles up into groups of 10 for pagination.
                while (children.length > 0) {
                    _children.push(children.shift());
                    if (_children.length > 9) {
                        children2.push(_.cloneDeep(_children));
                        _children = [];
                    }
                }
                if (_children.length > 0) {
                    children2.push(_.cloneDeep(_children));
                }

                new DiscordMenu(
                    message.channel as TextChannel,
                    message.author.id,
                    // @ts-ignore
                    children2.map((group) => {
                        const groupEmbed = new MessageEmbed()
                            .setAuthor(
                                `${message.author.tag}`,
                                `${message.author.displayAvatarURL({
                                    dynamic: true,
                                })}`,
                            )
                            .setTitle("Multiple roles found!")
                            .setDescription(
                                `Multiple roles matched the name **${roleName}**. Use the menu to find which role you meant, and then type its name in a message.`,
                            )
                            .setColor(require("./../../config.json").color)
                            .setFooter(`User ID: ${message.author.id}`)
                            .setTimestamp();
                        group.map((child: any) => {
                            groupEmbed.addField(child.name, `ID: ${child.id}`);
                        });
                        return groupEmbed;
                    }),
                    childrenMain.map((child) => {
                        return {
                            message: child.name,
                            fn: (senderMessage: Message) => {
                                senderMessage.delete();
                                return resolve(child);
                            },
                        };
                    }),
                );
            });
    }

    function resolveRole(query: any, guild: Guild) {
        if (query instanceof Role) {
            return guild.roles.cache.has(query.id) ? query : null;
        }
        if (typeof query === "string" && roleRegex.test(query)) {
            return guild.roles.resolve(roleRegex.exec(query)![1]);
        }
        return null;
    }
}

export async function roleResolver(guild: Guild, mention: string): Promise<Role | null> {
    const role = roleRegex.test(mention) ? await guild?.roles.fetch(roleRegex.exec(mention)![1]) : null;

    if (role) return role;

    return null;
}

export async function usernameResolver(
    client: FuzzyClient,
    interaction: CommandInteraction,
    username: string,
): Promise<User> {
    if (!username) throw new Error("Username was not provided");
    const regExpEsc = (str: string) => str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    if (!interaction.guild) {
        return userResolver(client, username);
    }
    const resUser = await resolveUser(username, interaction.guild);
    if (resUser) return resUser;

    const results = [];
    const reg = new RegExp(regExpEsc(username), "i");
    for (const member of interaction.guild.members.cache.values()) {
        if (reg.test(member.user.username)) {
            results.push(member.user);
        } else if (reg.test(member.nickname!)) {
            results.push(member.user);
        }
    }

    let querySearch: any;
    if (results.length > 0) {
        const regWord = new RegExp(`\\b${regExpEsc(username)}\\b`, "i");
        const filtered = results.filter((user) => regWord.test(user.username));
        querySearch = filtered.length > 0 ? filtered : results;
    } else {
        querySearch = results;
    }

    switch (querySearch.length) {
        case 0:
            throw new Error(
                `Sorry, I could not find any users matching the criteria provided for ${username}. Please make sure you provided a valid username, nickname, mention, or id.`,
            );
        case 1:
            return querySearch[0];
        default:
            return await new Promise(async (resolve, reject) => {
                const children: User[] = [];
                let _children: User[] = [];
                const children2 = [];
                const childrenMain: User[] = [];
                querySearch.forEach((options: any) => {
                    children.push(options);
                    childrenMain.push(options);
                });

                // Now, break the roles up into groups of 10 for pagination.
                while (children.length > 0) {
                    _children.push(children.shift()!);
                    if (_children.length > 9) {
                        children2.push(_.cloneDeep(_children));
                        _children = [];
                    }
                }
                if (_children.length > 0) {
                    children2.push(_.cloneDeep(_children));
                }

                new DiscordMenu(
                    interaction.channel as TextChannel,
                    interaction.user.id,
                    children2.map((group) => {
                        const groupEmbed = new MessageEmbed()
                            .setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ dynamic: true }))
                            .setTitle(`Multiple users found!`)
                            .setDescription(
                                `Multiple users matched the name **${username}**. Use the menu to find which user you meant, and then type their name in a message.`,
                            )
                            .setColor(require("./../../config.json").color)
                            .setFooter(`User ID: ${interaction.user.id}`)
                            .setTimestamp();
                        group.map((child: User) => {
                            groupEmbed.addField(child.username, `ID: ${child.id}`);
                        });
                        return groupEmbed;
                    }),
                    childrenMain.map((child) => {
                        return {
                            message: child.username,
                            fn: async () => {
                                return resolve(child);
                            },
                        };
                    }),
                );
            });
    }
}

function resolveUser(query: any, guild: Guild) {
    if (query instanceof GuildMember) return query.user;
    if (query instanceof User) return query;
    if (typeof query === "string") {
        if (userOrMemberRegex.test(query)) {
            return guild.client.users.fetch(userOrMemberRegex.exec(query)![1]).catch(() => null);
        }
        if (/\w{1,32}#\d{4}/.test(query)) {
            const res = guild.members.cache.find((member: GuildMember) => member.user.tag === query);
            return res ? res.user : null;
        }
    }
    return null;
}

export async function userResolver(client: FuzzyClient, mention: string): Promise<User> {
    const user = userOrMemberRegex.test(mention)
        ? await client.users.fetch(userOrMemberRegex.exec(mention)![1]).catch(() => null)
        : null;
    if (user) return user;
    throw new Error(`Invalid user: ${mention}`);
}
