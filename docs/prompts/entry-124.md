### Entry 124 — Q65b: `screenFrame.ts` and `subScreen.ts` name the union of the specs the map gives the screens that reach them by import instead of the whole browser suite, held by a drift test that finds those screens in the source; the shared-fixtures row names the eight path readers its guard missed, the guard reads a `path.join` from the spec's folder, and the map module is green again (2026-09-29)

**Judgement.** This is tooling. No learner sees it, nothing was listened to, and no browser ran. What the map now says, read off the reader's output:

- **`app/src/ui/screens/screenFrame.ts`** (`checks-for-screenFrame-ts.txt`) matches `app/src/**` and its own row. It prints typecheck, lint, the whole unit suite, the app build and one Playwright command naming 34 spec files. Those 34 are the union of the rows of the 11 screens that import it: ChordChart, Drill, FreePlay, Lab, Lesson, Library, Paper, Plan, Progress, Settings and Today.
- **`app/src/ui/screens/subScreen.ts`** (`checks-for-subScreen-ts.txt`) prints the same four guards and 26 named spec files. They are the union of the rows of the 13 screens that reach it:
  - the 12 that import it: the three dev screens, Diagnostics, Folder, Guide, Metronome, Mic, Midi, Setup, Shelf and Skills;
  - LessonScreen, which imports ShelfScreen's piece sheet (`openPieceSheet`).
- **Before**, both printed the whole default configuration (`checks-for-helpers-before.txt`).
- **Unchanged:** the router, `main.ts`, AppShell, `style.css` and `app/src/app/**` still print the whole suite (`checks-for-router-and-shell.txt`).
- **A shared fixture** (`checks-for-fixtures.txt`, on `app/tests/fixtures/imports/two-hands.mid`) now names 20 specs instead of 12. The eight added are X3's `import-experience` and seven older readers the guard never saw: `chart`, `doors`, `finder`, `library`, `pdf`, `shelf` and `wide`.

**The reach is transitive, and the walk stops at the shell and the entry.** A screen reaches a helper if it imports the helper, or imports a file that reaches it.

- That adds LessonScreen to subScreen, through ShelfScreen's piece sheet, which puts `lesson-flow`, `lesson-tools` and `start-and-return` on the row. Over the 12 direct importers alone the union is 23; with LessonScreen it is 26.
- For screenFrame the direct and transitive readings agree.
- The walk does not pass through `app/src/ui/AppShell.ts` or `app/src/main.ts`. They import every screen in order to mount it, and their own rows are the whole suite because their code runs on every spec's path. The helper's code runs only where a screen that reaches it is mounted.
- Walking through them would have made both unions the whole suite for a reason that is not about the helpers.
- The brief said "each screen file that imports it". The coordinator kept the transitive reading as built.

**The orchestrator's hypothesis held.** Every screen that reaches either helper has its own row with a named `e2e` set, so both unions can be computed. Neither union is the whole default suite (`union-committed-map.txt`, computed before the map was touched):

- `app/tests/e2e` holds 112 spec files; 108 of them are outside the four environment-gated specs.
- screenFrame's union leaves 74 of those 108 out, and subScreen's leaves 82.
- The refuting cases did not occur: no importer lacks a row, and no union is the whole suite.
- Each committed row equals its computed union exactly (`row-equals-union.txt`).

**The fixtures fault, and its mechanism.** The shared-fixtures guard was red at the base (`baseline-checks-for-paths.txt`) on `import-experience.spec.ts`. That spec landed with X3, which was built beside Q65a and never ran this module.

- Behind that red was a second fault. Q65a's reference pattern for readers of `app/tests/fixtures/**` did not match `path.join(..., '..', 'fixtures', ...)`. That is how most of these specs open a fixture: on one line in `doors`, `finder`, `library`, `shelf`, `wide` and `import-experience`, and over several lines in `chart` and `pdf`.
- `import-experience` was caught only because a comment in it spells `tests/fixtures/`. The other seven were unnamed and silent (`fixture-readers.txt`).
- The change widens the pattern first, which made the check red on the committed row with exactly those eight names (`red-fixtures-widened-pattern.txt`). The row then names them. After the change, every spec the wider forms find is named (`fixture-readers-after.txt`).

**What the lists are not.** No spec named here was run on this tree. Whether each passes is CI's (unverified here). A union is only as good as the screens' own rows, which this seam did not re-derive.

---

**Done**

1. **The unions, computed and committed** (item 1).
   - Both rows now name their union, sorted and deduplicated. The `app/src/**` row supplies the guards. The FolderScreen row's `folder*.spec.ts` is expanded to its five files, because the brief asks for explicit names.
   - Each reason names every importer by file stem, with LessonScreen's path, and says the union is not the whole suite.
2. **The drift test** (item 2): `TheMinimumSemantics.test_a_frame_helper_names_the_union_of_its_screens_specs`.
   - It walks the import graph over `app/src` from each helper at test time. The graph is Q65a's importer regex, moved into the test module as `app_importers` and `frame_importers`, and the walk stops at the two mounts.
   - For each importer it asks the reader for the map's browser set. It then asserts three things:
     - **union:** the helper's set contains each importer's set. Any importer that is short is named with its missing specs. If an importer has no set of its own, the helper's row must be `"*"`. Where the row is `"*"`, the union must be the whole default suite or such an importer must exist.
     - **reason:** the row's reason names every importer.
     - **discovery:** at least one importer is found, and the helper has a row of its own.
   - Red on the committed map for both helpers, on both the union and the reason checks (`red-drift-committed-map.txt`).
   - Green after.
   - Mutants: 9 caught, each failure naming what the mutant broke, and 3 controls green (`mutants.txt`, table below).
3. **The reader is unchanged** (item 3). `checks_for_paths.py` has no diff. `test_ci_order` passed 11 of 11 before (`ci-order-committed-map.txt`) and after; that includes the superset case.
4. **Nothing else moved** (item 4).
   - Beyond the two frame rows, the fixtures row and the `about` clause, which are the coordinator's additions, the map has no diff: 4 lines changed in `checks.json` (`diff-numstat.txt`).
   - The universal rows, the unit-suite rule, the content rows and the fallback are untouched.
   - Q69, Q70 and the `docs/08` additions stay with their own seams. My `docs/08` rows are under Doc rows.
5. **The prune** (item 5).
   - Removed: the two rows' hand-written prose lists of the frames' screens, their counts ("11 of the 29", "12 of the 29") and the "kept whole by judgement" sentences.
   - The importer names that replace them are not a hand list: the new case's reason check holds them to the source.
   - Nowhere else: the grep for `screenFrame|subScreen` found no other row of the map, and nothing in `test_checks_for_paths.py` before this change, `test_ci_order.py` or the reader.
6. **The fixtures row and its guard** (the coordinator's addition 1).
   - The guard's reference for `app/tests/fixtures/**` now also matches `'..', 'fixtures'` (on one line or several) and `../fixtures/`.
   - Red on the committed row with the eight names (`red-fixtures-widened-pattern.txt`).
   - The row names them, and its reason no longer carries the stale "five spec files" count.
   - Green after.
7. **The `about` text** (addition 2) now ends: "…a test-side helper's list names every file that reads it, and the two screen frames name the union of the specs their importing screens' rows give." It is prose that no test reads, so it had no red.
8. **Both modules green** (`checks-for-paths-and-ci-order-after.txt`): `test_checks_for_paths` and `test_ci_order` pass, 38 of 38 tests. The map module had not been green on this line since X3 landed.
9. **JSON spliced as text.** CRLF kept on all 178 lines of `checks.json` and all 403 of the test file, and every edited list is sorted.

**Not done**

- **The named lists were not run.** This is a tooling seam, and no browser may start here (unverified).
- **No content build.** None was needed: the map tests read the source and the map, not the built tree.

**Follow-ups**

- **Screen rows do not compose through screens.** LessonScreen imports ShelfScreen's `openPieceSheet`, but ShelfScreen's own row (`shelf`) does not name LessonScreen's specs. So a change to ShelfScreen is not bounded by what it reaches. The frame test handles this for the two helpers only.
- **The widened fixtures pattern covers the forms found in the default configuration's specs.** A reader that builds the path some other way, for example from a variable, would still be missed. Only `app/tests/e2e/*.spec.ts` was searched.

**Questions:** none.

**Files**

- `docs/prompts/checks.json`:
  - the `screenFrame.ts` and `subScreen.ts` rows (each union, and reasons naming the importers);
  - the `app/tests/fixtures/**` row (eight names added, reason updated);
  - one clause at the end of `about`.
- `tools/content/tests/test_checks_for_paths.py`:
  - module-level `FRAME_HELPERS`, `MOUNTS`, `IMPORT`, `app_importers`, `frame_importers`;
  - `TheMinimumSemantics.e2e_set` and the new frame case;
  - the fixtures reference widened in `test_a_test_side_helper_names_every_file_that_reads_it`.
  - The other cases are unchanged.
- `tools/docs/checks_for_paths.py`: not changed.
- `docs/prompts/runs/Q65b/`:
  - this entry and the captures;
  - `scripts-union.py` (the derivation), `scripts-row-equals-union.py`, `scripts-mutants.py` and `scripts-fixture-readers.py`.

---

**Importers — `screenFrame.ts`** (`union-committed-map.txt`; the rows are the patterns the reader matches beside `app/src/**`)

| Importer | Reaches it | Row | Specs it gives |
| --- | --- | --- | --- |
| ChordChartScreen | imports it | `ChordChartScreen.ts` | chart, modes-chart-from-a-lesson, modes-chart-from-the-score |
| DrillScreen | imports it | `DrillScreen.*` | drills, drills-harmony, drills-review, feedback-placement, tips |
| FreePlayScreen | imports it | `FreePlayScreen.*` | modes-free-play |
| LabScreen | imports it | `LabScreen.*` | lab, lab-both-ways, modes-hold-the-chords, modes-lab-unlock, trading-fours |
| LessonScreen | imports it | `LessonScreen.ts` | lesson-flow, lesson-tools, plan, start-and-return |
| LibraryScreen | imports it | `LibraryScreen.ts` | doors, finder, library, modes-rhythm-only |
| PaperScreen | imports it | `PaperScreen.ts` | pdf-paper, shelf |
| PlanScreen | imports it | `PlanScreen.ts` | modes-placement, plan, plan.hierarchy |
| ProgressScreen | imports it | `ProgressScreen.ts` | progress, progress.hierarchy |
| SettingsScreen | imports it | `SettingsScreen.ts` | keys-guide, progress, settings-rules |
| TodayScreen | imports it | `TodayScreen.ts` | app-shell, doors, first-day, lab, lesson-flow, modes-free-play, modes-placement, progress, progress.hierarchy, today, transfer-offer |
| (AppShell.ts) | mounts the screens | whole suite, on every spec's path | not walked |
| **Union** | | | **34 files; not the whole default suite** |

**Importers — `subScreen.ts`**

| Importer | Reaches it | Row | Specs it gives |
| --- | --- | --- | --- |
| DevExcerptView | imports it | `DevExcerptView.ts` | excerpts, microscope |
| DevMicroscopeScreen | imports it | `DevMicroscopeScreen.ts` | microscope |
| DevScoreScreen | imports it | `DevScoreScreen.ts` | engine, score, score.renderer.fuzz |
| DiagnosticsScreen | imports it | `DiagnosticsScreen.ts` | offline.report, progress |
| FolderScreen | imports it | `FolderScreen.ts` (`folder*.spec.ts`) | folder, folder.add, folder.manifest, folder.rail-cost, folder.readable |
| GuideScreen | imports it | `GuideScreen.ts` | guide |
| LessonScreen | through ShelfScreen (imports `openPieceSheet`) | `LessonScreen.ts` | lesson-flow, lesson-tools, plan, start-and-return |
| MetronomeScreen | imports it | `MetronomeScreen.ts` | metronome |
| MicScreen | imports it | `MicScreen.ts` | mic |
| MidiScreen | imports it | `MidiScreen.ts` | midi, midi.unplug |
| SetupScreen | imports it | `Setup*` | first-day, setup, setup-layout |
| ShelfScreen | imports it | `ShelfScreen.ts` | shelf |
| SkillsScreen | imports it | `SkillsScreen.ts` | competence, plan |
| (AppShell.ts) | mounts the screens | whole suite, on every spec's path | not walked |
| **Union** | | | **26 files (23 over the direct importers); not the whole default suite** |

**Red lines**

| Red | Then |
| --- | --- |
| `red-drift-committed-map.txt`: the new frame case on the committed map fails 4 subtests. screenFrame and subScreen, `union`: "the row is the whole suite, but the specs its importing screens' rows name are not the whole default suite; name their union: [...]". Both, `reason`: the importer stems the reason lacks (11; 13) | green (`checks-for-paths-and-ci-order-after.txt`) |
| `baseline-checks-for-paths.txt`: at the base, before any edit, the fixtures subtest is red on `import-experience.spec.ts` | green |
| `red-fixtures-widened-pattern.txt`: the widened fixtures pattern on the committed row names eight readers the row lacks: chart, doors, finder, import-experience, library, pdf, shelf, wide | green once the row names them |
| `mutants.txt`: the frame case on 9 mutants of the edited map, each caught, with its failure naming the file, spec or rule the mutant broke. Controls green: an importer whose row is `"*"` with the helper's row `"*"`; a helper `"*"` whose union is the whole default suite; the map as committed. The harness's first run failed in its own setup (`setUpClass` does not run outside a suite), and its check that a failure names the file reported every row as bad; the capture is the rerun | 9 of 9 caught, 3 of 3 controls green |
| `ci-order-committed-map.txt` | `test_ci_order` passes 11 of 11 before and after |

**Mutants** (`scripts-mutants.py`)

| Mutant | Caught by the failure naming |
| --- | --- |
| screenFrame's row without `tips` (only DrillScreen's row gives it) | `DrillScreen.ts` |
| subScreen's row without `guide` (only GuideScreen) | `GuideScreen.ts` |
| subScreen's row without `lesson-tools` (only LessonScreen, the transitive importer) | `LessonScreen.ts` |
| screenFrame's row `"*"` again · subScreen's row `"*"` again | "the row is the whole suite" (each) |
| MetronomeScreen's row gains `wide` | `MetronomeScreen.ts` |
| GuideScreen's own row removed (an importer with no set) | `GuideScreen.ts` |
| a new importer the source does not have (the discovery made to add ScoreScreen.ts to screenFrame) | `ScoreScreen.ts` |
| subScreen's reason leaves out SkillsScreen | `SkillsScreen` |

**Tests**

| File | Class | Why |
| --- | --- | --- |
| `test_checks_for_paths.py` › `TheMinimumSemantics.test_a_frame_helper_names_the_union_of_its_screens_specs` | add | the reviewer's required change: each frame helper's row contains the union of its importing screens' sets; the importers are discovered at test time; `"*"` only where the union is whole or an importer has no set; the reason names every importer (the prune's owner) |
| `test_checks_for_paths.py` › `FRAME_HELPERS`, `MOUNTS`, `IMPORT`, `app_importers`, `frame_importers`, `e2e_set` | add | the discovery and the reader's browser set, shared by the case and the mutants |
| `test_checks_for_paths.py` › `test_a_test_side_helper_names_every_file_that_reads_it` | replace (its `app/tests/fixtures/**` reference) | the old reference missed a `path.join` from the spec's folder, so seven readers were unnamed and silent; the wider reference sees them (red with eight names, then green) |
| `test_checks_for_paths.py` › the other 25 cases | untouched | pass |
| `test_ci_order.py` | untouched | the CI superset over the map, 11 of 11 before and after |

**Exit codes** (each capture's first line is its command, its last `exit=N`)

| Capture | Exit |
| --- | --- |
| `head.txt` (76d557a) · `diff-numstat.txt` | 0 · 0 |
| `union-committed-map.txt` · `union-after.txt` · `row-equals-union.txt` | 0 · 0 · 0 |
| `checks-for-helpers-before.txt` · `checks-for-screenFrame-ts.txt` · `checks-for-subScreen-ts.txt` · `checks-for-router-and-shell.txt` · `checks-for-fixtures.txt` | 0 each |
| `ci-order-committed-map.txt` | 0 |
| `baseline-checks-for-paths.txt` (the base, before any edit: the fixtures subtest) | 1 |
| `red-drift-committed-map.txt` (the frame red) · `red-fixtures-widened-pattern.txt` (the fixtures red) | 1 · 1 |
| `checks-for-paths-and-ci-order-after.txt` (38 of 38) | 0 |
| `mutants.txt` | 0 |
| `fixture-readers.txt` (before: seven silent, one red) · `fixture-readers-after.txt` (none unnamed) | 0 · 0 |

Unverified, beside the above:
- No named spec ran on this tree.
- The screens' own rows, which the unions inherit, were not re-derived.
- CI's state on this tree was not read.
- Nothing musical here; nothing heard.

**Orchestrator's note at the landing (2026-09-29).** Q65b's worktree committed by name (b690be15) and merged (9505e1f2). The chain on the merged main checkout: the map's two test files, the reader on the two helpers as the product look, the validator (map-tests 0; map-reader 0; content-validate 0; `runs/Q65b/orchestrator-exit.txt`). The builder found the map's own test red on the tree since X3 landed — X3's new spec reads the shared fixtures and the fixtures row did not name it, and seven older specs read them by a path form the check did not see — and was sent back to fix both before landing: the pattern widened, the eight names added, red first. That red would have been CI's content-tests step on every push since X3's (no run on those trees completed, so it was not observed there); the X3 landing chain (app-only) could not have seen it, which is the gap Q65's map exists to close once it stops being advisory. Two follow-ups recorded (Q72: a screen's row does not carry through to a screen that imports it; Q73: the `about` clause and the frames' union). Nothing musical; nothing heard.


## Doc rows

For `docs/08-test-map.md`, amending the rows Entry 120 proposed (not yet in the file); for the orchestrator to splice with them.

- In the paragraph "**The minimum for a landing** …", after "A test-side helper names the spec files that import it, and `test_checks_for_paths.py` fails when a new importer is not named.", add:

  "The two screen frames, `screenFrame.ts` and `subScreen.ts`, name the union of the specs the map gives the screens that reach them by import (Q65b). The test finds those screens in the source and fails when one's set is not contained or one has no set of its own."

- In the `test_checks_for_paths.py` line's list:
  - After "A test-side helper's list names every spec, unit file and content test that reads it.", add: "(a spec that opens a shared fixture by a `path.join` from its own folder counts, Q65b)".
  - Then add the bullet: "- The two screen frames name the union of the browser specs the map gives the screens that reach them by import. The importers are found from the import statements at test time; the walk stops at the shell and the entry, and the reason names each importer (Q65b). `docs/prompts/runs/Q65b/scripts-mutants.py` shows the case catching its mutants."
