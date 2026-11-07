<img width="2560" height="1440" alt="macOS setup" src="https://github.com/user-attachments/assets/642997a8-a49f-4e44-a702-3e21166ed08b" />

# Dotfiles — macOS and Omarchy

Managed with [chezmoi](https://www.chezmoi.io/), using its standard symlink
templates, OS-specific ignores, package data, externals and setup scripts.
There is no custom deployment framework. The calendar integration uses a pinned
third-party IndexedDB decoder rather than maintaining custom Python tooling.

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
omarchy/apps/notioncalendar/ local Notion Calendar app source and Arch package
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
theme and toggles. Its preset bindings are disabled, except for explicit
imports of native media, clipboard and input-method controls. Personal behavior
is split between `bindings.lua` (essentials and Command-style shortcuts),
`aerospace.lua` (Mac Alt bindings),
`workspaces.lua` (app placement), `looknfeel.lua`, `input.lua` and `monitors.lua`.
No implementations under `/usr/share/omarchy` are copied or edited.

Command/Super shortcuts translate to Linux equivalents in GUI apps, including
Chrome, web apps and Obsidian. Each app decides what its Ctrl shortcut does.

| Shortcut | Action |
| --- | --- |
| Super+C/V/X/A | Copy, paste, cut, select all; native terminal-aware copy/paste |
| Super+Z / Shift+Z, S, O, P | Undo/redo, save, open, print |
| Super+T / Shift+T, W | New/reopen/close tab |
| Super+N / Shift+N, L, F, R / Shift+R | New window/document, incognito/new folder, address bar, find, reload/hard reload |
| Super+D, +/−/0, 1–9 | Bookmark, zoom/reset, select tab |
| Super+[ / ], Super+Shift+[ / ] | Back/forward, previous/next tab |
| Super+arrows, Alt+Left/Right | Line/document navigation, word navigation; add Shift to select |
| Alt+Backspace/Delete, Super+Backspace/Delete | Delete word, delete to line start/end (GUI apps) |
| Super+Q, Super+Ctrl+F | Close focused window, toggle fullscreen |
| Super+Shift+L | Cycle workspace layout: tiling → scrolling → floating |
| Super+Tab, Super+` / Super+Shift+` | Last focused window, next/previous window on current workspace |
| Super+M | Native minimize to dock (floating workspaces only) |
| Super+Shift+3/4/5, Print | Fullscreen screenshot, region screenshot, capture menu, screenshot |
| Super+Ctrl+V, Super+Ctrl+Space | Clipboard history, emojis |
| Super+I / Shift+I | Next/previous input language |
| Power key, Super+mouse drag/right-drag | System menu, move/resize window |

Ghostty gets its native equivalents for select-all, new tab/window, close tab,
find, zoom and tab switching. Other editing/navigation chords pass through in
terminals: they must not inject shell controls such as Ctrl+S or Ctrl+Z.
Super+Tab is a last-window toggle, not a macOS application-switcher UI, and
Super+backtick cycles workspace windows rather than filtering by application.
Alt-based AeroSpace bindings and the working lid behavior are unchanged.

Ghostty, Foot, Kitty, Alacritty and btop retain native theme connections. Houses
sources are in `omarchy/.config/omarchy/themes/houses/`; `omarchy/theme` selects
the theme. Reapply refreshes it without cycling the wallpaper. Generated themes
stay in `~/.local/state`. The bar's original widgets are preserved; the clock,
agenda and neighbouring middle widgets are centered together as one group.

OpenCode retains separate server configs, shared portable plugins and Houses UI
settings. Work-only endpoints and WakaTime are not activated automatically.

### Notion Calendar

Omarchy setup builds and installs the local **Notion Calendar** app from
`omarchy/apps/notioncalendar/`, including its app-launcher entry and icon.
The package hook installs its Qt/build dependencies first; the focused
`run_onchange_after_35-notioncalendar` hook rebuilds and reinstalls it when
its source or packaging changes. Unchanged applies skip the build. Build output
and package archives are ignored, and macOS setup skips this app entirely.

Open **Notion Calendar** from the app launcher. It is an unofficial wrapper for
the official website, using Omarchy’s Chromium-based browser and existing
browser profile. Accounts, cookies, and calendar data never enter dotfiles.
Edit the source here, not the original `~/Work/notioncalendar` scaffold, then
review `chezmoi diff` and run `chezmoi apply` to rebuild. Setup can prompt for
sudo to install the Arch package. To build/test without applying dotfiles:

```bash
omarchy/apps/notioncalendar/bin/build
omarchy/apps/notioncalendar/bin/test
```

### Agenda bar widget

`omarchy/.config/omarchy/plugins/manish.agenda/` is a local Quickshell plugin.
Chezmoi's existing whole-root Omarchy symlink deploys it, and the tracked
`shell.json` enables it beside the stock clock in the centered group on Omarchy only. No extra
installer or copied stock clock is needed. Existing setup supplies Fish and
Node through mise. A focused chezmoi hook installs the pinned `rrule` dependency
with npm lifecycle scripts disabled.

It reads Notion Calendar's **local IndexedDB cache** every two minutes. There
is no agenda API client, token, OAuth flow, or network access in the reader.
Reads are shared across monitors. Dates not cached by Notion Calendar may have
no events; open the app and sync before relying on the agenda. The UI calls out
cached data, old cache timestamps, and failed reads. Remove the `manish.agenda`
bar entry to stop reads.

- **Click** the widget for the day's agenda; use **Previous / Today / Next** to
  move one day at a time. Browsing does not change today's next-event bar label.
- **Hover** for the next event's full title, time, and location.
- **Click an event**, or select it with **Up/Down** and press **Enter**, to open
  its Google Meet link. If there is no Meet link, nothing opens.
- **Middle-click** the bar widget to open today's next event's Meet link, if present.
- **Right-click** to refresh. In the popup, **Left/Right** change the day,
  **T** returns to today, **R** refreshes, and **Escape** closes it.
- All-day and past events appear in the popup; the next-event label uses
  ongoing/upcoming timed events. The footer button focuses the existing Notion
  Calendar window, or opens the app if it is not already running.

### Shared Notion Calendar reader (Omarchy + AeroSpace/SketchyBar)

`.config/notion-calendar/indexeddb.mjs` owns cache discovery, snapshotting,
decoding and meeting normalization for **both** the Omarchy widget and the
macOS SketchyBar calendar item used alongside AeroSpace. The adapters only
format their own UI; the macOS item retains its account filter, three-hour
horizon, and Meet-link action. Workspace indicators are unchanged.

Chezmoi links the shared root to `~/.config/notion-calendar` on both platforms.
The `run_onchange_after_36-calendar-parser` hook runs `scripts/setup-calendar.sh`,
which installs the same pinned external `dfindexeddb` decoder in an isolated
environment under `~/.local/share/notion-calendar/dfindexeddb`. Package setup
provides Python and Snappy; no custom Python parser is maintained. The decoder's
installation needs network access; routine calendar reads do not.

On macOS the source is the native Notion Calendar app's IndexedDB. On Omarchy
the reader discovers supported Chromium-based browser profiles. If more than
one profile has a cache, set an explicit `databasePath` on the `manish.agenda`
entry in `omarchy/.config/omarchy/shell.json` to the desired `.indexeddb.leveldb`
directory. The reader shows only events you created, organize, or attend, and
excludes declined/cancelled and recovered/deleted records.
Recurring series are expanded for the requested day in the event's timezone;
cached cancellations and moved instances override the generated occurrences.

The decoder runs against a private temporary copy, not the live database; source
changes during copying cause a retry. Copies are removed after each read. This
is a best-effort snapshot, not a transactional browser API, and cache format
changes can still require a decoder update. No browser profiles, parsed meeting
data, or credentials belong in dotfiles. There is no live API fallback.

Manual checks:

```bash
bash scripts/setup-calendar.sh
node ~/.config/notion-calendar/cli.mjs --date 2026-11-07
```

The CLI prints private meeting data as JSON; do not commit or publish its output.

### YouTube Music (macOS + Omarchy)

`.config/youtube-music/client.mjs` shares the local API client, song normalization,
controls and app launcher between SketchyBar and Omarchy. Chezmoi links this
dependency-free Node root on both platforms. The SketchyBar shell script is a
thin entry point; its text and artwork items use the same adapter. macOS keeps
its artwork, cached outside dotfiles with bounded HTTPS downloads from YouTube
image hosts. No authentication data or playback state is saved in the repo.

The local `manish.youtube-music` Omarchy plugin appears after the workspaces,
without moving any existing widgets. It shows a bounded song/artist label,
playback state, and the full title on hover. On Omarchy, **left-click** opens a
player popup with album art, title/artist/album, **Previous / Play–Pause / Next**
and an app-launch button. **Space** toggles playback and **Escape** closes it;
buttons also support Tab and Enter. SketchyBar keeps left-click play/pause.
Both bars retain **right-click** for next and **middle-click** to open the app.
The Omarchy popup also has an elapsed/total-time seek slider: click or drag and
release to choose a position. A drag sends just one absolute seek, not a request
per pixel. Tab to the slider and use **Left/Right** for five-second steps or
**Home/End** for the beginning/end. Seeking is disabled for unknown-duration
tracks and during track switches; a drag bound to an old track is discarded.
The displayed position advances locally while playing and is corrected by API
snapshots. Seek requests use the same immediate refresh and confirmation path
as the other playback controls.
Omarchy launches `youtube-music` if installed, otherwise the Music website;
the website fallback alone does not supply playback controls.

Use a compatible YouTube Music desktop app with its **API server enabled on
port 26538**. Requests target only `127.0.0.1`; neither adapter starts a server
or installs the app. A missing API clears stale track data and leaves a dimmed
launcher on Omarchy. The plugin polls every ten seconds, shared across monitors;
remove its `shell.json` bar entry to stop polling. Omarchy fetches artwork only
when the player is opened or its track changes while open. Covers use the same
bounded, validated local cache as macOS; image downloads never block controls.

Clicks do not wait for that poll: opening/closing the player or launching the
app requests status immediately. Playback clicks queue in order, each issuing
one control POST followed by a status GET, even if the POST fails. Refresh clicks
during an in-flight request are coalesced into a pending read, not dropped.
After a control, status is checked every 200 ms until the track identity or
playback state actually changes, with an eight-second confirmation deadline.
The popup shows “Switching track…” while waiting and reports an unconfirmed
change if the deadline expires. A command’s 204 acknowledgement is not proof
that the player has switched. Queued controls wait for the preceding change
to be confirmed, so one skip’s late result cannot falsely confirm the next.
Only status reads are retried, never toggles or skips. Controls remain clickable while busy.
The ten-second poll is just a fallback for changes made outside the widget.

If an updated popup still behaves like the older version, run
`omarchy restart shell`: the running QML component can remain cached despite a
plugin rescan. This restarts the shell, not the music app or desktop session.

```bash
node ~/.config/youtube-music/cli.mjs status
node --test .config/youtube-music/tests/*.test.mjs
bash scripts/test-music-ui.sh
```

## Verify

```bash
chezmoi verify --exclude=scripts,externals
bash scripts/test-chezmoi.sh
lua scripts/test_hyprland.lua
node scripts/check-hyprland-bindings.mjs # read-only check; requires running Hyprland
node scripts/test-theme.mjs
nvim --clean --headless -l scripts/test_navigation.lua
node --test .config/opencode/rex-session/test.mjs
node --test omarchy/.config/omarchy/plugins/manish.agenda/tests/agenda.test.mjs
node --test .config/notion-calendar/tests/*.test.mjs
bash scripts/test-agenda-ui.sh
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
