---
name: octopusdeploy-terraform-provider
description: Use this skill whenever the user needs help choosing, writing, or debugging Octopus Deploy Terraform resources and data sources in `OctopusDeploy/octopusdeploy`. Trigger on requests about Octopus projects, project groups, environments, lifecycles, feeds, tenants, teams, users, tags, variable sets, step templates, accounts, targets, workers, runbooks, processes, triggers, or platform hub objects, even if the user never says "resource", "data source", or `octopusdeploy_`.
---

# Octopus Deploy Terraform Resources and Data Sources

Use this skill to map Octopus Deploy concepts to the exact `octopusdeploy_*` resource or data source and produce valid HCL around that selection.

## When to use

Use this skill when the user asks to:
- Create or update Terraform for Octopus Deploy objects.
- Figure out which `octopusdeploy_*` resource or data source matches an Octopus concept.
- Convert Octopus UI concepts like projects, lifecycles, workers, tags, feeds, or targets into HCL.
- Troubleshoot wrong type names, wrong nesting, wrong pluralization, or resource-vs-data-source confusion.
- Work with process-related resources such as deployment processes, runbook processes, steps, child steps, or templated steps.

## Core workflow

1. Identify intent
- Decide whether the user wants to manage an object or only look up an existing one.
- Break multi-object requests into the set of Octopus concepts involved.

2. Choose resource vs data source
- Use a resource when Terraform should create, update, or own the object.
- Use a data source when Terraform only needs to read an existing object.
- If the user is unclear, default to a data source for lookups and a resource for lifecycle-managed objects.

3. Pick the exact type name
- Read `references/resources.md` for the full resource catalog.
- Read `references/data-sources.md` for the full data source catalog.
- If the object is process-related, also read `references/process-modeling.md`.

4. Compose HCL from the chosen types
- Use the exact Terraform type names from the provider docs.
- Keep related objects linked through resource attributes or data-source IDs.
- Preserve nested block structure exactly for process resources and specialized target/account/feed types.

## Selection rules

- Prefer the most specific type available. For example, use the exact feed, target, worker, or account type instead of guessing a generic one.
- Many lookup types are plural data sources, such as `octopusdeploy_projects` or `octopusdeploy_environments`.
- Some concepts have both singular and plural forms with different meanings, so do not infer names casually from memory.
- Process modeling often uses multiple resources together: `octopusdeploy_process`, `octopusdeploy_process_step`, `octopusdeploy_process_child_step`, ordering resources, and templated variants.
- When an Octopus concept is not in the catalogs, say so plainly instead of inventing a provider type.

## Common mapping patterns

- Create a project: `octopusdeploy_project`
- Lookup existing projects: `data "octopusdeploy_projects"`
- Create an environment: `octopusdeploy_environment`
- Lookup environments: `data "octopusdeploy_environments"`
- Create a lifecycle: `octopusdeploy_lifecycle`
- Lookup lifecycles: `data "octopusdeploy_lifecycles"`
- Create a tenant: `octopusdeploy_tenant`
- Lookup tenants: `data "octopusdeploy_tenants"`
- Create a team: `octopusdeploy_team`
- Lookup teams: `data "octopusdeploy_teams"`
- Create a variable set: `octopusdeploy_library_variable_set`
- Lookup variable sets: `data "octopusdeploy_library_variable_sets"`

## Troubleshooting checklist

1. Wrong type name
- Check the catalogs before changing the HCL.
- Watch for plural data sources and singular resources.

2. Wrong object family
- Distinguish deployment targets, workers, feeds, accounts, tags, and process resources carefully.
- Platform hub resources are separate from classic account resources.

3. Process resource issues
- Do not invent step property or child-step structures.
- Use the process modeling reference when nested process resources are involved.

4. Schema mismatches
- `unsupported argument` or `unsupported block type` usually means the wrong resource/data source was chosen or the HCL shape does not match that type.

## Output format

For substantial requests, respond using:

1. `Intent`
- What Octopus objects are being modeled.

2. `Type Selection`
- The exact resource and data-source names chosen, plus why.

3. `HCL`
- The Terraform blocks to add or edit.

4. `Notes`
- Assumptions, alternatives, or provider-type caveats.

## Guardrails

- Never invent `octopusdeploy_*` type names.
- Prefer exact provider names over hand-wavy descriptions.
- If several types are plausible, name the alternatives and explain the decision.
- Keep the skill focused on resources and data sources; do not drift into provider setup guidance.
