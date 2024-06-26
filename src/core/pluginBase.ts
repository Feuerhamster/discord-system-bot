import {
	ButtonInteraction,
	Client,
	Interaction,
	Message,
	MessageReaction,
	ModalSubmitInteraction,
	PartialUser,
	SelectMenuInteraction,
	User,
} from "discord.js";
import NodePersist from "node-persist";
import { ConfigFile } from "../types/config";
import $t from "./texts.js";

export type PluginConstructorModules = [Client, ConfigFile, NodePersist.LocalStorage];

export default class PluginBase {
	constructor(
		protected client: Client,
		protected config: ConfigFile,
		protected storage: NodePersist.LocalStorage,
	) {}

	/**
	 * Register a new command
	 * @param name command name
	 * @param requiredArgs number of arguments
	 * @param callback callback function when command is triggered
	 */
	protected registerCommand(
		name: string,
		requiredArgs: number,
		callback: (args: string[], msg: Message) => void,
	) {
		this.client.on("messageCreate", async (msg: Message) => {
			if (msg.mentions.users.first()?.id !== this.client.user?.id) return;

			let args = msg.content.split(" ");
			// drop mention
			args.shift();

			const cmd = args.shift();

			if (cmd !== name) return;

			if (args.length < requiredArgs) {
				await msg.reply($t("error.requiredArgs", { name, requiredArgs }));
				return;
			}

			callback(args, msg);
		});
	}

	/**
	 * Register a button click event
	 * @param triggerIds ID's to listen on
	 * @param callback callback function when button is triggered
	 */
	protected registerButtonEvent(
		triggerIds: string[],
		callback: (interaction: ButtonInteraction) => void,
	) {
		this.client.on("interactionCreate", async (interaction: Interaction) => {
			if (!interaction.isButton()) return;
			if (!triggerIds.includes(interaction.customId)) return;

			callback(interaction);
		});
	}

	/**
	 * Register a select menu selection
	 * @param triggerIds ID's to listen on
	 * @param callback callback function when selected
	 */
	protected registerSelectionEvent(
		triggerIds: string[],
		callback: (interaction: SelectMenuInteraction) => void,
	) {
		this.client.on("interactionCreate", async (interaction: Interaction) => {
			if (!interaction.isSelectMenu()) return;
			if (!triggerIds.includes(interaction.customId)) return;

			callback(interaction);
		});
	}

	/**
	 * Register a form submit event
	 * @param triggerIds ID's to listen on
	 * @param callback callback function when form is triggered
	 */
	protected registerFormSubmit(
		triggerIds: string[],
		callback: (interaction: ModalSubmitInteraction) => void,
	) {
		this.client.on("interactionCreate", async (interaction: Interaction) => {
			if (!interaction.isModalSubmit()) return;
			if (!triggerIds.includes(interaction.customId)) return;

			callback(interaction);
		});
	}

	/**
	 * Register a message reaction event
	 * @param callback callback function when reaction is triggered
	 */
	protected registerReactionEvent(
		callback: (interaction: MessageReaction, user: User | PartialUser) => void,
	) {
		this.client.on("messageReactionAdd", async (reaction, user) => {
			if (reaction.partial) {
				// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
				try {
					await reaction.fetch();
				} catch (error) {
					console.error("Something went wrong when fetching the message:", error);
					// Return as `reaction.message.author` may be undefined/null
					return;
				}
			}

			callback(reaction as MessageReaction, user);
		});
	}
}
