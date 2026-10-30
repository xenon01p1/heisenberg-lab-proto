# Feature: Dashboard
**Status:** Implementation complete; real user-owned sessions, completed sessions, and recent activity connected.

## Overview
Authenticated home screen with a summary of the user's persisted simulation activity.
## Goals
Provide a useful landing page and navigation to relevant features.
## Scope
In: authenticated dashboard inside the Application Shell, real user-owned equipment count, real user-owned recipe count, real user-owned session count, real user-owned completed session count, real recent activity from user-owned session events with recipe context and timestamps, quick navigation, and loading/error/empty/session handling. Out: fabricated statistics, charts, external analytics, and new domain tables created solely for dashboard metrics.
## User workflow
Log in -> see dashboard -> inspect summary metrics and recent activity -> navigate to sessions/recipes/equipment.
## Business rules
- Metrics are derived from actual persisted records and filtered to the authenticated user.
- Equipment count reflects the authenticated user's owned equipment inventory.
- Recipe count reflects the authenticated user's owned recipes.
- Session count reflects the authenticated user's total simulation sessions.
- Completed session count reflects the authenticated user's sessions in COMPLETED status.
- Recent activity reflects up to 8 of the authenticated user's latest session events (newest first) with human-readable labels and timestamps.
- When metrics or events are empty (count 0 or no events), an informative empty state is displayed rather than treating it as an error or unavailable.
- If any metric is explicitly unsupported, it reports `available: false` and `count: null` without fabricating fake data.
- A missing, expired, or revoked session cannot retrieve dashboard data.
## Functional specifications
- **DASH-001:** Fetch the authenticated dashboard summary through `GET /api/dashboard/summary`.
- **DASH-002:** Display the real user-owned equipment catalog count from PostgreSQL.
- **DASH-003:** Display real user-owned recipe count, total session count, and completed session count.
- **DASH-004:** Display real user-owned recent activity events with recipe context and formatted timestamps.
- **DASH-005:** Provide quick navigation to Recipes, Equipment, and Sessions in the existing shell.
- **DASH-006:** Handle empty states, loading, API errors, malformed responses, expired sessions, and unauthenticated access.
- **DASH-007:** Never display fake statistics or hardcoded recent activity.
## Technical touchpoints
React dashboard in `src/web`, authenticated Hono `GET /api/dashboard/summary`, shared Zod dashboard summary contract in `packages/contracts`, and Drizzle queries against `equipment`, `recipes`, `sessions`, and `session_events` scoped by `userId`.
## Acceptance criteria
- [x] Authenticated users see Dashboard within the existing shell.
- [x] Equipment count matches the user's owned inventory.
- [x] Recipe count matches the user's owned recipes.
- [x] Session count matches the user's owned sessions.
- [x] Completed session count matches the user's owned sessions with COMPLETED status.
- [x] Recent activity accurately displays the user's latest session lifecycle and turn events.
- [x] Empty states are displayed gracefully when metrics are 0 or no activity has been recorded.
- [x] Quick navigation reaches Recipes, Equipment, and Sessions.
- [x] Unauthenticated, expired, and revoked sessions cannot retrieve dashboard data.
- [x] Loading, API error, malformed response, and retry states are controlled and accessible.
- [x] Responsive styling is consistent with the shell and Profile.
- [x] Focused backend/data and frontend presentation tests pass.
- [x] TypeScript and production build pass.
- [x] No unrelated schema, migration, dependency, Authentication, or Profile behavior changes.
## Expected outputs
Functional dashboard with real user-owned simulation activity.
## Implementation status
Implementation complete. Dashboard V1 reports real user-owned equipment, recipes, sessions, completed sessions, and recent session events.

## Achievements
- Connected `GET /api/dashboard/summary` to real user-owned sessions, completed sessions, and recent activity events.
- Formatted recent activity items with recipe title context, action/status indicators, and timestamps.
- Handled empty states gracefully for both zero-count metrics and empty activity logs.
- Added comprehensive backend tests covering unauthenticated access, empty new user states, and real simulation progression with user isolation.
- Added frontend presentation tests covering available zero/non-zero values, unavailable metrics, activity existence, and timestamp formatting.

## Verification
- TypeScript check passed (`turbo run typecheck` across all 4 packages).
- 32 focused tests passed with 170 expectations across all workspace tests.
- Production build passed (`turbo run build`).
- User isolation verified: users cannot see another user's session counts or activity.

## Open questions
None for Dashboard V1. All metrics and recent activity are backed by real database records.
