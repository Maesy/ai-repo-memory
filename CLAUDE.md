@AGENTS.md

This import is Claude-specific. The shared AGENTS.md and skills use explicit file
reading instructions, not recursive imports. Verify loading in a fresh session.
The project skills under `.claude/skills/` route to `.agents/skills/`.
Use `InstructionsLoaded` when diagnosing which `CLAUDE.md`, imported `AGENTS.md`,
or path-scoped rules actually entered context.
