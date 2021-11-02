import { CommandInteraction } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import BaseSlashCommand from "../../structures/BaseCommand";

export default class ExecCommand extends BaseSlashCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "reboot",
            shortDescription: "Stop & Reload the Bot!",
            type: "CHAT_INPUT",
            args: [],
            cooldown: 0,
            userPermissions: [],
            botPermissions: [],
            ownerOnly: true,
        });
    }
    async run(interaction: CommandInteraction) {
        this.client.user?.setStatus("dnd")
        // Exit the process
        await interaction.reply(`The bot will turn off and probably restart`);
        process.exit();
    }
}
