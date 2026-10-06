# Mode sheet: what each app mode does, records, and cannot establish

Fact-gathering for the station-to-mode synthesis. Read from the code at the working tree on 2026-10-05. Nothing was run; every claim is from reading source, the UI spec (`docs/04-ui-spec.md`) and the shipped content JSON.

Tags: **[O]** observed in code or content at the cited line; **[I]** my inference from what was observed; **[U]** not established from the code read. Paths are relative to `app/src/` unless they start `docs/` or `content/`.

---

## 0. The recording model every block below refers to

**R1. A Score-screen run** (Wait, Keep tempo, and their options) writes one `SessionRow` through `recordRun` (`ui/screens/ScoreScreen.ts:4124-4170`, `data/progressStore.ts:235`). The row carries `mode` (`wait` or `tempo`), `tempoPct`, `tempoMeasured`, `accuracy`, `wrongNotes`, `missed`, per-step codes, timing (Keep tempo only), `hands` (what the learner played, what the app played), `keys` (view, guide, finger numbers, names), `input` source, `range` (the printed bars covered), `firstContact`, and `lessonId` only when a rung or a Today card opened the screen (`ScoreScreen.ts:3814-3851`, `data/db.ts:145-263`, `data/db.ts:414-497`) [O]. A run with nothing heard stores `accuracy: not measured` and asks for a self-report instead (`ScoreScreen.ts:4090-4093`) [O].

**R2. Skill evidence is written only for sight-reading rows.** `SHIPPED_SKILL_ACTIVATION` is `item.drill?.kind === 'sight-reading'` (`curriculum/skillActivation.ts:41`); the Score screen computes evidence only for `skillsInForce(item)` (`ScoreScreen.ts:4181-4186`) [O]. A piece, an excerpt, an import, a lab build or a drill therefore adds no skill evidence and cannot move any ladder state [O, from those two lines; I that nothing else writes it: no `evidence` reference in `DrillScreen.ts` or `PaperScreen.ts` by grep].

**R3. What `rungState.ts` can compute from rows** (`evidence/rungState.ts:368-434`): `runs` (distinct items with a run judged by that rung that meets the standard), `reads` (sight-reading evidence records at a standard and share), `skill` (ladder state over all evidence, any rung), `done` (item finished, nothing missed, accuracy at standard where measured), `measure` (a technique result of `met`), `unjudged` (shown, never counted). Only rows whose `lessonId` is the rung count for `runs`, `reads`, `done`, `measure` (`rungState.ts:336-338`, `373-379`) [O].

**R4. What a "run" must be to count** (`rungState.ts:205-240`): accuracy a number and `measured` by `accuracyReading`; not `rhythmOnly`; not a phrase met before; not a self-report. Then `meetsStandard`: Simon passes on its chain (`:230`), any other drill passes on accuracy alone (`:232`), `tempo` needs `tempoPct >= passTempoPct` and `tempoMeasured !== false` (`:233-237`), `wait` passes only if the tempo floor is `<= 0` (`:238`), every other mode (`paper`, `drill:` aside) returns false (`:239`) [O].

**R5. Drill rows** are `mode: drill:<kind>`, `tempoPct: 100`, `tempoMeasured: false`, accuracy, wrong notes, missed, answered (`ui/screens/DrillScreen.ts:3162-3180`, `329-348`). Per-card answers and reaction times are shown on the sheet only; `meanReactionMs` is read nowhere in `data/`, `evidence/` or `curriculum/` [O, by grep]. A set stopped early is kept only if the learner chooses (`DrillScreen.ts:3104-3110`) [O].

**R6. The skills the ladder can read at all** are the 17 in `content/curriculum/vocabulary/skills.json`. Four conditions decide support: `keep-tempo` (`mode === 'tempo' && tempoMeasured !== false`), `unseen`, `guide-off`, `both-hands`, `names-off` (`evidence/evidence.ts:296-306`). Pitch-only skills (`bass-clef`, `ledger-lines`, `interval-reading`, `key-signature`, `accidentals`) carry no keep-tempo condition; `sight-reading`, the rhythm skills, `hand-independence` do [O].

**R7. Shipped curriculum, requirement kinds** (counted from `content/curriculum/stage-0..9.json`): `runs` 171 (2 with `performance: true`: 4.6, `classical.4.shelf`), `unjudged` 19, `skill` 6, `done` 3, `reads` 2, `measure` **0** [O]. So the technique measures never gate a rung; the `measure` machinery (`rungState.ts:424-431`) has no shipped consumer [O, by count].

---

## 1. Score screen: Wait for me (`wait`)

- **Learner does.** The page holds until the right note is struck; no clock. [O `engine/PracticeEngine.ts:905-967`, spec `04` "The four modes"]
- **Records.** R1 row, `mode: wait`, `tempoMeasured: false` (`ScoreScreen.ts:4157`, `engine/Scoring.ts:464-466`). Timing is `not measured` (`Scoring.ts:209`). Accuracy is steps completed cleanly over steps (`Scoring.ts:234-236`); a step is clean with no wrong key and at most one reset (`PracticeEngine.ts:1004`). Wrong keys count. Rolled-chord count is kept (`:1012-1015`). Evidence: only if the item is a sight-reading row, and then only the pitch channel; the timing channel is refused with reason `wait` (`evidence/measurement.ts:204`) [O].
- **Measures honestly.** Whether the right pitches were found, in order, with no stray keys, with no time pressure.
- **Cannot establish.** Any tempo, pulse or time-keeping. It meets no rung standard (see claim 1). It cannot be master-eligible (`Scoring.ts:515-518`) [O]. It cannot show reading fluency under time (R6: sight-reading needs keep-tempo) [O].
- **Settings.** `waitStrict` default false (`data/settingsStore.ts:149`); lookahead on, so a note of the next step is buffered (`engine/types.ts:246`, `PracticeEngine.ts:935-941`); hands; "Name the note I am waiting for" makes `keys.names` true and so removes `names-off` support (`ScoreScreen.ts:5294`); microphone chord leniency can complete a chord unclean (`PracticeEngine.ts:1055-1077`) [O].
- **Keeps.** One row, minutes, best accuracy (best tempo is advanced only by a pass with a measured tempo: `progressStore.ts:285-287`). A run in progress is offered again on return (spec) [O].

## 2. Score screen: Keep tempo (`tempo`)

- **Learner does.** Count-in, then plays against a moving cursor and click that carry on regardless. With an input connected the learner's own first note starts the clock (`latchStart`, `PracticeEngine.ts:433`, `870-900`) [O].
- **Records.** R1 row with `tempoMeasured: true`, accuracy = notes struck in window less one per wrong key, over expected notes (`Scoring.ts:238-241`), early notes counted once, per-note onset deltas, timing mean and sd (`engine/types.ts:380-455`) [O]. Window is `toleranceMs`, default 150 ms, inclusive (`data/settingsStore.ts:151`, `engine/types.ts:248`, `PracticeEngine.ts:1526-1531`) [O]. Evidence: for sight-reading rows, pitch and timing channels (`evidence/measurement.ts:151-235`) [O].
- **Measures honestly.** Right pitch at the right moment, within ±150 ms, against a clock the app supplies, at the chosen percentage of written tempo; hot-spot bars; early/late bias.
- **Cannot establish.** (i) That the learner holds a steady pulse unaided: the clock is the app's, and after the learner's first note every note is judged against it [I from `PracticeEngine.ts:870-900`]. (ii) Fine rhythm: a 150 ms window cannot resolve sub-beat errors at moderate tempo; the evidence function refuses the timing channel at steps it cannot resolve (`evidence/evidence.ts:41-47` header) [O]. (iii) Whether `timing.sdMs` shows steadiness: stored, read by no requirement [O, `rungState.ts` reads accuracy and `tempoPct` only]. (iv) `tempoPct` is the slider setting; what passes is "played this accurately while the clock ran at this setting" [O `Scoring.ts:474-476`].
- **Settings.** Tempo %, metronome on/off (cursor still moves), count-in bars (default 1), hands, tolerance, pass pair 90 % / 80 % (clamped 30-130, `settingsStore.ts:152-153,231`), lesson's own numbers where it states them (`curriculum/selectors.ts:86-98`) [O].
- **Keeps.** Row; best accuracy; on a pass, `passedOn`; mastery needs 97 % at 100 % on two days (`progressStore.ts:195-224,301`, `MASTER_DAYS = 2` at `:105`). A rung counts only runs opened from that rung (R3) [O].

## 3. Score screen: Play it to me (`listen`) and Hear it

- **Learner does.** Watches and listens. [O spec]
- **Records.** No session row: `run` is null for `listen` and `free` (`ScoreScreen.ts:4124-4125`) [O]. A hearing is noted for the encounter history (`demonstrated`, `heardAt`), which makes a later sight-read of that phrase "met before" (`ScoreScreen.ts:3878-3881`, `4098-4099`) [O].
- **Measures.** Nothing. **Cannot establish.** Anything about the learner. **Side effect that matters:** hearing a sight-reading phrase before reading it forfeits its status as a first reading [O].

## 4. Score screen: Free play (`free`)

- **Learner does.** Plays; the page turns when the notes under the cursor are struck (`PracticeEngine.ts:979-995`). A wrong key is not wrong, not counted, not recorded [O].
- **Records.** Nothing (`ScoreScreen.ts:4124-4125`). Metronome is off: there is no clock (spec) [O].
- **Cannot establish.** Anything. It is a way to play a piece with the page following.

## 5. Free play, standalone (`#/play`)

- **Learner does.** Plays anything; the keys held light, are named, and three or more distinct pitch classes get a chord name (`ui/screens/FreePlayScreen.ts:147-171`, `engine/drills/theory.ts` `nameHeldChord`) [O].
- **Records.** Nothing: the file imports no store, writes no row, keeps no state beyond the held set (`FreePlayScreen.ts:22-34`, `93-220`) [O]. Microphone notes below confidence 0.5 are dropped from the display (`:43,149`) [O].
- **Measures.** Nothing. The chord name is a readout of what is held, not a verdict.
- **Cannot establish.** Anything about the learner. It can show the learner what chord they are holding; it cannot show whether it was the intended one.
- **Settings.** None. Works with screen keys only (`:99-107`).

## 6. Simon (`drill:simon`)

- **Learner does.** Hears one note, plays it back; then that note plus one; the chain grows to 12 or until broken (`engine/drills/simon.ts:94,445-626`). Replay of the chain is free (`DrillScreen.ts:2770-2775`, button at `:2772`). Octave counts: no octave tolerance (`simon.ts:26-28,568`) [O].
- **Records.** One `drill:simon` row: accuracy = longest chain / 12, `answered` = attempts (`simon.ts:605-626`, `DrillScreen.ts:294-298`). Pass at chain 5, master-eligible at 8 (`simon.ts:100,103,295-300`) [O]. `rungState` judges it by `simonOutcome(simonBestChain(...))` (`rungState.ts:230`) [O]. The help level is **not** stored: `detail` holds only `longestChain` (`simon.ts:624`) [O].
- **Measures honestly.** Exact ordered, octave-exact reproduction of a heard pitch chain, up to the length reached.
- **Cannot establish.** (i) Ear versus eyes: on "Keys shown" the keys light and are named as the chain plays (`simon.ts:151-166`), so a chain can be copied from the lights; on all three rungs the score is the same and the row does not say which was used (`simon.ts:119-124,624`) [O]. (ii) Interval or pitch naming; no label is ever asked. (iii) On "After a miss", a miss re-asks the same chain and the count is right answers, so it measures depth reached over several attempts, not first-try depth (`simon.ts:586-607`) [O]. (iv) Retention beyond seconds.
- **Settings.** Help rung (3 levels), item (white keys of C; chromatic; blues-C), `rounds` (`fromCatalog.ts:500-523`).
- **Keeps.** A personal best is derived from `bestAccuracy` (`simon.ts:431-443`) [O].

## 7. Accompaniment lab (`#/lab`)

Four things share the screen. Nothing on it writes a practice row except the import Read it creates; the practice row is then the Score screen's.

### 7a. Read it
- **Learner does.** Settings are written out as a MusicXML exercise and opened on the Score screen as an import tagged "Accompaniment lab", level 3, marked estimated (`ui/screens/LabScreen.ts:296-326`); the oldest builds beyond 5 are deleted (`:91`) [O].
- **Records.** Whatever the Score screen records for an import (R1). No `lessonId` is set by the lab (it calls `router.navigateScore(row.id)`), and no rung lists the import (`updateImport` sets `tags`, `level`, `levelSource` only), so no rung counts the run [O]. No skill evidence (R2) [O].
- **Measures.** Execution of a written accompaniment pattern (left-hand shape, chord tones or melody on top) with the Score screen's own judging.
- **Cannot establish.** Playing without the page; the written part is the generator's, so it says nothing about choosing a voicing.

### 7b. Jam it: Bed only / Hold the chords / Play the tune
- **Learner does.** Plays over a metronome-clocked bass-and-drums loop for the chosen progression, key and tempo. The chart marks the sounding bar; the chord tones of the bar are lit on the keys throughout (`LabScreen.ts:489-496`) [O].
- **Records.** Nothing is stored. With the bed on (`hold` or `tune`), notes are collected per time round and a one-line count is shown, then dropped (`LabScreen.ts:986-993`, `545-560`, `stopJam` clears it at `:960-963`) [O]. With **Bed only** (`bed === 'off'`) no note is collected at all (`:993`) [O]. This is the lab's equivalent of free play: a running time and harmony framework with no judging [I; there is no mode in the lab called Free play, the preset chip labelled "Free" (`:1392`) is "no preset", not a play mode].
- **Measures.** Hold the chords: how many played notes are in the progression's scale (blues scale for the 12-bar form, else the key's). Play the tune: how many played notes are a chord tone of the bar they were struck over (`engine/sightReading.ts:3099-3116`, `LabScreen.ts:545-560`) [O]. The bar is the bar when the key went down, coarse by a fraction of a beat (`sightReading.ts:3093-3097`) [O].
- **Cannot establish.** Rhythm, entry, form awareness, voice-leading, or that the learner chose the notes: the chord tones are lit for them (`:489`), and the counts are by pitch class only, any octave, any time [O]. Nothing is stored, so nothing can be revisited.
- **Settings and locks.** Pickers: key (12 major, 9 minor), progression, numerals typed, left-hand pattern, right hand, bars (4, 8, 16; 12 or 24 for blues), tempo. **Presets** (`engine/sightReading.ts:2378-2486`): Primary chords (locks progression, left hand; opens Hold), Pop (progression, left hand; no bed default), Ballad (progression, left, right; Hold), Blues (progression, left, **bars**; Hold), Jazz (progression, left; Tune), Rock minor vamp (**key**, progression, left; Hold). A rung can hand a lock back (`labLocksFor`, `:2356-2363`) and can preselect the bed (`labBedFor`, `:2374`). Locked controls are disabled, not hidden (`LabScreen.ts:1192`). Refusals: Tune with right hand None, Hold with left hand None (`:415-423`) [O].

## 8. Trading fours (Lab, `trade 2` or `trade 4` chips)

- **Learner does.** App plays a generated call over the bed, then leaves the same number of bars; round and round. The app always leads; no first-note latch (`engine/tradingFours.ts:7-14`, `LabScreen.ts:671-680`). The call is seeded, one note per beat, chord tone on each downbeat, last beat a rest (`tradingFours.ts:105-145`) [O].
- **Records.** Nothing is stored (`LabScreen.ts:927`, `960-963`) [O]. At the hand-back a line says "In on your own bars / Not inside your own bars / You did not come in" plus "n of m in the <scale> scale" (`LabScreen.ts:639-662`) [O].
- **Measures.** `judgeTrade` takes notes, window, scale and a grace of half a beat: first note inside the window (`cameIn`), offset of the first note, notes inside the window, how many are in the scale (`tradingFours.ts:177-207`). **It has no parameter for the call**, so it cannot compare the answer to it [O].
- **Cannot establish.** Whether the answer relates to the call (by design, `tradingFours.ts:20-25`); rhythm inside the turn; whether the learner listened. `cameIn` reads the first note collected since the call began, so playing over the call counts as "not inside your own bars" even if the answer was fine (`LabScreen.ts:603-605`, `639-662`) [O reading; I on the consequence]. In-scale counting is by pitch class over any octave, any beat [O]. Chord tones are lit (`:489`), which lowers what in-scale shows about choice [I].
- **Settings.** 2 or 4 bars; exclusive with Hold and Tune; blues scale applies only if the progression id is `blues` (`tradingFours.ts:209-220`).

## 9. Perform

- **Learner does.** One pass; no restart row, no loop (`ScoreScreen.ts:2191,2608`). Route-set (`?performance=1`), so it survives reload [O].
- **Records.** An R1 row with `performance: true`, unless the piece was played to the learner part way through, in which case the flag is dropped and the take is practice (`ScoreScreen.ts:4098-4099,4161`) [O]. Progress lists performances separately (spec 5e).
- **Measures.** A single uninterrupted take's accuracy and, in Keep tempo, timing. The `performance: true` requirement counts only rows with the flag that also meet the normal standard (`rungState.ts:377-378`); two rungs use it (R7) [O].
- **Cannot establish.** That the learner chose where to go on after an error, or recovered: the cursor moves on a clock in Keep tempo, and per-step codes are stored but no code reads them as recovery (grep for `recover|landmark` in `app/src` finds nothing of the kind) [O, scoped to those words]. That it was done for an audience (no audience field) [O]. That the piece was memorised, since notation is shown unless Blind is also on [O].
- **Settings.** Can be combined with Blind (`ScoreScreen.ts:2123,2130`). Mode is not forced; a performance in Wait cannot meet any rung's tempo floor [I from R4].

## 10. Blind

- **Learner does.** Notation hidden, everything else running (`ScoreScreen.ts:321-332,839-846`) [O].
- **Records.** An ordinary R1 row. **There is no `blind` field on the row**: `RunHeader` (`data/db.ts:145-263`) and `runHeader` (`ScoreScreen.ts:3814-3851`) write none; the route carries it only. Rung 4.7 says so itself: its blind clause is `unjudged`, "A run with the score hidden is not recorded as such, and the two runs are not compared" (`content/curriculum/stage-4.json:589-591`) [O].
- **Measures.** The same as the sighted run in the same mode.
- **Cannot establish.** That a run was blind, or that a blind run was better or worse than a sighted one; that the learner did not follow the keys: the key strip still lights the next key by default (`settingsStore.ts:164-165`; `keys.guide` is stored, `ScoreScreen.ts:5287-5296`) and Blind hides only the stage [O]. Landmark choice, memory of structure, recovery after a slip: none computed (see Perform) [O].
- **Settings.** Keys view and guide decide how blind it really is [I].

## 11. Loop

- **Learner does.** Double-tap two bars; the section repeats (`ScoreScreen.ts:2608,4923`). Also set by route `?loop=` [O].
- **Records.** An R1 row with `range` set to the looped printed bars (`ScoreScreen.ts:3830`), `loops`; the engine rebuilds scoring per lap (`PracticeEngine.ts:1652-1676`) [O]. `rungState.ts` does not read `range`: a looped run that meets the standard counts as a run of the whole item (`rungState.ts:228-240,373-379`) [O, by absence of any `range` read there; U whether any other gate stops a partial range counting].
- **Measures.** Accuracy and timing over the chosen bars, for a lap.
- **Cannot establish.** Playing the whole piece; carrying a passage in context. [I]

## 12. Ladder

- **Learner does.** Switches on over a loop in Keep tempo; each clean pass raises tempo 10 points up to the ceiling (100 % or what the learner already asked for); a pass with any miss, wrong or early note lowers it 10 (`engine/PracticeEngine.ts:98-149`, `ScoreScreen.ts:2815-2860`). A pass nobody listened to holds (`ScoreScreen.ts:2829-2833`) [O]. Route-opened over a whole short exercise for seven rungs (spec 3d; `?ladder=1`).
- **Records.** The R1 row of whatever run is stopped; `tempoPct` is the tempo of that run, not a trajectory. No ladder history is stored [O: `startRun({fresh:false})` restarts; I that the row is the last run].
- **Measures.** Within a sitting, the tempo at which a bar or exercise stayed clean.
- **Cannot establish.** Retention of that tempo on another day; the row records a final tempo and accuracy, not the climb [I].

## 13. Duet

- **Learner does.** The app plays the hand not chosen (`playbackHands`, default `non-focused`, `settingsStore.ts:172`; row `ScoreScreen.ts:1974-2003`) [O]. This is the default whenever one hand is chosen on a two-hand piece.
- **Records.** `hands.appPlayed` on the row (`ScoreScreen.ts:3822-3827`). No requirement reads it; the evidence condition `both-hands` reads `hands.played` only (`evidence.ts:297`) [O].
- **Measures.** The chosen hand's accuracy and timing, with a musical context.
- **Cannot establish.** Hands-together skill (the other hand is the app's); independence. [I]

## 14. Rhythm only

- **Learner does.** Taps the rhythm on any key; extra keys are wrong (spec, `ScoreScreen.ts:1922-1931`) [O].
- **Records.** R1 row with `rhythmOnly: true`, `pitch` not measured (`measurement.ts:158`); accuracy is hits over expected notes (`Scoring.ts:232-241`); pass and master forced false (`ScoreScreen.ts:4029-4031`); technique measure skipped (`:4009-4011`) [O]. Excluded from rung runs by `measured()` (`rungState.ts:209`) [O]. The timing channel is not refused for rhythm-only rows (`measurement.ts:182-235`) [O; I that a sight-reading rhythm-only run could feed a timing-only skill's evidence, which I did not trace].
- **Measures.** Onset timing against the written rhythm, any key.
- **Cannot establish.** Pitch; playing the piece. **Settings.** A remembered preference that is cleared when a rung opens a counting run (`ScoreScreen.ts:5716`) [O].

## 15. Chord chart (`#/chart/<id>`)

- **Learner does.** Plays from one large chord symbol per bar. **Count off** starts the click for `countInBars` (default 1) in 4/4 and runs the tracker (`ChordChartScreen.ts:287-312`, `getSettings().countInBars`). Tempo field 40-240 (`:350-360`), defaulting to the item's tempo (`:591-598`). Swing, Comp and Bass + drums toggles. **There is no transpose control**: no `transpos*` in the file [O, by grep]. Keys sit under the transport and light what is held, never what is expected (`:20-30`) [O].
- **Records.** Nothing. The only judgement is a live bar cell that goes `yes`/`no`/`idle` by `chordMatch >= 0.6`, over what is held at that instant (`:57-58`, `209-215`, `score/harmony.ts:180-185`); extra notes are not penalised [O].
- **Measures.** Whether the held notes contain at least 60 % of the bar's chord's pitch classes.
- **Cannot establish.** Voicing, rhythm, time-keeping against the click, form awareness over a chorus, or anything over time; nothing is stored. [I]
- **Not offered** for pieces without chord symbols (spec 3b).

## 16. Today's daily sight-read, and its adaptation

- **Learner does.** One generated phrase per day from `dailySeed(day)` (`engine/sightReading.ts:3127`); the Score screen opens in Keep tempo for any sight-reading item (`ScoreScreen.ts:5696`) [O]. First attempt only: a phrase already run, heard or seen is practice and passes nothing (`ScoreScreen.ts:3878-3881`, `progressStore.ts:251-271`) [O].
- **Records.** R1 row with `seed`, `generator`, `recipe`, `unseen`, `firstContact`, `lessonId` if a rung chose the card (`ScoreScreen.ts:4124-4170`); stored sight-reading evidence: practice standard needs keep-tempo and unseen, full adds guide-off and names-off (`skills.json`, `evidence.ts:296-306`) [O]. The day is ticked by a seeded unseen run (`progressStore.ts:257`, `markDailyRead` at `:1381`) [O]. No pass, no mastery, no best for a generated phrase (`progressStore.ts:271-286`) [O].
- **Adaptation.** `readingOffer` (`curriculum/session.ts:2608-`) builds the next phrase: anchor row from the rung; last working recipe; reads against it. Policy (`session.ts:1948-1953`): an easy read after 3 non-easy reads; step down after 2 reads against (it turns the single-out demand's control off, or holds and says it is unsure); step up after full-standard support on 2 days (`RECENT_ATTEMPTS = 2`, `evidence/ladder.ts:87`) to the next taught demand. `engine/readingControls.ts` is the map from each demand to the generator option that writes it in (`on`), keeps it out (`off`), and `mayWrite`; the contract is held by `generatorContract.test.ts` and `UNREALISABLE_AT` lists the moves the generator cannot make (`readingControls.ts:1-34`) [O]. The numbers are "C4's starting number, never measured against a learner" (`session.ts:1925-1930` comment) [O].
- **Measures honestly.** The share of steps right in pitch and in time on an unseen phrase at the stated conditions, per demand located in the phrase.
- **Cannot establish.** Which demand caused a miss (one wrong note at a skip, in the left hand, during eighths is wrong under all three: `evidence.ts` header) [O]; reading ahead (4.6's `reading-ahead` is `unjudged`, R7); that guide-off held unless the settings say so: sight-reading defaults to guide off (`settingsStore.ts:166`) [O].
- **Rung readings it feeds.** `reads` requirements at 1.5 (full, 0.9, 5 phrases) and 3.4 (practice, 0.85, 5); `skill` at 1.3, 1.5, 2.2, 2.5, 4.5 (R7) [O].

## 17. Note flash (`drill:note-flash`)

- **Learner does.** A note on a staff; plays that key. Octave is not judged: the builder passes `anyOctave` true through `base`, matching the card text "in any octave" (`engine/drills/fromCatalog.ts:246-252`, `ui/screens/DrillScreen.ts:2637`) [O; the factory's own default is octave-sensitive, `factories.ts:55`, overridden by `base`; I on `base.anyOctave === true`: `DRILL_DEFAULTS.anyOctave`, `drills/types.ts:297`].
- **Records.** R5 row; share of cards right; Show me, Skip and a Hear it cost the card (`PromptDrill.ts:136-140`). No timing kept.
- **Measures.** Staff position to pitch class.
- **Cannot establish.** Octave or register reading; speed (reaction is shown, not stored); reading in context. No skill evidence (R2).

## 18. Find the key (`drill:find-key`)

- **Learner does.** A note name; finds the key. Judged by pitch class. [O `fromCatalog.ts:254-271`] The same builder serves finger-number and build-a-scale items (`:257-259` comment).
- **Records / cannot establish.** As note flash. It cannot show whether a landmark was used, only that the right key was found (no path, no timing stored) [O].

## 19. Ear drills: intervals, chords (`ear-interval`, `ear-chord`)

- **Learner does.** Hears two notes or a chord and **plays them back**; nothing is named (`DrillScreen.ts:2624-2670`). Judged by `sameSet`/`sameSequence`, any octave (`drills/types.ts:305-321`). Replay is free; Hear it plays the answer and forfeits the card (`DrillScreen.ts:2770-2775`, `2624-2670`).
- **Records.** R5 row; share right.
- **Measures.** Echo of the heard pitch set at pitch-class level.
- **Cannot establish.** Interval or quality identification as a concept (no name is asked or compared); octave placement. A learner who finds the notes by trial, within the free replays, can pass [I].

## 20. Ear drills: cadences and progressions (`ear-progression`)

- **Learner does.** Hears chords in sequence and plays them back. The cadence item names `authentic`, `half`, `plagal`, `deceptive` as sequences V-I, I-V, IV-I, V-vi (`fromCatalog.ts:397-431`, `content/catalog.static.json` `drill.ear.cadences`). The label is a name; the learner is never asked to name it [O].
- **Judging.** The answer is the flattened list of all the chord pitches, ordered (`fromCatalog.ts:421-422`, `PromptDrill.ts:98-104`): every note of every chord, in order, any octave [O]. A chord struck together lands in whatever note-on order the hand produces [I; U whether that always matches `chord.pitches` order].
- **Cannot establish.** Cadence recognition by name or function; chord quality identification.

## 21. Melodic dictation and "Answer the phrase" (`call-response`)

- **Learner does.** Hears an even stream of quarter notes (4 per bar, no rhythm) drawn at random from a range or a named scale; plays it back (`factories.ts:332-366`). The label is the note names, withheld until judged (`labelIsAnswer`, spec 5c). Judged ordered, any octave [O].
- **Records.** R5 row.
- **Measures.** Short-term echo of a pitch sequence at pitch-class level.
- **Cannot establish.** Rhythmic dictation (there is none); improvisation. The item titled "Answer the phrase" (`drill.improv.call-response`) is judged as an exact copy of the call, which is the opposite of the Lab's trading fours, where copying is deliberately not judged [O both; the contrast is mine].

## 22. Harmonic dictation (`harmonic-dictation`)

- **Learner does.** Hears a progression and plays back chords; the drill segments the stream by a 120 ms silence or by a note that belongs to the next expected chord (`engine/drills/harmony.ts:364,388-525`). Each chord is compared as a set, any octave, in order (`:513-517`) [O].
- **Records.** R5 row; share of progressions right; no per-card settle; learner presses Done.
- **Measures.** Whole-progression echo as chord sets.
- **Cannot establish.** Roman-numeral naming or function (the numeral label is a card text, not asked). Rhythm. A progression one chord short or long is wrong in full (`:514`).

## 23. Rhythm drill, and the item called "Rhythm dictation"

- **Learner does.** Taps a written rhythm against the click on any key; the rhythm is drawn on the card (`DrillScreen.ts:2040-2056`); first tap latches the start; tolerance 150 ms (`engine/drills/special.ts:39-210`) [O].
- **Records.** R5 row: onsets hit over onsets; extra taps counted as wrong notes (`special.ts:197-209`, `DrillScreen.ts:329-348`). `meanOffsetMs` is on the sheet only.
- **"Rhythm dictation" (`drill.ear.rhythm-dictation`).** The item carries `params.mode: "dictation"` and the concept `rhythm-dictation`, but no code reads `params.mode` (`fromCatalog.ts:576-594` builds it exactly as the other rhythm items) and the rhythm is shown on the card, not hidden [O]. So it is a read-and-tap drill, not an ear drill; no listening is demanded or tested [I from those two observations].
- **Cannot establish.** Pitch; hearing a rhythm and writing or tapping it back.

## 24. Tune playback (`ear-tune`)

- **Learner does.** Hears a four-bar diatonic tune (a seeded scale walk ending on the tonic, even note lengths) and plays it back a phrase at a time; phrase 1 replays the whole tune then itself (`harmony.ts:247-326`). Judged ordered, any octave [O].
- **Measures.** Echo of a longer pitch sequence, in chunks.
- **Cannot establish.** Playing by ear a real melody (the tune is generated, no rhythm); rhythm; harmonic understanding.

## 25. Reading and theory drills: chord, inversion, extended chord, roman numeral, chord-scale, modes, transposition

- **Learner does.** A name, symbol or numeral is shown; plays the notes together (chords) or from the bottom up (scales); transposition: reads four printed bars and plays them in another key (`harmony.ts:318` `transpositionDrill`). Chord kinds judged as a set in any octave; scales as ordered pitch classes [O].
- **Records.** R5 row; share right; a shown or played answer costs the card.
- **Measures.** Production of a named structure on demand.
- **Cannot establish.** Recognition by ear or eye in context; use in music. Transposition's printed bars come from the sight-reading writer with one hand (`harmony.ts:318` `transpositionDrill`) and the only judged output is the pitch list. [I on the last clause]

## 26. Pedal change and dynamics drills

- **Pedal.** Clean change = lift 0-120 ms after the new chord's first note, back down within 250 ms (`special.ts:250-330`). Needs MIDI with a pedal; screen keys cannot send one (spec). **Dynamics.** Mean velocity loud over soft, passes at 1.6; flat velocity (screen keys or microphone) is reported as an instrument fact, not a fail (`special.ts:434-516`) [O].
- **Records.** R5 rows. **But the rungs that name them do not gate on them:** 2.4 `dynamics-contrast>=1.6` and 3.5 `pedal-clean>=0.9` are `unjudged` (`content/curriculum/stage-2.json:344`, `stage-3.json:405`) [O].
- **Cannot establish.** Musical quality of pedalling or dynamics; only the two gestures measured.

## 27. Backing track (`drill:backing-track`)

- **Learner does.** Plays over a loop; "Done" ends it (spec). **Records.** `notesHeard` only; accuracy, wrong notes and missed are `not measured` (`DrillScreen.ts:329-337`; `UNJUDGED_DRILL_KINDS`, `data/accuracyReading.ts:53`). It cannot pass a requirement (`rungState.ts:205-213`) [O]. **Cannot establish** anything about the playing. A backing-track run is not judged.

## 28. Practise from the book (Paper, `mode: paper`)

- **Learner does.** Runs a timer and click while playing music the app cannot see; ends with Rough / OK / Clean (`PaperScreen.ts:300-361`).
- **Records.** `mode: paper`, `selfReport`, `notesHeard`, `steadinessMs` if meaningful, `bpm`; `passed` only if "clean" and flagged `selfPassed` (`:332-356`) [O]. `selfReport` makes the row unmeasured to `rungState` (`:211`), and mode `paper` fails `meetsStandard` (`:239`): a paper run never counts directly; a twin's run counts as the book piece (`rungState.ts:255-269`) [O].
- **Measures.** Time, notes heard, onset spread against the click.
- **Cannot establish.** Whether the notes were right: the learner's verdict is the only judgement of that.

## 29. Orientation items: checklist, tour, placement test (`drill:checklist`, `drill:walkthrough`, `drill:placement`)

- **Records.** Accuracy `not measured`; `missed` is ticks left over (checklist), 0 (tour, placement) (`DrillScreen.ts:3482-3500,3677-3696,4006-4024`). They feed `done` requirements at 0.1, 0.3, 0.4 (R7) [O].
- **Cannot establish.** Any playing.

## 30. Metronome (`#/metronome`) and PDF viewer (`#/pdf/...`)

- Both are named in the spec's "tools with a route of their own". Neither records a run: the metronome is a click (spec `04` 3713-3760); the PDF viewer shows pages and keeps only cut corrections with the score [O spec; I for "nothing in code" since I did not open `MetronomeScreen.ts` or `PdfScreen.ts`; U].

---

## 31. Lesson page (`lesson`)

- **Learner does.** Reads what the rung teaches: it explains, names, counts and shows notation before any practice, and opens a tool only by its buttons (`ui/screens/LessonScreen.ts`; the buttons go through `openItem`, `:237`) [O]. The page is a presentation surface, not a mode: nothing on it is played, scored or timed, and no chain step that names it as its tool measures anything.
- **Records.** No run row, no `notesHeard`, no skill evidence and no encounter: the page is read, not played, and a chain step whose tool is `lesson` leaves no trace of the practice [O at the imports and writes of `LessonScreen.ts`: it imports no `recordRun` and no evidence module; I that no other write exists, from a grep of the file, not a full read]. Its buttons write the learner's own word and a few choices, each a thing the learner pressed: *I already know this* and *Mark done* write `PlanRow.rungWords` (`recordRungWord`, `LessonScreen.ts:896`, `:931`), *Know it* on an item writes that item's self-pass (`selfPass`, `:326`), *Start here* on rung 0.4 writes the placement (`recordPlacement`, `:950`), adding from paper creates the shelf's default book when there is none (`addBook`, `:521`), and a duet button sets the playback hands (`updateSettings`, `:615`) [O]. None of these is a run, and the learner's word meets no requirement (spec `04`, "The learner's word"). The page itself records nothing about what the learner understood.
- **Measures.** Nothing.
- **Cannot establish.** That the learner read, understood or can do what the page says. A step whose tool is `lesson` states a definition or a count to the learner and establishes nothing about them; whatever the learner can then do is shown only by the tool the next step names. The line *What the app counts* shows what other runs have counted for the rung and is not a measurement made on this page.

---

## 32. The seven claims

1. **Wait and Keep tempo give different evidence; Wait does not establish tempo control. CONFIRMED.** Wait stores `tempoMeasured: false` and `timing: not measured` (`Scoring.ts:209,464-466`, `ScoreScreen.ts:4157`), accuracy by steps not notes (`Scoring.ts:234-236`), cannot master (`Scoring.ts:515-518`), and `meetsStandard` passes a Wait row only if `passTempoPct <= 0` (`rungState.ts:238`); `masteryCriteriaFor` replaces a zero with the Settings pair (`selectors.ts:93-97`) which is clamped to 30-130 (`settingsStore.ts:231`), so no rung is ever met by Wait. Evidence differs too: the timing channel is refused with reason `wait` (`measurement.ts:204`) and `keep-tempo` support is unmet (`evidence.ts:296`). One qualification: a Wait run on a sight-reading row can still support a pitch-only skill (R6).
2. **Simon's chain score establishes exact pitch-chain playback and short-term retrieval only. CONFIRMED, with two corrections.** Ordered, octave-exact (`simon.ts:561-573`), score is the longest chain (`:605-626`). Corrections: (a) on "Keys shown" the chain is lit and named as it plays (`:151-166`), so the same score can come from copying lights, and the row stores no help level (`:624`); (b) on "After a miss" the count is right answers across re-asks (`:586-607`), so it is depth reached over attempts, and replay of the chain is unlimited on every rung (`DrillScreen.ts:2770`).
3. **Read it versus Jam it are written-accompaniment practice versus playing against a running harmonic and time framework. CONFIRMED.** Read it makes a Score-screen import (`LabScreen.ts:296-326`); Jam it runs a metronome-clocked bed with the bar's chord on the chart (`:489-496`). Qualification: Read it's run is judged like any score but belongs to no rung (R1, 7a); Jam it's framework includes lit chord tones, so it does not test choice (`:489`), and nothing in it is stored.
4. **Trading fours gives entry and scale-membership feedback and does not judge the answer against the call. CONFIRMED.** `judgeTrade` has no call parameter (`tradingFours.ts:177-207`); module note `:20-25`; verdict text `LabScreen.ts:639-662`. Qualification: `cameIn` reads the first note since the call began, so early playing over the call is read as not coming in (`LabScreen.ts:603-605`).
5. **Standalone Free play records and judges nothing. CONFIRMED.** `FreePlayScreen.ts:22-34,93-220`: no store import, no row, no verdict; it names the held chord (a readout). The Score screen's own Free mode also writes no row (`ScoreScreen.ts:4124-4125`).
6. **Perform and Blind are one-pass performance versus hidden notation and establish neither landmark choice nor recovery. CONFIRMED.** Perform = one pass, flagged row (`ScoreScreen.ts:2191,2608,4161`); Blind = stage hidden, row indistinguishable from a sighted one (`:839-846`; no `blind` in `RunHeader`; 4.7's own `why`, `stage-4.json:591`). No code computes landmark choice or recovery (grep of `app/src` for those words finds none in that sense). Addition: Blind does not hide the key guide unless the keys setting is changed.
7. **`rungState.ts:341` filters `unjudged` readings out before "met" is computed, so an `unjudged` requirement cannot gate completion. CONFIRMED.** Line 341 is `readings.filter((reading) => reading.holds !== 'unjudged')`; line 342 is `met = judgeable.length > 0 && judgeable.every(...)`. Consequences [O, from those lines]: a rung with `runs` plus `unjudged` (4.7, 2.4, 3.5, 4.6 and others, R7) is met by the `runs` alone, and the unjudged clause is shown, never counted; a rung whose every requirement is `unjudged` can never be met (`judged: false`) and moves on only by the learner's word (`rungState.ts:345-350`, spec 3f).

---

## 33. Summary table

| Mode | Honest teaching job | What it measures | What it cannot establish |
|---|---|---|---|
| Wait for me | First meeting with the notes of a piece | Right pitches in order, steps clean, no time pressure | Tempo, pulse, fluency; meets no rung standard |
| Keep tempo | Playing the notes against a supplied clock | Right pitch within ±150 ms at a chosen % of tempo; timing spread | Unaided steady pulse; fine rhythm; reading ahead |
| Play it to me / Hear it | Hearing the target | Nothing | Anything about the learner; spoils first-reading status |
| Score Free play | Playing a piece with the page following | Nothing | Anything |
| Free play (standalone) | Seeing what you are holding named | Nothing (readout of held chord) | Anything |
| Simon | Holding and reproducing a heard pitch chain | Longest exact ordered octave-exact chain | Ear versus eyes on "Keys shown"; naming; retention |
| Lab: Read it | Reading and playing a chosen accompaniment pattern | Score-screen accuracy (no rung) | Choosing voicings; playing without the page |
| Lab: Jam it (Bed only) | Playing over a running time and harmony frame | Nothing | Everything; free play over a bed |
| Lab: Hold the chords | Playing a line over the app's chords | Notes in the scale, per time round (not stored) | Rhythm, choice, form; chord tones are lit |
| Lab: Play the tune | Comping under the app's right hand | Notes that are chord tones of the bar (not stored) | Rhythm, voicing; chord tones are lit |
| Trading fours | Answering a phrase in your own bars | Whether the first note came in the window; notes in scale | Relation of answer to call; rhythm; stored history |
| Perform | One uninterrupted pass | A take's accuracy and timing, flagged and listed separately | Recovery, landmark choice, memory, audience |
| Blind | Playing without the page | Same as the sighted run in the same mode | That it was blind (not recorded); that keys were not followed |
| Loop | Repeating a passage | Accuracy and timing over the chosen bars, per lap | Whole-piece playing; carry-over |
| Ladder | Raising tempo by clean passes | Tempo reached within a sitting | Retention on another day; the climb is not stored |
| Duet | Playing one hand with the app's other | Chosen hand's accuracy and timing | Hands-together or independence |
| Rhythm only | Tapping the written rhythm | Onset timing, any key | Pitch; playing the piece |
| Chord chart | Playing from chord symbols | Held notes contain at least 60 % of the bar's chord (live, unstored) | Voicing, time-keeping, form; no transpose |
| Daily sight-read | One unseen phrase a day, adaptive | Right pitch and time on first sight, per demand | Which demand failed; reading ahead; fluency beyond the recipe |
| Note flash | Staff to key | Pitch class from a staff position | Octave, speed, context |
| Find the key | Name to key | Pitch class from a name | Landmark use, speed |
| Ear: interval / chord | Echoing a heard pitch set | Pitch-class set match | Naming; quality or interval identification |
| Ear: cadence / progression | Echoing a heard chord sequence | Ordered note-by-note match | Cadence recognition; function |
| Melodic dictation / "Answer the phrase" | Echoing a quarter-note pitch line | Ordered pitch-class match | Rhythm; improvised answering |
| Harmonic dictation | Echoing a progression as chords | Each chord's set, in order | Numeral naming; rhythm |
| Rhythm drill / "Rhythm dictation" | Tapping a written rhythm | Onsets within 150 ms; extra taps | Pitch; hearing a rhythm (item is not an ear drill) |
| Tune playback | Rebuilding a heard four-bar tune by phrase | Ordered pitch-class match per phrase | Real melody, rhythm, harmony |
| Chord / inversion / extended / roman / chord-scale / modes / transposition | Producing a named structure | Right set or sequence, any octave | Recognition in music; use in context |
| Pedal / dynamics | The two gestures | Lift timing; loud/soft velocity ratio | Musical pedalling or dynamics; rungs 2.4 and 3.5 do not gate on them |
| Backing track | Playing over a loop | `notesHeard` | Anything; not judged |
| Paper (book) | Practising from a printed book | Time, notes heard, onset spread; learner's verdict | Whether notes were right |
| Checklist / tour / placement | Orientation | Completion | Any playing |
| Metronome / PDF viewer | A click; a readable page | Nothing recorded | Anything |
| Lesson page (`lesson`) | Explaining, naming and showing notation before practice | Nothing | That the learner understood or can do it |

Mode count: 31 numbered blocks (the lesson page, block 31, is a presentation surface that measures nothing), with 9 sub-modes inside blocks 7 and 25 (Read it, Bed only, Hold the chords, Play the tune, and the seven drills of block 25).

---

## 34. What I could not establish

- **[U]** Whether any other gate stops a partial-range looped run counting as a run of the whole item; I read only `rungState.ts`, which has none.
- **[U]** Whether the metronome and PDF screens record anything; I did not open `MetronomeScreen.ts` or `PdfScreen.ts`.
- **[U]** Whether a block chord struck together always lands in the note-on order the ordered `ear-progression` judge needs.
- **[U]** What the stored row of a Ladder run holds beyond its last run; I did not trace `startRun({fresh:false})` into the recorded score.
- **[U]** Whether a rhythm-only sight-reading row feeds a timing-only skill (`subdivision` and others); `measurement.ts` does not refuse it, I did not trace evidence construction.
- **[U]** Which of the 78 static catalog items are drills versus the generated ones the app builds at runtime; `catalog.static.json` has 78 rows, the count by kind in §20-§27 is from it, and the generated families are not in it.
- "Free play inside the Lab" is not a named mode in the code; I took it as Bed only (`bed === 'off'`).
- The spec names ear drills for "cadence", "melodic dictation" and "rhythm dictation" as separate kinds; in code they are items on `ear-progression`, `call-response` and `rhythm` (§20, §21, §23).
