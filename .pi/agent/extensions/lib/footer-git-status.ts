import { execFileSync } from "node:child_process";
import { basename } from "node:path";
import type { FooterTheme } from "./footer-formatting";

interface GitDiffCounts {
	added: number;
	modified: number;
	deleted: number;
}

interface GitStatusCounts {
	staged: GitDiffCounts;
	unstaged: GitDiffCounts;
}

interface CachedGitStatus {
	at: number;
	value: GitStatusCounts | null;
}

const gitStatusCache = new Map<string, CachedGitStatus>();
const GIT_STATUS_CACHE_TTL_MS = 1500;
const DEVICON_FOLDER = "";
const DEVICON_GIT_STATUS = {
	added: "",
	modified: "",
	deleted: "",
} as const;

function formatFolderName(cwd: string): string {
	const folder = basename(cwd);
	return folder || cwd || "/";
}

function parseGitDiffShortstat(output: string): GitDiffCounts {
	return {
		added: Number(output.match(/(\d+)\s+insertions?\(\+\)/)?.[1] ?? 0),
		modified: Number(output.match(/(\d+)\s+files?\s+changed/)?.[1] ?? 0),
		deleted: Number(output.match(/(\d+)\s+deletions?\(-\)/)?.[1] ?? 0),
	};
}

function getGitDiffShortstat(cwd: string, args: string[]): GitDiffCounts {
	const output = execFileSync("git", ["-C", cwd, "diff", "--shortstat", ...args, "--", "."], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "ignore"],
	});
	return parseGitDiffShortstat(output);
}

function hasDiffCounts(counts: GitDiffCounts): boolean {
	return counts.added > 0 || counts.modified > 0 || counts.deleted > 0;
}

function formatDiffPair(icon: string, color: string, staged: number, unstaged: number, theme: FooterTheme): string {
	if (staged === 0 && unstaged === 0) return "";
	return ` ${theme.fg(color, icon)} ${theme.fg(color, `${staged}`)}${theme.fg("dim", "/")}${theme.fg("dim", `${unstaged}`)}`;
}

function formatDiffCounts(git: GitStatusCounts, theme: FooterTheme): string {
	if (!hasDiffCounts(git.staged) && !hasDiffCounts(git.unstaged)) return "";
	return [
		formatDiffPair(DEVICON_GIT_STATUS.added, "success", git.staged.added, git.unstaged.added, theme),
		formatDiffPair(DEVICON_GIT_STATUS.modified, "warning", git.staged.modified, git.unstaged.modified, theme),
		formatDiffPair(DEVICON_GIT_STATUS.deleted, "error", git.staged.deleted, git.unstaged.deleted, theme),
	].join("");
}

export function getGitStatusCounts(cwd: string): GitStatusCounts | null {
	const cached = gitStatusCache.get(cwd);
	const now = Date.now();
	if (cached && now - cached.at < GIT_STATUS_CACHE_TTL_MS) {
		return cached.value;
	}

	let value: GitStatusCounts | null = null;

	try {
		execFileSync("git", ["-C", cwd, "rev-parse", "--is-inside-work-tree"], {
			encoding: "utf8",
			stdio: ["ignore", "ignore", "ignore"],
		});

		value = {
			staged: getGitDiffShortstat(cwd, ["--cached"]),
			unstaged: getGitDiffShortstat(cwd, []),
		};
	} catch {
		value = null;
	}

	gitStatusCache.set(cwd, { at: now, value });
	return value;
}

export function formatLeftStatus(cwd: string, branch: string | null, theme: FooterTheme): string {
	const folder = `${theme.fg("accent", `${DEVICON_FOLDER} `)}${theme.fg("dim", formatFolderName(cwd))}`;
	const git = getGitStatusCounts(cwd);
	if (!git) return folder;

	const separator = theme.fg("borderMuted", "  ");
	const branchPart = branch ? theme.fg("accent", ` ${branch}`) : "";
	const diffPart = formatDiffCounts(git, theme);
	return [folder, separator, theme.fg("accent", ""), branchPart, diffPart].join("");
}
