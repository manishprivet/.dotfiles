import {
	getAgentDir,
	loadProjectContextFiles,
	type SlashCommandInfo,
	type Theme,
} from "@mariozechner/pi-coding-agent";
import { countExtensions } from "./extension-discovery";

export type HeaderCounts = {
	contextFiles: number;
	prompts: number;
	skills: number;
	extensions: number;
};

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
	return `${count} ${count === 1 ? singular : plural}`;
}

export async function getHeaderCounts(cwd: string, commands: SlashCommandInfo[]): Promise<HeaderCounts> {
	const agentDir = getAgentDir();
	return {
		contextFiles: loadProjectContextFiles({ cwd, agentDir }).length,
		prompts: commands.filter((command) => command.source === "prompt").length,
		skills: commands.filter((command) => command.source === "skill").length,
		extensions: await countExtensions(cwd, agentDir),
	};
}

export function getSummaryParts(counts: HeaderCounts): string[] {
	return [
		pluralize(counts.contextFiles, "context file"),
		pluralize(counts.prompts, "prompt"),
		pluralize(counts.skills, "skill"),
		pluralize(counts.extensions, "extension"),
	];
}

export function buildSummaryLine(theme: Theme, counts: HeaderCounts): string {
	const parts = getSummaryParts(counts);

	return [
		theme.fg("muted", "startup"),
		theme.fg("dim", "  "),
		theme.fg("accent", parts[0]),
		theme.fg("dim", " · "),
		theme.fg("accent", parts[1]),
		theme.fg("dim", " · "),
		theme.fg("accent", parts[2]),
		theme.fg("dim", " · "),
		theme.fg("accent", parts[3]),
	].join("");
}
