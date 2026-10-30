# Agent handoff — Full-stack V1 expansion

## Status and priority
Owner approved **real database-backed email/password authentication (Option A)**, a functional React application, profile, dashboard, and full-stack delivery for recipes, equipment, and sessions. This supersedes the previous *no authentication / no equipment* V1 assumptions, **but does not approve every undecided design detail**.

Read `AGENTS.md`, existing context documents, checkpoints, and the actual repository before any edits. Do not replace `AGENTS.md` wholesale; propose a minimal amendment. The files in this package are **change instructions and new specifications**, not permission to implement all features immediately.

## Required documentation reconciliation (first task; NO application code)
1. Create `docs/context/checkpoints/CP-003-full-stack-v1-scope.md` from this package.
2. Update `docs/context/business-rules.md`: distinguish authenticated accounts from seeded fictional operators; replace no-auth and no-equipment assumptions; define ownership and authorization rules; preserve approved turn-based behavior. Mark equipment reservation/release states pending decision.
3. Update `docs/context/database-design.md`: separate `users` (accounts) and `operators` (fictional personas); propose `auth_sessions`, `equipment`, user-owned sessions; retain recipe/version, session-step, and append-only event invariants. Document migration strategy for any existing database; **never drop or reset data without explicit approval**.
4. Update `docs/context/api-contracts.md`: propose register/login/logout/me/profile endpoints, authenticated session access, equipment endpoints and dashboard summary. Specify cookie and CSRF approach before implementing auth. Preserve envelope/error conventions unless approved otherwise.
5. Update `docs/context/ui-context.md`: add register/login, authenticated application shell, sidebar/navigation, profile menu, dashboard, recipe/equipment/session screens, loading/empty/error states and mobile usability. Styling framework/router remains a separate choice; do not add dependencies silently.
6. Update `docs/context/feature-documentation-rules.md`: an approved end-user feature is not done until frontend, backend, persistence where relevant, validation, tests, and documentation are verified. Some tasks can legitimately be backend-only if explicitly scoped as a subtask; they must not be marked as the whole feature complete.
7. Review and reconcile `docs/context/features/01-recipe-management.md`, `02-equipment-management.md`, `03-session-management.md` and their existing TASK-01/02/03 files. Keep original paths and task IDs; do not duplicate them. Ensure React UI is required for feature completion, while keeping undecided create/edit, condition, lifecycle and allocation rules open.
8. Add new specs/tasks supplied in this package for auth, profile, application shell and dashboard. Do not implement until the owner approves the reconciled documentation.
9. Update `AGENTS.md` with a small pointer to this checkpoint and the full-stack acceptance requirement, **without overwriting existing agent rules**.
10. Summarize proposed changes and ask the owner to approve the documentation diff.

## Implementation order (after documentation approval)
1. Authentication (register/login/logout/me + secure sessions)
2. Application shell and protected navigation
3. User profile
4. Dashboard (real persisted summary, no fake metrics)
5. Recipe management (list/details, editing only if approved)
6. Equipment management (catalog; lifecycle integration only after policy approval)
7. Session management (approved transitions and equipment allocation)
8. Turn-based advancement, events, scoring, reports — separate feature specs/tasks, not authorized by this handoff.

## Security and quality requirements
- Passwords: use an established password-hashing algorithm (Argon2id preferred) with per-password salts, never plaintext or reversible encryption.
- Sessions: unpredictable opaque session tokens, store only a hash of token in database, use HttpOnly Secure SameSite cookies as appropriate to deployment; define expiration and revocation; logout revokes server-side session.
- Browser authentication: do not store bearer tokens in localStorage. Protect state-changing cookie-authenticated requests against CSRF according to same-site/cross-site deployment; do not assume SameSite alone covers every scenario.
- Registration/login: validate input; prevent account enumeration where practical; add rate limiting or document a development-only limitation before public exposure. Do not log passwords or session tokens.
- Authorization: derive account identity from server-verified session, not from userId/operatorId supplied by client. Scope user-owned records on every API query and mutation. `operators` are fictional game identities, not security principals.
- Use Zod in `packages/contracts`; Hono in `src/api`; Drizzle schemas/migrations in `packages/db`; React in `src/web`; Bun and Turborepo. No extra frameworks without approval.
- Never invent scoring algorithms, incident behavior, recipe versioning, equipment reservation/release, or state transitions.
- Every task must have explicit acceptance criteria and tests; verify locally, report commands and actual results; update docs/context/update and move task to done only after completion.

## Owner decisions still required
- Email/password policy and whether email verification is deferred (recommended deferred for local MVP, not production readiness).
- Auth cookie deployment: same origin vs separate origins; HTTPS/proxy and CSRF mechanism.
- Profile editable fields and whether changing email/password is in MVP.
- Dashboard metrics definition and whether metrics are user-scoped (recommended yes).
- Recipe read-only seeds vs editable; editing/versioning policy.
- Equipment allocation/release semantics and status vocabulary.
- Exact session transition matrix, retry/revision semantics, and score algorithm.
- Routing/styling approach; whether any UI library is approved.

## First instruction to coding agent
**Do documentation reconciliation only. Do not implement application code, install packages, generate migrations, or mark any feature complete. Present a file-by-file diff and unresolved decisions for owner approval.**
