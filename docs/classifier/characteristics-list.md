# Characteristics: the Phase 1b draft list (2026-10-08)

**The Phase 1b list after pass 1 of its checks (FABLE.md section 2, item 1b).** One agent looked for what is missing and another argued against each row (`docs/classifier/audits/characteristics-pass1/missing.md` and `rows.md`); their findings were applied on 2026-10-08, each marked applied, dropped or not applied in `docs/classifier/audits/characteristics-pass1/applied.md`. Whether the list is comprehensive is the orchestrator's judgement, not made here. Worktree cut from origin at c5265c57.

**What this is.** The characteristics of music that code or an agent can detect in an item (its MusicXML score, or the item and its metadata), listed so the next step can attach them to the abilities. The owner's goal, 2026-10-08, begins: "find characteristics of music that we can detect by code or agent". The rest of the sentence: to attach them to abilities so that what is taught is taught right. Attaching characteristics to abilities is the next step, not this one (the owner, through the coordinator, 2026-10-08), so this list has no "abilities it serves" column.

**How the list was built.** In this order:
1. The 237 rows of `characteristics.yaml`: each kept, merged, corrected or retired (section 2).
2. The library feature sets, read by import in `.venv` (music21 10.5.0, partitura 1.9.0) on 2026-10-08:
   - music21's 92 feature extractors (`features.extractorsById('all')`: 20 native, 72 jSymbolic);
   - its expression, articulation, spanner, dynamics, tempo, repeat, harmony, roman, chord, voiceLeading, analysis and scale classes;
   - partitura's note-array fields, its 19 note-feature functions, its `estimate_*` functions and its score classes.
3. jSymbolic 2.2's published feature catalogue [JS].
4. The syllabi's own vocabulary of musical elements: the ABRSM sight-reading parameters table [ABRSM-SR], Trinity's parameters for sight reading tests [TCL-SR], and the RCM and Trinity Rock & Pop syllabi. The first two were read in the text copies earlier passes downloaded.
5. Abilities.md section 1, scanned once at the end as a cross-check (section 4 names what the scan added).
6. Pass 1 of the checks, 2026-10-08: 18 proposed characteristics and 18 missing parts of existing rows added; every row verdict applied or answered (section 4 and the applied record).

A library feature is listed only where it says something a piano learner meets in the music (a demand, a pattern, a style trait, difficulty). The statistical features left out are named in one line in section 4.

**Conventions.**
- **Output.** Every characteristic reports, where it applies: present, absent or UNKNOWN; its count; its bar and beat positions; and the hand. The hand is the staff unless `prereq.hand-assignment` says otherwise. Each part a row names (for example each pattern kind) is reported separately, so that evidence for one part never certifies another. A target's prevalence, spread, concentration, salience (staff, beat strength, chord membership, and where a note sits in a chord: top, inner or bottom) and co-occurrence with other rows are computed from these outputs. They are not separate characteristics (section 2: `target.*`).
- **"Detected by."** "code" names the library and feature (every API name checked by import in `.venv`, or by reading the library's source, on 2026-10-08), or says "custom" where no library feature serves. "agent" says what the agent reads. "both" means code establishes what it can and an agent settles the rest, which is named.
  - music21's jSymbolic extractors count a Part as a MIDI channel, so on one piano part their voice and texture features say little. They are named only as second witnesses.
  - jSymbolic's chord (C-) and voice-motion (T-13 onward) features are not among music21's 72. The jSymbolic Java tool is not installed. Where they are cited, they are cited as definitions only.
- **Sources.** Each row's source is the definition it rests on, as a key resolving in the table below. "Operational (this list)" marks a definition written here because no published one was found or read; such a row needs its source in the checks. Rules pages (`docs/classifier/rules/*.md`) carry their own quoted sources. A source marked "to be quoted", "not read" or "DRAFT" is named but not read; its text is quoted before a rule is written. A page cited from Open Music Theory that does not hold the cited point is marked so in its row.
- **Routes that find nothing.** music21's MusicXML import does not read `<swing>`, `<figured-bass>` or the `cautionary` attribute of `<accidental>`, and gives tempo words, rit. and accel. as `TextExpression`, never as `tempo.TempoText` or the tempo spanners; partitura parses tempo words and cresc. into its direction classes. `Stream.analyze('key')` runs the Aarden-Essen method in music21 10.5. A row whose only named route is one of these finds nothing; each such row names the raw MusicXML or partitura (pass-1 checks, measured on a five-line synthetic file and by reading the sources).
- **Provenance.** Every `meta.*` value carries its provenance (the catalogue record, a lookup, an agent's reading or a generator's spec); a value without it is not reported (section 2: integrity.metadata-trust).
- **The written pitch.** Rows that read a note's place on the staff (ledger lines, line or space, hand position) read the displayed pitch: under an octave shift the MusicXML `<pitch>` is the sounding pitch, so the shift is subtracted.

| key | source | URL |
| --- | --- | --- |
| MXL-x | MusicXML 4.0 reference, element `x` (W3C Community Group) | https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/x/ (for example `.../elements/pedal/`) |
| M21 | music21 module reference (the class or function named in the row) | https://www.music21.org/music21docs/moduleReference/index.html |
| M21-JS | music21.features.jSymbolic | https://www.music21.org/music21docs/moduleReference/moduleFeaturesJSymbolic.html |
| PT | partitura, musicanalysis module (note array, `estimate_*`, note features) | https://partitura.readthedocs.io/en/latest/modules/partitura.musicanalysis.html |
| JS | jSymbolic 2.2 feature explanations (McKay), feature codes as printed there | https://jmir.sourceforge.net/manuals/jSymbolic_manual/featureexplanations_files/featureexplanations.html |
| OMT-p | Open Music Theory (Gotham et al.), page `p` | https://openmusictheory.github.io/p (for example `.../cadenceTypes.html`) |
| ABRSM-SR | ABRSM Piano Practical Grades 2025 & 2026, "Sight-reading parameters" table (p.16; text read from a copy in an earlier pass's build) | https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20&%202026%20Prac%20syllabus%2020240524_access.pdf |
| TCL-SR | Trinity College London, Piano syllabus, "Parameters for sight reading tests" (PDF p.81; text read from pass 2's copy) | https://www.trinitycollege.com/resource?id=9079 |
| TCL-RP | Trinity Rock & Pop Keyboards syllabus (chord charts, lead sheets, pop textures) | https://trinitycollege.com/resource?id=7900 |
| RCM | RCM Piano Syllabus, 2022 edition (lead sheets, Keyboard Harmony, forms) | https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/about%20us/rcm%20publishing/piano-syllabus-2022-edition.pdf |
| LEV | Mark Levine, *The Jazz Piano Book* (publisher's sample and contents) | https://www.jazzbooks.com/mm5/samples/D-JP.pdf |
| WP-x | Wikipedia article `x`, used where the rules pages already rest on it or as a stand-in for the published definition it cites; a weaker source, to be replaced by the cited text in the checks | https://en.wikipedia.org/wiki/x |
| RULES-x § id | this project's rules page `docs/classifier/rules/x.md`, section `id`, with the published definition quoted there | (repository file) |
| RUB | RubricNet: Ramoneda, Eremenko, D'Hooge, Parada-Cabaleiro and Serra (2024), arXiv 2408.00473 (abstract and HTML fetched in pass 1). It reports Chiu and Chen's (2012) pitch entropy and displacement rate; its "Pitch Set LZ" is its own descriptor | https://arxiv.org/abs/2408.00473 |
| SEB | Sébastien et al. 2012, Score Analyzer, Table 1, as cited in `characteristics.yaml` (Table 1 read in pass 1 from a text copy; URL not checked) | not checked |
| KP | Kostka and Payne, *Tonal Harmony* (edition and page not read in this pass); Green is cited the same way where a row names it | not checked |
| DRAFT | a syllabus coverage table in one of the abilities drafts (`docs/classifier/abilities/draft-x.md`, section n), which names a source this list has not read | (repository file) |
| DIFF | `tools/content/difficulty.py` FEATURE_NAMES (this project's code; no published definition) | (repository file) |

## 1. The list

"(new)" marks a row not in `characteristics.yaml`. Every other id is the yaml's, kept or corrected (section 2); `integrity.notation-sanity` is the yaml's, reinstated in pass 1.

### 1.A The item and its score

| id | what it is (defined so two readers measure the same thing) | detected by | source of its definition |
| --- | --- | --- | --- |
| item.format (new) | The kind of score the item is, as two values reported separately. **Layout**: **piano score** (every note written, on a grand staff or on one staff per hand); **lead sheet** (one melody staff with chord symbols, no written accompaniment); **chord chart** (chord symbols or slash notation, no melody); **piano-vocal-guitar song score** (a vocal staff with lyrics over a piano grand staff, chord symbols above); **hymn or chorale in parts** (two to four voices on two staves, or open score); **piano part with other instruments** (other parts present, or a backing declared in the metadata); **pre-staff notation** (finger numbers or letter names without a staff). **Purpose**: **piece** (the default); **technical exercise** (a scale, arpeggio, chord pattern or drill); **rhythm exercise** (unpitched notes, often on a one-line staff, to clap or tap; one or two hands); **duet part** (primo, secondo or teacher part). A Czerny exercise is a piano score in layout and a technical exercise in purpose, which one value could not hold | both: code from music21 `Score.parts` and `layout.StaffGroup`, `harmony.ChordSymbol` presence, `note.Lyric` per staff, `instrument.Instrument` per part (music21 `PitchedInstrumentsPresentFeature` as a second witness); for the rhythm exercise, music21 `note.Unpitched`, partitura `UnpitchedNote` and `layout.StaffLayout.staffLines == 1` (checked to exist); agent where the shapes are ambiguous (a written accompaniment under a sung melody: piano score or song score), and for pre-staff notation, which MusicXML does not encode | TCL-RP (chord charts and lead sheets as score formats); RCM (lead-sheet tests); MXL-staves; MXL-harmony; MXL-staff-lines (rhythm exercise); RCM sight-reading rhythm and ear clapback (DRAFT: draft-rcm § 2); hymn and song-score layouts as the abilities' sources describe them (abilities.md AB-193, AB-230) |
| notation.staves | Number of staves in the piano part (one or two, rarely three), and number of parts in the file | code: raw MusicXML `<staves>`; music21 Part count; partitura `Part.note_array(include_staff=True)` field `staff` (checked: the field is absent from `compute_note_array`'s default output; `feature_functions=['staff_feature']` adds it) | MXL-staves |
| prereq.hand-assignment | Which hand plays each note: by staff by default, changed by printed hand words (m.d., m.s., r.h., l.h.), by notes written on the other hand's staff (cross-staff), or by a one-staff item's declared hand | both: code from partitura `staff`, music21 `expressions.TextExpression` for the words, raw `<staff>` on each note; agent where a one-staff item or a hand word is ambiguous | MXL-staff |
| texture.melody-location (new) | Where the melody is, per phrase: which hand, and which voice (top, inner or bass), carries the main line. Includes a melody passed from one hand to the other within a phrase (hand exchange), and a left-hand melody under a right-hand accompaniment | both: code takes candidate lines per staff (the top line from music21 `Stream.chordify`, voice lines from partitura `estimate_voices`) and the staff carrying lyrics or most single-note onsets; agent decides melody against accompaniment where both hands are active | WP-Homophony (melody with accompaniment); operational (this list) for hand exchange |
| notation.clefs (new) | The clefs used on each staff (treble, bass, other), including a treble clef in the left hand or a bass clef in the right hand, and the number of notes read in each clef on each staff (so that reading in the bass clef is located, as the app's `detect.ts` bassClef does) | code: music21 `clef.TrebleClef`, `clef.BassClef` and the clef in force at each note (custom); partitura `clef_feature` | MXL-clef |
| notation.clef-change | Clef changes within a staff: count and position, at a bar line or inside a bar | code: music21 clef objects with their offsets | MXL-clef; ABRSM-SR ("clef changes", Grade 6) |
| pitch.ledger | Notes on ledger lines, per staff, counted at the displayed position (a note under an octave-shift span is written lower or higher than it sounds, so the shift is subtracted): count, the most ledger lines on one note above and below the staff, and middle C on a ledger line counted separately | code: custom from the written pitch, the clef and any `<octave-shift>` span (the app's `detect.ts` ledgerLines reads the written letter; music21 `spanner.Ottava` and the pitch against the clef as a second witness) | WP-Ledger_line; MXL-octave-shift |
| mark.ottava | Octave-shift spans (8va, 8vb, 15ma, 15mb) and loco: kind, length in bars, staff | code: music21 `spanner.Ottava`; partitura `OctaveShiftDirection` | MXL-octave-shift; ABRSM-SR ("8va sign", Grade 7) |
| notation.keys | The key signatures: number of sharps or flats, and every change with its position | code: music21 `key.KeySignature`; partitura note-array fields `ks_fifths`, `ks_mode` | MXL-key; ABRSM-SR and TCL-SR (keys by grade) |
| key.signature-exercised | How many notes the key signature alters, per altered degree, and where those notes are (a signature can be printed and never exercised); this row also carries the located notes of the former key.signature, which the app's `detect.ts` keySignature measures | code: music21 `KeySignature.alteredPitches` counted against the notes | MXL-key |
| pitch.chromatic | Notes whose pitch is outside the scale of the key as sounded (`key.tonic-mode`; the key signature's scale where the two agree), per bar and per hand, split into the raised notes of a minor key (from `key.minor-form`) and other chromatic notes. Against the signature alone, every B natural of a Dorian-signature Baroque piece would count as chromatic | code: music21 pitch and `Accidental` against `KeySignature.alteredPitches`; partitura `estimate_spelling` as a second witness | ABRSM-SR ("chromatic notes"); TCL-SR (minor keys with their raised notes) |
| reading.accidental-kinds | Printed accidentals by kind (sharp, flat, natural, double sharp, double flat), courtesy accidentals, and accidentals that carry through a bar or across a tie without being reprinted | code: music21 `pitch.Accidental` `.name` and `.displayStatus` (checked); courtesy (cautionary) marks only from raw `<accidental cautionary>`, which music21's import does not read (a TODO in its source) | MXL-accidental; TCL-SR (double sharps and flats) |
| reading.accidental-churn | Accidentals that cancel and return within one bar at the same staff position (the same letter name and octave on one staff: an accidental holds for that position only) | code: custom per bar from music21 accidentals | operational (this list) |
| reading.visual-density | Per staff per bar: notes, simultaneous notes per onset, accidentals and ledger-line notes | code: custom over partitura's note array (DIFF `notesPerBar`, `voicesPerStaff`, `ledgerRatio` exist); jSymbolic R-10 as the published definition of note density per quarter note | JS R-10; DIFF |
| reading.unusual-notation | Constructs a reader meets rarely, in a closed list, other than those with their own row (clef change, extended technique, cadenza): cue-size notes; cross-staff notes and cross-staff beams; nested tuplets; noteheads other than the normal one, each named by its MusicXML `<notehead>` value | code: raw MusicXML (`<cue>`, `<staff>` on notes inside one beam, nested `<tuplet>`), music21 `note.Note.notehead` | MXL-cue; MXL-notehead |
| reading.pitch-entropy | Shannon entropy of the pitch distribution per hand (how varied the pitches are). A difficulty input, not a teaching target | code: scipy `stats.entropy` over partitura's note array | RUB (reporting Chiu and Chen 2012) |
| reading.redundancy | Lempel-Ziv (LZ76) complexity of the pitch-set sequence per hand: how repetitive the item is | code: custom LZ76 count (the `lempel_ziv_complexity` package is not installed) | RUB (its own "Pitch Set LZ" descriptor, not Chiu and Chen's) |
| notation.turn-opportunity (new) | Turn opportunities: spans in which one hand rests, or holds a note or tied chord, long enough for that hand to turn a page while the other plays on. Per span: its bar and beat, its length in beats, and which hand is free; and the longest stretch of the item with no such span (where a page cannot be turned without breaking the pulse). Printed page breaks are not read: they belong to one engraving, and the app renders its own pages | code: custom over onsets, durations and rests per staff (partitura note array; music21 `note.Rest`); the length that suffices for a turn is a rule (Phase 2) | operational (this list); the page-turn rule of ABRSM at all grades (abilities.md AB-229, N22) |
| mark.fingering | Printed finger numbers: count, share of notes fingered, fingering on the first note only, substitutions (two fingers on one note) and alternates | code: music21 `articulations.Fingering` with `fingerNumber`, `substitution`, `alternate` (checked on an instance); partitura `Fingering` | MXL-fingering |
| notation.lyrics | Words under the notes: on which staff, how many verses (lyric numbers) | code: music21 `note.Lyric` (with its number) | MXL-lyric |
| notation.chord-symbols | Printed chord symbols: count, positions, the symbol system (letter-name symbols, slash chords, Roman numerals or Nashville numbers written as text), and whether they sit over a melody or stand alone; and the "N.C." (no chord) marks, counted and placed apart | code: music21 `harmony.ChordSymbol` from MusicXML `<harmony>` (parsed structurally; music21's text parser spells a flat "-" and rejects "Cm7/Bb": checked); partitura `ChordSymbol`; music21 `harmony.NoChord` for "N.C." (checked to exist); agent for symbols written as plain text | MXL-harmony (kind "none" for N.C.); WP-Nashville_Number_System |
| harmony.figured-bass (new) | Printed figured-bass figures under a bass line: count and the figures used (5/3, 6/3, 6/4, 7 and others) | code: raw MusicXML `<figured-bass>` only; music21's MusicXML reader skips the element (`'figured-bass': None` in the measure dispatch, `xmlToM21.py` line 2409) | MXL-figured-bass; OMT-thoroughbassFigures.html |
| mark.repeat | The repeat structure, each kind named: repeat bar lines, first and later endings, D.C., D.S., al Fine, al Coda, Segno, Coda, Fine; and the bars played once repeats are expanded | code: music21 `bar.Repeat`, `spanner.RepeatBracket`, `repeat.DaCapo`, `DalSegno`, `Segno`, `Coda`, `Fine`, `repeat.Expander`; partitura `Repeat`, `Ending`, `DaCapo`, `DalSegno`, `Segno`, `Coda`, `Fine` | MXL-repeat; MXL-ending; MXL-segno; MXL-coda |
| notation.reading-aids (new) | Printed beginner aids, each kind named and counted: letter names inside or beside noteheads; counting printed under or over notes (beat numbers, "1 & 2 &"); a finger number on every note (from `mark.fingering`'s share); shape or coloured noteheads | both: code from raw MusicXML `<notehead-text>` and `<notehead>` values and music21 `note.Lyric` text matched against counting syllables and letter names; agent where the aid is in an image or a non-standard encoding | MXL-notehead-text; MXL-lyric; method-book practice as abilities.md AB-022 and AB-038 cite it (Alfred 1A p.24 for counting) |
| notation.slash-rhythm (new) | Rhythm slashes in a part: beat slashes (stemless: play in time, rhythm free) and rhythmic notation (slash noteheads with stems and beams: comp in this rhythm); count and kind, and the rhythm they prescribe | code: music21 `note.Note.notehead == 'slash'` (checked: the value sets); raw MusicXML `<notehead>slash</notehead>` and `<measure-style><slash>` | MXL-notehead; MXL-slash; TCL-RP (chord charts) |
| integrity.notation-sanity | Engraving correctness of the written score, each kind reported as a candidate with its count and positions: a note spelled wrongly for its key and context (A sharp where B flat is wanted in F major), and beaming that does not follow the metre. A misspelt or mis-beamed note teaches wrong reading (the owner's rule: never teach anything wrong). Reinstated in pass 1; it was retired as a build check, and no code exists for it today (the yaml: MISSING) | both: code compares the written spelling with partitura `estimate_spelling` on the same pitches and with the key (`key.tonic-mode`), with music21 native `IncorrectlySpelledTriadPrevalence` (CS11) as a witness, and compares beam groups with music21 `TimeSignature.beamSequence`; agent settles each candidate (a deliberate enharmonic spelling is not an error) | operational (this list); CLAUDE.md, "Never teach anything wrong"; MXL-beam |

### 1.B Pitch, range, keys and scales

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| hands.per-bar-range | Per hand: lowest and highest note and the span in semitones, per bar and over the item; the item's whole compass; the share of notes in the low, middle and high registers; notes outside the 88 keys (A0 to C8) flagged | code: music21 `analysis.discrete.Ambitus` (checked), partitura `pitch` and `staff`; music21 `RangeFeature`, `ImportanceOfBassRegisterFeature`, `ImportanceOfMiddleRegisterFeature`, `ImportanceOfHighRegisterFeature` as second witnesses | JS P-8, P-9 to P-11 |
| pitch.black-key-share (new) | The share of notes on black keys, per hand | code: custom from the pitch class (DIFF `blackKeyRatio`) | DIFF (operational; no published definition read) |
| technique.five-finger | The hand-position class of each hand per passage without a shift: **five-finger** (span at most 7 semitones and at most five distinct pitches: a chromatic run from C to G spans 7 semitones with eight pitches and needs a shift or a substitution), **extended** (a sixth, 8 or 9 semitones), or **beyond** (a shift needed); the named position (its lowest note: C, G, Middle C with the thumbs sharing middle C); and whether it runs tonic to dominant in the key. RULES-texture § technique.five-finger defines whole-item presence only: the extended class, the named positions and the distinct-pitch test are to be written | code: custom over partitura's note array (the app's `detect.ts` beyondPosition is its negation) | RULES-texture § technique.five-finger; ABRSM-SR (hand position column) |
| technique.position-shift | Lateral travel between hand positions: a shift wherever the next notes cannot be reached from the current position; count, size and the time allowed | code: custom over partitura's note array | RULES-texture § technique.position-shift |
| key.tonic-mode | The key as sounded, which may differ from the signature: tonic and mode (major or minor), with a confidence | both: code from music21 `Stream.analyze('key')` (which runs Aarden-Essen in music21 10.5; the Krumhansl-Schmuckler call is `analyze('key.krumhansl')`, a second witness), `features.native.TonalCertainty`, and partitura `estimate_key`; agent where the witnesses disagree or the music is modal | M21 (`analysis.discrete.AardenEssen`, `KrumhanslSchmuckler`); PT (`estimate_key`) |
| key.minor-form | Which minor form is in use: natural, harmonic (raised 7th) or melodic (raised 6th and 7th ascending) | code: RULES-harmony § key.minor-form (custom over music21 scale membership) | RULES-harmony § key.minor-form |
| key.change | Each change of key, with its kind named: printed signature change; unmarked modulation (a cadence in the new key); tonicisation (a brief new tonic, no cadence). Also the relation of the new key to the old: dominant, subdominant, relative, parallel, other | both: code from signature changes (exact) and windowed key-finding (music21 `analysis.floatingKey.KeyAnalyzer`, checked to exist; partitura `estimate_key` per section); agent settles modulation against tonicisation | OMT-Modulation.html; TCL-SR (modulation by grade) |
| scale.collection | The pitch-class collection of each passage, named: diatonic major (Ionian); natural minor (Aeolian); harmonic and melodic minor; the other modes with their tonic (Dorian, Phrygian, Lydian, Mixolydian, Locrian); major and minor pentatonic; the b3 pentatonic (ABRSM Jazz; its notes to be quoted from the syllabus); blues scale; whole-tone; octatonic (diminished); chromatic; the melodic-minor modes (Lydian dominant, altered); bebop scales; the Phrygian-dominant mode of harmonic minor; none (no collection, post-tonal). Each is reported separately | both: code from RULES-harmony § scale.collection, with music21 scale classes (`DorianScale` ... `WholeToneScale`, `OctatonicScale`: checked to exist) for membership (custom pitch-class sets for the further collections); agent where the tonic, and so the mode, is ambiguous | OMT-scales2.html (holds pentatonic, whole-tone and octatonic; no blues scale: its source is to be named); RULES-harmony § scale.collection; LEV ch 9 (melodic-minor harmony); ABRSM Jazz scales (DRAFT: draft-styles § 2.1) |
| pitch.inventory (new) | The written pitches the item uses, per staff: each distinct pitch with its octave (scientific pitch notation, middle C = C4), its count, and whether it sits on a line or in a space of its staff (at the displayed position, as `pitch.ledger`). Reported as the set of pitches, not only its bounds, so that two Middle-C-position items that ask for different notes are told apart | code: music21 `pitch.Pitch.nameWithOctave` per note per staff; partitura note array `pitch` with `staff` | JS P-4 (Number of Pitches) and P-5 (Number of Pitch Classes) count this set; MXL-pitch |
| reading.enharmonic-spelling (new) | Notes whose written name is not the usual name of that key: white-key accidentals (E#, B#, Cb, Fb), and one piano key written under two names in one item or passage (F# and Gb); count and positions | code: music21 `pitch.Pitch.ps` grouped against `.name` (checked: C-flat4 and B3 both give ps 59) | WP-Enharmonic (stand-in); abilities.md AB-006 (a black key under either name) |
| key.polytonal (new) | Two keys or collections at once: different key signatures on the two staves, or each hand's notes fitting a different key or collection over a passage (one hand on white keys, the other on black keys) | both: code from raw `<key>` per staff (music21 `KeySignature` per staff) and key-finding per staff (music21 `analyze('key')`, which runs Aarden-Essen, on each staff); agent confirms | WP-Polytonality (stand-in; no syllabus page read for it) |
| pitch.tone-row (new) | A twelve-note row used as the pitch material, and its forms (prime, inversion, retrograde, retrograde inversion); count of statements. Low frequency at the levels the abilities cite | both: code from music21 `serial.TwelveToneRow` and `TwelveToneMatrix` (checked to exist) with a custom search for row statements; agent confirms | M21 (`serial`) |

### 1.C Metre, rhythm and tempo

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| notation.times | The time signatures and every change, with positions | code: music21 `meter.TimeSignature`; partitura `ts_beats`, `ts_beat_type` | MXL-time |
| metre.class (new) | Each time signature's class: simple duple, triple or quadruple; compound duple, triple or quadruple; irregular (a signature whose beat count is none of these, such as 5/4, 5/8 or 7/8, classed by its written numerator). Named apart: 3/8, and cut time (2/2). How an irregular signature's beats group (7/8 as 2+2+3, 3+2+2 or 2+3+2) is `metre.grouping`, not this row: music21 classes 7/8 "Simple Septuple" (seven beats) although it is felt in three uneven beats | code: music21 `TimeSignature.beatCount`, `beatDivisionCount`, `classification` (checked to exist); partitura `ts_mus_beats`; music21 `CompoundOrSimpleMeterFeature`, `TripleMeterFeature`, `QuintupleMeterFeature`, `ChangesOfMeterFeature` as witnesses | OMT-meter.html (simple and compound metres only; it has no irregular metres, count 0 in pass 1); JS R-2 to R-8 |
| mark.anacrusis | A pickup bar: the first bar shorter than the metre, and its length in beats | code: raw MusicXML `implicit="yes"` on the first measure; music21 `Measure.paddingLeft` | MXL-measure |
| rhythm.values | The note and rest values used, each named and counted separately: whole, half, quarter, eighth, sixteenth, thirty-second and shorter, and each rest. Also: shortest and longest value; number of distinct values | code: music21 `duration.Duration.type`, `note.Rest`; native `UniqueNoteQuarterLengths`, `RangeOfNoteQuarterLengths`; partitura `duration_beat` | JS R-13, R-15, R-23, R-24; ABRSM-SR; TCL-SR (note and rest values by grade) |
| rhythm.dotted-quarter | Dotted values, each kind named and counted: dotted half; dotted quarter (with its eighth); dotted eighth (with its sixteenth); double-dotted values | code: music21 `Duration.dots` and the following note's value | JS R-22; ABRSM-SR; TCL-SR |
| rhythm.ties | Ties: count, within a bar or across a bar line, and ties that make a syncopation | code: music21 `note.tie` with measure numbers | MXL-tied |
| rhythm.syncopation | Syncopation, each kind named and counted, at the beat level and at the subdivision level separately: an onset off the beat held across the next beat; an accent off the beat; a rest on a strong beat followed by an off-beat onset. A pickup is not syncopation | code: custom over music21 `beatStrength` or partitura `metrical_strength_feature` (the app's `detect.ts` already leaves out a silent downbeat after no note: the 2026-10-07 ruling) | the app's `detect.ts` syncopation comment (Harvard Dictionary of Music; Longuet-Higgins and Lee 1984), the definition of the accent kind; OMT-syncopation.html (does not define the accent kind); ABRSM-SR ("simple syncopation") |
| rhythm.triplets | Triplets: count, value (eighth, quarter, sixteenth), per hand | code: music21 `duration.Tuplet` | MXL-time-modification |
| rhythm.tuplets-other | Tuplets other than triplets (duplets, quintuplets, sextuplets, septuplets) and nested tuplets | code: music21 `duration.Tuplet` | MXL-time-modification; TCL-SR ("duplets and triplets") |
| rhythm.cadenza (new) | Unmeasured figuration: a run of cue-size or grace notes, or a tuplet of an irregular ratio (for example 11 in the time of 6), spanning a beat or more; or a passage marked cadenza or ad lib. with the other hand silent or held | both: code reads `<cue>`, `<grace>`, `<time-modification>` ratios and words (music21 `TextExpression`); agent confirms that the passage is played freely | WP-Cadenza |
| rhythm.repeated-notes | Consecutive equal pitches in one voice: count and longest run, and the note value at which they repeat | code: custom over partitura's note array; music21 `RepeatedNotesFeature` as a witness | JS M-9 |
| rhythm.equal-stream | A continuous stream of equal note values in one hand (running sixteenths, Hanon cells): length in notes and in bars | code: custom over partitura's note array | operational (this list; the minimum length still to source) |
| rhythm.habanera | The habanera cell (dotted eighth, sixteenth, two eighths in 2/4) | code: the app's `detect.ts` habaneraCell (reads the left hand only, so a habanera melody is not found by it) | WP-Habanera_(music) |
| rhythm.tresillo | The tresillo cell (3+3+2 eighths) | code: the app's `detect.ts` tresilloCell | WP-Tresillo_(rhythm) |
| rhythm.cinquillo (new) | The cinquillo cell: in one 2/4 bar, onsets on sixteenth pulses 0, 2, 3, 5 and 6 of 8 | code: custom cell matcher (as the habanera matcher) | WP-Cinquillo |
| rhythm.secondary-rag | Berlin's secondary rag: a repeating three-note pattern over duple metre | code: RULES-rhythm § rhythm.secondary-rag | RULES-rhythm § rhythm.secondary-rag |
| rhythm.shuffle | Long-short pairs on the beat, as notated: triplet pairs (2:1), dotted eighth-sixteenth pairs (3:1) or 12/8 groupings. Swung even eighths under a Swing direction are not this row (see `notation.swing-mark`); RULES-rhythm § rhythm.shuffle counts them as shuffle under its "marked" clause, which is to be corrected there | code: RULES-rhythm § rhythm.shuffle | RULES-rhythm § rhythm.shuffle |
| notation.swing-mark | A printed swing direction (MusicXML `<swing>`, or a text such as "Swing" or the triplet-equivalence sign) | code: raw MusicXML `<swing>` only (music21's sound parser marks swing a TODO and makes no object; partitura ignores it: "ignoring direction type: swing"); music21 `TextExpression` for the text "Swing" and the triplet-equivalence sign | MXL-swing |
| rhythm.backbeat (new) | Emphasis on beats 2 and 4 of a four-beat bar in the accompaniment: accents, chords or the only onsets of a hand on those beats | code: custom over onsets and accents per beat | WP-Backbeat (its own article) |
| rhythm.hemiola (new) | In triple metre, two bars of three beats grouped as three units of two (by ties, accents, note lengths or chord changes every two beats), or a 6/8 bar grouped as three quarter notes. Named apart: alternating 6/8 and 3/4 groupings (sesquialtera) | both: code, custom over onsets, ties, accents and chord changes; agent confirms the grouping | WP-Hemiola |
| texture.polyrhythm | Two different divisions of the beat at once between the hands, each kind named: 2 against 3, 3 against 2, 3 against 4, 4 against 3, other; including kinds written without tuplets (duplets in compound time written as dotted values, two hands in 6/8 against 3/4 groupings) | code: custom from the onset grid of each hand per beat, not from tuplet marks alone (music21 `duration.Tuplet` per staff finds only the tuplet-written kind) | WP-Polyrhythm |
| rhythm.beat-onset-share | The share of beats, and of downbeats, carrying an onset in some part (how audible the pulse is) | code: partitura `is_downbeat` and onsets with music21 beat positions | operational (this list) |
| mark.tempo-text | The written tempo: tempo words (classified against the common Italian terms) and the metronome mark with its beat unit (quarter, dotted quarter, half), which says whether 6/8 or 3/8 is counted in two, one or six | code: partitura `ConstantTempoDirection` for tempo words ("allegro" parsed in the pass-1 test); music21 gives tempo words only as `expressions.TextExpression` (its import never makes `tempo.TempoText`); the metronome mark from music21 `tempo.MetronomeMark` (`.referent` is the beat unit) or partitura `Tempo` | MXL-metronome (beat-unit); TCL-SR (tempo terms by grade) |
| mark.tempo-change | Printed tempo changes, each kind named: rit. or rall., accel., a tempo or Tempo I, meno mosso, più mosso, a new tempo word, metric modulation | code: partitura `DecreasingTempoDirection`, `IncreasingTempoDirection`, `ResetTempoDirection` ("ritardando" parsed in the pass-1 test); music21's import gives rit. and accel. as `TextExpression` and never makes `tempo.RitardandoSpanner` or `AccelerandoSpanner`; `tempo.MetricModulation` for metric modulation | ABRSM-SR; TCL-SR |
| technique.velocity | Notes per second per hand at the written tempo (or a stated default), over the item and at its peak in a moving window | code: custom over partitura's note array and the tempo; music21 `NoteDensityFeature` as a whole-item witness | JS RT-5; SEB Table 1 ("playing speed": tempo and shortest significant value, a second published definition) |
| technique.endurance | Sustained demand per hand: the longest span without a rest, reported as its length in notes and in seconds at the tempo (so notes per second over it) | code: custom | operational (this list) |
| metre.grouping (new) | The grouping of beats inside the bar for each irregular or compound metre: from a composite numerator (2+3/8) or from the beaming (7/8 as 2+2+3, 3+2+2 or 2+3+2; 8/8 as 3+3+2), per bar, and any change of grouping under one signature. With neither a composite numerator nor beaming, UNKNOWN | code: music21 `meter.TimeSignature.beatSequence` (checked: 2+2+3/8 gives three beats) and `beamSequence`; raw MusicXML `<beats>` with "+"; beam groups from music21 `note.beams` or partitura `Beam` | MXL-time (composite beats); the groupings of 5/8 and 7/8 themselves need a source (OMT-meter.html has no irregular metres: count 0 in pass 1) |
| rhythm.silence (new) | Spans where the piano part sounds nothing (both hands resting, no note held): count, length in beats and bars, multi-bar rests, general pauses, and whether other parts sound meanwhile (counting rests while others play); the re-entry after each | code: partitura note array over the onsets and offsets of all staves; music21 `spanner.MultiMeasureRest` (checked to exist); other parts from music21 `Score.parts` | JS R-41 Complete Rests Fraction, R-44 Longest Complete Rest, R-46 Mean Complete Rest Duration; MXL-multiple-rest |
| rhythm.bar-patterns (new) | The distinct rhythm patterns of one bar (and of one beat) per hand, each with its count and positions, and the share of bars using the most common pattern. A dotted-quarter-eighth bar and an eighth-dotted-quarter bar are different patterns though they hold the same values | code: music21 `search.mostCommonMeasureRhythms` (checked to exist); a custom rhythm string per bar per staff (the string `coordination.rhythmic-independence` already builds) | M21 (`search.mostCommonMeasureRhythms`); RCM ear clapback and sight-reading rhythm tests (DRAFT: draft-rcm § 2, every level) |
| rhythm.clave-alignment (new) | In a clave-based item: which clave direction (3-2 or 2-3) the melody and the piano pattern agree with, per phrase, and the passages that go against it (cruzado) | both: code, custom: each line's onsets per two-bar cycle scored against both directions (as `texture.clave`'s matcher); agent confirms | Mauleón ch III, "The Melody and Clave" (DRAFT: draft-styles § 2.10; not read) |

### 1.D Melody

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| interval.melodic (new) | Melodic intervals between successive notes of one line (per voice, per hand), each size named and counted from the generic (letter) size: repeated note, 2nd (step), 3rd (skip), 4th, 5th, 6th, 7th, octave, then the compound sizes each by name (9th, 10th and larger); with quality (minor, major, perfect, augmented, diminished) and direction. A leap is every size from the 4th up | code: music21 `Stream.melodicIntervals` and `interval.Interval` (`.generic`, `.name`, which gives M9 and M10 for compound intervals), `analysis.discrete.MelodicIntervalDiversity` (checked); music21 `MelodicIntervalHistogramFeature`, `StepwiseMotionFeature`, `MelodicThirdsFeature`, `MelodicFifthsFeature`, `MelodicOctavesFeature`, `MelodicTritonesFeature`, `ChromaticMotionFeature` as witnesses | OMT-intervals.html; JS M-1, M-9 to M-19 |
| quality.contour | The contour of the melody line: direction of each move (up, down, same), the share rising, melodic arcs (notes and semitones between turning points), and overall shape (arch, rising, falling, wave) | code: music21 `DirectionOfMotionFeature`, `DurationOfMelodicArcsFeature`, `SizeOfMelodicArcsFeature` per line; custom for the shape class | JS M-22 to M-24 |
| quality.leap-recovery | A melodic leap of a 4th or more followed by stepwise motion in the opposite direction; share of leaps so recovered | code: custom | OMT-cantusFirmus.html |
| melody.tessitura | The melody line's range and its weighted central range, against a stated voice range | code: music21 `analysis.discrete.Ambitus` on the melody line | operational (this list; voice ranges to quote) |
| melody.degree-profile | The scale degree of each melody note relative to the tonic: first and last degree, the set of degrees used | code: music21 `key.Key.getScaleDegreeAndAccidentalFromPitch` (checked on an instance: F sharp in C gives degree 4, sharp; `getScaleDegreeFromPitch` returns None for a chromatic note) | operational (this list) for the degree; JS P-34 to P-37 name first and last pitch only (music21 does not implement them) |
| melody.chord-relation | Each melody note's relation to the chord under it, each kind named: chord tone on a strong beat; passing, neighbour, appoggiatura, suspension, escape tone, anticipation, pedal; jazz approach notes and enclosures; guide tones; blue notes. For each chord tone, which member it is: root, 3rd, 5th, 7th, 9th or another extension | code: RULES-harmony § melody.chord-relation (custom over `harmony.roman`), extended to the classical non-chord-tone types; music21 `chord.Chord.getChordStep` for the chord member (checked to exist) | OMT-embellishingTones.html (the classical types, new beyond RULES-harmony); RULES-harmony § melody.chord-relation; RCM Levels 3-4 ear test (root, third or fifth; DRAFT: draft-rcm § 2) |
| melody.motif-repetition | A motif (a figure of two to eight notes, identified by its intervals and rhythm) recurring exactly, transposed, or varied (its rhythm or one interval changed); count and positions | both: code from music21 `search` (`approximateNoteSearch`, `rhythmicSearch`: checked to exist) or a custom interval-string match; agent for varied recurrences | WP-Motif_(music) |
| melody.sequence (new) | A segment repeated two or more times in succession at different pitch levels (diatonic or exact). Named apart: melodic sequence; harmonic sequence (descending fifths, ascending 5-6) | both: code, custom match of interval and rhythm strings across successive segments; agent confirms | WP-Sequence_(music); a sequence definition from KP or OMT's sequence pages (not cited by address). OMT-schemataContinuationPatterns defines the Fonte, Monte and Ponte schemata only, and has no descending-fifths or ascending 5-6 text |
| technique.written-ornament | Trills, mordents and turns written out in measured notes (no sign): main note, neighbour, main note at ornament speed | code: custom figure matcher; music21 jSymbolic M-21 definition (short note between longer notes) as a related witness, not in music21 | JS M-21; operational (this list) for the figure |

### 1.E Harmony

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| harmony.chord-quality | Each chord's quality, each named and counted: major, minor, diminished, augmented triads; dominant 7th, major 7th, minor 7th, half-diminished 7th, diminished 7th, minor-major 7th; 6 and minor 6; sus2, sus4; add9; 9, 11, 13 and altered extensions (b9, #9, #11, b13); the Phrygian chord (sus with flat 9); quartal and quintal sonorities; power chord (5). From printed symbols and from the notes, reported separately | code: music21 `ChordSymbol.chordKind` read together with `ChordSymbol.getChordStepModifications()` (checked on instances: `chordKind` alone drops added and altered tones, so "C7b9" gives dominant-seventh, "Cadd9" gives major and "C5" gives an empty kind, while the modifications return the add 9); the MusicXML `kind` value `power` for the power chord; from notes, `chord.Chord.commonName`, `.isDominantSeventh`, `.isDiminishedSeventh`, `.isHalfDiminishedSeventh` (checked; `chord.Chord.quality` reports the triad only: Cmaj7 gives "major"); native `MajorTriadSimultaneityPrevalence` to `DiminishedSeventhSimultaneityPrevalence` as witnesses | OMT-triads.html; MXL-harmony (kind values); JS C-3, C-29 to C-35 |
| harmony.inversion | Chord inversions (root position, first, second, third) and slash chords | code: music21 `chord.Chord.inversion()`, `ChordSymbol` bass (checked) | MXL-harmony; OMT's inversion page or KP (not cited by address: OMT-triads.html has no inversion text, count 0 in pass 1) |
| harmony.roman | The function of each chord change as a numeral in the key, in RULES-harmony's jazz-style numerals: the degree (with b or # against the major scale, or against natural minor with the raised sixth and seventh unmarked), case by the triad (upper for major, dominant and augmented; lower for minor and diminished), and the suffix 7, maj7, 6, °, °7, ø7, +, sus | both: code from RULES-harmony § harmony.roman over its chord timeline (not music21 `roman.romanNumeralFromChord`, which that page tried and rejected: it names a C7 in C as Ib753); agent where the key or chord is unresolved | RULES-harmony § harmony.roman |
| harmony.progression | Named progressions, each named separately: I-V(7)-I; I-IV-V(7)-I; I-vi-IV-V (doo-wop); I-V-vi-IV and the other named four-chord loops; major ii-V-I; minor ii-V-i; rhythm changes; the cadential 6-4 (I6/4 to V to I; RCM's I-IV-V6/4-5/3-I). Descending fifths (circle), plagal progressions and the lament bass are named here but have no rule yet (RULES-harmony defines I-IV-V, V-I, ii-V-I, four named loops and rhythm changes); the lament bass is a descending-tetrachord bass pattern, read from the bass line rather than from numerals | code: RULES-harmony § harmony.progression over `harmony.roman` for the progressions it covers; the cadential 6-4, descending fifths and plagal progressions over `harmony.roman` (inversion figures) once a rule is written; the lament bass from the bass line | RULES-harmony § harmony.progression; OMT-popRockHarmony.html (mentions doo-wop, lament and plagal once each); RCM Levels 8-10 chord formulas (DRAFT: draft-rcm § 2); OMT's cadential 6-4 page (not cited by address, to quote) |
| harmony.applied | Chords outside the plain diatonic set, each kind named: secondary dominants and secondary leading-tone chords; tritone substitutions; passing chords (chromatic and gospel); pivot chords; modal mixture; Neapolitan; augmented sixths (Italian, French, German). RULES-harmony marks pivot chords NOT DONE (they need `key.change`), has no rule for Neapolitan or modal mixture, and does not define gospel passing chords | both: code from RULES-harmony § harmony.applied; agent for pivot chords; music21 `isItalianAugmentedSixth`, `isFrenchAugmentedSixth`, `isGermanAugmentedSixth` (checked) | OMT-appliedChords.html; OMT-alteredSubdominants.html; OMT-modalMixture.html; LEV (tritone substitution) |
| harmony.cadence | The cadence at each phrase end, each type named: perfect authentic, imperfect authentic, half (the British "imperfect cadence"), plagal, deceptive (the British "interrupted"), Phrygian half. RULES-harmony finds cadences only at notated ends and has no Phrygian-half rule | code: RULES-harmony § harmony.cadence (partitura `Cadence` reads only annotated cadences) | OMT-cadenceTypes.html (defines the perfect and imperfect authentic and the half cadence only; plagal, deceptive and Phrygian are not on the page: sources to be named) |
| harmony.chromatic-share | The share of chords that are not diatonic in the key. The harmonic-minor V, V7 and vii° count as diatonic in a minor key, as RULES-harmony's numerals leave the raised sixth and seventh unmarked (to be confirmed against the rule when written) | code: from `harmony.roman` | operational (this list) |
| harmony.rhythm | Chord changes per bar, and where they fall in the bar | code: from printed symbols, else the chord timeline of RULES-harmony (its shared analysis; template segments after Pardo and Birmingham 2002); not music21 `Stream.chordify` change points, which fall on every new onset in any voice, passing notes included, and so overcount chord changes | RULES-harmony (the chord timeline); OMT-harmonicSyntax1.html has no harmonic-rhythm text (count 0 in pass 1): a source is to be named |
| harmony.chord-vocabulary | The number of distinct chords in the item | code: distinct numerals from `harmony.roman` | operational (this list) |
| harmony.voicing | How a chord's notes are arranged, each kind named: close; open; shell (root with 3rd or 7th); rootless (A and B forms); quartal (So What); upper structure; drop-2; locked hands (melody doubled an octave below, chord between); Bud Powell shells. RULES-harmony defines quartal, shell, guide tones, rootless, close and open only; upper structure, drop-2, locked hands and Bud Powell shells have no rule yet (to be written) | code: RULES-harmony § harmony.voicing (under printed symbols); agent without them | RULES-harmony § harmony.voicing; LEV |
| harmony.voice-leading | In textures of three or four voices: parallel fifths and octaves, voice crossing and overlap, resolution of the leading tone and the chordal seventh, common tones kept | code: music21 `voiceLeading.VoiceLeadingQuartet` (`parallelFifth`, `parallelOctave`, `voiceCrossing`, `voiceOverlap`, `isProperResolution`: checked) | OMT-tendencyTonesFunctionalDissonances.html; OMT-motionTypes.html |
| harmony.chord-connection | Per hand per chord change: notes held in common, and the summed semitone motion of the rest (how smoothly the hand connects chords) | code: custom over partitura's note array | operational (this list) |
| harmony.bass-behaviour | What the bass does, each kind named: root-position roots; the root-motion interval; tonic-dominant bass; two-feel (half notes); walking (its own row); anticipated bass (a pedal bass is `texture.pedal-point`, the one definition) | code: RULES-harmony § harmony.bass-behaviour (music21 native `ChordBassMotionFeature` measures root motion between printed chord symbols, not the bass line, so it is a witness for the root-motion interval only) | RULES-harmony § harmony.bass-behaviour |
| texture.bass-walk-up | A stepwise bass leading into the next chord's root (walk-up or walk-down) | code: RULES-harmony § texture.bass-walk-up | RULES-harmony § texture.bass-walk-up |
| texture.pedal-point | A sustained or repeated bass note under at least one harmony foreign to it (the one definition of the pedal bass; `harmony.bass-behaviour` no longer names it) | code: RULES-texture § texture.pedal-point | RULES-texture § texture.pedal-point (Wikipedia, "Pedal point") |
| harmony.implied (new) | The harmony a line implies where no chords are written: per harmonic unit (bar or half bar), the best-fitting chord in the key (I, IV, V, V7 first), with its fit (the share of beat-weighted notes that are chord tones) and any equal alternative | both: code, a custom chord-tone fit of the notes against music21 `roman.RomanNumeral(...).pitches`, weighted by `beatStrength`; agent where two chords fit equally | RCM Level 6 lead-sheet reading: chords "for the implied harmony of a melody" (DRAFT: draft-rcm § 2) |
| harmony.planing (new) | Successive chords of one interval structure moved in parallel (chord streams): diatonic planing (qualities change with the scale) or exact (chromatic) planing (one quality throughout); length in chords. Includes parallel triads and parallel power chords | code: custom over the chord timeline of RULES-harmony (not `Stream.chordify` alone, whose passing-note onsets make extra chords): consecutive chords with equal intervals above the bass and a moving bass; JS T-19 Parallel Motion as a definition witness | WP-Parallel_harmony (stand-in; OMT's Impressionism material to quote) |
| harmony.dissonance-share (new) | The share of vertical intervals between simultaneous notes that are dissonant (seconds, sevenths, tritones, ninths), per passage; and sonorities outside the named chord qualities (non-tertian chords) | code: music21 `chord.Chord.isConsonant` over `Stream.chordify` (checked to exist); JS C-24 Vertical Dissonance Ratio as the definition (not in music21) | JS C-24; JS C-33 Non-Standard Chords; JS C-34 Complex Chords |
| harmony.chord-scale (new) | Over each chord (symbol or sounding), the scale or mode the melody or solo line uses: for example Dorian over a minor 7th, Mixolydian over a dominant 7th, Lydian over maj7#11, altered or diminished over an altered dominant | both: code, custom: the line's notes per chord span tested against music21 scale classes built on the chord root; agent where there are too few notes | LEV chs 9-11 (as abilities.md AB-152 cites them) |

### 1.F Texture and accompaniment patterns

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| texture.type (new) | The texture of each passage: monophonic (one line), melody with accompaniment (homophonic), chordal (all voices moving together, the hymn texture), polyphonic (independent lines) | both: code from `texture.voice-count`, `coordination.synchrony-share` and `texture.counterpoint`; agent for mixed passages | WP-Texture_(music) |
| texture.hands-together | Whether both hands sound at once: share of bars hands together, hands separately, or one hand alone (the bar-level view; `coordination.synchrony-share` is the onset level of the same fact, and one of the two goes in Phase 2 if only one level is used) | code: per-bar onsets per staff (partitura) | operational (this list) |
| texture.voice-count | The number of voices per staff, written (MusicXML `<voice>`) and sounding (notes per onset); the four-voice layout of two per staff | code: raw `<voice>`, partitura `voice`, onsets per staff | MXL-voice |
| texture.counterpoint | The number of simultaneously independent lines and how independent they are (rhythm and contour) | both: code from partitura `estimate_voices` and per-pair rhythm and contour independence (custom); agent where the voices are not written apart | WP-Counterpoint |
| texture.imitation (new) | One voice restating another's figure (the same intervals and rhythm, at any pitch) after it, while the first voice continues: imitation and canon. A fugue subject entry is one kind (`form.fugue`) | both: code, custom match of interval strings across voices (music21 `search` as a helper); agent confirms | WP-Imitation_(music) |
| texture.block-chords | Notes struck together in one hand, each chord size named and counted: 2-note, 3-note, 4-note or more; also chords shared between the hands | code: partitura onsets per staff, music21 `Stream.chordify`; jSymbolic C-6 as the published definition | ABRSM-SR ("2-note chords in either hand", "3-part chords"); JS C-6 |
| interval.harmonic (new) | Two notes struck together in one hand: the interval named (2nd to octave, tenth) with its quality; counts per hand | code: partitura onsets per staff with music21 `interval.Interval` | OMT-intervals.html; JS C-1 (not in music21) |
| texture.double-notes | Successions of the same harmonic interval in one hand (3rds, 6ths, other), moving | code: custom over simultaneous intervals per hand per onset | operational (this list) |
| texture.octaves | Octaves in a hand, each kind named: octave bass, melody in octaves, broken octaves, repeated octaves; octaves in both hands | code: custom over simultaneous and alternating octaves per hand | operational (this list) |
| texture.power-chord | Root-fifth chords (with or without the octave) used as a chord, not as the open-fifth bass of classical music: the register or style condition that tells them apart is to be stated by the rule | code: chord content per onset (a root and fifth, with or without the octave) under that condition; MusicXML `<harmony>` kind `power` (music21's text parser gives "C5" an empty `chordKind`; `kind='power'` gives power) | WP-Power_chord |
| texture.broken-chord | A chord's notes sounded one after another in one hand through a bar or half bar. Each figure reported separately: within a fifth; over an octave; in triplets; four-note; the alternate-note pattern (RCM; its order to be quoted); other | code: RULES-texture § texture.broken-chord | RULES-texture § texture.broken-chord; RCM technical tests (DRAFT: draft-rcm § 2, Levels 9-10) |
| texture.alberti | The Alberti figure: lowest, highest, middle, highest | code: RULES-texture § texture.alberti | RULES-texture § texture.alberti |
| texture.arpeggio | An arpeggiated texture rising or falling over more than an octave | code: RULES-texture § texture.arpeggio | RULES-texture § texture.arpeggio |
| texture.waltz-bass | Bass on beat 1, chords on beats 2 and 3, in triple metre | code: RULES-texture § texture.waltz-bass | RULES-texture § texture.waltz-bass |
| texture.oom-pah | Bass on the strong beats, chord on the off-beats, in duple metre | code: RULES-texture § texture.oom-pah | RULES-texture § texture.oom-pah |
| texture.stride | An oom-pah left hand whose bass-to-chord travel exceeds an octave (the figure, not the style: the rules page tags Joplin's rags, and `style.evidence` decides "stride") | code: RULES-texture § texture.stride | RULES-texture § texture.stride |
| texture.boogie-bass | A regular left-hand eighth-note figure transposed with the chord changes (boogie-woogie) | code: RULES-texture § texture.boogie-bass | RULES-texture § texture.boogie-bass |
| texture.walking-bass | A bass moving in steady quarter notes in every bar of the item, with at least one move in eight made by step and the other moves by scale tones, arpeggio tones or chromatic runs, outlining the changes. The rule is whole-item (every bar), not per passage | code: the app's `detect.ts` walkingBass (WALK_STEP_SHARE = 1/8; the 2026-10-07 movement ruling is in the code) | WP-Walking_bass |
| texture.left-hand-pattern | A left hand that strikes more than once in every bar under a right hand, so a moving left-hand accompaniment, before it is named by the rows above. As coded it tests the strikes per bar only, not that a figure repeats; a repeating figure is `texture.ostinato` | code: the app's `detect.ts` leftHandPattern (the every-bar rule) | operational (this list) |
| texture.ostinato | A figure repeated unchanged (the same notes and rhythm each time) for N bars. Each kind named: ostinato, riff, vamp. A figure transposed to follow the chord roots is a separate kind, **transposed figure**, reported apart with its own test (the same intervals and rhythm, the starting pitch following the chord root; RULES-texture lists it as a near-miss for ostinato, and the test is to be written): counted as an ostinato, every Alberti and boogie bass would be one | code: RULES-texture § texture.ostinato | RULES-texture § texture.ostinato |
| texture.repeated-chords (new) | Chords re-struck at a steady value for a bar or more, each value named: half notes; quarter notes ("four to the bar": at most two chords a bar, within one register; a bar of tonic then dominant counts); eighth notes (pulsing eighths); triplet eighths. For the half, eighth and triplet kinds the same chord is re-struck | code: custom over onsets and chord identity per hand | RULES-texture § texture.four-to-the-bar for the quarter-note kind; operational (this list) for the others |
| texture.offbeat-chords (new) | Chords only on the off-beats, with the beats empty in that hand (the reggae and ska "skank", the upbeat comp); per subdivision | code: custom over onsets per beat | WP-Reggae (the off-beat chord) |
| texture.charleston | Chords on beat 1 and the and-of-2 | code: RULES-rhythm § texture.charleston | RULES-rhythm § texture.charleston |
| texture.montuno | A repeated syncopated chordal figure aligned to the clave | code: RULES-rhythm § texture.montuno | RULES-rhythm § texture.montuno |
| texture.tumbao | Left-hand onsets on the tresillo's two off-beats, the downbeat empty | code: RULES-rhythm § texture.tumbao | RULES-rhythm § texture.tumbao |
| texture.clave | A hand whose onsets over a cycle are a son, rumba, bossa or 6/8 clave, in either direction | code: RULES-rhythm § texture.clave | RULES-rhythm § texture.clave; Mauleón ch III for the 6/8 clave (DRAFT: draft-styles § 2.10; not read) |
| texture.bossa | The bossa nova comp (the bossa clave as a repeated pattern), with the surdo bass counted beside it | code: RULES-rhythm § texture.bossa | RULES-rhythm § texture.bossa |
| texture.tango | The tango accompaniment figures: 3-3-2, habanera, marcato en 4 or en 2, and the síncopa, the arrastre (a drag into the beat) and the yumba (the last three to be defined from the source) | both: code from RULES-rhythm § texture.tango (which never answers present: a repeated figure is UNKNOWN until a source beyond the notes names the style) and custom cell matchers for the further figures; agent for the arrastre and to confirm the style | RULES-rhythm § texture.tango; Link and Wendland (DRAFT: draft-styles § 2.13) |
| texture.mazurka | The mazurka rhythm: the beat-1 figure and an accent off beat 1 in 3/4 (the rule cannot tell a polonaise; `style.evidence` decides) | code: RULES-rhythm § texture.mazurka | RULES-rhythm § texture.mazurka |
| texture.stop-time | Accented attacks on the first beat of each bar or every other bar, alternating with silence | code: RULES-texture § texture.stop-time | RULES-texture § texture.stop-time |
| texture.tremolo-thirds | Two notes a third apart alternated rapidly, or a tremolo mark on a third (the figure only: the rule also finds Mozart's K. 545, so a style such as the blues belongs to `style.evidence`) | code: RULES-texture § texture.tremolo-thirds | RULES-texture § texture.tremolo-thirds |
| texture.crushed-note | A grace note a semitone below a chord tone, struck with it (the figure only: the rule's positives include a Chopin mazurka, so a style such as the blues belongs to `style.evidence`) | code: RULES-texture § texture.crushed-note | RULES-texture § texture.crushed-note |
| texture.half-time | A half-time feel: the backbeat on beat 3 of a four-beat bar | both: code from accents, bass and `rhythm.backbeat`; agent confirms (low confidence from a score) | operational (this list) |
| texture.call-response | Answering phrases: a phrase answered by another in a different hand or register | both: code from `form.phrase` and register or hand alternation; agent confirms | WP-Call_and_response_(music) |
| texture.melody-in-chords | The melody carried as the top voice of chords in one hand | code: RULES-texture § texture.melody-in-chords | RULES-texture § texture.melody-in-chords |
| texture.sustained | Chords held a bar or more | code: chord durations | operational (this list) |
| texture.build | Rising dynamics and note density across four bars or more | code: RULES-rhythm § texture.build | RULES-rhythm § texture.build |
| texture.register-trajectory | Register change across a section: the same idea moved an octave, a widening or dropping register | code: trend over `hands.per-bar-range` per section (custom) | operational (this list) |
| texture.part-roles | In a multi-part source, which part is the melody, the bass, a riff and the rhythmic engine | both: code from music21 `instrument.Instrument` per part, `hands.per-bar-range`, `texture.ostinato`; agent decides roles | operational (this list) |
| texture.piano-role (new) | What the piano part does in the item, reported per section (so a switch between comping and soloist is shown): complete solo (melody and accompaniment); accompaniment to another part (a soloist, a singer, people singing); comping from symbols (no melody); lead line (a single melody or solo line over symbols or a backing); bass line | both: code from `item.format`, other parts and lyrics present, `texture.melody-location`; agent decides | WP-Accompaniment; LEV (comping) |
| mark.extended-technique (new) | Contemporary piano effects, each kind named: note clusters (three or more adjacent semitones or seconds struck together, or a cluster sign); silently depressed keys (hollow or diamond noteheads held for sympathetic resonance, harmonics); playing inside the piano. Each cluster is reported with its span in semitones, whether it is white keys, black keys or all, and how it is to be struck (palm, forearm, from the text) | both: code from music21 `note.Note.notehead` (diamond, checked as an attribute), chord interval content, raw `<harmonic>`; agent reads the text instructions | WP-Tone_cluster; MXL-notehead; MXL-harmonic |
| mark.glissando (new) | Glissando marks (a line between two notes, or gliss. text): count, direction, and white or black keys where stated | code: music21 `spanner.Glissando` (checked); raw `<glissando>`, `<slide>` | MXL-glissando |
| texture.latin-pattern (new) | One kind per Latin accompaniment pattern the list has no row for, each reported separately: cha-cha-chá, mambo, songo, guaguancó, merengue, bomba, plena, cumbia (Colombian), joropo (Venezuelan), festejo and landó (Peruvian), chacarera and zamba (Argentine), samba, baião, choro and maxixe (the sixteenth-eighth-sixteenth cell), beguine. Each kind's piano or bass cell is quoted from its source before it is measured | both: code, a custom cell matcher per kind (as `texture.tango`); agent confirms the style | Mauleón ch V; Berklee Latin Piano Styles weeks 5, 7, 8 and 11; Willey and Cardim; LCM Jazz G5 aural (beguine, samba) (DRAFT: draft-styles § 2.6, 2.10 to 2.12; none read) |

### 1.G Coordination between the hands

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| coordination.synchrony-share | The share of onsets both hands strike together, offset, or one hand alone | code: per onset pair from partitura's note array | operational (this list) |
| coordination.rhythmic-independence | Bars where the two hands' rhythm patterns differ: count, and the kind of difference (shared, offset, independent) | code: rhythm string per hand per bar | operational (this list) |
| coordination.unequal-rates | One hand moving faster than the other: ratio of note rates per bar and where it changes | code: notes per bar per hand | operational (this list) |
| coordination.articulation-conflict | Different articulations in the two hands at the same time (legato against staccato, accents in one hand) | code: `mark.articulation` and `mark.slur` per hand per onset | operational (this list) |
| coordination.dynamic-balance | Different printed dynamics in the two hands, and a melody to be brought out over its accompaniment (from `texture.melody-location`) | both: code from per-staff `mark.dynamics` and melody location; agent where balance is implied, not printed | TCL-SR ("different dynamics for RH and LH") |
| coordination.register-overlap | The hands' ranges overlapping in a bar, or the hands crossing; and both hands needing the same key at once | code: from `hands.per-bar-range` and `technique.hand-crossing` | operational (this list) |
| coordination.pedal-with-hands | Where printed pedal changes fall against the chord changes: on the chord (direct) or just after it (legato, syncopated) | code: `mark.pedal` positions against `harmony.rhythm` | WP-Sustain_pedal; operational (this list) for the placement test |
| coordination.sustain-vs-move | One hand holds a note or chord while the other moves | code: custom over durations across staves | operational (this list) |
| coordination.hand-interval | The vertical interval between the hands where both move together (unison, third, sixth, octave, tenth), and where it changes | code: partitura onsets shared across staves | operational (this list) |
| texture.motion | Motion between the hands' outer lines: contrary, similar, parallel, oblique | code: music21 `VoiceLeadingQuartet.motionType` (checked) over the outer lines | OMT-motionTypes.html |
| texture.alternating-hands | Hands playing in turn with no shared onsets | code: onsets per staff | operational (this list) |
| technique.hand-crossing | One hand crossing over or under the other: count and distance | code: custom (the yaml's code exists and is not stored) | operational (this list) |

### 1.H Technique and physical demand

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| technique.scale-run | Scale passages, each kind named: diatonic; chromatic; in 3rds or 6ths between the hands; in double notes in one hand; in contrary motion between the hands; with the run's extent in octaves. RULES-texture finds diatonic and chromatic runs and thirds or sixths in one hand; scales in 3rds or 6ths between the hands and in contrary motion have no rule yet (to be written) | code: RULES-texture § technique.scale-run | RULES-texture § technique.scale-run |
| technique.arpeggio-run | Arpeggio passages spanning two octaves or more, the hands in contrary motion named apart | code: RULES-texture § technique.arpeggio-run | RULES-texture § technique.arpeggio-run |
| technique.arpeggio-chord | The chord an arpeggio run outlines (major, minor, augmented, dominant 7th, minor 7th, major 7th, diminished 7th, ninth), its inversion, whether a dominant 7th resolves to the tonic, and whether the hands move in contrary motion | code: music21 `chord.Chord.commonName`, `.inversion()`, `isAugmentedTriad`, `isNinth` (checked) over each run's notes | RULES-texture § technique.arpeggio-run; abilities.md AB-091, AB-103, AB-104 (augmented arpeggios, 7ths and 9ths, contrary-motion arpeggios) |
| technique.thumb-under | Runs that need the thumb to pass under (or fingers over) | both: code from a fingering estimate or the run length; agent where the printed fingering is absent | operational (this list; no fingering solver installed) |
| technique.finger-independence | One hand holding a note or chord while other fingers of the same hand move (two voices in one hand) | code: RULES-texture § technique.finger-independence (overlapping durations within a staff) | RULES-texture § technique.finger-independence |
| technique.span | The largest simultaneous reach per hand in semitones, and reaches beyond a stated hand span (unplayable as written without spreading) | code: custom (the yaml's code exists and is not stored) | operational (this list; the per-level limit is a rule, Phase 2) |
| technique.leap-size | The largest and typical leaps per hand in semitones, and the time allowed for each | code: custom (the yaml's code exists and is not stored) | operational (this list) |
| technique.displacement-rate | The share of hand-position changes larger than an octave made within two beats. A second published definition differs: Chiu and Chen's displacement rate, as RubricNet gives it, weights consecutive moves of 7 to 11 semitones 1 and an octave or more 2, with no time window | code: custom over partitura's note array | SEB Table 1 (displacements over an octave, under 2 beats); RUB (Chiu and Chen's) |
| technique.fingering-demand | Fingering difficulty: substitutions, stretches and awkward sequences | both: code from printed fingering and span; agent where no fingering is printed | SEB Table 1 (a fingering criterion: cost functions on intervals, with its references); no fingering solver installed |
| technique.pedal-implied | Pedal needed where none is printed: harmony changing under a held or broken-chord texture; a held bass the hand cannot keep under a moving chord; a broken chord wider than the span marked to sound together | both: code from durations, span and harmony changes; agent confirms | TCL-SR Grade 6 ("pedalling required but not always marked"); operational (this list) for the three cases; a pedalling rule still to quote |

### 1.I Expression marks

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| mark.dynamics | Printed dynamic levels, each named and counted: ppp to fff, mp, mf, sf or sfz, fp, rf. Also: per staff; the item's dynamic range (softest to loudest mark); changes per bar | code: music21 `dynamics.Dynamic`; partitura `ConstantLoudnessDirection`, `ImpulsiveLoudnessDirection`, `loudness_direction_feature` | MXL-dynamics; ABRSM-SR; TCL-SR |
| mark.hairpin | Gradual dynamic changes, by form: hairpin (wedge) or word (cresc., dim., decresc.); length in bars | code: music21 `dynamics.Crescendo`, `Diminuendo`, `TextExpression`; partitura `IncreasingLoudnessDirection`, `DecreasingLoudnessDirection` | MXL-wedge; ABRSM-SR; TCL-SR (cresc. and dim. as text) |
| mark.articulation | Printed articulations, each named and counted: staccato, staccatissimo, accent, strong accent (marcato), tenuto, portato (detached legato), stress, breath mark, caesura; jazz falls, doits, scoops and plops | code: music21 `articulations` classes (checked); partitura `articulation_feature` (its names checked in source) | MXL-articulations |
| mark.slur | Slurs, by length: short (two or three notes, lifted at the end) or long (a phrase mark); count per hand | code: music21 `spanner.Slur`; partitura `Slur`, `slur_feature` | MXL-slur |
| mark.pedal | Printed pedal marks: count and positions (start, change, stop) | code: music21 `expressions.PedalMark`; partitura `SustainPedalDirection` | MXL-pedal |
| mark.pedal-kind | Which pedal, each named: sustain (damper); half pedal; quarter pedal and flutter pedal (depths, by text or sign); sostenuto; una corda and tre corde (usually text); con pedale or senza pedale text | code: music21 `PedalMark.pedalType` (the import sets only Sustain or Sostenuto, `xmlToM21` lines 4501 to 4503; Soft and Silent never come from a file, and half pedal is not distinguished); una corda and the depth words from music21 `TextExpression` and partitura `Words` (partitura kept "una corda" as Words); agent for non-standard signs | MXL-pedal |
| mark.ornament | Ornament signs, each named and counted: trill (with its wavy-line length, its written start (upper or main note, by a small note) and its written termination); mordent; inverted mordent; turn and inverted turn; schleifer; grace notes, split into acciaccatura (slashed) and appoggiatura | code: music21 `expressions.Trill`, `TrillExtension`, `Mordent`, `InvertedMordent`, `Turn`, `InvertedTurn`, `Schleifer` (checked); `expressions.Trill.nachschlag` (checked to exist) and the grace notes before and after a trill for its start and termination; grace durations; partitura `ornament_feature`, `grace_feature` | MXL-ornaments; MXL-trill-mark; MXL-grace; ABRSM-SR ("simple ornaments") |
| mark.arpeggiate | Spread-chord marks (and the non-arpeggiate bracket): count and positions | code: music21 `expressions.ArpeggioMark`, `ArpeggioMarkSpanner` | MXL-arpeggiate; ABRSM-SR ("spread chords") |
| mark.tremolo | Tremolos: signs (strokes on one note, or a two-note tremolo between notes or chords) and written-out measured alternations; the interval alternated | code: music21 `expressions.Tremolo`, `TremoloSpanner`; custom for measured ones | MXL-tremolo |
| mark.fermata | Pause signs on notes, rests or bar lines | code: music21 `expressions.Fermata`; partitura `Fermata`, `fermata_feature` | MXL-fermata; ABRSM-SR ("pause signs") |
| mark.expression-text | Printed words other than tempo: expression terms (dolce, cantabile, rubato), text dynamics, ending cues | both: code from music21 `TextExpression`, partitura `Words`; agent classifies terms outside a listed vocabulary | MXL-words |
| expression.character | The character asked for, as ABRSM states it: fast and agile (List A pieces "generally faster moving") or lyrical and expressive (List B "more lyrical"), from tempo, articulation, slurs and velocity. List C (a variety of styles) states no character, so the row has two values at most and is otherwise UNKNOWN | both: code combines the rows named; agent decides | ABRSM piano syllabus, "Pieces" paragraph; operational (this list) for the row (meta.published-grade could calibrate it) |

### 1.J Form

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| form.length | Bars, and duration at tempo once repeats are expanded | code: music21 measure count and `repeat.Expander` | operational (this list) |
| form.sections | Sections from repeats, double bars, key changes and rehearsal marks | code: music21 `bar.Barline`, `expressions.RehearsalMark`, `mark.repeat` | MXL-barline; MXL-rehearsal |
| form.phrase | Phrase boundaries with their lengths. At each boundary: a rest or long note, a cadence (`harmony.cadence`), and whether the phrase ends on a stable degree. Also where the phrase begins: whether its first note is a chord tone of the opening harmony and whether it begins on the first beat (as the former quality.phrase-shape measured, `musical_evaluator.py` beginning) | both: code from rests, long notes, cadences and music21 `analysis.segmentByRests.Segmenter` (checked to exist); agent where the evidence is short | OMT-harmonicSyntax1.html |
| form.period | A phrase pair forming a question and an answer (antecedent on a weaker cadence, consequent on a stronger one). Named apart: parallel period (shared opening) and contrasting period | both: code from `form.phrase`, `harmony.cadence`, `melody.motif-repetition`; agent | KP and Green name both kinds (not read in this pass); OMT-period.html (Caplin) requires the consequent to restate the basic idea, so it defines the parallel kind only |
| form.twelve-bar | The twelve-bar blues and its variants | code: RULES-harmony § form.twelve-bar | RULES-harmony § form.twelve-bar |
| form.turnaround | A progression at a section end that leads back to its start | code: RULES-harmony § form.turnaround | RULES-harmony § form.turnaround |
| form.intro-ending | Bars before the form proper (intro) and after it (tag, coda, outro): length and position | both: code from `form.sections`, `mark.repeat`, text; agent | operational (this list) |
| form.multi-strain | Rag and march form: strains and trio | code: RULES-harmony § form.multi-strain | RULES-harmony § form.multi-strain |
| form.thirty-two-bar | The 32-bar chorus of the popular song, two kinds named apart: AABA, and ABAC (A B A C, eight bars each). RULES-harmony finds AABA only and returns "not AABA" for Fly Me to the Moon: the ABAC rule is to be written, its source to be named (Forte or Levine) | code: RULES-harmony § form.thirty-two-bar | RULES-harmony § form.thirty-two-bar (AABA); WP-Thirty-two-bar_form (names AABA only) |
| form.binary-ternary | Small forms, each named: simple binary, rounded binary, ternary, compound ternary (minuet and trio) | code: RULES-harmony § form.binary-ternary; agent for compound ternary | OMT-smallBinary.html; OMT-smallTernary.html; OMT-minuet.html |
| form.variations | Theme and variations: sections restating one theme | both: code from `form.sections` and `melody.motif-repetition`; agent | WP-Variation_(music) |
| form.sonata | Sonata or sonatina form: exposition (two key areas), development, recapitulation | agent, from the coded `form.sections`, `key.change` and `form.length` | OMT-SonataTheory-intro.html (does not mention sonatina: a sonatina source is still needed) |
| form.rondo (new) | Rondo form: a refrain returning between contrasting episodes (ABACA and its kinds) | both: code from section similarity; agent | OMT-rondo.html; RCM (Keyboard Harmony forms) |
| form.fugue (new) | A fugal exposition: a subject stated alone, then answered in each further voice in turn | both: code from `texture.imitation` and `texture.voice-count`; agent | WP-Fugue |
| form.song-sections (new) | Song sections labelled by function: intro, verse, pre-chorus, chorus, bridge, solo section, head, tag or outro; and the Latin sections: the salsa and son montuno (coro-pregón), mambo and moña | both: code from rehearsal marks, text labels, lyric verses and repeats; agent | OMT-popRockForm.html; Mauleón ch V "Song Form and Structures" for the Latin sections (DRAFT: draft-styles § 2; only the title was read, the content is to be read) |
| form.improvisation-space (new) | Bars where the score asks the player to supply the notes: bars with chord symbols and only rests or slashes in the piano staff; "solo", "fill", "ad lib.", "improvise" or "N.C." text; a given opening followed by empty bars; one part of a two-part piece left empty. Count, length, position, and what is given (chords, scale, motif, the other part) | both: code from music21 `harmony.ChordSymbol` over bars whose notes are rests or slash noteheads, `harmony.NoChord` and `expressions.TextExpression`; agent for prose instructions | TCL improvisation stimuli and Rock & Pop solo breaks (DRAFT: draft-abrsm-trinity § 2.2, draft-styles § 2.3); MXL-notehead (slash) |

### 1.K Style and the item's metadata

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| style.evidence | A vector of style signals, one entry per named style, each entry listing the rows that support it with a confidence. Never certified by one signal or label. The styles, each named separately: Baroque, Classical, Romantic, Impressionist and 20th/21st-century; blues, boogie-woogie, ragtime, stride; jazz (swing, bebop, jazz waltz, modal, Latin jazz); rock, pop, ballad, country, reggae, R&B, funk, disco, metal, gospel, rock'n'roll, New Orleans; son, son montuno, danzón, cha-cha-chá, mambo, songo, guaguancó; bossa nova, samba, choro, maxixe; tango; Peruvian and Argentine 6/8 and 3/4; Colombian, Venezuelan, bomba, plena, merengue; hymn; carol and folk song | both: code assembles the supporting rows (texture, rhythm, harmony, form, `notation.swing-mark`); agent weighs them with `style.genre-label` and outside research | the style sources of abilities.md sections 1.K to 1.O (Levine, Mauleón, the Berklee courses and others), per style |
| style.genre-label | A genre label from the metadata, combined with `style.evidence` | both: code from tags and composer; agent | operational (this list) |
| meta.composer-era | The era from the composer's dates | code: a lookup of matched names | operational (this list; the era boundaries to quote) |
| meta.genre-tags | Uploader or collection tags, with their provenance | code: read from the catalogue record | the source record |
| meta.title | Title words that name a form, dance or genre (minuet, étude, rag, carol, waltz) | code: title parsing | the source record |
| meta.collection | The source collection (Hanon, Czerny, Joplin, MuseTrainer) | code: read from the record | the source record |
| meta.published-grade | The piece is on a published graded list: at what grade, from which board | code: a lookup after identity matching | ABRSM, RCM and Trinity syllabi (the URLs above) |
| meta.familiarity | The tune is widely known (Ode to Joy, Twinkle) | agent, unless a sourced list is found | none found (yaml note) |
| meta.arrangement (new) | Whether the item is the original work or an arrangement, each kind named: simplified arrangement, solo-piano reduction of an orchestral or vocal work, cover, lead-sheet realisation, reharmonised (chords changed from the original's). Also whether the arrangement keeps the original's main line | both: code from metadata and `item.format`; agent judges fidelity (and, for reharmonised, compares the chords with the original's where known) (it cannot be proved from the file alone) | operational (this list) |
| generated.spec-declared | A generated item's declared parameters (key, pattern, progression, hands, metre), each with its musical meaning per family (key as tonic, starting note or chord root). Not a property of the music but the generator's declared intent: kept only as a declared input that the music rows check | code: read from the generator's spec | each family's contract (still to be stated per family) |
| style.dance-type (new) | The dance or march a piece is, each kind named and reported separately: minuet, gavotte, bourrée, sarabande, gigue, allemande, courante, polonaise, waltz, ländler, polka, march, siciliano, tarantella (mazurka and tango have their own rows). Each kind is recognised from its metre, its upbeat and its rhythmic cell as its source states them (for example the gavotte's half-bar upbeat, the sarabande's weight on beat 2); each cell is quoted before it is measured | both: code from `metre.class`, `mark.anacrusis`, `rhythm.bar-patterns` and `meta.title`; agent decides | WP-Minuet, WP-Gavotte, WP-Sarabande, WP-Polonaise, WP-Siciliana and others (stand-ins, to be replaced); TCL improvisation stylistic stimulus ("styles from march to irregular dance"; DRAFT: draft-abrsm-trinity § 2.2) |
| meta.keyboard-sound (new) | The sound the score asks of the keyboard part: acoustic piano, electric piano, organ, synthesiser, harpsichord, other | code: music21 `instrument.Instrument` subclass per part (`ElectricPiano`, `ElectricOrgan`, `Harpsichord`, `Sampler` exist), raw `<instrument-sound>`; text such as "Organ" | MXL-instrument-sound; TCL-RP (sound per style) |

### 1.L Derived: difficulty and material quality

These combine the rows above; how they combine is Phase 2's rule work. Each is a characteristic of the item ("at about this level"), not a new observation.

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| difficulty.reading | Reading load: from `reading.accidental-churn`, `pitch.ledger`, `notation.keys` (the density of the page is `difficulty.perceptual`) | code: calibrated model | operational (calibration set to source) |
| difficulty.rhythm | Rhythmic load: from `rhythm.values`, `rhythm.syncopation`, `rhythm.triplets`, tuplets | code: calibrated model | operational (calibration set to source) |
| difficulty.pitch-navigation | Range, leaps, shifts and black keys: from `hands.per-bar-range`, `technique.leap-size`, `technique.position-shift`, `pitch.black-key-share` | code: calibrated model | operational (calibration set to source) |
| difficulty.coordination | Hands-together load, including easy parts that are hard together: from the coordination rows and `texture.polyrhythm` | code: calibrated model | operational (calibration set to source) |
| difficulty.technique | Spans, chords, crossings, ornaments, repeated notes: from the technique rows | code: calibrated model | operational (calibration set to source) |
| difficulty.harmonic-load | Chord changes per bar and chromatic share | code: calibrated model | operational (calibration set to source) |
| difficulty.expressive | Control demanded by printed marks: counts and change rate of the `mark.*` rows | code: calibrated model | operational (calibration set to source) |
| difficulty.perceptual | Visual density and unusual engraving: from `reading.visual-density` and `reading.unusual-notation` | code: rule over `reading.visual-density` and `reading.unusual-notation` | operational (rule to source) |
| difficulty.level | One overall level, tied to a published grade scale where a graded reference set calibrates it | code: calibrated model | a graded reference set (CIPI, PSyllabus: not downloaded, yaml note) |
| difficulty.local-profile | Difficulty in a moving window per hand and for both hands, and where its peak (the hardest passage) is | code: calibrated model | operational (calibration set to source) |
| quality.coherence | The item hangs together as music, judged against a checklist: each phrase arrives (ends on a stable degree, with a cadence); motifs are reused; no stray rests (rests fall at phrase boundaries) | agent, answering each checklist item (the measurable ones from `form.phrase`, `harmony.cadence`, `melody.motif-repetition`) | none (judgement) |
| quality.idiomatic | The item is idiomatic for the piano and for its style, judged against a checklist: for the piano, reachable spans, no hand collisions, textures that can be pedalled; for its style, the `style.evidence` rows | agent, answering each checklist item (the measurable ones from `technique.span`, `technique.hand-crossing`, `coordination.register-overlap`, `style.evidence`) | none (judgement) |

## 2. The 237 existing rows

One line each, in `characteristics.yaml` order. **Kept**: the row stands as defined (with its library names checked). **Corrected**: the definition changed, as stated. **Merged**: folded into the named row. **Retired**: not a characteristic of the music; the reason given. A retired file or pipeline check stays a build check; it only leaves this list.

- prereq.untaught-demands: retired. A curriculum relation computed after assignment from the item's characteristics and the rung's taught set, not a property of the item.
- prereq.taught-set-generated: retired. The same relation, for generated families.
- prereq.hand-assignment: corrected. Now hand assignment per note, adding printed hand words and cross-staff notes (the `prereq.` prefix is historical).
- clef.treble: merged into notation.clefs (new).
- clef.bass: merged into notation.clefs (new); notation.clefs reports the notes read in each clef per staff, which is what the app's `bassClef` locates (pass 1).
- pitch.ledger: corrected. Counts how many ledger lines (above and below), and middle C apart; counted at the displayed position, an octave shift subtracted (pass 1).
- notation.keys: kept.
- notation.times: kept.
- notation.staves: kept (partitura's staff field comes from `Part.note_array(include_staff=True)`, not `compute_note_array`).
- notation.clef-change: kept.
- notation.bars: merged into form.length (the same count).
- notation.chord-symbols: corrected. Adds the symbol system (letter, slash, Roman or Nashville text), over a melody or alone, and the N.C. marks (pass 1).
- notation.lyrics: corrected. Adds the number of verses.
- notation.swing-mark: corrected. Raw `<swing>` is the only route: neither music21 nor partitura reads it (pass 1).
- mark.dynamics: corrected. Each level named; per staff; dynamic range; changes per bar.
- mark.hairpin: corrected. Adds the word forms (cresc., dim.) beside the wedge.
- mark.articulation: corrected. Each kind named (adds staccatissimo, marcato, portato, stress, breath, caesura, jazz articulations).
- mark.slur: corrected. Short slur against phrase mark by length.
- mark.pedal: kept.
- mark.pedal-kind: corrected. Adds quarter and flutter pedal; the file gives only sustain and sostenuto, so the rest come from text (pass 1).
- mark.ornament: corrected. Each kind named, grace notes split into acciaccatura and appoggiatura, trill length, written start and termination (pass 1).
- mark.arpeggiate: kept.
- mark.tremolo: corrected. Adds written-out measured tremolos and the interval alternated.
- mark.ottava: kept.
- mark.fermata: kept.
- mark.repeat: corrected. Each kind named, and bars once expanded. Well-formedness stays a build check (integrity.repeat-structure).
- mark.fingering: corrected. Adds share fingered, first-note-only, substitutions and alternates (music21 attributes checked).
- mark.anacrusis: kept.
- mark.tempo-text: corrected. Adds the metronome mark's beat unit; tempo words come from partitura or `TextExpression`, not music21 `TempoText` (pass 1).
- mark.tempo-change: corrected. Each kind named; metric modulation added; rit. and accel. come from partitura or `TextExpression`, not music21's spanners (pass 1).
- mark.expression-text: kept.
- expression.character: corrected. ABRSM's two characters cited; at most two values (pass 1).
- rhythm.values: corrected. Each value and rest named and counted separately (absorbs eighths, sixteenths, shorter-than-quarter).
- rhythm.eighths: merged into rhythm.values.
- rhythm.shorter-than-quarter: merged into rhythm.values.
- rhythm.sixteenths: merged into rhythm.values.
- rhythm.dotted-quarter: corrected. Every dotted kind named (half, quarter, eighth, double-dotted); the id is kept for continuity.
- rhythm.ties: kept (absorbs ties-across-bar).
- rhythm.ties-across-bar: merged into rhythm.ties.
- rhythm.syncopation: corrected. Kinds named, beat and subdivision levels apart, a pickup excluded (the proving run's 82 pickup cases). Pass 1: the stale pickup note removed (the app already excludes it); the accent kind cited to the app's source.
- rhythm.triplets: kept.
- rhythm.tuplets-other: kept.
- metre.compound: merged into metre.class (new).
- metre.three-four: merged into metre.class (new).
- metre.odd: merged into metre.class (new).
- rhythm.repeated-notes: kept.
- rhythm.equal-stream: kept.
- rhythm.habanera: kept (pass 1: the app's detector reads the left hand only, noted).
- rhythm.tresillo: kept.
- rhythm.secondary-rag: kept.
- rhythm.shuffle: corrected. Defined as the long-short pair figure, 2:1 or 3:1 as notated; swung eighths belong to notation.swing-mark (pass 1).
- rhythm.beat-onset-share: kept.
- interval.step: merged into interval.melodic (new).
- interval.skip: merged into interval.melodic (new).
- interval.leap: merged into interval.melodic (new).
- key.signature: merged into key.signature-exercised (pass 1: not notation.keys; the app's `keySignature` locates the notes the signature alters, which is that row's content).
- key.signature-exercised: corrected. Absorbs key.signature: the located notes (pass 1).
- key.transposition-cost: retired. A computation (transpose the item, then read this list's rows on the result), not a property of the item; the method stays available to Phase 2.
- pitch.chromatic: corrected. Splits the raised notes of minor from other chromatic notes; measured against the sounded key where it differs from the signature (pass 1).
- range.beyond-position: merged into technique.five-finger (its negation, one fact).
- hands.per-bar-range: corrected. Adds the whole compass and register shares, and absorbs integrity.piano-range.
- reading.visual-density: corrected. Adds accidentals and ledger-line notes per bar.
- reading.accidental-churn: corrected. Closed to the same staff position, letter and octave on one staff (pass 1).
- reading.accidental-kinds: corrected. Courtesy accidentals are read from raw MusicXML, which music21 does not read (pass 1).
- reading.unusual-notation: corrected. Excludes constructs with their own row (clef change, extended technique, cadenza); the list of constructs is closed (pass 1).
- reading.pitch-entropy: kept (pass 1: marked a difficulty input, not a teaching target).
- reading.redundancy: kept (pass 1: the Pitch Set LZ descriptor credited to RubricNet).
- key.tonic-mode: corrected. Music21 TonalCertainty added as the confidence witness; the method named is the one called: `analyze('key')` is Aarden-Essen in music21 10.5 (pass 1).
- key.minor-form: kept.
- key.change: corrected. Names printed change, modulation and tonicisation apart, and the relation.
- key.set-membership: retired. A test of key.tonic-mode against a list (guitar keys, singable keys); the list belongs to the rule.
- scale.collection: corrected. Absorbs harmony.modal (modes named with their tonic); octatonic and "none" added. Pass 1: further collections added; Ionian and Aeolian named once.
- harmony.chord-quality: corrected. Each quality named; symbols and notes reported apart. Pass 1: added and altered tones read from `getChordStepModifications()`; the Phrygian chord, quartal and quintal sonorities added.
- harmony.rhythm: corrected. Read from the chord timeline of RULES-harmony, not from `chordify` change points (pass 1).
- harmony.chord-vocabulary: kept.
- harmony.inversion: kept (pass 1: source corrected).
- harmony.roman: corrected. Defined by RULES-harmony's numerals, not by music21's `romanNumeralFromChord` (pass 1).
- harmony.progression: corrected. Each progression named (adds descending fifths, lament, doo-wop, plagal). Pass 1: the cadential 6-4 added; descending fifths, plagal progressions and the lament bass marked as without a rule yet.
- harmony.applied: corrected. Adds modal mixture, Neapolitan, augmented sixths, gospel passing chords. Pass 1: pivot chords make the detector "both"; Neapolitan, modal mixture and gospel passing chords marked as without a rule.
- harmony.cadence: corrected. Each type named; Phrygian half added. Pass 1: the British terms named once; the Phrygian half marked as without a rule.
- harmony.chromatic-share: corrected. States that the harmonic-minor V, V7 and vii° count as diatonic (pass 1).
- harmony.voicing: corrected. Adds drop-2, locked hands, Bud Powell shells as named kinds. Pass 1: upper structure, drop-2, locked hands and Bud Powell shells marked as to be written.
- harmony.voice-leading: corrected. Names the checks (parallels, crossing, overlap, resolutions) with the music21 methods checked.
- harmony.chord-connection: kept.
- harmony.modal: merged into scale.collection.
- harmony.bass-behaviour: corrected. Kinds named (adds tonic-dominant bass and two-feel). Pass 1: the pedal bass left to texture.pedal-point.
- melody.chord-relation: corrected. Adds the classical non-chord-tone types. Pass 1: the chord member (root, 3rd, 5th, 7th, 9th) added.
- melody.degree-profile: corrected. Chromatic notes are read through `getScaleDegreeAndAccidentalFromPitch` (pass 1).
- melody.tessitura: kept.
- melody.motif-repetition: corrected. A definition of motif and of exact, transposed and varied recurrence.
- texture.hands-together: kept (pass 1: the bar-level view of the fact coordination.synchrony-share gives per onset).
- texture.left-hand-pattern: corrected. Defined as the code measures it (a moving left hand in every bar); a repeating figure is texture.ostinato (pass 1).
- texture.walking-bass: corrected. The coded rule is stated: one move in eight by step, in every bar (pass 1).
- texture.block-chords: corrected. Each chord size per hand named and counted (the syllabi grade 2-note and 3-note chords in a hand).
- texture.broken-chord: corrected. The named figures are reported separately (pass 1).
- texture.alberti: kept.
- texture.arpeggio: kept.
- texture.waltz-bass: kept.
- texture.oom-pah: kept.
- texture.stride: kept (pass 1: the figure, not the style).
- texture.boogie-bass: kept.
- texture.ostinato: corrected. Kinds named (ostinato, riff, vamp); a figure transposed to the chord roots is a separate kind with its own test (pass 1: the draft counted it as an ostinato).
- texture.pedal-point: kept (pass 1: the one definition of the pedal bass).
- texture.held-under-moving: merged into technique.finger-independence (the same overlap within one hand; the cross-hand case is coordination.sustain-vs-move).
- texture.sustained: kept.
- texture.four-to-the-bar: merged into texture.repeated-chords (new), as its quarter-note kind, with the rule's definition: at most two chords a bar, in one register (pass 1).
- texture.charleston: kept.
- texture.montuno: kept.
- texture.tumbao: kept.
- texture.clave: corrected. The 6/8 clave added (pass 1).
- texture.bossa: kept.
- texture.tango: corrected. The detector is "both"; síncopa, arrastre and yumba added (pass 1).
- texture.mazurka: kept (pass 1: noted that the rule cannot tell a polonaise).
- texture.stop-time: kept.
- texture.octaves: corrected. Each kind named.
- texture.double-notes: kept.
- texture.power-chord: corrected. Read from the MusicXML kind `power`; the register or style condition added (pass 1).
- texture.two-voice: merged into texture.counterpoint.
- texture.voice-count: kept.
- texture.counterpoint: corrected. Absorbs two-voice: the number of independent lines and their independence.
- texture.part-roles: kept.
- texture.motion: kept.
- texture.alternating-hands: kept.
- texture.polyrhythm: corrected. Each kind named (adds 3 against 4 and 4 against 3). Pass 1: kinds written without tuplets included; detected from the onset grids.
- texture.tremolo-thirds: corrected. The figure only; "blues" dropped from the definition (pass 1).
- texture.crushed-note: corrected. The figure only; "blues" dropped from the definition (pass 1).
- texture.half-time: kept.
- texture.call-response: kept.
- texture.melody-in-chords: kept.
- texture.build: kept.
- texture.register-trajectory: kept.
- texture.bass-walk-up: kept.
- texture.hand-independence: merged into coordination.rhythmic-independence (its own `from` was that row and synchrony-share).
- coordination.synchrony-share: kept.
- coordination.rhythmic-independence: kept (absorbs texture.hand-independence).
- coordination.unequal-rates: kept.
- coordination.articulation-conflict: kept.
- coordination.dynamic-balance: corrected. Different printed dynamics per hand (a Trinity sight-reading parameter) and melody over accompaniment.
- coordination.register-overlap: corrected. Both hands needing the same key at once added, from technique.playability (pass 1).
- coordination.pedal-with-hands: corrected. Defined as where pedal changes fall against chord changes.
- coordination.sustain-vs-move: kept.
- coordination.hand-interval: kept.
- coordination.interaction: merged into difficulty.coordination (a calibrated model, not an observation).
- technique.scale-run: corrected. Each kind named. Pass 1: scales in 3rds or 6ths between the hands and in contrary motion marked as without a rule.
- technique.arpeggio-run: corrected. Hands in contrary motion named apart (pass 1).
- technique.arpeggio-chord: corrected. Augmented, minor 7th, major 7th and ninth chords and contrary motion added (pass 1).
- technique.five-finger: corrected. Absorbs range.beyond-position; adds the extended (sixth) class and the named position. Pass 1: at most five distinct pitches; the extended class and the named positions marked as to be written.
- technique.position-shift: kept.
- technique.thumb-under: kept.
- technique.velocity: kept (absorbs difficulty.tempo; pass 1: SEB's definition added as a second).
- technique.endurance: corrected. A stated formula: the longest span without a rest, in notes and in seconds; absorbs difficulty.endurance (pass 1).
- technique.finger-independence: corrected. Absorbs texture.held-under-moving; two voices in one hand.
- technique.span: corrected. Absorbs integrity.hand-span and technique.playability (reaches beyond a stated span flagged).
- technique.leap-size: kept.
- technique.displacement-rate: kept (pass 1: a second published definition, Chiu and Chen's, noted).
- technique.hand-crossing: kept.
- technique.fingering-demand: kept (pass 1: SEB Table 1's fingering criterion cited).
- technique.playability: merged into technique.span (span and range are the measurable parts; the playability limit is a rule); the hands needing one key at once goes to coordination.register-overlap (pass 1).
- technique.pedal-implied: kept (pass 1: TCL-SR Grade 6 cited).
- technique.written-ornament: kept.
- form.length: kept (absorbs notation.bars).
- form.sections: kept.
- form.phrase: corrected. Absorbs item.continuity, quality.phrase-shape, quality.rests and quality.cadence-close (what lies at each phrase boundary). Pass 1: the beginning (opening chord tone, first beat) added from quality.phrase-shape.
- form.period: corrected. Parallel and contrasting named apart. Pass 1: source corrected (OMT defines the parallel kind only).
- form.twelve-bar: kept.
- form.turnaround: kept.
- form.intro-ending: kept.
- form.multi-strain: kept.
- form.thirty-two-bar: corrected. ABAC added beside AABA (pass 1).
- form.binary-ternary: corrected. Each form named (rounded binary, compound ternary added).
- form.variations: kept.
- form.sonata: corrected. Sonatina form named with sonata form; an agent row over coded sections. Pass 1: OMT holds no sonatina text; a sonatina source is still needed.
- difficulty.features: retired. A container of 19 raw features, each now a row: bars (form.length), notesPerBar (reading.visual-density), notesPerSecond (technique.velocity), maxSimultaneousRight/Left (texture.block-chords), maxSpanRight/Left (technique.span), maxLeapRight/Left (technique.leap-size), rangeRight/Left (hands.per-bar-range), blackKeyRatio (pitch.black-key-share), keyAccidentals (notation.keys), shortestValue and distinctRhythms (rhythm.values), voicesPerStaff (texture.voice-count), handCrossings (technique.hand-crossing), ornaments (mark.ornament), ledgerRatio (pitch.ledger).
- difficulty.reading: corrected. `reading.visual-density` moved to difficulty.perceptual (pass 1).
- difficulty.rhythm: kept.
- difficulty.pitch-navigation: kept.
- difficulty.coordination: kept (absorbs coordination.interaction).
- difficulty.technique: kept.
- difficulty.harmonic-load: kept.
- difficulty.tempo: merged into technique.velocity (the same speed demand).
- difficulty.endurance: merged into technique.endurance (the yaml defined both the same way).
- difficulty.expressive: kept.
- difficulty.perceptual: corrected. Its inputs named (visual density, unusual notation); "rhythmic ambiguity" dropped, no row reads it (pass 1).
- difficulty.level: kept (absorbs difficulty.grade-calibration).
- difficulty.local-profile: kept.
- difficulty.grade-calibration: merged into difficulty.level (the calibration of the same level).
- target.prevalence: retired as a row. The count every row reports (the output convention).
- target.distribution: retired as a row. The positions every row reports.
- target.concentration: retired as a row. Computed from the positions; its threshold is a rule.
- target.salience: retired as a row. The staff, beat strength, chord membership and place in a chord (top, inner, bottom) of each reported occurrence, from the output convention (pass 1).
- target.isolation: retired as a row. Co-occurrence per bar, computed from every row's positions.
- target.interaction: retired as a row. Co-occurrence at the same onset, as target.isolation.
- item.continuity: merged into form.phrase (recovery points are the phrase boundaries, rests and repeats).
- item.progression: retired as a row. The demand density per part of the item, computed from positions.
- target.representativeness: retired. A judgement made when assigning an item to an ability (the next step).
- transfer.distance: retired. A relation between an item and a target, made at assignment.
- role.suitability: retired. A placement decision (introduction, fluency, transfer), not a property of the music.
- generated.spec-declared: corrected. Absorbs generated.spec-interpreted and meta.generator-params: each parameter with its musical meaning. Pass 1: kept only as a declared input that the music rows check.
- generated.spec-interpreted: merged into generated.spec-declared.
- generated.spec-complete: retired. A completeness check of a generator's contract.
- generated.spec-vs-actual: retired. A verification of the generator, done by reading this list's rows on the file.
- generated.identity: retired. Build reproducibility.
- integrity.key-consistency: retired. A file check comparing two rows (notation.keys against key.tonic-mode).
- integrity.bar-duration: retired. File well-formedness.
- integrity.truncation: retired. File completeness.
- integrity.repeat-structure: retired. Well-formedness of the repeats; the musical fact is mark.repeat.
- integrity.title-structure: retired. A check of the title against form.sections.
- integrity.grace-density: retired. A renderer limit.
- integrity.render: retired. An app check.
- integrity.duplicate-version: retired. A catalogue check.
- integrity.extra-parts: merged into item.format (new) (piano part with other instruments).
- integrity.transposing-part: retired as a characteristic of the music; kept on the build-check list below (pass 1: no code exists, so retiring it would drop the check).
- integrity.lead-sheet-shape: merged into item.format (new) (lead sheet).
- integrity.piano-range: merged into hands.per-bar-range.
- integrity.hand-span: merged into technique.span.
- integrity.notation-sanity: corrected. Reinstated as a characteristic (pass 1): misspelt notes or wrong beaming in a score teach wrong reading.
- integrity.metadata-trust: retired as a row. A provenance attribute every meta.* value carries; written into the Conventions (pass 1).
- integrity.arrangement-fidelity: merged into meta.arrangement (new).
- style.evidence: corrected. One entry per named style, so that a signal for one style never certifies another.
- style.genre-label: kept.
- style.good-example: retired. A judgement of teaching fitness made at assignment.
- quality.phrase-shape: merged into form.phrase (the arrival and, since pass 1, the beginning).
- quality.contour: corrected. A melodic-contour definition with the jSymbolic arc features.
- quality.rests: merged into form.phrase.
- quality.leap-recovery: corrected. A definition with its size (a 4th or more) and the recovery.
- quality.cadence-close: merged into form.phrase (the stable degree at the boundary; the cadence type is harmony.cadence).
- quality.reference-distribution: retired. A validation method for generated items, not a characteristic.
- quality.coherence: corrected. Judged against a checklist (pass 1).
- quality.idiomatic: corrected. Judged against a checklist (pass 1).
- quality.pedagogical-fit: retired. A placement judgement (the next step).
- meta.composer-era: kept.
- meta.genre-tags: kept.
- meta.title: kept.
- meta.collection: kept.
- meta.generator-params: merged into generated.spec-declared (the yaml called them the same raw parameters).
- meta.published-grade: kept.
- meta.familiarity: kept.

### Build checks that stay tracked (not characteristics)

A retired file or pipeline check leaves this list but is not dropped. A check that has no code today is named here, so that retiring it keeps it.

- **integrity.transposing-part.** A part written in the pitch of a transposing instrument, so that its notes sound other than written, would put wrong pitches in front of the learner. No code exists (the yaml: MISSING). To be written as a file check: compare each part's declared transposition (MusicXML `<transpose>`, music21 `Instrument.transposition`; names not checked in this pass) with the instrument, and flag a piano part that is not at concert pitch. The list's rows read the written pitch only.

## 3. Counts (by script over this file)

Counted on 2026-10-08 by a script (`build/count_final.py` in the worktree, not committed), re-run after the pass-1 edits. It reads the id rows of section 1's tables and the disposition lines of section 2, and checks them against the ids in `characteristics.yaml`. A row the pass-1 edits changed in definition or detector is counted as corrected; one changed in source only keeps its earlier disposition.

| count | value |
| --- | --- |
| characteristics in section 1 | 213 |
| new (not in the yaml) | 43 (25 from the first draft, 18 added in pass 1) |
| from the yaml, kept | 89 |
| from the yaml, corrected | 81 (includes integrity.notation-sanity, reinstated in pass 1) |
| yaml rows merged into another row | 36 |
| yaml rows retired | 31 |
| yaml rows with a line in section 2 (kept + corrected + merged + retired) | 237 of 237, each exactly once, in the yaml's order |
| check: kept + corrected = the yaml ids in section 1 | 89 + 81 = 170 |
| check: every merge target is a row of section 1; no merged or retired id is still in section 1; no id is duplicated | 0 problems found |

## 4. Cross-check against the abilities, and what was left out

**The scan.** Abilities.md section 1 (232 rows) was read once, after sections 1.A to 1.L were drafted from the yaml, the libraries, the catalogues and the syllabi. The scan asked of each row whether an item that trains or demands it shows a property the list lacks. It added these rows:
- notation.turn-opportunity (page turns, AB-229; drafted as page breaks, redefined in pass 1 because a break belongs to one engraving)
- rhythm.cadenza (unmeasured runs, AB-034)
- rhythm.backbeat (AB-121, AB-124, AB-179)
- rhythm.hemiola (AB-237; sesquialtera for AB-192)
- rhythm.cinquillo (danzón, AB-187)
- texture.offbeat-chords (reggae, AB-179)
- texture.repeated-chords' eighth and triplet kinds (pop and rock'n'roll textures, AB-177, AB-178)
- texture.piano-role (roles, AB-179, AB-191, AB-200)
- texture.melody-location (AB-013, AB-014)
- texture.imitation and form.fugue (AB-017)
- melody.sequence (AB-113, AB-202)
- harmony.figured-bass (AB-112)
- mark.glissando (AB-224)
- mark.extended-technique (AB-238)
- form.song-sections (AB-158, AB-230)
- meta.arrangement (AB-079, AB-172)

It also widened existing rows (each correction in section 2): the five-finger row's extended position (AB-011); the dotted kinds (AB-032); the chord sizes per hand (AB-025); the chord-symbol systems (AB-108); the octave kinds (AB-236); lyric verses (AB-230).

The other new rows came from the library and catalogue reading: interval.melodic, interval.harmonic, metre.class, texture.type, pitch.black-key-share (the project's own difficulty feature), notation.clefs, item.format and form.rondo (RCM's forms).

**Pass 1 (2026-10-08).** A second agent read all 232 abilities again against this list (`audits/characteristics-pass1/missing.md`): 62 showed a miss, now covered by the 18 rows added (notation.reading-aids, notation.slash-rhythm, pitch.inventory, reading.enharmonic-spelling, key.polytonal, pitch.tone-row, metre.grouping, rhythm.silence, rhythm.bar-patterns, rhythm.clave-alignment, harmony.implied, harmony.planing, harmony.dissonance-share, harmony.chord-scale, texture.latin-pattern, form.improvisation-space, style.dance-type, meta.keyboard-sound) and by 18 parts added to existing rows; 23 were found not to be in the music (the checker's section 3 names them); 147 were covered by existing rows. Its counts are its own, not recomputed here.

Several abilities show no property in the score: posture, tension, practice method, recording oneself, counting in, keeping one's place with others, choosing a key for a singer, aural answers. The scan added nothing for them. That is a reading, recorded for the assignment step, which owns it.

**Library features left out** (statistical, with no teaching meaning on their own, or performance-only):
- jSymbolic's histogram statistics: pitch and pitch-class histograms, variability, skewness and kurtosis; the most-common and prevalence features; beat-histogram and rhythmic-pulse features; rhythmic value run lengths and offsets; rest-duration statistics (except the complete-rest features R-41, R-44 and R-46 that `rhythm.silence` cites).
- jSymbolic's MIDI-only features: pitch-bend glissando, vibrato and microtones; velocity dynamics; staccato by MIDI duration; non-piano instrument fractions.
- music21 native: MostCommonNoteQuarterLength (QL2), its prevalence (QL3), the set-class simultaneity counts (CS1 to CS4), IncorrectlySpelledTriadPrevalence (CS11; kept as a witness for integrity.notation-sanity), LandiniCadence (MC1), LanguageFeature (TX1).
- partitura: `estimate_tonaltension`; `estimate_time` (a score states its metre); the performance codec and performance features.

## 5. Not done in this draft

- **The URL for SEB was not checked.** RUB's arXiv page was fetched in pass 1.
- **The WP- sources are stand-ins.** Each should be replaced, in the checks, by the published definition the article cites.
- **Pass 1 of the checks is applied, not the whole of item 1b.** The orchestrator's judgement that the list is comprehensive, and the assignment of characteristics to abilities, are still to come.
- **The text of the ABRSM 2027 & 2028 specification was not read.** The sight-reading vocabulary rests on the 2025 & 2026 edition's table.
- **No row was run on a real score in this pass.** The library names were checked by import and by reading source, not by measuring items (the yaml's proving run, 2026-10-07, is the only measurement).
- **The jSymbolic codes T-19 (parallel motion) and T-21 (contrary motion).** The first draft's fetch was cut at T-12; the pass-1 checker downloaded the whole manual page (T-1 to T-24), and `harmony.planing` cites T-19 as a definition witness. The pass-1 row check had the cut copy and read only up to T-12.
- **Cells and sources not read.** The cells of texture.latin-pattern's kinds, style.dance-type's kinds, the tango figures, the alternate-note pattern and the b3 pentatonic are not quoted; Mauleón ch V and the OMT planing and cadential 6-4 pages were not read. Each row says so; they are read before a rule is written.
