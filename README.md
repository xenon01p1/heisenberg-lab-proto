# Heisenberg Logistics — Full-stack V1 documentation transition

This package is a **documentation change proposal**, not a ready-to-run implementation. It intentionally avoids replacing canonical documents wholesale because the existing versions have important rules that must be preserved and reconciled.

## Add
- `docs/context/checkpoints/CP-003-full-stack-v1-scope.md`
- `docs/context/features/00-authentication.md`
- `docs/context/features/00-application-shell.md`
- `docs/context/features/00-user-profile.md`
- `docs/context/features/00-dashboard.md`
- Four corresponding `docs/context/tasks/ongoing/TASK-00-*.md` files.

## Read and give to agent
- `AGENT-HANDOFF.md` — specific instructions, security requirements, canonical files to amend, order, unresolved decisions.

## Existing files to UPDATE, not overwrite blindly
- `AGENTS.md` (minimal amendment only)
- `docs/context/business-rules.md`
- `docs/context/database-design.md`
- `docs/context/api-contracts.md`
- `docs/context/ui-context.md`
- `docs/context/feature-documentation-rules.md`
- `docs/context/features/01-recipe-management.md`, `02-equipment-management.md`, `03-session-management.md`
- `docs/context/tasks/ongoing/TASK-01-recipe-management.md`, `TASK-02-equipment-management.md`, `TASK-03-session-management.md`

## Note
The uploaded documents disagree on operators/equipment/auth and include unapproved state/quality decisions. The agent must present a documentation diff and request owner approval before writing application code. If any numbered `00-*` files already exist, reconcile rather than overwrite.
