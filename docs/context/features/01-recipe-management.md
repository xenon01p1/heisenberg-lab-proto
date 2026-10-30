# Feature: Recipe Management

**Status:** Approved for V1 implementation under CP-005
**Owner approval:** Pending review
**Related checkpoints:** CP-001 (PostgreSQL), CP-002 (turn-based V1), CP-003 (full-stack V1 scope), CP-005 (Recipe Management V1)
**Related task:** `../tasks/ongoing/TASK-01-recipe-management.md`
**Related updates:** `../update/2026-10-30-recipe-management.md`

## 1. Overview
Maintain reusable, wholly fictional simulation recipes consisting of a title and an ordered sequence of abstract stages. No real chemical procedures or operational synthesis instructions.

## 2. Goals
- Provide selectable definitions for later cooking sessions.
- Keep step ordering understandable and predictable.
- Avoid changing the meaning of sessions already created.

## 3. Scope
**In scope**
- View available fictional recipes and their stages.
- Create, edit, and delete authenticated user-owned recipe definitions while they are not referenced by a simulation session.
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
- Recipe deletion and editing are blocked after a simulation session references the recipe. V1 has no publication workflow or version history.
- Empty recipes and duplicate step positions must be rejected if creation is enabled.

## 6. Functional specifications
- FR-001: Display a list of recipes with basic identifiers.
- FR-002: Display one recipe's ordered fictional stages.
- FR-003: Validate the stage order and required fields for any approved create/edit operation.
- FR-004: Preserve historical session meaning when a recipe is changed; the mechanism is pending approval.

## 7. Technical touchpoints
- React: recipe list and detail screens are required for feature completion; edit UI only if approved.
- Hono: authenticated owner-scoped CRUD endpoints are defined by CP-005.
- Zod: shared recipe payload and response validation.
- Drizzle/PostgreSQL: `recipes`, `recipe_steps` proposed; schema details governed by database-design.md.
- Dependencies: none for read-only browsing.

**Approved stack:** Bun runtime/package manager, Hono, Turborepo, Docker, React, Drizzle/Drizzle Kit, PostgreSQL, Zod contracts. Do not add frameworks without approval.

## 8. Acceptance criteria
- [x] Recipe list and details show stages in deterministic order.
- [x] Malformed or nonexistent identifiers produce a controlled error.
- [x] Owner authorization prevents access to another user's recipe.
- [x] Empty recipes and invalid step data are rejected.
- [x] Create, update, and delete are transactional and owner-scoped.
- [ ] Browser integration is owner-verified.
- [ ] Session-reference immutability is enforced when Session Management adds session references.

## 9. Expected outputs
- Recipe catalog view and recipe detail view.
- Validated fictional recipe definitions and ordered stages.

## 10. Implementation and achievements
- **Implemented:** Backend, database, shared contracts, frontend, and focused tests implemented under CP-005.
- **Verification:** TypeScript, full Bun tests, production build, and additive PostgreSQL migration verification passed. Browser verification is pending because the shared browser page is unavailable in the current environment.
- **Actual outputs:** Owner-scoped recipe CRUD with ordered fictional steps, responsive shell-integrated editor, and real PostgreSQL persistence.
- **Updates:** See `../update/2026-10-30-recipe-management.md`.

## 11. Open questions
- Session Management must define its recipe reference and enforce the immutable-after-reference rule before sessions can be created.

## 12. Approval record

The owner approved the minimal Recipe Management V1 policy in CP-005 on 2026-10-30. The former read-only and immutable-published-version assumptions are superseded for this feature.
