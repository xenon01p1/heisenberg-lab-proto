# AGENTS.md — Heisenberg Lab

> Mandatory operating instructions for AI coding agents working in this repository.
> **Status:** Proposed baseline. The project owner must approve changes to protected decisions.

## 1. Mission and priorities

Heisenberg Lab is a **fictional, Breaking Bad-inspired, turn-based cooking-session simulator** and a portfolio project for learning full-stack engineering. “Cooking” is a game mechanic using imaginary materials, abstract stages, simulated incidents, and fictional quality scores. The project is **not** a real chemical synthesis, controlled-substance manufacturing, or distribution tool.

The agent's job is to implement **only the approved requirement**, preserve existing architecture, make business behavior explicit, and leave the codebase understandable to a human reviewer.

When multiple valid implementations exist, prefer, in this exact order:

1. Easier to read.
2. Easier to debug.
3. Easier to change.
4. More explicit.
5. Less abstract.
6. Consistent with the existing stack.
7. Clear about business behavior.
8. Scoped only to the current requirement.

**Correctness, security, and data integrity are mandatory constraints**, not optional tradeoffs in this ranking. Do not select an insecure or incorrect implementation merely because it is shorter.

## 2. Source of truth and precedence

Before changing code, read in this order:

1. This `AGENTS.md`.
2. `docs/context/project-overview.md`, `architecture.md`, `code-standards.md`, `ui-context.md`, `ai-workflow-rules.md`, `business-rules.md`, `database-design.md`, `api-contracts.md`, and `testing-strategy.md` (as relevant), plus any task-referenced context and approved checkpoints.
3. The active task in `docs/context/tasks/ongoing/`.
4. The existing implementation and nearby tests.
5. Relevant package configuration and official library documentation when necessary.

**Conflict resolution:** System/developer instructions and explicit current user requests outrank this file. Within the repository, this file governs agent behavior; `docs/context/` governs approved requirements and technical specifications; `docs/context/checkpoints/` records owner-approved decisions; the active task governs scope. If two repository documents conflict, **stop and report the conflict** rather than silently choosing. Never treat unapproved AI-generated notes as authoritative.

Proposed context documents are not automatically approved requirements. Do not assume files exist. If required context is missing, say what is missing and ask for the smallest clarification needed. You may inspect existing code to establish facts, but must not invent product requirements.

## 3. Approved technology stack

| Concern | Approved choice |
|---|---|
| Language | TypeScript |
| Runtime and package manager | Bun |
| Monorepo task runner | Turborepo |
| Backend HTTP framework | Hono |
| Frontend | React |
| Database | PostgreSQL (approved database choice; schema design still requires approval) |
| ORM and migrations | Drizzle ORM / Drizzle Kit |
| Shared validation/contracts | Zod |
| Local infrastructure | Docker / Docker Compose |
| CI | GitHub Actions |

**Not yet decided:** React build tooling/router, UI library, deployment target, and specific database hosting. CP-003 approves persisted email/password authentication as product scope; CP-004 approves the V1 authentication security policy. Bun Test is approved for Authentication testing only. Do not assume Next.js, Vite, Tailwind, shadcn/ui, Vitest, Redis, or a cloud vendor is approved merely because it is popular. Propose a choice when a task requires one; wait for approval if it would establish a new architectural dependency.

Use versions already pinned in the repository. Do not upgrade dependencies unless required by the active task or explicitly authorized.

## 4. Protected repository structure

```text
.
├── AGENTS.md
├── docs/
│   ├── context/       # Project requirements and rules
│   │   ├── checkpoints/ # Owner-approved decisions and rationale
│   │   ├── tasks/
│   │   │   ├── ongoing/ # Active scoped work
│   │   │   └── done/    # Verified completed work
│   │   └── update/      # Dated implemented-feature and change logs
│   ├── deployment/    # Deployment instructions
│   └── user-guide/    # User-facing workflows
├── packages/
│   ├── contracts/     # Shared Zod schemas and public TypeScript types
│   └── db/            # Drizzle schema, migrations, and database access setup
├── src/
│   ├── api/           # Hono backend workspace
│   └── web/           # React frontend workspace
├── .github/workflows/ci.yml
├── .env.example
├── package.json
├── turbo.json
└── docker-compose.yml
```

The tree describes **ownership and intended paths**, not a claim that all files already exist. The repository is named `heisenberg_logistics`; the simulator may be called Heisenberg Lab in product documentation. Inspect the real repository first: never create duplicate `docs/tasks`, `docs/checkpoints`, or `docs/update` directories. If documented paths disagree with the repository, report the discrepancy; do not reorganize files without approval. Create only files needed for the current approved task. `src/api` and `src/web` are independent Bun workspaces; do not relocate them to `apps/` without permission.

**Dependency direction:**

- `src/web` may depend on `packages/contracts`, but **never** on `packages/db` or backend internals.
- `src/api` may depend on `packages/contracts` and `packages/db`.
- `packages/contracts` must not depend on `src/api`, `src/web`, or `packages/db`.
- `packages/db` must not import application modules or browser code.
- Browser code must not import server secrets, database clients, or server-only dependencies.

Prefer business logic in `src/api` services or small pure functions. Hono handlers handle HTTP; services handle business rules; database access handles persistence. Do not create layers solely to satisfy a pattern.

## 5. Prohibited architectural changes

**Do not do any of the following without explicit project-owner approval:**

- Replace Bun, Hono, React, Turborepo, Drizzle, Zod, or the approved database.
- Convert the application to Next.js, NestJS, Express, Prisma, MongoDB, or another framework/tool.
- Move, rename, or fundamentally reorganize top-level directories or workspace boundaries.
- Split the backend into microservices or introduce a message broker, distributed workflow engine, event sourcing, CQRS, or other major architecture.
- Add Redis, Kafka, Kubernetes, GraphQL, a state-management framework, or an ORM alternative without a demonstrated task requirement and approval.
- Introduce a generic repository framework, dependency-injection container, plugin architecture, or reusable abstraction for hypothetical future use.
- Change published API behavior, shared contract semantics, database ownership, or documented state transitions without an approved requirement.
- Add authentication, payments, external integrations, analytics, or unrelated features as “helpful improvements.” Persisted authentication is approved only within CP-003 and its approved task scope; unresolved security and deployment details still require owner approval.
- Rewrite working modules, reformat unrelated files, or perform sweeping refactors during a focused task.

If a protected change seems necessary, **do not implement it**. Explain the issue, minimal alternatives, tradeoffs, and what approval is needed.

## 6. Scope and anti-hallucination rules

- Implement only what the active task explicitly requires, plus the minimum supporting changes needed for correctness.
- Separate **verified facts**, **documented requirements**, and **assumptions**. Never present assumptions as facts.
- Search the repository before claiming a component, command, table, endpoint, or helper exists.
- Do not invent API routes, environment variables, database columns, user roles, formulas, or business states.
- Do not silently “improve” requirements. Raise ambiguities that affect data integrity, behavior, or architecture.
- For low-risk implementation details not specified, choose the simplest consistent option and disclose the assumption in the final report.
- Do not create placeholders, TODO-based fake functionality, mock success responses, or fabricated data in production paths unless the task explicitly calls for simulation or fixtures.
- Do not claim a feature is implemented, tested, or deployed without evidence.
- Do not browse unrelated code, touch unrelated files, or add speculative extensibility.

If a task cannot be safely completed with available information, stop at the boundary and report a precise blocker.

## 7. Code simplicity and conventions

- Prefer straightforward functions, early returns, descriptive names, and explicit conditions.
- Prefer plain TypeScript and existing libraries over new dependencies.
- Use abstractions only when they remove **actual**, repeated complexity.
- Avoid clever one-liners, deeply nested ternaries, excessive generics, dynamic metaprogramming, and premature optimization.
- Avoid `any`, unsafe casts, non-null assertions, and suppressed TypeScript errors unless unavoidable and justified.
- Prefer small modules organized by business capability, not unnecessary architectural layers.
- Keep domain decisions out of UI components and HTTP route handlers.
- Validate untrusted input at the API boundary using approved Zod contracts.
- Use consistent names across contracts, handlers, services, tests, and documentation.
- Use comments to explain **why**, constraints, or non-obvious behavior—not to narrate obvious code.
- Handle errors explicitly; return useful, stable client errors without exposing internal details.
- Follow existing formatting, naming, import conventions, and project scripts rather than introducing a second style.

**Example preference:** A readable `switch` over explicit session states is usually better than a configurable generic state-machine framework for this small simulator.

## 8. Business invariants for the simulator

These are **initial guardrails**, not a substitute for `docs/context/business-rules.md`:

- Sessions use fictional recipes, imaginary materials, abstract stages, and game-generated quality scores.
- Do not implement real drug synthesis instructions, real precursor optimization, or operational controlled-substance manufacturing logic.
- A session has a defined lifecycle. State changes must follow documented transitions.
- A completed, failed, or aborted session must not be resumed unless the business rules explicitly change.
- A session's recipe/version must not silently change during execution.
- The same step must not be completed twice through duplicate requests.
- A session's history should distinguish current state from recorded events.
- Final quality scores are **fictional game scores**, not measured chemical purity or safety claims.
- If equipment exclusivity is enabled, concurrent starts must not reserve the same equipment twice.

Exact state names, transitions, scoring rules, timing, and event probabilities must be defined in approved business context **before implementation**. Do not infer them from examples in chats or older drafts.

## 9. API and shared contracts

- Put shared request/response validation schemas and cross-boundary types in `packages/contracts`.
- Backend validates every external request; frontend validation is for user experience, not security.
- Do not return raw database rows by default; define intentional API response shapes.
- Keep HTTP concerns in Hono routes and business decisions in services.
- Use appropriate HTTP status codes and consistent error responses following existing conventions.
- Make operations safe against duplicate submissions when they change session state or consume shared resources.
- Do not introduce a new API versioning strategy, transport, or client generator without approval.

## 10. Database and migrations

- Define schemas and migrations in `packages/db` using Drizzle.
- Never edit an already-applied migration as a shortcut; create a new migration for subsequent schema changes.
- Never run destructive migrations, reset databases, delete data, or seed non-development environments without explicit authorization.
- Prefer database constraints for invariants the database can reliably enforce (foreign keys, uniqueness, checks).
- Use transactions for multi-step operations that must succeed or fail together.
- Consider concurrency when allocating equipment or changing shared state; a read-then-write check alone may race.
- Preserve existing records and migration history; explain any required backfill.
- Use `NULL` to mean “not yet known” rather than inventing a default value such as `0`.
- Store timestamps consistently (prefer UTC instants); convert for display at the UI boundary.
- Never expose database credentials or direct database access to the browser.
- Treat event history as append-only where required; corrections must not silently erase history.

Do not generate database schema based solely on a proposed design if `docs/context/database-design.md` is missing or unapproved. CP-003 approves the full-stack authentication/product scope, not the logical schema or migration details; those remain subject to the database-design approval gate.

## 11. Security and secrets

- Never commit `.env`, credentials, tokens, private keys, or production data.
- Document required variables in `.env.example` using non-secret placeholders.
- Never log secrets, session tokens, or sensitive request bodies.
- Treat all client input as untrusted; validate and authorize server-side.
- Use parameterized queries through Drizzle; do not concatenate untrusted input into SQL.
- Do not disable security checks, TypeScript checks, linting, or tests to make a task pass.
- Avoid installing unknown dependencies or executing downloaded scripts without a clear need.
- Use fictional/sample data for development and screenshots; do not assume access to production systems.

## 12. Testing and verification

For each behavior change:

1. Add or update focused tests for the changed behavior when a test framework exists.
2. Cover success, invalid input, invalid state transitions, and meaningful edge cases.
3. Test duplicate or concurrent requests where shared resources or state changes are involved.
4. Run relevant repository scripts (typecheck, tests, lint, build) that actually exist.
5. Report the exact commands run and whether they passed, failed, or could not run.

Do not invent scripts or test output. If a test framework is not configured, report that fact and propose the minimal setup as a separate decision/task. Avoid tests that depend on real-time sleeps or uncontrolled randomness; prefer seeded randomness and controllable clocks for simulation logic.

## 13. Documentation and task lifecycle

**Before coding:** Read context, inspect existing implementation, and identify the current approved task. If there is no active task, request or propose a narrowly scoped task; do not silently begin broad implementation.

**During coding:** Keep changes within the task. Propose consequential decisions for owner approval in `docs/context/checkpoints/`; do not silently approve them. Record task assumptions separately. If new requirements emerge, stop or propose a follow-up task rather than expanding scope.

**After coding:**

- Update relevant documentation only when behavior or decisions actually changed.
- Add a dated factual feature/change summary in `docs/context/update/` for meaningful completed work; this is **not** the decision log. Record approved architectural/product decisions in `docs/context/checkpoints/` with alternatives, rationale, approval, and date.
- Move a task from `docs/context/tasks/ongoing/` to `docs/context/tasks/done/` **only when acceptance criteria are met and verification is recorded**.
- If blocked or only partially complete, leave the task ongoing and describe remaining work.
- Do not rewrite historical task logs, feature logs, or checkpoint decisions to conceal changes.

Suggested task format: **Objective / Context / Scope / Out of scope / Acceptance criteria / Verification / Notes**.

## 14. Git and tool discipline

- Inspect `git status` and relevant diffs before changing files, when Git is available.
- Respect user changes and uncommitted work; do not overwrite unrelated modifications.
- Never force-push, reset hard, clean untracked files, rewrite history, or delete branches without explicit permission.
- Do not commit or push unless requested or clearly authorized by the current workflow.
- Keep changes reviewable; avoid mixing formatting-only edits with feature work.
- Use repository scripts and existing tooling rather than inventing new command conventions.
- Do not claim external commands succeeded unless their output confirms success.

## 15. Required agent workflow

For every implementation request:

1. **Understand:** Read `AGENTS.md`, relevant context, active task, and existing code.
2. **Restate:** Summarize the requirement, constraints, and expected observable behavior.
3. **Check:** Identify missing decisions, conflicts, and prohibited architectural changes.
4. **Plan briefly:** Identify files to change and tests to run; avoid large speculative plans.
5. **Implement minimally:** Make the smallest correct, readable change.
6. **Verify:** Run available targeted tests and appropriate project checks.
7. **Review:** Inspect the diff for unrelated edits, leaked secrets, broken contracts, and unnecessary complexity.
8. **Document:** Update task status, factual feature logs, and approved checkpoint records accurately.
9. **Report:** Summarize changed files, behavior, verification, assumptions, and remaining risks.

If the task is **documentation-only**, do not generate application code. If the user asks for a plan, do not implement it without authorization.

## 16. Required final response format

Use concise sections:

- **Implemented:** What changed and which requirement it satisfies.
- **Files changed:** Important paths only.
- **Verification:** Commands run and actual results; say “not run” when applicable.
- **Decisions / assumptions:** Only material ones.
- **Remaining issues:** Blockers, known limitations, and next task if relevant.

Never say “all done” if acceptance criteria remain unmet. Never describe hypothetical tests as passing.

## 17. Stop-and-ask triggers

Pause implementation and ask for approval when:

- A requirement contradicts `docs/context/` or this file.
- A task needs a protected architecture change or a new major dependency.
- The intended business behavior cannot be determined without guessing.
- A migration risks losing data or requires a destructive operation.
- A change would expose secrets or bypass authorization.
- Existing user work would be overwritten.
- The task grows materially beyond its approved scope.

When asking, provide **one specific question**, a recommended simple option, and the consequence of that choice. Do not ask about trivial implementation details that can be safely resolved by following existing patterns.

## 18. Feature-based specifications (mandatory)

- Read `docs/context/feature-documentation-rules.md` before planning or implementing any feature.
- Each independently deliverable feature must have a dedicated specification under `docs/context/features/<feature-name>.md`, using `FEATURE-TEMPLATE.md` as a starting point.
- A feature file must document its overview, explanation, goals, scope, workflows, business rules, functional specifications, technical touchpoints, acceptance criteria, expected outputs, implementation status, achievements, and unresolved questions.
- Feature specifications describe intended behavior. Actual implementation history belongs in `docs/context/update/`; approved decisions belong in `docs/context/checkpoints/`; task progress belongs in `docs/context/tasks/`.
- Do not implement a proposed or ambiguous feature without approval. Do not invent API contracts, schema, scoring rules, or framework choices.
- Respect the approved stack: Bun runtime/package manager, Hono, Turborepo, Docker, React, Drizzle ORM/Kit, and PostgreSQL. Zod is used for shared contracts where already specified.
- CP-003 is the owner-approved scope checkpoint for persisted authentication, accounts versus fictional operators, equipment catalog coverage, authenticated application UI, and full-stack completion. CP-004 is the approved security checkpoint for Authentication. Treat all other unresolved decisions as unresolved.
- Prefer explicit, straightforward code over clever abstractions. Do not expand scope or change architecture without approval.

---

**Guiding rule:** Build the smallest correct thing that satisfies the documented business requirement. Prefer explicit, boring, testable code over clever code. Protect the agreed architecture. Never invent requirements or verification results.
