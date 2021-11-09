import { Message } from "discord.js";

export const getLevelingFromMsg = (msg: Message) => {
    let xp = config["baseScore"];
    const length = msg.content.length / 128;
    xp += length * config["messageXPPer128Characters"];
    if (msg.attachments) xp += config["attachmentScore"];
    xp += Math.random() * (config["maxRandomXP"] - config["minRandomXP"]) + config["minRandomXP"];
    xp = Math.floor(xp * config["multiplier"]);
    return xp;
};

export const getLevelFromXP = (xp: number) => {
    return Math.floor(0.177 * Math.sqrt(xp)) + 1;
};

export const getXPFromLevel = (level: number) => {
    return Math.floor(Math.pow(level - 1 / 0.177, 2));
};

// TODO: Remove this and shove this into a database hardcoder smh
const config = {
    baseScore: 0,
    multiplier: 1,
    messageXPPer128Characters: 5,
    attachmentScore: 5,
    minRandomXP: 1,
    maxRandomXP: 10,
};
