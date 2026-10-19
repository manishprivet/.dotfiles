import { Plugin } from "@opencode/plugin/tui"
import { MarkdownRenderable, type Renderable } from "@opentui/core"
import { instructions } from "./instructions.ts"
import { closed, mount, parse } from "./render.tsx"
import type { Action, Host, Zone } from "./shared.tsx"

// Renders the OpenUI Lang reports from infra-console (```openui-lang fences) inline in the TUI
// transcript, and lets a session opt into the instructions that ask the agent to write them.
//
// /openui          toggles the OpenUI instructions for the open session, or on the home screen
//                  the default for new sessions. It uses the same instruction key and session
//                  metadata as infra-console, so both agree.
// /openui-actions  picks one of the buttons of the reports on screen with the keyboard.

const KEY = "openui"
const HARNESS = "infra-console"

type Metadata = Record<string, unknown> | undefined

// infra-console turns OpenUI on by default for its own sessions; the TUI's start without it.
const enabled = (metadata: Metadata) => (metadata?.harness === HARNESS ? metadata?.openui !== false : metadata?.openui === true)

// Removing the entry makes opencode tell the model that "openui" no longer applies, and re-adding
// it may fold the text back into the base instructions, before that notice. So once a session has
// had it off, the text says it overrides the notice.
const reenabledNote = `These OpenUI instructions are active again. They supersede any earlier notice in this conversation that the context under "openui" no longer applies: OpenUI Lang reports render in this session.

`

export default Plugin.define({
  id: "openui.tui",
  setup(api) {
    const [settings, update] = api.storage.store<{ zone: Zone; newSessions: boolean }>("openui", {
      initial: { zone: "UTC", newSessions: false },
    })
    // The buttons of the reports on screen, in the order they appeared.
    const actions = new Set<Action>()

    const sessionID = () => {
      const route = api.ui.router.current()
      return route.type === "session" ? route.sessionID : undefined
    }

    const send = async (prompt: string, options?: { confirm?: boolean }) => {
      const id = sessionID()
      if (!id) return api.ui.toast.show({ variant: "warning", message: "Open the session the report belongs to first." })
      if (options?.confirm !== false) {
        const ok = await api.ui.dialog.confirm({ title: "Send to the agent?", message: prompt, label: { confirm: "Send" } })
        if (!ok) return
      }
      try {
        await api.client.session.prompt({ sessionID: id, text: prompt })
      } catch (error) {
        api.ui.toast.show({ variant: "error", title: "OpenUI", message: `Could not send: ${error instanceof Error ? error.message : String(error)}` })
      }
    }

    // The TUI's markdown renderer (with its built-in Mermaid support) is not part of the plugin API;
    // it is reached through the transcript markdown that holds the report.
    const mermaid = (source: string, anchor: Renderable) => {
      let node: Renderable | null = anchor.parent
      while (node && !(node instanceof MarkdownRenderable)) node = node.parent
      const renderNode = (node as unknown as { _renderNode?: MarkdownRenderable["renderNode"] } | null)?._renderNode
      if (typeof renderNode !== "function" || !(node instanceof MarkdownRenderable)) return
      try {
        const raw = "```mermaid\n" + source + "\n```"
        const rendered = renderNode({ type: "code", lang: "mermaid", text: source, raw } as never, {
          syntaxStyle: node.syntaxStyle,
          conceal: node.conceal,
          concealCode: node.concealCode,
          defaultRender: () => null,
        })
        return rendered ?? undefined
      } catch {
        return
      }
    }

    const host = (syntaxStyle: Host["syntaxStyle"], streaming: boolean): Host => ({
      theme: () => api.theme,
      mode: () => api.themeMode,
      syntaxStyle,
      streaming,
      zone: () => settings.zone,
      setZone: (zone) => void update((s) => void (s.zone = zone)),
      copy: (text) => {
        if (!api.renderer.copyToClipboardOSC52(text)) api.ui.toast.show({ variant: "warning", message: "This terminal did not accept the copy (OSC 52)." })
      },
      send: (prompt, options) => void send(prompt, options),
      ask: (options) => api.ui.dialog.prompt(options),
      confirm: async (options) => (await api.ui.dialog.confirm({ title: options.title, message: options.message, label: { confirm: options.confirm } })) === true,
      register: (action) => {
        actions.add(action)
        return () => actions.delete(action)
      },
      mermaid,
    })

    // The transcript rebuilds a code block whenever its text changes, so each streamed chunk gets a
    // fresh report and the old one is destroyed.
    const offRenderer = api.markdown.registerCodeBlockRenderer("openui-lang", (token, context) => {
      const complete = closed(token.raw)
      const parsed = parse(token.text, complete)
      // A finished fence that is not a report (or not valid OpenUI Lang) shows as plain code.
      if (complete && !parsed.root) return context.defaultRender()
      return mount(api.renderer, parsed, host(context.syntaxStyle, !complete))
    })

    async function sync(id: string, on: boolean, reenabled: boolean) {
      if (on) return api.client.session.instructions.entry.put({ sessionID: id, key: KEY, value: reenabled ? reenabledNote + instructions : instructions })
      const entries = await api.client.session.instructions.entry.list({ sessionID: id })
      if (entries.some((e) => e.key === KEY)) await api.client.session.instructions.entry.remove({ sessionID: id, key: KEY })
    }

    // What this TUI last set, so the status flips at once instead of when the metadata syncs back.
    const [known, setKnown] = api.storage.memory<{ on: Record<string, boolean> }>("openui.status", { initial: { on: {} } })

    // Reactive. Subagents follow their root session, which is the one holding the instructions.
    const isOn = (id: string) => {
      const root = api.data.session.root(id)
      return known.on[root] ?? enabled(api.data.session.get(root)?.metadata as Metadata)
    }

    async function setOpenUI(id: string, on: boolean) {
      const session = await api.client.session.get({ sessionID: id })
      const metadata = session.metadata as Metadata
      const removed = metadata?.openuiRemoved === true || !on
      await api.client.session.update({ sessionID: id, metadata: { ...(metadata as object), openui: on, openuiRemoved: removed } as never })
      await sync(id, on, removed)
      setKnown((s) => void (s.on[id] = on))
    }

    // Before a session exists (the home screen), the toggle sets what the next new session starts with.
    async function toggleDefault() {
      const on = !settings.newSessions
      await update((s) => void (s.newSessions = on))
      api.ui.toast.show({ variant: "success", title: "OpenUI", message: on ? "Reports on for new sessions." : "Reports off for new sessions." })
    }

    async function toggle(id = sessionID()) {
      if (!id) return toggleDefault()
      try {
        const session = await api.client.session.get({ sessionID: id })
        if (session.parentID) return api.ui.toast.show({ variant: "warning", message: "OpenUI follows the main agent; toggle it in the parent session." })
        const on = !(known.on[id] ?? enabled(session.metadata as Metadata))
        await setOpenUI(id, on)
        await update((s) => void (s.newSessions = on))
        api.ui.toast.show({
          variant: "success",
          title: "OpenUI",
          message: on ? "Reports on for this session and new ones." : "Reports off for this session and new ones.",
        })
      } catch (error) {
        api.ui.toast.show({ variant: "error", title: "OpenUI", message: error instanceof Error ? error.message : String(error) })
      }
    }

    // New sessions follow the last choice. Subagent sessions never get the instructions: only the
    // main agent writes the final answer.
    const offCreated = api.data.on("session.created", (event) => {
      if (!settings.newSessions || event.data.parentID) return
      void setOpenUI(event.data.sessionID, true).catch(() => {})
    })

    async function pick() {
      // A report shown twice lists its buttons once, running the newest one.
      const list = [...new Map([...actions].map((a) => [a.label, a])).values()].reverse()
      if (list.length === 0) return api.ui.toast.show({ variant: "info", message: "No OpenUI report actions on screen." })
      const action = await api.ui.dialog.select({
        title: "OpenUI report actions",
        placeholder: "Search actions",
        options: list.map((a) => ({ title: a.label, value: a })),
      })
      action?.run()
    }

    // A keymap layer lives as long as the component that creates it, so, as the built-in plugins
    // do, it is created by an invisible claim on the app slot.
    const offCommands = api.ui.slot({
      append: "app",
      render() {
        api.keymap.layer(() => ({
          mode: "global",
          commands: [
            {
              id: "openui.toggle",
              title: "Toggle OpenUI reports",
              description: "Ask the agent for OpenUI Lang reports in this session (on the home screen: in new sessions)",
              group: "OpenUI",
              palette: true,
              slash: { name: "openui" },
              run: () => void toggle(),
            },
            {
              id: "openui.actions",
              title: "OpenUI report actions",
              description: "Run a button from a report on screen",
              group: "OpenUI",
              palette: true,
              slash: { name: "openui-actions" },
              run: () => void pick(),
            },
          ],
        }))
        return null
      },
    })

    // ---- Status ----------------------------------------------------------------------------------

    // Bottom bar, next to the prompt: a short tag, like the built-in /btw indicator. Click toggles.
    // On the home screen it shows (and toggles) what the next new session starts with.
    const offFooter = api.ui.slot({
      append: "prompt.footer.status",
      render: (input) => {
        const on = () => (input.sessionID ? isOn(input.sessionID) : settings.newSessions)
        return (
          <box flexShrink={0} onMouseDown={() => void toggle(input.sessionID)}>
            <text fg={on() ? api.theme.text.feedback.success.base : api.theme.text.faint}>{on() ? "◆ OpenUI" : "◇ OpenUI off"}</text>
          </box>
        )
      },
    })

    // Sidebar, styled like the built-in MCP section. Click toggles.
    const offSidebar = api.ui.slot({
      append: "sidebar.content",
      render: (input) => (
        <box flexDirection="column">
          <text fg={api.theme.text.base}>
            <b>OpenUI</b>
          </text>
          <box flexDirection="row" gap={1} onMouseDown={() => void toggle(input.sessionID)}>
            <text fg={isOn(input.sessionID) ? api.theme.text.feedback.success.base : api.theme.text.muted}>•</text>
            <text fg={api.theme.text.base}>
              Reports <span style={{ fg: api.theme.text.muted }}>{isOn(input.sessionID) ? "on" : "off · /openui"}</span>
            </text>
          </box>
        </box>
      ),
    })

    return () => {
      offRenderer()
      offCreated()
      offCommands()
      offFooter()
      offSidebar()
    }
  },
})
