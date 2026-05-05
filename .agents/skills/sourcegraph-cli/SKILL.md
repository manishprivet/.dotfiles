---
name: sourcegraph-cli
description: Use the Sourcegraph `src` CLI to authenticate, run code search, inspect repositories, execute GraphQL API queries, and manage Sourcegraph settings. Trigger this skill whenever users mention `src`, Sourcegraph CLI commands, Sourcegraph automation from terminal, or tasks like search/repos/config/api/login, even if they do not explicitly ask for a skill.
---

# Sourcegraph CLI Skill

Use this skill to reliably complete Sourcegraph CLI work in local terminals.

## When to use

Use this skill when the user asks to:
- Run Sourcegraph searches from terminal with `src search`.
- Authenticate or switch Sourcegraph instances with `src login`.
- Query Sourcegraph GraphQL APIs with `src api`.
- Inspect or manage repositories via `src repos`.
- Inspect or modify Sourcegraph settings with `src config`.
- Discover `src` subcommands and automate repetitive Sourcegraph CLI tasks.

## Core workflow

1. Confirm CLI and endpoint context
- Run `src version` to confirm CLI is installed and current.
- Prefer existing environment configuration (`SRC_ENDPOINT`, `SRC_ACCESS_TOKEN`) if already set.
- If auth is missing, guide user to `src login <SOURCEGRAPH_URL>`.

2. Map request to command family
- `search`: code search and streaming JSON output.
- `repos`: list/get/delete and metadata management.
- `api`: GraphQL queries with optional variables.
- `config`: get/list/edit settings.
- Other domains: `batch`, `code-intel`, `search-jobs`, `users`, `teams`, `orgs`, `admin`.

3. Build safe, inspectable commands
- Prefer explicit flags over hidden defaults.
- Use `-json` for machine-readable output when results will be parsed.
- Use `--` before query text when a search begins with negation.
- For unclear flags, check `src <command> -h` before execution.

4. Execute and summarize
- Run commands and return concise result summaries.
- Include key IDs/names/counts and any next-step command.

## Command playbook

### Authentication

```bash
src login https://sourcegraph.com
```

### Search

```bash
src search 'repo:github.com/sourcegraph/sourcegraph type:file authz'
src search -json 'repo:github.com/sourcegraph/sourcegraph lang:go parse error'
src search -- '-repo:github.com/sourcegraph/sourcegraph timeout'
```

### Repositories

```bash
src repos list
src repos get github.com/sourcegraph/sourcegraph
src repos add-metadata github.com/org/repo team platform
```

### GraphQL API

```bash
src api -query='query { currentUser { username } }'
src api -query='query($q: String!) { search(query: $q) { results { resultCount } } }' -vars='{"q":"repo:github.com/sourcegraph/sourcegraph authz"}'
```

### Config

```bash
src config get
src config list
```

## Troubleshooting checklist

1. Auth and endpoint
- Verify `SRC_ENDPOINT` and login target.
- Re-run `src login <url>` when unauthorized.

2. Query and flags
- Add `--` when search query starts with `-`.
- Validate query syntax against Sourcegraph search syntax.

3. API execution
- Use exit code semantics for `src api`:
  - `0`: success
  - `1`: transport/general failure
  - `2`: GraphQL error response

4. Diagnostics
- Use `-trace` for request tracing.
- Use `-dump-requests` only when debugging, and treat output as sensitive.

## Output format

For substantial requests, respond using:

1. `Intent`
- What task was performed and which `src` command family was used.

2. `Commands`
- Exact command(s) run or recommended.

3. `Result`
- Key results (counts, names, IDs, status).

4. `Next Command` (optional)
- One practical follow-up command.

## Guardrails

- Never expose or print access tokens.
- Warn before destructive operations (`src repos delete`, admin-level changes).
- Prefer read-only inspection commands before mutations.
- If a request needs elevated privileges, state that clearly and provide the minimal command the user should run.
