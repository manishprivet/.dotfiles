import os from "node:os";
import path from "node:path";
import { normalizeStringList, readJsonFile, writeJsonFile } from "./config-json-shared";

export const CONFIRM_EVERY_BASH_CONFIG_PATH = path.join(os.homedir(), ".pi", "agent", "confirm-every-bash.json");

const DEFAULT_READ_ONLY_COMMANDS = [
	"pwd",
	"ls",
	"cat",
	"head",
	"tail",
	"grep",
	"rg",
	"find",
	"fd",
	"stat",
	"file",
	"du",
	"wc",
	"sort",
	"uniq",
	"cut",
	"sed",
	"awk",
	"jq",
	"tree",
	"which",
	"where",
	"type",
	"echo",
	"printf",
];

const DEFAULT_READ_ONLY_GIT_SUBCOMMANDS = ["status", "diff", "log", "show", "rev-parse"];

export type BashPermissionsConfig = {
	disableDefaultReadOnlyAllowlist?: boolean;
	allowCommands?: string[];
	allowPrefixes?: string[];
	alwaysConfirmCommands?: string[];
	alwaysConfirmPrefixes?: string[];
	readOnlyCommands?: string[];
	readOnlyGitSubcommands?: string[];
};

export type ResolvedBashPermissionsConfig = {
	allowCommands: string[];
	allowPrefixes: string[];
	alwaysConfirmCommands: string[];
	alwaysConfirmPrefixes: string[];
	readOnlyCommands: Set<string>;
	readOnlyGitSubcommands: Set<string>;
};

export function normalizeCommand(command: string): string {
	return command.trim();
}

export async function loadConfirmEveryBashConfig(): Promise<ResolvedBashPermissionsConfig> {
	const parsed = await readJsonFile<BashPermissionsConfig>(CONFIRM_EVERY_BASH_CONFIG_PATH, {});
	const defaultReadOnlyCommands = parsed.disableDefaultReadOnlyAllowlist ? [] : DEFAULT_READ_ONLY_COMMANDS;
	const defaultReadOnlyGitSubcommands = parsed.disableDefaultReadOnlyAllowlist ? [] : DEFAULT_READ_ONLY_GIT_SUBCOMMANDS;

	return {
		allowCommands: normalizeStringList(parsed.allowCommands),
		allowPrefixes: normalizeStringList(parsed.allowPrefixes),
		alwaysConfirmCommands: normalizeStringList(parsed.alwaysConfirmCommands),
		alwaysConfirmPrefixes: normalizeStringList(parsed.alwaysConfirmPrefixes),
		readOnlyCommands: new Set([
			...defaultReadOnlyCommands,
			...normalizeStringList(parsed.readOnlyCommands),
		]),
		readOnlyGitSubcommands: new Set([
			...defaultReadOnlyGitSubcommands,
			...normalizeStringList(parsed.readOnlyGitSubcommands),
		]),
	};
}

export async function updateConfirmEveryBashConfig(
	mutator: (config: BashPermissionsConfig) => BashPermissionsConfig,
): Promise<void> {
	const current = await readJsonFile<BashPermissionsConfig>(CONFIRM_EVERY_BASH_CONFIG_PATH, {});
	await writeJsonFile(CONFIRM_EVERY_BASH_CONFIG_PATH, mutator(current));
}
