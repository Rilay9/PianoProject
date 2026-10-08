# Phase 1a draft: abilities from the ABRSM and Trinity College London piano syllabi (2026-10-08)

**What this is.** One source family's contribution to FABLE §2 phase 1a: the musical abilities the ABRSM and Trinity piano syllabi grade, from ABRSM's Prep Test and Initial Grade (Trinity: Initial) to Grade 8, each with the board's own wording as its source. An ability here is something the learner does at the piano or with music, written so that someone could tell whether a learner can do it. Where the two boards disagree on what a grade asks or on the order, both are kept in the "where the boards differ" column; nothing is averaged.

**Editions read.** ABRSM Piano Practical Grades **2027 & 2028** (valid 1 Jan 2027 to 31 Dec 2028, published 2026-06; its p.10 says the scales, sight-reading and aural requirements "stay the same as the preceding syllabus", so the 2025 & 2026 edition the completeness check read has the same technical, sight-reading and aural content; page numbers differ by about one). Trinity College London Piano syllabus "for graded exams from 2023", online edition February 2026, the face-to-face requirements (pp.69-131) as the primary text and the digital pathways (pp.19-68) as a second witness. ABRSM Practical Musicianship and ABRSM Music Theory Grades 1-5 are read because the ABRSM piano syllabus names Grade 5 in either as the prerequisite for Grades 6-8 (p.5). Page numbers are the printed page numbers (ABRSM) and the "n/131" page numbers (Trinity). Tables were read from the rendered pages (images), not only from extracted text, because the text extraction scrambles the table columns.

**Abbreviations.** AB = ABRSM Practical Grades; TCL = Trinity face-to-face graded exams; TCL-dig = Trinity digital; TCL-Acc = Trinity Piano Accompanying (Grades 5-8); Prep = ABRSM Prep Test; PG = ABRSM Performance Grades; PM = ABRSM Practical Musicianship; Th = ABRSM Music Theory; Init = Initial; HS/HT = hands separately/together; CM = contrary motion; c:NN = line NN of `docs/classifier/audits/iter1/completeness.md` (its syllabus table is lines 13-117). "near A…" in the existing-ability column means a related ability in `ABILITY-MAP.md` that does not match; only a bare id is a match.

**Validation done for every row.** Each ability was checked against the board's page itself (the page cited in its source cell), and its grade range was read from the grade pages, not inferred from the general rules. The quotes are verbatim and under 15 words. Nothing here has been checked by an independent pass (FABLE §3); this is a draft for that check.

## 1. Abilities

### 1.1 Pieces and performance

| draft id | ability (what the learner does) | level range | component | source | where the boards differ | existing | completeness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AT-001 | Play a prepared piece with correct notes and rhythm at a stable pulse and a suitable tempo | AB Prep, Init-8; TCL Init-8 | pieces | [AB p.53][a27] "Stable rhythm at a suitable tempo"; [TCL p.90][tcl] "The ability to perform fluently, with a stable pulse" | TCL marks "fluency & accuracy" as its own 7-mark component per piece; AB folds it into pitch and time | none | c:115, c:116 |
| AT-002 | Keep going through a piece and recover promptly from a slip without stopping | AB Init-8; TCL Init-8 | pieces | [AB p.59][a27] "Generally secure, prompt recovery from slips"; [TCL p.70][tcl] "Maintain a reasonable sense of continuity in performance" | AB names recovery in its Pass band; TCL names continuity | A4.1 | c:115 |
| AT-003 | Control tone: an even, projected sound across the dynamic range a piece asks for | AB Init-8; TCL Init-8 | pieces | [AB p.53][a27] "Reliable tonal control and awareness"; [TCL p.90][tcl] "The ability to control the instrument effectively" | TCL's "technical facility" covers all the technical demands of the music, wider than tone | none | c:116 |
| AT-004 | Realise the printed dynamics and articulation of a piece | AB Init-8; TCL Init-8 | pieces | [AB p.59][a27] "Clear musical shaping, well-realised detail"; [TCL p.70][tcl] "with attention given to dynamics and articulation" | none found | none (near A1.1) | c:116 |
| AT-005 | Shape phrases beyond the printed marks, interpreting a marked or unmarked score in a stylistic way | AB Init-8; TCL Init-8 | pieces | [AB p.11][a27] "encouraged to interpret the score in a musical and stylistic way" | TCL states a progression by level: "the beginning of thoughtful interpretation" (Init-3), "a degree of personal interpretation" (4-5), "some stylistic interpretation" (6-8) [TCL pp.70-71][tcl]; AB uses one criterion at all grades | none | c:116 |
| AT-006 | Convey the character, mood and style of a piece to a listener | AB Init-8; TCL Init-8 | pieces | [AB p.53][a27] "Communication of character and style"; [TCL p.90][tcl] "stylistic understanding and audience engagement" | none found | none | none |
| AT-007 | Follow the tempo words and tempo changes printed in a piece (allegro, rall., a tempo) | TCL Init-8; AB Init-8 | pieces | [TCL p.76][tcl] "All tempo and performance markings should be observed (eg allegro, rall., cresc.)" | AB: editorial metronome marks "do not need to be strictly observed" [AB p.11][a27]; TCL: metronome marks "given as a guide" | none (near A1.1) | c:79 |
| AT-008 | Play fast-moving music with finger agility | AB Init-8 (List A); TCL 6-8 (Group A) | pieces | [AB p.11][a27] "List A pieces are generally faster moving and require technical agility"; [TCL p.76][tcl] "Group A pieces focus on technique -- for example finger dexterity" | AB requires a List A piece at every grade; TCL has no groups before Grade 6 (three pieces from one list) | none | c:81 |
| AT-009 | Play lyrical music expressively, with tonal colour and nuance | AB Init-8 (List B); TCL 6-8 (Group B) | pieces | [AB p.11][a27] "List B pieces are more lyrical and invite expressive playing"; [TCL p.77][tcl] "Tonal nuance and balance become significant features" | as AT-008 | none | c:82 |
| AT-010 | Play pieces from different traditions and styles, adapting the playing to each | AB Init-8 (List C); TCL Init-8; TCL-dig Init-8 | pieces | [AB p.11][a27] "List C pieces reflect a wide variety of musical traditions, styles and characters"; [TCL-dig p.55][tcl] "Ability to work within, move between, or maintain styles" | AB sets one list for it; TCL asks it of the whole programme | none | c:83 |
| AT-011 | Keep the hands independent, including two contrapuntal lines | TCL 6-8 (Group A); TCL Init-8 (exercise group 2, see AT-064) | pieces | [TCL p.76][tcl] "hand coordination and independence (including elements of counterpoint)" | AB names no list or criterion for hand independence | none | none |
| AT-012 | Balance a melody against its accompaniment, in one hand or between the hands (voicing) | TCL 6-8 (Group B); TCL Init-8 (exercise group 1, see AT-063) | pieces | [TCL p.77][tcl] "Tonal nuance and balance become significant features" | AB: not named apart from "Sensitive use of tonal qualities" in the Distinction band [AB p.59][a27] | A7f.1 | c:97 |
| AT-013 | Use and control the sustaining pedal for tone and shape, adapting or omitting printed pedalling where better | AB Init-8; TCL (pieces: no rule stated) | pieces | [AB p.12][a27] "Examiners will take into account the use and control of pedalling" | AB: pieces "heavily reliant on pedalling" are to be avoided if it cannot be managed; in a duet the secondo pedals. TCL states no pedalling rule for pieces (only in sight reading, AT-116, AT-117) | none (near A7f.1) | c:73, c:76 |
| AT-014 | Realise or add ornaments in a style-appropriate way | TCL Init-8, stressed 6-8; AB Init-8 | pieces | [TCL p.76][tcl] "encouraged to use appropriate ornamentation, particularly at Grades 6-8" | AB: printed ornament realisations "do not need to be strictly observed" [AB p.11][a27] | none | c:79 |
| AT-015 | Navigate a piece's repeat structure: follow D.C. and D.S., play short repeats, leave out long ones | AB Init-8; TCL Init-8 | pieces | [AB p.12][a27] "all da capo and dal segno indications must be followed"; [TCL p.76][tcl] "All da capo and dal segno instructions should be observed" | AB: other repeats only "if very short (i.e. a few bars)"; TCL: "repeats of a few bars" observed, longer ones not | A1.1 | c:78 |
| AT-016 | Adapt a passage beyond the hand's reach (spread a chord or leave out a note) so the result stays musical | AB Init-8 | pieces | [AB p.12][a27] "adapt the music by 'spreading' chords or omitting notes at wide stretches" | TCL: not stated | none | c:77 |
| AT-017 | Play one part of a piano duet with a partner, starting, staying and ending together | AB Prep, Init-3; TCL Init-3 | pieces | [AB p.11][a27] "At Initial Grade to Grade 3, candidates may perform a duet"; [TCL p.77][tcl] "Candidates should play the upper part (unless stated otherwise" | AB: primo or secondo as listed, live partner only, secondo pedals; TCL: the upper part, live or pre-recorded partner, the duet played first | A4.2 | c:80 |
| AT-018 | Perform a piece from memory | AB Init-8 (optional); TCL Init-8 (optional) | pieces | [AB p.12][a27] "Candidates may perform any of their pieces from memory"; [TCL p.76][tcl] "Candidates may perform any or all of their pieces from memory" | both give no marks for it | none (near A10.1) | none |
| AT-019 | Work out a fingering that gives a successful result for a passage or a scale | AB Init-8; TCL Init-8 | pieces / technical | [AB p.13][a27] "any fingering that produces a successful musical outcome"; [TCL p.79][tcl] "any logical and effective fingering pattern giving a smooth legato is acceptable" | none found | none | c:79 |
| AT-020 | Present a sustained programme: contrast the pieces, order and pace them, keep focus from first to last | PG Init-8; TCL-dig Init-8 | pieces (programme) | [PG p.13][pg] "the way pieces/songs are contrasted, the order in which they are presented"; [TCL-dig p.55][tcl] "Consistency of focus." | AB Practical Grades mark no programme; AB Performance Grades give 30 marks to "the performance as a whole"; TCL-dig gives 20 marks to overall performance; TCL face-to-face gives none | none (near A4.1) | none |
| AT-021 | Play with technical control across the whole keyboard compass | TCL 6-8; AB 6-8 (four-octave requirements, AT-037) | technical | [TCL p.71][tcl] "Demonstrate technical control across the full compass of the instrument" | AB states it only through the four-octave ranges | none | c:114 |

### 1.2 Own composition (Trinity only)

| draft id | ability (what the learner does) | level range | component | source | where the boards differ | existing | completeness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AT-022 | Compose and perform a piece of one's own, of the grade's length and comparable in demand to its listed pieces | TCL Init-8 (optional, replaces one piece) | other (composition) | [TCL p.78][tcl] "Own compositions must be comparable in technical and musical demand" | AB Practical Grades have no composition. Durations: Init 0.5-1 min, G1 about 1, G2 1-1.5, G3 1.5-2, G4-5 2-3, G6-7 3-4, G8 3.5-5 [TCL pp.97-121][tcl] | none (near A6.1) | c:113 |
| AT-023 | Write down one's own composition so that it can be performed from the page | TCL Init-5 (any readable form); TCL 6-8 (staff notation, complete and accurate) | other (composition) | [TCL p.78][tcl] "At Grades 6-8 they must be notated on a stave." | Init-5 accept "graphic score or lead-sheet" | A6.2 | none |
| AT-024 | Compose a clear melodic line with varied rhythmic values over a planned range | TCL Init (clear line, varied values), G3 (range of an octave or more), G6 (extensive range), G8 (wide range) | other (composition) | [TCL p.97][tcl] "Clear melodic line"; [TCL p.106][tcl] "Melodic range of one octave or more" | Trinity only | none | c:104, c:108 |
| AT-025 | Use expressive devices in one's own composition: dynamic contrast, articulations, tempo changes | TCL G1 (dynamic contrast), G2 (different articulations), G4 (tempo changes, variety of articulations), G8 (wide range of expressive techniques) | other (composition) | [TCL p.100][tcl] "Dynamic contrast"; [TCL p.109][tcl] "Tempo changes" | Trinity only | none | c:105 |
| AT-026 | Ornament the melody of one's own composition | TCL G2 (simple), G6 (more advanced) | other (composition) | [TCL p.103][tcl] "Simple melodic ornamentation" | Trinity only | none | c:106 |
| AT-027 | Give one's own composition a form: clear sections, variations, a free form | TCL G3 (ABA), G6 (theme and variations), G8 (creative use of form) | other (composition) | [TCL p.106][tcl] "Form showing clear sections, eg ABA" | Trinity only | none | c:107, c:110 |
| AT-028 | Use rhythmic, harmonic and colouristic devices in one's own composition | TCL G1 (simple syncopation), G5 (chromaticism, semiquaver passages), G7 (modulation, irregular time signatures), G8 (extended techniques, rhythmic variation) | other (composition) | [TCL p.118][tcl] "Use of irregular time signatures"; [TCL p.121][tcl] "Extended techniques, wide range, chromaticism and rhythmic variation" | Trinity only | none | c:109, c:111, c:112 |

### 1.3 Technical work

| draft id | ability (what the learner does) | level range | component | source | where the boards differ | existing | completeness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AT-029 | Recall and play any requested scale or arpeggio from memory, given only its key, hand(s) and articulation | AB Init-8; TCL Init-8 | technical | [AB p.12][a27] "All requirements must be played from memory."; [TCL p.79][tcl] "All scales and arpeggios must be performed from memory." | AB and TCL face-to-face: the examiner picks items; TCL-dig: the candidate plays one whole set (A or B) with fixed dynamics and articulations [TCL-dig p.27][tcl] | none | c:117 |
| AT-030 | Play scales and arpeggios in even notes at a steady pulse at the grade's speed | AB Init-8; TCL Init-8 | technical | [AB p.12][a27] "All requirements must be played in even notes."; [TCL p.79][tcl] "Rhythmic patterns are all even quavers in pairs or fours" | AB speeds are "a general guide" (scales crotchet 54 at Init to 100 at G4, then minim 60 at G5 to 88 at G8; arpeggios crotchet 52 to 80, then minim 44 to 66; groups of four quavers) [AB p.14][a27]; TCL speeds are minimums (scales crotchet 60 at Init rising by 10 a grade to 140 at G8; arpeggios 60 at G2 to 120 at G8; broken chords dotted crotchet 50 at G1) [TCL pp.97-122][tcl]. TCL Grade 1 broken chords are triplets | none | c:29, c:40 |
| AT-031 | Play scales and arpeggios legato with the fingers alone, without pedal | AB Init-8; TCL Init-8 | technical | [AB p.13][a27] "All requirements must be played without pedalling." | TCL states legato ("a smooth legato") but no pedal rule | none | c:41 |
| AT-032 | Play a major scale hands separately over one octave | AB Init (C); TCL Init (C), G1 (F, G) | technical | [AB p.20][a27] "C major ... 1 oct. hands separately"; [TCL p.100][tcl] "F and G major ... one octave ... hands separately" | AB moves to two octaves HS at G1; TCL stays at one octave HS to G1 | none | c:13 |
| AT-033 | Play a minor scale hands separately in a form the player chooses (natural, harmonic or melodic) | AB Init (D), G1 (A, D), G2 (A, D, E, G); TCL Init (A), G1 (D, E) | technical | [AB p.20][a27] "natural or harmonic or melodic, at candidate's choice"; [TCL p.97][tcl] "candidate choice of either harmonic or melodic or natural" | the natural form is offered up to AB G2 and TCL G1 only | none | c:22 |
| AT-034 | Play scales hands separately over two octaves | AB G1-4 (keys added each grade) | technical | [AB p.23][a27] "G, F majors ... 2 oct. hands separately" | TCL has no two-octave HS scale: it goes from one octave HS (G1) to two octaves HT (G2) | none | c:21 |
| AT-035 | Play a scale hands together in similar motion, one octave apart, over one octave | AB G1 (C major) | technical | [AB p.12][a27] "the hands must be one octave apart, unless the syllabus specifies differently" | TCL has no one-octave similar-motion HT scale; its first HT scales are contrary motion (G1) | none | c:13, c:14 |
| AT-036 | Play scales hands together in similar motion over two octaves | AB G2-5; TCL G2-5 | technical | [AB p.26][a27] "2 oct. hands together"; [TCL p.79][tcl] "with the right hand playing one octave above the left hand" | keys differ by grade (e.g. AB G3 D, A, E, G; TCL G3 E-flat, A, C, F-sharp) | none | c:14, c:21 |
| AT-037 | Play scales hands together in similar motion over four octaves | AB G6-8; TCL G6-8 | technical | [AB p.38][a27] "4 oct. legato or staccato, at examiner's choice; hands together"; [TCL p.115][tcl] "four octaves ... hands together" | none in range; keys differ | none | c:21, c:114 |
| AT-038 | Play a harmonic minor scale (raised seventh in both directions) | AB Init-8 (offered from Init, required with melodic from G3); TCL Init-8 | technical | [AB p.29][a27] "(harmonic or melodic, at candidate's choice)" | see AT-040 for when both forms are required | none | c:22 |
| AT-039 | Play a melodic minor scale (raised sixth and seventh ascending, lowered descending) | AB Init-8 (as AT-038); TCL Init-8 | technical | [AB p.29][a27] "(harmonic or melodic, at candidate's choice)" | as AT-038 | none | c:22 |
| AT-040 | Play either minor form on request | AB G6-8; TCL G6-8 | technical | [AB p.38][a27] "D, F, G♯, B minors (harmonic and melodic)"; [TCL p.115][tcl] "(harmonic and melodic minor)" | AB G3-5 and TCL G2-5: candidate's choice of one form | none | c:22 |
| AT-041 | Play scales staccato | AB G5 (staccato scales HS), G6-8 (legato or staccato, examiner's choice); TCL G4-8 (legato or staccato) | technical | [AB p.35][a27] "STACCATO SCALES ... staccato; hands separately"; [TCL p.109][tcl] "legato or staccato" | TCL begins a grade earlier and HT; AB begins HS | none | c:25 |
| AT-042 | Play a scale or arpeggio at a requested dynamic (f, mf or p) | TCL Init-G1 (mf), G2-5 (f or p), G6 (f, mf or p), G7-8 (f, mf, p or p-f-p) | technical | [TCL p.103][tcl] "f or p"; [TCL-dig p.39][tcl] "f staccato" | AB sets no dynamic; its marking asks for "Musically shaped" scales [AB p.60][a27] | none | none |
| AT-043 | Shape a scale or arpeggio with a crescendo and diminuendo (p-f-p) | TCL G7-8 | technical | [TCL p.118][tcl] "crescendo/ diminuendo (p-f-p)" | AB: not required | none | c:28 |
| AT-044 | Play a major scale in contrary motion from a unison tonic | AB Init (C, a fifth), G1 (C, 1 oct), G2 (C, 2 oct), G3 (E), G4 (E-flat), G5 (D-flat), G6-8 (four majors each, 2 oct); TCL G1 (C, 1 oct), G2 (C, 2 oct), G3 (E-flat), G4 (E) | technical | [AB p.20][a27] "hands starting on the tonic (unison); as pattern below"; [TCL p.100][tcl] "C major contrary motion scale" | AB starts at Init with a five-note pattern; TCL at G1; AB G7-8 add staccato | none | c:15, c:18 |
| AT-045 | Play a harmonic minor scale in contrary motion | AB G4 (C), G5 (C-sharp), G6-8 (four each); TCL G5 (G) | technical | [AB p.32][a27] "C harmonic minor"; [TCL p.112][tcl] "G harmonic minor contrary motion scale" | AB begins a grade earlier and continues to G8; TCL asks it at G5 only | none | c:18 |
| AT-046 | Play a chromatic scale hands separately | AB G2 (from D, 1 oct) | technical | [AB p.26][a27] "CHROMATIC SCALE starting on D ... 1 oct. hands separately" | TCL never asks it HS; its first chromatic scale is HT in contrary motion (G1) | none | c:23 |
| AT-047 | Play a chromatic scale hands together in similar motion, an octave apart | AB G4 (F-sharp, 2 oct), G6 (G-sharp, B, 4 oct); TCL G2 (B-flat), G3 (F-sharp), G4 (B), G5 (D-flat) at 2 oct, G6 (B-flat, D) and G8 (F-sharp, E-flat, B) at 4 oct | technical | [AB p.32][a27] "CHROMATIC SCALE (SIMILAR MOTION) starting on F♯"; [TCL p.103][tcl] "Chromatic scale in similar motion starting on B♭" | TCL begins two grades earlier | none | c:23 |
| AT-048 | Play a chromatic scale in contrary motion from a unison note | AB G3 (from D, 1 oct); TCL G1 (from D, 1 oct), G4 (from A-flat, 1 oct), G6 (from E-flat, 2 oct) | technical | [AB p.29][a27] "hands starting on the stated note (unison)"; [TCL p.100][tcl] "Chromatic scale in contrary motion starting on D" | TCL asks it at G1, AB at G3 | none | c:19 |
| AT-049 | Play a chromatic scale with the hands starting a third or a sixth apart | AB G5 (contrary, major third: F-sharp/A-sharp), G7 (contrary, minor third: C-sharp/E), G8 (similar, major sixth: E-flat/C); TCL G5 (contrary, C/E), G7 (similar, minor third: C/E-flat) | technical | [AB p.35][a27] "legato; hands starting a major third apart"; [TCL p.118][tcl] "Chromatic scale in similar motion a minor third apart" | AB's major sixth apart (G8) has no TCL counterpart; TCL's similar motion a minor third apart (G7) has no AB counterpart | none | c:16, c:17, c:19 |
| AT-050 | Play diatonic scales with the hands a third apart, then a sixth apart (similar motion) | AB G7 (a third apart), G8 (a sixth apart) | technical | [AB p.41][a27] "SCALES A THIRD APART"; [AB p.44][a27] "SCALES A SIXTH APART" | TCL: not required. AB: thirds start with the tonic "as the lower note", sixths "as the upper note" [AB p.13][a27] | none | c:16 |
| AT-051 | Play a legato scale in double thirds with one hand | AB G7 (G major), G8 (E-flat major), 2 oct HS; TCL G6 (C major, 1 oct), G7 (E major), G8 (B major, C harmonic minor), 2 oct HS | technical | [AB p.41][a27] "LEGATO SCALE IN THIRDS"; [TCL p.115][tcl] "C major scale in 3rds" | TCL begins a grade earlier and adds a minor key at G8 | none | c:26 |
| AT-052 | Play a staccato scale in double thirds, or in double sixths, with one hand | AB G7 (thirds, G major), G8 (sixths, C major) | technical | [AB p.41][a27] "STACCATO SCALE IN THIRDS"; [AB p.44][a27] "STACCATO SCALE IN SIXTHS" | TCL: not required | none | c:26 |
| AT-053 | Play a whole-tone scale | AB G8 (from E-flat, C; 4 oct HT) | technical | [AB p.44][a27] "WHOLE-TONE SCALES (SIMILAR MOTION)" | TCL: not required | none | c:24 |
| AT-054 | Play a tonic triad broken within a five-finger span, hands separately | AB Init (C major, D minor, "a 5th"); TCL Init (C major, A minor, 3/4 pattern) | technical | [AB p.20][a27] "ARPEGGIOS ... a 5th ... hands separately; as pattern below"; [TCL p.97][tcl] "Broken triads in C major and A minor" | AB calls it an arpeggio, TCL a broken triad; the patterns differ | none | c:31, c:39 |
| AT-055 | Play broken chords in a triplet pattern over one octave, hands separately | TCL G1 (F, G major; D, E minor) | technical | [TCL p.79][tcl] "except for Grade 1, which requires triplet broken chords" | AB: no broken chords at any grade | none | c:30 |
| AT-056 | Play an arpeggio in root position hands separately | AB G1 (1 oct), G2-4 (2 oct); TCL G2-4 (2 oct) | technical | [AB p.23][a27] "ARPEGGIOS ... 1 oct. hands separately"; [TCL p.104][tcl] "two octaves ... hands separately" | AB starts at G1 | none | c:35 |
| AT-057 | Play an arpeggio in root position hands together | AB G3-5 (2 oct), G6 (4 oct); TCL G5 (2 oct), G6-8 (4 oct) | technical | [AB p.29][a27] "D, A majors ... 2 oct. hands together"; [TCL p.113][tcl] "two octaves ... hands together" | AB begins two grades earlier; AB G7-8 ask inversions instead of root position (AT-059) | none | c:35 |
| AT-058 | Play an arpeggio staccato | TCL G5-8 (legato or staccato) | technical | [TCL p.113][tcl] "legato or staccato" | AB: arpeggios legato only | none | none |
| AT-059 | Play an arpeggio in first inversion, then in second inversion | AB G7 (first inversion only), G8 (second inversion only) | technical | [AB p.41][a27] "first inversion only"; [AB p.44][a27] "second inversion only" | TCL: not required | none | c:36 |
| AT-060 | Play a dominant-seventh arpeggio and resolve it to the tonic | AB G6-8; TCL G6-8 (4 oct HT) | technical | [AB p.13][a27] "All dominant sevenths must finish by resolving on the tonic." | TCL does not state the resolution; keys differ | none | c:35, c:37 |
| AT-061 | Play a diminished-seventh arpeggio | AB G5 (from B, 2 oct HS), G6-8 (4 oct HT); TCL G5 (from B, 2 oct HT), G6-8 (4 oct HT) | technical | [AB p.35][a27] "DIMINISHED SEVENTH starting on B"; [TCL p.113][tcl] "Diminished 7th starting on B" | AB G5 HS, TCL G5 HT | none | c:35 |
| AT-062 | Play an arpeggio in contrary motion | TCL G7 (E major), G8 (E-flat major, F-sharp minor), 2 oct legato | technical | [TCL p.119][tcl] "E major contrary motion" | AB: no contrary-motion arpeggios | none | none |
| AT-063 | Play a short study for tone, balance and voicing | TCL Init-8 (exercise group 1) | technical | [TCL p.79][tcl] "Tone, balance and voicing" | AB: no exercises | none (near A9.1, A7f.1) | c:97 |
| AT-064 | Play a short study for hand coordination | TCL Init-8 (exercise group 2) | technical | [TCL p.79][tcl] "Coordination" | AB: no exercises | none (near A9.1) | c:98 |
| AT-065 | Play a short study for finger and wrist strength and flexibility | TCL Init-8 (exercise group 3) | technical | [TCL p.79][tcl] "Finger & wrist strength and flexibility" | AB: no exercises | none (near A9.1) | c:99 |
| AT-066 | Play set accompaniment extracts chosen on the day from a prepared set | TCL-Acc G5-8 | technical | [TCL p.124][tcl] "Examiners choose three extracts to be performed in the exam." | AB: no accompanying exam | none | none |

### 1.4 Sight-reading

All AB rows: [AB pp.15-16][a27]; all TCL rows: [TCL pp.80-81][tcl]. Both tables are cumulative ("once introduced they apply for all later grades").

| draft id | ability (what the learner does) | level range | component | source | where the boards differ | existing | completeness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AT-067 | Sight-read a short unseen piece after a half-minute look and try-out, keeping continuity and pulse | AB Init-8; TCL Init-8 | sight-reading | [AB p.15][a27] "They will be given half a minute to look through"; [TCL p.80][tcl] "a level approximately two grades lower than the exam being taken" | AB lengths: 4 bars (Init, 4/4), 6 (Init, 2/4), up to 8 (G3), c.8 (G4), c.8-12 (G5), c.12-16 (G6), c.16-20 (G7), c.1 page (G8); TCL sets the level two grades below. TCL makes it optional at Init-5 (two of four supporting tests) and compulsory at 6-8 | none (near A1.2) | c:42 |
| AT-068 | Sight-read with each hand separately in a five-finger position, first tonic to dominant, then any | AB Init (tonic to dominant), G1 (any five-finger position) | sight-reading | [AB p.16][a27] "in 5-finger position (tonic to dominant)" | TCL does not specify hand position | none | c:39, c:48 |
| AT-069 | Sight-read with the hands playing together | AB G2 | sight-reading | [AB p.16][a27] "playing together" | TCL does not specify | none | c:49 |
| AT-070 | Sight-read music that moves outside a five-finger position | AB G3 | sight-reading | [AB p.16][a27] "outside 5-finger position" | TCL does not specify | none | c:48 |
| AT-071 | Sight-read in 2/4 and 4/4 | AB Init (both); TCL Init (2/4), G1 (4/4) | sight-reading | [AB p.16][a27] "4/4 ... 2/4" | TCL adds 4/4 a grade later | none | c:43 |
| AT-072 | Sight-read in 3/4 | AB G1; TCL G2 | sight-reading | [AB p.16][a27] "3/4" | TCL a grade later | A1.2 | c:43 |
| AT-073 | Sight-read in 3/8 | AB G3 | sight-reading | [AB p.16][a27] "3/8" | TCL: not listed | none | c:43 |
| AT-074 | Sight-read in compound time (6/8, 9/8, 12/8) | AB G4 (6/8), G6 (9/8), G8 (12/8); TCL G5 (6/8), G7 (9/8) | sight-reading | [AB p.16][a27] "6/8"; [TCL p.81][tcl] "6/8" | TCL a grade later; TCL lists no 12/8 | none | c:43 |
| AT-075 | Sight-read in irregular metres (5/8, 5/4, 7/8, 7/4) | AB G6 (5/8, 5/4), G7 (7/8, 7/4) | sight-reading | [AB p.16][a27] "5/8 5/4" | TCL: none in sight reading (5/4 appears in improvisation at G8) | none | c:43 |
| AT-076 | Sight-read in 2/2 | TCL G8 | sight-reading | [TCL p.81][tcl] "2/2" | AB: not listed | none | c:43 |
| AT-077 | Sight-read through changes of time signature | TCL G8 | sight-reading | [TCL p.81][tcl] "and changing time signatures" | AB: not listed | none | c:44 |
| AT-078 | Sight-read in a key with no sharps or flats (C major, A minor) | AB Init (C major); TCL Init (C major), G1 (A minor, white notes only) | sight-reading | [TCL p.81][tcl] "A minor (white notes only)" | AB has no A minor until G1 (with its G-sharp, AT-084) | none | c:45, c:46 |
| AT-079 | Sight-read in a key with one sharp or one flat | AB Init (D minor), G1 (G, F major); TCL G1 (G major), G3 (D minor), G5 (F major) | sight-reading | [AB p.16][a27] "C major D minor"; [TCL p.81][tcl] "G major" | AB gives D minor at Init; TCL reaches F major only at G5 | A1.2 | c:45 |
| AT-080 | Sight-read in a key with two sharps or flats | AB G2 (D major; E, G minor), G3 (B-flat major; B minor); TCL G4 (D major, E minor), G5 (B-flat major; B, G minor) | sight-reading | [AB p.16][a27] "D major E, G minors" | TCL two grades later | none | c:45 |
| AT-081 | Sight-read in a key with three sharps or flats | AB G3 (A, E-flat major), G5 (F-sharp, C minor); TCL G5 (E-flat, A major), G6 (F-sharp, C minor) | sight-reading | [AB p.16][a27] "A, B♭, E♭ majors"; [TCL p.81][tcl] "F♯ and C minor" | TCL's majors two grades later; minors one grade later | none | c:45 |
| AT-082 | Sight-read in a key with four sharps or flats | AB G5 (E, A-flat major), G6 (C-sharp, F minor); TCL G7 (E, A-flat major) | sight-reading | [AB p.16][a27] "E, A♭ majors"; [TCL p.81][tcl] "E and A♭ major" | TCL two grades later; no four-accidental minor listed by TCL | none | c:45 |
| AT-083 | Sight-read in a key with five sharps or flats | AB G8 (B, D-flat major); TCL G8 (B, D-flat major; G-sharp, B-flat minor) | sight-reading | [AB p.16][a27] "B, D♭ majors"; [TCL p.81][tcl] "G♯ and B♭ minor" | TCL adds two minors | none | c:45 |
| AT-084 | Read the raised notes of a minor key written as accidentals | AB G1; TCL G2 | sight-reading | [AB p.16][a27] "occasional accidentals (within minor keys only)"; [TCL p.81][tcl] "A minor (including G♯)" | TCL a grade later | none | c:46, c:56 |
| AT-085 | Read chromatic notes outside the key | AB G4 | sight-reading | [AB p.16][a27] "chromatic notes" | TCL: not listed apart from modulation (AT-087) and double accidentals (AT-086) | none | c:56 |
| AT-086 | Read double sharps and double flats | TCL G8; Th G4 | sight-reading | [TCL p.81][tcl] "(incl. double sharps and flats)" | AB sight-reading: not listed | none | c:57 |
| AT-087 | Keep reading through a modulation | TCL G5 (majors to the dominant; minors to the dominant or relative major), G6 (majors also to the relative minor), G7 (any related key) | sight-reading | [TCL p.81][tcl] "(modulations to any related key)" | AB sight-reading: not listed | none | c:47 |
| AT-088 | Read crotchets, minims, quavers, semibreves and their rests | AB Init (minim, crotchet, quaver pair, crotchet rest), G1 (minim rest), G2 (semibreve), G3 (quaver rest); TCL Init (crotchet, minim and rest), G1 (semibreve), G3 (quaver, crotchet rest), G4 (quaver rest) | sight-reading | [TCL p.81][tcl] "Note and rest values" (column; values by grade) | orders differ: AB has quavers at Init, TCL at G3 | none | c:50 |
| AT-089 | Read dotted rhythms (dotted minim, dotted crotchet-quaver, dotted quaver-semiquaver) | AB G1 (dotted minim), G2 (dotted crotchet-quaver); TCL G2 (dotted minim), G4 (dotted crotchet), G5 (dotted quaver) | sight-reading | [AB p.16][a27] "♩. ♪ patterns" | TCL one to two grades later | none | c:50 |
| AT-090 | Read tied notes | AB G2; TCL G2 | sight-reading | [AB p.16][a27] "tied notes"; [TCL p.81][tcl] "and ties" | agree | none | c:51 |
| AT-091 | Read simple semiquaver patterns | AB G3; TCL G5 | sight-reading | [AB p.16][a27] "simple semiquaver patterns" | TCL two grades later | none | c:50 |
| AT-092 | Read triplets | AB G6; TCL G8; Th G2 | sight-reading | [AB p.16][a27] "triplet rhythms"; [TCL p.81][tcl] "duplets and triplets" | TCL two grades later | none | c:52 |
| AT-093 | Read duplets and other irregular divisions | TCL G8; Th G4 (duplets), G5 (irregular divisions) | sight-reading | [TCL p.81][tcl] "duplets and triplets" | AB sight-reading: not listed | none | c:53 |
| AT-094 | Read simple syncopation | AB G5 | sight-reading | [AB p.16][a27] "simple syncopation" | TCL sight reading: not listed (it is in TCL composition G1 and motivic improvisation G4) | none | c:54 |
| AT-095 | Start a piece from an anacrusis | AB G4 | sight-reading | [AB p.16][a27] "anacrusis" | TCL: not listed | none | c:55 |
| AT-096 | Play f and p as marked at sight | AB Init; TCL Init | sight-reading | [AB p.16][a27] "f and p" | agree | none | c:60 |
| AT-097 | Play mf and mp as marked at sight | AB G1; TCL G1 (mf), G3 (mp) | sight-reading | [AB p.16][a27] "mf and mp" | TCL splits them | none | c:60 |
| AT-098 | Play pp and ff as marked at sight | AB G2 (pp), G5 (ff); TCL G8 (both) | sight-reading | [TCL p.81][tcl] "ff and pp" | TCL much later | none | c:60 |
| AT-099 | Shape crescendo and diminuendo hairpins at sight | AB G1; TCL G4 | sight-reading | [AB p.16][a27] "cresc. and dim. hairpins" | TCL three grades later | none | c:61 |
| AT-100 | Shape cresc. and dim. written as words at sight | TCL G8 | sight-reading | [TCL p.81][tcl] "dim. and cresc. (as text)" | AB lists hairpins only | none | c:62 |
| AT-101 | Play different dynamics in the two hands at sight | TCL G8 | sight-reading | [TCL p.81][tcl] "different dynamics for RH and LH" | AB: not listed | none | c:63 |
| AT-102 | Shape legato phrases and slurs at sight | AB Init (legato phrases), G1 (slurs); TCL Init (simple phrasing), G3 (slurs) | sight-reading | [AB p.16][a27] "legato phrases, staccato"; [TCL p.81][tcl] "simple phrasing" | TCL slurs two grades later | none | c:58 |
| AT-103 | Play staccato at sight | AB Init; TCL G4 | sight-reading | [TCL p.81][tcl] "staccato, accents" | TCL four grades later | none | c:59 |
| AT-104 | Play accents at sight | AB G1; TCL G4 | sight-reading | [AB p.16][a27] "slurs, accents" | TCL three grades later | none | c:59 |
| AT-105 | Play tenuto at sight | AB G4; TCL G8 | sight-reading | [AB p.16][a27] "tenuto"; [TCL p.81][tcl] "tenuto" | TCL four grades later | none | c:59 |
| AT-106 | Observe pause signs at sight | AB G4; TCL G5 | sight-reading | [AB p.16][a27] "pause signs" | TCL a grade later | none | c:64 |
| AT-107 | Take the tempo from an Italian tempo word, and follow common Italian terms, at sight | TCL Init (moderato), G2 (allegretto), G3 (andante), G7 (any common terms), G8 (change in terms) | sight-reading | [TCL p.81][tcl] "any common terms" | AB names tempo changes but no tempo words | none | c:66, c:67 |
| AT-108 | Slow down where marked and return to tempo (rit., rall., a tempo; slowing at the end) | AB G5 (slowing at end), G7 (tempo changes); TCL G5 (rit., rall., a tempo) | sight-reading | [AB p.16][a27] "slowing of tempo at end"; [TCL p.81][tcl] "rit., rall., a tempo" | AB splits it over two grades | none | c:65 |
| AT-109 | Speed up where marked (accel.) at sight | AB G8; TCL G5 | sight-reading | [AB p.16][a27] "acceleration of tempo"; [TCL p.81][tcl] "accel." | TCL three grades earlier | none | c:65 |
| AT-110 | Play two-note chords in either hand at sight | AB G3 | sight-reading | [AB p.16][a27] "2-note chords in either hand" | TCL: chords not listed | none | c:68 |
| AT-111 | Play fuller chords at sight: four parts shared between the hands, then three notes in one hand | AB G5 (4-part, 2 notes max. a hand), G8 (3-part in either hand) | sight-reading | [AB p.16][a27] "4-part chords (2 notes max. in either hand)" | TCL: not listed | none | c:68 |
| AT-112 | Spread a chord marked as spread at sight | AB G8 | sight-reading | [AB p.16][a27] "spread chords" | TCL: not listed | none | c:69 |
| AT-113 | Play simple ornaments at sight | AB G8; PM G5-6 (simple ornamentation), G7-8 (ornamentation) | sight-reading | [AB p.16][a27] "simple ornaments" | TCL: not listed | none | c:70 |
| AT-114 | Follow a clef change at sight | AB G6 | sight-reading | [AB p.16][a27] "clef changes" | TCL: not listed | none | c:71 |
| AT-115 | Read music under an 8va sign at sight | AB G7 | sight-reading | [AB p.16][a27] "8va sign" | TCL: not listed | none | c:72 |
| AT-116 | Use the sustaining pedal where marked at sight | AB G6; TCL G5 | sight-reading | [AB p.16][a27] "use of right pedal"; [TCL p.81][tcl] "simple pedalling" | TCL a grade earlier | none | c:73 |
| AT-117 | Add pedal where the music needs it but none is marked, at sight | TCL G6 (required, not always marked), G7 (essential) | sight-reading | [TCL p.81][tcl] "pedalling required but not always marked" | AB: not listed | none | c:75 |
| AT-118 | Use the una corda pedal at sight | AB G7 | sight-reading | [AB p.16][a27] "use of una corda pedal" | TCL: not listed | none | c:74 |

### 1.5 Aural (ABRSM aural tests, Trinity aural test, ABRSM Prep Test listening games, ABRSM Practical Musicianship)

| draft id | ability (what the learner does) | level range | component | source | where the boards differ | existing | completeness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AT-119 | Clap the pulse of a piece being played, joining in | AB Prep, Init; TCL Init | aural | [AB p.46][a27] "To clap the pulse of a piece played by the examiner"; [Prep][prep] "joining in clapping the pulse of a piece in 2 or 3 time" | TCL: clap on the third playing of a melody | A8.1 | none |
| AT-120 | Clap the pulse with the strong beats stressed, and say whether the music is in two, three or four time | AB G1-2 (two or three), G3 (two, three or four); TCL Init-5 (clap stressing the strong beat; metres 2 at Init, 2 or 3 at G1-2, 3 or 4 at G3, 4 or 6 at G4, 2-6 at G5) | aural | [AB p.46][a27] "giving a louder clap on the strong beats"; [TCL p.99][tcl] "stressing the strong beat" | AB asks the candidate to name two/three/four time; TCL asks only to clap until G5 (then AT-121) | A8.1 | none |
| AT-121 | Name the time signature of a piece heard | TCL G5-8 (2, 3, 4 or 6; 5 at G8); AB G7 (two, three, four or 6/8 time) | aural | [TCL p.114][tcl] "Identify the time signature" | AB G1-6: "The candidate is not required to state the time signature" | none (near A8.1) | none |
| AT-122 | Clap or tap back the rhythm of a short phrase as an echo, in time | AB Prep, Init (two 2-bar phrases); PM G1 | aural | [AB p.46][a27] "To clap as 'echoes' the rhythm of two phrases"; [PM][pm] "To tap, as an echo, the rhythm-pattern of two two-bar phrases" | TCL: no echo test | A8.1 | none |
| AT-123 | Clap the rhythm of an extract after hearing it twice | AB G4-7 | aural | [AB p.48][a27] "To clap the rhythm of the notes in an extract" | TCL: no rhythm clap-back | A8.1 | none |
| AT-124 | Sing back a short phrase as an echo, in time | AB Init (1 bar, tonic to mediant), G1 (2 bars, tonic to mediant), G2 (tonic to dominant), G3 (an octave, major or minor); PM G1 | aural | [AB p.46][a27] "To sing as 'echoes' two phrases played by the examiner" | TCL: "Candidates are not required to sing." [TCL p.82][tcl] | none | none |
| AT-125 | Sing an echo while tapping a given ostinato rhythm | PM G2-3 | aural | [PM][pm] "whilst continuously tapping a repeated rhythm pattern (i.e. an ostinato)" | not in AB Practical Grades or TCL | none | none |
| AT-126 | Sing or play back three notes heard | AB Prep | aural | [Prep][prep] "the pupil must correctly pitch three notes" | Prep only | none | none |
| AT-127 | Play back from memory a melody heard twice (sing it or play it) | AB G4-5 (an octave range, up to three sharps or flats); PM G1-3 (two bars, played), G4-6 (sung, then played) | aural | [AB p.48][a27] "To sing or play from memory a melody played twice"; [PM][pm] "a two-bar melody played twice by the examiner" | TCL: no playback | none (near A3.1) | none |
| AT-128 | Play back at the piano a melody heard harmonised, with its harmonies in outline | PM G7-8 | aural | [PM][pm] "expected to play the melody with the harmonies in outline" | PM only | none (near A3.1) | none |
| AT-129 | Pick out one part of a two- or three-part texture by ear and sing or play it | AB G6 (upper of two parts), G7 (lower of two), G8 (lowest of three) | aural | [AB p.50][a27] "the upper part of a two-part phrase played twice" | TCL: not asked | none (near A3.1) | none |
| AT-130 | Say whether one note is higher or lower than another, or which is highest or lowest | TCL Init (highest or lowest of three notes), G1-2 (last note against the first) | aural | [TCL p.102][tcl] "Identify the last note as higher or lower than the first note" | AB: not asked | none | none |
| AT-131 | Hear a phrase twice and say where it changed and whether the change was pitch or rhythm | AB G1 (pitch only, near the beginning or the end), G2-3 (pitch or rhythm; describe, sing or clap it); TCL G1 (where), G2 (where and which) | aural | [AB p.46][a27] "To identify where a change in pitch occurs"; [TCL p.105][tcl] "Identify the change as rhythm or pitch" | agree in content; AB adds singing or clapping the change | none | none |
| AT-132 | Follow a printed melody or piece while listening and locate the changes in it | TCL G3 (one change, its bar), G4-5 (a rhythm and a pitch change), G6 (two), G7-8 (three); PM G1-3 (3-4 changes), G4 (4 changes incl. dynamics, tempo), G5-6 (5 changes incl. articulation, phrasing) | aural | [TCL p.108][tcl] "Identify in which bar the change has occurred"; [PM][pm] "recognize, from the printed score, the three or four changes" | AB Practical Grades: not asked | none | none |
| AT-133 | Say what the dynamics of a heard piece are and how they change | AB Prep, Init-7 (one of the feature questions); TCL Init (forte or piano), G2-5 (describe varying dynamics), G6-8 (comment) | aural | [AB p.46][a27] "dynamics (loud/quiet, or sudden/gradual changes)"; [TCL p.99][tcl] "Identify the dynamic as forte or piano" | agree | none | none |
| AT-134 | Say whether a heard passage is smooth or detached | AB Init-7 (feature option); TCL Init-2 (legato or staccato), G6-8 (comment) | aural | [AB p.46][a27] "articulation (smooth/detached)"; [TCL p.99][tcl] "Identify the articulation as legato or staccato" | agree | none | none |
| AT-135 | Say whether a heard piece slows down, speeds up or keeps its tempo | AB Prep, G2-7 | aural | [AB p.47][a27] "tempo (becoming slower/faster, or staying the same)" | TCL: not asked by name | none | none |
| AT-136 | Say whether a heard piece is in a major or a minor key, and follow a change of tonality | AB G3-7; TCL G3 (melody), G4 (harmonised), G5 (changing tonality) | aural | [AB p.47][a27] "tonality (major/minor key)"; [TCL p.108][tcl] "Identify the tonality as major or minor" | TCL adds a change of tonality at G5 | none | none |
| AT-137 | Describe the character of a heard piece | AB G4-8; TCL G6-8 (among "other characteristics") | aural | [AB p.48][a27] "the second will be character" | TCL leaves the characteristics open | none | none |
| AT-138 | Name the likely style and period of a heard piece | AB G5-8 | aural | [AB p.49][a27] "the second will be style and period" | TCL lists style among the features asked about [TCL p.82][tcl] | none | none |
| AT-139 | Describe the texture and structure of a heard piece, and its notable features unprompted | AB G6-7 (texture or structure), G8 (describe features unprompted); TCL G6-7 (two other characteristics), G8 (three) | aural | [AB p.52][a27] "To describe the characteristic features of a piece"; [TCL p.123][tcl] "Identify and comment on three other characteristics" | AB names texture and structure; TCL leaves them open | none | none |
| AT-140 | Name a melodic interval by ear | TCL G3 (by number, second to sixth), G4 (by quality to the major sixth), G5 (to the octave) | aural | [TCL p.108][tcl] "Identify the interval by number only" | AB Practical Grades: no interval test | none | none |
| AT-141 | Name a cadence by ear | AB G6 (perfect, imperfect), G7 (+ interrupted), G8 (+ plagal, inside a continuing phrase); TCL G4 (perfect, imperfect), G5 (perfect, plagal, imperfect, interrupted) | aural | [AB p.50][a27] "To identify the cadence at the end of a phrase"; [TCL p.114][tcl] "perfect, plagal, imperfect or interrupted" | order disagrees: TCL asks it at G4-5 and then drops it; AB asks it at G6-8 | none (near A5.1) | none |
| AT-142 | Name the chords of a cadence by ear, including their positions | AB G7 (two chords from I, IV, V, V7, vi), G8 (three chords incl. ii, Ib, Ic) | aural | [AB p.51][a27] "To identify the two chords forming the above cadence" | TCL: not asked | none | none |
| AT-143 | Name the key a heard passage modulates to | AB G7 (from major: dominant, subdominant, relative minor), G8 (also from minor); TCL G6 (from major: subdominant, dominant, relative minor), G7 (relative key, major or minor) | aural | [AB p.51][a27] "to the dominant, subdominant or relative minor"; [TCL p.117][tcl] "Identify the key to which the music modulates" | TCL a grade earlier and stops at G7; AB continues to G8 with minor-key starts | none | none |
| AT-144 | Sing a short group of notes from the score in free time | AB G4 (five notes), G5 (six notes) | aural | [AB p.48][a27] "To sing five notes from score in free time" | TCL: no singing | none | none |
| AT-145 | Sing a melody or one part from the score in time against an accompaniment | AB G6 (melody), G7 (upper of two parts), G8 (lower of two parts); PM G1-6 (melody; lower part from G4), G7-8 (middle or lower of three parts) | aural | [AB p.50][a27] "To sing a melody from score, with an accompaniment"; [PM][pm] "To sing at sight a four-bar melody" | TCL: no singing | none | none |

### 1.6 Improvisation (Trinity supporting test; ABRSM Practical Musicianship)

| draft id | ability (what the learner does) | level range | component | source | where the boards differ | existing | completeness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AT-146 | Improvise with both hands over a notated piano part another player plays, complementing its style, for a set number of bars | TCL Init-8 (stylistic stimulus): 4 bars once (Init) to 8 bars twice (G6-8); one chord a bar to up to two (G5-8); styles from march and lullaby (Init) to impressionistic and irregular dance (G8) | other (improvisation) | [TCL p.82][tcl] "improvise over a notated piano part played by the examiner" | AB Practical Grades: no improvisation; PM G4-6 asks a melodic extension over an accompaniment (AT-150) | none (near A4.2) | c:100, c:101, c:102 |
| AT-147 | Develop a short melodic motif into a solo improvisation of a set length in the given metre | TCL Init-8 (motivic stimulus): responses 4-6 bars (Init) to 12-16 bars (G6-8), adding quavers (G1), dotted notes and staccato (G2), ties (G3), syncopation and accents (G4), semiquavers and slurs (G5), acciaccaturas (G6), triplets, duplets and sfz (G8); PM G5 (motif or interval) | other (improvisation) | [TCL p.85][tcl] "improvise solo in response to a short melodic fragment"; [PM][pm] "a short free improvisation based on a given motif or interval" | PM assesses "a sense of structure" in free form; TCL sets lengths and features | none | c:103 |
| AT-148 | Improvise a solo with both hands that follows a chord sequence, with melodic and rhythmic interest | TCL Init-8 (harmonic stimulus): I, V (Init-1), I, IV, V (G2), I, ii, IV, V (G3), i, iv, V (G4), i, iv, V, VI (G5), 8-bar sequences with ii half-diminished and sevenths (G6), iii and III (G7), all chords, sevenths, ninths, suspensions (G8) | other (improvisation) | [TCL p.86][tcl] "improvise solo in response to a chord sequence" | AB Practical Grades: none | none (near A7b.2) | c:100 |
| AT-149 | Improvise an answering phrase to a phrase just heard, in time | PM G1-2 (two bars), G3 (four bars) | other (improvisation) | [PM][pm] "a two-bar answering phrase to a two-bar phrase played by the examiner" | TCL: no answering-phrase test | none | none |
| AT-150 | Extend a given melodic opening over an accompaniment someone else plays | PM G4 (tonic and dominant), G5 (+ subdominant, supertonic), G6 (+ dominant seventh) | other (improvisation) | [PM][pm] "an extension to the given opening of a short melody" | PM only | none | none |
| AT-151 | Improvise a keyboard accompaniment to a melody annotated with chord symbols, using inversions | PM G5-6 (option) | other (improvisation) | [PM][pm] "improvise at the keyboard an accompaniment to a given melody" | PM gives "credit for the effective use of inversions of the chords" | none (near A7g.1, A6.1) | none |
| AT-152 | Improvise freely from a given keyboard texture (a chord cluster, tremolo, glissando) | PM G6 | other (improvisation) | [PM][pm] "the use of a specific chord cluster for keyboard players" | PM only | none | none |
| AT-153 | Improvise a structured piece that expresses the mood of a poem or picture | PM G7-8 | other (improvisation) | [PM][pm] "a short free improvisation based on a given poem" | PM only | none | none |
| AT-154 | Continue a two-bar melodic opening to make eight bars | PM G7 (late 17th- or early 18th-century style), G8 (any style) | other (improvisation) | [PM][pm] "continue a given two-bar melodic opening" | PM only | none | none |
| AT-155 | Realise a figured bass at the keyboard | PM G7 (5/3, 6/3, 6/4, 7 chords), G8 (more figures) | other (improvisation) | [PM][pm] "realize a short figured bass passage at the keyboard" | PM only | none | none |
| AT-156 | Transpose a melody at sight | PM G5-6 (a tone or semitone), G7 (up to a minor third), G8 (up to a major third) | other (musicianship) | [PM][pm] "up or down a tone or semitone" | TCL: none | A2.1 | none |

### 1.7 Musical knowledge and theory (Trinity musical knowledge test; ABRSM Music Theory 1-5; ABRSM Practical Musicianship)

| draft id | ability (what the learner does) | level range | component | source | where the boards differ | existing | completeness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AT-157 | Name the notes in a score, treble and bass clef, including ledger lines | TCL Init (letter names), G1 (two ledger lines), G2 (three); Th G1 (stave, middle C), G2 (two ledger lines), G3 (beyond two) | other (musical knowledge) | [TCL p.88][tcl] "Notes on ledger lines (up to 2 ledger lines)"; [Th][th] "Names of notes on the stave, including middle C in both clefs" | agree in order | none (near A1.1) | none |
| AT-158 | Read alto and tenor clefs and rewrite a melody in another clef at the octave | Th G3 (treble to bass), G4 (alto), G5 (tenor, any clef) | other (theory) | [Th][th] "Alto clef (C clef centred on 3rd line)." | TCL: not asked | none | none |
| AT-159 | Name note values and rests and say how long they last | TCL Init (durations), G1 (note values); Th G1 (semibreve to semiquaver, ties, single dots), G3 (demisemiquaver), G4 (breve, double dots) | other (musical knowledge) | [TCL p.88][tcl] "Note durations"; [Th][th] "Note values of semibreve, minim, crotchet, quaver and semiquaver" | agree | none | none |
| AT-160 | Explain a time signature and group notes and rests correctly within it | TCL Init (identify), G1 (explain); Th G1 (2/4, 3/4, 4/4), G2 (more simple times, triplets), G3 (compound), G4 (all simple and compound, duplets), G5 (irregular) | other (musical knowledge) | [TCL p.88][tcl] "Explain key/time signatures" | Th asks grouping (writing); TCL asks explanation | none | none |
| AT-161 | Identify a key signature and its key, including the relative major or minor | TCL Init (identify), G1 (explain), G3 (relative major/minor); Th G1 (C, G, D, F), G2 (relative keys; A, B-flat, E-flat; A, E, D minor), G3 (four sharps/flats), G4 (five), G5 (six) | other (musical knowledge) | [TCL p.89][tcl] "Relative major/minor"; [Th][th] "Relative major and minor keys." | agree | none | none |
| AT-162 | Explain the musical terms and signs printed in a score | TCL Init (basic), G1 (e.g. da capo); Th G1-5 (more each grade) | other (musical knowledge) | [TCL p.88][tcl] "Explain basic musical terms and signs"; [Th][th] "Some frequently used terms and signs concerning tempo, dynamics" | agree | A1.1 | none |
| AT-163 | Explain a metronome mark | TCL G2 | other (musical knowledge) | [TCL p.88][tcl] "Metronome marks" | Th: within terms and signs | none (near A1.1) | none |
| AT-164 | Name the ornaments and grace notes in a score, and write ornament signs for written-out ornaments | TCL G2 (grace notes and ornaments); Th G4 (trill, turn, mordents, acciaccatura, appoggiatura), G5 (replace written-out ornaments with signs) | other (musical knowledge) | [TCL p.88][tcl] "Grace notes and ornaments"; [Th][th] "replacement of written-out ornamentation with the appropriate signs" | TCL two grades earlier | none | none |
| AT-165 | Name the interval between two notes in a score | TCL G2 (number, 2nd to 5th), G3 (2nd to 7th), G4 (full name within an octave); Th G1 (above the tonic, number), G3 (number and type), G4 (any two diatonic notes), G5 (compound, from any note) | other (musical knowledge) | [TCL p.89][tcl] "Intervals (full names)"; [Th][th] "All intervals, not exceeding an octave, between any two diatonic notes" | agree in order | none | none |
| AT-166 | Recognise scale, arpeggio and broken-chord patterns inside a piece | TCL G3 | other (musical knowledge) | [TCL p.89][tcl] "Scale/arpeggio/ broken chord patterns" | Th: not asked | none | none |
| AT-167 | Name the notes of the tonic, dominant and subdominant triads of a key, and their inversions | TCL G4 (tonic, dominant), G5 (subdominant); Th G1 (tonic triads), G4 (I, IV, V), G5 (I, ii, IV, V in root, first and second inversion) | other (musical knowledge) | [TCL p.89][tcl] "Tonic/dominant triads"; [Th][th] "Triads (root position) on the tonic, subdominant and dominant notes" | Th adds the supertonic and inversions at G5 | none (near A5.1) | none |
| AT-168 | Find where a piece modulates and name the new key | TCL G4 (relative, subdominant, dominant) | other (musical knowledge) | [TCL p.89][tcl] "Modulation to closely related keys" | Th 1-5: not asked | A5.1 | none |
| AT-169 | Describe a piece's form and point out its sections in the score | TCL G5 | other (musical knowledge) | [TCL p.89][tcl] "Describe the form of this piece" | Th 1-5: not asked | none (near A5.1) | none |
| AT-170 | Say what period and style a piece is in and which of its features show it | TCL G5 | other (musical knowledge) | [TCL p.89][tcl] "Musical period and style" | AB asks it by ear (AT-138) | none | none |
| AT-171 | Choose suitable chords for the cadence points of a simple melody | Th G5 (C, G, D or F major) | other (theory) | [Th][th] "The choice of suitable chords at cadential points of a simple melody" | TCL: not asked | none (near A6.1) | none |
| AT-172 | Name perfect, plagal and imperfect cadences in a score | Th G5 | other (theory) | [Th][th] "Perfect, plagal and imperfect cadences" | TCL: not asked in musical knowledge (asked by ear, AT-141) | A5.1 | none |
| AT-173 | Work out the notes of a scale from its pattern of tones and semitones, and name the degrees | Th G1 (major), G2 (harmonic minor), G3 (melodic minor), G4 (chromatic; technical names of degrees) | other (theory) | [Th][th] "Construction of the major scale, including the position of the tones and semitones" | TCL: not asked | none | none |
| AT-174 | Name enharmonic equivalents | Th G4 | other (theory) | [Th][th] "Enharmonic equivalents." | TCL: not asked | none | none |
| AT-175 | Rewrite a melody for a B-flat, A or F instrument at concert pitch, and back | Th G5 | other (theory) | [Th][th] "Transposition to concert pitch of a short melody notated for an instrument" | TCL: not asked | none (near A2.1) | none |
| AT-176 | Answer questions about keys, harmony, scoring, style and structure in a score extract | PM G7 (chamber work, 1700-1850), G8 (voice and instruments) | other (musicianship) | [PM][pm] "answer basic questions about an extract from a score" | PM only | none (near A5.1) | none |

### 1.8 Prep Test and accompanying

| draft id | ability (what the learner does) | level range | component | source | where the boards differ | existing | completeness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AT-177 | Play short set tunes with their articulation and phrasing | AB Prep | pieces (Prep "Tunes") | [Prep][prep] "emphasise articulation and musical phrasing" | Prep only; memory "encouraged" since 2025 | none | none |
| AT-178 | Accompany a singer or instrumentalist in a rehearsed piece, keeping together and balancing with them | TCL-Acc G5-8 (groups A and B) | pieces | [TCL p.124][tcl] "provide and rehearse with the soloist(s) for the pieces in groups A and B" | AB: no accompanying exam | A4.2 (near A7g.1) | none |
| AT-179 | Play a piano-solo arrangement of an orchestral or vocal work | TCL-Acc G5-8 (group C) | pieces | [TCL-Acc list][tacc] "Group C (piano solo)" | AB: no accompanying exam | none (near A7e.1) | none |

## 1b. The completeness check's syllabus lines (c:13-c:117), checked against the pages

Each line of `completeness.md`'s table 1 was read against the page it cites (ABRSM lines against the 2027 & 2028 edition, which carries the same technical, sight-reading and aural content as the 2025 & 2026 edition it cites). Verdicts: **kept** (the demand is as stated), **corrected** (what the line says differs from the page), **split** (more than one ability), **not checked** (RCM, outside this source family).

| line | verdict | what the pages say | AT ids |
| --- | --- | --- | --- |
| c:13 | kept | AB HS to G1 (except C major HT at G1); TCL HS to G1 | AT-032, AT-034, AT-035 |
| c:14 | kept | both: an octave apart (AB p.12; TCL p.79) | AT-035, AT-036, AT-037 |
| c:15 | corrected | the unison start belongs to the **contrary-motion** scales (AB Init-8) and the chromatic contrary-motion scale (G3, "starting on the stated note"), not to similar-motion scales | AT-044, AT-048 |
| c:16 | corrected | AB G7 a third apart and G8 a sixth apart are diatonic similar-motion scales; the "Grade 5" item is the **chromatic contrary-motion** scale a major third apart. TCL has no diatonic scales a third or sixth apart | AT-049, AT-050 |
| c:17 | kept | AB G8 chromatic a major sixth apart, similar motion | AT-049 |
| c:18 | corrected | harmonic-minor contrary motion starts at AB G4, not Init; TCL asks it at G5 only (the line cites TCL p.45, which is the digital Grade 8 page; the face-to-face pages are pp.97-122) | AT-044, AT-045 |
| c:19 | corrected | AB G3's chromatic contrary-motion scale starts both hands on D (unison); only G5 and G7 start from different notes. TCL's first chromatic scale is contrary motion at G1 | AT-048, AT-049 |
| c:20 | not checked | RCM | none |
| c:21 | corrected | AB ranges also include "a 5th" at Init (contrary-motion scale and arpeggios); TCL ranges are one octave (Init-1), two (G2-5), four (G6-8) | AT-034, AT-036, AT-037, AT-044, AT-054 |
| c:22 | corrected | natural minor is offered only to AB G2 and TCL G1; both forms on request only at G6-8 | AT-033, AT-038, AT-039, AT-040 |
| c:23 | kept | AB chromatic from G2 (HS); TCL from G1 (contrary motion) | AT-046, AT-047, AT-048 |
| c:24 | kept | AB G8 only; TCL none | AT-053 |
| c:25 | corrected | AB G5 has separate staccato scales (HS); examiner's choice is G6-8; TCL legato or staccato from G4 | AT-041 |
| c:26 | corrected | TCL has legato scales in thirds only (G6-8), no staccato thirds or sixths; AB G7 legato and staccato thirds, G8 legato thirds and staccato sixths | AT-051, AT-052 |
| c:27 | not checked | RCM | none |
| c:28 | split | TCL dynamic levels (G2-8) and the p-f-p shape (G7-8) are two demands | AT-042, AT-043 |
| c:29 | kept | both | AT-030 |
| c:30 | kept | TCL G1 | AT-055 |
| c:31 | corrected | TCL has broken triads at Init only (C major, A minor, root position); it has no solid triads or inversions; the inversions are RCM's | AT-054 |
| c:32 | not checked | RCM | none |
| c:33 | not checked | RCM | none |
| c:34 | not checked | RCM | none |
| c:35 | kept | AB dim. 7th from G5, dom. 7th G6-8; TCL the same grades | AT-056, AT-057, AT-060, AT-061 |
| c:36 | kept | AB G7 first inversion only, G8 second inversion only | AT-059 |
| c:37 | kept | AB p.13 | AT-060 |
| c:38 | not checked | RCM | none |
| c:39 | corrected | AB p.16 is the sight-reading hand position at Init; AB's technical five-note patterns are the Init contrary-motion scale and arpeggios ("a 5th") | AT-054, AT-068 |
| c:40 | kept | AB p.14 (guide); TCL minimum speeds per grade | AT-030 |
| c:41 | kept | AB p.13 | AT-031 |
| c:42 | kept | AB 4 bars to c.1 page | AT-067 |
| c:43 | kept | as listed; the grades per metre are in AT-071 to AT-076 | AT-071 to AT-076 |
| c:44 | kept | TCL G8 | AT-077 |
| c:45 | kept | grades per key in AT-078 to AT-083 | AT-078 to AT-083 |
| c:46 | kept | TCL G1 and G2 | AT-078, AT-084 |
| c:47 | kept | TCL G5, G6, G7 | AT-087 |
| c:48 | kept | AB Init, G1, G3 | AT-068, AT-070 |
| c:49 | kept | AB G2 | AT-069 |
| c:50 | kept | grades in AT-088, AT-089, AT-091 | AT-088, AT-089, AT-091 |
| c:51 | kept | AB G2, TCL G2 | AT-090 |
| c:52 | kept | AB G6 (TCL G8) | AT-092 |
| c:53 | kept | TCL G8 | AT-093 |
| c:54 | corrected | TCL p.25 is the digital composition page (simple syncopation, G1); TCL sight reading has no syncopation | AT-094, AT-028 |
| c:55 | kept | AB G4 | AT-095 |
| c:56 | kept | AB G1 (minor keys only), G4 (chromatic notes) | AT-084, AT-085 |
| c:57 | kept | TCL G8 | AT-086 |
| c:58 | kept | | AT-102 |
| c:59 | split | staccato, accents and tenuto enter at different grades on each board | AT-103, AT-104, AT-105 |
| c:60 | split | f/p, mf/mp, pp/ff enter at different grades | AT-096, AT-097, AT-098 |
| c:61 | kept | AB G1, TCL G4 | AT-099 |
| c:62 | kept | TCL G8 | AT-100 |
| c:63 | kept | TCL G8 | AT-101 |
| c:64 | kept | AB G4, TCL G5 | AT-106 |
| c:65 | split | slowing (AB G5, TCL G5), tempo changes (AB G7), acceleration (AB G8, TCL G5) | AT-108, AT-109 |
| c:66 | kept | TCL Init-G3 | AT-107 |
| c:67 | kept | TCL G7 | AT-107 |
| c:68 | split | 2-note chords (G3), 4-part (G5), 3-part in a hand (G8) | AT-110, AT-111 |
| c:69 | kept | AB G8 | AT-112 |
| c:70 | kept | AB G8 | AT-113 |
| c:71 | kept | AB G6 | AT-114 |
| c:72 | kept | AB G7 | AT-115 |
| c:73 | kept | AB G6, TCL G5 | AT-116, AT-013 |
| c:74 | kept | AB G7 | AT-118 |
| c:75 | kept | TCL G6, G7 | AT-117 |
| c:76 | kept | AB p.12 | AT-013 |
| c:77 | kept | AB p.12 | AT-016 |
| c:78 | kept | AB p.12; TCL p.76 says the same of D.C. and D.S. | AT-015 |
| c:79 | split | fingering, metronome marks and ornament realisation are three abilities | AT-019, AT-007, AT-014 |
| c:80 | kept | AB p.11; TCL p.77 differs (upper part, recorded partner allowed) | AT-017 |
| c:81 | kept | | AT-008 |
| c:82 | kept | | AT-009 |
| c:83 | kept | | AT-010 |
| c:84 to c:96 | not checked | RCM (13 lines) | none |
| c:97 | kept | TCL p.79 (face-to-face) as well as p.27 | AT-063, AT-012 |
| c:98 | kept | | AT-064 |
| c:99 | kept | | AT-065 |
| c:100 | kept | stylistic and harmonic stimuli (p.83-87) | AT-146, AT-148 |
| c:101 | corrected | up to two chords a bar is the stylistic stimulus from G5; the harmonic stimulus keeps one chord a bar at every grade | AT-146, AT-148 |
| c:102 | kept | | AT-146 |
| c:103 | kept | | AT-147 |
| c:104 | kept | TCL Init | AT-024 |
| c:105 | kept | TCL G1 (dynamic contrast), G2 and G4 (articulations) | AT-025 |
| c:106 | kept | TCL G2, G6 | AT-026 |
| c:107 | kept | TCL G3 | AT-027 |
| c:108 | kept | TCL G3 | AT-024 |
| c:109 | kept | TCL G5 | AT-028 |
| c:110 | kept | TCL G6 | AT-027 |
| c:111 | kept | TCL G7 | AT-028 |
| c:112 | kept | TCL G8 | AT-028 |
| c:113 | kept | TCL Init 0.5-1 min to G8 3.5-5 min | AT-022 |
| c:114 | kept | TCL p.71 (face-to-face) as well as p.22 (digital) | AT-021 |
| c:115 | kept | TCL pp.70-71 | AT-001, AT-002 |
| c:116 | split | AB's five criteria are separate abilities | AT-001, AT-003, AT-004, AT-005, AT-006 |
| c:117 | kept | AB and TCL scales from memory; TCL exercises may use the music | AT-029 |

The verdict tally is in section 4. What the completeness check missed and this draft adds: the whole of the aural tests on both boards (it lists only RCM's aural line, c:96), Trinity's musical-knowledge test, Trinity's stylistic stimulus as play-along improvisation, the Prep Test, Trinity Piano Accompanying, ABRSM Performance Grades' programme mark, ABRSM Practical Musicianship and Theory 1-5 (the Grade 6 prerequisite), Trinity's contrary-motion and staccato arpeggios, Trinity's scale dynamics (f/mf/p), ABRSM's hands-separate chromatic scale, and the ABRSM/Trinity grade disagreements on every sight-reading parameter.

## 2. Coverage

Every component of each syllabus read, at every grade, with the abilities that cover it. A grade range in the grade column means the same component at each of those grades.

### 2.1 ABRSM

| board | grade | component (item) | ability ids |
| --- | --- | --- | --- |
| AB Prep | Prep | Tunes (three set exercises) | AT-177 |
| AB Prep | Prep | First piece (solo), second piece (solo or duet) | AT-001, AT-017 |
| AB Prep | Prep | Listening: clapping the beat | AT-119 |
| AB Prep | Prep | Listening: echoes | AT-122 |
| AB Prep | Prep | Listening: finding the notes | AT-126 |
| AB Prep | Prep | Listening: what can you hear (dynamics or tempo) | AT-133, AT-135 |
| AB | Init-8 | Pieces: List A | AT-008 |
| AB | Init-8 | Pieces: List B | AT-009 |
| AB | Init-8 | Pieces: List C | AT-010 |
| AB | Init-3 | Pieces: duet option (primo/secondo) | AT-017 |
| AB | Init-8 | Pieces: interpreting the score (editorial marks need not be observed) | AT-005, AT-007, AT-014 |
| AB | Init-8 | Pieces: pedalling | AT-013 |
| AB | Init-8 | Pieces: hand stretch | AT-016 |
| AB | Init-8 | Pieces: repeats (D.C., D.S., short repeats) | AT-015 |
| AB | Init-8 | Pieces: ossias (either option may be played) | n/a: a permission, no ability |
| AB | Init-8 | Pieces: from memory (optional) | AT-018 |
| AB | Init-8 | Pieces: page-turns, photocopies, editions, sourcing music | n/a: administrative |
| AB | Init-8 | Pieces marking: pitch, time, tone, shape, performance | AT-001, AT-002, AT-003, AT-004, AT-005, AT-006 |
| AB | Init-8 | Scales general: memory, range, octave apart, even notes, patterns, legato, no pedal, fingering, examiner's requests | AT-029, AT-030, AT-031, AT-019, AT-035 to AT-037 |
| AB | Init-8 | Scales speeds (guide) | AT-030 |
| AB | Init-8 | Scales marking: notes, flow, tone, shape, response | AT-029, AT-030, AT-042 (shape) |
| AB | Init | Scales C major, D minor 1 oct HS; CM C major a 5th; arpeggios C major, D minor a 5th HS | AT-032, AT-033, AT-044, AT-054 |
| AB | 1 | Scales C major 1 oct HT; G, F major, A, D minor 2 oct HS; CM C major 1 oct; arpeggios G major, A minor 1 oct HS | AT-035, AT-034, AT-033, AT-044, AT-056 |
| AB | 2 | Scales G, F major, A, D minor 2 oct HT; D, A major, E, G minor 2 oct HS; CM C major 2 oct; chromatic from D 1 oct HS; arpeggios D, A major, E, G minor 2 oct HS | AT-036, AT-034, AT-033, AT-044, AT-046, AT-056 |
| AB | 3 | Scales D, A major, E, G minor (harm. or mel.) 2 oct HT; B-flat, E-flat major, B, C minor 2 oct HS; CM E major; chromatic CM from D 1 oct; arpeggios HT (D, A, E, G) and HS (B-flat, E-flat, B, C) | AT-036, AT-034, AT-038, AT-039, AT-044, AT-048, AT-057, AT-056 |
| AB | 4 | Scales B-flat, E-flat major, B, C minor 2 oct HT; B, F-sharp, A-flat major, F-sharp, F minor 2 oct HS; CM E-flat major and C harmonic minor; chromatic from F-sharp 2 oct HT; arpeggios HT and HS | AT-036, AT-034, AT-044, AT-045, AT-047, AT-057, AT-056 |
| AB | 5 | Scales A, E, B, F-sharp, D-flat major and minors 2 oct HT legato; staccato scales A-flat major, F minor HS; CM D-flat major, C-sharp harmonic minor; chromatic CM major third apart; arpeggios 2 oct HT; dim. 7th from B HS | AT-036, AT-041, AT-044, AT-045, AT-049, AT-057, AT-061 |
| AB | 6 | Scales 4 oct HT legato or staccato (D, F, A-flat, B; both minor forms); CM 2 oct; chromatic from G-sharp, B 4 oct; arpeggios 4 oct HT root; dom. 7ths resolving; dim. 7ths 4 oct | AT-037, AT-040, AT-041, AT-044, AT-045, AT-047, AT-057, AT-060, AT-061 |
| AB | 7 | Scales 4 oct HT; scales a third apart; CM 2 oct; legato scale in thirds; staccato scale in thirds; chromatic CM minor third apart; arpeggios first inversion; dom. 7ths; dim. 7ths | AT-037, AT-040, AT-041, AT-050, AT-044, AT-045, AT-051, AT-052, AT-049, AT-059, AT-060, AT-061 |
| AB | 8 | Scales 4 oct HT; scales a sixth apart; CM 2 oct; legato scale in thirds; staccato scale in sixths; chromatic a major sixth apart; whole-tone scales; arpeggios second inversion; dom. 7ths; dim. 7ths | AT-037, AT-040, AT-041, AT-050, AT-044, AT-045, AT-051, AT-052, AT-049, AT-053, AT-059, AT-060, AT-061 |
| AB | Init-8 | Sight-reading test conditions (half a minute's preparation; any fingering) | AT-067, AT-019 |
| AB | Init | Sight-reading: 4 bars 4/4, 6 bars 2/4; C major, D minor; each hand separately, five-finger position tonic to dominant; minim, crotchet, quavers, crotchet rest; legato phrases, staccato; f and p | AT-067, AT-071, AT-078, AT-079, AT-068, AT-088, AT-102, AT-103, AT-096 |
| AB | 1 | Sight-reading: 3/4; G, F major, A minor; any five-finger position; occasional accidentals (minor keys); dotted minim, quaver groups, minim and crotchet rests; slurs, accents; mf, mp; hairpins | AT-072, AT-079, AT-078, AT-068, AT-084, AT-089, AT-088, AT-102, AT-104, AT-097, AT-099 |
| AB | 2 | Sight-reading: D major, E, G minor; hands together; semibreve, dotted crotchet-quaver; tied notes; pp | AT-080, AT-069, AT-088, AT-089, AT-090, AT-098 |
| AB | 3 | Sight-reading: up to 8 bars; 3/8; A, B-flat, E-flat major, B minor; outside five-finger position; 2-note chords; semiquaver patterns; quaver rest | AT-067, AT-073, AT-080, AT-081, AT-070, AT-110, AT-091, AT-088 |
| AB | 4 | Sight-reading: c.8 bars; 6/8; anacrusis; chromatic notes; pause signs; tenuto | AT-067, AT-074, AT-095, AT-085, AT-106, AT-105 |
| AB | 5 | Sight-reading: c.8-12 bars; E, A-flat major, F-sharp, C minor; 4-part chords; simple syncopation; slowing at end; ff | AT-067, AT-082, AT-081, AT-111, AT-094, AT-108, AT-098 |
| AB | 6 | Sight-reading: c.12-16 bars; 9/8, 5/8, 5/4; C-sharp, F minor; triplets; clef changes; right pedal | AT-067, AT-074, AT-075, AT-082, AT-092, AT-114, AT-116 |
| AB | 7 | Sight-reading: c.16-20 bars; 7/8, 7/4; tempo changes; 8va; una corda | AT-067, AT-075, AT-108, AT-115, AT-118 |
| AB | 8 | Sight-reading: c.1 page; 12/8; B, D-flat major; 3-part chords in a hand; spread chords; simple ornaments; acceleration | AT-067, AT-074, AT-083, AT-111, AT-112, AT-113, AT-109 |
| AB | Init-8 | Sight-reading marking: continuity, rhythm, notes/key, musical detail | AT-067, AT-004 |
| AB | Init | Aural A clap pulse; B clap echoes; C sing echoes; D one feature (dynamics or articulation) | AT-119, AT-122, AT-124, AT-133, AT-134 |
| AB | 1 | Aural A pulse, two or three time; B sing echoes; C where a pitch change is; D dynamics and articulation | AT-120, AT-124, AT-131, AT-133, AT-134 |
| AB | 2 | Aural A pulse, two or three; B sing echoes (to dominant); C pitch or rhythm change; D dynamics/articulation and tempo | AT-120, AT-124, AT-131, AT-133, AT-134, AT-135 |
| AB | 3 | Aural A pulse, two/three/four; B sing echoes (octave, major or minor); C change (up to 4 bars); D feature and tonality | AT-120, AT-124, AT-131, AT-133 to AT-136 |
| AB | 4 | Aural A sing or play back a melody; B sing five notes from score; C(i) feature and character; C(ii) clap rhythm, two/three/four | AT-127, AT-144, AT-133 to AT-137, AT-123, AT-120 |
| AB | 5 | Aural A play back a melody; B sing six notes; C(i) feature and style and period; C(ii) clap rhythm, metre | AT-127, AT-144, AT-138, AT-123, AT-120 |
| AB | 6 | Aural A upper part of two-part phrase; B sing melody with accompaniment; C cadence (perfect, imperfect); D(i) texture or structure; D(ii) clap rhythm, metre | AT-129, AT-145, AT-141, AT-139, AT-123, AT-120 |
| AB | 7 | Aural A lower part; B sing upper of two parts; C(i) cadence incl. interrupted; C(ii) the two cadence chords; C(iii) modulation; D(i) two features; D(ii) clap rhythm, metre incl. 6/8 | AT-129, AT-145, AT-141, AT-142, AT-143, AT-133 to AT-139, AT-123, AT-121 |
| AB | 8 | Aural A(i) lowest of three parts; A(ii) cadence incl. plagal; A(iii) three cadence chords with positions; B sing lower of two parts; C two modulations (major and minor start); D describe features | AT-129, AT-141, AT-142, AT-145, AT-143, AT-139 |
| AB | Init-8 | Aural marking: accuracy, perception, response | AT-119 to AT-145 (the aural rows) |
| AB | Init-8 | Alternative tests for blind, partially sighted, deaf candidates (Braille memory, aural repetition, alternative aural tests) | UNCOVERED: the alternative syllabus is at abrsm.org/specificneeds and was not read |
| AB | 6-8 | Entry requirement: Grade 5 Theory, Practical Musicianship or a solo Jazz instrument | covered through the PM and Th rows below; ABRSM Jazz piano not read (other source family) |
| PG | Init-8 | Four pieces: three from the lists, one own choice | AT-001 to AT-010, AT-020 |
| PG | Init-8 | Performance as a whole (communication, interpretation, delivery; sequence and pacing) | AT-020, AT-006, AT-012 |
| PG | 1-8 | One-hand repertoire options | UNCOVERED: the piano-specific Performance Grades section listing them was not read |
| PM | 1 | A tap echo; B sing echo; C play back 2-bar melody; D sight-sing with accompaniment; E answering phrase; F changes against the score | AT-122, AT-124, AT-127, AT-145, AT-149, AT-132 |
| PM | 2 | A sing echo with ostinato; B play back; C sight-sing; D answering phrase; E changes | AT-125, AT-127, AT-145, AT-149, AT-132 |
| PM | 3 | A echo with ostinato; B play back; C sight-sing (2/4 to 6/8); D 4-bar answering phrase; E four changes incl. dynamics | AT-125, AT-127, AT-145, AT-149, AT-132 |
| PM | 4 | A sing and play back; B sight-sing lower of two parts; C sight-sing melody; D melodic extension (I, V); E four changes in a piano piece | AT-127, AT-145, AT-150, AT-132 |
| PM | 5 | A sing and play back; B transpose at sight or sing lower part; C sight-sing or play with dynamics and ornaments; D extension or keyboard accompaniment from symbols; E free improvisation on motif or interval; F five changes | AT-127, AT-156, AT-145, AT-067, AT-113, AT-150, AT-151, AT-147, AT-132 |
| PM | 6 | as Grade 5 with eight-bar transposition, dominant seventh, texture-based free improvisation | AT-127, AT-156, AT-145, AT-067, AT-113, AT-150, AT-151, AT-152, AT-132 |
| PM | 7 | A play back with harmonies in outline; B transpose (to a minor third) or sing a part of three; C sight-sing or play with articulation and phrasing; D continue a melody to 8 bars or figured bass; E improvise on a poem or picture; F questions on a chamber-music score | AT-128, AT-156, AT-145, AT-067, AT-113, AT-154, AT-155, AT-153, AT-176 |
| PM | 8 | as Grade 7 with transposition to a major third, a motet part, any-style continuation, more figures, a score for voice and instruments | AT-128, AT-156, AT-145, AT-067, AT-113, AT-154, AT-155, AT-153, AT-176 |
| Th | 1 | note values, ties, dots; 2/4, 3/4, 4/4; treble and bass clef note names; major scale construction; C, G, D, F major keys, tonic triads, degrees, intervals by number; terms and signs | AT-159, AT-160, AT-157, AT-173, AT-161, AT-167, AT-165, AT-162 |
| Th | 2 | more simple times, triplets; two ledger lines; relative keys, harmonic minor; more keys; terms | AT-160, AT-092, AT-157, AT-161, AT-173, AT-162 |
| Th | 3 | compound times, demisemiquaver; beyond two ledger lines; octave transposition between clefs; keys to four sharps/flats, both minor forms, intervals by number and type; terms | AT-160, AT-159, AT-157, AT-158, AT-161, AT-173, AT-165, AT-162 |
| Th | 4 | all simple and compound times, breve, double dots, duplets; alto clef, double sharps and flats, enharmonics; keys to five, technical degree names, chromatic scale, all intervals; triads I, IV, V; ornaments; orchestral instruments | AT-160, AT-159, AT-093, AT-158, AT-086, AT-174, AT-161, AT-173, AT-165, AT-167, AT-164; **orchestral instruments UNCOVERED**: knowledge of other instruments, not a piano-playing or score-reading ability; kept out pending the reviewer's scope call |
| Th | 5 | irregular times and divisions; tenor clef, transposition between clefs, transposing instruments; keys to six, compound intervals; I, ii, IV, V with inversions, cadential chords, perfect/plagal/imperfect cadences; ornament signs; voices, instruments, general observation | AT-160, AT-093, AT-158, AT-175, AT-161, AT-165, AT-167, AT-171, AT-172, AT-164; **voices and instruments UNCOVERED** as Grade 4 |
| Th | 6-8 | Music Theory Grades 6-8 | UNCOVERED: not read; not required by the piano syllabus (only Grade 5 is the prerequisite) |

### 2.2 Trinity College London

| board | grade | component (item) | ability ids |
| --- | --- | --- | --- |
| TCL | Init-5 | Pieces: three from one list | AT-001 to AT-007, AT-010 |
| TCL | 6-8 | Pieces: Group A (technique, coordination, counterpoint) and Group B (expressive, colour, balance), at least one of each | AT-008, AT-009, AT-011, AT-012 |
| TCL | Init-3 | Pieces: one duet allowed (upper part, live or recorded partner) | AT-017 |
| TCL | Init-8 | Pieces: performance and interpretation rules (repeats, D.C./D.S., markings, ornamentation, metronome marks, memory) | AT-015, AT-007, AT-014, AT-018 |
| TCL | Init-8 | Pieces: cadenzas not required unless stated; metronomes not allowed; page turns; copies | n/a: administrative or permissions |
| TCL | Init-8 | Pieces marking: fluency & accuracy, technical facility, communication & interpretation | AT-001, AT-002, AT-003, AT-006, AT-005 |
| TCL | Init-8 | Learning outcomes and assessment criteria (perform in a variety of styles; technical demands; musicianship tests), stated per RQF level | AT-001 to AT-006, AT-010, AT-029, AT-067, AT-119 to AT-145 |
| TCL | 6-8 | Assessment criterion 2.2: technical control across the full compass | AT-021, AT-037 |
| TCL | Init | Own composition: 0.5-1 min; rhythmic values, clear melodic line, Init keys | AT-022, AT-023, AT-024 |
| TCL | 1 | Own composition: about 1 min; dynamic contrast, simple syncopation | AT-022, AT-023, AT-025, AT-028 |
| TCL | 2 | Own composition: 1-1.5 min; articulations, simple ornamentation | AT-022, AT-023, AT-025, AT-026 |
| TCL | 3 | Own composition: 1.5-2 min; sections (ABA), range of an octave or more | AT-022, AT-023, AT-027, AT-024 |
| TCL | 4 | Own composition: 2-3 min; tempo changes, variety of articulations | AT-022, AT-023, AT-025 |
| TCL | 5 | Own composition: 2-3 min; chromaticism, semiquaver passages | AT-022, AT-023, AT-028 |
| TCL | 6 | Own composition: 3-4 min, notated on a stave; variations, extensive range, advanced ornamentation | AT-022, AT-023, AT-027, AT-024, AT-026 |
| TCL | 7 | Own composition: 3-4 min; modulation, irregular time signatures | AT-022, AT-023, AT-028 |
| TCL | 8 | Own composition: 3.5-5 min; expressive techniques, creative form, extended techniques, range, chromaticism, rhythmic variation | AT-022, AT-023, AT-025, AT-027, AT-024, AT-028 |
| TCL | Init-8 | Technical work general: memory, octave apart, minimum pace, even quavers, fingering; exercises (three prepared, two played, music allowed) | AT-029, AT-030, AT-031, AT-036, AT-019, AT-063 to AT-065 |
| TCL | Init | Scales C major, A minor (any form) 1 oct HS mf; broken triads C, A minor to a 5th; exercises | AT-032, AT-033, AT-042, AT-054, AT-063 to AT-065 |
| TCL | 1 | Scales F, G major, D, E minor 1 oct HS; chromatic CM from D and C major CM 1 oct HT; broken chords (triplets) HS; exercises | AT-032, AT-033, AT-048, AT-044, AT-055, AT-063 to AT-065 |
| TCL | 2 | Scales B-flat, D major, G, B minor 2 oct HT f or p; chromatic similar from B-flat; C major CM; arpeggios 2 oct HS; exercises | AT-036, AT-038, AT-039, AT-042, AT-047, AT-044, AT-056, AT-063 to AT-065 |
| TCL | 3 | Scales E-flat, A major, C, F-sharp minor 2 oct HT; chromatic from F-sharp; E-flat major CM; arpeggios HS; exercises | AT-036, AT-038, AT-039, AT-042, AT-047, AT-044, AT-056, AT-063 to AT-065 |
| TCL | 4 | Scales A-flat, E major, F, C-sharp minor 2 oct HT legato or staccato; E major CM; chromatic from B; chromatic CM from A-flat 1 oct; arpeggios HS; exercises | AT-036, AT-041, AT-042, AT-044, AT-047, AT-048, AT-056, AT-063 to AT-065 |
| TCL | 5 | Scales D-flat, B major, B-flat, G-sharp minor 2 oct HT; G harmonic minor CM; chromatic from D-flat; chromatic CM C/E; arpeggios 2 oct HT legato or staccato; dim. 7th from B; exercises | AT-036, AT-041, AT-042, AT-045, AT-047, AT-049, AT-057, AT-058, AT-061, AT-063 to AT-065 |
| TCL | 6 | Scales B-flat, D major and minors (both forms) 4 oct HT; chromatic from B-flat and D 4 oct; chromatic CM from E-flat 2 oct; C major in thirds 1 oct HS; arpeggios 4 oct; dim. 7ths; dom. 7ths; exercises | AT-037, AT-040, AT-041, AT-042, AT-047, AT-048, AT-051, AT-057, AT-058, AT-061, AT-060, AT-063 to AT-065 |
| TCL | 7 | Scales A-flat, E major, G-sharp, E minor 4 oct with p-f-p option; chromatic a minor third apart; E major in thirds 2 oct; arpeggios, dim. 7ths, dom. 7ths 4 oct; E major CM arpeggio; exercises | AT-037, AT-040, AT-041, AT-043, AT-049, AT-051, AT-057, AT-058, AT-061, AT-060, AT-062, AT-063 to AT-065 |
| TCL | 8 | Scales F-sharp, E-flat, B major and minors 4 oct; chromatic from F-sharp, E-flat, B; B major and C harmonic minor in thirds; arpeggios, dim. 7ths, dom. 7ths; E-flat major and F-sharp minor CM arpeggios; exercises | AT-037, AT-040, AT-041, AT-043, AT-047, AT-051, AT-057, AT-058, AT-061, AT-060, AT-062, AT-063 to AT-065 |
| TCL | Init-5 | Supporting tests: two of sight reading, aural, improvisation, musical knowledge | (each test below) |
| TCL | 6-8 | Supporting tests: sight reading and one of aural or improvisation | (each test below) |
| TCL | Init-8 | Sight reading conditions (30 seconds; two grades lower) | AT-067 |
| TCL | Init | Sight reading: C major; 2/4; crotchet, minim, rest; p, f, moderato; simple phrasing | AT-078, AT-071, AT-088, AT-096, AT-107, AT-102 |
| TCL | 1 | Sight reading: G major, A minor (white notes); 4/4; semibreve, minim rest; mf | AT-079, AT-078, AT-071, AT-088, AT-097 |
| TCL | 2 | Sight reading: A minor with G-sharp; 3/4; dotted minim, ties; allegretto | AT-084, AT-072, AT-089, AT-090, AT-107 |
| TCL | 3 | Sight reading: D minor; quavers, crotchet rest; mp, andante; slurs | AT-079, AT-088, AT-097, AT-107, AT-102 |
| TCL | 4 | Sight reading: D major, E minor; dotted crotchet, quaver rest; hairpins; staccato, accents | AT-080, AT-089, AT-088, AT-099, AT-103, AT-104 |
| TCL | 5 | Sight reading: F, B-flat, E-flat, A major, B, G minor with modulation; 6/8; dotted quaver, semiquavers, rests; rit., rall., a tempo, pause, accel.; simple pedalling | AT-079, AT-080, AT-081, AT-087, AT-074, AT-089, AT-091, AT-108, AT-106, AT-109, AT-116 |
| TCL | 6 | Sight reading: F-sharp, C minor; wider modulations; pedalling required but not always marked | AT-081, AT-087, AT-117 |
| TCL | 7 | Sight reading: E, A-flat major; modulation to any related key; 9/8; any common terms; pedalling essential | AT-082, AT-087, AT-074, AT-107, AT-117 |
| TCL | 8 | Sight reading: B, D-flat major, G-sharp, B-flat minor, double sharps and flats; 2/2, changing time signatures; duplets, triplets; cresc./dim. as text, ff, pp, change in terms, different dynamics per hand; tenuto | AT-083, AT-086, AT-076, AT-077, AT-092, AT-093, AT-100, AT-098, AT-107, AT-101, AT-105 |
| TCL | Init-8 | Alternative sight-reading formats and memory test (blind or visually impaired) | UNCOVERED: the alternative test syllabus (trinitycollege.com/music-csn) was not read |
| TCL | Init | Aural: clap pulse stressing strong beat; dynamic f or p; articulation; highest or lowest note | AT-119, AT-120, AT-133, AT-134, AT-130 |
| TCL | 1 | Aural: pulse; f or p; articulation; last note higher or lower; where a change occurs | AT-120, AT-133, AT-134, AT-130, AT-131 |
| TCL | 2 | Aural: pulse; varying dynamics; articulation; higher or lower; where and which change | AT-120, AT-133, AT-134, AT-130, AT-131 |
| TCL | 3 | Aural: pulse; major or minor; interval by number; bar of a change from a copy | AT-120, AT-136, AT-140, AT-132 |
| TCL | 4 | Aural: pulse; tonality and cadence (perfect, imperfect); interval by quality; bars of rhythm and pitch changes | AT-120, AT-136, AT-141, AT-140, AT-132 |
| TCL | 5 | Aural: pulse and time signature; changing tonality and cadence (four types); interval to octave; bars of changes | AT-120, AT-121, AT-136, AT-141, AT-140, AT-132 |
| TCL | 6 | Aural: time signature, dynamics, articulation; two other characteristics; modulation; two changes | AT-121, AT-133, AT-134, AT-137, AT-139, AT-143, AT-132 |
| TCL | 7 | Aural: as Grade 6, major or minor key, relative key, three changes | AT-121, AT-133, AT-134, AT-137, AT-139, AT-143, AT-132 |
| TCL | 8 | Aural: time signature (incl. 5), dynamics, articulation; three other characteristics; three changes | AT-121, AT-133, AT-134, AT-137, AT-139, AT-132 |
| TCL | Init-8 | Aural awareness test for candidates with hearing loss | UNCOVERED: not read (trinitycollege.com/music-csn) |
| TCL | Init-8 | Improvisation: stylistic stimulus (per-grade intro, length, repeats, metre, keys, chords, styles: pp.83-84) | AT-146 |
| TCL | Init-8 | Improvisation: motivic stimulus (per-grade length, metre, rhythmic features, articulation, intervals, keys: pp.85-86) | AT-147 |
| TCL | Init-8 | Improvisation: harmonic stimulus (per-grade sequence length, repeats, chords, keys: pp.86-87) | AT-148 |
| TCL | Init-8 | Improvisation: both hands at all levels | AT-146, AT-147, AT-148 |
| TCL | Init | Musical knowledge: note names, durations, clefs/staves/barlines, key/time signatures, basic terms | AT-157, AT-159, AT-160, AT-161, AT-162 |
| TCL | 1 | Musical knowledge: note values, explain signatures, two ledger lines, terms and signs | AT-159, AT-160, AT-161, AT-157, AT-162 |
| TCL | 2 | Musical knowledge: intervals by number (2nd-5th), metronome marks, grace notes and ornaments, three ledger lines | AT-165, AT-163, AT-164, AT-157 |
| TCL | 3 | Musical knowledge: intervals 2nd-7th, relative major/minor, scale/arpeggio/broken-chord patterns | AT-165, AT-161, AT-166 |
| TCL | 4 | Musical knowledge: modulation to related keys, tonic/dominant triads, intervals by full name | AT-168, AT-167, AT-165 |
| TCL | 5 | Musical knowledge: period and style, structure, subdominant triads | AT-170, AT-169, AT-167 |
| TCL-dig | Init-8 | Technical work pathway: three pieces, technical work as set A or B with fixed dynamics and articulation, two exercises | AT-001, AT-029, AT-041, AT-042, AT-063 to AT-065 |
| TCL-dig | Init-8 | Technical work pathway: overall performance (delivery and focus; musical awareness, moving between styles) | AT-020, AT-010, AT-002 |
| TCL-dig | Init-8 | Repertoire-only pathway: four pieces | AT-001 to AT-010 |
| TCL-dig | Init-8 | Filming and submitting | n/a: administrative |
| TCL-Acc | 5-8 | Pieces: groups A and B with soloist(s) | AT-178 |
| TCL-Acc | 5-8 | Pieces: group C piano solo (Piano Plus arrangements, graded-book pieces) | AT-179, AT-001 |
| TCL-Acc | 5-8 | Technical work: extracts from Piano Plus 2, three chosen by the examiner | AT-066 |
| TCL-Acc | 5-8 | Supporting tests (as piano) | as the TCL supporting-test rows |
| TCL-Acc | 5-8 | The specific accompaniment extracts and what each trains (Piano Plus 2) | UNCOVERED: the book is not public; what the extracts ask was not read |

## 3. Sources

### Read

| key | source | what was read |
| --- | --- | --- |
| a27 | [ABRSM Piano Practical Grades Qualification Specification 2027 & 2028][a27] | whole PDF (46 pp.): pp.10-17 general rules, pp.18-44 grade pages (repertoire lists skimmed; scales read from rendered images), pp.45-52 aural tests, pp.53-60 assessment and marking |
| a25 | [ABRSM Piano Practical Grades 2025 & 2026][a25] | downloaded and converted; read only to confirm the edition the completeness check used (its p.8 says the next syllabus takes effect from 2027) |
| tcl | [Trinity College London Piano Syllabus, graded exams from 2023, online edition February 2026][tcl] | pp.19-68 digital pathways (structure, technical work rules p.27, Grade 5 technical work, overall performance p.55, repertoire-only p.57), pp.69-131 face-to-face (learning outcomes, about the exam, pieces, technical work, supporting tests, marking, every grade's requirements, Piano Accompanying Grades 5-8); tables read from rendered images |
| tacc | [Trinity Piano Accompanying repertoire list, September 2023][tacc] | group headings per grade (groups A and B with voice or instrument, group C piano solo) |
| pm | [ABRSM Practical Musicianship syllabus][pm] (linked from abrsm.org/en-gb/other-assessments/practical-musicianship, fetched 2026-10-08) | whole document, Grades 1-8. It says "A new Musicianship syllabus is planned"; its edition date is not printed, so whether it is still the current syllabus is unverified |
| th | [ABRSM Music Theory syllabus outline, Grades 1-5, from 2020][th] | whole document |
| pg | [ABRSM Music Performance Grades qualification specification, generic parts, second edition][pg] | the parts on the four-piece programme and the performance-as-a-whole criteria (pp.13 and 19) |
| prep | [Piano Dao review: ABRSM Piano Prep Test 2025 (2024-06-25)][prep] | the review's description of the four sections and the listening games; a secondary source |
| — | `docs/classifier/audits/iter1/completeness.md` (lines 1-321) and `docs/prompts/runs/curriculum-review-2026-10-05/ABILITY-MAP.md` (the 28 `#### A…` headings and their capability lines) | the inputs named in the brief |

### Not accessible or not read

| source | why |
| --- | --- |
| ABRSM Prep Test page, abrsm.org/en-gb/other-assessments/prep-test | HTTP 403 to the fetch tool; a browser-agent curl returned a 307 and no page. The Prep Test rows rest on the Piano Dao review (secondary) |
| ABRSM Prep Test book | not public |
| ABRSM alternative tests for blind, partially sighted, deaf and hearing-impaired candidates (abrsm.org/specificneeds) | not read |
| Trinity alternative supporting tests (trinitycollege.com/music-csn) | not read |
| Trinity "Piano Plus 2" accompaniment extracts | not public |
| Trinity Piano repertoire list (trinitycollege.com/piano, resource id 10125) | not read: the syllabus states the list rules (single list Init-5, groups A and B at 6-8); the individual pieces are Phase 1b material |
| ABRSM Performance Grades piano-specific section (one-hand options) | not read |
| ABRSM Music Theory Grades 6-8; Trinity Theory of Music grades | not read: not required by either piano syllabus (only ABRSM Theory Grade 5 is a prerequisite, and ABRSM Practical Musicianship Grade 5 is the alternative) |
| ABRSM Jazz Piano syllabus (an alternative Grade 6 prerequisite) | another source family's (jazz) |
| RCM (13 completeness lines c:84-c:96 and others citing only RCM) | another source family's |

[a27]: https://www.abrsm.org/sites/default/files/2026-06/Piano%20Practical%20Grades%20Qualification%20Specification%202027%20&%202028.pdf
[a25]: https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20&%202026%20Prac%20syllabus%2020240524_access.pdf
[tcl]: https://www.trinitycollege.com/resource?id=9079
[tacc]: https://www.trinitycollege.com/resource?id=10134
[pm]: https://www.abrsm.org/sites/default/files/2023-09/praccomplete10.pdf
[th]: https://www.abrsm.org/sites/default/files/2023-09/music-theory-syllabus-outline-grades-1-5-from-2020.pdf
[pg]: https://www.abrsm.org/sites/default/files/2023-10/00-performance-grades-qual-spec-generic-parts-230728.pdf
[prep]: https://pianodao.com/2024/06/25/abrsm-prep-test-2025/

## 4. Counts

Counted by script over this file (`build/at/count.py`, worktree-local, outside the tracked tree), which also checked that every AT id is unique and numbered without gaps, every ability row has eight cells, a source link and quotes under 15 words, every AT id cited in section 2 exists, and every AT id appears in section 2 at least once.

| count | value |
| --- | --- |
| abilities | 179 (AT-001 to AT-179) |
| by component | pieces and performance 23 (incl. programme, Prep tunes, accompanying), technical 39, sight-reading 52, aural 27, improvisation 10, musical knowledge and theory 19, composition 7, musicianship (transposition, score questions) 2 |
| by board | in both families 91; ABRSM family only (AB, Prep, PG, PM, Th) 52; Trinity only 36 |
| mapped to an existing ability (match) | 16 rows, to 9 of the 28: A1.1, A1.2, A2.1, A4.1, A4.2, A5.1, A6.2, A7f.1, A8.1 |
| related but not matching (near) | 26 rows |
| no existing ability | 137 rows |
| rows citing a completeness.md line | 112 |
| completeness.md syllabus lines checked | 105: kept 67, corrected 12, split 7, not checked (RCM) 19 |
| coverage lines (section 2) | 139 |
| covered | 127 (incl. 3 structural lines that point to the test rows below them, and the AB Grade 6 prerequisite line) |
| partly uncovered | 2 (ABRSM Theory Grades 4 and 5: questions on orchestral instruments and voices) |
| uncovered | 6 (ABRSM alternative tests; PG one-hand options; ABRSM Theory 6-8; Trinity alternative sight-reading formats; Trinity aural awareness test; the Piano Plus 2 extracts' content) |
| not abilities (n/a) | 4 (ossias, two administrative lines, digital filming) |
