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

## MVP scope
- View available fictional recipes and their abstract stages.
- Create and view cooking sessions with an assigned fictional operator.
- Start, advance, pause, resume, complete, or abort a session **only where the approved state rules allow**.
- Persist step progress and session state in the database.
- Record a chronological event history.
- Generate a deterministic fictional quality score and a session summary when rules permit.
- Provide understandable loading, empty, validation, and error states.

## Out of scope for MVP
Real chemistry, procurement, distribution, warehouse operations, payments, multiplayer, external integrations, production-grade role management, real-time timers, microservices, and sophisticated analytics. Authentication and equipment exclusivity are deferred until explicitly approved.

## Users and roles
Initial MVP can use seeded fictional operators; do not invent authentication or authorization rules. A later task may define actual account roles.

## Success criteria
- One complete session can be executed end-to-end through the UI and API.
- Refreshing the browser does not lose persisted progress.
- Invalid and duplicate actions cannot corrupt session state.
- An event timeline explains why a session reached its final state.
- Business rules have focused automated tests once testing tooling is approved.
- Documentation explains how to run, test, and navigate the application.

## Decisions still requiring approval
- PostgreSQL as database (approved); schema and migration design still require review.
- React bundler/router, styling/component library, testing framework, authentication approach, and deployment target.
- Exact session states, allowed transitions, recipe steps, event probabilities, and scoring rules; resolve the proposed rules in `business-rules.md` through owner-approved checkpoints **before implementing the simulator engine**.

## Decision and feature history
`docs/checkpoints/` contains approved decisions and rationale. `docs/update/` contains factual logs of implemented features and changes. Proposed documents are not automatically approved.

## Related documents
`architecture.md` defines technical boundaries; `code-standards.md` defines implementation style; `ui-context.md` defines presentation; `ai-workflow-rules.md` defines agent procedure. `AGENTS.md` is the binding entry point.
