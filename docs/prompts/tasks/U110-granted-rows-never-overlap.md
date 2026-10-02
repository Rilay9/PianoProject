# U110 — rows the window grants never overlap at the frozen size (a narrow correctness seam)

**The learner problem.** On the owner's phone held upright (360 × 780), Ode to Joy (hands together) draws three rows at the two-row scale, so each row's chord symbols and fingering land inside the row above (`docs/review/walks/walk-2026-10-02.md` finding 2; `docs/prompts/runs/walk-2026-10-02/360x780/08-playing.png`). A page whose systems overlap is unreadable; a teacher would refuse it.

**The evidence.** Six of six probe reloads and three walk runs at 360 × 780 overlapped; the first load in a fresh browser, 342 × 740 and sideways were clean. U110 was recorded as a gallery race (`end-of-piece--grand-staff`, 1 of 2 runs on U32's tree); the reviewer reclassifies it as a live rendering and read-ahead defect (`responses/9e14839e.md` §3). Provenance: unknown; the walk did not compare an older tree.

**The ruling** (`responses/9e14839e.md` §3): rows granted by the window plan may never geometrically overlap at the current frozen notation size. Do not fix it by shrinking the staff below the accepted reading floor or by removing useful look-ahead unconditionally. This lane alone owns the overlap fix; U122 + CL07's Score model uses its case as an acceptance cell and does not fix it again.

## Hypothesis and its refuting test

**Hypothesis** (the walker's, inferred from `WindowRenderer.ts` `aheadFor` and `packSlots`): the greyed look-ahead row is granted when it is priced at `drawnRowPx` (the "costs the window nothing" rule); the stage is then divided among three rows while the rows keep the two-row scale, so each row's real ink (about 261 px a row on a 190 px pitch in the walk) exceeds its slot. The reload dependence suggests the price is taken from a stale or different measurement on a reload than on a fresh load. **Refuting test:** at 360 × 780 on fresh loads and reloads, record for each granted row its priced height, its slot pitch and its drawn ink extent; the hypothesis holds if overlap occurs exactly when drawn ink exceeds the slot pitch and the priced height disagrees with the drawn row. If overlap appears with priced and drawn heights agreeing, the cause is elsewhere: find it before fixing.

## What to build

After the mechanism is shown: make the plan never grant a row whose drawn ink cannot fit its slot at the frozen size, measured from the drawn notation (chord symbols and fingering included), not an estimate. When a third row cannot fit, the window keeps two rows at that size (or the plan's other valid outcome) rather than overlapping; it never shrinks below the floor. The fresh-load and reload paths must agree. Red first at 360 × 780 on reload; green after on fresh loads and reloads; the existing window-rule and gallery cases stay green, and the look-ahead row still appears wherever it fits.

## Rules

`operating-procedure.md` §14; this lane's port is **5423** from a config copy under `app/build/u110/`. Keep the change inside the window plan's granting and pricing; U122 + CL07's chrome model is being decided separately and this fix must hold under any chrome. Every acceptance case by layer, every item done or a not-done line, judgement first, with pictures before and after at 360 × 780 that a reader can compare.

**Landed 2026-10-01** (Entry 212; bbbdffb0, merged 407d58e1); handoff `handoffs/bbbdffb0.md`.

## Record

lane: U110 · closes: U110 · entry: 212
index: Rows the window grants never overlap at the frozen size: the 360 × 780 reload overlap traced to its pricing mechanism and fixed in the window plan (`U110-granted-rows-never-overlap.md`) | app | drafted 2026-10-02 (`U110-granted-rows-never-overlap.md`); Entry 212
in-flight: drafted 2026-10-02 (`U110-granted-rows-never-overlap.md`): the walk's 360 × 780 row overlap, mechanism first, then the window plan's granting fixed (Entry 212)
state: dispatched 2026-10-02: dispatched at 3461cba9, debugging (Entry 212)
- landed 2026-10-01: merged 407d58e1; handoff `handoffs/bbbdffb0.md`
- verdict 2026-10-02: APPROVE WITH ONE REQUIRED CHANGE (`responses/bbbdffb0.md`): the zoom gate accepted as the mechanism; the terminal exception after the spent ladder is unearned (measured look-ahead is not overflowing packing) and is pruned unless a residual overlap earns it, carried by U110a (Entry 218); the unit lane is not relabelled green
