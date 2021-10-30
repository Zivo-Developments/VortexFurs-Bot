import FuzzyClient from "../lib/FuzzyClient";
import { ColorResolvable } from "discord.js";

declare global {
    namespace Express {
        interface Request {
            client: FuzzyClient;
        }
    }
}

declare module "config.json" {
    color: ColorResolvable;
    export default color;
}
