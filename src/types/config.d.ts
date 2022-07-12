import type { ColorResolvable } from "discord.js";

export interface ConfigFile {
	token: string;
	ticketMessages: {
		[key: string]: TicketMessage
	};
	commandPrefix: string;
	embedColor: ColorResolvable;
	moderationRoleIds: string[];
	ticketCategory: string;
	ticketTypes: {
		[key: string]: TicketType
	},
	storageDir: string;
}

export interface TicketMessage {
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