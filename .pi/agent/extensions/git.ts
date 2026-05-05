import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const POPUP_WIDTH = "90%";
const POPUP_HEIGHT = "90%";

function firstLine(value: string): string {
	return value.trim().split(/\r?\n/, 1)[0] ?? "";
}

async function commandPath(pi: ExtensionAPI, command: string): Promise<string> {
	const result = await pi.exec("sh", ["-lc", `command -v ${command}`], { timeout: 2000 });
	if (result.code !== 0) return "";
	return firstLine(result.stdout);
}

export default function gitCommand(pi: ExtensionAPI) {
	pi.registerCommand("git", {
		description: "Open lazygit in a tmux popup",
		handler: async (_args, ctx) => {
			if (!process.env.TMUX) {
				ctx.ui.notify("/git needs to be run from inside a tmux session.", "error");
				return;
			}

			const tmux = await commandPath(pi, "tmux");
			if (!tmux) {
				ctx.ui.notify("tmux was not found in PATH.", "error");
				return;
			}

			const lazygit = await commandPath(pi, "lazygit");
			if (!lazygit) {
				ctx.ui.notify("lazygit was not found in PATH.", "error");
				return;
			}

			const args = [
				"display-popup",
				"-E",
				"-w",
				POPUP_WIDTH,
				"-h",
				POPUP_HEIGHT,
				"-d",
				ctx.cwd,
				"-T",
				"lazygit",
			];

			if (process.env.PATH) {
				args.push("-e", `PATH=${process.env.PATH}`);
			}

			args.push(lazygit);

			const result = await pi.exec(tmux, args);
			if (result.code !== 0) {
				const message = firstLine(result.stderr) || firstLine(result.stdout) || "tmux display-popup failed";
				ctx.ui.notify(message, "error");
			}
		},
	});
}
