#!/opt/homebrew/bin/node

import {
  closeSync,
  createReadStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
} from "fs";
import { homedir } from "os";
import { join } from "path";
import { createInterface } from "readline";
import { execFileSync } from "child_process";

const ITEM_NAME = process.env.NAME || "cron";
const CACHE_DIR = join(homedir(), "Library/Caches/sketchybar");
const LOG_FILE = join(CACHE_DIR, "calendar.log");
const PARSER = join(
  homedir(),
  ".local/share/sketchybar/dfindexeddb/bin/dfindexeddb",
);
const INDEXDB_LOCATION = join(
  homedir(),
  "Library/Application Support/Notion Calendar/IndexedDB",
);

// Pass labels as arguments, not shell commands: event titles can contain quotes
// or shell substitutions. All subprocesses are bounded so failures can clear Loading.
const setItem = (properties) =>
  execFileSync(
    "sketchybar",
    ["--set", ITEM_NAME, ...Object.entries(properties).map(([k, v]) => `${k}=${v}`)],
    { timeout: 5000 },
  );

const formatDuration = (time) => {
  if (time > 60 * 60) {
    const hours = Math.floor(time / 60 / 60);
    const minutes = Math.floor((time - hours * 60 * 60) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return time > 120 ? `${Math.floor(time / 60)}m` : "now";
};

async function updateCalendar() {
  let tempDir;
  try {
    setItem({ icon: "", label: "Loading…", click_script: "" });
    mkdirSync(CACHE_DIR, { recursive: true });
    if (!existsSync(PARSER)) {
      throw new Error("Calendar parser missing. Run scripts/setup-calendar.sh from the dotfiles repo.");
    }

    // Chromium does not create this directory until a blob is stored, but the
    // parser requires it. Never create a missing database and report it as empty.
    const database = join(INDEXDB_LOCATION, "https_calendar.notion.so_0.indexeddb.leveldb");
    if (!existsSync(database)) {
      throw new Error("Notion Calendar database missing. Open Notion Calendar and sync first.");
    }
    mkdirSync(join(INDEXDB_LOCATION, "https_calendar.notion.so_0.indexeddb.blob"), {
      recursive: true,
    });

    tempDir = mkdtempSync(join(CACHE_DIR, "calendar-"));
    const jsonFile = join(tempDir, "data.jsonl");
    const output = openSync(jsonFile, "w", 0o600);
    const diagnostics = openSync(LOG_FILE, "w", 0o600);
    try {
      // Direct file descriptors avoid execSync's 1 MiB stderr buffer limit.
      execFileSync(PARSER, [
        "db", "-s", database, "--format", "chrome", "--use_manifest", "-o", "jsonl",
      ], {
        stdio: ["ignore", output, diagnostics],
        timeout: 30000,
        killSignal: "SIGKILL",
      });
    } finally {
      closeSync(output);
      closeSync(diagnostics);
    }

    // dfindexeddb can exit successfully after skipping undecodable records.
    // Do not turn a broken parser into a misleading "No upcoming meetings".
    if (/Error parsing|Traceback/.test(readFileSync(LOG_FILE, "utf8"))) {
      throw new Error(`Calendar records could not be decoded. See ${LOG_FILE}`);
    }

    const events = [];
    const now = Date.now();
    const lines = createInterface({
      input: createReadStream(jsonFile),
      crlfDelay: Infinity,
    });
    for await (const line of lines) {
      if (!line.trim()) continue;
      const data = JSON.parse(line);
      const event = data.value?.value;
      if (event?.kind !== "calendar#event" || !event.start?.dateTime) continue;

      const start = Date.parse(event.start.dateTime);
      const end = Date.parse(event.end?.dateTime);
      const attendees = event.attendees?.values || [];
      const attending = attendees.some(
        (attendee) => attendee.self && attendee.responseStatus !== "declined",
      ) || event.creator?.self;

      if (
        !data.recovered &&
        event.status !== "cancelled" &&
        Number.isFinite(start) && Number.isFinite(end) &&
        end > now && start - now < 3 * 60 * 60 * 1000 &&
        attending && event.calendarId?.includes("manish")
      ) {
        events.push({
          summary: event.summary || "Untitled meeting",
          start, end,
          meet: event.hangoutLink,
        });
      }
    }

    if (!events.length) {
      setItem({
        label: "No upcoming meetings", icon: "󰢠", click_script: "",
        "background.drawing": "off",
        "icon.padding_left": 0, "label.padding_right": 0,
      });
      return;
    }

    const meeting = events.sort((a, b) => a.start - b.start)[0];
    const timeGap = formatDuration((meeting.start - now) / 1000);
    const duration = formatDuration((meeting.end - meeting.start) / 1000);
    const durationText = duration === "now" ? "" : ` (${duration})`;
    const summary = meeting.summary.length > 15
      ? `${meeting.summary.slice(0, 15)}…` : meeting.summary;
    const remaining = timeGap === "now" ? " now" : ` in ${timeGap}`;
    // click_script is intentionally a shell command; quote the URL for that shell.
    const url = meeting.meet?.replace(/'/g, "'\\''");
    setItem({
      label: `${summary}${durationText}${remaining}`,
      icon: meeting.meet ? "" : "󱔠",
      click_script: url ? `open -n '${url}'` : "",
      "background.drawing": "on",
      "icon.padding_left": 12, "label.padding_right": 12,
    });
  } catch (error) {
    console.error(`Calendar update failed: ${error.message}`);
    setItem({
      label: "Calendar unavailable", icon: "⚠", click_script: "",
      "background.drawing": "off",
      "icon.padding_left": 0, "label.padding_right": 0,
    });
    process.exitCode = 1;
  } finally {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  }
}

await updateCalendar();
