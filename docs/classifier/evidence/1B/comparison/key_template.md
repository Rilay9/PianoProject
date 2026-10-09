# key.tonic-mode and key.change: the current detectors against existing tools (pilot on two characteristics), 2026-10-08

**What this is.** The bounded comparison of handoff step 3, run on two characteristics only (`key.tonic-mode`, `key.change`). Nothing is rewritten: this page measures the project's current detectors against the tools named in `docs/classifier/tools-survey.md` section 1, on annotated ground truth (When in Rome) and on the project's own scores, and ends in one recommendation line per characteristic. Base commit 0fb1d9e3. Every figure below was produced by a script in this folder (named under each table); nothing is copied from the validation pages. Where this page reproduces a figure the validation pass already gave, it says so.

**Labels.** *measured*: a script in this folder produced it on the data named. *reading*: from the text of a page or a standard analysis, not run. Nothing here has been heard.

## 1. What was compared

**Current detectors** (the chunk-1 validators' re-implementations, called unchanged; `cur_detector.py` wraps them):
- `key.tonic-mode`, *first version*: `rules/harmony.py` `analyse(sc).key`. *Corrected*: `validation/keyfix.py` `infer_key2` (the corrected ending vote). Both read the score through the project's reader (`tools/classifier/score.py`, partitura).
- `key.change`: `validation/t_kc.py`'s method (a partitura `estimate_key` window over bars b-1..b+2 per bar; a key area = 4 or more bars in one key different from the home key; an area is *confirmed* by a cadence in the new key; the *corrected* version drops an arrival on the home dominant when the home tonic triad or the home leading tone sounds within 2 bars). Its helper functions are executed from the source unchanged; the loop body is `cur_detector.kc_areas`. Four series are reported: the raw windows, all areas, areas confirmed by a cadence (first version), areas confirmed after the exclusion (corrected).

**Existing tools run** (survey section 1):
- music21 10.5.0 global key: Krumhansl-Schmuckler, Aarden-Essen, Bellman-Budge, Temperley-Kostka-Payne (`stream.analyze('krumhansl'|'aarden'|'bellman'|'temperley')`); partitura 1.9.0 `estimate_key`.
- music21 local key: `analysis.floatingKey.KeyAnalyzer` (window 4, its smoothing; its raw one-bar key is reported too) and 4-bar windows (bars b-1..b+2, the current detector's window) with Bellman-Budge and with Aarden-Essen. (`analysis.windowed.WindowedAnalysis` windows by quarter length, not by bar, so bar windows were cut with `Stream.measures`.)
- AugmentedNet (MIT, `AugmentedNet.hdf5` v1.9.0 of the repo): see section 2.
- justkeydding: not run, see section 2.

**Ground truth.**
- *When in Rome* (CC BY-SA 4.0), shallow sparse clone of `github.com/MarkGotham/When-in-Rome` at commit 1c61fe41b8c2910296d7d2bcbf6476c7c1f2fe35 into `build/when-in-rome/` (the Lieder, orchestral, quartet, choral and chamber corpora were left out of the checkout: not keyboard, and one Lieder path exceeds the Windows path limit). Rule, fixed before any method was scored (`wir_select.py`): a piece is eligible if its directory holds a RomanText analysis (`analysis.txt`, or `analysis.rntxt` in the textbooks) and a local `score.mxl`; group K = every eligible piece under `Keyboard_Other` and `Piano_Sonatas` (80 selected: Bach WTC I 24, Chopin 3 (Prelude Op. 28 No. 20, Etudes Op. 10 Nos. 1 and 12), Mozart sonata movements 53), then group T = textbook pieces of at least 8 bars (8 is the current key.change detector's own minimum; 14 selected: Aldwell 1, Kostka 7, Rimsky-Korsakov 4, Tchaikovsky 2), to a cap of 200. The cap was not reached: **94 pieces, 8,523 analysed bars** (8 to 318 bars a piece). One Mozart analysis (K311/2) does not parse in music21 and is out. The 187 textbook pieces under 8 bars are out, among them all 117 of Reger's *Modulation* examples, the corpus nearest to "key modulations": they are 1 to 3 bars long, so each has one transition and a bar-resolution test with a tolerance of one bar cannot use them (this length clause was added after a 3-piece pilot showed it; it is a property of the data, not of any result). Many When in Rome pieces (Beethoven sonatas, Chopin mazurkas, Grieg, Liszt and others) hold only `remote.json`, a pointer to a score not in the repository: not usable.
- Global key = the analysis's first key. Local key at bar b = the key of the RomanNumeral on beat 1 of bar b if there is one, else the key of the last RomanNumeral before the bar (`wir_select.py`, music21 `converter.parse(..., format='romanText')`). Bars are matched to the score by measure number.
- *Our catalogue*, `key.tonic-mode`: every item `validation/t_keys.py` gives a reference key (its `reference()` executed unchanged): generated items from the recipe's `keySig` (1,056), real items from the key in the title, six titles corrected (228): 1,284 items in all (validation row 5 counts 1,282 readable ones; two are the reader failures named in section 2). Skipped by t_keys: the families without a single key (seventh arpeggios, chromatic, rhythm, clave, meter, syncopation, modal vamp).
- *Our catalogue*, `key.change`: the items named in validation row 7. Where each expected answer comes from: **Mozart K. 545 i and WTC I Prelude 1**, the When in Rome annotation of the same work (expected areas = runs of 4 or more bars whose annotated key differs from the annotated global key; the catalogue score is another edition, bar counts are printed); **Bach Inventions 1 to 15**, reading (every Invention modulates to the dominant or the relative key; there are no annotated Inventions in When in Rome: its Bach keyboard folder holds WTC I and II only); **Happy Birthday (piano, PDMX)**, reading (a V/V to V half cadence in C major: no modulation).

{{frag_methods_notes}}

## 3. key.tonic-mode results

### 3.1 When in Rome (`wir_run.py`, `wir_metrics.py`; per-piece data in `wir_results.json`)

Exact = tonic and mode equal to the analysis's first key. *fifth* = the dominant or subdominant, same mode. *abstain* = the method returned no key (UNKNOWN). *no result* = the method could not run on the piece: for the current detector, the project's score reader raised on it (`score.py` line 109, the fault already listed in `rules/area-1B.md`). "Wrong" in the witness paragraphs counts an UNKNOWN answer as wrong. The textbook pieces are short exercises that modulate, so "the first key" is a weak target for any method that reads the whole piece (the profiles); read that block with the keyboard block, not instead of it.

{{frag_wir_tonic}}

### 3.2 Our catalogue (`cat_keys.py`, `cat_metrics.py`; per-item data in `cat_keys_results.json`)

{{frag_cat_tonic}}

## 4. key.change results

### 4.1 When in Rome, every bar (`wir_run.py`, `wir_metrics.py`)

{{frag_wir_local}}

### 4.2 Named catalogue items (`cat_kc.py`, `cat_metrics.py`; data in `cat_kc_results.json`)

{{frag_cat_kc}}

## 5. Runtime

{{frag_wir_time}}

{{frag_cat_time}}

{{frag_conclusions}}

## 10. Recommendation

key.tonic-mode: code + agent — the current detector's first version answers (97.3% of 1,056 generated, 94.3% of 228 real, level with or above every tool tried: best music21 profile 90.4% real, AugmentedNet first key 91.6% real), but only where it equals Bellman-Budge and AugmentedNet's first key (273 items accepted, 0 wrong; 76 sent to the agent, 7 UNKNOWN), because 4 real minor-key items are answered with the relative major and pass a Bellman-Budge check alone.
key.change: code + agent — nothing tested decides it alone: AugmentedNet is the best proposer (89.4% bar agreement on 94 When in Rome pieces, 84.2% on the 17 it was not trained on; modulations within one bar precision 52.6%, recall 67.0%) against the current area-and-cadence rule (precision 37.0%, recall 22.2%, corrected rule recall 12.4%), so its local key, with the current areas as a second proposer (recall 74.8%), should flag the areas and an agent should decide modulation, tonicisation or prolonged dominant and the relation.
