# Feature Documentation Rules

## Purpose
Every independently deliverable product feature must have one dedicated specification file under `docs/context/features/`. Do not combine unrelated features in a single file. Use clear kebab-case names such as `session-management.md`.

## Required sections
1. **Overview:** What the feature is and who uses it.
2. **Goals:** The problem solved and intended outcome.
3. **Scope:** In scope and explicitly out of scope.
4. **User workflow:** How users interact with the feature.
5. **Business rules:** Preconditions, permissions, state changes, restrictions, and edge cases. Reference `business-rules.md` where appropriate.
6. **Functional specifications:** Numbered, testable requirements.
7. **Technical touchpoints:** Expected frontend, Hono API, Zod contracts, Drizzle/PostgreSQL entities, and dependencies. Do not invent endpoints or schema as approved facts.
8. **Acceptance criteria:** Observable checks for completion.
9. **Expected outputs:** Screens, records, events, reports, or other results the feature produces.
10. **Implementation status:** Proposed, approved, in progress, or implemented, with links to tasks and updates.
11. **Open questions:** Unresolved behavior; never silently decide these.

## Separation of responsibilities
- `docs/context/features/<feature>.md`: Desired feature behavior and specifications.
- `docs/context/tasks/ongoing/`: Small implementation tasks and acceptance criteria.
- `docs/context/tasks/done/`: Completed tasks with verification results.
- `docs/context/update/`: Actual implemented changes and deliverables, dated and linked to features/tasks.
- `docs/context/checkpoints/`: Approved product and architectural decisions with rationale.
- `docs/context/business-rules.md`: Shared, cross-feature business invariants; avoid duplicating them.
- `docs/context/api-contracts.md` and `database-design.md`: Cross-feature canonical interface and schema definitions.

## Full-stack completion rule
For an approved end-user feature, “implemented” means the approved behavior is usable through the React UI and supported by the Hono API, shared validation, persistence where relevant, focused tests, and documented verification. A backend-only or contract-only subtask may be completed when explicitly scoped that way, but it must not mark the whole end-user feature complete. Do not claim integration coverage when only one layer was verified.

## Agent requirements
- Inspect the repository and read `AGENTS.md`, applicable context, feature spec, and checkpoints before work.
- Never interpret a proposed feature spec as approval to implement it.
- Implement only the currently assigned task; do not add speculative features.
- If requirements conflict or are missing, record the question and ask the owner before choosing behavior.
- Update the feature spec only when an approved requirement changes; record the decision in checkpoints.
- After implementation, update status and add a dated entry to `docs/context/update/` describing actual changes, tests, and limitations. Do not claim unrun tests passed.
- Do not reorganize directories or change architecture without approval.

## Approved technology baseline
- Runtime and package manager: Bun
- Backend: Hono
- Monorepo task orchestration: Turborepo
- Containers: Docker
- Frontend: React
- ORM and migrations: Drizzle ORM / Drizzle Kit
- Database: PostgreSQL
- Shared runtime validation/contracts: Zod (as already established in project context)

Testing framework and fictional quality-scoring rules remain undecided. Do not silently choose them.

## Code preference
When multiple valid implementations exist, choose the one that is easier to read, debug, and change; more explicit and less abstract; consistent with the stack; clear about business behavior; and limited to the current requirement.
