import { CommandInteraction, GuildMember, MessageEmbed, Role } from "discord.js";
import { Member } from "../../entity/Member";
import FuzzyClient from "../../lib/FuzzyClient";
import { MemberRepo } from "../../repositories";
import BaseSlashCommand from "../../structures/BaseCommand";

export default class PingCommand extends BaseSlashCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "profile",
            shortDescription: "Get your profile information",
            args: [],
            cooldown: 0,
            userPermissions: [],
            botPermissions: [],
        });
    }
    async run(interaction: CommandInteraction) {
        const memberRepo = this.client.database.getCustomRepository(MemberRepo);
        const guild = this.client.guilds.cache.get(this.client.config.guildID);
        const member = guild?.members.cache.get(interaction.user.id);
        const profile = await memberRepo.findOne({ guildID: this.client.config.guildID, userID: interaction.user.id });
        if (!profile) throw new Error("You don't have a profile! Go make on https://www.hozol.xyz/profile/create!");
        const embed = new MessageEmbed()
            .setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
            .setTitle(`Profile Card - ${interaction.user.username}`)
            .setDescription(`Bio: ${profile.bio ? profile.bio : "No Bio"}`)
            .addField(
                "Roles",
                (interaction.member as unknown as GuildMember)!.roles.cache
                    .sort((a: Role, b: Role) => b.position - a.position)
                    .map((r) => r)
                    .join(" "),
            )
            .addField("More Stuff?", "Coming Soon")
            .setColor("#ff1493"!)
            .setURL("https://www.hozol.xyz/profile/")
            .setThumbnail(interaction.user?.avatarURL({ dynamic: true })!);
        interaction.reply({ embeds: [embed] });
    }
}
