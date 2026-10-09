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

## 2. Tools that needed more than a call, and what did not run

**AugmentedNet: ran.** Repository `github.com/napulen/AugmentedNet` (MIT), shallow clone at commit 46d3475651346fd9053db29bc2bfb7943a869b74 in `build/augnet/`; the model is the repository's own `AugmentedNet.hdf5` (the repository's `__version__` string says 1.9.0). Its `requirements.txt` pins `tensorflow==2.5.0`, `numpy==1.19.5`, `pandas==1.4.1`, `music21==6.7.1`: the first three have no wheels for Python 3.11 (reading, not tried), the only Python on this machine (`py -0` lists 3.11 only). Installed instead, in `build/venv-augnet`: tensorflow 2.15.1 (Keras 2.15, which loads the `.hdf5`), numpy 1.26.4, pandas 2.1.4, music21 6.7.1 (as pinned), mido, mlflow-skinny, h5py, scipy. **One error, cause visible, fixed once:** the first `pip install` failed with an OSError on a TensorFlow header path longer than the Windows path limit (the worktree path is long). The venv was recreated through a directory junction `C:\vaug` -> `build/venv-augnet` (`mklink /J`, no system setting changed) and the install succeeded; scripts run it as `C:/vaug/Scripts/python.exe`. Inference then ran on the first attempt with no change to AugmentedNet's code. `augnet_run.py` imports only its score parser, input and output representations and `padToSequenceLength`, and repeats the prediction steps of `inference.py predict` up to the decoded `LocalKey38` column; `inference.py` itself was not imported, because its `cli` imports the training module and mlflow, and the annotated-score and RomanText writing after the dataframe are not needed. Per piece it reads the local key at the first time step of each measure (the same convention as the When in Rome truth: the key in force at the bar's start); its "first key" is the key at the first time step and its "most frequent key" is the mode over all time steps (it has no separate global-key output; the survey says so). Raw output: `augnet_wir_raw.json` (94 pieces, 0 errors) and `augnet_cat_raw.json` (362 items, 2 errors: ZeroDivisionError on `song.classical.chopin-etude-op10-12.nifc` and `song.classical.chopin-mazurka-op7-4.nifc`; raised on the prediction path; cause not traced). It ran on the CPU (TensorFlow 2.15 CPU build).

**AugmentedNet and the data it was trained on.** `augnet_split.py` reads the repository's own split lists (`AugmentedNet/data/*.py`) and matches the selected pieces: of the 80 keyboard pieces, 63 are in its training or validation split (Mozart sonata movements 45 of 53, WTC I pieces 18 of 24), 17 are held out (8 Mozart movements and 6 WTC I pieces in its test split, 3 Chopin pieces in none of its lists). The 14 textbook pieces were not matched (its `key_modulation_dataset` covers textbook examples). Every AugmentedNet figure on When in Rome is therefore given for all 94 pieces and again for the 17 held-out ones; the catalogue items are not in its lists (the Inventions, the PDMX and imported scores, the generated drills) except that K. 545 i and WTC I Prelude 1 are in When in Rome (K. 545 i is in its test split, WTC I No. 1 in its training split: `augnet_split.json`, `wirwtc.py`).

**justkeydding: not run: needs a C++ build.** Checked: repository cloned at commit ebc70815fb9bc898460a02efdafcc00bc51ac0b6 (`build/justkeydding/`, MIT); there is no `bin/` directory and no executable in the clone (GitHub releases were not looked at); its entry point `justkeydding` is a bash script that calls `/vagrant/bin/justkeydding --chromaonly` (the C++ binary) and then pipes the result into `justkeydding_ensemble.py`; the `Makefile` calls `g++ --std=c++11` and links `-lsndfile -lvamp-hostsdk -ldl` (Linux libraries); the submodules (`midifile`, `include/optparse`) are not fetched by a shallow clone; `which g++ make cmake gcc cl` finds none on this machine; the README says it has only been built in an Ubuntu 18.04 Vagrant box. Its Python part (`justkeydding_ensemble.py`, `pre-trained.joblib`) reads the binary's output file, so it cannot run alone. Its published global-key figure (ensemble 94.4% on the Albrecht-Shanahan set, survey section 1) is therefore not reproduced here, and it has no local-key output (the paper says so), so it could not have served `key.change` in any case.

**Not usable / limits of the data:**
- The 13 When in Rome pieces (4 keyboard, 9 textbook) on which the project's score reader raises (`tools/classifier/score.py` line 109, a boolean mask of part 0's measures applied to every part's notes: the fault already listed on `rules/area-1B.md`) have no result for the current detector; all other methods ran on them. In the catalogue it also raises on two reference items (Bach Invention No. 1, an IndexError; Chopin Ballade No. 1, the line-109 fault).
- Reger's 117 *Modulation* examples (1 to 3 bars) and the other 70 textbook pieces under 8 bars were not used (section 1).
- The DCML corpora (Mozart sonatas, ABC, Distant Listening Corpus; CC BY-NC-SA) and the Albrecht-Shanahan set were not downloaded: the brief named When in Rome only. The Mozart sonata annotations here are When in Rome's.
- Bach Inventions have no annotation in reach, so their expected answers are a reading.
- `key.minor-form`, mode beyond major and minor, and every other characteristic were not touched.

## 3. key.tonic-mode results

### 3.1 When in Rome (`wir_run.py`, `wir_metrics.py`; per-piece data in `wir_results.json`)

Exact = tonic and mode equal to the analysis's first key. *fifth* = the dominant or subdominant, same mode. *abstain* = the method returned no key (UNKNOWN). *no result* = the method could not run on the piece: for the current detector, the project's score reader raised on it (`score.py` line 109, the fault already listed in `rules/area-1B.md`). "Wrong" in the witness paragraphs counts an UNKNOWN answer as wrong. The textbook pieces are short exercises that modulate, so "the first key" is a weak target for any method that reads the whole piece (the profiles); read that block with the keyboard block, not instead of it.

**keyboard (Bach WTC I, Chopin, Mozart sonatas): 80 pieces.**

| method | pieces | exact | relative | parallel | fifth | other | abstain | no result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: first version (H.analyse key) | 80 | 75 (93.8%) | 0 | 0 | 0 | 0 | 1 | 4 |
| current: corrected ending vote (keyfix.infer_key2) | 80 | 76 (95.0%) | 0 | 0 | 0 | 0 | 0 | 4 |
| partitura estimate_key (the current detector's K-S witness) | 80 | 67 (83.8%) | 1 | 1 | 7 | 0 | 0 | 4 |
| music21 Krumhansl-Schmuckler | 80 | 68 (85.0%) | 1 | 1 | 10 | 0 | 0 | 0 |
| music21 Aarden-Essen | 80 | 78 (97.5%) | 1 | 1 | 0 | 0 | 0 | 0 |
| music21 Bellman-Budge | 80 | 78 (97.5%) | 1 | 1 | 0 | 0 | 0 | 0 |
| music21 Temperley-Kostka-Payne | 80 | 78 (97.5%) | 1 | 1 | 0 | 0 | 0 | 0 |
| AugmentedNet: first local key | 80 | 80 (100.0%) | 0 | 0 | 0 | 0 | 0 | 0 |
| AugmentedNet: most frequent local key | 80 | 78 (97.5%) | 0 | 1 | 1 | 0 | 0 | 0 |

**textbook (Aldwell, Kostka, Rimsky-Korsakov, Tchaikovsky; 8+ bars): 14 pieces.**

| method | pieces | exact | relative | parallel | fifth | other | abstain | no result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: first version (H.analyse key) | 14 | 3 (21.4%) | 1 | 0 | 1 | 0 | 0 | 9 |
| current: corrected ending vote (keyfix.infer_key2) | 14 | 3 (21.4%) | 1 | 0 | 1 | 0 | 0 | 9 |
| partitura estimate_key (the current detector's K-S witness) | 14 | 2 (14.3%) | 1 | 0 | 1 | 1 | 0 | 9 |
| music21 Krumhansl-Schmuckler | 14 | 6 (42.9%) | 2 | 0 | 2 | 4 | 0 | 0 |
| music21 Aarden-Essen | 14 | 7 (50.0%) | 2 | 0 | 2 | 3 | 0 | 0 |
| music21 Bellman-Budge | 14 | 5 (35.7%) | 1 | 0 | 2 | 6 | 0 | 0 |
| music21 Temperley-Kostka-Payne | 14 | 6 (42.9%) | 2 | 0 | 2 | 4 | 0 | 0 |
| AugmentedNet: first local key | 14 | 14 (100.0%) | 0 | 0 | 0 | 0 | 0 | 0 |
| AugmentedNet: most frequent local key | 14 | 11 (78.6%) | 1 | 0 | 0 | 2 | 0 | 0 |

**all selected: 94 pieces.**

| method | pieces | exact | relative | parallel | fifth | other | abstain | no result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: first version (H.analyse key) | 94 | 78 (83.0%) | 1 | 0 | 1 | 0 | 1 | 13 |
| current: corrected ending vote (keyfix.infer_key2) | 94 | 79 (84.0%) | 1 | 0 | 1 | 0 | 0 | 13 |
| partitura estimate_key (the current detector's K-S witness) | 94 | 69 (73.4%) | 2 | 1 | 8 | 1 | 0 | 13 |
| music21 Krumhansl-Schmuckler | 94 | 74 (78.7%) | 3 | 1 | 12 | 4 | 0 | 0 |
| music21 Aarden-Essen | 94 | 85 (90.4%) | 3 | 1 | 2 | 3 | 0 | 0 |
| music21 Bellman-Budge | 94 | 83 (88.3%) | 2 | 1 | 2 | 6 | 0 | 0 |
| music21 Temperley-Kostka-Payne | 94 | 84 (89.4%) | 3 | 1 | 2 | 4 | 0 | 0 |
| AugmentedNet: first local key | 94 | 94 (100.0%) | 0 | 0 | 0 | 0 | 0 | 0 |
| AugmentedNet: most frequent local key | 94 | 89 (94.7%) | 1 | 1 | 1 | 2 | 0 | 0 |

**AugmentedNet held-out: keyboard pieces in its test split or in none of its lists (17): 17 pieces.**

| method | pieces | exact | relative | parallel | fifth | other | abstain | no result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: first version (H.analyse key) | 17 | 15 (88.2%) | 0 | 0 | 0 | 0 | 0 | 2 |
| current: corrected ending vote (keyfix.infer_key2) | 17 | 15 (88.2%) | 0 | 0 | 0 | 0 | 0 | 2 |
| partitura estimate_key (the current detector's K-S witness) | 17 | 15 (88.2%) | 0 | 0 | 0 | 0 | 0 | 2 |
| music21 Krumhansl-Schmuckler | 17 | 15 (88.2%) | 0 | 0 | 2 | 0 | 0 | 0 |
| music21 Aarden-Essen | 17 | 17 (100.0%) | 0 | 0 | 0 | 0 | 0 | 0 |
| music21 Bellman-Budge | 17 | 17 (100.0%) | 0 | 0 | 0 | 0 | 0 | 0 |
| music21 Temperley-Kostka-Payne | 17 | 17 (100.0%) | 0 | 0 | 0 | 0 | 0 | 0 |
| AugmentedNet: first local key | 17 | 17 (100.0%) | 0 | 0 | 0 | 0 | 0 | 0 |
| AugmentedNet: most frequent local key | 17 | 16 (94.1%) | 0 | 0 | 1 | 0 | 0 | 0 |

**AugmentedNet seen: keyboard pieces in its training or validation split (63): 63 pieces.**

| method | pieces | exact | relative | parallel | fifth | other | abstain | no result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: first version (H.analyse key) | 63 | 60 (95.2%) | 0 | 0 | 0 | 0 | 1 | 2 |
| current: corrected ending vote (keyfix.infer_key2) | 63 | 61 (96.8%) | 0 | 0 | 0 | 0 | 0 | 2 |
| partitura estimate_key (the current detector's K-S witness) | 63 | 52 (82.5%) | 1 | 1 | 7 | 0 | 0 | 2 |
| music21 Krumhansl-Schmuckler | 63 | 53 (84.1%) | 1 | 1 | 8 | 0 | 0 | 0 |
| music21 Aarden-Essen | 63 | 61 (96.8%) | 1 | 1 | 0 | 0 | 0 | 0 |
| music21 Bellman-Budge | 63 | 61 (96.8%) | 1 | 1 | 0 | 0 | 0 | 0 |
| music21 Temperley-Kostka-Payne | 63 | 61 (96.8%) | 1 | 1 | 0 | 0 | 0 | 0 |
| AugmentedNet: first local key | 63 | 63 (100.0%) | 0 | 0 | 0 | 0 | 0 | 0 |
| AugmentedNet: most frequent local key | 63 | 62 (98.4%) | 0 | 1 | 0 | 0 | 0 | 0 |

**Common set: the 81 pieces on which the current detector ran (all methods on the same pieces).**

| method | pieces | exact | relative | parallel | fifth | other | abstain | no result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: first version (H.analyse key) | 81 | 78 (96.3%) | 1 | 0 | 1 | 0 | 1 | 0 |
| current: corrected ending vote (keyfix.infer_key2) | 81 | 79 (97.5%) | 1 | 0 | 1 | 0 | 0 | 0 |
| partitura estimate_key (the current detector's K-S witness) | 81 | 69 (85.2%) | 2 | 1 | 8 | 1 | 0 | 0 |
| music21 Krumhansl-Schmuckler | 81 | 69 (85.2%) | 2 | 1 | 8 | 1 | 0 | 0 |
| music21 Aarden-Essen | 81 | 77 (95.1%) | 2 | 1 | 0 | 1 | 0 | 0 |
| music21 Bellman-Budge | 81 | 76 (93.8%) | 2 | 1 | 0 | 2 | 0 | 0 |
| music21 Temperley-Kostka-Payne | 81 | 76 (93.8%) | 2 | 1 | 1 | 1 | 0 | 0 |
| AugmentedNet: first local key | 81 | 81 (100.0%) | 0 | 0 | 0 | 0 | 0 | 0 |
| AugmentedNet: most frequent local key | 81 | 78 (96.3%) | 1 | 1 | 1 | 0 | 0 | 0 |

**Second witness (the corrected current answer against music21 Bellman-Budge, on the common set).** Agree and right 76, agree and wrong 1, disagree and right 3, disagree and wrong 1. Disagreement flags 1 of the 2 wrong answers and sends 3 right ones to the agent.

### 3.2 Our catalogue (`cat_keys.py`, `cat_metrics.py`; per-item data in `cat_keys_results.json`)

**generated (recipe key): 1056 items.**

| method | items | exact | exact of those it ran on | relative | parallel | fifth | other | abstain | no result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: first version (H.analyse key) | 1056 | 1027 (97.3%) | 97.3% | 7 | 0 | 4 | 0 | 18 | 0 |
| current: corrected ending vote (keyfix.infer_key2) | 1056 | 1013 (95.9%) | 95.9% | 11 | 0 | 0 | 0 | 32 | 0 |
| partitura estimate_key (the current detector's K-S witness) | 1056 | 909 (86.1%) | 86.1% | 21 | 19 | 69 | 38 | 0 | 0 |
| music21 Krumhansl-Schmuckler | 1056 | 909 (86.1%) | 86.1% | 21 | 19 | 69 | 38 | 0 | 0 |
| music21 Aarden-Essen | 1056 | 627 (59.4%) | 59.4% | 283 | 20 | 81 | 45 | 0 | 0 |
| music21 Bellman-Budge | 1056 | 850 (80.5%) | 80.5% | 38 | 12 | 103 | 53 | 0 | 0 |
| music21 Temperley-Kostka-Payne | 1056 | 923 (87.4%) | 87.4% | 47 | 3 | 49 | 34 | 0 | 0 |
| AugmentedNet: first local key | 132 | 108 (81.8%) | 81.8% | 4 | 3 | 11 | 6 | 0 | 0 |
| AugmentedNet: most frequent local key | 132 | 113 (85.6%) | 85.6% | 3 | 3 | 8 | 5 | 0 | 0 |

**real with a key in the title: 228 items.**

| method | items | exact | exact of those it ran on | relative | parallel | fifth | other | abstain | no result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: first version (H.analyse key) | 228 | 215 (94.3%) | 95.1% | 5 | 0 | 1 | 0 | 5 | 2 |
| current: corrected ending vote (keyfix.infer_key2) | 228 | 214 (93.9%) | 94.7% | 5 | 0 | 1 | 1 | 5 | 2 |
| partitura estimate_key (the current detector's K-S witness) | 228 | 179 (78.5%) | 79.2% | 5 | 10 | 23 | 9 | 0 | 2 |
| music21 Krumhansl-Schmuckler | 228 | 179 (78.5%) | 79.2% | 5 | 10 | 23 | 9 | 0 | 2 |
| music21 Aarden-Essen | 228 | 201 (88.2%) | 88.9% | 6 | 7 | 8 | 4 | 0 | 2 |
| music21 Bellman-Budge | 228 | 202 (88.6%) | 89.4% | 7 | 5 | 6 | 6 | 0 | 2 |
| music21 Temperley-Kostka-Payne | 228 | 206 (90.4%) | 91.2% | 8 | 5 | 4 | 3 | 0 | 2 |
| AugmentedNet: first local key | 226 | 207 (91.6%) | 91.6% | 7 | 2 | 5 | 5 | 0 | 0 |
| AugmentedNet: most frequent local key | 226 | 198 (87.6%) | 87.6% | 14 | 2 | 5 | 7 | 0 | 0 |

**AugmentedNet comparison set, generated sample (every 8th): 132 items (all methods on the same items).**

| method | items | exact | exact of those it ran on | relative | parallel | fifth | other | abstain | no result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: first version (H.analyse key) | 132 | 129 (97.7%) | 97.7% | 1 | 0 | 0 | 0 | 2 | 0 |
| current: corrected ending vote (keyfix.infer_key2) | 132 | 126 (95.5%) | 95.5% | 1 | 0 | 0 | 0 | 5 | 0 |
| partitura estimate_key (the current detector's K-S witness) | 132 | 114 (86.4%) | 86.4% | 2 | 2 | 9 | 5 | 0 | 0 |
| music21 Krumhansl-Schmuckler | 132 | 114 (86.4%) | 86.4% | 2 | 2 | 9 | 5 | 0 | 0 |
| music21 Aarden-Essen | 132 | 83 (62.9%) | 62.9% | 32 | 4 | 10 | 3 | 0 | 0 |
| music21 Bellman-Budge | 132 | 110 (83.3%) | 83.3% | 3 | 2 | 11 | 6 | 0 | 0 |
| music21 Temperley-Kostka-Payne | 132 | 117 (88.6%) | 88.6% | 5 | 0 | 6 | 4 | 0 | 0 |
| AugmentedNet: first local key | 132 | 108 (81.8%) | 81.8% | 4 | 3 | 11 | 6 | 0 | 0 |
| AugmentedNet: most frequent local key | 132 | 113 (85.6%) | 85.6% | 3 | 3 | 8 | 5 | 0 | 0 |

**AugmentedNet comparison set, real (all with a title key): 228 items (all methods on the same items).**

| method | items | exact | exact of those it ran on | relative | parallel | fifth | other | abstain | no result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: first version (H.analyse key) | 228 | 215 (94.3%) | 95.1% | 5 | 0 | 1 | 0 | 5 | 2 |
| current: corrected ending vote (keyfix.infer_key2) | 228 | 214 (93.9%) | 94.7% | 5 | 0 | 1 | 1 | 5 | 2 |
| partitura estimate_key (the current detector's K-S witness) | 228 | 179 (78.5%) | 79.2% | 5 | 10 | 23 | 9 | 0 | 2 |
| music21 Krumhansl-Schmuckler | 228 | 179 (78.5%) | 79.2% | 5 | 10 | 23 | 9 | 0 | 2 |
| music21 Aarden-Essen | 228 | 201 (88.2%) | 88.9% | 6 | 7 | 8 | 4 | 0 | 2 |
| music21 Bellman-Budge | 228 | 202 (88.6%) | 89.4% | 7 | 5 | 6 | 6 | 0 | 2 |
| music21 Temperley-Kostka-Payne | 228 | 206 (90.4%) | 91.2% | 8 | 5 | 4 | 3 | 0 | 2 |
| AugmentedNet: first local key | 226 | 207 (91.6%) | 91.6% | 7 | 2 | 5 | 5 | 0 | 0 |
| AugmentedNet: most frequent local key | 226 | 198 (87.6%) | 87.6% | 14 | 2 | 5 | 7 | 0 | 0 |

**Three witnesses, generated items (corrected current answer, Bellman-Budge and Temperley-Kostka-Payne all equal).** all three agree and right 807, agree and wrong 0; not all equal: right 206, wrong 11 (UNKNOWN answers are not counted here).

**Second witness, generated items the current detector ran on (corrected current answer against music21 Bellman-Budge).** agree-right 811, agree-wrong 0, disagree-right 202, disagree-wrong 43. Disagreement flags 43 of 43 wrong answers and sends 202 right ones to the agent.

**Three witnesses, real items (corrected current answer, Bellman-Budge and Temperley-Kostka-Payne all equal).** all three agree and right 193, agree and wrong 4; not all equal: right 21, wrong 3 (UNKNOWN answers are not counted here).

**Second witness, real items the current detector ran on (corrected current answer against music21 Bellman-Budge).** agree-right 195, agree-wrong 4, disagree-right 19, disagree-wrong 8. Disagreement flags 8 of 12 wrong answers and sends 19 right ones to the agent.

**Real items where the corrected current answer is wrong and Bellman-Budge gives the same wrong key (4).** Answers: current / BB / TKP / AE / AugmentedNet first key; reference.

- song.classical.chopin-polonaise-g-minor.nifc: Bb major / Bb major / Bb major / Bb major / G minor; reference G minor (title corrected)
- song.classical.chopin-polonaise-g-sharp-minor.nifc: B major / B major / B major / B major / Ab minor; reference Ab minor (title corrected)
- song.classical.chopin-scherzo-2.nifc: C# major / C# major / C# major / C# major / Bb minor; reference Bb minor (title)
- song.classical.chopin-sonata-2-2.nifc: F# major / F# major / F# major / F# major / Eb minor; reference Eb minor (title)

**Real items where the first version current answer is wrong and Bellman-Budge gives the same wrong key (4).** Answers: current / BB / TKP / AE / AugmentedNet first key; reference.

- song.classical.chopin-polonaise-g-minor.nifc: Bb major / Bb major / Bb major / Bb major / G minor; reference G minor (title corrected)
- song.classical.chopin-polonaise-g-sharp-minor.nifc: B major / B major / B major / B major / Ab minor; reference Ab minor (title corrected)
- song.classical.chopin-scherzo-2.nifc: C# major / C# major / C# major / C# major / Bb minor; reference Bb minor (title)
- song.classical.chopin-sonata-2-2.nifc: F# major / F# major / F# major / F# major / Eb minor; reference Eb minor (title)

**Witness rule: first-version current answer equal to Bellman-Budge and to AugmentedNet's first key (items AugmentedNet ran on; UNKNOWN current answers left out).** generated sample: all equal and right 95, all equal and wrong 0, not all equal: right 34, wrong 1; real: all equal and right 178, all equal and wrong 0, not all equal: right 35, wrong 6.

**Generated families with at least one wrong answer by these three methods.**

| generator family | items | current corrected wrong (incl. UNKNOWN) | Bellman-Budge wrong | Aarden-Essen wrong |
| --- | --- | --- | --- | --- |
| boogie | 36 | 0 | 36 | 12 |
| scale | 252 | 0 | 24 | 108 |
| hanon | 60 | 21 | 0 | 57 |
| blues_scale | 16 | 0 | 16 | 16 |
| cadence | 36 | 0 | 12 | 0 |
| ii_v_i | 36 | 0 | 12 | 36 |
| tremolo_octaves | 12 | 0 | 12 | 6 |
| walking_bass | 28 | 0 | 12 | 16 |
| comping | 58 | 0 | 10 | 10 |
| coordination | 10 | 0 | 10 | 5 |
| montuno | 15 | 0 | 10 | 0 |
| articulation | 8 | 8 | 0 | 8 |
| open_voicing | 16 | 0 | 8 | 12 |
| interval_reading | 16 | 0 | 6 | 6 |
| trill | 12 | 6 | 0 | 0 |
| ostinato | 6 | 0 | 6 | 3 |
| pentatonic | 6 | 0 | 6 | 0 |
| power_chord | 3 | 3 | 3 | 3 |
| intro | 5 | 0 | 5 | 5 |
| tumbao | 5 | 0 | 5 | 5 |
| accompaniment | 30 | 0 | 4 | 0 |
| double_scale | 8 | 4 | 0 | 4 |
| study | 24 | 1 | 3 | 5 |
| walkup | 4 | 0 | 4 | 4 |
| riff | 4 | 0 | 2 | 1 |
| octave_scale | 25 | 0 | 0 | 25 |
| four_chord_loop | 24 | 0 | 0 | 24 |
| passing_chord | 4 | 0 | 0 | 4 |
| repeated_notes | 12 | 0 | 0 | 12 |
| shaping | 10 | 0 | 0 | 10 |
| tritone_sub | 4 | 0 | 0 | 4 |
| turnaround | 12 | 0 | 0 | 4 |
| seventh_voicing | 48 | 0 | 0 | 24 |

**Real items named in validation row 5 and look-alikes (id patterns: Chopin ballades and Op. 25 etudes, Mozart minuets, sonatinas, Bach menuet, Invention 12, Hanon, Sonata No. 2): 36 items with a title key.**

| item | reference | current: first version (H.analyse key) | current: corrected ending vote (keyfix.infer_key2) | partitura estimate_key (the current detector's K-S witness) | music21 Krumhansl-Schmuckler | music21 Aarden-Essen | music21 Bellman-Budge | music21 Temperley-Kostka-Payne |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32 | F major (title) | F major | F major | F major | F major | F major | F major | F major |
| song.classical.bach-invention-no-12-in-a-major-bwv-783.pdmx | A major (title) | A major | A major | A major | A major | A major | A major | A major |
| song.classical.bach-menuet-bwv-anh-113.pdmx | F major (title) | F major | F major | C major | C major | F major | F major | F major |
| song.classical.bach-menuet-in-d-minor-bwv-anh-132.pdmx | D minor (title) | D minor | D minor | D minor | D minor | D minor | D minor | D minor |
| song.classical.beethoven-sonatina-in-f-major-anh-5-no-2.pdmx | F major (title) | F major | F major | F major | F major | F major | F major | F major |
| song.classical.beethoven-sonatina-in-g-major-ahn-5.pdmx | G major (title) | G major | G major | G major | G major | G major | G major | G major |
| song.classical.chopin-ballade-1 | G minor (title) | no result | no result | no result | no result | no result | no result | no result |
| song.classical.chopin-ballade-2.nifc | F major (title) | UNKNOWN | A minor | A minor | A minor | F major | F major | F major |
| song.classical.chopin-ballade-3.nifc | Ab major (title) | Ab major | UNKNOWN | Ab major | Ab major | Ab major | Ab major | Ab major |
| song.classical.chopin-ballade-4.nifc | F minor (title) | F minor | F minor | F minor | F minor | Bb minor | F minor | F minor |
| song.classical.chopin-ballade-no-4-in-f-minor-op-52.pdmx | F minor (title) | F minor | F minor | F minor | F minor | Bb minor | F minor | F minor |
| song.classical.chopin-etude-op25-1.nifc | Ab major (title) | Ab major | Ab major | Ab major | Ab major | Ab major | Ab major | Ab major |
| song.classical.chopin-etude-op25-11.nifc | A minor (title) | A minor | A minor | A minor | A minor | A minor | A minor | A minor |
| song.classical.chopin-etude-op25-12.nifc | C minor (title) | C minor | C minor | C minor | C minor | C minor | C minor | C minor |
| song.classical.chopin-etude-op25-2.nifc | F minor (title) | F minor | F minor | F minor | F minor | F minor | F minor | F minor |
| song.classical.chopin-etude-op25-4.nifc | A minor (title) | A minor | A minor | A minor | A minor | A minor | A minor | A minor |
| song.classical.chopin-etude-op25-6.nifc | Ab minor (title) | Ab minor | UNKNOWN | Ab minor | Ab minor | Ab minor | Ab minor | Ab minor |
| song.classical.chopin-etude-op25-8.nifc | C# major (title) | C# major | C# major | C# major | C# major | C# major | C# major | C# major |
| song.classical.chopin-etude-op25-9.nifc | F# major (title) | F# major | F# major | F# major | F# major | F# major | F# major | F# major |
| song.classical.clementi-sonatina-no-1-muzio-clementi.pdmx | C major (title) | C major | C major | C major | C major | C major | C major | C major |
| song.classical.clementi-sonatina-no1-2-muzio-clementi.pdmx | C major (title) | C major | C major | C major | C major | C major | C major | C major |
| song.classical.diabelli-diabelli-sonatina-in-f-major-op-168-no-1-1st-movement.pdmx | F major (title) | F major | F major | C major | C major | F major | F major | F major |
| song.classical.kuhlau-sonatina-in-c-major-op-20-no-1-allegro.pdmx | C major (title) | C major | C major | G major | G major | C major | C major | C major |
| song.classical.mozart-minuet-in-a-flat-major-k-15ff.pdmx | Ab major (title) | Ab major | Ab major | Ab major | Ab major | Ab major | Ab major | Ab major |
| song.classical.mozart-minuet-in-a-major-k-15i.pdmx | A major (title) | A major | A major | A major | A major | A major | A major | A major |
| song.classical.mozart-minuet-in-c-major-fragment-k-15rr.pdmx | C major (title) | C major | C major | G major | G major | C major | C major | C major |
| song.classical.mozart-minuet-in-e-flat-major-k-15ee.pdmx | Eb major (title) | Eb major | Eb major | Bb major | Bb major | Eb major | Eb major | Eb major |
| song.classical.mozart-minuet-in-f-major-k-15m.pdmx | F major (title) | F major | F major | C major | C major | F major | F major | F major |
| song.classical.mozart-minuet-in-f-major-k-1d.pdmx | F major (title) | F major | UNKNOWN | F major | F major | F major | F major | F major |
| song.classical.mozart-minuet-in-f-major-k-4.pdmx | F major (title) | F major | F major | F major | F major | F major | F major | F major |
| song.classical.mozart-minuet-in-g-major-k-15c.pdmx | G major (title) | G major | G major | G major | G major | G major | G major | G major |
| song.classical.mozart-mozart-minuet-in-f-major-k2-easy.pdmx | F major (title) | F major | F major | F major | F major | F major | F major | F major |
| song.classical.mozart-w-a-mozart-minuet-in-c-major-k1f.pdmx | C major (title) | C major | C major | G major | G major | C major | C major | C major |
| song.classical.mozart-w-a-mozart-minuet-in-f-major-k5.pdmx | F major (title) | F major | F major | C major | C major | F major | F major | F major |
| song.classical.mozart-w-a-mozart-minuet-in-g-major-k1e.pdmx | G major (title) | G major | G major | G major | G major | G major | G major | G major |
| song.pop.sonatina-in-g.pdmx | G major (title) | G major | UNKNOWN | G major | G major | G major | G major | G major |

## 4. key.change results

### 4.1 When in Rome, every bar (`wir_run.py`, `wir_metrics.py`)

**keyboard (Bach WTC I, Chopin, Mozart sonatas).**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 76/80 | 58.5% | 100.0% | 463 | 2475 | 373 | 15.1% | 80.6% | 25.4% |
| current: key areas (4+ bars, no cadence needed) | 75/80 | 67.5% | 100.0% | 456 | 790 | 200 | 25.3% | 43.9% | 32.1% |
| current: areas confirmed by a cadence (first version) | 75/80 | 71.9% | 100.0% | 456 | 279 | 103 | 36.9% | 22.6% | 28.0% |
| current: areas confirmed (corrected, home-dominant exclusion) | 75/80 | 68.5% | 100.0% | 456 | 157 | 57 | 36.3% | 12.5% | 18.6% |
| music21 floatingKey (smoothed) | 80/80 | 62.4% | 99.9% | 486 | 49 | 21 | 42.9% | 4.3% | 7.9% |
| music21 floatingKey raw (one bar) | 80/80 | 44.5% | 99.9% | 486 | 6003 | 481 | 8.0% | 99.0% | 14.8% |
| music21 4-bar windows, Bellman-Budge | 80/80 | 69.4% | 99.8% | 486 | 2348 | 439 | 18.7% | 90.3% | 31.0% |
| music21 4-bar windows, Aarden-Essen | 80/80 | 63.1% | 99.8% | 486 | 2876 | 437 | 15.2% | 89.9% | 26.0% |
| AugmentedNet local key | 80/80 | 89.7% | 100.0% | 486 | 629 | 325 | 51.7% | 66.9% | 58.3% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 75/80 | - | - | 456 | 1048 | 343 | 32.7% | 75.2% | 45.6% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 80/80 | - | - | 486 | 1801 | 436 | 24.2% | 89.7% | 38.1% |

**textbook (Aldwell, Kostka, Rimsky-Korsakov, Tchaikovsky; 8+ bars).**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 5/14 | 59.6% | 98.2% | 12 | 17 | 10 | 58.8% | 83.3% | 69.0% |
| current: key areas (4+ bars, no cadence needed) | 5/14 | 43.9% | 98.2% | 12 | 3 | 2 | 66.7% | 16.7% | 26.7% |
| current: areas confirmed by a cadence (first version) | 5/14 | 36.8% | 98.2% | 12 | 2 | 1 | 50.0% | 8.3% | 14.3% |
| current: areas confirmed (corrected, home-dominant exclusion) | 5/14 | 36.8% | 98.2% | 12 | 2 | 1 | 50.0% | 8.3% | 14.3% |
| music21 floatingKey (smoothed) | 14/14 | 54.9% | 98.6% | 32 | 23 | 13 | 56.5% | 40.6% | 47.3% |
| music21 floatingKey raw (one bar) | 14/14 | 46.5% | 98.6% | 32 | 92 | 32 | 34.8% | 100.0% | 51.6% |
| music21 4-bar windows, Bellman-Budge | 14/14 | 57.0% | 86.6% | 32 | 34 | 20 | 58.8% | 62.5% | 60.6% |
| music21 4-bar windows, Aarden-Essen | 14/14 | 50.0% | 86.6% | 32 | 34 | 19 | 55.9% | 59.4% | 57.6% |
| AugmentedNet local key | 14/14 | 71.8% | 98.6% | 32 | 31 | 22 | 71.0% | 68.8% | 69.8% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 5/14 | - | - | 12 | 13 | 7 | 53.8% | 58.3% | 56.0% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 14/14 | - | - | 32 | 36 | 21 | 58.3% | 65.6% | 61.8% |

**all selected.**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 81/94 | 58.5% | 100.0% | 475 | 2492 | 383 | 15.4% | 80.6% | 25.8% |
| current: key areas (4+ bars, no cadence needed) | 80/94 | 67.3% | 100.0% | 468 | 793 | 202 | 25.5% | 43.2% | 32.0% |
| current: areas confirmed by a cadence (first version) | 80/94 | 71.6% | 100.0% | 468 | 281 | 104 | 37.0% | 22.2% | 27.8% |
| current: areas confirmed (corrected, home-dominant exclusion) | 80/94 | 68.3% | 100.0% | 468 | 159 | 58 | 36.5% | 12.4% | 18.5% |
| music21 floatingKey (smoothed) | 94/94 | 62.3% | 99.9% | 518 | 72 | 34 | 47.2% | 6.6% | 11.5% |
| music21 floatingKey raw (one bar) | 94/94 | 44.6% | 99.8% | 518 | 6095 | 513 | 8.4% | 99.0% | 15.5% |
| music21 4-bar windows, Bellman-Budge | 94/94 | 69.2% | 99.6% | 518 | 2382 | 459 | 19.3% | 88.6% | 31.7% |
| music21 4-bar windows, Aarden-Essen | 94/94 | 62.9% | 99.6% | 518 | 2910 | 456 | 15.7% | 88.0% | 26.6% |
| AugmentedNet local key | 94/94 | 89.4% | 100.0% | 518 | 660 | 347 | 52.6% | 67.0% | 58.9% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 80/94 | - | - | 468 | 1061 | 350 | 33.0% | 74.8% | 45.8% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 94/94 | - | - | 518 | 1837 | 457 | 24.9% | 88.2% | 38.8% |

**AugmentedNet held-out: keyboard pieces in its test split or in none of its lists (17).**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 15/17 | 49.4% | 100.0% | 108 | 495 | 89 | 18.0% | 82.4% | 29.5% |
| current: key areas (4+ bars, no cadence needed) | 15/17 | 63.1% | 100.0% | 108 | 125 | 39 | 31.2% | 36.1% | 33.5% |
| current: areas confirmed by a cadence (first version) | 15/17 | 67.8% | 100.0% | 108 | 41 | 19 | 46.3% | 17.6% | 25.5% |
| current: areas confirmed (corrected, home-dominant exclusion) | 15/17 | 67.6% | 100.0% | 108 | 31 | 14 | 45.2% | 13.0% | 20.1% |
| music21 floatingKey (smoothed) | 17/17 | 60.4% | 99.5% | 122 | 5 | 2 | 40.0% | 1.6% | 3.1% |
| music21 floatingKey raw (one bar) | 17/17 | 40.5% | 99.4% | 122 | 1084 | 120 | 11.1% | 98.4% | 19.9% |
| music21 4-bar windows, Bellman-Budge | 17/17 | 66.5% | 99.0% | 122 | 434 | 102 | 23.5% | 83.6% | 36.7% |
| music21 4-bar windows, Aarden-Essen | 17/17 | 61.1% | 99.0% | 122 | 548 | 106 | 19.3% | 86.9% | 31.6% |
| AugmentedNet local key | 17/17 | 84.2% | 100.0% | 122 | 141 | 74 | 52.5% | 60.7% | 56.3% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 15/17 | - | - | 108 | 188 | 74 | 39.4% | 68.5% | 50.0% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 17/17 | - | - | 122 | 330 | 103 | 31.2% | 84.4% | 45.6% |

**AugmentedNet seen: keyboard pieces in its training or validation split (63).**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 61/63 | 60.2% | 100.0% | 355 | 1980 | 284 | 14.3% | 80.0% | 24.3% |
| current: key areas (4+ bars, no cadence needed) | 60/63 | 68.4% | 100.0% | 348 | 665 | 161 | 24.2% | 46.3% | 31.8% |
| current: areas confirmed by a cadence (first version) | 60/63 | 72.6% | 100.0% | 348 | 238 | 84 | 35.3% | 24.1% | 28.7% |
| current: areas confirmed (corrected, home-dominant exclusion) | 60/63 | 68.7% | 100.0% | 348 | 126 | 43 | 34.1% | 12.4% | 18.1% |
| music21 floatingKey (smoothed) | 63/63 | 62.8% | 100.0% | 364 | 44 | 19 | 43.2% | 5.2% | 9.3% |
| music21 floatingKey raw (one bar) | 63/63 | 45.4% | 100.0% | 364 | 4919 | 361 | 7.3% | 99.2% | 13.7% |
| music21 4-bar windows, Bellman-Budge | 63/63 | 70.1% | 100.0% | 364 | 1914 | 337 | 17.6% | 92.6% | 29.6% |
| music21 4-bar windows, Aarden-Essen | 63/63 | 63.6% | 100.0% | 364 | 2328 | 331 | 14.2% | 90.9% | 24.6% |
| AugmentedNet local key | 63/63 | 90.8% | 100.0% | 364 | 488 | 251 | 51.4% | 69.0% | 58.9% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 60/63 | - | - | 348 | 860 | 269 | 31.3% | 77.3% | 44.5% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 63/63 | - | - | 364 | 1471 | 333 | 22.6% | 91.5% | 36.3% |

**Common set: the 81 pieces on which the current detector ran.**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 81/81 | 58.5% | 100.0% | 475 | 2492 | 383 | 15.4% | 80.6% | 25.8% |
| current: key areas (4+ bars, no cadence needed) | 80/81 | 67.3% | 100.0% | 468 | 793 | 202 | 25.5% | 43.2% | 32.0% |
| current: areas confirmed by a cadence (first version) | 80/81 | 71.6% | 100.0% | 468 | 281 | 104 | 37.0% | 22.2% | 27.8% |
| current: areas confirmed (corrected, home-dominant exclusion) | 80/81 | 68.3% | 100.0% | 468 | 159 | 58 | 36.5% | 12.4% | 18.5% |
| music21 floatingKey (smoothed) | 81/81 | 62.2% | 99.9% | 475 | 57 | 26 | 45.6% | 5.5% | 9.8% |
| music21 floatingKey raw (one bar) | 81/81 | 44.6% | 99.8% | 475 | 5702 | 470 | 8.2% | 98.9% | 15.2% |
| music21 4-bar windows, Bellman-Budge | 81/81 | 69.2% | 99.6% | 475 | 2247 | 427 | 19.0% | 89.9% | 31.4% |
| music21 4-bar windows, Aarden-Essen | 81/81 | 62.9% | 99.6% | 475 | 2741 | 423 | 15.4% | 89.1% | 26.3% |
| AugmentedNet local key | 81/81 | 89.4% | 100.0% | 475 | 616 | 318 | 51.6% | 66.9% | 58.3% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 80/81 | - | - | 468 | 1061 | 350 | 33.0% | 74.8% | 45.8% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 81/81 | - | - | 475 | 1730 | 425 | 24.6% | 89.5% | 38.5% |

**Modulation detection against key areas of 4+ bars only (truth runs under 4 bars absorbed; `durable()` in wir_metrics.py), keyboard (Bach WTC I, Chopin, Mozart sonatas).** Bar agreement is the same as above.

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 76/80 | 58.5% | 100.0% | 278 | 2475 | 231 | 9.3% | 83.1% | 16.8% |
| current: key areas (4+ bars, no cadence needed) | 75/80 | 67.5% | 100.0% | 271 | 790 | 140 | 17.7% | 51.7% | 26.4% |
| current: areas confirmed by a cadence (first version) | 75/80 | 71.9% | 100.0% | 271 | 279 | 68 | 24.4% | 25.1% | 24.7% |
| current: areas confirmed (corrected, home-dominant exclusion) | 75/80 | 68.5% | 100.0% | 271 | 157 | 45 | 28.7% | 16.6% | 21.0% |
| music21 floatingKey (smoothed) | 80/80 | 62.4% | 99.9% | 296 | 49 | 6 | 12.2% | 2.0% | 3.5% |
| music21 floatingKey raw (one bar) | 80/80 | 44.5% | 99.9% | 296 | 6003 | 293 | 4.9% | 99.0% | 9.3% |
| music21 4-bar windows, Bellman-Budge | 80/80 | 69.4% | 99.8% | 296 | 2348 | 277 | 11.8% | 93.6% | 21.0% |
| music21 4-bar windows, Aarden-Essen | 80/80 | 63.1% | 99.8% | 296 | 2876 | 275 | 9.6% | 92.9% | 17.3% |
| AugmentedNet local key | 80/80 | 89.7% | 100.0% | 296 | 629 | 208 | 33.1% | 70.3% | 45.0% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 75/80 | - | - | 271 | 1048 | 220 | 21.0% | 81.2% | 33.4% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 80/80 | - | - | 296 | 1801 | 281 | 15.6% | 94.9% | 26.8% |

**Modulation detection against key areas of 4+ bars only (truth runs under 4 bars absorbed; `durable()` in wir_metrics.py), all selected.** Bar agreement is the same as above.

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 81/94 | 58.5% | 100.0% | 281 | 2492 | 233 | 9.3% | 82.9% | 16.8% |
| current: key areas (4+ bars, no cadence needed) | 80/94 | 67.3% | 100.0% | 274 | 793 | 140 | 17.7% | 51.1% | 26.2% |
| current: areas confirmed by a cadence (first version) | 80/94 | 71.6% | 100.0% | 274 | 281 | 68 | 24.2% | 24.8% | 24.5% |
| current: areas confirmed (corrected, home-dominant exclusion) | 80/94 | 68.3% | 100.0% | 274 | 159 | 45 | 28.3% | 16.4% | 20.8% |
| music21 floatingKey (smoothed) | 94/94 | 62.3% | 99.9% | 302 | 72 | 8 | 11.1% | 2.6% | 4.3% |
| music21 floatingKey raw (one bar) | 94/94 | 44.6% | 99.8% | 302 | 6095 | 299 | 4.9% | 99.0% | 9.3% |
| music21 4-bar windows, Bellman-Budge | 94/94 | 69.2% | 99.6% | 302 | 2382 | 282 | 11.8% | 93.4% | 21.0% |
| music21 4-bar windows, Aarden-Essen | 94/94 | 62.9% | 99.6% | 302 | 2910 | 279 | 9.6% | 92.4% | 17.4% |
| AugmentedNet local key | 94/94 | 89.4% | 100.0% | 302 | 660 | 214 | 32.4% | 70.9% | 44.5% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 80/94 | - | - | 274 | 1061 | 223 | 21.0% | 81.4% | 33.4% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 94/94 | - | - | 302 | 1837 | 287 | 15.6% | 95.0% | 26.8% |

**Modulation detection against key areas of 4+ bars only (truth runs under 4 bars absorbed; `durable()` in wir_metrics.py), AugmentedNet held-out: keyboard pieces in its test split or in none of its lists (17).** Bar agreement is the same as above.

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 15/17 | 49.4% | 100.0% | 55 | 495 | 45 | 9.1% | 81.8% | 16.4% |
| current: key areas (4+ bars, no cadence needed) | 15/17 | 63.1% | 100.0% | 55 | 125 | 27 | 21.6% | 49.1% | 30.0% |
| current: areas confirmed by a cadence (first version) | 15/17 | 67.8% | 100.0% | 55 | 41 | 13 | 31.7% | 23.6% | 27.1% |
| current: areas confirmed (corrected, home-dominant exclusion) | 15/17 | 67.6% | 100.0% | 55 | 31 | 10 | 32.3% | 18.2% | 23.3% |
| music21 floatingKey (smoothed) | 17/17 | 60.4% | 99.5% | 64 | 5 | 1 | 20.0% | 1.6% | 2.9% |
| music21 floatingKey raw (one bar) | 17/17 | 40.5% | 99.4% | 64 | 1084 | 63 | 5.8% | 98.4% | 11.0% |
| music21 4-bar windows, Bellman-Budge | 17/17 | 66.5% | 99.0% | 64 | 434 | 58 | 13.4% | 90.6% | 23.3% |
| music21 4-bar windows, Aarden-Essen | 17/17 | 61.1% | 99.0% | 64 | 548 | 59 | 10.8% | 92.2% | 19.3% |
| AugmentedNet local key | 17/17 | 84.2% | 100.0% | 64 | 141 | 44 | 31.2% | 68.8% | 42.9% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 15/17 | - | - | 55 | 188 | 45 | 23.9% | 81.8% | 37.0% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 17/17 | - | - | 64 | 330 | 59 | 17.9% | 92.2% | 29.9% |

### 4.2 Named catalogue items (`cat_kc.py`, `cat_metrics.py`; data in `cat_kc_results.json`)

**Bach Inventions (expected: an area of 4+ bars on the dominant or the relative key; source: reading, the standard analysis).** Number of the 15 Inventions with such an area, by tool; `n/a` = the tool could not run on the item (the project's reader raises on No. 1).

| tool / step | found | not found | n/a |
| --- | --- | --- | --- |
| current: area found | 13 | 1 | 1 |
| current: area confirmed by a cadence (first version) | 6 | 8 | 1 |
| current: area confirmed (corrected exclusion) | 3 | 11 | 1 |
| music21 floatingKey: area found | 6 | 9 | 0 |
| music21 windows Bellman-Budge: area found | 12 | 3 | 0 |
| music21 windows Aarden-Essen: area found | 12 | 3 | 0 |
| AugmentedNet: area found | 11 | 4 | 0 |

Union of the current detector's areas and AugmentedNet's (an area in the expected relation from either): 13 of 15.

Per Invention (`yes` = an area of 4+ bars on the dominant or relative key; for the columns `cur first` and `cur corr` it must also be confirmed by a cadence; `-` none; `n/a` the tool could not run): current found / first / corrected, then music21 floatingKey, BB, AE, AugmentedNet.

| Invention | home | cur found | cur first | cur corr | m21 float | m21 BB | m21 AE | augnet |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| invention-no-1-in-c-major-bwv-772 | C major | n/a | n/a | n/a | yes | yes | yes | - |
| invention-no-2-in-c-minor-bwv-773 | C minor | yes | - | - | - | yes | yes | yes |
| invention-no-3-in-d-major-bwv-774 | D major | yes | - | - | - | yes | yes | yes |
| invention-no-4-in-d-minor-bwv-775 | D minor | yes | yes | yes | - | yes | yes | yes |
| invention-no-5-in-e-flat-major-bwv-776 | Eb major | - | - | - | yes | - | - | - |
| invention-no-6-in-e-major-bwv-777 | E major | yes | yes | - | yes | yes | yes | yes |
| invention-no-7-in-e-minor-bwv-778 | E minor | yes | - | - | - | yes | yes | yes |
| invention-no-8-in-f-major-bwv-779 | F major | yes | yes | - | - | yes | yes | yes |
| invention-no-9-in-f-minor-bwv-780 | F minor | yes | - | - | - | yes | yes | yes |
| invention-no-10-in-g-major-bwv-781 | G major | yes | - | - | - | yes | yes | yes |
| invention-no-11-in-g-minor-bwv-782 | G minor | yes | yes | yes | yes | yes | yes | yes |
| invention-no-12-in-a-major-bwv-783 | A major | yes | - | - | yes | - | - | - |
| invention-no-13-in-a-minor-bwv-784 | A minor | yes | - | - | - | yes | yes | yes |
| invention-no-14-in-b-flat-major-bwv-785 | Bb major | yes | yes | - | - | - | - | - |
| invention-no-15-in-b-minor-bwv-786 | B minor | yes | yes | yes | yes | yes | yes | yes |

**song.classical.mozart-k545-i** (expected areas from the When in Rome annotation; global key C major; catalogue score 73 bars, annotation 73 bars). 0-based bars.

| expected area | relation | current detector (areas; confirmed) | music21 floatingKey | music21 windows Bellman-Budge | music21 windows Aarden-Essen | AugmentedNet |
| --- | --- | --- | --- | --- | --- | --- |
| G major bars 12-27 | dominant | found; confirmed (first version: yes, corrected: yes) | not found | found | found | found |
| D minor bars 31-34 | other | found; confirmed (first version: yes, corrected: yes) | not found | found | found | not found |
| A minor bars 35-39 | relative | not found | not found | not found | not found | found |
| F major bars 40-49 | subdominant | found; confirmed (first version: yes, corrected: yes) | not found | found | found | found |

- current areas not in the annotation: [([19, 23], 'A minor', 'unconfirmed'), ([54, 57], 'G major', 'unconfirmed')]
- m21_float areas not in the annotation: none
- m21_win_BB areas not in the annotation: [([20, 23], 'A minor')]
- m21_win_AE areas not in the annotation: [([20, 23], 'A minor')]
- augnet areas not in the annotation: none

**song.classical.bach-wtc1-prelude-1** (expected areas from the When in Rome annotation; global key C major; catalogue score 34 bars, annotation 35 bars; **bar counts differ, bars compared by index**). 0-based bars.

| expected area | relation | current detector (areas; confirmed) | music21 floatingKey | music21 windows Bellman-Budge | music21 windows Aarden-Essen | AugmentedNet |
| --- | --- | --- | --- | --- | --- | --- |
| G major bars 5-10 | dominant | found; confirmed (first version: yes, corrected: no) | not found | found | not found | not found |

- current areas not in the annotation: [([23, 28], 'G major', 'unconfirmed')]
- m21_float areas not in the annotation: [([0, 20], 'A minor')]
- m21_win_BB areas not in the annotation: none
- m21_win_AE areas not in the annotation: [([1, 5], 'A minor')]
- augnet areas not in the annotation: none

**song.folk.happy-birthday-piano.pdmx** (expected: no modulation; source: reading. Home C major).

- current detector areas: G major bars 0-3 (first version: no cadence; corrected: not confirmed), G major bars 7-11 (first version: confirmed; corrected: not confirmed)
- m21_float: no area
- m21_win_BB: no area
- m21_win_AE: G major bars 7-11
- augnet: no area

## 5. Runtime

Seconds per piece (mean / median / max) over the pieces each step ran on; pieces have 8 to 318 analysed bars (median 73). Measured on this machine, 12 worker processes at once on 20 logical CPUs; the relation between methods is the point, not the figures.

| step | pieces | seconds per piece: mean / median / max |
| --- | --- | --- |
| music21 parse of the MusicXML | 94 | 1.00 / 0.77 / 3.81 |
| music21 K-S, whole piece | 94 | 0.09 / 0.06 / 0.47 |
| music21 Aarden-Essen, whole piece | 94 | 0.03 / 0.02 / 0.15 |
| music21 Bellman-Budge, whole piece | 94 | 0.03 / 0.02 / 0.15 |
| music21 Temperley-Kostka-Payne, whole piece | 94 | 0.03 / 0.02 / 0.13 |
| project score reader (partitura) | 81 | 0.55 / 0.38 / 2.42 |
| current detector: harmony analysis + first/corrected key + partitura K-S | 81 | 0.38 / 0.26 / 1.33 |
| current: raw 4-bar windows (partitura) | 81 | 0.14 / 0.09 / 0.58 |
| current: areas, cadences, exclusion (after the windows) | 81 | 0.00 / 0.00 / 0.01 |
| music21 floatingKey (smoothed + raw) | 94 | 3.21 / 2.18 / 14.93 |
| music21 4-bar windows, Bellman-Budge | 94 | 2.57 / 1.67 / 11.08 |
| music21 4-bar windows, Aarden-Essen | 94 | 2.75 / 1.82 / 12.42 |
| AugmentedNet inference (excluding model load) | 94 | 1.41 / 1.21 / 6.13 |

Seconds per item (mean / median / max). Measured on this machine, 12 worker processes at once; short items (median 4 bars).

| step | items | seconds per item: mean / median / max |
| --- | --- | --- |
| current detector: harmony analysis + first/corrected key + partitura K-S (after loading) | 1282 | 0.10 / 0.03 / 2.76 |
| music21 parse | 1282 | 0.08 / 0.04 / 1.30 |
| music21 K-S | 1282 | 0.05 / 0.03 / 0.57 |
| music21 Aarden-Essen | 1282 | 0.03 / 0.03 / 0.25 |
| music21 Bellman-Budge | 1282 | 0.03 / 0.02 / 0.29 |
| music21 Temperley-Kostka-Payne | 1282 | 0.03 / 0.02 / 0.19 |
| AugmentedNet inference (excluding model load) | 358 | 0.76 / 0.31 / 7.51 |

## 6. What the numbers say (each point names the table it reads)

**key.tonic-mode.**
- *The current detector reproduces the validation pass.* Generated: first version 1,027 right of 1,056 (97.3%), 18 UNKNOWN, 11 wrong answers (7 relative, 4 fifth); corrected 1,013 right (95.9%), 32 UNKNOWN, 11 relative. That is 1,027 / 1,038 answered and 1,013 / 1,024 answered, the figures of `validation.md` row 5, and real 215 / 221 and 214 / 221 likewise (section 3.2). The corrected ending vote is the worse of the two on generated items and one item worse on real items, as row 5 says; this comparison measures both and recommends the first (below).
- *No existing profile beats it on our material.* Real items: Temperley-Kostka-Payne 206 / 228 (90.4%), Bellman-Budge 88.6%, Aarden-Essen 88.2%, Krumhansl-Schmuckler 78.5%, against the first version's 215 / 228 (94.3%; 95.1% of the 226 it ran on). Generated items: Temperley-Kostka-Payne 87.4%, Krumhansl-Schmuckler 86.1%, Bellman-Budge 80.5%, Aarden-Essen 59.4% (283 relative-minor answers, the scale case of lessons item 6). On When in Rome keyboard pieces the three profiles that do well are level at 78 / 80 (97.5%) and the current detector is right on 75 of the 76 it ran on (4 reader failures).
- *AugmentedNet's first key is not better on our material.* Our real items 207 / 226 (91.6%) against the first version's 94.3% on the same 228; generated sample (every 8th, 132 items) 108 / 132 (81.8%) against 97.7% (first version) and 88.6% (Temperley-Kostka-Payne) on the same 132. On When in Rome its first key is right on 94 / 94, on the 17 held-out pieces 17 / 17 (a result that profiles also reach on those 17, 17 / 17 for Aarden-Essen, Bellman-Budge and Temperley-Kostka-Payne: that corpus cannot separate them). The survey said generated drills are outside its training domain; the 81.8% agrees.
- *Where AugmentedNet helps is the silent error.* The current answer is wrong and Bellman-Budge gives the same wrong key on 4 real items (Chopin's G minor and G-sharp minor polonaises, Scherzo No. 2, Sonata No. 2 ii: each answered with its relative major or its enharmonic). AugmentedNet's first key is right on all 4. As a rule "accept the first-version answer only when it equals Bellman-Budge and AugmentedNet's first key": of 349 items both ran on and the current detector answered, 273 are accepted (178 real, 95 generated) and 0 are wrong; 76 go to the agent (35 right, 6 wrong real; 34 right, 1 wrong generated); the 7 UNKNOWN answers also go. Without AugmentedNet, the corrected answer checked against Bellman-Budge alone accepts 199 real items and 4 of them are wrong (the first version: the same 4 items). The four are a small sample.
- Generated items declare their key in the recipe (`keySig`), which is what this page uses as reference; no detector is needed for them.

**key.change.**
- *Per bar, AugmentedNet is far ahead on When in Rome.* Local-key agreement over 8,523 bars: AugmentedNet 89.4% (84.2% on the 17 held-out pieces), the best other tool 69.2% (music21 4-bar Bellman-Budge windows), the current detector's confirmed areas 71.6% (first version) and 68.3% (corrected) on the 80 pieces it ran on, the raw windows 58.5% (section 4.1).
- *Modulation detection is poor for every method.* Against every bar-to-bar key change of the annotation (518), within one bar: AugmentedNet precision 52.6%, recall 67.0%, F1 58.9% (held-out 17: 52.5%, 60.7%, 56.3%). The current areas confirmed by a cadence: precision 37.0%, recall 22.2% (first version), 36.5% and 12.4% (corrected: the home-dominant exclusion costs 104 - 58 = 46 matched modulations, the 145-area fault of row 7 seen again). music21 floatingKey names 72 modulations in all (precision 47.2%, recall 6.6%); the 4-bar windows find most modulations (recall 88.6%) among about 2,400 marks (precision 19.3%). Annotators mark tonicisations as key changes; against key areas of 4 or more bars only (truth runs under 4 bars absorbed), AugmentedNet is at precision 32.4%, recall 70.9% (section 4.1, last tables).
- *As a candidate list for an agent* the union of AugmentedNet's and the current key areas' marks has recall 74.8% at precision 33.0% (all selected pieces, within one bar).
- *Named items* (section 4.2): the current area rule finds the expected area on 13 of the 14 readable Inventions (No. 5 none) and confirms it on 6 (first version) and 3 (corrected); AugmentedNet finds 11 of 15, Bellman-Budge windows 12 of 15, floatingKey 6 of 15; the union of current and AugmentedNet 13 of 15 (the current rule cannot read No. 1; neither finds No. 5). K. 545 i (annotation: G, D minor, A minor, F): current 3 of 4 found and confirmed, AugmentedNet 3 of 4 (it finds A minor and misses D minor), Bellman-Budge windows 3 of 4, floatingKey 0. WTC I No. 1 (annotation: G major, bars 5-10): found by the current rule (confirmed by the first version, not by the corrected), by Bellman-Budge windows, not by AugmentedNet or floatingKey (floatingKey answers A minor for 21 bars of a C major prelude). Happy Birthday (expected: no modulation): the current first version confirms a G major area at 0-based bars 7-11 (the half-cadence case; the corrected version removes it), AugmentedNet, Bellman-Budge windows and floatingKey find no area, Aarden-Essen windows find the same G major area.

**Runtime** (section 5, measured on this machine, 12 worker processes): every profile call averages under 0.1 s per piece; the current detector 0.38 s per piece on average (plus 0.55 s to read the file); music21 windowed and floatingKey analysis 2.6 to 3.2 s per piece on average (maximum 15 s); AugmentedNet 1.4 s per When in Rome piece and 0.76 s per catalogue item after a one-off start-up of about 5 s (7.2 s for a single-piece run, 1.6 s of it inference).

## 7. Limits of this pilot

- The When in Rome truth is another person's analysis (CC BY-SA 4.0); its local keys include tonicisations, so precision of every method at bar resolution is bounded by that. The 94 pieces are 80 keyboard and 14 textbook; nothing here tests pop, jazz or lead sheets, which the catalogue is full of and which no annotated set in reach covers. The textbook pieces, where the current detector ran on 5 of 14, are too few to say anything about them.
- AugmentedNet's When in Rome results are partly in-sample (63 of 80 keyboard pieces are in its training or validation split); the held-out rows are 17 pieces. Its catalogue results are on scores outside its lists but few for `key.change` (15 Inventions, 3 other items).
- The Inventions' expected relation and Happy Birthday's "no modulation" are readings, not annotations. The check for "found" uses the same 4-bar rule as the current detector, so it favours that rule's own notion of an area.
- The "current detector" is the chunk-1 validators' re-implementation (`keyfix.py`, `t_kc.py`), executed unchanged; it is not production code, and the project's reader fails on 13 of 94 When in Rome pieces and on 2 catalogue reference items (Bach Invention No. 1, an IndexError; Chopin Ballade No. 1, the line-109 fault).
- AugmentedNet ran on TensorFlow 2.15.1 and music21 6.7.1 instead of the pinned TensorFlow 2.5.0, with no check of its published accuracy; adopting it means a TensorFlow environment (a separate venv, here reached through a junction because of path length) in the build.
- One run of each; the methods are deterministic, so no variance is reported. Nothing here has been heard.

## 8. Not run, and why

- **justkeydding**: not run: needs a C++ build (section 2).
- **AnalysisGNN** (survey section 10), **DCML corpora**, **Albrecht-Shanahan set**: outside this brief.
- **When in Rome textbook pieces under 8 bars** (187, among them Reger's 117 modulation examples) and **pieces with only a `remote.json`**: not usable here (section 1).
- **AugmentedNet on 2 catalogue items** (Chopin Etude Op. 10 No. 12 and Mazurka Op. 7 No. 4: ZeroDivisionError) and **the current detector on 13 When in Rome pieces and 2 catalogue reference items, Invention No. 1 and Chopin Ballade No. 1** (reader errors).

## 9. Scripts and data in this folder

| file | what it does | writes |
| --- | --- | --- |
| `cmp_common.py` | paths, key helpers, relation classes | - |
| `cur_detector.py` | wraps the current detectors (executes `validation/t_kc.py` helpers, imports `keyfix.py`) | - |
| `wir_select.py` | selects the When in Rome pieces, parses the truth | `wir_pieces.json` |
| `wir_run.py` | current detector and music21 / partitura tools on those pieces | `wir_results.json` |
| `augnet_manifest.py`, `augnet_run.py` | AugmentedNet inputs and inference (run in `build/venv-augnet`) | `augnet_wir_raw.json`, `augnet_cat_raw.json` |
| `augnet_split.py` | which pieces are in AugmentedNet's own splits | `augnet_split.json` |
| `wir_metrics.py` | When in Rome tables (tonic-mode, key.change, runtime) | `wir_metrics.json`, `frag_wir_*.md` |
| `cat_keys.py` | tonic-mode on the catalogue's reference items | `cat_keys_results.json` |
| `cat_kc.py` | key.change on the named catalogue items | `cat_kc_results.json` |
| `cat_metrics.py` | catalogue tables | `cat_metrics.json`, `frag_cat_*.md` |
| `build_key.py` | assembles this page from `key_template.md` and the `frag_*.md` files | `key.md` |

To reproduce: `build/when-in-rome` (sparse clone, commit above), `build/augnet`, `build/venv-augnet`; run the scripts in the order of the table with the main checkout's `.venv` (music21 10.5.0, partitura 1.9.0), `-X utf8`; `augnet_run.py` with `C:/vaug/Scripts/python.exe`.

## 10. Recommendation

key.tonic-mode: code + agent — the current detector's first version answers (97.3% of 1,056 generated, 94.3% of 228 real, level with or above every tool tried: best music21 profile 90.4% real, AugmentedNet first key 91.6% real), but only where it equals Bellman-Budge and AugmentedNet's first key (273 items accepted, 0 wrong; 76 sent to the agent, 7 UNKNOWN), because 4 real minor-key items are answered with the relative major and pass a Bellman-Budge check alone.
key.change: code + agent — nothing tested decides it alone: AugmentedNet is the best proposer (89.4% bar agreement on 94 When in Rome pieces, 84.2% on the 17 it was not trained on; modulations within one bar precision 52.6%, recall 67.0%) against the current area-and-cadence rule (precision 37.0%, recall 22.2%, corrected rule recall 12.4%), so its local key, with the current areas as a second proposer (recall 74.8%), should flag the areas and an agent should decide modulation, tonicisation or prolonged dominant and the relation.
