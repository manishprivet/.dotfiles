interface DuckDuckGoTopic {
	Text?: string;
	URL?: string;
	Topics?: DuckDuckGoTopic[];
}

interface DuckDuckGoResponse {
	AbstractText?: string;
	AbstractURL?: string;
	RelatedTopics?: DuckDuckGoTopic[];
	Results?: Array<{
		Text: string;
		URL: string;
	}>;
	Answer?: string;
}

function flattenRelatedTopics(topics: DuckDuckGoTopic[] = []): Array<{ Text: string; URL: string }> {
	const results: Array<{ Text: string; URL: string }> = [];

	for (const topic of topics) {
		if (topic.Text && topic.URL) {
			results.push({ Text: topic.Text, URL: topic.URL });
		}
		if (topic.Topics) {
			results.push(...flattenRelatedTopics(topic.Topics));
		}
	}

	return results;
}

export async function searchDuckDuckGo(query: string, maxResults = 5, signal?: AbortSignal): Promise<string> {
	const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
	const response = await fetch(url, { signal });
	if (!response.ok) {
		throw new Error(`Search failed: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as DuckDuckGoResponse;
	const results: string[] = [];
	const limit = Math.max(1, maxResults);

	if (data.Answer) {
		results.push(`Answer: ${data.Answer}`);
	}

	if (data.AbstractText) {
		results.push(data.AbstractText);
		if (data.AbstractURL) {
			results.push(`Source: ${data.AbstractURL}`);
		}
	}

	const relatedTopics = flattenRelatedTopics(data.RelatedTopics).slice(0, limit);
	if (relatedTopics.length > 0) {
		results.push("\nRelated:");
		for (const topic of relatedTopics) {
			results.push(`- ${topic.Text}: ${topic.URL}`);
		}
	}

	const searchResults = (data.Results ?? []).slice(0, limit);
	if (searchResults.length > 0) {
		results.push("\nResults:");
		for (const result of searchResults) {
			results.push(`- ${result.Text}: ${result.URL}`);
		}
	}

	if (results.length === 0) {
		return "No results found for this query.";
	}

	return results.join("\n");
}
