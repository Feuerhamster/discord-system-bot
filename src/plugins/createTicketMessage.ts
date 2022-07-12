import { Client, Interaction, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import NodePersist from "node-persist";
import { ConfigFile, TicketMessage } from "../types/config";



export default function(client: Client, config: ConfigFile, storage: NodePersist.LocalStorage) {
	client.on("messageCreate", async (msg: Message) => {
		if (!msg.content.startsWith(config.commandPrefix + "create-ticket-message")) return;

		const args: string[] = msg.content.split(" ");

		if (!(args[1] in config.ticketMessages)) {
			msg.reply(`❌ "${args[1]}" nicht in Konfiguration gefunden`);
		}

		const tm: TicketMessage = config.ticketMessages[args[1]];

		const embed = new MessageEmbed()
			.setTitle(tm.title)
			.setColor(config.embedColor)
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
	});
}
