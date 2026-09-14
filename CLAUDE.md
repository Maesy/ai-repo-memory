@AGENTS.md

Claude-specific entry point only. The shared workflow lives in `AGENTS.md` and the
canonical `.agents/skills/` files. `.claude/skills/` contains generated adapters;
follow the canonical target and do not recursively invoke an adapter name.

When auditing instruction loading, use Claude's current instruction diagnostics and
the checks in `docs/instruction-loading.md`. Repository hook configuration still
depends on workspace trust and host policy.
