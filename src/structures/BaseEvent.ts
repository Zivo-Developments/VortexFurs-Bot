import { ClientEvents } from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";

export default abstract class BaseEvent {
	public client: FuzzyClient;
	public eventName: keyof ClientEvents;
	constructor(client: FuzzyClient, options: { eventName: keyof ClientEvents }) {
		this.client = client;
		this.eventName = options.eventName;
	}

	abstract run(client: FuzzyClient, ...args: any): void;
}
