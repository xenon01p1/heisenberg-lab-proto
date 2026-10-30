# Feature: User Profile
**Status:** Proposed.

## Overview
Authenticated user can view account details through a profile page and menu.
## Goals
Give users visibility into their account and a consistent account entry point.
## Scope
In: profile view; profile menu. Out: password reset, avatar upload, email change and other edits until approved.
## User workflow
Open profile menu -> My Profile -> view account details -> return to app or log out.
## Business rules
Only authenticated user may access own profile; never expose password hash, auth session token, or private account fields not required by UI.
## Functional specifications
- PROFILE-001 Fetch current user's safe profile.
- PROFILE-002 Show email, display name, creation date (pending field approval).
- PROFILE-003 Handle loading, empty and error states.
## Technical touchpoints
React profile page, Hono proposed `/api/profile` or reuse `/api/auth/me` (choose one), Zod public profile response, users table.
## Acceptance criteria
Own profile loads; other accounts cannot be fetched; no secret fields exposed; UI tests and API auth tests.
## Expected outputs
Profile menu and page.
## Implementation status
Not started.
## Open questions
Editable display name? Email/password change? Avatar?
