import {
    ButtonInteraction,
    CollectorFilter,
    CommandInteraction,
    Interaction,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    MessageSelectMenu,
} from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";
import { GuildRepo } from "../../repositories/GuildRepository";
import { channelResolver } from "../../utils/resolvers";
import { TextChannel } from "discord.js";

export default class ConfigCommand extends BaseCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "vmsg",
            botPermissions: [],
            shortDescription: "Send the verification message!",
            userPermissions: ["MANAGE_GUILD"],
            args: [],
            cooldown: 0,
            extendedDescription: "Sends the secret message",
        });
    }
    async run(interaction: CommandInteraction) {
        interaction.deleteReply();
        const embed = new MessageEmbed()
            .setTitle("Welcome to Frenzy Furs!")
            .setColor(this.client.config.color)
            .setDescription(
                "We are pleased to have you here. You'll be answering a couple of questions to make sure you're not a troll or part of a raid or an threat to the server. This should only take less than 5 minutes of your time and it'll help us out making sure you didn't come for trouble",
            )
            // TODO: Make the Rules Channel it's own db thingy
            .addField("Steps to get verified!", "FIRSTLY Read <#889392877061410866>\nThen React the verify button!")
            .setThumbnail(interaction.guild?.iconURL({ dynamic: true })!);
        const buttonRow = new MessageActionRow().addComponents(
            new MessageButton({
                customId: "start-verification",
                label: "Verify",
                style: "SUCCESS",
            }),
        );
        interaction.channel?.send({ embeds: [embed], components: [buttonRow] });
    }
}
