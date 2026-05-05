import * as net from "node:net";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getBashCommand, getWriteToolInput } from "./tool-call-shared";

type PermissionRequest = {
	kind: "bash" | "write";
	command?: string;
	toolName?: "write" | "edit";
	path?: string;
	cwd: string;
	toolCallId: string;
};

type PermissionResponse = {
	allow: boolean;
	reason?: string;
};

const REQUEST_TIMEOUT_MS = 10 * 60 * 1000;

function requestPermission(request: PermissionRequest): Promise<PermissionResponse> {
	const socketPath = process.env.PI_SUBAGENT_PERMISSION_SOCKET;
	const token = process.env.PI_SUBAGENT_PERMISSION_TOKEN;
	const subagentId = process.env.PI_SUBAGENT_ID;
	const task = process.env.PI_SUBAGENT_TASK;

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
	pi.on("tool_call", async (event, ctx) => {
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
