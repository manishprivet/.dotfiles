import { readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { SettingsManager } from "@mariozechner/pi-coding-agent";
import { addUniqueFile, expandHome, pathExists } from "./path-shared";

const EXTENSION_FILE_PATTERN = /\.(ts|js)$/;

export async function discoverExtensionFilesInDir(dir: string): Promise<Set<string>> {
	const files = new Set<string>();
	if (!(await pathExists(dir))) {
		return files;
	}

	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);

		if (entry.isFile() && EXTENSION_FILE_PATTERN.test(entry.name)) {
			files.add(await realpath(entryPath));
			continue;
		}

		if (entry.isDirectory()) {
			await addUniqueFile(path.join(entryPath, "index.ts"), files);
			await addUniqueFile(path.join(entryPath, "index.js"), files);
			continue;
		}

		if (entry.isSymbolicLink()) {
			const info = await stat(entryPath).catch(() => undefined);
			if (info?.isFile() && EXTENSION_FILE_PATTERN.test(entry.name)) {
				files.add(await realpath(entryPath));
				continue;
			}
			if (info?.isDirectory()) {
				await addUniqueFile(path.join(entryPath, "index.ts"), files);
				await addUniqueFile(path.join(entryPath, "index.js"), files);
			}
		}
	}

	return files;
}

export async function discoverConfiguredExtensionPaths(paths: string[], baseDir: string): Promise<Set<string>> {
	const files = new Set<string>();

	for (const configuredPath of paths) {
		if (!configuredPath || configuredPath.startsWith("!") || configuredPath.startsWith("-")) {
			continue;
		}

		const normalizedPath = configuredPath.startsWith("+") ? configuredPath.slice(1) : configuredPath;
		const resolvedPath = path.isAbsolute(normalizedPath) || normalizedPath.startsWith("~")
			? expandHome(normalizedPath)
			: path.resolve(baseDir, normalizedPath);

		const info = await stat(resolvedPath).catch(() => undefined);
		if (!info) {
			continue;
		}

		if (info.isFile() && EXTENSION_FILE_PATTERN.test(resolvedPath)) {
			files.add(await realpath(resolvedPath));
			continue;
		}

		if (info.isDirectory()) {
			for (const file of await discoverExtensionFilesInDir(resolvedPath)) {
				files.add(file);
			}
		}
	}

	return files;
}

export async function getExtensionFiles(cwd: string, agentDir: string): Promise<string[]> {
	const settings = SettingsManager.create(cwd, agentDir);
	const files = new Set<string>();

	for (const file of await discoverExtensionFilesInDir(path.join(agentDir, "extensions"))) {
		files.add(file);
	}

	for (const file of await discoverExtensionFilesInDir(path.join(cwd, ".pi", "extensions"))) {
		files.add(file);
	}

	for (const file of await discoverConfiguredExtensionPaths(settings.getGlobalSettings().extensions ?? [], agentDir)) {
		files.add(file);
	}

	for (const file of await discoverConfiguredExtensionPaths(settings.getProjectSettings().extensions ?? [], path.join(cwd, ".pi"))) {
		files.add(file);
	}

	return Array.from(files).sort((a, b) => a.localeCompare(b));
}

export async function countExtensions(cwd: string, agentDir: string): Promise<number> {
	return (await getExtensionFiles(cwd, agentDir)).length;
}
