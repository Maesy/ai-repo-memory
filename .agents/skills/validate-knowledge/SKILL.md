---
name: validate-knowledge
description: "Review changed knowledge documents for routing, status, version, links, approval evidence and consistency before reporting completion; run the generated-index check and review source meaning separately."
---

# Validate repository knowledge

Read [the knowledge lifecycle and checklist](../../../docs/knowledge/governance.md) and the complete changed documents. Use the VCS the project actually uses. Inspect the full changed-file list and diff without path-dropping output filters.

Check unique IDs, appropriate type/location, applicable status, version changes, existing links, index reachability and an acyclic replacement chain. Templates must not be treated as approved records. Approval claims need actual evidence tied to this version; do not invent reviewers, dates or acceptance.

Compare requirements with relevant implementation/test evidence only when available. State what was checked, the concrete findings and what remains uncertain. A structure check does not prove business correctness or successful client loading.

Run `node .agents/skills/record-decision/scripts/update-index.mjs --check` from the repository root. This read-only check compares the generated index with the source headings and paths. If it fails during an authorized knowledge edit, regenerate with `--write`, inspect the result and check again. In a read-only review, report the drift without changing files. The knowledge-writing agent owns this step; do not ask the human operator to edit index rows.

The index script is not a knowledge schema or business validator. Hook tests validate notification behavior, not requirements or approval. Use the project's own verified checks if configured in docs/project.md. Report the index check separately from document review. Fix in-scope, authorized inconsistencies; ask for unresolved product choices rather than silently deciding.
