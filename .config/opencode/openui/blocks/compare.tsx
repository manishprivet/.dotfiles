import { diffLines } from "diff"
import { createSignal, For, Show } from "solid-js"
import { z } from "zod/v4"
import { BlockHeader, Button, CopyButton, defineBlock, Grid, list, Switch, useColors, type GridRow } from "../shared.tsx"

// ---- CompareMatrix -----------------------------------------------------------------------------

// The value most columns agree on; cells that differ from it are the drift.
function majority(values: string[]) {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

export const CompareMatrix = defineBlock({
  name: "CompareMatrix",
  description:
    "The same properties side by side across clusters, environments, regions, spaces, or sources (e.g. US vs Tokyo vs lab; repo vs rendered manifest vs live vs Terraform plan). One row per property; values follow columns. Cells that differ from the majority are highlighted unless the row sets mayDiffer (expected to differ, e.g. names). Write values exactly as observed, including type hints like \"8\" vs 8.",
  props: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.object({ label: z.string(), values: z.array(z.string()), note: z.string().optional(), mayDiffer: z.boolean().optional() })),
    title: z.string().optional(),
  }),
  component: ({ props }) => {
    const c = useColors()
    const [onlyDiffs, setOnlyDiffs] = createSignal(false)
    const columns = list(props.columns)
    const rows = list(props.rows).map((r) => {
      const values = columns.map((_, i) => list(r.values)[i] ?? "")
      const common = majority(values)
      const differs = !r.mayDiffer && new Set(values).size > 1
      return { ...r, values, common, differs }
    })
    const diffCount = rows.filter((r) => r.differs).length
    const grid = (): GridRow[] =>
      (onlyDiffs() ? rows.filter((r) => r.differs) : rows).map((r) => ({
        cells: [
          [
            ...(r.differs ? [{ text: "● ", fg: c().warn }] : []),
            { text: r.label, fg: c().muted },
            ...(r.note ? [{ text: `\n${r.note}`, fg: c().faint }] : []),
          ],
          ...r.values.map((v) => (v ? [{ text: v, fg: r.differs && v !== r.common ? c().warn : c().text, bg: r.differs && v !== r.common ? c().warnBg : undefined }] : [{ text: "—", fg: c().faint }])),
        ],
      }))
    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader title={props.title} description={`${diffCount} of ${rows.length} properties differ`}>
          <Switch label="Only differences" checked={onlyDiffs()} onChange={setOnlyDiffs} />
        </BlockHeader>
        <Grid columns={["", ...columns]} rows={grid()} />
      </box>
    )
  },
})

// ---- ConfigDiff --------------------------------------------------------------------------------

type Line = { kind: "add" | "del" | "same"; text: string; a?: number; b?: number }
type Chunk = { kind: "lines"; lines: Line[] } | { kind: "gap"; lines: Line[] }
const CONTEXT = 3

function toLines(before: string, after: string): Line[] {
  const out: Line[] = []
  let a = 1
  let b = 1
  for (const part of diffLines(before, after)) {
    const texts = part.value.replace(/\n$/, "").split("\n")
    for (const text of texts) {
      if (part.added) out.push({ kind: "add", text, b: b++ })
      else if (part.removed) out.push({ kind: "del", text, a: a++ })
      else out.push({ kind: "same", text, a: a++, b: b++ })
    }
  }
  return out
}

// Folds unchanged runs longer than the context around changes into expandable gaps.
function toChunks(lines: Line[]): Chunk[] {
  const keep = lines.map(() => false)
  lines.forEach((l, i) => {
    if (l.kind === "same") return
    for (let j = Math.max(0, i - CONTEXT); j <= Math.min(lines.length - 1, i + CONTEXT); j++) keep[j] = true
  })
  const chunks: Chunk[] = []
  lines.forEach((l, i) => {
    const kind = keep[i] ? "lines" : "gap"
    const last = chunks[chunks.length - 1]
    if (last?.kind === kind) last.lines.push(l)
    else chunks.push({ kind, lines: [l] })
  })
  return chunks
}

function DiffLine(props: { line: Line; width: number }) {
  const c = useColors()
  const fg = () => (props.line.kind === "add" ? c().ok : props.line.kind === "del" ? c().crit : c().text)
  const bg = () => (props.line.kind === "add" ? c().okBg : props.line.kind === "del" ? c().critBg : undefined)
  return (
    <box flexDirection="row" backgroundColor={bg()}>
      <box width={props.width * 2 + 4} flexShrink={0}>
        <text fg={c().faint}>
          {`${String(props.line.a ?? "").padStart(props.width)} ${String(props.line.b ?? "").padStart(props.width)} `}
          <span style={{ fg: fg() }}>{props.line.kind === "add" ? "+" : props.line.kind === "del" ? "-" : " "}</span>
        </text>
      </box>
      <box flexShrink={1}>
        <text fg={fg()} wrapMode="char">
          {props.line.text || " "}
        </text>
      </box>
    </box>
  )
}

export const ConfigDiff = defineBlock({
  name: "ConfigDiff",
  description:
    "A line diff between two versions of a config, manifest, values file, Terraform plan excerpt, or pod spec (e.g. repo vs live, old vs new ReplicaSet template, dev vs prod values). Pass the relevant excerpt of each side, not whole files; unchanged lines are folded.",
  props: z.object({
    before: z.string(),
    after: z.string(),
    beforeLabel: z.string().optional(),
    afterLabel: z.string().optional(),
    title: z.string().optional(),
    note: z.string().optional(),
  }),
  component: ({ props }) => {
    const c = useColors()
    const lines = toLines(props.before ?? "", props.after ?? "")
    const chunks = toChunks(lines)
    const [open, setOpen] = createSignal<Set<number>>(new Set())
    const added = lines.filter((l) => l.kind === "add").length
    const removed = lines.filter((l) => l.kind === "del").length
    const width = String(Math.max(1, ...lines.map((l) => Math.max(l.a ?? 0, l.b ?? 0)))).length
    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader
          title={props.title}
          description={
            <>
              <span style={{ fg: c().crit }}>- {props.beforeLabel ?? "before"}</span>
              {"  "}
              <span style={{ fg: c().ok }}>+ {props.afterLabel ?? "after"}</span>
              {"  "}
              <span style={{ fg: c().ok }}>+{added}</span> <span style={{ fg: c().crit }}>−{removed}</span>
            </>
          }
        >
          <CopyButton text={props.after ?? ""} label={`Copy ${props.afterLabel ?? "after"}`} />
        </BlockHeader>
        <Show when={props.note}>
          <text fg={c().muted} wrapMode="word">
            {props.note}
          </text>
        </Show>
        <box flexDirection="column" border borderStyle="rounded" borderColor={c().border}>
          <Show when={added + removed === 0}>
            <text fg={c().muted}> No differences.</text>
          </Show>
          <For each={chunks}>
            {(chunk, i) => (
              <Show
                when={chunk.kind === "lines" || open().has(i())}
                fallback={
                  <box backgroundColor={c().raised}>
                    <Button
                      variant="link"
                      label={`⋯ ${chunk.lines.length} unchanged line${chunk.lines.length === 1 ? "" : "s"}`}
                      onClick={() => setOpen((cur) => new Set(cur).add(i()))}
                    />
                  </box>
                }
              >
                <For each={chunk.lines}>{(l) => <DiffLine line={l} width={width} />}</For>
              </Show>
            )}
          </For>
        </box>
      </box>
    )
  },
})
