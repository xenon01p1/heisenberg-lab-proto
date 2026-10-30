# Feature: User Profile
**Status:** Implemented and verified for local development.

## Overview
Authenticated user can view account details through a profile page and menu.
## Goals
Give users visibility into their account and a consistent account entry point.
## Scope
In: read-only profile view integrated into the authenticated shell, authenticated account email, account creation date, session refresh/error handling, profile menu entry, and logout access. Out: password reset, avatar upload, email change, display-name editing, password change, and other edits until approved.
## User workflow
Open the authenticated account menu -> choose My Profile -> retrieve the current account through `GET /api/auth/me` -> view safe account details -> return to shell navigation or log out.
## Business rules
- Only the authenticated account may view its profile; identity comes from the verified server session.
- The profile uses the canonical `GET /api/auth/me` endpoint and the shared `PublicUser` contract.
- Display only safe account fields required by the V1 view: email and account creation date. The account ID may remain an internal safe contract field and is not required in the UI.
- Never expose password hashes, raw session tokens, or unapproved private fields.
- A missing, expired, or revoked session returns the user to the unauthenticated Authentication UI.
- Profile editing remains out of scope until owner approval defines editable fields and validation rules.
## Functional specifications
- **PROFILE-001:** Open Profile from the authenticated shell account menu or sidebar.
- **PROFILE-002:** Fetch the current user's safe profile through `GET /api/auth/me`.
- **PROFILE-003:** Show the normalized authenticated email and account creation date.
- **PROFILE-004:** Handle loading, API error, malformed response, expired session, and unauthenticated states.
- **PROFILE-005:** Preserve the existing shell navigation and logout behavior.
## Technical touchpoints
React profile view in `src/web`, existing Hono `GET /api/auth/me`, shared Zod `publicUserSchema`/`authResponseSchema`, and existing `users` persistence. No new Hono route, database table, migration, or dependency is required.
## Acceptance criteria
- [ ] Authenticated Profile opens from the shell account menu and sidebar.
- [ ] Profile displays the real authenticated email and account creation date.
- [ ] Profile uses `GET /api/auth/me` and does not introduce a duplicate profile endpoint.
- [ ] Expired/revoked/unauthenticated sessions do not display profile data and return to Authentication.
- [ ] Loading, malformed response, API error, and retry states are controlled and accessible.
- [ ] Password hashes, session tokens, and unapproved account fields are never rendered.
- [ ] Responsive styling is consistent with the existing shell.
- [ ] Relevant API and frontend-side tests/checks are recorded.
- [ ] No unrelated feature, migration, dependency, or Authentication behavior changes.
## Expected outputs
Profile menu and page.
## Implementation status
Implemented and verified in the local browser. V1 is read-only because editable profile fields remain undecided.

## Achievements
- Integrated Profile into the authenticated shell sidebar and account menu.
- Displayed the real authenticated email and account creation date from `GET /api/auth/me`.
- Added loading, malformed-response, API-error, retry, and expired-session handling.
- Preserved Authentication and Application Shell behavior without database or migration changes.

## Verification
- Bun Test, TypeScript, and production build passed.
- Owner confirmed Profile works correctly in the local browser.
## Open questions
Owner approval is still required for editable display name, email change, password change, avatar, and any additional account fields.
