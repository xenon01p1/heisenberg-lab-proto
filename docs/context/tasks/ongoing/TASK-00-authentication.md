# TASK — Authentication
**Status:** Proposed, awaiting owner approval.
**Feature:** ../../features/00-authentication.md
**Dependency:** Authentication first; shell/profile/dashboard after authentication (shell before dashboard).

## Objective
Implement the approved subset of Authentication as an end-to-end usable feature.

## Before coding
Read AGENTS.md, CP-003, relevant context docs, feature spec and actual repository. Resolve open questions with owner and record decisions in checkpoints. Do not infer missing behavior.

## Work breakdown
1. Confirm explicit acceptance criteria and chosen API/schema details.
2. Implement Drizzle schema/migration only where required; never reset existing data.
3. Implement shared Zod contracts and Hono endpoints with authorization as applicable.
4. Implement functional React screens/components and loading/error/empty states.
5. Add relevant tests, run type checks and verify end-to-end flows.
6. Document changed files, commands, results and limitations; update docs/context/update and move to tasks/done only when verified.

## Acceptance criteria
- [ ] Feature's approved acceptance criteria met in browser and API.
- [ ] Backend enforces security/business rules; frontend is not trusted for authorization.
- [ ] Tests and checks run, actual results reported.
- [ ] No unapproved architecture, business behavior, or dependencies.
- [ ] Documentation updated and feature demonstrable.

## Completion report
Pending.
