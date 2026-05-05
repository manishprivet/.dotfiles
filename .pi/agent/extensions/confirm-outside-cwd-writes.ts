import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { NotificationSound } from "./lib/terminal-notify-shared";
import { sendPiNotificationWhenUnfocused } from "./lib/pi-notification-shared";
import { getWriteToolInput } from "./lib/tool-call-shared";
import { confirmOutsideCwdWrite, getOutsideCwdWriteAttempt } from "./lib/outside-cwd-write-policy";

function getBlockReason(ctx: ExtensionContext): string {
	return ctx.hasUI
		? "Blocked by user"
		: "Blocked: no UI available for confirming a write outside the current directory";
}

export default function confirmOutsideCwdWrites(pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		const writeInput = getWriteToolInput(event);
		if (!writeInput) return;

		const attempt = await getOutsideCwdWriteAttempt(ctx.cwd || process.cwd(), writeInput.toolName, writeInput.path);
		if (!attempt) return;

		await sendPiNotificationWhenUnfocused(pi, ctx, {
			message: "Waiting for approval to write outside cwd",
			sound: NotificationSound.Submarine,
		});
		const approved = await confirmOutsideCwdWrite(ctx, attempt);
		if (approved) return;

		return {
			block: true,
			reason: getBlockReason(ctx),
		};
	});
}
