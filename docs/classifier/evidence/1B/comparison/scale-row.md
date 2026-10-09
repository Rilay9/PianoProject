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

## 3. scale.collection results

The tables below are written by `scale_metrics.py` (per-item data in `scale_results.json`, `scale_tonal_out.json`). Method names: *tonic: detected key* = the tonic the project's key detector found; *tonic: reference* = the recipe's or the title's tonic; *as returned* = every full match `deriveRanked` gave; *+ equality check* = only the matches whose scale has exactly the item's pitch classes (the project's rule, which music21 does not apply); *names of 8 to 11 pitch classes dropped* = Tonal's exact matches with the project's size rule applied.

**Generated items (374, expected answer from the recipe): right answers per family.** A right answer is `exact` (the method names exactly the expected collection and tonic and nothing else) or, where the recipe declares no 7-class collection (melodic minor, up and down: 9 pitch classes; five-finger: 5), `correct_none` (the method names nothing). Columns are the methods; the last row is all 374.

| family | items | current detector (tonic: its own key) | current detector (tonic: reference) | music21 deriveRanked, as returned (tonic: detected key) | music21 deriveRanked + equality check (tonic: detected key) | music21 deriveRanked + equality check (tonic: reference) | music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key) | Tonal Scale.detect exact (tonic: detected key) | Tonal Scale.detect exact (tonic: reference) | Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key) | Tonal Scale.detect exact (no tonic given) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| blues_scale | 16 | 16/16 | 16/16 | 8/16 | 8/16 | 8/16 | 10/16 | 16/16 | 16/16 | 16/16 | 0/16 |
| octave_scale | 25 | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 | 0/25 |
| chromatic | 16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 |
| double_scale | 8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 0/8 |
| five_finger | 48 | 48/48 | 48/48 | 0/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 |
| modal_vamp | 3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 0/3 |
| pentatonic drill: blues | 3 | 3/3 | 3/3 | 1/3 | 1/3 | 1/3 | 3/3 | 3/3 | 3/3 | 3/3 | 0/3 |
| pentatonic drill: minor pentatonic | 3 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 3/3 | 3/3 | 3/3 | 0/3 |
| scale: major | 108 | 108/108 | 108/108 | 108/108 | 108/108 | 108/108 | 108/108 | 108/108 | 108/108 | 108/108 | 0/108 |
| scale: harmonic minor | 72 | 72/72 | 72/72 | 72/72 | 72/72 | 72/72 | 72/72 | 72/72 | 72/72 | 72/72 | 0/72 |
| scale: melodic minor | 48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 0/48 |
| scale: natural minor | 24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 0/24 |
| **all** | 374 | 374/374 (100.0%) | 374/374 (100.0%) | 313/374 (83.7%) | 361/374 (96.5%) | 361/374 (96.5%) | 365/374 (97.6%) | 374/374 (100.0%) | 374/374 (100.0%) | 374/374 (100.0%) | 64/374 (17.1%) |

**Generated items, all categories (counts out of 374).**

| method | exact | right among several | wrong | missed (no name) | correct: no name | false name |
| --- | --- | --- | --- | --- | --- | --- |
| current detector (tonic: its own key) | 278 | 0 | 0 | 0 | 96 | 0 |
| current detector (tonic: reference) | 278 | 0 | 0 | 0 | 96 | 0 |
| music21 deriveRanked, as returned (tonic: detected key) | 265 | 0 | 3 | 10 | 48 | 48 |
| music21 deriveRanked + equality check (tonic: detected key) | 265 | 0 | 0 | 13 | 96 | 0 |
| music21 deriveRanked + equality check (tonic: reference) | 265 | 0 | 0 | 13 | 96 | 0 |
| music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key) | 269 | 0 | 0 | 9 | 96 | 0 |
| Tonal Scale.detect exact (tonic: detected key) | 278 | 0 | 0 | 0 | 96 | 0 |
| Tonal Scale.detect exact (tonic: reference) | 278 | 0 | 0 | 0 | 96 | 0 |
| Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key) | 278 | 0 | 0 | 0 | 96 | 0 |
| Tonal Scale.detect exact (no tonic given) | 16 | 262 | 0 | 0 | 48 | 48 |

**Generated items: confusion pairs (expected label -> what the method named; only the answers that were not exact).** `wrong` names another collection or tonic, `false_name` names a collection where none is expected, `missed` names nothing, `right_among_several` includes the expected name among others.

- current detector (tonic: its own key): none.
- current detector (tonic: reference): none.
- music21 deriveRanked, as returned (tonic: detected key): none -> ionian (major) / mixolydian [false_name] x36; none -> aeolian (natural minor) / dorian / harmonic minor / melodic minor (ascending) [false_name] x12; blues scale -> (nothing) [missed] x10; minor pentatonic -> aeolian (natural minor) / blues scale / dorian / phrygian [wrong] x3
- music21 deriveRanked + equality check (tonic: detected key): blues scale -> (nothing) [missed] x10; minor pentatonic -> (nothing) [missed] x3
- music21 deriveRanked + equality check (tonic: reference): blues scale -> (nothing) [missed] x10; minor pentatonic -> (nothing) [missed] x3
- music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key): blues scale -> (nothing) [missed] x6; minor pentatonic -> (nothing) [missed] x3
- Tonal Scale.detect exact (tonic: detected key): none.
- Tonal Scale.detect exact (tonic: reference): none.
- Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key): none.
- Tonal Scale.detect exact (no tonic given): ionian (major) -> aeolian (natural minor) / dorian / ionian (major) / locrian / lydian / mixolydian / phrygian [right_among_several] x141; harmonic minor -> Phrygian dominant / harmonic minor / harmonic minor set (tonic not its own) [right_among_several] x72; none -> other (composite blues) [false_name] x48; aeolian (natural minor) -> aeolian (natural minor) / dorian / ionian (major) / locrian / lydian / mixolydian / phrygian [right_among_several] x27; blues scale -> blues scale / blues scale set (tonic not its own) [right_among_several] x19; minor pentatonic -> major pentatonic / minor pentatonic / pentatonic set (tonic not its own) [right_among_several] x3

**Real items with a key in the title (226; 149 whose pitch-class set equals a table collection at the title's tonic, 77 whose set does not).** Expected: the project's table name of the item's pitch-class set at the title's tonic, or no name when the set equals no collection of at most 7 pitch classes. Tonic given to the library methods and used by the current detector: the key the project's detector found (`H.analyse`).

| method | set names a collection: exact | right among several | wrong | missed | set equals no collection: correct (no name) | false name |
| --- | --- | --- | --- | --- | --- | --- |
| current detector (tonic: its own key) | 149/149 | 0 | 0 | 0 | 77/77 | 0 |
| music21 deriveRanked, as returned (tonic: detected key) | 149/149 | 0 | 0 | 0 | 75/77 | 2 |
| music21 deriveRanked + equality check (tonic: detected key) | 149/149 | 0 | 0 | 0 | 77/77 | 0 |
| music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key) | 149/149 | 0 | 0 | 0 | 77/77 | 0 |
| Tonal Scale.detect exact (tonic: detected key) | 149/149 | 0 | 0 | 0 | 69/77 | 8 |
| Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key) | 149/149 | 0 | 0 | 0 | 77/77 | 0 |
| Tonal Scale.detect exact (no tonic given) | 145/149 | 4 | 0 | 0 | 62/77 | 15 |

**Real items with a title key: what the wrong and false answers were (expected -> named).**

- current detector (tonic: its own key): none
- music21 deriveRanked, as returned (tonic: detected key): none -> ionian (major) / mixolydian [false_name] x2
- music21 deriveRanked + equality check (tonic: detected key): none
- music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key): none
- Tonal Scale.detect exact (tonic: detected key): none -> other (ichikosucho) [false_name] x6; none -> other (bebop) [false_name] x2
- Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key): none
- Tonal Scale.detect exact (no tonic given): none -> other (bebop locrian) / other (bebop minor) / other (bebop) / other (ichikosucho) [false_name] x8; none -> other (composite blues) [false_name] x6; none -> other (piongio) [false_name] x1

**All 812 readable real items: how many each method gives a collection name to, by the size of the item's pitch-class set (no tonic given to the library methods; the current detector with its own key).** A name for 8 to 11 pitch classes is a false name by the page's rule (equality, not containment).

| method | fewer than 5 | 5 to 7 pitch classes | 8 to 11 pitch classes | 12 pitch classes |
| --- | --- | --- | --- | --- |
| items in the group | 8 | 147 | 326 | 331 |
| of which the set equals a table collection (or twelve) | 0 | 91 | 0 | 331 |
| current detector (tonic: its own key): items given a name | 0 | 84 | 0 | 331 |
| current detector (tonic: its own key): of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | 0 | 0 | 0 | 0 |
| music21 deriveRanked, as returned (tonic: detected key): items given a name | 8 | 141 | 0 | 331 |
| music21 deriveRanked, as returned (tonic: detected key): of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | 0 | 0 | 0 | 0 |
| music21 deriveRanked + equality check (tonic: detected key): items given a name | 0 | 87 | 0 | 331 |
| music21 deriveRanked + equality check (tonic: detected key): of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | 0 | 0 | 0 | 0 |
| Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key): items given a name | 0 | 115 | 0 | 331 |
| Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key): of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | 0 | 24 | 0 | 0 |
| Tonal Scale.detect exact (no tonic given): items given a name | 0 | 115 | 102 | 331 |
| Tonal Scale.detect exact (no tonic given): of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | 0 | 24 | 102 | 0 |

**Real items the current detector gives a mode or other non-major/minor name (8), and what each method says.** (tonic: the key the project's detector found.) Expected: see section 1 (no title or score text names a mode; truth is a reading).

| item | detected key | current | music21 + equality | music21 as returned (labels) | Tonal exact (tonic given) | Tonal exact (no tonic) |
| --- | --- | --- | --- | --- | --- | --- |
| song.classical.zimmer-time-hans-zimmer-inception.pdmx | A minor | dorian on A | dorian on A | dorian on A | dorian on A | lydian on C, mixolydian on D, aeolian (natural minor) on E, locrian on F#, ionian (major) on G, dorian on A, phrygian on |
| song.folk.anonymous-swing-low-sweet-chariot.pdmx | G major | major pentatonic on G | - | ionian (major) on G, lydian on G, mixolydian on G | major pentatonic on G | pentatonic set (tonic not its own) on D, minor pentatonic on E, major pentatonic on G, pentatonic set (tonic not its own |
| song.folk.old-macdonald | C major | major pentatonic on C | - | ionian (major) on C, lydian on C, mixolydian on C | major pentatonic on C | major pentatonic on C, pentatonic set (tonic not its own) on D, pentatonic set (tonic not its own) on E, pentatonic set  |
| song.folk.scarborough-fair-canticle.pdmx | E minor | dorian on E | dorian on E | dorian on E | dorian on E | locrian on C#, ionian (major) on D, dorian on E, phrygian on F#, lydian on G, mixolydian on A, aeolian (natural minor) o |
| song.folk.scarborough-fair.pdmx | E minor | dorian on E | dorian on E | dorian on E | dorian on E | locrian on C#, ionian (major) on D, dorian on E, phrygian on F#, lydian on G, mixolydian on A, aeolian (natural minor) o |
| song.folk.this-little-light-of-mine.pdmx | Bb major | major pentatonic on Bb | - | ionian (major) on Bb, lydian on Bb, mixolydian on Bb | major pentatonic on Bb | pentatonic set (tonic not its own) on C, pentatonic set (tonic not its own) on D, pentatonic set (tonic not its own) on  |
| song.pop.guantanamera.pdmx | A major | mixolydian on A | mixolydian on A | mixolydian on A | mixolydian on A | locrian on C#, ionian (major) on D, dorian on E, phrygian on F#, lydian on G, mixolydian on A, aeolian (natural minor) o |
| song.pop.scarborough-fair.pdmx | E minor | dorian on E | dorian on E | dorian on E | dorian on E | locrian on C#, ionian (major) on D, dorian on E, phrygian on F#, lydian on G, mixolydian on A, aeolian (natural minor) o |

**Passage level, generated scale drills: 942 single-note runs of at least 6 notes found by the project's `scale_runs`; 0 whose pitch-class set is not the declared collection (not scored); 942 scored.** Every method names the same run; the tonic given to the library methods is the run's local key tonic (as the current detector uses). Expected: the declared collection (melodic minor drills: the ascending run melodic minor, the descending run natural minor: a reading of the standard scale and the page's direction test).

| method | exact | right among several | wrong | missed | correct: no name | false name |
| --- | --- | --- | --- | --- | --- | --- |
| current detector (passage_name, local key) | 942 | 0 | 0 | 0 | 0 | 0 |
| music21 deriveRanked, as returned | 902 | 0 | 12 | 28 | 0 | 0 |
| music21 deriveRanked + equality check | 902 | 0 | 0 | 40 | 0 | 0 |
| Tonal Scale.detect exact | 942 | 0 | 0 | 0 | 0 | 0 |

**Passage level: runs by family (exact + correct no-name / scored).**

| family | scored runs | current detector (passage_name, local key) | music21 deriveRanked, as returned | music21 deriveRanked + equality check | Tonal Scale.detect exact |
| --- | --- | --- | --- | --- | --- |
| blues_scale | 48 | 48 | 24 | 24 | 48 |
| chromatic | 12 | 12 | 12 | 12 | 12 |
| pentatonic drill: blues | 6 | 6 | 2 | 2 | 6 |
| pentatonic drill: minor pentatonic | 12 | 12 | 0 | 0 | 12 |
| scale: harmonic minor | 240 | 240 | 240 | 240 | 240 |
| scale: major | 384 | 384 | 384 | 384 | 384 |
| scale: melodic minor | 144 | 144 | 144 | 144 | 144 |
| scale: natural minor | 96 | 96 | 96 | 96 | 96 |

**Passage level: what the non-exact answers were.**

- current detector (passage_name, local key): none
- music21 deriveRanked, as returned: blues scale -> (nothing) [missed] x28; minor pentatonic -> aeolian (natural minor) / blues scale / dorian / phrygian [wrong] x12
- music21 deriveRanked + equality check: blues scale -> (nothing) [missed] x28; minor pentatonic -> (nothing) [missed] x12
- Tonal Scale.detect exact: none

**Real passage: `song.folk.el-condor-pasa-if-i-could.pdmx` (the page's positive: a minor pentatonic run).** Runs of 6 or more single notes:

- bar 40 (0-based), hand R, 6 notes, set ['D', 'E', 'G', 'A', 'B'], local key E minor: current: 'minor pentatonic on E (local key)'; music21 + equality: - (tonic-free list: -); music21 as returned at that tonic: aeolian (natural minor) on E, dorian on E, phrygian on E, blues scale on E; Tonal at that tonic: minor pentatonic on E

**Runtime per item (milliseconds: mean / median / max), item level.** Measured on this machine in 12 worker processes (music21, current detector) and one Node process (Tonal); the naming step only, after the score is read and, for the current detector and the library methods that need a tonic, after the key is found.

| step | items | ms per item |
| --- | --- | --- |
| current detector, naming only (`item_name`) | 1186 | 0.13 / 0.03 / 43.60 |
| key detection the naming needs (`H.analyse`, whole analysis) | 1186 | 247.44 / 123.81 / 5745.32 |
| music21 `deriveRanked`, 13 scale classes, 12 results each | 1186 | 417.44 / 358.76 / 1098.35 |
| Tonal `Scale.detect` exact, every tonic in the set | 1186 | 0.09 / 0.07 / 0.77 |
| Tonal `Scale.detect` exact, one tonic given | 1138 | 0.01 / 0.01 / 0.32 |
| Tonal, whole batch of 2129 queries, one Node process | - | 203 ms in all |
| current detector, passage naming (`passage_name`) | 942 runs | 0.01 / 0.00 / 0.04 |
| music21 `deriveRanked`, one run's set (first time that set was seen) | 43 runs | 309.44 / 295.19 / 484.78 |

**Runtime per item, one process, 39 items spread over the catalogue (milliseconds: mean / median / max).** Measured on this machine, nothing else running from this script.

| step | ms per item |
| --- | --- |
| project score reader (partitura) | 166.8 / 102.7 / 784.7 |
| key detection (`H.analyse`, whole analysis) | 133.5 / 88.4 / 532.1 |
| current detector, naming only (`item_name`) | 0.1 / 0.1 / 0.1 |
| music21 `converter.parse` (to get the score's spelling) | 66.3 / 31.3 / 341.8 |
| music21 `deriveRanked`, 13 scale classes, 12 results each | 387.1 / 390.4 / 633.5 |

## 4. pitch.tone-row results

The tables below are written by `row_metrics.py` (per-item data in `row_scan.json`, `row_music21_results.json`, `row_cases.json`). Found = two or more statements (P, I, R or RI forms) of one row, the page's rule 3.

**Catalogue pass of the current detector (`row_scan.py`): 1985 readable items (1176 generated, 809 real); 35 not scanned (31 one-line-staff or unreadable-view items, 4 reader errors).**

| count | generated | real | all |
| --- | --- | --- | --- |
| 12 different pitch classes in 12 consecutive notes of a line (no scale-figure filter) | 16 | 43 | 59 |
| at least one statement (page rule 1: the filter on) | 0 | 1 | 1 |
| a row present (rule 3: two statements that are forms of one row) | 0 | 0 | 0 |
| two consecutive candidate windows (rule 4) | 4 | 18 | 22 |
| sent to the agent (two consecutive windows or a statement) | 4 | 19 | 23 |

The items flagged by either test: 68 (16 generated chromatic-scale drills, 52 real). They are the catalogue's candidates for a tone row; the table below states the row for each.

**The flagged catalogue items, with the row stated from the score and what each method did.** `run12`: a line has 12 different pitch classes in 12 consecutive notes (steps by a second in that run, of 11, from music21-free note view). `cur`: statements / present / windows (consecutive pairs) / sent to the agent. music21 columns: statements found of the row chosen by `self` (the piece's own first 12-pitch-class run), `first12` (first 12 notes of the first staff), `hist` (the 71 rows of music21's table): rows found twice or more, or `timeout`. Row stated: `none` for all, on the basis in the last column.

| item | bars | run12 | steps by second in the first 12-note run | cur: st / present / win (pairs) / agent | music21 self | music21 first12 | music21 hist | row (from the score) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| exercise.chromatic.c.1oct.both | 4 | yes | 11 | 0 / no / 1 (0) / no | 8 stmts FOUND | 8 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.c.1oct.left | 4 | yes | 11 | 0 / no / 1 (0) / no | 4 stmts FOUND | no row | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.c.1oct.right | 4 | yes | 11 | 0 / no / 1 (0) / no | 4 stmts FOUND | 4 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.c.2oct.both | 7 | yes | 11 | 0 / no / 2 (1) / yes | 56 stmts FOUND | 56 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.d.1oct.both | 4 | yes | 11 | 0 / no / 1 (0) / no | 8 stmts FOUND | 8 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.d.1oct.left | 4 | yes | 11 | 0 / no / 1 (0) / no | 4 stmts FOUND | no row | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.d.1oct.right | 4 | yes | 11 | 0 / no / 1 (0) / no | 4 stmts FOUND | 4 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.d.2oct.both | 7 | yes | 11 | 0 / no / 2 (1) / yes | 56 stmts FOUND | 56 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.e.1oct.both | 4 | yes | 11 | 0 / no / 1 (0) / no | 8 stmts FOUND | 8 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.e.1oct.left | 4 | yes | 11 | 0 / no / 1 (0) / no | 4 stmts FOUND | no row | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.e.1oct.right | 4 | yes | 11 | 0 / no / 1 (0) / no | 4 stmts FOUND | 4 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.e.2oct.both | 7 | yes | 11 | 0 / no / 2 (1) / yes | 56 stmts FOUND | 56 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.g.1oct.both | 4 | yes | 11 | 0 / no / 1 (0) / no | 8 stmts FOUND | 8 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.g.1oct.left | 4 | yes | 11 | 0 / no / 1 (0) / no | 4 stmts FOUND | no row | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.g.1oct.right | 4 | yes | 11 | 0 / no / 1 (0) / no | 4 stmts FOUND | 4 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| exercise.chromatic.g.2oct.both | 7 | yes | 11 | 0 / no / 2 (1) / yes | 56 stmts FOUND | 56 stmts FOUND | none | none: a chromatic scale exercise (a generated drill) |
| song.classical.bach-cello-suite-no-1-prelude-piano-transcription.pdmx | 42 | yes | 11 | 0 / no / 0 (0) / no | 0 stmts | no row | none | none: Johann Sebastian Bach, Cello Suite No. 1, Prelude (piano transcripti: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.beethoven-fur-elise | 106 | yes | 11 | 0 / no / 0 (0) / no | 11 stmts FOUND | no row | none | none: Ludwig van Beethoven, Für Elise, WoO 59: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.beethoven-moonlight-iii | 201 | yes | 11 | 0 / no / 1 (0) / no | 16 stmts FOUND | no row | none | none: Ludwig van Beethoven, Piano Sonata No. 14 “Moonlight”, III. Presto : tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.beethoven-moonlight-iii.alt | 201 | yes | 11 | 0 / no / 0 (0) / no | 16 stmts FOUND | no row | none | none: Ludwig van Beethoven, Moonlight Sonata, III. Presto agitato (altern: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-ballade-2.nifc | 204 | yes | 11 | 0 / no / 4 (2) / yes | 0 stmts | no row | none | none: Fryderyk Chopin, Ballade No. 2 in F major, Op. 38: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-ballade-3.nifc | 240 | yes | 11 | 0 / no / 0 (0) / no | 7 stmts FOUND | no row | none | none: Fryderyk Chopin, Ballade No. 3 in A-flat major, Op. 47: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-ballade-4.nifc | 239 | yes | 11 | 0 / no / 5 (1) / yes | 20 stmts FOUND | no row | none | none: Fryderyk Chopin, Ballade No. 4 in F minor, Op. 52: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-ballade-no-4-in-f-minor-op-52.pdmx | 242 | yes | 11 | 0 / no / 3 (0) / no | 8 stmts FOUND | no row | none | none: Fryderyk Chopin, Ballade No. 4 in F minor, Op. 52: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-berceuse.nifc | 70 | yes | 11 | 0 / no / 1 (0) / no | 2 stmts FOUND | no row | none | none: Fryderyk Chopin, Berceuse in D-flat major, Op. 57: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-bolero.nifc | 260 | no | - | 0 / no / 4 (1) / yes | no run | no row | none | none: Fryderyk Chopin, Bolero in A minor, Op. 19: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-etude-in-e-flat-minor-op-10-no-6.pdmx | 54 | no | - | 0 / no / 3 (1) / yes | no run | no row | none | none: Fryderyk Chopin, Étude in E-flat minor, Op. 10 No. 6: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-etude-op10-10.nifc | 78 | no | - | 0 / no / 4 (1) / yes | no run | no row | none | none: Fryderyk Chopin, Étude in A-flat major, Op. 10 No. 10: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-etude-op10-12.nifc | 84 | no | - | 0 / no / 3 (1) / yes | no run | no row | none | none: Fryderyk Chopin, Étude in C minor, Op. 10 No. 12: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-etude-op10-2.nifc | 49 | yes | 11 | 0 / no / 4 (3) / yes | 67 stmts FOUND | no row | none | none: Fryderyk Chopin, Étude in A minor, Op. 10 No. 2: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-etude-op10-4.nifc | 83 | no | - | 0 / no / 4 (2) / yes | no run | no row | none | none: Fryderyk Chopin, Étude in C-sharp minor, Op. 10 No. 4: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-etude-op25-11.nifc | 96 | yes | 11 | 0 / no / 1 (0) / no | 18 stmts FOUND | no row | none | none: Fryderyk Chopin, Étude in A minor, Op. 25 No. 11: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-etude-op25-2.nifc | 70 | yes | 11 | 0 / no / 2 (0) / no | 3 stmts FOUND | no row | none | none: Fryderyk Chopin, Étude in F minor, Op. 25 No. 2: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-etude-op25-6.nifc | 63 | yes | 0 | 0 / no / 8 (4) / yes | 0 stmts | no row | none | none: Fryderyk Chopin, Étude in G-sharp minor, Op. 25 No. 6: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-etude-op25-8.nifc | 36 | yes | 11 | 0 / no / 1 (0) / no | 0 stmts | no row | none | none: Fryderyk Chopin, Étude in D-flat major, Op. 25 No. 8: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-fantaisie-impromptu-in-c-sharp-minor-op-66.pdmx | 138 | yes | 11 | 0 / no / 0 (0) / no | 32 stmts FOUND | no row | none | none: Fryderyk Chopin, Fantaisie-impromptu in C-sharp minor, Op. 66: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-fantaisie-impromptu.nifc | 138 | yes | 11 | 0 / no / 0 (0) / no | 32 stmts FOUND | no row | none | none: Fryderyk Chopin, Fantaisie-impromptu in C-sharp minor, Op. 66: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-mazurka-op59-2.nifc | 111 | yes | 11 | 0 / no / 2 (1) / yes | 2 stmts FOUND | no row | none | none: Fryderyk Chopin, Mazurka in A-flat major, Op. 59 No. 2: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-nocturne-in-f-sharp-major-op-15-no-2.pdmx | 63 | yes | 5 | 1 / no / 0 (0) / yes | 1 stmts | no row | none | none: Fryderyk Chopin, Nocturne in F-sharp major, Op. 15 No. 2: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-nocturne-op48-1.nifc | 81 | yes | 11 | 0 / no / 0 (0) / no | 0 stmts | no row | none | none: Fryderyk Chopin, Nocturne in C minor, Op. 48 No. 1: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-polonaise-fantaisie.nifc | 288 | yes | 11 | 0 / no / 9 (3) / yes | 0 stmts | no row | none | none: Fryderyk Chopin, Polonaise-fantaisie in A-flat major, Op. 61: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-polonaise-op44.nifc | 325 | yes | 11 | 0 / no / 1 (0) / no | 16 stmts FOUND | no row | none | none: Fryderyk Chopin, Polonaise in F-sharp minor, Op. 44: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-polonaise-op71-1.nifc | 142 | yes | 11 | 0 / no / 1 (0) / no | 0 stmts | no row | none | none: Fryderyk Chopin, Polonaise in D minor, Op. 71 No. 1: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-prelude-op28-8.nifc | 34 | no | - | 0 / no / 3 (1) / yes | no run | no row | none | none: Fryderyk Chopin, Prelude No. 8 in F-sharp minor, Op. 28: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-rondo-mazur.nifc | 469 | yes | 11 | 0 / no / 4 (1) / yes | 3 stmts FOUND | no row | none | none: Fryderyk Chopin, Rondo à la mazur in F major, Op. 5: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-rondo-op1.nifc | 357 | yes | 11 | 0 / no / 3 (0) / no | 10 stmts FOUND | no row | none | none: Fryderyk Chopin, Rondo in C minor, Op. 1: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-rondo-op16.nifc | 469 | no | - | 0 / no / 7 (3) / yes | no run | no row | none | none: Fryderyk Chopin, Rondo in E-flat major, Op. 16: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-sonata-2-1.nifc | 242 | yes | 11 | 0 / no / 4 (0) / no | 0 stmts | no row | none | none: Fryderyk Chopin, Piano Sonata No. 2 in B-flat minor, Op. 35 — : tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-sonata-2-2.nifc | 291 | yes | 11 | 0 / no / 1 (0) / no | 12 stmts FOUND | no row | none | none: Fryderyk Chopin, Piano Sonata No. 2, Op. 35 — mvt 2 in E-flat : tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-sonata-2-4.nifc | 77 | no | - | 0 / no / 7 (4) / yes | no run | no row | none | none: Fryderyk Chopin, Piano Sonata No. 2 in B-flat minor, Op. 35 — : tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-sonata-3-4.nifc | 286 | yes | 11 | 0 / no / 4 (1) / yes | 13 stmts FOUND | no row | none | none: Fryderyk Chopin, Piano Sonata No. 3 in B minor, Op. 58 — mvt 4: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-tarantelle.nifc | 271 | yes | 11 | 0 / no / 0 (0) / no | 38 stmts FOUND | no row | none | none: Fryderyk Chopin, Tarantelle in A-flat major, Op. 43: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-variations-op12.nifc | 230 | yes | 0 | 0 / no / 5 (0) / no | 11 stmts FOUND | no row | none | none: Fryderyk Chopin, Variations brillantes in B-flat major, Op. 12: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.chopin-waltz-op18.nifc | 310 | yes | 11 | 0 / no / 0 (0) / no | 0 stmts | no row | none | none: Fryderyk Chopin, Grande valse brillante in E-flat major, Op. 1: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.czerny-the-art-of-preluding-op-300-no-8.pdmx | 12 | yes | 11 | 0 / no / 0 (0) / no | 3 stmts FOUND | no row | none | none: Carl Czerny, The Art of Preluding, Op. 300 No. 8: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.czerny-the-school-of-velocity-op-299-no-8.pdmx | 55 | yes | 11 | 0 / no / 0 (0) / no | 14 stmts FOUND | no row | none | none: Carl Czerny, The School of Velocity, Op. 299 No. 8: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.leontovych-carol-of-the-bells-christmas-medley.pdmx | 216 | yes | 11 | 0 / no / 0 (0) / no | 2 stmts FOUND | no row | none | none: Mykola Leontovych, arr. Xingyu Shui, Carol of the Bells (Christmas medley): tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.liszt-la-campanella | 150 | yes | 11 | 0 / no / 4 (1) / yes | 43 stmts FOUND | no row | none | none: Franz Liszt, La Campanella (Grandes études de Paganini No.: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.nazareth-carioca-1913.pdmx | 78 | yes | 11 | 0 / no / 0 (0) / no | 19 stmts FOUND | no row | none | none: ERNESTO NAZARETH, Carioca (1913): tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.rimsky-flight-bumblebee | 101 | yes | 11 | 0 / no / 4 (0) / no | 24 stmts FOUND | no row | none | none: Nikolai Rimsky-Korsakov, Flight of the Bumblebee: tonal repertoire (key named in the title or the genre is tonal) |
| song.classical.schubert-liszt-standchen | 115 | yes | 11 | 0 / no / 1 (0) / no | 11 stmts FOUND | no row | none | none: Franz Schubert, arr. Franz Liszt, Ständchen (Serenade), D. 957 No. 4, arr. Lisz: tonal repertoire (key named in the title or the genre is tonal) |
| song.folk.3-variations-on-happy-birthday.pdmx | 249 | yes | 11 | 0 / no / 0 (0) / no | 5 stmts FOUND | no row | none | none: Cyprien Katsaris, 3 Variations on Happy Birthday: tonal repertoire (key named in the title or the genre is tonal) |
| song.jazz.stumbling | 105 | yes | 11 | 0 / no / 0 (0) / no | 1 stmts | no row | none | none: Zez Confrey, Stumbling: tonal repertoire (key named in the title or the genre is tonal) |
| song.pop.louisf365-boogie-woogie-and-blues-piano-exersices.pdmx | 31 | no | - | 0 / no / 2 (1) / yes | no run | no row | none | none: Anonymous, Boogie-woogie and blues piano exercises: tonal repertoire (key named in the title or the genre is tonal) |
| song.ragtime.joplin-elite-syncopations | 88 | yes | 10 | 0 / no / 0 (0) / no | 0 stmts | no row | none | none: Scott Joplin, Elite Syncopations: tonal repertoire (key named in the title or the genre is tonal) |
| song.ragtime.joplin-harmony-club-waltz | 162 | yes | 11 | 0 / no / 0 (0) / no | 2 stmts FOUND | no row | none | none: Scott Joplin, Harmony Club Waltz: tonal repertoire (key named in the title or the genre is tonal) |
| song.ragtime.joplin-new-rag | 111 | yes | 11 | 0 / no / 0 (0) / no | 4 stmts FOUND | no row | none | none: Scott Joplin, Scott Joplin's New Rag: tonal repertoire (key named in the title or the genre is tonal) |
| song.ragtime.joplin-rose-bud-march | 94 | yes | 11 | 0 / no / 0 (0) / no | 4 stmts FOUND | 4 stmts FOUND | none | none: Scott Joplin, The Rose-bud March: tonal repertoire (key named in the title or the genre is tonal) |

**Catalogue false finds (every flagged item is tonal or a chromatic drill, so any find is false).** Current detector: rows present 0 of 68; sent to the agent 23. music21 `search.serial` with the row chosen by `self`: found (two or more statements) 47 of 68; by `first12`: 13; by `hist` (71 table rows): 0 found of 68 that finished within the limit, 0 timed out.

**Built positives (a row stated in the score by construction): found / total.** V1: one line, the row P then its inversion I then its retrograde R (3 statements); V2: the same row split between the hands as three-note chords, 8 bars (P and I split across both hands); V3: one line, every note struck twice. Rows are the 71 of music21's table of rows from named works (every sixth for V2 and V3). `cur present` = code alone reports a row (rule 3); `cur present or sent` = code alone or the trigger sends it to the agent; `cur >=1 statement` = rule 1 finds a statement. music21 columns: two or more statements of the row chosen by the named rule (`oracle` is the true row, unavailable for a real piece).

| variant | scores | cur >=1 statement | cur present | cur present or sent | music21 oracle | music21 self | music21 first12 | music21 hist (any row found twice) | hist: the right row among those found | hist timed out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 one line P, I, R | 71 | 69/71 | 67/71 | 69/71 | 71/71 | 71/71 | 71/71 | 71/71 | 70/71 | 0 |
| V2 split between hands | 12 | 0/12 | 0/12 | 12/12 | 0/12 | 0/12 | 0/12 | 0/12 | 0/12 | 0 |
| V3 repeated notes | 12 | 0/12 | 0/12 | 0/12 | 5/12 | 0/12 | 0/12 | 5/12 | 5/12 | 0 |

V1 rows the current detector does not report as present (4 of 71): BergDerWein (1 statements), SchoenbergMosesAron (1 statements), SchoenbergOp24Mvmt5 (0 statements), SchoenbergOp26 (0 statements).

Scores where music21 with the true row (`oracle`) does not find two statements (19 of 95): V2_BergChamberConcerto, V2_BergLyricSuitePerm, V2_SchoenbergIsraelExists, V3_SchoenbergIsraelExists, V2_SchoenbergOp25, V2_SchoenbergOp28No1, V2_SchoenbergOp33A, V3_SchoenbergOp33A, V2_SchoenbergOp35No5, V3_SchoenbergOp35No5, V2_SchoenbergOp45, V3_SchoenbergOp45, V2_SchoenbergOp50A, V3_SchoenbergOp50A, V2_WebernOp18No2, V3_WebernOp18No2, V2_WebernOp22, V2_WebernOp28, V3_WebernOp28.

**Counterexamples: any find is false.** Built: a chromatic scale three times; a chromatic scale up and down over two octaves; the circle of fifths twice; the two whole-tone scales one after the other, twice. Real: Schoenberg, Op. 19 Nos. 2 and 6 (free atonal piano pieces before the twelve-tone method, music21 corpus; no row).

| case | cur: statements / present / sent to agent | music21 self | music21 first12 | music21 hist |
| --- | --- | --- | --- | --- |
| N1_chromatic_scale_x3 | 0 / no / no | 25 stmts FOUND | 25 stmts FOUND | none |
| N2_chromatic_up_down_2oct | 0 / no / no | 28 stmts FOUND | 28 stmts FOUND | none |
| N3_circle_of_fifths_x2 | 0 / no / no | 13 stmts FOUND | 13 stmts FOUND | none |
| N4_two_whole_tone_scales | 0 / no / no | 2 stmts FOUND | 2 stmts FOUND | none |
| N5_schoenberg_op19_movement2 | 0 / no / no | no run | no row | none |
| N5_schoenberg_op19_movement6 | 0 / no / yes | no run | no row | none |

**Runtime (milliseconds: mean / median / max). Measured on this machine, 12 task processes at once; the music21 times include only the search call, parse is separate.**

| step | scores | ms |
| --- | --- | --- |
| current detector (`rows` + `windows` after the score is read) | 1985 catalogue items | 4.1 / 0.1 / 206.7 |
| music21 `converter.parse` | 237 | 334.1 / 178.0 / 2346.5 |
| music21 search, row = `self` | 59 flagged catalogue items | 7711.8 / 6628.3 / 28218.2 |
| music21 search, row = `self` | 75 built and real cases | 115.7 / 114.2 / 260.6 |
| music21 search, row = `first12` | 13 flagged catalogue items | 385.2 / 162.9 / 2249.9 |
| music21 search, row = `first12` | 75 built and real cases | 139.1 / 120.8 / 1079.7 |
| music21 search, row = true row | 95 built and real cases | 122.2 / 64.4 / 553.2 |
| music21 search, 71 table rows | 68 flagged catalogue items (finished) | 454257.7 / 388977.5 / 1455432.3 |
| music21 search, 71 table rows | 101 built and real cases (finished) | 15194.7 / 11949.8 / 42356.6 |
| tasks that hit the time limit | 0 | limit 0 s |

**Why the statement test misses some rows (`row_diag.py`).** Rule 1 rejects a 12-note window with 8 or more steps by a second (of 11), or 5 seconds in a row, or two interleaved stepwise lines. Applied to the 71 rows of music21's table (as one line): rejected by any clause 4 of 71; by clause: 8+ seconds: 3, 5+ seconds in a row: 3, two interleaved stepwise lines: 0. Rows rejected: BergDerWein (5+ seconds in a row; 7 seconds, longest run 5), SchoenbergMosesAron (8+ seconds; 8 seconds, longest run 3), SchoenbergOp24Mvmt5 (8+ seconds/5+ seconds in a row; 9 seconds, longest run 5), SchoenbergOp26 (8+ seconds/5+ seconds in a row; 8 seconds, longest run 5).

The catalogue's 12-note windows with 12 different pitch classes (no filter): 1244 windows in 51 items. Steps by a second in the window (of 11), rows of the table against catalogue windows:

| steps by a second | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| table rows (71) | 0 | 2 | 5 | 7 | 22 | 10 | 12 | 10 | 2 | 1 | 0 | 0 |
| catalogue windows | 21 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 1 | 1 | 7 | 1210 |

Catalogue windows that rule 1 accepts: 2 in 1 items (song.classical.chopin-nocturne-in-f-sharp-major-op-15-no-2.pdmx).

**Current detector with fix F (reject only 10 or more steps by a second, or two interleaved stepwise lines; the 8-second and 5-in-a-row clauses dropped).** In-sample for the positives (the threshold was read off the same 71 rows); the catalogue and counterexample columns are not tuned.

| set | current (rule as written) | with fix F |
| --- | --- | --- |
| V1 one line P, I, R: row present (of 71) | 67 | 71 |
| V2 split between the hands: present (of 12) | 0 | 0 |
| V3 repeated notes: present (of 12) | 0 | 0 |
| catalogue items with a statement (of 1985 scanned) | 1 | 2 |
| catalogue items with a row present | 0 | 0 |
| catalogue items sent to the agent | 23 | 23 |

Catalogue items that gain a statement under F: song.classical.chopin-mazurka-op59-2.nifc.

Counterexamples under F (statements / present): N1_chromatic_scale_x3: 0 / no; N2_chromatic_up_down_2oct: 0 / no; N3_circle_of_fifths_x2: 0 / no; N4_two_whole_tone_scales: 0 / no; N5_schoenberg_op19_movement2: 0 / no; N5_schoenberg_op19_movement6: 0 / no.

## 5. What the numbers say (each point names the table it reads)

**scale.collection.**
- *The current naming step is right wherever it can be checked.* Generated items (section 3, first table): 374 of 374 (278 named exactly as the recipe declares, 96 correctly left without a 7-class name: the 48 melodic-minor items, which have 9 pitch classes up and down, and the 48 five-finger patterns). Passage level: 942 of 942 runs of the generated drills named as the declared collection. On the 812 real items it names nothing from a set of 8 to 11 pitch classes (326 items) and says "all twelve" for the 331 with twelve (section 3, the size table). This reproduces the validation pass (row 8: 374 declared items named right; 0 real items named after an 8- or 9-pitch-class collection; 331 "all twelve") by a separate script run.
- *The real-item test is weak and the page should not lean on it.* Of the 226 real items with a key in the title, 145 have all twelve pitch classes, 77 have a set that equals no collection (74 of them 8 to 11 pitch classes), and only 4 are diatonic sets (all ionian). The expected answer is derived from the set and the title's tonic with the project's own table, so the current detector's 149 of 149 and 77 of 77 shows that its tonic and its refusals are consistent with that table, not that a piece "is in" the collection. Of the 8 real items to which it gives a mode or pentatonic name (the modal-items table in section 3), none has an independent label in reach (0 of 816 real items name a scale or mode in title or score text).
- *Tonal equals it on every test once it is given the tonic, and not otherwise.* With the tonic: 374 of 374 generated, 942 of 942 runs, 149 of 149 and 69 of 77 on the real titled items. The 8 false names are Tonal naming 8-pitch-class sets as `ichikosucho` (6) and `bebop` (2): exact matches of scale types the project's rule refuses at item level (it found 33 + 69 real items wrongly named in the first version of the rule). With the project's size rule applied (names of 8 to 11 pitch classes dropped) it is level with the current detector on all of it. Without a tonic Tonal returns every mode of the set (7 names for a diatonic set): exact on 16 of 374 generated items (the 16 chromatic ones), 262 "right among several", and 48 false names on the melodic-minor sets (its `composite blues`, a 9-note scale with some tonic in the set). It also names 24 of the 147 real sets of 5 to 7 pitch classes only with scale types outside the project's table (among the names it returns for those sets: `piongio`, `ritusen`, `egyptian`, `malkos raga`): names the curriculum does not teach.
- *music21 `deriveRanked` is the weaker of the two.* As returned (every full match): 313 of 374 generated (83.7%): it names a containing scale for all 48 five-finger patterns (a false name; it has no notion of equality), is wrong on 3 and misses 10. With the project's equality check on its answer: 361 of 374 (96.5%); the 13 misses are the blues scale and the minor pentatonic, which it cannot name (no pentatonic class; its blues class matched the six-note blues scale on 8 of 16 `blues_scale` items with the score's spelling, 10 of 16 with sharps-only spelling, and on 1 of 3 of the pentatonic drills' blues scales). At passage level 902 of 942 (40 blues and minor-pentatonic runs missed; 12 more named wrongly when the equality check is left out). It is level with the others on the diatonic and harmonic-minor families (major 108 of 108, harmonic minor 72 of 72, natural minor 24 of 24).
- *Neither library solves what the page leaves open.* The tonic, and so the mode, comes from the key for both (the survey says so, and the no-tonic Tonal row shows it); neither says which notes form a run (the project's `scale_runs` does, for all methods here); neither gives the minor-form order that the page marks open (b); the page's own positive, the minor pentatonic run in *El Condor Pasa* (bar 40, E minor), is named "minor pentatonic on E" by the current detector, by music21 with the equality check and by Tonal.
- *Runtime* (section 3 timing tables, machine loaded): naming itself costs the current detector 0.13 ms and Tonal 0.09 ms an item (0.01 ms with the tonic given); music21 `deriveRanked` over 13 scale classes costs 417 ms an item with 12 processes at once and 387 ms alone (plus 66 ms to parse the score for its spelling). The key detection that all three need costs 247 ms (loaded) and 134 ms (alone) an item.

**pitch.tone-row.**
- *The catalogue has no tone row, and the current detector says so.* Of 1,985 scanned items, 59 have 12 different pitch classes in 12 consecutive notes of a line; the page's statement test accepts 1 (the F-sharp Nocturne, a single statement, 5 steps by a second); no row is present in any item; the trigger sends 23 items to the agent (4 generated 2-octave chromatic drills and 19 real). This reproduces the validation pass (19 real + 4 generated; 1 single statement). Of the 1,244 twelve-pitch-class windows in the catalogue, 1,210 are 11 of 11 steps by a second (chromatic scales and runs) (`row_diag.py` table).
- *Row-split and repeated-note rows are where the current detector depends on the agent or fails.* Built positives (71 rows of music21's table, one line P, I, R): a statement found for 69 of 71, a row present (code alone) for 67 of 71. The four misses are rows the "not a scale figure" clause rejects (BergDerWein, SchoenbergMosesAron, SchoenbergOp24Mvmt5, SchoenbergOp26: 8 or 9 steps by a second, or 5 in a row); the 71 table rows have 1 to 9 steps by a second, the catalogue's windows are 1,217 of 10 or 11 steps, 21 of none, 2 of 4, 2 of 5 and 1 each of 8 and 9, so a limit of 10 rejects every window that is no row but accepts the two catalogue windows of 8 and 9 (fix F below). Rows split between the hands as chords (12 built): no statement, but all 12 are sent to the agent by the window trigger (this is what rule 4 was added for). Rows with every note struck twice (12 built): neither found nor sent (the 4-bar window holds only 8 different pitch classes), so a repeated-note statement is missed entirely.
- *Fix F (measured, in-sample).* Rejecting only 10 or more steps by a second or two interleaved stepwise lines: rows present 71 of 71 (from 67), no new row present in the catalogue (one more single statement, in the A-flat Mazurka Op. 59 No. 2), counterexamples still 0, the 23 sent items unchanged. The threshold was read off the same 71 rows, so the recall is not a test of F on new rows; the false-find side (1,985 items, 6 counterexamples) is not tuned. F does nothing for the split-hand and repeated-note cases.
- *music21 `search.serial` is a search for a row, not a way to find one, and how the row is chosen decides everything.* With the true row (`oracle`, impossible for a real piece): found on 71 of 71 one-line scores, 0 of 12 split between hands (it reads one part at a time) and 5 of 12 with repeated notes. Row = the piece's own first 12-pitch-class run (`self`): found on 71 of 71 positives but also on 47 of the 68 flagged catalogue items (Chopin, Beethoven, Liszt, Joplin, the chromatic drills: 2 to 67 "statements", which are transpositions and inversions of a chromatic run) and on all four built counterexamples (chromatic scale, circle of fifths, whole-tone scales); on 0 of the 2 Schoenberg Op. 19 pieces (no 12-note run). Row = the first 12 notes of the piece (`first12`): 71 of 71 on one-line positives that begin with the row, 13 false finds in the catalogue (all chromatic drills and Joplin's *Rose-bud March*). Row = the 71 rows of its own table (`hist`): 0 false finds on 68 flagged items and all four counterexamples, 71 of 71 positives found (70 of 71 with the right row named, 5 of 12 repeated-note, 0 of 12 split), but at a median of 389 s per catalogue piece (maximum 1,455 s; a median 12 s for a short built piece) and it can only find rows already in the table, so a new composer's row is invisible to it.
- *What the current detector and music21 each answer.* Both report an ordered window of 12 different pitch classes, found in the notes (exact for the notes, inferred for "this is a row"). Neither establishes the stronger claim that the composer used the tone-row technique: a transposed or inverted 12-note chromatic run matches itself (47 of 68 self-row finds). Only the written music, a repeated structure across phrases, and an agent can say that.
- *Runtime* (loaded machine, section 4 table): the current detector 4.1 ms an item (median 0.1 ms) over the whole catalogue; music21 search with one row 7.7 s a catalogue item on average for `self` (maximum 28 s) and 0.1 s on short built scores, plus 0.33 s to parse; with the 71-row table 454 s a catalogue item.

## 6. The reviewer's points applied (the owner's outside review, 2026-10-08)

- *Agreement is confidence, not proof.* For `scale.collection` the current detector, Tonal with the tonic and music21 with the equality check agree on 374 of 374 generated items less the music21 pentatonic gaps; they agree because all three answer the same question, "which collection has exactly this pitch-class set, with this tonic", and the tonic is the same input to all three. Their agreement says nothing about whether a piece uses that scale or mode: the 8 real items named a mode or pentatonic have no label in reach.
- *Exact against inferred.* What the notation or recipe states exactly: the pitch-class set of an item or run, the drill's declared collection (recipe), a printed key signature. What is inferred: the tonic (from the key detector), the name of a mode, "the scale the music uses", and for tone rows that a 12-note window is a row. The output of both rules should carry the two apart: set and run (exact), name with tonic (inferred, with the key's confidence), and for tone rows `ordered_windows` (found) separate from `tone_row_technique` (agent).
- *A method that answers a slightly different question.* Pitch-set naming answers "which collection equals this set". The page asks which scale or mode a passage uses. A major-key piece with one secondary dominant has 8 pitch classes and is, correctly, named nothing; a piece whose set is a diatonic set is "ionian on its key", which is the key, not a scale used; a set equal to a mode's set with that mode's tonic (Guantanamera: "mixolydian on A") may come from a secondary dominant (reading, not checked in the score). Containment names too many scales (music21 as returned: a false name for all 48 five-finger patterns). The current rule already keeps set membership (item level, equality), run recognition (`scale_runs`) and the governing key apart; this comparison confirms that separation and adds nothing that merges them.

## 7. Limits

- The real-item expected answers for `scale.collection` are derived from the set and the title's tonic with the project's own table, so the current detector cannot fail them except through the tonic; the generated items are the only independent truth (the recipe). 145 of the 226 titled real items are "all twelve", 4 are diatonic.
- The 8 real modal or pentatonic names have no truth in reach; Scarborough Fair and Swing Low are readings.
- Tone-row positives are built from a table of rows, not scores: the constructions are the validators' (one line, chords split across hands) plus one more; real twelve-tone piano writing (rows with repeated, omitted or displaced notes, several voices, partial statements) is untested. The only real atonal scores are two Schoenberg Op. 19 pieces, which are not serial.
- The "row stated" for the 68 catalogue items is "none", on the basis of their being tonal repertoire or chromatic drills (reading: composer, title, key in the title); no score of the 68 was inspected bar by bar.
- Fix F is in-sample.
- The music21 `deriveRanked` blues result depends on the spelling passed (8 of 16 with the score's spelling, 10 of 16 sharps-only), which shows the class is not reliable rather than which spelling is right.
- Timings were taken while other jobs ran on the machine and, for the first scripts, with 12 worker processes; reruns use at most 3 (`Pool(3)`, three subprocesses in `row_drive.py`), after the machine ran out of memory; 17 `row_drive.py` tasks died of memory pressure and were re-run one at a time by `row_retry.py` (their first errors are kept in the results file).
- One run of each; the methods are deterministic.

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

## 9. Recommendation

scale.collection: code + agent — code names the pitch-class set and run exactly and offers its collection name with the tonic from the key (the current detector, which is level with Tonal given the tonic: 374 of 374 generated items and 942 of 942 runs, and refuses all 326 real sets of 8 to 11 pitch classes where Tonal's exact match, with no tonic given, names 102 of them as bebop or similar; music21 deriveRanked misses the blues and minor pentatonic collections, 13 of 374), but whether a real passage uses that mode or only that key has no label in reach (8 real items given a mode or pentatonic name, none labelled), so the agent decides mode versus key.
pitch.tone-row: code + agent — code flags ordered 12-pitch-class windows and candidate windows (current detector with fix F recognises 71 of 71 built one-line rows with 0 false rows in 1,985 items; the window trigger sends 12 of 12 split-hand rows to the agent, but 12 of 12 repeated-note rows are missed by both code paths), and the agent decides whether tone-row technique is present, because music21 with the row taken from the piece finds 47 of 68 tonal items "serial" and with its table of known rows gives no false find but takes a median 389 s a piece and finds only rows already in its table.
