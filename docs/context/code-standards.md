# Code Standards — Heisenberg Lab

**Status:** Proposed baseline for owner review.

## Selection rule
When multiple correct, secure implementations exist, choose in this order:
1. Easier to read.
2. Easier to debug.
3. Easier to change.
4. More explicit.
5. Less abstract.
6. Consistent with the existing stack.
7. Clear about business behavior.
8. Scoped only to the current requirement.

Correctness, security, and data integrity are non-negotiable. “Simple” does not mean omitting necessary validation or tests.

## TypeScript
- Prefer descriptive names, short functions, early returns, and explicit branches.
- Avoid `any`, non-null assertions, unsafe casts, clever generics, nested ternaries, and hidden mutation.
- Use `unknown` at untrusted boundaries and validate before use.
- Keep functions focused on one understandable responsibility.
- Prefer ordinary objects, arrays, functions, and `switch` statements over new frameworks or metaprogramming.
- Prefer existing repository formatting and naming conventions; do not introduce competing conventions.

## Business logic
- Implement documented rules literally; never infer scoring, chemistry, state transitions, or random event probabilities.
- Keep business rules out of React components and Hono handlers.
- Use explicit transition checks and meaningful errors for disallowed actions.
- Make simulated randomness injectable/seedable and time controllable so tests are repeatable.
- Prefer a pure function for score calculation once a scoring rule is approved.

## API and validation
- Define shared request/response contracts in `packages/contracts` when they cross API/UI boundaries.
- Validate every untrusted request in the API even if the UI already validates it.
- Return stable status codes and clear error messages; never return internal stack traces to clients.
- Do not leak database columns accidentally through direct row serialization.

## Database
- Use Drizzle for normal queries and migrations; prefer relational constraints over duplicated application checks when possible.
- Use transactions for coupled state/event changes.
- Do not edit applied migrations, drop data, or reset databases without explicit approval.
- Store “not calculated” as `NULL`, not a fabricated score of zero.
- Consider idempotency and concurrent requests for state-changing actions.

## Frontend
- Prefer clear components with local state where sufficient; do not add a global state library without need and approval.
- Show loading, empty, success, validation, and failure states.
- Never rely on disabled buttons as the only enforcement of a business rule; backend remains authoritative.
- Keep accessibility basics: semantic controls, keyboard access, labels, focus visibility, and readable contrast.

## Error handling and observability
- Fail clearly; do not swallow exceptions or return fake success.
- Log useful diagnostic context without secrets or unnecessary personal data.
- Distinguish user errors from unexpected server failures.
- Do not add logging/telemetry platforms without approval.

## Tests
- Test observable business behavior: valid flow, invalid transitions, duplicate actions, and persistence where relevant.
- Use deterministic clocks and random sources for simulation tests.
- Run only scripts present in the repository; report commands and actual outcomes.
- Do not skip or weaken tests to make changes appear successful.

## Comments, documentation, and refactoring
- Comment why a rule exists, not what obvious syntax does.
- Avoid speculative abstractions, “future-proof” interfaces, unused helpers, and unrelated cleanup.
- Change only files required by the approved task.
- Document meaningful decisions and limitations rather than over-documenting every function.

## Example principle
Prefer an explicit `switch (session.status)` with named allowed transitions to a generic, configurable workflow engine unless a real requirement proves the simpler approach inadequate.
