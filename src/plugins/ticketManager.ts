import { ButtonInteraction, MessageActionRow, MessageButton, MessageEmbed, Modal, ModalSubmitInteraction, TextInputComponent } from "discord.js";
import { TicketPanel } from "../types/config";
import { customAlphabet } from "nanoid";
import PluginBase, { PluginConstructorModules } from "../core/pluginBase.js";
import $t from "../core/texts.js";

const nanoid = customAlphabet('0123456789abcdef', 6);

export default class TicketButtonInteractions extends PluginBase {
	constructor(...modules: PluginConstructorModules) {
		super(...modules);

		this.registerButtonEvent(Object.keys(this.config.ticketTypes), (i) => this.createTicket(i));
		this.registerButtonEvent(["action-claim"], (i) => this.claimTicket(i));
		this.registerButtonEvent(["action-close"], (i) => this.requestCloseTicket(i));
		this.registerButtonEvent(["action-delete"], (i) => this.deleteTicket(i));

		this.registerFormSubmit(["ticket-closed"], (i) => this.submitCloseTicket(i))
	}

	async createTicket(interaction: ButtonInteraction) {
		const newChannelName = interaction.customId + "-" + nanoid();

		await this.storage.setItem(`ticket-${newChannelName}-creatorId`, interaction.user.id);

		let channel = await interaction.guild?.channels.create(newChannelName, {
			parent: this.config.ticketCategory,
			nsfw: true
		});

		await channel?.lockPermissions();

		await channel?.permissionOverwrites.edit(interaction.user.id, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true
		});

		interaction.reply({
			content: $t("ticket.created"),
			ephemeral: true,
			components: [
				new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setStyle("LINK")
							.setURL(`https://discord.com/channels/${interaction.guildId}/${channel?.id}`)
							.setLabel("Gehe zum Ticket")
					)
			]
		});

		let title = "";
		let description = null;

		if (this.config.ticketTypes[interaction.customId]) {
			let t = this.config.ticketTypes[interaction.customId];
			title = t.title;
			description = t.description;
		} else {
			let t: TicketPanel = this.config.ticketPanels[interaction.customId];
			title = t.title;
			description = t.description;
		}

		const embed = new MessageEmbed()
			.setTitle(title)
			.setColor(this.config.embedColor)
			.setDescription(description)
			.setTimestamp(new Date());

		let row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId("action-close")
					.setLabel("Ticket Schließen")
					.setStyle("SECONDARY")
					.setEmoji("🔒"),
				new MessageButton()
					.setCustomId("action-claim")
					.setLabel("Ticket beanspruchen")
					.setStyle("SECONDARY")
					.setEmoji("🏷️")
			);

		let msg = `<@${interaction.user.id}> ${this.config.moderationRoleIds.map(i => `<@&${i}>`).join(" ")}`;

		channel?.send({ content: msg, embeds: [embed], components: [row] });
	}

	async claimTicket(interaction: ButtonInteraction) {
		const user = interaction.guild?.members.cache.get(interaction.user.id);

		if(!user?.roles.cache.hasAny(...this.config.moderationRoleIds)) {
			await interaction.reply({
				content: $t("error.onlyTeam"),
				ephemeral: true
			});
			return;
		}

		const channel = interaction.guild?.channels.cache.get(interaction.channel?.id as string);
		const channelName = channel?.name as string;

		await this.storage.setItem(`ticket-${channelName}-modId`, interaction.user.id);

		interaction.channel?.send($t("ticket.claimed", { user: interaction.user.toString() }));
		interaction.deferUpdate();
	}

	async deleteTicket(interaction: ButtonInteraction) {
		const user = interaction.guild?.members.cache.get(interaction.user.id);
		
		if(!user?.roles.cache.hasAny(...this.config.moderationRoleIds)) {
			await interaction.reply({
				content: $t("error.onlyTeam"),
				ephemeral: true
			});
			return;
		}

		const channel = interaction.guild?.channels.cache.get(interaction.channel?.id as string);
		const channelName = channel?.name as string;
		
		await interaction.channel?.delete();

		await this.storage.removeItem(`ticket-${channelName}-creatorId`);
		await this.storage.removeItem(`ticket-${channelName}-modId`);
	}

	async requestCloseTicket(interaction: ButtonInteraction) {
		const modal = new Modal()
			.setCustomId("ticket-closed")
			.setTitle("Ticket schließen")

		const reasonTextInput = new TextInputComponent()
			.setCustomId("reason")
			.setLabel("Schließungsgrund")
			.setStyle("PARAGRAPH")
			.setRequired(true);
		
		// any cast: bad types
		const modalActionRow = new MessageActionRow().addComponents(reasonTextInput as any);
		
		// any cast: bad types
		modal.addComponents(modalActionRow as any)

		await interaction.showModal(modal);
	}

	async submitCloseTicket(interaction: ModalSubmitInteraction) {
		const channel = await interaction.guild?.channels.fetch(interaction.channelId as string);
		const channelName = channel?.name as string;

		let creatorId = await this.storage.getItem(`ticket-${channelName}-creatorId`);

		const reason = interaction.fields.getTextInputValue("reason");

		// Send message to creator
		try {
			const creator = interaction.guild?.members.cache.get(creatorId);
			const date = channel?.createdAt?.toLocaleDateString("de-DE");
			const topic = channelName.split("-")[0];

			const msg = `${ $t("ticket.closedCreatorMSG", { date, topic, guild: interaction.guild?.name }) }\n\n**Schließungsgrund:** ${reason}`;

			creator?.send(msg);
		} catch(e) {
			console.log($t("error.blockedDM"));
		}

		const msg = `${ $t("ticket.closed", { user: interaction.user.toString() }) }.\n**Schließungsgrund:** ${reason}`;

		let row = new MessageActionRow()
		.addComponents(
			new MessageButton()
				.setCustomId("action-delete")
				.setLabel("Ticket Löschen")
				.setStyle("SECONDARY")
				.setEmoji("❌")
		);

		await interaction.channel?.send({ content: msg });

		await channel?.permissionOverwrites.edit(creatorId, {
			SEND_MESSAGES: false,
			VIEW_CHANNEL: false
		});
		
		await interaction.channel?.send({ components: [row] });

		interaction.deferUpdate();
	}
}