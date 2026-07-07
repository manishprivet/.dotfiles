import type { ExtensionContext, ThemeColor } from "@mariozechner/pi-coding-agent";
import { Key, matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@mariozechner/pi-tui";

export type PermissionDialogOption<T extends string> = {
	value: T;
	label: string;
	description?: string;
	color?: ThemeColor;
};

export type PermissionDialogConfig<T extends string> = {
	title: string;
	subtitle?: string;
	contextLines?: string[];
	bodyLabel: string;
	body: string;
	options: PermissionDialogOption<T>[];
	maxWidth?: number;
};

function blackText(text: string): string {
	return `\x1b[38;2;0;0;0m${text}\x1b[39m`;
}

function fgAnsiToBgAnsi(ansi: string): string {
	return ansi
		.replace(/\x1b\[38;/g, "\x1b[48;")
		.replace(/\x1b\[3([0-7])m/g, "\x1b[4$1m")
		.replace(/\x1b\[9([0-7])m/g, "\x1b[10$1m");
}

export async function showPermissionDialog<T extends string>(
	ctx: Pick<ExtensionContext, "cwd" | "ui">,
	config: PermissionDialogConfig<T>,
): Promise<T | undefined> {
	if (config.options.length === 0) return undefined;

	return ctx.ui.custom<T | undefined>(
		(tui, theme, _keybindings, done) => {
			let selectedIndex = 0;
			let cachedWidth: number | undefined;
			let cachedHeight: number | undefined;
			let cachedLines: string[] | undefined;

			function clearCache() {
				cachedWidth = undefined;
				cachedHeight = undefined;
				cachedLines = undefined;
			}

			function refresh() {
				clearCache();
				tui.requestRender();
			}

			function choose(index: number) {
				done(config.options[index]?.value);
			}

			function handleInput(data: string) {
				const previous =
					matchesKey(data, Key.up) ||
					matchesKey(data, Key.left) ||
					data === "\x1b[A" ||
					data === "\x1b[D" ||
					data === "k" ||
					data === "h";
				const next =
					matchesKey(data, Key.down) ||
					matchesKey(data, Key.right) ||
					data === "\x1b[B" ||
					data === "\x1b[C" ||
					data === "j" ||
					data === "l";

				if (previous) {
					selectedIndex = Math.max(0, selectedIndex - 1);
					refresh();
					return;
				}

				if (next) {
					selectedIndex = Math.min(config.options.length - 1, selectedIndex + 1);
					refresh();
					return;
				}

				if (matchesKey(data, Key.enter)) {
					choose(selectedIndex);
					return;
				}

				if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"))) {
					done(undefined);
				}
			}

			function render(width: number): string[] {
				const terminalRows = Math.max(1, tui.terminal.rows || 24);
				// The overlay is rendered with a margin of 1, so keep the dialog within the visible viewport.
				const maxModalHeight = Math.max(1, terminalRows - 2);
				if (cachedLines && cachedWidth === width && cachedHeight === maxModalHeight) return cachedLines;

				const modalWidth = config.maxWidth ? Math.min(Math.max(width, 1), config.maxWidth) : Math.max(width, 1);
				const contentWidth = Math.max(1, modalWidth - 4);
				const borderWidth = Math.max(0, modalWidth - 2);

				const pad = (text: string) => {
					const clipped = truncateToWidth(text, contentWidth);
					return clipped + " ".repeat(Math.max(0, contentWidth - visibleWidth(clipped)));
				};
				const frame = (text = "") => `│ ${pad(text)} │`;
				const wrapFramed = (text: string, color: ThemeColor = "text", indent = "") => {
					const wrappedLines: string[] = [];
					for (const rawLine of text.split("\n")) {
						const wrapped = wrapTextWithAnsi(
							theme.fg(color, rawLine || " "),
							Math.max(1, contentWidth - visibleWidth(indent)),
						);
						for (const wrappedLine of wrapped) wrappedLines.push(frame(indent + wrappedLine));
					}
					return wrappedLines;
				};
				const fitFramedLines = (source: string[], maxLines: number) => {
					if (maxLines <= 0) return [];
					if (source.length <= maxLines) return source;
					const kept = Math.max(0, maxLines - 1);
					const omitted = source.length - kept;
					return [
						...source.slice(0, kept),
						frame(theme.fg("dim", `… ${omitted} more line${omitted === 1 ? "" : "s"} omitted`)),
					];
				};

				const headerLines: string[] = [];
				headerLines.push(theme.fg("borderAccent", `╭${"─".repeat(borderWidth)}╮`));
				headerLines.push(frame(theme.fg("warning", config.title)));
				if (config.subtitle) headerLines.push(frame(theme.fg("dim", config.subtitle.replace(/:$/, ""))));
				headerLines.push(frame());
				for (const contextLine of config.contextLines ?? [`cwd: ${ctx.cwd}`]) {
					headerLines.push(frame(theme.fg("muted", contextLine)));
				}
				headerLines.push(frame(theme.fg("toolTitle", config.bodyLabel)));

				const bodyLines = wrapFramed(config.body, "toolOutput", "  ");

				const optionParts = config.options.map((option, i) => {
					const selected = i === selectedIndex;
					const color = option.color ?? "accent";
					const paddedLabel = ` ${option.label} `;
					return selected
						? `${fgAnsiToBgAnsi(theme.getFgAnsi(color))}${blackText(paddedLabel)}\x1b[49m`
						: theme.fg(color, paddedLabel);
				});
				const actionLines = [frame(), frame(optionParts.join("  "))];

				const descriptionLines: string[] = [];
				for (const option of config.options) {
					if (option.description) descriptionLines.push(frame(`     ${theme.fg("muted", option.description)}`));
				}

				// lines.push(frame());
				// lines.push(frame(theme.fg("dim", "←→/↑↓/h/j/k/l navigate • Enter select • Esc cancel")));
				const footerLines = [theme.fg("borderAccent", `╰${"─".repeat(borderWidth)}╯`)];

				const fixedHeight = headerLines.length + actionLines.length + footerLines.length;
				let remaining = Math.max(0, maxModalHeight - fixedHeight);
				const reservedDescriptionLines = Math.min(
					descriptionLines.length,
					Math.max(0, Math.min(3, remaining - (bodyLines.length > 0 ? 1 : 0))),
				);
				const fittedBodyLines = fitFramedLines(bodyLines, Math.max(0, remaining - reservedDescriptionLines));
				remaining -= fittedBodyLines.length;
				const fittedDescriptionLines = fitFramedLines(descriptionLines, remaining);

				let lines = [...headerLines, ...fittedBodyLines, ...actionLines, ...fittedDescriptionLines, ...footerLines];
				if (lines.length > maxModalHeight) {
					lines =
						maxModalHeight === 1
							? [footerLines[0] ?? ""]
							: [...lines.slice(0, maxModalHeight - 1), footerLines[0] ?? ""];
				}

				cachedWidth = width;
				cachedHeight = maxModalHeight;
				cachedLines = lines.map((line) => truncateToWidth(line, width));
				return cachedLines;
			}

			return {
				handleInput,
				render,
				invalidate: clearCache,
			};
		},
		{
			overlay: true,
			overlayOptions: {
				anchor: "bottom-center",
				width: "100%",
				margin: 1,
			},
		},
	);
}
