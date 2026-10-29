# Architecture — Heisenberg Lab

**Status:** Proposed baseline for owner review. This document describes intended boundaries, not proof that files or services already exist.

## Approved stack
- TypeScript; Bun runtime and package manager.
- Turborepo for monorepo task orchestration.
- Hono for the backend HTTP API.
- React for the browser UI.
- Drizzle ORM / Drizzle Kit for database access and migrations.
- Zod for cross-boundary validation contracts.
- Docker / Docker Compose for local infrastructure.
- GitHub Actions for CI.
- **PostgreSQL: approved by the project owner.**

Do not assume a bundler, router, CSS framework, UI kit, test runner, authentication provider, or deployment service. Obtain approval before adding one as an architectural dependency.

## Repository layout
```text
AGENTS.md
 docs/
   context/                 # Authoritative project context
     checkpoints/           # Approved decisions and rationale
     tasks/ongoing/         # Approved active tasks
     tasks/done/            # Verified completed tasks
     update/                # Dated implemented-feature logs
   deployment/              # Deployment instructions
   user-guide/              # User-facing workflows
 packages/
   contracts/               # Shared Zod schemas and public types
   db/                      # Drizzle schema, migrations, DB setup
 src/
   api/                     # Independent Hono workspace
   web/                     # Independent React workspace
 .github/workflows/ci.yml
 .env.example
 package.json
 turbo.json
 docker-compose.yml
```
The actual repository is named `heisenberg_logistics`. Inspect existing files before creating anything; paths shown for root configuration files are planned, not assertions that they exist. Directories are created only when required. Keep `src/api` and `src/web`; do not relocate them to `apps/`.

## Runtime boundaries
```text
Browser / React (src/web)
       | HTTP JSON, validated contracts
       v
Hono routes (src/api)
       | call
Business services / small pure functions (src/api)
       | use
Drizzle database access (packages/db)
       |
PostgreSQL (approved database choice; schema pending approval)
```
- `src/web` may import `packages/contracts` only from shared packages; it must never import `packages/db` or server modules.
- `src/api` may import `packages/contracts` and `packages/db`.
- `packages/contracts` must not depend on application or database packages.
- `packages/db` must not depend on API or UI code.
- Keep server-only secrets and database access outside browser bundles.

## Responsibilities
**Web:** display server state, collect input, handle loading/error/empty states; no authoritative business transitions.  
**API routes:** parse and validate requests, map service results to HTTP responses.  
**Services:** enforce session rules, coordinate transactions, invoke deterministic simulation functions.  
**Contracts:** shared request/response schemas and public types, not database entities.  
**DB:** schema, migrations, connection configuration, and focused data access.

Use a repository/service split only when it improves clarity; do not add generic base classes, DI frameworks, or layers by default.

## Data integrity
- Treat the persisted session as authoritative current state; events are chronological history, **not full event sourcing**.
- Store each state-changing action and its event record in the same transaction where applicable.
- Reject invalid state transitions and repeated step completion.
- Protect shared resources from races if equipment reservation is later introduced.
- Preserve recipe-version meaning for existing sessions; do not mutate historical definitions silently.
- Use migrations for schema changes and database constraints for invariants where practical.

## API conventions
- Validate all external inputs on the server with Zod.
- Return intentional response objects rather than leaking raw DB rows.
- Keep errors predictable and avoid revealing stack traces or secrets.
- Do not invent endpoints or a versioning scheme until an approved task defines them.

## Deployment and development
Docker Compose is intended for local services. The specific production hosting, CI commands, environment variable names, and deployment topology are **not yet decided**. Follow scripts that actually exist in the repository; never fabricate them.

## Architecture change control
Any replacement of the approved stack, new infrastructure dependency, major folder reorganization, distributed architecture, or new application-wide pattern requires explicit owner approval and an owner-approved checkpoint in `docs/context/checkpoints/`. Refer to `AGENTS.md` for the full prohibited-changes list.
