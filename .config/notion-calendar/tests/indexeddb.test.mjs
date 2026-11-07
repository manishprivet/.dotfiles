import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { dateKey, parseDate, findDatabase, copySnapshot, parseRecords, normalizeRecords, readCalendar, safeEventLink } from '../indexeddb.mjs';

const day = '2026-11-07';
const start = new Date(2026, 10, 7, 10).getTime();
const event = (patch = {}) => ({ kind: 'calendar#event', id: 'fixture', calendarId: 'manish@example.invalid',
  summary: 'Planning', creator: { self: true },
  start: { dateTime: new Date(start).toISOString() }, end: { dateTime: new Date(start + 3600000).toISOString() },
  htmlLink: 'https://www.google.com/calendar/event?eid=fixture', hangoutLink: 'https://meet.google.com/fixture', ...patch });
const record = (value = event(), patch = {}) => ({ recovered: false, type: 1, sequence_number: 1, value: { value }, ...patch });
const normalize = records => normalizeRecords(records, { date: day, now: start, cacheModifiedAt: start - 1000 });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'indexeddb-test-'));
  const database = join(root, 'config/google-chrome/Default/IndexedDB/https_calendar.notion.so_0.indexeddb.leveldb');
  mkdirSync(database, { recursive: true });
  writeFileSync(join(database, 'CURRENT'), 'MANIFEST-000001\n');
  writeFileSync(join(database, 'MANIFEST-000001'), 'fixture-manifest');
  writeFileSync(join(database, '000001.log'), 'fixture-log');
  const parser = join(root, 'decoder');
  writeFileSync(parser, '#!/bin/sh\nexit 0\n', { mode: 0o700 });
  return { root, database, parser, clean: () => rmSync(root, { recursive: true, force: true }) };
}

test('dates are validated without UTC midnight shifts', () => {
  assert.equal(dateKey(parseDate(day)), day);
  assert.equal(parseDate('2026-02-30'), null);
});
test('browser cache discovery supports Linux profiles and the native macOS app', () => {
  const f = fixture();
  try {
    assert.equal(findDatabase({ home: f.root, platform: 'linux', configHome: join(f.root, 'config') }), f.database);
    const mac = join(f.root, 'Library/Application Support/Notion Calendar/IndexedDB/https_calendar.notion.so_0.indexeddb.leveldb');
    mkdirSync(mac, { recursive: true }); writeFileSync(join(mac, 'CURRENT'), 'fixture');
    assert.equal(findDatabase({ home: f.root, platform: 'darwin' }), mac);
  } finally { f.clean(); }
});
test('ambiguous profiles require an explicit choice', () => {
  const f = fixture();
  try {
    const second = f.database.replace('/Default/', '/Profile 1/');
    mkdirSync(second, { recursive: true }); writeFileSync(join(second, 'CURRENT'), 'fixture');
    assert.throws(() => findDatabase({ home: f.root, configHome: join(f.root, 'config'), platform: 'linux' }), { code: 'profile' });
    assert.equal(findDatabase({ database: second }), second);
  } finally { f.clean(); }
});
test('snapshots never change or lock original files, and blobs are only created privately', () => {
  const f = fixture();
  try {
    const before = statSync(join(f.database, '000001.log')).mtimeMs;
    const result = copySnapshot(f.database, join(f.root, 'private'));
    assert.notEqual(result.path, f.database);
    assert.equal(readFileSync(join(result.path, '000001.log'), 'utf8'), 'fixture-log');
    assert.equal(statSync(join(f.database, '000001.log')).mtimeMs, before);
    assert.ok(!existsSync(f.database.replace(/\.leveldb$/, '.blob')));
    assert.ok(existsSync(result.path.replace(/\.leveldb$/, '.blob')));
    assert.ok(!existsSync(join(result.path, 'LOCK')));
  } finally { f.clean(); }
});
test('decoder diagnostics and malformed output are never treated as an empty calendar', () => {
  assert.throws(() => parseRecords('{}\n', 'Error parsing record'), { code: 'decode' });
  assert.throws(() => parseRecords('{}\n', 'Could not find an active table'), { code: 'decode' });
  assert.throws(() => parseRecords('{broken'), { code: 'decode' });
  assert.throws(() => normalize([]), { code: 'emptyCache' });
});
test('record normalization preserves plain titles, local-cache metadata and safe links', () => {
  const title = '<img src="https://example.invalid/tracker"> $(do-not-execute)';
  const result = normalize([record(event({ summary: title }))]);
  assert.equal(result.source, 'indexeddb');
  assert.equal(result.cacheModifiedAt, start - 1000);
  assert.equal(result.events[0].title, title);
  assert.equal(result.events[0].url, event().htmlLink);
  assert.equal(result.events[0].meet, event().hangoutLink);
});
test('newer cancellations supersede older live records', () => {
  const result = normalize([record(), record(event({ status: 'cancelled' }), { sequence_number: 2 })]);
  assert.equal(result.events.length, 0);
});
test('recovered and deleted records do not leak old meetings back into the agenda', () => {
  const result = normalize([record(), record(event({ id: 'recovered' }), { recovered: true }), record(event({ id: 'deleted' }), { type: 0 })]);
  assert.equal(result.events.length, 1);
});
test('declined meetings and other people’s cached events are excluded', () => {
  const result = normalize([record(event({ attendees: { values: [{ self: true, responseStatus: 'declined' }] } })),
    record(event({ id: 'other', creator: { self: false } }))]);
  assert.equal(result.events.length, 0);
});
test('a self attendee is included even when someone else created the meeting', () => {
  assert.equal(normalize([record(event({ creator: { self: false }, attendees: { values: [{ self: true, responseStatus: 'accepted' }] } }))]).events.length, 1);
});
test('all-day end dates are exclusive; a requested day only includes overlapping events', () => {
  const allDay = record(event({ start: { date: day }, end: { date: '2026-11-08' } }));
  assert.equal(normalize([allDay]).events[0].allDay, true);
  assert.equal(normalizeRecords([allDay], { date: '2026-11-08' }).events.length, 0);
});
test('unsafe event links cannot be launched', () => {
  for (const link of ['javascript:alert(1)', 'file:///etc/passwd', 'https://www.google.com@evil.invalid/calendar/event']) assert.equal(safeEventLink(link), '');
});
test('reading uses only the pinned external decoder and cleans snapshots on success or failure', async () => {
  const f = fixture(); let copiedPath;
  try {
    const result = await readCalendar({ date: day, database: f.database, parser: f.parser,
      runner: async (command, args, options) => {
        assert.equal(command, f.parser); copiedPath = args[2];
        assert.notEqual(copiedPath, f.database);
        assert.ok(args.includes('--use_manifest'));
        assert.equal(options.timeout, 30000);
        return { stdout: JSON.stringify(record()), stderr: '' };
      } });
    assert.equal(result.events.length, 1);
    assert.ok(!existsSync(copiedPath));
    await assert.rejects(readCalendar({ date: day, database: f.database, parser: f.parser, runner: async (command, args) => {
      copiedPath = args[2]; throw new Error('private decoder diagnostics');
    } }), { code: 'decode' });
    assert.ok(!existsSync(copiedPath));
  } finally { f.clean(); }
});
test('CLI works through chezmoi symlinks and rejects invalid dates before reading a cache', () => {
  const f = fixture();
  try {
    symlinkSync(new URL('../', import.meta.url), join(f.root, 'linked'));
    const child = spawnSync(process.execPath, [join(f.root, 'linked/cli.mjs'), '--date', 'invalid'], { encoding: 'utf8' });
    assert.equal(child.status, 1);
    assert.deepEqual(JSON.parse(child.stdout), { ok: false, error: 'date' });
  } finally { f.clean(); }
});
test('the AeroSpace/SketchyBar adapter uses the shared decoder with bounded argv-only updates', () => {
  const f = fixture();
  try {
    const dataHome = join(f.root, 'data');
    const parser = join(dataHome, 'notion-calendar/dfindexeddb/bin/dfindexeddb');
    mkdirSync(join(dataHome, 'notion-calendar/dfindexeddb/bin'), { recursive: true });
    const now = Date.now();
    const upcoming = record(event({ start: { dateTime: new Date(now + 600000).toISOString() }, end: { dateTime: new Date(now + 2400000).toISOString() } }));
    writeFileSync(parser, '#!/bin/sh\nprintf \'%s\\n\' \'' + JSON.stringify(upcoming).replace(/'/g, "'\\''") + '\'\n', { mode: 0o700 });
    const commands = join(f.root, 'commands');
    writeFileSync(join(f.root, 'sketchybar'), '#!/bin/sh\nprintf \'%s\\n\' "$@" >> "' + commands + '"\n', { mode: 0o700 });
    const child = spawnSync(process.execPath, [new URL('../../sketchybar/plugins/cron.js', import.meta.url).pathname],
      { encoding: 'utf8', env: { ...process.env, HOME: f.root, XDG_DATA_HOME: dataHome, XDG_CONFIG_HOME: join(f.root, 'config'), PATH: f.root + ':' + process.env.PATH } });
    assert.equal(child.status, 0, child.stderr);
    assert.match(readFileSync(commands, 'utf8'), /Planning/);
    assert.match(readFileSync(commands, 'utf8'), /open -n 'https:\/\/meet.google.com\/fixture'/);
    upcoming.value.value.hangoutLink = undefined;
    writeFileSync(parser, '#!/bin/sh\nprintf \'%s\\n\' \'' + JSON.stringify(upcoming).replace(/'/g, "'\\''") + '\'\n', { mode: 0o700 });
    writeFileSync(commands, '');
    const noMeet = spawnSync(process.execPath, [new URL('../../sketchybar/plugins/cron.js', import.meta.url).pathname],
      { encoding: 'utf8', env: { ...process.env, HOME: f.root, XDG_DATA_HOME: dataHome, XDG_CONFIG_HOME: join(f.root, 'config'), PATH: f.root + ':' + process.env.PATH } });
    assert.equal(noMeet.status, 0, noMeet.stderr);
    assert.ok(!readFileSync(commands, 'utf8').includes('click_script=open'));
    assert.ok(!readFileSync(commands, 'utf8').includes(upcoming.value.value.htmlLink));
  } finally { f.clean(); }
});
