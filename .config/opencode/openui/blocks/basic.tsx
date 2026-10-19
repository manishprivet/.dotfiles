import { TextAttributes, type BoxRenderable } from "@opentui/core"
import { createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { z } from "zod/v4"
import { Button, CodeBlock, defineBlock, Grid, list, toneBg, toneFg, TONE_ICONS, useColors, useFollowUp, useHost, type Tone } from "../shared.tsx"

export const Text = defineBlock({
  name: "Text",
  description: "Short Markdown prose: explanation, reasoning, or caveats. No HTML.",
  props: z.object({ markdown: z.string() }),
  component: ({ props }) => {
    const host = useHost()
    return <markdown content={props.markdown ?? ""} syntaxStyle={host.syntaxStyle} conceal />
  },
})

const CALLOUT: Record<"info" | "warn" | "crit", Tone> = { info: "info", warn: "warn", crit: "crit" }

export const Callout = defineBlock({
  name: "Callout",
  description: "A single highlighted statement: the likely root cause, a blocker, or a safety note.",
  props: z.object({ tone: z.enum(["info", "warn", "crit"]), text: z.string() }),
  component: ({ props }) => {
    const c = useColors()
    const t = CALLOUT[props.tone] ?? "info"
    return (
      <box border={["left"]} borderStyle="heavy" borderColor={toneFg(c(), t)} backgroundColor={toneBg(c(), t)} paddingX={1}>
        <text fg={c().text} wrapMode="word">
          <span style={{ fg: toneFg(c(), t) }}>{TONE_ICONS[t].icon} </span>
          {props.text}
        </text>
      </box>
    )
  },
})

export const Table = defineBlock({
  name: "Table",
  description:
    "Compact generic table when no specific block fits. Prefer ResourceStatus for resource health and CompareMatrix for side-by-side comparisons. Keep it under ~15 rows.",
  props: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
    caption: z.string().optional(),
  }),
  component: ({ props }) => {
    const c = useColors()
    return (
      <box flexDirection="column">
        <Grid columns={list(props.columns)} rows={list(props.rows).map((r) => ({ cells: list(r) }))} />
        <Show when={props.caption}>
          <text fg={c().muted}>{props.caption}</text>
        </Show>
      </box>
    )
  },
})

// The TUI draws ```mermaid fences with its own renderer. The host can only reach it once the report
// sits in the transcript, so the source shows until then, and for good if it cannot.
function Mermaid(props: { source: string }) {
  const host = useHost()
  const c = useColors()
  const [drawn, setDrawn] = createSignal(false)
  // The diagram goes in a box of its own: Solid may clear a parent whose only dynamic child changes.
  let slot: BoxRenderable | undefined
  onMount(() => {
    if (host.streaming || !props.source.trim()) return
    const timer = setTimeout(() => {
      if (!slot || slot.isDestroyed) return
      const diagram = host.mermaid?.(props.source, slot)
      if (!diagram) return
      slot.add(diagram)
      setDrawn(true)
    })
    onCleanup(() => clearTimeout(timer))
  })
  return (
    <box flexDirection="column">
      <box ref={slot} flexDirection="column" />
      <Show when={!drawn()}>
        <box flexDirection="column" backgroundColor={c().raised} paddingX={1}>
          <text fg={c().faint}>mermaid</text>
          <text fg={c().text}>{props.source}</text>
        </box>
      </Show>
    </box>
  )
}

export const Diagram = defineBlock({
  name: "Diagram",
  description:
    "A Mermaid diagram for topology or flow that is hard to follow as text: request paths, dependency maps, incident sequences, state machines. Prefer DeliveryTrace for a delivery pipeline and CausalChain for a cause chain. source is Mermaid syntax (flowchart, sequenceDiagram, stateDiagram-v2, erDiagram, timeline, ...); no %%{init}%% directives or styling, the app themes it. Keep labels short and under ~25 nodes.",
  props: z.object({ source: z.string(), caption: z.string().optional() }),
  component: ({ props }) => {
    const c = useColors()
    return (
      <box flexDirection="column">
        <Mermaid source={props.source ?? ""} />
        <Show when={props.caption}>
          <text fg={c().muted} textAlign="center">
            {props.caption}
          </text>
        </Show>
      </box>
    )
  },
})

export const Evidence = defineBlock({
  name: "Evidence",
  description: "A read-only check this agent actually ran, with the finding it produced. Never use for commands you did not run.",
  props: z.object({ command: z.string(), finding: z.string() }),
  component: ({ props }) => {
    const c = useColors()
    return (
      <box flexDirection="column">
        <CodeBlock text={props.command ?? ""} prefix="$ " />
        <text fg={c().text} wrapMode="word">
          {props.finding}
        </text>
      </box>
    )
  },
})

export const NextChecks = defineBlock({
  name: "NextChecks",
  description:
    "Suggested next read-only checks. Clicking one sends prompt back to you as the user's next message, so phrase prompt as a request to you.",
  props: z.object({ items: z.array(z.object({ label: z.string(), prompt: z.string() })) }),
  component: ({ props }) => {
    const { send, disabled } = useFollowUp()
    const c = useColors()
    const items = list(props.items).filter((i) => i.label && i.prompt)
    return (
      <box flexDirection="column">
        <text fg={c().muted} attributes={TextAttributes.BOLD}>
          Next checks
        </text>
        <box flexDirection="row" flexWrap="wrap" columnGap={1}>
          <For each={items}>
            {(item) => <Button label={item.label} disabled={disabled} action={`Next check: ${item.label}`} onClick={() => send(item.prompt)} />}
          </For>
        </box>
      </box>
    )
  },
})
