import { execSync } from "child_process";
import { ColorResolvable, CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseSlashCommand from "../../structures/BaseCommand";

export default class UpdateCommand extends BaseSlashCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "update",
            shortDescription: "Update the Bot!",
            args: [],
            type: "CHAT_INPUT",
            cooldown: 0,
            userPermissions: [],
            botPermissions: [],
            ownerOnly: true,
        });
    }
    async run(interaction: CommandInteraction) {
        const embed = new MessageEmbed()
            .setAuthor(`${interaction.user.tag}`, `${interaction.user.displayAvatarURL({ dynamic: true })}`)
            .setTitle("📥  Update - Updating bot...")
            .setColor(this.client.config.color as ColorResolvable)
            .setDescription("⏲️ This may take a bit...")
            .setTimestamp()
            .setFooter(`User ID: ${interaction.user.id}`);
        await interaction.reply({ embeds: [embed] });
        try {
            const gitStash = execSync("git stash").toString();
            const gitPull = execSync("git pull origin master").toString();
            if (gitStash && gitPull)
                embed.addField("🗳️ GIT", `\`\`\`Git Stash: ${gitStash}\nGit Pull: ${gitPull}\`\`\``);
            const yarn = execSync("yarn install").toString();
            if (yarn) embed.addField("🧶 Yarn", `\`\`\`${yarn}\`\`\``);
            embed.setTitle("☑️ Update Complete");
            embed.setDescription("");
            interaction.editReply({ embeds: [embed] });
        } catch (e) {
            throw new Error(`${e}`);
        }
    }
}
