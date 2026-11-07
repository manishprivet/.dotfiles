// Read-only validation against the running compositor; does not send any keys.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const errors = execFileSync('hyprctl', ['configerrors'], { encoding: 'utf8' }).trim();
assert.equal(errors, '', `Hyprland config errors: ${errors}`);
const binds = JSON.parse(execFileSync('hyprctl', ['binds', '-j'], { encoding: 'utf8' }));

function binding(key, modmask, description) {
  const matches = binds.filter(b => b.submap === '' && b.modmask === modmask && b.key.toLowerCase() === key.toLowerCase());
  assert.equal(matches.length, 1, `Expected exactly one binding for ${description}`);
  assert.equal(matches[0].description, description);
  return matches[0];
}

for (const [key, mods, description] of [
  ['Q', 64, 'Close window'],
  ['W', 64, 'Close tab'],
  ['C', 64, 'Universal copy'],
  ['V', 64, 'Universal paste'],
  ['X', 64, 'Universal cut'],
  ['A', 64, 'Select all'],
  ['Z', 64, 'Undo'],
  ['S', 64, 'Save'],
  ['T', 64, 'New tab'],
  ['TAB', 64, 'Last focused window'],
  ['F', 68, 'Toggle fullscreen'],
  ['L', 65, 'Cycle workspace layout'],
  ['3', 65, 'Screenshot fullscreen'],
  ['4', 65, 'Screenshot region'],
  ['5', 65, 'Capture menu'],
  ['I', 64, 'Switch input language'],
  ['V', 68, 'Clipboard manager'],
]) binding(key, mods, description);

assert(binding('XF86PowerOff', 0, 'Power menu').locked);
assert(binding('minus', 9, 'AeroSpace: shrink split').repeat);
assert(binding('equal', 9, 'AeroSpace: grow split').repeat);
// 0.56's Lua bindings report the legacy `mouse` field as false even when the
// mouse chord dispatches drag/resize; validate the chord, not that legacy flag.
binding('mouse:272', 64, 'Move window');
binding('mouse:273', 64, 'Resize window');
for (const b of binds.filter(b => b.description.startsWith('AeroSpace:'))) {
  assert(b.key || b.keycode || b.catch_all, `Unusable live binding: ${b.description}`);
}
console.log('Live Hyprland bindings passed: clipboard, app shortcuts, power, capture, mouse and resize keys');
