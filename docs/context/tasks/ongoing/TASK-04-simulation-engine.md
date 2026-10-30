# TASK-04 — Implement Turn-Based Simulation Engine V1

**Status:** IN PROGRESS — CP-008 approved; implementation underway.
**Feature:** `docs/context/features/04-simulation-engine.md`
**Parent dependency:** Completed Session Management V1 (CP-007).
**Scope:** Engine, progress persistence, API, React integration, tests; no scoring/reports/incidents.

## 1. Objective
Implement the approved fictional, manual, turn-based engine in the existing Bun + Hono + React + PostgreSQL + Drizzle + Zod monorepo. One accepted action resolves one turn; the final successful step automatically marks a session `COMPLETED`; failed outcomes mark it `FAILED`.

## 2. Pre-implementation gate
1. Read `AGENTS.md`, approved checkpoints, existing feature/task docs, current schema, and actual Session Management code.
2. Review `04-simulation-engine.md` with the owner. CP-008 is approved; preserve its policy and historical record before writing schema migrations or engine code.
3. Reconcile API contracts, business rules, database design, testing strategy, and Session Management docs with CP-008. Preserve historical checkpoints.
4. Inspect the actual database/migration history and existing data. Do not assume documentation describes the current schema perfectly.
5. If a genuine conflict remains, identify the smallest decision required. Do not silently invent gameplay rules.

## 3. Implementation milestones
### A. Persistence
- [x] Add compatible `COMPLETED` and `FAILED` session statuses.
- [x] Add ordered, unique `session_steps` progress records with appropriate constraints/indexes.
- [x] Extend event persistence for typed turn outcomes while preserving lifecycle events.
- [x] Generate and inspect additive Drizzle migration `0005_modern_smasher`, including safe handling of existing `RUNNING`/`PAUSED` sessions.
- [x] Apply and verify the additive migration without resetting or dropping data.

### B. Domain logic and API
- [x] Implement three approved abstract actions and server-side random outcome calculation.
- [x] Apply approved equipment modifier without reserving or changing inventory.
- [x] Implement atomic next-step advancement, revision checks, and one append-only event per accepted turn.
- [x] Implement automatic `COMPLETED` after final successful step and terminal `FAILED` on unsuccessful turn.
- [x] Implement authenticated, owner-scoped `GET /api/sessions/:id/progress` and `POST /api/sessions/:id/advance`.
- [x] Add shared Zod contracts, error mapping, and Origin validation.
- [x] Ensure existing prepare/start/pause/resume/abort and recipe immutability remain correct.

### C. React integration
- [x] Add step progress and current fictional step to existing Session detail view.
- [x] Add three action controls with pending/double-submit protection.
- [x] Render authoritative turn results, event history, and completion/failure states.
- [x] Handle refresh, network errors, stale revision, unauthenticated access, and malformed responses.
- [x] Keep responsive/accessibility conventions and minimal styling; no unrelated redesign.

### D. Verification and documentation
- [x] Unit/integration tests for controlled outcomes, success/failure, preserved failed steps, terminal state, ownership, and revision behavior.
- [x] Frontend contract tests for engine statuses and authoritative progress/outcomes.
- [x] TypeScript checks, Bun tests, production build, migration verification, `git diff --check`.
- [ ] Browser smoke test (or mark pending and provide exact manual steps).
- [ ] Update feature docs and add a dated implementation log.

## 4. Acceptance criteria
- An authenticated owner can view authoritative progress for their own session.
- A `RUNNING` session can accept exactly one abstract action per current revision.
- Accepted success completes exactly one next step and appends one event.
- Successful final step atomically transitions to `COMPLETED`.
- Accepted failure atomically transitions to `FAILED`, without completing the failed step.
- `PAUSED`, `DRAFT`, `READY`, `ABORTED`, `COMPLETED`, and `FAILED` cannot advance.
- Cross-account access is blocked; missing/invalid Origin is rejected for writes.
- Concurrent/stale commands cannot advance two steps from the same revision.
- Existing sessions, recipe references, events, and equipment inventory remain intact.
- The React session UI works with real Hono endpoints and handles edge cases.
- No real-world chemistry instructions, scoring, reports, incidents, or equipment reservations are introduced.
- Required automated checks pass and any unverified manual browser work is honestly reported.

## 5. Critical edge-case test matrix
| Scenario | Expected behavior |
|---|---|
| Valid action on RUNNING with next step | One accepted outcome, one revision increment, one event |
| Success on final step | `COMPLETED`, no Finish button |
| Failed outcome | `FAILED`, unfinished step retained |
| Duplicate/stale revision | `409 REVISION_CONFLICT`, no extra turn/event |
| Two concurrent requests, same revision | At most one succeeds |
| Paused or terminal session | `409 INVALID_STATE_TRANSITION` |
| Different user's session | `404 NOT_FOUND` |
| Missing/invalid Origin | Request rejected; no mutation |
| No equipment / unavailable / deleted equipment | Zero modifier, no equipment mutation |
| Existing session before migration | Safe initialization, no reset |
| Network timeout after possible success | Refresh server state; never blindly resubmit |
| Browser refresh | Correct persisted progress and event timeline |

## 6. Progress and interruption recovery
Update this section **after each meaningful milestone**. A new agent must inspect actual files and Git status, not trust the checklist alone.

**Status:** IN PROGRESS — CP-008 approved; implementation underway.

### Completed
- [x] Feature spec reviewed against the existing Session Management implementation.
- [x] Detailed CP-008 proposal prepared and approved by the owner.
- [x] Canonical documentation reconciled.
- [x] Additive persistence schema/migration, shared contracts, backend services/routes, frontend progress/actions, and focused tests implemented.

### In progress
- Browser verification remains pending for owner confirmation.

### Remaining
- Browser verification and final acceptance.

### Last verification
- TypeScript: PASSED — `docker run ... oven/bun:1.4.4 bun run typecheck`.
- Tests: PASSED — Docker Bun test suite, 28 tests and 136 expectations.
- Build: PASSED — `docker run ... oven/bun:1.4.4 bun run build`.
- Migration: PASSED — generated `0005_modern_smasher`, snapshot generated, `drizzle-kit check` passed, and migration applied successfully to local PostgreSQL.
- Browser: PENDING — intentionally left for owner verification.
- Diff check: PASSED with `git diff --check`.

### Files changed
- Added CP-008 approval/reconciliation; schema, migration, contracts, session service/API, frontend session progress, and focused tests.

### Known issues / decisions
- CP-008 policy is approved. Automated and migration verification passed; browser verification remains outstanding.
- Public-deployment authentication rate limiting remains a separate documented limitation.

### Resume instructions
1. Owner performs browser smoke verification against the running frontend/API.
2. Record the browser result and any evidence-backed fixes only.
3. Preserve `0005_modern_smasher` and the generated snapshot; do not recreate or overwrite prior migrations.
4. Move the task to `done/` only after browser acceptance is confirmed.

## 7. Completion rules
Keep this task in `docs/context/tasks/ongoing/` while incomplete. Move it to `docs/context/tasks/done/` only after acceptance criteria and required verification are satisfied. Record verified implementation in `docs/context/update/`; never report browser checks as passed without evidence. Do not commit or push without owner permission.
