import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync, renameSync, readFileSync, unlinkSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

// TUI-local: a shared OpenCode server's environment cannot identify a Rex pane.
export default {
  id: "rex.session-persistence",
  setup(context) {
    const block = process.env.REX_BLOCK
    const session = process.env.REX_SESSION
    if (![block, session].every((value) => typeof value === "string" && /^[\w:-]+$/.test(value))) return
    // Explicit remote connections are not safely resumable on this local host.
    if (process.argv.includes("--server") || process.argv.some((arg) => arg.startsWith("--server="))) return
    const root = join(process.env.XDG_STATE_HOME || join(homedir(), ".local/state"), "rex/agent-sessions")
    const path = join(root, `${block}.json`)
    const temporary = `${path}.${process.pid}.tmp`
    let last
    function clear() {
      try {
        if (JSON.parse(readFileSync(path, "utf8")).pid === process.pid) unlinkSync(path)
      } catch {}
    }
    function sync() {
      try {
        const route = context.ui.router.current()
        const id = route.type === "session" ? route.sessionID : undefined
        const info = id && context.data.session.get(id)
        const cwd = info?.location?.directory
        if (!id || !cwd) {
          if (last) clear()
          last = undefined
          return
        }
        const key = `${id}\0${cwd}`
        if (last === key) return
        mkdirSync(root, { recursive: true, mode: 0o700 })
        const identity = execFileSync("/bin/ps", ["-p", String(process.pid), "-o", "lstart="], { encoding: "utf8" })
        writeFileSync(temporary, JSON.stringify({ agent: "opencode", session_id: id, cwd,
          rex_session: session, pid: process.pid, identity }), { mode: 0o600 })
        renameSync(temporary, path)
        last = key
      } catch {
        // Retry next tick; an integration failure must not break the TUI.
      }
    }
    sync()
    const timer = setInterval(sync, 500)
    timer.unref?.()
    return () => { clearInterval(timer); clear() }
  },
}
