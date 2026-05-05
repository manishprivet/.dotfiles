import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	CONFIRM_EVERY_BASH_CONFIG_PATH,
	CONFIRM_EVERY_BASH_SESSION_STATE_TYPE,
	normalizeCommand,
	normalizeStringList,
	loadConfirmEveryBashConfig,
	restoreConfirmEveryBashSessionAllowedCommands,
	shouldAllowWithoutPrompt,
	updateConfirmEveryBashConfig,
} from "./lib/confirm-every-bash-shared";
import { NotificationSound } from "./lib/terminal-notify-shared";
import { sendPiNotificationWhenUnfocused } from "./lib/pi-notification-shared";
import { getBashCommand } from "./lib/tool-call-shared";

type SessionState = {
	allowedCommands: string[];
};

type PermissionDecision = "allow-once" | "allow-session" | "allow-always" | "deny";

function persistSessionAllowedCommands(pi: ExtensionAPI, sessionAllowedCommands: Set<string>) {
	pi.appendEntry<SessionState>(CONFIRM_EVERY_BASH_SESSION_STATE_TYPE, {
		allowedCommands: Array.from(sessionAllowedCommands).sort(),
	});
}

async function promptForPermission(ctx: ExtensionContext, source: string, command: string): Promise<PermissionDecision> {
	if (!ctx.hasUI) {
		return "deny";
	}

	const choice = await ctx.ui.select(`${source}\n\n${command}`, [
		"Allow once",
		"Allow this session",
		"Always allow this exact command",
		"Deny",
	]);

	switch (choice) {
		case "Allow once":
			return "allow-once";
		case "Allow this session":
			return "allow-session";
		case "Always allow this exact command":
			return "allow-always";
		default:
			return "deny";
	}
}

function getBlockReason(ctx: ExtensionContext): string {
	return ctx.hasUI ? "Blocked by user" : "Blocked: no UI available for bash confirmation";
}

export default function (pi: ExtensionAPI) {
	let sessionAllowedCommands = new Set<string>();

	pi.on("session_start", async (_event, ctx) => {
		sessionAllowedCommands = restoreConfirmEveryBashSessionAllowedCommands(ctx);
	});

	pi.on("session_tree", async (_event, ctx) => {
		sessionAllowedCommands = restoreConfirmEveryBashSessionAllowedCommands(ctx);
	});

	pi.on("tool_call", async (event, ctx) => {
		const bashCommand = getBashCommand(event);
		if (!bashCommand) return;

		const command = normalizeCommand(bashCommand);
		const config = await loadConfirmEveryBashConfig();
		if (shouldAllowWithoutPrompt(command, config, sessionAllowedCommands)) {
			return;
		}

		await sendPiNotificationWhenUnfocused(pi, ctx, {
			message: "Waiting for bash approval",
			sound: NotificationSound.Submarine,
		});
		const decision = await promptForPermission(ctx, "Pi wants to run this bash command:", command);
		if (decision === "allow-once") {
			return;
		}

		if (decision === "allow-session") {
			sessionAllowedCommands.add(command);
			persistSessionAllowedCommands(pi, sessionAllowedCommands);
			ctx.ui.notify(`Allowed for this session: ${command}`, "info");
			return;
		}

		if (decision === "allow-always") {
			await updateConfirmEveryBashConfig((current) => ({
				...current,
				allowCommands: Array.from(new Set([...normalizeStringList(current.allowCommands), command])).sort(),
			}));
			ctx.ui.notify(`Always allowed and saved to ${CONFIRM_EVERY_BASH_CONFIG_PATH}`, "success");
			return;
		}

		return {
			block: true,
			reason: getBlockReason(ctx),
		};
	});

}
