import os from "node:os";
import path from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { normalizeStringList, readJsonFile, writeJsonFile } from "./config-json-shared";
import { showPermissionDialog, type PermissionDialogOption } from "./permission-dialog-ui";

export const WEB_FETCH_PERMISSIONS_CONFIG_PATH = path.join(os.homedir(), ".pi", "agent", "web-fetch-permissions.json");

type WebFetchPermissionDecision = "allow-once" | "allow-origin-session" | "allow-origin-always" | "allow-url-always" | "deny";

const WEB_FETCH_PERMISSION_OPTIONS: PermissionDialogOption<WebFetchPermissionDecision>[] = [
	{ value: "allow-once", label: "Allow once" },
	{ value: "allow-origin-session", label: "Allow origin this session" },
	{ value: "allow-origin-always", label: "Always allow origin", color: "warning" },
	{ value: "allow-url-always", label: "Always allow exact URL", color: "warning" },
	{ value: "deny", label: "Deny", color: "error" },
];

export type WebFetchPermissionsConfig = {
	allowOrigins?: string[];
	allowUrls?: string[];
};

export type WebFetchPermissionState = {
	allowedOrigins: Set<string>;
};

export type WebFetchPermissionDialogConfig = {
	title?: string;
	subtitle?: string;
	contextLines?: string[];
	bodyLabel?: string;
};

export function createWebFetchPermissionState(): WebFetchPermissionState {
	return { allowedOrigins: new Set() };
}

function normalizeUrl(rawUrl: string): string {
	return rawUrl.trim();
}

function getOrigin(rawUrl: string): string | null {
	try {
		const url = new URL(rawUrl);
		return url.origin;
	} catch {
		return null;
	}
}

async function loadWebFetchPermissionsConfig(): Promise<Required<WebFetchPermissionsConfig>> {
	const parsed = await readJsonFile<WebFetchPermissionsConfig>(WEB_FETCH_PERMISSIONS_CONFIG_PATH, {});
	return {
		allowOrigins: normalizeStringList(parsed.allowOrigins),
		allowUrls: normalizeStringList(parsed.allowUrls).map(normalizeUrl),
	};
}

async function updateWebFetchPermissionsConfig(
	mutator: (config: WebFetchPermissionsConfig) => WebFetchPermissionsConfig,
): Promise<void> {
	const current = await readJsonFile<WebFetchPermissionsConfig>(WEB_FETCH_PERMISSIONS_CONFIG_PATH, {});
	await writeJsonFile(WEB_FETCH_PERMISSIONS_CONFIG_PATH, mutator(current));
}

export async function shouldAllowWebFetchWithoutPrompt(
	url: string,
	state: WebFetchPermissionState,
): Promise<boolean> {
	const normalizedUrl = normalizeUrl(url);
	const origin = getOrigin(normalizedUrl);
	const config = await loadWebFetchPermissionsConfig();
	if (config.allowUrls.includes(normalizedUrl)) return true;
	if (origin && (state.allowedOrigins.has(origin) || config.allowOrigins.includes(origin))) return true;
	return false;
}

export async function confirmWebFetchPermission(
	ctx: Pick<ExtensionContext, "cwd" | "hasUI" | "ui">,
	url: string,
	state: WebFetchPermissionState,
	dialogConfig: WebFetchPermissionDialogConfig = {},
): Promise<boolean> {
	const normalizedUrl = normalizeUrl(url);
	const origin = getOrigin(normalizedUrl);
	if (await shouldAllowWebFetchWithoutPrompt(normalizedUrl, state)) return true;
	if (!ctx.hasUI) return false;

	const decision = await showPermissionDialog(ctx, {
		title: dialogConfig.title ?? "⚠ Web fetch permission required",
		subtitle: dialogConfig.subtitle,
		contextLines: [...(dialogConfig.contextLines ?? []), origin ? `origin: ${origin}` : "origin: invalid URL"],
		bodyLabel: dialogConfig.bodyLabel ?? "url:",
		body: normalizedUrl,
		options: WEB_FETCH_PERMISSION_OPTIONS,
	});

	if (decision === "allow-once") return true;
	if (decision === "allow-origin-session") {
		if (!origin) return false;
		state.allowedOrigins.add(origin);
		ctx.ui.notify(`Allowed web fetch origin for this session: ${origin}`, "info");
		return true;
	}
	if (decision === "allow-origin-always") {
		if (!origin) return false;
		await updateWebFetchPermissionsConfig((current) => ({
			...current,
			allowOrigins: Array.from(new Set([...normalizeStringList(current.allowOrigins), origin])).sort(),
		}));
		ctx.ui.notify(`Always allowed web fetch origin and saved to ${WEB_FETCH_PERMISSIONS_CONFIG_PATH}`, "success");
		return true;
	}
	if (decision === "allow-url-always") {
		await updateWebFetchPermissionsConfig((current) => ({
			...current,
			allowUrls: Array.from(new Set([...normalizeStringList(current.allowUrls).map(normalizeUrl), normalizedUrl])).sort(),
		}));
		ctx.ui.notify(`Always allowed web fetch URL and saved to ${WEB_FETCH_PERMISSIONS_CONFIG_PATH}`, "success");
		return true;
	}

	return false;
}
