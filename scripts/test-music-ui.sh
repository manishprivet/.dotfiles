#!/usr/bin/env bash
# Exercise the real bar widget offscreen with fixtures, never the live API.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
tmp_base=${TMPDIR:-/tmp}
[[ ! -d /tmp/opencode ]] || tmp_base=/tmp/opencode
scratch=$(mktemp -d "$tmp_base/music-ui.XXXXXX")
trap 'status=$?; if (( status != 0 )); then cat "$scratch/requests.log" 2>/dev/null || true; fi; rm -rf "$scratch"' EXIT
mkdir -p "$scratch/config/omarchy" "$scratch/config/youtube-music" "$scratch/bin"
# Exercise the real QML Process/FIFO against a delayed local player fixture.
# No live API, playback commands or desktop-app launch is involved.
cat > "$scratch/bin/mise" <<'MISE'
#!/bin/bash
set -euo pipefail
[[ $1 == exec && $2 == node && $3 == -- ]]
shift 3
exec "$@"
MISE
chmod +x "$scratch/bin/mise"
printf '' > "$scratch/requests.log"
cat > "$scratch/config/youtube-music/cli.mjs" <<'JS'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { setTimeout } from "node:timers/promises";
const log = process.env.MUSIC_REQUEST_LOG;
const path = log + ".state";
const action = process.argv[2];
const state = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {track: 0, paused: false, elapsed: 35};
if (state.pending && Date.now() >= state.readyAt) Object.assign(state, state.pending, {pending: null});
if (action !== "status") {
  appendFileSync(log, "POST " + action + "\n");
  const desired = {...(state.pending || state)};
  if (action === "next") desired.track++;
  if (action === "previous") desired.track--;
  if (action === "toggle-play") desired.paused = !desired.paused;
  if (action === "next" || action === "previous") desired.elapsed = 0;
  if (action === "seek-to") desired.elapsed = Number(process.argv[3]);
  state.pending = {track: desired.track, paused: desired.paused, elapsed: desired.elapsed};
  state.readyAt = Date.now() + (action === "next" ? 1500 : 220);
}
appendFileSync(log, "GET " + action + "\n");
writeFileSync(path, JSON.stringify(state));
await setTimeout(70);
console.log(JSON.stringify({ok: true, available: true, title: "Track " + state.track,
  trackId: "fixture-" + state.track, label: "Track " + state.track + " - Fixture", artist: "Fixture", imageSrc: "",
  durationSeconds: 240, elapsedSeconds: state.elapsed, isPaused: state.paused}));
JS
printf 'en\n' > "$scratch/config/omarchy/language"
ln -s /usr/share/omarchy/shell/Commons "$scratch/Commons"
cp -R /usr/share/omarchy/shell/Ui "$scratch/Ui"
# Offscreen Qt has no layer-shell backend. Replace only the window host; keep
# the real player, controller and native buttons under test.
cat > "$scratch/Ui/KeyboardPanel.qml" <<'PANEL'
import QtQuick
Item {
  property Item anchorItem
  property var owner
  property var bar
  property bool open: false
  property bool centerOnBar: false
  property int contentWidth: 360
  property int contentHeight: 480
  property Item focusTarget
  property Component content
  readonly property Item loadedContent: loader.item
  function fittedContentWidth(value) { return value }
  function fittedContentHeight(value) { return value }
  Loader { id: loader; active: parent.open; sourceComponent: parent.content; width: parent.contentWidth; height: parent.contentHeight }
}
PANEL
ln -s "$ROOT/omarchy/.config/omarchy/plugins/manish.youtube-music" "$scratch/Music"
cat > "$scratch/cover.svg" <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="440" viewBox="0 0 440 440">
<rect width="440" height="440" fill="#252e35"/><circle cx="220" cy="220" r="156" fill="#b99970"/>
<circle cx="220" cy="220" r="100" fill="#252e35"/><circle cx="220" cy="220" r="24" fill="#b99970"/>
</svg>
SVG
cat > "$scratch/shell.qml" <<'QML'
import QtQuick
import Quickshell
import Quickshell.Io
import "Music" as Music

FloatingWindow {
  id: window
  implicitWidth: 420; implicitHeight: 640; visible: true
  color: "#141a1d"
  property var state: Music.MusicState
  property int requestPhase: 0
  property bool sawSwitching: false
  FileView { id: requestLog; path: Quickshell.env("MUSIC_REQUEST_LOG"); blockAllReads: true }
  function check(condition, message) { if (!condition) throw new Error(message) }
  function find(item, name) {
    if (item.objectName === name) return item
    var children = item.children || []
    for (var i = 0; i < children.length; i++) { var found = find(children[i], name); if (found) return found }
    return null
  }
  function checkRequests() {
    // Keep background polling off: every observed request must originate from
    // a click, the pending-refresh flag, or the bounded transition checks.
    state.requestsEnabled = true
    state.run("status")
    check(state.inFlight, "Status process did not start")
    var button = find(widget, "musicButton")
    button.pressed(Qt.LeftButton)
    check(state.refreshPending, "Open-click refresh was dropped while busy")
    var content = find(widget, "musicPanel").loadedContent
    check(content !== null, "Real player handlers did not load")
    check(find(content, "nextTrack").enabled, "Controls disabled during an in-flight status read")
    find(content, "nextTrack").clicked()
    find(content, "nextTrack").clicked()
    find(content, "previousTrack").clicked()
    find(content, "togglePlayback").clicked()
    check(state.actionQueue.map(function(request) {return request.action}).join(",") === "next,next,previous,toggle-play", "Rapid clicks overwritten or reordered")
    button.pressed(Qt.LeftButton)
    check(!widget.opened && state.refreshPending, "Close-click refresh was lost")
    requestChecks.start()
  }
  Music.BarWidget { id: widget; anchors.top: parent.top; anchors.horizontalCenter: parent.horizontalCenter }
  Music.PlayerContent {
    id: player
    anchors.fill: parent; anchors.margins: 24; anchors.topMargin: 64
    song: ({available: true, title: "Midnight Signals", trackId: "fixture-cover", artist: "Example Artist", album: "Offscreen fixture", durationSeconds: 240, elapsedSeconds: 65, isPaused: false})
    artwork: Quickshell.env("MUSIC_TEST_COVER")
    property var calls: []
    property var seeks: []
    onActionRequested: function(action) { calls.push(action) }
    onAppRequested: calls.push("open")
    onCloseRequested: calls.push("close")
    onSeekRequested: function(seconds, track) { seeks.push({seconds: seconds, track: track}) }
  }
  Timer {
    interval: 700; running: true
    onTriggered: {
      try {
        check(!state.pollingEnabled && !state.busy, "Test must not poll")
        state.accept(JSON.stringify({ok: true, available: true, label: '<img src="https://example.invalid/tracker"> & Song - Artist', isPaused: false}))
        check(widget.icon === "󰎆", "Playing icon missing")
        var button = find(widget, "musicButton")
        check(button.tooltipText.indexOf("<img") === -1, "Tooltip contains markup")
        check(button.tooltipText.split("\n").length === 2, "Tooltip must only contain track and playback state")
        check(find(player, "elapsedTime").text === "1:05" && find(player, "durationTime").text === "4:00", "Incorrect track time labels")
        var slider = find(player, "seekSlider")
        slider.moved(90)
        check(player.seeks.length === 0, "Dragging must not send a seek for every pixel")
        slider.released(90)
        check(player.seeks.length === 1 && player.seeks[0].seconds === 90 && player.seeks[0].track === "fixture-cover", "Slider release did not send a track-bound seek")
        slider.keyboardSeek(999)
        check(player.seeks[1].seconds === 240, "Keyboard seek was not clamped to track duration")
        check(button.text.length < 42, "Bar label is unbounded")
        state.accept(JSON.stringify({ok: true, available: true, label: "Song - Artist", isPaused: true}))
        check(widget.icon === "󰏤" && button.dimmed, "Paused state missing")
        state.runningAction = "toggle-play"
        state.accept('{"ok":false}')
        check(state.song.available && state.song.label === "Song - Artist", "Action failure erased current title")
        state.runningAction = "status"
        state.accept('{"ok":false}')
        check(!state.song.available && button.text.indexOf("YouTube Music") !== -1, "Unavailable state missing")
        state.accept('not json')
        check(!state.song.available, "Malformed JSON retained track")
        state.song = {available: true, label: "Song - Artist", isPaused: false, imageSrc: "https://i.ytimg.com/fixture.jpg"}
        state.acceptArtwork(JSON.stringify({ok: true, imageSrc: state.song.imageSrc, artwork: "https://example.invalid/tracker"}))
        check(state.artwork === "", "Remote image escaped the local-cache boundary")
        state.acceptArtwork(JSON.stringify({ok: true, imageSrc: "old-song", artwork: Quickshell.env("MUSIC_TEST_COVER")}))
        check(state.artwork === "", "Previous track's art was accepted")
        state.acceptArtwork(JSON.stringify({ok: true, imageSrc: state.song.imageSrc, artwork: Quickshell.env("MUSIC_TEST_COVER")}))
        check(state.artwork === Quickshell.env("MUSIC_TEST_COVER"), "Cached artwork was not accepted")
        button.pressed(Qt.LeftButton)
        check(widget.opened, "Left click did not open player")
        button.pressed(Qt.LeftButton)
        check(!widget.opened, "Second left click did not close player")
        find(player, "previousTrack").clicked()
        find(player, "togglePlayback").clicked()
        find(player, "nextTrack").clicked()
        find(player, "openMusic").clicked()
        find(player, "closePlayer").clicked()
        check(player.calls.join(",") === "previous,toggle-play,next,open,close", "Player controls failed")
        player.song = {available: true, title: '<b>Literal title</b>', artist: "Artist", isPaused: true}
        check(find(player, "songTitle").textFormat === Text.PlainText, "Track title is not plain text")
        check(find(player, "togglePlayback").text === "Play", "Paused button did not update")
        player.song = {available: false}
        check(!find(player, "nextTrack").enabled, "Unavailable controls must be disabled")
        check(!slider.enabled, "Unknown-duration/unavailable track must not be seekable")
        player.song = {available: true, title: "Midnight Signals", artist: "Example Artist", album: "Offscreen fixture", durationSeconds: 240, elapsedSeconds: 65, isPaused: false}
        screenshot.start()
      } catch (e) { console.error("FAIL music QML: " + e.message); Qt.exit(1) }
    }
  }
  Timer {
    id: screenshot; interval: 400
    onTriggered: {
      try {
        check(find(player, "albumArt").status === Image.Ready, "Fixture album art did not load")
        player.grabToImage(function(result) {
          check(result.saveToFile(Quickshell.env("MUSIC_SCREENSHOT")), "Screenshot failed")
          console.log("PASS music QML: popup toggle, album art, player controls, plain text and unavailable state")
          window.checkRequests()
        })
      } catch (e) { console.error("FAIL music QML: " + e.message); Qt.exit(1) }
    }
  }
  Timer {
    id: requestChecks; interval: 100; repeat: true
    onTriggered: {
      if (window.requestPhase === 1 && state.transitionAction === "next") {
        var activePopup = find(widget, "musicPanel").loadedContent
        window.sawSwitching = activePopup && find(activePopup, "playerUpdateStatus").text === "Switching track…"
      }
      if (state.busy || state.refreshPending || state.transitionAction) return
      try {
        requestLog.reload()
        var lines = requestLog.text().trim().split("\n")
        var posts = lines.filter(function(line) { return line.indexOf("POST ") === 0 })
        var expected = "POST next,POST next,POST previous,POST toggle-play" + (window.requestPhase >= 1 ? ",POST next" : "") + (window.requestPhase >= 2 ? ",POST seek-to" : "")
        check(posts.join(",") === expected, "Click POST order/count incorrect: " + lines.join("; "))
        for (var i = 0; i < lines.length; i++) {
          if (lines[i].indexOf("POST ") === 0) check(lines[i + 1] === "GET " + lines[i].slice(5), "Action lacks immediate refresh")
        }
        check(lines.filter(function(line) { return line === "GET status" }).length >= 4, "Pending clicks or settlement refreshes were dropped")
        check(!state.pollingEnabled, "Background poll contaminated the test")
        check(!state.refreshUnconfirmed, "Player transition was not confirmed")
        if (window.requestPhase === 0) {
          check(state.song.label === "Track 1 - Fixture" && state.song.isPaused, "Delayed player state did not converge without polling")
          window.requestPhase = 1
          widget.open()
          var content = find(widget, "musicPanel").loadedContent
          find(content, "nextTrack").clicked()
          check(state.actionQueue.some(function(request) {return request.action === "next"}) || state.transitionAction === "next", "Next was neither queued nor started")
          return
        }
        check(state.song.label === "Track 2 - Fixture", "Standalone popup Next did not refresh after a slow switch")
        check(window.sawSwitching, "Missing switching feedback")
        var popup = find(widget, "musicPanel").loadedContent
        check(find(popup, "songTitle").text === "Track 2", "Popup retained the old title")
        check(find(popup, "playerUpdateStatus").text === "", "Switching indicator did not clear")
        if (window.requestPhase === 1) {
          state.seek(60, "old-track")
          check(state.actionQueue.length === 0 && !state.busy, "Seek from an old track was accepted")
          window.requestPhase = 2
          find(popup, "seekSlider").released(120)
          check(state.pendingSeek === 120 && find(popup, "seekSlider").value === 120, "Seek preview did not update immediately")
          return
        }
        check(state.song.elapsedSeconds === 120, "Seek position never confirmed")
        check(find(popup, "elapsedTime").text === "2:00", "Popup time did not refresh after seek")
        state.beginTransition("next")
        state.transitionDeadline = Date.now() - 1
        state.expireTransition()
        check(!state.transitionAction && state.refreshUnconfirmed, "Transition deadline did not report an unconfirmed change")
        check(find(popup, "playerUpdateStatus").text !== "", "Unconfirmed change has no visible feedback")
        widget.close()
        console.log("PASS music requests: ordered controls, delayed Next, track-bound seek and refreshed time with polling disabled")
        Qt.quit()
      } catch (e) { console.error("FAIL music QML: " + e.message); Qt.exit(1) }
    }
  }
  Timer { interval: 20000; running: true; onTriggered: Qt.exit(1) }
}
QML
export YOUTUBE_MUSIC_TEST_MODE=1 QT_QPA_PLATFORM=offscreen QT_QUICK_BACKEND=software QT_FORCE_STDERR_LOGGING=1
export XDG_CONFIG_HOME="$scratch/config" OMARCHY_PATH=/usr/share/omarchy
export PATH="$scratch/bin:$PATH" MUSIC_REQUEST_LOG="$scratch/requests.log"
export MUSIC_TEST_COVER="file://$scratch/cover.svg?v=fixture" MUSIC_SCREENSHOT="$tmp_base/music-player.png"
quickshell --path "$scratch/shell.qml" --no-color 2>&1 | tee "$scratch/output"
grep -q 'PASS music QML:' "$scratch/output"
grep -q 'PASS music requests:' "$scratch/output"
if grep -Eq 'FAIL music QML:|TypeError:|ReferenceError:|Error loading configuration|Unable to assign' "$scratch/output"; then exit 1; fi
