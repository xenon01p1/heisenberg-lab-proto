# Feature: Authentication
**Status:** Proposed for detailed approval; scope approved by CP-003.

## Overview
Persistent account registration, login, logout and current-account retrieval for the application.
## Goals
Users can create an account, securely authenticate and access their own data.
## Scope
In: register, login, logout, authenticated `me`, protected app routes, server-managed sessions. Out: OAuth, email verification, password reset, multi-factor authentication, roles unless approved separately.
## User workflow
Register with email/password -> receive authenticated session -> use app -> log out -> log back in. Invalid credentials show a generic error.
## Business rules
Email uniqueness (case-normalized); password hashes only; session token is opaque and server-revocable; authorization derives from verified session; protected APIs reject unauthenticated access. CSRF and cookie policy must be specified for actual deployment topology. Rate limits or documented dev-only limitation required before public exposure.
## Functional specifications
- AUTH-001 Register valid new account; reject invalid/duplicate email.
- AUTH-002 Log in with valid credentials; reject invalid credentials without exposing whether account exists.
- AUTH-003 Return authenticated user from server session.
- AUTH-004 Log out and revoke server-side session.
- AUTH-005 Redirect/guard protected UI; server independently protects API.
## Technical touchpoints
React: registration/login and protected navigation. Hono: proposed `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`. Zod: request/response schemas. Drizzle: `users`, `auth_sessions` (names proposed, schema review required). Password hashing and cookie/CSRF approach must be approved.
## Acceptance criteria
Register/login/logout flows work end-to-end; password never stored plaintext; invalid sessions denied; user A cannot access user B's records; auth cookie HttpOnly; tests for validation, duplicate email, session expiry/revocation and access control.
## Expected outputs
Functional login/register screens, persisted accounts and revocable sessions.
## Implementation status
Not started.
## Open questions
Email verification deferred? Password minimum? Same-origin deployment? Cookie and CSRF design? Rate limit approach?
