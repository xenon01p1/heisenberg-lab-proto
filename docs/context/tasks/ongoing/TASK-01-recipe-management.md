# TASK-01 — Recipe Management

**Status:** IN PROGRESS
**Feature specification:** `../../features/01-recipe-management.md`
**Dependencies:** None
**Decision constraints:** CP-001, CP-002, CP-003, and approved Recipe Management V1 checkpoint CP-005. Session reference enforcement remains a dependency of Session Management and no speculative session table will be added here.

## Objective
Implement the approved V1 recipe-management subset with readable code and clear boundaries.

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
- [ ] Owner-approved recipe ownership, visibility, CRUD, step, publication, versioning, and deletion rules are documented.
- [ ] Owner-approved database columns, constraints, foreign keys, and migration behavior are documented.
- [ ] Approved feature acceptance criteria are satisfied.
- [ ] No invented business behavior or unapproved architectural changes.
- [ ] Relevant validation, error handling, and database constraints are covered.
- [ ] Backend and frontend tests, type checks, and production build are verified.
- [ ] Implementation and documentation match; no unverified success claims.

## Implementation Progress

**Status:** IN PROGRESS

### Completed

- Read `AGENTS.md`, CP-003, the recipe feature specification, task, business rules, API contracts, database design, and repository structure.
- Confirmed the existing database contains users, authentication sessions, and equipment only; no recipe tables or applied recipe migration exist.
- Confirmed the existing application has no recipe API, schema, contracts, or frontend implementation.
- Recorded owner approval in CP-005 and reconciled the canonical recipe documentation.
- Added additive Drizzle schema for owner-scoped `recipes` and ordered `recipe_steps` with foreign keys and uniqueness constraints.
- Generated and applied `packages/db/drizzle/0002_clever_tattoo.sql` without modifying existing tables or data.
- Added shared Zod recipe input and response contracts.
- Added authenticated owner-scoped Hono list/create/read/update/delete endpoints.
- Added responsive React recipe list/editor UI inside the existing Application Shell with loading, validation, error, logout/session-expiry, empty, and delete-confirmation states.
- Added focused backend ownership/validation/CRUD tests and frontend response-validation tests.

### In Progress

- Completing repository-wide verification and final implementation review.

### Remaining

- Run full relevant tests, production build, and final diff review.
- Complete browser verification if the shared browser/server environment is available.
- Update feature and implementation logs with actual verification results.
- Keep this task in `ongoing/` until browser integration and all acceptance criteria are verified.

### Last Verification

- TypeScript: Full workspace typecheck passed after implementation and dashboard consistency update.
- Tests: Full Bun suite passed: 17 tests, 64 expectations, 0 failures.
- Build: Production build passed.
- Database migration: Generated and applied successfully; additive `recipes`/`recipe_steps` migration.
- Manual browser verification: Pending; shared page currently returns `chrome-error://chromewebdata/`.

### Files Changed

- `docs/context/checkpoints/CP-005-recipe-management-v1.md`
- `docs/context/features/01-recipe-management.md`
- `docs/context/tasks/ongoing/TASK-01-recipe-management.md`

### Known Issues

- Session Management still must add session references and enforce recipe immutability after reference.
- Browser integration could not be verified in this environment because the shared localhost page is unavailable.

### Resume Instructions

- Continue from the current implementation milestone; do not recreate or overwrite the existing authentication, shell, profile, dashboard, or equipment work.
- Start manual verification from the local Fedora environment: register/log in, open Recipes, create a title with two ordered steps, edit the title/steps, reload to confirm PostgreSQL persistence, and delete the recipe. Confirm another account cannot read or mutate the first account's recipe.

## Completion report
- **Changed files:** Pending implementation.
- **Tests executed/results:** Pending.
- **Behavior delivered:** Pending.
- **Known limitations:** Session-reference immutability enforcement belongs to Session Management until session tables exist.
- **Update record:** Pending.

> This is a planning task, not authorization to implement the entire feature or make undecided design choices.
