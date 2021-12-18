import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import { Partners } from "../entity/Partners";

@EntityRepository(Partners)
export class PartnersRepo extends Repository<Partners> {
    public async createPartnership(create: DeepPartial<Partners>): Promise<[true, null] | [false, any]> {
        await this.save(this.create(create)).catch((e) => {
            return [false, e];
        });
        return [true, null];
    }
}
