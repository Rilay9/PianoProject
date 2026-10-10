# Old project's findings on the easy score facts (read at c8b33af6)

Sources and short names, all at c8b33af6: V1A, V1B, V1C = docs/classifier/audits/rules-1A, 1B, 1C/validation.md (line numbers are those of the file). RT = docs/classifier/evidence/1A/comparison/repeat-times.md; MEL = .../1A/comparison/melody.md; NC = .../1C/comparison/no-candidate.md; SYN = .../1C/comparison/syncopation.md; HS = .../1B/comparison/hand_says.md. D = app/src/demands/detect.ts. TEX, RHY, HAR, TEC = tools/classifier/rules/texture.py, rhythm.py, harmony.py, technique.py.

Cross-cutting, read: the validators used their own raw MusicXML walk (all 2,020 notated files, 0 errors; V1A header) and called music21 10.5.0 / partitura 1.9.0 only for some facts. The PDMX files are re-exports whose "originals" are not held (544 of 544 byte-identical to the app's files; V1C section 1.1, line 12 area). partitura's load_musicxml failed on 4 files: Bach Invention No. 1 PDMX, Ballade No. 1, O mio babbino caro, Sakamoto (V1C, sync.py note). No sound was heard anywhere ("Nothing was heard").

## staves and parts (notation.staves)
Method: own raw walk, `r_format.py staves`. Compared with: the 6 named items. Result: all as the page says; catalogue generated 1,187 two-staff and 24 one-staff; PDMX 424 and 100; other 255, 29 and 1 two-part file (Ballade 1: 2 parts of 2 staves). Quirk: Ballade No. 1 is the only two-part file and falls outside the OSMD scripts (NC section 3). Source: V1A line 23. Staff is exact; hand is not (HS line 2: the staff rule is "exact about the written staff", right on 168 of 287 = 58.5% notes under printed hand words).

## clefs and clef changes (notation.clefs, notation.clef-change)
Method: own raw walk (clef in force). Result, validated: off-side clefs 155 PDMX ids / 131 other, other clefs 7 / 4, generated none. Clef changes: 145 PDMX ids (96 inside a bar), 127 other (113; page said 120); same-clef restatements in 50 files (28 PDMX, 22 other) are not counted; Asturias changes inside a bar. Quirk: D reads staff 1 as treble and staff 2 as bass, never the clef (D lines 15-20, bassClef line 370); a clef change reads wrong there. Source: V1A lines 26-27.

## ledger lines (pitch.ledger)
Method: own staff-position geometry from the clef in force (sourced WP-Ledger_line, MXL-clef). Result, uncertain: reproduces Satie 18 above, Silent Night 2 middle Cs, We Three Kings 0; El Choclo 2 notes beyond 6 lines; the 6-line limit is open: 154 generated and 97 real items (28 PDMX, 69 other) reach 6+ lines, many NIFC Chopin files with no `<octave-shift>`, so lost 8va marks cannot be told from real notes. D: `ledgerLines` line 378, staff positions from the written letter, constants lines 363-366, middle C excluded. Source: V1A lines 28, 94.

## ottava lines (mark.ottava)
Method: own span reading checked against music21 `toWrittenPitch` (`ottava_m21.py`) on the 93 catalogue files with `<octave-shift>`. Result, uncertain: exclusive stop agrees on 81 of 93, inclusive on 21; never compared with a printed page. Quirks: Malagueña 3 unclosed spans, mariage-damour.alt2 3 empty spans, Light the World 3 "8va cont." words. Source: V1A lines 29, 69.

## key signatures and changes (notation.keys)
Method: own raw walk. Result, validated: Beethoven Symphony 7 four changes; catalogue key changes 55 PDMX ids, 106 other, 0 generated; per-staff and non-traditional keys have no instance. D keeps only the first key (D lines 33-35, `keyFifths` 198). HAR `marks` (line 1235) reads partitura KeySignature (the reading of what it measured is inferred: no count read). Source: V1A line 30.

## notes altered by the signature (key.signature-exercised)
Method: section-12 accidental model over raw walk. Result, uncertain: Ballade 4 2,393 exercised; "never exercised" 100 generated, 4 PDMX, 2 other. Inherits the failing accidental-display model (next section). D `keySignature` line 532 counts notes on a signature letter whose written alter matches it. Source: V1A line 31.

## accidentals and accidental churn (reading.accidental-kinds, reading.accidental-churn)
Method: own model of which accidentals show, against OpenSheetMusicDisplay 2.1.2 rendered under jsdom (the render is the reference). Result, failing: over 2,011 rendered files, 678,280 notes matched, model wrong on 8,543 of 76,813 file-accidental notes (11.1%): render draws 8,295 the model calls not shown, shows 248 not drawn; files exact 1,591 of 2,011. An emulation of OSMD `checkAccidental` is wrong on 676 (0.9%), differs from the render in 73 files. Failures: 8 files do not render. Quirk: end-of-bar grace pairs shift OSMD's timeline by 0.5 quarter (NIFC files). The old recommendation is to read OSMD's render for the displayed layer and the file's `<accidental>` elements for the encoded layer. Churn: validated (Muse 24, Ballade 4 44, Nocturne op. 9 no. 2 29; catalogue 12 generated, 65 PDMX, 101 other). music21 import error on mozart-k545-i.alt ("incorrect accidental 9.0 for pitch F3", RT line 30). D `chromatic` line 552. Source: V1A lines 33-34; NC section 3 (line 55), section 9.

## time signatures, changes, simple/compound class (notation.times, metre.class)
Method: plain read of music21 `TimeSignature` and partitura `TimeSignature`, against the raw reader. Result: both equal the raw reader on all 187 signature changes in 49 items. What neither gives is the class (device, pickup, cadenza): the old detector counted 116 of the 187 as changes; with the longer-bar clause dropped 148; right on 1 of 9 named items, with the fix 5 of 9, plain reads 4 of 9. metre.class, uncertain: no route gives a 6/4 grouping in the 11 files with 6/4 or 12/4; music21 accent weights order measured on 12 metres. Quirk: Gnossienne No. 1 has no `<time>`; partitura returns an empty list (SYN section 6). D `metreAt` defaults to 4/4 (line 121), `compoundMetre` 502, `threeFour` 518; `isCompound` is in score/metre.ts (not read). Source: V1C lines 22-23; RT section 4 (lines 248-325).

## anacrusis (mark.anacrusis)
Method: raw walk on 5 named items. Result, validated: Away in a Manger 1 quarter of 3; Alexander's Ragtime Band 2 of 4; Für Elise 1 eighth of 3/8; Oh! Susanna and Clair de lune beginner start on full bars. No catalogue case for the section-pickup test (T51). D `barStarts` line 136 uses `model.pickup`; TEX `_bars` line 116 treats bar 0 shorter than the signature as a pickup. Source: V1C lines 24, T51.

## note and rest values, dotted figures, ties (rhythm.values, rhythm.dotted-quarter, rhythm.ties)
Values, validated over 2,020 files: 512ths 29 in 4 files (5 cue size), 256ths 15 in 3, 128ths 11 in 4; every sub-128th value sits in a bar that also carries a quantisation ratio (PDMX re-export artefact); none in generated or repertoire files. App files keep cue size (26 files: 14 PDMX, 12 repertoire). Dotted quarter, validated on 4 items (Für Elise 12 dotted-eighth pairs). Ties, uncertain, partitura note array (a tie chain is one note): chains generated 219 / PDMX 9,696 / repertoire 10,107; across the bar 217 / 6,653 / 4,962; inner chains 72 / 3,521 / 4,849. Open: a final note tied into the last bar. D: `eighths` 401, `sixteenths` 409, `shorterThanQuarter` 405, `dottedQuarters` 416 (simple time only), `ties` 430 (tieLength greater than 1); rests are not on the model (D lines 31-32). Source: V1C lines 25-27; section 1 item 2; section 4.

## triplets and other tuplets (rhythm.triplets, rhythm.tuplets-other)
Method: `<time-modification>` ratios and `<tuplet>` brackets from the raw files. Triplets, uncertain: 3v2 exercise 48 notes at 3:2; Black Bottom Stomp 372 (page's 320 not reconciled); 576 closed brackets hold fewer notes than actual-notes (long-short pairs, rests). Other tuplets, failing: 77 distinct ratios; 5% bound leaves artefacts (160:107, 480:371 Malagueña and others). Comparison with the smallest fix (NC section 4): reading only closed `<tuplet>` brackets of 2+ notes with ratio not 1 kept 14 of 14 real figures and dropped 21 of 21 artefacts (old rule 13 and 8); no 3:2 group lost (230 of 231); of 15,255 closed brackets the old fewer-notes test flagged 576; 19 unnamed groups (81 notes) it drops are unverified. Brackets: 10 unclosed, 3 possibly nested (Ballade 1 bar 179 and others, unverified). D `triplets` line 495 (tuplet === 3). Source: V1C lines 29-30; NC lines 91-134; V1A line 36.

## grace notes
Method: partitura (zero-duration notes in the note array; TEX `view` line 137, `graces`). Result: 247 real items carry `<grace>`; in song.beautiful.g-minor-bach.alt staff 2 two pitches (A4, F-sharp4) exist only as grace notes (distinct 28 against struck 26; V1B line 19). OSMD gives grace notes a duration the page lacks (D lines 29-31); end-of-bar grace pairs break OSMD timing (NC section 3). Grace runs of 6+ appear in Chopin NIFC items and Moonlight III (alt) bar 188 (30). RHY `Bars` leaves them out (line 69 area). No count of grace notes per file read.

## ornament signs (mark.ornament)
No finding, except that TEX `_tremolo_marks` (line 743) reads partitura `note.ornaments` containing "tremolo". The SMuFL substitution glyph U+ED21 in Invention 1 was read as a fingering substitution (V1A line 40).

## arpeggiation, tremolo, glissando, fermata marks
Arpeggiation sign and glissando: no finding (TEX `arpeggio` is a broken-chord note pattern, not the sign; inferred from reading). Tremolo: marks via partitura ornaments (TEX 743, 772); no measured result read for the mark. Fermata: HAR `marks` line 1249 reads partitura `Fermata`; no measured count read.

## dynamics, hairpins, articulations, slurs, pedal marks
Dynamics: RHY `_dynamics` (line 598) reads partitura `ConstantLoudnessDirection` text pppp to ffff and `IncreasingLoudnessDirection` (crescendo only; diminuendo absent, inferred). sf/sfz/fz are read by partitura as `ImpulsiveLoudnessDirection` (Moonlight III 49, Hall of the Mountain King 39, equal to the raw counts; the Tarantella's 15 fz on downbeats give no accent). Articulations: RHY line 380 reads partitura `articulations` accent and strong-accent; accent-kind items 101 PDMX / 127 repertoire / 0 generated (V1C section 4). Slurs: no finding. Pedal: no finding (one "Pedal Freely" word, Mabinogi, in the cadenza word list). Source: V1C line 28.

## tempo marks and tempo-change words (mark.tempo-text, mark.tempo-change)
Method: raw walk, words. Result, validated: Op. 10 No. 1 quarter = 176; Scarborough Fair 165; Asturias no metronome, `<sound tempo>` 144; 6/8 drill 80, 12/8 drill 76. Changes: Op. 9 No. 2 "poco rit.", "a tempo", "poco rubato", "Senza tempo" (page's bar numbers one higher); Malagueña "accel. poco a poco"; La plus que lente "Lent", "Mouvt", "Animez un peu" unclassified ("Tempo animé" is not in the file). T32 open: no search for a non-tempo word caught. Source: V1C lines 44-45.

## fingering numbers (mark.fingering)
Method: raw walk of `<fingering>` and digit words. Result, validated: Hanon 1 right hand 61 digits; Mozart K. 2 easy 0 `<fingering>` but 71 digit words (candidates); Bach Invention 1 "32" x6 anomalous; stacked chord fingerings (Oh Canada, Chopin op. 10 no. 6). Fingering `0` occurs in 1 of 2,020 files (Kreutzer). Share of notes fingered: 0.9 threshold is open (Ode to Joy 0.895 / 0.893 against 0.916). Source: V1A lines 40, 89.

## lyrics (notation.lyrics)
Method: music21 corpus and synthetic streams (`corpus_lyr.py`). Result, uncertain: 0 catalogue files carry `<lyric>`; leadSheet/fosterBrownHair.mxl (91 and 81 syllables) classed as words; "1 e & a" counting stream misclassed (6 of 8 aligned, under 80%). No real instance. Source: V1A lines 41, 88.

## chord symbols (notation.chord-symbols)
Method: own walk against music21 `<harmony>` reader, 460 items with `<harmony>` (327 generated, 96 PDMX, 37 other). Result: equal on 459 of 460 (exception muskrat-ramble 37 vs 35 symbols, cause untraced); raw 7,868 vs 7,874; slash chords 415 and N.C. 62 equal; duplicates (same symbol on two staves) removed: PDMX 4,984 to 3,619. Text symbols (239 spellings, 2,628 symbols): Tonal parses 202 of 239 spellings, all right; music21 parses 150, right root on 126, misreads "Bb7" as root B (447 symbols wrong) and raises on 89 spellings; neither separates letter aids from chords (Chopin waltz). Role under a symbol fails. HAR `read_symbols` line 165 (music21 xmlToChordSymbol). Source: V1A line 42; MEL lines 127-172, 283.

## slash notation (notation.slash-rhythm)
Raw walk, validated: So Danço Samba 28 stemless slashes bars 1 to 7; Blues Riff 18; no `<measure-style>` slash anywhere. Source: V1A line 46.

## repeats and endings, bar count and played length (mark.repeat, form.length)
Method: own unroller against music21 `repeat.Expander` and partitura `unfold_part_maximal`/`minimal`, 329 files with repeat structure, reading as the reference. Result, failing in V1A, fixed by the two-coda convention: unroller with fix right on 80 of 81 determinable disagreement files; music21 27 right, 30 wrong, 24 no count; partitura 21 right. Agreement of unroller with music21: 258 of 329 (260 with fix), partitura 257. Failures: partitura IndexError on 6 files (7 minimal), builds jumps only from `<sound>` (1 of 329 files); music21 not expandable on 38, parse error on 1; music21 over-expands up to 592 bars from 66 (School of Ragtime); Romance 64 by both libraries against 80. 34 of 88 depend on convention. Time: music21 0.501 s per file, partitura 0.826 s. HAR `marks` line 1235. Printed bar count alone: no finding. Source: V1A lines 44, 87-88; RT lines 38-247, 350.

## pitch range per staff and per bar, pitch inventory, black-key share, pitch entropy
hands.per-bar-range, validated (V1B line 11): Asturias compass 31-103, Handful of Keys 29-105; register bounds 54 / 55-72 / 73 sourced from jSymbolic as in music21 10.5. pitch.black-key-share, validated (line 12): G-flat arpeggio 1.0, G-flat five-finger 0.778 (C-flat counted white). pitch.inventory, validated (line 19): staff positions by clef bottom line; grace-note listing matters (above). reading.pitch-entropy, validated, independent implementation: Hall of the Mountain King 5.42 right hand; ostinato fifths 1.0; formula from RubricNet; one-pitch floor open (V1A line 37). D `range` line 242 reads the melody line only.

## chord size per staff, harmonic intervals, span within one staff, octaves
No finding for chord size, harmonic intervals or octaves as facts. Span: the reach flag over 16 semitones, validated as a flag only: generated widest one-staff chord 14, BWV 974 16 not flagged, 43 PDMX and 59 other flagged (V1A line 70). Related: five-finger span 7 sourced (48 of 48 five-finger items); extended 8-9; frame-based spans fail on semitone-shifted patterns and double-note chromatic runs (V1B lines 13, 47-51). D `beyondPosition` line 571 (per hand, running span above 7); TEC `OCTAVE = 12` (line 28). TEX `Ev` merges notes struck together per hand.

## melodic leaps per staff, repeated notes, equal-value streams
Leaps: no measured finding. D `leaps` line 398 (staff positions of 3 or more, from `intervals` line 248; chord tops on staff 1, bottoms on staff 2; `steps` 392, `skips` 395); TEC `_step` line 40 (diatonic second of 1-3 semitones). Repeated notes, validated: Asturias right hand longest run 96; Prelude No. 15 left hand 56. Equal stream, validated: Hanon 20 241 sixteenths; Prelude No. 2 384 and 408; Op. 10 No. 1 75 from bar 41. Source: V1C lines 32-33.

## explicit voices per staff (written voices only)
No finding. Related: voice collisions flagged in Amazing Grace and Abide with Me (hand-assignment, V1A line 24; catalogue 4 PDMX / 4 other); RHY says voices merge (docstring line 13), TEX merges onsets per hand.

## onsets per beat per staff, notes per second at the marked tempo
Method: raw walk, bar length in quarters. Result, validated (V1C section 2 technique.velocity): Hanon 20 3.89 notes a second at quarter = 60; Op. 10 No. 1 right hand 11.32, left 0.69 at 176; 6/8 drill 2.67 at quarter = 80. Asturias has no printed tempo. beat-onset-share validated (Hanon 61 of 62). Not re-run: the page's 115-of-151 velocity split.

## two-staff relations (synchrony, alternating, sustain-vs-move, unequal rates)
No measured finding. D `handsTogether` line 611 (per hand, note-sounding test), `leftHandPattern` 625. Related: texture.polyrhythm validated (3v2 3:2, Alberti none). Staff-vs-hand: the staff rule disagrees with a second reader on 930 of 28,294 notes (3.3%) in a 33-item sample, Asturias 816 of 2,677 (HS line 4).

## silences, sustained chords, register over the piece
rhythm.silence, validated: Swing-pair 4 beats; Weary Blues 7.5 beats; Doctor Gradus 167.5 (a nonsense value the integrity guard catches). Other parts "from the original upload" cannot be read, so the fallback is UNKNOWN for every item (V1C line 49). T36 open. D has no rests (gap before a bar's first note). Sustained chords and register trajectory: no finding.

## visual density per bar (reading.visual-density)
Uncertain: La Campanella at most 34 notes on one staff-bar, Ballade 4 38; inherits the failing accidental model and open ledger limit. Source: V1A line 35.

## difficulty statistics
No finding as a set; each component is under its fact above.

## Not done
- Sources 1-4 were all read. Evidence .md pages read in part: RT, MEL, NC (the sections on the listed facts); hand.md, key.md, spelling.md, scale-row.md and syncopation.md were scanned by heading and keyword only (not in scope, no listed fact found). The _template.md and frag_ files were not read.
- Not read: `tools/classifier/score.py`, `app/src/score/metre.ts`; so how `sc.pickup`, `isCompound` and grace/tie handling are made is not read.
