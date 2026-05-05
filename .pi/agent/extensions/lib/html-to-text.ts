export function stripHtml(html: string): string {
	let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
	text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

	text = text.replace(/<\/p>/gi, "\n\n");
	text = text.replace(/<br\s*\/?>/gi, "\n");
	text = text.replace(/<\/div>/gi, "\n");
	text = text.replace(/<\/li>/gi, "\n");
	text = text.replace(/<\/h[1-6]>/gi, "\n\n");

	text = text.replace(/<[^>]+>/g, "");

	text = text
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'");

	return text.replace(/\n\s*\n\s*\n/g, "\n\n");
}
