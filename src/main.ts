import { Client, Intents } from "discord.js";
import fs from "fs";
import type { ConfigFile } from "./types/config";
import storage from "node-persist";
import createTicketMessagePlugin from "./plugins/createTicketMessage.js";
import ticketButtonInteractionPlugin from "./plugins/ticketButtonInteraction.js";

const config: ConfigFile = JSON.parse(fs.readFileSync("./config.json").toString("utf-8"));

storage.init({
	dir: config.storageDir
}).then(() => console.log("💾 Storage ready"))

let intents = new Intents();
intents.add(
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILDS
);

const client = new Client({
	intents
});

client.once("ready", () => console.log("✅ Client Ready"));

createTicketMessagePlugin(client, config, storage);
ticketButtonInteractionPlugin(client, config, storage);

client.login(config.token);
