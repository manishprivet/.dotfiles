# Process Modeling

Use this reference when the user is working with deployment processes, runbooks, or step property bags.

## Best workflow for process HCL

1. Build or inspect the step in the Octopus UI first.
2. Export the process as JSON from the Process Editor.
3. Copy property keys from the JSON instead of guessing them.
4. Translate the JSON into Terraform while preserving ordering and nesting.

## JSON to HCL mapping

From the Octopus guide:

- `Steps[].Properties` maps to `process_step.properties`
- `Steps[].Actions[0].Properties` maps to `process_step.execution_properties`
- Additional action objects map to child-step execution properties

This matters because the provider often expects exact key names from the Octopus process model.

## Practical rules

- Do not rename property keys for readability.
- Do not drop empty-looking keys unless the provider docs confirm they are optional.
- Preserve step order unless the user explicitly wants a refactor.
- For large process blocks, explain assumptions and point out which keys came from the exported JSON.

## When to slow down

Slow down and verify the docs when:

- The user asks for a complex `deployment_process` resource.
- A step template or action type is unfamiliar.
- The provider errors on a property that looks valid from the UI.
- The user is converting a hand-built process into Terraform for the first time.

In those cases, prefer citing the export-driven mapping approach rather than inventing properties from memory.
