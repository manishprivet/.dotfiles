import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import Model from '../Model.js';

test('date navigation crosses month, year and leap-day boundaries', () => {
  assert.equal(Model.stepDate('2026-12-31', 1), '2027-01-01');
  assert.equal(Model.stepDate('2024-03-01', -1), '2024-02-29');
  assert.equal(Model.stepDate('2026-03-01', -1), '2026-02-28');
  assert.equal(Model.parseDate('2026-02-30'), null);
});
test('date navigation preserves civil days across daylight saving', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    `import M from ${JSON.stringify(new URL('../Model.js', import.meta.url).href)};
     if(M.stepDate('2026-03-08',1)!=='2026-03-09'||M.stepDate('2026-11-01',-1)!=='2026-10-31')process.exit(1);`],
  { env: { ...process.env, TZ: 'America/New_York' } });
  assert.equal(result.status, 0);
});
test('next-event selection excludes ended events and updates countdown locally', () => {
  const events = [{ start: 100, end: 200 }, { start: 300, end: 400 }];
  assert.equal(Model.nextEvent(events, 200), events[1]);
  assert.equal(Model.nextEvent(events, 400), null);
  assert.equal(Model.countdown({ start: 120000 }, 0).minutes, 2);
  assert.equal(Model.countdown({ start: 100 }, 100).kind, 'now');
});
test('successful reads stay fresh even when the calendar cache has not changed for days', () => {
  const now = Date.UTC(2026, 10, 7, 12);
  const snapshot = { fetchedAt: now, cacheModifiedAt: now - 7 * 86400000, events: [] };
  assert.equal(Model.isStale(snapshot, '', now), false);
  assert.equal(Model.isStale(snapshot, '', now + 300000), false);
  assert.equal(Model.isStale(snapshot, '', now + 300001), true);
  assert.equal(Model.isStale({ ...snapshot, fetchedAt: now + 300001 }, '', now + 300001), false);
});
test('failed reads mark retained snapshots stale, without treating initial loading as stale', () => {
  const now = Date.now();
  assert.equal(Model.isStale({ fetchedAt: now }, 'decode', now), true);
  assert.equal(Model.isStale(null, '', now), false);
  assert.equal(Model.isStale(null, 'decode', now), false);
});
test('untrusted titles are neutralized before shared shell labels or tooltips', () => {
  const safe = Model.sharedText('<img src="https://example.invalid/tracker"> & <b>Meeting</b>');
  assert.ok(!/[<>&]/.test(safe));
  assert.match(safe, /Meeting/);
});
test('event activation permits only explicit HTTPS Meet links, with no calendar fallback', () => {
  assert.ok(Model.safeMeetLink('https://meet.google.com/abc-defg-hij?authuser=0'));
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'https://www.google.com.evil.invalid/calendar/event',
    'https://www.google.com@evil.invalid/calendar/event', 'https://www.google.com/calendar/event?eid=fixture',
    'https://meet.google.com.evil.invalid/meeting', 'http://meet.google.com/abc-defg-hij', '', undefined]) assert.equal(Model.safeMeetLink(url), '');
});
test('hover text contains meeting details rather than usage instructions', () => {
  assert.equal(Model.meetingTooltip({ title: 'Planning', location: 'Room 2' }, '11:00 – 11:30', 'in 10m', 'Untitled event'),
    'Planning\n11:00 – 11:30 · in 10m\nRoom 2');
  const safe = Model.meetingTooltip({ title: '<img src="https://example.invalid/tracker">', location: '<b>Room</b>' }, '11:00 – 11:30', 'now', 'Untitled event');
  assert.ok(!/[<>&]/.test(safe));
  assert.ok(!safe.includes('click'));
  assert.equal(Model.meetingTooltip(null, '', '', ''), '');
});
