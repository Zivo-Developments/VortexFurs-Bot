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
export const config: LevelingConfig = {
    baseScore: 0,
    multiplier: 1,
    messageXPPer128Characters: 5,
    attachmentScore: 5,
    minRandomXP: 1,
    maxRandomXP: 10,
    levelRoles: {
        5: {
            remove: ["889360912140619797"],
            add: ["889362431430787142", "889364416141856770", "889364813896097863"],
        },
        10: {
            remove: ["889362431430787142"],
            add: ["889363469277732874"],
        },
        15: {
            remove: ["889363469277732874"],
            add: ["889364054550908999"],
        },
        20: {
            remove: ["889364054550908999"],
            add: ["889363601608036383", "889364981831831572"],
        },
        25: {
            remove: ["889363601608036383"],
            add: ["889363950473478154"],
        },
    },
};

interface LevelingConfig {
    baseScore: number;
    multiplier: number;
    messageXPPer128Characters: number;
    attachmentScore: number;
    minRandomXP: number;
    maxRandomXP: number;
    levelRoles: {
        [index: number]: {
            remove: string[];
            add: string[];
        };
    };
}
