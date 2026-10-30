# TASK — Application Shell
**Status:** Completed for local development.
**Feature:** ../../features/00-application-shell.md
**Dependency:** Authentication first; shell/profile/dashboard after authentication (shell before dashboard).

## Objective
Implement the authenticated React application shell that frames future application features without implementing their domain behavior.

## Before coding
Read AGENTS.md, CP-003, CP-004, UI context, the shell feature specification, Authentication tasks, and the actual repository. Preserve the approved Authentication behavior. Do not infer domain feature behavior or add routing/UI dependencies.

## Work breakdown
1. Inspect and preserve the existing authenticated React flow.
2. Implement the shell in `src/web` using local React state and existing CSS.
3. Add responsive sidebar, mobile navigation, header, account menu, active indicators, placeholders, and protected loading/error states.
4. Preserve the existing `/api/auth/me` and `/api/auth/logout` behavior; do not add domain API or database work.
5. Run affected TypeScript checks, production build, and available focused verification.
6. Update this task and the shell feature with actual results; move to `done/` only when acceptance criteria are verified.

## Acceptance criteria
- [x] Authenticated users see the responsive application shell after session restoration.
- [x] Sidebar navigation includes Dashboard, Profile, Recipes, Equipment, and Sessions placeholders.
- [x] Active navigation state is clear and placeholder content identifies the selected area.
- [x] Header shows Heisenberg Logistics and an accessible user menu.
- [x] User menu shows the authenticated account and performs logout through Authentication.
- [x] Mobile navigation opens/closes accessibly and does not require a new dependency.
- [x] Loading, authentication error, and logout error states are visible and controlled.
- [x] Unauthenticated users do not see protected shell content.
- [x] Existing Authentication behavior and security decisions are unchanged.
- [x] TypeScript, build, and relevant verification results are recorded.
- [x] Domain Dashboard, Profile, Recipe, Equipment, and Session features are not implemented here.

## Testing requirements
- Run the existing repository TypeScript check after shell changes.
- Run the production build after shell changes.
- Verify authenticated shell rendering, active placeholder navigation, account menu, logout, mobile menu behavior, loading state, and unauthenticated state in the local browser if available.
- Do not add another test framework or claim browser verification without actual evidence.

## Implementation Progress

**Status:** COMPLETED

### Completed

- Read the governing instructions, approved checkpoints, UI context, Authentication documentation, and current repository implementation.
- Confirmed Authentication is complete for local development and its tasks are being finalized separately.
- Reconciled the existing shell feature and task specifications with the requested scope.
- Implemented the protected shell in `src/web/src/App.tsx` with Dashboard, Profile, Recipes, Equipment, and Sessions placeholders.
- Added responsive sidebar/mobile navigation, active indicators, application header, authenticated user menu, logout action, and loading/error-safe shell states.
- Extended the existing CSS with responsive shell styling, focus states, reduced-motion handling, and mobile drawer behavior without adding dependencies.

### In Progress

- None.

### Remaining

- Keep domain features out of this shell task.

### Last Verification

- TypeScript: Passed with the repository's Bun 1.4.4 container; all four workspace typecheck tasks passed.
- Tests: No shell-specific test framework is configured; browser verification pending.
- Build: Passed with the repository's Bun 1.4.4 container; the web production build completed successfully through Turbo.
- Browser: Owner confirmed local browser session restoration, responsive navigation, active placeholders, account menu, and logout.

### Files Changed

- `docs/context/features/00-application-shell.md`
- `docs/context/tasks/ongoing/TASK-00-application-shell.md`
- `src/web/src/App.tsx`
- `src/web/src/styles.css`

### Known Issues

- Domain feature pages are placeholders by design.
- Authentication rate limiting remains a public-deployment limitation.
- The shared browser tool remains unavailable in this environment; owner confirmation is the browser verification record.

### Resume Instructions

- Continue from the existing `src/web/src/App.tsx` and `src/web/src/styles.css`; do not recreate Authentication or add domain APIs.
- Update this section after each meaningful implementation or verification milestone.
- Shell is complete for local development; continue with the User Profile task.
