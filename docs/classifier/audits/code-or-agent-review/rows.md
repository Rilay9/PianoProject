# Code or agent: review of the marking (2026-10-08)

**What this is.** One review pass over the two markings `verified by (generated)` and `verified by (PDMX)` that `docs/classifier/characteristics-list.md` section 1 gives each of its 213 characteristics, and over section 1.M, which explains them (FABLE.md section 2, item 1b, "First, code or agent"; the owner, 2026-10-08: "first we need to figure out what characteristics can be fully verified by code and which need an agent"). Input fixed at dc5eab05; worktree cut from origin there. The reviewer did not write the markings. Nothing else was edited.

**How each verdict was reached.** Every row and pipeline got one verdict: **OK** (the marking is right); **WRONG material** (the marking would let an item be placed or verified wrongly, or names the wrong actor); **WRONG minor** (the marking stands or nearly stands, but its reason, scope or evidence is wrong, or the row's definition contradicts it); **UNSURE** (could not be checked; none was needed in this pass). The evidence column says **measured** (a script run on the files the app serves, named below) or **reading** (this reviewer's judgement over the row, the rules pages or the source).

**The measurements** (scripts under `build/cr/` in this worktree, not committed; files read from the main checkout, nothing written there):
- `a1.py`: the generated rhythm, clave and shuffle files read; the recipe-less generated items; `fingeringVerified` per family.
- `a2.py`: all 1,211 generated files per family: `<fingering>` present, a stepwise run of six or more notes one way in one voice without fingering, chords inside a voice, `<harmony>` present, a progression in the recipe.
- `a3.py`, `a4.py`, `a6.py`, `a5.py`: the 421 held two-staff PDMX piano parts: which voices have notes on both staves, and whether a voice moves between staves inside one bar in time order (cross-staff writing), overlaps itself on two staves (a voice-number collision) or sits on one staff in some bars and the other in others (voice numbers reused).
- `a7.py`: an element census of the 556 held PDMX files (`content/scores/pdmx`).
- `a8.py`: the proving run's generated disagreements by item; the first-bar length of the held PDMX files.
- `a9.py`: the recipe fields (`drill.params`) per generator family, with titles and signatures.
- `a10.py`: duplicated chord symbols in the held PDMX files.
- `rt.py`: 20 MuseScore-exported MuseTrainer files (`content/scores/imported/musetrainer/scores`) parsed and written back by music21 10.5 (`.venv`), as the PDMX importer normalises uploads; 18 exported, 2 failed ("Cannot convert ... duration to MusicXML"); element counts compared.
- `parse.py`, `verdicts.py`: the 213 ids and markings parsed from section 1, the 1.M counts recounted, every verdict written as data and counted.
- Inline splits of `docs/classifier/proving/2026-10-07/results.json` (disagreements by pipeline and by ratio).
- Read: `app/src/demands/detect.ts` lines 319 to 341 (`cellBars`), `docs/classifier/rules/rhythm.md` (mazurka, shuffle), `tools/content/pdmx/commit.py` (the repository holds "converted, normalised" files).

The shared findings S1 to S11, F12 and F13 are given in full after the table; a row's cell names the one that applies.

## Rows

| id | generated: verdict and correction | PDMX: verdict and correction | evidence |
| --- | --- | --- | --- |
| item.format | WRONG minor (S7): code from the family is right, but the file route named (`note.Unpitched`, partitura `UnpitchedNote`) finds none of the 28 rhythm and clave items, which write pitched B4 on a one-line percussion staff; staff-lines 1 with a percussion clef finds them | OK | measured: build/cr/a1.py (clave and rhythm files read), a9.py |
| notation.staves | OK | OK | reading (proving run counts re-split, build/cr/a8.py) |
| prereq.hand-assignment | OK | WRONG minor (S1): code + agent stands, but the residual scope is cross-staff writing in at most 29 of 421 two-staff files (not 159), 4 voice-number collisions, 5 files with hand words, and passages code can flag (a staff chord beyond one hand's reach); the agent reads only what code flags | measured: build/cr/a3.py, a4.py, a6.py on 421 held two-staff PDMX files |
| texture.melody-location | WRONG minor (S3): roles are not in any recipe; they follow from the family (study: line over accompaniment; hand_independence and coordination: lines in both hands), which the family contracts must state | OK | measured: build/cr/a9.py (drill.params per family); reading for the roles |
| notation.clefs | OK; the 5 "unresolved" disagreements are resolved: all are the clave .pulse items, whose percussion staff the stored reader counts as bass clef (S7), a reader fault | OK (my split of results.json gives 8 PDMX disagreements, not 9) | measured: build/cr/a8.py, a1.py |
| notation.clef-change | OK | OK | reading |
| pitch.ledger | OK; the 5 disagreements are the clave .pulse items (percussion staff read as pitched, S7), a reader fault: rule must skip percussion staves | OK | measured: build/cr/a8.py, a1.py |
| mark.ottava | OK | OK (held files: 76 carry `<octave-shift>`, 1 types 8va as words) | measured: build/cr/a7.py |
| notation.keys | OK | OK | reading (proving run) |
| key.signature-exercised | OK | OK | reading (proving run) |
| pitch.chromatic | WRONG minor (S4): "the recipe's key" is a chord root or starting note in arpeggio7, broken7 and chromatic (100 measured recipe-file disagreements) and absent for rhythm, clave and 5/4 items; code must take the key from the file's signature and answer "no key" there; for blues-form items (signature major) every blue note counts chromatic, which the row should say | OK | measured: proving results.json generated.spec-declared split, build/cr/a9.py |
| reading.accidental-kinds | OK | WRONG minor (S2): no held PDMX file carries `cautionary` (0 of 556; music21 re-exports), so courtesy accidentals come from the bar rule (printed where the rule does not require one) and `parentheses="yes"` (12 files); still code | measured: build/cr/a7.py; rt.py (accidentals 2,188 to 2,188 across 18 round-tripped MuseScore files) |
| reading.accidental-churn | OK | OK | measured in part: rt.py (printed accidentals survive the music21 re-export, 18 files) |
| reading.visual-density | OK | OK | reading |
| reading.unusual-notation | OK | OK | reading |
| reading.pitch-entropy | OK | WRONG minor (S9): the definition counts per hand but the cell says code per staff; either define it per staff (it is printed per staff) or inherit the hand like the other per-hand rows (here: define per staff) | reading |
| reading.redundancy | OK | WRONG minor (S9): the definition counts per hand but the cell says code per staff; either define it per staff (it is printed per staff) or inherit the hand like the other per-hand rows (here: define per staff) | reading |
| notation.turn-opportunity | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py, a6.py |
| mark.fingering | OK (424 of 1211 files print `<fingering>`; code reads exactly what is printed) | OK (note S2: the music21 re-export dropped 9 of 163 `<fingering>` in 18 round-tripped files; code is exact on the held file, which is what the learner sees) | measured: build/cr/a2.py, rt.py |
| notation.lyrics | OK | OK | reading |
| notation.chord-symbols | OK | WRONG minor (S2): `<harmony>` on held files is not as uploaded: 33 of 110 held files carry 1,399 of 5,864 symbols duplicated at the same time, and the music21 round-trip of a MuseScore file wrote each symbol once per staff (Bella Ciao 32 to 64); counts and "over a melody or alone" need de-duplication by time; still code | measured: build/cr/a10.py, rt.py |
| harmony.figured-bass | OK (absent: no family writes it) | WRONG minor (S2): no held file can carry `<figured-bass>` (0 of 556; music21 drops it), so "raw `<figured-bass>` is exact" finds nothing; on the held files figures exist only as text or lyrics, which is the whole row; code + agent stands | measured: build/cr/a7.py |
| mark.repeat | OK | WRONG minor (S2): code + agent stands, but "no `<sound>` jump attribute" describes music21's re-export (0 of 556 held files carry one), not the uploads; and the standard jump words (D.C., D.S., al Fine, al Coda, To Coda) are a closed list code reads: the agent is needed only for other wording | measured: build/cr/a7.py (42 held files with jump words, 11 `<segno>`, 9 `<coda>`) |
| notation.reading-aids | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py (no family declares an aid) |
| notation.slash-rhythm | OK | OK | reading |
| integrity.notation-sanity | WRONG minor (S4): the intended spelling of an arpeggio7 or broken7 item comes from its chord root, not a key; code still | OK | measured: proving spec-declared split |
| hands.per-bar-range | OK (rule must skip percussion staves, S7) | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py, a6.py, a1.py |
| pitch.black-key-share | OK | WRONG minor (S9): the definition counts per hand but the cell says code per staff; either define it per staff (it is printed per staff) or inherit the hand like the other per-hand rows | reading |
| technique.five-finger | WRONG minor (S3, S4): only five_finger and interval_reading declare a position; the tonic-to-dominant test needs the key, which arpeggio7, broken7, chromatic and keyless items lack; code still | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a9.py |
| technique.position-shift | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| key.tonic-mode | WRONG material (S4): the recipe's `key` is not a key in arpeggio7 (55), broken7 (33) and chromatic (12): 100 of 1134 recipes disagree with the file, which prints no signature; rhythm, clave and 5/4 items have none; mode is declared only by scale and chromatic (`quality` in 5 more families). Correct: code from the file's `<key>` and the catalogue keySig, "no key" where the family has none; never the recipe's key letter. Read off the recipe, an A diminished-seventh arpeggio would be placed as A major | OK | measured: proving results.json (generated.spec-declared disagreeing ids by family), build/cr/a9.py |
| key.minor-form | OK | OK | reading |
| key.change | OK | OK | reading |
| scale.collection | WRONG minor (S3): scale, blues_scale, pentatonic and chromatic name their collection; modal_vamp declares only `key` (its mode is in the title); others name none: code over the notes with the file's tonic | OK | measured: build/cr/a9.py |
| pitch.inventory | WRONG minor (S7): rhythm and clave items would report "B4" as an inventory; the rule must skip percussion staves | OK | measured: build/cr/a1.py |
| reading.enharmonic-spelling | OK | OK | reading |
| key.polytonal | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| pitch.tone-row | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| notation.times | OK | OK | reading (proving run) |
| metre.class | OK | OK | reading (proving run) |
| mark.anacrusis | OK | OK, now measured: 104 of 519 held files have a first bar shorter than the signature and only 5 carry `implicit`, so the cell's "not only implicit" is necessary; 22 more open with a full bar led by half a bar of rest (not an anacrusis as defined) | measured: build/cr/a8.py |
| rhythm.values | OK | OK | reading (proving run) |
| rhythm.dotted-quarter | OK | OK | reading (proving run) |
| rhythm.ties | OK | OK | reading (proving run) |
| rhythm.syncopation | OK | WRONG minor (S8): an unresolved disagreement between two code readers is a code defect to resolve, not a per-item agent question; mark code (to be validated), as the rows with unresolved clef, tie, habanera and dotted disagreements are | reading (proving run split) |
| rhythm.triplets | OK | WRONG minor (S9): the definition counts per hand but the cell says code per staff; either define it per staff (it is printed per staff) or inherit the hand like the other per-hand rows | reading |
| rhythm.tuplets-other | OK | OK | reading |
| rhythm.cadenza | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| rhythm.repeated-notes | OK | OK | reading |
| rhythm.equal-stream | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| rhythm.habanera | OK | WRONG minor (S9): the definition counts per hand but the cell says code per staff; either define it per staff (it is printed per staff) or inherit the hand like the other per-hand rows: `detect.ts` cellBars reads hand L only (line 323) | reading: app/src/demands/detect.ts 319-341 |
| rhythm.tresillo | OK; the 10 disagreements are latin-groove son-3-2 (5) and tumbao (5): the stored reader reads the left hand's lowest notes only, a definitional difference to reconcile | WRONG minor (S9): the definition counts per hand but the cell says code per staff; either define it per staff (it is printed per staff) or inherit the hand like the other per-hand rows: `detect.ts` cellBars reads hand L only (line 323) | measured: build/cr/a8.py; reading detect.ts |
| rhythm.cinquillo | OK | OK | reading |
| rhythm.secondary-rag | OK | WRONG minor (S8): "finds none in Joplin, unresolved" is a validation of the rule, not an agent question; the agent residual is the inner voice only | reading |
| rhythm.shuffle | OK | WRONG minor (S9): the definition counts per hand but the cell says code per staff; either define it per staff (it is printed per staff) or inherit the hand like the other per-hand rows: the rule counts a bar "when one hand has" the pairs (rules/rhythm.md) | reading: docs/classifier/rules/rhythm.md |
| notation.swing-mark | OK; the 2 disagreements are the two shuffle rhythm items, which ask swing only in prose ("Shuffle, play the eighths long-short"): resolved, code with the generator's word list | WRONG minor (S2): code + agent stands, but `<swing>` cannot occur in a held file (0 of 556), so "0 of 524 disagree" measures nothing; the route is words ("Swing" or "Shuffle" in 11 held files) | measured: build/cr/a1.py, a7.py |
| rhythm.backbeat | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| rhythm.hemiola | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| texture.polyrhythm | OK (hand_independence declares its ratio) | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a9.py, a4.py |
| rhythm.beat-onset-share | OK | OK | reading |
| mark.tempo-text | OK | OK | reading (noise-scan counts not re-run) |
| mark.tempo-change | OK | OK | reading |
| technique.velocity | OK; all 9 disagreements are 6/8, 12/8 or 7/8 items with a factor-2 ratio: the readers take the metronome's beat unit differently (S10), code-resolvable | WRONG minor (S1, S10): code + agent stands for the missing tempo, but 70 of the 88 PDMX disagreements (cell: 89) are exact factor 2 or 0.5, the beat unit, not the hand or a missing tempo | measured: build/cr/a8.py and an inline split of results.json |
| technique.endurance | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| metre.grouping | OK (the meter family declares its grouping; 3 items) | OK | measured: build/cr/a9.py |
| rhythm.silence | OK | OK | reading |
| rhythm.bar-patterns | OK | WRONG minor (S9): the definition counts per hand but the cell says code per staff; either define it per staff (it is printed per staff) or inherit the hand like the other per-hand rows | reading |
| rhythm.clave-alignment | OK (clave, montuno and latin_groove declare the direction) | OK | measured: build/cr/a9.py |
| interval.melodic | WRONG minor (S11): 458 of 1211 generated files have chords in a voice, and all 12 step and 18 skip disagreements are cadence-root and waltz or held-melody items, i.e. chordal voices; "lines written by voice" does not define the line there; a positional rule (top and bottom lines of chords) does, by code | OK | measured: build/cr/a2.py, a8.py |
| quality.contour | OK | OK | reading |
| quality.leap-recovery | OK | OK | reading |
| melody.tessitura | OK | OK | reading |
| melody.degree-profile | WRONG minor (S4): "the recipe's key" is a chord root or starting note in arpeggio7, broken7 and chromatic (100 measured recipe-file disagreements) and absent for rhythm, clave and 5/4 items; code must take the key from the file's signature and answer "no key" there | OK | measured: proving spec-declared split |
| melody.chord-relation | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| melody.motif-repetition | OK | OK | reading |
| melody.sequence | OK | OK | reading |
| technique.written-ornament | OK (the trill family declares its ornament) | OK | measured: build/cr/a9.py |
| harmony.chord-quality | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| harmony.inversion | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| harmony.roman | WRONG material (S5, S4): the root of the chord rows; about 56 chordal generated items declare no progression and print no symbols (study 24 among them, the reading pieces most likely to be fitted to harmony abilities), and arpeggio7 and broken7 have no key to number in. Correct: code where `<harmony>` or a declared progression agrees with the notes; elsewhere the notes path with its residual, until the generator emits its progression | OK | measured: build/cr/a2.py (per-family `<harmony>`, recipe progression, chords in a voice), proving spec-declared split |
| harmony.progression | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| harmony.applied | OK | OK | reading |
| harmony.cadence | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| harmony.chromatic-share | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| harmony.rhythm | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression; "the recipe's chord durations": only study declares a harmonic rhythm, and it declares no chords | OK | measured: build/cr/a2.py, a9.py |
| harmony.chord-vocabulary | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| harmony.voicing | WRONG minor (S3): a voicing field exists only in seventh_voicing and cadence (open_voicing has `flavour`, ii_v_i `shape`); the rest is the rule under printed symbols, which is code | WRONG minor (F13): marking stands, but part of the residual is a rule or source still to write, not a question an agent can answer per item; drop that clause from the agent's question (no rule yet for upper structure, drop-2, locked hands, Bud Powell shells) | measured: build/cr/a9.py |
| harmony.voice-leading | OK | OK | reading |
| harmony.chord-connection | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| harmony.bass-behaviour | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| texture.bass-walk-up | OK (the walkup family prints `<harmony>`) | OK | measured: build/cr/a2.py |
| texture.pedal-point | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression (held-bass study and pedal_variant items declare no chords) | OK | measured: build/cr/a2.py |
| harmony.implied | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression; study items are exactly a line with a declared harmonic rhythm and no declared chords; code fits and reports ties | OK | measured: build/cr/a9.py |
| harmony.planing | OK | OK | reading |
| harmony.dissonance-share | OK | OK | reading |
| harmony.chord-scale | WRONG minor (S3): no family declares a chord-scale; code over the notes against the chord, UNKNOWN on too few notes | OK | measured: build/cr/a9.py |
| texture.type | WRONG minor (S3): no recipe names roles; code from voice count and synchrony | OK | measured: build/cr/a9.py |
| texture.hands-together | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads; the 2 proving disagreements are the two four-part hymns with voice-number collisions, where the stored reader returns null: a reader fault | measured: build/cr/a4.py, a8.py |
| texture.voice-count | OK | WRONG minor (S2): on held files `<voice>` is music21's numbering (reused across staves in 127 files, colliding in 4); written voices are countable per bar per staff, still code | measured: build/cr/a6.py, a4.py |
| texture.counterpoint | OK | OK | reading |
| texture.imitation | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| texture.block-chords | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| interval.harmonic | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.double-notes | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.octaves | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.power-chord | OK | OK | reading |
| texture.broken-chord | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.alberti | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.arpeggio | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.waltz-bass | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.oom-pah | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.stride | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.boogie-bass | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.walking-bass | OK; 5 of the 9 disagreements are the clave .pulse items, where the stored reader calls a percussion pulse a walking bass (S7, a reader fault); the 4 stride items stay unresolved | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a8.py, a1.py |
| texture.left-hand-pattern | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.ostinato | OK | WRONG minor (F13): marking stands, but part of the residual is a rule or source still to write, not a question an agent can answer per item; drop that clause from the agent's question (the transposed-figure test is to be written) | reading |
| texture.repeated-chords | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.offbeat-chords | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.charleston | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.montuno | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.tumbao | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.clave | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.bossa | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.tango | WRONG minor (S3): no family is a tango; bass_cell declares the habanera cell, not the style; absence by family | OK | measured: build/cr/a9.py |
| texture.mazurka | OK | WRONG minor (S9): the definition counts per hand but the cell says code per staff; either define it per staff (it is printed per staff) or inherit the hand like the other per-hand rows: the rule reads the figure "in the right hand" (rules/rhythm.md) | reading: docs/classifier/rules/rhythm.md |
| texture.stop-time | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.tremolo-thirds | OK | WRONG minor (S8): "the mark path is untested on real data" is a validation item, not an agent question; the residual is the hand | reading |
| texture.crushed-note | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.half-time | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | WRONG minor: the residual "the feel, low confidence" is not a question an agent can answer by reading; state it: given the coded onsets and accents per beat, is the backbeat on beat 3 rather than on 2 and 4 (UNKNOWN when neither is marked) | reading |
| texture.call-response | OK | OK | reading |
| texture.melody-in-chords | OK | OK | reading |
| texture.sustained | OK | OK | reading |
| texture.build | OK | OK | reading |
| texture.register-trajectory | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.part-roles | OK | OK | reading |
| texture.piano-role | OK | OK | reading |
| mark.extended-technique | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| mark.glissando | OK | OK (held files: 5 `<glissando>`, 1 `<slide>`, no "gliss." words) | measured: build/cr/a7.py |
| texture.latin-pattern | WRONG minor (S3): no family declares any of the kinds listed (latin_groove declares a clave, bass_cell a habanera cell); absence by family | WRONG minor (F13): marking stands, but part of the residual is a rule or source still to write, not a question an agent can answer per item; drop that clause from the agent's question (cells still to be quoted) | measured: build/cr/a9.py |
| coordination.synchrony-share | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| coordination.rhythmic-independence | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| coordination.unequal-rates | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| coordination.articulation-conflict | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| coordination.dynamic-balance | OK | OK | reading |
| coordination.register-overlap | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| coordination.pedal-with-hands | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| coordination.sustain-vs-move | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| coordination.hand-interval | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.motion | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| texture.alternating-hands | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| technique.hand-crossing | OK | OK | reading |
| technique.scale-run | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| technique.arpeggio-run | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| technique.arpeggio-chord | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| technique.thumb-under | WRONG material (S6): "the generator's verified fingering" exists in 424 of 1211 files; `fingeringVerified` is false for 134 recipe items; 65 files without fingering hold a stepwise run of six or more notes in one direction in one voice, and the 25 two-octave seventh arpeggios without fingering need thumb passes. Correct: code where fingering is printed; elsewhere code + agent, the same residual as PDMX (does the run need a thumb pass or a shift) | OK | measured: build/cr/a1.py, a2.py |
| technique.finger-independence | OK | OK | reading |
| technique.span | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads; 37 of the 90 disagreements have the stored reader at 0 (reader failures, among them the voice-collision hymns) | measured: inline split of results.json, build/cr/a4.py |
| technique.leap-size | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads (my split: 224 PDMX disagreements, cell 226) | measured: inline split of results.json |
| technique.displacement-rate | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| technique.fingering-demand | WRONG material (S6, F12): fingering is printed in 424 of 1211 files only, and the residual "awkward sequences, no validated cost model" is the very reason PDMX is marked a gap: one judgement cannot be an agent question here and a gap there. Correct: code for substitutions and stretches where fingering is printed; awkwardness a gap in both pipelines (or an agent question in both, once Phase 3 writes and reviews it) | OK (gap); minor: "no fingering solver is installed" is availability, not possibility; published estimators exist, but they estimate and are not validated here, so the gap stands | measured: build/cr/a2.py; reading for the gap |
| technique.pedal-implied | OK | OK | reading |
| mark.dynamics | OK | OK (held files: 4 type dynamics as words, a closed list) | measured: build/cr/a7.py |
| mark.hairpin | OK | OK | reading |
| mark.articulation | OK | OK | reading |
| mark.slur | OK | WRONG minor (S9): the definition counts per hand but the cell says code per staff; either define it per staff (it is printed per staff) or inherit the hand like the other per-hand rows (count per hand) | reading |
| mark.pedal | OK | OK (80 held files carry `<pedal>`, 1 types "Ped." as words) | measured: build/cr/a7.py |
| mark.pedal-kind | OK | OK | reading |
| mark.ornament | OK | OK (35 held files carry `<trill-mark>`, none types "tr" as words) | measured: build/cr/a7.py |
| mark.arpeggiate | OK | OK | reading |
| mark.tremolo | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| mark.fermata | OK | OK | reading |
| mark.expression-text | OK | OK (note S2: the music21 round-trip added words, 311 to 437 in 18 files; count by time and text, not by element) | measured: build/cr/rt.py |
| expression.character | OK | OK | reading |
| form.length | OK | OK | reading |
| form.sections | OK | OK | reading |
| form.phrase | OK | OK | reading |
| form.period | OK | OK | reading |
| form.twelve-bar | OK (boogie, walking_bass and meter declare `form: blues`; the 6 recipe-less blues shuffles print `<harmony>`) | OK | measured: build/cr/a9.py, a2.py |
| form.turnaround | OK | OK | measured: build/cr/a2.py (turnaround prints `<harmony>`) |
| form.intro-ending | OK | OK | reading |
| form.multi-strain | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| form.thirty-two-bar | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | WRONG minor (F13): marking stands, but part of the residual is a rule or source still to write, not a question an agent can answer per item; drop that clause from the agent's question (the ABAC rule is to be written) | measured: build/cr/a9.py |
| form.binary-ternary | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| form.variations | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| form.sonata | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| form.rondo | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| form.fugue | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| form.song-sections | WRONG minor (S3): only comping (`form`: ii-V-I, latin-vamp) and intro declare anything section-like; no family declares verse, chorus or bridge | OK | measured: build/cr/a9.py |
| form.improvisation-space | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | OK | measured: build/cr/a9.py |
| style.evidence | OK | OK | reading |
| style.genre-label | OK | OK | reading |
| meta.composer-era | WRONG minor: "generated items have no composer" is false for the 60 hanon items (composer Charles-Louis Hanon); code by the same lookup | OK | measured: catalogue composer field (inline) |
| meta.genre-tags | OK | OK | reading |
| meta.title | OK | OK | reading |
| meta.collection | OK | OK | reading |
| meta.published-grade | OK | OK | reading |
| meta.familiarity | OK | OK | reading |
| meta.arrangement | WRONG minor: "generated items are originals" is false for the 60 hanon items (Hanon's published exercises re-engraved, with hands-separate splits); code from the record | OK | measured: catalogue composer and arranger fields (inline) |
| generated.spec-declared | WRONG minor: 7 generated items carry no recipe (the six twelve-bar blues shuffles and exercise.reading.steps-and-skips-c); code reports "no spec" there; the per-family meaning of `key` (root, starting note, tonic) is still unstated | OK | measured: build/cr/a1.py |
| style.dance-type | WRONG minor (S3): no generator family declares this; the mark stands by the absence convention, but the reason "the recipe declares it" is false: say "absent by the family list; code over the file" | WRONG minor (F13): marking stands, but part of the residual is a rule or source still to write, not a question an agent can answer per item; drop that clause from the agent's question (cells still to be quoted) | measured: build/cr/a9.py |
| meta.keyboard-sound | OK | OK | reading |
| difficulty.reading | OK | OK | reading |
| difficulty.rhythm | OK | WRONG minor (S8): inherits rhythm.syncopation, which is code (to be validated) | reading |
| difficulty.pitch-navigation | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| difficulty.coordination | OK | OK | reading |
| difficulty.technique | OK | OK | reading |
| difficulty.harmonic-load | WRONG minor (S5): "the recipe's chords" holds only where `<harmony>` (327 files) or a declared progression (204 items) gives them; about 56 chordal items (study 24, pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3, hanon 3) declare neither, so there the chord timeline is the notes path: code + agent until the generator emits its progression | OK | measured: build/cr/a2.py |
| difficulty.expressive | OK | OK | reading |
| difficulty.perceptual | OK | OK | reading |
| difficulty.level | OK (gap); minor: "not downloaded" is availability; with CIPI a model still estimates with error, so the gap stands | OK (gap), as generated | reading |
| difficulty.local-profile | OK | WRONG minor (S1): marking stands; the cited "159 of 421" is mostly music21 voice-number reuse, true cross-staff writing is in at most 29 of 421 two-staff files (and voice-number collisions in 4 hymns): correct the count and let code flag the files the agent reads | measured: build/cr/a4.py |
| quality.coherence | OK | OK | reading |
| quality.idiomatic | OK | OK | reading |

## Section-level findings on 1.M

Ordered by consequence. "Material" means it changes what code or an agent is trusted with.

**S3 (material). Generated items: the recipe is treated as the verification, against the list's own rule.** `generated.spec-declared` says the recipe is declared intent "kept only as a declared input that the music rows check". Yet about 60 generated cells rest on the recipe alone ("the recipe's key", "the recipe's chords", "the recipe declares it"). Measured:
- The proving run found 100 of 1,134 compared recipes disagreeing with their files: arpeggio7 55, broken7 33, chromatic 12. In each, the recipe's `key` is a chord root or a starting note, and the file prints no signature.
- 7 generated items carry no recipe at all: the six twelve-bar blues shuffles and `exercise.reading.steps-and-skips-c`.
- The recipe fields are much narrower than the cells assume (`a9.py`, over 59 families):
  - a progression is declared by 11 families (204 items);
  - a mode only by scale and chromatic (`quality` in 5 more);
  - a voicing only by seventh_voicing and cadence;
  - a form only as blues, minor-blues, ii-V-I or latin-vamp;
  - nothing declares a phrase plan, a dance, a tone row, bitonality, hemiola, imitation, a cadenza, half time, an extended technique, a chord-scale, a reading aid or any of the Latin kinds in `texture.latin-pattern`.

Correction: a generated "code" cell means code over the file, with the recipe as a cross-check where it declares the fact (they agree: verified; they disagree: a generator or reader defect). A row no family declares is code by 1.M's absence convention, and its cell should say "absent by the family list", not "the recipe declares it". The family contracts that `generated.spec-declared` says are "still to be stated per family" are a precondition of every recipe-based cell. Rows: the S3, S4 and S5 verdicts in the table.

**S4 (material). The key on generated items.** The cell for `key.tonic-mode` reads the key off the recipe. In arpeggio7, broken7 and chromatic the recipe's `key` is a root or a starting note, and the rhythm, clave and 5/4 items have no key. Read off the recipe, an A diminished-seventh arpeggio would carry the key "A". Correct: take the key from the file's `<key>` and the catalogue's keySig, and answer "no key" where the family has none. The rows that read the key inherit this: `pitch.chromatic`, `melody.degree-profile`, `harmony.roman`, `integrity.notation-sanity`, the tonic-to-dominant test of `technique.five-finger`. A smaller, definitional point: blues-form items print a major signature, so against a major scale every blue note is "chromatic". The mode set (major, minor) has no value for them.

**S5 (material). The chord timeline on generated items is a shared question too, smaller than PDMX's.** `<harmony>` is printed in 327 of 1,211 generated files, and a progression is declared for 204 items. About 56 chordal items declare neither: study 24 (a declared harmonic rhythm and no chords), pedal_variant 8, ostinato 6, voicing 5, bass_cell 4, modal_vamp 3, tresillo 3 and hanon 3. triad_inversions (24) derive their chord from key and quality. For those 56, the chords come from the notes path, the same path the PDMX column hands to an agent (agreement 0.86 with symbols on resolved beats, rules/harmony.md, not re-run). The study items are the reading pieces most likely to be fitted to harmony abilities. Correction: generated harmony rows are code where `<harmony>` or a declared progression agrees with the notes. The rest inherit the notes path's residual until the generator writes its progression into the recipe or the file. 1.M's "the one judgement that sets most PDMX markings" paragraph should name the generated chord question beside the PDMX one.

**S6 (material). Fingering on generated items.** The cells for `technique.thumb-under` and `technique.fingering-demand` rest on "the generator's verified fingering". Measured (`a1.py`, `a2.py`):
- Fingering is printed in 424 of 1,211 files: scale 252, arpeggio 60, seventh_arpeggio 35 of 60, hanon 60, chromatic 16, one blues shuffle.
- `fingeringVerified` is false for 134 recipe items: broken_seventh 36, seventh_arpeggio 25, octave_scale 25, blues_scale 16, repeated_notes 12, tremolo 12, double_scale 8.
- 65 files without fingering hold a stepwise run of six or more notes one way in one voice: accompaniment 15, octave_scale 15, shaping 10, articulation 8, double_scale 8, slash_bass 4, meter 2, syncopation 2, secondary_rag 1.
- The 25 two-octave seventh arpeggios without fingering need thumb passes that nothing printed shows.

Correction: code where fingering is printed; elsewhere the PDMX residual applies to generated items too. The 1.M list "Generated items: the code + agent rows" should gain `technique.thumb-under`.

**S1 (the hand: evidence and scope wrong, the marking stands).** 49 PDMX cells and 1.M's paragraph on the hand cite "cross-staff notes in 159 of 421 two-staff PDMX files". The noise scan counted any voice number with notes on both staves. On the held files those numbers are music21's: it numbers voices bar by bar and reuses them across staves. Measured over the same 421 files (`a3.py`, `a4.py`, `a6.py`):

| what the 159 files are | files |
| --- | --- |
| a voice number on one staff in some bars and on the other staff in others, never split inside a bar (Bach Invention 8: voice 2 on the bass staff, on the treble in bars 3 and 18) | 127 |
| one voice moving between the staves inside a bar in time order: true cross-staff writing (Asturias, Bach transcriptions, Mendelssohn op. 19 no. 1) | at most 29 |
| one voice number on both staves at overlapping times: voice-number collisions in three four-part hymns (Abide with Me, O Sacred Head, Amazing Grace SATB) and one rag (At a Georgia Camp Meeting) | 4 (the rag is also among the 29) |

- The two `texture.hands-together` PDMX disagreements are the two collision hymns, where the stored reader returns null.
- 37 of the 90 `technique.span` PDMX disagreements have the stored reader at 0.
- So the 38% in the cells is 7% for cross-staff writing.

The code + agent marking stands, because an unmarked crossing written on the other hand's staff is still invisible to code. The scope changes: code flags the files and passages (a voice split inside a bar, a collision, hand words in 5 files, a staff's chord beyond one hand's reach), and the agent reads only those. 1.M's sentence "The agent settles the hand once per item" should become "once per flagged passage", with the flags named. The 0 of 1,187 generated stands: no generated voice leaves its staff.

**S2 (minor, but it changes what "raw MusicXML" means for PDMX). The PDMX files the classifier reads are music21 re-exports.**
- All 556 files in `content/scores/pdmx` carry `<software>music21 v.10.5.0</software>`, and `tools/content/pdmx/commit.py` says it writes "converted, normalised" files.
- So the elements music21's import drops are absent from every held file: `<swing>` 0, `<figured-bass>` 0, `cautionary` 0, `<sound>` jump attributes 0 (`a7.py`). The list's "routes that find nothing" therefore covers raw-MusicXML routes too, on this pipeline.
- The noise-scan statements about uploaders describe music21's output, not the uploads, for example "none of the 38 carries a `<sound>` jump".

The round-trip of 18 MuseScore files (`rt.py`) shows what else the normalisation changes:

| element | original files | re-exports |
| --- | --- | --- |
| printed accidentals | 2,188 | 2,188 |
| `<dynamics>` | 587 | 587 |
| `<fingering>` | 163 | 154 |
| `<wedge>` | 407 | 395 |
| `<slur>` | 2,184 | 2,170 |
| `<octave-shift>` | 76 | 74 |
| `<words>` | 311 | 437 |
| `<harmony>` | 32 | 64 (Bella Ciao: one symbol written above each staff) |

- In the held files, 33 of 110 with symbols carry 1,399 of 5,864 symbols at a duplicate time (`a10.py`).
- 2 of 20 files cannot be exported at all, so such uploads never reach the catalogue.

The PDMX "code: exact X" cells stay right in the sense that matters: the app serves and renders the held file, so the learner meets the held file. But a chord-symbol count is inflated without de-duplication, and the PDMX pipeline should be defined in 1.M as "the held music21 re-export". Whether the app draws the duplicated chord symbols twice was not looked at; it is a product question outside this review, flagged here.

**S7 (minor; resolves proving-run disagreements).** The generated rhythm (18) and clave (10) items write pitched B4 notes on a one-line staff with a percussion clef, not `<unpitched>`. All 5 generated `clef.bass` disagreements, all 5 generated `pitch.ledger` disagreements and 5 of the 9 generated `texture.walking-bass` disagreements are the five clave ".pulse" items: the stored reader counts the percussion staff as bass-clef notes and a percussion pulse as a walking bass. The witness is right, so these "unresolved" cells are resolved as reader faults. Every pitch row must skip percussion and one-line staves. `item.format`'s `note.Unpitched` route finds none of the 28 items; staff-lines 1 with a percussion clef finds them.

**S8 (minor). Code validation handed to an agent.** `rhythm.syncopation` (58 reader disagreements), `difficulty.rhythm` (which inherits it), `texture.tremolo-thirds` ("the mark path is untested") and `rhythm.secondary-rag` ("finds none in Joplin, unresolved") are marked code + agent partly because two code readers disagree or a rule path is untested. An agent cannot answer "which reader is right" per item. It is a code defect to resolve in Phase 2 or 4, as 1.M already treats the unresolved clef, tie, habanera, tresillo and dotted disagreements (all marked code). Syncopation as defined is deterministic: mark it code (to be validated).

**S9 (minor). Per-hand rows marked code on PDMX.** 1.M's rule: a row that reports what one hand plays inherits the hand. Rows that break it:
- defined per hand, but marked code "per staff": `pitch.black-key-share`, `reading.pitch-entropy`, `reading.redundancy`, `rhythm.triplets`, `rhythm.bar-patterns`, `mark.slur`;
- read one hand in their rule or detector: `rhythm.habanera` and `rhythm.tresillo` (`detect.ts` `cellBars` reads hand L only, line 323), `texture.mazurka` (the figure "in the right hand"), `rhythm.shuffle` (a bar counts "when one hand has" the pairs).

For the reading statistics, the fix is the definition: per staff, as printed. For the rest, the marking should be code + agent (the hand).

**S10 (minor). The velocity disagreements are the beat unit.** All 9 generated `technique.velocity` disagreements are 6/8, 12/8 or 7/8 items with a ratio of exactly 2. So are 70 of the 88 PDMX disagreements (exactly 2 or 0.5). This is the metronome's beat unit (`mark.tempo-text`), which code reads, not the hand or a missing tempo. The cells' counts differ slightly from this split: PDMX velocity 88 (cell 89), leap size 224 (cell 226), clefs 8 (cell 9).

**S11 (minor). Lines in chordal voices.** 458 of 1,211 generated files have chords inside a voice. The 12 step and 18 skip disagreements are all cadence-root, waltz-accompaniment and held-melody items. "Lines written by voice" leaves the line undefined there for generated items as well as PDMX. A positional rule (the top and bottom lines of the chords) defines it, by code.

**F12 (material for one row). The gaps.**
- `technique.fingering-demand`: generated calls "whether a sequence is awkward has no validated cost model" a question for an agent; PDMX calls the same judgement a gap. One judgement cannot be both. The gap is the defensible reading: no validated model, and an agent's fingering judgement is unvalidated. So generated should be code for printed substitutions and stretches (424 files) and a gap for awkwardness. Alternatively, both pipelines become code + agent once Phase 3 writes and reviews that instruction. The PDMX gap's reason should not rest on "no solver is installed": published estimators exist, but they estimate.
- `difficulty.level`: a gap in both pipelines, rightly. Its reason ("not downloaded") is availability. With CIPI downloaded, a model still estimates with error, so it stays a gap. The owner's ruling that exact placement is not yet a worry ("we don't need to worry about exact placement yet") makes it a gap that blocks nothing now.
- No other row is a gap that code plus an agent could not close; and no row marked code + agent is one an agent cannot answer, except those in F13.

**F13 (minor). Residuals that are not agent questions.** Some PDMX residuals name a rule or source still to write:
- `texture.ostinato` (the transposed-figure test);
- `harmony.voicing` (upper structure, drop-2, locked hands, Bud Powell shells);
- `form.thirty-two-bar` (ABAC);
- `texture.latin-pattern` and `style.dance-type` (cells still to quote).

1.M's own convention says such a row is marked by what code could do once the rule is written. These clauses belong to Phase 2 and should leave the agent's question. `texture.half-time`'s residual ("the feel, low confidence from a score") is not a question an agent can answer by reading; the table gives a statable form. The other code + agent residuals were read one by one and can each be answered from the score, the coded facts or the web as stated.

**The shared questions, scope.**
- **Hand**: right in kind, wrong in size and in where it applies (S1). It also misses rows that read one hand (S9).
- **Chord**: on PDMX, besides "where no symbols are printed", it should cover symbols present but duplicated by the re-export (S2), and symbols that contradict the notes (guitar-capo or simplified symbols). On generated items it exists too, for about 56 items (S5).
- **Key**: right for PDMX. On generated items, the recipe is the wrong source for 100 measured items (S4).

**1.M's counts.** Recounted by `parse.py` over section 1:
- generated: code 202, code + agent 10, gap 1;
- PDMX: code 51, code + agent 159, agent 1, gap 2;
- evidence: generated 67 measured, 3 in part and 143 reading; PDMX 97 measured, 4 in part and 112 reading.

All match 1.M. The "hand" list holds the 49 rows that cite the 159 count.

**What follows if the corrections are applied** (this reviewer's tally, not applied here):
- generated: `technique.thumb-under` becomes code + agent; the awkwardness part of `technique.fingering-demand` becomes a gap; `harmony.roman` and its dependents become code + agent for the families that declare no chords.
- PDMX: `rhythm.syncopation` and `difficulty.rhythm` become code; the nine S9 rows become code + agent or are redefined per staff.

**Not done.**
- No PDMX original (the dataset's `mxl.tar.gz`) was available, so what the uploads hold is inferred from the round-trip of 18 MuseScore files, not measured on PDMX.
- The proving run's remaining disagreements (syncopation 58, tresillo, stride walking bass, waltz eighths) were not resolved.
- The `true` cross-staff count is an upper bound: a voice number reused inside one bar at non-overlapping times would count.
- No rule test was re-run.
- Nothing was heard.

## Counts (by `build/cr/assemble.py` over the table above)

- **generated** (213 rows): OK 159, WRONG material 4, WRONG minor 50, UNSURE 0 (sum 213).
- **PDMX** (213 rows): OK 136, WRONG material 0, WRONG minor 77, UNSURE 0 (sum 213).
- Evidence: measured 127 rows (including "measured in part"), reading 86.
- The two pipelines together (generated / PDMX): OK / OK: 88; OK / WRONG minor: 71; WRONG minor / OK: 44; WRONG minor / WRONG minor: 6; WRONG material / OK: 4.

| section | rows | generated OK | generated WRONG material | generated WRONG minor | PDMX OK | PDMX WRONG material | PDMX WRONG minor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.A | 26 | 21 | 0 | 5 | 18 | 0 | 8 |
| 1.B | 12 | 6 | 1 | 5 | 8 | 0 | 4 |
| 1.C | 30 | 27 | 0 | 3 | 18 | 0 | 12 |
| 1.D | 9 | 6 | 0 | 3 | 9 | 0 | 0 |
| 1.E | 19 | 5 | 1 | 13 | 18 | 0 | 1 |
| 1.F | 43 | 37 | 0 | 6 | 13 | 0 | 30 |
| 1.G | 12 | 11 | 0 | 1 | 3 | 0 | 9 |
| 1.H | 10 | 8 | 2 | 0 | 4 | 0 | 6 |
| 1.I | 12 | 12 | 0 | 0 | 10 | 0 | 2 |
| 1.J | 16 | 7 | 0 | 9 | 15 | 0 | 1 |
| 1.K | 12 | 8 | 0 | 4 | 11 | 0 | 1 |
| 1.L | 12 | 11 | 0 | 1 | 9 | 0 | 3 |

- Rows with a material verdict: `key.tonic-mode`, `harmony.roman`, `technique.thumb-under`, `technique.fingering-demand` (all on generated items); the section-level material findings are S3, S4, S5, S6 and F12. The hand finding S1 corrects the evidence and scope of 49 PDMX cells, not their marking.
- No UNSURE: every row was judged; where the judgement is a reading, the evidence column says so.
