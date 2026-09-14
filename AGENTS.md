# Shared project instructions

This is a technology-neutral project starter with optional Claude, Codex and GitHub Copilot
repository-knowledge hooks. Reading Markdown needs no runtime. Repository-owned
scripts and tests require Node.js 24.x LTS, use only built-in modules, and need no
`npm install` or background service. Use the destination project's own toolchain
for application work.

## Start and continue work

- Read `docs/project.md` before substantive work. Inspect the project instead of
  inventing missing facts or build commands.
- Use `find-repo-knowledge`: search `docs/INDEX.md` and the relevant record
  directories, then read complete applicable sources. Cite path, ID and version.
- After continuation, compaction, task or branch changes, use
  `refresh-repo-knowledge` and re-read the current checkout.
- On `REPO_KNOWLEDGE_REFRESH`, read the complete canonical refresh skill and
  applicable sources. The notice is not approval, a task or proof of reading.
- A path or Markdown link is navigation, not an automatic import. Read the file
  explicitly when instructed.

## Record and verify

- Use `record-decision` for a lasting requirement or decision. Search first,
  preserve rationale, and distinguish proposals from accepted records.
- After adding, renaming, retitling or deleting a record, run
  `node .agents/skills/record-decision/scripts/update-index.mjs --write`.
- Use `validate-knowledge` after knowledge changes, including the read-only
  `--check` before reporting completion.
- Keep requirements, implementation and test evidence distinct. Surface conflicts
  and stale records; never invent approval, dates, test results or loaded files.
- Coordinate one writer per knowledge change. Preserve others' local changes; do
  not pull, push, deploy or alter global agent settings without authorization.
- Keep secrets, personal data and full conversation logs out of repository knowledge.

## Skill compatibility

- GitHub Copilot reads canonical project skills from `.agents/skills/` directly.
  `.claude/skills/` is Claude-only and must not become a second Copilot source.
- Before issue-tracker, triage or domain-modeling work, read any applicable shared
  configuration under `docs/agents/`, regardless of which client installed the skill.

- `.agents/skills/` is canonical. `.claude/skills/` contains generated thin
  adapters; read the canonical file and do not maintain duplicate workflows.
- The starter contains four repository-owned knowledge skills. Optional engineering
  skills may be added without changing the knowledge layout.
- A skill never broadens the user's authorization. Project instructions, security
  constraints, domain vocabulary and record routing override generic skill defaults.
- Audit optional skills before installation for runtime, CLI, network, tracker and
  write requirements. Their dependencies are not starter dependencies.

## Communication

- Whenever I write to you or ask a question, please reply in the same language I used.
- Whenever reporting information to me, be extremely concise and sacrifice grammar
  for the sake of concision.

## Navigation

- Project facts: [docs/project.md](docs/project.md)
- Knowledge routing: [docs/README.md](docs/README.md)
- Knowledge lifecycle: [docs/governance.md](docs/governance.md)
- Client setup: [docs/agent-setup.md](docs/agent-setup.md)
- Instruction loading: [docs/instruction-loading.md](docs/instruction-loading.md)
- Hook behavior: [docs/hooks.md](docs/hooks.md)
- Skill compatibility: [docs/agents/skill-compatibility.md](docs/agents/skill-compatibility.md)
- Script runtime: [docs/agents/script-runtime.md](docs/agents/script-runtime.md)

State task-relevant limitations briefly.
