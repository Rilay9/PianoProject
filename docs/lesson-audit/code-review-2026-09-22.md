# Code review — `e2c6299..HEAD`, 2026-09-22

Read-only correctness pass over `app/src`, `tools/content/build.py`,
`tools/content/score_checks.py`, `tools/content/validate.py` and `tools/midi-cleanup`
(23 files in that range, 2,973 added lines), against `docs/pending-review.md` Entries
23, 24 and 35 and `docs/prompts/working-rules.md`. Nothing was built, and no test suite
was run, per the brief. Correctness only; layout, wording and naming are not reported.

`<file>:<line> | what the code does | what it should do, with the evidence | severity`

## Findings

app/src/engine/PracticeEngine.ts:570 | pushes every CC64 value into `pedalValues` with no `running`/`paused`/`finished` guard — note events get one at line 589 — and `resetRunTotals` (line 1195) clears `recorded` but not `pedalValues` | the list is a run total: it goes into `buildScore` at line 1272 beside `notes`, and the Score screen prints it as "N% of M pedal messages were between 32 and 96" (`Scoring.ts:563-571`). It should be gated and cleared exactly as `recorded` is, or a pedal moved while the run is paused is counted in that denominator. The reset half is unreachable in the app today — `new PracticeEngine` immediately precedes both `engine.start()` calls (`ScoreSession.ts:429-434`, `DevScoreScreen.ts:536-549`), so only the pause window reaches the screen | MEDIUM

tools/content/build.py:142 | `step_score_checks(out_dir)` never uses `out_dir`; it runs `score_checks.py --gate --no-analysis --quiet`, and that script reads `ROOT / "app" / "public" / "content" / "catalog.json"` (`score_checks.py:61`) and takes no `--dir` or `--catalog` option | every other step is handed the directory this build wrote — `--out str(out_dir)` at `build.py:101`, `112`, `131`, `174`, and `step_validate(args.out, …)` at `793` and `797`. `--out DIR` is documented usage (`build.py:36`) and `build/p19-personal/` and `build/p19-strict/` exist on disk, so such a run gates the high rows of a catalog other than the one `merge_catalog(out_dir)` just wrote, one step earlier | MEDIUM

tools/content/validate.py:1095 | the widened `item` rule accepts any id in the rung's `songOptions` **or** `exerciseOptions` for every kind but `simon`, so `{"kind": "ladder", "item": …}` now passes validation | `LessonScreen.ts:532-551` ignores `tool.item` for `ladder` entirely and opens the rung's first exercise that `targetFor` calls `'score'`. `app/src/curriculum/types.ts:214-218` states "an `item` written on one would fail validation rather than be honoured", and `content/curriculum.schema.json`'s `item` description states "an item written on one is refused by the song-option rule". That refusal was what this hunk removed; the check needs `kind == "ladder"` to reject `item` outright, or both claims are false. The seven authored `ladder` tools were opened one at a time rather than counted from a grep, and every one is exactly `{"kind": "ladder"}` — `stage-4.json` rungs `4.1`, `4.2`, `4.3`, `4.4` and `technique.4`, `stage-6.json` `technique.6`, `stage-7.json` `technique.7` — so none carries an `item` and nothing is wrong on screen today | MEDIUM

tools/midi-cleanup/tests/test_converter.py:414 | `test_no_note_is_invented_between_the_file_and_the_score` compares `sum(len(t["events"]) for t in read_midi(f)["tracks"])` with `convert(...)["notes_in"]`, and `notes_in` is `sum(expected_pitches(parts).values())` (`midi_to_musicxml.py:1083`) — the quantiser's own events, themselves built by the same `read_midi` | both sides of the assertion come from `read_midi`, so the test cannot see a note lost between the file and `read_midi` (its `events = [e for e in events if e.end > e.start]` filter at `midi_to_musicxml.py:310` drops a Note-On and Note-Off at the same tick), nor one lost in the file on disk — that is what `lost`/`added` compare, and they are asserted in the sibling tests, not here. The docstring ("The score holds exactly as many struck notes as the file holds Note-Ons") and Entry 35's "asserts the equality on all three files" both describe the file-to-score comparison this test does not make. The CLI states the same proxy at `midi_to_musicxml.py:1174` ("checked: all N notes kept") | MEDIUM

tools/content/build.py:262 | `settle_key_signatures`'s docstring says its rule is "`key_name` in `tools/content/notation.py` written once more" | `key_name` (`notation.py:138-160`) differs on two of the three branches: it believes `mode == "major"` (`if first.get("mode") == "major": return major`), which this function deliberately does not, and where the final bass matches neither the tonic nor its relative it still names a mode (`return major + "?"`) where this function names none (`_signature_words`). The code reads right and the comment does not; working rules §2.17 | LOW

app/src/engine/Scoring.ts:569 | the half-pedal measure is `met` only when `share >= minShare`, and `minShare` defaults to `DEFAULT_MASTERY.passAccuracy` = `0.9` (`Scoring.ts:155`, `460`): nine of every ten CC64 messages must land inside `ccRange`, and every message with the pedal fully up (0) counts against it | it is the arithmetic `PedalDrill` already applied (`special.ts:343-349`) so it is not a regression, and nothing binds on it — `demandsTechniqueMeasure` reads `mastery.custom` and Entry 24 item 2 records that no rung states one. But the sheet's `met` flag for the four `exercise.pedal.half-pedal.*` rows (all four carry `ccRange: [32, 96]`, read from `app/public/content/catalog.json`) will read false for a run a teacher would pass. Units are right: `share` and `minShare` are both fractions | LOW

app/src/ui/screens/LabScreen.ts:826 | `stopJam` clears `passNotes` but leaves `bedVerdict.textContent` and `bedBars` standing | `redraw()` stops a running jam whenever a picker moves (`LabScreen.ts:1046-1055`), so "Time round 3 - 6 of 9 in the blues scale" survives the settings change that invalidated it, over a chart that has been redrawn. `tradeLine` is hidden on the very next line for that reason | LOW

## What was checked and found sound

Recorded so the absence means something, each with the search that produced it.

- **Units and pitch classes.** `_key_words`/`major_pc` in `build.py` (`(7 * fifths) % 12`, relative `+ 9`) spell every one of the fifteen signatures correctly in both modes, checked by hand against both tables; `finalBass` is written as `final_bass % 12` (`notation.py:125`), so the comparison is pitch class against pitch class. `accentScore` compares a velocity ratio, not a MIDI number. `detect_swing` compares a position normalised to its beat against `SWING_HALF_WINDOW`, so the window is a fraction of a beat on both sides. `labRightHandBars`'s `beatsPerBar * DIVISIONS` equals `buildLabExercise`'s `(beats * DIVISIONS * 4) / beatType` at the 4/4 the lab always passes.
- **The same tune twice.** `melodySeed()` hashes `lab:${slug()}`, which is the string the old inline seed hashed, and both `buildLabExercise` (`LabScreen.ts:309`) and `labRightHandBars` (`LabScreen.ts:715`) are given it; `labMelodyBars` is the first consumer of the rng in `buildLabExercise`, so the sequences match. The docstring's claim holds.
- **Consumers of changed fields.** `keySig`, grepped without a `head` limit after a truncated first pass nearly hid `render_check.py`: `app/src` has 18 hits, of which `LibraryScreen.ts:628` is the only read of `CatalogItem.keySig` — `types.ts:75` declares it, and `difficulty.ts:115-122`/`:255`, `score/types.ts:139`/`:235`/`:245`, `extractScoreModel.ts:137`/`:167`/`:383` and `DevScoreScreen.ts:107`/`:825` are all `ScoreModel.keySig`, a different field. `tools/` has 12 files naming it, enumerated: `author.py`, `generate_exercises.py`, `import_kern.py` and `import_musetrainer.py` write it in steps that run *before* `merge_catalog`; `render_check.py:325` writes it after, and only `if entry.get("keySig") is None`, as the docstring says; `score_checks.py` reads it; the other five are tests. So nothing downstream can undo `settle_key_signatures`. `startAt`: `TodayScreen.ts:559` and `:584`, `SkillsScreen.ts:349`, `PlanScreen.ts:279` and `:753` now all pass the placement, so the screens agree. `CompPattern` is exactly `LabLeftHand` (`sightReading.ts:1227`), so `compPattern()` cannot pass a pattern `compEvents` has no case for.
- **`LAB_PRESET_LOCKS` against `LAB_PRESETS`.** All six compared one at a time: `primary-chords` and `pop-four-chord` `{progression, leftHand}`, `ballad` `{progression, leftHand, rightHand}`, `blues-shuffle` `{progression, leftHand, bars}`, `jazz-comping` `{progression, leftHand}`, `minor-vamp` `{key, progression, leftHand}`. The two copies agree.
- **The screen-change state Entries 28, 29 and 30 name.** `ladderOn`, `bed`, `trading`, `passNotes` and `answerNotes` are all `let`s inside the screen factory closure, so a remount starts them fresh; `clearLoop` (`ScoreScreen.ts:1740-1748`) still switches the ladder off, and `applyRouteLadder` takes no exception from it. `applyRouteLadder` fails closed before `mode` is touched on all three of its refusals.
- **The Wait-mode sight-read fix.** `render()` assigns `modeSelect.value = mode` at `ScoreScreen.ts:2526`, which is what the removed second assignment was doing, so the comment's "there is no second assignment to keep in step any more" is true.
- **Half pedal can fire.** Four catalog rows carry `drill.kind == "half-pedal"` with `ccRange: [32, 96]`, matching `DEFAULT_HALF_PEDAL_RANGE`.
- **The accents row can draw.** `ScoreSession.stop()` nulls `this.engine` and `get prepared()` reads through it, but `onFinished` fires from the event handler at `ScoreSession.ts:737` with the engine still set, and `showSummary` is called only from there (`ScoreScreen.ts:2852`), so `session?.prepared?.steps` is populated when `accentScore` runs.
- **`setDuetPlayback`.** `updateSettings` is synchronous (`settingsStore.ts:257`) and `'non-focused'` is one of the three accepted values (`settingsStore.ts:224`), so the write lands before `navigateScore`.
- **`repeat_faults`.** `seen_numbers` as `(min, max)` with `previous = high` reads `1,2` then `3` as in order, and the inner comprehension's `low, high` are comprehension-scoped in Python 3, so the outer loop variables are not clobbered.
- **`spell_in_key`.** Both `SPELLING` rows were checked degree by degree against the comment above them, and the octave correction handles the B-sharp case the comment names.
- **`deadEnd`.** `body.insertBefore(status, controls)` (`ChordChartScreen.ts:327`) still lifts the status line above the controls under the new `form, controls, grid, status` order.

## Unverified

Nothing here was executed: no build, no `vitest`, no Playwright, no Python. Every claim is
about what the code says it does. In particular the `keySig` values quoted from
`app/public/content/catalog.json` were read off the built file as it stands, which is a
proxy for what `settle_key_signatures` would write on the next run, not a re-run of it.
No spec file was opened — the `04` §3c/§3d, `05` §6 and `00` §1a references in these
findings are the code's own citations, repeated, not checked against the documents.
Nothing about music has been heard or looked at as engraving.

## Files

**Read in full (every diff hunk plus the code around it):** `app/src/engine/Scoring.ts`,
`PracticeEngine.ts`, `prepareSession.ts`, `types.ts`, `drills/special.ts`,
`sightReading.ts`; `app/src/audio/backingLoop.ts`; `app/src/router.ts`;
`app/src/curriculum/types.ts`; `app/src/score/extractScoreModel.ts`, `types.ts`,
`OsmdView.ts`; `app/src/ui/screens/ScoreScreen.ts`, `LabScreen.ts`, `LessonScreen.ts`,
`ChordChartScreen.ts`, `TodayScreen.ts`; `tools/content/validate.py`,
`tools/content/build.py`, `tools/content/score_checks.py`;
`tools/midi-cleanup/midi_to_musicxml.py` (lines 75–1179).

**Skimmed or read in part:** `tools/midi-cleanup/tests/test_converter.py` — the
method-name outline for all of it, lines 331–456 in full, lines 1–330 not read;
`docs/pending-review.md` Entries 23, 24 and 35 Part A; `content/curriculum.schema.json`
(the `tools` item only); `tools/content/notation.py` (`key_name`);
`tools/content/render_check.py` (one grep); `app/src/score/ScoreSession.ts`,
`app/src/data/settingsStore.ts`, `app/src/ui/screens/LibraryScreen.ts` (the single
consumer lines).

**Not read:** `app/src/ui/screens/LabScreen.css` (38 lines, style only);
`docs/pending-review.md` Entries 25–34 and 36–41; `docs/04-ui-spec.md`,
`docs/05-score-follow-engine.md`, `docs/00-invariants.md` §1a; every file under
`app/tests/` — no unit spec and no e2e spec was opened, so none of the eight new test
files named in Entries 24 and 35 was reviewed except the converter's.
