# texture.melody-location and notation.chord-symbols: the current detectors against existing tools (step 3, area 1A), 2026-10-08

**What this is.** The bounded comparison of handoff step 3 for two area 1A characteristics, `texture.melody-location` and `notation.chord-symbols` (the second failed at its step 3, which takes the first's answer). Nothing is rewritten: this page measures the current detectors against the candidates `docs/classifier/tools-survey.md` section 5 and section 22.2 name, on annotated ground truth and on the project's own items, and ends in one recommendation line per characteristic. Method follows `docs/classifier/evidence/1B/comparison/key.md`. Base commit c47f18c7. Every figure was produced by a script in this folder (section 10); nothing is copied from the validation pages. Machine: Windows, CPU only, shared with other jobs (runtimes are relations, not general figures).

**Labels.** *measured*: a script in this folder produced it on the data named. *reading*: from the notes of a score or a text, not run, with the notes shown. Nothing here has been heard.

## 1. What was compared

**Current detectors** (the chunk-1 validators' implementations, executed unchanged; `mel_common.load_validators()` runs `validation/walk.py` with its catalogue folder and cache folder re-pointed, then imports the validators' own `common.py`, `r_melody.py`, `r_misc.py`):
- `texture.melody-location`: `validation/r_melody.py` `melody()` -- per bar, rule 1 (only one staff sounds and no accompaniment-pattern bar falls on it: that staff's top line; the guard makes a pattern bar alone UNKNOWN), rule 2 (exactly one hand carries a pattern bar by the texture rules: the other hand's top line), rule 3 (a one-staff part with lyrics or symbols), else UNKNOWN. `cur_melody.py` wraps it for score files outside the catalogue. Note-level output of the current detector = the highest note at each onset of the hand it names, in the bars it settles (its own "voice position top").
- `notation.chord-symbols`: `validation/r_misc.py` `chord_symbols()` (steps 1, 2 and 4: de-duplication, count, slash chords, N.C., text candidates by the pattern `CHORD_TXT`) and step 3 (the role of the notes in the symbol's bar) written out as `chord_role.py` from `rules/area-1A.md` section 21, using `r_melody.melody` and `r_melody.pattern_bars`.

**Candidates** (survey section 5 and section 22.2):
- skyline: the plain floor (the top note at each onset over both staves, `pop_run_cur.py`) and the MidiBERT repository's own skyline (`melody_extraction/skyline/analyzer.py` `extract_melody`: notes below MIDI 60 dropped, 8th-note grid, highest per start, run in `mb_run.py`).
- Simonetta CNN: did not run (section 2).
- MidiBERT-Piano: the v2 (6-field) melody checkpoint, run on CPU (section 2).
- `notation.chord-symbols`: music21 `ChordSymbol` / `NoChord` read from `<harmony>`; music21's text parser `harmony.ChordSymbol(text)`; Tonal `Chord.get` (tonal 6.2.0, MIT).
- A baseline that looks at nothing: "always the right hand".

**Ground truth, and the rule that fixed it before any method was scored.**
- *POP909* (github.com/music-x-lab/POP909-Dataset, commit d83e6edb, **MIT licence**, `build/pop909/repo`). A MIDI per song with three tracks: MELODY (the sung melody), BRIDGE (a second melodic line) and PIANO (the accompaniment), plus beat annotations. Selection: MidiBERT's POP909 *test split* (86 songs, `split.pkl`) intersected with its list of songs qualified as 4/4 (`qual_pieces.pkl`): all 86 qualified. These are the songs MidiBERT's authors held out of its fine-tuning (their split file; whether the re-uploaded checkpoint was trained on the same split is not stated and not checked). The data is a performance, not a score, so a two-staff piano score was built from it (`pop_build.py`): beat-interpolated, 16th grid, bars at the annotated downbeats, **staff = MIDI pitch 60 and above to the right hand, below to the left, all three tracks merged**, written as MusicXML and read back by the project's own reader. Positives: the MELODY track (variant M) or MELODY and BRIDGE (variant M+B; the MidiBERT v2 melody task labels both as melody). The same pitch at the same onset in two tracks becomes one note labelled by the highest of M, B, P. **Consequence, measured (section 4): the right-hand staff holds the melody in 96.9% of the bars that have one, so "which hand" is almost always "right" on this set; the set measures the note-level choice (which of the notes sounding is the melody) far better than the hand.**
- *Mozart sonata melodies* (Simonetta et al., ISMIR 2019; 38 movements annotated by a professional pianist; repository github.com/LIMUNIMI/Symbolic-Melody-Identification commit b114456b, MIT licence, `solo-accompaniment-dataset-pickled-nopop.tar.xz`). The annotation is a list of notes (pitch, onset, duration, melody flag) with repeats played out and no staves or bars. It was put onto the *When in Rome* scores of the same movements (CC BY-SA 4.0, github.com/MarkGotham/When-in-Rome, sparse clone of `Corpus/Piano_Sonatas`; real two-staff MusicXML) by matching each score measure's notes to the annotated notes (`moz_build.py`; rule in its header; a measure is evaluated when at least 90% of its notes are found). 34 movements, of the 36 the data and the scores share outside K475 (not a sonata in When in Rome): K330 mov 2 is marked broken in the dataset and K332 mov 2 raises in the project's reader. The 34 scores hold 5,032 bars; 4,787 are aligned and 4,763 of those have a melody note (the bars scored for agreement); 62,048 notes are evaluated (`moz_build.py` output, `mel_metrics.json`). Staves are the score's own. The annotation is one person's reading of "the main melody line".
- *Our catalogue*, `texture.melody-location`: the items the validation row names, right and wrong (`mel_named.py`): Fantaisie-Impromptu bars 1 to 4 (1-based; 0-based 0 to 3 here), Mariage d'amour bars 1 and 2, Bach Invention 4 bars 1 and 2, the Saints exercise, the boogie walking-eighths exercise, BWV 936, O Sacred Head. Expected hands are **reading** of the notes printed beside each answer (stated per item below).
- *Our catalogue*, `notation.chord-symbols`: every item with `<harmony>` (460: generated 327, PDMX 96, other 37 by id; the validation row counts 327 / 95 / 38 by its own split) for the parse; for the role, the montuno `exercise.montuno.a.2note.son-3-2`, `song.classical.1818-franz-xaver-gruber-silent-night.pdmx`, `exercise.blues.twelve-bar-shuffle.c`, `exercise.slash-bass.c` and `song.classical.czerny-the-school-of-velocity-op-299-no-10.pdmx` with an expected role per item stated from the score or the family contract (reading), and all 327 generated items for the distribution. The text route is tested on the five named items without `<harmony>`.

## 2. Tools that needed more than a call, and what did not run

**Simonetta CNN: did not run.** Repository cloned (`build/simonetta/repo`, MIT, last push 2019-10-21). The code is Python 2 on Theano and Lasagne; the authors' trained kernels ship as `nn_kernels_pop.pkl` (trained on a private pop set of 83 songs, so not on POP909) and `nn_kernels_mozart.pkl` (trained on the Mozart set used here: in-sample there). Attempt, in `build/venv-simonetta` (through the junction `C:\vsm`): `Theano 1.0.5`, `Lasagne 0.2.dev1`, numpy 1.23.5, scipy, hyperopt, music21; the sources run through `lib2to3` into a copy (`repo3`), then fixed by hand in four places (a Windows-only `tty`/`termios` import; three integer divisions). Git's line-ending conversion had corrupted the two `.pkl` kernel files in the clone (`No module named 'numpy.core.multiarray\r'`); re-downloaded raw. Theano then: (1) `import theano` fails with numpy 1.23.5 (`np.distutils.__config__ has no attribute blas_opt_info`) unless started with `THEANO_FLAGS=blas.ldflags=`; (2) with no C++ compiler on this machine (the pilot found none) the convolution does not compile: `AbstractConv2d Theano optimization failed: there is no implementation available supporting the requested options`; (3) with `optimizer_excluding=AbstractConvCheck` to fall back to Theano's Python implementation: `NotImplementedError: AbstractConv perform requires the python package for scipy.signal to be installed` (Theano 1.0.5 looks for SciPy internals that the SciPy versions available for Python 3.11 no longer have). Stopped there, about 40 minutes in; the model, a two-layer convolution over a piano roll, was not re-implemented in numpy because that would measure my port, not the tool. Its published figure (reported by MidiBERT's paper on POP909: accuracy 92.08, F1 89.13) is therefore not reproduced here.

**MidiBERT-Piano: ran, on a replacement checkpoint.** Repository `github.com/wazenmai/MIDI-BERT` (MIT), branches `CP` (4-field, `build/midibert/repo`) and `v2` (6-field, `build/midibert/repo_v2`). The Google Drive folder the README gives for the weights returns 404 (repository issue 18, June 2026); the maintainers answered there with a new public folder holding only the pre-trained and the melody-fine-tuned checkpoints. The melody checkpoint (`melody_model_best.ckpt`, 1.34 GB, public, no login or terms) loads into **neither** branch's 4-field model as the issue's second commenter reports: it has six embedding tables (4, 18, 88, 67, 66, 67 tokens), `in_linear` 768x1536; `mb_inspect.py` records the mismatch against the `CP` branch (`word_emb.3` 67 vs 66 and `in_linear` 1536 vs 1024). The `v2` branch's dictionary (`CP.pkl`: Bar, Position, Pitch, Velocity, Duration, Tempo with 4, 18, 88, 67, 66, 67 tokens) and its `MidiBERT/model.py` `MidiBert_CP` and data preparation (`data_creation/prepare_data/model.py`) match exactly, so `mb_run.py` uses the `v2` code for tokens and model (its `melody_extraction/midibert/extract.py` still builds the 4-field input and would fail). Environment: `build/venv-midibert` (junction `C:\vmb`): torch 2.14.1 CPU, transformers 4.40.2 (pinned 4.8.2 has no Python 3.11 wheel for its tokenizers, reading, not tried), miditoolkit 0.1.14, mido 1.2.10, numpy 1.26.4 (two removed aliases, `np.long` and `np.int`, patched in the runner); the one state-dict difference is the `position_ids` buffer that transformers 4.40 no longer stores (asserted to be the only one). Not verified: that the checkpoint is the one the paper's figures came from (the maintainers say only that it is the melody fine-tuned model they found), and its training split. **The checkpoint is a 3-class model** (class 1 melody, 2 bridge, 3 accompaniment): `mb_control.py` runs it on the `v2` branch's own prepared POP909 test tokens (320 sequences, 142,577 notes, whose labels merge melody and bridge as class 1): taking classes 1 or 2 as "melody or bridge" it scores accuracy 98.8%, precision 98.6%, recall 98.1%, F1 98.4% (MidiBERT's paper: two-class accuracy 99.06, F1 98.70), so the weights and the loading are the published model's (`mb_control.json`). (My first run read only class 1 as melody and an unfinished table from it was discarded; every figure below was re-run with both readings.) Both readings are reported: *class 1* (melody only, comparable to variant M) and *class 1 or 2* (comparable to M+B). Input to the model is the same quantised notes every other method sees, as a single-track MIDI with POP909's own velocities and its own first tempo (Mozart and the catalogue items: constant velocity 64 and 120 bpm, a departure from the training data); the model assumes 4/4 bars of 16 positions, so the Mozart movements in 3/4, 6/8 and 3/8 are outside its design and are also reported apart from the 4/4, 2/2 and 2/4 ones.
**A gap that was looked into and not closed.** On the paper's own prepared tokens F1 is 98.4 (control); on this comparison's POP909 scores it is 29.5 to 50.7 (section 4). Tested and ruled out: the tempo token (a first run with a constant 120 bpm gave class-1 F1 41.1 against 41.0 with each song's own tempo: `pop_mb_results_tempo120.json`), the order of the notes within one position (the control with each position's notes re-sorted by pitch scores F1 97.8: `mb_control.json`). Looked at and not a difference: the duration tokens (over the first ten prepared sequences the most common are 3, 1, 5, 7, 11; in song 011 as built here 1, 3, 5, 7, 11: `mb_tokens_diag.json`). Not tested: the MidiBERT repository's own `preprocess.py` (re-alignment and justification of note times, velocities per track) was not run, and the order of notes inside a position follows the track order in its data (melody, bridge, piano) only in the control. The cause of the gap is therefore **unknown**; MidiBERT's POP909 figures below are for inputs built the way this comparison builds them, its in-distribution score is the control's, and a reader should not take either as its score on a learner's piano score. Runtime: CPU, shared machine.

**Tonal: ran after a local repair.** `npm install tonal@6.2.0` into `build/tonal`; the published packages name `dist/index.js` as `main` but ship `dist/index.cjs`, so `require('tonal')` fails (`Cannot find module ... @tonaljs\abc-notation\dist\index.js`); `dist/index.cjs` was copied to `dist/index.js` in each of the 19 `@tonaljs` packages (a packaging problem, not the library's logic). The survey's candidate `@tonaljs/chord` is part of `tonal`; the same functions were run.

**music21 and partitura** (installed; music21 10.5.0): music21's `<harmony>` reader and text parser were run as is.

**Not run: Simonetta CNN (above).** No other candidate in the survey rows for these two characteristics.


## 3. The question each benchmark answers, against the question a learner has

- *POP909's melody track is the sung melody of a pop arrangement*, which the arranger wrote as a separate track. The question this project asks is which line a learner must bring out in a classical or lead-sheet piano score, where the tune may sit in an inner voice, move between hands, be imitated, doubled or accompanied by figuration that is more active than the tune. A method that scores well on POP909 has learned to find the sung line in pop arrangements.
- *Staff is not hand, and top is not melody.* The POP909 scores here put the pitch-60 split on the right hand and the melody track is above it in 96.9% of the bars, so any method that says "right hand" scores 96.9%; the same for the Mozart set (96.5%, from the score's own staves). "Correct bars" is therefore reported beside the always-right baseline and beside the left-hand bars found, which is where a hand decision is needed. The note-level scores are the informative ones on both sets.
- *Agreement between methods is confidence, not proof.* Two methods can share an error (the skyline and the current rules both name the left hand in the Fantaisie-Impromptu's arpeggio bars). Where a rule below accepts a bar because methods agree, the accepted-and-wrong count is shown.
- *The Mozart annotation* is one pianist's reading of the main line of a classical piano sonata, on real staves: closer to the learner's question, but it is also one reading, and imitation and exchange between hands are exactly where annotators differ.

## 4. texture.melody-location results

**Truth, measured** (`mel_eval.py`, `mel_metrics.json`): POP909 test songs, 86 songs, 141,976 notes, 29,379 melody-track notes (51,336 with the bridge track); bars with a melody 5,551 (variant M), of which the right hand holds 5,380 and the left hand 171. Mozart, 34 movements, 62,048 evaluated notes of which 30,289 are melody; 4,763 bars with a melody: right 4,596, left 167.

How to read the tables. *correct / bars*: the method's hand equals the truth hand; an unanswered bar is counted wrong. *left-hand bars found / present*: of the bars whose melody is in the left staff, how many the method names left. *right-hand bars named left*: the opposite error. Note P/R/F1: among the notes, those the method calls melody (current detector: the highest note at each onset of the hand it names, in the bars it settles; skyline and MidiBERT: their own note labels). *F1 inside bars it answered*: the same, restricted to bars where the method named a hand.

### 4.1 POP909, positives = the MELODY track (variant M), 86 songs

| method | pieces | bars with a melody | answered (coverage) | correct / bars (UNKNOWN wrong) | correct / answered | left-hand bars found / present | right-hand bars named left | note P | note R | note F1 | note accuracy | F1 inside bars it answered | seconds per piece mean / median / max | s per 1000 notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| always the right hand (no look at the notes) | 86 | 5551 | 5551 (100.0%) | 5380 (96.9%) | 96.9% | 0 / 171 | 0 | n/a | n/a | n/a | n/a | n/a | - | - |
| current detector (r_melody rules 1, 2, 3) | 86 | 5551 | 125 (2.3%) | 122 (2.2%) | 97.6% | 6 / 171 | 3 | 31.5% | 1.4% | 2.6% | 79.0% | 46.7% | 0.61 / 0.59 / 1.69 | 0.37 |
| skyline, plain (top note at each onset) | 86 | 5551 | 5551 (100.0%) | 5300 (95.5%) | 95.5% | 74 / 171 | 154 | 37.2% | 87.1% | 52.1% | 66.9% | 52.1% | 0.00 / 0.00 / 0.00 | 0.00 |
| skyline, MidiBERT repo (notes >= 60, 8th grid) | 86 | 5551 | 5543 (99.9%) | 5375 (96.8%) | 97.0% | 0 / 171 | 0 | 48.3% | 57.9% | 52.7% | 78.5% | 52.7% | 0.02 / 0.01 / 0.03 | 0.01 |
| MidiBERT-Piano, class 1 = melody | 86 | 5551 | 2427 (43.7%) | 2387 (43.0%) | 98.4% | 35 / 171 | 32 | 86.2% | 26.9% | 41.0% | 84.0% | 64.5% | 1.94 / 2.00 / 2.85 | 1.17 |
| MidiBERT-Piano, class 1 or 2 = melody or bridge | 86 | 5551 | 4035 (72.7%) | 3929 (70.8%) | 97.4% | 81 / 171 | 61 | 56.9% | 37.6% | 45.3% | 81.2% | 52.1% | 1.94 / 2.00 / 2.85 | 1.17 |

### 4.2 POP909, positives = MELODY and BRIDGE tracks (variant M+B), 86 songs

| method | pieces | bars with a melody | answered (coverage) | correct / bars (UNKNOWN wrong) | correct / answered | left-hand bars found / present | right-hand bars named left | note P | note R | note F1 | note accuracy | F1 inside bars it answered | seconds per piece mean / median / max | s per 1000 notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| always the right hand (no look at the notes) | 86 | 7115 | 7115 (100.0%) | 6962 (97.8%) | 97.8% | 0 / 153 | 0 | n/a | n/a | n/a | n/a | n/a | - | - |
| current detector (r_melody rules 1, 2, 3) | 86 | 7115 | 187 (2.6%) | 182 (2.6%) | 97.3% | 9 / 153 | 5 | 59.1% | 1.5% | 2.8% | 64.0% | 68.4% | 0.61 / 0.59 / 1.69 | 0.37 |
| skyline, plain (top note at each onset) | 86 | 7115 | 7115 (100.0%) | 6793 (95.5%) | 95.5% | 85 / 153 | 254 | 61.0% | 81.8% | 69.9% | 74.5% | 69.9% | 0.00 / 0.00 / 0.00 | 0.00 |
| skyline, MidiBERT repo (notes >= 60, 8th grid) | 86 | 7115 | 7092 (99.7%) | 6944 (97.6%) | 97.9% | 0 / 153 | 0 | 81.3% | 55.7% | 66.1% | 79.3% | 66.2% | 0.02 / 0.01 / 0.03 | 0.01 |
| MidiBERT-Piano, class 1 = melody | 86 | 7115 | 2660 (37.4%) | 2617 (36.8%) | 98.4% | 35 / 153 | 36 | 97.9% | 17.5% | 29.6% | 70.0% | 58.7% | 1.94 / 2.00 / 2.85 | 1.17 |
| MidiBERT-Piano, class 1 or 2 = melody or bridge | 86 | 7115 | 5094 (71.6%) | 4976 (69.9%) | 97.7% | 78 / 153 | 100 | 93.9% | 35.5% | 51.5% | 75.8% | 61.1% | 1.94 / 2.00 / 2.85 | 1.17 |

MidiBERT's own score on its own prepared tokens (the control, section 2): accuracy 98.8%, F1 98.4% for classes 1 or 2 against melody-plus-bridge; the numbers in these two tables are for this comparison's input, with the gap unexplained (section 2).

### 4.3 Mozart sonatas (Simonetta annotation on When in Rome scores), 34 movements, all aligned bars

| method | pieces | bars with a melody | answered (coverage) | correct / bars (UNKNOWN wrong) | correct / answered | left-hand bars found / present | right-hand bars named left | note P | note R | note F1 | note accuracy | F1 inside bars it answered | seconds per piece mean / median / max | s per 1000 notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| always the right hand (no look at the notes) | 34 | 4763 | 4763 (100.0%) | 4596 (96.5%) | 96.5% | 0 / 167 | 0 | n/a | n/a | n/a | n/a | n/a | - | - |
| current detector (r_melody rules 1, 2, 3) | 34 | 4763 | 1072 (22.5%) | 949 (19.9%) | 88.5% | 41 / 167 | 116 | 94.2% | 18.2% | 30.5% | 59.5% | 88.2% | 1.52 / 1.09 / 12.25 | 0.78 |
| skyline, plain (top note at each onset) | 34 | 4763 | 4763 (100.0%) | 4018 (84.4%) | 84.4% | 114 / 167 | 692 | 75.3% | 97.3% | 84.9% | 83.1% | 84.9% | 0.00 / 0.00 / 0.01 | 0.00 |
| skyline, MidiBERT repo (notes >= 60, 8th grid) | 0 | - | did not run on this set | | | | | | | | | | | |
| MidiBERT-Piano, class 1 = melody | 34 | 4763 | 818 (17.2%) | 798 (16.8%) | 97.6% | 2 / 167 | 12 | 96.9% | 10.2% | 18.5% | 56.0% | 61.0% | 2.01 / 1.83 / 4.15 | 1.04 |
| MidiBERT-Piano, class 1 or 2 = melody or bridge | 34 | 4763 | 3393 (71.2%) | 3140 (65.9%) | 92.5% | 37 / 167 | 201 | 83.9% | 46.0% | 59.4% | 69.3% | 68.4% | 2.01 / 1.83 / 4.15 | 1.04 |

### 4.4 Mozart, the 18 movements in 4/4, 2/2 or 2/4 (MidiBERT's design assumes 4/4)

| method | pieces | bars with a melody | answered (coverage) | correct / bars (UNKNOWN wrong) | correct / answered | left-hand bars found / present | right-hand bars named left | note P | note R | note F1 | note accuracy | F1 inside bars it answered | seconds per piece mean / median / max | s per 1000 notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| always the right hand (no look at the notes) | 18 | 2513 | 2513 (100.0%) | 2444 (97.3%) | 97.3% | 0 / 69 | 0 | n/a | n/a | n/a | n/a | n/a | - | - |
| current detector (r_melody rules 1, 2, 3) | 18 | 2513 | 596 (23.7%) | 542 (21.6%) | 90.9% | 26 / 69 | 53 | 94.7% | 19.0% | 31.7% | 59.1% | 89.5% | 1.93 / 1.30 / 12.25 | 0.89 |
| skyline, plain (top note at each onset) | 18 | 2513 | 2513 (100.0%) | 2142 (85.2%) | 85.2% | 47 / 69 | 349 | 74.9% | 97.4% | 84.7% | 82.4% | 84.7% | 0.00 / 0.00 / 0.01 | 0.00 |
| skyline, MidiBERT repo (notes >= 60, 8th grid) | 0 | - | did not run on this set | | | | | | | | | | | |
| MidiBERT-Piano, class 1 = melody | 18 | 2513 | 485 (19.3%) | 470 (18.7%) | 96.9% | 0 / 69 | 8 | 95.8% | 9.4% | 17.2% | 54.6% | 57.3% | 2.22 / 2.32 / 4.15 | 1.03 |
| MidiBERT-Piano, class 1 or 2 = melody or bridge | 18 | 2513 | 2005 (79.8%) | 1900 (75.6%) | 94.8% | 9 / 69 | 79 | 86.6% | 51.8% | 64.9% | 72.0% | 70.6% | 2.22 / 2.32 / 4.15 | 1.03 |

### 4.5 Where the methods agree (the plain skyline, MidiBERT and the current rules), and what they get wrong when they agree

Rule: accept a bar's hand only where every method listed answers and they name the same hand; the rest go to the agent. Bars are the bars with a truth melody (variant M on POP909).

| set | bars with a melody | the rule | accepted (hand named by all) | accepted and right | accepted and wrong | sent to the agent | left-hand bars | accepted as left / of those right |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POP909 (M) | 5551 | skyline_plain = current | 114 | 114 | 0 | 5437 | 171 | 3 / 3 |
| POP909 (M) | 5551 | skyline_plain = midibert | 2335 | 2327 | 8 | 3216 | 171 | 19 / 18 |
| POP909 (M) | 5551 | skyline_plain = midibert_12 | 3838 | 3798 | 40 | 1713 | 171 | 39 / 34 |
| POP909 (M) | 5551 | skyline_plain = midibert_12 = current | 76 | 76 | 0 | 5475 | 171 | 3 / 3 |
| Mozart | 4763 | skyline_plain = current | 706 | 705 | 1 | 4057 | 167 | 40 / 40 |
| Mozart | 4763 | skyline_plain = midibert | 784 | 768 | 16 | 3979 | 167 | 10 / 2 |
| Mozart | 4763 | skyline_plain = midibert_12 | 2783 | 2704 | 79 | 1980 | 167 | 78 / 24 |
| Mozart | 4763 | skyline_plain = midibert_12 = current | 488 | 487 | 1 | 4275 | 167 | 8 / 8 |

### 4.6 The items the validation row names (right and wrong), per bar

Expected hand per bar is a **reading** of the notes shown in `mel_named.json` (hand = staff; "none" = no melody in the bar; an answer of UNKNOWN or no hand counts as right for "none"). Scores are bars right / bars (`mel_named_scores.json`).

| item (0-based bars) | expected | current detector | plain skyline | MidiBERT (class 1 or 2) |
| --- | --- | --- | --- | --- |
| Fantaisie-Impromptu, bars 0 to 7 | bars 0 to 3: none (left hand alone: held octaves, then the arpeggio; bar 1 is a rest); bars 4 to 7: right | 2 / 8: names the left hand in bar 0 (held octaves) and bar 2 (the arpeggio), the two errors the validation row lists; leaves bars 4 to 7 UNKNOWN | 5 / 8: names the left hand in bars 0, 2 and 3 | 8 / 8 |
| Mariage d'amour, bars 0 to 4 | bars 0, 1: none (a left-hand pattern alone); bars 2 to 4: right | 5 / 5 | 3 / 5 (left hand in bars 0 and 1) | 5 / 5 |
| Bach Invention 4, bars 0 and 1 | right (the subject, alone in the right hand) | 2 / 2 | 2 / 2 | 2 / 2 |
| Saints alternating exercise, bars 0 to 8 | bars 0 to 3 right, bars 4 to 8 left (the family: the tune changes hands) | 9 / 9 | 9 / 9 | 0 / 9: names no line in a bar that holds only the tune |
| boogie walking-eighths exercise, bars 0 to 3 | **undecided**: a held right-hand chord over a left-hand walking line; the current rule names the right hand, the skyline the left; MidiBERT names mostly right (3 of 4 notes) | - | - | - |
| BWV 936, bars 0 to 3; O Sacred Head, bars 0 to 3 | UNKNOWN or candidates (two or four voices of equal weight, imitation): reading | 7 of 8 UNKNOWN; BWV 936 bar 2 forced to the left hand (`rule2`) | a hand named in all 8 (right, by the top voice) | names a melody in 1 of 8 bars |

## 5. notation.chord-symbols results

### 5.1 The symbols as the notation states them

### Parse of `<harmony>` (reading the notation)

| pipeline | items with `<harmony>` | symbols raw: current walk / music21 | after de-duplication: walk / music21 | N.C.: walk / music21 | slash chords: walk / music21 (reference) | items whose symbols (root, bass, N.C.) equal the reference: current / music21 | music21 errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| generated | 327 | 1520 / 1520 | 1520 / 1520 | 0 / 0 | 12 / 12 (12) | 327 / 327 | 0 |
| pdmx | 96 | 4984 / 4984 | 3619 / 3617 | 56 / 56 | 299 / 299 (299) | 96 / 95 | 0 |
| other | 37 | 1364 / 1370 | 1268 / 1268 | 6 / 6 | 104 / 104 (104) | 37 / 37 | 0 |
| all | 460 | 7868 / 7874 | 6407 / 6405 | 62 / 62 | 415 / 415 (415) | 460 / 459 | 0 |

**Text route**: {"distinct": 239, "symbols": 2628, "m21": {"strings_parsed": 150, "strings_root_bass_right": 126, "symbols_parsed": 2250, "symbols_root_bass_right": 1803}, "tonal": {"strings_parsed": 202, "strings_root_bass_right": 202, "symbols_parsed": 2489, "symbols_root_bass_right": 2489}, "regex": {"strings_parsed": 174, "strings_root_bass_right": null, "symbols_parsed": 2408, "symbols_root_bass_right": null}}

music21 chord kinds read from `<harmony>` over all 460 items: {"major": 2397, "minor": 850, "dominant-seventh": 1877, "minor-seventh": 529, "major-seventh": 263, "minor-11th": 16, "suspended-second": 16, "suspended-fourth": 31, "power": 13, "major-sixth": 65, "minor-ninth": 23, "minor-sixth": 28, "augmented": 8, "diminished": 102, "augmented-seventh": 19, "dominant-ninth": 18, "half-diminished-seventh": 40, "minor-major-seventh": 7, "other": 8, "diminished-seventh": 23, "major-ninth": 1, "dominant-13th": 8, "major-13th": 1}



Reading of the figures: on the 460 items the current reading (raw walk, `r_misc.chord_symbols`) and music21's `<harmony>` reader agree on the symbols in 459 items (root, bass, N.C. after de-duplication); the exception is `song.folk.muskrat-ramble.pdmx`, 37 symbols by the walk against 35 by music21 (cause not traced), and the raw count differs on `song.classical.brahms-hungarian-dance-5` (6 by the walk, 12 by music21; cause not traced, probably repeats). Slash chords 415 and N.C. 62 are the same. A duplicated symbol (the same time, root, kind and bass written once per staff) is removed by both; whether a repeated symbol is a second chord change is not a question of the notation and stays with the harmony rules.

### 5.2 Symbols typed as text

### Parse of symbols typed as text (239 distinct printed strings, 2,628 symbols, built from each symbol's own printed root, kind text and bass)

| parser | strings parsed | strings with the right root and bass | symbols parsed | symbols with the right root and bass |
| --- | --- | --- | --- | --- |
| current text rule (the validators' pattern, `CHORD_TXT`) | 174 / 239 | n/a (matches a pattern only) | 2408 / 2628 | n/a |
| music21 `harmony.ChordSymbol(text)` | 150 / 239 | 126 | 2250 / 2628 | 1803 |
| Tonal `Chord.get` (tonal 6.2.0) | 202 / 239 | 202 | 2489 / 2628 | 2489 |


### Text candidates on the named items without `<harmony>`

| item | what it holds (reading) | words the current rule offers as symbols | Tonal | music21 |
| --- | --- | --- | --- | --- |
| song.pop.coldplay-fix-you-coldplay.pdmx | reading: real chord symbols typed as words (validation row) | Ex2, Gmx2, Cmx2, Gm/B, B | E: E major; Gm: G minor; Cm: C minor; Gm/B: G minor over B; B: B major | E: major; Gm: minor; Cm: minor; Gm/B: minor; B: major |
| song.classical.i-got-rythm.pdmx | reading: real chord symbols typed as words (validation row) | B6x2, F10, Bdim7/D, Cm9x2, E, D | B6: B sixth; F10: not a chord; Bdim7/D: B diminished seventh over D; Cm9: C minor ninth; E: E major; D: D major | B6: major-sixth; F10: ; Bdim7/D: diminished-seventh; Cm9: minor-ninth; E: major; D: major |
| song.classical.handel-halvorsen-passacaglia | reading: real chord symbols typed as words (validation row) | Amx2, Dmx2, G, C, F, E | Am: A minor; Dm: D minor; G: G major; C: C major; F: F major; E: E major | Am: minor; Dm: minor; G: major; C: major; F: major; E: major |
| song.classical.chopin-chopin-waltz-in-a-minor-piano-solo.pdmx | reading: note-name reading aids, not chord symbols (validation row) | Ex2, Ax2, B, Cx3 | E: E major; A: A major; B: B major; C: C major | E: major; A: major; B: major; C: major |
| song.classical.mozart-mozart-minuet-in-f-major-k2-easy.pdmx | reading: digit words (fingerings), not Nashville numbers (validation row) | none | - | - |



Failures worth naming (measured, `chord_parse_text.json`): music21's text parser reads "Bb7" as root B (171 symbols; the root-letter-plus-flat is not taken as the root before a number) and likewise "Eb7", "Ab7", "Db7", "Ab6", "Bb7/F": 24 spellings, 447 symbols parse with the wrong root or bass; it raises on 89 spellings (378 symbols), among them "Bbm7" and "Ebm7". Tonal parses 202 of 239 spellings and every one it parses has the right root and bass; what it does not parse is a notation convention (`mi` for minor: "Gmi", "Cmi6"; "C/6"; "A-7(b5)"; a private-use glyph), 139 symbols. Neither separates a symbol from a note-name aid: both read the Chopin waltz's letters "E", "A", "B", "C" as major chords. The current pattern also offers those letters, so the text route stays a candidate generator in every case.

### 5.3 The role of the notes under each symbol (step 3), named items

Expected role per item is stated from the score (reading) or the family contract; "right / symbols" counts symbols whose answer equals it. "family fix" = step 3 with the generated family's own statement used first, set for the montuno only (the one family the validation row names). MidiBERT's role = over a melody line where it labels at least one note of class 1 or 2 in the bar, else over written accompaniment.

### Role of the notes under each symbol, named items (symbols right / symbols)

| item | expected role (source) | symbols | current step 3 | with the family fix | skyline | MidiBERT |
| --- | --- | --- | --- | --- | --- | --- |
| exercise.montuno.a.2note.son-3-2 | over written accompaniment (score: right hand only, two-note chord-tone figure on the clave strokes, no line; contract name 'a right-hand montuno of chord tones') | 4 | 0 ({'over a melody line': 4}) | 4 ({'over written accompaniment': 4}) | 0 | 0 / 4 ({'over a melody line': 4}) |
| song.classical.1818-franz-xaver-gruber-silent-night.pdmx | over a melody line (score: one staff, single notes (the tune), symbols above it) | 11 | 11 ({'over a melody line': 11}) | 11 ({'over a melody line': 11}) | 11 | 9 / 11 ({'over a melody line': 9, 'over written accompaniment': 2}) |
| exercise.blues.twelve-bar-shuffle.c | over written accompaniment (score: right-hand seventh chords on beats 1 and 3, left-hand shuffle bass; no line) | 12 | 0 ({'over a melody line': 12}) | 0 ({'over a melody line': 12}) | 0 | 7 / 12 ({'over written accompaniment': 7, 'over a melody line': 5}) |
| exercise.slash-bass.c | over written accompaniment (score: held triads in the right hand, walking bass in the left; no line) | 8 | 0 ({'UNKNOWN role of the notes': 8}) | 0 ({'UNKNOWN role of the notes': 8}) | 0 | 8 / 8 ({'over written accompaniment': 8}) |
| song.classical.czerny-the-school-of-velocity-op-299-no-10.pdmx | per bar: right hand sounds -> over a melody line; left hand alone -> over written accompaniment (score (reading): the left hand is a continuous broken-chord figure, the right hand the running line; judged, not annotated) | 122 | 81 ({'over written accompaniment': 6, 'over a melody line': 75, 'UNKNOWN role of the notes': 41}) | 81 ({'over written accompaniment': 6, 'over a melody line': 75, 'UNKNOWN role of the notes': 41}) | 116 | 122 / 122 ({'over written accompaniment': 6, 'over a melody line': 116}) |


### Generated items with symbols: current step 3 answer per symbol, the fix, and the same-signature count

| family | items | current answers (symbols) | answers with the montuno fix | items whose only sounding staff plays chords in every symbol bar and are answered 'over a melody line' |
| --- | --- | --- | --- | --- |
| comping | 58 | {'UNKNOWN role of the notes': 184, 'over a melody line': 48} | {'UNKNOWN role of the notes': 184, 'over a melody line': 48} | 0 |
| seventh_voicing | 48 | {'UNKNOWN role of the notes': 144} | {'UNKNOWN role of the notes': 144} | 0 |
| boogie | 36 | {'over a melody line': 144} | {'over a melody line': 144} | 0 |
| ii_v_i | 36 | {'UNKNOWN role of the notes': 36, 'over a melody line': 72} | {'UNKNOWN role of the notes': 36, 'over a melody line': 72} | 24 |
| walking_bass | 28 | {'UNKNOWN role of the notes': 155, 'over a melody line': 137} | {'UNKNOWN role of the notes': 155, 'over a melody line': 137} | 0 |
| four_chord_loop | 24 | {'UNKNOWN role of the notes': 96} | {'UNKNOWN role of the notes': 96} | 0 |
| open_voicing | 16 | {'UNKNOWN role of the notes': 64} | {'UNKNOWN role of the notes': 64} | 0 |
| montuno | 15 | {'over a melody line': 60} | {'over written accompaniment': 60} | 15 |
| turnaround | 12 | {'UNKNOWN role of the notes': 48} | {'UNKNOWN role of the notes': 48} | 0 |
| oompah | 8 | {'over a melody line': 32} | {'over a melody line': 32} | 0 |
| None | 6 | {'over a melody line': 72} | {'over a melody line': 72} | 0 |
| intro | 5 | {'over a melody line': 15, 'UNKNOWN role of the notes': 5} | {'over a melody line': 15, 'UNKNOWN role of the notes': 5} | 0 |
| latin_groove | 5 | {'UNKNOWN role of the notes': 40} | {'UNKNOWN role of the notes': 40} | 0 |
| tumbao | 5 | {'over a melody line': 40} | {'over a melody line': 40} | 0 |
| passing_chord | 4 | {'UNKNOWN role of the notes': 24} | {'UNKNOWN role of the notes': 24} | 0 |
| slash_bass | 4 | {'UNKNOWN role of the notes': 32} | {'UNKNOWN role of the notes': 32} | 0 |
| stride | 4 | {'UNKNOWN role of the notes': 16} | {'UNKNOWN role of the notes': 16} | 0 |
| tritone_sub | 4 | {'UNKNOWN role of the notes': 12} | {'UNKNOWN role of the notes': 12} | 0 |
| walkup | 4 | {'UNKNOWN role of the notes': 16} | {'UNKNOWN role of the notes': 16} | 0 |
| power_chord | 3 | {'UNKNOWN role of the notes': 12} | {'UNKNOWN role of the notes': 12} | 0 |
| meter | 1 | {'over a melody line': 12} | {'over a melody line': 12} | 0 |
| secondary_rag | 1 | {'over a melody line': 4} | {'over a melody line': 4} | 0 |

Reading of the table: the current step 3 is right on 11 of 11 symbols for the tune (Silent Night), on 0 of 4 for the montuno (the validation row's failure, reproduced), and also on 0 of 12 for the twelve-bar shuffle, which the validation row does not name: right-hand chords over a left-hand pattern come out as "over a melody line" by melody-location's rule 2 (the hand opposite the pattern). The same answer fills the 36 generated boogie items (144 symbols all "over a melody line"; their expected role is not stated by a contract, so it is not scored). The montuno fix turns the montuno's 4 of 4 and its family's 60 of 60 symbols to "over written accompaniment" and changes nothing else; 24 ii-V-I items (rootless voicings) have the montuno's signature (one staff sounds, chords only, answered "over a melody line") and are not covered by it. MidiBERT gets the slash-bass item 8 of 8 and the Czerny etude 122 of 122 (a per-bar reading), the tune 9 of 11, the shuffle 7 of 12 and the montuno 0 of 4. No method is right on all five.

## 6. What the numbers say (each point names the table it reads)

**texture.melody-location.**
- *The current rules are right when they answer and answer rarely* (4.1, 4.3): 97.6% of the 125 bars they settle on POP909 (2.3% of the bars with a melody) and 88.5% of 1,072 on Mozart (22.5%); 3 and 116 right-hand bars named left. Their note-level F1 is 2.6 (POP909) and 30.5 (Mozart); inside the bars they settle 46.7 and 88.2. They find 6 of 171 and 41 of 167 left-hand-melody bars.
- *The plain skyline always answers and is right about as often as "right hand"* (4.1, 4.3): 95.5% on POP909 (always-right: 96.9%) and 84.4% on Mozart (always-right: 96.5%); it names the left hand in 154 and 692 right-hand bars. Note-level F1 52.1 (POP909, melody track), 69.9 (with the bridge), 84.9 (Mozart, precision 75.3, recall 97.3). It finds 74 of 171 and 114 of 167 left-hand bars. The repository's own skyline (notes below 60 dropped) never names the left hand (0 of 171) and gets F1 52.7 and 66.1 on POP909; it was not run on Mozart (its code reads the three POP909 tracks).
- *MidiBERT, with this comparison's input, is the most careful and answers least where it is not sure* (4.1 to 4.4): class 1 names a hand in 43.7% of the POP909 melody bars, 98.4% of them right, note precision 86.2% and recall 26.9% (F1 41.0); class 1 or 2 against melody-plus-bridge names a hand in 71.6% of bars at 97.7%, F1 51.5 (the skyline: 69.9). On Mozart class 1 answers 17.2% of bars (97.6% right, F1 18.5), class 1 or 2 71.2% of bars at 92.5%, F1 59.4 against the skyline's 84.9. On the Fantaisie-Impromptu bars (current rules 2 of 8 right, skyline 5 of 8) it is right on 8 of 8, and on Mariage d'amour (skyline 3 of 5) 5 of 5 (4.6); on the Saints exercise (a lone tune, no accompaniment) it names nothing in 9 bars, and on the Silent Night it calls two of 11 symbol bars accompaniment: it needs an accompaniment to contrast with. Its published score is not reproduced on this input (section 2).
- *Agreement rules* (4.5): current = skyline accepts 114 POP909 bars (all right) and 706 Mozart bars (705 right, 1 wrong), i.e. no more than the current rules alone settle, and 3 and 40 left-hand bars; skyline = MidiBERT (class 1 or 2) accepts 3,838 POP909 bars with 40 wrong, and 2,783 Mozart bars with 79 wrong and only 24 of its 78 left-hand acceptances right. So agreement among the model and the skyline is not a safe acceptance rule for the left hand: the two share the "top voice" error.
- *Nothing tested settles the left hand reliably.* Left-hand-melody bars found: plain skyline 74 of 171 (POP909) and 114 of 167 (Mozart) at the price of 154 and 692 right-hand bars named left; MidiBERT class 1 or 2 81 and 37 at the price of 61 and 201; the current rules 6 and 41 at 3 and 116.

**notation.chord-symbols.**
- *The symbols themselves*: reading `<harmony>` is solved: the current reading and music21 agree on 459 of 460 items (5.1). Text spellings are not: music21's parser misreads flats and Tonal does not read the `mi`/`-` conventions; neither tells a chord from a note letter (5.2).
- *The role under a symbol is the weak step and it fails beyond the one item named* (5.3): the shuffle (0 of 12) and the 36 boogie items show that the failure is melody-location's rule 2 naming a chord hand as the melody, not only the montuno's rule 1.
- *The smallest fix the validation row points to repairs its own example and nothing else*: montuno 4 of 4, family 60 of 60 symbols; shuffle, slash-bass and the 24 ii-V-I items unchanged.

## 7. Runtime (measured, this machine; seconds)

| step | pieces | seconds per piece mean / median / max |
| --- | --- | --- |
| current melody-location rules, POP909 scores (about 1,650 notes) | 86 | 0.61 / 0.59 / 1.69 (0.37 s per 1,000 notes) |
| current melody-location rules, Mozart scores | 34 | 1.52 / 1.09 / 12.25 (0.78 s per 1,000 notes) |
| plain skyline | 120 | under 0.01 |
| MidiBERT skyline (repo code) | 86 | 0.01 / 0.01 / 0.03 |
| MidiBERT-Piano on CPU (after loading the 1.34 GB checkpoint) | 86 POP909 | 1.94 / 2.00 / 2.85 (1.17 s per 1,000 notes) |
| MidiBERT-Piano on CPU | 34 Mozart | 2.01 / 1.83 / 4.15 (1.04 s per 1,000 notes) |
| chord symbols: current reading, 460 items | 460 | 0.1 s in all (from the cached raw walk) |
| chord symbols: music21 `<harmony>` including parsing the file | 460 | 14.9 s in all (0.03 s per item) |
| Tonal on the 239 distinct spellings | 239 | under 1 s in all, one `node` call |

(An earlier MidiBERT run of 35 to 145 s per song was taken while four other jobs shared the machine and was discarded; the model's first start costs a few seconds to read the checkpoint.)

## 8. Limits

- *POP909 as built here is a stand-in for a piano score*: a performance MIDI quantised to the 16th with the staff set by a pitch split. The hand truth is 96.9% right by construction of the data (the sung line is high), so hand figures on it say little; its melody labels are the arranger's. The re-uploaded MidiBERT checkpoint reproduces the paper on the paper's tokens and not on these, for a reason not found.
- *The Mozart truth is one annotator's, transferred onto another edition's score*: 34 of 36 shared movements, 4,787 of 5,032 bars (95%), notes unmatched inside an aligned bar are left out. For x/8 and 2/2 movements the annotation's quarter lengths run at 2x and 0.5x the project reader's `onset_quarter` while the reader's bar lengths (3.0 for 6/8, 4.0 for 2/2) are right (the per-movement scale is `quarter_scale` in `build/mozart/*.truth.json`, 2.0 for K280-2, K280-3, K281-2, K283-3, K331-1, K332-3 and 0.5 for K281-3, K284-3, K333-3, K533-1, K533-3; cause not traced); the alignment found the scale per movement and the detectors were run on the reader's own timeline.
- *Expected roles for chord symbols are readings* of five items' scores (and the contract's name for the montuno), not annotations; Czerny's per-bar expectation is judged. No annotated chord-role set exists in reach (the survey names the Jazz Harmony Treebank and Chordonomicon for chord symbols; neither was downloaded: the brief named the validation row's items).
- *One run of each; deterministic methods* so no variance is reported. MidiBERT's CPU float results do not vary run to run in these data (a repeat run on the Mozart set was not made).
- Nothing here has been heard.

## 9. Not run, and why

- **Simonetta CNN**: not run: Python 2 on Theano 1.0.5 with no C++ compiler on this machine; the Python fallback needs SciPy internals Python 3.11's SciPy no longer has (exact errors in section 2). Its Mozart-trained kernels would also have been in-sample on the Mozart set.
- **MidiBERT on the 4-field `CP` branch**: the only available checkpoint is the 6-field `v2` one (section 2).
- **Annotated chord-role data and the Jazz Harmony Treebank / Chordonomicon**: not downloaded; licences were not settled in the survey and the brief named the validation row's items.
- **`song.classical.chopin-ballade-1`-style reader failures**: the project's reader raised on K332 mov 2 (`IndexError: boolean index did not match`, the `score.py` line-109 fault listed on `rules/area-1B.md`); that movement is out.
- **MidiBERT's own `preprocess.py`** (the re-alignment that may close the POP909 gap) was not run.

## 10. Scripts and data in this folder

| file | what it does | writes |
| --- | --- | --- |
| `mel_common.py` | paths; runs the validators' `walk.py` against the catalogue in place and imports their `common`, `r_melody`, `r_misc` unchanged | - |
| `cur_melody.py` | the current melody-location rules on a score file outside the catalogue | - |
| `xmlwrite.py`, `pop_build.py` | POP909 test songs -> two-staff MusicXML, MIDI, truth | `build/pop909/scores/*` |
| `moz_build.py` | Mozart annotation -> When in Rome scores, aligned bars, truth | `build/mozart/*` |
| `pop_run_cur.py`, `moz_run_cur.py` | current detector and plain skyline | `pop_cur_results.json`, `moz_cur_results.json` |
| `mb_run.py` (run in `build/venv-midibert`) | MidiBERT-Piano v2 and the repo skyline on POP909, Mozart and the chord items | `pop_mb_results.json`, `moz_mb_results.json`, `chord_mb_results.json`, `pop_mb_results_tempo120.json` (first run, constant 120 bpm) |
| `mb_inspect.py`, `mb_control.py`, `mb_tokens_diag.py` | checkpoint against the repo's 4-field model; control on the paper's own tokens; token comparison | `mb_inspect.json`, `mb_control.json`, `mb_tokens_diag.json` |
| `sim_lib.py` | Simonetta CNN driver (written; it did not run past the convolution) | - |
| `mel_eval.py`, `mel_tables.py` | all melody-location metrics | `mel_metrics.json`, `frag_mel_*.md`, `frag_agree.md` |
| `mel_named.py` | the validation row's named items per bar | `mel_named.json`, `mel_named_scores.json` |
| `chord_parse.py` | `<harmony>` and text parse: current, music21, Tonal | `chord_parse_items.json`, `chord_parse_text.json`, `chord_parse_summary.json` |
| `chord_role.py`, `chord_report.py` | step 3 role: current, fix, skyline, MidiBERT; tables | `chord_role_items.json`, `chord_role_generated.json`, `chord_metrics.json`, `frag_chord*.md` |
| `build_melody.py` | assembles this page from `melody_template.md` and the fragments | `melody.md` |

To reproduce: main checkout's `.venv` (music21 10.5.0, partitura 1.9.0, mido), `-X utf8`, from the worktree root, in this order: `pop_build.py`, `moz_build.py`, `pop_run_cur.py`, `moz_run_cur.py`, `chord_role.py`, `chord_parse.py`, `mel_named.py export`, then in `build/venv-midibert` `mb_run.py chord`, `moz`, `pop`, then `mel_eval.py`, `mel_tables.py`, `mel_named.py`, `chord_report.py`, `build_melody.py`. Data in `build/` (ignored): `pop909/repo` (POP909, commit d83e6edb), `simonetta/repo` and `simonetta/data`, `midibert/repo` (branch CP), `midibert/repo_v2` (branch v2), `midibert/ckpt/melody_model_best.ckpt`, `when-in-rome/repo` (sparse), `tonal/` (tonal 6.2.0 with the local `dist/index.js` copies), `venv-midibert`, `venv-simonetta`.

## 11. Recommendation

texture.melody-location: code + agent — code reports each staff's notes and settles a bar only where the current rules fire and the plain skyline names the same hand (706 Mozart bars, 705 right, 40 of 40 left-hand acceptances right; 114 POP909 bars, 114 right), with MidiBERT's and the skyline's hands attached as candidates and UNKNOWN wherever voices are imitated, exchanged or equally weighted, and the agent decides the melody line in the other 98% (POP909) and 85% (Mozart) of the bars, because no tool tested decides alone (current rules answer 2.3% / 22.5% of bars; the skyline names 692 Mozart right-hand bars left; MidiBERT with this input reaches F1 59.4 against the skyline's 84.9 on Mozart and was not reproduced on a learner's score).
notation.chord-symbols: code + agent — code keeps the printed symbols as exact facts (music21 `<harmony>` and the current reading agree on 459 of 460 items; duplicates removed, never read as a second chord change; text spellings parsed with Tonal are candidates only: it reads 202 of 239 spellings correctly and also reads note letters as chords) and states the role under a symbol only where the generated family states it (the montuno family fix: 4 of 4 and 60 of 60 symbols), while for every other item the role is a proposal (current rule 0 of 12 on the shuffle, MidiBERT 7 of 12; 8 of 8 on slash-bass) that the agent decides.
