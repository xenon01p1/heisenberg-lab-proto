# Database Design — Heisenberg Lab

**Status:** Proposed logical model; do not migrate until the owner approves this schema design.
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
equipment is a catalog resource; occupancy is pending policy.
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

### `equipment` — fictional catalog resources
The catalog identity and display fields are in scope. Status, condition, ownership, and allocation fields are intentionally not finalized. Reservation/release behavior must be approved before adding occupancy constraints or lifecycle columns.

### `recipes` and `recipe_steps`
Recipe Management V1 is approved by CP-005. `recipes` is an authenticated user-owned table with a UUID primary key, `user_id` FK -> `users.id` (NOT NULL), required `title`, and server-generated `created_at`/`updated_at` timestamps. `recipe_steps` has a UUID primary key, `recipe_id` FK -> `recipes.id` with cascade delete for unreferenced recipes, required fictional `label`, optional `description`, one-based `step_order`, and UNIQUE(`recipe_id`, `step_order`). A recipe must have at least one step. There is no publication, version-history, or retirement column in V1.

Recipe reads and mutations are scoped by the authenticated user's `user_id`. Recipe updates replace the complete ordered step list in one transaction. Before update or delete, the API must reject the operation if any simulation session references the recipe. The session schema is not yet implemented, so the initial recipe migration does not add a speculative session-reference table; Session Management must add the reference and enforce this rule before sessions can be created.

### `sessions`
| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK -> users.id; NOT NULL; ownership boundary |
| `recipe_id` | uuid | FK -> recipes.id; NOT NULL |
| `operator_id` | uuid | FK -> operators.id; NOT NULL |
| `equipment_id` | uuid | FK -> equipment.id; NULL or required only after selection policy approval |
| `status` | text or enum | NOT NULL; approved lifecycle values only |
| `revision` | integer | NOT NULL, default 0; concurrency proposal |
| `quality_score` | integer | NULL until completed; 0–100 when set |
| `started_at` | timestamptz | NULL until started |
| `ended_at` | timestamptz | NULL until a terminal state, pending timestamp decision |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

Check score range. `ended_at` versus separate terminal timestamps remains open.

### `session_steps` and `session_events`
Retain the existing invariants: one session step per `(session_id, recipe_step_id)`, `PENDING`/`COMPLETED` step status, append-only events with bounded validated payloads, and unique monotonically increasing `sequence` per session. `session_events.actor_id` references the authenticated user when applicable and is nullable for simulator/system events.

## Ownership and query rules
- Every session list, detail, event, report, and mutation query must scope through the verified authenticated `user_id`.
- `operator_id` is a domain relationship only and must not be accepted as proof of access.
- Public versus authenticated visibility of recipes, operators, and equipment is an API decision to approve per feature; user-owned session data is protected.

## Migration and existing repository state
The repository currently contains one Drizzle migration creating an `equipment` table with an integer identity key. This is observed scaffold state, not approval of the final logical schema, and it is not evidence that a database has been applied. Before implementation, inspect whether any database contains data. If migration is required, preserve existing records through an additive/backfill or compatibility migration approved for the actual data; never drop, reset, or silently discard rows. Do not edit the existing applied migration.

## Transaction and migration policies
- Create session, initialize steps, and append `SESSION_CREATED` atomically.
- State transitions, step changes, event append, and revision increment are atomic.
- Use row locking or conditional updates once the revision contract is approved; a read-then-write check alone is insufficient.
- Generate versioned Drizzle migrations and test fresh plus representative pre-migration databases when applicable.
- Do not add speculative inventory, warehouse, incident catalog, or allocation tables before their behavior is approved.

## Pending checkpoints
1. Approve this account/operator relationship and logical schema.
2. Approve status representation and session terminal timestamp semantics.
3. Authentication security policy is defined by CP-004; implementation remains gated on formal CP-004 approval.
4. Approve equipment fields, selection requirement, occupancy, reservation, and release semantics.
5. Approve optimistic revision and retry/idempotency semantics.
6. Approve whether unresolved incidents need persisted state beyond events.

Record decisions in `docs/context/checkpoints/`; feature delivery logs belong in `docs/context/update/`.
