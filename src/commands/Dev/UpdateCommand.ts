import beautify from "beautify";
import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseSlashCommand from "../../structures/BaseCommand";
import { exec } from "child_process";

export default class UpdateCommand extends BaseSlashCommand {
	constructor(client: FuzzyClient) {
		super(client, {
			name: "update",
			shortDescription: "Update the Bot!",
			args: [],
			cooldown: 0,
			userPermissions: [],
			botPermissions: [],
			ownerOnly: true,
		});
	}
	async run(interaction: CommandInteraction) {
		  // Sends an embed showing the it's updating the bot
		  const embed = new MessageEmbed()
		  .setAuthor(`${interaction.user.tag}`, `${interaction.user.displayAvatarURL({ dynamic: true })}`)
		  .setTitle('📥  Update - Updating bot...')
		  .setColor(this.client?.config.color!)
		  .setDescription('⏲️ This may take a bit...')
		  .setTimestamp()
		  .setFooter(`User ID: ${interaction.user.id}`);

	  // Makes what is sent a message variable
	  await interaction.reply({ embeds: [embed] });

	  try {
		  await exec('git stash').toString();
		  let gitPull = await exec('git pull origin master').toString();
		  let npmInstall = await exec('yarn').toString();
		  if (gitPull.length > 1024 || npmInstall.length > 1024) {
			  npmInstall = "Too big to display, Please Check console";
			  gitPull = "Too big to display, Please Check console";
		  }

		  const complete = new MessageEmbed()
			  .setAuthor(`${interaction.user.tag}`, `${interaction.user.displayAvatarURL({ dynamic: true })}`)
			  .setColor(this.client?.config.color!)
			  .setTitle('Update - Bot was updated!')
			  .addField(`📥 Git Pull`, `\`\`\`${gitPull}\`\`\``)
			  .addField(`🧶 Yarn Install`, `\`\`\`${npmInstall}\`\`\``)
			  .setTimestamp()
			  .setFooter(`User ID: ${interaction.user.id}`);
		  await interaction.editReply({ embeds: [complete] });
	  } catch (e) {
		  const error = new MessageEmbed()
			  .setAuthor(`${interaction.user.tag}`, `${interaction.user.displayAvatarURL({ dynamic: true })}`)
			  .setColor(this.client?.config.color!)
			  .setTitle("ERROR! - Bot didn't update!")
			  .setDescription(
				  `Please pray the lords and hope that the update didn't mess up the prod files.(Please ssh into the server and resolve the errors) \n \`\`\`${e}\`\`\``
			  )
			  .setTimestamp()
			  .setFooter(`User ID: ${interaction.user.id}`);
		  return interaction.reply({ embeds: [error] });
	  }
	}
}
