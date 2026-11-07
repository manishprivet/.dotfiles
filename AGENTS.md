# Dotfiles working notes

## User requirements
- Use chezmoi, not a custom deployer/component framework. No Python tooling.
- Keep the diff minimal and files readable. One symlink declaration per app root, one focused native setup hook per purpose.
- Every customization belongs in the repo. Whole native config directories are linked so future files and atomic app saves remain in dotfiles.
- Preserve the existing bar layout/widgets; bar customization is deferred.
- Preserve unfamiliar/staged user work, especially the Neovim lockfile. Do not reset unrelated changes or auto-commit.

## Source layout
- `.chezmoiroot` points to `home/`, the standard chezmoi source state.
- `home/dot_config/symlink_*.tmpl` declares links using `.chezmoi.workingTree`.
- `home/.chezmoiignore` selects OS targets. `home/.chezmoi.toml.tmpl` detects installed Omarchy and keeps the local checkout as source.
- Package data: `home/.chezmoidata/packages.yaml`. Native lifecycle hooks: `home/.chezmoiscripts/`. Tmux plugins: `.chezmoiexternal.toml`.
- Actual settings remain in `.config/` (shared/Mac), `macos/.config/` and `omarchy/.config/`. Don't move them wholesale into a new abstraction.
- A new file under an owned native root needs no deployment registration. A new app root needs one standard symlink template and any OS ignore entry.
- `scripts/setup.sh` is only a thin compatibility wrapper around chezmoi; do not add argument parsing, link mechanics or a manifest there.

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
- After live Hyprland edits run `hyprctl reload` then `hyprctl configerrors`. Avoid the installed standalone verifier: it crashed during timer cleanup earlier.
- For OpenCode use `/reload` or `opencode reload`, not a service restart. Package hooks install its pinned dependencies with scripts disabled.
