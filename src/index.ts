import { ApplicationCommand, ApplicationCommandManager, GuildApplicationCommandManager, GuildResolvable } from 'discord.js'
import { REST } from '@discordjs/rest'
import * as dotenv from 'dotenv'
import FuzzyClient from './lib/FuzzyClient'
import { Routes } from 'discord-api-types'
dotenv.config()

const client = new FuzzyClient({
    intents: ["GUILDS", "GUILD_MESSAGES"]
})

client.loadDatabase()
client.loadCommands()
client.loadEvents()

client.login(process.env.TOKEN as string)