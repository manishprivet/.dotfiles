/**
 * Web Search Extension
 *
 * Provides a web_search tool that allows the agent to search the web.
 * Uses DuckDuckGo instant answer API by default.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";

interface SearchResult {
	Title: string;
	URL: string;
	Body: string;
}

interface DuckDuckGoResponse {
	AbstractText?: string;
	AbstractURL?: string;
	RelatedTopics?: Array<{
		Text: string;
		URL: string;
	}>;
	Results?: Array<{
		Text: string;
		URL: string;
	}>;
	Answer?: string;
}

async function searchDuckDuckGo(query: string): Promise<string> {
	const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Search failed: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as DuckDuckGoResponse;

	// Build result text
	const results: string[] = [];

	// First priority: direct answer
	if (data.Answer) {
		results.push(`Answer: ${data.Answer}`);
	}

	// Second priority: abstract
	if (data.AbstractText) {
		results.push(data.AbstractText);
		if (data.AbstractURL) {
			results.push(`Source: ${data.AbstractURL}`);
		}
	}

	// Third priority: related topics
	if (data.RelatedTopics && data.RelatedTopics.length > 0) {
		results.push("\nRelated:");
		for (const topic of data.RelatedTopics.slice(0, 5)) {
			results.push(`- ${topic.Text}: ${topic.URL}`);
		}
	}

	// Fourth priority: search results
	if (data.Results && data.Results.length > 0) {
		results.push("\nResults:");
		for (const result of data.Results.slice(0, 5)) {
			results.push(`- ${result.Text}: ${result.URL}`);
		}
	}

	if (results.length === 0) {
		return "No results found for this query.";
	}

	return results.join("\n");
}

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
		_signal: AbortSignal | undefined,
		_onUpdate: ((update: { content: Array<{ type: string; text: string }> }) => void) | undefined,
		_ctx: any,
	) {
		const maxResults = params.max_results ?? 5;

		// Notify we're searching
		_onUpdate?.({
			content: [{ type: "text", text: `Searching for: ${params.query}...` }],
		});

		try {
			const results = await searchDuckDuckGo(params.query);

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

// Web Fetch Tool - Fetch content from a URL
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
		_onUpdate: ((update: { content: Array<{ type: string; text: string }> }) => void) | undefined,
		_ctx: any,
	) {
		const maxLength = params.max_length ?? 50000;

		_onUpdate?.({
			content: [{ type: "text", text: `Fetching: ${params.url}...` }],
		});

		try {
			const response = await fetch(params.url, {
				signal,
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; pi-web-fetch/1.0)",
					"Accept": "text/html,application/xhtml+xml,text/plain,*/*",
				},
			});

			if (!response.ok) {
				throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
			}

			const contentType = response.headers.get("content-type") || "";
			let text = await response.text();

			// Handle HTML: strip tags and extract text
			if (contentType.includes("text/html")) {
				text = stripHtml(text);
			}

			// Truncate if needed
			let truncated = false;
			if (text.length > maxLength) {
				text = text.slice(0, maxLength);
				truncated = true;
			}

			let result = text.trim();
			if (truncated) {
				result += "\n\n[Content truncated due to length]";
			}

			return {
				content: [{ type: "text", text: result }],
				details: {
					url: params.url,
					contentType,
					fetchedAt: new Date().toISOString(),
				},
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new Error(`Fetch failed: ${message}`);
		}
	},
};

// Helper: Strip HTML tags and clean up text
function stripHtml(html: string): string {
	// Remove script and style elements
	let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
	text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

	// Replace common block elements with newlines
	text = text.replace(/<\/p>/gi, "\n\n");
	text = text.replace(/<br\s*\/?>/gi, "\n");
	text = text.replace(/<\/div>/gi, "\n");
	text = text.replace(/<\/li>/gi, "\n");
	text = text.replace(/<\/h[1-6]>/gi, "\n\n");

	// Remove all remaining HTML tags
	text = text.replace(/<[^>]+>/g, "");

	// Decode common HTML entities
	text = text
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'");

	// Clean up whitespace
	text = text.replace(/\n\s*\n\s*\n/g, "\n\n");

	return text;
}

export default function (pi: ExtensionAPI) {
	pi.registerTool(webSearchTool);
	pi.registerTool(webFetchTool);

	// Optional: register a command to test search directly
	pi.registerCommand("search", {
		description: "Perform a web search and display results",
		handler: async (args, ctx) => {
			if (!args.trim()) {
				ctx.ui.notify("Usage: /search <query>", "warning");
				return;
			}

			ctx.ui.setStatus("search", "Searching...");
			try {
				const results = await searchDuckDuckGo(args);
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