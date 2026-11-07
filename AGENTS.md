# Repository guide for agents

## Philosophy
- This is a personal macOS + Omarchy dotfiles repository, not a configuration-management product. Prefer a small, understandable setup over a reusable framework.
- Chezmoi owns deployment; applications own their native configuration formats. Use chezmoi's built-in templates, ignores, externals and lifecycle scripts rather than inventing parallel machinery.
- The checkout is the source of truth for intentional customization. Link whole app roots so new files and atomic application saves stay in the repo; do not capture secrets, caches or runtime state.
- Share settings where they are genuinely portable. Keep OS-specific differences explicit at the app-root boundary instead of scattering platform checks everywhere or duplicating entire shared configs.
- Extend Omarchy through its supported imports, hooks and theme connections. Preserve upstream behavior unless a personal override is explicitly requested.
- Make focused changes in the existing structure. Avoid unrelated cleanup, mass renames, new abstractions and automatic commits or pushes.

## User requirements
- Use chezmoi, not a custom deployer/component framework. No custom Python tooling; the shared calendar reader explicitly uses the pinned external `dfindexeddb` decoder in an isolated environment.
- Keep the diff minimal and files readable. One symlink declaration per app root, one focused native setup hook per purpose.
- Every customization belongs in the repo. Whole native config directories are linked so future files and atomic app saves remain in dotfiles.
- Preserve the existing bar layout/widgets; `manish.agenda` is the requested local addition beside the clock.
- Preserve unfamiliar/staged user work, especially the Neovim lockfile. Do not reset unrelated changes or auto-commit.

## Source layout
- `.chezmoiroot` points to `home/`, the standard chezmoi source state.
- `home/dot_config/symlink_*.tmpl` declares links using `.chezmoi.workingTree`.
- `home/.chezmoiignore` selects OS targets. `home/.chezmoi.toml.tmpl` detects installed Omarchy and keeps the local checkout as source.
- Package data: `home/.chezmoidata/packages.yaml`. Native lifecycle hooks: `home/.chezmoiscripts/`. Tmux plugins: `.chezmoiexternal.toml`.
- Actual settings remain in `.config/` (shared/Mac), `macos/.config/` and `omarchy/.config/`. Don't move them wholesale into a new abstraction.
- A new file under an owned native root needs no deployment registration. A new app root needs one standard symlink template and any OS ignore entry.
- `scripts/setup.sh` is only a thin compatibility wrapper around chezmoi; do not add argument parsing, link mechanics or a manifest there.

## Working on the repo
1. Read `git status --short` and the relevant diff before editing. Identify existing user changes and any more-specific `AGENTS.md` instructions.
2. Find the native config source and check its symlink declaration and OS selection. Edit the actual settings, not a generated theme or a copied deployment target.
3. Keep the change scoped to the requested app or behavior. A live config root can point directly into this checkout, so edits may affect the running desktop immediately.
4. Run the relevant checks below, and review `git diff --check` and `git diff`. Sandbox tests do not authorize package installs, live reloads or unrelated desktop changes.
5. When deployment is needed, initialize with `chezmoi init --source "$PWD"`, inspect `chezmoi diff`, then apply only the intended scope. A full `chezmoi apply` can install packages, fetch externals and run desktop hooks; do not treat it as a read-only check.
6. Summarize what changed and what was actually tested. Commit or push only when requested, staging explicit paths and leaving unrelated changes alone.

### Common changes
- **Existing app settings:** edit files under the selected native root. Files added inside an already linked root need no extra deployment declaration. Review app-written changes before committing them.
- **New app:** add its native config root and one `home/dot_config/symlink_<app>.tmpl` pointing through `{{ .chezmoi.workingTree }}`. Add an OS exclusion in `home/.chezmoiignore` if needed. Use an explicit OS-dependent target for shared apps with different roots.
- **Packages:** edit `home/.chezmoidata/packages.yaml`. Keep installation in the existing native package hook; do not add a second package manifest or installer framework.
- **Setup actions:** use a small, idempotent native chezmoi script for one purpose. Prefer `run_onchange_` for input-dependent setup and `run_once_` for migrations; remember that changed script contents can run again.
- **External repositories:** use `home/.chezmoiexternal.toml`, rather than ad hoc clone commands for managed plugins.
- **Machine-local settings:** use the existing ignored overrides (`fish/local.fish`, `fish/secrets.fish`, `git/local.config`). Add narrow ignore rules for any new local state before it can be staged.
- **Themes:** change the maintained palette/theme sources and selector, not generated files or native runtime pointers. Keep terminal and desktop theme integration intact.
- **Documentation:** update `README.md` when the user workflow or layout changes, and this file when maintenance rules change.

## Safety and native integration
- Initialize with `chezmoi init --source "$PWD"`; review `chezmoi diff` before `chezmoi apply`.
- Never apply through an old whole-`~/.config` Stow symlink. The migration hook rejects it. Do not bypass this or use `exact_`/removal patterns on the whole config directory.
- The migration hook privately archives existing real config roots and preserves ignored Fish/OpenCode local state. Don't overwrite credentials or service registration contents.
- Runtime state, secrets and generated themes are not source files. Keep them ignored; provider accounts, databases and browser profiles stay in the normal app data locations.
- Never modify `/usr/share/omarchy`. Import the native bootstrap/theme/services, not copied implementations. Preset bindings are disabled; Mac Alt bindings plus the four agreed essentials are explicit.
- Hyprland behavior stays split into `bindings.lua`, `aerospace.lua`, `workspaces.lua`, `looknfeel.lua`, `input.lua`, `monitors.lua` under `omarchy/.config/hypr/`.
- Retain native terminal/btop theme includes and pointers. `omarchy/theme` selects the theme; sources live under `omarchy/.config/omarchy/themes/houses/`.
- OpenCode commands remain in `.config/opencode/command/`, shared plugins in `.config/opencode/`, and managed skills in `.agents/skills/`. No automatic work endpoints or tracking plugins.

## Verification
- `chezmoi verify --exclude=scripts,externals` — actual link state, without installs.
- `bash scripts/test-chezmoi.sh` — native chezmoi in isolated test homes; no real installs/desktop reloads.
- `lua scripts/test_hyprland.lua`; `node scripts/test-theme.mjs`; `nvim --clean --headless -l scripts/test_navigation.lua`.
- `node --test .config/opencode/rex-session/test.mjs` for the Rex integration.
- `node --test omarchy/.config/omarchy/plugins/manish.agenda/tests/agenda.test.mjs`; `bash scripts/test-agenda-ui.sh` for the agenda helper and offscreen popup. Tests use fixtures, not live credentials or meetings.
- `node --test .config/notion-calendar/tests/*.test.mjs` for the shared local-cache reader, recurrence expansion and AeroSpace/SketchyBar adapter. Keep IndexedDB parsing out of the individual bar adapters.
- After live Hyprland edits run `hyprctl reload` then `hyprctl configerrors`. Avoid the installed standalone verifier: it crashed during timer cleanup earlier.
- For OpenCode use `/reload` or `opencode reload`, not a service restart. Package hooks install its pinned dependencies with scripts disabled.
