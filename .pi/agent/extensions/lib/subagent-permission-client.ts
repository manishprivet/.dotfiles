import * as net from "node:net";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { PermissionRequest, PermissionResponse } from "./subagent-types";
import { getBashCommand, getWriteToolInput } from "./tool-call-shared";

type ToolCallLike = {
	toolName?: string;
	toolCallId: string;
	input?: unknown;
};

const REQUEST_TIMEOUT_MS = 10 * 60 * 1000;

function getBridgeEnv(): { socketPath?: string; token?: string; subagentId?: string; task?: string } {
	return {
		socketPath: process.env.PI_SUBAGENT_PERMISSION_SOCKET,
		token: process.env.PI_SUBAGENT_PERMISSION_TOKEN,
		subagentId: process.env.PI_SUBAGENT_ID,
		task: process.env.PI_SUBAGENT_TASK,
	};
}

function startParentHeartbeat(): void {
	const { socketPath, token, subagentId, task } = getBridgeEnv();
	if (!socketPath || !token) return;

	const socket = net.createConnection(socketPath);
	// Keep the heartbeat active while the subagent is doing model/tool work,
	// but do not let this long-lived socket keep `pi --print` alive after the
	// agent has produced its final answer.
	socket.unref();
	let connected = false;
	let exiting = false;

	function exitBecauseParentGone(reason: string): void {
		if (exiting) return;
		exiting = true;
		console.error(`Subagent exiting: ${reason}`);
		process.exit(1);
	}

	socket.on("connect", () => {
		connected = true;
		socket.write(JSON.stringify({
			kind: "heartbeat",
			token,
			subagentId,
			task,
			pid: process.pid,
		}) + "\n");
	});

	socket.on("close", () => exitBecauseParentGone("main Pi permission bridge closed"));
	socket.on("end", () => exitBecauseParentGone("main Pi permission bridge ended"));
	socket.on("error", (error) => {
		exitBecauseParentGone(
			connected
				? `main Pi permission bridge error: ${error.message}`
				: `could not connect to main Pi permission bridge: ${error.message}`,
		);
	});
}

function getWebFetchUrl(event: unknown): string | null {
	const toolCall = event as ToolCallLike;
	const url = (toolCall.input as { url?: unknown } | undefined)?.url;
	return toolCall.toolName === "web_fetch" && typeof url === "string" ? url : null;
}

function requestPermission(request: PermissionRequest): Promise<PermissionResponse> {
	const { socketPath, token, subagentId, task } = getBridgeEnv();

	if (!socketPath || !token) {
		return Promise.resolve({
			allow: false,
			reason: "Blocked: subagent permission bridge is not configured",
		});
	}

	return new Promise((resolve) => {
		const socket = net.createConnection(socketPath);
		let buffer = "";
		let settled = false;

		function settle(response: PermissionResponse): void {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			socket.destroy();
			resolve(response);
		}

		const timeout = setTimeout(() => {
			settle({ allow: false, reason: "Blocked: timed out waiting for main Pi permission approval" });
		}, REQUEST_TIMEOUT_MS);

		socket.on("connect", () => {
			socket.write(JSON.stringify({
				...request,
				token,
				subagentId,
				task,
				pid: process.pid,
			}) + "\n");
		});

		socket.on("data", (chunk) => {
			buffer += chunk.toString("utf-8");
			const newline = buffer.indexOf("\n");
			if (newline === -1) return;

			const line = buffer.slice(0, newline).trim();
			try {
				const response = JSON.parse(line) as PermissionResponse;
				settle({
					allow: response.allow === true,
					reason: typeof response.reason === "string" ? response.reason : undefined,
				});
			} catch {
				settle({ allow: false, reason: "Blocked: invalid response from main Pi permission bridge" });
			}
		});

		socket.on("error", (error) => {
			settle({ allow: false, reason: `Blocked: main Pi permission bridge error: ${error.message}` });
		});

		socket.on("end", () => {
			settle({ allow: false, reason: "Blocked: main Pi permission bridge closed without a decision" });
		});
	});
}

export default function subagentPermissionClient(pi: ExtensionAPI) {
	startParentHeartbeat();

	pi.on("tool_call", async (event, ctx) => {
		const webFetchUrl = getWebFetchUrl(event);
		if (webFetchUrl) {
			const response = await requestPermission({
				kind: "web_fetch",
				url: webFetchUrl,
				cwd: ctx.cwd,
				toolCallId: event.toolCallId,
			});
			if (response.allow) return;
			return {
				block: true,
				reason: response.reason ?? "Blocked by main Pi web_fetch permission bridge",
			};
		}

		const command = getBashCommand(event);
		if (command) {
			const response = await requestPermission({
				kind: "bash",
				command,
				cwd: ctx.cwd,
				toolCallId: event.toolCallId,
			});
			if (response.allow) return;
			return {
				block: true,
				reason: response.reason ?? "Blocked by main Pi bash permission bridge",
			};
		}

		const writeInput = getWriteToolInput(event);
		if (writeInput) {
			const response = await requestPermission({
				kind: "write",
				toolName: writeInput.toolName,
				path: writeInput.path,
				cwd: ctx.cwd,
				toolCallId: event.toolCallId,
			});
			if (response.allow) return;
			return {
				block: true,
				reason: response.reason ?? "Blocked by main Pi write permission bridge",
			};
		}
	});
}
