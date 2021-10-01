import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import { FursonaRepo } from "../../repositories/FursonaRepository";
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
				const sonaRepo = this.client.database.getCustomRepository(FursonaRepo);
				await sonaBuilder.startQuestion();
				const { age, height, name, sexuality, sonaUID, species } = sonaBuilder.toJSON();
				sonaRepo
					.createSona({ age, height, sonaName: name, sonaSexuality: sexuality, sonaID: sonaUID, species })
					.then(() => {
						const embed = new MessageEmbed()
							.setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }))
							.setColor(this.client.config.color)
							.setDescription(
								`Your sona has been created! To View or Further Customize it go to [https://hozol.xyz](https://hozol.xyz)`
							)
							.setTimestamp()
							.setFooter(`User ID ${interaction.user.id}`);
						interaction.editReply({ embeds: [embed] });
					});
				break;
			case "remove":
				break;
			case "view":
				break;
		}
	}
}
