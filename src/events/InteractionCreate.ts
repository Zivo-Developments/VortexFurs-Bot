import { Interaction } from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";
import BaseEvent from "../structures/BaseEvent";

export default class ReadyEvent extends BaseEvent {
	constructor(client: FuzzyClient) {
		super(client, {
			eventName: "interactionCreate",
		});
	}
	async run(client: FuzzyClient, interaction: Interaction) {
        if(interaction.isCommand()){
            await interaction.deferReply().catch(() => {});
            const cmd = client.slashCommands.get(interaction.commandName)
            if(!cmd) return;
            cmd.run(interaction)
        }
	}
}