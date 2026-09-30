# Convergence map, 2026-09-30 (first synthesis checkpoint)

A generated planning view over the four triage files: triage-A1.md (G, L; 95 rows), triage-A2.md (S, T, M; 66), triage-B.md (E, R, Q; 102) and triage-C.md (U, X, I; 80), 343 rows in all. The triagers read the tree at 034d4039. The cross-checks below were read at ba0126ad, which adds L120c's merge (afdac758). Two lanes are built in worktrees and not merged: G96 (48bfc167) and E50a (338cc916, whose diff was read for file ownership). Nothing in the repository was edited or run. `apply-dispositions.py` beside this file appends each row's disposition to the backlog's status cell. The backlog stays the historical record, and no row disappears from it.

Lanes in flight, as given to this pass: U32, U63, U105, E50a's correction, L120c landing. Queued: L120d, E50, T58, X40. G96 is added here because its files stay owned until it lands. A row whose fix touches a file one of these owns is RE-CHECK, with its provisional disposition in brackets.

## Counts

| disposition | A1 | A2 | B | C | total | triagers' own total |
| --- | --- | --- | --- | --- | --- | --- |
| CLOSE | 22 | 16 | 33 | 19 | 90 | 89 |
| MERGE | 15 | 15 | 12 | 10 | 52 | 45 |
| BUILD NOW | 9 | 7 | 7 | 3 | 26 | 41 |
| DECISION | 14 | 12 | 10 | 14 | 50 | 53 |
| READ | 4 | 5 | 10 | 9 | 28 | 33 |
| DEFER TO H | 1 | 1 | 8 | 6 | 16 | 16 |
| REJECT | 1 | 0 | 2 | 0 | 3 | 3 |
| RE-CHECK | 29 | 10 | 20 | 19 | 78 | 63 |
| total | 95 | 66 | 102 | 80 | 343 | 343 |

These counts cover the 343 rows of the four files. U16 and R11, re-checked below, sit outside them and appear at the end of the table.

The RE-CHECK rows break down by provisional disposition: BUILD NOW 49, DECISION 18, READ 8, CLOSE 1 (L123), MERGE 1 (L124), DEFER TO H 1 (U9).

**Corrected open P0: 0.** Q2, U16 and R11 were each re-checked at the lines:

- **Q2 (P0 in the backlog) is open in part but is not an open P0; corrected to P1.** The named faults N1 and N2 were fixed by T41. The window-rule spec now measures each staff as its five lines, and checks each drawn bar against the engraver's natural width (`score.window-rule.spec.ts:466-495`). Two proxies remain. `wide.spec.ts:589-601` accepts the renderer's own `data-stretch`. `drills-harmony.spec.ts:50-53` plays the app's own `data-expects` answer key. No product fault is known to hide behind either. The answer-key half can be built now; the window half follows U32 (CL06).
- **U16 ("never stretch to fill"; a P0 rule) is not an open P0; closed as a defect row.** Its recorded breach, U3, was built in T38. At ba0126ad the window's two reading paths, slots and sliding, draw at natural width (`WindowRenderer.ts:2590`). The stretch and fill branches apply only outside them (`:2646`, `:2672-2676`). The spec's check (a) fails any sheet not drawn natural and any bar wider than 1.03 times its engraved width. The rule stays an acceptance condition for U32 and CL07, and is re-verified over the whole grid after U32 lands.
- **R11 ("an invented tempo printed as a written mark"; P0/P2) is not an open P0; merged into E50.** The run summary now reads "of the suggested tempo" for a tempo-defaulted item (`ScoreScreen.ts:3887`), and the run records its tempo source as `defaulted` (`:3323`). E0 marks tempo-sensitive demands untrusted where the tempo is inferred. 180 catalogue items carry `tempo-defaulted`. Two things are left. The seven bundled rows whose tempo is printed only as text are E50's. The other is `help.ts:936`, which says "% of the written tempo" in a rung requirement line whatever the pool's tempo source. That line is recorded under Cross-checks as a new finding and rides CL09 after U105.

**Open after the pass** (counted only for BUILD NOW, DECISION, READ or RE-CHECK), using the corrected priorities:

- **P1: 61**, of which BUILD NOW 5, DECISION 22, READ 10, RE-CHECK 24.
- **P2: 121**, of which BUILD NOW 21, DECISION 28, READ 18, RE-CHECK 54.

The triagers' own P1 figures summed to 62: A1 13, A2 17, B 18 (B's list names 17, but Q22 is an open P1 too) and C 14. Q2 moved from P0 to P1, which makes 63. G40 was merged into M2 and Q42 into X19, which makes 61. Three RE-CHECK rows count as open by the rule although their provisional disposition is not: L123 [CLOSE], L124 [MERGE] and U9 [DEFER TO H].

Twenty-four BUILD NOW rows wait on nothing: E8, E54, G7, G37, G51, G54, G70, G90, L70, L73, L79, Q21, Q23, Q48, Q49, R23, S34, T4, T20, T47, T48, U66, U68, X15. The answer-key half of Q2 is also free now.

By area:

- **G (generated content, transfer, projects)**: 37 rows. CLOSE 11, MERGE 5, BUILD NOW 6, DECISION 7, READ 3, RE-CHECK 5. Open after the pass: P1 4, P2 17.
- **L (learner evidence, rung state, the composed day)**: 58 rows. CLOSE 11, MERGE 10, BUILD NOW 3, DECISION 7, READ 1, DEFER TO H 1, REJECT 1, RE-CHECK 24. Open after the pass: P1 8, P2 27.
- **S (sight-reading)**: 19 rows. CLOSE 4, MERGE 5, BUILD NOW 3, DECISION 1, READ 1, RE-CHECK 5. Open after the pass: P1 2, P2 8.
- **T (lesson truth, pedagogy, tooling)**: 38 rows. CLOSE 9, MERGE 7, BUILD NOW 4, DECISION 10, READ 3, RE-CHECK 5. Open after the pass: P1 14, P2 8.
- **M (musicianship, curriculum shape)**: 9 rows. CLOSE 3, MERGE 3, DECISION 1, READ 1, DEFER TO H 1. Open after the pass: P1 1, P2 1.
- **R (repertoire, levels, demands)**: 35 rows. CLOSE 6, MERGE 3, BUILD NOW 1, DECISION 6, READ 8, DEFER TO H 1, RE-CHECK 10. Open after the pass: P1 13, P2 12.
- **E (engine boundary, content pipeline, device budgets)**: 22 rows. CLOSE 9, MERGE 1, BUILD NOW 2, DECISION 3, READ 1, DEFER TO H 4, RE-CHECK 2. Open after the pass: P1 1, P2 7.
- **Q (tests, suites, chains, sources)**: 45 rows. CLOSE 18, MERGE 8, BUILD NOW 4, DECISION 1, READ 1, DEFER TO H 3, REJECT 2, RE-CHECK 8. Open after the pass: P1 4, P2 10.
- **U (score window, Score screen, device)**: 43 rows. CLOSE 11, MERGE 6, BUILD NOW 2, DECISION 2, READ 1, DEFER TO H 5, RE-CHECK 16. Open after the pass: P1 6, P2 15.
- **I (musical identity, long horizon)**: 15 rows. CLOSE 1, MERGE 2, DECISION 7, READ 5. Open after the pass: P1 4, P2 8.
- **X (session and practice experience, imports)**: 22 rows. CLOSE 7, MERGE 2, BUILD NOW 1, DECISION 5, READ 3, DEFER TO H 1, RE-CHECK 3. Open after the pass: P1 4, P2 8.

## Cross-checks

### Duplicates across the files (merged; the surviving id named)

1. **G39 (A1) and U28 (C).** Both are about the pedal marks on the 15 generated pedal items, in the same files (`generate_exercises.py`, `OsmdView.ts`). U28 MERGE → G39.
2. **M2 (A2) contains G40 and G32 (A1).** All three are the same microscope sitting: per-family reads recorded in `decisions.jsonl`, on the notation basis for G40 and the heard basis for G32. G40, G32 MERGE → M2.
3. **S9 (A2) contains G57 (A1).** Both ask for goodTeachingUse decisions on the music-promising studies, which include the 2.1-2.2 studies. G57 MERGE → S9.
4. **T11 (A2) and Q9 (B).** Both ask whether lessons get a teaching-plan schema that the prose is tested against. Q9 MERGE → T11.
5. **L120 (A1) and T18 (A2).** Both are the untaught-options table. T18 MERGE → L120.
6. **R22 (B) and L26 (A1).** Both ask whether breadth is a reserved share of the composed day, balanced over R46's dimensions. L26 MERGE → R22.
7. **X19 (C) and Q42 (B).** Q42's remaining 25 teaching-loop cases are X19's acceptance tests. Q42 MERGE → X19.
8. **I2 (C) was merged into R19 (B), and B closed R19.** I2 therefore closes with it (G1b, G1d, G1e).
9. **T50 (A2) was merged into I16 (C), which C merged into L92 (A1).** The chain collapses to T50 MERGE → L92.

Close relatives kept as separate rows in one cluster, because each asks a different question: I9 and M2 (idiom against teaching use; one sitting can answer both), G31 and R25 (AT-13 over generated items against repertoire), R47 and I21 (a piece's re-entry against a learner's), L91 and X19 (strategies as interventions).

### Merged into rows outside the four files

L28, S14 and M3 were merged into L19. L29 and L67 went into L24, L39 into L21, I17 into L25 and U42 into U79 (a P3). L19, L21, L24 and L25 are open P1s, each "built in part", and were not among this pass's inputs. They now carry these findings and need their own triage in the next batch: L19 anchors CL09's diagnosis grammar, L21 and L24 anchor CL11, and L25 anchors CL12.

### Rows closed in one file that another file depends on

- **R19 (B, CLOSE).** I2 closes with it (above). I3 and I20 list R19 as a dependency, and it is met: the lifecycle exists at `projectStore.ts:45`.
- **X1 (C, CLOSE)** is the dependency of L22 and X2, and **L32 (A1, CLOSE)** is I20's. Both are met.
- **G85 (A1, CLOSE)** sits beside G91, which stays open as the residue: the Stage 9 door.
- **U69 (C, CLOSE).** The rest of its work is carried by U105, now in flight.
- **Q76 (B, CLOSE)** is named by I5. Q76 ruled on two rungs only, so I5's decision stands.
- **L117 (A1, CLOSE)** left two rungs' claims unmeasured. L118 depends on that gap and stands.
- **G9, G14 and S7 (closed)** are listed as I9's dependencies, and they are met. I9's read stands.
- **Q88 (B, CLOSE)** closes fully only on the healthy Pages run read-back (questions-bd7d303e.md §10), which is not yet recorded. It is kept as CLOSE with that wait.

### Contradictions between the files, resolved

1. **U68 against G7, G51 and G54.** C made U68 wait on E50a because regenerating moves material identity. A1's generator rows regenerate the same way with no wait. A generated item's identity is its (family, version, seed, recipe, tempoBpm) (`review.py:264-284`), and E50a does not change that: its diff touches `convert.py`, `build.py`, `material.ts`, `types.ts`, `load.ts`, `encounterStore.ts`, `progressStore.ts` and `catalog.schema.json`. Resolution: no generator row waits on E50a. Each regenerated family bumps its version, which is the explicit identity move the U68 ruling asks for (questions-71bd6cee.md, survey decisions).
2. **G91 (A1)** was BUILD NOW, but its file `projectSheet.ts` belongs to G96. Now RE-CHECK after G96.
3. **Q22 (B)** was BUILD NOW with U32 as its dependency. Now RE-CHECK after U32, because the probe it fixes is what judges U32's grid.
4. **S28 (A2)** was BUILD NOW with L120c/L120d as its dependency. It is kept as BUILD NOW, but its verification needs L120d's taughtAt data, so it is not buildable yet.
5. **Q78 (B)** was DECISION, but the owner has decided it (questions-bd7d303e.md §8): add Wall Street Rag and Eugenia if each passes the gates. `stage-8.json` belongs to L120d, so it is now RE-CHECK [BUILD NOW].
6. **X40 and U105 (C)** were READ and BUILD NOW. Both were approved as lanes at ba0126ad and are now RE-CHECK on their own lanes.
7. **Files that changed hands after the triage tree:**
   - U105 owns `ScoreScreen.ts`, `help.ts`, `score.screen.spec.ts` and `midi/ScreenKeyboardSource.ts`. S10, U31, U34, U53, X18, T23 and Q29 are now RE-CHECK after U105.
   - T58's brief owns `checks.json`'s rows and runs `test_checks_for_paths.py` (T58 brief :72, :68). Q73 (a `checks.json` row) and Q69 (the map test) are now RE-CHECK after T58.
   - U105 changes only `soundOff` in `help.ts` (U105 brief :72). The help.ts-only rows (U50, T23, and U34's words) could therefore run beside it and merge after. They are kept RE-CHECK here so the merge stays sequential.
   - E50a's diff edits `progressStore.ts` and `encounterStore.ts`. L53 and L69 are now RE-CHECK after E50a. L51, L99 and G71 stay DECISION, with E50a as the wait on their build.
8. **L123 (A1).** L120c merged at afdac758, after the triage tree. Now RE-CHECK on L120c's review [CLOSE].
9. **S27 (A2).** L120c added `rhythm.sixteenths on` to the unrealisable list for `LEVEL_3_RUNGS` (`readingControls.ts:505-507`). The decision now covers one more demand.
10. **Tiers:**
    - C placed responsive-reading, long-piece-sheets, frozen-size, gallery-rotation and slide-start at tier 3 or 4. The reviewer's §6 amendment moves the window's three goods to tier 1, so they are corrected to tier 1.
    - B placed outcome-tests at tier 0 because Q2 was a P0. With Q2 corrected, they are tier 1.
    - A1 rated the microscope sitting tier 2 and A2 rated teaching-use tier 1. The merged cluster is tier 1: without a teaching-use yes, the study and excerpt steps of the transfer ladder never reach the learner.
11. **G96** is missing from the in-flight list given to this pass. It is built (48bfc167, worktree agent-a5503906b426497cb) but not merged at ba0126ad. Its files (`projectStore.ts`, `projectSheet.ts`, `LibraryScreen.ts`, `ProgressScreen.ts`, `widgets.ts`) are treated as owned until it lands.

### Clusters from different files that touch the same files (merged or ordered)

- **`generate_exercises.py`:** A1's interval-reading, family-recipes, arpeggio-spelling, coordination-study, generator-structure and pedal-notation clusters, and C's lh-one-staff and pedal-engraving, are merged into CL15. One lane at a time.
- **`sightReading.ts`:** A1's sightread-lh-register and A2's sr-walk-v3 are merged into CL16, as one version 3 with v1 and v2 unchanged. S10's unsourced 72 bpm (`:1764`) rides CL09 after U105.
- **`session.ts`, after L120d:** CL08's readingOffer rows first, then CL12's L96, then SG04 (L93), then the decisions in CL12 and CL14.
- **`ScoreScreen.ts` and `help.ts`, after U105:** CL09 first (sentences that must match the code), then CL22 (the help strip, the string audit, the placeholder copy), then SG11.
- **`validate.py` and `detect.ts`:** A1's concept-tags and swap-context and B's validator, needs-vs-taught, demand-readings, demand-vocab-gaps and ornament rows are merged into CL10. R23 goes first, now; the detector rows follow L120d. The band check that belongs to CL17 (R14) follows R8.
- **`widgets.ts`, `LibraryScreen.ts` and `projectSheet.ts`, after G96:** CL22 (G91, G97, Q92) comes before CL17's display change (R16).
- **`progressStore.ts` and `db.ts`:** CL04's L70 only reads `db.ts` and needs no version bump. After E50a, CL23 carries one DB_VERSION bump for L53, plus E39 if it is decided yes.
- **`DrillScreen.ts` and `LabScreen.ts`:** CL05 (X15) comes before G71's decision is built (CL11) and before I10's lab read turns into work.
- **`PlanScreen.ts`:** SG04 (L93) comes before X2's map (CL14, after M9).
- **`style.css`:** U63's lane first, then SG06 (U62), then SG08 (U64).
- **`readingControls.ts` and `catalog.static.json`:** A2's rung-reading-truth, contract-tracks and sr-compound-row are merged into CL08.
- **`content/lessons`:** CL01 now; CL19 after T11; R12 after R9. X40 may touch `4.4.md`, which is not in CL01's set.
- **`app/tests/e2e/fixtures/devScore.ts`:** Q49 now and Q30 after U32, both in CL24.

**New finding, recorded and not fixed:** `help.ts:936` prints "% of the written tempo" in a rung requirement line whatever the pool's tempo source. The run summary already says "of the suggested tempo" for tempo-defaulted items (`ScoreScreen.ts:3887`). Classified as R11's residue: tier 1 (a sentence that does not match the code), P2, riding CL09 after U105. It is not yet a backlog row.

## Clusters

Tiers: 0 correctness and irreversible truth; 1 the core teaching loop, including the score window's three goods; 2 content quality; 3 interaction that interferes with practice; 4 polish. H means the final waves. Within a tier, the order is dependency-unblock value, then learner consequence. The large seams the reviewer asked to see map as follows. F3 remainder is CL01 plus CL19; F4 is CL02; X2 (the performance experience and ear training) is CL21, while the backlog row X2, Plan as a map, sits in CL14; G3 is CL14; G4 is CL20; H1 is CL24; H2 is CL25. The record names G3 and G4 without a scope (plan-2026-09-25.md:710; responses/3e526f1.md:15). The split here is drawn from the G wave's remaining scope (plan line 175) and is for the reviewer to confirm.

### Tier 0

**CL01 — F3 remainder: lesson truth**
- **Rows:** T4, T47, T48 (BUILD NOW); T53, T54 (READ); T16 (RE-CHECK after L120d). Closed into it: T34, T36, T37, T42, T43, T44, T45, T52, T55.
- **Learner meets:** no lesson states a heuristic, a style trait or a practice habit as a law, and every contested fact carries a source or is gone.
- **Files:** `content/lessons/*.md` (improv.3, improv.4, improv.8, ragtime.9 and the lint's other hits), `tools/content/lint_absolutes.py`, `app/tests/unit/lessonClaimsAboutMusic.test.ts`.
- **Proof:** each changed sentence pinned red-first on the committed lesson; every lint_absolutes hit given a disposition; a per-lesson record for gates 1-6 and 9-11 over all 109 lessons. T54 follows the owner's split: sources, one bounded pianist pass, an authoritative safety source. What cannot be sourced by H2 is removed or softened.
- **Waits on:** nothing for the build half; sources and the pianist pass for T53 and T54; L120d for T16.

**CL02 — F4: rock and Latin unwinding with a fingering policy**
- **Rows:** G30 (DECISION), L121 (RE-CHECK [DECISION] after L120d), Q57 (READ), I9 (READ).
- **Learner meets:** no printed finger number without a source; rock and Latin rungs carry material a hand can play and that sounds like the idiom, or they say they do not.
- **Files:** `tools/content/family_contracts.json`, `tools/content/generate_exercises.py`, `content/curriculum/stage-*.json` (rock.5, latin.3, latin.6), `content/review/decisions.jsonl`.
- **Proof:** the contract check fails a printed fingering with no source; teaching-use decisions recorded for the clave, tresillo, tumbao and montuno items; rock.5's voicing either keeps its physical note or is replaced.
- **Waits on:** G30's decision (the owner's T54 fallback points to "print none until sourced"); an ear for Q57 and I9; L120d for L121.

**CL03 — Conversion and tempo truth, after E50a**
- **Rows:** R27 (R29 and E6 merged), E50 (R11 merged; the lane is queued), X40 (lane queued), X37. E32 closed.
- **Learner meets:** whatever the MusicXML path loses is recorded; the seven rags and blues and Maple Leaf Rag play at their printed tempo; a quarried row's level has one definition.
- **Files:** `tools/content/convert.py`, `tools/content/tests/test_convert.py`, `content/sources/pdmx.json`, `content/sources/musetrainer.json`, `tools/content/pdmx/quarry.py`, `tools/content/difficulty.py`.
- **Proof:** an AT-5 set of pathological fixtures with a report per file; only the seven identities move under E50; X40's table of tempo facts per row; the next quarry's level diff with its placements reviewed.
- **Waits on:** E50a (in flight), then E50 (queued); the X40 lane.

### Tier 1

**CL04 — Evidence truth**
- **Rows:** G70, L79, L73, L70.
- **Learner meets:**
  - a carried-over learner gets the exposure a rung introduces;
  - a book piece's twin counts toward that piece's rung;
  - a misread note at an untimeable tempo still counts on the pitch channel;
  - an unknown observation version is refused.
- **Files:** `app/src/evidence/rungState.ts`, `evidence.ts`, `measurement.ts`, `app/src/ui/assignSheet.ts`, `app/src/ui/screens/PaperScreen.ts`.
- **Proof:** unit cases, red-first:
  - blues.5 carried over with walking-bass exposure present;
  - a twin run meets the paper option's requirement;
  - adversarial case 6 keeps its pitch evidence;
  - a version-2 observation is refused.
- **Waits on:** nothing.

**CL05 — Practice lifecycle**
- **Rows:** X15 (BUILD NOW), X16 (READ, after X15). U19 and U39 merged; U18 closed.
- **Learner meets:** a backgrounded phone never advances a card, a page or a chorus, and hidden time is never counted as practice.
- **Files:** `app/src/ui/screenLifecycle.ts`, `app/src/ui/screens/DrillScreen.ts`, `PdfScreen.ts`, `ChordChartScreen.ts`, `LabScreen.ts`.
- **Proof:** the fake-clock case (play 20 s, hidden 5 min, play 10 s, counted about 30 s) on Drill, PDF, Chord Chart and Lab, plus a repeated hide-and-show case.
- **Waits on:** nothing. The Score-screen parts of U19 and U39 wait on U105.

**CL06 — Outcome tests**
- **Rows:** Q2 (corrected to P1), Q21, Q23 (BUILD NOW), Q22 (RE-CHECK after U32). Q10 merged.
- **Learner meets:** a wrong window or a wrong drill answer key can no longer ship green.
- **Files:** `app/tests/e2e/drills-harmony.spec.ts`, `modes-dictation.spec.ts`, `modes-simon.spec.ts`, `audio.spec.ts`, `carry-overs.spec.ts`, `shelf.spec.ts`, `score.rotate.spec.ts`, `app/tests/tour/t30-sheet.mjs`; after U32, `wide.spec.ts` and `app/tests/states/*`.
- **Proof:** each revised test goes red on a product mutant: a wrong answer key, audio left suspended, a staff under the exported floor, a stretched bar.
- **Waits on:** nothing for the answer-key half, Q21 or Q23; U32 for the window half and Q22. Existing specs are revised and none are added, so `checks.json`, which T58 owns, is untouched.

**CL07 — Responsive reading (after U32)**
- **Rows:** U5, U33, U77, U78 (U8 merged), U35, U88, U41. Closed into it: U11, U14, U16.
- **Learner meets:** on a stage with room, the next music shows whenever the staff is comfortably readable; the floor is a named number; a run's size is set once; bar 1 opens with its clef on the stage.
- **Files:** `app/src/score/WindowRenderer.ts`, `app/tests/e2e/score.window-rule.spec.ts`, `app/tests/states/gallery.ts`, `docs/04-ui-spec.md`.
- **Proof:** the whole gallery before and after at phone, tablet and desktop, with look-ahead and five-line size read per cell and check (a) on every sheet.
- **Waits on:** U32 landing, then one threshold decision covering U33 and U78 together with U5 and U77.

**CL08 — The reading strand (after L120d)**
- **Rows:** L74, L75, L76, L77, S24, S31, S32, T27, S38 (RE-CHECK); S28 (BUILD NOW); S27 (DECISION). S22 merged; S6 closed.
- **Learner meets:** the reader:
  - stops oscillating, never re-introduces a demand already shown, and lists only reachable moves;
  - tells a guide-on reader that the next step needs the guide off;
  - asks each rung only for what its lesson taught;
  - never calls yesterday's notes unseen.
- **Files:** `app/src/curriculum/session.ts` (readingOffer), `app/src/engine/readingControls.ts`, `content/catalog.static.json`, `content/curriculum/stage-2/3/4.json`, `app/tests/unit/generatorContract.test.ts`.
- **Proof:** the variant (a) diary; the day-26 leap case; 3.4's walking-bass move; a unit with practice-standard reads only; generatorContract over the track rungs with UNREALISABLE_AT exact; the 189 golden keys for S38.
- **Waits on:** L120d; S27's decision; T27's read of 2.1.md; E50a and U105 for S38.

**CL09 — Score screen truth (after U105)**
- **Rows:** S10, U31, U34, U53 (RE-CHECK), U50 (DECISION). L28, S14 and M3 were merged into L19; the help.ts:936 residue rides here.
- **Learner meets:** every sentence the Score screen shows matches the code: the heading after a read, the help's promise of a next bar, the Not judged lines, the folded corner, and Carry on after the system kills the app.
- **Files:** `app/src/ui/screens/ScoreScreen.ts`, `ScoreScreen.css`, `app/src/ui/help.ts`, `app/src/evidence/evidence.ts`, `app/src/data/unfinishedRun.ts`.
- **Proof:**
  - help.test.ts fails on the old sentences;
  - a sight-read at 70 % whose heading agrees with `evidence.ts:267`;
  - the corner read at 390×844 after a pass;
  - hide, close and reopen, then find the Carry on offer.
- **Waits on:** U105; U32 for U34; U50's decision.

**CL10 — Measured claims: the detectors and the validator**
- **Rows:** R23 (BUILD NOW); R31, G12, L114, L47 (DECISION); R3 (RE-CHECK [DECISION]); R8, R32, R36, R37, E22 (RE-CHECK after L120d). E12 closed.
- **Learner meets:** "taught" and "established" rest on readings that account for clef, key, metre, held tunes and the share of bars, and the validator enforces curation rather than counts.
- **Files:** `app/src/demands/detect.ts`, `app/src/score/types.ts`, `extractScoreModel.ts`, `tools/content/validate.py`, `content/curriculum/vocabulary/demands.json`.
- **Proof:** the demandsOfFiles pins move only where a reading changes; the untaught table is re-pinned; DEFERRED_CONCEPT_CLAIMS empties; validator tests for the one-song rule and the orphan rule.
- **Waits on:** nothing for R23; L120d for the detector rows; decisions for R31, G12, L114, R3 and L47.

**CL11 — What counts as evidence (decisions)**
- **Rows:** L10, G80, G71 (DECISION); L23, L57, L58, L102, L105 (RE-CHECK [DECISION]). Merged in: L39 (into L21), L29 and L67 (into L24), X8 (into L23). Closed: G68, G75, G76, G77.
- **Learner meets:** a pass means the same thing in Wait and in Tempo, and every evidence and transfer rule says what it observed.
- **Files:** `app/src/engine/Scoring.ts`, `app/src/evidence/rungState.ts`, `evidence.ts`, `content/curriculum/vocabulary/skills.json`, `app/src/curriculum/skillActivation.ts`, `transfer.ts`, `eligibilityCore.ts`.
- **Proof:** a unit case per decision, for example a Tempo run full of wrong notes does not meet the requirement.
- **Waits on:** the eight decisions; L120d for `skills.json` and `eligibilityCore.ts`; E50a and X15 for G71.

**CL12 — The composed day: purposes and episodes**
- **Rows:** L22, L96, G64, L30, R45 (RE-CHECK); X19, X5, L91 (DECISION); L33 (READ). Merged in: L27, L89, L34, Q42, I17. R24 closed.
- **Learner meets:** every Today row has a stated purpose (retrieval, application, development, exploration or project); an unplayed offer yields; a detour returns to its piece with a reason and an exit criterion.
- **Files:** `app/src/curriculum/session.ts`, `app/src/ui/sessionRunner.ts`, `app/src/data/sessionRun.ts`, `app/src/ui/screens/TodayScreen.ts`, `content/tips/*.md`.
- **Proof:** the skip learner's 30 days (L96); a four-day diary (G64); AT-3 (L30); Part 18's 25 teaching-loop cases red-first (X19).
- **Waits on:** L22's first slice and X19's episode (decisions); L120d; U63 for R45; L33's AT-1 read.

**CL13 — Rung and item reads**
- **Rows:** S9, M2, G18, G31, R10, R25, R41 (READ); L88, L112 (RE-CHECK [READ]); L90 (RE-CHECK [DECISION]). G32, G40 and G57 merged; R42, Q56 and Q59 closed.
- **Learner meets:** each rung's options serve its claim, and studies and excerpts reach the learner only on a recorded teaching-use yes.
- **Files:** `content/review/decisions.jsonl`, `app/src/ui/screens/DevMicroscopeScreen.ts`, `tools/content/rung_audit.py`, `content/curriculum/stage-*.json`.
- **Proof:** decisions recorded per item and dimension; a per-rung report of family, role, demands, claim and observation; a goodTeachingUse yes that leads to admittedForTeaching and then to a transfer offer for a proficient skill.
- **Waits on:** the reads (a second reader, plus an ear for the heard basis); L120d for L88, L90, L112 and G31.

**CL14 — G3: the learner's direction and return**
- **Rows:** L92, I3, I20, I21, M9, X2 (DECISION); R47 (RE-CHECK [DECISION]). I16, T50 and M12 merged; R19 and I2 closed.
- **Learner meets:** past the authored ladder the teacher follows the learner's goals and interests; a piece or a learner coming back after a break gets a short check; Plan shows where the learner is.
- **Files:** `app/src/curriculum/session.ts`, `app/src/data/projectStore.ts`, `app/src/data/settingsStore.ts`, `app/src/ui/screens/PlanScreen.ts`, `content/curriculum/00-tracks.json`.
- **Proof:** trajectory cases F and G and the 18-month return (Q40's), plus a Plan picture per track.
- **Waits on:** seven decisions (I3's ratio is the owner's); G96; L120d.

**Singles, tier 1:** SG02 (U66), SG03 (G90), SG04 (L93); see Singles below.

### Tier 2

**CL15 — Generator fixes**
- **Rows:** G51, G54, U68, G7 (BUILD NOW); L118 (RE-CHECK after L120d); G52, G58, G13 (DECISION); G39 (READ). G10, G24 and U28 merged.
- **Learner meets:** generated families print what their contracts promise:
  - the recipe faults fixed and power_chord's canonical item shipped;
  - left-hand items on one staff;
  - interval reading beyond C position;
  - one spelling for the flat-key seventh arpeggios;
  - readable pedal marks.
- **Files:** `tools/content/generate_exercises.py`, `tools/content/family_contracts.json`, `tools/content/tests/test_family_contracts.py`, `test_generator_invariants.py`.
- **Proof:** a contract test that every canonical item is in the plan; an invariant that no staff is silent; measured demands per rung for the rewritten interval items; each family's version bumped, with the identity move stated.
- **Waits on:** nothing for G51's four clear faults, G54, U68 or G7; decisions for G52, G58 and G13; the pedal picture read; L120d for L118.

**CL16 — Sight-reading walk, version 3**
- **Rows:** S34, S35, G37. S18 and S30 merged; S15 closed.
- **Learner meets:** phrases at levels 5-7 have shape; a bar-long arrival is possible; near-duplicates are bounded; the first moving left hand sits near the right hand, with no ledger lines.
- **Files:** `app/src/engine/sightReading.ts`, `sightReadingScore.ts`, `app/tests/unit/sightReadingDistribution.test.ts`, `sightReading.test.ts`.
- **Proof:** version 3, with v1 and v2 unchanged (sightReadingUnchanged); the distribution bounds; seed 11 at 3.6 and a 6/8 phrase, each with its lowest note and unit asserted; labelled "unverified as music" until H2.
- **Waits on:** nothing.

**CL17 — One level and one analysis**
- **Rows:** R1, R16, G6 (RE-CHECK [DECISION]); R28 (DECISION). R4 and R14 merged; R2 closed.
- **Learner meets:** one level with a stated derivation; the learner sees demand dimensions instead of a scalar presented as truth.
- **Files:** `app/src/curriculum/types.ts`, `app/src/ui/widgets.ts`, `tools/content/validate.py`, `tools/content/generate_exercises.py`, `app/src/data/measuringFingerprint.ts`.
- **Proof:** no list prints a bare scalar as fact; the band check goes with its last reader; a unit case on levelSource.
- **Waits on:** the decision on R1 and R16; E50a (`types.ts`); G96 (`widgets.ts`).

**CL18 — Repertoire supply**
- **Rows:** Q78 (RE-CHECK [BUILD NOW] after L120d; the owner decided); R6, R9, R13, R21, R26 (READ); R12, I5 (DECISION). Q76 closed; Q79 rejected.
- **Learner meets:** rung music is kept, moved or taught through an excerpt on the strength of a musical read; thin and unbuilt rungs get public-domain music; the phone carries what the owner decides.
- **Files:** `content/sources/mutopia.json`, `content/sources/sections.json`, `content/curriculum/stage-3/4/8.json`, `app/src/ui/tablet.ts`, `.github/workflows/pages.yml`.
- **Proof:** the strict build's report shows Wall Street Rag and Eugenia each kept, or refused with a measured reason; sections validate; the tablet panel checked on each classical.3 piece.
- **Waits on:** L120d (`stage-8.json`); musical and source reads; I5 (the owner's); R9 before R12.

**CL19 — F3 remainder: the lesson contract**
- **Rows:** T1, T3, T5, T6, T7, T8, T10, T11, T17. S11, T12, T14, T15, M10, X11 and Q9 merged.
- **Learner meets:** lessons teach the music one concept at a time, perception before rules, briefly, and never teach the app.
- **Files:** `content/lessons/*.md`, `app/tests/unit/lessonShape.test.ts`; `app/src/curriculum/types.ts` and `tools/content/build.py` if the schema path is chosen.
- **Proof:** a gate record per lesson; lessonShape extended to the contract's measurable targets.
- **Waits on:** T11 (schema first or prose first); E50a if the schema path is chosen.

**CL20 — G4: breadth and musicianship strands**
- **Rows:** R22, R46, R20, I19 (DECISION); I6, I8, I10, I11, T21 (READ). L26 and Q11 merged.
- **Learner meets:**
  - exposure balanced over musical languages;
  - genre met through the modes at honest stages;
  - one sequenced strand for improvisation, accompaniment and ensemble;
  - theory tied to sound and use;
  - arranging as the bridge.
- **Files:** `app/src/curriculum/session.ts`, `app/src/demands/detect.ts`, `content/curriculum/stage-*.json`, `app/src/ui/screens/LabScreen.ts`, `content/lessons/theory.*.md`.
- **Proof:** an exposure-balance test; AT-9 and AT-8 records; the one-tune arrangement trial judged.
- **Waits on:** the decisions (R46 first); the AT-9 and AT-8 reads; L120d.

**CL21 — X2: the performance experience and ear training**
- **Rows:** X7, X6, I12, T22, I18, Q43. T46 merged.
- **Learner meets:** Perform feels like a performance and reports stops and recoveries; ear work moves from memory towards tonal hearing; memory is taught in steps; duets and shadowing have names.
- **Files:** `app/src/ui/screens/ScoreScreen.ts`, `app/src/engine/drills/harmony.ts`, `simon.ts`, `app/src/score/ScoreSession.ts`, `app/tests/e2e/modes-simon.spec.ts`.
- **Proof:** Q43's 24 cases, red-first, for each experience that gets built.
- **Tier:** 2, with I18 at tier 1.
- **Waits on:** six decisions; L23 (CL11) for X7; U105 for `ScoreScreen.ts`.

### Tier 3

**CL22 — UI surfaces and words (after G96, U63 and U105)**
- **Rows:** G91, G97, Q92, X18, T13 (RE-CHECK [BUILD NOW]); X9, X10 (READ). U24 and T25 merged; G85, Q75, Q80, Q82 and Q86 closed.
- **Learner meets:** no sheet outlives its screen; a Stage 9 row reaches the project sheet; no learner sees a fetch command; play shows only state cues; no string over-claims.
- **Files:** `app/src/ui/widgets.ts`, `projectSheet.ts`, `helpStrip.ts`, `help.ts`, `app/src/ui/screens/LessonScreen.ts`, `LibraryScreen.ts`.
- **Proof:** a red case per screen for the sheets; a 342 px case per door; a jsdom case on an unfetched placeholder; the AT-7 walk; the string inventory, then batched fixes.
- **Waits on:** G96, U63 and U105; X9's read.

**CL23 — Store and schema (after E50a)**
- **Rows:** L69, L53 (RE-CHECK after E50a); L51, L99, E39 (DECISION). E40 and E48 closed.
- **Learner meets:** the store stays inside its budget for a learner of long pieces without losing a rung or an evidence fact, and a converter fix can reach stored imports.
- **Files:** `app/src/data/progressStore.ts`, `app/src/data/db.ts`, `app/src/data/importStore.ts`.
- **Proof:** the budget test with evidence rows; a bound test; one DB_VERSION bump with a migration test.
- **Waits on:** E50a (`progressStore.ts`); the decisions on L51, L99 and E39.

### Final waves

**CL24 — H1: a suite we trust**
- **Rows:**
  - DEFER TO H: Q13, E3, E15, E20, Q35, U30;
  - READ: E14, U83;
  - BUILD NOW, cheap: Q48, Q49;
  - RE-CHECK: Q29 (after U105), Q30 (after U32), Q69 and Q73 (after T58).
  - Merged: Q3, Q12, Q31, Q36. Closed: Q24, Q34, Q37, Q39, Q44, Q64, Q65.
- **Learner meets:** nothing directly. The suite stops failing under load, stops overclaiming what ran, and is re-classified once behaviour is stable.
- **Files:** `app/tests/**`, `app/tests/e2e/fixtures/devScore.ts`, `app/src/data/persist.ts`, `tools/docs/checks_for_paths.py`, `docs/prompts/checks.json`, `docs/prompts/test-inventory-2026-09-26.md`.
- **Proof:** each case passes alone and in the loaded full run; a mutant spec name is refused; AT-15 re-run; budgets per device class.
- **Waits on:** the product settling. Q48 and Q49 may run early in the tooling slot. Changes to the checks map go to the reviewer before the push.

**CL25 — H2: learner, device and musical walk**
- **Rows:** M1, U27, U17, U55, U56, X14, E10, L38, R43, Q40, U9 (U9 after U32).
- **Learner meets:** the finished teacher, judged on real devices, a real MIDI piano and a sampled listen.
- **Files:** none owned; findings route to the boundaries that own them.
- **Proof:** the owner's two sessions (questions-bd7d303e.md §8), with each finding classified: blocks release, fix before release, accepted limitation, or future.
- **Waits on:** H1 and the substantive clusters.

### Lanes in flight or queued (their own rows)

- **LN-U32:** U32; U42 → U79. Unblocks CL07, the window half of CL06, SG12, Q30, U9 and U34.
- **LN-U63:** U63. Unblocks SG06, SG04 (together with L120d), G97, T13 and R45.
- **LN-U105:** U105 (U69 closed into it). Unblocks CL09, X18, Q92, T13, SG11, Q29 and any build from SG07.
- **LN-G96:** G96. Unblocks G91, G97, Q92, R16, R47 and I20.
- **LN-T58:** T58. Unblocks Q69 and Q73.
- **LN-L120 (L120c landing, L120d queued):** L120, L123, L124, L125; T18 and L95 merged. Unblocks CL08, the detector rows of CL10, CL12, the audit rows of CL13, L118, Q78 and SG04.
- **E50a / E50 / X40:** in CL03. Unblocks CL23, the `types.ts` rows of CL17, and G71 (CL11).

### Singles

- **SG01 (tier 0) — E54:** a rejection of the current approval withdraws it and stops the cut. E29 and E51 closed. Files: `tools/content/excerpts.py`, `tools/content/tests/test_excerpts.py`, `content/sources/excerpts.json`. Proof: a red-first merge case; the built catalogue loses the cut; both events are kept. Waits on nothing (ruled in questions-71bd6cee.md).
- **SG02 (tier 1) — U66:** a note played in time is never judged a miss because of a render stall. Files: `app/src/engine/PracticeEngine.ts`, `app/tests/unit/engineTempo.test.ts`, `app/tests/e2e/engine.spec.ts`. Proof: a FakeClock stall case and a 400 ms busy-thread case, red-first; the rule chosen from the reproduction (responses/a008ba5.md). Waits on nothing.
- **SG03 (tier 1) — G90:** a piece paused after Start session is skipped at its turn, with the reason given. Files: `app/src/ui/sessionRunner.ts`, `app/src/data/sessionRun.ts`, `app/tests/unit/sessionRun.test.ts`. Waits on nothing; it only reads `projectStore`, so brief it against G96's landed API.
- **SG04 (tier 1) — L93:** the header and Plan describe the strands Today composes, and the return to set-aside rungs is retired. L85 merged; L84 closed. Files: `session.ts`, `PlanScreen.ts`, `TodayScreen.ts`. Waits on L120d and U63.
- **SG05 (tier 3) — E8:** the learner sees when they last backed up. Files: `app/src/data/backup.ts`, `app/src/ui/screens/SettingsScreen.ts`, `app/src/data/settingsStore.ts`. Waits on nothing.
- **SG06 (tier 3) — U62:** the Wait line and the help strip's link reach 4.5:1 contrast on the light theme. Files: `app/src/style.css`, `app/tests/states/audit.ts`. Waits on U63.
- **SG07 (tier 3) — E1:** one resolved run config; the timing is the code's decision. E2 closed. Any build waits on U105.
- **SG08 (tier 4) — U64:** the Skills list leads with measurable concepts. A decision, taken with U93. U90 and U92 closed.
- **SG09 (tier 4) — E46:** the seed finder's lesson-site wiring. A decision.
- **SG10 (tier 4) — T20:** no id in the lesson heading before the curriculum loads. File: `app/src/ui/screens/LessonScreen.ts`. Waits on nothing.
- **SG11 (tier 4) — T23:** free play's optional prompts. Files: `FreePlayScreen.ts`, `help.ts`. Waits on U105.
- **SG12 (tier 4) — U23:** the viewport plan as a pure function. Files: `WindowRenderer.ts`, `slots.ts`, `windowRendererStage.test.ts`. Waits on U32.

## Decisions needed

Every DECISION row, and every RE-CHECK row whose provisional disposition is DECISION, in one line each: 68 rows.

### The reviewer (product, pedagogy, architecture)

- G30: for the 43 families that print unsourced fingering, source each one (one pianist pass) or print none until sourced? The owner's T54 fallback points to "print none".
- G52: respell the six D♭/G♭ seventh arpeggios from the enharmonic root, or print the double flat?
- G58: does coordination get a study of its own, or a harder texture (a moving left hand under a held tune)?
- G64 (after L120d): does an unplayed transfer offer yield after a day or two, and to what?
- G71: is a drill card's prompt a hearing that a familiarity reader consumes? Write it, or retire the row.
- G80: can another cut or arrangement of a played piece ever count as an independent context?
- L10: does a runs requirement read Tempo's share net of wrong notes, or keep a threshold per mode?
- L22 (after L120d): the first slice of Part 25 (purpose, then experience contract, then material), designed once for E, G and X.
- L23 (after L120d): is continuity a vocabulary skill observed from stops, restarts and hesitation, with a keep-going drill?
- L47: judge grace notes, and under which timing rule, or keep ornaments unjudged and say so where they are taught?
- L57 (after L120d): do support thresholds move into skills.json under the definitions version, or stay code constants?
- L58 (after L120d): does a practice-standard read with note names on the ribbon count? If not, add a names-off condition.
- L90 (after L120d): which rung prerequisites become skill or demand readiness, and which stay experience prerequisites?
- L91: how do practice strategies return after Stage 1: as an intervention when the problem makes one relevant, lessons unchanged?
- L92: what does the teacher compose once the ladder is exhausted? Project and repertoire driven, never a Stage 10.
- L102 (after L120d): when do generated families' skills activate for evidence, now that the ladder reads role and family?
- L105 (after L120d): does the coping gate also read the demand's recent misses, or leave that to the ladder?
- L114: which fact tells the minor's raised seventh from chromatic or blues accidentals: a new demand, or a key-relative fact?
- L121 (after L120d): rock.5's ninth-span voicing: keep it with its physical note, move it, or replace it?
- S27: one reading row per metre at 4.5-4.7, or compound figures at levels 1-4 that survive eighths-off and leaps-off? This now includes sixteenths-on.
- T11: adopt the C0a teaching-plan schema and generate the page, the cue and the after-miss line from it, or rewrite the prose first?
- T1: the "Tools for this rung" section in 95 lessons and 1.5's generator paragraph. Decided by T11.
- T3: the writing contract behind phrasings like "the whole trick". Decided by T11.
- T5: 1.5 teaches six things on one page. Decided by T11.
- T6: the fixed "How you'll know" and "Common mistake" template. Decided by T11.
- T7: the perception step (C0a's `notice`), which nothing builds. Decided by T11.
- T8: per-section length targets beyond the three-minute cap. Decided by T11.
- T10: the musical object each lesson names (`whyItMatters`). Decided by T11.
- T17: the arc from hearing to use in music. Decided by T11.
- T22: what earTune becomes (memory named as memory, a tonal phrase grammar, or authentic phrases), and the order of the progression.
- M9: which rungs stay Foundation, and how do the style tracks become learner-chosen projects?
- R1 (after E50a, G96): which one level survives and how is it derived; which of the other numbers are deleted, renamed or kept as sort keys?
- R3 (after L120d): grace and ornament demands in the vocabulary, or the level model extended and refit?
- R12: per-piece notes for each rung piece, or rung prose written to fit any of the rung's pieces? Decide after R9.
- R16 (after G96): which demand dimensions replace the scalar on rows and in details, and in what words?
- R20: build the layered arrangement ladder for one tune as a trial, and which tune?
- R22: does the teacher balance exposure over R46's dimensions?
- R46: which exposure dimensions are balanced, which can be measured from notation, and which need labels?
- R47 (after G96, L120d): what does re-entry run for a refreshing piece, and what evidence does it write?
- Q43: which Part 17 experiences get built before H, each carrying its cases red-first?
- U5 and U77 (after U32): is look-ahead part of the sizing objective, and above what staff size may the next row take height from the window? One rule with U33 and U78.
- U33 and U78 (after U32): the floor and the comfortable staff size on phone and tablet, judged on the gallery at two or three values. The rows' route names the owner, but the owner delegated the window rule on 2026-09-23; the reviewer to confirm who decides.
- U50: keep C3's no-opportunity Not judged line, or print only refusals the learner can act on?
- U64: group the unmeasured concepts after the measured ones, or collapse them behind a count? Decide with U93.
- I12: which partial-score steps sit between visible and blind, and where is memory taught?
- I18: which audiation experiences can the app observe, and where do they enter reading and repertoire?
- I19: which ensemble experiences, sequenced from the existing duet, backing and trading machinery, and what may each measure?
- I20: what shape does a goal take, and how does the composer weigh a deadline without touching skill evidence?
- I21: what gap triggers calibration, and what does the diagnostic sample hold per domain?
- X2: a you-are-here map per track, once M9 decides core against branches.
- X5: how does the intent vocabulary map to mode, hands, tempo and section, with an exit criterion?
- X6: which duet forms, and what does shadowing judge?
- X7: which of Part 14 §15's conditions does Perform adopt?
- X19: what starts an episode before L22 exists, and where does its persistence end, apart from the session?
- Scope: confirm G3 = CL14, G4 = CL20, X2 = CL21, F3 remainder = CL01 plus CL19, and F4 = CL02.

### The owner (only where the record makes it the owner's)

- I3: the ratio of familiar to exploratory material. The row calls 70/30 "a starting point and the owner's call"; the design itself is the reviewer's.
- I5: does the phone get the personal build (D19's private route), or stay strict with public-domain replacements? This follows the owner's instruction of 2026-09-17; Q76's owner word covered two rungs only.
- Already decided, no longer blocking: Q78 (both rags, if each passes), T54 (split three ways by kind of truth) and the two H2 sessions (questions-bd7d303e.md §8).

### The code (technical choices without product consequence; the orchestrator decides and states why)

- E1: one resolved run config now, or at the next mutation bug? No live defect is known.
- G6 (after E50a): is a generator's table-derived level 'judged', or a third source beside 'estimated' with its own mark? This follows R1.
- G12: are item `concepts` validated curriculum ids (315 tags renamed or dropped), or descriptive tags in a field of their own?
- G13: which boundary in `generate_exercises.py` gives clear ownership first (Part 15 §26)?
- L51: a second compaction stage, or a bound in bytes, for the sessions store, keeping rung and evidence semantics exactly?
- L99: a bounded retention that keeps rung and evidence semantics exactly, perhaps with a per-run semantic witness?
- R28: is E0's measurement plus demands under one fingerprint the canonical analysis, or must everything read one PieceAnalysis?
- R31: is an exercise reachable only from the Library a warning or an error, and should an unfitted index print no level?
- E39: keep the original MIDI bytes on the import row (a storage cost and a DB_VERSION bump) so converter fixes reach stored imports?
- E46: is the finder's lesson-site wiring wanted? If so, each seed work first gets a level, key, metre and genre and a rung check.

## Reads needed

Every READ row, and every RE-CHECK row whose provisional disposition is READ: 36 rows.

### Musical read (an ear or a pianist)

- S9: goodTeachingUse decisions, item by item, on the 5 cut excerpts and the music-promising studies (G57's 2.1-2.2 studies merged in).
- M2: usableScore and goodTeachingUse by second readers, per family, level and excerpt, on the notation and heard bases (G32 and G40 merged in).
- Q57: hear the clave, tresillo, tumbao and montuno exercises and record a teaching-use decision on each; this unstalls latin.3 and latin.6.
- I9: hear the groove and style families for idiom before any constraint is written (one sitting with M2).
- I6: AT-9: judge each genre's modes, jam and lab as musicianship; does Blues 1-7 read as a jam curriculum?
- I8: hear the tracks' genre items at 1.1-3.3: is each at the earliest honest point?
- I10: AT-9's lab pass: which of the six areas does the lab offer as exploration?
- I11: map the existing improvisation and accompaniment experiences onto Part 9 §13's sequence, rung by rung.
- R9: read Anh. 113 against classical.3's teaching: keep it, move it, or teach it through its excerpt?
- R6: AT-6: for each rung-placed PDMX piece, what it teaches, contains and avoids, and its style, texture and challenge.
- R13: the bar ranges of the phrases in each rung-placed PDMX piece, for `sections.json`.
- T54, part B: one bounded pianist pass on octaves, left-hand arpeggio fingerings, and the rotation and repeated-note wording.
- X16: hear candidate ready, complete and next cues at the instrument, and check they are distinct from the metronome and the piano.

### Source read

- T53: a source for each remaining contested row in f0-disposition-85.md; for the musical-judgement rows, a notation read, marked "unverified as music" where only an ear can settle it.
- T54, parts A and C: sourced answers for the pedal and acoustics, guitar tuning, Hutchinson, chord-scale, swing-or-shuffle and stride claims; an authoritative clinical source for practice.4's threshold. Remove or soften whatever is unsourced by H2.
- R21: which graded studies (Reinagle, Czerny, Burgmüller, early methods) exist in usable public-domain notation, and which rungs they would serve.
- R26: public-domain notation for a habanera or tresillo piece, a modern tango and a cakewalk, and a home for the six unhomed carols.
- X40 (lane): the MuseTrainer source's own history for its 120 against the printed 100, plus a table over every MuseTrainer and kern row.

### Device read (H2)

- E14: precache bytes from a build (a code read), then install and update cost and storage on the owner's phone, and the projected size of the excerpt corpus.

### Learner read (H2)

- No READ row needs a learner. The rows that depend on learners are DEFER TO H in CL25 (M1, R43, Q40, X14) and the owner's H2 session B.

### Pedagogical, notation or measurement read (a second reader, no ear)

These are the READ rows that fit none of the four groups asked for; they need neither an ear nor a device.

- G18: per rung, how many options are one family with different parameters, and do the roles form Part 15 §9's sequence?
- G31 (after L120d): does each generated item placed on a rung serve that rung's claim (AT-4, AT-13)?
- R10: AT-13 per rung: do the options that do not establish the claim, and the finder prompt, fit what the rung teaches?
- R25: AT-13 per rung: does each option's music reinforce the concept, and where should the music just be music?
- R41: for items placed on several rungs, what differs at each placement, or which placement should go?
- L88 (after L120d): per rung, what ability it claims to change and what observation could establish it.
- L112 (after L120d): a teaching-use read of F2's eighty proposals and the practice rungs' lists.
- L30 (after L120d): AT-3 over the constructed diaries: does the warm-up prepare the day's new or repertoire material?
- L33: AT-1: each tip against the list of practice strategies.
- T16 (after L120d): per lesson, the terms used before the rung that introduces them.
- T21: AT-8 on theory.3-9 and the harmony drills, one item at a time (label, then sound, then function, then use).
- T27 (after L120d): read 2.1.md and its options for the hands-together reading they expect.
- G39: the 15 pedal items at 342 px and 1280 px: are the marks unambiguous and free of collisions? (U28 merged in.)
- U35 (after U32): how often runs shrink mid-run across the stage, and what pricing from the widest row costs.
- U88 (after U32): bisect the rotation--bars1-real-phone break across the landing commits, then judge the cell under the three goods.
- U83: the bar's width and row count, read from a failing runner run's artefacts.
- X9: AT-7: every practice and browsing screen at 342 px, against what it is, why, what to attend to, and what happens when done.
- X10: every screen's 342 px picture, against the rule of one dominant action.

## Closed by later work

- E2 (B): no seam closed it. The boundary holds at HEAD by grep. Scope of that grep: app/src/engine imports and DOM and storage globals, and ScoreScreen accuracy arithmetic.
- E12 (B): E0 (Entry 92, f3b75b7.md), `attach_demands` in build.py.
- E16 (B): D2 (Entry 95, 7e148e0.md) and D2a (Entry 99, b118750.md).
- E29 (B): E-tail (Entry 115, responses/f972756.md).
- E32 (B): E-tail (Entry 115, responses/f972756.md).
- E40 (B): E-tail (Entry 115, responses/f972756.md).
- E45 (B): X3 (Entry 118, responses/070a6f7.md).
- E48 (B): E-tail (Entry 115, responses/f972756.md).
- E51 (B): E51 (Entry 159, dffa9c34.md) and E51a (Entry 164, responses/70043128.md).
- G68 (A1): G2 (entry-126), transferPolicy.ts:176-181; responses/5193338.md.
- G75 (A1): ruled responses/030ce744.md; the implementation kept.
- G76 (A1): ruled closed responses/030ce744.md.
- G77 (A1): G2a (entry-132); responses/337a0324.md.
- G82 (A1): G1d (entry-142) and G1e (entry-150); responses/d59f2ef8.md, 9fce3792.md.
- G83 (A1): G1c (entry-139); responses/77b1027f.md.
- G84 (A1): G1c (entry-139); responses/77b1027f.md.
- G85 (A1): G85 (entry-147) and G85a (entry-160); responses/9c64a9c1.md.
- G86 (A1): G86 (entry-158) and G86a (entry-165); responses/d5508d7b.md.
- G89 (A1): G1e (entry-150); responses/9fce3792.md.
- G93 (A1): G1e's boundary change; responses/9fce3792.md.
- I2 (C): with R19: G1b (Entry 138, responses/536d9bc2.md), G1d (Entry 142), G1e (Entry 150, responses/9fce3792.md).
- L20 (A1): L52/C7 (tempoMeasured false at DrillScreen.ts:2660); selfReport has a second writer (PaperScreen.ts:338).
- L32 (A1): X1 (entry-134); responses/aed824a1.md.
- L44 (A1): T42 (entry-74), the L42 fix.
- L60 (A1): G1a (entry-119); responses/5b14b7a.md.
- L84 (A1): C6 (entry-80), strandsOf.
- L86 (A1): G1b (entry-138) and G1c (entry-139); responses/536d9bc2.md, 77b1027f.md.
- L94 (A1): G1b's separate projects store; responses/536d9bc2.md.
- L97 (A1): G1 (entry-112) and G1a (entry-119); responses/b48342f.md, 5b14b7a.md.
- L106 (A1): E0a; responses/f3b75b7.md.
- L113 (A1): X1 (entry-134); responses/aed824a1.md.
- L117 (A1): F2c (entry-130); responses/267cac32.md.
- M4 (A2): D3 (Entry 100), D0 (Entry 90), D1 (Entry 94); G9 closed in responses/ee70b43.md.
- M5 (A2): C6 (Entry 80), C4c (Entry 77), with D0 and E0 (Entries 90, 92) supplying target skills and measured demands.
- M6 (A2): D2 (Entry 95), the review record in content/review/README.md.
- Q7 (B): S1 (wave B), D0 (Entry 90) and D5 (Entry 110, responses/458159e.md).
- Q24 (B): Q24 (Entry 89, responses/e32d0ef.md).
- Q34 (B): H0 (Entry 87, responses/a008ba5.md).
- Q37 (B): H0 (Entry 87, responses/a008ba5.md).
- Q39 (B): H0 (Entry 87, responses/a008ba5.md).
- Q44 (B): H0 (Entry 87, responses/a008ba5.md).
- Q47 (B): Q47 (Entry 113, responses/8668afb.md).
- Q56 (B): D3c (Entry 104, responses/e85c162.md).
- Q59 (B): E1a (Entry 105, responses/4f7227d.md).
- Q61 (B): ruling in responses/e85c162.md; its defect G62 was built in X1 (Entry 134, aed824a1.md).
- Q64 (B): Q-tooling (Entry 116, responses/198c148.md).
- Q65 (B): Q-tooling (Entry 116), Q65a (Entry 120, 3c661d4.md) and Q65b (Entry 124, b690be15.md).
- Q75 (B): Q75 (Entry 131, responses/56a4b9b7.md).
- Q76 (B): Q76 (Entry 136, responses/e4f9d3f2.md).
- Q80 (B): Q80 (Entry 141, responses/2d9e7e2c.md).
- Q82 (B): Q82 (Entry 145, responses/7cdc0f72.md).
- Q86 (B): ruled in responses/2d9e7e2c.md; built as Q88 (Entry 151).
- Q88 (B): Q88 (Entry 151, responses/d249d64f.md); pushed before its local chain finished, which does not reopen it (questions-bd7d303e.md §10); closes fully on the healthy Pages run read-back, not yet recorded.
- R2 (B): E0 (Entry 92; responses/f3b75b7.md, E0a 5bfe6d2.md, E0b c95ac32.md). Measured demands are in the catalogue.
- R19 (B): G1b (Entry 138, responses/536d9bc2.md), G1d (Entry 142, d59f2ef8.md), G1e (Entry 150, 9fce3792.md).
- R24 (B): the composed session's per-slot reason (session.ts:67), carried through X1 (Entry 134, responses/aed824a1.md).
- R33 (B): E0 (Entry 92, f3b75b7.md) and E2 (Entry 107; E2a 9571a7b.md) for import truth; X3 (Entry 118, 070a6f7.md) for the learner workflow.
- R34 (B): E0 (Entry 92, f3b75b7.md) for `correctImportHands`; X3 (Entry 118, 070a6f7.md) for the swap control.
- R42 (B): D2 (Entry 95, responses/7e148e0.md); E1 (Entry 101) for the boundary record.
- S6 (A2): C4b (Entry 76), the per-demand control map; C4c (Entry 77), the reader that moves one demand at a time.
- S15 (A2): D1 (Entry 94), S26's hard cap; D1a (Entry 97), version 2 in force; responses/8a13eb1.md.
- S19 (A2): C1 (Entry 70), T40 (Entry 68), G1a (Entry 119).
- S23 (A2): C4b (Entry 76), row 7 set to `sixteenths: false`.
- T34 (A2): F3a (Entry 157), accepted in responses/02a52fdb.md (APPROVE).
- T36 (A2): F3a (Entry 157), accepted in responses/02a52fdb.md (APPROVE).
- T37 (A2): F3a (Entry 157), accepted in responses/02a52fdb.md (APPROVE).
- T42 (A2): F3a (Entry 157), accepted in responses/02a52fdb.md (APPROVE).
- T43 (A2): F0 (Entry 82, b8f713c6), confirmed by F3a (Entry 157).
- T44 (A2): F3a (Entry 157), accepted in responses/02a52fdb.md (APPROVE).
- T45 (A2): F3a (Entry 157), accepted in responses/02a52fdb.md (APPROVE).
- T52 (A2): F3a (Entry 157), accepted in responses/02a52fdb.md (APPROVE).
- T55 (A2): F3a (Entry 157), accepted in responses/02a52fdb.md (APPROVE).
- U11 (C): Entry 63 (T34 rule 4) and Entry 65 (T38 MIN_STAFF_PX); WindowRenderer.ts:117, :1864–1912.
- U14 (C): the owner's order of 2026-09-23 in 04 §5:2262–2289, built in Entries 63 and 65: the count is the learner's ask and yields to the floor.
- U18 (C): built behind 04 §5's auto-hide and 08 §9.34; ScoreScreen.ts:3186–3232. The status line it hides is U53's, which stays open.
- U40 (C): the T38 follow-up of 2026-09-25 (Entry 65's wave) revised score.spec.ts:360–381; local references are gitignored (.gitignore:44).
- U58 (C): Entry 134 (X1's voice pass, U57); help.ts:610.
- U69 (C): G86 (Entry 158) and G86a (Entry 165); responses/970fd770.md, responses/d5508d7b.md (APPROVE, closed). The real-phone check stays unverified until the owner makes it.
- U75 (C): X3 (Entry 118); responses/070a6f7.md (APPROVE).
- U80 (C): U80 (Entry 125); responses/ba86d75c.md (APPROVE).
- U90 (C): Entry 135; responses/994586f9.md (APPROVE).
- U92 (C): Entry 143; responses/questions-ea14b1fe.md (approved); the code is in the tree at style.css:3746–3754.
- U102 (C): Entry 162; responses/35efb10e.md (APPROVE, closed).
- X1 (C): Entry 134; responses/aed824a1.md (APPROVE).
- X4 (C): superseded by X1 (Entry 134; responses/aed824a1.md), whose Today gives a reason per slot, and by Plan's Next up card (PlanScreen.ts:285).
- X21 (C): X3a (Entry 122); responses/564e8e5f.md.
- X24 (C): X3c (Entry 129); responses/3caf2711.md (X3e APPROVE).
- X25 (C): X3b (Entry 128); responses/f9d36867.md (APPROVE).
- X29 (C): X3d (Entry 133); responses/3caf2711.md (X3e APPROVE).
- X31 (C): X31 (Entry 144) and X31a (Entry 154); responses/aa16c702.md, responses/dd9aea36.md (APPROVE).
- U16 (re-check): rule held at ba0126ad; its breach U3 built in T38 (Entry 65); the rule stays U32 and CL07 acceptance.

## Rejected

- **L56 (A1):** no reader. The chord-skill activation that would need pitch-level misses can add them when it exists.
- **Q79 (B):** the premise is refuted at the files. The authored 2.4 ABC sources write no dynamics, and song.folk.greensleeves on 2.4 prints six `<dynamics>` marks, so nothing is dropped.
- **Q91 (B):** the reviewer ruled correct the behaviour where a missing chopin-first-editions clone fails validation (responses/7cdc0f72.md:14). A table would manufacture an identity the reviewer refused, and Q88 keeps the last good deploy live.

## The next six seams

Chosen under the priority stack, given the lanes in flight (U32, U63, U105, E50a's correction, L120c landing), the queued lanes (L120d, E50, T58, X40) and G96 landing. Each owns only files that no lane holds (checked against the briefs and the E50a, G96 and U63 diffs), and none waits on a decision or a read. They are balanced across the three lanes: learning and content (1, 3), interaction (4, 6), pipeline and tooling (2, 5).

1. **CL01, build half — lesson truth.**
   - Rows: T4, T47, T48 (tier 0; T4 and T48 are P1).
   - Files: `content/lessons/improv.3.md`, `improv.4.md`, `improv.8.md`, `ragtime.9.md` and the other hits of `tools/content/lint_absolutes.py`; `app/tests/unit/lessonClaimsAboutMusic.test.ts`.
   - Buildable now: F3a's pattern is approved; L120c's lesson edits have landed (3.5, 4.2, 4.3, 4.4); no lane holds these lessons. T53 and T54's reads run beside it as research, and the owner's fallback bounds them.
2. **SG01 — excerpt rejection.**
   - Row: E54 (tier 0).
   - Files: `tools/content/excerpts.py`, `tools/content/tests/test_excerpts.py`, `content/sources/excerpts.json`.
   - Buildable now: ruled in questions-71bd6cee.md; E50a's diff does not touch `excerpts.py`.
3. **CL04 — evidence truth.**
   - Rows: G70, L79, L73, L70 (tier 1): four rows in one boundary.
   - Files: `app/src/evidence/rungState.ts`, `evidence.ts`, `measurement.ts`, `app/src/ui/assignSheet.ts`, `app/src/ui/screens/PaperScreen.ts`.
   - Buildable now: no lane touches `app/src/evidence/`, and E50a's `progressStore.ts` change is outside these files. L70 reads `db.ts` only and needs no version bump.
4. **CL05 — practice lifecycle.**
   - Rows: X15 (tier 1, P1); X16's read follows it.
   - Files: `app/src/ui/screenLifecycle.ts`, `app/src/ui/screens/DrillScreen.ts`, `PdfScreen.ts`, `ChordChartScreen.ts`, `LabScreen.ts`.
   - Buildable now: U105 holds `ScoreScreen.ts`, `help.ts` and `ScreenKeyboardSource.ts`, none of these.
5. **CL06, answer-key half — outcome tests.**
   - Rows: Q2 (drill answer keys), Q21, Q23 (tier 1).
   - Files: `app/tests/e2e/drills-harmony.spec.ts`, `modes-dictation.spec.ts`, `modes-simon.spec.ts`, `audio.spec.ts`, `carry-overs.spec.ts`, `shelf.spec.ts`, `score.rotate.spec.ts`, `app/tests/tour/t30-sheet.mjs`.
   - Buildable now: existing specs are revised and none are added, so `checks.json` (T58's) is untouched; U105 holds only `score.screen.spec.ts`. The window half waits on U32.
6. **SG02 — late input.**
   - Row: U66 (tier 1).
   - Files: `app/src/engine/PracticeEngine.ts`, `app/tests/unit/engineTempo.test.ts`, `app/tests/e2e/engine.spec.ts`.
   - Buildable now: the reviewer asked for a reproduction and a rule (responses/a008ba5.md); no lane holds the engine. It is a single, but it affects the judgement of every run, and tier 1 outranks the multi-row tier-2 clusters.

Next after these: SG03 (G90, tier 1), CL16 (S34, S35, G37, tier 2), CL15's build rows (G51, G54, U68, G7, tier 2), R23 (the part of CL10 free now), SG05 (E8).

## The table

Columns: the rules' seven, plus the file the row came from. Dispositions are those after the cross-checks. The current-truth cells are the triagers' (read at 034d4039), shortened to fit, with an "x-check:" note where this pass changed the reading. Paths are basenames; the triage files hold the full paths.

| row | current truth | disposition | cluster | dependency | evidence needed | owner/files | file |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E1 | The mode is assigned at several lifecycle points (ScoreScreen.ts:414, 1208, 2366, 5073, 5086-5090). There is no single resolved, immutable run config. The one recorded bug is fixed | DECISION | SG07 | U105 (ScoreScreen.ts) for any build | Refactor mode and settings into one resolved run config now, with no live defect known, or only at the next… | ScoreScreen.ts, settingsStore.ts | B |
| E2 | At HEAD, app/src/engine imports no ui or OSMD module and uses no DOM or storage (grep: two hits, both in comments). ScoreScreen computes no accuracy arithmetic (grep) | CLOSE | SG07 | - | - | engine, ScoreScreen.ts | B |
| E3 | AT-14 has not run. The score (T31), the session run (X1) and the project lifecycle (G1b) have explicit states. Onboarding, MIDI, mic calibration, folder permission and update are unaudited | DEFER TO H | CL24 | - | - | sessionRun.ts, projectStore.ts, MicScreen.ts | B |
| E6 | Same concern as R27: the conversion report and round-trip tests (AT-5) | MERGE → R27 | CL03 | - | - | convert.py, test_convert.py | B |
| E8 | The folder fallback chain exists (showDirectoryPicker, then webkitdirectory; folderLibrary.ts:12-15,141). No last-backup date or reminder appears under app/src (grep "last backup", "lastBackup") | BUILD NOW | SG05 | - | - | backup.ts, SettingsScreen.ts, settingsStore.ts | B |
| E10 | No device-state matrix has been run. X15's interruption lifecycle, U31's run persistence and the session resume exist separately. This needs the owner's devices | DEFER TO H | CL25 | - | - | sessionRun.ts, unfinishedRun.ts | B |
| E12 | The build measures every score with the app's own detectors (build.py:246 `attach_demands`). 2,013 items carry demands and 233 carry targetSkills in the built catalogue (E0, Entry 92) | CLOSE | CL10 | - | - | build.py | B |
| E14 | The precache takes every file matched by its globs, with a 30 MB per-file cap (app/vite.config.ts:97-110). No measurement of install bytes, update cost or phone storage is on record | READ | CL24 | - | Precache bytes from a build; install and update cost and storage on the owner's phone; the projected size of… | vite.config.ts, 03-content-pipeline.md | B |
| E15 | There is no first-readable latency budget per device class. Excerpt files exist for only 5 cuts (inventory.md) | DEFER TO H | CL24 | U32 | - | perf.spec.ts, WindowRenderer.ts | B |
| E16 | One builder-facing microscope screen exists, with its projection in the dev/ root outside the precache. Approved in responses/7e148e0.md; D2a accepted in b118750.md | CLOSE | - | - | - | review.py, vite.config.ts | B |
| E20 | There are no rendering budgets per device class. The phone is the truth while the app is personal | DEFER TO H | CL24 | U32 | - | perf.spec.ts | B |
| E22 | The detectors still demand every bar (`everyBar`, detect.ts:520,546), and five rung claims stay in `DEFERRED_CONCEPT_CLAIMS` (validate.py:1506). The reviewer requires share or density semantics… | RE-CHECK (L120d re-pins the untaught table) [BUILD NOW] | CL10 | L120d | Same re-pin as R32; each deferral removed as its reading changes | detect.ts, validate.py, demandsOfFiles.test.ts | B |
| E29 | `excerpt_target_warnings` warns for each approved target that the cut does not establish (validate.py:1086,1099). Approved in f972756.md | CLOSE | SG01 | - | - | validate.py | B |
| E32 | The learner's MusicXML import reads a metronome mark printed only as text (importStore.ts:534-761). The seven bundled PDMX rows belong to E50. Approved in f972756.md | CLOSE | CL03 | - | - | importStore.ts | B |
| E39 | Import rows keep only MusicXML text or PDF bytes (db.ts:469). The MIDI bytes are dropped, so a converter bump can re-measure a stored import but cannot re-convert it | DECISION | CL23 | the next DB_VERSION bump | Keep the original MIDI bytes on the import row (a storage cost and a db.ts version) so converter fixes reach… | db.ts, importStore.ts | B |
| E40 | `measuringFingerprint.ts` owns the measuring definitions and their value (lines 38-66). `measuredUnder` carries version plus fingerprint. Approved in f972756.md | CLOSE | CL23 | - | - | measuringFingerprint.ts | B |
| E45 | No "rock-module" wording is left in app/src or docs/03 (grep). X3, Entry 118, approved in 070a6f7.md | CLOSE | - | - | - | session.ts, 03-content-pipeline.md | B |
| E46 | `with_seed_examples` adds seed works with no level, key or metre check (finder.py:151-171). The lesson site is still unwired (build.py:1220 passes no concepts); the concept site is wired… | DECISION | SG09 | - | Is the lesson-site wiring wanted? If so, each seed work first gets a level, key, metre and genre, and a… | finder.py, teaching-repertoire.json, build.py | B |
| E48 | `stateImportTempo` owns the whole mutation: the tempo authored, the score re-measured, only the resolved untrusted facts cleared (importStore.ts:910). Approved in f972756.md | CLOSE | CL23 | - | - | importStore.ts | B |
| E50 | x-check: conditionally approved at ba0126ad; carries R11. Seven bundled PDMX rows are still `tempo-defaulted`. E50 runs only after E50a (the pinned conversion date and the alias boundary), which is… | RE-CHECK (E50a; the E50 lane queued) [BUILD NOW] | CL03 | E50a | E50a's landing and its identity-alias semantics | convert.py, pdmx.json, build.py | B |
| E51 | A stale approval can now be renewed and the old row is kept in `superseded` (E51, Entry 159). The checks-map rows and the comment were added by E51a (Entry 164). Accepted in 70043128.md | CLOSE | SG01 | - | - | excerpts.py, excerpts.json | B |
| E54 | A rejection of a current approval is appended beside it and the approval stays active (excerpts.py:843-848). The ruling: the rejection withdraws the approval and stops the cut (questions-71bd6cee.md) | BUILD NOW | SG01 | - | - | excerpts.py, test_excerpts.py, excerpts.json | B |
| G6 | generate_exercises.py:941 writes levelSource 'judged' on table-derived levels; selectors.ts:124 ranks judged 1, estimated 0 (the tie-break at :220); LevelSource is… | RE-CHECK (E50a owns types.ts) [DECISION] | CL17 | E50a; R1 | is a generator's table-derived level 'judged', or a third source that ranks beside 'estimated' and prints… | generate_exercises.py, selectors.ts, types.ts | A1 |
| G7 | generate_exercises.py:1968-2021: interval reading is C position only, fingering on the first note, a random walk of 2nds and 3rds; stage-1.json:368-370 lists .01-.03 | BUILD NOW | CL15 | - | - | generate_exercises.py, family_contracts.json, test_generator.py | A1 |
| G10 | stage-3.json:297-298 still lists the C-position .05 items on 3.4; entry-90: they hold no ledger line or leap (measured) | MERGE → G7 | CL15 | - | - | generate_exercises.py, stage-3.json | A1 |
| G12 | validate.py:1181 checks lesson concepts only; 315 distinct item tags (2,833 uses) in the built catalog are not in concepts.json; five-finger items tag 'five-finger' (generate_exercises.py:1235) | DECISION | CL10 | - | are item `concepts` curriculum concept ids (validated, 315 tags renamed or dropped) or descriptive tags… | validate.py, generate_exercises.py, concepts.json | A1 |
| G13 | generate_exercises.py is 6,392 lines; only musical_evaluator.py and family_contracts.py stand apart (entry-100); Part 15 §26 forbids a split for line count | DECISION | CL15 | - | which boundary first gives clear ownership (musical facts, family recipes, realisation, validators… | generate_exercises.py, family_contracts.py, study.py | A1 |
| G18 | no rung-diversity or pedagogical-fingerprint validator in tools/content (grep; build.py's fingerprints are detector caches); D0 changed no placement (entry-90 item 9) | READ | CL13 | - | per rung: how many options are one family with parameters, and whether the roles form Part 15 §9's sequence… | rung_audit.py, validate.py, curriculum/stage-*.json | A1 |
| G24 | musical facts still sit as module constants in generate_exercises.py (e.g. INTERVAL_BAR_RHYTHMS :1965, power-chord bars :5397) | MERGE → G13 | CL15 | - | - | generate_exercises.py | A1 |
| G30 | family_contracts.json: 43 families print fingering with no source, 9 print none, 5 sourced; family_contracts.py:430-437 checks consistency, not correctness | DECISION | CL02 | - | for the 43 unsourced families: source each fingering (a pianist's read per family) or switch them to printed… | family_contracts.json, generate_exercises.py… | A1 |
| G31 | no audit of generated-item placement beyond D0's 71 untaught combinations (entry-90) and L120a's untaught table (docs/prompts/runs/L120b) | READ | CL13 | L120d | whether each generated item placed on a rung serves that rung's claim (AT-4, AT-13), item by item | rung_audit.py, curriculum/stage-*.json | A1 |
| G32 | x-check: the same sitting as M2 (heard basis). D2's microscope exists (entry-95) with content/review/decisions.jsonl; the groove and style families are unheard (entry-110: "Nothing was heard") | MERGE → M2 | CL13 | - | - | DevMicroscopeScreen.ts, decisions.jsonl | A1 |
| G37 | sightReading.ts:912-922 fixes the pattern unit at a quarter or eighth in any metre; :943 builds from the lowest tonic of lhKey (low 36 = C2 at :410) | BUILD NOW | CL16 | - | - | sightReading.ts, sightReading.test.ts | A1 |
| G39 | the pedal family ships (15 catalog items; stage-3.json:379-381, stage-6.json:34); no entry 90-165 records a pedal notation fix (grep) | READ | CL15 | - | the 15 pedal items drawn on the Score screen at 342 px and 1280 px: are the marks unambiguous and… | generate_exercises.py, OsmdView.ts | A1 |
| G40 | x-check: the same sitting as M2 (notation basis). the microscope draws items through the app's renderer (entry-95), but no per-family rendered read is recorded; D5 says nothing was heard (entry-110) | MERGE → M2 | CL13 | - | - | DevMicroscopeScreen.ts, decisions.jsonl | A1 |
| G51 | the syncopation contract now targets `tie` (family_contracts.json); the tremolo, walking-bass ending, tie density, pentatonic length and broken-7 seam recipes are unchanged; to family owners… | BUILD NOW | CL15 | - | - | generate_exercises.py, family_contracts.json, test_family_contracts.py | A1 |
| G52 | generate_exercises.py:1433-1459 still respells a double flat note by note; the reviewer: decide whole-chord enharmonic spelling or a double flat (responses/3b9c37d.md) | DECISION | CL15 | - | respell the six D♭/G♭ seventh arpeggios from the enharmonic root, or print the double flat? | generate_exercises.py, test_key_spelling.py | A1 |
| G54 | family_contracts.json assigns power_chord's canonical at key C; the plan ships A, E, D only (generate_exercises.py:6240); no test holds each canonical in the plan (grep) | BUILD NOW | CL15 | - | - | family_contracts.json, generate_exercises.py, test_family_contracts.py | A1 |
| G57 | x-check: a subset of S9 (goodTeachingUse on the studies). the reviewer: they stay labelled studies, never silently placed (responses/ee70b43.md); no hearing of the 2.1-2.2 studies is recorded | MERGE → S9 | CL13 | - | - | study.py, decisions.jsonl | A1 |
| G58 | the hands-together study recipe is as D3 left it (entry-100); no decision on a coordination study is recorded (grep) | DECISION | CL15 | - | does coordination get a study of its own, or a harder texture (a moving left hand under a held tune)? | study.py, family_contracts.json | A1 |
| G64 | session.ts:1349-1389 transferOffer offers any unmet transfer item each day; nothing retires an unplayed offer; the reviewer: an E2/X ranking decision (responses/9193261.md) | RE-CHECK (L120d owns session.ts) [DECISION] | CL12 | L120d | does an unplayed transfer offer yield after a day or two, and to what? | session.ts, session.test.ts | A1 |
| G68 | transferPolicy.ts:176-181 reads a row with no relationship as `unknown` (G2, entry-126); the invariant covers new writes (responses/5193338.md) | CLOSE | CL11 | - | - | transferPolicy.ts | A1 |
| G70 | rungState.ts:156 carriedExposures loops lesson.concepts only; assignSheet.ts:242 defaults to lesson.concepts only; neither reads `introduces` | BUILD NOW | CL04 | - | - | rungState.ts, assignSheet.ts, rungStateFromEvidence.test.ts | A1 |
| G71 | x-check: E50a edits encounterStore.ts. DrillScreen.ts and LabScreen.ts import no encounterStore (grep); the reviewer keeps it as G71 (responses/b48342f.md); which… | DECISION | CL11 | E50a (encounterStore.ts); X15 | is a drill card's prompt a hearing of identified material that a familiarity reader consumes? write it, or… | DrillScreen.ts, LabScreen.ts, encounterStore.ts | A1 |
| G75 | ruled: a row with no relationship cannot retain a transfer achievement; the implementation kept (responses/030ce744.md; transferPolicy.ts:176) | CLOSE | CL11 | - | - | transferPolicy.ts | A1 |
| G76 | ruled: the fifteen transfer blocks stand; no `source` dimension for sight-reading (responses/030ce744.md) | CLOSE | CL11 | - | - | skills.json | A1 |
| G77 | built as G2a (entry-132): a composition relationship reads `unknown` (transferPolicy.ts:194); accepted (responses/337a0324.md) | CLOSE | CL11 | - | - | transferPolicy.ts | A1 |
| G80 | transfer.ts:79 composition carries key and playedAs only; no arrangement identity or bar range per played item | DECISION | CL11 | - | can another cut or arrangement of a played piece ever count as an independent context? if yes build the… | transfer.ts, transferPolicy.ts | A1 |
| G82 | G1d (entry-142) then G1e (entry-150): usable() skips a paused or retired piece for every automatic slot (session.ts:759); accepted (responses/9fce3792.md) | CLOSE | - | - | - | session.ts | A1 |
| G83 | G1c (entry-139): Plan presents the project stage with no count and no badge (PlanScreen.ts:127-130); accepted (responses/77b1027f.md) | CLOSE | - | - | - | PlanScreen.ts | A1 |
| G84 | session.ts:33 imports projectStore.PROJECT_STAGES (projectStore.ts:91), one constant; accepted (responses/77b1027f.md) | CLOSE | - | - | - | session.ts | A1 |
| G85 | G85 (entry-147) badge and filter, G85a (entry-160) the Details door (LibraryScreen.ts:864); accepted (responses/9c64a9c1.md); the Stage 9 rows' route is G91 | CLOSE | CL22 | - | - | LibraryScreen.ts | A1 |
| G86 | G86 (entry-158) drains openSheets; G86a (entry-165) refuses a silent start (withSound); approved and closed (responses/d5508d7b.md); U105 separate | CLOSE | - | - | - | ScoreScreen.ts | A1 |
| G89 | G1e (entry-150): SlotContext.pausedOrPutAway asked in usable() (session.ts:562, :759); accepted (responses/9fce3792.md) | CLOSE | - | - | - | session.ts | A1 |
| G90 | ruled: a live veto at the activity boundary, the pending activity skipped with the reason (responses/d59f2ef8.md); sessionRunner.ts reads no project state (grep) | BUILD NOW | SG03 | - | - | sessionRunner.ts, sessionRun.ts, sessionRun.test.ts | A1 |
| G91 | x-check: projectSheet.ts is G96's (48bfc167). the Library door ruled and built (G85a, responses/ba4c6fea.md); LessonScreen.ts opens no project sheet (grep), so Stage 9 rows reach it only through the… | RE-CHECK (G96 owns projectSheet.ts) [BUILD NOW] | CL22 | G96 | G96 landed; then a 342 px browser case | LessonScreen.ts, projectSheet.ts | A1 |
| G93 | the rung step goes through usable() under the ruling (session.ts:751-759); the held wait kept (responses/9fce3792.md) | CLOSE | - | - | - | session.ts | A1 |
| G96 | x-check: built at 48bfc167 in its worktree; not merged at ba0126ad. brief approved and dispatched 2026-09-30 at a7c232c7 (Entry 168; responses/questions-71bd6cee.md); the lane is in flight | RE-CHECK (G96 built at 48bfc167, not merged) [BUILD NOW] | LN-G96 | G96 landing and review | G96's landing and review | projectStore.ts, projectSheet.ts, widgets.ts | A1 |
| G97 | only ScoreScreen.ts drains its sheets (grep openSheets); openSheet at widgets.ts:265; direction recorded: a screen-owned disposer helper (responses/questions-71bd6cee.md) | RE-CHECK (G96 owns widgets.ts; U63 owns TodayScreen.ts) [BUILD NOW] | CL22 | G96; U63 | G96 and U63 landed, then one helper and a red case per screen | widgets.ts, screens/*.ts | A1 |
| I2 | x-check: R19 is closed (G1b, G1d, G1e), so I2 closes with it. R19's lifecycle states exist in projectStore.ts:45 (G1b). I2's source column is R19 itself (backlog-2026-09-25.md:588). | CLOSE | CL14 | - | - | projectStore.ts | C |
| I3 | No declared interests and no exploration share: settingsStore.ts holds neither (grep scope: that file). Saved, paused and retired exist as project states (projectStore.ts:45). | DECISION | CL14 | L22; L120d | do declared interests steer selection, and at what exploration share? (70/30 is a starting point and the… | settingsStore.ts, session.ts | C |
| I5 | pages.yml:83 still builds strict, so the phone lacks the personal items (Q76 counted 235 unmeasured there). Q76's owner word (public domain first) and fix covered only the two rung gaps (Entry 136). | DECISION | CL18 | D19 | does the phone get the personal build (D19's private route), or stay on the strict public build with… | pages.yml, build.py, 03-content-pipeline.md | C |
| I6 | The genre rungs and the blues track exist, but no per-genre listen-to-perform audit (AT-9) has run. G32 carries the same sequence. | READ | CL20 | L120d for any placement | AT-9: each genre's modes, jam and lab judged as musicianship, and whether Blues 1–7 reads as a jam curriculum | curriculum/stage-*.json, LabScreen.ts | C |
| I8 | The genre elements at 1.1–3.3 were checked by invariant and by picture, never by ear (docs/prompts/traces/2026-09-25-repertoire.md:454–460). | READ | CL20 | L120d for any placement | the tracks' genre items heard: is each at the earliest honest point? | curriculum/stage-*.json, generate_exercises.py | C |
| I9 | The style families are marked "not evaluated: idiom needs hearing" (family_contracts.py:460–476). The generator has no per-style constraint. | READ | CL02 | - | the groove and style families heard for idiom before any constraint is written | generate_exercises.py, family_contracts.json, musical_evaluator.py | C |
| I10 | The lab judges nothing and records nothing (LabScreen.ts:24–25); a trade's verdict is two counts with no mark (:507). Its breadth across the six areas is unaudited. | READ | CL20 | - | AT-9's lab pass: which of harmony, rhythm, sound, accompaniment, improvisation and visualisation it offers… | LabScreen.ts, LabScreen.css | C |
| I11 | The pieces exist (trading fours and the jam in the lab, charts, accompaniment shapes: 04 §3c, §5c), but no strand sequences them. | READ | CL20 | I6; L120d | the existing experiences mapped onto Part 9 §13's sequence, rung by rung, by a musical read | curriculum/stage-*.json, LabScreen.ts, ChordChartScreen.ts | C |
| I12 | Blind is binary: it hides the engraving and changes nothing else (04-ui-spec.md:2694–2698). There are no partial prompts and no memory strand. | DECISION | CL21 | - | which partial-score steps between visible and blind the Score screen offers, and where memory is taught… | ScoreScreen.ts, WindowRenderer.ts, 04-ui-spec.md | C |
| I16 | Stage 9 is projects (G1c, Entry 139; U99), and retention offers learned pieces (G82). L92 carries the same "never Stages 10–50" rule. | MERGE → L92 | CL14 | - | - | session.ts, curriculum/stage-*.json | C |
| I17 | The transfer half is built (app/src/curriculum/transfer.ts; G2, Entry 126). The chain as the teacher's habit is L25's (Part 14 §17 lives in L25). | MERGE → L25 | CL12 | - | - | transfer.ts, session.ts | C |
| I18 | Ear work is drills (T22, T46). No audiation progression exists (grep "audiat" in app/src and content/curriculum: no hits). | DECISION | CL21 | T22 | which audiation experiences the app can observe (tapping, singing by microphone, playing after silent… | session.ts, drills, curriculum/stage-*.json | C |
| I19 | Duet, backing and trading exist (ScoreScreen.ts:720–730; LabScreen.ts:35), but no ensemble progression (grep "ensemble" in app/src: no hits). | DECISION | CL20 | I11; L22 | which ensemble experiences are named and sequenced from the existing duet, backing and trading machinery… | LabScreen.ts, ScoreScreen.ts, curriculum/stage-*.json | C |
| I20 | No goal object (grep deadline/Goal in app/src: no hits). Projects carry lifecycle states only (projectStore.ts:45). | DECISION | CL14 | G96; L120d | a goal's shape (type, target, deadline, reason, status), and how the composer weighs a deadline without… | projectStore.ts, session.ts, TodayScreen.ts | C |
| I21 | No re-entry handling (grep for re-entry, long break and welcome back in app/src: no hits). | DECISION | CL14 | L120d | the gap that triggers calibration, and what the diagnostic sample holds per domain | session.ts, eligibilityCore.ts | C |
| L10 | Scoring.ts:219-226: Wait is a share of steps, Tempo a share of notes with wrong notes free; rungState.ts:205 applies one passAccuracy to both | DECISION | CL11 | - | does a runs requirement read Tempo's share net of wrong notes, or keep a threshold per mode? | Scoring.ts, rungState.ts | A1 |
| L20 | DrillScreen.ts:2659-2660 stores tempoPct 100 with tempoMeasured false (L52, C7); selfReport has two writers (PaperScreen.ts:338, ScoreScreen.ts:3794) | CLOSE | - | - | - | DrillScreen.ts | A1 |
| L22 | session.ts:56 SlotKind still mixes purposes and experiences; no purpose or experience-contract type in app/src (grep) | RE-CHECK (L120d owns session.ts) [DECISION] | CL12 | L120d | the purpose -> experience contract -> material model of Part 25, designed once for E, G and X: its first slice | session.ts, sessionRunner.ts | A1 |
| L23 | skills.json holds 16 skills, none for continuity; no keep-going drill kind (grep) | RE-CHECK (L120d owns skills.json) [DECISION] | CL11 | L120d | is continuity a vocabulary skill observed from the engine's events (stops, restarts, hesitation), and is a… | skills.json, evidence.ts, Scoring.ts | A1 |
| L26 | x-check: the same question as R22 (breadth as a share of the day). exposure is only the fallback ladder's last step (session.ts:433); no exposure model by musical language or goal object | MERGE → R22 | CL20 | - | - | session.ts | A1 |
| L27 | no deliberate make-it-harder move outside the reading step-up (session.ts:2739-2758); the row's route is "design with L22" | MERGE → L22 | CL12 | - | - | session.ts | A1 |
| L28 | readingOffer diagnoses per demand for sight-reading (session.ts:2730-2737 singledOut); repertoire runs get no diagnosis | MERGE → L19 | CL09 | - | - | session.ts, Scoring.ts | A1 |
| L29 | evidence attributes per skill at opportunity steps (evidence.ts:776), but the run shows one share (Scoring.ts:219) | MERGE → L24 | CL11 | - | - | Scoring.ts, evidence.ts | A1 |
| L30 | the warm-up is the exercise an unmet requirement names, per strand (entry-80 item 1), not preparation for today's piece; no AT-3 observation is recorded (grep) | RE-CHECK (L120d owns session.ts) [READ] | CL12 | L120d | AT-3: over the constructed diaries, does the warm-up prepare the day's new or repertoire material? | session.ts | A1 |
| L32 | X1 (entry-134) landed the session execution layer (sessionRun.ts, sessionRunner.ts); accepted and closed (responses/aed824a1.md); detours stay X19 | CLOSE | - | - | - | sessionRun.ts, sessionRunner.ts | A1 |
| L33 | tips live in content/tips/*.md; no entry or response cites L33 or an audit of them against Part 16 §7 (grep) | READ | CL12 | - | AT-1: each tip against the strategy list (chunking, slow, rhythm-only, hands apart, backward chaining… | tips/*.md, lessons/*.md | A1 |
| L34 | the finish sheet's 'Loop the weak bars' (ScoreScreen.ts:4045) loops hot spots; nothing holds isolate -> reintegrate; that is X19's episode | MERGE → X19 | CL12 | - | - | ScoreScreen.ts | A1 |
| L38 | no entry or response cites L38 or a MIDI capture sitting (grep of entries 100-165) | DEFER TO H | CL25 | - | - | scoreSession.test.ts, PracticeEngine.ts | A1 |
| L39 | measurement.ts keeps two channels, pitch codes and onset timing; duration, simultaneity and continuity are not observed | MERGE → L21 | CL11 | - | - | measurement.ts, Scoring.ts | A1 |
| L44 | T42 (entry-74): the ladder holds with nothing listening and says so (help.ts:534 'Nothing listening') | CLOSE | - | - | - | PracticeEngine.ts | A1 |
| L47 | types.ts:244 includeGraceNotes false and nothing sets it (grep); classical.4.md:33 teaches ornaments and claims no app judgement | DECISION | CL10 | - | judge grace notes (under which timing rule) when an ornament skill exists, or keep ornaments unjudged and… | types.ts, prepareSession.ts | A1 |
| L51 | x-check: E50a edits progressStore.ts. progressStore.ts:860-864 compaction folds steps only; no byte bound or second stage | DECISION | CL23 | E50a (progressStore.ts) | what bounds the sessions store for a long-piece learner: a second compaction stage or a bound in bytes… | progressStore.ts, db.ts | A1 |
| L53 | x-check: E50a (338cc916) edits progressStore.ts. PERFORMANCE_REACH 2,200 (progressStore.ts:846); sessions carry byItem and byDate indexes only (db.ts:1153-1154) | RE-CHECK (E50a edits progressStore.ts) [BUILD NOW] | CL23 | E50a; the next DB_VERSION bump | E50a landed; ride the next DB_VERSION bump | db.ts, progressStore.ts | A1 |
| L56 | db.ts:399 `missed` is a count; no pitch is stored; no active skill reads chord misses (skillActivation.ts:41 activates sight-reading rows only) | REJECT | - | - | - | db.ts | A1 |
| L57 | skills.json skills carry standards, no threshold or precision; the precision constants sit in evidence.ts:281-300 (reviewer decision 6) | RE-CHECK (L120d owns skills.json) [DECISION] | CL11 | L120d | do support thresholds move into skills.json under the definitions version, or stay code constants as… | skills.json, evidence.ts | A1 |
| L58 | conditions are keep-tempo, unseen, guide-off, both-hands (evidence.ts:266-271); the ribbon names notes with the guide on (ScoreScreen.ts:4688), so a practice read can show names | RE-CHECK (L120d owns skills.json) [DECISION] | CL11 | L120d | does a practice-standard read with note names on the ribbon count? if not, a names-off condition from… | skills.json, evidence.ts | A1 |
| L60 | G1a (entry-119) records firstContact on every run (db.ts:178); `unseen` stays phrase-only because only phrase runs carry active skills (skillActivation.ts:41) | CLOSE | - | - | - | db.ts | A1 |
| L67 | improvisation writes no evidence, by design; a grammar per experience is L24's | MERGE → L24 | CL11 | - | - | evidence.ts | A1 |
| L69 | x-check: E50a (338cc916) edits progressStore.ts. progressStore.ts:860-864 compactObservation drops only `steps`; byDemand and otherDemands survive compaction | RE-CHECK (E50a edits progressStore.ts) [BUILD NOW] | CL23 | E50a | E50a landed | progressStore.ts, progressStore.test.ts | A1 |
| L70 | measurement.ts:128 refuses only an absent definitions; OBSERVATION_DEFINITIONS is 1 (db.ts:115), so no second version exists yet | BUILD NOW | CL04 | - | - | measurement.ts, db.ts | A1 |
| L73 | evidence.ts:765-774 drops the steps the timing window cannot discriminate before evidenceFrom counts both channels, so pitch loses them too | BUILD NOW | CL04 | - | - | evidence.ts, feedbackFromMeasurements.test.ts | A1 |
| L74 | readingOffer reads the last reads only (session.ts:2730); nothing remembers a removal, so a removed demand returns once its failures age out | RE-CHECK (L120d owns session.ts) [BUILD NOW] | CL08 | L120d | L120c/L120d landed | session.ts, sightReadingFromReadingState.test.ts | A1 |
| L75 | session.ts:2745-2748 `shown` counts phrases (demandShownAfter), not opportunities; the step-up skips shown or failing demands, not proficient ones | RE-CHECK (L120d owns session.ts) [BUILD NOW] | CL08 | L120d | L120c/L120d landed | session.ts, sightReadingFromReadingState.test.ts | A1 |
| L76 | session.ts:2735-2737: an unattributed failure gives 'unsure' and the easy read; no discriminating probe exists | RE-CHECK (L120d owns session.ts) [BUILD NOW] | CL08 | L120d | L120c/L120d landed | session.ts, sightReadingFromReadingState.test.ts | A1 |
| L77 | session.ts:2501-2506 readingMoves adds every off move moveFor returns, reachable or not; lessonClaimsAboutApp.test.ts reads it | RE-CHECK (L120d owns session.ts) [BUILD NOW] | CL08 | L120d | L120c/L120d landed | session.ts, lessonClaimsAboutApp.test.ts | A1 |
| L79 | PaperScreen.ts:397-400 opens the twin with no rung; rungState.ts:212-221 pools listed ids only, so an unlisted twin never counts for the book piece's rung | BUILD NOW | CL04 | - | - | rungState.ts, PaperScreen.ts, paperScreenTwin.test.ts | A1 |
| L84 | C6 (entry-80): the card chooses across strands (strandsOf, session.ts:621); the single-position residue is L93 | CLOSE | SG04 | - | - | session.ts | A1 |
| L85 | skills are per dimension (16 in skills.json), but Today's status line says 'Working on Stage N' from one position (TodayScreen.ts:1174) | MERGE → L93 | SG04 | - | - | TodayScreen.ts | A1 |
| L86 | G1b (entry-138): Stage 9 reads the project lifecycle, never counts; G1c (entry-139) Plan likewise; accepted (responses/536d9bc2.md, 77b1027f.md) | CLOSE | - | - | - | LessonScreen.ts | A1 |
| L88 | built curriculum: 173 runs, 19 unjudged, 3 done, 6 skill, 2 reads; every skill and reads requirement is in core (curriculum.json, counted) | RE-CHECK (L120d owns stage-*.json) [READ] | CL13 | L120d | per rung: what ability it claims changed, and what observation could establish it (F and G) | curriculum/stage-*.json, rungState.ts | A1 |
| L89 | strands are ordered by least lately played (session.ts:617-619); the composition has no purposes to compose from | MERGE → L22 | CL12 | - | - | session.ts | A1 |
| L90 | 99 prerequisites, every one a rung id (curriculum.json); strandsOf honours them (session.ts:659) | RE-CHECK (L120d owns stage-*.json, session.ts) [DECISION] | CL13 | L120d | which rung prerequisites become skill or demand readiness, and which stay because the experience itself is… | curriculum/stage-*.json, session.ts | A1 |
| L91 | the one practice unit is practice.1.1 in Stage 1 (practice.1-5, curriculum.json); nothing revisits practice strategy later | DECISION | CL12 | - | how practice strategies return after Stage 1: an intervention when the learner's problem makes one relevant… | stage-1.json, session.ts | A1 |
| L92 | nothing in session.ts serves a learner past the authored ladder; nextRecommended then walks back to held rungs (session.ts:361) | DECISION | CL14 | - | what the teacher composes once the ladder is exhausted: project and repertoire driven with ongoing… | session.ts | A1 |
| L93 | nextRecommended still falls back to rungs behind the placement or set aside (session.ts:326-327, :361); PlanScreen.ts:317, :834 and TodayScreen.ts:1174 show… | RE-CHECK (L120d owns session.ts; U63 owns TodayScreen.ts) [BUILD NOW] | SG04 | L120d; U63 | the lanes landed; the header and Plan read the strands, the set-aside return retired | session.ts, PlanScreen.ts, TodayScreen.ts | A1 |
| L94 | held: projectStore.ts keeps the lifecycle apart from skills and ProgressRow.status (G1b, responses/536d9bc2.md) | CLOSE | - | - | - | projectStore.ts | A1 |
| L95 | no rung option exceeds its levelBand now (0 of 1,017, curriculum.json), but bands are wide (practice.5 [1.1, 4.1]); the untaught gate is the real measure | MERGE → L120 | LN-L120 | - | - | stage-1.json | A1 |
| L96 | session.ts:1411-1414: the review slot's fallback phase fills from the fallback ladder, so a Review row can hold material with no retrieval purpose | RE-CHECK (L120d owns session.ts) [BUILD NOW] | CL12 | L120d | L120c/L120d landed | session.ts, session.test.ts | A1 |
| L97 | G1 (entry-112) the encounters and contacts stores, G1a (entry-119) firstContact; approved (responses/b48342f.md, 5b14b7a.md) | CLOSE | - | - | - | encounterStore.ts | A1 |
| L99 | x-check: E50a edits progressStore.ts. holdsEvidence keeps every row with a lessonId (progressStore.ts:936-942); MAX_SESSIONS 25,000 (:811) is soft for curriculum-directed rows | DECISION | CL23 | E50a (progressStore.ts) | a bounded retention that keeps rung and evidence semantics exactly (a per-run semantic witness?) | progressStore.ts, rungState.ts | A1 |
| L102 | skillActivation.ts:41 activates sight-reading rows only; skills.json has no pulse-and-note-values skill | RE-CHECK (L120d owns skills.json) [DECISION] | CL11 | L120d | when do generated families' skills activate for evidence, now that the ladder reads role and family (D4)? | skillActivation.ts, skills.json | A1 |
| L105 | the gate judges coping from each skill's ladder state (eligibilityCore.ts); no read of the last run's misses; no entry or response cites L105 (grep) | RE-CHECK (L120d owns eligibilityCore.ts) [DECISION] | CL11 | L120d | does the coping gate also read recent misses of the demand, or leave that to the ladder? | eligibilityCore.ts | A1 |
| L106 | answered: no same-lesson exemption; judged at the placed rung once E0a made "taught at that rung" path-correct (responses/f3b75b7.md) | CLOSE | - | - | - | selectors.ts | A1 |
| L112 | F2's eighty proposals each need a teaching-use decision (responses/b41e19e.md); practice.5 still lists the level-4.1 contrary scale (curriculum.json) | RE-CHECK (L120d owns stage-*.json) [READ] | CL13 | L120d | a teaching-use read of each of the eighty proposals and the practice rungs' lists | curriculum/stage-*.json, rung_audit.py | A1 |
| L113 | X1 (entry-134): a rung's own listing asks the one gate (session.ts:777, :904); the split ruled (responses/aed824a1.md); the 387 went to L120 | CLOSE | - | - | - | session.ts | A1 |
| L114 | selectors.ts:184 tieredAlternatives matches the broad demand; no accidental-context fact exists (grep 'accidental' in selectors.ts: none) | DECISION | CL10 | - | which fact tells the minor's raised seventh from chromatic or blues accidentals: a new demand or a… | selectors.ts, detect.ts | A1 |
| L117 | F2c (entry-130) unmapped the advanced leaps and left the two rungs' claim unmeasured; accepted (responses/267cac32.md) | CLOSE | - | - | - | concepts.json | A1 |
| L118 | the reviewer: '0 to practise' is truthful; an honest fourth-or-fifth exercise is separate work (responses/ddba53e9.md); interval reading is C position only (generate_exercises.py:2015) | RE-CHECK (L120d owns stage-2.json) [BUILD NOW] | CL15 | G7; L120d | L120c/L120d landed | generate_exercises.py, stage-2.json | A1 |
| L120 | L120a and L120b accepted (responses/c8680b70.md): refusals 389 -> 379; L120c (sixteenths) and L120d (leap) in flight; class 4 placement last | RE-CHECK (L120d) [BUILD NOW] | LN-L120 | L120d; class 4 placement last | the table re-run after L120d; then class 4 placement | untaught_options.py, curriculum/stage-*.json | A1 |
| L121 | rock.5 lists exercise.open-voicing.c.add9 with provenance.physical (a ninth span); X1 applies no physical refusal to a rung's own options (responses/aed824a1.md) | RE-CHECK (L120d owns stage-*.json) [DECISION] | CL02 | L120d | does a ninth-span voicing stay on rock.5 with its physical note, or move or be replaced? | curriculum/stage-*.json, family_contracts.json | A1 |
| L123 | x-check: L120c merged at afdac758 (core 4.4 teaches sixteenths); review pending. no concept maps to rhythm.sixteenths yet; L120c's brief approved (responses/questions-bbd7f99a.md) and in flight | RE-CHECK (L120c merged afdac758, review pending) [CLOSE] | LN-L120 | L120c review | L120c's review | concepts.json, stage-4.json, claims.py | A1 |
| L124 | the probe pins a snapshot; the reviewer requires a re-run after each class (responses/0bcd3be0.md); L120c and L120d re-pin it | RE-CHECK (L120d owns test_untaught_options.py) [MERGE → L120] | LN-L120 | L120d | whether the pin rule is kept by the lanes' closing runs | test_untaught_options.py, untaught_options.py | A1 |
| L125 | L120b built the skip-inside-a-position route (eligibilityCore.inTaughtPosition); the leap case is L120d, approved (responses/questions-f7acb2c0.md), in flight | RE-CHECK (L120d) [BUILD NOW] | LN-L120 | L120d | L120d's landing; the five-pair expectation re-run on its base | eligibilityCore.ts, demands.json | A1 |
| M1 | Nothing has been heard; path-forward-2026-09-30.md §8 puts a sampled musical-quality signoff inside H2 | DEFER TO H | CL25 | - | - | decisions.jsonl | A2 |
| M2 | decisions.jsonl holds 4 usableScore events on a notation basis and no goodTeachingUse; D2's microscope records reads per item | READ | CL13 | - | usableScore and goodTeachingUse reads by second readers, per item: each family, level and excerpt | decisions.jsonl, DevMicroscopeScreen.ts | A2 |
| M3 | C3's Not judged lines state what was not measured (help.ts:322, :378); the diagnostic grammar is L19's | MERGE → L19 | CL09 | - | - | help.ts | A2 |
| M4 | Families that promise music pass a musical gate separate from validity (D3's musical_evaluator.py; D1's sightReadingScore.ts); G9 closed (responses/ee70b43.md) | CLOSE | - | - | - | musical_evaluator.py | A2 |
| M5 | Slots choose from the learner's evidence (C6, Entry 80), the reader moves with the reads (C4c, Entry 77), and the stage windows are gone | CLOSE | - | - | - | session.ts | A2 |
| M6 | D2's review record replaces one flag: dimension usableScore/goodTeachingUse × basis inspected/notation/heard × category (content/review/README.md:30-33) | CLOSE | - | - | - | README.md | A2 |
| M9 | 15 tracks remain (00-tracks.json); G1b/G1c made only Stage 9 a project stage (Entries 138, 139); no brief turns the style tracks into projects | DECISION | CL14 | L120d (stage files) for the build | Which rungs stay Foundation, and how do the style tracks become learner-chosen projects? | 00-tracks.json, tracks.ts, PlanScreen.ts | A2 |
| M10 | The musicality strand is the arc's notice/shape/compare steps (T17; C0a's fields); not built | MERGE → T17 | CL19 | - | - | lessons/*.md | A2 |
| M12 | A decided rule ("held by rule"); its only buildable consequence is M9's shape | MERGE → M9 | CL14 | - | - | 00-tracks.json | A2 |
| Q2 | x-check: not an open P0. N1/N2 fixed (T41); window-rule spec measures five lines and drawn vs engraved width… | RE-CHECK (U32 for the window half) [BUILD NOW; answer-key half now] | CL06 | U32 (window half only) | After U32: window checks read natural spacing from an independent engraving; answer keys come from the… | wide.spec.ts, drills-harmony.spec.ts, score.window-rule.spec.ts | B |
| Q3 | C0b §6 (test-inventory-2026-09-26.md:668) lists the obsolete tests by wave. The classification has not been re-run since; finding what remains is Q13's pass | MERGE → Q13 | CL24 | - | - | test-inventory-2026-09-26.md | B |
| Q7 | Covered by tests: sightReadingPromises.test.ts (S1); composedContract.test.ts and test_family_contracts.py (families over seeds, D0); test_musical_evaluator.py and test_study*.py (studies, D5) | CLOSE | - | - | - | sightReadingPromises.test.ts, test_family_contracts.py | B |
| Q9 | x-check: the same decision as T11 (teaching-plan schema). There is no teaching-plan schema (grep across the curriculum schema, app/src and tools/content). F2's claim check (validate.py:2069) ties a… | MERGE → T11 | CL19 | - | - | curriculum.schema.json, validate.py, lessonClaimsAboutMusic.test.ts | B |
| Q10 | Plan units and sweeps exist (windowRendererStage.test.ts, slots.test.ts, score.rotate.spec.ts, sweeps.spec.ts). What is missing is drawn-outcome checks on the sheet cells, which is Q22 | MERGE → Q22 | CL06 | - | - | probe.ts, windowRendererStage.test.ts | B |
| Q11 | G1b's lifecycle tests exist (projectLifecycle.test.ts). Exposure balance has no definition to test against until R46 has one | MERGE → R46 | CL20 | - | - | projectLifecycle.test.ts | B |
| Q12 | The diff-growth hook exists (.claude/hooks/diff-growth.js), and citing the class per deleted file is a standing rule. The large test replacement happens in Q13's pass | MERGE → Q13 | CL24 | - | - | diff-growth.js | B |
| Q13 | The AT-15 classification has not been re-run since 2026-09-26 (that inventory is the baseline). plan-2026-09-25.md:178 schedules it for H | DEFER TO H | CL24 | the implementation waves | - | test-inventory-2026-09-26.md, 08-test-map.md, checks.json | B |
| Q21 | Still present at the lines: audio.spec.ts:48 accepts running or suspended (verified); carry-overs line 97, shelf 303, drills "Again" 299 and modes-rhythm-only 77 are reader-reported | BUILD NOW | CL06 | - | - | audio.spec.ts, carry-overs.spec.ts, shelf.spec.ts | B |
| Q22 | x-check: B listed it BUILD NOW with U32 as dependency; the probe judges U32's grid. score.states.spec.ts:68,423 still settle on a fixed 2.5 s. probe.ts:141-155 measures `.staffline` boxes. There is… | RE-CHECK (U32: the probe judges U32's grid) [BUILD NOW] | CL06 | U32 | U32 landed; the probe re-read on U32's grid | score.states.spec.ts, probe.ts, gallery.ts | B |
| Q23 | score.rotate.spec.ts:58 hard-codes MIN_STAFF_PX as 40 and t30-sheet.mjs:127 tests against 40, while WindowRenderer.ts:117 exports 22 | BUILD NOW | CL06 | - | - | score.rotate.spec.ts, t30-sheet.mjs | B |
| Q24 | The content build runs before the content tests; the converter harness and parity reference run in CI; skips are classified (Entry 89). Approved in e32d0ef.md | CLOSE | CL24 | - | - | ci.yml, test_ci_order.py | B |
| Q29 | x-check: U105 owns score.screen.spec.ts. No store publishes a pending-write count (grep in app/src). score.screen.spec.ts:561 waits 1 s, and lab.spec.ts:431,496 wait 1.5 s, to bound a write that… | RE-CHECK (U105 owns score.screen.spec.ts) [BUILD NOW] | CL24 | U105 | U105 landed | persist.ts, score.screen.spec.ts, lab.spec.ts | B |
| Q30 | score.layout.spec.ts:153,252,300,374 still pad with 300-500 ms. `waitForPieceMeasured` waits on `data-measured`, not `data-settled` (fixtures/devScore.ts:207-209) | RE-CHECK (U32 owns window-rule and arrange-race specs) [BUILD NOW] | CL24 | U32 | After U32: the settled mark it publishes | score.layout.spec.ts, devScore.ts, score.arrange-race.spec.ts | B |
| Q31 | simonTurnCue still fails only in loaded full unit runs and passes alone (entry-148.md:122, entry-162.md:203). It belongs to the load family Q48 collects | MERGE → Q48 | CL24 | - | - | simonTurnCue.test.ts | B |
| Q34 | The density 900 px case now waits on the fit's settled mark and passes at 32x throttle (H0, Entry 87). Approved in a008ba5.md | CLOSE | CL24 | - | - | score.density.spec.ts | B |
| Q35 | reader.ts:128 misreads whole steps (`wrongInstead`), though observed.ts:38-42 offers a per-pitch `wrongPitch`. The redraw budget's cost on the phone is unmeasured | DEFER TO H | CL24 | - | - | reader.ts, observed.ts | B |
| Q36 | The harmonic-dictation counter flake happened once and passed on retry. It is the key-during-playback load shape that Q48 collects | MERGE → Q48 | CL24 | - | - | drills-harmony.spec.ts | B |
| Q37 | The triplet-rest cases have local 60 s budgets and composedContract has 180 s (composedContract.test.ts:509,527) (H0, Entry 87). Approved in a008ba5.md | CLOSE | CL24 | - | - | sightReadingPromises.test.ts | B |
| Q39 | The late-run statistic runs on Playwright's clock, with a FakeClock unit twin (H0, Entry 87). Approved in a008ba5.md | CLOSE | CL24 | - | - | engine.spec.ts | B |
| Q40 | No trajectory suite exists under app/tests (grep "trajector"). The constructed learners are in helpers/reader.ts. The ten histories are H's run over the finished product | DEFER TO H | CL25 | - | - | reader.ts | B |
| Q42 | x-check: the remaining cases are X19 (its acceptance tests). Part 18's fifteen session-runner cases are written and pass, except the X19 detour (entry-134.md:115-131). The teaching-loop 25 wait on… | MERGE → X19 | CL12 | - | - | sessionRunner.ts, session.ts, session-run.spec.ts | B |
| Q43 | The 24 musicianship cases are still prose. No entry cites Q43, and no suite holds the cases | DECISION | CL21 | - | Which Part 17 experiences get built before H, with each seam carrying its cases red-first? | simon.ts, modes-simon.spec.ts, drills-harmony.spec.ts | B |
| Q44 | Every `openMidiScreen` case waits for the mounted screen, and the Duet row waits on the list's drawn state (H0, Entry 87). Approved in a008ba5.md | CLOSE | CL24 | - | - | midi.spec.ts, doors.spec.ts | B |
| Q47 | A cached MAESTRO step is pinned per member by SHA256. The class fails under CI when its input is absent (Q47, Entry 113). Approved in 8668afb.md | CLOSE | - | - | - | ci.yml, fetch_maestro.py | B |
| Q48 | 5 s-under-load failures recur in loaded full unit runs (entry-154.md:103, entry-159.md:169, entry-162.md:203). Some named files already have local budgets | BUILD NOW | CL24 | - | - | expectedNote.test.ts, pitchDetector.test.ts, midi.spec.ts | B |
| Q49 | `openDevScore` waits for its heading on Playwright's 5 s default (fixtures/devScore.ts:214) before its 60 s waits | BUILD NOW | CL24 | - | - | devScore.ts | B |
| Q56 | The rung page's picks go through the teaching-use predicate (D3c, Entry 104). Accepted in e85c162.md | CLOSE | CL13 | - | - | LessonScreen.ts | B |
| Q57 | latin.3's and latin.6's exercise asks stay unmet (F2, Entry 108), and inventory.md reports 0 teaching-use reviews. The track stays stalled until one exercise gets a yes | READ | CL02 | - | A person hears the clave, tresillo, tumbao and montuno exercises and records a teaching-use decision on each | decisions.jsonl, stage-3.json, stage-6.json | B |
| Q59 | An excerpt needs a current affirmative teaching-use decision before any automatic offer (E1a, Entry 105). Accepted in 4f7227d.md | CLOSE | CL13 | - | - | selectors.ts | B |
| Q61 | Ruled a runtime teaching tool (e85c162.md). Its defect, G62, was built in X1 (Entry 134) and accepted in aed824a1.md | CLOSE | - | - | - | LessonScreen.ts | B |
| Q64 | `tools/docs/evidence_manifest.py` writes runs/<seam>/MANIFEST.md (Q-tooling, Entry 116). Accepted in 198c148.md | CLOSE | CL24 | - | - | evidence_manifest.py | B |
| Q65 | checks.json plus checks_for_paths.py give the minimum checks per path (Entries 116, 120, 124). Approved in 3c661d4.md and b690be15.md | CLOSE | CL24 | - | - | checks.json, checks_for_paths.py | B |
| Q69 | x-check: T58 owns checks.json's rows and runs test_checks_for_paths.py. The map's named specs are checked (`missing_names`, checks_for_paths.py:190; test_checks_for_paths.py:132). Spec names a… | RE-CHECK (T58 changes checks.json rows its test reads) [BUILD NOW] | CL24 | T58 | T58 landed; map changes to the reviewer before the push | checks_for_paths.py, test_checks_for_paths.py | B |
| Q73 | x-check: T58 owns checks.json's rows (its brief, :72). The spec row names tsc, lint, build-app and the spec itself (checks.json:105), but not the map's own test, so a newly added spec that reads the… | RE-CHECK (T58 owns checks.json's rows) [BUILD NOW] | CL24 | T58 | T58 landed; map changes to the reviewer before the push | checks.json, test_checks_for_paths.py | B |
| Q75 | The claim rule judges only what a build measured and warns where it could not judge (Q75, Entry 131). Accepted in 56a4b9b7.md | CLOSE | CL22 | - | - | validate.py | B |
| Q76 | Pine Apple Rag (Mutopia MIDI) is on ragtime.8 (stage-8.json:136) and Cielito Lindo (simple) on 2.4 (stage-2.json:325) (Q76, Entry 136). Accepted in e4f9d3f2.md | CLOSE | CL18 | - | - | mutopia.json, stage-8.json | B |
| Q78 | x-check: owner decided (questions-bd7d303e.md §8): both rags if each passes the gates; stage-8.json is L120d. ragtime.8 has one public rag, Pine Apple Rag via… | RE-CHECK (L120d owns stage-8.json) [BUILD NOW: owner decided] | CL18 | L120d | L120d landed; each rag through the existing gates (spelling, level, demands, licence); a refused one closed… | mutopia.json, stage-8.json | B |
| Q79 | The premise is refuted at the files: the authored 2.4 ABC sources write no dynamics (only fingerings !1!-!5!), and song.folk.greensleeves (MuseTrainer) on 2.4 prints 6 `<dynamics>` | REJECT | CL18 | - | - | cielito-lindo-simple.abc, abc_tools.py | B |
| Q80 | The ladder check tells a build's own fetch placeholders apart and warns them by name (Q80, Entry 141). Accepted in 2d9e7e2c.md | CLOSE | CL22 | - | - | validate.py | B |
| Q82 | The kern and MuseTrainer steps write a *was not fetched* placeholder for a missing file (import_kern.py:98, import_musetrainer.py:64) (Entry 145). Accepted in 7cdc0f72.md | CLOSE | CL22 | - | - | import_kern.py, import_musetrainer.py | B |
| Q86 | Ruled: guard the deploy (2d9e7e2c.md). Built as Q88 (Entry 151) | CLOSE | CL22 | - | - | pages.yml | B |
| Q88 | `deploy_guard.py` runs after the build and before the Pages upload (pages.yml:86-97). Approved in d249d64f.md. It closes fully on the push plus one healthy runner read, and local is 5 commits ahead | CLOSE | - | the healthy Pages run read-back | - | deploy_guard.py, pages.yml | B |
| Q91 | A missing chopin-first-editions clone still drops those rows and fails validation. The reviewer ruled this a genuine failure (7cdc0f72.md:14), and Q88 keeps the last good deploy live | REJECT | - | - | - | import_kern.py | B |
| Q92 | LibraryScreen.ts:789 and ScoreScreen.ts:4773 print `importHint` raw. For an unfetched kern or MuseTrainer row that hint names a… | RE-CHECK (G96 owns LibraryScreen.ts; U105 owns ScoreScreen.ts, help.ts) [BUILD NOW] | CL22 | G96; U105 | After G96: turn the fetch reason into learner copy in one place, leaving the data contract untouched… | LibraryScreen.ts, ScoreScreen.ts, help.ts | B |
| R1 | `level`, `levelSource`, `levelBand` and `abrsmGradeApprox` are all still carried (curriculum/types.ts:54,128,580,596), and `levelLabel` prints one scalar… | RE-CHECK (E50a owns types.ts; G96 owns widgets.ts) [DECISION] | CL17 | E50a; G96 | Which one level survives and how it is derived; which of the other numbers are deleted, renamed or kept only… | types.ts, widgets.ts, validate.py | B |
| R2 | The built catalogue now carries measured `demands` and `measurement` per item (types.ts:102-104). 2,013 of 2,092 items are measured (docs/prompts/inventory.md). Built by E0 (Entry 92) | CLOSE | CL17 | - | - | build.py, types.ts | B |
| R3 | The level model's 19 features count ornaments but not tuplets or grace notes (difficulty.py:43-63). The demand vocabulary has `rhythm.triplets` but no grace or… | RE-CHECK (L120d owns vocabulary/*.json) [DECISION] | CL10 | L120d | Should grace and ornament demands go into the vocabulary (the gate), or should the level model be extended… | demands.json, detect.ts, difficulty.py | B |
| R4 | Nothing in app/src reads `abrsmGradeApprox`; only the type declares it (types.ts:128,596). FolderScreen prints `level N est.` (FolderScreen.ts:658). This is one of R1's seven numbers | MERGE → R1 | CL17 | - | - | types.ts, FolderScreen.ts, quarry.py | B |
| R6 | The catalogue holds measured demands plus the two-bit review record. inventory.md reports 0 items with a teaching-use review. No per-piece model says what a piece teaches, or its style, texture or… | READ | CL18 | - | AT-6, a musical read of each rung-placed PDMX piece: what it teaches, contains and avoids, its style and… | inventory.md, decisions.jsonl, build.py | B |
| R8 | The validator still fits bands: `level_band_errors`, `CORE_SONG_REACH` and `CORE_REACH_PLAN` (validate.py:521-560). The needs-versus-taught gate is L120's lane (eligibilityCore.ts… | RE-CHECK (L120d) [BUILD NOW] | CL10 | L120d | After L120c/d land: which band and reach rules the gate makes redundant, retired with their tests | validate.py, eligibilityCore.ts, stage-3.json | B |
| R9 | Anh. 113 (PDMX, level 5.23 estimated) is still in classical.3's songOptions (stage-3.json:558), and one of its excerpts is in excerpts.json:28. A direction is recorded, with no placement ruling… | READ | CL18 | - | A musical read of Anh. 113 against classical.3's teaching: keep it, move it, or teach it through its excerpt | stage-3.json, excerpts.json, decisions.jsonl | B |
| R10 | `requires` passes when any one option satisfies it (validate.py:1224-1226). Nobody has read whether the other options and the finder's words contradict what the rung stocks (AT-13 not run) | READ | CL13 | - | AT-13, per rung: do the options that do not establish the claim, and the finder prompt, fit what the rung… | validate.py, finder.py, stage-4.json | B |
| R12 | The tablet side panel prints the rung's lesson prose whatever piece is open (tablet.ts:57-64, ScoreScreen.ts:807-830). classical.3.md is about the Petzold (lines 19-45) | DECISION | CL18 | R9 | Per-piece notes for each rung piece, or rung prose written so it fits any of the rung's pieces? | tablet.ts, classical.3.md, ScoreScreen.ts | B |
| R13 | In the built catalogue, 0 of 546 PDMX items carry `teaching.sections`, and 22 of 2,092 items overall. Sections are authored in content/sources/sections.json | READ | CL18 | R9; R10 | For each rung-placed PDMX piece, the bar ranges where its phrases fall, for sections.json (a musical read) | sections.json, validate.py | B |
| R14 | Only ShelfScreen reads `levelBand` (ShelfScreen.ts:139). The lesson page prints no band, yet validate.py:514-519 says it does, and the band check still errors (validate.py:521-535) | MERGE → R1 | CL17 | - | - | validate.py, ShelfScreen.ts | B |
| R16 | Each list prints one scalar through `levelLabel` (LessonScreen.ts:282, LibraryScreen.ts:738, SkillsScreen.ts:343). No demand dimension is shown to the learner | RE-CHECK (G96 owns widgets.ts, LibraryScreen.ts) [DECISION] | CL17 | G96; R1 | Which demand dimensions replace the scalar on rows and in details, and in what words? | widgets.ts, LibraryScreen.ts, LessonScreen.ts | B |
| R19 | Eight learner-set project states with explicit offers (projectStore.ts:45-78). Every automatic slot skips paused and retired pieces (session.ts:184-197). Built by G1b, G1d and G1e | CLOSE | CL14 | - | - | projectStore.ts, session.ts | B |
| R20 | No layered arrangement ladder exists in the curriculum or the catalogue. hymns.6 is one arrangement rung (docs/02-curriculum.md:92), not a ladder. This is a hypothesis row and was never audited | DECISION | CL20 | - | Build the layered ladder for one tune as a trial, and which tune? (a pedagogy choice) | stage-5.json, generate_exercises.py | B |
| R21 | Mutopia and kern importers exist (import_mutopia.py, import_kern.py, content/sources/mutopia.json). There is no quarry of method books or graded studies | READ | CL18 | - | Which graded studies (Reinagle, Czerny, Burgmüller, early methods) exist in usable public-domain notation… | import_mutopia.py, mutopia.json | B |
| R22 | There is no exposure model. Genre is only a tag (types.ts:123), and nothing in the session balances across musical languages | DECISION | CL20 | R46 | Does the teacher balance exposure over R46's dimensions, and which of them can be measured from notation? | session.ts, detect.ts | B |
| R23 | The validator still requires 3 song options wherever a rung asks for a song run (validate.py:57, 664-668). docs/02-curriculum.md:74 says three to six songs. Part 12 decided on at least one strong… | BUILD NOW | CL10 | - | - | validate.py, test_validate.py, 02-curriculum.md | B |
| R24 | Every session slot carries a `reason` string (session.ts:67). No "Recommended for you" label appears under app/src/ui (grep) | CLOSE | CL12 | - | - | session.ts | B |
| R25 | No AT-13 repertoire-assignment read is on record, and inventory.md reports 0 teaching-use reviews | READ | CL13 | - | AT-13, per rung: does each option's music reinforce the concept, and where should the music just be music? | stage-4.json, decisions.jsonl | B |
| R26 | latin.4, latin.8 and ragtime.4 are still missing from content/curriculum (present: latin.3/6/7 and ragtime.5-9). docs/02-curriculum.md:99-110 records them as unbuilt for want of songs | READ | CL18 | R21 | Public-domain notation for a habanera or tresillo piece, a modern tango and a cakewalk, and a home for the… | mutopia.json, stage-4.json, 02-curriculum.md | B |
| R27 | The MusicXML path has a note-loss gate (convert.py:269-273) but no ConversionReport. That report type exists for MIDI only (import/midi/convert.ts:129).… | RE-CHECK (E50a, then E50, own convert.py) [BUILD NOW] | CL03 | E50a; E50 | After E50a: the AT-5 fixture list, and what the report records (source, normalised, lost, changed) | convert.py, test_convert.py, extractScoreModel.ts | B |
| R28 | There is no `PieceAnalysis`. Difficulty (difficulty.py and its port), demands (detect.ts) and the renderer's measures are separate readers, only partly tied together by one fingerprint… | DECISION | CL17 | R1 | Is E0's measurement plus demands under one fingerprint the canonical analysis, or must difficulty and… | measuringFingerprint.ts, difficulty.py, detect.ts | B |
| R29 | No UI module parses MusicXML: DOMParser appears only in importStore.ts, score/mxl.ts and score/trimMusicXml.ts. The model's losses (clef, per-bar key, graces) belong to R27 and R32 | MERGE → R27 | CL03 | - | - | extractScoreModel.ts, types.ts | B |
| R31 | Orphan exercises still fail the build (validate.py:2072-2076). The PDMX index proxy prints 4.5 when no model is fitted (tools/content/pdmx/index.py:208-210) | DECISION | CL10 | - | Is an exercise reachable only from the Library valid (a warning) or an error? Should an unfitted index print… | validate.py, index.py | B |
| R32 | ScoreModelData carries one `keySig` and no clef (score/types.ts:167-186). detect.ts:21-25 reads staff 1 as treble and uses the first key only. The build marks the clef-suspect scores… | RE-CHECK (L120d re-pins the untaught table) [BUILD NOW] | CL10 | L120d | After L120c/d land: re-pin the untaught table under clef- and key-aware readings | types.ts, extractScoreModel.ts, detect.ts | B |
| R33 | Import truth is built (E0, E2). The import sheet says what was read and what was guessed, and whose each guess is; it swaps hands and states the tempo (importSheet.ts:6-12, X3 Entry 118) | CLOSE | - | - | - | importSheet.ts, importStore.ts | B |
| R34 | `correctImportHands` makes the learner's corrected split the source truth for demands and eligibility (importStore.ts:807). X3's sheet saves through it (Entry 118) | CLOSE | - | - | - | importStore.ts, importSheet.ts | B |
| R36 | `walkingBass` takes a bar of quarters equal to the bar length and has no compound-metre test (detect.ts:533-546), so three quarters in 6/8 still count as a walk | RE-CHECK (L120d re-pins the untaught table) [BUILD NOW] | CL10 | L120d | Same re-pin as R32 | detect.ts, demandsOfFiles.test.ts | B |
| R37 | `tune(bar)` in leftHandPattern and walkingBass needs a staff-1 note that starts in the bar (detect.ts:518,545), so a tie held into the bar reads as "no tune" | RE-CHECK (L120d re-pins the untaught table) [BUILD NOW] | CL10 | L120d | Same re-pin as R32 | detect.ts, demandsOfFiles.test.ts | B |
| R41 | Placements are bare id lists (stage-*.json songOptions and exerciseOptions). Nothing records why one item's encounter on each of its several rungs differs | READ | CL13 | - | For each item placed on several rungs: what differs at each placement (preview, reading, coordination… | stage-2.json, validate.py | B |
| R42 | Each review event now records its two dimensions in content/review/decisions.jsonl, resolved in time order. Boundary decisions live in excerpts.json (E1). Approved in responses/7e148e0.md | CLOSE | CL13 | - | - | decisions.jsonl, review.py | B |
| R43 | There is no simulation of coverage over time and no inventory of cliffs by level, texture and style. inventory.md counts works and demands, not trajectories | DEFER TO H | CL25 | R6; Q40 | - | inventory.md, reader.ts | B |
| R45 | Slots carry a free-text `reason` (session.ts:67) and a D4 `role` (canonical, variable or transfer). No row names its assignment kind (application, development, exploration or project) | RE-CHECK (U63 owns Today; L120d owns session.ts) [BUILD NOW] | CL12 | U63; L120d; L22 | After U63: how the kind fits within the two-line reason | session.ts, TodayScreen.ts, help.ts | B |
| R46 | Breadth is measured only by `genre` tags (types.ts:123). Texture, metre, feel and harmonic language are not tracked as exposure, and nothing balances them | DECISION | CL20 | - | Which exposure dimensions does the teacher balance? Which can be measured from notation (metre, texture) and… | detect.ts, session.ts, demands.json | B |
| R47 | *Bring it back* moves a project to `refreshing` and keeps its history (projectStore.ts:55,75). The session treats `refreshing` like… | RE-CHECK (G96 owns projectStore.ts; L120d owns session.ts) [DECISION] | CL14 | G96; L120d | What does re-entry run for a refreshing piece (a section check before full play), and what evidence does it… | projectStore.ts, session.ts, projectSheet.ts | B |
| S6 | C4b gave each reading demand its own on/off control (readingControls.ts:1-30; sightReading.ts:1336) and C4c's reader moves one at a time; LEVELS (sightReading.ts:352) still bundles, residue in S27 | CLOSE | CL08 | - | - | readingControls.ts, sightReading.ts | A2 |
| S9 | D4, G2 and E1 built the ladder, but eligibilityCore.ts:233-252 refuses music-promising studies and excerpts that lack a teaching yes; decisions.jsonl has 4 usableScore events, 0 goodTeachingUse | READ | CL13 | - | goodTeachingUse decisions, per item, on the 5 cut excerpts (content/sources/excerpts.json) and the… | decisions.jsonl, excerpts.json, DevMicroscopeScreen.ts | A2 |
| S10 | x-check: U105 (dispatched after the triage tree) owns ScoreScreen.ts. *New phrase* exists (ScoreScreen.ts:264). A read is still headed by the rung's tempo floor (ScoreScreen.ts:3471, :3818), but its… | RE-CHECK (U105 owns ScoreScreen.ts) [BUILD NOW] | CL09 | U105 | U105 landed | ScoreScreen.ts, evidence.ts, sightReading.ts | A2 |
| S11 | Checked since C5: 1.5 requires 5 full-standard reads at 0.9 (stage-1.json, 1.5 requirements; Entry 79); 1.5.md:35-39 still describes "the sight-reading generator" (T1) | MERGE → T1 | CL19 | - | - | 1.5.md | A2 |
| S14 | Built: C4a's per-demand evidence and C4c's "skips went wrong in N phrases" line (help.ts:587-630). Hesitation at a leap and the what-it-means/what-next grammar are L19's | MERGE → L19 | CL09 | - | - | help.ts, demandReadings.ts | A2 |
| S15 | Version 2's hard layer refuses any interval past the cap, a tie's closing note included (sightReadingScore.ts:763-771); v2 in force (sightReading.ts:178); S26 closed (responses/8a13eb1.md) | CLOSE | CL16 | - | - | sightReadingScore.ts | A2 |
| S18 | S7's scorer is live at v2 and closed (responses/8a13eb1.md); the walk still draws leaps uniformly (sightReading.ts:872), which is S34; the unheard 6/8 and Alberti are M1's | MERGE → S34 | CL16 | - | - | sightReading.ts | A2 |
| S19 | A phrase heard or met before is recorded `unseen: false` and kept out of requirements (rungState.ts:196; ScoreScreen.ts:3751-3775); a demonstrated take drops `performance` (ScoreScreen.ts:3642) | CLOSE | - | - | - | rungState.ts, ScoreScreen.ts | A2 |
| S22 | C4b's `ledger` control writes a ledger note on 3.4's row when asked (readingControls.ts:216); the row still does not declare ledger lines, which is S31 | MERGE → S31 | CL08 | - | - | catalog.static.json, stage-3.json | A2 |
| S23 | Row 7 asks `sixteenths: false` (catalog.static.json, drill.reading.sight-reading-7), so no reading row writes untaught sixteenths; who teaches them is L120c's (4.4) | CLOSE | - | - | - | catalog.static.json | A2 |
| S24 | The run sheet says "it counts only with the keys guide off" (help.ts:322, :378), but proficientAt reads full-standard reads only (session.ts:2369-2385) and Today's line stays "Another like it"… | RE-CHECK (L120d owns session.ts; U105 owns help.ts) [BUILD NOW] | CL08 | L120d; U105 | readingOffer's hold branch in session.ts after the lanes land | session.ts, help.ts | A2 |
| S27 | x-check: L120c added rhythm.sixteenths on to LEVEL_3_RUNGS (readingControls.ts:505-507). Under v2, skips-off is made at 4.5–4.7, but leaps-off and eighths-off are still… | DECISION | CL08 | L120d if a row is added | One reading row per metre at 4.5–4.7, or compound figures at levels 1–4 that survive eighths-off and… | readingControls.ts, sightReading.ts, catalog.static.json | A2 |
| S28 | The contract enumerates core units only (generatorContract.test.ts:65); the track rungs that list reading rows, and rows 4–7, are held only by the promises test | BUILD NOW | CL08 | L120d (taughtAt moves) | - | generatorContract.test.ts, readingControls.ts | A2 |
| S30 | Version 2's cap (sightReadingScore.ts:770) and arrival score now apply to 3.1's row; day 28's seed was not re-run here and is not a fixture | MERGE → S34 | CL16 | - | - | sightReadingDistribution.test.ts | A2 |
| S31 | 3.4 offers sight-reading-2, whose targetSkills are sight-reading, hands-together and subdivision (catalog.static.json); 3.4 asks only practice-standard… | RE-CHECK (L120d owns stage-*.json) [BUILD NOW] | CL08 | L120d | 3.4's entry after the lanes land; whether the shared 3.4–4.4 row can carry `ledger` and keep 3.5–4.4's… | catalog.static.json, stage-3.json, readingControls.ts | A2 |
| S32 | Triplets are refused at ±150 ms (skills.json:164, C3); 4.5 requires 6/8 and syncopation only, with no `unjudged` line naming triplets (stage-4.json, 4.5) | RE-CHECK (L120d owns stage-*.json) [BUILD NOW] | CL08 | L120d | 4.5's requirements after the lanes land | stage-4.json, skills.json | A2 |
| S34 | Unchanged: the walk draws each leap uniformly up to the cap (sightReading.ts:872); the reviewer kept S34 open (responses/b15758e.md item 6) | BUILD NOW | CL16 | - | - | sightReading.ts, sightReadingScore.ts, sightReadingDistribution.test.… | A2 |
| S35 | No rhythm palette at levels 2–7 holds a bar-long note (sightReading.ts:366-440); rests are a soft score weight; no duplicate bound; kept open (responses/b15758e.md item 6) | BUILD NOW | CL16 | S34 (one version bump) | - | sightReading.ts, sightReadingScore.ts, sightReadingDistribution.test.… | A2 |
| S38 | Phrase-seen compares seed and version, not notes (ScoreScreen.ts:4828; session.ts:2595); the reviewer: LATER WAVE, a content-identity comparison allowed… | RE-CHECK (L120d owns session.ts; E50a owns material.ts; U105 owns ScoreScreen.ts) [BUILD NOW] | CL08 | L120d; E50a; U105 | session.ts:2595 and material.ts after the lanes land | ScoreScreen.ts, session.ts, material.ts | A2 |
| T1 | 95 of 109 lessons still carry "Tools for this rung", and 1.5.md:35-39 still has the generator paragraph (grep over content/lessons) | DECISION | CL19 | T11 | Teaching-plan schema (C0a) before the rewrite, or a prose rewrite under a voice contract and the twelve… | lessons/*.md, helpStrip.ts | A2 |
| T3 | 1.5.md:26 and jam.6.md:23 keep "the whole trick"; outside the audit files, a grep of docs/ finds no writing contract | DECISION | CL19 | T11 | as T1 | lessons/*.md | A2 |
| T4 | F0, F1 and F3a fixed the named absolutes; others stand: improv.3.md:17 "Nothing you play can be wrong", ragtime.9.md:61 "those never come out"; lint_absolutes.py lists them | BUILD NOW | CL01 | - | - | lessons/*.md, lint_absolutes.py, lessonClaimsAboutMusic.test.ts | A2 |
| T5 | 1.5.md still teaches intervals, look-ahead, the generator, Simon, a song and Today on one page | DECISION | CL19 | T11 | as T1 | 1.5.md | A2 |
| T6 | All 109 lessons end with "How you'll know"; 103 carry "Common mistake" (grep over content/lessons) | DECISION | CL19 | T11 | as T1 | lessons/*.md, lessonShape.test.ts | A2 |
| T7 | Not measured; C0a's teaching plan has a `notice` field (design-2026-09-26-vocabulary.md:132-150) that nothing builds or reads | DECISION | CL19 | T11 | as T1 | lessons/*.md | A2 |
| T8 | lessonShape.test.ts:242-270 caps a lesson at 3 minutes (600 words), with two exceptions; T8's per-section targets are not enforced | DECISION | CL19 | T11 | as T1 | lessonShape.test.ts, lessons/*.md | A2 |
| T10 | No contract or check asks for the musical object; C0a's `whyItMatters` ("about the music, never about the app") exists only in the design | DECISION | CL19 | T11 | as T1 | lessons/*.md | A2 |
| T11 | C0a designed the teaching plan's fields (design-2026-09-26-vocabulary.md:132-150); a grep for `whyItMatters` over app/src, tools and content finds no reader | DECISION | CL19 | T11 | Adopt the C0a schema and generate the page, the cue and the after-miss line from it, or rewrite the prose… | types.ts, build.py, lessons/*.md | A2 |
| T12 | Separating the practice cue from the teaching text is the teaching plan's job (T11); not built | MERGE → T11 | CL19 | - | - | lessons/*.md, help.ts | A2 |
| T13 | x-check: U105 owns help.ts too. Outside the audits, a grep of docs/ finds no categorised inventory of user-visible strings; X1's pass (U57) reworded only Today's reader lines | RE-CHECK (U63, G96, U105 own the screens and help.ts) [BUILD NOW: audit now, fixes after] | CL22 | U63; G96; U105 | the Today and Library strings as the lanes leave them | help.ts, screens/*.ts, lessons/*.md | A2 |
| T14 | Titles and instructions tied to the moment are teaching-plan fields (T11); not built | MERGE → T11 | CL19 | - | - | lessons/*.md | A2 |
| T15 | The 3-minute cap bounds length; "only what is needed now" and a Learn page are T8's targets and T11's deeper-explanation field | MERGE → T8 | CL19 | - | - | lessons/*.md | A2 |
| T16 | Material order is held by claims.py's ancestry and L120's untaught table (Entries 93, 96, 149, 155; L120c/L120d in flight); no one has read the lesson text for… | RE-CHECK (L120d owns claims.py, stage-*.json) [READ] | CL01 | L120d | a per-lesson read of terms used before the rung that introduces them, against concepts.json, after L120d's… | lessons/*.md, concepts.json, claims.py | A2 |
| T17 | The arc is the teaching plan's shape (C0a design); the lessons are still prose plus a list | DECISION | CL19 | T11 | as T11 | lessons/*.md | A2 |
| T18 | x-check: the same finding as L120 (the untaught-options table). L120a counted 389 untaught rung-own options (Entry 149); L120b corrected them by class (Entry 155); L120c (sixteenths) and L120d (a… | MERGE → L120 | LN-L120 | - | - | untaught_options.py, curriculum/stage-*.json | A2 |
| T20 | Plan rows and the settled heading show titles only (PlanScreen.ts:258; LessonScreen.ts:1004); until the curriculum loads, the heading reads `Lesson ${lessonId}` (LessonScreen.ts:77) | BUILD NOW | SG10 | - | - | LessonScreen.ts | A2 |
| T21 | Not audited: no AT-8 record in docs/prompts (grep) reads the theory lessons and drills against label → sound → function → use | READ | CL20 | - | an AT-8 read of theory.3–9 and the harmony drills, one item at a time | lessons/theory.*.md, harmony.ts | A2 |
| T22 | earTuneDrill is still a random walk (harmony.ts:246-266; its comment says "every folk melody"); Simon unchanged (drills/simon.ts); no ear progression is built | DECISION | CL21 | - | What earTune becomes (memory said as memory, a tonal phrase grammar, or authentic phrases), and in what… | harmony.ts, simon.ts, lessons/theory.*.md | A2 |
| T23 | x-check: U105 owns help.ts. FreePlayScreen.ts shows no musicianship prompt (a grep for prompt and question-and-answer finds none); Part 17 §18 lists them | RE-CHECK (U105 owns help.ts) [BUILD NOW] | SG11 | U105 | U105 landed | FreePlayScreen.ts, help.ts | A2 |
| T25 | A tone search of content/lessons finds only "journey" (technique.5.md:28); UI strings were not searched; the learner's reading is H2's | MERGE → T13 | CL22 | - | - | technique.5.md, help.ts | A2 |
| T27 | Hands-together `on` at 2.1 is declared unrealisable on level 1's row (readingControls.ts:490-496); direction: add an honest both-hands row once 2.1's teaching is read… | RE-CHECK (L120d owns stage-2.json) [READ, then BUILD] | CL08 | L120d | a read of 2.1.md and its options for the hands-together reading it expects | stage-2.json, catalog.static.json, readingControls.ts | A2 |
| T34 | 0.1's causal ranking now reads as a teacher's heuristic, pinned in lessonClaimsAboutMusic › F3a | CLOSE | CL01 | - | - | 0.1.md | A2 |
| T36 | The practice rules now read as strategies, with every strategy kept (F3a), pinned | CLOSE | CL01 | - | - | lessons/practice.*.md | A2 |
| T37 | The interleaving superlative is removed (F3a), pinned | CLOSE | CL01 | - | - | practice.3.md | A2 |
| T42 | The blues universals and unsourced history are out of blues.4–8 (entry-157.md:44), each pinned absent | CLOSE | CL01 | - | - | lessons/blues.*.md | A2 |
| T43 | F0 removed "most 1920s bridges" (b8f713c6) and pinned it; F3a confirmed (entry-157.md:31); jazz.7's stride is T54's | CLOSE | CL01 | - | - | jazz.8.md | A2 |
| T44 | The Classical conventions now read as "one common starting point"; the reviewer kept that wording (responses/02a52fdb.md) | CLOSE | CL01 | - | - | lessons/classical.*.md | A2 |
| T45 | "The sound of most pop piano" is fixed; the style readings stay heuristics (responses/02a52fdb.md) | CLOSE | CL01 | - | - | lessons/chords-pop.*.md | A2 |
| T46 | Simon, and interval mnemonics as the endpoint, belong to T22's progression | MERGE → T22 | CL21 | - | - | simon.ts | A2 |
| T47 | improv.3.md:17 says "Nothing you play can be wrong", improv.4.md:15-17 makes a hedged version, improv.8.md:15 says "Every dominant chord can become…"; F3a left these for G (entry-157.md:33) | BUILD NOW | CL01 | - | - | improv.3.md, improv.4.md, improv.8.md | A2 |
| T48 | F0, F1 and F3a read named sentences only; no per-lesson twelve-gate record exists for the 109 lessons (F3a's scope, entry-157.md:50) | BUILD NOW | CL01 | - | - | lessons/*.md, lessonClaimsAboutMusic.test.ts | A2 |
| T50 | x-check: I16 is itself merged into L92. A grep for ceiling phrases over content/lessons finds only 4.6.md:12 ("Nearly the end of the core path"); G1c made Stage 9 projects (Entry 139); the… | MERGE → L92 | CL14 | - | - | 4.6.md | A2 |
| T52 | 1.5, ragtime.6 and ragtime.7 now match the app, pinned by F0_APP rows; the Maple Leaf tempo is X40's | CLOSE | CL01 | - | - | ragtime.6.md, ragtime.7.md | A2 |
| T53 | F1 did the 11 voice rows (Entry 88); F3a did disposition rows 1, 2, 8, 9, 12, 19, 28, 42, 43, 47 and 50 (F3a brief :3); the other musical-judgement and contested rows of f0-disposition-85.md stand | READ | CL01 | - | a source for each remaining contested row; a notation read for each musical-judgement row, marked… | f0-disposition-85.md, lessons/*.md, lessonClaimsAboutMusic.test.ts | A2 |
| T54 | F3a excluded it by name (F3a brief :42); the reviewer keeps these items in the outside-expert/listening bucket (responses/02a52fdb.md) | READ | CL01 | - | a sourced answer or a removal for each item (Lehtonen, octaves, 4.3's LH arpeggio, rotation, chord-scale… | lessons/technique.*.md, practice.4.md, jazz.7.md | A2 |
| T55 | The ear-tune tip's superlative is gone, and blues.4 now distinguishes spelling from pitch (F3a) | CLOSE | CL01 | - | - | ear-tune.md, blues.4.md | A2 |
| T58 | The T58 lane is in flight and owns split_prompt_views.py, tasks/README.md and in-flight.md; its brief was recorded 2026-09-30 (responses/questions-70656183.md) | RE-CHECK (T58 lane queued) [BUILD NOW] | LN-T58 | T58 | the lane's landing and its review | split_prompt_views.py, README.md, in-flight.md | A2 |
| U5 | The look-ahead row gets only the height left after the window is sized (WindowRenderer.ts:1895–1912; 04 §5:2291), so a stage the window fills shows… | RE-CHECK (U32 owns WindowRenderer.ts) [DECISION] | CL07 | U32 | the staff size above which the next row may take height from the window, judged on the window-rule gallery… | WindowRenderer.ts, score.window-rule.spec.ts, 04-ui-spec.md | C |
| U8 | The objective is now the owner's three goods (04 §5:2262–2289), priced in chooseWindowShape (WindowRenderer.ts:1669). The gap that remains, next music as a requirement and not leftovers, is U77's. | MERGE → U77 | CL07 | - | - | WindowRenderer.ts, 04-ui-spec.md | C |
| U9 | slots.ts:1–10 states the karaoke shape: the cursor's slot is untouched, and the slot left behind is redrawn with what follows. Whether the current never moves is unmeasured, and U32 is changing the… | RE-CHECK (U32 changes the sheets) [DEFER TO H] | CL25 | U32; AT-10 | after U32: the current slot's y across crossings, measured on a device (AT-10) | slots.ts, WindowRenderer.ts | C |
| U11 | Built: the count falls until the five-line staff clears MIN_STAFF_PX, and then the look-ahead is priced from what is left (WindowRenderer.ts:117, :1864–1912). The number itself is U33's. | CLOSE | CL07 | - | - | WindowRenderer.ts | C |
| U14 | Superseded. The count is the learner's Bars option and yields to the floor; density enters through the width of the widest row (WindowRenderer.ts:1810–1816; 04 §5:2262–2289). | CLOSE | CL07 | - | - | WindowRenderer.ts | C |
| U17 | The fit uses the stage box under the header and the measured bar. Top and bottom safe insets are padded (style.css:40–41); no left or right inset in app/src, though app/index.html:6 sets… | DEFER TO H | CL25 | U30 | - | style.css, ScoreScreen.css, index.html | C |
| U18 | Built: the bar hides 3 s into a run, upright the header folds with it, and a tap on the sheet brings both back (ScoreScreen.ts:3186–3232; 08 §9.34). The hidden status line is U53's. | CLOSE | CL05 | - | - | ScoreScreen.ts | C |
| U19 | The keys view is a learner setting (strip, ribbon or off), not a state of the run (ScoreScreen.ts:4702–4721). X15 names U19 as one of its screen-by-screen pieces. | MERGE → X15 | CL05 | - | - | ScoreScreen.ts, KeyboardStrip.ts | C |
| U23 | No pure plan: chooseWindowShape is a private method of the 4,779-line renderer (WindowRenderer.ts:1669). Only the slot arithmetic is pure (slots.ts:15–18). | RE-CHECK (U32 owns WindowRenderer.ts) [BUILD NOW] | SG12 | U32 | after U32: the extraction seam cut from U32's final chooser, not today's | WindowRenderer.ts, slots.ts, windowRendererStage.test.ts | C |
| U24 | Rare options live in the ⋯ sheet (08 §7.2) and the help strip names the task. One goal line kept apart from configuration is X9's first question, applied to Score. | MERGE → X9 | CL22 | - | - | ScoreScreen.ts, helpStrip.ts | C |
| U27 | Needs a real session on the owner's devices. Local -win32 references are gitignored (.gitignore:44) and go stale by design; Linux CI is the reference. | DEFER TO H | CL25 | - | - | perf.spec.ts, playwright.config.ts | C |
| U28 | x-check: the same finding as G39 (pedal marks on the pedal items). The generator moved text directions out from between the staves (pending-review.md:9049). The pedal blob stays: no OSMD rule… | MERGE → G39 | CL15 | - | - | generate_exercises.py, OsmdView.ts | C |
| U30 | devicePreview.ts is the setup tour's miniature, not a device-matrix harness. Four Playwright configurations exist (app/playwright*.config.ts); no system-UI matrix. | DEFER TO H | CL24 | X15 | - | devicePreview.ts, playwright.config.ts, playwright.states.config.ts | C |
| U31 | x-check: U105 owns ScoreScreen.ts. Today's session resumes (Entry 134, item 4). A Score run's bar is saved only in the disposer (ScoreScreen.ts:5292–5306), not on hide (:5200), so a kill after… | RE-CHECK (U105 owns ScoreScreen.ts) [BUILD NOW] | CL09 | U105 | U105 landed | ScoreScreen.ts, unfinishedRun.ts, score.run.spec.ts | C |
| U32 | In flight: sheets by need, dispatched 2026-09-30 at a7c232c7 (Entry 169) under the three conditions in responses/questions-71bd6cee.md. | RE-CHECK (U32 lane in flight) [BUILD NOW] | LN-U32 | U32 landing and review | the lane's handoff and the whole grid before and after | WindowRenderer.ts, score.window-rule.spec.ts, perf.spec.ts | C |
| U33 | MIN_STAFF_PX = 22, measured on the five lines and marked provisional (WindowRenderer.ts:86–117). The reviewer: the threshold is a product rule, decided with U77/U78… | RE-CHECK (U32 owns WindowRenderer.ts) [DECISION] | CL07 | U32 | the floor chosen from gallery cells at two or three candidate values, on phone and tablet | WindowRenderer.ts, score.window-rule.spec.ts, 04-ui-spec.md | C |
| U34 | x-check: U105 owns help.ts. help.ts:107 and :146 still promise the next bar every time. The code grants it only from room left (WindowRenderer.ts:1895–1912), and the reviewer asked for the prose to… | RE-CHECK (U32 first; U105 owns help.ts) [BUILD NOW] | CL09 | U32; U105 | U32 and U105 landed; the sentence matched to the rule U32 leaves | help.ts, help.test.ts, 04-ui-spec.md | C |
| U35 | Across the stage, a frozen run's size still gives way at once when a wider row arrives (WindowRenderer.ts:3835–3845). A run is priced from the cursor's window, not the… | RE-CHECK (U32 owns WindowRenderer.ts) [READ] | CL07 | U32 | how often the grid's runs shrink mid-run across the stage, and what pricing from the widest row costs the… | WindowRenderer.ts, score.window-rule.spec.ts | C |
| U39 | While playing, an option change restarts the run with no sentence at the time; the change is reported in the summary (ScoreScreen.ts:2607–2621). A long-press mid-run is ignored (:2994). X15 names U39. | MERGE → X15 | CL05 | - | - | ScoreScreen.ts, help.ts | C |
| U40 | The dev count test was revised to the current window (score.spec.ts:360–381, 2026-09-25). Local -win32 references are gitignored (.gitignore:44), last written 2026-09-25. | CLOSE | - | - | - | score.spec.ts | C |
| U41 | slideToStep clamps only rightward slides (WindowRenderer.ts:1491, Math.min(0, …)), so step 0 can slide bar 1 left past its clef, against 08:476. U89 records… | RE-CHECK (U32 owns WindowRenderer.ts) [BUILD NOW] | CL07 | U32 | after U32: the harness at 740×342 and the Score screen sideways, pictured before and after | WindowRenderer.ts, 08-score-render-states.md, score.slide.spec.ts | C |
| U42 | The test now reads after the fit settles. U74 removed the first-draw re-plan within the probe's reach (Entry 114); long pieces keep it, and that remainder is U79 (responses/9c9cf86.md). | MERGE → U79 | LN-U32 | - | - | WindowRenderer.ts, score-fit-paths.spec.ts | C |
| U50 | help.ts:381–382 prints a no-opportunity refusal as a Not judged line, exactly as C3 specified (04-ui-spec.md:3213–3226). | DECISION | CL09 | U105 (help.ts) for the build | keep C3's reviewed no-opportunity line, or print only refusals the learner could act on and leave the rest… | help.ts, help.test.ts, 04-ui-spec.md | C |
| U53 | x-check: U105 owns ScoreScreen.ts. With the chrome folded upright, the corner shows only the bar and the waiting line (ScoreScreen.ts:1122–1124). Ladder lines go to the hidden status line (:2413… | RE-CHECK (U105 owns ScoreScreen.ts) [BUILD NOW] | CL09 | U105 | U105 landed | ScoreScreen.ts, ScoreScreen.css, score.ladder-route.spec.ts | C |
| U55 | Not audited. The notation surfaces are still separate systems: the OSMD score, StaffCard, KeyRibbon, chord charts and PDF. | DEFER TO H | CL25 | - | - | StaffCard.ts, KeyRibbon.ts, ChordChartScreen.ts | C |
| U56 | Not audited in the playing state. Folded chrome is inert (ScoreScreen.ts:3232 onward); the states gallery carries contrast checks (app/tests/states/audit.ts). | DEFER TO H | CL25 | - | - | ScoreScreen.ts, audit.ts | C |
| U58 | Fixed by X1's voice pass (U57): the kept line now reads "and they can't be left out here" (help.ts:610; 04-ui-spec.md:552, :567). | CLOSE | - | - | - | help.ts | C |
| U62 | Unchanged since 2026-09-05: --accent #2f6fed on --bg #f7f7f9 is about 4.3:1 (style.css:32, :37), and .score-waiting uses it (:2769). U88 saw both checks fail again on 2026-09-29. | RE-CHECK (U63 owns style.css) [BUILD NOW] | SG06 | U63 | U63 landed | style.css, audit.ts | C |
| U63 | In flight: dispatched 2026-09-30 at a7c232c7 (Entry 170) with the row-budget ruling (responses/questions-71bd6cee.md). | RE-CHECK (U63 lane in flight) [BUILD NOW] | LN-U63 | U63 landing and review | the lane's handoff at 342 px | TodayScreen.ts, style.css, today.spec.ts | C |
| U64 | Titles have wrapped since U90 (style.css:3688). Each unmeasured concept is still a full row with a not-judged badge (SkillsScreen.ts:303–312), and none are grouped. | DECISION | SG08 | U93 | group the unmeasured concepts after the measured ones, or collapse them behind a count? Decide with U93's… | SkillsScreen.ts, style.css, plan.spec.ts | C |
| U66 | tick() closes windows up to now, with no grace and no drain of queued input (PracticeEngine.ts:644, :1266–1277). The reviewer: X reproduces it and chooses the rule (responses/a008ba5.md). | BUILD NOW | SG02 | - | - | PracticeEngine.ts, engineTempo.test.ts, engine.spec.ts | C |
| U68 | x-check: generated identity is (family, version, seed, recipe, tempo) (review.py:268-284); E50a leaves it; the family version bump is the explicit identity move. grand_staff always writes RH and LH… | BUILD NOW | CL15 | - | - | generate_exercises.py, test_generator_invariants.py | C |
| U69 | withSound starts only when the engine is running after a bounded wait (ScoreScreen.ts:2859–2922; PLAY_SOUND_WAIT_MS at :217). Hear it goes through the same gate (:2516). | CLOSE | LN-U105 | - | - | ScoreScreen.ts | C |
| U75 | The placeholder sheet prints the piece's importHint and no id (LibraryScreen.ts:786–790). | CLOSE | - | - | - | LibraryScreen.ts | C |
| U77 | 04 §5:2273 still says "always look ahead", while :2291–2295 says the next bar comes from room left over, as the code does. The reviewer keeps E30 until it… | RE-CHECK (U32 owns WindowRenderer.ts) [DECISION] | CL07 | U32 | as U5: whether look-ahead is part of the sizing objective, judged with the threshold on the gallery | WindowRenderer.ts, 04-ui-spec.md, score.window-rule.spec.ts | C |
| U78 | Nothing defines "big enough": the only number is the floor (WindowRenderer.ts:117). The reviewer: a product rule, decided with U77 (responses/9c9cf86.md… | RE-CHECK (U32 owns WindowRenderer.ts) [DECISION] | CL07 | U32 | the comfortable staff size on a phone and a tablet, above which more music beats more size (U82's Hot Cross… | WindowRenderer.ts, 04-ui-spec.md | C |
| U80 | data-side marks the side panel's decision, and on a tablet the renderer waits for it, bounded, before the fit (ScoreScreen.ts:816–846, :3154–3158). | CLOSE | - | - | - | ScoreScreen.ts | C |
| U83 | The sweep has a 120 s budget (score.bar-targets.spec.ts:48). The wrap check (:101) failed intermittently on the runner, and whether the bar or the spec is at fault is unmeasured. | READ | CL24 | - | the bar's width and row count from a failing runner run's artefacts | score.bar-targets.spec.ts, ScoreScreen.css | C |
| U88 | U62's two contrasts still fail (style.css:37). The §9.35 rotation cell (music about a third of the stage, 08:922) is not bisected, and U32 is changing the… | RE-CHECK (U32 owns the grid) [READ] | CL07 | U32; U62 | after U32: bisect the rotation--bars1-real-phone break on the landing commits, then judge the cell under the… | WindowRenderer.ts, gallery.ts, 08-score-render-states.md | C |
| U90 | Skills titles wrap and are never cut (style.css:3688). | CLOSE | SG08 | - | - | style.css | C |
| U92 | The Skills detail line leads with the count and shows an ellipsis where it is cut (style.css:3746–3754). | CLOSE | SG08 | - | - | style.css | C |
| U102 | accuracyReading is the one reading of a row's accuracy, and an unanswered set is stored as not measured (app/src/data/accuracyReading.ts:53–87). | CLOSE | - | - | - | accuracyReading.ts | C |
| U105 | x-check: dispatched at ba0126ad. Carry on (ScoreScreen.ts:1030–1042), the summary's Again (:4003), Loop the weak bars (:4045) and hearBar (:3022) still start outside withSound (:2859). The reviewer… | RE-CHECK (U105 lane in flight) [BUILD NOW] | LN-U105 | U105 landing and review | the lane's handoff and review | ScoreScreen.ts, help.ts, score.hearIt.spec.ts | C |
| X1 | Today runs the session: guided slots, time counted only while visible, every write validated by id, version and token (app/src/data/sessionRun.ts; TodayScreen.ts:547–565). | CLOSE | - | - | - | TodayScreen.ts, sessionRun.ts | C |
| X2 | Plan has a Next up card (PlanScreen.ts:285), expandable stages (:349–379) and tracks in four families (:69–71). It shows no position per track. | DECISION | CL14 | M9 | a you-are-here map per track, once M9 decides core against branches (responses/3e526f1.md: X2 after X1) | PlanScreen.ts, plan.spec.ts | C |
| X4 | Superseded. Today's composed session says why each slot is there (X1, C6), and Plan's Next up card names the next lesson (PlanScreen.ts:285). | CLOSE | - | - | - | TodayScreen.ts | C |
| X5 | No intent layer: the one intent is D4's transfer route (ScoreScreen.ts:516–545), and modes are chosen directly. | DECISION | CL12 | X19; L22 | how the intent vocabulary maps to mode, hands, tempo and section with an exit criterion, inside X19's… | ScoreScreen.ts, sessionRunner.ts | C |
| X6 | Duet exists (ScoreScreen.ts:720–730, :1609). No shadowing (grep "shadow" in app/src: no such feature); Blind is binary (04-ui-spec.md:2694). | DECISION | CL21 | X5; I12 | which duet forms, and what shadowing judges (timing, continuity) as the audio fades | ScoreScreen.ts, ScoreSession.ts | C |
| X7 | Perform drops restart, loop and the ladder and records performance: true (04-ui-spec.md:2699–2703; ScoreScreen.ts:1826, :2206, :2359). There is no stops-and-recoveries report. | DECISION | CL21 | L23; I20 | which Part 14 §15 conditions Perform adopts: no cursor, no red notes while playing, stops and recoveries… | ScoreScreen.ts, ProgressScreen.ts | C |
| X8 | Not built. L23 carries continuity and recovery as a skill with its own drill. | MERGE → L23 | CL11 | - | - | PracticeEngine.ts | C |
| X9 | The help strip answers what-is-this and what-now on five practising screens (helpStrip.ts:2–8), and X1 added the transitions. No AT-7 walk against the four questions has run. | READ | CL22 | - | AT-7: every practice and browsing screen walked at 342 px against what, why, what to attend to and what… | helpStrip.ts, help.ts | C |
| X10 | 04 §0 R3's one filled box is applied on Plan (PlanScreen.ts:278). No restraint pass has followed X1–X5, and X2–X5 are still open. | READ | CL22 | - | every screen's 342 px picture judged against one dominant action, music first, shape plus text | style.css, 04-ui-spec.md | C |
| X11 | Not built as a progression the curriculum shows. T17 carries the arc (hear through to use in music) that this row routes to. | MERGE → T17 | CL19 | - | - | curriculum/stage-*.json | C |
| X14 | X1 split activity outcome from learning evidence for guided Score and Drill (Entry 134; app/src/data/sessionRun.ts). The per-surface hands-on audit has not run. | DEFER TO H | CL25 | X15 | - | sessionRunner.ts, sessionRun.ts | C |
| X15 | Only Score, Today and the session runner handle visibility (grep in app/src). Chord Chart, Lab, PDF and Drill do not, and Drill times with the wall clock (DrillScreen.ts:413, :2473). | BUILD NOW | CL05 | - | - | screenLifecycle.ts, DrillScreen.ts, PdfScreen.ts | C |
| X16 | No lifecycle cues exist: app/src/audio holds the metronome, the piano and the backing loop (listing and grep scope: that folder). | READ | CL05 | X15 | candidate ready, complete and next cues heard at the instrument, and told apart from the metronome and the… | BeatScheduler.ts, Metronome.ts | C |
| X18 | x-check: U105 owns help.ts. The two-line help strip still stays on screen on five practising screens: ChordChart, Drill, FreePlay, Lab and Score (helpStrip.ts:2–16). | RE-CHECK (U105 owns help.ts) [BUILD NOW] | CL22 | U105; X9 | U105 landed; X9 read | helpStrip.ts, help.ts, GuideScreen.ts | C |
| X19 | No episode object: X1 left the detour null, and its case 5 has no test (docs/prompts/entry-134.md:123, :146). | DECISION | CL12 | L22 | what starts an episode before L22 exists, and where its persistence ends apart from L32's session | sessionRunner.ts, sessionRun.ts, ScoreScreen.ts | C |
| X21 | The import sheet's tempo line has a number field and a Use this tempo button (importSheet.ts:317). | CLOSE | - | - | - | importSheet.ts | C |
| X24 | The sheet reads the opening tempo from the one reader and prints the mark's own beat unit (importSheet.ts:96–122; tempoFromXml.ts:82). | CLOSE | - | - | - | importSheet.ts, tempoFromXml.ts | C |
| X25 | The control stays on every MusicXML tempo line and is re-seeded from the returned score (importSheet.ts:317). | CLOSE | - | - | - | importSheet.ts | C |
| X29 | One reader normalises beat unit and dots to quarter notes, with the sound tempo taking precedence (tempoFromXml.ts:2–19, :82). | CLOSE | - | - | - | tempoFromXml.ts, extractScoreModel.ts | C |
| X31 | difficulty.py reads music21's quarter-note BPM at the earliest offset and keeps the default where a note sounds first (difficulty.py:215–229, :360). | CLOSE | - | - | - | difficulty.py | C |
| X37 | Ruled: at the next quarry each out-of-band piece gets a placement review, never a widened band (responses/aa16c702.md). The quarry is E50a's file. | RE-CHECK (E50a owns pdmx/quarry.py) [BUILD NOW at the next quarry] | CL03 | E50a | after E50a: the next quarry's re-measure under one definition, with the three placements reviewed | quarry.py, difficulty.py, validate.py | C |
| X40 | x-check: approved as a lane at ba0126ad. The MuseTrainer file sets sound tempo 120 beside a quarter = 100 mark; the kern variant says *MM100 (mapleleaf.krn:17).… | RE-CHECK (X40 lane queued) [READ] | CL03 | X40 | the MuseTrainer source's own history for the 120 against its printed 100; then the file is corrected, or an… | Maple_Leaf_Rag_Scott_Joplin.mxl, import_musetrainer.py… | C |

Re-checked outside the four files (also in `apply-dispositions.py`):

| row | current truth | disposition | cluster | dependency | evidence needed | owner/files | file |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U16 | Rule row; its breach U3 closed by T38. At ba0126ad the window paths draw natural (WindowRenderer.ts:2590); stretch/fill apply only outside them (:2646, :2672-2676); spec (a) flags any non-natural sheet or bar >1.03x engraved… | CLOSE | CL07 | U32 (the whole grid re-verified) | - | WindowRenderer.ts, score.window-rule.spec.ts | re-check |
| R11 | Summary says "of the suggested tempo" (ScoreScreen.ts:3887); source recorded defaulted (:3323); 180 catalogue items tagged tempo-defaulted; residue: E50 seven text-tempo rows and help.ts:936 "of the written tempo" in rung requirement lines. | MERGE → E50 | CL03 | E50a; E50 | - | convert.py, pdmx.json, help.ts | re-check |
