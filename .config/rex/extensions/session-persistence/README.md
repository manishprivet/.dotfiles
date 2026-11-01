# Exact agent resumption with native Rex persistence

Use Rex's normal **app-managed server and native persistence**. No custom server,
startup flags, or custom layout restoration is required. Rex owns sessions, tabs,
panes and layouts; this integration only tracks Claude/OpenCode conversations.

## Startup behavior

Claude lifecycle hooks and the local OpenCode TUI plugin capture exact session
IDs, cwd, pane/session IDs, PID and process start identity. A detached watcher
matches these to the pane's foreground process chain and saves `agents.json`.

At a restored interactive Fish shell's first prompt, a helper checks:

- The same native-restored pane/session IDs and a different server instance.
- The old agent process is gone, using PID plus start identity.
- It belongs to the top-level shell, not a nested shell or busy pane.
- The agent ID, executable and working directory are valid.
- No launch claim has already been consumed for this pane/server instance.

The helper publishes a private readiness file valid for 120 seconds. The watcher
checks only prior-instance restore candidates every 500 ms, for up to 120 seconds
after watcher startup. It validates the foreground Fish PID and start identity,
persists a request, then sends one wake-up key (Ctrl+Alt+Shift+F12). It never types
a resume command or clears the terminal input buffer. After the deadline or once
all candidates are handled, the timer performs no filesystem/process checks.

The Fish binding refuses to overwrite **any existing command-line input**, checks
the request and process attribution again, and consumes an at-most-once claim.
The helper returns **NUL-delimited data, not shell code**. Fish escapes each field
and executes `cd -- CWD; and command AGENT FLAG ID` as a normal foreground job.
Rex sees the agent's foreground process; **Fish remains after the agent exits**.
The Python helper exits before the agent starts and does not supervise it.

Skipped, failed or uncertain launches are never automatically retried. Typed
input can therefore intentionally prevent restoration. The wake-up shares the
terminal input stream: a foreground change between the watcher's check and write
can deliver that key to another program, but never a literal resume command.
The shell-side binding is the final authority on whether a resume is permitted.
There is no agent prompt submission, automatic continuation, permission bypass,
or arbitrary saved command replay.

Set `REX_AGENT_RESUME_DISABLE=1` in the shell environment to skip startup resumption.
Ordinary new panes, nested/noninteractive shells and same-instance shell restarts
do not qualify. Existing live agents are not relaunched by a config reload; their
old wrapper chain remains until the next server restart. During migration, the
watcher recognizes their verified startup-helper/foreground-Fish parent chain.

## Installation and state

Rex's `init.lua` loads `extensions.session-persistence`. Fish loads
`conf.d/rex-agent-resume.fish`. OpenCode's `cli.json` enables `./rex-session`.
Install Claude hooks with:

```sh
python3 ~/.config/rex/extensions/session-persistence/install-claude-hook.py
```

Existing Claude sessions capture on their next prompt. The installer preserves
other settings and creates a dated backup. OpenCode tracks the currently displayed
conversation in its local full-screen TUI; Mini/explicit remote servers are not
supported. No prompts, transcripts, credentials or arbitrary command arguments
are stored.

State is under `$XDG_STATE_HOME/rex` (default `~/.local/state/rex`):

- `agent-sessions/<block-id>.json`: live capture records.
- `session-persistence/<host-id>-local/agents.json`: attributed agent metadata.
- `session-persistence/<host-id>-local/claims/`: at-most-once claims/locks.
- `session-persistence/<host-id>-local/readiness/`: expiring ready/request markers.
- `session-persistence/<host-id>-local/watcher.lock`: watcher PID lock.
- `session-persistence.log`: append-only diagnostics.

Private metadata uses mode 600 in a mode-700 directory, with atomic rename (not
power-loss-proof fsync). Saves refresh about every two seconds. Pending candidates
survive watcher startup until consumed; closed panes and exited same-instance
agents disappear from successful saves. Claims are retained, not automatically
pruned. IDs must survive Rex native restore; mismatched IDs fail closed instead
of matching names/positions. History must still exist in each agent's storage;
OpenCode may create an empty session if a saved ID was deleted.

All legacy/custom snapshots and recovery copies remain untouched. The old
`state.lua`, `launch-agent.py` and `start-custom-server.sh` are inactive recovery/
experimental code, **not used by the watcher or app startup**. Do not use the
custom-server script for normal operation.

The watcher survives config reloads: replace only its verified process, then run
`rex config reload` when updating watcher code. The launcher never starts a missing
server and clears inherited Rex targets. `REX_SESSION_PERSISTENCE_BIN` overrides
its binary; `REX_SESSION_PERSISTENCE_SCOPE` isolates multiple local servers and must
match between server and shell environments. Requires Python 3, macOS shlock and
Fish. To disable, stop the watcher, remove the Rex require, and disable the Fish
hook.

## Tests

```sh
luajit .config/rex/extensions/session-persistence/test-agents.lua
python3 .config/rex/extensions/session-persistence/test-resume.py
luajit .config/rex/extensions/session-persistence/test-readiness.lua
python3 .config/rex/extensions/session-persistence/test-readiness.py
node .config/opencode/rex-session/test.mjs
fish -n .config/fish/conf.d/rex-agent-resume.fish
```

The PTY test verifies preservation of typed input, separate agent foreground
ownership and Fish returning after exit, with a fake agent. Other tests mock
Rex/launches. A real app-managed restart is a separate end-to-end check.
