# AGENTS

## Repo shape
- This is a macOS-focused dotfiles repo, not an app repo. There is no root `package.json`, test runner, linter, or CI workflow to use as a default verification path.
- Most managed files live under `.config/`, with managed skills under `.agents/skills/`.

## Deploying changes
- Apply dotfile changes with `stow .` from the repo root.
- `.stow-local-ignore` excludes `.git`, `README.md`, `scripts`, `wallpapers`, `tokyonight-wallpapers`, and `submodules`, so edits there do not get deployed by Stow.
- Use `stow -n -v .` for a safe dry run before changing symlinked layout.

## Source-of-truth locations
- OpenCode command prompts are standalone files in `.config/opencode/command/`. Edit them there.
- OpenCode skills are stored in `.agents/skills/` in this repo. Do not edit `~/.agents/skills` directly if you are trying to persist changes; deploy via `stow .`.

## Setup and verification
- Main bootstrap is `./scripts/setup.sh`. It installs Homebrew, runs `brew bundle --file .Brewfile`, changes the login shell to Fish, installs Fisher plugins, clones tmux plugins, installs Rust, downloads the Sketchybar font, then runs `stow .`.
- `scripts/fish.sh` assumes Fish is installed at `/opt/homebrew/bin/fish`.
- There is no general test suite. Use tool-specific config checks where available.

## Path quirks
- Several configs hardcode `/Users/manishprivet` or depend on files under the real home directory. Preserve that pattern unless the task is explicitly to remove hardcoded paths.
- Representative examples: `.config/fish/config.fish`, `.config/sketchybar/plugins/cron.js`, and `.config/nvim/lua/config/options.lua`.

## Managed symlinks
- Stow creates links in `~` pointing back to the source files in this repo, such as `~/.config/`, `~/.agents/skills/`, and `~/.tmux.conf`.
- Check a path with `ls -ld`, `file`, or `readlink` before changing its symlink layout.
- **Never run `stow .` twice** - the first run creates the symlinks, subsequent runs show "Skipping" because everything is already linked

## README caveat
- Trust the current tree over `README.md` for OpenCode skills. The checked-in source of truth today is `.agents/skills/` in this repo.
