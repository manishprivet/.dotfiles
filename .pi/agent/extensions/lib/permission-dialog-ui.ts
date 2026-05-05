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

	return ctx.ui.custom<T | undefined>((tui, theme, _keybindings, done) => {
			let selectedIndex = 0;
			let cachedWidth: number | undefined;
			let cachedLines: string[] | undefined;

			function clearCache() {
				cachedWidth = undefined;
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
				if (matchesKey(data, Key.up) || data === "k" || data === "h") {
					selectedIndex = Math.max(0, selectedIndex - 1);
					refresh();
					return;
				}

				if (matchesKey(data, Key.down) || data === "j" || data === "l") {
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
				if (cachedLines && cachedWidth === width) return cachedLines;

				const modalWidth = config.maxWidth ? Math.min(Math.max(width, 1), config.maxWidth) : Math.max(width, 1);
				const contentWidth = Math.max(1, modalWidth - 4);
				const borderWidth = Math.max(0, modalWidth - 2);
				const lines: string[] = [];

				const pad = (text: string) => {
					const clipped = truncateToWidth(text, contentWidth);
					return clipped + " ".repeat(Math.max(0, contentWidth - visibleWidth(clipped)));
				};
				const frame = (text = "") => `│ ${pad(text)} │`;
				const addWrapped = (text: string, color: ThemeColor = "text", indent = "") => {
					for (const rawLine of text.split("\n")) {
						const wrapped = wrapTextWithAnsi(
							theme.fg(color, rawLine || " "),
							Math.max(1, contentWidth - visibleWidth(indent)),
						);
						for (const wrappedLine of wrapped) lines.push(frame(indent + wrappedLine));
					}
				};

				lines.push(theme.fg("borderAccent", `╭${"─".repeat(borderWidth)}╮`));
				lines.push(frame(theme.fg("warning", config.title)));
				if (config.subtitle) lines.push(frame(theme.fg("dim", config.subtitle.replace(/:$/, ""))));
				lines.push(frame());
				for (const contextLine of config.contextLines ?? [`cwd: ${ctx.cwd}`]) {
					lines.push(frame(theme.fg("muted", contextLine)));
				}
				lines.push(frame(theme.fg("toolTitle", config.bodyLabel)));
				addWrapped(config.body, "toolOutput", "  ");
				lines.push(frame());

				const optionParts = config.options.map((option, i) => {
					const selected = i === selectedIndex;
					const color = option.color ?? "accent";
					const paddedLabel = ` ${option.label} `;
					return selected
						? `${fgAnsiToBgAnsi(theme.getFgAnsi(color))}${blackText(paddedLabel)}\x1b[49m`
						: theme.fg(color, paddedLabel);
				});
				lines.push(frame(optionParts.join("  ")));

				for (const option of config.options) {
					if (option.description) lines.push(frame(`     ${theme.fg("muted", option.description)}`));
				}

				// lines.push(frame());
				// lines.push(frame(theme.fg("dim", "↑↓/h/j/k/l navigate • Enter select • Esc cancel")));
				lines.push(theme.fg("borderAccent", `╰${"─".repeat(borderWidth)}╯`));

				cachedWidth = width;
				cachedLines = lines.map((line) => truncateToWidth(line, width));
				return cachedLines;
			}

			return {
				handleInput,
				render,
				invalidate: clearCache,
			};
		});
}
