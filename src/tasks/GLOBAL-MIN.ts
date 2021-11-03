import { Schedule } from "../entity/Schedules";
import FuzzyClient from "../lib/FuzzyClient";

export function task(client: FuzzyClient, record: Schedule) {
    client._logger.debug("GLOBAL Minute has been executed")
    return;
}
