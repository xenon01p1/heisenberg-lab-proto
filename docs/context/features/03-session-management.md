# Feature: Session Management

**Status:** Approved for V1 implementation under CP-007, extended by approved CP-008 Simulation Engine
**Owner approval:** Approved 2026-10-30
**Related checkpoints:** CP-001 (PostgreSQL), CP-002 (turn-based V1), CP-003 (full-stack V1 scope), CP-007 (Session Management V1), CP-008 (Simulation Engine V1)
**Related task:** `../tasks/ongoing/TASK-03-session-management.md`
**Related updates:** `../update/2026-10-30-session-management.md`

## 1. Overview
Create and track fictional cooking sessions, associating a recipe and equipment with a lifecycle managed through explicit user actions.

## 2. Goals
- Give users one place to manage a session from draft through a terminal outcome.
- Make transitions explicit, validated, and traceable.
- Provide a stable foundation for a later turn-based simulation engine.

## 3. Scope
**In scope**
- Create a user-owned DRAFT session with an owned recipe, seeded operator, and optional owned equipment.
- List and inspect sessions.
- Prepare, start, pause, resume, and abort only where CP-007 transition rules permit.
- Record one append-only lifecycle event per successful mutation transactionally.

**Out of scope**
- Automatic timers and background progression (prohibited in V1 by CP-002).
- Quality scoring, incident generation, and reporting remain separate features. Turn advancement is supplied by the approved Simulation Engine feature.
- Authentication is a dependency, not an out-of-scope assumption; authorization uses the authenticated account, while operators remain fictional game personas.

## 4. User workflow
1. User creates a draft session and selects an owned recipe, seeded operator, and optional equipment.
2. User reviews session details and starts it when prerequisites are satisfied.
3. User can pause, resume, or abort subject to approved transition rules.
4. The Simulation Engine advances stages through explicit actions while preserving session ownership and lifecycle rules.

## 5. Business rules and edge cases
- CP-002: simulation is turn-based; nothing advances automatically.
- Reject invalid state transitions with a clear domain error.
- Changes to session state and event history must be atomic.
- Concurrent requests must not bypass approved transition or equipment-allocation checks.
- Equipment is referenced but not reserved or released in V1. Lifecycle and turn requests require `expectedRevision`; stale or repeated commands are rejected atomically.

## 6. Functional specifications
- FR-001: Create and retrieve only authenticated-user-owned sessions with validated owned recipe, operator, and optional equipment references.
- FR-002: Expose session status and linked recipe/equipment.
- FR-003: Enforce approved state transitions on the server.
- FR-004: Record successful transitions in an append-only session event history.
- FR-005: Return predictable errors for invalid transitions, stale revisions, invalid references, and inaccessible sessions.
- FR-006: Preserve fixed recipe/operator/equipment references while the Simulation Engine records progress and terminal outcomes.

## 7. Technical touchpoints
- React: session list, create form, detail page, and action buttons.
- Hono: authenticated session setup/read, event, lifecycle, progress, and advance routes.
- Zod: create-session, lifecycle, progress, advance, and turn-event contracts.
- Drizzle/PostgreSQL: `sessions`, `session_steps`, and `session_events`; transactions and concurrency protections.
- Dependencies: Recipe Management and Equipment Management.

**Approved stack:** Bun runtime/package manager, Hono, Turborepo, Docker, React, Drizzle/Drizzle Kit, PostgreSQL, Zod contracts. Do not add frameworks without approval.

## 8. Acceptance criteria
- [ ] Session creation validates owned recipe, valid seeded operator, and optional owned equipment.
- [ ] Approved transitions and abort behavior are enforced server-side.
- [ ] An invalid or stale transition does not alter database state.
- [ ] A successful transition records one coherent state change and event.
- [ ] No equipment reservation/release, scoring, incidents, retries, or reports are implemented. Gameplay is supplied only by approved Simulation Engine V1.
- [ ] No session advances on a timer or page refresh.
- [ ] Browser integration is verified.

## 9. Expected outputs
- Session list/detail screens and persisted session records.
- Lifecycle actions with clear errors and append-only event records.

## 10. Implementation and achievements
- **Implemented:** Backend, database, shared contracts, frontend, lifecycle tests, and documentation implemented under CP-007.
- **Verification:** TypeScript, full Bun test suite, production build, and additive PostgreSQL migration verification passed. Browser verification is pending because the shared browser page is unavailable in the current environment.
- **Actual outputs:** Owner-scoped pre-gameplay session setup, lifecycle transitions, revision conflicts, and append-only events.
- **Updates:** See `../update/2026-10-30-session-management.md`.

## 11. Open questions
- Future incidents, scoring, quality reports, and gameplay beyond CP-008 require separate approval.
