import { Message, User } from "discord.js";
import { DeepPartial, EntityRepository, Repository } from "typeorm";
import { Schedule } from "../entity/Schedules";
import { Verification } from "../entity/Verification";
import FuzzyClient from "../lib/FuzzyClient";

@EntityRepository(Verification)
export class VerificationRepo extends Repository<Verification> {
    public async createVerification(client: FuzzyClient, msg: Message, user: User) {
        const data = await this.save(
            this.create({
                guildID: msg.guild!.id,
                pendingVerificationID: msg.id,
                userID: user.id,
                questionChannelID: undefined,
                questioning: false,
            }),
        );
        return data;
    }
}
