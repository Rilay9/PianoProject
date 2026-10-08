# Abilities pass 1, correctness half: every row of `docs/classifier/abilities.md` (2026-10-08)

**Checker:** independent agent, did not write the list. **Base:** worktree cut from origin at cac27f54. **Scope:** FABLE.md section 2 (Phase 1a) and section 3 (judged by what a learner needs to progress at the piano; recorded scope rulings not reopened, disagreements stated as findings).

**Row count (measured):** `grep -oE '^\| *AB-[0-9]{3}' docs/classifier/abilities.md | sort -u | wc -l` = 207; rows with the full 10-cell section-1 layout = 207 (AB-001 to AB-207). This file has 207 verdict lines.

**How citations were checked (measured).** Every source URL in the four drafts' source lists was downloaded with curl on 2026-10-08 (70 URLs; scripts and texts under the worktree's `build/src/`, not committed). PDFs were converted with PyMuPDF page by page, HTML stripped to text. A script (`build/src/checkquotes.py`) pulled every quoted string from every row's sources cell (641 quotes over 207 rows) and searched for it, normalised (case, punctuation, quote marks), in the text of the source its key names. Result: 607 found verbatim; the 34 not found (33 missing, 1 partly found) were each opened by hand: 16 are music glyphs, table cells or "3rd" for "third" (time signatures, flats and sharps, the fermata and mf signs), which I confirmed on rendered page images (ABRSM 2027-28 p.16, Trinity p.81, RCM p.46) or in the text with the glyph replaced; 11 are on two Schott pages that refuse curl (HTTP 403) and were read through the fetch tool (its summariser returned the quoted phrases; not verbatim-checked); 5 are Berklee strings whose page wording has changed since the draft (meaning holds, words differ: noted per row); 1 is a Hal Leonard paraphrase (meaning holds); 1 is a real mis-citation (ILPN-227 at AB-195). A second script (`build/src/checkpages.py`) checked the cited page of every ABRSM, Trinity and RCM citation: 267 of 267 checkable cites land on the stated printed page (ABRSM printed page = PDF page minus 1; Trinity and RCM printed = PDF). The 28 citations of the reinstated draft rows behind AB-201 to AB-207 and the folded rows (AT-157, AT-159 to AT-174, AT-176, RC-084, RC-085, ST-165, ST-167) were checked the same way: 28 of 28 found.

Beyond presence, the level claims were checked against the tables themselves: the ABRSM sight-reading table (p.16, rendered image), the ABRSM speeds table (p.14), ABRSM scale pages for Initial, Grade 1, 7 and 8, the ABRSM Grade 7 aural page, Trinity's sight-reading table (p.81, image), Trinity Initial-Grade 2 technical pages and musical-knowledge table (p.89, image), RCM technical tests and ear tests for every level Prep A to 10 (pp.9, 14, 19-20, 25-26, 31-32, 38-39, 45-46, 53-54, 61-62, 70-71, 80-82, 91-93), the RCM list structure (p.4) and the Level 8 list (pp.72-73), the Faber correlation chart (all 3 pages), LCM Jazz (introductory notes pp.5, 8 and grade attribution of 31 quotes), ABRSM Jazz (16 quotes by grade), RSL Popular (technical and quick-study pages), RSL Keys (6 quotes by grade), Trinity Rock & Pop session-skills tables (pp.62-63), the Berklee Jazz Piano, Blues/Rock and Latin syllabi, Hal Leonard Latin Jazz Piano and Piano for Singers pages, Berklee ILPN-227.

**Verdicts.** OK: the row is a real ability at about the right level and its cited support holds. WRONG material: would change what is taught or how an item is placed. WRONG minor: otherwise. UNSURE: a judgement I could not settle, with the reason. "Q✓" in the evidence column = every quote in the row found verbatim in the named source by the script; "pg✓" = the cited page checked.

## 1. Row verdicts

| AB id | verdict | field(s) | the correction | evidence |
| --- | --- | --- | --- | --- |
| AB-001 | OK | | | aaio Q✓ ("How to Sit at the Piano." in the Alfred Adult contents) |
| AB-002 | OK | | | fcat Q✓ (braced third finger, Faber catalog) |
| AB-003 | OK | | | a1a Q✓; RCM p.9 "Fingering will be indicated for the first note only" read |
| AB-004 | WRONG minor | existing ability | A9.1 "in part: the stop condition" cannot rest on a row whose own cell says no method states a stop rule. Map as "A9.1 (in part: tension awareness, not the stop condition)". | tg1a Q✓ ("Relaxing shoulders prevents tension in the arms."); EL-113 cell |
| AB-005 | OK | | | tg1a Q✓ x4 |
| AB-006 | OK | | | hlb, aaio, tg1b Q✓; AT-174 (Th "Enharmonic equivalents") found |
| AB-007 | OK | | | fcorr Q✓ ("W-W-H-W", Faber 2A on the chart); tg1b Q✓; AT-173 found in Th |
| AB-008 | OK | | | tg1a Q✓ |
| AB-009 | OK | | | aaio, fpu8, tg1a, fad Q✓ |
| AB-010 | OK | | | tg1b Q✓ |
| AB-011 | OK | | | aaio Q✓ ("EXPANDING THE 5-FINGER POSITION") |
| AB-012 | OK | | | tg1b Q✓; fcorr 2B "Cross-hand arpeggios" read |
| AB-013 | OK | | | tg1a Q✓; RCM p.14 Prep B melody divided between the hands read |
| AB-014 | OK | | | tg1b Q✓; RCM p.9 Prep A LH-alone bass-clef melody read |
| AB-015 | OK | | | tg1a Q✓ x2; ABRSM p.16 "playing together" at Grade 2 (image) |
| AB-016 | OK | | | tg1b Q✓ |
| AB-017 | OK | | | Trinity p.76, p.79 Q✓ pg✓; RCM p.4 "List C: Inventions" (Levels 1-2), p.63 two-part inventions (L7), p.82 sinfonias and WTC prelude and fugue (L9), p.93 WTC (L10) read |
| AB-018 | OK | | | aaio Q✓ |
| AB-019 | OK | | | fcat Q✓ ("Let your R.H. wrist gently lift") |
| AB-020 | OK | | | aaio Q✓; Trinity p.79 "Finger & wrist strength and flexibility" Q✓ pg✓ |
| AB-021 | OK | | | RCM Q✓; ABRSM p.13, Trinity p.79 Q✓ pg✓ |
| AB-022 | OK | | | a1a Q✓ |
| AB-023 | OK | | | tg1a, fpu4, hlb x2, fpu5, hlfeat, fcorr, tg1b Q✓; fcorr L1 "Reading across the grand staff", 3A "Ledger lines" read |
| AB-024 | OK | | | hlb, tg1a, fpu7, aaio x2, fcat Q✓; fcorr L1 "2nd, 3rd, 4th, 5th, and Octave", 2B 6th, 3A 7th read |
| AB-025 | OK | | | tg1a Q✓; ABRSM p.16 (image): 2-note chords G3, 4-part chords G5, 3-part chords G8 |
| AB-026 | OK | | | ABRSM p.12, p.16 Q✓ pg✓ |
| AB-027 | WRONG material | parameters by level; level range | Cut time (2/2) appears only as "TCL G8" (at sight), and 3/8 only as "AB G3" (at sight). The Faber correlation chart lists "Common time and cut time" and "3/8, 6/8" at Level 3A (charted against RCM Level 1, ABRSM Grade 1). A prepared piece in 2/2 would be placed at Trinity Grade 8 by this row. Add FB 3A for 2/2, common time and 3/8 as the prepared level. | fcorr p.2 read ("Common time and cut time", Level 3A); Trinity p.81 image: 2/2 at Grade 8 (at sight); ABRSM p.16 image: 4/4 and 2/4 Initial, 3/4 G1, 3/8 G3 confirmed |
| AB-028 | WRONG material | parameters by level; level range | Only at-sight levels are given (AB G4, TCL G5, RCM L5). Faber teaches 6/8 at Level 3A, sixteenths in 6/8 at Level 4 and 12/8 at Level 5. Without the prepared level, a prepared 6/8 piece is placed three to four grades late. Add FB 3A (6/8), FB 4, FB 5 (12/8). | fcorr p.2 read; ABRSM p.16 image (6/8 G4, 9/8 G6, 12/8 G8); Trinity p.81 image (6/8 G5, 9/8 G7); RCM p.46 image (3/4, 4/4, 6/8 at L5) |
| AB-029 | OK | | | ABRSM p.16 image (5/8, 5/4 G6; 7/8, 7/4 G7); RCM p.82 "any" (L9) read |
| AB-030 | OK | | | Trinity p.81 image ("and changing time signatures", G8) |
| AB-031 | WRONG minor | level range (AT-088) | ABRSM Initial's rest is the semibreve (whole-bar) rest, not the crotchet rest; the minim rest and the crotchet rest both enter at Grade 1. Also: Faber teaches sixteenth-note rhythm patterns at Level 3B, absent from the parameters. | ABRSM p.16 rendered at 300 dpi: Initial shows a rest hanging below a line (semibreve), G1 a rest sitting on a line (minim) and a crotchet rest; fcorr 3B "16th-note rhythm patterns" |
| AB-032 | WRONG minor | parameters; level range | ABRSM sight-reading adds the dotted-quaver-semiquaver figure at Grade 3 (beamed dotted quaver and semiquaver, beside "simple semiquaver patterns"); the row gives the dotted eighth-sixteenth only as TCL G5. | ABRSM p.16 image, Grade 3 cell; Trinity p.81 image (dotted quaver G5) |
| AB-033 | OK | | | fpu9 Q✓; ABRSM p.16 "tied notes" G2; Trinity p.81 "and ties" G2 |
| AB-034 | OK | | | aaio Q✓; ABRSM p.16 triplets G6; Trinity p.81 duplets and triplets G8; fcorr 3A "the triplet" |
| AB-035 | OK | | | aaio Q✓; ABRSM p.16 simple syncopation G5 |
| AB-036 | OK | | | tg1a Q✓; ABRSM p.16 anacrusis G4; RCM p.71 "(may include an upbeat)" L8 (only L8 in the file, measured by search) |
| AB-037 | OK | | | tg1b Q✓; ABRSM-JP and LCM-R Q✓ (LCM G1 swung pentatonic, page 4); fcorr 3A "Swing rhythm" |
| AB-038 | OK | | | tg1a Q✓ |
| AB-039 | WRONG minor | parameters by level | E minor has one sharp, but the parameters put it (AB G2, TCL G4) under "two". Also "none (AB Init ...)" sits beside "one (AB Init D minor)": ABRSM Initial already has a one-flat key. Regroup: one = AB Init (D minor), G1 (G, F majors), G2 (E minor); TCL G1 (G), G3 (D minor), G4 (E minor), G5 (F). The other groups check out. | ABRSM p.16 image and Trinity p.81 image, key column read cell by cell |
| AB-040 | OK | | | tg1b Q✓; ABRSM p.16 accidentals in minor keys G1, chromatic notes G4; Trinity p.81 A minor with G-sharp G2, double sharps and flats G8 |
| AB-041 | OK | | | Trinity p.81 image (G5, G6, G7 modulation cells match) |
| AB-042 | OK | | | ABRSM p.16 clef changes G6 (treble and bass only, within the piano scope) |
| AB-043 | OK | | | tg1b Q✓; ABRSM p.16 8va G7 |
| AB-044 | OK | | | tg1b, tg1a Q✓; ABRSM p.12, Trinity p.76, RCM p.4 Q✓ pg✓ |
| AB-045 | OK | | | tg1b p.21 "NEW CONCEPT" fermata (glyph); ABRSM p.16 pause G4; Trinity p.81 pause G5 |
| AB-046 | OK | | | ABRSM p.15-16, Trinity p.80, RCM pp.9, 14, 26, 32, 46 Q✓ pg✓; ABRSM lengths 4/6/up to 8/c.8/c.8-12/c.12-16/c.16-20/c.1 page read in the image |
| AB-047 | OK | | | tg1a (mf glyph), aaio Q✓; ABRSM p.16 pp G2, ff G5; Trinity p.81 mf G1, mp G3, ff and pp G8 |
| AB-048 | OK | | | tg1a Q✓; ABRSM p.16 hairpins G1; Trinity p.81 hairpins G4, text G8; fcorr 2A |
| AB-049 | OK | | | fcat Q✓; Trinity p.77, p.79, p.81 Q✓ pg✓ |
| AB-050 | OK | | | fcat Q✓ x2; ABRSM p.16 legato phrases Init, slurs G1; Trinity p.81 simple phrasing Init, slurs G3 |
| AB-051 | OK | | | tg1a Q✓; ABRSM p.16 staccato Init; Trinity p.81 staccato G4 |
| AB-052 | OK | | | tg1b Q✓; ABRSM p.16 accents G1; Trinity p.81 accents G4 |
| AB-053 | OK | | | ABRSM p.16 tenuto G4; Trinity p.81 tenuto G8 |
| AB-054 | OK | | | tg1a Q✓; ABRSM p.53, Trinity p.90 Q✓ pg✓ |
| AB-055 | OK | | | tg1b Q✓; Trinity p.76, p.81 Q✓; fcorr 2A "Andante, moderato, allegro"; AT-163 found |
| AB-056 | OK | | | tg1b Q✓; ABRSM p.16 slowing at end G5, tempo changes G7, acceleration G8; Trinity p.81 rit., rall., a tempo, accel. G5 |
| AB-057 | OK | | | fpp Q✓; ABRSM p.16 right pedal G6; Trinity p.81 simple pedalling G5 |
| AB-058 | OK | | | fcat Q✓; fcorr 2B "Connected pedaling" |
| AB-059 | OK | | | ABRSM p.12 Q✓; Trinity p.81 image (G6, G7) |
| AB-060 | OK | | | ABRSM p.16 una corda G7 |
| AB-061 | WRONG minor | parameters by level | Parameters omit the earlier levels the merged sources give: Trinity names grace notes and ornaments at Grade 2 (AT-164, folded into this row), and Faber lists grace notes at Level 3B. | Trinity p.88 "Grace notes and ornaments" found (AT-164); fcorr 3B "Grace notes"; ABRSM p.16 simple ornaments G8 |
| AB-062 | OK | | | ABRSM p.59, Trinity p.70, prep Q✓; AT-162 found |
| AB-063 | OK | | | ABRSM p.11 Q✓ |
| AB-064 | OK | | | ABRSM p.53, Trinity p.90 Q✓ |
| AB-065 | OK | | | ABRSM p.53, Trinity p.90 Q✓ |
| AB-066 | OK | | | ABRSM p.59, Trinity p.70 Q✓; A4.1 mapping right |
| AB-067 | OK | | | ABRSM, Trinity, RCM p.5, LCM-R p.8, ABRSM-JPG Q✓; RCM p.82 memory marks deducted at L9-10 read |
| AB-068 | OK | | | BK-JAZZ Q✓; the Berklee syllabus also lists "Memorize the Song" in lesson 9 |
| AB-069 | OK | | | PG p.13, Trinity p.55, RCM p.8, p.82, ABRSM-JPG Q✓; RCM p.72 four pieces L8, p.93 five pieces and 30 minutes L10 read |
| AB-070 | WRONG minor | ability | As worded ("fast-moving music with finger agility") it cannot be told from playing any quick piece; the ABRSM list A descriptor names a kind of piece, not a skill. Restate measurably, e.g. "play running passagework evenly at the piece's tempo", or fold into AB-065 with passagework as a parameter. | ABRSM p.11, Trinity p.76 Q✓ |
| AB-071 | WRONG minor | ability; merge | Same: a list descriptor. Its content (tone colour, balance, shaping) is AB-054, AB-049 and AB-063. Join with those. | ABRSM p.11, Trinity p.77 Q✓ |
| AB-072 | OK | | | ABRSM p.11, Trinity p.55 Q✓ |
| AB-073 | WRONG minor | ability; merge | "Perform a Baroque piece" names a list, not something a learner can be seen to do beyond AB-065. The period lists are AB-072's parameters (RCM List A to E by level). Fold AB-073 to AB-076 into AB-072, or restate each as the period's playing demands. No source read states those demands. | RCM p.4 list structure read: L1-2 A Baroque and Classical, B Romantic/20th/21st, C Inventions; L3-7 A, B, C; L8-9 A to D; L10 A (Bach) to E |
| AB-074 | WRONG material | ability; parameters by level | (1) "RCM List B L1-10": at Levels 1-2 Classical pieces are in List A, and List B is Romantic, 20th and 21st century. (2) "sonatinas L1-7, sonata movements L8-10" is wrong: the Level 8 List B prints many sonatinas (Beethoven WoO 47, Clementi Op. 36 No. 5, Kuhlau Op. 20, 55 and 60). A sonatina would be misplaced by this row. (3) The ability needs the same restating as AB-073. | RCM p.4 read; RCM p.73 (Level 8 list) "Sonatina" entries found by search and read; p.78 "(complete)" is the Level 9 list (complete sonatas L9 is right) |
| AB-075 | WRONG minor | ability; merge | As AB-073 (a list, not a skill). | RCM p.4 Q✓ |
| AB-076 | WRONG minor | ability; merge | As AB-073. | RCM p.4 Q✓ |
| AB-077 | WRONG minor | ability | As worded it is an exam component ("perform études at the level"); the RCM names neither the skill nor a tempo. If kept, state it as A7f.2's ability: play a study at its marked tempo with its target technique intact. The RCM supports only the count (one at L1-2, two from L3). | RCM p.19 one étude (L1), p.31 "two technically contrasting etudes" (L3), p.7 Q✓ |
| AB-078 | WRONG minor | ability | An exam substitution rule (a popular piece may replace an étude), not an ability. Drop it, or fold the popular repertoire into AB-072 and AB-179. | RCM p.5, pop p.2 Q✓; RCM p.19 note "Students may substitute a popular selection" |
| AB-079 | WRONG minor | ability | Trinity Accompanying Group C is a repertoire category (piano-solo arrangements). It names no skill beyond AB-065. Drop it, or restate as reading orchestral-reduction textures if a source supports that. | tacc Q✓ ("Group C (piano solo)") |
| AB-080 | OK | | | Trinity p.71 Q✓ |
| AB-081 | WRONG minor | parameters by level | RCM Prep A already has D major ("C, G, D major / A minor"); the summary puts D at "FB 2A, RCM Prep B". The member cell EL-053 is right. | RCM p.9 and p.14 read |
| AB-082 | OK | | | ABRSM pp.20, 23, 26, 35, 38 and Trinity pp.79, 100, 109, 115 Q✓ pg✓; ABRSM G1 "C major 1 oct. hands together" read; RCM p.14 (Prep B 1 oct), p.19 (L1 2 oct HS), p.31 (L3 HT), p.70 (L8 four octaves), "All scales are to be played legato" read |
| AB-083 | OK | | | a25, ABRSM pp.20, 29, 38, Trinity pp.97, 115 Q✓; RCM p.19 natural and harmonic (L1), p.25 harmonic and melodic (L2); Trinity p.97 Initial natural allowed, p.103 G2 harmonic or melodic only |
| AB-084 | OK | | | a25, ABRSM pp.20, 32, RCM p.14, Trinity pp.100, 112 Q✓; ABRSM G7 and G8 pages: four majors and four harmonic minors in contrary motion |
| AB-085 | OK | | | RCM p.25 (L2) to p.80 (L9) "Formula Pattern" found, absent at L10 (p.91 read) |
| AB-086 | OK | | | ABRSM pp.26, 32, Trinity p.103 Q✓; RCM chromatic L1-4 HS 1 oct, L5 HT 1 oct, L6-8 HT 2 oct, L9 HT 4 oct read |
| AB-087 | OK | | | ABRSM pp.29, 35, Trinity pp.100, 118 Q✓; ABRSM G7 "hands starting a minor third apart" read |
| AB-088 | OK | | | ABRSM pp.41, 44, RCM p.91 Q✓ |
| AB-089 | OK | | | ABRSM pp.41, 44, Trinity p.115 Q✓ |
| AB-090 | OK | | | RCM pp.80, 91 Q✓ (broken legato is the small-hands option, p.80 footnote read) |
| AB-091 | OK | | | ABRSM p.44, LCM-R (G8), RSL-P Q✓; RSL Popular G6 diminished scale, G8 whole-tone and augmented arpeggios read |
| AB-092 | OK | | | ABRSM-JP (G1), LCM-R (G2, G7) Q✓, grades confirmed by page |
| AB-093 | OK | | | ABRSM-JP Q✓ (G1) |
| AB-094 | OK | | | ABRSM-JP (G2), LCM-R (G3) Q✓ |
| AB-095 | OK | | | Trinity pp.103, 118, p.39 Q✓ |
| AB-096 | OK | | | ABRSM p.12, Trinity p.79, RCM p.7 Q✓ |
| AB-097 | OK | | | ABRSM p.14 speeds table read (54 to 100 crotchet, then minim 60 to 88; arpeggios 52 to 80, minim 44 to 66: as stated); Trinity p.97 q=60 Initial, p.100 q=70 G1, p.103 q=80 G2 read |
| AB-098 | OK | | | ABRSM p.13, RCM p.120 Q✓ |
| AB-099 | OK | | | RCM p.9 triad sequence (broken and solid, C major, HS) read |
| AB-100 | OK | | | aaio, RCM pp.121, 80, 45, 53 Q✓; RCM L6 dominant 7th and LT diminished 7th solid chords read |
| AB-101 | OK | | | a25, RCM, ABRSM p.20, Trinity pp.97, 79, RCM pp.14, 61, 80, 45, 53 Q✓; four-note broken L7-9, alternate-note option L9 and required L10 read |
| AB-102 | WRONG minor | parameters by level | Faber lists one-octave arpeggios at Level 3A (charted to ABRSM Grade 1, RCM Level 1); the prepared method level is missing. | fcorr p.2 "One-octave arpeggios" 3A; ABRSM G7 "first inversion only", G8 "second inversion only" read; RCM p.53 root only HS (L6), p.70 root and inversions 4 oct (L8) read |
| AB-103 | OK | | | ABRSM pp.13, 35, Trinity p.113, RCM pp.53, 80, ABRSM-JP, LCM-R, RSL-K Q✓; RCM L8 dominant 7th arpeggio root only HT, L9 inversions read |
| AB-104 | OK | | | Trinity p.119 Q✓ |
| AB-105 | WRONG minor | existing ability | Faber's I, IV and V7 "in C, G, and F" is a I-IV-V7 played in more than one key, so this row is A2.1 in part (section 5 says no member names it). The levels check: RCM p.70 (L8) ends with I-IV-V6/4-5/3-I, p.80 (L9) with I-VI-IV-V6/4-V8-7-I. | fcat Q✓ x2; RCM pp.45, 70, 80 read; RSL-K Q✓ |
| AB-106 | OK | | | fcat Q✓; fcorr L1 "Tonic and dominant notes" |
| AB-107 | OK | | | aaio Q✓; fcorr 3A "Ostinato and alberti bass" |
| AB-108 | OK | | | aaio, LCM-R (Step 1-2) Q✓; Trinity Rock & Pop pp.62-63 chord-vocabulary row by grade read |
| AB-109 | OK | | | fcat, RCM pp.46, 62, 82, thy p.33, pm, ABRSM-JPG, RSL-P Q✓; RCM lead-sheet option L5-10 read (L7-8 "encouraged", L9-10 "expected"); RSL quick study G6 and G8 read |
| AB-110 | OK | | | ABRSM-JPG, LEV, LCM-R, Trinity Rock & Pop Q✓ |
| AB-111 | OK | | | fcat Q✓; BYU Q✓ (an organ course); AT-171 found in Th |
| AB-112 | UNSURE | ability (learner need) | A real at-keyboard ability, sourced only from RCM Keyboard Harmony (an optional substitute for the written Level 9 Harmony exam) and ABRSM Practical Musicianship G7-8. Whether figured-bass realisation is something this learner needs to progress at the piano is an owner judgement; nothing in the sources settles it. | pm, thy pp.33-34 Q✓; thy p.32 "may be substituted for the Level 9 Harmony Examination" read |
| AB-113 | OK | | | thy p.33 Q✓ (useful beyond the exam: sequences recur in Baroque and popular music) |
| AB-114 | OK | | | thy p.32 Q✓ |
| AB-115 | OK | | | thy p.33 Q✓ |
| AB-116 | WRONG minor | existing ability | BYU's song-or-hymn transposition also supports A7g.1 in part ("play one hymn in a second key"); add it. | fcorr, pm, BYU Q✓ |
| AB-117 | OK | | | prep, ABRSM p.48, pm, RCM pp.9, 46, RSL-P, Trinity R&P, ABRSM-JP, RSL-K Q✓; RCM playback Prep A 3 notes (4 long), Prep B major or minor, L1-4 five notes, L5 five plus upper tonic, L6-8 complete scale read |
| AB-118 | OK | | | ABRSM p.50, RCM p.81 Q✓; ABRSM G7 lower part read |
| AB-119 | OK | | | RSL-K Q✓ (G1 and G2 pages) |
| AB-120 | OK | | | pm, RCM p.92 Q✓ (L10 harmonise with I, IV, V in solid chords read), PBE Q✓ |
| AB-121 | OK | | | ABRSM p.46, prep, Trinity pp.99, 114, a25, ABRSM-JP Q✓; ABRSM G7 "two time, three time, four time or 6/8 time" read on p.51 |
| AB-122 | OK | | | ABRSM pp.46, 48, pm, RCM p.9, ABRSM-JP, RSL-K Q✓ |
| AB-123 | OK | | | RCM p.9 Q✓; "Tap a steady beat" found at every level p.9 to p.92; rhythm of a melody from L4 (p.39) read; 6/8 at L5 (p.46 image) |
| AB-124 | OK | | | ABRSM-JP (G4-5), LCM-R (G1) Q✓ |
| AB-125 | OK | | | ABRSM p.46, pm, a25, ABRSM-JP Q✓; Trinity "not required to sing" |
| AB-126 | WRONG material | scope | The section 3 decision keeps "clapping, tapping and singing back". Singing from a score at sight is not singing back: it is sight-singing, a vocal reading skill used by no other row and not needed to play. The row stays only if the owner widens the ruling. The disagreement is with how the merge applied the ruling, not with the ruling. | ABRSM pp.48, 50, pm Q✓ (the tests are real); section 3 text read |
| AB-127 | UNSURE | scope | Singing or humming an interval is RCM's alternative way to answer the interval test whose hearing is AB-135. It is singing, but not singing back; whether it counts under the ruling is the owner's call. | RCM p.20 Q✓ ("Students may choose to sing or hum") |
| AB-128 | OK | | | Trinity p.102 Q✓ |
| AB-129 | OK | | | ABRSM p.46, Trinity p.105 Q✓ |
| AB-130 | OK | | | Trinity p.108, pm Q✓ (following a score while listening serves reading) |
| AB-131 | OK | | | ABRSM pp.46-47, Trinity p.99, a25 Q✓ |
| AB-132 | OK | | | ABRSM p.47, Trinity p.108 Q✓ |
| AB-133 | OK | | | ABRSM pp.48-49 Q✓ |
| AB-134 | WRONG minor | ability | "its key and modulations" duplicates AB-132 (tonality) and AB-138 (the key it modulates to); no member of this row asks it. Drop that clause. | ABRSM p.52, Trinity p.123, LCM-R (G8) Q✓; AT-139 and ST-150 cells read |
| AB-135 | OK | | | Trinity p.108, RCM pp.20, 46 Q✓; RCM L1 m3/M3, L2 +P5, L3 +P4, L4 +P8, L5-9 melodic then harmonic, L8 tritone, L10 either form and 9ths read |
| AB-136 | OK | | | ABRSM p.50, Trinity p.114 Q✓; ABRSM G7 perfect, imperfect, interrupted read |
| AB-137 | OK | | | ABRSM p.51, RCM pp.46, 71, RSL-P Q✓; RCM L7 adds I-IV-V, L8 each chord of four, L10 five read |
| AB-138 | OK | | | ABRSM p.51, Trinity p.117 Q✓ |
| AB-139 | OK | | | RCM pp.9, 46 Q✓; RCM L6 dim 7th, L7 augmented, L9 four-note chords with first inversion, L10 major-major and minor-minor 7th read |
| AB-140 | OK | | | RCM p.32 Q✓ (L3 and L4 read) |
| AB-141 | OK | merge (see section 2) | | LCM-R G6 and G7 aural Q✓ |
| AB-142 | OK | | | MAU, BK-LAT Q✓ |
| AB-143 | OK | | | LCM-R G5 Q✓ |
| AB-144 | OK | | | hlb, Trinity p.82 Q✓ |
| AB-145 | OK | | | Trinity p.85, pm, Trinity R&P Q✓ |
| AB-146 | OK | | | Trinity p.86, Trinity R&P, RSL-P Q✓; RSL Popular I&I lengths G1-5 read |
| AB-147 | OK | merge (see section 2) | ST-161's "not found at Level 9" is wrong: RCM p.81 (L9) offers the improvised-answer option, as RC-063 says. | pm, ABRSM-JP, LCM-R, RCM pp.46, 62, 81, thy pp.32, 34 Q✓ pg✓ |
| AB-148 | OK | | | pm, ABRSM-JP, LCM-S Q✓ |
| AB-149 | OK | | | pm Q✓ |
| AB-150 | OK | | | LEV, HL-BLUES, PBE, LCM-R (G5) Q✓ |
| AB-151 | OK | | | BK-JAZZ lesson 10 Q✓; the outcome now reads "chord tones, approach notes, pentatonic, and blues scales" (page wording changed; support holds); ABRSM-JPG Q✓ |
| AB-152 | OK | | | LEV Q✓; REJ: curl 403, fetch tool returned "horizontal and vertical improvisation" and "Grade 4 standard and above"; ABRSM-JP Q✓ |
| AB-153 | OK | | | Trinity R&P G4 and G8 Q✓ |
| AB-154 | WRONG minor | sources | The sources cell lists AT-023 and ST-165 as "reinstated", but both are writing a composition down on paper, which section 3's decision keeps out. Section 5 also says the same rows are dropped. Remove them (recording a take is the kept way of keeping the piece), or record the owner's reversal. | Trinity pp.78, 97, 100, 103, 106, 109, 118, 121 Q✓; ST-165 "A lead sheet with lyrics, chords and melody line" found in Trinity R&P |
| AB-155 | WRONG minor | ability; merge | "Create original keyboard parts in a style" from a course outcome is not separable from AB-179 (play grooves in named styles) and AB-178. Join with AB-179. | BK-BR outcomes read: now "create original, stylistically appropriate keyboard parts" (wording changed); BK-LAT Q✓ |
| AB-156 | OK | | | ABRSM-JPG Q✓ |
| AB-157 | OK | | | ABRSM-JPG Q✓; LCM-R p.5 "increasing amount of embellishment and fills" for Grades 3 and 4 read |
| AB-158 | OK | | | ABRSM-JP, ABRSM-JPG, LCM-R Q✓; LCM-R p.5 head and two choruses at Grades 6-8 read |
| AB-159 | OK | | | LCM-R G5 Q✓; ABRSM-JP "Three-Four" title on the G4 page |
| AB-160 | OK | | | LCM-R G8 Q✓ (p.5 "iconic vamps, Grade 8") |
| AB-161 | WRONG minor | ability; merge | LCM's line is advice on choosing a free-choice piece ("some hymns also sometimes lend themselves"), not a separate ability. Fold into AB-157 (embellish a head in style) or AB-172 (arrange a tune). | LCM-R p.8 read |
| AB-162 | OK | | | LEV, LCM-R G7 Q✓ |
| AB-163 | WRONG minor | sources; existing ability | Support is stronger than the row says: the Berklee lesson 8 syllabus lists "Using Minor Key II V I in A/B Form", not only the title. Replace the "weakly sourced" note and cite the topic; A7b.1's mapping need not be marked weak. | BK-JAZZ syllabus text read |
| AB-164 | OK | | | LEV, BK-JAZZ Q✓; RIB chapter 4 confirmed through the fetch tool (curl 403) |
| AB-165 | OK | | | LEV Q✓; REJ "rootless voicings" through the fetch tool |
| AB-166 | OK | | | LEV, LCM-R G8 Q✓ |
| AB-167 | OK | | | LEV, LCM-R G8 Q✓ |
| AB-168 | OK | | | LEV Q✓; REJ "two-handed voicings" through the fetch tool |
| AB-169 | OK | | | LEV, LCM-R G7 Q✓ |
| AB-170 | OK | | | LEV Q✓ |
| AB-171 | OK | | | BK-JAZZ, HL-BLUES Q✓; REJ through the fetch tool. The same Berklee lesson 6 also lists "The 'Two' Feel", which bears on A10.1 (section 3 below) |
| AB-172 | OK | | | BK-JAZZ lessons 11-12, RSL-P, Trinity R&P Q✓ |
| AB-173 | OK | | | aaio, BK-JAZZ, RSL-K (G3), LCM-R (G6) Q✓; RIB chapters 1-3 through the fetch tool |
| AB-174 | OK | | | HL-BLUES, HL-BW Q✓; RIB through the fetch tool ("around grade 3" confirmed); BK-BR outcomes and lessons 4, 9 read (wording changed, meaning holds) |
| AB-175 | WRONG minor | sources; existing ability | Berklee Blues/Rock lesson 5 lists "Intros, Turnarounds, and Endings", so blues intros have a source. Section 5's A7a.2 gap ("a blues intro: no member") closes. Add the citation and extend the row to intros. | BK-BR syllabus read; HL-BLUES, LCM-R Q✓ (LCM turnarounds Grades 3-4, p.5) |
| AB-176 | OK | | | RIB chapter 5 through the fetch tool; RSL-K G5 chords i and iv, i and v found as "Chords i & iv and i & v" |
| AB-177 | OK | | | BK-BR lessons 6-7, HL-STRIDE Q✓ |
| AB-178 | OK | | | BK-POP, Trinity R&P G1 Q✓ |
| AB-179 | OK | | | Trinity R&P pp.62-63 styles by grade read (as stated), BK-POP, HL-ROCK, BK-BR, HL-GOSPEL Q✓ |
| AB-180 | OK | | | RSL-K G3, Trinity R&P G6 Q✓ |
| AB-181 | OK | | | Trinity R&P Q✓ (the row's own note limits it on acoustic piano) |
| AB-182 | OK | | | BK-BR outcome read (now "for both solo piano and band performance settings"; meaning holds) |
| AB-183 | OK | | | JOP Q✓ x4, HL-STRIDE Q✓ |
| AB-184 | OK | | | LEV, BK-INT, LCM-R G8 Q✓ (the beat assignment is flagged unverified in the row itself) |
| AB-185 | OK | | | MAU Q✓ |
| AB-186 | OK | | | MAU, SHER, ILPN246 Q✓ (patterns not printed: flagged in the row) |
| AB-187 | OK | | | MAU, BK-LAT Q✓ |
| AB-188 | OK | | | BK-JAZZ lesson 7, BK-LAT, HL-BRAZ Q✓ |
| AB-189 | OK | | | BK-LAT Q✓ |
| AB-190 | OK | | | LW Q✓ x2 |
| AB-191 | OK | | | HL-LJ read: "as a member of an accompanying rhythm section; as a lead instrument within an ensemble; and as a soloist" supports the roles; the quoted list is a paraphrase |
| AB-192 | OK | | | BK-LAT, MAU Q✓ |
| AB-193 | OK | | | LDS Q✓ x3 |
| AB-194 | OK | | | LDS Q✓ |
| AB-195 | WRONG minor | sources | (1) ILPN-227 is "keyboard skills for self-accompanying vocalists": that supports AB-197, not accompanying a singer; move it. (2) "Berklee Latin: 'piano accompanying a singer' (search-result text)" is not on the Berklee Latin page (searched). Drop it. The row still stands on LDS, BYU, Trinity Accompanying (p.124 Q✓) and HL *Piano for Singers* ("Learn to Accompany Yourself and Others", read). | ILPN227 and BK-LAT text searched; HL-SING read; Trinity p.124 Q✓ |
| AB-196 | OK | | | PG-WALK, PG-HYMN Q✓ |
| AB-197 | OK | | | ILPN227 Q✓ |
| AB-198 | OK | | | ABRSM p.11, Trinity p.77, a25, LCM-R G1 Q✓ |
| AB-199 | OK | | | ABRSM-JPG, LCM-R Q✓ |
| AB-200 | OK | | | BK-INT, BK-POP Q✓ |
| AB-201 | WRONG minor | merge; levels; tracks | Duplicates AB-023 (find and play notes on the grand staff with ledger lines). Join AB-023, carrying AT-157's levels: Trinity musical knowledge Initial (letter names), G1 (two ledger lines), G2 (three). The Theory levels are written work and should not carry. As it stands the row has no levels ("see the draft rows"), no tracks and "none" where the list's vocabulary is NEW. | AT-157 draft row; Trinity p.88 "Notes on ledger lines (up to 2 ledger lines)" found; Th found |
| AB-202 | WRONG minor | levels; tracks | A real learner ability (a learning strategy), but its cells are empty. Fill them: Trinity G3 (musical knowledge, asked about the candidate's own piece); tracks core and classical. | Trinity p.89 image: G3 "Scale/arpeggio/ broken chord patterns" |
| AB-203 | WRONG minor | merge; ability; levels | As "find and play" it duplicates AB-100 and AB-105. The Trinity source asks the learner to name the notes of the tonic and dominant (G4) and subdominant (G5) triads in their own piece: that recognition belongs with AB-204. Inversions come only from ABRSM Theory G5 (written). | Trinity p.89 image (G4 b, G5 c); Th found |
| AB-204 | WRONG minor | levels; tracks | A real ability within the ruling (recognition in the music one plays). Cells are empty. Fill: RCM Keyboard Harmony 9-10 (name each chord's function after playing it); ABRSM Theory G5 cadences (written, level reference only); PM G7-8 score questions. | thy p.33, Th, pm found |
| AB-205 | WRONG minor | levels; tracks | Fill: Trinity G4 (relative major or minor, subdominant, dominant), about the candidate's own piece. | Trinity p.89 image |
| AB-206 | WRONG minor | levels; ability | Fill: Trinity G5; RCM KH9 (binary, rounded binary, ternary) and KH10 (compound ternary, rondo, sonata, fugal exposition). The clause "use them to learn and memorise it" has no source among the members; mark it as a reading or drop it. | Trinity p.89 image; thy p.33, p.35 found |
| AB-207 | WRONG minor | levels; merge | Fill: Trinity G5; LCM musical awareness G1-8. "Let them shape the performance" is AB-063's content; keep this row to recognising the period and style. | Trinity p.89 image; LCM-R Q✓ (ST-167 quotes) |

## 2. The 12 merge calls of section 8.1

| # | call | verdict | reason |
| --- | --- | --- | --- |
| 1 | AB-083 holds natural, harmonic and melodic minor in one row | agree | The form is a parameter of one act (play the minor scale asked for); the boards let candidates choose a form until Grade 6, and RCM requires named forms by level (L1 natural and harmonic, L2 on harmonic and melodic; RCM pp.19, 25). No source read grades a form as a separate skill. |
| 2 | AB-082 holds one to four octaves, hands separate and together, legato and staccato | agree | Range, hands and articulation are graded parameters in all three boards' tables; the special forms (contrary, chromatic, thirds and sixths apart, double notes, octaves) are rightly separate, because each is a different coordination. |
| 3 | Block (AB-100) and broken (AB-101) chords carry every chord type; arpeggios split triad (AB-102) and seventh or ninth (AB-103) | agree, with a join | The split follows how RCM and ABRSM table them. Two later rows duplicate AB-100 and should join it or AB-204: AB-099 can stay (RCM's diatonic triad sequence is its own exercise), but AB-203 should go (see its row). |
| 4 | AB-046 folds hands and position into one sight-reading row | agree | Hands (separate, divided, together) and position (five-finger, beyond) are graded parameters of one act, and the element rows carry their own at-sight levels. |
| 5 | AB-023 merges treble and bass reading with the reading range; AB-024 apart | agree, with a join | Methods teach the clefs as units, but reading a note and playing it is one act across both. Intervals (AB-024) are a different reading strategy and rightly separate. AB-201 duplicates AB-023 and should join it. |
| 6 | Metre split four ways (simple, compound, irregular, changing) | agree | Compound metre changes the beat's subdivision; irregular metres change the beat grouping; both change what the learner counts. Changing metres (AB-030) could join AB-029, but Trinity G8 sets changes without naming irregular metres, so keeping them apart costs nothing. |
| 7 | AB-147 merges call-and-response answers over a groove, RCM's period answers and KH modulating consequents; AB-148 separate | agree | The act is the same: improvise an answer to a heard or given question in time. Modulation and period type are graded parameters. Continuing a given opening (AB-148) differs: the learner extends rather than answers. |
| 8 | AB-141 (jazz chords and progressions by ear) apart from AB-139 (chord quality by ear) | disagree in part | The chord-quality part of AB-141 (major 7, minor 7, dominant 7) is AB-139's act; RCM L10 already asks major-major 7th and minor-minor 7th (p.92). Move those qualities into AB-139 as parameters (LCM G6-8 beside RCM L10). Keep AB-141 for function and substitution (II7 against V7, tritone substitute against sus chord) and modes by ear. |
| 9 | AB-154 merges the Trinity composition craft rows into one compose-and-perform row | agree | The craft rows are features Trinity expects by grade in one task. Separately they are not abilities a learner shows apart from making a piece. (The writing-down citations are a separate finding: AB-154 row.) |
| 10 | AB-131 merges dynamics, articulation and tempo by ear; AB-133 and AB-134 apart | agree | One ABRSM test offers them as options and they are judged the same way. Character and style (AB-133) and structure (AB-134) need different listening. AB-134's "key and modulations" clause should go (see its row). |
| 11 | AB-195 merges a written accompaniment rehearsed with a soloist and chord-based accompaniment of singers | agree, conditionally | The shared ability is accompanying: following the soloist or singers, balancing under them, keeping them together. Where the notes come from (a written part, or chords) is already AB-065 and AB-109 or AB-110. Keep the row about the accompanying act and fix its citations (see its row). |
| 12 | AB-062 kept as its own row though it aggregates the 1.D element rows | agree | Realising every printed mark at once in a piece is harder than each mark alone. ABRSM's "well-realised detail" and Trinity's attention to dynamics and articulation assess the combination. |

## 3. Citations opened

**Opened and verified (downloaded 2026-10-08, text-searched by script, pages checked as stated above):** ABRSM Piano Practical Grades 2027-28 [a27] (106 quotes; sight-reading table, speeds table and scale pages also read as images or text); ABRSM 2025-26 [a25 / EL "abrsm"] (10); Trinity classical piano syllabus [tcl] (98; p.81 and p.89 tables rendered); Trinity Piano Accompanying list [tacc] (1); ABRSM Practical Musicianship [pm] (15); ABRSM Theory outline [th] (reinstated rows, 9); ABRSM Performance Grades [pg] (1); Piano Dao Prep Test review [prep] (3); Faber correlation chart [fcorr] (5; all 3 pages read); Faber catalog [fcat] (13); Faber Primer lesson page [fpp] and unit pages 4, 5, 7, 8, 9, 10 (7); Faber Adult contents [fad] (2); Hal Leonard Primer concepts [hlfeat] (1); Alfred Adult All-in-One contents [aaio] (17); Alfred 1A outline [a1a] (2); Alfred teacher's guides 1A [tg1a] (23) and 1B [tg1b] (18); Alfred level overview [aov] (1); Hal Leonard brochure [hlb] (6); RCM Piano Syllabus 2022 [rcm] (94; every level's technical and ear-test pages read); RCM Theory Syllabus [thy] (9 plus reinstated); RCM Popular Selection List [pop] (1); ABRSM Jazz Piano G1-5 [ABRSM-JP] (18) and Performance Grades [ABRSM-JPG] (13); Trinity Rock & Pop [TCL] (17 plus ST-165); RSL Band Based Keys [RSL-K] (9); RSL Popular Piano [RSL-P] (9); LCM Jazz syllabus [LCM-S] (1) and repertoire list [LCM-R] (35 plus ST-167); Levine sample [LEV] (15); Mauleón contents [MAU] (12); Joplin [JOP] (4); Link and Wendland [LW] (2); LDS Keyboard Course [LDS] (5); Sher Music [SHER] (2); Hal Leonard product pages Blues, Boogie-Woogie, Stride, Brazilian, Latin Jazz, Rock, Gospel (11), and Piano for Singers (read for AB-195; no row quotes it); Berklee Online Jazz, Blues/Rock, Pop/Rock, Latin, Intermediate Keyboard (33; five Berklee strings have changed wording since the draft, meaning unchanged); Berklee ILPN-227, ILPN-246 (4); BYU catalogue (3); PianoGroove pages (2); Piano Dao *Piano by Ear* review [PBE] (2).

**Opened only through the fetch tool (curl got HTTP 403; quotes reported by the tool's summariser, not verbatim-checked):** Schott *Improvising Blues Piano* [RIB] (chapters 1-5, left-hand patterns, co-ordination exercises, "around grade 3"); Schott *Exploring Jazz Piano 1* [REJ] (rootless voicings, two-handed voicings, walking bass lines, horizontal and vertical improvisation, Grade 4 and above).

**Could not open:** ABRSM jazz piano web page [ABRSM-WEB] (redirect loop; no row rests on it alone). Not cited by any row, so not checked against a row: Alfred Adult Book 2 [aaio2], Hal Leonard Book 1 page [hl1], RSL keyboard web page, RSCM page, Trinity Rock & Pop Grade 4 page (all downloaded).

**What was not checked:** method-book page numbers (the books were not read by the drafts either; the placements rest on contents pages and teacher's guides, whose quoted lines are verified). The truth of the drafts' "Not found in sources read" claims was not re-searched. No score was heard.

**Findings outside single rows (for the merger; not verdict lines).**
- Stale document parts after the 2026-10-08 reinstatement (measured by reading): section 7 still counts 200 abilities and 130 NEW; section 4's heading says the rows are "all BORDERLINE" while each cell says "kept"; section 5 says A8.1's support is all BORDERLINE, says A5.1's rows AT-168, AT-172, RC-084, RC-085 and ST-167 are dropped (they are now in AB-204 to AB-207), and says A6.2's AT-023 and ST-165 are dropped while AB-154 cites them; section 3 is still headed "Dropped" over rows that are now reinstated.
- Mapping to the 28: A2.1 has AB-105 in part (I-IV-V7 in C, G and F); A7g.1 has AB-116 in part (hymn transposition); A7a.2's intro gap closes (AB-175); A7b.1's support is not weak (AB-163); A10.1's "two-feel bass" gap has a source (Berklee Jazz lesson 6, "The 'Two' Feel"), not yet on any row. The other mappings in section 5 were checked against the ABILITY-MAP capability lines and hold.
- Missing levels the Faber chart supplies, not in any row: binary and ternary form (3A), motive and sequence (3B), 12 major and minor triads (3B), cadences in major and minor keys (Level 5), circle of fifths (5). These are completeness-half items, listed here because they turned up while checking.

## 4. Counts

| verdict | rows |
| --- | --- |
| OK | 170 |
| WRONG material | 4 |
| WRONG minor | 31 |
| UNSURE | 2 |
| total | 207 |

Counted by script over the verdict column of section 1 (`cut -d'|' -f3 | sort | uniq -c`). WRONG material: AB-027, AB-028, AB-074, AB-126 (the last is a scope reading the owner may settle the other way). UNSURE: AB-112, AB-127.
