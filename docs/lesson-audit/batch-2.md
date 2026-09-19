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
- [x] **FALSE** `content/lessons/3.2.md:44` — "The accompaniment lab under Library will build this rung in either key."
  - Is: the lab's `primary-chords` preset builds I–IV–V–I with a plain V triad (D in G, C in F), not the V7 this rung is about. Typing `I IV V7 I` in the lab's own numerals field would build it; the preset does not.
  - Evidence: `sightReading.ts` `LAB_PRESETS` `primary-chords` → `progressionId: 'i-iv-v-i'`; `LAB_PROGRESSIONS` `i-iv-v-i.major = ['I','IV','V','I']`.
  - Fixed: now "will build this rung's three chords in either key, with a plain V where this rung has V7" — `primary-chords` is `i-iv-v-i` = `['I','IV','V','I']` (`sightReading.ts:758-764`) and `romanToLabChord` spells a plain V as a triad. Whether the preset should play V7 is the owner's call.

Not checked in this lesson: "80 bpm" in the closing line (a practice target, not an app setting).

## 3.3 — `content/lessons/3.3.md`

Claims checked: 15. Findings: 3.

- [x] **FALSE** `content/lessons/3.3.md:33` — "every cadence turns to E7 with its G sharp"
  - Is: two of the four phrase endings land on G major, not E7: bars 3–4 and 11–12 (`[G major]`, melody D5–B4, G4–A4–B4). E7 arrives at bars 6–7 and 14 only.
  - Evidence: `dump_score.py song.folk.greensleeves.chords`, bars 3–4, 6–7, 11–12, 14.
  - Fixed: now "both cadences home to A come through E7 with its G sharp" — dump_score: bars 3–4 and 11–12 rest on G; bars 6–7→8 and 14→15 are E7→Am.
- [x] **FALSE** `content/lessons/3.3.md:36` — "A harmonic minor scale hands separately"
  - Is: the rung's scale exercise is hands together in similar motion (`exercise.scale.a-harmonic-minor.1oct.similar.both.2`, RH A4–A5 and LH A2–A3 in the same bars). No hands-separate A harmonic minor exercise is on the rung.
  - Evidence: stage-3.json `3.3.exerciseOptions`; dump_score of that exercise, bars 1–2.
  - Fixed: "hands separately" → "hands together" — the rung's only A harmonic minor scale is `…1oct.similar.both.2`, both hands in the same bars (dump_score bars 1–2).
- [x] **FALSE** `content/lessons/3.3.md:43` — "The lab takes numerals typed by hand, sevenths included, so `i iv V7 i` in A minor gives you these changes"
  - Is: this rung's lab button opens the `minor-vamp` preset, which locks key (A minor) and progression (i–♭VII–♭VI–♭VII = Am G F G); locked controls are disabled. The numerals field works only after tapping *Free* in the preset row. The claim is true of the free lab, not of the rung's tool.
  - Evidence: stage-3.json `3.3.tools = [{lab, preset: minor-vamp}, {play}]`; `LAB_PRESETS` `minor-vamp.locks = ['key','progression','leftHand']`; `LabScreen.ts:585-603` (`applyLocks` disables), `:683-697` (Free chip).
  - Fixed: the paragraph now says the lab button opens the minor vamp (Am, G, F, G) with key and chords fixed, and that typed numerals need *Free* then *Custom…* — `minor-vamp.locks = ['key','progression','leftHand']`; `applyLocks` disables the progression select (`LabScreen.ts:585-603`); the numerals row shows only when that select is `Custom…` (`LabScreen.ts:466-476`). Pointing the rung at an unlocked preset instead is the owner's call.

Not checked in this lesson: nothing.

## 3.4 — `content/lessons/3.4.md`

Claims checked: 14. Findings: 3.

- [x] **FALSE** `content/lessons/3.4.md:46` — "The daily read on *Today* moves up with you, and at this stage it is the two-hand phrase"
  - Is: at Stage 3 Today's read is `drill.reading.sight-reading-2-right` — level 2, right hand only. The two-hand level-2 item (`sight-reading-2`) has catalog level 3.4, so it becomes the daily read only at Stage 4.
  - Evidence: `TodayScreen.ts:379-385` (`dailyItemFor`: highest sight-reading item with `level <= stageNumber`); catalog: `-1` 1.5, `-1-left` 1.6, `-2-right` 2.2 (hands right), `-2` 3.4 (hands both).
  - Fixed: now "at this stage it is a right-hand phrase at level 2 … The two-hand phrase becomes the daily read at Stage 4" — `dailyItemFor` takes the highest sight-reading item with `level <= stageNumber` (`TodayScreen.ts:379-385`); catalog levels 2.2 (`-2-right`, hands right) and 3.4 (`-2`, both).
- [x] **FALSE** `content/lessons/3.4.md:47` — "over the wider range: the landmarks above"
  - Is: level-2 sight-reading writes the right hand in C4–C5 and the left in C3–G3 (MIDI 60–72, 48–55). High C (C6) and Low C (C2) never appear, and nothing goes above or below the staff except middle C.
  - Evidence: `sightReading.ts` `LEVELS[2]` `rhKey {60,72}`, `lhKey {48,55}`.
  - Fixed (same sentence): "over the wider range: the landmarks above" → "between middle C and the C above it" — `LEVELS[2].rhKey {60,72}` in `sightReading.ts`; the Stage 3 item is right hand only.
- [ ] **JUDGEMENT** `content/lessons/3.4.md:40` — "the first real piece in the plan"
  - Is: earlier rungs already offer composed pieces: Beethoven's *Ode to Joy* settings from 1.1, and Gruber's *Silent Night* (melody) on the Stage 2 holiday rung. Whether the Petzold is the first *real* one is a musician's call.
  - Evidence: `songOptions` of stages 0–3 filtered for `song.classical.*`, then catalog `composer` of each (*Ah! vous dirai-je* on 1.2 is `Traditional (French)`, so it is not counted).

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
- [x] **FALSE** `content/lessons/3.6.md:45` — "These three patterns are the ones the accompaniment lab writes"
  - Is: the lab's *Broken* is root–fifth–third–fifth in quarters (the Alberti order slowed down), not this lesson's root–third–fifth–third. The lab has no waltz bass (see next finding).
  - Evidence: `sightReading.ts` `ALBERTI_ORDER = [0, 2, 1, 2]` used by `labLeftBar` for both `alberti` and `broken`; `LabScreen.ts:71-78` `LEFT_HANDS`.
  - Fixed: the paragraph now says the lab writes the Alberti bass and that its *Broken* is the same order in quarters, not root–third–fifth–third — `labLeftBar` uses `ALBERTI_ORDER = [0, 2, 1, 2]` for both, eighths for `alberti`, quarters otherwise (`sightReading.ts:1102-1148`).
- [x] **FALSE** `content/lessons/3.6.md:47` — "pick the alberti or the waltz bass and *Read it*"
  - Is: the lab's left hands are None, Held roots, Block chords, Alberti, Broken, Walking. No waltz. The lab also writes only 4/4 (it passes no `timeSig`; the writer defaults to 4/4).
  - Evidence: `LabScreen.ts:71-78`; grep for `waltz|timeSig|3/4` in `LabScreen.ts` and for `waltz` in `sightReading.ts` returned nothing; `sightReading.ts:1304` default `{ beats: 4, beatType: 4 }`.
  - Fixed: now "It has no waltz bass and writes only 4/4 … pick Alberti and *Read it*" — `LEFT_HANDS` (`LabScreen.ts:71-78`) has no waltz; `timeSig|waltz` in `LabScreen.ts` counted 0 and `buildLabExercise` defaults to 4/4 (`sightReading.ts:1304`). The rung's only tool is `duet`, so the sentence now says the lab is under Library.

Not checked in this lesson: nothing. (The rung's only tool is `duet`; it opens `song.folk.greensleeves.waltz`, as the lesson implies.)

## classical.3 — `content/lessons/classical.3.md`

Claims checked: 22. Findings: 4.

- [x] **FALSE** `content/lessons/classical.3.md:42` — "Six options, all dances from the notebooks the Bach and Mozart children learned from"
  - Is: six is right, but only four are from the Anna Magdalena notebook (Anh. 114, 115, 132, 113). The K. 331 item is a sonata theme, not a dance and not from a notebook — and this file is a C major 3/4 arrangement (the original is A major 6/8). The Beethoven Écossaise WoO 23 is a dance but not from a notebook.
  - Evidence: stage-3.json `classical.3.songOptions` (6); catalog `composer` fields; dump_score of the K. 331 item (fifths 0, 3/4, 16 bars).
  - Fixed: now "Six options, four of them minuets from Anna Magdalena Bach's notebook … the theme of Mozart's K. 331, set here in C major in 3/4" — the four Anh. rows; dump_score of the K. 331 item: fifths 0, 3/4, bass C. The original's A major 6/8 is not added (history, not checked here).
- [x] **FALSE** `content/lessons/classical.3.md:46` — "Beethoven's *Écossaise* in G for a quick 2/4 with hand shifts"
  - Is: the bundled file is in F major (key signature one flat, ends on F) although its title says G major. It is also one staff, right hand only, so there is no left hand to play.
  - Evidence: `dump_score.py song.classical.beethoven-ludwig-van-beethoven-ecossaise.pdmx` — `fifths -1`, `staves 1`, bar 1 F4, bar 32 F5.
  - Fixed: now "Beethoven's *Écossaise*, titled in G but written here in F, for the right hand alone — a quick 2/4 with position shifts" — dump_score: `fifths -1`, `staves 1`, bar 1 F4, bar 32 F5. The file itself being wrong is the owner's separate decision (README, "Score files that are wrong").
- [x] **FALSE** `content/lessons/classical.3.md:38` — "The drill on the technique track at Stage 5 is deliberately the other one, the stroked sign going below"
  - Is: `technique.5` (Stage 5) does offer lower-neighbour mordents (`exercise.mordent.c.2pb.left`: C2 B1 C2), but they are written out as eighth notes with no mordent sign of any kind. The file has no `<mordent>` or `<inverted-mordent>` element.
  - Evidence: stage-5.json `technique.5.exerciseOptions`; dump_score of `exercise.mordent.c.2pb.left` and `.right`; regex over the `.mxl` found only `<words>`.
  - Fixed: now "the other one, the note below, written out as eighth notes rather than as a sign" — `technique.5` offers `exercise.mordent.c.2pb.left` (dump_score: C2 B1 C2 in eighths); its MusicXML has no mordent element (only `<words>`; "mordent" occurs only in the container's file name).
- [ ] **JUDGEMENT** `content/lessons/classical.3.md:38` — "the plain sign is much the commoner one in print"
  - Is: a claim about editions in general; a musician should confirm.
  - Evidence: none in repository.

Not checked in this lesson: the G minor companion (`song.pop.minuet-in-g-minor-bach-piano.pdmx`) is only the first 16 bars and ends on B♭. The lesson does not say otherwise, but a learner expecting the whole minuet will not get it.

## chords-pop.3 — `content/lessons/chords-pop.3.md`

Claims checked: 18. Findings: 1.

- [x] **FALSE** `content/lessons/chords-pop.3.md:57` — "because the key is the one thing that preset leaves you"
  - Is: `primary-chords` locks only progression and left hand. Key, right hand, bars and tempo are all free.
  - Evidence: `LAB_PRESETS` `primary-chords.locks = ['progression', 'leftHand']`; `LabScreen.ts:585-603`.
  - Fixed: now "because that preset fixes only the chords and the left hand, and leaves the key to you" — `primary-chords.locks = ['progression', 'leftHand']`.

Checked and true: six songs; *Happy Birthday*, *Saints* (F), *Jingle Bells* (G, block chords) and *Greensleeves (with chords)* print chord symbols over two staves; *Oh! Susanna* is one staff with symbols; *Tom Dooley* is two staves with `chordCount 0`; the preset opens in D (`keyId: 'd-major'`); Jam it shows a chord per bar over drums (`LabScreen.ts:292-330`).

Not checked in this lesson: nothing.

## blues.3 — `content/lessons/blues.3.md`

Claims checked: 18. Findings: 4.

- [x] **FALSE** `content/lessons/blues.3.md:36` — "*St. Louis Blues* is the famous one and is the longest."
  - Is: *St. Louis Blues* is 28 bars. *Wabash Blues* is 57 bars and *Tishomingo Blues* is 48.
  - Evidence: dump_score `notation.bars` of all five songs: 28, 57, 48, 24 (St. James), 8 (Careless Love).
  - Fixed: now "*St. Louis Blues* is the famous one; *Wabash Blues* is the longest" — dump_score bars as written (repeats not expanded): Wabash 57, Tishomingo 48, St. Louis 28.
- [ ] **UNVERIFIED** `content/lessons/blues.3.md:34` — "*Wabash Blues* and *Tishomingo Blues* are full published songs with a verse before the chorus, so read the chorus first."
  - Is: neither file labels a verse or a chorus. Their only text is `= 120`, `solos at B`, `Back to B` (Wabash) and `= 132`, `Opt. Break on Solos` (Tishomingo), which reads like a band lead sheet, not the published song sheet. Wabash changes key at bar 17 (B♭ → E♭), which may be the verse/chorus boundary. A learner cannot find the "chorus" the lesson names.
  - Evidence: dump_score "text on the score" lines and key signatures for both.
- [x] **FALSE** `content/lessons/blues.3.md:44` — "You are already playing pieces built on it"
  - Is: of the five, only *St. Louis Blues* bars 1–12 is a twelve-bar blues (E–A7–E–B7 pattern). *St. James Infirmary* is built from 8-bar phrases (24 bars), *Careless Love* is 8 bars, and neither *Wabash* nor *Tishomingo* shows a twelve-bar section in its chord symbols.
  - Evidence: dump_score chord symbols per bar for all five.
  - Fixed: now "*St. Louis Blues* opens with twelve bars of it" — dump_score chord symbols: St. Louis bars 1–12 E, A, E/B7, E, A, –, E/B7, E, B7, –, E, B7; St. James is 8-bar phrases, Careless Love 8 bars, and Wabash and Tishomingo show no twelve-bar section. Reading the form from symbols is my read; a musician may confirm.
- [x] **WRONG-COUNT** `content/lessons/blues.3.md:50` — "**Tools for this rung.** Three."
  - Is: the rung has two tool buttons, lab (`blues-shuffle`) and Simon (`drill.ear.simon-blues-c`). *Rhythm only* is a score-screen menu row available on any piece, not one of this rung's tools. The description of it is correct.
  - Evidence: stage-3.json `blues.3.tools`; `ScoreScreen.ts:895-915`.
  - Fixed: now "Two, and a score-screen row", with *Rhythm only* placed "in the ⋯ menu" — `blues.3.tools` is lab + simon; *Rhythm only* is a score-screen menu row (`ScoreScreen.ts:895-915`).

Not checked in this lesson: whether the flat third "argues" with the chord (sound).

## theory.3 — `content/lessons/theory.3.md`

Claims checked: 20. Findings: 2.

- [x] **STALE** `content/lessons/theory.3.md:39` — "the progression drill arrives on the Stage 5 rung of this track"
  - Is: the next rung, `theory.4` (Stage 4), already has an ear-progression drill: `drill.ear.cadences` (kind `ear-progression`: authentic, half, plagal, deceptive), which is I/IV/V heard in context. `theory.5` adds `drill.ear.progressions` (I–vi–IV–V, ii–V–I).
  - Evidence: stage-4.json `theory.4.exerciseOptions`; catalog `drill.ear.cadences.drill`; stage-5.json `theory.5`.
  - Fixed: now "the cadence drill arrives on the next rung of this track, at Stage 4" — `theory.4` (stage-4.json) offers `drill.ear.cadences` (kind `ear-progression`); `theory.5` adds `drill.ear.progressions`.
- [x] **FALSE** `content/lessons/theory.3.md:58` — "and a chain of five notes played back in Simon"
  - Is: a chain of five is Simon's *pass* (`SIMON_PASS_CHAIN = 5`). Only a chain of eight counts towards mastery (`SIMON_MASTER_CHAIN = 8`, `simonOutcome().masterEligible`).
  - Evidence: `app/src/engine/drills/simon.ts:100-103, 295-300`.
  - Fixed: "a chain of five notes" → "a chain of eight notes" — `SIMON_MASTER_CHAIN = 8` is the chain that counts towards mastery; five is only the pass (`simon.ts:100-103, 295-300`).

Checked and true: twelve intervals listed; the five song mnemonics; key-signature rules; rhythm dictation is two bars (catalog `bars: 2`); Simon on this rung is `drill.ear.simon-c-major` (C4–C5, white keys, `help: show-keys`), and show-keys lights and names keys and puts them on the staff where there is room (`simon.ts:150-165`); the interval drill covers all twelve (catalog `intervals`).

Not checked in this lesson: nothing.

## improv.3 — `content/lessons/improv.3.md`

Claims checked: 14. Findings: 1.

- [x] **FALSE** `content/lessons/improv.3.md:46` — "The loop you play over is the accompaniment lab's *Jam it*: four bars of C, two of F, two of G"
  - Is: the loop is the rung's drill `drill.improv.loop-i-iv-v` (a backing-track drill on the drill screen: C C C C F F G G at 72 bpm, `scored: false`, with *Listen back*). The rung has no lab tool. The lab's I–IV–V–I is one chord per bar (I IV V I); 4+2+2 is only possible by typing `I I I I IV IV V V` into the numerals field under *Free*.
  - Evidence: catalog `drill.improv.loop-i-iv-v.drill.params`; stage-3.json `improv.3` has no `tools`; `LAB_PROGRESSIONS` `i-iv-v-i`.
  - Fixed: now "the rung's loop drill, on the drill screen: four bars of C, two of F, two of G, at 72 bpm" — catalog `drill.improv.loop-i-iv-v` params C C C C F F G G, bpm 72, scored false; `improv.3` has no `tools`. Dropped "at whatever tempo you set" and "the bar you are in lit", which I did not check the drill screen doing (its loop card shows the bar count, `DrillScreen.ts:1255-1261`).

Checked and true: *Listen back* exists and the recording is not persisted (`DrillScreen.ts:262, 2097`).

Not checked in this lesson: nothing.

## hymns — `content/lessons/hymns.md`

Claims checked: 20. Findings: 2.

- [x] **FALSE** `content/lessons/hymns.md:55` — "Switch *Duet* on with the left hand chosen and soprano and alto arrive over the tenor and bass you are playing"
  - Is: this rung's Duet button opens the first playable song, `song.folk.when-the-saints.f`. That is a melody over block triads, not four voices, so there is no soprano and alto to hear. The described effect needs *Amazing Grace (four parts)*, opened from its own row.
  - Evidence: stage-3.json `hymns.songOptions[0]`; `LessonScreen.ts:404-449`; dump_score of Saints F (RH melody, LH `F3+A3+C4` whole notes) and of `amazing-grace-satb` (RH v1/v2, LH v1/v2).
  - Fixed: the paragraph now says to open *Amazing Grace* in four parts from its own row, because *Play it as a duet* opens *When the Saints*, which has no inner voices — `scorePiece` takes the first playable song (`LessonScreen.ts:403-449`); `hymns.songOptions[0]` is `when-the-saints.f`.
- [x] **FALSE** `content/lessons/hymns.md:46` — "and under *Hymns & gospel* in the Library"
  - Is: the Library's Track filter lists raw track ids, so the option reads `hymns-gospel`. The three pieces are tagged with it, so the filter works.
  - Evidence: `LibraryScreen.ts:1072-1075` (`text: track`); catalog `tracks` of the three Stage 2 pieces include `hymns-gospel`.
  - Fixed: now "the Library's track filter for hymns and gospel lists them too" — the filter shows raw track ids (`LibraryScreen.ts:1072-1075`), but `lessonShape.test.ts` forbids a hyphenated track slug in lesson prose, so the sentence names the filter by what it does rather than by its label. Giving the filter human labels is the owner's call.

Checked and true: *Be Thou My Vision*, *Joyful, Joyful* and *Swing Low* are on `hymns.2` (Stage 2). Every named hymn is in `hymns.songOptions`. *Amazing Grace (four parts)* is S/A on the treble staff and T/B on the bass. Voicing is a concept at Stage 4 (`classical.4.shelf`) and at Stage 6 (`classical.6`, `voicing-melody`).

Not checked in this lesson: nothing.

## rock.overview — `content/lessons/rock.overview.md`

Claims checked: 18. Findings: 1.

- [x] **FALSE** `content/lessons/rock.overview.md:40` — "The easy *Canon in D* is above this rung"
  - Is: the item's level is 5.1, which is the top of this rung's `levelBand` [2.5, 5.1]. It is inside the band, not above it, and it is also offered on 3.5 and 3.6.
  - Evidence: catalog level 5.1; stage-3.json `rock.overview.levelBand`.
  - Fixed: "is above this rung" → "is the hardest of the four" — catalog level 5.1, inside the rung's `levelBand` [2.5, 5.1]; the other three are 3.3, 2.79 and 2.5 (catalog level used as the measure of difficulty).

Checked and true: four songs. *Ode to Joy (full)* has held roots under C and G. *Greensleeves (with chords)* has full LH triads. *Scarborough Fair* is one staff with symbols, ends on E, and has C♯5 over an `[A major]` symbol in bar 7. The later rock rungs exist at the stated stages (rock.4 power chord, rock.5 sus2/sus4/add9, rock.6 with `beethoven-moonlight-i`, rock.7 with Grieg's *Mountain King*). `minor-vamp` is held roots plus chord tones over Am G F G. The Duet button opens the Canon (first playable song).

Not checked in this lesson: "a sound rock uses often" (Dorian) — judgement, not listed.

## latin.3 — `content/lessons/latin.3.md`

Claims checked: 14. Findings: 3.

- [x] **FALSE** `content/lessons/latin.3.md:39` — "*Play it as a duet* lets the app take one hand while you hold the other, which is the easiest way into the two-part clave"
  - Is: the button opens the first playable song, *Cielito Lindo*: one staff, 3/4, no clave. Its Duet row is hidden because the piece has no second hand. All three rung songs are single-staff. The two-part clave is an exercise (`exercise.clave.son-3-2.pulse`), which the button never opens.
  - Evidence: `LessonScreen.ts:404-449`; `ScoreScreen.ts:2327-2332`; dump_score `staves: 1` for all three songs, `staves: 2` for the pulse exercise.
  - Fixed: the paragraph now says the button opens *Cielito Lindo*, one staff, so there is no second hand, and points to the pulse exercise from its own row with *Duet* playing the pulse — `ScoreScreen.ts:2327-2332` hides the Duet row when there is no other hand; dump_score: all three songs `staves 1`, the pulse exercise `staves 2` with the pulse on staff 2, which `extractScoreModel.ts:301` reads as the left hand.
- [x] **FALSE** `content/lessons/latin.3.md:18` — "The exercises here are written on a single line with nothing to read but the rhythm"
  - Is: true of the four clave exercises (one-line percussion staff). Not true of `exercise.tresillo.c`, which is pitched on two five-line staves (C major chord in the RH, C3 tresillo in the LH).
  - Evidence: `.mxl` regex: `<staff-lines>1</staff-lines>` and `<sign>percussion</sign>` in the clave files; dump_score of `exercise.tresillo.c`.
  - Fixed: "The exercises here" → "The clave exercises here" — the tresillo exercise is pitched on two five-line staves (dump_score `exercise.tresillo.c`).
- [ ] **JUDGEMENT** `content/lessons/latin.3.md:35` — "*Só Danço Samba* is ... a gentler rhythm than its name suggests — the syncopation goes quiet and the chords do the work"
  - Is: a claim about sound. The melody is syncopated in the notes (bars 8, 12, 26: eighth-note anticipations), so "goes quiet" is disputable.
  - Evidence: dump_score bars 8–13.

Checked and true: son 2-3, rumba 3-2 and son 3-2 place the strokes correctly (bar positions computed from the dump); the tresillo exercise is 3+3+2; *Cielito Lindo* is in 3/4 and *Guantanamera* in 4/4.

Not checked in this lesson: `song.folk.so-danco-samba.pdmx` bars 1–7 are written as repeated B4 quarters (slash-style vamp) and bar 10 appears to hold six beats in 4/4. That is a file fault, not a lesson claim; noted for whoever checks that score.

## holiday.3 — `content/lessons/holiday.3.md`

Claims checked: 13. Findings: 1.

- [ ] **JUDGEMENT** `content/lessons/holiday.3.md:14` — "Untrained voices mostly live between about A below middle C and D above it"
  - Is: a factual-sounding range claim (A3–D5); a musician should confirm.
  - Evidence: none in repository.

Checked and true: the Stage 2 `holiday` rung exists. The three cadence exercises are I–IV–V7–I in C, G and F, root position. Four songs, all with chord symbols. *Jingle Bells* is in G with block chords. *Joy to the World* and *First Noel* are one-staff lead sheets in D. *Hark!* has the most symbols (45, against 24, 19 and 11). Free play names the held chord (`FreePlayScreen.ts:14`).

Not checked in this lesson: nothing.

## 4.1 — `content/lessons/4.1.md`

Claims checked: 15. Findings: 1.

- [x] **UNOFFERED** `content/lessons/4.1.md:35` — "Each key: contrary motion one octave, then similar motion one octave, then two"
  - Is: the rung has similar-motion two-octave scales in C, G, D and A, and contrary motion only in C (one and two octaves). It has no one-octave similar-motion scale in any key and no contrary-motion scale in G, D or A. The same gap undercuts line 31 ("Learn each scale in contrary motion first").
  - Evidence: stage-4.json `4.1.exerciseOptions`.
  - Fixed: added "The rung has all four keys in similar motion over two octaves and C in contrary motion; the rest are under Exercises in the Library." — stage-4.json `4.1.exerciseOptions`; the catalog has `exercise.scale.{c,g,d,a}-major.{1oct,2oct}.contrary.both.2` and `.1oct.similar.both.2`, and the Library has an Exercises filter (`LibraryScreen.ts:455`).

Checked and true: fingerings for C/G/D/A; the scales are in eighth notes; contrary motion starts both thumbs on C4; *Für Elise (easy)* and *Ode to Joy (easy variation)* are catalog grade 1 and on the rung.

Not checked in this lesson: nothing.

## 4.2 — `content/lessons/4.2.md`

Claims checked: 15. Findings: 2.

- [x] **UNOFFERED** `content/lessons/4.2.md:40` — "contrary motion first as before"
  - Is: the only contrary-motion exercise on the rung is A harmonic minor. There is none for F, B♭ or E♭ major, or for the other five minor forms.
  - Evidence: stage-4.json `4.2.exerciseOptions`.
  - Fixed: added "the rung has it for A harmonic minor, and the three major keys and the other harmonic minors have it under Exercises in the Library" — the catalog has contrary scales for F, B♭ and E♭ major and A, D and E harmonic minor; two searches for a melodic-minor contrary id (a regex over all `both` scale ids, and a grep of the catalog) returned none, so the sentence does not promise one.
- [ ] **JUDGEMENT** `content/lessons/4.2.md:32` — "It exists because singers found that step-and-a-half unsingable"
  - Is: a historical rationale for melodic minor; widely taught, and a musician should confirm the wording.
  - Evidence: none in repository.

Checked and true: all six minor scales named are on the rung. The melodic minor exercise descends natural (D: C5 B♭4 on the way down). *Bella Ciao* (starts in E minor) and *Für Elise (beginner)* (A minor) are catalog grade 1.

Not checked in this lesson: *Bella Ciao* changes key signature twice (E minor → four flats → three sharps). The lesson does not say otherwise.

## 4.3 — `content/lessons/4.3.md`

Claims checked: 17. Findings: 3.

- [x] **FALSE** `content/lessons/4.3.md:41` — "Then a piece that uses broken chords throughout — the easy *Canon in D*"
  - Is: the Canon's left hand is broken chords only in bars 1–12. From bar 13 on it plays half-note bass pairs (D3 A2, B2 F♯2 …). *Greensleeves* (plain) does keep broken triads almost throughout.
  - Evidence: dump_score `song.classical.pachelbel-canon-d.easy` bars 1–34; `song.folk.greensleeves` LH histogram.
  - Fixed: now "a piece that uses broken chords — *Greensleeves*, or the easy *Canon in D*, whose left hand breaks its chords for the first twelve bars" — dump_score of the Canon: broken eighths bars 1–12, half-note pairs from bar 13.
- [x] **FALSE** `content/lessons/4.3.md:48` — "Thirty symbols at three seconds each leaves no room to work one out"
  - Is: the inversion drill runs 10 cards (`drillFromCatalog` default `count = 10`). I found no per-card time limit. `30-inversions-3s-each` is only the rung's `mastery.custom` string, which the app uses only to refuse paper passes and never measures.
  - Evidence: `fromCatalog.ts:177`; `curriculum/selectors.ts:83-86`; grep for `3000|timeLimit|deadline|secondsPer` and then `second|timeout|FAST_MS` in `DrillScreen.ts`/`PromptDrill.ts` found no card timer.
  - Fixed: now "The drill deals ten symbols a run, and the aim is to know each at a glance rather than work it out" — `drillFromCatalog` default `count = 10` (`fromCatalog.ts:177`) and neither caller passes a count (`DrillScreen.ts:2304, 2997`); a second search, `timeLimit|deadline|limitMs|secondsPer|timeoutMs|expire` over `engine/drills` and `DrillScreen.ts`, returned nothing. The closing line's "thirty … within three seconds" is left as a self-check; the app does not measure it.
- [ ] **THEORY** `content/lessons/4.3.md:34` — "Right hand **1-2-3-5**, left hand **5-3-2-1**, with the thumb passing under between groups"
  - Is: over two octaves the right hand is 1-2-3-1-2-3-5 (as the app prints). With 1-2-3-5 there is no thumb pass. The LH 5-3-2-1 matches the app's printed fingering; a musician may prefer 5-4-2-1 for C major. Worth a musician's eye.
  - Evidence: `<fingering>` in `exercise.arpeggio.c-major.2oct.right` = 1 2 3 1 2 3 5 …; `.left` = 5 3 2 5 3 2 1 ….

Checked and true: *Show me* lights the keys and engraves the chord, and the card does not count (`DrillScreen.ts:1741, 1856`). The drill shows slash labels like `F/A` (`factories.ts:136-156`). All six arpeggio keys are offered for each hand.

Not checked in this lesson: nothing.

## 4.4 — `content/lessons/4.4.md`

Claims checked: 15. Findings: 2.

- [ ] **THEORY** `content/lessons/4.4.md:12` — "Charles-Louis Hanon's exercises are sixty patterns, each an eight-note cell that climbs the keyboard"
  - Is: I believe this is wrong for most of the book. Nos. 1–20 are climbing cells. Nos. 21–60 are scales, arpeggios, repeated notes, trills, octaves and similar. A musician should confirm.
  - Evidence: general knowledge of *The Virtuoso Pianist*; the catalog holds only Nos. 1–20.
- [x] **UNOFFERED** `content/lessons/4.4.md:40` — "Hanon 1 to 10 from the generator"
  - Is: the rung offers Nos. 1–5 (hands together). Nos. 6–10 exist in the catalog (`exercise.hanon.06–10.*`) but are not on this rung, and the lesson does not point to the Library.
  - Evidence: stage-4.json `4.4.exerciseOptions`; catalog ids `exercise.hanon.01`–`20`.
  - Fixed: now "Hanon 1 to 5 from the generator … 6 to 10 are under Exercises in the Library" — `4.4.exerciseOptions` is Nos. 1–5 `both`; the catalog has `exercise.hanon.06`–`10` in both/left/right.

Checked and true: the exercises are in C (fifths 0), hands together, and Hanon No. 1's cell is C E F G A G F E. *Blind* is a score-screen menu row that hides only the notation (`ScoreScreen.ts:1100`).

Not checked in this lesson: nothing.

## 4.5 — `content/lessons/4.5.md`

Claims checked: 15. Findings: 5.

- [x] **STALE** `content/lessons/4.5.md:12` — "Every time signature so far has divided the beat in two."
  - Is: compound time came earlier: `song.folk.alouette.pdmx` (6/8) on 2.2, `exercise.rhythm.six-eight-long-short.4bar` on 2.4, *Silent Night* and *We Three Kings* (6/8) on the Stage 2 holiday rung, and *Für Elise (beginner)* (3/8) on 3.4.
  - Evidence: `notation.times` of every song/exercise on stages 0–3 rungs.
  - Fixed: now "Nearly every time signature so far has divided the beat in two; *Alouette* and *Silent Night* were 6/8 in passing." — `notation.times` over stage 0–3 rungs: 6/8 on 2.2 (Alouette), 2.4 (long-short exercise) and holiday (Silent Night, We Three Kings); 3/8 on 3.4 (Für Elise beginner).
- [x] **FALSE** `content/lessons/4.5.md:19` — "*Row Row Row Your Boat* and *Greensleeves in 6/8* are both classic examples — long-short, long-short."
  - Is: *Row Row* is (bars 2–3, 7: quarter–eighth). *Greensleeves in 6/8* keeps the 3/4 tune rhythm over a 6/8 bass. Bars 1, 3, 5, 7, 8, 9, 11 are a half then a quarter, which cuts across the second dotted-quarter beat — not long-short.
  - Evidence: dump_score `song.folk.greensleeves.68` bars 1–15 and `song.folk.row-row-row-your-boat` bars 1–8.
  - Fixed: now "*Row Row Row Your Boat* is the classic example — long-short, long-short. In *Greensleeves in 6/8* the two beats are in the left hand, and the tune often holds across the second." — dump_score: Row Row bars 2–3, 7 quarter–eighth; Greensleeves 6/8 LH two dotted quarters a bar, RH half + quarter in bars 1, 3, 5, 7, 8.
- [x] **FALSE** `content/lessons/4.5.md:29` — "This is where the blues track begins."
  - Is: the blues track starts at Stage 3 (`blues.3`, prerequisite 3.2, shuffle exercise included). `blues.4` also requires only 3.2. Neither depends on 4.5.
  - Evidence: stage-3.json `blues.3`; stage-4.json `blues.4.prerequisites`; `00-tracks.json` `blues-boogie.startsAtStage: 3`.
  - Fixed: "This is where the blues track begins." → "The blues track has used it since Stage 3." — `blues.3` (stage-3.json) offers `exercise.rhythm.shuffle-eighths.4bar`.
- [x] **FALSE** `content/lessons/4.5.md:45` — "*Rhythm only* measures each strike against the two dotted-quarter beats"
  - Is: Rhythm only times each tap against the written note it stands for ("One tap per written note or chord"), not against the beats.
  - Evidence: `ScoreScreen.ts:908-913` (the row's own description).
  - Fixed: now "*Rhythm only* times one tap per written note, on any key" — the row's own description, "One tap per written note or chord" (`ScoreScreen.ts:908-913`). `readingTime` 2 → 3 (424 words after the pass).
- [ ] **THEORY** `content/lessons/4.5.md:28` — "Nothing on the page says so except the word "swing" or "shuffle" at the top."
  - Is: swing is also commonly notated with a metric equivalence (two eighths = quarter + eighth under a triplet bracket). Right in spirit, incomplete; worth a musician's eye.
  - Evidence: none in repository.

Checked and true: the 6/8 description; *Row Row* and *Greensleeves in 6/8* are both in 6/8 and on the rung; the rung offers 6/8 and syncopation rhythm reading and `drill.reading.sight-reading-3`.

Not checked in this lesson: the rung has no `tools`; the Tools paragraph describes score-screen rows, not buttons. Whether the syncopated exercise has "a tie over the beat": `exercise.rhythm.syncopated.4bar` has none (eighth, three quarters, eighth); the lesson does not say it does.

---
Batch 2: 19 of 19 lessons. 43 findings
(28 FALSE, 2 STALE, 1 WRONG-COUNT, 3 UNOFFERED, 3 THEORY, 5 JUDGEMENT, 1 UNVERIFIED).
Lessons not finished: none.

Fix pass: 34 fixed, 0 found wrong and not fixed, 9 left open (THEORY/JUDGEMENT/HISTORY/UNVERIFIED or needs a build). Lessons edited: 3.2, 3.3, 3.4, 3.6, classical.3, chords-pop.3, blues.3, theory.3, improv.3, hymns, rock.overview, latin.3, 4.1, 4.2, 4.3, 4.4, 4.5.
