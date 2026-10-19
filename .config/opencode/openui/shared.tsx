import type { ResolvedTheme } from "@opencode/theme/tui"
import { defineComponent } from "@openuidev/lang-core"
import { TextAttributes, type Renderable, type RGBA, type SyntaxStyle } from "@opentui/core"
import { children, createContext, createMemo, createSignal, For, onCleanup, Show, useContext, type JSX } from "solid-js"
import { z } from "zod/v4"

// Helpers shared by the report blocks: the bridge to the TUI (theme, clipboard, follow-up prompts),
// safe links, entity refs, status tones, buttons and toggles, tables, and the time-zone choice
// every timestamp in a report follows. Ported from infra-console's src/openui/shared.tsx.

// ---- Host --------------------------------------------------------------------------------------

export type Zone = "UTC" | "JST" | "IST" | "Local"
export const ZONES: Record<Zone, string | undefined> = { UTC: "UTC", JST: "Asia/Tokyo", IST: "Asia/Kolkata", Local: undefined }

export type Action = { label: string; run: () => void }

export interface Host {
  theme(): ResolvedTheme
  mode(): "dark" | "light"
  syntaxStyle: SyntaxStyle
  // The report is still streaming; follow-ups stay disabled until it is complete.
  streaming: boolean
  zone(): Zone
  setZone(zone: Zone): void
  copy(text: string): void
  // Sends prompt to the open session as the user's next message, after confirming it unless told not to.
  send(prompt: string, options?: { confirm?: boolean }): void
  ask(options: { title: string; description?: string; placeholder?: string; value?: string }): Promise<string | undefined>
  confirm(options: { title: string; message: string; confirm?: string }): Promise<boolean>
  // Lists an action in the keyboard picker (/openui-actions) while its block is on screen.
  register(action: Action): () => void
  // Renders a Mermaid source with the TUI's own renderer, found from a renderable in the transcript.
  mermaid?(source: string, anchor: Renderable): Renderable | undefined
}

// A block's renderer as the report renderer calls it. Props are typed as the schema says, but while
// a report streams any of them can still be missing, so blocks read them defensively.
export type Block<P> = (input: { props: P; renderNode: (value: unknown) => JSX.Element }) => JSX.Element

// lang-core's defineComponent with the renderer typed from the schema, as react-lang's is.
export function defineBlock<T extends z.ZodObject>(config: { name: string; description: string; props: T; component: Block<z.infer<T>> }) {
  return defineComponent(config)
}

const HostContext = createContext<Host>()
export const HostProvider = HostContext.Provider

export function useHost() {
  const host = useContext(HostContext)
  if (!host) throw new Error("OpenUI block rendered outside a report")
  return host
}

// Sends a prompt back to the agent as the user's next message (the only way a block acts). Buttons
// stay disabled while the report itself is still streaming.
export function useFollowUp() {
  const host = useHost()
  return { disabled: host.streaming, send: (prompt: string, options?: { confirm?: boolean }) => host.send(prompt, options) }
}

// ---- Colors ------------------------------------------------------------------------------------

export type Palette = {
  text: RGBA
  muted: RGBA
  faint: RGBA
  border: RGBA
  raised: RGBA
  accent: RGBA
  ok: RGBA
  info: RGBA
  warn: RGBA
  crit: RGBA
  okBg: RGBA
  infoBg: RGBA
  warnBg: RGBA
  critBg: RGBA
  chart: RGBA[]
}

function palette(t: ResolvedTheme, mode: "dark" | "light"): Palette {
  const step = mode === "dark" ? 400 : 600
  return {
    text: t.text.base,
    muted: t.text.muted,
    faint: t.text.faint,
    border: t.border.base,
    raised: t.background.raised.base,
    accent: t.text.action.primary.base,
    ok: t.text.feedback.success.base,
    info: t.text.feedback.info.base,
    warn: t.text.feedback.warning.base,
    crit: t.text.feedback.error.base,
    okBg: t.background.feedback.success.base,
    infoBg: t.background.feedback.info.base,
    warnBg: t.background.feedback.warning.base,
    critBg: t.background.feedback.error.base,
    chart: t.categorical.map((hue) => hue[step]),
  }
}

export function useColors() {
  const host = useHost()
  return createMemo(() => palette(host.theme(), host.mode()))
}

export const chartColor = (c: Palette, i: number) => c.chart[i % Math.max(1, c.chart.length)] ?? c.accent

// ---- Tones -------------------------------------------------------------------------------------

export const tone = z.enum(["ok", "info", "warn", "crit", "unknown"])
export type Tone = z.infer<typeof tone>

// A status glyph and its label, the terminal counterpart of infra-console's StatusIconSpec.
export type Mark = { label: string; icon: string; tone: Tone }

export const TONE_ICONS: Record<Tone | "pending" | "running" | "skipped", Mark> = {
  ok: { label: "OK", icon: "✓", tone: "ok" },
  info: { label: "Info", icon: "●", tone: "info" },
  warn: { label: "Warning", icon: "▲", tone: "warn" },
  crit: { label: "Critical", icon: "✗", tone: "crit" },
  unknown: { label: "Unknown", icon: "?", tone: "unknown" },
  pending: { label: "Pending", icon: "○", tone: "unknown" },
  running: { label: "Running", icon: "◐", tone: "info" },
  skipped: { label: "Skipped", icon: "⊘", tone: "unknown" },
}

export const toneFg = (c: Palette, t: Tone | undefined) =>
  t === "ok" ? c.ok : t === "info" ? c.info : t === "warn" ? c.warn : t === "crit" ? c.crit : c.muted

export const toneBg = (c: Palette, t: Tone | undefined) =>
  t === "ok" ? c.okBg : t === "info" ? c.infoBg : t === "warn" ? c.warnBg : t === "crit" ? c.critBg : c.raised

// Inline: use inside a <text>.
export function Icon(props: { mark: Mark }) {
  const c = useColors()
  return <span style={{ fg: toneFg(c(), props.mark.tone) }}>{props.mark.icon}</span>
}

export type Variant = "default" | "success" | "info" | "warning" | "destructive" | "secondary" | "outline"

const VARIANT_TONE: Record<Variant, Tone | undefined> = {
  default: undefined,
  success: "ok",
  info: "info",
  warning: "warn",
  destructive: "crit",
  secondary: undefined,
  outline: undefined,
}

// Inline: use inside a <text>.
export function Badge(props: { variant?: Variant; children: string | number }) {
  const c = useColors()
  const variant = () => props.variant ?? "default"
  const t = () => VARIANT_TONE[variant()]
  const fg = () => (t() ? toneFg(c(), t()) : variant() === "default" ? c().accent : c().muted)
  const bg = () => (variant() === "outline" ? undefined : t() ? toneBg(c(), t()) : c().raised)
  return <span style={{ fg: fg(), bg: bg() }}>{` ${props.children} `}</span>
}

// ---- Links and entity refs ---------------------------------------------------------------------

export const safeHref = (href?: string) => (href && /^https?:\/\//i.test(href) ? href : undefined)

// The renderer stays permissive while streaming, so arrays and nested objects can be missing or
// half-written; blocks read them through this.
export const list = <T,>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value.filter((v) => v != null) : [])

const REF_KINDS = ["file", "pr", "commit", "run", "octopus", "argo", "k8s", "gcp", "datadog", "slack", "doc", "other"] as const

export const ref = z.object({
  kind: z.enum(REF_KINDS),
  label: z.string(),
  href: z.string().optional(),
  id: z.string().optional(),
  note: z.string().optional(),
})
export type Ref = z.infer<typeof ref>
// A nested Ref as other blocks receive it: the parsed element, whose props may still be streaming.
export type RefNode = { props?: Partial<Ref> } | undefined

// Inline: use inside a <text>. A chip for a resource, file, PR, run, etc.: an OSC 8 link when it
// has an https URL. The id and note that infra-console shows on hover follow it in faint text.
export function RefChip(props: { value?: Partial<Ref>; detail?: boolean }) {
  const c = useColors()
  const href = () => safeHref(props.value?.href)
  const extra = () => [props.value?.id && `id ${props.value.id}`, props.value?.note].filter(Boolean).join(" · ")
  return (
    <Show when={props.value?.label}>
      <span style={{ fg: c().faint }}>{`${props.value?.kind ?? "other"}:`}</span>
      <Show when={href()} fallback={<span style={{ fg: c().text }}>{props.value?.label}</span>}>
        <a href={href()!} style={{ fg: c().accent, attributes: TextAttributes.UNDERLINE }}>
          {props.value?.label}
        </a>
        <span style={{ fg: c().faint }}> ↗</span>
      </Show>
      <Show when={props.detail && extra()}>
        <span style={{ fg: c().faint }}>{` (${extra()})`}</span>
      </Show>
    </Show>
  )
}

export function RefChips(props: { items?: RefNode[]; detail?: boolean }) {
  const refs = () => list(props.items).filter((r) => r?.props?.label)
  return (
    <Show when={refs().length > 0}>
      <box flexDirection="row" flexWrap="wrap" columnGap={2}>
        <For each={refs()}>
          {(r) => (
            <text>
              <RefChip value={r?.props} detail={props.detail} />
            </text>
          )}
        </For>
      </box>
    </Show>
  )
}

// ---- Controls ----------------------------------------------------------------------------------

export type ButtonVariant = "default" | "outline" | "ghost" | "link"

// A mouse target. `action` also lists it in the keyboard picker under that name.
export function Button(props: {
  label: string
  onClick: () => void
  variant?: ButtonVariant
  disabled?: boolean
  action?: string
  fg?: RGBA
}) {
  const host = useHost()
  const c = useColors()
  const [hover, setHover] = createSignal(false)
  if (props.action && !props.disabled) onCleanup(host.register({ label: props.action, run: props.onClick }))
  const fg = () =>
    props.disabled ? c().faint : props.fg ? props.fg : props.variant === "default" ? c().accent : props.variant === "link" || props.variant === "ghost" ? c().muted : c().text
  const text = () => (props.variant === "link" ? props.label : `[ ${props.label} ]`)
  return (
    <box
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
      onMouseUp={() => {
        if (!props.disabled) props.onClick()
      }}
    >
      <text fg={fg()} bg={hover() && !props.disabled ? c().raised : undefined} attributes={props.variant === "link" && hover() ? TextAttributes.UNDERLINE : 0}>
        {text()}
      </text>
    </box>
  )
}

export function CopyButton(props: { text: string; label?: string }) {
  const host = useHost()
  const [done, setDone] = createSignal(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))
  return (
    <Button
      variant="outline"
      label={done() ? "✓ Copied" : (props.label ?? "Copy")}
      onClick={() => {
        host.copy(props.text)
        setDone(true)
        clearTimeout(timer)
        timer = setTimeout(() => setDone(false), 1200)
      }}
    />
  )
}

// Single- or multi-select pills, the counterpart of shadcn's ToggleGroup.
export function ToggleGroup<T extends string>(props: {
  options: { value: T; label: string; fg?: RGBA }[]
  selected: (value: T) => boolean
  onToggle: (value: T) => void
}) {
  const c = useColors()
  return (
    <box flexDirection="row">
      <For each={props.options}>
        {(o) => {
          const [hover, setHover] = createSignal(false)
          return (
            <box onMouseOver={() => setHover(true)} onMouseOut={() => setHover(false)} onMouseUp={() => props.onToggle(o.value)}>
              <text
                fg={props.selected(o.value) ? c().text : c().faint}
                bg={props.selected(o.value) ? c().raised : hover() ? c().raised : undefined}
                attributes={props.selected(o.value) ? TextAttributes.BOLD : 0}
              >
                <Show when={o.fg}>
                  <span style={{ fg: props.selected(o.value) ? o.fg : c().faint }}> ●</span>
                </Show>
                {` ${o.label} `}
              </text>
            </box>
          )
        }}
      </For>
    </box>
  )
}

export function Switch(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const c = useColors()
  return (
    <box onMouseUp={() => props.onChange(!props.checked)}>
      <text fg={props.checked ? c().text : c().muted}>
        <span style={{ fg: props.checked ? c().accent : c().faint }}>{props.checked ? "◉" : "○"}</span> {props.label}
      </text>
    </box>
  )
}

// A clickable heading that shows or hides its children, the counterpart of Collapsible.
export function Collapsible(props: { label: string; defaultOpen?: boolean; fg?: RGBA; children: JSX.Element }) {
  const c = useColors()
  const [open, setOpen] = createSignal(props.defaultOpen ?? false)
  return (
    <box flexDirection="column">
      <box onMouseUp={() => setOpen(!open())}>
        <text fg={props.fg ?? c().muted}>
          {open() ? "▾ " : "▸ "}
          {props.label}
        </text>
      </box>
      <Show when={open()}>
        <box flexDirection="column" paddingLeft={2}>
          {props.children}
        </box>
      </Show>
    </box>
  )
}

// ---- Layout ------------------------------------------------------------------------------------

// True when two headings say the same thing apart from case, spacing, and punctuation, so a
// subtitle that only repeats its title can be dropped.
export const sameText = (a?: string, b?: string) => {
  const norm = (s?: string) => (s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "")
  return norm(a) !== "" && norm(a) === norm(b)
}

// The header every block shares: a bold title, an optional description (text or spans), and
// controls on the right.
export function BlockHeader(props: { title?: string; description?: JSX.Element; children?: JSX.Element }) {
  const c = useColors()
  // Resolved once: reading a JSX prop again would create its elements again.
  const given = children(() => props.description)
  const controls = children(() => props.children)
  const description = () => {
    const d = given()
    return typeof d === "string" && sameText(d, props.title) ? undefined : d
  }
  return (
    <Show when={props.title || description() || controls()}>
      <box flexDirection="row" flexWrap="wrap" justifyContent="space-between" columnGap={2}>
        <box flexDirection="column" flexShrink={1}>
          <Show when={props.title}>
            <text fg={c().text} attributes={TextAttributes.BOLD}>
              {props.title}
            </text>
          </Show>
          <Show when={description()}>
            <text fg={c().muted}>{description()}</text>
          </Show>
        </box>
        <Show when={controls()}>
          <box flexDirection="row" flexWrap="wrap" columnGap={1} alignItems="center">
            {controls()}
          </box>
        </Show>
      </box>
    </Show>
  )
}

// A horizontal rule between list items (a box with `border={false}` still draws all four sides).
export function Divider() {
  const c = useColors()
  return <box height={1} border={["top"]} borderColor={c().border} />
}

// A titled, rounded frame, the counterpart of shadcn's Card.
export function Card(props: { title?: string; borderColor?: RGBA; dim?: boolean; children: JSX.Element }) {
  const c = useColors()
  return (
    <box
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={props.borderColor ?? c().border}
      title={props.title ? ` ${props.title} ` : undefined}
      titleColor={props.dim ? c().faint : c().text}
      paddingX={1}
      gap={1}
    >
      {props.children}
    </box>
  )
}

// Monospace-looking text on a raised surface: a command, a prompt, a log excerpt.
export function CodeBlock(props: { text: string; prefix?: string; maxLines?: number }) {
  const c = useColors()
  const [all, setAll] = createSignal(false)
  const lines = () => (props.text ?? "").split("\n")
  const max = () => props.maxLines ?? Infinity
  const shown = () => (all() ? lines() : lines().slice(0, max()))
  return (
    <box flexDirection="column" backgroundColor={c().raised} paddingX={1}>
      <text fg={c().text}>
        <Show when={props.prefix}>
          <span style={{ fg: c().faint }}>{props.prefix}</span>
        </Show>
        {shown().join("\n")}
      </text>
      <Show when={lines().length > max()}>
        <Button variant="link" label={all() ? "Show less" : `Show all ${lines().length} lines`} onClick={() => setAll(!all())} />
      </Show>
    </box>
  )
}

// ---- Tables ------------------------------------------------------------------------------------

export type Span = { text: string; fg?: RGBA; bg?: RGBA; bold?: boolean; strike?: boolean; link?: string }
export type Cell = string | Span[]

export const cellText = (cell: Cell) => (typeof cell === "string" ? cell : cell.map((s) => s.text).join(""))
// The TUI runs on Bun, which knows the terminal width of wide and combining characters.
const bun = (globalThis as { Bun?: { stringWidth(s: string): number } }).Bun
const width = (s: string) => Math.max(0, ...s.split("\n").map((l) => (bun ? bun.stringWidth(l) : l.length)))

export function Spans(props: { spans: Span[]; fg?: RGBA }) {
  return (
    <text fg={props.fg} wrapMode="word">
      <For each={props.spans}>
        {(s) =>
          s.link ? (
            <a href={s.link} style={{ fg: s.fg, bg: s.bg, attributes: TextAttributes.UNDERLINE }}>
              {s.text}
            </a>
          ) : (
            <span
              style={{
                fg: s.fg,
                bg: s.bg,
                attributes: (s.bold ? TextAttributes.BOLD : 0) | (s.strike ? TextAttributes.STRIKETHROUGH : 0),
              }}
            >
              {s.text}
            </span>
          )
        }
      </For>
    </text>
  )
}

export type GridRow = { cells: Cell[]; bg?: RGBA; fg?: RGBA; span?: boolean }

// Columns sized to their content, shrinking (and wrapping) the widest ones when the terminal is
// narrow. A row with `span` is a full-width group header.
export function Grid(props: { columns: string[]; rows: GridRow[]; maxColumn?: number }) {
  const c = useColors()
  const cap = () => props.maxColumn ?? 60
  const widths = () =>
    props.columns.map((h, i) => Math.min(cap(), Math.max(width(h), ...props.rows.filter((r) => !r.span).map((r) => width(cellText(r.cells[i] ?? ""))))))
  const cell = (value: Cell, fg?: RGBA) => (typeof value === "string" ? <Spans spans={[{ text: value }]} fg={fg} /> : <Spans spans={value} fg={fg} />)
  return (
    <box flexDirection="column">
      <Show when={props.columns.some((h) => h)}>
        <box flexDirection="row" columnGap={2} border={["bottom"]} borderColor={c().border}>
          <For each={props.columns}>
            {(h, i) => (
              <box width={widths()[i()]} flexShrink={widths()[i()] > 12 ? 1 : 0} minWidth={Math.min(widths()[i()], 6)}>
                <text fg={c().muted} attributes={TextAttributes.BOLD}>
                  {h}
                </text>
              </box>
            )}
          </For>
        </box>
      </Show>
      <For each={props.rows}>
        {(row) =>
          row.span ? (
            <box backgroundColor={row.bg ?? c().raised}>{cell(row.cells[0] ?? "", row.fg)}</box>
          ) : (
            <box flexDirection="row" columnGap={2} backgroundColor={row.bg}>
              <For each={props.columns}>
                {(_, i) => (
                  <box width={widths()[i()]} flexShrink={widths()[i()] > 12 ? 1 : 0} minWidth={Math.min(widths()[i()], 6)}>
                    {cell(row.cells[i()] ?? "", row.fg ?? c().text)}
                  </box>
                )}
              </For>
            </box>
          )
        }
      </For>
    </box>
  )
}

// ---- Time zones --------------------------------------------------------------------------------

export function ZoneToggle() {
  const host = useHost()
  return (
    <ToggleGroup
      options={(Object.keys(ZONES) as Zone[]).map((z) => ({ value: z, label: z }))}
      selected={(z) => host.zone() === z}
      onToggle={(z) => host.setZone(z)}
    />
  )
}

// Timestamps without an offset are read as UTC, which is what the agent's tools report.
export function parseTime(value?: string): number | undefined {
  if (!value) return undefined
  const iso = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value.trim()) ? `${value.trim().replace(" ", "T")}Z` : value
  const t = Date.parse(iso)
  return Number.isNaN(t) ? undefined : t
}

export function formatTime(t: number, z: Zone, opts: { date?: boolean; seconds?: boolean } = {}) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONES[z],
    ...(opts.date ? { month: "short", day: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    ...(opts.seconds !== false ? { second: "2-digit" } : {}),
    hour12: false,
  }).format(t)
}

export function formatDay(t: number, z: Zone) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: ZONES[z], weekday: "short", year: "numeric", month: "short", day: "numeric" }).format(t)
}

export function formatGap(ms: number) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `+${s}s`
  const m = Math.round(s / 60)
  if (m < 90) return `+${m}m`
  const h = Math.round(m / 60)
  if (h < 48) return `+${h}h`
  return `+${Math.round(h / 24)}d`
}
