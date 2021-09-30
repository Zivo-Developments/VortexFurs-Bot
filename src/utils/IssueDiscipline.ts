import { GuildMember, MessageEmbed, Guild } from "discord.js";
import moment from "moment";
import { Guild as GuildEntity } from "../entity/Guild";
import { Member } from "../entity/Member";
import { ModCase } from "../entity/ModCase";
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
	public type: "warning" | "discipline" | "antispam" | "task" | "kick" | "ban";
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
		public issuer: GuildMember,
		public violator: GuildMember
	) {
		this.client = client;
		this.guild = guild;
		this.issuer = issuer;
		this.violator = violator;
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
		this.case = this.client.utils.uid();
		this.userEmbed = new MessageEmbed();
		this.getSettings();
		this.setBaseEmbed();
		this.modCaseRepo = this.client.database.getCustomRepository(ModcaseRepo);
		this.memberRepo = this.client.database.getCustomRepository(MemberRepo);
	}

	public async setType(type: "warning" | "discipline" | "antispam" | "task" | "kick" | "ban") {
		this.type = type;
		return this;
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
			.setAuthor(`Issued by: ${this.issuer.user.tag}`, `${this.issuer.user.displayAvatarURL({ dynamic: true })}`)
			.setColor(color(this.type))
			.setTimestamp();
	}

	public async warnUser() {
		this.setMuteDuration(null);
		this.setBanDuration(null);
		this.userEmbed
			.setTitle("You've been warned!")
			.setDescription(
				"Due to your recent actions, you've have been warned! Please review the information provided below, Future incidents will result in harsher punishments"
			)
			.addField("Warning", this.reason)
			.addField("Rules Violated", this.rulesViolated.join(", "))
			.setFooter(
				`🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`
			);
	}

	public async assignTask() {
		this.setMuteDuration(0);
		this.setBanDuration(null);
		this.userEmbed
			.setTitle("You're required to complete task!")
			.setDescription(
				"Due to your recent actions, you've have been muted until you fulfils all of the tasks! Please review the information provided below!"
			)
			.addField("Tasks", `- ${this.tasks.join("\n-")}`)
			.addField("Reason", this.reason)
			.addField("Rules Violated", this.rulesViolated.join(", "))
			.setFooter(
				`🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`
			);
	}

	public async banUser() {
		this.setMuteDuration(0);
		if (!this.banDuration) {
			this.userEmbed
				.setTitle("You've been banned Indefinitely!")
				.setDescription(
					"Due to your recent actions, you've have been banned from the server we hope you enjoyed your stay and wish you the best in your future endeavors.! Please review the information provided below!"
				)
				.addField("Reason", this.reason)
				.addField("Rules Violated", this.rulesViolated.join(", "))
				.setFooter(
					`🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`
				);
		} else {
			this.userEmbed
				.setTitle("You've been banned temporarily!")
				.setDescription(
					"Due to your recent actions, you've have been banned temporarily from the server to reflect, and improve your behavior. Please review the information provided below!"
				)
				.addField("Reason", this.reason)
				.addField("You'll be unbanned on", moment().add(this.banDuration, "days").format("LLLL"))
				.addField("Rules Violated", this.rulesViolated.join(", "))
				.setFooter(
					`🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`
				);
		}
	}

	private async banEmbed() {
		// Bans, If the Ban Duration is specified
		if (this.banDuration !== null) {
			// if the ban equals zero
			if (this.banDuration === 0) {
				this.userEmbed.addField("You have been indefinitely banned", "We hope you enjoyed your stay");
			} else {
				this.userEmbed.addField(
					`You have been temporarily banned for ${this.banDuration} days`,
					`Please use this time to reflect and improve your behavior`
				);
			}
		}
	}

	public async muteUser() {
		if (!this.muteDuration) {
			this.muteDuration = 0;
			this.banDuration = null;
			this.userEmbed
				.setTitle("You've been muted indeinitely!")
				.setDescription(
					`Your behavior cannot be tolerated in our guild. An indefinite mute has been issued against you and can be lifted by staff. Please read the following information carefully!`
				)
				.addField("Reason", this.reason)
				.addField("Rules Violated", this.rulesViolated.join(", "))
				.setFooter(
					`🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`
				);
		} else {
			this.banDuration = null;
			this.userEmbed
				.setTitle("You've been muted temporarily")
				.setDescription(
					`Your conduct has caused significant problems in the community. Please read the following information carefully.`
				)
				.addField("Reason", this.reason)
				.addField("Rules Violated", this.rulesViolated.join(", "))
				.setFooter(
					`🗒️ Case ID: ${this.case}\n❓ If you have any questions regarding about your warning please contact staff\n😊 Thank you for your understanding and cooperation.`
				);
		}
	}

	public async kickUser() {
		if (this.violator && this.violator.kickable) this.violator.kick();
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

		if (this.banDuration !== null) {
			await this.banEmbed();
			await this.violator.send({ embeds: [this.userEmbed] }).catch(() => console.log("Unable to send that user"));
			if (this.banDuration === 0) {
				this.guild.members.ban(this.violator, {
					days: 0,
					reason: this.reason,
				});
			} else {
				await this.banEmbed();
				await this.violator
					.send({ embeds: [this.userEmbed] })
					.catch(() => console.log("Unable to send that user"));
				this.guild.members.ban(this.violator, {
					days: 0,
					reason: this.reason,
				});
				// TODO: Work ON Scheduling and Schedule the Unban Task
			}
		} else if (this.muteDuration !== null) {
			const muteRole = this.guild.roles.cache.get(this.guildData?.muteRoleID!)!;
			if (this.muteDuration === 0 && this.violator) {
				await this.violator
					.send({ embeds: [this.userEmbed] })
					.catch(() => console.log("Unable to send that user"));
				this.violator.roles
					.add(muteRole, `Muted was issued on this user by ${this.issuer.user.tag}`)
					.then(async () => {
						await this.memberRepo.update(
							{ guildID: this.guild.id, userID: this.violator.id },
							{ muted: true }
						);
					});
			} else {
				if (this.violator) {
					await this.violator
						.send({ embeds: [this.userEmbed] })
						.catch(() => console.log("Unable to send that user"));
					this.violator.roles
						.add(
							muteRole,
							`Muted was issued on this user by ${this.issuer.user.tag}. The mute will be cleared in ${this.muteDuration} minutes`
						)
						.then(async () => {
							await this.memberRepo.update(
								{ guildID: this.guild.id, userID: this.violator.id },
								{ muted: true }
							);
						});
				}
				// TODO: Schedule to the Unmute Task
			}
		} else {
			if (this.type !== "kick") {
				await this.violator
					.send({ embeds: [this.userEmbed] })
					.catch(() => console.log("Unable to send that user"));
			}
		}

		if (this.type === "kick") {
			const modLogChannel = await channelResolver(this.client, this.guildData?.modLogChannelID!)!;
			if (modLogChannel && modLogChannel?.isText()) {
				modLogChannel.send({
					content: `:warning: Discipline was issued against ${this.violator.user.tag} (${this.violator.user.id}). They have been kicked.`,
					embeds: [this.userEmbed],
				});
			}
		}

		return this;
	}

	public async toJSON() {
		return {
			issuerID: this.issuer.user.id,
			violatorID: this.violator.user.id,
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
