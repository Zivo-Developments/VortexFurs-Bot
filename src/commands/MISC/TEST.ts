import { CommandInteraction, MessageEmbed } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseCommand from "../../structures/BaseCommand";

export default class PingCommand extends BaseCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "test",
            botPermissions: [],
            shortDescription: "test the bot!",
            userPermissions: [],
            args: [],
            type: "CHAT_INPUT",
            cooldown: 100,
            extendedDescription: "test the bot and get it'll throw new error",
        });
    }
    async run(interaction: CommandInteraction) {
        throw new Error(`test`)
    }
}
