import FuzzyClient from "../lib/FuzzyClient";
import BaseEvent from "../structures/BaseEvent";

export default class ReadyEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "guildMemberAdd",
		});
	}
	async run(client: FuzzyClient) {
		
	}
}
