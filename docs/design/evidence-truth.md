# What counts as evidence (CL11)

The brief is `docs/prompts/tasks/CL11-what-counts-as-evidence-traced-and-decided.md`. The rulings it rests on:
`responses/43045ffb.md` (ownership follows meaning), `responses/f860c76e.md` §3–§5 (CL11 owns what can be
established when an application's purpose cannot be measured), `responses/questions-53670d2a.md` §3 (L23, L57,
L58, L105, G71, G80), `responses/questions-e71ef3ad.md` (G71's re-check) and `responses/52363ba7.md` (X46's
approval, which keeps the piece, self-report and Wait cases here). Line numbers are at the base `af18a3ae` and
will move as the code changes.

**What this rests on.** No screen was looked at, and nothing was run in a browser. What a learner meets is read
from the code and the sentences it prints. Claims marked *observed* come from unit-level reproductions run in this
lane's worktree: a scratch test file outside the suite, not kept, whose outputs are quoted here. Counts over
content were taken mechanically from `content/curriculum/` and `content/curriculum/vocabulary/` at the base, and
from the main checkout's built `app/public/content/`, read without writing. Which tree that build came from was not
established. Nothing was heard. One question needs an ear: whether the microphone is accurate enough (under *Found
here*). It stays open and says so.

## Judgement

**What changes for a learner.** Three things, and nothing else:

1. **A Keep tempo pass stops letting wrong keys through.** *Observed:* a run with a stray key struck beside every
   right note scores 100 % and passes in Keep tempo, while the same playing scores 0 % in Wait. After the build, a
   wrong key costs one note in Keep tempo, just as it costs its step in Wait. A right note played late is charged
   once. Today it is recorded as a miss and a wrong note.
2. **Reading with the note names on screen stops counting as unaided reading.** *Observed:* a Wait first reading
   with *Name the note I am waiting for* on and the keys guide off produces full-standard (independent) evidence for
   interval-reading. Four more reading skills have the same standards, so the same holds for them; that is inferred
   from the vocabulary, not run. After the build such a reading is practice-standard evidence, as
   `questions-53670d2a.md` §3 rules.
3. **The screens that say whether a run counted give one answer.** A microphone pass counts on the lesson page but
   shows *played* on Today. After the build Today shows ✓. Progress counts a piece the learner only *said* they can
   play as passed. After the build it shows the learner's word as theirs.

Unchanged: a Wait run stays practice, a self-report stays the learner's word, and a piece's run counts for the piece
but for no skill.

**Rows (8).**

- **Decided, for the build to make (3):** L10 (lane 1), and L58 with L57 (lane 2).
- **Closed without a build (2):** L105 (the gate already behaves as ruled) and G71 (retired under its own ruling).
- **Open on a product choice (1):** L102. Switching the generated families on would change which runs meet five
  skill requirements on four rungs. It is not switched on here; the options are under *Choices*.
- **Parked (2):** G80 (no evidence-bearing run can reach it) and L23 (a capability, not a defect).

X46's three inputs and R23's question all hold as the code stands. The input that changes is the Wait sentence: its
condition is empty (below). Two consumer disagreements were found here and go into lane 1.

**The build's shape.** Two independent lanes; they share no source file:

- **Lane 1, "one accuracy, one count":** the engine, `Scoring`, `measurement`, the session outcome, Progress, and
  the spec sentences. App code only.
- **Lane 2, "the vocabulary's conditions and numbers":** `skills.json` and its readers. This changes content, so it
  bumps the evidence version and its items are listed for review.

## Hypothesis and falsifier, as run

**The hypothesis held in part.** Most rows are rules or consumers misreading a truth that is already stored. Every
fact L10, L58, the microphone case and the self-pass case need is on the stored row: `steps.wrong`, `wrongNotes`,
`keys.names`, `accuracyEstimated` and `selfPassed`.

**"The rest follow from L10" is refuted.** L58, L57 and the two consumer disagreements each have their own
mechanism. L105, G71, G80 and L23 need no build at all.

**L10's own premise was narrower than the brief's** (see the section on where the brief was wrong). Wait passes
nothing, so there are not two pass accuracies under one threshold. The fault is that Keep tempo's accuracy and its
per-step pitch verdict both ignore wrong keys.

**The falsifier fired once, and the case stays outside the build.** For a piece's run to become skill evidence, it
would need a declared target. No stored field holds one: no notated piece declares a skill, and R23 found no fact
naming a song run's application. That missing truth is named below with its owner; nothing was invented to fill it.

**L102 is not blocked by a missing fact.** The vocabulary's standards already say what a run of practised material
can show. Switching the families on is still a product choice, because it changes which runs meet rung
requirements and what Today offers.

## The rows and inputs

| | Reproduces at the base | Decision | Build |
|---|---|---|---|
| L10 | yes, observed | a wrong key costs a note in Keep tempo; a late note is charged once; old rows keep their recorded accuracy | lane 1 |
| L58 | yes, observed | names off joins every full standard that has guide off | lane 2 |
| L57 | yes, observed | the support share and the timing precision live in the vocabulary | lane 2 |
| L105 | no: the gate behaves as ruled | close; whether now is the right moment belongs to the composer | none |
| G71 | the gap exists; nothing needs it | retire, under its ruling | none |
| L102 | yes; its stated precondition is met | not switched on here: a product choice (recommend keep) | none |
| G80 | the gap exists; unreachable | park until a notated item can earn evidence | none |
| L23 | yes: no continuity measure | park: a capability, not a defect | none |
| X46: Wait counting | the condition never occurs: 0 of 109 rungs | Wait is practice; correct the spec sentence | lane 1 (docs) |
| X46: self-report | holds | the learner's word stays apart | lane 1 (the Progress reading) |
| X46: piece skill evidence | holds | a piece's run is evidence of the piece | none (P1 limitation reported) |
| R23's question (2) | holds | a song run establishes only the run | none |
| Found here: microphone pass | yes, observed | it counts everywhere, Today included | lane 1 |
| Found here: Progress and the learner's word | yes | Progress reads `selfPassed` | lane 1 |

### L10: what a wrong key costs

- **Evidence (observed).** The four-note melody C D E F at 60 bpm. A key a tritone above each note is struck with
  it, inside its window. In Keep tempo the result is accuracy 1, `hits` 4, `wrongNotesTotal` 4, step codes `hhhh`
  and `evaluateOutcome(…).passed` true at 100 %. In Wait the same playing gives accuracy 0 and codes `wwww`.
- **The same fault at the other two readers (observed).** A stored Keep tempo row with accuracy 1 and four wrong
  notes still meets a rung's standard: `meetsStandard`, `rungState.ts:225–237`, reads `row.accuracy` at :228. The
  evidence's pitch channel reads all four steps as right: `measurement.ts:168–171` takes `h` as right and never
  reads `steps.wrong`.
- **A second fact (observed).** In Keep tempo, a D played a quarter of a beat late (past the 150 ms window) is
  recorded twice: as a miss and as a wrong note. The row shows `wrongNotesTotal` 1, codes `hmhh` and a wrong mark of
  `[1, 62]`, where 62 is the pitch step 1 expected. Accuracy is 75 %, because wrong notes are free today.
- **Mechanism.** In Keep tempo, accuracy is `hits / expectedNotes` (`Scoring.ts:219–226`). A wrong note raises
  `wrongNotesTotal` and is put against the nearest step (`PracticeEngine.ts:1126–1143`), but it reaches neither the
  accuracy nor the step code: `stepCode`, `Scoring.ts:167`, gives `h` whatever `mark.wrong` holds. In Wait, a wrong
  key makes its step unclean (`PracticeEngine.ts:930–933`, :976). Both accuracies then meet one `passAccuracy`.
- **Correction to the brief.** Wait cannot pass, so the shared threshold binds only two Wait readers: the sheet's
  *Notes ready* heading (`ScoreScreen.ts:4219–4220`) and the ladder's support share, which is read over the
  evidence's per-step verdicts.
- **Consumers.** The sheet's heading and *To pass* line; `progressStore.recordRun`, which sets the row's status,
  `bestAccuracy`, `passedOn` and `masteredOn`; `rungState`, which feeds the lesson page, Plan and Today's
  composer; `scoreOutcome`, which sets Today's mark; and the ladder and `demandReadings`, through the pitch verdict.
- **Decision.** Accuracy means one thing in both modes: the written notes played right, with nothing extra.
  - **A wrong key costs one note in Keep tempo.** A wrong key is a pitch that no step in reach asks for. In Wait it
    already costs its step.
  - **A right note at the wrong time costs once.** It counts as a miss, or as *early* under the existing rule. It
    never counts as a wrong key as well. At most one late strike per missed note is spared; a repeat is a wrong key.
  - **The unit stays the note in Keep tempo.** A three-note chord with one note missed keeps two-thirds of its
    credit. Wait keeps the step as its unit. On a single-line melody the two modes then give the same figure for the
    same playing.
  - **The evidence follows the same rule.** A Keep tempo step with a wrong key against it is not right on the pitch
    channel. The right note's onset may still be timed.
  - **The threshold does not change.** Each rung keeps its own number (Part G, `masteryCriteriaFor`), the master
    standard included.
- **What the learner meets.**
  - A Keep tempo run full of extra keys no longer passes.
  - The sheet's accuracy drops by one note for each wrong key.
  - *Wrong notes* stops counting a late right note.
- **History: forward only.** This follows from the stored facts; it is not a preference.
  - A row recorded under observation definitions 1 cannot tell a wrong key from a late right note. Both go into
    `steps.wrong` (the late D's `[1, 62]` above), and the row holds no expected pitches.
  - `rungState` reads rows without the played model.
  - So re-judging those rows would charge late notes twice. They keep the accuracy they were judged with.
  - `db.ts:118–126` already ties "the accuracy definitions" to `OBSERVATION_DEFINITIONS`, so the new rule rides on
    definitions 2.
  - The pitch verdict changes only for definitions-2 observations. Those do not exist before the build, so no
    stored evidence changes meaning, and lane 1 needs no evidence-version bump.
- **Smallest change.**
  - `PracticeEngine.feedTempo`: a strike of a pitch that a step in reach asks for, outside that step's window, is
    not a wrong key. Late strikes need the same treatment as early ones. The builder chooses the reach and gives the
    reason; the early rule uses less than a beat.
  - `Scoring.buildScore`: Keep tempo accuracy becomes `max(0, hits − wrong keys) / expectedNotes`. Rhythm-only runs
    keep their rhythm figure.
  - `OBSERVATION_DEFINITIONS` becomes 2 (`db.ts:126`), and `KNOWN_OBSERVATION_DEFINITIONS` becomes {1, 2}
    (`measurement.ts:136`).
  - `measurement.pitchReading`: under definitions 2, a step with a wrong key against it is not right.
  - `rungState`: no change.

### Input: "a Wait run counts only for a rung asking no tempo"

- **Evidence (observed).** I read all 109 rungs in `content/curriculum/stage-0…9.json`; the main checkout's built
  `curriculum.json` also holds 109. For every one, `masteryCriteriaFor` was taken at both Settings bounds, which
  `coerceSettings` clamps to 30 and 130 (`settingsStore.ts:226`). No rung gave a tempo floor at or below 0. A Wait
  row at accuracy 1 met none of the 109 rungs at either bound.
- **Why.** A rung's `minTempoPct: 0` (11 rungs) means "no number of my own" and takes the Settings pair
  (`selectors.ts:70–79`, :96). A run judged by no rung also uses the Settings pair. So Wait passes nothing anywhere
  (`Scoring.ts:452–454`, :491–492), and it meets no `runs` requirement (`rungState.ts:235`).
- **Mechanism.** T37's rule is right. The condition it names never occurs.
- **Consumers.** All of them already agree:
  - the Wait card says "A run in this mode is practice" (`help.ts:102`);
  - the sheet heads such a run *Notes ready* with *To pass* (X46);
  - the run is outcome `unknown`, and X46's practice rule keeps the activity open (`ScoreScreen.ts:4098–4106`).
- **Decision.** A Wait run is practice. It records the notes. It can be evidence for pitch-only skills, at whatever
  standard its conditions meet. It passes nothing, meets no rung's run requirement and masters nothing.
- **Change.** Docs only. The sentences that describe "a criterion/rung that asks no tempo" are corrected to say
  that no rung asks none: `02` Part G (lines 1351–1356, 1420–1421), `05` §2 (111–115) and `rungState.ts`'s module
  note (45–46). The `passTempoPct <= 0` branches in the code stay, since they accept constructed criteria.

### Input: a self-report never counts toward a rung

- **Evidence (observed).** A Clean self-report row meets no standard (`rungState.ts:208`). Its evidence is of the
  class `self-assessed`, which no requirement accepts and which moves no ladder state (`evidence.ts:769–777`;
  `ladder.ts`, "Apart").
- **Consumers of the learner's word.**
  - The sheet stores `passed` and `selfPassed` (`ScoreScreen.ts:4193–4199`) and says "Recorded: Clean — a pass, in
    your own judgement" (`help.ts:222`).
  - The progress row becomes *passed* (`progressStore.ts:292–303`).
  - The lesson badges say "you said you know it" or "you said you can play it" (`LessonScreen.ts:274`, :422).
  - The Library badge says "known" (`LibraryScreen.ts:125`).
  - Repertoire retention excludes it (`learnedPieces`, `progressStore.ts:1454–1462`).
  - The session outcome is `unknown` (`sessionRun.ts:496`), so Today shows *played*.
  - **Progress counts it in "N passed" and lists it under "Pieces you have passed, not yet projects"**
    (`ProgressScreen.ts:334–338`, :446–451). This is the one consumer that reads the status without `selfPassed`.
- **Decision.** The input holds. The learner's word (a Clean self-report, *I already know this*, a paper Clean) is
  recorded and shown as theirs. It never meets a requirement and never moves a skill. A word given at rung level
  moves the plan on (*I already know this*, *Mark done*, `LessonScreen.ts:882–934`). A run nothing listened to tells
  the learner how to be marked (`help.ts:239`).
- **Change.** Progress reads `selfPassed` (lane 1).

### Input: a piece's run writes no skill evidence; and L102

- **Evidence.**
  - The runtime acts on declared skills for sight-reading rows only (`skillActivation.ts:41`, read at
    `ScoreScreen.ts:4045`). *Observed:* a notated piece and a generated-family item both get no skills in force.
  - Activation is only half of it. In the main checkout's built catalogue (2,092 items), 821 items carry a
    `provenance.composition`, and none of those 821 declares `targetSkills`. 233 items do declare them: the 9
    reading rows and 224 generated-family items. The evidence function never looks past declared skills
    (`evidence.ts:13–15`).
  - So a piece's run cannot become skill evidence by switching activation on.
- **Mechanism.** Two absences, independent of each other: activation, and declaration.
- **Who is affected.**
  - The rung requirements that read skills: 6 `skill` and 2 `reads`, on 7 rungs. All 8 can be met through a
    reading row the rung lists that is in force (built content, mechanically).
  - Progress's "No skill the app measures has moved" (`help.ts:817`) is true.
  - The Skills screen moves only through sight-reading.
- **Decision on the piece.** A piece's run is evidence of the piece: its rung's run requirement, its progress row,
  and its repertoire retention. It is evidence of no skill.
  - Deciding which skills a piece is evidence of is exactly the application-target question R23 found unanswered.
    Inferring the targets from the piece's measured demands is what the evidence function refuses (`evidence.ts:13–15`:
    the notation's contents are opportunity, not a claim).
  - A practised piece could not reach most full standards anyway. Of the 15 skills with an observable, 13 list
    `unseen` in their full standard, and `unseen` is a phrase's field. Position-shift and hands-together list no
    first reading.
- **What would change it: one missing truth, an application target the piece declares.** R23 found none. X46 found
  the session story does not need one, and where it is stored follows a decision (`f860c76e.md` §3).
  - L23's continuity would be the first skill whose evidence naturally comes from a practised piece.
- **Reported as a P1 limitation** (`operating-procedure.md` §6): the app's skill model is fed by the reading rows
  alone. Pieces, technique and generated drills are learned only as completions at a standard.
- **L102: whether the generated families' skills switch on.** The row's stated precondition has been met since G2:
  a new seed of one family is never transfer (`transferPolicy.ts:189–191`). No missing fact blocks it either. The
  vocabulary's standards already say what a run of practised material can show:
  - every practice standard except sight-reading's asks for no `unseen`, so a practised drill can reach *familiar*;
  - position-shift's and hands-together's full standards ask for no first reading, so two days of a practised
    position-shift or coordination drill could read as *proficient*.
- **What switching on would change for a learner.**
  - Five of the six `skill` requirements could be met by drills: interval-reading on 1.5, subdivision on 2.2,
    position-shift on 2.5, and 6/8 and syncopation on 4.5. The sixth, 1.3's bass clef, is declared by no family.
  - Today's skill slot could offer drills.
  - The lesson's sentence "from what your reads show" (`help.ts:978`) would become false.
  - The two `reads` requirements are unaffected: no family declares sight-reading.
- **Why it is not switched on here.** The rungs tell the learner their skill requirements are shown by reads. Which
  runs a rung's requirement asks for is a curriculum and product choice, not an evidence entailment. It is set out
  under *Choices*.
- **The candidate `rhythm.pulse-and-note-values` is not added.** No requirement or reader names it. The vocabulary
  adds a skill "when a reader needs it and its observable exists" (reviewer decision 2).

### L58: a note name on the screen

- **Evidence (observed).** `evidenceFor` on a Wait first reading (`unseen: true`) with `keys: {guide: 'off',
  names: true}` returns measured interval-reading evidence at the **full** standard.
- **Mechanism.** The vocabulary's conditions are `keep-tempo`, `unseen`, `guide-off` and `both-hands`
  (`evidence.ts:282–287`); none of them is about names. The run does record the fact:
  `names: (ribbon && guide on) || (showNoteNames && mode === 'wait')` (`ScoreScreen.ts:5155–5164`; `db.ts:155–162`).
  So with the guide off, the only way names reach the screen is Wait plus *Name the note I am waiting for*
  (`SettingsScreen.ts:313`).
- **Which skills.** 9 of the 16 skills list `guide-off` in their full standard. Five of those are reachable in Wait,
  because their full standard has no `keep-tempo`: bass-clef, ledger-lines, interval-reading, key-signature and
  accidentals.
- **Consumers.** No rung requirement reads those five skills' full standard: all six skill requirements ask for
  *familiar*, and both `reads` requirements are on sight-reading, which needs Keep tempo. What is affected is the
  ladder above *familiar*, which drives the Skills screen, Progress and the transfer offer (`establishedOn` needs
  *proficient*).
- **Decision.** As ruled: a read with note names on screen counts as supported practice and never as unaided
  reading.
- **Smallest change.** A condition `names-off`, recorded from `SessionRow.keys.names === false`, joins every full
  standard that lists `guide-off` (those 9 skills). It goes into `CONDITION_MET` and `CONDITION_CITES`, the
  `ConditionId` union and `skills.schema.json`.
  - In Keep tempo, names are never on when the guide is off (the formula above). So this changes nothing there
    today, and it guards any naming path added later.
  - `EVIDENCE_DEFINITIONS` goes from 5 to 6, because the standards changed. The evidence job re-derives stored
    phrase runs from their recorded `keys`, so old named Wait readings drop to the practice standard.

### L57: the evidence numbers live with the skill

- **Evidence (observed).** `SUPPORT_SHARE === DEFAULT_MASTERY.passAccuracy` (`ladder.ts:110`). None of the 16
  skills has a support, threshold, precision or share field; the fields present are display, id, kind, note,
  observable, opportunity, sentence, standards, transfer and unobserved.
- **Copies of the share.** `transferPolicy.supportedAtFull` keeps its own copy (`transferPolicy.ts:107–110`, "a test
  holds the two equal"). The share is also read at `demandReadings.ts:144–145` and `session.ts:2399`. The timing
  precision is a code table (`evidence.ts:326–339`).
- **Mechanism.** The skill support share is coupled to Part G's default pass accuracy and applied when evidence is
  read, so it is stamped nowhere. Changing that pass constant would silently re-grade every skill's history.
- **Decision.** The ruling applies: these numbers decide what counts as evidence. Lane 2 moves them:
  - one vocabulary-level support share, which a skill may override when it needs its own;
  - the precision on each timing skill, with the default for every-step skills.
  - All four readers read them from the vocabulary.
- **Values do not change**, so no learner meets a difference. It travels with L58 because both change the
  schema of `skills.json`.

### L105: the coping gate and recent misses

- **Evidence.** `uncoped` reads only the learner's ladder state for the demand's `copedWithBy` skill
  (`eligibilityCore.ts:182–188`, module note :13–18). Recent misses are not read.
- **Decision.** This is the ruled behaviour: the gate answers from what was taught and what the learner is ready
  for. Whether this is the right moment belongs to the composer, which today means the reading-choice failures
  (L74/L75) in CL08. The ruling assigns it there, and `43045ffb.md` keeps routing out of CL11. The ladder's own
  down-rule (two full-standard attempts against, in a row) is unchanged, and no new evidence reopens it.
- **Status.** Closes for CL11.

### G80: another cut or arrangement

- **The gap exists.** The relationship carries `composition: {key, playedAs}` and no arrangement or section fact
  (`transfer.ts:79`, :222–229). A composition already played reads as `unknown` and earns no credit (G2a,
  `transferPolicy.ts:142–149`, :193–194).
- **Unreachable.** Relationships are written only onto measured evidence records (`progressStore.ts:375–379`).
  Measured records exist only for items with skills in force: the 9 reading rows, none of which carries a
  composition. That holds in `catalog.static.json` and in the built catalogue.
- **Decision.** Parked. The ruling ("sometimes, by relationship and material difference, never merely because the
  identity differs") stays as the rule for when a notated item earns evidence. At that point the relationship's
  owner adds the arrangement and section facts before any credit is given.

### G71: drill and lab playbacks as hearings

- **The gap exists.** Nothing records drill or lab playback as an encounter. A search of `app/src` without the
  tests finds `encounterStore` imported only by `ScoreScreen`, `SettingsScreen`, `TodayScreen`, `sessionRunner`,
  `projectSheet` and `backup`.
- **Nothing needs it.** A drill made when it opens has no fixed material (`DrillScreen.ts:4074–4076`). The lab
  "judges nothing and records nothing" (`LabScreen.ts:24`). Every consumer of encounters asks about the identity
  of catalogue material: `firstContact`, `familiarityIn`, `contactIn`.
- **A lab jam turned into an import.** Its first run on the Score screen claims first contact although the learner
  heard the jam. No verdict reads that: an import declares no skills, so it has no evidence, and `firstContact`
  "refuses nothing". CL05, which the re-check waited on, has closed (`surviving-work-2026-10-02.md` §1).
- **Decision.** Retire the row, as the ruling directs when no consumer needs a "prompt heard" fact.

### L23: continuity

- **Evidence.**
  - No skill measures continuity: `reading-ahead` is `observable: none`.
  - The engine stores no continuity measure (`05` "What a run records": "continuity … has no measure yet").
  - The built catalogue has 67 drill kinds. None matches keep, contin, recover or flow.
- **Decision.** Parked as a future capability, P2, with the ruling's shape kept for when it is built: measured from
  stops, restarts and hesitation, apart from pitch and timing, and never an inferred construct. It would need a new
  observation field (Wait stores no per-step time), and that has to wait for a reader that needs it. It is the
  natural first skill a practised piece could honestly evidence (see the piece input above).

### R23's question (2): what a song run establishes when its purpose cannot be measured

- **Holds.** A song run measured at the rung's standard establishes one thing: a run of one of the rung's songs at
  that standard. It counts toward the rung's run requirement, the song's progress row and repertoire retention.
  - It is not concept evidence: a measured demand is opportunity, not application (`f860c76e.md`).
  - It is not skill evidence: pieces declare none.
- **The other cases.** A run nothing heard is not recorded unless the learner answers. A self-report is the
  learner's word. An unknown purpose is described in the requirement's own words.
- **Every surface traced says exactly this:** the lesson page's "One song from this page at 90 % of the notes, in
  Keep tempo at …" (`help.ts:965–971`), Today's "This lesson asks for it" (X46), and the sheet. Lesson prose was not
  read.
- **No change.**

### Found here: a microphone pass

- **Provenance.** Introduced by X46: Today's mark now reads `passed-full` (`sessionRunner.ts:290–293`). The rule
  it reads has been in place since X1.
- **Evidence (observed).** A stored Keep tempo row at 95 % with `accuracyEstimated: true` meets the standard.
  `scoreOutcome` returns `unknown` for the same run, because of the estimated clause at `sessionRun.ts:497`, and
  `cameTo` for that outcome is `played`. X46's practice rule does not apply, since the tempo can count. So the
  activity completes as `unknown`.
- **Mechanism.** `rungState`, the ladder, `recordRun` and the sheet's heading all count an estimated pass. Only
  `scoreOutcome` does not. X46's design note says the sheet, the runner and `rungState` "agree on what counts"; for
  this input they do not.
- **Decision.** A microphone run counts exactly as a MIDI run does, with its estimate labelled (`05` §11.4). That
  is the app's existing rule at every reader of evidence. Today's mark joins them:
  - an estimated measured pass is `passed-full`;
  - an estimated failure keeps the session's caution (`unknown`, no *Try again* insistence). That is the session's
    choice about how to adapt, not a question of what counts.
- **Open: no one in this process can decide this.** Whether the microphone's estimate is good enough on a real
  acoustic piano to count at all is a fact about the detector. No one here can hear a run. The decision above
  aligns the consumers on the rule already in force and does not certify the detector.

### Found here: Progress counts the learner's word as passed

- **Provenance.** It existed before the base; its origin was not bisected, which would change neither the owner nor
  the fix.
- **Mechanism.** See the self-report input: one consumer reads `status` without `selfPassed`.
- **Decision.** Progress's "N passed" counts measured passes only. A piece the learner said they can play is shown
  in the lesson badge's own words, "you said you can play it", or left off the "passed" list.

## The contract

Each kind of run, what it records, and what it can count toward. Every consumer reads it the same way.

1. **Every judged run records what it measured** (C1, unchanged), with the conditions it was played under. A channel
   it did not measure is marked as not measured.
2. **Accuracy is the written notes played right, with nothing extra.** In Wait the unit is the step, and a wrong key
   makes its step unclean. In Keep tempo the unit is the note: a wrong key costs a note, and a right note at the
   wrong time costs once. A row's definitions stamp says which rule it was judged under.
3. **A run counts toward a rung's run requirement** only when the rung judged it, it was measured (heard, not
   rhythm-only, not a self-report, not a phrase already met), it met the rung's accuracy, and it was in Keep tempo at
   the rung's tempo. Every rung asks for a tempo, so a Wait run never counts. A microphone run counts, labelled
   estimated.
4. **A run is evidence of a skill** only through a skill its material declares and that is in force, under the
   skill's own standard. The practice standard lists its own conditions and may accept supported playing: names
   shown, or a phrase heard or repeated where `unseen` is not listed. The full standard is the independent one: a first
   reading and, for the skills that list `guide-off`, the guide and the names both off. The numbers that decide
   support live with the skill's definition.
5. **What earns skill evidence today is the reading rows.** A piece's run is evidence of the piece. A generated
   drill's run is evidence of its completion. This changes only through a declared application target (pieces) or
   the activation choice (generated drills).
6. **The learner's word** (self-report, *I already know this*, *Mark done*, a paper Clean) is recorded and shown as
   theirs. It never meets a requirement or moves a skill. A word at rung level may move the plan on.
7. **Transfer** needs a full-standard first contact on material measurably different on the skill's own dimensions.
   Another cut of a composition already played is `unknown`.
8. **Contact and familiarity** come only from identifiable material at a meaningful scope. A drill's prompt and a lab
   jam are not hearings.
9. **Eligibility** answers from what was taught, what the learner is ready for, and the ladder's state. Recent misses
   inform the composer's choice of when, never the gate.

## The build

| Lane | File | Change | Must fail now, pass after |
|---|---|---|---|
| 1 | `app/src/engine/PracticeEngine.ts` | Keep tempo: a strike of a pitch a step in reach asks for, outside its window, is not a wrong key (at most one per missed note) | a D played a quarter beat late on four notes: `wrongNotesTotal` 0, accuracy ¾ (today `wrongNotesTotal` 1, accuracy ¾); a second late strike of the same D is a wrong key |
| 1 | `app/src/engine/Scoring.ts` | Keep tempo accuracy net of wrong keys, floored at 0 | a stray key with every note: accuracy 0, no pass (today 1, passed); one stray key among ten notes in time: 90 % in Keep tempo, matching Wait's 90 % for the same playing |
| 1 | `app/src/data/db.ts`, `app/src/evidence/measurement.ts` | `OBSERVATION_DEFINITIONS` 2, known set {1, 2}; under 2, a step with a wrong key against it is not right on pitch | a definitions-2 Keep tempo step with a wrong key: pitch not right (today right). Guard, red under neither: a definitions-1 row reads exactly as before |
| 1 | `app/src/data/sessionRun.ts` | `scoreOutcome`: an estimated measured pass is `passed-full`; an estimated failure stays `unknown` | estimated pass gives `passed-full` and Today's row ✓ done (today `unknown`, played) |
| 1 | `app/src/ui/screens/ProgressScreen.ts` | "passed" and the passed list read `selfPassed` | a self-passed row is not counted as passed (today counted) |
| 1 | `docs/02-curriculum.md` Part G, `docs/05-score-follow-engine.md` §2–§3, `app/src/evidence/rungState.ts` module note | the Wait sentence (no rung asks no tempo); Keep tempo accuracy; Clean as the learner's word | — (specs follow the code) |
| 2 | `content/curriculum/vocabulary/skills.json`, `skills.schema.json`, `app/src/demands/vocabulary.ts` | condition `names-off` on the 9 full standards that list `guide-off`; the support share and the timing precision as vocabulary data (values unchanged) | a Wait first reading with names on and the guide off is practice, not full (today full); a constructed vocabulary with a 0.95 share is read at 0.95 by the ladder, `supportedAtFull` and `demandReadings` (today 0.9) |
| 2 | `app/src/evidence/evidence.ts`, `ladder.ts`, `transferPolicy.ts`, `demandReadings.ts`, `app/src/curriculum/session.ts` (:2399) | `CONDITION_MET`/`CITES`; `EVIDENCE_DEFINITIONS` 6; the numbers read from the vocabulary | guard: a Keep tempo first reading, guide off, names off, stays full |
| 2 | `tools/content/validate.py` (and its test), `docs/02-curriculum.md` Part H, `docs/05` §9b | the new condition and fields checked and described | the existing refusal of a standard that names an unknown condition (`validate.py:1363–1375`) accepts `names-off` once it is listed |

**Tests that assert the old behaviour.** These are replaced in the same change (class: replace, `backlog` area 11),
not deleted silently.

- **Scope of the search.** A regex scan of the 3,842 `it`/`test` blocks in `app/tests/unit`, looking for an
  accuracy assertion next to a nonzero wrong count. Browser specs were not searched; the builder searches them for a
  Keep tempo accuracy or wrong count printed after a wrong key.
- **One block found:** `engineTempo.test.ts` "200 ms late with a 150 ms tolerance: all missed, and the notes are
  wrong" (:159–174). It asserts `wrongNotesTotal` 4 for four late right notes. The decision reverses that (they
  become 0); its accuracy of 0 stands.
- **One near miss:** `engineEarlyNote.test.ts` "played early and again on time" asserts the counts but not the
  accuracy. Under the decision its accuracy becomes ¾, and its wrong count of 1 stands.

**Sizing.** Each lane fits one build lane. Lane 2 changes content, so it brings the content itemisation
(`operating-procedure.md` §12) and one recompute under evidence definitions 6. Lane 1 changes the meaning of no
stored row: definitions-1 rows read as before, and only its new rows carry definitions 2.

## Where the brief and the record were wrong

1. **The brief's L10 premise.** It said a pass should mean the same in Wait and Keep tempo, with two accuracies
   under one threshold. In fact Wait passes nothing (0 of 109 rungs at either Settings bound), and its card says so.
   So the decision is what a wrong key costs in Keep tempo, not a threshold per mode.
2. **The brief's hypothesis that the rest follow from L10.** Refuted: the other rows have their own mechanisms.
3. **X46's input** ("counts only for a rung asking no tempo"). The set of such rungs is empty. The same sentence
   appears in Part G, `05` §2 and `rungState`'s note, and lane 1 corrects all three.
4. **X46's design note** ("the three agree on what counts"). Not for a microphone pass.
5. **A naive "net of wrong notes" rule** would charge a late note twice, because the engine records it as a miss and
   a wrong note. The decision includes that case.
6. **The brief's expected ownership.** The truth also lives in `PracticeEngine.ts`, `sessionRun.ts`,
   `ScoreScreen.ts` (`keysShown`), `progressStore.ts`, `ProgressScreen.ts`, `ladder.ts`, `transferPolicy.ts` and
   `demandReadings.ts`.
7. **G71 "waits on CL05".** CL05 has closed, so G71 can be decided now.
8. **L102's blocker** ("wait until the ladder reads role and family"). G2's new-seed rule removed it. What remains
   is not a missing fact but a choice about what four rungs ask (five skill requirements).

## Choices and open questions

- **Choice (owner or reviewer: curriculum and pedagogy, L102): should runs of practised generated drills be skill
  evidence?**
  - **Keep (recommended).** The Skills screen moves only from sight-reading. Drills count toward their rung's run
    requirements. Progress still says no skill moved after drill practice. The rung sentences stay true.
  - **Switch on.**
    - Practising 2.2's eighths drills in Keep tempo can make Subdivision *familiar* and meet 2.2's skill requirement
      without a sight-read.
    - Two days of a practised coordination or position-shift drill can read as *proficient* on the Skills screen.
    - Today may offer drills for five skill requirements on four rungs (1.5, 2.2, 2.5 and 4.5).
    - The lesson's sentence "from what your reads show" (`help.ts:978`) must be rewritten for each of those rungs.
  - **Why I recommend keeping.** The second option is consistent with the vocabulary's standards. But it changes
    what four rungs ask of the learner and what Today offers, and the rungs say "reads". If it is wanted, it belongs
    to a curriculum lane that decides rung by rung and rewrites those sentences, not to a flip of the activation
    boundary.
- **Open: no one in this process can decide this.** Whether the microphone's estimate is good enough on a real
  piano to count.
- **Unverified as teaching.** Whether 90 % net of wrong keys is the right bar is a teaching standard. The bar is the
  rung's authored number and is unchanged here. The decision changes only what the number counts.

## Learner-facing text the build changes

| Where | Before | After | Why |
|---|---|---|---|
| The sheet's *Accuracy* (Keep tempo) | right notes in time, of the written | the same, less one note per wrong key | L10 |
| The sheet's *Wrong notes* (Keep tempo) | counts a right note played late | counts wrong keys only | L10: late is charged once, as the miss |
| Today's row for a microphone pass | *played* | *✓ done* | the run counted on the lesson page |
| Progress's totals line | "N passed", counting the learner's word | measured passes only | the learner's word is shown as theirs |
| Progress's "Pieces you have passed, not yet projects" | lists self-passed pieces | measured passes; a self-passed piece, if listed, reads "you said you can play it" | as above |
| Optional: `MODE_HELP.tempo.counts` (`help.ts:118`) | "A pass needs both the accuracy and the share of the written tempo…" | adds what the accuracy is: the notes played right in time, a wrong key costing what a missed note costs | the card is where what counts is told before the run (X46 point 2); the lane's reviewer decides |
