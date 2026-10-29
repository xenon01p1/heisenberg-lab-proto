# CP-001 — PostgreSQL Database Selection

- **Date:** 2026-10-29
- **Status:** APPROVED
- **Decision owner:** Project owner
- **Question:** Which relational database should Heisenberg Lab use?
- **Alternatives:** PostgreSQL; other relational databases (not evaluated in detail).
- **Decision:** Use PostgreSQL as the application database, with Drizzle ORM and Drizzle Kit as already selected in the project stack.
- **Rationale:** The project owner explicitly confirmed PostgreSQL. No additional technical rationale was recorded.
- **Consequences:** Database design and migration plans should target PostgreSQL. This approval does **not** approve a particular schema, migration, hosting provider, or deployment architecture.
- **Affected documents:** `AGENTS.md`, `docs/context/architecture.md`, `docs/context/project-overview.md`, `docs/context/database-design.md`.
