# Lesson audit — batch 2

Instruments used throughout: `python tools/content/dump_score.py <id>` for every score claim;
the rung objects in `content/curriculum/stage-3.json` and `stage-4.json` (and other stage files
for cross-rung claims); `app/public/content/catalog.json` for drill params, titles, grades;
`app/src/engine/sightReading.ts` (`LAB_PRESETS`, `LAB_PROGRESSIONS`, lab left-hand writer),
`app/src/ui/screens/LabScreen.ts`, `LessonScreen.ts` (`toolButton`), `ScoreScreen.ts`,
`TodayScreen.ts`, `DrillScreen.ts`, `app/src/engine/drills/*` for tools. Two facts used in
several lessons, stated once here with their evidence:

- **The rung's *Play it as a duet* button** opens the rung's *first playable song* with
  `hands: 'R'` (`LessonScreen.ts:403-449`, `scorePiece`); it never opens an exercise. The Duet
  row on the score screen is hidden when the piece has no other hand (`ScoreScreen.ts:2327-2332`).
- **The lab's `V`** is a plain triad: `LAB_PROGRESSIONS` `i-iv-v-i` is `['I','IV','V','I']`
  (`sightReading.ts:760`) and `romanToLabChord` spells what it is given.

Nothing here has been heard. Front-matter `videos:` were skipped in every lesson per the brief.

## 3.2 — `content/lessons/3.2.md`

Claims checked: 16. Findings: 2.

- [x] **FALSE** `content/lessons/3.2.md:35` — "I–IV–V7 drills in C, G and F, both root position and the smooth version"
  - Is: root position is offered only in G (`exercise.cadence.g.root`); C and F have only the smooth version (`exercise.cadence.c.voice-led`, `.f.voice-led`). The drill `drill.chord.primary-c-g-f` accepts any voicing (`anyOctave: true`), so it does not practise either shape.
  - Evidence: stage-3.json `3.2.exerciseOptions`; dump_score of all four cadence exercises (g.root bar 3 = D4-F#4-A4-C5; c/f voice-led bar 3 = B2-F3-G3 / E3-Bb3-C4); `fromCatalog.ts:273-322` (`buildChord`, `anyOctave: true`).
  - Fixed: now "I–IV–V7–I in G in root position, and the smooth version in C, G and F; a chord drill that asks for I, IV and V7 in all three keys" — the rung has `cadence.g.root` and the three `voice-led` cadences (re-read with dump_score); the drill's catalog params are keys C/G/F, degrees I/IV/V7.
  - Second read (2026-09-22): HOLDS — rung 3.2's six `exerciseOptions` re-read, and all four cadence exercises dumped bar by bar from the `.mxl`. `exercise.cadence.g.root` is G–B–D, C–E–G, D–F♯–A–C, G–B–D: root position with a four-note V7, and it is the **only** root-position cadence on the rung. The three `voice-led` ones are in C, G and F and move by common tone (C: C–E–G, C–F–A, B–F–G, C–E–G). `drill.chord.primary-c-g-f`'s params are `keys ['C','G','F']`, `degrees ['I','IV','V7']`, so the drill really does ask for all three keys.
  - Row: `lessonClaimsAboutApp.test.ts` › "3.2: the rung has one root-position cadence, in G, three smooth ones, and a drill over all three keys" — reads the authored rung and the drill row.
- [x] **FALSE** `content/lessons/3.2.md:44` — "The accompaniment lab under Library will build this rung in either key."
  - Is: the lab's `primary-chords` preset builds I–IV–V–I with a plain V triad (D in G, C in F), not the V7 this rung is about. Typing `I IV V7 I` in the lab's own numerals field would build it; the preset does not.
  - Evidence: `sightReading.ts` `LAB_PRESETS` `primary-chords` → `progressionId: 'i-iv-v-i'`; `LAB_PROGRESSIONS` `i-iv-v-i.major = ['I','IV','V','I']`.
  - Fixed: now "will build this rung's three chords in either key, with a plain V where this rung has V7" — `primary-chords` is `i-iv-v-i` = `['I','IV','V','I']` (`sightReading.ts:758-764`) and `romanToLabChord` spells a plain V as a triad. Whether the preset should play V7 is the owner's call.
  - Second read (2026-09-22): HOLDS — `LAB_PRESETS` `primary-chords` (`sightReading.ts:912-926`) still names `progressionId: 'i-iv-v-i'` and locks `['progression', 'leftHand']`, and `LAB_PROGRESSIONS`' `i-iv-v-i` (`:759-765`) is `major: ['I','IV','V','I']` — a plain V, no seventh. The rung's own tool is that preset (`tools: [{lab, preset: primary-chords, mode: tune}, {play}]`), so the lesson is describing the button it has. Its `mode: "tune"` also matches the sentence two lines on, "It opens on *Play the tune*".
  - Row: `lessonClaimsAboutApp.test.ts` › "3.2: the lab preset this rung opens plays a plain V where the rung teaches V7" — reads the preset and its progression from `sightReading`.

Not checked in this lesson: "80 bpm" in the closing line (a practice target, not an app setting).

## 3.3 — `content/lessons/3.3.md`

Claims checked: 15. Findings: 3.

- [x] **FALSE** `content/lessons/3.3.md:33` — "every cadence turns to E7 with its G sharp"
  - Is: two of the four phrase endings land on G major, not E7: bars 3–4 and 11–12 (`[G major]`, melody D5–B4, G4–A4–B4). E7 arrives at bars 6–7 and 14 only.
  - Evidence: `dump_score.py song.folk.greensleeves.chords`, bars 3–4, 6–7, 11–12, 14.
  - Fixed: now "both cadences home to A come through E7 with its G sharp" — dump_score: bars 3–4 and 11–12 rest on G; bars 6–7→8 and 14→15 are E7→Am.
  - Second read (2026-09-22): HOLDS — every `<harmony>` in the `.mxl` by bar: 1–2 Am, 3–4 G, 5 Am, 6–7 E7, 8–10 Am, 11–12 G, 13 Am, 14 E7, 15 Am. There are exactly two places where the harmony returns to A minor from something else — bar 7→8 and bar 14→15 — and **both** are preceded by E dominant. So the plural in "both cadences" is enumerated rather than assumed, and the two G endings are the ones the original "every cadence" had swallowed.
  - Row: `lessonClaimsAboutMusic.test.ts` › "3.3: both of Greensleeves' returns to A minor come through an E dominant" — reads the harmony sequence of the built score.
- [x] **FALSE** `content/lessons/3.3.md:36` — "A harmonic minor scale hands separately"
  - Is: the rung's scale exercise is hands together in similar motion (`exercise.scale.a-harmonic-minor.1oct.similar.both.2`, RH A4–A5 and LH A2–A3 in the same bars). No hands-separate A harmonic minor exercise is on the rung.
  - Evidence: stage-3.json `3.3.exerciseOptions`; dump_score of that exercise, bars 1–2.
  - Fixed: "hands separately" → "hands together" — the rung's only A harmonic minor scale is `…1oct.similar.both.2`, both hands in the same bars (dump_score bars 1–2).
  - Second read (2026-09-22): HOLDS — rung 3.3's seven `exerciseOptions` hold exactly one scale, `exercise.scale.a-harmonic-minor.1oct.similar.both.2`, and its `.mxl` puts A4–A5 on staff 1 and A2–A3 on staff 2 **in the same two bars**, eighth for eighth, with the G♯ in both hands. The catalog does carry `…similar.left.2` and `…similar.right.2`, so hands-separate versions exist — they are simply not on this rung, which is what made "hands separately" wrong.
  - Row: `lessonClaimsAboutApp.test.ts` › "3.3: the rung's only A harmonic minor scale is the hands-together one" — reads the authored rung's options against the catalog's four `1oct` ids.
- [x] **FALSE** `content/lessons/3.3.md:43` — "The lab takes numerals typed by hand, sevenths included, so `i iv V7 i` in A minor gives you these changes"
  - Is: this rung's lab button opens the `minor-vamp` preset, which locks key (A minor) and progression (i–♭VII–♭VI–♭VII = Am G F G); locked controls are disabled. The numerals field works only after tapping *Free* in the preset row. The claim is true of the free lab, not of the rung's tool.
  - Evidence: stage-3.json `3.3.tools = [{lab, preset: minor-vamp}, {play}]`; `LAB_PRESETS` `minor-vamp.locks = ['key','progression','leftHand']`; `LabScreen.ts:585-603` (`applyLocks` disables), `:683-697` (Free chip).
  - Fixed: the paragraph now says the lab button opens the minor vamp (Am, G, F, G) with key and chords fixed, and that typed numerals need *Free* then *Custom…* — `minor-vamp.locks = ['key','progression','leftHand']`; `applyLocks` disables the progression select (`LabScreen.ts:585-603`); the numerals row shows only when that select is `Custom…` (`LabScreen.ts:466-476`). Pointing the rung at an unlocked preset instead is the owner's call.
  - Built (2026-09-21): 3.3 now carries a second lab tool with no preset, labelled *Lab — your own chords*, so nothing is locked there. The paragraph keeps the minor vamp and the typed numerals go to the new button: "*Lab — your own chords* opens the same screen with nothing fixed, so the chord picker’s *Custom…* is yours".
  - Second read (2026-09-22): HOLDS, on a third shape — **the Built line is out of date and the lesson is not**. T16 replaced the second button with an `unlock` field, so rung 3.3's tools are now `[{lab, preset: minor-vamp, unlock: ['progression']}, {play}]`, one lab button. `labLocksFor` (`sightReading.ts:882-889`) subtracts the freed names from the preset's own, so this visit locks `key` and `leftHand` and leaves the progression picker live; `applyLocks` (`LabScreen.ts:1007-1025`) only disables what is still locked. `3.3.md:43-48` already describes exactly that — "opens the minor vamp — Am, G, F, G — in A minor, with the key fixed and the chords left to you: the chord picker's *Custom…* is open here" — and `minor-vamp` is `keyId: 'a-minor'`, `progressionId: 'i-v-vi-iv'`, whose minor spelling is `['i','♭VII','♭VI','♭VII']` = Am G F G. Every clause checks.
  - Row: `lessonClaimsAboutApp.test.ts` › "3.3: the lab opens the minor vamp in A minor with the key locked and the chord picker freed" — reads the rung's `unlock` through `labLocksFor` rather than the preset's raw locks.

Not checked in this lesson: nothing.

## 3.4 — `content/lessons/3.4.md`

Claims checked: 14. Findings: 3.

- [x] **FALSE** `content/lessons/3.4.md:46` — "The daily read on *Today* moves up with you, and at this stage it is the two-hand phrase"
  - Is: at Stage 3 Today's read is `drill.reading.sight-reading-2-right` — level 2, right hand only. The two-hand level-2 item (`sight-reading-2`) has catalog level 3.4, so it becomes the daily read only at Stage 4.
  - Evidence: `TodayScreen.ts:379-385` (`dailyItemFor`: highest sight-reading item with `level <= stageNumber`); catalog: `-1` 1.5, `-1-left` 1.6, `-2-right` 2.2 (hands right), `-2` 3.4 (hands both).
  - Fixed: now "at this stage it is a right-hand phrase at level 2 … The two-hand phrase becomes the daily read at Stage 4" — `dailyItemFor` takes the highest sight-reading item with `level <= stageNumber` (`TodayScreen.ts:379-385`); catalog levels 2.2 (`-2-right`, hands right) and 3.4 (`-2`, both).
  - Second read (2026-09-22): HOLDS — `TodayScreen.ts:379-385` still sorts every `sight-reading` row by `level`, keeps those with `level <= stageNumber` and takes the last. All nine rows listed: `-1` 1.5 right, `-1-left` 1.6 left, `-2-right` **2.2 right**, `-2` **3.4 both**, `-3` 4.5, `-4` 5.0, `-5` 5.5, `-6` 6.5, `-7` 7.5. At stage 3 the highest row at or below 3 is `-2-right`, which is `hands: right`; `-2` at 3.4 first qualifies at stage 4. Both halves of the sentence follow from the same two numbers.
  - Row: `lessonClaimsAboutApp.test.ts` › "3.4: the daily read is the right-hand level-2 phrase at Stage 3 and the two-hand one at Stage 4" — reproduces `dailyItemFor`'s rule over the real catalog rows.
- [x] **FALSE** `content/lessons/3.4.md:47` — "over the wider range: the landmarks above"
  - Is: level-2 sight-reading writes the right hand in C4–C5 and the left in C3–G3 (MIDI 60–72, 48–55). High C (C6) and Low C (C2) never appear, and nothing goes above or below the staff except middle C.
  - Evidence: `sightReading.ts` `LEVELS[2]` `rhKey {60,72}`, `lhKey {48,55}`.
  - Fixed (same sentence): "over the wider range: the landmarks above" → "between middle C and the C above it" — `LEVELS[2].rhKey {60,72}` in `sightReading.ts`; the Stage 3 item is right hand only.
  - Second read (2026-09-22): HOLDS — `sightReading.ts:159-168` gives `LEVELS[2]` `rhKey: { low: 60, high: 72 }`, which is C4 to C5 inclusive, and the row the Stage 3 daily read resolves to is `hands: right`, so the left-hand range never applies. Middle C to the C above it is exactly the stated span, and neither High C (C6) nor Low C (C2) can be drawn.
  - Row: `lessonClaimsAboutApp.test.ts` › "3.4: the level-2 phrase spans middle C to the C above and no further" — reads `LEVELS[2].rhKey` from `sightReading`.
- [ ] **JUDGEMENT** `content/lessons/3.4.md:40` — "the first real piece in the plan"
  - Is: earlier rungs already offer composed pieces: Beethoven's *Ode to Joy* settings from 1.1, and Gruber's *Silent Night* (melody) on the Stage 2 holiday rung. Whether the Petzold is the first *real* one is a musician's call.
  - Evidence: `songOptions` of stages 0–3 filtered for `song.classical.*`, then catalog `composer` of each (*Ah! vous dirai-je* on 1.2 is `Traditional (French)`, so it is not counted).
  - Reader 1: REWRITE — "the first piece in the plan written to be played rather than arranged down to a few notes". As it stands the sentence ranks every earlier piece as not a real one, and the rungs below it already carry Beethoven and Gruber under their own composers' names, so the claim a reader can check contradicts it. The rewrite says what is actually distinctive about the Petzold here — that it is a complete keyboard piece rather than a melody extracted from one — and asserts nothing about what is real.

Not checked in this lesson: whether the Petzold's right hand "ranges well above the staff" is "well" (it reaches B5, bar 17, two steps above the first ledger line).

## 3.5 — `content/lessons/3.5.md`

Claims checked: 12. Findings: 0.

Checked and true: the pedal drill scores a change as clean when CC64 lifts 0–120 ms after the new chord's first Note-On and goes down within 250 ms (`special.ts:218-310`, catalog `maxOverlapMs: 120`); the drill screen has a pedal lamp (`DrillScreen.ts:1201`); the drill is I–IV–V7–I (catalog `progression`); *Greensleeves (waltz bass)* and the easy *Canon in D* are on the rung; none of the three rung songs has a `<pedal>` element (0 in each file), so "many editions ... have none" understates rather than misstates.

Not checked in this lesson: "What your HP-130 sends" — the owner's instrument model is not in the repository. "broken-chord left hand with pedal": the rung's `drill.pattern.lh-accompaniment` is a technique-pattern drill (`fromCatalog.ts` default branch) that does not read the pedal; the lesson does not say it does.

## 3.6 — `content/lessons/3.6.md`

Claims checked: 16. Findings: 3.

- [x] **FALSE** `content/lessons/3.6.md:38` — "then the same drills with a right-hand scale over the top"
  - Is: one such exercise is offered — `exercise.accompaniment.broken.a-minor.both` (A natural-minor scale over a broken chord). There is none for Alberti or waltz bass, and none in C, G or F.
  - Evidence: stage-3.json `3.6.exerciseOptions`; dump_score of `.broken.a-minor.both` bars 1–4.
  - Fixed: now "then the broken chord in A minor with a right-hand scale over the top" — `exercise.accompaniment.broken.a-minor.both` is the rung's only hands-together pattern exercise (stage-3.json; dump_score bars 1–4).
  - Second read (2026-09-22): HOLDS — rung 3.6's eight `exerciseOptions` re-read one by one: the three `exercise.accompaniment.*.c-major.*` are `.left` (broken, alberti and waltz), and the only `both` accompaniment item on the rung is `exercise.accompaniment.broken.a-minor.both`. Its `.mxl` puts an A natural-minor scale on staff 1 (A4 up to A5 and back) against a broken A–C–E–C, D–F–A–F, E–G–B–G in staff 2 — a right-hand scale over a broken chord, singular, exactly as the sentence now says.
  - Row: `lessonClaimsAboutApp.test.ts` › "3.6: exactly one accompaniment exercise on this rung is hands together, and it is the broken one in A minor".
- [x] **FALSE** `content/lessons/3.6.md:45` — "These three patterns are the ones the accompaniment lab writes"
  - Is: the lab's *Broken* is root–fifth–third–fifth in quarters (the Alberti order slowed down), not this lesson's root–third–fifth–third. The lab has no waltz bass (see next finding).
  - Evidence: `sightReading.ts` `ALBERTI_ORDER = [0, 2, 1, 2]` used by `labLeftBar` for both `alberti` and `broken`; `LabScreen.ts:71-78` `LEFT_HANDS`.
  - Fixed: the paragraph now says the lab writes the Alberti bass and that its *Broken* is the same order in quarters, not root–third–fifth–third — `labLeftBar` uses `ALBERTI_ORDER = [0, 2, 1, 2]` for both, eighths for `alberti`, quarters otherwise (`sightReading.ts:1102-1148`).
  - Second read (2026-09-22): HOLDS — `ALBERTI_ORDER` is still `[0, 2, 1, 2]` (`sightReading.ts:1286`), i.e. lowest, highest, middle, highest, and `labLeftBar` (`:1313-1323`) uses it for every pattern but `walking`, with `step = DIVISIONS / 2` only when the pattern is `alberti` and a whole division otherwise. So *Broken* is the Alberti order in quarters, which is what the sentence now says, and it is not the root–third–fifth–third the lesson teaches by hand.
  - Row: `lessonClaimsAboutApp.test.ts` › "3.6: the lab's Broken left hand is the Alberti order in quarters, not root–third–fifth–third" — builds a bar of each through the real writer and compares the pitch order and the note values.
- [x] **FALSE** `content/lessons/3.6.md:47` — "pick the alberti or the waltz bass and *Read it*"
  - Is: the lab's left hands are None, Held roots, Block chords, Alberti, Broken, Walking. No waltz. The lab also writes only 4/4 (it passes no `timeSig`; the writer defaults to 4/4).
  - Evidence: `LabScreen.ts:71-78`; grep for `waltz|timeSig|3/4` in `LabScreen.ts` and for `waltz` in `sightReading.ts` returned nothing; `sightReading.ts:1304` default `{ beats: 4, beatType: 4 }`.
  - Fixed: now "It has no waltz bass and writes only 4/4 … pick Alberti and *Read it*" — `LEFT_HANDS` (`LabScreen.ts:71-78`) has no waltz; `timeSig|waltz` in `LabScreen.ts` counted 0 and `buildLabExercise` defaults to 4/4 (`sightReading.ts:1304`). The rung's only tool is `duet`, so the sentence now says the lab is under Library.
  - Second read (2026-09-22): HOLDS, both halves, each with two searches — `LEFT_HANDS` (`LabScreen.ts:91-98`) is None, Held roots, Block chords, Alberti, Broken, Walking; the type `LabLeftHand` (`sightReading.ts:1227`) is the same six names, so there is no waltz behind the picker either. `grep -rn waltz src/` returns **one** line, a comment in `audio/backingLoop.ts:165` about a jazz waltz — nothing in the lab. For the metre: `buildLabExercise` takes an optional `timeSig` and defaults it to `{ beats: 4, beatType: 4 }` (`:1488`), and `grep -rn timeSig src/ui/screens/LabScreen.ts` returns nothing, so the screen never passes one. Rung 3.6's only tool is `duet`, so "under Library" is the right door.
  - Row: `lessonClaimsAboutApp.test.ts` › "3.6: the lab offers six left hands and no waltz, and writes 4/4" — reads `LabLeftHand`'s six values and the metre `buildLabExercise` writes with no `timeSig`.

Not checked in this lesson: nothing. (The rung's only tool is `duet`; it opens `song.folk.greensleeves.waltz`, as the lesson implies.)

## classical.3 — `content/lessons/classical.3.md`

Claims checked: 22. Findings: 4.

- [x] **FALSE** `content/lessons/classical.3.md:42` — "Six options, all dances from the notebooks the Bach and Mozart children learned from"
  - Is: six is right, but only four are from the Anna Magdalena notebook (Anh. 114, 115, 132, 113). The K. 331 item is a sonata theme, not a dance and not from a notebook — and this file is a C major 3/4 arrangement (the original is A major 6/8). The Beethoven Écossaise WoO 23 is a dance but not from a notebook.
  - Evidence: stage-3.json `classical.3.songOptions` (6); catalog `composer` fields; dump_score of the K. 331 item (fifths 0, 3/4, 16 bars).
  - Fixed: now "Six options, four of them minuets from Anna Magdalena Bach's notebook … the theme of Mozart's K. 331, set here in C major in 3/4" — the four Anh. rows; dump_score of the K. 331 item: fifths 0, 3/4, bass C. The original's A major 6/8 is not added (history, not checked here).
  - Second read (2026-09-22): HOLDS — all six `songOptions` re-read with their titles, composers and measured `notation`. Four are the Anh. minuets: 114 (`fifths 1`, 3/4, 32 bars), 115 (`fifths -2`, 3/4, 16 bars), 132 (`fifths -1`, 3/4, 18 bars), 113 (`fifths -1`, 3/4, 32 bars); the fifth is the K. 331 theme, `fifths 0` and 3/4 as the sentence says; the sixth is the Écossaise. So "six" and "four of them" are both counted rather than asserted. The G minor one is the 16-bar fragment, and the lesson now says "here only its first sixteen bars", which closes the note this batch left under classical.3.
  - Row: `lessonClaimsAboutMusic.test.ts` › "classical.3: six options, four Anna Magdalena minuets in 3/4, the K. 331 theme in C and 3/4, and a 16-bar G minor fragment".
- [x] **FALSE** `content/lessons/classical.3.md:46` — "Beethoven's *Écossaise* in G for a quick 2/4 with hand shifts"
  - Is: the bundled file is in F major (key signature one flat, ends on F) although its title says G major. It is also one staff, right hand only, so there is no left hand to play.
  - Evidence: `dump_score.py song.classical.beethoven-ludwig-van-beethoven-ecossaise.pdmx` — `fifths -1`, `staves 1`, bar 1 F4, bar 32 F5.
  - Fixed: now "Beethoven's *Écossaise*, titled in G but written here in F, for the right hand alone — a quick 2/4 with position shifts" — dump_score: `fifths -1`, `staves 1`, bar 1 F4, bar 32 F5. The file itself being wrong is the owner's separate decision (README, "Score files that are wrong").
  - Second read (2026-09-22): HOLDS on the sentence **as it now stands**, which is not the sentence the fix wrote — T15 (Entry 34) retitled the row to "Écossaise in F major (after WoO 23)", so the title no longer says G, and the lesson's clause has been shortened to "Beethoven's *Écossaise*, in F for the right hand alone — a quick 2/4 with position shifts". Measured against the file: `notation.keys` `fifths -1, mode major`, `staves: 1`, `times ['2/4']`, `hands: right`. Every clause of the shorter sentence is true, and the contradiction the finding was about has been removed at the source rather than described in the prose.
  - Row: `lessonClaimsAboutMusic.test.ts` › "classical.3: the Écossaise is in F, one staff, in 2/4, and its title says F too" — the title half is the part T15 changed, so the row holds both together.
- [x] **FALSE** `content/lessons/classical.3.md:38` — "The drill on the technique track at Stage 5 is deliberately the other one, the stroked sign going below"
  - Is: `technique.5` (Stage 5) does offer lower-neighbour mordents (`exercise.mordent.c.2pb.left`: C2 B1 C2), but they are written out as eighth notes with no mordent sign of any kind. The file has no `<mordent>` or `<inverted-mordent>` element.
  - Evidence: stage-5.json `technique.5.exerciseOptions`; dump_score of `exercise.mordent.c.2pb.left` and `.right`; regex over the `.mxl` found only `<words>`.
  - Fixed: now "the other one, the note below, written out as eighth notes rather than as a sign" — `technique.5` offers `exercise.mordent.c.2pb.left` (dump_score: C2 B1 C2 in eighths); its MusicXML has no mordent element (only `<words>`; "mordent" occurs only in the container's file name).
  - Second read (2026-09-22): HOLDS — `technique.5`'s options hold exactly one mordent item, `exercise.mordent.c.2pb.left`, and its `.mxl` is C2 B1 C2, D2 C2 D2, E2 D2 E2, F2 E2 F2 in eighths: the note **below**, written out. Counted rather than eyeballed: the file has **0** `<mordent>` or `<inverted-mordent>` elements and **0** `<ornaments>` elements; its only text is `<words>2 notes to the beat — count them, do not hurry</words>`. The `.right` companion is the same, and it is not on the rung.
  - Row: `lessonClaimsAboutMusic.test.ts` › "classical.3: the Stage 5 mordent exercise goes to the note below and prints no ornament sign" — reads the pitches and counts the ornament elements in the built score.
- [ ] **JUDGEMENT** `content/lessons/classical.3.md:38` — "the plain sign is much the commoner one in print"
  - Is: a claim about editions in general; a musician should confirm.
  - Evidence: none in repository.
  - Reader 1: REWRITE — "Editions differ, and when one does not say, take the note above." Drop "much the commoner one in print": it is a frequency claim over the world's editions, and **the one corpus that can be counted here points the other way**. All 1,974 bundled score files were opened and their ornament elements counted: `<mordent>` (the sign *with* the vertical line, the note below) appears 380 times in 45 files, and `<inverted-mordent>` (the plain zigzag, the note above) 151 times in 27 files — the stroked sign is the commoner one here, by files and by elements. That is a claim about this corpus, not about print in general, which is exactly why the sentence should not make the larger one. (My first draft of this line said the corpus had no mordent signs at all; that was an absence asserted from the two `exercise.mordent.*` files, and the corpus scan is what caught it.)

Not checked in this lesson: the G minor companion (`song.pop.minuet-in-g-minor-bach-piano.pdmx`) is only the first 16 bars and ends on B♭. The lesson does not say otherwise, but a learner expecting the whole minuet will not get it.

## chords-pop.3 — `content/lessons/chords-pop.3.md`

Claims checked: 18. Findings: 1.

- [x] **FALSE** `content/lessons/chords-pop.3.md:57` — "because the key is the one thing that preset leaves you"
  - Is: `primary-chords` locks only progression and left hand. Key, right hand, bars and tempo are all free.
  - Evidence: `LAB_PRESETS` `primary-chords.locks = ['progression', 'leftHand']`; `LabScreen.ts:585-603`.
  - Fixed: now "because that preset fixes only the chords and the left hand, and leaves the key to you" — `primary-chords.locks = ['progression', 'leftHand']`.
  - Second read (2026-09-22): HOLDS — `LAB_PRESETS` `primary-chords` (`sightReading.ts:912-926`) still declares `locks: ['progression', 'leftHand']`, and `LabLock` (`:860`) names five lockable controls — `key`, `progression`, `leftHand`, `rightHand`, `bars` — so three of the five, key among them, are left free. `applyLocks` (`LabScreen.ts:1007-1025`) disables only the names in the locked set, so nothing else is greyed. Rung chords-pop.3's lab tool carries no `unlock`, so the preset's own list is what applies here.
  - Row: `lessonClaimsAboutApp.test.ts` › "chords-pop.3: the primary-chords preset fixes the chords and the left hand and leaves the key free" — reads the preset's locks against the full `LAB_LOCKS` list.

Checked and true: six songs; *Happy Birthday*, *Saints* (F), *Jingle Bells* (G, block chords) and *Greensleeves (with chords)* print chord symbols over two staves; *Oh! Susanna* is one staff with symbols; *Tom Dooley* is two staves with `chordCount 0`; the preset opens in D (`keyId: 'd-major'`); Jam it shows a chord per bar over drums (`LabScreen.ts:292-330`).

Not checked in this lesson: nothing.

## blues.3 — `content/lessons/blues.3.md`

Claims checked: 18. Findings: 4.

- [x] **FALSE** `content/lessons/blues.3.md:36` — "*St. Louis Blues* is the famous one and is the longest."
  - Is: *St. Louis Blues* is 28 bars. *Wabash Blues* is 57 bars and *Tishomingo Blues* is 48.
  - Evidence: dump_score `notation.bars` of all five songs: 28, 57, 48, 24 (St. James), 8 (Careless Love).
  - Fixed: now "*St. Louis Blues* is the famous one; *Wabash Blues* is the longest" — dump_score bars as written (repeats not expanded): Wabash 57, Tishomingo 48, St. Louis 28.
  - Second read (2026-09-22): HOLDS — measured `notation.bars` for all five of the rung's songs: Careless Love 8, St. James Infirmary 24, St. Louis Blues 28, Tishomingo Blues 48, **Wabash Blues 57**. Wabash is the longest by the measure the lesson's neighbouring sentence also uses ("*Careless Love* is the shortest — eight bars", which is right too), so both superlatives on this rung are now enumerated rather than assumed.
  - Row: `lessonClaimsAboutMusic.test.ts` › "blues.3: Wabash Blues is the longest of the rung's five and Careless Love the shortest".
- [ ] **UNVERIFIED** `content/lessons/blues.3.md:34` — "*Wabash Blues* and *Tishomingo Blues* are full published songs with a verse before the chorus, so read the chorus first."
  - Is: neither file labels a verse or a chorus. Their only text is `= 120`, `solos at B`, `Back to B` (Wabash) and `= 132`, `Opt. Break on Solos` (Tishomingo), which reads like a band lead sheet, not the published song sheet. Wabash changes key at bar 17 (B♭ → E♭), which may be the verse/chorus boundary. A learner cannot find the "chorus" the lesson names.
  - Evidence: dump_score "text on the score" lines and key signatures for both.
  - Reader 1: WRONG as an instruction the learner can follow (neither score names a verse or a chorus) — verified now with the instrument the finding said was missing, the MusicXML itself. *Wabash Blues*: every `<words>` element is `= 120`, `solos at B`, `Back to B`, and its `<rehearsal>` marks are A, A, B, C, with `<fifths>` changing from −2 to −3. *Tishomingo Blues*: `<words>` are `= 132` and `Opt. Break on Solos`, `<rehearsal>` A, B, C, one key signature. So the sections **are** marked — with rehearsal letters — and "read the chorus first" points at a label that is not on the page. The smallest true change is to name the letters: "…sectioned with rehearsal marks; start at B". **Unsettled, and not settled here:** whether these two published songs have a verse-and-chorus form is history, and there is no source in the repository for it — the catalog's `source` for both is the import, with no publication details.
- [x] **FALSE** `content/lessons/blues.3.md:44` — "You are already playing pieces built on it"
  - Is: of the five, only *St. Louis Blues* bars 1–12 is a twelve-bar blues (E–A7–E–B7 pattern). *St. James Infirmary* is built from 8-bar phrases (24 bars), *Careless Love* is 8 bars, and neither *Wabash* nor *Tishomingo* shows a twelve-bar section in its chord symbols.
  - Evidence: dump_score chord symbols per bar for all five.
  - Fixed: now "*St. Louis Blues* opens with twelve bars of it" — dump_score chord symbols: St. Louis bars 1–12 E, A, E/B7, E, A, –, E/B7, E, B7, –, E, B7; St. James is 8-bar phrases, Careless Love 8 bars, and Wabash and Tishomingo show no twelve-bar section. Reading the form from symbols is my read; a musician may confirm.
  - Second read (2026-09-22): HOLDS, with the same caveat the fix line already carries — every `<harmony>` of *St. Louis Blues* read from the `.mxl` by bar: 1 E, 2 A7, 3 E then B7, 4 E, 5 A7, 6 —, 7 E then B7, 8 E, 9 B7, 10 —, 11 E (plus an E/G), 12 B7, and **bar 13 begins E minor-seventh**, a different section. So a twelve-bar opening over I, IV and V is on the page and the piece changes at 13. Bars 3 and 7 carrying both I and V is not the textbook shape, which is why "reading the form from symbols" stays a musician's call and is left marked as one. Nothing has been heard.
  - Row: `lessonClaimsAboutMusic.test.ts` › "blues.3: St. Louis Blues' first twelve bars use only I, IV and V and bar 13 leaves them" — reads the harmony sequence of the built score.
- [x] **WRONG-COUNT** `content/lessons/blues.3.md:50` — "**Tools for this rung.** Three."
  - Is: the rung has two tool buttons, lab (`blues-shuffle`) and Simon (`drill.ear.simon-blues-c`). *Rhythm only* is a score-screen menu row available on any piece, not one of this rung's tools. The description of it is correct.
  - Evidence: stage-3.json `blues.3.tools`; `ScoreScreen.ts:895-915`.
  - Fixed: now "Two, and a score-screen row", with *Rhythm only* placed "in the ⋯ menu" — `blues.3.tools` is lab + simon; *Rhythm only* is a score-screen menu row (`ScoreScreen.ts:895-915`).
  - Second read (2026-09-22): HOLDS — rung blues.3's `tools` are exactly `[{lab, preset: blues-shuffle}, {simon, item: drill.ear.simon-blues-c}]`: two entries, so two buttons. *Rhythm only* is a row in the score screen's `⋯` sheet, gated on `mode === 'tempo' && !blind && !performanceRun` and available on any piece, so it is not one of this rung's tools and the lesson no longer counts it as one.
  - Row: `lessonClaimsAboutApp.test.ts` › "blues.3: the rung carries two tool buttons, the lab and Simon, and Rhythm only is not one of them" — reads the authored rung's `tools`.

Not checked in this lesson: whether the flat third "argues" with the chord (sound).

## theory.3 — `content/lessons/theory.3.md`

Claims checked: 20. Findings: 2.

- [x] **STALE** `content/lessons/theory.3.md:39` — "the progression drill arrives on the Stage 5 rung of this track"
  - Is: the next rung, `theory.4` (Stage 4), already has an ear-progression drill: `drill.ear.cadences` (kind `ear-progression`: authentic, half, plagal, deceptive), which is I/IV/V heard in context. `theory.5` adds `drill.ear.progressions` (I–vi–IV–V, ii–V–I).
  - Evidence: stage-4.json `theory.4.exerciseOptions`; catalog `drill.ear.cadences.drill`; stage-5.json `theory.5`.
  - Fixed: now "the cadence drill arrives on the next rung of this track, at Stage 4" — `theory.4` (stage-4.json) offers `drill.ear.cadences` (kind `ear-progression`); `theory.5` adds `drill.ear.progressions`.
  - Second read (2026-09-22): HOLDS — `theory.4`'s four options include `drill.ear.cadences`, whose `drill` is `{kind: 'ear-progression', params: {cadences: ['authentic','half','plagal','deceptive']}}`, and `theory.4` sits in a Stage 4 unit. `theory.5`'s options add `drill.ear.progressions` (`progressions: ['I-vi-IV-V','ii-V-I']`), which is the Stage 5 item the old sentence was pointing at. Both the rung and the stage in the corrected sentence are read off the stage files rather than inferred from the id.
  - Row: `lessonClaimsAboutApp.test.ts` › "theory.3: the cadence ear drill first appears on the next theory rung, at Stage 4" — walks the theory track in stage order.
- [x] **FALSE** `content/lessons/theory.3.md:58` — "and a chain of five notes played back in Simon"
  - Is: a chain of five is Simon's *pass* (`SIMON_PASS_CHAIN = 5`). Only a chain of eight counts towards mastery (`SIMON_MASTER_CHAIN = 8`, `simonOutcome().masterEligible`).
  - Evidence: `app/src/engine/drills/simon.ts:100-103, 295-300`.
  - Fixed: "a chain of five notes" → "a chain of eight notes" — `SIMON_MASTER_CHAIN = 8` is the chain that counts towards mastery; five is only the pass (`simon.ts:100-103, 295-300`).
  - Second read (2026-09-22): HOLDS — `simon.ts:100` `SIMON_PASS_CHAIN = 5` and `:103` `SIMON_MASTER_CHAIN = 8`, and `simonOutcome` (`:297-298`) sets `passed: longestChain >= SIMON_PASS_CHAIN` and `masterEligible: longestChain >= SIMON_MASTER_CHAIN`. The lesson's line is a "how you'll know you've got it", i.e. the mastery bar, so eight is the right number and five was the wrong one.
  - Row: `lessonClaimsAboutApp.test.ts` › "theory.3: a Simon chain of eight is what counts as having got it, five is only the pass" — reads both constants from `engine/drills/simon`.

Checked and true: twelve intervals listed; the five song mnemonics; key-signature rules; rhythm dictation is two bars (catalog `bars: 2`); Simon on this rung is `drill.ear.simon-c-major` (C4–C5, white keys, `help: show-keys`), and show-keys lights and names keys and puts them on the staff where there is room (`simon.ts:150-165`); the interval drill covers all twelve (catalog `intervals`).

Not checked in this lesson: nothing.

## improv.3 — `content/lessons/improv.3.md`

Claims checked: 14. Findings: 1.

- [x] **FALSE** `content/lessons/improv.3.md:46` — "The loop you play over is the accompaniment lab's *Jam it*: four bars of C, two of F, two of G"
  - Is: the loop is the rung's drill `drill.improv.loop-i-iv-v` (a backing-track drill on the drill screen: C C C C F F G G at 72 bpm, `scored: false`, with *Listen back*). The rung has no lab tool. The lab's I–IV–V–I is one chord per bar (I IV V I); 4+2+2 is only possible by typing `I I I I IV IV V V` into the numerals field under *Free*.
  - Evidence: catalog `drill.improv.loop-i-iv-v.drill.params`; stage-3.json `improv.3` has no `tools`; `LAB_PROGRESSIONS` `i-iv-v-i`.
  - Fixed: now "the rung's loop drill, on the drill screen: four bars of C, two of F, two of G, at 72 bpm" — catalog `drill.improv.loop-i-iv-v` params C C C C F F G G, bpm 72, scored false; `improv.3` has no `tools`. Dropped "at whatever tempo you set" and "the bar you are in lit", which I did not check the drill screen doing (its loop card shows the bar count, `DrillScreen.ts:1255-1261`).
  - Second read (2026-09-22): HOLDS — `drill.improv.loop-i-iv-v`'s `drill` is `{kind: 'backing-track', params: {progression: ['C','C','C','C','F','F','G','G'], bpm: 72, scored: false}}`, which is four bars of C, two of F and two of G at 72, and it is in rung improv.3's `exerciseOptions`. Rung improv.3's `tools` is `null` — no lab button on this rung at all — so "the accompaniment lab's *Jam it*" could not have been what the learner plays over.
  - Row: `lessonClaimsAboutApp.test.ts` › "improv.3: the loop is this rung's own backing-track drill, four bars of C then two each of F and G at 72" — reads the catalog row and the rung's empty `tools`.

Checked and true: *Listen back* exists and the recording is not persisted (`DrillScreen.ts:262, 2097`).

Not checked in this lesson: nothing.

## hymns — `content/lessons/hymns.md`

Claims checked: 20. Findings: 2.

- [x] **FALSE** `content/lessons/hymns.md:55` — "Switch *Duet* on with the left hand chosen and soprano and alto arrive over the tenor and bass you are playing"
  - Is: this rung's Duet button opens the first playable song, `song.folk.when-the-saints.f`. That is a melody over block triads, not four voices, so there is no soprano and alto to hear. The described effect needs *Amazing Grace (four parts)*, opened from its own row.
  - Evidence: stage-3.json `hymns.songOptions[0]`; `LessonScreen.ts:404-449`; dump_score of Saints F (RH melody, LH `F3+A3+C4` whole notes) and of `amazing-grace-satb` (RH v1/v2, LH v1/v2).
  - Fixed: the paragraph now says to open *Amazing Grace* in four parts from its own row, because *Play it as a duet* opens *When the Saints*, which has no inner voices — `scorePiece` takes the first playable song (`LessonScreen.ts:403-449`); `hymns.songOptions[0]` is `when-the-saints.f`.
  - Second read (2026-09-22): HOLDS — `scorePiece` (`LessonScreen.ts:436-445`) still returns `rung.songOptions.find(playable && type === 'song')`, and rung hymns' first option is `song.folk.when-the-saints.f`. The voices were counted from the `.mxl` rather than assumed: *When the Saints* has notes in two (staff, voice) pairs — (1,1) melody and (2,2) chords — so there is no inner part for Duet to hand back, while `amazing-grace-satb` has **four** — (1,1), (1,2), (2,1), (2,2) — which is the soprano/alto over tenor/bass the paragraph describes. The corrected paragraph sends the learner to the right row.
  - Row: `lessonClaimsAboutMusic.test.ts` › "hymns: Amazing Grace (four parts) really carries four voices and When the Saints in F carries two" — counts the distinct staff-and-voice pairs in each built score.
- [x] **FALSE** `content/lessons/hymns.md:46` — "and under *Hymns & gospel* in the Library"
  - Is: the Library's Track filter lists raw track ids, so the option reads `hymns-gospel`. The three pieces are tagged with it, so the filter works.
  - Evidence: `LibraryScreen.ts:1072-1075` (`text: track`); catalog `tracks` of the three Stage 2 pieces include `hymns-gospel`.
  - Fixed: now "the Library's track filter for hymns and gospel lists them too" — the filter shows raw track ids (`LibraryScreen.ts:1072-1075`), but `lessonShape.test.ts` forbids a hyphenated track slug in lesson prose, so the sentence names the filter by what it does rather than by its label. Giving the filter human labels is the owner's call.
  - Second read (2026-09-22): HOLDS — `LibraryScreen.ts:1074-1075` still builds the track select as `el('option', { value: track, text: track })`, so the option's text **is** the raw id and there is no label table between them; the lesson therefore cannot quote the label without quoting `hymns-gospel`, which `lessonShape.test.ts` refuses. Describing the filter by what it selects is the only true form available, and the three Stage 2 pieces do carry the track, so the filter does find them.
  - Row: `lessonClaimsAboutApp.test.ts` › "hymns: the Library's track filter prints the raw track id, so a lesson cannot quote its label" — reads the option-building line and the three pieces' `tracks`.

Checked and true: *Be Thou My Vision*, *Joyful, Joyful* and *Swing Low* are on `hymns.2` (Stage 2). Every named hymn is in `hymns.songOptions`. *Amazing Grace (four parts)* is S/A on the treble staff and T/B on the bass. Voicing is a concept at Stage 4 (`classical.4.shelf`) and at Stage 6 (`classical.6`, `voicing-melody`).

Not checked in this lesson: nothing.

## rock.overview — `content/lessons/rock.overview.md`

Claims checked: 18. Findings: 1.

- [x] **FALSE** `content/lessons/rock.overview.md:40` — "The easy *Canon in D* is above this rung"
  - Is: the item's level is 5.1, which is the top of this rung's `levelBand` [2.5, 5.1]. It is inside the band, not above it, and it is also offered on 3.5 and 3.6.
  - Evidence: catalog level 5.1; stage-3.json `rock.overview.levelBand`.
  - Fixed: "is above this rung" → "is the hardest of the four" — catalog level 5.1, inside the rung's `levelBand` [2.5, 5.1]; the other three are 3.3, 2.79 and 2.5 (catalog level used as the measure of difficulty).
  - Second read (2026-09-22): HOLDS, on a stated proxy — the four levels re-read: Canon 5.1, Greensleeves (with chords) 3.3, Scarborough Fair 2.79, Ode to Joy (full) 2.5, and the rung's `levelBand` is `[2.5, 5.1]`, so 5.1 is the top of the band and not above it. "The hardest of the four" is true **of the catalog `level` field**, which is a proxy for difficulty and not a reading of the music; the sample recorded the same reservation and it still stands. Nothing has been heard.
  - Row: `lessonClaimsAboutMusic.test.ts` › "rock.overview: the easy Canon in D is the highest-levelled of the rung's four and sits inside its band".

Checked and true: four songs. *Ode to Joy (full)* has held roots under C and G. *Greensleeves (with chords)* has full LH triads. *Scarborough Fair* is one staff with symbols, ends on E, and has C♯5 over an `[A major]` symbol in bar 7. The later rock rungs exist at the stated stages (rock.4 power chord, rock.5 sus2/sus4/add9, rock.6 with `beethoven-moonlight-i`, rock.7 with Grieg's *Mountain King*). `minor-vamp` is held roots plus chord tones over Am G F G. The Duet button opens the Canon (first playable song).

Not checked in this lesson: "a sound rock uses often" (Dorian) — judgement, not listed.

## latin.3 — `content/lessons/latin.3.md`

Claims checked: 14. Findings: 3.

- [x] **FALSE** `content/lessons/latin.3.md:39` — "*Play it as a duet* lets the app take one hand while you hold the other, which is the easiest way into the two-part clave"
  - Is: the button opens the first playable song, *Cielito Lindo*: one staff, 3/4, no clave. Its Duet row is hidden because the piece has no second hand. All three rung songs are single-staff. The two-part clave is an exercise (`exercise.clave.son-3-2.pulse`), which the button never opens.
  - Evidence: `LessonScreen.ts:404-449`; `ScoreScreen.ts:2327-2332`; dump_score `staves: 1` for all three songs, `staves: 2` for the pulse exercise.
  - Fixed: the paragraph now says the button opens *Cielito Lindo*, one staff, so there is no second hand, and points to the pulse exercise from its own row with *Duet* playing the pulse — `ScoreScreen.ts:2327-2332` hides the Duet row when there is no other hand; dump_score: all three songs `staves 1`, the pulse exercise `staves 2` with the pulse on staff 2, which `extractScoreModel.ts:301` reads as the left hand.
  - Second read (2026-09-22): HOLDS — rung latin.3's first (and only playable-song-first) option is `song.folk.exercise-cielito-lindo.pdmx`, measured `staves: 1`; the other two songs are one staff as well, so *whichever* the button chose there would be no second hand. `exercise.clave.son-3-2.pulse` was re-read at the `.mxl`: it carries notes on staff 1 **and** staff 2, with two `<sign>percussion</sign>` clefs, so the pulse really is a second part Duet can play.
  - Row: `lessonClaimsAboutMusic.test.ts` › "latin.3: all three of the rung's songs are one staff, and the clave-over-a-pulse exercise is two".
- [x] **FALSE** `content/lessons/latin.3.md:18` — "The exercises here are written on a single line with nothing to read but the rhythm"
  - Is: true of the four clave exercises (one-line percussion staff). Not true of `exercise.tresillo.c`, which is pitched on two five-line staves (C major chord in the RH, C3 tresillo in the LH).
  - Evidence: `.mxl` regex: `<staff-lines>1</staff-lines>` and `<sign>percussion</sign>` in the clave files; dump_score of `exercise.tresillo.c`.
  - Fixed: "The exercises here" → "The clave exercises here" — the tresillo exercise is pitched on two five-line staves (dump_score `exercise.tresillo.c`).
  - Second read (2026-09-22): HOLDS, and the narrowed plural is now enumerated — all five of the rung's `exerciseOptions` opened at the `.mxl`. The four clave items (`son-2-3`, `rumba-3-2`, `bossa`, `son-3-2.pulse`) each declare `<staff-lines>1</staff-lines>` with a `<sign>percussion</sign>` clef; `exercise.tresillo.c` declares neither and has pitched notes on two staves. So "the clave exercises here" is true of exactly the four the word now covers.
  - Row: `lessonClaimsAboutMusic.test.ts` › "latin.3: the four clave exercises are one-line percussion staves and the tresillo is not" — reads `<staff-lines>` and the clef sign out of each built score.
- [ ] **JUDGEMENT** `content/lessons/latin.3.md:35` — "*Só Danço Samba* is ... a gentler rhythm than its name suggests — the syncopation goes quiet and the chords do the work"
  - Is: a claim about sound. The melody is syncopated in the notes (bars 8, 12, 26: eighth-note anticipations), so "goes quiet" is disputable.
  - Evidence: dump_score bars 8–13.
  - Reader 1: REWRITE — "*Só Danço Samba* is the first bossa on this track: the tune sits on long notes and the chords carry the movement." What has to go is "a gentler rhythm than its name suggests" and "the syncopation goes quiet", both of which are claims about how it sounds, and nothing here has been heard; the notes the finding cites are syncopated on the page, so the two would be arguing. The rewrite keeps the same orientation — chords doing the work — without asserting a sound.

Checked and true: son 2-3, rumba 3-2 and son 3-2 place the strokes correctly (bar positions computed from the dump); the tresillo exercise is 3+3+2; *Cielito Lindo* is in 3/4 and *Guantanamera* in 4/4.

Not checked in this lesson: `song.folk.so-danco-samba.pdmx` bars 1–7 are written as repeated B4 quarters (slash-style vamp) and bar 10 appears to hold six beats in 4/4. That is a file fault, not a lesson claim; noted for whoever checks that score.

## holiday.3 — `content/lessons/holiday.3.md`

Claims checked: 13. Findings: 1.

- [ ] **JUDGEMENT** `content/lessons/holiday.3.md:14` — "Untrained voices mostly live between about A below middle C and D above it"
  - Is: a factual-sounding range claim (A3–D5); a musician should confirm.
  - Evidence: none in repository.
  - Reader 1: KEEP — plain teaching advice, not a claim. It is already hedged twice ("mostly", "about"), it is there to tell the learner which key to choose rather than to state a fact about voices, and the paragraph's usefulness does not depend on the exact notes. A musician may want to move the boundaries; nothing downstream reads them, and no test can.

Checked and true: the Stage 2 `holiday` rung exists. The three cadence exercises are I–IV–V7–I in C, G and F, root position. Four songs, all with chord symbols. *Jingle Bells* is in G with block chords. *Joy to the World* and *First Noel* are one-staff lead sheets in D. *Hark!* has the most symbols (45, against 24, 19 and 11). Free play names the held chord (`FreePlayScreen.ts:14`).

Not checked in this lesson: nothing.

## 4.1 — `content/lessons/4.1.md`

Claims checked: 15. Findings: 1.

- [x] **UNOFFERED** `content/lessons/4.1.md:35` — "Each key: contrary motion one octave, then similar motion one octave, then two"
  - Is: the rung has similar-motion two-octave scales in C, G, D and A, and contrary motion only in C (one and two octaves). It has no one-octave similar-motion scale in any key and no contrary-motion scale in G, D or A. The same gap undercuts line 31 ("Learn each scale in contrary motion first").
  - Evidence: stage-4.json `4.1.exerciseOptions`.
  - Fixed: added "The rung has all four keys in similar motion over two octaves and C in contrary motion; the rest are under Exercises in the Library." — stage-4.json `4.1.exerciseOptions`; the catalog has `exercise.scale.{c,g,d,a}-major.{1oct,2oct}.contrary.both.2` and `.1oct.similar.both.2`, and the Library has an Exercises filter (`LibraryScreen.ts:455`).
  - Second read (2026-09-22): HOLDS — rung 4.1's six `exerciseOptions` listed in full: `c/g/d/a-major.2oct.similar.both.2` and `c-major.{1oct,2oct}.contrary.both.2`. That is four keys similar over two octaves and C alone in contrary, exactly as the added sentence says, and there is still no one-octave similar-motion scale on the rung. The catalog carries 36 `contrary` scale ids including `g-major`, `d-major` and `a-major` at both lengths, so the pointer to the Library is not a promise of something absent.
  - Row: `lessonClaimsAboutApp.test.ts` › "4.1: four keys similar over two octaves, C alone in contrary, and the missing ones exist in the catalog".

Checked and true: fingerings for C/G/D/A; the scales are in eighth notes; contrary motion starts both thumbs on C4; *Für Elise (easy)* and *Ode to Joy (easy variation)* are catalog grade 1 and on the rung.

Not checked in this lesson: nothing.

## 4.2 — `content/lessons/4.2.md`

Claims checked: 15. Findings: 2.

- [x] **UNOFFERED** `content/lessons/4.2.md:40` — "contrary motion first as before"
  - Is: the only contrary-motion exercise on the rung is A harmonic minor. There is none for F, B♭ or E♭ major, or for the other five minor forms.
  - Evidence: stage-4.json `4.2.exerciseOptions`.
  - Fixed: added "the rung has it for A harmonic minor, and the three major keys and the other harmonic minors have it under Exercises in the Library" — the catalog has contrary scales for F, B♭ and E♭ major and A, D and E harmonic minor; two searches for a melodic-minor contrary id (a regex over all `both` scale ids, and a grep of the catalog) returned none, so the sentence does not promise one.
  - Second read (2026-09-22): HOLDS — rung 4.2's ten options hold exactly one `contrary` id, `exercise.scale.a-harmonic-minor.1oct.contrary.both.2`. Every `contrary` scale in the catalog was then listed — 36 of them — and enumerated rather than sampled: `f-major`, `b-flat-major` and `e-flat-major` are all there, as are `a-`, `d-` and `e-harmonic-minor`, and **not one id in the 36 contains `melodic`**. So the sentence promises exactly what exists and stops short of the melodic minors, which is the right stopping place.
  - Row: `lessonClaimsAboutApp.test.ts` › "4.2: one contrary scale on the rung, the rest in the catalog, and no contrary melodic minor anywhere".
- [ ] **JUDGEMENT** `content/lessons/4.2.md:32` — "It exists because singers found that step-and-a-half unsingable"
  - Is: a historical rationale for melodic minor; widely taught, and a musician should confirm the wording.
  - Evidence: none in repository.
  - Reader 1: REWRITE — "It exists to smooth that step-and-a-half, which is awkward to sing and to hear as a melody." The teaching is the awkwardness of the augmented second and what the melodic minor does about it; "because singers found" is a causal history of the scale's origin, which nothing in the repository sources and which is a stronger claim than the paragraph needs.

Checked and true: all six minor scales named are on the rung. The melodic minor exercise descends natural (D: C5 B♭4 on the way down). *Bella Ciao* (starts in E minor) and *Für Elise (beginner)* (A minor) are catalog grade 1.

Not checked in this lesson: *Bella Ciao* changes key signature twice (E minor → four flats → three sharps). The lesson does not say otherwise.

## 4.3 — `content/lessons/4.3.md`

Claims checked: 17. Findings: 3.

- [x] **FALSE** `content/lessons/4.3.md:41` — "Then a piece that uses broken chords throughout — the easy *Canon in D*"
  - Is: the Canon's left hand is broken chords only in bars 1–12. From bar 13 on it plays half-note bass pairs (D3 A2, B2 F♯2 …). *Greensleeves* (plain) does keep broken triads almost throughout.
  - Evidence: dump_score `song.classical.pachelbel-canon-d.easy` bars 1–34; `song.folk.greensleeves` LH histogram.
  - Fixed: now "a piece that uses broken chords — *Greensleeves*, or the easy *Canon in D*, whose left hand breaks its chords for the first twelve bars" — dump_score of the Canon: broken eighths bars 1–12, half-note pairs from bar 13.
  - Second read (2026-09-22): HOLDS, with the boundary read exactly — the Canon's staff-2 notes taken bar by bar out of the `.mxl`: bars 1–12 are eight eighths each, rising through the chord (bar 1 D3 F♯3 A3 D4 then A2 C♯3 E3 A3), and bar **13** is the first bar of half notes (D3, A2), which is where the figure stops. Twelve is the right number and not an approximation. *Greensleeves* is on the rung too and does keep its broken triads, which is what makes the "or" honest.
  - Row: `lessonClaimsAboutMusic.test.ts` › "4.3: the easy Canon in D breaks its chords in eighths for twelve bars and then stops" — reads the left-hand note values per bar of the built score.
- [x] **FALSE** `content/lessons/4.3.md:48` — "Thirty symbols at three seconds each leaves no room to work one out"
  - Is: the inversion drill runs 10 cards (`drillFromCatalog` default `count = 10`). I found no per-card time limit. `30-inversions-3s-each` is only the rung's `mastery.custom` string, which the app uses only to refuse paper passes and never measures.
  - Evidence: `fromCatalog.ts:177`; `curriculum/selectors.ts:83-86`; grep for `3000|timeLimit|deadline|secondsPer` and then `second|timeout|FAST_MS` in `DrillScreen.ts`/`PromptDrill.ts` found no card timer.
  - Fixed: now "The drill deals ten symbols a run, and the aim is to know each at a glance rather than work it out" — `drillFromCatalog` default `count = 10` (`fromCatalog.ts:177`) and neither caller passes a count (`DrillScreen.ts:2304, 2997`); a second search, `timeLimit|deadline|limitMs|secondsPer|timeoutMs|expire` over `engine/drills` and `DrillScreen.ts`, returned nothing. The closing line's "thirty … within three seconds" is left as a self-check; the app does not measure it.
  - Second read (2026-09-22): HOLDS — `fromCatalog.ts:178` is still `const count = options.count ?? 10`, `drill.chord.inversions` carries no `count` (its params are `qualities` and `positions` only), and the two callers in `DrillScreen.ts` (now `:2447` and `:3150`) pass a seed or nothing, never a count. Two searches for a per-card clock: `grep -rn "timeLimit|deadline|limitMs|secondsPer|timeoutMs|expire" src/engine/drills/ src/ui/screens/DrillScreen.ts` exits 1, and reading `PromptDrill` end to end shows its only clock use is `settle`'s reaction time, recorded after the answer. So ten cards, untimed.
  - Row: `lessonClaimsAboutApp.test.ts` › "4.3: the inversion drill deals ten cards and nothing times them" — counts the prompts the real row produces.
- [ ] **THEORY** `content/lessons/4.3.md:34` — "Right hand **1-2-3-5**, left hand **5-3-2-1**, with the thumb passing under between groups"
  - Is: over two octaves the right hand is 1-2-3-1-2-3-5 (as the app prints). With 1-2-3-5 there is no thumb pass. The LH 5-3-2-1 matches the app's printed fingering; a musician may prefer 5-4-2-1 for C major. Worth a musician's eye.
  - Evidence: `<fingering>` in `exercise.arpeggio.c-major.2oct.right` = 1 2 3 1 2 3 5 …; `.left` = 5 3 2 5 3 2 1 ….
  - Reader 1: WRONG (over two octaves it is 1-2-3, 1-2-3, 5 in the right hand and 5-3-2, 5-3-2, 1 in the left, which is what the rung's own exercises print) — re-read from the `.mxl`: `exercise.arpeggio.c-major.2oct.right` is `C4(1) E4(2) G4(3) C5(1) E5(2) G5(3) C6(5)` and back down `G5(3) E5(2) C5(1) G4(3) E4(2) C4(1)`; `.left` is `C2(5) E2(3) G2(2) C3(5) E3(3) G3(2) C4(1)`. The sentence's own next clause, "with the thumb passing under between groups", is only possible if the group is three notes — with a group of 1-2-3-5 there is nothing for the thumb to pass under, so the sentence contradicts itself as well as the score. The smallest true change is to write the group rather than the octave: "Right hand **1-2-3** repeating, with **5** on the top note; left hand **5-3-2** repeating, with the thumb on the top."

Checked and true: *Show me* lights the keys and engraves the chord, and the card does not count (`DrillScreen.ts:1741, 1856`). The drill shows slash labels like `F/A` (`factories.ts:136-156`). All six arpeggio keys are offered for each hand.

Not checked in this lesson: nothing.

## 4.4 — `content/lessons/4.4.md`

Claims checked: 15. Findings: 2.

- [ ] **THEORY** `content/lessons/4.4.md:12` — "Charles-Louis Hanon's exercises are sixty patterns, each an eight-note cell that climbs the keyboard"
  - Is: I believe this is wrong for most of the book. Nos. 1–20 are climbing cells. Nos. 21–60 are scales, arpeggios, repeated notes, trills, octaves and similar. A musician should confirm.
  - Evidence: general knowledge of *The Virtuoso Pianist*; the catalog holds only Nos. 1–20.
  - Reader 1: WRONG (sixty exercises, but the eight-note climbing cell is the shape of the first twenty only) — *The Virtuoso Pianist* is in three parts: Nos. 1–20 are the preparatory patterns, each a cell repeated up the keyboard and back, and Nos. 21–60 are scales, arpeggios, repeated notes, trills, thirds, octaves and wrist studies, which are not eight-note cells and in several cases are not sequences at all. The repository agrees as far as it goes: every `exercise.hanon.*` id in the catalog is in the range 01–20, so nothing here contradicts the first half and nothing here supports the second. Smallest true change: "sixty exercises, the first twenty of them an eight-note cell that climbs the keyboard — and those twenty are the ones here."
- [x] **UNOFFERED** `content/lessons/4.4.md:40` — "Hanon 1 to 10 from the generator"
  - Is: the rung offers Nos. 1–5 (hands together). Nos. 6–10 exist in the catalog (`exercise.hanon.06–10.*`) but are not on this rung, and the lesson does not point to the Library.
  - Evidence: stage-4.json `4.4.exerciseOptions`; catalog ids `exercise.hanon.01`–`20`.
  - Fixed: now "Hanon 1 to 5 from the generator … 6 to 10 are under Exercises in the Library" — `4.4.exerciseOptions` is Nos. 1–5 `both`; the catalog has `exercise.hanon.06`–`10` in both/left/right.
  - Second read (2026-09-22): HOLDS — rung 4.4's `exerciseOptions` are exactly `exercise.hanon.01.both` … `.05.both`, five items and nothing else. The catalog carries `exercise.hanon.06`, `.07`, `.08`, `.09` and `.10` in `both`, `left` and `right`, so all five of the ones the sentence sends to the Library are really there — enumerated, not inferred from the range.
  - Row: `lessonClaimsAboutApp.test.ts` › "4.4: Hanon 1–5 are on the rung and 6–10 exist in the catalog for the Library to find".

Checked and true: the exercises are in C (fifths 0), hands together, and Hanon No. 1's cell is C E F G A G F E. *Blind* is a score-screen menu row that hides only the notation (`ScoreScreen.ts:1100`).

Not checked in this lesson: nothing.

## 4.5 — `content/lessons/4.5.md`

Claims checked: 15. Findings: 5.

- [x] **STALE** `content/lessons/4.5.md:12` — "Every time signature so far has divided the beat in two."
  - Is: compound time came earlier: `song.folk.alouette.pdmx` (6/8) on 2.2, `exercise.rhythm.six-eight-long-short.4bar` on 2.4, *Silent Night* and *We Three Kings* (6/8) on the Stage 2 holiday rung, and *Für Elise (beginner)* (3/8) on 3.4.
  - Evidence: `notation.times` of every song/exercise on stages 0–3 rungs.
  - Fixed: now "Nearly every time signature so far has divided the beat in two; *Alouette* and *Silent Night* were 6/8 in passing." — `notation.times` over stage 0–3 rungs: 6/8 on 2.2 (Alouette), 2.4 (long-short exercise) and holiday (Silent Night, We Three Kings); 3/8 on 3.4 (Für Elise beginner).
  - Second read (2026-09-22): HOLDS — every option of every rung in stages 0–3 was filtered on its measured `notation.times` for an eighth-note denominator, and five items come back: `song.folk.alouette.pdmx` (2.2, 6/8), `exercise.rhythm.six-eight-long-short.4bar` (2.4, 6/8), *Silent Night* and *We Three Kings* (holiday, 6/8) and `song.classical.beethoven-fur-elise.beginner` (3.4, 3/8). Five of several hundred, so "nearly every … in passing" is the right weight and "every" was not. The two the sentence names are the two the learner is likeliest to have played.
  - Row: `lessonClaimsAboutMusic.test.ts` › "4.5: compound time appears before this rung, in Alouette and Silent Night among others" — scans the stage 0–3 rungs' options for an eighth-denominator metre.
- [x] **FALSE** `content/lessons/4.5.md:19` — "*Row Row Row Your Boat* and *Greensleeves in 6/8* are both classic examples — long-short, long-short."
  - Is: *Row Row* is (bars 2–3, 7: quarter–eighth). *Greensleeves in 6/8* keeps the 3/4 tune rhythm over a 6/8 bass. Bars 1, 3, 5, 7, 8, 9, 11 are a half then a quarter, which cuts across the second dotted-quarter beat — not long-short.
  - Evidence: dump_score `song.folk.greensleeves.68` bars 1–15 and `song.folk.row-row-row-your-boat` bars 1–8.
  - Fixed: now "*Row Row Row Your Boat* is the classic example — long-short, long-short. In *Greensleeves in 6/8* the two beats are in the left hand, and the tune often holds across the second." — dump_score: Row Row bars 2–3, 7 quarter–eighth; Greensleeves 6/8 LH two dotted quarters a bar, RH half + quarter in bars 1, 3, 5, 7, 8.
  - Second read (2026-09-22): HOLDS, and the Greensleeves half was re-read with chord members filtered out, which the dump does not do — every bar of `greensleeves.68`'s staff 2 is **two** dotted quarters (each a chord: bar 1 A2 and C3, bar 3 G2 and B2), so "the two beats are in the left hand" is literally the left hand's rhythm, and the earlier reading of three per bar was the chord notes being counted. Staff 1 is `half + quarter` in bars 1, 3, 5, 7, 8, 9 and 11 — seven of the fifteen full bars — and a half note in 6/8 spans eighths 1–4, so it crosses the second dotted-quarter beat: "often holds across the second" is right. *Row Row* is 6/8 with quarter–eighth in bars 2, 3 and 7, which is long-short.
  - Row: `lessonClaimsAboutMusic.test.ts` › "4.5: Greensleeves in 6/8 has two dotted-quarter beats in the left hand and a tune that crosses the second in about half its bars" — reads the built scores with chord members excluded.
- [x] **FALSE** `content/lessons/4.5.md:29` — "This is where the blues track begins."
  - Is: the blues track starts at Stage 3 (`blues.3`, prerequisite 3.2, shuffle exercise included). `blues.4` also requires only 3.2. Neither depends on 4.5.
  - Evidence: stage-3.json `blues.3`; stage-4.json `blues.4.prerequisites`; `00-tracks.json` `blues-boogie.startsAtStage: 3`.
  - Fixed: "This is where the blues track begins." → "The blues track has used it since Stage 3." — `blues.3` (stage-3.json) offers `exercise.rhythm.shuffle-eighths.4bar`.
  - Second read (2026-09-22): HOLDS — `content/curriculum/00-tracks.json` gives the track `blues-boogie` `startsAtStage: 3`, rung `blues.3` lives in a Stage 3 unit, its `prerequisites` are `['3.2']` — nothing on Stage 4 — and it offers `exercise.rhythm.shuffle-eighths.4bar`. So the track does begin at Stage 3 and does use the shuffle there, which is what the corrected sentence claims and the reverse of what the old one did.
  - Row: `lessonClaimsAboutApp.test.ts` › "4.5: the blues track starts at Stage 3 and its first rung already carries the shuffle" — reads the track file and the authored rung.
- [x] **FALSE** `content/lessons/4.5.md:45` — "*Rhythm only* measures each strike against the two dotted-quarter beats"
  - Is: Rhythm only times each tap against the written note it stands for ("One tap per written note or chord"), not against the beats.
  - Evidence: `ScoreScreen.ts:908-913` (the row's own description).
  - Fixed: now "*Rhythm only* times one tap per written note, on any key" — the row's own description, "One tap per written note or chord" (`ScoreScreen.ts:908-913`). `readingTime` 2 → 3 (424 words after the pass).
  - Second read (2026-09-22): HOLDS — the row's own text, now at `ScoreScreen.ts:939`, still reads "Tap the rhythm on any key. Early and late are marked as usual; the notes are not… **One tap per written note or chord**; extra keys are wrong." The unit of judgement is the written note, not the beat, which is what the corrected sentence says. `readingTime` re-counted independently: 424 words → 3, which is what the front matter declares.
  - Row: `lessonClaimsAboutApp.test.ts` › "4.5: Rhythm only judges one tap per written note or chord, on any key" — reads the row's own sentence out of `ScoreScreen`.
- [ ] **THEORY** `content/lessons/4.5.md:28` — "Nothing on the page says so except the word "swing" or "shuffle" at the top."
  - Is: swing is also commonly notated with a metric equivalence (two eighths = quarter + eighth under a triplet bracket). Right in spirit, incomplete; worth a musician's eye.
  - Evidence: none in repository.
  - Reader 1: WRONG as an absolute about notation, and right about this app — a metric equivalence at the head of a piece (a pair of eighths, an equals sign, and a quarter-plus-eighth under a triplet bracket) is a common way to write the instruction, and it is a mark rather than a word. What makes the distinction matter here is that **the app's own detector only looks for the words**: `tools/content/notation.py:124` computes `"swungMark": "swing" in words or "shuffle" in words` over the file's `<words>` elements, so a score that states the feel as an equivalence is invisible to it. Smallest true change: "Usually nothing on the page says so except the word 'swing' or 'shuffle' at the top — sometimes it is written as a pair of eighths equalling a triplet figure instead — and this app looks only for the word."

Checked and true: the 6/8 description; *Row Row* and *Greensleeves in 6/8* are both in 6/8 and on the rung; the rung offers 6/8 and syncopation rhythm reading and `drill.reading.sight-reading-3`.

Not checked in this lesson: the rung has no `tools`; the Tools paragraph describes score-screen rows, not buttons. Whether the syncopated exercise has "a tie over the beat": `exercise.rhythm.syncopated.4bar` has none (eighth, three quarters, eighth); the lesson does not say it does.

---
Batch 2: 19 of 19 lessons. 43 findings
(28 FALSE, 2 STALE, 1 WRONG-COUNT, 3 UNOFFERED, 3 THEORY, 5 JUDGEMENT, 1 UNVERIFIED).
Lessons not finished: none.

Fix pass: 34 fixed, 0 found wrong and not fixed, 9 left open (THEORY/JUDGEMENT/HISTORY/UNVERIFIED or needs a build). Lessons edited: 3.2, 3.3, 3.4, 3.6, classical.3, chords-pop.3, blues.3, theory.3, improv.3, hymns, rock.overview, latin.3, 4.1, 4.2, 4.3, 4.4, 4.5.
