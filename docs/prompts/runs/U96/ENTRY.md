### Entry 152 — U96 — the session's end sheets say only what was measured: a drill set nobody answered is *Not measured* with the reason and prints *Answered 0 of N* and no other number; the placement test's sheet in a session has one filled box, the transition's *Start*, with *Start here* outlined and still there (X1's follow-ups 2 and 4; P3) (2026-09-29)

Built on base `ea14b1fe` in the worktree `agent-a217e9f7b4bcda352`, under the brief `docs/prompts/tasks/U96-session-sheets-say-what-was-measured.md` (copied into this tree from the main checkout). Every capture is in `docs/prompts/runs/U96/`: each run's `.txt` starts with its command and ends with `exit=<code>`, except `vitest-compare.txt`'s body (a script's). The pictures are in `docs/prompts/pictures/u96/`, named `<before|after>-<scene>-342x740.png`. Nothing committed, staged, stashed or checked out. **Nothing was heard**: every browser run is taps on the screen keys or the placement's Pass/Fail buttons, and nothing here is music.

## Judgement

I looked at both sheets at 342 × 740, before and after, as a learner meets them inside a session (the app built from this tree, `session-run.spec.ts`'s two new cases), and read every picture.

- **A drill ended before any answer, in a session** (a learner placed at 1.1 presses *Start session*; the first activity, *Right-hand five-finger walk*, is ended with *End drill* at once).
  - **Before** (`before-drill-ended-early-sheet-342x740.png`): **Not passed yet** with a *keep going* badge, then *Accuracy 0%* and *Answered 0 of 4*. Two claims about a measurement nobody took, and a verdict on a set nobody attempted.
  - **After** (`after-drill-ended-early-sheet-342x740.png`, `after-drill-ended-early-transition-342x740.png`): **Not measured**, under it *Nothing was answered, so there is nothing to mark.*, then *Answered 0 of 4* alone. Below, X1's block is unchanged: *Next: Note flash — treble C4 to G4, 5 min — Nothing due for review — more from this lesson*, *0 of 27 min so far*, a filled **Start** and *Skip or change*; then *Again* and *Count this set* outlined, and *Ended early, so this is not in your practice history unless you keep it.*
  - The mark under the title in the first after picture is the bottom of the drill's hint line under the sticky header (the second picture, scrolled, shows the hint whole). It is scroll position, not a fault.
- **The placement test ended in a session** (a learner placed at 0.4; the placement test is on the card; *Fail* on the first item).
  - **Before** (`before-placement-in-session-342x740.png`): *Placement result*, *Start here: Right hand C position. Nothing is locked — you can still open any stage yourself.*, the block (*Next: Find the key, 10 min — Finding notes on the keyboard, from your lessons — not played yet*, a filled **Start**, *Skip or change*), and under it a second filled box, **Start here**, beside *Again*. Two filled boxes on one sheet (`04` §0 R3).
  - **After** (`after-placement-in-session-342x740.png`): the same sheet, with *Start here* outlined beside *Again*. The transition's **Start** is the one filled box.
- **As a teacher would read it, as observations against the rules.** The early-ended sheet now tells the truth: no mark, and why. It does not blame the learner, and the session still carries the learner on. On the placement sheet, the eye now goes to the session's next step. The test's answer can still be recorded with the outlined *Start here*. Two things on that sheet are still worth a look, and neither is U96's. The block stands between the sentence *Start here: …* and the button that acts on it. And *Start* and *Start here* are close in name for different acts: the first moves the session on, the second records a starting point for later days (Follow-up 5). The sheet's header also still reads *1 of 8* and the *Be strict* hint after the test has ended, before and after (Follow-up 4).

**The mechanism.**

- **The drill sheet.** `drillOutcome` returns `judged: true, passed: false` for `answered === 0` (`DrillScreen.ts` 258, as the brief said). The sheet read only `judged` and `passed`. So an unanswered set of a judging kind got the verdict *Not passed yet*, the badge and `statSheet`'s *Accuracy* row. The share came from `PromptDrill.result`'s `accuracy: answered > 0 ? correct / answered : 0`, a zero that stands for "no answers". The change acts on the sheet, not on the verdict (the brief: the pass rule is not U96's). `finish()` names `unanswered = outcome.judged && result.answered === 0`. From that, the heading is `SUMMARY_TEXT.notMeasuredHeading` (T40's, reused), the note under it is the new `SUMMARY_TEXT.notAnswered`, there is no badge, `statSheet` keeps the *Answered* row only, and the Simon chain line is not drawn. The record and the session do not read the sheet. The session already maps `answered === 0` to no outcome (`drillOutcomeOf`), and the coaching rule already returns nothing for it (`coach`).
- **The placement sheet.** *Start here* was built `variant: 'primary'` unconditionally. X1's transition block was mounted before the buttons row with its own primary *Start*, and X1 hid only *Back to the plan* when the block was drawn. The change passes *Start here* to `sessionNext` as a box that gives way. When the transition is drawn (the same `.then` that hides *Back to the plan*), it is switched to `button--secondary`. Where the record offers nothing (`none`, `closed`), it is switched back to primary. Outside a session nothing is passed and nothing changes. `sessionRunner.ts` is untouched: the mount did not need to move.
- **The discriminating tests.** Each new case is red on the committed code, on exactly the lines the brief named (below). The two cases that should not change are green there and after: a set with one answer, and the placement outside a session.

## Done

1. **No answer, no number (item 1).** `DrillScreen.ts` `finish()` and `statSheet`, and one new sentence in `help.ts` beside T40's: `SUMMARY_TEXT.notAnswered`, *Nothing was answered, so there is nothing to mark.* The heading is `SUMMARY_TEXT.notMeasuredHeading`, reused. *Not passed yet*, the *keep going* badge and *Accuracy* are not printed. *Answered 0 of N* stays. The transition block is unchanged: the in-session unit case and the browser case assert its line and its one filled box.
   - **The sentence**, and why not the brief's wording ("ended before answering"). An unanswered set can also run out: on a kind the learner closes card by card, *Next*/*Done* with nothing played ends it. The probe shows this for loud and soft: `probe-record-of-unanswered-set.txt`, *finished · Not measured · answered=0 of 2*. "You ended before answering" would be false there. *Nothing was answered* is true of both, and has T40's shape: the cause, then *so there is nothing to mark.*
   - **Wider than the brief's words, same rule (my judgement).** On an unanswered set the time to answer, the kind's own numbers (`detail`) and the Simon chain line go with *Accuracy*. Each is taken over the answers. With none, they are a mean, a ratio or a chain of nothing printed under *Not measured*: the dynamics sheet printed *Loud against soft 0* and four more rows, and Simon printed *Longest chain: 0 notes* (`red-unit-committed-kinds.txt`). The kind's settings rows in `detail` (a tempo, a target ratio) go too, since there is no result to read against them. Item 1's title is "no answer, no number"; the brief named only *Accuracy* because that is the row the X1 picture showed.
2. **One way forward (item 2).** In a session, while the transition is drawn, *Start here* is outlined in the sheet's existing secondary style (`button--secondary`, the style *Again* already has). It is **kept, not hidden**, because it is the only thing that records the test's answer (`recordPlacement`). Hidden, a placement taken inside a session could not be recorded at all. Outside a session it stays the one filled box. No style was missing and `style.css` is untouched.
3. **Not U96's (item 3), untouched:** the fallback's words after *Next:*, the minutes line, `drillOutcome` and the drill's pass rule, the placement's own logic, `sessionRunner.ts`, `session.ts`, the other builders' files.
4. **Red first, unit (item 4).** `app/tests/unit/drillSheetsSayWhatWasMeasured.test.ts`, the real drill screen in jsdom over a real session record (`fake-indexeddb`), in `backingTrackSheet.test.ts`'s and `sessionTransition.test.ts`'s patterns. Seven cases:
   - a note-flash set ended before any answer: *Not measured*, the sentence, no *Accuracy*, verdict or badge, *Answered 0 of N*;
   - the same in a session: X1's transition line, *Start* the one filled box, *Back to the plan* hidden;
   - dynamics and Simon ended before any answer: *Answered* the only stat, no chain line;
   - one answer: judged as before (a verdict, an *Accuracy* line, no note);
   - the placement in a session: one filled box, `session-start-next`, with *Start here* present and outlined;
   - the placement outside a session: *Start here* the one filled box.

   Soft assertions, so each red shows every claim at once.
5. **Red first, browser (item 5).** `session-run.spec.ts` gains two cases at 342 × 740 (the file's viewport): *a drill ended before any answer…* and *the placement test ended in a session…*, each with its pictures under `test-results/pictures/u96/`. The spec never writes under `docs/`, as U97 ruled: I copied them to `docs/prompts/pictures/u96/`, six PNGs, before and after.
6. **Consumers.**
   - **`drillOutcome`**: unchanged; its readers are the record (`keep`), the session (`drillOutcomeOf`) and coaching.
   - **The specs that read the sheet**: `drills.spec.ts` and `drills-review.spec.ts` read `#drill-outcome`'s visibility and the stats of sets with an answer; `backingTrackSheet.test.ts` reads an unjudged kind. None is affected (runs below).
   - **`help.test.ts`'s §5f join** lists the Score screen's sentences only, so the new drill sentence is not in it. `04` §5f should print it; see the doc rows.
7. **The brief's line numbers held:**
   - `drillOutcome` at 247–270 (the `answered === 0` line at 258);
   - `notMeasuredHeading` and `notMeasured` at 219 and 221;
   - `SESSION_TEXT` at 1175;
   - the transition block at 300–423 of `sessionRunner.ts`.
   
   The placement's end sheet, which the brief left to a search, is `DrillScreen.ts`'s own `finishPlacement`. `LessonScreen.ts` 930 has a different *Start here*, the lesson page's, not touched. One premise did not hold in full: that an unanswered set is one the learner "ended before answering". It can also run out with nothing played (item 1). A skipped card is not unanswered, since it counts as a wrong answer (`PromptDrill.next`), so skipping every card still reads *Not passed yet*, by the pass rule.

## Not done

- **The whole browser suite and `npm run states`:** not named by the map for these paths. The map named eleven specs; I ran those and the brief's two placement specs.
- **768 × 1024 pictures:** not asked; the transition's tablet picture (X1's) was not retaken.
- **Rerunning `lessonClaimsAboutApp.test.ts`'s 23 failures on a full content build:** not done. They fail with the same 23 names on the committed source (`vitest-compare.txt`), and they are about pieces the offline build does not fetch plus Entry 101's two line-ending assertions. *Inferred* from the names; the full catalogue was not built here.
- **The tour** (`tests/tour/`) and the drill pictures in `guide-shots.spec.ts`: not named by the map for these paths; not run. What they picture of an unanswered sheet is unverified.

## Follow-ups (recorded, not fixed)

1. **P2 (record truth, the drill writer): an unanswered set goes on the record as accuracy 0.** `probe-record-of-unanswered-set.txt`:
   - *End drill* at once, then *Count this set*, stores `{"accuracy":0,"wrongNotes":0,"missed":10,"passed":false}`;
   - a loud-and-soft set run out with nothing played records itself as `{"accuracy":0,…,"missed":2,"passed":false}`.
   
   `keep()` stores `result.accuracy` whenever `drillOutcome` says `judged`, and `answered === 0` is judged. The sheet no longer prints the zero, but Progress will (the T40/C1 family: *0%* for a run nothing measured). The fix is the writer's, `accuracy: NOT_MEASURED` where `answered === 0`, or not offering *Count this set* for an unanswered set. It touches the record contract, so it is not a sheet change.
2. **P3 (a false number already on the sheet): *Answered* prints `correct of total`.** A set with ten skipped cards reads *Answered 0 of 10* (`probe-record-of-unanswered-set.txt`, *skip-all*). A set ended after four answers with three right reads *Answered 3 of 10*. The row's label says answered; its value is right answers. The brief kept *Answered 0 of N* because on an unanswered set the two agree; on every other set they do not.
3. **P3 (test, vacuous): `modes-placement.spec.ts` › "the question is the screen…" counts `btn--primary`.** That class exists nowhere in `app/src`: the app's class is `button--primary`. So *"there is exactly one filled box on this screen"* counts nought and always passes. It should count `button--primary`. Not my file.
4. **P3 (placement sheet, pre-existing): the drill's counter *1 of 8* and the *Be strict* hint stay above *Placement result*** after the test has ended, before U96 and after (both pictures).
5. **P3 (words, not U96's): *Start* and *Start here* on one sheet** name different acts. The first moves the session on; the second records where Today starts from later. In a session the transition block also stands between *Start here: …* and its button. A wording or layout pass for the placement sheet; U96 kept X1's mount, as the brief allowed.
6. **Adjacent (lane scaffolding): the kept config copy fails `npm run lint`.** `lint.txt` exits 1 on `app/playwright.u96-4453.config.ts` alone (the project service does not include it), as U92's Follow-up 4 recorded. `lint-without-config-copy.txt` and `lint-final-without-config-copy.txt` exit 0.

## Questions

None. The two choices left to me were the sentence's wording (true of both ways a set ends unanswered) and keeping *Start here* outlined rather than hidden (it is the only writer of the answer). Both are said above with their reasons.

## Files

- **Changed:**
  - `app/src/ui/screens/DrillScreen.ts`: `finish()`'s heading, badge and note; `statSheet` (an unanswered set prints *Answered* alone); the chain line; `sessionNext`'s `giveWay`; `finishPlacement`'s *Start here*, built once and given way.
  - `app/src/ui/help.ts`: `SUMMARY_TEXT.notAnswered`, beside T40's lines.
  - `app/tests/e2e/session-run.spec.ts`: the two U96 cases and the header's paragraph.
- **Added:**
  - `app/tests/unit/drillSheetsSayWhatWasMeasured.test.ts`.
  - `docs/prompts/tasks/U96-session-sheets-say-what-was-measured.md`: the brief, copied from the main checkout.
  - `app/playwright.u96-4453.config.ts`: the lane's port copy, kept as asked, **not for the commit** (Follow-up 6). Its storage state is `build/u96/storageState-4453.json` (ignored), the fixture re-keyed to port 4453 (X1's Follow-up 8).
- **Pictures:** `docs/prompts/pictures/u96/`, six PNGs.
- **Captures and scripts:** `docs/prompts/runs/U96/`: this entry, the logs in the table, and the scripts:
  - `scripts-run.sh` (one command, logged);
  - `scripts-run-e2e.sh` (checks each named spec exists and port 4453 is free, then runs on the copy with two workers);
  - `scripts-chain-final.sh` (the final chain, launched detached);
  - `scripts-compare-fails.py`;
  - `scripts-zzU96RecordProbe.test.ts` (the probe, run from `app/tests/unit/` and moved here).
- **Not to commit** (line endings only): `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md`. The offline content build rewrote them; I wrote their committed content back from `git show HEAD:<path>`, and `git diff` on them is empty, though `git status` lists them.
- **Environment:**
  - `npm ci` exit 0;
  - `parity_reference.py` exit 0 (three MAESTRO files skipped by design);
  - `build.py --offline` exit 1: the offline libraries are absent, but it wrote `app/public/content`, which was kept, not copied from the main checkout. The screens U96 touches read the drills (`catalog.json` holds `drill.placement.stage-0` and the note-flash drills) and the curriculum's 0.4 and 1.1 rungs, which the browser cases reached.

## The red lines

- **Unit** (`red-unit-committed.txt`, the new file on the committed code, exit 1; 3 failed, 2 passed, the two that should not change):
  - `AssertionError: a verdict over a set nobody answered: expected 'Not passed yet' to be 'Not measured'`;
  - `the reason under the heading: expected null not to be null`;
  - `an accuracy nobody measured: expected '0%' to be undefined`;
  - `expected 'Not passed yetkeep goingAccuracy0%Ans…' not to contain 'Not passed'` (likewise `'keep going'`, `'Accuracy'`);
  - in a session, the same heading and `'0%'`;
  - `two filled boxes on one sheet: expected [ 'session-start-next', …(1) ] to deeply equal [ 'session-start-next' ]` (the second is `"drill-placement-start"`);
  - `Start here outlined: expected false to be true`.
- **Unit, the kinds' own numbers** (`red-unit-committed-kinds.txt`, exit 1; 2 failed):
  - dynamics: `expected 'Not passed yet' to be 'Not measured'`, and `numbers for a set nobody answered: expected [ 'accuracy', 'answered', …(5) ]` (`how-hard-the-soft-notes-were-played`, `how-hard-the-loud-notes-were-played`, `loud-against-soft`, `loud-against-soft,-asked-for`, `every-note-the-same-volume`);
  - Simon: the heading, `a chain nobody played: expected 'Longest chain: 0 notes. Your best her…' to be undefined`, and `[ 'accuracy', 'answered', 'longest-chain' ]`.
- **Earlier drafts**: `red-unit-committed-first-draft.txt` (hard assertions, stopped at the first) and `red-unit-committed-second-draft.txt` (the note check was vacuous on the committed code: both sides `undefined`). The test was rewritten to soft assertions and an explicit presence check, and rerun red.
- **Browser** (`red-e2e-committed.txt`, the two new cases on the committed build, port 4453, two workers, exit 1; both failed):
  - `Error: a verdict over a set nobody answered … Expected: "Not measured" Received: "Not passed yet"`;
  - `#drill-outcome-note` `element(s) not found`;
  - `an accuracy nobody measured … Expected: 0 Received: 1`;
  - the sheet `not.toContainText('Not passed')` and `'keep going'`, received `"Not passed yetkeep goingAccuracy0%Answered0 of 4Next: Note flash — …"`;
  - `two filled boxes on one sheet … Expected: 1 Received: 2`;
  - `#drill-placement-start` `Expected pattern: /button--secondary/ Received string: "button button--primary"`.
  
  The committed build was bundled with `vite build` alone (`build-app-committed.txt`), because `npm run build:app` runs `tsc -b`, which refuses the new unit test's `SUMMARY_TEXT.notAnswered` on the committed `help.ts` (`build-app-committed-with-new-test-tsc.txt`, exit 2, that one error).
- **After:** `unit-new-fixed.txt` (7 passed) and `e2e-u96-fixed.txt` (2 passed).

## Tests

| Step (file in `runs/U96/`) | Exit | Note |
| --- | --- | --- |
| `npm-ci.txt` | 0 | — |
| `parity-reference.txt` | 0 | three MAESTRO files skipped by design |
| `content-build-offline.txt` | 1 | offline libraries absent; `app/public/content` written and kept |
| `red-unit-committed-first-draft.txt`, `red-unit-committed-second-draft.txt` | 1, 1 | drafts of the unit red (above) |
| `red-unit-committed.txt` | 1 | the unit red: 3 failed, the 2 that should not change passed |
| `red-unit-committed-kinds.txt` | 1 | dynamics and Simon, red |
| `build-app-committed-with-new-test-tsc.txt` | 2 | `tsc -b` refuses the new test's `notAnswered` on the committed `help.ts` |
| `icons-committed.txt`, `build-app-committed.txt` | 0, 0 | the committed bundle, `vite build` alone |
| `red-e2e-committed.txt` | 1 | both new browser cases red on the committed build |
| `unit-new-fixed.txt` | 0 | 7 passed |
| `tsc.txt` | 0 | — |
| `lint.txt` (`npm run lint`) | 1 | the kept config copy alone (Follow-up 6) |
| `lint-without-config-copy.txt` | 0 | — |
| `build-app-fixed.txt` | 0 | — |
| `e2e-u96-fixed.txt` | 0 | the two new cases, 2 passed; pictures read |
| `probe-record-of-unanswered-set.txt` | 0 | the probe behind Follow-ups 1 and 2 and the sentence's choice |
| `vitest-named-fixed.txt` (the new file, the ten that drive the drill screen, `drillAfterAMiss`, `help`, every `session*` file, `todaySessionRun`) | 1 | 23 failed of 592, all in `lessonClaimsAboutApp.test.ts` |
| `vitest-lessonClaims-committed-src.txt`, `vitest-compare.txt` | 1, 0 | that file on the committed source: the same 23 names |
| `checks-for-paths.txt` | 0 | the map: `tsc`, `lint`, `unit` (whole), `build-app`, eleven browser specs |
| `checks-for-paths-with-config-copy.txt` | 0 | with the copy: UNMATCHED, the full suites (the copy is not for the commit) |
| `tsc-final.txt` | 0 | the final tree |
| `lint-final-without-config-copy.txt` | 0 | the final tree |
| `build-app-final.txt` | 0 | the final tree |
| `e2e-map-and-placement-final.txt` (`session-run`, `modes-placement`, `placement-branches` whole, and the map's `app-shell`, `drills-harmony`, `drills-review`, `drills`, `empty-states`, `feedback-placement`, `help-strip`, `landscape`, `tips`, `wide`; port 4453, two workers, each file checked to exist) | 0 | 163 passed, none failed or skipped; the final pictures copied as the after set |
| `vitest-all.txt` | 1 | 66 failed in 11 files, of 6,945 |
| `vitest-failing-files-committed-src.txt`, `vitest-compare-all.txt` | 1, 0 | the 11 files on the committed source: 65 failed in 10, the same 65 names as after (the offline catalogue's and Entry 101's pair, U92's classes) |
| `vitest-expectedNote-rerun.txt` | 0 | the 66th, `expectedNote.test.ts`, a 5-second timeout under the whole suite's load: 12 passed alone on the changed tree |

- **Unverified:** what a real phone draws (the pictures are Chromium at 342 × 740 with the app's font stack); CI's result on this change; the tour's and the guide's drill pictures; the sheets at 768 × 1024 and sideways; whether a learner reads *Start* and *Start here* apart (Follow-up 5). Nothing heard.

## Doc rows

- **`docs/04-ui-spec.md` §5c, the *Result sheet* bullet**, after "…the pass is a chain rather than a share of the cards (`engine/drills/simon.ts`)." and before "In today's session…", a new sentence group:
  "**No answer, no number** (U96, 2026-09-29). A set of a kind that judges, ended with no card answered, is headed **Not measured**, T40's heading (§5f), and says *Nothing was answered, so there is nothing to mark.* That is *End drill* before the first answer, or *Next* or *Done* with nothing played on a kind closed card by card; a skipped card counts as answered, wrong. The sheet prints *Answered 0 of N* and nothing else: no *Not passed yet*, no badge, no *Accuracy*, no time to answer, none of the kind's own numbers (a dynamics set printed *Loud against soft 0*) and no chain line. The verdict (`drillOutcome`) is unchanged, and the session reads an unanswered set as no outcome (`drillOutcomeOf`), as before."
- **`docs/04-ui-spec.md` §5c, the sentence "In today's session the end sheet's closing action is the same transition (X1); …"**, appended:
  "On the placement test's sheet the transition's *Start* is the one filled box while it is drawn, and *Start here* is outlined. It stays, because it is the only thing that records the test's answer (U96). Outside a session *Start here* is the filled box, as before."
- **`docs/04-ui-spec.md` §5f, "What the sheet says a run is, under its heading"**, a bullet after *A run the app heard nothing of*:
  "- **A drill set nobody answered** (U96) is headed **Not measured**, with *Nothing was answered, so there is nothing to mark.*, and prints *Answered 0 of N* and no other number (§5c)."
- **`docs/08-test-map.md`, the `session-run.spec.ts` line**, appended:
  "; U96: a drill ended before any answer headed *Not measured* with its reason, no *Accuracy*, and X1's transition under it with one filled box; the placement test ended in a session (a learner placed at 0.4) with the transition's *Start* its one filled box and *Start here* outlined"
- **`docs/08-test-map.md`, the unit list**, a new line (placement the splicer's):
  "- `drillSheetsSayWhatWasMeasured.test.ts` — the drill's end sheets on the real screen in jsdom over a real session record (U96). A note-flash set ended before any answer is headed *Not measured* with the reason, *Answered 0 of N*, and no *Accuracy*, verdict or badge, alone and in a session with X1's transition unchanged. Dynamics and Simon sets likewise print none of the kind's own numbers and no chain line. A set with one answer is judged as before. The placement sheet in a session has the transition's *Start* as its one filled box and *Start here* outlined; outside a session *Start here* is filled."
- **`docs/08-test-map.md`, the X1 row (*Today's session, run*)**, its last column, appended: "; the unanswered drill sheet and the placement sheet's two filled boxes (X1's follow-ups 2 and 4) closed by U96 (Entry 152)".
