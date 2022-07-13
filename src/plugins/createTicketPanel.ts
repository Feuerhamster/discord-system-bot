import { Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import PluginBase, { PluginConstructorModules } from "../core/pluginBase.js";
import { TicketPanel } from "../types/config";

export default class CreateTicketPanel extends PluginBase {
	constructor(...modules: PluginConstructorModules) {
		super(...modules);

		this.registerCommand("create-ticket-panel", 1, (...args) => this.createTicketPanel(...args))
	}

	async createTicketPanel(args: string[], msg: Message) {
		const tm: TicketPanel = this.config.ticketPanels[args[0]];

		const embed = new MessageEmbed()
			.setTitle(tm.title)
			.setColor(this.config.embedColor)
			.setDescription(tm.description);

		let buttons: MessageButton[] = [];

		for (let button of tm.buttons) {
			let btn = new MessageButton()
					.setCustomId(button.id)
					.setLabel(button.label)
					.setStyle("SECONDARY")
					.setEmoji(button.icon)

			buttons.push(btn);
		}

		let row = new MessageActionRow()
			.addComponents(buttons);

		msg.delete();
		msg.channel.send({ embeds: [embed], components: [row] });
	}
}