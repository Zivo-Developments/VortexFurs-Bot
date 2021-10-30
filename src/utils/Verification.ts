// Imports
import { Guild, Message, MessageActionRow, MessageButton, MessageEmbed, User } from "discord.js";
import moment from "moment";
import FuzzyClient from "../lib/FuzzyClient";
import { GuildRepo } from "../repositories/GuildRepository";
import { VerificationRepo } from "../repositories/VerificationRepo";

export default class Verification {
    public questions: string[];
    private responses: string[];
    private trollMeter: number;
    private trollReasons: string[];
    constructor(public client: FuzzyClient, public user: User, public guild: Guild) {
        this.client = client;
        this.user = user;
        this.guild = guild;
        this.questions = [
            "1. Where did you found this server? Please be specific as possible",
            "2. What made you interested in joining this server and why are you joining this server",
            "3. What's your Age",
            "4. Have you read the rules?",
            "5. Are you a Furry? If so what is your sona otherwise please put a dash on this question ",
        ];
        // Responses for future use initalized as an empty array
        this.responses = [];
        this.trollMeter = 0;
        this.trollReasons = [];
    }

    public async beginVerification() {
        // This loop will loop through each question, this will send an embed and then await a message
        for (let i = 0; i < this.questions.length; i++) {
            // This will make the embed that includes the message
            const embed = new MessageEmbed()
                .setAuthor(this.user.tag, this.user.displayAvatarURL({ dynamic: true }))
                .setTitle(`Question #${i + 1}`)
                .setDescription(this.questions[i])
                .setColor("#ff1493");
            // This will send and await the message privately
            const question = await this.user.send({
                embeds: [embed],
            });
            const filter = (m: Message) => m.author.id == this.user.id && !m.author.bot;
            // Await the message and pushed the response when sent
            await question.channel.awaitMessages({ max: 1, filter, time: 60000 * 5 }).then((e) => {
                let response = e.first()?.content;
                if (typeof response !== "undefined") {
                    this.responses.push(response);
                } else {
                    const embed = new MessageEmbed()
                        .setTitle("Verification Cancelled")
                        .setAuthor(this.user.tag, this.user.displayAvatarURL({ dynamic: true }))
                        .setColor("#ff1493")
                        .setDescription(
                            "Heya, just to let you know that you need to redo the verification due to the amount of time waited which lead to it being cancelled",
                        )
                        .setFooter(`Go to the verification channel and re-run the .verify command`);
                    return this.user.send({ embeds: [embed] });
                }
            });
        }
        const embed = new MessageEmbed()
            .setAuthor(this.user.tag, this.user.displayAvatarURL({ dynamic: true }))
            .setThumbnail(this.user.displayAvatarURL({ dynamic: true }))
            .setColor("#ff1493")
            .setDescription(
                "Alrighty! Your Verification has been placed in the verification queue for Staff to review. This may take up to 5 to 15 minutes.",
            );
        this.user.send({ embeds: [embed] });
        this.sendVerificationRequest();
    }

    private async sendVerificationRequest() {
        const embed = new MessageEmbed()
            .setAuthor(this.user.username, this.user.displayAvatarURL({ dynamic: true }))
            .setTitle("Click here for Reverse Image Search")
            .setURL(`https://www.google.com/searchbyimage?&image_url=${this.user.displayAvatarURL({ dynamic: true })}`)
            .setColor("#ff1493")
            .setThumbnail(this.user.displayAvatarURL({ dynamic: true }))
            .addField("Created Account", moment(this.user.createdAt).format("LLLL"), true)
            .addField("Joined", moment(this.guild.members.cache.get(this.user.id)?.joinedAt).format("LLLL"), true);
        for (let i = 0; i < this.questions.length; i++) {
            embed.addField(this.questions[i], this.responses[i]);
        }
        if (!this.client.database) throw new Error("Database prob, contact vulpo");
        const GuildRepository = this.client.database.getCustomRepository(GuildRepo);
        const guildData = await GuildRepository.findOne({ guildID: this.guild.id });
        const pendingVerificationChannel = await this.guild.channels.cache.get(guildData?.pendingVerficiatonChannelID!);
        if (!pendingVerificationChannel?.isText()) throw new Error("Pending verfication must be a text channel");
        const actions = await this.createActionButtons();
        const pending = await pendingVerificationChannel.send({ embeds: [embed], components: [actions] });
        this.postToDatabase(pending);
    }

    private async postToDatabase(pendingVerificationMSG: Message) {
        if (!this.client.database) return;
        const verifyRepo = this.client.database.getCustomRepository(VerificationRepo);
        await verifyRepo.createVerification(this.client, pendingVerificationMSG, this.user);
    }

    private async createActionButtons() {
        return new MessageActionRow()
            .addComponents(
                new MessageButton({
                    customId: `ACCEPT-${this.user.id}`,
                    style: "SUCCESS",
                    label: "Accept",
                }),
            )
            .addComponents(
                new MessageButton({
                    customId: `DENY-${this.user.id}`,
                    style: "DANGER",
                    label: "Deny",
                }),
            )
            .addComponents(
                new MessageButton({
                    customId: `QUESTION-${this.user.id}`,
                    style: "SECONDARY",
                    label: "Question",
                }),
            )
            .addComponents(
                new MessageButton({
                    customId: `BAN-${this.user.id}`,
                    style: "DANGER",
                    label: "Ban",
                }),
            )
            .addComponents(
                new MessageButton({
                    customId: `KICK-${this.user.id}`,
                    style: "DANGER",
                    label: "Kick",
                }),
            );
    }

    public static DeleteVerification(client: FuzzyClient, userID: string, guildID: string) {
        const verifyRepo = client.database!.getCustomRepository(VerificationRepo);
        verifyRepo.delete({ userID, guildID });
    }
}
