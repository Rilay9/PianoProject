# Iteration 1: completeness of characteristics.yaml (2026-10-07)

**Question.** What does placement need that `docs/classifier/characteristics.yaml` (202 rows at origin 883adf70) does not have? Checked against three sources the project did not write (published graded syllabi; published research on automatic piano difficulty) and one it did (the ability map's 28 MUST abilities).

**Scope of the check.** Syllabi read: ABRSM Piano Practical Grades 2025 & 2026 (the full PDF: scale requirements Initial to Grade 8, the general rules on pp. 11-14, the sight-reading parameters table on p. 16); RCM Piano Syllabus 2022 edition (Preparatory A, Level 5, Level 8 and Level 10 technical tests read; the general requirements on p. 7; Level 8 sight reading; the list headings); Trinity College London piano syllabus from 2023 (technical work rules p. 27, Initial and Grade 8 technical work, composition parameters pp. 25-26, assessment criteria pp. 21-22, sight-reading parameters p. 81, improvisation pp. 82-84). Levels and grades not named above were not read line by line; a demand that appears only there is not in these tables. Research read: Sébastien et al. 2012 (full text), Ramoneda et al. ICASSP 2022 (full text), Nakamura and Yoshii 2018 (difficulty section), Ramoneda et al. 2024 CIPI paper and Zapata/Ramoneda RubricNet 2024 (each through a summary of the paper page, not the PDF), Ramoneda et al. 2025 sight-reading generation (full text), the PSyllabus dataset page (through search results only). Chiu and Chen 2012 was not read: its features are listed here as the RubricNet and sight-reading papers report them. A "covering row" means a row whose stated decision or gap names the demand; it does not mean the row's code exists.

**A table fact found wrong while checking libraries** (correctness, not completeness; recorded for the correctness checker): the header comment of `characteristics.yaml` (line 35) and row `mark.pedal` say music21 10.5 has no pedal-mark class. In `.venv`, music21 10.5.0 has `music21.expressions.PedalMark` (with `PedalType`, `PedalForm`, `PedalBounce`, `PedalGapStart`), and parsing a MusicXML `<pedal type="start">` yields a `PedalMark` object (probe: `build/iter1/probe.py` on `build/iter1/ped.musicxml`, worktree-local, not committed). partitura 1.9.0 also reads the same file into a `SustainPedalDirection`, and reads the word "rit." into a `DecreasingTempoDirection`. So `mark.pedal` has two library witnesses, not none.

## 1. Published graded syllabi

| demand or feature | source (URL or file:line) | covering row id or MISSING | note |
| --- | --- | --- | --- |
| Hands-separate scales, then hands together | [ABRSM, Grade 1 vs Initial scales][abrsm] | texture.hands-together | the row says only "both hands sound at once"; a scale passage HT is technique.scale-run plus this |
| Hands together one octave apart (the default) | [ABRSM p.13][abrsm]; [TCL p.27][tcl] | MISSING | the vertical interval between the hands in a parallel passage is in no row; proposed coordination.hand-interval |
| Hands starting on the tonic in unison | [ABRSM, Grades 1-8 scales][abrsm] | MISSING | same: interval 0 between hands; coordination.hand-interval |
| Scales a third apart, a sixth apart | [ABRSM, Grades 5, 7, 8][abrsm]; [RCM p.91 "Separated by a 3rd/6th"][rcm] | MISSING | coordination.hand-interval |
| Chromatic scale a major sixth apart | [ABRSM, Grade 8][abrsm] | MISSING | coordination.hand-interval with scale.collection |
| Contrary-motion scales (incl. harmonic minor) | [ABRSM, Initial to Grade 8][abrsm]; [TCL p.45][tcl] | texture.motion | |
| Chromatic contrary-motion scale from different notes | [ABRSM, Grades 3, 5, 7][abrsm] | texture.motion | with scale.collection for the chromatic collection |
| RCM formula pattern (contrary then similar motion) | [RCM p.45, p.70][rcm] | texture.motion | the row must report a change of motion type inside one passage |
| Scale range: 1, 2 or 4 octaves | [ABRSM p.13 and grade pages][abrsm]; [RCM p.70][rcm] | technique.scale-run | the run's extent in octaves must be part of its output; the row's gap names only N notes |
| Major, harmonic, melodic and natural minor scales | [ABRSM, Grades 1-8][abrsm] | key.minor-form | the row reads minor form across a piece; within a run it is scale.collection |
| Chromatic scale | [ABRSM, Grade 2 on][abrsm]; [RCM p.45][rcm] | scale.collection | the row's dec names pentatonic, blues, mode; chromatic must be in its class list |
| Whole-tone scale | [ABRSM, Grade 8][abrsm] | scale.collection | as above, whole-tone must be listed |
| Legato and staccato scales (examiner's choice) | [ABRSM p.13; Grades 5-8][abrsm]; [RCM p.9 pentascales][rcm] | mark.articulation | with mark.slur for printed legato |
| Legato scale in thirds; staccato scales in thirds and sixths (one hand) | [ABRSM, Grades 7, 8][abrsm]; [TCL p.45][tcl] | texture.double-notes | with technique.scale-run ("incl. in 3rds/6ths") |
| Scales in octaves, solid staccato or broken legato; chromatic in octaves | [RCM p.91][rcm] | texture.octaves | |
| Scales with a dynamic shape (p-f-p, cresc./dim.) | [TCL p.45][tcl] | mark.hairpin | |
| Even notes in all technical work | [ABRSM p.13][abrsm]; [TCL p.27][tcl] | rhythm.values | |
| Triplet broken chords (Trinity Grade 1) | [TCL p.27][tcl] | texture.broken-chord | with rhythm.triplets |
| Broken and solid triads, tonic triads in root position and inversions | [RCM p.9, p.45][rcm]; [TCL p.29][tcl] | texture.broken-chord | inversions of a chord: harmony.inversion |
| Four-note tonic chords, broken alternate-note pattern | [RCM p.70, p.91][rcm] | texture.broken-chord | with texture.block-chords |
| Dominant 7th chords, broken and solid, with inversions | [RCM p.45][rcm] | harmony.chord-quality | with harmony.inversion |
| Leading-tone diminished 7th chords | [RCM p.70][rcm] | harmony.chord-quality | |
| Arpeggios: which chord (major, minor, dominant 7th, diminished 7th) | [ABRSM, Grades 5-8][abrsm]; [RCM p.70][rcm]; [TCL p.45][tcl] | MISSING | technique.arpeggio-run finds a run of chord tones but no row names the chord type of the run; proposed technique.arpeggio-chord |
| Arpeggios in first and second inversion | [ABRSM, Grades 7, 8][abrsm]; [RCM p.91][rcm] | MISSING | technique.arpeggio-chord |
| Dominant sevenths resolving on the tonic | [ABRSM p.13][abrsm] | MISSING | technique.arpeggio-chord (resolution after the run) |
| Technical patterns closed by a progression (I-V-I, I-IV-V-I, I-VI-IV-V64-V-I) | [RCM p.45, p.70, p.91][rcm] | harmony.progression | with harmony.cadence |
| Pentascales tonic to dominant | [RCM p.9][rcm]; [ABRSM p.16][abrsm] | technique.five-finger | the syllabi anchor the position on the tonic; the row does not say on which degree |
| Scale and arpeggio speeds by grade | [ABRSM p.14][abrsm]; [RCM p.45, p.70][rcm]; [TCL p.45][tcl] | difficulty.tempo | with technique.velocity |
| No pedal in technical work | [ABRSM p.13][abrsm] | mark.pedal | the absence of pedal marks |
| Sight-reading length (4 bars to one page) | [ABRSM p.16][abrsm]; [RCM p.71][rcm] | notation.bars | |
| Time signatures introduced by grade (2/4 to 12/8, 5/8, 7/8, 5/4, 7/4) | [ABRSM p.16][abrsm]; [TCL p.81][tcl] | notation.times | with metre.compound, metre.odd, metre.three-four |
| Changing time signatures | [TCL p.81][tcl] | notation.times | |
| Keys introduced by grade | [ABRSM p.16][abrsm]; [TCL p.81][tcl]; [RCM p.71 "up to four sharps or flats"][rcm] | key.signature | with notation.keys |
| "A minor (white notes only)" vs "A minor (including G#)" | [TCL p.81][tcl] | key.minor-form | the distinction is whether the raised 7th occurs |
| Modulation to dominant, relative, or any related key | [TCL p.81][tcl] | key.change | the row finds a change; the relation of the new key to the old (dominant, relative) is not in its output |
| Each hand separately; five-finger position; outside it | [ABRSM p.16][abrsm] | texture.alternating-hands | position: technique.five-finger, range.beyond-position |
| Hands playing together | [ABRSM p.16][abrsm] | texture.hands-together | |
| Note values introduced by grade; dotted patterns; semiquavers | [ABRSM p.16][abrsm]; [TCL p.81][tcl] | rhythm.values | with rhythm.dotted-quarter, rhythm.sixteenths; dotted-eighth patterns live only in rhythm.values |
| Tied notes | [ABRSM p.16][abrsm] | rhythm.ties | |
| Triplet rhythms | [ABRSM p.16][abrsm] | rhythm.triplets | |
| Duplets (and other non-triplet tuplets) | [TCL p.81][tcl] | MISSING | rhythm.triplets is triplets only; proposed rhythm.tuplets-other |
| Simple syncopation | [ABRSM p.16][abrsm]; [TCL p.25][tcl] | rhythm.syncopation | |
| Anacrusis / upbeat | [ABRSM p.16][abrsm]; [RCM p.71][rcm] | mark.anacrusis | |
| Occasional accidentals; chromatic notes | [ABRSM p.16][abrsm] | pitch.chromatic | |
| Double sharps and flats | [TCL p.81][tcl] | MISSING | pitch.chromatic counts accidentals against the key, not their kind; proposed reading.accidental-kinds |
| Legato phrases, slurs | [ABRSM p.16][abrsm]; [TCL p.81][tcl] | mark.slur | |
| Staccato, accents, tenuto | [ABRSM p.16][abrsm]; [TCL p.81][tcl] | mark.articulation | |
| Dynamics f, p, mf, mp, pp, ff | [ABRSM p.16][abrsm] | mark.dynamics | |
| Crescendo and diminuendo hairpins | [ABRSM p.16][abrsm] | mark.hairpin | |
| cresc. and dim. written as text | [TCL p.81][tcl] | MISSING | mark.hairpin reads `<wedge>`; text forms are words; proposed mark.expression-text (partitura reads "cresc." as a loudness direction) |
| Different dynamics for RH and LH | [TCL p.81][tcl] | coordination.dynamic-balance | the per-staff printed difference is an EXACT fact the row should expose before its rule |
| Pause signs | [ABRSM p.16][abrsm]; [TCL p.81][tcl] | mark.fermata | |
| Slowing at the end, rit., rall., a tempo, accel., tempo changes | [ABRSM p.16][abrsm]; [TCL p.81][tcl] | MISSING | mark.tempo-text reads tempo values and their provenance, not tempo-change directions; proposed mark.tempo-change |
| Tempo words (andante, moderato, allegretto) | [TCL p.81][tcl] | mark.tempo-text | |
| "Any common terms" (Italian expression words) | [TCL p.81][tcl] | MISSING | proposed mark.expression-text |
| 2-note chords in either hand; 3-part and 4-part chords | [ABRSM p.16][abrsm] | texture.block-chords | the row's gap says a maximum only; a per-hand count of chord sizes is what grades read |
| Spread chords | [ABRSM p.16][abrsm] | MISSING | no row for the arpeggiate mark; proposed mark.arpeggiate |
| Simple ornaments | [ABRSM p.16][abrsm] | mark.ornament | |
| Clef changes | [ABRSM p.16][abrsm] | MISSING | reading.unusual-notation names only clef changes mid-bar; a clef change between bars (LH moving to treble) is in no row; proposed notation.clef-change |
| 8va sign | [ABRSM p.16][abrsm] | mark.ottava | |
| Use of right pedal; simple pedalling | [ABRSM p.16][abrsm]; [TCL p.81][tcl] | mark.pedal | |
| Use of una corda pedal | [ABRSM p.16][abrsm] | MISSING | una corda is a words direction, not `<pedal>`; proposed mark.pedal-kind |
| Pedalling required but not always marked; pedalling essential | [TCL p.81][tcl] | MISSING | no row infers that a texture needs pedal when none is printed; proposed technique.pedal-implied |
| Pieces heavily reliant on pedalling | [ABRSM p.12][abrsm] | MISSING | technique.pedal-implied |
| Hand stretch: spread or omit notes at wide stretches | [ABRSM p.12][abrsm] | technique.span | with integrity.hand-span |
| D.C. and D.S. followed; other repeats usually not | [ABRSM p.12][abrsm] | mark.repeat | |
| Editorial fingering, metronome marks, ornament realisation | [ABRSM p.12][abrsm] | mark.fingering | metronome marks: mark.tempo-text; ornament realisation is not in mark.ornament's "kind or position" gap |
| Duets: primo or secondo part | [ABRSM p.12][abrsm] | integrity.extra-parts | a duet part is a two-player file; the row names more than two staves |
| List A: faster moving, technical agility | [ABRSM p.11][abrsm] | MISSING | no row classifies an item's character; proposed expression.character |
| List B: lyrical, invites expressive playing | [ABRSM p.11][abrsm] | MISSING | expression.character |
| List C: a variety of traditions and styles | [ABRSM p.11][abrsm] | style.genre-label | |
| RCM repertoire lists by era (Baroque, Classical, Romantic, 20th/21st c.) | [RCM list headings][rcm] | meta.composer-era | |
| RCM Inventions list | [RCM Levels 8-9][rcm] | texture.counterpoint | |
| RCM Classical sonatas list | [RCM Level 9][rcm] | form.sonata | |
| RCM etudes per level | [RCM p.7][rcm] | meta.collection | with meta.title (etude) |
| Sight playing "comparable to Level N repertoire" | [RCM p.71][rcm] | difficulty.grade-calibration | a lookup of whether a piece is on a published list is a separate fact; see meta.published-grade |
| Prep A melodies: four notes, by step, one direction, may repeat a note | [RCM p.9][rcm] | interval.step | direction: quality.contour (generated only); repeats: rhythm.repeated-notes |
| Fingering given for the first note only | [RCM p.9][rcm] | mark.fingering | |
| Treble melody RH alone, bass melody LH alone | [RCM p.9][rcm] | clef.bass | with clef.treble, prereq.hand-assignment |
| Read a lead sheet and realise an accompaniment (Level 8 option) | [RCM p.71][rcm] | integrity.lead-sheet-shape | with notation.chord-symbols, harmony.chord-quality |
| Playback melodies built on the first three notes of a scale | [RCM p.9][rcm] | MISSING | which scale degrees a melody uses is in no row; proposed melody.degree-profile |
| Playback beginning on tonic, mediant, dominant or upper tonic | [RCM p.71][rcm] | MISSING | melody.degree-profile (start degree) |
| Improvise an answer phrase to make an eight-bar contrasting period | [RCM p.71][rcm] | MISSING | form.phrase finds boundaries, not the question-answer relation; proposed form.period |
| Chord quality by ear; chord progressions; intervals | [RCM p.7][rcm] | harmony.chord-quality | progressions: harmony.progression; intervals: interval.step/skip/leap |
| Trinity exercises: tone, balance and voicing | [TCL p.27][tcl] | coordination.dynamic-balance | with texture.melody-in-chords |
| Trinity exercises: coordination | [TCL p.27][tcl] | difficulty.coordination | |
| Trinity exercises: finger and wrist strength and flexibility | [TCL p.27][tcl] | technique.finger-independence | wrist: rhythm.repeated-notes, texture.octaves |
| Improvisation stimulus: chord vocabulary by grade (I, IV, V; ii; i, iv, V; ii half-diminished) | [TCL p.83][tcl] | harmony.roman | |
| Up to 2 chords per bar | [TCL p.83-84][tcl] | harmony.rhythm | |
| Stimulus styles (march, lullaby, fanfare, tango, waltz) | [TCL p.83][tcl] | style.genre-label | |
| Motivic stimulus | [TCL p.82][tcl] | melody.motif-repetition | |
| Composition: clear melodic line | [TCL p.25][tcl] | quality.phrase-shape | generated only today |
| Composition: dynamic contrast; articulations | [TCL p.25][tcl] | mark.dynamics | articulations: mark.articulation |
| Composition: melodic ornamentation | [TCL p.25][tcl] | mark.ornament | |
| Composition: ABA form | [TCL p.25][tcl] | form.binary-ternary | |
| Composition: melodic range of an octave or more | [TCL p.25][tcl] | hands.per-bar-range | the melody's range, not a hand's, is what is named; see melody.tessitura |
| Composition: chromaticism; semiquaver passages | [TCL p.25][tcl] | pitch.chromatic | semiquavers: rhythm.sixteenths |
| Composition: theme and variations | [TCL p.26][tcl] | MISSING | no form row for variations; proposed form.variations |
| Composition: modulation; irregular time signatures | [TCL p.26][tcl] | key.change | irregular metre: metre.odd |
| Composition: extended techniques | [TCL p.26][tcl] | MISSING | not in reading.unusual-notation's list; widening proposed, no new row |
| Composition duration by grade (0.5 to 5 minutes) | [TCL p.25-26][tcl] | form.length | |
| Technical control across the full compass (Grades 6-8) | [TCL p.22][tcl] | hands.per-bar-range | with integrity.piano-range |
| Security of pitch and rhythm, continuity, mood (assessment) | [TCL p.21][tcl] | n/a | a performance criterion, not a score characteristic |
| Pitch, time, tone, shape, performance (assessment) | [ABRSM p.12][abrsm] | n/a | performance criteria; "shape" reads form.phrase, mark.dynamics, mark.articulation |
| All technical work from memory | [ABRSM p.13][abrsm]; [RCM p.7][rcm] | n/a | a performance condition |

## 2. Research on automatic piano difficulty

| demand or feature | source (URL or file:line) | covering row id or MISSING | note |
| --- | --- | --- | --- |
| Playing speed (tempo times note values) | [Sébastien 2012, Table 1][seb]; [Chiu and Chen 2012 as reported in RubricNet][rubric] | technique.velocity | |
| Fingering cost from cost functions on intervals | [Sébastien 2012, Table 1][seb] | technique.fingering-demand | |
| Printed `<fingering>` as a feature | [Sébastien 2012, Table 1][seb] | mark.fingering | |
| Hand displacements over an octave within two beats (ratio) | [Sébastien 2012, Table 1][seb] | MISSING | technique.leap-size gives largest and typical leaps; the time-bounded ratio is in no row; proposed technique.displacement-rate |
| Displacement rate weighted by distance categories | [RubricNet, reporting Chiu and Chen][rubric] | MISSING | technique.displacement-rate |
| Polyphony: chord ratio | [Sébastien 2012, Table 1][seb] | texture.block-chords | the row's gap: a maximum, not a ratio |
| Polyphony: simultaneous voices (fugue) | [Sébastien 2012, Table 1][seb] | texture.counterpoint | |
| Harmony: ratio of accidental alterations against the main tonality | [Sébastien 2012, Table 1][seb] | pitch.chromatic | |
| Irregular rhythm: tuplets against duplets | [Sébastien 2012, Table 1][seb] | texture.polyrhythm | |
| Length (pages, bars) | [Sébastien 2012, Table 1][seb] | form.length | |
| Pattern discovery: scales, arpeggios, trills by interval windows | [Sébastien 2012, §2][seb] | technique.scale-run | arpeggios: technique.arpeggio-run; trills: mark.ornament |
| Hand synchronisation raises a two-hand mark | [Sébastien 2012, §5][seb] | coordination.interaction | |
| Difficulty per measure, to find the hard parts | [Sébastien 2012, §6][seb] | MISSING | every difficulty row is whole-item; proposed difficulty.local-profile |
| Right and left hand computed separately | [Sébastien 2012, §4][seb]; [RubricNet][rubric] | prereq.hand-assignment | |
| Pitch entropy (pitch variety) per hand | [RubricNet][rubric]; [sight-reading generation 2025, §2.2][sr] | MISSING | proposed reading.pitch-entropy |
| Pitch range per hand | [RubricNet][rubric] | hands.per-bar-range | |
| Average pitch (register) per hand | [RubricNet][rubric] | hands.per-bar-range | derivable from the per-bar ranges; not written |
| Average inter-onset interval of pitch-set events | [RubricNet][rubric] | technique.velocity | the inverse rate; per hand |
| Pitch-set Lempel-Ziv complexity (repetitiveness) | [RubricNet][rubric] | MISSING | melody.motif-repetition is a generated-only motif rule; a compressibility measure of the whole texture is in no row; proposed reading.redundancy |
| Note density | [sight-reading generation 2025, §2.1][sr] | reading.visual-density | |
| Fingering frequency: rare fingerings are harder | [Ramoneda ICASSP 2022, §2][mk] | technique.fingering-demand | |
| Probabilistic cost per unit time in a window, per hand and both hands | [Nakamura and Yoshii 2018, §II.B][nak] | MISSING | difficulty.local-profile; the both-hands sum relates to difficulty.coordination |
| Black and white key geometry: difficulty changes on transposition | [Nakamura and Yoshii 2018, §II.A][nak] | difficulty.pitch-navigation | blackKeyRatio is named there |
| Rate of unplayable notes | [Nakamura and Yoshii 2018, abstract][nak] | technique.playability | |
| Difficulty validated against annotated performance errors | [Nakamura and Yoshii 2018, §II.B.2][nak] | difficulty.grade-calibration | an error-rate oracle is a different calibration set from graded levels; the row names CIPI and PSyllabus only |
| Pianoplayer finger per note (P-F) and finger velocity cost (P-V) | [Ramoneda ICASSP 2022, §4.1][mk] | technique.fingering-demand | |
| HMM finger per note (N-F) and transition probability (N-P) | [Ramoneda ICASSP 2022, §4.1][mk] | technique.fingering-demand | |
| Note-onset piano-roll baseline | [Ramoneda ICASSP 2022, §4.1][mk] | difficulty.features | |
| Segment-level difficulty from score-level labels | [Ramoneda ICASSP 2022, §4.2][mk] | MISSING | difficulty.local-profile |
| Mikrokosmos-difficulty labels (147 pieces, 3 levels) | [Ramoneda ICASSP 2022, §3][mk] | difficulty.grade-calibration | not named in the row as a candidate set |
| Pitch sequence representation | [Ramoneda et al. 2024 (CIPI)][cipi] | difficulty.features | |
| Fingering embeddings (ArGNN) | [Ramoneda et al. 2024 (CIPI)][cipi] | technique.fingering-demand | |
| Expressiveness embeddings (virtuosoNet: predicted tempo, dynamics, articulation) | [Ramoneda et al. 2024 (CIPI)][cipi] | difficulty.expressive | the row counts printed marks; a model of expressive demand beyond the marks is not in it |
| CIPI: 652 pieces, 9 Henle levels | [Ramoneda et al. 2024 (CIPI)][cipi] | difficulty.grade-calibration | access is restricted (see proposals) |
| PSyllabus: 7,901 pieces, 11 levels drawn from syllabi | [PSyllabus paper][psyl] | difficulty.grade-calibration | the labels are list memberships; a direct lookup is proposed as meta.published-grade |
| Experts rate generated scores for readability, naturalness, playability | [sight-reading generation 2025, §4][sr] | quality.coherence | readability: difficulty.perceptual; playability: technique.playability |

## 3. The curriculum's own demands (ABILITY-MAP.md, 28 MUST abilities)

| demand or feature | source (URL or file:line) | covering row id or MISSING | note |
| --- | --- | --- | --- |
| A1.1 repeats, first and second endings, D.C. | docs/prompts/runs/curriculum-review-2026-10-05/ABILITY-MAP.md:93 | mark.repeat | |
| A1.1 fermatas | ABILITY-MAP.md:93 | mark.fermata | |
| A1.1 staccato | ABILITY-MAP.md:93 | mark.articulation | |
| A1.1 natural signs (Für Elise easy: 4 naturals) | ABILITY-MAP.md:93-94 | MISSING | pitch.chromatic does not separate a natural from other accidentals; proposed reading.accidental-kinds |
| A1.1 where in the item each mark first prints | ABILITY-MAP.md:102 | target.distribution | |
| A1.1 whether the app unrolls endings and D.C. | ABILITY-MAP.md:105 | integrity.repeat-structure | the row checks well-formedness; unrolling is app behaviour |
| A1.2 key signature G or F | ABILITY-MAP.md:111 | key.signature | |
| A1.2 the signature's altered note actually played ("the sharp in Jingle Bells in G") | ABILITY-MAP.md:117 | MISSING | a key signature can be printed and never exercised; proposed key.signature-exercised |
| A1.2 3/4 pieces | ABILITY-MAP.md:111, 117 | metre.three-four | |
| A1.2 unseen rows' fifths and metre caps (generated) | ABILITY-MAP.md:119 | generated.spec-declared | |
| A2.1 five-finger tune | ABILITY-MAP.md:133 | technique.five-finger | |
| A2.1 transposition that needs no accidentals (Ode RH up a fifth) | ABILITY-MAP.md:134 | MISSING | the accidentals and black keys a transposition to a named key would add are in no row; proposed key.transposition-cost |
| A2.1 I-IV-V7 in the item | ABILITY-MAP.md:133 | harmony.progression | |
| A2.1 the same tune printed in a second key | ABILITY-MAP.md:139 | integrity.duplicate-version | whether its bar fingerprints are transposition-invariant was not checked |
| A2.1 a tune the learner already knows | ABILITY-MAP.md:139-141 | MISSING | proposed meta.familiarity |
| A3.1 printed chord symbols to check against | ABILITY-MAP.md:160 | notation.chord-symbols | |
| A3.1 tonic found by ear | ABILITY-MAP.md:154 | key.tonic-mode | |
| A3.1 bass line | ABILITY-MAP.md:154 | harmony.bass-behaviour | |
| A3.1 progression and chord rhythm | ABILITY-MAP.md:154 | harmony.progression | chord rhythm: harmony.rhythm |
| A3.1 melody playable from ear: degrees used, start degree | ABILITY-MAP.md:154 | MISSING | melody.degree-profile |
| A4.1 sections and joins; landmarks to restart from | ABILITY-MAP.md:183 | form.sections | with form.phrase |
| A4.1 a one-pass performance piece | ABILITY-MAP.md:183 | difficulty.level | |
| A4.2 count-in tempo | ABILITY-MAP.md:200 | mark.tempo-text | |
| A4.2 the form kept while the band runs; re-entry at bar 5 or 9 | ABILITY-MAP.md:200 | form.sections | with form.twelve-bar, form.thirty-two-bar |
| A4.2 printed ending cues ("rit." and "Tag" in Storyville bars 53-56) | ABILITY-MAP.md:201 | MISSING | rit.: mark.tempo-change; "Tag" and the ending: form.intro-ending and mark.expression-text |
| A5.1 cadences in a minuet or hymn | ABILITY-MAP.md:226 | harmony.cadence | |
| A5.1 I-vi-IV-V in a pop song | ABILITY-MAP.md:226 | harmony.progression | |
| A5.1 a V/V | ABILITY-MAP.md:226 | harmony.applied | |
| A5.1 chords not in the key | ABILITY-MAP.md:226 | harmony.chromatic-share | |
| A5.1 where each instance sits (bars) | ABILITY-MAP.md:227 | target.distribution | |
| A6.1 a known tune with symbols to hide | ABILITY-MAP.md:263 | notation.chord-symbols | |
| A6.1 one chord per bar first | ABILITY-MAP.md:262 | harmony.rhythm | |
| A6.1 chord tones on strong beats | ABILITY-MAP.md:262 | melody.chord-relation | |
| A6.2 models of composition: 8+8 binary minuet | ABILITY-MAP.md:289, 292 | form.binary-ternary | |
| A6.2 the 8+8 as a question and answer | ABILITY-MAP.md:292 | MISSING | form.period |
| A7a.1 twelve-bar form | ABILITY-MAP.md:304 | form.twelve-bar | |
| A7a.1 shuffle left hand | ABILITY-MAP.md:304 | rhythm.shuffle | |
| A7a.1 boogie left hand | ABILITY-MAP.md:304 | texture.boogie-bass | |
| A7a.1 blue-note fragments | ABILITY-MAP.md:304 | melody.chord-relation | with scale.collection (blues scale) |
| A7a.1 a riff | ABILITY-MAP.md:314-315 | texture.ostinato | |
| A7a.1 riff octave-doubled in both hands (Morton bars 7-8) | ABILITY-MAP.md:314 | MISSING | the hands moving in octaves with each other: coordination.hand-interval |
| A7a.1 six bars of tremolo (Pinetop) | ABILITY-MAP.md:314 | mark.tremolo | with texture.tremolo-thirds |
| A7a.1 rootless voicings over whole-note roots | ABILITY-MAP.md:315 | harmony.voicing | |
| A7a.1 the riff's B-natural against the C7's B-flat | ABILITY-MAP.md:315-316 | melody.chord-relation | |
| A7a.1 three parts incl. drums; needs re-staffing | ABILITY-MAP.md:315 | integrity.extra-parts | which part is the riff and which the roots: texture.part-roles |
| A7a.1 RH held while LH moves | ABILITY-MAP.md:309 | coordination.sustain-vs-move | |
| A7a.2 blues turnaround I7-IV7-I7-V7 vs I-vi-ii-V | ABILITY-MAP.md:326 | form.turnaround | with harmony.progression |
| A7a.2 a two-bar intro and an ending tag | ABILITY-MAP.md:326, 333 | MISSING | proposed form.intro-ending |
| A7a.3 minor blues | ABILITY-MAP.md:345 | form.twelve-bar | with key.tonic-mode |
| A7a.3 quick IV in bar 2 | ABILITY-MAP.md:346 | form.twelve-bar | the row's gap names quick IV |
| A7b.1 iiø7-V7-i printed | ABILITY-MAP.md:369-370 | harmony.progression | with harmony.chord-quality |
| A7b.1 shells | ABILITY-MAP.md:369 | harmony.voicing | |
| A7b.1 a tritone-substituted setting is not the progression (Fly Me) | ABILITY-MAP.md:370 | harmony.applied | |
| A7b.2 chord tones on the beat; half-step approach notes | ABILITY-MAP.md:387 | melody.chord-relation | |
| A7b.2 the shortest full standard (20 bars, labelled A/B) | ABILITY-MAP.md:396 | form.sections | with form.length |
| A7b.2 a one-staff alto saxophone transcription | ABILITY-MAP.md:396 | MISSING | a transposing-instrument part may be written at sounding or at written pitch; proposed integrity.transposing-part |
| A7c.1 habanera and tresillo cells | ABILITY-MAP.md:410 | rhythm.habanera | with rhythm.tresillo |
| A7c.1 in 2/4 | ABILITY-MAP.md:410 | notation.times | |
| A7c.1 the cell in 56 of 66 bars, unbroken over 1-14; where it breaks | ABILITY-MAP.md:411, 418 | target.distribution | the longest unbroken run is not named in the row |
| A7c.1 in the left hand | ABILITY-MAP.md:411 | target.salience | |
| A7c.2 tumbao, montuno, clave side | ABILITY-MAP.md:428 | texture.tumbao | with texture.montuno, texture.clave |
| A7c.2 the tradition (Cuban, Brazilian, Argentine) | ABILITY-MAP.md:436 | style.genre-label | |
| A7c.3 a bossa left-hand pattern | ABILITY-MAP.md:451 | texture.bossa | |
| A7c.4 accented bass ostinato | ABILITY-MAP.md:474 | texture.ostinato | accents: mark.articulation |
| A7c.4 tango textures (marcato, 3-3-2, arrastre) | ABILITY-MAP.md:474 | texture.tango | |
| A7c.4 sustained drive under changing upper harmony | ABILITY-MAP.md:474 | harmony.rhythm | |
| A7d.1 oom-pah, octave reach then tenth | ABILITY-MAP.md:505 | texture.oom-pah | reach: technique.span |
| A7d.1 stride | ABILITY-MAP.md:510 | texture.stride | |
| A7d.1 syncopated right hand; secondary rag | ABILITY-MAP.md:505, 510 | rhythm.syncopation | with rhythm.secondary-rag |
| A7d.1 strains | ABILITY-MAP.md:511 | form.multi-strain | |
| A7d.1 the left hand's bass-to-chord jumps at tempo | ABILITY-MAP.md:505 | MISSING | the time-bounded jump rate: technique.displacement-rate |
| A7e.1 find the bass, riff, melody and rhythmic engine in a band score | ABILITY-MAP.md:528 | MISSING | proposed texture.part-roles |
| A7e.1 a multi-part source | ABILITY-MAP.md:528 | integrity.extra-parts | |
| A7f.1 articulation per voice | ABILITY-MAP.md:556, 564 | coordination.articulation-conflict | |
| A7f.1 voicing | ABILITY-MAP.md:556 | coordination.dynamic-balance | |
| A7f.1 half pedal | ABILITY-MAP.md:556 | MISSING | mark.pedal-kind; where unmarked, technique.pedal-implied |
| A7f.1 2:3 | ABILITY-MAP.md:556 | texture.polyrhythm | |
| A7f.2 an étude at its written tempo | ABILITY-MAP.md:572 | mark.tempo-text | with technique.velocity, meta.title |
| A7f.2 inside rung 8's band | ABILITY-MAP.md:578 | difficulty.level | |
| A7f.2 the skill the étude teaches | ABILITY-MAP.md:572 | target.prevalence | over the technique.* rows |
| A7g.1 lead-sheet hymn | ABILITY-MAP.md:601 | integrity.lead-sheet-shape | with notation.chord-symbols |
| A7g.1 a key chosen for the singer's range | ABILITY-MAP.md:595, 602 | MISSING | key.set-membership's "singable keys" is a key list; the melody's range and tessitura decide it; proposed melody.tessitura |
| A7g.1 the words to sing | ABILITY-MAP.md:595 | MISSING | proposed notation.lyrics |
| A7g.1 a singing tempo | ABILITY-MAP.md:595 | mark.tempo-text | |
| A7g.1 an intro from the last line | ABILITY-MAP.md:595 | form.phrase | |
| A7g.2 walk-up, passing chord, plagal close | ABILITY-MAP.md:614 | texture.bass-walk-up | with harmony.applied, harmony.cadence |
| A7g.2 a written bass walk (Just a Closer Walk) | ABILITY-MAP.md:620 | texture.bass-walk-up | |
| A8.1 a piece in two or in three | ABILITY-MAP.md:644 | metre.three-four | with metre.compound, notation.times |
| A8.1 a piece whose pulse can be clapped | ABILITY-MAP.md:644 | MISSING | proposed rhythm.beat-onset-share |
| A8.1 a short rhythm to echo | ABILITY-MAP.md:644 | rhythm.values | |
| A9.1 what each listed exercise trains | ABILITY-MAP.md:670 | target.prevalence | over the technique.* rows; meta.collection |
| A10.1 a chart on the standard | ABILITY-MAP.md:698 | notation.chord-symbols | |
| A10.1 form, landmarks, the bridge | ABILITY-MAP.md:692 | form.thirty-two-bar | with form.sections |
| A10.1 a minor-key tune | ABILITY-MAP.md:377 | key.tonic-mode | |
| A10.1 an intro and an ending | ABILITY-MAP.md:692 | MISSING | form.intro-ending |
| A10.1 a harmonised melody | ABILITY-MAP.md:692 | texture.melody-in-chords | |
| A10.2 a bare chart or a finished arrangement | ABILITY-MAP.md:711 | integrity.lead-sheet-shape | with notation.chord-symbols |
| A10.2 section map; Verse and Chorus labels | ABILITY-MAP.md:711; :235 | form.sections | |
| A10.2 textures by section; build and drop | ABILITY-MAP.md:711 | texture.build | the texture change between sections is not named in the row |

## Proposed new rows

Each row in the table's style. "Checked" means: imported in `.venv` (music21 10.5.0, partitura 1.9.0, scipy 1.17.1) on 2026-10-07, or found by web search with the licence named.

1. **coordination.hand-interval** — the vertical interval between the hands in a passage where both move together (unison, third, sixth, octave, tenth), and where it changes. Serves *exercises* (scales a third or sixth apart; riffs doubled at the octave) and *cope*. EXACT, DIRECT. From the note array per hand: partitura `compute_note_array` (checked).
2. **technique.arpeggio-chord** — the chord an arpeggio run outlines (major, minor, dominant 7th, diminished 7th), its inversion, and whether a dominant 7th resolves to the tonic. Serves *exercises*. EXACT, SOURCED_RULE (the run boundary is technique.arpeggio-run's rule); from: [technique.arpeggio-run]. music21 `chord.Chord.commonName` and `.inversion()` (checked: a G-B-D-F chord reads "dominant seventh chord"; E-G-C reads inversion 1).
3. **technique.displacement-rate** — the share of hand-position changes larger than an octave that happen within a short time (Sébastien: over 12 semitones within two beats; Chiu and Chen: weighted by distance). Serves *cope*. EXACT, SOURCED_RULE (thresholds quoted from the two papers); from: [hands.per-bar-range, technique.leap-size, mark.tempo-text]. partitura note array (checked); no library computes the ratio.
4. **technique.pedal-implied** — the item needs pedal where none is printed (a held bass the hand cannot keep under a moving chord, a broken chord wider than the span marked to sound together). Serves *cope*. INFERRED, SOURCED_RULE (a pedalling rule to quote; UNKNOWN when short); from: [mark.pedal, technique.span, texture.held-under-moving, coordination.sustain-vs-move]. partitura durations (checked); no library.
5. **mark.tempo-change** — rit., rall., accel., a tempo and printed tempo changes, with positions. Serves *cope*. EXACT, DIRECT. music21 `tempo.RitardandoSpanner`, `AccelerandoSpanner`, `TextExpression` (checked to exist); partitura reads the word "rit." as `DecreasingTempoDirection` (checked on a probe file).
6. **mark.expression-text** — printed words: expression terms (dolce, cantabile), text dynamics (cresc., dim.), ending cues (Tag, Fine as text). Serves *cope* (reading terms) and *exercises* (ending cues). EXACT, DIRECT for the text; the vocabulary classification is SOURCED_RULE. music21 `expressions.TextExpression` (checked: parsed from `<words>`); partitura `Words` (checked).
7. **mark.pedal-kind** — which pedal: sustain, una corda / tre corde, sostenuto, half pedal. Serves *cope*. EXACT, DIRECT. music21 `expressions.PedalMark`, `PedalType`, `PedalForm` (checked); una corda arrives as text (checked: music21 `TextExpression`; partitura `Words`, with a parse warning).
8. **mark.arpeggiate** — spread-chord marks, count and positions. Serves *cope*. EXACT, DIRECT. music21 `expressions.ArpeggioMark` (checked: parsed from `<arpeggiate/>`).
9. **reading.accidental-kinds** — accidentals by kind: naturals, double sharps and flats, courtesy accidentals. Serves *cope* (A1.1 naturals; Trinity Grade 8 double accidentals). EXACT, DIRECT. music21 `pitch.Accidental.name` and `.displayStatus` (checked: a double sharp reads "double-sharp").
10. **reading.pitch-entropy** — Shannon entropy of the pitch distribution per hand. Serves *cope*. EXACT, DIRECT (definition from RubricNet / Chiu and Chen). scipy `stats.entropy` over partitura's note array (checked).
11. **reading.redundancy** — Lempel-Ziv complexity of the pitch-set sequence per hand (how repetitive the item is). Serves *cope* (reading and memory load) and *material*. EXACT, DIRECT (RubricNet's definition). `lempel_ziv_complexity` 0.2.2, MIT (PyPI; not installed); the LZ76 count is also short to write.
12. **notation.clef-change** — clef changes within a staff, at bar lines or inside a bar. Serves *cope*. EXACT, DIRECT. music21 clef objects with offsets (checked: `clef.TrebleClef`, `clef.BassClef`).
13. **notation.lyrics** — whether the item carries words, and on which staff. Serves *material* (accompanying a singer, hymns). EXACT, DIRECT. music21 `note.Lyric` (checked: a `<lyric>` reads back).
14. **rhythm.tuplets-other** — tuplets other than triplets (duplets, quintuplets, sextuplets) and nesting. Serves *cope*. EXACT, DIRECT. music21 `duration.Tuplet` (checked to exist).
15. **rhythm.beat-onset-share** — the share of beats (and of downbeats) carrying an onset in some part: how audible the pulse is. Serves *material* (A8.1 clapping the pulse; A4.2 counting in). EXACT, DIRECT. partitura note array with music21 beat positions (checked).
16. **key.signature-exercised** — how many notes the key signature alters, per altered degree. Serves *exercises* (A1.2). EXACT, DIRECT. music21 `KeySignature.alteredPitches` (checked: one sharp gives F#).
17. **key.transposition-cost** — the accidentals and black keys a transposition of the item to a named key adds, and whether a five-finger position survives it. Serves *cope* and *exercises* (A2.1). EXACT, DIRECT. music21 `Stream.transpose` with KeySignature (music21 checked; this method not separately probed).
18. **melody.degree-profile** — the scale degree of each melody note relative to the tonic: start and end degree, the set of degrees used. Serves *exercises* (A3.1; RCM playback). INFERRED (depends on key.tonic-mode), DIRECT; from: [key.tonic-mode]. music21 `key.Key.getScaleDegreeFromPitch` (checked to exist).
19. **melody.tessitura** — the melody line's range and its weighted central range, against a stated voice range. Serves *material* (A7g.1). EXACT, SOURCED_RULE (the voice ranges to quote); from: [hands.per-bar-range]. music21 `analysis.discrete.Ambitus` (checked to exist).
20. **form.period** — a phrase pair forming a question and an answer (antecedent and consequent: the first ending on a weaker cadence, the second on a stronger one, sharing an opening). Serves *exercises* (A6.2 models; RCM answer phrase). INFERRED, SOURCED_RULE (a published definition of the period to quote); from: [form.phrase, harmony.cadence, melody.motif-repetition]. No library; music21 cadence-free.
21. **form.variations** — theme and variations: sections restating one theme. Serves *exercises*. INFERRED, SOURCED_RULE; from: [form.sections, melody.motif-repetition, meta.title]. No library.
22. **form.intro-ending** — bars before the form proper begins (intro), and after it (tag, coda, fine): their length and position. Serves *exercises* (A7a.2, A10.1, A4.2). INFERRED, SOURCED_RULE; from: [form.sections, mark.repeat, mark.expression-text, harmony.progression]. music21 `repeat.Coda`, `repeat.Fine`, `expressions.RehearsalMark` (checked to exist).
23. **texture.part-roles** — in a multi-part source, which part is the melody, the bass, a riff and the rhythmic engine. Serves *exercises* (A7e.1) and the re-staffing of PDMX items. INFERRED, CALIBRATED_MODEL; from: [integrity.extra-parts, hands.per-bar-range, texture.ostinato]. music21 `instrument.Instrument` per part (checked); partitura `estimate_voices` (checked to exist).
24. **integrity.transposing-part** — a part for a transposing instrument (alto saxophone, B-flat trumpet), and whether its notes are written or sounding pitch. Serves *cope* (a wrong-key item is taught wrong). EXACT, DIRECT. music21 `Instrument.transposition` (checked to exist); MusicXML `<transpose>`.
25. **difficulty.local-profile** — difficulty in a moving window per hand and for both hands, and its peak: where the hardest passage is. Serves *cope*. INFERRED, CALIBRATED_MODEL; from: [technique.velocity, technique.leap-size, technique.fingering-demand, technique.displacement-rate]. pianoplayer 3.0.2, MIT (PyPI; not installed); Nakamura's fingering HMM trained on the PIG dataset (registration required; licence not read).
26. **meta.published-grade** — whether the piece (by title and composer) is on a published graded list, at what grade, from which board. Serves *cope*: an outside anchor that is a lookup, not a model. EXTERNAL, DIRECT (after identity matching, which inherits integrity.metadata-trust). The ABRSM, RCM and Trinity syllabus PDFs read for this audit are public; PSyllabus metadata (Zenodo, research use only); CIPI (Zenodo, restricted, non-profit academic use on request).
27. **expression.character** — fast and agile versus lyrical and expressive (ABRSM's List A and B characters). Serves *material* (a balance of experiences). INFERRED, CALIBRATED_MODEL; from: [technique.velocity, mark.slur, mark.tempo-text, mark.articulation]. No library; ABRSM list membership through meta.published-grade could calibrate it.
28. **meta.familiarity** — the tune is widely known (Ode to Joy, Twinkle) so the learner can play it without the page. Serves *material* (A2.1). EXTERNAL, JUDGMENT unless a list is sourced. No dataset found or checked in this pass; the project's own verdict file (`docs/review/pdmx-quarry-2026-10-05/FAMILIAR-SONG-VERDICT.md`, present at HEAD) is the only witness.

**Widenings of existing rows, not new rows** (each was a line above): technique.scale-run reports run extent in octaves; scale.collection lists chromatic and whole-tone; key.change reports the new key's relation (dominant, relative); mark.ornament reports realisation (notes per ornament); texture.block-chords counts chord sizes per hand; reading.unusual-notation adds extended techniques; target.distribution reports the longest unbroken run; coordination.dynamic-balance exposes per-staff printed dynamics; difficulty.grade-calibration names Mikrokosmos-difficulty (GitHub, no licence file) and an error-rate oracle; mark.pedal's `w2` becomes music21 `PedalMark` and partitura `SustainPedalDirection`.

## Counts

| table | lines | covered | MISSING | n/a |
| --- | --- | --- | --- | --- |
| 1. syllabi | 105 | 78 | 24 | 3 |
| 2. research | 36 | 29 | 7 | 0 |
| 3. abilities | 99 | 82 | 17 | 0 |

Counted by script over the three tables (`build/iter1/count.py`, worktree-local); the same script checked that every covering row id and every row id named in a note is a row of `characteristics.yaml` or one of the 28 proposals.

"Covered" counts a line whose demand a row names, including the lines whose note says that row needs widening. A covering row is a definition in the table, not code: most covering rows are MISSING or PARTLY in their own status.

[abrsm]: https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20&%202026%20Prac%20syllabus%2020240524_access.pdf
[rcm]: https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/about%20us/rcm%20publishing/piano-syllabus-2022-edition.pdf
[tcl]: https://www.trinitycollege.com/resource?id=9079
[seb]: https://ismir2012.ismir.net/event/papers/571_ISMIR_2012.pdf
[rubric]: https://arxiv.org/html/2408.00473v1
[sr]: https://arxiv.org/pdf/2509.16913
[mk]: https://arxiv.org/pdf/2203.13010
[nak]: https://arxiv.org/pdf/1808.05006
[cipi]: https://arxiv.org/html/2306.08480v2
[psyl]: https://arxiv.org/html/2403.03947
