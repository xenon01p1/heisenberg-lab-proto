# Testing Strategy — Heisenberg Lab

**Status:** Proposed strategy; test runner is not yet selected. Jest and Bun Test are candidates. Do not add a test framework until a checkpoint approves it.

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
1. Session creation initializes one session step per recipe step.
2. Draft cannot advance; ready cannot resume; terminal sessions cannot restart.
3. Advance completes exactly one unfinished step in order.
4. Final step completes the session and records score exactly once.
5. Duplicate or concurrent commands using the same revision yield one success and one conflict.
6. State and event append commit together; simulated DB failure rolls back both.
7. Refresh/re-fetch returns persisted state, not browser-only state.
8. Recipe version changes do not alter existing session meaning.
9. Invalid UUID, unknown ID, and invalid request body return consistent safe errors.
10. Event timeline orders by per-session sequence; no silent overwrite.
11. If incidents are approved: blocking warning pauses; unresolved warning blocks resume; resolution permits resume.
12. If scoring is approved: fixed inputs always produce same score, clamped to 0–100.

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
Approve a test runner (e.g., Vitest or Bun's built-in test runner), a database test setup, and UI testing tools **before** creating config/dependencies. Choose the smallest combination compatible with the approved stack.

## Ownership
- `docs/context/testing-strategy.md`: expected test behavior.
- `docs/checkpoints/`: approved test-tool decisions and rationale.
- `docs/tasks/ongoing/`: task-specific acceptance and verification plans.
- `docs/update/`: actual completed feature and test changes.
