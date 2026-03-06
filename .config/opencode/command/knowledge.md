---
description: Save learnings to worknotes
---

Capture key learnings from our conversation and save them to ~/.config/opencode/.worknotes/worknotes

Structure: `.worknotes/worknotes/<component>/<topic>.md` (e.g., `hnc/upgrade.md`, `terraform/state-management.md`)

1. Identify the component (e.g., hnc, cert-manager, terraform, citadel-nodepools).
2. Check existing notes in that component's directory to avoid duplicates.
   - If a related note exists, update it instead of creating a new one.
3. Create/update a markdown file with kebab-case filename and add YAML frontmatter:
   - `id: worknotes/<component>/<topic>`
   - `title: <Title of the note>`
   - `tags: [worknote, <component>]` (only these two)
   - `created: <ISO timestamp>` (e.g., `2026-01-10T10:21:00`)
4. Include these sections:
   - **Context** - what problem/task this relates to
   - **Key Learnings** - insights, decisions, patterns discovered
   - **Verification/Commands** - useful commands to verify or reproduce (if applicable)
   - **Reference** - links to PRs, docs, or external resources
5. Keep it concise and actionable for future reference.
6. Update ~/.config/opencode/.worknotes/worknotes/index.md:
   - Add entry to the Session History table at the bottom.
7. Commit and push changes (note: ~/.config/opencode/.worknotes is the git repo root):
   - Run git commands from ~/.config/opencode/.worknotes directory.
   - Commit the changes and push to remote.

$ARGUMENTS
