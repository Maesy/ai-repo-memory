---
name: record-decision
description: "Record a lasting requirement, product decision or architecture decision in the repository when one is agreed or proposed, preserving rationale and approval evidence."
---

# Record repository knowledge

Read [routing](../../../docs/README.md) and
[lifecycle rules](../../../docs/governance.md). Search existing records before
writing. Route observable requirements to `docs/prd/`, product choices to
`docs/pdr/`, system-level technical choices to `docs/adr/`, and a component-scoped
choice to `src/<context>/docs/adr/` when that component has
`src/<context>/CONTEXT.md`. Use
[the templates](../../../docs/templates/) only when a new record is warranted.

Give every record a stable ID and an informative level-one heading. Preserve
context, alternatives, rationale and consequences. Unapproved content remains
`proposed`. Record an approver, date and traceable basis only from real evidence.
When replacing an accepted decision, create a successor and link both records.

Coordinate one writer and preserve unrelated work. The agent changing a record owns
index maintenance. After additions, renames, title changes or deletions, run:

```text
node .agents/skills/record-decision/scripts/update-index.mjs --write
```

The bundled Node.js 24.x, standard-library-only script derives `docs/INDEX.md`
from headings and paths. It does not infer meaning, status or approval. Do not edit
generated rows by hand.

Then follow `validate-knowledge`, including:

```text
node .agents/skills/record-decision/scripts/update-index.mjs --check
```

Report changed files, IDs, versions and remaining uncertainty. Do not commit,
publish or modify another checkout without authorization.
