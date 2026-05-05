import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	detectTerminalInfo,
	isFocusedTerminalActivePane,
	sendNotification,
	type NotificationPayload,
	type TerminalInfo,
} from "./terminal-notify-shared";

export function getContextLabel(pi: ExtensionAPI, ctx: ExtensionContext): string {
	return pi.getSessionName() || path.basename(ctx.cwd || process.cwd());
}

export async function sendPiNotificationWhenUnfocused(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	payload: Omit<NotificationPayload, "title" | "subtitle"> & Partial<Pick<NotificationPayload, "title" | "subtitle">>,
	terminalInfo?: TerminalInfo,
): Promise<boolean> {
	const resolvedTerminalInfo = terminalInfo ?? (await detectTerminalInfo());
	if (await isFocusedTerminalActivePane(resolvedTerminalInfo)) return false;

	return sendNotification(
		{
			title: payload.title ?? "Pi",
			subtitle: payload.subtitle ?? getContextLabel(pi, ctx),
			message: payload.message,
			sound: payload.sound,
		},
		resolvedTerminalInfo,
	);
}
