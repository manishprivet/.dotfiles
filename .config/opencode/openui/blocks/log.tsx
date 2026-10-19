import { TextAttributes } from "@opentui/core"
import { createSignal, For, Show } from "solid-js"
import { z } from "zod/v4"
import { BlockHeader, Button, CopyButton, defineBlock, Grid, list, RefChip, Switch, useColors, useHost } from "../shared.tsx"
import { Ref } from "./context.tsx"

// Lines shown before "Show all"; the terminal counterpart of the browser's max-h-80 scroll area.
const VISIBLE = 30

export const LogExcerpt = defineBlock({
  name: "LogExcerpt",
  description:
    "An excerpt of a log (pod, CI step, Octopus task, Cloud Logging) with the decisive line pinned on top. text is the relevant excerpt, not the whole log; keyLine is the one line that explains the failure, copied verbatim from text; highlight lists other substrings to mark. groups summarises repeated errors by signature with counts. link points to the full log.",
  props: z.object({
    text: z.string(),
    keyLine: z.string().optional(),
    title: z.string().optional(),
    source: z.string().optional(),
    highlight: z.array(z.string()).optional(),
    groups: z.array(z.object({ signature: z.string(), count: z.number() })).optional(),
    link: z.optional(Ref.ref),
  }),
  component: ({ props }) => {
    const host = useHost()
    const c = useColors()
    const [query, setQuery] = createSignal("")
    const [marked, setMarked] = createSignal(false)
    const [all, setAll] = createSignal(false)
    const lines = (props.text ?? "").split("\n")
    const marks = [props.keyLine, ...list(props.highlight)].filter((m): m is string => !!m?.trim())
    const isMarked = (l: string) => marks.some((m) => l.includes(m.trim()))
    const shown = () => {
      const q = query().trim().toLowerCase()
      return lines.map((text, i) => ({ text, n: i + 1 })).filter((l) => (!q || l.text.toLowerCase().includes(q)) && (!marked() || isMarked(l.text)))
    }
    const visible = () => (all() ? shown() : shown().slice(0, VISIBLE))
    const groups = [...list(props.groups)].sort((a, b) => b.count - a.count)
    const maxCount = Math.max(1, ...groups.map((g) => g.count))
    const numberWidth = String(lines.length).length
    const filter = async () => {
      const next = await host.ask({ title: "Filter log lines", placeholder: "Substring, case-insensitive", value: query() })
      if (next !== undefined) setQuery(next)
    }
    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader title={props.title ?? "Log"} description={props.source}>
          <Show when={props.link}>
            <text>
              <RefChip value={props.link?.props} />
            </text>
          </Show>
          <CopyButton text={props.text ?? ""} />
        </BlockHeader>
        <Show when={props.keyLine}>
          <box border={["left"]} borderStyle="heavy" borderColor={c().crit} backgroundColor={c().critBg} paddingX={1}>
            <text fg={c().text} wrapMode="char">
              <span style={{ fg: c().crit }}>▶ </span>
              {props.keyLine}
            </text>
          </box>
        </Show>
        <Show when={groups.length > 0}>
          <Grid
            columns={["Error signature", "Count"]}
            rows={groups.map((g) => ({
              cells: [g.signature, [{ text: "█".repeat(Math.max(1, Math.round((g.count / maxCount) * 12))), fg: c().crit }, { text: ` ${g.count.toLocaleString()}` }]],
            }))}
          />
        </Show>
        <box flexDirection="row" flexWrap="wrap" columnGap={2}>
          <Button variant="outline" label={query() ? `Filter: ${query()}` : "Filter lines"} onClick={() => void filter()} />
          <Show when={query()}>
            <Button variant="link" label="clear" onClick={() => setQuery("")} />
          </Show>
          <Show when={marks.length > 0}>
            <Switch label="Marked only" checked={marked()} onChange={setMarked} />
          </Show>
          <text fg={c().muted}>
            {shown().length}/{lines.length} lines
          </text>
        </box>
        <box flexDirection="column" backgroundColor={c().raised} paddingX={1}>
          <For each={visible()}>
            {(l) => (
              <box flexDirection="row" backgroundColor={isMarked(l.text) ? c().critBg : undefined}>
                <box width={numberWidth + 1} flexShrink={0}>
                  <text fg={c().faint}>{String(l.n).padStart(numberWidth)}</text>
                </box>
                <box flexShrink={1}>
                  <text fg={isMarked(l.text) ? c().crit : c().text} wrapMode="char" attributes={isMarked(l.text) ? TextAttributes.BOLD : 0}>
                    {l.text || " "}
                  </text>
                </box>
              </box>
            )}
          </For>
        </box>
        <Show when={shown().length > VISIBLE}>
          <Button variant="link" label={all() ? "Show less" : `Show all ${shown().length} lines`} onClick={() => setAll(!all())} />
        </Show>
      </box>
    )
  },
})
