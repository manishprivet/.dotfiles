import os from "node:os";
import path from "node:path";
import type { AgentEndEvent, ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { normalizeStringList, readJsonFile } from "./lib/config-json-shared";
import { getContextLabel } from "./lib/pi-notification-shared";
import {
	detectTerminalInfo,
	isFocusedTerminalActivePane,
	sendNotification,
	type NotificationPayload,
	type TerminalInfo,
} from "./lib/terminal-notify-shared";

const CONFIG_PATH = path.join(os.homedir(), ".pi", "agent", "notify.json");
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const DEFAULT_INTERACTIVE_TOOL_NAMES = ["question", "questionnaire"];

interface NotifyConfig {
	enabled: boolean;
	suppressWhenFocused: boolean;
	terminal?: string;
	interactiveToolNames: string[];
	quietHours: {
		enabled: boolean;
		start: string;
		end: string;
	};
	title: {
		enabled: boolean;
	};
	sounds: {
		ready?: string;
		error?: string;
		question?: string;
	};
}

type NotifyState = {
	config: NotifyConfig;
	terminalInfo: TerminalInfo;
};

const DEFAULT_CONFIG: NotifyConfig = {
	enabled: true,
	suppressWhenFocused: true,
	interactiveToolNames: DEFAULT_INTERACTIVE_TOOL_NAMES,
	quietHours: {
		enabled: false,
		start: "22:00",
		end: "08:00",
	},
	title: {
		enabled: true,
	},
	sounds: {
		ready: "Glass",
		error: "Basso",
		question: "Submarine",
	},
};

async function loadConfig(): Promise<NotifyConfig> {
	try {
		const parsed = await readJsonFile<Partial<NotifyConfig>>(CONFIG_PATH, {});
		return {
			...DEFAULT_CONFIG,
			...parsed,
			interactiveToolNames: normalizeStringList(
				parsed.interactiveToolNames,
				DEFAULT_CONFIG.interactiveToolNames,
			),
			quietHours: {
				...DEFAULT_CONFIG.quietHours,
				...parsed.quietHours,
			},
			title: {
				...DEFAULT_CONFIG.title,
				...parsed.title,
			},
			sounds: {
				...DEFAULT_CONFIG.sounds,
				...parsed.sounds,
			},
		};
	} catch {
		return DEFAULT_CONFIG;
	}
}

function getBaseTitle(pi: ExtensionAPI): string {
	const cwd = path.basename(process.cwd());
	const session = pi.getSessionName();
	return session ? `π - ${session} - ${cwd}` : `π - ${cwd}`;
}

function isQuietHours(config: NotifyConfig): boolean {
	if (!config.quietHours.enabled) return false;

	const [startHour, startMinute] = config.quietHours.start.split(":").map(Number);
	const [endHour, endMinute] = config.quietHours.end.split(":").map(Number);
	if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) return false;

	const now = new Date();
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const start = startHour * 60 + startMinute;
	const end = endHour * 60 + endMinute;

	if (start > end) {
		return currentMinutes >= start || currentMinutes < end;
	}

	return currentMinutes >= start && currentMinutes < end;
}

async function shouldNotify(config: NotifyConfig, terminalInfo: TerminalInfo, force: boolean): Promise<boolean> {
	if (!config.enabled) return false;
	if (force) return true;
	if (isQuietHours(config)) return false;
	if (config.suppressWhenFocused && (await isFocusedTerminalActivePane(terminalInfo))) return false;
	return true;
}

function findLastAssistantMessage(event: AgentEndEvent) {
	for (let i = event.messages.length - 1; i >= 0; i--) {
		const message = event.messages[i];
		if (message.role === "assistant") return message;
	}
	return undefined;
}

export default function notifyExtension(pi: ExtensionAPI) {
	let spinnerTimer: ReturnType<typeof setInterval> | null = null;
	let spinnerFrame = 0;

	async function getState(): Promise<NotifyState> {
		const config = await loadConfig();
		const terminalInfo = await detectTerminalInfo(config.terminal);
		return { config, terminalInfo };
	}

	function stopSpinner(ctx: ExtensionContext, config?: NotifyConfig) {
		if (spinnerTimer) {
			clearInterval(spinnerTimer);
			spinnerTimer = null;
		}
		spinnerFrame = 0;
		if (ctx.hasUI && (config?.title.enabled ?? true)) {
			ctx.ui.setTitle(getBaseTitle(pi));
		}
	}

	function startSpinner(ctx: ExtensionContext, config: NotifyConfig) {
		if (!ctx.hasUI || !config.title.enabled) return;
		stopSpinner(ctx, config);
		spinnerTimer = setInterval(() => {
			const frame = SPINNER_FRAMES[spinnerFrame % SPINNER_FRAMES.length];
			ctx.ui.setTitle(`${frame} ${getBaseTitle(pi)}`);
			spinnerFrame += 1;
		}, 80);
	}

	async function maybeNotify(
		ctx: ExtensionContext,
		payload: NotificationPayload,
		state: NotifyState,
		options?: { force?: boolean },
	) {
		if (!ctx.hasUI) return false;
		if (!(await shouldNotify(state.config, state.terminalInfo, options?.force ?? false))) return false;
		return sendNotification(payload, state.terminalInfo);
	}

	pi.on("session_start", async (_event, ctx) => {
		const { config } = await getState();
		stopSpinner(ctx, config);
	});

	pi.on("agent_start", async (_event, ctx) => {
		const { config } = await getState();
		startSpinner(ctx, config);
	});

	pi.on("tool_call", async (event, ctx) => {
		const state = await getState();
		const { config } = state;
		if (!config.interactiveToolNames.includes(event.toolName)) return;

		await maybeNotify(ctx, {
			title: "Pi",
			message: "Waiting for your input",
			subtitle: `${event.toolName} • ${getContextLabel(pi, ctx)}`,
			sound: config.sounds.question,
		}, state);
	});

	pi.on("agent_end", async (event, ctx) => {
		const state = await getState();
		const { config } = state;
		stopSpinner(ctx, config);

		const lastAssistant = findLastAssistantMessage(event);
		if (!lastAssistant) return;
		if (lastAssistant.stopReason === "aborted") return;

		if (lastAssistant.stopReason === "error") {
			const errorText = (lastAssistant.errorMessage || "Something went wrong").slice(0, 180);
			await maybeNotify(ctx, {
				title: "Pi",
				message: errorText,
				subtitle: `Error • ${getContextLabel(pi, ctx)}`,
				sound: config.sounds.error,
			}, state);
			return;
		}

		await maybeNotify(ctx, {
			title: "Pi",
			message: "Ready for input",
			subtitle: getContextLabel(pi, ctx),
			sound: config.sounds.ready,
		}, state);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		const { config } = await getState();
		stopSpinner(ctx, config);
	});

	pi.registerCommand("notify-test", {
		description: "Send a test desktop notification",
		handler: async (args, ctx) => {
			const kind = args.trim().toLowerCase();
			const state = await getState();
			const { config } = state;
			const payload: NotificationPayload =
				kind === "error"
					? {
							title: "Pi",
							message: "Test error notification",
							subtitle: getContextLabel(pi, ctx),
							sound: config.sounds.error,
						}
					: kind === "question"
						? {
								title: "Pi",
								message: "Test question notification",
								subtitle: getContextLabel(pi, ctx),
								sound: config.sounds.question,
							}
						: {
								title: "Pi",
								message: "Test ready notification",
								subtitle: getContextLabel(pi, ctx),
								sound: config.sounds.ready,
							};

			const sent = await maybeNotify(ctx, payload, state, { force: true });
			ctx.ui.notify(sent ? "Test notification sent" : "Unable to send notification", sent ? "info" : "warning");
		},
	});

	pi.registerCommand("notify-info", {
		description: "Show notify extension config and detected terminal",
		handler: async (_args, ctx) => {
			const { config, terminalInfo } = await getState();
			const lines = [
				`enabled: ${String(config.enabled)}`,
				`terminal: ${terminalInfo.name ?? "unknown"}`,
				`process: ${terminalInfo.processName ?? "unknown"}`,
				`bundleId: ${terminalInfo.bundleId ?? "unknown"}`,
				`quietHours: ${config.quietHours.enabled ? `${config.quietHours.start}-${config.quietHours.end}` : "off"}`,
				`title: ${String(config.title.enabled)}`,
				`interactiveTools: ${config.interactiveToolNames.join(", ")}`,
				`config: ${CONFIG_PATH}`,
			];
			ctx.ui.notify(lines.join("\n"), "info");
		},
	});
}
