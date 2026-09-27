## The old audit's open findings, each with its disposition

**Scope, counted.** `docs/lesson-audit/batch-1.md` … `batch-5.md` hold **87** unticked boxes: 47 JUDGEMENT, 18 THEORY, 17 UNVERIFIED, 4 HISTORY and 1 FALSE. The reviewer's 85 (47 + 18 + 16 + 4) leaves out two of them, and they are dispositioned here anyway, marked *outside the 85*: the FALSE at `chords-pop.5:44`, which the fix pass re-filed as a judgement without re-labelling it, and the UNVERIFIED at `hymns.2:31`, which is a finding about `dump_score.py` and not a lesson sentence. Every item was reconciled against the lesson as it stands in the 109 files (a script matched each quoted sentence against the current text; the ones it could not match were read by hand): all 87 name a lesson that still exists, and 12 had already been rewritten since the audit (one by T10, one by a later edit, ten by T22), which the table says.

**Classes.** *Corrected* (the sentence changed in F0, with its layer); *verified* (unchanged, checked now); *already corrected* (by T10 or T22, re-checked now); *deferred to F* with the reason and one of the four categories the reviewer asked for: **musical judgement**, **contested fact**, **outside expert**, **F's voice rewrite**.

| # | Finding | Kind | Lesson and claim (as audited) | Disposition | Layer / category and reason |
| --- | --- | --- | --- | --- | --- |
| 1 | batch-1:22 | JUDGEMENT | 0.1:42 flat fingers "the main reason" beginners cannot voice two notes | deferred to F (T34) | **contested fact** — an unsourced causal ranking; T34 is F's row (beginner fingering language, technique framework) |
| 2 | batch-1:26 | JUDGEMENT | 0.1:46 a key pressed slowly enough makes no sound | deferred to F | **outside expert** — true of an acoustic action; on a velocity-sensing digital piano (the lesson's HP-130) it depends on the instrument, which nobody here has tried |
| 3 | batch-1:37 | THEORY | 0.2:22 C to C is "twelve keys" | verified, no change | source — S2 §2.1: the distance of twelve half steps; the sentence states a distance, not an inclusive count |
| 4 | batch-1:180 | THEORY | 1.2:19 "twice the one below it" | **corrected** (T28) | source + code — table rows 1–2 |
| 5 | batch-1:192 | JUDGEMENT | 1.2:26 a long rest "the most common rhythm error there is" | deferred to F | **F's voice rewrite** — a superlative over every rhythm error; the advice stands; the lint lists it |
| 6 | batch-1:216 | THEORY | 1.4:25 the add-half rule "for every dotted note" | **corrected** (T29) | source — row 3 |
| 7 | batch-1:220 | THEORY | 1.4:29 the missing beats "at the end of the piece" | **corrected** (T30) | source + code — rows 4–5 |
| 8 | batch-1:256 | JUDGEMENT | 1.5:46 "a slow Scottish air" | deferred to F | **musical judgement** — "slow" is how it is sung; note for F: the app plays it at an imported default tempo (`tempo-defaulted`) |
| 9 | batch-1:299 | JUDGEMENT | practice.3:14 interleaving "markedly better retention a week later" | deferred to F (T37) | **contested fact** — the music-specific evidence is mixed (Part 10); needs a source or the heuristic form T37 gives |
| 10 | batch-1:310 | JUDGEMENT | practice.4:8 injuries "almost always" from practising through a warning | **corrected** (T35) | source — row 23 (S7, S8, S9) |
| 11 | batch-1:314 | JUDGEMENT | practice.4:42 four 20-minute sessions beat one of 80 | **corrected** (T35) | source — row 27 (S9); the learning half removed |
| 12 | batch-1:325 | JUDGEMENT | practice.5:27 "takes a week and it is the only thing that works" | deferred to F (T36) | **contested fact** — a duration and an exclusivity with no source; practice methodology is F's rewrite |
| 13 | batch-1:395 | THEORY | 2.2:43 count "1 and 2 and" through a 6/8 figure | already corrected (T10), verified | source — the lesson now counts it in threes (S2, meter); the quoted sentence no longer exists |
| 14 | batch-1:406 | JUDGEMENT | 2.2:20 "almost every rhythm problem a beginner has is a subdivision problem" | deferred to F | **F's voice rewrite** — a frequency over all beginners; the advice (subdivide) stands |
| 15 | batch-1:490 | UNVERIFIED | 2.4:56 an eighth "marked early the moment it arrives" | **corrected** | code — row 55; the engine run in `lessonClaimsAboutApp` › F0 › 2.4 |
| 16 | batch-1:533 | THEORY | 2.5:18 Ode to Joy's shift in bar 12 to the G below middle C | verified, no change | code (score) — bar 12 is C4 D4 G3 on staff 1, the shift is there (T22's row); the printed right-hand 5 on G3 is a score fault T22 recorded, repeated under Follow-ups |
| 17 | batch-1:570 | UNVERIFIED | hymns.2:31 *(the tool, not the lesson)* `dump_score.py` prints graces as notes | *outside the 85* — no lesson change | a property of the instrument: `grep -n "grace\|tuplet\|<tie" tools/content/dump_score.py` still returns nothing; claims checked against the MusicXML, as the F0 rows do |
| 18 | batch-2:80 | JUDGEMENT | 3.4:40 the Petzold "the first real piece in the plan" | deferred to F | **F's voice rewrite** — the earlier rungs already carry Beethoven and Gruber; Reader 1's rewrite is available |
| 19 | batch-2:142 | JUDGEMENT | classical.3:38 the plain mordent sign "much the commoner one in print" | deferred to F | **contested fact** — the bundled corpus counts the other way (Reader 1: 380 `<mordent>` against 151 `<inverted-mordent>`), which is this corpus and not print; **outside expert** for editions |
| 20 | batch-2:174 | UNVERIFIED | blues.3:34 Wabash and Tishomingo "published songs with a verse before the chorus" | **corrected** | code (score) — row 56; the history removed |
| 21 | batch-2:281 | JUDGEMENT | latin.3:35 Só Danço Samba "a gentler rhythm … the syncopation goes quiet" | deferred to F | **musical judgement** — a claim about sound, nothing heard; the page is syncopated |
| 22 | batch-2:294 | JUDGEMENT | holiday.3:14 untrained voices "mostly … A below middle C to D above" | deferred to F | **outside expert** — a voice-range fact, already hedged twice; nothing downstream reads it |
| 23 | batch-2:328 | JUDGEMENT | 4.2:32 melodic minor "exists because singers found that step-and-a-half unsingable" | deferred to F | **contested fact** — a historical rationale with no source here; **outside expert** |
| 24 | batch-2:353 | THEORY | 4.3:34 arpeggio fingering 1-2-3-5 / 5-3-2-1 | **corrected** | code + teacher — rows 66–67; the printed left-hand fault is a P0 follow-up |
| 25 | batch-2:366 | THEORY | 4.4:12 Hanon "sixty patterns, each an eight-note cell" | **corrected** | source + code — row 30 |
| 26 | batch-2:409 | THEORY | 4.5:28 "Nothing on the page says so except the word" | **corrected** | source + code — row 49 |
| 27 | batch-3:36 | JUDGEMENT | 4.6:29 a phrase is "usually two or four bars" | deferred to F | **musical judgement** — hedged teaching advice (Reader 1: keep) |
| 28 | batch-3:88 | JUDGEMENT | classical.4:45 Schumann's Chorale "all legato" | deferred to F | **musical judgement** — performance practice; the page marks no touch (historical-performance rules are F's) |
| 29 | batch-3:92 | JUDGEMENT | classical.4:42 "the first sonatina most learners meet" | deferred to F | **F's voice rewrite** — an unsourced survey; the useful half is "start here" |
| 30 | batch-3:99 | UNVERIFIED | classical.4:41 "Six options at Grade 1" | already corrected (T22), verified | code — the lesson says "Five options", no grade; T22's row |
| 31 | batch-3:176 | THEORY | chords-pop.4:39 Scarborough Fair "where vi and ii do the work" | **corrected** | code (score) + source — row 63 |
| 32 | batch-3:180 | THEORY | chords-pop.4:39 Shenandoah "modal" | **corrected** | code (score) — row 63 |
| 33 | batch-3:190 | THEORY | chords-pop.4:23 ii–V–I "the most common cadence in Western music" | **corrected** | source — row 62 |
| 34 | batch-3:216 | JUDGEMENT | blues.4:44 the flat spellings "no edition prints those" | deferred to F | **F's voice rewrite** — an absolute over every edition; the arithmetic is right and stays |
| 35 | batch-3:220 | UNVERIFIED | blues.4:48 "the twelve-bar left-hand patterns in C, F and G" | **corrected** | code (rung) — row 57 |
| 36 | batch-3:233 | THEORY | jazz.4:28 "the letter, and minor if it says so, and nothing else" | **corrected** | code (catalog) + source — row 64 |
| 37 | batch-3:311 | THEORY | improv.4:15/20 "nothing can sound wrong", "all five notes fit all four chords" | **corrected** | teacher + interval arithmetic — row 65 |
| 38 | batch-3:336 | UNVERIFIED | jam:15 guitars' open strings E A D G; those keys plus C comfortable | **corrected** (hedged) | source + teacher — row 58 (S14 not opened) |
| 39 | batch-3:375 | JUDGEMENT | technique.4:46 Lemoine "the same finger work as the exercises above" | **corrected** (the clause removed) | code — row 15: the sentence was being corrected for "one page each", and No. 35's block triads are not the scales' finger work; leaving a known-false clause in a rewritten sentence fails the teacher test |
| 40 | batch-3:406 | UNVERIFIED | rock.4:44 the library's minor two-hand music is four Greensleeves and two Für Elise | **corrected** (survey removed) | code — row 59 |
| 41 | batch-3:410 | JUDGEMENT | rock.4:9 the power chord "the one almost every heavy piano part is built from" | deferred to F | **F's voice rewrite** — a genre count; style authenticity is Wave G's review |
| 42 | batch-3:447 | JUDGEMENT | classical.5:44 First Loss and Old French Song "want the pedal for warmth" | deferred to F | **musical judgement** — interpretation; neither score marks pedal |
| 43 | batch-3:451 | JUDGEMENT | classical.5:50 the Arabesque "a melody carried over an accompaniment" | deferred to F | **musical judgement** — a reading of texture (figuration over chords on the page) |
| 44 | batch-3:483 | FALSE → JUDGEMENT | chords-pop.5:44 "two ballads that live on seventh chords" | *outside the 85* — deferred to F | **musical judgement** — sevenths sound between the hands in *Your Song*; *Before You Go* read only to bar 11 |
| 45 | batch-3:488 | JUDGEMENT | chords-pop.5:42 Row Row Row "as an arpeggio study" | deferred to F | **musical judgement** — the arpeggio is in the tune, the left hand is bass and dyad |
| 46 | batch-3:492 | JUDGEMENT | chords-pop.5:27/29 sus4 "the most-used gesture in pop piano" | deferred to F | **F's voice rewrite** — two superlatives over an uncounted repertoire |
| 47 | batch-3:517 | JUDGEMENT | blues.5:31 "A blues chorus is a conversation: …" | deferred to F | **musical judgement** — the AAB shape as teaching advice (Reader 1: keep) |
| 48 | batch-3:557 | THEORY | jazz.5:15 the off-beat accent "is what separates swing from a shuffle" | **corrected** | source + teacher — row 52; the rest of the difference → **outside expert** |
| 49 | batch-3:589 | UNVERIFIED | ragtime.5:28 Joplin "printed … on his covers" | already corrected (T22), verified | code — "Not fast." in six bundled Joplin files; T22's row |
| 50 | batch-3:594 | JUDGEMENT | ragtime.5:47 "the left hand without the problem on top" | deferred to F | **musical judgement** — two of the three have right-hand syncopation of other kinds |
| 51 | batch-4:19 | JUDGEMENT | theory.5:12 "Four seventh-chord qualities cover nearly everything" | **corrected** | code + source — row 36; taken in F0 because it leaves out a standard quality in a theory lesson this task was already correcting (T39) |
| 52 | batch-4:23 | JUDGEMENT | theory.5:37 Mixolydian "never pulls home" | **corrected** (T39) | source + teacher — row 34 |
| 53 | batch-4:55 | HISTORY | latin:42 "La Cumparsita (1916)" | already removed (T22), verified absent | removed — no year in any catalog field; no source |
| 54 | batch-4:107 | UNVERIFIED | technique.5:60 "one page each" | **corrected** | code (catalog) — row 19 |
| 55 | batch-4:151 | JUDGEMENT | rock.5:29 Annie's Song's sus4 "as a hinge" | deferred to F | **musical judgement** — the only sus4 is the opening bar |
| 56 | batch-4:155 | JUDGEMENT | rock.5:8 the power chord "left the third out because a distorted guitar cannot hold one" | deferred to F | **contested fact** — an acoustic and historical cause with no source; **outside expert** |
| 57 | batch-4:201 | JUDGEMENT | classical.6:13 "none of them is fast" | deferred to F | **musical judgement** — Für Elise's runs, an Allegretto waltz |
| 58 | batch-4:205 | HISTORY | classical.6:26 "Chopin's own description …" | **sourced** (T22 dropped the attribution; F0 sourced the description) | source — row 68 (S12) |
| 59 | batch-4:275 | HISTORY | ragtime.6:75 three dates, "a rag two-step", "its name is a joke" | already corrected (T22), **sourced again** | source — the dates from `content/sources/kern.json` (T22) and S13; the subtitle and the joke removed by T22 |
| 60 | batch-4:280 | JUDGEMENT | ragtime.6:80 "The most work of the three" | deferred to F | **musical judgement** — note for F: the app's own levels do not rank it hardest |
| 61 | batch-4:357 | HISTORY | blues.6:28 Yancey's left hand; "ended almost everything in E flat" | **removed** (T22 softened; F0 removed the rest) | removed — row 69 (S15 does not support it) |
| 62 | batch-4:362 | UNVERIFIED | blues.6:55 "a boogie that speeds up never gets past the first notch" | already rewritten, verified | code — the lesson now says the Ladder "will not let the tempo rise on a pass with a mistake in it": `PracticeEngine.ts:126-131`, `ScoreScreen.ts:2155-2164` |
| 63 | batch-4:486 | JUDGEMENT | rock.6:39 Prelude No. 20 "the clearest example in the library" | deferred to F | **F's voice rewrite** — a superlative over the library |
| 64 | batch-4:558 | JUDGEMENT | classical.7:50 "a left hand that leans on beat two or three" | deferred to F | **musical judgement** — a genre description; the file's accents are mostly the right hand's, on beat two (Reader 1) |
| 65 | batch-5:33 | JUDGEMENT | ragtime.7:23 "Three of the pieces here deliberately are not [rags]" | deferred to F | **musical judgement** — intent; *Heliotrope Bouquet*'s subtitle names a ragtime form |
| 66 | batch-5:37 | UNVERIFIED | ragtime.7:33 "the harmony wanders further than anything else Joplin published" | already corrected (T22), verified | code — "more accidentals to the bar than anything else on this rung"; T22's row |
| 67 | batch-5:54 | JUDGEMENT | ragtime.7:47 Sugar Cane "at a gentler pace" | deferred to F | **musical judgement** — the printed marking differs; note for F: the app plays both at 100 bpm |
| 68 | batch-5:79 | THEORY | technique.7:35 half pedal "clears the treble while the bass keeps ringing" | **corrected** (T31) | source — rows 6–8 |
| 69 | batch-5:123 | THEORY | jazz.7:35 "The tenth on beat three is what makes it stride" | already rewritten (T22), verified; residual | code — the lesson states the exercise's shape; **outside expert**: whether bass–chord–(mid-register note)–chord should be called stride (a generator naming question) |
| 70 | batch-5:129 | JUDGEMENT | jazz.7:24 quartal voicings "most film music written since 1960" | deferred to F | **F's voice rewrite** — a survey of a medium |
| 71 | batch-5:167 | JUDGEMENT | blues.7:34 "forty bars of shuffle" | **corrected** | code — row 54; taken in F0 as a P0: the lesson told the learner to shuffle a piece the app times straight |
| 72 | batch-5:198 | JUDGEMENT | chords-pop.7:35 "the open, spread voicings this rung is about" | deferred to F | **musical judgement** |
| 73 | batch-5:229 | THEORY | theory.7:27 chord-scales "not opinions" | **corrected** (T39) | source — row 32 |
| 74 | batch-5:287 | JUDGEMENT | rock.7:40 "one sixteen-bar idea repeated" | deferred to F | **musical judgement** — the page states an eight-bar idea three times |
| 75 | batch-5:312 | UNVERIFIED | classical.8:47 the Moonlight finale "the fastest thing" | verified, no change | code (score) — `lessonClaimsAboutMusic` › F0 › classical.8 (notes per second at the printed tempo; its tempo is also the rung's highest) |
| 76 | batch-5:331 | UNVERIFIED | ragtime.8:17 Pine Apple and Gladiolus "on nearly every beat" | **corrected** | code (score) — row 60 |
| 77 | batch-5:335 | UNVERIFIED | ragtime.8:25 "four keys … a whole strain in the minor" | already corrected (T22), verified | code — two key signatures, the five-flat strain on B flat; T22's rows |
| 78 | batch-5:340 | UNVERIFIED | ragtime.8:40 "Five late Joplin rags" | already corrected (T22), **sourced again** | source — `kern.json` dates (T22) and S13 |
| 79 | batch-5:387 | JUDGEMENT | jazz.8:33 Stardust's bridge "modulates, as most 1920s bridges do" | **corrected** | code (catalog) — row 42; taken in F0 because it states the modulation rule T38 corrects |
| 80 | batch-5:391 | UNVERIFIED | jazz.8:29 "Ninth chords in five roots" | **corrected** | code (catalog) — row 43 |
| 81 | batch-5:411 | JUDGEMENT | blues.8:36 "the record every boogie bass since is a copy of" | deferred to F | **contested fact** — a historical absolute (the same claim is at `blues.6.md:23-24`); F's historical claims need sources |
| 82 | batch-5:444 | UNVERIFIED | chords-pop.8:36 "If I Had a Chicken is the fastest" | **corrected** | code (score) — row 61 |
| 83 | batch-5:448 | JUDGEMENT | chords-pop.8:35 keys "chosen for an orchestra, not a voice" | deferred to F | **contested fact** — Reader 1: *Undertale*'s theme is not orchestral and *Isabella's Lullaby* is hummed; **outside expert** |
| 84 | batch-5:461 | JUDGEMENT | theory.8:33 "the bridge of almost any standard modulates" | **corrected** (T38) | source + teacher — row 39 |
| 85 | batch-5:496 | JUDGEMENT | classical.9:13 "ten minutes of music" | deferred to F | **F's voice rewrite** (gate 4, fake precision) — the rung's pieces run 83 to 262 bars |
| 86 | batch-5:569 | JUDGEMENT | chords-pop.9:32 "ballads where the left hand decides everything" | deferred to F | **musical judgement** — the two sparsest left hands, measured; "decides everything" is not |
| 87 | batch-5:573 | JUDGEMENT | chords-pop.9:20 "The oldest arranging trick there is" | deferred to F | **F's voice rewrite** — a historical superlative; also Part 17 §20's item |

**Totals.** THEORY 18: 14 corrected, 2 verified unchanged, 1 already corrected (T10) and re-checked, 1 already rewritten (T22) with a residual naming question for an outside expert. UNVERIFIED 16 (the 85's): 9 corrected, 1 verified unchanged, 6 already corrected or rewritten and re-checked (1 of them sourced again); plus `hymns.2:31` outside the 85. HISTORY 4: 1 removed earlier and verified absent, 1 sourced (S12), 1 sourced again (S13), 1 removed. JUDGEMENT 47: 8 corrected in F0 (practice.4 ×2, theory.5 ×2, technique.4, blues.7, jazz.8, theory.8 — each for the reason in its row), 39 deferred to F, each with its category (musical judgement 18, F's voice rewrite 11, contested fact 8, outside expert 2; four of the contested facts also need an outside expert); plus the re-filed FALSE outside the 85, deferred as a musical judgement.
