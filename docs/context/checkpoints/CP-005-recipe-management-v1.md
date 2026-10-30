# CP-005 — Recipe Management V1

**Status:** Approved by owner on 2026-10-30

## Approved decisions

- Recipes belong to the authenticated `users` account that creates them.
- Each recipe requires a title and at least one ordered fictional step.
- A step has a fictional label and optional descriptive text; it must not contain real-world chemical or operational instructions.
- Owners can create, read, update, and delete their own recipes.
- Recipe list and detail queries are authenticated and owner-scoped.
- Updates and deletion are allowed only while no simulation session references the recipe.
- Once a session references a recipe, the recipe and its steps are immutable.
- V1 has no publication workflow and no version-history table.
- Recipe step order is one-based, deterministic, and unique within a recipe.
- Recipe mutations replace the complete ordered step list atomically; an empty replacement is rejected.
- Existing data and migrations must be preserved. Recipe schema changes are additive.

## API decisions

- `GET /api/recipes` lists the authenticated user's recipes.
- `POST /api/recipes` creates an owned recipe.
- `GET /api/recipes/:id` returns one owned recipe and ordered steps.
- `PATCH /api/recipes/:id` updates an owned, unreferenced recipe and replaces its ordered steps.
- `DELETE /api/recipes/:id` deletes an owned, unreferenced recipe.
- Unknown or inaccessible recipe IDs return `404 NOT_FOUND`; ownership is not disclosed.
- Invalid request data returns `400 VALIDATION_ERROR`.
- A recipe with no steps, or a mutation of a session-referenced recipe, returns `422 BUSINESS_RULE_VIOLATION`.

## Consequences

The recipe feature supersedes the earlier read-only and immutable-published-version assumptions for V1. Session Management must reference the recipe definition consistently and must enforce the immutable-after-reference rule. Publication, version history, and recipe sharing remain out of scope.
