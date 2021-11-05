import { TextChannel } from "discord.js";
import * as dotenv from "dotenv";
import FuzzyClient from "./lib/FuzzyClient";
import { channelResolver } from "./utils/resolvers";
import * as Sentry from "@sentry/node";
dotenv.config();

const client = new FuzzyClient({
    intents: 32767,
    partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "USER"],
});

process.on("uncaughtException", async (e) => {
    client._logger.error(e instanceof Error ? `${e.message}\n${e.stack}` : (e as string));
    const channel = (await channelResolver(client, client.config.devLogsID)) as TextChannel;
    channel.send(`${client.users.cache.get(client.config.ownerID)} Bot ran into an **UNCAUGHT EXCEPTION**: ${e}`);
    Sentry.captureException(e);
});

process.on("unhandledRejection", async (e) => {
    client._logger.error(e as any);
    const channel = (await channelResolver(client, client.config.devLogsID)) as TextChannel;
    channel.send(
        `${client.users.cache.get(
            client.config.ownerID,
        )} Bot asked a user on a date and ran into an **UNHANDLED REJECTION**: ${e}`,
    );
    Sentry.captureException(e);
});

client.login(process.env.TOKEN as string)