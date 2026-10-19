import { TextAttributes, type RGBA } from "@opentui/core"
import { For, Show, type JSX } from "solid-js"
import { z } from "zod/v4"
import { Badge, BlockHeader, Button, Card, Collapsible, defineBlock, Divider, list, RefChip, useColors, useFollowUp, useHost, type Palette, type Variant } from "../shared.tsx"
import { Ref } from "./context.tsx"

function EvidenceList(props: { items: string[]; kind?: "for" | "against" }) {
  const c = useColors()
  const fg = () => (props.kind === "against" ? c().crit : props.kind === "for" ? c().ok : c().muted)
  return (
    <box flexDirection="column">
      <For each={props.items}>
        {(e) => (
          <box flexDirection="row" columnGap={1}>
            <text fg={fg()} flexShrink={0}>
              {props.kind === "against" ? "−" : "+"}
            </text>
            <text fg={c().text} wrapMode="char" flexShrink={1}>
              {e}
            </text>
          </box>
        )}
      </For>
    </box>
  )
}

function EvidenceToggle(props: { count: number; children: JSX.Element }) {
  return (
    <Show when={props.count > 0}>
      <Collapsible label={`${props.count} evidence`}>{props.children}</Collapsible>
    </Show>
  )
}

// ---- CausalChain -------------------------------------------------------------------------------

const LINK_STATUS = {
  proven: { label: "Proven", variant: "success", dot: "●" },
  likely: { label: "Likely", variant: "info", dot: "●" },
  unproven: { label: "Unproven", variant: "warning", dot: "○" },
  ruledOut: { label: "Ruled out", variant: "secondary", dot: "○" },
} as const

const dotColor = (c: Palette, variant: Variant): RGBA =>
  variant === "success" ? c.ok : variant === "info" ? c.info : variant === "warning" ? c.warn : c.faint

export const CausalChain = defineBlock({
  name: "CausalChain",
  description:
    "A cause-and-effect chain, root cause first, ending at the symptom the user saw (e.g. GitHub secondary rate limit, proxy 403, Gate 502, /login redirect loop, exit 123). Also fits resolution chains like user, team, role, permission. status per link: proven (direct evidence) | likely | unproven | ruledOut. evidence names the commands, logs, or files behind each link.",
  props: z.object({
    steps: z.array(
      z.object({
        label: z.string(),
        status: z.enum(["proven", "likely", "unproven", "ruledOut"]),
        detail: z.string().optional(),
        evidence: z.array(z.string()).optional(),
        link: z.optional(Ref.ref),
      }),
    ),
    title: z.string().optional(),
  }),
  component: ({ props }) => {
    const c = useColors()
    const steps = list(props.steps)
    return (
      <box flexDirection="column">
        <BlockHeader title={props.title} />
        <For each={steps}>
          {(s, i) => {
            const st = LINK_STATUS[s.status] ?? LINK_STATUS.unproven
            const evidence = list(s.evidence)
            const last = () => i() === steps.length - 1
            return (
              <box flexDirection="row" columnGap={1}>
                <box flexDirection="column" width={1} flexShrink={0}>
                  <text fg={dotColor(c(), st.variant)}>{st.dot}</text>
                  <Show when={!last()}>
                    <box flexGrow={1} border={["left"]} borderColor={s.status === "ruledOut" ? c().faint : c().border} />
                  </Show>
                </box>
                <box flexDirection="column" flexShrink={1} paddingBottom={last() ? 0 : 1}>
                  <text fg={c().text} wrapMode="word">
                    <span
                      style={{
                        fg: s.status === "ruledOut" ? c().muted : c().text,
                        attributes: s.status === "ruledOut" ? TextAttributes.STRIKETHROUGH : TextAttributes.BOLD,
                      }}
                    >
                      {s.label}
                    </span>{" "}
                    <Badge variant={st.variant}>{st.label}</Badge>
                    <Show when={s.link}>
                      {"  "}
                      <RefChip value={s.link?.props} />
                    </Show>
                  </text>
                  <Show when={s.detail}>
                    <text fg={c().muted} wrapMode="word">
                      {s.detail}
                    </text>
                  </Show>
                  <EvidenceToggle count={evidence.length}>
                    <EvidenceList items={evidence} />
                  </EvidenceToggle>
                </box>
              </box>
            )
          }}
        </For>
      </box>
    )
  },
})

// ---- Hypotheses --------------------------------------------------------------------------------

const HYPOTHESIS_STATUS = {
  confirmed: { label: "Confirmed", variant: "success", order: 0 },
  likely: { label: "Likely", variant: "info", order: 1 },
  open: { label: "Open", variant: "warning", order: 2 },
  superseded: { label: "Superseded", variant: "secondary", order: 3 },
  ruledOut: { label: "Ruled out", variant: "secondary", order: 4 },
} as const

function ChallengeButton(props: { claim: string; status: string }) {
  const { send, disabled } = useFollowUp()
  const host = useHost()
  const challenge = async () => {
    const note = await host.ask({ title: "Challenge hypothesis", description: props.claim, placeholder: "What you know that contradicts or supports it…" })
    if (!note?.trim()) return
    send(`Re-examine the hypothesis "${props.claim}" (currently ${props.status}) read-only, taking this into account: ${note.trim()}`, { confirm: false })
  }
  return <Button variant="ghost" label="Challenge" disabled={disabled} action={`Challenge: ${props.claim}`} onClick={() => void challenge()} />
}

export const Hypotheses = defineBlock({
  name: "Hypotheses",
  description:
    "Candidate causes and how far each got: confirmed | likely | open | superseded | ruledOut, with confidence (high | medium | low) and the evidence for and against. Keep earlier wrong ideas as ruledOut or superseded (with note saying by what) instead of dropping them, so the user can see what was checked. The user can challenge any item.",
  props: z.object({
    items: z.array(
      z.object({
        claim: z.string(),
        status: z.enum(["confirmed", "likely", "open", "superseded", "ruledOut"]),
        confidence: z.enum(["high", "medium", "low"]).optional(),
        supporting: z.array(z.string()).optional(),
        against: z.array(z.string()).optional(),
        note: z.string().optional(),
      }),
    ),
    title: z.string().optional(),
  }),
  component: ({ props }) => {
    const c = useColors()
    const items = [...list(props.items)].sort((a, b) => (HYPOTHESIS_STATUS[a.status]?.order ?? 9) - (HYPOTHESIS_STATUS[b.status]?.order ?? 9))
    return (
      <box flexDirection="column">
        <BlockHeader title={props.title ?? "Hypotheses"} />
        <box flexDirection="column" border borderStyle="rounded" borderColor={c().border} paddingX={1}>
          <For each={items}>
            {(h, i) => {
              const st = HYPOTHESIS_STATUS[h.status] ?? HYPOTHESIS_STATUS.open
              const dead = h.status === "ruledOut" || h.status === "superseded"
              const supporting = list(h.supporting)
              const against = list(h.against)
              return (
                <box flexDirection="column">
                  <Show when={i() > 0}>
                    <Divider />
                  </Show>
                  <box flexDirection="row" justifyContent="space-between" columnGap={1}>
                    <text fg={dead ? c().muted : c().text} attributes={dead ? TextAttributes.STRIKETHROUGH : 0} wrapMode="word" flexShrink={1}>
                      {h.claim}
                    </text>
                    <box flexDirection="row" columnGap={1} flexShrink={0}>
                      <text>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <Show when={h.confidence && !dead}>
                          {" "}
                          <Badge variant="outline">{h.confidence!}</Badge>
                        </Show>
                      </text>
                      <ChallengeButton claim={h.claim} status={h.status} />
                    </box>
                  </box>
                  <Show when={h.note}>
                    <text fg={c().muted} wrapMode="word">
                      {h.note}
                    </text>
                  </Show>
                  <EvidenceToggle count={supporting.length + against.length}>
                    <Show when={supporting.length > 0}>
                      <EvidenceList items={supporting} kind="for" />
                    </Show>
                    <Show when={against.length > 0}>
                      <EvidenceList items={against} kind="against" />
                    </Show>
                  </EvidenceToggle>
                </box>
              )
            }}
          </For>
        </box>
      </box>
    )
  },
})

// ---- Options -----------------------------------------------------------------------------------

const LEVEL = { low: "secondary", medium: "warning", high: "destructive" } as const

export const Options = defineBlock({
  name: "Options",
  description:
    "Alternative ways forward to choose between, e.g. a quick workaround vs the durable fix. constraints are the user's or platform's hard requirements (e.g. 'must stay on arm64'); violates lists the constraints an option breaks. Mark at most one recommended. The user can pick one, which sends you their choice.",
  props: z.object({
    options: z.array(
      z.object({
        name: z.string(),
        summary: z.string(),
        kind: z.enum(["workaround", "durable", "other"]).optional(),
        pros: z.array(z.string()).optional(),
        cons: z.array(z.string()).optional(),
        violates: z.array(z.string()).optional(),
        effort: z.enum(["low", "medium", "high"]).optional(),
        risk: z.enum(["low", "medium", "high"]).optional(),
        recommended: z.boolean().optional(),
      }),
    ),
    constraints: z.array(z.string()).optional(),
    title: z.string().optional(),
  }),
  component: ({ props }) => {
    const { send, disabled } = useFollowUp()
    const c = useColors()
    const constraints = list(props.constraints)
    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader title={props.title ?? "Options"} />
        <Show when={constraints.length > 0}>
          <text fg={c().muted} wrapMode="word">
            Constraints{" "}
            <For each={constraints}>
              {(x) => (
                <>
                  <Badge variant="outline">{x}</Badge>{" "}
                </>
              )}
            </For>
          </text>
        </Show>
        <box flexDirection="row" flexWrap="wrap" columnGap={1} rowGap={1}>
          <For each={list(props.options)}>
            {(o) => {
              const violates = list(o.violates)
              return (
                <box flexGrow={1} flexBasis={40} minWidth={30}>
                  <Card title={o.name} borderColor={o.recommended ? c().accent : undefined}>
                    <box flexDirection="column">
                      <Show when={o.recommended || (o.kind && o.kind !== "other")}>
                        <text>
                          <Show when={o.recommended}>
                            <Badge>★ Recommended</Badge>{" "}
                          </Show>
                          <Show when={o.kind && o.kind !== "other"}>
                            <Badge variant="secondary">{o.kind!}</Badge>
                          </Show>
                        </text>
                      </Show>
                      <text fg={c().muted} wrapMode="word">
                        {o.summary}
                      </text>
                    </box>
                    <Show when={list(o.pros).length > 0 || list(o.cons).length > 0}>
                      <box flexDirection="column">
                        <EvidenceList items={list(o.pros)} kind="for" />
                        <EvidenceList items={list(o.cons)} kind="against" />
                      </box>
                    </Show>
                    <Show when={violates.length > 0}>
                      <box backgroundColor={c().critBg} paddingX={1}>
                        <text fg={c().crit} wrapMode="word">
                          Violates: {violates.join("; ")}
                        </text>
                      </box>
                    </Show>
                    <box flexDirection="row" justifyContent="space-between" columnGap={1}>
                      <text>
                        <Show when={o.effort}>
                          <Badge variant={LEVEL[o.effort!]}>{`effort ${o.effort}`}</Badge>{" "}
                        </Show>
                        <Show when={o.risk}>
                          <Badge variant={LEVEL[o.risk!]}>{`risk ${o.risk}`}</Badge>
                        </Show>
                      </text>
                      <Button
                        variant={o.recommended ? "default" : "outline"}
                        label="Choose this"
                        disabled={disabled}
                        action={`Choose option: ${o.name}`}
                        onClick={() => send(`Go with "${o.name}": ${o.summary}. Lay out the next steps; keep anything that changes state as operator-only.`)}
                      />
                    </box>
                  </Card>
                </box>
              )
            }}
          </For>
        </box>
      </box>
    )
  },
})
