import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getAssistantUsageTotals } from "./lib/conversation-usage";
import {
	formatCount,
	joinStyled,
	renderCenteredProgressBar,
	renderFooterLine,
	usageColor,
} from "./lib/footer-formatting";
import { formatLeftStatus } from "./lib/footer-git-status";

export default function footerTokenProgress(pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		ctx.ui.setFooter((tui, theme, footerData) => ({
			dispose: footerData.onBranchChange(() => tui.requestRender()),
			invalidate() {},
			render(width: number): string[] {
				const totals = getAssistantUsageTotals(ctx.sessionManager.getBranch());
				const usage = ctx.getContextUsage();

				const leftParts = [formatLeftStatus(ctx.cwd, footerData.getGitBranch(), theme)];
				const sessionName = pi.getSessionName();
				if (sessionName) leftParts.push(theme.fg("dim", sessionName));
				const left = joinStyled(leftParts, theme.fg("borderMuted", "  "));

				const statusValues = Array.from(footerData.getExtensionStatuses().values()).filter(Boolean);
				const separator = theme.fg("dim", " · ");
				const compactParts = [
					theme.fg("accent", ctx.model?.id ?? "no-model"),
					theme.fg("muted", `Σ${formatCount(totals.tokens)}`),
				];
				if (usage) {
					compactParts.push(theme.fg("muted", `${formatCount(usage.tokens)}/${formatCount(usage.contextWindow)}`));
					if (usage.percent !== null) {
						compactParts.push(theme.fg(usageColor(usage.percent), `${Math.round(usage.percent)}%`));
					}
				}
				compactParts.push(theme.fg("success", `$${totals.cost.toFixed(3)}`));
				const statusText = statusValues.length > 0 ? `${theme.fg("dim", statusValues.join(" · "))}${separator}` : "";
				const right = `${statusText}${joinStyled(compactParts, separator)}`;

				const preferredMiddleWidth = Math.min(width, Math.max(18, Math.floor(width * 0.28)));
				const middle = renderCenteredProgressBar(preferredMiddleWidth, usage, theme);
				return [renderFooterLine(width, left, middle, right)];
			},
		}));
	});
}
