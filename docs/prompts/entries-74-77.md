# Entries 74–78 of `docs/pending-review.md` (a copy for the C4.5 review packet)

`docs/pending-review.md` is the full running record and is larger than some repository
tools will fetch (about 1.4 MB). This file is a verbatim copy of the four entries the C4.5
checkpoint names, and of C4d's (Entry 78); the record itself is unchanged and remains the source.

### Entry 74 — T42: the tempo ladder holds on a pass nothing judged and says so, and the test that relied on the old fault misses under a judging input (2026-09-26)

**Judgement.** Yes for the three decided items. **On the glass** (the build with the change, desktop Chromium, light, Hot Cross Buns, bar 1 looped, the ladder on at 40 %, input *None*, two pass boundaries): the status line reads *Nothing listening — staying at 40 %*, the slider stays at 40 and the notes stay black. At 1180 × 920 it sits in the header beside *bar 1 / 4* while the loop runs. At 390 × 844 the header is folded away while the run goes (pre-existing, every ladder line alike — Follow-ups), so the learner meets the line after a tap brings the chrome back: *Hot Cross B… Nothing listening — staying at 40 %* at the top right. At 342 × 740 after a tap it is shown whole (its box is as wide as its text; the title gives way to *Hot …*). **Mechanism, traced on the committed build** (not only inferred from the slider): the hold case's recorder, installed before ▶, caught the committed screen writing *Clean — up to 50 %* and *Clean — up to 60 %* at the first two pass boundaries. `climbLadder` judges a pass clean when the engine's miss, wrong and early totals have not moved since the last lap; since C3 a run with no input counts no miss (`judging: false`), so every lap read as clean and the ladder climbed notch by notch to `LADDER_CEILING_PCT`. The CI failure reproduces locally on the same build with the old test: `Expected: "30"`, `Received: "100"`. So the mechanism is the one the brief inferred. Before C3 the same comparison walked down on misses nobody made (L44).

Not heard; nothing here is about sound. A teacher's read: if the app cannot hear you it should not tell you to go faster or slower, and now it does neither and says why in six words. The line does not say how to be heard; the sheet at the end does (*connect a piano or choose Screen keys in ⋯*).

**Deviations, each with its reason.**
1. **The misses case plays one note.** The brief suggested the screen keys with no key pressed, or the MIDI mock silent. Either one holds the run for ever: a Keep tempo run with an input holds at the start for the learner's first note (`05` §3b), so no pass would ever end. The revised case presses the note the run is holding for (read from `scoreRun().expected`, not written into the test) and then nothing, so pass 1 has two misses and every later pass has three. That is what a learner who starts and then keeps missing gets.
2. **`LADDER_TEXT` holds the whole ladder line, not only the new sentence.** One line with three verdicts is one set of words in `help.ts`. The *Clean* and *A mistake* strings moved out of `ScoreScreen.ts` unchanged, and the existing floor and ceiling cases hold them.
3. **`listening()` replaces `input !== 'none'` on C3's `judging:` line.** The hold and the run's `judging` read one fact, so they cannot come apart. An input change restarts the run, so at a lap it is still the input the lap was judged by. Nothing in `ScoreSession.ts` changed: the screen owns the input, as Entry 72's deviation 1 argued, and the session reading its options back would restate the engine's rule a second time.

## Done — per item: mechanism, the red line, before → after

**1. The ladder holds on an unjudged pass (Q33, P1).** *Change:* in `climbLadder`, after the pass base is updated, `if (!listening())` writes `LADDER_TEXT.line(LADDER_TEXT.nothingListening, tempoPct, tempoPct)`, renders and returns: no tempo change up or down, no restart, the lap the engine has begun runs on. `Hear it` keeps its own earlier guard. The record path is untouched. A loop run is still recorded at its summary, and with nothing heard that summary is T40's *Not measured* sheet, recorded with the learner's answer (read from the code, not driven here). *Red:* `the ladder moved the tempo on a pass nothing judged … + "Clean — up to 50 %", + "Clean — up to 60 %"`. *After:* no line moved the tempo, the slider reads 40 after two passes, and the status line reads *Nothing listening — staying at 40 %*.

**2. The misses case revised (class: revise; old assumption: no input means every note is missed).** Screen keys, the first note played to start the clock, nothing after it. It now asserts *A mistake — staying at 30 %*, so a hold at the floor cannot pass for a walk down. *Red:* it passes on the committed build, because the screen keys judge there as well. Reverting the engine's `judging` guard cannot make it red either: with a judging input that guard never acts. It was seen red on a copy of the committed build with `judging` forced off for every input, spliced into the built bundle so the shared tree was not built: `Expected: "30"`, `Received: "40"`. With judging off the engine's `feed` returns before the latch, so the run holds for its first note for ever. That is the revised test failing because its input is not judging, the failure CI met in the old form (`Expected: "30"`, `Received: "100"`, reproduced locally on the committed build). *After:* green.

**3. The clean-pass case** already taps every step under the screen keys (a judging input, Rhythm only), so it did not rely on nothing being judged. Preserved, green.

## Pedagogical verdict (from the code and the pictures; nothing heard)

A hold is what a teacher would do. They would add that a ladder switched on with nothing listening is a control that can never act: the row could say so on its label, as the metronome row does in Free play (Follow-ups). The standing line under the header, *The count-in clicks, then play along.*, is the mode's default, and a no-input loop leaves it as it was.

## Tests

| test | class | the assumption the old assertion encoded | why the new one reads the learner-facing outcome |
|---|---|---|---|
| `score.rhythm-ladder` "a pass with misses in it slows down, and stops at the floor" | revise | no input means every note is missed (L42, fixed by C3) | misses made under the screen keys; the floor and the *A mistake* verdict on the status line |
| `score.rhythm-ladder` "a pass nothing listened to holds the tempo, and says why" | add | — | the slider after two passes, every status line of the run (none moved the tempo), the reason line |
| `score.rhythm-ladder` "a clean pass speeds up, and stops at the written tempo" | preserve | — (taps under a judging input) | green |
| `score.rhythm-ladder` "the Ladder row is not offered without a loop to climb" | preserve | — (no input, asserts only the row) | green |
| `score.rhythm-ladder` rhythm first ×3, duet ×2 | preserve | — | green |
| `score.rhythm-ladder` helpers: `ScoreRun` gains `armed` and `expected`; `waitForHold`, `recordStatusLines`, `statusLines`, `waitForPassBoundaries` added; the header's third habit reworded | add / revise | the header said both ladder cases end at the floor or the ceiling | a hold is a third place the tempo stops moving |
| `tempoLadder.test.ts`, `help.test.ts` | preserve | — | green in the Vitest run (`LADDER_TEXT` is printed in `04` §5, not §5f) |

## Runs (unpiped; exit codes read)

- Red, on a `build:app` of the clean committed tree (dc7d0c1, exit 0), copied aside and served from the copy: the ladder block, 1 failed (the hold) and 3 passed; the old spec's misses case, 1 failed (`Received: "100"`). The mutation copy: 1 failed (`Received: "40"`).
- Green, first on a `vite build` of the change (`build:app` was then refused by another builder's red-first unit test in `tsc -b`): `score.rhythm-ladder` 0 (9 passed), `score.states` 0 (19 passed).
- Final, on the tree as it stood at 01:19 with the other builders' uncommitted work in it: `npm run build:app` 0; `npx tsc -b` 0; `npm run lint` 1, with every error in other builders' in-progress unit files (`evidenceVersion.test.ts`, `zz_c4a_probe.test.ts`; on a rerun `generatorContract.test.ts`), and `eslint` on the three T42 code files 0; `npx vitest run` 1, 5,768 passed, 6 skipped and 1 failed in `evidenceByDemand.test.ts` (C4a's), and `help`, `tempoLadder`, `scoreSheetRows`, `scoreSummaryTruth` 0 (52 passed). Playwright on that build (`vite preview` on 4173, two workers, one config, nothing built during a run): `score.rhythm-ladder` 0 (9 passed); `score.states` 0 (19 passed); `score.screen`, `modes-ladder`, `score.ladder-route` 0 (49 passed; `score.screen` holds C3's two no-input cases, and C3's `judging` line now reads `listening()`).
- Three temporary picture specs were run and deleted.

## Not done

- Nothing from the brief.

## Follow-ups

- **P2 (pre-existing, every ladder line):** on an upright phone the header, and the status line in it, is `display: none` while the chrome is folded during a run. So *Clean — up to 70 %*, *A mistake — down to 50 %* and now *Nothing listening — staying at 40 %* are unseen until a tap, and the tempo label that `04` §5 marks as moving by itself is folded too. The corner chip shows only *bar n / m*. The learner hears the loop get faster with nothing on the glass saying why.
- **P3:** the Ladder row could say *nothing is listening* on its label when the input is *None*, as the metronome row refuses Free play. Offered, it is a control that can only hold.
- **P3 (engine):** `PracticeEngine` with `judging: false` and `latchStart: true` holds for ever, because `feed` returns before the latch. The screen cannot reach it (both are set from the input), but the engine does not refuse the pair.

## Questions

None.

## Unverified

- Nothing heard. Pictures at 390 × 844 (folded, and after a tap), 342 × 740 (folded, and after a tap) and 1180 × 920, light, desktop Chromium. Not seen sideways, in dark, at 115 % text or on the owner's phone.
- The hold with a microphone or a MIDI piano that is attached and silent: those are judging inputs, so their passes are judged and walk down, which the revised case shows for the screen keys only.
- *Counts as practice*: the record path is unchanged and was read from the code; no loop run was stopped and recorded here.

## Files

`app/src/ui/screens/ScoreScreen.ts` (`listening()`, the hold in `climbLadder`, the line from `LADDER_TEXT`), `app/src/ui/help.ts` (`LADDER_TEXT`), `app/tests/e2e/score.rhythm-ladder.spec.ts`, `docs/05-score-follow-engine.md` (§6, one paragraph), `docs/04-ui-spec.md` (§5, the Ladder paragraph), `docs/08-test-map.md` (the tempo ladder row).

### Entry 75 — C4a: evidence per demand with the overlap between demands kept, three readings that name a demand only where the reads single it out, and the evidence's own version (2026-09-26)

**Judgement.** Yes for the brief's items 1–6, with the shape changed in one place (the overlap is derived rather than stored beside every entry, deviation 3, because the size hypothesis failed) and one finding about the tree that the orchestrator has to act on first: **the T42 commit (30c63e4) carries C4a's two Score screen lines** (the `stampedEvidence` import and the save line) **and C4a's §9b text, but not `app/src/evidence/`**, so HEAD on its own imports a `stampedEvidence` that HEAD's evidence module does not export. The working tree is whole (`tsc -b` 0); HEAD is whole again once C4a's files are committed.

**The skip learner, five first readings of 2.2's row** (`sight-reading-2-right`, generated, played through the real engine at 70 % with a reader's small unevenness, every skip read as the step below, evidenced as the Score screen does and stored with the stamp; `demandReadings.test.ts`). What C4 stored on day 4 was *sight-reading 14 of 21* and *reading by interval 10 of 17*. What the row stores now, for the same run: sight-reading's skips **0 of 7**, steps **10 of 10**, eighths 7 of 12, "shorter than a quarter" 7 of 12, beyond the five-finger position 2 of 2 — and, derived from where each demand is, that every wrong eighth was also a skip. What `demandReadings` reads over the five: misread on all five days, skips 0 of 26, below the support share in five phrases, and **`pattern`** under sight-reading and under reading by interval — where no eighth was, the skips went 0 of 9; where the skip was not beyond the position, 0 of 23; and every other demand held where no skip was (steps 52 of 52, eighths 31 of 31, beyond the position 7 of 7). Steps: 52 of 52, not named. The eighths: 31 of 48, below in five phrases, **not** named — where no skip was they went 31 of 31, and the skips went wrong without them. Three good days then two misread: after the first bad day nothing is named (skips below in one phrase, their wrong steps mostly shared with eighths); **after the second, skips are a `pattern`** (13 of 26; 5 of 9 where no eighth was) and nothing else is. That answers C4c's inherited question: the pattern is there by the second bad day.

**One wrong note with four properties** (the left hand's F♯3 in G major: a skip, an eighth, the bass staff, the key signature, under the right hand's held note): sight-reading keeps that step as wrong under every demand on it ("shorter than a quarter" too) and every demand's reading is **`ambiguous`**, on one day and on two — the skip was never read without the eighth (0 of 0), so repetition cannot separate them.

**The mixed-demand ambiguity adversary**, both profiles (the coordinator's addition; the brief carried one half). Two phrases whose wrong notes are all skips and eighths at once: skips 0 of 16, eighths 0 of 16, the same sixteen steps; both **`ambiguous`**, and so is reading by interval's skip. Then (a) skips in quarters read right and steps in eighths read wrong: the eighths become a **`pattern`** (2 of 24; 2 of 8 where no skip was, 2 of 18 where no step was; skips 4 of 4 and steps 15 of 15 where no eighth was) and the skips do not (4 of 20, but 4 of 4 where no eighth was). (b) skips in quarters right and eighths in steps right: **both stay `ambiguous`** (eighths 8 of 8 where no skip was, skips 4 of 4 where no eighth was): the failures were at the combination, and nothing is named, isolated or patterned anywhere.

**What a teacher can now see that Entry 73's `n, right` hid**: which notes went wrong (the skips, every one), which held (every step), that the wrong eighths were the skips and not the rhythm, and whether the reads have separated the two yet. The evidence still says only "right and in time under these conditions" at each demand's notes; nothing on it names a cause. Not heard; no screen changed (the sheet and Today read what they read before); not looked at on the glass (no browser, as briefed). Whether the phrases are music is unchanged from Entry 73 and unverified as music.

**Deviations, each with its reason.**
1. **A skill read over every step counts every demand its steps contain.** The brief says "each demand in the skill's opportunity list"; sight-reading's list is *every step*. Without this the reader's own skill (C4c acts on sight-reading) would have no per-demand evidence, and the ambiguity adversary could not exist: under reading by interval a wrong pitch is a skip failure and under subdivision it is no timing at all, so only a skill that judges pitch and timing as one outcome sees the eighth and the skip fall together.
2. **The overlap names every vocabulary demand on the steps, in the hands played**, not only the declared skills'. Hiding a co-located demand because no declared skill names it would make a mixed failure look isolated — the false specificity the reviewer warned of.
3. **The overlap is derived, not stored per entry** (`overlapOf(evidence, demand, vocabulary)`; per result `otherDemands` for the demands a skill with a list does not count). Stored beside every entry, the evidence of a sight-read was about three times its bare observation for a four-bar one-hand phrase and five for an eight-bar two-hand one, and compaction keeps it. Each (demand, step) is now stored once (a test holds it): about twice the bare observation for both.
4. **Each entry also keeps `wrong` and, where needed, `unattributed`.** The readings need which steps went wrong; a demand on some notes of a chord partly wrong cannot be told (C1 keeps the code, not which pitch was missed, L56), so the step is out of that demand's `n` and said — the brief's "n over what can be told". `StepMeasure.uniform` (in `measurement.ts`) marks the verdicts that hold for every pitch (`h`, `m`), so a demand on one note of a chord all missed is still told.
5. **`demandReadings` in its own file** (`evidence/demandReadings.ts`), as the brief allowed; it reads `storedEvidence`.
6. **The stamp is a row field** (`SessionRow.evidenceDefinitions`, the brief's db.ts ownership), put on by one function (`stampedEvidence`) that the Score screen, `recomputeEvidence` and the test helper all use. The Score screen change is the save line and its import.
7. **`recomputeEvidence(row, played, vocabulary, targetSkills?)`**: the skills default to those the row's stored results name, since a pure function cannot look up the item; a caller whose item's declaration has changed passes them.
8. **Test helpers revised**: `helpers/observed.ts` gains `wrongKey` (a misread the engine cannot hold as an early strike of the next note) and `wrongPitch` (one hand of a chord); `helpers/reader.ts` stamps as the record call does, without which every C4 test built on it would have read nothing.
9. **§9b's first paragraph** said "Nothing selects by it yet (C4)", false since C4; corrected in the same targeted replacement.
10. **The poor-left-hand case has a two-read variant**: over two reads the bass staff is a `pattern` and playing together is not (the right hand held over the left, 4 of 4) — the fact C4c's "the left hand only when hands-together itself patterns" rule needs.

## Done — per item: mechanism, the red line, before → after

**1–2. Per-demand counts and the overlap (L64, P1).** *Mechanism, confirmed in the code:* C3's `opportunitySteps` put every demand's steps into one set per skill and `evidenceFrom` counted the set; a skill read over every step never located a demand at all; so the stored evidence was `skill, n, right` and the reader could only back out its last move (Part 8's central finding). *The brief's first inherited hypothesis*: the per-demand steps were available only as that union; splitting needed every vocabulary demand's locations, not a second pass over the run. *Change:* one pass over the detectors per run (`locateDemands`, shared by the opportunity, the precision rule and the counts, where C3 ran them per skill), and `evidenceFrom` splits the same counted steps by demand (`byDemand: {demand, n, right, steps, wrong, unattributed?}`), with `otherDemands` and `overlapOf` for where the other demands are. The skill's `n` and `right`, the decision order, every refusal and its `cites`, and the self-assessed class are untouched; the ladder reads only `n` and `right`. *Red:* `TypeError: Cannot read properties of undefined (reading 'find')` (five cases), `(reading 'map')` (three), `TypeError: result.byDemand is not iterable`; the first build's per-entry overlap: `AssertionError: sight-reading: interval.step@2 is stored twice: expected true to be false`. *After:* the numbers above; the cost of the call is about the same as C3's on a four-bar one-hand phrase and under one and a half times on an eight-bar two-hand one, either a small fraction of building the phrase's model (jsdom, this machine, medians).

**3. Demand readings.** `demandReadings(rows, vocabulary, today)`: per reading-strand skill and demand, over the skill's last five reads under the current stamp — `n`, `right`, phrases, phrases below, `below`, one of `pattern` / `isolated` / `ambiguous`, and `basis` (the arithmetic). The rules and the four constants (`DEMAND_WINDOW_READS` 5, `PATTERN_MIN_PHRASES` 2, `MIN_CONTRAST` 2, `MIN_ALONE_WRONG` 2) are printed in `05` §9b and marked hypotheses; "below" and "held" are relative to the ladder's support share. A *rival* is another skill's demand on a wrong step; demands one skill copes with (step, skip, leap; the eighth and "shorter than a quarter") are siblings, never rivals — "shorter than a quarter" is every eighth again — but are held to the selectivity rule. *Red:* `Error: Failed to resolve import "../../src/evidence/demandReadings" from "tests/unit/demandReadings.test.ts". Does the file exist?` *After:* the three worked examples above; two had to be looked at before they came out right: rivals are taken from every demand on the wrong steps, not only the skill's own (reading by interval's skip came out `pattern` in the adversary until then: `interval-reading interval.skip was named where the observations do not separate it: expected 'pattern' to be 'ambiguous'`), and "every other demand held where this one was absent" needs at least one such comparison, or a rhythm skill that sees only its own eighths would name them.

**4. The evidence's own version (L66).** `EVIDENCE_DEFINITIONS = 2` (1 is C3's per-skill evidence as C4 stored it under the observation's stamp); the record call stamps `evidenceDefinitions`; `storedEvidence` takes only the current stamp and ignores `definitions`; `recomputeEvidence` equals what the record call stores (asserted through the real Score screen and store). The trigger is not built. *Red:* `AssertionError: the evidence module names no version of its own: expected undefined to be type of 'number'`, `TypeError: recomputeEvidence is not a function`, `AssertionError: evidence of another shape was read as current: expected [ { kind: 'measured', …(7) }, …(3) ] to deeply equal []`, and for the observation's stamp `AssertionError: expected [] to deeply equal [ { kind: 'measured', …(7) }, …(3) ]`; `readingState`: `expected 'proficient' to be 'not introduced'` and `expected 'not introduced' to be 'proficient'`. **Consequence for a learner:** every row stored since C4 now contributes nothing to the reading state until something recomputes it, so a learner with C4 reads gets the rung's own row again (C4's day-one behaviour) until new reads accumulate.

**4b. Keyed by demand, never by a control.** The evidence and the readings name vocabulary demand ids only; a test reads `app/src/evidence/*.ts` and finds no import of the generator, its controls or the reader, and no word for the reader's dimensions.

**6. The adversarial cases** (`evidenceAdversarial.test.ts`, evidence and readings): accurate steps, inaccurate skips — the skips `isolated` in one read (4 of 4 wrong steps carry nothing else; steps 4 of 4); accurate pitch, poor rhythm — pitch demands all right, eighths 0 of 2 timed, every sight-reading demand 0, nothing named (the rhythm skill sees only its own eighths, nothing to compare them with); accurate right hand, poor left — hands-together 2 of 4, the right hand's steps 4 of 4 with the two part-right steps unattributed, the bass staff 0 of 4, nothing named in one read, and over two the bass staff a `pattern` and hands-together not; a difficult passage read right — nothing below, nothing named; an easy one read badly — nothing named, twice over (the steps fell where no skip was, 0 of 8); eighths at the phrase's full tempo — absent from sight-reading's counts, subdivision refused `precision` as today; the left hand in the notation and the right hand played — absent, bass clef refused as today; heard, demonstrated, re-read — sight-reading refused `condition:unseen`, no reading; no input — nothing. (An easy phrase with *every* note wrong timed nothing, so sight-reading is refused *timing not measured* — C3's rule; the case keeps the first note right.) *Red:* `Error: Cannot find module '../../src/evidence/demandReadings'`.

## Pedagogical verdict (from the code and the constructed reads; nothing heard)

The three facts read as a teacher would put them: "it's the skips — they go wrong in quarters too, and your steps are fine"; "one note went wrong; I can't tell you why from one note"; "those were all fast skips; I can't tell yet whether it's the skips or the speed" — and, after the contrasting reads, "it's the speed" or, in the reviewer's profile, "only when they come together". Two places a teacher would put it differently. "Shorter than a quarter" is named alongside the eighths whenever the eighths are (the same notes); a teacher says "the eighths" (C4c maps both to one control). And `ambiguous` covers both "held" and "fell together with something" — a demand going fine and a demand in a mixed failure get the same word, told apart by `below`; C4c must read both. Whether the thresholds are a teacher's is unverified: they are hypotheses tested on constructed learners who misread every skip, never on real playing.

## Tests

| test | class | the assumption the old assertion encoded | why the new one reads the learner-facing outcome |
|---|---|---|---|
| `evidenceByDemand` ×14 | add | — | what the evidence keeps per demand for a misread skip and a misread left-hand note under four demands; nothing names a cause |
| `demandReadings` ×8 | add | — | the skip learner, one wrong note with four properties, the adversary in both profiles, with the arithmetic |
| `evidenceVersion` ×6 | add | — | the real record call's stamp; recompute equals it; old rows read as nothing |
| `evidenceAdversarial` ×17 | add | — | the eight learners' evidence and readings |
| `evidenceProperty` case 3 ×20, cases 1/1b/2 | revise | evidence is per skill only | each demand the fixture contains counted at its detector's steps; no refusal carries counts |
| `readingState` "a row stamped with other definitions contributes nothing" | revise (replaced by two) | the observation's stamp is the evidence's | the evidence's stamp decides; the observation's does not |
| `helpers/observed.ts` | revise (helper) | a misread is the white key below, and a whole step | `wrongKey`, `wrongPitch` |
| `helpers/reader.ts` | revise (helper) | a stored row's evidence is stamped by `definitions` | stamped as the record call stamps it |
| `evidenceOnlyMeasured` ×14, `demandIsNotAbility` ×5, `evidenceTouchesNamedSkills` ×2, `tripletPrecision` ×5, `masteryLadder` ×13, `feedbackFromMeasurements` ×10, `sightReadingFromReadingState` ×24, `firstThirtyDays` ×5, `recommendRespondsToEvidence` ×4, `sightReadingSlot` ×7 | preserve | — | green |

## Runs (unpiped; exit codes read)

- Red: every file above on the committed tree, on its line (the scratch folder keeps each output); the stored-once test on the first build.
- After: `npx tsc -b` 0; `npm run lint` 0; `npx vitest run` 0 — 235 files, 5,788 passed, 6 skipped (the working tree, with C4b's work in progress and T42's committed). No browser, no build (as briefed).
- Three temporary probes (the learners' stored evidence and readings; row sizes with `v8.serialize`; the call's cost against the committed function) were run and deleted.

## Not done

- The job that refreshes old rows (`recomputeEvidence` has no caller), as briefed.
- Folding the per-demand step lists at compaction: `compactObservation` (`progressStore.ts`, not owned) keeps the evidence whole, so a compacted sight-read keeps several times the bytes of a compacted row without evidence.

## Follow-ups

- **P2 (retention):** fold `byDemand` to `{demand, n, right}` and drop `otherDemands` in `compactObservation`, as the observation's own per-step codes are folded; `sessionRetention`'s budget row carries no evidence and should.
- **P2 (L66's other half):** `takeMeasurements` accepts any `definitions`; once a second observation version exists, the evidence function should refuse one it does not know, or recompute will read old codes by new rules.
- **P2 (C4c):** `ambiguous` covers "held" and "fell together"; read `below` with it. "Shorter than a quarter" patterns with the eighths.
- **P3:** `DemandReading.observations` repeats the window per demand.

## Questions

None open.

## Unverified

- Nothing heard; no screen looked at (none changed).
- The learners are constructed: every skip misread, small unevenness; real playing untested. The thresholds are hypotheses.
- Sizes and cost are relationships on constructed rows, on this machine.
- **Construct validity the machinery cannot establish** (Entry 72's list stands, skill by skill): *interval-reading*, *sight-reading* (right notes in time, not reading ahead), *bass-clef*, *ledger-lines*, *key-signature*, *accidentals*, *position-shift*, *hands-together*, *hand-independence*, the rhythm skills, *reading-ahead*. Added: a demand's count is right notes (and time) at that demand's notes, not that the demand was read; `pattern` is an association across phrases, never a cause; the support share is Part G's pass share, borrowed.

## Files

`app/src/evidence/evidence.ts`, `measurement.ts`, `readingState.ts`, `demandReadings.ts` (new); `app/src/data/db.ts` (`evidenceDefinitions`); `app/src/ui/screens/ScoreScreen.ts` (the save line and its import — already in HEAD via 30c63e4); tests: `evidenceByDemand`, `demandReadings`, `evidenceVersion`, `evidenceAdversarial` (new), `evidenceProperty`, `readingState`, `helpers/observed.ts`, `helpers/reader.ts`; `docs/05-score-follow-engine.md` §9b (most of it already in HEAD via 30c63e4), `docs/01-architecture.md` §4.5, `docs/08-test-map.md`.

### Entry 76 — C4b: the curriculum–generator contract — every demand a core rung has taught can be written into the reading row the reader offers there, or the reason it cannot is declared; the control map in app code, the vocabulary only gaining each demand's musical dimension (2026-09-26)

**Judgement.** Yes on the generator side, not yet for the learner. At every core rung from 1.3 to 4.7, with the row the real `readingOffer` gives a learner placed there, every demand the rung has taught is now written into every phrase when asked and kept out when asked, keeping the rung's and the row's promises, writing nothing a later rung teaches, and bringing nothing new that the control does not declare — or it is one of nine declared impossibilities (46 rung-moves), held to exactly that list by `generatorContract.test.ts`. **S25 is closed as a contract:** ties and dotted quarters are written on request from 2.4 on the right-hand row, from 3.4 on the two-hand row and on 4.5's row. **What the 2.5 learner is offered on day 14 is unchanged on this tree:** the thirty-day diary regenerated after C4b gives the same thirty Today lines and reads as the checkpoint's, day 14 still "The next step waits for a later lesson — 14 of 14 right and in time yesterday", because the reader (`session.ts`, C4c) does not read the new controls yet. What it can now ask for that morning (the day's seed, the diary's recipe — the right-hand row with both hands — plus the control): **with ties**, | C4 half, D4 half tied over the bar line | to a quarter, E4 F4 eighths, G4 quarter | A4 half, B4 G4 eighths, F4 quarter | D4 dotted half, C4 quarter |, left hand C3 held in every bar; **with dotted quarters**, | C4 dotted quarter, C4 eighth, D4 E4 D4 C4 eighths | D4 half, F4 dotted quarter, E4 eighth | D4 quarter, E4 dotted quarter, F4 eighth, G4 E4 eighths | D4 quarter, C4 dotted quarter, D4 eighth, C4 quarter |, left hand C3 F3 F3 C3. Read as a teacher reads notation, not heard: one tie from a strong beat across the first bar line is a clean first tie; the dotted phrase drills the dotted-quarter–eighth figure three times, stepwise, beside plain eighth pairs; both stay inside C4–B4; the tie version's left hand never moves. Unverified as music. **Not looked at as a learner meets it:** no browser (as briefed), nothing drawn or heard.

**The contract, rung by rung** (the reader's row there; twelve seeds a move; generator → OSMD → extractor → detectors):

| rungs (row) | in every phrase already | written when asked (on) | kept out when asked (off) | cannot, and why |
|---|---|---|---|---|
| 1.3–1.4 (`1-left`) | bass staff, step | — (nothing else taught) | bass staff (→ right hand; drops 1.3's bass-staff promise) | step off: no control |
| 1.5 (`1`) | step, skip | bass staff (the melody to the left hand) | skip (drops the row's) | leap on: 1.5's drill promises "only steps and skips"; step off |
| 2.1 (`1`) | as 1.5 | as 1.5 | as 1.5 | as 1.5; hands together on: level 1 writes one hand (2.1 teaches both) |
| 2.2–2.3 (`2-right` held in C position, S16) | step, skip, eighths, shorter-than-quarter | bass staff, hands together (each brings the other and the roots' leaps), leap | skip, eighths, shorter (drop their promises) | step off |
| 2.4 (the same) | as 2.2 | as 2.2 + **dotted quarter, ties** (a tie can bring a leap: D's tie-closing fault) | as 2.2 | step off |
| 2.5 (`2-right` as it stands) | as 2.2 | as 2.4 + beyond the position in every phrase | as 2.2 + beyond the position (drops 2.5's "a phrase beyond C position") | step off |
| 3.1–3.3 (the same) | as 2.2 | as 2.5 + key signature (a set of keys), accidental | as 2.5 | step off |
| 3.4–3.5 (`2`, both hands) | bass staff, hands together, step, eighths, shorter | **ledger line beyond middle C (S22)**, skip, leap, dotted quarter, ties, key, accidental, beyond | bass staff and hands together (drop 3.4's two-hands promise), skip, eighths, shorter, beyond | leap off: the left hand's roots move by fourths and fifths; step off |
| 3.6–4.4 (the same) | as 3.4 | as 3.4 + left-hand pattern (a broken chord, from C2: brings ledger lines) | as 3.4 | as 3.4 |
| 4.5–4.7 (`3`, 6/8 or 4/4) | bass staff, hands together, step, skip, leap, eighths, shorter; syncopation and triplets in its 4/4 phrases | ledger, dotted quarter (4/4 phrases), ties, key, accidental, beyond, left-hand pattern (Alberti, since some phrases are 6/8) | bass staff, hands together, ties, syncopation, triplets, 6/8 (drops "a phrase in 6/8"), beyond | 6/8 in every phrase (its syncopation and triplets are not asked in 6/8, T37); skip off, leap off (a tie's closing note; the roots); eighths off, shorter off (the 6/8 figures and the syncopation figure are eighths); step off |

Never written at any core rung: sixteenths (no rung teaches them), a walking bass (blues.5 is a track rung after 4.7).

**Deviations, each with its reason.**
1. **A sixth new option, `leaps`.** `interval.leap` is taught at 1.5 and had no control; the brief's principle ("new options where a taught demand has none") covers it.
2. **An "off" for every demand, and tri-state options.** The brief's map names the option that turns a demand on; C4c's brief steps down by turning a demand off ("skips off", "eighths off") and hopes to delete C4's table for this one. `true` promises, `false` keeps out, absent is the level's own; `skips`, `eighths`, `syncopation`, `triplets`, `accidentals` gained `false`; `position: false` promises a melody wider than one position. Absent, nothing changes (asserted).
3. **`mayWrite`, `brings` and `heldToRung` in `readingControls.ts`.** "Untaught demands are absent" needs to know what a recipe may contain without generating it (S16), and "holding the unrelated dimensions stable" needs what a move brings declared (as C4's `VALUE_DEMANDS` did). `mayWrite(…) === false` is held to every phrase the contract generates.
4. **`app/src/demands/vocabulary.ts`** (not named): the `Demand` type gains `dimension`.
5. **The contract covers every core rung from 1.3 to 4.7, not only the eight that list a row**: the reader serves 2.4 and 3.1–3.3 from earlier rungs' rows, and the diary's plateaus sit there.
6. **The dotted-quarter promise keeps a pair of plain eighths** where the level writes eighths (as `skips` asks for a step beside the third). The contract found dotted quarters on 2.2's row at 2.4 leaving some phrase with no beamed pair, which 2.2's "eighths beamed in their beats" check reads as a broken promise; the check is kept, the phrase now keeps what it checks.
7. **S16 is fixed where the rung is known, not in the row.** Setting the row's own recipe in C position would make 2.5's lesson sentence ("its phrases already reach up to the C above middle C") false on this tree, since the committed reader cannot move range up from a row whose params hold it. The generator side is proven; the app asks for the held shape once `readingOptions` calls `heldToRung` (C4c).
8. **A ledger line for a left hand read alone at level 1 is declared, not built**: the walk from C3 cannot reach a ledger line and come back in four bars of level-1 rhythms. My first unit test assumed it could (0 of 12); revised to the declaration before green.
9. **The promises test reads the authored rows' params and concepts**, as it already read `targetSkills`: the content build ran once, early, as briefed, so the built catalog carries row 7's recipe at the next build.

## Done — per item: mechanism, the red line, before → after

**1. The dimension, and a control for every demand, in app code.** `demands.json` gains `dimension` (spliced as text; the multi-line entries keep one field a line) from the schema's closed list `clef, interval, rhythm, metre, key, accidental, range, texture` — the id's family, except a ledger line is range and a note outside the key an accidental; `hands` is a control, not a dimension. `readingControls.ts`: `READING_CONTROLS` (option, `on`, `off`, `mayWrite`, `brings`), `withDemand`, `withoutDemand`, `heldToRung`, `UNREALISABLE_AT`. *Red:* `AssertionError: 'dimension' not found in ['id', 'display', 'detector', 'copedWithBy', 'taughtAt']`; `AssertionError: False is not true : []` (a demand without a dimension accepted); with no map, as on the committed tree, `AssertionError: expected [] to deeply equal [ 'clef.bass', 'interval.leap', …(17) ]`.

**2. The new options, and `unrealisable(options)`.** `ties` (only from a note on the beat), `dottedQuarters`, `ledger`, `leaps`, `sixteenths`, `leftHand` (an override with the range of the level that first writes the pattern; absent, the level's own). Every branch is guarded by its option being given. `unrealisable` is pure and says, in words printed in `05` §8, what a phrase of these options will not be. *Red:* `ties on at level 2: ties in 0 of 12 phrases: expected +0 to be 12`; `dotted quarters on at level 2: dottedQuarters in 0 of 12 phrases`; `ledger on at level 2: ledgerLines in 0 of 12 phrases`; `a left-hand pattern at level 2: leftHandPattern in 0 of 12 phrases`; `sixteenths off at level 7: sixteenths still in 12 of 12 phrases`; `TypeError: unrealisable is not a function`. *After:* each on in every phrase, each off in none. *The hypothesis, checked by generating:* level 2's grid holds a dotted quarter (on a beat, its eighth after) and a tie without changing the bar count or the range; the tie as the generator closes it brings a leap in some phrases (declared, D's), and a tie drawn from any note is syncopation — level 3's own ties make syncopation in 18 of 40 seeds (right hand, eight bars), the on-beat rule in none.

**3. The contract test.** *Red, on the committed generator* (its phrases, run through a scratch config aliasing `sightReading` to the committed file beside C4b's pure helpers): `AssertionError: 2.4 rhythm.ties: expected 'fails' to be 'ok'`; the report: `2.5 … rhythm.ties … fails (PROBLEMS: rhythm.ties in 0 of 12 phrases)`, `3.4 … pitch.ledger … fails (PROBLEMS: pitch.ledger in 0 of 12 phrases)`. *Found and settled on the way:* a tie brings a leap, the left hand added brings its staff and roots, a moving pattern brings ledger lines (declared); a broken left hand in 6/8 was read as a walking bass (untaught at 4.5): the control asks the Alberti where a phrase may be in 6/8, and a broken or walking left hand in compound time is declared unrealisable; the dotted-quarter pair (deviation 6).

**4. The four rows.** **S25**: ties and dotted quarters realisable from 2.4 (above). **S22**: 3.4's row writes a ledger line beyond middle C when asked (`ledger`), asserted by name; its own recipe unchanged (`position` and `ledger` together are unrealisable, and the committed reader's range step down is `position`). **S16**: `heldToRung(row, taught at 2.2)` is `position: true`; the contract asserts no phrase beyond C position there and some at 2.5 on the row as it stands; the app side is C4c's. **S23**: row 7 asks `sixteenths: false` and drops the `sixteenths` concept (text splice, two lines). No rung teaches reading sixteenths: the core never does, and the rungs that touch them (ragtime.5's short–long–short, technique.6's page of sixteenths) are on tracks a jazz or theory learner need not take before jazz.8 or theory.9; `taughtAt` stays null, not guessed. *Red:* `drill.reading.sight-reading-7 (jazz.8, theory.9): no rhythm.sixteenths (taught at null) fails at seeds 1, 7920, 15839, … : expected [ 1, 7920, 15839, 23758, 31677, …(35) ] to deeply equal []`; the params guard, `drill.reading.sight-reading-7: expected { level: 7, bars: 8, …(4) } to deeply equal { level: 7, bars: 8, …(5) }`.

**5. Keys are not ordered.** `key.signature`'s `on` is every key with a signature the level writes, sharps and flats alike, a set the seed chooses from.

**6. Unchanged with every option absent.** A golden of phrase hashes written by the generator before C4b (the nine rows' old params at forty seeds, every level with each hand setting and two lengths, every older option at every level) and the rows' params unchanged but row 7's. The levels 5–7 melody goldens unchanged. The thirty-day diary's lines and reads identical to the checkpoint's.

## Pedagogical verdict (from the notation; nothing heard)

The contract makes the 2.5 plateau impossible on the generator's side and says honestly where the curriculum asks what the reader's row cannot give: 2.1 teaches hands together over a one-hand row; 1.5's song teaches the leap its drill forbids; 4.5's row cannot drop skips, leaps or eighths. Three things a teacher would not accept yet, each recorded, none fixed (D's): a tie can be followed by a fifth (seed 71282 on the right-hand row: A4 tied into bar 4, then E4; C4 tied into bar 2, then G4); the first left-hand pattern (3.6) arrives two octaves below middle C with ledger lines, two new things at once (seed 11: C2 G2 E2 G2 under C4); and the day-14 tie phrase's left hand holds C3 for four bars. Whether any phrase reads as music is unverified as music.

## Tests

| test | class | the assumption the old assertion encoded | why the new one reads the learner-facing outcome |
|---|---|---|---|
| `generatorContract.test.ts` | add | — | every move the reader can ask at every core rung, through the real generator and detectors; the undoable set exactly declared |
| `sightReadingOptions.test.ts` | add | — | each control present when on, absent when off, where the level alone would not; params read; unrealisable cases |
| `sightReadingUnchanged.test.ts` + golden `sight-reading-unchanged.json` | add (guard) | — | nothing a phrase did not ask for changes; the rows ask what they asked but row 7 |
| `tools/content/tests/test_vocabulary_dimension.py` | add | — | the closed list, required, per demand |
| `sightReadingPromises.test.ts` bounds → `helpers/promises.ts` | revise (every assertion kept; the hook's large-removal warning is this move) | the promises are the test's own | one definition shared with the contract; each check says which demand it is about |
| `sightReadingPromises.test.ts` `unintended()` | revise | a demand no rung teaches is not checked | `taughtAt: null` is untaught everywhere (S23) |
| `sightReadingPromises.test.ts` params and concepts | revise | the built rows are current | read from the authored rows, as `targetSkills` already was |
| `sightReadingPromises.test.ts` `KNOWN_EARLY` | preserve (reason updated) | the rows' recipes are the only shapes the generator is asked for | kept for the row as the app asks today; the contract asks the held shape |
| `sightReading.test.ts` (goldens), `sightReadingFromReadingState`, `firstThirtyDays`, `sightReadingSlot`, `recommendRespondsToEvidence`, `lessonClaimsAboutApp`, `vocabulary`, `test_evidence_gate` | preserve | — | green; no diary line changed |

## Runs (unpiped; exit codes read)

- Content build once, early: `python tools/content/build.py --skip-fetch` 0.
- After the edits: `python tools/content/validate.py --personal` 0 (3 waived, 13 unjudged, 9 items declare targetSkills); `python -m unittest discover -s tools/content/tests -t tools/content` 0 (947); `npx tsc -b` 0; `npm run lint` 0; `npx vitest run` 0 (235 files, 5788 passed, 6 skipped), with C4a's and T42's work in the tree.
- Reds on the committed code: the options file (29 red), the dimension tests (5 FAIL), the contract on the committed generator (6 red), the control-entry test with no map, the promises test's S23 line, the params guard.
- Two temporary probe tests (seeds for the follow-ups; the tie/syncopation measurement) were run once and deleted.

## Not done

- **The reader offers none of the new moves** (C4c): day 14 still waits. `ReadingMoves` (`db.ts`) and `normaliseMoves`/`readingOptions` (`session.ts`) carry only C4's six fields, so a recipe with `ties` would be dropped on the way to the generator.
- **`KNOWN_EARLY` did not shrink** (brief item 5): S16's held shape reaches the learner only when `readingOptions` calls `heldToRung` with the route's rung (C4c), for Today and for an open from the rung page.
- The built catalog carries row 7's recipe at the next content build (the build ran once, early, as briefed).
- The contract covers the core track; the track rungs that list rows (classical.3, technique.5, theory.6, jazz.8, chords-pop.8, theory.9) and rows 4–7, which anchor no core rung, are held only by the promises test.

## Follow-ups

- **P1 (C4c):** read `READING_CONTROLS` / `unrealisable` / `UNREALISABLE_AT` to step up and down; grow `ReadingMoves` and `normaliseMoves` with the new options; call `heldToRung` in `readingOptions`; then remove `KNOWN_EARLY`'s line.
- **P1 (F), as the brief asks for a lesson–row contradiction:** 2.1 teaches hands together, and the row the reader offers there (1.5's, level 1) writes one hand. One rung.
- **P2 (D):** the tie's closing note is set after the walk moved on (seed 71282 above); level 3–4's own ties from an off-beat are syncopation (harmless at 4.5, a relic below it); the moving left-hand patterns sit from C2 (seed 11), so 3.6's move brings ledger lines; broken and walking left hands move in quarters under 6/8.
- **P2 (detectors, not mine):** `walkingBass` counts a bar of three quarters in 6/8 as a walk (its bar length is in quarters, not felt beats): a broken chord in 6/8 read as a walking bass in 9 of 12 seeds of 4.5's row.
- **P2 (D):** on 4.5's row skips, leaps and eighths cannot be turned off, so a skip learner there cannot be given steps only.
- **Record:** `docs/05` §8 and `docs/08-test-map.md` C4b additions went into commit 160aed7 (C4a's) with the shared files, ahead of the code they describe, which is uncommitted.

## Questions

None that block. To confirm: `leaps` and the "off" direction beyond the brief's list (deviations 1–2); S16 fixed in the reader, not the row (deviation 7); S23 by dropping sixteenths from row 7 until F teaches them.

## Unverified

- Nothing heard or seen: no browser (as briefed); every musical judgement is a reading of pitches and durations.
- Twelve seeds a move (deterministic, reproducible anywhere), not every seed; a promise that fails after the redraws would show as a failing move, and none did on those seeds.
- The reader's use of the map (C4c); the phrases on the owner's phone.

## Files

`app/src/engine/readingControls.ts` (new); `app/src/engine/sightReading.ts` (options, `unrealisable`, `levelFacts`, `sightReadingOptionsFor`); `app/src/demands/vocabulary.ts` (`DemandDimension`, `Demand.dimension`); `content/curriculum/vocabulary/demands.json` (`dimension`, comment), `demands.schema.json`; `content/catalog.static.json` (row 7: `sixteenths: false`, concept `sixteenths` removed); tests: `generatorContract.test.ts`, `sightReadingOptions.test.ts`, `sightReadingUnchanged.test.ts`, `helpers/promises.ts` (new), `fixtures/scores/golden/sight-reading-unchanged.json` (new), `sightReadingPromises.test.ts`; `tools/content/tests/test_vocabulary_dimension.py` (new); `docs/05-score-follow-engine.md` §8, `docs/02-curriculum.md` Part H, `docs/08-test-map.md`.

### Entry 77 — C4c: the demand-sensitive reader — a step down moves the control of the demand the reads single out, nothing is blamed where they single nothing out, a step up turns on the next demand the rung has taught, a key is named and never ranked; the phrase held to the rung that opens it; the thirty days and the mixed-demand learner run again (2026-09-27)

**Judgement.** Yes for items 0–6, with one finding the second stop has to hear first: **with both hands, a skip learner's skips are not singled out by the reads until a one-hand read separates them.** In a level-2 two-hand phrase the left hand holds a whole note under every right-hand note, so C4a's "both hands sounding at once" sits on every skip that went wrong; the skips never went wrong without it, and `demandReadings` rightly calls them `ambiguous` (the two-hand learner of `readerMovesTheDemand.test.ts`, five reads all with both hands: skips 16 of 23, `withoutRival` for playing together n = 0). The reader then says it is not sure, names nothing, keeps the left hand, and offers the easy read — right hand only, the newest thing added, undone — and that one-hand read is what separates them: the next morning the skips are a `pattern` and the step down is *skips off, both hands kept*. The thirty-day learner's move on day 6 rests on the same kind of read: its day-4 easy read was right hand only, and the skips' share where nobody played together (7 of 9, over days 1, 2 and 4) is what makes them a pattern. C4a's thresholds were not touched (as briefed). A learner who never reads a one-hand phrase would hear "not sure yet" until one comes, which is honest and slow (Follow-ups, C4a).

**The thirty days again, read as a teacher, against the first diary** (`docs/prompts/checkpoint-2026-09-27-diary.md`; the first is `checkpoint-2026-09-26-diary.md`):
- **Days 3–7.** Then: both hands on day 3, the easy right-hand read on 4, *Another like it* on 5, and on day 6 *This one right hand only — 10 of 14 right and in time yesterday* — the left hand taken because it was the last thing added. Now: the same days 3–5, then day 6 *This one by step only — skips went wrong in 3 phrases*: both hands kept, the skips out, and the phrase on the glass is stepwise under the held left hand. Day 7 *Another like it — 14 of 14 right and in time yesterday*; day 8 *Now with skips*, the skips back once the steps were clean on two days. That is what a teacher does: take the skips away, keep what was going well, bring them back when the rest is secure.
- **Days 11–20.** Then: ten days of the same phrase, *The next step waits for a later lesson* on four of them. Now: day 11 *This lesson's phrases can reach beyond C position* (2.2's row is held inside C position until 2.5 teaches leaving it, so 2.5's own demand arrives that day, and the reader moves nothing else), day 12 *Now with dotted quarters*, day 13 the easy one without them, day 15 *Now with tied notes*, day 17 the easy one without ties, and *The next step waits for a later lesson* only on days 19–20, when every demand 2.1–2.5 taught is in the phrase and shown. The wait is true there.
- **Days 22–25.** Then: *Now in G major* (22), *Now in F major* (24) — "now" of a key, as if F were harder (U52). Now: day 21 *A key signature to read: F major, one flat*, day 22 *An easy one, for fluency: in C major*, day 23 *Another like it: F major, one flat*, day 24 *Now with a note outside the key*, day 25 *Another like it: G major, one sharp*. The key is a set the seed chooses from (G or F at level 2), named each day, never "now", never ranked.
- **What a teacher would still question.** By day 26 the working recipe holds both hands, dotted quarters, ties, a key signature, an accidental and a promised leap: each taught and each shown on two days, but a dense phrase for the first week of 3.1, and some of those phrases do not keep all their promises (demonstration 4). *Now with a leap* on day 26 is a demand taught at 1.5 coming back as if new, because the five-read window had too few phrases with a leap held in them to count it shown. The phrases are still the random-walk generator's (D). Whether any of it reads as music is unverified as music: nothing was heard, and the notation was read, not played.

**The mixed-demand ambiguity learner** (same file; 2.5; every skip-eighth misread on days 1–2). Day 3, both halves: *An easy one: in C position — not sure yet what went wrong*; nothing named, no control moved for it. **(b) The reviewer's profile** (skip-eighths still wrong, skips in quarters and steps in eighths right): ten days, no demand ever singled out, no step down, the working recipe never moved; *Another like it — not sure yet what went wrong* on day 4, holds on the days the reads went right as a whole, one easy read on the cadence. It never moved up either: a proficient pair of reads in which a demand of the phrase still went wrong holds the recipe (deviation 5). **(a) The variant** (every eighth misread from day 3): day 4 *This one without eighth notes — the eighth notes went wrong in 3 phrases*; the skips stay unnamed (they held where no eighth was). Then both hands on day 6 and the eighths back on day 9, where the learner, constructed never to improve, fails them again: an oscillation with the window's memory as its period (Follow-ups).

**Each demonstration, with the evidence it rests on.**
1. *Repeated skip-specific failure changes the interval control, not hands* — yes: day 6's move is `interval.skip` off with `hands: 'both'` kept; that morning's readings: skips `pattern` (3 phrases below, 7 of 14), bass staff and playing together `ambiguous` (`firstThirtyDays` demonstration 1, `readerMovesTheDemand`). With the caveat above: it needs a read that separates the skips from playing together.
2. *Ambiguous mixed failure produces no specific diagnosis, and the contrasting reads then do* — yes: day 3 `unsure` in both halves, every sight-reading reading `ambiguous`; (b) never names a demand in ten days; (a) names the eighths on day 4 and only them (`firstThirtyDays` demonstration 2).
3. *The 2.5 learner reaches the next taught rhythm instead of waiting* — yes: dotted quarters on day 12, ties on day 15; no "waits" line at 2.5 before them (demonstration 3).
4. *Every legal move is generatable and detector-confirmed* — **partly.** Single moves: C4b's contract holds every taught demand on and off at every core rung, and the reader never asks for a move `UNREALISABLE_AT` declares or `unrealisable` gives a new reason against (`sightReadingFromReadingState`); every move the diaries asked for writes its demand in every phrase or none, over twelve seeds, with nothing untaught. **Composed recipes do not all hold:** the 3.1 working recipes (both hands, dotted quarters, ties, a key set, an accidental, and later a leap) miss a dotted quarter, a tie or the accidental at 5 of 12 seeds (13 lines), and day 28's own phrase has no tie. The contract proves each move from a rung's base, not moves composed on moves; that is C4b's to close, listed as `KNOWN_BROKEN` in demonstration 4 with the seeds (47615, 87210, 101, 39696, 71372; day 28's seed 3497510848). No line claimed a missing demand: day 24's *Now with a note outside the key* phrase has one (demonstration 5 checks).
5. *Every reason line says only what was established* — yes for the fifty lines both diaries produced: each "n of m" equals the latest read at the working recipe and its day word; each "X went wrong in k phrases" is a demand the readings that morning single out, below in exactly k phrases; "not sure yet" never stands beside a singled-out demand the last phrase held; every key named is the key the phrase was written in; every "Now with X" phrase has X (demonstration 5).
6. *Old item-completion semantics cannot contradict the evidence-derived rung state* — **not yet, by design; C5 owns it.** The old path still decides: the learner's rung comes from `nextRecommended` over pass records (`lessonComplete`), which is what the reader's row and taught-at gate stand on; a pass still credits every rung listing the item (L8); completion is a count over mixed lists (L9); a sight-read is still recorded like a piece, mastery and calendar (S8).

**What I looked at on the glass** (the final build, `vite preview`, 342 × 740, light, desktop Chromium; pictures in the scratch folder `glass/`; the rows restored were the diaries' own, moved in date): the skip learner's Today on day 6 — the daily card *This one by step only — skips went wrong in 3 phrases*, whole on two lines — and ▶ opening `recipe=hands:both,skips:0`, a stepwise right hand over whole-note C3 and G3; day 7 (*Another like it — 14 of 14 right and in time yesterday*); the ambiguity learner's day 3 (*An easy one: in C position — not sure yet what went wrong*, ▶ opening `recipe=position:1,easy:1`, one hand inside C4–G4); the variant's day 4 (*This one without eighth notes — the eighth notes went wrong in 3 phrases*, ▶ opening quarters and halves with the skips kept). The session card's reading slot was not on any of these cards: at 60 minutes and Shuffle 0 the warm-up takes the rung's reading row (L65), so its one-line reason (U51) was not seen with the new words. The brief's "day 7" for the skip learner's move is day 6 in the diary: the step down is due the morning after the second bad read at the recipe, as C4's was.

**Deviations, each with its reason.**
1. **`router.ts`** (not named): the route carries every control the reader moves (`skips:0`, `dottedQuarters:1`, `ties:1`, `fifths:1|-1`, `leftHand:…`); without it Today's recipe would be dropped on the way to the Score screen and the phrase written would not be the one offered.
2. **`ScoreScreen.ts`** (not named): the phrase is written through `readingOptions` with the route's rung (`taughtAtRung(judging rung)`) — the brief's "call `heldToRung` with the route's rung, for Today and for a row opened from the rung page" can only be done where the phrase is generated. One call site and its comment.
3. **`content/lessons/3.4.md`** and its claims row: the lesson said the daily read "changes one thing at a time … its key, or how far it ranges" (C4's two open dimensions at 3.4), false once any taught demand can move. Rewritten to "adding something a lesson has taught, such as a ledger line, a dotted rhythm or a key signature, or leaving out for a while a kind of note that keeps going wrong"; the row checks it against `readingMoves`. The longer text made the lesson 419 words, so its `readingTime` is 3 (`lessonShape`). Content rebuilt.
4. **`sightReadingPromises.test.ts` revised** (the brief listed it as preserve): removing `KNOWN_EARLY` means generating each row as the app now writes it — held to each rung listing it — so the rungs' promises are read at their own rung and the declared-skill check across the listing rungs (2.2's row declares position-shift, whose opportunity is 2.5's).
5. **A step up also needs every demand of the phrase held in the proving reads** (`heldBack`, my judgement on item 2): a phrase right as a whole on two days, in which some demand still went below the support share, is held, and the line names that demand where the reads single it out or says the app is not sure. Without it the reviewer's (b) learner moved up to both hands on day 7 while still missing every skip-eighth.
6. **The lesson line** (`why: 'lesson'`): calling `heldToRung` makes the phrase change when the row's rung changes (2.2's row leaves C position at 2.5). On that day the reader holds its recipe and says what the lesson adds, so one thing changes a day.
7. **The easy band's fallback is range, then hands** — C4's documented order ("else range, then hands"); C4's code sorted by its dimension list, which put hands first. The two differ only for a row with both hands its own and nothing added (4.5's).
8. **The e2e rows are a fixture made and guarded by a unit test** (`tests/e2e/fixtures/reader-learners.json`, written by `readerMovesTheDemand.test.ts` with `C4C_WRITE_E2E_ROWS=1`, and held equal to the real path's output on every run, in any time zone: the rows are dated noon UTC). Playwright cannot run OSMD and the engine on its own side; this is the real path's output, serialised, and it cannot rot silently.
9. **The thirty-day test's "one dimension from one day to the next" is revised to "one move from the working recipe"**: a targeted step down after an easy detour is one move from what the learner was working at and can be two from the detour's phrase (the variant's days 3–4).

## Done — per item: mechanism, the red line, before → after

**0. The Today spec's rows through the real path.** *Mechanism:* the case typed C3-shaped evidence with `definitions: 1` and no `evidenceDefinitions`; `storedEvidence` reads only C4a's stamp, so the rows contributed nothing. *Red (committed build):* `Expected: "This one in C position — 11 of 16 right and in time yesterday"` / `Received: "One phrase you have never seen, once, slowly"`. *Change:* both e2e learners' rows are made by `helpers/reader.ts` (generated, held, played through the engine, evidenced, stamped as the record call does), serialised to the fixture, restored with their dates moved. *Red of the revised cases on the committed build:* `Received string: "This one in C position — 12 of 18 right and in time yesterday"` and `Received: "This one in C position — 13 of 17 right and in time yesterday"` (C4's reader reading real rows). *After:* `today.spec` 14 passed; every e2e row C4c writes or keeps comes from the fixture.

**1. A step down targets the demand.** *Mechanism, confirmed:* `stepDown()` undid the newest addition by C4's dimension order, whatever went wrong. *Change:* two reads against the recipe → `demandReadings` for sight-reading → the singled-out demand the phrase still holds (the eighths and "shorter than a quarter" one control) → its C4b `off` patch; nothing singled out → `unsure`. *Red:* `firstThirtyDays`: `day 6: “This one right hand only — 10 of 14 right and in time yesterday”: expected undefined to be 'interval.skip'`; `readerMovesTheDemand`: `the step down is not the skip control … - "skips": false, + "position": true`; `expected 'back' to be 'unsure'` (the mixed learner). *After:* the diary's day 6 above; the adversarial table below.

**2. A step up targets the next taught demand.** *Red:* `2.5: … 14 “The next step waits for a later lesson — 14 of 14 right and in time yesterday” … expected undefined to be defined`; adversarial 4 `The next step waits for a later lesson — 8 of 8 right and in time yesterday: expected 'stay' to be 'forward'`. *After:* dotted quarters and ties at 2.5; *The next step waits* only where nothing taught is left.

**3. A key is a different key.** *Red:* `day 22 on 3.1: “Now in G major — 12 of 12 right and in time yesterday”: expected … not to match /^Now in [A-G]/`; `expected undefined to be 'key.signature'`; `expected 'Another like it — 17 of 17 right and …' to match /^Another like it: F major, one flat —…/`. *After:* the key signature's control is C4b's set; the line names the phrase's key (read from the generator); back to C is "an easy one".

**4. The policy object; 4b. the map's use.** `READER_POLICY` (`easyAfter` 3, `stepDownAfter` and `stepUpAfter` the ladder's 2, `demandShownAfter` 2), each a hypothesis, passed in through `ReadingInput.policy`. C4's hand-written table is deleted whole (`READING_DIMENSIONS`, `VALUE_DEMANDS`, `VALUE_SKILL`, `KEY_LADDER`, `dimensionsOf`, `withValue`, `readingMovesFrom`): every move is a demand's control from `readingControls.ts`, checked against `UNREALISABLE_AT` and `unrealisable`. What stays hand-written in the reader: the eighths/shorter fold (C4a's fact), and the easy band's fallback (C position, then one hand, unless the row's concepts promise them — C4's). The words are `DEMAND_WORDS` in `help.ts`. The `session.ts` diff is large because the reader section was replaced; the rest of the file is untouched (checked).

**S16's app half.** `readingOptions(item, recipe, seed, taught)` applies `heldToRung`; the Score screen passes the route's rung. *Red:* `scoreSummaryTruth`: `the rung’s phrase was the row as it stands`; `sightReadingPromises` with `KNOWN_EARLY` gone on the unheld path: `no range.beyond-position (taught at 2.5) fails at seeds 7920, 15839, … (27 seeds)`. *After:* green; `KNOWN_EARLY` removed.

**5. The reruns and the constructed cases.** The two diaries (above). The adversarial table, `readerAdversarial.test.ts`:

| case | next offer | control moved, and why — or why none did |
|---|---|---|
| 1 accurate steps, inaccurate skips (two reads) | back, `skips: false` | skips a pattern, steps held where no skip was |
| 1b the same, one read | hold | one read against is not two (the policy) |
| 2 accurate pitch, poor rhythm | unsure, recipe held | every sight-reading demand fell together; nothing below 2.2's own for an easy read |
| 3 accurate right hand, poor left (two reads) | back, right hand only | the bass staff a pattern (a demand the hands control governs); playing together not |
| 4 a difficult passage read accurately (two reads, 2.5) | forward, dotted quarters | proficient; the first taught demand not held or shown |
| 5 an easy passage read poorly | unsure, recipe held | every demand fell together |
| 6 a demand with no measurable opportunity (eighths at full tempo) | forward, both hands | the misread eighths are outside sight-reading's count at that tempo, so the reads supported; the eighths have no reading, and nothing names them (a limit of the measurement, Follow-ups) |
| 6b one note wrong under four demands, two days | unsure, the easy read | the note carries all four demands; nothing blamed — committed reader: `back`, the left hand taken |
| 7 heard, demonstrated, re-read | rung | not first readings |
| 8 no input | rung | no evidence |

*Red on the committed reader:* 1 `- "skips": false + "position": true`; 2 `This one in C position — 1 of 8 …: expected 'back' to be 'unsure'`; 3 `This one right hand only — 6 of 12 …: expected undefined to be 'clef.bass'`; 4 above; 5 `This one in C position — 1 of 9 …`; 6b (a temporary copy of the committed `session.ts`, deleted) `COMMITTED 6b: back … {"dimension":"hands","from":"both","to":"right"…}`; 1b, 7 and 8 were green on the committed reader (behaviour kept). The two-hand skip learner: in `readerMovesTheDemand` (judgement above).

**6. The demonstrations** — above, each a test in `firstThirtyDays.test.ts`.

## Pedagogical verdict (from the code, the diaries and four mornings on the glass; nothing heard)

The reader now does what a teacher does with the evidence a teacher would trust: it takes out the thing that keeps going wrong and keeps what goes well, it says when it cannot tell, it brings in what the rung taught once the learner is secure, and it treats a new key as a new key. Three places a teacher would put it differently: a two-hand learner's skips go unnamed until a one-hand read (the confound is in the evidence, the honest answer is "not sure", and the fix belongs to C4a's handsTogether reading); the month accumulates many demands at once by the end of 3.1; and a constructed learner who never improves oscillates with a period of about a week because the readings' window forgets. The words are plain; "skips went wrong in 3 phrases" means at least one skip went wrong in each of three phrases, which is what the evidence holds. Whether the phrases are music is unverified as music.

## Tests

| test | class | the assumption the old assertion encoded | why the new one reads the learner-facing outcome |
|---|---|---|---|
| `readerMovesTheDemand` ×8 | add | — | the skip learner, the two-hand skip learner, the mixed learner in both halves, the key words; the e2e fixture guard |
| `readerAdversarial` ×10 | add | — | the eight adversarial learners (and 1b, 6b): which control moved and why, or none |
| `firstThirtyDays` "each phrase is at most one move from the working recipe" | revise | a step down is the easy read's own step, so day to day never two | one move from what the learner was working at |
| `firstThirtyDays` thirty days stored; unseen; stepped back/moved on/easy; no key before 3.1 | preserve (the store counts per learner) | — | green |
| `firstThirtyDays` demonstrations 1–5 | add (the brief's "revise": a step down backs out the last added dimension) | — | the four demonstrations and every line against its evidence |
| `sightReadingFromReadingState` skip step down; reason line; 2.5/3.1 step up | revise | the step down is range (C position); the line can cite only the last count; after hands comes the key | the skip control; the singled-out demand and its number; the earliest taught demand not shown, never a key first |
| `sightReadingFromReadingState` "a move changes one dimension…" and "names the six dimensions" | replace / delete | C4's six dimensions are the reader's ontology | the reader asks only for moves C4b makes (the contract, cited) |
| `sightReadingFromReadingState` others | preserve (phrases now generated held) | — | green |
| `recommendRespondsToEvidence` failing learner, daily reads | revise | any failing learner gets an easier recipe | nothing singled out: same recipe, "not sure yet" |
| `recommendRespondsToEvidence` skip learner | add | — | the demand case |
| `sightReadingSlot` failing learner | revise | as above | the slot holds and says it is not sure |
| `sightReadingPromises` `KNOWN_EARLY`, generation, declared skills | revise | the app asks the row's own params at every rung | the row held to each listing rung |
| `scoreSummaryTruth` rung hold | add | — | a phrase opened from a rung is held to it |
| `router` every control | add | — | the route carries what the reader moves |
| `lessonClaimsAboutApp` 3.4 | replace | the reader moves key or range at 3.4 | the new sentence against `readingMoves` |
| `helpers/reader.ts` | revise (helper) | — | `eighthSteps`, `skipEighthSteps`, `wrongKey`, `opened` |
| e2e `today.spec` C4 case | revise | typed C3-shaped evidence | rows from the real path; the skip control on the glass |
| e2e `today.spec` mixed-demand case | add | — | not sure, the easy read, on the glass |
| `generatorContract`, `sightReadingOptions`, `sightReadingUnchanged`, `evidenceByDemand`, `demandReadings`, `evidenceAdversarial`, `readingState`, `sightReadingSlot` floor cases | preserve | — | green |

## Runs (unpiped; exit codes read)

- Reds as quoted, each on the committed code (the e2e on a `build:app` of the committed tree).
- After: `npx tsc -b` 0; `npm run lint` 0; `npx vitest run` 0 — 237 files, 5,805 passed, 6 skipped; the reader files again under `TZ=UTC` 0; `python tools/content/build.py --skip-fetch` 0 (validation OK); `npm run build:app` 0. Playwright on the final build, `vite preview` on 4173, two workers, one config, nothing built during a run: `today` + `doors` + `first-day` + `lesson-flow` 0 (39 passed); `lab` + `side-panel-prose` + `score.screen` 0 (58 passed).
- A temporary picture spec, three temporary probes and a temporary copy of the committed reader were run and deleted.

## Not done

- The session card's reading reason (U51) is unchanged and was not seen with the new words: the warm-up takes the row at Shuffle 0 (L65). My words put the change first, so a cut keeps what the phrase is and loses why.
- Composed recipes' missed promises are listed, not fixed (C4b's generator).
- The sixth verification: C5's.

## Follow-ups

- **P1 (C4b):** a recipe composed of several moves misses a promise at some seeds (5 of 12 at 3.1's working recipes); the contract should cover the compositions the reader builds, or the generator's redraw should keep every promise it is given, or `unrealisable` should say which it drops. Hypothesis: the redraw budget runs out with five promises at once; test: count redraws per promise set.
- **P1 (C4a):** "both hands sounding at once" counts a note held under the other hand's attack, so in level-2 two-hand phrases it sits on every step and confounds every demand with playing together; counting only both hands struck together would let two-hand reads separate the skips.
- **P2 (C3/C4a):** at a tempo whose window cannot time an eighth, a misread eighth drops out of sight-reading's count entirely (pitch and time are one outcome there); interval-reading sees it. Adversarial case 6.
- **P2 (the policy):** a demand taken out returns once its failures leave the five-read window; a learner who never improves oscillates (the variant). A memory of what the reader took out, or a window that does not forget a taken-out demand, is a policy change for C5–C7's trajectories.
- **P2:** "shown" needs two phrases in the window where the demand held; demands the phrases carry only sometimes (a leap) come back as "Now with a leap" late.
- **P3:** the `kept` line says "has them" for any demand ("the key signature … has them").

## Questions

- The step up now also needs every demand of the phrase held in the proving reads (deviation 5); confirm.
- The lesson line on a rung change (deviation 6); confirm.

## Unverified

- Nothing heard. Pictures at 342 × 740, light, desktop Chromium; not sideways, tablet, dark, 115 % text or the owner's phone.
- The learners are constructed; C4a's thresholds and the reader's four numbers are hypotheses, tested on constructed learners only.
- For a real learner: every row stored before C4a's stamp contributes nothing until something recomputes it (`recomputeEvidence` has no caller), so such a learner starts again at the rung's row.
- Construct validity (Entry 72's list stands): a demand's count is right notes in time at its notes, not that it was read; `pattern` is an association, not a cause.

## Files

`app/src/curriculum/session.ts` (the reader), `app/src/ui/help.ts` (the words), `app/src/data/db.ts` (`ReadingMoves`), `app/src/router.ts` (deviation 1), `app/src/ui/screens/ScoreScreen.ts` (deviation 2), `content/lessons/3.4.md` (deviation 3); tests: `readerMovesTheDemand.test.ts`, `readerAdversarial.test.ts`, `tests/e2e/fixtures/reader-learners.json` (new), `firstThirtyDays`, `sightReadingFromReadingState`, `recommendRespondsToEvidence`, `sightReadingSlot`, `sightReadingPromises`, `scoreSummaryTruth`, `router`, `lessonClaimsAboutApp`, `helpers/reader.ts`, e2e `today.spec`; `docs/04-ui-spec.md` §2, `docs/05-score-follow-engine.md` §8, `docs/08-test-map.md`, `docs/prompts/checkpoint-2026-09-27-diary.md` (new).

### Entry 78 — C4d: the contract over the composed recipes the reader can reach, and a hands-together opportunity that means coordination — the missed promises were the redraw budget, counted before it changed; playing together is counted where the left hand strikes under the right, so a two-hand skip learner is singled out the morning after the second bad read (2026-09-27)

**Judgement.** Yes for S29, L72 and the four reruns, with one finding the reviewer should hear first: **the composed misses were never a composition the generator could not write; they were a redraw budget sized for one promise at a time.** Counted before anything changed (probes in the scratch folder): at every missing seed the generator's own tally and the detectors agree, the loop had run all 64 draws, and every miss was in G major, where level 2's raised fourth (C sharp) lies at the bottom of the C4–C5 range — a draw keeps the accidental about once in forty there (once in eight in C, once in five in F), and all five of 3.1's working promises (skips, eighths, dotted quarters, ties, the accidental) about once in two hundred. Unbounded, the failing seeds keep every promise after 70–490 draws. The budget is now 4096, sized from the rarest recipe the reader can reach (about once in 370 draws, seeds 1–20,000; a seed of it now misses about once in 60,000). The same budget was quietly failing single promises too: five phrases in the unchanged golden (the older `accidentals` option at levels 3, 4, 5 and 7, hands together, four bars) had gone out without their promised accidental; they are the only golden entries that moved. The contract now walks what the reader can reach (about 1,100 recipes over twelve rung groups) and every one keeps its promises at every seed; two compositions the walk found were not the budget, and each is dealt with honestly (below). **L72:** the two-hand skip learner who never reads one-handed is singled out **the morning after the second bad read** — C4c's hypothesis holds; it does not take a third day.

**The two-hand skip learner, before and after** (`readerMovesTheDemand`; the same five reads — 2.2's row with both hands, three clean, then every skip misread on days 4 and 5; the same calendar; both runs through the real path, the committed detector copied in for "before" and put back):

| morning | before (C4c's detector) | after (C4d) |
|---|---|---|
| 6 | skips 16 of 23, below in 2 phrases, **`ambiguous`**: where playing together was absent the skips had **0** opportunities (it sat on every right-hand note over the held root). *An easy one: right hand only — not sure yet what went wrong*; the easy read, skips misread again | skips 16 of 23, below in 2 phrases, **`pattern`**: where playing together was absent (inside the bar) the skips went 16 of 20, below. *This one by step only — skips went wrong in 2 phrases*: skips off, **both hands kept** |
| 7 | skips 8 of 20, below in 3, `pattern`: *This one by step only — skips went wrong in 3 phrases*, both hands kept | — (the move came a day earlier, without the detour) |

The clean reads still carry playing together: each four-bar phrase counts it at its four bar-starts, all right, where C4c counted all 19–22 steps; a clean read of 3.4's row (the one that declares the hands-together skill) is measured and supported.

**The composed contract, rung by rung** (`composedContract.test.ts`; twelve seeds a recipe; generator → OSMD → extractor → detectors; the reader's own transitions — `readingMoves`, in the taught-at order, with the passes-over it can make, one step down on a demand the phrase holds and the step ups until it is back, each easy read):

| rungs (the reader's row, held to) | recipes | reliable | deepest accumulation walked | declared unavailable in composition (the reader does not offer them) |
|---|---|---|---|---|
| 1.3, 1.4 (`1-left`) | 2 each | all | the row | — |
| 1.5, 2.1 (`1`) | 4 each | all | the melody on the bass staff | — |
| 2.2–2.3 (`2-right`, 2.2) | 13 | all | both hands, a leap | skips off where leaps are on ("A melody held to steps cannot leap"); leap on where skips are off; leap off with both hands (the roots) |
| 2.4 (`2-right`, 2.2) | 32 | all | both hands, leap, dotted quarters, ties | as 2.2, and: eighths off where dotted quarters are on, dotted quarters on where eighths are off ("completed by an eighth"); leap or skip off, or ties on, where a tie's closing note forbids it |
| 2.5 (`2-right`, 2.5) | 47 | all | + beyond C position | as 2.4 |
| 3.1–3.3 (`2-right`, 2.5) | 87 | all | both hands, leap, dotted quarters, ties, beyond, a key set, an accidental (the diary's working recipes are among them) | as 2.4, and **new**: the hand held in position once a key set is on, or a key set once the hand is held in position ("Held inside the five-finger position from its tonic, a melody in one of these keys would climb above the top of the level's range": G major's position runs G–D, and 2.5's row stops at C) |
| 3.4–3.5 (`2`, 3.4) | 144 | all | skip, leap, dotted quarters, ties, beyond, key, accidental, ledger | as above; ledger on or the position held where the other is ("no ledger line beyond middle C to reach") |
| 3.6–4.4 (`2`, 3.4) | 178 | all | + a broken-chord left hand | as 3.4, and: one hand, or ledger lines off, under a moving left hand; a moving left hand where skips are off or ledger lines are off |
| 4.5; 4.6–4.7 (`3`) | 305 each | all | skip, leap, eighths, dotted quarters, ties, beyond, key, accidental, ledger, an Alberti left hand | the position, ledger and left-hand compositions as above |

`COMPOSED_UNRELIABLE` — the list for a recipe the generator still cannot honour at every seed — is empty and held so (a failing recipe not named there fails the file; a named one that passes fails it too).

**The thirty days, the ambiguity adversary, read as a teacher** (`docs/prompts/checkpoint-2026-09-27-diary.md`, regenerated; its diff is in the scratch folder):
- **Two lines changed, both S29's.** Day 28 now has its tie: *Another like it: G major, one sharp* — a different phrase from the same seed, the one the generator reaches once it keeps every promise (21 steps read where C4c's had 14, and no tie). Day 29 cites that read, *21 of 21 right and in time yesterday*. Read off the notation, not heard: G4 dotted half, C5 tied across the bar line; A4 B4 C5 eighths, C5 dotted quarter, C5 eighth; A4, F♯4, **C4** (a tritone down), D4, C♯4, D4, C4; F♯4 dotted quarter, G4 A4 F♯4 D4, ending on **G4 as an off-beat eighth**; the left hand holds G3 for all four bars. The tie and the accidental (C♯ as a lower neighbour, short, off the beat) are clean; the tritone leap, the weak ending and the motionless left hand are the random walk's (D's), and a teacher would not choose this phrase for the first week of 3.1. Unverified as music.
- **L72 changed no line.** Day 6's step down was already due that morning (two reads against the both-hands recipe, days 3 and 5); it no longer rests on day 4's one-hand read — over the two-hand reads alone the skips are singled out (demonstration 1, extended; red on C4c's detector: `expected 'ambiguous' to match /pattern|isolated/`).
- **The ambiguity adversary, both halves: unchanged, line for line.** Its phrases are 2.5's right-hand row until the variant adds both hands on day 6, and no decision there turned on playing together. (b) still names nothing in ten days; (a) still names the eighths on day 4 and only them. That L76 question stands as the C4.5 review left it.

**Deviations, each with its reason.**
1. **The evidence's version moved to 3** (`evidence.ts`, the line the brief allowed). The detector's change moves every stored `texture.hands-together` count and the hands-together skill's `n`; `01` §4.5 says a change to the vocabulary's results moves `EVIDENCE_DEFINITIONS`. Consequence for a learner: every row C4a–C4c stored contributes nothing until something recomputes it (no trigger yet, as before). The e2e fixture's seven stamps moved with it (only those bytes), so `today` and `doors` ran.
2. **A moving left hand is also a promise that the melody strikes in every bar** (`underTune`, `sightReading.ts`). Not the budget: at 4.5 a tie into a 6/8 bar held whole left one bar with the Alberti alone, and the `leftHandPattern` detector (C2's, not mine) reads a pattern only under a bar where the tune plays. The generator now redraws that shape where `leftHand` is asked for outright; phrases with `leftHand` absent are untouched (the golden).
3. **A composed unavailability is a reason from `unrealisable`, not a separate list.** The reader already refuses any move that brings a new `unrealisable` reason (`moveFor`, the easy read), so a composition declared there behaves exactly as a single impossible move: skipped, the next move tried, or the next step waits. `session.ts` and `readingControls.ts` are untouched.
4. **The walk steps down only on a demand the phrase may hold.** `readingMoves` also lists an off move for a demand no phrase of the recipe can hold — the walking bass off at 3.4, which writes a broken-chord left hand 3.6 has not taught; `readingOffer` never takes it (it steps down only on a demand the reads single out, `singledOut`). Reported, not fixed (Follow-ups).
5. **`handsTogether` keeps `present` as the texture** (both hands sounding at once) and moves only its locations — the reading rows' promises, the contract and `demandsOfFiles` read `present`, and a held left hand under a melody entering after it is still two hands at once, with nowhere to coordinate (as a key signature whose altered letters never sound).
6. **Tests the brief did not name:** `evidenceVersion` gains a case (the others preserved); `firstThirtyDays` demonstration 1 gains the two-hand-only reading; the golden's five entries (Tests).

## Done — per item: mechanism, the red line, before → after

**S29. The contract over composed recipes, and the generator honouring them.** *Mechanism, counted:* the redraw budget (above), and two compositions that were not the budget (deviations 2 and 3, and the G position). *Red, on the committed generator (copied in, then put back) and the walk as built:* `composedContract`: `AssertionError: expected [ …(357) ] to deeply equal []` — 357 of the 1,123 reachable recipes, none below 3.1 (22 at 3.1–3.3, 55 at 3.4–3.5, 86 at 3.6–4.4, 97 each at 4.5 and 4.6–4.7), 354 of them missing a promised demand at some seed; the first line `3.1,3.2,3.3 {"hands":"both","position":false,"leaps":true,"dottedQuarters":true,"ties":true,"fifths":[1,-1],"accidentals":true} (up) seeds 101,39696,47615,63453,71372,79291,87210: rhythm.dotted-quarter in 10 of 12 phrases it is asked of; rhythm.ties in 6 of 12 …; pitch.chromatic in 7 of 12 …`; `firstThirtyDays`: `AssertionError: expected [ …(14) ] to deeply equal []` (C4c's fourteen, listed as the red). After the budget alone: the misses gone, left the 4.5 left-hand pattern (`texture.left-hand-pattern in 11 of 12 phrases it is asked of`, seed 15939) and 3.1's `breaks: nothing above the C above middle C`. *After:* `composedContract` 6 of 6; `KNOWN_BROKEN` empty; `generatorContract`, `sightReadingOptions`, `sightReadingPromises`, the levels 5–7 goldens unchanged and green.

**L72. The hands-together opportunity means coordination.** *Mechanism:* `handsTogether` located every note sounding over the other hand; under whole-note roots that is every right-hand note, so on every wrong skip, and C4a's rule rightly refused to separate them. *Change:* located at a step where a left-hand note strikes while the right hand sounds, every note struck there. *Red:* `demandDetectors`: `expected [ 1, 2, 3 ] to deeply equal []` (a held root, the melody entering after it), `expected { …(2) } to deeply equal { steps: [ +0, 4 ], …(1) }` (sustained accompaniment), `expected { steps: [ +0, 1, 2, 3, 4, 5 ], …(1) } to deeply equal { steps: [ +0, 1, 2 ], …(1) }` (the left hand changing under a held note); the Alberti case green on both (genuine coordination kept its opportunities); `readerMovesTheDemand`: `the skips were not singled out by the second bad two-hand read: expected 'ambiguous' to be 'pattern'`; `evidenceByDemand`: `expected { kind: 'measured', …(9) } to match object { n: 2, right: 2 }`; `evidenceAdversarial`: `expected { …(5) } to match object { n: 2, right: +0, …(2) }`; `evidenceVersion`: `expected 2 to be greater than 2`. *After:* the table above.

**The reruns.** The skip learner's thirty days and the ambiguity adversary's two halves regenerated (above); the two-hand skip learner (above); the composed contract (above).

**L76.** Not built. The composed walk proves the generator half of a discriminating read — the working recipes on its chains, each with one demand taken out, are walked and kept — so the probe's phrase costs nothing new; the rest (the persistence threshold, which competing demand to isolate first, the neutral line, adapting only if the probe discriminates) is policy the review designed for after C5. Not essentially free; stopped there.

## Pedagogical verdict (from the code, the diaries and the notation; nothing heard)

A teacher would recognise both repairs. A learner who misreads skips with both hands is told the skips are the trouble after two bad days, and keeps the left hand — no detour to one hand to find out. And a phrase the reader promises with a tie now has one. The 3.1 phrases are still dense and still the random walk's: day 28 keeps every promise and still leaps a tritone, ends on an off-beat eighth and holds its bass for four bars — D's. The held position in G is withheld rather than bent; a keyed learner at levels 2–3 whose range is singled out is held and told so (*Another like it — the notes beyond the hand position went wrong in 2 phrases, and every phrase here has them*), which is less helpful than a G-position phrase that fits, and whose last clause is true only where the recipe promises the range (C4c's P3 wording, now reachable here; Follow-ups). Unverified as music.

## Tests

| test | class | the assumption the old assertion encoded | why the new one reads the learner-facing outcome |
|---|---|---|---|
| `composedContract` ×6 | add | — | every reachable composed recipe keeps its promises; a move the generator declares it cannot make is never offered; the diary's 3.1 recipes are reached; the walk is not the product |
| `firstThirtyDays` `KNOWN_BROKEN` | revise | composed recipes may miss a promise | empty: the composed recipes the diaries read keep every promise |
| `firstThirtyDays` demonstration 1 | revise (extended) | the move may rest on a one-hand read | over the two-hand reads alone the skips are singled out |
| `firstThirtyDays` others | preserve | — | green; the diary regenerated |
| `readerMovesTheDemand` two-hand skip learner | replace | every note under a held note is a coordination opportunity, so the skips wait for a one-hand read | singled out the morning after the second bad read, the left hand kept |
| `readerMovesTheDemand` clean two-hand reads; 3.4's row | add | — | legitimate hands-together evidence survives, at the coordination steps, all right; the skill measured and supported |
| `readerMovesTheDemand` e2e fixture guard | preserve (fixture data: seven stamps) | — | the rows are the real path's |
| `demandDetectors` hands-together: a held root, the melody entering after | revise | every right-hand note over a held left-hand note is an opportunity (the old test asserted only `present`, which holds) | present, located nowhere |
| `demandDetectors` sustained; the left hand changing under a held note; Alberti | add | — | the opportunities are the root changes, the left-hand changes, every Alberti note |
| `evidenceAdversarial` case 3 (evidence; two reads) | revise | every note under a held note is an opportunity | hands together 0 of 2 at the two coordination steps; never read apart from the bass staff; still not singled out |
| `evidenceByDemand` ×3 | add | — | a clean sustained or Alberti read earns hands-together; a melody misread over a held root is not a hands-together failure |
| `evidenceVersion` a row under 2 | add | — | the version moved with what playing together counts |
| `sightReadingUnchanged` | preserve (golden data: five entries) | 64 draws keep every single promise | the five phrases that went out without their accidental now keep it; nothing else moved |
| `generatorContract`, `sightReadingOptions`, `sightReading` (goldens), `sightReadingPromises`, `demandReadings`, `evidenceProperty`, `demandsOfFiles`, `readerAdversarial`, `sightReadingFromReadingState`, `recommendRespondsToEvidence`, `sightReadingSlot` | preserve | — | green; `readerAdversarial` case 3 still steps back to one hand (its hands-together counts changed, not its decision) and 6b is still not sure |

## Runs (unpiped; exit codes read)

- Reds as quoted, each on the committed code: the composed contract on the committed `sightReading.ts` copied in and put back; demonstration 1's extension and the two-hand learner's "before" with the committed `detect.ts` copied in and put back (`git diff` read after each); the version red on the committed constant; the fixture guard before its rewrite; the golden after the budget change (then its five entries checked one by one: each had spent all 64 draws without its accidental).
- After: `npx tsc -b` 0; `npm run lint` 0; `npx vitest run` 0 — 238 files, 5,820 passed, 6 skipped; `python -m unittest tools.content.tests.test_vocabulary_dimension tools.content.tests.test_evidence_gate` 0 (18); `python tools/content/validate.py --personal` 0 (the vocabulary is imported by the app, not built, so no content build). `npm run build:app` 0 with no preview running; then Playwright on that build, `vite preview` on 4173, two workers, one config, nothing built during the run: `today` + `doors` 0 (36 passed); the preview server stopped after.
- Probes in the scratch folder (a scratch Vitest config rooted at `app/`): an instrumented copy of the generator for redraw counts and per-draw rates; the walk's size and rates; day 28's notation; the two-hand learner before and after. None is in the tree.
- Two `vite preview --port 4173` processes from before this session (started 03:01, not listening) were left alone.

## Not done

- `readingMoves`' over-listing (deviation 4): `session.ts` was mine only for a composed unavailability.
- The backlog rows S29 and L72 and `docs/prompts/checkpoint-2026-09-27-reading.md` are the orchestrator's to update.
- L76 (designed, after C5).

## Follow-ups

- **P2 (C4c's `readingMoves`):** it lists an off move for a demand no phrase of the recipe can hold (the walking bass off at 3.4 writes a broken-chord left hand, untaught there); `readingOffer` never takes it, but `lessonClaimsAboutApp` checks 3.4's sentence against the list. Filter by `mayWrite(current)`, as its own comment says.
- **P2 (C2's detectors):** `leftHandPattern` and `walkingBass` read a bar the melody only holds (tied in, held whole) as no tune; musically the pattern is still under a tune. The generator now avoids the shape where it promises the pattern; the definition is C2's to revisit.
- **P2 (D):** day 28's phrase — a tritone leap (F♯4–C4), the last note an off-beat eighth, the left hand motionless for four bars. The random walk, not the contract.
- **P2 (the learner model in the tests):** the constructed skip learner misreads every pitch of a wrong step, so where a skip falls on a bar-start its left-hand root is misread too and hands together goes wrong there with it; a real learner would miss the right-hand note (`p`, and the step untold for hands together). The conclusion does not depend on it; the counts do.
- **P2 (C4c's words, reachable through this change):** the `kept` line ends "and every phrase here has them", true only where the recipe promises the demand in every phrase. With the G position declared unavailable, a keyed learner on 2.5's row whose range is singled out, with the range not promised (`position` absent), is held with that line while only some phrases reach beyond the position. Not in any diary; the words are `help.ts`'s.
- **P3:** the G position is withheld at levels 2–3; a lower G position would need ledger lines 3.1 has not taught. If a keyed range step down is wanted, it is a range the level could write (D).

## Questions

- The evidence version moved to 3 (deviation 1): every row stored since C4a now waits for a recompute that has no trigger. Confirm, or say the hands-together counts should be allowed to mix for a window.

## Unverified

- Nothing heard; no screen looked at (the e2e run drove the Today cases, whose rows are C4c's but for the stamp; no picture taken).
- Twelve seeds a recipe (deterministic, reproducible anywhere); the rates are over seeds 1–4,000 and 1–20,000, deterministic properties of the generator, not measurements of this machine. The walk is representative, not every combination.
- The learners are constructed; C4a's thresholds and the reader's policy are unchanged hypotheses.
- The cost of the larger budget on the owner's phone: the rarest reachable recipe takes about 370 draws on average and at most 4096, each a draw of a four-bar phrase without rendering it; not measured on the phone or against the render.

## Files

`app/src/engine/sightReading.ts` (`PROMISE_ATTEMPTS`, `underTune`, `unrealisable`'s composed reason); `app/src/demands/detect.ts` (`handsTogether` only); `app/src/evidence/evidence.ts` (`EVIDENCE_DEFINITIONS` 3 and its line); `content/curriculum/vocabulary/demands.json` (`texture.hands-together`'s display, spliced); tests: `composedContract.test.ts` (new), `firstThirtyDays`, `readerMovesTheDemand`, `demandDetectors`, `evidenceAdversarial`, `evidenceByDemand`, `evidenceVersion`, `fixtures/scores/golden/sight-reading-unchanged.json` (five entries), `tests/e2e/fixtures/reader-learners.json` (seven stamps); `docs/05-score-follow-engine.md` §8 and §9b, `docs/08-test-map.md`, `docs/prompts/checkpoint-2026-09-27-diary.md`.
