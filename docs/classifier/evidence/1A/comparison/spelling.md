# integrity.notation-sanity: the current spelling checks against PKSpell, ps13 and the rhythm-consistency checker, 2026-10-08

**What this is.** One of the bounded comparisons of handoff step 3, run on one characteristic (`integrity.notation-sanity`, area 1A, rule 26, status *failing*: its test 2b flags correct spellings). Nothing is rewritten. The page measures the chunk-1 validators' implementation of rule 26 against the tools named in `docs/classifier/tools-survey.md` section 7, on published scores, on the known errors the validation row names, on injected misspellings and on our own catalogue, and ends in one recommendation line. Base commit c47f18c7. Every figure was produced by a script in this folder (named under each table); nothing is copied from the validation pages, though where a figure reproduces one the validation pass gave, the text says so (`sp_check_repro.py`).

**Labels.** *measured*: a script in this folder produced it on the data named. *reading*: a judgement of mine from the text of a score or a page, not a script. Nothing here has been heard, and no printed edition was seen.

**How the output should be read (the outside review relayed on 2026-10-08, applied).** (1) The spelling a file states is exact; a judgement that it is wrong is inferred. Every flag in this page is the second kind: "the written spelling differs from the spelling a method estimates", and a method that scores well here answers that question, which is not the question "is the printed note an error" (a pitch-spelling estimator predicts the likely spelling). (2) Two methods agreeing is confidence, not proof: section 4.4 shows both estimators agreeing on a wrong answer. (3) Exact structural anomalies (a missing accidental, an unclosed bracket, durations that do not add up) are a different kind from spelling and beaming candidates and stay separate. (4) Nothing here rewrites a score: a flag carries the written spelling and the competing spelling, and the agent decides.

## 1. What was compared

**Current detector** (the chunk-1 validator `validation/r_sanity.py`, executed from its source with two stated changes: its example truncations `cands[:6]` and `hits[:5]` removed so that every flag is returned, and its paths re-pointed; `cmp_common.py`). Two of its five kinds are spelling:
- *kind 2* (rule 26, first test): a note whose written (step, alter) differs from partitura `estimate_spelling` (ps13), where ps13's spelling is diatonic to the key signature in force and the written one is not. Called "the gate" below: the estimate must be a note of the signature.
- *test 2b* (rule 26, second test, "added by the check, not yet run" on the rule page): consecutive struck notes of one voice whose written interval is augmented or diminished and where respelling one note enharmonically makes the interval perfect, major or minor.
- Not spelling and not compared here (they are exact structure): kind 1 (a required accidental the file omits), kind 3 (beaming), kind 4 (unclosed tuplet bracket), kind 5 (beyond the ledger limit). Kind 1 and kind 4 are touched in sections 4.4 and 4.6 only to say what the spelling tools do with them.

**Candidates.**
- *PKSpell* (Foscarin, Audebert, Fournier-S'niehotta, ISMIR 2021): per-note tonal pitch class and key signature from pitch classes and durations. Used as the survey says: a note whose written spelling differs from the prediction is a candidate. Run raw, with the same diatonic gate as kind 2, and in agreement with ps13.
- *ps13* (partitura `estimate_spelling`): the same comparison with the classic algorithm. Raw, and as inside kind 2.
- *Géré, Audebert, Jacquemard, "Detecting notational errors in digital music scores"* (TENOR 2025): its code exists (section 3) and checks rhythm and time consistency, not pitch spelling. Run on the same scores.

**Methods as columns of the tables.** `kind 2`; `test 2b`; `current` = kind 2 + test 2b; `fix v1` / `fix v2` = test 2b cleared by the fix below; `ps13 raw`; `PKSpell raw`; `PKSpell gate`; `agree` = ps13 and PKSpell give the same spelling and it differs from the written one; `agree gate` = the same with the gate; combined rows add the flags of two methods (a flag is a note for the note-level methods and a pair of notes for test 2b; the two are added, not de-duplicated).

**The fix to test 2b** (defined by me from the validation row's three false-flag families, so those three are not evidence for it; the published-score rates are). A 2b hit is cleared when (a) the interval is an augmented unison (the same letter with and without an accidental: the ordinary chromatic step of a chromatic run), or (b) both written notes belong to the key signature in force read as major or as its relative minor in any of its three forms (on the line of fifths with f the signature, sharps positive: the major scale is f-1 to f+5, the raised sixth f+6, the raised seventh f+8). **Fix v2** adds (c): a diminished unison (the descending chromatic step). v2 was added after the chromatic D scale's remaining flags showed the descending steps arrive as diminished unisons, and after the v1 rates on the published scores had been read; both are reported (`sp_lib.py`).

## 2. Ground truth and data

**False-flag rate: published scores whose spelling is taken as correct** (rules fixed before any method was scored, `sp_select.py`):
- *wir*: every piece directory under `Corpus/Keyboard_Other` and `Corpus/Piano_Sonatas` of the When in Rome checkout the key pilot used (read in place at the other worktree's `build/when-in-rome`, commit 1c61fe41) that holds a local `score.mxl`: **81 pieces** (Bach WTC I 24, Chopin 3, Mozart sonata movements 54; the Debussy, Dvorak, Grieg, Liszt, Medtner, Schumann, Tchaikovsky and Beethoven directories hold only `remote.json`, a pointer to a score not in the repository). Textbook examples are out (1 to 8 bars, some written to show a spelling).
- *m21ch*: the music21 corpus's Bach chorales, by file name: `bwvN.M.mxl` (cantata chorales) and `bwvNNN.mxl` for NNN 250 to 438: **380 pieces**; variants with a suffix, `.krn`/`.xml` duplicates and arias are out.
- *m21kb*: the music21 corpus's keyboard-only tonal works, chosen by listing the small composer folders: Bach bwv846, Chopin mazurka06-2 (`.krn`, converted by music21), C. P. E. Bach h186, Joplin Maple Leaf Rag, Mozart K. 545 exposition, Clara Schumann polonaises op. 1 nos. 1 to 4: **9 pieces**. Schoenberg op. 19 is out (spelling is a free choice there).
- Together **470 pieces, 225,674 notes** (the project's note array: partitura, tied notes merged). "Taken as correct" is a rule, not a finding: some of the flags below may be deliberate respellings or encoding errors in the source, and 39 kind-2 flags are listed in 4.1 so a reader can judge them.

**Known errors (catch).**
- Kind 1: the 13 notes in 8 generated items (`accidental_model` of the validators, re-run: 8 items, 13 notes).
- Kind 2: the Minecraft Nether (`song.classical.c418-minecraft-nether.pdmx`, 30 candidates of 65 ps13 differences) and Bach Invention 9 (4 candidates, bars 5, 9, 12, 25). The validation row calls these *candidates* ("whether any PDMX candidate is wrong is the agent's"), not confirmed errors; section 4.4 gives my reading of each, labelled reading.
- **Added, with a rule-given answer:** the generated seventh-arpeggio family (60 items, keyless, `exercise.arpeggio7.*`): each chord is root, third, fifth, seventh of the named chord, so a note whose letter is not one of the chord's four letters is a misspelling by construction (`sp_arp7.py`). The `area-1B.md` page confirmed 4 such items by reading; the script finds 9.
- **Added, injected:** 2,148 misspellings put into the 470 published scores by a fixed rule (`sp_inject.py`): 3% of the eligible notes (at least 3 a piece), eligible = pitched, not grace, no tie, (bar, pitch) unique in the piece and having a second spelling with at most one accidental; seed `20261008`; the note is respelt to that other spelling (sounding pitch unchanged) and written to `build/sp_inject/`; every method then runs on the injected file exactly as on the clean one. These are *injected*, not natural errors, and they favour an estimator trained on published spellings.

**Our catalogue** (no independent spelling truth; flags are candidates): 2,020 items with a file, in `generated` (1,211, id starts `exercise.`), `pdmx` (524) and `other` (285).

## 3. Tools: what ran, what did not

**PKSpell: ran.** Repository `github.com/fosfrancesco/pkspell` (MIT), shallow clone at commit `477e6687a7114f1991492e73f5c66edcb6241899` in `build/pkspell/` (`pks_commit.txt`); the released weights `models/pkspell_statedict.pt` of the repository. Own venv `build/venv-pkspell`, reached as `C:/vpks` through a directory junction (`mklink /J`, the worktree path is long; no system setting changed): torch 2.14.1+cpu and torchvision 0.29.1+cpu from the CPU index (install about 2 minutes), kmeans1d 0.5.0 (the repository pins `~=0.3.1`), scikit-learn, click, rich, tqdm. Not installed, because inference does not import them: the pinned `music21~=6.7.1` and `pandas~=1.3.0` (its README's process_score path, which rewrites a score, was not used). **No error; one attempt; no change to its code.** `pks_run.py` imports its `PKSpell` model and `single_piece_predict` and feeds it, per piece, the pitch classes (MIDI mod 12) and quarter-length durations of the project's note array in onset order, as its README states; nothing about the written spelling is given to it. Output per note: a tonal pitch class and a key signature; only the spelling is used (the gate uses the file's signature). It ran on the CPU with 2 threads. Two first-run calls took 71 s and 18 s (machine busy); they were re-run and the table is from the clean run.

**ps13: ran** (partitura 1.9.0 `estimate_spelling`, the installed library).

**Géré et al.: code found and run.** The survey says "code not confirmed (not linked on the abstract page)". The arXiv abstract page does not link it (and the PDF text could not be read here); the arXiv HTML version of the paper (footnote 6) gives `github.com/leleogere/detecting-notational-errors-in-digital-music-scores` (MIT); shallow clone in `build/gere/`. Own venv `build/venv-gere` (junction `C:/vgere`): its pins install (partitura 1.7.0, click, joblib, lxml, tqdm); **one missing dependency**, `typing_extensions`, which partitura 1.7.0 imports but does not declare, was installed by hand; then it ran. Command: `detect_errors check --mode both`, one process. **It crashed once:** the run over the 2,020 catalogue files stopped at about 75% of the contextual pass without writing its output, on an uncaught `IndexError` inside partitura 1.7.0 (`unfold_paths`, repeat unfolding; traceback in `build/gere_cat.log`, not committed). The figures below therefore come from `gere_run.py`, which calls the repository's own `check_path` functions with the command line's arguments and in its order (individual for all files, contextual for those without an individual error) with one try/except per file; the published-score run was repeated with it (the command-line run of the published scores had completed and gave the same file counts). It reads MusicXML; its individual check compares each note's written type and dots with its `<duration>` and the file's `<divisions>` (and backup/forward lengths); its contextual check is an automaton over each measure's voices and runs on single-part files only (a file with more than one part returns "More than 1 part"). **It does not look at pitch spelling or at accidentals, and its paper reports no precision or recall** (counts and percentages of flagged scores only: as read through the arXiv HTML version, not the PDF), so what is measured here is how many of our published scores it flags and whether it flags the unclosed-bracket files.

**Not run.** Bouquillard and Jacquemard (arXiv 2606.20198, "also seen, not read" in the survey): not a candidate row of section 7 and no code was named; not tried. Beaming (kind 3) and the ledger-line kind: not spelling, not touched.

**Reader limits found on the way.** The project's reader (`tools/classifier/score.py`, `load`) raises on its pickup test (line 109, the fault already listed on `rules/area-1B.md`) on 4 of the 81 When in Rome pieces, all 380 chorales (several parts of different bar counts), 1 keyboard work and 1 catalogue item; and on 3 PDMX items partitura itself raises (`bach-invention-no-1`, `puccini-o-mio-babbino-caro`, `sakamoto-shining-boy`), which have no result for any note-based method. The same reader without its pickup test was used for the fallback (`cmp_common.load_notes`); the pickup test does not matter to spelling.

## 4. Results

### 4.1 False flags on published scores (`sp_run.py`, `sp_metrics.py`; per-piece data in `sp_results_<set>.json`)

Flags per 1,000 notes and the share of pieces with any flag. Read the `current` rows as the validation row's failing rule measured on correct scores.

**All published scores: 470 pieces, 225,674 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 39 | 0.17 | 14 of 470 (3.0%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 3,059 | 13.55 | 361 of 470 (76.8%) |
| current detector: kind 2 + test 2b | 3,098 | 13.73 | 361 of 470 (76.8%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 1,265 | 5.61 | 202 of 470 (43.0%) |
| ps13 (partitura): every difference from the written spelling | 3,104 | 13.75 | 177 of 470 (37.7%) |
| PKSpell: every difference from the written spelling | 2,012 | 8.92 | 97 of 470 (20.6%) |
| PKSpell with the kind-2 diatonic gate | 108 | 0.48 | 16 of 470 (3.4%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 343 | 1.52 | 70 of 470 (14.9%) |
| the same, with the diatonic gate | 36 | 0.16 | 14 of 470 (3.0%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 952 | 4.22 | 143 of 470 (30.4%) |
| PKSpell with the gate + test 2b with fix v1 | 1,334 | 5.91 | 202 of 470 (43.0%) |
| PKSpell with the gate + test 2b with fix v2 | 1,021 | 4.52 | 143 of 470 (30.4%) |


**When in Rome keyboard (81 pieces): 81 pieces, 123,825 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 31 | 0.25 | 12 of 81 (14.8%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 2,242 | 18.11 | 80 of 81 (98.8%) |
| current detector: kind 2 + test 2b | 2,273 | 18.36 | 80 of 81 (98.8%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 1,046 | 8.45 | 79 of 81 (97.5%) |
| ps13 (partitura): every difference from the written spelling | 2,258 | 18.24 | 69 of 81 (85.2%) |
| PKSpell: every difference from the written spelling | 1,823 | 14.72 | 64 of 81 (79.0%) |
| PKSpell with the kind-2 diatonic gate | 103 | 0.83 | 14 of 81 (17.3%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 290 | 2.34 | 54 of 81 (66.7%) |
| the same, with the diatonic gate | 31 | 0.25 | 12 of 81 (14.8%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 833 | 6.73 | 77 of 81 (95.1%) |
| PKSpell with the gate + test 2b with fix v1 | 1,118 | 9.03 | 79 of 81 (97.5%) |
| PKSpell with the gate + test 2b with fix v2 | 905 | 7.31 | 77 of 81 (95.1%) |


**music21 corpus, Bach chorales: 380 pieces, 94,959 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 0 | 0.0 | 0 of 380 (0.0%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 685 | 7.21 | 273 of 380 (71.8%) |
| current detector: kind 2 + test 2b | 685 | 7.21 | 273 of 380 (71.8%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 161 | 1.7 | 115 of 380 (30.3%) |
| ps13 (partitura): every difference from the written spelling | 776 | 8.17 | 102 of 380 (26.8%) |
| PKSpell: every difference from the written spelling | 30 | 0.32 | 25 of 380 (6.6%) |
| PKSpell with the kind-2 diatonic gate | 0 | 0.0 | 0 of 380 (0.0%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 12 | 0.13 | 10 of 380 (2.6%) |
| the same, with the diatonic gate | 0 | 0.0 | 0 of 380 (0.0%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 76 | 0.8 | 58 of 380 (15.3%) |
| PKSpell with the gate + test 2b with fix v1 | 161 | 1.7 | 115 of 380 (30.3%) |
| PKSpell with the gate + test 2b with fix v2 | 76 | 0.8 | 58 of 380 (15.3%) |


**music21 corpus, keyboard works (9): 9 pieces, 6,890 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 8 | 1.16 | 2 of 9 (22.2%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 132 | 19.16 | 8 of 9 (88.9%) |
| current detector: kind 2 + test 2b | 140 | 20.32 | 8 of 9 (88.9%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 58 | 8.42 | 8 of 9 (88.9%) |
| ps13 (partitura): every difference from the written spelling | 70 | 10.16 | 6 of 9 (66.7%) |
| PKSpell: every difference from the written spelling | 159 | 23.08 | 8 of 9 (88.9%) |
| PKSpell with the kind-2 diatonic gate | 5 | 0.73 | 2 of 9 (22.2%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 41 | 5.95 | 6 of 9 (66.7%) |
| the same, with the diatonic gate | 5 | 0.73 | 2 of 9 (22.2%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 43 | 6.24 | 8 of 9 (88.9%) |
| PKSpell with the gate + test 2b with fix v1 | 55 | 7.98 | 8 of 9 (88.9%) |
| PKSpell with the gate + test 2b with fix v2 | 40 | 5.81 | 8 of 9 (88.9%) |


The nine keyboard works one by one:

| piece | notes | kind 2 | test 2b | 2b after fix | ps13 diffs | PKSpell diffs | PKSpell + gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| corpus/bach/bwv846.mxl | 533 | 0 | 6 | 4 | 0 | 2 | 0 |
| corpus/chopin/mazurka06-2.krn | 787 | 0 | 6 | 1 | 0 | 94 | 0 |
| corpus/cpebach/h186.mxl | 809 | 0 | 30 | 12 | 5 | 2 | 0 |
| corpus/joplin/maple_leaf_rag.mxl | 1489 | 0 | 14 | 6 | 26 | 25 | 0 |
| corpus/mozart/k545/movement1_exposition.mxl | 191 | 0 | 0 | 0 | 0 | 0 | 0 |
| corpus/schumann_clara/polonaise_op1n1.mxl | 852 | 0 | 21 | 6 | 13 | 6 | 0 |
| corpus/schumann_clara/polonaise_op1n2.mxl | 696 | 1 | 10 | 1 | 3 | 2 | 1 |
| corpus/schumann_clara/polonaise_op1n3.mxl | 950 | 7 | 30 | 16 | 13 | 14 | 4 |
| corpus/schumann_clara/polonaise_op1n4.mxl | 583 | 0 | 15 | 4 | 10 | 14 | 0 |


**PKSpell's training data.** PKSpell was trained on ASAP (its README). `sp_metrics.py` matches the When in Rome pieces to ASAP's metadata by work (`build/asap_meta/metadata.csv`, fetched from `github.com/fosfrancesco/asap-dataset`, a plain file download): 21 of the 81 pieces are works that ASAP contains (WTC I preludes, Etudes op. 10 nos. 1 and 12, Mozart K. 310/1, K. 331/3 and K. 332). The rows below are for the 21 and for the other 60; the chorales are not piano and not in ASAP. (Whether the released weights saw all of ASAP is not stated in its README: reading.)

**When in Rome, works that are in ASAP (PKSpell's training data): 21 pieces, 23,066 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 7 | 0.3 | 2 of 21 (9.5%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 356 | 15.43 | 20 of 21 (95.2%) |
| current detector: kind 2 + test 2b | 363 | 15.74 | 20 of 21 (95.2%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 211 | 9.15 | 20 of 21 (95.2%) |
| ps13 (partitura): every difference from the written spelling | 1,130 | 48.99 | 14 of 21 (66.7%) |
| PKSpell: every difference from the written spelling | 1,425 | 61.78 | 13 of 21 (61.9%) |
| PKSpell with the kind-2 diatonic gate | 77 | 3.34 | 3 of 21 (14.3%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 72 | 3.12 | 9 of 21 (42.9%) |
| the same, with the diatonic gate | 7 | 0.3 | 2 of 21 (9.5%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 175 | 7.59 | 18 of 21 (85.7%) |
| PKSpell with the gate + test 2b with fix v1 | 281 | 12.18 | 20 of 21 (95.2%) |
| PKSpell with the gate + test 2b with fix v2 | 245 | 10.62 | 18 of 21 (85.7%) |


**When in Rome, works not in ASAP: 60 pieces, 100,759 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 24 | 0.24 | 10 of 60 (16.7%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 1,886 | 18.72 | 60 of 60 (100.0%) |
| current detector: kind 2 + test 2b | 1,910 | 18.96 | 60 of 60 (100.0%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 835 | 8.29 | 59 of 60 (98.3%) |
| ps13 (partitura): every difference from the written spelling | 1,128 | 11.2 | 55 of 60 (91.7%) |
| PKSpell: every difference from the written spelling | 398 | 3.95 | 51 of 60 (85.0%) |
| PKSpell with the kind-2 diatonic gate | 26 | 0.26 | 11 of 60 (18.3%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 218 | 2.16 | 45 of 60 (75.0%) |
| the same, with the diatonic gate | 24 | 0.24 | 10 of 60 (16.7%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 658 | 6.53 | 59 of 60 (98.3%) |
| PKSpell with the gate + test 2b with fix v1 | 837 | 8.31 | 59 of 60 (98.3%) |
| PKSpell with the gate + test 2b with fix v2 | 660 | 6.55 | 59 of 60 (98.3%) |


**Whole-piece enharmonic mismatches.** Where a piece is written in an enharmonic key of the one an estimator prefers, the raw difference rate is a property of the key, not of the notes. PKSpell differs on 799 of 810 notes of WTC I no. 3 (written C-sharp major, PKSpell spells D-flat major) and 397 of 404 of no. 13 (F-sharp major / G-flat); ps13 differs on all 663 notes of no. 17 and on four chorales (`sp_metrics.json`, "whole_piece"). The diatonic gate removes all of these, because the estimate is not a note of the file's signature; this is why the gated rows are near zero and the raw rows are not, and why "PKSpell raw" on the 21 ASAP works (61.78 per 1,000) is two pieces.

**The 39 kind-2 flags on the published scores, listed** (`sp_pubflags.py`). By reading, 30 are a sharp leading tone or raised degree (D-sharp, A-sharp, E-sharp) in a passage that tonicises the next degree, 6 are double sharps (C-double-sharp and F-double-sharp as leading tones in diminished-seventh chords, the Revolutionary Etude among them), 3 other; the standard spelling in all of these is the written one, so by reading they are false flags, and ps13 and PKSpell agree with each other on 36 of 39 (the gate keeps the estimate, not the context).

| piece | notes | kind-2 flags | written (what ps13 and PKSpell say instead) | bars (1-based) |
| --- | --- | --- | --- | --- |
| Keyboard_Other/Chopin,_Frédéric/Études_Op.10/12 | 2081 | 6 | 2 x C## (ps13 D, PKSpell D); 3 x D# (ps13 E-, PKSpell E-); 1 x F## (ps13 G, PKSpell G) | bars 17, 29, 30, 57, 74 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K280/1 | 1778 | 2 | 2 x A# (ps13 B-, PKSpell B-) | bars 38, 59 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K280/2 | 811 | 1 | 1 x C# (ps13 D-, PKSpell D-) | bars 31 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K309/1 | 2374 | 2 | 2 x E# (ps13 F, PKSpell F) | bars 25, 120 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K309/3 | 3636 | 1 | 1 x E# (ps13 F, PKSpell F) | bars 232 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K332/1 | 2462 | 1 | 1 x A# (ps13 B-, PKSpell B-) | bars 70 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K457/3 | 2175 | 5 | 4 x D# (ps13 E-, PKSpell E-); 1 x E# (ps13 F, PKSpell F) | bars 200, 208, 210 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K533/1 | 3090 | 2 | 2 x A# (ps13 B-, PKSpell B-) | bars 63, 75 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K533/2 | 1606 | 7 | 2 x A# (ps13 B-, PKSpell B-); 3 x D# (ps13 E-, PKSpell E-); 2 x E# (ps13 F, PKSpell F) | bars 25, 26, 27, 64, 67, 68, 95 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K570/1 | 2001 | 1 | 1 x B-- (ps13 A, PKSpell A) | bars 83 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K570/2 | 1231 | 2 | 2 x D# (ps13 E-, PKSpell E-) | bars 25 |
| Piano_Sonatas/Mozart,_Wolfgang_Amadeus/K576/3 | 2392 | 1 | 1 x D- (ps13 C#, PKSpell C#) | bars 89 |
| corpus/schumann_clara/polonaise_op1n2.mxl | 696 | 1 | 1 x F## (ps13 G, PKSpell G) | bars 6 |
| corpus/schumann_clara/polonaise_op1n3.mxl | 950 | 7 | 3 x A# (ps13 B-, PKSpell A#); 1 x A# (ps13 B-, PKSpell B-); 1 x E# (ps13 F, PKSpell F); 2 x F## (ps13 G, PKSpell G) | bars 30, 38, 40, 47 |

By written spelling: D# (estimated E-) 12; A# (estimated B-) 11; E# (estimated F) 7; F## (estimated G) 4; C## (estimated D) 2; C# (estimated D-) 1; B-- (estimated A) 1; D- (estimated C#) 1.


### 4.2 The validation row's named false flags, flag by flag (`sp_named.py`, `sp_named_table.py`)

**Test 2b's false flags named in the validation row (each pair is a correct spelling).** Columns: test 2b as it stands; fix v1; fix v2; kind 2 (PS13 + gate); ps13 raw; PKSpell raw; PKSpell + gate.

| item | pair (bar, as written) | interval | test 2b | fix v1 | fix v2 | kind 2 | ps13 raw | PKSpell raw | PKSpell + gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A harmonic minor scale | 1: F5 - G#5 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | - | - |
| A harmonic minor scale | 2: G#5 - F5 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | - | - |
| A harmonic minor scale | 1: F3 - G#3 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | - | - |
| A harmonic minor scale | 2: G#3 - F3 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | - | - |
| G-sharp harmonic minor scale | 1: E5 - F##5 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | flagged | - |
| G-sharp harmonic minor scale | 2: F##5 - E5 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | flagged | - |
| G-sharp harmonic minor scale | 1: E4 - F##4 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | flagged | - |
| G-sharp harmonic minor scale | 2: F##4 - E4 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | flagged | - |
| chromatic D scale, right hand | 1: E-4 - E4 | Augmented Unison | flagged | cleared (aug-unison) | cleared (aug-unison) | - | - | flagged | - |
| chromatic D scale, right hand | 1: F4 - F#4 | Augmented Unison | flagged | cleared (aug-unison) | cleared (aug-unison) | - | - | - | - |
| chromatic D scale, right hand | 1: G4 - G#4 | Augmented Unison | flagged | cleared (aug-unison) | cleared (aug-unison) | - | - | - | - |
| chromatic D scale, right hand | 2: B-4 - B4 | Augmented Unison | flagged | cleared (aug-unison) | cleared (aug-unison) | - | - | - | - |
| chromatic D scale, right hand | 2: C5 - C#5 | Augmented Unison | flagged | cleared (aug-unison) | cleared (aug-unison) | - | - | - | - |
| chromatic D scale, right hand | 2: C#5 - C5 | Diminished Unison | flagged | flagged | cleared (dim-unison) | - | - | - | - |
| chromatic D scale, right hand | 2: B4 - B-4 | Diminished Unison | flagged | flagged | cleared (dim-unison) | - | - | - | - |
| chromatic D scale, right hand | 3: G#4 - G4 | Diminished Unison | flagged | cleared (key-scale) | cleared (key-scale) | - | - | flagged | - |
| chromatic D scale, right hand | 3: F#4 - F4 | Diminished Unison | flagged | cleared (key-scale) | cleared (key-scale) | - | - | - | - |
| chromatic D scale, right hand | 3: E4 - E-4 | Diminished Unison | flagged | flagged | cleared (dim-unison) | - | - | - | - |
| Bach Invention 9 (F minor) | 3: E5 - D-5 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | - | - |
| Bach Invention 9 (F minor) | 31: E5 - D-5 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | - | - |
| Bach Invention 9 (F minor) | 7: E4 - D-4 | Augmented Second | flagged | cleared (key-scale) | cleared (key-scale) | - | - | - | - |

Counts of flags kept (of the pairs listed per item): A harmonic minor scale: 4 pairs, fix v1 keeps 0, fix v2 keeps 0, kind 2 flags 0, ps13 raw 0, PKSpell raw 0, PKSpell + gate 0; G-sharp harmonic minor scale: 4 pairs, fix v1 keeps 0, fix v2 keeps 0, kind 2 flags 0, ps13 raw 0, PKSpell raw 4, PKSpell + gate 0; chromatic D scale, right hand: 10 pairs, fix v1 keeps 3, fix v2 keeps 0, kind 2 flags 0, ps13 raw 0, PKSpell raw 2, PKSpell + gate 0.

**Bach Invention 9, all 13 test-2b pairs:** fix v1 keeps 9, fix v2 keeps 9; kind 2 flags 4 notes (bars 5, 9, 12, 25), ps13 and PKSpell give the same spelling for all 4.

**Kind-2 candidates, per item (what the two estimators say).**

| item | candidates | ps13 says | PKSpell says | file's signature |
| --- | --- | --- | --- | --- |
| minecraft | 30 x G# | A- | A- | [-3] |
| inv9 | 2 x G# | A- | A- | [-4] |
| inv9 | 1 x D# | E- | E- | [-4] |
| inv9 | 1 x A# | B- | B- | [-4] |
| arp_ab_min7 | 8 x C- | B | B | [0] |
| arp_ab_halfdim | 8 x C- | B | B | [0] |


**What test 2b flags on the 470 published scores, by interval, and what each fix keeps** (`sp_t2b_residual.py`). More than a third of its hits are augmented unisons, the ordinary chromatic step. What the fix leaves is dominated by diminished thirds, fourths and sevenths and augmented seconds, which in tonal music are the intervals of a diminished-seventh chord, of a harmonic-minor scale outside the signature and of chromatic voice-leading; the spelling of a respelt note is as likely right as wrong there (reading).

| interval (as music21 names it) | test 2b hits | kept by fix v1 | kept by fix v2 |
| --- | --- | --- | --- |
| aug Unison | 1,141 | 0 | 0 |
| dim Unison | 533 | 313 | 0 |
| dim Fourth | 403 | 206 | 206 |
| aug Second | 295 | 197 | 197 |
| dim Third | 232 | 232 | 232 |
| dim Seventh | 201 | 137 | 137 |
| aug Fifth | 97 | 48 | 48 |
| dim Octave | 61 | 29 | 29 |
| aug Octave | 22 | 10 | 10 |
| dim Eleventh | 19 | 9 | 9 |
| aug Sixth | 17 | 17 | 17 |
| dim Sixth | 8 | 8 | 8 |
| other intervals | 30 | 20 | 20 |
| **all** | 3,059 | 1,226 | 913 |

Cleared by: aug-unison 1,141, not cleared 913, key-scale 692, dim-unison 313.


### 4.3 Known errors and injected misspellings

**Kind 1, the 13 notes in 8 generated items** (6 blues-scale items, 2 tritone-substitution items; the file's pitch is right, the accidental sign is missing: the blues B-flat scale's E-flat). These are exact structural errors in the markup, not spellings. The spelling methods do not catch them: of the 13 notes, kind 2 flags 0, ps13 raw 0, PKSpell raw 1 (it prefers another spelling of a note the file writes correctly), agree 0. Test 2b has a flagged pair around all 13, but the pairs are chromatic steps (the blues scale's E-natural to E-flat, a diminished unison, is one), which the sign's absence does not make wrong, so its flag is for another reason (`sp_named.json`, "kind1_missing_accidentals"). The accidental model stays code.

**Injected misspellings: 2,148 notes in 470 correct scores** (`sp_inject.py`, `sp_inject_metrics.py`). Caught = the method flags the injected note (or, for test 2b, a new pair containing it).

**When in Rome keyboard: 926 injected misspellings.**

| method | caught | missed |
| --- | --- | --- |
| current: spelling filter (PS13 + gate) | 741 (80.0%) | 185 |
| current: test 2b | 703 (75.9%) | 223 |
| test 2b with fix v1 | 645 (69.7%) | 281 |
| test 2b with fix v2 | 568 (61.3%) | 358 |
| current detector (kind 2 or test 2b) | 887 (95.8%) | 39 |
| current detector with fix v1 (kind 2 or fixed 2b) | 854 (92.2%) | 72 |
| current detector with fix v2 (kind 2 or fixed 2b) | 817 (88.2%) | 109 |
| ps13, every difference | 895 (96.7%) | 31 |
| PKSpell, every difference | 894 (96.5%) | 32 |
| PKSpell with the gate | 736 (79.5%) | 190 |
| ps13 and PKSpell agree, differs from written | 872 (94.2%) | 54 |
| the same, with the gate | 727 (78.5%) | 199 |
| PKSpell with the gate or 2b with fix v1 | 853 (92.1%) | 73 |
| PKSpell with the gate or 2b with fix v2 | 817 (88.2%) | 109 |

**Bach chorales: 1174 injected misspellings.**

| method | caught | missed |
| --- | --- | --- |
| current: spelling filter (PS13 + gate) | 943 (80.3%) | 231 |
| current: test 2b | 1059 (90.2%) | 115 |
| test 2b with fix v1 | 1017 (86.6%) | 157 |
| test 2b with fix v2 | 864 (73.6%) | 310 |
| current detector (kind 2 or test 2b) | 1164 (99.1%) | 10 |
| current detector with fix v1 (kind 2 or fixed 2b) | 1141 (97.2%) | 33 |
| current detector with fix v2 (kind 2 or fixed 2b) | 1065 (90.7%) | 109 |
| ps13, every difference | 1163 (99.1%) | 11 |
| PKSpell, every difference | 1173 (99.9%) | 1 |
| PKSpell with the gate | 952 (81.1%) | 222 |
| ps13 and PKSpell agree, differs from written | 1163 (99.1%) | 11 |
| the same, with the gate | 943 (80.3%) | 231 |
| PKSpell with the gate or 2b with fix v1 | 1145 (97.5%) | 29 |
| PKSpell with the gate or 2b with fix v2 | 1069 (91.1%) | 105 |

**music21 keyboard works: 48 injected misspellings.**

| method | caught | missed |
| --- | --- | --- |
| current: spelling filter (PS13 + gate) | 37 (77.1%) | 11 |
| current: test 2b | 29 (60.4%) | 19 |
| test 2b with fix v1 | 27 (56.2%) | 21 |
| test 2b with fix v2 | 24 (50.0%) | 24 |
| current detector (kind 2 or test 2b) | 46 (95.8%) | 2 |
| current detector with fix v1 (kind 2 or fixed 2b) | 44 (91.7%) | 4 |
| current detector with fix v2 (kind 2 or fixed 2b) | 41 (85.4%) | 7 |
| ps13, every difference | 47 (97.9%) | 1 |
| PKSpell, every difference | 46 (95.8%) | 2 |
| PKSpell with the gate | 37 (77.1%) | 11 |
| ps13 and PKSpell agree, differs from written | 46 (95.8%) | 2 |
| the same, with the gate | 37 (77.1%) | 11 |
| PKSpell with the gate or 2b with fix v1 | 44 (91.7%) | 4 |
| PKSpell with the gate or 2b with fix v2 | 41 (85.4%) | 7 |

**All injected: 2148 injected misspellings.**

| method | caught | missed |
| --- | --- | --- |
| current: spelling filter (PS13 + gate) | 1721 (80.1%) | 427 |
| current: test 2b | 1791 (83.4%) | 357 |
| test 2b with fix v1 | 1689 (78.6%) | 459 |
| test 2b with fix v2 | 1456 (67.8%) | 692 |
| current detector (kind 2 or test 2b) | 2097 (97.6%) | 51 |
| current detector with fix v1 (kind 2 or fixed 2b) | 2039 (94.9%) | 109 |
| current detector with fix v2 (kind 2 or fixed 2b) | 1923 (89.5%) | 225 |
| ps13, every difference | 2105 (98.0%) | 43 |
| PKSpell, every difference | 2113 (98.4%) | 35 |
| PKSpell with the gate | 1725 (80.3%) | 423 |
| ps13 and PKSpell agree, differs from written | 2081 (96.9%) | 67 |
| the same, with the gate | 1707 (79.5%) | 441 |
| PKSpell with the gate or 2b with fix v1 | 2042 (95.1%) | 106 |
| PKSpell with the gate or 2b with fix v2 | 1927 (89.7%) | 221 |

**All injected, the original spelling was in key: 1739 injected misspellings.**

| method | caught | missed |
| --- | --- | --- |
| current: spelling filter (PS13 + gate) | 1721 (99.0%) | 18 |
| current: test 2b | 1427 (82.1%) | 312 |
| test 2b with fix v1 | 1382 (79.5%) | 357 |
| test 2b with fix v2 | 1264 (72.7%) | 475 |
| current detector (kind 2 or test 2b) | 1733 (99.7%) | 6 |
| current detector with fix v1 (kind 2 or fixed 2b) | 1732 (99.6%) | 7 |
| current detector with fix v2 (kind 2 or fixed 2b) | 1731 (99.5%) | 8 |
| ps13, every difference | 1721 (99.0%) | 18 |
| PKSpell, every difference | 1725 (99.2%) | 14 |
| PKSpell with the gate | 1725 (99.2%) | 14 |
| ps13 and PKSpell agree, differs from written | 1707 (98.2%) | 32 |
| the same, with the gate | 1707 (98.2%) | 32 |
| PKSpell with the gate or 2b with fix v1 | 1735 (99.8%) | 4 |
| PKSpell with the gate or 2b with fix v2 | 1735 (99.8%) | 4 |

**All injected, the original spelling was chromatic (outside the key signature): 409 injected misspellings.**

| method | caught | missed |
| --- | --- | --- |
| current: spelling filter (PS13 + gate) | 0 (0.0%) | 409 |
| current: test 2b | 364 (89.0%) | 45 |
| test 2b with fix v1 | 307 (75.1%) | 102 |
| test 2b with fix v2 | 192 (46.9%) | 217 |
| current detector (kind 2 or test 2b) | 364 (89.0%) | 45 |
| current detector with fix v1 (kind 2 or fixed 2b) | 307 (75.1%) | 102 |
| current detector with fix v2 (kind 2 or fixed 2b) | 192 (46.9%) | 217 |
| ps13, every difference | 384 (93.9%) | 25 |
| PKSpell, every difference | 388 (94.9%) | 21 |
| PKSpell with the gate | 0 (0.0%) | 409 |
| ps13 and PKSpell agree, differs from written | 374 (91.4%) | 35 |
| the same, with the gate | 0 (0.0%) | 409 |
| PKSpell with the gate or 2b with fix v1 | 307 (75.1%) | 102 |
| PKSpell with the gate or 2b with fix v2 | 192 (46.9%) | 217 |


### 4.4 The kind-2 candidates and the generated chord family

**Minecraft Nether and Invention 9 (reading, mine; no edition seen).** The signature of the Minecraft file is three flats (B-flat, E-flat, A-flat); the file contains 55 B-flat and 56 E-flat, **no A-flat and no D-flat at all**, and 30 G-sharp and 35 C-sharp. The 30 kind-2 candidates are all G-sharp, where A-flat is a note of the signature: by reading, 30 of 30 misspellings. ps13 and PKSpell agree on all 65 differences (30 G-sharp to A-flat, 35 C-sharp to D-flat); the 35 C-sharps are not flagged by kind 2 (D-flat is not a note of the signature) and are, by reading, also misspellings (the figures are C, D-flat, F, A-flat). Invention 9 (four flats) writes A-flat 69 times; the 4 kind-2 candidates (G-sharp in bars 5 and 9, D-sharp in bar 12, A-sharp in bar 25) each sit in a figure whose neighbouring statements use A-flat, E-flat and B-flat: by reading, 4 of 4 misspellings. In both items the two estimators say the same thing, and here the agreement happens to be right. Of Invention 9's 13 test-2b pairs, fix v1 keeps 9: the 4 above and 5 that are the diminished-seventh outlines B-natural to A-flat, F-sharp to E-flat (vii-diminished-seventh of C and of G in F minor), which by reading are correct; the 4 cleared pairs are the E to D-flat and E to A-flat steps of F harmonic minor.

**Agreement is not proof (reading, with the figures measured).** `exercise.arpeggio7.a-flat-minor7.2oct.both` has no key signature and spells A-flat, C-flat, E-flat, G-flat, which is right (C-flat is the minor third). ps13 and PKSpell both respell the whole chord in sharps (34 differences, `sp_named.json`), and the kind-2 gate flags the 8 C-flats because B is "diatonic" to an empty signature: the exception for keyless chord items that rule 26 states is what removes them, and the estimators are no help there. On the whole seventh-arpeggio family:

**Seventh-arpeggio family: 60 items, 2,040 notes, 88 misspelled notes in 9 items (exercise.arpeggio7.a-flat-half-diminished7.2oct.both, exercise.arpeggio7.b-flat-diminished7.2oct.both, exercise.arpeggio7.c-diminished7.2oct.both, exercise.arpeggio7.d-flat-half-diminished7.2oct.both, exercise.arpeggio7.e-flat-diminished7.2oct.both, exercise.arpeggio7.e-flat-half-diminished7.2oct.both, exercise.arpeggio7.f-diminished7.2oct.both, exercise.arpeggio7.g-flat-half-diminished7.2oct.both, exercise.arpeggio7.g-flat-minor7.2oct.both).**

| method | flagged notes | on misspelled notes (caught of 88) | on correct notes (false flags) | items with an error where it flags a misspelled note | correct items it flags |
| --- | --- | --- | --- | --- | --- |
| current: spelling filter (PS13 + gate; no exception for keyless chord items) | 110 | 0 of 88 | 110 | 0 of 9 | 6 of 51 |
| ps13, every difference | 515 | 9 of 88 | 506 | 2 of 9 | 16 of 51 |
| PKSpell, every difference | 409 | 0 of 88 | 409 | 0 of 9 | 15 of 51 |
| PKSpell with the gate | 122 | 0 of 88 | 122 | 0 of 9 | 8 of 51 |
| ps13 and PKSpell agree | 313 | 0 of 88 | 313 | 0 of 9 | 11 of 51 |
| the same, with the gate | 110 | 0 of 88 | 110 | 0 of 9 | 6 of 51 |
| current: test 2b | 314 | 80 of 88 | 234 | 9 of 9 | 8 of 51 |
| test 2b with fix v1 | 299 | 80 of 88 | 219 | 9 of 9 | 7 of 51 |
| test 2b with fix v2 | 299 | 80 of 88 | 219 | 9 of 9 | 7 of 51 |


The 9 items whose letters differ from the interval-by-root spelling are the 4 half-diminished items `area-1B.md` already reported (A-flat, D-flat, E-flat and G-flat: D for E-double-flat and similar), 4 diminished-seventh items (B-flat: G for A-double-flat; C: A for B-double-flat; E-flat: A and C for B-double-flat and D-double-flat; F: D for E-double-flat) and G-flat minor seventh (A for B-double-flat). Some of these may be the generator's deliberate avoidance of double flats; as spellings of a chord by interval from its root they are misspelled, and the owner decides whether the generator should write the double flats. Kind 2, the gate, PKSpell (raw and gated) and the two in agreement catch none of the 88 notes; ps13 raw catches 9 of 88 among 506 false flags; test 2b catches 80 of 88 at note level, at 234 flags on correctly spelled notes of the family (not traced further). A rule that spells a chord by interval from its recipe root is exact for generated items and does not need any of these tools.

### 4.5 Our catalogue: candidate load (`sp_run.py`; these are candidates, not false flags)

**Our catalogue, generated items (candidates, not false flags: spelling not independently checked): 1211 pieces, 58,832 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 218 | 3.71 | 24 of 1211 (2.0%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 997 | 16.95 | 140 of 1211 (11.6%) |
| current detector: kind 2 + test 2b | 1,215 | 20.65 | 148 of 1211 (12.2%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 540 | 9.18 | 55 of 1211 (4.5%) |
| ps13 (partitura): every difference from the written spelling | 3,605 | 61.28 | 145 of 1211 (12.0%) |
| PKSpell: every difference from the written spelling | 1,591 | 27.04 | 137 of 1211 (11.3%) |
| PKSpell with the kind-2 diatonic gate | 230 | 3.91 | 26 of 1211 (2.1%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 1,091 | 18.54 | 92 of 1211 (7.6%) |
| the same, with the diatonic gate | 218 | 3.71 | 24 of 1211 (2.0%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 426 | 7.24 | 36 of 1211 (3.0%) |
| PKSpell with the gate + test 2b with fix v1 | 552 | 9.38 | 57 of 1211 (4.7%) |
| PKSpell with the gate + test 2b with fix v2 | 438 | 7.44 | 38 of 1211 (3.1%) |


**Our catalogue, PDMX items (candidates): 521 pieces, 278,443 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 324 | 1.16 | 32 of 521 (6.1%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 4,160 | 14.94 | 313 of 521 (60.1%) |
| current detector: kind 2 + test 2b | 4,484 | 16.1 | 314 of 521 (60.3%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 2,704 | 9.71 | 216 of 521 (41.5%) |
| ps13 (partitura): every difference from the written spelling | 23,476 | 84.31 | 248 of 521 (47.6%) |
| PKSpell: every difference from the written spelling | 9,252 | 33.23 | 183 of 521 (35.1%) |
| PKSpell with the kind-2 diatonic gate | 329 | 1.18 | 36 of 521 (6.9%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 6,206 | 22.29 | 150 of 521 (28.8%) |
| the same, with the diatonic gate | 285 | 1.02 | 30 of 521 (5.8%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 2,116 | 7.6 | 183 of 521 (35.1%) |
| PKSpell with the gate + test 2b with fix v1 | 2,709 | 9.73 | 216 of 521 (41.5%) |
| PKSpell with the gate + test 2b with fix v2 | 2,121 | 7.62 | 183 of 521 (35.1%) |


**Our catalogue, other real items (candidates): 285 pieces, 396,769 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 2,301 | 5.8 | 93 of 285 (32.6%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 11,231 | 28.31 | 233 of 285 (81.8%) |
| current detector: kind 2 + test 2b | 13,532 | 34.11 | 233 of 285 (81.8%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 8,253 | 20.8 | 222 of 285 (77.9%) |
| ps13 (partitura): every difference from the written spelling | 48,831 | 123.07 | 229 of 285 (80.4%) |
| PKSpell: every difference from the written spelling | 20,285 | 51.13 | 214 of 285 (75.1%) |
| PKSpell with the kind-2 diatonic gate | 2,335 | 5.89 | 100 of 285 (35.1%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 9,986 | 25.17 | 199 of 285 (69.8%) |
| the same, with the diatonic gate | 1,589 | 4.0 | 92 of 285 (32.3%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 6,318 | 15.92 | 214 of 285 (75.1%) |
| PKSpell with the gate + test 2b with fix v1 | 8,287 | 20.89 | 223 of 285 (78.2%) |
| PKSpell with the gate + test 2b with fix v2 | 6,352 | 16.01 | 215 of 285 (75.4%) |


The validation pass's figures for the spelling filter reproduce: generated 3,605 ps13 differences in 145 items and 218 kind-2 notes in 24 items; PDMX 324 kind-2 notes in 32 items; other items 2,301 in 93 (`sp_check_repro.json` for the named items: Minecraft 65 and 30, Invention 9 4 and 13, harmonic minor 4, chromatic D 10, A-flat minor seventh 8 all equal). The PDMX count of ps13 differences differs slightly (23,476 in 248 here, 23,448 in 246 in the validation pass; same 324 kind-2 notes in 32 items); the cause is not traced.

### 4.6 Géré et al., rhythm and time consistency (`sp_gere.py`; raw output `build/gere_*.json`, not committed)

| set | files | notes | files with an individual-check error | files with a contextual-check error | contextual not applicable (more than one part) | files with any error | tool crashed on the file | errors per 1,000 notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| wir | 81 | 123,825 | 0 | 2 | 4 | 2 (2.5%) | 0 | 0.032 |
| m21ch | 380 | 94,959 | 1 | 0 | 379 | 1 (0.3%) | 0 | 0.042 |
| m21kb | 9 | 6,890 | 1 | 0 | 1 | 1 (11.1%) | 0 | 5.66 |
| cat_gen | 1211 | 58,832 | 0 | 0 | 0 | 0 (0.0%) | 0 | 0.0 |
| cat_pdmx | 524 | 278,443 | 13 | 44 | 0 | 54 (10.3%) | 8 | 2.087 |
| cat_other | 285 | 396,769 | 25 | 35 | 0 | 56 (19.6%) | 0 | 2.982 |


The checker reads encoded durations and voice structure, not pitch. On the published scores it flags 4 of 470 pieces (0.9%): the Mozart sonata finales K. 311/3 and K. 333/3 (its voice automaton cannot process a whole rest and a note in the voices as encoded), one chorale (note type `breve`, which its table does not know: a limit of the tool) and C. P. E. Bach h186 (tuplet note durations in `divisions` that do not divide, 171 against 512/3: a rounding in the file). On our catalogue it flags 0 of 1,211 generated items, 54 of 524 PDMX items (10.3%) and 56 of 285 other real items (19.6%), and crashed on 8 PDMX files (the partitura `IndexError` above). Its contextual check does not apply to files with more than one part (all but one of the 380 chorales). These are exact structural anomalies of the encoding, a different kind from a spelling candidate; this comparison has no ground truth for rhythm errors (the paper reports none either), so its precision on real errors is not measured here.

**The unclosed-bracket files (rule 26 kind 4, 10 files found by the validators' `unusual()` over the catalogue).** The checker flags 8 of the 10 (6 by the individual check, 2 by the contextual check); the other 2 are multi-part files on which the contextual check does not run. Its messages concern durations and voices, and I did not check that they sit at the bracket, so this is not evidence that it finds the bracket; that 8 of 10 are flagged against 10.3% of PDMX items suggests the same files are rhythmically odd (reading). Per-file result: `sp_gere.json`, "unclosed_tuplet_files".


### 4.7 Runtime (`sp_run.py`, `pks_run.py`)

Seconds per piece or per item (mean / median / max), measured on this machine with 8 worker processes at once (other jobs were running); the relation between the steps is the point, not the figures. Reading the file is shared by every method; the PKSpell figure excludes a one-off torch import and model load of a few seconds.

| step | published scores (pieces, notes median) | seconds per piece: mean / median / max | our catalogue | seconds per item: mean / median / max |
| --- | --- | --- | --- | --- |
| read the file into the note table (project reader, partitura) | 470 | 1.037 / 0.578 / 19.820 | 2017 | 0.357 / 0.086 / 11.857 |
| ps13 estimate_spelling | 470 | 0.452 / 0.011 / 31.569 | 2017 | 0.032 / 0.002 / 0.762 |
| PKSpell model call (CPU, 2 threads, after one-off import and load) | 470 | 0.069 / 0.039 / 0.490 | 2017 | 0.078 / 0.013 / 2.180 |
| raw MusicXML walk (first reading; needed by test 2b) | 470 | 0.110 / 0.067 / 1.219 | 2020 | 0.087 / 0.010 / 1.541 |
| test 2b over the walk | 470 | 0.049 / 0.012 / 0.618 | 2020 | 0.033 / 0.002 / 0.920 |
| notes per piece (mean / median / max) | | 480 / 239 / 4434 | | 364 / 58 / 7499 |


## 5. What the numbers say (each point names the table it reads)

- **The failing part of the current rule is test 2b, and it fails on correct scores of every kind.** Section 4.1, all 470 published scores: test 2b flags 3,059 pairs, 13.55 per 1,000 notes, in 361 pieces (76.8%); the kind-2 filter flags 39 notes, 0.17 per 1,000, in 14 pieces (3.0%). On Bach chorales alone test 2b still flags 7.21 per 1,000 (273 of 380 chorales). The three families the validation row names are all flagged (section 4.2: 4 + 4 harmonic-minor pairs, 10 chromatic-scale pairs, and Invention 9's three E to D-flat steps); the fix clears the harmonic-minor and Invention 9 pairs by the key-scale clause and the chromatic ones by the unison clauses (v1 leaves 3 of the 10, v2 none).
- **The fix does not make test 2b quiet.** On the published scores v1 still flags 1,226 pairs and v2 913 (4.1: current detector with the fix 5.61 and 4.22 per 1,000 notes, in 43.0% and 30.4% of pieces); what remains is dominated by diminished thirds, fourths and sevenths and augmented seconds, the intervals of diminished-seventh chords and chromatic voice-leading (the table after 4.2). It also costs catch: on the 409 injected chromatic misspellings test 2b catches 89.0%, v1 75.1%, v2 46.9% (4.3).
- **Kind 2 is nearly clean on published scores and blind to chromatic notes.** 0.17 false flags per 1,000 notes; the 39 flags are leading tones and raised degrees by reading (4.1). On injected misspellings it catches 99.0% of those whose correct spelling was in the signature and 0.0% (0 of 409) of the chromatic ones, 80.1% overall (4.3). On the two real files it finds all 34 candidates (4.4).
- **PKSpell against ps13.** Raw, PKSpell differs from the written spelling on fewer notes than ps13 (8.92 against 13.75 per 1,000 notes; 20.6% against 37.7% of the published pieces; chorales 0.32 against 8.17) and its raw differences catch about the same injected errors (98.4% against 98.0%) (4.1, 4.3). With the diatonic gate the two are alike (PKSpell 0.48 and 80.3% caught, ps13 0.17 and 80.1%): the gate, not the estimator, does the work, so PKSpell adds nothing to kind 2 as written. Its value is on the chromatic notes the gate cannot see: where ps13 and PKSpell agree on another spelling (no gate) the published-score rate is 1.52 per 1,000 notes (343 flags, 14.9% of pieces) and 96.9% of the injected misspellings are caught, 91.4% of the chromatic ones (4.1, 4.3). The agreement rate shows no advantage on the 21 works that are in PKSpell's training data (3.12 per 1,000 against 2.16 on the other 60, 4.1).
- **Agreement is not proof.** On the seventh-arpeggio family the two agree on 313 flags and catch none of its 88 misspelled notes (they respell correct flats as sharps, 4.4); on Minecraft Nether and Invention 9 they agree and are right by my reading (4.4). Without a key signature to gate by, the estimators are not usable; with generated items the spelling is known from the recipe, and a letter-by-interval rule is exact (4.4).
- **Natural errors found.** Beyond the validation row: 5 more generated chord items whose letters differ from the interval-by-root spelling (4 diminished-seventh, 1 G-flat minor-seventh), in addition to the 4 half-diminished ones already reported (4.4). The owner decides whether the generator should write double flats.
- **The exact facts stay code.** The 13 missing-accidental notes are caught by none of the spelling methods (4.3); the accidental model is exact and stays outside this choice.
- **Agent load on real items.** Where the two estimators agree, PDMX items carry 6,206 flags (22.29 per 1,000 notes) in 150 of 521 items and the other real items 9,986 (25.17 per 1,000) in 199 of 285; with the gate 285 (30 items) and 1,589 (92 items) (4.5). Reading six thousand candidates is not an agent task: the code must rank (gated, agreed flags first) and report counts per item, not a flat list.
- **Géré et al. answers a different question.** It checks encoded durations and voice structure (rhythm and time consistency), not pitch, so it cannot replace any spelling method; on correct published scores it flags 0.9% of pieces (4 of 470), 0 of 1,211 generated items, 10.3% of PDMX items and 19.6% of other real items (4.6). It is a candidate for the exact-structure side of the row, held apart from the spelling candidates. Its flags are structural anomalies in the encoding, not verdicts about the music; its precision on real errors is not measured here (no ground truth), the code crashed on 8 PDMX files in the command-line run, and its contextual check does not apply to multi-part files.
- **Runtime** (4.7): a PKSpell model call averages 0.07 s per published piece (maximum 0.49 s) after a one-off import and load of a few seconds and a torch install; ps13 averages 0.45 s with a maximum of 31.6 s on one long piece (the longest has 4,434 notes; a busy machine); test 2b averages 0.05 s over a 0.11 s raw walk. None is a cost problem for a classifier run once per item.


## 6. Limits

- "Correct" is a rule: published scores are taken as correctly spelled, and the 39 kind-2 flags (4.1) are read by me as leading tones in tonicised passages; no edition was seen and nothing was heard. Encoded corpora contain encoding errors, and composers respell on purpose.
- The injected misspellings are artificial, are one note at a time, and are made from published spellings that the estimators resemble; natural errors (a file produced by hand or by OMR in a different style) are the Minecraft and Invention 9 files, two items, read by me. The catch figures on injections are not recall on natural errors.
- PKSpell was trained on ASAP, which contains works also in the When in Rome set (21 of 81 pieces, matched by work) and likely other classical piano; the chorales and Joplin are not in it. Jazz and blues spelling is not tested here: the catalogue has blues-scale and jazz generated items, whose spelling is by the recipe, and the real jazz items have no truth.
- The fix was designed from the three named families and then measured on others; v2 was added after v1's published rates were read.
- One run of each method; the methods are deterministic (PKSpell on the CPU), so no variance is reported. Timings are from a busy machine.
- Géré et al. was run once with its published pins (partitura 1.7.0) on our files; its contextual check does not apply to multi-part files, which is most of the chorales and many catalogue items.
- The note counts are the project's note array (tied notes merged); test 2b works on the raw MusicXML walk (tied continuations skipped), so its per-note denominators are slightly different from a strict one.

## 7. Not run, and why

- Bouquillard and Jacquemard (arXiv 2606.20198): not a section 7 candidate row; no code known.
- Beaming (kind 3), ledger limit (kind 5), unclosed brackets (kind 4) as a comparison: not spelling.
- Jazz and lead-sheet spelling truth: none in reach; the When in Rome set has no lead sheets.
- The paper's ASAP corpus with the authors' manual fixes (develop branch of the ASAP repository) for Géré et al.: not downloaded; only metadata.csv was fetched.

## 8. Scripts and data in this folder

| file | what it does | writes |
| --- | --- | --- |
| `cmp_common.py` | paths; the validators' raw walk re-pointed (`validation/walk.py` executed from source); `r_sanity.py` executed from source untruncated; the note-table reader with the pickup-test fallback | - |
| `sp_lib.py` | the flag definitions: ps13 / PKSpell differences, the diatonic gate, test 2b hits with the fix verdicts | - |
| `sp_select.py` | the selection rules for the published scores and the catalogue | `sp_pieces.json` |
| `sp_prepare.py` | reads every piece into a note table | `sp_prepare.json`, `build/sp_in/` |
| `pks_run.py` | PKSpell on every note table (run in `build/venv-pkspell`) | `sp_pks.json`, `build/sp_pks/` |
| `sp_check_repro.py` | this folder's flags against the validators' own functions and the validation row's figures | `sp_check_repro.json` |
| `sp_run.py` | every method on every piece | `sp_results_<set>.json` |
| `sp_metrics.py` | false-flag tables, ASAP split, whole-piece mismatches, runtime | `sp_metrics.json`, `frag_m_*.md`, `frag_runtime.md`, `frag_m21kb_pieces.md`, `frag_metrics.md` |
| `sp_pubflags.py` | the kind-2 flags on published scores, listed | `frag_pubflags.md` |
| `sp_named.py`, `sp_named_table.py` | the validation row's named items, flag by flag; kind 1 | `sp_named.json`, `frag_named.md` |
| `sp_t2b_residual.py` | test 2b hits on the published scores by interval, before and after each fix | `sp_t2b_residual.json`, `frag_t2bres.md` |
| `sp_arp7.py` | the seventh-arpeggio family against the chord-letter rule | `sp_arp7.json`, `frag_arp7.md` |
| `sp_inject.py`, `sp_inject_metrics.py` | injected misspellings and the catch tables | `sp_inject_results.json`, `sp_inject_metrics.json`, `frag_inject.md` |
| `gere_run.py` | the Géré et al. checkers with the command line's arguments and one try/except per file (run in `build/venv-gere`) | `build/gere_published2.json`, `build/gere_cat2.json` (not committed) |
| `sp_gere.py` | digest of the Géré et al. run (`detect_errors`, in `build/venv-gere`) and of the unclosed-bracket files | `sp_gere.json`, `frag_gere.md` |
| `build_spelling.py` | assembles this page from `spelling_template.md` and the `frag_*.md` files | `spelling.md` |
| `pks_commit.txt` | the PKSpell commit | - |


To reproduce: `build/pkspell` (clone above), `build/venv-pkspell` (as `C:/vpks`), `build/gere`, `build/venv-gere` (as `C:/vgere`), `build/asap_meta/metadata.csv`; run in the order of the table with the main checkout's `.venv` (music21 10.5.0, partitura 1.9.0) and `-X utf8`, except `pks_run.py` (with `C:/vpks/Scripts/python.exe`) and the Géré command in 4.6.

## 9. Recommendation

What the code reports as exact (the file says it, nobody judges it): the written spelling and key signature of every note; a required accidental the file omits; an unclosed tuplet bracket; for generated items, the letters of a chord by interval from the recipe's root; and rhythm and time inconsistencies as Géré et al.'s checker reads them (a separate kind, kept apart from spelling). What the code reports as inferred candidates, each carrying the written spelling and the competing one and never rewriting the score: the notes on which ps13 and PKSpell agree on another spelling, those whose agreed spelling is a note of the signature listed first, with counts per item so the agent is not handed a flat list of thousands. Test 2b is dropped: even with the fix it flags 4.22 to 5.61 pairs per 1,000 notes on correct scores and catches fewer injected misspellings than the agreeing pair. The agent decides each candidate: a misspelling, a deliberate enharmonic, a tonicisation, a chord spelled as the style does (jazz, blues). Agreement of the two tools raises confidence and is not a verdict; it was shown wrong on a correct chord.

integrity.notation-sanity: code + agent (code flags the notes on which ps13 and PKSpell agree on another spelling and reports the written spelling as exact; the agent decides each) — on 470 published scores that rule flags 1.52 notes per 1,000 (14.9% of pieces) and catches 96.9% of 2,148 injected misspellings, against test 2b's 13.55 per 1,000 (76.8% of pieces), but the two estimators agree on wrong answers too (0 of 88 misspelled chord notes caught on generated arpeggios, 313 flags on correct ones), so no flag is a verdict.

