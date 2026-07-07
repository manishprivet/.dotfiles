import { normalizeStringList } from "./config-json-shared";
import {
	getExecutableTokens,
	hasShellSyntaxRequiringConfirmation,
	hasUnsafeOutputRedirect,
	splitShellPipeline,
	splitShellSequence,
	stripSafeDevNullRedirects,
} from "./bash-command-parser";
import type { ResolvedBashPermissionsConfig } from "./bash-permissions-config";

function escapeRegExpLiteral(value: string): string {
	return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globPatternToRegExp(pattern: string): RegExp {
	const source = pattern
		.split("*")
		.map(escapeRegExpLiteral)
		.join(".*");
	return new RegExp(`^${source}$`);
}

function matchesCommandPattern(command: string, pattern: string): boolean {
	if (!pattern.includes("*")) {
		return command === pattern;
	}

	return globPatternToRegExp(pattern).test(command);
}

function matchesExactOrPrefix(command: string, exact: string[], prefixes: string[]): boolean {
	return (
		exact.some((pattern) => matchesCommandPattern(command, pattern)) ||
		prefixes.some((prefix) => command === prefix || command.startsWith(`${prefix} `))
	);
}

function isSafeMktempAssignment(segment: string): string | null {
	const match = segment.match(/^([A-Za-z_][A-Za-z0-9_]*)=\$\((.*)\)$/s);
	if (!match) return null;

	const variableName = match[1];
	const innerCommand = match[2]?.trim();
	if (!innerCommand) return null;

	const tokens = getExecutableTokens(innerCommand);
	if (tokens[0] !== "mktemp") return null;
	return variableName;
}

function isSafeTempfileEcho(segment: string, variableName: string): boolean {
	const normalized = segment.trim();
	return (
		normalized === `echo "$${variableName}"` ||
		normalized === `printf '%s\\n' "$${variableName}"` ||
		normalized === `printf \"%s\\n\" "$${variableName}"`
	);
}

function isSafeTempfileInspectionWorkflow(command: string, config: ResolvedBashPermissionsConfig): boolean {
	const segments = splitShellSequence(command);
	if (segments.length !== 3) return false;

	const variableName = isSafeMktempAssignment(segments[0]);
	if (!variableName) return false;
	if (!isSafeTempfileEcho(segments[2], variableName)) return false;

	const redirectMatch = segments[1]?.match(new RegExp(`^(.*)\\s>\\s"\\$${variableName}"$`, "s"));
	if (!redirectMatch) return false;

	const inspectedCommand = redirectMatch[1]?.trim();
	if (!inspectedCommand) return false;
	return isReadOnlyCommand(inspectedCommand, config);
}

export function isReadOnlyCommand(command: string, config: ResolvedBashPermissionsConfig): boolean {
	if (isSafeTempfileInspectionWorkflow(command, config)) {
		return true;
	}

	if (hasShellSyntaxRequiringConfirmation(command)) {
		return false;
	}

	const pipelineSegments = splitShellPipeline(command);

	if (pipelineSegments.length === 0) {
		return false;
	}

	return pipelineSegments.every((segment) => {
		if (hasUnsafeOutputRedirect(segment)) {
			return false;
		}

		const normalizedSegment = stripSafeDevNullRedirects(segment);
		const tokens = getExecutableTokens(normalizedSegment);
		if (tokens.length === 0) {
			return false;
		}

		const program = tokens[0];
		if (config.readOnlyCommands.has(program)) {
			return true;
		}

		if (program === "git") {
			const subcommand = tokens[1];
			return subcommand !== undefined && config.readOnlyGitSubcommands.has(subcommand);
		}

		return false;
	});
}

export function shouldAllowWithoutPrompt(
	command: string,
	config: ResolvedBashPermissionsConfig,
	sessionAllowedCommands: Set<string>,
): boolean {
	if (matchesExactOrPrefix(command, config.alwaysConfirmCommands, config.alwaysConfirmPrefixes)) {
		return false;
	}

	if (sessionAllowedCommands.has(command)) {
		return true;
	}

	if (matchesExactOrPrefix(command, config.allowCommands, config.allowPrefixes)) {
		return true;
	}

	return isReadOnlyCommand(command, config);
}

export { normalizeStringList };
