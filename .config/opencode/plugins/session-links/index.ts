import { Plugin } from "@opencode/plugin"
import { linkFromUrl, linksOf, MAX_LINKS, type SessionLink } from "./links.ts"

// Session links, server part: a `session_link` tool, so an agent can link its session to the thread,
// PR or issue it is working on. It writes the session's `metadata.links` (links.ts), which the TUI
// part (tui.tsx) and any other client show.

const describe = (links: SessionLink[]) =>
  links.length ? links.map((l) => `- ${l.title}${l.url ? ` (${l.url})` : ""}`).join("\n") : "(none)"

export default Plugin.define({
  id: "session-links",
  async setup(ctx) {
    // Links belong to the main session, so a subagent's call links its root.
    async function root(sessionID: string) {
      let session = await ctx.session.get({ sessionID })
      for (let depth = 0; session.parentID && depth < 10; depth++) session = await ctx.session.get({ sessionID: session.parentID })
      return session
    }

    const registration = await ctx.tool.transform((tools) =>
      tools.add({
        name: "session_link",
        description: [
          "Links this session to the Slack thread, GitHub pull request or issue, or Linear issue it is about, so the session can be found from that item and says what it is about.",
          "Use it when the work is about one of those (the user pointed you at it, or you are working on it), or when the work produced one, such as a PR you opened.",
          "Pass its URL, and its real title when you know it (the PR or issue title, or what the thread is about); otherwise a generic one is used.",
          "Linking the same item again updates its title. Returns the session's links.",
        ].join(" "),
        input: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "https URL of a Slack message or thread, a GitHub pull request or issue, or a Linear issue",
            },
            title: { type: "string", description: "Short title for the item, e.g. the PR title" },
          },
          required: ["url"],
          additionalProperties: false,
        },
        async execute(input, context) {
          const { url, title } = (input ?? {}) as { url?: unknown; title?: unknown }
          const link = typeof url === "string" ? linkFromUrl(url) : undefined
          if (!link) throw new Error("Not a Slack thread, GitHub pull request or issue, or Linear issue URL (https only).")
          if (typeof title === "string" && title.trim()) link.title = title.replace(/\s+/g, " ").trim().slice(0, 200)

          // Read fresh, so links added meanwhile by other clients stay.
          const session = await root(context.sessionID)
          const current = linksOf(session.metadata as Record<string, unknown> | undefined)
          const others = current.filter((l) => l.subject !== link.subject)
          if (others.length >= MAX_LINKS) throw new Error(`The session already has ${MAX_LINKS} links, the most it takes.`)
          const links = [...others, link]
          await ctx.session.update({ sessionID: session.id, metadata: { ...(session.metadata as object), links } as never })

          const verb = others.length < current.length ? "Updated" : "Linked"
          return {
            content: `${verb} ${link.title}.\n\nThe session's links:\n${describe(links)}`,
            metadata: { link, links },
          }
        },
      }),
    )
    return () => registration.dispose()
  },
})
