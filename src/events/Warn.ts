import { GuildMember, InviteStageInstance, Message, MessageEmbed } from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import BaseEvent from "../structures/BaseEvent";
import { channelResolver } from "../utils/resolvers";

export default class MemberCreateEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "warn",
		});
	}
	async run(client: FuzzyClient, warnMsg: string) {
		console.log(warnMsg)
	}
}
