import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
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

function shellQuote(value: string): string {
	return `'${value.replace(/'/g, "'\\''")}'`;
}

function vimSingleQuoted(value: string): string {
	return `'${value.replace(/'/g, "''")}'`;
}

export default function editorCommand(pi: ExtensionAPI) {
	pi.registerCommand("editor", {
		description: "Open an empty Neovim file in a tmux popup and load the saved text into Pi's editor",
		handler: async (_args, ctx) => {
			await ctx.waitForIdle();

			if (!ctx.hasUI) return;

			if (!process.env.TMUX) {
				ctx.ui.notify("/editor needs to be run from inside a tmux session.", "error");
				return;
			}

			const tmux = await commandPath(pi, "tmux");
			if (!tmux) {
				ctx.ui.notify("tmux was not found in PATH.", "error");
				return;
			}

			const nvim = await commandPath(pi, "nvim");
			if (!nvim) {
				ctx.ui.notify("nvim was not found in PATH.", "error");
				return;
			}

			const tempDir = await mkdtemp(path.join(os.tmpdir(), "pi-editor-"));
			const editPath = path.join(tempDir, "message.md");
			const savedPath = path.join(tempDir, ".saved");
			await writeFile(editPath, "", "utf8");

			let saveLoaded = false;
			let lastLoadedSaveMtimeMs = 0;
			let loadPromise: Promise<void> | undefined;

			const loadSavedText = async () => {
				if (!loadPromise) {
					loadPromise = (async () => {
						try {
							const savedStat = await stat(savedPath);
							if (savedStat.mtimeMs <= lastLoadedSaveMtimeMs) return;

							const text = await readFile(editPath, "utf8");
							ctx.ui.setEditorText(text);
							saveLoaded = true;
							lastLoadedSaveMtimeMs = savedStat.mtimeMs;
						} catch {
							// The marker file does not exist until Neovim writes the buffer.
						}
					})().finally(() => {
						loadPromise = undefined;
					});
				}

				await loadPromise;
			};

			const pollTimer = setInterval(() => void loadSavedText(), 250);

			try {
				const saveAutocmd = `autocmd BufWritePost <buffer> call writefile(['saved'], ${vimSingleQuoted(savedPath)})`;
				const popupCommand = `${shellQuote(nvim)} -c ${shellQuote(saveAutocmd)} ${shellQuote(editPath)}`;
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
					"pi editor",
				];

				if (process.env.PATH) {
					args.push("-e", `PATH=${process.env.PATH}`);
				}

				args.push(popupCommand);

				const result = await pi.exec(tmux, args);
				if (result.code !== 0) {
					const message = firstLine(result.stderr) || firstLine(result.stdout) || "tmux display-popup failed";
					ctx.ui.notify(message, "error");
					return;
				}

				await loadSavedText();
				if (!saveLoaded) {
					ctx.ui.notify("No save detected; Pi's editor was left unchanged.", "warning");
					return;
				}

				ctx.ui.notify("Saved text loaded into Pi's editor.", "info");
			} finally {
				clearInterval(pollTimer);
				await rm(tempDir, { recursive: true, force: true });
			}
		},
	});
}
