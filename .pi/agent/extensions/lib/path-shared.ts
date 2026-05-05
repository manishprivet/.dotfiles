import { access, realpath, stat } from "node:fs/promises";
import path from "node:path";

export function stripToolPathPrefix(inputPath: string): string {
	return inputPath.startsWith("@") ? inputPath.slice(1) : inputPath;
}

export function expandHome(inputPath: string): string {
	return inputPath.replace(/^~(?=$|\/)/, process.env.HOME ?? "~");
}

export async function pathExists(targetPath: string): Promise<boolean> {
	try {
		await access(targetPath);
		return true;
	} catch {
		return false;
	}
}

export async function addUniqueFile(targetPath: string, files: Set<string>): Promise<void> {
	if (!(await pathExists(targetPath))) {
		return;
	}

	const info = await stat(targetPath);
	if (!info.isFile()) {
		return;
	}

	files.add(await realpath(targetPath));
}

export async function canonicalizeAllowMissing(inputPath: string): Promise<string> {
	const absolutePath = path.resolve(inputPath);
	const missingSegments: string[] = [];
	let currentPath = absolutePath;

	while (true) {
		try {
			const resolvedExistingPath = await realpath(currentPath);
			return missingSegments.length === 0
				? resolvedExistingPath
				: path.join(resolvedExistingPath, ...missingSegments.reverse());
		} catch {
			const parentPath = path.dirname(currentPath);
			if (parentPath === currentPath) {
				return absolutePath;
			}

			missingSegments.push(path.basename(currentPath));
			currentPath = parentPath;
		}
	}
}

export function isPathInside(parentPath: string, childPath: string): boolean {
	const relativePath = path.relative(parentPath, childPath);
	return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

export function formatDisplayPath(cwd: string, targetPath: string): string {
	const home = process.env.HOME;
	if (home && targetPath.startsWith(`${home}/`)) {
		const relativeToCwd = path.relative(cwd, targetPath);
		if (relativeToCwd && !relativeToCwd.startsWith("..") && !path.isAbsolute(relativeToCwd)) {
			return relativeToCwd;
		}
		return `~/${targetPath.slice(home.length + 1)}`;
	}

	const relativeToCwd = path.relative(cwd, targetPath);
	if (relativeToCwd && !relativeToCwd.startsWith("..") && !path.isAbsolute(relativeToCwd)) {
		return relativeToCwd;
	}

	return targetPath;
}
