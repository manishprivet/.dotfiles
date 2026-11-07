// Neutralize markup before text crosses into the shell's shared tooltip UI.
function sharedText(value) {
  return String(value || "").replace(/&/g, "＆").replace(/</g, "‹").replace(/>/g, "›")
}
function truncate(value, limit) {
  var text = String(value || "")
  return text.length > limit ? text.slice(0, limit - 1) + "…" : text
}
function songIdentity(song) {
  return song && song.available ? song.trackId || song.label || "" : ""
}
function positionAt(song, snapshotAt, now) {
  if (!song || !song.available) return 0
  var elapsed = Number(song.elapsedSeconds) || 0
  if (!song.isPaused && snapshotAt > 0) elapsed += Math.max(0, now - snapshotAt) / 1000
  return Math.max(0, Math.min(Number(song.durationSeconds) || 0, elapsed))
}
function formatTime(seconds) {
  var value = Math.max(0, Math.floor(Number(seconds) || 0))
  var minutes = Math.floor(value / 60) % 60
  var hours = Math.floor(value / 3600)
  var tail = (value % 60 < 10 ? "0" : "") + value % 60
  return hours ? hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + tail : minutes + ":" + tail
}
function transitionConfirmed(action, before, after, target) {
  if (!after || !after.available) return false
  if (action === "open") return true
  if (action === "seek-to") return songIdentity(before) === songIdentity(after) &&
    Number.isFinite(target) && Number.isFinite(after.elapsedSeconds) && Math.abs(after.elapsedSeconds - target) <= 2
  if (!before || !before.available) return action !== "toggle-play"
  if (action === "toggle-play") return after.isPaused !== before.isPaused
  // Prefer the actual video identity: different recordings can share a title.
  var changed = before.trackId && after.trackId ? before.trackId !== after.trackId : before.label !== after.label
  if (changed) return true
  // Previous may restart the current track instead of changing its identity.
  return action === "previous" && Number(before.elapsedSeconds) > 2 &&
    Number(after.elapsedSeconds) < Number(before.elapsedSeconds) - 1
}
if (typeof module !== "undefined") module.exports = {
  sharedText: sharedText, truncate: truncate, songIdentity: songIdentity,
  positionAt: positionAt, formatTime: formatTime, transitionConfirmed: transitionConfirmed
}
