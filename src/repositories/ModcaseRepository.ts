import { DeepPartial, EntityRepository, Repository } from "typeorm";
import { ModCase } from "../entity/ModCase";

@EntityRepository(ModCase)
export class ModcaseRepo extends Repository<ModCase> {
    public async Issue(createData: DeepPartial<ModCase>) {
        await this.save(this.create(createData));
        return true;
    }
}
