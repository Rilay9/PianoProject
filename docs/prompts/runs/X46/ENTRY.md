### Entry 213 — X46 — one story for a session item: the trace finds every distinction held, and a small consumer and routing reconciliation is built

Base: the worktree cut from **23f5c53d** (the dispatch's sha; `git log -1` in the worktree before anything else).
Worktree only; nothing committed, pushed, stashed, reset or checked out; nothing written in the main checkout,
whose built content (`app/public/content`, all but the tracked `audio/`) was copied read-only for the unit
suite and the browser runs. Brief `tasks/X46-one-story-for-a-session-item.md`, approved with its required change
(`responses/43045ffb.md`, incorporated). The design note is `docs/design/session-item-story.md`; this entry
cites it rather than repeating it.

## Judgement

**Outcome A.** The hypothesis held and the refuting test did not fire: every fact the six points need is held
by stored or session truth under some read (the note's refuting-test table). The walk's contradictions came
from default routing, a consumer reading half the session record, a frozen sentence read after its moment,
and a completion the session took before the learner chose. Per point:

1. **Purpose / why now** — held (the composer's claim, kept in the run as `reason`, `slot.claim`,
   `route.rung`); shown before the item on Today's row and the transition's *Next:* line. Only its frozen copy
   after the item was wrong (point 6).
2. **What can count** — held (the judging rung's `masteryCriteriaFor`, the mode rule, the requirement). Was
   said wrongly before the run (the Keep tempo card's "set in Settings") and not at all after a failed one.
   Now the card says the lesson's numbers judge a lesson's run, and a sheet whose run missed its standard
   says the standard (*To pass*), in *What the app counts*' words.
3. **Reachable opening state** — held; the routing ignored it. The item's traced role is a **criterion
   attempt** (composed as the rung's unmet requirement's item; nothing composes preparation; Wait at 70 % was
   the Settings default, not a session decision), so a run Today chose for its rung opens in Keep tempo at the
   rung's tempo or faster. Preparation framing was considered and not taken: it needs a role the composer does
   not hold and a *before* sentence inside the Score chrome U122/U122a own.
4. **Outcome** — held (`ActivityState`, `result.outcome`, `rungState`, the progress row, the ladder); the card
   read only the state. Now *✓ done* only where the run counted, *played* where it counted nothing; a run its
   own settings could not count does not complete a rung-judged activity.
5. **Next action** — the sheet's recommendation had no control. Now *Keep tempo at 80 %*, first, where the
   run's own mode or tempo could not count; the session no longer moves on by itself after such a run. The
   filled box stays the transition's *Start* (Question 1).
6. **Consumer consistency** — Today's running card was the only consumer asserting a falsehood ("not counted
   yet" after the run counted); rows behind the learner now drop the frozen line. Lesson page, Progress and
   the next day's composer were already views of the same truth (traced; nothing changed there).

**Technical verdict.** Built in five source files, no layout, bar or chrome change, no evidence meaning
changed, no new persistent field or enum. Seven mutants, each removing one change, each turned its test red.
Typecheck 0; `eslint src tests` 0; the unit suite green but for four failures that do not touch this change
(below); the targeted browser specs 49 of 50, the fiftieth green alone; the re-walk at 360 × 780 green.

**Pedagogical verdict.** Not applicable beyond this: the changed sentences tell the learner what rung 2.1's
`mastery` and its *What the app counts* already state, at the moment they need it; no musical claim is made.
One teaching question stays open (Question 2): whether a first meeting with a new piece should open at the
lesson's counting tempo — the opening here follows the item's composed role. No one in this process can hear
the music; nothing here depends on hearing it.

**Product, as a learner meets it.** Looked at in the re-walk's pictures at 360 × 780 (the note lists which):
the exercise and the piece open in Keep tempo at 80 %; a Wait run's sheet names the standard and offers it;
the 70 % run's sheet says why it is not a pass; Today after the session reads *played*, *✓ done*, *✓ done*
with no stale line. Findings 1, 6 and 7 resolved on that path; finding 3's Today half resolved, the rest as
traced; findings 2 and 4 still reproduce (not this lane's); no new contradiction seen.

**Premises found wrong** (§13): (a) the brief's two readings of Progress's "nothing moved" (a time window, or
a sentence gap) — neither: a piece's run writes no skill evidence as shipped, so a piece never moves a skill;
(b) the walk's inference that the second day's run "would master" the piece — the pass was at 80 % of the
written tempo and the master standard is 97 % at 100 %, so the first day was not master-eligible.

## Done

- The trace of all five consumers and the stored truth, per point, with file and line (the note).
- `Scoring.tempoCanCount` (one tempo-floor rule; `evaluateOutcome` now calls it) and `openingThatCounts`.
- The Score screen: `judgingCriteria` (one reading for summary and opening); a `?rung=` run opens where it can
  count (not a sight-read, not a route naming its mode, not with nothing listening; Rhythm only off for that
  run, the stored preference kept); *To pass*; *Keep tempo at 80 %*; a run its own settings could not count
  does not complete a rung-judged session activity.
- Today: `cameTo` and `showsReason` (`sessionRunner.ts`) read by the running card's mark and line, the finish
  line and *done today*.
- `help.ts`: the Keep tempo card's sentence; the Wait line; *To pass* and the control's words; `keepTempoAt`
  shared with *What the app counts* (its output unchanged).
- Tests: `sessionItemStory.test.ts` added (16); `todaySessionRun.test.ts` 2 replaced (class: replace, reason
  beside each), 3 added; `score.run.spec.ts` and `first-day.spec.ts` assertions replaced (class: replace).
- Specs and record: `04` §2 (running card, opening), §5 (the sheet), §5f (the card); `08-test-map.md` (the
  session row, two file lines).
- R23's song-run purpose answered (no target needed for an honest story; conversion stays parked; no field).
- Finding 10 traced: two mechanisms, neither shared with this contract (the `done`/`measure` branches of
  `askedWords`; the daily read's unanchored fallback in `anchorFor`). Not fixed, per the brief.
- The re-walk at 360 × 780 with the walk's step names (`runs/X46/walk/360x780/`, its log beside it, the
  script and config under `runs/X46/scripts/`).

## Learner-facing text, itemised (§12)

| Where | Before | After | Why |
| --- | --- | --- | --- |
| `help.ts:118` `MODE_HELP.tempo.counts` (Keep tempo card and help; `04` §5f) | A pass needs both the accuracy and the share of the written tempo set in Settings, in one run. | A pass needs both the accuracy and the share of the written tempo, in one run: the lesson’s numbers where it states them, otherwise the ones set in Settings. | false for a lesson's run wherever the rung states its own numbers |
| `help.ts:202` `SUMMARY_TEXT.waitTempo` (Wait sheet's Tempo line) | Not judged in Wait for me — to pass, play it in Keep tempo | Not judged in Wait for me | where a pass is played moves to *To pass*, with the numbers |
| `help.ts` `SUMMARY_TEXT.toPassLabel`/`toPass` (new sheet line) | — | To pass · 90 % of the notes, in Keep tempo at 80 % of the written tempo or faster (the run's own numbers) | the sheet never named the standard a run missed |
| `help.ts` `SUMMARY_TEXT.toTheStandard` (new control) | — | Keep tempo at 80 % | the sheet's recommendation had no control |
| Today's running card, a row behind the learner | e.g. "This lesson asks for it — not counted yet" | no line | frozen words after their moment; false once the run counted |
| Today's running card and finish line, an activity a run completed without counting | ✓ done / *Warm-up done* | played / *Warm-up played* | the ✓ is the pass's mark |
| A card composed after the session, such an item | ✓ done today | its progress status (*started*) | as above |

None of it is `content/` or `scores/`; no lesson text changed.

## Not done

- **The filled box on a sheet whose run could not count** stays the transition's *Start*; the attempt is the
  direct control below it. Left as a product choice (Question 1), not built.
- **Sight-reading** is outside the opening, *To pass* and the control: its tempo and its counting are the
  reader's and CL11's.
- **A frozen line ahead of the learner** can still go stale if the item counts outside the session first.
  Not reproduced; not built.
- **A drill's *played*** for a set ended before any answer is X1's protocol word (`attempted` at the set's
  start); it wears no pass mark. Not changed.
- **Only 360 × 780** was re-walked (the brief's minimum). Sideways and 342 × 740 were not.
- **The whole unit suite was not re-run** after the last ScoreScreen line (Rhythm only off at the opening);
  the files that open the Score screen and Today were (153 and 47 tests, green).

## Follow-ups

- **CL11** (named, not designed): a piece's run writes no skill evidence as shipped, so Progress's skills never
  move for pieces; a self-reported run can never count toward a rung; a Wait run counts only for a rung asking
  no tempo. Attach to CL11's cluster.
- **Finding 10's wording** — `askedWords`' `done` and `measure` branches phrase an unmet requirement as met
  ("finished, nothing left undone"). A wording defect of its own mechanism; attaches to the onboarding
  observation the reviewer holds, not to this lane.
- **`help-strip.spec.ts:85`** failed once in the two-worker run (the Score screen's title not drawn within the
  test's 30 s while `first-day.spec.ts` ran beside it) and passed alone; it opens no `?rung=` route, so this
  change does not reach it. An observation for H1 unless it recurs; mechanism unknown, load suspected.

## Questions

1. Which box is filled after a run that could not count (the note's Questions §1): the transition's *Start*
   with the attempt as the direct control (built), or the kept-here pattern with the attempt filled and *Move
   on anyway* beside it (a change to the runner's transition view).
2. Whether a new piece's first meeting should be preparation in Wait (a composer role the data does not hold)
   rather than the criterion attempt the composer composes now. A teaching and product decision for whoever
   owns the composer's slots.

## §11, the five questions

1. **Product** — looked at in the re-walk's pictures (eight read as pictures, the rest from the logged page
   words and session record); a teacher's read is inferred, not heard. The open teaching question is Question 2.
2. **Mechanism** — four mechanisms (the judgement), each with a discriminating test seen red by its mutant.
3. **Evidence** — observed: unit and browser results, the re-walk's pictures and logged record; inferred: the
   pedagogy, the help-strip failure's cause; the four unit failures as not this change's (below). Scope: one
   size walked, one learner, one rung; nothing heard.
4. **Consumers and record** — `04` §2, §5, §5f and the test map updated with the change; the session runner,
   the lesson page, Progress and the composer read nothing that changed meaning. The brief's `## Record` block
   is the landing's to append; `record_mirrors.py --check` 0 at this tree.
5. **Addressee** — Questions 1 and 2 are product decisions for the reviewer/owner, stated in one line each;
   what cannot be decided by ear is said so (Question 2).

## Exit codes (every command, in order; numbers are this machine's and relationships only)

| Command | Exit | Note |
| --- | --- | --- |
| `npm ci` (app) | 0 | |
| `robocopy` main checkout's built content, audio excluded | 1 | robocopy's "files copied" |
| `npx tsc -b --noEmit` | 0 | |
| `npx vitest run tests/unit/sessionItemStory.test.ts` | 0 | 15 then |
| `npx vitest run` todaySessionRun, scoreSummaryTruth, scoreSheetsCloseAndPlayStartsSound, sessionTransition, sessionRun | 0 | 159 |
| `node build/x46/mutants.mjs` (6 mutants) | 0 | all killed |
| `npx vitest run --maxWorkers=4` (whole suite) | 1 | 7618 passed, 4 failed: `lessonClaimsAboutApp` blues.3 and 4.7 read unchanged text (`style.css`, ScoreScreen's `menuRow(\n    'Rhythm only'`) through `\n` against this CRLF checkout; `midiParity` and `taughtByAncestry` name build reports absent in a fresh worktree (`build/midi-parity`, `build/rung-claims.json`). None reads a changed line; not re-run at the base |
| `npm run build:app` | 0 | |
| `npx playwright test --config build/x46/playwright.x46.config.ts --workers=2 …` | 1 | the config copy failed to load (`__dirname` in ESM); no test ran; fixed |
| `npx tsc -b --noEmit` (after the Rhythm only line) | 0 | |
| `npx vitest run` sessionItemStory, todaySessionRun, help | 0 | 47 |
| `node build/x46/mutants.mjs` (7 mutants) | 0 | all killed (`runs/X46/mutants.txt`) |
| `npm run build:app` | 0 | |
| `npx playwright test --config build/x46/playwright.x46.config.ts --workers=2` session-run, score.run, first-day, lesson-flow, today, transfer-offer, help-strip (files asserted present first) | 1 | 49 passed, 1 failed: `help-strip.spec.ts:85` (Follow-ups) |
| `npx playwright test … --workers=1 tests/e2e/help-strip.spec.ts` | 0 | 9 passed |
| `npm run lint` | 1 | every error in this lane's own artefacts under `app/build/x46/` (Playwright traces); none in source |
| `npx eslint src tests --max-warnings=0` | 0 | |
| `WALK_SIZE=360x780 npx playwright test --config build/x46/playwright.walk.config.ts` | 0 | 1 passed, port 5433 |
| `npx vitest run` scoreSummaryTruth, scoreSheetsCloseAndPlayStartsSound, firstContactOnTheScore, projectOnTheFinishSheet, scoreMidRunSettings, observationsFromRun, todayOpensWithItsRung | 0 | 153 |
| `python tools/docs/record_mirrors.py --check` | 0 | fresh |

## Files

- `app/src/engine/Scoring.ts`, `app/src/ui/help.ts`, `app/src/ui/screens/ScoreScreen.ts`,
  `app/src/ui/screens/TodayScreen.ts`, `app/src/ui/sessionRunner.ts`
- `app/tests/unit/sessionItemStory.test.ts` (new), `app/tests/unit/todaySessionRun.test.ts`,
  `app/tests/e2e/score.run.spec.ts`, `app/tests/e2e/first-day.spec.ts`
- `docs/04-ui-spec.md`, `docs/08-test-map.md`
- `docs/design/session-item-story.md` (new)
- `docs/prompts/runs/X46/ENTRY.md`, `mutants.txt`, `scripts/` (`mutants.mjs`, `walk-x46.spec.ts`,
  `playwright.walk.config.ts`), `walk/360x780/` (29 pictures) and `walk/360x780-log.txt`
