export type BashToolCallInput = {
	command: string;
};

export type WriteToolInput = {
	toolName: "write" | "edit";
	path: string;
};

type ToolCallLike = {
	toolName?: string;
	input?: unknown;
};

function asToolCallLike(event: unknown): ToolCallLike {
	return event as ToolCallLike;
}

export function getBashCommand(event: unknown): string | null {
	const toolCall = asToolCallLike(event);
	const command = (toolCall.input as BashToolCallInput | undefined)?.command;
	return toolCall.toolName === "bash" && typeof command === "string" ? command : null;
}

export function getWriteToolInput(event: unknown): WriteToolInput | null {
	const toolCall = asToolCallLike(event);
	if (toolCall.toolName !== "write" && toolCall.toolName !== "edit") return null;

	const inputPath = (toolCall.input as { path?: unknown } | undefined)?.path;
	if (typeof inputPath !== "string") return null;

	return { toolName: toolCall.toolName, path: inputPath };
}
