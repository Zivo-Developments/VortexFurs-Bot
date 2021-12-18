import express from "express";
import FuzzyClient from "../lib/FuzzyClient";
import { RolesRepo } from "../repositories/RolesRepository";
import { ISelectMenuData, memberResolver, roleResolver } from "../utils";
const app = express();
import cors from "cors";
import { MemberRepo } from "../repositories";
import { getLevelFromXP, getXPFromLevel } from "../utils/Leveling";
import { PartnersRepo } from "../repositories/PartnersRepository";

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

    app.get("/partners", async (req, res) => {
        const partnersRepo = client.database.getCustomRepository(PartnersRepo);
        const partners = await partnersRepo.find({});
        const partnerList = partners.map((partner) => {
            const tag = req.client.users.cache.get(partner.rep)!.tag;
            return {
                name: partner.serverName,
                rep: tag,
                summary: partner.summary,
                invite: partner.invite,
                iconURL: partner.iconURL,
            };
        });
        res.json({ data: partnerList });
    });

    app.get("/staff", async (req, res) => {
        const guild = req.client.guilds.cache.get(req.client.config.guildID);
        const staff: { [x: string]: { username: string; icon: string }[] } = {};
        for (const role in req.client.config.staffRoles) {
            const position = role;
            staff[position] = [];

            // @ts-expect-error
            guild!?.roles.cache.get(req.client.config.staffRoles[position])?.members.forEach(async (member) => {
                let memberData: any = {};
                memberData["username"] = member.user.username;
                memberData["avatar"] = member.user.displayAvatarURL({ dynamic: true });
                staff[role].push(memberData);
            });
        }
        res.send(staff);
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
                        const roles = await roleRepo.findOne({ guildID: client.config.guildID, uid: uid });
                        const role = roles!.roles.find((role) => results[uid] === role.roleUID);
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
        if (!profile || !profile.created)
            return res.status(418).json({ error: "User doesn't have profile", type: "NOPROFILE" });
        return res.status(200).json({
            profileData: {
                bio: profile.bio,
                xp: {
                    level: getLevelFromXP(profile.xp),
                    xp: profile.xp,
                    nextLevelXP: getXPFromLevel(getLevelFromXP(profile.xp) + 1),
                },
                roles: member?.roles.cache
                    .filter((r) => r.permissions.bitfield === 0n)
                    .map((r) => r.name)
                    .sort((a, b) => {
                        if (a.length < b.length) return 1;
                        return -1;
                    }),
                color: member.displayHexColor,
                tokens: profile.tokens,
                pronouns: member.roles.cache
                    .map((role) => {
                        return role.name
                            .replace("/", " ")
                            .replace(/[^a-z0-9\s]/gi, "")
                            .replace(" ", "-");
                    })
                    .find((r) => r === "He-Him" || r === "She-Her" || r === "They-Them"),
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
