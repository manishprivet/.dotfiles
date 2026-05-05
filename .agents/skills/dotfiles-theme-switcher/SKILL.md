---
name: dotfiles-theme-switcher
description: Switch, align, or audit themes across this macOS dotfiles repo. Use this skill whenever the user asks to change the theme for one or more tools in this repo, create a new shared palette, or synchronize editor, terminal, prompt, bar, and TUI themes.
---

# Dotfiles Theme Switcher Skill

Use this skill to safely change themes in this dotfiles repo without missing linked configs or breaking cross-tool consistency.

## When to use

Use this skill when the user asks to:
- Change the theme for a specific tool in this repo.
- Switch several tools to the same theme or palette.
- Create a new custom palette and apply it across multiple configs.
- Align editor, terminal, prompt, tmux, bar, and TUI colors.
- Audit which theme a tool is currently using before changing it.

## Repo-specific constraints

- This is a dotfiles repo, not an app repo. There is no default test suite.
- Managed files are the source of truth. If a tool reads from a symlinked path in `~`, edit the file in this repo.
- Apply dotfile changes with `stow .` only when the user wants deployment. Prefer `stow -n -v .` first for a dry run.
- Keep changes minimal. Do not rewrite every theme file unless the user asked for a full-stack switch.
- Some tools use built-in named themes. Others use custom palettes. Do not assume one approach fits every tool.

## Core workflow

1. Define the scope first
- Determine whether the request is for one tool, a related group of tools, or the whole repo.
- Ask one short question only if the scope is ambiguous and the choice materially changes many files.

2. Identify the theme model
- Named built-in theme: update the selector only.
- Custom palette file: update the palette source and any references.
- Inline colors: update the color literals in place.

3. Find the source of truth
- Read the actual config file that drives the tool.
- Check for secondary wiring files that point to theme files or export theme paths.
- Preserve unrelated settings such as fonts, layout, opacity, and keybindings.

4. Make the smallest complete change
- If a tool supports a built-in theme and the user asked for that tool only, change just the theme selector.
- If a tool uses a custom Everforest-like palette, update the palette block and the styles that depend on it.
- If multiple tools share one palette concept, keep the hex values consistent across them.

5. Verify at the right level
- Re-read edited files to confirm the intended values landed in the right places.
- If the user wants deployment, run `stow -n -v .` before `stow .`.
- If the tool has an obvious config check command and it is already used in the repo, run it. Otherwise report that no generic validation exists.

## Recommended scope groups

Use these groups unless the user says otherwise.

### Editor group
- Neovim
- Neovim terminal colors
- Neovim-driven zellij status palette

### Terminal group
- Ghostty
- WezTerm
- Fish prompt and syntax colors
- tmux
- Borders

### TUI group
- Lazygit
- Yazi
- btop
- htop
- Zellij built-in theme
- Zellij custom status layout

### Agent UI group
- OpenCode custom theme files
- Pi agent theme and selector

### Desktop bar group
- SketchyBar

## Theme inventory

These are the important theme-bearing files in this repo.

### Neovim
- File: `.config/nvim/lua/plugins/colorscheme.lua`
- Active selector: `LazyVim` `colorscheme = "everforest"`
- Available configured themes: `material`, `gruvbox`, `nightfox`, `everforest`, `catppuccin`, `rose-pine`, `tokyonight`
- Extra theme logic: Everforest terminal colors are hardcoded here via `vim.g.terminal_color_*`
- Fallback install list: `.config/nvim/lua/config/lazy.lua`

### WezTerm
- File: `.wezterm.lua`
- Theme model: built-in named theme via `color_scheme = "..."`
- Current file also contains a wallpaper layer and a color overlay in `background`

### Ghostty
- File: `.config/ghostty/config`
- Theme model: built-in named theme via `theme = ...`
- Background opacity and blur are separate from the theme choice

### Fish
- File: `.config/fish/config.fish`
- Theme model: custom palette variables plus `fish_color_*` assignments
- Also exports Lazygit theme file path through `LG_CONFIG_FILE`

### Lazygit
- Theme file: `.config/lazygit/themes/everforest-dark-hard.yml`
- Wiring files:
  - `.config/fish/config.fish`
  - `.config/nvim/lua/config/options.lua`
- Theme model: custom YAML theme file referenced externally

### tmux
- File: `.tmux.conf`
- Theme model: custom palette variables `@everforest_*` plus status, window, pane, and message styles
- Contains commented alternative plugins for Nord and Gruvbox; do not enable them unless requested

### SketchyBar
- File: `.config/sketchybar/colors.sh`
- Theme model: one active exported block plus many commented alternate scheme blocks
- Safe pattern: switch the active export block instead of editing every item script

### Zellij
- Built-in theme selector: `.config/zellij/config.kdl`
- Custom status layout colors: `.config/zellij/layouts/zstatus.kdl`
- Theme model: often split across built-in theme selection and custom status-bar color strings

### Neovim Zellij status palette
- File: `.config/nvim/lua/config/zellij_status/palette.lua`
- Theme model: custom Lua palette used by the Neovim-generated Zellij status content

### Yazi
- File: `.config/yazi/theme.toml`
- Flavor package pins: `.config/yazi/package.toml`
- Theme model: named `flavor` selectors for dark and light plus pinned flavor sources

### btop
- File: `.config/btop/btop.conf`
- Theme model: named theme via `color_theme = "..."`

### htop
- File: `.config/htop/htoprc`
- Theme model: numeric built-in scheme via `color_scheme=`
- Low-priority target unless the user explicitly wants htop aligned too

### Borders
- File: `.config/borders/bordersrc`
- Theme model: inline active and inactive border colors

### OpenCode
- Theme file: `.config/opencode/themes/everforest-dark-hard.json`
- Theme model: custom semantic theme JSON
- If the user asks to make OpenCode use a different custom theme, update the theme file and search for how that theme is selected before assuming it is auto-loaded

### Pi agent
- Selector: `.pi/agent/settings.json`
- Theme file: `.pi/agent/themes/everforest.json`
- Theme model: named theme selector plus custom theme definition

### Starship
- File: `.config/starship.toml`
- Theme model: inline styles and hex values, not a named theme file

### Neofetch
- File: `.config/neofetch/config.conf`
- Theme model: custom output using terminal color indices and glyph styling
- Usually leave this alone unless the user explicitly wants it changed

## Per-tool change playbook

### Neovim

If the user wants a built-in theme switch:
- Update the active `LazyVim` `colorscheme` selector.
- Keep plugin definitions for alternate themes unless the user asks to clean them up.
- Review theme-specific options for the selected plugin.

If the user wants Everforest tweaked:
- Update `background = "hard"` or related Everforest options in the Everforest setup block.
- Update the `vim.g.terminal_color_*` values if the terminal palette should stay synchronized.

If the user wants Catppuccin or Tokyo Night tuned:
- Edit only that plugin's `opts` block.
- Preserve unrelated highlight overrides unless they conflict with the new request.

### WezTerm

- For named theme changes, edit `color_scheme` only.
- If the result looks wrong because of the custom overlay, check `background` and the `Color = "#..."` overlay block before changing more.
- Do not remove wallpaper or opacity unless requested.

### Ghostty

- Update the `theme = ...` line.
- Keep `background-opacity` and `background-blur-radius` unless the user asks for a more opaque or transparent look.
- Ignore `.bak` files unless the user explicitly asks to update backups too.

### Fish

- Update the palette variables at the top of `.config/fish/config.fish`.
- Then verify each `fish_color_*` mapping still points at the intended palette variables.
- Preserve shell initialization and path settings below the color section.

### Lazygit

- Update the custom theme YAML file if the user wants Lazygit aligned with a custom palette.
- If the theme filename changes, update both wiring locations:
  - `.config/fish/config.fish`
  - `.config/nvim/lua/config/options.lua`
- If the user only wants different border or selection colors, edit just the corresponding YAML keys.

### tmux

- Update the palette variables first.
- Then inspect status, window, pane, and message styles to ensure they still reference the correct variables.
- Prefer keeping the variable names stable and changing the values underneath them.
- Do not enable commented theme plugins unless the user wants plugin-based theming.

### SketchyBar

- Prefer switching the active export block in `.config/sketchybar/colors.sh`.
- If creating a new scheme, add a new clearly labeled block and activate only that block.
- Do not hand-edit every plugin or item file unless they contain tool-specific accent overrides.

### Zellij

- Update `.config/zellij/config.kdl` if the user wants to switch the built-in Zellij theme.
- Update `.config/zellij/layouts/zstatus.kdl` if the user wants the custom status layout to match.
- If Neovim-generated Zellij status content is in use, also update `.config/nvim/lua/config/zellij_status/palette.lua` when a palette sync is requested.
- Treat these as separate layers: built-in Zellij theme, custom Zellij layout colors, and Neovim-generated status colors.

### Yazi

- Update `.config/yazi/theme.toml` for flavor selection.
- Update `.config/yazi/package.toml` only if the requested flavor package changes or a new flavor must be pinned.
- Do not change both dark and light flavors unless the user asked for both.

### btop

- Update `color_theme` in `.config/btop/btop.conf`.
- Keep `theme_background` as-is unless the user asks for transparent or opaque behavior.

### htop

- Update `color_scheme` only if the user asked to align htop too.
- This setting is numeric, so inspect the local htop theme numbering before claiming which named scheme it corresponds to.

### Borders

- Update `active_color` and `inactive_color` in `.config/borders/bordersrc`.
- Keep border width, style, and hidpi settings unchanged unless requested.

### OpenCode

- Update the custom theme JSON under `.config/opencode/themes/` if the request is to modify the palette itself.
- If the request is to switch OpenCode to a different theme file, search for the active selector before editing other files.
- Preserve semantic slots like `primary`, `secondary`, `text`, `background`, `diff*`, `markdown*`, and `syntax*`.

### Pi agent

- Update `.pi/agent/settings.json` if the theme name should change.
- Update `.pi/agent/themes/<name>.json` if the custom theme definition should change.
- Keep semantic color intent consistent across `accent`, `success`, `error`, `warning`, markdown, syntax, and diff slots.

### Starship

- Update inline style strings and hex values directly in `.config/starship.toml`.
- Preserve symbols unless the user also asked for icon or typography changes.

### Neofetch

- Update only when explicitly requested.
- This config mostly relies on terminal color indices rather than a named theme selector.

## Full-stack synchronization guidance

When the user wants one theme across many tools:

1. Pick the palette source
- If the theme already exists as a custom palette in the repo, use that as the color source.
- If the theme is only available as a built-in theme in one app, derive a small shared palette before changing inline-color tools.

2. Update selectors first
- Ghostty
- WezTerm
- Zellij
- Yazi
- btop
- Neovim active colorscheme

3. Update custom palette files second
- Lazygit
- Fish
- tmux
- SketchyBar
- Zellij status layout
- Neovim Zellij status palette
- OpenCode theme JSON
- Pi agent theme JSON
- Borders

4. Re-check wiring files
- `LG_CONFIG_FILE` in Fish and Neovim options
- Any renamed theme filenames

## Verification checklist

For each completed theme change, verify:
- The intended file was edited, not a backup or mirrored copy.
- Named theme selectors reference valid theme names.
- Custom palette files still have all required keys.
- Wiring paths still point to the correct theme file.
- Cross-tool shared colors are consistent when the request was a synchronized theme switch.

If deployment is requested:
- Run `stow -n -v .`
- If the dry run looks correct, run `stow .`

## Output format

For substantial theme changes, respond with:

1. `Scope`
- Which tools were changed.

2. `Theme Model`
- Built-in theme switch, custom palette update, or inline color edits.

3. `Files Changed`
- Exact paths updated.

4. `Verification`
- What was checked and whether deployment was performed.

5. `Notes`
- Any tools intentionally left unchanged and why.

## Guardrails

- Do not change every themed tool by default when the user asked about only one tool.
- Do not delete alternative theme configs unless the user asked for cleanup.
- Do not edit backups, generated files, `node_modules`, or `.git` data.
- Do not assume OpenCode theme selection without checking for the active selector.
- Do not run `stow .` automatically unless the user asked to apply the updated dotfiles.
