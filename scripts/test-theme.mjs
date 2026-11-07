// Run: node scripts/test-theme.mjs. No changes to the live theme.
import assert from "node:assert/strict"
import { readFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, rmSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const root = new URL("../", import.meta.url)
const theme = new URL("omarchy/.config/omarchy/themes/houses/", root)
const palette = JSON.parse(readFileSync(new URL(".config/houses/palette.json", root), "utf8")).colors
const colors = Object.fromEntries([...readFileSync(new URL("colors.toml", theme), "utf8").matchAll(/^([a-z_]+)\s*=\s*"([^"]+)"/gm)].map(([, key, value]) => [key, value]))
assert.equal(colors.mode, "dark")
const mapping = {
  background: "background", foreground: "foreground", accent: "coral", cursor: "coral",
  selection: "selection", selection_background: "selection", selection_foreground: "foreground",
  muted: "muted", lighter_background: "surface", red: "coral", yellow: "yellow", orange: "orange",
  green: "green", cyan: "aqua", blue: "seafoam", magenta: "purple", bright_foreground: "brightForeground",
  hyprland_active_border: "coral", hyprland_inactive_border: "border",
}
for (const [key, source] of Object.entries(mapping)) assert.equal(colors[key].toLowerCase(), palette[source].toLowerCase(), key)
for (const [key, value] of Object.entries(colors)) if (key !== "mode") assert.match(value, /^#[0-9a-f]{6}$/i)
const settings = url => readFileSync(url, "utf8").split("\n").map(line => line.trim().toLowerCase()).filter(line => line && !line.startsWith("#"))
assert.deepEqual(settings(new URL("ghostty.conf", theme)), settings(new URL(".config/ghostty/themes/Houses", root)))
assert.deepEqual(readFileSync(new URL("backgrounds/houses.jpg", theme)), readFileSync(new URL("wallpapers/houses.jpg", root)))
console.log("Houses palette, terminal colors and wallpaper passed")

if (existsSync("/usr/share/omarchy/default/themed")) {
  const scratch = mkdtempSync(join(existsSync("/tmp/opencode") ? "/tmp/opencode" : "/tmp", "houses-render-"))
  try {
    const staged = join(scratch, ".local/state/omarchy/current/next-theme")
    mkdirSync(staged, { recursive: true })
    cpSync(theme, staged, { recursive: true })
    const env = { ...process.env, HOME: scratch, XDG_CONFIG_HOME: join(scratch, ".config"), XDG_STATE_HOME: join(scratch, ".local/state"), XDG_CACHE_HOME: join(scratch, ".cache") }
    const render = spawnSync("omarchy", ["theme", "set-templates"], { env, encoding: "utf8", timeout: 30000 })
    assert.equal(render.status, 0, render.stdout + render.stderr)
    for (const name of readdirSync(staged).filter(name => /\.(toml|lua|conf|ini|theme)$/.test(name))) {
      assert.doesNotMatch(readFileSync(join(staged, name), "utf8"), /\{\{.*?\}\}/, name)
    }
    const validate = spawnSync("ghostty", ["+validate-config", `--config-file=${join(staged, "ghostty.conf")}`], { env, encoding: "utf8", timeout: 30000 })
    if (!validate.error || validate.error.code !== "ENOENT") assert.equal(validate.status, 0, validate.stdout + validate.stderr)
    console.log("Native Omarchy template rendering passed in a temporary home")
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}
