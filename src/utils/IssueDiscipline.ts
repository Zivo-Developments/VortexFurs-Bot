import { Guild, MessageEmbed, User } from "discord.js";
import moment from "moment";
import { uuid } from "uuidv4";
import { Guild as GuildEntity } from "../entity/Guild";
import { Member } from "../entity/Member";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import { MemberRepo } from "../repositories/MemberRepository";
import { ModcaseRepo } from "../repositories/ModcaseRepository";
import { channelResolver } from "./resolvers";

// TODO(vulpo): Check Back and Add Schedule to work with Temporary Actions
// TODO(vulpo): Restrictions
// TODO(vulpo): Raid Score
// TODO(vulpo): Continue to Improve this
// * REFERENCE: https://github.com/Dracy-Developments/Hozol/blob/master/src/helper/moderation/incidents.ts

export class IssueDiscipline {
    public rulesViolated: string[];
    public reason: string;
    public additionalInfo: string;
    public rolesAdded: string[];
    public rolesRemoved: string[];
    public cannotUseVoiceChannels: boolean;
    public cannotGiveReputation: boolean;
    public cannotUseReportCommand: boolean;
    public cannotUseStaffCommand: boolean;
    public cannotUseConflictCommand: boolean;
    public cannotEditProfile: boolean;
    public banDuration: number | null;
    public muteDuration: number | null;
    public tasks: string[];
    public case: string;
    public guildData: GuildEntity | undefined;
    public memberData: Member | undefined;
    public modCaseRepo: ModcaseRepo;
    public memberRepo: MemberRepo;
    public readonly userEmbed: MessageEmbed;
    constructor(
        public client: FuzzyClient,
        public guild: Guild,
        public issuer: User,
        public violator: User,
        public type: "warning" | "task" | "kick" | "ban" | "mute",
    ) {
        this.client = client;
        this.guild = guild;
        this.issuer = issuer;
        this.violator = violator;
        this.type = type;
        this.rulesViolated = [];
        this.reason = `No reason was provided. Please contact ${guild.name} Staff Team!`;
        this.additionalInfo = `No Additional Information provided`;
        this.rolesAdded = [];
        this.rolesRemoved = [];
        this.cannotUseVoiceChannels = false;
        this.cannotGiveReputation = false;
        this.cannotUseReportCommand = false;
        this.cannotUseConflictCommand = false;
        this.cannotEditProfile = false;
        this.cannotUseStaffCommand = false;
        this.muteDuration = null;
        this.banDuration = null;
        this.tasks = [];
        this.case = uuid();
        this.userEmbed = new MessageEmbed();
        this.getSettings();
        this.setBaseEmbed();
        this.modCaseRepo = this.client.database.getCustomRepository(ModcaseRepo);
        this.memberRepo = this.client.database.getCustomRepository(MemberRepo);
    }

    public async setInfo() {
        switch (this.type) {
            case "ban":
                this.setMuteDuration(null);
                this.userEmbed
                    .setTitle(`You've been banned from ${this.guild.name}!`)
                    .addField("Reason", this.reason, true)
                    .addField("Rules Violated", this.rulesViolated.join(", "), true)
                    .addField(
                        "Duration",
                        `${this.banDuration ? moment().add(this.banDuration, "days").format("LLLL") : "indefinitely"}`,
                        true,
                    )
                    .setFooter(
                        `🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`,
                    );
                break;
            case "kick":
                this.userEmbed
                    .setTitle("You've been kicked from the server")
                    .addField("Reason", this.reason)
                    .setFooter(
                        `🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`,
                    );
                break;
            case "mute":
                if (!this.muteDuration) {
                    this.muteDuration = 0;
                    this.banDuration = null;
                    this.userEmbed
                        .setTitle("You've been muted indeinitely!")
                        .addField("Reason", this.reason)
                        .addField("Rules Violated", this.rulesViolated.join(", "))
                        .setFooter(
                            `🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`,
                        );
                } else {
                    this.banDuration = null;
                    this.userEmbed
                        .setTitle("You've been muted temporarily")
                        .addField("Reason", this.reason)
                        .addField("Rules Violated", this.rulesViolated.join(", "))
                        .setFooter(
                            `🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`,
                        );
                }
            case "task":
                this.setMuteDuration(0);
                this.setBanDuration(null);
                this.userEmbed
                    .setTitle(`You're required to complete task for ${this.guild.name}!`)
                    .addField("Tasks", `- ${this.tasks.join("\n-")}`, true)
                    .addField("Reason", this.reason, true)
                    .addField("Rules Violated", this.rulesViolated.join(", "), true)
                    .setFooter(
                        `🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`,
                    );
                break;
            case "warning":
                this.setMuteDuration(null);
                this.setBanDuration(null);
                this.userEmbed
                    .setTitle(`You've been warned ${this.guild.name}!`)
                    .addField("Warning", this.reason, true)
                    .addField("Rules Violated", this.rulesViolated.join(", "), true)
                    .setFooter(
                        `🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`,
                    );
                break;
        }
    }

    public async addRules(ruleNumber: string) {
        this.rulesViolated.push(ruleNumber);
        return this;
    }

    public async setReason(reason: string) {
        this.reason = reason;
        return this;
    }

    public async setAdditionalInfo(info: string) {
        this.additionalInfo = info;
        return this;
    }

    public async addRoles(roleID: string) {
        this.rolesAdded.push(roleID);
        return this;
    }

    public async removeRoles(roleID: string) {
        this.rolesRemoved.push(roleID);
        return this;
    }

    public async toggleCannotUseVoiceChannels() {
        this.cannotUseVoiceChannels = !this.cannotUseVoiceChannels;
        return this;
    }

    public async toggleCannotGiveReputation() {
        this.cannotGiveReputation = !this.cannotGiveReputation;
        return this;
    }

    public async toggleCannotUseReportCommand() {
        this.cannotUseReportCommand = !this.cannotUseReportCommand;
        return this;
    }

    public async toggleCannotUseConflictCommand() {
        this.cannotUseConflictCommand = !this.cannotUseConflictCommand;
        return this;
    }

    public async toggleCannotEditProfile() {
        this.cannotEditProfile = !this.cannotEditProfile;
        return this;
    }

    public async toggleCannotUseStaffCommand() {
        this.cannotEditProfile = !this.cannotEditProfile;
        return this;
    }

    public async setBanDuration(days: number | null) {
        this.banDuration = days;
        return this;
    }

    public async setMuteDuration(hours: number | null) {
        this.muteDuration = hours;
        return this;
    }

    public async addTasks(task: string) {
        this.tasks.push(task);
        return this;
    }

    private async getSettings() {
        this.guildData = await this.client.database.getCustomRepository(GuildRepo).findOne({ guildID: this.guild.id });
        this.memberData = await this.client.database
            .getCustomRepository(MemberRepo)
            .findOne({ guildID: this.guild.id, userID: this.violator.id });
        return;
    }

    private async setBaseEmbed() {
        this.userEmbed
            .setAuthor(`Issued by: ${this.issuer.tag}`, `${this.issuer.displayAvatarURL({ dynamic: true })}`)
            .setColor(color(this.type))
            .setTimestamp();
    }

    public async finish() {
        // TODO: Restriction Stuff
        await this.modCaseRepo.Issue({
            guildID: this.guild.id,
            userID: this.violator.id,
            issuerID: this.issuer.id,
            appealed: false,
            // @ts-expect-error
            type: this.type,
            rulesViolated: this.rulesViolated,
            reason: this.reason,
            actionsTaken: [],
            violator: this.memberData,
        });

        const modLogChannel = await channelResolver(this.client, this.guildData?.modLogChannelID!)!;
        if (modLogChannel && modLogChannel?.isText()) {
            modLogChannel.send({
                content: `:warning: Discipline was issued against ${this.violator.tag} (${this.violator.id}). Read more information below.`,
                embeds: [this.userEmbed],
            });
        }
        await this.violator
            .send({ embeds: [this.userEmbed] })
            .catch(() => this.client._logger.error("Unable to send that user"));

        if (this.type === "kick") {
            if (
                this.guild.members.cache.get(this.violator.id) &&
                this.guild.members.cache.get(this.violator.id)!.kickable
            )
                this.guild.members.cache.get(this.violator.id)!.kick();
        }

        if (this.banDuration === 0) {
            this.guild.members.ban(this.violator, {
                days: 0,
                reason: this.reason,
            });
            if (this.banDuration !== null && this.banDuration > 0) {
                await this.client.scheduleRepo
                    .createSchedule({
                        uid: `d-${this.case}`,
                        task: "removeBan",
                        data: {
                            user: this.violator.id,
                            guild: this.guild.id,
                        },
                        nextRun: moment().add(this.banDuration, "days").toISOString(true),
                    })
                    .then(async (data) => {
                        await this.client.scheduleManager.addSchedule(data);
                    });
            }
        } else if (this.muteDuration !== null && this.muteDuration > 0) {
            const muteRole = this.guild.roles.cache.get(this.guildData?.muteRoleID!)!;
            if (this.muteDuration === 0 && this.violator) {
                this.guild.members.cache
                    .get(this.violator.id)!
                    .roles.add(muteRole, `Muted was issued on this user by ${this.issuer.tag}`)
                    .then(async () => {
                        await this.memberRepo.update(
                            { guildID: this.guild.id, userID: this.violator.id },
                            { muted: true },
                        );
                    });
            } else {
                if (this.violator) {
                    this.guild.members.cache
                        .get(this.violator.id)!
                        .roles.add(
                            muteRole,
                            `Muted was issued on this user by ${this.issuer.tag}. The mute will be cleared in ${this.muteDuration} minutes`,
                        )
                        .then(async () => {
                            await this.memberRepo.update(
                                { guildID: this.guild.id, userID: this.violator.id },
                                { muted: true },
                            );
                        });
                }
                await this.client.scheduleRepo
                    .createSchedule({
                        uid: `d-${this.case}`,
                        task: "removeMute",
                        data: {
                            user: this.violator.id,
                            guild: this.guild.id,
                        },
                        nextRun: moment().add(this.muteDuration, "minutes").toISOString(true),
                    })
                    .then(async (data) => {
                        await this.client.scheduleManager.addSchedule(data);
                    });
            }
        }

        return this;
    }

    public async toJSON() {
        return {
            issuerID: this.issuer.id,
            violatorID: this.violator.id,
            rulesViolated: this.rulesViolated.join(", "),
            reason: this.reason,
            additionalInfo: this.additionalInfo,
            rolesAdded: this.rolesAdded,
            rolesRemoved: this.rolesRemoved,
            cannotUseVoiceChannels: this.cannotUseVoiceChannels,
            cannotGiveReputation: this.cannotGiveReputation,
            cannotUseReportCommand: this.cannotUseReportCommand,
            cannotUseConflictCommand: this.cannotUseConflictCommand,
            cannotEditProfile: this.cannotEditProfile,
            cannotUseStaffCommand: this.cannotUseStaffCommand,
            muteDuration: this.muteDuration,
            banDuration: this.banDuration,
            tasks: this.tasks,
            case: this.case,
        };
    }
}

function color(type: string | null) {
    switch (type) {
        case "kick":
            return "#6c757d";
        case "ban":
        case "discord-ban":
            return "#dc3545";
        case "antispam":
            return "#17a2b8";
        case "warning":
            return "#ffc107";
        case "string":
            return "#ff851b";
        case "reflection":
            return "#605ca8";
        case "discipline":
            return "#007bff";
        case "investigation":
            return "#f012be";
        default:
            return "#ffffff";
    }
}
