import { TextAttributes } from "@opentui/core"
import { For, Show } from "solid-js"
import { z } from "zod/v4"
import {
  Badge,
  BlockHeader,
  Button,
  Card,
  CodeBlock,
  CopyButton,
  defineBlock,
  Icon,
  list,
  ref,
  RefChip,
  RefChips,
  TONE_ICONS,
  tone,
  toneFg,
  useColors,
  useFollowUp,
  useHost,
} from "../shared.tsx"

export const Ref = defineBlock({
  name: "Ref",
  description:
    "A link chip for one file, PR, commit, CI run, Octopus/Argo/k8s/GCP/Datadog object, or Slack message. href must be https; for files use a GitHub permalink with #L line anchors. id is the raw identifier; note shows on hover.",
  props: ref,
  component: ({ props }) => (
    <text>
      <RefChip value={props} detail />
    </text>
  ),
})

export const Refs = defineBlock({
  name: "Refs",
  description: "A row of Ref chips: the files, PRs, runs, and consoles the reader should open.",
  props: z.object({ items: z.array(Ref.ref), title: z.string().optional() }),
  component: ({ props }) => {
    const c = useColors()
    return (
      <box flexDirection="column">
        <Show when={props.title}>
          <text fg={c().muted}>{props.title}</text>
        </Show>
        <RefChips items={props.items} detail />
      </box>
    )
  },
})

export const ScopeCard = defineBlock({
  name: "ScopeCard",
  description:
    "Who owns it, where its source of truth lives, where it runs, and how it is delivered. Only for reports where that context is part of the answer. ownerIsUser is true when the owner is the user's own team. scope rows are cluster, namespace, GCP project, Octopus space, env, etc. delivery lists the stages in order (e.g. PR, CDConfiguration, Tekton, Argo CD). summary is the one-line verdict.",
  props: z.object({
    owner: z.string(),
    sources: z.array(Ref.ref),
    scope: z.array(z.object({ label: z.string(), value: z.string() })),
    ownerIsUser: z.boolean().optional(),
    delivery: z.array(z.string()).optional(),
    summary: z.string().optional(),
    summaryTone: tone.optional(),
  }),
  component: ({ props }) => {
    const c = useColors()
    const scope = list(props.scope)
    const delivery = list(props.delivery)
    const sources = list(props.sources)
    const asText = [
      `Owner: ${props.owner ?? ""}`,
      ...scope.map((s) => `${s.label}: ${s.value}`),
      ...sources.map((s) => `Source: ${s?.props?.label ?? ""}${s?.props?.href ? ` (${s.props.href})` : ""}`),
      delivery.length ? `Delivery: ${delivery.join(" → ")}` : "",
      props.summary ? `Summary: ${props.summary}` : "",
    ]
      .filter(Boolean)
      .join("\n")
    const Row = (row: { label: string; children: import("solid-js").JSX.Element }) => (
      <box flexDirection="row" columnGap={1}>
        <box width={16} flexShrink={0}>
          <text fg={c().muted}>{row.label}</text>
        </box>
        <box flexShrink={1}>{row.children}</box>
      </box>
    )
    const summaryTone = props.summaryTone ?? "info"
    return (
      <Card title="Scope">
        <box flexDirection="column">
          <box flexDirection="row" justifyContent="flex-end">
            <CopyButton text={asText} label="Copy context" />
          </box>
          <Row label="Owner">
            <text fg={c().text} attributes={TextAttributes.BOLD}>
              {props.owner}
              <Show when={props.ownerIsUser}>
                {" "}
                <Badge variant="info">Your team</Badge>
              </Show>
            </text>
          </Row>
          <For each={scope}>
            {(s) => (
              <Row label={s.label}>
                <text fg={c().text}>{s.value}</text>
              </Row>
            )}
          </For>
          <Show when={sources.length > 0}>
            <Row label="Source of truth">
              <RefChips items={sources} />
            </Row>
          </Show>
          <Show when={delivery.length > 0}>
            <Row label="Delivery">
              <text fg={c().text}>
                <For each={delivery}>
                  {(d, i) => (
                    <>
                      <Show when={i() > 0}>
                        <span style={{ fg: c().faint }}> › </span>
                      </Show>
                      <Badge variant="secondary">{d}</Badge>
                    </>
                  )}
                </For>
              </text>
            </Row>
          </Show>
        </box>
        <Show when={props.summary}>
          <box border={["top"]} borderColor={c().border}>
            <text fg={c().text} wrapMode="word">
              <span style={{ fg: toneFg(c(), summaryTone) }}>{TONE_ICONS[summaryTone].icon} </span>
              {props.summary}
            </text>
          </box>
        </Show>
      </Card>
    )
  },
})

export const HandoffPrompt = defineBlock({
  name: "HandoffPrompt",
  description:
    "A copy-ready prompt for another agent or person to act on, e.g. a coding agent in another repo. prompt is the full text (Markdown allowed, no nested code fences needed); target names who or where it is for.",
  props: z.object({ title: z.string(), prompt: z.string(), target: z.string().optional() }),
  component: ({ props }) => {
    const c = useColors()
    return (
      <Card title={props.title}>
        <box flexDirection="row" flexWrap="wrap" justifyContent="space-between" columnGap={2}>
          <text fg={c().muted}>{props.target ? `For ${props.target}` : ""}</text>
          <CopyButton text={props.prompt ?? ""} label="Copy prompt" />
        </box>
        <CodeBlock text={props.prompt ?? ""} maxLines={20} />
      </Card>
    )
  },
})

const SOURCE_STATUS = {
  ok: { mark: TONE_ICONS.ok, label: "Answered" },
  partial: { mark: TONE_ICONS.warn, label: "Partial" },
  failed: { mark: TONE_ICONS.crit, label: "Failed" },
  skipped: { mark: TONE_ICONS.skipped, label: "Skipped" },
} as const

// The browser shows a paste box; here the text goes through a prompt dialog.
function PasteFallback(props: { source: string; fallback: string }) {
  const { send, disabled } = useFollowUp()
  const host = useHost()
  const paste = async () => {
    const text = await host.ask({ title: `Paste ${props.source} data`, description: props.fallback, placeholder: "Paste here…" })
    if (!text?.trim()) return
    send(`Here is the ${props.source} data you could not fetch (${props.fallback}):\n\n\`\`\`\n${text.trim()}\n\`\`\``, { confirm: false })
  }
  return <Button variant="link" label={`↳ ${props.fallback}`} disabled={disabled} action={`Paste ${props.source} data`} onClick={() => void paste()} />
}

export const SourceStatus = defineBlock({
  name: "SourceStatus",
  description:
    "Which data sources answered and which did not (auth errors, 403s, timeouts, missing scopes, unreachable hosts), so gaps in the evidence are visible. detail is the exact error. retryPrompt asks you to try again; fallback tells the user what they can paste instead (e.g. 'Paste the Slack thread text').",
  props: z.object({
    items: z.array(
      z.object({
        source: z.string(),
        status: z.enum(["ok", "partial", "failed", "skipped"]),
        detail: z.string().optional(),
        retryPrompt: z.string().optional(),
        fallback: z.string().optional(),
      }),
    ),
  }),
  component: ({ props }) => {
    const { send, disabled } = useFollowUp()
    const c = useColors()
    const items = list(props.items)
    const ok = items.filter((i) => i.status === "ok")
    const issues = items.filter((i) => i.status !== "ok")
    return (
      <box flexDirection="column" gap={1}>
        <BlockHeader title="Data sources" description={ok.length > 0 ? `Answered: ${ok.map((i) => i.source).join(", ")}` : undefined} />
        <For each={issues}>
          {(item) => {
            const s = SOURCE_STATUS[item.status] ?? SOURCE_STATUS.failed
            return (
              <box flexDirection="column" border={["left"]} borderColor={toneFg(c(), s.mark.tone)} paddingLeft={1}>
                <box flexDirection="row" flexWrap="wrap" justifyContent="space-between" columnGap={2}>
                  <text fg={c().text}>
                    <Icon mark={s.mark} /> {item.source} <Badge variant="secondary">{s.label}</Badge>
                  </text>
                  <Show when={item.retryPrompt}>
                    <Button label="↻ Retry" disabled={disabled} action={`Retry ${item.source}`} onClick={() => send(item.retryPrompt!)} />
                  </Show>
                </box>
                <Show when={item.detail}>
                  <text fg={c().muted} wrapMode="char">
                    {item.detail}
                  </text>
                </Show>
                <Show when={item.fallback}>
                  <PasteFallback source={item.source} fallback={item.fallback!} />
                </Show>
              </box>
            )
          }}
        </For>
      </box>
    )
  },
})
