# Area 1.B rules: pitch, range, keys and scales (Phase 2, 2026-10-08)

**What this is.** The Phase 2 rules (FABLE.md section 2, item 3) for the twelve characteristics of `characteristics-list.md` section 1.B, in the list's order. Every row of 1.B is marked code or code + agent in at least one pipeline, so every row has a full rule here; none is agent-only or a gap. Inputs fixed at 75862593. Nothing here is code: where a rule changes an existing rule (`technique.five-finger`, `technique.position-shift`, `key.minor-form`, `scale.collection`), the change is written here and the code follows it (CLAUDE.md: validated specifications govern implementation).

**How it was checked.** Scripts under this worktree's `build/b1/` (not committed), run on 2026-10-08 with the main checkout's `.venv` (music21 10.5.0, partitura 1.9.0, names checked by import) over the main checkout's catalogue (`app/public/content/catalog.json`, built 2026-10-07 15:41: 2,100 entries, of which 2,020 have a file: 1,204 generated, 544 PDMX, 272 other real scores: 162 Humdrum (`.nifc`), 64 MuseTrainer, 39 authored, 6 excerpts, 1 Mutopia), read in place, nothing written there. "Real" below means PDMX plus the other real scores.

| script | what it ran |
| --- | --- |
| `scan.py`, `scan2.py` | every file through `score.load` and `rules.texture.view`: ranges, black keys, hand-position frames, spellings, polytonal windows, tone rows |
| `keys.py`, `keys2.py` | six key witnesses on 1,282 items with a reference key (1,056 generated: the recipe's `keySig`; 226 real: the key named in the title, "in G minor") |
| `minor_coll.py`, `coll_runs.py` | `key.minor-form` and `scale.collection` (`rules/harmony.py`) on 374 generated items that declare their form or collection; collection names per scale run on every item |
| `kc.py`, `kc_report3.py` | key-change candidates on every item (window 4 bars, area 4 bars) |
| `inventory.py`, `ottava_check.py` | displayed pitch and staff position by music21; how both libraries read `<pitch>` under `<octave-shift>` |
| `synth.py`, `row_check.py`, `row_check2.py`, `row_inspect.py` | built test files (not real scores) for `key.polytonal` and `pitch.tone-row`; the row search over the catalogue and its false positives |
| `keys_report.py`, `misc.py`, `scan_report.py`, `scan2_report.py`, `verify_doc.py` | the summaries quoted below; every item id cited here checked against the catalogue |

**Labels.** Each claim is **[measured: script]**, **[sourced: key]** (the source table of `characteristics-list.md`, or a URL given here) or **[reading]** (judgement, unmeasured). Each threshold has a basis: **sourced**, **validated** (run on real items, result given), **sourced + validated**, or **neither** (operational, with the reason).

## 0. What every rule here shares

- **The reader.** `tools/classifier/score.py` `load`: partitura's note array. Its `pitch` is the MusicXML `<pitch>`, which is the sounding pitch (MusicXML 4.0, `octave-shift`: notes under 8va are encoded at their true pitch); tied notes are merged into one note. music21's import gives the same pitches, ties unmerged, and keeps `<octave-shift>` as `spanner.Ottava` with `transposing=False` [measured: `ottava_check.py`, 2 PDMX files with 38 and 24 shift elements: raw `<pitch>` and partitura agree after merging ties (one file exactly, the other within 3 of 1,016 notes); music21 equals raw `<pitch>` note for note]. Rows that read the keys pressed (range, black keys, positions, keys, scales) read this sounding pitch. Rows that read the page (`pitch.inventory`'s line or space) read the displayed pitch: sounding pitch minus the `Ottava` shift (`shiftDirection()`, `shiftMagnitude()`: checked).
- **The hand.** score.py's rule: staff 1 is the right hand, staff 2 the left; two one-staff parts are right then left; a lone staff takes the catalogue's declared hand. On generated items staff is hand by construction (0 of 1,187 two-staff files have a voice on both staves: noise scan, `characteristics-list.md` 1.M). On PDMX every per-hand value inherits `prereq.hand-assignment`'s residual: code flags the passages (a voice split inside a bar, a voice-number collision, hand words, a staff's chord beyond one hand's reach) and the agent settles the hand once per flagged passage. How often the hand rule matters, measured: the app's reader (`extractScoreModel.ts` `voiceHomeStaves`, a voice's home staff) and score.py (printed staff) give different per-hand ranges on 137 of 541 PDMX and 134 of 271 other real items, and on 0 of 1,176 generated [measured: `scan.py`, against each item's `measurement.span`]. The cause is the two hand rules (a reading of both readers' code), not a pitch error; the disagreeing items were not checked one by one.
- **Skipped staves.** One-line staves and percussion clefs (the 18 rhythm and 10 clave items, which write B4 on a one-line staff) are skipped by every row here [measured: `scan.py` finds exactly these 28 files, all generated].
- **The key** is `key.tonic-mode`'s answer, settled once per item and read by `technique.five-finger` (tonic to dominant), `key.minor-form`, `key.change`, `scale.collection`.
- **Reader faults found, not fixed** (no code edits here): `score.load` raises on 4 files: `song.classical.bach-invention-no-1-in-c-major-bwv-772.pdmx`, `song.classical.sakamoto-shining-boy-and-little-randy-ryuichi-sakamoto.pdmx` (IndexError), `song.classical.chopin-ballade-1` (a mask of part 0's notes applied to every part's notes, score.py line 109; reproduced on a built two-part file), `song.classical.puccini-o-mio-babbino-caro-for-solo-piano.pdmx` (partitura: unknown note type "512th") [measured: `scan.py`, `synth.py`]. Every row answers UNKNOWN ("the file could not be read") on them until the reader is fixed.
- **Output shape.** Every row reports value, provenance (`exact`, `two-witnesses`, `one-witness`, `inferred` with a confidence), the 0-based bars in `where`, the hand or staff, and UNKNOWN with its reason, as `score.Result` does.

---

## 1. hands.per-bar-range

**Marking.** Generated: code. PDMX: code + agent (the hand).

**Input.** `score.load` notes (sounding MIDI pitch, hand, bar); grace notes included (a grace note is a key pressed).

**Rule.**
1. Per hand: `lo` = min pitch, `hi` = max pitch, `span` = hi - lo, over the item.
2. Per hand per bar: `lo`, `hi`, `span` (bars where the hand plays).
3. Item compass: min and max over all notes; `compass` = max - min.
4. Register shares over all notes and per hand, the jSymbolic boundaries: **low** MIDI <= 54 (F#3 and below), **middle** 55 to 72 (G3 to C5), **high** >= 73 (C#5 and above). Second witness: music21 `ImportanceOfBassRegisterFeature`, `ImportanceOfMiddleRegisterFeature`, `ImportanceOfHighRegisterFeature` (their `process` methods hold these exact bounds: checked by reading the source in `.venv`) and `RangeFeature` for the compass; `analysis.discrete.Ambitus().getPitchSpan` as a third.
5. Notes outside the 88 keys: MIDI < 21 (below A0) or > 108 (above C8), each with bar and hand. Such a note cannot be played on a piano; the item is flagged for `integrity` review, never taught as written.

| threshold | value | basis |
| --- | --- | --- |
| register bounds | low <= 54, middle 55-72, high >= 73 | sourced: JS P-9 to P-11 (McKay, jSymbolic 2.2), as implemented in music21 10.5 |
| the keyboard | A0 (21) to C8 (108) | sourced: the standard 88-key piano, https://en.wikipedia.org/wiki/Piano_key_frequencies (stand-in) |

**Output.** `{hands: {R: {lo, hi, span, bars: [[bar, lo, hi, span]]}, L: ...}, compass: [lo, hi, n], registers: {all: [low, middle, high], R: ..., L: ...}, outside88: [[bar, hand, midi]]}`; provenance `exact` on generated items; on PDMX `exact` for the compass and registers over all notes (no hand needed), `one-witness` per hand where `prereq.hand-assignment` flags a passage, until the agent settles it. **UNKNOWN**: no notes; the file could not be read; per hand only, when one staff holds both hands (3 items, `texture.md`) (the compass stays exact).

**Validation.** [measured: `scan.py`] Per-hand `lo`/`hi` agree with the app's stored `span` on 1,176 of 1,176 generated items; the 137 PDMX disagreements are attributed to the hand rule (section 0). Notes outside the keyboard: 2 items, `song.beautiful.mariage-damour.alt2` (2 notes, the highest MIDI 110 = D8) and `song.classical.bach-toccata-fugue-bwv565` (1 note, MIDI 20 = G#0); both are real findings of a score asking for a key no piano has. Compass, 10th / 50th / 90th percentile in semitones: generated 12 / 34 / 48, PDMX 14 / 43 / 64, other real 25 / 57 / 72.

**Not set here.** "Wide compass" (AB-080) is an ability threshold over this row's output; the percentiles above are its evidence.

**Examples.** Positives: `song.classical.albeniz-asturias.pdmx` (compass MIDI 31-103, all three registers), `song.blues.handful-of-keys` (29-105); outside the keyboard: `song.beautiful.mariage-damour.alt2`, `song.classical.bach-toccata-fugue-bwv565`. Near-misses: `exercise.arpeggio.c-major.4oct.both` (reaches C8 = 108 exactly: inside the keyboard, not flagged), `exercise.five-finger.c-major.right` (span 7, middle register only).

## 2. pitch.black-key-share

**Marking.** Generated: code. PDMX: code (defined per staff, as printed).

**Input.** `score.load` notes per staff (score.py's hand is the staff on two-staff parts), ties merged, grace notes included.

**Rule.** Per staff and over the item: `share` = notes whose pitch class is in {1, 3, 6, 8, 10} (C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb) divided by notes. A note is a struck key (an onset); a tied continuation is not counted again. Also `all_black` (share = 1) and `none` (share = 0), and the black keys used, grouped as the two-key group {1, 3} and the three-key group {6, 8, 10}, which AB-005 (a) reads with `pitch.inventory`.

| threshold | value | basis |
| --- | --- | --- |
| black pitch classes | 1, 3, 6, 8, 10 | sourced: the keyboard's layout (any piano method; DIFF `BLACK_KEYS` in `tools/content/difficulty.py` holds the same set) |
| counting unit | struck notes, ties merged | neither: one unit chosen so that a held black key is not counted twice (DIFF counts music21 notes, so a tie counts twice; the two definitions differ only on tied notes) |

**Output.** `{staves: {1: {share, n, groups: {two: k, three: k}}, 2: ...}, all: share, all_black: bool}`, provenance `exact`. **UNKNOWN**: no notes; unreadable file.

**Validation.** [measured: `scan.py`] Per staff: generated 47 of 1,946 staves are all black, 535 all white; PDMX 0 of 968 all black, 90 all white. Items all black in every staff: 10, all generated (the G-flat major and E-flat minor arpeggios, inversions and seventh-chord figures, and two E-flat minor-blues boogies). No pre-staff black-key piece is in the catalogue, so AB-005 (a)'s "all black" stage has no item yet.

**Examples.** Positives: `exercise.arpeggio.g-flat-major.2oct.both` (share 1 in both staves), `exercise.inversions.e-flat-minor.both` (1). Near-misses: `exercise.five-finger.g-flat-major.right` (0.778: C-flat is a white key), `exercise.open-voicing.e-flat.sus4` (0.938).

## 3. technique.five-finger

**Marking.** Generated: code. PDMX: code + agent (the hand; the tonic-to-dominant test needs the key).

**Input.** `rules.texture.view`: per hand, onset events (notes struck together), grace notes left out, with bar, onset and end.

**Rule** (replaces the whole-item test of `texture.md` § technique.five-finger; the frames are shared with `technique.position-shift`):
1. **Frames.** Per hand, in onset order, greedy: an event joins the current frame while the frame's span stays at most **9 semitones** and it holds at most **5 distinct pitches**, or while the event repeats pitches already in the frame. An event wider than 9 semitones (an octave, a wide chord) opens a frame of its own, and the same shape again stays in it. A return to the frame before, when the two together span at most an octave **and hold at most 5 distinct pitches**, merges the two into one frame (a broken octave or tremolo alternates; it does not travel). Greedy gives the fewest frames, as in `technique.positions`.
2. **Class per frame.** **five-finger**: span <= 7 (a C-to-G chromatic run spans 7 but has 8 pitches, so it never forms one frame); **extended**: span 8 or 9 (a sixth); **beyond**: an event wider than 9 standing as its own frame.
3. **Item-level presence** ("the item stays in one position"): every hand has one frame and it is five-finger. This keeps the app's `beyondPosition` (`detect.ts`, POSITION_SPAN 7) as its span test and adds the five-pitch test.
4. **Named position.** Each five-finger frame is named by its lowest pitch with octave ("C4 position" = C4 to G4 reachable; "G3 position"); **Middle C position** when the right hand's frame starts on C4 and the left hand's frame ends on C4 at overlapping times (both thumbs on middle C).
5. **Tonic to dominant.** A frame "runs tonic to dominant" when all its pitches lie in [T, T + 7] for a pitch T whose class is the key's tonic (`key.tonic-mode`). No key gives "no key".

| threshold | value | basis |
| --- | --- | --- |
| five-finger span | <= 7 semitones (a fifth) | sourced + validated: ABRSM-SR ("in 5-finger position (tonic to dominant)", Initial; "any 5-finger position", Grade 1; "outside 5-finger position", Grade 3); `detect.ts` POSITION_SPAN; validated below |
| extended span | 8-9 semitones (a sixth) | sourced: abilities.md AB-011 (Alfred Adult All-in-One p.83 "Expanding the 5-Finger Position", https://content.alfred.com/catpages/00-5756.pdf; Faber Level 2B, a 6th) |
| distinct pitches in one frame | <= 5 | validated: not published as a number (five fingers press at most five keys without moving, a reading); on the generated families (below) it keeps every five-finger and position-shift item right and makes every scale shift |
| alternation merge | within an octave and <= 5 pitches | validated: without the five-pitch limit, a one-octave scale up and down merged into one frame and counted no shift (144 of 252 scale items, existing rule); with it, every scale shifts |
| Middle C position | RH from C4, LH to C4 | sourced: abilities.md AB-009 (Alfred Adult All-in-One p.72 "Middle C Position. THUMBS ON C!") |

**Output.** `{present, hands: {R: {frames: [[first_bar, last_bar, lo, hi, class, name, tonic_to_dominant]], classes: {five-finger: n, extended: n, beyond: n}}, L: ...}}`, `where` the bars of each frame start; provenance `exact` for frames and classes, `inferred` (the key's confidence) for the tonic-to-dominant test. **UNKNOWN**: the shared `view` reasons (no notes, one staff holding both hands); "no key" for the tonic test only.

**Pipelines.** Generated: the recipe declares a position only in `five_finger` and `interval_reading`: a cross-check, never the verification. The tonic test reads the file's key and answers "no key" for arpeggio7, broken7, chromatic and keyless families (`characteristics-list.md` 1.M). PDMX: per hand, inheriting the hand residual; the tonic test inherits `key.tonic-mode`'s residual.

**Validation.** [measured: `scan2.py`] Generated families: `five_finger` 48 of 48 one five-finger frame per hand (72 hand frames); `interval_reading` 16 of 16; `riff` 4 of 4; `position_shift` 10 of 10 two five-finger frames. Named positions read: `exercise.five-finger.c-major.right` C4-G4, `exercise.five-finger.g-major.left` G3-D4, `exercise.interval-reading.c-position.left.01` C3-G3. Items in one five-finger frame per hand: 123 generated, 5 PDMX, 16 other real. Extended frames inside an otherwise one-frame item: 16 items (ii-V-I shells, montuno, son groove). The `exercise.hanon.*` patterns form extended frames (No. 1's C-E-F-G-A spans a sixth), 1,406 of their 2,146 frames.

**Examples.** Positives: `exercise.five-finger.c-major.right` (C4 position, tonic to dominant in C), `exercise.interval-reading.c-position.left.01` (C3 position, left hand). Near-misses: `exercise.position-shift.c.right` (two five-finger positions, C4 then G4: not one position), `exercise.hanon.01.both` (a sixth in each hand: extended, not five-finger).

## 4. technique.position-shift

**Marking.** Generated: code. PDMX: code + agent (the hand).

**Input.** The frames of `technique.five-finger` (section 3).

**Rule** (replaces `texture.md` § technique.position-shift's seven-semitone frames).
1. A **shift** is each new frame after the first, per hand.
2. **Size**: semitones between the centres of the two frames (`(lo + hi) / 2`), as the existing rule.
3. **Time allowed**, per shift: `gap` = onset of the new frame's first event minus the end of the old frame's last event, in quarters (0 when the hand moves legato); `last_value` = the notated duration of the old frame's last event; both also in seconds at the item's tempo (`mark.tempo-text`, else the catalogue's `tempoBpm`, else UNKNOWN in seconds). The hand moves during the gap, or, legato, during the last note.
4. What changed from the existing rule, and why: a sixth reached by extension is not a shift (AB-011: "without moving it"); a five-pitch limit makes a one-octave scale up and down count its thumb crossings; the alternation merge keeps a tremolo or broken octave from counting as travel.

| threshold | value | basis |
| --- | --- | --- |
| frame | <= 9 semitones and <= 5 pitches | reused: section 3 (counted there) |
| octave alternation | <= 12 semitones | reused: section 3 (counted there; texture.md's operational octave, kept) |

**Output.** `{present, shifts: {R: n, L: n}, largest, at: [[hand, bar, beat, size, gap_q, last_value_q, gap_s, last_value_s]]}`, `where` the bars where a new frame starts; provenance `exact` (`inferred` for seconds where the tempo is not printed). **UNKNOWN**: as section 3. Fingering is not read: a shift is a change of frame by this rule, a lower bound on the hand's moves; a player's substitution or crossing instead is `technique.thumb-under` and `technique.fingering-demand`.

**Validation.** [measured: `scan2.py`, against the existing rule's `technique.positions`] `five_finger` 0 shifts in 48 of 48 (old: 48); `position_shift` exactly 1 in 10 of 10 (old: 10), at bar 3 (0-based 2), gap 0, last value 1 quarter; `scale` items: every one now shifts (2 shifts per hand for one octave up and down, 72 items with 2 and 72 with 4), where the old rule found none in 144 of 252; `arpeggio` unchanged. Items with any shift: generated 988 of 1,176 (old 793), PDMX 533 of 540 (old 503). The count is a place and a size, not a present/absent test, as the existing rule says. At 91% (PDMX), 93% (other real) and 98% (generated) of shifts the gap is 0: the time allowed is the last note's value, which is why both are reported.

**Examples.** Positives: `exercise.position-shift.c.right` (one shift, C4 to G4 position, 7 semitones), `exercise.scale.c-major.1oct.similar.right.2` (thumb crossings counted as shifts). Near-misses: `exercise.five-finger.c-major.right` (no shift), `exercise.tremolo.c.left` (each octave tremolo stays one frame, class beyond; its 3 shifts are the moves from one octave to the next, not the alternation).

## 5. key.tonic-mode

**Marking.** Generated: code. PDMX: code + agent (witnesses disagree; modal or ambiguous endings).

**Input.** `score.load` notes; the chord timeline of `harmony.analyse` (`rules/harmony.md`); music21 `converter.parse` of the same file.

**Rule.**
1. **Keyless items.** Generated: the families with no key (rhythm, clave, syncopation and two of the three meter items print no `<key>`; all 60 arpeggio7, 36 broken7 and 16 chromatic items print 0 fifths over chord-root or chromatic material [measured: catalogue `notation.keys`]) answer "no key", from the family list (`characteristics-list.md` 1.M); the recipe's `key` letter is never read as the key. Real items: a file with no `<key>` is sent to the agent with the witnesses' answers (none in the catalogue: the 32 files without `<key>` are all generated [measured: catalogue `notation.keys`]).
2. **The primary witness** is the existing key helper (`rules/harmony.py` `infer_key`; `harmony.md` § the key): candidates are the signature's major and its relative minor (the signature in force at the first note); votes from the ending (the final chord's root and quality, else the lowest note of the last onset; weight 2, or 1 when that is a lone right-hand note in a two-hand piece), the opening (the first chord or lowest first note; weight 1) and partitura's Krumhansl-Schmuckler `estimate_key` (weight 1). A candidate with at least 2 votes and more than the other wins; one uncontradicted vote gives 0.6; the ending and K-S agreeing outside the signature give 0.7; else UNKNOWN with the votes.
3. **The second witness** is music21 `Stream.analyze('key')` (Aarden-Essen in 10.5). Equal tonic and mode: provenance `two-witnesses`. Different: `one-witness`, both answers kept, and the item goes to the agent.
4. **Flags for the agent** (each reported with the votes): (a) the helper is UNKNOWN; (b) the two witnesses disagree; (c) the opening and ending votes are the two keys of the signature (a piece that opens in one key and closes in its relative: Chopin's Scherzo No. 2 opens in B-flat minor and ends in D-flat major); (d) a modal candidate: the ending's tonic is in the signature's scale but is neither candidate (Dorian, Mixolydian), reported with `scale.collection`; (e) blues form: a major signature over a blues (`form.twelve-bar`), where the mode set major/minor has no value: the tonic is reported, the mode as "blues".
5. **Confidence** is the measured agreement of the helper's band (table below), not the band's own number.

| threshold | value | basis |
| --- | --- | --- |
| candidates | the signature's major and relative minor | validated: the reference key is one of the two in 1,282 of 1,282 reference items |
| votes and weights | ending 2 (1 for a lone RH note), opening 1, K-S 1; win at >= 2 and more than the other | validated (below); weights from `harmony.md`, unchanged |
| second witness | music21 Aarden-Essen | validated: chosen over K-S (partitura or music21), Temperley-Kostka-Payne and Bellman-Budge by agreement on real items (below) |

**Validation.** [measured: `keys.py`, `keys_report.py`, `keys2.py`] Reference: generated items, the recipe's declared key (1,056 items from key-bearing families); real items, the key the title names (226: 90 PDMX, 136 other). Tonic and mode right / answered:

| witness | generated | real |
| --- | --- | --- |
| helper (primary) | 1,027 / 1,038 (18 UNKNOWN) | 213 / 221 (5 UNKNOWN) |
| music21 Aarden-Essen | 627 / 1,056 | 199 / 226 |
| music21 Temperley-Kostka-Payne | 923 / 1,056 | 204 / 226 |
| music21 Bellman-Budge | 850 / 1,056 | 200 / 226 |
| partitura K-S (= music21 K-S here) | 909 / 1,056 | 178 / 226 |
| helper and Aarden-Essen agree | 616 / 621 | 195 / 201 |

Aarden-Essen is weak on short generated exercises (627 of 1,056), so on generated items its disagreement is not sent to the agent: the helper is right on 411 of the 417 items where Aarden-Essen disagrees. On real items it is the strongest independent witness among those agreeing with the helper. Helper bands, right / answered (real; generated): 0.95: 104 / 106; 669 / 669. 0.9: 69 / 73; 143 / 150. 0.8: 10 / 10; 122 / 122. 0.7: 15 / 17; 64 / 68. 0.6: 15 / 15; 29 / 29.

What the wrong answers are [measured, then read]: of the 8 real misses, 4 are the catalogue's titles, not the key: `song.classical.chopin-etude-op10-11.nifc` is titled "in C minor" (Op. 10 No. 11 is in E-flat major; the file's signature is 3 flats and its last bass E-flat), `...chopin-mazurka-op67-4.nifc` and `...op68-2.nifc` "in C major" (both A minor works; signature 0, last bass A), `...op68-4.nifc` "in A-flat major" (an F minor work) [the published keys are a reading, from the standard catalogue of Chopin's works]. These are catalogue errors that would teach a wrong key and are reported for correction. The other 4: `song.classical.chopin-scherzo-2.nifc` (opens in B-flat minor, ends in D-flat major: flag c), `song.pop.minuet-in-g-minor-bach-piano.pdmx` (a 16-bar excerpt that ends in B-flat major; Aarden-Essen says G minor: flag b), `song.classical.chopin-mazurka-op7-5.nifc` (the helper's G major from the ending and K-S outside the signature, Aarden-Essen C major: flag b), and `song.classical.chopin-sonata-2-2.nifc`, which no flag catches: it ends in G-flat major, its opening gives no vote, and both witnesses say G-flat major against the title's E-flat minor. So on real items, title errors aside, one wrong answer of 221 passes unflagged as two-witness. Generated misses: 11, all flagged: `exercise.hanon.13.*` (3) and `exercise.hanon.20.*` (2) end on A (`hanon.13.right`'s last note is A3), the four `exercise.turnaround.*.iii-vi-ii-v` end on V, and two left-hand broken-chord items in A and D minor end on the relative major chord. Each is a disagreement between the recipe and the file, to be resolved as a generator or reader defect (1.M, S3); the rule does not resolve it.

**Output.** `{tonic, mode, signature_fifths, votes: {ending, opening, ks}, second: {ae: [tonic, mode, r]}, flags: [...]}`, provenance `two-witnesses` / `one-witness` / `inferred`, confidence = the band's measured agreement. **UNKNOWN**: helper unresolved (with votes); no notes; unreadable file.

**Residual to the agent** (PDMX, and generated only for flags c and d): the flagged cases, with the votes, both witnesses' answers, the title, and the first and last four bars; the question: the item's key as a learner would be told it (tonic and mode), or "modal" with its tonic, or UNKNOWN.

**Examples.** Positives: `song.classical.bach-invention-no-11-in-g-minor-bwv-782.pdmx` (G minor, both witnesses), `exercise.scale.a-harmonic-minor.1oct.similar.both.2` (A minor, helper 0.95). Near-misses: `song.classical.chopin-scherzo-2.nifc` (opens B-flat minor, ends D-flat major: flag c), `song.pop.minuet-in-g-minor-bach-piano.pdmx` (helper B-flat major against Aarden-Essen G minor: flag b).

## 6. key.minor-form

**Marking.** Generated: code. PDMX: code + agent (needs the key).

**Input.** `score.load` notes per hand in onset order (chord notes low to high); the key from `key.tonic-mode`.

**Rule** (`harmony.md` § key.minor-form, kept, with a per-run reading added). In a minor key, degrees by semitones from the tonic: 8 lowered sixth, 9 raised sixth, 10 lowered seventh, 11 raised seventh.
1. **Note level** (existing): a raised sixth followed by the raised seventh, or by it from the fifth, is **melodic**; a raised seventh not preceded by the raised sixth is **harmonic**; a lowered seventh is **natural**. Counts of each degree are reported.
2. **Run level** (new, what a learner meets as "the scale"): each scale run (`technique.scale-run`'s runs of at least 6 notes in one direction) in a minor key area is classified by the sixth and seventh it uses in its direction: ascending 9 and 11 = melodic ascending; descending 10 and 8 = natural (also the melodic descent); 8 and 11 together (the augmented second) = harmonic; ascending and descending both 9 and 11 = melodic minor the same both ways (the jazz melodic minor, which AB-083 names).
3. The note-level forms are reported as a profile; the run-level form is the answer to "which minor scale is played". Note level finds all three forms in most real minor pieces (below), because the lowered seventh also serves the descending melodic minor and the relative major.

| threshold | value | basis |
| --- | --- | --- |
| the three forms | natural, harmonic (raised 7th), melodic (raised 6th and 7th ascending) | sourced + validated: OMT-scales (https://openmusictheory.github.io/scales.html: natural minor W-H-W-W-H-W-W; harmonic minor raises the seventh; melodic minor raises le to la ascending); Kostka and Payne ch. 1 (KP, not read) |
| scale run | >= 6 notes, one direction | neither: `texture.md` § technique.scale-run (RUN_NOTES = 6: "longer than one hand position holds", operational there), reused |

**Output.** `{mode, forms: [...], counts: {b6, 6, b7, 7}, runs: [[hand, bar, direction, form]]}`; a major key gives `forms: []`; provenance `inferred` with the key's confidence. **UNKNOWN**: the key is UNKNOWN or "no key".

**Validation.** [measured: `minor_coll.py`, `misc.py`] Note level on the generated minor scales: harmonic 72 of 72, melodic 48 of 48 (as ["melodic", "natural"]), natural 24 of 24. On the 94 real items whose title names a minor key: all three forms in 67, harmonic and natural in 21, "major" in 4 (the key helper's answer for the four title or ending cases of section 5), UNKNOWN in 2. The run level is not yet run on real items (not-done).

**Examples.** Positives: `exercise.scale.a-harmonic-minor.1oct.similar.both.2` (harmonic), `exercise.scale.a-melodic-minor.1oct.similar.right.2` (melodic). Near-misses: `exercise.scale.a-natural-minor.1oct.similar.both.2` (natural only: no raised degree), `exercise.scale.c-major.1oct.similar.both.2` (major key: no form).

## 7. key.change

**Marking.** Generated: code (printed changes exact; the recipe declares any modulation). PDMX: code + agent (modulation against tonicisation; windowed key-finding).

**Input.** Signature changes: partitura `KeySignature` objects with their times (`rules/harmony.py` `marks`), or music21 `key.KeySignature` with offsets. Key areas: `score.load` notes; the chord timeline and bass line of `harmony.analyse`; the home key from `key.tonic-mode`.

**Rule.**
1. **Printed change** (exact): each `<key>` after the first whose fifths differ, with bar, beat, old and new fifths, and staff. Its kind is "printed signature change"; its relation is computed from the keys `key.tonic-mode`'s method gives before and after it (a signature change is not always a modulation: a trio's new signature, a cancellation, or an enharmonic respelling such as C-sharp minor to D-flat major).
2. **Local key per bar**: partitura `estimate_key` (Krumhansl-Schmuckler) on the notes of bars b-1 to b+2 (a 4-bar window), when they hold at least 8 notes; else no local key.
3. **Key area**: a run of at least 4 consecutive bars with one local key different from the home key.
4. **Cadence in the new key** (what makes a key area a modulation, OMT-Modulation): either (a) in the chord timeline, a major chord on the local dominant followed by the local tonic triad (major or minor as the local mode) on a downbeat, within the area or one bar either side; or (b) when the chord timeline is UNKNOWN (counterpoint: most Bach inventions), the bass cadence: the lowest note at a downbeat is the local tonic, the bass onset before it is the local dominant, and the local leading tone sounds in the bar before.
5. **Kinds**: **modulation** = a key area with a cadence (4a or 4b); **key area without a cadence** = a candidate for the agent (a tonicisation, a dominant prolongation, or a modulation whose cadence the code missed); **tonicisation** = an applied chord (`harmony.applied`) outside any key area.
6. **Relation** of the new key to the home key: dominant (+7), subdominant (+5), relative (major to the minor a sixth up, minor to the major a third up), parallel (same tonic), other.

| threshold | value | basis |
| --- | --- | --- |
| modulation needs a cadence in the new key | yes | sourced: OMT-Modulation (https://openmusictheory.github.io/Modulation.html: "modulation does incorporate at least one cadence (PAC, IAC, or HC) in a new key"; tonicisation does not) |
| relations named | dominant, subdominant, relative, parallel, other | sourced: TCL-SR (Grade 5 "majors modulate to dominant only, minors to dominant or relative major"; Grade 6 adds the relative minor; Grade 7 "any related key"); ABRSM aural test D (dominant, subdominant, relative minor/major) |
| window | 4 bars, at least 8 notes | validated: in part (below); not tuned |
| key area length | >= 4 bars | validated: in part (below); not tuned |

**Validation.** [measured: `kc.py`, `kc_report3.py`] False positives: 0 of 157 generated items of 8 bars or more have a confirmed modulation (30 have an unconfirmed key area). Recall on the Bach Inventions, every one of which modulates to the dominant or the relative key (a reading of the scores' standard analysis): 13 of 14 readable inventions have a key area in the expected relation (No. 5's is F minor, not B-flat major); 7 of 14 have it confirmed by a cadence (No. 4, 6, 8, 11, 13, 15 by the bass cadence 4b, No. 14 by chords 4a; No. 11 to D minor at bar 7); the other 7 inventions' areas are left to the agent. Folk items: 12 of 96 have a confirmed area. Some are genuine: `song.folk.bella-ciao` prints new signatures at bars 11 and 21 and its areas (F minor, F-sharp minor) are confirmed by cadences at bars 19 and 29. Others are likely tonicisations: `song.folk.hallelujah-easy.pdmx` has a confirmed A minor area in C major (the relative, vi; whether it modulates is a reading). That is the modulation-against-tonicisation question left to the agent. Printed changes: 59 PDMX and 101 other real items, 0 generated. Items under 8 bars (924 generated) are not searched for key areas: "too short to establish a new key" (UNKNOWN for areas; printed changes still exact).

**Output.** `{printed: [[bar, beat, old_fifths, new_fifths]], areas: [{bars, key, relation, kind, cadence: {bar, by: "chords" | "bass"} | null}], tonicisations: [[bar, numeral]]}`; provenance `exact` for printed changes, `inferred` for areas (confidence not yet measured: not-done). **UNKNOWN**: home key UNKNOWN; under 8 bars for areas.

**Residual to the agent** (PDMX): every key area without a cadence and every confirmed area in an item whose title, form or style says otherwise; the agent receives the area's bars, local key, cadence evidence and the applied chords inside it, and answers modulation, tonicisation or prolonged dominant, with the relation.

**Examples.** Positives: `song.classical.bach-invention-no-14-in-b-flat-major-bwv-785.pdmx` (to F major, cadence by chords at bar 9), `song.pop.clementi-opus-36-no-1-first-movement.pdmx` (to G major, cadences at bars 12 and 27). Near-misses: `song.classical.beethoven-ode-to-joy.easy` (a D major area on the dominant, no cadence: not a modulation), `song.classical.beethoven-fur-elise` (E major areas are the dominant prolonged, unconfirmed; only the C major area at bar 33 is confirmed).

## 8. scale.collection

**Marking.** Generated: code. PDMX: code + agent (the tonic, and so the mode, of short or ambiguous passages).

**Input.** `score.load` notes; per-hand scale runs from `rules/technique.py` `scale_runs`; the key from `key.tonic-mode`; the local key from `key.change`; the chord in force from `harmony.analyse`.

**Rule.**
1. **Item and hand level** (`harmony.md` § scale.collection, kept): the pitch-class set of the item and of each hand, named when it **equals** a named collection (equality, not containment); "(no scale run)" when the hand never plays four different notes in one direction by steps of 1 to 3 semitones.
2. **The named collections** (extended here), each with its intervals from its root:

| collection | pitch classes | named by | source |
| --- | --- | --- | --- |
| diatonic: ionian, dorian, phrygian, lydian, mixolydian, aeolian, locrian | 0 2 4 5 7 9 11 rotated | the tonic's degree in the set | OMT-scales2 (https://openmusictheory.github.io/scales2.html: "Ionian treats C as tonic, Dorian treats D as tonic, ..."); music21 `DorianScale` ... `LocrianScale` |
| harmonic minor; Phrygian dominant (its 5th mode) | 0 2 3 5 7 8 11 | tonic = root: harmonic minor; tonic = root + 7: Phrygian dominant | OMT-scales (https://openmusictheory.github.io/scales.html: the seventh raised "by a semitone"); Phrygian dominant: https://en.wikipedia.org/wiki/Phrygian_dominant_scale (stand-in) |
| melodic minor (ascending, jazz); Lydian dominant (4th mode); altered (7th mode) | 0 2 3 5 7 9 11 | tonic = root, root + 5, root + 11 | LEV ch. 9 (melodic-minor harmony; the contents page only was read) |
| melodic minor, both directions | 0 2 3 5 7 8 9 10 11 | item or hand level only | OMT-scales (different pitches ascending and descending) |
| major pentatonic; minor pentatonic | 0 2 4 7 9 | tonic = root, root + 9 | OMT-scales2 (major pentatonic as the major scale without degrees 4 and 7); the minor form as its rotation on the sixth is a reading, named as in the ABRSM Jazz Piano syllabus (Grade 2: "Major pentatonic on F; b3 pentatonic on C; Minor pentatonic on A") |
| b3 pentatonic | 0 2 3 7 9 | tonic = root | ABRSM Jazz Piano syllabus grades 1-5 (https://www.abrsm.org/sites/default/files/2023-12/jazz-piano-syllabus-grades-1-5.pdf), "b3 pentatonic on G (five notes)" at Grade 1; its text copy shows one flattened note among five; the degrees 1 2 b3 5 6 are a reading confirmed only by a forum (https://forum.pianoworld.com/ubbthreads.php/topics/1299049/), not by the syllabus's notation |
| blues scale | 0 3 5 6 7 10 | tonic = root | https://en.wikipedia.org/wiki/Blues_scale (stand-in; OMT holds none) |
| whole-tone | 0 2 4 6 8 10 | no tonic | OMT-scales2; music21 `WholeToneScale` |
| octatonic | 0 1 3 4 6 7 9 10 | no tonic | OMT-scales2; music21 `OctatonicScale` |
| dominant bebop (= dorian bebop a fifth up) | 0 2 4 5 7 9 10 11 | its own root, confirmed by the chord | https://en.wikipedia.org/wiki/Bebop_scale (stand-in for David Baker, *How to Play Bebop*, not read) |
| major bebop | 0 2 4 5 7 8 9 11 | its own root | as above |
| chromatic | all 12 | none | music21 `ChromaticScale` |

3. **Passage level** (new): each single-note scale run (`scale_runs`, at least 6 notes) whose pitch-class set equals a collection of the same size is a named passage. Its **name needs a tonic**, and the item's tonic is the wrong one inside a key area: a run in D major inside a G major piece would otherwise be named "Lydian on G". So: a diatonic run is named as the **major or natural minor scale of the local key** (`key.change`) when the local key's scale equals the set; a mode name only when the item or hand level already names that mode (a modal item); chord-scale names (Phrygian dominant, Lydian dominant, altered, bebop) only when the chord in force over the run has the collection's own root (a dominant-bebop run on G over G7); otherwise the parent collection with its root ("harmonic-minor set on A") and the mode left to the agent. A run with fewer pitch classes than any collection is reported as "partial" with the collections that contain it (containment is reported, never named).

| threshold | value | basis |
| --- | --- | --- |
| equality, not containment | equal sets only | validated: `harmony.md`'s rule (three notes fit many collections), kept; 374 generated items below |
| scale run | >= 6 notes, one direction, steps of 1-3 semitones (a minor third only as a pentatonic gap) | reused: section 6 (counted there) |
| mode needs the local tonic | yes | validated: naming by the item's tonic named 168 runs in 35 PDMX items "Lydian" and 49 runs in 24 PDMX items "dominant bebop", nearly all in classical pieces' dominant key areas (below) |

**Output.** `{all, R, L, passages: [{hand, bars, run_notes, collection, named_by: "local key" | "item mode" | "chord" | "set only"}]}`; provenance `exact` when the name needs no tonic (whole-tone, octatonic, chromatic, a bebop set's root), else `inferred` with the key's confidence. **UNKNOWN**: never for the set; the name falls back to the set when the tonic is unknown.

**Validation.** [measured: `minor_coll.py`, `coll_runs.py`] Item level on 374 generated items that declare a collection: scale major 108 of 108 ionian, harmonic 72 of 72, melodic 48 of 48 ("melodic minor, both directions"), natural 24 of 24 aeolian; blues_scale 16 of 16 and `pentatonic.*.blues` 3 of 3 blues scale; `pentatonic.*.pentatonic` 3 of 3 minor pentatonic; chromatic 16 of 16 all twelve; octave and double scales 33 of 33 ionian; `modal_vamp` 3 of 3 aeolian (their titles: "Minor vamp ... i, flat seven, flat six", so aeolian is right); five_finger 48 of 48 "no named collection (5 pitch classes)" (a pentachord is not a scale). Passage level by the item's tonic (the rejected method) on every item: PDMX runs named ionian 463, "Lydian" 168, aeolian 66, melodic minor 61, "dominant bebop" 49, major pentatonic 34; unnamed 6-pitch-class runs 572 in 182 items.

**Residual to the agent** (PDMX): the mode of a run or passage whose tonic the local key does not settle, and whether an item-level diatonic set is a mode or a major or minor key with a modal flavour.

**Examples.** Positives: `exercise.blues-scale.c.1oct.right` (blues scale on C), `exercise.pentatonic.a.pentatonic` (minor pentatonic on A), `song.folk.el-condor-pasa-if-i-could.pdmx` (a minor pentatonic run). Near-misses: `exercise.five-finger.c-major.right` (five notes: no collection), `exercise.modal-vamp.a` (aeolian, not dorian: no F#).

## 9. pitch.inventory

**Marking.** Generated: code. PDMX: code.

**Input.** music21 `converter.parse`; per staff (music21 `PartStaff`, or part for one-staff parts); per note its pitches, the `Ottava` spanners it belongs to (`getSpannerSites`), the clef in force (`getContextByClass(clef.Clef)`).

**Rule.**
1. **Displayed pitch** = sounding pitch transposed by minus the shift: 8va/8vb 12, 15ma/15mb 24, sign by `shiftDirection()` (`up` subtracts).
2. Per staff: each distinct displayed pitch as `nameWithOctave` (scientific pitch notation, middle C = C4; music21 writes flats as "-": `B-4`), its count of struck notes (tie continuations and grace notes excluded).
3. **Line or space**: `s` = the displayed pitch's `diatonicNoteNum` minus the clef's `lowestLine` (treble 31 = E4, bass 19 = G2, checked; octave clefs carry their own). `s` 0, 2, 4, 6, 8 are lines 1-5; odd `s` from 1 to 7 are spaces 1-4; `s` -1 and 9 are the spaces just outside the staff; even `s` below 0 or above 8 are ledger lines (`-s/2` below, `(s-8)/2` above); other odd `s` are spaces between ledger lines. The written letter decides, so B#3 hangs below middle C's line and C-flat4 sits on it (as `detect.ts` ledgerLines).
4. Skips one-line and percussion staves.

| threshold | value | basis |
| --- | --- | --- |
| staff positions | from the clef's bottom line | sourced + validated: MXL-pitch, MXL-clef; music21 `Clef.lowestLine`; checked below |

**Output.** `{staves: {1: [[name, count, position]], 2: ...}, distinct: {1: n, 2: n}, under_shift: n}`, provenance `exact`. **UNKNOWN**: no notes; unreadable file; a staff with no clef ("no clef" positions).

**Pipelines.** Generated and PDMX alike. On PDMX an 8va typed as words (1 held file) is not an `Ottava`, so its displayed pitch is wrong by the shift: that is `mark.ottava`'s residual, inherited where `mark.ottava` flags it.

**Validation.** [measured: `inventory.py`] `exercise.five-finger.c-major.right`: C4 (ledger line 1 below), D4 (space below), E4 (line 1), F4 (space 1), G4 (line 2), 5 distinct; `exercise.interval-reading.c-position.left.01`: C3 (space 2) to G3 (space 4) in the bass, 5 distinct; `song.folk.twinkle.rh`: C4 to A4, 6 distinct; `song.jazz.james-pierpont-jingle-bells-jazz-piano.pdmx`: 70 notes lie under octave shifts and are moved to their displayed place; the commonest nine positions per staff were checked by hand against the clef (all right); the shifted notes' positions were not each checked.

**Examples.** Positives: `exercise.five-finger.c-major.right` (Middle C position's notes C4-G4 on the treble staff), `exercise.interval-reading.c-position.left.01` (C3-G3 on the bass staff). Near-misses: `song.folk.twinkle.rh` (C4-A4: one note beyond the five-finger set), `song.jazz.james-pierpont-jingle-bells-jazz-piano.pdmx` (pitches under 8va: the sounding pitch would put them an octave off the page).

## 10. reading.enharmonic-spelling

**Marking.** Generated: code. PDMX: code (a misspelling is counted as printed).

**Input.** `score.load` spelling fields (`step`, `alter`, `octave`) with `pitch`, staff and bar; music21 `pitch.Pitch.ps` against `.name` as the second witness (C-flat4 and B3 both give ps 59: checked).

**Rule.** Per note, as written:
1. **White-key accidental**: E#, B#, C-flat, F-flat (a single accidental landing on a white key).
2. **Double accidental**: alter +2 or -2 (also counted by `reading.accidental-kinds`).
3. **One key under two names**: the same MIDI pitch written with two different spellings (step and alter), reported at two scopes: in one bar (any staff), and in the item. Each pair with its bars.

| threshold | value | basis |
| --- | --- | --- |
| the four white-key accidentals | E#, B#, Cb, Fb | sourced: WP-Enharmonic (stand-in); abilities.md AB-006 |
| passage scope | one bar, and the item | neither: the bar is the unit an accidental lasts for (MXL-accidental, the bar rule); a wider window was not tested |

**Output.** `{white_key: [[bar, staff, name]], double: [...], two_names: {bar: [[bar, midi, names]], item: [[midi, names, bars]]}}`, provenance `exact`. **UNKNOWN**: no notes; unreadable file. Spelling is reported as printed; whether a spelling is right for its key is `integrity.notation-sanity`.

**Validation.** [measured: `scan.py`] Items with a white-key accidental: generated 86 (the arpeggio7 items on A-flat, B-flat, D spell C-flat and F-flat as chord tones), PDMX 94, other real 150; double accidentals: 10, 27, 82; one key under two names in the item: 7, 144, 184; in one bar: 1, 29, 74. The 7 generated items are the tritone-substitution, passing-chord and E-flat minor-blues items, where B (in G7) and C-flat (in D-flat7) are both correct spellings.

**Examples.** Positives: `exercise.arpeggio7.a-flat-half-diminished7.2oct.both` (8 C-flats: white-key accidentals), `exercise.tritone-sub.c` (MIDI 71 written as B and as C-flat in one item). Near-misses: `exercise.arpeggio7.a-flat-dominant7.2oct.both` (A-flat, C, E-flat, G-flat: flats on black keys only, none of the three kinds), `exercise.scale.g-flat-major.1oct.similar.right.2` (2 C-flats, a white-key accidental, but every key under one name: kind 3 absent).

## 11. key.polytonal

**Marking.** Generated: code (absent by the family list; per-staff signatures exact). PDMX: code + agent (per-staff key-finding over short passages is unreliable; agent confirms).

**Input.** Raw MusicXML `<key number="n">` (a per-staff signature) and the key in force per part; `rules.texture.view` per-hand notes by bar.

**Rule.**
1. **Printed**: different signatures on the two staves (a `<key>` with a `number` attribute differing by staff, or two piano parts with different keys in force at the same bar). Exact.
2. **Collections per hand**, in 4-bar windows: each hand holds at least 6 pitch classes, each hand's set fits one diatonic collection, and the union fits none; present when this holds in at least two consecutive windows (8 bars).
3. **White keys against black keys**, in 4-bar windows: one hand only white keys and the other only black keys, each with at least 3 pitch classes.
4. Any window found by 2 or 3 is a candidate for the agent; only 1 is reported present by code alone.

| threshold | value | basis |
| --- | --- | --- |
| hand set size | >= 6 pitch classes (2), >= 3 (3) | validated: with >= 5 pitch classes and one window, 61 tonal real items were flagged; with >= 6 and two consecutive windows, 2 (below) |
| persistence | 2 consecutive 4-bar windows | validated: as above |
| definition | two keys at once | sourced: WP-Polytonality (stand-in; no syllabus page read) |

**Output.** `{printed: [[bar, fifths_staff1, fifths_staff2]], windows: [[bars, R_collection, L_collection]], white_black: [[bars, white_hand]]}`, provenance `exact` (printed) or `one-witness` (windows). **UNKNOWN**: one hand only; under 8 bars for windows.

**Validation.** [measured: `scan.py`, `scan2.py`, `synth.py`] No catalogue file prints a per-staff `<key number>` (0 of 2,020). Windows: the strict test flags 2 real items, `song.classical.chopin-waltz-op70-1.nifc` and `song.classical.kohler-sonatina-op-300-no-1.pdmx`, both tonal (false positives, which is why windows are only candidates); white against black: 0 items. On built files (not real scores): a C major scale over an F-sharp major scale fires the window test; white notes over black notes fires test 3; a chromatic scale fires nothing. The catalogue holds no polytonal piece, so there is no real positive.

**Examples.** Positives: none real in the catalogue; the built file `bitonal_C_over_Fsharp` (`build/b1/synth/`) is the only positive, and it is not a catalogue item. Near-misses: `song.classical.chopin-waltz-op70-1.nifc` and `song.classical.kohler-sonatina-op-300-no-1.pdmx` (chromatic tonal writing that the window test flags; the agent answers "not polytonal").

## 12. pitch.tone-row

**Marking.** Generated: code (absent by the family list). PDMX: code + agent (statements with repeated, omitted or split notes).

**Input.** `rules.texture.view` per hand: the top line (highest note per onset) and the bottom line (lowest), one line where they are the same; music21 `serial.pcToToneRow`, `TwelveToneRow.findZeroCenteredTransformations`, `serial.getHistoricalRowByName` (checked by import).

**Rule.**
1. **Statement**: 12 consecutive notes of one line with 12 different pitch classes that is not a scale figure: fewer than 8 of its 11 intervals are seconds (1 or 2 semitones), no 5 seconds in a row, and its notes at even positions and at odd positions do not both move only by seconds (two interleaved chromatic lines, as in Chopin's Op. 25 No. 6, are not a row). Statements are taken greedily left to right without overlap; a statement found in both the top and the bottom line at the same notes counts once.
2. **Row**: the first statement is the prime; each later statement is named P, I, R or RI with its transposition by `findZeroCenteredTransformations` (none if it is not a form of the prime).
3. **Present** when at least two statements are forms of one row. A single statement is reported, not counted as a row.

| threshold | value | basis |
| --- | --- | --- |
| 12 distinct pitch classes in order | yes | sourced: M21 `serial`; https://en.wikipedia.org/wiki/Twelve-tone_technique (stand-in) |
| not a scale figure | < 8 of 11 seconds; no 5 seconds in a row; not two interleaved stepwise lines | validated: in part; the first and third clauses removed the catalogue's false positives; the second guards against chromatic descents, with no catalogue case isolated (below) |
| at least two statements | 2 | neither: not published; one aggregate occurs by chance in chromatic tonal writing (the catalogue's one remaining statement is such a case); checked only on a built file |

**Output.** `{statements: [[hand, line, bar, form]], row: [12 pcs] | null, present}`, provenance `exact`. **UNKNOWN**: no line of 12 notes.

**Validation.** [measured: `synth.py`, `row_check.py`, `row_check2.py`] Built line (not a real score) of Schoenberg's Op. 25 row (`getHistoricalRowByName('SchoenbergOp25')`) as prime, inversion and retrograde: 3 statements, named P, I and R at one transposition; a chromatic scale three times: 0. On the catalogue, test by test: fewer than 6 semitone steps (`scan2.py`) gave 3 items with a row stated twice or more, all false: `song.classical.chopin-etude-op25-6.nifc` (60 statements of two interleaved chromatic lines), `song.classical.chopin-nocturne-in-f-sharp-major-op-15-no-2.pdmx`, `song.classical.chopin-variations-op12.nifc` (a descending sequence in fourths and fifths); fewer than 8 seconds (`row_check.py`): the same 3 (12, 2 and 2 statements, the last two counting one statement in both the top and the bottom line); the full test (`row_check2.py`): 0 items present; the interleaving clause removed Op. 25 No. 6 and Op. 12, and one single statement remains (the Nocturne, bar 58, a chromatic descent turning into a sequence; the check still counted it in both lines, which the rule counts once).

**Examples.** Positives: none in the catalogue (no serial piece); the built `row_Schoenberg_op25` file. Near-misses: `song.classical.chopin-etude-op25-6.nifc` (12 pitch classes in order as two interleaved chromatic lines: not a row), `song.classical.chopin-nocturne-in-f-sharp-major-op-15-no-2.pdmx` (one statement, not repeated: not a row).

---

## Counts (by script over this file)

By `build/b1/count_doc.py` over this file as written (sections, the `| threshold | value | basis |` tables, and the catalogue ids in each **Examples** paragraph):

| # | characteristic | marking (generated / PDMX) | rule written | thresholds: sourced / sourced + validated / validated / neither (reused) | real positives / near-misses (catalogue ids) |
| --- | --- | --- | --- | --- | --- |
| 1 | hands.per-bar-range | code / code + agent | yes | 2 / 0 / 0 / 0 (0) | 4 / 2 |
| 2 | pitch.black-key-share | code / code | yes | 1 / 0 / 0 / 1 (0) | 2 / 2 |
| 3 | technique.five-finger | code / code + agent | yes | 2 / 1 / 2 / 0 (0) | 2 / 2 |
| 4 | technique.position-shift | code / code + agent | yes | 0 / 0 / 0 / 0 (2) | 2 / 2 |
| 5 | key.tonic-mode | code / code + agent | yes | 0 / 0 / 3 / 0 (0) | 2 / 2 |
| 6 | key.minor-form | code / code + agent | yes | 0 / 1 / 0 / 1 (0) | 2 / 2 |
| 7 | key.change | code / code + agent | yes | 2 / 0 / 2 / 0 (0) | 2 / 2 |
| 8 | scale.collection | code / code + agent | yes | 0 / 0 / 2 / 0 (1) | 3 / 2 |
| 9 | pitch.inventory | code / code | yes | 0 / 1 / 0 / 0 (0) | 2 / 2 |
| 10 | reading.enharmonic-spelling | code / code | yes | 1 / 0 / 0 / 1 (0) | 2 / 2 |
| 11 | key.polytonal | code / code + agent | yes | 1 / 0 / 2 / 0 (0) | 0 / 2 |
| 12 | pitch.tone-row | code / code + agent | yes | 1 / 0 / 1 / 1 (0) | 0 / 2 |

- Rules written: 12 of 12 (the markings above match `characteristics-list.md` 1.B; no row of the area is agent-only or a gap).
- Thresholds: 29 (3 more are reused from another section and counted there): sourced 10, sourced + validated 3, validated 12, neither 4.
- Examples: 10 of 12 sections give at least two real positives and two real near-misses from the catalogue; `key.polytonal` and `pitch.tone-row` give two real near-misses each and no real positive (the catalogue holds no polytonal or serial piece; their positives are built files).

## Not done

- **Run-level minor forms** (section 6) are specified but not run on real items.
- **Five-finger tonic-to-dominant test and Middle C position pairing** (section 3, steps 4 and 5) are specified, not run: only the frames, classes and the frames' lowest notes were measured.
- **Position-shift times in seconds** (section 4) are specified, not computed; only quarters were measured.
- **key.tonic-mode flags (d) modal and (e) blues** are specified, not validated: the catalogue has no modal item with a reference key (the three modal vamps are aeolian), and the blues families were scored on tonic and mode against a major `keySig`.
- **The extended collections** (b3 pentatonic, octatonic, bebop, the melodic- and harmonic-minor modes) were run only at passage level by the rejected item-tonic method; the item-level validation used the existing list.
- **key.change thresholds** (window 4 bars, area 4 bars, 8 notes) were run once, not tuned; the key areas' confidence is not measured; the recall figure rests on one set (the Bach Inventions) and the folk items' areas were not each judged.
- **The b3 pentatonic's degrees** rest on the syllabus's text copy (one flat among five notes) and a forum; the syllabus's notation itself was not read.
- **Bebop scales' source** is a Wikipedia stand-in for David Baker's book, not read.
- **Passage-level collection naming by local key and chord** (section 8, step 3) is specified, not run: the run measured was the rejected item-tonic method.
- **key.polytonal and pitch.tone-row** have no real positive in the catalogue; their detectors were shown on built files only.
- **Ability thresholds** over these rows (AB-005 "all black", AB-080 "wide compass", AB-010 "no time allowed") are not set here: they belong to the abilities' combinations.
- **Reader faults** (section 0: 4 unreadable files) and the **catalogue title errors** (section 5: four Chopin titles naming the wrong key) are reported, not fixed: no edits outside this file.
- **Generated-key disagreements** (section 5: Hanon 13 and 20, the iii-vi-ii-v turnarounds, two broken-chord items) are listed for the generator or reader defect check (1.M, S3), not resolved.
- Nothing here has been heard.
