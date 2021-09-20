import { CommandInteraction, Interaction } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseSlashCommand from "../../structures/BaseSlashCommand";

export default class PingCommand extends BaseSlashCommand {
    constructor(client: FuzzyClient){
        super(client, {
            name: "ping",
            shortDescription: "Idk",
            args: [],
            cooldown: 0,
        })
    }
    async run(interaction: CommandInteraction){
        interaction.reply("Pong")
    }
}