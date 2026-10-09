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

{{m_published_all}}

{{m_wir}}

{{m_m21ch}}

{{m_m21kb}}

The nine keyboard works one by one:

{{m21kb_pieces}}

**PKSpell's training data.** PKSpell was trained on ASAP (its README). `sp_metrics.py` matches the When in Rome pieces to ASAP's metadata by work (`build/asap_meta/metadata.csv`, fetched from `github.com/fosfrancesco/asap-dataset`, a plain file download): 21 of the 81 pieces are works that ASAP contains (WTC I preludes, Etudes op. 10 nos. 1 and 12, Mozart K. 310/1, K. 331/3 and K. 332). The rows below are for the 21 and for the other 60; the chorales are not piano and not in ASAP. (Whether the released weights saw all of ASAP is not stated in its README: reading.)

{{m_wir_asap}}

{{m_wir_not_asap}}

**Whole-piece enharmonic mismatches.** Where a piece is written in an enharmonic key of the one an estimator prefers, the raw difference rate is a property of the key, not of the notes. PKSpell differs on 799 of 810 notes of WTC I no. 3 (written C-sharp major, PKSpell spells D-flat major) and 397 of 404 of no. 13 (F-sharp major / G-flat); ps13 differs on all 663 notes of no. 17 and on four chorales (`sp_metrics.json`, "whole_piece"). The diatonic gate removes all of these, because the estimate is not a note of the file's signature; this is why the gated rows are near zero and the raw rows are not, and why "PKSpell raw" on the 21 ASAP works (61.78 per 1,000) is two pieces.

**The 39 kind-2 flags on the published scores, listed** (`sp_pubflags.py`). By reading, 30 are a sharp leading tone or raised degree (D-sharp, A-sharp, E-sharp) in a passage that tonicises the next degree, 6 are double sharps (C-double-sharp and F-double-sharp as leading tones in diminished-seventh chords, the Revolutionary Etude among them), 3 other; the standard spelling in all of these is the written one, so by reading they are false flags, and ps13 and PKSpell agree with each other on 36 of 39 (the gate keeps the estimate, not the context).

{{pubflags}}

### 4.2 The validation row's named false flags, flag by flag (`sp_named.py`, `sp_named_table.py`)

{{named}}

**What test 2b flags on the 470 published scores, by interval, and what each fix keeps** (`sp_t2b_residual.py`). More than a third of its hits are augmented unisons, the ordinary chromatic step. What the fix leaves is dominated by diminished thirds, fourths and sevenths and augmented seconds, which in tonal music are the intervals of a diminished-seventh chord, of a harmonic-minor scale outside the signature and of chromatic voice-leading; the spelling of a respelt note is as likely right as wrong there (reading).

{{t2bres}}

### 4.3 Known errors and injected misspellings

**Kind 1, the 13 notes in 8 generated items** (6 blues-scale items, 2 tritone-substitution items; the file's pitch is right, the accidental sign is missing: the blues B-flat scale's E-flat). These are exact structural errors in the markup, not spellings. The spelling methods do not catch them: of the 13 notes, kind 2 flags 0, ps13 raw 0, PKSpell raw 1 (it prefers another spelling of a note the file writes correctly), agree 0. Test 2b has a flagged pair around all 13, but the pairs are chromatic steps (the blues scale's E-natural to E-flat, a diminished unison, is one), which the sign's absence does not make wrong, so its flag is for another reason (`sp_named.json`, "kind1_missing_accidentals"). The accidental model stays code.

**Injected misspellings: 2,148 notes in 470 correct scores** (`sp_inject.py`, `sp_inject_metrics.py`). Caught = the method flags the injected note (or, for test 2b, a new pair containing it).

{{inject}}

### 4.4 The kind-2 candidates and the generated chord family

**Minecraft Nether and Invention 9 (reading, mine; no edition seen).** The signature of the Minecraft file is three flats (B-flat, E-flat, A-flat); the file contains 55 B-flat and 56 E-flat, **no A-flat and no D-flat at all**, and 30 G-sharp and 35 C-sharp. The 30 kind-2 candidates are all G-sharp, where A-flat is a note of the signature: by reading, 30 of 30 misspellings. ps13 and PKSpell agree on all 65 differences (30 G-sharp to A-flat, 35 C-sharp to D-flat); the 35 C-sharps are not flagged by kind 2 (D-flat is not a note of the signature) and are, by reading, also misspellings (the figures are C, D-flat, F, A-flat). Invention 9 (four flats) writes A-flat 69 times; the 4 kind-2 candidates (G-sharp in bars 5 and 9, D-sharp in bar 12, A-sharp in bar 25) each sit in a figure whose neighbouring statements use A-flat, E-flat and B-flat: by reading, 4 of 4 misspellings. In both items the two estimators say the same thing, and here the agreement happens to be right. Of Invention 9's 13 test-2b pairs, fix v1 keeps 9: the 4 above and 5 that are the diminished-seventh outlines B-natural to A-flat, F-sharp to E-flat (vii-diminished-seventh of C and of G in F minor), which by reading are correct; the 4 cleared pairs are the E to D-flat and E to A-flat steps of F harmonic minor.

**Agreement is not proof (reading, with the figures measured).** `exercise.arpeggio7.a-flat-minor7.2oct.both` has no key signature and spells A-flat, C-flat, E-flat, G-flat, which is right (C-flat is the minor third). ps13 and PKSpell both respell the whole chord in sharps (34 differences, `sp_named.json`), and the kind-2 gate flags the 8 C-flats because B is "diatonic" to an empty signature: the exception for keyless chord items that rule 26 states is what removes them, and the estimators are no help there. On the whole seventh-arpeggio family:

{{arp7}}

The 9 items whose letters differ from the interval-by-root spelling are the 4 half-diminished items `area-1B.md` already reported (A-flat, D-flat, E-flat and G-flat: D for E-double-flat and similar), 4 diminished-seventh items (B-flat: G for A-double-flat; C: A for B-double-flat; E-flat: A and C for B-double-flat and D-double-flat; F: D for E-double-flat) and G-flat minor seventh (A for B-double-flat). Some of these may be the generator's deliberate avoidance of double flats; as spellings of a chord by interval from its root they are misspelled, and the owner decides whether the generator should write the double flats. Kind 2, the gate, PKSpell (raw and gated) and the two in agreement catch none of the 88 notes; ps13 raw catches 9 of 88 among 506 false flags; test 2b catches 80 of 88 at note level, at 234 flags on correctly spelled notes of the family (not traced further). A rule that spells a chord by interval from its recipe root is exact for generated items and does not need any of these tools.

### 4.5 Our catalogue: candidate load (`sp_run.py`; these are candidates, not false flags)

{{m_cat_gen}}

{{m_cat_pdmx}}

{{m_cat_other}}

The validation pass's figures for the spelling filter reproduce: generated 3,605 ps13 differences in 145 items and 218 kind-2 notes in 24 items; PDMX 324 kind-2 notes in 32 items; other items 2,301 in 93 (`sp_check_repro.json` for the named items: Minecraft 65 and 30, Invention 9 4 and 13, harmonic minor 4, chromatic D 10, A-flat minor seventh 8 all equal). The PDMX count of ps13 differences differs slightly (23,476 in 248 here, 23,448 in 246 in the validation pass; same 324 kind-2 notes in 32 items); the cause is not traced.

### 4.6 Géré et al., rhythm and time consistency (`sp_gere.py`; raw output `build/gere_*.json`, not committed)

{{gere}}

{{gere_note}}

### 4.7 Runtime (`sp_run.py`, `pks_run.py`)

Seconds per piece or per item (mean / median / max), measured on this machine with 8 worker processes at once (other jobs were running); the relation between the steps is the point, not the figures. Reading the file is shared by every method; the PKSpell figure excludes a one-off torch import and model load of a few seconds.

{{runtime}}

## 5. What the numbers say (each point names the table it reads)

{{says}}

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

{{scripts}}

To reproduce: `build/pkspell` (clone above), `build/venv-pkspell` (as `C:/vpks`), `build/gere`, `build/venv-gere` (as `C:/vgere`), `build/asap_meta/metadata.csv`; run in the order of the table with the main checkout's `.venv` (music21 10.5.0, partitura 1.9.0) and `-X utf8`, except `pks_run.py` (with `C:/vpks/Scripts/python.exe`) and the Géré command in 4.6.

## 9. Recommendation

{{recommendation}}
