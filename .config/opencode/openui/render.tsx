import { createStreamingParser, evaluateRoot, type ElementNode, type ValidationError } from "@openuidev/lang-core"
import { BoxRenderable, type CliRenderer } from "@opentui/core"
import { insert, RendererContext } from "@opentui/solid"
import { createRoot, ErrorBoundary, For, Show, type JSX } from "solid-js"
import { library } from "./library.tsx"
import { HostProvider, useColors, type Block, type Host } from "./shared.tsx"

// What react-lang's <Renderer> does, for Solid: parse the (possibly still streaming) program,
// evaluate it into an element tree, and render each element with its block. There are no
// queries, mutations, or $state in this library, so evaluation needs no store.

const schema = library.toJSONSchema()

export type Parsed = { root: ElementNode | null; errors: ValidationError[]; unresolved: string[] }

// An unclosed fence at the end of a message is a report that is still streaming.
export const closed = (raw: string) => /\n[ \t]*(```|~~~)[ \t]*\n*$/.test(raw)

export function parse(code: string, complete: boolean): Parsed {
  const result = createStreamingParser(schema, library.root).set(code, complete)
  const root = evaluateRoot(result, {
    ctx: { getState: () => undefined, resolveRef: () => undefined, functions: {}, actions: schema.actions },
    library,
    store: null,
  })
  return { root, errors: result.meta.errors, unresolved: result.meta.unresolved }
}

function renderNode(value: unknown): JSX.Element {
  if (value == null) return null
  if (Array.isArray(value)) return <For each={value}>{(v) => renderNode(v)}</For>
  if (typeof value === "object" && (value as ElementNode).type === "element") return <Node node={value as ElementNode} />
  // Bare strings and numbers only appear where a block expected one; show them rather than drop them.
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return <text>{String(value)}</text>
  return null
}

function Node(props: { node: ElementNode }) {
  const c = useColors()
  const Comp = library.components[props.node.typeName]?.component as Block<Record<string, unknown>> | undefined
  if (!Comp) return null
  return (
    <ErrorBoundary
      fallback={(error) => (
        <text fg={c().crit} wrapMode="word">
          {`${props.node.typeName} could not render: ${error instanceof Error ? error.message : String(error)}`}
        </text>
      )}
    >
      <Comp props={props.node.props} renderNode={renderNode} />
    </ErrorBoundary>
  )
}

// Markdown wants a renderable back from a code block renderer, outside any component tree, so the
// report gets its own Solid root, disposed when markdown destroys the frame.
export function mount(renderer: CliRenderer, parsed: Parsed, host: Host) {
  const frame = new BoxRenderable(renderer, { flexDirection: "column" })
  const dispose = createRoot((dispose) => {
    insert(frame, () => (
      <RendererContext.Provider value={renderer}>
        <HostProvider value={host}>
          <ReportBody parsed={parsed} streaming={host.streaming} />
        </HostProvider>
      </RendererContext.Provider>
    ))
    return dispose
  })
  frame.once("destroyed", () => queueMicrotask(dispose))
  return frame
}

function ReportBody(props: { parsed: Parsed; streaming: boolean }) {
  const c = useColors()
  return (
    <box flexDirection="column">
      <Show when={props.parsed.root} fallback={<text fg={c().faint}>◐ OpenUI report streaming…</text>}>
        <Node node={props.parsed.root!} />
      </Show>
      <Show when={props.streaming && props.parsed.root}>
        <text fg={c().faint}>◐ streaming…</text>
      </Show>
      <Show when={!props.streaming && props.parsed.errors.length > 0}>
        <text fg={c().faint} wrapMode="word">
          {`OpenUI: ${props.parsed.errors.length} part${props.parsed.errors.length === 1 ? "" : "s"} dropped (${props.parsed.errors
            .slice(0, 3)
            .map((e) => e.message)
            .join("; ")})`}
        </text>
      </Show>
    </box>
  )
}
