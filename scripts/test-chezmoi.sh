#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
tmp_base=${TMPDIR:-/tmp}
[[ ! -d /tmp/opencode ]] || tmp_base=/tmp/opencode
scratch=$(mktemp -d "$tmp_base/chezmoi-test.XXXXXX")
scratch=$(cd "$scratch" && pwd -P)
trap 'rm -rf "$scratch"' EXIT

# Copy only inputs needed to render the source state. Hooks never run here.
repo=$scratch/source
mkdir -p "$repo"
cp "$ROOT/.chezmoiroot" "$repo/"
cp -R "$ROOT/home" "$repo/"
git -C "$repo" init --quiet
mkdir -p "$repo/.config/opencode" "$repo/.config/mise" "$repo/scripts"
cp "$ROOT/.config/opencode/package-lock.json" "$repo/.config/opencode/"
cp "$ROOT/.config/mise/config.toml" "$repo/.config/mise/"
cp "$ROOT/scripts/setup-calendar.sh" "$repo/scripts/"
mkdir -p "$repo/.config/notion-calendar"
cp "$ROOT/.config/notion-calendar/package-lock.json" "$repo/.config/notion-calendar/"
mkdir -p "$repo/omarchy/.config/omarchy" "$repo/omarchy/apps/notioncalendar"
cp "$ROOT/omarchy/theme" "$repo/omarchy/"
cp "$ROOT/omarchy/.config/omarchy/shell.json" "$repo/omarchy/.config/omarchy/"
cp -R "$ROOT/omarchy/apps/notioncalendar/"{bin,src} "$repo/omarchy/apps/notioncalendar/"
mkdir -p "$repo/omarchy/apps/notioncalendar/pkgbuild"
cp "$ROOT/omarchy/apps/notioncalendar/pkgbuild/"{PKGBUILD,notioncalendar.desktop,notioncalendar.svg} "$repo/omarchy/apps/notioncalendar/pkgbuild/"
cp "$ROOT/omarchy/apps/notioncalendar/"{notioncalendar.pro,LICENSE} "$repo/omarchy/apps/notioncalendar/"

scenario() {
  case_name=$1
  os=$3
  mkdir -p "$scratch/$case_name/home"
  cat > "$scratch/$case_name/config.toml" <<EOF
sourceDir = "$repo"
[data]
omarchy = $2
EOF
}

cm() {
  chezmoi --config "$scratch/$case_name/config.toml" --destination "$scratch/$case_name/home" \
    --persistent-state "$scratch/$case_name/state.boltdb" --working-tree "$repo" \
    --override-data "{\"chezmoi\":{\"os\":\"$os\"}}" "$@"
}

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

for platform in omarchy macos; do
  if [[ $platform == omarchy ]]; then
    scenario "$platform" true linux
    desktop=hypr
    excluded=aerospace
  else
    scenario "$platform" false darwin
    desktop=aerospace
    excluded=hypr
  fi
  home=$scratch/$case_name/home
  cm apply --dry-run --verbose --exclude=scripts,externals > "$scratch/preview"
  [[ -z $(ls -A "$home") ]] || fail 'Preview wrote to the target'
  cm apply --exclude=scripts,externals
  cm verify --exclude=scripts,externals
  [[ -L $home/.config/$desktop ]] || fail "Missing $platform desktop root"
  [[ ! -e $home/.config/$excluded && ! -L $home/.config/$excluded ]] || fail "Wrong desktop on $platform"
  [[ $(readlink "$home/.config/opencode") == "$repo/$platform/.config/opencode" ]] || fail "Wrong OpenCode variant on $platform"
  echo "PASS $platform: read-only preview, native apply/verify and OS selection"
done

# Atomic app saves must stay in the source tree and survive reapplication.
scenario omarchy true linux
home=$scratch/omarchy/home
printf 'new app preference\n' > "$home/.config/omarchy/.next"
mv "$home/.config/omarchy/.next" "$home/.config/omarchy/shell.json"
[[ -L $home/.config/omarchy ]] || fail 'App save replaced the directory symlink'
cm apply --exclude=scripts,externals
grep -qx 'new app preference' "$repo/omarchy/.config/omarchy/shell.json" || fail 'App save escaped the repo or was overwritten'
echo 'PASS atomic app saves remain in dotfiles after reapply'
