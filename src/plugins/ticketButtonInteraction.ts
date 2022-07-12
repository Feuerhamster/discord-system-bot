import { Client, Interaction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { ConfigFile, TicketMessage } from "../types/config";
import { customAlphabet } from "nanoid";
import type NodePersist from "node-persist";

const nanoid = customAlphabet('0123456789abcdef', 6);

export default function(client: Client, config: ConfigFile, storage: NodePersist.LocalStorage) {
	
	// Create ticket
	client.on("interactionCreate", async (interaction: Interaction) => {
		if (!interaction.isButton()) return;
		if (!(interaction.customId in config.ticketTypes)) return;

		const name = interaction.customId + "-" + nanoid();

		await storage.setItem("user-" + name, interaction.user.id);

		let channel = await interaction.guild?.channels.create(name, {
			parent: config.ticketCategory
		});

		await channel?.lockPermissions();

		await channel?.permissionOverwrites.edit(interaction.user.id, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true
		});

		interaction.reply({
			content: "✅ Ein Ticket wurde für dich erstellt",
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

		if (config.ticketTypes[interaction.customId]) {
			let t = config.ticketTypes[interaction.customId];
			title = t.title;
			description = t.description;
		} else {
			let t: TicketMessage = config.ticketMessages[interaction.customId];
			title = t.title;
			description = t.description;
		}

		const embed = new MessageEmbed()
			.setTitle(title)
			.setColor(config.embedColor)
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
					.setEmoji("👤")
			);

		let msg = `<@${interaction.user.id}> ${config.moderationRoleIds.map(i => `<@&${i}>`).join(" ")}`;

		channel?.send({ content: msg, embeds: [embed], components: [row] });
	});

	// Claim ticket
	client.on("interactionCreate", async (interaction: Interaction) => {
		if (!interaction.isButton()) return;
		if (interaction.customId !== "action-claim") return;

		let user = await interaction.guild?.members.fetch(interaction.user.id);

		if(!user?.roles.cache.hasAny(...config.moderationRoleIds)) {
			await interaction.reply({
				content: "⚠ Nur Teammitglieder können sich für das Bearbeiten von Tickets melden",
				ephemeral: true
			});
			return;
		}

		const c = interaction.guild?.channels.cache.get(<string>interaction.channel?.id);

		await storage.setItem("mod-" + <string>c?.name, interaction.user.id);

		interaction.channel?.send(`👤 ${interaction.user.toString()} hat sich für die Bearbeitung dieses Tickets gemeldet`);
		interaction.deferUpdate();
	});

	// Close ticket
	client.on("interactionCreate", async (interaction: Interaction) => {
		if (!interaction.isButton()) return;
		if (interaction.customId !== "action-close") return;

		const c = interaction.guild?.channels.cache.get(<string>interaction.channel?.id);

		let d = c?.createdAt?.toLocaleDateString("de-DE")
		let type = <string>c?.name.split("-")[0];
		let topic = null;
		if (type in config.ticketTypes && config.ticketTypes[type] !== null) {
			topic = config.ticketTypes[type].title;
		} else {
			topic = config.ticketMessages[type].title;
		}

		let creatorId = await storage.getItem("user-" + <string>c?.name);
		let creator = await interaction.guild?.members.fetch(creatorId);

		let modId = await storage.getItem("mod-" + <string>c?.name);

		if (modId) {
			let mod = await interaction.guild?.members.fetch(modId);

			try {
				await mod?.send(`✅ Dein bearbeitetes Ticket vom **${d}** mit dem Thema **${topic}** von dem User **${mod?.user.toString()}** auf dem Server **${interaction.guild?.name}** wurde geschlossen`);
			} catch(e) {
				console.log("⚠ Can't sent message to user: user blocked dms");
			}
		}
		
		try {
			await creator?.send(`✅ Dein Ticket vom **${d}** mit dem Thema **${topic}** auf dem Server **${interaction.guild?.name}** wurde geschlossen`);
		} catch(e) {
			console.log("⚠ Can't sent message to user: user blocked dms");
		}
		
		await interaction.channel?.delete();

		await storage.removeItem("user-" + <string>c?.name);
		await storage.removeItem("mod-" + <string>c?.name);
	});
}
