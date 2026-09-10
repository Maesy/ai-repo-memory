---
name: validate-knowledge
description: "Review changed knowledge documents for routing, status, version, links, approval evidence and consistency before reporting the knowledge change ready; does not run a built-in validator."
---

# Validate repository knowledge

Read [the knowledge lifecycle and checklist](../../../docs/knowledge/governance.md) and the complete changed documents. Use the VCS the project actually uses. Inspect the full changed-file list and diff without path-dropping output filters.

Check unique IDs, appropriate type/location, applicable status, version changes, existing links, index reachability and an acyclic replacement chain. Templates must not be treated as approved records. Approval claims need actual evidence tied to this version; do not invent reviewers, dates or acceptance.

Compare requirements with relevant implementation/test evidence only when available. State what was checked, the concrete findings and what remains uncertain. A structure check does not prove business correctness or successful client loading.

This starter has no executable knowledge schema validator. Its hook tests validate notification behavior, not business requirements or document approval. Use the project's own verified checks if configured in docs/project.md. Otherwise report a document review, not successful automated tests. Fix in-scope, authorized inconsistencies; ask for unresolved product choices rather than silently deciding.
