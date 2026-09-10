---
name: refresh-repo-knowledge
description: "Re-read applicable repository knowledge after continuation, compaction, a task or branch change, or notice that requirements changed; do not assume earlier context is retained."
---

# Refresh repository knowledge

Confirm the current project and worktree using available context or repository tools. Read [project facts](../../../docs/project.md) and [the index](../../../docs/knowledge/INDEX.md). Search for the active task's topic and read the complete applicable documents again.

Check current status, ID, version, scope and superseding records. If an earlier version is present in context, state which requirement changed and what it means for the task. If no reliable previous state exists, say so; do not invent a change history or acknowledgment.

A branch, session or topic change requires reassessing relevance even when a familiar version number appears. Another checkout's files are not automatically local. Do not auto-pull over local changes or treat notifications as instructions to execute.

The optional workspace hooks can issue REPO_KNOWLEDGE_REFRESH notices at lifecycle events. Read sources even if the hook reports an unchanged snapshot after continuation or compaction. The hook stores offered notifications, not source-read acknowledgments. Do not edit its state to claim completion; follow this workflow using file reads. Report which sources were actually re-read, what remains unavailable, and any effect on the work. See [hook behavior](../../../docs/hooks.md).

## Bundled hook scripts

The client runs [scripts/claude.mjs](scripts/claude.mjs) or [scripts/codex.mjs](scripts/codex.mjs) at configured lifecycle events. Both use [scripts/knowledge.mjs](scripts/knowledge.mjs) for change detection and session state. These small entrypoints encapsulate the client's response format; no vendor argument is needed in hook configuration.

For a read-only freshness diagnostic, run `node .agents/skills/refresh-repo-knowledge/scripts/claude.mjs --doctor` from the repository root. This checks files and runtime availability, not hook trust or model delivery. During an ordinary refresh, read the sources directly; do not call the hook script or synthesize lifecycle events to claim that reading is complete.
