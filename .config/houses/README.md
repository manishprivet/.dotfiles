# Houses themes

`palette.json` records the wallpaper-derived dark palette; `palette-light.json`
records its warm cream companion. Tool configs mirror these values rather than
reading the JSON automatically. Creating the light presets does not select them.

## Select Houses Light

Use the light terminal palette together with light editor/TUI presets: Neovim,
OpenCode, and btop retain their existing transparent-background behavior.

- **Rex:** in the command palette, choose **Import Theme File** and select
  `~/.config/rex/themes/Houses Light`. This is a Ghostty-format import file for
  Rex, not a requirement to use Ghostty. The import selects the theme in Rex;
  merely adding this file does not.
- **Neovim:** run `:colorscheme houses-light`. For persistent selection, set
  LazyVim's `colorscheme` in `lua/plugins/colorscheme.lua` to `houses-light`.
  Lazygit launched from Neovim follows the selected Houses colorscheme.
- **Fish:** set `houses_theme_mode` to `light` in `~/.config/fish/config.fish`,
  then start a new shell. This switches syntax colors and the Lazygit theme path.
  The `fish/themes/Houses Light.theme` file also exposes the palette to Fish's
  theme tools, but config.fish is authoritative on shell startup.
- **Starship:** set `palette = "houses-light"` at the top of
  `~/.config/starship.toml`.
- **Lazygit:** use `~/.config/lazygit/themes/houses-light.yml` as the second
  config in `LG_CONFIG_FILE`, after the main `config.yml` (Fish/Neovim do this
  when configured as above).
- **btop:** set `color_theme = "houses-light"` in `~/.config/btop/btop.conf`.
- **OpenCode V2:** set `theme.name` to `houses-light` and `theme.mode` to `light`
  in `~/.config/opencode/cli.json`. CLI settings reload automatically; use
  `/reload` if the newly added theme is not yet listed.
- **tmux:** run `tmux source-file ~/.config/tmux/themes/houses-light.conf`.
  For persistence, source that overlay at the end of `~/.tmux.conf`.
- **SketchyBar:** replace the active Houses export block in `colors.sh` with
  `source "$HOME/.config/sketchybar/themes/houses-light.sh"`, then reload the
  bar. The preset includes a dark text color as well as light backgrounds.
- **Borders:** run `bash ~/.config/borders/themes/houses-light.sh` for a live
  color-only override. For persistence, set `active_color=0xffb5403a` and
  `inactive_color=0xffa89984` in `bordersrc`.
- **htop:** leave its default color scheme selected; ANSI colors come from Rex.

Rex imports its own copy of a theme. After changing the import file, import it
again to update Rex. No Rex keybindings or session extensions are modified by
these presets.
