import { createLibrary } from "@openuidev/lang-core"
import { TextAttributes } from "@opentui/core"
import { Show } from "solid-js"
import { z } from "zod/v4"
import { Callout, Diagram, Evidence, NextChecks, Table, Text } from "./blocks/basic.tsx"
import { CompareMatrix, ConfigDiff } from "./blocks/compare.tsx"
import { HandoffPrompt, Ref, Refs, ScopeCard, SourceStatus } from "./blocks/context.tsx"
import { LogExcerpt } from "./blocks/log.tsx"
import { OperatorOnly, Runbook } from "./blocks/operator.tsx"
import { CausalChain, Hypotheses, Options } from "./blocks/reasoning.tsx"
import { SlackReplyDraft, ThreadDigest } from "./blocks/slack.tsx"
import { CapacityBar, DeliveryTrace, ResourceStatus, RunInspector } from "./blocks/status.tsx"
import { MetricChart, Timeline } from "./blocks/time.tsx"
import { defineBlock, sameText, useColors, type Block } from "./shared.tsx"

// The terminal port of infra-console's src/openui/library.tsx: the same components, schemas, and
// descriptions (so both harnesses teach the agent the same OpenUI Lang), rendered with OpenTUI.
// Render-only, as there: blocks display evidence the agent already gathered and hand follow-ups
// back to it, never execute anything.

const blockRefs = [
  ScopeCard.ref,
  Text.ref,
  Callout.ref,
  Hypotheses.ref,
  CausalChain.ref,
  Timeline.ref,
  MetricChart.ref,
  ResourceStatus.ref,
  CapacityBar.ref,
  DeliveryTrace.ref,
  RunInspector.ref,
  CompareMatrix.ref,
  ConfigDiff.ref,
  LogExcerpt.ref,
  Table.ref,
  Diagram.ref,
  Evidence.ref,
  SourceStatus.ref,
  ThreadDigest.ref,
  SlackReplyDraft.ref,
  Options.ref,
  OperatorOnly.ref,
  Runbook.ref,
  HandoffPrompt.ref,
  Refs.ref,
  NextChecks.ref,
] as const

const Section = defineBlock({
  name: "Section",
  description:
    "Titled group of two or more related blocks, only when a report has distinct parts the reader needs to tell apart (e.g. US vs Tokyo, before vs after the fix). Skip it for short reports. title names the part and does not repeat the Report title or a title inside it.",
  props: z.object({ title: z.string(), blocks: z.array(z.union(blockRefs)) }),
  component: ({ props, renderNode }) => {
    const c = useColors()
    return (
      <box flexDirection="column" gap={1}>
        <text fg={c().muted} attributes={TextAttributes.BOLD}>
          {(props.title ?? "").toUpperCase()}
        </text>
        {renderNode(props.blocks)}
      </box>
    )
  },
})

const Report = defineBlock({
  name: "Report",
  description:
    "Root container for one diagnosis report. subtitle is optional: add one only for context the title and blocks don't give (e.g. the time window checked), never a rewording of the title.",
  props: z.object({
    title: z.string(),
    blocks: z.array(z.union([...blockRefs, Section.ref])),
    subtitle: z.string().optional(),
  }),
  component: ({ props, renderNode }) => {
    const c = useColors()
    return (
      <box flexDirection="column" border borderStyle="rounded" borderColor={c().border} paddingX={1} gap={1}>
        <box flexDirection="column">
          <text fg={c().text} attributes={TextAttributes.BOLD} wrapMode="word">
            {props.title}
          </text>
          <Show when={props.subtitle && !sameText(props.subtitle, props.title)}>
            <text fg={c().muted} wrapMode="word">
              {props.subtitle}
            </text>
          </Show>
        </box>
        {renderNode(props.blocks)}
      </box>
    )
  },
})

// Each block's renderer is typed by its own schema; the library holds them as one renderer type.
export const library = createLibrary<Block<any>>({
  root: "Report",
  components: [
    Report,
    Section,
    ScopeCard,
    Text,
    Callout,
    Hypotheses,
    CausalChain,
    Timeline,
    MetricChart,
    ResourceStatus,
    CapacityBar,
    DeliveryTrace,
    RunInspector,
    CompareMatrix,
    ConfigDiff,
    LogExcerpt,
    Table,
    Diagram,
    Evidence,
    SourceStatus,
    ThreadDigest,
    SlackReplyDraft,
    Options,
    OperatorOnly,
    Runbook,
    HandoffPrompt,
    Refs,
    Ref,
    NextChecks,
  ],
})
