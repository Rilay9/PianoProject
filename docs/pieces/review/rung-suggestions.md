# Rung suggestions from free piano courses (a proposal for the owner to decide on)

Status: PROPOSAL ONLY. No repository file was changed. Base: rungs.md at commit 66e7cda1 (read from the working-tree file; whether the working tree equals that commit was not checked, there is no git repository in the PianoProject folder). Run date 2026-10-10. Web fetches/searches used: 46 of 60.

How to read this file
- "Quoted" = short phrase from a page as returned by the fetch tool. The fetch tool returns a summary written by a small model, not the raw page, so wording may be paraphrased and nothing here was checked against a raw page. Items are "reading", not "measured".
- A "stated skill" is what the source's own lesson title or lesson text says. The rung match is mine: it is made on the rung's "Learns:" line. Where the link is looser I write "match inferred".
- Source levels are the source's own labels (Hoffman "Unit N, Lesson N"; PVL "Year 1 Unit N, lesson N-M"; ZK "Beginner/Intermediate/Advanced, lesson N"). I have not mapped them onto our levels. Where a source's position looks clearly different from the rung's level I say so.
- Within each rung: pieces named by two or more sources first, then the rest. The owner lifted the six-per-rung cap, so every piece whose source states the skill is listed.
- Abbreviations: H = Hoffman Academy, PVL = PianoVideoLessons first-year course, ZK = Zebra Keys, L = lesson. URL keys: H-Un = https://app.hoffmanacademy.com/lessons/piano/unit-N/ (N = unit number). PVL-U4 = https://courses.pianovideolessons.com/courses/year-1-unit-4/ ; PVL-U5 = https://courses.pianovideolessons.com/courses/year-1-unit-5-level-1-piano-chording/ ; PVL-U6 = https://courses.pianovideolessons.com/free-online-piano-lessons/online-piano-lessons-adults-classical/ ; PVL-dir = https://courses.pianovideolessons.com/where-should-i-start/ (lists all six units) ; ZK-dir = https://www.zebrakeys.com/lessons/ .

## 1. Per source: what was read and what was not

1. Hoffman Academy - read.
   - https://app.hoffmanacademy.com/lessons/ (directory: units 1-18, repertoire, skills, knowledge per unit).
   - Unit pages 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 (https://app.hoffmanacademy.com/lessons/piano/unit-N/): lesson titles and per-lesson descriptions. These give the per-lesson skill for each piece.
   - Not read: https://www.hoffmanacademy.com/popular-songs (the fetch returned only a page title). The "Popular Music" list (Fur Elise, Twinkle, Moonlight Sonata, Happy Birthday, Canon in D, Gymnopedie No. 1, Chopsticks, Clair de Lune, Jingle Bells, Amazing Grace) comes from the directory page with no level or skill, so those titles are in section 3.
   - Note: Unit 12 L229 lists the same goals as L224 (a copy error on the source page, as the fetch noted); I did not use it. Unit 18 L359 says "Op. 36, No. 1" in its text but the title says No. 3.
2. Mayron Cole Free Piano Method (freepianomethod.com) - partly read, contents not read.
   - Read: /, /about, /free-files, /amazon, /accompaniments, /for-teachers.
   - Result: only book names. Textbooks "Pre-Level One" and "Level One" to "Level Nine" (plus "Older Beginner" Level One and Two), Folk Song, Classical, Christmas and "Summer Stunners" collections, five operettas. No piece titles and no skills appear on any readable page.
   - not read: the contents (levels, pieces, worksheets) are PDFs in a Google Drive folder; the brief excludes the PDFs, and no level or contents page on the site names pieces. The "outline for the videos" is also inside that Drive folder. Nothing from this source is placed.
3. Zebra Keys - read.
   - https://www.zebrakeys.com/lessons/ (directory of lessons 1-49 and 51; lesson 50 is absent from the list), plus section pages /lessons/beginner/improvisation/ , /lessons/intermediate/improvisation/ , /lessons/beginner/chords/ , /lessons/beginner/learnsongs/.
   - Result: the song lessons state no skill beyond "how to play beginner song X"; chord and pattern lessons state skills but use no songs. So all Zebra songs are in section 3. Not read: the other section pages (technique, music theory, advanced, intermediate songs/chords).
4. PianoVideoLessons first-year course - read.
   - https://courses.pianovideolessons.com/where-should-i-start/ (Units 1-6, all 96 lesson titles), plus unit pages Unit 4, Unit 5 and Unit 6 (PVL-U4/U5/U6). Units 1-3 were not opened individually; their titles come from the directory page.
   - Limits: unit pages give titles only; where the fetch summary wrote "inferred from title" I used only the title and the unit overview. Unit 5 lessons 5-10 and 5-11 are "coming soon" placeholders per the fetch.
5. 4 Square Piano - found by guessing the address (https://www.4squarepiano.com); two web searches did not find it. Read: home page, /downloads, /level-1-preview, /videos.
   - Result: free level books ("Beginner, Elementary 1-3: Up to ABRSM"; the site itself pairs Elementary 2 with "approx. Grade 1") but the books are PDFs (not downloaded), the previews and videos pages name no pieces, and the level chart text was garbled in the fetch (skills by level are therefore "inferred" and I place nothing from it).
   - Source-stated level chart (from /downloads, reading, partly inferred): levels progress through keys C/Am, then F/Dm/G/Em, then Bb/Gm/D/Bm, then Eb/Cm/A/F#m; dynamics, legato and staccato early.
   - not read: the level PDFs (downloads); no piece list is publicly readable. Nothing from this source is placed.
6. Flex Lessons repertoire placement guide - found by guessing the address; two searches failed.
   - Read: https://www.flexlessons.com and https://www.flexlessons.com/repertoire-placement-guide.
   - not read: the guide itself is a PDF delivered after entering name and email; the page only says it rates public-domain pieces on a 1-10 scale, "consistent with" Jane Magrath's lists, and that it does not correspond to RCM or ABRSM grades. The brief says read only if freely readable, so no pieces from it.
- Already-read sources were not redone. Duplicates against `docs/sources/lists/` (checked by title only, from the first lines of 8notes-candidates.csv and archive-methods-candidates.csv and the first rows of learnandmaster-skills.csv): "When the Saints Go Marching In" is in the Learn & Master list (B.5); "Happy Birthday to You", "Mary Had a Little Lamb", "Frere Jacques" and "London Bridge" are in the 8notes list; Bach "Musette" and Schumann "The Happy Farmer / The Merry Peasant" appear in the archive list (Hoffman's "Musette in D" may be the same piece, not checked). I marked these "also in an earlier list" below.

## 2. Per rung: candidate songs

Priority rungs first (no piece yet, then the style rungs), then Level B, Grades 1, 2, 3. A short "above Grade 3" and "Level P/A" part follows.

### B.7 First lead sheet (Learns: chord symbols turned into left-hand chords under the melody)
Named by two or more sources
- Happy Birthday to You (also in 8notes list) - H Unit 6, L116 "improvising an accompaniment... from chord symbols on a lead sheet" (H-U6). PVL 4-11 "Determining the Chords - Happy Birthday" (PVL-U4); PVL 5-15 "2 Easy Piano Intros" (PVL-U5; intros, a later skill).
- All the Pretty Horses - H Unit 7, L126 "improvise an accompaniment using chord symbols" (H-U7). PVL 5-9 "Minor Keys - All the Pretty Little Horses" (PVL-U5; minor chords from a lead sheet).
- Danny Boy - PVL 5-6 "using all 6 major and minor triads in Key of C" (PVL-U5). H Unit 16, L312 is an "Arranging Project" using "reading chord symbols from a lead sheet to create a left hand accompaniment" (H-U16): that is closer to 4.3/5.3.
- Amazing Grace - PVL 4-9 "Chord Harmony Lesson" (PVL-U4, lesson 9). Hoffman lists it only under Popular Music with no skill (section 3).
Single source
- La Cinquantaine (Gabriel-Marie) - H Unit 5, L100 "improvise an accompaniment... using chord symbols" (H-U5).
- Row, Row, Row Your Boat - H Unit 5, L83 "improvise an accompaniment... using I and V7 chords in D-flat" (H-U5).
- Lavender's Blue - H Unit 4, L64 "left hand accompaniment... using chord symbols"; "play a IV chord" (H-U4).
- Chumbara - H Unit 8, L160 "improvise a 2-hand accompaniment... using chord symbols" (H-U8).
- Dragon Night (Joseph Hoffman, original) - H Unit 8, L150 pt 2 "reading chords from a lead sheet... left hand" (H-U8).
- Land of the Silver Birch - H Unit 11, L220 (H-U11) "improvise an accompaniment... read chord symbols".
- Greensleeves - H Unit 12, L228 "improvise an accompaniment... using chord symbols" (H-U12).
- When Johnny Comes Marching Home - H Unit 10, L200 "improvise an accompaniment... review chord inversions" (H-U10).
- Heart and Soul - H Unit 10, L186-187 "improvise an accompaniment" using diatonic chords; improvising in C, G, D (H-U10).
- The Hope (Israeli anthem) - H Unit 9, L177 "reading chord symbols in lead-sheet style" (H-U9).
- Alphabet Song - PVL 5-2 "Lead Sheets" (PVL-U5; "How to Play from a Lead Sheet" is the lesson title).
- Blow the Man Down - PVL 5-4 "Playing with Major and Minor Chords" (PVL-U5).
- Morning Has Broken - PVL 5-7 "Diatonic Chords in G" with oom-pah (PVL-U5).
- The Skye Boat Song - PVL 5-8 "Diatonic Chords in D" with 1-5-8 pattern (PVL-U5).
- Early One Morning - PVL 5-13 "Chord Inversions and Voicings" (PVL-U5).
- Hallelujah - PVL 5-16 "Chord Strumming" (PVL-U5).
- PVL Unit 4 overview states the unit teaches "your first lead sheet" and "how to select chords for a melody" (PVL-U4). PVL places this as Year 1 Unit 4-5; H places the first lead-sheet accompaniments at Units 4-5 (from L64 and L83). No clear level mismatch with a Level B rung is claimed.

### B.8 Phrasing and connected pedal (Learns: phrases and phrase marks; crescendo/diminuendo; pp; connected pedalling changing with the harmony)
Mismatch to flag: H first teaches the damper pedal at Unit 11 (L217), later in its order than the other B.8 material; our rung sits at Level B. The source's order may simply be later than ours.
- Amazing Day (Joseph Hoffman, original) - H Unit 11, L217-218: "legato sound from chord to chord"; "read damper pedal markings"; L218 adds pedal to the piece (H-U11). Closest stated match to "connected pedalling".
- Etude in D Minor (Gurlitt, Op. 82 No. 65) - H Unit 14, L261 "phrasing and phrase mark"; L263 "phrasing, damper pedal, and voicing" (H-U14).
- The Song of Twilight (Yoshinao Nakada) - H Unit 14, L277 "proper technique and timing for using damper pedal"; L280 "voicing, damper pedal, tone, and phrasing" (H-U14).
- Autumn Moon (Joseph Hoffman) - H Unit 15, L290 "add damper pedal" (H-U15).
- Minuet in C (Rameau) - H Unit 10, L197 "shape each phrase using dynamics" (H-U10).
- Melody for Left Hand (Schytte) - H Unit 9, L161 review of "phrase marks" (H-U9).
- Harvest Dance (Joseph Hoffman) - H Unit 6, L111 "Question & Answer phrases"; L112 review of pp, accent, fermata (H-U6).
- Ode to Joy - H Unit 4, L78 "New term: crescendo" (H-U4). Closer to A.6/B.8's crescendo line.
- Kunkel pedal method pieces are already in an earlier list.

### B.7/B.8 neighbours already placed elsewhere: see 1.6, 2.5.

### 1.5 More accompaniment patterns (Learns: Alberti bass, ostinato; second waltz-bass shape, ragtime bass)
Mismatch to flag: Hoffman states Alberti bass only in Units 13 and 15 (the 13th and 15th of 18), far later in its order than our Grade 1 rung; a Clementi sonatina is also a larger piece than the rung implies (inferred).
- Sonatina in C, 1st movement (Clementi, Op. 36 No. 1) - H Unit 13, L242 "the term Alberti bass"; L244 "Review Alberti bass, rotation technique" (H-U13).
- Sonatina in G, 1st movement (attributed to Beethoven, Anh. 5 No. 1) - H Unit 15, L282 review of "Alberti bass" (H-U15).
- Oom-pah / ragtime bass (match inferred, the title says oom-pah only): Morning Has Broken - PVL 5-7 "LH Pattern: Oom Pa Pa" (PVL-U5).
- Skye Boat Song - PVL 5-8 "1-5-8 LH Chord Pattern" (PVL-U5): a left-hand pattern lesson; match to ostinato/second waltz shape inferred.
- The Music Box (pattern) - PVL 5-14 "Left Hand Pattern: The Music Box" (PVL-U5): a pattern lesson, the title gives no piece.
- No piece: ZK L18 Double Chord, L19 Broken Chord, L20 Arpeggio Chord Pattern, L35 Root Chord Pattern (ZK-dir; left-hand patterns "to add to any known song", no song named).

### 1.6 Pedalling by ear; dynamic range (Learns: changing pedal by listening; overlapping pedal; slurs, accents, mf, mp, hairpins)
- Honeybee - H Unit 6, L102 "Dynamic symbols (mezzo forte, mezzo piano)" (H-U6). Also PVL 4-5 "Mezzoforte" and 3-7 "Mezzo Forte" as skill lessons without a piece (PVL-dir).
- Kye Kye Kule - H Unit 6, L107 "New symbol: accent" (H-U6).
- Harvest Dance - H Unit 6, L112 review of "fortissimo, pianissimo, accent" (H-U6).
- Bagpipe - H Unit 4, L71 "New terms: forte, piano, dynamics" (H-U4).
- Ode to Joy - H Unit 4, L78 "crescendo" (H-U4); PVL 2-11 has the piece, PVL 2-2 "Playing Loud and Soft" has the skill (PVL-dir; the unit-2 page was not opened, so no stated link between them).
- Amazing Day pedal lessons (see B.8). Nothing in any source states "pedal by ear" or "overlapping pedal": those two parts of the rung have no stated source here.

### 2.6 Motive, sequence, 12-bar blues (Learns: motive and sequence in pieces; 12-bar blues in Roman numerals/letters; grace notes)
- Sequence: Dinah - H Unit 2, L36 "introduces... sequence" (H-U2). Mismatch to flag: this is among H's first 40 lessons, far earlier than a Grade 2 rung.
- Grace notes: Super Secret Agent (Joseph Hoffman) - H Unit 13, L259 "grace note" (H-U13). Autumn Moon (Joseph Hoffman) - H Unit 15, L288 "grace notes" (H-U15). Sonatina in F, 1st mvt (attrib. Beethoven, Anh. 5 No. 2) - H Unit 16, L319 "tips and techniques for playing grace notes" (H-U16).
- 12-bar blues: no piece in any source. Skill lessons only: H Unit 12, L240 "improvising over the 12-bar blues progression" and "blues left-hand accompaniment patterns"; ZK Beginner L11 "12 Bar Blues Chord Progression" (chord chart, no song; ZK-dir/chords page). Two sources teach it as its own lesson. Also 7ths: H Unit 7, L137 Black Snake "the ii7 chord" (H-U7); ZK L29-31 dominant, major, minor 7th (no songs).
- Motive: no source states it.

### 3.3 Compound and changing metres in pieces (Learns: sixteenths in 6/8; 12/8; changing time signatures)
- El Matador (Melody Bober) - H Unit 16, L313 "counting subdivided rhythms in 6/8 time" (H-U16). Match to "sixteenths in 6/8" inferred (the source says "subdivided").
- Spinning Song (Ellmenreich, Op. 14 No. 4) - H Unit 16, L303 "read and interpret polyrhythms" (H-U16); polyrhythm is not on the rung, listed only because it is a metre/rhythm item the source states. Match inferred.
- No source teaches 12/8 or a change of time signature; none states them in a piece.
- 3/8 and 6/8 (relates to 1.4, 4.7, 3.9): Tarantella (Joseph Hoffman) H Unit 9, L179 "counting and performing in 6/8" (H-U9); Greensleeves H Unit 12, L227 "counting rhythms in 6/8 meter" (H-U12); The Wild Horseman (Schumann) H Unit 14, L270 "6/8 meter" (H-U14); Sonatina in G, 2nd mvt H Unit 15, L285 "counting rhythms in 6/8" (H-U15); Morning Salute (Gurlitt) H Unit 9, L174 "3/8 time signature" (H-U9); Clementi Op. 36 No. 1, 3rd mvt H Unit 13, L252 "Review 3/8" (H-U13); Minuet in A (Scarlatti) H Unit 18, L352 "3/8" (H-U18); Fur Elise H Unit 18, L362 "3/8" (H-U18) and PVL 6-15 "Three-Eight Time" (skill lesson, PVL-U6). When Johnny Comes Marching Home H Unit 10, L199 "reviews 6/8" (H-U10).

### 1.4 Compound time, triplets, swing in pieces (Learns: 6/8, triplets; 3/8, swing, cut time met)
- Cut time: Sonatina in C, 1st mvt (Clementi) - H Unit 13, L241 "New time signature: 'Cut time' (2/2)" (H-U13). March in D (C.P.E. Bach) - H Unit 17, L337-338 reviews "cut time" (H-U17).
- Triplets: Sonatina Op. 36 No. 1, 2nd mvt (Clementi) - H Unit 13, L247 "eighth-note triplets" (H-U13). Super Secret Agent - H Unit 13, L260 "counting triplets" (H-U13).
- 6/8 and 3/8: see 3.3 list. Swing: no source states it in a piece.

### Style rungs
- BL.1 Boogie bass: no piece states a boogie bass. "C Boogie" (H Unit 1, L6) states only "Review Piano Posture Checklist" (H-U1); it is in section 3. H L240 names "blues left-hand accompaniment patterns" (a skill lesson, no piece).
- BL.2 12-bar blues / BL.3 blues scale: no pieces. Skill lessons: H Unit 6, L120 "blues pentascale in the key of A" (H-U6); Unit 10, L189 blues scale in A (H-U10); Unit 12, L239 "two-octave blues scale in D" with improvising over a 12-bar accompaniment (H-U12); ZK Advanced L51 Blues Scale (ZK-dir). Two sources teach the blues scale as its own lesson, which the BL and J rungs already cover.
- RG.1 oom-pah left hand: Morning Has Broken, PVL 5-7 (match inferred; "Oom Pa Pa" is in the title only). RG.3 classic rags: The Entertainer (Joplin, "simplified"), H Unit 17, L341-343: stated skills are "intro and A section", "first and second endings", "phrasing, voicing, dynamics, articulations" (H-U17); none says ragtime syncopation or strains, so it is also in section 3.
- PR.1 chords from symbols / improvising over a backing: see B.7 for chords. Improvising over a backing (match inferred to PR.1 and B.10): Deta, Deta - H Unit 8, L148 "improvise in the F major pentatonic scale" (H-U8); Heart and Soul - H Unit 10, L187 improvise in C, G, D over a diatonic progression (H-U10); Hot Cross Buns - H Unit 1, L2 "first improvisation... jazz-style backing track" (H-U1); Listen for Bells - H Unit 1, L19 "improvise... D major pentascale" with accompaniment (H-U1); Mary Had a Little Lamb - H Unit 3, L49 "improvising in the E major pentascale" (H-U3, also in 8notes list). Mismatch to flag: Unit 1-3 items sit with our P.6 and B.10 only loosely; they are Hoffman's first lessons.
- J.1-J.8, MT.1-2, PR.2-PR.8: no piece in any source states a skill that matches. H L165-166 (Unit 9) names a "Latin-style accompaniment" and the "Spanish Serenade" backing track for A-minor improvising; L311 (Unit 16) "Improvise in a Bossa Nova style" (H-U9, H-U16): no piece, so section 3 only.

### Level B rungs
- B.1 All notes on both staves (ledger lines): Black Snake - H Unit 7, L137 "Reading lower ledger lines for bass staff" (H-U7). The Mechanical Doll (Shostakovich) - H Unit 15, L299 "reading high ledger lines in the treble staff", "8va" (H-U15; mismatch: Hoffman's Unit 15 vs our Level B rung). Skill lesson without a piece: PVL 6-6 "Ledger Lines" (PVL-U6); H L142 Low C and High C (H-U8).
- B.2 Eighth patterns and the dotted quarter: Ode to Joy - H Unit 4, L78 "dotted quarter note and flagged eighth note" (H-U4); also PVL has the piece at 2-11 (no stated link). Lavender's Blue - H Unit 4, L62 "Beaming eighth notes in groups of four" (H-U4). Debka Hora - H Unit 4, L74 "eighth note with 2 sixteenth notes" (H-U4). Eighth rest: Au Clair de la Lune - H Unit 5, L95 is a "Rhythm Challenge: Eighth Rests", separate from the piece (H-U5). PVL skill lessons: 4-1 Eighth Notes, 6-3 Dotted Quarter Note (no piece).
- B.3 Five-finger patterns, transposing: Silver Birch Tree - H Unit 3, L53 "i, iv, and V7 chords in D minor position" (H-U3). Mary Had a Little Lamb - H Unit 3, L46 "in the key of E major" (H-U3; also in 8notes list). Oranges and Lemons - H Unit 3, L59 "in the key of F major" (H-U3). Chocolate - H Unit 1, L13 "in the C major pentascale" (H-U1). Listen for Bells - H Unit 1, L17 "in the D major pentascale" (H-U1). Row, Row, Row Your Boat - H Unit 5, L82 in D-flat major; Lady, Lady - H Unit 5, L86 in E-flat major (H-U5). Skill lessons without a piece: H L14 "transpose to the D major pentascale"; PVL 4-6, 4-8 Transposing I and II (PVL-U4).
- B.5 Triads and primary chords: When the Saints Go Marching In (also in the Learn & Master list) - H Unit 8, L153 "I, V7 and IV chords in the key of C" (H-U8). Silver Birch Tree (above); Dinah - H Unit 2, L37 "adding the V7 chord" (H-U2); The Wild Horses - H Unit 2, L40 "add chords in the right hand" (H-U2); Lavender's Blue IV chord (above). Skill lessons: PVL 4-3 "Primary Chords in C Major", ZK L10 "Three Primary Chords" (no songs).
- B.6 Left-hand accompaniment patterns: PVL 5-7 (oom-pah) and 5-8 (1-5-8) and 5-14 (Music Box) as in 1.5; Frog in the Middle - H Unit 1, L20 "left hand plays 2-note chords" (H-U1). Mouse in the House - H Unit 2, L23 "add chords in the LH" (H-U2). Boogie bass: none stated.
- B.9 Ear and B.12/B.10: no piece-based items; the ear and sight-reading lessons in H (Mystery Listening Game, Sight Reading Challenge) and PVL (Ear Training, Sight Reading) have no pieces.
- B.11 Level B pieces (contrasting kinds; match inferred, the sources do not call pieces agile or lyrical): Vivace (Gurlitt) - H Unit 6, L119 "slow metronome practice for mastering a fast piece" (H-U6; agile). Dance (Gurlitt) - H Unit 7, L128 "hand and arm technique for legato ascending notes" (H-U7; lyrical). Are You Sleeping? - H Unit 7, L133-134 "Shifting hand position in the middle of a song"; "Imitation... between two voices" (H-U7). Musette in D (Bach, also maybe in the archive list) - H Unit 7, L122-123 hands together (no skill stated) (H-U7). Bagpipe, Debka Hora, Ode to Joy (above). Andantino (Kohler) - PVL 4-13 (PVL-U4; no skill stated, section 3).

### Grade 1 rungs
- 1.1 Reading further: Black Snake and Mechanical Doll as in B.1; Dragon Night L150 "new fingering challenges" (H-U8).
- 1.3 First arpeggios: skill lessons only: H Unit 9, L166 One-Octave Arpeggios (H-U9); PVL 5-12 "Arpeggios! What is an Arpeggio!?" (PVL-U5); ZK L23 Arpeggios (ZK-dir). Three sources, no piece. Closest piece link: Spanish Serenade backing track in H L166.
- 1.7 Chords and form: form - Wild Horses H Unit 2, L39 "AABA form" (H-U2; mismatch: first 40 lessons vs Grade 1 rung); Minuet in G (Petzold) H Unit 14, L266 "binary form" review (H-U14); The Wild Horseman H Unit 14, L273 "ternary form" (H-U14); Spinning Song (Ellmenreich) H Unit 16, L304 "ternary form" (H-U16); Musette in D H Unit 12, L238 "rounded binary form" (H-U12). Chords: Silver Birch Tree i-iv-V7 in D minor (not A minor as the rung says) (H-U3); The Wild Horseman H Unit 14, L271 "diatonic chords in A natural and harmonic minor" (H-U14). Skill lessons: H L77 "Composing in Binary Form".
- 1.9 Improvising, Grade 1: Deta, Deta (F major pentatonic), Heart and Soul (C, G, D) - see PR.1 above.
- 1.10 Grade 1 pieces / B.11 style: the pieces under B.11 plus: Promenade (Reinagle) and Minuet in C (Rameau) are in H Units 10 with no stated skill beyond Minuet's L197 phrasing; Morning Salute (Gurlitt) H Unit 9, L175 "Voicing between hands to bring out the melody" (H-U9); Etude in C (Biehl) H Unit 9, L168 "Technique for playing successive chords with a legato tone" (H-U9).

### Grade 2 rungs
- 2.3 Triads in all keys and positions: Early One Morning - PVL 5-13 "Chord Inversions and Voicings" (PVL-U5); When Johnny Comes Marching Home - H Unit 10, L200 "Review using chord inversions" (H-U10). Skill lessons teaching inversions as their own lesson in three sources: H Unit 10, L191; PVL 4-10 and 5-13; ZK L17 and L37 (ZK-dir). All 12 major/minor triads: H Unit 7, L124; PVL 5-1, 5-3; ZK L9, L27, L12 (no pieces).
- 2.4 Sixteenths, syncopation, swing: Kye Kye Kule - H Unit 6, L107 "syncopation" (H-U6). Black Snake - H Unit 7, L136 "Review how to perform syncopated rhythms" (H-U7). Dinah - H Unit 2, L35 "four sixteenth notes" (H-U2; early-unit mismatch). The Song of Twilight - H Unit 14, L276 "counting rhythms using sixteenth note subdivisions" (H-U14). Autumn Moon - H Unit 15, L288 same "1e&a" counting (H-U15). Polonaise in G minor (attrib. J.S. Bach, BWV Anh. 119) - H Unit 15, L292 "counting subdivided 16th notes" (H-U15). Spinning Song (Ellmenreich) - H Unit 16, L301 same (H-U16). Clementi Op. 36 No. 1, 3rd mvt - H Unit 13, L253 "fast 16th-note passages" (H-U13). Scherzo from Sonata No. 9 (Haydn) - H Unit 17, L330 "counting 16th-note rhythms" (H-U17). Triplets: see 1.4. Swing: none stated. Skill lesson: PVL 6-12 Sixteenth Notes (no piece).
- 2.5 Voicing the melody: Melody for Left Hand (Schytte) - H Unit 9, L162 "voicing to bring out the LH melody over the RH accompaniment" (H-U9). Morning Salute - H Unit 9, L175 (above). Sonatina in C (Clementi) - H Unit 13, L242 "bring out the melody through voicing" (H-U13). Ballade (Burgmuller) - H Unit 12, L232 "voicing melody over accompaniment" (H-U12). Arabesque (Burgmuller) - H Unit 12, L222 "balancing melody and chords" (H-U12). The Song of Twilight L280 and Etude in D Minor L263 "voicing" (H-U14); The Mechanical Doll L300 "voicing and phrasing" (H-U15).
- 2.9 Grade 2 pieces: candidates from the lists above with a stated technique (Arabesque, Ballade, Minuet in G, Musette in D). Arabesque L225 "playing fast notes clean and even" (H-U12); Ballade L233 "practice tools for fast sections" (H-U12). Kind (agile/lyrical) is inferred.

### Grade 3 rungs
- 3.4 Ornaments and weighted tone: Minuet in G (Petzold, BWV Anh. 114) - H Unit 14, L264 "Technique and tips for playing mordents"; L266 "playing trills" (H-U14). Sonatina Op. 36 No. 1, 2nd mvt (Clementi) - H Unit 13, L247 "New technique: playing trills" (H-U13). Solfeggietto (C.P.E. Bach) - H Unit 18, L346 "play a turn ornamentation" (H-U18). Sonatina in C, 1st mvt - H Unit 13, L243-244 "Wrist rotation technique" (H-U13) matches the rung's "rotation (meet)". Sforzando: The Wild Horseman H Unit 14, L274 "arm weight to achieve an effective sforzando" (H-U14); Arabesque L221 term sforzando (H-U12). Appoggiatura: stated as a Unit 14 skill on the directory page without a piece. Polonaise in G minor L294 "improvise embellishments on the repeats" (H-U15).
- 3.5 Harmony and cadences (match inferred; the sources say "chord analysis", none says Roman numerals or cadences): Andante (J.C. Bach) - H Unit 11, L201 "identifying chords and inversions" (H-U11). Scherzo (Haydn) - H Unit 17, L330 "harmonic analysis and... chord and non-chord tones" (H-U17). Solfeggietto - H Unit 18, L344 "chord analysis" with tonic and dominant (H-U18). Arabesque - H Unit 12, L222 "chord analysis review" (H-U12). America (My Country 'Tis of Thee) - H Unit 13, L255 "harmonizing a melody... from a lead sheet" in E-flat (H-U13), and ZK Intermediate L24 has the song with no skill stated (section 3).
- 3.2/3.1, 3.6, 3.7, 3.9: scale, arpeggio, ear, reading and improv rungs; no pieces. Improvising: H Unit 15, L296 "improvising over i-VII-VI-V in B minor" (H-U15, no piece).
- 3.8 Grade 3 pieces: Arabesque, Ballade, Sonatina in C (Clementi Op. 36 No. 1 mvts 1-3), Minuet in G, The Wild Horseman, Sonatina in G. Source gives no kind labels; fit by stated technique only as listed above.

### Above Grade 3 (lower priority, only items where a source states a skill)
- 4.3 Diminished and augmented; embellishing a lead sheet: Prelude in C minor (J.S. Bach, BWV 999) - H Unit 16, L309 "identifying diminished triads" (H-U16). Danny Boy "Arranging Project" H L312 (H-U16) and America L256 "creating an original arrangement" (H-U13). Skill lessons without a piece: ZK L42 Diminished Chord, L43 Augmented Chord (ZK-dir); H Unit 12, L226 term "augmented".
- 4.4/5.4 pieces and period style: The Village Prophet (Rousseau) - H Unit 11, L212-213 "Baroque style characteristics" (H-U11); Polonaise in G minor L294 "Baroque-era characteristics" (H-U15); Elfin Dance (Grieg) - H Unit 17, L326 "interpreting Romantic Era music" (H-U17); Scherzo (Haydn) and March in D (C.P.E. Bach) L332, L339 "dynamics, articulations, phrasing and voicing" (H-U17).
- 6.4 Technique/counterpoint: Prelude in C minor (BWV 999) L306 "block chords as a time-saving practice tool" (H-U16).
- 8va and high ledger lines (6.7/7.8 touch): The Mechanical Doll L299 (H-U15).
- Tritone/intervals: H L327-334 and L354, L360 teach intervals by sight and ear as lessons without pieces (see section 4).

### Levels P and A (the brief's priority excludes these; stated skills only)
- P.1: D Journey - H Unit 1, L5 "applying principles of great piano posture"; C Boogie - H Unit 1, L6 "Review Piano Posture Checklist and apply" (H-U1).
- P.6 Free improvising: Hot Cross Buns (H L2) and Listen for Bells (H L19), as above.
- A.3 upbeats: Happy Birthday - H Unit 6, L115 "pick-up note, and downbeat" (H-U6); Greensleeves L227 "pickup beats"; When Johnny Comes Marching Home L199 "pickup beat" (H-U12, H-U10). A.3 rests/eighths: Rhythm Composition H L12 "quarter notes, eighth notes, and quarter rests" (H-U1).
- A.4 Hands together: Frog in the Middle (left hand 2-note chords), Mouse in the House (L23 chords in LH), Love Somebody - H Unit 3, L44 "using the left hand and hands together" (H-U3); Oranges and Lemons L60 "Add chords in the left hand" (H-U3); Spinning Song H Unit 4, L67 "2-hand rhythms while counting the beat" (H-U4). PVL 2-7 "Hands Together" (skill lesson).
- A.5 I and V7: Dinah (L37), Row Row Row Your Boat (L83), as above; H Unit 2, L32 "The One Chord" (no piece).
- A.6 expression: Bagpipe L71, Ode to Joy L78 (H-U4). Mouse in the House L22 "Glissando" (H-U2).

## 3. Unplaced songs worth considering (no skill stated by the source for the piece)
- Hoffman Academy (Popular Music section of the directory, no level given; page /popular-songs not readable): Fur Elise, Twinkle Twinkle Little Star, Moonlight Sonata, Happy Birthday to You, Canon in D (Pachelbel), Gymnopedie No. 1 (Satie), Chopsticks, Clair de Lune (Debussy), Jingle Bells, Amazing Grace.
- Hoffman, lesson text gives no skill: Promenade (Reinagle, Unit 10, L181-182); The Bear (Rebikov, Unit 10, L188, L190); Down by the Bay (Unit 11, L207-208); Five Woodpeckers (Unit 1, L8: "using either the right hand, left hand, or both" - a performance choice, not a skill); Rain Come Wet Me, Who's That?, Let Us Chase the Squirrel (Unit 2, L25-31; solfa and staccato-type reviews only); I Have a Dog (Unit 3, L56-57: "figure out a melody by ear" - an ear skill, no rung for it); Love Somebody; C Boogie (posture only); Canoe Song (Unit 8, L141-143, C minor); Deta, Deta (octave displacement in left hand, L146); Super Secret Agent, Autumn Moon, Elfin Dance, Scherzo (Haydn), March in D (C.P.E. Bach), Solfeggietto, Minuet in A (Scarlatti, K. 83), Sonatina in C Op. 36 No. 3 (Clementi), Fur Elise (rondo, 3/8), The Entertainer (Joplin, simplified), Prelude in C Minor, El Matador, Sonatina in F (Anh. 5 No. 2): placed above where a skill was stated, otherwise here.
- Zebra Keys (songs; the pages state no skill beyond the title): Brother John, London Bridge Is Falling Down, Twinkle Twinkle Little Star (Beginner L6-8); America (My Country 'Tis of Thee), Silent Night, God Rest Ye Merry Gentlemen (Intermediate L24-26); The First Noel, Auld Lang Syne, Hark! The Herald Angels Sing (Advanced L39-41); blog tutorials Aura Lee, Yankee Doodle, Clementine, We Wish You a Merry Christmas, Row Your Boat, Up On The Housetop (not opened). URL: ZK-dir and /lessons/beginner/learnsongs/.
- PianoVideoLessons: Windchimes (2-14), Eine Kleine Nachtmusik (3-3, listed under "Beginning Hands Together"), Andantino (Kohler) 4-13, Brahms Lullaby 6-2, From the New World 6-5, March Slav 6-8, Moonlight Sonata 6-11, Pachelbel Canon 5-11 and 6-14 (5-11 is a "Chords in D Major" lesson per the title; the page was a "coming soon" placeholder), Fur Elise 6-16. Hoffman and PVL both list Pachelbel Canon, Moonlight Sonata, Fur Elise, Amazing Grace, Happy Birthday: two-source pieces, but neither states a skill beyond what is placed above.
- 4 Square Piano, Flex Lessons, Mayron Cole: no pieces readable (section 1).
- Backing tracks/styles with no piece: Spanish Serenade (H Unit 9, L166), Latin-style accompaniment (L165), Bossa Nova (Unit 16, L311).
- Already in earlier lists: Happy Birthday, Mary Had a Little Lamb, London Bridge, When the Saints, Twinkle (see section 1).

## 4. Proposed new rungs (evidence rule: working threshold, mine and not the owner's: at least two sources teach the skill as its own lesson or unit, and no rung's "Learns:" line covers it)
I searched rungs.md for the key words (key signature, circle of fifths, compos, Hanon, practice strategy, dictation, diatonic, secondary) before listing. Whether curriculum.md or other documents cover these was not checked. All of these are proposals; the owner may prefer to leave them out as outside the app's scope.

1. Key signatures and the circle of fifths. Sources: H Unit 6 L114 "Circle of Fifths Challenge"; Unit 8 L157 and L159 "Key Signatures and the Ladder of Fifths"; Unit 17 L335 (ladder of fifths for A-flat); ZK Beginner L16 "The Circle of Fifths" and L12 "12 Keys of Music"; PVL 6-1 "Key Signatures". Three sources. The word appears in rungs.md only in rung 3.1's alternative line (Faber's Power Scales and circle of fifths); no "Learns:" line names it.
2. Composing and notating one's own short melody or rhythm. Sources: H L12 "Rhythm Composition", L77 "Composing in Binary Form", L98 "Composing with a Haiku", L235 "Composition Project", L291 "Composition Project: Chord Progressions"; PVL 4-14 "Melody Writing". Two sources. No rung covers composing (P.6 and the improvising rungs cover improvising only).
3. Finger-technique exercises (Hanon-style "finger gym" drills). Sources: H Unit 7 (L131, L135, L139 finger skips), Hanon in Units 14-18 (L269, L275, L284, L295, L305, L318, L329, L340, L355); PVL 3-4, 3-8, 3-12, 3-16 "Hanon" and the Finger Gyms in Units 1-3. Two sources. The technique rungs cover scales, arpeggios and double notes, not Hanon-type drills.
4. Practice strategies as a taught skill (slow metronome, practising problem spots, "fast tools"). Sources: H L119, L170, L180, L204, L233, L347; 4 Square level chart (structured practice, "starting at the end", personal practice plan; reading of a garbled chart, so inferred). Two sources, but this may be an app feature rather than a rung.
5. Diatonic chords of a scale (all the chords of a key, including ii, iii, vi). Sources: H Unit 10 L185 "all diatonic chords in the key of C", L206, L226, L230; PVL 5-5 "Diatonic Chords in C Major" and 5-6 "all 6 major and minor triads"; ZK L15 "Chords of the Major Scale", L33 "Chords of the Natural Minor Scale". Three sources. Partly covered: 4.3 names "I, II, IV, V7, VI" in lead sheets, 7.5 names vi, 3.7 uses ii; no rung lists the full set of diatonic triads as something learned, so this may only need a Learns phrase added to 3.5 or 4.3 rather than a new rung.
Considered and not proposed: intervals by sight and ear as lessons (H L61, L327-334, L354, L360; PVL 4-7; ZK L14) - covered by A.1, B.1 and the ear rungs; transposing (H L14; PVL 4-6, 4-8) - covered by B.3; chord inversions (H L191; PVL 4-10, 5-13; ZK L17, L37) - covered by 2.3; 7th, 6th, sus and extended chords (ZK L29-31, L44-49) - covered by J.2-J.5, PR.3, PR.4, PR.7; melodic and rhythmic dictation (H only) and form analysis (H only) - one source; whole-tone scale (ZK L22 only, 8.1 has it at Grade 8).

## 5. Not done
- Mayron Cole: no piece list or skills (contents are Google Drive PDFs, not read; brief excludes the PDFs). Nothing placed.
- 4 Square Piano: level books are PDFs, not downloaded; no piece list; level chart garbled in the fetch. Nothing placed.
- Flex Lessons placement guide: behind an email sign-up, not read. Nothing placed.
- Hoffman /popular-songs page: returned no content; the Popular Music list is from the directory only.
- Zebra Keys: only the directory and four section pages opened; intermediate and advanced song, technique and music-theory pages not read.
- PVL Units 1-3: unit pages not opened (directory titles only); PVL lesson pages (individual lessons) were not opened, so skills there are the lesson titles only.
- All quotes and statements come through the fetch tool's summaries, not the raw pages; none was checked against the raw page.
- Not checked: whether any proposed piece is in the earlier candidate lists beyond the title-level look at the first rows of the three CSVs (the full CSVs were not compared); whether the pieces suit each rung musically (no score or audio was examined; no piece grade was looked up in a syllabus); whether the owner's rung text or curriculum.md already covers the section 4 items.
- No rungs were edited, no files were downloaded, no logins were used.
- Fetch budget: 46 of 60 used. The end condition (every listed source read once or the budget spent) was met for all six sources; three of them (Mayron Cole contents, 4 Square, Flex) are limited by what is publicly readable.
