# Reviewer handoff — the D3b brief, the pre-dispatch gate (a brief handoff: no implementation to review)

Brief HEAD: e0d1a3a (the commit that carries `docs/prompts/tasks/D3b-session-card-admission.md`). Respond in `responses/e0d1a3a.md`. D3b is your required change on D3a (`responses/c8717be.md`), written from that finding and posted for the pre-dispatch read the owner asks for on every brief.

## What is asked

A pre-dispatch read: is one exported admission over D3a's `unapprovedMusic`, applied at `session.ts`'s `usable()` (the filter the `runs`, `done` and `measure` pools, the fallback's `choose()` and the exposure rule already share) plus the jam slot's own pick, the single-sourced route you asked for; is "a row omitted or filled by an already-valid alternative, a `done` requirement left visibly unmet" the right reading of your item 4; and do the per-path regressions (`null` and `false` excluded, `true` restored, drills and notated items unchanged, the D3a card probe rerun) cover the paths you listed.

## Files to inspect, in order

1. `docs/prompts/tasks/D3b-session-card-admission.md`.
2. `app/src/curriculum/session.ts` (`wantsOf` at 738, `fallbackStep` at 897 with its `rung` and `prerequisite` steps, `exposure` at 1018, the jam pick near 1247–1266, `usable()`), `app/src/curriculum/eligibility.ts` (`unapprovedMusic` at 278).

## Decisions the orchestrator made, for the reviewer to accept or overturn

- The admission is exported from `eligibility.ts` over the existing helper; `eligibleFor` keeps using the same reading; no second definition.
- It is applied at `usable()` so the shared paths change no logic of their own, and at the jam slot's pick; the builder tables every direct path and adds the call where a path bypasses `usable()`.
- A row with no admitted candidate is omitted or falls to the next fallback step; a `done` requirement naming an unadmitted item stays unmet; the entry lists the rungs affected on the merged build.
- The Library, exploration, the swap sheet and the rung lists are untouched.

## Questions for the reviewer

1. If `usable()` turns out to serve a path that is not an automatic offer (a check the card runs for display only), should the admission still sit there, or at each offering path's own filter?
2. A `done` requirement naming an unadmitted groove leaves its rung's row unmeetable until a decision exists. Say so on the card ("waiting for review") or simply omit the row?

## Do not re-review

D3a (`responses/c8717be.md`); the D3a brief (`d483be4.md`); D3 (`ee70b43.md`); the D4 brief and scoping; the E1 brief; every closed seam. E1 gets its own handoff when it lands.
