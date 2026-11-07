#!/usr/bin/env bash
# Exercise chezmoi itself, not a home-grown deployment implementation.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
tmp_base=${TMPDIR:-/tmp}
[[ ! -d /tmp/opencode ]] || tmp_base=/tmp/opencode
scratch=$(mktemp -d "$tmp_base/chezmoi-test.XXXXXX")
scratch=$(cd "$scratch" && pwd -P)
trap 'rm -rf "$scratch"' EXIT
repo=$scratch/source
mkdir -p "$repo"
cp "$ROOT/.chezmoiroot" "$repo/"
cp -R "$ROOT/home" "$repo/"
git -C "$repo" init --quiet
mkdir -p "$repo/.config/opencode" "$repo/.config/mise" "$repo/omarchy/.config/omarchy" "$repo/omarchy/.config/opencode"
mkdir -p "$repo/.config/notion-calendar"
cp "$ROOT/.config/notion-calendar/"*.mjs "$ROOT/.config/notion-calendar/"*.json "$repo/.config/notion-calendar/"
cp -R "$ROOT/.config/notion-calendar/tests" "$repo/.config/notion-calendar/"
cp -R "$ROOT/.config/youtube-music" "$repo/.config/"
mkdir -p "$repo/scripts"
cp "$ROOT/scripts/setup-calendar.sh" "$repo/scripts/"
mkdir -p "$repo/omarchy/.config/omarchy/plugins"
cp -R "$ROOT/omarchy/.config/omarchy/plugins/manish.agenda" "$repo/omarchy/.config/omarchy/plugins/"
cp -R "$ROOT/omarchy/.config/omarchy/plugins/manish.youtube-music" "$repo/omarchy/.config/omarchy/plugins/"
mkdir -p "$repo/omarchy/apps"
mkdir -p "$repo/omarchy/apps/notioncalendar"
# Copy only source files, not local build products or package archives.
cp -R "$ROOT/omarchy/apps/notioncalendar/"{bin,src,tests} "$repo/omarchy/apps/notioncalendar/"
cp "$ROOT/omarchy/apps/notioncalendar/"{notioncalendar.pro,LICENSE} "$repo/omarchy/apps/notioncalendar/"
mkdir -p "$repo/omarchy/apps/notioncalendar/pkgbuild"
cp "$ROOT/omarchy/apps/notioncalendar/pkgbuild/"{PKGBUILD,notioncalendar.desktop,notioncalendar.svg} "$repo/omarchy/apps/notioncalendar/pkgbuild/"
printf '{}\n' > "$repo/.config/opencode/package-lock.json"
printf '[tools]\nnode = "24"\n' > "$repo/.config/mise/config.toml"
printf 'houses\n' > "$repo/omarchy/theme"
printf 'fixture\n' > "$repo/.tmux.conf"
printf '{"bar":{"position":"top"}}\n' > "$repo/omarchy/.config/omarchy/shell.json"

scenario() {
  case_name=$1
  mkdir -p "$scratch/$case_name/home"
  cat > "$scratch/$case_name/config.toml" <<EOF
sourceDir = "$repo"
[data]
omarchy = $2
EOF
  os=$3
}
cm() {
  chezmoi --config "$scratch/$case_name/config.toml" --destination "$scratch/$case_name/home" \
    --persistent-state "$scratch/$case_name/state.boltdb" --working-tree "$repo" \
    --override-data "{\"chezmoi\":{\"os\":\"$os\"}}" "$@"
}
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

scenario omarchy true linux
cm apply --dry-run --verbose --exclude=scripts,externals > "$scratch/preview"
[[ -z $(ls -A "$scratch/omarchy/home") ]] || fail 'Preview wrote to the target'
echo 'PASS native chezmoi preview is read-only'

# Render the native package hook, but never install packages in this fixture.
cm execute-template --file "$repo/home/.chezmoiscripts/run_onchange_before_10-packages.sh.tmpl" > "$scratch/packages.sh"
bash -n "$scratch/packages.sh"
mkdir -p "$scratch/package-bin"
cat > "$scratch/package-bin/omarchy" <<'PACKAGES'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" >> "$PACKAGE_CALLS"
PACKAGES
chmod +x "$scratch/package-bin/omarchy"
PACKAGE_CALLS="$scratch/package-calls" PATH="$scratch/package-bin:$PATH" bash "$scratch/packages.sh"
grep -Fxq 'pkg aur add pear-desktop-bin' "$scratch/package-calls" || fail 'Pear Desktop is not installed through the native AUR hook'
echo 'PASS Pear Desktop is wired through the native AUR hook without a real install'

# Render the real app hook, but replace its installer inside this fixture only.
calendar_hook="$repo/home/.chezmoiscripts/run_onchange_after_35-notioncalendar.sh.tmpl"
calendar_app="$repo/omarchy/apps/notioncalendar"
cat > "$calendar_app/bin/install" <<'INSTALL'
#!/bin/bash
set -euo pipefail
[[ $PWD == "$EXPECTED_CALENDAR_APP" && $# == 1 && $1 == --noconfirm ]]
printf 'installed\n' > "$PWD/fixture-install"
INSTALL
chmod +x "$calendar_app/bin/install"
cm execute-template --file "$calendar_hook" > "$scratch/calendar-before.sh"
bash -n "$scratch/calendar-before.sh"
EXPECTED_CALENDAR_APP="$calendar_app" bash "$scratch/calendar-before.sh"
[[ -f $calendar_app/fixture-install ]] || fail 'Calendar hook did not call its local installer'
printf '\n// Fixture source change.\n' >> "$calendar_app/src/backend.cpp"
cm execute-template --file "$calendar_hook" > "$scratch/calendar-after.sh"
if cmp -s "$scratch/calendar-before.sh" "$scratch/calendar-after.sh"; then fail 'Calendar source changes do not trigger the hook'; fi
mkdir -p "$calendar_app/build" "$calendar_app/pkgbuild/pkg"
printf 'generated output\n' > "$calendar_app/build/notioncalendar"
printf 'package output\n' > "$calendar_app/pkgbuild/fixture.pkg.tar.xz"
cm execute-template --file "$calendar_hook" > "$scratch/calendar-generated.sh"
cmp -s "$scratch/calendar-after.sh" "$scratch/calendar-generated.sh" || fail 'Calendar build output changes the hook'
echo 'PASS Calendar hook installs local source and hashes source, not generated output'

# Replace parser setup only inside the fixture; never download or install in tests.
cat > "$repo/scripts/setup-calendar.sh" <<'PARSER'
#!/bin/bash
set -euo pipefail
printf 'parser setup\n' > "$CALENDAR_SETUP_MARKER"
PARSER
cm execute-template --file "$repo/home/.chezmoiscripts/run_onchange_after_36-calendar-parser.sh.tmpl" > "$scratch/parser-setup.sh"
bash -n "$scratch/parser-setup.sh"
CALENDAR_SETUP_MARKER="$scratch/parser-called" bash "$scratch/parser-setup.sh"
[[ -f $scratch/parser-called ]] || fail 'Shared parser setup hook did not invoke its native script'
echo 'PASS shared parser setup is wired without a real install'

# The recurrence library is installed through the same native npm pattern as OpenCode.
cm execute-template --file "$repo/home/.chezmoiscripts/run_onchange_after_34-calendar-deps.sh.tmpl" > "$scratch/calendar-deps.sh"
bash -n "$scratch/calendar-deps.sh"
mkdir -p "$scratch/mock-bin"
cat > "$scratch/mock-bin/mise" <<'MISE'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$@" > "$CALENDAR_DEP_ARGS"
MISE
chmod +x "$scratch/mock-bin/mise"
CALENDAR_DEP_ARGS="$scratch/calendar-deps-args" PATH="$scratch/mock-bin:$PATH" bash "$scratch/calendar-deps.sh"
grep -Fxq "$repo/.config/notion-calendar" "$scratch/calendar-deps-args" || fail 'Recurrence dependencies install into the wrong root'
grep -Fxq -- '--ignore-scripts' "$scratch/calendar-deps-args" || fail 'Recurrence dependency lifecycle scripts were not disabled'
echo 'PASS recurrence dependencies are wired without a real install'

# Run only the backup hook in this fixture, never package/GUI hooks.
mkdir -p "$scratch/omarchy/home/.config/omarchy" "$scratch/omarchy/home/.config/opencode"
printf 'old shell\n' > "$scratch/omarchy/home/.config/omarchy/shell.json"
printf 'private local state\n' > "$scratch/omarchy/home/.config/opencode/service.json"
cm execute-template --file "$repo/home/.chezmoiscripts/run_once_before_00-backup.sh.tmpl" > "$scratch/backup.sh"
bash "$scratch/backup.sh" > "$scratch/backup.log"
saved=$(find "$scratch/omarchy/home/.local/state/dotfiles/backups" -name configs.tar.gz -print -quit)
[[ -n $saved ]] || fail 'No pre-migration archive'
tar -xOf "$saved" .config/omarchy/shell.json | grep -qx 'old shell' || fail 'Archive lost original contents'
grep -qx 'private local state' "$repo/omarchy/.config/opencode/service.json" || fail 'Local service state was not preserved'
echo 'PASS migration hook archives current config and preserves service registration'

cm apply --force --exclude=scripts,externals
home=$scratch/omarchy/home
[[ -L $home/.config/hypr && -L $home/.config/omarchy ]] || fail 'Omarchy config roots missing'
[[ -f $home/.config/omarchy/plugins/manish.agenda/manifest.json ]] || fail 'Agenda plugin missing from the deployed Omarchy root'
[[ -f $home/.config/notion-calendar/cli.mjs ]] || fail 'Shared calendar reader missing on Omarchy'
[[ -f $home/.config/youtube-music/cli.mjs ]] || fail 'Shared music client missing on Omarchy'
[[ -f $home/.config/omarchy/plugins/manish.youtube-music/manifest.json ]] || fail 'Music plugin missing on Omarchy'
[[ ! -e $home/.config/fish/secrets.fish ]] || fail 'Local Fish secrets leaked into setup'
[[ $(readlink "$home/.config/ghostty") == "$repo/omarchy/.config/ghostty" ]] || fail 'Wrong Linux variant'
[[ ! -e $home/.config/aerospace && ! -L $home/.config/aerospace ]] || fail 'Mac desktop leaked into Linux'
for app in evans gh htop rex; do
  [[ ! -L $home/.config/$app ]] || fail "Mac legacy root leaked into Linux: $app"
done
cm verify --exclude=scripts,externals
echo 'PASS Omarchy links and OS exclusions'

printf 'new app preference\n' > "$home/.config/omarchy/.next"
mv "$home/.config/omarchy/.next" "$home/.config/omarchy/shell.json"
[[ -L $home/.config/omarchy ]] || fail 'App save replaced the directory symlink'
grep -qx 'new app preference' "$repo/omarchy/.config/omarchy/shell.json" || fail 'App save escaped the repo'
cm apply --force --exclude=scripts,externals
grep -qx 'new app preference' "$repo/omarchy/.config/omarchy/shell.json" || fail 'Reapply discarded app preference'
echo 'PASS app-saved edits remain in dotfiles; reapply preserves them'

scenario macos false darwin
cm execute-template --file "$repo/home/.chezmoiscripts/run_onchange_before_10-packages.sh.tmpl" > "$scratch/packages-macos.sh"
if grep -q 'pear-desktop-bin' "$scratch/packages-macos.sh"; then fail 'Pear Desktop AUR package leaked into macOS'; fi
cm execute-template --file "$calendar_hook" > "$scratch/calendar-macos.sh"
[[ ! -s $scratch/calendar-macos.sh ]] || fail 'Omarchy Calendar hook leaked into macOS'
echo 'PASS Calendar install is excluded on macOS'
cm apply --force --exclude=scripts,externals
home=$scratch/macos/home
[[ -L $home/.config/aerospace && -L $home/.config/sketchybar ]] || fail 'Mac desktop links missing'
[[ -f $home/.config/notion-calendar/indexeddb.mjs ]] || fail 'Shared calendar reader missing on macOS'
[[ -f $home/.config/youtube-music/sketchybar.mjs ]] || fail 'Shared music adapter missing on macOS'
[[ ! -e $home/.config/hypr && ! -L $home/.config/hypr ]] || fail 'Hyprland leaked into macOS'
[[ ! -e $home/.config/omarchy/plugins/manish.agenda/manifest.json ]] || fail 'Omarchy agenda plugin leaked into macOS'
[[ $(readlink "$home/.config/opencode") == "$repo/macos/.config/opencode" ]] || fail 'Wrong Mac variant'
for app in evans gh htop rex; do
  [[ $(readlink "$home/.config/$app") == "$repo/.config/$app" ]] || fail "Missing Mac legacy root: $app"
done
cm verify --exclude=scripts,externals
echo 'PASS macOS links and OS exclusions'

scenario empty-migration true linux
cm execute-template --file "$repo/home/.chezmoiscripts/run_once_before_00-backup.sh.tmpl" > "$scratch/empty-backup.sh"
bash "$scratch/empty-backup.sh" > "$scratch/empty.log"
[[ ! -d $scratch/empty-migration/home/.local/state/dotfiles/backups ]] || fail 'Empty migration created an unnecessary archive'
echo 'PASS first-run backup hook handles an empty home'

scenario legacy-parent true linux
ln -s "$repo/.config" "$scratch/legacy-parent/home/.config"
cm execute-template --file "$repo/home/.chezmoiscripts/run_once_before_00-backup.sh.tmpl" > "$scratch/legacy-backup.sh"
if bash "$scratch/legacy-backup.sh" > "$scratch/legacy.log" 2>&1; then fail 'Whole-config parent link was not rejected'; fi
[[ -d $repo/.config/opencode ]] || fail 'Legacy migration damaged raw source'
echo 'PASS old whole-config Stow links are rejected before changing source'

echo 'All chezmoi sandbox checks passed; no real installs or desktop reloads.'
