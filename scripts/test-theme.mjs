// Run: node scripts/test-theme.mjs. No changes to the live theme.
import assert from "node:assert/strict"
import { readFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, rmSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const root = new URL("../", import.meta.url)
const theme = new URL("omarchy/.config/omarchy/themes/houses/", root)

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
} else {
  console.log("SKIP native theme rendering: Omarchy templates are not installed")
}
