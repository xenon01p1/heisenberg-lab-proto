# 04 — Turn-Based Simulation Engine V1

**Status:** Approved for V1 implementation under CP-008
**Scope:** Fictional, abstract turn-based gameplay for existing authenticated sessions.
**Dependencies:** CP-007 Session Management V1, approved recipe/equipment policies, existing Authentication and Application Shell.

## 1. Goal
Enable a player to advance an owned `RUNNING` session through its ordered fictional recipe steps, choosing one abstract action per turn. The server resolves an outcome influenced by the selected equipment and advances or fails the session. Completing the final step automatically transitions the session to `COMPLETED`.

## 2. Confirmed owner choices
- Turns advance only when the player explicitly submits an action; no timers, automatic turns, WebSockets, or background jobs.
- Turn outcomes include randomness and can succeed or fail.
- Players choose an action during each turn.
- Optional selected equipment influences outcomes.
- Completing the final recipe step automatically completes the session; no manual Finish action.

## 3. Existing rules to preserve
- Session owner is derived from the authenticated account; operator is a fictional persona, never an auth principal.
- Session recipe, operator, and optional equipment references are fixed at session creation.
- Referenced recipes and their ordered steps are immutable.
- Existing lifecycle actions (`prepare`, `start`, `pause`, `resume`, `abort`) and CP-007 semantics remain intact.
- `ABORTED`, `COMPLETED`, and `FAILED` are terminal; terminal sessions cannot advance, resume, or restart.
- Every mutation checks `expectedRevision` atomically and writes state plus exactly one append-only event in the same transaction.
- Equipment is *not* reserved, consumed, or released by this engine.
- Fictional steps and descriptions must remain abstract; no real chemistry, controlled-substance preparation, or real-world manufacturing guidance.

## 4. Approved V1 gameplay policy (CP-008)
### 4.1 Session step initialization
- On the first successful `start` of a `READY` session, initialize one session-step progress row per recipe step, in recipe order, in the same transaction as the existing start transition; alternatively use a separately documented, equally atomic initialization strategy that does not change CP-007 event semantics.
- Existing `RUNNING`/`PAUSED` sessions created before engine deployment must be supported by a safe, idempotent backfill or first-advance initialization. Never discard or reset them.
- Each session-step has `PENDING` or `COMPLETED` status and completion timestamp; failed turns are recorded in the event history rather than leaving an ambiguously completed step.
- Session progress is authoritative in the database, not calculated from client-submitted indexes.

### 4.2 Available player actions
Use three **abstract** actions, independent of step labels:

| Action key | UI label | Proposed base success probability |
|---|---|---:|
| `CAUTIOUS` | Careful approach | 85% |
| `BALANCED` | Balanced approach | 75% |
| `BOLD` | Bold approach | 65% |

These are **game probabilities only**, not representations of real processes. V1 has no action-specific quality, time, or resource score. The action choice affects success probability only.

### 4.3 Equipment modifier
- If no equipment is selected, apply a 0 percentage-point modifier.
- If selected equipment is still present and its inventory flag `available` is true, apply +5 percentage points; otherwise apply 0.
- Equipment condition is currently a free-text label; **do not infer numeric effects from arbitrary condition strings**. Condition-based balancing is deferred until a controlled condition vocabulary is approved.
- Clamp final probability to the inclusive range 5%–95%.
- Equipment is not reserved, decremented, or mutated. Deleted equipment (nullable session reference) has no bonus.
- Persist the action, equipment modifier, effective probability, and outcome in the turn event so the historical result is explainable even if equipment changes later.

### 4.4 Outcome and failure
- The server performs one unpredictable random draw per **accepted** turn command; clients cannot submit the draw, result, probability, step ID, or progress index.
- On **success**: mark exactly the next unfinished step `COMPLETED`, increment session revision by one, append exactly one `TURN_SUCCEEDED` event, and remain `RUNNING` unless this was the final step.
- On success of the **final** step: set session status `COMPLETED` in the same transaction; the `TURN_SUCCEEDED` event records `RUNNING -> COMPLETED` and final-step details. Do not append a second event at the same revision.
- On **failure**: transition immediately to terminal `FAILED`, increment revision by one, and append exactly one `TURN_FAILED` event. The unfinished step remains unfinished. No retry/restart mechanic in V1.
- `COMPLETED`, `FAILED`, and `ABORTED` cannot advance, pause, resume, or abort further.
- Scoring, incidents, performance grades, reports, and retry/replay mechanics are explicitly out of scope.

### 4.5 Conflict and retry safety
- Advance requires the latest `expectedRevision` (nonnegative integer).
- The backend performs owner/status/revision checks and state/event writes in a single transaction with row locking or a conditional revision update; two concurrent requests using the same revision cannot both resolve a turn.
- A stale or duplicate request returns `409 REVISION_CONFLICT`, with **no new random draw, step completion, event, or revision change**.
- A request with an invalid session state returns `409 INVALID_STATE_TRANSITION`; revision mismatch takes precedence.
- Transport-level exactly-once retries with a new revision are not guaranteed in V1; the UI must refresh server state after network uncertainty rather than blindly resubmit with an updated revision.

## 5. Proposed API contract additions
Use existing `{ "data": ... }` and `{ "error": { "code": "...", "message": "..." } }` envelopes, Zod contracts in `packages/contracts`, and existing authentication/Origin rules.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/sessions/:id/progress` | Owner-scoped ordered steps, current step, completed count, status, revision, and available actions |
| `POST` | `/api/sessions/:id/advance` | Resolve one action for the next unfinished step |

**Advance body:** `{ "expectedRevision": 4, "action": "BALANCED" }`.

**Advance response:** server-authoritative session `id`, `status`, `revision`, `completedSteps`, `totalSteps`, `nextStep` (nullable), and resolved turn outcome. Never expose internal random generator state. All progress/turn event reads are owner-scoped.

**Errors:** `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `404 NOT_FOUND` for missing or inaccessible session, `409 REVISION_CONFLICT`, `409 INVALID_STATE_TRANSITION`, and controlled `500 INTERNAL_ERROR`. Origin checks apply to `POST`.

**Events:** Extend existing append-only `session_events` with optional typed turn metadata (e.g., JSONB with a Zod-validated public shape). Preserve existing lifecycle events and `(session_id, revision)` uniqueness. Event list must return turn events in the same timeline.

## 6. Database design proposal
- Extend `sessions.status` check/enum to include `COMPLETED` and `FAILED` without dropping data.
- Add `session_steps`: UUID ID; `session_id` FK; `recipe_step_id` FK; one-based `step_order`; status (`PENDING`/`COMPLETED`); nullable `completed_at`; unique `(session_id, recipe_step_id)` and `(session_id, step_order)`; indexes for ordered reads.
- Extend `session_events` safely to capture typed turn details (action, step ID/order, probability, equipment modifier, outcome) without invalidating older rows.
- Keep `revision` on `sessions` as the sole optimistic concurrency authority.
- Preserve existing session/equipment references, recipes, lifecycle events, and all existing migration history. Only additive/compatible versioned Drizzle migrations are permitted.
- Inspect the actual schema before choosing exact column names/types and migration/backfill technique; this specification is a target contract, not proof that the repository already has these columns.

## 7. Frontend experience
Within the existing authenticated Application Shell and Session detail page:
- Display recipe title, fictional operator, equipment (if any), status, revision, step progress, and the current abstract step.
- Show three action buttons only for `RUNNING` sessions with unfinished steps.
- Show a concise description of the probabilities and any equipment bonus; do not imply real-world validity.
- Disable submission while pending and guard against double clicks.
- After every action, display the authoritative outcome, refresh progress/event history, and update the status.
- For `PAUSED`, explain that the player must resume first; for `DRAFT`/`READY`, direct them to existing lifecycle actions.
- For `COMPLETED`, show a completion summary and no Finish button; for `FAILED`/`ABORTED`, show a terminal-state explanation and no retry control.
- Handle network errors, malformed responses, stale revisions, expired login, unavailable backend, and direct navigation without fabricated progress.
- Keep responsive styling consistent with existing UI and accessible button/feedback semantics.

## 8. Edge cases and invariants
1. Recipe has at least one ordered step (already required by Recipe Management).
2. No turn before `RUNNING`; none while `PAUSED` or after terminal state.
3. Two simultaneous advances at the same revision produce at most one accepted turn.
4. Duplicate request at a stale revision does not skip a step.
5. Final successful turn completes the session atomically.
6. Failed turn leaves current step unfinished and marks session `FAILED`.
7. Equipment absent, unavailable, or deleted gives no bonus; equipment is never reserved or mutated.
8. Cross-user session IDs are inaccessible (`404`); no client-supplied owner identity.
9. Malformed action/revision and unapproved/missing Origin are rejected.
10. Existing sessions and lifecycle events survive migration.
11. Refresh restores authoritative progress; event ordering is stable.
12. Random outcome is testable by injecting/stubbing the random source, never by weakening production randomness.
13. No duplicate `(session_id, recipe_step_id)` records; no partially written turns.

## 9. Testing expectations
- Unit tests: action validation, probability/clamping, equipment modifier, next-step selection, final-step logic, and deterministic random injection.
- Integration tests: authentication, ownership, CSRF Origin, lifecycle compatibility, success/failure transactions, concurrent revision conflicts, event uniqueness, existing-session initialization, migration compatibility, and terminal-state rejections.
- Frontend tests: action enablement, loading, errors, stale revision refresh, completion/failure states, and response handling.
- Run repository TypeScript checks, Bun tests, production build, migration verification, and `git diff --check`.
- Record browser verification separately; do not claim it passed if tooling is unavailable.

## 10. Out of scope
Fictional quality scores, real-world process models, incidents and incident resolution, retry/restart, equipment reservation/consumption, timers, automated turns, multiplayer, WebSockets, reports, and analytics enhancements.

## 11. Approval and documentation reconciliation
The owner approved CP-008 on 2026-10-30, including action probabilities, equipment bonus, terminal failure, session-step persistence, API response fields, deterministic controlled randomness, and safe existing-session initialization. Canonical documents were reconciled without rewriting CP-007 history. Implementation remains incomplete until task acceptance criteria and browser verification are satisfied.
