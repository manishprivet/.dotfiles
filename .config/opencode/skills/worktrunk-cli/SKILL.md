---
name: worktrunk-cli
description: Use the Worktrunk CLI `wt` to manage git worktrees for parallel agent workflows, including switching or creating worktrees, listing status, merging, cleanup, shell integration, hooks, state, and Claude Code integration setup. Trigger this skill whenever the user mentions `wt`, Worktrunk, worktree-based agent workflows, launching agents in separate worktrees, `.config/wt.toml`, or wants to automate git worktree setup with Worktrunk even if they do not explicitly ask for a skill.
---

# Worktrunk CLI Skill

Use this skill to handle Worktrunk workflows from the terminal without falling back to raw `git worktree` commands unless the user explicitly wants plain git.

## When to use

Use this skill when the user asks to:
- Run or troubleshoot `wt` commands.
- Create, switch, list, merge, or remove worktrees with Worktrunk.
- Launch Claude, Codex, OpenCode, or other agents in isolated worktrees.
- Set up Worktrunk shell integration so `wt switch` changes directories.
- Configure Worktrunk via `wt config`, `~/.config/worktrunk/config.toml`, or `.config/wt.toml`.
- Add or debug hooks, aliases, branch markers, per-branch vars, or LLM commit generation.
- Understand Worktrunk's Claude Code integration, status markers, or version-specific setup steps.

## Core workflow

1. Confirm context first
- Check that `wt` is installed with `wt --help` or `wt --version`.
- Confirm the user is inside the intended git repository before mutating anything.
- If the request depends on directory switching, verify shell integration status with `wt config show` and the user's shell config.

2. Map the request to the right command family
- `wt switch`: create or jump to a worktree, optionally launching a command with `-x`.
- `wt list`: inspect worktrees, branch status, CI state, markers, and summaries.
- `wt merge`: commit, rebase, merge, and optionally remove the worktree in one flow.
- `wt remove`: delete the current worktree and remove the branch when safe.
- `wt config`: shell integration, config files, state, and diagnostics.
- `wt step` / `wt hook`: reusable commands, copy-ignored, and workflow automation.

3. Prefer safe and inspectable steps
- Start with read-only inspection when the repo state is unclear.
- Use explicit branch names and target branches instead of guessing.
- Explain when Worktrunk behavior depends on config defaults such as merge auto-commit, rebase, or remove.
- Use Worktrunk-native commands for worktree lifecycle so hooks, naming conventions, and status tracking continue to work.

4. Execute and summarize
- Run the requested `wt` commands.
- Return the resulting branch or worktree path, notable status output, and the most useful next command.

## Command playbook

### Core worktree flow

```bash
wt switch feature-auth
wt switch --create feature-auth
wt list
wt remove
wt merge main
```

### Launch agents in isolated worktrees

```bash
wt switch -c -x claude feature-auth -- "Implement login flow"
wt switch -c -x codex bugfix-pagination -- "Fix off-by-one bug"
wt switch -c -x opencode docs-cleanup -- "Rewrite setup docs"
```

### Configuration and shell integration

```bash
wt config shell install
wt config create
wt config create --project
wt config show
wt config show --full
```

### State and diagnostics

```bash
wt config state default-branch
wt config state marker set "🚧"
wt config state vars set env=staging
wt config state logs
```

## Configuration guidance

### User config

Use `~/.config/worktrunk/config.toml` for personal defaults such as:
- worktree path templates
- default `wt list` behavior
- merge defaults
- personal aliases
- LLM commit generation commands

### Project config

Use `.config/wt.toml` for repository-shared behavior such as:
- `pre-start`, `post-start`, and `pre-merge` hooks
- dev server URLs shown by `wt list`
- shared aliases
- repository-specific forge settings

When the user wants shared automation for teammates, prefer editing `.config/wt.toml`. When they want personal preferences only, prefer the user config.

## Troubleshooting checklist

1. `wt switch` does not change directories
- Run `wt config shell install`.
- If shell integration is already installed, inspect the shell wrapper and `wt config show`.
- Explain that without shell integration, Worktrunk can print the destination path but cannot `cd` for the shell.

2. Worktree creation or merge behaves unexpectedly
- Inspect `wt config show` for `switch`, `merge`, and hook defaults.
- Check the current branch, target branch, and whether uncommitted changes exist.

3. Hooks or automation fail
- Inspect `.config/wt.toml` and user config separately.
- Use `wt config state logs` and verbose mode for hook output and diagnostics.

4. CI, PR, or marker data looks wrong in `wt list`
- Check forge auth such as `gh auth status` or `glab auth status` when relevant.
- Review cached state with `wt config state ci-status` and markers with `wt config state marker`.

5. Claude Code integration questions
- Check the installed Worktrunk version and available `wt config` subcommands before recommending setup commands from the docs.
- Explain that newer Worktrunk releases may include more direct Claude Code integration helpers, while older versions may require manual setup.
- Explain that the Claude Code integration is intended to improve configuration guidance, worktree isolation hooks, and `wt list` activity markers.

## Output format

For substantial requests, respond using:

1. `Intent`
- What Worktrunk task is being performed.

2. `Commands`
- Exact `wt` commands run or recommended.

3. `Result`
- Key repo or worktree outcome, including branch names, paths, hook/config effects, or merge state.

4. `Next Command` (optional)
- One useful follow-up command.

## Guardrails

- Do not replace `wt` with raw `git worktree` commands unless the user asks for plain git or Worktrunk is unavailable.
- Be explicit before destructive actions such as `wt remove`, merge operations, or config changes with repo-wide impact.
- Keep shell integration changes aligned with the user's shell instead of inventing wrapper code.
- Respect existing repository config and hooks; extend them minimally.
- If the user asks for automation around Claude Code or other agents, prefer Worktrunk's existing plugin, hook, and config mechanisms over custom glue.
