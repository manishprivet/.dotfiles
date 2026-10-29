# Session persistence for Rex

A macOS Lua extension that saves session structure and rebuilds it after a Rex
server restart. Like tab-numbers, it launches an event-driven `rex do` watcher;
it is not a native Rex extension format.

## Enable

The repository's `init.lua` already loads it:

```lua
require("extensions.session-persistence")
```

Run `rex config reload` to start saving. Config loading (including config check)
starts the launcher. It retries local server readiness up to 120 times (a 2-second
request timeout and 0.5-second pause per attempt), without starting a server.
The watcher uses a **120-second API timeout**, rather than Rex's default 10 seconds:
creating a session with several login shells can be slow immediately after boot.
The existing watcher keeps running across config reloads; reloading does **not**
hot-update watcher code. After editing the extension, stop its `rex do` process
then reload config. Do not stop the Rex server just to reload this extension.

Requires macOS `/usr/bin/shlock`. Set `REX_SESSION_PERSISTENCE_BIN` in the server's
environment to override the app-managed Rex CLI executable. Installation is
assumed to be under `$XDG_CONFIG_HOME/rex` (default `~/.config/rex`).

## Saved and restored

- Session/tab order and names, pane labels, nested split directions and ratios.
- Floating layers and their bounds/stacking order, pane focus, zoom, active tab.
- Working directories from foreground processes, falling back to the child
  process and then HOME. Without process information the original cwd is unknown.
- Fresh default shells, or the exact captured Claude Code/OpenCode conversation.
  Other running commands, editors, SSH connections, shell environment/history,
  scrollback, and process memory are not restored. Resource IDs change.
- Original tab names from tab-numbers ownership records, avoiding double prefixes.
  Arbitrary numeric labels are never stripped.

Remote/nonterminal blocks cause the entire save to fail closed, retaining the
previous snapshot. Detached blocks are not included in session views and are
not saved. Missing working directories can cause restoration to fail; repair
their `options.cwd` entries in the snapshot before retrying.

Changes are coalesced into saves once per second; process cwd is refreshed every
30 seconds as a fallback. A crash can lose changes since the last successful save.
Snapshots use atomic rename (not power-loss-proof fsync). Deliberately closing
sessions is saved too; this is not an archive of previously closed sessions.

## Restore safety and recovery

Automatic restore only runs when the server instance changed **and no sessions
exist**. Existing sessions are never merged, replaced, or duplicated. A client
creating a session before the watcher starts prevents auto-restore; subsequent
saves then describe those live sessions. Before adopting a new server instance,
the extension saves `before-restart.json` so this startup race does not erase
the only copy of the old layout. This is best-effort automation,
not a transactional server startup hook.

Before restoration, the watcher saves `restoring: true`. If restore fails or the
watcher dies partway through, it preserves the original snapshot and refuses to
save over a partial restore on the next invocation. Inspect the log and snapshot,
back up the snapshot, then either:

1. Close **only** the partially restored sessions you no longer need and run the
   watcher again against the empty server; or
2. Keep your live sessions, remove `restoring` from the snapshot, and restart the
   watcher to adopt/save the live state instead.

Never clear the marker without first inspecting and backing up the saved data.
After an API timeout, inspect live sessions before retrying: the server might
have completed a request despite the timeout. Do not automatically retry creates.
Snapshot options are allowlisted: commands and initial input are never replayed,
even if added to the JSON file. Agent resume commands are constructed separately
from validated agent type and conversation ID.

## Claude Code and OpenCode

The OpenCode TUI plugin lives at `~/.config/opencode/rex-session/tui.js` and is
enabled in `cli.json`. It records the currently displayed conversation (including
session switches), not the most recently modified conversation in the project.
The full-screen local TUI is supported; Mini and explicit remote server
connections are not captured. No shared-server environment is used for attribution.

Install/refresh Claude's global hooks, preserving existing settings and creating
a dated backup if changed:

```sh
python3 ~/.config/rex/extensions/session-persistence/install-claude-hook.py
```

SessionStart/UserPromptSubmit capture the exact Claude ID and cwd; SessionEnd
clears its record. Already-running Claude sessions are captured on their next
prompt (or when resumed). Nested subagents are ignored. Hooks disabled by policy
or `--bare` cannot record sessions.

Records live under `$XDG_STATE_HOME/rex/agent-sessions/<block-id>.json`, with mode
600 in a mode-700 directory. They contain IDs, cwd, and process identity, **never
prompts, transcripts, credentials, or arbitrary command arguments**. The watcher
requires the recorded PID/start time to match the pane's foreground process chain,
so exited agents and stale/inherited pane IDs do not reopen unrelated conversations.
Stale files are harmless but are not automatically pruned.

Restore launches only `claude --resume ID` or `opencode --session ID` in the
captured directory. It does not submit a prompt, retry tools, skip permissions,
or automatically continue interrupted work. Conversation data must still exist
in each agent's own storage. OpenCode can create a new empty session if a saved
ID no longer exists; this extension does not restore deleted conversation data.
Agent exit follows Rex's normal command-pane behavior, not a persistent shell.

After updating watcher code, its already-running process still uses the old
code until stopped and relaunched, or until the next server start. Reloading
`cli.json` applies the OpenCode plugin without restarting the OpenCode service.

## Files and manual use

State lives at `$XDG_STATE_HOME/rex/session-persistence/<host-id>-local/`
(default `~/.local/state/rex/...`), outside the dotfiles repo:

- `snapshot.json`: latest complete save (mode 600; containing directory mode 700).
- `before-restart.json`: pre-restart snapshot, replaced on the next detected
  instance change, not on every save. No TTL; not an unlimited backup history.
- `watcher.lock`: PID lock, automatically reclaimed once its owner exits.
- Launcher log: `$XDG_STATE_HOME/rex/session-persistence.log` (append-only).

Locks/state use the stable host ID, not the per-run server instance ID. If you
run multiple servers as the same account, assign each a different
`REX_SESSION_PERSISTENCE_SCOPE` (letters, digits, underscores, hyphens) in its
environment. Otherwise they share a lock/snapshot. The default launcher always
targets the local server, clearing inherited Rex target variables.

Manual foreground watcher (Ctrl+C stops it):

```sh
rex --timeout 120s do ~/.config/rex/extensions/session-persistence/watcher.lua --all
```

To disable: remove the `require` line and stop the watcher process. Keep the
snapshot for recovery. New invocations do not terminate an existing watcher.

## Tests

```sh
luajit .config/rex/extensions/session-persistence/test.lua
```

Tests use in-memory Rex mocks; they never create or close live sessions.
