---
name: validate-knowledge
description: "Review changed knowledge documents for routing, status, version, links, approval evidence and consistency before reporting completion; run the generated-index check and review source meaning separately."
---

# Validate repository knowledge

Read [the lifecycle rules](../../../docs/governance.md) and every complete changed
record. Inspect the full changed-file list and diff using the repository's VCS.

Check unique IDs, correct `docs/prd/`, `docs/pdr/`, `docs/adr/` or component-scoped
`src/<context>/docs/adr/` placement,
applicable status, intentional version changes, valid links, index reachability and
an acyclic replacement chain. Templates are not approved records. Approval claims
need evidence tied to the reviewed version.

Run this read-only structural check from the repository root:

```text
node .agents/skills/record-decision/scripts/update-index.mjs --check
```

If it fails during an authorized knowledge edit, regenerate with `--write`, inspect
the result and run `--check` again. In read-only review, report drift without writing.
The knowledge-writing agent owns index maintenance.

Compare requirements with implementation and test evidence when available, but keep
those evidence types distinct. Hook tests validate notification behavior, not product
meaning or approval. Report checks, concrete findings and remaining uncertainty.
