import {
	AwaitMessagesOptions, GuildMember, TextBasedChannels
} from "discord.js";
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

	public async checkPosition(member: GuildMember, violator: GuildMember): Promise<[boolean, string]> {
		const botPosition = member.guild?.me?.roles.highest.position;
		const userPosition = violator.roles.highest.position;
		const modPosition = member.roles.highest.position;
		if (botPosition! <= userPosition) {
			return [
				false,
				`The bot's highest role (${member.guild?.me?.roles.highest}) must be above the user's highest role (${violator.roles.highest}) in order to ban that user`,
			];
		} else if (modPosition! <= userPosition) {
			return [
				false,
				`Your highest role (${member?.roles.highest}) must be higher than the user's highest role (${violator.roles.highest}) in order for me to ban that user`,
			];
		} else {
			return [true, "User has permissions"];
		}
	}
}
