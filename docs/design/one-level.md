# One level — CL17 Phase 1 design

Judgement: learners should choose a piece from its reading, rhythm, coordination and physical demands, and from why it belongs in their current work. An estimate remains an internal sort key with provenance; it does not rate their ability. This is a reading proposal, not built or visually verified.

Base: `dfda4d71a45b59b982a81072bb76a0b9d3e31245`. Inventory: `docs/prompts/runs/CL17/trace.md`.

## The two definitions and the surviving estimate

X37 (`docs/prompts/views/backlog/X.md:103`; `docs/prompts/runs/X31/latent-levels.txt`) distinguishes the **stored quarry estimate** from the **committed model evaluated on the row's own stored measured features**. The source record says 308/542 already disagree independently of the later opening-duration change, and 140/542 move at the next quarry. These are historical reported counts, not a new measurement in this lane.

Use the current committed estimator evaluated on canonical features under the measurement fingerprint for `levelEstimate.value`, with the committed model's version/fingerprint in provenance. Do not label copied quarry values as fresh measurements. `difficulty.py` and `score/difficulty.ts` retain the parity tests and existing feature differences; the estimate is derived from features, not a second analysis object. Human overrides can replace the ordering value with who/when provenance without altering features or measured demands. A generator's authored recipe level is not a human judgement: a generated notated item needs a measured model estimate; the generator options keep their own recipe semantics.

X37's three affected placements, unchanged by Phase 1:

| Piece | Rung | Historical value movement | Old stated band issue | Decision |
| --- | --- | --- | --- | --- |
| Shenandoah | chords-pop.4 | 2.45 → 2.25 | lower edge 2.45 | Keep placement pending demand-versus-taught assessment; do not widen a band to make the number pass. |
| When Johnny Comes Marching Home | 4.5 | 2.42 → 2.1 | lower edge 2.2 | Same: value alone cannot decide placement. |
| The Crave | latin.6 | 7.46 → 7.47 | upper edge 7.46 | Same: a hundredth-point movement is no curricular argument. |

The brief's widen-or-move alternatives are outdated under its own settled rule: an ineligible item needs a teaching/placement decision; an eligible item can stay regardless of scalar movement. No piece is moved here and no eligibility result for these pieces is claimed without the current measured input.

## R8: one admission truth, two different uses of bands

`validate.level_band_errors` (`validate.py:511–535`, called at :383) compares every listed option against an authored numeric interval and emits build errors. `core_reach_errors` (:590, called at :384) separately rejects core songs above stage+2 with family/plan exceptions. Both need explicit treatment; retaining reach while deleting bands retains a scalar gate.

The replacement asks the existing material gate's questions: can the learner at this rung cope with every measured demand, and does this item supply the claimed opportunity? `eligibility.ts` delegates to `candidates.ts`/`eligibilityCore.ts`; the Python counterpart is `untaught_options.table`, already exercised for parity by `test_untaught_options.py`. `validate.py:1673–1698` currently reports this as **warnings**, with runtime reading rows and recorded differences apart. Do not simply promote those warnings to errors: that silently removes curriculum options and turns known limitations into false certainty.

Proposed sequence: retire scalar membership/reach errors; generate demand-based placement diagnoses using the existing taught-at boundary and density semantics; review concrete refused/unknown options before adopting a build failure policy. Unknown measurement is not eligible by default and is not proof of untaught demands. Build policy must name how unknown rows and intentionally challenging placements are represented. Existing app admission remains unchanged until the teacher-facing placement decision is made.

`session.ts:1396,1532` uses bands only to rank already eligible candidates by distance. Replace these anchors independently with a documented ordering target from surviving estimates of rung-listed eligible material; use stable ID ordering when there is no estimate, not the numeric stage as disguised difficulty. This proposal needs review because it changes which equally eligible piece is offered first. `ShelfScreen.ts:139` uses the band to prefill a paper piece's estimate; remove that fabricated estimate rather than infer difficulty from a curriculum address.

## Slices, in dependency order

| Slice | Files | Red-first behavior | Falsifier / stop |
| --- | --- | --- | --- |
| 1. Contract and compatible reads | `curriculum/types.ts`, catalog schema, `common.py`, `score/difficulty.ts`, `difficulty.py`, import/override contracts | Legacy import and override retain identity/time; unknown legacy source cannot acquire invented model provenance; human override wins sort only; recipe level remains independent. | A compatibility read changes evidence, project identity or curriculum address. Stored-schema decision required before building. |
| 2. Content writers and measurement | `author.py`, `generate_exercises.py`, all `import_*.py`, `excerpts.py`, `pdmx/{index,quarry,commit,manifest}.py`, `build.py`, static/source JSON | Generated table lookup never claims human judgement; current features and estimate share fingerprint; excerpt uses cut features; one model fixture remains equal in Python/TS. | Any emitted row carries old writable scalar truth, invented provenance, or parent estimate on a cut. Re-quarry is X37, separately itemised. |
| 3. Stored migration and backup adapters | `db.ts`, `importStore.ts`, `levelOverrides.ts`, `booksStore.ts`, `folderLibrary.ts`, `backup.ts`, `load.ts`, assign/import sheets | Old backup restores one current estimate; override timestamp survives; imported/linked book identities and historical runs survive; folder index preserves unknown values; reload uses canonical field. | Both legacy/current values remain independently writable or restoration silently drops learner history. Migration is named, not built in Phase 1. |
| 4. Ordering and removal of scalar filters | `selectors.ts`, `session.ts`, `candidates.ts`, `LibraryScreen.ts`, `FolderScreen.ts`, `SkillsScreen.ts`, candidate/report tools | Changing an estimate alters order but never material admission; Library/folder no longer hide material by scalar band; missing estimate sorts stably; provenance alone does not rescue an unsafe item. | Candidate set changes in automatic admission merely because an estimate changed. Existing scalar search controls need demand/context replacements. |
| 5. Demand/context presentation | `widgets.ts`, `rungFor.ts`, Library/Folder/Lesson/Skills/Today/Shelf/Progress screens, `projectSheet.ts`, `04-ui-spec.md`, test map | Known demands are actionable words; PDF/unmeasured says unknown; same piece has consistent demand wording across screens; there is no L-number claim in learner views; missing facts never become “easy”. | Text claims competence or taught context from scalar; controls/title lose room in any design cell. Dev diagnostics may show explicitly internal estimates. |
| 6. R8 build validation and placement report | `validate.py`, `untaught_options.py`, `candidates.py`, `rung_audit.py`, `ladder_report.py`, curriculum schema/source | Out-of-band but supported item is not rejected; in-band but unsupported demand is diagnosed; unknown measurement stays distinct; ranking-band report never acts as gate. | Any piece leaves a rung without itemised curriculum decision, or Python/app coping disagrees outside named limitations. Stop and hand back those placements. |
| 7. Remove compatibility writes/shim | callers from trace plus old field schemas and tests | Broad field/alias searches locate only documented legacy readers or distinct recipe fields; old backup remains convertible through boundary adapter. | A present-day writer recreates `level`/`levelSource`, or deleting adapter prevents promised backup restore. Shim lifetime decided from compatibility promise, not arbitrary date. |

Each slice updates the real dependent tests beside changed behavior, not fixture assertions alone. No test has been run in this lane. Full source and test locations are in trace; build/check requests belong to approved implementation slices.

## Screen words and placement (R7)

Use the measured demand vocabulary's existing human names, selecting the primary teaching demand plus a material secondary demand; full facts behind Details. Examples below illustrate formatting only and are conditional on those actual measured facts. Never infer them from the number. For unmeasured notation: **“Demands not measured”**; for paper/PDF: **“Reading demands not measured from this PDF”**. Rung context appears only when genuinely listed or assigned, e.g. **“From your eighth-note lesson”**; do not map a decimal to a stage using `rungForLevel`.

| Surface | Phone upright (342×740, 360×780) | Phone sideways (568×320, 780×360) | Tablet (1024×768,1366×1024; both orientations) |
| --- | --- | --- | --- |
| Library row | Full wrapping title first; one demand line below, e.g. “Eighth notes · hands together”; existing Details and import controls keep their room. Full demand list on Details. | Title and compact demand line beside the existing action strip; no expanded explanation above the list. | Title/demand summary use list width; align actions in their own column, leaving browsing density. Full list still on Details rather than copying the whole analysis into each row. |
| Details | Replace Level key/value with **“What this asks”**, then demand names and existing measured/unknown attribution; genuine lesson link below. One column, primary action reachable without a scalar explanation. | Compact two-column facts within the sheet; demand text wraps freely, actions separate from text. Additional measurement explanation behind disclosure to preserve short height. | Demand facts and genuine lesson context in separate sections side by side when width permits; measurement/provenance disclosure beneath facts, actions grouped at sheet edge. |
| Project sheet | Existing title/state/contact first; add **“What this asks”** below state/history and before notes only when measured; unknown line for unmeasured. Project status never inferred from demands. | State/actions remain primary; compact demand disclosure beside history rather than pushing controls below the short viewport. | State/actions and history/notes keep their grouping; demand facts in adjacent context section. Use room for full list, not larger scalar. |

No pictures required for this reading lane; final layout needs the R7 state pictures when built. Other learner views in the inventory must replace their `levelLabel` with the same truthful summary, not merely omit it while retaining decimal-linked rung sentences. Human sorting override editing belongs in an explicitly ordering/calibration interface, rather than a piece-level “truth” control. Detailed override UX is not settled by the scalar ruling.

## Questions at the boundary

1. **Legacy provenance/schema:** approve the named migration with unknown/legacy and manifest provenance variants (no invented model version or human identity), and a compatibility reader for older backups? With them, stored choices survive honestly; restricting to `{from:'model',version}` requires remeasurement before unknown/PDF rows can have a canonical estimate.
2. **R8 build policy:** should demand refusals first remain an itemised diagnosis while curriculum placements are decided, or immediately become build failures? Diagnosis retains current placements while the runtime gate still refuses unsafe automatic offers; immediate failure may halt content builds on existing options. Recommend diagnosis first, with no silent placement changes.
3. **Ranking anchor:** approve estimate-derived anchors from eligible rung-listed material (stable ordering when absent), replacing numeric stage/band anchors? This keeps sorting internal but can change tie-break offers and needs a discriminating selection test.

These questions stop implementation of the affected slices. They do not reopen the settled sorting-only scalar or permit numeric gates to survive as curriculum truth.
