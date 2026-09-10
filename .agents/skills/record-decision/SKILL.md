---
name: record-decision
description: "Record a lasting requirement, product decision or architecture decision in the repository when one is agreed or proposed, preserving rationale and approval status."
---

# Record a decision

Read [routing](../../../docs/knowledge/README.md) and [lifecycle rules](../../../docs/knowledge/governance.md). Search existing records before writing.

Route observable requirements to a PRD, product choices to a PDR and technical choices to an ADR. Use [the templates](../../../docs/templates/) only when a new record is warranted. Add directories only with real content. Do not turn each small code edit into a decision record.

Capture context, the actual alternatives, the choice, rationale and consequences. Unapproved content stays proposed. Record a reviewer, date and approval reference only from actual authorization; approval belongs to the reviewed version. Keep the currently applicable requirement while a successor is proposed.

For a changed accepted decision, create a successor and link the records. Coordinate one writer for the change; preserve unrelated work. The agent editing the source owns the index update; do not assign mechanical index maintenance to the human operator.

## Generate the navigation index

Give every knowledge document an informative `# Title`. After source changes, run `node .agents/skills/record-decision/scripts/update-index.mjs --write` from the repository root. The [bundled script](scripts/update-index.mjs) derives the complete INDEX.md from document headings and paths, covering additions, renames, title changes and deletions. It does not edit source documents, copy their approval metadata, or infer their meaning.

The same input produces the same index; an unchanged result is not rewritten. Do not edit generated index rows. Keep explanations in their source documents. If a writer lock or incomplete source prevents generation, coordinate with the source writer and resolve the cause before retrying. Never delete another running writer's lock.

Follow the complete validate-knowledge skill, including `node .agents/skills/record-decision/scripts/update-index.mjs --check`. Fix index drift before claiming the knowledge change ready. The script requires Node 22+; it does not replace the content review.

Report the files, IDs, versions and remaining uncertainties. Do not commit, publish externally or modify another checkout without authorization.
