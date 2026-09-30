# U96a — Answered means answered: the drill sheet's *Answered N of M* counts the set's cards closed as answers, a skipped card among them as the drill counts it, and correctness stays in *Accuracy*; the placement question screen's one-filled-box check counts the app's own class (a narrow fix-forward of the reviewer's required change and U103 under 788427c, dispatched with a for-information line to the reviewer; the U96 review, `responses/c48857ca.md`; Entry 161; app only; U102 follows as Entry 162)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/reviewer-context.md:144–150` (the policy: a narrow fix-forward or test-harness repair proceeds from the accepted contract without another pre-build round). `docs/review/responses/c48857ca.md` whole. The contract is its REQUIRED CHANGE (:20–38) and U103 (:56–60). The required change, verbatim (:28–31):
> - if the line says **Answered**, its numerator must be the number of cards actually answered/closed as answers;
> - correctness belongs in Accuracy or a `Correct` statistic, not in `Answered`;
> - an unanswered set may continue to say `Answered 0 of N` because that is a truthful observation even though no accuracy was measured;
> - a skipped card should follow the drill's existing semantics: if the model counts skip as an answered wrong card, the Answered numerator should count it consistently.

The three adversaries, verbatim (:33–36):
> 1. 4 answered, 3 correct -> `Answered 4 of N`;
> 2. 0 answered -> `Answered 0 of N`, no Accuracy;
> 3. skipped card -> the displayed answered count matches the record's own answered semantics.

and (:38): *"Do not merely relabel the current numerator `Correct` if that would leave the sheet without the useful “how much of the set did I actually attempt?” fact. The app already has an answer count; display that truth."* U103 (:58): *"remove or correct the stale assertion rather than leaving a permanently-green placebo."* The rest of the context:
- **U96.** `docs/prompts/entry-152.md`: :20, the drill-sheet mechanism; :51, a skipped card is not unanswered, since it counts as a wrong answer; Follow-ups 1–3 at :62–68, namely the record's accuracy 0 (U102), *Answered* printing `correct of total` (four answered with three right reads *Answered 3 of 10*; ten skipped cards read *Answered 0 of 10*), and the placebo. Also `docs/review/handoffs/c48857ca.md:15–19` and `docs/prompts/tasks/U96-session-sheets-say-what-was-measured.md`.
- **`app/src/ui/screens/DrillScreen.ts`.** `drillOutcome` (:251–270; `answered === 0` judged and not passed, :258); the running counter (:2325–2332, `at of total · correct right`, correctly worded); `finish()` (:2408 onward; `unanswered` :2512; the heading and note, U96's, :2513–2536); `keep()` (:2603–2642; what the record stores: `accuracy` :2623, `wrongNotes: answered − correct` :2627, `missed: max(0, total − answered)` :2628, `drillOutcomeOf(outcome, result.answered)` :2641); `statSheet` (:2644–2685: the row is `['Answered', correct of (total || answered)]` at :2659, so the numerator reads right answers, as the reviewer says; `Accuracy` at :2664). Also *Skip* → `advance()` (:2262, :1231) and the placement's Pass and Fail (:3024–3038: Pass `variant: 'primary'`, Fail the default).
- **The models' own counts** (the six judged `Drill` classes, found by searching `app/src/engine/drills` for `implements Drill`):
  - `PromptDrill.ts:72–89` (`next()` pushes an unanswered card as a wrong answer, "so skipping cannot quietly improve the score"), :130–146 (`answered = answers.length`, `accuracy = correct / answered`);
  - `harmony.ts:513–531` (`ChordDictationDrill`, `answered: settled.length`);
  - `special.ts`: `RhythmDrill` :164–185 (`answered: correct + this.extras` at :177, over `total: pattern.length`, with accuracy over the pattern at :179); `PedalDrill` :263–270, :293–325 (one settled change per chord, `answered: scored.length`); the half-pedal result :345–370 (`answered: held`, pedal messages, :360, whose comment at :357–359 says the screen prints `correct of answered`, while it prints `correct of total`); `DynamicsDrill` :449–466 (`answered` is the groups played, of `total: 2`);
  - `simon.ts:604–620` (`answered: this.answers.length` over `total: this.chain.length`, the cap), :151–184 (the three rungs; *After a miss* has `retryAfterMiss: true`, :174), :575–591 (a retried miss is pushed as an answer, :582).
- **`app/src/ui/widgets.ts:56–89`.** `button` gives the class `button button--${variant ?? 'secondary'}` (:76–79). No `btn--` class exists in `app/src` or `app/index.html`.
- **Tests.**
  - `app/tests/unit/drillSheetsSayWhatWasMeasured.test.ts` whole. Its harness: the real screen in jsdom over a real session record, with `recordRunSpy` at :91–113 and `answerOne` at :187–192. Its cases: :209–238 (unanswered note-flash, alone and in a session); :240–262 (dynamics and Simon unanswered, `stats()` `['answered']` at :251, :260); :264–275 (one answer, with `/^[01] of \d+$/` at :272); :277–300 (the placement's end sheet).
  - `app/tests/e2e/modes-placement.spec.ts:64–80` (the placebo, :72–75: `el.classList.contains('btn--primary')`, then `≤ 1`) and :79 (*Be strict*).
  - `app/tests/e2e/session-run.spec.ts:212–234` (U96's unanswered case, `0 of N` at :223) and :236–256 (U96's direct assertion: the placement *end sheet* in a session, one `.button--primary`, :254–255).
  - `app/tests/e2e/drills-review.spec.ts:474–482` (Simon: `data-chain` and `data-best` at :478–479, then `[data-stat="answered"]` containing the chain length at :482).
  - `app/tests/unit/backingTrackSheet.test.ts:129` and `app/tests/e2e/drills.spec.ts:161` (no *Answered* for a kind that judges nothing).

## What is decided

1. **The goal.** The reviewer's words: "`Answered` must count answers, not correct answers … The app already has an answer count; display that truth." Mine: the line a learner reads as *how much of the set did I do* says exactly that, as the drill itself counted it; *how much was right* stays where it is, in *Accuracy*; and a line whose two numbers count different things is not printed at all.
2. **The numerator.** In `statSheet` (:2659), the *Answered* row reads `result.answered` of `result.total || result.answered`. That is the model's own count, a skipped card included wherever the model counts it, and the denominator is unchanged. `Accuracy` (:2664) is unchanged, and so is U96's unanswered branch (`Answered 0 of N` and nothing else). This holds for every judged kind whose `answered` counts the set's prompts closed, bounded by `total` by construction. Confirm each at its `result()`:
   - `PromptDrill`, every prompt kind: one answer per card, and a skip is a wrong answer (:72–82);
   - `ChordDictationDrill`: settled progressions;
   - `PedalDrill`: one change per chord after the first, and a chord with nothing played is an unclean change;
   - `DynamicsDrill`: groups played, of two.
3. **Where the model's `answered` does not count the set's cards, no *Answered* row.** The reviewer's premise, *"The app already has an answer count"*, holds for the kinds in item 2 and fails at the line for two more:
   - `RhythmDrill` counts taps: its `answered` is `correct + this.extras` (`special.ts:177`), over the pattern's onsets, so a learner with a few extra taps would read *Answered 10 of 8*;
   - `SimonDrill` counts attempts: `answers.length` over the chain's cap (`simon.ts:611–612`), and on the *After a miss* rung each retried miss is another answer (:174, :582), so the attempts can pass the cap.

   Printing `correct` under *Answered* is the fault being fixed. Printing `answered` would be a fraction of unlike things. So for these two kinds the row is not printed, answered or not. What each measured stays on its sheet: rhythm's *Accuracy* over the pattern (:179) and its own rows (extra taps, mean offset), and Simon's chain line (`04` §5c: *"Simon is scored on its chain, not on an accuracy"*). On an unanswered set of either kind, the sheet is the heading and the reason, with no number. The half-pedal result (`answered: held`, :360) is built by nothing in `app/src` outside `special.ts` (a search for `halfPedalRange`): leave it, say so, and apply this rule if you find it reachable. This is the one choice the reviewer's words did not settle; it is decided here, with the reason, and the handoff names it.
4. **Red first, unit.** In `drillSheetsSayWhatWasMeasured.test.ts`, in its harness and with soft assertions as U96 wrote them, the three adversaries. `N` is the set's own total, read off the screen, never a constant.
   - (1) **4 answered, 3 correct.** On note-flash, three answers with `answerOne` and one wrong (a key outside `data-expects`), then *End drill*: `[data-stat="answered"]` reads `4 of N` and `[data-stat="accuracy"]` reads `75%`. Red on the committed code at `3 of N`.
   - (2) **0 answered.** `Answered 0 of N` and no *Accuracy*. U96's case (:209–226) already holds this; keep it as the regression, green on the committed code by design, and say so.
   - (3) **A skipped card.** One card skipped (`#drill-skip`) and two answered, one of them right, then *End drill* and *Count this set* (`#drill-keep`). The sheet reads `Answered 3 of N` and *Accuracy* `33%`. The record's payload (`recordRunSpy`) has `missed === N − 3` and `wrongNotes === 2`, because the record's answered is `total − missed`, skips included (`keep()`, :2627–2628). Then every card skipped until the set runs out, which records itself (`finish`, :2593): `Answered N of N`, *Accuracy* `0%`, *Not passed yet* (U96's reading, approved: skips are judged wrong, not unanswered), and a payload with `missed 0` and `wrongNotes N`. Red on the committed code at `1 of N` and `0 of N`.
   - **Item 3's two kinds.** No *Answered* row on a rhythm set or a Simon set, answered or not. The harness reaches Simon (:254); for rhythm, add a `RhythmDrill` item in the harness's pattern, and if the harness cannot drive it, say so and cover it with the picture. Red on the committed code.
   - **The record unchanged.** For every adversary, the `recordRunSpy` payload is identical on the committed code and on the change: U96a changes what the sheet says, never what is stored (U102's line).
5. **The tests that read the old numerator, revised with the reason** (class *revise*):
   - `drillSheetsSayWhatWasMeasured.test.ts:272`: `/^[01] of \d+$/` becomes `1 of N`. It tolerated a numerator that counted right answers.
   - :260: Simon's `['answered']` becomes `[]` (item 3). The dynamics case at :251 keeps `['answered']`.
   - `drills-review.spec.ts:482`: the *Answered* assertion is removed. The row it read printed the chain under *Answered*, and the chain is asserted at :478–479.
   - Kept as they are: `session-run.spec.ts:223`, `backingTrackSheet.test.ts:129`, `drills.spec.ts:161`.

   Search `app/tests` for `data-stat="answered"` and *Answered* again on your base, and state the scope. At this brief's base those five places and U96's file are all that read them.
6. **U103: correct the placebo; do not remove it.** `modes-placement.spec.ts:72–75` counts `btn--primary`, a class that exists nowhere in `app/src`, so *"there is exactly one filled box on this screen"* counts nought and cannot fail. The reviewer's reason for letting it go, *"U96's new direct assertion supplies the real coverage now"*, holds for the placement's **end sheet in a session** (`session-run.spec.ts:236–256`). It does not hold here. This check is on the placement **question** screen outside a session, Pass against Fail. A search of `app/tests` for the two ids finds no other assertion of their weight (repeat it and state the scope), so removing the check would leave that screen's `04` §0 R3 rule unwatched. The corrected assertion: exactly one visible `.button--primary` in `section[data-screen="drill"]`, and it is `#drill-placement-pass`; `#drill-placement-fail` has `button--secondary`, and the comment above says so. Show that it can fail: run it once against a lane-only mutant (Fail built with `variant: 'primary'`, put back by sha256), see it red, and record the red line. If the corrected count is not one on the unmutated app, stop at that finding, report the filled boxes' ids, and leave the assertion out of the diff: the screen is not U96a's. The *1 of 8* counter, the *Be strict* hint (:79) and the spacing between the transition and *Start here* stay (the reviewer, :60).
7. **The hypothesis, and when to deviate** (`operating-procedure.md` §13). I hold that the fault is one field in one row: `statSheet` reads `result.correct` where the model already carries `result.answered`, and every card kind's `answered` is bounded by its `total`. What would refute it: a kind in item 2 whose `answered` passes `total` in a reachable run, or a kind in item 3 whose model does count the set's prompts somewhere you can read without new arithmetic in the sheet. In either case, move the kind across, say which, and give the line. Deviate if the reviewer's semantics and a model disagree in a way item 3 does not cover: apply its reason, that the two numbers must count the same thing, and record it.
8. **Not U96a's:**
   - **U102**, the persisted record's accuracy 0 for a set with nothing answered (`responses/c48857ca.md:40–54`), is its own lane after U96a, Entry 162. U96a must not change `keep()` (:2603–2642), `drillOutcome` (:251–270), `drillOutcomeOf`, what is stored, or how Progress reads it.
   - Also left alone: U96's heading and note (:2513–2536), `finishPlacement` and its buttons, `sessionRunner.ts`, `help.ts` (no new words; *Answered* and *Accuracy* stay), and `engine/drills/**` (the models' counts are read, not changed).
   - **Recorded for U102's lane, not fixed:** a rhythm set's record undercounts misses. `missed` is `max(0, total − answered)` (:2628), and rhythm's `answered` includes extra taps (`special.ts:177`), so eight onsets with six hit and four extra taps store `missed 0`, though two onsets were missed. The half-pedal comment's claim about the screen (:357–359) is recorded too.

## Verification layers

Unit red first: item 4's cases on the committed `DrillScreen.ts`, with the red lines named. U96a adds no word to `help.ts`, so the committed sources build with the new tests: say if not. Then:
- `npx vitest run tests/unit/drillSheetsSayWhatWasMeasured.test.ts tests/unit/backingTrackSheet.test.ts` green;
- `npx tsc -b`;
- `npm run lint`, run with the port config absent (lint fails on that file alone, `entry-152.md` Follow-up 6).

The map: `python tools/docs/checks_for_paths.py <final changed paths>`, run for the final set, with what it prints. For `DrillScreen.ts`, the unit test and `modes-placement.spec.ts` at the base it prints `npx tsc -b`, `npm run lint`, `npx vitest run` (the whole unit suite), `npm run build:app`, and `drills-harmony.spec.ts drills-review.spec.ts drills.spec.ts feedback-placement.spec.ts modes-placement.spec.ts session-run.spec.ts tips.spec.ts`. The browser specs are only those the map names:
- each spec file checked to exist before the run;
- `--workers=2`, on port 4543, through `app/playwright.u96a-4543.config.ts`: a copy of `app/playwright.config.ts` with `baseURL` and `webServer` on 4543, and `storageState` pointed at `build/u96a/storageState-4543.json` (the fixture with its origin re-keyed to 4543, as U96 did);
- the config and the storage state not for the commit.

U103's red: the mutant run, one worker is enough, the mutant put back by sha256 with `git diff` on `DrillScreen.ts` then showing only item 2's and item 3's change. The whole unit suite's failures are each attributed and rerun alone: the recorded `lessonClaimsAboutApp` pair (Entry 101), the offline catalogue's names, load timeouts. None is inferred green. The pictures, at 342 × 740, go under `docs/prompts/pictures/u96a/`, before (committed build) and after:
- a note-flash set with four answered and three right (*Answered 3 of N* becoming *Answered 4 of N*);
- the skip case;
- a rhythm or a Simon sheet, the row gone;
- the placement question screen, unchanged, for the record.

They come from a lane-only picture spec: copied into `app/tests/e2e/` for its run and removed, kept as `runs/U96a/scripts-*.spec.ts`, writing under `test-results/`, the PNGs copied to `docs/` (U97). Nothing heard: the answers are screen-key taps.

## Rules and files

Base: `f6d36ee9`, origin's head when this brief was written. It holds U96's merge `ee481854` and G85's `760b8f61`; `app/src` and `app/tests` are identical there and at the main checkout's HEAD. The orchestrator restates the sha if origin has moved at dispatch.

You own:
- `app/src/ui/screens/DrillScreen.ts`, at `statSheet` and its comment only (:2644–2685);
- `app/tests/unit/drillSheetsSayWhatWasMeasured.test.ts`;
- `app/tests/e2e/modes-placement.spec.ts`, at :64–80;
- `app/tests/e2e/drills-review.spec.ts`, at :482 only;
- the pictures, and `docs/prompts/runs/U96a/`;
- `docs/04` §5c and `docs/08` rows in the entry's `## Doc rows`. Write them against U96's pending rows, which are not yet in `docs/04` at the base (`docs/04-ui-spec.md:2889–2905` holds no U96 sentence). Add what *Answered N of M* counts (the set's cards closed as answers, a skipped card among them, with *Accuracy* for how many were right) and the two kinds that print no *Answered* row. Add to `08`: `modes-placement.spec.ts`'s line (:295) gains the question screen's one filled box, and U96's unit-test line gains the adversaries.

Not yours: `keep()`, `drillOutcome`, `finish()`, `finishPlacement`, `sessionRunner.ts`, `help.ts`, `engine/drills/**`, `LibraryScreen.ts` (G85a), `projectSheet.ts`, `style.css` and `LessonScreen.ts` (G87), `session.ts` (G1e), `tools/content/**`.

The rules:
- Never name an AI model. Never assert a number measured on this machine.
- No commits, pushes, stashes, resets or checkouts. Temp state goes under the worktree's own `build/`. Nothing on port 4173. Never write in the main checkout.
- The fresh worktree is set up as G85's. `npm ci` in `app/`. `python tools/midi-cleanup/tests/parity_reference.py`. `python tools/content/build.py --offline` (Q24), with the caches it needs copied read-only from `C:\Users\yalir\repos\Piano Stuff\PianoProject`; if it cannot produce `app/public/content`, copy that folder from the main checkout and say so. Snapshot `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md` and `content/scores/imported/SOURCES.md` before the content build and restore them after; `git status` shows none of them.
- The disk is nearly full. When the run is over, delete your own `app/test-results`, `app/dist` and the copied caches (the copied `app/public/content` among them), after the pictures and captures are copied out. Keep no whole-suite log over 300 KB in the run folder: keep the summary and the failing names, and say the full log was not kept.

## Report

Judgement first. Show the sheet before and after at 342 × 740 (four answered with three right; the skip case; a rhythm or Simon sheet); item 3's choice in one line with its reason; U103's red line; unverified beside what passes, including whether *Answered N of N* after every card was skipped reads right to a learner, unverified as copy. Then Done / Not done / Follow-ups / Questions / Files, with every decided item done or an explicit not-done line. Then the red lines; the tests table with each test's class (add, revise, preserve) and the old assumption; exit codes; and `## Doc rows`. `operating-procedure.md` §11 and §12 apply. Entry 161. Every run file goes under `docs/prompts/runs/U96a/`, and the entry is `docs/prompts/runs/U96a/ENTRY.md`, starting `### Entry 161 — U96a`.
