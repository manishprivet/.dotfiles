import { TextAttributes, type RGBA } from "@opentui/core"
import { createSignal, For, Show } from "solid-js"
import { z } from "zod/v4"
import {
  BlockHeader,
  chartColor,
  Collapsible,
  CopyButton,
  defineBlock,
  formatDay,
  formatGap,
  formatTime,
  Grid,
  list,
  parseTime,
  RefChip,
  tone,
  toneFg,
  ToggleGroup,
  useColors,
  useHost,
  ZoneToggle,
  type Palette,
  type Tone,
} from "../shared.tsx"
import { Ref } from "./context.tsx"

// ---- Timeline ----------------------------------------------------------------------------------

export const Timeline = defineBlock({
  name: "Timeline",
  description:
    "Ordered incident or change chronology. time is ISO 8601 (with Z or an offset; no offset means UTC) so the reader can switch between UTC, JST, IST, and local time; a short label also works when no exact time is known. source groups events by where they came from (GitHub, Argo, Octopus audit, Slack, Datadog...) and can be filtered; tone marks errors/warnings.",
  props: z.object({
    events: z.array(
      z.object({
        time: z.string(),
        label: z.string(),
        detail: z.string().optional(),
        source: z.string().optional(),
        tone: tone.optional(),
        link: z.optional(Ref.ref),
      }),
    ),
    title: z.string().optional(),
  }),
  component: ({ props }) => {
    const host = useHost()
    const c = useColors()
    const events = list(props.events).map((e) => ({ ...e, t: parseTime(e.time) }))
    const sources = [...new Set(events.map((e) => e.source).filter((s): s is string => !!s))]
    const [hidden, setHidden] = createSignal<string[]>([])
    const timed = events.every((e) => e.t !== undefined)
    const sorted = timed ? [...events].sort((a, b) => a.t! - b.t!) : events
    const shown = () => sorted.filter((e) => !e.source || !hidden().includes(e.source))
    const color = (s?: string) => (s ? chartColor(c(), sources.indexOf(s)) : c().muted)
    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader title={props.title}>
          <Show when={sources.length > 1}>
            <ToggleGroup
              options={sources.map((s) => ({ value: s, label: s, fg: color(s) }))}
              selected={(s) => !hidden().includes(s)}
              onToggle={(s) => setHidden((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))}
            />
          </Show>
          <Show when={events.some((e) => e.t !== undefined)}>
            <ZoneToggle />
          </Show>
        </BlockHeader>
        <box flexDirection="column">
          <For each={shown()}>
            {(e, i) => {
              const prev = () => shown()[i() - 1]
              const day = () => (e.t !== undefined ? formatDay(e.t, host.zone()) : undefined)
              const newDay = () => day() && (prev()?.t === undefined || formatDay(prev()!.t!, host.zone()) !== day())
              const gap = () => (e.t !== undefined && prev()?.t !== undefined && e.t - prev()!.t! > 0 ? formatGap(e.t - prev()!.t!) : undefined)
              const last = () => i() === shown().length - 1
              return (
                <box flexDirection="column">
                  <Show when={newDay()}>
                    <text fg={c().muted} attributes={TextAttributes.BOLD} paddingTop={i() > 0 ? 1 : 0}>
                      {day()}
                    </text>
                  </Show>
                  <box flexDirection="row" columnGap={1}>
                    <box flexDirection="column" width={1} flexShrink={0}>
                      <text fg={e.tone ? toneFg(c(), e.tone) : color(e.source)}>●</text>
                      <Show when={!last()}>
                        <box flexGrow={1} border={["left"]} borderColor={c().border} />
                      </Show>
                    </box>
                    <box flexDirection="column" flexShrink={1} paddingBottom={last() ? 0 : 1}>
                      <text fg={c().text} wrapMode="word">
                        <span style={{ fg: c().muted }}>{e.t !== undefined ? formatTime(e.t, host.zone()) : e.time}</span>
                        <Show when={gap()}>
                          <span style={{ fg: c().faint }}>{` ${gap()}`}</span>
                        </Show>{" "}
                        <span style={{ fg: e.tone === "crit" ? c().crit : e.tone === "warn" ? c().warn : c().text }}>{e.label}</span>
                        <Show when={e.source && sources.length > 1}>
                          <span style={{ fg: c().muted }}>{` · ${e.source}`}</span>
                        </Show>
                      </text>
                      <Show when={e.detail}>
                        <text fg={c().muted} wrapMode="word">
                          {e.detail}
                        </text>
                      </Show>
                      <Show when={e.link}>
                        <text>
                          <RefChip value={e.link?.props} />
                        </text>
                      </Show>
                    </box>
                  </box>
                </box>
              )
            }}
          </For>
        </box>
      </box>
    )
  },
})

// ---- MetricChart -------------------------------------------------------------------------------

const SPARSE = 4
const HEIGHT = 8
const AXIS = 7

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 })

// Braille cells hold 2×4 dots, so a chart of W×H cells plots at 2W×4H. Each cell takes the color
// of the last layer drawn into it: markers, then thresholds, then the series in order.
const DOTS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
]

class Canvas {
  bits: Uint8Array
  owner: Int16Array
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.bits = new Uint8Array(width * height)
    this.owner = new Int16Array(width * height).fill(-1)
  }
  dot(x: number, y: number, layer: number) {
    if (x < 0 || y < 0 || x >= this.width * 2 || y >= this.height * 4) return
    const i = (y >> 2) * this.width + (x >> 1)
    this.bits[i] |= DOTS[y & 3][x & 1]
    this.owner[i] = layer
  }
  line(x0: number, y0: number, x1: number, y1: number, layer: number) {
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      this.dot(x0, y0, layer)
      if (x0 === x1 && y0 === y1) return
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }
  // Each row as runs of one color, ready for spans.
  rows(color: (layer: number) => RGBA | undefined) {
    return Array.from({ length: this.height }, (_, r) => {
      const runs: { text: string; fg?: RGBA }[] = []
      for (let x = 0; x < this.width; x++) {
        const i = r * this.width + x
        const fg = this.owner[i] < 0 ? undefined : color(this.owner[i])
        const ch = this.bits[i] ? String.fromCharCode(0x2800 + this.bits[i]) : " "
        const last = runs[runs.length - 1]
        if (last && last.fg === fg) last.text += ch
        else runs.push({ text: ch, fg })
      }
      return runs
    })
  }
}

type Point = { x: number | string; values: (number | undefined)[] }

function Plot(props: {
  data: Point[]
  series: { name: string }[]
  kind: "line" | "area"
  timed: boolean
  yMax: number
  thresholds: { label: string; value: number; tone?: Tone }[]
  markers: { x: number; label: string }[]
  fmtX: (x: number | string) => string
  c: Palette
}) {
  const [width, setWidth] = createSignal(0)
  const cols = () => Math.max(10, width() - AXIS - 1)
  const lines = () => {
    const w = cols()
    const canvas = new Canvas(w, HEIGHT)
    const px = w * 2 - 1
    const py = HEIGHT * 4 - 1
    const xs = props.data.map((d) => d.x)
    const x0 = props.timed ? (xs[0] as number) : 0
    const x1 = props.timed ? (xs[xs.length - 1] as number) : Math.max(1, xs.length - 1)
    const toX = (x: number) => (x1 === x0 ? Math.round(px / 2) : Math.round(((x - x0) / (x1 - x0)) * px))
    const toY = (v: number) => py - Math.round((Math.max(0, v) / props.yMax) * py)
    const layers = props.markers.length + props.thresholds.length
    props.markers.forEach((m, i) => {
      for (let y = 0; y <= py; y += 2) canvas.dot(toX(m.x), y, i)
    })
    props.thresholds.forEach((t, i) => {
      for (let x = 0; x <= px; x += 3) canvas.dot(x, toY(t.value), props.markers.length + i)
    })
    props.series.forEach((_, s) => {
      let prev: [number, number] | undefined
      props.data.forEach((d, i) => {
        const v = d.values[s]
        if (v === undefined) return
        const point: [number, number] = [toX(props.timed ? (d.x as number) : i), toY(v)]
        if (prev) canvas.line(prev[0], prev[1], point[0], point[1], layers + s)
        else canvas.dot(point[0], point[1], layers + s)
        if (props.kind === "area") for (let y = point[1] + 1; y <= py; y += 2) canvas.dot(point[0], y, layers + s)
        prev = point
      })
    })
    return canvas.rows((layer) =>
      layer < props.markers.length
        ? props.c.muted
        : layer < layers
          ? toneFg(props.c, props.thresholds[layer - props.markers.length]?.tone ?? "crit")
          : chartColor(props.c, layer - layers),
    )
  }
  const yLabel = (row: number) => (row === 0 ? compact.format(props.yMax) : row === HEIGHT - 1 ? "0" : row === Math.floor(HEIGHT / 2) ? compact.format(props.yMax / 2) : "")
  const xAxis = () => {
    if (props.data.length === 0) return ""
    const first = props.fmtX(props.data[0].x)
    const last = props.fmtX(props.data[props.data.length - 1].x)
    return props.data.length === 1 ? first : first + last.padStart(Math.max(last.length + 1, cols() - first.length))
  }
  return (
    <box
      flexDirection="column"
      onSizeChange={function () {
        setWidth(this.width)
      }}
    >
      <Show when={width() > 0}>
        <For each={lines()}>
          {(runs, r) => (
            <text>
              <span style={{ fg: props.c.faint }}>{`${yLabel(r()).padStart(AXIS - 1)} ┤`}</span>
              <For each={runs}>{(run) => <span style={{ fg: run.fg }}>{run.text}</span>}</For>
            </text>
          )}
        </For>
        <text fg={props.c.faint}>{" ".repeat(AXIS) + xAxis()}</text>
      </Show>
    </box>
  )
}

// Bars run sideways in a terminal: one row per category and series, scaled to the largest value.
function Bars(props: { data: Point[]; series: { name: string }[]; yMax: number; unit: string; c: Palette }) {
  const [width, setWidth] = createSignal(0)
  const label = Math.min(24, Math.max(...props.data.map((d) => String(d.x).length), 4))
  const room = () => Math.max(6, width() - label - 14)
  return (
    <box
      flexDirection="column"
      onSizeChange={function () {
        setWidth(this.width)
      }}
    >
      <Show when={width() > 0}>
        <For each={props.data}>
          {(d) => (
            <For each={props.series}>
              {(s, i) => {
                const v = d.values[i()]
                return (
                  <text>
                    <span style={{ fg: props.c.muted }}>{(i() === 0 ? String(d.x) : "").slice(0, label).padEnd(label)} </span>
                    <span style={{ fg: chartColor(props.c, i()) }}>{v === undefined ? "" : "█".repeat(Math.max(v > 0 ? 1 : 0, Math.round((v / props.yMax) * room())))}</span>
                    <span style={{ fg: props.c.text }}>{v === undefined ? " —" : ` ${v.toLocaleString()}${props.unit}`}</span>
                    <Show when={props.series.length > 1}>
                      <span style={{ fg: props.c.faint }}>{` ${s.name}`}</span>
                    </Show>
                  </text>
                )
              }}
            </For>
          )}
        </For>
      </Show>
    </box>
  )
}

export const MetricChart = defineBlock({
  name: "MetricChart",
  description:
    "A metric over time from Datadog, Cloud Monitoring, kubectl top, or log counts you actually queried: memory vs limit, CPU, pod or runner counts, NAT drops per minute. series are named lists of [time, value] points (ISO 8601 times, or category labels for bar charts); never invent or interpolate points. thresholds draw horizontal lines such as a request, limit, or node capacity; markers draw vertical lines for deploys, restarts, OOM kills. query is the query you ran, so the user can open it themselves. kind: line (default) | area | bar.",
  props: z.object({
    title: z.string(),
    series: z.array(z.object({ name: z.string(), points: z.array(z.tuple([z.string(), z.number()])) })),
    unit: z.string().optional(),
    thresholds: z.array(z.object({ label: z.string(), value: z.number(), tone: tone.optional() })).optional(),
    markers: z.array(z.object({ time: z.string(), label: z.string() })).optional(),
    query: z.string().optional(),
    kind: z.enum(["line", "area", "bar"]).optional(),
    note: z.string().optional(),
  }),
  component: ({ props }) => {
    const host = useHost()
    const c = useColors()
    const series = list(props.series).filter((s) => s.name)
    const thresholds = list(props.thresholds)
    const markers = list(props.markers)
    const kind = props.kind ?? "line"
    const unit = props.unit ? ` ${props.unit}` : ""

    const pts = series.flatMap((s) => list(s.points))
    const timed = kind !== "bar" && pts.length > 0 && pts.every((p) => parseTime(p?.[0]) !== undefined)
    const rows = new Map<string | number, Point>()
    series.forEach((s, i) => {
      for (const p of list(s.points)) {
        if (!Array.isArray(p) || typeof p[1] !== "number") continue
        const x = timed ? parseTime(p[0])! : p[0]
        const row = rows.get(x) ?? { x, values: series.map(() => undefined) }
        row.values[i] = p[1]
        rows.set(x, row)
      }
    })
    const data = [...rows.values()]
    if (timed) data.sort((a, b) => (a.x as number) - (b.x as number))
    const xs = timed ? data.map((d) => d.x as number) : []
    const span = xs.length > 1 ? xs[xs.length - 1] - xs[0] : 0

    const sparse = series.filter((s) => list(s.points).length > 0 && list(s.points).length < SPARSE)
    const yMax = (Math.max(0, ...thresholds.map((t) => t.value), ...data.flatMap((d) => d.values.map((v) => v ?? 0))) || 1) * 1.08
    const showDate = span > 36 * 3600 * 1000
    const fmtX = (x: number | string) => (timed && typeof x === "number" ? formatTime(x, host.zone(), { date: showDate, seconds: span < 10 * 60 * 1000 }) : String(x))
    const markerXs = () => (timed ? markers.flatMap((m) => (parseTime(m.time) === undefined ? [] : [{ x: parseTime(m.time)!, label: m.label }])) : [])

    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader title={props.title} description={props.unit && `Unit: ${props.unit}`}>
          <Show when={timed}>
            <ZoneToggle />
          </Show>
          <Show when={props.query}>
            <CopyButton text={props.query!} label="Copy query" />
          </Show>
        </BlockHeader>
        <Show
          when={kind !== "bar"}
          fallback={<Bars data={data} series={series} yMax={yMax / 1.08} unit={unit} c={c()} />}
        >
          <Plot data={data} series={series} kind={kind === "area" ? "area" : "line"} timed={timed} yMax={yMax} thresholds={thresholds} markers={markerXs()} fmtX={fmtX} c={c()} />
        </Show>
        <Show when={series.length > 1 || thresholds.length > 0 || markerXs().length > 0}>
          <text fg={c().muted} wrapMode="word">
            <Show when={series.length > 1}>
              <For each={series}>
                {(s, i) => (
                  <>
                    <span style={{ fg: chartColor(c(), i()) }}>━</span> {s.name}
                    {"   "}
                  </>
                )}
              </For>
            </Show>
            <For each={thresholds}>
              {(t) => (
                <>
                  <span style={{ fg: toneFg(c(), t.tone ?? "crit") }}>┄</span> {`${t.label} ${compact.format(t.value)}${unit}`}
                  {"   "}
                </>
              )}
            </For>
            <For each={markerXs()}>
              {(m) => (
                <>
                  <span style={{ fg: c().muted }}>┊</span> {`${fmtX(m.x)} ${m.label}`}
                  {"   "}
                </>
              )}
            </For>
          </text>
        </Show>
        <Show when={sparse.length > 0}>
          <text fg={c().warn} wrapMode="word">
            ▲ Sparse data: {sparse.map((s) => `${s.name} has ${list(s.points).length} point${list(s.points).length === 1 ? "" : "s"}`).join("; ")}. Short-lived pods
            or coarse rollups can hide peaks.
          </text>
        </Show>
        <Show when={props.note}>
          <text fg={c().muted} wrapMode="word">
            {props.note}
          </text>
        </Show>
        <Show when={kind !== "bar" && data.length > 0}>
          <Collapsible label={`Data (${data.length} point${data.length === 1 ? "" : "s"})`}>
            <Grid
              columns={[timed ? `Time (${host.zone()})` : "x", ...series.map((s) => s.name)]}
              rows={data.map((d) => ({ cells: [fmtX(d.x), ...d.values.map((v) => (v === undefined ? "—" : `${v.toLocaleString()}${unit}`))] }))}
            />
          </Collapsible>
        </Show>
      </box>
    )
  },
})
