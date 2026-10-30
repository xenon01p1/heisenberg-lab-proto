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
- Confirmed that recipes, equipment, sessions, and session event tables exist and are user-owned under CP-005, CP-006, CP-007, and CP-008.
- Updated the dashboard summary backend query in `src/api/src/dashboard.ts` to compute real user-scoped counts for equipment, recipes, sessions, completed sessions, and recent session events.
- Joined recent activity with recipes to display contextual labels (`<recipeTitle> — <action> · <toStatus>`) and ISO timestamps for up to 8 recent user-owned events.
- Updated shared contracts in `packages/contracts/src/index.ts` to export `dashboardActivityItemSchema`, `DashboardActivityItem`, and `DashboardActivity`.
- Updated `src/web/src/dashboard.ts` to format activity timestamps (`formatActivityTime`) and detect available activity.
- Updated `src/web/src/App.tsx` DashboardView to render real user-owned session and completed session metrics, formatted recent activity, and clear empty states for metrics and activity history.
- Added styling for `.activity-time` in `src/web/src/styles.css`.
- Expanded `src/web/src/dashboard.test.ts` to verify available zero/non-zero metrics, empty activity, and timestamp formatting.
- Expanded `src/api/src/dashboard.test.ts` to verify unauthenticated access, empty new-user states, real simulation progression to completion, and strict user isolation.
- Verified proper cleanup of test entities in `afterAll` respecting foreign key constraints.

### In Progress

- Browser verification of Dashboard inside the authenticated shell.

### Remaining

- Perform and record browser verification for real equipment count, recipe count, sessions, completed sessions, recent activity, empty states, quick navigation, loading/error/retry, and expired-session behavior.
- Update the feature completion record and move this task to `done/` only after all criteria pass.

### Last Verification

- TypeScript: Passed with `bun run typecheck` (`turbo run typecheck` across all 4 packages).
- Tests: Passed with Bun Test; 32 tests passed with 170 expectations across all test files.
- Build: Passed with `bun run build` (`turbo run build`).
- Database/migrations: Existing schema preserved; no new migrations needed.

### Files Changed

- `docs/context/api-contracts.md`
- `docs/context/features/00-dashboard.md`
- `docs/context/tasks/ongoing/TASK-00-dashboard.md`
- `packages/contracts/src/index.ts`
- `src/api/src/dashboard.ts`
- `src/api/src/dashboard.test.ts`
- `src/web/src/App.tsx`
- `src/web/src/dashboard.ts`
- `src/web/src/dashboard.test.ts`
- `src/web/src/styles.css`

### Known Issues

- Browser verification is pending in a reachable local browser.

### Resume Instructions

- Continue using the existing shell, Authentication, Profile, contracts, and database schema; do not create unrelated tables or migrations.
- Maintain strict user isolation across all dashboard aggregation queries.
- Update this section after each meaningful milestone and leave the task in `ongoing/` until browser verification is recorded.
