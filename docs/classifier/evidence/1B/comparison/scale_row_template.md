# scale.collection and pitch.tone-row: the current detectors against existing tools (handoff step 3, second comparison), 2026-10-08

**What this is.** The bounded comparison of handoff step 3 for two characteristics, `scale.collection` (validation row 8) and `pitch.tone-row` (validation row 12), in the method of `key.md` (the pilot): expected answers chosen by a rule stated before any method was scored, every figure produced by a script in this folder, what did not run and why, one recommendation line per characteristic. Nothing is rewritten and no area page, survey or validation file was edited. Base commit `c47f18c7`. The data is the catalogue read in place from the main checkout (`app/public/content`, 2,100 entries, 2,020 with a score file). The rule pages and the validators' scripts are read-only inputs.

**Labels.** *measured*: a script in this folder produced it on the data named. *reading*: from the text of a page, a source file or general knowledge, not run. Nothing here has been heard.

**One caution about the machine.** Other jobs were running on this machine while these scripts ran (57 `python.exe` processes were counted at one moment, and one task of `row_drive.py` died with "DLL load failed ... The paging file is too small"; it was re-run, section 2). Every time below is therefore a loaded-machine time, good for the ratios between methods and not as an absolute.

## 1. What was compared

**Current detectors** (the chunk-1 validators' scripts, executed from source, not rewritten):
- `scale.collection`: `validation/t_coll.py`. Its source above the line `only = set(sys.argv[1:])` is executed unchanged (`scale_lib.py`), which gives `item_name` (the item-level name: the item's pitch-class set equals a collection of at most 7 pitch classes, with the tonic), `passage_name` (the run-level name by the local key) and `local_keys`. The tonic comes from the project's key detector (`rules/harmony.py` `analyse(sc).key`, the first version of `key.tonic-mode`), as on the page. The page's reading (a) (a pentatonic or blues run equal to its collection is named by the local tonic) is what `t_coll.py` implements. The hand level (the same function on one hand's notes) was not run separately.
- `pitch.tone-row`: `validation/t_poly_row.py`. Its source above the line `print("== built files")` is executed (`row_lib.py`) with one textual change, its output folder (`SY = OUT / "synth"` becomes this folder's `row_synth/`); this gives `ok_window`, `statements` (page rule 1: 12 consecutive notes of a line with 12 pitch classes that are not a scale figure), `rows`, `windows` (rule 4: the candidate window) and the built-file helper `piece`. Page rules 2 and 3 (the first statement is the prime; a later one is a form of it if music21's `findZeroCenteredTransformations` says so; a row is present when two statements are forms of one row) are applied in `row_scan.py` `current_detector`, which is an adapter written for this comparison (a few lines over music21; it is not the production code).

**Existing tools run** (survey sections 2 and 22.1):
- music21 10.5.0 `ConcreteScale.deriveRanked` (`music21/scale/__init__.py`), called on 13 scale classes (Major, Minor, HarmonicMinor, MelodicMinor, Dorian, Phrygian, Lydian, Mixolydian, Locrian, WholeTone, Octatonic, WeightedHexatonicBlues, Chromatic) with `resultsReturned=12` (its default of 4 would cut the twelve possible tonics) and `comparisonAttribute='pitchClass'`. A returned scale is a *full match* when its weight equals the number of pitch classes given (read from the source: `deriveAll` is the same `_net.find` call keeping only full matches, so it adds nothing). Chromatic is kept only when the set has 12 pitch classes. music21 has no pentatonic class; its `WeightedHexatonicBlues` class is the nearest thing (its `pitches` property lists five notes, the blue note being a weighted passing note, so it is labelled by class). Pitches are passed spelled as the score spells them (read with `converter.parse`; one pitch per pitch class, the most frequent spelling), because the blues class depends on the spelling; a sharps-only run is reported next to it.
- Tonal 6.5.0 (`@tonaljs/scale` 4.13.5) `Scale.detect(notes, {tonic, match: 'exact'})` through `scale_tonal.cjs` (Node v24.19.0). It gets pitch classes, so spelling does not matter.
- music21 `search.serial.TransformedSegmentMatcher` (`reps='skipConsecutive'`, `includeChords=True`) for tone rows, with the row chosen four ways (section 4).

Both library methods are given the same tonic the current detector uses (the detected key's tonic; for runs, the local key's tonic), because neither chooses it: the survey says so for both. They are also run with the reference tonic and, for Tonal, with no tonic, to show what the tonic does.

**Expected answers (fixed before scoring).** All names are in the project's vocabulary (the table in `t_coll.py`: ionian (major), dorian, ..., aeolian (natural minor), harmonic minor, melodic minor (ascending), major pentatonic, minor pentatonic, b3 pentatonic, blues scale, whole-tone, all twelve); every method's answer, whatever its own wording, is turned into a (pitch-class set, tonic) pair and named by that table (`scale_lib.lab`), so a library's answer is compared by the set and the tonic it names, not by its spelling of the name.
- *Generated items, 374* (the families whose recipe declares a collection: the validators' own list, `scale_run.py` `expected_generated`): scale: major -> ionian (108), harmonic -> harmonic minor (72), natural -> aeolian (24), melodic -> no 7-class name at item level, since up and down it has 9 pitch classes (48); octave and double scales -> ionian (25 + 8); pentatonic drills -> minor pentatonic (3) and blues scale (3); blues_scale -> blues scale (16); modal vamp -> aeolian (3); chromatic -> all twelve (16); five-finger -> no name (48; a pentachord is not a scale). The tonic is the recipe's `keySig`.
- *Real items with a key in the title, 226* (`t_keys.py` `reference()`, executed unchanged; six titles corrected there): the project's table name of the item's pitch-class set at the title's tonic if the set equals a collection of the table of at most 7 pitch classes (or all twelve), else "no name". So the expected answer for a real item is fixed by its set and its title's tonic. This tests the naming step (does a method name exactly what the set is, and refuse to name what it is not); it does not test whether a *piece* "is in" a mode, for which no truth exists in reach.
- *Real items without a title key (586) and all 812 readable real items*: no tonic, so only a set-level count (how many each method gives a name to, by the size of the set).
- *Real items that name a scale or mode*: **none.** `scale_find_real.py` read the title, id and every credit, direction, work-title, movement-title and rehearsal text of the 816 real items with a score file for `dorian ... scale(s) ... mode(s)` and the like: 0 items hit (measured). The 8 real items to which the current detector gives a mode or pentatonic name are therefore listed (the modal-items table in section 3) with readings only, not scored: *Scarborough Fair* (three scores; the traditional ballad is commonly analysed as dorian: reading, not checked against a source here), *Swing Low, Sweet Chariot* (a pentatonic spiritual: reading), the rest have no independent truth.
- *Passage level*: the 942 single-note runs of at least 6 notes that the project's `scale_runs` finds in the generated drills; every method names the same run. Expected: the declared collection (melodic minor: the ascending run melodic minor, the descending run natural minor, a reading of the standard scale). The page's real positive, `song.folk.el-condor-pasa-if-i-could.pdmx` (a minor pentatonic run), is shown separately.
- *Tone rows.* Ground truth: **the catalogue holds no twelve-tone piece** (measured: no item has two statements of one row, section 4). The items checked are every item that has 12 different pitch classes in 12 consecutive notes of a line (59 items) or that the current detector's trigger sends to the agent (23), 68 in all (the flagged-items table in section 4); the row stated from the score is "none" for each (all are tonal repertoire or chromatic-scale drills; the basis is given per item). Positives are therefore **built** from music21's table of rows from named works (`serial.historicalDict`, 71 rows): the validators' own constructions (one line P, I, R; a row split between the hands as chords) plus a repeated-note variant. Counterexamples: a chromatic scale (three times; up and down over two octaves), the circle of fifths twice, the two whole-tone scales in succession, and two real atonal scores (Schoenberg, Op. 19 Nos. 2 and 6, music21's corpus; free atonal, not twelve-tone: no row).

## 2. Tools that needed more than a call, and what did not run

**Tonal: ran, after one fix.** `npm install tonal` in `build/tonal/` (npm 11.17.0): 29 packages in 2.5 s, no error. The first call, `require('tonal')`, failed: `Error: Cannot find module '.../build/tonal/node_modules/tonal/dist/index.js'. Please verify that the package.json has a valid "main" entry` (`code: 'MODULE_NOT_FOUND'`). Cause (measured, `node` over the 29 `package.json` files): in 24 of the 29 packages `"main"` is `dist/index.js` while the published `dist/` holds only `index.cjs` and `index.mjs` (plus maps and typings), so Node cannot resolve them (a bundler that reads `"module"` would not notice; reading, not tried). Fix, applied once: in those 24 `package.json` files under `build/tonal/node_modules`, `"main"` was set to `dist/index.cjs`. After that `Scale.detect` ran on the first try; the 2,129 queries took 0.2 s in one Node process. Tonal is not in `app/package.json` (grep, measured), so using it in the app would be a new dependency.

**music21 `deriveRanked`: ran.** Two properties found while running it, both on the blues class: it names the six-note blues scale on only 8 of 16 `blues_scale` items with the score's spelling (and 10 of 16 with sharps-only spelling; section 3), and `deriveRanked` counts the pitches it is given without removing duplicates unless `removeDuplicates=True`, so one pitch per pitch class was passed.

**music21 `search.serial`: ran.** One limit measured: the search of all 71 table rows in one call costs 8 to 45 s on a built 8-bar piece, and more on real scores (section 4), which is why the table search was given a time limit on the catalogue (1,500 s per piece; tasks that exceeded it are counted, not dropped). One task died with "DLL load failed while importing _flapack: The paging file is too small" (machine memory, not the method) and was re-run (below).

**Not run, with reasons.**
- MusPy `pitch_in_scale_rate` / `scale_consistency` (survey section 2): major and minor only, and not named in the brief.
- AMADS `amads.pitch.serial` (survey 22.1): it transforms rows and does not look for them in a score (the survey's own words); not in the brief.
- `ConcreteScale.derive` / `deriveAll`: the same network call as `deriveRanked` (reading of the source); not run separately.
- Hand level for `scale.collection`: the current function is the same on a hand's notes; not run separately.
- Real twelve-tone scores: none in reach (not in the catalogue; music21's corpus holds Schoenberg Op. 19 Nos. 2 and 6 and a Webern canon, Op. 16 No. 2, all atonal and, by the dates of the works, before the twelve-tone method: reading). No download was made. Recall on real twelve-tone music therefore stays untested; the positives are built.
- A larger set of real scale passages: the catalogue gives none with an independent label.

@@FRAG_SCALE@@

@@FRAG_SCALE_TIMING@@

@@FRAG_ROW@@

@@NARRATIVE@@

## 8. Scripts and data in this folder

| file | what it does | writes |
| --- | --- | --- |
| `scale_lib.py` | executes `validation/t_coll.py` (unchanged) for the current naming functions; the project's label table | - |
| `scale_find_real.py` | scans the real items' titles and score text for scale or mode words | `scale_real_named.json` |
| `scale_run.py` | current detector and music21 `deriveRanked` on 374 generated + 816 real items and the runs of the generated drills | `scale_results.json` |
| `scale_tonal.py`, `scale_tonal.cjs` | Tonal `Scale.detect` on every set that `scale_run.py` recorded | `scale_tonal_in.json`, `scale_tonal_out.json` |
| `scale_metrics.py` | the scale.collection tables | `frag_scale.md`, `scale_metrics.json` |
| `scale_timing.py` | single-process timing of the scale methods | `scale_timing.json`, `frag_scale_timing.md` |
| `row_lib.py` | executes `validation/t_poly_row.py` (one textual change) for the current tone-row functions | - |
| `row_scan.py` | the current detector on the whole catalogue, plus the unfiltered 12-pitch-class-run flag | `row_scan.json` |
| `row_build.py` | the built positives and counterexamples, the Schoenberg Op. 19 files | `row_synth/*.musicxml`, `row_cases.json` |
| `row_music21.py`, `row_drive.py` | music21 `search.serial` with four row choices, one process per task, with time limits | `row_music21_results.json` |
| `row_metrics.py` | the tone-row tables | `frag_row.md`, `row_metrics.json` |
| `row_retry.py` | re-runs the `row_drive.py` tasks that died of memory pressure | `row_music21_results.json` |
| `row_diag.py` | which clause of the statement test rejects which rows; the catalogue's 12-note windows | `row_diag.json`, `frag_row_diag.md` |
| `row_fix.py` | the statement test with fix F, on the catalogue and the built cases | `row_fix.json`, `frag_row_fix.md` |
| `build_scale_row.py` | assembles this page from `scale_row_template.md`, the `frag_*.md` files, `narrative.md` and `narrative_rec.md` | `scale-row.md` |

To reproduce: `build/tonal` (npm install tonal, then the `main` fix of section 2); the main checkout's `.venv` (music21 10.5.0, partitura 1.9.0) with `-X utf8`, run in the order of the table from this folder.
