/**
 * Subagent Widget — background Pi subagents with live widgets.
 *
 * Commands:
 *   /sub <task>                 Spawn a new background subagent
 *   /subcont <id> <prompt>      Continue a completed subagent's session
 *   /subrm <id>                 Remove a subagent widget; kills it if running
 *   /subclear                   Clear all subagent widgets; kills running agents
 *   /sublist                    List active and completed subagents
 *
 * Tools exposed to the main agent:
 *   subagent_create, subagent_continue, subagent_remove, subagent_list
 */

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomBytes } from "node:crypto";
import * as fs from "node:fs";
import * as net from "node:net";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { DynamicBorder, type ExtensionAPI, type ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Box, Container, Text, truncateToWidth } from "@mariozechner/pi-tui";
import { Type } from "typebox";
import {
	confirmBashPermission,
	shouldAllowBashWithoutPrompt,
} from "./lib/bash-permission-policy";
import {
	confirmOutsideCwdWrite,
	getOutsideCwdWriteAttempt,
} from "./lib/outside-cwd-write-policy";

type SubagentStatus = "running" | "done" | "error";
type NotifyLevel = "info" | "success" | "warning" | "error";
type ToolUpdate = (update: { content: Array<{ type: "text"; text: string }> }) => void;

type PermissionRequest = {
	token?: string;
	kind?: "bash" | "write";
	command?: string;
	toolName?: "write" | "edit";
	path?: string;
	cwd?: string;
	toolCallId?: string;
	subagentId?: string;
	task?: string;
	pid?: number;
};

type PermissionResponse = {
	allow: boolean;
	reason?: string;
};

type ToolContext = ExtensionContext & { hasUI?: boolean };

interface SubagentState {
	id: number;
	status: SubagentStatus;
	task: string;
	textChunks: string[];
	toolCount: number;
	elapsedMs: number;
	sessionFile: string;
	turnCount: number;
	proc?: ChildProcessWithoutNullStreams;
	error?: string;
	removed?: boolean;
}

const SUBAGENT_TOOLS = "read,bash,edit,write,grep,find,ls";
const RESULT_PREVIEW_LIMIT = 8_000;
const WIDGET_RESULT_LIMIT = 4_000;

function getPiInvocation(args: string[]): { command: string; args: string[] } {
	const currentScript = process.argv[1];
	const isBunVirtualScript = currentScript?.startsWith("/$bunfs/root/");
	if (currentScript && !isBunVirtualScript && fs.existsSync(currentScript)) {
		return { command: process.execPath, args: [currentScript, ...args] };
	}

	const execName = path.basename(process.execPath).toLowerCase();
	const isGenericRuntime = /^(node|bun)(\.exe)?$/.test(execName);
	if (!isGenericRuntime) {
		return { command: process.execPath, args };
	}

	return { command: "pi", args };
}

function getPermissionClientExtensionPath(): string {
	return path.join(path.dirname(fileURLToPath(import.meta.url)), "lib", "subagent-permission-client.ts");
}

function makeSessionFile(id: number): string {
	const dir = path.join(os.homedir(), ".pi", "agent", "sessions", "subagents");
	fs.mkdirSync(dir, { recursive: true });
	return path.join(dir, `subagent-${id}-${Date.now()}.jsonl`);
}

function formatSeconds(ms: number): string {
	return `${Math.max(0, Math.round(ms / 1000))}s`;
}

function statusMeta(status: SubagentStatus): { icon: string; color: "accent" | "success" | "error" } {
	if (status === "running") return { icon: "●", color: "accent" };
	if (status === "done") return { icon: "✓", color: "success" };
	return { icon: "✗", color: "error" };
}

function latestNonEmptyLine(text: string): string {
	return text.split("\n").map((line) => line.trim()).filter(Boolean).pop() ?? "";
}

function buildList(agents: Map<number, SubagentState>): string {
	if (agents.size === 0) return "No subagents.";
	return Array.from(agents.values())
		.map((state) => {
			const turn = state.turnCount > 1 ? ` turn ${state.turnCount}` : " turn 1";
			return `#${state.id} [${state.status.toUpperCase()} ·${turn} · ${formatSeconds(state.elapsedMs)} · tools:${state.toolCount}] ${state.task}`;
		})
		.join("\n");
}

function notify(ctx: ToolContext, message: string, level: NotifyLevel): void {
	if (ctx.hasUI === false) return;
	ctx.ui.notify(message, level);
}

export default function subagentWidget(pi: ExtensionAPI) {
	const agents = new Map<number, SubagentState>();
	const subagentSessionAllowedCommands = new Set<string>();
	const permissionToken = randomBytes(16).toString("hex");
	let nextId = 1;
	let widgetCtx: ToolContext | undefined;
	let permissionServer: net.Server | undefined;
	let permissionSocketPath: string | undefined;
	let permissionQueue: Promise<void> = Promise.resolve();

	function closePermissionServer(): void {
		permissionServer?.close();
		permissionServer = undefined;
		if (permissionSocketPath) {
			try {
				fs.unlinkSync(permissionSocketPath);
			} catch {}
		}
		permissionSocketPath = undefined;
	}

	function getRequestContextLines(request: PermissionRequest, ctx: ToolContext): { state?: SubagentState; lines: string[] } {
		const id = Number.parseInt(request.subagentId ?? "", 10);
		const state = Number.isFinite(id) ? agents.get(id) : undefined;
		return {
			state,
			lines: [
				`cwd: ${request.cwd ?? ctx.cwd}`,
				...(state?.task || request.task ? [`task: ${state?.task ?? request.task}`] : []),
				...(request.pid ? [`pid: ${request.pid}`] : []),
			],
		};
	}

	async function handleBashPermissionRequest(request: PermissionRequest, ctx: ToolContext): Promise<PermissionResponse> {
		if (typeof request.command !== "string" || request.command.trim() === "") {
			return { allow: false, reason: "Blocked: invalid bash permission request" };
		}

		if (await shouldAllowBashWithoutPrompt(request.command, subagentSessionAllowedCommands)) {
			return { allow: true };
		}

		const { state, lines } = getRequestContextLines(request, ctx);
		const approved = await confirmBashPermission(ctx, request.command, subagentSessionAllowedCommands, {
			title: "⚠ Subagent bash permission required",
			subtitle: state ? `Subagent #${state.id}` : request.subagentId ? `Subagent #${request.subagentId}` : undefined,
			contextLines: lines,
			sessionAllowNotification: (command) => `Allowed for subagents this session: ${command}`,
		});

		return approved ? { allow: true } : { allow: false, reason: "Blocked by user in main Pi UI" };
	}

	async function handleWritePermissionRequest(request: PermissionRequest, ctx: ToolContext): Promise<PermissionResponse> {
		if ((request.toolName !== "write" && request.toolName !== "edit") || typeof request.path !== "string") {
			return { allow: false, reason: "Blocked: invalid write permission request" };
		}

		const attempt = await getOutsideCwdWriteAttempt(request.cwd ?? ctx.cwd, request.toolName, request.path);
		if (!attempt) return { allow: true };

		const { state, lines } = getRequestContextLines(request, ctx);
		const approved = await confirmOutsideCwdWrite(ctx, attempt, {
			title: "⚠ Subagent external write permission required",
			subtitle: state ? `Subagent #${state.id}` : request.subagentId ? `Subagent #${request.subagentId}` : undefined,
			contextLines: [
				...lines,
				`project root: ${attempt.cwdPath}`,
				`requested: ${attempt.requestedPath}`,
			],
		});

		return approved ? { allow: true } : { allow: false, reason: "Blocked by user in main Pi UI" };
	}

	async function handlePermissionRequest(request: PermissionRequest): Promise<PermissionResponse> {
		if (request.token !== permissionToken) {
			return { allow: false, reason: "Blocked: invalid subagent permission token" };
		}

		const ctx = widgetCtx;
		if (!ctx || ctx.hasUI === false) {
			return { allow: false, reason: "Blocked: no main Pi UI available for subagent permission confirmation" };
		}

		if (request.kind === "bash") return handleBashPermissionRequest(request, ctx);
		if (request.kind === "write") return handleWritePermissionRequest(request, ctx);
		return { allow: false, reason: "Blocked: unknown subagent permission request kind" };
	}

	function enqueuePermissionRequest(request: PermissionRequest): Promise<PermissionResponse> {
		const responsePromise = permissionQueue.then(() => handlePermissionRequest(request));
		permissionQueue = responsePromise.then(() => undefined, () => undefined);
		return responsePromise.catch((error) => ({
			allow: false,
			reason: `Blocked: subagent permission bridge failed: ${error instanceof Error ? error.message : String(error)}`,
		}));
	}

	async function ensurePermissionServer(ctx: ToolContext): Promise<{ socketPath: string; token: string }> {
		widgetCtx = ctx;
		if (permissionServer && permissionSocketPath) {
			return { socketPath: permissionSocketPath, token: permissionToken };
		}

		permissionSocketPath = path.join("/tmp", `pi-subperm-${process.pid}-${randomBytes(6).toString("hex")}.sock`);
		try {
			fs.unlinkSync(permissionSocketPath);
		} catch {}

		permissionServer = net.createServer((socket) => {
			let buffer = "";
			socket.setEncoding("utf-8");
			socket.on("data", (chunk: string) => {
				buffer += chunk;
				const newline = buffer.indexOf("\n");
				if (newline === -1) return;

				const line = buffer.slice(0, newline).trim();
				let request: PermissionRequest;
				try {
					request = JSON.parse(line) as PermissionRequest;
				} catch {
					socket.end(JSON.stringify({ allow: false, reason: "Blocked: invalid subagent permission request JSON" }) + "\n");
					return;
				}

				void enqueuePermissionRequest(request).then((response) => {
					socket.end(JSON.stringify(response) + "\n");
				});
			});
		});

		permissionServer.on("error", (error) => {
			widgetCtx?.ui.notify(`Subagent permission bridge error: ${error.message}`, "error");
		});

		await new Promise<void>((resolve, reject) => {
			permissionServer!.once("error", reject);
			permissionServer!.listen(permissionSocketPath, () => {
				permissionServer!.off("error", reject);
				resolve();
			});
		});

		return { socketPath: permissionSocketPath, token: permissionToken };
	}

	function clearWidget(id: number, ctx = widgetCtx): void {
		if (ctx?.hasUI === false) return;
		ctx?.ui.setWidget(`subagent-${id}`, undefined);
	}

	function updateWidgets(): void {
		const ctx = widgetCtx;
		if (!ctx || ctx.hasUI === false) return;

		for (const state of agents.values()) {
			ctx.ui.setWidget(`subagent-${state.id}`, (_tui, theme) => {
				const container = new Container();
				const border = (s: string) => theme.fg("borderMuted", s);
				const content = new Text("", 1, 0);

				container.addChild(new DynamicBorder(border));
				container.addChild(content);
				container.addChild(new DynamicBorder(border));

				return {
					render(width: number): string[] {
						const meta = statusMeta(state.status);
						const taskWidth = Math.max(12, Math.min(56, Math.floor(width * 0.45)));
						const title = [
							theme.fg(meta.color, `${meta.icon} Subagent #${state.id}`),
							state.turnCount > 1 ? theme.fg("dim", ` · turn ${state.turnCount}`) : "",
							theme.fg("dim", ` · ${formatSeconds(state.elapsedMs)}`),
							theme.fg("dim", ` · tools:${state.toolCount}`),
							theme.fg("muted", ` · ${truncateToWidth(state.task, taskWidth, "…")}`),
						].join("");

						const lines = [title];
						const lastLine = latestNonEmptyLine(state.textChunks.join(""));
						if (lastLine) {
							lines.push(theme.fg("muted", `  ${truncateToWidth(lastLine, Math.max(1, width - 4), "…")}`));
						}
						if (state.error) {
							lines.push(theme.fg("error", `  ${truncateToWidth(state.error, Math.max(1, width - 4), "…")}`));
						}

						content.setText(lines.join("\n"));
						return container.render(width);
					},
					invalidate() {
						container.invalidate();
					},
				};
			});
		}
	}

	function processJsonLine(state: SubagentState, line: string): void {
		if (!line.trim()) return;

		try {
			const event = JSON.parse(line);
			if (event.type === "message_update") {
				const delta = event.assistantMessageEvent;
				if (delta?.type === "text_delta") {
					state.textChunks.push(delta.delta ?? "");
					updateWidgets();
				}
				return;
			}

			if (event.type === "message_end" && event.message?.role === "assistant") {
				const content = event.message.content;
				if (Array.isArray(content)) {
					for (const part of content) {
						if (part?.type === "text" && typeof part.text === "string" && state.textChunks.length === 0) {
							state.textChunks.push(part.text);
						}
					}
				}
				if (event.message.errorMessage) state.error = event.message.errorMessage;
				updateWidgets();
				return;
			}

			if (event.type === "tool_execution_start") {
				state.toolCount += 1;
				const toolName = event.toolName ? String(event.toolName) : "tool";
				state.textChunks.push(`\n▶ ${toolName}`);
				updateWidgets();
			}
		} catch {
			// Ignore non-JSON output. stderr is handled separately.
		}
	}

	async function spawnAgent(state: SubagentState, prompt: string, ctx: ToolContext): Promise<void> {
		const permissionBridge = await ensurePermissionServer(ctx);
		const args = [
			"--mode", "json",
			"--print",
			"--session", state.sessionFile,
			"--no-extensions",
			"--extension", getPermissionClientExtensionPath(),
			"--tools", SUBAGENT_TOOLS,
		];

		if (ctx.model) {
			args.push("--model", `${ctx.model.provider}/${ctx.model.id}`);
		}

		// Keep this after --model. `--thinking off` currently clamps to
		// "minimal" for gpt-5.5, which OpenAI rejects; "low" is the lowest
		// supported level for that model and works as a safe subagent default.
		args.push("--thinking", "low");
		args.push(prompt);
		const invocation = getPiInvocation(args);
		const proc = spawn(invocation.command, invocation.args, {
			cwd: ctx.cwd,
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				...process.env,
				PI_SUBAGENT_PERMISSION_SOCKET: permissionBridge.socketPath,
				PI_SUBAGENT_PERMISSION_TOKEN: permissionBridge.token,
				PI_SUBAGENT_ID: String(state.id),
				PI_SUBAGENT_TASK: state.task,
			},
		});

		state.proc = proc;
		const startedAt = Date.now();
		const timer = setInterval(() => {
			state.elapsedMs = Date.now() - startedAt;
			updateWidgets();
		}, 1000);

		let stdoutBuffer = "";
		proc.stdout.setEncoding("utf-8");
		proc.stdout.on("data", (chunk: string) => {
			stdoutBuffer += chunk;
			const lines = stdoutBuffer.split("\n");
			stdoutBuffer = lines.pop() ?? "";
			for (const line of lines) processJsonLine(state, line);
		});

		proc.stderr.setEncoding("utf-8");
		proc.stderr.on("data", (chunk: string) => {
			if (!chunk.trim()) return;
			state.textChunks.push(`\n${chunk}`);
			updateWidgets();
		});

		proc.on("close", (code, signal) => {
			if (stdoutBuffer.trim()) processJsonLine(state, stdoutBuffer);
			clearInterval(timer);
			state.proc = undefined;
			if (state.removed) return;

			state.elapsedMs = Date.now() - startedAt;
			state.status = code === 0 ? "done" : "error";
			if (signal) state.error = `terminated by ${signal}`;
			if (code !== 0 && !state.error) state.error = `pi exited with code ${code ?? "unknown"}`;
			updateWidgets();

			const result = state.textChunks.join("").trim();
			notify(
				ctx,
				`Subagent #${state.id} ${state.status} in ${formatSeconds(state.elapsedMs)}`,
				state.status === "done" ? "success" : "error",
			);

			pi.sendMessage({
				customType: "subagent-result",
				content: `Subagent #${state.id}${state.turnCount > 1 ? ` (turn ${state.turnCount})` : ""} finished: ${prompt}\n\n${result.slice(0, RESULT_PREVIEW_LIMIT)}${result.length > RESULT_PREVIEW_LIMIT ? "\n\n… [truncated]" : ""}`,
				display: true,
				details: {
					id: state.id,
					status: state.status,
					task: prompt,
					turnCount: state.turnCount,
					elapsedMs: state.elapsedMs,
					toolCount: state.toolCount,
					sessionFile: state.sessionFile,
					exitCode: code,
					signal,
				},
			}, { deliverAs: "followUp", triggerTurn: true });
		});

		proc.on("error", (error) => {
			clearInterval(timer);
			state.proc = undefined;
			if (state.removed) return;

			state.elapsedMs = Date.now() - startedAt;
			state.status = "error";
			state.error = error.message;
			state.textChunks.push(`\nError: ${error.message}`);
			updateWidgets();
			notify(ctx, `Subagent #${state.id} failed: ${error.message}`, "error");
		});
	}

	async function createSubagent(task: string, ctx: ToolContext): Promise<SubagentState> {
		widgetCtx = ctx;
		const id = nextId++;
		const state: SubagentState = {
			id,
			status: "running",
			task,
			textChunks: [],
			toolCount: 0,
			elapsedMs: 0,
			sessionFile: makeSessionFile(id),
			turnCount: 1,
		};
		agents.set(id, state);
		updateWidgets();
		await spawnAgent(state, task, ctx);
		return state;
	}

	async function continueSubagent(id: number, prompt: string, ctx: ToolContext): Promise<SubagentState | string> {
		widgetCtx = ctx;
		const state = agents.get(id);
		if (!state) return `No subagent #${id} found.`;
		if (state.status === "running") return `Subagent #${id} is still running.`;

		state.status = "running";
		state.task = prompt;
		state.textChunks = [];
		state.toolCount = 0;
		state.elapsedMs = 0;
		state.error = undefined;
		state.removed = false;
		state.turnCount += 1;
		updateWidgets();
		await spawnAgent(state, prompt, ctx);
		return state;
	}

	function removeSubagent(id: number, ctx: ToolContext): string {
		widgetCtx = ctx;
		const state = agents.get(id);
		if (!state) return `No subagent #${id} found.`;

		let suffix = "removed";
		state.removed = true;
		if (state.proc && state.status === "running") {
			state.proc.kill("SIGTERM");
			suffix = "killed and removed";
		}
		agents.delete(id);
		clearWidget(id, ctx);
		return `Subagent #${id} ${suffix}.`;
	}

	function clearSubagents(ctx: ToolContext): string {
		widgetCtx = ctx;
		let killed = 0;
		const total = agents.size;
		for (const [id, state] of agents.entries()) {
			state.removed = true;
			if (state.proc && state.status === "running") {
				state.proc.kill("SIGTERM");
				killed += 1;
			}
			clearWidget(id, ctx);
		}
		agents.clear();
		nextId = 1;
		if (total === 0) return "No subagents to clear.";
		return `Cleared ${total} subagent${total === 1 ? "" : "s"}${killed > 0 ? ` (${killed} killed)` : ""}.`;
	}

	pi.registerMessageRenderer("subagent-result", (message, _options, theme) => {
		const details = message.details as Partial<SubagentState> | undefined;
		const status = details?.status ?? "done";
		const meta = statusMeta(status);
		const header = theme.fg(meta.color, `${meta.icon} Subagent result`) +
			(details?.id ? theme.fg("dim", ` #${details.id}`) : "");
		const text = `${header}\n${String(message.content).slice(0, WIDGET_RESULT_LIMIT)}`;
		const box = new Box(1, 1, (s: string) => theme.bg("customMessageBg", s));
		box.addChild(new Text(text, 0, 0));
		return box;
	});

	pi.registerTool({
		name: "subagent_create",
		label: "Create Subagent",
		description: "Spawn a background Pi subagent for an independent task. Returns immediately; bash permission and external writes are routed through the main Pi UI.",
		promptSnippet: "Spawn a background subagent for an independent investigation, summarization, or narrowly scoped implementation task",
		promptGuidelines: [
			"Use subagent_create for independent research, code reading, summarization, or narrowly scoped implementation tasks that can run in parallel.",
			"When using subagent_create for file changes, keep the task narrow and avoid overlapping edits with the main agent or other subagents.",
		],
		parameters: Type.Object({
			task: Type.String({ description: "Complete task description for the subagent" }),
		}),
		async execute(_callId: string, args: { task: string }, _signal: AbortSignal | undefined, onUpdate: ToolUpdate | undefined, ctx: ToolContext) {
			onUpdate?.({ content: [{ type: "text", text: `Spawning subagent: ${args.task}` }] });
			const state = await createSubagent(args.task, ctx);
			return {
				content: [{ type: "text", text: `Subagent #${state.id} spawned and running in the background.` }],
				details: { id: state.id, sessionFile: state.sessionFile },
			};
		},
	});

	pi.registerTool({
		name: "subagent_continue",
		label: "Continue Subagent",
		description: "Continue an existing completed subagent's persistent session with a follow-up prompt.",
		parameters: Type.Object({
			id: Type.Number({ description: "Subagent ID" }),
			prompt: Type.String({ description: "Follow-up prompt" }),
		}),
		async execute(_callId: string, args: { id: number; prompt: string }, _signal: AbortSignal | undefined, _onUpdate: ToolUpdate | undefined, ctx: ToolContext) {
			const result = await continueSubagent(args.id, args.prompt, ctx);
			if (typeof result === "string") return { content: [{ type: "text", text: `Error: ${result}` }] };
			return { content: [{ type: "text", text: `Subagent #${args.id} continuing in the background.` }] };
		},
	});

	pi.registerTool({
		name: "subagent_remove",
		label: "Remove Subagent",
		description: "Remove a subagent widget and kill it if it is still running.",
		parameters: Type.Object({
			id: Type.Number({ description: "Subagent ID" }),
		}),
		async execute(_callId: string, args: { id: number }, _signal: AbortSignal | undefined, _onUpdate: ToolUpdate | undefined, ctx: ToolContext) {
			return { content: [{ type: "text", text: removeSubagent(args.id, ctx) }] };
		},
	});

	pi.registerTool({
		name: "subagent_list",
		label: "List Subagents",
		description: "List active and completed subagents in this Pi session.",
		parameters: Type.Object({}),
		async execute() {
			return { content: [{ type: "text", text: buildList(agents) }] };
		},
	});

	pi.registerCommand("sub", {
		description: "Spawn a background subagent with a live widget: /sub <task>",
		handler: async (args, ctx) => {
			const task = args.trim();
			if (!task) {
				ctx.ui.notify("Usage: /sub <task>", "warning");
				return;
			}
			const state = await createSubagent(task, ctx as ToolContext);
			ctx.ui.notify(`Subagent #${state.id} spawned.`, "success");
		},
	});

	pi.registerCommand("subcont", {
		description: "Continue an existing subagent session: /subcont <id> <prompt>",
		handler: async (args, ctx) => {
			const trimmed = args.trim();
			const space = trimmed.indexOf(" ");
			const id = Number.parseInt(space === -1 ? trimmed : trimmed.slice(0, space), 10);
			const prompt = space === -1 ? "" : trimmed.slice(space + 1).trim();
			if (!Number.isFinite(id) || !prompt) {
				ctx.ui.notify("Usage: /subcont <id> <prompt>", "warning");
				return;
			}

			const result = await continueSubagent(id, prompt, ctx as ToolContext);
			if (typeof result === "string") ctx.ui.notify(result, "error");
			else ctx.ui.notify(`Continuing subagent #${id} (turn ${result.turnCount}).`, "info");
		},
	});

	pi.registerCommand("subrm", {
		description: "Remove a subagent widget; kills it if running: /subrm <id>",
		handler: async (args, ctx) => {
			const id = Number.parseInt(args.trim(), 10);
			if (!Number.isFinite(id)) {
				ctx.ui.notify("Usage: /subrm <id>", "warning");
				return;
			}
			ctx.ui.notify(removeSubagent(id, ctx as ToolContext), "info");
		},
	});

	pi.registerCommand("subclear", {
		description: "Clear all subagent widgets; kills running agents",
		handler: async (_args, ctx) => {
			ctx.ui.notify(clearSubagents(ctx as ToolContext), "info");
		},
	});

	pi.registerCommand("sublist", {
		description: "List active and completed subagents",
		handler: async (_args, ctx) => {
			ctx.ui.notify(buildList(agents), "info");
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		widgetCtx = ctx as ToolContext;
		subagentSessionAllowedCommands.clear();
		updateWidgets();
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		clearSubagents(ctx as ToolContext);
		closePermissionServer();
		widgetCtx = undefined;
	});
}
