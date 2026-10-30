# CP-003 — Full-stack application scope and database-backed authentication

**Status:** Approved in principle by owner; implementation details below remain pending.

## Approved
- Build a complete usable full-stack React + Hono + PostgreSQL application, not API-only feature implementations.
- Provide user registration, login, logout, user profile/menu, dashboard, recipes, equipment, and sessions.
- Authentication uses persisted email/password accounts in PostgreSQL, not a fixed demo login.
- Preserve the existing Bun, Turborepo, Hono, React, Zod, Drizzle/Drizzle Kit, PostgreSQL, Docker stack and repository layout.
- Distinguish authenticated account `users` from fictional `operators` used in simulation.
- Continue turn-based V1: no automatic step advancement.
- Complete features require working React UI, API, persistence as applicable, validation, tests, and verified integration.

## Superseded earlier V1 assumptions
- 'No authentication in V1' is superseded.
- 'Equipment deferred from V1' is superseded for equipment catalog and planned session selection. Reservation and release behavior still needs explicit approval.
- 'users are seeded fictional operators' is superseded: use separate `operators` for fictional characters.

## Still undecided — do not infer
- Cookie/CSRF deployment details, password recovery and email verification policy.
- Editable profile fields and account-management scope.
- Dashboard metric definitions.
- Recipe create/edit/delete and versioning policy were unresolved here and are superseded for Recipe Management V1 by CP-005. V1 uses owner-scoped mutable recipes that become immutable after session reference; no publication workflow or version history.
- Equipment status/condition vocabulary, allocation/release rules.
- Session transition matrix, idempotency/revision handling, incident and scoring rules.
- UI routing, styling framework, component library, and final visual tokens.

## Consequences
Update canonical `business-rules.md`, `database-design.md`, `api-contracts.md`, `ui-context.md`, and `feature-documentation-rules.md` to remove contradictions. Revise existing feature/task specs and add separate auth/profile/shell/dashboard specs and tasks. Do not rewrite existing AGENTS.md; amend it minimally after review.
