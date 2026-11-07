// This model is shared by QML and Node tests, without Qt or network dependencies.
function dateKey(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
}

function pad(value) { return value < 10 ? "0" + value : String(value) }

function parseDate(key) {
  if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  var parts = key.split("-").map(Number)
  var date = new Date(parts[0], parts[1] - 1, parts[2], 12)
  return dateKey(date) === key ? date : null
}

function stepDate(key, days) {
  var date = parseDate(key)
  if (!date || !Number.isInteger(days)) return key
  // Calendar arithmetic, not 24-hour durations, preserves dates across DST.
  date.setDate(date.getDate() + days)
  return dateKey(date)
}

function safeMeetLink(value) {
  if (typeof value !== "string" || value.length > 8192) return ""
  return /^https:\/\/meet\.google\.com\/[^\s<>"\\\u0000-\u001f\u007f]*$/.test(value) ? value : ""
}

function nextEvent(events, now) {
  return (events || []).filter(function(event) { return event.end > now })
    .sort(function(a, b) { return a.start - b.start })[0] || null
}

function truncate(value, limit) {
  var text = String(value || "")
  return text.length > limit ? text.slice(0, limit - 1) + "…" : text
}

function sharedText(value) {
  // Shared shell tooltips can use AutoText. Neutralize markup before that boundary.
  return String(value || "").replace(/&/g, "＆").replace(/</g, "‹").replace(/>/g, "›")
}

function countdown(event, now) {
  if (event.start <= now) return { kind: "now", minutes: 0 }
  return { kind: "future", minutes: Math.max(1, Math.ceil((event.start - now) / 60000)) }
}

function meetingTooltip(event, timeRange, relativeTime, untitled) {
  if (!event) return ""
  var lines = [event.title || untitled, timeRange + (relativeTime ? " · " + relativeTime : "")]
  if (event.location) lines.push(event.location)
  return sharedText(lines.join("\n"))
}

if (typeof module !== "undefined") module.exports = {
  dateKey: dateKey, parseDate: parseDate, stepDate: stepDate, safeMeetLink: safeMeetLink,
  nextEvent: nextEvent, truncate: truncate, sharedText: sharedText, countdown: countdown,
  meetingTooltip: meetingTooltip
}
