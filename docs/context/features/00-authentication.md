# Feature: Authentication
**Status:** Implemented for local development; rate limiting remains required before public deployment.

## Overview
Persistent account registration, login, logout and current-account retrieval for the application.
## Goals
Users can create an account, securely authenticate and access their own data.
## Scope
In: register, login, logout, authenticated `me`, protected app routes, and server-managed PostgreSQL sessions. Out: OAuth, email verification, password reset, multi-factor authentication, and roles unless approved separately.
## User workflow
Register with email/password -> receive authenticated session -> use app -> log out -> log back in. Invalid credentials show a generic error.
## Business rules
Normalize email by trimming whitespace and converting to lowercase. Accept passwords from 12 through 128 characters. Hash passwords only with Bun's Argon2id configuration from CP-004. Store only hashes of opaque session tokens in PostgreSQL; sessions expire after 7 days and may coexist per user. Cookies are HTTP-only, host-only, `SameSite=Lax`, and `Secure` in production/HTTPS. Validate Origin on browser state-changing requests and reject missing or unapproved Origin. Authorization derives from the verified session; protected APIs reject unauthenticated access.
## Functional specifications
- AUTH-001 Register a valid new account; reject invalid input and return HTTP 409 for a normalized duplicate email without creating an account or session.
- AUTH-002 Log in with valid credentials; reject invalid credentials without exposing whether account exists.
- AUTH-003 Return the authenticated user from the server session through canonical `GET /api/auth/me`.
- AUTH-004 Log out and revoke server-side session.
- AUTH-005 Redirect/guard protected UI; server independently protects API.
## Technical touchpoints
React: registration/login and protected navigation. Hono: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`. Zod: request/response schemas. Drizzle: `users`, `auth_sessions` (names proposed, schema review required). Bun Test: authentication tests. Exact production origin is deployment configuration; same-origin HTTPS is the V1 assumption.
## Acceptance criteria
Register/login/logout flows work end-to-end in the local browser; password is never stored plaintext; invalid sessions are denied; user A cannot access user B's records; the auth cookie is HttpOnly; and tests cover validation, duplicate email, session expiry/revocation, and access control.
## Expected outputs
Functional login/register screens, persisted accounts and revocable sessions.
## Implementation status
Implemented and verified through API checks, TypeScript/build checks, database verification, and owner-confirmed local browser verification.

## Achievements
- Added PostgreSQL-backed `users` and `auth_sessions` persistence without replacing existing data or migrations.
- Added Hono registration, login, logout, and current-user behavior with the CP-004 security policy.
- Added React authentication screens, session restoration, logout, responsive styling, and local API integration.
- Recorded owner confirmation that registration, login, refresh/session restoration, logout, and protected authentication behavior work in the local browser.
- Rate limiting remains intentionally deferred and is a blocker before public deployment.

## Verification
- Bun Test: 8 authentication tests passed with 25 expectations.
- TypeScript and production build passed.
- PostgreSQL migration and database health were verified.
- Owner confirmed local browser authentication behavior.
## Open questions
What approved rate-limiting or abuse-control policy is required before public exposure? What exact production hostname will be placed in the Origin allowlist?
