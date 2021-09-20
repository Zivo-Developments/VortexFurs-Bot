import { PermissionFlags, PermissionResolvable, Permissions } from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";

export type CommandsOptions = {
    client: FuzzyClient
    name: string
    description: string
    aliases: string[]
    examples: string[]
    userPermissions: Array<keyof PermissionFlags>
    botPermissions: Array<keyof PermissionFlags>
    category: string
}