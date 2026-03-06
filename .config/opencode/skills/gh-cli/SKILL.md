---
name: gh-cli
description: Use the GitHub CLI `gh` to manage pull requests, issues, repositories, releases, workflows, and API calls from terminal. Trigger this skill whenever users mention `gh` commands, GitHub automation in shell, or tasks like `gh pr`, `gh issue`, `gh repo`, `gh workflow`, `gh run`, or `gh api`, even if they do not explicitly ask for a skill.
---

# GitHub CLI Skill

Use this skill to perform GitHub operations safely and efficiently with `gh`.

## When to use

Use this skill when the user asks to:
- Create, review, or merge pull requests with `gh pr`.
- Open, triage, or edit issues with `gh issue`.
- Manage repos, releases, and labels with `gh repo`, `gh release`, `gh label`.
- Inspect or run CI workflows with `gh workflow` and `gh run`.
- Query GitHub APIs with `gh api`.
- Automate GitHub tasks via scripts or terminal one-liners.

## Core workflow

1. Confirm context
- Check CLI availability/version with `gh --version`.
- Check authentication when needed with `gh auth status`.
- Determine repo context (`owner/repo`) and current branch before acting.

2. Map request to command family
- `gh pr`: create/view/checkout/review/merge PRs.
- `gh issue`: create/list/view/edit/close issues.
- `gh repo`: view/clone/create/fork repo operations.
- `gh workflow` and `gh run`: workflows and run status/logs/reruns.
- `gh api`: REST/GraphQL access for advanced operations.

3. Prefer safe defaults
- Use read-only commands first (`list`, `view`, `status`) before mutating.
- Use explicit flags (repo, branch, title/body) to avoid ambiguity.
- For changes with side effects (merge/delete/close), summarize impact before running.

4. Execute and summarize
- Run requested commands.
- Return concise outcomes, links/IDs, and a practical next command.

## Command playbook

### Auth and context

```bash
gh auth status
gh repo view --json nameWithOwner,defaultBranchRef
```

### Pull requests

```bash
gh pr status
gh pr create --title "feat: add X" --body "Implements X for Y"
gh pr view --web
gh pr merge --squash --delete-branch
```

### Issues

```bash
gh issue list --state open
gh issue create --title "Bug: ..." --body "Steps to reproduce..."
gh issue view 123
```

### Actions

```bash
gh workflow list
gh run list --limit 10
gh run view <run-id> --log
```

### API

```bash
gh api repos/{owner}/{repo}
gh api graphql -f query='query { viewer { login } }'
```

## Troubleshooting checklist

1. Authentication
- Run `gh auth status` and re-auth with `gh auth login` if needed.

2. Repository targeting
- Specify `-R owner/repo` when outside the intended repo.

3. Permissions and scopes
- If API calls fail with permission errors, verify token scopes and org policy.

4. Workflow/runs
- Confirm workflow name/ID exists before attempting rerun/view/logs.

## Output format

For substantial requests, respond with:

1. `Intent`
- What was done and why.

2. `Commands`
- Exact `gh` command(s) run or recommended.

3. `Result`
- Key output: URL, number, status, merged/closed state, run outcome.

4. `Next Command` (optional)
- One useful follow-up command.

## Guardrails

- Do not expose tokens, secrets, or sensitive API payloads.
- Be explicit before destructive actions (merge with branch deletion, closing issues, deleting releases).
- Prefer non-interactive flags in automation contexts.
- Respect repository policies, branch protection, and required checks.
