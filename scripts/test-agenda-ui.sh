#!/usr/bin/env bash
# Exercise real plugin QML offscreen, with fabricated events and networking disabled.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
scratch=$(mktemp -d /tmp/opencode/agenda-ui.XXXXXX)
trap 'rm -rf "$scratch"' EXIT
mkdir -p "$scratch/config/omarchy"
printf 'en\n' > "$scratch/config/omarchy/language"
ln -s /usr/share/omarchy/shell/Commons "$scratch/Commons"
ln -s /usr/share/omarchy/shell/Ui "$scratch/Ui"
ln -s "$ROOT/omarchy/.config/omarchy/plugins/manish.agenda" "$scratch/Agenda"
cat > "$scratch/shell.qml" <<'QML'
import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons as Commons
import "Agenda" as Agenda
import "Agenda/Model.js" as Model

FloatingWindow {
  id: window
  implicitWidth: 520; implicitHeight: 500; visible: true
  color: Commons.Color.background
  property bool finished: false
  property var state: Agenda.AgendaState
  property string activatedUrl: ""
  FileView { id: language; path: Quickshell.env("XDG_CONFIG_HOME") + "/omarchy/language" }
  function check(condition, message) { if (!condition) throw new Error(message) }
  function find(item, name) {
    if (item.objectName === name) return item
    var children = item.children || []
    for (var i = 0; i < children.length; i++) { var found = find(children[i], name); if (found) return found }
    return null
  }
  function snapshot(date) {
    var start = Model.parseDate(date).getTime()
    return {ok: true, date: date, fetchedAt: Date.now(), cacheModifiedAt: Date.now() - 7 * 86400000, events: [
      {id: "fixture", title: "Planning · <b>plain text, not markup</b>", location: "Example conference room",
        start: start, end: start + 3600000, allDay: false, url: "https://www.google.com/calendar/event?eid=fixture", meet: "https://meet.google.com/abc-defg-hij"},
      {id: "fixture-two", title: "Design review with a longer title to check wrapping on smaller screens", location: "",
        start: start + 7200000, end: start + 10800000, allDay: false, url: "https://www.google.com/calendar/event?eid=fixture-two", meet: ""}
    ]}
  }
  Agenda.AgendaContent {
    id: content
    anchors.fill: parent; anchors.margins: 24
    selectedDate: window.state.selectedDate; today: window.state.today
    snapshot: window.state.selectedSnapshot
    error: window.state.selectedError
    onDayRequested: function(delta) { window.state.moveDate(delta) }
    onTodayRequested: window.state.showToday()
    onEventRequested: function(url) { window.activatedUrl = url }
  }
  Timer {
    interval: 700; running: true
    onTriggered: {
      try {
        check(!state.pollingEnabled, "Test networking must be disabled")
        state.runningDate = state.today
        state.accept(JSON.stringify(snapshot(state.today)))
        state.runningDate = ""
        check(content.events.length === 2, "Real QML did not receive fixture events")
        check(!content.stale, "Unchanged cache must not make a successful read stale")
        find(content, "nextButton").clicked()
        check(state.selectedDate === Model.stepDate(state.today, 1), "Next day failed")
        check(content.snapshot === null, "Old events leaked into the newly selected date")
        find(content, "todayButton").clicked()
        check(state.selectedDate === state.today, "Today failed")
        find(content, "previousButton").clicked()
        check(state.selectedDate === Model.stepDate(state.today, -1), "Previous day failed")
        state.runningDate = state.selectedDate
        state.accept(JSON.stringify(snapshot(state.selectedDate)))
        state.accept(JSON.stringify({ok: false, error: "decode"}))
        state.runningDate = ""
        check(content.snapshot !== null && content.error === "decode", "Failed refresh discarded cached data")
        check(content.stale, "Failed refresh must mark retained data stale")
        check(state.todaySnapshot.events.length === 2, "Browsing changed today's bar data")
        state.showToday()
        content.activate()
        check(window.activatedUrl === "https://meet.google.com/abc-defg-hij", "Event activation did not use the Meet link")
        content.selectedIndex = 1; window.activatedUrl = ""; content.activate()
        check(window.activatedUrl === "", "Missing Meet link must not fall back to the calendar link")
        content.selectedIndex = 0
        content.grabToImage(function(result) {
          check(result.saveToFile(Quickshell.env("AGENDA_SCREENSHOT_DIR") + "/agenda-en.png"), "Screenshot failed")
          language.setText("da\n")
          danish.start()
        })
      } catch (e) { console.error("FAIL agenda QML: " + e.message); Qt.exit(1) }
    }
  }
  Timer {
    id: danish; interval: 700
    onTriggered: {
      try {
        check(Commons.I18n.language === "da", "Language did not switch live")
        check(find(content, "todayButton").text === "I dag", "Plugin translation did not update")
        content.grabToImage(function(result) {
          check(result.saveToFile(Quickshell.env("AGENDA_SCREENSHOT_DIR") + "/agenda-da.png"), "Danish screenshot failed")
          console.log("PASS agenda QML: date buttons, Meet-only activation, cached failures, independent today data, live Danish translation")
          Qt.quit()
        })
      } catch (e) { console.error("FAIL agenda QML: " + e.message); Qt.exit(1) }
    }
  }
  Timer { interval: 12000; running: true; onTriggered: { console.error("FAIL agenda QML: timeout"); Qt.exit(1) } }
}
QML
export AGENDA_TEST_MODE=1 QT_QPA_PLATFORM=offscreen QT_QUICK_BACKEND=software QT_FORCE_STDERR_LOGGING=1
export XDG_CONFIG_HOME="$scratch/config" OMARCHY_PATH=/usr/share/omarchy
export AGENDA_SCREENSHOT_DIR=/tmp/opencode/agenda-screenshots
mkdir -p "$AGENDA_SCREENSHOT_DIR"
quickshell --path "$scratch/shell.qml" --no-color 2>&1 | tee "$scratch/output"
grep -q 'PASS agenda QML:' "$scratch/output"
if grep -Eq 'FAIL agenda QML:|TypeError:|ReferenceError:|Error loading configuration|Unable to assign' "$scratch/output"; then exit 1; fi
