# texture.melody-location and notation.chord-symbols: the current detectors against existing tools (step 3, area 1A), 2026-10-08

**What this is.** The bounded comparison of handoff step 3 for two area 1A characteristics, `texture.melody-location` and `notation.chord-symbols` (the second failed at its step 3, which takes the first's answer). Nothing is rewritten: this page measures the current detectors against the candidates `docs/classifier/tools-survey.md` section 5 and section 22.2 name, on annotated ground truth and on the project's own items, and ends in one recommendation line per characteristic. Method follows `docs/classifier/evidence/1B/comparison/key.md`. Base commit c47f18c7. Every figure was produced by a script in this folder (section 10); nothing is copied from the validation pages. Machine: Windows, CPU only, shared with other jobs (runtimes are relations, not general figures).

**Labels.** *measured*: a script in this folder produced it on the data named. *reading*: from the notes of a score or a text, not run, with the notes shown. Nothing here has been heard.

{{frag_static_1_2.md}}

## 3. The question each benchmark answers, against the question a learner has

- *POP909's melody track is the sung melody of a pop arrangement*, which the arranger wrote as a separate track. The question this project asks is which line a learner must bring out in a classical or lead-sheet piano score, where the tune may sit in an inner voice, move between hands, be imitated, doubled or accompanied by figuration that is more active than the tune. A method that scores well on POP909 has learned to find the sung line in pop arrangements.
- *Staff is not hand, and top is not melody.* The POP909 scores here put the pitch-60 split on the right hand and the melody track is above it in 96.9% of the bars, so any method that says "right hand" scores 96.9%; the same for the Mozart set (96.5%, from the score's own staves). "Correct bars" is therefore reported beside the always-right baseline and beside the left-hand bars found, which is where a hand decision is needed. The note-level scores are the informative ones on both sets.
- *Agreement between methods is confidence, not proof.* Two methods can share an error (the skyline and the current rules both name the left hand in the Fantaisie-Impromptu's arpeggio bars). Where a rule below accepts a bar because methods agree, the accepted-and-wrong count is shown.
- *The Mozart annotation* is one pianist's reading of the main line of a classical piano sonata, on real staves: closer to the learner's question, but it is also one reading, and imitation and exchange between hands are exactly where annotators differ.

## 4. texture.melody-location results

**Truth, measured** (`mel_eval.py`, `mel_metrics.json`): POP909 test songs, 86 songs, 141,976 notes, 29,379 melody-track notes (51,336 with the bridge track); bars with a melody 5,551 (variant M), of which the right hand holds 5,380 and the left hand 171. Mozart, 34 movements, 62,048 evaluated notes of which 30,289 are melody; 4,763 bars with a melody: right 4,596, left 167.

How to read the tables. *correct / bars*: the method's hand equals the truth hand; an unanswered bar is counted wrong. *left-hand bars found / present*: of the bars whose melody is in the left staff, how many the method names left. *right-hand bars named left*: the opposite error. Note P/R/F1: among the notes, those the method calls melody (current detector: the highest note at each onset of the hand it names, in the bars it settles; skyline and MidiBERT: their own note labels). *F1 inside bars it answered*: the same, restricted to bars where the method named a hand.

### 4.1 POP909, positives = the MELODY track (variant M), 86 songs

{{frag_mel_pop_M.md}}

### 4.2 POP909, positives = MELODY and BRIDGE tracks (variant M+B), 86 songs

{{frag_mel_pop_MB.md}}

MidiBERT's own score on its own prepared tokens (the control, section 2): accuracy 98.8%, F1 98.4% for classes 1 or 2 against melody-plus-bridge; the numbers in these two tables are for this comparison's input, with the gap unexplained (section 2).

### 4.3 Mozart sonatas (Simonetta annotation on When in Rome scores), 34 movements, all aligned bars

{{frag_mel_moz.md}}

### 4.4 Mozart, the 18 movements in 4/4, 2/2 or 2/4 (MidiBERT's design assumes 4/4)

{{frag_mel_moz_duple.md}}

### 4.5 Where the methods agree (the plain skyline, MidiBERT and the current rules), and what they get wrong when they agree

Rule: accept a bar's hand only where every method listed answers and they name the same hand; the rest go to the agent. Bars are the bars with a truth melody (variant M on POP909).

{{frag_agree.md}}

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

{{frag_chord_parse.md}}

Reading of the figures: on the 460 items the current reading (raw walk, `r_misc.chord_symbols`) and music21's `<harmony>` reader agree on the symbols in 459 items (root, bass, N.C. after de-duplication); the exception is `song.folk.muskrat-ramble.pdmx`, 37 symbols by the walk against 35 by music21 (cause not traced), and the raw count differs on `song.classical.brahms-hungarian-dance-5` (6 by the walk, 12 by music21; cause not traced, probably repeats). Slash chords 415 and N.C. 62 are the same. A duplicated symbol (the same time, root, kind and bass written once per staff) is removed by both; whether a repeated symbol is a second chord change is not a question of the notation and stays with the harmony rules.

### 5.2 Symbols typed as text

{{frag_chord_text.md}}

Failures worth naming (measured, `chord_parse_text.json`): music21's text parser reads "Bb7" as root B (171 symbols; the root-letter-plus-flat is not taken as the root before a number) and likewise "Eb7", "Ab7", "Db7", "Ab6", "Bb7/F": 24 spellings, 447 symbols parse with the wrong root or bass; it raises on 89 spellings (378 symbols), among them "Bbm7" and "Ebm7". Tonal parses 202 of 239 spellings and every one it parses has the right root and bass; what it does not parse is a notation convention (`mi` for minor: "Gmi", "Cmi6"; "C/6"; "A-7(b5)"; a private-use glyph), 139 symbols. Neither separates a symbol from a note-name aid: both read the Chopin waltz's letters "E", "A", "B", "C" as major chords. The current pattern also offers those letters, so the text route stays a candidate generator in every case.

### 5.3 The role of the notes under each symbol (step 3), named items

Expected role per item is stated from the score (reading) or the family contract; "right / symbols" counts symbols whose answer equals it. "family fix" = step 3 with the generated family's own statement used first, set for the montuno only (the one family the validation row names). MidiBERT's role = over a melody line where it labels at least one note of class 1 or 2 in the bar, else over written accompaniment.

{{frag_chord_role.md}}

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
