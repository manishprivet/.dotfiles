import { TextAttributes } from "@opentui/core"
import { createSignal, For, Show } from "solid-js"
import { z } from "zod/v4"
import { Badge, Button, CodeBlock, CopyButton, defineBlock, Grid, list, ToggleGroup, useColors, useFollowUp, useHost, type Cell } from "../shared.tsx"

const RISK = {
  read: { label: "Read-only", variant: "secondary", tone: undefined },
  change: { label: "Mutating", variant: "warning", tone: "warn" },
  destructive: { label: "Destructive", variant: "destructive", tone: "crit" },
} as const

const step = {
  command: z.string(),
  target: z.string(),
  blastRadius: z.string(),
  verify: z.string(),
  rollback: z.string().optional(),
  risk: z.enum(["read", "change", "destructive"]).optional(),
  title: z.string().optional(),
  expect: z.string().optional(),
  vars: z.array(z.object({ name: z.string(), value: z.string(), hint: z.string().optional() })).optional(),
  fish: z.string().optional(),
}
const stepSchema = z.object(step)
type Step = z.infer<typeof stepSchema>

// {{name}} placeholders in a command, filled from the step's editable vars.
const fill = (command: string, values: Record<string, string>) => command.replace(/\{\{(\w+)\}\}/g, (m, name) => values[name] ?? m)

// One command the user runs outside the agent. "I ran it" asks for the output, and sending it asks
// the agent to verify; `onRan` lets a Runbook unlock the next step.
function CommandCard(props: { step: Partial<Step>; index?: number; onRan?: () => void; locked?: { waitingFor: number; unlock: () => void } }) {
  const { send, disabled } = useFollowUp()
  const host = useHost()
  const c = useColors()
  const s = props.step
  const vars = list(s.vars)
  const [values, setValues] = createSignal<Record<string, string>>(Object.fromEntries(vars.map((v) => [v.name, v.value])))
  const [shell, setShell] = createSignal<"bash" | "fish">("bash")
  const risk = RISK[s.risk ?? "change"] ?? RISK.change
  const command = () => fill((shell() === "fish" && s.fish) || s.command || "", values())
  const name = () => s.title ?? command().split("\n")[0]
  const border = () => (risk.tone === "crit" ? c().crit : risk.tone === "warn" ? c().warn : c().border)

  const edit = async (v: { name: string; hint?: string }) => {
    const next = await host.ask({ title: `Set {{${v.name}}}`, description: v.hint, value: values()[v.name] ?? "" })
    if (next !== undefined) setValues((cur) => ({ ...cur, [v.name]: next }))
  }

  const verify = async () => {
    const output = await host.ask({
      title: `Verify "${name()}"`,
      description: `Paste the output (optional), then press enter to send it for verification on ${s.target}.`,
      placeholder: "Command output",
    })
    if (output === undefined) return
    send(
      `I ran the operator step "${name()}" on ${s.target}.\n\nCommand:\n\`\`\`\n${command()}\n\`\`\`\n\n` +
        (output.trim() ? `Output:\n\`\`\`\n${output.trim()}\n\`\`\`\n\n` : "I did not capture output.\n\n") +
        `Verify the result read-only: ${s.verify}`,
      { confirm: false },
    )
    props.onRan?.()
  }

  const facts = (): Cell[][] => [
    ["Target", [{ text: s.target ?? "" }]],
    ["Blast radius", s.blastRadius ?? ""],
    ...(s.expect ? [["Expect", s.expect] as Cell[]] : []),
    ["Verify", s.verify ?? ""],
    ...(s.rollback
      ? [["Rollback", s.rollback] as Cell[]]
      : s.risk !== "read"
        ? [["Rollback", [{ text: "None given; ask before running", fg: c().warn }]] as Cell[]]
        : []),
  ]

  return (
    <box flexDirection="column" border borderStyle="rounded" borderColor={props.locked ? c().faint : border()} paddingX={1}>
      <box flexDirection="row" flexWrap="wrap" justifyContent="space-between" columnGap={2}>
        <box flexDirection="column" flexShrink={1}>
          <text fg={props.locked ? c().muted : c().text} attributes={TextAttributes.BOLD} wrapMode="word">
            <Show when={props.index !== undefined} fallback={<span style={{ fg: c().crit }}>⚠ </span>}>
              <span style={{ fg: c().muted }}>{`${(props.index ?? 0) + 1}. `}</span>
            </Show>
            {s.title ?? "Operator-only; not executed by this agent"} <Badge variant={risk.variant}>{risk.label}</Badge>
          </text>
          <Show when={s.title}>
            <text fg={c().muted}>Operator-only; not executed by this agent</text>
          </Show>
        </box>
        <Show when={!props.locked}>
          <box flexDirection="row" columnGap={1}>
            <Show when={s.fish}>
              <ToggleGroup
                options={[
                  { value: "bash", label: "bash" },
                  { value: "fish", label: "fish" },
                ]}
                selected={(v) => shell() === v}
                onToggle={(v) => setShell(v)}
              />
            </Show>
            <CopyButton text={command()} />
          </box>
        </Show>
      </box>
      <Show
        when={!props.locked}
        fallback={
          <box flexDirection="row" columnGap={1}>
            <text fg={c().muted}>◌ Waiting for step {(props.locked?.waitingFor ?? 0) + 1}.</text>
            <Button variant="link" label="Show anyway" onClick={() => props.locked?.unlock()} />
          </box>
        }
      >
        <box flexDirection="column" gap={1} paddingTop={1}>
          <Show when={vars.length > 0}>
            <box flexDirection="row" flexWrap="wrap" columnGap={2}>
              <For each={vars}>
                {(v) => <Button variant="outline" label={`${v.name} = ${values()[v.name] ?? ""}`} onClick={() => void edit(v)} />}
              </For>
            </box>
          </Show>
          <CodeBlock text={command()} prefix={shell() === "fish" ? "> " : "$ "} />
          <Grid columns={["", ""]} rows={facts().map((cells) => ({ cells: [[{ text: String(cells[0]), fg: c().muted }], cells[1]] }))} />
          <box flexDirection="row" justifyContent="flex-end">
            <Button variant="outline" label="I ran it" disabled={disabled} action={`I ran: ${name()}`} onClick={() => void verify()} />
          </box>
        </box>
      </Show>
    </box>
  )
}

export const OperatorOnly = defineBlock({
  name: "OperatorOnly",
  description:
    "A command or API request for the user to run outside this agent. Required for every mutation you propose. target is the exact cluster/context/project/space; blastRadius what it can affect; verify how you will confirm the result (the user can send you the output for that). risk: read | change | destructive (default change). rollback is required unless risk is read. expect is what success looks like. Put the full context in the command (--context, --server, --project, -n). vars are editable {{name}} placeholders in the command. fish is the same command for the fish shell, when the syntax differs.",
  props: stepSchema,
  component: ({ props }) => <CommandCard step={props} />,
})

const STEP_STATUS = z.enum(["todo", "done", "verified", "failed"])

export const Runbook = defineBlock({
  name: "Runbook",
  description:
    "Ordered operator-only steps where each depends on the previous one, e.g. clear a stuck Argo operation, then sync, then verify. Each step has the OperatorOnly fields plus status (todo | done | verified | failed), which you set from evidence when re-rendering. Later steps stay locked until the earlier ones are done or verified.",
  props: z.object({
    title: z.string(),
    steps: z.array(stepSchema.extend({ status: STEP_STATUS.optional() })),
  }),
  component: ({ props }) => {
    const c = useColors()
    const steps = list(props.steps)
    const [ranHere, setRanHere] = createSignal<Set<number>>(new Set())
    const [unlocked, setUnlocked] = createSignal<Set<number>>(new Set())
    const isDone = (i: number) => ranHere().has(i) || steps[i]?.status === "done" || steps[i]?.status === "verified"
    const firstOpen = () => steps.findIndex((_, i) => !isDone(i))
    return (
      <box flexDirection="column" gap={1}>
        <text fg={c().text} attributes={TextAttributes.BOLD}>
          <span style={{ fg: c().muted }}>❯ </span>
          {props.title}{" "}
          <span style={{ fg: c().muted, attributes: 0 }}>
            {steps.filter((_, i) => isDone(i)).length}/{steps.length} done
          </span>
        </text>
        <For each={steps}>
          {(s, i) => (
            <Show
              when={s.status !== "verified"}
              fallback={
                <box border borderStyle="rounded" borderColor={c().border} paddingX={1}>
                  <text fg={c().text}>
                    <span style={{ fg: c().ok }}>✓ </span>
                    <span style={{ fg: c().muted }}>{i() + 1}. </span>
                    {s.title ?? s.command} <Badge variant="success">Verified</Badge>
                  </text>
                </box>
              }
            >
              <CommandCard
                index={i()}
                step={s}
                onRan={() => setRanHere((cur) => new Set(cur).add(i()))}
                locked={
                  firstOpen() !== -1 && i() > firstOpen() && !unlocked().has(i())
                    ? { waitingFor: firstOpen(), unlock: () => setUnlocked((cur) => new Set(cur).add(i())) }
                    : undefined
                }
              />
            </Show>
          )}
        </For>
      </box>
    )
  },
})
