# Characteristics check, pass 1: what is missing (2026-10-08)

**Checker:** an independent agent that did not write `docs/classifier/characteristics-list.md`. **Base:** the worktree cut from origin at f650806e (as briefed; not re-checked). **The question** (FABLE.md section 2, item 1b): which characteristics of music, needed to attach to the abilities so that what is taught is taught right, does the list (194 rows) lack?

**Read, once each, and nothing else:**
1. `docs/prompts/FABLE.md` (whole), `docs/prompts/operating-procedure.md` (whole); `characteristics-list.md` (whole: sections 1 to 5, every row's full cells).
2. `abilities.md` section 1: every one of the 232 rows' id, title and parameters cell (extracted by `build/charpass1/ab.py`, not committed; full cells of AB-001 to AB-008 read as they print); section 8.4 (whole).
3. The libraries, by import in `.venv` (music21 10.5.0, partitura 1.9.0; `build/charpass1/libs.py` and `api.py`, output in `libs.txt`, `api.txt`, not committed): music21's 92 extractors; the classes of `expressions`, `articulations`, `spanner`, `dynamics`, `tempo`, `repeat`, `harmony`, `bar`, `layout`, `note`, `instrument`; `analysis` submodules; `search`; `serial`; `chord.Chord`'s `is*` methods; partitura's `musicanalysis` functions, 19 note-feature functions and `partitura.score` classes. The jSymbolic 2.2 feature list: the manual page (URL as the list's key JS) downloaded with curl on 2026-10-08 and its feature names extracted by script: all codes P-1 to P-41, M-1 to M-25, C-1 to C-35, R-1 to R-66, RT-1 to RT-29, I-1 to I-20, T-1 to T-24, D-1 to D-4, S-1, S-2. (The list's section 5 says its fetch stopped at T-12; this download did not.)
4. The four drafts' syllabus coverage tables: `draft-abrsm-trinity.md` section 2, `draft-rcm.md` section 2, `draft-styles.md` section 2, `draft-early-levels.md` section 2 (the method sequence). Not the drafts' ability rows beyond these tables.

**Labels.** "Checked by import" means the name was imported or its attribute read in `.venv` on 2026-10-08 (the results are in `build/charpass1/api.txt`). Every musical definition below is a reading of the sources named; none was run on a real score. Where a definition still needs its published text, the row says so. "WP-" sources are Wikipedia stand-ins, as in the list.

**Scope kept.** The rows' own scope is the list's: a characteristic is a property of the item (its score or metadata). Assigning characteristics to abilities is the next step; below, an ability id only names which ability showed the miss.

## 1. Proposed characteristics

### 1.1 New rows

| proposed id | what it is (defined so two readers measure the same thing) | detected by | source of its definition | why the list lacks it (nearest row, read in full) |
| --- | --- | --- | --- | --- |
| pitch.inventory | The written pitches the item uses, per staff: each distinct pitch with its octave (scientific pitch notation, middle C = C4), its count, and whether it sits on a line or in a space of its staff. Reported as the set of pitches, not only its bounds | code: music21 `pitch.Pitch.nameWithOctave` per note per staff; partitura note array `pitch` with `staff` | JS P-4 (Number of Pitches) and P-5 (Number of Pitch Classes) count this set; MXL-pitch | hands.per-bar-range reports the lowest, highest, span and register shares, not which pitches occur inside the range; pitch.ledger counts ledger notes only; technique.five-finger names the position, not the notes read. Two Middle-C-position items can ask for different notes. Exposed by AB-005 (find and name keys, middle C and other Cs) and AB-023 (the reading range grows note by note: bass C to treble G, then the whole grand staff) |
| reading.enharmonic-spelling | Notes whose written name is not the usual name of that key: white-key accidentals (E#, B#, Cb, Fb), and one piano key written under two names in one item or passage (F# and Gb); count and positions | code: music21 `pitch.Pitch.ps` grouped against `.name` (checked: C-flat4 and B3 both give ps 59) | WP-Enharmonic (stand-in); abilities AB-006 (a black key under either name; Alfred 1B, ABRSM Theory G4 enharmonics per the AT draft) | reading.accidental-kinds counts accidentals by sign (sharp, flat, natural, double sharp, double flat); an E# is a plain sharp there, and the same key under two names is not reported. pitch.chromatic tests membership in the key, not the spelling |
| notation.reading-aids | Printed beginner aids, each kind named: letter names inside or beside noteheads; counting printed under or over notes (beat numbers, "1 & 2 &"); a finger number on every note (from mark.fingering's share); shape or coloured noteheads | both: code from raw MusicXML `<notehead-text>` and `<notehead>` values, music21 `note.Lyric` text matched against counting syllables and letter names; agent where the aid is in an image or a non-standard encoding | MXL-notehead-text; MXL-lyric; method-book practice as abilities AB-022, AB-038 cite it (Alfred 1A p.24 for counting) | notation.lyrics reports words under notes and verse numbers; printed counts and note names would be read as lyrics and not told apart from sung words. item.format's pre-staff value is for items without a staff. Exposed by AB-038 (count aloud), AB-022, AB-023 |
| metre.grouping | The grouping of beats inside the bar for each irregular or compound metre: from a composite numerator (2+3/8) or from the beaming (7/8 as 2+2+3, 3+2+2 or 2+3+2; 8/8 as 3+3+2), per bar, and any change of grouping under one signature | code: music21 `meter.TimeSignature.beatSequence` (checked: 2+2+3/8 gives three beats), `beamSequence`; raw MusicXML `<beats>` with "+"; beam groups from music21 `note.beams` or partitura `Beam` | MXL-time (composite beats); OMT-meter.html (to quote) | metre.class names "irregular (5, 7 or another number of beats)" as one class and does not say how the beats group; 7/8 as 2+2+3 and as 3+2+2 are counted differently. Exposed by AB-029 (5/8, 7/8, any time signature) and AB-192 (6/8 and 3/4 groupings) |
| rhythm.silence | Spans where the piano part sounds nothing (both hands resting, no note held): count, length in beats and bars, multi-bar rests, general pauses, and whether other parts sound meanwhile (counting rests while others play); the re-entry after each | code: partitura note array over onsets and offsets of all staves; music21 `spanner.MultiMeasureRest` (checked to exist); other parts from music21 `Score.parts` | JS R-41 Complete Rests Fraction, R-44 Longest Complete Rest, R-46 Mean Complete Rest Duration; MXL-multiple-rest | texture.hands-together reports bars with both hands, separate hands or one hand alone, not bars with neither; rhythm.values counts rest values per hand, not simultaneous silence; the list's section 4 left out jSymbolic's rest-duration statistics as statistical. Exposed by AB-031 (rests for their full length), AB-195, AB-198, AB-199 (entering after others play), AB-217 (keeping one's place) |
| rhythm.bar-patterns | The distinct rhythm patterns of one bar (and of one beat) per hand, each with its count and positions, and the share of bars using the most common pattern | code: music21 `search.mostCommonMeasureRhythms` (checked to exist); custom rhythm string per bar per staff (the string coordination.rhythmic-independence already builds) | M21 (`search.mostCommonMeasureRhythms`); RCM ear clapback and sight-reading rhythm tests (draft-rcm section 2, every level) | rhythm.values counts values, not their order in the bar; melody.motif-repetition needs intervals and rhythm together; reading.redundancy is over pitch sets. A dotted-quarter-eighth pattern and an eighth-dotted-quarter pattern have the same values. Exposed by AB-122 (echo a rhythm), AB-123 (tap a written rhythm) |
| harmony.implied | The harmony a line implies where no chords are written: per harmonic unit (bar or half bar), the best-fitting chord in the key (I, IV, V, V7 first), with its fit (share of beat-weighted notes that are chord tones) and any equal alternative | both: code, custom chord-tone fit of the notes against music21 `roman.RomanNumeral(...).pitches`, weighted by `beatStrength`; agent where two chords fit equally | RCM Level 6 lead-sheet reading: chords "for the implied harmony of a melody" (draft-rcm, [thy] p.21) | harmony.roman labels chords that are present (by chordify); on a single line chordify yields single notes. melody.chord-relation needs a chord under the note. Exposed by AB-111 (harmonise a melody), AB-120 (harmonise a heard melody with I, IV, V), AB-148 (continue an opening over I and V), AB-109 (RCM L6 lead sheet) |
| form.improvisation-space | Bars where the score asks the player to supply the notes: bars with chord symbols and only rests or slashes in the piano staff; "solo", "fill", "ad lib.", "improvise" or "N.C." text; a given opening followed by empty bars; one part of a two-part piece left empty. Count, length, position, and what is given (chords, scale, motif, the other part) | both: code from music21 `harmony.ChordSymbol` over bars whose notes are rests or slash noteheads, `harmony.NoChord`, `expressions.TextExpression`; agent for prose instructions | TCL improvisation stimuli and Rock & Pop solo breaks (draft-abrsm-trinity 2.2, draft-styles 2.3); MXL-notehead (slash) | form.song-sections names a "solo section" by its label only; item.format's chord chart is a whole-item value; rhythm.cadenza is free playing of written notes. No row reports where, how long and over what the learner improvises. Exposed by AB-115, AB-144 to AB-148, AB-150, AB-153, AB-157, AB-158, AB-160, AB-233 |
| notation.slash-rhythm | Rhythm slashes in a part: beat slashes (stemless; play in time, rhythm free) and rhythmic notation (slash noteheads with stems and beams: comp in this rhythm); count and kind, and the rhythm they prescribe | code: music21 `note.Note.notehead == 'slash'` (checked: the value sets); raw MusicXML `<notehead>slash</notehead>` and `<measure-style><slash>` | MXL-notehead; MXL-slash; TCL-RP (chord charts) | item.format mentions slash notation only as a cue for "chord chart"; the rhythm slashes prescribe is not read by any row. Exposed by AB-110 (comp from a chart), AB-180 (riff to a chart), AB-146 |
| style.dance-type | The dance or march a piece is, each kind named and reported separately: minuet, gavotte, bourrée, sarabande, gigue, allemande, courante, polonaise, waltz, ländler, polka, march, siciliano, tarantella (mazurka and tango have their own rows). Each kind is recognised from its metre, its upbeat and its rhythmic cell as its source states them (for example the gavotte's half-bar upbeat, the sarabande's weight on beat 2); each cell to be quoted before it is measured | both: code from metre.class, mark.anacrusis, rhythm.bar-patterns (new), meta.title; agent decides | WP-Minuet, WP-Gavotte, WP-Sarabande, WP-Polonaise, WP-Siciliana and others (stand-ins, to be replaced); TCL improvisation stylistic stimulus ("styles from march to irregular dance", AB-144) | style.evidence lists periods and popular and Latin styles but no Baroque or Classical dances; texture.mazurka covers one dance; meta.title catches a dance only when the title names it. Exposed by AB-073 (Baroque style), AB-075 (Romantic: waltz, polonaise), AB-144 (TCL stylistic stimuli) |
| harmony.planing | Successive chords of one interval structure moved in parallel (chord streams): diatonic planing (qualities change with the scale) or exact (chromatic) planing (one quality throughout); length in chords. Includes parallel triads and parallel power chords | code: custom over music21 `Stream.chordify`: consecutive chords with equal intervals above the bass and a moving bass; JS T-19 Parallel Motion as a definition witness | WP-Parallel_harmony (stand-in; OMT's Impressionism material to quote) | harmony.voice-leading reports parallel fifths and octaves as faults in three- and four-voice textures; texture.motion is between the hands' outer lines; harmony.voicing names one chord's layout, not a succession. Exposed by AB-076 (Impressionist and 20th-century style) |
| key.polytonal | Two keys or collections at once: different key signatures on the two staves, or each hand's notes fitting a different key or collection over a passage (one hand on white keys, the other on black keys) | both: code from raw `<key>` per staff (music21 `KeySignature` per staff), key-finding per staff (music21 `analyze('key')` on each staff); agent confirms | WP-Polytonality (stand-in; no syllabus page read for it) | notation.keys reports the signatures and changes, not per staff; key.tonic-mode gives one key; scale.collection is per passage, not per hand. Exposed by AB-076 |
| harmony.dissonance-share | The share of vertical intervals between simultaneous notes that are dissonant (seconds, sevenths, tritones, ninths), per passage; and sonorities outside the named chord qualities (non-tertian chords) | code: music21 `chord.Chord.isConsonant` over chordify (checked to exist); JS C-24 Vertical Dissonance Ratio as the definition (not in music21) | JS C-24; JS C-33 Non-Standard Chords; JS C-34 Complex Chords | harmony.chromatic-share counts non-diatonic chords (a diatonic cluster is diatonic); harmony.chord-quality names only listed qualities; mark.extended-technique covers clusters only. Exposed by AB-076, AB-238 |
| harmony.chord-scale | Over each chord (symbol or sounding), the scale or mode the melody or solo line uses: for example Dorian over a minor 7th, Mixolydian over a dominant 7th, Lydian over maj7#11, altered or diminished over an altered dominant | both: code, custom: the line's notes per chord span tested against music21 scale classes built on the chord root; agent where too few notes | LEV chs 9-11 (as abilities AB-152 cites them) | scale.collection names a passage's collection against its own tonic, not per chord; melody.chord-relation is per note. Exposed by AB-152 (chord-scale improvising), AB-150 |
| rhythm.clave-alignment | In a clave-based item: which clave direction (3-2 or 2-3) the melody and the piano pattern agree with, per phrase, and passages that go against it (cruzado) | both: code, custom: each line's onsets per two-bar cycle scored against both directions (texture.clave's matcher); agent confirms | Mauleón ch III, "The Melody and Clave" (as draft-styles 2.10 lists it) | texture.clave finds a hand whose onsets are a clave; texture.montuno is "aligned to the clave" for the montuno only. No row says whether a melody agrees with the clave. Exposed by AB-185 |
| texture.latin-pattern | One row per Latin accompaniment pattern the list has no row for, each reported separately: cha-cha-chá, mambo, songo, guaguancó, merengue, bomba, plena, cumbia (Colombian), joropo (Venezuelan), festejo and landó (Peruvian), chacarera and zamba (Argentine), samba, baião, choro and maxixe (the sixteenth-eighth-sixteenth cell), beguine. Each kind's piano or bass cell is quoted from its source before it is measured | both: code, a custom cell matcher per kind (as texture.tango); agent confirms the style | Mauleón ch V; Berklee Latin Piano Styles weeks 5, 7, 8, 11; Willey and Cardim; LCM Jazz G5 aural (beguine, samba), as draft-styles 2.6, 2.10 to 2.12 list them | style.evidence names most of these styles but says it is never certified by one signal and needs supporting rows; the rhythm and texture rows cover only clave, montuno, tumbao, bossa, tango, habanera, tresillo and cinquillo. Exposed by AB-143, AB-187, AB-188, AB-189, AB-192 |
| meta.keyboard-sound | The sound the score asks of the keyboard part: acoustic piano, electric piano, organ, synthesiser, harpsichord, other | code: music21 `instrument.Instrument` subclass per part (`ElectricPiano`, `ElectricOrgan`, `Harpsichord`, `Sampler` exist), raw `<instrument-sound>`; text such as "Organ" | MXL-instrument-sound; TCL-RP (sound per style) | item.format and texture.part-roles read instruments to find the parts, not the sound asked of the piano part. Exposed by AB-181 (choose a keyboard sound) |
| pitch.tone-row | A twelve-note row used as the pitch material, and its forms (prime, inversion, retrograde, retrograde inversion); count of statements | both: code from music21 `serial.TwelveToneRow` and `TwelveToneMatrix` (checked to exist) with a custom search for row statements; agent confirms | M21 (`serial`) | scale.collection's value "none (post-tonal)" groups all non-collection music together. Exposed by AB-076 (20th-century style); low frequency at the levels the abilities cite |

### 1.2 Parts missing from existing rows

Each kind below is a part that a row names generally but does not report separately, so evidence for the row would certify a part it never measured (abilities.md 8.4).

| proposed id | what it is | detected by | source of its definition | why the list lacks it (nearest row, read in full) |
| --- | --- | --- | --- | --- |
| item.format: rhythm exercise | A value for item.format: a rhythm-only exercise (unpitched notes, often on a one-line staff, to clap or tap; one or two hands) | code: music21 `note.Unpitched` (checked), partitura `UnpitchedNote`, layout `StaffLayout.staffLines == 1` | RCM sight-reading rhythm and ear clapback (draft-rcm section 2); MXL-staff-lines | item.format's nine values have no rhythm-only item; a clapping item would fall in "technical exercise" or none. Exposed by AB-122, AB-123, AB-219 (tapped with both hands) |
| technique.arpeggio-chord: further chords | Add augmented, minor 7th, major 7th and ninth-chord arpeggios; and whether the hands move in contrary motion | code: music21 `chord.Chord.commonName`, `isAugmentedTriad`, `isNinth` (checked) over each run | abilities AB-091, AB-103 (RSL augmented arpeggios; ABRSM Jazz 7ths and 9ths), AB-104 (TCL contrary-motion arpeggio) | the row names major, minor, dominant 7th and diminished 7th only; technique.arpeggio-run has no contrary-motion kind (technique.scale-run has one) |
| scale.collection: further collections | Add the b3 pentatonic (ABRSM Jazz; its notes to be quoted from the syllabus), the melodic-minor modes (Lydian dominant, altered), bebop scales, and the Phrygian-dominant mode of harmonic minor | code: music21 scale classes or custom pitch-class sets | LEV ch 9 (melodic minor harmony); ABRSM Jazz scales (draft-styles 2.1) | the row lists diatonic, the seven modes, major and minor pentatonic, blues, whole-tone, octatonic, chromatic. Exposed by AB-093, AB-152 |
| texture.broken-chord: named figures | Report each figure separately: within a fifth; over an octave; in triplets; four-note; the alternate-note pattern (RCM; its order to be quoted) | code: as the row's rule, with the figure's order of chord members | RCM technical tests (draft-rcm section 2, Levels 9-10); AB-101 | the row defines one figure ("sounded one after another ... through a bar or half bar"); kinds are not named |
| harmony.progression: cadential 6-4 | Name the cadential 6-4 (I6/4 to V to I; RCM's I–IV–V6/4–5/3–I) | code: over harmony.roman (inversion figures) | RCM Levels 8-10 chord formulas (draft-rcm section 2); OMT-cadential64.html (to quote) | harmony.progression's list and harmony.cadence's types do not name it. Exposed by AB-105 |
| interval.melodic: compound intervals | Name 9ths and 10ths (and larger) instead of "beyond an octave" | code: music21 `interval.Interval.name` (gives M9, M10) | RCM ear intervals Level 10 (9ths; draft-rcm) | the row lumps every interval over an octave together. Exposed by AB-135 |
| melody.chord-relation: chord member | For each chord tone, which member it is (root, 3rd, 5th, 7th, 9th or other extension) | code: music21 `chord.Chord.getChordStep` (checked to exist) | RCM Levels 3-4 ear test (root, third or fifth; draft-rcm); Berklee approach notes (AB-151) | the row says "chord tone" and names guide tones, but not the member. Exposed by AB-140, AB-151 |
| texture.clave: 6/8 clave | Add the 6/8 clave | code: as the row's rule | Mauleón ch III (6/8 clave, per draft-styles 2.10) | the row names son, rumba and bossa clave. Exposed by AB-142 |
| texture.tango: further figures | Add the síncopa, the arrastre and the yumba as named figures (each defined from the source) | code: custom cell matchers; agent for the arrastre (a drag into the beat) | Link and Wendland (draft-styles 2.13) | the row names 3-3-2, habanera, marcato en 4 and en 2. Exposed by AB-190 |
| texture.piano-role: per section | Report the role per section, not one value per item | as the row | as the row | the row says "one value", so a switch between comping and soloist inside an item is not shown. Exposed by AB-200, AB-191 |
| mark.pedal-kind: depths | Add quarter pedal and flutter pedal (text or sign) beside half pedal | code: music21 `TextExpression`, partitura `Words`; agent for non-standard signs | AB-220's source (as abilities.md cites it) | the row names half pedal only. Exposed by AB-220 |
| mark.ornament: trill details | Add, per trill, a written start (upper or main note, by a small note) and a written termination | code: music21 `expressions.Trill.nachschlag` (checked to exist), grace notes before and after | MXL-trill-mark; AB-222 | the row reports trills with their wavy-line length only. Exposed by AB-222 (ending a trill in time) |
| harmony.chord-quality: further qualities | Add the Phrygian chord (sus with flat 9) and quartal or quintal sonorities | code: interval content of the chord; symbol text | LEV ch 4 (AB-166) | the row names sus2 and sus4, not the Phrygian chord; quartal is only a voicing kind in harmony.voicing. Exposed by AB-166 |
| mark.extended-technique: cluster size | Per cluster: its span in semitones, white keys, black keys or all, and how it is to be struck (palm, forearm, from the text) | code: chord pitch content; agent reads the text | WP-Tone_cluster (as the row) | the row defines a cluster but does not report its size. Exposed by AB-238 |
| form.song-sections: Latin sections | Add the salsa and son sections: montuno (coro-pregón), mambo, moña | both: as the row | Mauleón ch V "Song Form and Structures" (title only read by the draft; content to read) | the row's labels are pop, rock and jazz sections. Exposed by AB-187 |
| notation.chord-symbols: N.C. | Report "N.C." (no chord) marks with their positions | code: music21 `harmony.NoChord` (checked to exist) | MXL-harmony (kind "none") | the row reports chord symbols; a no-chord mark is not named. Exposed by AB-109, AB-110 |
| meta.arrangement: reharmonised | Add the kind "reharmonised" (chords changed from the original's) | agent, from the original's chords where known | AB-172 (reharmonise with substitute chords) | the row's kinds are simplified, reduction, cover, lead-sheet realisation. Exposed by AB-172 |
| mark.tempo-text: beat unit | Report the metronome mark's beat unit (quarter, dotted quarter, half) | code: music21 `tempo.MetronomeMark.referent` (checked) | MXL-metronome (beat-unit) | the row reports tempo words and the mark, not its unit, which says whether 6/8 or 3/8 is counted in two, one or six. Exposed by AB-027 (3/8 felt in one), AB-028 |

## 2. Abilities with a part no characteristic covers

One line each: the uncovered part and the proposed characteristic, or why it is not in the music.

- AB-005: which keys are played (middle C, the Cs, black-key groups) → pitch.inventory.
- AB-006: one key under two names → reading.enharmonic-spelling.
- AB-008: not in the music: where the eyes go is a way of playing; the item shows only its shifts and leaps (existing rows).
- AB-022: letter names and finger numbers as printed aids → notation.reading-aids.
- AB-023: the notes of the reading range, and printed note-name aids → pitch.inventory, notation.reading-aids.
- AB-027: 3/8 felt in one, from the metronome unit → mark.tempo-text: beat unit.
- AB-028: compound time counted in dotted beats → mark.tempo-text: beat unit.
- AB-029: the beat grouping of irregular metres → metre.grouping.
- AB-031: rests in both hands at once, and rhythm-only items → rhythm.silence, item.format: rhythm exercise.
- AB-038: printed counts → notation.reading-aids; counting aloud itself is not in the music (a way of practising).
- AB-073: Baroque dances → style.dance-type.
- AB-075: Romantic dances (waltz, polonaise) → style.dance-type.
- AB-076: planing, polytonality, dissonance level, twelve-tone rows → harmony.planing, key.polytonal, harmony.dissonance-share, pitch.tone-row.
- AB-091: augmented arpeggios → technique.arpeggio-chord: further chords.
- AB-093: b3 pentatonic → scale.collection: further collections.
- AB-101: the named broken-chord figures (alternate-note, triplet, four-note) → texture.broken-chord: named figures.
- AB-103: minor 7th, major 7th and ninth arpeggios → technique.arpeggio-chord: further chords.
- AB-104: contrary-motion arpeggio → technique.arpeggio-chord: further chords.
- AB-105: the cadential 6-4 formula → harmony.progression: cadential 6-4.
- AB-109: chords implied by a melody (RCM L6); N.C. marks → harmony.implied, notation.chord-symbols: N.C.
- AB-110: prescribed comping rhythm; N.C. marks → notation.slash-rhythm, notation.chord-symbols: N.C.
- AB-111: chords a given melody implies → harmony.implied.
- AB-115: the empty part to improvise → form.improvisation-space.
- AB-116: not in the music: transposing is done to an item; the list retired key.transposition-cost as a computation, and the item's own rows apply to the result.
- AB-120: chords a heard melody implies (its score) → harmony.implied.
- AB-122: one-bar rhythm patterns; rhythm-only items → rhythm.bar-patterns, item.format: rhythm exercise.
- AB-123: a written rhythm to tap → item.format: rhythm exercise, rhythm.bar-patterns.
- AB-135: 9ths → interval.melodic: compound intervals.
- AB-140: root, third or fifth of a chord → melody.chord-relation: chord member.
- AB-142: 6/8 clave → texture.clave: 6/8 clave.
- AB-143: samba and beguine patterns, mambo and rumba patterns → texture.latin-pattern.
- AB-144: the bars to improvise over an accompaniment; the stylistic stimulus's dances → form.improvisation-space, style.dance-type.
- AB-145: the motif given and the bars to fill → form.improvisation-space.
- AB-146: the chord chart's solo bars and their rhythm slashes → form.improvisation-space, notation.slash-rhythm.
- AB-147: the answering phrase's empty bars → form.improvisation-space.
- AB-148: the opening plus empty bars, and its implied I and V → form.improvisation-space, harmony.implied.
- AB-149: the poem or picture stimulus is not music (not in the music); the texture stimulus is covered by existing rows.
- AB-150: the solo bars over a tune or blues → form.improvisation-space.
- AB-151: chord tones by member (chord tones first) → melody.chord-relation: chord member.
- AB-152: the scale used over each chord; melodic-minor and bebop scales → harmony.chord-scale, scale.collection: further collections.
- AB-153: fills and solo breaks inside the arrangement → form.improvisation-space.
- AB-157: where the head leaves room for fills → form.improvisation-space.
- AB-158: the solo section's bars → form.improvisation-space.
- AB-160: fills after the first chorus → form.improvisation-space.
- AB-166: Phrygian chords → harmony.chord-quality: further qualities.
- AB-172: reharmonisation → meta.arrangement: reharmonised.
- AB-180: the chart's rhythm slashes → notation.slash-rhythm.
- AB-181: the keyboard sound asked for → meta.keyboard-sound.
- AB-185: a melody agreeing with the clave → rhythm.clave-alignment.
- AB-187: the Cuban styles' patterns; the salsa sections → texture.latin-pattern, form.song-sections: Latin sections.
- AB-188: samba comping → texture.latin-pattern.
- AB-189: choro and maxixe figures → texture.latin-pattern.
- AB-190: síncopa, arrastre, yumba → texture.tango: further figures.
- AB-191: role changes inside an item → texture.piano-role: per section.
- AB-192: the further Latin American patterns; 6/8 and 3/4 groupings → texture.latin-pattern, metre.grouping.
- AB-195: entries after the soloist's bars → rhythm.silence; following the soloist live is not in the music.
- AB-198: the duet part's rests while the partner plays → rhythm.silence.
- AB-199: the bars where others play (solos, count-in bars) → rhythm.silence; responding to the other players is not in the music.
- AB-200: switching roles inside one item → texture.piano-role: per section.
- AB-217: rests and solo sections while others play → rhythm.silence; finding one's place again by ear is not in the music.
- AB-219: two- and three-against-four tapped (rhythm-only items) → item.format: rhythm exercise.
- AB-220: quarter and flutter pedal → mark.pedal-kind: depths.
- AB-222: a trill's written start and termination → mark.ornament: trill details.
- AB-233: the consequent's empty bars → form.improvisation-space.
- AB-238: dissonance and cluster size → harmony.dissonance-share, mark.extended-technique: cluster size.

**Not in the music (the whole ability):**
- AB-001, AB-002, AB-004: posture, hand shape and tension are the body, not the score.
- AB-066: recovering from a slip is a way of performing.
- AB-067: playing from memory is a way of playing; the item's memorisation load is read from existing rows (form.length, reading.redundancy).
- AB-069: a programme is a set of items; its contrast is computed from each item's rows.
- AB-096: recalling a pattern on request is memory, not a property of the item.
- AB-154: making up one's own piece; what it must contain is read by the other rows on the result.
- AB-208 to AB-215: practice method (slow practice, hands separate, isolating, fixing, variants, recording, restarting, mock performance); difficulty.local-profile already shows where a hard spot is.
- AB-216: counting in is done before the first note.
- AB-227, AB-228: reading ahead and leaving notes out are ways of reading; the item's reading load is difficulty.reading.
- AB-231: the source is a recording; no one in this process listens to audio, and the item's rows apply once it is transcribed.

## 3. Every ability checked

Each of the 232 rows in abilities.md section 1 was checked once against the list, with its title and parameters. The three groups do not overlap.

- **A part exposed a miss (section 2, 62 rows):** AB-005, AB-006, AB-022, AB-023, AB-027, AB-028, AB-029, AB-031, AB-038, AB-073, AB-075, AB-076, AB-091, AB-093, AB-101, AB-103, AB-104, AB-105, AB-109, AB-110, AB-111, AB-115, AB-120, AB-122, AB-123, AB-135, AB-140, AB-142, AB-143, AB-144, AB-145, AB-146, AB-147, AB-148, AB-150, AB-151, AB-152, AB-153, AB-157, AB-158, AB-160, AB-166, AB-172, AB-180, AB-181, AB-185, AB-187, AB-188, AB-189, AB-190, AB-191, AB-192, AB-195, AB-198, AB-199, AB-200, AB-217, AB-219, AB-220, AB-222, AB-233, AB-238.
- **Not in the music (the whole ability):** AB-001, AB-002, AB-004, AB-008, AB-066, AB-067, AB-069, AB-096, AB-116, AB-149, AB-154, AB-208, AB-209, AB-210, AB-211, AB-212, AB-213, AB-214, AB-215, AB-216, AB-227, AB-228, AB-231.
- **Covered by existing rows, no miss found:** AB-003, AB-007, AB-009, AB-010, AB-011, AB-012, AB-013, AB-014, AB-015, AB-016, AB-017, AB-018, AB-019, AB-020, AB-021, AB-024, AB-025, AB-026, AB-030, AB-032, AB-033, AB-034, AB-035, AB-036, AB-037, AB-039, AB-040, AB-041, AB-042, AB-043, AB-044, AB-045, AB-046, AB-047, AB-048, AB-049, AB-050, AB-051, AB-052, AB-053, AB-054, AB-055, AB-056, AB-057, AB-058, AB-059, AB-060, AB-061, AB-062, AB-063, AB-064, AB-065, AB-068, AB-070, AB-071, AB-072, AB-074, AB-077, AB-079, AB-080, AB-081, AB-082, AB-083, AB-084, AB-085, AB-086, AB-087, AB-088, AB-089, AB-090, AB-092, AB-094, AB-095, AB-097, AB-098, AB-099, AB-100, AB-102, AB-106, AB-107, AB-108, AB-112, AB-113, AB-114, AB-117, AB-118, AB-119, AB-121, AB-124, AB-125, AB-128, AB-129, AB-130, AB-131, AB-132, AB-133, AB-134, AB-136, AB-137, AB-138, AB-139, AB-141, AB-155, AB-156, AB-159, AB-162, AB-163, AB-164, AB-165, AB-167, AB-168, AB-169, AB-170, AB-171, AB-173, AB-174, AB-175, AB-176, AB-177, AB-178, AB-179, AB-182, AB-183, AB-184, AB-186, AB-193, AB-194, AB-196, AB-197, AB-202, AB-204, AB-205, AB-206, AB-207, AB-218, AB-221, AB-223, AB-224, AB-225, AB-226, AB-229, AB-230, AB-232, AB-234, AB-235, AB-236, AB-237.

Three judgements in the covered group, for the next checker: AB-018 (changing fingers on a repeated note) is read as rhythm.repeated-notes with technique.velocity and mark.fingering together; AB-179's twelve styles are each style.evidence entries whose supporting rows exist for rock, reggae, metal, gospel and country walk-ups, while R&B, funk and disco rest on general rows (syncopation at the subdivision, octaves, repeated chords), which a later pass may judge too weak; AB-074's Classical style rests on texture.alberti, form.period and form.sonata.

## 4. Counts (by script over this file)

Counted on 2026-10-08 by `build/charpass1/count.py` (not committed), which reads this file, `abilities.md` section 1 and the list's section 1 tables.

| count | value |
| --- | --- |
| ids in the list's section 1 tables (the script's own parse) | 194 |
| new rows proposed (1.1) | 18: detected by code 9, by both 9 |
| parts missing from existing rows (1.2) | 18: code 15, both 1, agent 1, "as the row" 1 (texture.piano-role, a "both" row) |
| new ids already in the list | 0 |
| 1.2 base ids not in the list | 0 |
| abilities checked (section 3) | 232 of 232, each in exactly one group; no id outside section 1 |
| a part exposed a miss | 62 |
| not in the music (whole ability) | 23 |
| covered by existing rows, no miss found | 147 |
| section 2 lines naming a proposal | 62; every name resolves to a row in section 1 (the script's two flags, "notation.chord-symbols: N.C" at AB-109 and AB-110, are its own stripping of the final full stop of "N.C."; read by eye) |
| proposals never named by an ability in section 2 | 0 |

## 5. Not done

- **No definition was run on a real score.** Every row above is a reading of its sources; the library names were checked by import only.
- **The cells of texture.latin-pattern's kinds, style.dance-type's kinds, the tango figures, the alternate-note pattern and the b3 pentatonic are not quoted here.** Each row says so; they must be read from the named source before a rule is written.
- **Mauleón ch V's content and OMT's planing and cadential 6-4 pages were not read**, by the brief's limit; the rows cite them as the places to read.
- **The drafts' ability rows were read only through abilities.md section 1 and the drafts' coverage tables**, as briefed; citations inside other draft sections were not opened.
