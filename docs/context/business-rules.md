# Business Rules — Heisenberg Lab

**Status:** Proposed V1 specification — owner approval required before implementation.
**Scope:** Authenticated, turn-based, fictional cooking-session game. No real chemistry, drug manufacturing, or purity measurement.

## Product vocabulary
- **User/account:** An authenticated email/password account persisted in PostgreSQL. It is the security principal and owner of user-scoped records.
- **Operator:** A seeded fictional game persona selected for a session. Operators are not accounts and are not authorization principals.
- **Recipe:** A user-owned fictional game workflow with a title and ordered abstract steps. It is mutable until a simulation session references it, then immutable for historical consistency.
- **Session:** One user-owned attempt to execute one recipe version with one fictional operator and, if approved for the session contract, selected equipment.
- **Equipment:** A fictional catalog resource. Catalog visibility and session selection are in V1 scope; reservation and release semantics remain pending.
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
- Equipment catalog and planned session selection are in scope. Whether active sessions reserve equipment, when it is released, and which statuses/conditions exist require an owner checkpoint.
- No raw-material consumption, warehouse, pricing, real chemical reactions, or distribution.

## Session lifecycle
The lifecycle below remains the proposed CP-002/CP-003 domain model and requires approval before transition implementation:

| From | Action | To | Guard |
|---|---|---|---|
| DRAFT | prepare | READY | Recipe has >=1 ordered step; operator exists |
| DRAFT | cancel | ABORTED | No work started |
| READY | start | RUNNING | Has recipe snapshot/immutable version and initialized steps |
| READY | cancel | ABORTED | Not started |
| RUNNING | pause | PAUSED | Explicit user action or blocking incident |
| PAUSED | resume | RUNNING | Blocking incident resolved, if any |
| RUNNING | advance | RUNNING | Completes current step; more steps remain |
| RUNNING | advance | COMPLETED | Completes final step; calculates final game score |
| RUNNING / PAUSED | abort | ABORTED | User confirms irreversible action |
| RUNNING | fail | FAILED | Explicit simulated terminal failure |

`COMPLETED`, `FAILED`, and `ABORTED` are terminal. No mutation except audit annotations expressly authorized later. `prepare` may be omitted as a separate button in the UI, but the state transition remains explicit on the server. Do not invent extra states.

## Creating a session
1. An authenticated user selects an existing published fictional recipe version, a seeded operator, and equipment only if the approved session contract requires selection.
2. The server creates a `DRAFT` session owned by the authenticated user and initializes associated session steps in one transaction.
3. Recipe, operator, and any selected equipment references are fixed after the session starts; equipment occupancy behavior is not implied by this rule.
4. Creating a session does not start or advance it.

## Turn advancement
- Only a `RUNNING` session may advance.
- Advance operates on the first unfinished step in `step_order`.
- One successful advance completes exactly one step, records an event, and moves to the next step or completes the session.
- The client must never supply authoritative step order, result, or quality score.
- Revision/conflict protection and true retry idempotency are pending decisions; duplicate commands must not complete a second step accidentally.
- A command must update session/step state and append its event in one transaction.

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
1. Approve the lifecycle table, including `READY` and `FAILED`.
2. Approve revision-based conflict protection and duplicate-request behavior.
3. Approve equipment status/condition vocabulary, selection requirements, reservation, and release semantics.
4. Approve deterministic incidents and whether they are V1 or V1.1.
5. Approve game scoring rules or keep scoring unspecified until a later task.

Record decisions in `docs/context/checkpoints/`, not `docs/update/`. Once approved, update this file's status and remove contradictory open questions; keep historical checkpoint records intact.
