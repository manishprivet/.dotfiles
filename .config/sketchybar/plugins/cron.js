#!/opt/homebrew/bin/node

import { execFileSync } from "child_process";
import { readCalendar } from "../../notion-calendar/indexeddb.mjs";

const ITEM_NAME = process.env.NAME || "cron";

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
  try {
    setItem({ icon: "", label: "Loading…", click_script: "" });
    const now = Date.now();
    const { events: cachedEvents } = await readCalendar({ date: null });
    // Preserve the macOS item's existing account filter and three-hour horizon.
    const events = cachedEvents.filter(event => !event.allDay && event.end > now &&
      event.start - now < 3 * 60 * 60 * 1000 && event.calendarId.includes("manish"));

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
    const title = meeting.title || "Untitled meeting";
    const summary = title.length > 15 ? `${title.slice(0, 15)}…` : title;
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
  }
}

await updateCalendar();
