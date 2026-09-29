### Entry 134 — X1 — Today runs the composed session: one small record of today's lesson in the settings row, a transition at the piano after every activity in the composition's own words, two bounded adaptations, resume after any interruption, a start-time contact recheck through G2's one reader, the rung's own list held to the one gate's unknown-forbidden rule, and session completion never evidence (2026-09-29)

Built on base `6452bc94` in the worktree `agent-a193e270fb5e43820`, under the brief `docs/prompts/tasks/X1-today-the-teachers-screen.md` (approved with one required change, `docs/review/responses/bf8de2d2.md`, applied in its protocol section). Captures are in `docs/prompts/runs/X1/`: each `.txt` starts with its command and ends with `exit=<code>`. Pictures are in `docs/prompts/pictures/x1/`. Nothing committed, staged, stashed or checked out.

## Judgement

**Nothing was heard.** Every run in the browser is taps on the on-screen keyboard; whether any of the music sounds right is **unverified as music**. What I looked at: the app built from this tree, driven at 342 × 740 and 768 × 1024 through a whole session for a learner placed at 1.1 (two drills, two pieces), and the noon-and-evening case for a learner placed at 1.5. I read every picture below.

**What a learner meets across a session.**

- **Before.** Today at 1.1, 30 minutes: *Start session* above four rows (a five-finger drill, a note-flash drill, *Hot Cross Buns*, *Mary Had a Little Lamb*) (`today-before-start-342x740.png`). Until X1, *Start session* opened the first row and nothing followed it: the learner came back to this card after every activity and had to work out what was next.
- **After the first activity.** The learner ended the drill early (*End drill*). The drill's own sheet still says what it said (*Not passed yet*, *Accuracy 0%*, *Answered 0 of 4*, *Ended early, so this is not in your practice history unless you keep it*), and under the numbers, where *Back to the plan* used to be the way out, there is one bordered block: **Next: Note flash — treble C4 to G4, 5 min — Nothing due for review — more from this lesson**, *0 of 27 min so far*, a filled **Start** and **Skip or change** (`transition-after-drill-342x740.png`; the tablet, `transition-after-drill-768x1024.png`). *Start* opens the note-flash drill directly — Today is never on the way.
- **After a piece.** *Hot Cross Buns* played in time: *Mastery run 1 of 2*, and straight under the heading, above the numbers, **Next: Mary Had a Little Lamb, 7 min — More music from this lesson**, *Start*, *Skip or change*; *Done* is gone because the block replaces it (`transition-after-piece-342x740.png`). The block sits above *Accuracy*, *Tempo* and *Timing*, so at the piano the heading and "Next" are what the eye reaches first.
- **After an interruption.** The app reloaded in the middle of *Mary*: the same activity came back with the same token. Today then said **Continue today's session · 0 of 27 min · next: Mary Had a Little Lamb**, with a filled **Continue** and a quiet *End today's session*. The card is the session's own: the two drills marked *played*, *Hot Cross Buns* marked *✓ done*, and *Mary* marked *next* with a blue edge (`today-continue-342x740.png`, `today-continue-768x1024.png`). *Continue* opened *Mary* again.
- **After the last.** **That was the last one — today's session is done**, *1 of 27 min so far*, a filled **Done** (`transition-last-342x740.png`). Today then shows **Today's session done · 1 min** over **Warm-up played · Review played · New done · Repertoire done**, above *Start session* and a card composed since. On that new card *Hot Cross Buns* carries **✓ done today** (`today-finished-342x740.png`, `today-finished-768x1024.png`). The blue outline on the note-flash row in that picture is the pointer's hover where *Done* was pressed, not the current-row mark: no session is open.
- **The noon-and-evening case, through the session.** At noon the reading slot's phrase was opened from the card and played to the learner (*Hear it*), then left. In the evening the session was started and its reading activity chosen from the running card: the same seed. After the run the sheet says *Run finished* and G1's sentence (*Sight-reading counts only on music you have not heard — this run is kept as practice.*). The transition leads with **You heard this one earlier today, so it is practice now, not a first read**, then *Next: Ear drill — 2nd or 3rd, 5 min — This lesson: 0 of 2 counted* — the warm-up that was opened, and so started, before the learner chose the reading, and never finished (`transition-repurposed-342x740.png`).

**What a piano teacher would say, as observations against the rules (never a gate):**

- The learner is carried from one activity to the next with the reason in the composition's own words, as Part 18 asked. Where the composition's words are the fallback's (*Nothing due for review — more from this lesson*), the transition says exactly that. Read under "Next:" it is an odd reason for a teacher to give (Follow-up 3). The reviewer ruled that the words stay the composition's, so X1 adds none.
- The finish line reports what happened and judges nothing. *Played* is what an early-ended drill came to; *done* means the activity finished. An early end says **left for another day: Review, New** (unit case), with no guilt word and nothing marked failed.
- The timer counts only visible time on an activity's screen. In a quick test run that reads *0 of 27 min* and *1 min*, which is true of the test and nothing more.
- On the shipped cards the easy-success skip never fires. It needs a demand-ready or demand-step activity followed immediately by a demand step naming the same demand. None of the 436 fresh-learner cards has a `demand` or `ready` claim at all, and the five diary learners' cards have `ready` only in the repertoire slot, which a sight-read follows. The rule is exercised on constructed runs (`sessionAdaptation.test.ts`). Whether the pair ever arises for a real learner is unverified.
- Easy success and the kept-here rule are shown only on constructed runs and in `sessionTransition.test.ts`. No picture shows *Still unstable, so we're not moving on*.

## The mechanism

**The fault** (Part 18; verified at the line before the change): `TodayScreen.drawActions`'s *Start session* was `slots.find((slot) => slot.item)` → `open(first.item, first)`. There was no session record and no cursor. The Score screen's *Done* and the drill's *Back to the plan* went back to a tab. The card was rebuilt from the evidence every time Today mounted.

**The change, on the mechanism:**

1. **One record** (`app/src/data/sessionRun.ts`). It is kept under one `settings` key, `pianopath.sessionRun`, in the offer snapshot's pattern: no store and no `DB_VERSION`.
   - It holds the composition as it was when *Start session* was pressed: each activity's slot (kind, item id, title, minutes, the claim's kind and the demand or skill it names), the route that opens it, the composition's words (`reason`), its contact assumption, its state, its adaptations, its last outcome and its visible time. It also holds the prompts outside the cursor, the cursor itself, the start time, the elapsed time, the closing and `detour: null`.
   - `validateRun` reads a stored value as data. A corrupt or old-shaped value is discarded with its reason logged.
   - `apply` is the one pure state machine. `applySessionEvent` runs it inside one read-write transaction, and refuses a write whose session id, composition version or activity token is not the stored current one.
2. **One adapter** (`app/src/ui/sessionRunner.ts`, new; the reviewer's "one runner transition"). It contains:
   - `openActivity`, the one opener. It writes a transfer offer's snapshot before the offer's route, and a failed write opens nothing.
   - `sessionHandle`, which screens report through: opened (with the material they play), attempted, completed (with the stored run's outcome), and the visible-time clock.
   - The start-time recheck through `session.contactOf`.
   - `transitionView` and `drawTransition`, the one transition block.
   - `openOutside`, for a done row played again.
3. **The route carries the token** (`router.ts`, `?session=`): on the Score and drill routes, so a reload, a back gesture or a closed app reopens the same activity. The router is a whole-suite path in the map (below).
4. **The screens report, the runner decides.**
   - The Score screen reports `opened` as the score loads, before the notation is drawn, with G1's played material and its visit. It reports `attempted` when a judging run's count-in ends or its first note lands, and `completed` once the run is stored, with `scoreOutcome` of the stored run. Its summary draws the transition under the heading, and *Done* gives way to it.
   - The drill screen does the same at its end sheets: prompt drills, the checklist, the placement test. *Back to the plan* gives way, and *Again* is outlined so the transition's *Start* is the one filled box.
   - Neither screen reads encounter history or chooses what comes next.
5. **Today** runs the record. *Start session* writes it from the card as composed, swaps included, and opens activity 1.
   - While the session is open, the card is the run's and the row is *Continue* with where the session is. A row tapped out of order becomes current. A swap on a running row replaces that activity with a new token.
   - Closed today, the row shows the finish line. A card composed after it marks rows *done today*.
   - Another day's open run is closed as not finished, with no word said. A length chip or *Shuffle* closes a running session as recomposed.
6. **The composition exposes each slot's contact assumption** (`session.contactAssumption`, `SessionSlot.contact`). The reading slot and the transfer offer assume a first contact; otherwise the value is G2's `contactOf` answer, `met` or `none`. The runner rechecks only a first-contact assumption, once, at the activity's start. It reads the runs, the encounters minus this visit's and the pruned summaries through the same `contactOf`. Met by its exact material means invalidated and repurposed, with the reason said. An id-only match is `held`, never guessed.
7. **L113** (`eligibility.automaticFromList`, asked in `session.fromList` by the rung's asks, the ladder's rung and prerequisite steps, the jam slot and the exposure rule). The one gate is asked as an automatic experience with no opportunity claimed. `unknown-forbidden`, `unknown-physical`, `exploration-only` and `teaching-use-not-approved` refuse. A measured option keeps its placement — **a deviation**, below.

**The discriminating tests.** Every new or behaviour-revised case is red on the committed code (`red-vitest-head-source.txt`, `-2.txt`, `-3.txt`). Three kinds of case are green there, as they should be:

- the controls: `oneGateBoundary`'s measured-song control and its Library case;
- the three fixture revisions (`fallbackOrder`, `sightReadingIsNotAPiece`, `parallelStrands`), whose added measurement changes nothing on HEAD;
- the cases the revisions left alone.

The red cases:

- The state machine, the adaptations, the recheck, the Today flows, the transition, the clock and the never-evidence guard: the files fail to load on HEAD (no `sessionRun` or `sessionRunner` module). That is seven files holding 71 of the 77 new unit cases; the other six are `sessionProtocol.test.ts`'s.
- On HEAD's sources: 11 cases fail in the revised and existing files — L113's case (*15 min: expected [ …(2) ] to deeply equal []*: the unmeasured song and the import were on the card), the practice row's two cases, G62's three, *Start session* carrying no token, and four in `sessionProtocol.test.ts` (the route's token, U71, U57, G61's plain line).
- After two cases were strengthened, all six in `sessionProtocol.test.ts` fail on HEAD (`-2.txt`), the target-form sweep included, because no slot carried its contact on HEAD.
- 19 mutants (`mutants.txt`): 17 caught on the first run. `recheck-invalidates-by-id` and `no-contact-assumption` survived, each got its case (an id-only older run holds; every composed slot carries its contact), and both were then caught (`mutants-recheck-invalidates-by-id-no-contact-assumption.txt`).

**The composition's consequence, measured the same way before and after** (`scripts-zzX1CardProbe.test.ts`: every rung of the built curriculum, a fresh learner placed there with the default tracks and the rung's own, at 15, 30, 60 and 120 minutes; 436 cards):

- **L113 alone** (`probe-l113-only-cards.txt`, run with the two policies below switched off and the file restored by sha256): **0 of 436 cards change**. No bundled rung option on the shipped catalogue is unmeasured; the rule bites on a learner's assigned import that the app has not measured, and on PDFs.
- **With X1's two policies** (`probe-x1-cards.txt`): 135 of 436 cards change. 36 are the practice-track rungs (1.2–1.5 and `practice.1`–`practice.5`, every length). The other 99 are 60- and 120-minute cards whose jam row now holds chord-and-feel material; where that takes an item another slot held, that slot's row moves too.
- **The five diaries** (`diaries-before/`, `diaries-after/`): byte-identical. Their learners have only the core path on, so neither policy reaches them.

## Done

Technical and pedagogical verdicts are given separately where both apply.

1. **The execution state** (item 1).
   - The record, validation, the pure state machine and the transactional store: `sessionRun.test.ts`, 23 cases. The shape follows the brief's with additions, each with its reason in the module:
     - `adaptations` is a list, since an activity can be repurposed at its start and kept here after a failure;
     - per activity: `order`, `token`, `route`, `result` (`outcome`, `attempts`), `movedOn` and `elapsedMs`;
     - on the run: `outside`, `closed`, `format` and `breakAfter`.
   - `version` is the composition's key (a short hash of each slot's kind, item and minutes); `sessionId` is minted at *Start session*.
   - Technical: done.
2. **The transition** (item 2): on the Score screen's summary and the drill's end sheets (prompt drills, checklist, placement), in the composition's words only (`sessionTransition.test.ts`, 9 cases; `session-run.spec.ts`).
   - *Start* opens the next activity through the router with its token.
   - *Skip or change* marks the offered activity skipped, by the learner, and returns to Today. There the next one is marked, and any pending row can be swapped (Today's swap of a running row, a new token: `todaySessionRun.test.ts`).
   - The finish line, on Today.
   - Technical: done. Pedagogical: the observations above.
3. **Adaptation, visible** (item 3), as the reviewer bounded it: `sessionAdaptation.test.ts`, 12 cases.
   - Easy first-attempt success, measured at the full standard, skips only an immediately following demand step that names the same measured demand. It is said as *Easier than expected — {title} is skipped*.
   - A measured failure holds the cursor: *Still unstable, so we're not moving on*, *Try again*, *Move on anyway*.
   - Unknown, self-report, Wait's unmeasured tempo, a drill that judges nothing and a refused re-read trigger neither.
   - Nothing else on the card changes.
   - Technical: done. Pedagogical: unverified on a real card (Judgement).
4. **Resume** (item 4): *Continue today's session · N of M min · next: …* over the card; a reload keeps the route's token; yesterday's run closed as not finished (`todaySessionRun.test.ts`; `session-run.spec.ts`). U31's score-run persistence is untouched.
5. **L113** (item 5): an unmeasured song on a rung's list and an import assigned before the app measured it are on no row at any length. Each was asked the one gate as an automatic question and refused `unknown-forbidden`, and the rung's songs ask stays unmet. The same items open from the Library, eligible for exploration with the missing measurement said, and the import's row says *not measured yet* (`oneGateBoundary.test.ts`, the block replaced). Technical: done; see the deviation.
6. **Contact recorded and rechecked** (item 6): at composition and at start, through G2's one reader (`sessionRecheck.test.ts`, 8 cases). The browser case is the noon-and-evening one above.
   - *You heard / played / saw this one earlier today, so it is practice now, not a first read*.
   - The reader row's evidence still follows G1's own derivation on the Score screen (unchanged): the run is kept as practice.
7. **The practice row's place, a stated teaching policy** (item 7), `session.METHOD_TRACKS` with its reason. The new slot takes the learner's own rung's new material first and How to practise's row second. At 1.2 on the 30-minute card, New is *Lightly Row* (1.2's song ask) and the practice row is `practice.1`'s *Hot Cross Buns* in the repertoire slot. At 15 minutes the practice row is `practice.1`'s five-finger exercise in the review slot. `taughtByAncestry.test.ts` (revised plus one case) and `today.spec.ts` (revised). This is the orchestrator's proposal, and **the reviewer decides** (Question 2).
8. **The small rows.**
   - **U71**: the transfer offer's card line is *Shifting position: something new*. The whole invitation is the composition's `reason`, kept for the transition.
   - **U73**: a failed offer-snapshot write opens nothing and Today says *This offer could not be kept on this phone, so it was not opened. Try again.* This holds on the live card and in the session.
   - **U57**: the kept line now ends *and they can't be left out here* (`docs/04` row edited in place, since `sightReadingFromReadingState.test.ts` reads it). The same words make U58's claim true (the line no longer says every phrase has them); U58 is left for the reviewer to close.
   - **G61**: the jam slot takes chord-and-feel material first (a score with chord symbols, a backing-track groove). Where it offers anything else, its line is *From {rung}*.
   - **G62**: *Quick check* takes the first option whose run is measured (`DrillScreen.measuresARun`, one list with `drillOutcome`). Where a lesson has only unmeasured drills it says *This lesson has no drill that measures a run yet*. Ten rungs' checks move (`lessonPagePicksPassTheAdmission.test.ts`, the G62 case).
9. **The protocol's boundaries**:
   - every composed guided slot on the 436 cards opens as a Score-screen run or a drill (`sessionProtocol.test.ts`), never the lab, a chart, a PDF or a placeholder;
   - the free prompt and anything else outside the cursor are never current, never done and not counted;
   - the guided tour is kept outside the cursor (its steps leave the drill screen without the token);
   - time accrues only while visible (`sessionClock.test.ts`);
   - every adversary is a test: close or reload, hidden time, a late callback, two tabs, the free slot, a non-Score target, a recomposed card, a corrupt record.
10. **Never evidence**: `sessionRunNeverEvidence.test.ts`, a static guard over `evidence/`, `progressStore.ts` and `rungStates.ts`, and a whole session leaving runs, progress, rung state and ladders byte-identical. The mutant `session-is-evidence` is caught.

## Part 18's fifteen cases (Q42's session-runner block)

| # | Case | Written as | State |
| --- | --- | --- | --- |
| 1 | *Start session* opens execution state, not the first slot | `todaySessionRun` (the record is the card as composed; the first activity with its token), `todayOpensWithItsRung` (revised), `session-run.spec` | passes |
| 2 | Finishing activity 1 offers activity 2 with its reason | `sessionTransition` (Next in the composition's words), `session-run.spec` (after a drill, after a piece) | passes |
| 3 | The learner can skip or change it | `sessionTransition` (*Skip or change*), `todaySessionRun` (a running row swapped: a new token), `sessionRun` (swap) | passes |
| 4 | A completed activity is not offered as untouched on Today | `todaySessionRun` (*done* on the running card; *done today* on a card composed after), `session-run.spec` | passes |
| 5 | An X19 detour returns to the right position | — | **not X1's** (X19); `detour` stays `null` |
| 6 | Isolated remediation failure can alter the next action | `sessionAdaptation` and `sessionTransition` (a measured failure keeps the learner here) | X1's bound only; the episode is X19's |
| 7 | Easy success removes redundant work | `sessionAdaptation`, `sessionTransition` | passes, on constructed runs; no shipped card meets the condition |
| 8 | A changed recommendation says why | `sessionTransition` (easier, kept here, repurposed), `session-run.spec` (repurposed) | passes |
| 9 | Leaving and reopening resumes today's session | `todaySessionRun` (Continue), `session-run.spec` (reload mid-activity, Continue) | passes |
| 10 | Ending on purpose marks nothing failed | `todaySessionRun` (ended), `sessionRun` (end) | passes |
| 11 | Execution state is never competence evidence | `sessionRunNeverEvidence` and the mutant `session-is-evidence` | passes |
| 12 | Exploratory tools stay reachable and unrequired | `todaySessionRun` (the doors while a session runs); the tablet picture | passes |
| 13 | The flow crosses Score, Drill, Lab and Jam, chart and PDF | `session-run.spec` (Score and drill); `sessionProtocol` (every guided slot is a Score run or a drill; a jam item opens as one); `todaySessionRun` (a PDF kept outside) | Score and drill pass; the lab, chart and PDF are no guided target in X1, by the protocol |
| 14 | On the phone, continuation needs no trip through Today | `session-run.spec` (*Start* opens the next activity's route; asserted by URL), `sessionTransition` | passes |
| 15 | An early end says what was deferred without guilt | `todaySessionRun` (*left for another day: Review, New*) | passes |

## Deviations, each with its reason

1. **L113 applies the gate's unknown refusals to a rung's own measured options, not its coping refusal.** E2a's reviewer wrote "the same coping/unknown-forbidden material gate". On the shipped curriculum, 387 of the rungs' own options carry a measured demand their rung's ancestry does not teach (`probe-head-refusals.txt`: `untaught` 387, `teaching-use-not-approved` 71, `physical` 4, none unknown). Among them is *Hot Cross Buns* at 0.3. Refusing those would take a rung's own music off Today and leave its `runs` ask unmeetable from the card. That is a curriculum-claims question (F's), not the unknown L113 names. The brief's item 5 names the unknown-forbidden rule. Question 1.
2. **`app/src/ui/sessionRunner.ts`**, a new file outside the list: the one adapter and transition shared by three screens, the reviewer's "one runner transition".
3. **The Score and drill screens are touched beyond their closing action**: the protocol's `opened`, `attempted`, `completed` and clock, which the reviewer's table requires.
4. **`LessonScreen.ts`** (G62's *Quick check*, which lives on the rung page), **`style.css`** (the new blocks' styles) and **`docs/04`** (one row, U57, read by a unit test) are outside the list.
5. **The lab, chart and trading fours row of the protocol is a form no composed slot produces.** `targetFor` has no lab or chart target, and the jam slot's items open as scores or drills. `LabScreen.ts` is untouched.
6. **A drill "attempted" is "started", which a drill is as it opens.** An activity started and left for another row stays still-to-do (`movedOn` distinguishes one the learner moved on from). A stopped drill completes nothing; the transition's *Start* moves on, and the activity stays *played*.

## Not done

1. **Part 18 case 5 (an X19 detour returns to the right position): X19's.** `detour` stays `null` and no test exists.
2. **Case 6 in full** (isolated remediation failure alters the next action): only X1's bound is built — a measured failure keeps the learner here. The episode is X19's.
3. **Case 13's Lab, chart and PDF crossings:** not guided in X1, by the protocol. The lab and chart are no slot's target; a PDF is kept outside the cursor until a manual finish boundary exists (a later row).
4. **The whole default Playwright suite and `npm run states`**, which the map names for `router.ts` and `style.css`: not run here; CI runs them. I ran the union the map gives X1's other modules, 57 spec files (below).
5. **No jsdom test of the Score screen's summary in a session.** It is covered in the browser only (`session-run.spec.ts`).
6. **Part 20's "fake-clock duration test across four surfaces":** one handle is tested with a faked clock. The Score and drill screens use that handle and are observed in the browser, not clock-tested each.
7. **Pictures at 768 × 1024** exist only for the transition after a drill, Continue and the finish line. None was taken of the transition after a piece, the last one or the repurposed case.
8. **`docs/02`, `docs/08` and `docs/04` §2, §5, §5c and §3e are rows below**, apart from the one `docs/04` row edited in place.

## Follow-ups (recorded, not fixed)

1. **P1 (curriculum claims):** 387 rung-own options are `untaught` by their rung's ancestry on the gate's coping question (Deviation 1). This is either F's claims or the reviewer's rule.
2. **P3 (pre-existing, C1/T40 family):** a drill set ended before any answer is headed *Not passed yet* over *Accuracy 0%* and *Answered 0 of 4* — a measurement nobody took (`transition-after-drill-342x740.png`).
3. **P3 (X's voice, the composition's words):** the review fallback's line *Nothing due for review — more from this lesson* reads oddly as a reason after "Next:". The ruling keeps the words the composition's, so any change is a composition wording pass.
4. **P3:** in a session, the placement test's end sheet has two filled boxes (*Start here* and the transition's *Start*).
5. **P2:** the rung's own large-hand voicings (`rock.5`, the gate's `physical`) are placed as before; not L113's unknown.
6. **P3:** the easy-success skip has no case on a real card (Judgement).
7. **P3 (pre-existing, Q44 and Q45's family):** `modes-duet.spec.ts` › "a rung whose duet names an exercise" reads the rung's rows as soon as the lesson section is visible. With two workers it fails on HEAD's app as on X1's. It should wait for the list's drawn state, as H0 did for the Duet door.
8. **P3 (a harness fault of mine, recorded for the next builder on another port):** the shared storage state (`tests/e2e/fixtures/storageState.json`) names port 4173's origin, so a config copied onto another port opens the setup tour for every spec relying on it. X1's copy uses a 4373 file.

## Questions

1. **L113's scope** (product and pedagogy): should the rung's own measured options also pass the gate's coping question? Measured, that removes 387 option placements, *Hot Cross Buns* at 0.3 among them, and leaves some rungs' asks unmeetable from Today. X1 applies the unknown refusals only.
2. **The practice row's place** (pedagogy): the orchestrator's proposal is built — the rung's own new material first, How to practise second. Right, or should the practice row keep the new slot?
3. **The transition's time line** says *N of M min so far* (elapsed of planned, from the visible clock). The brief asked for elapsed and remaining; this shows both as one relation. Is that enough, or should it say "M − N left"?

## The red lines

- `red-vitest-head-source.txt` — X1's new and revised unit files on HEAD's sources, after the swap (`swap-to-head.txt`, `restore-from-head.txt`, every sha256 equal):
  - 11 cases failed;
  - seven files failed to load: *Cannot find module '../../src/data/sessionRun'* (sessionRun, sessionAdaptation, sessionRecheck, sessionRunNeverEvidence) and *Failed to resolve import* (todaySessionRun, sessionClock, sessionTransition);
  - the failures named: L113 (*15 min: expected [ …(2) ] to deeply equal []*), the practice row (*placed at 1.2 … expected [ Array(1) ] to deeply equal [ Array(1) ]*, *'exercise.five-finger.c-major.right (a…' to be 'song.folk.lightly-row (asked 1.2)'*), G62 (*measuresARun is not a function*, *valid is not a function*), *Start session*'s token (*.toMatch() expects to receive a string, but got undefined*), U71 (*cardLine is not a function*), U57 (*'and every phrase here has them' to be 'and they can't be left out here'*), G61 (*'Chords, form and feel: from Rung jam.1' to be 'From Rung jam.1'*), and the route (*expected { tab: 'today', …(3) } to match object*).
- `red-vitest-head-source-2.txt` — after strengthening, all six `sessionProtocol.test.ts` cases fail on HEAD (the sweep, the route, both G61 cases, U71, U57), and `sessionRecheck.test.ts` fails to load.
- `red-vitest-head-source-3.txt` — the cases added last (`todaySessionRun.test.ts`'s four Part 20 cases, `sessionRecheck.test.ts`'s id-only case): the files fail to load on HEAD.
- `mutants.txt` and `mutant-*.txt` — 19 mutants, 17 caught first; the two survivors caught after their cases (`mutants-recheck-invalidates-by-id-no-contact-assumption.txt`).
- `e2e-targeted-1.txt` — two browser cases failed on X1's first build because their assertions encoded the old behaviour: `today.spec.ts`'s practice row (*Expected: "exercise.five-finger.c-major.right" Received: "song.folk.hot-cross-buns"*) and `transfer-offer.spec.ts`'s card line (*Received: "Shifting position: something new"*). Both were revised, with the reason at each.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `app/tests/unit/sessionRun.test.ts` | add (23) | — | the state machine; every write validated by id, version and token; validation; the store's transaction; two tabs; another day; recomposed; no database |
| `sessionAdaptation.test.ts` | add (12) | — | the two rules exactly; what the stored run may drive |
| `sessionRecheck.test.ts` | add (8) | — | the recheck at start, through `contactOf`; the assumption as composed |
| `sessionRunNeverEvidence.test.ts` | add (2) | — | no reader; a whole session changes nothing the evidence reads |
| `todaySessionRun.test.ts` | add (15) | — | Start, Continue, the run's card, choose, swap, the finish line, an early end, another day, Shuffle, corrupt, U73, U71, Part 20's three |
| `sessionTransition.test.ts` | add (9) | — | the transition's views and buttons over the store |
| `sessionClock.test.ts` | add (2) | — | visible time only |
| `sessionProtocol.test.ts` | add (6) | — | target forms and contact on 436 cards; the route's token; G61; U71; U57 |
| `oneGateBoundary.test.ts` | revise (the last block replaced, two cases added) | a rung's own list is placement, not selection | the rung's own list asks the one gate; the Library opens the same items |
| `taughtByAncestry.test.ts` | revise + add | the practice row takes New at 1.2 and 1.5 | the practice row second; New is the rung's own |
| `lessonPagePicksPassTheAdmission.test.ts` | revise + add | Quick check takes any drill or file | a measured one; the ten moves named |
| `todayOpensWithItsRung.test.ts` | revise | Start opens the first slot at once, with no session | awaited, with the token; fixtures measured |
| `fallbackOrder.test.ts`, `sightReadingIsNotAPiece.test.ts`, `parallelStrands.test.ts` | revise (fixture) | a constructed rung option with no measurement is offered | measured, as every bundled row is |
| `app/tests/e2e/session-run.spec.ts` | add (3) | — | the session on the glass; the tablet; the noon-and-evening case through the recheck |
| `today.spec.ts` (the F2 floor case), `transfer-offer.spec.ts` (the card line) | revise | the practice row in New; the whole line on the card | the practice row second; the card line's head |

## Checks (each file's first line the command, last line its exit)

| Run | Exit | What it said |
| --- | --- | --- |
| `npm ci` | 0 | installed |
| the parity reference | 0 | reference files written; MAESTRO files skipped, missing |
| `build.py --offline` before the copy (`content-build-1-before-copy.txt`) | 1 | kern and musetrainer items missing |
| the copy from the main checkout, read only (`copy.txt`, `scripts-copy.ps1`) | robocopy 1 each ("files copied") | the three caches, `build/cache/convert`, `build/midi-real`, `content/scores/imported/kern` and `musetrainer` |
| `build.py --offline` (`content-build.txt`) | 0 | 2,090 items; the three reports the build rewrites put back to HEAD's bytes (`restore-reports.txt`) |
| the card probe, HEAD, X1 and L113 alone | 0, 0, 0 | 436 cards each; 0 changed by L113 alone, 135 by X1 |
| vitest, whole suite, after the first build (`vitest-full-1.txt`) | 1 | 20 failed: the cases encoding the old behaviour, revised; the recorded CRLF pair |
| vitest, whole suite, second (`vitest-full-2.txt`) | 1 | 3 failed: the CRLF pair, and `expectedNote.test.ts` timed out at 5 s under load and passed alone (`vitest-expectedNote-alone.txt`, 0) |
| vitest, whole suite, final (`vitest-full-final.txt`) | 1 | 7,050 passed, 2 failed (`lessonClaimsAboutApp` › 4.7 and › blues.3, the recorded CRLF pair), 5 skipped |
| `npx tsc -b` (`tsc-final.txt`) | 0 | — |
| `npm run lint` (`lint-final.txt`) | 0 | — |
| red on HEAD, three runs | 1, 1, 1 | above |
| diaries, HEAD and X1 | 0, 0 | five files byte-identical |
| mutants | 1, then 0 | 17 of 19, then the two survivors caught |
| the map's content tests (`content-checks-map.txt`) | 0 | 38 ran |
| `checks_for_paths.py` on X1's 33 paths (`checks-for-paths.txt`) | 0 | 33 matched, 0 unmatched. It names the map's two content tests, `tsc -b`, lint, the whole unit suite, the app build, the whole default Playwright suite (for `router.ts` and `style.css`) and `npm run states`. The whole browser suite and the states gallery are CI's (Not done 4). |
| Playwright, port 4373, the session spec, first (`e2e-session-run-1.txt`, `build-app-1.txt`) | 1, 2 | the web server's build failed on a test's type; fixed |
| Playwright, port 4373, the session spec (`e2e-session-run-2.txt`) | 0 | 3 passed |
| Playwright, port 4373, targeted (`e2e-targeted-1.txt`) | 1 | 86 passed, 2 failed (revised, above) |
| Playwright, port 4373, the union, first (`e2e-union-1-wrong-origin.txt`) | stopped | My config copy kept the shared storage state (`tests/e2e/fixtures/storageState.json`), whose origin is port 4173's, so on 4373 every spec relying on it opened the setup tour: `app-shell` read *Set up PianoPath*, and the score specs timed out. This was a harness fault of mine, not the product's. I stopped the run and gave the config a copy naming 4373 (`scripts-storageState.x1-4373.json`). The earlier runs' specs set their own storage (session-run, today, transfer-offer, lesson-flow) or passed regardless; the rerun below covers every one. |
| Playwright, port 4373, the union of X1's module rows, 57 spec files (`e2e-union-final.txt`) | 1 | 481 passed, 5 failed, none of them X1's: <br>• `score.layout`'s three screenshots found no local `-win32.png` reference in a fresh worktree ("A snapshot doesn't exist … writing actual"; the committed references are CI's `-linux`, and the written ones are gitignored); <br>• `first-day` › phone sideways timed out at its Skills step and passed alone (`e2e-rerun-first-day-duet.txt`); <br>• `modes-duet` › "a rung whose duet names an exercise" also fails on HEAD's app, 2 of 3 repeats with two workers (`e2e-duet-head-app-x3.txt`, HEAD built into `dist-head` by `scripts-duet_on_head.sh`, the sources restored by sha256). It passes alone with one worker on X1 (`e2e-duet-single.txt`), and the probe of its steps shows `exercise.independence.c.2v3` among technique.7's rows (`e2e-duet-probe-*.txt`). The spec reads the rows the moment the section is visible (Follow-up 7). |
| Playwright, port 4373, `first-day` and `modes-duet` alone (`e2e-rerun-first-day-duet.txt`), then `modes-duet` twice more (`e2e-duet-alone-1.txt`, `-2.txt`) | 1, 1, 1 | first-day passed; the duet case failed each time with two workers, as on HEAD |

Every Playwright run used two workers, ran on port 4373 only, and first checked that every named spec file exists (`scripts-e2e.sh`).

## Unverified, beside what passes

1. **Unverified as music**: every phrase and piece played; whether the order Warm-up → Review → New → Repertoire makes a good lesson; whether "practice now, not a first read" is the right teaching call for a phrase heard at noon.
2. **The easy-success skip and the kept-here words** have not been seen on a real card or in a picture.
3. **Two tabs** are tested at the store (serialised transactions) and in jsdom, not in two browser windows.
4. **A closed app**: only a reload was observed. That the phone's app switcher fires `visibilitychange` and `pagehide`, as the clock expects, is inferred.
5. **CI has not run this tree.**

## Files

In the worktree, nothing committed or staged.

- **New**:
  - `app/src/data/sessionRun.ts`, `app/src/ui/sessionRunner.ts`;
  - `app/tests/unit/sessionRun.test.ts`, `sessionAdaptation.test.ts`, `sessionRecheck.test.ts`, `sessionRunNeverEvidence.test.ts`, `todaySessionRun.test.ts`, `sessionTransition.test.ts`, `sessionClock.test.ts`, `sessionProtocol.test.ts`;
  - `app/tests/e2e/session-run.spec.ts`.
- **Changed, in the brief's list**: `app/src/ui/screens/TodayScreen.ts`, `app/src/curriculum/session.ts`, `app/src/curriculum/eligibility.ts`, `app/src/router.ts`, `app/src/ui/help.ts`, `app/src/ui/screens/ScoreScreen.ts`, `app/src/ui/screens/DrillScreen.ts`, and the tests named above.
- **Changed, outside the list, and why**: `app/src/ui/screens/LessonScreen.ts` (G62), `app/src/style.css` (the new blocks), `docs/04-ui-spec.md` (the U57 row, read by a unit test), `docs/prompts/checks.json` (spliced as text, `scripts-splice_checks.py`), which gains:
  - rows for `sessionRun.ts` and `sessionRunner.ts`;
  - `session-run.spec.ts` in the Today, session, Score screen, drill screen and screen frame rows;
  - `session-run.spec.ts` in the `playInTime` and `scoreControls` rows (their importer lists, held by `test_checks_for_paths.py`).
- **Not for commit**: `app/test-results-x1/` (Playwright's output, removed at the end). `app/playwright.x1-4373.config.ts` exists only while a run is going; its copy is `runs/X1/scripts-playwright.x1-4373.config.ts`.
- **Beside this entry**: every capture and `scripts-*` in `docs/prompts/runs/X1/`; pictures in `docs/prompts/pictures/x1/`: `today-before-start-342x740.png`, `transition-after-drill-342x740.png`, `transition-after-drill-768x1024.png`, `transition-after-piece-342x740.png`, `today-continue-342x740.png`, `today-continue-768x1024.png`, `transition-last-342x740.png`, `today-finished-342x740.png`, `today-finished-768x1024.png`, `transition-repurposed-342x740.png`.

**Orchestrator's note at the landing (2026-09-29).** X1's worktree committed by name (aed824a1) and merged (da4fa24c). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/X1/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then exactly the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 1; e2e-targeted 0 — the spec-existence step read an empty list because the map names the whole suite for the router and the stylesheet, and said so; the whole suite ran — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/X1/orchestrator-exit.txt`). Built under the brief the reviewer approved with one required change (`responses/bf8de2d2.md`, the activity protocol), on the G2 policy as accepted with G2a. The map named the whole browser suite for the router and the stylesheet, so the whole suite ran here at four workers: 830 passed, none failed, the duet race's repair (U95) and U90's wrap in the tree. The merge's one conflict, two rows of the path map that both sides extended, was resolved by the union of their spec lists (the map's test green after). The builder's deviation on L113's scope (the gate's unknown refusals applied to a rung's own options, the coping refusal to assigned imports, because 387 rung-own options read as untaught by their rung's ancestry) is kept and is the first of three questions in the handoff; L120 records the 387. The builder's union run of X1's spec rows predated the U95 repair on this branch, so its duet failure was that race. Nothing heard; every browser run is taps on the on-screen keyboard, so the music is unverified as music.

## Doc rows

**`docs/04-ui-spec.md` §2 (Today)** — replace the bullet "\"Start session\" runs the rows in order with a between-item summary." with:

> - **"Start session" runs today's session** (X1, 2026-09-29; Part 18; `data/sessionRun.ts`, `ui/sessionRunner.ts`). It writes one record of the card as composed at that moment — swaps included — under one `settings` key (`pianopath.sessionRun`): each activity's slot, the route that opens it, the composition's own words, its contact assumption and what becomes of it. The free prompt and anything whose screen owns no honest finish (a PDF, a placeholder, the guided tour) stay outside the cursor. It then opens the first activity with its token (`?session=`). While a session is open today the card is the session's, never a card composed since: done rows say *done*, a row tried and moved on from *played*, a skipped one *skipped*, and the current one *next*, with a blue edge. The one filled box is **Continue**, under *Continue today's session · N of M min · next: …* (visible time on the activities' screens, never wall time), beside a quiet *End today's session*. A row tapped out of order becomes current; a running row's *Swap* replaces that activity with a new token. A length chip or *Shuffle* recomposes the card and closes the running session. An early end says what waits — *Today's session ended · N min*, *… — left for another day: Review, New* — and marks nothing failed. After the last activity the finish line says *Today's session done · N min* over what each came to (*Warm-up done · Review played · …*), above *Start session*, and a card composed after it marks rows *done today*. Another day's open session is closed as not finished, without a word. Nothing about a session is evidence.
> - **An automatic row from a rung's own list asks the one gate** (L113, X1; `eligibility.automaticFromList`): an unmeasured option, or a learner's assignment of an import the app has not measured, or a PDF, is on no row; a measured option keeps its placement. The Library still lists and opens every one, the missing measurement said.
> - **The practice row's place** (X1, a stated teaching policy): the new piece is the learner's own rung's new material first, and How to practise's row second (the next slot that takes a strand's own option). At 1.2 on the 30-minute card, New is 1.2's song and the practice row is `practice.1`'s song in the repertoire slot.

and in the claim table add under *jam*: "| jam, none of its rung's options chord-and-feel | From Playing from chord symbols |". Change the transfer offer's row to "| the transfer offer (D4) | the card: *Shifting position: something new*; the whole line (*… something new, for a skill you have shown — it should feel different*) on the session's transition (U71) |". In the fixed pieces add "`somethingNewHead` "something new"". In the jam bullet add "chord-and-feel material first (a score with chord symbols, a backing-track groove; G61)". In the transfer paragraph replace "Only once it is kept." with "Only once it is kept; a write that fails opens nothing and Today says *This offer could not be kept on this phone, so it was not opened. Try again.* (U73)".

**`docs/04-ui-spec.md` §5 (Score screen), the end-of-run summary bullet** — add:

> **In today's session** (X1): where the run is a session's activity (`?session=`), the sheet's closing action is the next step. The heading stands first; directly under it is one bordered block with *Next: {title}, N min — {the composition's own words}*, *N of M min so far*, a filled **Start** (the next activity opened straight away, never through Today) and **Skip or change** (the next skipped by the learner, back to Today). After a measured failure the block says *Still unstable, so we're not moving on* with *Try again* and *Move on anyway*. After easy first-attempt success it says *Easier than expected — {the skipped practice} is skipped*. A first contact met since the card was composed says *You heard this one earlier today, so it is practice now, not a first read*. After the last activity it says *That was the last one — today's session is done* and **Done**. *Done* gives way to the block. The Score screen reports opened, attempted and completed (the stored run's measured outcome, never a self-report) and its visible time, and reads nothing else of the session.

**`docs/04-ui-spec.md` §5c (Drill screen)** — "In today's session the end sheet's closing action is the same transition (X1); *Back to the plan* gives way to it and *Again* is outlined. A set that ran out completes the activity with its judged result, or none where the drill judges nothing. A stopped set completes nothing, and *Start* moves on."

**`docs/04-ui-spec.md` §3e (the rung page's picks)** — "*Quick check* takes the first option whose run is measured — notation, or a drill of a kind that judges (`DrillScreen.measuresARun`, the list `drillOutcome` reads) — and where a lesson has only unmeasured drills it says *This lesson has no drill that measures a run yet* (G62, X1)."

**`docs/02-curriculum.md` D8a** — after the first paragraph: "On Today, How to practise's row comes after the learner's own rung's new material, never in its place (X1, a stated teaching policy, `session.METHOD_TRACKS`): the track is how to practise beside the core, not instead of it."

**`docs/08-test-map.md`** — a row after G2's:

| **Today's session, run** (X1; Part 18, L32, X9, L113, G61, G62, U57, U71, U73; the brief approved with its required change, `responses/bf8de2d2.md`): `data/sessionRun.ts` (the record under one settings key, `validateRun`, the pure `apply`, `applySessionEvent` in one transaction, `closeSessionRun`, `scoreOutcome`, `drillOutcomeOf`); `ui/sessionRunner.ts` (`openActivity`, `sessionHandle` — opened, attempted, completed, the visible-time clock, the start-time recheck through `session.contactOf` — `transitionView`, `drawTransition`, `openOutside`); the router's `?session=`; Today's Start, Continue, running card, finish line, recompose and yesterday's close; the Score screen's and the drill's end sheets; `session.contactAssumption`; `eligibility.automaticFromList` and `session.fromList`; `METHOD_TRACKS`; the jam slot's `chordAndFeel`; `DrillScreen.measuresARun` | *Start session* opening a slot, not a session; a late callback, a stale tab or a recomposed card advancing or overwriting the record; hidden time counted; a free prompt or PDF made current or complete; easy success or failure adapting on an unknown, self-reported or unmeasured result; the transition's reason other than the composition's words; a card rebuilt under a running session; a first contact met since composition read as first contact, or this visit's viewing read as prior contact; a session's completion reaching the evidence; an unmeasured rung option or assignment offered automatically; the practice row displacing the rung's own new material by ranking; a jam line promising chords over a transposition page; *Quick check* opening a drill that measures nothing; a failed offer write opening the route | `tests/unit/sessionRun.test.ts`, `sessionAdaptation.test.ts`, `sessionRecheck.test.ts`, `sessionRunNeverEvidence.test.ts`, `todaySessionRun.test.ts`, `sessionTransition.test.ts`, `sessionClock.test.ts`, `sessionProtocol.test.ts` (added); `oneGateBoundary.test.ts`, `taughtByAncestry.test.ts`, `lessonPagePicksPassTheAdmission.test.ts`, `todayOpensWithItsRung.test.ts`, `fallbackOrder.test.ts`, `sightReadingIsNotAPiece.test.ts`, `parallelStrands.test.ts` (revised, Entry 134's table); `tests/e2e/session-run.spec.ts` (added), `today.spec.ts`, `transfer-offer.spec.ts` (revised) — red first; 19 mutants caught | done (X1, Entry 134); nothing heard; L113's coping part and the practice row's place for the reviewer (Questions 1 and 2) |

And in the file lists:

- `session-run.spec.ts`: "Today's session run at 342 × 740 (X1): two drills ended and two pieces played with the transition after each, Continue after a reload mid-activity, the finish line; the tablet; the reading slot's phrase heard at noon from the card, rechecked and repurposed in the evening."
- `sessionRun.test.ts`: "the session record's state machine and store (X1): start, next, skip, move on, finish, choose, swap, time; every write validated by id, version and token; corrupt records discarded; two tabs; another day; recomposed."
- `sessionAdaptation.test.ts`: "the runner's two bounded adaptations (X1) and the stored-run readers."
- `sessionRecheck.test.ts`: "a first-contact activity rechecked at its start through the session's one contact reader (X1): heard at noon means repurposed; this visit's viewing and an id-only row hold."
- `sessionRunNeverEvidence.test.ts`: "no evidence, rung-state or progress reader reads the session record, and a whole session changes nothing they read (X1)."
- `todaySessionRun.test.ts`: "Today runs the session (X1): Start, Continue, the running card, choose, swap, the finish line, an early end, another day, Shuffle, a corrupt record, U73, U71, Part 20's cases."
- `sessionTransition.test.ts`: "the transition on a finished activity's sheet (X1)."
- `sessionClock.test.ts`: "visible time only (X1)."
- `sessionProtocol.test.ts`: "every composed guided slot opens as a Score run or a drill and carries its contact; the route's token; G61; U71; U57 (X1)."
