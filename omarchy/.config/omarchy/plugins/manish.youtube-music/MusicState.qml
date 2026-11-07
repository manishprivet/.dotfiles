pragma Singleton
import QtQuick
import Quickshell
import Quickshell.Io
import "Model.js" as Model

Item {
  id: root
  // Shared across monitors; remove the bar entry to stop polling.
  property bool pollingEnabled: Quickshell.env("YOUTUBE_MUSIC_TEST_MODE") !== "1"
  property bool requestsEnabled: pollingEnabled
  property var song: ({available: false})
  property double songReceivedAt: 0
  property bool received: false
  property var actionQueue: []
  property bool refreshPending: false
  property bool inFlight: false
  property string transitionAction: ""
  property string lastTransitionAction: ""
  property var transitionBefore: null
  property real transitionTarget: -1
  property double transitionDeadline: 0
  property bool refreshUnconfirmed: false
  property string runningAction: "status"
  property string artwork: ""
  property string artworkSong: ""
  property string requestedArtwork: ""
  readonly property bool busy: inFlight || actionQueue.length > 0
  readonly property real pendingSeek: {
    for (var i = actionQueue.length - 1; i >= 0; i--)
      if (actionQueue[i].action === "seek-to" && actionQueue[i].track === Model.songIdentity(song)) return actionQueue[i].seconds
    return transitionAction === "seek-to" ? transitionTarget : -1
  }
  readonly property string configHome: Quickshell.env("XDG_CONFIG_HOME") || Quickshell.env("HOME") + "/.config"
  function run(action) {
    if (!requestsEnabled) return
    if (action === "status") refreshPending = true
    else if (["toggle-play", "previous", "next"].indexOf(action) !== -1) actionQueue = actionQueue.concat([{action: action}])
    else return
    pump()
  }
  function seek(seconds, track) {
    if (!requestsEnabled || !song.available || !(song.durationSeconds > 0) ||
        !Number.isFinite(seconds) || track !== Model.songIdentity(song)) return
    actionQueue = actionQueue.concat([{action: "seek-to", track: track,
      seconds: Math.max(0, Math.min(song.durationSeconds, Math.round(seconds)))}])
    pump()
  }
  function pump() {
    if (!requestsEnabled || inFlight || fetcher.running) return
    var action
    var target = -1
    // Never replay a control command. Each queued click gets exactly one POST
    // and its own immediate GET; status reads can safely coalesce behind them.
    // Confirm the previous transition before starting another control. Otherwise
    // the first skip's late result could falsely confirm the second skip.
    if (actionQueue.length && !transitionAction) {
      var request = actionQueue[0]
      action = request.action
      actionQueue = actionQueue.slice(1)
      // A drag begun on the old track must never seek a newly loaded song.
      if (action === "seek-to" && request.track !== Model.songIdentity(song)) { Qt.callLater(root.pump); return }
      if (action === "seek-to") target = request.seconds
      settle.stop()
      beginTransition(action)
      transitionTarget = target
    } else if (refreshPending) {
      action = "status"
      refreshPending = false
    } else return
    inFlight = true
    received = false
    runningAction = action
    fetcher.command = ["mise", "exec", "node", "--", "node", configHome + "/youtube-music/cli.mjs", action]
      .concat(action === "seek-to" ? [String(target)] : [])
    watchdog.restart()
    fetcher.running = true
  }
  function accept(text) {
    received = true
    var data
    try { data = JSON.parse(text) } catch (e) { data = {} }
    if (data.ok === true && data.available === true && typeof data.label === "string" &&
        data.label.length <= 1027 && typeof data.isPaused === "boolean") {
      songReceivedAt = Date.now()
      song = data
      if ((transitionAction || refreshUnconfirmed) && Model.transitionConfirmed(lastTransitionAction, transitionBefore, data, transitionTarget)) {
        transitionAction = ""
        refreshUnconfirmed = false
        settle.stop()
      }
    }
    // A transient action/track-transition failure must not erase the current title.
    // The follow-up status read still clears it if the API is really unavailable.
    else if (runningAction === "status" && !transitionAction) song = {available: false}
    expireTransition()
  }
  function beginTransition(action) {
    transitionAction = action
    lastTransitionAction = action
    transitionBefore = song
    transitionTarget = -1
    transitionDeadline = Date.now() + 8000
    refreshUnconfirmed = false
  }
  function expireTransition() {
    if (transitionAction && Date.now() >= transitionDeadline) {
      transitionAction = ""
      refreshUnconfirmed = true
      settle.stop()
      Qt.callLater(root.pump)
    }
  }
  function finishRequest() {
    if (!inFlight) return
    watchdog.stop()
    if (!received && runningAction === "status" && !transitionAction) song = {available: false}
    inFlight = false
    // A 204 acknowledges the command, not the new track. Keep reading until
    // its identity/playback state really changes, or report the deadline.
    expireTransition()
    if (transitionAction) settle.restart()
    // Defer until Process has fully finished; clicks arriving meanwhile still
    // enter the FIFO and cannot overwrite an earlier action or lose a refresh.
    Qt.callLater(root.pump)
  }
  function openApp() {
    Quickshell.execDetached(["mise", "exec", "node", "--", "node", configHome + "/youtube-music/cli.mjs", "open"])
    // Refresh now, then briefly retry while a newly launched player starts.
    beginTransition("open")
    run("status")
  }
  function loadArtwork() {
    var url = song.available ? song.imageSrc || "" : ""
    if (url !== artworkSong) { artwork = ""; artworkSong = "" }
    if (!pollingEnabled || !url || url === artworkSong || coverFetcher.running) return
    requestedArtwork = url
    coverFetcher.command = ["mise", "exec", "node", "--", "node", configHome + "/youtube-music/cli.mjs", "artwork", url]
    coverWatchdog.restart()
    coverFetcher.running = true
  }
  function acceptArtwork(text) {
    var data
    try { data = JSON.parse(text) } catch (e) { return }
    if (data.ok === true && data.imageSrc === song.imageSrc && typeof data.artwork === "string" &&
        data.artwork.length < 8192 && /^file:\/\/\//.test(data.artwork)) {
      artwork = data.artwork
      artworkSong = data.imageSrc
    }
  }
  Component.onCompleted: { if (pollingEnabled) run("status") }
  Timer {
    interval: 10000; repeat: true; running: root.pollingEnabled
    // Polling is only for changes made outside the widget. Clicks use run().
    onTriggered: if (!root.busy && !root.refreshPending && !root.transitionAction) root.run("status")
  }
  Timer {
    id: settle
    interval: 200
    onTriggered: {
      root.expireTransition()
      if (root.transitionAction) root.run("status")
    }
  }
  Timer { id: coverWatchdog; interval: 6000; onTriggered: coverFetcher.signal(9) }
  Process {
    id: coverFetcher
    stdout: StdioCollector { waitForEnd: true; onStreamFinished: root.acceptArtwork(text) }
    stderr: StdioCollector { waitForEnd: true }
    onExited: {
      coverWatchdog.stop()
      // If a track changed during the download, load its cover instead.
      if (root.song.available && root.song.imageSrc !== root.requestedArtwork) Qt.callLater(root.loadArtwork)
    }
  }
  Timer {
    id: watchdog; interval: 8000
    onTriggered: {
      if (root.runningAction === "status" && !root.transitionAction) root.song = {available: false}
      if (fetcher.running) fetcher.signal(9)
      else root.finishRequest()
    }
  }
  Process {
    id: fetcher
    stdout: SplitParser { onRead: data => root.accept(data) }
    stderr: StdioCollector { waitForEnd: true }
    onExited: root.finishRequest()
  }
}
