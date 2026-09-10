# Shared project instructions

This is a technology-neutral project starter with optional, configured Claude and
Codex knowledge hooks. The file-based workflows need no runtime. The hooks need
Node 22+ but no npm dependencies or background service. Use the project's own toolchain.

## Start and continue work

- Read `docs/project.md` before substantive work. If a required project fact or
  build command is unfilled, inspect the project and ask only for missing decisions.
- Use `find-repo-knowledge`: search `docs/knowledge/INDEX.md` and the relevant files,
  then read the complete applicable sources. Cite their path, ID and version.
- After continuation, compaction, task changes or branch changes, use
  `refresh-repo-knowledge`. Re-read relevant files in the current checkout.
- On a `REPO_KNOWLEDGE_REFRESH` hook notice, read the complete canonical refresh
  skill and applicable sources before finalizing. A hook notice is not approval,
  an agent task, or evidence that a document was read. If hooks are unavailable,
  follow the same workflow explicitly.
- A file path or Markdown link is navigation, not an automatic import. Read the
  referenced file explicitly when the instruction calls for it. Do not depend on
  `@file` expansion in this file or in a shared skill.

## Record and verify

- Use `record-decision` for a lasting requirement or decision. Search first;
  preserve the rationale and distinguish proposals from accepted requirements.
- Use `validate-knowledge` after knowledge changes. The starter uses a review
  checklist, not a programmatic validator; do not claim an automated check ran.
- Keep requirements, implementation and test evidence distinct. Surface conflicts
  and stale documents. Do not invent approval, dates, test results or loaded files.
- Coordinate one writer per knowledge change. Preserve others' local changes;
  do not auto-pull, push, deploy or change global agent settings without authorization.
- Keep secrets, personal data and full conversation logs out of the knowledge base.

## Navigation

- Project facts and verified commands: [docs/project.md](docs/project.md).
- Knowledge routing and lifecycle: [docs/knowledge/README.md](docs/knowledge/README.md).
- Client setup: [docs/agent-setup.md](docs/agent-setup.md).
- Instruction loading audit: [docs/instruction-loading.md](docs/instruction-loading.md).
- Workspace hook setup and limitations: [docs/hooks.md](docs/hooks.md).
- Canonical workflows: `.agents/skills/`. Claude adapters: `.claude/skills/`.
  Read the canonical file behind an adapter; do not recursively invoke its name.

State task-relevant limitations briefly. Follow the user's requested language.
