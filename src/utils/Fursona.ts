import {
	CommandInteraction,
	MessageActionRow,
	MessageComponentInteraction,
	MessageEmbed,
	MessageSelectMenu,
	MessageSelectOptionData,
} from "discord.js";
import FuzzyClient from "../lib/FuzzyClient";

export default class Fursona {
	public _id: number;
	public sonaName: string;
	public species: string;
	public age: number;
	public height: string;
	public likes: string[];
	public dislikes: string[];
	public sonaSexuality: string;
	public client: FuzzyClient;
	public interaction: CommandInteraction;
	private filter: (m: MessageComponentInteraction) => boolean = (m) => {
		m.deferUpdate();
		return m.user.id === this.interaction.user.id;
	};
	private avaliableSexualities: MessageSelectOptionData[] = [
		{
			label: "Striaght",
			value: "striaght",
			emoji: "❤️",
		},
		{
			label: "Gay/Lesbian",
			value: "homo",
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
		this.initalize()
		this.questionSexuality()
	}

	public async initalize() {
		const embed = new MessageEmbed()
			.setAuthor(this.interaction.user.tag, this.interaction.user.displayAvatarURL({ dynamic: true }))
			.setTitle("Lets create your sona!")
			.setDescription("We'll be asking you a couple of questions related to your sona and update as you respond")
			.setColor(this.client.config.color)
			.setFooter(`User ID: ${this.interaction.user.id}`);
		this.interaction.reply({ embeds: [embed] });
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
		if (sexMsg && sexMsg.isSelectMenu()) this.sonaSexuality = sexMsg.values[0];
	}

    public async toJSON(){
        return {
            name: this.sonaName,
            species: this.species,
            age: this.age,
            height: this.height,
            likes: this.likes,
            dislikes: this.dislikes,
            sexuality: this.sonaSexuality
        }
    }
}
