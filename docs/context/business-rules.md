# Business Rules — Heisenberg Lab

**Status:** Approved V1 rules for Authentication, Session Management, and Simulation Engine under CP-004, CP-007, and CP-008.
**Scope:** Authenticated, turn-based, fictional cooking-session game. No real chemistry, drug manufacturing, or purity measurement.

## Product vocabulary
- **User/account:** An authenticated email/password account persisted in PostgreSQL. It is the security principal and owner of user-scoped records.
- **Operator:** A seeded fictional game persona selected for a session. Operators are not accounts and are not authorization principals.
- **Recipe:** A user-owned fictional game workflow with a title and ordered abstract steps. It is mutable until a simulation session references it, then immutable for historical consistency.
- **Session:** One user-owned attempt associated with one owned recipe, one seeded fictional operator, and optional owned equipment. Session Management owns setup/lifecycle; the approved Simulation Engine owns turn progress and terminal `COMPLETED`/`FAILED` outcomes.
- **Equipment:** A user-owned fictional inventory item with a name, type label, condition label, and inventory availability flag. Reservation and release semantics remain deferred.
- **Recipe step / session step:** An ordered abstract stage and its progress record.
- **Incident:** A fictional game event that interrupts or affects a session.
- **Quality score:** A game score from 0–100; never call it real chemical purity.
- **Event log:** Append-only record of important actions/outcomes; not the authoritative state.

## Accounts, ownership, and authorization
- Registration, login, logout, and current-account retrieval use persisted PostgreSQL accounts and server-managed sessions. Passwords use Bun Argon2id; emails are trimmed and lowercased; passwords are 12–128 characters.
- Authentication sessions expire exactly 7 days after creation. Multiple concurrent sessions per account are allowed. Logout revokes only the current session and clears its cookie.
- The authentication cookie is HTTP-only, host-only, `SameSite=Lax`, and `Secure` in production/HTTPS. Local development uses `http://localhost:5173` with the Vite `/api` proxy to Hono at `http://localhost:3000`; production assumes one HTTPS origin for the app and API.
- Browser state-changing requests validate `Origin` against an explicit allowlist. Missing or unapproved Origin is rejected. Strict Origin validation is the V1 CSRF defense; no separate CSRF-token endpoint is defined.
- Protected application and API operations derive the account identity from the verified server session. A client-supplied `userId` or `operatorId` must never grant access.
- Users may access and mutate only their own sessions and user-owned related records. Operators may be selected by an authenticated user but do not own records.
- No role-based authorization is approved for V1.
- Email verification/recovery, profile editing, and rate limiting remain outside this authentication scope; rate limiting or an explicitly documented development-only limitation is required before public exposure.

## V1 boundaries
- One authenticated human player controls a fictional operator; no multi-user collaboration or role system.
- One session at a time per player UI, while the backend may retain multiple sessions for the account.
- Turn-based only: no background timer, cron, WebSocket, or automatic advancement.
- A recipe and its steps cannot be updated or deleted after a session references it. V1 has no publication workflow or version history; the session task must preserve the referenced definition.
- Equipment inventory CRUD is in scope under CP-006. `available` is an inventory flag only; CP-007 explicitly does not reserve, occupy, or release equipment during Session Management V1.
- No raw-material consumption, warehouse, pricing, real chemical reactions, or distribution.

## Session lifecycle
CP-007 approves the following setup and lifecycle actions. CP-008 additionally authorizes engine-owned terminal outcomes:

| From | Action | To | Guard |
|---|---|---|---|
| DRAFT | prepare | READY | Recipe and operator references remain valid |
| READY | start | RUNNING | Explicit user action; no equipment reservation |
| RUNNING | pause | PAUSED | Explicit user action |
| PAUSED | resume | RUNNING | Explicit user action |
| DRAFT / READY / RUNNING / PAUSED | abort | ABORTED | Explicit user action |

`ABORTED`, `COMPLETED`, and `FAILED` are terminal. Session lifecycle commands cannot advance, resume, or restart a terminal session. The Simulation Engine creates `COMPLETED` after the final successful step and `FAILED` after a failed turn; no retry is available in V1.

## Creating a session
1. An authenticated user selects an owned recipe, a seeded operator, and optional owned equipment.
2. The server creates a `DRAFT` session owned by the authenticated user and records `SESSION_CREATED` in one transaction.
3. Recipe, operator, and any selected equipment references are fixed for this pre-gameplay session record; equipment occupancy behavior is not implied by this rule.
4. Creating a session does not start or advance it.

## Turn advancement (CP-008 approved)
- Only a `RUNNING` session with an unfinished `session_step` may advance.
- The server initializes missing progress rows idempotently for pre-engine `RUNNING`/`PAUSED` sessions without changing lifecycle history.
- The player chooses exactly one of `CAUTIOUS` (85%), `BALANCED` (75%), or `BOLD` (65%). Available selected equipment adds five percentage points; the result is clamped to 5%–95%. No equipment is reserved or mutated.
- The server performs one controlled random draw per accepted command. Clients cannot provide the step, probability, draw, result, or progress index.
- A success completes exactly the next unfinished step. The final success atomically changes the session to `COMPLETED`; other successes leave it `RUNNING`.
- A failure atomically changes the session to `FAILED`, leaves the failed step unfinished, and persists the failed outcome. There is no retry or restart.
- Every accepted turn increments `revision` and appends one event. State, step, and event changes are transactional.
- `expectedRevision` is checked before state validity. A mismatch returns `REVISION_CONFLICT` without a draw or mutation; a matching revision with a non-advanceable state returns `INVALID_STATE_TRANSITION`.

## Incidents and scoring
- V1 supports no incident or scoring algorithm until the owner approves the deterministic warning and scoring rules from the relevant checkpoint.
- If a blocking incident is approved, it must be persisted sufficiently to prevent resume while unresolved; do not infer unresolved state from event text alone.
- Quality scores are fictional integer game scores only. Completed sessions may receive a score once approved; unfinished, failed, and aborted sessions retain `NULL`.

## Invariants and failures
- Reject invalid transitions; do not silently coerce states.
- Each `(session_id, recipe_step_id)` appears at most once.
- Step order is unique within a recipe version.
- Never overwrite historical event records; append correction events when required.
- Invalid requests must not partially update state.
- Simultaneous mutations to the same session must not both succeed from the same revision once that contract is approved.
- Timestamps are server generated and stored as UTC instants.
- Errors are explicit and actionable, but do not leak internals.

## Open checkpoints requiring owner decision
1. Define future incidents, scoring, quality reports, and other gameplay beyond the CP-008 engine.

Record decisions in `docs/context/checkpoints/`, not `docs/update/`. Once approved, update this file's status and remove contradictory open questions; keep historical checkpoint records intact.
