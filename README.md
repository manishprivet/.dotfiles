<img width="2560" height="1440" alt="macOS setup" src="https://github.com/user-attachments/assets/642997a8-a49f-4e44-a702-3e21166ed08b" />

# Dotfiles — macOS and Omarchy

Managed with [chezmoi](https://www.chezmoi.io/), using its standard symlink
templates, OS-specific ignores, package data, externals and setup scripts.
There is no custom deployment framework or Python tooling.

## Set up a machine

Install chezmoi with `brew install chezmoi` on macOS, or
`omarchy pkg add chezmoi` on Omarchy. Then:

```bash
chezmoi init --apply manishprivet/.dotfiles
```

For an existing checkout:

```bash
chezmoi init --source "$PWD"
chezmoi diff
chezmoi apply
```

Or preview without applying: `chezmoi apply --dry-run --verbose`.
`scripts/setup.sh` is only a compatibility wrapper for `chezmoi init --apply`.
Run the initial apply from a terminal: installing packages can prompt for sudo.
The one-time migration hook archives existing config directories privately under
`~/.local/state/dotfiles/backups/chezmoi-*/` before they become symlinks.

Credentials are deliberately not bootstrapped: supply your SSH keys, sign in to
OpenCode, and run `gh auth login` yourself. Git enables SSH signing and expects
`~/.ssh/id_ed25519.pub` or an ignored `git/local.config` override. GitHub URL
rewrites use SSH, so public plugin clones also need a working GitHub SSH account.
After GitHub sign-in, reapply to install gh-dash. Neovim installs plugins on first
launch. This does not change your login shell or install the entire `.Brewfile`.

### Migrating an old Stow checkout

If `~/.config` itself is a symlink into the repo, stop and unfold that old layout
before applying: replacing children through it could modify the shared sources.
The migration hook refuses this case. Back up the old layout, replace only the
parent link with a real config directory containing copies of the old settings,
then review `chezmoi diff`. Do not blindly use `--force` or skip the backup hook.

For an existing machine, separate the link migration from setup hooks: after
running and checking the backup hook, preview and apply with
`--exclude=scripts,externals`. A plain `chezmoi apply` also runs package/tool
installation and reload hooks; review these before enabling them.

The macOS declarations retain the legacy Evans, GitHub CLI, htop and Rex
roots. The macOS OpenCode root also links existing shared settings and plugins;
ignored local extensions and dependencies stay local. Unmanaged config roots
must be retained when unfolding the parent link, not deleted with the old layout.

## Layout

```text
.chezmoiroot                  selects home/ as chezmoi's source state
home/
  .chezmoi.toml.tmpl          machine detection/local chezmoi config
  .chezmoiignore             platform-specific exclusions
  .chezmoidata/packages.yaml declarative package lists
  .chezmoiexternal.toml      TPM and tmux plugin repositories
  .chezmoiscripts/           small standard run_once/run_onchange hooks
  dot_config/symlink_*.tmpl  one symlink declaration per config root
.config/                     existing shared/Mac config contents
macos/.config/               Mac app roots with mutable local state
omarchy/.config/             complete native Omarchy config roots
omarchy/theme                desired desktop theme (houses)
```

The existing `.config/` files stay in place rather than being renamed wholesale
to chezmoi attributes. Symlink templates use `.chezmoi.workingTree`, so the repo
can be cloned anywhere. macOS and Omarchy select different Ghostty, Fish,
OpenCode and tmux roots where necessary; common plugin/config contents are shared.

## Edit configuration

Edit the config contents in the repo, for example:

```text
omarchy/.config/hypr/input.lua
omarchy/.config/ghostty/config
omarchy/.config/opencode/cli.json
.config/nvim/lua/plugins/
```

Whole app directories are linked, not individual known files. Future files and
app-saved edits inside those roots therefore stay in the repo, including atomic
settings saves. No manager changes are needed for a new hook or Hyprland file
inside an existing root. `chezmoi edit` edits the link declaration for symlink
targets; edit these raw config directories for the actual settings.

For a **new app root**, put its contents in `omarchy/.config/myapp/` and add
`home/dot_config/symlink_myapp.tmpl` containing:

```gotemplate
{{ .chezmoi.workingTree }}/omarchy/.config/myapp
```

Add `.config/myapp` to the non-Omarchy section of `.chezmoiignore` when it is
Linux-only. chezmoi handles the rest. For software dependencies, edit package
data or add one focused native `run_onchange_` script—not another installer.

Fish universal variables/secrets, OpenCode service registration, caches and
backups remain local and Git-ignored, even when physically under a linked app
root. Accounts, databases, session history and browser profiles are not imported
into source control. Review `git status` before committing.

## Omarchy stays native

The Hyprland loader imports Omarchy's helpers, services, workspaces, dynamic
theme and toggles. Its preset bindings are disabled. Personal behavior is split
between `bindings.lua` (four agreed essentials), `aerospace.lua` (Mac Alt bindings),
`workspaces.lua` (app placement), `looknfeel.lua`, `input.lua` and `monitors.lua`.
No implementations under `/usr/share/omarchy` are copied or edited.

Ghostty, Foot, Kitty, Alacritty and btop retain native theme connections. Houses
sources are in `omarchy/.config/omarchy/themes/houses/`; `omarchy/theme` selects
the theme. Reapply refreshes it without cycling the wallpaper. Generated themes
stay in `~/.local/state`. The bar's original layout is preserved and remains deferred.

OpenCode retains separate server configs, shared portable plugins and Houses UI
settings. Work-only endpoints and WakaTime are not activated automatically.

## Verify

```bash
chezmoi verify --exclude=scripts,externals
bash scripts/test-chezmoi.sh
lua scripts/test_hyprland.lua
node scripts/test-theme.mjs
nvim --clean --headless -l scripts/test_navigation.lua
node --test .config/opencode/rex-session/test.mjs
```

The filesystem checks apply real chezmoi state to isolated macOS/Omarchy test
homes with install scripts and externals excluded. Theme tests render native
templates in a temporary home. After Hyprland edits use `hyprctl reload` and
`hyprctl configerrors`; for OpenCode use `/reload`, not a service restart.

## Patterns used

- [twpayne/dotfiles](https://github.com/twpayne/dotfiles): source root, OS ignores and native package hooks.
- [renemarc/dotfiles](https://github.com/renemarc/dotfiles): symlink templates for app-modified configuration.
- [chezmoi package guide](https://www.chezmoi.io/user-guide/advanced/install-packages-declaratively/).
- [chezmoi machine differences](https://www.chezmoi.io/user-guide/manage-machine-to-machine-differences/).
