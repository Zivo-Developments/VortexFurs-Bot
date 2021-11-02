import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";
import { userResolver } from "../../utils/resolvers";

export default class PingCommand extends BaseCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "unban",
            type: "CHAT_INPUT",
            botPermissions: ["BAN_MEMBERS"],
            shortDescription: "Unban a member!",
            userPermissions: ["BAN_MEMBERS"],
            args: [
                {
                    name: "member",
                    description: "Member to ban (User ID only)",
                    type: "STRING",
                    required: true,
                },
                {
                    name: "reason",
                    description: "Reason for the unban",
                    type: "STRING",
                    required: true,
                },
            ],
            cooldown: 0,
            extendedDescription: "Unbans the member from the server",
        });
    }
    async run(interaction: CommandInteraction) {
        if (!interaction.guild) return;
        const target = interaction.options.getString("member", true);
        const reason = interaction.options.getString("reason", true);
        const user = await userResolver(this.client, target);
        if (user.id === interaction.user.id) throw new Error("You cannot unban yourself");
        const banned = await interaction.guild?.bans.fetch(user).catch(() => {});
        if (!banned) throw new Error("The User is not banned!");
        interaction.guild.members.unban(user, reason).then(() => {
            const embed = new MessageEmbed()
                .setTitle("Unban")
                .setAuthor(`Issued By: ${interaction.user.tag}`, interaction.user.displayAvatarURL({ dynamic: true }))
                .addField("Unbanned User", `${user}(${user.id})`)
                .addField("Reason:", reason)
                .setTimestamp()
                .setFooter(`User ID: ${interaction.user.id}`)
                .setColor("GREEN");
            interaction.reply({ embeds: [embed] });
        });
    }
}
