import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Guild {
	@PrimaryGeneratedColumn()
	id: number;
	@Column()
	guildID: string;
	@Column({ default: null })
	verifiedRoleID: string;
	@Column({ default: null })
	nickNameLogChannelID: string;
	@Column({ default: null })
	autoModLogChannelID: string;
	@Column({ default: null })
	vcLogChannelID: string;
	@Column({ default: null })
	banLogChannelID: string;
	@Column({ default: null })
	kickLogChannelID: string;
	@Column({ default: null })
	joinLogChannelID: string;
	@Column({ default: null })
	leaveLogChannelID: string;
	@Column({ default: null })
	messageLogChannelID: string;
	@Column({ default: null })
	imageLogChannelID: string;
	@Column({ default: null })
	modCMDsLogChannelID: string;
	@Column({ default: null })
	channelLogChannelID: string;
	@Column({ default: null })
	membersLogChannelID: string;
	@Column({ default: null })
	flagLogChannelID: string;
	@Column({ default: null })
	modmailLogChannelID: string;
	@Column({ default: null })
	verificationLogChannelID: string;
	@Column({ default: null })
	welcomeRoleID: string;
	@Column({ default: null })
	generalChannel: string;
	@Column("text", { default: null })
	welcomeMessage: string;
	@Column({ default: null })
	staffRoleID: string;
	@Column({ default: null })
	pendingVerficiatonChannelID: string;
	@Column({ default: null })
	eventLogChannel: string;
}
