import { ButtonInteraction, Client, Interaction, Message } from "discord.js";
import NodePersist from "node-persist";
import { ConfigFile } from "../types/config";
import $t from "./texts.js";

export type PluginConstructorModules = [Client, ConfigFile, NodePersist.LocalStorage]

export default class PluginBase {
	constructor(
		protected client: Client,
		protected config: ConfigFile,
		protected storage: NodePersist.LocalStorage
	) {}

	protected registerCommand(name: string, requiredArgs: number, callback: (args: string[], msg: Message) => void) {
		this.client.on("messageCreate", async (msg: Message) => {
			const cmd = this.config.commandPrefix + name;

			if (!msg.content.startsWith(cmd)) return;
	
			let args = msg.content.split(" ");
			args.shift();

			if (args.length < requiredArgs) {
				await msg.reply($t("error.requiredArgs", { name, requiredArgs }));
				return;
			}
	
			callback(args, msg);
		});
	}

	protected registerButtonEvent(triggerIds: string[], callback: (interaction: ButtonInteraction) => void) {
		this.client.on("interactionCreate", async (interaction: Interaction) => {
			if (!interaction.isButton()) return;
			if (!triggerIds.includes(interaction.customId)) return;

			callback(interaction);
		});
	}
}