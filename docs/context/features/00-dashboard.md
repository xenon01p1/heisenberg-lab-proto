# Feature: Dashboard
**Status:** Implementation complete; browser verification pending under TASK-00-dashboard.

## Overview
Authenticated home screen with a summary of the user's persisted simulation activity.
## Goals
Provide a useful landing page and navigation to relevant features.
## Scope
In: authenticated dashboard inside the Application Shell, real equipment catalog count where available, explicit unavailable states for recipe/session metrics whose tables do not exist yet, recent activity when persisted data supports it, quick navigation, and loading/error/session handling. Out: fabricated statistics, charts, external analytics, and new domain tables created solely for dashboard metrics.
## User workflow
Log in -> see dashboard -> inspect summary and navigate to sessions/recipes/equipment.
## Business rules
- Metrics are derived from actual persisted records and filtered to the authenticated user where applicable.
- The current database has only the global `equipment` catalog in addition to authentication tables; its count is a catalog total, not user-owned data.
- Recipe, session, completed-session, and recent-activity summaries are explicitly unavailable until their approved feature tables and queries exist.
- Unavailable metrics are not represented as zero and do not invent activity.
- A missing, expired, or revoked session cannot retrieve dashboard data.
## Functional specifications
- **DASH-001:** Fetch the authenticated dashboard summary through `GET /api/dashboard/summary`.
- **DASH-002:** Display the real global equipment catalog count from PostgreSQL.
- **DASH-003:** Display explicit unavailable states for recipes, sessions, completed sessions, and recent activity when their data is not supported.
- **DASH-004:** Provide quick navigation to Recipes, Equipment, and Sessions in the existing shell.
- **DASH-005:** Handle loading, API errors, malformed responses, expired sessions, and unauthenticated access.
- **DASH-006:** Never display fake statistics or hardcoded recent activity.
## Technical touchpoints
React dashboard in `src/web`, authenticated Hono `GET /api/dashboard/summary`, shared Zod dashboard summary contract in `packages/contracts`, and a Drizzle count query against the existing `equipment` table. No schema or migration changes are required.
## Acceptance criteria
- [ ] Authenticated users see Dashboard within the existing shell.
- [ ] Equipment count matches the existing PostgreSQL catalog.
- [ ] Recipe, session, completed-session, and recent-activity states accurately show unavailable data without fake zeroes or activity.
- [ ] Quick navigation reaches Recipes, Equipment, and Sessions placeholders.
- [ ] Unauthenticated, expired, and revoked sessions cannot retrieve dashboard data.
- [ ] Loading, API error, malformed response, and retry states are controlled and accessible.
- [ ] Responsive styling is consistent with the shell and Profile.
- [ ] Focused backend/data and frontend presentation tests pass.
- [ ] TypeScript and production build pass.
- [ ] No unrelated schema, migration, dependency, Authentication, or Profile behavior changes.
## Expected outputs
Functional dashboard.
## Implementation status
Implementation complete. Dashboard V1 reports only data supported by the current schema; browser verification remains pending.

## Achievements
- Added protected `GET /api/dashboard/summary` with a real equipment catalog count.
- Added explicit unavailable states for unsupported recipe/session/completed-session/activity metrics.
- Integrated Dashboard into the authenticated shell with quick navigation and controlled loading/error/session states.
- Added focused API and presentation tests without adding dependencies or schema.

## Verification
- TypeScript check passed.
- 12 focused tests passed with 40 expectations across authentication, profile, and dashboard coverage.
- Production build passed.
- Browser verification remains pending; the shared browser page is unavailable.

## Open questions
Future recipe/session metrics, recent-activity definition, and any user-specific equipment semantics depend on the corresponding approved feature schemas and rules.
