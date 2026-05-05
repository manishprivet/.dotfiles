import os from "node:os";
import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { NotificationSound } from "./lib/terminal-notify-shared";
import { sendPiNotificationWhenUnfocused } from "./lib/pi-notification-shared";
import { canonicalizeAllowMissing, isPathInside, stripToolPathPrefix } from "./lib/path-shared";
import { getWriteToolInput } from "./lib/tool-call-shared";

type WriteAttempt = {
	toolName: "write" | "edit";
	requestedPath: string;
	resolvedPath: string;
	cwdPath: string;
};

async function getWriteAttempt(
	ctx: ExtensionContext,
	toolName: "write" | "edit",
	rawPath: string,
): Promise<WriteAttempt | null> {
	const cwd = ctx.cwd || process.cwd();
	const requestedPath = stripToolPathPrefix(rawPath);
	const [cwdPath, resolvedPath, tempPath] = await Promise.all([
		canonicalizeAllowMissing(cwd),
		canonicalizeAllowMissing(path.resolve(cwd, requestedPath)),
		canonicalizeAllowMissing(os.tmpdir()),
	]);

	if (isPathInside(cwdPath, resolvedPath) || isPathInside(tempPath, resolvedPath)) {
		return null;
	}

	return {
		toolName,
		requestedPath,
		resolvedPath,
		cwdPath,
	};
}

async function confirmWriteAttempt(ctx: ExtensionContext, attempt: WriteAttempt): Promise<boolean> {
	if (!ctx.hasUI) {
		return false;
	}

	return ctx.ui.confirm(
		"Allow external write?",
		`${attempt.toolName} wants to write outside the current directory.\n\nRequested path: ${attempt.requestedPath}\nResolved path: ${attempt.resolvedPath}\nCurrent directory: ${attempt.cwdPath}`,
	);
}

function getBlockReason(ctx: ExtensionContext): string {
	return ctx.hasUI
		? "Blocked by user"
		: "Blocked: no UI available for confirming a write outside the current directory";
}

export default function confirmOutsideCwdWrites(pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		const writeInput = getWriteToolInput(event);
		if (!writeInput) return;

		const attempt = await getWriteAttempt(ctx, writeInput.toolName, writeInput.path);
		if (!attempt) return;

		await sendPiNotificationWhenUnfocused(pi, ctx, {
			message: "Waiting for approval to write outside cwd",
			sound: NotificationSound.Submarine,
		});
		const approved = await confirmWriteAttempt(ctx, attempt);
		if (approved) return;

		return {
			block: true,
			reason: getBlockReason(ctx),
		};
	});
}
