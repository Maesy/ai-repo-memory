---
name: refresh-repo-knowledge
description: "Re-read applicable repository knowledge after continuation, compaction, a task or branch change, or notice that requirements changed; do not assume earlier context is retained."
---

# Refresh repository knowledge

Confirm the current checkout. Read [project facts](../../../docs/project.md),
applicable policy under `../../../docs/agents/`, any root `CONTEXT.md` or
`CONTEXT-MAP.md`, and [the generated index](../../../docs/INDEX.md). Search the
active topic and read complete applicable records again.

Check current status, ID, version, scope and superseding records. State what changed
and how it affects the task when reliable earlier state exists. Otherwise state that
the comparison is unavailable. Another checkout's files are not automatically local.
Do not pull over local changes or treat a hook notice as an instruction to edit.

Workspace hooks may issue `REPO_KNOWLEDGE_REFRESH` notices. A notice records that a
refresh was offered; it is not approval, a task or proof that a source was read.
Read sources explicitly even when the snapshot is unchanged after continuation or
compaction. Do not modify hook state to claim completion. See
[hook behavior](../../../docs/hooks.md).

## Bundled hook scripts

Claude, Codex and GitHub Copilot run `scripts/claude.mjs`, `scripts/codex.mjs` or
`scripts/copilot.mjs`; all delegate to `scripts/knowledge.mjs`. The snapshot also
watches `src/*/CONTEXT.md` and `src/*/docs/adr/`. On a `PostToolUse` notice after an authorized knowledge
edit owned by the current agent, also follow `record-decision` and
`validate-knowledge`. When another writer owns the change, re-read and report its
effect without editing automatically.

For a read-only diagnostic, run from the repository root:

```text
node .agents/skills/refresh-repo-knowledge/scripts/claude.mjs --doctor
```

This checks files and the Node.js runtime, not client trust or delivery into model
context. During a normal refresh, read sources directly; do not synthesize hook
events as proof of reading.
