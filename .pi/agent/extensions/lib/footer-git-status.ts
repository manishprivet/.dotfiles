import { execFile } from "node:child_process";
import { basename } from "node:path";
import type { FooterTheme } from "./footer-formatting";

interface GitStatusIndicator {
	staged: boolean;
	unstaged: boolean;
	truncated: boolean;
}

interface CachedGitStatus {
	at: number;
	value: GitStatusIndicator | null | undefined;
	pending?: Promise<void>;
}

const gitStatusCache = new Map<string, CachedGitStatus>();
const GIT_STATUS_CACHE_TTL_MS = 10_000;
const GIT_STATUS_MAX_BUFFER = 256 * 1024;
const DEVICON_FOLDER = "";
const DEVICON_GIT_STATUS = {
	staged: "●",
	unstaged: "✚",
	truncated: "…",
} as const;

function formatFolderName(cwd: string): string {
	const folder = basename(cwd);
	return folder || cwd || "/";
}

function execGitStatus(cwd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile(
			"git",
			["-C", cwd, "status", "--porcelain=v1", "--untracked-files=no", "--", "."],
			{
				encoding: "utf8",
				maxBuffer: GIT_STATUS_MAX_BUFFER,
				timeout: 5000,
			},
			(error, stdout) => {
				if (error) {
					const partialStdout = typeof stdout === "string" ? stdout : "";
					if (partialStdout) {
						resolve(partialStdout);
						return;
					}
					reject(error);
					return;
				}

				resolve(stdout);
			},
		);
	});
}

function parseGitStatus(output: string): GitStatusIndicator {
	let staged = false;
	let unstaged = false;

	for (const line of output.split("\n")) {
		if (!line) continue;

		const indexStatus = line[0] ?? " ";
		const worktreeStatus = line[1] ?? " ";
		if (indexStatus !== " " && indexStatus !== "?") staged = true;
		if (worktreeStatus !== " ") unstaged = true;
		if (staged && unstaged) break;
	}

	return {
		staged,
		unstaged,
		truncated: output.length >= GIT_STATUS_MAX_BUFFER - 1,
	};
}

async function refreshGitStatus(cwd: string, onUpdate?: () => void): Promise<void> {
	let value: GitStatusIndicator | null = null;

	try {
		value = parseGitStatus(await execGitStatus(cwd));
	} catch {
		value = null;
	}

	gitStatusCache.set(cwd, { at: Date.now(), value });
	try {
		onUpdate?.();
	} catch {
		// Rendering callbacks should not make cache refresh fail.
	}
}

export function getGitStatusIndicator(cwd: string, onUpdate?: () => void): GitStatusIndicator | null | undefined {
	const cached = gitStatusCache.get(cwd);
	const now = Date.now();
	if (cached && now - cached.at < GIT_STATUS_CACHE_TTL_MS) {
		return cached.value;
	}

	if (!cached?.pending) {
		const pending = refreshGitStatus(cwd, onUpdate);
		gitStatusCache.set(cwd, { at: cached?.at ?? 0, value: cached?.value, pending });
	}

	return cached?.value;
}

function formatGitIndicator(git: GitStatusIndicator, theme: FooterTheme): string {
	if (!git.staged && !git.unstaged && !git.truncated) return theme.fg("success", " clean");

	return [
		git.staged ? theme.fg("warning", ` ${DEVICON_GIT_STATUS.staged} staged`) : "",
		git.unstaged ? theme.fg("accent", ` ${DEVICON_GIT_STATUS.unstaged} dirty`) : "",
		git.truncated ? theme.fg("muted", ` ${DEVICON_GIT_STATUS.truncated}`) : "",
	].join("");
}

export function formatLeftStatus(cwd: string, branch: string | null, theme: FooterTheme, onUpdate?: () => void): string {
	const folder = `${theme.fg("accent", `${DEVICON_FOLDER} `)}${theme.fg("dim", formatFolderName(cwd))}`;
	const git = getGitStatusIndicator(cwd, onUpdate);
	if (git === null) return folder;

	const separator = theme.fg("borderMuted", "  ");
	const branchPart = branch ? theme.fg("accent", ` ${branch}`) : "";
	const statusPart = git === undefined ? theme.fg("muted", " …") : formatGitIndicator(git, theme);
	return [folder, separator, theme.fg("accent", ""), branchPart, statusPart].join("");
}
