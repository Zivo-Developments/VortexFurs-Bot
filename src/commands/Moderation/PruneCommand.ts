import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";

export default class PurgeCommand extends BaseCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "purge",
            botPermissions: ["MANAGE_MESSAGES"],
            type: "CHAT_INPUT",
            shortDescription: "Clear x messages!",
            userPermissions: ["MANAGE_MESSAGES"],
            args: [
                {
                    name: "amount",
                    description: "Amount of messages to clear",
                    type: "INTEGER",
                    required: true,
                },
            ],
            cooldown: 0,
            extendedDescription: "Clears x amount of messages from the channel!",
        });
    }
    async run(interaction: CommandInteraction) {
        if (!interaction.guild) return;
        if (!interaction.channel) return;
        const amount = interaction.options.getInteger("amount", true);
        const channel = await interaction.guild.channels.fetch(interaction.channel.id);
        if (channel?.isText()) {
            const messages = await channel.messages.fetch({ limit: amount });
            await channel.bulkDelete(messages);
            const embed = new MessageEmbed()
                .setTitle(`Purged ${messages.size} messages!`)
                .setTimestamp()
                .setColor("YELLOW");
            await interaction.reply({ embeds: [embed] });
        }
    }
}
