# One story for a session item (X46)

The governing ruling is `docs/review/responses/9e14839e.md` §2, with `responses/43045ffb.md` (the boundary is
semantic; the item's traced role decides the flow), `responses/f860c76e.md` §3–§5 (the song run's purpose)
and `responses/911f8c82-correction-1.md` ("Session-item consequence": each surface shows what its moment
needs). The brief is `docs/prompts/tasks/X46-one-story-for-a-session-item.md`. Line numbers are at the
lane's tree (base `23f5c53d` plus this change) and move with the code.

Nothing here was heard. No one in this process can hear the music, and nothing below depends on it.

## Judgement: Outcome A

Every fact the six points need is already held, under some read, by stored or session truth. The walk's
contradictions come from three places, none of them a missing fact:

1. **Default routing.** The session opens a rung-judged Score activity with no mode or tempo in its route
   (`ui/sessionRunner.ts:85`), so the Score screen opens in the learner's Settings defaults, Wait for me at
   70 % (`data/settingsStore.ts:140`, `:144`), while the same rung judges the run at 90 % in Keep tempo at
   80 % (`curriculum/selectors.ts:86` `masteryCriteriaFor`, rung 2.1's `mastery`). Finding 1.
2. **A consumer that reads half the record.** The session record keeps both the activity's state and its
   run's outcome (`data/sessionRun.ts:45`, `:91`, `:109`). Today's running card, its finish line and a card
   composed after the session read the state alone (`TodayScreen.ts`, `activityRow`, `finishLine`,
   `doneToday`), so a run that counted nothing wore the ✓ of a pass. Finding 6.
3. **A frozen sentence read after the moment it was for.** The running card prints the composition's words
   (`RunActivity.reason`, written once at *Start session*, `TodayScreen.ts:655`) under every row, including
   rows whose run has since counted. "This lesson asks for it — not counted yet" was true when written and
   false once the piece passed. Finding 3's Today half.
4. **A completion the session took before the learner chose.** A Wait run of a rung-judged item is stored
   with outcome `unknown` (`sessionRun.ts:484` `scoreOutcome`), and the runner completes an activity on any
   stored run (`sessionRun.ts:418–440`). The cursor moved on, the sheet's one filled box became the next item,
   and every later run on the same screen — the Keep tempo pass among them — was refused as another
   activity's (`stale-token`), so the session record kept `unknown` for an item that had counted. Findings 6
   and 7.

So the deliverable is the reconciliation, and it is small: no evidence meaning changes (nothing in
`evidence/`, `rungState`, `progressStore` or `Scoring`'s pass changes what counts), no new persistent field,
no new enum, no new session architecture. It is built (below), each change with a test that fails without it.

## Hypothesis and refuting test, as run

The hypothesis held. The refuting test — find a fact one point needs that no field holds — was run against
each candidate the brief named and the two the trace added:

| Candidate fact | Where it is held | Refutes? |
| --- | --- | --- |
| "This run's criterion was reachable from its opening configuration" | Computable at open from the judging rung (`?rung=`, `masteryCriteriaFor`) and the opening mode and tempo; after the run, from the stored row (`mode`, `tempoPct`, `lessonId`) by the same rule `rungState.meetsStandard` uses (`rungState.ts:225`) | No |
| "This activity's outcome was evidence-counted, not merely completed" | `RunActivity.result.outcome === 'passed-full'` (the session copy) and the stored row under `meetsStandard` (the evidence); the two disagreed only because of finding 6/7's refusal, which the build removes | No |
| The item's role (criterion attempt or preparation) | The composition's claim: an `asked` claim is "the rung's next unmet requirement's item" (`session.ts:1285` `fresh`, `:921` `askedClaim`; the warm-up likewise, `:1239`); nothing composes preparation. Recorded in the run as `slot.claim.kind` and `route.rung` | No: derivable, and single-valued today |
| "Requirement advanced" and "mastery changed" | `rungState` read live (`RequirementReading.have/holds`, `rungState.ts:70`); the progress row's `status`/`masteredOn` (`progressStore.ts:298–304`); the ladder for skills | No |
| A song run's application target (R23) | Held nowhere — but the six points do not need it (below) | No |

## The trace: what each consumer reads

| Consumer | Reads | Derives | Point |
| --- | --- | --- | --- |
| **Today, running card** — badge (`TodayScreen.ts:801` `activityRow`) | `RunActivity.state` only, before this change | *✓ done* for any `completed` (now `cameTo`, `sessionRunner.ts:290`: *done* only for `passed-full`) | 4 |
| **Today, running card** — reason line (`TodayScreen.ts:835`) | `RunActivity.reason`, frozen at *Start session* (`TodayScreen.ts:655`, the `SessionSlot.reason` the composer made from its claim, `help.ts:1401` `askedWords`) | the composition's words under every row, behind or ahead (now `showsReason`, `sessionRunner.ts:310`: rows ahead only) | 1, 6 |
| **Today, finish line** (`TodayScreen.ts:902`) and **a card composed after the session** (`doneToday`, `:534`) | `RunActivity.state` only, before this change | *Warm-up done*, *done today* for any completion (now `cameTo`) | 4, 6 |
| **Today, card composed when no session runs** | a fresh `buildSession` over live `rungState` | the claim's words now — live, not frozen | 1, 6 |
| **The transition on a finished activity's sheet** (`sessionRunner.ts:254` `transitionView`) | the session record: current, state, `result.outcome === 'failed'` | *Next: … Start* after a completion; *Try again* after a measured failure; *Start* as moving on while the activity is still current | 5 |
| **The completion sheet** — heading and Tempo line (`ScoreScreen.ts:4219–4232`) | `evaluateOutcome(score, criteria)` (`Scoring.ts:485`), with `criteria = masteryCriteriaFor(rung, Settings pair)` (now one function, `judgingCriteria`, `ScoreScreen.ts:3494`) | *Passed* / *Notes ready* / *Run finished*; the Wait line | 2, 4 |
| **The completion sheet** — actions (`ScoreScreen.ts:4410–4448`) | the screen's own `mode` and `tempoPct` | *Again*, *Slower*, *Faster* restart in the same mode; nothing reached Keep tempo at the standard (now *Keep tempo at 80 %*, first, where the run's own settings could not count) | 5 |
| **The lesson page**, *What the app counts* (`LessonScreen.ts:785` `drawCounts`) | `rungState` live (`rungState.ts:289`), `masteryCriteriaFor` | *1 of 2*, "(counted: Ode to Joy)", "(not yet)" | 2, 6 |
| **Progress**, skills moved (`ProgressScreen.ts:383`; `skillsStore.ts:160` `skillMoves`) | skill evidence records on the stored rows, read on the ladder over 28 days | moves of skills; a piece's run carries no skill evidence (below) | 4, 6 |
| **Progress**, counts and *Pieces you have passed* (`ProgressScreen.ts:327`, `:409`) | progress rows' `status` | *1 started · 1 passed · 0 mastered*; Ode to Joy listed | 4, 6 |
| **The next day's composer** (`session.ts:1410` `review`, `:1285` `fresh`) | `rungState` (the `asked` claims), the learned pieces and their last-played dates against `REPERTOIRE_WINDOW_DAYS` (`:426`), and the fallback ladder that orders counted items first for review (`:1412`) | the slots and their words | 1, 6 |

**Two `Outcome` types, reconciled by one function.** `engine/Scoring.ts:413`'s `Outcome` is the run's verdict
(`passed`, `masterEligible`, `tempoMeasured`) against the judging criteria; `data/sessionRun.ts:91`'s is the
session's copy of it, made by one function, `scoreOutcome` (`sessionRun.ts:484`): `passed-full` only for a
measured pass (accuracy a number, not estimated, tempo measured, not a self-report or rhythm run), `failed`
for a measured run that did not pass, `unknown` for anything else. Nothing picks "whichever is in scope": the
sheet reads the first, the runner and Today the second, and `rungState` re-judges the stored row by the same
criteria function (`masteryCriteriaFor`, `meetsStandard`), so the three agree on what counts. They disagreed
in the walk only through the refused completion (finding 7's mechanism), which the build removes.

## The six points

1. **Purpose / why now.** Held: the composer's claim (`SlotClaim`, `session.ts:454`), said by `slotReason`
   and kept in the run as `reason`, `slot.claim` and `route.rung`. Shown *before* the item on Today's row and
   on the transition's *Next:* line — the right moments. After the item, the frozen line is stale; it now
   gives way to the mark (point 6).
2. **What can count.** Held: the judging rung's criteria (`masteryCriteriaFor`), the mode semantics
   (`tempoCanCount`, now the one definition `evaluateOutcome` passes by, `Scoring.ts:452`) and the
   requirement (`rungState.read`). Was said before the run only as the Keep tempo card's "the share of the
   written tempo set in Settings", false wherever the rung states its own (40 of the 109 rungs in the
   content copied from the main checkout ask a tempo other than 80 %); and after a failed run not at all.
   Now: the card says the lesson's numbers judge a lesson's run; a sheet whose run missed its standard says
   the standard (*To pass*), in *What the app counts*' words (`keepTempoAt`, one function for both).
3. **Reachable opening state.** The fact was held; the routing ignored it. **The item's role is a
   criterion attempt** (`responses/43045ffb.md` §4): the composer puts it on the card *because* the rung's
   requirement can count it (`asked`, "This lesson asks for it — not counted yet"), and nothing in the
   composer, the run record or the route marks any item as preparation; the Wait-at-70 % opening was not a
   session decision but the Settings default every Score screen opens in. So the opening follows the role:
   a run Today chose for its rung (`?rung=`) opens in Keep tempo at the rung's tempo or faster
   (`openingThatCounts`, `Scoring.ts:462`; applied at `ScoreScreen.ts:5575`), where the defaults could not
   meet the standard. Wait for me stays on the bar, one tap away; a Rhythm only preference left on from
   another screen is off for this run (a rhythm run never counts as playing the piece), and stays the
   learner’s everywhere else.
   *The alternative considered, preparation framing* — keep the Wait opening, say before the run that it
   does not count, and make the criterion attempt the continuation — was not taken: it needs a role the
   composer does not hold (an invented one, for every first-contact item), and a *before* sentence on the
   Score screen at rest, which is the whole-Score chrome U122/U122a own and this lane may not touch. Whether
   a learner's first meeting with a new piece *should* open at the lesson's counting tempo rather than in
   Wait — which the app's own Wait card calls "the mode for the first time you meet a piece" — is a teaching
   judgement; the opening here follows the item's composed role, and a composer-level preparation role would
   be the product decision that changes it.
4. **Outcome.** Held: `ActivityState` (completed/played/skipped), `result.outcome` (counted or not),
   `rungState` (requirement advanced), the progress row's status and the ladder (mastery changed). The card
   read only the first. Now *✓ done* means the run counted (`passed-full`); *played* means a run completed it
   that counted nothing, or it was tried and left; *skipped*, never tried. A run whose own settings could not
   count (Wait, rhythm only) no longer completes an activity a rung judges (`ScoreScreen.ts:4098–4105`): the
   activity stays current, *Start* moves on from it explicitly (said *played*), and a run that counts on the
   same screen completes it. "Requirement advanced" stays the lesson page's to show and "mastery changed"
   the sheet's heading and Progress's: each surface its own moment (`911f8c82-correction-1.md`).
5. **Next action.** The sheet said "to pass, play it in Keep tempo" and offered *Again* (the same Wait run),
   *Slower*, *Faster*. Now, where the run's own mode or tempo could not count, the first control is **Keep
   tempo at 80 %**, which starts a fresh Keep tempo run at the standard, nothing stamped as changed
   (`ScoreScreen.ts:4422`); where only the accuracy fell short, *Again* is the retry and no second control is
   drawn. In a session, the transition's filled *Start* is still the way on, but the session no longer moves
   on by itself after a run that could not count (point 4), so *Start* is the learner's choice, not a silent
   one. (The filled box stays the transition's: the sheet keeps one filled box, R3.)
6. **Consumer consistency.** After the change every surface reads the same truths: the card's mark and the
   sheet's heading read the same run's verdict (`scoreOutcome` of `evaluateOutcome`), which `rungState`
   re-judges identically for the lesson page; the frozen card no longer asserts a reason after its moment;
   Progress and the next day's composer were already consistent with the stored truth (below).

## The four discriminating findings

| Finding | Mechanism | Discriminating test | Change |
| --- | --- | --- | --- |
| 1 — the defaults make a pass unreachable, the sheet never says why | routing: no mode/tempo in the session's route, so Settings' Wait/70 % on a rung that counts Keep tempo/80 %; the sheet had no line naming the standard | `sessionItemStory.test.ts` "a run Today chose for rung 2.1 opens in Keep tempo at 80 %" and "a clean Keep tempo run at 70 %: Run finished, and the line names the 80 %" — red with the opening removed and with *To pass* removed | `openingThatCounts` at the screen's opening; *To pass*; the Keep tempo card's sentence |
| 3 — one pass, four stories | Today: the frozen `reason`; Progress and the next day: consistent with the truth (below); the lesson page: live and right | `todaySessionRun.test.ts` "a row whose run counted reads ✓ done and no longer 'not counted yet'" — red with `showsReason` returning true | `showsReason` |
| 6 — the card marks as done work that counted for nothing | Today read `state` and ignored `result.outcome`; a Wait run completed the activity | `todaySessionRun.test.ts` "what each row came to …" and "a run that counted nothing is played on the finish line …" — red with `cameTo` answering *done* for every completion | `cameTo`; the screen's completion rule |
| 7 — the retry path fights the learner | no control on the sheet did what its sentence said; the session completed the activity on the Wait run, so the pass that followed was refused | `sessionItemStory.test.ts` "the control starts a fresh Keep tempo run at the standard" and "a Wait run on an activity Today composed for its rung does not complete it" — red with the control removed and with the completion rule removed | *Keep tempo at 80 %*; the completion rule |

**Why the exercise came back the next day as *New*.** *New* is the slot's name (`SLOT_LABELS.new`), not the
item's: the `new` slot takes the rung's next unmet requirement's item, and the exercise requirement was still
unmet because its only run was in Wait (`rungState.meetsStandard` counts a Wait run only for a rung that asks
no tempo, `rungState.ts:235`). *started* is its progress row's status, which any recorded run of a new row
sets (`progressStore.ts:304`). Both true; neither changed here.

## Progress: structurally excluded, not a time window and not a sentence gap

The brief's acceptance offered two readings of "No skill the app measures has moved": a time-window rule
(mastery's two days) or a sentence that does not yet account for a pass. Neither is the mechanism. *Moved* is
computed from skill evidence records on the stored rows (`skillsStore.ts:160`), and a run writes skill
evidence only for an item whose declared skills are in force — as shipped, the sight-reading rows alone
(`skillActivation.ts:41`, read by `ScoreScreen.ts:4045` `skillsInForce`). A piece's pass therefore never moves
a skill, today or after any number of days; the sentence is literally true. Progress does record the pass
(*1 passed*, and *Pieces you have passed, not yet projects*), below the fold. Nothing in Progress contradicts
the stored truth, so nothing is changed there. Whether a piece's run should become skill evidence is the
evidence contract — **named for CL11**, not designed here. Whether Progress should lead with the pass rather
than the week's minutes is Progress's own information design (SG08/U64's family), not this contract.

## The next day's composer: consistent; the walk's inference about mastery was wrong

The review row held yesterday's pass under "Nothing due for review — more from this lesson". Mechanism: the
review's claims found nothing due (a learned piece returns after `REPERTOIRE_WINDOW_DAYS`, `session.ts:426`;
skill retention reads only the reading rows' skills), so the fallback ladder's rung step offered the rung's
material with counted items first (`session.ts:1412`) and said exactly that. True under its rules, and it reads
the same evidence the lesson page reads. "Nothing due" and "not counted yet" were never both said of the same
item on the same day by the composer: the contradiction was the frozen Today line of day one.

The walk inferred that the second day's run "is the one that would master it". It would not: the pass was at
80 % of the written tempo, and the master standard is 97 % at 100 % (`Scoring.ts:406–411`, read by
`progressStore.ts:273`), so the first day's run was not master-eligible. That inference does not hold, and no
line is owed for it.

## A song-run item's purpose (R23)

When a composed item is a rung's song run, the fact that tells the learner and the chooser why it is here is
the `asked` claim: the rung's `runs` requirement from its songs, count one, and which of them have counted.
Its words ("This lesson asks for it — not counted yet") are honest for any song in the pool, because the
requirement *is* "one of these songs at the rung's standard": it names no application, so no song is the
wrong one to satisfy it. The six points need no explicit application target for an honest story: purpose
(the lesson asks for a song run), what can count (that song, at the rung's numbers), opening, outcome and
next action are all stated from existing truth. What the repository lacks — which application the song run
is for — is a question about *which* song best serves the rung (the chooser's quality), not about whether
the story told for the chosen one is true. So R23's count-to-quality conversion stays parked; no field was
added; authored order remains order. If a later decision gives a song run a stated purpose, the claim is
where it would be said.

## Finding 10, held: two mechanisms, neither this contract's

- **"This lesson asks for it — finished, nothing left undone" on an untouched checklist.** `askedWords`'
  `done` branch (`help.ts:1420–1421`; and `measure`, "its … measure met") states the requirement's predicate
  as a past participle and, unlike the `runs` branch, appends no counted status. It is composed fresh, at
  Stage 0, with nothing played. It shares the function that writes the purpose line (point 1's presentation)
  but not the mechanisms of findings 1, 3, 6 and 7 (routing, the freeze, the collapsed outcome, the early
  completion). A wording defect in two branches; not fixed here, per the brief.
- **A sight-read at L1.5 offered to a Stage-0 learner.** It is not a session item: it is Today's daily read,
  whose row comes from the reader's anchor (`session.ts:2332` `anchorFor`): before any reached rung lists a
  reading row, the easiest reading row stands in (`:2349`), and here that row is level 1.5. No mechanism
  shared with the composer's slots or the session-item contract.

Finding 4 (no intentional stop; the back gesture reopens the previous activity) stays the session lifecycle's
acceptance case. It still reproduces in the re-walk (`17a-back-gesture`).

## The re-walk (360 × 780)

The walk's path, its learner and its driving (the MIDI mock, notes struck on the run's own frames, a
forged `visibilitychange`), on this lane's build, port 5433; pictures under `docs/prompts/runs/X46/walk/360x780/`
with the walk's step names where the moment is the same, the script and config under
`docs/prompts/runs/X46/scripts/`. Observed, from the pictures, the page's words and the session record read
out of IndexedDB at each sheet:

- **Finding 1 — resolved on this path.** The review exercise and the piece both opened in Keep tempo at 80 %
  (`05-score-exercise-open`, `07-piece-open`; the walk's were Wait at 70 %). The Keep tempo card now says the
  lesson's numbers judge the run (`05-score-exercise-card`). The one-criterion failure — a clean Keep tempo
  run at 70 %, reached by *Slower* — is headed *Run finished* with *To pass: 90 % of the notes, in Keep tempo
  at 80 % of the written tempo or faster* and *Keep tempo at 80 %* first (`16-tempo-completion`; the walk's
  had no reason). A Wait run the learner chose: *Notes ready*, *Not judged in Wait for me*, the same *To
  pass* line and control (`06-exercise-summary`).
- **Finding 7 — resolved on this path.** From that Wait sheet, *Keep tempo at 80 %* started a fresh Keep tempo
  run at 80 % (`06c-after-standard`), which passed and completed the activity (`06d`; the record:
  `completed passed-full`). From the 70 % sheet it did the same (`16c`, `16d`). Nothing was stamped
  *Changed*. The transition's filled *Start* still sits above the sheet's control (Questions).
- **Finding 6 — resolved on this path.** After the Wait run the session record kept the exercise current and
  `attempted`, not completed; Today after the session reads *played* for the warm-up left at once and
  *✓ done* only for the two items whose runs counted (`17b-own-back`; the walk's had *✓ done* on the Wait
  exercise).
- **Finding 3 — Today's half resolved; the rest as traced.** No row behind the learner carries the frozen
  line; rows ahead keep theirs (`17b-own-back`; the walk's read "not counted yet" beside *✓ done*). The
  lesson page reads *2 of 2*, both counted (`20b-lesson-what-counts`). Progress is unchanged and still leads
  with minutes and "No skill the app measures has moved" (`18-progress`): true, and Progress's own design.
  The next day's card is 2.2's, because both of 2.1's requirements counted on this path (`21-today-tomorrow`),
  so the walk's day-two review row is not reached here; the composer's mechanism is unchanged and traced above.
- **Finding 4 still reproduces** (`17a-back-gesture`: the back gesture reopened the exercise). Not this lane's.
- **Finding 2 still reproduces** (`07-piece-open`, `08-playing`: the rows at 360 × 780 with chord symbols and
  fingering inside the row above). U110's; this lane touches no rendering.
- **No new contradiction seen.** Pictures looked at: `05-score-exercise-card`, `06-exercise-summary`,
  `07-piece-open`, `08-playing`, `16-tempo-completion`, `17b-own-back`, `18-progress`, `21-today-tomorrow`;
  every other step was read from the page's words, the screen's `data-*` and the session record the script
  logged beside it (`docs/prompts/runs/X46/walk/360x780-log.txt`), not from its picture. Read for
  words and marks, not measured for layout. One walk at one size, driven frame-perfect, as no person plays;
  nothing heard.

## The build

| File | Change | Test |
| --- | --- | --- |
| `app/src/engine/Scoring.ts` | `tempoCanCount` (the one tempo-floor rule; `evaluateOutcome` now calls it) and `openingThatCounts` | `sessionItemStory.test.ts` (the pure rule) |
| `app/src/ui/screens/ScoreScreen.ts` | `judgingCriteria` (one reading for the summary and the opening); the opening of a `?rung=` run (not a sight-read, not a route with a mode, not with nothing listening; Rhythm only off for that run); *To pass*; *Keep tempo at 80 %*; a run its own settings could not count does not complete a rung-judged session activity. No layout, bar or chrome change. | `sessionItemStory.test.ts` (16 cases) |
| `app/src/ui/sessionRunner.ts` | `cameTo`, `showsReason` (pure) | `todaySessionRun.test.ts` |
| `app/src/ui/screens/TodayScreen.ts` | the running card's mark and reason line, the finish line and `doneToday` read `cameTo`/`showsReason` | `todaySessionRun.test.ts` (2 replaced, 3 added) |
| `app/src/ui/help.ts` | `MODE_HELP.tempo.counts`; `SUMMARY_TEXT.waitTempo`, `toPassLabel`, `toPass`, `toTheStandard`; `keepTempoAt`, shared with `requirementWords` (its output unchanged) | `help.test.ts` (the card printed in `04` §5f) |
| `app/tests/e2e/score.run.spec.ts`, `first-day.spec.ts` | the Wait sheet's assertions replaced (class: replace) | the targeted browser run |
| `docs/04-ui-spec.md` | §2's running card and opening; §5's sheet; §5f's Keep tempo card | `help.test.ts` |
| `docs/08-test-map.md` | the session row and the new file | — |

Seven mutants, each removing one change, each turned its test red (`docs/prompts/runs/X46/mutants.txt`).

## Learner-facing text changed

| Where | Before | After | Why |
| --- | --- | --- | --- |
| `help.ts` `MODE_HELP.tempo.counts` (the Keep tempo card and help; printed in `04` §5f) | A pass needs both the accuracy and the share of the written tempo set in Settings, in one run. | A pass needs both the accuracy and the share of the written tempo, in one run: the lesson’s numbers where it states them, otherwise the ones set in Settings. | false for a run a rung judges whenever the rung states its own numbers (`masteryCriteriaFor`) |
| `help.ts` `SUMMARY_TEXT.waitTempo` (the Wait sheet's Tempo line) | Not judged in Wait for me — to pass, play it in Keep tempo | Not judged in Wait for me | where a pass is played moves to *To pass*, which names the numbers |
| `help.ts` `SUMMARY_TEXT.toPassLabel` / `toPass` (new sheet line, on a judged run that missed its standard) | — | To pass: 90 % of the notes, in Keep tempo at 80 % of the written tempo or faster (the run's own numbers; "of the suggested tempo" for a tempo-defaulted piece) | the sheet never named the standard a run missed |
| `help.ts` `SUMMARY_TEXT.toTheStandard` (new sheet control) | — | Keep tempo at 80 % | the sheet's recommendation had no control |
| Today's running card, a row behind the learner | its composition line, e.g. "This lesson asks for it — not counted yet" | no line | frozen words after their moment; false once the run counted |
| Today's running card / finish line, an activity a run completed without counting | ✓ done / *Warm-up done* | played / *Warm-up played* | the ✓ is the pass's mark |
| A card composed after the session, an item a run completed without counting | ✓ done today | its progress status (*started*) | as above |

Pedagogical verdict: the changed sentences tell the learner what the lesson already states (rung 2.1's
`mastery`, its *What the app counts*), at the moment they need it; no musical claim is made or changed.

## Handoffs and not done

- **CL11** (evidence contract, not touched): a piece's run writes no skill evidence as shipped, so Progress's
  skills never move for pieces; a run with no judging input (self-report) can never count toward a rung
  (`rungState.measured` excludes self-reports); a Wait run counts only for a rung asking no tempo.
- **Sight-reading** is excluded from the opening, *To pass* and the control: a reading phrase opens in Keep
  tempo at the learner's default, its rung's pass tempo may be higher, and whether that matters depends on
  how `reads` count (evidence share and standard), which is the reader's and CL11's.
- **A frozen line ahead of the learner** can still go stale when the item is counted outside the session
  (opened from the Library or the lesson page) before the session reaches it. Not reproduced; not built.
- **A drill's *played*.** A warm-up drill ended before any answer reads *played*: X1's drill reports
  `attempted` when the set starts, not on a first answer. It wears no pass mark; the word is X1's.
- Finding 10's wording (above) and finding 4 are left at their boundaries.

## Questions for the reviewer

1. **Which box is filled after a run that could not count.** On a session item's Wait (or below-tempo) sheet
   the transition's *Start* (the next item) is still the one filled box, above *Keep tempo at 80 %*
   (`06-exercise-summary`). Point 5 asks for a "primary/direct" continuation; this build gives the direct one
   and stops the silent move on, and leaves the filled box with the transition, as X1's one-filled-box rule
   has it. The alternative is the kept-here pattern — the attempt filled, *Move on anyway* beside it — which
   changes the transition's view, the runner's, beyond this lane's small build. A product choice: under the
   first a learner sees the next item emphasised and the attempt one tap away on the same sheet; under the
   second the attempt is emphasised and moving on is the quiet choice.
2. **First contact at the counting tempo.** The opening follows the composed role (criterion attempt). If a
   new piece's first meeting should instead be preparation in Wait, that is a composer role the data does
   not hold today, and the decision belongs to whoever owns the composer's slots. No one in this process can
   settle it by ear; the notation and the rung's text say what counts, not how a learner should first meet
   the piece.
