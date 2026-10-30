# CP-007 — Session Management V1

**Status:** Approved by owner on 2026-10-30

## Approved decisions

- Fictional operators are separate seeded entities and are never authentication principals.
- An authenticated user creates user-owned `DRAFT` sessions from an owned recipe, a valid operator, and optional owned equipment.
- V1 supports only explicit transitions: `DRAFT -> READY` (`prepare`), `READY -> RUNNING` (`start`), `RUNNING -> PAUSED` (`pause`), and `PAUSED -> RUNNING` (`resume`).
- `abort` is allowed from `DRAFT`, `READY`, `RUNNING`, or `PAUSED` and transitions to terminal `ABORTED`.
- `ABORTED` is terminal. `COMPLETED` and `FAILED` are reserved for the future simulation engine and are not writable in V1.
- Equipment is referenced but not reserved, occupied, or released in V1. Selection is optional.
- Each successful lifecycle transition appends exactly one session event in the same transaction.
- Session mutations require the current server-side `revision` as `expectedRevision`; stale or repeated commands are rejected and do not partially mutate state.
- V1 does not implement gameplay, step advancement, incidents, scoring, retries, or reports.

## Approved persistence shape

- `operators`: seeded fictional `id`, `display_name`, and `created_at`.
- `sessions`: user ownership, recipe reference, operator reference, optional equipment reference, approved status, integer revision, and timestamps.
- `session_events`: append-only session reference, authenticated actor, action, from/to status, resulting revision, and timestamp.
- Session creation records `SESSION_CREATED` at revision `0`; lifecycle actions increment the revision and record one event.
- Recipe references prevent recipe update/deletion after session creation. Equipment references are nullable on equipment deletion because V1 does not reserve equipment.

## API decisions

- `GET /api/operators` lists seeded fictional operators for authenticated session setup.
- `POST /api/sessions` creates a user-owned draft.
- `GET /api/sessions` lists only the authenticated user's sessions.
- `GET /api/sessions/:id` returns one owned session and its linked records.
- `GET /api/sessions/:id/events` returns the ordered owned event timeline.
- `POST /api/sessions/:id/prepare`, `/start`, `/pause`, `/resume`, and `/abort` perform the approved transitions.
- Lifecycle action bodies require `{ expectedRevision }`.
- Unknown or inaccessible sessions return `404 NOT_FOUND`; stale revisions return `409 REVISION_CONFLICT`; invalid transitions return `409 INVALID_STATE_TRANSITION`.
