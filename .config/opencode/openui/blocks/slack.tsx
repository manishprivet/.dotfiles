import { TextAttributes } from "@opentui/core"
import { diffWords } from "diff"
import { createSignal, For, Match, Show, Switch } from "solid-js"
import { z } from "zod/v4"
import { Badge, Button, Card, CopyButton, defineBlock, list, RefChips, safeHref, ToggleGroup, useColors, useFollowUp, useHost } from "../shared.tsx"
import { Ref } from "./context.tsx"

function WordDiff(props: { before: string; after: string }) {
  const c = useColors()
  return (
    <text fg={c().text} wrapMode="word">
      <For each={diffWords(props.before, props.after)}>
        {(part) => (
          <span
            style={{
              fg: part.added ? c().ok : part.removed ? c().crit : undefined,
              bg: part.added ? c().okBg : part.removed ? c().critBg : undefined,
              attributes: part.removed ? TextAttributes.STRIKETHROUGH : 0,
            }}
          >
            {part.value}
          </span>
        )}
      </For>
    </text>
  )
}

export const SlackReplyDraft = defineBlock({
  name: "SlackReplyDraft",
  description:
    "A Slack reply you propose, for the user to review before anything is posted. Use it every time you would reply in a thread, and do not post in the same turn: the user edits it here and clicks Post, which sends you the final text to post. threadUrl is the https Slack permalink. previous is your last draft of this reply, if any, to show what changed. voice is 'user' when written as the user.",
  props: z.object({
    text: z.string(),
    threadUrl: z.string().optional(),
    channel: z.string().optional(),
    previous: z.string().optional(),
    voice: z.enum(["user", "neutral"]).optional(),
  }),
  component: ({ props }) => {
    const { send, disabled } = useFollowUp()
    const host = useHost()
    const c = useColors()
    const [draft, setDraft] = createSignal<string | undefined>(undefined)
    const [tab, setTab] = createSignal<"preview" | "changes">("preview")
    const text = () => draft() ?? props.text ?? ""
    const edited = () => draft() !== undefined && draft() !== props.text
    const thread = safeHref(props.threadUrl)
    const edit = async () => {
      const next = await host.ask({ title: "Edit reply", value: text() })
      if (next !== undefined) setDraft(next)
    }
    const revise = async () => {
      const note = await host.ask({ title: "Ask for changes", placeholder: "Shorter, tag the OP, drop the second paragraph…" })
      if (!note?.trim()) return
      send(`Revise the draft Slack reply: ${note.trim()}\n\nCurrent draft:\n<draft>\n${text()}\n</draft>\n\nShow the revised draft; do not post it.`, { confirm: false })
    }
    const post = async () => {
      const ok = await host.confirm({
        title: "Ask the agent to post this reply?",
        message: `${thread ? `It goes to ${thread}` : "It goes to the thread from this conversation"}${props.voice === "user" ? ", in your voice." : "."} The agent's own Slack permission rules still apply.\n\n${text()}`,
        confirm: "Post",
      })
      if (!ok) return
      send(`Post exactly this reply${thread ? ` to ${thread}` : " to the Slack thread from this conversation"}, with no changes:\n\n<reply>\n${text()}\n</reply>`, { confirm: false })
    }
    return (
      <Card title="Draft reply">
        <box flexDirection="row" flexWrap="wrap" justifyContent="space-between" columnGap={2}>
          <text fg={c().muted}>
            <Show when={props.voice === "user"}>
              <Badge variant="info">In your voice</Badge>{" "}
            </Show>
            <Show when={edited()}>
              <Badge variant="warning">Edited</Badge>{" "}
            </Show>
            {props.channel ?? ""}
            <Show when={thread}>
              {"  "}
              <a href={thread!} style={{ fg: c().accent, attributes: TextAttributes.UNDERLINE }}>
                Open thread
              </a>
              <span style={{ fg: c().faint }}> ↗</span>
            </Show>
          </text>
          <CopyButton text={text()} />
        </box>
        <Show when={props.previous || edited()}>
          <ToggleGroup
            options={[
              { value: "preview", label: "Preview" },
              { value: "changes", label: "Changes" },
            ]}
            selected={(v) => tab() === v}
            onToggle={(v) => setTab(v)}
          />
        </Show>
        <box backgroundColor={c().raised} paddingX={1}>
          <Switch>
            <Match when={tab() === "changes" && (props.previous || edited())}>
              <WordDiff before={edited() ? (props.text ?? "") : (props.previous ?? "")} after={text()} />
            </Match>
            <Match when={true}>
              <markdown content={text()} syntaxStyle={host.syntaxStyle} conceal />
            </Match>
          </Switch>
        </box>
        <box flexDirection="row" justifyContent="flex-end" columnGap={1}>
          <Button variant="outline" label="✎ Edit" onClick={() => void edit()} />
          <Button variant="outline" label="Ask for changes" disabled={disabled} action="Ask for changes to the Slack draft" onClick={() => void revise()} />
          <Button label="Post reply…" disabled={disabled || !text().trim()} action="Post the Slack draft" onClick={() => void post()} />
        </box>
      </Card>
    )
  },
})

const THREAD_STATUS = {
  open: { label: "Open", variant: "warning" },
  waiting: { label: "Waiting on requester", variant: "info" },
  answered: { label: "Answered", variant: "success" },
  resolved: { label: "Resolved", variant: "success" },
} as const

export const ThreadDigest = defineBlock({
  name: "ThreadDigest",
  description:
    "Summary of a Slack support thread: who asked, the ask, what changed since your last check (newSince), decisions so far, open questions, and related past threads or incidents as Refs. Quote people only from the thread itself.",
  props: z.object({
    ask: z.string(),
    asker: z.string().optional(),
    url: z.string().optional(),
    channel: z.string().optional(),
    status: z.enum(["open", "waiting", "answered", "resolved"]).optional(),
    participants: z.array(z.object({ name: z.string(), role: z.string().optional() })).optional(),
    newSince: z.array(z.string()).optional(),
    decisions: z.array(z.string()).optional(),
    openQuestions: z.array(z.string()).optional(),
    related: z.array(Ref.ref).optional(),
  }),
  component: ({ props }) => {
    const c = useColors()
    const url = safeHref(props.url)
    const status = props.status && THREAD_STATUS[props.status]
    const newSince = list(props.newSince)
    const decisions = list(props.decisions)
    const questions = list(props.openQuestions)
    const participants = list(props.participants)
    const Bullets = (b: { items: string[]; icon: string; fg: import("@opentui/core").RGBA }) => (
      <box flexDirection="column">
        <For each={b.items}>
          {(item) => (
            <box flexDirection="row" columnGap={1}>
              <text fg={b.fg} flexShrink={0}>
                {b.icon}
              </text>
              <text fg={c().text} wrapMode="word" flexShrink={1}>
                {item}
              </text>
            </box>
          )}
        </For>
      </box>
    )
    return (
      <Card title={props.channel ?? "Slack thread"}>
        <box flexDirection="row" flexWrap="wrap" justifyContent="space-between" columnGap={2}>
          <text fg={c().muted}>
            <Show when={status}>
              <Badge variant={status ? status.variant : "secondary"}>{status ? status.label : ""}</Badge>{" "}
            </Show>
            {props.asker ? `Asked by ${props.asker}` : ""}
          </text>
          <Show when={url}>
            <text>
              <a href={url!} style={{ fg: c().accent, attributes: TextAttributes.UNDERLINE }}>
                Open thread
              </a>
              <span style={{ fg: c().faint }}> ↗</span>
            </text>
          </Show>
        </box>
        <box border={["left"]} borderColor={c().border} paddingLeft={1}>
          <text fg={c().text} wrapMode="word">
            {props.ask}
          </text>
        </box>
        <Show when={newSince.length > 0}>
          <box flexDirection="column" backgroundColor={c().infoBg} paddingX={1}>
            <text fg={c().info} attributes={TextAttributes.BOLD}>
              New since last check
            </text>
            <Bullets items={newSince} icon="•" fg={c().info} />
          </box>
        </Show>
        <Show when={decisions.length > 0}>
          <Bullets items={decisions} icon="✓" fg={c().ok} />
        </Show>
        <Show when={questions.length > 0}>
          <Bullets items={questions} icon="?" fg={c().warn} />
        </Show>
        <Show when={participants.length > 0}>
          <text fg={c().text} wrapMode="word">
            <For each={participants}>
              {(p) => (
                <>
                  <Badge variant="secondary">{p.role ? `${p.name} · ${p.role}` : p.name}</Badge>{" "}
                </>
              )}
            </For>
          </text>
        </Show>
        <Show when={list(props.related).length > 0}>
          <box flexDirection="column">
            <text fg={c().muted}>Related</text>
            <RefChips items={props.related} />
          </box>
        </Show>
      </Card>
    )
  },
})
