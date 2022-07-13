import { ButtonInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { TicketPanel } from "../types/config";
import { customAlphabet } from "nanoid";
import PluginBase, { PluginConstructorModules } from "../core/pluginBase.js";
import $t from "../core/texts.js";

const nanoid = customAlphabet('0123456789abcdef', 6);

export default class TicketButtonInteractions extends PluginBase {
	constructor(...modules: PluginConstructorModules) {
		super(...modules);

		this.registerButtonEvent(Object.keys(this.config.ticketTypes), (i) => this.createTicket(i))
		this.registerButtonEvent(["action-claim"], (i) => this.claimTicket(i))
		this.registerButtonEvent(["action-close"], (i) => this.closeTicket(i))
	}

	async createTicket(interaction: ButtonInteraction) {
		const newChannelName = interaction.customId + "-" + nanoid();

		await this.storage.setItem(`ticket-${newChannelName}-creatorId`, interaction.user.id);

		let channel = await interaction.guild?.channels.create(newChannelName, {
			parent: this.config.ticketCategory
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
					.setStyle("DANGER")
					.setEmoji("🔒"),
				new MessageButton()
					.setCustomId("action-claim")
					.setLabel("Ticket beanspruchen")
					.setStyle("SECONDARY")
					.setEmoji("✋")
			);

		let msg = `<@${interaction.user.id}> ${this.config.moderationRoleIds.map(i => `<@&${i}>`).join(" ")}`;

		channel?.send({ content: msg, embeds: [embed], components: [row] });
	}

	async claimTicket(interaction: ButtonInteraction) {
		let user = await interaction.guild?.members.fetch(interaction.user.id);

		if(!user?.roles.cache.hasAny(...this.config.moderationRoleIds)) {
			await interaction.reply({
				content: $t("ticket.onlyTeam"),
				ephemeral: true
			});
			return;
		}

		const channel = interaction.guild?.channels.cache.get(<string>interaction.channel?.id);
		const channelName = <string>channel?.name;

		await this.storage.setItem(`ticket-${channelName}-modId`, interaction.user.id);

		interaction.channel?.send($t("ticket.claimed", { user: interaction.user.toString() }));
		interaction.deferUpdate();
	}

	async closeTicket(interaction: ButtonInteraction) {
		const channel = interaction.guild?.channels.cache.get(<string>interaction.channel?.id);
		const channelName = <string>channel?.name;

		const ticketCreatedAt = channel?.createdAt?.toLocaleDateString("de-DE")
		const ticketType = channelName.split("-")[0];

		let ticketTitle = null;

		if (ticketType in this.config.ticketTypes && this.config.ticketTypes[ticketType] !== null) {
			ticketTitle = this.config.ticketTypes[ticketType].title;
		} else {
			ticketTitle = this.config.ticketPanels[ticketType].title;
		}

		let creatorId = await this.storage.getItem(`ticket-${channelName}-creatorId`);
		let creator = await interaction.guild?.members.fetch(creatorId);

		let modId = await this.storage.getItem(`ticket-${channelName}-modId`);

		// Send close message to moderator who claimed the ticket
		if (modId) {
			let mod = await interaction.guild?.members.fetch(modId);

			try {
				await mod?.send($t("ticket.closedModMSG", { date: ticketCreatedAt, topic: ticketTitle, creator: creator?.user.toString(), guild: interaction.guild?.name }));
			} catch(e) {
				console.log($t("error.blockedDM"));
			}
		}
		
		// Send close message to creator
		try {
			await creator?.send($t("ticket.closedCreatorMSG", { date: ticketCreatedAt, topic: ticketTitle, guild: interaction.guild?.name }));
		} catch(e) {
			console.log($t("error.blockedDM"));
		}
		
		await interaction.channel?.delete();

		await this.storage.removeItem(`ticket-${channelName}-creatorId`);
		await this.storage.removeItem(`ticket-${channelName}-modId`);
	}
}