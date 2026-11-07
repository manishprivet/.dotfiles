#!/usr/bin/env node
import { readCalendar, CalendarError, parseDate } from './indexeddb.mjs';

const abort = new AbortController();
process.once('SIGTERM', () => abort.abort());
try {
  const args = process.argv.slice(2);
  if ((args.length !== 2 && args.length !== 4) || args[0] !== '--date' || !parseDate(args[1]) ||
    (args.length === 4 && args[2] !== '--database')) throw new CalendarError('date');
  const result = await readCalendar({ date: args[1], database: args[3], signal: abort.signal });
  console.log(JSON.stringify(result));
} catch (error) {
  const code = error instanceof CalendarError ? error.code : 'database';
  console.log(JSON.stringify({ ok: false, error: code }));
  console.error(`Notion Calendar cache unavailable (${code}).`);
  process.exitCode = 1;
}
