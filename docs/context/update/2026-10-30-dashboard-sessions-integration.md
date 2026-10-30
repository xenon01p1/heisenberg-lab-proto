# Dashboard Sessions & Activity Integration — 2026-10-30

Connected Dashboard's Sessions, Completed Sessions, and Recent Activity to real, user-owned PostgreSQL data.

- Connected `GET /api/dashboard/summary` to real user-owned simulation session counts, completed session counts, and recent lifecycle/turn events.
- Added recipe context join to format descriptive activity labels (`<recipeTitle> — <action> · <toStatus>`) and ISO timestamps for recent events.
- Updated shared Zod contracts in `packages/contracts` to export `dashboardActivityItemSchema`, `DashboardActivityItem`, and `DashboardActivity`.
- Updated Dashboard UI in `src/web` with real session and completed session metric cards, formatted activity timestamps, and clear empty states for both zero counts and empty activity logs.
- Added test coverage in `src/api/src/dashboard.test.ts` for unauthenticated summary access, empty new-user states, simulation progression to completion, and user data isolation.
- Added test coverage in `src/web/src/dashboard.test.ts` for available metrics (zero and non-zero counts), unavailable metrics, empty activity, and timestamp formatting.
- Preserved existing functionality, error handling, retry handling, and expired-session behavior.

Verification:

- `bun run typecheck` passed (`turbo run typecheck` across all 4 packages).
- `bun test` passed (32 tests, 170 expectations across 10 files).
- `bun run build` passed (`turbo run build`).
