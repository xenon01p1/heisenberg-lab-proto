# Business Rules — Heisenberg Lab

**Status:** Proposed V1 specification — owner approval required before implementation.  
**Scope:** Turn-based, fictional cooking-session game. No real chemistry, drug manufacturing, or purity measurement.

## Product vocabulary
- **Recipe:** An immutable published version of a fictional game workflow.
- **Recipe step:** An ordered, abstract stage defined by that version.
- **Session:** One attempt to execute one recipe version with one seeded operator.
- **Session step:** Progress record for one recipe step in one session.
- **Incident:** A fictional game event that interrupts or affects a session.
- **Quality score:** A game score from 0–100; never call it real chemical purity.
- **Event log:** Append-only record of important actions/outcomes; not the authoritative state.

## V1 boundaries
- One human player controlling a seeded fictional operator; no login or role-based authorization yet.
- One session at a time **per player UI**, but backend may hold multiple sessions; no equipment allocation in V1.
- Turn-based only: no background timer, cron, WebSocket, or automatic advancement.
- Published recipe versions and their steps cannot change after a session references them.
- No raw-material consumption, warehouse, pricing, real chemical reactions, or distribution.

## Session lifecycle
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
1. Player selects an existing **published** recipe version and a seeded operator.
2. Server creates a `DRAFT` session and copies/initializes the associated session steps in the same transaction.
3. Recipe and operator references are fixed after the session starts.
4. Creating a session does **not** start or advance it.

## Turn advancement
- Only a `RUNNING` session may advance.
- Advance operates on the **first unfinished step** in `step_order`.
- One successful advance completes exactly one step, records an event, and moves to the next step or completes the session.
- Client must never supply the authoritative step order, result, or quality score.
- A duplicate command must not complete a second step accidentally. **Proposal:** Require an `expectedRevision` on mutating commands; mismatch returns a conflict. The owner must approve this concurrency contract.
- A command must update session/step state and append its event in one transaction.

## Incidents and pause/resume
- V1 supports a **deterministic scripted warning** rather than uncontrolled randomness. Example: a fictional equipment alert after the first advancement of a selected seed recipe.
- A blocking incident pauses the session and is recorded as an event.
- Resolving an incident is an explicit action available only when a blocking incident exists; resolution does not itself advance a recipe step.
- Resume is rejected while an incident remains unresolved.
- Incidents must be abstract (no actual equipment operating instructions).
- **Open decision:** Whether the scripted incident is part of V1 or deferred to V1.1. If not approved, implement manual pause/resume only.

## Quality score and reports
- Score is an **integer game score**, not measured purity. No real-world chemistry formula.
- **Proposed deterministic V1 rule:** Start from the recipe's `base_quality` (0–100); subtract 5 for each recorded resolved warning and 10 for each simulated failure penalty; clamp to 0–100. This formula is **illustrative only, not approved**; the project owner has not defined scoring factors, weights, grades, or calculations. Do not implement scoring until a checkpoint approves its rules.
- Only completed sessions receive a final score; unfinished, failed, and aborted sessions have `NULL` final score.
- Report contains recipe version, operator, final state, timestamps, completed steps, events, and final score when present.
- Report data comes from persisted state and events, not browser-only memory.

## Invariants and failures
- Reject invalid transitions; do not silently coerce states.
- Each `(session_id, recipe_step_id)` appears at most once.
- Step order is unique within a recipe version.
- Never overwrite historical event records; append correction events when required.
- Invalid requests must not partially update state.
- Simultaneous mutations to the same session must not both succeed from the same revision.
- Timestamps are server generated and stored as UTC instants.
- Errors are explicit and actionable, but do not leak internals.

## Open checkpoints requiring owner decision
1. Approve the lifecycle table, including `READY` and `FAILED`.
2. Approve revision-based conflict protection and duplicate request behavior.
3. Approve deterministic warning events for V1 or defer them.
4. Approve game scoring rules or keep scoring unspecified until a later task.

Record decisions in `docs/checkpoints/`, **not** `docs/update/`. Once approved, update this file's status and remove contradictory open questions; keep historical checkpoint records intact.
