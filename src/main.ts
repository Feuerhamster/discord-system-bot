import { Client, Intents } from "discord.js";
import fs from "fs";
import type { ConfigFile } from "./types/config";
import storage from "node-persist";
import createTicketPanelPlugin from "./plugins/createTicketPanel.js";
import ticketManagerPlugin from "./plugins/ticketManager.js";

const config: ConfigFile = JSON.parse(fs.readFileSync("./config.json").toString("utf-8"));

storage.init({ dir: config.storageDir }).then(() => console.log("💾 Storage ready"))

const client = new Client({
	intents: [
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILDS
	]
});

client.setMaxListeners(0);

client.once("ready", () => console.log("✅ Client Ready"));

// Init plugins
new createTicketPanelPlugin(client, config, storage);
new ticketManagerPlugin(client, config, storage);

client.login(config.token);