import { Fursona } from "../entity/Fursona";
import { EntityRepository, Repository } from "typeorm";
import FuzzyClient from "../lib/FuzzyClient";

@EntityRepository(Fursona)
export class GuildRepo extends Repository<Fursona> {}
