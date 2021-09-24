import { ApplicationCommand, ApplicationCommandManager, GuildApplicationCommandManager, GuildResolvable } from "discord.js";
import { REST } from "@discordjs/rest";
import * as dotenv from "dotenv";
import FuzzyClient from "./lib/FuzzyClient";
import { Routes } from "discord-api-types";
dotenv.config();

const client = new FuzzyClient({
	intents: ["GUILDS", "GUILD_MESSAGES"],
});

const loadData = async () => {
	await client.loadDatabase();
	await client.loadCommands();
	await client.loadEvents();
};

loadData();

client.login(process.env.TOKEN as string);
