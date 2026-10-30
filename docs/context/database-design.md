# Database Design — Heisenberg Lab

**Status:** Approved logical model for CP-004, CP-006, CP-007, and CP-008; use additive migrations only.
**ORM:** Drizzle ORM / Drizzle Kit. **Database:** PostgreSQL approved by CP-001 and CP-003.

## Principles
- `users` are authenticated accounts; `operators` are separate fictional game personas.
- Normalize stable domain relationships; JSONB is for event-specific metadata only.
- Persist current session state separately from append-only events.
- Prefer UUID primary keys, foreign keys, uniqueness, checks, and explicit nullable values.
- All writes that change session state and event history are transactional.
- Schema and migrations belong exclusively in `packages/db`.

## Relationship map
```text
users (1) ------ (N) auth_sessions
  |
  +-------------- (N) sessions (N) ------ (1) recipes
                         |                     |
                         |                     +--- (N) recipe_steps
                         +--- (N) session_steps --- (1) recipe_steps
                         +--- (N) session_events
                         +--- (0..1) equipment selection

operators (1) ---- (N) sessions
equipment is optionally referenced by sessions; V1 does not reserve or occupy it.
```

## Tables (logical schema, not migration code)

### `users` — authenticated accounts
| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | NOT NULL; normalized for uniqueness |
| `password_hash` | text | NOT NULL; Bun Argon2id PHC hash only |
| `display_name` | text | NOT NULL only if approved as a required account field; otherwise policy is pending |
| `created_at` | timestamptz | NOT NULL, server default |
| `updated_at` | timestamptz | NOT NULL if profile updates are approved |

Normalize email by trimming and lowercasing before the unique constraint. Accept passwords from 12 through 128 characters and hash with Bun Argon2id using `memoryCost=65536` KiB and `timeCost=2` (parallelism `p=1`). Never store plaintext passwords or session tokens.

### `auth_sessions` — server-managed login sessions
| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK -> users.id; NOT NULL |
| `token_hash` | text | NOT NULL; unique hash of an unpredictable opaque token |
| `expires_at` | timestamptz | NOT NULL |
| `revoked_at` | timestamptz | NULL until revoked |
| `created_at` | timestamptz | NOT NULL |

Set `expires_at` to exactly 7 days after session creation. Multiple active sessions per user are allowed. The browser cookie is HTTP-only, host-only, `SameSite=Lax`, and `Secure` in production/HTTPS; logout sets `revoked_at` for the current session.

### `operators` — seeded fictional personas
| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `display_name` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL, server default |

Operators are game data, not authenticated users.

### `sessions` — user-owned simulation sessions
Session setup/lifecycle is approved by CP-007 and engine behavior by CP-008. Fields are:

| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK -> users.id; NOT NULL; ownership boundary |
| `recipe_id` | uuid | FK -> recipes.id; NOT NULL |
| `operator_id` | uuid | FK -> operators.id; NOT NULL |
| `equipment_id` | integer | Nullable FK -> equipment.id; optional, `ON DELETE SET NULL` |
| `status` | varchar | `DRAFT`, `READY`, `RUNNING`, `PAUSED`, `ABORTED`, `COMPLETED`, or `FAILED` |
| `revision` | integer | NOT NULL, default 0; incremented atomically for every lifecycle or accepted turn mutation |
| `created_at` | timestamptz | NOT NULL, server default |
| `updated_at` | timestamptz | NOT NULL, server default |

### `session_steps` — ordered session progress
Fields are `id` UUID PK, `session_id` FK -> sessions.id with cascade delete, `recipe_step_id` FK -> recipe_steps.id, one-based `step_order`, `status` (`PENDING` or `COMPLETED`), nullable `completed_at`, and server timestamps as needed. Enforce unique `(session_id, recipe_step_id)` and `(session_id, step_order)`, with indexes for ordered session reads.

### `session_events` — append-only lifecycle and turn history
Fields are `id` UUID PK, `session_id` FK -> sessions.id with cascade delete, `actor_id` FK -> users.id, `action`, nullable `from_status`, `to_status`, resulting `revision`, nullable typed `metadata` JSONB, and `created_at`. A unique `(session_id, revision)` constraint prevents duplicate events. Lifecycle events preserve their existing shape; turn events store Zod-validated action, step, modifier, effective probability, and outcome metadata.

### `equipment` — user-owned fictional inventory
Equipment Management V1 is approved by CP-006. Preserve the existing integer identity key for compatibility and add `user_id` FK -> `users.id` (NOT NULL), required `name`, required validated-label `type`, required validated-label `condition`, required boolean `available`, and server-generated `created_at`. The current database was verified to contain zero equipment rows before adding the required ownership and inventory columns. V1 has no reservation, occupancy, or release columns; those belong to Session Management.

### `recipes` and `recipe_steps`
Recipe Management V1 is approved by CP-005. `recipes` is an authenticated user-owned table with a UUID primary key, `user_id` FK -> `users.id` (NOT NULL), required `title`, and server-generated `created_at`/`updated_at` timestamps. `recipe_steps` has a UUID primary key, `recipe_id` FK -> `recipes.id` with cascade delete for unreferenced recipes, required fictional `label`, optional `description`, one-based `step_order`, and UNIQUE(`recipe_id`, `step_order`). A recipe must have at least one step. There is no publication, version-history, or retirement column in V1.

Recipe reads and mutations are scoped by the authenticated user's `user_id`. Recipe updates replace the complete ordered step list in one transaction. Before update or delete, the API must reject the operation if any simulation session references the recipe. The session schema is not yet implemented, so the initial recipe migration does not add a speculative session-reference table; Session Management must add the reference and enforce this rule before sessions can be created.

## Ownership and query rules
- Every session list, detail, event, report, and mutation query must scope through the verified authenticated `user_id`.
- `operator_id` is a domain relationship only and must not be accepted as proof of access.
- Recipe and equipment inventory queries are authenticated and owner-scoped under CP-005 and CP-006. Operators remain a separate per-feature visibility decision; user-owned session data is protected.

## Migration and existing repository state
The repository contains versioned Drizzle migrations through `0005_simulation_engine`, including the additive session and engine tables. Migration application status must still be verified against the target database before claiming deployment. Preserve existing records through additive/backfill or compatibility migrations; never drop, reset, or silently discard rows. Do not edit an already-applied migration.

## Transaction and migration policies
- Create session and append `SESSION_CREATED` atomically. Initialize engine step rows atomically during `READY -> RUNNING`; pre-engine `RUNNING`/`PAUSED` sessions use safe idempotent initialization without resetting history.
- State transitions, step changes, event append, and revision increment are atomic.
- Use a row lock or conditional revision update; a read-then-write check alone is insufficient.
- Generate versioned Drizzle migrations and test fresh plus representative pre-migration databases when applicable.
- Do not add speculative inventory, warehouse, incident catalog, or allocation tables before their behavior is approved.

## Pending checkpoints
1. Equipment reservation/release remains deferred to a future Session Management decision.
2. Incidents, scoring, quality reports, retries, and other gameplay beyond CP-008 remain deferred.

Record decisions in `docs/context/checkpoints/`; feature delivery logs belong in `docs/context/update/`.
