# Feature: Recipe Management

**Status:** Proposed specification — not authorization to implement
**Owner approval:** Pending review
**Related checkpoints:** CP-001 (PostgreSQL), CP-002 (turn-based V1)
**Related task:** `../tasks/ongoing/TASK-01-recipe-management.md`
**Related updates:** None

## 1. Overview
Maintain reusable, wholly fictional simulation recipes consisting of a title and an ordered sequence of abstract stages. No real chemical procedures or operational synthesis instructions.

## 2. Goals
- Provide selectable definitions for later cooking sessions.
- Keep step ordering understandable and predictable.
- Avoid changing the meaning of sessions already created.

## 3. Scope
**In scope**
- View available fictional recipes and their stages.
- Create and edit recipe definitions only after the owner approves editing behavior.
- Validate that stage order is explicit.

**Out of scope**
- Actual chemistry, real-world processing parameters, or physical instructions.
- Inventory purchasing, costs, and quality-scoring algorithms.

## 4. User workflow
1. User opens the recipe list.
2. User inspects a recipe and its ordered abstract stages.
3. User selects a recipe when creating a session (implemented by Session Management).

## 5. Business rules and edge cases
- A recipe stage is a fictional label and optional descriptive text, not an actionable procedure.
- Step order must be unambiguous and stable.
- Recipe deletion, editing after use, and versioning policy require a checkpoint before implementation.
- Empty recipes and duplicate step positions must be rejected if creation is enabled.

## 6. Functional specifications
- FR-001: Display a list of recipes with basic identifiers.
- FR-002: Display one recipe's ordered fictional stages.
- FR-003: Validate the stage order and required fields for any approved create/edit operation.
- FR-004: Preserve historical session meaning when a recipe is changed; the mechanism is pending approval.

## 7. Technical touchpoints
- React: recipe list and detail screens; edit UI only if approved.
- Hono: read endpoints proposed; write endpoints require explicit approval.
- Zod: shared recipe payload and response validation.
- Drizzle/PostgreSQL: `recipes`, `recipe_steps` proposed; schema details governed by database-design.md.
- Dependencies: none for read-only browsing.

**Approved stack:** Bun runtime/package manager, Hono, Turborepo, Docker, React, Drizzle/Drizzle Kit, PostgreSQL, Zod contracts. Do not add frameworks without approval.

## 8. Acceptance criteria
- [ ] Recipe list and details show stages in deterministic order.
- [ ] Malformed or nonexistent identifiers produce a controlled error.
- [ ] No recipe edit silently changes an existing session's historical interpretation.
- [ ] Tests cover ordering and validation for implemented operations.

## 9. Expected outputs
- Recipe catalog view and recipe detail view.
- Validated fictional recipe definitions and ordered stages.

## 10. Implementation and achievements
- **Implemented:** Not started.
- **Verification:** Not run.
- **Actual outputs:** None yet.
- **Updates:** Add a dated entry to `../update/` only after implementation.

## 11. Open questions
- Are recipes read-only seed data in V1 or user-editable?
- If editable, what is the approved versioning/retirement policy?
