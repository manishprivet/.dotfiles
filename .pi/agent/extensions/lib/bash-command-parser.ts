const SHELL_SYNTAX_REQUIRING_CONFIRMATION = /(`|\$\(|&&|\|\||;|<|<<|<<<)/;

export function tokenizeCommand(segment: string): string[] {
	return segment.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\S+/g) ?? [];
}

export function stripWrappingQuotes(token: string): string {
	if (
		(token.startsWith('"') && token.endsWith('"')) ||
		(token.startsWith("'") && token.endsWith("'"))
	) {
		return token.slice(1, -1);
	}
	return token;
}

export function isEnvAssignment(token: string): boolean {
	return /^[A-Za-z_][A-Za-z0-9_]*=.*/.test(token);
}

export function getExecutableTokens(segment: string): string[] {
	const tokens = tokenizeCommand(segment).map(stripWrappingQuotes);
	let index = 0;

	while (index < tokens.length && (tokens[index] === "env" || tokens[index] === "command" || isEnvAssignment(tokens[index]))) {
		index += 1;
	}

	return tokens.slice(index);
}

export function splitShellCommand(command: string, separator: string): string[] {
	const segments: string[] = [];
	let current = "";
	let singleQuoted = false;
	let doubleQuoted = false;
	let subshellDepth = 0;

	for (let index = 0; index < command.length; index += 1) {
		const char = command[index];
		const next = command[index + 1];

		if (char === "\\" && !singleQuoted) {
			current += char;
			if (next !== undefined) {
				current += next;
				index += 1;
			}
			continue;
		}

		if (!doubleQuoted && char === "'") {
			singleQuoted = !singleQuoted;
			current += char;
			continue;
		}

		if (!singleQuoted && char === '"') {
			doubleQuoted = !doubleQuoted;
			current += char;
			continue;
		}

		if (!singleQuoted && !doubleQuoted && char === "$" && next === "(") {
			subshellDepth += 1;
			current += "$";
			current += "(";
			index += 1;
			continue;
		}

		if (!singleQuoted && !doubleQuoted && char === ")" && subshellDepth > 0) {
			subshellDepth -= 1;
			current += char;
			continue;
		}

		if (!singleQuoted && !doubleQuoted && subshellDepth === 0 && char === separator) {
			const segment = current.trim();
			if (segment) segments.push(segment);
			current = "";
			continue;
		}

		current += char;
	}

	const trailing = current.trim();
	if (trailing) segments.push(trailing);
	return segments;
}

export function splitShellSequence(command: string): string[] {
	return splitShellCommand(command, ";");
}

export function splitShellPipeline(command: string): string[] {
	return splitShellCommand(command, "|");
}

export function hasShellSyntaxRequiringConfirmation(command: string): boolean {
	return SHELL_SYNTAX_REQUIRING_CONFIRMATION.test(command);
}

export function stripSafeDevNullRedirects(segment: string): string {
	return segment.replace(/(^|\s)(?:\d*>>?\s*\/dev\/null)(?=\s|$)/g, "$1").trim();
}

export function hasUnsafeOutputRedirect(segment: string): boolean {
	const stripped = stripSafeDevNullRedirects(segment);
	return />|>>/.test(stripped);
}
