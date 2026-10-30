# CP-004 — Authentication Security and Session Policy

- **Date:** 2026-10-30
- **Status:** APPROVED
- **Decision owner:** Project owner
- **Scope:** Authentication implementation only. This checkpoint does not authorize Profile, Dashboard, Recipe Management, Equipment Management, Session Management, or simulation-engine work.
- **Related checkpoint:** CP-003 — Full-stack application scope and database-backed authentication.

## Context
CP-003 approves real PostgreSQL-backed email/password authentication, but leaves the security and deployment details below unresolved. This checkpoint makes those details explicit before implementation. It preserves the approved Bun, Hono, React, Zod, Drizzle/Drizzle Kit, PostgreSQL, and existing `packages/` / `src/` repository structure. It does not approve an authentication framework.

## Approved checkpoint decisions

### 1. Registration and login
- `POST /api/auth/register` accepts email and password, validates both with Zod, normalizes the email for uniqueness, creates a `users` row, creates a server-side authentication session, and returns a safe public user shape.
- `POST /api/auth/login` accepts email and password, verifies the password hash, creates a server-side authentication session, and returns the same safe public user shape.
- Invalid login credentials use one generic failure response and do not reveal whether the email exists.
- Authentication responses never include `password_hash`, raw session tokens, or other secret fields.
- Email verification, password recovery, MFA, OAuth, roles, and account editing remain out of scope.

### 2. Password hashing
- Store passwords only with Bun's supported `Bun.password.hash` Argon2id API. Use this exact configuration:
  ```ts
  await Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536, // KiB
    timeCost: 2,
  });
  ```
  Bun generates the unique salt and encodes the PHC hash with parallelism `p=1`; verification uses `Bun.password.verify(password, storedHash)`.
- Never log, persist, return, or compare plaintext passwords outside the hashing/verification operation.
- Hashing parameters must remain explicit in code; do not silently substitute bcrypt, reversible encryption, or a custom password algorithm. Do not add an authentication framework or hashing dependency.

### 3. PostgreSQL-backed authentication sessions
- Persist sessions in `auth_sessions` with a user foreign key, a hash of an unpredictable opaque token, creation time, expiration time, and nullable revocation time.
- Store only the token hash in PostgreSQL. The raw token is sent only through the approved cookie and is never logged or returned in JSON.
- Authentication middleware verifies the cookie token by hashing/looking up the token, checking expiration and revocation, and attaching the verified account identity to the request context.
- Logout revokes the current server-side session. It must also clear the browser cookie using matching cookie attributes.
- Every session expires exactly 7 days after creation. Login and registration may create additional concurrent sessions for the same user. No rolling extension is used in V1.

### 4. HTTP-only cookie policy
- Use an opaque session cookie with `HttpOnly` enabled.
- Use `Secure=false` only for local HTTP development at the approved localhost origin. `Secure=true` is mandatory in production and whenever HTTPS is used.
- Use `SameSite=Lax` in V1.
- Use a host-only cookie: set `Path=/`, omit `Domain`, and set `HttpOnly=true`. Set `Max-Age=604800` and/or `Expires` to the same 7-day lifetime as the database session.
- Do not store bearer tokens in localStorage, sessionStorage, or browser-accessible application state.

### 5. Origin assumptions and CSRF protection
- Development uses the existing Vite origin `http://localhost:5173`; browser API calls use the existing `/api` proxy to the Hono server on `http://localhost:3000`. The browser-facing authentication origin is therefore `http://localhost:5173`.
- Recommended production deployment is same-origin: the React application and `/api` are served behind one HTTPS origin. The exact hostname is deployment configuration and must be an explicit allowed origin, never inferred from a request.
- Development allows only the browser origin `http://localhost:5173`; the existing Vite proxy forwards `/api` to Hono at `http://localhost:3000`, so the browser does not make a cross-origin API request.
- Every browser request that changes authentication state, and every future cookie-authenticated state-changing request, must validate `Origin` against the explicit allowlist. Missing, malformed, or unapproved Origin is rejected.
- Strict Origin validation is the V1 CSRF defense. No separate CSRF-token endpoint or token cookie is part of Authentication V1. Any alternative treatment for a missing Origin requires a separate documented security decision before implementation.
- If a separate production frontend/API origin is later required, pause for a deployment-specific checkpoint covering exact origins, cookie policy, CORS credentials, and CSRF validation.

### 6. Account ownership and protected endpoints
- `/api/auth/register` and `/api/auth/login` are unauthenticated endpoints; `/api/auth/logout` and `/api/auth/me` require a valid non-expired, non-revoked server session.
- Authentication middleware derives the account ID only from the verified session. Clients must not select an account with `userId` or use `operatorId` as authorization.
- Any protected endpoint introduced by the Authentication task must reject missing, expired, revoked, or invalid sessions with the approved `UNAUTHENTICATED` response.
- User-owned data access is out of scope for this task, but the ownership rule remains mandatory for later features: queries and mutations must scope through the authenticated account ID.

### 7. Registration validation and duplicate email handling
- Normalize email consistently before uniqueness checks and storage; the exact normalization rules must be documented in the Zod contract and tested.
- Reject malformed email and unacceptable password input without persisting an account or session.
- Enforce a password length from 12 through 128 characters inclusive; no additional composition rule is required by this checkpoint.
- Duplicate registration must not create a second account or a session and returns HTTP `409`. The public error code/message must be stable and must not include passwords, tokens, or database details. This explicitly accepts that registration may reveal an existing normalized email; login failures remain generic.

### 8. Logout and invalidation
- Logout is safe to repeat: an already revoked, expired, or absent session results in a cleared cookie and does not restore access.
- A revoked session cannot authenticate subsequent requests, even if its old cookie is replayed.
- Logout must not delete the user account or unrelated sessions unless a separate policy is approved.

## Required implementation boundaries
- Hono routes and middleware in `src/api`.
- Shared Zod request/response contracts in `packages/contracts`.
- Drizzle schema and later migration work in `packages/db`; no migration is authorized by this proposal.
- React registration/login and authentication-state UI in `src/web` only; no Profile, Dashboard, Recipe, Equipment, or Session feature implementation.
- No authentication framework, new router, UI library, or unrelated dependency is approved by this checkpoint.

## Required verification after approval
- Unit/service tests for email normalization, password validation, Argon2id hash/verify behavior, duplicate registration, generic login failure, expiration, revocation, logout replay, and cookie clearing.
- API tests for unauthenticated versus authenticated access, Origin validation, CSRF rejection, safe response shapes, and ownership identity derived from the session.
- React tests for registration/login validation, generic auth errors, authenticated state, and logout state clearing.
- Run Bun Test for Authentication; do not add another test framework silently.

## Remaining security limitations
- Registration/login rate limiting or an explicitly documented development-only limitation is still required before any public exposure. This checkpoint does not silently authorize a rate-limiting dependency or infrastructure.
- The exact production hostname must be supplied through deployment configuration before production launch and included in the Origin allowlist. Same-origin HTTPS remains the V1 topology assumption.
- Database schema approval and a non-destructive migration plan remain required before creating or migrating PostgreSQL tables.

## Owner decisions recorded for final approval
1. Email/password authentication with Bun's Argon2id API and the exact parameters above.
2. Seven-day fixed sessions, multiple concurrent sessions, HTTP-only host-only `SameSite=Lax` cookies, and production `Secure=true`.
3. Local browser origin `http://localhost:5173` with the existing Vite `/api` proxy; same-origin HTTPS production deployment as the assumption.
4. Strict Origin validation for browser state changes; missing or unapproved Origin is rejected, with no separate V1 CSRF-token mechanism.
5. Trim-and-lowercase email normalization and 12–128 character passwords.
6. Duplicate registration returns HTTP `409` and does not create an account or session.
7. `/api/auth/me` is the canonical current-user endpoint.
8. Bun Test is the approved authentication test runner.

After formal approval, mark CP-004 `APPROVED` and begin only TASK-00 Authentication implementation.
