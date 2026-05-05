import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const TERMINAL_NOTIFIER_PATH = "/opt/homebrew/bin/terminal-notifier";

const TERMINAL_PROCESS_NAMES: Record<string, string> = {
	ghostty: "Ghostty",
	kitty: "kitty",
	iterm: "iTerm2",
	iterm2: "iTerm2",
	wezterm: "WezTerm",
	terminal: "Terminal",
	apple_terminal: "Terminal",
	alacritty: "Alacritty",
	hyper: "Hyper",
	warp: "Warp",
	vscode: "Code",
	"vscode-insiders": "Code - Insiders",
	rio: "Rio",
};

export enum NotificationSound {
	Submarine = "Submarine",
}

export interface TerminalInfo {
	name: string | null;
	processName: string | null;
	bundleId: string | null;
}

export interface NotificationPayload {
	title: string;
	message: string;
	subtitle?: string;
	sound?: NotificationSound | string;
}

function escapeAppleScriptString(value: string): string {
	return JSON.stringify(value);
}

async function commandExists(command: string): Promise<boolean> {
	try {
		await execFileAsync("which", [command]);
		return true;
	} catch {
		return false;
	}
}

async function runOsascript(script: string): Promise<string | null> {
	if (process.platform !== "darwin") return null;

	try {
		const { stdout } = await execFileAsync("osascript", ["-e", script]);
		return stdout.trim() || null;
	} catch {
		return null;
	}
}

function detectTerminalName(terminalOverride?: string): string | null {
	if (terminalOverride?.trim()) return terminalOverride.trim().toLowerCase();
	if (process.env.KITTY_WINDOW_ID) return "kitty";
	if (process.env.GHOSTTY_RESOURCES_DIR || process.env.GHOSTTY_BIN_DIR) return "ghostty";
	if (process.env.WEZTERM_EXECUTABLE) return "wezterm";
	if (process.env.ALACRITTY_SOCKET) return "alacritty";
	if (process.env.WARP_SESSION_ID) return "warp";
	if (process.env.HYPER_VERSION) return "hyper";

	const termProgram = process.env.TERM_PROGRAM?.trim().toLowerCase();
	if (termProgram) return termProgram;

	return null;
}

async function getBundleId(appName: string): Promise<string | null> {
	return runOsascript(`id of application ${escapeAppleScriptString(appName)}`);
}

async function getFrontmostApp(): Promise<string | null> {
	return runOsascript(
		'tell application "System Events" to get name of first application process whose frontmost is true',
	);
}

export async function detectTerminalInfo(terminalOverride?: string): Promise<TerminalInfo> {
	const name = detectTerminalName(terminalOverride);
	if (!name) {
		return { name: null, processName: null, bundleId: null };
	}

	const processName = TERMINAL_PROCESS_NAMES[name] ?? name;
	const bundleId = process.platform === "darwin" ? await getBundleId(processName) : null;
	return { name, processName, bundleId };
}

export async function isTerminalFocused(terminalInfo: TerminalInfo): Promise<boolean> {
	if (process.platform !== "darwin" || !terminalInfo.processName) return false;
	const frontmost = await getFrontmostApp();
	return frontmost?.toLowerCase() === terminalInfo.processName.toLowerCase();
}

export async function isCurrentTmuxPaneActive(): Promise<boolean> {
	if (!process.env.TMUX || !process.env.TMUX_PANE) return true;
	try {
		const { stdout } = await execFileAsync("tmux", ["display-message", "-p", "-t", process.env.TMUX_PANE, "#{pane_active}"]);
		return stdout.trim() === "1";
	} catch {
		return true;
	}
}

export async function isFocusedTerminalActivePane(terminalInfo: TerminalInfo): Promise<boolean> {
	const [focused, paneActive] = await Promise.all([
		isTerminalFocused(terminalInfo),
		isCurrentTmuxPaneActive(),
	]);
	return focused && paneActive;
}

async function sendMacTerminalNotification(
	payload: NotificationPayload,
	terminalInfo?: TerminalInfo,
): Promise<boolean> {
	if (process.platform !== "darwin") return false;
	if (!(await commandExists(TERMINAL_NOTIFIER_PATH))) return false;

	const resolvedTerminalInfo = terminalInfo ?? (await detectTerminalInfo());
	const args = ["-title", payload.title, "-message", payload.message];
	if (payload.subtitle) args.push("-subtitle", payload.subtitle);
	if (payload.sound) args.push("-sound", payload.sound);
	if (resolvedTerminalInfo.bundleId) args.push("-activate", resolvedTerminalInfo.bundleId);

	try {
		await execFileAsync(TERMINAL_NOTIFIER_PATH, args);
		return true;
	} catch {
		return false;
	}
}

async function sendLinuxNotification(payload: NotificationPayload): Promise<boolean> {
	if (!(await commandExists("notify-send"))) return false;
	try {
		await execFileAsync("notify-send", [payload.title, payload.message]);
		return true;
	} catch {
		return false;
	}
}

function windowsToastScript(title: string, body: string): string {
	const type = "Windows.UI.Notifications";
	const mgr = `[${type}.ToastNotificationManager, ${type}, ContentType = WindowsRuntime]`;
	const template = `[${type}.ToastTemplateType]::ToastText02`;
	const toast = `[${type}.ToastNotification]::new($xml)`;
	const safeTitle = title.replace(/'/g, "''");
	const safeBody = body.replace(/'/g, "''");
	return [
		`${mgr} > $null`,
		`$xml = [${type}.ToastNotificationManager]::GetTemplateContent(${template})`,
		`$xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('${safeTitle}')) > $null`,
		`$xml.GetElementsByTagName('text')[1].AppendChild($xml.CreateTextNode('${safeBody}')) > $null`,
		`[${type}.ToastNotificationManager]::CreateToastNotifier('Pi').Show(${toast})`,
	].join("; ");
}

async function sendWindowsNotification(payload: NotificationPayload): Promise<boolean> {
	try {
		await execFileAsync("powershell.exe", ["-NoProfile", "-Command", windowsToastScript(payload.title, payload.message)]);
		return true;
	} catch {
		return false;
	}
}

export async function sendNotification(
	payload: NotificationPayload,
	terminalInfo?: TerminalInfo,
): Promise<boolean> {
	if (process.platform === "darwin") return sendMacTerminalNotification(payload, terminalInfo);
	if (process.platform === "linux") return sendLinuxNotification(payload);
	if (process.platform === "win32") return sendWindowsNotification(payload);
	return false;
}
