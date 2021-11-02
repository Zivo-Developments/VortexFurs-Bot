import { ColorResolvable, CommandInteraction, MessageEmbed, Role } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import { RolesRepo } from "../../repositories/RolesRepository";
import BaseCommand from "../../structures/BaseCommand";

export default class ConfigCommand extends BaseCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "roles",
            type: "CHAT_INPUT",
            botPermissions: [],
            shortDescription: "Configure the bot's role configurations!",
            userPermissions: ["MANAGE_GUILD"],
            args: [
                {
                    name: "add",
                    type: "SUB_COMMAND",
                    description: "Add Roles to an Existing Category",
                    options: [
                        {
                            name: "category",
                            description: "Category Name",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "role",
                            description: "Category Name",
                            type: "ROLE",
                            required: true,
                        },
                    ],
                },
                {
                    name: "remove",
                    type: "SUB_COMMAND",
                    description: "Remove Roles to an Existing Category",
                    options: [
                        {
                            name: "category",
                            description: "Category Name",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "role",
                            description: "Category Name",
                            type: "ROLE",
                            required: true,
                        },
                    ],
                },
                {
                    name: "delete",
                    type: "SUB_COMMAND",
                    description: "Delete an Category",
                    options: [
                        {
                            name: "category",
                            description: "Category Name",
                            type: "STRING",
                            required: true,
                        },
                    ],
                },
                {
                    name: "create",
                    type: "SUB_COMMAND",
                    description: "Create an Category",
                    options: [
                        {
                            name: "category",
                            description: "Category Name",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "type",
                            description: "Select Menu or Checkboxes?",
                            type: "STRING",
                            choices: [
                                {
                                    name: "Select Menu",
                                    value: "select",
                                },
                                {
                                    name: "Checkbox",
                                    value: "checkbox",
                                },
                            ],
                            required: true,
                        },
                    ],
                },
                {
                    name: "view",
                    type: "SUB_COMMAND",
                    description: "View an Category",
                    options: [
                        {
                            name: "category",
                            description: "Category Name",
                            type: "STRING",
                            required: false,
                        },
                    ],
                },
            ],
            cooldown: 100,
            extendedDescription: "Ping the bot and get it's latency",
        });
    }
    async run(interaction: CommandInteraction) {
        let existance: boolean;
        let category: string | null;
        let role: Role;
        const rolesRepo = this.client.database.getCustomRepository(RolesRepo);
        switch (interaction.options.getSubcommand()) {
            case "add":
                role = interaction.options.getRole("role", true) as Role;
                category = interaction.options.getString("category", true);
                existance = await rolesRepo.checkExistance(category, interaction.guild!.id);
                if (!existance) throw new Error("This category doesn't exist!");
                const addRole = await rolesRepo.addRole(category, interaction.guild?.id!, role);
                if (addRole) {
                    const embed = new MessageEmbed()
                        .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({ dynamic: true }))
                        .setTitle(`Role was added from ${category}!`)
                        .setDescription(`The role (${role}) has been added from ${category}!`)
                        .setColor(this.client.config.color as ColorResolvable);
                    interaction.reply({ embeds: [embed] });
                }
                break;
            case "remove":
                role = interaction.options.getRole("role", true) as Role;
                category = interaction.options.getString("category", true);
                existance = await rolesRepo.checkExistance(category, interaction.guild!.id);
                if (!existance) throw new Error("This category doesn't exist!");
                const removeRole = await rolesRepo.removeRole(category, interaction.guild?.id!, role);
                if (removeRole) {
                    const embed = new MessageEmbed()
                        .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({ dynamic: true }))
                        .setTitle(`Role was removed from ${category}!`)
                        .setDescription(`The role (${role}) has been removed from ${category}!`)
                        .setColor(this.client.config.color as ColorResolvable);
                    interaction.reply({ embeds: [embed] });
                }
                break;
            case "delete":
                category = interaction.options.getString("category", true);
                existance = await rolesRepo.checkExistance(category, interaction.guild!.id);
                if (!existance) throw new Error("This category doesn't exist at all!");
                const success = await rolesRepo.removeRoleCategory(category, interaction.guild!.id);
                if (success) {
                    const embed = new MessageEmbed()
                        .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({ dynamic: true }))
                        .setTitle("Role Category is deleted")
                        .setDescription("The Role Category has been deleted!")
                        .setColor(this.client.config.color as ColorResolvable);
                    interaction.reply({ embeds: [embed] });
                    return;
                }
                break;
            case "create":
                category = interaction.options.getString("category", true);
                const type = <"select" | "checkbox">interaction.options.getString("type", true);
                const check = await rolesRepo.findOne({
                    guildID: interaction.guild!.id,
                    uid: category.split(" ").join("-").toLowerCase(),
                });
                if (check) throw new Error("This category already exist!");
                const roleCategory = await rolesRepo.createRoleCategory(category, interaction.guild!.id, type);
                if (roleCategory) {
                    const embed = new MessageEmbed()
                        .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({ dynamic: true }))
                        .setTitle("Role Category is created")
                        .setDescription("The Role Category has been created!")
                        .addField(`To Add roles to that category do`, `/roles add ${category.toLowerCase()} <Role>`)
                        .setColor(this.client.config.color as ColorResolvable);
                    interaction.reply({ embeds: [embed] });
                    return;
                }
                break;
            case "view":
                category = interaction.options.getString("category");
                if (category) {
                    existance = await rolesRepo.checkExistance(category, interaction.guild!.id);
                    if (!existance) throw new Error("This category doesn't exist at all!");
                    const roleData = await rolesRepo.findOne({
                        guildID: interaction.guild?.id,
                        uid: category.split(" ").join("-").toLowerCase(),
                    });
                    const embed = new MessageEmbed()
                        .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({ dynamic: true }))
                        .setTitle(`Category: ${category}`)
                        .setColor(this.client.config.color as ColorResolvable);
                    roleData?.roles.forEach((role) => {
                        embed.addField(`${role.roleName} | ${role.roleID}`, `<@&${role.roleID}>`);
                    });
                    return interaction.reply({ embeds: [embed] });
                }
                const menus = await rolesRepo.find({ guildID: interaction.guild?.id });
                const embed = new MessageEmbed()
                    .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({ dynamic: true }))
                    .setTitle(`All Menus`)
                    .setColor(this.client.config.color as ColorResolvable);
                menus.forEach((menu) => {
                    embed.addField(`${menu.name} | ${menu.type}`, `${menu.roles.length} Roles`);
                });
                interaction.reply({ embeds: [embed] });
                break;
        }
    }
}
