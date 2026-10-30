# Feature: Authenticated Application Shell
**Status:** Implemented and verified for local development.

## Overview
Shared React layout and navigation for authenticated application screens.
## Goals
Provide a reliable authenticated workspace frame that makes the future application areas discoverable, keeps account actions visible, and remains usable on desktop and mobile.
## Scope
In: responsive sidebar navigation, application header, authenticated account menu, logout, active navigation indicators, mobile navigation, protected shell entry, session restoration, loading/error states, and placeholder views for Dashboard, Profile, Recipes, Equipment, and Sessions. Out: domain data, domain APIs, database changes, charts, routing framework, and unapproved UI frameworks.
## User workflow
Log in or restore an existing server session -> see the protected application shell -> select a navigation placeholder -> open the account menu -> review the authenticated email -> log out.
## Business rules
- The shell renders only after the canonical `/api/auth/me` check confirms a valid server session.
- Unauthenticated users remain on the Authentication UI; client state is not authorization.
- Navigation placeholders clearly identify areas that are not implemented and do not fabricate domain data or actions.
- The account menu displays the authenticated account email and uses the existing logout behavior.
- Logout invalidates the server session through Authentication and clears the shell locally only after the response is handled.
- The selected navigation item is UI state only until feature-specific routing is approved.
## Functional specifications
- **SHELL-001:** Render a protected application shell for the authenticated account.
- **SHELL-002:** Provide Dashboard, Profile, Recipes, Equipment, and Sessions navigation placeholders with one active indicator.
- **SHELL-003:** Provide a responsive sidebar that collapses behind a mobile menu control on narrow screens.
- **SHELL-004:** Provide a header with the application name and an accessible account menu showing the authenticated email and logout action.
- **SHELL-005:** Restore authentication through `GET /api/auth/me`; show loading and recoverable error states without exposing secrets.
- **SHELL-006:** Keep unauthenticated users in the existing login/register experience and never treat a client-selected navigation item as authorization.
## Technical touchpoints
React in `src/web`, existing `PublicUser` contract, and the existing Authentication fetch/logout behavior. No Hono API, Zod, PostgreSQL, Drizzle, or migration changes are required. Use local React state and existing CSS; do not add a router or UI library for this shell.
## Acceptance criteria
- [ ] Authenticated users see a responsive shell with sidebar and header.
- [ ] Header displays the application name and authenticated account menu.
- [ ] Account menu displays the authenticated email and logs out through the existing Authentication endpoint.
- [ ] Dashboard, Profile, Recipes, Equipment, and Sessions placeholders are visible in navigation.
- [ ] The selected item has a clear active indicator and placeholder content identifies the selected area.
- [ ] Mobile navigation can be opened and closed with keyboard-operable controls.
- [ ] Loading, session-restoration error, and logout-error states are controlled and accessible.
- [ ] Unauthenticated users never see protected shell content after `/api/auth/me` returns 401.
- [ ] Existing Authentication functionality and security behavior remain unchanged.
- [ ] TypeScript checks and production build pass; relevant tests or verification results are recorded.
## Expected outputs
Working authenticated application layout with responsive navigation, account menu, placeholders, and protected session restoration.
## Implementation status
The shell UI is implemented and the owner confirmed local browser verification. The shell is intentionally a UI frame; domain feature pages remain unimplemented.

## Achievements
- Implemented protected authenticated shell rendering after server session restoration.
- Added responsive sidebar, mobile navigation drawer, active indicators, application header, account menu, and logout action.
- Added clear placeholders for Dashboard, Profile, Recipes, Equipment, and Sessions without implementing their domain behavior.
- Added accessible loading, error, focus, and reduced-motion treatment using existing CSS.

## Verification
- TypeScript check passed.
- Production build passed.
- Owner confirmed local browser verification of the authenticated shell, responsive navigation, account menu, placeholders, and logout.
## Open questions
Feature-specific routing and the final visual token system remain open for later approval. This task uses local UI state and existing CSS only.
