### Entry 144 — X31 — the content build reads a file's opening tempo as the app does: quarter notes a minute through music21's `getQuarterBPM()`, the readable mark at the earliest offset, a tempo word's borrowed number refused; the build's opening equals the app's on 2,007 of 2,012 bundled scores (1,833 before), and no catalogue level moves in this build (2026-09-29)

**Judgement.** Nothing was heard and nothing was looked at on a screen: this seam changes a number the level model reads, and in this build that number moves **no** catalogue level. What a learner meets is therefore unchanged today; what changes is that the build's duration feature and the app's are now one definition on every bundled score but five, which matters the next time a level is estimated from a file (an import on the phone, a cut, a re-quarry).

- **The corpus, the three counts** (item 4; `corpus-table.txt`, in full). Of the **2,013** scores the built catalogue names with a MusicXML file (X3d counted 2,011; this build has two more), music21 cannot parse one (`song.classical.mozart-k545-i.alt`, "incorrect accidental 9.0 for pitch F3"; its `features()` cannot run either, before or after). Of the **2,012** compared, the build's opening tempo equals the app's (`tempoFromXml`'s opening, 100 where the app reads none) to a hundredth on **2,007** after X31 (**1,833** before) and differs on **5**:
  - **4 late tempos** — *Bach, WTC I Prelude 2*, the *Carol of the Bells* medley, *Le Festin*, the *Fallout 4* trailer: each writes its first tempo only after notes have sounded. The app opens at its default 100 and changes where the tempo stands (X3d's Question 2, the reviewer's ruling in `responses/5e6eceba.md`); the build takes the earliest mark anywhere (145, 152, 150, 144). The brief refuses the app's rule in Python, so this gap is named, not closed.
  - **1 dropped sound** — Satie's *Gymnopédie no. 1*: bar 1's direction holds "Lent et douloureux", a `<metronome>` quarter = "ca. 76" and `<sound tempo="60"/>`, and a second direction at the same place `<sound tempo="76.0002"/>` (`satie-bar1.txt`). The app opens at the first sound, 60. music21 reads no number from "ca. 76" and, because the direction holds a `<metronome>`, drops its sound too (its `xmlDirection`: "avoiding doubled metronomes"), so the build opens at 76.0002. Before X31 the build read 100.
- **X3d's 179 moved openings first:** after X31 the build equals the app's reader on **175** of them to a hundredth (as the Score label rounds: 62 before, 175 after); the other 4 are the late tempos above.
- **The largest level moves, as a learner meets them** (item 5). In the build: **none** (`level-diff.txt`: 0 of 2,092; the only other catalogue difference is `source.fetchedAt` on 228 items, the build's own clock). The premise that the build's levels would move does not hold for this build: the build estimates a level from `features()` only for the Mutopia rag and the five excerpts (`import_mutopia.py:529`, `excerpts.cut`), and all six open at an unchanged tempo (100, 96, 96, 140, 96, 96). A quarried PDMX row carries the quarry's stored `level` (`import_pdmx.build_item`), and a kern row's level is judged or banded. **For information, not in any catalogue** (`latent-levels.txt`): at the new tempo **140 of the 542** quarried rows would move when the quarry next measures them, **76** by 0.1 or more, **11** by 0.25 or more, **none** by half a stage; 83 up, 57 down. The largest: Lemoine op. 37 no. 25 +0.40 (dotted half = 80 was read as 80, is 240), Chopin's Nocturne op. 15 no. 2 −0.37 (a sound-only 40 was read as 100), Debussy's *Little Shepherd* −0.31, Schumann's *Poor Orphan* −0.30, *If I Had a Chicken* −0.29 (eighth = 250 read as 250, is 125). A level goes up where a half-note or dotted-half mark had been read as quarter notes, putting the piece at a half or a third of the tempo the app plays. It comes down where an eighth-note mark had been read that way (twice the tempo), or where a sound-only tempo had fallen back to 100. On a rung: *If I Had a Chicken* (chords-pop.8) −0.29, *Nimrod* and the Mahler Adagietto (classical.4.shelf) −0.25, *Skip to My Lou* (2.3) −0.23, *Skye Boat Song* +0.20 and *Shenandoah* −0.20 (chords-pop.4), *Joyful, Joyful* (hymns.2) −0.20. Three would leave their lesson's stated band on that next quarry (Question 1). A move of a fifth of a stage within a rung's band is not something a learner would notice; whether the new levels read truer as music is unverified (nothing heard).

The fit, for information (item 3; `fit-report.txt`): on the same 164 judged songs, 37 of which have a moved duration feature, a refit would read Spearman **0.879 → 0.885** and leave-one-out median error **0.400 → 0.410** stages, both over the bar. The committed model, which is what is used, reads **0.900 → 0.904** and **0.380 → 0.380** in sample. This is no case for a refit; the model stays as committed.

**The hypothesis, tested — held, with one premise corrected.** The brief's hypothesis: the build's `bpm` is `tempos[0].number`, the first mark's per-minute with its beat unit ignored, found in recursion order. The test that could refute it was the red run: it would have been green if the committed read already normalised. It went red on the committed code for exactly those faults (`red-unit-committed.txt`): a half note = 60 read **60** for 120, a dotted quarter = 80 read **80** for 120, the upper staff's bar-5 mark read before the lower staff's bar-1 mark (**60** for 120), and a tempo word read as music21's own number (**132**, "Allegro", for the default 100). **One more misreading found on the way, and the larger in the corpus:** `.number` is `None` on a mark music21 builds from a `<sound tempo>` alone. The committed read therefore ignored every sound-only tempo and fell back to 100. The shape table shows it (`shapes-table.md`: a sound alone 72.5 → 100, the Fifth's opening 164 → 100, E48's form 72 → 100), and so does Chopin's nocturne above. Of the **178** bundled scores whose build opening X31 moves (`corpus-moved-by-cause.txt`):
- **137** had a first mark with no number, read as 100;
- **41** had a beat unit other than an undotted quarter (21 dotted quarters, 9 eighths, 8 halves, 2 dotted halves, 1 dotted eighth). This is X3c's count of 41 again.

**Premises checked at the lines.**
- The tempo read stood at `difficulty.py` 256–257, inside the brief's "about 205–275". `excerpts.py` estimates at 475.
- `build.py` about 1030 is the excerpt record's level *fact* ("the difficulty model on the cut"), not a call. `build.py` calls no `features()`. The build's estimates are made in `import_mutopia.py:529` and `excerpts.cut`, and a PDMX row's level comes from `content/sources/pdmx.json` (hence no build move, above).
- `getQuarterBPM()` exists in the installed music21 (10.5.0), so the brief's fallback was not needed.
- `export_levelling_fixture.py` does write into `app/tests/**`, and `difficulty.test.ts` stayed green on the regenerated file, so the brief's stop line was not reached. **The change acts on the mechanism:** the tempo now comes from `getQuarterBPM()`, which prefers the `<sound tempo>` music21 kept and otherwise normalises the mark by its referent. The opening is chosen by offset, not by walk order. A number music21 invented from a tempo word is refused. Three mutants, one per rule, are each killed by the test aimed at them (`mutants.txt`).

**What music21 makes of the app's shapes** (item 2; `shapes-table.md`, from `TestTheAppsTempoShapes`, which builds the XML of `app/tests/unit/tempoFromXml.test.ts`). Of 35 shapes, the build agrees with the app on **28** after X31 (**13** before). All three named forms agree wherever the file agrees with itself: a `<metronome>` with a beat unit and dots (the whole normalisation table, double dots included), a `<sound tempo>` alone (in the bar, or with a tempo word), and both in one direction (MuseScore's form). They part on **7**, and the build keeps music21's reading:

- a mark and a sound that disagree in one direction: music21 drops the sound, twice (one of them the pickup's own);
- a sound standing beside a mark at one place (E32's form): the first in the file wins;
- "c. 108": no number;
- the app's opening rule, three times: a tempo written after a note has sounded.

On the corpus these forms are the 5 above.

## Done

1. **Quarter notes a minute, from music21** — `tools/content/difficulty.py`: `features()`'s two tempo lines replaced by `opening_quarter_bpm(score)`, with `_quarter_bpm(mark)` and `DEFAULT_BPM = 100.0` beside it (`git diff`: the only removed lines are the two old ones). `getQuarterBPM()` is used as music21 10.5.0 (installed here) defines it: the `numberSounding` it kept, else the number times the referent's quarter length. A mark whose number music21 supplied from a tempo word (`numberImplicit`, no sound) is not a tempo, nor is one with no number music21 can read, nor one whose value is 0 or less. A metric modulation is not a `MetronomeMark`. The default 100 stays.
2. **The opening, not the first found** — the readable mark with the least `getOffsetInHierarchy(score)`. Ties go to the least `recurse()` order, which walks each part whole before the next, so a tie goes to the first part (the two-part shape, `two parts at one place`, agrees with the app). The app's opening rule and its sound-over-mark precedence are **not** in Python; the gaps are named in the function's docstring, in `_GAPS` in the test, and counted above.
3. **The model is not refit** — `content/sources/level-model.json` untouched (`git status`); the fit report is in the run folder only, before and after, plus `fit_level_model.py`'s own after report (report only, no `--write`; its line equals the script's "after").
4. **The corpus table** — `corpus-table.txt` (every differing score, both numbers, the form), from `corpus-bpm.jsonl` (music21, both reads, per score) and `corpus-app.jsonl` (the app's reader, per score, on the same built files), joined with `runs/X3d/corpus-models.txt`.
5. **Levels before and after** — both builds offline with absolute `--out`s (before: `build/x31-before/content`, kept; after: `app/public/content`), `level-diff.txt` (0 moved; the excerpts' levels listed, unchanged). `latent-levels.txt` holds the for-information re-quarry table, with a check: the stored `notesPerSecond` equals the feature's formula at the old read on today's built file for **542 of 542** rows, so that table isolates X31's change exactly.
6. **The parity fixture** — `app/tests/fixtures/levelling.json` regenerated (43 scores); `npx vitest run tests/unit/difficulty.test.ts` **green**, 54 of 54. Two changes (`fixture-levels.jsonl` has both sides for every fixture):
   - **tuplets-68** (6/8, `<metronome>` eighth = 120 with `<sound tempo="120">`: the file contradicts itself, 120 eighths being 60 quarters). Python's level is 1.34 → **1.16**, since music21 reads the mark (60); the app reads the sound (120) and stays at 1.34. The gap is 0 → **0.18**, inside the 0.2 tolerance: the one parity fixture X31 moves, it moves away from the app, by this seam's named gap.
   - **spelling** added at 3.08, both sides equal: the committed fixture had not been regenerated since that fixture score was added.
7. **Red first, unit** — `TestTheOpeningTempo` (5) and `TestTheAppsTempoShapes` (2) in `tools/content/tests/test_difficulty.py`, in the file's pattern (scores built in music21; the app's XML built as strings and parsed). The tempo is read back through the public features (`notesPerSecond / notesPerBar × beats × 60`), so the red run shows the number the old read gave, not an import error. Red on the committed code: 6 of 17 (the list above). `test_a_file_with_no_mark_keeps_the_default` is green on both, by design (the old read also gave 100); it pins the default.
8. **Not X31's, untouched:** `app/src/**` (the reader and its tests), `render_check.py`, `excerpts.py`, `build.py`, `level-model.json`, the excerpt proposer, rung placements.

*Technical:* 7 new unit cases (6 red first), 3 mutants killed, parity green, both builds and the validator green, the content suite and the unit suite as in the table below. *Pedagogical:* the duration feature now counts the tempo the app plays, in the unit the app counts. No level a learner sees moves in this build. The re-quarry's moves correct pieces the old read counted at a wrong multiple of their tempo, 83 up and 57 down. **Unverified as music:** nothing was heard, and whether any new level is truer to a piece is a teacher's call not made here.

## Not done

- **The app's opening rule and sound-over-mark precedence in Python**: refused by the brief (a second copy of the app's reader). The 5 corpus scores and the 7 shapes stand as named gaps.
- **The browser layer** the map names for `app/tests/fixtures/**` (20 e2e specs): not run, per the brief ("no browser layer"). By a search of `app/tests` and `app/src` `.ts` files, only `difficulty.test.ts` reads `levelling.json`.
- **The quarried rows' levels** are not re-estimated: that is the quarry's (`tools/content/pdmx/quarry.py`), not this seam's, and it would move 140 rows (Follow-up 1, Question 1).
- **`docs/03`, `docs/08` not edited**: the rows are under *Doc rows*. CI has not run this tree.

## Follow-ups

1. **P2 (the quarried levels lag the feature).** The build takes a PDMX row's stored `level`. The row's stored `features` carry the old duration feature (542 of 542 equal the old formula), so X31 reaches those levels only at the next quarry measurement: 140 rows move, 11 by a quarter stage or more, 3 across their lesson's stated band (Question 1). **Adjacent, not X31's, counted only:** on 308 of the 542 rows the stored `level` already differs from the committed model applied to the row's own stored features, so the catalogue's PDMX levels predate the current model on more than half the rows. That is two definitions of a row's level, recorded rather than fixed (operating procedure §7).
2. **P3 (the parity fixture's own contradiction).** `app/tests/fixtures/scores/edge/tuplets-68.musicxml` writes eighth = 120 with `<sound tempo="120">`, a pair that disagrees by a factor of two. It now carries a 0.18 gap between the two ports, close to the 0.2 tolerance. Making the file agree with itself (sound 60, or quarter = 120) is the fixture owner's call.
3. **P3 (music21's MusicXML reader).** A `<sound tempo>` in a direction that also holds a `<metronome>` is dropped even when the mark has no readable number ("ca. 76"), and two tempos at one place go to the first in the file. On the corpus this is 1 score (Satie). A new MuseScore file with a "ca." mark and a different sound would add to it.
4. **P3 (the late-tempo four).** The build computes those 4 files' duration feature at the file's first tempo; the app opens at 100. Closing that needs the app's opening rule in Python, which the brief refuses; the reviewer's ruling stands for the app.
5. **P3 (a score the build cannot measure).** `song.classical.mozart-k545-i.alt` does not parse in music21 ("incorrect accidental 9.0 for pitch F3"), so `features()` skips it everywhere, the fit included. It is judged, so no level depends on it.
6. **For information:** a refit on X31's feature would weight `notesPerSecond` at 0.51 against 0.44 and move neither number past the bar. There is no evidence here for a refit seam.
7. **Carried, not X31's:** X3d's follow-up 8 (the render check's durations) is unchanged.

## Questions

1. **When the quarry next measures, three rung-placed songs leave their lesson's stated band by a hair**, and `validate.level_band_errors` (replan §1.7) will then fail the build on each:
   - *Shenandoah*: chords-pop.4, band 2.45–4.4, 2.45 → 2.25;
   - *When Johnny Comes Marching Home*: 4.5, band 2.2–4.5, 2.42 → 2.1;
   - *The Crave*: latin.6, band 5–7.46, 7.46 → 7.47.

   Without X31 each stays inside at its stored features' level (2.45, 2.29, 7.28). Widen the bands or move the pieces? It is a placement decision for whoever runs that quarry, not this seam's. The first two come down because the old read took an eighth-note mark (160, 220) as quarter notes. *The Crave* goes up because its sound-only 158 had been read as 100.

## Files

In this worktree; nothing committed, staged or stashed.

- **Changed:**
  - `tools/content/difficulty.py`: `DEFAULT_BPM`, `_quarter_bpm`, `opening_quarter_bpm`, and `features()`'s tempo read now calls it;
  - `tools/content/tests/test_difficulty.py`: two classes, their helpers, and the module note;
  - `app/tests/fixtures/levelling.json`: regenerated.
- **Not changed:** `content/sources/level-model.json`, `app/src/**`, `excerpts.py`, `build.py`, `render_check.py`, `docs/03`, `docs/08`.
- **Build side effects, restored** (`restore.txt`): the after build rewrote `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md` (line endings only) and `content/scores/imported/SOURCES.md` (10 lines). All three were copied back from the snapshot taken before the first build; `git status` shows none of them.
- **Copied read-only from the main checkout** (`setup-copy.txt`, robocopy 1 = copied): `build/cache`, `build/midi-real`, the four `build/*-cache.json`, and `content/scores/imported/{kern,musetrainer,mutopia}` without `.git`, following Q80's precedent. The offline build then produced the whole catalogue itself (2,092 items, validation OK); nothing was copied into `app/public/content`.
- **Beside this entry** (`docs/prompts/runs/X31/`):
  - every capture named here;
  - the scripts: `scripts-setup.ps1`, `scripts-run-build.ps1`, `scripts-corpus-bpm.py`, `scripts-corpus-app.test.ts`, `scripts-fixture-levels.test.ts` (both run from `app/tests/unit/` under an `x31` name, then removed), `scripts-corpus-table.py`, `scripts-level-diff.py`, `scripts-latent-levels.py`, `scripts-fit-report.py`, `scripts-shapes-table.py`, `scripts-mutants.py`, `scripts-bar-directions.py`, `scripts-moved-by-cause.py`;
  - the data: `corpus-bpm.jsonl`, `corpus-app.jsonl`, `fixture-levels.jsonl`.

## The red lines

- `red-unit-committed.txt`: the new cases against the committed `difficulty.py`, exit 1, **6 of 17 red**.
  - `AssertionError: 60.0 != 120.0` (half = 60);
  - `80.0 != 120.0` (dotted quarter = 80);
  - `60.0 != 120.0` (the bar-5 mark in the upper staff before the bar-1 mark in the lower);
  - `132.0 != 100.0` ("Allegro");
  - the shape table: 20 shapes read otherwise than music21 now reads them, among them half = 60 → 60, a sound alone 72.5 → 100, the Fifth's opening 164 → 100, E48's form 72 → 100;
  - the gap list: 22 shapes against the app where 7 are named.

  Green there by design: no mark → 100, and the 10 older cases.
- `mutants.txt` (each on a copy; the tree's file untouched):
  - *raw-number* (the beat unit ignored): 4 red, the two normalisation cases and both shape tests;
  - *first-found* (walk order, not offset): 1 red, the bar-5/bar-1 case;
  - *implicit-counted* (a tempo word's number kept): 1 red, the "Allegro" case.

## Tests

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `test_difficulty.py` › `TestTheOpeningTempo` (5) | add | the first mark's raw `number`, in walk order, a word's number counted | quarter notes a minute; the earliest readable mark; half = 60 → 120, dotted quarter = 80 → 120, bar 1 beats bar 5 across staves, no mark and a word alone → 100 |
| `test_difficulty.py` › `TestTheAppsTempoShapes` (2) | add | — | the app reader's 35 shapes: the build reads each as music21 does; it differs from the app on exactly the 7 named gaps |
| `test_difficulty.py`, the 10 older cases | preserve | — | green, unedited |
| `difficulty.test.ts` on the regenerated fixture | preserve | — | green, 54; tuplets-68's gap 0 → 0.18 recorded |

## Exit codes (the last line of each capture)

| Run | Exit |
| --- | --- |
| setup copies (`setup-copy.txt`) · `parity_reference.py` (`parity-reference.txt`) · `npm ci` (`npm-ci.txt`) | robocopy 1 each (copied) · 0 · 0 |
| content build before, offline, absolute out (`build-before.txt`, `.exit`) | **0** (2,092 items, validation OK) |
| red (`red-unit-committed.txt`) · mutants (`mutants.txt`: 3 of 3 killed) | 1, as intended · 0 |
| `test_difficulty` (`green-unit-difficulty.txt`, 17) · `test_difficulty` + `test_levels` (`unit-difficulty-levels.txt`, 49) | **0** · **0** |
| `export_levelling_fixture.py` (`export-levelling-fixture.txt`, 43 scores) · `npx vitest run tests/unit/difficulty.test.ts` (`vitest-difficulty.txt`, 54) | **0** · **0** |
| content build after, offline, absolute out = the default place (`build-after.txt`, `.exit`) | **0** (2,092 items, validation OK) |
| `validate.py --allow-nc --personal` (`validate-after.txt`) · `validate.py` (`validate-plain.txt`) · `review.py --check` (`review-check.txt`) | **0** · **0** · **0** |
| the content suite, `unittest discover -s tools/content/tests -t tools/content` (`content-suite.txt`, 1,452) | **0** (OK, 4 skipped) |
| the converter harness (`converter-harness.txt`, 54) · `parity_reference.py` again (`parity-reference-after.txt`) | **0** · **0** |
| the unit suite, `npx vitest run` (`vitest-all.txt`) | 1: 310 of 312 files pass; 3 of 7,192 cases fail (7,183 pass, 5 skipped, 1 todo). Two are the recorded line-ending pair in `lessonClaimsAboutApp` (blues.3, 4.7; Entry 101), as in X3d's run. One is `expectedNote.test.ts`'s "every black key in every fixture" at its 5-second timeout under the whole suite; alone it is 12 of 12 (`vitest-expectedNote-alone.txt`, **0**), the load pattern. Neither file reads what X31 changed. |
| `npm run build:app` (`build-app.txt`) | **0** |
| probes: `corpus-bpm-run.txt`, `corpus-app-run.txt`, `fixture-levels-run.txt`, `corpus-table.txt`, `level-diff.txt`, `latent-levels.txt`, `fit-report.txt`, `fit-level-model-after.txt`, `shapes-table.md` | 0 each |
| `python tools/docs/checks_for_paths.py` on the 59 changed paths (`checks-for-paths.txt`) | 0: 59 matched, 0 unmatched |
| after the last edit (a comment in `difficulty.py`, after the builds and the suites): `test_difficulty` + `test_levels` (`unit-difficulty-levels-final.txt`, 49) | **0** |

**What the map names** (`checks-for-paths.txt`): the converter harness, `parity_reference.py`, the content build, validate, the review check, the content suite, the unit suite, the app build, and 20 browser specs (for `app/tests/fixtures/**`).

- **Run:** everything but the browser specs. The content build is the after build, whose absolute `--out` is the default place.
- **Not run:** the 20 browser specs, per the brief. `levelling.json` is read by `difficulty.test.ts` only (searched: `.ts` files under `app/tests` and `app/src`).

**Unverified, beside what passes.**

- Nothing was heard. Whether any latent level is truer to its piece is unverified as music.
- The Satie form was read in the file by hand; the form of the other 4 was read off the probes' fields (the app's first event after notes have sounded), not re-read in the XML.
- The latent table assumes a re-quarry measures the same built file with the same other features, which the 542-of-542 check supports for the duration feature only.
- CI has not run this tree.

**Orchestrator's note at the landing (2026-09-29).** X31's worktree committed by name (aa16c702) and merged (91790446). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/X31/map-min.txt`), the content build offline (the reports compared), the validator, the record check, the whole content suite, then the app steps the map names — the whole unit suite on the rebuilt content, the app build, and the specs the map's minimum names where it names any (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 1; vitest-timeouts-rerun 0; e2e-rerun 0 — the targeted specs' failures passed alone (`e2e-rerun`) — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; the other failures were timeouts under the machine's load and pass alone (`vitest-timeouts-rerun`); `runs/X31/orchestrator-exit.txt`). X3d's follow-up 1 (P2), which the reviewer set for a later wave with its named owner (`responses/5e6eceba.md`). The one browser red in the chain, a lesson-page sweep's finder button not visible within its five seconds under seven builders' load (`sweeps.spec.ts`, a file X31 does not touch), passed alone with its whole file (`e2e-rerun`); the fixture-spelling unit timeout likewise (`vitest-timeouts-rerun`).

## Doc rows

**`docs/03` §3, *The rest of `tools/content/`*, the `difficulty.py` bullet**, a new sub-item after the voice split:

- "**The duration feature's tempo** (X31, Entry 144). `notesPerSecond` is computed at `opening_quarter_bpm(score)`:
  - the readable `MetronomeMark` at the earliest offset (`getOffsetInHierarchy`; a tie goes to the first part), in quarter notes a minute through music21's `getQuarterBPM()`: the `<sound tempo>` music21 kept, else the number times the beat unit's length, dots included;
  - a number music21 took from a tempo word, and a mark with no number it can read, are not tempos;
  - 100 where none is readable.

  It had read the first mark `recurse()` met and its raw `number`. That took a half note = 60 as 60, walked a staff whole before the next, gave "Allegro" music21's 132, and read every sound-only tempo as 100 (`.number` is `None` there). This is the app's definition (`app/src/score/tempoFromXml.ts`, X3d), read through music21 and not copied. The gaps are named in `test_difficulty.py`'s `TestTheAppsTempoShapes`:
  - a mark and a sound that disagree: music21 drops a `<sound tempo>` in a direction holding a `<metronome>`;
  - two tempos at one place: the first in the file;
  - "c. 108": no number;
  - the app's opening at its default before a tempo written after notes have sounded.

  On the bundled scores the build's opening equals the app's on 2,007 of 2,012 (1,833 before): 4 late tempos and Satie's *Gymnopédie no. 1* differ."

**`docs/03` §3, step 4 `import [PDMX]`**, append: "A row's `level` is the quarry's, estimated from its stored `features`; the build does not re-measure it, so a change to `features()` reaches a quarried row's level only when the quarry measures the row again (X31, Entry 144: at the new tempo read 140 of 542 would move, none by half a stage, three past their lesson's stated band)."

**`docs/03` §3, *The rest of `tools/content/`*, the `export_levelling_fixture.py` bullet**, append: "Regenerated 2026-09-29 after X31: `tuplets-68` moves 1.34 → 1.16 on the Python side. Its mark, eighth = 120, and its `<sound tempo="120">` disagree; music21 reads the mark and the app the sound, leaving a 0.18 gap inside the 0.2 tolerance. `spelling` was added, which the fixture had missed."

**`docs/03` §3, *The rest of `tools/content/`*, the `fit_level_model.py` bullet**, append: "Not refit for X31 (Entry 144). On the same 164 judged songs with the tempo read changed, a refit reads Spearman 0.879 → 0.885 and leave-one-out median error 0.400 → 0.410; the committed model reads 0.900 → 0.904 and 0.380 → 0.380 in sample (`runs/X31/fit-report.txt`)."

**`docs/08`, the `test_difficulty.py` line** (beyond the brief's list: the test map's record of the file), append: "…and the duration feature's tempo (X31): quarter notes a minute from the earliest readable mark (`TestTheOpeningTempo`, seen red on the committed read: 60, 80, 60 and 132 for 120, 120, 120 and 100), and the app tempo reader's 35 shapes read through music21, agreeing with the app except on 7 named gaps (`TestTheAppsTempoShapes`)."
