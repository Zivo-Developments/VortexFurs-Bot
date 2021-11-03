import express from "express";
import FuzzyClient from "../lib/FuzzyClient";
import { RolesRepo } from "../repositories/RolesRepository";
import { ISelectMenuData, roleResolver } from "../utils";
const app = express();
import cors from "cors";
import { MemberRepo } from "../repositories";

export const api = (client: FuzzyClient) => {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(
        cors({
            origin: ["https://hozol.xyz", "http://hozol.xyz", "http://localhost:3000"],
            credentials: true,
        }),
    );
    app.use((req, res, next) => {
        req.client = client;
        next();
    });

    app.get("/forms/select", async (req, res) => {
        const roleRepo = client.database.getCustomRepository(RolesRepo);
        const roles = await roleRepo.find({ guildID: client.config.guildID });
        let data: ISelectMenuData[] = [];
        roles
            .filter((role) => role.type === "select")
            .forEach((r) => {
                data.push({
                    uid: r.uid,
                    name: r.name,
                    roles: r.roles.map((r) => {
                        return {
                            name: r.roleName,
                            value: r.roleUID,
                        };
                    }),
                });
            });
        res.json({ data: data });
    });

    app.get("/forms/checkbox", async (req, res) => {
        const roleRepo = client.database.getCustomRepository(RolesRepo);
        const roles = await roleRepo.find({ guildID: client.config.guildID });
        let data: ISelectMenuData[] = [];
        roles
            .filter((role) => role.type === "checkbox")
            .forEach((r) => {
                data.push({
                    uid: r.uid,
                    name: r.name,
                    roles: r.roles.map((r) => {
                        return {
                            name: r.roleName,
                            value: r.roleUID,
                        };
                    }),
                });
            });
        res.json({ data: data });
    });

    app.post("/profile/create", async (req, res) => {
        const bearer = req.headers["authorization"]!.slice(7);
        if (bearer === process.env.BOTAPISECRET) {
            const { userID, results } = req.body;
            const guild = client.guilds.cache.get(client.config.guildID);
            const member = guild?.members.cache.get(userID);
            const roleRepo = client.database.getCustomRepository(RolesRepo);
            const memberRepo = client.database.getCustomRepository(MemberRepo);
            // TODO: THIS IS UNACCEPTABLE.. MAKE THIS EFFICENT
            await Object.keys(results).forEach(async (uid, value) => {
                if (uid !== "bio") {
                    if (Array.isArray(results[uid])) {
                        (results[uid] as string[]).forEach(async (roleUID) => {
                            const roles = await roleRepo.findOne({ guildID: client.config.guildID, uid: uid });
                            console.table(roleUID);
                            console.table(results[uid]);
                            // @ts-expect-error
                            const role = roles.roles.find((role) => role.roleUID === roleUID);
                            console.log(role);
                            if (role) {
                                member?.roles.add(role?.roleID!).then(() => {
                                    console.log(`Added ${role!.roleName} (${role!.roleID}) to ${member.user.username}`);
                                });
                            }
                        });
                    } else {
                        // @ts-expect-error
                        const role = await roles.roles.find((role) => role.roleUID === roleUID);
                        if (role) {
                            member?.roles.add(role?.roleID!).then(() => {
                                console.log(`Added ${role!.roleName} (${role!.roleID}) to ${member.user.username}`);
                            });
                        }
                    }
                }
            });
            const memberData = await memberRepo.save(
                memberRepo.create({
                    guildID: client.config.guildID,
                    bio: results.bio,
                    userID: userID,
                    created: true,
                }),
            );
            res.status(201).send({ success: true, memberData: memberData });
            return;
        }
        res.status(403).send("FORBIDDEN");
    });

    app.post("/profile", async (req, res) => {
        const bearer = req.headers["authorization"]!.slice(7);
        const { userID } = req.body;
        console.log(userID);
        if (bearer !== process.env.BOTAPISECRET) return res.status(403).send("FORBIDDEN");
        console.log("YAY");
        const memberRepo = client.database.getCustomRepository(MemberRepo);
        const guild = client.guilds.cache.get(client.config.guildID);
        const member = guild?.members.cache.get(userID);
        const profile = await memberRepo.findOne({ guildID: client.config.guildID, userID: userID });
        if (!member) return res.status(418).json({ error: "Member is not in the server", type: "NOTINGUILD" });
        console.log(profile);
        console.log(profile?.created);
        if (!profile || !profile.created)
            return res.status(418).json({ error: "User doesn't have profile", type: "NOPROFILE" });
        return res.status(200).json({
            profileData: {
                bio: profile.bio,
                xp: profile.xp,
                roles: member?.roles.cache.filter(r => r.permissions.bitfield === 0n).map((r) => r.name),
                color: member.displayHexColor,
                tokens: profile.tokens,
                // TODO: ACHIEVEMENTS & BADGES
            },
        });
    });

    app.listen(3621, () => {
        client._logger.info("API Listening on Port 3621");
    });
};

interface Result {
    bio: string;
    step: number;
    pronouns: string;
    region: string;
    gender: string;
    sexuality: string;
    colors: string[];
    hobbies: string[];
    species: string[];
    pings: string[];
}
