import beautify from "beautify";
import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseSlashCommand from "../../structures/BaseCommand";

export default class PingCommand extends BaseSlashCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "eval",
			shortDescription: "Evaluate some Node.js Code!",
			args: [
				{
					name: "code",
					description: "NodeJS Code you'd want to evaluate",
					type: "STRING",
					required: true,
				},
			],
			cooldown: 0,
			userPermissions: [],
			botPermissions: [],
			ownerOnly: true,
		});
	}
	async run(interaction: CommandInteraction) {
		// Checking 3 times in a row because just in case
		if (interaction.user.id !== "852070153804972043")
			return interaction.reply(
				"Dunno how you got through all the checkings before this but you know damn well you're not suppose to do that"
			);
		const script = interaction.options.getString("code", true);
		if (script?.includes("token")) return interaction.reply("I will not send you my token! You lost your MIND!");
		try {
			const evaluated = eval(script);
			const evaled = require("util").inspect(evaluated, { depth: 5 });
			const promisedEval: any = await Promise.resolve(evaluated);
			let res;
			if (evaled.toString().length >= 1024) {
				res = "Result too big, check the console"
			} else {
				res = evaled;
			}
			let promisedResult;
			if (promisedEval.toString().length >= 1024) {
				promisedResult = "Result too big, check the console"
			} else {
				promisedResult = promisedEval;
			}

			// Process the output
			const embed = new MessageEmbed()
				.setAuthor(`${interaction.user.tag}`, `${interaction.user.displayAvatarURL({ dynamic: true })}`)
				.setTitle("Evaluated Code")
				.setColor(this.client?.config.color!)
				.setTimestamp()
				.addField(":inbox_tray: Input: ", `\`\`\`ts\n${beautify(script, { format: "js" })} \`\`\``)
				.addField(":outbox_tray: Output", `\`\`\`ts\n${res}\`\`\``)
				.setFooter(`User ID: ${interaction.user.id}`)
				.setThumbnail(this.client!.user?.displayAvatarURL({ dynamic: true })!);

			if (evaluated && evaluated.then) {
				embed.addField(":outbox_tray: Promise Output", `\`\`\`js\n${promisedResult}\`\`\``);
			}

			// Add a type of what is the type of what's evaluated
			embed.addField("Type of: ", `\`\`\`${typeof evaluated}\`\`\``);

			// Sends the embed
			await interaction.reply({ embeds: [embed], ephemeral: true });
		} catch (err: any) {
			// If any errors occurred... then, send the error instead
			throw new Error(err)
		}
	}
}
