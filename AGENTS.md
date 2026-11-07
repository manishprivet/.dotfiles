# Repository guide

## Principles

- This is a personal macOS + Omarchy dotfiles repo. Prefer direct native configuration over a framework.
- Chezmoi owns deployment through templates, ignores, externals and lifecycle hooks. Applications own their config formats.
- Link whole app roots so new files and atomic saves stay in the checkout. Keep secrets, caches, generated themes and runtime state out of Git.
- Share portable settings; select OS-specific roots at the app boundary.
- Use small helpers for repeated behavior or a clear boundary. Do not wrap a single operation or add speculative extension points.
- Remove dead code, obsolete compatibility paths and unused files. Do not maintain a second implementation in tests.
- Use descriptive names, consistent formatting and blank lines between related blocks. Comments explain constraints or non-obvious decisions, not the next line of code. Avoid filler, repeated explanations and promotional language.

## Before editing

1. Read `git status --short`, the relevant staged/unstaged diffs and any nested `AGENTS.md`.
2. Preserve unrelated work, especially the Neovim lockfile. Do not reset changes or commit/push unless asked.
3. Find the native source, its symlink template and OS selection. Edit maintained sources, not generated files or deployment copies.
4. Remember that linked roots may affect running apps immediately. Tests do not authorize installs, live reloads or desktop changes.

## Layout and changes

- `.chezmoiroot` selects `home/`. `home/.chezmoi.toml.tmpl` detects Omarchy and records the checkout.
- Native settings live in `.config/` (shared/Mac), `macos/.config/` and `omarchy/.config/`.
- Existing app: edit its native root. New files inside it need no deployment registration.
- New app: add one `home/dot_config/symlink_<app>.tmpl` using `.chezmoi.workingTree`, plus an OS exclusion in `home/.chezmoiignore` if needed.
- Packages: edit `home/.chezmoidata/packages.yaml`; keep installation in the existing native package hook.
- Setup: use one idempotent `home/.chezmoiscripts/` hook per purpose. Use `run_onchange_` for input-dependent work and `run_once_` for one-time setup. Hash production inputs, not tests or build output.
- External repos: use `home/.chezmoiexternal.toml`, not custom clone logic.
- Local overrides: use ignored `fish/local.fish`, `fish/secrets.fish` and `git/local.config`. Ignore new local state before staging it.
- Update `README.md` when workflows or layout change; update this guide when maintenance rules change. Document each rule once.

## Deployment and native integration

- Initialize with `chezmoi init --source "$PWD"`, inspect `chezmoi diff`, then apply only the intended scope. A full apply can install packages, fetch externals and reload apps.
- Back up existing configs and preserve local overrides before replacing app roots. Do not overwrite credentials or OpenCode service registration. Do not manage or remove the whole config directory.
- Never edit `/usr/share/omarchy`. Use its supported imports, hooks and theme connections; preserve upstream behavior unless requested otherwise.
- Hyprland behavior stays in `bindings.lua`, `aerospace.lua`, `workspaces.lua`, `looknfeel.lua`, `input.lua` and `monitors.lua` under `omarchy/.config/hypr/`.
- Preserve the bar layout unless the task changes it. Keep calendar cache parsing in `.config/notion-calendar/`, separate from bar adapters. Use the pinned external `dfindexeddb` decoder, not custom Python parsing.
- Theme selection is in `omarchy/theme`; sources are in `omarchy/.config/omarchy/themes/houses/`. Retain native terminal/btop theme pointers.
- OpenCode commands live in `.config/opencode/command/`, shared plugins in `.config/opencode/`, and managed skills in `.agents/skills/`. Do not activate work endpoints or tracking plugins automatically. Install pinned npm dependencies with lifecycle scripts disabled.

## Verification

Keep tests that exercise behavior, failure paths, security boundaries or real integrations. Delete tests that copy settings, search source text, derive expected results from the implementation, or only test mocks. Do not add checks merely to increase coverage.

Run checks relevant to the change:

- `bash scripts/test-chezmoi.sh` — isolated native apply/verify on both platforms; no hooks, installs or reloads.
- `lua scripts/test_hyprland.lua` — window placement and shortcut dispatch.
- `node scripts/test-theme.mjs` — native Omarchy template rendering in a temporary home.
- `node --test .config/opencode/rex-session/test.mjs` — Rex session metadata lifecycle.
- `node --test .config/notion-calendar/tests/*.test.mjs` — cache reading and recurrence.
- `node --test omarchy/.config/omarchy/plugins/manish.agenda/tests/agenda.test.mjs`; `bash scripts/test-agenda-ui.sh` — agenda behavior and offscreen QML.
- `node --test .config/youtube-music/tests/*.test.mjs`; `bash scripts/test-music-ui.sh` — music client and offscreen controls.
- `omarchy/apps/notioncalendar/bin/test` — launcher, live theme/language updates and QML interaction.
- `chezmoi verify --exclude=scripts,externals` — read-only check of deployed links.

Use fixtures, not live credentials, meetings or playback. After authorized live Hyprland edits, run `hyprctl reload` and `hyprctl configerrors`; avoid the standalone verifier, which has crashed during cleanup. For OpenCode use `/reload` or `opencode reload`, not a service restart.

Review `git diff --check` and the final diff. Report commands, results and anything not verified.
