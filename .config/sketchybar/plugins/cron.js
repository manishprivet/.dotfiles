#!/opt/homebrew/bin/node

import { createReadStream, rmSync, existsSync } from "fs";
import { createInterface } from "readline";
import { execSync } from "child_process";

const ITEM_NAME = process.env.NAME;

const execute = (COMMAND) =>
  execSync(COMMAND, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
  });

const JSON_FILE = "cron_data.json";

rmSync(JSON_FILE, { force: true });

const INDEXDB_LOCATION =
  process.env.HOME + "/Library/Application Support/Notion Calendar/IndexedDB";

const formatDuration = (time) => {
  let duration = time;
  if (duration > 60 * 60) {
    duration = Math.floor(duration / 60 / 60);

    const durationInMinutes = Math.floor((time - duration * 60 * 60) / 60);

    if (durationInMinutes > 0) {
      duration = `${duration}h ${durationInMinutes}m`;
    } else {
      duration = `${duration}h`;
    }
  } else if (duration > 120) {
    duration = Math.floor(duration / 60) + "m";
  } else {
    duration = "now";
  }

  return duration;
};

const truncateText = (text, length) => {
  if (text.length <= length) {
    return text;
  }

  return text.substr(0, length) + "\u2026";
};

// Set Status to Loading
execute(`
  sketchybar --set ${ITEM_NAME} \
    icon= \
    click_script="" \
`);

// Extract data from IndexedDB
const pythonUserBase = execute("python3 -m site --user-base").toString().trim();
const dfIndexedDbPath = `${pythonUserBase}/bin/dfindexeddb`;
let hasDfIndexedDb = existsSync(dfIndexedDbPath);

if (!hasDfIndexedDb) {
  execute(
    `CPPFLAGS="-I/opt/homebrew/include -L/opt/homebrew/lib" python3 -m pip install --user dfindexeddb --break-system-packages`,
  );
  execute(
    `CPPFLAGS="-I/opt/homebrew/include -L/opt/homebrew/lib" python3 -m pip install --user 'dfindexeddb[plugins]' --break-system-packages`,
  );
  hasDfIndexedDb = existsSync(dfIndexedDbPath);
}

const binPath = hasDfIndexedDb ? dfIndexedDbPath : `dfindexeddb`;

execute(`
  ${binPath} db \
    -s "${INDEXDB_LOCATION}/https_calendar.notion.so_0.indexeddb.leveldb" \
    --format chrome \
    --use_manifest \
    -o jsonl \
    >> ${JSON_FILE}
`);

var rd = createInterface({
  input: createReadStream(JSON_FILE),
  console: false,
});

const events = [];

const state = {
  summary: "",
  startTime: undefined,
  endTime: undefined,
  duration: 0,
  isStaleData: true,
  isToStart: false,
  isCurrentlyOnGoing: false,
  isCancelled: true,
  isWithin3Hours: false,
  attendees: [],
  iAmAttending: false,
};

rd.on("line", function (line) {
  const data = JSON.parse(line);

  if (data.value?.value?.kind === "calendar#event") {
    state.summary = data.value.value?.summary;

    state.startTime = data.value.value?.start?.dateTime;
    state.endTime = data.value.value?.end?.dateTime;

    // Don't process full day events
    if (!state.startTime) {
      return;
    }

    state.isStaleData = Boolean(data.recovered);

    state.isToStart = new Date() < new Date(state.startTime);

    state.isCurrentlyOnGoing =
      new Date() > new Date(state.startTime) &&
      new Date() < new Date(state.endTime);

    state.isCancelled = data.value.value.status === "cancelled";

    state.isWithin3Hours =
      (new Date(state.startTime) - new Date()) / 1000 < 60 * 60 * 3;

    state.attendees = data.value.value.attendees?.values || [];

    state.iAmInAttendees = state.attendees.some((attendee) => {
      return attendee.self && attendee.responseStatus !== "declined";
    });

    state.iAmCreator = data.value.value.creator?.self;

    state.isInMyCalendar = data.value.value.calendarId?.includes("manish");

    state.iAmAttending =
      (state.iAmInAttendees || state.iAmCreator) && state.isInMyCalendar;

    if (
      // The data is not stale
      !state.isStaleData &&
      // It is within 3 hours from now
      state.isWithin3Hours &&
      // The meeting is not cancelled
      !state.isCancelled &&
      // Meeting is to start or is ongoing
      (state.isToStart || state.isCurrentlyOnGoing) &&
      // I am attending the meeting
      state.iAmAttending
    ) {
      // Duration by difference of START and END
      state.duration =
        (new Date(state.endTime) - new Date(state.startTime)) / 1000;

      events.push({
        summary: state.summary,
        startTime: state.startTime,
        endTime: state.endTime,
        duration: state.duration,
        meet: data.value.value.hangoutLink,
      });
    }
  }
});

rd.on("close", function () {
  // Set status to No Meetings if there are no meetings
  if (!events.length) {
    execute(`
      sketchybar --set ${ITEM_NAME} \
        label="No upcoming meetings" \
        background.drawing=off \
        icon.padding_left=0 \
        label.padding_right=0 \
        icon=󰢠 \
        click_script="" \
    `);

    return;
  }

  // Get latest meeting
  const meeting = events.sort((a, b) => {
    return new Date(a.startTime) - new Date(b.startTime);
  })[0];

  const timeGap = formatDuration(
    (new Date(meeting.startTime) - new Date()) / 1000,
  );

  const duration = formatDuration(meeting.duration);

  // If meeting is too short doesn't show duration
  const durationText = duration === "now" ? "" : ` (${duration})`;

  const summary = truncateText(meeting.summary, 15);
  const remainingTime = timeGap === "now" ? " now" : ` in ${timeGap}`;

  const label = `${summary}${durationText}${remainingTime}`;

  const icon = meeting.meet ? "" : "󱔠";
  const clickScript = meeting.meet ? `open -n "${meeting.meet}"` : "";

  execute(`
    sketchybar --set ${ITEM_NAME} \
      background.drawing=on \
      icon.padding_left=12 \
      label.padding_right=12 \
      label="${label}" \
      click_script="${clickScript}" \
      icon="${icon}"
  `);
});
