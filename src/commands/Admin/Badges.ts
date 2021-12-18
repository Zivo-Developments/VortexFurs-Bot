import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import { BadgeRepo } from "../../repositories/BadgeRepository";
import BaseCommand from "../../structures/BaseCommand";

export default class BadgeCommand extends BaseCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "badge",
            userPermissions: ["MANAGE_GUILD"],
            shortDescription: "Manage badges",
            type: "CHAT_INPUT",
            botPermissions: [],
            args: [
                {
                    name: "add",
                    description: "Add Badges",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "name",
                            description: "Name of the badge",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "description",
                            description: "Description of the badge",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "icon",
                            description: "Font Awesome Icon",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "gold",
                            description: "Limited Time? Make the Badge GOLD",
                            type: "BOOLEAN",
                            required: true,
                        },
                    ],
                },
                {
                    name: "remove",
                    description: "Add Badges",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "name",
                            description: "Name of the badge",
                            type: "STRING",
                            required: true,
                        },
                    ],
                },
                {
                    name: "list",
                    description: "Add Badges",
                    type: "SUB_COMMAND",
                    options: [],
                },
                {
                    name: "give",
                    description: "Give Badges",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "name",
                            description: "Name of the badge",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "member",
                            description: "Member to give the badge",
                            type: "USER",
                            required: true,
                        },
                    ],
                },
            ],
        });
    }
    async run(interaction: CommandInteraction) {
        const badgeRepo = this.client.database.getCustomRepository(BadgeRepo);
        switch (interaction.options.getSubcommand()) {
            case "add":
                const name = interaction.options.getString("name", true);
                const description = interaction.options.getString("description", true);
                const icon = interaction.options.getString("icon", true);
                const exclusive = interaction.options.getBoolean("gold", true);
                const badge = await badgeRepo
                    .createBadge({
                        guildID: interaction.guild?.id,
                        icon,
                        info: description,
                        name,
                        referenceName: name.split(" ").join("-").toLowerCase(),
                        uid: `${interaction.guild!.id}-${Date.now()}`,
                        gold: exclusive,
                    })
                    .catch((e) => {
                        throw new Error(e);
                    });
                if (!badge) throw new Error("There was an error creating your badge");
                const embed = new MessageEmbed()
                    .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({ dynamic: true }))
                    .setColor(`GREEN`)
                    .setDescription(`Create badge **${name}** has been created!`)
                    .addField("UID", badge.uid);
                interaction.reply({ embeds: [embed] });
                break;
            case "remove":
                break;
            case "list":
                break;
        }
    }
}
