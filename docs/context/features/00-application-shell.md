# Feature: Authenticated Application Shell
**Status:** Proposed.

## Overview
Shared React layout and navigation for authenticated application screens.
## Goals
Consistent access to dashboard, recipes, equipment, sessions, reports when implemented, and profile menu.
## Scope
In: responsive layout, navigation, account menu, route protection, loading/empty/error treatment. Out: new business APIs, charts, unapproved UI frameworks.
## User workflow
Log in -> see app shell -> navigate between implemented pages -> open profile menu -> log out.
## Business rules
Never display a fake working link to an unimplemented feature; protected content waits for auth check; logout clears authenticated UI state.
## Functional specifications
- SHELL-001 Navigation to implemented pages.
- SHELL-002 Profile menu with profile and logout actions.
- SHELL-003 Redirect unauthenticated users to login; API enforces authorization separately.
- SHELL-004 Responsive, keyboard-operable, accessible controls and states.
## Technical touchpoints
React in `src/web`; shared auth contract; no database changes unless separately approved. Router/styling dependencies need owner approval.
## Acceptance criteria
Keyboard navigation, correct active page, protected route behavior, logout flow, mobile usability.
## Expected outputs
Working application layout.
## Implementation status
Not started.
## Open questions
Router, styling approach, navigation labels, reports visibility before implemented.
