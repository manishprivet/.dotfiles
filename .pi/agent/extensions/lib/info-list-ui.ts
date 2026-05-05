export { formatDisplayPath } from "./path-shared";

export type NotifyType = "info" | "warning" | "error";

export function showInfoList(
	ctx: { ui: { notify(message: string, type?: NotifyType): void } },
	title: string,
	lines: string[],
): void {
	if (lines.length === 0) {
		ctx.ui.notify(`${title}\n(none)`, "info");
		return;
	}

	ctx.ui.notify(`${title}\n${lines.map((line) => `- ${line}`).join("\n")}`, "info");
}
