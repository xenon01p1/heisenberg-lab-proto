# UI Context — Heisenberg Lab

**Status:** Creative direction proposal, not an approved component library or pixel-perfect design specification.

## Experience goal
Build a distinctive, polished **fictional laboratory control-room** interface for a turn-based cooking-session simulator. The UI should feel like an operational dashboard, not a drug manufacturing tutorial or a generic admin template. Prioritize clarity, feedback, and easy-to-follow session progression.

## Visual direction
- Mood: restrained industrial, cinematic, scientific-fiction dashboard.
- Possible palette: dark charcoal, muted teal/green, warm amber for warnings, and restrained red for errors; final tokens are not yet approved.
- Typography: legible, utilitarian, with a clear hierarchy and readable numbers.
- Use subtle borders, status chips, timelines, and restrained motion rather than decorative effects.
- Avoid copying copyrighted show logos, exact screen designs, or promotional assets.
- Avoid real chemical formulas, precursor diagrams, or actionable drug-production visuals.

## Primary screens (MVP proposals)
1. **Sessions:** list sessions, their current states, operator, recipe, and last activity; create a new session.
2. **Session detail / simulator:** display current abstract step, progress, event messages, available actions, and confirmation for irreversible actions.
3. **Session report:** final fictional score, step history, event timeline, and summary of decisions.

Recipe selection may be part of session creation rather than a separate page. Do not invent additional routes without a task.

## Interaction rules
- Show only actions relevant to the current state; still handle server rejection gracefully.
- Clearly distinguish `RUNNING`, `PAUSED`, `COMPLETED`, `ABORTED`, and `FAILED` **if these states are approved in business rules**.
- Make irreversible actions (such as abort) explicit and confirm them where appropriate.
- After a mutation, refresh or reconcile displayed server state; never pretend a failed action succeeded.
- Provide clear progress and event feedback without requiring live timers in MVP.
- Avoid relying solely on color to communicate status.

## Accessibility and responsiveness
- Use semantic HTML, labeled controls, keyboard-operable interactions, visible focus, and sufficient contrast.
- Support desktop as the primary experience while remaining usable on narrower screens.
- Respect reduced-motion preferences; keep animations optional and informative.
- Provide accessible validation and error messaging.

## UI component discipline
- Start with small local components; extract shared components only when genuinely repeated.
- Do not introduce a UI kit, icon library, charting library, CSS framework, or design system without approval.
- Prefer clear labels over clever microcopy; display “Quality score” rather than implying real chemical purity.
- Seed demo content with fictional, non-sensitive data.

## UI acceptance checklist
A new or changed screen must: reflect approved business rules; show appropriate empty/loading/error states; support keyboard navigation; not expose server secrets; and be understandable without knowledge of Breaking Bad.

## Open decisions
Exact layout, branding, component/styling tools, routing, visual tokens, and responsive breakpoints require owner review. Agents may propose mockups or options but must not treat proposals as approvals.
