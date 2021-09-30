import {
	ApplicationCommand,
	ApplicationCommandManager,
	GuildApplicationCommandManager,
	GuildResolvable,
} from "discord.js";
import { REST } from "@discordjs/rest";
import * as dotenv from "dotenv";
import FuzzyClient from "./lib/FuzzyClient";
import { Routes } from "discord-api-types";
import { channelResolver } from "./utils/resolvers";
dotenv.config();

const client = new FuzzyClient({
	intents: 32767,
});

const loadData = async () => {
	await client.loadDatabase();
	await client.loadCommands();
	await client.loadEvents();
};

loadData();

process.on("uncaughtException", async (e) => {
	const channel = await channelResolver(client, client.config.devLogsID);
	if (channel && channel.isText()) {
		channel.send(`${client.users.cache.get(client.config.ownerID)} Bot ran into an **UNCAUGHTEXCEPTION**: ${e}`);
	}
});
process.on("unhandledRejection", async (e) => {
	const channel = await channelResolver(client, client.config.devLogsID);
	if (channel && channel.isText()) {
		channel.send(
			`${client.users.cache.get(
				client.config.ownerID
			)} Bot asked a user on a date and ranned into an **UNHANDLED REJECTION**: ${e}`
		);
	}
});


client.login(process.env.TOKEN as string);
