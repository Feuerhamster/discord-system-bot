import { Message, MessageActionRow, MessageEmbed, MessageSelectMenu, SelectMenuInteraction } from "discord.js";
import PluginBase, { PluginConstructorModules } from "../core/pluginBase.js";
import $t from "../core/texts.js";
import { SelfRoleAssignmentPanel } from "../types/config.js";

export default class RoleSelfAssignment extends PluginBase {
	constructor(...modules: PluginConstructorModules) {
		super(...modules);

		this.registerCommand("create-role-panel", 1, (...args) => this.createRolePannel(...args));
		this.registerSelectionEvent(["self-role-assignment"], (i) => this.selectRoles(i));
	}

	async createRolePannel(args: string[], msg: Message) {
		const rp: SelfRoleAssignmentPanel = this.config.selfRoleAssignmentPanels[args[0]];

		const embed = new MessageEmbed()
			.setTitle(rp.title)
			.setColor(this.config.embedColor)
			.setDescription(rp.description);

		const selectMenu = new MessageSelectMenu()
			.setCustomId("self-role-assignment")
			.setPlaceholder($t("selfRoleAssignment.selectInputPlaceholder"))
			.addOptions(rp.options)
			.setMaxValues(1);
		
		if (rp.multiple) {
			selectMenu.setMaxValues(rp.options.length);
			selectMenu.setMinValues(0);
			selectMenu.setPlaceholder($t("selfRoleAssignment.selectInputPlaceholderMultiple"));
		}

		let row = new MessageActionRow()
			.addComponents(selectMenu);

		msg.delete();
		msg.channel.send({ embeds: [embed], components: [row] });
	}

	async selectRoles(interaction: SelectMenuInteraction) {
		const member = interaction.guild?.members.cache.get(interaction.member?.user.id as string);

		for (const option of interaction.component.options) {
			if (interaction.values.includes(option.value)) {
				// User selected this option
				if (!member?.roles.cache.has(option.value)) {
					// User does not have selected role => user want to add role
					member?.roles.add(option.value);
				}
			} else {
				// User not selected this option
				if (member?.roles.cache.has(option.value)) {
					// User has selected role => user want to remove role
					member?.roles.remove(option.value);
				}
			}
		}

		interaction.reply({
			content: $t("selfRoleAssignment.updated"),
			ephemeral: true
		});
	}
}