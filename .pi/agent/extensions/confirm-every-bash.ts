import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	CONFIRM_EVERY_BASH_SESSION_STATE_TYPE,
	normalizeCommand,
	restoreConfirmEveryBashSessionAllowedCommands,
} from "./lib/confirm-every-bash-shared";
import { confirmBashPermission, shouldAllowBashWithoutPrompt } from "./lib/bash-permission-policy";
import { NotificationSound } from "./lib/terminal-notify-shared";
import { sendPiNotificationWhenUnfocused } from "./lib/pi-notification-shared";
import { getBashCommand } from "./lib/tool-call-shared";

type SessionState = {
	allowedCommands: string[];
};

function persistSessionAllowedCommands(pi: ExtensionAPI, sessionAllowedCommands: Set<string>) {
	pi.appendEntry<SessionState>(CONFIRM_EVERY_BASH_SESSION_STATE_TYPE, {
		allowedCommands: Array.from(sessionAllowedCommands).sort(),
	});
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
		if (await shouldAllowBashWithoutPrompt(command, sessionAllowedCommands)) return;

		await sendPiNotificationWhenUnfocused(pi, ctx, {
			message: "Waiting for bash approval",
			sound: NotificationSound.Submarine,
		});
		const beforeSize = sessionAllowedCommands.size;
		const approved = await confirmBashPermission(ctx, command, sessionAllowedCommands);
		if (approved) {
			if (sessionAllowedCommands.size !== beforeSize) persistSessionAllowedCommands(pi, sessionAllowedCommands);
			return;
		}

		return {
			block: true,
			reason: getBlockReason(ctx),
		};
	});

}
