import { GuildApplicationCommandPermissionData } from "discord.js";
import * as dotenv from "dotenv";
import { api } from "./api";
import FuzzyClient from "./lib/FuzzyClient";
import { GuildRepo } from "./repositories";
import { channelResolver } from "./utils/resolvers";
dotenv.config();

const client = new FuzzyClient({
    intents: 32767,
});

const loadData = async () => {
    await client.loadDatabase();
    await client.loadCommands();
    await client.loadSchedules();
    await client.loadEvents();
    await api(client);
};

loadData();

process.on("uncaughtException", async (e) => {
    client._logger.error(e as any)
    const channel = await channelResolver(client, client.config.devLogsID);
    if (channel && channel.isText()) {
        channel.send(`${client.users.cache.get(client.config.ownerID)} Bot ran into an **UNCAUGHT EXCEPTION**: ${e}`);
    }
});
process.on("unhandledRejection", async (e) => {
    client._logger.error(e as any)
    const channel = await channelResolver(client, client.config.devLogsID);
    if (channel && channel.isText()) {
        channel.send(
            `${client.users.cache.get(
                client.config.ownerID,
            )} Bot asked a user on a date and ran into an **UNHANDLED REJECTION**: ${e}`,
        );
    }
});

client.login(process.env.TOKEN as string);
