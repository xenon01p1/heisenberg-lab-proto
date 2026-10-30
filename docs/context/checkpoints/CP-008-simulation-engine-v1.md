# CP-008 — Simulation Engine V1

**Status:** Approved — owner approval received 2026-10-30. Implementation may proceed using additive migrations only.

**Date:** 2026-10-30

## Purpose

This checkpoint proposes the rules and contracts for the first fictional, turn-based Simulation Engine built on the existing Session Management V1 implementation. It preserves the approved architecture, authentication model, session ownership rules, lifecycle commands, append-only lifecycle events, and server-side revision checks from [CP-007](./CP-007-session-management-v1.md).

The engine is a game mechanic only. It must not model real chemical processes, real materials, operational recipes, or real-world safety or quality claims.

## Scope and dependencies

In scope:

- Advancing an authenticated user's `RUNNING` session through its ordered fictional recipe steps.
- A player-selected abstract action on each turn.
- Server-side random success or failure resolution.
- Equipment influence on the success probability without reservation or mutation.
- Progress and turn-result APIs.
- A React progress/advance experience inside the existing Application Shell.
- Persistence, authorization, concurrency protection, and focused tests.

Out of scope:

- Scoring, quality reports, incidents, gameplay timers, background workers, WebSockets, retries, restart/retry flows, equipment reservation, equipment consumption, and publication/version history.

Dependencies:

- Approved Authentication and Application Shell.
- Approved CP-007 Session Management V1.
- Existing recipes, ordered recipe steps, operators, and optional user-owned equipment.

## Reconciliation with the existing Session Management implementation

The current implementation remains the authority until this checkpoint is approved:

| Existing behavior | Simulation Engine reconciliation |
| --- | --- |
| Session setup creates a user-owned `DRAFT` session and one `SESSION_CREATED` event. | Preserve unchanged. Gameplay cannot begin before `RUNNING`. |
| `prepare`, `start`, `pause`, `resume`, and `abort` use `expectedRevision`. | Preserve the lifecycle actions and one-event-per-successful-mutation rule. |
| `ABORTED` is terminal; `COMPLETED` and `FAILED` are reserved for the future engine. | Add `COMPLETED` and `FAILED` as engine-owned terminal states. Existing lifecycle actions must reject all terminal states. |
| Recipe references and recipe steps become immutable once a session references the recipe. | Preserve. The engine reads the fixed ordered steps and never changes the recipe. |
| Equipment is optional, user-owned, and nullable when deleted. | Preserve. Equipment is referenced only; it is not reserved, consumed, or mutated. |
| `session_events` currently stores lifecycle event fields and has one event per revision. | Preserve existing rows and uniqueness. Add nullable typed turn metadata for engine events in an additive migration. |
| No session-step persistence exists in CP-007. | Add `session_steps` for engine progress; do not reset or discard existing sessions. |

## Proposed approved rules

### 1. Session-step initialization

- On the first successful `start` from `READY`, create one `session_steps` row for each ordered recipe step in the same transaction as the existing start mutation.
- The start operation still produces exactly one lifecycle event (`START`) and exactly one revision increment; step-row inserts do not create additional events.
- Each row stores the session, recipe step, one-based step order, `PENDING` or `COMPLETED` status, and nullable completion timestamp.
- Enforce unique `(session_id, recipe_step_id)` and `(session_id, step_order)` constraints.
- For any pre-engine `RUNNING` or `PAUSED` session, initialize missing step rows idempotently before progress is read or a turn is accepted. This must not reset status, revision, events, or existing data.
- The database is authoritative for progress. No client-supplied step identifier or progress value is accepted.

### 2. Allowed actions and probabilities

The only accepted actions are:

| Action | Base success probability |
| --- | ---: |
| `CAUTIOUS` | 85% |
| `BALANCED` | 75% |
| `BOLD` | 65% |

These are abstract game probabilities. They do not represent real-world process outcomes, safety, timing, or quality.

### 3. Equipment modifier

- No selected equipment: `0` percentage points.
- Selected equipment still present and `available = true`: `+5` percentage points.
- Selected equipment unavailable or deleted: `0` percentage points.
- The free-text equipment condition is not parsed or converted into a numeric modifier.
- The effective probability is clamped to the inclusive range `5%`–`95%`.
- Advancing a turn never reserves, consumes, updates, or deletes equipment.

The server records the action, modifier, effective probability, and outcome in the turn event metadata. The client may display the server-provided effective probability but may not provide or override it.

### 4. Turn outcomes and state changes

- Only `RUNNING` sessions with an unfinished step may advance.
- Each accepted advance performs exactly one server-side random draw.
- The request accepts only `expectedRevision` and `action`; the client cannot submit a random draw, probability, outcome, step identifier, or progress value.
- On success, complete exactly the next unfinished step, increment the session revision, and append one `TURN_SUCCEEDED` event.
- If the successful step is the final step, set the session to `COMPLETED` in the same transaction and keep the single `TURN_SUCCEEDED` event as the mutation event. There is no separate manual Finish command.
- On failure, set the session to `FAILED`, increment the revision, and append one `TURN_FAILED` event. The current step remains unfinished and there is no retry in V1.
- `COMPLETED`, `FAILED`, and `ABORTED` are terminal. They cannot advance, pause, resume, prepare, start, or abort.
- No gameplay, scoring, incidents, reports, or retry behavior is introduced by this checkpoint.

### 5. Concurrency and conflict behavior

- `expectedRevision` is mandatory for advance requests.
- Authorization, session state, expected revision, step selection, outcome, step update, session update, and event insertion must be handled atomically.
- The implementation may use a row lock or a conditional revision update, provided no two accepted requests can mutate the same revision.
- Recommended conflict precedence: compare `expectedRevision` first. A mismatch returns `409 REVISION_CONFLICT` without a random draw, event, step change, or revision change. If the revision matches but the state is not advanceable, return `409 INVALID_STATE_TRANSITION`.
- Network transport is not exactly-once. After an uncertain response, the UI must refresh authoritative session progress and events rather than blindly resubmitting the turn.

## Proposed API additions

Add these owner-scoped authenticated endpoints under the existing `/api` prefix:

### `GET /api/sessions/:id/progress`

Returns server-authoritative session id, status, revision, completed step count, total step count, and a nullable next-step summary. It may include the latest persisted turn result when available, but must not expose database rows or random state.

### `POST /api/sessions/:id/advance`

Request:

```json
{
  "expectedRevision": 4,
  "action": "BALANCED"
}
```

Response includes session id, status, revision, completed step count, total step count, nullable next-step summary, and the server-resolved turn outcome. The response must not accept or echo client-controlled RNG state.

Errors:

- `400` for malformed JSON or invalid action/revision input.
- `401` for missing or invalid authentication.
- `404` for a session not owned by the authenticated user, consistent with existing session ownership behavior.
- `409 REVISION_CONFLICT` for stale or repeated expected revisions.
- `409 INVALID_STATE_TRANSITION` when the revision matches but the session cannot advance.
- `500` only for controlled unexpected server failures; no sensitive internals are exposed.

`POST` requests use the existing strict Origin validation policy.

## Proposed persistence changes

The migration must be additive and preserve all existing rows and migration history:

- Extend the session status constraint to include `COMPLETED` and `FAILED`.
- Add `session_steps` with UUID id, session foreign key, recipe-step foreign key, one-based step order, `PENDING`/`COMPLETED` status, nullable `completed_at`, uniqueness for session/recipe-step and session/order, and indexes for session progress lookup.
- Add nullable `metadata` JSONB to `session_events` for typed turn details while preserving existing lifecycle columns and the `(session_id, revision)` uniqueness rule.
- Validate the public turn metadata shape with Zod. Do not expose raw database rows.
- Inspect the actual schema and migration history immediately before generating the migration. No reset, drop, destructive rewrite, or unapproved backfill is allowed.

## Proposed frontend behavior

- Extend the existing authenticated session detail view; do not replace the Application Shell.
- Show status, revision, recipe/operator/equipment context, completed/total progress, and the current next step.
- Show only the three action buttons while a session is `RUNNING` and has an unfinished step.
- Disable controls during a pending request and prevent double submission.
- Show the server-provided probability and equipment modifier with a clear fictional game-only label.
- Keep existing lifecycle controls for `DRAFT`, `READY`, and `PAUSED` (`prepare`, `start`, `resume` as appropriate).
- Show terminal completion/failure/abort states without retry controls.
- Handle loading, malformed responses, API errors, stale revision conflicts, expired sessions, unavailable API/database, direct navigation, and empty progress without fake data.
- Refresh authoritative progress and events after a successful turn and after a network-uncertain response.
- Maintain responsive and accessible styling consistent with the existing UI context.

## Required verification

Before the task can move to `done/`, add focused tests for:

- Action validation, base probabilities, equipment modifier, clamping, next-step selection, final-step completion, and injected deterministic randomness.
- Authentication, ownership, Origin validation, lifecycle prerequisites, success, failure, final completion, terminal-state rejection, and malformed requests.
- Stale/concurrent revisions, duplicate-event prevention, atomic step/session/event updates, and idempotent initialization of existing sessions.
- Migration preservation of existing sessions and events.
- Frontend loading, action enablement, stale conflicts, completion, failure, empty/unavailable states, and session expiry.
- TypeScript checks, repository tests, production builds, migration verification, and browser verification where the environment supports it.

## Approval record

The project owner approved all six proposed decisions on 2026-10-30, with the following clarifications:

- A failed turn never completes its recipe step; the failed step and outcome remain in persisted history.
- `FAILED` and `COMPLETED` sessions cannot advance, resume, or restart.
- Random outcomes are generated server-side and tested deterministically through controlled randomness.
- Existing sessions are initialized safely without losing lifecycle history.

The canonical business rules, database design, API contracts, feature documentation, testing strategy, and task documentation reflect this approved checkpoint.
