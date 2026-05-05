import type { ChildProcessWithoutNullStreams } from "node:child_process";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export type SubagentStatus = "running" | "done" | "error";
export type NotifyLevel = "info" | "success" | "warning" | "error";
export type ToolUpdate = (update: { content: Array<{ type: "text"; text: string }> }) => void;
export type ToolContext = ExtensionContext & { hasUI?: boolean };

export type PermissionRequest = {
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

export type PermissionResponse = {
	allow: boolean;
	reason?: string;
};

export interface SubagentState {
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
