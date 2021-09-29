import { Message, PermissionFlags, MessageEmbed, Channel, TextChannel, AwaitMessagesOptions, TextBasedChannels, GuildMember, CommandInteraction } from "discord.js";
import hastebin from "hastebin-gen";

export default class Utils {
	/**
	 * This method will take the code (whatever you want to put on hastebin) and returns the hastebin link
	 * @param code {string} Code you're wanting to upload to hastebin
	 * @returns returns the hastebin Link
	 */
	public async generateHastebin(code: string): Promise<any> {
		let hasteLink = hastebin(code, { url: "https://hastebin.com" });
		if (hasteLink && typeof hasteLink !== "undefined") {
			return hasteLink;
		} else {
			return "Hastebin Link Generation Failed";
		}
	}

	public async awaitReply(
		channel: TextBasedChannels,
		content: string,
		opts: AwaitMessagesOptions = { time: 60000 * 10, max: 1 },
		remove: boolean
	) {
		const msg = await channel.send(content);
		const response = await msg.channel.awaitMessages(opts);
		if (response && response.first()) {
			msg.delete();
			const result = response.first()!;
			if (remove) response.first()?.delete();
			return result;
		}
		throw new Error("There was a problem waiting for your message, please try again!");
	}

	public async checkPosition(interaction: CommandInteraction, member: GuildMember) {
		const botPosition = interaction.guild?.me?.roles.highest.position;
		const userPosition = member.roles.highest.position;
		const modPosition = interaction.member?.roles.highest.position;
		if (botPosition! <= userPosition) {
			return [
				false,
				`The bot's highest role (${message.guild?.me?.roles.highest}) must be above the user's highest role (${member.roles.highest}) in order to ban that user`,
			];
		} else if (modPosition! <= userPosition) {
			return [
				false,
				`Your highest role (${message.member?.roles.highest}) must be higher than the user's highest role (${member.roles.highest}) in order for me to ban that user`,
			];
		} else {
			return [true, null];
		}
}