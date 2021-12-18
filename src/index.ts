import * as dotenv from "dotenv";
import FuzzyClient from "./lib/FuzzyClient";
import * as Sentry from "@sentry/node";
dotenv.config();

const client = new FuzzyClient({
    intents: 32767,
    partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "USER"],
});

process.on("uncaughtException", async (e) => {
    client._logger.error(e instanceof Error ? `${e.message}\n${e.stack}` : (e as string));
    Sentry.captureException(e);
});

process.on("unhandledRejection", async (e) => {
    client._logger.error(e instanceof Error ? `${e.message}\n${e.stack}` : (e as string));
    Sentry.captureException(e);
});

client.login(process.env.TOKEN as string)
