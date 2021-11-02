import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import { Badges } from "../entity/Badges";
import { Guild } from "../entity/Guild";

@EntityRepository(Badges)
export class BadgeRepo extends Repository<Badges> {
    public async findOrCreate(condition: FindConditions<Badges>, create: DeepPartial<Badges>) {
        const badge = await this.findOne(condition);
        if (!badge) await this.save(this.create(create));
        return badge;
    }

    public async createBadge(create: DeepPartial<Badges>) {
        const exist = await this.findOne(create);
        if (exist) throw new Error("Badge already exist!");
        const badge = await this.save(this.create(create));
        return badge;
    }
}
