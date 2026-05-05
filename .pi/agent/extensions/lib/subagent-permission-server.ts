import { randomBytes } from "node:crypto";
import * as fs from "node:fs";
import * as net from "node:net";
import * as path from "node:path";
import { confirmBashPermission, shouldAllowBashWithoutPrompt } from "./bash-permission-policy";
import { confirmOutsideCwdWrite, getOutsideCwdWriteAttempt } from "./outside-cwd-write-policy";
import { confirmWebFetchPermission, createWebFetchPermissionState } from "./web-fetch-permission-policy";
import type { PermissionRequest, PermissionResponse, SubagentState, ToolContext } from "./subagent-types";

export type SubagentPermissionServer = {
	ensure(ctx: ToolContext): Promise<{ socketPath: string; token: string }>;
	setContext(ctx: ToolContext | undefined): void;
	clearSessionAllowedCommands(): void;
	close(): void;
};

type Options = {
	getSubagent(id: number): SubagentState | undefined;
};

function requestSubagentId(request: PermissionRequest): number | undefined {
	const id = Number.parseInt(request.subagentId ?? "", 10);
	return Number.isFinite(id) ? id : undefined;
}

export function createSubagentPermissionServer(options: Options): SubagentPermissionServer {
	const sessionAllowedCommands = new Set<string>();
	const webFetchPermissionState = createWebFetchPermissionState();
	const token = randomBytes(16).toString("hex");
	let ctx: ToolContext | undefined;
	let server: net.Server | undefined;
	let socketPath: string | undefined;
	let queue: Promise<void> = Promise.resolve();
	const heartbeatSockets = new Set<net.Socket>();

	function close(): void {
		for (const socket of heartbeatSockets) socket.destroy();
		heartbeatSockets.clear();
		server?.close();
		server = undefined;
		if (socketPath) {
			try {
				fs.unlinkSync(socketPath);
			} catch {}
		}
		socketPath = undefined;
	}

	function getRequestContextLines(request: PermissionRequest, currentCtx: ToolContext): { state?: SubagentState; lines: string[] } {
		const id = requestSubagentId(request);
		const state = id !== undefined ? options.getSubagent(id) : undefined;
		return {
			state,
			lines: [
				`cwd: ${request.cwd ?? currentCtx.cwd}`,
				...(state?.task || request.task ? [`task: ${state?.task ?? request.task}`] : []),
				...(request.pid ? [`pid: ${request.pid}`] : []),
			],
		};
	}

	async function handleBashPermissionRequest(
		request: PermissionRequest,
		currentCtx: ToolContext,
	): Promise<PermissionResponse> {
		if (typeof request.command !== "string" || request.command.trim() === "") {
			return { allow: false, reason: "Blocked: invalid bash permission request" };
		}

		if (await shouldAllowBashWithoutPrompt(request.command, sessionAllowedCommands)) {
			return { allow: true };
		}

		const { state, lines } = getRequestContextLines(request, currentCtx);
		const approved = await confirmBashPermission(currentCtx, request.command, sessionAllowedCommands, {
			title: "⚠ Subagent bash permission required",
			subtitle: state ? `Subagent #${state.id}` : request.subagentId ? `Subagent #${request.subagentId}` : undefined,
			contextLines: lines,
			sessionAllowNotification: (command) => `Allowed for subagents this session: ${command}`,
		});

		return approved ? { allow: true } : { allow: false, reason: "Blocked by user in main Pi UI" };
	}

	async function handleWritePermissionRequest(
		request: PermissionRequest,
		currentCtx: ToolContext,
	): Promise<PermissionResponse> {
		if ((request.toolName !== "write" && request.toolName !== "edit") || typeof request.path !== "string") {
			return { allow: false, reason: "Blocked: invalid write permission request" };
		}

		const attempt = await getOutsideCwdWriteAttempt(request.cwd ?? currentCtx.cwd, request.toolName, request.path);
		if (!attempt) return { allow: true };

		const { state, lines } = getRequestContextLines(request, currentCtx);
		const approved = await confirmOutsideCwdWrite(currentCtx, attempt, {
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

	async function handleWebFetchPermissionRequest(
		request: PermissionRequest,
		currentCtx: ToolContext,
	): Promise<PermissionResponse> {
		if (typeof request.url !== "string" || request.url.trim() === "") {
			return { allow: false, reason: "Blocked: invalid web_fetch permission request" };
		}

		const { state, lines } = getRequestContextLines(request, currentCtx);
		const approved = await confirmWebFetchPermission(currentCtx, request.url, webFetchPermissionState, {
			title: "⚠ Subagent web fetch permission required",
			subtitle: state ? `Subagent #${state.id}` : request.subagentId ? `Subagent #${request.subagentId}` : undefined,
			contextLines: lines,
		});

		return approved ? { allow: true } : { allow: false, reason: "Blocked by user in main Pi UI" };
	}

	async function handlePermissionRequest(request: PermissionRequest): Promise<PermissionResponse> {
		if (request.token !== token) {
			return { allow: false, reason: "Blocked: invalid subagent permission token" };
		}

		const currentCtx = ctx;
		if (!currentCtx || currentCtx.hasUI === false) {
			return { allow: false, reason: "Blocked: no main Pi UI available for subagent permission confirmation" };
		}

		if (request.kind === "bash") return handleBashPermissionRequest(request, currentCtx);
		if (request.kind === "write") return handleWritePermissionRequest(request, currentCtx);
		if (request.kind === "web_fetch") return handleWebFetchPermissionRequest(request, currentCtx);
		return { allow: false, reason: "Blocked: unknown subagent permission request kind" };
	}

	function handleHeartbeatRequest(request: PermissionRequest, socket: net.Socket): boolean {
		if (request.kind !== "heartbeat") return false;
		if (request.token !== token) {
			socket.end(JSON.stringify({ allow: false, reason: "Invalid heartbeat token" }) + "\n");
			return true;
		}

		heartbeatSockets.add(socket);
		socket.write(JSON.stringify({ ok: true }) + "\n");
		socket.on("close", () => heartbeatSockets.delete(socket));
		socket.on("error", () => heartbeatSockets.delete(socket));
		return true;
	}

	function enqueuePermissionRequest(request: PermissionRequest): Promise<PermissionResponse> {
		const responsePromise = queue.then(() => handlePermissionRequest(request));
		queue = responsePromise.then(() => undefined, () => undefined);
		return responsePromise.catch((error) => ({
			allow: false,
			reason: `Blocked: subagent permission bridge failed: ${error instanceof Error ? error.message : String(error)}`,
		}));
	}

	async function ensure(nextCtx: ToolContext): Promise<{ socketPath: string; token: string }> {
		ctx = nextCtx;
		if (server && socketPath) {
			return { socketPath, token };
		}

		socketPath = path.join("/tmp", `pi-subperm-${process.pid}-${randomBytes(6).toString("hex")}.sock`);
		try {
			fs.unlinkSync(socketPath);
		} catch {}

		server = net.createServer((socket) => {
			let buffer = "";
			let handledFirstRequest = false;
			socket.setEncoding("utf-8");
			socket.on("data", (chunk: string) => {
				if (handledFirstRequest) return;
				buffer += chunk;
				const newline = buffer.indexOf("\n");
				if (newline === -1) return;
				handledFirstRequest = true;

				const line = buffer.slice(0, newline).trim();
				let request: PermissionRequest;
				try {
					request = JSON.parse(line) as PermissionRequest;
				} catch {
					socket.end(JSON.stringify({ allow: false, reason: "Blocked: invalid subagent permission request JSON" }) + "\n");
					return;
				}

				if (handleHeartbeatRequest(request, socket)) return;

				void enqueuePermissionRequest(request).then((response) => {
					socket.end(JSON.stringify(response) + "\n");
				});
			});
		});

		server.on("error", (error) => {
			ctx?.ui.notify(`Subagent permission bridge error: ${error.message}`, "error");
		});

		await new Promise<void>((resolve, reject) => {
			server!.once("error", reject);
			server!.listen(socketPath, () => {
				server!.off("error", reject);
				resolve();
			});
		});

		return { socketPath, token };
	}

	return {
		ensure,
		setContext(nextCtx) {
			ctx = nextCtx;
		},
		clearSessionAllowedCommands() {
			sessionAllowedCommands.clear();
			webFetchPermissionState.allowedOrigins.clear();
		},
		close,
	};
}
