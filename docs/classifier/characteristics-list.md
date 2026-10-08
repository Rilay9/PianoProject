# Characteristics: the Phase 1b draft list (2026-10-08)

**Draft for the checks of FABLE.md section 2, item 1b. Not yet checked by an independent agent.** Worktree base b3c373f1.

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

A library feature is listed only where it says something a piano learner meets in the music (a demand, a pattern, a style trait, difficulty). The statistical features left out are named in one line in section 4.

**Conventions.**
- **Output.** Every characteristic reports, where it applies: present, absent or UNKNOWN; its count; its bar and beat positions; and the hand. The hand is the staff unless `prereq.hand-assignment` says otherwise. Each part a row names (for example each pattern kind) is reported separately, so that evidence for one part never certifies another. A target's prevalence, spread, concentration, salience (staff, beat strength, chord membership) and co-occurrence with other rows are computed from these outputs. They are not separate characteristics (section 2: `target.*`).
- **"Detected by."** "code" names the library and feature (every API name checked by import in `.venv`, or by reading the library's source, on 2026-10-08), or says "custom" where no library feature serves. "agent" says what the agent reads. "both" means code establishes what it can and an agent settles the rest, which is named.
  - music21's jSymbolic extractors count a Part as a MIDI channel, so on one piano part their voice and texture features say little. They are named only as second witnesses.
  - jSymbolic's chord (C-) and voice-motion (T-13 onward) features are not among music21's 72. The jSymbolic Java tool is not installed. Where they are cited, they are cited as definitions only.
- **Sources.** Each row's source is the definition it rests on, as a key resolving in the table below. "Operational (this list)" marks a definition written here because no published one was found or read; such a row needs its source in the checks. Rules pages (`docs/classifier/rules/*.md`) carry their own quoted sources.

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
| RUB | RubricNet (Zapata and Ramoneda 2024), as cited in `characteristics.yaml` (URL not checked in this pass) | not checked |
| SEB | Sébastien et al. 2012, Score Analyzer, Table 1, as cited in `characteristics.yaml` (URL not checked in this pass) | not checked |
| DIFF | `tools/content/difficulty.py` FEATURE_NAMES (this project's code; no published definition) | (repository file) |

## 1. The list

"(new)" marks a row not in `characteristics.yaml`. Every other id is the yaml's, kept or corrected (section 2).

### 1.A The item and its score

| id | what it is (defined so two readers measure the same thing) | detected by | source of its definition |
| --- | --- | --- | --- |
| item.format (new) | The kind of score the item is, one value: **piano score** (every note written, on a grand staff or on one staff per hand); **lead sheet** (one melody staff with chord symbols, no written accompaniment); **chord chart** (chord symbols or slash notation, no melody); **piano-vocal-guitar song score** (a vocal staff with lyrics over a piano grand staff, chord symbols above); **hymn or chorale in parts** (two to four voices on two staves, or open score); **duet part** (primo, secondo or teacher part); **piano part with other instruments** (other parts present, or a backing declared in the metadata); **pre-staff notation** (finger numbers or letter names without a staff); **technical exercise** (a scale, arpeggio, chord pattern or drill) | both: code from music21 `Score.parts` and `layout.StaffGroup`, `harmony.ChordSymbol` presence, `note.Lyric` per staff, `instrument.Instrument` per part (music21 `PitchedInstrumentsPresentFeature` as a second witness); agent where the shapes are ambiguous (a written accompaniment under a sung melody: piano score or song score), and for pre-staff notation, which MusicXML does not encode | TCL-RP (chord charts and lead sheets as score formats); RCM (lead-sheet tests); MXL-staves; MXL-harmony; hymn and song-score layouts as the abilities' sources describe them (abilities.md AB-193, AB-230) |
| notation.staves | Number of staves in the piano part (one or two, rarely three), and number of parts in the file | code: raw MusicXML `<staves>`; music21 Part count; partitura `Part.note_array(include_staff=True)` field `staff` (checked: the field is absent from `compute_note_array`'s output) | MXL-staves |
| prereq.hand-assignment | Which hand plays each note: by staff by default, changed by printed hand words (m.d., m.s., r.h., l.h.), by notes written on the other hand's staff (cross-staff), or by a one-staff item's declared hand | both: code from partitura `staff`, music21 `expressions.TextExpression` for the words, raw `<staff>` on each note; agent where a one-staff item or a hand word is ambiguous | MXL-staff |
| texture.melody-location (new) | Where the melody is, per phrase: which hand, and which voice (top, inner or bass), carries the main line. Includes a melody passed from one hand to the other within a phrase (hand exchange), and a left-hand melody under a right-hand accompaniment | both: code takes candidate lines per staff (the top line from music21 `Stream.chordify`, voice lines from partitura `estimate_voices`) and the staff carrying lyrics or most single-note onsets; agent decides melody against accompaniment where both hands are active | WP-Homophony (melody with accompaniment); operational (this list) for hand exchange |
| notation.clefs (new) | The clefs used on each staff (treble, bass, other), including a treble clef in the left hand or a bass clef in the right hand | code: music21 `clef.TrebleClef`, `clef.BassClef`; partitura `clef_feature` | MXL-clef |
| notation.clef-change | Clef changes within a staff: count and position, at a bar line or inside a bar | code: music21 clef objects with their offsets | MXL-clef |
| pitch.ledger | Notes on ledger lines, per staff: count, the most ledger lines on one note above and below the staff, and middle C on a ledger line counted separately | code: custom from the pitch and clef (the app's `detect.ts` ledgerLines; music21 pitch against the clef as a second witness) | WP-Ledger_line |
| mark.ottava | Octave-shift spans (8va, 8vb, 15ma, 15mb) and loco: kind, length in bars, staff | code: music21 `spanner.Ottava`; partitura `OctaveShiftDirection` | MXL-octave-shift |
| notation.keys | The key signatures: number of sharps or flats, and every change with its position | code: music21 `key.KeySignature`; partitura note-array fields `ks_fifths`, `ks_mode` | MXL-key; ABRSM-SR and TCL-SR (keys by grade) |
| key.signature-exercised | How many notes the key signature alters, per altered degree (a signature can be printed and never exercised) | code: music21 `KeySignature.alteredPitches` counted against the notes | MXL-key |
| pitch.chromatic | Notes whose pitch is outside the key signature's scale, per bar and per hand, split into the raised notes of a minor key (from `key.minor-form`) and other chromatic notes | code: music21 pitch and `Accidental` against `KeySignature.alteredPitches`; partitura `estimate_spelling` as a second witness | ABRSM-SR ("chromatic notes"); TCL-SR (minor keys with their raised notes) |
| reading.accidental-kinds | Printed accidentals by kind (sharp, flat, natural, double sharp, double flat), courtesy accidentals, and accidentals that carry through a bar or across a tie without being reprinted | code: music21 `pitch.Accidental` `.name` and `.displayStatus` (checked); raw `<accidental cautionary>` | MXL-accidental; TCL-SR (double sharps and flats) |
| reading.accidental-churn | Accidentals that cancel and return within one bar on the same letter name | code: custom per bar from music21 accidentals | operational (this list) |
| reading.visual-density | Per staff per bar: notes, simultaneous notes per onset, accidentals and ledger-line notes | code: custom over partitura's note array (DIFF `notesPerBar`, `voicesPerStaff`, `ledgerRatio` exist); jSymbolic R-10 as the published definition of note density per quarter note | JS R-10; DIFF |
| reading.unusual-notation | Constructs a reader meets rarely, other than those with their own row: cross-staff beams and notes, cue-size notes, nested tuplets, crossed stems between voices, unusual noteheads | code: raw MusicXML (`<cue>`, `<staff>` on notes inside one beam, nested `<tuplet>`), music21 `note.Note.notehead` | MXL-cue; MXL-notehead |
| reading.pitch-entropy | Shannon entropy of the pitch distribution per hand (how varied the pitches are) | code: scipy `stats.entropy` over partitura's note array | RUB (reporting Chiu and Chen 2012) |
| reading.redundancy | Lempel-Ziv (LZ76) complexity of the pitch-set sequence per hand: how repetitive the item is | code: custom LZ76 count (the `lempel_ziv_complexity` package is not installed) | RUB |
| notation.page-breaks (new) | Printed page breaks in the file's layout: count, and whether a break falls inside a continuous passage (where a page turn interrupts playing). Applies to printed copies only; the app's own rendering decides on screen | code: music21 `layout.PageLayout` (checked to exist); raw `<print new-page="yes">`; agent when the file has no layout | MXL-print |
| mark.fingering | Printed finger numbers: count, share of notes fingered, fingering on the first note only, substitutions (two fingers on one note) and alternates | code: music21 `articulations.Fingering` with `fingerNumber`, `substitution`, `alternate` (checked on an instance); partitura `Fingering` | MXL-fingering |
| notation.lyrics | Words under the notes: on which staff, how many verses (lyric numbers) | code: music21 `note.Lyric` (with its number) | MXL-lyric |
| notation.chord-symbols | Printed chord symbols: count, positions, the symbol system (letter-name symbols, slash chords, Roman numerals or Nashville numbers written as text), and whether they sit over a melody or stand alone | code: music21 `harmony.ChordSymbol` from MusicXML `<harmony>` (parsed structurally; music21's text parser spells a flat "-" and rejects "Cm7/Bb": checked); partitura `ChordSymbol`; agent for symbols written as plain text | MXL-harmony; WP-Nashville_Number_System |
| harmony.figured-bass (new) | Printed figured-bass figures under a bass line: count and the figures used (5/3, 6/3, 6/4, 7 and others) | code: raw MusicXML `<figured-bass>` (music21's MusicXML reader handles the element: checked in `xmlToM21` source; its object model not probed) | MXL-figured-bass; OMT-thoroughbassFigures.html |
| mark.repeat | The repeat structure, each kind named: repeat bar lines, first and later endings, D.C., D.S., al Fine, al Coda, Segno, Coda, Fine; and the bars played once repeats are expanded | code: music21 `bar.Repeat`, `spanner.RepeatBracket`, `repeat.DaCapo`, `DalSegno`, `Segno`, `Coda`, `Fine`, `repeat.Expander`; partitura `Repeat`, `Ending`, `DaCapo`, `DalSegno`, `Segno`, `Coda`, `Fine` | MXL-repeat; MXL-ending; MXL-segno; MXL-coda |

### 1.B Pitch, range, keys and scales

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| hands.per-bar-range | Per hand: lowest and highest note and the span in semitones, per bar and over the item; the item's whole compass; the share of notes in the low, middle and high registers; notes outside the 88 keys (A0 to C8) flagged | code: music21 `analysis.discrete.Ambitus` (checked), partitura `pitch` and `staff`; music21 `RangeFeature`, `ImportanceOfBassRegisterFeature`, `ImportanceOfMiddleRegisterFeature`, `ImportanceOfHighRegisterFeature` as second witnesses | JS P-8, P-9 to P-11 |
| pitch.black-key-share (new) | The share of notes on black keys, per hand | code: custom from the pitch class (DIFF `blackKeyRatio`) | DIFF (operational; no published definition read) |
| technique.five-finger | The hand-position class of each hand per passage without a shift: **five-finger** (span at most 7 semitones), **extended** (a sixth, 8 or 9 semitones), or **beyond** (a shift needed); the named position (its lowest note: C, G, Middle C with the thumbs sharing middle C); and whether it runs tonic to dominant in the key | code: custom over partitura's note array (the app's `detect.ts` beyondPosition is its negation) | RULES-texture § technique.five-finger; ABRSM-SR (hand position column) |
| technique.position-shift | Lateral travel between hand positions: a shift wherever the next notes cannot be reached from the current position; count, size and the time allowed | code: custom over partitura's note array | RULES-texture § technique.position-shift |
| key.tonic-mode | The key as sounded, which may differ from the signature: tonic and mode (major or minor), with a confidence | both: code from music21 `Stream.analyze('key')` (Krumhansl-Schmuckler), `features.native.TonalCertainty`, and partitura `estimate_key`; agent where the two witnesses disagree or the music is modal | M21 (`analysis.discrete.KrumhanslSchmuckler`); PT (`estimate_key`) |
| key.minor-form | Which minor form is in use: natural, harmonic (raised 7th) or melodic (raised 6th and 7th ascending) | code: RULES-harmony § key.minor-form (custom over music21 scale membership) | RULES-harmony § key.minor-form |
| key.change | Each change of key, with its kind named: printed signature change; unmarked modulation (a cadence in the new key); tonicisation (a brief new tonic, no cadence). Also the relation of the new key to the old: dominant, subdominant, relative, parallel, other | both: code from signature changes (exact) and windowed key-finding (music21 `analysis.floatingKey.KeyAnalyzer`, checked to exist; partitura `estimate_key` per section); agent settles modulation against tonicisation | OMT-Modulation.html; TCL-SR (modulation by grade) |
| scale.collection | The pitch-class collection of each passage, named: diatonic major, natural, harmonic or melodic minor; the modes with their tonic (Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian); major and minor pentatonic; blues scale; whole-tone; octatonic (diminished); chromatic; none (no collection, post-tonal) | both: code from RULES-harmony § scale.collection, with music21 scale classes (`DorianScale` ... `WholeToneScale`, `OctatonicScale`: checked to exist) for membership; agent where the tonic, and so the mode, is ambiguous | OMT-scales2.html; RULES-harmony § scale.collection |

### 1.C Metre, rhythm and tempo

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| notation.times | The time signatures and every change, with positions | code: music21 `meter.TimeSignature`; partitura `ts_beats`, `ts_beat_type` | MXL-time |
| metre.class (new) | Each time signature's class: simple duple, triple or quadruple; compound duple, triple or quadruple; irregular (5, 7 or another number of beats). Named apart: 3/8, and cut time (2/2) | code: music21 `TimeSignature.beatCount`, `beatDivisionCount`, `classification` (checked to exist); partitura `ts_mus_beats`; music21 `CompoundOrSimpleMeterFeature`, `TripleMeterFeature`, `QuintupleMeterFeature`, `ChangesOfMeterFeature` as witnesses | OMT-meter.html; JS R-2 to R-8 |
| mark.anacrusis | A pickup bar: the first bar shorter than the metre, and its length in beats | code: raw MusicXML `implicit="yes"` on the first measure; music21 `Measure.paddingLeft` | MXL-measure |
| rhythm.values | The note and rest values used, each named and counted separately: whole, half, quarter, eighth, sixteenth, thirty-second and shorter, and each rest. Also: shortest and longest value; number of distinct values | code: music21 `duration.Duration.type`, `note.Rest`; native `UniqueNoteQuarterLengths`, `RangeOfNoteQuarterLengths`; partitura `duration_beat` | JS R-13, R-15, R-23, R-24; ABRSM-SR; TCL-SR (note and rest values by grade) |
| rhythm.dotted-quarter | Dotted values, each kind named and counted: dotted half; dotted quarter (with its eighth); dotted eighth (with its sixteenth); double-dotted values | code: music21 `Duration.dots` and the following note's value | JS R-22; ABRSM-SR; TCL-SR |
| rhythm.ties | Ties: count, within a bar or across a bar line, and ties that make a syncopation | code: music21 `note.tie` with measure numbers | MXL-tied |
| rhythm.syncopation | Syncopation, each kind named and counted, at the beat level and at the subdivision level separately: an onset off the beat held across the next beat; an accent off the beat; a rest on a strong beat followed by an off-beat onset. A pickup is not syncopation | code: custom over music21 `beatStrength` or partitura `metrical_strength_feature` (the app's `detect.ts` rule to be corrected for the pickup) | OMT-syncopation.html; ABRSM-SR ("simple syncopation") |
| rhythm.triplets | Triplets: count, value (eighth, quarter, sixteenth), per hand | code: music21 `duration.Tuplet` | MXL-time-modification |
| rhythm.tuplets-other | Tuplets other than triplets (duplets, quintuplets, sextuplets, septuplets) and nested tuplets | code: music21 `duration.Tuplet` | MXL-time-modification; TCL-SR ("duplets and triplets") |
| rhythm.cadenza (new) | Unmeasured figuration: a run of cue-size or grace notes, or a tuplet of an irregular ratio (for example 11 in the time of 6), spanning a beat or more; or a passage marked cadenza or ad lib. with the other hand silent or held | both: code reads `<cue>`, `<grace>`, `<time-modification>` ratios and words (music21 `TextExpression`); agent confirms that the passage is played freely | WP-Cadenza |
| rhythm.repeated-notes | Consecutive equal pitches in one voice: count and longest run, and the note value at which they repeat | code: custom over partitura's note array; music21 `RepeatedNotesFeature` as a witness | JS M-9 |
| rhythm.equal-stream | A continuous stream of equal note values in one hand (running sixteenths, Hanon cells): length in notes and in bars | code: custom over partitura's note array | operational (this list; the minimum length still to source) |
| rhythm.habanera | The habanera cell (dotted eighth, sixteenth, two eighths in 2/4) | code: the app's `detect.ts` habaneraCell | WP-Habanera_(music) |
| rhythm.tresillo | The tresillo cell (3+3+2 eighths) | code: the app's `detect.ts` tresilloCell | WP-Tresillo_(rhythm) |
| rhythm.cinquillo (new) | The cinquillo cell: in one 2/4 bar, onsets on sixteenth pulses 0, 2, 3, 5 and 6 of 8 | code: custom cell matcher (as the habanera matcher) | WP-Cinquillo |
| rhythm.secondary-rag | Berlin's secondary rag: a repeating three-note pattern over duple metre | code: RULES-rhythm § rhythm.secondary-rag | RULES-rhythm § rhythm.secondary-rag |
| rhythm.shuffle | Long-short pairs on the beat in the triplet ratio, as notated (triplets, dotted eighth-sixteenth, 12/8) | code: RULES-rhythm § rhythm.shuffle | RULES-rhythm § rhythm.shuffle |
| notation.swing-mark | A printed swing direction (MusicXML `<swing>`, or a text such as "Swing" or the triplet-equivalence sign) | code: raw MusicXML `<swing>` (music21 reads the element: `xmlToM21` source checked); music21 `TextExpression` for the text | MXL-swing |
| rhythm.backbeat (new) | Emphasis on beats 2 and 4 of a four-beat bar in the accompaniment: accents, chords or the only onsets of a hand on those beats | code: custom over onsets and accents per beat | WP-Beat_(music) (backbeat section) |
| rhythm.hemiola (new) | In triple metre, two bars of three beats grouped as three units of two (by ties, accents, note lengths or chord changes every two beats), or a 6/8 bar grouped as three quarter notes. Named apart: alternating 6/8 and 3/4 groupings (sesquialtera) | both: code, custom over onsets, ties, accents and chord changes; agent confirms the grouping | WP-Hemiola |
| texture.polyrhythm | Two different divisions of the beat at once between the hands, each kind named: 2 against 3, 3 against 2, 3 against 4, 4 against 3, other | code: custom: a tuplet in one hand against plain values in the other, from music21 `duration.Tuplet` per staff | WP-Polyrhythm |
| rhythm.beat-onset-share | The share of beats, and of downbeats, carrying an onset in some part (how audible the pulse is) | code: partitura `is_downbeat` and onsets with music21 beat positions | operational (this list) |
| mark.tempo-text | The written tempo: tempo words (classified against the common Italian terms) and metronome mark | code: music21 `tempo.MetronomeMark`, `tempo.TempoText`; partitura `Tempo` | MXL-metronome; TCL-SR (tempo terms by grade) |
| mark.tempo-change | Printed tempo changes, each kind named: rit. or rall., accel., a tempo or Tempo I, meno mosso, più mosso, a new tempo word, metric modulation | code: music21 `tempo.RitardandoSpanner`, `AccelerandoSpanner`, `TempoText`, `MetricModulation`; partitura `DecreasingTempoDirection`, `IncreasingTempoDirection`, `ResetTempoDirection` | ABRSM-SR; TCL-SR |
| technique.velocity | Notes per second per hand at the written tempo (or a stated default), over the item and at its peak in a moving window | code: custom over partitura's note array and the tempo; music21 `NoteDensityFeature` as a whole-item witness | JS RT-5 |
| technique.endurance | Sustained demand: the duration at tempo weighted by note density, and the longest passage per hand without a rest | code: custom | operational (this list) |

### 1.D Melody

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| interval.melodic (new) | Melodic intervals between successive notes of one line (per voice, per hand), each size named and counted: repeated note, 2nd (step), 3rd (skip), 4th, 5th, 6th, 7th, octave, beyond an octave; with quality (minor, major, perfect, augmented, diminished) and direction | code: music21 `Stream.melodicIntervals` and `interval.Interval` (`.generic`, `.name`), `analysis.discrete.MelodicIntervalDiversity` (checked); music21 `MelodicIntervalHistogramFeature`, `StepwiseMotionFeature`, `MelodicThirdsFeature`, `MelodicFifthsFeature`, `MelodicOctavesFeature`, `MelodicTritonesFeature`, `ChromaticMotionFeature` as witnesses | OMT-intervals.html; JS M-1, M-9 to M-19 |
| quality.contour | The contour of the melody line: direction of each move (up, down, same), the share rising, melodic arcs (notes and semitones between turning points), and overall shape (arch, rising, falling, wave) | code: music21 `DirectionOfMotionFeature`, `DurationOfMelodicArcsFeature`, `SizeOfMelodicArcsFeature` per line; custom for the shape class | JS M-22 to M-24 |
| quality.leap-recovery | A melodic leap of a 4th or more followed by stepwise motion in the opposite direction; share of leaps so recovered | code: custom | OMT-cantusFirmus.html |
| melody.tessitura | The melody line's range and its weighted central range, against a stated voice range | code: music21 `analysis.discrete.Ambitus` on the melody line | operational (this list; voice ranges to quote) |
| melody.degree-profile | The scale degree of each melody note relative to the tonic: first and last degree, the set of degrees used | code: music21 `key.Key.getScaleDegreeFromPitch` (checked) | JS P-34 to P-37 (first and last pitch; music21 does not implement them) |
| melody.chord-relation | Each melody note's relation to the chord under it, each kind named: chord tone on a strong beat; passing, neighbour, appoggiatura, suspension, escape tone, anticipation, pedal; jazz approach notes and enclosures; guide tones; blue notes | code: RULES-harmony § melody.chord-relation (custom over `harmony.roman`), extended to the classical non-chord-tone types | OMT-embellishingTones.html; RULES-harmony § melody.chord-relation |
| melody.motif-repetition | A motif (a figure of two to eight notes, identified by its intervals and rhythm) recurring exactly, transposed, or varied (its rhythm or one interval changed); count and positions | both: code from music21 `search` (`approximateNoteSearch`, `rhythmicSearch`: checked to exist) or a custom interval-string match; agent for varied recurrences | WP-Motif_(music) |
| melody.sequence (new) | A segment repeated two or more times in succession at different pitch levels (diatonic or exact). Named apart: melodic sequence; harmonic sequence (descending fifths, ascending 5-6) | both: code, custom match of interval and rhythm strings across successive segments; agent confirms | WP-Sequence_(music); OMT-schemataContinuationPatterns |
| technique.written-ornament | Trills, mordents and turns written out in measured notes (no sign): main note, neighbour, main note at ornament speed | code: custom figure matcher; music21 jSymbolic M-21 definition (short note between longer notes) as a related witness, not in music21 | JS M-21; operational (this list) for the figure |

### 1.E Harmony

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| harmony.chord-quality | Each chord's quality, each named and counted: major, minor, diminished, augmented triads; dominant 7th, major 7th, minor 7th, half-diminished 7th, diminished 7th, minor-major 7th; 6 and minor 6; sus2, sus4; add9; 9, 11, 13 and altered extensions (b9, #9, #11, b13); power chord (5). From printed symbols and from the notes, reported separately | code: music21 `ChordSymbol.chordKind` (checked on an instance), `chord.Chord.quality`, `.commonName`, `.isDominantSeventh`, `.isDiminishedSeventh`, `.isHalfDiminishedSeventh` (checked); native `MajorTriadSimultaneityPrevalence` to `DiminishedSeventhSimultaneityPrevalence` as witnesses | OMT-triads.html; MXL-harmony (kind values); JS C-3, C-29 to C-35 |
| harmony.inversion | Chord inversions (root position, first, second, third) and slash chords | code: music21 `chord.Chord.inversion()`, `ChordSymbol` bass (checked) | OMT-triads.html; MXL-harmony |
| harmony.roman | The function of each chord change as a Roman numeral in the key | both: code from RULES-harmony § harmony.roman (music21 `roman.romanNumeralFromChord`); agent where the key or chord is unresolved | RULES-harmony § harmony.roman |
| harmony.progression | Named progressions, each named separately: I-V(7)-I; I-IV-V(7)-I; I-vi-IV-V (doo-wop); I-V-vi-IV and other four-chord loops; major ii-V-I; minor ii-V-i; rhythm changes; descending fifths (circle); lament bass; plagal progressions | code: RULES-harmony § harmony.progression over `harmony.roman` | RULES-harmony § harmony.progression; OMT-popRockHarmony.html and its pages |
| harmony.applied | Chords outside the plain diatonic set, each kind named: secondary dominants and secondary leading-tone chords; tritone substitutions; passing chords (chromatic and gospel); pivot chords; modal mixture; Neapolitan; augmented sixths (Italian, French, German) | code: RULES-harmony § harmony.applied; music21 `isItalianAugmentedSixth`, `isFrenchAugmentedSixth`, `isGermanAugmentedSixth` (checked) | OMT-appliedChords.html; OMT-alteredSubdominants.html; OMT-modalMixture.html; LEV (tritone substitution) |
| harmony.cadence | The cadence at each phrase end, each type named: perfect authentic, imperfect authentic, half (imperfect), plagal, deceptive (interrupted), Phrygian half | code: RULES-harmony § harmony.cadence (partitura `Cadence` reads only annotated cadences) | OMT-cadenceTypes.html |
| harmony.chromatic-share | The share of chords that are not diatonic in the key | code: from `harmony.roman` | operational (this list) |
| harmony.rhythm | Chord changes per bar, and where they fall in the bar | code: from printed symbols or music21 `Stream.chordify` change points | OMT-harmonicSyntax1.html (harmonic rhythm) |
| harmony.chord-vocabulary | The number of distinct chords in the item | code: distinct numerals from `harmony.roman` | operational (this list) |
| harmony.voicing | How a chord's notes are arranged, each kind named: close; open; shell (root with 3rd or 7th); rootless (A and B forms); quartal (So What); upper structure; drop-2; locked hands (melody doubled an octave below, chord between); Bud Powell shells | code: RULES-harmony § harmony.voicing (under printed symbols); agent without them | RULES-harmony § harmony.voicing; LEV |
| harmony.voice-leading | In textures of three or four voices: parallel fifths and octaves, voice crossing and overlap, resolution of the leading tone and the chordal seventh, common tones kept | code: music21 `voiceLeading.VoiceLeadingQuartet` (`parallelFifth`, `parallelOctave`, `voiceCrossing`, `voiceOverlap`, `isProperResolution`: checked) | OMT-tendencyTonesFunctionalDissonances.html; OMT-motionTypes.html |
| harmony.chord-connection | Per hand per chord change: notes held in common, and the summed semitone motion of the rest (how smoothly the hand connects chords) | code: custom over partitura's note array | operational (this list) |
| harmony.bass-behaviour | What the bass does, each kind named: root-position roots; the root-motion interval; tonic-dominant bass; pedal bass; two-feel (half notes); walking (its own row); anticipated bass | code: RULES-harmony § harmony.bass-behaviour; music21 native `ChordBassMotionFeature` for root motion | RULES-harmony § harmony.bass-behaviour |
| texture.bass-walk-up | A stepwise bass leading into the next chord's root (walk-up or walk-down) | code: RULES-harmony § texture.bass-walk-up | RULES-harmony § texture.bass-walk-up |
| texture.pedal-point | A sustained or repeated bass note under at least one harmony foreign to it | code: RULES-texture § texture.pedal-point | RULES-texture § texture.pedal-point (Wikipedia, "Pedal point") |

### 1.F Texture and accompaniment patterns

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| texture.type (new) | The texture of each passage: monophonic (one line), melody with accompaniment (homophonic), chordal (all voices moving together, the hymn texture), polyphonic (independent lines) | both: code from `texture.voice-count`, `coordination.synchrony-share` and `texture.counterpoint`; agent for mixed passages | WP-Texture_(music) |
| texture.hands-together | Whether both hands sound at once: share of bars hands together, hands separately, or one hand alone | code: per-bar onsets per staff (partitura) | operational (this list) |
| texture.voice-count | The number of voices per staff, written (MusicXML `<voice>`) and sounding (notes per onset); the four-voice layout of two per staff | code: raw `<voice>`, partitura `voice`, onsets per staff | MXL-voice |
| texture.counterpoint | The number of simultaneously independent lines and how independent they are (rhythm and contour) | both: code from partitura `estimate_voices` and per-pair rhythm and contour independence (custom); agent where the voices are not written apart | WP-Counterpoint |
| texture.imitation (new) | One voice restating another's figure (the same intervals and rhythm, at any pitch) after it, while the first voice continues: imitation and canon. A fugue subject entry is one kind (`form.fugue`) | both: code, custom match of interval strings across voices (music21 `search` as a helper); agent confirms | WP-Imitation_(music) |
| texture.block-chords | Notes struck together in one hand, each chord size named and counted: 2-note, 3-note, 4-note or more; also chords shared between the hands | code: partitura onsets per staff, music21 `Stream.chordify`; jSymbolic C-6 as the published definition | ABRSM-SR ("2-note chords in either hand", "3-part chords"); JS C-6 |
| interval.harmonic (new) | Two notes struck together in one hand: the interval named (2nd to octave, tenth) with its quality; counts per hand | code: partitura onsets per staff with music21 `interval.Interval` | OMT-intervals.html; JS C-1 (not in music21) |
| texture.double-notes | Successions of the same harmonic interval in one hand (3rds, 6ths, other), moving | code: custom over simultaneous intervals per hand per onset | operational (this list) |
| texture.octaves | Octaves in a hand, each kind named: octave bass, melody in octaves, broken octaves, repeated octaves; octaves in both hands | code: custom over simultaneous and alternating octaves per hand | operational (this list) |
| texture.power-chord | Root-fifth chords (with or without the octave) | code: chord content per onset; symbols ending in 5 | WP-Power_chord |
| texture.broken-chord | A chord's notes sounded one after another in one hand through a bar or half bar | code: RULES-texture § texture.broken-chord | RULES-texture § texture.broken-chord |
| texture.alberti | The Alberti figure: lowest, highest, middle, highest | code: RULES-texture § texture.alberti | RULES-texture § texture.alberti |
| texture.arpeggio | An arpeggiated texture rising or falling over more than an octave | code: RULES-texture § texture.arpeggio | RULES-texture § texture.arpeggio |
| texture.waltz-bass | Bass on beat 1, chords on beats 2 and 3, in triple metre | code: RULES-texture § texture.waltz-bass | RULES-texture § texture.waltz-bass |
| texture.oom-pah | Bass on the strong beats, chord on the off-beats, in duple metre | code: RULES-texture § texture.oom-pah | RULES-texture § texture.oom-pah |
| texture.stride | An oom-pah left hand whose bass-to-chord travel exceeds an octave | code: RULES-texture § texture.stride | RULES-texture § texture.stride |
| texture.boogie-bass | A regular left-hand eighth-note figure transposed with the chord changes (boogie-woogie) | code: RULES-texture § texture.boogie-bass | RULES-texture § texture.boogie-bass |
| texture.walking-bass | A bass moving in steady quarter notes, mostly by step, outlining the changes | code: the app's `detect.ts` walking-bass rule (to be corrected for over-match, yaml note) | WP-Walking_bass |
| texture.left-hand-pattern | Any repeating left-hand figure under a melody, before it is named by the rows above | code: the app's every-bar rule | operational (this list) |
| texture.ostinato | A figure repeated unchanged, or transposed to follow the chord roots, for N bars. Each kind named: ostinato, riff, vamp | code: RULES-texture § texture.ostinato | RULES-texture § texture.ostinato |
| texture.repeated-chords (new) | The same chord re-struck at a steady value for a bar or more, each value named: half notes; quarter notes ("four to the bar"); eighth notes (pulsing eighths); triplet eighths | code: custom over onsets and chord identity per hand | RULES-texture § texture.four-to-the-bar for the quarter-note kind; operational (this list) for the others |
| texture.offbeat-chords (new) | Chords only on the off-beats, with the beats empty in that hand (the reggae and ska "skank", the upbeat comp); per subdivision | code: custom over onsets per beat | WP-Reggae (the off-beat chord) |
| texture.charleston | Chords on beat 1 and the and-of-2 | code: RULES-rhythm § texture.charleston | RULES-rhythm § texture.charleston |
| texture.montuno | A repeated syncopated chordal figure aligned to the clave | code: RULES-rhythm § texture.montuno | RULES-rhythm § texture.montuno |
| texture.tumbao | Left-hand onsets on the tresillo's two off-beats, the downbeat empty | code: RULES-rhythm § texture.tumbao | RULES-rhythm § texture.tumbao |
| texture.clave | A hand whose onsets over a cycle are a son, rumba or bossa clave, in either direction | code: RULES-rhythm § texture.clave | RULES-rhythm § texture.clave |
| texture.bossa | The bossa nova comp (the bossa clave as a repeated pattern), with the surdo bass counted beside it | code: RULES-rhythm § texture.bossa | RULES-rhythm § texture.bossa |
| texture.tango | The tango accompaniment figures: 3-3-2, habanera, marcato en 4 or en 2 | code: RULES-rhythm § texture.tango | RULES-rhythm § texture.tango |
| texture.mazurka | The mazurka rhythm: the beat-1 figure and an accent off beat 1 in 3/4 | code: RULES-rhythm § texture.mazurka | RULES-rhythm § texture.mazurka |
| texture.stop-time | Accented attacks on the first beat of each bar or every other bar, alternating with silence | code: RULES-texture § texture.stop-time | RULES-texture § texture.stop-time |
| texture.tremolo-thirds | The blues tremolo: two notes a third apart alternated rapidly, or a tremolo mark on a third | code: RULES-texture § texture.tremolo-thirds | RULES-texture § texture.tremolo-thirds |
| texture.crushed-note | The blues crushed note: a grace a semitone below a chord tone, struck with it | code: RULES-texture § texture.crushed-note | RULES-texture § texture.crushed-note |
| texture.half-time | A half-time feel: the backbeat on beat 3 of a four-beat bar | both: code from accents, bass and `rhythm.backbeat`; agent confirms (low confidence from a score) | operational (this list) |
| texture.call-response | Answering phrases: a phrase answered by another in a different hand or register | both: code from `form.phrase` and register or hand alternation; agent confirms | WP-Call_and_response_(music) |
| texture.melody-in-chords | The melody carried as the top voice of chords in one hand | code: RULES-texture § texture.melody-in-chords | RULES-texture § texture.melody-in-chords |
| texture.sustained | Chords held a bar or more | code: chord durations | operational (this list) |
| texture.build | Rising dynamics and note density across four bars or more | code: RULES-rhythm § texture.build | RULES-rhythm § texture.build |
| texture.register-trajectory | Register change across a section: the same idea moved an octave, a widening or dropping register | code: trend over `hands.per-bar-range` per section (custom) | operational (this list) |
| texture.part-roles | In a multi-part source, which part is the melody, the bass, a riff and the rhythmic engine | both: code from music21 `instrument.Instrument` per part, `hands.per-bar-range`, `texture.ostinato`; agent decides roles | operational (this list) |
| texture.piano-role (new) | What the piano part does in the item, one value: complete solo (melody and accompaniment); accompaniment to another part (a soloist, a singer, people singing); comping from symbols (no melody); lead line (a single melody or solo line over symbols or a backing); bass line | both: code from `item.format`, other parts and lyrics present, `texture.melody-location`; agent decides | WP-Accompaniment; LEV (comping) |
| mark.extended-technique (new) | Contemporary piano effects, each kind named: note clusters (three or more adjacent semitones or seconds struck together, or a cluster sign); silently depressed keys (hollow or diamond noteheads held for sympathetic resonance, harmonics); playing inside the piano | both: code from music21 `note.Note.notehead` (diamond, checked as an attribute), chord interval content, raw `<harmonic>`; agent reads the text instructions | WP-Tone_cluster; MXL-notehead; MXL-harmonic |
| mark.glissando (new) | Glissando marks (a line between two notes, or gliss. text): count, direction, and white or black keys where stated | code: music21 `spanner.Glissando` (checked); raw `<glissando>`, `<slide>` | MXL-glissando |

### 1.G Coordination between the hands

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| coordination.synchrony-share | The share of onsets both hands strike together, offset, or one hand alone | code: per onset pair from partitura's note array | operational (this list) |
| coordination.rhythmic-independence | Bars where the two hands' rhythm patterns differ: count, and the kind of difference (shared, offset, independent) | code: rhythm string per hand per bar | operational (this list) |
| coordination.unequal-rates | One hand moving faster than the other: ratio of note rates per bar and where it changes | code: notes per bar per hand | operational (this list) |
| coordination.articulation-conflict | Different articulations in the two hands at the same time (legato against staccato, accents in one hand) | code: `mark.articulation` and `mark.slur` per hand per onset | operational (this list) |
| coordination.dynamic-balance | Different printed dynamics in the two hands, and a melody to be brought out over its accompaniment (from `texture.melody-location`) | both: code from per-staff `mark.dynamics` and melody location; agent where balance is implied, not printed | TCL-SR ("different dynamics for RH and LH") |
| coordination.register-overlap | The hands' ranges overlapping in a bar, or the hands crossing | code: from `hands.per-bar-range` and `technique.hand-crossing` | operational (this list) |
| coordination.pedal-with-hands | Where printed pedal changes fall against the chord changes: on the chord (direct) or just after it (legato, syncopated) | code: `mark.pedal` positions against `harmony.rhythm` | WP-Sustain_pedal; operational (this list) for the placement test |
| coordination.sustain-vs-move | One hand holds a note or chord while the other moves | code: custom over durations across staves | operational (this list) |
| coordination.hand-interval | The vertical interval between the hands where both move together (unison, third, sixth, octave, tenth), and where it changes | code: partitura onsets shared across staves | operational (this list) |
| texture.motion | Motion between the hands' outer lines: contrary, similar, parallel, oblique | code: music21 `VoiceLeadingQuartet.motionType` (checked) over the outer lines | OMT-motionTypes.html |
| texture.alternating-hands | Hands playing in turn with no shared onsets | code: onsets per staff | operational (this list) |
| technique.hand-crossing | One hand crossing over or under the other: count and distance | code: custom (the yaml's code exists and is not stored) | operational (this list) |

### 1.H Technique and physical demand

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| technique.scale-run | Scale passages, each kind named: diatonic; chromatic; in 3rds or 6ths between the hands; in double notes in one hand; in contrary motion between the hands; with the run's extent in octaves | code: RULES-texture § technique.scale-run | RULES-texture § technique.scale-run |
| technique.arpeggio-run | Arpeggio passages spanning two octaves or more | code: RULES-texture § technique.arpeggio-run | RULES-texture § technique.arpeggio-run |
| technique.arpeggio-chord | The chord an arpeggio run outlines (major, minor, dominant 7th, diminished 7th), its inversion, and whether a dominant 7th resolves to the tonic | code: music21 `chord.Chord.commonName`, `.inversion()` over each run's notes | RULES-texture § technique.arpeggio-run |
| technique.thumb-under | Runs that need the thumb to pass under (or fingers over) | both: code from a fingering estimate or the run length; agent where the printed fingering is absent | operational (this list; no fingering solver installed) |
| technique.finger-independence | One hand holding a note or chord while other fingers of the same hand move (two voices in one hand) | code: RULES-texture § technique.finger-independence (overlapping durations within a staff) | RULES-texture § technique.finger-independence |
| technique.span | The largest simultaneous reach per hand in semitones, and reaches beyond a stated hand span (unplayable as written without spreading) | code: custom (the yaml's code exists and is not stored) | operational (this list; the per-level limit is a rule, Phase 2) |
| technique.leap-size | The largest and typical leaps per hand in semitones, and the time allowed for each | code: custom (the yaml's code exists and is not stored) | operational (this list) |
| technique.displacement-rate | The share of hand-position changes larger than an octave made within two beats | code: custom over partitura's note array | SEB Table 1 |
| technique.fingering-demand | Fingering difficulty: substitutions, stretches and awkward sequences | both: code from printed fingering and span; agent where no fingering is printed | operational (this list; no fingering solver installed) |
| technique.pedal-implied | Pedal needed where none is printed: harmony changing under a held or broken-chord texture; a held bass the hand cannot keep under a moving chord; a broken chord wider than the span marked to sound together | both: code from durations, span and harmony changes; agent confirms | operational (this list; a pedalling rule still to quote) |

### 1.I Expression marks

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| mark.dynamics | Printed dynamic levels, each named and counted: ppp to fff, mp, mf, sf or sfz, fp, rf. Also: per staff; the item's dynamic range (softest to loudest mark); changes per bar | code: music21 `dynamics.Dynamic`; partitura `ConstantLoudnessDirection`, `ImpulsiveLoudnessDirection`, `loudness_direction_feature` | MXL-dynamics; ABRSM-SR; TCL-SR |
| mark.hairpin | Gradual dynamic changes, by form: hairpin (wedge) or word (cresc., dim., decresc.); length in bars | code: music21 `dynamics.Crescendo`, `Diminuendo`, `TextExpression`; partitura `IncreasingLoudnessDirection`, `DecreasingLoudnessDirection` | MXL-wedge; ABRSM-SR; TCL-SR (cresc. and dim. as text) |
| mark.articulation | Printed articulations, each named and counted: staccato, staccatissimo, accent, strong accent (marcato), tenuto, portato (detached legato), stress, breath mark, caesura; jazz falls, doits, scoops and plops | code: music21 `articulations` classes (checked); partitura `articulation_feature` (its names checked in source) | MXL-articulations |
| mark.slur | Slurs, by length: short (two or three notes, lifted at the end) or long (a phrase mark); count per hand | code: music21 `spanner.Slur`; partitura `Slur`, `slur_feature` | MXL-slur |
| mark.pedal | Printed pedal marks: count and positions (start, change, stop) | code: music21 `expressions.PedalMark`; partitura `SustainPedalDirection` | MXL-pedal |
| mark.pedal-kind | Which pedal, each named: sustain (damper); half pedal; sostenuto; una corda and tre corde (usually text); con pedale or senza pedale text | code: music21 `PedalMark.pedalType` (values Sustain, Sostenuto, Soft, Silent: checked); music21 `TextExpression` and partitura `Words` for text forms | MXL-pedal |
| mark.ornament | Ornament signs, each named and counted: trill (with its wavy-line length); mordent; inverted mordent; turn and inverted turn; schleifer; grace notes, split into acciaccatura (slashed) and appoggiatura | code: music21 `expressions.Trill`, `TrillExtension`, `Mordent`, `InvertedMordent`, `Turn`, `InvertedTurn`, `Schleifer` (checked); grace durations; partitura `ornament_feature`, `grace_feature` | MXL-ornaments; MXL-grace; ABRSM-SR ("simple ornaments") |
| mark.arpeggiate | Spread-chord marks (and the non-arpeggiate bracket): count and positions | code: music21 `expressions.ArpeggioMark`, `ArpeggioMarkSpanner` | MXL-arpeggiate; ABRSM-SR ("spread chords") |
| mark.tremolo | Tremolos: signs (strokes on one note, or a two-note tremolo between notes or chords) and written-out measured alternations; the interval alternated | code: music21 `expressions.Tremolo`, `TremoloSpanner`; custom for measured ones | MXL-tremolo |
| mark.fermata | Pause signs on notes, rests or bar lines | code: music21 `expressions.Fermata`; partitura `Fermata`, `fermata_feature` | MXL-fermata; ABRSM-SR ("pause signs") |
| mark.expression-text | Printed words other than tempo: expression terms (dolce, cantabile, rubato), text dynamics, ending cues | both: code from music21 `TextExpression`, partitura `Words`; agent classifies terms outside a listed vocabulary | MXL-words |
| expression.character | The character asked for: fast and agile, or lyrical and expressive (ABRSM's List A and List B characters), from tempo, articulation, slurs and velocity | both: code combines the rows named; agent decides | operational (this list; meta.published-grade could calibrate it) |

### 1.J Form

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| form.length | Bars, and duration at tempo once repeats are expanded | code: music21 measure count and `repeat.Expander` | operational (this list) |
| form.sections | Sections from repeats, double bars, key changes and rehearsal marks | code: music21 `bar.Barline`, `expressions.RehearsalMark`, `mark.repeat` | MXL-barline; MXL-rehearsal |
| form.phrase | Phrase boundaries with their lengths. At each boundary: a rest or long note, a cadence (`harmony.cadence`), and whether the phrase ends on a stable degree | both: code from rests, long notes, cadences and music21 `analysis.segmentByRests.Segmenter` (checked to exist); agent where the evidence is short | OMT-harmonicSyntax1.html |
| form.period | A phrase pair forming a question and an answer (antecedent on a weaker cadence, consequent on a stronger one). Named apart: parallel period (shared opening) and contrasting period | both: code from `form.phrase`, `harmony.cadence`, `melody.motif-repetition`; agent | OMT-period.html |
| form.twelve-bar | The twelve-bar blues and its variants | code: RULES-harmony § form.twelve-bar | RULES-harmony § form.twelve-bar |
| form.turnaround | A progression at a section end that leads back to its start | code: RULES-harmony § form.turnaround | RULES-harmony § form.turnaround |
| form.intro-ending | Bars before the form proper (intro) and after it (tag, coda, outro): length and position | both: code from `form.sections`, `mark.repeat`, text; agent | operational (this list) |
| form.multi-strain | Rag and march form: strains and trio | code: RULES-harmony § form.multi-strain | RULES-harmony § form.multi-strain |
| form.thirty-two-bar | The AABA chorus of the popular song | code: RULES-harmony § form.thirty-two-bar | RULES-harmony § form.thirty-two-bar |
| form.binary-ternary | Small forms, each named: simple binary, rounded binary, ternary, compound ternary (minuet and trio) | code: RULES-harmony § form.binary-ternary; agent for compound ternary | OMT-smallBinary.html; OMT-smallTernary.html; OMT-minuet.html |
| form.variations | Theme and variations: sections restating one theme | both: code from `form.sections` and `melody.motif-repetition`; agent | WP-Variation_(music) |
| form.sonata | Sonata or sonatina form: exposition (two key areas), development, recapitulation | agent, from the coded `form.sections`, `key.change` and `form.length` | OMT-SonataTheory-intro.html |
| form.rondo (new) | Rondo form: a refrain returning between contrasting episodes (ABACA and its kinds) | both: code from section similarity; agent | OMT-rondo.html; RCM (Keyboard Harmony forms) |
| form.fugue (new) | A fugal exposition: a subject stated alone, then answered in each further voice in turn | both: code from `texture.imitation` and `texture.voice-count`; agent | WP-Fugue |
| form.song-sections (new) | Song sections labelled by function: intro, verse, pre-chorus, chorus, bridge, solo section, head, tag or outro | both: code from rehearsal marks, text labels, lyric verses and repeats; agent | OMT-popRockForm.html |

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
| meta.arrangement (new) | Whether the item is the original work or an arrangement, each kind named: simplified arrangement, solo-piano reduction of an orchestral or vocal work, cover, lead-sheet realisation. Also whether the arrangement keeps the original's main line | both: code from metadata and `item.format`; agent judges fidelity (it cannot be proved from the file alone) | operational (this list) |
| generated.spec-declared | A generated item's declared parameters (key, pattern, progression, hands, metre), each with its musical meaning per family (key as tonic, starting note or chord root) | code: read from the generator's spec | each family's contract (still to be stated per family) |

### 1.L Derived: difficulty and material quality

These combine the rows above; how they combine is Phase 2's rule work. Each is a characteristic of the item ("at about this level"), not a new observation.

| id | what it is | detected by | source |
| --- | --- | --- | --- |
| difficulty.reading | Reading load: from `reading.visual-density`, `reading.accidental-churn`, `pitch.ledger`, `notation.keys` | code: calibrated model | operational (calibration set to source) |
| difficulty.rhythm | Rhythmic load: from `rhythm.values`, `rhythm.syncopation`, `rhythm.triplets`, tuplets | code: calibrated model | operational (calibration set to source) |
| difficulty.pitch-navigation | Range, leaps, shifts and black keys: from `hands.per-bar-range`, `technique.leap-size`, `technique.position-shift`, `pitch.black-key-share` | code: calibrated model | operational (calibration set to source) |
| difficulty.coordination | Hands-together load, including easy parts that are hard together: from the coordination rows and `texture.polyrhythm` | code: calibrated model | operational (calibration set to source) |
| difficulty.technique | Spans, chords, crossings, ornaments, repeated notes: from the technique rows | code: calibrated model | operational (calibration set to source) |
| difficulty.harmonic-load | Chord changes per bar and chromatic share | code: calibrated model | operational (calibration set to source) |
| difficulty.expressive | Control demanded by printed marks: counts and change rate of the `mark.*` rows | code: calibrated model | operational (calibration set to source) |
| difficulty.perceptual | Visual density, unusual engraving, rhythmic ambiguity | code: rule over `reading.visual-density` and `reading.unusual-notation` | operational (rule to source) |
| difficulty.level | One overall level, tied to a published grade scale where a graded reference set calibrates it | code: calibrated model | a graded reference set (CIPI, PSyllabus: not downloaded, yaml note) |
| difficulty.local-profile | Difficulty in a moving window per hand and for both hands, and where its peak (the hardest passage) is | code: calibrated model | operational (calibration set to source) |
| quality.coherence | The item hangs together as music | agent | none (judgement) |
| quality.idiomatic | The item is idiomatic for the piano and for its style | agent | none (judgement) |

## 2. The 237 existing rows

One line each, in `characteristics.yaml` order. **Kept**: the row stands as defined (with its library names checked). **Corrected**: the definition changed, as stated. **Merged**: folded into the named row. **Retired**: not a characteristic of the music; the reason given. A retired file or pipeline check stays a build check; it only leaves this list.

- prereq.untaught-demands: retired. A curriculum relation computed after assignment from the item's characteristics and the rung's taught set, not a property of the item.
- prereq.taught-set-generated: retired. The same relation, for generated families.
- prereq.hand-assignment: corrected. Now hand assignment per note, adding printed hand words and cross-staff notes (the `prereq.` prefix is historical).
- clef.treble: merged into notation.clefs (new).
- clef.bass: merged into notation.clefs (new).
- pitch.ledger: corrected. Counts how many ledger lines (above and below), and middle C apart.
- notation.keys: kept (absorbs key.signature).
- notation.times: kept.
- notation.staves: kept (partitura's staff field comes from `Part.note_array(include_staff=True)`, not `compute_note_array`).
- notation.clef-change: kept.
- notation.bars: merged into form.length (the same count).
- notation.chord-symbols: corrected. Adds the symbol system (letter, slash, Roman or Nashville text), and over a melody or alone.
- notation.lyrics: corrected. Adds the number of verses.
- notation.swing-mark: kept.
- mark.dynamics: corrected. Each level named; per staff; dynamic range; changes per bar.
- mark.hairpin: corrected. Adds the word forms (cresc., dim.) beside the wedge.
- mark.articulation: corrected. Each kind named (adds staccatissimo, marcato, portato, stress, breath, caesura, jazz articulations).
- mark.slur: corrected. Short slur against phrase mark by length.
- mark.pedal: kept.
- mark.pedal-kind: kept.
- mark.ornament: corrected. Each kind named, grace notes split into acciaccatura and appoggiatura, trill length.
- mark.arpeggiate: kept.
- mark.tremolo: corrected. Adds written-out measured tremolos and the interval alternated.
- mark.ottava: kept.
- mark.fermata: kept.
- mark.repeat: corrected. Each kind named, and bars once expanded. Well-formedness stays a build check (integrity.repeat-structure).
- mark.fingering: corrected. Adds share fingered, first-note-only, substitutions and alternates (music21 attributes checked).
- mark.anacrusis: kept.
- mark.tempo-text: kept.
- mark.tempo-change: corrected. Each kind named; metric modulation added.
- mark.expression-text: kept.
- expression.character: kept.
- rhythm.values: corrected. Each value and rest named and counted separately (absorbs eighths, sixteenths, shorter-than-quarter).
- rhythm.eighths: merged into rhythm.values.
- rhythm.shorter-than-quarter: merged into rhythm.values.
- rhythm.sixteenths: merged into rhythm.values.
- rhythm.dotted-quarter: corrected. Every dotted kind named (half, quarter, eighth, double-dotted); the id is kept for continuity.
- rhythm.ties: kept (absorbs ties-across-bar).
- rhythm.ties-across-bar: merged into rhythm.ties.
- rhythm.syncopation: corrected. Kinds named, beat and subdivision levels apart, a pickup excluded (the proving run's 82 pickup cases).
- rhythm.triplets: kept.
- rhythm.tuplets-other: kept.
- metre.compound: merged into metre.class (new).
- metre.three-four: merged into metre.class (new).
- metre.odd: merged into metre.class (new).
- rhythm.repeated-notes: kept.
- rhythm.equal-stream: kept.
- rhythm.habanera: kept.
- rhythm.tresillo: kept.
- rhythm.secondary-rag: kept.
- rhythm.shuffle: kept.
- rhythm.beat-onset-share: kept.
- interval.step: merged into interval.melodic (new).
- interval.skip: merged into interval.melodic (new).
- interval.leap: merged into interval.melodic (new).
- key.signature: merged into notation.keys.
- key.signature-exercised: kept.
- key.transposition-cost: retired. A computation (transpose the item, then read this list's rows on the result), not a property of the item; the method stays available to Phase 2.
- pitch.chromatic: corrected. Splits the raised notes of minor from other chromatic notes.
- range.beyond-position: merged into technique.five-finger (its negation, one fact).
- hands.per-bar-range: corrected. Adds the whole compass and register shares, and absorbs integrity.piano-range.
- reading.visual-density: corrected. Adds accidentals and ledger-line notes per bar.
- reading.accidental-churn: kept.
- reading.accidental-kinds: kept.
- reading.unusual-notation: corrected. Excludes constructs with their own row (clef change, extended technique, cadenza).
- reading.pitch-entropy: kept.
- reading.redundancy: kept.
- key.tonic-mode: kept (music21 TonalCertainty added as the confidence witness).
- key.minor-form: kept.
- key.change: corrected. Names printed change, modulation and tonicisation apart, and the relation.
- key.set-membership: retired. A test of key.tonic-mode against a list (guitar keys, singable keys); the list belongs to the rule.
- scale.collection: corrected. Absorbs harmony.modal (modes named with their tonic); octatonic and "none" added.
- harmony.chord-quality: corrected. Each quality named; symbols and notes reported apart.
- harmony.rhythm: kept.
- harmony.chord-vocabulary: kept.
- harmony.inversion: kept.
- harmony.roman: kept.
- harmony.progression: corrected. Each progression named (adds descending fifths, lament, doo-wop, plagal).
- harmony.applied: corrected. Adds modal mixture, Neapolitan, augmented sixths, gospel passing chords.
- harmony.cadence: corrected. Each type named; Phrygian half added.
- harmony.chromatic-share: kept.
- harmony.voicing: corrected. Adds drop-2, locked hands, Bud Powell shells as named kinds.
- harmony.voice-leading: corrected. Names the checks (parallels, crossing, overlap, resolutions) with the music21 methods checked.
- harmony.chord-connection: kept.
- harmony.modal: merged into scale.collection.
- harmony.bass-behaviour: corrected. Kinds named (adds tonic-dominant bass and two-feel).
- melody.chord-relation: corrected. Adds the classical non-chord-tone types.
- melody.degree-profile: kept.
- melody.tessitura: kept.
- melody.motif-repetition: corrected. A definition of motif and of exact, transposed and varied recurrence.
- texture.hands-together: kept.
- texture.left-hand-pattern: kept.
- texture.walking-bass: kept.
- texture.block-chords: corrected. Each chord size per hand named and counted (the syllabi grade 2-note and 3-note chords in a hand).
- texture.broken-chord: kept.
- texture.alberti: kept.
- texture.arpeggio: kept.
- texture.waltz-bass: kept.
- texture.oom-pah: kept.
- texture.stride: kept.
- texture.boogie-bass: kept.
- texture.ostinato: corrected. Kinds named (ostinato, riff, vamp); a riff transposed to the chord roots counts.
- texture.pedal-point: kept.
- texture.held-under-moving: merged into technique.finger-independence (the same overlap within one hand; the cross-hand case is coordination.sustain-vs-move).
- texture.sustained: kept.
- texture.four-to-the-bar: merged into texture.repeated-chords (new), as its quarter-note kind.
- texture.charleston: kept.
- texture.montuno: kept.
- texture.tumbao: kept.
- texture.clave: kept.
- texture.bossa: kept.
- texture.tango: kept.
- texture.mazurka: kept.
- texture.stop-time: kept.
- texture.octaves: corrected. Each kind named.
- texture.double-notes: kept.
- texture.power-chord: kept.
- texture.two-voice: merged into texture.counterpoint.
- texture.voice-count: kept.
- texture.counterpoint: corrected. Absorbs two-voice: the number of independent lines and their independence.
- texture.part-roles: kept.
- texture.motion: kept.
- texture.alternating-hands: kept.
- texture.polyrhythm: corrected. Each kind named (adds 3 against 4 and 4 against 3).
- texture.tremolo-thirds: kept.
- texture.crushed-note: kept.
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
- coordination.register-overlap: kept.
- coordination.pedal-with-hands: corrected. Defined as where pedal changes fall against chord changes.
- coordination.sustain-vs-move: kept.
- coordination.hand-interval: kept.
- coordination.interaction: merged into difficulty.coordination (a calibrated model, not an observation).
- technique.scale-run: corrected. Each kind named.
- technique.arpeggio-run: kept.
- technique.arpeggio-chord: kept.
- technique.five-finger: corrected. Absorbs range.beyond-position; adds the extended (sixth) class and the named position.
- technique.position-shift: kept.
- technique.thumb-under: kept.
- technique.velocity: kept (absorbs difficulty.tempo).
- technique.endurance: kept (absorbs difficulty.endurance).
- technique.finger-independence: corrected. Absorbs texture.held-under-moving; two voices in one hand.
- technique.span: corrected. Absorbs integrity.hand-span and technique.playability (reaches beyond a stated span flagged).
- technique.leap-size: kept.
- technique.displacement-rate: kept.
- technique.hand-crossing: kept.
- technique.fingering-demand: kept.
- technique.playability: merged into technique.span (span and range are the measurable parts; the playability limit is a rule).
- technique.pedal-implied: kept.
- technique.written-ornament: kept.
- form.length: kept (absorbs notation.bars).
- form.sections: kept.
- form.phrase: corrected. Absorbs item.continuity, quality.phrase-shape, quality.rests and quality.cadence-close (what lies at each phrase boundary).
- form.period: corrected. Parallel and contrasting named apart.
- form.twelve-bar: kept.
- form.turnaround: kept.
- form.intro-ending: kept.
- form.multi-strain: kept.
- form.thirty-two-bar: kept.
- form.binary-ternary: corrected. Each form named (rounded binary, compound ternary added).
- form.variations: kept.
- form.sonata: corrected. Sonatina form named with sonata form; an agent row over coded sections.
- difficulty.features: retired. A container of 19 raw features, each now a row: bars (form.length), notesPerBar (reading.visual-density), notesPerSecond (technique.velocity), maxSimultaneousRight/Left (texture.block-chords), maxSpanRight/Left (technique.span), maxLeapRight/Left (technique.leap-size), rangeRight/Left (hands.per-bar-range), blackKeyRatio (pitch.black-key-share), keyAccidentals (notation.keys), shortestValue and distinctRhythms (rhythm.values), voicesPerStaff (texture.voice-count), handCrossings (technique.hand-crossing), ornaments (mark.ornament), ledgerRatio (pitch.ledger).
- difficulty.reading: kept.
- difficulty.rhythm: kept.
- difficulty.pitch-navigation: kept.
- difficulty.coordination: kept (absorbs coordination.interaction).
- difficulty.technique: kept.
- difficulty.harmonic-load: kept.
- difficulty.tempo: merged into technique.velocity (the same speed demand).
- difficulty.endurance: merged into technique.endurance (the yaml defined both the same way).
- difficulty.expressive: kept.
- difficulty.perceptual: kept.
- difficulty.level: kept (absorbs difficulty.grade-calibration).
- difficulty.local-profile: kept.
- difficulty.grade-calibration: merged into difficulty.level (the calibration of the same level).
- target.prevalence: retired as a row. The count every row reports (the output convention).
- target.distribution: retired as a row. The positions every row reports.
- target.concentration: retired as a row. Computed from the positions; its threshold is a rule.
- target.salience: retired as a row. The staff, beat strength and chord membership of each reported occurrence.
- target.isolation: retired as a row. Co-occurrence per bar, computed from every row's positions.
- target.interaction: retired as a row. Co-occurrence at the same onset, as target.isolation.
- item.continuity: merged into form.phrase (recovery points are the phrase boundaries, rests and repeats).
- item.progression: retired as a row. The demand density per part of the item, computed from positions.
- target.representativeness: retired. A judgement made when assigning an item to an ability (the next step).
- transfer.distance: retired. A relation between an item and a target, made at assignment.
- role.suitability: retired. A placement decision (introduction, fluency, transfer), not a property of the music.
- generated.spec-declared: corrected. Absorbs generated.spec-interpreted and meta.generator-params: each parameter with its musical meaning.
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
- integrity.transposing-part: retired. A file-pipeline fact; transposing-instrument writing is out of scope (FABLE section 2, 1a).
- integrity.lead-sheet-shape: merged into item.format (new) (lead sheet).
- integrity.piano-range: merged into hands.per-bar-range.
- integrity.hand-span: merged into technique.span.
- integrity.notation-sanity: retired. Engraving checks (spelling, beaming) on the file.
- integrity.metadata-trust: retired. A provenance attribute every meta.* value carries, not a row.
- integrity.arrangement-fidelity: merged into meta.arrangement (new).
- style.evidence: corrected. One entry per named style, so that a signal for one style never certifies another.
- style.genre-label: kept.
- style.good-example: retired. A judgement of teaching fitness made at assignment.
- quality.phrase-shape: merged into form.phrase.
- quality.contour: corrected. A melodic-contour definition with the jSymbolic arc features.
- quality.rests: merged into form.phrase.
- quality.leap-recovery: corrected. A definition with its size (a 4th or more) and the recovery.
- quality.cadence-close: merged into form.phrase (the stable degree at the boundary; the cadence type is harmony.cadence).
- quality.reference-distribution: retired. A validation method for generated items, not a characteristic.
- quality.coherence: kept.
- quality.idiomatic: kept.
- quality.pedagogical-fit: retired. A placement judgement (the next step).
- meta.composer-era: kept.
- meta.genre-tags: kept.
- meta.title: kept.
- meta.collection: kept.
- meta.generator-params: merged into generated.spec-declared (the yaml called them the same raw parameters).
- meta.published-grade: kept.
- meta.familiarity: kept.

## 3. Counts (by script over this file)

Counted on 2026-10-08 by a script (kept in the worktree's `build/count.py`, not committed). It reads the id rows of section 1's tables and the disposition lines of section 2, and checks them against the ids in `characteristics.yaml`.

| count | value |
| --- | --- |
| characteristics in section 1 | 194 |
| new (not in the yaml) | 25 |
| from the yaml, kept | 119 |
| from the yaml, corrected | 50 |
| yaml rows merged into another row | 36 |
| yaml rows retired | 32 |
| yaml rows with a line in section 2 (kept + corrected + merged + retired) | 237 of 237, each exactly once, in the yaml's order |
| check: kept + corrected = the yaml ids in section 1 | 119 + 50 = 169 |
| check: every merge target is a row of section 1; no merged or retired id is still in section 1; no id is duplicated | 0 problems found |

## 4. Cross-check against the abilities, and what was left out

**The scan.** Abilities.md section 1 (232 rows) was read once, after sections 1.A to 1.L were drafted from the yaml, the libraries, the catalogues and the syllabi. The scan asked of each row whether an item that trains or demands it shows a property the list lacks. It added these rows:
- notation.page-breaks (page turns, AB-229)
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

Several abilities show no property in the score: posture, tension, practice method, recording oneself, counting in, keeping one's place with others, choosing a key for a singer, aural answers. The scan added nothing for them. That is a reading, recorded for the assignment step, which owns it.

**Library features left out** (statistical, with no teaching meaning on their own, or performance-only):
- jSymbolic's histogram statistics: pitch and pitch-class histograms, variability, skewness and kurtosis; the most-common and prevalence features; beat-histogram and rhythmic-pulse features; rhythmic value run lengths and offsets; rest-duration statistics.
- jSymbolic's MIDI-only features: pitch-bend glissando, vibrato and microtones; velocity dynamics; staccato by MIDI duration; non-piano instrument fractions.
- music21 native: MostCommonNoteQuarterLength (QL2), its prevalence (QL3), the set-class simultaneity counts (CS1 to CS4), IncorrectlySpelledTriadPrevalence (CS11, a file check), LandiniCadence (MC1), LanguageFeature (TX1).
- partitura: `estimate_tonaltension`; `estimate_time` (a score states its metre); the performance codec and performance features.

## 5. Not done in this draft

- **The URLs for RUB and SEB were not checked.** They are carried from the yaml, which has none.
- **The WP- sources are stand-ins.** Each should be replaced, in the checks, by the published definition the article cites.
- **The text of the ABRSM 2027 & 2028 specification was not read.** The sight-reading vocabulary rests on the 2025 & 2026 edition's table.
- **No row was run on a real score in this pass.** The library names were checked by import and by reading source, not by measuring items (the yaml's proving run, 2026-10-07, is the only measurement).
- **The jSymbolic codes T-19 (parallel motion) and T-21 (contrary motion) were seen only in search results.** The manual page fetched here was cut at T-12, so those two features are not cited as sources.
