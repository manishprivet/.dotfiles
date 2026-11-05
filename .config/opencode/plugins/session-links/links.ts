// What a session is about: a Slack thread, a GitHub pull request or issue, a Linear issue. Links are
// kept in the session's metadata as `metadata.links`, so any opencode client can read and write them.
// `subject` names the thing itself, the same however it was linked, so a client can find every
// session about it:
//   github:owner/repo#88    linear:TEAM-312    slack:C0A77P6TX2N:1793350000.000400

export const LINK_SOURCES = ["slack", "github", "linear"] as const
export type LinkSource = (typeof LINK_SOURCES)[number]
export type SessionLink = { subject: string; title: string; url?: string; source?: LinkSource }

export const MAX_LINKS = 20

type Metadata = Record<string, unknown> | undefined

export const linksOf = (metadata: Metadata): SessionLink[] => (Array.isArray(metadata?.links) ? (metadata.links as SessionLink[]) : [])

// A Slack, GitHub or Linear URL as a link, or undefined for anything else.
export function linkFromUrl(raw: string): SessionLink | undefined {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return undefined
  }
  if (url.protocol !== "https:") return undefined
  const path = url.pathname.split("/").filter(Boolean)

  if (url.hostname === "github.com" && (path[2] === "pull" || path[2] === "issues") && /^\d+$/.test(path[3] ?? "")) {
    const repo = `${path[0]}/${path[1]}`.toLowerCase()
    return { subject: `github:${repo}#${path[3]}`, title: `${repo}#${path[3]}`, url: `https://github.com/${path.slice(0, 4).join("/")}`, source: "github" }
  }
  if (url.hostname === "linear.app" && path[1] === "issue" && /^[a-z]+-\d+$/i.test(path[2] ?? "")) {
    const id = path[2].toUpperCase()
    return { subject: `linear:${id}`, title: id, url: `https://linear.app/${path.slice(0, 3).join("/")}`, source: "linear" }
  }
  // A message link (archives/C…/p1793350000000400) means its thread when it has a thread_ts.
  if (url.hostname.endsWith(".slack.com") && path[0] === "archives" && path[1]) {
    const message = path[2]?.match(/^p(\d+)(\d{6})$/)
    const ts = url.searchParams.get("thread_ts") ?? (message ? `${message[1]}.${message[2]}` : undefined)
    return {
      subject: ts ? `slack:${path[1]}:${ts}` : `slack:${path[1]}`,
      title: ts ? "Slack thread" : "Slack conversation",
      url: url.href,
      source: "slack",
    }
  }
}
