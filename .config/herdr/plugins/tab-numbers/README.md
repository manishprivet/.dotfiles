# Tab Numbers

A local Herdr 0.9.5+ plugin that turns `editor` into `1: editor`. Numbers come
from Herdr's tab list order within each Space, matching indexed tab shortcuts.
They stay consecutive after tabs close or move; the API's stable `number` field
is not used as a position.
Requires Python 3 on macOS or Linux; no additional packages or daemon needed.

## Install

```sh
herdr plugin link ~/.config/herdr/plugins/tab-numbers
herdr plugin action invoke local.tab-numbers.refresh
```

Startup and tab-created/closed/moved/renamed hooks maintain numbering. A
pane-closed hook also handles removing a tab by closing its last pane, and a
pane-exited hook handles shell exits (including `exit` and Ctrl+D). Linking
does not run the startup hook, so invoke `refresh` once after linking. Plugin
registration is global; refresh each already-running session separately if needed.
After changing manifest hooks, run `herdr plugin link` again to update the
registered hooks; editing the manifest alone does not reload them.

## Remove or resume numbering

```sh
herdr plugin action invoke local.tab-numbers.remove
herdr plugin action invoke local.tab-numbers.refresh
```

`remove` restores plugin-owned titles and pauses automatic numbering for that
session, including after restart. `refresh` resumes it. To uninstall, first run
`remove` in each numbered session, then `herdr plugin unlink local.tab-numbers`.
Unlinking alone does not undo title changes.

## Behavior and limitations

- This changes real tab names, not just the tab bar's appearance. Names appear
  numbered in the sidebar and API too.
- Manual renames become the new original title. When renaming, enter the plain
  title without its displayed number; arbitrary numeric title text is preserved.
- Only exact labels recorded as plugin-owned are unwrapped. State loss cannot
  safely distinguish an old plugin prefix from a literal user-authored title.
- State and locks are scoped by socket path under `HERDR_PLUGIN_STATE_DIR` so
  sessions with overlapping tab IDs do not share numbering state.
- Hooks serialize with a lock and skip unchanged names to prevent rename loops.
  Updates are eventually consistent, not atomic with the user's tab operation.
- No shell commands are constructed from tab titles; CLI arguments are passed
  directly using `HERDR_BIN_PATH`.

## Tests

From this directory:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v
```
