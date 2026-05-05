import { normalizeStringList } from "./config-json-shared";

export const CONFIRM_EVERY_BASH_SESSION_STATE_TYPE = "confirm-every-bash-state";

export function restoreConfirmEveryBashSessionAllowedCommands(ctx: {
	sessionManager: { getBranch(): Array<{ type?: string; customType?: string; data?: unknown }> };
}): Set<string> {
	let allowedCommands: string[] = [];

	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type === "custom" && entry.customType === CONFIRM_EVERY_BASH_SESSION_STATE_TYPE) {
			const data = entry.data as { allowedCommands?: unknown } | undefined;
			allowedCommands = normalizeStringList(data?.allowedCommands);
		}
	}

	return new Set(allowedCommands);
}
