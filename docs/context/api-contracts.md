# API Contracts — Heisenberg Lab

**Status:** Approved V1 HTTP interface for implemented features under CP-004, CP-005, CP-006, CP-007, and CP-008.
**Backend:** Hono. **Validation:** Zod in `packages/contracts`. **Transport:** JSON over HTTP.

## Conventions
- Base path proposed: `/api`; no implicit `/v1` until approved.
- IDs are UUID strings; times are ISO 8601 UTC strings; game score is integer 0–100 or `null`.
- Server validates every request and maps business errors intentionally; frontend validation is not authorization.
- Success shape: `{ "data": ... }`; errors: `{ "error": { "code": "...", "message": "..." } }`.
- Never expose database rows, password hashes, session tokens, or stack traces directly.
- Authentication is persisted email/password account authentication. The authenticated account is distinct from the `operatorId` selected as fictional game data.

## Authentication and account endpoints
| Method | Path | Meaning | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create an account and establish a server session | Public |
| POST | `/api/auth/login` | Verify credentials and establish a server session | Public |
| POST | `/api/auth/logout` | Revoke the current server session | Authenticated |
| GET | `/api/auth/me` | Return the safe current account profile; canonical current-user route | Authenticated |

Authentication uses a 7-day PostgreSQL-backed session, an HTTP-only host-only `SameSite=Lax` cookie, and `Secure=true` in production/HTTPS. Local development uses browser origin `http://localhost:5173` with the existing Vite `/api` proxy to Hono at `http://localhost:3000`. Production assumes one HTTPS origin for the React app and `/api`; its exact hostname must be configured in the Origin allowlist. Do not store bearer tokens in browser local storage.

## Authenticated application endpoints
| Method | Path | Meaning | Auth |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Return approved persisted user-scoped summary | Authenticated |
| GET | `/api/recipes` | List recipes owned by the authenticated user | Authenticated |
| POST | `/api/recipes` | Create an owned recipe with ordered steps | Authenticated |
| GET | `/api/recipes/:id` | Read one owned recipe and ordered steps | Authenticated |
| PATCH | `/api/recipes/:id` | Update an owned, unreferenced recipe and replace its steps | Authenticated |
| DELETE | `/api/recipes/:id` | Delete an owned, unreferenced recipe | Authenticated |
| GET | `/api/operators` | List seeded fictional operators | Authenticated |
| GET | `/api/equipment` | List equipment owned by the authenticated user | Authenticated |
| POST | `/api/equipment` | Create owned equipment inventory | Authenticated |
| GET | `/api/equipment/:id` | Read one owned equipment item | Authenticated |
| PATCH | `/api/equipment/:id` | Update one owned equipment item | Authenticated |
| DELETE | `/api/equipment/:id` | Delete one owned equipment item | Authenticated |
| POST | `/api/sessions` | Create a user-owned DRAFT session | Authenticated |
| GET | `/api/sessions` | List only the authenticated user's sessions | Authenticated |
| GET | `/api/sessions/:id` | Read one owned session with steps/status | Authenticated |
| POST | `/api/sessions/:id/prepare` | DRAFT -> READY | Authenticated |
| POST | `/api/sessions/:id/start` | READY -> RUNNING | Authenticated |
| POST | `/api/sessions/:id/pause` | RUNNING -> PAUSED if approved | Authenticated |
| POST | `/api/sessions/:id/resume` | PAUSED -> RUNNING if approved | Authenticated |
| POST | `/api/sessions/:id/abort` | DRAFT/READY/RUNNING/PAUSED -> ABORTED | Authenticated |
| GET | `/api/sessions/:id/events` | Return the ordered owned event timeline | Authenticated |
| GET | `/api/sessions/:id/progress` | Return authoritative ordered progress for an owned session | Authenticated |
| POST | `/api/sessions/:id/advance` | Resolve one player-selected turn action | Authenticated |

`fail`, `resolve-incident`, equipment allocation/release, and report endpoints remain deferred. Do not expose `userId` in request bodies as an ownership selector. `operatorId` is a domain selection, not authorization.

## Request and response contracts
Register/login request fields are email and password. Normalize email by trimming and lowercasing; accept passwords from 12 through 128 characters. Hash passwords with Bun's `Bun.password.hash` Argon2id configuration: `algorithm: "argon2id"`, `memoryCost: 65536` KiB, and `timeCost: 2` (Bun emits parallelism `p=1`). Verify with `Bun.password.verify`.

A successful auth response returns a safe user object; the server establishes the session through the HTTP-only cookie. Duplicate registration returns HTTP `409` and does not create an account or session. Login failures use a generic response.

For browser state-changing authentication requests and future cookie-authenticated state-changing requests, the server requires an `Origin` header matching the configured allowlist. Missing or unapproved Origin is rejected. Strict Origin validation is the V1 CSRF defense; no separate CSRF-token endpoint is defined.

Recipe request bodies contain `title` and a non-empty `steps` array. Each step contains `label` and optional `description`; the server assigns deterministic one-based order from array order and does not accept client ownership. `PATCH` replaces the complete step list. Recipe mutations on session-referenced recipes return `422 BUSINESS_RULE_VIOLATION`. Create session may contain `recipeId`, `operatorId`, and `equipmentId` only if equipment selection is approved for that task. Mutating session commands may contain `expectedRevision` if the revision contract is approved; do not treat this proposal as a finalized contract.

Equipment request bodies contain `name`, `type`, `condition`, and boolean `available`. Type and condition are validated non-empty labels; no enum is imposed in V1. Equipment mutations are authenticated, owner-scoped, and do not reserve or release equipment.

Session creation contains `recipeId`, `operatorId`, and optional `equipmentId`; the server verifies recipe/equipment ownership and operator existence. Lifecycle action bodies contain required nonnegative integer `expectedRevision`. Successful creation returns revision 0 and a `SESSION_CREATED` event; successful actions increment revision and append one event atomically.

`GET /api/sessions/:id/progress` returns the owned session's id, status, revision, `completedSteps`, `totalSteps`, nullable `nextStep`, and available actions. `POST /api/sessions/:id/advance` accepts `{ expectedRevision, action }`, where action is `CAUTIOUS`, `BALANCED`, or `BOLD`, and returns authoritative session progress plus the resolved turn outcome. The client cannot submit step, probability, draw, result, or progress values. A stale revision returns `409 REVISION_CONFLICT` before any random draw; a matching revision with a disallowed state returns `409 INVALID_STATE_TRANSITION`. Turn events use the same timeline and include typed metadata. Gameplay scoring, incidents, retries, and reports remain out of scope.

All public fields, nullability, validation limits, and response detail depth require Zod schemas and feature-level approval. Keep response envelopes and error codes stable unless a checkpoint changes them.

### Dashboard summary response

`GET /api/dashboard/summary` is authenticated and returns:

```json
{
  "data": {
    "equipment": { "available": true, "count": 0 },
    "recipes": { "available": true, "count": 0 },
    "sessions": { "available": true, "count": 0 },
    "completedSessions": { "available": true, "count": 0 },
    "recentActivity": { "available": true, "items": [] }
  }
}
```

The equipment count is the authenticated user's owned inventory count under CP-006. The recipe count is the authenticated user's owned recipe count under CP-005. The session count is the authenticated user's owned sessions count under CP-007. The completed-session count is the authenticated user's owned sessions with COMPLETED status. The recent-activity list contains the authenticated user's latest session lifecycle and turn events (up to 8) ordered newest first, with human-readable labels including recipe title context and ISO timestamps. When unsupported or unavailable, metrics return explicit `available: false` and `count: null` (or `items: []`); clients must not reinterpret unavailable values as zero or fabricated activity.

## Error mapping
| HTTP | Code | Example |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid request body or UUID |
| 401 | `UNAUTHENTICATED` | Missing, expired, or revoked session |
| 403 | `FORBIDDEN` | Authenticated user does not own the record |
| 404 | `NOT_FOUND` | Unknown or inaccessible resource |
| 409 | `INVALID_STATE_TRANSITION` | Action is not allowed from the current status |
| 409 | `REVISION_CONFLICT` | Stale or repeated expected revision |
| 409 | `BLOCKING_INCIDENT` | Resume before resolution, if approved |
| 409 | `EMAIL_ALREADY_REGISTERED` | Normalized registration email already exists |
| 422 | `BUSINESS_RULE_VIOLATION` | Recipe has no steps or is immutable after session reference |
| 500 | `INTERNAL_ERROR` | Unexpected failure; details logged server-side |

## Behavioral guarantees
- Protected handlers derive identity from server-verified authentication and scope every user-owned query and mutation.
- A successful state mutation changes persisted state and appends its event in one transaction. Accepted turns change session/step state and event metadata atomically.
- List/detail endpoints do not mutate state.
- Reports use persisted data; terminal eligibility and exact fields remain per-feature decisions.

## Contract ownership and pending approvals
Zod schemas and public types belong in `packages/contracts`; Hono validation/mapping belongs in `src/api`; business decisions belong in services; browser code uses public contracts only.

The authentication decisions are recorded in CP-004. Remaining API decisions are the base path, endpoint visibility, response envelopes/error codes outside Authentication, revision/idempotency contract, dashboard metrics, and incident workflow.
