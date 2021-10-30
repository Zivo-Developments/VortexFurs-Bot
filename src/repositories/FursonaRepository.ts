import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import { Fursona } from "../entity/Fursona";

@EntityRepository(Fursona)
export class FursonaRepo extends Repository<Fursona> {
    public async findOrCreate(condition: FindConditions<Fursona>, create: DeepPartial<Fursona>) {
        const fursona = await this.findOne(condition);
        if (!fursona) await this.save(this.create(create));
        return fursona;
    }

    public async createSona(create: DeepPartial<Fursona>) {
        const fursona = await this.save(this.create(create));
        return fursona;
    }
}
