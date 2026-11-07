import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { normalizeRecords } from '../indexeddb.mjs';

const calendarId = 'fixture@example.invalid';
const url = 'https://www.google.com/calendar/event?eid=fixture';
const series = (patch = {}) => ({ kind: 'calendar#event', id: 'daily-series', calendarId, summary: 'Fixture recurring event',
  creator: { self: true }, htmlLink: url,
  start: { dateTime: '2026-09-14T11:00:00+05:30', timeZone: 'Asia/Kolkata' },
  end: { dateTime: '2026-09-14T11:30:00+05:30', timeZone: 'Asia/Kolkata' },
  recurrence: { values: ['RRULE:FREQ=DAILY'] }, ...patch });
const record = value => ({ recovered: false, type: 1, sequence_number: 1, value: { value } });
const read = (events, date = '2026-11-07') => normalizeRecords(events.map(record), { date, now: Date.parse('2026-11-07T04:00:00Z') }).events;
const originalStartTime = { dateTime: '2026-11-07T11:00:00+05:30' };
const exception = (patch = {}) => ({ ...series(), id: 'daily-series-instance', recurrence: undefined,
  recurringEventId: 'daily-series', originalStartTime,
  start: { dateTime: originalStartTime.dateTime }, end: { dateTime: '2026-11-07T11:30:00+05:30' }, ...patch });

test('a cached daily master generates today’s missing occurrence', () => {
  const events = read([series()]);
  assert.equal(events.length, 1);
  assert.equal(events[0].start, Date.parse('2026-11-07T05:30:00Z'));
  assert.equal(events[0].end, Date.parse('2026-11-07T06:00:00Z'));
  assert.equal(events[0].recurring, true);
  assert.equal(events[0].url, url);
});
test('the rolling macOS view expands recurrence through the next midnight', () => {
  const events = read([series()], null);
  assert.equal(events.length, 2);
  assert.equal(events[1].start - events[0].start, 86400000);
});
test('weekday recurrence does not generate Saturday meetings', () => {
  assert.equal(read([series({ recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'] })]).length, 0);
});
test('monthly ordinal weekdays are expanded by the standard recurrence library', () => {
  const events = read([series({ recurrence: ['RRULE:FREQ=MONTHLY;BYDAY=1SA'] })]);
  assert.equal(events.length, 1);
});
test('COUNT and UTC UNTIL boundaries are honored in the series timezone', () => {
  assert.equal(read([series({ recurrence: ['RRULE:FREQ=DAILY;COUNT=3'] })]).length, 0);
  assert.equal(read([series({ recurrence: ['RRULE:FREQ=DAILY;UNTIL=20261107T052959Z'] })]).length, 0);
  assert.equal(read([series({ recurrence: ['RRULE:FREQ=DAILY;UNTIL=20261107T053000Z'] })]).length, 1);
});
test('EXDATE supports explicit timezones and UTC exclusions', () => {
  assert.equal(read([series({ recurrence: ['RRULE:FREQ=DAILY', 'EXDATE;TZID=Asia/Kolkata:20261107T110000'] })]).length, 0);
  assert.equal(read([series({ recurrence: ['RRULE:FREQ=DAILY', 'EXDATE:20261107T053000Z'] })]).length, 0);
});
test('RDATE can add an occurrence outside the weekly pattern', () => {
  assert.equal(read([series({ recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO', 'RDATE;TZID=Asia/Kolkata:20261107T110000'] })]).length, 1);
});
test('a cached explicit instance replaces, rather than duplicates, its generated occurrence', () => {
  const events = read([series(), exception()]);
  assert.equal(events.length, 1);
  assert.equal(events[0].id, 'daily-series-instance');
});
test('cancelled instances suppress only their own original occurrence', () => {
  assert.equal(read([series(), exception({ status: 'cancelled', start: undefined, end: undefined })]).length, 0);
  assert.equal(read([series(), exception({ status: 'cancelled', originalStartTime: { dateTime: '2026-11-06T11:00:00+05:30' } })]).length, 1);
});
test('moved instances suppress the original time and use their replacement time', () => {
  const events = read([series(), exception({ start: { dateTime: '2026-11-07T14:00:00+05:30' }, end: { dateTime: '2026-11-07T14:30:00+05:30' } })]);
  assert.equal(events.length, 1);
  assert.equal(events[0].start, Date.parse('2026-11-07T08:30:00Z'));
});
test('moving an instance to another day removes it from the original day', () => {
  const events = [series(), exception({ start: { dateTime: '2026-11-08T14:00:00+05:30' }, end: { dateTime: '2026-11-08T14:30:00+05:30' } })];
  assert.equal(read(events).length, 0);
  assert.equal(read(events, '2026-11-08').length, 2);
});
test('declining an individual occurrence does not resurrect the master occurrence', () => {
  assert.equal(read([series(), exception({ attendees: { values: [{ self: true, responseStatus: 'declined' }] } })]).length, 0);
});
test('all-day recurring events keep exclusive local end dates', () => {
  const events = read([series({ start: { date: '2026-09-14' }, end: { date: '2026-09-15' } })]);
  assert.equal(events.length, 1);
  assert.equal(events[0].allDay, true);
  assert.equal(new Date(events[0].start).getHours(), 0);
  assert.equal(new Date(events[0].end).getDate(), 8);
});
test('recurring wall-clock time follows DST in the event timezone', () => {
  const events = read([series({ start: { dateTime: '2026-02-20T09:00:00-05:00', timeZone: 'America/New_York' },
    end: { dateTime: '2026-02-20T09:30:00-05:00', timeZone: 'America/New_York' } })], '2026-03-09');
  assert.equal(events.length, 1);
  assert.equal(events[0].start, Date.parse('2026-03-09T13:00:00Z'));
});
test('event timezone expansion is independent of the desktop timezone', () => {
  const module = new URL('../indexeddb.mjs', import.meta.url).href;
  for (const timezone of ['UTC', 'Asia/Kolkata', 'America/Los_Angeles']) {
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import { normalizeRecords } from ${JSON.stringify(module)};
      const event = ${JSON.stringify(series({ start: { dateTime: '2026-02-20T09:00:00-05:00', timeZone: 'America/New_York' }, end: { dateTime: '2026-02-20T09:30:00-05:00', timeZone: 'America/New_York' } }))};
      const result=normalizeRecords([{type:1,recovered:false,value:{value:event}}],{date:'2026-03-09'});
      if(result.events.length!==1||result.events[0].start!==Date.parse('2026-03-09T13:00:00Z'))process.exit(1);
    `], { encoding: 'utf8', env: { ...process.env, TZ: timezone } });
    assert.equal(child.status, 0, `${timezone}: ${child.stderr}`);
  }
});
test('nonexistent DST wall-clock occurrences are skipped instead of silently rescheduled', () => {
  assert.equal(read([series({ start: { dateTime: '2026-02-20T02:30:00-05:00', timeZone: 'America/New_York' },
    end: { dateTime: '2026-02-20T03:00:00-05:00', timeZone: 'America/New_York' } })], '2026-03-08').length, 0);
});
test('invalid and unbounded high-frequency rules produce explicit errors', () => {
  for (const recurrence of [['RRULE:FREQ=SECONDLY'], ['RRULE:FREQ=INVALID'], ['RRULE:FREQ=DAILY\nX:bad']])
    assert.throws(() => read([series({ recurrence })]), { code: 'decode' });
});
