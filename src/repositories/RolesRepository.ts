import { Message, Role, User } from "discord.js";
import { EntityRepository, Repository } from "typeorm";
import { Roles } from "../entity/Roles";
import FuzzyClient from "../lib/FuzzyClient";

@EntityRepository(Roles)
export class RolesRepo extends Repository<Roles> {
    public async createRoleCategory(name: string, guildID: string, type: "select" | "checkbox") {
        const data = await this.save(
            this.create({
                guildID: guildID,
                name: name,
                type: type,
                uid: name.split(" ").join("-").toLowerCase(),
            }),
        );
        return data;
    }

    public async removeRoleCategory(name: string, guildID: string) {
        const data = await this.delete({
            guildID: guildID,
            uid: name.split(" ").join("-").toLowerCase(),
        });
        if (!data) return false;
        return true;
    }

    public async checkExistance(name: string, guildID: string) {
        const check = await this.findOne({
            guildID: guildID,
            uid: name.split(" ").join("-").toLowerCase(),
        });
        if (check) return true;
        return false;
    }

    public async addRole(name: string, guildID: string, role: Role) {
        const data = await this.findOne({
            guildID: guildID,
            uid: name.split(" ").join("-").toLowerCase(),
        });
        const old = data?.roles;
        old!.push({
            roleID: role.id,
            roleName: role.name
                .replace(/[^a-z0-9\s]/gi, "")
                .replace("/", " ")
                .replace(" ", "-"),
            roleUID: role.name
                .replace("/", " ")
                .replace(/[^a-z0-9\s]/gi, "")
                .split(" ")
                .join("-")
                .toLowerCase()
        });
        let newRoles = old;
        await this.update(
            {
                guildID: guildID,
                uid: name.split(" ").join("-").toLowerCase(),
            },
            { roles: newRoles },
        )
            .then(() => {
                return true;
            })
            .catch((e) => role.guild.client.users.cache.get("852070153804972043")?.send(e));
        if (!data) return false;
    }

    public async removeRole(name: string, guildID: string, role: Role) {
        const data = await this.findOne({
            guildID: guildID,
            uid: name.split(" ").join("-").toLowerCase(),
        });
        const old = data?.roles;
        const ele = old?.filter((ele) => ele.roleID === role.id)[0];
        if (!ele) return false;
        const index = old?.indexOf(ele);
        old.splice(index, 1);
        let newRoles = old;
        await this.update(
            {
                guildID: guildID,
                uid: name.split(" ").join("-").toLowerCase(),
            },
            { roles: newRoles },
        )
            .then(() => {
                return true;
            })
            .catch((e) => role.guild.client.users.cache.get("852070153804972043")?.send(e));
        if (!data) return false;
    }
}
