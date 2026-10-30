# TASK — Dashboard
**Status:** In progress.
**Feature:** ../../features/00-dashboard.md
**Dependency:** Authentication first; shell/profile/dashboard after authentication (shell before dashboard).

## Objective
Implement Dashboard V1 inside the existing authenticated Application Shell using only real data supported by the current PostgreSQL schema.

## Before coding
Read AGENTS.md, CP-003, CP-004, UI context, API contracts, database design, Authentication/Profile/Shell documentation, the Dashboard feature specification, and the actual repository. Do not create recipe/session tables or infer unresolved metrics.

## Work breakdown
1. Define the dashboard summary contract with explicit available/unavailable states.
2. Implement the protected Hono summary endpoint using the existing `equipment` table only.
3. Add the shared Zod contract and focused dashboard API/data tests.
4. Implement the Dashboard view in the existing shell with real equipment count, unavailable states, quick navigation, and loading/error/session handling.
5. Add frontend-side dashboard presentation tests where the existing test setup supports them.
6. Run relevant tests, TypeScript checks, production build, and bounded browser verification; update progress after each milestone.

## Acceptance criteria
- [ ] Dashboard renders inside the authenticated shell.
- [ ] Protected `GET /api/dashboard/summary` returns a real equipment catalog count.
- [ ] Recipe, session, completed-session, and recent-activity fields explicitly report unavailable data where unsupported.
- [ ] No fake statistics, hardcoded activity, or dashboard-only domain tables are added.
- [ ] Quick navigation to Recipes, Equipment, and Sessions works.
- [ ] Loading, API errors, malformed responses, expired sessions, and unauthenticated access are handled.
- [ ] Focused dashboard data and presentation tests pass.
- [ ] TypeScript and production build pass.
- [ ] Authentication, Profile, Shell, migrations, and unrelated features remain intact.
- [ ] Browser verification is recorded before moving this task to `done/`.

## Testing requirements
- Test unauthenticated dashboard access returns the approved `UNAUTHENTICATED` response.
- Test authenticated summary shape and equipment count against PostgreSQL data.
- Test explicit unavailable states and empty equipment count behavior.
- Test frontend summary presentation does not convert unavailable metrics into fake zeroes.
- Run repository TypeScript checks and production build.
- Verify Dashboard, quick navigation, loading/error/retry, and expired-session behavior in the local browser if available.

## Implementation Progress

**Status:** IN PROGRESS

### Completed

- Read the governing instructions, approved checkpoints, Dashboard documentation, API contracts, database design, and current implementation.
- Confirmed the current database has only the existing global `equipment` catalog plus authentication tables; recipes and sessions are not available for dashboard aggregation.
- Updated the Dashboard feature/task specifications with explicit supported and unavailable metric behavior.
- Finalized the owner-confirmed Profile task without changing its functionality.
- Added the shared dashboard summary Zod contract with explicit available/unavailable metric states.
- Added protected `GET /dashboard/summary` backed by a real PostgreSQL count of the existing equipment catalog.
- Added focused dashboard API tests for unauthenticated access, real equipment count, and unavailable metrics.
- Integrated Dashboard into the existing shell with metric cards, unavailable activity state, quick navigation, loading/error/retry handling, and expired-session handling.
- Added frontend dashboard presentation helpers/tests and responsive dashboard styling without new dependencies.

### In Progress

- Browser verification of Dashboard inside the authenticated shell.

### Remaining

- Perform and record browser verification for real equipment count, unavailable states, quick navigation, loading/error/retry, and expired-session behavior.
- Update the feature completion record and move this task to `done/` only after all criteria pass.

### Last Verification

- TypeScript: Passed with the repository's Bun 1.4.4 container; all four workspace typecheck tasks passed.
- Tests: Passed with Bun Test; 12 tests passed with 40 expectations across authentication, profile, and dashboard tests.
- Build: Passed with the repository's Bun 1.4.4 container; the web production build completed successfully through Turbo.
- Browser: Not completed; the shared page resolves to `chrome-error://chromewebdata/`.
- Database/migrations: No schema changes planned or run.

### Files Changed

- `docs/context/features/00-dashboard.md`
- `docs/context/tasks/ongoing/TASK-00-dashboard.md`
- `packages/contracts/src/index.ts`
- `src/api/src/index.ts`
- `src/api/src/dashboard.ts`
- `src/api/src/dashboard.test.ts`
- `src/web/src/App.tsx`
- `src/web/src/dashboard.ts`
- `src/web/src/dashboard.test.ts`
- `src/web/src/styles.css`

### Known Issues

- Recipe/session/completed-session/recent-activity data is unavailable until their feature schemas and rules are implemented.
- Browser verification is pending in a reachable local browser.

### Resume Instructions

- Continue using the existing shell, Authentication, Profile, contracts, and database schema; do not create unrelated tables or migrations.
- Keep unavailable metrics explicit and never substitute fake zeroes or activity.
- Update this section after each meaningful milestone and leave the task in `ongoing/` until browser verification is recorded.
