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

**Hand-word truth (12 files with a printed hand word; rule in section 1).**

| item | words | truth notes | of them on the other hand's staff (truth hand differs from the staff rule) | staff rule right | piano_svsep right (of notes it predicted) | svsep right on other-staff notes | svsep right on same-staff notes | truth notes in flagged bars |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| song.classical.bach-little-prelude-in-d-minor-bwv-935.pdmx |  | 12 | 0 | 12 (100.0%) | 10/12 (83.3%) | 0/0 | 10/12 | 12 |
| song.classical.chopin-etude-in-e-flat-minor-op-10-no-6.pdmx |  | 35 | 35 | 0 (0.0%) | 7/35 (20.0%) | 7/35 | 0/0 | 35 |
| song.classical.debussy-children-s-corner-doctor-gradus-ad-parnassum.pdmx |  | 35 | 35 | 0 (0.0%) | 7/35 (20.0%) | 7/35 | 0/0 | 35 |
| song.classical.debussy-clair-de-lune |  | 18 | 18 | 0 (0.0%) | 0/18 (0.0%) | 0/18 | 0/0 | 18 |
| song.classical.grieg-album-leaf-op-47-no-2.pdmx |  | 42 | 4 | 38 (90.5%) | 36/42 (85.7%) | 0/4 | 36/38 | 42 |
| song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx |  | 5 | 5 | 0 (0.0%) | 3/5 (60.0%) | 3/5 | 0/0 | 5 |
| song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx |  | 84 | 0 | 84 (100.0%) | 81/84 (96.4%) | 0/0 | 81/84 | 84 |
| song.classical.nazareth-carioca-1913.pdmx |  | 23 | 9 | 14 (60.9%) | 14/23 (60.9%) | 3/9 | 11/14 | 23 |
| song.classical.rimsky-flight-bumblebee |  | 8 | 0 | 8 (100.0%) | 8/8 (100.0%) | 0/0 | 8/8 | 8 |
| song.folk.3-variations-on-happy-birthday.pdmx |  | 8 | 4 | 4 (50.0%) | 0/8 (0.0%) | 0/4 | 0/4 | 8 |
| song.pop.laura-shigihara-loonboon.pdmx |  | 8 | 0 | 8 (100.0%) | 8/8 (100.0%) | 0/0 | 8/8 | 8 |
| song.pop.misc-cartoons-mabinogi-saga-login-theme-an-old-story-from-grandma.pdmx |  | 9 | 9 | 0 (0.0%) | 3/9 (33.3%) | 3/9 | 0/0 | 9 |
| **all** |  | 287 | 119 | 168 (58.5%) | 177/287 (61.7%) | 23/119 (19.3%) | 154/168 (91.7%) | 287 |

Agreement as confidence, not proof (word-truth notes both methods answered, 287): the staff rule and piano_svsep agree and are right on 154, agree and are both wrong on 96; they disagree on 37, of which piano_svsep is right on 23.

Other-staff truth notes inside a bar the hand-word flag raises: 119 of 119.

**Generated two-staff items, hand = written staff by construction (97 items run, 0 errors).** piano_svsep's predicted staff equals the written staff on 5017 of 5601 notes (89.6%); items with at least one differing note: 50; unmatched model rows 14, notes it gave no prediction 0. The staff rule is right on every note by construction (100%). Flags raised by the current detector on these items: 0 items.

Largest disagreements (notes, item): 68 exercise.hanon.18.both; 66 exercise.hanon.10.both; 58 exercise.hanon.02.both; 40 exercise.clave.rumba-3-2.pulse; 35 exercise.scale.c-major.4oct.similar.both.1; 34 exercise.scale.a-flat-major.4oct.similar.both.1; 21 exercise.scale.d-harmonic-minor.3oct.similar.both.2; 14 exercise.arpeggio.a-flat-major.4oct.both; 13 exercise.scale.b-major.3oct.similar.both.2; 13 exercise.arpeggio.e-minor.4oct.both; 13 exercise.arpeggio.d-minor.4oct.both; 13 exercise.arpeggio.b-flat-minor.4oct.both

**Real two-staff items, every 20th by id (33 run, 1 errors): agreement only, no truth.** piano_svsep's staff equals the written staff on 27364 of 28294 notes (96.7%); 930 differing notes, of which 24 are in bars the current flags raise.

**Items the validation row names.**

| item | notes | svsep staff = written staff | differing notes | differing notes in flagged bars | flags (bars, 0-based) | differing bars (part:bar -> notes) |
| --- | --- | --- | --- | --- | --- | --- |
| song.classical.albeniz-asturias.pdmx | 2677 | 1861/2677 (69.5%) | 816 | 96 | {"cross_staff": 12} | 0:0->5, 0:1->5, 0:2->4, 0:3->5, 0:4->5, 0:5->5, 0:6->4, 0:7->6, 0:8->6, 0:9->6 ... |
| song.folk.amazing-grace-satb.pdmx | 127 | 112/127 (88.2%) | 15 | 15 | {"collision": 19} | 0:2->1, 0:3->2, 0:4->1, 0:5->1, 0:10->2, 0:13->1, 0:14->1, 0:15->4, 0:16->1, 0:17->1 |
| song.classical.abide-with-me-william-henry-monk.pdmx | 163 | 154/163 (94.5%) | 9 | 9 | {"collision": 16, "reach": [[0, 9]]} | 0:4->1, 0:6->1, 0:9->2, 0:10->3, 0:12->1, 0:13->1 |
| song.classical.grieg-album-leaf-op-47-no-2.pdmx | 1338 | 1251/1324 (94.5%) | 73 | 8 | {"hand_words": 8, "reach": 8} | 0:0->2, 0:1->1, 0:4->1, 0:13->3, 0:15->2, 0:16->2, 0:17->3, 0:18->1, 0:19->2, 0:20->2 ... |
| song.classical.bach-invention-no-8-in-f-major-bwv-779.pdmx | 598 | 581/598 (97.2%) | 17 | 0 | {} | 0:2->1, 0:4->7, 0:9->1, 0:10->1, 0:17->1, 0:26->2, 0:27->1, 0:31->2, 0:32->1 |
| exercise.clave.bossa.pulse | 52 | 13/52 (25.0%) | 39 | 0 | {} | 0:0->5, 0:1->4, 0:2->6, 0:3->4, 0:4->6, 0:5->4, 0:6->6, 0:7->4 |
| song.classical.bach-adagio-bwv-974-after-marcello.pdmx | 965 | 906/965 (93.9%) | 59 | 0 | {} | 0:1->6, 0:2->6, 0:3->2, 0:4->2, 0:5->1, 0:13->2, 0:14->2, 0:15->8, 0:17->10, 0:24->5 ... |
| excerpt.blues.wabash-blues.b1-4 | 19 | 19/19 (100.0%) | 0 | 0 | {} |  |
| song.classical.bach-fugue-in-g-minor-bwv-578-piano-transcription.pdmx | 1883 | 1746/1883 (92.7%) | 137 | 61 | {"cross_staff": [[0, 12], [0, 42], [0, 51]], "reach": 13} | 0:10->4, 0:11->1, 0:12->2, 0:13->2, 0:14->2, 0:15->3, 0:16->5, 0:17->1, 0:19->5, 0:20->5 ... |
| excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28 | 23 | 21/23 (91.3%) | 2 | 0 | {} | 0:2->2 |
| song.classical.bach-little-prelude-in-d-minor-bwv-935.pdmx | 449 | 447/449 (99.6%) | 2 | 2 | {"hand_words": [[0, 23], [0, 47]]} | 0:23->1, 0:47->1 |
| song.classical.chopin-etude-in-e-flat-minor-op-10-no-6.pdmx | 970 | 917/970 (94.5%) | 53 | 22 | {"cross_staff": 23, "hand_words": [[0, 26], [0, 47], [0, 48]]} | 0:7->1, 0:17->3, 0:19->2, 0:23->2, 0:24->4, 0:25->1, 0:26->7, 0:27->1, 0:28->4, 0:29->1 ... |
| song.classical.debussy-children-s-corner-doctor-gradus-ad-parnassum.pdmx | 1257 | 922/1230 (75.0%) | 308 | 41 | {"cross_staff": 9, "hand_words": [[0, 23], [0, 26]]} | 0:0->2, 0:1->2, 0:5->7, 0:6->4, 0:7->3, 0:8->4, 0:9->4, 0:10->6, 0:11->1, 0:12->7 ... |
| song.classical.debussy-clair-de-lune | 1603 | 1456/1603 (90.8%) | 147 | 94 | {"cross_staff": 22, "hand_words": [[0, 16]], "reach": [[0, 16], [0, 24], [0, 25], [0, 71]]} | 0:0->2, 0:4->2, 0:5->2, 0:6->1, 0:7->2, 0:8->2, 0:10->1, 0:14->6, 0:16->7, 0:19->4 ... |
| song.classical.grieg-album-leaf-op-47-no-2.pdmx | 1338 | 1251/1324 (94.5%) | 73 | 8 | {"hand_words": 8, "reach": 8} | 0:0->2, 0:1->1, 0:4->1, 0:13->3, 0:15->2, 0:16->2, 0:17->3, 0:18->1, 0:19->2, 0:20->2 ... |
| song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx | 1777 | 1615/1777 (90.9%) | 162 | 3 | {"hand_words": [[0, 86]]} | 0:1->7, 0:2->6, 0:3->8, 0:4->5, 0:5->7, 0:6->6, 0:7->8, 0:8->5, 0:9->5, 0:10->2 ... |
| song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx | 2369 | 2249/2304 (97.6%) | 55 | 20 | {"cross_staff": [[0, 60], [0, 64], [0, 68], [0, 113], [0, 117], [0, 121]], "hand_words": [[0, 60], [0, 64], [0, 68], [0, | 0:9->1, 0:10->1, 0:11->1, 0:22->1, 0:24->2, 0:55->3, 0:56->1, 0:58->3, 0:59->4, 0:60->2 ... |
| song.classical.nazareth-carioca-1913.pdmx | 1145 | 1128/1145 (98.5%) | 17 | 7 | {"hand_words": [[0, 32], [0, 33]]} | 0:4->1, 0:32->4, 0:33->3, 0:44->1, 0:48->4, 0:49->2, 0:50->1, 0:73->1 |
| song.classical.rimsky-flight-bumblebee | 1139 | 1116/1139 (98.0%) | 23 | 6 | {"hand_words": [[0, 49], [0, 50]]} | 0:6->1, 0:8->1, 0:10->1, 0:22->1, 0:30->3, 0:48->4, 0:49->6, 0:54->2, 0:58->1, 0:60->1 ... |
| song.folk.3-variations-on-happy-birthday.pdmx | 2554 | 2480/2554 (97.1%) | 74 | 7 | {"cross_staff": [[0, 40]], "hand_words": [[0, 162], [0, 163]], "reach": [[0, 7], [0, 179], [0, 185], [0, 215]]} | 0:0->2, 0:3->1, 0:10->1, 0:12->1, 0:36->2, 0:37->3, 0:38->3, 0:39->1, 0:40->2, 0:59->1 ... |
| song.pop.laura-shigihara-loonboon.pdmx | 516 | 497/516 (96.3%) | 19 | 4 | {"hand_words": [[0, 31], [0, 33], [0, 35], [0, 41], [0, 43]]} | 0:0->4, 0:13->1, 0:20->2, 0:24->2, 0:27->1, 0:28->1, 0:29->1, 0:30->1, 0:31->4, 0:34->1 ... |
| song.pop.misc-cartoons-mabinogi-saga-login-theme-an-old-story-from-grandma.pdmx | 1002 | 971/1002 (96.9%) | 31 | 8 | {"hand_words": [[0, 55]], "reach": [[0, 55], [0, 89]]} | 0:27->3, 0:55->3, 0:56->3, 0:57->2, 0:58->2, 0:59->5, 0:60->4, 0:61->1, 0:63->1, 0:88->2 ... |

**Runtime, piano_svsep (CPU, one process, model load 1.4 s once):** per item mean 0.20 s, median 0.06 s, max 2.58 s over 152 items (median 58 notes, max 5302).
**Runtime, the four flags of the current rule (re-implementation, after the file is read):** mean 1.2 ms, max 28 ms over 151 items (the file read and the staff rule are the project reader's: 0.55 s per piece mean in key.md section 5).

## 4. technique.five-finger and technique.position-shift: against the fingering-derived truth

Truth: the 326 hand-items of section 1 (3,484 truth segments, 3,158 truth shifts at W = 3). Strata: generated scale, generated arpeggio, generated chromatic, authored, pdmx. Sensitivity of the headline rows to W is at the end of this section.

**Per-passage class agreement (truth segment vs the method's frame holding most of its events).** Counts are truth segments (one hand-passage of one item = several segments).

| method | stratum | hand-items run | no result | truth segments | class agrees | agreement |
| --- | --- | --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | authored | 26 | 0 | 103 | 64 | 62.1% |
| current detector (frames.py, corrected rule) | generated arpeggio | 48 | 0 | 558 | 156 | 28.0% |
| current detector (frames.py, corrected rule) | generated chromatic | 24 | 0 | 344 | 42 | 12.2% |
| current detector (frames.py, corrected rule) | generated scale | 216 | 0 | 2268 | 2182 | 96.2% |
| current detector (frames.py, corrected rule) | pdmx | 12 | 0 | 211 | 127 | 60.2% |
| current detector (frames.py, corrected rule) | all | 326 | 0 | 3484 | 2571 | 73.8% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | authored | 26 | 0 | 103 | 64 | 62.1% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated arpeggio | 48 | 0 | 558 | 156 | 28.0% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated chromatic | 24 | 0 | 344 | 42 | 12.2% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated scale | 216 | 0 | 2268 | 2182 | 96.2% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | pdmx | 12 | 0 | 211 | 127 | 60.2% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | all | 326 | 0 | 3484 | 2571 | 73.8% |
| pianoplayer fingering, read through hand_def.py | authored | 26 | 0 | 103 | 30 | 29.1% |
| pianoplayer fingering, read through hand_def.py | generated arpeggio | 48 | 0 | 558 | 384 | 68.8% |
| pianoplayer fingering, read through hand_def.py | generated chromatic | 24 | 0 | 344 | 287 | 83.4% |
| pianoplayer fingering, read through hand_def.py | generated scale | 216 | 0 | 2268 | 1699 | 74.9% |
| pianoplayer fingering, read through hand_def.py | pdmx | 12 | 0 | 211 | 136 | 64.5% |
| pianoplayer fingering, read through hand_def.py | all | 326 | 0 | 3484 | 2536 | 72.8% |
| baseline: always says five-finger | authored |  |  | 103 | 84 | 81.6% |
| baseline: always says five-finger | generated arpeggio |  |  | 558 | 224 | 40.1% |
| baseline: always says five-finger | generated chromatic |  |  | 344 | 42 | 12.2% |
| baseline: always says five-finger | generated scale |  |  | 2268 | 2205 | 97.2% |
| baseline: always says five-finger | pdmx |  |  | 211 | 114 | 54.0% |
| baseline: always says five-finger | all |  |  | 3484 | 2669 | 76.6% |

**Truth class by method class (all strata; rows = truth class, columns = the method's class).**

current detector (frames.py, corrected rule):

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 2501 | 92 | 76 |
| extended | 621 | 64 | 112 |
| beyond | 3 | 9 | 6 |

current detector with fixes F1+F2+F3 (hand_fix.py):

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 2501 | 92 | 76 |
| extended | 621 | 64 | 112 |
| beyond | 3 | 9 | 6 |

pianoplayer fingering, read through hand_def.py:

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 1905 | 755 | 9 |
| extended | 152 | 629 | 16 |
| beyond | 0 | 16 | 2 |

**Position shifts at note resolution (+-1 event).** Truth boundary = start of a new fingering-derived segment; predicted boundary = start of a new frame / fingering segment of the method. Precision = matched / predicted; recall = matched / truth.

| method | stratum | truth shifts | predicted | matched | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | authored | 77 | 63 | 41 | 65.1% | 53.2% | 58.6% |
| current detector (frames.py, corrected rule) | generated arpeggio | 510 | 288 | 288 | 100.0% | 56.5% | 72.2% |
| current detector (frames.py, corrected rule) | generated chromatic | 320 | 128 | 128 | 100.0% | 40.0% | 57.1% |
| current detector (frames.py, corrected rule) | generated scale | 2052 | 1344 | 1001 | 74.5% | 48.8% | 59.0% |
| current detector (frames.py, corrected rule) | pdmx | 199 | 192 | 163 | 84.9% | 81.9% | 83.4% |
| current detector (frames.py, corrected rule) | all | 3158 | 2015 | 1621 | 80.4% | 51.3% | 62.7% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | authored | 77 | 63 | 41 | 65.1% | 53.2% | 58.6% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated arpeggio | 510 | 288 | 288 | 100.0% | 56.5% | 72.2% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated chromatic | 320 | 128 | 128 | 100.0% | 40.0% | 57.1% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated scale | 2052 | 1344 | 1001 | 74.5% | 48.8% | 59.0% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | pdmx | 199 | 192 | 163 | 84.9% | 81.9% | 83.4% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | all | 3158 | 2015 | 1621 | 80.4% | 51.3% | 62.7% |
| pianoplayer fingering, read through hand_def.py | authored | 77 | 85 | 55 | 64.7% | 71.4% | 67.9% |
| pianoplayer fingering, read through hand_def.py | generated arpeggio | 510 | 571 | 470 | 82.3% | 92.2% | 87.0% |
| pianoplayer fingering, read through hand_def.py | generated chromatic | 320 | 140 | 140 | 100.0% | 43.8% | 60.9% |
| pianoplayer fingering, read through hand_def.py | generated scale | 2052 | 1985 | 1797 | 90.5% | 87.6% | 89.0% |
| pianoplayer fingering, read through hand_def.py | pdmx | 199 | 243 | 186 | 76.5% | 93.5% | 84.2% |
| pianoplayer fingering, read through hand_def.py | all | 3158 | 3024 | 2648 | 87.6% | 83.9% | 85.7% |

Union of marks (every distinct boundary of the current detector or pianoplayer; the pilot's candidate-list form; a mark is true if a truth shift lies within one event, a truth shift is found if a mark lies within one event): 4154 marks, 3625 true: precision 87.3%; truth shifts found 2855 of 3158: recall 90.4%. Same any-within-one criterion for each alone: current detector precision 81.2%, recall 57.4%; pianoplayer precision 92.6%, recall 85.3%.

**Kind at matched boundaries (truth kind from the printed fingering > the method's kind).**

| method | crossing>crossing | crossing>shift | shift>crossing | shift>shift |
| --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | 1120 | 240 | 20 | 241 |
| current detector with fixes F1+F2+F3 (hand_fix.py) | 1059 | 301 | 3 | 258 |
| pianoplayer fingering, read through hand_def.py | 1927 | 332 | 16 | 373 |
| current detector with F1 only | 1059 | 301 | 4 | 257 |
| current detector with F2 only | 1120 | 240 | 11 | 250 |

Kind right at matched boundaries: current detector (frames.py, corrected rule) 1361 of 1621 (84.0%); current detector with fixes F1+F2+F3 (hand_fix.py) 1317 of 1621 (81.2%); pianoplayer fingering, read through hand_def.py 2300 of 2648 (86.9%); current detector with F1 only 1316 of 1621 (81.2%); current detector with F2 only 1370 of 1621 (84.5%).

**Agreement as confidence, not proof.** Predicted shifts by who predicts them (the current detector and pianoplayer within +-1 event of each other), and how many of each are truth shifts:

| predicted by | boundaries | of them truth shifts | share |
| --- | --- | --- | --- |
| both | 1721 | 1485 | 86.3% |
| only current | 294 | 151 | 51.4% |
| only pianoplayer | 1058 | 949 | 89.7% |

**pianoplayer's fingering against the printed one** (note-by-note digit equality, notes with a printed digit): 7325 of 12046 (60.8%). By stratum: authored 51.4%; generated arpeggio 51.6%; generated chromatic 58.0%; generated scale 63.3%; pdmx 61.7%.

**Runtime per item** (measured on this machine, several processes at once, so an upper bound; items = hand-passages of the truth set).

- current detector: reader + texture view 0.06 s mean, 0.05 s median, 0.30 s max over 178 items (the first item loaded paid a 6 s one-off import); frames + changes 1 ms mean per hand, 29 ms max over 326 hands.
- pianoplayer: 17.8 s mean, 17.0 s median, 42.5 s max over 118 truth items that this session timed (a Python process start is not included; several runs shared the CPU).

## 5. The named items of validation rows 3 and 4

**Families the page reads as one five-finger position per hand (truth by reading: the recipe declares the position; `five_finger` 48, `interval_reading` 16, `riff` 4 items).** An item counts when every hand present has exactly one frame / segment and its class is five-finger.

| family | items | current detector | current with fixes | pianoplayer fingering (hand_def.py) | pianoplayer: items with a hand-segment of class extended |
| --- | --- | --- | --- | --- | --- |
| five_finger | 48 | 48 of 48 | 48 of 48 | 45 of 48 (45 with one segment per hand of any class; 0 no output) | 4 |
| interval_reading | 16 | 16 of 16 | 16 of 16 | 0 of 16 (4 with one segment per hand of any class; 0 no output) | 12 |
| riff | 4 | 4 of 4 | 4 of 4 | 0 of 4 (1 with one segment per hand of any class; 0 no output) | 1 |

**The 10 `position_shift` drills.** Truth by reading (the page's own positive; `gap-plan.md` lists the drill as a move of the hand with no thumb-under): exactly one change of position, a `shift`, at the leap. The leap is located by script as the event after the largest melodic step of the hand (reading checked on the first drill: C D E F / G F E D / G A B C / D C B G, leap D4 to G4).

| drill | leap at event | current: changes (event, kind) | current with fixes F1+F2 | pianoplayer: segment starts (event, kind) |
| --- | --- | --- | --- | --- |
| a.left | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [12, 'shift'], [15, 'shift']] |
| a.right | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [15, 'shift']] |
| c.left | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [11, 'crossing'], [15, 'shift']] |
| c.right | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [15, 'shift']] |
| d.left | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[10, 'crossing'], [15, 'shift']] |
| d.right | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[9, 'crossing'], [15, 'shift']] |
| f.left | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [11, 'crossing'], [15, 'shift']] |
| f.right | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [15, 'shift']] |
| g.left | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[10, 'crossing'], [15, 'shift']] |
| g.right | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[9, 'crossing'], [15, 'shift']] |

Totals over 10 drills: current detector exactly one change 10, within +-1 event of the leap 10, kind `shift` anywhere 0, `shift` at the leap 0. With fixes: exactly one change 10, near the leap 10, `shift` at the leap 10 (F1 alone 10, F2 alone 0). pianoplayer (output for 10 drills): exactly one segment change 0, near the leap 8, `shift` at the leap 6.

**Block-chord steps.** Truth by reading: a change of frame between two chord events (3 or more notes each) is the hand moving, a `shift`; a thumb cannot pass under a block chord. Items: the 12 `exercise.cadence.*.root` items (root-position I-IV-V-I) and built parallel triads (C-E-G, D-F-A, E-G-B, F-A-C in one hand, one chord per quarter; built with `frames.built`, current detector and fixes only, there is no score to finger).

Root-position cadence items found: 12.

| method | chord-to-chord changes typed shift | typed crossing | other changes (a single note on one side) shift / crossing |
| --- | --- | --- | --- |
| current detector | 24 | 12 | 0 / 0 |
| current with fixes F1+F2 | 36 | 0 | 0 / 0 |
| current with F1 only | 36 | 0 | 0 / 0 |
| current with F2 only | 36 | 0 | 0 / 0 |
| pianoplayer fingering (hand_def.py) | 24 | 0 | 0 / 0 |

Built parallel triads ['C3 E3 G3', 'D3 F3 A3', 'E3 G3 B3', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4']: current: 6 frames, changes [(1, 'crossing'), (2, 'crossing'), (3, 'crossing'), (4, 'crossing'), (5, 'crossing')].
Built parallel triads ['C3 E3 G3', 'D3 F3 A3', 'E3 G3 B3', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4']: fixed: 6 frames, changes [(1, 'shift'), (2, 'shift'), (3, 'shift'), (4, 'shift'), (5, 'shift')].
Built parallel triads ['C3 E3 G3', 'D3 F3 A3', 'E3 G3 B3', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4']: F1 only: 6 frames, changes [(1, 'crossing'), (2, 'crossing'), (3, 'crossing'), (4, 'crossing'), (5, 'crossing')].
Built parallel triads ['C3 E3 G3', 'D3 F3 A3', 'E3 G3 B3', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4']: F2 only: 6 frames, changes [(1, 'shift'), (2, 'shift'), (3, 'shift'), (4, 'shift'), (5, 'shift')].

**Hanon (page: extended positions, a sixth in each hand).** Class of the segments per method over the 60 `hanon` items (no fingering truth; descriptive).

| method | five-finger frames | extended | beyond |
| --- | --- | --- | --- |
| current detector | 734 | 1406 | 6 |
| current with fixes | 734 | 1406 | 6 |
| pianoplayer fingering (hand_def.py) | 142 | 1284 | 4 |

**Chopin Op. 25 No. 6, right hand (row 3 (b): chromatic double thirds, 0-based bar 4, E-flat5+F-sharp5 to G5+B-flat5).**

- current: 157 frames in the hand; frames holding events of bar 4: [(0, 66, 'five-finger', 3), (67, 71, 'five-finger', 4), (72, 76, 'five-finger', 4), (77, 80, 'extended', 3)] (first event, last event, class, rise of the lowest note)
- fixed: 230 frames in the hand; frames holding events of bar 4: [(0, 65, 'beyond', 2), (66, 67, 'five-finger', 1), (68, 69, 'five-finger', 1), (70, 71, 'five-finger', 1), (72, 73, 'five-finger', 1), (74, 75, 'five-finger', 1), (76, 77, 'five-finger', 1), (78, 80, 'five-finger', -2)] (first event, last event, class, rise of the lowest note)

## 6. What the numbers say (each point names the table it reads)

**prereq.hand-assignment** (section 3; all measured).
- *The staff rule is exact about the written staff and wrong about the hand exactly where the notation says so.* On the 287 notes under a printed hand word (12 files) it names the playing hand right on 168 (58.5%); on the 119 notes where the word puts them on the other hand's staff it is right on 0, and the hand-word flag raises every one of those bars (287 of 287 truth notes in flagged bars; the flag fires on the word itself, so this is by design, not a discovery).
- *piano_svsep does not recover the playing hand.* On the same 287 notes it is right on 177 (61.7%): 154 of 168 where the word agrees with the staff, **23 of 119 (19.3%)** where it does not. It predicts the staff an engraver would write, as the survey says. The staff rule and piano_svsep agree on 250 of the 287 notes and are both wrong on 96 of those (agreement is not proof); where they disagree (37) piano_svsep is right on 23.
- *It disagrees with the written staff in many places that nothing flags.* Real two-staff sample (33 items, no truth): 930 differing notes of 28,294 (3.3%), only 24 of them in bars the current flags raise; Asturias 816 of 2,677 (30.5%), 96 in flagged bars. Generated two-staff items, where the hand is the staff by construction: it differs on 584 of 5,601 notes (10.4%) in 50 of 97 items, largest in Hanon 18, 10 and 2, a rumba clave and 4-octave scales. Without hand truth these cannot be called errors of either side; they are a list for an agent to look at, not a measurement of accuracy. UNKNOWN: hand accuracy on notes that cross without a word.
- *Cost.* The four flags: 1.2 ms per item after the file is read. piano_svsep: 0.20 s mean, 0.06 s median, 2.6 s max per item (152 items, CPU, 1.4 s model load once).

**technique.five-finger** (section 4 and 5).
- *Class agreement does not separate the methods and none beats saying "five-finger".* Against the fingering-derived class over 3,484 segments: current detector 73.8% (2,571), current with fixes the same (F1-F3 change no class on this truth), pianoplayer's fingering 72.8% (2,536), always "five-finger" 76.6% (2,669). Scales: 96.2%, 74.9% and 97.2% for the baseline; PDMX editor-fingered items (12 hand-items): 60.2%, 64.5% and 54.0%; authored 62.1%, 29.1%, 81.6%. At W = 2 the three are 82.6%, 79.2% and 87.3%; at W = 4, 73.6%, 69.2%, 74.7%.
- *They err in opposite directions.* Of the 797 truth segments of class extended the current detector says extended on 64 (8.0%) and pianoplayer's fingering on 629 (78.9%); of the 2,669 five-finger truth segments the current detector says extended on 92 (3.4%) and pianoplayer on 755 (28.3%).
- *On the families the page declares as one five-finger position per hand* (reading: the recipe declares it) the current detector gives one five-finger frame per hand on 68 of 68 items (`five_finger` 48, `interval_reading` 16, `riff` 4); pianoplayer's fingering gives that on 45 of 48, 0 of 16 and 0 of 4 (12 `interval_reading` items hold an extended segment, only 4 are one segment per hand): a fingering is free to move or stretch where the exercise declares one position.
- *Hanon (page: extended, a sixth).* 1,406 of the current detector's 2,146 frames are extended (65.5%), 734 five-finger, 6 beyond; pianoplayer's fingering 1,284 of 1,430 segments extended, 142 five-finger, 4 beyond.
- *F3* (double-note chromatic guard) changes no class on the 326 fingered hand-items. On Chopin Op. 25 No. 6, right hand, it removes the bug of row 3 (b) only in part: the hand's 157 frames become 230; the events of bar 4 now lie partly in frames of 2 or 3 events (class five-finger) but also in the opening frame of 66 events, which stays one frame (class five-finger before, beyond now). Not a clean fix; reading of the frame list in `frag_named.md`, not checked against a fingering.

**technique.position-shift** (section 4 and 5).
- *Against the fingering-derived shifts (3,158 boundaries, +-1 event), one-to-one matching:* current detector precision 80.4%, recall 51.3%; pianoplayer's fingering 87.6% and 83.9%. On scales the current rule's frames change where the frame fills (event 5 of a one-octave C major scale) and the standard fingering changes at the thumb (event 3): recall 48.8% (1,001 of 2,052). On PDMX editor-fingered hand-items it is 81.9% (163 of 199) against pianoplayer's 93.5%. Any-within-one criterion: the union of both methods' marks finds 2,855 of 3,158 truth shifts (90.4%) at precision 87.3% (4,154 marks), against 57.4% / 81.2% for the current detector alone and 85.3% / 92.6% for pianoplayer alone. At W = 2 the one-to-one rows are 81.4% / 45.8% and 88.9% / 85.8%; at W = 4, 80.5% / 54.1% and 88.4% / 81.3%.
- *Agreement ranks marks, it does not prove them.* A boundary both predict: 1,485 of 1,721 are truth shifts (86.3%); the current detector alone: 151 of 294 (51.4%); pianoplayer alone: 949 of 1,058 (89.7%). Both read the same notes, and the truth is a fingering read the same way pianoplayer's is, which favours pianoplayer.
- *Kind (shift versus crossing).* At boundaries matched to a truth boundary the kind agrees with the printed fingering's on 1,361 of 1,621 (84.0%) for the current detector, 1,317 (81.2%) with fixes F1+F2, and 2,300 of 2,648 (86.9%) for pianoplayer; F1 alone 1,316 (81.2%), F2 alone 1,370 (84.5%). So F1 costs on scales and F2 does not: with F1, crossings read as shifts rise from 240 to 301 (a leap at a turning point); F2 changes only chord-to-chord boundaries (shift read as crossing falls from 20 to 11).
- *The row's own failures.* The 10 `position_shift` drills: the current detector finds exactly one change within one event of the leap on 10 of 10 and types it `shift` on 0; with F1+F2 `shift` on 10 of 10 (F1 alone 10, F2 alone 0). pianoplayer's fingering puts a position start within one event of the leap on 8 of 10 and a `shift` on 6 of 10 and never exactly one change (a final segment start on all 10). Block-chord steps, 12 root-position cadence items: 36 chord-to-chord changes, the current detector types 24 `shift` and 12 `crossing`; F2 alone and F1 alone both give 36 `shift` (the root-position cadences leap); pianoplayer's fingering finds 24 changes, all `shift`; built parallel triads C-E-G to A-C-E (steps of a tone): 5 of 5 `crossing` now and with F1 alone, 5 of 5 `shift` with F2 (reading: a thumb cannot pass under a block chord).
- *Cost.* Reader + texture view 0.06 s mean per item, frames and changes 1 ms mean per hand (326 hands, 33 ms max), against pianoplayer 17.8 s mean (17.0 median, 42.5 s max) on the 118 truth items it was timed on, and 63.4 s mean (146.5 s max) on the 60 Hanon items, several processes sharing the CPU: upper bounds.

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

Exact fields (read from the notation, never overwritten by a classification): `written_staff`, `printed_hand_words`, `printed_fingering`, the notes of a chord, the observed note-span transition (where a run of notes no longer fits the frame rule). Inferred fields (each with its witnesses and a confidence): `hand` (including outside flagged bars: an unflagged staff assignment is the staff rule's inference, not a fact), `position` and its class, `crossing` (a plausible finger crossing) and `repositioning` (a move of the hand that fingering and ergonomics make unavoidable). An uncertain inferred value never removes an exact one, and an unresolved hand propagates as UNKNOWN into every hand-based answer downstream.

prereq.hand-assignment: code + agent (code returns the written staff, exact, and the hand as inferred by the staff rule, flagging bars from printed hand words, cross-staff writing, voice collisions and reach; the agent decides the hand in flagged bars, and a flagged bar left undecided stays UNKNOWN for the rows that read a hand; piano_svsep is not adopted, its disagreements with the written staff are a list to look at) — on 287 notes under printed hand words the staff rule names the hand right on 168 (58.5%) and on 0 of the 119 where the word names the other hand, all 119 in flagged bars, while piano_svsep is right on 23 of those 119 and is wrong together with the staff rule on 96 notes; hand accuracy on unmarked crossings is UNKNOWN (PIG not fetched).
technique.five-finger: code + agent (code answers from design evidence only: the recipe's declared position for generated families, the printed fingering where present, and the current frame rule's frames and class as the flag; pianoplayer's fingering is a hypothesis generator, not a certificate; on a real passage with neither, the agent decides the taught position or it is UNKNOWN; F3 is not adopted until a fingered chromatic double-note run is checked) — class agreement with the fingering-derived class is 73.8% for the current rule and 72.8% for pianoplayer against 76.6% for always saying five-finger, but the current rule gives one five-finger frame on 68 of 68 declared-position items where pianoplayer's fingering does on 45.
technique.position-shift: code + agent (code reports three separate things: the observed note-span transition, as the current rule's frame changes with F2 adopted so that a change between chords is a shift; a plausible finger crossing, read from printed fingering where present and otherwise only as pianoplayer's hypothesis; an unavoidable repositioning, which needs fingering or ergonomic evidence and is the agent's call; F1 is not adopted without a fingering check) — against fingering-derived shifts the current rule alone finds 57.4% (precision 81.2%) and the union with pianoplayer 90.4% (precision 87.3%), F2 turns the 36 chord-to-chord steps of the root-position cadences and 5 of 5 stepwise parallel triads into shifts and costs nothing on the fingered items (kind right 84.5% against 84.0%), while F1 types the 10 position_shift drills as shift (0 to 10 of 10) at a cost of 81.2% on the fingered items.
