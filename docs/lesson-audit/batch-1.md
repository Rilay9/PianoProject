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

- [ ] **FALSE** `content/lessons/0.1.md:36` — "Every piece of sheet music in this app uses these numbers."
  - Is: 767 of the 1,975 bundled scores carry no fingering at all (1,208 do). Where numbers are printed they are this convention; many scores print none.
  - Evidence: every catalog row with a `file` opened and searched for `<fingering`: 1,208 with, 767 without (e.g. `exercise.arpeggio7.a-flat-dominant7.2oct.both`, and `song.folk.kum-ba-yah.pdmx` on rung 1.1).
- [ ] **JUDGEMENT** `content/lessons/0.1.md:42` — "Flat, straight fingers. They look relaxed and they are the main reason beginners cannot play two notes at different volumes."
  - Is: a factual-sounding causal generalisation; a teacher should confirm "the main reason".
  - Evidence: not checkable against code or score.
- [ ] **JUDGEMENT** `content/lessons/0.1.md:46` — "You can press a key slowly enough to make no sound at all"
  - Is: true of an acoustic action; on a velocity-sensing digital piano (the HP-130 this lesson names) a very slow press may still sound at the lowest velocity. Not tried on the instrument.
  - Evidence: `docs/07-midi-hp130-notes.md` (HP-130 is a 1990s digital piano); nothing in the repo records what it does at minimum velocity.

Not checked in this lesson: the posture advice (bench height, distance, shoulders) — teaching advice, not a claim. Checked and true: finger numbers 1–5 and mirror-imaging (THEORY, correct); HP-130 has MIDI OUT (`docs/07-midi-hp130-notes.md:49`, DIN MIDI IN/OUT); the app is called PianoPath (`app/index.html:8`).

## 0.2 — `content/lessons/0.2.md`

Claims checked: 13. Findings: 3.

- [ ] **THEORY** `content/lessons/0.2.md:22` — "the distance from one C to the next C — twelve keys, counting black and white."
  - Is: right as a distance (twelve semitones), but counting keys from one C to the next inclusive gives thirteen; a musician should check the wording does not invite the inclusive count. Believed right as intended.
  - Evidence: theory.
- [ ] **FALSE** `content/lessons/0.2.md:46` — "A wrong answer holds its card until you tap it on"
  - Is: a missed `find-key` card is held for 2 seconds (`MISS_PAUSE_MS = 2_000`) and then moves on by itself; a tap only ends the pause early.
  - Evidence: `app/src/engine/drills/feedback.ts:31` (`MISS_PAUSE_MS`), `feedback.ts:41-50` (`find-key` is in `REVEALABLE_KINDS`); `app/src/ui/screens/DrillScreen.ts:1078-1105` (`holdCard(TAP_TO_CONTINUE)` then `setTimeout(endFeedback, holdMs)`); `DrillScreen.ts:1011-1017` (`endFeedback` advances).
- [ ] **STALE** `content/lessons/0.2.md:50` — "Twenty named keys in forty seconds, anywhere on the keyboard, at 95 % accuracy"
  - Is: this is the rung's `mastery.custom` string (`20-keys-in-40s>=0.95`), but nothing in the app measures it. The rung's drill `drill.reading.find-key` serves 10 cards (default `count`), untimed, with key names drawn from C3–C5; its catalog params `range: "A0-C8"` and `timed: true` are read by no code. The only reader of the custom string is `demandsMeasuredAccuracy`, which refuses paper passes.
  - Evidence: `app/src/engine/drills/fromCatalog.ts:177` (`count ?? 10`), `:253-260` (`buildFindKey` with no targets → `findKeyDrill({low: 48, high: 72})`); grep for `timed` and for `range` under `app/src/engine/drills/` and `DrillScreen.ts` returned nothing; `app/src/curriculum/selectors.ts:83-86`.

Not checked in this lesson: "usually the one just left of the maker's name" (instrument-dependent, not checkable). Checked and true: 88 keys ≈ seven and a bit twelves; C left of two black keys, F left of three; C D E F G A B; octave-equivalence; middle C = MIDI 60 = C4, fourth C from the bottom on 88 keys (THEORY); G between the first and second keys of the three-group; the drill names a key (`findKeyDrill` labels strip the octave); *Show me* lights the key and *Hear it* plays it, and either forfeits the card (`DrillScreen.ts:1735-1754`, `1852-1858`).

## 0.3 — `content/lessons/0.3.md`

Claims checked: 26. Findings: 6.

- [ ] **STALE** `content/lessons/0.3.md:16` — "**Wait mode** holds the score still" (and "**Tempo mode**", line 20)
  - Is: the Score screen's mode selector reads *Wait for me* and *Keep tempo*; the one-word *Wait* / *Tempo* appear only on a bar narrower than 400 px. The Guide calls it *Keep tempo*.
  - Evidence: `app/src/ui/screens/ScoreScreen.ts:69-74` (`MODES`), `:84-89` (`SHORT_MODES`); `GuideScreen.ts:145`.
- [ ] **FALSE** `content/lessons/0.3.md:20` — "**Tempo mode** plays a click"
  - Is: the Score screen's metronome starts off on every visit (`let metronomeOn = false`) and is switched on from the ⋯ menu's *Metronome* row; a Keep-tempo run plays no click unless it is on.
  - Evidence: `ScoreScreen.ts:285`, `:878`, menu row at `:1093`; `app/src/score/ScoreSession.ts:441` (metronome started only when `run.metronome === true`).
- [ ] **FALSE** `content/lessons/0.3.md:20` — "this is the mode that scores you"
  - Is: Wait runs are scored and recorded too (accuracy = fraction of steps right) and can pass: `evaluateOutcome` judges both `wait` and `tempo`, and a Wait run carries the tempo slider's value, so a Wait run with the slider at 80 % or more and 90 % of steps right records a pass. (At the default slider of 70 % it cannot.)
  - Evidence: `app/src/engine/Scoring.ts:111-119` (wait accuracy), `:177-190` (`judged = mode === 'wait' || mode === 'tempo'`); `ScoreScreen.ts:1409-1412` (run gets `tempoPct`), `:1956-1990` (outcome recorded); `app/src/data/settingsStore.ts:131` (`defaultTempoPct: 70`).
- [ ] **FALSE** `content/lessons/0.3.md:23` — "*mastered* is 97 % at full tempo, twice, on different days."
  - Is: one run at ≥ 97 % and 100 % tempo masters an item once it has passes (90 %/80 %) recorded on at least two different days; the second day need not be a 97 % run.
  - Evidence: `app/src/data/progressStore.ts:141-144` (`passedOn` gets the date on any pass; `masterEligible && passedOn.length >= 2` → mastered).
- [ ] **FALSE** `content/lessons/0.3.md:26` — "**Hand focus** silences one staff so you can play hands separately"
  - Is: choosing R or L (there is no control called Hand focus) makes the app *play* the other hand by default — `playbackHands` defaults to `non-focused`, which is the Duet row switched on. It is silent only after Duet is turned off.
  - Evidence: `app/src/data/settingsStore.ts:156` (`playbackHands: 'non-focused'`); `ScoreScreen.ts:122-126` (R / L / Both), `:961-973` (Duet toggles `playbackHands`).
- [ ] **FALSE** `content/lessons/0.3.md:55` — "a card you missed pauses so you can try it again"
  - Is: the pause shows the answer (keys lit, staff drawn) for 2 s and then moves to the next card; the missed card cannot be retried there. A key pressed during the pause is not taken as a retry. Retrying comes only from *Go over the ones you missed* at the end of the set.
  - Evidence: `DrillScreen.ts:1078-1105`, `:1020-1027` (key presses are not a tap-to-continue and are left for the next card), `:2032` and `:2082-2087` (go-over offer).

Not checked in this lesson: whether "right and on time" matches how `hits` is counted inside `PracticeEngine` (only `Scoring.ts` was read: Keep-tempo accuracy = `hits / expectedNotes`). Checked and true: pass = 90 % at 80 % (`settingsStore.ts:137-138`); review at 1, 3, 7, 21 days after first pass (`progressStore.ts:48`, `:486-510`); the 30-minute template 5/5/10/7/3 (`app/src/curriculum/session.ts:53-67`); Rhythm only is in the ⋯ menu and judges timing only (`ScoreScreen.ts:895-915`, `:1086-1090`); Ladder raises a notch per clean loop (`:925-945`); Blind hides the notation (`:1100`); bars in window 1–8 (`app/src/score/WindowRenderer.ts:60-61`); *Show me* / *Hear it*; the go-over offer; the Lab writes an exercise from a key and progression and *Jam it* plays a drum-and-bass loop under a chord grid (`LabScreen.ts:1-25`, `:292-400`); Today's daily read changes with the calendar day (`sightReading.ts:1364`, `progressStore.ts:66`); *Hot Cross Buns* is this rung's song; 60 % is settable (slider 30–130).

## 0.4 — `content/lessons/0.4.md`

Claims checked: 12. Findings: 3.

- [ ] **FALSE** `content/lessons/0.4.md:12` — "The test is eight short items, in rising order of difficulty:" (the numbered list, lines 14–21)
  - Is: the drill has the same eight items in a different order: 1 name a note, 2 clap, 3 five-finger HT, 4 I–IV–V in G, 5 sight-read four bars, 6 Petzold Minuet at 60 %, 7 C major scale HT, 8 swung blues LH. The lesson lists the scale 4th, I–IV–V 6th, blues 7th and the Minuet 8th.
  - Evidence: `drill.placement.stage-0` `drill.params.items` in the catalog (failUnits 1.1, 1.2, 2.1, 3.2, 3.4, 3.4, 4.1, blues-boogie.4.1; passUnit 4.3); `DrillScreen.ts:2481-2546` runs them in that order.
- [ ] **FALSE** `content/lessons/0.4.md:28` — "The temptation is to pass item 4 because you can \"sort of\" play a scale."
  - Is: in the app item 4 is "Play I–IV–V in G from chord symbols"; the scale is item 7.
  - Evidence: as above.
- [ ] **FALSE** `content/lessons/0.4.md:23` — "Everything before it is marked *passed (placement)* and stops appearing in your plan"
  - Is: the result writes only `plan.placement` and `plan.unitId`; no item is marked passed, and nothing that builds Today or Plan reads `plan.unitId` — the plan is unchanged apart from the placement drill itself being recorded as passed.
  - Evidence: `app/src/data/planStore.ts:46-47`; `DrillScreen.ts:2607-2663` (`recordRun` for the placement drill only, then `recordPlacement`). Grep for `unitId` under `app/src`: written in `planStore.ts` and `DrillScreen.ts`, read nowhere else; grep for `getPlan`: `PlanScreen.ts:730`, `SkillsScreen.ts:344`, `TodayScreen.ts:541`, `trackChips.ts:16` — each uses only the active tracks (`activeTracksFor`); `buildSession` (`TodayScreen.ts:545-557`) takes no unit. Grep for `(placement)` returned nothing.

Not checked in this lesson: nothing. Checked and true: the first failed item sets the starting point (`DrillScreen.ts:2544`, `finishPlacement(step.failUnit)`); nothing is locked by default (`strictPrerequisites: false`, `settingsStore.ts:140`); the Petzold Minuet in G is in the Library (`song.classical.petzold-minuet-g-bwv-anh114`).

## 1.1 — `content/lessons/1.1.md`

Claims checked: 20. Findings: 6.

- [ ] **FALSE** `content/lessons/1.1.md:14` — "Every tune in this unit lives inside it."
  - Is: five of the six songs stay within C4–G4; *Kum Ba Yah* (`song.folk.kum-ba-yah.pdmx`) runs G4–E5 and never touches C position.
  - Evidence: `dump_score.py` for each of the rung's six `songOptions`: hot-cross-buns (C4–E4), mary-had-a-little-lamb (C4–G4), merrily-we-roll-along (C4–G4), au-clair-de-la-lune (C4–E4), ode-to-joy.rh (C4–G4), kum-ba-yah.pdmx bars 1–8 (G4 B4 D5 E5 C5 A4).
- [ ] **FALSE** `content/lessons/1.1.md:29` — "*Mary Had a Little Lamb* and *Ode to Joy*, which add F and G."
  - Is: *Mary Had a Little Lamb* adds G only (bar 4, E G G); it has no F. *Ode to Joy* adds F and G.
  - Evidence: `dump_score.py song.folk.mary-had-a-little-lamb` bars 1–8: pitches C4 D4 E4 G4 only; `dump_score.py song.classical.ode-to-joy.rh` bars 1–2 (E E F G G F E D).
- [ ] **FALSE** `content/lessons/1.1.md:40` — "*Kum Ba Yah* is on this rung too: eight bars, right hand only, and every note under the five fingers."
  - Is: eight bars and one staff are right, but the tune uses six pitches G A B C D E (G4–E5), a sixth — more than five fingers without a shift.
  - Evidence: `dump_score.py song.folk.kum-ba-yah.pdmx`, bars 1–8; notation `bars: 8, staves: 1`.
- [ ] **FALSE** `content/lessons/1.1.md:41` — "It is the slowest of the four"
  - Is: it is the fastest of the four named tunes: Kum Ba Yah 96 bpm, Ode to Joy 88, Mary 76, Hot Cross Buns 72 (all quarter-note beats in 4/4).
  - Evidence: catalog `tempoBpm` for each id.
- [ ] **FALSE** `content/lessons/1.1.md:37` — "The fingering printed above the notes is not a suggestion"
  - Is: *Kum Ba Yah* prints no fingering (0 of 26 notes); *Hot Cross Buns* prints 11 of 17. The other four print a number on every note.
  - Evidence: `<fingering>` elements counted in each `.mxl`: hot-cross-buns 11/17, mary 26/26, merrily 26/26, au-clair 22/22, ode-to-joy.rh 28/28, kum-ba-yah.pdmx 0/26.
- [ ] **FALSE** `content/lessons/1.1.md:44` — "then in Tempo mode at 60 bpm at 90 %"
  - Is: a pass needs 80 % of the piece's own tempo. At 60 bpm only *Hot Cross Buns* (72 bpm → 83 %) records a pass; Mary 76 → 79 %, Merrily 80 → 75 %, Au Clair 84 → 71 %, Ode 88 → 68 %, Kum Ba Yah 96 → 63 % — each a "Run finished", not a pass.
  - Evidence: catalog `tempoBpm` per song; `settingsStore.ts:138` (`passTempoPct: 80`); `Scoring.ts:185-186`; `ScoreScreen.ts:1237` (tempo % = bpm / written bpm).

Not checked in this lesson: nothing. Checked and true: C position C D E F G under 1–5; treble clef's curl on the G line and middle C on one ledger line below (THEORY); quarter note one beat, 4/4 four beats (THEORY); *Hot Cross Buns* uses only E, D, C (bars 1–4); the five-finger exercise exists (`exercise.five-finger.c-major.right`); *Kum Ba Yah* is on the rung.

## 1.2 — `content/lessons/1.2.md`

Claims checked: 18. Findings: 4.

- [ ] **FALSE** `content/lessons/1.2.md:12` — "So far every note lasted one beat."
  - Is: the 1.1 songs already hold longer notes: half notes in *Hot Cross Buns*, *Mary*, *Au Clair*, *Ode to Joy* and *Kum Ba Yah*, whole notes in *Mary* (bar 8) and *Au Clair* (bars 4, 8), and *Hot Cross Buns* bar 3 is eighth notes.
  - Evidence: `dump_score.py` on each 1.1 song (see 1.1 above): e.g. `song.folk.hot-cross-buns` bar 1 `C4/hal`, bar 3 eight `eig`; `song.folk.mary-had-a-little-lamb` bar 8 `C4/who`.
- [ ] **THEORY** `content/lessons/1.2.md:19` — "Each is twice the one below it"
  - Is: wrong as the list is printed — the list runs quarter, half, whole downwards, so each is *half* the one below it (twice the one above). Believed wrong; a one-word fix.
  - Evidence: lines 15–17 of the lesson.
- [ ] **FALSE** `content/lessons/1.2.md:30` — "and the app scores that as a missed duration."
  - Is: held length is not scored. Accuracy counts notes struck (Tempo: `hits / expectedNotes`; Wait: steps right). The only held-length measure, `articulationScore`, is called by nothing in the app.
  - Evidence: `app/src/engine/Scoring.ts:111-119`, `:257` (`articulationScore`); grep for `articulationScore(` under `app/src` returned only its definition; grep for `articulation` in `ScoreScreen.ts` returned nothing.
- [ ] **JUDGEMENT** `content/lessons/1.2.md:26` — "letting it run long is the most common rhythm error there is."
  - Is: a factual-sounding generalisation for a teacher to confirm.
  - Evidence: not checkable.

Not checked in this lesson: nothing. Checked and true: note and rest values and the rest positions (THEORY); *Lightly Row* and *Twinkle* fall into four-bar phrases ending on a half note (`dump_score.py song.folk.lightly-row` bars 4, 8; `song.folk.twinkle.rh` bars 4, 8, 12); the rhythm drill is tapped on any key (`drill.rhythm.mixed-values`, kind `rhythm`); *Lightly Row*, *Jingle Bells*, *Twinkle*, *Frère Jacques* are all on the rung; Twinkle's A4 is one white key above G4 and the fingering shifts up (bar 2 `A4(5)`) and back (bar 3 `F4(4)`); *Frère Jacques* bars 7–8 drop to G3 with `C4(4) G3(1) C4(4)` — thumb on G, 4 on C.

## 1.3 — `content/lessons/1.3.md`

Claims checked: 16. Findings: 1.

- [ ] **FALSE** `content/lessons/1.3.md:45` — "One left-hand tune at 60 bpm at 90 %"
  - Is: at 60 bpm only *Hot Cross Buns (left hand)* (72 bpm → 83 %) records a pass; *Mary (left hand)* 76 → 79 % and *Ode to Joy (left hand)* 84 → 71 % fall under the 80 % pass tempo.
  - Evidence: catalog `tempoBpm` of `song.folk.hot-cross-buns.lh`, `song.folk.mary-had-a-little-lamb.lh`, `song.classical.ode-to-joy.lh`; `settingsStore.ts:138`; `ScoreScreen.ts:1237`. (The rung's own `minTempoPct` is read by no code — grep for `minTempoPct` under `app/src` finds only its type, `curriculum/types.ts:148`.)

Not checked in this lesson: whether a learner can name a note "within two seconds" — the note-flash drill is untimed and asks for the key to be played, not named; this is a self-check, not a claim about the app. Checked and true: LH C position C3–G3 with 5 on C3 and 1 on G3 (all three LH songs: `C3(5)`, `D3(4)`, `E3(3)`, `F3(2)`, `G3(1)`); bass-clef F line, C3 in the second space, middle C on a ledger above, middle line B (treble) / D (bass) (THEORY); the three LH songs and the F2–C4 note flash are on the rung; the LH five-finger drill plays C3 D3 E3 F3 G3 F3 E3 D3 C3, i.e. 5-4-3-2-1-2-3-4-5 (`fromCatalog.ts:611-616`); *Sight-read, left hand* is on the rung and generates a new four-bar bass-clef phrase in C3–G3 on each open (`ScoreScreen.ts:138-160`, `sightReading.ts:141-151`, `:571-588`).

## 1.4 — `content/lessons/1.4.md`

Claims checked: 19. Findings: 5.

- [ ] **THEORY** `content/lessons/1.4.md:25` — "That rule holds for every dotted note you will ever meet."
  - Is: a double-dotted note adds half and then a quarter of its value; the rule as stated covers single dots only. Believed wrong as an absolute.
  - Evidence: theory.
- [ ] **THEORY** `content/lessons/1.4.md:29` — "the first bar is short and the missing beats are at the end of the piece."
  - Is: a common convention, not a rule — and not true of this rung's *When the Saints*: its three-beat pickup (bar 0) is followed by a full final bar (bar 8 `C3/who`), nine bars in all.
  - Evidence: `dump_score.py song.folk.when-the-saints.alternating` bars 0 and 8.
- [ ] **FALSE** `content/lessons/1.4.md:45` — "then the treble one from the last rung"
  - Is: the last rung (1.3) has only the left-hand sight-reading drill. The treble one (`drill.reading.sight-reading-1`) is on the *next* rung, 1.5.
  - Evidence: every rung's `exerciseOptions` searched for the nine `sight-reading` drills: `sight-reading-1-left` on 1.3 and 1.4, `sight-reading-1` first on 1.5.
- [ ] **FALSE** `content/lessons/1.4.md:49` — "choose the right hand, switch *Duet* on in the ⋯ menu"
  - Is: Duet is already on by default once R is chosen (`playbackHands: 'non-focused'`); the row reads *On*, and pressing it turns the left hand off.
  - Evidence: `settingsStore.ts:156`; `ScoreScreen.ts:961-973` (toggle), `:2336-2344` (row shows On when `playbackHands !== 'none'`).
- [ ] **FALSE** `content/lessons/1.4.md:53` — "One alternating-hands tune at 70 bpm at 90 %"
  - Is: holds for *Ode to Joy (hands alternating)* (84 bpm → 83 %); *When the Saints (hands alternating)* at 70 bpm is 73 % of its 96 and does not pass.
  - Evidence: catalog `tempoBpm`; `settingsStore.ts:138`.

Not checked in this lesson: nothing. Checked and true: grand staff and middle C's two positions (THEORY); in all three songs the hands never sound together (`dump_score.py` on `ode-to-joy.alternating` — RH bars 1–4, LH bars 5–8; `when-the-saints.alternating` — RH bars 0–3, LH bars 4–8; `lightly-row` — one staff); 3/4 and the dotted half (THEORY); *When the Saints* starts on beat two with a three-beat pickup (bar 0 `C4 E4 F4` quarters), lands its long note on beat one of bar 1 (`G4/who`), and its answering bars begin with a rest (bar 2 RH, bar 4 LH); *Ode to Joy (hands alternating)* is right hand then left; the left-hand sight-reading drill is on this rung and on 1.3.

## 1.5 — `content/lessons/1.5.md`

Claims checked: 20. Findings: 2.

- [ ] **FALSE** `content/lessons/1.5.md:46` — "whose melody is nearly all steps with one skip a phrase"
  - Is: it opens with a leap of a fourth (bar 1 D4→G4, again bar 5 D4→G4), bar 9 has two skips in a row (B4→G4→E4), and bar 10 another (E4→G4). Mostly steps, but not one skip a phrase.
  - Evidence: `dump_score.py song.folk.the-water-is-wide.pdmx` bars 1–11.
- [ ] **JUDGEMENT** `content/lessons/1.5.md:46` — "a slow Scottish air"
  - Is: the app plays and scores it at 96 bpm, a tempo the import defaulted (`tags: tempo-defaulted`), not a slow one; whether the air is "slow" as sung is a musician's call. "Scottish" matches the catalog's `composer: Traditional (Scottish)` (HISTORY, not further checked).
  - Evidence: catalog row `song.folk.the-water-is-wide.pdmx` (`tempoBpm: 96.0`, `tags: ["pdmx","tempo-defaulted"]`).

Not checked in this lesson: whether a chain of eight in Simon is "a real achievement" (judgement). Checked and true: step = 2nd line-to-space, skip = 3rd line-to-line (THEORY); the sight-reading generator gives a new four-bar phrase on each open (`ScoreScreen.ts:138-160`, `drill.reading.sight-reading-1` `bars: 4`); the ear drill is 2nd vs 3rd played back (`drill.ear.interval-2nd-3rd` intervals m2 M2 m3 M3; `DrillScreen.ts:1705-1710`); *Steps and Skips in C* has only 2nds and 3rds within C4–G4 (`dump_score.py exercise.reading.steps-and-skips-c`, every interval in bars 1–8); Simon plays a chain that grows by one, starts with keys lit and named (`help: show-keys`), fills a staff on the card as the chain sounds (`STAFF_POLICY` comment, `app/src/engine/drills/types.ts`), and has three help chips (`simon.ts:151-180`); Today's sight-read sits outside the session card, is chosen by stage, and keeps one seed per day (`TodayScreen.ts:176-183`, `:379-420`).

## practice.1 — `content/lessons/practice.1.md`

Claims checked: 6. Findings: 1.

- [ ] **FALSE** `content/lessons/practice.1.md:37` — "The drills do this to themselves now."
  - Is: only the prompt-card drills offer *Go over the ones you missed* (`promptsToGoOver` runs only when the drill is a `PromptDrill`). Rhythm, Simon, pedal, dynamics, backing-track and harmonic-dictation drills do not. The one drill on this rung, `drill.rhythm.mixed-values`, is a `RhythmDrill` and offers no go-over.
  - Evidence: `DrillScreen.ts:2032` (`drill instanceof PromptDrill ? promptsToGoOver(...) : []`); `app/src/engine/drills/fromCatalog.ts:564` (`new RhythmDrill`), `:483` (`SimonDrill`), `:540` (`ChordDictationDrill`), `:573-591` (pedal, dynamics, backing track).

Not checked in this lesson: nothing. Checked and true (for prompt drills): the go-over round holds only the missed or revealed prompts, shows the answer from the first moment, and records nothing (`app/src/engine/drills/review.ts:37-73`, `DrillScreen.ts:950`, `:2231-2285`).

## practice.2 — `content/lessons/practice.2.md`

Claims checked: 9. Findings: 2.

- [ ] **FALSE** `content/lessons/practice.2.md:37` — "a clean pass takes the tempo up a notch while a pass with a mistake takes it down — the rule above"
  - Is: the rule above (line 25) is three clean repetitions before going up; the app goes up after every single clean pass of the loop.
  - Evidence: `ScoreScreen.ts:1500-1530` (`climbLadder` calls `nextLadderTempo` on each lap); `PracticeEngine.ts:103-108`.
- [ ] **FALSE** `content/lessons/practice.2.md:26` — "up one notch — about 5 %, not 20."
  - Is: as a rule for the learner this is advice, but the app's Ladder, which line 38 says applies "the rule above", moves 10 percentage points of the written tempo per notch (so from 50 % to 60 % is +20 % of the current speed), and stops at 100 % unless the learner started above it.
  - Evidence: `app/src/engine/PracticeEngine.ts:67` (`LADDER_NOTCH_PCT = 10`), `:77` (`LADDER_CEILING_PCT = 100`), `:103-108`.

Not checked in this lesson: the claims about why slow practice works (teaching advice). Checked and true: the Ladder is in the ⋯ menu, needs a loop, and underlines the tempo figure while on (`ScoreScreen.ts:925-945`, `:2318-2324`; `ScoreScreen.css:25-29`).

## practice.3 — `content/lessons/practice.3.md`

Claims checked: 7. Findings: 1.

- [ ] **JUDGEMENT** `content/lessons/practice.3.md:14` — "It also produces markedly better retention a week later"
  - Is: a claim from motor-learning research (interleaved practice); plausible, but "markedly" and "a week later" should be confirmed by someone who knows the literature. The same goes for line 10 ("most of that climb is gone by tomorrow").
  - Evidence: not checkable in the repo.

Not checked in this lesson: nothing. Checked and true: review at 1, 3, 7 and 21 days after the first pass (`progressStore.ts:48`, `:486-510`); Today's sight-read sits outside the session card and is described in code as three minutes a day (`TodayScreen.ts:176-183`).

## practice.4 — `content/lessons/practice.4.md`

Claims checked: 8. Findings: 2.

- [ ] **JUDGEMENT** `content/lessons/practice.4.md:8` — "Piano injuries are real and they are almost always the result of practising through a warning rather than of one dramatic event."
  - Is: a factual-sounding medical generalisation; for a teacher or clinician to confirm.
  - Evidence: not checkable.
- [ ] **JUDGEMENT** `content/lessons/practice.4.md:42` — "Four twenty-minute sessions beat one eighty-minute one, both for learning and for your hands."
  - Is: consistent with distributed-practice research; for a teacher to confirm as stated.
  - Evidence: not checkable.

Not checked in this lesson: the medical advice on pain, numbness and seeing a doctor — safety advice, left as written. The lesson makes no claim about the app.

## practice.5 — `content/lessons/practice.5.md`

Claims checked: 8. Findings: 1.

- [ ] **JUDGEMENT** `content/lessons/practice.5.md:27` — "It takes a week and it is the only thing that works."
  - Is: a factual-sounding absolute about relearning a bad habit; for a teacher to confirm.
  - Evidence: not checkable.

Not checked in this lesson: the diagnostic in lines 37–39 (teaching advice). Checked and true: "the first lesson in this module" is chunking (`practice.1`, first in unit `practice.1.1`); *Rhythm only* judges timing and not pitch (`ScoreScreen.ts:895-915`) and *Blind* hides the notation while still judging (`:1100`).

## 2.1 — `content/lessons/2.1.md`

Claims checked: 22. Findings: 5.

- [ ] **FALSE** `content/lessons/2.1.md:35` — "The hands-together pattern drill (left hand holds C, right hand walks the five fingers)"
  - Is: `drill.technique.ht-holds` (`kind: five-finger`, `hands: both`, `leftHand: hold`) is built as a right-hand call-and-response: the app plays C4 D4 E4 F4 G4 F4 E4 D4 C4 and asks for it back "with the right hand". There is no left-hand part; `leftHand` is read by nothing, and `hands: both` is treated as right.
  - Evidence: `app/src/engine/drills/fromCatalog.ts:152-156` (five-finger is a notation kind), `:223-228`, `:611-636` (`buildTechniquePattern`: `root = hands === 'left' ? tonic - 12 : tonic`, prompt text names the right hand).
- [ ] **FALSE** `content/lessons/2.1.md:44` — "*Simple Gifts*, the Shaker melody, is on this rung: the left hand holds a note per bar"
  - Is: `song.folk.simple-gifts.pdmx` is a single treble staff with no left hand at all (`staves: 1`, `hands: right`). It is not a hands-together piece.
  - Evidence: `dump_score.py song.folk.simple-gifts.pdmx` bars 1–16 (RH only); catalog `notation.staves: 1`.
- [ ] **FALSE** `content/lessons/2.1.md:45` — "a tune that moves in steps and small skips"
  - Is: mostly steps and thirds, but it also leaps a fifth (bar 12 D5→G4; bars 8→9 C5→G5) and runs eighth notes and dotted quarters throughout, in B4–G5.
  - Evidence: `dump_score.py song.folk.simple-gifts.pdmx` bars 8, 9, 12.
- [ ] **FALSE** `content/lessons/2.1.md:49` — "Choose the right hand and switch it on"
  - Is: the rung's tool button (*Play it as a duet*) opens *Ode to Joy (hands together)* in Keep tempo with R already chosen, and Duet is already on by default; switching it "on" from there turns it off.
  - Evidence: rung 2.1 `tools: [{kind: duet}]`; `LessonScreen.ts:440-447` (`navigateScore(id, { mode: 'tempo', hands: 'R' })`, first playable song); `settingsStore.ts:156`; `ScoreScreen.ts:961-973`.
- [ ] **FALSE** `content/lessons/2.1.md:55` — "Hands together at 60 bpm at 90 % in Tempo mode"
  - Is: at 60 bpm only *Mary Had a Little Lamb (hands together)* (72 bpm → 83 %) records a pass; *Ode to Joy (HT)* 88 → 68 %, *Twinkle (HT)* 84 → 71 %, *Jingle Bells (HT)* 104 → 58 %.
  - Evidence: catalog `tempoBpm` for each `.ht` id; `settingsStore.ts:138`.

Not checked in this lesson: nothing. Checked and true (the four `.ht` songs, each read in `dump_score.py`): the left hand plays only whole and half notes, one or two a bar; columns coincide only on beats 1 and 3; the left hand stays on C3/F3/G3 with 5 on C3, 2 on F3, 1 on G3 (`<fingering>` read per note: every C3 is 5, every F3 is 2, every G3 is 1); all four are on the rung under their hands-together settings.

## 2.2 — `content/lessons/2.2.md`

Claims checked: 21. Findings: 6.

- [ ] **FALSE** `content/lessons/2.2.md:36` — "— and *Old MacDonald*."
  - Is: listed as the second eighth-note tune after *London Bridge*, but `song.folk.old-macdonald` has no eighth notes: quarters, halves and a whole note only.
  - Evidence: `dump_score.py song.folk.old-macdonald` bars 1–8 (e.g. bar 1 `C4/qua ×3 G4/qua`, bar 4 `C4/who`).
- [ ] **FALSE** `content/lessons/2.2.md:42` — "*Alouette* is the tune with the eighth notes in it"
  - Is: `song.folk.alouette.pdmx` is in 6/8 (F major, one flat), where the eighth is the counting unit and every bar is dotted quarters, quarters and eighths — not the paired eighths in 4/4 this lesson teaches.
  - Evidence: `dump_score.py song.folk.alouette.pdmx`: `times: ['6/8']`, key `-1`; bars 1–16.
- [ ] **FALSE** `content/lessons/2.2.md:43` — "the \"gentille Alouette\" figure is four quick notes"
  - Is: the four-note figure (bars 3, 7, 19, 23: G F G A) is written quarter–eighth–quarter–eighth in 6/8 — a long-short lilt, not four quick equal notes.
  - Evidence: `dump_score.py song.folk.alouette.pdmx` bar 3 `G4/qua F4/eig G4/qua A4/eig`.
- [ ] **THEORY** `content/lessons/2.2.md:43` — "if you count \"1 and 2 and\" out loud through it the rhythm places itself."
  - Is: believed wrong for this score: in 6/8 a quarter–eighth pair fills one dotted-quarter beat ("1-2-3" or "1 and-a"), so a duple "1 and 2 and" count does not line up with it.
  - Evidence: as above; theory.
- [ ] **FALSE** `content/lessons/2.2.md:45` — "with eighths in it once you have earned them."
  - Is: `drill.reading.sight-reading-2-right` is fixed at level 2, whose rhythm pool always includes eighths; nothing adapts to the learner, so eighths can appear in the first phrase.
  - Evidence: catalog params `{level: 2, bars: 4, hands: right}`; `app/src/engine/sightReading.ts:153-162` (level 2 rhythms include `DIVISIONS / 2`), `:310-335` (`pickRhythm` draws uniformly).
- [ ] **JUDGEMENT** `content/lessons/2.2.md:20` — "Almost every rhythm problem a beginner has is a subdivision problem"
  - Is: a factual-sounding generalisation for a teacher to confirm.
  - Evidence: not checkable.

Not checked in this lesson: nothing. Checked and true: the count-in is drawn over the score (`ScoreScreen.ts:372-381`, fed by `onBeat` in `ScoreSession.ts:129-137`); eighth-note value, flag and beam (THEORY); *London Bridge* has its eighth pair in bar 1 (`A4/eig G4/eig`) and a marked position with the thumb on D (bar 3 `D4(1)`) putting A under 5 (bar 1 `A4(5)`); *Rhythm only* is in the ⋯ menu only in Keep tempo, takes one tap per written note or chord on any key (`ScoreScreen.ts:909-914`, `:2310-2311`). The mastery line "one tune hands together" can be met only by *London Bridge*: of the rung's eight songs it is the only one with two staves (the other seven, checked in the catalog `notation.staves`, have one); at 72 bpm it is 82 % of its 88 and passes.

## 2.3 — `content/lessons/2.3.md`

Claims checked: 24. Findings: 7.

- [ ] **FALSE** `content/lessons/2.3.md:32` — "The left hand in these pieces plays the symbol as a block — all three notes at once"
  - Is: true of 2 of the rung's 7 songs. *Happy Birthday (simple)* and *Jingle Bells (G)* have block triads. *Happy Birthday* (full, `song.folk.happy-birthday`) plays rests on beat 1 and two-beat chords after it, mostly inverted sevenths (bar 2 D3-F3-G3, bar 5 E3-A♯3-C4). *Was wollen wir trinken*, *Dark Eyes*, *Auld Lang Syne* and *Skip to My Lou* are single-staff melodies with symbols and no left hand at all.
  - Evidence: `dump_score.py` on all seven `songOptions`; catalog `notation.staves` = 1 for the four `.pdmx` songs.
- [ ] **FALSE** `content/lessons/2.3.md:43` — "then *Happy Birthday* and *Jingle Bells* with block chords."
  - Is: the rung's *Jingle Bells* (`song.holiday.jingle-bells.g`) is in G major and its blocks are G, C and D7 — not the C, F, G the lesson names as "the three chords of this unit". *Happy Birthday (simple)* prints a G7 symbol (`G dominant`) over a plain G-B-D triad.
  - Evidence: `dump_score.py song.holiday.jingle-bells.g` bars 1–8 (key 1 sharp; `D3+F#3+C4` in bars 7–8); `dump_score.py song.folk.happy-birthday.simple` bars 2–3 (`[G dominant]` over `G2+B2+D3`).
- [ ] **FALSE** `content/lessons/2.3.md:41` — "you play all three notes together and MIDI checks them"
  - Is: the chord drill collects every note pressed since the card appeared and marks it right as soon as the set matches, so the three notes played one after another (a roll, or an arpeggio) also pass. "Together" is not checked.
  - Evidence: `app/src/engine/drills/PromptDrill.ts:93-111` (`held.push` on each note-on, `sameSet(held, expected)`; no timing window).
- [ ] **FALSE** `content/lessons/2.3.md:46` — "If the app reports the chord as three separate notes"
  - Is: nothing reports a rolled chord. The drill accepts it (above); the Score engine counts `rolledChordSteps` but no screen shows it — the summary prints Accuracy, Tempo, Ladder, Wrong notes, Missed, Weakest bars and Timing only.
  - Evidence: grep for `rolledChordSteps` under `app/src`: `PracticeEngine.ts:245`, `:777`, `:1256`, `Scoring.ts:94`, `:136`, `types.ts:379` — no UI reader; `ScoreScreen.ts:2027-2056` (the stat lines).
- [ ] **FALSE** `content/lessons/2.3.md:49` — "*Skip to My Lou* is on this rung: two chords, C and G"
  - Is: `song.folk.skip-to-my-lou.pdmx` is in D major and its symbols are D and A. It is a one-staff melody (F♯5–A5 range), so there is no left hand to change chord in.
  - Evidence: `dump_score.py song.folk.skip-to-my-lou.pdmx`: key `2`, chords `D major` / `A major`, one staff; catalog `notation.chords: ["A","D"]`.
- [ ] **FALSE** `content/lessons/2.3.md:50` — "changing every two bars"
  - Is: D for bars 1–2, A for 3–4, D for 5–6, then A for one bar (7) and D for one (8).
  - Evidence: `dump_score.py song.folk.skip-to-my-lou.pdmx` symbols at bars 1, 3, 5, 7, 8.
- [ ] **STALE** `content/lessons/2.3.md:59` — "Twenty chord changes at 95 %"
  - Is: this is the rung's `mastery.custom` (`chord-drill-20-changes>=0.95`), which no code measures; the chord drill serves 10 cards a set.
  - Evidence: `app/src/engine/drills/fromCatalog.ts:177` (`count ?? 10`), `:315-322`; `selectors.ts:83-86` (the custom string is read only to refuse paper passes).

Not checked in this lesson: "Nearly every folk, hymn and pop song you know is mostly these three chords" (line 25, JUDGEMENT-grade generalisation, not listed separately). Checked and true: triad construction, snowman shape, C/F/G spellings, I/IV/V as degrees, and that I, IV, V contain all seven notes (THEORY); root-position C→F is a fifth down and C→G a fourth down, as written in *Happy Birthday (simple)* (C3→F2 bar 7, C3→G2 bar 2); *Show me* lights the chord and engraves it as one whole note, *Hear it* plays it, and either forfeits the card (`answerSheet.ts:11`, `:131-132`; `DrillScreen.ts:1735-1754`); the chord drill is on the rung (`drill.chord.c-f-g`, chords C F G, root position).

## 2.4 — `content/lessons/2.4.md`

Claims checked: 20. Findings: 5.

- [ ] **FALSE** `content/lessons/2.4.md:43` — "*Greensleeves* — a minor-key tune built almost entirely out of the dotted-quarter-plus-eighth figure."
  - Is: minor key is right (A minor), but the figure is in about half the bars: in *Greensleeves (simple)* 7 of 15 full bars (2, 4, 6, 10, 12, 13, 14); the rest are half + quarter. *Greensleeves (with chords)* is the same melody; the full *Greensleeves* has the same proportion.
  - Evidence: `dump_score.py song.folk.greensleeves.simple` bars 1–15; `song.folk.greensleeves.chords` bars 1–15; `song.folk.greensleeves` bars 2–33.
- [ ] **FALSE** `content/lessons/2.4.md:57` — "*Greensleeves* is nearly all that figure, so the tune is the exercise."
  - Is: as above — about half.
  - Evidence: as above.
- [ ] **FALSE** `content/lessons/2.4.md:51` — "and let the left hand's three beats keep the time."
  - Is: `song.folk.streets-of-laredo.pdmx` has one staff and no left hand.
  - Evidence: `dump_score.py song.folk.streets-of-laredo.pdmx` bars 1–17 (RH only); catalog `notation.staves: 1`, `hands: right`.
- [ ] **FALSE** `content/lessons/2.4.md:49` — "a slow waltz in 3/4 with a dotted rhythm at the start of nearly every phrase."
  - Is: 3/4 is right. The phrases (after an eighth pickup) begin in bars 2, 6, 10 and 14 with a half note or quarter plus eighths; the dotted quarters fall on beat 2 of each phrase's *second* bar (bars 3, 5, 7, 11, 15), not at the start. The app runs it at 96 bpm, a defaulted tempo (`tags: tempo-defaulted`), so "slow" is not what the app plays.
  - Evidence: `dump_score.py song.folk.streets-of-laredo.pdmx` bars 1–17; catalog `tempoBpm: 96.0`, `tags`.
- [ ] **UNVERIFIED** `content/lessons/2.4.md:56` — "it is marked early the moment it arrives before the \"and\""
  - Is: a strike up to `toleranceMs` (150 ms by default) early is matched to its slot as a hit, and the summary reports "% early"; whether the sheet marks that single note early as it lands was not traced to the drawing code. An eighth more than 150 ms early matches nothing and counts as wrong, not early.
  - Evidence: `PracticeEngine.ts:949-985` (`findSlot` / `findRhythmSlot`, `distance <= toleranceMs`); `settingsStore.ts:136`; `ScoreScreen.ts:2056`.

Not checked in this lesson: that the HP-130 sends graded velocity (not recorded in `docs/07-midi-hp130-notes.md`; the lesson's claim is the ordinary behaviour of a velocity-sensing keyboard). Checked and true: tie and slur definitions, dotted quarter = 1½ beats counted "1 and 2 / and", dynamics and tempo words (THEORY); the dynamics drill asks for a phrase piano then forte, shows both on a velocity meter, and passes at a mean ratio ≥ 1.6, matching the mastery line (`app/src/engine/drills/special.ts:385-430`, `DrillScreen.ts:1211`, `:1562-1582`; catalog `drill.dynamics.p-f` `ratio: 1.6`); *Streets of Laredo* is on the rung.

## 2.5 — `content/lessons/2.5.md`

Claims checked: 18. Findings: 6.

- [ ] **FALSE** `content/lessons/2.5.md:32` — "Position-shift drills first"
  - Is: `drill.technique.position-shifts` (`kind: five-finger`, `shifts: true`) builds the same call-and-response as the plain five-finger drill: C4 D4 E4 F4 G4 F4 E4 D4 C4 in the right hand, with no shift. `shifts` is read by nothing. (The rung's scored exercises `exercise.position-shift.*` do shift — e.g. `position-shift.c.right` bar 3 moves to G4–C5.)
  - Evidence: `fromCatalog.ts:611-636`; grep for `shifts` under `app/src/engine/drills/` returned nothing; `dump_score.py exercise.position-shift.c.right` bars 1–4.
- [ ] **FALSE** `content/lessons/2.5.md:33` — "*Ode to Joy (full theme)*, which has one thumb-under in it"
  - Is: its printed fingering has no thumb-under. The right hand stays in C position (C4=1 … G4=5) except the bar-12 shift; every finger-1 C4 follows a higher note (bars 3, 7, 9, 10, 15), which is not a thumb passing under.
  - Evidence: `<fingering>` per note in `song.classical.ode-to-joy.full`, bars 1–17 (e.g. bar 9 `D4(2) D4 E4(3) C4(1)`, bar 12 `C4(1) D4(2) G3(5)`).
- [ ] **FALSE** `content/lessons/2.5.md:34` — "Its version in G is two rungs on, once the key has a sharp in it."
  - Is: `song.classical.ode-to-joy.g` is on 3.1, the next core rung after 2.5 (not two on); and a G-major version, `song.classical.beethoven-ode-to-joy.easy`, is already on this rung.
  - Evidence: every rung's options searched for `ode-to-joy`: `ode-to-joy.g` on 3.1 and 4.1; `beethoven-ode-to-joy.easy` on 2.5, 4.1, 4.4; its key G major (`dump_score.py`, key `1`).
- [ ] **WRONG-COUNT** `content/lessons/2.5.md:41` — "*Sight-read, right hand* is here as it was two rungs ago"
  - Is: it was last on 2.2, three core rungs before 2.5 (2.3 and 2.4 between).
  - Evidence: rungs offering `drill.reading.sight-reading-2-right`: 2.2 and 2.5 only.
- [ ] **FALSE** `content/lessons/2.5.md:42` — "the difference now is that the generated phrases can leave C position"
  - Is: it is the same drill with the same parameters as on 2.2 (`level 2, right, 4 bars`), so nothing is different now; level 2 already spans C4–C5, beyond C position, on 2.2.
  - Evidence: catalog `drill.reading.sight-reading-2-right` params; `sightReading.ts:153-162` (`rhKey 60–72`).
- [ ] **THEORY** `content/lessons/2.5.md:18` — "*Ode to Joy (full theme)* uses one in bar 12, where the tune drops to the G below middle C."
  - Is: the shift and the G3 are there (bar 12 `C4 D4 G3`), so the lesson is right; but the score fingers that G3 with right-hand **5**, below a thumb on C4 — a musician should check the printed fingering, which is what the lesson tells the learner to trust.
  - Evidence: `<fingering>` in `song.classical.ode-to-joy.full` bar 12: `C4(1) D4(2) G3(5)`.

Not checked in this lesson: whether a bump on the thumb note is caused by "the whole arm shifted" (teaching advice). Checked and true: right-hand scale 1-2-3 then thumb under to F, 1-2-3-4-5 to C; left hand 5-4-3-2-1 then 3 over onto A (`exercise.scale.c-major.1oct.similar.left.2` fingering `C3(5) D3(4) E3(3) F3(2) G3(1) A3(3) B3(2) C4(1)`) (THEORY and score); the scale exercises are one octave in eighth notes (`exercise.scale.c-major.1oct.similar.right.2` bars 1–2), matching the mastery line.

## holiday — `content/lessons/holiday.md`

Claims checked: 22. Findings: 1.

- [ ] **FALSE** `content/lessons/holiday.md:38` — "*We Three Kings* is the minor one, in E minor and in 6/8 like *Silent Night*."
  - Is: 6/8 is right and the verse (bars 1–8) is in E minor, but the refrain (bars 9–17) is in G major and the piece ends on a G chord — it is not simply "in E minor".
  - Evidence: `dump_score.py song.classical.1863-rev-john-henry-hopkins-we-three-kings-of-orient-are.pdmx`: bars 1–8 over Em/B7, bars 9–17 over D7/G/C/G, last bar `[C major] [G major]`.

Not checked in this lesson: "they are almost all public domain" (HISTORY, general, not checked per carol); whether *holiday.4* is fairly summed up as "making a carol sound finished" (its lesson was not read — it is not in this batch). Checked and true: "Six options" — six `songOptions`, counting the two *Jingle Bells* settings; *Jingle Bells (HT)* left hand plays single roots C3, F3, G3 (see 2.1); *Silent Night (melody)* is in C with symbols C, F, G, G7 and in 6/8 (`dump_score.py`, bars 1–12); *Jolly Old Saint Nicholas* has no chord symbols (`chordCount: 0`) and is in B♭ with two flats (key `-2`, ends on B♭4); *Good King Wenceslas* is in G with symbols Em, D7 and B7 beyond G, C, D (`notation.chords`); the three exercises are *Hands together in C — left hand holds*, the C/F/G chord drill, and an I–IV–V7–I cadence (`dump_score.py exercise.cadence.c.root`: C, F, G7, C); I, IV, V in C = C, F, G (THEORY); 6/8 felt in two (THEORY); the Library's Track filter has *Holiday*, holding 36 items (`LibraryScreen.ts:438`, `00-tracks.json`); the next holiday rung, "Playing for people who are singing", is at Stage 3 (`holiday.3`) and the one after is at Stage 4 (`holiday.4`); the *Primary chords* preset plays I–IV–V–I with a melody on top and leaves the key free (`sightReading.ts:837-851`: `progressionId: 'i-iv-v-i'`, `rightHand: 'melody'`, locks progression and left hand only — it opens in D, so "set it to C" is a real step); Free play names the chord held (`FreePlayScreen.ts:153`).

## hymns.2 — `content/lessons/hymns.2.md`

Claims checked: 16. Findings: 3.

- [ ] **FALSE** `content/lessons/hymns.2.md:20` — "The drills here are the same three shapes against the clock"
  - Is: only `drill.chord.c-f-g` is C, F and G. `drill.chord.symbol-flash` (level 3.2) asks for random triads and sevenths — major, minor, 7, m7, maj7 on the roots C D E F G A B. Neither drill has a time limit; a card waits for the answer.
  - Evidence: `app/src/engine/drills/fromCatalog.ts:295-305` (no `chords` param → random roots × qualities `['', 'm', '7', 'm7', 'maj7']`), `:315-322`; catalog `drill.chord.symbol-flash` params `{mode: symbol-flash}`; `PromptDrill.ts:93-111` (no timeout).
- [ ] **FALSE** `content/lessons/hymns.2.md:31` — "*Joyful, Joyful* is Beethoven's tune and will be familiar, which helps — you will hear when a chord is wrong."
  - Is: the main notes are Beethoven's tune, but the score is written the way bagpipe music is — no key signature, and a grace note (72 in all) before nearly every note — so as the app plays it the tune sits on D with F natural, a minor third, and is heavily ornamented. It will not sound like the familiar tune; this needs a musician's ear (nothing here has been heard). Its tempo is 40 bpm.
  - Evidence: the `.mxl` read directly (`scores/pdmx/QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7.mxl`): `<fifths>0</fifths>`, no `<alter>` anywhere, 72 `<grace>` notes; melody without graces bars 1–4 `F5 F5 G5 A5 | A5 G5 F5 E5 | D5 D5 E5 F5 | F5. E5 E5` (Ode to Joy on D); catalog `tempoBpm: 40.0`.
- [ ] **UNVERIFIED** `content/lessons/hymns.2.md:31` — (the tool, not the lesson) "*Joyful, Joyful*"
  - Is: `dump_score.py` prints grace notes as ordinary eighth notes (it does not read `<grace>`), so its dump of this piece shows bars of seven beats in 4/4. Any claim about this score checked only through `dump_score.py` would be wrong; the finding above was checked against the MusicXML.
  - Evidence: `dump_score.py song.classical.beethoven-ludwig-van-beethoven-joyful-joyful-we-adore-thee.pdmx` bar 3 vs the raw `<measure number="3">` (G4, D5, C5 are `<grace slash="yes"/>`).

Not checked in this lesson: "Almost all of them use three or four chords" and "it will fight the tune about once a line" (generalisations about hymnody, not listed). Checked and true: "Four options, from easiest up" — four songs at levels 1.4, 2.25, 2.49, 2.85; *When the Saints* is hands-alternating; *Be Thou My Vision* is in 3/4 (G major); *Swing Low* is the only one of the four with chord symbols (`chordCount` 0, 0, 0, 20); the four-part version is the next rung on this track (`hymns`, Stage 3, "Four-part texture and walk-ups"); Free play names the held chord (`FreePlayScreen.ts:1-20`, `:153`).

## 3.1 — `content/lessons/3.1.md`

Claims checked: 19. Findings: 1.

- [ ] **UNOFFERED** `content/lessons/3.1.md:33` — "G major and F major scales, hands separately, one octave."
  - Is: the rung offers only the right-hand scales (`exercise.scale.g-major.1oct.similar.right.2`, `exercise.scale.f-major.1oct.similar.right.2`). The left-hand ones exist in the Library (`…g-major.1oct.similar.left.2`, `…f-major.1oct.similar.left.2`) and the lesson does not point there. The mastery line (43) asks for the same.
  - Evidence: rung 3.1 `exerciseOptions`; catalog ids beginning `exercise.scale.g-major.1oct` / `exercise.scale.f-major.1oct` (four each: left, right, both similar, both contrary).

Not checked in this lesson: nothing. Checked and true: half and whole steps, sharps and flats, enharmonic names, E♯ = F, W–W–H–W–W–W–H, G major's F♯ and F major's B♭, key signature and the one-bar reach of an accidental (THEORY); note flash shows sharps and flats (`drill.reading.note-flash-accidentals` draws from every semitone F2–A5 and spells C♯ E♭ F♯ A♭ B♭, `factories.ts:35-49`, `types.ts:283`); *Ode to Joy in G* never plays an F♯ in either hand (`dump_score.py song.classical.ode-to-joy.g` bars 1–17: RH D4–D5 without F, LH G3 and D3 only); *Twinkle in F* plays B♭ repeatedly (bars 3, 5, 7, 11 RH `Bb4`, bars 2, 3, 10, 11 LH `Bb3`); both songs are on the rung.

---
Batch 1: 22 of 22 lessons. 74 findings
(52 FALSE, 3 STALE, 1 WRONG-COUNT, 1 UNOFFERED, 6 THEORY, 9 JUDGEMENT, 2 UNVERIFIED).
Lessons not finished: none.
