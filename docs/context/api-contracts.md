# API Contracts — Heisenberg Lab

**Status:** Proposed V1 HTTP interface — routes and payloads require owner approval before implementation.  
**Backend:** Hono. **Validation:** Zod in `packages/contracts`. **Transport:** JSON over HTTP.

## Conventions
- Base path proposed: `/api`. No implicit `/v1` until approved.
- IDs are UUID strings; times are ISO 8601 UTC strings; game score is integer 0–100 or `null`.
- Server validates all request params/body; frontend must not be trusted for transitions or scoring.
- Success shape: `{ "data": ... }`; errors: `{ "error": { "code": "...", "message": "..." } }`.
- Never expose database rows directly or internal stack traces.
- No authentication in V1; seeded operators are **game identities**, not authenticated users. Do not present `operatorId` as security authorization.

## Proposed endpoints
| Method | Path | Meaning | Expected success |
|---|---|---|---|
| GET | `/api/recipes` | List published recipe versions | 200 |
| GET | `/api/operators` | List seeded operators | 200 |
| POST | `/api/sessions` | Create DRAFT session | 201 |
| GET | `/api/sessions` | List sessions (basic pagination later) | 200 |
| GET | `/api/sessions/:id` | Session with steps and current status | 200 |
| POST | `/api/sessions/:id/prepare` | DRAFT -> READY | 200 |
| POST | `/api/sessions/:id/start` | READY -> RUNNING | 200 |
| POST | `/api/sessions/:id/advance` | Complete one step; maybe complete session | 200 |
| POST | `/api/sessions/:id/pause` | RUNNING -> PAUSED | 200 |
| POST | `/api/sessions/:id/resume` | PAUSED -> RUNNING | 200 |
| POST | `/api/sessions/:id/abort` | DRAFT/READY/RUNNING/PAUSED -> ABORTED | 200 |
| GET | `/api/sessions/:id/events` | Ordered event timeline | 200 |
| GET | `/api/sessions/:id/report` | Terminal session summary | 200 |

`fail` and `resolve-incident` endpoints are **deferred pending incident design**; don't implement speculative routes. `cancel` maps to `abort` for DRAFT/READY as proposed in business rules.

## Request examples
Create session:
```json
{ "recipeId": "00000000-0000-4000-8000-000000000001", "operatorId": "00000000-0000-4000-8000-000000000002" }
```
Mutating command (except create):
```json
{ "expectedRevision": 3 }
```
`expectedRevision` is a **proposed** required field, pending checkpoint approval. For `pause`, an optional user-facing reason may be considered later; don't add until specified.

## Response examples
Create or command success:
```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000003",
    "status": "RUNNING",
    "revision": 4,
    "recipeId": "00000000-0000-4000-8000-000000000001",
    "operatorId": "00000000-0000-4000-8000-000000000002",
    "qualityScore": null
  }
}
```
Error:
```json
{ "error": { "code": "INVALID_STATE_TRANSITION", "message": "Cannot resume a session that is not paused." } }
```
Examples illustrate shape, not proof of implemented endpoints. All public fields must have Zod schemas and documented nullability.

## Error mapping
| HTTP | Code | Example |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid UUID/body |
| 404 | `NOT_FOUND` | Unknown session/recipe |
| 409 | `INVALID_STATE_TRANSITION` | Start completed session |
| 409 | `REVISION_CONFLICT` | Stale expectedRevision |
| 409 | `BLOCKING_INCIDENT` | Resume before resolution (if incidents approved) |
| 422 | `BUSINESS_RULE_VIOLATION` | Recipe has no steps |
| 500 | `INTERNAL_ERROR` | Unexpected failure; details logged server-side |

## Behavioral guarantees
- Every mutation checks the current persisted state; never trust UI controls alone.
- A successful advance completes **one** step; concurrent commands with same revision cannot both advance.
- Transaction commits state/step updates and event append together.
- Return updated revision after each successful command.
- List and detail endpoints never mutate state.
- Reports use persisted data; unavailable report behavior should be confirmed (`409` until terminal is proposed).
- V1 pagination, filtering, and response detail depth are deliberately minimal; approve them per task.

## Contract ownership
- Zod schemas and exported types: `packages/contracts`.
- Hono route validation and HTTP mapping: `src/api`.
- Business decisions: `src/api` services.
- Browser uses public contracts only, not DB models.

## Pending checkpoints
- Approve base path and endpoint list.
- Approve response envelopes and error codes.
- Approve revision-based mutation payloads; decide whether request idempotency keys are needed.
- Approve report eligibility and exact detail/list response fields.
- Approve incident workflow before introducing incident commands.

Decisions belong in `docs/checkpoints/`; shipped-feature logs belong in `docs/update/`.
