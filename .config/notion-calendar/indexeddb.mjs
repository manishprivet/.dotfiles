// Shared, read-only Notion Calendar cache reader for Quickshell and SketchyBar.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { constants, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync,
  rmSync, statSync } from 'node:fs';
import { homedir, platform as currentPlatform, tmpdir } from 'node:os';
import { join } from 'node:path';
import { expandSeries, recurrenceLines } from './recurrence.mjs';

const execute = promisify(execFile);
const databaseName = 'https_calendar.notion.so_0.indexeddb.leveldb';
const maxOutput = 32 * 1024 * 1024;
export class CalendarError extends Error {
  constructor(code) { super(code); this.code = code; }
}
export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return dateKey(date) === value ? date : null;
}
export function safeEventLink(value) {
  return typeof value === 'string' && value.length <= 8192 &&
    /^https:\/\/(?:calendar\.google\.com|www\.google\.com)\/calendar\/[^\s<>"\\\u0000-\u001f\u007f]*$/.test(value) ? value : '';
}
function safeMeetLink(value) {
  return typeof value === 'string' && value.length <= 8192 &&
    /^https:\/\/meet\.google\.com\/[^\s<>"\\\u0000-\u001f\u007f]*$/.test(value) ? value : '';
}
function text(value, max) { return typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, max) : ''; }
function eventTime(value) {
  if (typeof value?.dateTime === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value.dateTime)) return Date.parse(value.dateTime);
  const date = parseDate(value?.date);
  if (!date) return NaN;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function findDatabase({ database, platform = currentPlatform(), home = homedir(), configHome = join(home, '.config') } = {}) {
  if (database) {
    if (!existsSync(join(database, 'CURRENT'))) throw new CalendarError('database');
    return database;
  }
  if (platform === 'darwin') {
    const path = join(home, 'Library/Application Support/Notion Calendar/IndexedDB', databaseName);
    if (!existsSync(join(path, 'CURRENT'))) throw new CalendarError('database');
    return path;
  }
  const candidates = [];
  for (const browser of ['google-chrome', 'chromium', 'BraveSoftware/Brave-Browser', 'microsoft-edge', 'vivaldi']) {
    const root = join(configHome, browser);
    if (!existsSync(root)) continue;
    for (const profile of readdirSync(root)) {
      if (!/^(?:Default|Profile \d+)$/.test(profile)) continue;
      const path = join(root, profile, 'IndexedDB', databaseName);
      if (existsSync(join(path, 'CURRENT'))) candidates.push(path);
    }
  }
  if (candidates.length > 1) throw new CalendarError('profile');
  if (candidates.length === 0) throw new CalendarError('database');
  return candidates[0];
}

function inventory(database) {
  const files = readdirSync(database).filter(name => /^(?:CURRENT|MANIFEST-\d+|\d+\.(?:ldb|sst|log))$/.test(name)).sort();
  if (!files.includes('CURRENT')) throw new CalendarError('database');
  const result = files.map(name => {
    const stat = statSync(join(database, name), { bigint: true });
    if (!stat.isFile()) throw new CalendarError('database');
    return { name, size: Number(stat.size), modified: Number(stat.mtimeMs), fingerprint: `${stat.size}:${stat.mtimeNs}:${stat.ino}` };
  });
  if (result.length > 10000 || result.reduce((sum, file) => sum + file.size, 0) > 256 * 1024 * 1024) throw new CalendarError('size');
  return result;
}

export function copySnapshot(database, directory) {
  // This is a best-effort stable copy, not a transaction on Chrome's live database.
  // Never acquire its lock, open it with a writable LevelDB client, or alter originals.
  for (let attempt = 0; attempt < 3; attempt++) {
    const target = join(directory, `snapshot-${attempt}`, databaseName);
    try {
      const before = inventory(database);
      mkdirSync(target, { recursive: true, mode: 0o700 });
      for (const file of before) copyFileSync(join(database, file.name), join(target, file.name), constants.COPYFILE_FICLONE);
      const after = inventory(database);
      if (JSON.stringify(before) !== JSON.stringify(after)) continue;
      // The decoder expects a sibling blob directory even when no blobs are loaded.
      mkdirSync(target.replace(/\.leveldb$/, '.blob'), { mode: 0o700 });
      return { path: target, cacheModifiedAt: Math.max(...before.filter(f => /\.(?:ldb|sst|log)$/.test(f.name)).map(f => f.modified), 0) };
    } catch (error) {
      if (error instanceof CalendarError && error.code === 'size') throw error;
    }
  }
  throw new CalendarError('busy');
}

export function parseRecords(jsonl, diagnostics = '') {
  if (Buffer.byteLength(jsonl) > maxOutput || /Error parsing|Traceback|Failed to parse|Could not find|Error reading/i.test(diagnostics)) throw new CalendarError('decode');
  const records = [];
  for (const line of jsonl.split('\n')) {
    if (!line.trim()) continue;
    try {
      if (line.length > 4 * 1024 * 1024) throw new Error();
      records.push(JSON.parse(line));
    } catch { throw new CalendarError('decode'); }
    if (records.length > 50000) throw new CalendarError('size');
  }
  return records;
}

export function normalizeRecords(records, { date = dateKey(new Date()), now = Date.now(), cacheModifiedAt = now } = {}) {
  const day = date === null ? null : parseDate(date);
  if (date !== null && !day) throw new CalendarError('date');
  // A null date is the macOS adapter's rolling view, including the next midnight.
  const firstDay = day || new Date(now);
  firstDay.setHours(0, 0, 0, 0);
  const dayStart = firstDay.getTime();
  firstDay.setDate(firstDay.getDate() + (day ? 1 : 2));
  const dayEnd = firstDay.getTime();
  const latest = new Map();
  let eventRecords = 0;
  for (const record of records) {
    if (!record || record.recovered === true || record.type === 0 || record.type === 'DELETED') continue;
    const event = record.value?.value;
    if (event?.kind !== 'calendar#event') continue;
    eventRecords++;
    const id = text(event.id, 512), calendarId = text(event.calendarId, 512);
    if (!id) throw new CalendarError('decode');
    const identity = `${calendarId}:${id}:${event.originalStartTime?.dateTime || event.originalStartTime?.date || ''}`;
    const sequence = Number(record.sequence_number) || Date.parse(event.updated) || 0;
    if (!latest.has(identity) || latest.get(identity).sequence <= sequence) latest.set(identity, { event, sequence });
  }
  // A cache with no recognizable event records may be a changed schema or an unsynced app.
  if (eventRecords === 0) throw new CalendarError('emptyCache');
  const overrides = new Set();
  for (const { event } of latest.values()) {
    if (!event.recurringEventId) continue;
    const original = eventTime(event.originalStartTime);
    if (Number.isFinite(original)) overrides.add(`${event.calendarId || ''}:${event.recurringEventId}:${original}`);
  }
  const events = [];
  for (const { event } of latest.values()) {
    if (event.status === 'cancelled') continue;
    const attendees = Array.isArray(event.attendees) ? event.attendees : event.attendees?.values || [];
    const self = Array.isArray(attendees) ? attendees.find(person => person?.self === true) : null;
    if (self?.responseStatus === 'declined') continue;
    if (!self && event.creator?.self !== true && event.organizer?.self !== true) continue;
    const start = eventTime(event.start), end = eventTime(event.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new CalendarError('decode');
    let occurrences;
    try { occurrences = expandSeries(event, start, end, dayStart, dayEnd); }
    catch { throw new CalendarError('decode'); }
    const recurring = recurrenceLines(event).length > 0;
    for (const occurrence of occurrences) {
      if (occurrence.end <= dayStart || occurrence.start >= dayEnd) continue;
      if (recurring && overrides.has(`${event.calendarId || ''}:${event.id}:${occurrence.start}`)) continue;
      events.push({ id: text(event.id, 512) + (recurring ? `@${occurrence.start}` : ''), calendarId: text(event.calendarId, 512),
        title: text(event.summary, 300), location: text(event.location, 300), start: occurrence.start, end: occurrence.end,
        allDay: Boolean(event.start?.date), recurring: recurring || Boolean(event.recurringEventId),
        url: safeEventLink(event.htmlLink), meet: safeMeetLink(event.hangoutLink) });
    }
  }
  if (events.length > 20000) throw new CalendarError('size');
  events.sort((a, b) => a.start - b.start);
  return { ok: true, source: 'indexeddb', date, fetchedAt: now, cacheModifiedAt, events };
}

export async function readCalendar({ date = dateKey(new Date()), database, parser, home = homedir(), platform = currentPlatform(),
  configHome = process.env.XDG_CONFIG_HOME || join(home, '.config'), dataHome = process.env.XDG_DATA_HOME || join(home, '.local/share'),
  now = Date.now(), runner = execute, signal } = {}) {
  if (date !== null && !parseDate(date)) throw new CalendarError('date');
  const source = findDatabase({ database, platform, home, configHome });
  const command = parser || join(dataHome, 'notion-calendar/dfindexeddb/bin/dfindexeddb');
  if (!existsSync(command)) throw new CalendarError('parser');
  const directory = mkdtempSync(join(existsSync('/tmp/opencode') ? '/tmp/opencode' : tmpdir(), 'notion-calendar-'));
  try {
    const snapshot = copySnapshot(source, directory);
    let result;
    try {
      result = await runner(command, ['db', '-s', snapshot.path, '--format', 'chrome', '--use_manifest',
        '--filter_value', 'calendar#event', '-o', 'jsonl'],
      { encoding: 'utf8', timeout: 30000, killSignal: 'SIGKILL', maxBuffer: maxOutput, signal });
    } catch { throw new CalendarError('decode'); }
    return normalizeRecords(parseRecords(result.stdout, result.stderr), { date, now, cacheModifiedAt: snapshot.cacheModifiedAt });
  } finally { rmSync(directory, { recursive: true, force: true }); }
}
