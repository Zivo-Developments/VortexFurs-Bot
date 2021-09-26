import { CommandInteraction, MessageActionRow, MessageComponentInteraction, MessageEmbed, MessageSelectMenu } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";
import Fursona from "../../utils/Fursona";

export default class FursonaCommand extends BaseCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "fursona",
			botPermissions: [],
			shortDescription: "Manage your Sonas!",
			userPermissions: [],
			args: [
				{
					name: "create",
					type: "SUB_COMMAND",
					description: "Create a new Sona!",
				},
				{
					name: "remove",
					type: "SUB_COMMAND",
					description: "Remove a Sona!",
				},
				{
					name: "view",
					type: "SUB_COMMAND",
					description: "View a Sona!",
				},
			],
			cooldown: 100,
			extendedDescription: "Manage your sonas",
		});
	}
	async run(interaction: CommandInteraction) {
		switch (interaction.options.getSubcommand()) {
			case "create":
				const sonaBuilder = new Fursona(this.client, interaction);
				sonaBuilder.initalize()
				break;
			case "remove":
				break;
			case "view":
				break;
		}
	}
}
