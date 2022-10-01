import type { ColorResolvable, MessageSelectOptionData } from "discord.js";

export interface ConfigFile {
	token: string;
	ticketPanels: {
		[key: string]: TicketPanel
	};
	embedColor: ColorResolvable;
	moderationRoleIds: string[];
	ticketCategory: string;
	ticketTypes: {
		[key: string]: TicketType
	},
	storageDir: string;
	selfRoleAssignmentPanels: {
		[key: string]: SelfRoleAssignmentPanel
	},
}

export interface TicketPanel {
	title: string;
	description: string;
	buttons: Button[];
}

export interface TicketType {
	title: string;
	description: string;
}

export interface Button {
	id: string;
	label: string;
	icon: string;
}

export interface SelfRoleAssignmentPanel {
	title: string;
	description: string;
	multiple?: boolean;
	options: MessageSelectOptionData[];
}