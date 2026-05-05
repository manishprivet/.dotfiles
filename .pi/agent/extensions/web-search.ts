import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";
import { searchDuckDuckGo } from "./lib/duckduckgo-search";
import { fetchWebPage } from "./lib/web-fetch";

type ToolUpdate = (update: { content: Array<{ type: string; text: string }> }) => void;

const webSearchTool = {
	name: "web_search",
	label: "Web Search",
	description: "Search the web using DuckDuckGo. Returns summarized results with sources.",
	promptSnippet: "Search the web for current information, definitions, or facts",
	promptGuidelines: [
		"Use web_search when the user asks for current events, recent information, or factual queries that require live data",
		"Use web_search when you need to verify information or find up-to-date details",
	],
	parameters: Type.Object({
		query: Type.String({ description: "Search query" }),
		max_results: Type.Optional(
			Type.Number({ description: "Maximum number of results to return (default: 5)" }),
		),
	}),
	async execute(
		_toolCallId: string,
		params: { query: string; max_results?: number },
		signal: AbortSignal | undefined,
		onUpdate: ToolUpdate | undefined,
		_ctx: unknown,
	) {
		const maxResults = params.max_results ?? 5;
		onUpdate?.({
			content: [{ type: "text", text: `Searching for: ${params.query}...` }],
		});

		try {
			const results = await searchDuckDuckGo(params.query, maxResults, signal);

			return {
				content: [{ type: "text", text: results }],
				details: {
					query: params.query,
					maxResults,
					searchedAt: new Date().toISOString(),
				},
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new Error(`Search failed: ${message}`);
		}
	},
};

const webFetchTool = {
	name: "web_fetch",
	label: "Web Fetch",
	description: "Fetch the content of a web page by URL. Returns text content up to 50KB.",
	promptSnippet: "Fetch and read web page content from a URL",
	promptGuidelines: [
		"Use web_fetch when the user provides a specific URL to read",
		"Use web_fetch to get detailed content from a web page that was mentioned or linked",
	],
	parameters: Type.Object({
		url: Type.String({ description: "URL to fetch" }),
		max_length: Type.Optional(
			Type.Number({ description: "Maximum characters to return (default: 50000)" }),
		),
	}),
	async execute(
		_toolCallId: string,
		params: { url: string; max_length?: number },
		signal: AbortSignal | undefined,
		onUpdate: ToolUpdate | undefined,
		_ctx: unknown,
	) {
		const maxLength = params.max_length ?? 50000;
		onUpdate?.({
			content: [{ type: "text", text: `Fetching: ${params.url}...` }],
		});

		try {
			const result = await fetchWebPage(params.url, maxLength, signal);

			return {
				content: [{ type: "text", text: result.text }],
				details: {
					url: params.url,
					contentType: result.contentType,
					truncated: result.truncated,
					fetchedAt: new Date().toISOString(),
				},
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new Error(`Fetch failed: ${message}`);
		}
	},
};

export default function webSearchExtension(pi: ExtensionAPI) {
	pi.registerTool(webSearchTool);
	pi.registerTool(webFetchTool);

	pi.registerCommand("search", {
		description: "Perform a web search and display results",
		handler: async (args, ctx) => {
			const query = args.trim();
			if (!query) {
				ctx.ui.notify("Usage: /search <query>", "warning");
				return;
			}

			ctx.ui.setStatus("search", "Searching...");
			try {
				const results = await searchDuckDuckGo(query);
				ctx.ui.notify(`Results:\n${results}`, "info");
			} catch (error) {
				const message = error instanceof Error ? error.message : "Unknown error";
				ctx.ui.notify(`Search failed: ${message}`, "error");
			} finally {
				ctx.ui.setStatus("search", undefined);
			}
		},
	});
}
