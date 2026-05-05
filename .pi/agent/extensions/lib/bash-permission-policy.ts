import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	CONFIRM_EVERY_BASH_CONFIG_PATH,
	loadConfirmEveryBashConfig,
	normalizeCommand,
	normalizeStringList,
	shouldAllowWithoutPrompt,
	updateConfirmEveryBashConfig,
} from "./confirm-every-bash-shared";
import { showPermissionDialog, type PermissionDialogOption } from "./permission-dialog-ui";

export type BashPermissionDecision = "allow-once" | "allow-session" | "allow-always" | "deny";

export const BASH_PERMISSION_OPTIONS: PermissionDialogOption<BashPermissionDecision>[] = [
	{ value: "allow-once", label: "Allow once" },
	{ value: "allow-session", label: "Allow this session" },
	{ value: "allow-always", label: "Always allow exact command", color: "warning" },
	{ value: "deny", label: "Deny", color: "error" },
];

export type BashPermissionDialogConfig = {
	title?: string;
	subtitle?: string;
	contextLines?: string[];
	bodyLabel?: string;
	sessionAllowNotification?: (command: string) => string;
};

export async function shouldAllowBashWithoutPrompt(
	command: string,
	sessionAllowedCommands: ReadonlySet<string>,
): Promise<boolean> {
	const config = await loadConfirmEveryBashConfig();
	return shouldAllowWithoutPrompt(normalizeCommand(command), config, sessionAllowedCommands);
}

export async function confirmBashPermission(
	ctx: Pick<ExtensionContext, "cwd" | "hasUI" | "ui">,
	command: string,
	sessionAllowedCommands: Set<string>,
	config: BashPermissionDialogConfig = {},
): Promise<boolean> {
	const normalizedCommand = normalizeCommand(command);
	if (await shouldAllowBashWithoutPrompt(normalizedCommand, sessionAllowedCommands)) return true;
	if (!ctx.hasUI) return false;

	const decision = await showPermissionDialog(ctx, {
		title: config.title ?? "⚠ Bash permission required",
		subtitle: config.subtitle,
		contextLines: config.contextLines ?? [],
		bodyLabel: config.bodyLabel ?? "command:",
		body: normalizedCommand,
		options: BASH_PERMISSION_OPTIONS,
	});

	if (decision === "allow-once") return true;
	if (decision === "allow-session") {
		sessionAllowedCommands.add(normalizedCommand);
		ctx.ui.notify(config.sessionAllowNotification?.(normalizedCommand) ?? `Allowed for this session: ${normalizedCommand}`, "info");
		return true;
	}
	if (decision === "allow-always") {
		await updateConfirmEveryBashConfig((current) => ({
			...current,
			allowCommands: Array.from(new Set([...normalizeStringList(current.allowCommands), normalizedCommand])).sort(),
		}));
		ctx.ui.notify(`Always allowed and saved to ${CONFIRM_EVERY_BASH_CONFIG_PATH}`, "success");
		return true;
	}

	return false;
}
