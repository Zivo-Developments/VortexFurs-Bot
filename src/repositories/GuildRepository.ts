import { Guild } from "../entity/Guild";
import { EntityRepository, Repository } from "typeorm";
import FuzzyClient from "../lib/FuzzyClient";

@EntityRepository(Guild)
export class GuildRepo extends Repository<Guild> {
	public async findOneOrCreateByGID(client: FuzzyClient, guildID: string) {
		const guild = await this.findOne({ guildID: guildID });
		if (!guild) {
			let guild = new Guild()
            guild.guildID = guildID;
            await this.save(guild).then(() => {
                console.log(`Created Guild Data for Guild ID: ${guildID}`)
            })
		}
		return guild;
	}
}