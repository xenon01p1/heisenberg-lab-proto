# TASK-02 — Equipment Management

**Status:** IN PROGRESS — browser verification pending
**Feature specification:** `../../features/02-equipment-management.md`
**Dependencies:** TASK-01 (recipe browsing is not a runtime dependency, but implement foundation first)
**Decision constraints:** CP-001, CP-002, CP-003, and approved Equipment Management V1 checkpoint CP-006. Reservation, release, occupancy, and session lifecycle integration remain deferred.

## Objective
Implement authenticated owner-scoped equipment inventory CRUD with readable code and clear boundaries.

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
- [ ] Equipment has persisted name, type, condition, and availability fields.
- [ ] CRUD is owner-scoped and authorized through the verified account session.
- [ ] React inventory UI is integrated into the existing Application Shell.
- [ ] Reservation/release behavior is not implemented.
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

- Read the approved project instructions and relevant equipment documentation.
- Verified the existing equipment table has zero rows, allowing an additive ownership/field migration without fabricated backfill values.
- Recorded the owner-approved inventory policy in CP-006 and reconciled the feature, business rules, database design, and API contracts.
- Added additive Drizzle equipment ownership, type, condition, and availability fields while preserving the existing integer IDs.
- Generated and applied `packages/db/drizzle/0003_dizzy_jack_flag.sql` after verifying the existing table was empty.
- Added shared Zod equipment contracts and authenticated owner-scoped Hono CRUD endpoints.
- Added responsive React equipment inventory CRUD UI inside the existing Application Shell.
- Added focused backend ownership/validation/CRUD tests and frontend response-contract tests.

### In Progress

- Completing full verification and final implementation review.

### Remaining

- Run typecheck, tests, build, and browser verification.
- Move to `done/` only after all acceptance criteria are verified.

### Last Verification

- TypeScript: Passed after implementation.
- Tests: Full Bun suite passed: 22 tests, 87 expectations, 0 failures.
- Build: Production build passed.
- Database migration: Generated and applied successfully; additive only.
- Manual browser verification: Pending; shared page currently returns `chrome-error://chromewebdata/`.

### Files Changed

- `docs/context/checkpoints/CP-006-equipment-management-v1.md`
- `packages/db/src/schema.ts`
- `packages/db/drizzle/0003_dizzy_jack_flag.sql`
- `packages/contracts/src/index.ts`
- `src/api/src/equipment.ts`
- `src/api/src/equipment.test.ts`
- `src/api/src/index.ts`
- `src/web/src/equipment.ts`
- `src/web/src/equipment.test.ts`
- `src/web/src/App.tsx`
- `src/web/src/styles.css`
- Relevant canonical documentation and update log.

### Known Issues

- Session reservation, release, and occupancy behavior is intentionally deferred.
- Browser integration could not be verified in this environment.

### Resume Instructions

- Continue with the additive equipment schema and do not reset, drop, or recreate existing tables.
- Preserve authentication, shell, profile, dashboard, and recipe functionality.
- Manually verify on Fedora: log in, open Equipment, create an item with name/type/condition/availability, edit it, reload to confirm PostgreSQL persistence, delete it, and confirm another account cannot read or mutate it.
