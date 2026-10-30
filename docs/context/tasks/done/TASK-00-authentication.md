# TASK — Authentication
**Status:** Completed for local development; rate limiting remains required before public deployment.
**Feature:** ../../features/00-authentication.md
**Dependency:** Authentication first; shell/profile/dashboard after authentication (shell before dashboard).

## Objective
Implement the approved subset of Authentication as an end-to-end usable feature.

## Before coding
Read AGENTS.md, CP-003, CP-004, relevant context docs, feature spec and actual repository. Implement only the CP-004-approved Authentication scope; do not infer missing behavior or begin Profile, Dashboard, Recipe, Equipment, or Session work.

## Work breakdown
1. Confirm explicit acceptance criteria and chosen API/schema details.
2. Implement Drizzle schema/migration only where required; never reset existing data.
3. Implement shared Zod contracts and Hono endpoints with authorization as applicable.
4. Implement functional React screens/components and loading/error/empty states.
5. Add relevant Bun Test tests, run type checks and verify end-to-end flows.
6. Document changed files, commands, results and limitations; update docs/context/update and move to tasks/done only when verified.

## Acceptance criteria
- [x] Feature's approved acceptance criteria met in browser and API.
- [x] Backend enforces security/business rules; frontend is not trusted for authorization.
- [x] Tests and checks run, actual results reported.
- [x] No unapproved architecture, business behavior, or dependencies.
- [x] Documentation updated and feature demonstrable.

## Completion report
Authentication is complete for local development. The owner confirmed that registration, login, logout, session restoration, and protected authentication behavior work in the local browser. Registration/login rate limiting remains a required pre-public-deployment limitation.

## Implementation Progress
**Status:** COMPLETED

### Completed

- Added `users` and `auth_sessions` tables through the existing Drizzle/PostgreSQL setup, preserving the existing `equipment` table and data.
- Generated and applied the additive Drizzle migration `packages/db/drizzle/0001_open_ink.sql`; migration history and resulting tables were verified.
- Implemented Hono registration, login, logout, and current-user endpoints, including authentication middleware, strict Origin validation, session expiration, cookie handling, and controlled errors.
- Implemented Bun Argon2id password hashing with the approved settings and hashed PostgreSQL session tokens.
- Added shared Zod contracts and a functional React authentication flow with registration, login, logout, session restoration, and a minimal authenticated landing screen.
- Added focused Bun authentication tests covering the approved success, validation, duplicate-email, password, session, logout, protected-endpoint, and Origin behaviors.
- Updated the relevant authentication documentation and environment example to reflect the implementation and its deployment limitation.

### In Progress

- None.

### Remaining

- Address registration/login rate limiting or obtain an approved infrastructure/dependency decision before public deployment.
- Continue with the Application Shell task; do not expand Authentication into Profile, Dashboard, Recipe, Equipment, or Session features.

### Last Verification

- TypeScript: Passed with the repository's Bun 1.4.4 container using `bun run typecheck`.
- Tests: Passed with Bun Test; 8 authentication tests passed with 25 expectations.
- Build: Passed with `bun run build`; the web build completed successfully through Turbo.
- Database migration: Generated and applied additively; `users`, `auth_sessions`, and existing `equipment` were verified, along with migration history. Test cleanup left users and sessions empty.
- Manual browser verification: Owner confirmed local browser registration, login, logout, refresh/session restoration, and protected authentication behavior.
- Diff check: Passed before this final documentation-only update.

### Manual Verification Instructions

Run these commands on the Fedora development machine from the repository root. Ensure PostgreSQL is running and `.env` contains the development `DATABASE_URL` and `AUTH_ALLOWED_ORIGINS=http://localhost:5173`.

Terminal 1:

```sh
cd /home/sofie/work/projects/heisenberg_logistics/src/api
bun run dev
```

Terminal 2:

```sh
cd /home/sofie/work/projects/heisenberg_logistics/src/web
bun run dev
```

Open `http://localhost:5173/` and verify:

1. Register a new account with a unique email and a password between 12 and 128 characters. Confirm the authenticated landing screen displays the normalized email.
2. Refresh the page. Confirm the authenticated state is restored through `/api/auth/me`.
3. Click **Log out**. Confirm the login form returns.
4. Refresh the page. Confirm the user is unauthenticated.
5. Log in again with the same credentials. Confirm the authenticated landing screen returns.

Optional API smoke checks, using a separate terminal:

```sh
COOKIE_JAR=/tmp/heisenberg-auth.cookies
EMAIL="auth-check-$(date +%s)@example.test"
PASSWORD='HeisenbergTest123!'

curl -i -c "$COOKIE_JAR" \
  -H 'Origin: http://localhost:5173' \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  http://localhost:5173/api/auth/register

curl -i -b "$COOKIE_JAR" http://localhost:5173/api/auth/me

curl -i -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H 'Origin: http://localhost:5173' \
  -X POST http://localhost:5173/api/auth/logout

curl -i -b "$COOKIE_JAR" http://localhost:5173/api/auth/me
```

Expected API results are `201` for registration, `200` for authenticated `/me`, `204` for logout, and `401` for `/me` after logout. The registration response must not expose a password hash or raw session token. To verify Origin rejection, repeat registration or login with `-H 'Origin: http://malicious.invalid'` and expect `403`.

### Files Changed

- `packages/db/src/schema.ts`, `packages/db/src/index.ts`, and the generated Drizzle migration metadata.
- `packages/contracts/src/index.ts`.
- `src/api/src/auth.ts`, `src/api/src/auth.test.ts`, `src/api/src/index.ts`, and `src/api/package.json`.
- `src/web/src/App.tsx` and `src/web/package.json`.
- `bun.lock` and `.env.example`.
- Authentication checkpoint, feature, and task documentation.

### Known Issues

- Registration and login rate limiting is not implemented because no approved dependency or infrastructure decision exists. Authentication is explicitly local-development-only and must not be described as production-ready until this is resolved.
- Earlier verification attempts recorded two environmental or dependency issues: host Bun was unavailable, and the initial typecheck lacked direct workspace dependencies. Both were resolved for the final checks by using the Bun 1.4.4 container and correcting package manifests.

### Resume Instructions

- Do not rerun the completed typecheck, test, build, migration, or diff checks solely to reproduce this handoff.
- Authentication is complete for local development; continue with the Application Shell task.
- Do not recreate or overwrite the existing equipment table or migration history, and do not implement Profile, Dashboard, Recipe Management, Equipment Management, or Session Management in this task.
