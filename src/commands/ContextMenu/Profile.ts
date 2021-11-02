import { CommandInteraction, ContextMenuInteraction, GuildMember, MessageEmbed, Role } from "discord.js";
import { Member } from "../../entity/Member";
import FuzzyClient from "../../lib/FuzzyClient";
import { MemberRepo } from "../../repositories";
import BaseSlashCommand from "../../structures/BaseCommand";

export default class PingCommand extends BaseSlashCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "View Profile",
            type: "USER",
            userPermissions: [],
            botPermissions: [],
        });
    }
    async run(interaction: ContextMenuInteraction) {
        const memberRepo = this.client.database.getCustomRepository(MemberRepo);
        const guild = this.client.guilds.cache.get(this.client.config.guildID);
        const member = interaction.guild?.members.cache.get(interaction.targetId)!;
        const profile = await memberRepo.findOne({ guildID: this.client.config.guildID, userID: member.user.id });
        if (!profile)
            throw new Error(
                `${member.user.username} doesnt't have a profile! They need to create one in https://www.hozol.xyz/profile/create`,
            );
        const embed = new MessageEmbed()
            .setAuthor(member.user.username, member.user.displayAvatarURL())
            .setTitle(`Profile Card - ${member.user.username}`)
            .setDescription(`Bio: ${profile.bio ? profile.bio : "No Bio"}`)
            .addField(
                "Roles",
                (member as unknown as GuildMember)!.roles.cache
                    .sort((a: Role, b: Role) => b.position - a.position)
                    .map((r) => r)
                    .join(" "),
            )
            .addField("More Stuff?", "Coming Soon")
            .setColor("#ff1493"!)
            .setURL(`https://www.hozol.xyz/profile/${member.id}`)
            .setThumbnail(member.user?.avatarURL({ dynamic: true })!);
        interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
