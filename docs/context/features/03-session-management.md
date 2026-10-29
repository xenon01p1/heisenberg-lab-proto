# Feature: Session Management

**Status:** Proposed specification — not authorization to implement
**Owner approval:** Pending review
**Related checkpoints:** CP-001 (PostgreSQL), CP-002 (turn-based V1)
**Related task:** `../tasks/ongoing/TASK-03-session-management.md`
**Related updates:** None

## 1. Overview
Create and track fictional cooking sessions, associating a recipe and equipment with a lifecycle managed through explicit user actions.

## 2. Goals
- Give users one place to manage a session from draft through a terminal outcome.
- Make transitions explicit, validated, and traceable.
- Provide a stable foundation for a later turn-based simulation engine.

## 3. Scope
**In scope**
- Create a session with a fictional recipe and selected equipment.
- List and inspect sessions.
- Start, pause, resume, and abort only where approved transition rules permit.
- Record session lifecycle events transactionally.

**Out of scope**
- Automatic timers and background progression (prohibited in V1 by CP-002).
- Quality scoring, incident generation, and full step-advancement engine (separate features).
- Authentication/roles until separately decided.

## 4. User workflow
1. User creates a draft session and selects a recipe/equipment.
2. User reviews session details and starts it when prerequisites are satisfied.
3. User can pause, resume, or abort subject to approved transition rules.
4. Future Simulation Engine advances stages through explicit actions.

## 5. Business rules and edge cases
- CP-002: simulation is turn-based; nothing advances automatically.
- Reject invalid state transitions with a clear domain error.
- Changes to session state and event history must be atomic.
- Concurrent requests must not bypass transition or equipment-allocation checks.
- Exact state graph and equipment release semantics require a checkpoint before implementing those transitions.

## 6. Functional specifications
- FR-001: Create and retrieve sessions with validated references.
- FR-002: Expose session status and linked recipe/equipment.
- FR-003: Enforce approved state transitions on the server.
- FR-004: Record successful transitions in an append-only session event history.
- FR-005: Return predictable errors for invalid transitions and allocation conflicts.

## 7. Technical touchpoints
- React: session list, create form, detail page, and action buttons.
- Hono: session CRUD/read and lifecycle action routes proposed; finalize in api-contracts.md.
- Zod: create-session and action contracts.
- Drizzle/PostgreSQL: `sessions`, `session_events` proposed; transactions and concurrency protections.
- Dependencies: Recipe Management and Equipment Management.

**Approved stack:** Bun runtime/package manager, Hono, Turborepo, Docker, React, Drizzle/Drizzle Kit, PostgreSQL, Zod contracts. Do not add frameworks without approval.

## 8. Acceptance criteria
- [ ] Session creation validates referenced recipe/equipment.
- [ ] An invalid transition does not alter database state.
- [ ] A successful transition records one coherent state change and event.
- [ ] Two concurrent starts cannot allocate the same equipment.
- [ ] No session advances on a timer or page refresh.

## 9. Expected outputs
- Session list/detail screens and persisted session records.
- Lifecycle actions with clear errors and append-only event records.

## 10. Implementation and achievements
- **Implemented:** Not started.
- **Verification:** Not run.
- **Actual outputs:** None yet.
- **Updates:** Add a dated entry to `../update/` only after implementation.

## 11. Open questions
- Approve the exact state transition matrix before implementing actions.
- When does equipment become reserved and released?
- Are operators/users required for V1?
- How should repeated requests be handled?
