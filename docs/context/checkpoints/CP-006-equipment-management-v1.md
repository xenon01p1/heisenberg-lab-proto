# CP-006 — Equipment Management V1

**Status:** Approved by owner on 2026-10-30

## Approved decisions

- Equipment inventory belongs to the authenticated user who creates it.
- Owners can create, read, update, and delete their own equipment.
- Each item has a required name, type label, condition label, and boolean availability flag.
- Type and condition are validated labels in V1; no enumerated vocabulary or maintenance workflow is introduced.
- `available` describes inventory availability only. It does not reserve equipment for a session.
- List and detail queries are authenticated and owner-scoped.
- Reservation, release, occupancy, concurrency, and session lifecycle integration are deferred to Session Management.
- Existing equipment data and migration history must be preserved. The migration is additive and the current equipment table was verified empty before adding required ownership and inventory columns.

## API decisions

- `GET /api/equipment` lists the authenticated user's equipment.
- `POST /api/equipment` creates an owned equipment item.
- `GET /api/equipment/:id` returns one owned item.
- `PATCH /api/equipment/:id` updates an owned item.
- `DELETE /api/equipment/:id` deletes an owned item.
- Unknown or inaccessible IDs return `404 NOT_FOUND`.
- Invalid request data returns `400 VALIDATION_ERROR`.

## Consequences

The earlier global catalog-only equipment scaffold is superseded for Equipment Management V1. The existing integer identity IDs remain for data compatibility. Session Management must define any reservation/release behavior before using `available` as an occupancy decision.
