# Testing Strategy — Heisenberg Lab

**Status:** Proposed strategy; Bun Test is approved for Authentication by CP-004. The project-wide test runner and other feature-specific tooling remain undecided.

## Objectives
Demonstrate correctness of state transitions, persistence, deterministic game outcomes, and concurrency behavior. Tests should be readable, fast, and useful when an AI agent changes the code.

## Testing pyramid
| Layer | Focus | Examples |
|---|---|---|
| Unit | Pure business rules | Allowed transitions, step selection, score clamp |
| Service/integration | Real DB transactions | Advance updates state + event, rollback on error |
| API | Hono + Zod boundary | Invalid body, 404, 409, success envelope |
| UI | Key React interactions | Loading, disabled actions, refresh restores progress |
| E2E (later) | One complete journey | Create -> prepare -> start -> advance -> report |

Prefer unit and service tests first; do not create a large E2E framework solely for one screen.

## Required business scenarios
1. Registration stores only a password hash, login establishes a server session, logout revokes it, and expired/revoked sessions are denied.
2. Authenticated account A cannot read or mutate account B's sessions or related records; fictional operator IDs do not bypass ownership.
3. React registration/login, protected-shell, profile, and dashboard states handle loading, validation, empty, and error outcomes.
4. Session creation initializes one session step per recipe step.
5. Draft cannot advance; ready cannot resume; terminal sessions cannot restart.
6. Advance completes exactly one unfinished step in order.
7. Final step completes the session and records score exactly once.
8. Duplicate or concurrent commands using the same revision yield one success and one conflict.
9. State and event append commit together; simulated DB failure rolls back both.
10. Refresh/re-fetch returns persisted state, not browser-only state.
11. Recipe version changes do not alter existing session meaning.
12. Invalid UUID, unknown ID, and invalid request body return consistent safe errors.
13. Event timeline orders by per-session sequence; no silent overwrite.
14. If incidents are approved: blocking warning pauses; unresolved warning blocks resume; resolution permits resume.
15. If scoring is approved: fixed inputs always produce same score, clamped to 0–100.

## Determinism
- Do not use real-time sleeps in tests.
- Inject a clock or pass explicit timestamps to pure functions when needed.
- Use fixed fixtures and seeded randomness if random events are added later.
- Never rely on external services, internet access, or uncontrolled time in unit tests.

## Database testing
- Use an isolated disposable test database, never development or production data.
- Run migrations before integration tests; clean up safely between tests.
- Test foreign keys, unique step order, unique session step, score bounds, and concurrency safeguards.
- Test migrations on a fresh database and, when relevant, on a representative pre-migration fixture.
- Do not silently reset shared DBs or edit applied migrations.

## API and frontend testing
- API tests exercise Zod validation and HTTP status mapping; don't just call services directly.
- UI tests cover status-based actions, pending/disabled states, error display, and report presentation.
- One E2E happy path is sufficient for MVP once tooling is approved.
- Verify accessible labels and keyboard navigation for core actions.

## CI / Definition of Done
- Run existing repo typecheck, lint, tests, and build commands where configured.
- A task is done only if its acceptance criteria are met and verification evidence is recorded.
- Agents must report commands actually run and failures; never fabricate passing results.
- If tests are missing or unavailable, label them **not run** and create a separate setup task.
- No arbitrary coverage percentage is required for V1; prioritize meaningful branch/edge coverage.

## Tooling checkpoint
Bun Test is approved for Authentication testing by CP-004. Approve any project-wide test runner, database test setup, and UI testing tools before creating additional config/dependencies. Choose the smallest combination compatible with the approved stack.

## Ownership
- `docs/context/testing-strategy.md`: expected test behavior.
- `docs/context/checkpoints/`: approved test-tool decisions and rationale.
- `docs/context/tasks/ongoing/`: task-specific acceptance and verification plans.
- `docs/context/update/`: actual completed feature and test changes.
