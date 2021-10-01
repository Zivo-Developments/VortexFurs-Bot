import { CommandInteraction, MessageEmbed } from "discord.js";
import randomPuppy from "random-puppy";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";

export default class MemeCommand extends BaseCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "meme",
			shortDescription: "Get a meme from a sub reddit",
			userPermissions: [],
			botPermissions: [],
			args: [],
			cooldown: 1000,
		});
	}
	async run(interaction: CommandInteraction) {
		const subReddits = [`dankmeme`, `meme`, `me_irl`];
		const random = subReddits[Math.floor(Math.random() * subReddits.length)];
		const img = await randomPuppy(random);
		const embed = new MessageEmbed()
			.setAuthor(`${interaction.user.username}`, `${interaction.user.displayAvatarURL({ dynamic: true })}`)
			.setTitle(`Here's a Meme from ${subReddits}!`)
			.setImage(img)
			.setColor(this.client!.config.color)
			.setTimestamp()
			.setFooter(`User ID: ${interaction.user.id}`);
		interaction.reply({ embeds: [embed] });
	}
}
