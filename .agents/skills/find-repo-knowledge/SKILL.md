---
name: find-repo-knowledge
description: "Find and read repository requirements and decisions when a task depends on project knowledge; check applicability and cite the actual sources."
---

# Find repository knowledge

Read [project facts](../../../docs/project.md), applicable policy under
`../../../docs/agents/`, and any root `CONTEXT.md` or `CONTEXT-MAP.md`.

Search [the generated index](../../../docs/INDEX.md), then read every complete
applicable source. An empty index result does not prove that no requirement exists;
also search `../../../docs/prd/`, `../../../docs/pdr/`, `../../../docs/adr/`, and
applicable `../../../src/*/CONTEXT.md` plus `../../../src/*/docs/adr/` sources.

Before issue-tracker, triage or domain-modeling work, read applicable shared
configuration under `../../../docs/agents/`, including `issue-tracker.md`,
`triage-labels.md` or `domain.md` when present. Do this regardless of which client
installed an optional skill.

Check each source's ID, version, status, scope, approval evidence and replacement
links. Templates under `docs/templates/` are not active requirements. Cite the
paths, IDs and versions actually read. Report missing project facts, conflicting
sources and index drift. Do not silently regenerate the index during read-only work.

Repository files show recorded knowledge, not implementation evidence. Inspect code
and tests separately when the task depends on actual behavior. Reading requires no
runtime or package manager.
