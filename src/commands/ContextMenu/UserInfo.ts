import { ContextMenuInteraction, MessageEmbed, PermissionFlags, Role } from "discord.js";
import moment from "moment";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseSlashCommand from "../../structures/BaseCommand";

export default class PingCommand extends BaseSlashCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "View User Info",
            type: "USER",
            userPermissions: ["MANAGE_MESSAGES"],
            botPermissions: [],
        });
    }
    async run(interaction: ContextMenuInteraction) {
        const allowedPerms: any[] = [];
        const disallowedPerms: any[] = [];
        const target = interaction.guild?.members.cache.get(interaction.targetId)!;
        let rolemap: any[] | any = target?.roles.cache
            .sort((a: Role, b: Role) => b.position - a.position)
            .map((r) => r)
            .join(" ");
        if (rolemap.length > 1024) rolemap = "This User has Too Many Roles to be display.";
        if (!rolemap) rolemap = "No roles";

        const joinDate = await target.joinedAt;
        const createdDate = await target.user.createdAt;
        const embed = new MessageEmbed()
            .setAuthor(`User Information - ${target.user.username}`, target.user.displayAvatarURL({ dynamic: true }))
            .addField("Joined At", `${moment(joinDate).format("LLLL")} (${moment(joinDate).fromNow()})`)
            .addField("Registered At:", `${moment(createdDate).format("LLLL")} (${moment(createdDate).fromNow()})`)
            .addField("User ID", target.id)
            .addField("Roles", rolemap)
            .setThumbnail(target.user.avatarURL({ dynamic: true }) || target.user.defaultAvatarURL)
            .setColor(target.displayColor)
            .setTimestamp()
            .setFooter(`Requester ID: ${interaction.user.id}`);
        const perms = target.permissions.toArray();
        const allPermissions: Array<keyof PermissionFlags> = [
            "CREATE_INSTANT_INVITE",
            "KICK_MEMBERS",
            "BAN_MEMBERS",
            "ADMINISTRATOR",
            "MANAGE_CHANNELS",
            "MANAGE_GUILD",
            "ADD_REACTIONS",
            "VIEW_AUDIT_LOG",
            "PRIORITY_SPEAKER",
            "STREAM",
            "VIEW_CHANNEL",
            "SEND_MESSAGES",
            "SEND_TTS_MESSAGES",
            "MANAGE_MESSAGES",
            "EMBED_LINKS",
            "ATTACH_FILES",
            "READ_MESSAGE_HISTORY",
            "MENTION_EVERYONE",
            "USE_EXTERNAL_EMOJIS",
            "VIEW_GUILD_INSIGHTS",
            "CONNECT",
            "SPEAK",
            "MUTE_MEMBERS",
            "DEAFEN_MEMBERS",
            "MOVE_MEMBERS",
            "USE_VAD",
            "CHANGE_NICKNAME",
            "MANAGE_NICKNAMES",
            "MANAGE_ROLES",
            "MANAGE_WEBHOOKS",
            "MANAGE_EMOJIS_AND_STICKERS",
            "USE_APPLICATION_COMMANDS",
            "REQUEST_TO_SPEAK",
            "MANAGE_THREADS",
            "USE_PUBLIC_THREADS",
            "USE_PRIVATE_THREADS",
            "USE_EXTERNAL_STICKERS",
        ];
        perms.forEach((perm) => {
            allowedPerms.push(allPermissions.splice(allPermissions.indexOf(perm), 1));
        });
        disallowedPerms.push(...allPermissions);

        embed.addField(
            "Allowed Permissions",
            `${allowedPerms.length > 0 ? `✅ \`${allowedPerms.join("`, `")}\`` : "No Allowed Permission"}`,
        );
        embed.addField(
            "Disallowed Permissions",
            `${disallowedPerms.length > 0 ? `❌ \`${disallowedPerms.join("`, `")}\`` : "No Disallowed Permission"}`,
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
