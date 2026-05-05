import {
	getAgentDir,
	loadProjectContextFiles,
	type ExtensionAPI,
	type ExtensionContext,
	type SlashCommandInfo,
} from "@mariozechner/pi-coding-agent";
import { getExtensionFiles } from "./lib/extension-discovery";
import { formatDisplayPath, showInfoList } from "./lib/info-list-ui";
import { buildSummaryLine, getHeaderCounts } from "./lib/startup-counts";

type InfoLineProvider = (ctx: ExtensionContext) => Promise<string[]> | string[];

function registerInfoCommand(
	pi: ExtensionAPI,
	name: string,
	description: string,
	title: string,
	getLines: InfoLineProvider,
): void {
	pi.registerCommand(name, {
		description,
		handler: async (_args, ctx) => {
			showInfoList(ctx, title, await getLines(ctx));
		},
	});
}

function commandDisplayLine(ctx: ExtensionContext, command: SlashCommandInfo): string {
	return `/${command.name} — ${formatDisplayPath(ctx.cwd, command.sourceInfo.path)}`;
}

export default function startupCountsHeader(pi: ExtensionAPI) {
	registerInfoCommand(
		pi,
		"info:context",
		"Show loaded context files",
		"Context files",
		(ctx) => loadProjectContextFiles({ cwd: ctx.cwd, agentDir: getAgentDir() })
			.map((file) => formatDisplayPath(ctx.cwd, file.path)),
	);

	registerInfoCommand(
		pi,
		"info:prompts",
		"Show loaded prompt templates",
		"Prompts",
		(ctx) => pi.getCommands()
			.filter((command) => command.source === "prompt")
			.map((command) => commandDisplayLine(ctx, command)),
	);

	registerInfoCommand(
		pi,
		"info:skills",
		"Show loaded skills",
		"Skills",
		(ctx) => pi.getCommands()
			.filter((command) => command.source === "skill")
			.map((command) => commandDisplayLine(ctx, command)),
	);

	registerInfoCommand(
		pi,
		"info:extensions",
		"Show loaded extensions",
		"Extensions",
		async (ctx) => (await getExtensionFiles(ctx.cwd, getAgentDir()))
			.map((file) => formatDisplayPath(ctx.cwd, file)),
	);

	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) {
			return;
		}

		try {
			const counts = await getHeaderCounts(ctx.cwd, pi.getCommands());
			ctx.ui.setHeader((_tui, theme) => ({
				render() {
					return ["", buildSummaryLine(theme, counts), ""];
				},
				invalidate() {},
			}));
			ctx.ui.setWidget("startup-counts-reload", undefined);
		} catch {
			ctx.ui.setHeader((_tui, theme) => ({
				render() {
					return ["", theme.fg("muted", "startup summary unavailable"), ""];
				},
				invalidate() {},
			}));
		}
	});
}
