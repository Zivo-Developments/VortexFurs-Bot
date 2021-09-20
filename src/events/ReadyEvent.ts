import FuzzyClient from "../lib/FuzzyClient";
import BaseEvent from "../structures/BaseEvent";

export default class ReadyEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "ready",
		});
	}
	async run(client: FuzzyClient) {
        client.guilds.cache.get("874378015285608568")?.commands.set(client.arrayOfSlashCommands)
	}
}