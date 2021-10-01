import FuzzyClient from "../lib/FuzzyClient";
import BaseEvent from "../structures/BaseEvent";

export default class MemberCreateEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "error",
		});
	}
	async run(client: FuzzyClient, errorMsg: string) {
		console.log(errorMsg)
	}
}
