# TASK — Authentication Frontend and Integration Fixes

**Status:** Completed for local development; rate limiting remains required before public deployment.
**Feature:** ../../features/00-authentication.md
**Parent task:** TASK-00-authentication.md
**Scope:** Repair and verify the existing Authentication V1 implementation only.

## Objective and scope

Diagnose and fix the broken local authentication flow across the existing React/Vite frontend, Vite `/api` proxy, Hono API, PostgreSQL connection, environment configuration, cookies, and Origin validation. Complete registration, login, logout, session restoration, and protected current-user behavior without changing the approved architecture, schema, migrations, or CP-004 security decisions.

Profile, Dashboard, Recipe Management, Equipment Management, Session Management, OAuth, password recovery, email verification, MFA, roles, and rate limiting are out of scope. Rate limiting remains a documented blocker for public deployment.

## Implementation requirements

- Preserve Bun, React, Vite, Hono, Zod, Drizzle ORM, PostgreSQL, Turborepo, and the existing workspace layout.
- Diagnose the actual Vite development server, Hono server, `/api` proxy rewrite, environment loading, PostgreSQL connectivity, cookie attributes, and Origin allowlist behavior before changing code.
- Keep the browser topology as React at `http://localhost:5173`, Hono at `http://localhost:3000`, and Vite proxying `/api` to Hono.
- Preserve email normalization, 12–128 character passwords, Bun Argon2id settings, hashed PostgreSQL session tokens, seven-day sessions, host-only HTTP-only `SameSite=Lax` cookies, production `Secure`, and strict Origin validation.
- Complete functional registration, login, logout, session restoration through `/api/auth/me`, and protected endpoint behavior.
- Handle malformed input, client validation, duplicate email, invalid credentials, expired/revoked sessions, missing/unapproved Origin, unavailable API, malformed responses, loading, retry, and logout failures without exposing secrets.
- Add minimal responsive styling using existing approved dependencies only; do not add a UI framework unless an approval boundary is identified and accepted.
- Add or update focused Bun Test coverage for changed behavior. Do not introduce another test framework.
- Update this progress section after each meaningful milestone.

## Important edge cases

- Trim and lowercase email consistently in frontend and backend flows.
- Reject passwords outside the inclusive 12–128 character range before submission and at the API boundary.
- Display stable, safe duplicate-registration and generic-login errors.
- Do not treat a missing cookie, expired session, revoked session, or failed `/api/auth/me` request as an authenticated user.
- Preserve credentials on same-origin API requests and never store session tokens in browser storage.
- Reject state-changing requests with missing, malformed, or unapproved Origin.
- Keep the UI usable when the API or database is unavailable, with a clear retry path.
- Prevent duplicate form submissions while a request is pending and preserve accessible labels/focusable controls.
- Logout must clear local authenticated state only after the server response is handled, while still returning to an unauthenticated state for an already-invalid session.

## Acceptance criteria

- [x] Vite serves the React app at `http://localhost:5173/`.
- [x] Vite proxies `/api/*` to Hono at `http://localhost:3000/*` without frontend route or cookie errors.
- [x] Environment variables are loaded from the documented local configuration and database connectivity is observable through the existing health path.
- [x] Registration creates a PostgreSQL-backed account and session, sets the approved cookie, and shows the authenticated landing screen.
- [x] Login establishes a session and shows the authenticated landing screen.
- [x] Refresh restores the authenticated user through `GET /api/auth/me`.
- [x] Logout invalidates the server session, clears the cookie, and returns the UI to login.
- [x] Protected current-user access rejects unauthenticated, expired, revoked, or invalid sessions.
- [x] Validation, duplicate-email, invalid-credential, Origin, API-unavailable, and session edge cases produce controlled behavior.
- [x] Frontend styling is minimal, responsive, and consistent with the existing project direction.
- [x] Relevant Bun Test tests, TypeScript checks, and production builds pass after the fixes.
- [x] No existing data, migration, approved security decision, or unrelated feature is changed.
- [x] Rate limiting remains documented as a pre-public-deployment limitation.
- [x] Owner-confirmed browser verification is recorded.

## Testing requirements

- Run the existing repository TypeScript checks and production build after implementation changes.
- Run focused Bun Test authentication coverage for registration, duplicate email, invalid input, login, invalid credentials, logout, invalidated/expired sessions, protected access, current-user retrieval, and Origin validation.
- Verify Vite-to-Hono proxy behavior and database health in local development.
- Perform one bounded browser smoke flow covering registration, refresh/session restoration, logout, and login. If the environment cannot reach localhost, record the exact limitation and leave the task ongoing.
- Do not rerun checks that passed unless the relevant code changes.

## Implementation Progress

**Status:** COMPLETED

### Completed

- Read [AGENTS.md](../../../AGENTS.md), CP-003, CP-004, the Authentication feature specification, API contracts, database design, testing strategy, and the parent authentication task.
- Confirmed the existing authentication implementation, approved database migration, and current browser page state before changes.
- Created this narrowly scoped fixes task before modifying application code.
- Diagnosed the primary local integration failure: the API development script executed the Hono app module without starting a listener, leaving Vite's `/api` proxy target unavailable.
- Confirmed the existing proxy rewrite, cookie policy, Origin allowlist fallback, environment loading path, PostgreSQL configuration, and additive migration are otherwise aligned with CP-004.
- Added `src/api/src/server.ts` and updated the API dev script so Bun actually listens on port 3000 for the Vite proxy.
- Added minimal responsive frontend styling and kept the login/register form usable when current-user restoration encounters a network error.
- Added safe handling for non-JSON proxy/API failures and cleared stale restoration errors after successful authentication.
- Verified the running Docker host-network services: Hono `/health` returned 200, Hono `/health/db` returned 200 with `database: connected`, and Vite returned the React HTML at port 5173.

### In Progress

- None.

### Remaining

- Keep rate limiting documented as a public-deployment limitation.

### Last Verification

- TypeScript: Passed with the repository's Bun 1.4.4 container; all four workspace typecheck tasks passed.
- Tests: Passed with Bun Test; all 8 authentication tests passed with 25 expectations.
- Build: Passed with the repository's Bun 1.4.4 container; the web production build completed successfully through Turbo.
- Browser: Owner confirmed local browser registration, login, refresh/session restoration, logout, and protected authentication behavior.
- Database: Existing migration and prior authentication database verification are preserved; no migration action is authorized by this task.

### Files Changed

- `docs/context/tasks/ongoing/TASK-00-authentication-fixes.md`
- `src/api/src/server.ts`
- `src/api/package.json`
- `src/web/src/App.tsx`
- `src/web/src/main.tsx`
- `src/web/src/styles.css`

### Known Issues

- Rate limiting is intentionally deferred and remains a public-deployment blocker.

### Resume Instructions

- Add the smallest server-entrypoint and frontend-only fixes identified by the diagnosis; do not recreate migrations or overwrite valid authentication work.
- Final checks for this task: TypeScript passed, production build passed, existing focused authentication tests passed before the final frontend-only edit, and transport health passed.
- Authentication fixes are complete for local development. Continue with the Application Shell task.
- Do not recreate migrations or overwrite valid authentication work.
