import type { KeysUnion, KeyValues } from "../types/common";

const texts = {
	ticket: {
		created: "🏷 Ein Ticket wurde für dich erstellt",
		claimed: "🏷️ {user} hat sich für die Bearbeitung dieses Tickets gemeldet",
		closed: "🔒 Das Ticket wurde von {user} geschlossen",
		closedCreatorMSG: "🔒 Dein Ticket vom **{date}** mit dem Thema **{topic}** auf dem Server **{guild}** wurde geschlossen"
	},
	selfRoleAssignment: {
		selectInputPlaceholder: "Wähle deine Rolle(n) aus...",
		updated: "✅ Deine Rollen wurden entsprechend deiner Auswahl aktualisiert"
	},
	error: {
		blockedDM: "⚠ Can't sent message to user: user blocked dms",
		requiredArgs: "⚠ Der Command **{name}** benötigt mindestens **{requiredArgs} argumente**",
		onlyTeam: "⚠ Nur Teammitglieder können diese Aktion ausführen"
	}
} as const;

type Texts = typeof texts;

let getValueByPath = (obj: any, path: string) => path.split(".").reduce((a: any, b: any) => a[b], obj)

export default function $t(key: KeysUnion<Texts>, obj?: KeyValues) {
	if (!key) throw new Error("no key provided to $t()");

	let text: string = getValueByPath(texts, key);

	if (!text) throw new Error(`no text found for ${key}`);

	if (!obj) {
		return text;
	}

	const vars = text.match(/\{[\w\d]+\}/gi);

	if (!vars) return text;

	for(let v of vars) {
		const key = v.substring(1, v.length-1);

		text = text.replace(v, obj[key]);
	}

	return text;
}