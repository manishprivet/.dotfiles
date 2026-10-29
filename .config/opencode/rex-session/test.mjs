import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import plugin from "./tui.js"

const root = mkdtempSync(join(tmpdir(), "rex-agent-test-"))
const original = { ...process.env }
try {
  process.env.XDG_STATE_HOME = root
  process.env.REX_BLOCK = "block:test"
  process.env.REX_SESSION = "session:test"
  const path = join(root, "rex/agent-sessions/block:test.json")
  let route = { type: "session", sessionID: "ses_first" }
  const dispose = plugin.setup({
    ui: { router: { current: () => route } },
    data: { session: { get: () => ({ location: { directory: "/worktree" } }) } },
  })
  let record = JSON.parse(readFileSync(path))
  assert.equal(record.session_id, "ses_first")
  assert.equal(record.cwd, "/worktree")
  assert.equal(record.pid, process.pid)
  route = { type: "session", sessionID: "ses_second" }
  await new Promise((resolve) => setTimeout(resolve, 600))
  assert.equal(JSON.parse(readFileSync(path)).session_id, "ses_second")
  route = { type: "home" }
  await new Promise((resolve) => setTimeout(resolve, 600))
  assert.equal(existsSync(path), false)
  dispose()
  delete process.env.REX_BLOCK
  assert.equal(plugin.setup({}), undefined)
  console.log("rex OpenCode session capture: all tests passed")
} finally {
  process.env = original
  rmSync(root, { recursive: true, force: true })
}
