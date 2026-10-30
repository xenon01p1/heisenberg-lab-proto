# Project Overview — Heisenberg Lab

**Status:** Proposed baseline for owner review.  
**Project type:** Portfolio / learning project.  
**Product:** Fictional, Breaking Bad-inspired, turn-based cooking-session simulator.

## Purpose
Build a small but credible full-stack application that demonstrates clear business rules, persistent workflow state, transactional correctness, and a polished interactive UI. The primary goal is to learn the selected stack through AI-assisted implementation while retaining understandable, reviewable code.

## Product boundary
“Cooking” is a fictional game mechanic. Recipes use imaginary materials, abstract stages, simulated incidents, and a **game quality score**. The application does not model real drug synthesis, precursor selection, controlled-substance distribution, or real-world purity optimization. Never label a fictional score as a laboratory measurement.

## Primary user experience
A user chooses an existing fictional recipe, creates a session, starts it, advances through abstract steps, responds to game events (such as equipment warnings), and reviews a completed session report. Sessions survive page refreshes and invalid transitions are rejected.

An authenticated account uses the application and owns its persisted sessions. Each session may also select a separate seeded fictional operator, which is a game persona and not a login identity or security principal.

## Full-stack V1 scope
- Register, log in, log out, and retrieve the authenticated account through a PostgreSQL-backed server session.
- Use an authenticated React application shell with profile/menu and dashboard entry points.
- View available fictional recipes and their abstract stages.
- View the equipment catalog and select equipment for a session where the approved session contract permits it.
- Create and view user-owned cooking sessions with an assigned fictional operator.
- Start, advance, pause, resume, complete, or abort a session **only where the approved state rules allow**.
- Persist account, session, equipment, step progress, and event state in PostgreSQL where the approved schema requires it.
- Record a chronological event history.
- Provide understandable loading, empty, validation, and error states in the API and React UI.

Reservation/release semantics, exact session transitions beyond the approved turn-based constraint, incidents, scoring, and dashboard metric definitions remain subject to owner-approved decisions.

## Out of scope for V1
Real chemistry, procurement, distribution, warehouse operations, payments, multiplayer, external integrations, production-grade role management, real-time timers, microservices, and sophisticated analytics. OAuth, password recovery, email verification, MFA, and editable account fields are out of scope unless separately approved. Equipment reservation/release behavior is not implied by catalog or selection support.

## Accounts and fictional operators
`users` are authenticated email/password accounts stored in PostgreSQL. `operators` are seeded fictional game personas selected for sessions. Authorization is based on the authenticated account's server-verified session; a client-supplied `userId` or `operatorId` is never an authorization mechanism. No role system is approved for V1.

## Success criteria
- One complete session can be executed end-to-end through the UI and API.
- Refreshing the browser does not lose persisted progress.
- Invalid and duplicate actions cannot corrupt session state.
- An event timeline explains why a session reached its final state.
- Business rules have focused automated tests once testing tooling is approved.
- Documentation explains how to run, test, and navigate the application.

## Decisions still requiring approval
- PostgreSQL as database (approved); schema and migration design still require review.
- Authentication security policy is defined by proposed CP-004; formal approval is required before implementation. Email verification/recovery policy and account profile edit scope remain separate decisions.
- React router/styling/component library, testing framework, and deployment target.
- Dashboard metric definitions, recipe edit/versioning policy, and equipment status/condition vocabulary and reservation/release semantics.
- Exact session states, allowed transitions, recipe steps, event probabilities, and scoring rules; resolve the proposed rules in `business-rules.md` through owner-approved checkpoints **before implementing the simulator engine**.

## Decision and feature history
`docs/context/checkpoints/` contains approved decisions and rationale. `docs/context/update/` contains factual logs of implemented features and changes. Proposed documents are not automatically approved.

## Related documents
`architecture.md` defines technical boundaries; `code-standards.md` defines implementation style; `ui-context.md` defines presentation; `ai-workflow-rules.md` defines agent procedure. `AGENTS.md` is the binding entry point.
