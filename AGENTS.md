# AGENTS

## Repo shape
- This is a macOS-focused dotfiles repo, not an app repo. There is no root `package.json`, test runner, linter, or CI workflow to use as a default verification path.
- Most managed files live under `.config/`, plus `.pi/` for Pi prompt/config state.

## Deploying changes
- Apply dotfile changes with `stow .` from the repo root.
- `.stow-local-ignore` excludes `.git`, `README.md`, `scripts`, `wallpapers`, `tokyonight-wallpapers`, and `submodules`, so edits there do not get deployed by Stow.
- Use `stow -n -v .` for a safe dry run before changing symlinked layout.

## Source-of-truth locations
- OpenCode command prompts in `.config/opencode/command/` are symlinks to `.pi/prompts/`. Edit `.pi/prompts/*.md`, not the mirrored paths.
- `.pi/agent/prompts/` is also symlinked back to `.pi/prompts/`. Keep prompt changes in one place: `.pi/prompts/`.
- OpenCode skills are stored in `.config/opencode/skills/` in this repo. Do not edit `~/.config/opencode/skills` directly if you are trying to persist changes; deploy via `stow .`.

## Setup and verification
- Main bootstrap is `./scripts/setup.sh`. It installs Homebrew, runs `brew bundle --file .Brewfile`, changes the login shell to Fish, installs Fisher plugins, clones tmux plugins, installs Rust, downloads the Sketchybar font, then runs `stow .`.
- `scripts/fish.sh` assumes Fish is installed at `/opt/homebrew/bin/fish`.
- There is no general test suite. `test.sh` is an ad hoc AeroSpace/Sketchybar helper, not a repo-wide verification command.

## Path quirks
- Several configs hardcode `/Users/manishprivet` or depend on files under the real home directory. Preserve that pattern unless the task is explicitly to remove hardcoded paths.
- Representative examples: `.config/fish/config.fish`, `.wezterm.lua`, `.config/sketchybar/plugins/cron.js`, and `.config/nvim/lua/config/options.lua`.

## The .pi symlink
- `~/.pi` is a symlink to `.dotfiles/.pi` (not a regular directory)
- This means `~/.pi/extensions/` and `.dotfiles/.pi/extensions/` are the same file
- When editing files in `.dotfiles/.pi/`, changes are immediately visible in `~/.pi/`
- **To check if a path is a symlink:**
  - `ls -la ~ | grep .pi` - shows symlink status
  - `file ~/.pi` - prints "symbolic link" if it's a symlink
  - `readlink ~/.pi` - shows where the symlink points
- **Never run `stow .` twice** - the first run creates the symlinks, subsequent runs show "Skipping" because everything is already linked
- **All files in this repo are symlinked TO ~** - files in `.dotfiles/.config/`, `.dotfiles/.pi/`, etc. are the sources; stow creates symlinks at `~/.config/`, `~/.pi/`, `~/.tmux.conf`, `~/.wezterm.lua`, etc. pointing back to the dotfiles repo

## README caveat
- Trust the current tree over `README.md` for OpenCode skills. The README still describes skill links coming from `submodules/anthropic-skills`, but the checked-in source of truth today is `.config/opencode/skills/` in this repo.
