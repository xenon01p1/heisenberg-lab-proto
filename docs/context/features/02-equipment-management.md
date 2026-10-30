# Feature: Equipment Management

**Status:** Proposed specification — not authorization to implement
**Owner approval:** Pending review
**Related checkpoints:** CP-001 (PostgreSQL), CP-002 (turn-based V1)
**Related task:** `../tasks/ongoing/TASK-02-equipment-management.md`
**Related updates:** None

## 1. Overview
Track fictional lab equipment as simulation resources, including availability and a simple condition indicator.

## 2. Goals
- Make the fictional equipment catalog and any approved session selection visible and understandable.
- Preserve a place for conflict protection if reservation is approved.
- Keep equipment state changes auditable through session events where relevant.

## 3. Scope
**In scope**
- List equipment and its current availability.
- Select equipment when configuring a session if the approved session contract requires it.
- Reflect assignment and release during session lifecycle actions only after those semantics are approved.

**Out of scope**
- Real-world maintenance procedures, hardware integration, IoT, and telemetry.
- Detailed repair economics or predictive maintenance.

## 4. User workflow
1. User views the equipment list.
2. User chooses an available equipment item while preparing a session.
3. System validates availability when the session starts.
4. System releases equipment according to the approved lifecycle rules.

## 5. Business rules and edge cases
- If reservation is approved, equipment cannot be assigned to two simultaneously active sessions.
- If reservation is approved, database transaction/concurrency protection is required, not just a frontend check.
- Definition of active occupancy and release behavior for PAUSED/FAILED/ABORTED requires approval.
- Condition values and maintenance actions are not approved yet.

## 6. Functional specifications
- FR-001: Display equipment identity and availability.
- FR-002: Show selection and availability according to the approved equipment policy.
- FR-003: If allocation is approved, reject a conflicting allocation when the approved lifecycle action occurs.
- FR-004: If allocation is approved, protect concurrent lifecycle actions from double-booking.

## 7. Technical touchpoints
- React: equipment list and selection control.
- Hono: equipment read API proposed; allocation performed through session actions.
- Zod: equipment and allocation-related contracts.
- Drizzle/PostgreSQL: `equipment` and session reference; transaction and constraint design to be reviewed.
- Dependencies: Session Management for lifecycle integration.

**Approved stack:** Bun runtime/package manager, Hono, Turborepo, Docker, React, Drizzle/Drizzle Kit, PostgreSQL, Zod contracts. Do not add frameworks without approval.

## 8. Acceptance criteria
- [ ] Equipment list reflects actual stored state.
- [ ] Concurrent attempts to start with one equipment item cannot both succeed.
- [ ] Rejected allocation does not partially change session state.
- [ ] Allocation/release behavior follows an approved lifecycle checkpoint.

## 9. Expected outputs
- Equipment list and status indicators.
- Validated equipment association with sessions and conflict responses.

## 10. Implementation and achievements
- **Implemented:** Not started.
- **Verification:** Not run.
- **Actual outputs:** None yet.
- **Updates:** Add a dated entry to `../update/` only after implementation.

## 11. Open questions
- Is V1 catalog-only, or is equipment required/selected for sessions?
- Does PAUSED continue reserving equipment?
- Can equipment be disabled manually?
- What conditions/statuses are needed in V1?
