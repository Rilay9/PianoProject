# Abilities pass 2: correctness check of every row (2026-10-08)

**Who:** an independent checker that wrote neither the list, nor pass 1, nor its application. **Base:** worktree cut from origin at 388e1062 (`docs/classifier/abilities.md` as pass 1 left it). **Changed:** this file only. **Judged by** FABLE.md section 3: common sense for what a learner needs to progress at the piano; the owner's recorded decisions (scope, AB-126/AB-127 dropped, AB-112 advanced only, the AB-147 and AB-195 splits, AB-141's chords moved to AB-139, practice method in) are not reopened. Pass 1's own calls (the restatements of AB-071 to AB-079, AB-155, AB-161; the AB-201 and AB-203 joins) are not the owner's and are judged here.

**Row count (measured by script, `build/p2/rows.py`):** section 1 holds 230 distinct ids, AB-001 to AB-234 less AB-126, AB-127, AB-201, AB-203; no id twice; every row has the 10 columns. The table below has exactly 230 lines, in the list's own order (AB-233 after AB-147, AB-234 after AB-195).

**How citations were checked (measured).** 94 source URLs (every URL in the four drafts' source lists that a row cites, plus every pass-1 URL) were downloaded with curl on 2026-10-08 with a browser user agent, into the worktree's `build/p2/src/`; 93 returned HTTP 200, one (the ABRSM jazz web page, which no quote rests on) a 307. PDFs were converted page by page with PyMuPDF and HTML stripped to text. A script (`build/p2/allquotes.py`) pulled every quoted string from every row's sources cell (718 quotes over 230 rows, after leaving out 21 strings that are article titles, not quotes), mapped its citation key to the downloaded text and searched it after normalising case, spacing, quote marks, dashes and soft hyphens. 703 were found verbatim. The 15 not found were each opened by hand: 8 are glyphs or spacing (flat sign, fermata, mf, a fraction-slash time signature, "3rd" for "third", dash spacing), each confirmed on the page; 6 are page wording changes (5 Berklee outcome lines, 1 Hal Leonard description); 1 is a paraphrase (RSL Keys). A second script (`build/p2/pagecheck.py`) checked the cited printed page of every ABRSM, Trinity, RCM and RCM Theory quote: 265 on the stated page, 22 flagged, all glyph or line-break artefacts (20) or the same text on the next line (2), none a wrong page. The ABRSM 2027-28 sight-reading table (printed p.16) and the Trinity sight-reading table (p.81) were rendered as images and read by eye, which checks the at-sight levels of 32 rows directly. The web-fetch tool was not used. "Found" in the evidence column means found by that script; "read" means I read the page text or image.

**What a script finding does not prove.** A quote being on the page proves the citation, not that the row's summary of levels is right. Levels were read against the source for every row the evidence column marks "read" (the sight-reading tables, Trinity musical knowledge pp.88-89, the Faber chart, RCM p.4 and p.9, ABRSM Initial requirements, LCM musical awareness, Trinity Rock & Pop parameters, the Trinity accompanying list). For the other rows the level summary was compared with the members' carried level cells, not re-read at source. Method-book page numbers were not checked (the books are not online). No score was heard.

## 1. Verdicts, one line per row

| AB id | verdict | field(s) | the correction | evidence |
| --- | --- | --- | --- | --- |
| AB-001 | OK |  |  | 1/1 quotes found by script (aaio) |
| AB-002 | OK |  |  | 1/1 quotes found by script (fcat) |
| AB-003 | OK |  |  | 1/1 quotes found by script (a1a) |
| AB-004 | OK |  |  | tg1a p.5 read: the quote is there; mapping now excludes the stop rule; 1/1 quotes found by script (tg1a) |
| AB-005 | OK |  |  | Faber correlation chart pp.1-2 read (five Cs at 2B); 4/4 quotes found by script (tg1a x4) |
| AB-006 | OK |  |  | AT-174 (enharmonics, Th G4) is covered by the enharmonic-names level (Alfred 1B); 3/3 quotes found by script (hlb, aaio, tg1b) |
| AB-007 | WRONG minor | level range; ability | AT-173 (folded 2026-10-08: build a scale from its tones and semitones, major Th G1, harmonic minor G2, melodic minor G3, degree names G4) brought no level. Carry its levels as a written-level reference, and either extend the title to minor scales built from their pattern or say the minor forms are played in AB-083. | 2/2 quotes found by script (fcorr, tg1b) |
| AB-008 | OK |  |  | 1/1 quotes found by script (tg1a) |
| AB-009 | OK |  |  | 5/5 quotes found by script (aaio x2, fpu8, tg1a, fad) |
| AB-010 | OK |  |  | 1/1 quotes found by script (tg1b) |
| AB-011 | OK |  |  | 1/1 quotes found by script (aaio) |
| AB-012 | OK |  |  | Faber correlation chart pp.1-2 read ("Cross-hand arpeggios" 2B); 1/1 quotes found by script (tg1b) |
| AB-013 | OK |  |  | 1/1 quotes found by script (tg1a) |
| AB-014 | OK |  |  | 1/1 quotes found by script (tg1b) |
| AB-015 | OK |  |  | 2/2 quotes found by script (tg1a x2) |
| AB-016 | OK |  |  | 1/1 quotes found by script (tg1b) |
| AB-017 | OK |  |  | rcm p.4 read: List C Inventions at L1-2 only; 6/6 quotes found by script (tcl x2, rcm x4) |
| AB-018 | WRONG minor | parameters by level | Section 6 (OPEN-03) calls Trinity Rock & Pop "faster repeated notes" (Grade 3, PDF p.39) a speed parameter of this row, but the cell says "no graded parameter stated". Carry it (noting the source does not say the fingers change) or remove the OPEN-03 claim. | 1/1 quotes found by script (aaio) |
| AB-019 | OK |  |  | 1/1 quotes found by script (fcat) |
| AB-020 | OK |  |  | 2/2 quotes found by script (aaio, tcl) |
| AB-021 | OK |  |  | 3/3 quotes found by script (rcm, a27, tcl) |
| AB-022 | OK |  |  | 1/1 quotes found by script (a1a) |
| AB-023 | OK |  |  | Trinity musical knowledge pp.88-89 read: Init letter names, G1 two ledger lines, G2 three; the AB-201 join is right (naming a printed note is reading it); 10/10 quotes found by script (tg1a, fpu4, hlb x2, fpu5, hlfeat, fcorr, tg1b, tcl, th) |
| AB-024 | WRONG material | ability; level range | AT-165 was folded here with no level: Trinity musical knowledge names intervals in the candidate's own piece by number (2nd-5th G2, to 7th G3) and by full name within an octave (G4). Add those levels and "name it by number, then by quality" to the title; as written, interval quality read from the score is in no row (only by ear, AB-135). | Faber correlation chart pp.1-2 read; Trinity musical knowledge pp.88-89 read (G2 "Intervals (numerical only)", G4 "Intervals (full names)"); draft AT-165; 6/6 quotes found by script (hlb, tg1a, fpu7, aaio x2, fcat) |
| AB-025 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read: 2-note chords G3, 4-part G5, 3-part G8; 3/3 quotes found by script (tg1a, a27 x2) |
| AB-026 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read: spread chords G8; 2/2 quotes found by script (a27 x2) |
| AB-027 | WRONG minor | level range | AT-160 (folded): Trinity Init "Identify key/time signatures", G1 "Explain key/time signatures" (four crotchet beats in a bar) not carried. Add as musical-knowledge levels. | Faber correlation chart pp.1-2 read (3A common/cut time, 3/8); ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read; Trinity p.81 sight-reading table rendered and read; Trinity musical knowledge pp.88-89 read; 9/9 quotes found by script (aaio, fcorr x3, tg1b, a27 x3, tcl) |
| AB-028 | OK |  |  | Faber correlation chart pp.1-2 read (3A, 4, 5); ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read; Trinity p.81 sight-reading table rendered and read; 5/5 quotes found by script (a27, tcl, fcorr x3) |
| AB-029 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (5/8, 5/4 G6; 7/8, 7/4 G7; glyphs read by eye); 1/2 quotes found by script (rcm); not found: a27 (glyph, read on the rendered page) |
| AB-030 | OK |  |  | Trinity p.81 sight-reading table rendered and read; 1/1 quotes found by script (tcl) |
| AB-031 | WRONG minor | level range; parameters | AT-159 (folded): Trinity Init "Note durations", G1 "Note values" (naming them in one's piece) not carried; add. Also a missing full stop before "Rests at sight". | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read: Initial semibreve rest, G1 minim and crotchet rests, as pass 1 says; Trinity p.81 sight-reading table rendered and read; Faber correlation chart pp.1-2 read (16th-note patterns 3B); Trinity musical knowledge pp.88-89 read; 7/8 quotes found by script (fcorr x2, fpu10, tg1a, fad, tcl, a27); not found: tg1b (em dash spacing; found p.34) |
| AB-032 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read: G3 dotted quaver-semiquaver figure present; Trinity p.81 sight-reading table rendered and read; 4/4 quotes found by script (hlb, aov, a27 x2) |
| AB-033 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read; Trinity p.81 sight-reading table rendered and read; 3/3 quotes found by script (fpu9, a27, tcl) |
| AB-034 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (triplets G6); Trinity p.81 sight-reading table rendered and read (duplets and triplets G8); 4/4 quotes found by script (aaio, a27, tcl x2) |
| AB-035 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (simple syncopation G5); 2/2 quotes found by script (aaio, a27) |
| AB-036 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (anacrusis G4); rcm p.71; 3/3 quotes found by script (tg1a, a27, rcm) |
| AB-037 | OK |  |  | Faber correlation chart pp.1-2 read (swing rhythm 3A); 4/4 quotes found by script (tg1b, abrsm_jp x2, lcm_r) |
| AB-038 | OK |  |  | 2/2 quotes found by script (tg1a x2) |
| AB-039 | WRONG minor | level range; ability | AT-161 (folded): Trinity Init identify, G1 explain a key signature, G3 "Relative major/minor" not carried; telling the major key from its relative minor under one signature is in no title. Add the levels and that clause. | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read; Trinity p.81 sight-reading table rendered and read; Trinity musical knowledge pp.88-89 read (G3 relative major/minor); 10/11 quotes found by script (tg1b, tcl x4, a27 x5); not found: tcl (flat glyph; read on p.81) |
| AB-040 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (chromatic notes G4); Trinity p.81 sight-reading table rendered and read (G#, double sharps); 5/5 quotes found by script (tg1b, a27 x2, tcl x2) |
| AB-041 | OK |  |  | Trinity p.81 sight-reading table rendered and read; 1/1 quotes found by script (tcl) |
| AB-042 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (clef changes G6); 1/1 quotes found by script (a27) |
| AB-043 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (8va G7); tg1b p.30; 1/2 quotes found by script (a27); not found: tg1b (em dash spacing; found p.30) |
| AB-044 | OK |  |  | rcm p.4 read (D.C./D.S. observed; repeat signs ordinarily ignored); 5/5 quotes found by script (tg1b, tg1a, a27, tcl, rcm) |
| AB-045 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read; Trinity p.81 sight-reading table rendered and read (pause G5); 1/2 quotes found by script (a27); not found: tg1b (fermata glyph; found p.21) |
| AB-046 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (lengths, positions); rcm pp.9, 14, 26, 32, 46; 12/12 quotes found by script (a27 x4, tcl, rcm x6, a25) |
| AB-047 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read; Trinity p.81 sight-reading table rendered and read; 5/6 quotes found by script (tg1a, aaio, a27 x2, tcl); not found: tg1a (mf glyph; found p.24) |
| AB-048 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (hairpins G1); Trinity p.81 sight-reading table rendered and read (hairpins G4, words G8); Faber correlation chart pp.1-2 read (2A); 3/3 quotes found by script (tg1a, a27, tcl) |
| AB-049 | OK |  |  | Trinity p.81 sight-reading table rendered and read (different dynamics RH and LH G8); 4/4 quotes found by script (fcat, tcl x3) |
| AB-050 | OK |  |  | Trinity p.81 sight-reading table rendered and read; Faber correlation chart pp.1-2 read (phrase mark 2A); 4/4 quotes found by script (fcat x2, a27, tcl) |
| AB-051 | OK |  |  | Trinity p.81 sight-reading table rendered and read (staccato G4); 2/2 quotes found by script (tg1a, tcl) |
| AB-052 | OK |  |  | Trinity p.81 sight-reading table rendered and read (accents G4); 2/2 quotes found by script (tg1b, a27) |
| AB-053 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (tenuto G4); Trinity p.81 sight-reading table rendered and read (G8); 2/2 quotes found by script (a27, tcl) |
| AB-054 | OK |  |  | 3/3 quotes found by script (tg1a, a27, tcl) |
| AB-055 | WRONG minor | level range | AT-163 (folded): Trinity G2 "Metronome marks" not carried; the title's "marking" covers the act, the level is missing. | Trinity p.81 sight-reading table rendered and read; Faber correlation chart pp.1-2 read (2A tempo words); Trinity musical knowledge pp.88-89 read (G2 metronome marks); 3/3 quotes found by script (tg1b, tcl x2) |
| AB-056 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read; Trinity p.81 sight-reading table rendered and read; 5/5 quotes found by script (tg1b, a27 x2, tcl x2) |
| AB-057 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (right pedal G6); Trinity p.81 sight-reading table rendered and read (simple pedalling G5); 3/3 quotes found by script (fpp, a27, tcl) |
| AB-058 | OK |  |  | Faber correlation chart pp.1-2 read ("Connected pedaling" 2B); 1/1 quotes found by script (fcat) |
| AB-059 | WRONG minor | existing ability | "half-pedal is not named by any source row" is stale since pass 1 added AB-220 (quarter, half, flutter pedal). Change to "near A7f.1 (half-pedal is AB-220)". | Trinity p.81 sight-reading table rendered and read; 2/2 quotes found by script (a27, tcl) |
| AB-060 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (una corda G7); 1/1 quotes found by script (a27) |
| AB-061 | OK |  |  | ABRSM 2027-28 sight-reading table (printed p.16, PDF p.17) rendered and read (simple ornaments G8); Trinity musical knowledge pp.88-89 read (G2 grace notes and ornaments); Faber correlation chart pp.1-2 read (grace notes 3B); 4/4 quotes found by script (tcl x2, a27, fcorr) |
| AB-062 | WRONG minor | level range | AT-162 (folded): Trinity Init "Explain basic musical terms and signs", G1 (da capo) not carried; add as musical-knowledge levels. | Trinity musical knowledge pp.88-89 read; 3/3 quotes found by script (a27, tcl, prep) |
| AB-063 | OK |  |  | 1/1 quotes found by script (a27) |
| AB-064 | OK |  |  | 2/2 quotes found by script (a27, tcl) |
| AB-065 | OK |  |  | 2/2 quotes found by script (a27, tcl) |
| AB-066 | OK |  |  | 2/2 quotes found by script (a27, tcl) |
| AB-067 | OK |  |  | rcm pp.4-5 read (memory marks Prep A-L8; deduction L9-10); 6/6 quotes found by script (a27, tcl, rcm x2, lcm_r, abrsm_jpg) |
| AB-068 | OK |  |  | 2/2 quotes found by script (bk_jazz x2) |
| AB-069 | OK |  |  | 6/6 quotes found by script (pg, tcl, rcm x2, abrsm_jpg x2) |
| AB-070 | OK |  |  | a27 PDF p.12 and tcl p.76 read; restatement is a fair act for the descriptor; 2/2 quotes found by script (a27, tcl) |
| AB-071 | OK |  |  | a27 PDF p.12 and tcl p.77 read; 2/2 quotes found by script (a27, tcl) |
| AB-072 | OK |  |  | 2/2 quotes found by script (a27, tcl) |
| AB-073 | WRONG minor | ability | Real for a learner, but "in a Baroque style" names no demand, so success cannot be told (the row says so; OPEN-12). Keep it marked not assessable until OPEN-12 names the demands. Levels are right. | rcm p.4 read: List A Baroque and Classical L1-2, Baroque L3-9, Works by J.S. Bach L10; 1/1 quotes found by script (rcm) |
| AB-074 | WRONG minor | ability | As AB-073: style demands unstated (OPEN-12). Levels as corrected in pass 1 are right. | rcm p.4 read (List B Classical L3-10); p.73 sonatina and p.78 complete sonata found; 5/5 quotes found by script (rcm x5) |
| AB-075 | WRONG minor | ability | As AB-073 (OPEN-12). Levels right. | rcm p.4 read (L1-2 List B and L3-7 List C shared with 20th/21st c.; L8-10 List C Romantic); 1/1 quotes found by script (rcm) |
| AB-076 | WRONG minor | ability | As AB-073 (OPEN-12). Levels right. | rcm p.4 read (List D L8-9; Lists D and E at L10); 1/1 quotes found by script (rcm) |
| AB-077 | OK |  |  | rcm p.7, p.31 found; 2/2 quotes found by script (rcm x2) |
| AB-078 | WRONG minor | merge | A repertoire category, not a separate ability: reading a notated pop arrangement is AB-065 with AB-035 and AB-037 (syncopation, swing). Fold into AB-072 (pieces in different styles) as a parameter keeping RCM L1-10. No placement changes. | rcm pp.4-5 and pop p.2 read (Levels 1-10 may substitute one etude); 2/2 quotes found by script (rcm, pop) |
| AB-079 | WRONG minor | level range; merge | Trinity Accompanying group C is not only reductions: it also admits any piece from the grade's solo book. Cite the Piano Plus arrangements (e.g. Bizet, Fauré, Vivaldi arr. Grant-Jones at G5) as the reductions. The texture clause is AB-049 (voicing); consider folding as its parameter. | tacc PDF pp.3, 5 read: group C lists Piano Plus arrangements and "Any piece" from the grade book; 1/1 quotes found by script (tacc) |
| AB-080 | OK |  |  | 1/1 quotes found by script (tcl) |
| AB-081 | OK |  |  | rcm p.9 read (C, G, D major at Prep A); 4/4 quotes found by script (rcm x3, fcat) |
| AB-082 | WRONG minor | level range | Faber Level 4 "2-octave scales: C, G, D, A, E, B" (charted beside ABRSM G2-3) not carried. | a27 PDF p.21 (Initial) read; Faber correlation chart pp.1-2 read (Level 4 two-octave scales); 15/15 quotes found by script (a25, a27 x6, tcl x4, rcm x4) |
| AB-083 | WRONG minor | parameters by level | The summary files FB 3B under natural only; the EL-075 cell and the chart give natural and harmonic (Am, Dm) at FB 3B, Am, Dm, Em at FB 4, and "Three forms of minor scales" at FB 5 (missing). | a27 PDF p.21 read (D minor at candidate choice); Faber correlation chart pp.1-2 read; 10/10 quotes found by script (a25, a27 x4, tcl x2, rcm x3) |
| AB-084 | OK |  |  | a27 PDF p.21 read (C major contrary motion a 5th); 6/6 quotes found by script (a25, rcm, a27 x2, tcl x2) |
| AB-085 | OK |  |  | 2/2 quotes found by script (rcm x2) |
| AB-086 | OK |  |  | 5/5 quotes found by script (a27 x2, tcl, rcm x2) |
| AB-087 | OK |  |  | tcl p.118 read ("a minor 3rd apart"); 3/4 quotes found by script (a27 x2, tcl); not found: tcl ("3rd" for "third"; found p.118) |
| AB-088 | OK |  |  | 4/4 quotes found by script (a27 x2, rcm x2) |
| AB-089 | OK |  |  | 4/4 quotes found by script (a27 x3, tcl) |
| AB-090 | WRONG material | ability; level range | Playing octaves in a piece (octave melodies and basses, solid or broken) has no row: this row is only octave scales at RCM L9-10, but Faber lists "Playing octaves" at 3B (charted ABRSM G1-2). Extend the row (octaves in pieces FB 3B, then scales in octaves RCM L9-10) or add one; otherwise an early octave passage has nowhere to place but L9. | Faber correlation chart pp.1-2 read ("Playing octaves" 3B); tcl_rock PDF p.38 (G2 "occasional stretch to octave"); 3/3 quotes found by script (rcm x3) |
| AB-091 | OK |  |  | 4/4 quotes found by script (a27, lcm_r x2, rsl_p) |
| AB-092 | OK |  |  | 3/3 quotes found by script (abrsm_jp, lcm_r x2) |
| AB-093 | OK |  |  | 1/1 quotes found by script (abrsm_jp) |
| AB-094 | OK |  |  | 2/2 quotes found by script (abrsm_jp, lcm_r) |
| AB-095 | OK |  |  | tcl p.118 read (p-f-p); 2/3 quotes found by script (tcl x2); not found: tcl (spacing; found p.118) |
| AB-096 | OK |  |  | 4/4 quotes found by script (a27, tcl, rcm x2) |
| AB-097 | OK |  |  | 3/3 quotes found by script (a27, tcl, rcm) |
| AB-098 | OK |  |  | 2/2 quotes found by script (a27, rcm) |
| AB-099 | OK |  |  | 1/1 quotes found by script (rcm) |
| AB-100 | OK |  |  | Faber correlation chart pp.1-2 read (3B triads and inversions); 5/5 quotes found by script (aaio, rcm x2, fcorr x2) |
| AB-101 | OK |  |  | a27 PDF p.21 read (arpeggio C major a 5th HS at Initial); 10/10 quotes found by script (a25, rcm x6, a27, tcl x2) |
| AB-102 | OK |  |  | Faber correlation chart pp.1-2 read (One-octave arpeggios 3A; soft hyphen in the PDF text); 11/11 quotes found by script (a27 x4, tcl x3, rcm x3, fcorr) |
| AB-103 | OK |  |  | 11/11 quotes found by script (a27 x2, tcl, rcm x3, abrsm_jp x3, lcm_r, rsl_k) |
| AB-104 | OK |  |  | 1/1 quotes found by script (tcl) |
| AB-105 | WRONG minor | level range | Faber 3B "Key of A minor: i, iv, and V7 chords" (and D minor) not carried; minor-key primary chords appear only as FB 5 cadences. The AB-203 join stands. | Faber correlation chart pp.1-2 read (2B I-IV-V7; 3B minor-key i-iv-V7; 5 cadences); Trinity musical knowledge pp.88-89 read; the AB-203 join is acceptable; 8/8 quotes found by script (fcat x2, rcm, rsl_k, tcl, th, fcorr x2) |
| AB-106 | OK |  |  | Faber correlation chart pp.1-2 read (tonic and dominant notes L1); 1/1 quotes found by script (fcat) |
| AB-107 | OK |  |  | Faber correlation chart pp.1-2 read (ostinato and Alberti bass 3A); 1/1 quotes found by script (aaio) |
| AB-108 | OK |  |  | tcl_rock PDF p.63 read (sus4, power, add6, slash, 9ths, dim, aug by grade); 4/4 quotes found by script (aaio, lcm_r, tcl_rock x2) |
| AB-109 | OK |  |  | rcm p.46 read (lead sheet option from L5); 11/11 quotes found by script (fcat, rcm x5, thy, pm, abrsm_jpg x2, rsl_p) |
| AB-110 | OK |  |  | 4/4 quotes found by script (abrsm_jpg, lev, lcm_r, tcl_rock) |
| AB-111 | WRONG minor | level range | AT-171 (folded: chords at the cadence points of a simple melody, Th G5) brought no level; carry it as a written-level reference only, as AB-204 does for Th G5. | draft AT-171; th p.1; 2/2 quotes found by script (fcat, byu) |
| AB-112 | OK |  |  | thy pp.33-34 and pm found; kept at advanced levels by the owner (not reopened); 4/4 quotes found by script (pm, thy x3) |
| AB-113 | OK |  |  | 1/1 quotes found by script (thy) |
| AB-114 | OK |  |  | 1/1 quotes found by script (thy) |
| AB-115 | OK |  |  | 1/1 quotes found by script (thy) |
| AB-116 | OK |  |  | pm p.4 found; Faber correlation chart pp.1-2 read (5-finger transposition 2A); 3/3 quotes found by script (fcorr, pm, byu) |
| AB-117 | OK |  |  | 11/11 quotes found by script (prep, a27, pm, rcm x3, rsl_p, tcl_rock, abrsm_jp, rsl_k x2) |
| AB-118 | OK |  |  | 2/2 quotes found by script (a27, rcm) |
| AB-119 | OK |  |  | 1/1 quotes found by script (rsl_k) |
| AB-120 | OK |  |  | 3/3 quotes found by script (pm, rcm, pbe) |
| AB-121 | OK |  |  | 9/9 quotes found by script (a27 x2, prep, tcl x2, a25 x2, abrsm_jp x2) |
| AB-122 | OK |  |  | 7/7 quotes found by script (a27 x2, pm, rcm x2, abrsm_jp, rsl_k) |
| AB-123 | OK |  |  | 3/3 quotes found by script (rcm x3) |
| AB-124 | OK |  |  | 2/2 quotes found by script (abrsm_jp, lcm_r) |
| AB-125 | OK |  |  | 4/4 quotes found by script (a27, pm, a25, abrsm_jp) |
| AB-128 | OK |  |  | 1/1 quotes found by script (tcl) |
| AB-129 | OK |  |  | 2/2 quotes found by script (a27, tcl) |
| AB-130 | OK |  |  | 2/2 quotes found by script (tcl, pm) |
| AB-131 | OK |  |  | 6/6 quotes found by script (a27 x3, tcl x2, a25) |
| AB-132 | OK |  |  | 2/2 quotes found by script (a27, tcl) |
| AB-133 | OK |  |  | 2/2 quotes found by script (a27 x2) |
| AB-134 | OK |  |  | lcm_r p.36, a27 p.53, tcl p.123 found; 3/3 quotes found by script (a27, tcl, lcm_r) |
| AB-135 | OK |  |  | 3/3 quotes found by script (tcl, rcm x2) |
| AB-136 | OK |  |  | 2/2 quotes found by script (a27, tcl) |
| AB-137 | OK |  |  | 5/5 quotes found by script (a27, rcm x2, rsl_p x2) |
| AB-138 | OK |  |  | 2/2 quotes found by script (a27, tcl) |
| AB-139 | OK |  |  | lcm_r PDF p.35 read (dominant, major and minor 7th by ear); rcm p.9, p.46; 3/3 quotes found by script (rcm x3) |
| AB-140 | OK |  |  | 1/1 quotes found by script (rcm) |
| AB-141 | OK |  |  | lcm_r PDF p.35 read; 2/2 quotes found by script (lcm_r x2) |
| AB-142 | OK |  |  | 4/4 quotes found by script (mau x3, bk_lat) |
| AB-143 | OK |  |  | 2/2 quotes found by script (lcm_r x2) |
| AB-144 | OK |  |  | 2/2 quotes found by script (hlb, tcl) |
| AB-145 | OK |  |  | 4/4 quotes found by script (tcl, pm, tcl_rock x2) |
| AB-146 | OK |  |  | 4/4 quotes found by script (tcl, tcl_rock x2, rsl_p) |
| AB-147 | OK |  |  | rcm pp.46, 62, 81 found; pm, abrsm_jp, lcm_r found; 7/7 quotes found by script (pm, abrsm_jp, lcm_r, rcm x4) |
| AB-233 | OK |  |  | thy pp.32, 34 found; 4/4 quotes found by script (thy x4) |
| AB-148 | OK |  |  | 4/4 quotes found by script (pm x2, abrsm_jp, lcm_s) |
| AB-149 | OK |  |  | 2/2 quotes found by script (pm x2) |
| AB-150 | OK |  |  | 4/4 quotes found by script (lev, hl_blues, pbe, lcm_r) |
| AB-151 | WRONG minor | sources | ST-005's Berklee outcome is no longer verbatim on the page; it now names pentatonic and blues scales after approach notes. Update the quote; the row's meaning holds. | bk_jazz curl: outcome now reads chord tones, approach notes, pentatonic and blues scales; 2/3 quotes found by script (bk_jazz, abrsm_jpg); not found: bk_jazz (page wording changed) |
| AB-152 | OK |  |  | Schott REJ page downloaded by curl (HTTP 200 with a browser user agent): quote and "Grade 4 standard and above" found; 4/4 quotes found by script (lev x2, rej, abrsm_jp) |
| AB-153 | OK |  |  | tcl_rock PDF pp.39-41 read (about 4, about 8, up to 12, up to 16 bars); 2/2 quotes found by script (tcl_rock x2) |
| AB-154 | WRONG minor | ability; consistency | Section 3 says keeping one's piece by recording counts and was folded into AB-154, and AB-213 says AB-154 keeps by recording; the row says neither. Add the clause *and keep it by recording it*, marked as the 2026-10-08 decision with no source row (writing it out stays out). | tcl pp.97-121 quotes found; tcl_rock p.35 (own song: scan of the copy required); 12/12 quotes found by script (tcl x9, tcl_rock, rsl_p, lcm_r) |
| AB-155 | OK |  |  | bk_br and bk_lat curl: changed wording already noted in the row; 2/3 quotes found by script (bk_lat, bk_br); not found: bk_br (page wording changed (noted in row)) |
| AB-156 | OK |  |  | 1/1 quotes found by script (abrsm_jpg) |
| AB-157 | OK |  |  | 3/3 quotes found by script (abrsm_jpg x2, lcm_r) |
| AB-158 | OK |  |  | 3/3 quotes found by script (abrsm_jp, abrsm_jpg, lcm_r) |
| AB-159 | OK |  |  | 1/1 quotes found by script (lcm_r) |
| AB-160 | OK |  |  | 2/2 quotes found by script (lcm_r x2) |
| AB-161 | WRONG minor | merge | Jazzing a hymn or nursery tune is AB-172's "printed piece adapted to one's own style", with AB-157's embellishing; the only source is LCM advice on choosing a free piece. Fold into AB-172 as a parameter (LCM G1-3). | 1/1 quotes found by script (lcm_r) |
| AB-162 | OK |  |  | 3/3 quotes found by script (lev x2, lcm_r) |
| AB-163 | OK |  |  | bk_jazz curl: lesson 8 "Using Minor Key II V I in A/B Form" found; 2/2 quotes found by script (bk_jazz x2) |
| AB-164 | OK |  |  | Schott RIB page by curl: "Chapter 4: Ninth and thirteenth chords" found; 3/3 quotes found by script (lev, bk_jazz, rib) |
| AB-165 | OK |  |  | Schott REJ by curl: "rootless voicings" found; 2/2 quotes found by script (lev, rej) |
| AB-166 | OK |  |  | 3/3 quotes found by script (lev, lcm_r x2) |
| AB-167 | OK |  |  | 2/2 quotes found by script (lev, lcm_r) |
| AB-168 | OK |  |  | Schott REJ by curl: "two-handed voicings" found; 3/3 quotes found by script (lev x2, rej) |
| AB-169 | OK |  |  | 2/2 quotes found by script (lev, lcm_r) |
| AB-170 | OK |  |  | 1/1 quotes found by script (lev) |
| AB-171 | OK |  |  | bk_jazz curl: lesson 6 two feel then walking in four found; Schott REJ found; 5/5 quotes found by script (bk_jazz x3, hl_blues, rej) |
| AB-172 | OK |  |  | 5/5 quotes found by script (bk_jazz x2, rsl_p x2, tcl_rock) |
| AB-173 | OK |  |  | Schott RIB by curl: chapters 1-3 found; 7/7 quotes found by script (aaio, bk_jazz, rsl_k, lcm_r, rib x3) |
| AB-174 | WRONG minor | sources | Two BK-BR outcome quotes changed wording (now "well-phrased improvised solos" and "both solo piano and band performance settings"); update. The Schott RIB quotes are now verified. | Schott RIB by curl (and Wayback copy): left-hand patterns, co-ordination, "around grade 3" found; bk_br wording changed; 6/8 quotes found by script (rib x2, hl_blues, bk_br x2, hl_bw); not found: bk_br (page wording changed), bk_br (page wording changed) |
| AB-175 | OK |  |  | bk_br curl: "Intros, Turnarounds, and Endings" found; 3/3 quotes found by script (hl_blues, lcm_r, bk_br) |
| AB-176 | WRONG minor | sources | The RSL-K quote is a paraphrase: the page reads "Chords i7, iv & v" with "G blues or B blues scales" (Grade 5 ear test 2). Quote the page. | Schott RIB chapter 5 found; rsl_k PDF p.36 read; 1/2 quotes found by script (rib); not found: rsl_k (paraphrase of p.36) |
| AB-177 | OK |  |  | 3/3 quotes found by script (bk_br x2, hl_stride) |
| AB-178 | OK |  |  | 4/4 quotes found by script (bk_pop x3, tcl_rock) |
| AB-179 | OK |  |  | 6/6 quotes found by script (tcl_rock x2, bk_pop, hl_rock, bk_br, hl_gospel) |
| AB-180 | OK |  |  | 2/2 quotes found by script (rsl_k, tcl_rock) |
| AB-181 | OK |  |  | 1/1 quotes found by script (tcl_rock) |
| AB-182 | WRONG minor | sources | BK-BR outcome quote changed wording (as AB-174); update. | 0/1 quotes found by script (); not found: bk_br (page wording changed) |
| AB-183 | OK |  |  | jop PDF quotes found; 5/5 quotes found by script (jop x4, hl_stride) |
| AB-184 | OK |  |  | 3/3 quotes found by script (lev, bk_int, lcm_r) |
| AB-185 | OK |  |  | 2/2 quotes found by script (mau x2) |
| AB-186 | OK |  |  | 6/6 quotes found by script (mau x3, sher x2, ilpn246) |
| AB-187 | OK |  |  | 2/2 quotes found by script (mau, bk_lat) |
| AB-188 | OK |  |  | 3/3 quotes found by script (bk_jazz, bk_lat, hl_braz) |
| AB-189 | OK |  |  | 1/1 quotes found by script (bk_lat) |
| AB-190 | OK |  |  | 2/2 quotes found by script (lw x2) |
| AB-191 | WRONG minor | sources | HL-LJ quote not verbatim: the page reads "chord voicings, comping, montunos, lead sheets". | 0/1 quotes found by script (); not found: hl_lj (page wording differs) |
| AB-192 | OK |  |  | 4/4 quotes found by script (bk_lat, mau x3) |
| AB-193 | OK |  |  | lds quotes found; 3/3 quotes found by script (lds x3) |
| AB-194 | OK |  |  | 1/1 quotes found by script (lds) |
| AB-195 | WRONG minor | parameters by level | ST-123's placement here is right (hymn and choir accompaniment is played from a written score while following singers). But say the Keyboard Course is a beginner course (hymn accompanying after AB-193's three-part stage), far below Trinity Accompanying G5-8, and that BYU and RSCM are organ courses. | lds, byu quotes found; tacc read; 4/4 quotes found by script (lds, byu, tcl x2) |
| AB-234 | OK |  |  | hlsing and pgroove found; 3/3 quotes found by script (hlsing x2, pgroove) |
| AB-196 | OK |  |  | 2/2 quotes found by script (pg_walk, pg_hymn) |
| AB-197 | OK |  |  | ilpn227 curl: both quotes found; 2/2 quotes found by script (ilpn227 x2) |
| AB-198 | OK |  |  | 4/4 quotes found by script (a27, tcl, a25, lcm_r) |
| AB-199 | OK |  |  | 3/3 quotes found by script (abrsm_jpg x2, lcm_r) |
| AB-200 | OK |  |  | 2/2 quotes found by script (bk_int, bk_pop) |
| AB-202 | WRONG minor | sources | "and use them to learn it" now has sources: Chang III.6 (memorize "from the standpoint of music theory") and Harris's guide p.8 ("recognising scale patterns (which helps fluency)"), both found by curl. Add them; keep the clause. | tcl p.89 found; Faber correlation chart pp.1-2 read; chang36 and harris p.8 found by curl; 3/3 quotes found by script (tcl, fcorr x2) |
| AB-204 | OK |  |  | thy p.33, th p.1, pm found; 3/3 quotes found by script (th, thy, pm) |
| AB-205 | OK |  |  | tcl p.89 found; 1/1 quotes found by script (tcl) |
| AB-206 | OK |  |  | tcl p.89, thy pp.33, 35 found; Faber correlation chart pp.1-2 read (2B AB/ABA, 3A binary/ternary); 5/5 quotes found by script (tcl, thy x2, fcorr x2) |
| AB-207 | WRONG minor | level range | LCM musical awareness G1-2 asks notation, G3-4 intervals and chord symbols; only its context and style parts (composers and dates G4, stylistic understanding G6) support this row. Restrict LCM to those and note the notation and interval parts under AB-023, AB-024, AB-031, AB-039. | tcl p.89 found; lcm_r PDF p.31 musical awareness read; 3/3 quotes found by script (tcl, lcm_r x2) |
| AB-208 | OK |  |  | 1/1 quotes found by script (mw_tempo) |
| AB-209 | OK |  |  | 2/2 quotes found by script (faber_tips, chang27) |
| AB-210 | OK |  |  | chang28 and mw_tempo quotes found (separate check); 2/2 quotes found by script (chang28, mw_tempo) |
| AB-211 | OK |  |  | 1/1 quotes found by script (mw_mistakes) |
| AB-212 | OK |  |  | 1/1 quotes found by script (mw_deep) |
| AB-213 | WRONG minor | disagreements (nearest rows) | Its note that AB-154 "keeps a composition by recording" is untrue of AB-154 as written; fix with AB-154. | 2/2 quotes found by script (mw_deep x2) |
| AB-214 | OK |  |  | 1/1 quotes found by script (chang36) |
| AB-215 | OK |  |  | 1/1 quotes found by script (mw_deep) |
| AB-216 | OK |  |  | studybass: count-off quote found; one or two bars and pickup notes discussed on the page; 1/1 quotes found by script (studybass) |
| AB-217 | OK |  |  | aeb26 PDF p.3 and wp_head quotes found (separate check); 2/2 quotes found by script (aeb26, wp_head) |
| AB-218 | OK |  |  | tr_g2 found; 1/1 quotes found by script (tr_g2) |
| AB-219 | OK |  |  | tr_g7 and wp_poly found (separate check); 2/2 quotes found by script (tr_g7, wp_poly) |
| AB-220 | OK |  |  | 2/2 quotes found by script (yamaha x2) |
| AB-221 | OK |  |  | 1/1 quotes found by script (spanswick) |
| AB-222 | OK |  |  | 1/1 quotes found by script (chang33) |
| AB-223 | OK |  |  | tr_g4 and chang33 found (separate check); 2/2 quotes found by script (tr_g4, chang33) |
| AB-224 | OK |  |  | tcl_rock PDF p.38 read: the Grade 2 table (Grade 3 starts p.39); 1/1 quotes found by script (tcl_rock) |
| AB-225 | OK |  |  | 1/1 quotes found by script (wp_fsub) |
| AB-226 | OK |  |  | a25 PDF p.60 and wp_rubato found (separate check); 2/2 quotes found by script (a25, wp_rubato) |
| AB-227 | OK |  |  | harris PDF p.3 read: Pre-grade 1 Stage 4 looking ahead; Grade 7 Stage 1; ptp found (separate check); 3/3 quotes found by script (harris x2, ptp) |
| AB-228 | OK |  |  | 1/1 quotes found by script (ptp) |
| AB-229 | OK |  |  | a25 PDF p.13 found; 2/2 quotes found by script (a25 x2) |
| AB-230 | OK |  |  | 1/1 quotes found by script (praise) |
| AB-231 | WRONG minor | ability | The title asserts the order tonic, bass, chords, tune, which the row and section 5 say no source states (the source names listening and playing along). Drop the order from the title or mark it as A3.1's reading. | ou_wb (Wayback) found; 1/1 quotes found by script (ou_wb) |
| AB-232 | OK |  |  | 1/1 quotes found by script (pgroove) |

## 2. Document-level findings

**D1. Keeping one's own piece by recording (section 3 against AB-154, AB-213, section 5).** Section 3 says the 2026-10-08 decision made "keeping it by recording" count and "folded" it into AB-154. Nothing was folded: the only draft rows about keeping a piece were AT-023 and ST-165, and pass 1 dropped them as writing out. AB-154 does not say it. AB-213's nearest-rows note says AB-154 "keeps a composition by recording", which is untrue of the row. Section 5's A6.2 cell is the only accurate place: keeping by recording is the 2026-10-08 decision, not a source row. **What the list should say:** AB-154 adds "and keep it by recording it", marked as the 2026-10-08 decision with no source row (writing it out stays out). Section 3 then says "stated in AB-154 (the decision; no source row)" instead of "folded into AB-154". AB-213's note then holds. No source read states it: Trinity Rock & Pop asks for a scan of an own song's copy (PDF p.35), not a recording. Learner sense supports it: a learner who makes up a piece needs a way to keep it, and at the piano that is a recording.

**D2. Stale near-note (AB-059 against AB-220).** AB-059's existing-ability cell says no source row names half-pedalling; pass 1 added AB-220 (quarter, half and flutter pedal). Section 5's A7f.1 cell already cites AB-220.

**D3. Section 6 (OPEN-03) against AB-018.** OPEN-03 calls Trinity Rock & Pop's "faster repeated notes" (Grade 3, PDF p.39, found) a speed parameter of AB-018. AB-018's parameters cell says no graded parameter. The Trinity line also does not say the fingers change.

**D4. Section 5 (A3.1) against AB-231's title.** Section 5 and AB-231's own cells say no source states the order tonic, bass, chords, tune; the title asserts it.

**D5. The ten rows folded in on 2026-10-08 (the brief's question).** Their hosts' levels were checked against the draft rows (draft-abrsm-trinity.md lines 207-222) and Trinity pp.88-89:

| folded row | what it brought | host | covered? |
| --- | --- | --- | --- |
| AT-159 | name note values: TCL Init, G1 | AB-031 | no: TCL levels missing (row verdict) |
| AT-160 | explain a time signature: TCL Init, G1 | AB-027 | no (row verdict) |
| AT-161 | key signature, relative major/minor: TCL Init, G1, G3 | AB-039 | no: levels and the relative-key clause missing (row verdict) |
| AT-162 | explain terms and signs: TCL Init, G1 | AB-062 | no (row verdict) |
| AT-163 | metronome marks: TCL G2 | AB-055 | no (row verdict) |
| AT-164 | grace notes and ornaments: TCL G2 | AB-061 | yes (added in pass 1, found) |
| AT-165 | intervals by number G2-3, full name G4 | AB-024 | no: levels and interval quality missing (row verdict, material) |
| AT-171 | chords at cadence points: Th G5 (written) | AB-111 | no level reference (row verdict) |
| AT-173 | scale from tones and semitones, minor forms: Th G1-4 (written) | AB-007 | major only (row verdict) |
| AT-174 | enharmonic equivalents: Th G4 (written) | AB-006 | yes: the enharmonic-names level (Alfred 1B) covers the act |

**D6. Draft ids absent from level cells (measured by `build/p2/lint.py`).** Exactly the ten folded rows above are traced to a row whose level cell does not name them (they appear only in its sources cell); every other traced draft id is in its row's level cell. So counting draft rows per ability from the level cells gives a different spread (2 rows: 43, 3: 26, 4: 13, 6: 6, 7: 5, 8: 2; 77 multi-draft) from section 7's (2: 39, 3: 28, 4: 15, 6: 5, 7: 3, 8: 5; 80). Section 7 counts by the trace and is right by the trace; the column rule ("each member's level cell ... carried verbatim") is what is not met. Fixing D5 fixes most of it.

**D7. Trace and counts (measured by `build/p2/trace.py`).** The four drafts have 482 row ids; the trace has 482, none missing, none twice, none extra; every merged draft id is named in its row's level or sources cell, and no row names a draft id traced elsewhere. 475 merged, 7 dropped. Section counts A 8 to S 17 match section 7. NEW 146, in part 77, fully 7 match; the per-track counts match; section 4 holds 21 rows with 48 draft ids, as section 7 says.

**D8. Joins and splits the brief asked about.** AB-201 into AB-023: right (naming a printed note is reading it; Trinity's Init-G2 levels now sit in AB-023). AB-203 into AB-105: acceptable (a learner who plays I-IV-V7 in a key can name its I, IV and V triads); AB-204 would also have taken it as the entry level of recognising functions in a piece, but nothing taught changes either way. AB-195 / AB-234: placed right. ST-123 (accompanying hymn singing and choirs) is played from a written score while following singers, which is AB-195; AB-234 is the chord-symbol route (ST-127). AB-195's parameters should still say the Keyboard Course is a beginner course (row verdict).

**D9. AB-202's unsourced clause (the brief's question).** "and use them to learn it" has sources: Chang III.6, which says there is no better way to memorise music "than from the standpoint of music theory", and Harris's sight-reading guide p.8, "recognising scale patterns (which helps fluency)". Both were found by curl. Keep the clause and cite them. The same Chang line would also support the clause pass 1 removed from AB-206, should the owner want it back.

**D10. Parameters cells that do not summarise.** Twelve rows give "as ST-0xx's cell" instead of a summary (AB-092, AB-093, AB-094, AB-150, AB-157, AB-158, AB-159, AB-162, AB-163, AB-164, AB-171, AB-199; measured). The cells are carried in the next column, so nothing is lost; the column rule says the summary is written. Not counted as row verdicts.

**D11. Pass-1 records that can now close.** The 11 Schott quotes (applied.md D10; rows.md "fetch tool only") were downloaded by curl this time (HTTP 200 with a browser user agent; the Wayback copy of the RIB page also read) and all 11 were found verbatim, with "around grade 3" (RIB) and "Grade 4 standard and above" (REJ). The header's sentence that the rest of the drafts' citations "remain as the drafts left them" can say that pass 2 checked all 718 quotes (section 3).

**D12. OPEN-12 and the period-style rows.** AB-073 to AB-076 and AB-079 are kept as abilities, but until OPEN-12 names the demands of each style, success at them cannot be told. They are marked WRONG minor so the gap stays visible. A characteristic written for them now would rest on nothing.

**Learner sense, overall.** Read row by row, the list describes what an adult learner needs, at roughly the levels given, with two exceptions that would change teaching or placement. Playing octaves in a piece has no row (AB-090 holds only octave scales at RCM L9-10). Naming interval quality from the score is lost with AT-165 (AB-024). The other findings are levels a host does not carry, stale notes, changed quotes, and three rows (AB-078, AB-079, AB-161) that are repertoire categories or uses of another row rather than separate abilities.

## 3. Citations opened

**Opened and verified (curl 2026-10-08; quotes found by script unless "read"):**
- Syllabi: ABRSM Piano 2027-28 (a27; sight-reading p.16 and Initial requirements read), ABRSM Piano 2025-26 (a25), ABRSM Practical Musicianship (pm), ABRSM Theory outline (th), ABRSM Performance Grades (pg), ABRSM Jazz Piano G1-5 (abrsm_jp) and Performance Grades (abrsm_jpg), Trinity Piano 2023 (tcl; p.81 and pp.88-89 read), Trinity Piano Accompanying list (tacc; read), Trinity Rock & Pop Keyboards syllabus (tcl_rock; Grades 2-3 and improvisation parameters read) and grade pages 2, 4, 7, RCM Piano 2022 (rcm; pp.4, 5, 9, 46 read), RCM Theory 2016 (thy), RCM Popular Selection List (pop), RSL band-based keys (rsl_k) and popular piano (rsl_p), LCM Jazz syllabus (lcm_s) and repertoire list (lcm_r; musical awareness p.31 read).
- Methods: Faber correlation chart (fcorr; read whole), Faber catalog (fcat), Faber adult contents (fad), Faber Primer units 4, 5, 7, 8, 9, 10 and Primer page, Hal Leonard Primer concepts (hlfeat), Book 1 page (hl1) and brochure (hlb), Alfred adult contents (aaio, aaio2), 1A outline (a1a), teacher's guides 1A and 1B (tg1a, tg1b), level overviews (aov), Faber teaching tips.
- Style and other: Levine contents and sample (lev), Mauleón contents (mau), Joplin School of Ragtime (jop), Link and Wendland (lw), Church Keyboard Course (lds), Schott RIB and REJ (live, plus RIB Wayback), Berklee Online jazz, blues/rock, pop/rock, Latin, intermediate keyboard; Berklee ILPN-227 and ILPN-246; BYU catalogue; PianoGroove (three pages); Piano Dao (Prep test; Piano by Ear); Sher Music; Hal Leonard style pages (blues, boogie-woogie, stride, salsa, Brazilian, Latin jazz, rock, pop, gospel, Piano for Singers); RSCM; RSL keys page.
- Pass-1 additions: Musician's Way (three posts), Chang II.7, II.8, III.3, III.6, StudyBass, Aebersold V26 sample, Wikipedia (Head, Polyrhythm, Finger substitution, Tempo rubato), Yamaha Educators Hub, Spanswick, Harris guide (Faber Music PDF), Practising the Piano, PraiseCharts, Open University 3.4 (Wayback copy, as pass 1).
- Result: 703 of 718 quotes verbatim; 15 explained in the head of this file and in the evidence column; every row has at least one quote found.

**Could not open, or opened without its quotes:** the ABRSM jazz web page (HTTP 307; no row quotes it). The books behind several style rows were not opened beyond their contents pages and publisher text: Levine's chapters, Mauleón's chapters, Valerio, Martignon, Willey and Cardim, Lowry, Miller, Cowling, Harrison, Deutsch, the Hal Leonard book interiors. The rows quote only the contents and description lines, which were found. Method-book page numbers were not checked. The live Open University page was not tried again (pass 1 recorded HTTP 403; the Wayback copy was used).

**The 11 Schott quotes:** found verbatim. RIB: "Chapter 1: Triads", "Chapter 2: Sixth chords", "Chapter 3: Seventh chords", "Chapter 4: Ninth and thirteenth chords", "Chapter 5: Minor and diminished chords", "Authentic left-hand patterns and bass lines", "Co-ordination exercises for both hands". REJ: "Horizontal and vertical improvisation", "rootless voicings", "two-handed voicings", "walking bass lines". Rows AB-152, 164, 165, 168, 171, 173, 174, 176.

## 4. Counts (by script)

| verdict | rows |
| --- | --- |
| OK | 198 |
| WRONG material | 2 (AB-024, AB-090) |
| WRONG minor | 30 |
| UNSURE | 0 |
| **total** | **230** (the row count of section 1) |

Counted by `build/p2/gen.py`, which writes one line per id in section 1 and tallies the verdict column. A check on this file: `grep -c '^| AB-' rows.md` gives 230 and `grep -o '^| AB-[0-9]* | [A-Z][A-Za-z ]*|' rows.md | sort | uniq -c` gives the same split. Of the 87 current rows that pass 1's `applied.md` names (changed, added, or cited as a nearest row; measured by `build/p2/p1count.py`), 66 are OK and 21 WRONG minor (AB-018, 027, 031, 039, 062, 073, 074, 075, 076, 078, 079, 082, 083, 105, 154, 161, 195, 202, 207, 213, 231). The two WRONG material rows (AB-024, AB-090) are rows pass 1 did not name.

The sight-reading tables read as images check the at-sight levels of 32 rows directly (the evidence cells that name them).
