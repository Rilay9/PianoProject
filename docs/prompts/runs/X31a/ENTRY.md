### Entry 154 — X31a — the build's opening tempo keeps the default where a note has sounded before the file's first readable mark, and keeps the mark after rests only, as the app's rule says, decided from the parsed music21 score; the build's opening equals the app's on 2,011 of 2,012 bundled scores (2,007 after X31), Satie's *Gymnopédie no. 1* the one left, and no catalogue level moves in this build (2026-09-29)

**Judgement.** Nothing was heard and nothing was looked at on a screen. This seam changes the number the duration feature is computed at, and in this build that number moves **no** catalogue level (`level-diff.txt`: 0 of 2,092; no other field differs). What a learner meets today is unchanged. What changes is that the build's opening tempo and the app's are one definition on every bundled score but one, including the X3d opening rule the reviewer required (`responses/aa16c702.md`).

- **The corpus** (`corpus-table.txt`, in full). Of the **2,013** scores the built catalogue names with a MusicXML file, music21 cannot parse one (`song.classical.mozart-k545-i.alt`, as in X31). Of the **2,012** compared, the build's opening equals the app's (`tempoFromXml`'s opening, 100 where the app reads none) to a hundredth on **2,007** as X31 shipped it and on **2,011** after X31a. It differs on **1**: Satie's *Gymnopédie no. 1*, the dropped-sound gap the reviewer set aside (music21 drops a `<sound tempo>` from a direction holding a `<metronome>`; the build opens at 76.0002, the app at 60). No other form appears: 0 late tempos, 0 of the two new music21 forms below, 0 "other".
- **The four late-tempo files**, the build as X31 shipped it → after X31a, against the app's 100: *Bach, WTC I Prelude 2* **145 → 100**; the *Carol of the Bells* medley **152 → 100**; *Le Festin* **150 → 100**; the *Fallout 4* trailer **144 → 100**. In each, music21 has a note at offset 0 and the first readable mark at offset 108, 72, 22.5 and 133 quarter notes. X31a moved these four and nothing else (4 moved, 4 now equal, 0 equal before and not after). X3d's 179 moved openings now agree on **179** (175 after X31).
- **What a learner would meet later** (`latent-four.txt`, for information). Bach's Prelude is judged (7.1), so only the fit sees it. The other three are quarried rows, whose level is the quarry's stored one; when the quarry next measures them, the committed model reads them lower by a sixth of a stage or less (7.43 → 7.27, 7.29 → 7.16, 6.88 → 6.76). *Le Festin* is the one on a rung (chords-pop.9, band 5.3–8.4) and stays inside it. Whether 100 is the truer tempo for these pieces' difficulty is unverified as music: the app plays their opening bars at 100 until the mark, and a late mark in the file says nothing about how fast those bars were meant.

The fit, for information (`fit-report.txt`): one of the 164 judged songs has a moved duration feature (Bach's Prelude, `notesPerSecond` 17.89 → 12.34). A refit would read Spearman 0.885 and leave-one-out median error 0.410 stages both ways; the committed model, which is what is used, reads 0.904 and 0.380 in sample both ways. No refit.

**The hypothesis, tested — held.** The brief's: the four late-tempo mismatches exist because `opening_quarter_bpm()` takes the earliest readable mark wherever it stands, and music21's parsed score already says whether a note began before it. The unit test that could refute it was the red run: a note in bar 1 before bar 2's mark read **72** for 100 on X31's code, as did a lower-staff note before the upper staff's beat-2 mark (`red-unit-committed.txt`). The corpus could have refuted it too: had music21 placed the four marks or their first notes otherwise than the app, they would still differ, or other files would have moved. It did not: the four agree and no other file moved. **The change acts on the mechanism:** after the earliest readable mark is found, the parsed score is asked whether a note in any part begins strictly before it. If one does, the opening is `DEFAULT_BPM`. Six mutants, one per rule, are each killed (`mutants.txt`).

**Premises checked, and two corrected.**
- **Grace notes count as sounding, against the brief's sentence.** The brief says grace notes "are not sounding notes for this purpose", then asks for "the reading the app's rule implies". The app's code counts them: in `tempoFromXml.ts` `rawEvents`, any `<note>` that is not a chord's later note, a `<rest>` or a `<cue/>` sets `firstSound`; a `<grace>` only skips the position's advance. So the build counts them too (`test_a_grace_note_before_the_mark_has_sounded`). music21 gives a grace note no duration, at the offset of what follows it (`what-music21-gives.txt`), the app's placing. On the corpus the choice decides **0** scores (`corpus-table.txt`: no file has a grace note alone before its first mark).
- **The shape gaps are 6, not "five or fewer".** Three closed: *a mark only in bar 2*, *a tempo after the first note of bar 1*, *an upbeat before bar 1's tempo*. Two opened, both information music21's reader does not keep (`what-music21-gives.txt`), the class the reviewer said stays named:
  - *a mark on bar 2 after a cue note and rests*: music21 reads `<cue/>` (a note not played) as an ordinary note, so a note sounds before the mark and the build opens at 100 where the app opens at 72;
  - *a visual offset*: music21 moves a direction by its `<offset>` whether or not it says `sound="yes"`, so the mark stands after two notes and the build opens at 100 where the app reads the mark where it stands (60).

  Both agreed before only because X31 took the earliest mark anywhere. Neither occurs on the bundled scores (0 rows of that form). Closing them would take reading the XML, which the brief and the reviewer refuse.
- **The fixture** regenerated byte-identical (`export-levelling-fixture.txt`): no fixture score has a note before its first mark. So `app/tests/fixtures/**` is unchanged and the map names no browser spec.
- **"`opening_quarter_bpm` only"**: the change is inside that function (the loop is inline, no new helper); `features()` and `_quarter_bpm` are untouched.

## Done

1. **The rule, from the parsed score** — `tools/content/difficulty.py`, `opening_quarter_bpm`: the earliest readable mark is found as in X31. When its offset is after the score's start, every element of `sounding(score.recurse().notes)` (a note or chord in any part, a grace note included, never a rest or a chord symbol) is asked for its `getOffsetInHierarchy(score)`. If one begins more than a millionth of a quarter note before the mark (the app rounds places to a millionth), the opening is `DEFAULT_BPM`. A mark at the start opens the piece without the check. No XML is read. The docstring states the rule and the gaps.
2. **Red first, unit** — `TestTheOpeningTempo` gains (a) rests then bar 2's mark → 72; (b) a note in bar 1 then bar 2's mark → 100; (c) the mark at bar 1's start over its note → 72; (d) the lower staff's note before the upper staff's beat-2 mark → 100. Two more pin the "sounding" reading: a chord symbol over the rests → 72, and a grace note before the rest → 100. They are built with a `_written` helper in the file's pattern. The shapes table gains the two XML cases: *a mark after the first note of bar 1* (the app test's `afterANote`, 100) and *a bar of rest, then a mark in bar 2* (72). All 37 app numbers were read back through the app's own reader (`shapes-app.txt`: 37 of 37 equal). The gaps are 7 → 6, named above; `_GAPS` and the notes say which and why.
3. **The corpus and the fixture regenerated** — `corpus-bpm.jsonl` (music21, per score: X31's reading, X31a's, the first mark's offset, the first sound's, the first non-grace sound's), `corpus-app.jsonl` (the app's reader on the same built files), `corpus-table.txt`. `app/tests/fixtures/levelling.json` regenerated, byte-identical; `npx vitest run tests/unit/difficulty.test.ts` green, 54 of 54. Both builds offline with absolute `--out`s (before: `build/x31a-before/content`; after: `app/public/content`), `level-diff.txt`: 0 moved. The fit report is for information only; `level-model.json` is untouched.
4. **Not X31a's, untouched:** the Satie gap (named, 1 score), the model, `app/src/**`, the quarry's placements, `build.py`, the importers, `validate.py`.

*Technical:* 6 new unit cases (3 red first; the other 3 guard against over-correction and were green on X31's code by design), 2 shapes added and 5 re-stated, 6 mutants killed, both builds and the validators green, the content suite and the unit suite as in the table. *Pedagogical:* the duration feature is now computed at the tempo the app opens at on 2,011 of 2,012 scores. No level a learner sees moves in this build. The three quarried late-tempo rows would read a little easier at the next quarry, which is what the app already measures for them on import. **Unverified as music:** nothing was heard, and whether 100 or the late mark better represents those pieces' difficulty is not decided here.

## Not done

- **The two new shape gaps and Satie's**: not closed. Each needs information music21 discards, and a second XML reader is refused (the brief; `responses/aa16c702.md`). None but Satie's occurs on the bundled scores.
- **The quarried rows' levels** are not re-estimated (the quarry's, not this seam's; `latent-four.txt` counts the three).
- **`docs/03`, `docs/08` not edited**: the rows are under *Doc rows*, written against X31's rows, which have not landed in those files. CI has not run this tree.
- **Browser specs**: none named by the map for this change (the fixture is byte-identical); none run.

## Follow-ups

1. **P3 (music21's reader, two more forms).** A `<cue/>` note is read as a played note, and a direction's non-sounding `<offset>` moves it. Either can put a note before a file's first mark that the app does not count, and the build then opens at 100 where the app opens at the mark. 0 bundled scores today; an imported or quarried file could add one. It stays named in `_GAPS` beside Satie's form, for the same later wave (a shared normalised tempo fact from the ingestion boundary, the reviewer's condition).
2. **Closed:** X31's Follow-up 4 (the late-tempo four) and the reviewer's blocking change.
3. **Carried, not X31a's:** X31's Follow-ups 1 (the quarried levels lag the feature; now three more rows, each under a fifth of a stage), 2, 3 and 5.

## Questions

None. The grace-note reading was the brief's to choose from the app's rule, and it decides no bundled score.

## Files

In this worktree; nothing committed, staged or stashed.

- **Changed:** `tools/content/difficulty.py` (`opening_quarter_bpm`: the check and its docstring); `tools/content/tests/test_difficulty.py` (`_written`, `_BAR`, six cases, the class and module notes, the shapes table, `_GAPS`).
- **Regenerated, unchanged:** `app/tests/fixtures/levelling.json` (byte-identical).
- **Not changed:** `content/sources/level-model.json`, `app/src/**`, `build.py`, `import_*.py`, `validate.py`, `untaught_options.py`, `deploy_guard.py`, `docs/03`, `docs/08`.
- **Build side effects, restored** (`restore.txt`): the builds rewrote `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md` (line endings only) and `content/scores/imported/SOURCES.md` (10 lines). All three were copied back from the snapshot taken before the first build (with `docs/generated/ladder.md`, not rewritten); `git status` shows none of them.
- **Copied read-only from the main checkout** (`setup-copy.txt`, robocopy 1 = copied): `build/cache`, `build/midi-real`, the four `build/*-cache.json`, `content/scores/imported/{kern,musetrainer,mutopia}` without `.git`, as X31 did.
- **The brief**, copied from the main checkout: `docs/prompts/tasks/X31a-late-tempo-keeps-the-default-opening.md`.
- **Beside this entry** (`docs/prompts/runs/X31a/`): every capture named here; the scripts `scripts-setup.ps1`, `scripts-run-build.ps1`, `scripts-run-corpus-bpm.ps1`, `scripts-chain.ps1`, `scripts-what-music21-gives.py`, `scripts-mutants.py`, `scripts-corpus-bpm.py`, `scripts-corpus-app.test.ts` and `scripts-shapes-app.test.ts` (both run from `app/tests/unit/` under an `x31a` name, then removed), `scripts-shapes-dump.py`, `scripts-corpus-table.py`, `scripts-level-diff.py`, `scripts-fit-report.py`, `scripts-latent-four.py`, `scripts-restore.py` (run from `build/x31a-tmp/`); the data `corpus-bpm.jsonl`, `corpus-app.jsonl`.

## The red lines

- `red-unit-committed.txt`: the new cases against the unchanged (X31) `difficulty.py`, exit 1, **5 of 23 red**:
  - (b) `AssertionError: 72.0 != 100.0` (a note in bar 1, the mark in bar 2);
  - (d) `72.0 != 100.0` (the lower staff's beat 1 before the upper staff's beat-2 mark);
  - the grace case `72.0 != 100.0`;
  - the shape table: *a mark only in bar 2* 132, *a tempo after the first note of bar 1* 90, *an upbeat before bar 1's tempo* 90, *a mark after the first note of bar 1* 90, the cue shape 72 and the visual offset 60, where 100 is now stated;
  - the gap list: 8 shapes differ from the app where 6 are named.

  Green there by design: (a), (c) and the chord symbol (X31 also took the mark there; they catch an over-correction, see the mutants), and the 15 older cases.
- `mutants.txt` (each on a copy; the tree's file untouched), 6 of 6 killed:
  - *no-sound-check* (X31's reading): 5 red;
  - *rests-count*: 4 red, (a) and the chord symbol among them;
  - *chord-symbols-count*: 1 red;
  - *first-staff-only*: 1 red, (d);
  - *not-strict* (a note at the mark's place counted as before it): 4 red;
  - *graces-left-out*: 1 red.

## Tests

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `test_difficulty.py` › `TestTheOpeningTempo`, 6 new | add | the earliest readable mark opens the piece wherever it stands | it opens only after rests; a note in any staff before it (a grace note included, a chord symbol not) leaves the default 100 |
| `test_difficulty.py` › `TestTheAppsTempoShapes` (2) | replace (the table's values) | 3 late-tempo shapes named as gaps; the cue and visual-offset shapes agreeing | the 3 agree; 2 shapes added, both agreeing; the cue and visual-offset shapes named as music21 gaps; 6 gaps of 37 |
| `test_difficulty.py`, the 15 older cases | preserve | — | green, unedited |
| `difficulty.test.ts` on the regenerated fixture | preserve | — | green, 54; fixture byte-identical |

## Exit codes (the last line of each capture)

| Run | Exit |
| --- | --- |
| setup copies (`setup-copy.txt`) · `parity_reference.py` (`parity-reference.txt`) | robocopy 1 each (copied) · 0 |
| `npm ci` (`npm-ci.txt`) · again (`npm-ci-2.txt`) | 1, the disk full (`ENOSPC`, other sessions' load; nothing of this seam's) · **0** once space was free |
| what music21 gives (`what-music21-gives.txt`) | 0 |
| red (`red-unit-committed.txt`) · mutants (`mutants.txt`: 6 of 6 killed) | 1, as intended · 0 |
| content build before, offline, absolute out (`build-before.txt`, `.exit`) | **0** (2,092 items, validation OK) |
| `test_difficulty` (`green-unit-difficulty.txt`, 23) · `test_difficulty` + `test_levels` (`unit-difficulty-levels.txt`, 55) | **0** · **0** |
| `export_levelling_fixture.py` (`export-levelling-fixture.txt`, 43 scores, byte-identical) · `npx vitest run tests/unit/difficulty.test.ts` (`vitest-difficulty.txt`, 54) | **0** · **0** |
| content build after, offline, absolute out = the default place (`build-after.txt`, `.exit`) | **0** (2,092 items, validation OK) |
| `level-diff.txt` (0 moved) · `corpus-bpm-run.txt` (`.exit`) · `corpus-app-run.txt` · `shapes-app-run.txt` (37 of 37) · `corpus-table.txt` · `latent-four.txt` · `fit-report.txt` | 0 each |
| `validate.py --allow-nc --personal` (`validate-after.txt`) · `validate.py` (`validate-plain.txt`) · `review.py --check` (`review-check.txt`) | **0** · **0** · **0** |
| the content suite, `unittest discover -s tools/content/tests -t tools/content` (`content-suite.txt`; the count in `content-suite.stderr.txt`, 1,458) | **0** (OK, 4 skipped) |
| the unit suite, `npx vitest run` (`vitest-all.txt`, `.stderr.txt`) | 1: 308 of 312 files pass; 5 of 7,196 cases fail (7,185 pass, 5 skipped, 1 todo). Two are the recorded line-ending pair in `lessonClaimsAboutApp` (blues.3, 4.7; Entry 101), the same two alone (`vitest-lessonClaims-alone.txt`, 1). Three are load: `expectedNote`'s "every black key" and `unmeasuredConceptsSaySo`'s Skills screen at their 5-second timeouts, and `simonTurnCue`'s "does not take a key pressed while the app is still playing" (`'correct'` for `''`, a timing assertion). The three files alone: 21 of 21 (`vitest-rerun-alone.txt`, **0**). No unit file reads what X31a changed (Python only; the fixture is byte-identical). |
| `npm run build:app` (`build-app.txt`) | **0** |
| after the last edit (a comment in `difficulty.py`, the module note's wrap in the test): `test_difficulty` + `test_levels` (`unit-difficulty-levels-final.txt`, 55) | **0** |
| `python tools/docs/checks_for_paths.py` on every changed path (`checks-for-paths.txt`) | 0: every path matched |

**What the map names** (`checks-for-paths.txt`): the content build, validate, the review check, the content suite, the unit suite and the app build. All run (the content build is the after build, whose absolute `--out` is the default place). No browser spec is named: `app/tests/fixtures/levelling.json` regenerated byte-identical, so it is not a changed path.

**Unverified, beside what passes.**

- Nothing was heard. Whether a late-tempo piece's difficulty is better measured at 100 or at its late mark is unverified as music.
- The two new shape gaps are music21's reading of the app test's XML (`what-music21-gives.txt`); that no bundled file has either form rests on the corpus table (0 rows where music21 has a note before the mark and the app opens at a tempo), not on a search of the XML.
- CI has not run this tree.

## Doc rows

X31's rows (Entry 144) have not landed in `docs/03` or `docs/08`. These are written to replace or extend them, so one text lands.

**`docs/03` §3, *The rest of `tools/content/`*, the `difficulty.py` bullet**, X31's sub-item as it should land (its opening list and its last two sentences change):

- "**The duration feature's tempo** (X31, Entry 144; X31a, Entry 154). `notesPerSecond` is computed at `opening_quarter_bpm(score)`:
  - the readable `MetronomeMark` at the earliest offset (`getOffsetInHierarchy`; a tie goes to the first part), in quarter notes a minute through music21's `getQuarterBPM()`: the `<sound tempo>` music21 kept, else the number times the beat unit's length, dots included;
  - that mark opens the piece only where nothing has sounded before it: if a note or chord in any part (a grace note included; a rest or a chord symbol not) begins before it, the opening is 100 and the mark is a later change. This is the app's opening rule (X3d), decided from the parsed score;
  - a number music21 took from a tempo word, and a mark with no number it can read, are not tempos;
  - 100 where none is readable.

  It had read the first mark `recurse()` met and its raw `number`. That took a half note = 60 as 60, walked a staff whole before the next, gave "Allegro" music21's 132, and read every sound-only tempo as 100 (`.number` is `None` there). Until X31a it also took a mark written after notes had sounded as the opening. This is the app's definition (`app/src/score/tempoFromXml.ts`, X3d), read through music21 and not copied. The gaps are named in `test_difficulty.py`'s `TestTheAppsTempoShapes`, each information music21's reader does not keep:
  - a mark and a sound that disagree: music21 drops a `<sound tempo>` in a direction holding a `<metronome>`;
  - two tempos at one place: the first in the file;
  - "c. 108": no number;
  - a `<cue/>` note, which music21 reads as played, and a direction's non-sounding `<offset>`, which music21 applies: either can put a note before a mark the app opens with.

  On the bundled scores the build's opening equals the app's on 2,011 of 2,012 (2,007 after X31, 1,833 before); Satie's *Gymnopédie no. 1* differs."

**`docs/03` §3, the `fit_level_model.py` bullet**, after X31's appended sentence: "Nor for X31a (Entry 154): one judged song's duration feature moves (Bach's WTC I Prelude 2), and a refit and the committed model read the same as after X31 to three places (`runs/X31a/fit-report.txt`)."

**`docs/03` §3, the `export_levelling_fixture.py` bullet**, after X31's appended sentence: "Regenerated after X31a: byte-identical (no fixture score has a note before its first mark)."

**`docs/08`, the `test_difficulty.py` line**, X31's appended clause as it should land: "…and the duration feature's tempo (X31, X31a): quarter notes a minute from the earliest readable mark, which opens the piece only after rests (`TestTheOpeningTempo`; seen red on the committed read at 60, 80, 60 and 132 for 120, 120, 120 and 100, and on X31's read at 72 for 100 three times: a note in bar 1, a note in the other staff, a grace note), and the app tempo reader's 37 shapes read through music21, agreeing with the app except on 6 named gaps (`TestTheAppsTempoShapes`)."
