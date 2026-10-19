import { TextAttributes, type RGBA } from "@opentui/core"
import { createSignal, For, Show } from "solid-js"
import { z } from "zod/v4"
import {
  Badge,
  BlockHeader,
  Button,
  chartColor,
  CodeBlock,
  defineBlock,
  Divider,
  formatTime,
  Grid,
  Icon,
  list,
  parseTime,
  RefChip,
  TONE_ICONS,
  tone,
  toneFg,
  ToggleGroup,
  useColors,
  useFollowUp,
  useHost,
  ZoneToggle,
  type GridRow,
  type Mark,
  type Palette,
  type Span,
  type Tone,
} from "../shared.tsx"
import { Ref } from "./context.tsx"

// A horizontal bar of eighth blocks: `ratio` of `width` cells filled.
function bar(ratio: number, width: number) {
  const eighths = Math.round(Math.max(0, Math.min(1, ratio)) * width * 8)
  const full = Math.floor(eighths / 8)
  const rest = eighths % 8
  return "█".repeat(full) + (rest ? "▏▎▍▌▋▊▉"[rest - 1] : "")
}

const markSpan = (c: Palette, mark: Mark): Span => ({ text: mark.icon, fg: toneFg(c, mark.tone) })

// ---- ResourceStatus ----------------------------------------------------------------------------

// Problems are anything that needs attention; info rows (e.g. "untracked") are context, not problems.
const PROBLEM = new Set<Tone>(["crit", "warn", "unknown"])
const COUNT_ORDER = ["crit", "warn", "unknown", "info", "ok"] as const

function toneCounts(c: Palette, items: { status: Tone }[]): Span[] {
  return COUNT_ORDER.map((t) => [t, items.filter((r) => r.status === t).length] as const)
    .filter(([, n]) => n > 0)
    .flatMap(([t, n]) => [markSpan(c, TONE_ICONS[t]), { text: ` ${n}  ` }])
}

export const ResourceStatus = defineBlock({
  name: "ResourceStatus",
  description:
    "Status of many resources at once (pods, deployments, Argo apps, runner pools, Octopus machines, controllers), optionally across clusters via group. ready/desired are counts. was is the phase or state from your previous check in this session, so changes stand out; omit it otherwise. snapshotAt is when you checked (ISO 8601). recheckPrompt asks you to check again.",
  props: z.object({
    title: z.string(),
    resources: z.array(
      z.object({
        name: z.string(),
        status: tone,
        kind: z.string().optional(),
        group: z.string().optional(),
        phase: z.string().optional(),
        ready: z.number().optional(),
        desired: z.number().optional(),
        detail: z.string().optional(),
        was: z.string().optional(),
      }),
    ),
    snapshotAt: z.string().optional(),
    recheckPrompt: z.string().optional(),
  }),
  component: ({ props }) => {
    const { send, disabled } = useFollowUp()
    const host = useHost()
    const c = useColors()
    const [filter, setFilter] = createSignal<"all" | "problems" | "changed">("all")
    const [hiddenGroups, setHiddenGroups] = createSignal<string[]>([])
    const all = list(props.resources)
    type Resource = (typeof all)[number]
    const changed = (r: Resource) => r.was !== undefined && r.was !== r.phase
    // Groups keep the order the agent listed them in; resources without one go last.
    const groups = [...new Set(all.map((r) => r.group ?? ""))].sort((a, b) => (a === "" ? 1 : b === "" ? -1 : 0))
    const grouped = groups.some((g) => g !== "")
    const shown = () =>
      all
        .filter((r) => (filter() === "problems" ? PROBLEM.has(r.status) : filter() === "changed" ? changed(r) : true))
        .filter((r) => !hiddenGroups().includes(r.group ?? ""))
    const withCounts = all.some((r) => r.ready !== undefined || r.desired !== undefined)
    const at = parseTime(props.snapshotAt)
    const recheck =
      props.recheckPrompt ?? `Re-check the resources in "${props.title}" read-only and show what changed since ${props.snapshotAt ?? "the last check"}.`
    const row = (r: Resource): GridRow => ({
      bg: changed(r) ? c().infoBg : undefined,
      cells: [
        [markSpan(c(), TONE_ICONS[r.status] ?? TONE_ICONS.unknown)],
        [{ text: r.name }, ...(r.kind ? [{ text: ` ${r.kind}`, fg: c().muted }] : [])],
        changed(r) ? [{ text: r.was ?? "", fg: c().muted, strike: true }, { text: " → " }, { text: r.phase ?? "gone", fg: c().info, bold: true }] : (r.phase ?? ""),
        ...(withCounts
          ? [
              r.desired !== undefined && r.desired > 0
                ? [
                    { text: bar((r.ready ?? 0) / r.desired, 6).padEnd(6, "░"), fg: toneFg(c(), r.status) },
                    { text: ` ${r.ready ?? 0}/${r.desired}` },
                  ]
                : r.ready !== undefined
                  ? String(r.ready)
                  : "",
            ]
          : []),
        [{ text: r.detail ?? "", fg: c().muted }],
      ],
    })
    const rows = (): GridRow[] =>
      groups.flatMap((g) => {
        const members = shown().filter((r) => (r.group ?? "") === g)
        if (members.length === 0) return []
        const header: GridRow[] = grouped ? [{ span: true, cells: [[{ text: `${g || "Other"}  `, bold: true }, ...toneCounts(c(), members)]] }] : []
        return [...header, ...members.map(row)]
      })
    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader
          title={props.title}
          description={
            <>
              <For each={toneCounts(c(), all)}>{(s) => <span style={{ fg: s.fg }}>{s.text}</span>}</For>
              <Show when={at !== undefined}>{`· as of ${formatTime(at!, host.zone(), { date: true })} ${host.zone()}`}</Show>
            </>
          }
        >
          <ToggleGroup
            options={[
              { value: "all" as const, label: "All" },
              { value: "problems" as const, label: "Problems" },
              ...(all.some(changed) ? [{ value: "changed" as const, label: "Changed" }] : []),
            ]}
            selected={(v) => filter() === v}
            onToggle={setFilter}
          />
          <Show when={groups.length > 1}>
            <ToggleGroup
              options={groups.map((g) => ({ value: g, label: g || "Other" }))}
              selected={(g) => !hiddenGroups().includes(g)}
              onToggle={(g) => setHiddenGroups((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]))}
            />
          </Show>
          <Show when={at !== undefined}>
            <ZoneToggle />
          </Show>
          <Button label="↻ Re-check" disabled={disabled} action={`Re-check: ${props.title}`} onClick={() => send(recheck)} />
        </BlockHeader>
        <Grid columns={["", "Resource", "State", ...(withCounts ? ["Ready"] : []), "Detail"]} rows={rows()} />
        <Show when={shown().length === 0}>
          <text fg={c().muted} textAlign="center">
            Nothing matches this filter.
          </text>
        </Show>
      </box>
    )
  },
})

// ---- CapacityBar -------------------------------------------------------------------------------

const BAR = 32

export const CapacityBar = defineBlock({
  name: "CapacityBar",
  description:
    "How full a finite resource is: pod slots per node, pod/service IP ranges, node CPU or memory requests, runner pool size, quota. parts breaks used into consumers (e.g. 14 runner pods + 11 DaemonSet pods) and should sum to used. Bars turn amber at 80% and red at 95%.",
  props: z.object({
    items: z.array(
      z.object({
        label: z.string(),
        used: z.number(),
        total: z.number(),
        unit: z.string().optional(),
        parts: z.array(z.object({ label: z.string(), value: z.number() })).optional(),
        note: z.string().optional(),
      }),
    ),
    title: z.string().optional(),
  }),
  component: ({ props }) => {
    const c = useColors()
    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader title={props.title} />
        <For each={list(props.items)}>
          {(item) => {
            const total = item.total > 0 ? item.total : 1
            const ratio = (item.used ?? 0) / total
            const level: Tone = ratio >= 0.95 ? "crit" : ratio >= 0.8 ? "warn" : "ok"
            const parts = list(item.parts)
            const unit = item.unit ? ` ${item.unit}` : ""
            // Each part's share of the bar, in whole cells; whatever is left of the total stays empty.
            const segments = (): { text: string; fg: RGBA }[] =>
              parts.length > 0
                ? parts.map((p, j) => ({ text: "█".repeat(Math.round((p.value / total) * BAR)), fg: chartColor(c(), j) }))
                : [{ text: bar(ratio, BAR), fg: toneFg(c(), level) }]
            const empty = () => Math.max(0, BAR - segments().reduce((n, s) => n + [...s.text].length, 0))
            return (
              <box flexDirection="column">
                <box flexDirection="row" justifyContent="space-between" columnGap={2}>
                  <text fg={c().text} attributes={TextAttributes.BOLD}>
                    {item.label}
                  </text>
                  <text fg={level === "ok" ? c().text : toneFg(c(), level)}>
                    {item.used}/{item.total}
                    {unit} · {Math.round(ratio * 100)}%
                  </text>
                </box>
                <text>
                  <For each={segments()}>{(s) => <span style={{ fg: s.fg }}>{s.text}</span>}</For>
                  <span style={{ fg: c().faint }}>{"░".repeat(empty())}</span>
                </text>
                <Show when={parts.length > 0}>
                  <text fg={c().muted} wrapMode="word">
                    <For each={parts}>
                      {(p, j) => (
                        <>
                          <span style={{ fg: chartColor(c(), j()) }}>■</span> {p.label} {p.value}
                          {unit}
                          {"   "}
                        </>
                      )}
                    </For>
                  </text>
                </Show>
                <Show when={item.note}>
                  <text fg={c().muted} wrapMode="word">
                    {item.note}
                  </text>
                </Show>
              </box>
            )
          }}
        </For>
      </box>
    )
  },
})

// ---- DeliveryTrace -----------------------------------------------------------------------------

const STAGE_STATUS = z.enum(["ok", "failed", "stalled", "running", "pending", "skipped", "unknown"])
const STAGE_ICONS: Record<z.infer<typeof STAGE_STATUS>, Mark> = {
  ok: TONE_ICONS.ok,
  failed: { ...TONE_ICONS.crit, label: "Failed" },
  stalled: { ...TONE_ICONS.warn, label: "Stalled" },
  running: TONE_ICONS.running,
  pending: TONE_ICONS.pending,
  skipped: TONE_ICONS.skipped,
  unknown: TONE_ICONS.unknown,
}

export const DeliveryTrace = defineBlock({
  name: "DeliveryTrace",
  description:
    "The path a change takes from PR to running workload (e.g. PR merge, commit, CDConfiguration, Tekton, Argo CD sync, ReplicaSet, live image), showing where it stopped. revision is the commit/tag/image each stage saw; expectedRevision is what should have reached the end, so stages still on an older revision are flagged. at is ISO 8601.",
  props: z.object({
    stages: z.array(
      z.object({
        name: z.string(),
        status: STAGE_STATUS,
        revision: z.string().optional(),
        detail: z.string().optional(),
        at: z.string().optional(),
        link: z.optional(Ref.ref),
      }),
    ),
    expectedRevision: z.string().optional(),
    title: z.string().optional(),
  }),
  component: ({ props }) => {
    const host = useHost()
    const c = useColors()
    const stages = list(props.stages)
    const stop = stages.findIndex((s) => s.status === "failed" || s.status === "stalled")
    const anyTime = stages.some((s) => parseTime(s.at) !== undefined)
    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader title={props.title ?? "Delivery path"} description={props.expectedRevision ? `Expected ${props.expectedRevision}` : undefined}>
          <Show when={anyTime}>
            <ZoneToggle />
          </Show>
        </BlockHeader>
        <box flexDirection="row" flexWrap="wrap" alignItems="stretch">
          <For each={stages}>
            {(s, i) => {
              const t = parseTime(s.at)
              const stale = props.expectedRevision && s.revision && !s.revision.startsWith(props.expectedRevision) && !props.expectedRevision.startsWith(s.revision)
              const after = stop !== -1 && i() > stop
              return (
                <box flexDirection="row" alignItems="stretch">
                  <Show when={i() > 0}>
                    <box justifyContent="center">
                      <text fg={c().faint}> › </text>
                    </box>
                  </Show>
                  <box
                    flexDirection="column"
                    width={24}
                    border
                    borderStyle="rounded"
                    borderColor={i() === stop ? c().crit : c().border}
                    backgroundColor={i() === stop ? c().critBg : undefined}
                    paddingX={1}
                  >
                    <text fg={after ? c().muted : c().text} attributes={TextAttributes.BOLD}>
                      <Icon mark={STAGE_ICONS[s.status] ?? STAGE_ICONS.unknown} /> {s.name}
                    </text>
                    <Show when={s.revision}>
                      <text fg={stale ? c().warn : c().muted} truncate>
                        {s.revision}
                      </text>
                    </Show>
                    <Show when={t !== undefined}>
                      <text fg={c().muted}>{formatTime(t!, host.zone(), { date: true })}</text>
                    </Show>
                    <Show when={s.detail}>
                      <text fg={after ? c().muted : c().text} wrapMode="word">
                        {s.detail}
                      </text>
                    </Show>
                    <Show when={i() === stop}>
                      <text>
                        <Badge variant="destructive">Stops here</Badge>
                      </text>
                    </Show>
                    <Show when={s.link}>
                      <text truncate>
                        <RefChip value={s.link?.props} />
                      </text>
                    </Show>
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

// ---- RunInspector ------------------------------------------------------------------------------

const JOB_STATUS = z.enum(["success", "failure", "cancelled", "skipped", "running", "queued"])
const JOB_ICONS: Record<z.infer<typeof JOB_STATUS>, Mark> = {
  success: TONE_ICONS.ok,
  failure: { ...TONE_ICONS.crit, label: "Failed" },
  cancelled: { ...TONE_ICONS.skipped, label: "Cancelled" },
  skipped: TONE_ICONS.skipped,
  running: TONE_ICONS.running,
  queued: TONE_ICONS.pending,
}

export const RunInspector = defineBlock({
  name: "RunInspector",
  description:
    "A CI or deployment run broken into jobs: GitHub Actions workflow runs, Octopus deployment tasks, Tekton PipelineRuns, Spinnaker executions. One entry per job per attempt (attempt starts at 1). step is the failing step; exitCode and cause classify the failure (e.g. 'evicted (137)', '.NET OOM', 'cancelled by fail-fast'); log is the decisive excerpt only.",
  props: z.object({
    title: z.string(),
    jobs: z.array(
      z.object({
        name: z.string(),
        status: JOB_STATUS,
        attempt: z.number().optional(),
        duration: z.string().optional(),
        step: z.string().optional(),
        exitCode: z.number().optional(),
        cause: z.string().optional(),
        log: z.string().optional(),
        link: z.optional(Ref.ref),
      }),
    ),
    link: z.optional(Ref.ref),
    summary: z.string().optional(),
  }),
  component: ({ props }) => {
    const c = useColors()
    const [failuresOnly, setFailuresOnly] = createSignal(false)
    const jobs = list(props.jobs)
    const byName = new Map<string, typeof jobs>()
    for (const j of jobs) byName.set(j.name, [...(byName.get(j.name) ?? []), j])
    const groups = [...byName.entries()].map(([name, runs]) => {
      const sorted = [...runs].sort((a, b) => (a.attempt ?? 1) - (b.attempt ?? 1))
      return { name, runs: sorted, latest: sorted[sorted.length - 1] }
    })
    const shown = () => (failuresOnly() ? groups.filter((g) => g.runs.some((r) => r.status === "failure")) : groups)
    const counts = JOB_STATUS.options.map((s) => [s, groups.filter((g) => g.latest.status === s).length] as const).filter(([, n]) => n > 0)
    const failed = groups.filter((g) => g.latest.status === "failure").map((g) => g.name)
    // Like the browser's accordion, the first failed job starts open.
    const [open, setOpen] = createSignal<Set<string>>(new Set(failed.slice(0, 1)))
    const toggle = (name: string) =>
      setOpen((cur) => {
        const next = new Set(cur)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        return next
      })
    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader
          title={props.title}
          description={
            <For each={counts}>
              {([s, n]) => (
                <>
                  <Icon mark={JOB_ICONS[s]} />
                  {` ${n} ${s}  `}
                </>
              )}
            </For>
          }
        >
          <Show when={props.link}>
            <text>
              <RefChip value={props.link?.props} />
            </text>
          </Show>
          <ToggleGroup
            options={[
              { value: "all", label: "All jobs" },
              { value: "failures", label: "Failures" },
            ]}
            selected={(v) => (v === "failures") === failuresOnly()}
            onToggle={(v) => setFailuresOnly(v === "failures")}
          />
        </BlockHeader>
        <Show when={props.summary}>
          <text fg={c().text} wrapMode="word">
            {props.summary}
          </text>
        </Show>
        <box flexDirection="column" border borderStyle="rounded" borderColor={c().border} paddingX={1}>
          <For each={shown()}>
            {(g, i) => (
              <box flexDirection="column">
                <Show when={i() > 0}>
                  <Divider />
                </Show>
                <box flexDirection="row" justifyContent="space-between" columnGap={2} onMouseUp={() => toggle(g.name)}>
                  <text fg={c().text} flexShrink={1} truncate>
                    <span style={{ fg: c().faint }}>{open().has(g.name) ? "▾ " : "▸ "}</span>
                    <Icon mark={JOB_ICONS[g.latest.status] ?? TONE_ICONS.unknown} /> {g.name}
                    <Show when={g.runs.length > 1}>
                      {" "}
                      <For each={g.runs}>{(r) => <Icon mark={JOB_ICONS[r.status] ?? TONE_ICONS.unknown} />}</For>
                    </Show>
                    <Show when={g.latest.cause}>
                      {" "}
                      <Badge variant={g.latest.status === "failure" ? "destructive" : "secondary"}>{g.latest.cause!}</Badge>
                    </Show>
                  </text>
                  <text fg={c().muted} flexShrink={0}>
                    {g.latest.duration ?? ""}
                  </text>
                </box>
                <Show when={open().has(g.name)}>
                  <box flexDirection="column" gap={1} paddingLeft={2} paddingBottom={1}>
                    <For each={[...g.runs].reverse()}>
                      {(r, k) => (
                        <box flexDirection="column">
                          <text fg={c().text} wrapMode="word">
                            <Show when={g.runs.length > 1}>
                              <span style={{ attributes: TextAttributes.BOLD }}>{`Attempt ${r.attempt ?? g.runs.length - k()} `}</span>
                            </Show>
                            {r.status}
                            <Show when={r.step}>
                              <span style={{ fg: c().muted }}> step </span>
                              {r.step}
                            </Show>
                            <Show when={r.exitCode !== undefined}>
                              {" "}
                              <Badge variant="outline">{`exit ${r.exitCode}`}</Badge>
                            </Show>
                            <Show when={r.cause}>
                              {" "}
                              <Badge variant="secondary">{r.cause!}</Badge>
                            </Show>
                            <Show when={r.link}>
                              {"  "}
                              <RefChip value={r.link?.props} />
                            </Show>
                          </text>
                          <Show when={r.log}>
                            <CodeBlock text={r.log!} maxLines={12} />
                          </Show>
                        </box>
                      )}
                    </For>
                  </box>
                </Show>
              </box>
            )}
          </For>
        </box>
      </box>
    )
  },
})
