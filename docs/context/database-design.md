# Database Design — Heisenberg Lab

**Status:** Proposed logical model; do not migrate until owner approves this schema design.  
**ORM:** Drizzle ORM / Drizzle Kit. **Database:** PostgreSQL approved.

## Principles
- Normalize stable domain relationships; JSONB is for event-specific metadata only.
- Persist current session state separately from append-only events.
- Prefer UUID primary keys, foreign keys, uniqueness, checks, and explicit nullable values.
- All writes that change session state and event history are transactional.
- Database schema and migrations belong exclusively in `packages/db`.

## Relationship map
```text
users (1) ------ (N) sessions (N) ------ (1) recipes
                         |                      |
                         |                      +--- (N) recipe_steps
                         +--- (N) session_steps --- (1) recipe_steps
                         +--- (N) session_events
```
`equipment` is **deferred** from V1: no allocation workflow has been approved.

## Tables (logical schema, not migration code)

### `users` — seeded fictional operators
| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `display_name` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL, server default |

No authentication fields in V1. Do not add password/email requirements without an auth checkpoint.

### `recipes` — published versions
| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK; identifies **specific version** |
| `recipe_key` | text | NOT NULL; stable logical family key |
| `version` | integer | NOT NULL, >=1 |
| `name` | text | NOT NULL |
| `base_quality` | integer | NOT NULL, between 0 and 100 |
| `is_published` | boolean | NOT NULL, default false |
| `created_at` | timestamptz | NOT NULL |

UNIQUE(`recipe_key`, `version`). Published rows and their steps are immutable once referenced; enforce via service policy and tests (consider stronger DB protection later only if needed).

### `recipe_steps`
| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `recipe_id` | uuid | FK -> recipes.id; NOT NULL |
| `step_order` | integer | NOT NULL, >=1 |
| `name` | text | NOT NULL |
| `description` | text | Nullable, abstract/game-only |

UNIQUE(`recipe_id`, `step_order`). A recipe must have >=1 step before publishing (service-level check).

### `sessions`
| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `recipe_id` | uuid | FK -> recipes.id; NOT NULL |
| `operator_id` | uuid | FK -> users.id; NOT NULL |
| `status` | text or enum | NOT NULL; approved lifecycle values only |
| `revision` | integer | NOT NULL, default 0; optimistic concurrency proposal |
| `quality_score` | integer | NULL until completed; 0–100 when set |
| `started_at` | timestamptz | NULL until started |
| `completed_at` | timestamptz | NULL until completed |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

Check score range; terminal timestamps semantics to be confirmed (for aborted/failed, consider a separate `ended_at` instead of overloading `completed_at`). **Open decision:** approve `ended_at` before migration.

### `session_steps`
| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `session_id` | uuid | FK -> sessions.id; NOT NULL |
| `recipe_step_id` | uuid | FK -> recipe_steps.id; NOT NULL |
| `status` | text or enum | NOT NULL; `PENDING`, `COMPLETED` in turn-based V1 |
| `completed_at` | timestamptz | NULL until complete |

UNIQUE(`session_id`, `recipe_step_id`). Service verifies referenced step belongs to the session's recipe version.

### `session_events`
| Field | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `session_id` | uuid | FK -> sessions.id; NOT NULL |
| `actor_id` | uuid | Nullable FK -> users.id; NULL for simulator/system |
| `event_type` | text | NOT NULL; approved event vocabulary |
| `payload` | jsonb | NOT NULL, default `{}`; bounded/validated per event |
| `sequence` | integer | NOT NULL; monotonically increasing **within session** |
| `created_at` | timestamptz | NOT NULL |

UNIQUE(`session_id`, `sequence`). Sort timeline by sequence, not timestamp alone. Append-only; never update/delete as normal business behavior.

## Transaction boundaries
- **Create session:** insert session, initialize session steps, append `SESSION_CREATED` event atomically.
- **Transition:** check state and expected revision, update session and any step, append events, increment revision atomically.
- **Complete:** mark final step complete, calculate game score (once approved), update terminal state, append completion event atomically.
- Use row locking or conditional update for concurrent commands. Do not rely on read-then-write without conflict protection.
- For retry safety, `expectedRevision` prevents replaying stale actions; **true idempotent retries** may require a request-key table in a later checkpoint. Do not claim the two are equivalent.

## Migration and data policies
- Generate versioned Drizzle migrations; never modify applied migrations.
- No destructive reset or production seed without approval.
- Seed only fictional operators, recipes, and abstract steps in development.
- Use UTC timestamps; keep server-generated IDs and timestamps authoritative.
- Use explicit indexes for `sessions(operator_id, created_at)`, `session_steps(session_id)`, `session_events(session_id, sequence)` as query needs are confirmed.
- Avoid speculative tables (inventory, warehouse, auth, equipment, incident catalog) in V1.

## Pending checkpoints
1. PostgreSQL is approved; database schema approval remains pending.
2. Status representation (`text` with checks vs PostgreSQL enum).
3. Optimistic `revision` contract and retry semantics.
4. `ended_at` vs `completed_at` terminal timestamp semantics.
5. Whether V1 needs persisted incident state beyond event payloads. If incidents can remain unresolved across requests, an explicit `session_incidents` table or minimal session field **must be approved before implementation**; do not infer unresolved state from ad hoc event strings.

Record decisions in `docs/checkpoints/`; feature delivery logs go in `docs/update/`.
