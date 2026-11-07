import rrule from 'rrule';

const { rrulestr } = rrule;
const dayMs = 86400000;
const stamp = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

function readStamp(value) {
  if (!/^\d{8}(?:T\d{6}Z?)?$/.test(value)) throw new Error('Invalid recurrence date');
  return Date.UTC(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)),
    Number(value.slice(9, 11) || 0), Number(value.slice(11, 13) || 0), Number(value.slice(13, 15) || 0));
}

function wallClock(zone, fallbackOffset) {
  if (!zone) return { toWall: value => value + fallbackOffset, fromWall: value => value - fallbackOffset };
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: zone, calendar: 'gregory', numberingSystem: 'latn',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const toWall = value => {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map(part => [part.type, part.value]));
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  };
  return {
    toWall,
    fromWall(value) {
      // Solve the zone offset at the occurrence, not at the series' original date.
      // This preserves wall-clock meeting times when the zone changes for DST.
      let instant = value;
      for (let attempt = 0; attempt < 4; attempt++) {
        const next = value - (toWall(instant) - instant);
        if (next === instant) return instant;
        instant = next;
      }
      // RFC 5545 skips nonexistent local times rather than moving the meeting.
      return toWall(instant) === value ? instant : NaN;
    }
  };
}

export function recurrenceLines(event) {
  return Array.isArray(event.recurrence) ? event.recurrence : Array.isArray(event.recurrence?.values) ? event.recurrence.values : [];
}

export function expandSeries(event, start, end, from, until) {
  const lines = recurrenceLines(event);
  if (!lines.length) return [{ start, end }];
  if (lines.length > 100) throw new Error('Too many recurrence rules');
  const allDay = Boolean(event.start?.date);
  const offset = /([+-])(\d{2}):(\d{2})$/.exec(event.start?.dateTime || '');
  const offsetMs = offset ? (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3])) * 60000 : 0;
  const zone = typeof event.start?.timeZone === 'string' ? event.start.timeZone : null;
  const clock = allDay ? { toWall: value => value, fromWall: value => value } : wallClock(zone, offsetMs);
  const first = allDay ? readStamp(event.start.date.replace(/-/g, '')) : clock.toWall(start);
  const normalized = lines.map(line => {
    if (typeof line !== 'string' || line.length > 4096 || /[\r\n]/.test(line)) throw new Error('Invalid recurrence rule');
    if (line.startsWith('RRULE:')) {
      // Calendar meetings do not need unbounded second-by-second expansion.
      if (!/\bFREQ=(?:DAILY|WEEKLY|MONTHLY|YEARLY|HOURLY)(?:;|$)/.test(line)) throw new Error('Unsupported recurrence frequency');
      return line.replace(/UNTIL=(\d{8}T\d{6}Z)/, (match, value) => `UNTIL=${stamp(clock.toWall(readStamp(value)))}`);
    }
    const match = /^(EXDATE|RDATE)((?:;[^:]*)?):(.+)$/.exec(line);
    if (!match) throw new Error('Unsupported recurrence directive');
    const directiveZone = /;TZID=([^;]+)/.exec(match[2])?.[1];
    const directiveClock = directiveZone ? wallClock(directiveZone, 0) : clock;
    return `${match[1]}:${match[3].split(',').map(value => {
      const wall = readStamp(value);
      if (allDay || value.length === 8) return stamp(wall);
      const instant = value.endsWith('Z') ? wall : directiveClock.fromWall(wall);
      if (!Number.isFinite(instant)) throw new Error('Invalid recurrence exclusion');
      return stamp(clock.toWall(instant));
    }).join(',')}`;
  });
  const rules = rrulestr(`DTSTART:${stamp(first)}\n${normalized.join('\n')}`, { forceset: true });
  const duration = end - start;
  const dates = rules.between(new Date(from - duration - 2 * dayMs), new Date(until + 2 * dayMs), true,
    (date, index) => { if (index >= 500) throw new Error('Too many occurrences'); return true; });
  return dates.map(date => {
    let occurrenceStart, occurrenceEnd;
    if (allDay) {
      const civil = new Date(date);
      occurrenceStart = new Date(civil.getUTCFullYear(), civil.getUTCMonth(), civil.getUTCDate()).getTime();
      const originalStart = new Date(`${event.start.date}T12:00:00Z`);
      const originalEnd = new Date(`${event.end.date}T12:00:00Z`);
      const days = Math.round((originalEnd - originalStart) / dayMs);
      occurrenceEnd = new Date(civil.getUTCFullYear(), civil.getUTCMonth(), civil.getUTCDate() + days).getTime();
    } else {
      occurrenceStart = clock.fromWall(date.getTime());
      occurrenceEnd = occurrenceStart + duration;
    }
    return { start: occurrenceStart, end: occurrenceEnd };
  }).filter(value => Number.isFinite(value.start) && value.end > from && value.start < until);
}
