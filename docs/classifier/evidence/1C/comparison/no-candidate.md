# item.format, reading.accidental-kinds, rhythm.tuplets-other, rhythm.cadenza: the current detectors against the smallest fix each failing row points to (handoff step 3, the four with no tool in the survey), 2026-10-08

**What this is.** The bounded comparison of handoff step 3 for the four characteristics that failed in chunk 1 and for which `docs/classifier/tools-survey.md` names no existing tool (rows and section 22.0). Same method as the pilot (`docs/classifier/evidence/1B/comparison/key.md`): the expected answers were written before any run (`expected_format.json`, `expected_osmd.json`, `expected_tuplets.json`, `expected_cadenza.json`, in this folder); every figure below comes from a script in this folder (named under each table); what did not run is in section 6; the outside review's corrections are applied in section 8; one recommendation line per characteristic ends the page (section 9). Nothing is rewritten and no area page, survey or validation file was edited. Base commit c47f18c7. **Nothing here has been heard.**

**Labels.** *measured (script)*: that script produced it on the data named. *reading*: from a page or the code, not run.

**Reuse line (CLAUDE.md first rule).** The survey names no tool for `item.format`, `rhythm.tuplets-other` and `rhythm.cadenza`; for `reading.accidental-kinds` the reader is the app's own renderer, OpenSheetMusicDisplay 2.1.2, which this page measures. The "current detector" in each section is the chunk-1 validators' implementation of the rule, **called unchanged** (`run_unchanged.py` runs their scripts; where a script cannot be run in place a one-line-changed copy is named and its output is checked against the validators' committed output). Each fix is the smallest change the row's own evidence points to and is coded as a wrapper around that detector, never as a new detector.

## 1. Inputs, fixed

- Repo base commit c47f18c7a45af3b2e6b013d290dfc87a39de5f80 (worktree `agent-aa9b57f3976710ef4`, `git status` clean apart from this folder). Python: the repo `.venv` (3.11.9, music21 10.5.0, partitura 1.9.0; the detectors here use neither beyond the validators' own imports). Node v24.19.0; OSMD **2.1.2** and jsdom 30.0.1 from `app/node_modules` of the main checkout (read only).
- Catalogue: `app/public/content/` (built catalogue and scores, gitignored) copied from the main checkout into the worktree; `catalog.json` sha256 E683E6B1597BA8DFC3F9331DEAE40316FA091B7A5AC9C19F88EF7344514479A6 (identical to the main checkout's). 2,100 entries, **2,020 with a score file** (1,211 generated, 524 PDMX ids, 285 other). The copy reproduces the validators' own committed output: `tup_copy.py` gives `tup.txt` byte for byte (`out/f3_tup_copy.txt` against `evidence/1C/validation/tup.txt`), `run_unchanged.py 1C cadenza.py` gives their `cadenza.txt` (46 lines, identical), `survey_osmd.py` gives their 839 / 1,054, 290 / 954 and 8,868 / 15,484, `survey_last.py` their 27 + 1 UNKNOWN layouts, `same_all.py` their 544 of 544 identical sources (`out/f1_check.txt`, `out/f2_survey_osmd.txt`, `out/f4_same_all.txt`) [measured].
- The validators' scripts read the catalogue from their own build folder; two small shims point them at the worktree copy (`shim1a/walk.py`, `shim1c/common.py`: only the lines marked SHIM differ; the walk and every function are theirs). Raw render output, unzipped XML and the walk cache are under the worktree's gitignored `build/`.
- Nothing was running that changes these inputs except two sharded render jobs of this folder's own `f2_full.py`, which only read them.

## 2. item.format (area 1A)

**Current detector.** `evidence/1A/validation/r_format.py` `fmt_measures` (layout rules 1 to 4), with the UNKNOWN-layout rule as `survey_last.py` runs it (one part, two staves, chord symbols, lower staff silent in at least half the bars). `f1_format.py` calls `fmt_measures` unchanged and repeats the UNKNOWN rule line for line; against the validators' unchanged `survey_last.py` it gives the same 28 ids, and against their unchanged `survey_format.py` it gives the same table once those 28 are set aside (`out/f1_check.txt`) [measured: f1_check.py].

**The two smallest fixes the row points to.**
- *A, lead sheet.* Rule 3's "fewer than 10 per cent of onsets sound two notes or more" raised to 20 per cent (the row: Blue Bossa 11.8 per cent). `survey_lead.py`'s unchanged output shows every symbol-bearing one-staff real file: lead sheets sit at 0.0 to 0.099 (Tishomingo Blues 0.099), and only two with symbols come out *piano score (one-hand part)*: Blue Bossa 0.118 and `song.folk.the-flute-tune-soulpride-remix.pdmx` 0.275 [measured: out/f1_before_survey_lead.txt]. Blue Bossa's two-note onsets are 9 of 76 and sit in bars 29 to 31, the harmonised tag; the Flute Tune's 14 of 51 are spread over bars 3, 4 and 10 [measured: f1_where.py].
- *B, UNKNOWN layout.* The rule is not applied to generated items (a generated layout is code's: the file's rule-4 answer, "piano score"; no family-to-layout table was read, the generator names its family in `provenance.generator.family`, e.g. `montuno`, `ii_v_i`). It stays for real scores.

**Named items (expected written first, `expected_format.json`)** [measured: f1_format.py, out/f1_format.txt]:

| item | expected | before | after the fix |
| --- | --- | --- | --- |
| `song.jazz.kenny-dorham-blue-bossa.pdmx` | lead sheet | piano score (one-hand part): **wrong** | lead sheet: right |
| the 12 `exercise.ii-v-i.*.rootless` and 15 `exercise.montuno.*` | piano score, code's | UNKNOWN: **wrong** (27 of 27) | piano score: right (27 of 27) |
| Silent Night (Gruber), `song.folk.so-danco-samba.pdmx` | lead sheet | lead sheet: right | unchanged, right |
| `exercise.clave.bossa` | piano score (rhythm staff) | right | unchanged |
| Amazing Grace SATB | hymn in parts | hymn candidate 4(a): right | unchanged |
| Joyful, Joyful (Beethoven), Holy, Holy, Holy (Hugg) | hymn in parts | hymn candidate 4(b): right | unchanged |
| Take Five, `exercise.comping.a.anticipated.intro`, Chopin op. 10 no. 6, Ballade 1 | piano score | piano score: right | unchanged |
| `song.folk.muskrat-ramble.pdmx` | UNKNOWN (grand-staff lead sheet) | UNKNOWN: right | unchanged, right |
| Duvernoy op. 176 no. 11 | piano score | hymn candidate 4(b): passed to the agent, as the page says | unchanged |
| Kreutzer, the violin gavotte, the trombone solo | other-instrument flag | flagged: right | unchanged |
| the Flute Tune | no flag | flagged "Flute": **wrong** | unchanged (the title-word rule is not touched) |
| music21 `bach/bwv66.6.mxl` | hymn in parts by rule 2 | voice-named parts: right | unchanged (`corpus_lyr.py`, unchanged: out/f1_corpus_lyr.txt) |

**Catalogue-wide, 2,020 items** [measured: f1_format.py, out/f1_format.json (every item, before and after)]:

| layout | before | after |
| --- | --- | --- |
| UNKNOWN | 28 (27 generated, 1 PDMX) | 1 (PDMX, Muskrat Ramble) |
| lead sheet | 80 (65 PDMX ids, 15 other) | 81 (66, 15) |
| piano score (one-hand part) | 50 (1 generated, 35 PDMX, 14 other) | 49 |
| generated piano score | 1,155 | 1,182 |
| every other layout (rhythm staff 28, hymn candidates 4(a) 7 and 4(b) 4, other piano scores) | | unchanged |

Exactly 28 items change, the 27 generated and Blue Bossa; the other 1,992 do not. **Robustness of the cut** [measured: f1_format.py, out/f1_format_sweep.json]: any cut from 0.12 to 0.27 gives this same catalogue (one item newly a lead sheet); 0.10 and 0.11 change nothing; 0.28 and above also take the Flute Tune (0.275). The choice of 20 per cent is therefore **one positive and one boundary item**, not a tuned threshold; the Flute Tune's true layout was not examined (reading: unverified).

**Not changed, still open (from the row):** Duvernoy and the Flute Tune title word pass to the agent; the 4(b) rhythm condition has no number. Neither is touched by the fix.

## 3. reading.accidental-kinds (area 1A)

**The three readers.** *model*: the rule's own model of which accidentals are shown (`common.accidental_model`, class required / courtesy / courtesy_marked / missing = shown, in_file_not_shown = not shown). *emulation*: `osmd_emul.osmd_model`, the validators' re-implementation of OSMD 2.1.2 `checkAccidental`. *render*: OSMD 2.1.2 itself, rendered under jsdom with a stubbed canvas by `osmd_acc.cjs`, listing each graphical note's `DrawnAccidental`; the render is what the app draws and is the reference here. `f2_osmd.py` calls the validators' `compare()` (model against render) and `run()` (emulation against render) unchanged, renders each file once (output cached), and adds one uniform per-note table for both readers (key: bar, staff, onset, letter, octave; single-part files, as the validators' scope).

**Expected, written first** (`expected_osmd.json`): the named items agree with the render except the chromatic example; the emulation equals the render on at least 26 of 30 new files and the model on at most 22; the NIFC misalignment is a bar-numbering or timeline effect.

**Named items** [measured: f2_osmd.py named, f2_named_detail.py]:

| item | model against the render | emulation against the render |
| --- | --- | --- |
| `exercise.blues-scale.b-flat.1oct.right` | agrees (the second A-flat5 is not drawn, as the check said) | agrees |
| `exercise.chromatic.d.1oct.right` | **disagrees on 2 notes** (bar 2, the C5 and the B4 that carry a file accidental: model "in the file, not shown", render draws them) | agrees on all 25 |
| `exercise.scale.g-sharp-harmonic-minor.1oct.similar.both.2` (double sharps) | agrees | agrees |
| Debussy, The Little Shepherd (parenthesised courtesy accidentals) | agrees on 401 | agrees on 401 (4 render-only notes: grace notes) |
| Silent Night (Gruber) | agrees (no accidental) | agrees |

**The validators' sample, re-run** (`osmd_compare.py sample` logic, seed 7: 12 generated, 12 PDMX ids, 6 other; same files as the validators' row, 30 of 30 rendered) and **30 new files** (seed 11, none of the first 30; the emulation was written after seeing the first 30, so the new 30 are the out-of-sample test) [measured: f2_osmd.py sample7 / sample11, f2_summary.py, out/f2_summary.txt]:

| | files | notes matched to the render | model: notes with a file accidental that it gets wrong | emulation: same | files exact: model | files exact: emulation |
| --- | --- | --- | --- | --- | --- | --- |
| seed 7 (the validators') | 30 | 12,017 | 156 of 1,145 (13.6%); the render draws 148 of them that the model calls not shown | 18 of 1,153 (1.6%), all in the 2 unaligned files | 22 of 30 | 28 of 30 |
| seed 11 (new) | 30 | 14,077 | 132 of 1,907 (6.9%); the render draws 127 of them that the model calls not shown | 18 of 1,928 (0.9%), all in the 1 unaligned file | 19 of 30 | 29 of 30 |

On every file that aligns (28 of 28, then 29 of 29) the emulation equals the render on every matched note. The model is wrong on 8 and 11 files (and, by pipeline, on generated 1 + 2, PDMX 4 + 4, other 3 + 5 files: out/f2_summary.txt).

**Why the two NIFC files did not align (and a third).** Not an error of the emulation: an offset in the render's time axis [measured: f2_nifc.py, f2_nifc2.py, f2_nifc3.py]. The validators key notes by absolute onset. In `chopin-nocturne-op55-2.nifc` the first bar of the render starts its second bar at 6.5 quarters where the walk says 6.0, and every later bar is 0.5 late (and 1.0 late after a second such bar); the same in `chopin-scherzo-2.nifc` from bar 180 and in `chopin-mazurka-op7-3.nifc` from bar 28 of the new sample. Cause: in these files a pair of grace notes closes a bar (they belong to the first note of the next bar and are written at the end of the one before; the Nocturne's bar 1 ends with two eighth-note graces, bar 1 `<grace slash="yes">` x2 at t=6.0), OSMD gives that group a slot in its timeline (+0.5 quarter here) while the walk gives grace notes no duration, so every absolute time after it differs. Test of the mechanism: re-key both sides by the onset relative to the first note of the bar. The Nocturne goes from 43 matched notes to 1,347 with 0 emulation-only notes (the 26 render-only notes are all grace notes, which the emulation skips); the mazurka from 488 to 1,225 (0 emulation-only; 10 render-only, all grace); the Scherzo from 1,528 to 6,401 (9 emulation-only and 9 render-only notes that are not grace notes remain unexplained: 9 of 6,410). The walk found end-of-bar grace groups in exactly 2 bars of the Nocturne, 2 of the Scherzo and 2 of the mazurka, and in none of the Fantaisie-Impromptu, which aligned. So the emulation and the render agree wherever they can be paired; the drift is a timeline effect of end-of-bar grace notes.

**Catalogue-wide, every single-part file rendered** [measured: f2_full.py (two shards, about 67 minutes in all), f2_summary.py full, f2_full_detail.py; out/f2_full_summary.txt, out/f2_full_detail.txt, out/f2_full_0/1.json]. 2,019 single-part files (the one two-part file, Ballade No. 1, is outside both scripts' scope); **2,011 rendered and compared, 8 render failures** (5 generated: `exercise.open-voicing.b-flat.add9`, `.c.add9`, `.e-flat.quartal`, `exercise.ostinato.e.arpeggio`, `exercise.loop4.e.root`; and `song.beautiful.g-minor-bach.alt`, `song.classical.joplin-search-light-rag.pdmx`, `song.classical.mendelssohn-venetian-gondola-song-op-19-no-6.pdmx`; cause not traced). Render time on this machine, two jobs at once and other work running: mean 4.0 s a file, longest 33.7 s (not a general figure).

| | notes matched | disagree with the render | notes with a file accidental | disagree (of those) | files exact |
| --- | --- | --- | --- | --- | --- |
| model (the rule's own) | 678,280 | 9,064 (1.34%) | 76,813 | **8,543 (11.1%)**: the render draws 8,295 the model calls not shown, the model shows 248 the render does not | 1,591 of 2,011 (generated 1,119 of 1,206; PDMX 384 of 522; other 88 of 283) |
| emulation | 678,972 | 1,041 (0.15%) | 77,299 | **676 (0.9%)**: 364 shown not drawn, 312 drawn not shown | 1,938 of 2,011 (generated 1,206 of 1,206; PDMX 508 of 522; other 224 of 283) |

The emulation differs from the render in 73 files: 28 (26 "other", 25 of them `.nifc`, and 2 PDMX) where the notes do not pair (the end-of-bar grace drift above was tested on 3 of them only; reading: the same cause), and **45 where the notes pair and the emulation still differs by 1 to 6 notes** (for example Moonlight III 6, Mazurka Op. 17 No. 4 5, Ballade No. 4 PDMX 5; cause not traced). The 60-file samples showed none of these; the catalogue-wide render does. So the emulation is a good approximation (99.85% of notes) and **not** the render: it is not an authority for what is drawn. By the emulation alone (`survey_osmd.py`, unchanged) OSMD draws 839 of the 1,054 PDMX-id file accidentals the model calls not shown, 290 of 954 generated, 8,868 of 15,484 other, as in the row [measured: out/f2_survey_osmd.txt]; the render itself gives the same order of error (8,295 drawn that the model calls not shown, over all 2,011 files).

## 4. rhythm.tuplets-other (area 1C)

**Current detector.** The page's two noise rules as the validators ran them (`tup.py`, reproduced byte for byte by `tup_copy.py`, `out/f3_tup_copy.txt`): a ratio a:b within 5 per cent of 1 is noise, and a closed bracket holding fewer notes than a is noise. Applied here at the level of one row per item and ratio (`f3_analyse.py`): a group is noise if its ratio is within 5 per cent, or if every closed bracket of that ratio holds fewer than a notes. Scope: 413 item-ratio groups in 249 items, 48,345 notes; **182 groups of other ratios than 3:2** in 80 items (5,851 notes). `f3_scan.py` reads every file's `<time-modification>` and `<tuplet>` elements (brackets tracked by part, voice and number, so a bracket that crosses a bar line or runs from one staff to the other, as Ballade No. 1 bar 247 does, closes; the validators' tracker could not).

**The fix the row points to, in the variants measured** [measured: f3_scan.py, f3_analyse.py, f3_named.py]:
- *A*: a ratio is a tuplet only if a closed `<tuplet>` start..stop bracket of that ratio exists in the file (any attributes).
- *B*: the same, and the bracket draws something (`bracket` not "no" or `show-number` not "none").
- *D*: A, and the bracket encloses two or more notes or rests, and a is not b (ratio 1). This **replaces** the 5 per cent bound and the fewer-notes test. The two-note clause is a reading of the four artefacts that A leaves (below), not an independent finding.
- Also tried, to see whether they would do better: A with the 5 per cent bound kept, A with the 5 per cent bound and a "written values add up to a x 2^k" test, and A with the bound and a two-note bracket (called C: same catalogue result as D).

**Expected, written first** (`expected_tuplets.json`): reading only printed brackets drops every named artefact and keeps every named real figure; the fewer-notes test is gone so the 576 brackets it flagged stop being flagged; the cost to measure is the real tuplets with a time-modification and no `<tuplet>`.

**Named cases (14 real figures, 21 artefact ratios; the truth is the validators' reading of the page: a real printed figure, or a re-export ratio)** [measured: f3_named.py, out/f3_named.txt, out/f3_named.json]:

| reader | real figures kept (of 14) | artefact ratios dropped (of 21) | real dropped | artefacts kept |
| --- | --- | --- | --- | --- |
| current (5% bound + fewer-notes test) | 13 | 8 | 1 (Moonlight III 7:4: 4 brackets, each "short") | 13 |
| A, any closed bracket | 14 | 14 | 0 | 7 |
| B, bracket drawn | 9 | 14 | **5** (Ballade No. 1 39:32, 28:16, 21:16, 29:16 and Moonlight III 7:4 have brackets that draw nothing) | 7 |
| A with the 5% bound | 14 | 17 | 0 | 4 |
| A, 5% bound and the sum test | 12 | 21 | 2 (Moonlight III 7:4, Berceuse 11:8) | 0 |
| **D** (bracket of 2+ notes, a not b) | **14** | **21** | **0** | **0** |

The 13 artefacts the current rules keep are the 12 *Malagueña* ratios named on the row (160:107, 80:53, 120:67, 48:43, 320:179, 320:301, 60:53, 640:321, 320:161, 15:14, 20:17, 480:371) and Ain't Misbehavin' 24:17: none has a bracket (`<tuplet>`) at all. The four that A leaves (O mio babbino caro 320:239 and 160:119, Ain't Misbehavin' 40:37, the Silent Night trombone duet 12:11) are each one note inside a bracket, which the "two or more notes" clause removes; the fewer-notes test also removes them but also removes 576 brackets in all.

**Catalogue-wide, 182 groups of ratios other than 3:2, current against D** [measured: f3_analyse.py, out/f3_analyse.txt, out/f3_groups.json]:

| current | D | groups | notes |
| --- | --- | --- | --- |
| tuplet | tuplet | 124 | 5,476 |
| tuplet | not printed | 29 | 95 |
| noise | tuplet | 11 | 215 |
| noise | not printed | 18 | 65 |

(124 + 29 + 11 + 18 = 182.)

- The 11 groups the current rules call noise and D keeps are the fewer-notes test's false positives: Moonlight III 7:4 and 15:8, Ballade No. 1 12:6, Fantaisie-Impromptu (PDMX) 9:4, Nocturne 20 8:2, Nocturne Op. 55 No. 1 7:4, Prelude Op. 28 No. 1 6:4, Raindrop Prelude 5:4, O mio babbino caro 5:4, Ain't Misbehavin' 12:8, the trombone duet 6:4 (1 to 100 notes each).
- **The fewer-notes test, on the whole catalogue:** 15,255 closed brackets, 576 flagged (393 of ratio 3:2, 74 of 5:4, 66 of 6:4); those are tuplets with mixed values (a quarter and an eighth make a 3:2 triplet with two notes) and rests, not noise. D flags none of them; 53 brackets enclose a single note (14 items), of which the artefacts above are the ratios 160:119, 320:239, 40:37, 12:11, 160:157, 48:47, 96:95, 160:159, 80:79, 40:39.
- **Cost of D** (real tuplets it would not see) [measured]: 17,847 of 48,345 notes with a `<time-modification>` carry no `<tuplet>` element themselves (the middle notes of a bracket), but **no 3:2 group lacks a bracket** (231 of 231 have one; 230 have one of 2+ notes, the 231st is the trombone duet's single note) and the 31 groups of all ratios with no closed bracket at all are all of other ratios (14 of them named artefact groups).
- **What D drops, exactly** (`f3_dropped.py`, `out/f3_dropped.txt`): of the 182 groups D keeps 135 and drops 47 (160 notes): 21 named artefact groups (56 notes), 2 groups of ratio 1 (the Ständchen's 8:8 and 2:2, 18 notes, which the page already lists as noise), 5 unnamed single-note groups within 5 per cent of 1 (Ballade No. 4 40:39, *Malagueña* 320:319, Ain't Misbehavin' 48:47, 96:95, 160:157), and **19 unnamed groups of 81 notes that nobody has read in a score: unverified as music** (16 of them current kept, 3 current called noise): Brahms Op. 118 No. 2 12:7 (1 note); Ballade No. 4 7:4 (6), 20:11 (1) and 5:4 (3); the Raindrop Prelude 7:2 (12 notes) and 20:11 (2); Clair de Lune 12:27 (2); Debussy Première Arabesque 12:7 and 6:5 (3 each); Rêverie 6:5 (1); Elgar Nimrod 2:1 (1); *Malagueña* 6:5 (2) and 20:11 (2); Mendelssohn Op. 30 No. 1 12:7 (3); O mio babbino caro 7:4 (12) and 20:11 (2); *Super Mario Land 2* 2:1 (14); Ain't Misbehavin' 11:8 (10) and 5:3 (1). Eleven of the 19 sit in bars that also hold a named artefact ratio (Ballade No. 4 bars 156 and 157, Raindrop bars 4 and 23, O mio babbino caro bars 50 and 51, Ain't Misbehavin' bar 12, *Malagueña* bars 61, 69 and 118), reading: probably the same re-export fault. None has a closed bracket of two notes, so a learner sees no tuplet sign on them; whether the file's durations are meant is not shown here.
- **Irregular figuration passed to `rhythm.cadenza`** (11 or more actual notes, or 9 or more at more than twice the density, not 12, 16, 24, 32): current 43 groups in 15 items, D 28 groups in 13 items.

**Limits.** The truth for the 35 named cases is the validators' page reading, not a score edition. D's two-note clause and the choice of requiring a bracket were both set from the named failures; the 19 unnamed drops are the only unselected evidence and are unverified. A bracket that exists but draws nothing (1,195 closed brackets with `bracket="no"` and `show-number="none"`) still counts as printed under D: for `rhythm.cadenza` that is wanted (Ballade No. 1's fioriture are among them), for the tuplet signs a learner reads it is not, and variant B shows what that costs.

## 5. rhythm.cadenza (area 1C)

**Current detector.** The page's candidate routes: cue-size runs spanning a beat or more, grace runs of 6 or more, irregular tuplets, cadenza words (the fifth route, a cadenza bar from `notation.times`, was not run, section 6). The validators' `cadenza.py` implements the four routes **from the item's own file** and is called unchanged (it reproduces their `cadenza.txt`, 46 lines, identical: out/f4_cadenza_unchanged.txt) [measured]. The page as written differs in two places, which are the two things the row names, and `f4_cadenza.py` rebuilds them around the validators' code (BEFORE; reading of the page plus measured parts):
- *cue route*: reads "the PDMX source file mapped by `content/sources/pdmx.json`"; an item with no mapped source answers UNKNOWN (not asked of generated items: no cue by the family list). The mapping holds 544 ids of the catalogue; each mapped source is **byte-identical to the app's file** for the same id (544 of 544; `same_all.py` unchanged: out/f4_same_all.txt), so the "source" is the app's own file.
- *irregular route*: receives the ratios `rhythm.tuplets-other` leaves (not within 5 per cent, not removed by the fewer-notes test). The validators' own script instead takes `<tuplet type="start">` notes only, with no noise rule (it never sees the *Malagueña* ratios, which have no bracket, but lets single-note brackets through).

**The two fixes (AFTER).** (1) The cue route reads the item's own file in every pipeline, the rep items included. (2) The irregular route takes the tuplets of fix D of section 4 (a closed bracket of two or more notes, ratio not 1). Grace and word routes are unchanged.

**Expected, written first** (`expected_cadenza.json`): the page's cue route is UNKNOWN for every rep item; reading the item's own file gives a candidate wherever the file carries cue runs; the artefact ratios of *Malagueña*, O mio babbino caro and Ain't Misbehavin' stop producing irregular candidates and every named real positive stays.

**Cue route** [measured: f4_cadenza.py, out/f4_cadenza.txt, out/f4_items.json, out/f4_runs.txt]:

| pipeline | items | own file has a cue run of a beat or more | page: candidate / UNKNOWN / none | AFTER: candidate |
| --- | --- | --- | --- | --- |
| generated | 1,211 | 0 | 0 / 0 / 1,211 | 0 |
| PDMX ids | 524 | 10 | 10 / 4 / 510 | 10 |
| other | 285 | 9 | 0 / 261 / 24 | 9 |
| all | 2,020 | 19 | 10 / **265** / 1,745 | 19 |

The page answers UNKNOWN for 265 items, among them 9 that carry cue runs in their own file: Ballade No. 1, Moonlight III, Liebestraum No. 3, *La Campanella*, Clair de Lune, Bach's Toccata BWV 565 (a 64-note run), WTC I Prelude 2, Beethoven Symphony 5 (piano) and a Petzold minuet. After the fix none is UNKNOWN. The 19 items carry 100 candidate runs; 40 are in the Fantaisie-Impromptu PDMX file (cue half and quarter notes in the left hand, a piece without a cadenza: the row's near-miss, unchanged by the fix), 9 in *Malagueña*, 7 in Ballade No. 4, 7 in a national-anthem arrangement.

**Irregular route** [measured]: items with an irregular ratio, validators' script 16, page as written (BEFORE) 15, AFTER 13. BEFORE keeps 13 *Malagueña* artefact ratios (120:67, 15:14, 160:107, 20:11, 20:17, 320:161, 320:179, 320:301, 480:371, 48:43, 60:53, 640:321, 80:53), a 20:11 in each of Ballade No. 4, the Raindrop Prelude and O mio babbino caro, and Ain't Misbehavin' 11:8; AFTER keeps none of them, and adds Moonlight III 15:8 and the Fantaisie-Impromptu PDMX 9:4 (the fewer-notes test had removed them; unverified as cadenzas). The real irregular figures stay: Ballade No. 1 (21:16, 28:16, 29:16, 39:32), Berceuse 11:8, Polonaise Op. 53 11:10 and 29:20, Nocturne Op. 9 No. 1 11:6, 20:6, 22:12, Prelude Op. 28 No. 18 11:8, 17:16, 19:10, Nocturne 20 and others.

**Items with at least one code candidate, any route:** BEFORE 38, AFTER 45; gained 8 (the cue-route rep items above except Ballade No. 1, which already had irregular candidates), lost 1 (Ain't Misbehavin': its only candidate was the unverified 11:8 beside the 48:47 and 96:95 artefacts in bar 12). Other routes, same either way: 12 items with a grace run of 6 or more, 9 items with a cadenza word (one is a pedalling instruction, "Pedal Freely").

**Named positives** [measured: f4_cadenza.py]:

| item | route | BEFORE | AFTER |
| --- | --- | --- | --- |
| Ballade No. 4 (PDMX) | cue runs, bar 50 (7 runs; also 120, 135 to 136) | flagged | flagged |
| Nocturne Op. 9 No. 2 | words: "Senza tempo" | flagged | flagged |
| Berceuse (NIFC) | grace run 9 (bar 44), irregular 11:8 | flagged | flagged |
| Polonaise Op. 53 (NIFC) | irregular 29:20 | flagged | flagged |
| Nocturne Op. 9 No. 1 | irregular 11:6 | flagged | flagged |
| Prelude Op. 28 No. 18 (NIFC) | irregular 11:8 | flagged | flagged |
| *Malagueña* (PDMX) | cue runs 61 to 69 (9 runs), words "a piacere" bar 70 | flagged | flagged (the 13 artefact ratios gone) |
| Moonlight III (alt) | grace run of 30, bar 188 | flagged | flagged |
| **Liebestraum No. 3** (rep) | cue runs, bars 25 and 60 (4 runs) | **UNKNOWN, not flagged: wrong** | flagged: right |

So BEFORE flags 8 of 9, AFTER 9 of 9. The remaining wrong answer in the row, the Fantaisie-Impromptu's 40 cue runs, is not a code fault: a cue-size run is a candidate and the agent says whether it is played freely (the page's own split). Code never says "played freely".

**Limits.** No hand-listed truth beyond the nine positives and the near-misses; whether the 8 gained rep items are cadenzas is the agent's call and was not read in the scores. The cue-size route counts runs by duration against the beat, as the validators' script does; no shorter or longer floor was tried.

## 6. What did not run, and why

- **Any further tool search.** The survey rows and section 22.0 name none for the four; none was looked for beyond them. music21 and partitura were not run on tuplets: reading, music21 builds a tuplet from `<time-modification>` as the validators' counts do, so it would carry the same artefact ratios.
- **OSMD in a real browser.** The render is OSMD 2.1.2 under jsdom with the canvas and text measurement stubbed (the validators' set-up), not the app's page in Chromium. Reading: the accidental decision is made in OSMD's calculator before layout and does not depend on widths; not tested.
- **Accidentals on grace notes.** The validators' emulation skips grace notes (the render draws them: the render-only notes counted above); the model's table includes them. Two-part files (Ballade No. 1 is the only one) are outside the single-part scope of both scripts and were skipped.
- **`rhythm.cadenza`:** the route from `notation.times` (a one-bar signature longer than its neighbours) and the "spanning a beat or more" condition on irregular tuplets are not in the validators' scripts and were not run; no cadenza was read in a score; the 8 rep items gained and the 19 unnamed tuplet groups dropped are unverified as music.
- **`item.format`:** purpose words, the other-instrument flags (the Flute Tune stays wrong), the 4(b) rhythm condition and pre-staff notation were not touched; the family-to-layout statement the brief mentions was not looked for as a table (the fix uses the file's own rule-4 answer).
- **Hearing.** Nothing was heard; nothing here is a judgement of how a passage sounds or reads to a learner beyond what the render and the file show.

## 7. Scripts and data in this folder

All paths are in `docs/classifier/evidence/1C/comparison/`; run with the repo `.venv` (`PYTHONUTF8=1`), from this folder; output goes to `out/`. The build needs `app/public/content/` copied into the worktree (section 1) and `app/node_modules` of the main checkout for OSMD (hard-coded in the validators' `osmd_acc.cjs`, copied unchanged to `shim1a/`).

| file | what it does | writes (in `out/`) |
| --- | --- | --- |
| `run_unchanged.py` | runs one of the validators' scripts unchanged against the worktree's catalogue | the unchanged outputs `f1_before_*.txt`, `f1_corpus_lyr.txt`, `f2_survey_osmd.txt`, `f4_cue.txt`, `f4_same_all.txt`, `f4_cadenza_unchanged.txt` |
| `shim1a/walk.py`, `shim1c/common.py`, `shim1a/osmd_acc.cjs` | the validators' files with only the SHIM-marked path lines changed (osmd_acc.cjs not changed) | - |
| `ids.py`, `peek_gen.py` | catalogue id lookup; where a generated entry names its family | - |
| `expected_format.json`, `expected_osmd.json`, `expected_tuplets.json`, `expected_cadenza.json` | the expected answers, written before any run | - |
| `f1_format.py`, `f1_where.py`, `f1_check.py` | item.format: current layout rules and the two fixes over all 2,020 items; where Blue Bossa's and the Flute Tune's two-note onsets are; check against the validators' own tables | `f1_format.json`, `f1_format_sweep.json`, `f1_format.txt`, `f1_where.txt`, `f1_check.txt` |
| `f2_osmd.py`, `f2_summary.py`, `f2_named_detail.py` | accidental model, emulation and render on the named items and two samples of 30 | `f2_named.json`, `f2_sample7.json`, `f2_sample11.json`, `f2_summary.txt`, `f2_named_detail.txt` |
| `f2_nifc.py`, `f2_nifc2.py`, `f2_nifc3.py` | why the NIFC files do not align and the test of the mechanism | `f2_nifc.txt`, `f2_nifc2.txt`, `f2_nifc3.txt/.json` |
| `f2_full.py`, `f2_full_detail.py` | the render of every single-part file, two shards; the files where the emulation differs, the render failures | `f2_full_0.json`, `f2_full_1.json`, `f2_full_summary.txt`, `f2_full_detail.txt` |
| `tup_copy.py` | copy of the validators' `tup.py`, two lines changed (path, output file) | `f3_tup_copy.txt` |
| `f3_scan.py`, `f3_analyse.py`, `f3_named.py`, `f3_single.py`, `f3_dropped.py`, `f3_unverified.py`, `f3_triplets_check.py` | tuplets: every `<time-modification>` and `<tuplet>` in the catalogue, the current rules against fixes A, B, C, D, the named cases, single-note brackets, what D drops | `f3_scan.json`, `f3_groups.json`, `f3_named.json`, `f3_analyse.txt`, `f3_named.txt`, `f3_single.txt`, `f3_dropped.txt`, `f3_unverified.txt`, `f3_triplets_check.txt` |
| `f4_cadenza.py`, `f4_runs.py` | cadenza routes before and after, per item | `f4_items.json`, `f4_cadenza.txt`, `f4_runs.txt` |

## 8. The outside review applied (ChatGPT, relayed 2026-10-08; `docs/prompts/inputs-2026-10-08/chatgpt-review-step3.md`)

The coordinator asked that the recommendations keep what the notation states apart from what it is interpreted to mean, and that a fix scoring well on the named items be checked for answering a slightly different musical question. No new run was made; the figures above are re-read this way. What changes:

- **reading.accidental-kinds: two outputs.** (1) *Encoded*: the file's `<accidental>` elements and the alterations against the signature (exact, read; the model's classes required / courtesy / missing are this layer). (2) *Displayed*: which accidentals OSMD 2.1.2 draws, taken from the render (the existing rendering path); authoritative for teaching. The emulation is a second engraving model; it matched the render on every aligned file of the two 30-file samples but differs by 1 to 6 notes in 45 paired files of the full catalogue and in 28 more it does not pair, so it is allowed only as a cache for files whose emulation has been checked against the render, never as the authority, and it does not cover grace notes. Eight files failed to render and need a fallback (UNKNOWN, or the encoded layer alone). The model's "shown / not shown" is retired as an answer to "what does the learner see" (it was wrong on 8,543 of 76,813 file-accidental notes over the 2,011 rendered files, 8,295 of them accidentals the render draws and the model calls not shown).
- **item.format: facts apart from the label.** The read facts (parts, staves per part, unpitched staves, chord symbols and bars, slash bars, voices per bar, share of onsets with two or more notes, four-note share) are output as they are. "Lead sheet", "piano score", "hymn" are labels over them. The 20 per cent cut that makes Blue Bossa a lead sheet is a label rule fixed on **one positive and one boundary item**; its label is a candidate with the facts attached (24 symbols over 32 bars, one staff, 9 of 76 onsets chordal, all in the last bars), and a harmonised tag never removes the "chord symbols over a melody" fact. For generated items the *layout fact* (one part, two staves, lower staff empty in every bar: the 27 UNKNOWN items are right-hand-only exercises written on a grand staff) is read from the file; "piano score" is the label code gives from the family. Dropping UNKNOWN there removes an uncertainty the generator itself settles; it does not apply to real scores.
- **rhythm.tuplets-other: the printed bracket is the fact; "artefact" is an interpretation.** Fix D is therefore split in two outputs: (1) *printed tuplets*: closed `<tuplet>` brackets of two or more notes, ratio not 1 (read); (2) *unprinted time-modifications*: every other ratio group, **kept in a separate list with its evidence** (notes, bars, whether a bracket exists, whether it draws, number of notes inside, whether it sits in a bar with a known artefact) and flagged to `integrity.notation-sanity`; code does not call them artefacts. The 47 groups D does not keep (160 notes; 19 of them unverified as music) are exactly this second list, not deleted; the catalogue counts in section 4 are counts of the two lists. The two-note clause and the "bracket required" rule scored 14 of 14 real and 21 of 21 artefact on the named cases, but the named artefacts were the source of the clause; the unselected evidence is the 19 unnamed groups, which nobody has read. A bracket that exists and draws nothing (1,195 brackets; variant B) is a separate fact ("bracket not drawn"), not a missing tuplet.
- **rhythm.cadenza: candidates are read facts, "cadenza" is the agent's.** Code lists, per route, what the file states (cue-size runs, grace runs, printed irregular tuplets, words) and never says "played freely". The irregular route must not erase a read fact on an uncertain interpretation: with D alone Ain't Misbehavin' lost its only candidate (an unverified 11:8 beside known artefacts, section 5). It stays, on a lower-grade list "irregular time-modification without a printed bracket of two notes", beside the printed ones, for the agent. The cue route is unchanged by this: it reads the item's own file and returns the run, not a verdict.
- **A different musical question?** Two places. The lead-sheet cut asks "is the melody with some chords a lead sheet?" while the detector measures "few chordal onsets"; on the catalogue they differ only on Blue Bossa and the Flute Tune, so the data cannot tell the two questions apart. The tuplet fix asks "is it printed as a tuplet?" while the characteristic is "which tuplet kinds does the learner meet"; a bracket that draws nothing, or a figure written without a bracket, is met as a rhythm without a sign, and that is why they are listed apart, not dropped.

The second reviewer note (`chatgpt-review-chunk1-rules.md`, sections 1, 12, 9, 10; optional input) adds four points, all applied to the wording and none needing a run:
- *item.format*: generated family metadata must not stand in for what the file contains. The fix above already takes the generated layout from the file's own rule-4 answer; the family name is not used (corrected wording: "piano score" is the label over the file's facts, which the family does not alter). A definitive label is refused where chord symbols or slashes and the part conflict: Blue Bossa is "lead sheet candidate" with its facts, not a verdict.
- *reading.accidental-kinds*: three layers, not two: *encoded* (the file's `<accidental>` elements, with `cautionary`/`parentheses`), *required* (the alteration differs from the signature or the bar's record: the model's "required" class, exact), *displayed* (the render). The validators' model conflated the last two; the render separates them.
- *rhythm.tuplets-other*: raw numerator and denominator are kept for every group (they are in `f3_groups.json`, 413 rows, none removed); suspect ones carry the flags above; a rare genuine tuplet is never silently dropped (Moonlight III 7:4 and Berceuse 11:8 would have gone under the "sum" and "fewer-notes" tests, which is why those were rejected).
- *rhythm.cadenza*: the lists are candidates, and their recall is not exhaustive: 5 routes were specified and 4 run, no cadenza was read in a score, and the catalogue holds 100 cue-run candidates in 19 items, 40 of them in one non-cadenza piece.

## 9. Recommendation

item.format: current detector with fix (lead-sheet two-note-onset cut 10 to 20 per cent as a candidate label beside the read facts, UNKNOWN-layout rule not applied to generated items) — Blue Bossa wrong to right and the 27 generated UNKNOWN to piano score, UNKNOWN 28 to 1 and lead sheets 80 to 81 with no other change in 2,020 items, but the cut rests on one positive and one boundary item (any value 0.12 to 0.27 gives the same catalogue).
reading.accidental-kinds: direct read (OSMD 2.1.2's own render of the file, for the displayed layer; the file's `<accidental>` elements and required alterations kept as the encoded layer) — the rule's model is wrong on 8,543 of 76,813 file-accidental notes (11.1%) over 2,011 rendered files, the emulation on 676 (0.9%) and differs from the render in 73 files, so only the render is the authority; 8 files failed to render and need a fallback.
rhythm.tuplets-other: current detector with fix (read the printed `<tuplet>` bracket of two or more notes, ratio not 1, as the tuplet; every other time-modification kept with its raw ratio in a separate flagged list, not deleted, instead of the 5 per cent bound and the fewer-notes test) — named real figures kept 14 of 14 (current 13) and artefact ratios separated 21 of 21 (current 8), no 3:2 group lost (230 of 231 kept), but the two-note clause was set from the named failures and 19 groups of 81 notes it moves to the flagged list are unverified as music.
rhythm.cadenza: code + agent (code lists the cue-size runs read from the item's own file in every pipeline, grace runs of 6 or more, irregular tuplets with a printed bracket of two notes and, apart, the unprinted ones, and the cadenza words; the agent decides whether a passage is played freely) — UNKNOWN for the cue route falls from 265 items to 0, named positives flagged 9 of 9 (page as written 8), candidates in 45 items (38), but 100 cue runs in 19 items are only candidates (40 in one non-cadenza piece) and recall is not exhaustive.

