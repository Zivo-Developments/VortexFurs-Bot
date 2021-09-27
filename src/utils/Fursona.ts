import {
	CommandInteraction,
	MessageActionRow,
	MessageComponentInteraction,
	MessageEmbed,
	MessageSelectMenu,
	MessageSelectOptionData,
} from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";
import uuid from "uuid";
import { uniqueId } from "lodash";

export default class Fursona {
	public _id: number;
	public sonaUID: string;
	public sonaName: string;
	public species: string;
	public age: number;
	public height: string;
	public artworks: number;
	public sonaSexuality: string;
	private client: FuzzyClient;
	private embed: MessageEmbed;
	private interaction: CommandInteraction;
	private filter: (m: MessageComponentInteraction) => boolean = (m) => {
		m.deferUpdate();
		return m.user.id === this.interaction.user.id;
	};
	private avaliableSexualities: MessageSelectOptionData[] = [
		{
			label: "Hetrosexual",
			value: "hetrosexual",
			emoji: "❤️",
		},
		{
			label: "Homosexual",
			value: "homosexual",
			emoji: "🏳️‍🌈",
		},
		{
			label: "Bisexual",
			value: "bisexual",
			emoji: "💙",
		},
		{
			label: "Pansexual",
			value: "pansexual",
			emoji: "💛",
		},
		{
			label: "Transgender",
			value: "transgender",
			emoji: "🏳️‍⚧️",
		},
	];
	constructor(client: FuzzyClient, interation: CommandInteraction) {
		this.client = client;
		this.interaction = interation;
		this.sonaUID = uniqueId();
		this.initalize();
	}

	public async initalize() {
		this.embed = new MessageEmbed()
			.setAuthor(this.interaction.user.tag, this.interaction.user.displayAvatarURL({ dynamic: true }))
			.setTitle("Lets create your sona!")
			.setDescription("We'll be asking you a couple of questions related to your sona and update as you respond")
			.setColor(this.client.config.color)
			.setFooter(`User ID: ${this.interaction.user.id}`);
		this.interaction.reply({ embeds: [this.embed] });
		return;
	}

	public async startQuestion() {
		await this.questionName();
		await this.questionAge()
		await this.questionSpecies()
		await this.questionHeight()
		await this.questionSexuality();
	}

	public async questionName() {
		const name = await this.client.utils.awaitReply(
			this.interaction.channel!,
			"What's your sona's name?",
			{
				max: 1,
				filter: (m) => m.author.id === this.interaction.user.id,
				time: 60000 * 10,
			},
			true
		);
		this.sonaName = name.content;
		this.embed.addField("Name", this.sonaName);
		this.interaction.editReply({ embeds: [this.embed] });
		return;
	}

	public async questionAge() {
		let age;
		do {
			age = await this.client.utils.awaitReply(
				this.interaction.channel!,
				"How old is your sona? (Please Make sure it's a number and greater than 0).",
				{
					max: 1,
					filter: (m) => m.author.id === this.interaction.user.id,
					time: 60000 * 10,
				},
				true
			);
		} while (isNaN(parseInt(age.content)) || parseInt(age.content) < 0);
		this.age = parseInt(age.content);
		this.embed.addField("Age", this.age.toString());
		this.interaction.editReply({ embeds: [this.embed] });
		return;
	}

	public async questionSpecies() {
		let species = await this.client.utils.awaitReply(
			this.interaction.channel!,
			"What Species is your Sona?",
			{
				max: 1,
				filter: (m) => m.author.id === this.interaction.user.id,
				time: 60000 * 10,
			},
			true
		);
		this.species = species.content;
		this.embed.addField("Species", this.species.toString());
		this.interaction.editReply({ embeds: [this.embed] });
		return;
	}

	public async questionHeight() {
		let height = await this.client.utils.awaitReply(
				this.interaction.channel!,
				"What is your sona's height? (Please Make sure it's a number and greater than 0).",
				{
					max: 1,
					filter: (m) => m.author.id === this.interaction.user.id,
					time: 60000 * 10,
				},
				true
			);
		this.height = height.content;
		this.embed.addField("Height", this.height);
		this.interaction.editReply({ embeds: [this.embed] });
		return;
	}

	public async questionSexuality() {
		const sexualitySelections = new MessageActionRow().addComponents(
			new MessageSelectMenu()
				.setCustomId("sexuality-menu")
				.addOptions(this.avaliableSexualities)
				.setPlaceholder("Select your Sona's Sexuality")
				.setMaxValues(1)
				.setMinValues(1)
		);
		const sexualityMsg = await this.interaction.channel?.send({
			content: "What's your sona Sexuality? (Pick from the menu)",
			components: [sexualitySelections],
		});

		const sexMsg = await sexualityMsg!.awaitMessageComponent({
			componentType: "SELECT_MENU",
			filter: this.filter,
			time: 60000 * 10,
		});
		if (sexMsg && sexMsg.isSelectMenu()) {
			this.sonaSexuality = sexMsg.values[0];
			this.embed.addField("Sexuality", this.sonaSexuality[0].toUpperCase() + this.sonaSexuality.slice(1));
			sexualityMsg?.delete().catch(() => {});
			this.interaction.editReply({ embeds: [this.embed] });
		}
		return;
	}

	public toJSON() {
		return {
			name: this.sonaName,
			species: this.species,
			age: this.age,
			height: this.height,
			sexuality: this.sonaSexuality,
			sonaUID: this.sonaUID,
		};
	}
}
