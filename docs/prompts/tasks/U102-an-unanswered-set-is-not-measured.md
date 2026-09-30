# U102 — An unanswered drill set is not measured on the record either: a judged set with nothing answered is stored with its accuracy `not measured` and `answered: 0`, one stored reading every reader imports, Progress prints *Not measured*, and a rhythm set's record counts the onsets it missed (the U96 review's required follow-up, `responses/c48857ca.md`:40–54, with U104's rhythm undercount at the same write; Entry 162; app only; a required follow-up the reviewer specified, sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first))

**Read first**

Procedure and the contract:
- `docs/prompts/operating-procedure.md` §1–§5 and §11–§13.
- `docs/review/reviewer-context.md:144–150` (the policy: bounded work under an accepted ruling proceeds without another pre-build round).
- `docs/review/responses/c48857ca.md` whole. Its U102 section, :40–54, is quoted in item 1.

Backlog rows and the earlier lanes:
- `docs/prompts/views/backlog/U.md:163` (U102, ruled) and :164 (U103).
- U104 is not in `U.md` at drafting: `docs/**/*.md` searched at the main checkout's HEAD, 7fb976cb, and at origin's 6e9023b8. Its text comes from the orchestrator's U96a handoff note and is quoted in item 4.
- U96, `docs/prompts/entry-152.md`:
  - :18–22, the mechanism;
  - :51, a skipped card is not unanswered;
  - :60–66, Follow-up 1 with the probe: `docs/prompts/runs/U96/probe-record-of-unanswered-set.txt` and its script `scripts-zzU96RecordProbe.test.ts`.
- U96a, `docs/prompts/tasks/U96a-answered-means-answered.md`:
  - item 3: rhythm's `answered` counts taps, Simon's counts attempts;
  - item 8: *"Recorded for U102's lane, not fixed: a rhythm set's record undercounts misses"*.

`app/src/ui/screens/DrillScreen.ts`:
- :227–240: `UNJUDGED_DRILL_KINDS` and `measuresARun`.
- :242–270: `drillOutcome`, with `answered === 0` judged at :258.
- :2357–2386: `showCoaching`, whose history filter is at :2368–2372.
- :2408–2594: `finish`. `unanswered` is at :2512, *Count this set* at :2447–2456, and a set that ran out keeps itself at :2593.
- :2596–2642: `keep`. The accuracy is at :2623, `accuracyEstimated` at :2626, `wrongNotes` at :2627, `missed` at :2628, and `completeSession` at :2641.
- :2644–2700: `statSheet`, as U96a left it. Not yours.
- The writers for kinds that judge nothing, each storing `NOT_MEASURED`: the checklist at :2927–2950, the placement at :3120–3145, the walkthrough at :3450–3470.

Engine and models (read, not changed):
- `app/src/engine/types.ts:362–363`: `NOT_MEASURED`.
- `app/src/engine/drills/types.ts:202–213` (`DrillResult`) and :215–240 (`worthRecording`).
- The models' counts:
  - `PromptDrill.ts:72–89` (a skip is a wrong answer) and :128–146 (`accuracy` :141; `correct` leaves out revealed cards, :130);
  - `harmony.ts:513–531`;
  - `special.ts`: rhythm :164–185 (`answered` :177, accuracy :179, one `answers` entry per onset :166–171), pedal :293–325, dynamics :449–466, the backing track :568–577;
  - `simon.ts:604–620`.

The store:
- `app/src/data/db.ts`:
  - :36–45: C1's rule. An optional field on a value is not a version, and the upgrade has nothing to do.
  - :243: the same rule, restated for `generator`.
  - :271–297: `isPhraseRun`, the precedent for one row classifier that every reader imports.
  - :342–383: `RunObservation`.
  - :385–449: `SessionRow`, with `accuracy: number | NotMeasured` at :390–396.
  - :900–912: why rows are not rewritten inside an upgrade.
- `app/src/data/progressStore.ts`:
  - :45–75: `RunResult`;
  - :175–260: `recordRun`, whose best accuracy skips `not measured` at :218–222;
  - :361–373: `sessionRowFor`, which drops keys whose value is `undefined`.
- `app/src/data/sessionRun.ts:476–506`: `scoreOutcome` and `drillOutcomeOf`.
- `app/src/data/backup.ts:298–303`: a restored session row is kept whole.

The readers:
- `app/src/evidence/rungState.ts`: :183–200 (`measured`, `meetsStandard`) and :353–364 (`done`).
- `app/src/evidence/measurement.ts:12–17`: a row with no measures block measures nothing. That covers every drill row.
- `app/src/ui/screens/ProgressScreen.ts:140–194`: `historyDetail`. At :182–185 a `NOT_MEASURED` accuracy prints *Not judged*; at :187–194 a number prints as a share.
- `app/src/ui/help.ts`: :214–231 (T40's `SUMMARY_TEXT.notMeasuredHeading`, and U96's `notAnswered`) and :405–428 (`HISTORY_TEXT`: `notMeasured` :415, `notJudged` :420).

Docs:
- `docs/01-architecture.md:253` (the sessions store) and :301–303 (*"Not measured is a value"*).
- `docs/04-ui-spec.md:3585–3591` (§6, what a history line says).
- `docs/08-test-map.md:24`, :312 and :556.

Tests:
- `app/tests/unit/drillSheetsSayWhatWasMeasured.test.ts`, U96's and U96a's harness:
  - the items: `flashItem` :35, `dynamicsItem` :49, `rhythmItem` :77;
  - the mocks and `recordRunSpy`: :112–142;
  - `mount`: :184;
  - `lastRecord`: :249–254;
  - U96a's record assertions: :372–375, :391–392, :406–407, :421.
- `app/tests/unit/progressHistoryLines.test.ts`: :82–132, and :154 onward (every history word is in the spec).
- `app/tests/unit/sessionAdaptation.test.ts` (`drillOutcomeOf`).
- `app/tests/e2e/progress.spec.ts:61–86`.
- `app/tests/e2e/session-run.spec.ts:212–234`.

## What is decided

1. **The contract, verbatim** (`responses/c48857ca.md:40–54`):

   > ## U102 — record truth must follow
   >
   > **U102 is required follow-up work, but it does not need to reopen U96 once the sheet stat above is fixed.**
   >
   > The persisted record currently storing accuracy 0 for a set with zero answers means the app can say `Not measured` on the end sheet and later say `0%` in Progress for the same event. That violates the architecture's separation between “not observed” and “observed failure.”
   >
   > The owning fix should be at the stored observation/result truth, not a Progress-only cosmetic exception if the record itself claims a measured zero.
   >
   > Preferred contract:
   >
   > - zero answered -> accuracy/result quality is **not measured / absent**, while `answered = 0` remains recorded;
   > - one or more answered -> accuracy is measured normally;
   > - downstream Progress/evidence/session readers consume that distinction rather than reconstructing it from UI wording.
   >
   > If changing the durable row schema is disproportionately invasive, a derived result may encode the distinction from `answered === 0`, but there must be one authoritative interpretation shared by Progress/evidence rather than screen-specific patches.

   **The goal, in my words.** A set in which the learner answered nothing is, everywhere the app later reads it, a set that measured nothing. The sheet already says this. The record, the history line, the rung standard and the practice advice must say it too. A set in which they answered and got everything wrong stays an observed failure.

2. **Premises, checked at the line.**
   - **The record today.** `keep()` decides between measured and not measured on `judged` alone: `accuracy: judged ? result.accuracy : NOT_MEASURED` (:2623). An unanswered set is judged (`drillOutcome`, :258). So *End drill* then *Count this set* stores `{"accuracy":0,"wrongNotes":0,"missed":10,"passed":false}`, and a loud-and-soft set that runs out with nothing played records itself with accuracy 0 (U96's probe). The row carries no `answered`: the answered count is implied only by `missed` (`total − answered`, :2628), and `total` is not stored.
   - **What the stored row does with an absent accuracy today.** `accuracy` is required and typed `number | NotMeasured` (db.ts:396; RunResult, progressStore.ts:57). Absent is spelt `NOT_MEASURED` (`'not measured'`, engine/types.ts:362).
     - It is written today by `keep()` for the kinds that judge nothing, and by the checklist, placement and walkthrough writers.
     - Progress prints it as *Not judged* (ProgressScreen.ts:182–185).
     - `rungState.measured` counts it as unmeasured (:184–191).
     - `recordRun` leaves the best alone (:220).
     - A literal `undefined` is outside the type. If one got through, `sessionRowFor` would drop the key (progressStore.ts:364–366), and Progress would then print `NaN%` (:188). **So "absent" here means `NOT_MEASURED`, never `undefined`.**
   - **The readers of a stored drill row's accuracy.** Scope: `app/src`, searched for `.accuracy` read off a row, run or session, and for `accuracy * 100`.
     - `ProgressScreen.historyDetail` (:182–194).
     - `rungState.measured`, `meetsStandard` and `done` (:184–200, :353–364).
     - The coaching history in `showCoaching` (:2368–2372). A stored 0 there joins the plateau rule as a real 0.
     - `recordRun`'s best (:220), which reads the live result, not the stored row.
     - The evidence functions (`evidence/evidence.ts`, `measurement.ts`, `readingState.ts`, `ladder.ts`, `demandReadings.ts`) read no drill row's accuracy: a row with no measures block measures nothing (measurement.ts:12–17).
     - The session's adaptation reads the activity's outcome, which `drillOutcomeOf` already makes `unknown` for `answered === 0` (sessionRun.ts:503–506), from the live result.
     - The session composer (`curriculum/session.ts`, `candidates.ts`) reads no row accuracy.

3. **The contract's shape: durable, over the derived-only fallback.** The reason: the schema already carries `not measured` (C1), and an optional field costs no `DB_VERSION` and no upgrade (db.ts:36–45, :243). The reviewer's preferred contract is therefore not *"disproportionately invasive"*.
   - **The writer.** In `keep()`, for a kind that judges:
     - `answered === 0` stores `accuracy: NOT_MEASURED`, `wrongNotes: 0`, `missed` as the set's unanswered count, `answered: 0`, `passed: false` and `masterEligible: false`;
     - `answered ≥ 1` stores the accuracy as it does now.
   - **`missed` stays a number.** `rungState`'s `done` reads `missed === 0` beside an unmeasured accuracy as *finished* (:355–364). An unanswered set keeps its unanswered count there, never 0; `worthRecording` guarantees at least one card.
   - **The new field.** Every judged drill row gains an optional `answered` on `RunResult` and `SessionRow`, with its meaning in the comment. Its value is the model's own count, the verdict's fact (`drillOutcome`, :258). Its unit is the kind's: cards; taps on a rhythm set; attempts on a Simon set (U96a item 3; `statSheet`'s comment, :2650–2667). Readers read only `=== 0`. A kind that judges nothing writes none; it has `notesHeard`.
   - **A pure mapping.** `keep()`'s mapping from `(result, outcome)` to the row's accuracy, `wrongNotes`, `missed` and `answered` becomes one exported pure function beside `drillOutcome`, which `DrillScreen.ts` already exports for its tests. `keep()` calls it, and the cases run on `DrillResult` literals.
   - **One stored reading.** A single function in the data layer answers, for a stored row or for a run about to be stored, one of three things: *measured* (with the accuracy), *not measured: nothing answered*, or *not judged*. Put it in a module of its own under `app/src/data/`, or beside `isPhraseRun` in `db.ts`; choose, and say why.
     - It reads `answered === 0` where the field is present.
     - On a row without the field, the tolerance in item 5 applies.
     - `UNJUDGED_DRILL_KINDS` moves into that module, and `DrillScreen` imports it back for :239 and :257. The data layer imports no screen. `engine/drills/**` is not touched: the map would name the engine's specs for it.
   - **The readers that import it.**
     - `historyDetail`.
     - `rungState.measured`, so that `meetsStandard` reads no zero that measured nothing.
     - `showCoaching`'s history filter (:2368–2372).
     - `drillOutcomeOf`, which shares the live predicate with its behaviour unchanged.
     - `recordRun`'s best is left as it is: it already skips `not measured`.

4. **U104's rhythm undercount, at the same write — only if it is truly the same write boundary, with its own adversary showing extra taps do not erase missed onsets; never a general rhythm-scoring rewrite** (the reviewer's guard, `responses/questions-bbd7f99a.md`). The row, as the orchestrator drafted it: *"After U96a: a rhythm record undercounts misses (`missed = max(0, total − answered)` with extra taps inside `answered`: one missed onset stored as missed 0, wrongNotes 3) — U102's lane; the coaching line* Fast, but N% right … speed built on guessing *appears on a set of skips (mean reaction 0) and on rhythm, whose `meanReactionMs` is the offset from the beat; Simon's* Accuracy 8% *beside its Answered row though `04` §5c says Simon is not scored on accuracy; the keys under the Simon sheet read C1/C2 … — U102 takes the rhythm record"*.
   - **The mechanism.** The rhythm model's `answered` is hits plus extra taps (special.ts:177), and its `answers` are its onsets (:166–171). So `missed = max(0, total − answered)` stores 0 for eight onsets with six hit and four extra taps.
   - **Decided for a rhythm row:**
     - `missed` is the onsets not hit, `total − correct`;
     - `wrongNotes` is the extra taps, `answered − correct`, unchanged;
     - the accuracy is unchanged: the onsets hit, over the pattern (:179).
   - **Other kinds' `missed`** is unchanged: their `answered` counts cards and is bounded by `total` (U96a item 2).
   - **Not U102's:**
     - Simon's `missed` once retried attempts pass the cap; record it if you find it wrong.
     - U104's other items: the coaching line on skips and on rhythm, Simon's accuracy line, and the C1/C2 keys.

5. **Rows already stored with 0: the reviewer's compatibility order, never a two-field inference** (`responses/questions-bbd7f99a.md`: *absence of wrong notes is not proof of absence of answers*; the first draft's rule — accuracy 0 with wrong notes 0 means nothing was answered — is withdrawn).
   - **Why not a migration.** It would rewrite the one store that cannot be regenerated (`keep()`'s own comment, :2596–2601) and would need an upgrade (db.ts:900–912 is the precedent against rewriting rows inside one).
   - **The order, in the one reader every consumer imports:** (1) a row with `answered` is authoritative: `answered === 0` reads *not measured*, otherwise measured; (2) an old row with a field that directly records attempts or the answered count (say which field, verified at the writer's history with `git log -S`) reads from that field; (3) an old row of a drill kind with an invariant that *provably* distinguishes zero attempts — proved at the kind's writer for every version of it that ever wrote rows, the proof in the entry — may read from that narrow kind-specific invariant; (4) otherwise the old `0%` stays as it is, legacy ambiguity, never rewritten and never reinterpreted as *not measured*. Where no safe discriminator exists for a kind, the old row is tolerated as-is and truth is fixed going forward.
   - **Adversaries for the reader:** a new row `answered: 0` → not measured; a new row `answered: 3, accuracy: 0` → measured 0 %; an old row with no `answered`, accuracy 0 and `wrongNotes` 0 of a kind with no proven invariant → still 0 % (the withdrawn rule must not fire); an old row of a kind with a proven invariant → the invariant's reading, with the proof cited in the test's comment.
   - **Backups.** A backup restores rows whole (backup.ts:298–303), so a restored old row is read by the same order.

6. **Progress's words.** A drill row with nothing answered gets `HISTORY_TEXT.notMeasured`: *Not measured* (help.ts:415). That is T40's word, and the sheet's heading since U96.
   - *Not judged* stays for a kind that judges nothing.
   - The line is *Not measured · 1 min*: lead, flags and minutes, as `historyDetail` builds it. No `%`.
   - No new word. If the comment on `HISTORY_TEXT.notMeasured` must widen, that one comment line is the only `help.ts` change. A new word is a Question, not built.
   - The words test (progressHistoryLines.test.ts:154 onward) stays green.

7. **Red first, unit.** Use a new unit file of its own (for example `app/tests/unit/unansweredSetOnTheRecord.test.ts`), with the harness pattern copied from `drillSheetsSayWhatWasMeasured.test.ts`. That file is U96a's and is under review, so it is not edited.
   - **The mapping, on `DrillResult` literals:**
     - (a) note-flash, ten cards, none answered → not measured, `answered` 0, `wrongNotes` 0, `missed` 10;
     - (b) four answered, three right → 0.75, `answered` 4, `wrongNotes` 1, `missed` 6. A guard: green before and after, except the new field;
     - (c) ten cards skipped (`answered` 10, `correct` 0) → accuracy 0, measured, `wrongNotes` 10, `missed` 0. U96's approved reading: a skip is an answer;
     - (d) rhythm, eight onsets, six hit, four extra taps → 0.75, `answered` 10, `wrongNotes` 4, `missed` 2. Red on the committed arithmetic: `missed` 0;
     - (e) rhythm, no tap → not measured, `answered` 0, `missed` 8;
     - (f) rhythm, three extra taps and no hit → accuracy 0, measured: the learner tapped, off the beat, which is an observed failure. `answered` 3, `wrongNotes` 3, `missed` 8;
     - (g) dynamics with nothing played, and Simon with nothing answered → not measured;
     - (h) a backing track → not judged, as now: no `answered`, and `notesHeard` kept.
   - **Through the screen, with the harness:**
     - (i) *End drill* at once, then *Count this set*. The payload (`lastRecord`) has accuracy `not measured`, `answered` 0, and `missed` equal to N, read off the screen. Red on the committed code: accuracy 0.
     - (j) A loud-and-soft set that runs out with nothing played records itself with the same shape (U96's second probe case).
   - **The stored reading:**
     - (k) A new unanswered row → not measured.
     - A legacy row (accuracy 0, `wrongNotes` 0, `missed` 10, mode `drill:note-flash`, no `answered`) → *not measured* only if proved; otherwise the legacy 0 %. **Proof-dependent, on the reviewer's word (`responses/questions-ecccffb7.md`):** this row reads *not measured* only if the builder proves, for every historical note-flash writer, that `missed === total` can occur only when zero cards were answered; if the proof fails or is incomplete, the expected result is the legacy measured/ambiguous 0 %, not *Not measured* — the same compatibility rule, not a new requirement.
     - A legacy measured failure (accuracy 0, `wrongNotes` 3) → measured, 0.
     - A backing-track, checklist, placement or walkthrough row → not judged.
     - A Score-screen run at accuracy 0 → measured: the tolerance is for drill rows only.
   - **The readers:**
     - (l) `historyDetail`. A new unanswered row and a legacy one each read *Not measured · 1 min*. Red on the committed code: *Not judged · 1 min* and *0% · 1 min*. A backing track keeps *Not judged · …*, and a measured 0 % drill keeps *0% · 1 min*. Put these in `progressHistoryLines.test.ts`, with its seeding pattern, or in the new file.
     - (m) `rungState`. An unanswered row, new or legacy, is not measured: `meetsStandard` is false, and `done` stays unheld (`missed` N).
     - (n) The coaching history. A legacy unanswered row is not in the plateau's recent list.
     - (o) `drillOutcomeOf` is unchanged: `sessionAdaptation.test.ts` stays green.
   - **Record which cases are red** on the committed code, with their red lines, and which are guards, green by design.

8. **The browser case and the pictures.**
   - **The case,** in `progress.spec.ts`: open a drill of a judging kind outside a session; find a catalogue id the offline build carries. *End drill*, *Count this set*, then open Progress. The history line for that drill reads *Not measured* and contains no `%`.
   - **The pictures,** at 342 × 740 under `docs/prompts/pictures/u102/`, before (the committed build) and after:
     - the Progress history after the unanswered set;
     - the drill sheet, unchanged, for the record.
   - Take them from a lane-only picture spec (U96a's pattern): copied into `app/tests/e2e/` for its run and removed afterwards, kept as `runs/U102/scripts-*.spec.ts`, writing under `test-results/`, with the PNGs copied out to `docs/`.

9. **The tests that encode the old record, revised with the reason.**
   - Search `app/tests` for an unanswered drill row stored or read as accuracy 0 (`accuracy: 0` beside `wrongNotes: 0` on a `drill:` mode), and for *Not judged* on a judging drill. State the scope.
   - Revise each one found, with its class and its old assumption.
   - U96a's record assertions (card kinds' `missed` and `wrongNotes`, drillSheetsSayWhatWasMeasured.test.ts:372–375, :391–392, :406–407, :421) hold unchanged: class *preserve*.

10. **Not U102's:**
    - `statSheet` and U96a's cases and harness file;
    - `finish()`'s heading and note (U96);
    - the drills' scoring: `engine/drills/**` is read, not changed;
    - `help.ts` words;
    - `coach()` and its line on skips and rhythm (U104);
    - Simon's accuracy line (U104);
    - `sessionRunner.ts`;
    - the evidence functions, which read no drill accuracy;
    - `recordRun`'s pass, mastery and best logic;
    - `DB_VERSION`, `backup.ts`, `ScoreScreen.ts`, `LibraryScreen.ts`.

    **The base and U96a.** At drafting, origin's head 6e9023b8 holds U96a (0685c9e2, merged at dec467c1), so `statSheet` there is U96a's. If the base the orchestrator states predates it, `statSheet` and U96a's cases are absent. Either way, do not touch `statSheet`: a U96b may follow U96a's review.

11. **The hypothesis, and when to deviate** (`operating-procedure.md` §13).
    - **The hypothesis.** I hold that the zero reaches Progress because `keep()` decides measured-or-not on `judged` alone (:2623), and every reader downstream takes a number for a measurement.
    - **The refuting test.** Case 7(i) green on the committed code. It will not be, if U96's probe still holds.
    - **When to deviate.**
      - If you find a reader outside the scope in item 2 that prints or counts the zero, fold it into the one reading and say where.
      - If the tolerance's derivation fails for a kind — a model where accuracy 0 and `wrongNotes` 0 can hold with something answered — narrow the tolerance and give the line.
      - If a premise here is wrong at the line, say so at the item and take the better path, with the reason.

## Verification layers

**Unit, red first:** item 7's cases on the committed code, with their red lines. Then:
- `npx vitest run` on the new file, `progressHistoryLines.test.ts`, `sessionAdaptation.test.ts` and `drillSheetsSayWhatWasMeasured.test.ts`, all green;
- `npx tsc -b`;
- `npm run lint`, with no port config inside `app/`.

**The map.** Run `python tools/docs/checks_for_paths.py <final changed paths>` for the final set and record what it prints. At drafting, for `DrillScreen.ts`, `ProgressScreen.ts`, `rungState.ts`, `sessionRun.ts`, `db.ts`, `progressStore.ts`, a new `app/src/data/` module, `progressHistoryLines.test.ts` and `progress.spec.ts`, it named:
- `npx tsc -b`, `npm run lint`, `npx vitest run` (the whole unit suite) and `npm run build:app`;
- these specs: `competence`, `converted-import`, `drills-harmony`, `drills-review`, `drills`, `feedback-placement`, `first-day`, `lab`, `lesson-flow`, `library`, `midi-import`, `modes-ladder`, `progress.hierarchy`, `progress`, `projects`, `score.ladder-route`, `score.screen`, `score.states`, `session-run`, `tips`, `today`, `transfer-offer` (`tests/e2e/<name>.spec.ts`).
- `db.ts` brings most of these. Touching `engine/drills/types.ts` would add the engine and mode specs, which is why the kinds list moves into the data layer instead.

**The browser specs:** only those the map names.
- Check that each spec file exists before the run: a path that resolves to no file is dropped silently.
- Run them at `--workers=2` on port 4637, through a copy of `app/playwright.config.ts` kept under `build/u102/`, not `app/`: `testDir` absolute, the webServer's cwd `app/`, baseURL and webServer on 4637, and `storageState` at `build/u102/storageState-4637.json` (the fixture re-keyed to the port, as U96 and U96a did).
- Nothing on port 4173.

**The whole unit suite's failures:** attribute each one, and rerun it alone. Expected: the recorded `lessonClaimsAboutApp` pair (Entry 101), the offline catalogue's missing pieces, and load timeouts. None is inferred green.

**The pictures:** item 8.

**The product layer:** the learner's Progress screen after a set they answered nothing in, at 342 × 740. The answers are screen-key taps; nothing is heard.

## Rules and files

**You own:**
- `app/src/ui/screens/DrillScreen.ts`: `keep()` (:2596–2642), the new pure mapping beside `drillOutcome`, the coaching history filter (:2368–2372), and the import of `UNJUDGED_DRILL_KINDS`;
- the stored-reading module, or its place in `db.ts`;
- the `answered` field and its comment on `RunResult` (progressStore.ts:45–75) and `SessionRow` (db.ts:385–449);
- `ProgressScreen.historyDetail` (:158–194);
- `rungState.measured` (:184–191);
- `sessionRun.drillOutcomeOf` (:503–506), with its behaviour unchanged;
- the new unit file;
- `progressHistoryLines.test.ts`, the cases added;
- `progress.spec.ts`, the case added;
- the pictures and `docs/prompts/runs/U102/`;
- in the entry's `## Doc rows`:
  - `docs/01` :253 and :301–303: a drill set with nothing answered stores its accuracy as *not measured*, beside `answered: 0`; stored rows are read by the tolerance;
  - `docs/04` §6 :3585–3591: *Not measured · 3 min* for such a set;
  - `docs/08` lines: :24, :556, :312, and the new unit file.

**Not yours:** everything item 10 names; `drillSheetsSayWhatWasMeasured.test.ts`; `modes-placement.spec.ts`; `drills-review.spec.ts`; `session-run.spec.ts` (run it, do not edit it); `tools/content/**`.

**Base:** origin's head at dispatch, as the orchestrator states it. At drafting that is 6e9023b8, with U96a merged. The files this brief names are the same there as in the main checkout's tree at 7fb976cb: the difference is six reviewer response files.

**The rules:**
- Never name an AI model. Never assert a number measured on this machine.
- No commits, pushes, stashes, resets or checkouts.
- Temp state goes under the worktree's own `build/`. Never write in the main checkout.
- **Fresh-worktree setup,** as U96a's:
  - `npm ci` in `app/`;
  - `python tools/midi-cleanup/tests/parity_reference.py`;
  - `python tools/content/build.py --offline` (Q24), with the caches it needs copied read-only from `C:\Users\yalir\repos\Piano Stuff\PianoProject`. If it cannot produce `app/public/content`, copy that folder from the main checkout and say so;
  - snapshot `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md`, `content/scores/imported/SOURCES.md` and `docs/generated/ladder.md` before the content build, and restore them after. `git status` should show none of them.
- **The disk is nearly full.**
  - When the run is over, after the pictures and captures are copied out, delete your own `app/test-results`, `app/dist`, `app/node_modules` and the copied caches, the copied `app/public/content` among them.
  - Keep no log over 300 KB in the run folder: keep the summary and the failing names, and say the full log was not kept.
- Every decided item done, or an explicit not-done line.

## Report

**Judgement first:**
- the Progress history line before and after, at 342 × 740, for a set answered not at all;
- what the record now stores, for the unanswered set and for the rhythm set with extra taps;
- the stored reading's three answers, and which readers import it;
- the tolerance's scope, as `git log -S` bounds it;
- the one choice of placement (a module, or `db.ts`) with its reason.

**Then Done / Not done / Follow-ups / Questions / Files,** every decided item done or with an explicit not-done line.
- Follow-ups: Simon's `missed` if you find it wrong, and U104's other items as recorded.
- Questions: any word the history line would need.

**Then the evidence:**
- the mechanism, the discriminating test and its red lines;
- the tests table, each test with its class (add, revise, preserve) and the old assumption;
- exit codes;
- what is unverified, beside what passes;
- `## Doc rows`.

`operating-procedure.md` §11 and §12 apply.

**Entry 162.** Every run file goes under `docs/prompts/runs/U102/`. The entry is `docs/prompts/runs/U102/ENTRY.md`, starting `### Entry 162 — U102`.

**Revise before dispatch 2026-09-30** (`responses/questions-bbd7f99a.md`). The durable contract is right: zero answered stores `accuracy: 'not measured'` with an explicit `answered: 0`; one or more answered is measured; Progress and evidence readers consume the distinction; no database-version bump for an optional field. The first draft's legacy inference (accuracy 0 with wrong notes 0 means nothing was answered) is withdrawn: absence of wrong notes is not proof of absence of answers. Compatibility order: an explicit `answered` first; then an existing field that directly records attempts; then a kind whose invariant provably distinguishes zero attempts; otherwise the old 0 % kept as legacy ambiguity. U104's rhythm miss count only at the same write boundary, with its own adversary. Revised at f663eae6; with the reviewer again before dispatch.

**Approved for dispatch 2026-09-30** (`responses/questions-ecccffb7.md`). The revised compatibility order matches the ruling: an explicit `answered` is authoritative; an older direct attempt or answer field only where its historical writer proves the meaning; a drill-kind invariant only where proven for every writer version that could have produced those rows; otherwise the legacy 0 % stays ambiguous. The durable new-row contract proceeds. Item 7(k) is proof-dependent: the legacy note-flash row reads *not measured* only if the builder proves, for every historical note-flash writer, that `missed === total` can occur only when zero cards were answered; if the proof fails or is incomplete, the expected result is the legacy measured/ambiguous 0 % — the same compatibility rule, not a new requirement. The rhythm miss repair is in, at the same stored-row mapping boundary with its discriminating adversary: `missed` = total onsets − correct hits; extra taps stay `wrongNotes` and never erase missed onsets. Every other U104 item (the coaching line, Simon's accuracy) stays out. Dispatched (Entry 162).

**Landed 2026-09-29** (Entry 162; 35efb10e, merged a0a8039b); handoff `handoffs/35efb10e.md`.

**Accepted 2026-09-30** (`responses/35efb10e.md`, APPROVE). The stored-row contract and the compatibility order right; both deviations approved; no other drill kind proved or reclassified now (demand-driven only); the *0 min* observation separate debt; U107 and U104 separate. U102 closes. Closed.

## Record

lane: U102 · closes: U102 · entry: 162
index: An unanswered drill set is not measured on the record either: zero answered stored as `not measured` with `answered: 0`, one reading every reader imports, Progress prints *Not measured*, and a rhythm record counts the onsets it missed (the U96 review's required follow-up) | evidence | **done 2026-09-29**, Entry 162; merged a0a8039b; handoff `handoffs/35efb10e.md`; **accepted 2026-09-30** (`responses/35efb10e.md`, APPROVE); closed |
in-flight: brief drafted 2026-09-30 (`U102-an-unanswered-set-is-not-measured.md`): the U96 review's required follow-up (`responses/c48857ca.md`): a judged set with nothing answered stored as `not measured` with `answered: 0`, one reading every reader imports, Progress prints *Not measured*; U104's rhythm undercount at the same write; sent to the reviewer before dispatch (Entry 162). **Revise before dispatch** 2026-09-30 (`responses/questions-bbd7f99a.md`): the durable contract right (zero answered → `'not measured'` with explicit `answered: 0`; no version bump); the two-field legacy inference withdrawn — compatibility order: explicit `answered`, then a recorded attempts field, then a provably distinguishing kind invariant, otherwise legacy ambiguity kept; U104 only at the same write boundary with its own adversary; **revised at f663eae6 and with the reviewer again before dispatch**. **Approved for dispatch** 2026-09-30 (`responses/questions-ecccffb7.md`): the revised compatibility order matches the ruling; item 7(k) proof-dependent — the legacy note-flash row reads *not measured* only if `missed === total` is proved to occur only with zero answered for every historical note-flash writer, otherwise the legacy measured/ambiguous 0 %; the rhythm miss repair at the same stored-row boundary with its adversary (`missed` = total onsets − correct hits; extra taps stay `wrongNotes`, never erase missed onsets); nothing else from U104. Dispatched (Entry 162). **Landed** 2026-09-29 (merged a0a8039b, chain green); handoff `handoffs/35efb10e.md`, with the reviewer. **Closed** 2026-09-30 (`responses/35efb10e.md`, APPROVE): the stored-row contract right — a judged drill with `answered: 0` not measured, one or more answers measured normally (a true 0 % included), unjudged kinds not judged, rhythm counting missed onsets apart from extra taps; `accuracyReading` a good boundary, `db.ts` gaining only the optional field, not the policy; the conservative compatibility order honoured — explicit `answered` wins for new rows, note-flash alone gets the historical inference because the invariant was proved across every relevant writer version, other old 0 % drill rows stay 0 % (historical ambiguity preferred to a manufactured *Not measured*); both deviations approved — the backing-track reading shared by rung state (the shipped curriculum impact nil; the tests keeping a measured drill 0 % and an unjudged backing-track zero distinct kept) and the explicit requirement accuracy 0 in case (m), the discriminating test; *Not measured* the right history line; no other drill kind proved or reclassified now for symmetry — only if the owner's real stored data holds such ambiguous rows and the distinction matters, or a later product task needs that historical reading; the *0 min* observation separate UI/product debt; U107 and U104's remaining items separate.
state: closed 2026-09-30: APPROVE (`responses/35efb10e.md`)
