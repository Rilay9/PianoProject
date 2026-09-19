# Lesson audit — batch 4

Instruments: `python tools/content/dump_score.py <id>` for every score named below; the
rung JSON in `content/curriculum/stage-<n>.json`; the catalog rows in
`app/public/content/catalog.json` (`notation`, `tracks`, `tags`, `source`, `drill.params`);
the MusicXML read directly where the dump does not show a thing (ties, fingerings,
`<words>`, repeats); the app code cited per finding. Nothing here has been heard.

## theory.5 — `content/lessons/theory.5.md`

Claims checked: 16. Findings: 3.

- [x] **STALE** `content/lessons/theory.5.md:44` — "**Simon, on every key.** The chain game from Stage 3 again"
  - Is: the every-key chain (`drill.ear.simon-chromatic`) is already on the Stage 4 theory rung, so Stage 5 is its second appearance, not the step up from Stage 3's white keys. The white-key chain is on `1.5` and `theory.3`.
  - Evidence: `theory.4` `exerciseOptions` = cadences, melodic-dictation, inversions, `drill.ear.simon-chromatic` (`stage-4.json`); `simonForStage` in `app/src/engine/drills/simon.ts` names Stage 4 as the switch. The rest of the paragraph checks out: range G3–G4 chromatic, `help: keys-after-miss`, replay-lit-and-retry (`simon.ts` `SIMON_HELP_LEVELS`).
  - Fixed: now "The every-key chain game from Stage 4 again … drawn from all twelve keys around middle C rather than the white ones of Stage 3" — `drill.ear.simon-chromatic` is in `theory.4` `exerciseOptions` (stage-4.json:973) and `simonForStage` switches at stage 4 (`simon.ts:283-284`); the white-key chain is on stage-1 and stage-3 rungs.
- [ ] **JUDGEMENT** `content/lessons/theory.5.md:12` — "**Four seventh-chord qualities** cover nearly everything"
  - Is: this leaves out the fully diminished seventh. The drill does test exactly these four (`drill.ear.seventh-qualities` qualities `maj7, 7, m7, m7b5`), so it matches the app. Whether it "covers nearly everything" is for a musician to judge.
  - Evidence: catalog `drill.params`.
- [ ] **JUDGEMENT** `content/lessons/theory.5.md:37` — "Mixolydian's flat seventh removes the leading tone, so the music never pulls home and can circle indefinitely"
  - Is: the flat seventh is correct theory. "never pulls home" is a generalisation a musician might dispute.
  - Evidence: theory knowledge only.

Not checked in this lesson: the mastery line "two progressions recognised in unfamiliar music, and one tune transposed into three keys". The rung has no transposition item, and the lesson does not say it has one.

## improv.5 — `content/lessons/improv.5.md`

Claims checked: 13. Findings: 1.

- [x] **FALSE** `content/lessons/improv.5.md:39` — "At the end of a backing-track run the app plays your own notes back to you, at the speed and the dynamics you played them."
  - Is: nothing plays by itself. The result sheet shows a *Listen back* button, but only when something was recorded, and it plays only when tapped. The playback keeps your onsets and velocities, but every note sounds for a fixed 0.9 s, so note lengths are not as you played them.
  - Evidence: `app/src/ui/screens/DrillScreen.ts:2095-2097` (the button, shown only if `lastRecording.length > 0`); `playRecording` at `:480-495`, `durationSec: 0.9` at `:491`; `lastRecording` is set only for `BackingTrackDrill` (`:2027`).
  - Fixed: now "tap *Listen back* and the app plays your own notes back to you, with the timing and the dynamics you played them, though every note is held for the same short length" — the button is offered only when a recording exists and plays only on tap (`DrillScreen.ts` ~2095), and `playRecording` keeps onsets and velocities with `durationSec: 0.9` (~491). Whether to replay note lengths is the owner's decision.

Checked and true: the blues scale is C E♭ F F♯ G B♭ C (`exercise.blues-scale.c.1oct.right` bar 1). The three songs are the same twelve bars in C, F and G (`exercise.blues.twelve-bar-shuffle.c/f/g`, IV at bar 5 and V at bar 9, LH written). The shuffle was met on the blues track (`blues.4`). The backing track's twelve-bar puts IV at bar 5 and V at bar 9 (`fromCatalog.ts` `twelveBarLoop`). The blues track gives the reason for spelling the fifth as a raised fourth (`blues.4.md:37-46`). "Nothing to save" is correct: the recording is not persisted (`DrillScreen.ts:476-478`).

Not checked in this lesson: nothing.

## latin — `content/lessons/latin.md`

Claims checked: 24. Findings: 2.

- [x] **FALSE** `content/lessons/latin.md:43` — "Its second part and *El Choclo* — another tango — are under Latin in the Library"
  - Is: *La Cumparsita* part B is not under Latin. Its `tracks` field is `['classical']` only. *El Choclo* is under Latin (`['latin', 'classical']`), and so are *Carioquinha* (`['latin']`) and *Malagueña* (`['latin', 'classical']`).
  - Evidence: catalog `tracks` of `song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx`. The Library's Track filter matches `item.tracks` (`LibraryScreen.ts:105`).
  - Fixed: now "Its second part is under Classical in the Library, and *El Choclo* — another tango — is under Latin there" — catalog `tracks`: part B `['classical']`, El Choclo `['latin', 'classical']`.
- [ ] **HISTORY** `content/lessons/latin.md:42` — "*La Cumparsita* (1916)"
  - Is: the catalog does not record a year. Its `editionNotes` say "composer not in composers.json". A historian should confirm the date.
  - Evidence: catalog `source.editionNotes` of the part-A row.

Checked and true:
- The clave strokes match the exercises: 3-2 offsets `[0, 1.5, 3, 5, 6]` and 2-3 offsets `[1, 2, 4, 5.5, 7]`.
- The tumbao falls on the "and" of 2 and on beat 4, with beat one empty (`exercise.tumbao.c` bar 1: `r/qua. G2/qua r/eig F2/qua`).
- The montuno is in thirds and locked to the clave (`exercise.montuno.c.2note.son-3-2`).
- The rung has six songs, as the lesson says. *Cielito Lindo* is in 3/4. The two bossa novas are Jobim.
- Tico-Tico 1917 matches the catalog's `editionNotes` ("Abreu 1917").
- *Rhythm only* judges timing only (`GuideScreen.ts:153`, `ScoreScreen.ts:2311`).
- "*La Cucaracha* is not in the library yet": a raw search of `catalog.json` for "cucar" found 0 matches, and a second search over titles and ids found 0.

Not checked in this lesson: "the one unmistakable error in the style" and "the hardest coordination in the app" are judgements, not listed.

## technique.5 — `content/lessons/technique.5.md`

Claims checked: 22. Findings: 6.

- [x] **FALSE** `content/lessons/technique.5.md:30` — "These exercises are scored on the slope: the app checks that the velocity rises across the run and covers real ground, so a line that wobbles will not pass."
  - Is: no code judges the slope. `shapingScore` exists but nothing in the app calls it. `exercise.shaping.a.crescendo` opens as an ordinary score, judged on pitch and timing. Also, its notes rise from A4 to A6 in bars 1–2 and fall back to A4 in bars 3–4, and the score carries no crescendo marking beyond the text "Grow evenly from the first note to the last".
  - Evidence: `shapingScore` is defined at `app/src/engine/Scoring.ts:376`. A grep for `shapingScore` in `app/src` finds only that definition. A second, case-insensitive grep for `shaping` in `app/src` finds only `Scoring.ts`. There is no `shaping` case in `fromCatalog.ts`.
  - Fixed: now "The exercise here opens as an ordinary score, judged on the notes and their timing; the app does not measure the velocity, so the slope is yours to judge." — rechecked: `targetFor` opens any item with a `file` as a score (`openItem.ts:23-31`); `drillFromCatalog` has no `shaping` case; `shapingScore` has no caller (grep `shapingScore` and `'shaping'` in `app/src`). Whether to wire the scorer is the owner's decision.
- [x] **WRONG-COUNT** `content/lessons/technique.5.md:30` — "These exercises are scored on the slope"
  - Is: the rung has one shaping exercise, `exercise.shaping.a.crescendo`.
  - Evidence: the `technique.5` `exerciseOptions` (13 items) in `stage-5.json`.
  - Fixed: same sentence, now singular ("The exercise here") — `technique.5` `exerciseOptions` has one shaping item, `exercise.shaping.a.crescendo` (stage-5.json:638).
- [x] **FALSE** `content/lessons/technique.5.md:34` — "since the app will tell you it passed: a line that stays quiet and then jumps at the end also satisfies the rule."
  - Is: the app does not apply this rule, so it never tells you a crescendo passed. Read on its own, the unused code would pass such a line: level steps count as "moving the right way".
  - Evidence: as above. The rule is `range >= 30 && monotonic >= 0.7` with `delta >= 0` counted (`Scoring.ts:386-402`).
  - Fixed: now "a line that stays quiet and then jumps at the end passes just the same … even though the score does not" — the app will pass it, because the score is judged on pitch and timing only (evidence above); no velocity rule applies.
- [x] **FALSE** `content/lessons/technique.5.md:66` — "the score will pass both, as the lesson says above"
  - Is: the same fault. Neither a jump nor a real crescendo is judged on velocity.
  - Evidence: as above.
  - Fixed: sentence left as it is — with the paragraph above corrected, "the score will pass both, as the lesson says above" is now true: an ordinary score passes a jump and a crescendo alike (evidence above).
- [x] **FALSE** `content/lessons/technique.5.md:56` — "in the left hand, which is where a mordent is hardest and where the music of Stage 6 will ask for it"
  - Is: no Stage 6 rung item has a left-hand mordent. The only mordents in Stage 6 are 3 in the right hand of `song.classical.chopin-waltz-a-minor` (`classical.6`).
  - Evidence: a script over all 88 file-backed song and exercise options in `stage-6.json` counted `<mordent>`/`<inverted-mordent>` elements per staff. It found LH 0 and RH 3, all in that one piece. The other 12 options are drills with no score. The count is a proxy: it does not see mordents written out as plain notes.
  - Fixed: the clause "and where the music of Stage 6 will ask for it" is deleted; the sentence ends "which is where a mordent is hardest." — re-ran a count over the 83 file-backed options in stage-6.json: 3 `mordent` notes, all staff 1 of `song.classical.chopin-waltz-a-minor`, none in a left hand (a proxy that does not see written-out mordents).
- [ ] **UNVERIFIED** `content/lessons/technique.5.md:60` — "one page each"
  - Is: page count is not in any field. The études are 31, 22 and 21 bars.
  - Evidence: catalog `notation.bars`.

Checked and true:
- The repeated notes are fingered 3-2-1 on every group (`exercise.repeated-notes.c.3x.left`: triplet eighths, `<fingering>` 3 2 1 ×8).
- The 2:1 exercise has eighths over quarters (`exercise.independence.c.2v1`).
- The tie across the bar line is F4 tied into bar 2 (`<tie>`, `exercise.syncopation.tied-across-bar`).
- 5/4 is marked "Count 3 + 2".
- The sight-reading generator is at level 4.
- The mordent is written main–below–main on the beat in the LH, two notes to the beat (`exercise.mordent.c.2pb.left`).
- Duvernoy Op. 176 Nos. 4, 5 and 6 are on the rung in that order.
- The rung has a Duet tool.

Not checked in this lesson: "4-3-2-1 for four" is not on this rung (it is on `technique.6`), and "always coming towards you" was read as advice.

## rock.5 — `content/lessons/rock.5.md`

Claims checked: 15. Findings: 5.

- [x] **FALSE** `content/lessons/rock.5.md:28` — "these are the two pieces in the library that actually print it"
  - Is: seven library songs print a suspended chord symbol. Beyond the two on the rung (*Annie's Song* Dsus4, *andata* D♯sus4) they are:
    - `song.folk.ga-je-mee-op-zoek-naar-het-koningskind.pdmx` (Dsus4)
    - `song.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx` (Dsus4)
    - `song.jazz.george-shearing-lullaby-of-birdland.pdmx` (E♭7sus4)
    - `song.jazz.the-dave-brubeck-quartet-take-five.pdmx` (F7sus4)
    - `song.jazz.marc-sabatella-harmony-and-chord-progressions.pdmx` (A7sus4, D9sus4)
  - Evidence: a scan of `notation.chords` over every `song.*` row for `sus|add9|add2` returned 7 rows. This proxy covers chord symbols only. Unlabelled sus voicings in the notes were not searched.
  - Fixed: now "this rung teaches a sound, and both of these print it in their chord symbols" — the "only two in the library" claim is gone; both rung songs do print a sus chord (Annie's Song bar 0 Dsus4; andata `suspended-fourth` in `dump_score.py`).
- [x] **FALSE** `content/lessons/rock.5.md:19` — "the rest of the chord well above it, nothing bunched in the middle of the keyboard"
  - Is: the root is two octaves down, but the other four notes sit in close position inside one octave starting at middle C, with a second at the bottom in the sus2 set. For example C4 D4 G4 C5 over C2, and F4 B♭4 C5 F5 over F2.
  - Evidence: `dump_score.py exercise.open-voicing.c.sus2`, `.c.sus4`, `.c.add9` and `.f.sus4`, bars 1–4 of each.
  - Fixed: now "the root low in the left hand, two octaves below the right, which holds the rest of the chord together from middle C up. Play all of it close together in one hand…" — `dump_score.py` of all four rung exercises (c.sus2, c.sus4, c.add9, f.sus4): LH C2/F2/G2/B♭2, RH close from C4–G4 up, root two octaves apart in every bar.
- [x] **FALSE** `content/lessons/rock.5.md:32` — "and a great deal of silence"
  - Is: *andata* is almost continuously sustained, mostly whole notes in both hands. There are rests in only 5 of 65 bars: 26, 34, 51, 56 and 65.
  - Evidence: `dump_score.py song.classical.sakamoto-andata.pdmx`, all bars.
  - Fixed: "a great deal of silence" is now "chords held for whole bars" — `dump_score.py song.classical.sakamoto-andata.pdmx` bars 1–20: whole notes in both hands in most bars; rests only in inner voices or a few bars.
- [ ] **JUDGEMENT** `content/lessons/rock.5.md:29` — "*Annie's Song* uses a sus4 as a hinge in a plain folk progression"
  - Is: the only Dsus4 is in bar 0, the opening figure (D–Dsus4–D–Dsus4). No chord symbol in bars 1–57 is suspended. Whether that counts as a "hinge" is for a musician.
  - Evidence: `dump_score.py song.folk.john-denver-annie-s-song.pdmx | grep sus` matches only bar 0.
- [ ] **JUDGEMENT** `content/lessons/rock.5.md:8` — "The power chord left the third out because a distorted guitar cannot hold one."
  - Is: a common explanation, but a historical and acoustic generalisation for a musician to confirm.
  - Evidence: none in repository.

Checked and true:
- sus2 is 0-2-7, sus4 is 0-5-7, and add9 is 0-4-7-14 with the third kept (exercise `intervals`).
- *Free play* names C–D–G over C as "C sus2" (`nameHeldChord`, `app/src/engine/drills/theory.ts:160-187`, with sus2 at `:114`).
- The `minor-vamp` preset exists (`sightReading.ts` `LAB_PRESETS`) and is a rung tool.
- The rung has two songs.

Not checked in this lesson: *andata* "harder than the level suggests" (a judgement).

## jam.5 — `content/lessons/jam.5.md`

Claims checked: 12. Findings: 1.

- [x] **FALSE** `content/lessons/jam.5.md:21` — "The exercises here write it in E, A, G and D"
  - Is: the Charleston is written only in E and A. The G exercise is off-beats, and the D exercise is anticipated.
  - Evidence: `pattern` values on `exercise.comping.e.charleston.intro`, `.a.charleston.intro`, `.g.off-beats.intro` and `.d.anticipated.intro`, confirmed by `dump_score.py`. Charleston E bar 1 has chords at beats 1 and 2&. D bar 1 has chords at 1 and 3&. G has every off-beat.
  - Fixed: now "The exercises here write it in E and A, and the figures below in G and D, which are the keys a guitarist actually calls" — catalog `pattern`: e/a charleston, g off-beats, d anticipated (`jam.5` exerciseOptions, stage-5.json:773-777).

Checked and true:
- The Charleston is beat 1 plus the "and" of 2 (offsets `[0, 1.5]`).
- The earlier rung (`jam`, `lessons/jam.md:15`) sets the guitar keys.
- The rung has a form tracker (`drill.jam.form-tracker`).
- The *Blues — twelve bars* preset is a rung tool. Its jam has a bass and a drum kit (`LabScreen.ts:415`, `backingLoop.ts`), and nothing on that screen is judged (`LabScreen.ts:24, 420, 436`).

Not checked in this lesson: "keep the form without keeping time *for* you" was read as meaning the loop does not follow the player. The lab does run a metronome and drums.

## classical.6 — `content/lessons/classical.6.md`

Claims checked: 22. Findings: 3.

- [x] **FALSE** `content/lessons/classical.6.md:13` — "The pieces on this rung ... both hands are playing at once and only one of them is the tune."
  - Is: this is true of five of the six. The Prelude in C, BWV 846, has no tune in either hand. It is one broken-chord figure shared between the hands: RH G4 C5 E5 over LH C4 and E4 in bar 1.
  - Evidence: each of the six was dumped:
  - Fixed: now "both hands are playing at once and, in all but the Prelude in C, only one of them is the tune." — `dump_score.py song.classical.bach-wtc1-prelude-1` bars 1–4: one broken-chord figure across the hands. readingTime raised 3→4 (606 words); classical.6 is on `KNOWN_LONG` in `lessonShape.test.ts`.
    - Bach BWV 846, bars 1–2: no tune in either hand.
    - Satie: melody over chords in the RH.
    - Waltz: RH melody with LH oom-pah.
    - Für Elise, Prelude 7 and Prelude 4: dumped. Fits the claim.
- [ ] **JUDGEMENT** `content/lessons/classical.6.md:13` — "none of them is fast"
  - Is: *Für Elise* has thirty-second-note runs (bar 32) and the A minor Waltz is marked *Allegretto*. Whether that is "fast" is for a musician.
  - Evidence: `dump_score.py song.classical.beethoven-fur-elise` bar 32; `song.classical.chopin-waltz-a-minor` text "Allegretto".
- [ ] **HISTORY** `content/lessons/classical.6.md:26` — "Chopin's own description was that the left hand keeps time while the right hand is free"
  - Is: this is usually reported second-hand, through pupils' accounts. It needs checking by someone who can cite the source.
  - Evidence: none in repository.

Checked and true:
- The rung has six songs.
- Prelude No. 7 is sixteen bars plus a pickup (bar 0 + 1–16).
- Prelude No. 4 has a modern transcription on the rung (MuseTrainer) and the first edition in the Library (`.nifc`, "First edition: BH"). A third copy (`.alt`) also exists.
- *Für Elise* is complete (A, B at bar 23 and C at bar 61, through to bar 105).
- The Prelude in C is BWV 846.
- Preludes 6 and 20 and the mazurkas are under Classical.
- The two pedal exercises are on the rung.
- *Blind* exists as a mode (`GuideScreen.ts:156`).

Not checked in this lesson: nothing.

## ragtime.6 — `content/lessons/ragtime.6.md`

Claims checked: 34. Findings: 10.

- [x] **FALSE** `content/lessons/ragtime.6.md:58` — "These editions carry Joplin's own markings — *Not fast* on *The Entertainer*, *Not too fast* on *Peacherine Rag*, *Not fast* on *The Easy Winners*"
  - Is: none of the three files has such a marking. *The Entertainer* has "Moderato ( = 70 bpm)" and "Repeat 8va". *Peacherine* has only a metronome mark of 100, and *The Easy Winners* only 72.
  - Evidence: the MusicXML of each was grepped for `<words>`, `<per-minute>` and `<sound tempo>`, and the `dump_score.py` "text on the score" line was read. The Entertainer is from MuseTrainer. The other two are from the craigsapp/joplin edition (catalog `source`).
  - Fixed: heading and sentence now "**The tempo is printed on the music.** These editions carry a metronome mark — 70 on *The Entertainer*, which also says *Moderato*, 100 on *Peacherine Rag*, 72 on *The Easy Winners*" — MusicXML `<words>`/`<sound tempo>`/`<per-minute>` re-read for all six rung rags: no "Not fast" anywhere; Entertainer words "Moderato ( = 70 bpm)", "Repeat 8va".
- [x] **FALSE** `content/lessons/ragtime.6.md:60` — "and the app takes its default tempo from them"
  - Is: there is no "Not fast" marking to take it from. The files' own tempos are 70, 100 and 72.
  - Evidence: as above.
  - Fixed: "the app takes its default tempo from them" now refers to those metronome marks, which is true — the score's tempo map comes from the file's `<sound tempo>` (`extractScoreModel.ts` ~341, `bpmAt` in `score/types.ts:252`).
- [x] **FALSE** `content/lessons/ragtime.6.md:65` — "Rags use repeat marks and *D.C.* far more than anything you have played so far"
  - Is: the rung's rags use repeat marks (4–6 each) and first and second endings. None of them contains a da capo, segno or coda.
  - Evidence: MusicXML grep for `dacapo|<segno|<coda|D.C.` in `joplin-entertainer`, `-peacherine-rag`, `-easy-winners` and `-school-of-ragtime` returned nothing. Swipesy and Sunflower were not grepped.
  - Fixed: now "Rags use repeat marks far more than anything you have played so far" — "and *D.C.*" removed. Grep of all six rung rags (Swipesy and Sunflower included) for `dacapo|segno|coda|D.C.|fine` returned 0; repeats 6–8 each. First and second endings are only in *The Entertainer* (16 `<ending>`), so they were not added.
- [x] **STALE** `content/lessons/ragtime.6.md:75` — "the one you already half know from Stage 5, now complete"
  - Is: `ragtime.5` offers the same item, `song.ragtime.joplin-entertainer`, all 92 bars. Stage 5 did not give half of it.
  - Evidence: `ragtime.5` `songOptions` in `stage-5.json`.
  - Fixed: now "the same complete score Stage 5 offered, now read as a whole" — `song.ragtime.joplin-entertainer` is in `ragtime.5` songOptions (stage-5.json:333) and has 92 bars.
- [x] **FALSE** `content/lessons/ragtime.6.md:47` — "**tenths** instead of octaves in the bass note, sometimes rolled;"
  - Is: no left-hand chord in any of the rung's six rags spans a tenth or more.
  - Evidence: a script over the `dump_score.py` output of all six (Entertainer, Peacherine, Easy Winners, Swipesy, Sunflower, School of Ragtime) looked for LH simultaneities of 15 semitones or more. It found none in any of the six.
  - Fixed: the bullet is now "**octaves** for the bass note instead of a single key;" — a script over `dump_score.py` of all six rung rags found no LH simultaneity of 15+ semitones, and octave (12+) basses in every one (Entertainer 11, Peacherine 110, Easy Winners 177, Swipesy 121, Sunflower 161, School 33).
- [x] **FALSE** `content/lessons/ragtime.6.md:49` — "**octave leaps of a tenth or more** in the second and fourth strains"
  - Is: in *The Entertainer* (rehearsal marks: intro 1, A 5, B 22/30, A 39, trio 55/63, interlude 72, D 76/84), bass leaps of a tenth or more fall at bars 20, 54, 57, 58, 65, 66, 75 and 92. That is mostly the trio. There are none in the second strain, and in the fourth only the final bar.
  - Evidence: the same script, comparing the lowest LH note to the next; rehearsal bars from the MusicXML. *Peacherine* (leaps at 60, 76, 77, 84, 85) and *Easy Winners* (16 bars) have no strain marks in the file, so they are unchecked against "second and fourth".
  - Fixed: now "**leaps of a tenth or more** — in *The Entertainer* mostly in the trio —" — rechecked lowest-note to lowest-note in the Entertainer LH: leaps of 15+ semitones at bars 5, 20, 54, 57, 58, 65, 66, 75, 92 (trio 55–71 holds four). Peacherine and Easy Winners have no strain marks, so no strain is named for them.
- [x] **FALSE** `content/lessons/ragtime.6.md:96` — "drops the tempo the moment a leap is missed"
  - Is: the Ladder changes tempo only between passes. A pass with any mistake sets the next pass one notch slower; nothing changes mid-pass.
  - Evidence: `nextLadderTempo`, `app/src/engine/PracticeEngine.ts:95-108`; `ScoreScreen.ts:1384` ("the ladder moving the tempo between passes").
  - Fixed: now "the *Ladder* does the taking-up for you — a clean pass goes up a notch, a pass with a missed leap comes down one —" — `nextLadderTempo` (`PracticeEngine.ts:103-108`) moves the tempo only between passes. Whether to drop mid-pass is the owner's decision.
- [x] **FALSE** `content/lessons/ragtime.6.md:35` — "The other two live in three to five flats"
  - Is: *Peacherine*'s second strain is in B♭, two flats (key signatures −3, −2, −3, −4). The lesson itself says so at line 79.
  - Evidence: `dump_score.py song.ragtime.joplin-peacherine-rag` key-signature line.
  - Fixed: "three to five flats" is now "two to five flats" — MusicXML `<fifths>`: Peacherine −3, −2, −3, −4; Easy Winners −4, −5.
- [ ] **HISTORY** `content/lessons/ragtime.6.md:75` — "(1902)", "(1901)", "(1901)"; "a rag two-step"; "its name is a joke"
  - Is: the catalog has no year field for these rows. The two-step subtitle is not in the Easy Winners file. The "joke" is unsourced.
  - Evidence: catalog rows. Composer credits for Swipesy (with Arthur Marshall) and Sunflower (with Scott Hayden) do match the `composer` field.
- [ ] **JUDGEMENT** `content/lessons/ragtime.6.md:80` — "Gentler syncopation than *The Entertainer*"; "The most work of the three"
  - Is: the app's levels are Entertainer 7.1, Peacherine 7.0 and Easy Winners 7.0, which does not rank Easy Winners hardest. These are for a musician.
  - Evidence: catalog `level`.

Checked and true:
- The key changes are C→F→C, E♭→B♭→E♭→A♭, and A♭→D♭.
- The newly flattened notes are D♭ in the Peacherine trio and G♭ in the Easy Winners trio.
- The rung has six songs, and one is required.
- *School of Ragtime* is the shortest at 33 bars, with six repeat-ended sections.
- Swipesy and Sunflower are both in 2/4, at levels 6.8 and 7.0.
- Weeping Willow is under Ragtime.
- The A♭ and E♭ two-octave scales are on the rung.
- The Entertainer's walk-ups are present (bar 12: G2 A2 B2).

Not checked in this lesson: that the Easy Winners has four strains (the file has no strain marks). Swipesy and Sunflower were not checked for D.C.

## technique.6 — `content/lessons/technique.6.md`

Claims checked: 15. Findings: 1.

- [x] **FALSE** `content/lessons/technique.6.md:33` — "The app measures it: the top note's velocity against the average of the notes underneath, wanting the top at least 1.4 times the rest."
  - Is: nothing in the app runs this measurement. `voicingScore` exists but has no caller. `exercise.voicing.a` opens as an ordinary score, and its `topNoteRatio: 1.4` is read by nothing.
  - Evidence: `voicingScore` is defined at `app/src/engine/Scoring.ts:313`. A grep for `voicingScore|topNoteRatio` in `app/src` (excluding tests) finds only that definition. A second, case-insensitive grep for `voicing` in `app/src` finds only comments and unrelated uses (`fromCatalog.ts:296`, `sightReading.ts`, `ChordChartScreen.ts`, `GuideScreen.ts`).
  - Fixed: now "The app does not measure it: the exercise opens as an ordinary score, judged on the notes and their timing. Aim for the top note's velocity at least 1.4 times the rest — a rule of thumb, not musical law, and here only your ear checks it." — rechecked: `voicingScore` has no caller in `app/src`; `exercise.voicing.a` has a `file`, so it opens as a score (`openItem.ts:29`). The phrase "at least 1.4 times the rest" is kept because `app/tests/unit/lessonShape.test.ts:59-62` pins it to `VOICING_MIN_RATIO`; it is now advice, not a claim the app measures. Whether to wire the scorer (and whether that test should still pin the phrase) is the owner's decision.

Checked and true:
- The three seventh qualities are on the rung (`exercise.arpeggio7.c-major7`, `-minor7`, `-half-diminished7`).
- Alberti bass is at Stage 3 (rung `3.6`).
- The rotation exercise is an Alberti figure.
- The trill is written with "4 notes to the beat", starting on the upper note and ending on the main note in every group (`exercise.trill.c.4pb.left`).
- The held-melody pedal exercise ties A5 across 4 bars (6 `<tie>`).
- Czerny Op. 299 Nos. 1, 3 and 4 are on the rung and are running sixteenths.

Not checked in this lesson: nothing.

## jazz.6 — `content/lessons/jazz.6.md`

Claims checked: 21. Findings: 0.

Checked and true:
- Stage 5 covered shells and ii–V–I (`jazz.5` concepts).
- The Charleston offsets are `[0, 1.5]`.
- The walking lines are root–third–fifth with the fourth note a semitone below the next root, in every bar of `exercise.walking-bass.c.blues` (12 bars) and `.f.ii-v-i` (4 bars).
- Harmonic dictation plays a progression and closes a chord after 120 ms of silence (`CHORD_BOUNDARY_MS`, `app/src/engine/drills/harmony.ts:363`).
- The theory Stage 6 lesson explains that rule (`theory.6.md:24`).
- A walking blues in C is on the rung.
- The rung has six songs. The years match the catalog `editionNotes`, all six are licensed `cc-zero` with composition status "pd", and all are single-staff lead sheets with chord symbols.
- The `jazz-comping` preset leaves the key free and has a bass and drum kit.

Not checked in this lesson: "Four patterns cover most of it" is a judgement. Only two of the four patterns have exercises on this rung (Charleston C, off-beats F), and the lesson does not claim more.

## blues.6 — `content/lessons/blues.6.md`

Claims checked: 18. Findings: 5.

- [x] **FALSE** `content/lessons/blues.6.md:47` — "Its left hand is the bass this lesson names."
  - Is: the left hand in the rung's *Pinetop's Boogie Woogie* is not the root–3–5–6–♭7 eighth-note climb. From bar 7 it is dotted-eighth/sixteenth dyads over a fixed root: F2+C3, G♯2, F2+A2, F2+D3, and so on. Bars 1–6 are LH thirty-second-note tremolos.
  - Evidence: `dump_score.py song.folk.boogie-woogie.pdmx`, bars 1–16.
  - Fixed: now "Its left hand in this edition is not the climb above: from bar 7 it is two-note chords over the root in a dotted rhythm." — `dump_score.py song.folk.boogie-woogie.pdmx` bars 7–12: LH F2+C3, F2+D3 … in dotted-eighth/sixteenth; bars 1–6 have no LH climb.
- [x] **FALSE** `content/lessons/blues.6.md:46` — "which is above this rung"
  - Is: its level, 7.47, is inside the rung's `levelBand` [3.5, 7.5]. It is above every other item on the rung (exercises 5.4–6.4, songs 3.52 and 4.95) but not above the rung.
  - Evidence: catalog `level`; `blues.6` `levelBand` in `stage-6.json`.
  - Fixed: now "which is levelled above everything else on this rung" — catalog levels: Pinetop 7.47; exercises 5.4–6.4; songs 3.52 and 4.95; `blues.6` levelBand [3.5, 7.5].
- [x] **FALSE** `content/lessons/blues.6.md:42` — "One boogie pattern through all twelve bars in C, then the same in F."
  - Is: the rung has no boogie exercise that runs twelve bars or moves through the blues chords. Each one is four bars of a single chord. None is offered in both keys: Pinetop and root-and-fifth are in C only (C7 throughout), and walking-eighths is in F only (F7 throughout).
  - Evidence: `dump_score.py exercise.boogie.c.pinetop`, `.c.root-fifth` and `.f.walking-eighths`, bars 1–4 of each; `notation.chords` is a single chord for each.
  - Fixed: now "The boogie exercises give each pattern four bars on one chord — Pinetop and root-and-fifth in C, walking eighths in F. Take one through all twelve bars in C, moving it to each chord yourself, then the same in F." — `dump_score.py` of the three boogie exercises: 4 bars, one chord each (C7, C7, F7). The mastery line "Pinetop's bass in two keys" is left as a goal; the rung has Pinetop in C only.
- [ ] **HISTORY** `content/lessons/blues.6.md:28` — "Jimmy Yancey's own left hand was a dotted habanera figure ... and he ended almost everything in E flat"
  - Is: the rung has no Yancey item; I did not search the catalog for one. A historian should confirm this. Pinetop 1928 does match the catalog title "(1928)".
  - Evidence: none in repository.
- [ ] **UNVERIFIED** `content/lessons/blues.6.md:55` — "a boogie that speeds up never gets past the first notch of it"
  - Is: this depends on whether early notes in Keep tempo count as wrong or missed. The timing window in `PracticeEngine.feedTempo` was not traced.
  - Evidence: `nextLadderTempo` raises only on a clean pass (`PracticeEngine.ts:103-108`). That part is true.

Checked and true:
- The root-and-fifth pattern alternates in eighths (offsets `[0, 7, …]`).
- Pinetop's climb is `[0, 4, 7, 9, 10, 9, 7, 4]`.
- 12 × 8 = 96.
- The walking bass is root–3–5–semitone below the next root (`exercise.walking-bass.c.blues`).
- The rung offers two short boogies and the Pinetop.

Not checked in this lesson: "every boogie bass since is a variation on it" (a judgement).

## chords-pop.6 — `content/lessons/chords-pop.6.md`

Claims checked: 20. Findings: 5.

- [x] **FALSE** `content/lessons/chords-pop.6.md:45` — "the lab's key setting is the cheapest way to get there: same progression, a different tonic each day"
  - Is: the rung's lab tool is the `ballad` preset, and it plays I–vi–IV–V with the progression locked. That is not this rung's I–V–vi–IV. The preset that plays I–V–vi–IV is `pop-four-chord`.
  - Evidence: `chords-pop.6` `tools` `{"kind": "lab", "preset": "ballad"}`; `LAB_PRESETS` in `app/src/engine/sightReading.ts` (`ballad`: `progressionId: 'i-vi-iv-v'`, locks progression, left hand and right hand); `LabScreen.ts` `applyLocks`.
  - Fixed: now "The lab preset on this rung, *Ballad — broken chords*, fixes its progression at I–vi–IV–V rather than this rung's loop, but its key is free" — `LAB_PRESETS` `ballad` (`sightReading.ts:869-879`): `i-vi-iv-v`, locks progression/leftHand/rightHand, not key. Pointing the rung at `pop-four-chord` is the owner's decision.
- [x] **FALSE** `content/lessons/chords-pop.6.md:37` — "Play each from its chord symbols before you play it from the page"
  - Is: five of the six scores print no chord symbols (`chordCount: 0`). Only *Annie's Song* has them.
  - Evidence: catalog `notation.chordCount` for each of the six.
  - Fixed: now "Only *Annie's Song* prints chord symbols: play it from them before you play it from the page" — `chordCount` 0 for the other five, 108 for Annie's Song (`dump_score.py` notation lines).
- [x] **FALSE** `content/lessons/chords-pop.6.md:34` — "*Clocks* and *Dancing Queen* are the four chords driven by a rhythm"
  - Is: neither is the I–V–vi–IV loop. *Clocks* is three chords, E♭–B♭m–B♭m–Fm (bars 1–4). *Dancing Queen*'s bass runs E, C♯, F♯, B, D, B–E, A, D, A… through bars 1–21, with no fixed four-chord loop.
  - Evidence: `dump_score.py song.pop.coldplay-clocks-coldplay.pdmx` bars 1–8; `song.pop.abba-dancing-queen.pdmx` LH bars 1–21.
  - Fixed: now "*All of Me* is a four-chord loop under a ballad, *Clocks* a three-chord loop driven by a rhythm" and *Dancing Queen* is listed among those without one fixed loop — Clocks LH/RH bars 1–8: E♭, B♭m, B♭m, Fm twice; Dancing Queen LH bars 1–22: no repeating four-chord cell; All of Me LH bars 1–12: E–C–G–D repeated.
- [x] **FALSE** `content/lessons/chords-pop.6.md:33` — "every one of them a song built on a loop"
  - Is: *All of Me* (Em–C–G–D) and *Clocks* do loop. *Dancing Queen* (above) does not. Neither does *Annie's Song*: its symbols run D G A Bm G D D Bm A7 G F♯m Em G A7…, with no repeating cell.
  - Evidence: as above, plus `dump_score.py song.folk.john-denver-annie-s-song.pdmx` chord list. *Flying Theme* and *Fallen Down* were not dumped for a loop.
  - Fixed: "every one of them a song built on a loop" is gone; the paragraph now says *All of Me*, *Clocks* and *Fallen Down* loop and "*Dancing Queen*, *Annie's Song* and the *Flying Theme* … move through their chords without one fixed loop" — Annie's Song chord list read in full (verses G–A–Bm–G–D–Bm–A7–G–F♯m–Em–G–A7, no short cell); Fallen Down LH bars 1–15: an eight-bar broken-chord loop (D, D, B, B, G, Gm, D, A) repeated; Flying Theme LH read for bars 1–20 only (no fixed cell there) — bars 21–52 unchecked.
- [x] **FALSE** `content/lessons/chords-pop.6.md:21` — "The chords stay put and the bass walks down the scale"
  - Is: in the lesson's own line, and in the exercise, only C/B, C/G and F/E keep the chord over the new bass. Am, Dm and G are new chords.
  - Evidence: `dump_score.py exercise.slash-bass.c`: RH C, C, Am, C, F, F, Dm, G over LH C B A G F E D G.
  - Fixed: now "The bass walks down the scale; some chords stay put over it and the others change: C, C/B, Am, C/G, F, F/E, Dm, G." — `dump_score.py exercise.slash-bass.c`: RH C, C, Am, C, F, F, Dm, G over LH C B A G F E D G. The following sentence ("Reading `C/B` and knowing it is still a C chord") is untouched and true of C/B.

Checked and true:
- The root-position motion is a fifth, a second and a third.
- The three-key practice matches the three `loop4` exercises (D, A♭, B).
- The rung has six songs.
- All six are tagged `personal-build`, and the public build uses placeholders for them (`tools/content/import_pdmx.py:235`).

Not checked in this lesson: *Flying Theme* and *Fallen Down* "a loop under a melody nobody sings" (not dumped for a loop).

## theory.6 — `content/lessons/theory.6.md`

Claims checked: 14. Findings: 1.

- [x] **FALSE** `content/lessons/theory.6.md:46` — "on the modes drill, *Show me* engraves the answer in the key signature that fits it, so B flat aeolian prints five flats"
  - Is: the mechanism is right. `fifthsFor` picks the signature with the fewest accidentals, and B♭ aeolian would get five flats. But this rung's modes drill never asks for a B♭ mode. Its roots are C, D, E, F, G and A. B♭ only comes up in `drill.theory.modes-all`, which is not on this rung.
  - Evidence: catalog `drill.theory.modes` `params.roots`; `buildMode` honours `roots` (`fromCatalog.ts:410-420`); `fifthsFor` in `answerSheet.ts:36`.
  - Fixed: example now "so F aeolian prints four flats and no accidentals" — `drill.theory.modes` params: roots C D E F G A, modes include aeolian; F aeolian's notes are A♭ major's, the only signature with all seven in key under `fifthsFor` (`answerSheet.ts:36-49`).

Checked and true:
- V in C is G, and V in E♭ is B♭.
- The 120 ms silence rule and the "note of the next chord" rule are in the code (`harmony.ts:363`, `feed` and `startsTheNextChord`).
- The previous lesson taught four modes and its rung had no modes drill (`theory.5` `exerciseOptions`).
- The rung has four dictation progressions, as the lesson says.
- The rung has no songs, and `songOptional` is set.
- The every-key Simon is on the rung, with the keys-after-miss behaviour (`simon.ts`).

Not checked in this lesson: nothing.

## improv.6 — `content/lessons/improv.6.md`

Claims checked: 11. Findings: 2.

- [x] **FALSE** `content/lessons/improv.6.md:37` — "Put `ii7 V7 I` in the lab and run it."
  - Is: the rung's lab tool opens the `minor-vamp` preset, which locks both the key (A minor) and the progression (i–♭VII–♭VI–♭VII). The progression picker is disabled there, so ii7 V7 I cannot be entered from this rung's tool. The unpreset lab, opened from the Library, does allow it.
  - Evidence: `improv.6` `tools` `{"kind": "lab", "preset": "minor-vamp"}`; `LAB_PRESETS` `minor-vamp` `locks: ['key', 'progression', 'leftHand']`; `LabScreen.ts` `applyLocks` disables the locked picker.
  - Fixed: now "The lab opens here on the minor vamp, which fixes its progression, so tap *Free*, choose *Custom…*, put `ii7 V7 I` in and run it." — `minor-vamp` locks key/progression/leftHand (`sightReading.ts:907-919`); the lab's own preset row has a *Free* chip (`LabScreen.ts` ~684) and the progression select has *Custom…* (`LabScreen.ts:471`) with typed numerals. Pointing the rung at an unlocked preset is the owner's decision.
- [x] **FALSE** `content/lessons/improv.6.md:38` — "the third and the seventh are two of them"
  - Is: this holds for ii7 and V7. The lesson's own input writes the last chord as `I`, which the lab builds as a triad, so the seventh of I is not lit.
  - Evidence: `romanToLabChord` goes through `anyRomanToChord` to `romanToChord` (`app/src/engine/drills/theory.ts:315-326`), where no `7` in the suffix gives `[0, 4, 7]`. The lit keys are those pitch classes (`LabScreen.ts` `showChordOnKeys`).
  - Fixed: now "and on ii7 and V7 the third and the seventh are two of them" — `romanToChord` (`theory.ts:305-331`) builds `I` as a triad; typing `Imaj7` would not help, because any `7` suffix on a major numeral gives [0, 4, 7, 10], a dominant seventh.

Checked and true:
- Guide tones and D dorian over Dm7 are correct theory.
- The ii–V–I guide-tone exercise and the Charleston comping are on the rung.
- The rung has no songs.

Not checked in this lesson: nothing.

## rock.6 — `content/lessons/rock.6.md`

Claims checked: 18. Findings: 4.

- [x] **FALSE** `content/lessons/rock.6.md:46` — "let the app hold the arpeggio while you play the melody and the bass"
  - Is: Duet plays one whole hand, not one voice. In *Moonlight* the melody and the triplet arpeggio share the right-hand staff (bar 5: melody in voice 1, arpeggio in voice 2), and in bar 5 the left hand carries arpeggio notes as well. In *Gnossienne* the repeating figure and the bass are both in the left hand. In neither piece can the app take the arpeggio alone.
  - Evidence: `dump_score.py song.classical.beethoven-moonlight-i` bars 1–5; `song.classical.satie-erik-satie-gnossienne-n1.pdmx` bars 1–9. Duet plays `playbackHands` by hand (`ScoreScreen.ts` `drawRunRows`; `ScoreSession.ts` ~940-990).
  - Fixed: now "the app plays one hand while you play the other, then swap. In *Gnossienne* it keeps the left hand going under your tune, then the tune while you hold the figure. It takes a hand, not a voice: *Moonlight*'s melody and arpeggio share the right hand, so it cannot hold the arpeggio alone." — `ScoreSession.ts` ~940-965 plays `pitchesToPlay(step, which, focus)` by hand; Gnossienne LH bars 1–4 A3 then C4+E4, RH the tune; Moonlight bar 5 RH v1 melody over v2 arpeggio. Paragraph trimmed to keep the lesson at 600 words (three-minute cap, `lessonShape.test.ts`).
- [x] **FALSE** `content/lessons/rock.6.md:31` — "The exercises start well below the pieces"
  - Is: three of the four do (3.4, 3.5 and 3.6 against pieces at 4.6, 6.0 and 7.1). The half-pedal exercise is level 7.4, above all three pieces.
  - Evidence: catalog `level` of `exercise.pedal.half-pedal.a` and the three songs.
  - Fixed: now "The exercises, bar the half-pedal one, start well below the pieces" — catalog levels: ostinato 3.4, broken 3.6, pedal 3.5, half-pedal 7.4; songs 4.6, 6.0, 7.1.
- [x] **FALSE** `content/lessons/rock.6.md:20` — "The exercises here run the figure in A minor, first as a bare ostinato and then as the fuller broken chord"
  - Is: the ostinato is the figure over a held A (LH A2+A3 whole notes). The "broken chord" exercise is not that figure: the right hand plays a scale and the left plays broken chords whose bass moves A–D–E–A. Nothing is held underneath.
  - Evidence: `dump_score.py exercise.ostinato.a.arpeggio` bars 1–5; `exercise.accompaniment.broken.a-minor.both` bars 1–4.
  - Fixed: now "The exercises are in A minor: the figure as a bare ostinato over a held A, then a broken-chord left hand under a scale" — `dump_score.py exercise.ostinato.a.arpeggio` (LH A2+A3 whole) and `exercise.accompaniment.broken.a-minor.both` (RH scale, LH A–C–E–C, D–F–A–F, E–G–B–G).
- [ ] **JUDGEMENT** `content/lessons/rock.6.md:39` — "the clearest example in the library of weight placed rather than struck"
  - Is: this is not checkable. The notes do match: thirteen bars of block chords.
  - Evidence: `dump_score.py song.classical.chopin-prelude-op28-20.nifc`.

Checked and true:
- The rung has three songs, all bundled: none is tagged `personal-build`.
- *Gnossienne*'s left hand repeats A3 then C4+E4.
- *Moonlight* has triplet arpeggios over a bass that moves about once a bar.
- The half-pedal exercise exists.
- The `minor-vamp` preset is A minor with held roots (`leftHand: 'whole'`).

Not checked in this lesson: "Everywhere else in this app the sustain pedal is changed *after* the new chord" was not audited app-wide.

## jam.6 — `content/lessons/jam.6.md`

Claims checked: 12. Findings: 2.

- [x] **FALSE** `content/lessons/jam.6.md:34` — "play a walking line and watch it name the chord you are implying"
  - Is: *Free play* names only notes held down at the same moment, three or more of them. A walking line plays one note at a time, so it names nothing. Released notes leave the set, with or without the pedal.
  - Evidence: `FreePlayScreen.ts` `onNote` (`held.add` / `held.delete`) and `draw()` → `nameHeldChord(notes)`; `nameHeldChord` returns null under 3 notes (`theory.ts:160-163`).
  - Fixed: now "it names a chord only from three or more notes held down together, so a line played one note at a time names nothing — hold a bar's notes down at once and watch it name the chord you are implying" — `FreePlayScreen.ts:139-153` (`held.delete` on note-off) and `nameHeldChord` returns null under 3 notes (`theory.ts:160-163`).
- [x] **FALSE** `content/lessons/jam.6.md:36` — "The lab's *Blues — twelve bars* preset walks a bass under the form itself ... listen to one chorus of its line"
  - Is: *Jam it* plays a bass of root on beat 1 and fifth on beat 3, not a walk. The preset's `leftHand: 'walking'` exists only in the score *Read it* writes, which has to be opened and played back to be heard. The key is free, as the lesson says.
  - Evidence: `barSchedule` in `app/src/audio/backingLoop.ts` (bass at beat 0 and beat 2 only), used by `LabScreen.ts` `scheduleBacking`; `LAB_PRESETS` `blues-shuffle`.
  - Fixed: now "preset writes a walking bass under the form itself … press *Read it* and listen to one chorus of its line in the score, then play your own. *Jam it* plays a plainer bass, root and fifth." — `barSchedule` (`backingLoop.ts:52-76`) puts bass on beats 1 and 3 only; `blues-shuffle` `leftHand: 'walking'` is used by the score *Read it* writes. Whether *Jam it* should walk is the owner's decision.

Checked and true:
- The walking exercises are four quarters a bar, with approach notes a step from the next root (`exercise.walking-bass.e.blues.intro` bars 1–5).
- The intro tier has no right hand. The standard tier has RH chords (`exercise.walking-bass.a.blues`).
- The keys are E, A and D.

Not checked in this lesson: the mastery line asks for the E walk "with chords on top", but the rung has a with-chords version in A only. That was read as a goal, not listed.

## classical.7 — `content/lessons/classical.7.md`

Claims checked: 20. Findings: 6.

- [x] **FALSE** `content/lessons/classical.7.md:32` — "the development is the part nobody can, because it is the only part that is not repeated"
  - Is: in this score the development is repeated. K. 545 i repeats bars 1–28 (the exposition) and bars 29–73 (development and recapitulation).
  - Evidence: MusicXML of `song.classical.mozart-k545-i`: forward repeat at bar 1, backward at 28, forward at 29, backward at 73.
  - Fixed: the reason "because it is the only part that is not repeated" is removed; the sentence ends "the development is the part nobody can." — MusicXML of `song.classical.mozart-k545-i`: repeats forward 1 / backward 28, forward 29 / backward 73.
- [x] **UNOFFERED** `content/lessons/classical.7.md:36` — "A Chopin nocturne writes the tune once plainly and then again with a spray of small notes over it."
  - Is: there is no nocturne among the rung's six options: K. 545, Moonlight, Pathétique II, Mazurka Op. 7 No. 1, and Inventions 1 and 4. Nocturnes are in the Library, but this paragraph does not point there.
  - Evidence: `classical.7` `songOptions` in `stage-7.json`.
  - Fixed: now "A Chopin nocturne (several are in the Library) writes the tune once plainly…" — catalog has 13 nocturne rows, all `tracks: ['classical']`, none tagged `personal-build`.
- [x] **UNOFFERED** `content/lessons/classical.7.md:54` — "The other inventions, waltzes and nocturnes are in the Library."
  - Is: the other 13 inventions are in the Library under Classical. But "other waltzes and nocturnes" implies some are on this rung, and none are.
  - Evidence: catalog search for `invention` returned BWV 772–786, all `tracks: ['classical']`. `songOptions` as above.
  - Fixed: now "The other inventions, and Chopin's waltzes and nocturnes, are in the Library." — no longer implies waltzes or nocturnes on the rung; catalog: 15 inventions (BWV 772–786) and 15 Chopin waltz rows, all `['classical']`.
- [x] **UNOFFERED** `content/lessons/classical.7.md:56` — "Taking the nocturnes too slowly. They are marked *Andante* and *Larghetto*"
  - Is: no nocturne is on the rung. The two nocturnes meant are not named, so the tempo markings could not be checked against a file.
  - Evidence: as above.
  - Fixed: now "Taking nocturnes too slowly. Op. 9 No. 2 is marked *Andante* and No. 1 *Larghetto*" — `dump_score.py` text lines: `chopin-nocturne-op9-2` "Andante", `chopin-nocturne-op9-1` "Larghetto"; both in the catalog, tagged `musetrainer`.
- [x] **UNOFFERED** `content/lessons/classical.7.md:66` — "a nocturne where the ornament sounds like one gesture rather than a scale"
  - Is: this mastery line needs a piece the rung does not offer.
  - Evidence: as above.
  - Fixed: now "a nocturne from the Library where the ornament…" — the mastery line still asks for a piece the rung does not offer; whether to put a nocturne on the rung is the owner's decision.
- [ ] **JUDGEMENT** `content/lessons/classical.7.md:50` — "a left hand that leans on beat two or three, not one — the mazurka's accent"
  - Is: this is correct as a description of the genre. The Op. 7 No. 1 file was not read for accent marks.
  - Evidence: none read.

Checked and true:
- Stage 6 was melody over accompaniment.
- The rung has six songs.
- The inventions are No. 1 in C and No. 4 in D minor.
- Duet plays the other hand at a fixed velocity of 70 (`app/src/score/ScoreSession.ts`, `velocity: 70`).
- *Moonlight* and *Pathétique* II are the named movements.

Not checked in this lesson: "Bach wrote almost no dynamics" (HISTORY, correct in general, not listed).

---
Batch 4: 17 of 17 lessons. 57 findings
(36 FALSE, 2 STALE, 1 WRONG-COUNT, 4 UNOFFERED, 0 THEORY, 8 JUDGEMENT, 2 UNVERIFIED; plus 4 HISTORY).
Lessons not finished: none.

Fix pass: 43 fixed, 0 found wrong and not fixed, 14 left open (THEORY/JUDGEMENT/HISTORY/UNVERIFIED or needs a build). Lessons edited: theory.5, improv.5, latin, technique.5, rock.5, jam.5, classical.6, ragtime.6, technique.6, blues.6, chords-pop.6, theory.6, improv.6, rock.6, jam.6, classical.7.
