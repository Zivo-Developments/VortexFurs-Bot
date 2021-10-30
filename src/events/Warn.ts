import FuzzyClient from "../lib/FuzzyClient";
import BaseEvent from "../structures/BaseEvent";

export default class MemberCreateEvent extends BaseEvent {
    constructor(client: FuzzyClient) {
        super(client, {
            eventName: "warn",
        });
    }
    async run(client: FuzzyClient, warnMsg: string) {
        client._logger.warn(warnMsg);
    }
}
