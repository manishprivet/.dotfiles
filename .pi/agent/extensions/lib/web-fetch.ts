import { stripHtml } from "./html-to-text";

export type WebFetchResult = {
	text: string;
	contentType: string;
	truncated: boolean;
};

export async function fetchWebPage(url: string, maxLength = 50000, signal?: AbortSignal): Promise<WebFetchResult> {
	const response = await fetch(url, {
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

	if (contentType.includes("text/html")) {
		text = stripHtml(text);
	}

	let truncated = false;
	if (text.length > maxLength) {
		text = text.slice(0, maxLength);
		truncated = true;
	}

	let result = text.trim();
	if (truncated) {
		result += "\n\n[Content truncated due to length]";
	}

	return { text: result, contentType, truncated };
}
