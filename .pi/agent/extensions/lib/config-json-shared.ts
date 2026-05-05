import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function normalizeStringList(value: unknown, fallback: string[] = []): string[] {
	if (!Array.isArray(value)) {
		return fallback;
	}

	const values = value
		.filter((item): item is string => typeof item === "string")
		.map((item) => item.trim())
		.filter(Boolean);

	return values.length > 0 ? values : fallback;
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
	try {
		return JSON.parse(await readFile(filePath, "utf8")) as T;
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;
		if (code !== "ENOENT") {
			throw error;
		}
		return fallback;
	}
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
