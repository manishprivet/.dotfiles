import os from "node:os";
import path from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { canonicalizeAllowMissing, isPathInside, stripToolPathPrefix } from "./path-shared";
import { showPermissionDialog, type PermissionDialogOption } from "./permission-dialog-ui";

export type WritePermissionDecision = "allow" | "deny";

export const WRITE_PERMISSION_OPTIONS: PermissionDialogOption<WritePermissionDecision>[] = [
	{ value: "allow", label: "Allow write" },
	{ value: "deny", label: "Deny", color: "error" },
];

export type WriteAttempt = {
	toolName: "write" | "edit";
	requestedPath: string;
	resolvedPath: string;
	cwdPath: string;
};

export type WritePermissionDialogConfig = {
	title?: string;
	subtitle?: string;
	contextLines?: string[];
	bodyLabel?: string;
};

export async function getOutsideCwdWriteAttempt(
	cwd: string,
	toolName: "write" | "edit",
	rawPath: string,
): Promise<WriteAttempt | null> {
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

export async function confirmOutsideCwdWrite(
	ctx: Pick<ExtensionContext, "cwd" | "hasUI" | "ui">,
	attempt: WriteAttempt,
	config: WritePermissionDialogConfig = {},
): Promise<boolean> {
	if (!ctx.hasUI) return false;

	const decision = await showPermissionDialog(ctx, {
		title: config.title ?? "⚠ External write permission required",
		subtitle: config.subtitle,
		contextLines: config.contextLines ?? [],
		bodyLabel: config.bodyLabel ?? `${attempt.toolName} target:`,
		body: attempt.resolvedPath,
		options: WRITE_PERMISSION_OPTIONS,
	});

	return decision === "allow";
}
