# Second read of the fix pass (2026-09-21)

A second reader checking the 2026-09-19 fix pass. Only 6 of the 236 ticked findings had
been checked by anyone but the fixer; this checks a sample of 72, item by item, against the
score, the curriculum and the code.

**The sample rule.** (a) Every ticked finding in the lessons that carry rows in
`app/tests/unit/lessonClaimsAboutMusic.test.ts` **and** were edited by the fix pass. (b) Plus
every 4th ticked finding across `batch-1.md` … `batch-5.md` in file order, counting from the
first ticked finding of batch-1 (the 1st, 5th, 9th, … of 236), skipping any already in (a).

**The lessons for (a).** The test names ten lessons — `rock.4`, `rock.5`, `rock.6`,
`hymns.2`, `holiday.3`, `jam.6`, `jazz.4`, `rock.overview`, `holiday`, `holiday.4`. Seven of
those ten carry ticked findings: **`rock.4` (3), `rock.5` (3), `rock.6` (3), `hymns.2` (2),
`jam.6` (2), `rock.overview` (1), `holiday` (1)** — fifteen findings. `holiday.3`, `jazz.4`
and `holiday.4` have no ticked box in any batch file, which is why they are not among the
seven.

**Sample size: 72** — 15 from (a), 57 from (b). Every one was reached.

The instrument, named as a proxy: `tools/content/dump_score.py` prints the **built** score and
prints grace notes as ordinary notes; where that mattered (`hymns.2`, *Joyful, Joyful*) the
`.mxl` was read directly. The catalog's `notation` block is a summary of the file, used for
key, metre, staves, bars and chord symbols only. **Nothing has been heard.**

---

## Batch 1

`batch-1:16 | 0.1 | HOLDS | every catalog row with a file re-opened and <fingering> counted: 1,208 with, 767 without; the values are 1–5 (34 zeros out of ~54,400) | "Wherever sheet music in this app prints finger numbers… many pieces print none" matches the corpus, which the fixer had not re-run.`
`batch-1:55 | 0.3 | HOLDS | ScoreScreen.ts:285 `let metronomeOn = false`, menu row 'Metronome' at :1091, ScoreSession.ts:441 starts it only when `run.metronome === true` | the click is off on every visit and lives on that menu row, exactly as the sentence now says.`
`batch-1:71 | 0.3 | OVERREACH | feedback.ts:31 MISS_PAUSE_MS 2_000, REVEALABLE_KINDS (8 kinds), STAFF_POLICY in drills/types.ts:90-125, DrillScreen.ts:1077-1094 | "a card you missed pauses for two seconds with the answer on it" is true of 14 of the 20 drill kinds; rhythm, dynamics, transposition, pedal and backing-track get FEEDBACK_MS (450 ms) with nothing drawn, and simon gets its own chain replay instead.`
`batch-1:101 | 1.1 | HOLDS | dump_score.py on all six songOptions of rung 1.1 | five stay inside C4–G4 and Kum Ba Yah runs G4–E5, so "every tune in this unit but one" is right and names the right one.`
`batch-1:117 | 1.1 | HOLDS | <fingering> counted in each of the six .mxl files: hot-cross-buns 11/17, mary 26/26, merrily 26/26, au-clair 22/22, ode-to-joy.rh 28/28, kum-ba-yah 0/26 | two of the six do not print a number on every note, so the conditional "Where fingering is printed" is the true form.`
`batch-1:154 | 1.3 | HOLDS | rung 1.3 mastery {minAccuracy 0.9, minTempoPct 0.8} in stage-1.json; settingsStore.ts:137-138 passAccuracyPct 90 / passTempoPct 80 | "90 % with the tempo at 80 % or more of the piece's own" is what both the rung and the global pass rule say, and it no longer names a bpm.`
`batch-1:190 | 1.5 | HOLDS | dump_score.py song.folk.the-water-is-wide.pdmx, bars 1–11 | bar 1 and bar 5 leap D4→G4 (a fourth), bars 3, 9 and 10 hold the only skips, the rest are steps and repeats.`
`batch-1:263 | 2.1 | HOLDS | catalog `drill.technique.ht-holds` {key C, hands both, leftHand hold}; fromCatalog.ts:611-634 `buildTechniquePattern` (root = tonic unless hands==='left'; promptText names the right hand) | `hands: both` is not `left`, so the walk is a right-hand call-and-response and `leftHand` is read by nothing (grep `leftHand` across app/src hits only sightReading.ts and LabScreen.ts, both the lab's own field; grep `p.leftHand` returns nothing).`
`batch-1:279 | 2.1 | HOLDS | rung 2.1 mastery {0.9, 0.8}; settingsStore.ts:137-138 | the sentence now states the pass rule instead of a bpm, and matches both.`
`batch-1:306 | 2.2 | HOLDS | catalog `drill.reading.sight-reading-2-right` {level 2, bars 4, hands right}; sightReading.ts LEVELS[2].rhythms includes DIVISIONS/2, pickRhythm draws uniformly from the affordable list | eighths are in the level-2 pool from the first bar and nothing adapts to the learner.`
`batch-1:332 | 2.3 | HOLDS | grep `rolledChord` across app/src → PracticeEngine.ts:245/777/1190/1256, Scoring.ts:94/136, types.ts:379 only; second search `rolled|Rolled` across app/src → the only ui hits are "scrolled"/"unrolled" | no screen reads the count, so the learner is never told, which is what "the app does not catch a roll" says (the engine does count it internally and shows nothing).`
`batch-1:355 | 2.4 | HOLDS | dump_score.py song.folk.greensleeves.simple, bars 0–15 | the dotted-quarter-plus-eighth figure is in bars 2, 4, 6, 10, 12, 13, 14 — 7 of the 15 full bars, "nearly half"; key is fifths 0 mode minor ending on A, so "minor-key" holds too.`
`batch-1:381 | 2.5 | HOLDS | fromCatalog.ts:611-634; grep `shifts` across app/src (--include=*.ts and unfiltered) returns nothing; dump_score.py exercise.position-shift.c.right bars 1–4 | the drill's `shifts: true` is read by nothing so it plays the plain walk, while the rung's three `exercise.position-shift.*` items do shift (bar 3 moves to G4–C5).`
`batch-1:397 | 2.5 | HOLDS | rung 2.2 and rung 2.5 exerciseOptions both hold `drill.reading.sight-reading-2-right`; sightReading.ts LEVELS[2].rhKey {low 60, high 72} | it is literally the same item with the same params, and level 2 already reaches C5.`
`batch-1:411 | holiday | HOLDS | dump_score.py song.classical.1863-…-we-three-kings…, all 17 bars | 6/8 and E minor for bars 1–8 (Em/B7, ending on E), then bars 9–17 over D7/G/C/G ending on G — the verse/refrain split the sentence now makes.`
`batch-1:422 | hymns.2 | HOLDS | rung hymns.2 exerciseOptions (drill.chord.c-f-g, exercise.cadence.c.root, drill.chord.symbol-flash); fromCatalog.ts:297-304 roots [0,2,4,5,7,9,11] × ['', 'm', '7', 'm7', 'maj7']; PromptDrill.ts uses its clock only for reactionMs, no timeout | the three shapes are one drill and the flash of minors and sevenths the other, and nothing ends a card on time.`
`batch-1:426 | hymns.2 | HOLDS | the .mxl read directly (scores/pdmx/QmY8XeRQK…): <fifths>0</fifths>, zero <alter>, 72 <grace> against 62 sounding notes, <sound tempo="40"/>; bars 1–4 with graces stripped are F5 F5 G5 A5 / A5 G5 F5 E5 / D5 D5 E5 F5 / F5 E5 E5 | every claim in the sentence — on D, every F natural, a grace before nearly every note, tempo 40 — is on the page, and it makes no claim about sound.`
`batch-1:440 | 3.1 | HOLDS | rung 3.1 exerciseOptions (g-major and f-major …similar.right.2 only); catalog holds …similar.left.2 for both keys | the right-hand scales are on the rung and the left-hand ones exist to be found in the Library. Note: the mastery line the finding also flagged (now 3.1:44, "G and F major scales hands separately") was left unchanged.`

## Batch 2

`batch-2:42 | 3.3 | HOLDS | rung 3.3 exerciseOptions; dump_score.py exercise.scale.a-harmonic-minor.1oct.similar.both.2 bars 1–2 | the rung's only A harmonic minor scale puts RH A4–A5 and LH A2–A3 in the same bars, so "hands together" is right and "hands separately" was not.`
`batch-2:83 | 3.6 | HOLDS | rung 3.6 exerciseOptions; dump_score.py exercise.accompaniment.broken.a-minor.both bars 1–4 | that item is the rung's only hands-together accompaniment-pattern exercise and it is a broken LH (A–C–E–C, D–F–A–F, E–G–B–G) under an RH scale.`
`batch-2:106 | classical.3 | HOLDS | dump_score.py song.classical.beethoven-…-ecossaise.pdmx | catalog title says "Écossaise in G major, WoO 23" while the file is fifths −1, one staff, 2/4, "Allegro", bar 1 F4 to bar 32 F5 — all four clauses of the new sentence.`
`batch-2:144 | blues.3 | HOLDS | dump_score.py song.classical.st-louis-blues.pdmx, bars 1–18 with chord symbols | bars 1–12 run E, A7, E/B7, E, A7, –, E/B7, E, B7, –, E, B7 and bar 13 starts a new (minor) section, so "opens with twelve bars of it" is supportable; reading the form from symbols is a musician's judgement, and bars 3 and 7 carry both I and V, which the textbook shape does not.`
`batch-2:176 | improv.3 | HOLDS | catalog `drill.improv.loop-i-iv-v` {progression C C C C F F G G, bpm 72, scored false}; rung improv.3 `tools` is null | the loop is the rung's own drill with exactly that progression and tempo, and the rung has no lab button to be "the accompaniment lab's Jam it".`
`batch-2:206 | rock.overview | HOLDS | catalog levels of the four songOptions: canon-d.easy 5.1, greensleeves.chords 3.3, scarborough-fair 2.79, ode-to-joy.full 2.5 | the Canon is the highest of the four, using the catalog level as the stated proxy for difficulty.`
`batch-2:219 | latin.3 | HOLDS | LessonScreen.ts:404-449 (`case 'duet'` takes the first playable song = songOptions[0]); dump_score.py of all three songs (staves 1) and of exercise.clave.son-3-2.pulse (staves 2, LH a quarter pulse, score text "The left hand is the beat") | the button does open Cielito Lindo on one staff, and on the pulse exercise choosing the right hand leaves Duet playing the LH pulse.`
`batch-2:280 | 4.3 | HOLDS | dump_score.py song.classical.pachelbel-canon-d.easy, bars 1–22 | the LH is eighth-note broken chords in bars 1–12 and half-note bass pairs from bar 13, which is what "breaks its chords for the first twelve bars" says; Greensleeves is on the rung too.`
`batch-2:320 | 4.5 | HOLDS | dump_score.py song.folk.row-row-row-your-boat (bars 1–8) and song.folk.greensleeves.68 (bars 0–15) | Row Row has quarter–eighth in bars 2, 3 and 7; Greensleeves 6/8 has two dotted quarters a bar in the LH and an RH half note crossing the second beat in 7 of its 15 full bars, i.e. "often".`

## Batch 3

`batch-3:16 | 4.6 | HOLDS | rung 4.6 `tools: [{"kind":"blind"}]`; LessonScreen.ts:451-455 `case 'blind'` → navigateScore(first playable song, {blind:true}) | the paragraph now opens with the rung's only button and what it does, and keeps Today as advice rather than as a rung tool.`
`batch-3:44 | 4.7 | HOLDS | style.css:5407-5442 (`.score-stage--blind {visibility:hidden}`, buffers hidden by name, only .score-countin/.score-beat/.score-stage__corner re-shown); WindowRenderer.ts:695-705 appends `.score-cursor` inside the score view; ScoreScreen.ts:368/393 stage vs :469-472 stripHost, siblings under the section | the cursor is inside the hidden stage with no rule bringing it back, and the keyboard strip is outside it, so the four things the sentence names are right.`
`batch-3:88 | classical.4.shelf | HOLDS | all 50 `songOptions` of classical.4.shelf re-read with their catalog titles | exactly four Chopin préludes are on the shelf (Op. 28 Nos. 7, 20, 6 `.nifc` and No. 4 `.alt`), and the one waltz, Op. 64 No. 2, is level 8.1, where the sentence now puts it.`
`batch-3:104 | classical.4.shelf | HOLDS | `composer` and `compositionStatus` of all 50 shelf rows | 27 rows are non-public-domain; after the nine composers named by name plus Elgar, Puccini, Mascagni, Kreisler, Holst, Mahler and Rachmaninoff, exactly seven are left — Across the Violet Sky, Rosemary's Waltz, Pan's Labyrinth, Days in the Sun, Super Mario Land 2, Travelling and G Minor Bach.`
`batch-3:129 | chords-pop.4 | HOLDS | dump_score.py song.folk.hallelujah-easy.pdmx, LH of all 29 bars; notation.chordCount 0 | bars 1–8 alternate C and A (I and vi), bars 9–13 give F, F–G, C, bars 21–26 are F F Am Am F F (IV and vi), bar 18 is the G♯ bass of an E chord — which is why "mostly its chords" is the right hedge — and no symbol is printed.`
`batch-3:198 | theory.4 | HOLDS | catalog `drill.ear.melodic-dictation` {bars 2, mode dictation}; fromCatalog.ts:202-203 drops the params; factories.ts:277-296 callResponseDrill builds a 4-note phrase from range(60,67) with `label` = the note names; DrillScreen.ts drawStage has no `call-response` case, so the default symbol card at :1288-1296 prints `current.label` | four notes, played back, with their names on the card is exactly what the code does.`
`batch-3:223 | improv.4 | HOLDS | rung improv.4 `tools: [{"kind":"lab","preset":"pop-four-chord"}]`; sightReading.ts:857-867 (`progressionId: 'i-v-vi-iv'`, locks ['progression','leftHand']); LAB_PROGRESSIONS `i-v-vi-iv` = I V vi IV; LabScreen.ts:585-603 applyLocks disables the progression select | the lab opens locked on I–V–vi–IV, the key is not locked (so "Change the key" survives), and the rung's loop drill is the I–vi–IV–V one.`
`batch-3:251 | jam | HOLDS | LabScreen.ts:326-337 drawJamForm prints "Bar n of N · pass n"; jam rung's preset is `blues-shuffle` (bars 12); catalog `drill.jam.form-tracker` {form 12-bar, keys E A G D C, chartView true}; fromCatalog.ts:583-591 takes `strings(p.keys)[0]`; grep `chartView` across app/src returns 0 matches both with --include=*.ts and unfiltered | Jam it does show the bar and the pass, the drill is a twelve-bar loop in E, and nothing reads `chartView`.`
`batch-3:279 | technique.4 | OVERREACH | dump_score.py of all three Lemoine études, every bar | No. 1 (RH scale over LH chords) and No. 2 (LH scale under RH chords) are right, but in No. 35 all sixteen bars strike their triads as blocks — bars 1–8 are repeated triads in changing inversions, bar 4 is two-note chords, bars 9–12 are block triads through inversions — so "repeated **and broken** triads in 6/8" adds a figure that is not on the page; 6/8 and "repeated triads" are true.`
`batch-3:295 | rock.4 | HOLDS | dump_score.py exercise.ostinato.e.fifths and exercise.ostinato.d.arpeggio, all 8 bars each | E4–B4 repeating over LH E2+E3 whole notes, and D–F–A–D–A–F–D–F over LH D2+D3 whole notes: two notes in E minor, a broken triad in D minor, both over a bass that never moves, and the power-chord and vamp exercises are no longer described.`
`batch-3:299 | rock.4 | HOLDS | content/lessons/rock.overview.md:22-26 | that rung names three textures — "a held chord, a broken chord, or the chord repeated on the beats" — and names neither the power chord nor the ostinato, so "named three textures … the first rock texture" is right.`
`batch-3:303 | rock.4 | HOLDS | LessonScreen.ts:444-449 (`navigateScore(id, {mode:'tempo', hands:'R'})`); router.ts:176-186 ("the duet is *the hand you are not playing*"); ScoreScreen.ts:123-124 R and L hand buttons; dump_score.py song.folk.greensleeves.chords bars 0–4 (RH tune, LH block triads) | the button opens the rung's only song with the learner on the tune, and switching to L makes the app play it.`
`batch-3:322 | classical.5 | HOLDS | dump_score.py of both Clementi rows | the first is "first movement, short edition", 38 bars, 2/2; the second, titled "second and third movements", is 70 bars with one key signature (0) and one metre (3/8) — one later movement in 3/8, which is what the sentence claims.`
`batch-3:353 | chords-pop.5 | HOLDS | sightReading.ts:868-879 ballad {keyId f-major, progressionId i-vi-iv-v, leftHand broken, locks progression/leftHand/rightHand, key free}; LibraryScreen.ts:578 `router.navigateLab()` with no preset; LabScreen.ts:112-119 (preset null → `locked` empty) and :452-471 (the Custom… option and the numerals field) | the rung's lab is locked on I–vi–IV–V with a broken left hand in a free key, and the Library's lab has nothing locked, so both halves of the sentence are true.`
`batch-3:388 | blues.5 | HOLDS | dump_score.py exercise.walking-bass.c.blues.intro, all 12 bars | every bar is root–third–fifth then a note a half step below the next bar's root (B1→C2, E2→F2, F♯2→G2 …), and every bar begins on the new chord's root.`
`batch-3:416 | jazz.5 | HOLDS | rung jazz.5 `tools: [{"kind":"lab","preset":"jazz-comping"}]`; sightReading.ts:894-904 jazz-comping {progressionId ii-v-i, leftHand walking, locks progression/leftHand, key free}; LAB_PROGRESSIONS `ii-v-i` major = ['ii','V7','I','I'] | the preset's label is "Jazz — two five one", its progression is ii–V7–I, its left hand walks, both are locked and the key is not.`

## Batch 4

`batch-4:13 | theory.5 | HOLDS | rung theory.4 and rung theory.5 exerciseOptions both hold `drill.ear.simon-chromatic`; simon.ts:283-284 `simonForStage` returns the chromatic item at stage ≥ 4; stage-1 and stage-3 hold `drill.ear.simon-c-major`; catalog params {low G3, high G4, steps chromatic} | Stage 4 is where the every-key chain starts and Stage 3's is the white-key one, so "from Stage 4 again … rather than the white ones of Stage 3" is right.`
`batch-4:70 | technique.5 | HOLDS | rung technique.5 exerciseOptions (13 items, one shaping: exercise.shaping.a.crescendo); grep `shapingScore` across app/src → only its definition at Scoring.ts:376, second search `shaping` → that line plus the section comment at :214 | one exercise, so the singular is right, and nothing calls the slope scorer, so "the app does not measure the velocity" is right.`
`batch-4:106 | rock.5 | HOLDS | catalog notation.chords: Annie's Song holds Dsus4, andata holds D♯sus4; rung rock.5 has exactly two songOptions | the "only two in the library" claim is gone and what replaced it — that both print the sound in their symbols — is true of each.`
`batch-4:115 | rock.5 | HOLDS | dump_score.py of all four rung exercises (open-voicing c.sus2, c.sus4, c.add9, f.sus4), every bar | in every bar the LH root is exactly two octaves below the lowest RH note, and the RH holds the remaining chord tones from middle C (or F4/G4/B♭4) upward.`
`batch-4:119 | rock.5 | HOLDS | dump_score.py song.classical.sakamoto-andata.pdmx, bars 1–14 | every bar has a whole-note chord held in at least one hand, which is what "chords held for whole bars" claims; the earlier "a great deal of silence" is gone and no claim about sound replaced it.`
`batch-4:159 | classical.6 | HOLDS | dump_score.py of all six songOptions | BWV 846 is one broken-chord figure shared between the hands with no tune in either; the Chopin préludes 4 and 7, the A minor waltz, the Gymnopédie and Für Elise each put the tune in one hand over the other — so "in all but the Prelude in C" names the one exception correctly.`
`batch-4:202 | ragtime.6 | HOLDS | rung ragtime.5 songOptions hold `song.ragtime.joplin-entertainer`; catalog notation.bars 92 | it is the same item on both rungs, so Stage 5 offered the complete score and "now read as a whole" is the honest wording.`
`batch-4:218 | ragtime.6 | HOLDS | catalog notation.keys: Peacherine fifths −3, −2, −4; Easy Winners fifths −4, −5 | across the two rags the key signatures run from two flats to five, so "two to five flats" is right and "three to five" was not.`
`batch-4:288 | blues.6 | HOLDS | dump_score.py exercise.boogie.c.pinetop, .c.root-fifth and .f.walking-eighths, all 4 bars each | each is four bars over a single chord (C7, C7, F7), the first two in C and the third in F, exactly as the sentence now divides them.`
`batch-4:324 | chords-pop.6 | HOLDS | dump_score.py LH of all six songOptions — All of Me (bars 5–13 Em–C–G–D repeating), Fallen Down (bars 1–8 D D B B G Gm D A, repeated at 9–16), Clocks (bars 5–8 and 16–22 Eb–Bbm–Fm), Dancing Queen (all 42 bars), Annie's Song, Flying Theme (all 52 bars); catalog chordCount 108 for Annie's Song and 0 for the other five | the three said to loop do, the three said not to do not — the Flying Theme's bars 21–52, which the fixer left unread, hold no fixed cell either — and Annie's Song is the only one with symbols. Clocks has a Gb/Db bridge at bars 9–11 outside its three-chord loop.`
`batch-4:368 | improv.6 | HOLDS | theory.ts:305-331 romanToChord (`ii7` → [0,3,7,10], `V7` → [0,4,7,10], `I` → [0,4,7]); LabScreen.ts showChordOnKeys lights those pitch classes; LabScreen.ts:684 the *Free* chip navigates to `#/lab` with no preset, so the locked progression select is escapable | the third and the seventh are lit on ii7 and V7 and not on I, which is what the sentence now restricts itself to.`
`batch-4:384 | rock.6 | HOLDS | ScoreSession.ts:961 and :986 play `pitchesToPlay(step, which, focus)` with `playbackHands ?? 'non-focused'`; dump_score.py Gnossienne bars 1–11 (LH the repeating figure, RH the tune) and Moonlight bars 1–7 (bar 5 RH v1 melody over v2 arpeggio, LH v2 also arpeggio) | Duet takes a whole hand, the Gnossienne split works, and Moonlight's melody and arpeggio really do share the right hand.`
`batch-4:388 | rock.6 | HOLDS | catalog levels: ostinato.a.arpeggio 3.4, accompaniment.broken.a-minor.both 3.6, pedal.a 3.5, pedal.half-pedal.a 7.4; songs 4.6, 6.0, 7.1 | three of the four exercises are below all three pieces and the half-pedal one is above all three, which the "bar the half-pedal one" clause now says.`
`batch-4:392 | rock.6 | HOLDS | dump_score.py exercise.ostinato.a.arpeggio (RH A–C–E–A–E–C–A–C over LH A2+A3 whole notes) and exercise.accompaniment.broken.a-minor.both (LH A–C–E–C, D–F–A–F, E–G–B–G under an RH scale) | the sentence now describes the second exercise as what it is rather than as the same figure.`
`batch-4:413 | jam.6 | HOLDS | theory.ts:160-163 nameHeldChord returns null below three midis and below three distinct pitch classes; FreePlayScreen.ts:142-153 `held.add` on noteOn, `held.delete` on noteOff, then nameHeldChord(notes) | only notes down together are named, so a one-note-at-a-time line names nothing.`
`batch-4:417 | jam.6 | HOLDS | backingLoop.ts:52-76 barSchedule puts bass at beat 0 (root) and beat 2 (the fifth) only; sightReading.ts:880-892 blues-shuffle `leftHand: 'walking'` with the key unlocked; :469-478 LEFT_HAND_PATTERNS.walking = root, third, fifth, sixth in quarters; LAB_KEYS holds e-major, a-major and d-major | Read it writes the walking line, Jam it plays root and fifth, and E, A and D are settable.`
`batch-4:441 | classical.7 | HOLDS | rung classical.7 songOptions (two inventions, no waltz or nocturne); catalog holds 15 inventions BWV 772–786 and 14 Chopin waltz rows and 13 Chopin nocturne rows, every one `tracks: ['classical']` | the sentence no longer implies waltzes or nocturnes are on the rung, and all three families are in the Library.`

## Batch 5

`batch-5:19 | ragtime.7 | OVERREACH | dump_score.py song.ragtime.joplin-maple-leaf-rag, LH of bars 0–35 | the second strain is bars 17–32, and only bars 18, 20, 22, 24, 26 and 28 are bass–chord–bass–chord; bars 19, 21, 23, 25 and 27 put a bass octave on both of the last two eighths, bar 17 has three chords and one bass, and bars 29–30 are bass octaves throughout — so "twice a bar in the second strain" is true of six of its sixteen bars, not of the strain. The fixer's own evidence line ("18-28 bass-chord-bass-chord") is the partial read.`
`batch-5:53 | technique.7 | OVERREACH | dump_score.py of all 13 of technique.7's exerciseOptions | the two broken7 exercises are indeed single sixteenths in each hand, but `exercise.independence.c.2v3` and `.c.3v2` are also one note at a time in each hand — eight against twelve eighths, two hands at different speeds — and `exercise.pedal.half-pedal.a` is one whole note against a whole-note chord, so "the two broken dominant sevenths are **the** exception, one note at a time in each hand" states as the only exception a criterion that two other exercises on the same rung also meet. The five that do fit are double-third left and right, double-sixth left and right, and the octave scale; broken-octaves (left, right) and the tremolo are one hand across two registers, one note at a time.`
`batch-5:72 | technique.7 | HOLDS | dump_score.py of the three Czerny items — No. 5 (RH scales bars 1–5, LH scales bars 15–22, RH double notes bars 16, 18, 20, 22), No. 8 (RH broken chords spanning two octaves, bars 17–22), No. 10 (LH 32nd-note broken figure with a repeated C4, RH octaves bars 11–12, RH thirds bars 25–28) | each of the three descriptions matches its own piece; "the faster ones" is still unchecked, as the fix line says.`
`batch-5:104 | jazz.7 | HOLDS | rung jazz.7 `tools` are `play` and `duet`; LibraryScreen.ts:578 opens the lab with no preset; sightReading.ts:999-1026 romanToLabChord reads a leading b/♭/#/♯ and theory.ts:305-331 reads a trailing 7 | the lab is reachable only from the Library here, and it does take `ii7 V7 I` and `ii7 ♭II7 I`.`
`batch-5:132 | blues.7 | HOLDS | ScoreScreen.ts:2311 `rhythmAvailable = mode === 'tempo' && !blind && !performanceRun`, row text at :905-912 ("One tap per written note or chord"); dump_score.py exercise.stride.f bars 1–4 (LH F2, A3+C4, A3, A3+C4 — F2 to A3 is a major tenth) | Rhythm only is a Keep-tempo score setting, and the four taps a bar it asks for really are bass, chord, tenth, chord.`
`batch-5:160 | chords-pop.7 | HOLDS | rung chords-pop.7 `tools: [{"kind":"play"}, {"kind":"lab","preset":"ballad"}]`; sightReading.ts:868-879 ballad (i-vi-iv-v, broken LH, progression/leftHand/rightHand locked, key free) | the paragraph now names both of the rung's tools and states the preset's loop, its fixity and its free key correctly. Not checked: the same paragraph's claims about the ninth-chord drill's *Hear it* and *Show me*, which were not part of the finding's quoted text.`
`batch-5:205 | rock.7 | HOLDS | rung rock.7 exerciseOptions (shaping a.crescendo, a.diminuendo, c.crescendo); dump_score.py of all three: 5 bars, eighths in bars 1–4 and one note in bar 5, score text "Grow evenly from the first note to the last" / "Fade evenly from the first note to the last" | four bars and a last note, one direction each, is what all three are.`
`batch-5:233 | classical.8 | HOLDS | ScoreScreen.ts:862, :1405, :1723 and :2214 all go through `session.loopForPrintedBars`, :1723 with the same measure twice; PracticeEngine.ts:67 LADDER_NOTCH_PCT 10, :77 LADDER_CEILING_PCT 100, :103-108 nextLadderTempo; ScoreScreen.ts:1480-1482 ladderApplies | the shortest loop is one printed bar, and the ladder moves a tenth of the written tempo each way up to the written tempo, with a loop, in Keep tempo.`
`batch-5:279 | technique.8 | HOLDS | rung technique.8 has no `tools` key in stage-8.json; PracticeEngine.ts:67 and :103-108; ScoreScreen.ts:1480-1482; dump_score.py exercise.scale.c-major.4oct.similar.both.1 bar 1 (C4 up to D6) | the rung has no tool row, the ladder needs Keep tempo and a loop, ten per cent of 120 is twelve, and one bar of these scales is two octaves up.`
`batch-5:323 | blues.8 | HOLDS | rung blues.8 `tools` hold `lab` preset `blues-shuffle`; sightReading.ts:880-892 (locks progression, leftHand, bars; key free) and :746-750 BLUES_MAJOR = I7 I7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7; LAB_KEYS holds eb-major | the form is fixed, every chord is a seventh, and E flat is settable — the paragraph no longer asks for typed numerals on a disabled picker.`
`batch-5:396 | jazz.9 | HOLDS | catalog notation.bars of the six songOptions: Take Five 25, Ain't Misbehavin' 36, Lullaby of Birdland 26, Linus and Lucy 111, Stardust 52, When the Saints (jazz) 9 | "The same form each time" says only that the one standard keeps its form across the four treatments, which no option contradicts; the false "32 bars" is gone from line 15 and from the tools paragraph.`
`batch-5:421 | blues.9 | HOLDS | every rung id starting `blues` across stage-0.json … stage-9.json: blues.3, .4, .5, .6, .7, .8, .9 | seven blues rungs means blues.9 plus six others.`

---

## The claim-test rows, for the seven lessons in (a)

Read row by row against each lesson's current text and against the catalog's `notation`.
"Agrees" means the lesson still says it; "still true, no longer stated" means the row passes
against the data and the lesson has stopped asserting it.

### `rock.4` — 2 rows

- *Greensleeves (with chords) is in A minor* — **agrees**. `rock.4.md:41` "*Greensleeves (with chords)* is in A minor"; notation keys `fifths 0, mode minor`, finalBass 9.
- *…with the chord symbols printed* — **agrees**. Same sentence, "with the chord symbols printed"; notation chordCount 15.

### `rock.5` — 2 rows

- *Annie's Song uses a sus4* — **agrees**. `rock.5.md:29` "uses a sus4 as a hinge"; notation chords hold `Dsus4`.
- *andata has suspensions* — **agrees**. `rock.5.md:31` "suspensions that never resolve where you expect"; notation chords hold `D#sus4`.

### `rock.6` — 3 rows

- *Chopin's Prelude No. 20 is thirteen bars* — **agrees**. `rock.6.md:38` "thirteen bars of block chords"; notation bars 13.
- *Gnossienne No. 1 is written on two staves* — **agrees**. `rock.6.md:36-38` "a left hand that repeats almost unchanged under a right hand that is free", and `:47` "it keeps the left hand going under your tune"; notation staves 2.
- *Moonlight I is written on two staves* — **agrees**. `rock.6.md:49` "*Moonlight*'s melody and arpeggio share the right hand", which presupposes a left; notation staves 2.

### `hymns.2` — 2 rows and 1 comparison

- *Oh When the Saints is hands-alternating, so two staves* — **agrees**. `hymns.2.md:30-31` "is hands-alternating"; notation staves 2.
- *Be Thou My Vision is in 3/4* — **agrees**. `hymns.2.md:32` "is in 3/4"; notation times ['3/4'].
- *(comparison) Swing Low is the only one of the four with its chords printed* — **agrees**. `hymns.2.md:35-36` "is the only one here with its chord symbols printed"; chordCount is 20 for Swing Low and 0 for the other three. The edited *Joyful, Joyful* sentence adds nothing about chord symbols, so it does not disturb this row.

### `jam.6` — 1 row

- *the twelve-bar shuffle in E is twelve bars* — **still true, no longer stated**. `exercise.blues.twelve-bar-shuffle.e` is in the rung's `exerciseOptions` and its notation bars is 12, but the current `jam.6.md` never names that exercise (its only "twelve" are the lab preset at `:38` and the mastery line's "Twelve bars of walking bass in E" at `:47-48`). Nothing in the lesson contradicts the row.

### `rock.overview` — 4 rows

- *Ode to Joy (full) is the tune and a bass under C and G symbols* — **agrees**. `rock.overview.md:31-32` "the tune, and a bass of plain held roots under C and G symbols"; notation staves 2, chords exactly ['C','G'].
- *Greensleeves with chords has a left hand* — **agrees**. `:34-35` "a full triad in the left hand"; notation staves 2.
- *Scarborough Fair is the tune and its symbols, one staff* — **agrees**. `:36` "only the tune and its symbols — one staff"; notation staves 1, chordCount 13.
- *Scarborough Fair is E minor with a C sharp: two sharps, ends on E, an A major chord* — **agrees**. `:37-39` "in E minor with a C sharp in it — the A major chord in the middle of the tune"; notation fifths 2, finalBass 4, chords hold 'A' and 'Em'. The edited sentence at `:40` is about the Canon and leaves this untouched.

### `holiday` — 10 rows

- *Jingle Bells hands together has just the roots C, F and G under it* — **agrees**. `holiday.md:29-30`; notation staves 2, chords exactly ['C','F','G'].
- *Jingle Bells right hand alone is one staff* — **agrees**. `:29` "the right hand alone"; notation staves 1.
- *Silent Night (melody) is in C over C, F, G and a G7* — **agrees**. `:31` "in C over the same three chords and a G7"; notation chords ['C','F','G','G7'], fifths 0 with finalBass 0.
- *Silent Night (melody) is written in 6/8* — **agrees**. `:32` "It is written in 6/8"; notation times ['6/8'].
- *Jolly Old Saint Nicholas has no chord symbols* — **agrees**. `:33`; notation chordCount 0.
- *Jolly Old Saint Nicholas is in B flat, two flats* — **agrees**. `:34` "in B flat, with two flats to remember"; notation fifths −2, mode major.
- *Good King Wenceslas is in G* — **agrees**. `:35`; notation fifths 1, mode major.
- *Good King Wenceslas has E minor, D7 and B7 in its symbols* — **agrees**. `:35-36`; notation chords hold Em, D7 and B7.
- *We Three Kings is in E minor* — **narrowed, not contradicted**. The edited sentence at `:38-39` now says "its verse is in E minor, and its refrain turns to G major and ends there". The row tests the file's declared key, which is still `fifths 1, mode minor` → Em, so the row passes; the lesson no longer asserts the piece as a whole is in E minor, which is the truer statement (bars 9–17 are over D7/G/C/G and it ends on G).
- *We Three Kings is in 6/8* — **agrees**. `:38` "in 6/8 like *Silent Night*"; notation times ['6/8'].

---

## Summary

| verdict | count |
|---|---|
| HOLDS | 68 |
| WRONG | 0 |
| OVERREACH | 4 |
| UNCHECKABLE | 0 |
| **total** | **72** |

**Items not reached: none.** All 72 on the sample list were opened and checked.

### The four OVERREACH items, with what is true

1. **`batch-1:71` — `0.3.md:58-59`, "a card you missed pauses for two seconds with the answer
   on it."** True for 14 of the 20 drill kinds: the eight in `REVEALABLE_KINDS`
   (`feedback.ts:40-49`) draw the answer on a miss and hold for `MISS_PAUSE_MS` (2 s), and the
   ten `after-answer` kinds in `STAFF_POLICY` hold every judged card for the same. For
   `rhythm`, `dynamics`, `transposition`, `pedal` and `backing-track` a miss gets
   `FEEDBACK_MS` (450 ms) with nothing drawn, and `simon` replays the chain instead for as
   long as that takes.
2. **`batch-3:279` — `technique.4.md:52`, "No. 35 is repeated and broken triads in 6/8."** It
   is in 6/8 and it is repeated triads: in all sixteen bars of
   `song.classical.lemoine-etude-op-37-no-35.pdmx` every triad is struck as a block, and what
   changes is the inversion and the off-beat placing (bars 1–8 alternate C–E–G with G–C–E,
   bars 9–12 move a block triad through its inversions, bar 4 is two-note chords). Nothing in
   the piece is played one note at a time, so "broken" is not on the page. The other two
   études in the same sentence — No. 1's RH scale over LH chords and No. 2's LH scale under
   RH chords — are right.
3. **`batch-5:19` — `ragtime.7.md:17`, "back up to a chord, twice a bar in the second
   strain."** The second strain of *Maple Leaf Rag* is bars 17–32. Six of those bars are
   bass–chord–bass–chord (18, 20, 22, 24, 26, 28); bars 19, 21, 23, 25 and 27 put a bass
   octave on both of the last two eighths, bar 17 is chord–chord–chord–bass, bars 29–30 are
   bass octaves throughout, bar 31 is one bass then three chords and bar 32 is two chords then
   two basses. So the figure is true of six of sixteen bars rather than of the strain. The
   fixer's own evidence line reads "18-28 bass-chord-bass-chord", which is the partial read
   that produced it.
4. **`batch-5:53` — `technique.7.md:12-13`, "Nearly everything on this rung is one hand doing
   two things at once; the two broken dominant sevenths are the exception, one note at a time
   in each hand."** The two `broken7` exercises are single sixteenths in each hand, as the
   sentence says. But of the rung's thirteen `exerciseOptions`, `exercise.independence.c.2v3`
   and `exercise.independence.c.3v2` are also one note at a time in each hand — eight eighths
   against twelve, two hands at different speeds — and `exercise.pedal.half-pedal.a` is a
   whole note against a whole-note chord with the pedal as its subject. So the sentence names
   as *the* exception a criterion that two other exercises on the same rung also meet. Five
   exercises do fit the claim: `double-third.c.1oct` left and right, `double-sixth.c.1oct`
   left and right, and `octave-scale.a.1oct.both`; `broken-octaves.a.1oct` left and right and
   `tremolo.c.left` are one hand across two registers, one note at a time.

### What this second read could not verify

- **Nothing has been heard.** Every judgement here is of what is written, in the built score
  or in the code. *Joyful, Joyful*'s 72 grace notes, *andata*'s held chords, the blues form in
  *St. Louis Blues* and the swing in any of it are unheard.
- **`dump_score.py` is a proxy for the MusicXML**, and it prints grace notes as ordinary notes
  and marks neither ties nor tuplets. It was used for every music claim above except
  `hymns.2`'s *Joyful, Joyful*, where the `.mxl` was read directly because grace notes were
  the subject. A claim about ties or tuplets checked only through it would deserve a third
  look; none of the 72 turned on one.
- **The catalog's `notation` block is a summary of the file**, used above only for key,
  metre, staves, bars and printed chord symbols — never for what a hand plays.
- **`batch-2:206` (rock.overview) rests on the catalog `level` as a stand-in for difficulty**,
  which is the fixer's stated proxy and is not a reading of the music.
- **`batch-2:144` (blues.3) rests on a musician's reading of a chord-symbol sequence as a
  twelve-bar blues.** Bars 3 and 7 of *St. Louis Blues* carry both I and V, which the textbook
  shape does not; the fix line already says a musician may confirm.
- **No test suite was run** — the brief forbids it. The claim-test section above is a reading
  of `lessonClaimsAboutMusic.test.ts`'s rows against the lessons and the catalog, not an
  execution of them.
- **`batch-1:440` (3.1) was checked at the cited line only.** The mastery line the same finding
  named — now `3.1.md:44`, "G and F major scales hands separately, one octave" — still asks
  for scales of which only the right-hand ones are on the rung, and was not changed.
- **164 of the 236 ticked findings are still unchecked by anyone but the fixer**, and this
  sample was drawn by position, not by risk.

### The self-audit, and what it caught

Run against `docs/prompts/working-rules.md` and the CLAUDE.md checklist before writing this.

- **§2.1, absences.** Three absences are stated above and each names two searches: `chartView`
  (`grep -rn chartView app/src --include=*.ts` and the same unfiltered, both 0), `shifts`
  (`grep -rn "\bshifts\b" app/src --include=*.ts` and `grep -rn shifts app/src --include=*.ts`,
  both 0), and the rolled-chord readers (`rolledChord` across app/src, then the broader
  `rolled|Rolled`, whose only `ui/` hits are "scrolled" and "unrolled"). **It caught one:** my
  first `leftHand` search was filtered with `grep -v sightReading|LabScreen|lab` and returned
  nothing, which would have been a false absence in the other direction; re-run unfiltered it
  returns 40 hits in two files, neither of them a drill, which is the claim that actually
  matters.
- **§2.2 and §2.3, plurals and ids.** **It caught three of the four OVERREACH items, one of
  them only on a second pass.** `batch-5:53` (technique.7) was first written up as HOLDS on
  the strength of the rung's exercise *ids* — `double-third`, `double-sixth`, `octave-scale`
  read like one hand doing two things — which is a name used as a proxy for the music. Dumping
  all thirteen showed the two `independence` exercises meet the sentence's own exception
  criterion and are not excepted, and that the half-pedal exercise does not fit either.
  For Lemoine No. 35 the
  first six bars read as "repeated triads" and I nearly stopped there; reading all sixteen is
  what showed "broken" is nowhere in it. For *Maple Leaf Rag* bars 18–20 fit "twice a bar" and
  bars 17–32 do not. It also made me read the Flying Theme's bars 21–52, which the fix line
  admitted were unchecked, and *Hallelujah*'s LH to bar 29 rather than bar 12.
- **§1 and §2.3, proxies.** Named in the header and in the list above: `dump_score.py` for the
  MusicXML, `notation` for the file, `level` for difficulty, chord symbols for form.
- **§2.16, the reason not the outcome.** Two fixes have a correct new sentence resting on a
  partial evidence line: `batch-5:19` (recorded above as OVERREACH) and `batch-4:324`, whose
  Flying Theme evidence says bars 21–52 were unchecked — I read them, and the sentence holds.
- **§2.10, green is not done.** The unverified list is above and is as long as the verdict
  table.
- **The restatement, in none of the brief's words:** *decide, for each sampled corrected
  sentence, whether a reader of the app today would be told something the app, the curriculum
  or the notes do not bear out.* Three would.
