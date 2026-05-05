import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { NotifyLevel, SubagentState, ToolContext } from "./subagent-types";

export type SubagentPopupMode = "fork" | "attach";

const TOOL_ARGUMENT_LIMIT = 1_200;
const TOOL_OUTPUT_LIMIT = 2_000;

type MessagePart = {
	type?: string;
	text?: string;
	thinking?: string;
	name?: string;
	arguments?: unknown;
};

type SessionMessage = {
	role?: string;
	content?: MessagePart[];
	toolName?: string;
	isError?: boolean;
};

function notify(ctx: ToolContext, message: string, level: NotifyLevel): void {
	if (ctx.hasUI === false) return;
	ctx.ui.notify(message, level);
}

function shellQuote(value: string): string {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}

function codeFence(text: string, language = ""): string {
	const ticks = text.match(/`+/g)?.reduce((max, run) => Math.max(max, run.length), 3) ?? 3;
	const fence = "`".repeat(ticks + 1);
	return `${fence}${language}\n${text}\n${fence}`;
}

function truncateText(text: string, limit: number): string {
	if (text.length <= limit) return text;
	return `${text.slice(0, limit)}\n\n… [truncated ${text.length - limit} chars]`;
}

function stringifyArguments(args: unknown): string {
	if (args === undefined) return "";
	if (typeof args === "string") return args;
	try {
		return JSON.stringify(args, null, 2);
	} catch {
		return String(args);
	}
}

function summarizeToolCall(part: MessagePart): string {
	const args = part.arguments as { command?: unknown; path?: unknown } | undefined;
	if (part.name === "bash" && typeof args?.command === "string") {
		return truncateText(args.command, TOOL_ARGUMENT_LIMIT);
	}
	if ((part.name === "read" || part.name === "write" || part.name === "edit") && typeof args?.path === "string") {
		return args.path;
	}
	return truncateText(stringifyArguments(part.arguments), TOOL_ARGUMENT_LIMIT);
}

function textFromParts(parts: MessagePart[] | undefined): string {
	if (!Array.isArray(parts)) return "";
	return parts
		.filter((part) => part.type === "text" && typeof part.text === "string")
		.map((part) => part.text)
		.join("\n\n");
}

function renderMessage(message: SessionMessage): string[] {
	const lines: string[] = [];
	const role = message.role ?? "unknown";
	const heading = role === "user"
		? "## User"
		: role === "assistant"
			? "## Assistant"
			: role === "toolResult"
				? `## Tool Result${message.toolName ? `: ${message.toolName}` : ""}${message.isError ? " (error)" : ""}`
				: `## ${role}`;

	lines.push(heading, "");

	if (role === "toolResult") {
		const output = textFromParts(message.content).trimEnd();
		lines.push(output ? codeFence(truncateText(output, TOOL_OUTPUT_LIMIT), "text") : "_(no output)_", "");
		return lines;
	}

	for (const part of message.content ?? []) {
		if (part.type === "text" && typeof part.text === "string") {
			lines.push(part.text, "");
		} else if (part.type === "thinking") {
			// Match Pi's default compact transcript view: omit reasoning content.
			continue;
		} else if (part.type === "toolCall") {
			lines.push(`### Tool Call: ${part.name ?? "tool"}`, "");
			const summary = summarizeToolCall(part);
			lines.push(summary ? codeFence(summary, part.name === "bash" ? "bash" : "text") : "_(no arguments)_", "");
		}
	}

	if (lines.length === 2) lines.push("_(empty)_", "");
	return lines;
}

function renderSessionMarkdown(state: SubagentState): string {
	const lines = [
		`# Subagent #${state.id}`,
		"",
		`- **Status:** ${state.status}`,
		`- **Turns:** ${state.turnCount}`,
		`- **Tools:** ${state.toolCount}`,
		`- **Session:** \`${state.sessionFile}\``,
		`- **Task:** ${state.task}`,
		"",
		"---",
		"",
	];

	for (const rawLine of fs.readFileSync(state.sessionFile, "utf-8").split("\n")) {
		if (!rawLine.trim()) continue;
		try {
			const entry = JSON.parse(rawLine) as { type?: string; message?: SessionMessage };
			if (entry.type === "message" && entry.message) {
				lines.push(...renderMessage(entry.message));
			}
		} catch {
			// Ignore malformed lines in the transcript viewer.
		}
	}

	return lines.join("\n");
}

function writeTranscriptMarkdown(state: SubagentState): { dir: string; filePath: string } {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), `pi-subagent-${state.id}-`));
	const filePath = path.join(dir, `subagent-${state.id}.md`);
	fs.writeFileSync(filePath, renderSessionMarkdown(state), "utf-8");
	return { dir, filePath };
}

function writeNvimTranscriptLauncher(dir: string, transcriptPath: string): string {
	const scriptPath = path.join(dir, "open-transcript.sh");
	fs.writeFileSync(scriptPath, `#!/bin/sh
set -eu
file=${shellQuote(transcriptPath)}
if [ ! -s "$file" ]; then
  clear
  echo "Subagent transcript is empty or missing: $file"
  ls -l "$file" 2>/dev/null || true
  echo
  echo "Press enter to close."
  read _
  exit 1
fi
exec nvim -R -n "$file" \
  -c 'setlocal filetype=markdown nonumber norelativenumber signcolumn=no nofoldenable conceallevel=0 readonly nomodifiable' \
  -c 'normal! G'
`, { mode: 0o700 });
	return scriptPath;
}

function openTmuxPopup(command: string, title: string, ctx: ToolContext): void {
	if (!process.env.TMUX) {
		notify(ctx, "Not inside tmux; cannot open a floating pane.", "error");
		return;
	}

	const proc = spawn("tmux", [
		"display-popup",
		"-E",
		"-d", ctx.cwd,
		"-w", "90%",
		"-h", "85%",
		"-T", title,
		command,
	], {
		stdio: "ignore",
		detached: true,
	});
	proc.unref();
	proc.on("error", (error) => {
		notify(ctx, `Failed to open tmux popup: ${error.message}`, "error");
	});
}

function buildReadonlySubagentCommand(sessionFile: string, mode: SubagentPopupMode): string {
	return [
		"pi",
		mode === "fork" ? "--fork" : "--session", sessionFile,
		"--no-extensions",
		"--tools", "read,grep,find,ls",
		"--thinking", "low",
	]
		.map(shellQuote)
		.join(" ");
}

export function openSubagentTranscriptPopup(state: SubagentState, ctx: ToolContext): void {
	let transcriptPath: string;
	let launcherPath: string;
	try {
		const transcript = writeTranscriptMarkdown(state);
		transcriptPath = transcript.filePath;
		launcherPath = writeNvimTranscriptLauncher(transcript.dir, transcriptPath);
	} catch (error) {
		notify(ctx, `Failed to render subagent transcript: ${error instanceof Error ? error.message : String(error)}`, "error");
		return;
	}

	openTmuxPopup(shellQuote(launcherPath), `Subagent #${state.id} transcript`, ctx);
	notify(ctx, `Opened subagent #${state.id} transcript in nvim -R: ${transcriptPath}`, "info");
}

export function openReadonlySubagentPopup(state: SubagentState, ctx: ToolContext, mode: SubagentPopupMode): void {
	const command = buildReadonlySubagentCommand(state.sessionFile, mode);
	const title = `Subagent #${state.id} ${mode === "fork" ? "readonly fork" : "readonly attach"}`;
	openTmuxPopup(command, title, ctx);
	notify(
		ctx,
		mode === "fork"
			? `Opened subagent #${state.id} in a read-only tmux popup fork.`
			: `Attached to subagent #${state.id} in a read-only tmux popup.`,
		"info",
	);
}
