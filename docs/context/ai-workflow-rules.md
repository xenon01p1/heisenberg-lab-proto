# AI Workflow Rules — Heisenberg Lab

**Status:** Proposed baseline for owner review. `AGENTS.md` remains the binding entry point.

## Agent operating contract
Implement only the current approved task. Do not guess requirements, invent repository state, silently broaden scope, or change protected architecture. Prefer simple, explicit, testable code and report real verification results.

## Mandatory read order
1. Read `AGENTS.md`.
2. Read `docs/context/project-overview.md`, `architecture.md`, `code-standards.md`, `ui-context.md`, and this document as relevant; also read `business-rules.md`, `database-design.md`, `api-contracts.md`, and `testing-strategy.md` when the task touches those areas.
3. Read any additional context specifically referenced by the task (for example `business-rules.md` or `database-design.md`).
4. Read the active task in `docs/context/tasks/ongoing/`.
5. Inspect relevant existing files, tests, configuration, and Git status.

If required context is missing, do not fabricate it. Ask for a specific decision if it materially affects behavior or architecture.

## Before implementation
- State the objective, acceptance criteria, and what is out of scope.
- Identify the exact files expected to change and the verification commands available.
- Check for contradictions between task, context, and existing implementation.
- Confirm no prohibited architecture change or unapproved dependency is needed.
- For a documentation-only task, do not write application code.

## During implementation
- Make the smallest coherent change; avoid unrelated cleanup and broad refactors.
- Follow established workspace boundaries and naming conventions.
- Prefer explicit branches and small functions over generic infrastructure.
- Add focused tests for meaningful behavior when testing tools exist.
- Preserve uncommitted user changes; never overwrite unrelated work.
- If a requirement expands, record a follow-up task instead of silently expanding the current task.

## Anti-hallucination rules
- Inspect before asserting that a file, script, API, table, environment variable, or feature exists.
- Distinguish **confirmed facts**, **approved requirements**, and **assumptions**.
- Do not invent successful test output, deployed services, performance numbers, or user approvals.
- Do not generate placeholder success behavior, fake persistence, or unrequested features.
- Do not silently choose unresolved stack decisions (database, UI tooling, tests, authentication, hosting).
- Use official documentation when an external API/library behavior needs verification; never cite unverified assumptions as documentation.

## Approval gates — stop and ask
Ask the owner before: replacing an approved tool; adding a major dependency or architectural layer; moving protected directories; introducing real-time/distributed infrastructure; changing public contracts or business rules; performing destructive data operations; exposing secrets; overwriting user changes; or implementing undefined simulation rules.

When blocked, ask **one concrete question**, recommend the smallest reasonable option, and explain the consequence. Continue unrelated safe work only if the approved task clearly allows it.

## Verification and completion
1. Run focused tests and relevant existing typecheck/lint/build scripts.
2. Inspect diffs for unrelated changes, secrets, and unintended API/schema behavior.
3. Record exact commands and their actual pass/fail/not-run results.
4. Update relevant context only when approved decisions or behavior changed.
5. Write a dated factual feature/change note in `docs/context/update/` for meaningful completed work. Store approved decisions and rationale in `docs/context/checkpoints/`, not `docs/context/update/`.
6. Move the task to `docs/context/tasks/done/` **only after acceptance criteria are met and verification is recorded**.
7. If incomplete, leave it ongoing and state the blocker.

## Task template
Each task should contain: **ID, Objective, Context references, In scope, Out of scope, Acceptance criteria, Verification plan, Notes/checkpoint references**. Prefer one independently reviewable behavior change per task.

## Final agent report
- **Implemented:** observed behavior and scope.
- **Files changed:** relevant paths.
- **Verification:** commands and real results (including not run).
- **Decisions / assumptions:** only consequential items.
- **Remaining issues:** blockers, risks, next narrowly scoped task.

## Conflict resolution
Higher-priority runtime instructions and explicit current owner requests take precedence. `AGENTS.md` governs agent conduct; `docs/context/` governs approved product/technical decisions; an active task governs scope. If repository documents contradict one another, stop and ask instead of guessing. A proposed document is not automatically an approved requirement.
