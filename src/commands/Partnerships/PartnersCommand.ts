import cryptoRandomString from "crypto-random-string";
import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import { BadgeRepo } from "../../repositories/BadgeRepository";
import { PartnersRepo } from "../../repositories/PartnersRepository";
import BaseCommand from "../../structures/BaseCommand";

export default class BadgeCommand extends BaseCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "partnerships",
            userPermissions: ["MANAGE_GUILD"],
            shortDescription: "Manage partnerships",
            type: "CHAT_INPUT",
            botPermissions: [],
            args: [
                {
                    name: "add",
                    description: "Partnerships",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "rep",
                            description: "The Respernative of the server",
                            type: "USER",
                            required: true,
                        },
                        {
                            name: "name",
                            description: "Name of their server",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "iconURL",
                            description: "Link of the ICON",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "summary",
                            description: "Summary of their server",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "invite",
                            description: "Server Invite of the server",
                            type: "STRING",
                            required: true,
                        },
                        {
                            name: "affliates",
                            description: "Are they affliates?",
                            type: "BOOLEAN",
                            required: true,
                        },
                    ],
                },
                {
                    name: "remove",
                    description: "Remove Server",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "partnerID",
                            description: "ID of the Partnership",
                            type: "STRING",
                            required: true,
                        },
                    ],
                },
                {
                    name: "list",
                    description: "List all the partnerships",
                    type: "SUB_COMMAND",
                },
            ],
        });
    }
    async run(interaction: CommandInteraction) {
        const partnerRepo = this.client.database.getCustomRepository(PartnersRepo);
        switch (interaction.options.getSubcommand()) {
            case "add":
                const name = interaction.options.getString("name", true);
                const rep = interaction.options.getUser("rep", true);
                const summary = interaction.options.getString("summary", true);
                const invite = interaction.options.getString("invite", true);
                const iconURL = interaction.options.getString("iconLink", true);
                const affliates = interaction.options.getBoolean("afflilates", true);
                const partnerID = cryptoRandomString({ length: 10 });
                const created = await partnerRepo.createPartnership({
                    affliates,
                    rep: rep.id,
                    serverName: name,
                    summary: summary,
                    invite,
                    partnerID,
                });
                if (!created[0]) throw new Error(created[1]);

                const embed = new MessageEmbed()
                    .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({ dynamic: true }))
                    .setColor(`GREEN`)
                    .setThumbnail(iconURL)
                    .setDescription(
                        `Partnered has been added to the database. The server will now be displayed in [the partners page](https://www.hozol.xyz/partners)`,
                    )
                    .addField("Name", name)
                    .addField("Rep", `${rep.username} (${rep.id})`)
                    .addField("Summary", `${summary}`)
                    .addField("Invite Link", invite)
                    .addField("Partnership ID", partnerID);
                interaction.reply({ embeds: [embed] });
                break;
            case "remove":
                const PID = interaction.options.getString("partnerID", true);
                const success = await partnerRepo.delete({
                    partnerID: PID,
                });
                if(success) interaction.reply("Successfully removed the partnership")
                break;
            case "list":
                const partners = await partnerRepo.find({});
                const display = new MessageEmbed()
                    .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({ dynamic: true }))
                    .setColor(`BLUE`)
                    .setThumbnail(interaction.guild?.iconURL({ dynamic: true })!)
                    .setDescription(`List of Partnered server with Vortex Furs`);
                partners.forEach((partner) =>
                    display.addField(partner.serverName, `<@${partner.rep}> | ${partner.partnerID}`),
                );
                interaction.reply({ embeds: [display] });
                break;
        }
    }
}
