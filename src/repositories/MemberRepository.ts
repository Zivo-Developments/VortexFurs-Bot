import { DeepPartial, EntityRepository, FindConditions, Repository } from "typeorm";
import { Member } from "../entity/Member";

@EntityRepository(Member)
export class MemberRepo extends Repository<Member> {
    public async findOrCreate(condition: FindConditions<Member>, create: DeepPartial<Member>) {
        const member = await this.findOne(condition);
        if (!member) await this.save(this.create(create));
        return member;
    }
}
