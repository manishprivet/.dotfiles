import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

export interface FooterTheme {
	fg: (color: string, text: string) => string;
}

export interface ContextUsage {
	tokens: number;
	contextWindow: number;
	percent: number | null;
}

export function usageColor(percent: number | null | undefined): string {
	if (percent == null) return "muted";
	if (percent >= 90) return "error";
	if (percent >= 75) return "warning";
	return "accent";
}

export function formatCount(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
	if (value >= 10_000) return `${Math.round(value / 1_000)}k`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
	return `${Math.round(value)}`;
}

export function buildProgressBar(width: number, percent: number, theme: FooterTheme): string {
	if (width <= 0) return "";
	const safePercent = Math.max(0, Math.min(100, percent));
	const filled = Math.round((safePercent / 100) * width);
	const empty = Math.max(0, width - filled);
	const color = usageColor(safePercent);
	return `${theme.fg(color, "█".repeat(filled))}${theme.fg("borderMuted", "░".repeat(empty))}`;
}

export function renderCenteredProgressBar(maxWidth: number, usage: ContextUsage | undefined, theme: FooterTheme): string {
	if (maxWidth <= 0) return "";
	const percent = usage?.percent ?? 0;
	return buildProgressBar(maxWidth, percent, theme);
}

export function joinStyled(parts: string[], separator: string): string {
	return parts.filter(Boolean).join(separator);
}

export function padToWidth(text: string, width: number): string {
	return `${text}${" ".repeat(Math.max(0, width - visibleWidth(text)))}`;
}

export function renderFooterLine(width: number, left: string, middle: string, right: string): string {
	if (width <= 0) return "";
	if (width < 24) return padToWidth(truncateToWidth(middle, width), width);

	const fittedMiddle = truncateToWidth(middle, width);
	const middleWidth = visibleWidth(fittedMiddle);
	if (middleWidth <= 0) return " ".repeat(width);

	const middleStart = Math.max(0, Math.floor((width - middleWidth) / 2));
	const middleEnd = middleStart + middleWidth;

	const leftMaxWidth = Math.max(0, middleStart - 1);
	const rightMaxWidth = Math.max(0, width - middleEnd - 1);
	const fittedLeft = truncateToWidth(left, leftMaxWidth);
	const fittedRight = truncateToWidth(right, rightMaxWidth);

	const leftWidth = visibleWidth(fittedLeft);
	const rightWidth = visibleWidth(fittedRight);
	const leftPad = Math.max(0, middleStart - leftWidth);
	const rightPad = Math.max(0, width - middleEnd - rightWidth);

	const line = `${fittedLeft}${" ".repeat(leftPad)}${fittedMiddle}${" ".repeat(rightPad)}${fittedRight}`;
	return padToWidth(truncateToWidth(line, width), width);
}
