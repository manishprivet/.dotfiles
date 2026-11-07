#!/usr/bin/env bash
# Exercise chezmoi itself, not a home-grown deployment implementation.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
tmp_base=${TMPDIR:-/tmp}
[[ ! -d /tmp/opencode ]] || tmp_base=/tmp/opencode
scratch=$(mktemp -d "$tmp_base/chezmoi-test.XXXXXX")
trap 'rm -rf "$scratch"' EXIT
repo=$scratch/source
mkdir -p "$repo"
cp "$ROOT/.chezmoiroot" "$repo/"
cp -R "$ROOT/home" "$repo/"
git -C "$repo" init --quiet
mkdir -p "$repo/.config/opencode" "$repo/.config/mise" "$repo/omarchy/.config/omarchy" "$repo/omarchy/.config/opencode"
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
[[ $(readlink "$home/.config/ghostty") == "$repo/omarchy/.config/ghostty" ]] || fail 'Wrong Linux variant'
[[ ! -e $home/.config/aerospace && ! -L $home/.config/aerospace ]] || fail 'Mac desktop leaked into Linux'
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
cm apply --force --exclude=scripts,externals
home=$scratch/macos/home
[[ -L $home/.config/aerospace && -L $home/.config/sketchybar ]] || fail 'Mac desktop links missing'
[[ ! -e $home/.config/hypr && ! -L $home/.config/hypr ]] || fail 'Hyprland leaked into macOS'
[[ $(readlink "$home/.config/opencode") == "$repo/macos/.config/opencode" ]] || fail 'Wrong Mac variant'
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
