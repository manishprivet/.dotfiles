import type { AssistantMessage } from "@mariozechner/pi-ai";

export type UsageTotals = {
	tokens: number;
	cost: number;
};

export function getAssistantUsageTotals(branch: Array<{ type?: string; message?: unknown }>): UsageTotals {
	let tokens = 0;
	let cost = 0;

	for (const entry of branch) {
		const message = entry.message as AssistantMessage | undefined;
		if (entry.type !== "message" || message?.role !== "assistant") continue;

		tokens +=
			(message.usage.input ?? 0) +
			(message.usage.output ?? 0) +
			(message.usage.cacheRead ?? 0) +
			(message.usage.cacheWrite ?? 0);
		cost += message.usage.cost.total ?? 0;
	}

	return { tokens, cost };
}
