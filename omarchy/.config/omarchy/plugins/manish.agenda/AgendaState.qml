pragma Singleton
import QtQuick
import Quickshell
import Quickshell.Io
import "Model.js" as Model

Item {
  id: root
  // A single engine-wide state prevents one poll per monitor.
  property bool pollingEnabled: Quickshell.env("AGENDA_TEST_MODE") !== "1"
  property bool initialized: false
  property int refreshSeconds: 120
  property string databasePath: ""
  property date now: new Date()
  readonly property string today: Model.dateKey(now)
  property string previousToday: today
  property string selectedDate: today
  property var snapshots: ({})
  property var failures: ({})
  property var queue: []
  property string runningDate: ""
  property bool received: false
  readonly property bool busy: runningDate !== ""
  readonly property var todaySnapshot: snapshots[today] || null
  readonly property var selectedSnapshot: snapshots[selectedDate] || null
  readonly property string todayError: failures[today] || ""
  readonly property string selectedError: failures[selectedDate] || ""

  function selectDate(key) {
    if (!Model.parseDate(key)) return
    selectedDate = key
    navigationDelay.restart()
  }
  function moveDate(days) { selectDate(Model.stepDate(selectedDate, days)) }
  function showToday() { selectDate(today) }
  function refresh() {
    enqueue(today)
    if (selectedDate !== today) enqueue(selectedDate)
  }
  function enqueue(key) {
    if (!pollingEnabled || key === runningDate || queue.indexOf(key) !== -1) return
    queue = queue.concat([key])
    pump()
  }
  function pump() {
    if (!pollingEnabled || busy || queue.length === 0) return
    // Rapid date navigation only needs the current selection, not every intermediate day.
    var pending = queue.filter(function(key) { return key === root.today || key === root.selectedDate })
    queue = pending.slice(1)
    if (pending.length === 0) return
    runningDate = pending[0]
    received = false
    var configHome = Quickshell.env("XDG_CONFIG_HOME") || Quickshell.env("HOME") + "/.config"
    fetcher.command = ["mise", "exec", "node", "--", "node", configHome + "/notion-calendar/cli.mjs", "--date", runningDate]
      .concat(databasePath !== "" ? ["--database", databasePath] : [])
    watchdog.restart()
    fetcher.running = true
  }
  function accept(text) {
    received = true
    var data
    try { data = JSON.parse(text) } catch (e) { data = {ok: false, error: "decode"} }
    var errors = ({})
    for (var failedDate in failures)
      if (failedDate === today || failedDate === selectedDate) errors[failedDate] = failures[failedDate]
    if (data.ok === true && data.date === runningDate && Array.isArray(data.events) && data.events.length <= 500 && Number.isFinite(data.fetchedAt)) {
      var next = ({})
      // Bound in-memory retention and never persist calendar data in the plugin tree.
      for (var key in snapshots)
        if (key === today || key === selectedDate) next[key] = snapshots[key]
      next[runningDate] = data
      snapshots = next
      delete errors[runningDate]
    } else {
      errors[runningDate] = ["parser", "database", "profile", "busy", "size", "emptyCache", "decode", "date"].indexOf(data.error) !== -1 ? data.error : "decode"
    }
    failures = errors
  }
  onTodayChanged: {
    if (!initialized) return
    if (selectedDate === previousToday) selectedDate = today
    previousToday = today
    refresh()
  }
  Component.onCompleted: {
    selectedDate = today
    previousToday = today
    initialized = true
    refresh()
  }

  Timer { interval: 30000; repeat: true; running: root.pollingEnabled; onTriggered: root.now = new Date() }
  Timer { interval: Math.max(30, root.refreshSeconds) * 1000; repeat: true; running: root.pollingEnabled; onTriggered: root.refresh() }
  Timer { id: navigationDelay; interval: 200; onTriggered: root.enqueue(root.selectedDate) }
  Timer {
    id: watchdog
    interval: 45000
    onTriggered: {
      root.accept(JSON.stringify({ok: false, error: "busy"}))
      if (fetcher.running) fetcher.signal(15)
      else { root.runningDate = ""; root.pump() }
    }
  }
  Process {
    id: fetcher
    stdout: StdioCollector { waitForEnd: true; onStreamFinished: root.accept(text) }
    stderr: StdioCollector { waitForEnd: true }
    onExited: function() {
      watchdog.stop()
      if (!root.received) root.accept(JSON.stringify({ok: false, error: "decode"}))
      root.runningDate = ""
      Qt.callLater(root.pump)
    }
  }
}
