# Feature: Dashboard
**Status:** Proposed.

## Overview
Authenticated home screen with a summary of the user's persisted simulation activity.
## Goals
Provide a useful landing page and navigation to relevant features.
## Scope
In: welcome/account summary, links to implemented features, user-scoped metrics once approved. Out: fabricated statistics, charts or external analytics without approval.
## User workflow
Log in -> see dashboard -> inspect summary and navigate to sessions/recipes/equipment.
## Business rules
Metrics are derived from actual persisted records and filtered to authenticated user where applicable. Empty data shows zero/empty states, not fabricated demo activity.
## Functional specifications
- DASH-001 Authenticated landing page.
- DASH-002 Show approved persisted summary metrics.
- DASH-003 Show recent activity only if the query and definition are approved.
- DASH-004 Responsive loading, empty, and error states.
## Technical touchpoints
React dashboard, Hono proposed `/api/dashboard/summary`, Zod summary contract, Drizzle aggregation queries.
## Acceptance criteria
No fake statistics; unauthorized access denied; totals match persisted data; UI handles empty account.
## Expected outputs
Functional dashboard.
## Implementation status
Not started.
## Open questions
Which metrics (active/completed sessions, available equipment, recent sessions)? Time period? Global vs user-specific equipment counts?
