import { MessageReaction, PartialUser, User } from "discord.js";
import PluginBase, { PluginConstructorModules } from "../core/pluginBase.js";
import $t from "../core/texts.js";

export default class FlaggingSystem extends PluginBase {
	constructor(...modules: PluginConstructorModules) {
		super(...modules);

		this.registerReactionEvent((...args) => this.onMessageReaction(...args));
	}

	async onMessageReaction(interaction: MessageReaction, user: User | PartialUser) {
		if (interaction.emoji.name !== this.config.flaggingSystem.emoji) return;

		if (this.config.flaggingSystem.ignoreChannels.includes(interaction.message.channel.id)) return;

		const count = interaction.message.reactions.cache.get(this.config.flaggingSystem.emoji)?.count;

		if (!count) return;

		let modChannel = this.client.channels.cache.get(this.config.flaggingSystem.reportChannel);

		if (!modChannel) {
			const c = await this.client.channels.fetch(this.config.flaggingSystem.reportChannel);

			if (!c) {
				console.error("❌ Mod message channel not found or wrong type");
				return;
			}

			modChannel = c;
		}

		if (!modChannel.isText()) {
			console.error("❌ Mod message channel not found or wrong type");
			return;
		}

		if (count === 1) {
			const messageURL = interaction.message.url;

			modChannel.send(
				$t("flaggingSystem.modNotice", {
					link: messageURL,
				}),
			);

			return;
		}

		if (count >= 2) {
			await interaction.message.delete();

			interaction.message.channel.send(
				$t("flaggingSystem.userNotice", {
					mention: `<@${interaction.message.author?.id}>`,
				}),
			);

			modChannel.send(
				$t("flaggingSystem.modSolved", {
					offender: `<@${interaction.message.author?.id}>`,
				}),
			);
		}
	}
}
