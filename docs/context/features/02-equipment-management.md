# Feature: Equipment Management

**Status:** Approved for V1 implementation under CP-006
**Owner approval:** Approved 2026-10-30
**Related checkpoints:** CP-001 (PostgreSQL), CP-002 (turn-based V1), CP-003 (full-stack V1 scope), CP-006 (Equipment Management V1)
**Related task:** `../tasks/ongoing/TASK-02-equipment-management.md`
**Related updates:** `../update/2026-10-30-equipment-management.md`

## 1. Overview
Track user-owned fictional equipment inventory, including name, type, condition, and an inventory availability flag.

## 2. Goals
- Make each user's fictional equipment inventory visible and understandable.
- Keep reservation and release decisions scoped to Session Management.

## 3. Scope
**In scope**
- Create, list, inspect, update, and delete owned equipment inventory.
- Validate name, type, condition, and availability.

**Out of scope**
- Real-world maintenance procedures, hardware integration, IoT, and telemetry.
- Detailed repair economics or predictive maintenance.

## 4. User workflow
1. User views the equipment list.
2. User chooses an available equipment item while preparing a session.
3. System validates availability when the session starts.
4. System releases equipment according to the approved lifecycle rules.

## 5. Business rules and edge cases
- Equipment is visible only to its owning authenticated account.
- `available` is an inventory flag and is not a reservation or occupancy guarantee.
- Type and condition are validated labels; V1 does not define enum values or maintenance actions.
- Unknown or inaccessible IDs return a controlled not-found response.

## 6. Functional specifications
- FR-001: Display the authenticated user's equipment identity, type, condition, and availability.
- FR-002: Allow authenticated owners to create, edit, and delete equipment.
- FR-003: Reject malformed values and unauthorized access without mutating data.
- FR-004: Defer reservation, release, and concurrent allocation behavior to Session Management.

## 7. Technical touchpoints
- React: responsive equipment list and editor.
- Hono: authenticated owner-scoped equipment CRUD API.
- Zod: equipment request and response contracts.
- Drizzle/PostgreSQL: additive ownership and inventory fields on `equipment`; no session allocation fields.
- Dependencies: Session Management for lifecycle integration.

**Approved stack:** Bun runtime/package manager, Hono, Turborepo, Docker, React, Drizzle/Drizzle Kit, PostgreSQL, Zod contracts. Do not add frameworks without approval.

## 8. Acceptance criteria
- [ ] Equipment list reflects actual stored owner-scoped state.
- [ ] Create, read, update, and delete work through the React interface and API.
- [ ] Name, type, condition, and availability are persisted and validated.
- [ ] Another user cannot read or mutate the equipment item.
- [ ] Empty states, malformed IDs, invalid input, network errors, and expired sessions are handled.
- [ ] Reservation/release is not implemented and remains deferred to Session Management.
- [ ] Tests, type checks, production build, migration verification, and browser integration are recorded.

## 9. Expected outputs
- Equipment list and status indicators.
- Validated equipment association with sessions and conflict responses.

## 10. Implementation and achievements
- **Implemented:** Backend, database, shared contracts, frontend, and focused tests implemented under CP-006.
- **Verification:** Full workspace typecheck, full Bun test suite, production build, and additive PostgreSQL migration verification passed. Browser verification is pending because the shared browser page is unavailable in the current environment.
- **Actual outputs:** Owner-scoped equipment CRUD with persisted name, type, condition, and inventory availability, integrated into the Application Shell.
- **Updates:** See `../update/2026-10-30-equipment-management.md`.

## 11. Open questions
- Session Management must define whether and how equipment is selected, reserved, occupied, and released.
- Future condition vocabulary and maintenance workflows remain outside this task.
