# Lesson audit — batch 1

Audited 2026-09-19 against the working tree: lesson files in `content/lessons/`, rungs in
`content/curriculum/stage-<n>.json`, scores via `python tools/content/dump_score.py <id>`,
catalog rows in `app/public/content/catalog.json`, and the app code named in each finding.
Fingering counts come from reading `<fingering>` elements in the built `.mxl` directly,
because `dump_score.py` does not print fingering. Nothing here has been heard.
At audit time the working tree had uncommitted changes (not from this audit) in
`DrillScreen.ts`, `fromCatalog.ts`, `LessonScreen.ts`, `simon.ts`, `answerSheet.ts` and
`musicXmlWriter.ts`; code line numbers cited below are from that working tree.

## 0.1 — `content/lessons/0.1.md`

Claims checked: 7. Findings: 3.

- [x] **FALSE** `content/lessons/0.1.md:36` — "Every piece of sheet music in this app uses these numbers."
  - Is: 767 of the 1,975 bundled scores carry no fingering at all (1,208 do). Where numbers are printed they are this convention; many scores print none.
  - Evidence: every catalog row with a `file` opened and searched for `<fingering`: 1,208 with, 767 without (e.g. `exercise.arpeggio7.a-flat-dominant7.2oct.both`, and `song.folk.kum-ba-yah.pdmx` on rung 1.1).
  - Fixed: now "Wherever sheet music in this app prints finger numbers, these are the numbers it uses; many pieces print none." — `song.folk.kum-ba-yah.pdmx` re-read: 0 of 26 notes carry `<fingering>` (the 767/1,208 corpus count is the auditor's, not re-run).
  - Second read (2026-09-22): HOLDS — the sentence is unchanged at `0.1.md:36`, and `<fingering>` recounted in the six rung-1.1 `.mxl` files gives kum-ba-yah 0/26, hot-cross-buns 11/17, mary 26/26, merrily 26/26, au-clair 22/22, ode-to-joy.rh 28/28. The 767/1,208 corpus figure is still the auditor's and was not re-run here.
  - Row: `lessonClaimsAboutMusic.test.ts` › "0.1: a bundled piece can print no finger numbers at all (Kum Ba Yah)" — narrower than the sentence, which is about the whole corpus; unzipping all 1,975 scores in a unit test is not affordable, so the row proves only that "many pieces print none" is not vacuous.
- [ ] **JUDGEMENT** `content/lessons/0.1.md:42` — "Flat, straight fingers. They look relaxed and they are the main reason beginners cannot play two notes at different volumes."
  - Is: a factual-sounding causal generalisation; a teacher should confirm "the main reason".
  - Evidence: not checkable against code or score.
  - Reader 1: REWRITE — "Flat, straight fingers. They look relaxed, and a flat finger has little control over how hard the key goes down, so two notes come out at the same volume whether you meant them to or not." The rewrite keeps the teaching and drops the ranking: "the main reason" is a claim about every beginner, and nothing in the repository or in this reader's knowledge can rank the causes.
- [ ] **JUDGEMENT** `content/lessons/0.1.md:46` — "You can press a key slowly enough to make no sound at all"
  - Is: true of an acoustic action; on a velocity-sensing digital piano (the HP-130 this lesson names) a very slow press may still sound at the lowest velocity. Not tried on the instrument.
  - Evidence: `docs/07-midi-hp130-notes.md` (HP-130 is a 1990s digital piano); nothing in the repo records what it does at minimum velocity.
  - Reader 1: REWRITE — "You can press a key so slowly that the sound barely arrives, then release it, without your wrist moving." The sentence is filed as a judgement but it is really a claim about one instrument: on an acoustic action a slow enough press makes no sound, and a velocity-sensing digital piano may still speak at its lowest velocity. `docs/07-midi-hp130-notes.md` records the HP-130's MIDI ports and nothing about its minimum velocity, and a second search of `docs/` and `content/` for a note on minimum velocity or a velocity floor returned nothing, so the repository cannot settle it. The rewrite is the same test for the learner and asserts nothing about the instrument.

Not checked in this lesson: the posture advice (bench height, distance, shoulders) — teaching advice, not a claim. Checked and true: finger numbers 1–5 and mirror-imaging (THEORY, correct); HP-130 has MIDI OUT (`docs/07-midi-hp130-notes.md:49`, DIN MIDI IN/OUT); the app is called PianoPath (`app/index.html:8`).

## 0.2 — `content/lessons/0.2.md`

Claims checked: 13. Findings: 3.

- [ ] **THEORY** `content/lessons/0.2.md:22` — "the distance from one C to the next C — twelve keys, counting black and white."
  - Is: right as a distance (twelve semitones), but counting keys from one C to the next inclusive gives thirteen; a musician should check the wording does not invite the inclusive count. Believed right as intended.
  - Evidence: theory.
  - Reader 1: RIGHT — the sentence states a **distance**, and the distance from one C to the next is twelve semitones, which on a keyboard is twelve keys travelled. The thirteen the finding worries about is an inclusive count of keys touched, which the sentence does not ask for; it says "the distance from one C to the next C". The app agrees with the twelve: `keyOf` and the drill code throughout treat an octave as 12 (e.g. `buildTechniquePattern`'s `tonic - 12` for the hand below). Worth a teacher's eye only for the wording, not for the fact.
- [x] **FALSE** `content/lessons/0.2.md:46` — "A wrong answer holds its card until you tap it on"
  - Is: a missed `find-key` card is held for 2 seconds (`MISS_PAUSE_MS = 2_000`) and then moves on by itself; a tap only ends the pause early.
  - Evidence: `app/src/engine/drills/feedback.ts:31` (`MISS_PAUSE_MS`), `feedback.ts:41-50` (`find-key` is in `REVEALABLE_KINDS`); `app/src/ui/screens/DrillScreen.ts:1078-1105` (`holdCard(TAP_TO_CONTINUE)` then `setTimeout(endFeedback, holdMs)`); `DrillScreen.ts:1011-1017` (`endFeedback` advances).
  - Fixed: now "holds its card for two seconds (a tap moves on sooner)" — `feedback.ts:31` `MISS_PAUSE_MS = 2_000`, `find-key` is revealable, `DrillScreen.ts` sets `holdMs` and a timer that calls `endFeedback`.
  - Second read (2026-09-22): HOLDS — `feedback.ts:31` still reads `MISS_PAUSE_MS = 2_000`, `find-key` is one of the eight ids in `REVEALABLE_KINDS` (`:41-50`), and `feedbackDelayMs(kind, correct)` returns `MISS_PAUSE_MS` for a missed revealable kind and `FEEDBACK_MS` (450) otherwise — so this rung's own drill is one of the 14 kinds the `0.3` overreach note excepts, and the sentence is right here even though `0.3`'s general form is not.
  - Row: `lessonClaimsAboutApp.test.ts` › "0.2: a missed find-key card is held for the two-second pause, not the 450 ms one" — reads `feedbackDelayMs` and `MISS_PAUSE_MS` from `engine/drills/feedback`, not the number.
- [x] **STALE** `content/lessons/0.2.md:50` — "Twenty named keys in forty seconds, anywhere on the keyboard, at 95 % accuracy"
  - Is: this is the rung's `mastery.custom` string (`20-keys-in-40s>=0.95`), but nothing in the app measures it. The rung's drill `drill.reading.find-key` serves 10 cards (default `count`), untimed, with key names drawn from C3–C5; its catalog params `range: "A0-C8"` and `timed: true` are read by no code. The only reader of the custom string is `demandsMeasuredAccuracy`, which refuses paper passes.
  - Evidence: `app/src/engine/drills/fromCatalog.ts:177` (`count ?? 10`), `:253-260` (`buildFindKey` with no targets → `findKeyDrill({low: 48, high: 72})`); grep for `timed` and for `range` under `app/src/engine/drills/` and `DrillScreen.ts` returned nothing; `app/src/curriculum/selectors.ts:83-86`.
  - Fixed: the goal stays, followed by "The drill gives ten keys a set and does not time you, so that is two sets against your own clock." — `fromCatalog.ts` `count ?? 10`; `timed`/`range` grepped under `engine/drills/` and `DrillScreen.ts`, nothing reads them. Whether to build a timed whole-keyboard drill is the owner's call.
  - Second read (2026-09-22): HOLDS — `fromCatalog.ts:178` still reads `const count = options.count ?? 10` and `drill.reading.find-key` carries no `count`, so a set is ten cards; `buildFindKey` with no `targets` falls to `findKeyDrill({low: 48, high: 72})` (`:254-262`), which is C3–C5 and not the row's `range: "A0-C8"`. Two searches for a reader of the timing: `grep -rn "\brange\b" src/engine/drills/` returns only a local `range(low, high)` helper and `low`/`high` options, and `grep -rn "A0-C8|p\.range|params\.range|\.timed" src/` returns nothing (the only `timed` in `src` is `PdfScreen`'s `FollowMode`). So nothing times the drill.
  - Row: `lessonClaimsAboutApp.test.ts` › "0.2: the find-key drill serves ten cards a set" — counts the prompts the real catalog row produces.

Not checked in this lesson: "usually the one just left of the maker's name" (instrument-dependent, not checkable). Checked and true: 88 keys ≈ seven and a bit twelves; C left of two black keys, F left of three; C D E F G A B; octave-equivalence; middle C = MIDI 60 = C4, fourth C from the bottom on 88 keys (THEORY); G between the first and second keys of the three-group; the drill names a key (`findKeyDrill` labels strip the octave); *Show me* lights the key and *Hear it* plays it, and either forfeits the card (`DrillScreen.ts:1735-1754`, `1852-1858`).

## 0.3 — `content/lessons/0.3.md`

Claims checked: 26. Findings: 6.

- [x] **STALE** `content/lessons/0.3.md:16` — "**Wait mode** holds the score still" (and "**Tempo mode**", line 20)
  - Is: the Score screen's mode selector reads *Wait for me* and *Keep tempo*; the one-word *Wait* / *Tempo* appear only on a bar narrower than 400 px. The Guide calls it *Keep tempo*.
  - Evidence: `app/src/ui/screens/ScoreScreen.ts:69-74` (`MODES`), `:84-89` (`SHORT_MODES`); `GuideScreen.ts:145`.
  - Fixed: the lesson now says *Wait for me* and *Keep tempo* throughout (lines 16, 20, 49, 65–66) — `ScoreScreen.ts` `MODES` labels; 1.1's mastery line was changed the same way while fixing it. Grep for `Tempo mode|Wait mode` in `content/lessons/` after the pass: 1.2 and technique.8 still use the old names; left, as no finding covers them.
  - Second read (2026-09-22): HOLDS — `ScoreScreen.ts:76-81` `MODES` is still `Wait for me / Keep tempo / Play it to me / Free play`, and `SHORT_MODES` (`:92-97`) is the narrow-bar form. `grep -rnE "Tempo mode|Wait mode|Listen mode|Free mode" content/lessons/` exits 1 (no match), so Entry 24 item 10 closed 1.2 and technique.8 as well. A second search shaped differently — case-insensitive over all of `content/` — does return two hits **outside the lessons**: `content/curriculum/concepts.json:3656` and `:4184` still carry `"display": "Tempo mode"` and `"display": "Wait mode"`, which is on-screen text. Not this finding's, and outside this task's files; recorded for the coordinator.
  - Row: `lessonClaimsAboutApp.test.ts` › "0.3: the two modes this lesson names are what the mode picker calls them".
- [x] **FALSE** `content/lessons/0.3.md:20` — "**Tempo mode** plays a click"
  - Is: the Score screen's metronome starts off on every visit (`let metronomeOn = false`) and is switched on from the ⋯ menu's *Metronome* row; a Keep-tempo run plays no click unless it is on.
  - Evidence: `ScoreScreen.ts:285`, `:878`, menu row at `:1093`; `app/src/score/ScoreSession.ts:441` (metronome started only when `run.metronome === true`).
  - Fixed: now "its click, off until you switch it on, is *Metronome* in the ⋯ menu" — `ScoreScreen.ts:285` `let metronomeOn = false`, menu row `Metronome`; `ScoreSession.ts` starts it only when `run.metronome === true`.
  - Second read (2026-09-22): HOLDS — in the sample and re-run: `ScoreScreen.ts:311` is still `let metronomeOn = false` (the line has moved from 285), `:904` is the menu row's toggle, `:1467` puts `metronome: metronomeOn` on the run, and `ScoreSession.ts:441` starts the click only `if (run.metronome === true && …)`. Nothing sets it true on a fresh visit.
  - Row: `lessonClaimsAboutApp.test.ts` › "0.3: the metronome is off until it is switched on, and it lives on a ⋯ row".
- [x] **FALSE** `content/lessons/0.3.md:20` — "this is the mode that scores you"
  - Is: Wait runs are scored and recorded too (accuracy = fraction of steps right) and can pass: `evaluateOutcome` judges both `wait` and `tempo`, and a Wait run carries the tempo slider's value, so a Wait run with the slider at 80 % or more and 90 % of steps right records a pass. (At the default slider of 70 % it cannot.)
  - Evidence: `app/src/engine/Scoring.ts:111-119` (wait accuracy), `:177-190` (`judged = mode === 'wait' || mode === 'tempo'`); `ScoreScreen.ts:1409-1412` (run gets `tempoPct`), `:1956-1990` (outcome recorded); `app/src/data/settingsStore.ts:131` (`defaultTempoPct: 70`).
  - Fixed: now "Both modes score you", with Wait's accuracy given as "the fraction of steps you got right" — `Scoring.ts` (wait accuracy = correctSteps / totalSteps) and `evaluateOutcome` (`judged = mode === 'wait' || mode === 'tempo'`).
  - Second read (2026-09-22): HOLDS — `Scoring.ts:184` still reads `const judged = score.mode === 'wait' || score.mode === 'tempo'`, and both `passed` and `masterEligible` are gated on it, so a Wait run is judged and can pass; `:116` is the `input.mode === 'wait'` branch that makes accuracy the fraction of steps.
  - Row: `lessonClaimsAboutApp.test.ts` › "0.3: a Wait for me run is scored and can pass, the same as a Keep tempo one" — drives `evaluateOutcome` for both modes rather than reading the line.
- [x] **FALSE** `content/lessons/0.3.md:23` — "*mastered* is 97 % at full tempo, twice, on different days."
  - Is: one run at ≥ 97 % and 100 % tempo masters an item once it has passes (90 %/80 %) recorded on at least two different days; the second day need not be a 97 % run.
  - Evidence: `app/src/data/progressStore.ts:141-144` (`passedOn` gets the date on any pass; `masterEligible && passedOn.length >= 2` → mastered).
  - Fixed: now "*mastered* is 97 % at full tempo, once you have passed the piece on two different days" — `progressStore.ts`: `passedOn` gets the date on any pass, then `masterEligible && passedOn.length >= 2`.
  - Second read (2026-09-22): HOLDS — `progressStore.ts:143-144` still reads `if (result.passed && !row.passedOn.includes(date)) row.passedOn.push(date)` then `if (result.masterEligible && row.passedOn.length >= 2) row.status = 'mastered'`, so the second day only has to be a pass. `Scoring.ts:187-190` sets `masterEligible` from `masterAccuracy`/`masterTempoPct`, which `DEFAULT_MASTERY` (`:154-159`) states; the lesson's 97 % and full tempo are those two values.
  - Row: `lessonClaimsAboutApp.test.ts` › "0.3: mastery is 97 % at full tempo, and the second day only has to be a pass" — reads `DEFAULT_MASTERY` and the `passedOn.length >= 2` rule from the source, not the numbers.
- [x] **FALSE** `content/lessons/0.3.md:26` — "**Hand focus** silences one staff so you can play hands separately"
  - Is: choosing R or L (there is no control called Hand focus) makes the app *play* the other hand by default — `playbackHands` defaults to `non-focused`, which is the Duet row switched on. It is silent only after Duet is turned off.
  - Evidence: `app/src/data/settingsStore.ts:156` (`playbackHands: 'non-focused'`); `ScoreScreen.ts:122-126` (R / L / Both), `:961-973` (Duet toggles `playbackHands`).
  - Fixed: now "**R and L** on the control bar choose the hand you play, and the app plays the other one for you until you turn *Duet* off in the ⋯ menu." — `settingsStore.ts:156` `playbackHands: 'non-focused'`; `ScoreScreen.ts` `HANDS` R/L/Both and the Duet toggle.
  - Second read (2026-09-22): HOLDS — `DEFAULT_SETTINGS.playbackHands` is still `'non-focused'` (`settingsStore.ts:156`), which is the Duet row switched on, and the ⋯ row toggles it to `'none'`. So choosing R plays the left hand until Duet is turned off, which is what the sentence now says and the reverse of what it said before.
  - Row: `lessonClaimsAboutApp.test.ts` › "0.3: Duet is on out of the box, so choosing a hand does not silence the other" — reads `DEFAULT_SETTINGS`, not a number.
- [x] **FALSE** `content/lessons/0.3.md:55` — "a card you missed pauses so you can try it again"
  - Is: the pause shows the answer (keys lit, staff drawn) for 2 s and then moves to the next card; the missed card cannot be retried there. A key pressed during the pause is not taken as a retry. Retrying comes only from *Go over the ones you missed* at the end of the set.
  - Evidence: `DrillScreen.ts:1078-1105`, `:1020-1027` (key presses are not a tap-to-continue and are left for the next card), `:2032` and `:2082-2087` (go-over offer).
  - Fixed: now "a card you missed pauses for two seconds with the answer on it" (the go-over offer after the set is unchanged) — `DrillScreen.ts` `showAnswer` + `holdCard` then `endFeedback` on a `MISS_PAUSE_MS` timer.
  - Second read (2026-09-22): OVERREACH (true of 14 of the 20 drill kinds, not of all of them) — confirmed by enumeration rather than by the sample's summary: `REVEALABLE_KINDS` (`feedback.ts:41-50`) holds 8 kinds, `STAFF_POLICY` (`drills/types.ts:90-125`) marks 10 as `after-answer`, and the four chord-reading kinds are in both, so the union is 14 of the 20 kinds the record declares. `DrillScreen.ts:1150-1167` gives `MISS_PAUSE_MS` to the `after-answer` set as well as to a revealed miss. The six left over are `rhythm`, `dynamics`, `transposition`, `pedal` and `backing-track`, which get `FEEDBACK_MS` (450) with nothing drawn, and `simon`, which replays its chain instead.
  - Second-read fix (2026-09-22): `0.3.md:57-58` now reads "and on most drills a card you missed pauses for two seconds with the answer on it". Three words; `readingTime` recounted (600 words → 3, unchanged).
  - Row: `lessonClaimsAboutApp.test.ts` › "0.3: most drill kinds hold a missed card for the long pause, and a few do not" — counts the kinds in `REVEALABLE_KINDS` and `STAFF_POLICY` against the declared `DrillKind` list rather than asserting 14.

Not checked in this lesson: whether "right and on time" matches how `hits` is counted inside `PracticeEngine` (only `Scoring.ts` was read: Keep-tempo accuracy = `hits / expectedNotes`). Checked and true: pass = 90 % at 80 % (`settingsStore.ts:137-138`); review at 1, 3, 7, 21 days after first pass (`progressStore.ts:48`, `:486-510`); the 30-minute template 5/5/10/7/3 (`app/src/curriculum/session.ts:53-67`); Rhythm only is in the ⋯ menu and judges timing only (`ScoreScreen.ts:895-915`, `:1086-1090`); Ladder raises a notch per clean loop (`:925-945`); Blind hides the notation (`:1100`); bars in window 1–8 (`app/src/score/WindowRenderer.ts:60-61`); *Show me* / *Hear it*; the go-over offer; the Lab writes an exercise from a key and progression and *Jam it* plays a drum-and-bass loop under a chord grid (`LabScreen.ts:1-25`, `:292-400`); Today's daily read changes with the calendar day (`sightReading.ts:1364`, `progressStore.ts:66`); *Hot Cross Buns* is this rung's song; 60 % is settable (slider 30–130).

## 0.4 — `content/lessons/0.4.md`

Claims checked: 12. Findings: 3.

- [x] **FALSE** `content/lessons/0.4.md:12` — "The test is eight short items, in rising order of difficulty:" (the numbered list, lines 14–21)
  - Is: the drill has the same eight items in a different order: 1 name a note, 2 clap, 3 five-finger HT, 4 I–IV–V in G, 5 sight-read four bars, 6 Petzold Minuet at 60 %, 7 C major scale HT, 8 swung blues LH. The lesson lists the scale 4th, I–IV–V 6th, blues 7th and the Minuet 8th.
  - Evidence: `drill.placement.stage-0` `drill.params.items` in the catalog (failUnits 1.1, 1.2, 2.1, 3.2, 3.4, 3.4, 4.1, blues-boogie.4.1; passUnit 4.3); `DrillScreen.ts:2481-2546` runs them in that order.
  - Fixed: the list is now in the drill's order (I–IV–V 4th, sight-reading 5th, Minuet 6th, scale 7th, blues 8th) and introduced as "in this order", not "rising order of difficulty" — `drill.placement.stage-0` `params.items` re-read in the catalog.
  - Second read (2026-09-22): HOLDS — `drill.placement.stage-0` `params.items` re-read: the eight `text` values are, in order, name a note / clap a rhythm / five-finger hands together / I–IV–V in G / sight-read four bars / Petzold Minuet at 60 % / C major scale hands together / swung twelve-bar blues left hand, with `failUnit` 1.1, 1.2, 2.1, 3.2, 3.4, 3.4, 4.1, blues-boogie.4.1 and `passUnit` 4.3. The lesson's eight numbered lines at `0.4.md:14-21` are those eight sentences in that order, word for word.
  - Row: `lessonClaimsAboutApp.test.ts` › "0.4: the placement test's items are in the order the lesson prints, chords fourth and the scale seventh".
- [x] **FALSE** `content/lessons/0.4.md:28` — "The temptation is to pass item 4 because you can \"sort of\" play a scale."
  - Is: in the app item 4 is "Play I–IV–V in G from chord symbols"; the scale is item 7.
  - Evidence: as above.
  - Fixed: "pass item 7" — the scale is item 7 in `params.items`.
  - Second read (2026-09-22): HOLDS — `params.items[6].text` is "Play a C major scale hands together." (`failUnit` 4.1), so the scale is the seventh item and `0.4.md:30` names the right one.
  - Row: covered by the row above (the same ordering assertion names the scale as item 7); no second row.
- [x] **FALSE** `content/lessons/0.4.md:23` — "Everything before it is marked *passed (placement)* and stops appearing in your plan"
  - Is: the result writes only `plan.placement` and `plan.unitId`; no item is marked passed, and nothing that builds Today or Plan reads `plan.unitId` — the plan is unchanged apart from the placement drill itself being recorded as passed.
  - Evidence: `app/src/data/planStore.ts:46-47`; `DrillScreen.ts:2607-2663` (`recordRun` for the placement drill only, then `recordPlacement`). Grep for `unitId` under `app/src`: written in `planStore.ts` and `DrillScreen.ts`, read nowhere else; grep for `getPlan`: `PlanScreen.ts:730`, `SkillsScreen.ts:344`, `TodayScreen.ts:541`, `trackChips.ts:16` — each uses only the active tracks (`activeTracksFor`); `buildSession` (`TodayScreen.ts:545-557`) takes no unit. Grep for `(placement)` returned nothing.
  - Fixed: now "The app names that unit and *Start here* records it, but nothing before it is marked passed and your plan does not change, so go to that unit yourself." — `planStore.ts:46-47` writes only `placement` and `unitId`; `getPlan` readers (Today, Plan, Skills, trackChips) use only `activeTracksFor`, which reads `trackOrder`. The drill's own status line still says "Today will build from here", which is code, not prose: whether to make the plan follow the placement is the owner's call.
  - Built (2026-09-21): `nextRecommended` takes a `startAt` and Plan, Today and Skills pass the plan row’s `placement.unitId`, so the plan does start there; rungs behind it come back only when there is nothing left in front. The sentence now reads "The app names that unit and *Start here* records it, and your plan begins there from then on: Today and *Next up* both start at that unit."
  - Second read (2026-09-22): HOLDS, on the built sentence rather than on the fixed one — `session.ts:158-173` declares `options.startAt` ("The placed unit or rung: nothing before it is recommended first") and keeps a `firstBehind` for the fallback, which is the "comes back for the rungs you went past" clause at `0.4.md:26-27`. The sentence's other half is also right: nothing before the placement is written as passed — `planStore` still records only `placement` and `unitId`.
  - Row: `lessonClaimsAboutApp.test.ts` › "0.4: a placement start holds the rungs behind it back and gives them back when nothing is left in front" — drives `nextRecommended` with and without `startAt`. `placementStartsThePlan.test.ts` already proves the build; this row is the lesson's sentence rather than the feature.

Not checked in this lesson: nothing. Checked and true: the first failed item sets the starting point (`DrillScreen.ts:2544`, `finishPlacement(step.failUnit)`); nothing is locked by default (`strictPrerequisites: false`, `settingsStore.ts:140`); the Petzold Minuet in G is in the Library (`song.classical.petzold-minuet-g-bwv-anh114`).

## 1.1 — `content/lessons/1.1.md`

Claims checked: 20. Findings: 6.

- [x] **FALSE** `content/lessons/1.1.md:14` — "Every tune in this unit lives inside it."
  - Is: five of the six songs stay within C4–G4; *Kum Ba Yah* (`song.folk.kum-ba-yah.pdmx`) runs G4–E5 and never touches C position.
  - Evidence: `dump_score.py` for each of the rung's six `songOptions`: hot-cross-buns (C4–E4), mary-had-a-little-lamb (C4–G4), merrily-we-roll-along (C4–G4), au-clair-de-la-lune (C4–E4), ode-to-joy.rh (C4–G4), kum-ba-yah.pdmx bars 1–8 (G4 B4 D5 E5 C5 A4).
  - Fixed: now "Every tune in this unit but one lives inside it"; the one-more-tune paragraph says which — `dump_score.py song.folk.kum-ba-yah.pdmx`: G4–E5.
  - Second read (2026-09-22): HOLDS — every pitch in all six of rung 1.1's `songOptions` read out of the `.mxl` rather than the dump: hot-cross-buns C4–E4, mary C4–G4, merrily C4–G4, au-clair C4–E4, ode-to-joy.rh C4–G4, kum-ba-yah G4–E5. Five inside C4–G4, one outside, and the lesson names that one.
  - Row: `lessonClaimsAboutMusic.test.ts` › "1.1: five of the six tunes on this rung stay inside C position and one does not" — reads every note of each built score.
- [x] **FALSE** `content/lessons/1.1.md:29` — "*Mary Had a Little Lamb* and *Ode to Joy*, which add F and G."
  - Is: *Mary Had a Little Lamb* adds G only (bar 4, E G G); it has no F. *Ode to Joy* adds F and G.
  - Evidence: `dump_score.py song.folk.mary-had-a-little-lamb` bars 1–8: pitches C4 D4 E4 G4 only; `dump_score.py song.classical.ode-to-joy.rh` bars 1–2 (E E F G G F E D).
  - Fixed: now "*Mary Had a Little Lamb*, which adds G, and *Ode to Joy*, which adds F and G" — `dump_score.py`: Mary bars 1–8 have C D E G only; Ode (rh) bar 1 E E F G.
  - Second read (2026-09-22): HOLDS — the distinct pitches of the whole file, from the `.mxl`: Mary is exactly {C4, D4, E4, G4} (no F of any kind anywhere in it) and *Ode to Joy (theme)* is exactly {C4, D4, E4, F4, G4}. So Mary adds G only and Ode adds both.
  - Row: `lessonClaimsAboutMusic.test.ts` › "1.1: Mary adds G and no F, and Ode to Joy adds both F and G" — reads the pitch set of each built score.
- [x] **FALSE** `content/lessons/1.1.md:40` — "*Kum Ba Yah* is on this rung too: eight bars, right hand only, and every note under the five fingers."
  - Is: eight bars and one staff are right, but the tune uses six pitches G A B C D E (G4–E5), a sixth — more than five fingers without a shift.
  - Evidence: `dump_score.py song.folk.kum-ba-yah.pdmx`, bars 1–8; notation `bars: 8, staves: 1`.
  - Fixed: now "it sits higher than C position, from the G above middle C up to the E a sixth above it: six notes, one more than five fingers hold, and no fingering printed" — `dump_score.py` bars 1–8 (G4 A4 B4 C5 D5 E5); 0 of 26 notes fingered.
  - Second read (2026-09-22): HOLDS on all four clauses — `.mxl` re-read: the distinct pitches are exactly G4, A4, B4, C5, D5, E5 (six, G up to the E a sixth above), 0 of 26 sounding notes carry `<fingering>`, and the catalog's measured `notation` gives `bars: 8`, `staves: 1`.
  - Row: `lessonClaimsAboutMusic.test.ts` › "1.1: Kum Ba Yah is six notes from G4 to E5, eight bars on one staff, with no fingering printed".
- [x] **FALSE** `content/lessons/1.1.md:41` — "It is the slowest of the four"
  - Is: it is the fastest of the four named tunes: Kum Ba Yah 96 bpm, Ode to Joy 88, Mary 76, Hot Cross Buns 72 (all quarter-note beats in 4/4).
  - Evidence: catalog `tempoBpm` for each id.
  - Fixed: the "slowest of the four … best for listening to your tone" clause is deleted — its premise is false (catalog `tempoBpm` 96, the fastest) and the tone advice rested on it; the sentence now ends "so work yours out before you play it."
  - Second read (2026-09-22): HOLDS — `1.1.md:39-43` carries no tempo claim at all now, and the premise the deletion rested on is still true: `tempoBpm` is 96 for Kum Ba Yah against 88, 76 and 72 for Ode to Joy, Mary and Hot Cross Buns, so it is the fastest of the four the lesson names.
  - Row: none — the sentence was deleted rather than corrected, so there is no claim left to read. A row asserting Kum Ba Yah is not the slowest would pin a deletion rather than a sentence.
- [x] **FALSE** `content/lessons/1.1.md:37` — "The fingering printed above the notes is not a suggestion"
  - Is: *Kum Ba Yah* prints no fingering (0 of 26 notes); *Hot Cross Buns* prints 11 of 17. The other four print a number on every note.
  - Evidence: `<fingering>` elements counted in each `.mxl`: hot-cross-buns 11/17, mary 26/26, merrily 26/26, au-clair 22/22, ode-to-joy.rh 28/28, kum-ba-yah.pdmx 0/26.
  - Fixed: now "Where fingering is printed above the notes it is not a suggestion" — `<fingering>` counted: Kum Ba Yah 0/26, Hot Cross Buns 11/17.
  - Second read (2026-09-22): HOLDS — `<fingering>` recounted in all six `.mxl` files: kum-ba-yah 0/26, hot-cross-buns 11/17, mary 26/26, merrily 26/26, au-clair 22/22, ode-to-joy.rh 28/28. Two of the six do not print a number on every note, so the conditional "Where fingering is printed" is the true form and the flat "The fingering printed above the notes" was not.
  - Row: `lessonClaimsAboutMusic.test.ts` › "1.1: two of the rung's six tunes do not print a finger number on every note" — reads `<fingering>` out of each built score.
- [x] **FALSE** `content/lessons/1.1.md:44` — "then in Tempo mode at 60 bpm at 90 %"
  - Is: a pass needs 80 % of the piece's own tempo. At 60 bpm only *Hot Cross Buns* (72 bpm → 83 %) records a pass; Mary 76 → 79 %, Merrily 80 → 75 %, Au Clair 84 → 71 %, Ode 88 → 68 %, Kum Ba Yah 96 → 63 % — each a "Run finished", not a pass.
  - Evidence: catalog `tempoBpm` per song; `settingsStore.ts:138` (`passTempoPct: 80`); `Scoring.ts:185-186`; `ScoreScreen.ts:1237` (tempo % = bpm / written bpm).
  - Fixed: now "in Keep tempo at 90 % with the tempo at 80 % or more of the piece's own" — the app's pass (`settingsStore.ts:138`, `Scoring.ts` `evaluateOutcome`); a fixed bpm is under 80 % for five of the six songs (catalog `tempoBpm`). The rung's `minTempoPct` is read by no code; building per-rung thresholds is the owner's call.
  - Built (2026-09-21): the pass for a run of this rung’s material is the rung’s own `minAccuracy` and `minTempoPct` (`curriculum/selectors.ts` `masteryCriteriaFor`, read by the Score screen and the Drill screen); a piece on no rung still takes the Settings pair. The sentence now reads "in Keep tempo at 90 % with the tempo at 80 % or more of the piece’s own", which is what 1.4 asks for and what the app now applies.
  - Second read (2026-09-22): HOLDS for **1.1**, and the Built line's aside about 1.4 is wrong — rung 1.1's `mastery` is `{minAccuracy: 0.9, minTempoPct: 0.8}`, so 90 % and 80 % is exactly what this rung now asks, and `1.1.md:45-46` says so. But rung **1.4**'s `minTempoPct` is **0.85**, not 0.8, so the identical sentence in `1.4.md` is now wrong — see the 1.4 finding below, which this run re-verdicts as WRONG.
  - Row: `lessonClaimsAboutApp.test.ts` › "1.1: this rung's own pass is the 90 % and 80 % the lesson quotes" — reads `masteryCriteriaFor(rung('1.1'))`, not the numbers on their own.

Not checked in this lesson: nothing. Checked and true: C position C D E F G under 1–5; treble clef's curl on the G line and middle C on one ledger line below (THEORY); quarter note one beat, 4/4 four beats (THEORY); *Hot Cross Buns* uses only E, D, C (bars 1–4); the five-finger exercise exists (`exercise.five-finger.c-major.right`); *Kum Ba Yah* is on the rung.

## 1.2 — `content/lessons/1.2.md`

Claims checked: 18. Findings: 4.

- [x] **FALSE** `content/lessons/1.2.md:12` — "So far every note lasted one beat."
  - Is: the 1.1 songs already hold longer notes: half notes in *Hot Cross Buns*, *Mary*, *Au Clair*, *Ode to Joy* and *Kum Ba Yah*, whole notes in *Mary* (bar 8) and *Au Clair* (bars 4, 8), and *Hot Cross Buns* bar 3 is eighth notes.
  - Evidence: `dump_score.py` on each 1.1 song (see 1.1 above): e.g. `song.folk.hot-cross-buns` bar 1 `C4/hal`, bar 3 eight `eig`; `song.folk.mary-had-a-little-lamb` bar 8 `C4/who`.
  - Fixed: now "So far you have counted notes that last one beat, though the tunes already held some longer ones. Now they get names" — `dump_score.py song.folk.mary-had-a-little-lamb` bar 8 `C4/who`, `song.folk.hot-cross-buns` bar 1 `C4/hal`.
  - Second read (2026-09-22): HOLDS — a census of `<type>` over every sounding note of all six rung-1.1 songs, from the `.mxl`: hot-cross-buns 6 quarters, 3 halves, 8 eighths; mary 22/3 halves/1 whole; merrily 22/3/1; au-clair 16/4 halves/2 wholes; ode-to-joy.rh 24/4 halves; kum-ba-yah 20/6 halves. Every one of the six already holds something longer than a beat, so "the tunes already held some longer ones" is right of all of them and not just of the two the fix line names.
  - Row: `lessonClaimsAboutMusic.test.ts` › "1.2: every tune on the rung before this one already holds a note longer than a beat" — reads the note types of each built score.
- [ ] **THEORY** `content/lessons/1.2.md:19` — "Each is twice the one below it"
  - Is: wrong as the list is printed — the list runs quarter, half, whole downwards, so each is *half* the one below it (twice the one above). Believed wrong; a one-word fix.
  - Evidence: lines 15–17 of the lesson.
  - Open: THEORY — needs a musician; left as written per the fix brief, though the list order makes "twice the one below it" read backwards.
  - Reader 1: WRONG (each is twice the one **above** it in the list as printed) — `1.2.md:15-17` prints quarter (1 beat), then half (2), then whole (4), so the item below any line is the longer one and each is *half* the one below it. The relation the sentence wants — doubling as you go down the page — would need the list in the other order. The smallest true change is one word: "Each is twice the one above it". Read against the lesson's own printed list, not against a convention, so this is decidable without a musician.
- [x] **FALSE** `content/lessons/1.2.md:30` — "and the app scores that as a missed duration."
  - Is: held length is not scored. Accuracy counts notes struck (Tempo: `hits / expectedNotes`; Wait: steps right). The only held-length measure, `articulationScore`, is called by nothing in the app.
  - Evidence: `app/src/engine/Scoring.ts:111-119`, `:257` (`articulationScore`); grep for `articulationScore(` under `app/src` returned only its definition; grep for `articulation` in `ScoreScreen.ts` returned nothing.
  - Fixed: now "The app does not score how long you hold a note, only which notes you strike and when, so this one is on your ears." — grep for `articulationScore` under `app/src`: its definition and two comments, no caller; `Scoring.ts` accuracy is steps or `hits / expectedNotes`. Wiring the held-length scorer in is the owner's call.
  - Built (2026-09-21): not here. `1.4` is a repertoire rung and its pieces carry no articulation target, so there is nothing for the scorer to judge against; the sentence stands. The scorer is wired in on the four articulation exercises, which state their own target — see technique.4 in batch 3.
  - Second read (2026-09-22): HOLDS, and the Built line names the wrong rung — the finding is in `1.2.md`, and it is **rung 1.2** that has to be checked. Every one of its nine options was read: the five songs carry no `drill` block at all, and its four exercises are all `kind: rhythm` (`drill.rhythm.mixed-values`, `exercise.rhythm.half-and-quarters.4bar`, `.quarters.4bar`, `.waltz-quarters.4bar`). None of them is `kind: articulation`, so `techniqueMeasureFor` has nothing to measure on this rung and `1.2.md:32-34` is true where it stands. ("1.4" in the Built line is a slip for 1.2; 1.4 is also a repertoire rung with no articulation item, so the conclusion is unaffected.)
  - Row: `lessonClaimsAboutApp.test.ts` › "1.2: nothing on this rung asks for a held-length measure, so the lesson is right that the app does not score it" — reads the `drill.kind` of every one of the rung's options.
- [ ] **JUDGEMENT** `content/lessons/1.2.md:26` — "letting it run long is the most common rhythm error there is."
  - Is: a factual-sounding generalisation for a teacher to confirm.
  - Evidence: not checkable.
  - Reader 1: REWRITE — "A rest is not a pause — it is a beat that happens to be silent, and the easy mistake is to let it run long." The teaching survives intact; "the most common rhythm error there is" ranks every rhythm error ever made, which nothing here can check.

Not checked in this lesson: nothing. Checked and true: note and rest values and the rest positions (THEORY); *Lightly Row* and *Twinkle* fall into four-bar phrases ending on a half note (`dump_score.py song.folk.lightly-row` bars 4, 8; `song.folk.twinkle.rh` bars 4, 8, 12); the rhythm drill is tapped on any key (`drill.rhythm.mixed-values`, kind `rhythm`); *Lightly Row*, *Jingle Bells*, *Twinkle*, *Frère Jacques* are all on the rung; Twinkle's A4 is one white key above G4 and the fingering shifts up (bar 2 `A4(5)`) and back (bar 3 `F4(4)`); *Frère Jacques* bars 7–8 drop to G3 with `C4(4) G3(1) C4(4)` — thumb on G, 4 on C.

## 1.3 — `content/lessons/1.3.md`

Claims checked: 16. Findings: 1.

- [x] **FALSE** `content/lessons/1.3.md:45` — "One left-hand tune at 60 bpm at 90 %"
  - Is: at 60 bpm only *Hot Cross Buns (left hand)* (72 bpm → 83 %) records a pass; *Mary (left hand)* 76 → 79 % and *Ode to Joy (left hand)* 84 → 71 % fall under the 80 % pass tempo.
  - Evidence: catalog `tempoBpm` of `song.folk.hot-cross-buns.lh`, `song.folk.mary-had-a-little-lamb.lh`, `song.classical.ode-to-joy.lh`; `settingsStore.ts:138`; `ScoreScreen.ts:1237`. (The rung's own `minTempoPct` is read by no code — grep for `minTempoPct` under `app/src` finds only its type, `curriculum/types.ts:148`.)
  - Fixed: now "One left-hand tune at 90 % with the tempo at 80 % or more of the piece's own" — catalog `tempoBpm` 72/76/84 for the three `.lh` songs; `settingsStore.ts:138`.
  - Second read (2026-09-22): HOLDS, and for a reason the sample could not have given — the sample read this against the Settings pair, and since T10 the pass for a run of a rung's material is the rung's own pair. Rung 1.3's `mastery` is `{minAccuracy: 0.9, minTempoPct: 0.8}`, so 90 % and 80 % is what this rung asks for as well as what Settings holds, and the sentence is right either way.
  - Row: `lessonClaimsAboutApp.test.ts` › "1.3: this rung's own pass is the 90 % and 80 % the lesson quotes".

Not checked in this lesson: whether a learner can name a note "within two seconds" — the note-flash drill is untimed and asks for the key to be played, not named; this is a self-check, not a claim about the app. Checked and true: LH C position C3–G3 with 5 on C3 and 1 on G3 (all three LH songs: `C3(5)`, `D3(4)`, `E3(3)`, `F3(2)`, `G3(1)`); bass-clef F line, C3 in the second space, middle C on a ledger above, middle line B (treble) / D (bass) (THEORY); the three LH songs and the F2–C4 note flash are on the rung; the LH five-finger drill plays C3 D3 E3 F3 G3 F3 E3 D3 C3, i.e. 5-4-3-2-1-2-3-4-5 (`fromCatalog.ts:611-616`); *Sight-read, left hand* is on the rung and generates a new four-bar bass-clef phrase in C3–G3 on each open (`ScoreScreen.ts:138-160`, `sightReading.ts:141-151`, `:571-588`).

## 1.4 — `content/lessons/1.4.md`

Claims checked: 19. Findings: 5.

- [ ] **THEORY** `content/lessons/1.4.md:25` — "That rule holds for every dotted note you will ever meet."
  - Is: a double-dotted note adds half and then a quarter of its value; the rule as stated covers single dots only. Believed wrong as an absolute.
  - Evidence: theory.
  - Reader 1: WRONG (it holds for every **singly** dotted note, and a second dot adds a further quarter) — `1.4.md:23-26` states the rule as "a dot after any note adds half of that note's value again" and then generalises it to "every dotted note you will ever meet". A double-dotted half is 2 + 1 + ½ = 3½ beats, not 3, so the generalisation fails on the first note that carries two dots. The smallest true change is to bound it: "That rule holds for every single dot; a second dot adds half again of what the first one added." Whether a beginner meets a double dot is a curriculum judgement and not this claim.
- [ ] **THEORY** `content/lessons/1.4.md:29` — "the first bar is short and the missing beats are at the end of the piece."
  - Is: a common convention, not a rule — and not true of this rung's *When the Saints*: its three-beat pickup (bar 0) is followed by a full final bar (bar 8 `C3/who`), nine bars in all.
  - Evidence: `dump_score.py song.folk.when-the-saints.alternating` bars 0 and 8.
  - Reader 1: WRONG (it is a common engraving convention, not a rule, and this rung's own example does not follow it) — the `.mxl` re-read note by note: bar 0 is `C4 E4 F4`, three quarters, a three-beat pickup in 4/4, and the last bar, bar 8, is `C3` as a **whole note**, a full four beats. Nine bars in all, so the missing beat is never made up. The sentence states the convention two lines before naming *When the Saints*, where it is false. Smallest true change: "often the first bar is short and the missing beats are taken off the end" — and this piece is then the example of the other case.
- [x] **FALSE** `content/lessons/1.4.md:45` — "then the treble one from the last rung"
  - Is: the last rung (1.3) has only the left-hand sight-reading drill. The treble one (`drill.reading.sight-reading-1`) is on the *next* rung, 1.5.
  - Evidence: every rung's `exerciseOptions` searched for the nine `sight-reading` drills: `sight-reading-1-left` on 1.3 and 1.4, `sight-reading-1` first on 1.5.
  - Fixed: now "then a treble one from the next rung's drill" — every rung's options searched for `sight-reading`: `sight-reading-1-left` on 1.3 and 1.4, `sight-reading-1` first on 1.5.
  - Second read (2026-09-22): HOLDS — every rung in `stage-0.json` … `stage-9.json` scanned for an option whose id contains `sight-reading`: `drill.reading.sight-reading-1-left` appears on 1.3 and 1.4 and nowhere else, and the plain treble `drill.reading.sight-reading-1` appears on 1.5 alone. 1.5 is the rung after 1.4 in the core track, so "the next rung's drill" is right and "the last rung" was not.
  - Row: `lessonClaimsAboutApp.test.ts` › "1.4: the left-hand sight-reading drill is on this rung and the treble one is on the next" — scans the authored stages for both ids.
- [x] **FALSE** `content/lessons/1.4.md:49` — "choose the right hand, switch *Duet* on in the ⋯ menu"
  - Is: Duet is already on by default once R is chosen (`playbackHands: 'non-focused'`); the row reads *On*, and pressing it turns the left hand off.
  - Evidence: `settingsStore.ts:156`; `ScoreScreen.ts:961-973` (toggle), `:2336-2344` (row shows On when `playbackHands !== 'none'`).
  - Fixed: now "leave *Duet* on in the ⋯ menu (it is on unless you have turned it off)" — `settingsStore.ts:156`; the toggle in `ScoreScreen.ts` switches `playbackHands` to `none` and back.
  - Second read (2026-09-22): HOLDS — `DEFAULT_SETTINGS.playbackHands` is still `'non-focused'` (`settingsStore.ts:156`), which is Duet on, and the ⋯ row toggles it to `'none'`; so on a rung whose pieces alternate hands, choosing R does leave the app playing the left-hand answers. Same constant as the `0.3` finding above, checked once and cited twice.
  - Row: covered by the `0.3` Duet row (one constant, one row); no second row.
- [x] **FALSE** `content/lessons/1.4.md:53` — "One alternating-hands tune at 70 bpm at 90 %"
  - Is: holds for *Ode to Joy (hands alternating)* (84 bpm → 83 %); *When the Saints (hands alternating)* at 70 bpm is 73 % of its 96 and does not pass.
  - Evidence: catalog `tempoBpm`; `settingsStore.ts:138`.
  - Fixed: now "at 90 % with the tempo at 80 % or more of the piece's own" — catalog `tempoBpm` (84, 96, 88); `settingsStore.ts:138`.
  - Second read (2026-09-22): WRONG (this rung asks for 85 %, not 80 %) — the fix was right on 2026-09-19, when every run was judged at the Settings pair, and T10 (Entry 24 item 1) made it wrong the same week: `masteryCriteriaFor` now judges a run of a rung's material against **that rung's** `minAccuracy` and `minTempoPct`, and rung 1.4's `mastery` is `{minAccuracy: 0.9, minTempoPct: 0.85}`. So the lesson was telling the learner a pass is 80 % of tempo when the app wanted 85 %. This is the one case in batches 1–3: every rung with a lesson file was swept for a percentage its own `mastery` does not state, and 1.4 was the only disagreement (1.1's and 2.3's 95 % are a learner's target and the rung's own `mastery.custom` respectively; 0.3 states the app-wide default, which is right for a piece on no rung).
  - Second-read fix (2026-09-22): `1.4.md:54` now reads "the tempo at 85 % or more of the piece's own". One character; `readingTime` recounted (466 words → 3, unchanged).
  - Row: `lessonClaimsAboutApp.test.ts` › "1.4: this rung asks for 85 % of tempo, which is what its lesson now quotes" — reads `masteryCriteriaFor(rung('1.4')).passTempoPct` against the authored `minTempoPct`, and asserts it is *not* the app-wide default, which is the thing that went wrong.

Not checked in this lesson: nothing. Checked and true: grand staff and middle C's two positions (THEORY); in all three songs the hands never sound together (`dump_score.py` on `ode-to-joy.alternating` — RH bars 1–4, LH bars 5–8; `when-the-saints.alternating` — RH bars 0–3, LH bars 4–8; `lightly-row` — one staff); 3/4 and the dotted half (THEORY); *When the Saints* starts on beat two with a three-beat pickup (bar 0 `C4 E4 F4` quarters), lands its long note on beat one of bar 1 (`G4/who`), and its answering bars begin with a rest (bar 2 RH, bar 4 LH); *Ode to Joy (hands alternating)* is right hand then left; the left-hand sight-reading drill is on this rung and on 1.3.

## 1.5 — `content/lessons/1.5.md`

Claims checked: 20. Findings: 2.

- [x] **FALSE** `content/lessons/1.5.md:46` — "whose melody is nearly all steps with one skip a phrase"
  - Is: it opens with a leap of a fourth (bar 1 D4→G4, again bar 5 D4→G4), bar 9 has two skips in a row (B4→G4→E4), and bar 10 another (E4→G4). Mostly steps, but not one skip a phrase.
  - Evidence: `dump_score.py song.folk.the-water-is-wide.pdmx` bars 1–11.
  - Fixed: now "mostly steps, with a few skips and a leap of a fourth from D up to G" — `dump_score.py song.folk.the-water-is-wide.pdmx`: bar 1 D4→G4, bar 5 D4→G4, bars 8–9 B4→G4→E4. "slow Scottish air" left as it was (the JUDGEMENT below).
  - Second read (2026-09-22): HOLDS — every melodic interval of the whole file counted from the `.mxl`: 36 note-to-note moves, of which 10 are repeats and 26 are moves; 19 are a semitone or a tone (steps), 5 are thirds, and **2 are a perfect fourth — the largest interval in the piece — and both are D4 up to G4** (bar 1 and bar 5). So "mostly steps", "a few skips" and "a leap of a fourth from D up to G" are each right, and the fourth really is the outer limit rather than an example.
  - Row: `lessonClaimsAboutMusic.test.ts` › "1.5: The Water Is Wide is mostly steps and its largest leap is the fourth D4–G4" — reads every interval of the built score.
- [ ] **JUDGEMENT** `content/lessons/1.5.md:46` — "a slow Scottish air"
  - Is: the app plays and scores it at 96 bpm, a tempo the import defaulted (`tags: tempo-defaulted`), not a slow one; whether the air is "slow" as sung is a musician's call. "Scottish" matches the catalog's `composer: Traditional (Scottish)` (HISTORY, not further checked).
  - Evidence: catalog row `song.folk.the-water-is-wide.pdmx` (`tempoBpm: 96.0`, `tags: ["pdmx","tempo-defaulted"]`).
  - Reader 1: REWRITE — "*The Water Is Wide* is the tune: a Scottish air whose melody is mostly steps…" — drop "slow" and keep "Scottish". "Slow" is the one word a reader can check against the app and find false: the row's `tempoBpm` is 96.0 and its `tags` include `tempo-defaulted`, so the app plays and judges it at an imported default rather than at a slow tempo, and nothing here has been heard. "Scottish" is a HISTORY claim the catalog supports (`composer: Traditional (Scottish)`) and is not worth disturbing.

Not checked in this lesson: whether a chain of eight in Simon is "a real achievement" (judgement). Checked and true: step = 2nd line-to-space, skip = 3rd line-to-line (THEORY); the sight-reading generator gives a new four-bar phrase on each open (`ScoreScreen.ts:138-160`, `drill.reading.sight-reading-1` `bars: 4`); the ear drill is 2nd vs 3rd played back (`drill.ear.interval-2nd-3rd` intervals m2 M2 m3 M3; `DrillScreen.ts:1705-1710`); *Steps and Skips in C* has only 2nds and 3rds within C4–G4 (`dump_score.py exercise.reading.steps-and-skips-c`, every interval in bars 1–8); Simon plays a chain that grows by one, starts with keys lit and named (`help: show-keys`), fills a staff on the card as the chain sounds (`STAFF_POLICY` comment, `app/src/engine/drills/types.ts`), and has three help chips (`simon.ts:151-180`); Today's sight-read sits outside the session card, is chosen by stage, and keeps one seed per day (`TodayScreen.ts:176-183`, `:379-420`).

## practice.1 — `content/lessons/practice.1.md`

Claims checked: 6. Findings: 1.

- [x] **FALSE** `content/lessons/practice.1.md:37` — "The drills do this to themselves now."
  - Is: only the prompt-card drills offer *Go over the ones you missed* (`promptsToGoOver` runs only when the drill is a `PromptDrill`). Rhythm, Simon, pedal, dynamics, backing-track and harmonic-dictation drills do not. The one drill on this rung, `drill.rhythm.mixed-values`, is a `RhythmDrill` and offers no go-over.
  - Evidence: `DrillScreen.ts:2032` (`drill instanceof PromptDrill ? promptsToGoOver(...) : []`); `app/src/engine/drills/fromCatalog.ts:564` (`new RhythmDrill`), `:483` (`SimonDrill`), `:540` (`ChordDictationDrill`), `:573-591` (pedal, dynamics, backing track).
  - Fixed: now "The card drills, which ask one question a card, do this to themselves now (the rhythm drill on this rung does not)." — `DrillScreen.ts:2032` (`drill instanceof PromptDrill ? promptsToGoOver(…) : []`); `drill.rhythm.mixed-values` is `kind: rhythm`, built as `RhythmDrill`.
  - Second read (2026-09-22): HOLDS — the gate is still there, at `DrillScreen.ts:2173` now: `const goOver = drill instanceof PromptDrill ? promptsToGoOver(result, seen) : []`. Rung practice.1's own options were read rather than assumed: its one drill is `drill.rhythm.mixed-values`, `kind: rhythm`, which `fromCatalog` builds as a `RhythmDrill` and not a `PromptDrill`, so the parenthesis is right about this rung's drill as well as about the class of them.
  - Row: `lessonClaimsAboutApp.test.ts` › "practice.1: the rhythm drill this rung offers is not a card drill, so it gets no going-over" — builds the real catalog row and checks what class it is.

Not checked in this lesson: nothing. Checked and true (for prompt drills): the go-over round holds only the missed or revealed prompts, shows the answer from the first moment, and records nothing (`app/src/engine/drills/review.ts:37-73`, `DrillScreen.ts:950`, `:2231-2285`).

## practice.2 — `content/lessons/practice.2.md`

Claims checked: 9. Findings: 2.

- [x] **FALSE** `content/lessons/practice.2.md:37` — "a clean pass takes the tempo up a notch while a pass with a mistake takes it down — the rule above"
  - Is: the rule above (line 25) is three clean repetitions before going up; the app goes up after every single clean pass of the loop.
  - Evidence: `ScoreScreen.ts:1500-1530` (`climbLadder` calls `nextLadderTempo` on each lap); `PracticeEngine.ts:103-108`.
  - Fixed: the tools paragraph now says the Ladder is "the rule above made quicker: it moves after every pass rather than every three, its notch is ten points of the written tempo, and it stops climbing at full tempo unless you had already set it higher" — `PracticeEngine.ts` `LADDER_NOTCH_PCT = 10`, `LADDER_CEILING_PCT = 100`, `nextLadderTempo`; `ScoreScreen.ts` `climbLadder` runs on every lap.
  - Second read (2026-09-22): HOLDS on all three clauses — `PracticeEngine.ts:67` `LADDER_NOTCH_PCT = 10`, `:77` `LADDER_CEILING_PCT = 100`, and `:103-108` `nextLadderTempo` adds or subtracts one notch per pass against `ceiling = min(MAX_TEMPO_PCT, max(LADDER_CEILING_PCT, pass.startedAtPct))` — which is exactly "stops climbing at full tempo unless you had already set it higher". `ScoreScreen.ts:1599-1611` `climbLadder` is called once per lap, with `clean` measured as no new missed and no new wrong note, so it does move after every pass and not every three.
  - Row: `lessonClaimsAboutApp.test.ts` › "practice.2: the Ladder moves one notch a pass and stops at the written tempo unless the learner set it higher" — drives `nextLadderTempo` and reads the two constants from `PracticeEngine`.
- [x] **FALSE** `content/lessons/practice.2.md:26` — "up one notch — about 5 %, not 20."
  - Is: as a rule for the learner this is advice, but the app's Ladder, which line 38 says applies "the rule above", moves 10 percentage points of the written tempo per notch (so from 50 % to 60 % is +20 % of the current speed), and stops at 100 % unless the learner started above it.
  - Evidence: `app/src/engine/PracticeEngine.ts:67` (`LADDER_NOTCH_PCT = 10`), `:77` (`LADDER_CEILING_PCT = 100`), `:103-108`.
  - Fixed: line 26 is left as the learner's own rule (about 5 %), and the false join is cut where it was made — the tools paragraph (line 37 finding above) no longer calls the Ladder "the rule above" unqualified, and states its ten-point notch.
  - Second read (2026-09-22): HOLDS — `practice.2.md:24-25` still reads "Three clean repetitions, then up one notch — about 5 %, not 20", with no mention of the app in the paragraph, and `:35-38` now qualifies the join ("the rule above **made quicker**") and states the ten-point notch. So the only sentence in the lesson that describes the app is the tools one, and that one is under test by the row above.
  - Row: none — as it now stands `:26` is the learner's own practice rule and asserts nothing about the app or the music. The app claim it used to carry is the row above.

Not checked in this lesson: the claims about why slow practice works (teaching advice). Checked and true: the Ladder is in the ⋯ menu, needs a loop, and underlines the tempo figure while on (`ScoreScreen.ts:925-945`, `:2318-2324`; `ScoreScreen.css:25-29`).

## practice.3 — `content/lessons/practice.3.md`

Claims checked: 7. Findings: 1.

- [ ] **JUDGEMENT** `content/lessons/practice.3.md:14` — "It also produces markedly better retention a week later"
  - Is: a claim from motor-learning research (interleaved practice); plausible, but "markedly" and "a week later" should be confirmed by someone who knows the literature. The same goes for line 10 ("most of that climb is gone by tomorrow").
  - Evidence: not checkable in the repo.
  - Reader 1: REWRITE — "Interleaving feels worse in the session and is what the material is still there for a week later." The claim to drop is the size and the timing — "markedly" and "a week later" are a research result stated as a number, and nothing in this repository is the study. The same for `:10`: "most of that climb is gone by tomorrow" → "much of that climb does not last the night".

Not checked in this lesson: nothing. Checked and true: review at 1, 3, 7 and 21 days after the first pass (`progressStore.ts:48`, `:486-510`); Today's sight-read sits outside the session card and is described in code as three minutes a day (`TodayScreen.ts:176-183`).

## practice.4 — `content/lessons/practice.4.md`

Claims checked: 8. Findings: 2.

- [ ] **JUDGEMENT** `content/lessons/practice.4.md:8` — "Piano injuries are real and they are almost always the result of practising through a warning rather than of one dramatic event."
  - Is: a factual-sounding medical generalisation; for a teacher or clinician to confirm.
  - Evidence: not checkable.
  - Reader 1: REWRITE — "Piano injuries are real, and they usually arrive slowly: the warning comes first and the injury comes from playing through it." Keeps the safety advice, which is the point of the paragraph, and drops "almost always", which is a clinical frequency this repository has no source for. Flagged as safety copy: the rewrite must not make the warning sound optional, and the coordinator should keep the imperative that follows it.
- [ ] **JUDGEMENT** `content/lessons/practice.4.md:42` — "Four twenty-minute sessions beat one eighty-minute one, both for learning and for your hands."
  - Is: consistent with distributed-practice research; for a teacher to confirm as stated.
  - Evidence: not checkable.
  - Reader 1: REWRITE — "Several short sessions in a day are kinder to your hands than one long one, and you will usually remember more from them." The four-and-twenty and the eighty are a result presented as arithmetic; the direction is the teaching and is what survives.

Not checked in this lesson: the medical advice on pain, numbness and seeing a doctor — safety advice, left as written. The lesson makes no claim about the app.

## practice.5 — `content/lessons/practice.5.md`

Claims checked: 8. Findings: 1.

- [ ] **JUDGEMENT** `content/lessons/practice.5.md:27` — "It takes a week and it is the only thing that works."
  - Is: a factual-sounding absolute about relearning a bad habit; for a teacher to confirm.
  - Evidence: not checkable.
  - Reader 1: REWRITE — "It takes longer than you want it to, and nothing else works as well." Two claims are being made in seven words — a duration ("a week") and an exclusivity ("the only thing that works") — and neither is checkable here. The rewrite keeps the discouragement of shortcuts, which is what the paragraph is for.

Not checked in this lesson: the diagnostic in lines 37–39 (teaching advice). Checked and true: "the first lesson in this module" is chunking (`practice.1`, first in unit `practice.1.1`); *Rhythm only* judges timing and not pitch (`ScoreScreen.ts:895-915`) and *Blind* hides the notation while still judging (`:1100`).

## 2.1 — `content/lessons/2.1.md`

Claims checked: 22. Findings: 5.

- [x] **FALSE** `content/lessons/2.1.md:35` — "The hands-together pattern drill (left hand holds C, right hand walks the five fingers)"
  - Is: `drill.technique.ht-holds` (`kind: five-finger`, `hands: both`, `leftHand: hold`) is built as a right-hand call-and-response: the app plays C4 D4 E4 F4 G4 F4 E4 D4 C4 and asks for it back "with the right hand". There is no left-hand part; `leftHand` is read by nothing, and `hands: both` is treated as right.
  - Evidence: `app/src/engine/drills/fromCatalog.ts:152-156` (five-finger is a notation kind), `:223-228`, `:611-636` (`buildTechniquePattern`: `root = hands === 'left' ? tonic - 12 : tonic`, prompt text names the right hand).
  - Fixed: now "The five-finger pattern drill (the app plays a right-hand walk up and down and you play it back; the left hand is not in it)" — `fromCatalog.ts` `buildTechniquePattern`: `hands: both` is not `left`, so root = tonic, prompt names the right hand; `leftHand` read nowhere. Building a real left-hand-holds drill is the owner's call.
  - Built (2026-09-21): `leftHand: "hold"` is read (`fromCatalog.ts` `buildTechniquePattern`): the drill puts the tonic an octave below at the head of the pattern and the card says "Hold the low C down with the left hand, then play the pattern back with the right hand over it". The sentence now names a drill with a left hand in it.
  - Second read (2026-09-22): WRONG (the code was built and **the sentence was never changed**) — `fromCatalog.ts:673-686` reads `leftHand: "hold"` and puts `root - 12` at the head of the walk, and `:701-703` gives the card "Hold the low C down with the left hand…", exactly as the Built line says. But `2.1.md:35-36` still read "the app plays a right-hand walk up and down and you play it back; **the left hand is not in it**", which the build made false. Entry 24's own file list does not name `content/lessons/2.1.md`, so the Built line describes an edit that was not made. (The sample read this as HOLDS on 2026-09-21 against the pre-build code, which was right then.)
  - Second-read fix (2026-09-22): `2.1.md:35-38` now reads "…and you play it back, with the left hand holding the low C under it — the card asks for the hold, and only your ear judges whether it stayed down". The caveat is the code's own (`fromCatalog.ts:678-684`: the drill judges which keys arrive and in what order, so it cannot tell a held note from a struck one). `readingTime` recounted (528 words → 3, unchanged).
  - Row: `lessonClaimsAboutApp.test.ts` › "2.1: the hands-together drill puts a low C under the walk and asks for it to be held" — builds the real catalog row, checks the first expected pitch is an octave below the tonic and that the card's sentence names the hold.
- [x] **FALSE** `content/lessons/2.1.md:44` — "*Simple Gifts*, the Shaker melody, is on this rung: the left hand holds a note per bar"
  - Is: `song.folk.simple-gifts.pdmx` is a single treble staff with no left hand at all (`staves: 1`, `hands: right`). It is not a hands-together piece.
  - Evidence: `dump_score.py song.folk.simple-gifts.pdmx` bars 1–16 (RH only); catalog `notation.staves: 1`.
  - Fixed: now "on this rung as a right-hand tune on one staff, with no left hand written … It is the right hand's half of this lesson; the hands-together work is in the four tunes above." — catalog `notation.staves: 1`; `dump_score.py` bars 1–16 RH only.
  - Second read (2026-09-22): HOLDS — every note of the `.mxl` carries `<staff>1</staff>` (one distinct staff over all 16 bars), the catalog's measured `notation.staves` is 1 and `hands` is `right`. The second clause is right too: rung 2.1's five `songOptions` are the four `.ht` settings plus this one, so "the four tunes above" is the whole of the rest of the rung.
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.1: Simple Gifts is one staff and the rung's other four songs are the hands-together settings".
- [x] **FALSE** `content/lessons/2.1.md:45` — "a tune that moves in steps and small skips"
  - Is: mostly steps and thirds, but it also leaps a fifth (bar 12 D5→G4; bars 8→9 C5→G5) and runs eighth notes and dotted quarters throughout, in B4–G5.
  - Evidence: `dump_score.py song.folk.simple-gifts.pdmx` bars 8, 9, 12.
  - Fixed: now "mostly steps and thirds with the odd leap of a fifth, in eighths and dotted quarters" — `dump_score.py song.folk.simple-gifts.pdmx` bars 8–9 (C5→G5), 12 (D5→G4).
  - Second read (2026-09-22): OVERREACH (the rhythm is eighths and plain quarters; only five of the thirty-one quarters are dotted) — every note of the `.mxl` counted: 45 eighths, 31 quarters, 4 halves, and `<dot/>` appears on exactly five notes, all quarters, in bars 6, 9, 10, 12 and 13. So "in eighths and dotted quarters" names as the piece's rhythm a figure that is in five of its bars. The interval half of the sentence is right and better than the fix line claimed: of the 79 note-to-note moves, 44 are steps, 7 are thirds, and **the fifth is the largest interval in the piece and happens exactly twice** — C5→G5 across bars 8–9 and D5→G4 in bar 12 — so "the odd leap of a fifth" is exact. (The audit's "B4–G5 range" was wrong in the other direction: the piece reaches G4.)
  - Second-read fix (2026-09-22): `2.1.md:46-48` now reads "in eighths and quarters, a few of the quarters dotted". `readingTime` recounted (533 words → 3, unchanged).
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.1: Simple Gifts is mostly steps and thirds, its largest leap is a fifth, and few of its quarters are dotted" — reads the intervals and the `<dot/>` elements of the built score.
- [x] **FALSE** `content/lessons/2.1.md:49` — "Choose the right hand and switch it on"
  - Is: the rung's tool button (*Play it as a duet*) opens *Ode to Joy (hands together)* in Keep tempo with R already chosen, and Duet is already on by default; switching it "on" from there turns it off.
  - Evidence: rung 2.1 `tools: [{kind: duet}]`; `LessonScreen.ts:440-447` (`navigateScore(id, { mode: 'tempo', hands: 'R' })`, first playable song); `settingsStore.ts:156`; `ScoreScreen.ts:961-973`.
  - Fixed: now "*Play it as a duet* opens a hands-together tune with the right hand chosen and Duet already on" (and "long notes" for "whole notes": the left hands hold halves too) — rung 2.1 `tools: [duet]`; `LessonScreen.ts` `navigateScore(id, { mode: 'tempo', hands: 'R' })`; `settingsStore.ts:156`.
  - Second read (2026-09-22): HOLDS, and it is now true by construction rather than by default — `LessonScreen.ts:512-519` `case 'duet'` calls `setDuetPlayback()` before `navigateScore(id, { mode: 'tempo', hands: 'R' })`, and `setDuetPlayback` (`:461-465`, added by T17 on 2026-09-22) writes `playbackHands: 'non-focused'` unless it is already `both`. So the button really does open the rung's first playable song with R chosen and Duet on, even for a learner who had turned it off. The "long notes" clause was checked against all four `.ht` songs rather than one: every left-hand note in the four is a whole or a half (ode 6 wholes + 4 halves, twinkle 2 + 20, jingle-bells 5 + 6, mary 8 wholes), so there is not a quarter in any of them.
  - Row: `lessonClaimsAboutApp.test.ts` › "2.1: the duet button opens the rung's first playable song with the right hand chosen" — the tool half, read off the authored rung and the `LessonScreen` source. **The music half is not under test:** "the left hand's long notes come from the app" would need every left-hand note of the four `.ht` songs, and the four are already covered for their staff count by the `2.1` Simple Gifts row rather than for their note values. Enumerated by hand above and left there.
- [x] **FALSE** `content/lessons/2.1.md:55` — "Hands together at 60 bpm at 90 % in Tempo mode"
  - Is: at 60 bpm only *Mary Had a Little Lamb (hands together)* (72 bpm → 83 %) records a pass; *Ode to Joy (HT)* 88 → 68 %, *Twinkle (HT)* 84 → 71 %, *Jingle Bells (HT)* 104 → 58 %.
  - Evidence: catalog `tempoBpm` for each `.ht` id; `settingsStore.ts:138`.
  - Fixed: now "Hands together at 90 % in Keep tempo, at 80 % or more of the piece's own tempo" — catalog `tempoBpm` of the four `.ht` songs; `settingsStore.ts:138`.
  - Second read (2026-09-22): HOLDS — rung 2.1's `mastery` is `{minAccuracy: 0.9, minTempoPct: 0.8}`, so since T10 the rung's own pass is 90 % and 80 %, which is what the sentence says. (Checked deliberately against the rung and not against Settings, because that is what made the identical sentence in `1.4.md` wrong.)
  - Row: `lessonClaimsAboutApp.test.ts` › "2.1: this rung's own pass is the 90 % and 80 % the lesson quotes".

Not checked in this lesson: nothing. Checked and true (the four `.ht` songs, each read in `dump_score.py`): the left hand plays only whole and half notes, one or two a bar; columns coincide only on beats 1 and 3; the left hand stays on C3/F3/G3 with 5 on C3, 2 on F3, 1 on G3 (`<fingering>` read per note: every C3 is 5, every F3 is 2, every G3 is 1); all four are on the rung under their hands-together settings.

## 2.2 — `content/lessons/2.2.md`

Claims checked: 21. Findings: 6.

- [x] **FALSE** `content/lessons/2.2.md:36` — "— and *Old MacDonald*."
  - Is: listed as the second eighth-note tune after *London Bridge*, but `song.folk.old-macdonald` has no eighth notes: quarters, halves and a whole note only.
  - Evidence: `dump_score.py song.folk.old-macdonald` bars 1–8 (e.g. bar 1 `C4/qua ×3 G4/qua`, bar 4 `C4/who`).
  - Fixed: *Old MacDonald* replaced by "*Sakura*, whose eighth pairs sit on the second beat of a bar" — `dump_score.py song.folk.old-macdonald`: no eighths; `song.folk.sakura.pdmx` (on the rung, 4/4) bars 4, 6, 8, 10 have a quarter then an eighth pair on beat 2.
  - Second read (2026-09-22): OVERREACH (the pairs are on the second beat in four of the five bars, not in all of them) — the removal's premise holds: a `<type>` census of the whole of *Old MacDonald* from the `.mxl` gives 20 quarters, 2 halves and 2 wholes and **no eighth of any kind**, so it could not have illustrated eighths. *Sakura* is on rung 2.2, is in 4/4, and its ten eighths are five pairs, in bars 4, 6, 8, 10 and 14. **Bar 14 is the exception and I had it wrong first time:** bars 4, 6, 8 and 10 open with a quarter and put the pair on beat 2, but bar 14 is `B4/eig A4/eig F4/qua E4/hal` — the pair is on beat *one*. My first draft of this line said all five, written from the four bars the fix line names plus an assumption about the fifth; the row below is what caught it, on its first run.
  - Second-read fix (2026-09-22): `2.2.md:36-37` now reads "*Sakura*, whose eighth pairs **mostly** sit on the second beat of a bar". One word; `readingTime` recounted (511 words → 3, unchanged).
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.2: Sakura's eighths come in pairs, mostly on the second beat, and Old MacDonald has none" — asserts every pair is a pair and that exactly one of them is not on beat two, so a fifth pair moving would break it.
- [x] **FALSE** `content/lessons/2.2.md:42` — "*Alouette* is the tune with the eighth notes in it"
  - Is: `song.folk.alouette.pdmx` is in 6/8 (F major, one flat), where the eighth is the counting unit and every bar is dotted quarters, quarters and eighths — not the paired eighths in 4/4 this lesson teaches.
  - Evidence: `dump_score.py song.folk.alouette.pdmx`: `times: ['6/8']`, key `-1`; bars 1–16.
  - Fixed: now "*Alouette* has eighth notes too, but in 6/8, where the eighth is the counting unit" — `dump_score.py song.folk.alouette.pdmx`: `times ['6/8']`, key −1.
  - Second read (2026-09-22): HOLDS — the catalog's measured `notation` for `song.folk.alouette.pdmx` is `times ['6/8']` and one key signature of one flat, and the `.mxl` confirms 20 eighths among 44 quarters and 2 halves. So it does have eighths and it is in 6/8, which is the whole of the corrected clause.
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.2: Alouette is in 6/8 and has eighth notes in it".
- [x] **FALSE** `content/lessons/2.2.md:43` — "the \"gentille Alouette\" figure is four quick notes"
  - Is: the four-note figure (bars 3, 7, 19, 23: G F G A) is written quarter–eighth–quarter–eighth in 6/8 — a long-short lilt, not four quick equal notes.
  - Evidence: `dump_score.py song.folk.alouette.pdmx` bar 3 `G4/qua F4/eig G4/qua A4/eig`.
  - Fixed: now "the figure is quarter, eighth, quarter, eighth, a long–short lilt rather than four quick notes" — bar 3 `G4/qua F4/eig G4/qua A4/eig`. The counting clause after it is the THEORY finding below and is left as written.
  - Second read (2026-09-22): HOLDS — every bar of the `.mxl` was matched against the pattern rather than one bar being read: bars 3, 7, 9, 11, 19 and 23 are exactly quarter–eighth–quarter–eighth (bar 3 is `G4 F4 G4 A4`), which is six bars and not the four the audit's evidence line named. No bar of the piece holds four equal eighths.
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.2: the gentille Alouette figure is quarter–eighth–quarter–eighth, never four equal notes" — matches the note types per bar in the built score.
- [ ] **THEORY** `content/lessons/2.2.md:43` — "if you count \"1 and 2 and\" out loud through it the rhythm places itself."
  - Is: believed wrong for this score: in 6/8 a quarter–eighth pair fills one dotted-quarter beat ("1-2-3" or "1 and-a"), so a duple "1 and 2 and" count does not line up with it.
  - Evidence: as above; theory.
  - Open: THEORY — needs a musician. The fix to the two findings above now describes the figure as 6/8 beside this duple count, so the conflict is on the page; the clause was left as written because it is a theory call.
  - Reader 1: RIGHT, and **the sentence this finding quotes no longer exists** — T10 (Entry 24 item 10) rewrote it. `2.2.md:46-47` now reads: 'Count that one "1 2 3 4 5 6" rather than "1 and 2 and" — an "and" splits a beat in two, and here a beat holds three.' That is the correct statement of the thing the finding said was wrong, so the finding is closed by the text as it stands and needs no musician. The reasoning still checks out against the score: `alouette.pdmx` is 6/8, and its quarter-plus-eighth fills one dotted-quarter beat, which a duple "1 and" cannot count.
- [x] **FALSE** `content/lessons/2.2.md:45` — "with eighths in it once you have earned them."
  - Is: `drill.reading.sight-reading-2-right` is fixed at level 2, whose rhythm pool always includes eighths; nothing adapts to the learner, so eighths can appear in the first phrase.
  - Evidence: catalog params `{level: 2, bars: 4, hands: right}`; `app/src/engine/sightReading.ts:153-162` (level 2 rhythms include `DIVISIONS / 2`), `:310-335` (`pickRhythm` draws uniformly).
  - Fixed: now "and eighths can turn up in the very first one" — catalog params `level: 2`; `sightReading.ts` level 2 rhythms include `DIVISIONS / 2`, nothing adapts.
  - Second read (2026-09-22): HOLDS — `drill.reading.sight-reading-2-right` is `{level: 2, bars: 4, hands: right}`, and `sightReading.ts:159-168` gives level 2 `rhythms: [DIVISIONS / 2, DIVISIONS, DIVISIONS * 2, DIVISIONS * 3]`, the first of which is the eighth. `pickRhythm` (`:310-332`) draws from the affordable cells with no reference to the learner's history, so an eighth is available in bar 1 of the first phrase. Nothing between the catalog row and the generator reads a progress record.
  - Row: `lessonClaimsAboutApp.test.ts` › "2.2: the sight-reading drill on this rung has eighths in its pool from the first phrase" — reads the level the row names and that level's rhythm pool from `sightReading`.
- [ ] **JUDGEMENT** `content/lessons/2.2.md:20` — "Almost every rhythm problem a beginner has is a subdivision problem"
  - Is: a factual-sounding generalisation for a teacher to confirm.
  - Evidence: not checkable.
  - Reader 1: REWRITE — "When a rhythm will not sit still, the subdivision is the first thing to look at." The advice is the useful part; "almost every" is a frequency over all beginners and is the part nobody here can stand behind.

Not checked in this lesson: nothing. Checked and true: the count-in is drawn over the score (`ScoreScreen.ts:372-381`, fed by `onBeat` in `ScoreSession.ts:129-137`); eighth-note value, flag and beam (THEORY); *London Bridge* has its eighth pair in bar 1 (`A4/eig G4/eig`) and a marked position with the thumb on D (bar 3 `D4(1)`) putting A under 5 (bar 1 `A4(5)`); *Rhythm only* is in the ⋯ menu only in Keep tempo, takes one tap per written note or chord on any key (`ScoreScreen.ts:909-914`, `:2310-2311`). The mastery line "one tune hands together" can be met only by *London Bridge*: of the rung's eight songs it is the only one with two staves (the other seven, checked in the catalog `notation.staves`, have one); at 72 bpm it is 82 % of its 88 and passes.

## 2.3 — `content/lessons/2.3.md`

Claims checked: 24. Findings: 7.

- [x] **FALSE** `content/lessons/2.3.md:32` — "The left hand in these pieces plays the symbol as a block — all three notes at once"
  - Is: true of 2 of the rung's 7 songs. *Happy Birthday (simple)* and *Jingle Bells (G)* have block triads. *Happy Birthday* (full, `song.folk.happy-birthday`) plays rests on beat 1 and two-beat chords after it, mostly inverted sevenths (bar 2 D3-F3-G3, bar 5 E3-A♯3-C4). *Was wollen wir trinken*, *Dark Eyes*, *Auld Lang Syne* and *Skip to My Lou* are single-staff melodies with symbols and no left hand at all.
  - Evidence: `dump_score.py` on all seven `songOptions`; catalog `notation.staves` = 1 for the four `.pdmx` songs.
  - Fixed: now "Where a piece on this rung writes the left hand out as blocks, as *Happy Birthday (simple)* and *Jingle Bells* do, it plays the symbol as a block … Four songs print only the tune and its symbols." — `dump_score.py` on the seven songs: blocks in `happy-birthday.simple` and `jingle-bells.g`; the four `.pdmx` songs `staves: 1`; the full *Happy Birthday* (rests and inverted chords) is not named as block chords any more.
  - Second read (2026-09-22): HOLDS, on all three of its counts — every left-hand note of all seven `songOptions` read from the `.mxl`. `happy-birthday.simple` is C3–E3–G3, G2–B2–D3 and F2–A2–C3, a root-position triad struck as one chord in every bar; `jingle-bells.g` is G3–B3–D4, C3–E3–G3 and D3–F♯3–C4, the same. The four with one staff are `was-wollen-wir-trinken`, `dark-eyes`, `auld-lang-syne` and `skip-to-my-lou` — measured `notation.staves: 1` on each, so "Four songs" is exactly right. The full *Happy Birthday* is the seventh and is correctly no longer named: its left hand rests on beat 1 of bars 1–7 and its chords include B2–F3–G3 and E3–A♯3–C4, which are neither root position nor triads.
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.3: two of the rung's seven songs write block triads in the left hand and four print only a tune and symbols".
- [x] **FALSE** `content/lessons/2.3.md:43` — "then *Happy Birthday* and *Jingle Bells* with block chords."
  - Is: the rung's *Jingle Bells* (`song.holiday.jingle-bells.g`) is in G major and its blocks are G, C and D7 — not the C, F, G the lesson names as "the three chords of this unit". *Happy Birthday (simple)* prints a G7 symbol (`G dominant`) over a plain G-B-D triad.
  - Evidence: `dump_score.py song.holiday.jingle-bells.g` bars 1–8 (key 1 sharp; `D3+F#3+C4` in bars 7–8); `dump_score.py song.folk.happy-birthday.simple` bars 2–3 (`[G dominant]` over `G2+B2+D3`).
  - Fixed: now "*Happy Birthday (simple)*, whose blocks are C, F and G (its G7 symbol sits over a plain G triad), and *Jingle Bells*, which is in G, so its blocks are G, C and D7." — `dump_score.py song.holiday.jingle-bells.g` (key 1, `D3+F#3+C4` bars 7–8); `happy-birthday.simple` bars 2–3 `[G dominant]` over `G2+B2+D3`.
  - Second read (2026-09-22): HOLDS — `happy-birthday.simple`'s measured `notation.chords` are exactly `['C', 'F', 'Gdominant']`, and the notes under the G symbol in bars 2, 3, 6 and 7 are G2–B2–D3 with no F in them, so "its G7 symbol sits over a plain G triad" is right and is true of all four of its G bars, not one. `jingle-bells.g` is `fifths 1` with `notation.chords` exactly `['C', 'Ddominant', 'G']`, and its D bars are D3–F♯3–C4 — root, third and seventh, so the D7 is really sounded.
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.3: Happy Birthday (simple) names C, F and a G7 over a plain G triad, and Jingle Bells is in G over G, C and D7".
- [x] **FALSE** `content/lessons/2.3.md:41` — "you play all three notes together and MIDI checks them"
  - Is: the chord drill collects every note pressed since the card appeared and marks it right as soon as the set matches, so the three notes played one after another (a roll, or an arpeggio) also pass. "Together" is not checked.
  - Evidence: `app/src/engine/drills/PromptDrill.ts:93-111` (`held.push` on each note-on, `sameSet(held, expected)`; no timing window).
  - Fixed: now "you play all three notes and MIDI checks them; it accepts them one after another too, so keep them together" — `PromptDrill.ts` `feed`: `held.push` on each note-on, `sameSet`, no time window.
  - Second read (2026-09-22): HOLDS — `PromptDrill.feed` (`:93-112`) pushes every note-on onto `held` and, for an unordered prompt, settles as soon as `sameSet(this.held, prompt.expected)` is true. There is no timestamp comparison anywhere in the method: the only use of `tMs` is `settle`'s reaction time, after the judgement. So three notes played one at a time are the same event to the drill as three played together, which is what the sentence says.
  - Row: `lessonClaimsAboutApp.test.ts` › "2.3: the chord drill takes the three notes one at a time as readily as together" — feeds the real drill one note-on at a time and checks it is marked right.
- [x] **FALSE** `content/lessons/2.3.md:46` — "If the app reports the chord as three separate notes"
  - Is: nothing reports a rolled chord. The drill accepts it (above); the Score engine counts `rolledChordSteps` but no screen shows it — the summary prints Accuracy, Tempo, Ladder, Wrong notes, Missed, Weakest bars and Timing only.
  - Evidence: grep for `rolledChordSteps` under `app/src`: `PracticeEngine.ts:245`, `:777`, `:1256`, `Scoring.ts:94`, `:136`, `types.ts:379` — no UI reader; `ScoreScreen.ts:2027-2056` (the stat lines).
  - Fixed: now "The app does not catch a roll, so listen for it; the fix is …" — grep for `rolledChord` under `app/src`: `PracticeEngine.ts`, `Scoring.ts`, `types.ts` only, no file under `ui/`. Showing the rolled-chord count is the owner's call.
  - Second read (2026-09-22): HOLDS — two searches, as the rule asks. `grep -rn rolledChord src/` returns seven lines in three files (`PracticeEngine.ts:255, 790, 1203, 1269`, `Scoring.ts:94, 138`, `types.ts:413`) and **nothing under `src/ui/`**; the second, `grep -rniE "rolled|roll\b" src/ui/`, returns only `scrolled`, `unrolled` and `scroll`. So the engine counts a roll and no screen prints the count, which is what "the app does not catch a roll" tells the learner. The drill half is the finding above: it accepts the roll outright.
  - Row: `lessonClaimsAboutApp.test.ts` › "2.3: the rolled-chord count is computed and shown on no screen" — asserts `rolledChordSteps` appears in the engine and scoring sources and in none of the screens.
- [x] **FALSE** `content/lessons/2.3.md:49` — "*Skip to My Lou* is on this rung: two chords, C and G"
  - Is: `song.folk.skip-to-my-lou.pdmx` is in D major and its symbols are D and A. It is a one-staff melody (F♯5–A5 range), so there is no left hand to change chord in.
  - Evidence: `dump_score.py song.folk.skip-to-my-lou.pdmx`: key `2`, chords `D major` / `A major`, one staff; catalog `notation.chords: ["A","D"]`.
  - Fixed: now "two chords, D and A, over a tune you already know, printed as one staff with the symbols above it" — `dump_score.py song.folk.skip-to-my-lou.pdmx`: key 2, `[D major]`/`[A major]`, one staff. "the simplest possible song to practise a chord change in" left as written (not a finding).
  - Second read (2026-09-22): HOLDS — measured `notation` for `song.folk.skip-to-my-lou.pdmx`: `keys [{fifths: 2}]`, `staves: 1`, `chords ['A', 'D']` and exactly five printed symbols. Two chords, one staff, symbols above the tune: every clause of the sentence.
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.3: Skip to My Lou is one staff in two sharps with just D and A named over it".
- [x] **FALSE** `content/lessons/2.3.md:50` — "changing every two bars"
  - Is: D for bars 1–2, A for 3–4, D for 5–6, then A for one bar (7) and D for one (8).
  - Evidence: `dump_score.py song.folk.skip-to-my-lou.pdmx` symbols at bars 1, 3, 5, 7, 8.
  - Fixed: now "D holds for two bars, then A for two and D for two; after that A and D take one bar each." — symbols at bars 1, 3, 5, 7, 8.
  - Second read (2026-09-22): HOLDS — every `<harmony>` element in the `.mxl` located by bar: bar 1 D, bar 3 A, bar 5 D, bar 7 A, bar 8 D, and no symbol in bars 2, 4 or 6. A symbol holds until the next one, so the reading is D 1–2, A 3–4, D 5–6, A 7, D 8 — exactly the sentence, and the piece is 8 bars so nothing follows.
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.3: Skip to My Lou changes chord at bars 1, 3, 5, 7 and 8 and nowhere else" — reads the harmony elements per bar out of the built score.
- [x] **STALE** `content/lessons/2.3.md:59` — "Twenty chord changes at 95 %"
  - Is: this is the rung's `mastery.custom` (`chord-drill-20-changes>=0.95`), which no code measures; the chord drill serves 10 cards a set.
  - Evidence: `app/src/engine/drills/fromCatalog.ts:177` (`count ?? 10`), `:315-322`; `selectors.ts:83-86` (the custom string is read only to refuse paper passes).
  - Fixed: now "Twenty chord changes at 95 % (two sets of ten)" — `fromCatalog.ts` `count ?? 10`; the rung's `mastery.custom` is read only by `demandsMeasuredAccuracy`. Measuring the custom goal is the owner's call.
  - Second read (2026-09-22): HOLDS — rung 2.3's `mastery.custom` is still `chord-drill-20-changes>=0.95`, `drill.chord.c-f-g` carries no `count` so `fromCatalog.ts:178` gives it ten cards, and two sets of ten is twenty. `demandsMeasuredAccuracy` (`selectors.ts:166-169`) reads the string only for the `[<>]=?\s*\d` shape, to refuse a paper pass — it never measures the twenty or the 95 %. So the parenthesis the fix added is the honest part of the sentence.
  - Row: `lessonClaimsAboutApp.test.ts` › "2.3: the chord drill is ten cards, so the rung's twenty changes is two sets" — counts the prompts the real catalog row produces.

Not checked in this lesson: "Nearly every folk, hymn and pop song you know is mostly these three chords" (line 25, JUDGEMENT-grade generalisation, not listed separately). Checked and true: triad construction, snowman shape, C/F/G spellings, I/IV/V as degrees, and that I, IV, V contain all seven notes (THEORY); root-position C→F is a fifth down and C→G a fourth down, as written in *Happy Birthday (simple)* (C3→F2 bar 7, C3→G2 bar 2); *Show me* lights the chord and engraves it as one whole note, *Hear it* plays it, and either forfeits the card (`answerSheet.ts:11`, `:131-132`; `DrillScreen.ts:1735-1754`); the chord drill is on the rung (`drill.chord.c-f-g`, chords C F G, root position).

## 2.4 — `content/lessons/2.4.md`

Claims checked: 20. Findings: 5.

- [x] **FALSE** `content/lessons/2.4.md:43` — "*Greensleeves* — a minor-key tune built almost entirely out of the dotted-quarter-plus-eighth figure."
  - Is: minor key is right (A minor), but the figure is in about half the bars: in *Greensleeves (simple)* 7 of 15 full bars (2, 4, 6, 10, 12, 13, 14); the rest are half + quarter. *Greensleeves (with chords)* is the same melody; the full *Greensleeves* has the same proportion.
  - Evidence: `dump_score.py song.folk.greensleeves.simple` bars 1–15; `song.folk.greensleeves.chords` bars 1–15; `song.folk.greensleeves` bars 2–33.
  - Fixed: now "a minor-key tune that keeps coming back to the dotted-quarter-plus-eighth figure, in nearly half the bars of the simple setting" — `dump_score.py song.folk.greensleeves.simple`: dotted quarter + eighth in 7 of 15 full bars (2, 4, 6, 10, 12, 13, 14).
  - Second read (2026-09-22): HOLDS — the right-hand rhythm of every bar read from the `.mxl`, with `<dot/>` counted rather than inferred from the dump: bar 0 is a one-eighth pickup, bars 1–15 are the full bars, and the dotted-quarter-plus-eighth figure is in bars 2, 4, 6, 10, 12, 13 and 14 — seven of fifteen. "Nearly half" is right where "almost entirely" was not, and `notation.keys` is `fifths 0, mode minor` with `finalBass 9`, so "minor-key" holds.
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.4: Greensleeves (simple) is in A minor and has the dotted figure in about half its bars, not all of them" — counts the dotted quarters per bar in the built score.
- [x] **FALSE** `content/lessons/2.4.md:57` — "*Greensleeves* is nearly all that figure, so the tune is the exercise."
  - Is: as above — about half.
  - Evidence: as above.
  - Fixed: now "*Greensleeves* has that figure in about every other bar" — as above.
  - Second read (2026-09-22): HOLDS — same reading as the finding above (7 of the 15 full bars of `greensleeves.simple`), and "about every other bar" is if anything the more accurate of the two phrasings: the figure falls in bars 2, 4, 6 and 10 alternately before bunching at 12, 13, 14.
  - Row: covered by the 2.4 Greensleeves row above; no second row.
- [x] **FALSE** `content/lessons/2.4.md:51` — "and let the left hand's three beats keep the time."
  - Is: `song.folk.streets-of-laredo.pdmx` has one staff and no left hand.
  - Evidence: `dump_score.py song.folk.streets-of-laredo.pdmx` bars 1–17 (RH only); catalog `notation.staves: 1`, `hands: right`.
  - Fixed: now "count the three beats yourself, since there is no left hand written to keep them" — catalog `notation.staves: 1`; `dump_score.py` RH only.
  - Second read (2026-09-22): HOLDS — every note of the `.mxl` carries `<staff>1</staff>` and the catalog's measured `notation.staves` is 1 with `hands: right`, so there is no left-hand part to keep the beat. (T15 has since retitled the row "Streets of Laredo (first half, 17 bars)" and the lesson carries a matching sentence; `notation.bars` is 17, so that added sentence is true as well.)
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.4: Streets of Laredo is seventeen bars on one staff with no left hand".
- [x] **FALSE** `content/lessons/2.4.md:49` — "a slow waltz in 3/4 with a dotted rhythm at the start of nearly every phrase."
  - Is: 3/4 is right. The phrases (after an eighth pickup) begin in bars 2, 6, 10 and 14 with a half note or quarter plus eighths; the dotted quarters fall on beat 2 of each phrase's *second* bar (bars 3, 5, 7, 11, 15), not at the start. The app runs it at 96 bpm, a defaulted tempo (`tags: tempo-defaulted`), so "slow" is not what the app plays.
  - Evidence: `dump_score.py song.folk.streets-of-laredo.pdmx` bars 1–17; catalog `tempoBpm: 96.0`, `tags`.
  - Fixed: now "a waltz in 3/4 on one staff, with a dotted quarter on the second beat of a bar in every phrase" ("slow" dropped) — `dump_score.py song.folk.streets-of-laredo.pdmx`: dotted quarters on beat 2 of bars 3, 5, 7, 11, 15, at least one in each four-bar phrase from bars 2, 6, 10, 14; catalog `tempoBpm: 96.0`, `tempo-defaulted`.
  - Second read (2026-09-22): HOLDS — every bar's rhythm read from the `.mxl` with `<dot/>` counted: bar 1 is an eighth pickup, and the only dotted quarters are in bars 3, 5, 7, 11 and 15, each of them the **second** event in a `quarter · dotted quarter · eighth` bar, i.e. on beat 2. The four-bar phrases begin at bars 2, 6, 10 and 14, so each of the four holds at least one — 3 and 5 in the first, 7 in the second, 11 in the third, 15 in the fourth. `notation.times` is `['3/4']`. The dropped "slow" is still the right call: `tempoBpm` is 96.0 with `tags: tempo-defaulted`.
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.4: Streets of Laredo is in 3/4 and each of its four phrases carries a dotted quarter on a second beat" — reads the dotted quarters and their position in the bar out of the built score.
- [ ] **UNVERIFIED** `content/lessons/2.4.md:56` — "it is marked early the moment it arrives before the \"and\""
  - Is: a strike up to `toleranceMs` (150 ms by default) early is matched to its slot as a hit, and the summary reports "% early"; whether the sheet marks that single note early as it lands was not traced to the drawing code. An eighth more than 150 ms early matches nothing and counts as wrong, not early.
  - Evidence: `PracticeEngine.ts:949-985` (`findSlot` / `findRhythmSlot`, `distance <= toleranceMs`); `settingsStore.ts:136`; `ScoreScreen.ts:2056`.
  - Reader 1: WRONG (nothing is marked early as it lands; earliness is an aggregate on the summary afterwards) — verified now with the instrument the finding said was missing, the drawing code. `WindowRenderer.ts:58` declares the whole vocabulary a drawn note can have: `type NoteState = 'correct' | 'wrong' | 'current' | 'uncertain'`, and `:1518-1519` toggles `is-correct` / `is-wrong` / `is-uncertain` — **there is no early state**. A strike inside `toleranceMs` (default 150 ms, `settingsStore.ts:136`) is matched to its slot and drawn `correct`; one further out matches nothing and is drawn `wrong`. The only place earliness is reported is `ScoreScreen.ts:2221`, the summary line `Timing — N ms mean, N% early`, built from `timingStats` (`Scoring.ts:40-52`, `deltas.filter((d) => d < 0)`), after the run. Two searches for a per-note mark: `grep -rni early src/score/ src/ui/` (only comments, a Diagnostics sentence and unrelated words) and `grep -rn "is-early|--early|earlyClass" src/`, which exits 1. Smallest true change: say that the run's summary reports what share of your notes were early, and that on the page an early eighth is either accepted or marked wrong.

Not checked in this lesson: that the HP-130 sends graded velocity (not recorded in `docs/07-midi-hp130-notes.md`; the lesson's claim is the ordinary behaviour of a velocity-sensing keyboard). Checked and true: tie and slur definitions, dotted quarter = 1½ beats counted "1 and 2 / and", dynamics and tempo words (THEORY); the dynamics drill asks for a phrase piano then forte, shows both on a velocity meter, and passes at a mean ratio ≥ 1.6, matching the mastery line (`app/src/engine/drills/special.ts:385-430`, `DrillScreen.ts:1211`, `:1562-1582`; catalog `drill.dynamics.p-f` `ratio: 1.6`); *Streets of Laredo* is on the rung.

## 2.5 — `content/lessons/2.5.md`

Claims checked: 18. Findings: 6.

- [x] **FALSE** `content/lessons/2.5.md:32` — "Position-shift drills first"
  - Is: `drill.technique.position-shifts` (`kind: five-finger`, `shifts: true`) builds the same call-and-response as the plain five-finger drill: C4 D4 E4 F4 G4 F4 E4 D4 C4 in the right hand, with no shift. `shifts` is read by nothing. (The rung's scored exercises `exercise.position-shift.*` do shift — e.g. `position-shift.c.right` bar 3 moves to G4–C5.)
  - Evidence: `fromCatalog.ts:611-636`; grep for `shifts` under `app/src/engine/drills/` returned nothing; `dump_score.py exercise.position-shift.c.right` bars 1–4.
  - Fixed: now "The *Position shift* exercises first (the position-shift drill plays the plain five-finger walk, with no shift in it)" — `fromCatalog.ts` `buildTechniquePattern`; grep for `shifts` under `app/src/engine/drills/` returned nothing; `dump_score.py exercise.position-shift.c.right` bar 3 moves to G4–C5. Making the drill shift is the owner's call.
  - Built (2026-09-21): `shifts: true` is read: the drill plays the five-finger walk in the home position and then again from the fifth, so the hand has to leave the keys and land. The sentence now names a drill that shifts.
  - Second read (2026-09-22): WRONG (the code was built and **the sentence was never changed**) — the same fault as 2.1 above, from the same build. `fromCatalog.ts:661-672` and `:686-690` read `shifts === true` and append `shape.map((offset) => root + 7 + offset)`, and `:703-704` gives the card "…in C, then move the hand up to the fifth and play it there". But `2.5.md:32-33` still read "the position-shift drill plays the plain five-finger walk, **with no shift in it**". Entry 24's file list does not name `content/lessons/2.5.md`.
  - Second-read fix (2026-09-22): `2.5.md:32-33` now reads "the position-shift drill plays the five-finger walk in the home position and then again from the fifth". `readingTime` recounted (449 words → 3, unchanged).
  - Row: `lessonClaimsAboutApp.test.ts` › "2.5: the position-shift drill walks the home position and then the same walk from the fifth" — builds the real catalog row and compares the two halves of the expected sequence.
- [x] **FALSE** `content/lessons/2.5.md:33` — "*Ode to Joy (full theme)*, which has one thumb-under in it"
  - Is: its printed fingering has no thumb-under. The right hand stays in C position (C4=1 … G4=5) except the bar-12 shift; every finger-1 C4 follows a higher note (bars 3, 7, 9, 10, 15), which is not a thumb passing under.
  - Evidence: `<fingering>` per note in `song.classical.ode-to-joy.full`, bars 1–17 (e.g. bar 9 `D4(2) D4 E4(3) C4(1)`, bar 12 `C4(1) D4(2) G3(5)`).
  - Fixed: now "its one move is the bar-12 shift, not a thumb-under, so the scale is where the thumb gets its practice" — `<fingering>` read per note in `song.classical.ode-to-joy.full` bars 1–17: every finger-1 C4 follows a higher note or starts a bar.
  - Second read (2026-09-22): HOLDS — the printed fingering of all 17 bars read note by note from the `.mxl`. The right hand is 1–5 on C4–G4 in every bar but 12; each finger-1 C4 (bars 3, 7, 9, 10, 15) opens a bar or follows a higher finger, which is a hand staying put and not a thumb passing under; and bar 12 is `C4(1) D4(2) G3(5)`, a jump down to G3 with the fifth finger — a shift, and the only place the hand leaves C position.
  - Row: `lessonClaimsAboutMusic.test.ts` › "2.5: Ode to Joy (full theme) leaves C position only in bar 12, and no finger crosses under a thumb" — reads the printed fingering of every note of the built score.
- [x] **FALSE** `content/lessons/2.5.md:34` — "Its version in G is two rungs on, once the key has a sharp in it."
  - Is: `song.classical.ode-to-joy.g` is on 3.1, the next core rung after 2.5 (not two on); and a G-major version, `song.classical.beethoven-ode-to-joy.easy`, is already on this rung.
  - Evidence: every rung's options searched for `ode-to-joy`: `ode-to-joy.g` on 3.1 and 4.1; `beethoven-ode-to-joy.easy` on 2.5, 4.1, 4.4; its key G major (`dump_score.py`, key `1`).
  - Fixed: now "Its version in G is on the next rung … and the *Ode to Joy (easy variation)* on this rung is in G already." — rungs searched: `ode-to-joy.g` on 3.1 (next core rung) and 4.1; `beethoven-ode-to-joy.easy` on 2.5, key 1 sharp, ends on a G chord.
  - Second read (2026-09-22): HOLDS — every rung in the authored stages scanned for an option containing `ode-to-joy`: `song.classical.ode-to-joy.g` is on **3.1** and 4.1, and the core track runs … 2.3, 2.4, 2.5, 3.1 …, so 3.1 is literally the next rung and "two rungs on" was one too many. `song.classical.beethoven-ode-to-joy.easy` is on rung 2.5's own `songOptions` and its measured key is `fifths 1` with `finalBass 7`, i.e. G, so "in G already" is right too.
  - Row: `lessonClaimsAboutApp.test.ts` › "2.5: Ode to Joy in G is on the very next core rung, and this rung already carries a G setting" — walks the authored core track rather than assuming an order.
- [x] **WRONG-COUNT** `content/lessons/2.5.md:41` — "*Sight-read, right hand* is here as it was two rungs ago"
  - Is: it was last on 2.2, three core rungs before 2.5 (2.3 and 2.4 between).
  - Evidence: rungs offering `drill.reading.sight-reading-2-right`: 2.2 and 2.5 only.
  - Fixed: now "as it was three rungs ago" — `drill.reading.sight-reading-2-right` on 2.2 and 2.5 only.
  - Second read (2026-09-22): HOLDS — every rung in every stage file scanned for `sight-reading`: `drill.reading.sight-reading-2-right` appears on 2.2 and 2.5 and on no other rung. The core track between them is 2.3 and 2.4, so 2.2 is three rungs back from 2.5 and "two rungs ago" was one short.
  - Row: `lessonClaimsAboutApp.test.ts` › "2.5: the right-hand sight-reading drill was last seen three core rungs ago" — counts the core rungs between the two that offer it.
- [x] **FALSE** `content/lessons/2.5.md:42` — "the difference now is that the generated phrases can leave C position"
  - Is: it is the same drill with the same parameters as on 2.2 (`level 2, right, 4 bars`), so nothing is different now; level 2 already spans C4–C5, beyond C position, on 2.2.
  - Evidence: catalog `drill.reading.sight-reading-2-right` params; `sightReading.ts:153-162` (`rhKey 60–72`).
  - Fixed: now "the same drill: its phrases already reach up to the C above middle C, beyond C position" — catalog params unchanged `{level 2, right, 4 bars}`; `sightReading.ts` level 2 `rhKey 60–72`.
  - Second read (2026-09-22): HOLDS — it is one catalog row, `drill.reading.sight-reading-2-right`, offered by both 2.2 and 2.5 with no per-rung override anywhere in the stage files, so the drill cannot differ between them. `sightReading.ts:160` gives level 2 `rhKey: { low: 60, high: 72 }`, which is middle C up to the C above it, so the phrases already leave C position on 2.2.
  - Row: covered by the 2.2 sight-reading row (same row, same level); this finding adds only that the two rungs share the item, which the 2.5 row above already walks.
- [ ] **THEORY** `content/lessons/2.5.md:18` — "*Ode to Joy (full theme)* uses one in bar 12, where the tune drops to the G below middle C."
  - Is: the shift and the G3 are there (bar 12 `C4 D4 G3`), so the lesson is right; but the score fingers that G3 with right-hand **5**, below a thumb on C4 — a musician should check the printed fingering, which is what the lesson tells the learner to trust.
  - Evidence: `<fingering>` in `song.classical.ode-to-joy.full` bar 12: `C4(1) D4(2) G3(5)`.
  - Reader 1: RIGHT about the lesson's own claim, UNSURE about the fingering it tells the learner to trust — the claim is that the piece "uses one in bar 12, where the tune drops to the G below middle C", and the `.mxl` says bar 12 is `C4(1) D4(2) G3(5)`: the shift is there and the note is the G below middle C. The open question is not the lesson's sentence but the score's own marking — right-hand 5 on a G3 that sits *below* the thumb's C4 crosses the hand over itself, and whether that is the intended fingering or an import artefact is a player's call, so it is left UNSURE for a second reader. It does not change the lesson.

Not checked in this lesson: whether a bump on the thumb note is caused by "the whole arm shifted" (teaching advice). Checked and true: right-hand scale 1-2-3 then thumb under to F, 1-2-3-4-5 to C; left hand 5-4-3-2-1 then 3 over onto A (`exercise.scale.c-major.1oct.similar.left.2` fingering `C3(5) D3(4) E3(3) F3(2) G3(1) A3(3) B3(2) C4(1)`) (THEORY and score); the scale exercises are one octave in eighth notes (`exercise.scale.c-major.1oct.similar.right.2` bars 1–2), matching the mastery line.

## holiday — `content/lessons/holiday.md`

Claims checked: 22. Findings: 1.

- [x] **FALSE** `content/lessons/holiday.md:38` — "*We Three Kings* is the minor one, in E minor and in 6/8 like *Silent Night*."
  - Is: 6/8 is right and the verse (bars 1–8) is in E minor, but the refrain (bars 9–17) is in G major and the piece ends on a G chord — it is not simply "in E minor".
  - Evidence: `dump_score.py song.classical.1863-rev-john-henry-hopkins-we-three-kings-of-orient-are.pdmx`: bars 1–8 over Em/B7, bars 9–17 over D7/G/C/G, last bar `[C major] [G major]`.
  - Fixed: now "in 6/8 like *Silent Night*: its verse is in E minor, and its refrain turns to G major and ends there." — `dump_score.py`: bars 1–8 Em/B7, bars 9–17 D7/G/C/G, last bar `[C major] [G major]`. `lessonClaimsAboutMusic.test.ts` row "We Three Kings is in E minor" still describes the verse.
  - Second read (2026-09-22): HOLDS, and one clause is firmer than the sample said — every `<harmony>` in the `.mxl` by bar: 1 Em, 2 B7→Em, 4 B7→Em, 5 D, 6 G, 7 Am→B7, 8 Em; then 9 D7, 10 G, 11 C→G, 13 C→G, 14 Em→D→G, 15 C→G→D→G, 17 C→G. The sample left "ends there" resting on the last symbol; the **notes** settle it too — bar 17 is `G4 E4 G4`, so the tune ends on G under a G chord. `notation.times` is `['6/8']` and `keys` is `fifths 1, mode minor`, which is what the existing test row reads.
  - Row: `lessonClaimsAboutMusic.test.ts` › "holiday: We Three Kings turns to G for its refrain and ends on a G chord" — reads the harmony sequence of the built score; the existing "is in E minor" and "is in 6/8" rows stay as they are and are not disturbed by it.

Not checked in this lesson: "they are almost all public domain" (HISTORY, general, not checked per carol); whether *holiday.4* is fairly summed up as "making a carol sound finished" (its lesson was not read — it is not in this batch). Checked and true: "Six options" — six `songOptions`, counting the two *Jingle Bells* settings; *Jingle Bells (HT)* left hand plays single roots C3, F3, G3 (see 2.1); *Silent Night (melody)* is in C with symbols C, F, G, G7 and in 6/8 (`dump_score.py`, bars 1–12); *Jolly Old Saint Nicholas* has no chord symbols (`chordCount: 0`) and is in B♭ with two flats (key `-2`, ends on B♭4); *Good King Wenceslas* is in G with symbols Em, D7 and B7 beyond G, C, D (`notation.chords`); the three exercises are *Hands together in C — left hand holds*, the C/F/G chord drill, and an I–IV–V7–I cadence (`dump_score.py exercise.cadence.c.root`: C, F, G7, C); I, IV, V in C = C, F, G (THEORY); 6/8 felt in two (THEORY); the Library's Track filter has *Holiday*, holding 36 items (`LibraryScreen.ts:438`, `00-tracks.json`); the next holiday rung, "Playing for people who are singing", is at Stage 3 (`holiday.3`) and the one after is at Stage 4 (`holiday.4`); the *Primary chords* preset plays I–IV–V–I with a melody on top and leaves the key free (`sightReading.ts:837-851`: `progressionId: 'i-iv-v-i'`, `rightHand: 'melody'`, locks progression and left hand only — it opens in D, so "set it to C" is a real step); Free play names the chord held (`FreePlayScreen.ts:153`).

## hymns.2 — `content/lessons/hymns.2.md`

Claims checked: 16. Findings: 3.

- [x] **FALSE** `content/lessons/hymns.2.md:20` — "The drills here are the same three shapes against the clock"
  - Is: only `drill.chord.c-f-g` is C, F and G. `drill.chord.symbol-flash` (level 3.2) asks for random triads and sevenths — major, minor, 7, m7, maj7 on the roots C D E F G A B. Neither drill has a time limit; a card waits for the answer.
  - Evidence: `app/src/engine/drills/fromCatalog.ts:295-305` (no `chords` param → random roots × qualities `['', 'm', '7', 'm7', 'maj7']`), `:315-322`; catalog `drill.chord.symbol-flash` params `{mode: symbol-flash}`; `PromptDrill.ts:93-111` (no timeout).
  - Fixed: now "the same three shapes, and then a flash of other chord symbols, minors and sevenths among them, to find as quickly as you can (no clock runs)" — `fromCatalog.ts` random roots × `['', 'm', '7', 'm7', 'maj7']` for `symbol-flash`; `PromptDrill.ts` has no timeout.
  - Second read (2026-09-22): HOLDS — rung hymns.2's three `exerciseOptions` are `drill.chord.c-f-g` (`chords: ["C","F","G"]`, root position), `exercise.cadence.c.root` and `drill.chord.symbol-flash`, whose only param is `mode: "symbol-flash"`. With no `chords` and no `keys`, `chordsFromParams` (`fromCatalog.ts:326-334`) falls to eight draws from roots `[0,2,4,5,7,9,11]` × qualities `['', 'm', '7', 'm7', 'maj7']`, so minors and sevenths really are in the pool. And `PromptDrill` has no timer: its only use of a clock is `settle`'s reaction time, recorded after the answer, so "no clock runs" is right.
  - Row: `lessonClaimsAboutApp.test.ts` › "hymns.2: the symbol-flash drill draws minors and sevenths, and no card times out" — builds the real row and reads its prompt labels.
- [x] **FALSE** `content/lessons/hymns.2.md:31` — "*Joyful, Joyful* is Beethoven's tune and will be familiar, which helps — you will hear when a chord is wrong."
  - Is: the main notes are Beethoven's tune, but the score is written the way bagpipe music is — no key signature, and a grace note (72 in all) before nearly every note — so as the app plays it the tune sits on D with F natural, a minor third, and is heavily ornamented. It will not sound like the familiar tune; this needs a musician's ear (nothing here has been heard). Its tempo is 40 bpm.
  - Evidence: the `.mxl` read directly (`scores/pdmx/QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7.mxl`): `<fifths>0</fifths>`, no `<alter>` anywhere, 72 `<grace>` notes; melody without graces bars 1–4 `F5 F5 G5 A5 | A5 G5 F5 E5 | D5 D5 E5 F5 | F5. E5 E5` (Ode to Joy on D); catalog `tempoBpm: 40.0`.
  - Fixed: now "Beethoven's tune, but this score writes it on D with every F natural, a grace note before nearly every note and a tempo of 40, so read what is written rather than playing it from memory." — the `.mxl` re-read: `<fifths>0</fifths>`, no `<alter>`, 72 grace notes against 62 other notes, bars 1–4 without graces F5 F5 G5 A5 | A5 G5 F5 E5 | D5 D5 E5 F5 | F5 E5 E5; catalog `tempoBpm: 40.0`. Nothing has been heard. Replacing the file is the owner's call (README, "Score files that are wrong").
  - Second read (2026-09-22): HOLDS — the `.mxl` opened directly again, not the dump (Part A2b names this finding). `<fifths>0</fifths>`, **zero** `<alter>` elements anywhere in the file, 72 `<grace>` against 62 sounding notes, `<sound tempo="40"/>`, measured `tempoBpm: 40.0`. Stripping the graces gives bars 1–4 as `F5 F5 G5 A5 | A5 G5 F5 E5 | D5 D5 E5 F5 | F5 E5 E5`, which is Ode to Joy's own degree pattern 3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3 2 2 with **D as the tonic** — so "on D" is not an inference from the key signature, it is the tune's own shape, and the third above that D is written F natural. More graces than notes is "before nearly every note". Nothing has been heard.
  - Row: `lessonClaimsAboutMusic.test.ts` › "hymns.2: the Joyful, Joyful on this rung has no key signature, no accidental, more grace notes than notes, and a written tempo of 40" — reads the `.mxl` rather than `notation`, which carries none of these.
- [ ] **UNVERIFIED** `content/lessons/hymns.2.md:31` — (the tool, not the lesson) "*Joyful, Joyful*"
  - Is: `dump_score.py` prints grace notes as ordinary eighth notes (it does not read `<grace>`), so its dump of this piece shows bars of seven beats in 4/4. Any claim about this score checked only through `dump_score.py` would be wrong; the finding above was checked against the MusicXML.
  - Evidence: `dump_score.py song.classical.beethoven-ludwig-van-beethoven-joyful-joyful-we-adore-thee.pdmx` bar 3 vs the raw `<measure number="3">` (G4, D5, C5 are `<grace slash="yes"/>`).
  - Reader 1: RIGHT, verified with the instrument — `dump_score.py` re-run on the item prints bar 1 as `G5/eig F5/qua G5/eig F5/qua A5/eig G5/qua A5/qua`, which is five and a half beats in 4/4, because the four graces are printed as ordinary eighths. `grep -n "grace\|tuplet\|tie" tools/content/dump_score.py` returns **nothing**: the tool has no handling for any of the three, so this is a property of the instrument and not of this file. This is a finding about the tool rather than a lesson claim, so it needs no lesson change; it is the reason the `hymns.2` sentence above was checked against the `.mxl` here and in the sample.

Not checked in this lesson: "Almost all of them use three or four chords" and "it will fight the tune about once a line" (generalisations about hymnody, not listed). Checked and true: "Four options, from easiest up" — four songs at levels 1.4, 2.25, 2.49, 2.85; *When the Saints* is hands-alternating; *Be Thou My Vision* is in 3/4 (G major); *Swing Low* is the only one of the four with chord symbols (`chordCount` 0, 0, 0, 20); the four-part version is the next rung on this track (`hymns`, Stage 3, "Four-part texture and walk-ups"); Free play names the held chord (`FreePlayScreen.ts:1-20`, `:153`).

## 3.1 — `content/lessons/3.1.md`

Claims checked: 19. Findings: 1.

- [x] **UNOFFERED** `content/lessons/3.1.md:33` — "G major and F major scales, hands separately, one octave."
  - Is: the rung offers only the right-hand scales (`exercise.scale.g-major.1oct.similar.right.2`, `exercise.scale.f-major.1oct.similar.right.2`). The left-hand ones exist in the Library (`…g-major.1oct.similar.left.2`, `…f-major.1oct.similar.left.2`) and the lesson does not point there. The mastery line (43) asks for the same.
  - Evidence: rung 3.1 `exerciseOptions`; catalog ids beginning `exercise.scale.g-major.1oct` / `exercise.scale.f-major.1oct` (four each: left, right, both similar, both contrary).
  - Fixed: now "one octave: the right-hand ones are on this rung and the left-hand ones are in the Library" — rung 3.1 `exerciseOptions`; catalog has `exercise.scale.g-major.1oct.similar.left.2` and `exercise.scale.f-major.1oct.similar.left.2`.
  - Second read (2026-09-22): HOLDS, with the sample's caveat still open — rung 3.1's seven `exerciseOptions` hold `exercise.scale.g-major.1oct.similar.right.2` and `…f-major…right.2` and no left-hand scale; the catalog carries eight `…1oct…` rows for the two keys (left, right, similar both, contrary both in each), so the left-hand ones do exist to be found. The sentence names the Library, which is what `lessonClaims.test.ts` requires of a sentence naming something the rung does not offer. **Still unchanged:** the mastery line at `3.1.md:43-44` asks for "G and F major scales hands separately, one octave" — the same claim without the pointer. The sample recorded that too; it is a sentence nobody has corrected, not a second reading of this one.
  - Row: `lessonClaimsAboutApp.test.ts` › "3.1: only the right-hand G and F scales are on this rung, and the left-hand ones are in the catalog" — reads the authored rung and the catalog ids.

Not checked in this lesson: nothing. Checked and true: half and whole steps, sharps and flats, enharmonic names, E♯ = F, W–W–H–W–W–W–H, G major's F♯ and F major's B♭, key signature and the one-bar reach of an accidental (THEORY); note flash shows sharps and flats (`drill.reading.note-flash-accidentals` draws from every semitone F2–A5 and spells C♯ E♭ F♯ A♭ B♭, `factories.ts:35-49`, `types.ts:283`); *Ode to Joy in G* never plays an F♯ in either hand (`dump_score.py song.classical.ode-to-joy.g` bars 1–17: RH D4–D5 without F, LH G3 and D3 only); *Twinkle in F* plays B♭ repeatedly (bars 3, 5, 7, 11 RH `Bb4`, bars 2, 3, 10, 11 LH `Bb3`); both songs are on the rung.

---
Batch 1: 22 of 22 lessons. 74 findings
(52 FALSE, 3 STALE, 1 WRONG-COUNT, 1 UNOFFERED, 6 THEORY, 9 JUDGEMENT, 2 UNVERIFIED).
Lessons not finished: none.
Fix pass: 57 fixed, 0 found wrong and not fixed, 17 left open (THEORY/JUDGEMENT/HISTORY/UNVERIFIED or needs a build). Lessons edited: 0.1, 0.2, 0.3, 0.4, 1.1, 1.2, 1.3, 1.4, 1.5, practice.1, practice.2, 2.1, 2.2, 2.3, 2.4, 2.5, holiday, hymns.2, 3.1.
