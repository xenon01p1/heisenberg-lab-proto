# TASK-02 — Equipment Management

**Status:** Proposed / awaiting assignment
**Feature specification:** `../../features/02-equipment-management.md`
**Dependencies:** TASK-01 (recipe browsing is not a runtime dependency, but implement foundation first)
**Decision constraints:** CP-001 PostgreSQL approved; CP-002 turn-based V1 approved. Do not implement unresolved rules without owner approval.

## Objective
Implement only the approved V1 subset of `02-equipment-management.md`, with readable code and clear boundaries.

## Before coding
- Read `AGENTS.md`, all relevant `docs/context/*.md`, checkpoints, and the feature specification.
- Inspect the actual repository; do not assume files or scripts exist.
- Resolve open questions in the feature specification with the owner; record decisions under `docs/context/checkpoints/`.
- Confirm the specific subset and acceptance criteria assigned to this task.

## Work breakdown
1. Agree on feature-specific business behavior and acceptance criteria.
2. Implement minimal Drizzle/PostgreSQL schema or migration changes if needed.
3. Implement shared Zod contracts and Hono endpoints if approved.
4. Implement the smallest useful React interface if approved.
5. Add relevant tests using an owner-approved test framework.
6. Run available verification commands; document actual outcomes.
7. Update the feature's implementation section; move this task to `tasks/done/` only when complete; add dated `docs/context/update/` entry.

## Acceptance criteria
- [ ] Approved feature acceptance criteria are satisfied.
- [ ] No invented business behavior or unapproved architectural changes.
- [ ] Relevant validation, error handling, and database constraints are covered.
- [ ] Tests and type checks were run where available, or limitations reported.
- [ ] Implementation and documentation match; no unverified success claims.

## Completion report
- **Changed files:** Pending
- **Tests executed/results:** Pending
- **Behavior delivered:** Pending
- **Known limitations:** Pending
- **Update record:** Pending

> This is a planning task, not authorization to implement the entire feature or make undecided design choices.
