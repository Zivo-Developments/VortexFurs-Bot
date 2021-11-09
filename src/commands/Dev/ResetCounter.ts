import { CommandInteraction } from "discord.js";
import FuzzyClient from "../../lib/FuzzyClient";
import { GuildRepo } from "../../repositories";
import BaseSlashCommand from "../../structures/BaseCommand";

export default class ExecCommand extends BaseSlashCommand {
    constructor(client: FuzzyClient) {
        super(client, {
            name: "reset",
            shortDescription: "Reset Counter!",
            type: "CHAT_INPUT",
            args: [],
            cooldown: 0,
            userPermissions: [],
            botPermissions: [],
            ownerOnly: true,
        });
    }
    async run(interaction: CommandInteraction) {
        const guild = this.client.database.getCustomRepository(GuildRepo);
        await guild.update({ guildID: interaction.guild!.id }, { messageCounter: 0 });
        interaction.followUp("E")
    }
}
