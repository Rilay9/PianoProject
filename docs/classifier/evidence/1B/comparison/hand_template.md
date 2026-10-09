# prereq.hand-assignment, technique.five-finger and technique.position-shift: the current detectors against existing tools, 2026-10-08

**What this is.** One of the bounded comparisons of handoff step 3, run on three characteristics: `prereq.hand-assignment` (area 1A, uncertain), `technique.five-finger` and `technique.position-shift` (area 1B, failing, validation rows 3 and 4). Nothing is rewritten: the current detectors (the chunk-1 validators' re-implementations) are measured against the tools of `docs/classifier/tools-survey.md` sections 3 and 4, on annotated ground truth where it could be fetched and on the project's own scores, following the method of `key.md`. Base commit c47f18c7. Every figure was produced by a script in this folder (listed in section 10). The outside review relayed 2026-10-08 (`docs/prompts/inputs-2026-10-08/chatgpt-review-step3.md`) was applied as a correction after the runs: sections 6 and 7 keep what the notation states exactly separate from what is inferred, and say where a benchmark answers a different question from the one the ability asks.

**Labels.** *measured*: a script in this folder produced it on the data named. *reading*: from the text of a page or a standard analysis, not run. Nothing here has been heard.

**The ground truth the brief named could not be fetched.** PIG (hand and finger per note) is behind a registration form (first and last name, country, affiliation, job title, phone number, e-mail twice, purpose of use) and an e-mailed one-hour password, with the administrator approving irregular registrations; its page says "Only nonprofit, academic use is allowed." Registering is a form, so it was not done (the brief's rule). Its licence is therefore the nonprofit-academic-use statement on the dataset page; no other licence text was read. ThumbSet (Zenodo 6433702) is a restricted record that needs a request with an academic justification and acceptance of use conditions: not done. So **no human hand-per-note and finger-per-note annotation was available, and every PIG-based figure (hand accuracy on PIG, Nakamura's match rate, positions from PIG fingerings) is UNKNOWN.** What replaced it is described in section 1 and is weaker.

## 1. What was compared

**Current detectors** (called unchanged or re-implemented from the page's own text):
- `prereq.hand-assignment`: the hand of a note is the project reader's staff rule (`tools/classifier/score.py`: staff 1 right, staff 2 left; two one-staff parts: part 0 right; one staff: the declared hand), plus the four flags of `rules/area-1A.md` section 3 (true cross-staff writing, voice-number collision, printed hand words, notes struck together more than 16 semitones apart), re-implemented in `hand_ha.py` from the page and from `evidence/1A/validation/r_format.py` `hand_flags`.
- `technique.five-finger` and `technique.position-shift`: `evidence/1B/validation/frames.py` (the corrected frame rule, finger slots, chord-linked frames, alternation merge, classes, `changes()`), imported unchanged and fed the project's texture view (`rules/texture.py` `view`).
- **Current detector with fix** (the smallest change the validation rows' own evidence points to, `hand_fix.py`): F1 (row 4: the kind of a change of frame is `shift` also when a step of more than 2 semitones occurs among the three onsets before the new frame), F2 (row 4: a change between two chords of 3 or more notes is `shift`), F3 (row 3 (b): the chromatic-stretch guard also reads runs of double notes that all move by one semitone). Not fixed, because the rows' evidence names no smallest change: row 3 (a) (a pattern moved up a semitone spelled with sharps) and (c) (a chain of root-position chords by thirds).

**Existing tools** (survey sections 3 and 4):
- **piano_svsep** (MIT; `github.com/CPJKU/piano_svsep` at 1462e7c28d7adaae033150883a7cb00238ee364a, `pretrained_models/model.ckpt`): predicts the staff of every note. Run on the printed score with `include_original=False`; its predicted staff 1/2 is read as right/left hand, the project's own mapping for a two-staff part.
- **pianoplayer** (MIT; `github.com/marcomusy/pianoplayer` at 6fb0e2114d7b21f75c0be5208172e1243a57323e, version 3.0.2 from the clone; the survey read release 3.0.1): fingers the notes, hand taken from the staves (`core.py` `_resolve_musicxml_routing`). Run on the score with all printed fingering stripped first, hand size M, a left-declared single-staff item as left hand only.
- Penner and Hindle, and HMMs trained on PIG: not run, section 2.

**Ground truth used instead of PIG (all labelled).**
- *Fingering-derived position truth* (`technique.five-finger`, `technique.position-shift`). The printed fingering of the catalogue's own scores: every hand-passage in which at least 24 of its struck notes carry a single digit 1-5 and those are at least 80% of that hand's struck notes (rule fixed in `hand_census.py` before any method ran). 179 files, 326 hand-items (an item's right or left hand): generated scale 108 files (216 hand-items), generated arpeggio 24 (48), generated chromatic 16 (24), authored 20 (26), PDMX 11 (12). **The generated items' fingering is the recipe's standard fingering (written by the generator from the standard tables, not by a person); the authored items' is hand-authored; only the 11 PDMX items carry an editor's fingering from the wild.** So this is not a human-annotated set: it is the fingering the catalogue itself prints. Hanon items carry fingering on too few notes to qualify.
- *How a hand position and a shift are derived from a fingered passage* (`hand_def.py`, written before any method's output was looked at; its docstring is the full statement): a five-finger placement is a thumb key t; finger f rests on t + {0, 2, 4, 5, 7}[f-1] (right hand; mirrored for the left); each fingered note implies a thumb key e; a position is a run of events whose implied thumb keys span at most W = 3 semitones (or repeat notes already in it); its class is five-finger when the span R is at most 1, extended when R is 2 or 3, beyond for an event wider than that; a position shift is each boundary between two consecutive positions, and it is a *crossing* when the finger order inverts against the direction of travel (thumb under, finger over) and a *shift* otherwise. W = 2 and W = 4 are run as a sensitivity check (section 4), not tuned.
- *Hand truth* (`prereq.hand-assignment`). Printed hand words are the only notation in reach that states the playing hand against the staff: m.d./m.s./m.g./r.h./l.h./mano destra/sinistra/main droite/gauche/rechte/linke Hand, the anchored regex of area-1A rule 3 flag 3. Rule (`hand_ha.py` `word_truth`, fixed before any method ran): the word applies to the notes of its part and staff in its bar from its onset to the next hand word on that staff in that bar, else to the bar's end; two words at one onset on one staff are skipped. 12 files, 287 notes. **The extent is my reading: a word often governs more than its bar, so this undercounts, and a word's hand is the engraver's statement, not a recording.** Second set: 97 generated two-staff items (every 8th of 774), where the hand is the staff by construction. Third: 33 real two-staff items (every 20th of 668), agreement only (no truth). Named items: the 10 the validation row names.

**Strata and what the truth cannot say.** Fingering-derived positions answer "where does the hand move, as a fingering would", and for scales and arpeggios that is the thumb crossing, not the named five-finger position a method book teaches (C position, G position). Section 7 returns to this.

## 2. Tools that needed more than a call, and what did not run

**piano_svsep: ran.** Venv `build/venv-svsep` reached through a junction `C:\vsv` (`mklink /J`, no system setting changed; the pilot's long-path precaution, no long-path error occurred here). CPU wheels: torch 2.8.0+cpu from `download.pytorch.org/whl/cpu`, torch-scatter 2.1.2+pt28cpu from `data.pyg.org/whl/torch-2.8.0+cpu.html`, torch_geometric 2.8.0, partitura 1.8.0 (pinned), scikit-learn 1.6.0, verovio 4.2.1, numpy 2.2.6. **One error, cause visible, fixed once:** `ModuleNotFoundError: pandas` from partitura 1.8.0 (its `io/importdcml.py` imports pandas, which its requirements do not list); `pip install pandas`. About 10 minutes in all. The model loads in about 1.2 to 1.4 s and runs on the CPU. One real item errors: `song.classical.chopin-nocturne-op27-2.nifc`, `TypeError: unsupported operand type(s) for +: 'int' and 'NoneType'` (cause not traced). Its output rows are matched to the printed notes by the pitch sequence, not by onset, because partitura counts a pickup measure's onsets from a negative time and splits ties at barlines (`hand_ha.py`).

**pianoplayer: ran.** Venv `build/venv-pp`, `pip install` of the clone, one dependency (rich); no error. Run per item by `pp_run.py` (printed fingering stripped, output re-read by `hand_xml.py`). It is not a hand assigner: it takes the hand from the staves, so for `prereq.hand-assignment` it is the staff rule and was not scored separately.

**Not run:**
- **PIG and ThumbSet**: registration form / restricted request (above).
- **Penner and Hindle (arXiv 2609.28787)**: the article is CC BY 4.0; the arXiv abstract page states no code or model location. The IEEE DataPort page (DOI 10.21227/22f6-5d72) that holds the replication package (`statistical_transcription_replication_package.zip`, 1.3 MB) says "This dataset requires an IEEE DataPort Subscription to access" and "LOGIN TO ACCESS DATASET FILES", and states no licence. A login is needed: not done. (The survey's "models and scripts on Zenodo" was not found; reading of the DataPort page only.) It also reports its results on PIG, which could not be fetched either.
- **HMMs trained on PIG (Nakamura, Saito, Yoshii 2020)**: code availability unconfirmed in the survey; the cited demo page `statpianofingering.github.io` returned HTTP 404; the models are trained on PIG, which could not be fetched, so training them was not possible. UNKNOWN.
- **DCML corpora** (the data piano_svsep was trained on; staff truth, CC BY-NC-SA): not downloaded; staff is the written hand, so it could not have supplied the playing hand either, and the brief named PIG. piano_svsep's published staff accuracy (91.0 on DCML Romantic, survey section 3) is therefore not reproduced here.
- **Nakamura's match rate** (human ceiling 71.4): needs PIG. What was measured instead is pianoplayer's note-by-note digit agreement with the catalogue's printed fingering (section 4).
- **Opening-bracket hand words** (row 1A: none in the catalogue), **hand truth for unmarked crossings** (nothing states it): UNKNOWN.

## 3. prereq.hand-assignment

{{HA}}

## 4. technique.five-finger and technique.position-shift: against the fingering-derived truth

Truth: the 326 hand-items of section 1 (3,484 truth segments, 3,158 truth shifts at W = 3). Strata: generated scale, generated arpeggio, generated chromatic, authored, pdmx. Sensitivity of the headline rows to W is at the end of this section.

{{POS}}

## 5. The named items of validation rows 3 and 4

{{NAMED}}

## 6. What the numbers say (each point names the table it reads)

{{SAYS}}

## 7. What the benchmark does not ask (the outside review, applied)

- **Exact versus inferred.** The staff a note is written on, a printed hand word, a printed fingering digit and a chord's notes are read from the notation and are exact. The playing hand, a five-finger position, a position shift and its kind are inferred, by every method here. The outputs the recommendations below describe keep the two apart: `written_staff` and `printed_fingering` as exact fields; `hand`, `position`, `shift` and `kind` as inferred fields with their witnesses.
- **Agreement is confidence, not proof.** Section 3: the staff rule and piano_svsep agree on most hand-word notes and are both wrong on 96 of them (both answer the written staff). Section 4: where the current detector and pianoplayer predict the same shift, 86.3% are truth shifts, against 51.4% for the current detector alone; that is evidence for ranking marks, not for trusting them, and both read the same notes.
- **A benchmark that asks a different question.** The truth of section 4 is where a fingering moves the hand. `technique.position-shift` is taught as "move the hand to a new five-finger position" (ability AB-010) and `technique.five-finger` as staying in one named position. In a standard-fingered scale the fingering moves at the thumb (event 3 of C D E F G A B C), which the learner meets as a crossing, while the current rule's frame changes where the frame fills (event 5). Scoring the current rule at 51.3% recall against that truth measures how far its frames are from fingering moves, not how often it misses a taught position change; and pianoplayer scoring 83.9% recall partly reflects that truth and pianoplayer read the same fingering definition. Neither number says a learner is taught correctly. The class table likewise: always saying "five-finger" scores as well as either method, so class agreement against this truth cannot separate them.
- **The outside reviewer's chunk-1 notes (`docs/prompts/inputs-2026-10-08/chatgpt-review-chunk1-rules.md`, optional input, applied to the recommendation text only; no new run).** For hand assignment: staff is exact, hand is declared or inferred, and an unflagged staff assignment is not exact; unresolved passages carry into the rows that read a hand. For five-finger: a feasible fingering model generates hypotheses and does not certify a hand shape; certification needs explicit exercise design or robust passage evidence, else UNKNOWN. For position-shift: not every frame change is a physical relocation; the observed note-span transition, the plausible finger crossing and the unavoidable repositioning are three different things and the last needs fingering or ergonomic evidence. Section 4 measures only the first two against fingering-derived boundaries; "unavoidable repositioning" was not measured by anything here.
- **Different question, hand assignment.** piano_svsep predicts the staff an engraver would write (survey section 3); the hand-word truth asks who plays the notes. Scoring it on word truth tests whether the engraver's staff convention happens to track the playing hand, which it mostly does not where the composer wrote "m.g." on the treble staff.

## 8. Limits

- No PIG, no human-annotated hand or finger truth. The fingering truth is the catalogue's own printed fingering: generated items' is the recipe's standard fingering, not a performer's; the 11 PDMX items are the only editor-fingered ones. Results on arpeggios and chromatic items mostly test the truth definition (a hand opening over an octave is not a thumb-key model), and are given for completeness.
- The hand-word truth is 12 files and 287 notes with a bar-limited extent chosen by me; the 119 notes where the word names the other hand are in 8 files. It cannot measure unmarked crossings (the known limit of the page), which stay UNKNOWN.
- The generated sample for piano_svsep is every 8th two-staff 'both' item (97 of 774), the real sample every 20th (33 of 668, one error).
- Runtimes were measured on this machine with several processes at once: upper bounds.
- One run of each; the methods are deterministic, so no variance is reported. Nothing here has been heard.

## 9. Not run, and why

See section 2.

## 10. Scripts and data in this folder

| file | what it does | writes |
| --- | --- | --- |
| `hand_def.py` | the truth definition (written first) | - |
| `hand_xml.py` | MusicXML walker (notes, staff, voice, onset, printed fingering, hand by the project's rule) | - |
| `hand_census.py`, `hand_manifest.py` | which catalogue items carry enough printed fingering; the item lists | `hand_census.json`, `hand_manifest.json` |
| `hand_words.py` | printed hand words with bar, staff, onset | `hand_words.json` |
| `hand_ha_list.py`, `svsep_run.py`, `hand_ha.py`, `hand_ha_report.py` | hand assignment: item list, piano_svsep run (`C:/vsv/Scripts/python.exe`), flags and truth, tables | `hand_ha_list.json`, `svsep_out.json`, `hand_ha_results.json`, `hand_ha_metrics.json`, `frag_ha.md` |
| `pp_run.py` | pianoplayer on the truth and named items (`build/venv-pp`) | `build/ppout/*.xml`, `pp_times_*.json` |
| `hand_fix.py` | fixes F1-F3 to the validators' `frames.py` | - |
| `hand_pos.py`, `hand_pos_report.py` | positions and shifts: current, fixed, pianoplayer vs truth | `hand_pos_truth.json`, `hand_pos_named.json`, `hand_pos_metrics.json`, `frag_pos.md` (and `_W2`, `_W4`) |
| `hand_named_report.py` | the named items | `hand_named_metrics.json`, `frag_named.md` |
| `build_hand.py` | assembles this page from `hand_template.md`, the `frag_*.md` files and `hand_says.md` | `hand.md` |

To reproduce: clone `build/piano_svsep` and `build/pianoplayer` at the commits above; venvs as in section 2; run the scripts in the order of the table with the main checkout's `.venv` (music21 10.5.0, partitura 1.9.0), `-X utf8`, from the worktree; `svsep_run.py` with `C:/vsv/Scripts/python.exe`, `pp_run.py` with `build/venv-pp/Scripts/python.exe`.

## 11. Recommendation

{{REC}}
