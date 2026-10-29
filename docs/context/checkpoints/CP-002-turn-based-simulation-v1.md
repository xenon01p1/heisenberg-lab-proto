# CP-002 — Turn-Based Simulation for V1

- **Date:** 2026-10-29
- **Status:** APPROVED
- **Decision owner:** Project owner
- **Decision:** V1 sessions advance only through explicit user actions. No automatic progression, timers, scheduled background jobs, or real-time synchronization are required.
- **Rationale:** Simpler implementation, testing, debugging, and maintenance; fits Bun, Hono, React, Drizzle, and PostgreSQL.
- **Consequences:** A later simulation-engine feature will define an explicit advance action. Session management must not implement an automatic timer.
- **Not decided:** Exact fictional steps, incident mechanics, quality scoring, testing framework, and real-time behavior for future versions.
- **Related features:** `03-session-management.md` and future simulation-engine specification.
