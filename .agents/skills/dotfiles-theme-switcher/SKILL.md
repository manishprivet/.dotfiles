---
name: dotfiles-theme-switcher
description: Switch, align, or audit themes across this macOS + Omarchy dotfiles repo. Use for tool themes, shared palettes, or editor/terminal/bar/TUI color synchronization.
---

# Dotfiles themes

Follow `AGENTS.md` for repository safety and deployment. Change only the requested tools; preserve fonts, opacity, layout and keybindings unless asked.

## Workflow

1. Find the active native config and its OS-specific root in `home/dot_config/`.
2. Identify the selector and maintained palette. A named theme usually needs only a selector change; a custom theme needs its source colors updated.
3. Check consumers such as `LG_CONFIG_FILE` before renaming a theme.
4. Use the app's config validator where available. Do not add tests that duplicate color values or config declarations.
5. If deployment is requested, initialize with `chezmoi init --source "$PWD"`, review `chezmoi diff`, and apply only the intended scope. Linked files may already be live.

## Sources

`.config/houses/palette.json` and `palette-light.json` document shared colors; tools do not load them automatically. See `.config/houses/README.md` for light-theme selection.

| Tool | Maintained sources and selectors |
| --- | --- |
| Neovim | `.config/nvim/lua/plugins/colorscheme.lua`; `.config/nvim/lua/houses/`; `.config/nvim/colors/` |
| Ghostty | `.config/ghostty/config` and `themes/` on macOS; `omarchy/.config/ghostty/config` on Linux |
| Fish | Platform `config.fish`; shared `.config/fish/themes/` |
| Lazygit | `.config/lazygit/themes/`; `LG_CONFIG_FILE` in Fish and Neovim options |
| tmux | `.tmux.conf`, `.config/tmux/themes/`, `omarchy/.config/tmux/tmux.conf` |
| SketchyBar | `.config/sketchybar/colors.sh` and `themes/` |
| Borders | `.config/borders/bordersrc` and `themes/` |
| btop | Platform `btop.conf`; `.config/btop/themes/` for macOS |
| htop | `.config/htop/htoprc`; ANSI colors come from the terminal |
| OpenCode | `.config/opencode/themes/`; active platform `cli.json` |
| Starship | `.config/starship.toml` palette selector and styles |
| Rex | `.config/rex/themes/`; importing a file selects a private copy in Rex |
| Omarchy | `omarchy/theme` selects sources under `omarchy/.config/omarchy/themes/` |

## Native integration

- On Omarchy, read the Omarchy skill before editing desktop or terminal themes. Preserve native includes and runtime pointers; never edit generated themes or `/usr/share/omarchy`.
- Read the OpenCode skill before changing CLI theme selection. Do not put terminal preferences in server config.
- Change Fish's palette and Lazygit path together. Neovim-launched Lazygit has its own theme wiring.
- Rex imports do not follow later file edits; reimport to update its copy.
- Preserve alternate themes unless removal is requested. Ignore backups, dependencies and runtime state.

Report the tools changed, validation results and whether anything was applied live.
