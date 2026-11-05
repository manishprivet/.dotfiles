import { execFile } from "node:child_process"
import { Plugin } from "@opencode/plugin/tui"
import { createEffect, on } from "solid-js"
import { linkFromUrl, linksOf, MAX_LINKS, type SessionLink } from "./links.ts"

// Session links, TUI part: links a session to what it is about (Slack threads, GitHub PRs and issues,
// Linear issues), kept in the session's `metadata.links` (links.ts), so other clients can show them
// too. Links belong to the main session; a subagent shows its root's.
//
// /link [url]   links the open session to a URL (asks for one without it)
// /links        lists them: Enter opens one, ctrl+d unlinks it, ctrl+a adds another
//
// The bottom bar shows how many there are (click to list them), and the sidebar lists them. Agents
// link their own sessions with the server part's `session_link` tool (index.ts).
//
// A server only tells its own clients about a change, so links written through another opencode
// server on this machine can be missing from the TUI's session store. The links shown are read from
// the server (which reads storage) when a session opens, when /links opens, and on each change this
// server reports.

type Metadata = Record<string, unknown> | undefined

const MARKS: Record<string, string> = { slack: "#", github: "⎇", linear: "◇" }
const SOURCES: Record<string, string> = { slack: "Slack", github: "GitHub", linear: "Linear" }

// The TUI runs on this machine, so a link opens in its default handler (Slack links in the app).
function openUrl(url: string) {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open"
  execFile(command, [url], () => {})
}

export default Plugin.define({
  id: "session-links.tui",
  setup(api) {
    const sessionID = () => {
      const route = api.ui.router.current()
      return route.type === "session" ? route.sessionID : undefined
    }

    // Each root session's links as last read from or written to the server.
    const [known, setKnown] = api.storage.memory<{ links: Record<string, SessionLink[]> }>("session-links", { initial: { links: {} } })

    async function refresh(root: string) {
      const session = await api.client.session.get({ sessionID: root })
      setKnown((s) => void (s.links[root] = linksOf(session.metadata as Metadata)))
    }

    // Reactive.
    const links = (id: string) => {
      const root = api.data.session.root(id)
      return known.links[root] ?? linksOf(api.data.session.get(root)?.metadata as Metadata)
    }

    const fail = (error: unknown) =>
      api.ui.toast.show({ variant: "error", title: "Links", message: error instanceof Error ? error.message : String(error) })

    // Reads the metadata fresh, so links added meanwhile by other clients stay.
    async function write(id: string, change: (links: SessionLink[]) => SessionLink[]) {
      const session = await api.client.session.get({ sessionID: id })
      const metadata = session.metadata as Metadata
      const next = change(linksOf(metadata)).slice(0, MAX_LINKS)
      await api.client.session.update({ sessionID: id, metadata: { ...(metadata as object), links: next } as never })
      setKnown((s) => void (s.links[id] = next))
    }

    async function add(input?: string) {
      const id = sessionID()
      if (!id) return api.ui.toast.show({ variant: "warning", title: "Links", message: "Open a session to link it." })
      const raw =
        input?.trim() ||
        (await api.ui.dialog.prompt({
          title: "Link this session",
          description: "A Slack thread, GitHub PR or issue, or Linear issue",
          placeholder: "https://",
        }))
      if (!raw?.trim()) return
      const link = linkFromUrl(raw)
      if (!link) return api.ui.toast.show({ variant: "warning", title: "Links", message: "Not a Slack thread, GitHub PR or issue, or Linear issue link." })
      const root = api.data.session.root(id)
      if (links(root).length >= MAX_LINKS && !links(root).some((l) => l.subject === link.subject))
        return api.ui.toast.show({ variant: "warning", title: "Links", message: `A session takes at most ${MAX_LINKS} links.` })
      try {
        await write(root, (current) => [...current.filter((l) => l.subject !== link.subject), link])
        api.ui.toast.show({ variant: "success", title: "Linked", message: link.title })
      } catch (error) {
        fail(error)
      }
    }

    async function unlink(root: string, link: SessionLink) {
      api.ui.dialog.clear()
      try {
        await write(root, (current) => current.filter((l) => l.subject !== link.subject))
        api.ui.toast.show({ variant: "success", title: "Unlinked", message: link.title })
      } catch (error) {
        return fail(error)
      }
      if (links(root).length) void list()
    }

    async function list() {
      const id = sessionID()
      if (!id) return api.ui.toast.show({ variant: "warning", title: "Links", message: "Open a session to see its links." })
      const root = api.data.session.root(id)
      await refresh(root).catch(() => {})
      const current = links(root)
      if (!current.length) return api.ui.toast.show({ variant: "info", title: "Links", message: "None yet: /link <url> adds one." })
      const picked = await api.ui.dialog.select<SessionLink>({
        title: "Links",
        placeholder: "Search links",
        options: current.map((l) => ({
          title: l.title,
          value: l,
          description: l.url,
          category: (l.source && SOURCES[l.source]) || "Other",
          disabled: !l.url,
        })),
        actions: [
          { bind: "ctrl+d", title: "Unlink", onTrigger: (l) => void unlink(root, l) },
          {
            bind: "ctrl+a",
            title: "Add",
            selection: "none",
            onTrigger: () => {
              api.ui.dialog.clear()
              void add()
            },
          },
        ],
      })
      if (picked?.url) openUrl(picked.url)
    }

    // Changes through this server, from this TUI or another client of it.
    const offUpdated = api.data.on("session.metadata.updated", (event) => {
      const id = (event.data as { sessionID?: string } | undefined)?.sessionID
      if (id) void refresh(id).catch(() => {})
    })

    // A keymap layer lives as long as the component that creates it, so it is created by an
    // invisible claim on the app slot (as the built-in plugins do).
    const offCommands = api.ui.slot({
      append: "app",
      render() {
        api.keymap.layer(() => ({
          mode: "global",
          commands: [
            {
              id: "session-links.add",
              title: "Link this session",
              description: "Link a Slack thread, GitHub PR or issue, or Linear issue to the open session",
              group: "Links",
              palette: true,
              slash: { name: "link", arguments: true },
              enabled: () => !!sessionID(),
              run: (input) => void add(input),
            },
            {
              id: "session-links.list",
              title: "Session links",
              description: "Open or unlink what the session is linked to",
              group: "Links",
              palette: true,
              slash: { name: "links" },
              enabled: () => !!sessionID(),
              run: () => void list(),
            },
          ],
        }))
        return null
      },
    })

    // Bottom bar, next to the prompt: a short tag, only when there are links. Click lists them.
    const offFooter = api.ui.slot({
      append: "prompt.footer.status",
      render: (input) => {
        // The footer is there in every session, so this is where opening one reads its links.
        createEffect(on(() => input.sessionID, (id) => id && void refresh(api.data.session.root(id)).catch(() => {})))
        const count = () => (input.sessionID ? links(input.sessionID).length : 0)
        return count() > 0 ? (
          <box flexShrink={0} onMouseDown={() => void list()}>
            <text fg={api.theme.text.muted}>
              ↗ {count()} {count() === 1 ? "link" : "links"}
            </text>
          </box>
        ) : null
      },
    })

    // Sidebar, styled like the built-in MCP section. Click opens a link.
    const offSidebar = api.ui.slot({
      append: "sidebar.content",
      render: (input) => (
        <box flexDirection="column">
          <text fg={api.theme.text.base}>
            <b>Links</b>
          </text>
          {links(input.sessionID).length === 0 ? (
            <text fg={api.theme.text.muted}>{"none · /link <url>"}</text>
          ) : (
            links(input.sessionID).map((link) => (
              <box flexDirection="row" gap={1} onMouseDown={() => link.url && openUrl(link.url)}>
                <text fg={api.theme.text.muted}>{(link.source && MARKS[link.source]) || "•"}</text>
                <text fg={api.theme.text.base} wrapMode="none">
                  {link.title}
                </text>
              </box>
            ))
          )}
        </box>
      ),
    })

    return () => {
      offUpdated()
      offCommands()
      offFooter()
      offSidebar()
    }
  },
})
