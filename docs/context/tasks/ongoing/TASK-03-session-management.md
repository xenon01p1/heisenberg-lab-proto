# TASK-03 — Session Management

**Status:** IN PROGRESS — browser verification pending
**Feature specification:** `../../features/03-session-management.md`
**Dependencies:** Authentication, TASK-01, and TASK-02
**Decision constraints:** CP-001, CP-002, CP-003, CP-005, CP-006, and approved CP-007 apply. Gameplay, incidents, scoring, reports, and future terminal outcomes remain deferred.

## Objective
Implement the approved Session Management V1 setup and lifecycle subset with readable code and clear boundaries.

## Before coding
- Read `AGENTS.md`, all relevant `docs/context/*.md`, checkpoints, and the feature specification.
- Inspect the actual repository; do not assume files or scripts exist.
- Resolve open questions in the feature specification with the owner; record decisions under `docs/context/checkpoints/`.
- Confirm the specific subset and acceptance criteria assigned to this task.

## Work breakdown
1. Agree on feature-specific business behavior and acceptance criteria.
2. Implement minimal Drizzle/PostgreSQL schema or migration changes if needed.
3. Implement shared Zod contracts and Hono endpoints if approved.
4. Every feature must include its backend implementation, database changes where necessary, and a functional React frontend. A task is not considered complete until users can interact with the feature through the web interface.
5. Add relevant tests using an owner-approved test framework.
6. Run available verification commands; document actual outcomes.
7. Update the feature's implementation section; move this task to `tasks/done/` only when complete; add dated `docs/context/update/` entry.

## Acceptance criteria
- [ ] Approved feature acceptance criteria are satisfied.
- [ ] No invented business behavior or unapproved architectural changes.
- [ ] Relevant validation, error handling, and database constraints are covered.
- [ ] Tests and type checks were run where available, or limitations reported.
- [ ] Implementation and documentation match; no unverified success claims.

## Completion report
- **Changed files:** Pending
- **Tests executed/results:** Pending
- **Behavior delivered:** Pending
- **Known limitations:** Pending
- **Update record:** Pending

> This is a planning task, not authorization to implement the entire feature or make undecided design choices.

## Implementation Progress

**Status:** IN PROGRESS

### Completed

- Read `AGENTS.md`, CP-002, CP-003, the session feature and task, business rules, API contracts, database design, and current repository structure.
- Confirmed Authentication, Application Shell, Profile, Recipe Management, and Equipment Management implementation paths.
- Confirmed the database currently has no `operators`, `sessions`, or `session_events` tables.
- Recorded owner approval in CP-007 and reconciled the canonical documentation.
- Added additive Drizzle schema for seeded operators, user-owned sessions, and append-only lifecycle events with status constraints, ownership indexes, revision uniqueness, and optional equipment references.
- Generated and applied `packages/db/drizzle/0004_huge_jack_murdock.sql` without resetting or dropping existing data.
- Added shared Zod contracts for operators, session setup, lifecycle actions, sessions, and events.
- Added authenticated Hono operator/session list, create, detail, event, and approved lifecycle routes with owner checks, validation, atomic transitions, and revision conflicts.
- Added responsive React session setup/list/detail UI inside the existing Application Shell with lifecycle actions, event history, loading, error, empty, and expired-session states.
- Updated Recipe Management to block recipe updates/deletion after session reference.
- Added backend lifecycle/ownership/revision tests and frontend contract tests.

### In Progress

- Completing production build, browser availability check, and final documentation review.

### Remaining

- Run type checks, tests, production build, migration verification, and browser integration.
- Move to `done/` only after every acceptance criterion is verified.

### Last Verification

- TypeScript: Passed after implementation.
- Tests: Full suite passed: 26 tests, 127 expectations, 0 failures.
- Build: Production build passed.
- Database migration: Generated and applied successfully; additive only.
- Manual browser verification: Pending; shared page currently returns `chrome-error://chromewebdata/`.

### Files Changed

- `docs/context/features/03-session-management.md`
- `docs/context/tasks/ongoing/TASK-03-session-management.md`
- `docs/context/checkpoints/CP-007-session-management-v1.md`
- `packages/db/src/schema.ts`
- `packages/db/drizzle/0004_huge_jack_murdock.sql`
- `packages/contracts/src/index.ts`
- `src/api/src/sessions.ts`
- `src/api/src/sessions.test.ts`
- `src/api/src/index.ts`
- `src/web/src/sessions.ts`
- `src/web/src/sessions.test.ts`
- `src/web/src/App.tsx`
- `src/web/src/styles.css`

### Known Issues

- Gameplay, incidents, scoring, reports, and future terminal outcomes remain deferred by CP-007.
- Browser integration remains unverified until the shared page/server is reachable.

### Resume Instructions

- Continue with the additive session schema and do not reset, drop, or recreate existing tables.
- Preserve all existing Authentication, Shell, Profile, Dashboard, Recipe, and Equipment implementation and data.
- Manually verify on Fedora: create a session from an owned recipe/operator/optional equipment, run prepare/start/pause/resume/abort, confirm revision/event history, and verify another account cannot access it.
