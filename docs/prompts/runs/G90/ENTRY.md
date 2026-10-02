### Entry 217 — G90 — a piece paused or put away after *Start session* leaves the running session at its turn, said, with the snapshot kept; and the lesson page no longer heads itself with its id while it loads (closes G90 and T20)

Base: the worktree cut from **aac5bb8d** (`git log --oneline -1` first; the brief
`tasks/G90-a-paused-piece-leaves-the-running-session.md` read at that tree). Worktree only; nothing committed, pushed,
stashed, reset or checked out; nothing written in the main checkout, whose built content (`app/public/content`, all but
the tracked `audio/`) was copied read-only for the unit and browser runs. Browser runs on port **5463** from a config
copy (`scripts/playwright.g90.config.ts`), one worker, only the specs named below.

## Judgement

**What a learner now meets.** They start a session whose second activity is a piece they passed weeks ago (*Keeping this
piece playable*), and while the first activity is under way they open Progress and pause the piece on its sheet. Back on
Today the running card is the session they started: the piece is still on it, pending, nothing rebuilt
(`today-after-the-pause-342x740.png`). They finish the first activity, and the transition says **Ode to Joy (hands
together) is skipped — you paused it**, with *Next:* the activity after
(`transition-steps-past-342x740.png`). *Start* opens that one, never the piece. Today's row for the piece reads
*skipped* and the *Continue* line names the one after (`today-skipped-row-342x740.png`). Put away says *— you put it
away*. A piece they tap open from its row, or chose themselves by a swap, is theirs: whatever its project says, it
opens. An activity they are already in is never taken from them. The next composition is untouched: another day,
*End today's session*, Shuffle or a length compose as they did, and the composer still leaves the piece out (G1d).

Lesson pages: while the curriculum loads, the heading says **Lesson**, not *Lesson classical.3*; then the lesson's title,
as before (`lesson-heading-while-loading-342x740.png`).

**What a learner does not get, said first.** Today's row for a skipped piece keeps its line, the composition's words
(*Keeping this piece playable — last played on 12 Sep*), as every skipped row does; the reason is said on the
transition, not on the row (Question 1). Looked at at 342 × 740 only; not at 768 × 1024 or sideways. Nothing here is
heard and nothing here depends on hearing.

**Technical verdict.** The ruling is built as ruled: the snapshot stays, the veto is at the point the session offers an
activity, it never recomposes and never interrupts, and it uses one reading of a project that the composer also uses.
Thirteen mutants, each removing one mechanism, each turned a named test red (`mutants.txt`). The unit cases are red on
the base source and green on the final tree; the two browser cases are red on the dist built from the base and green on
the final one. **Pedagogical verdict:** not applicable beyond this: the change honours what the learner said about a
piece and teaches nothing new; no lesson or score text changed.

**Premises found wrong in the brief** (§13; the orchestrator's labels kept):

1. **The hypothesis, "the runner has one place where it moves to the next pending activity", does not hold, and the
   falsifier's first half fired.** The cursor moves in four places (`completed` and `advance` in `apply`, `choose` for a
   tapped row, the start), and a pause can land after the cursor has already reached the piece (the learner finished the
   activity before, saw *Next: the piece*, went and paused it, came back). The boundary that works is where the session
   **offers** an activity, which is three screens (the transition's draw, *Start* on it, Today read for *Continue*), plus
   one offer that is not the cursor's: the transition after a **stopped** activity (a drill ended early, the walk's
   first activity) offers the one *after* it. So the veto is one function, `settleHeld`, called from those places, and
   `withhold` is addressed by token like `choose` and `swap`. `openActivity` is not the boundary: it also opens a row
   the learner tapped, which must stay theirs. **My first build missed the stopped-activity offer** (its unit cases all
   finished their activities); the browser walk was red on it and found it.
2. **The falsifier's second half did not fire, but the brief's acceptance asked for more than the existing display
   shows.** A skipped activity with a reason is shown with no new status or field: `state: 'skipped'` and one
   `Adaptation` row whose `why` the transition already prints. I reused the adaptation kind `skipped-redundant` for it
   (its doc now says what it covers) because the brief forbids a new enum; the label is a stretch (Question 2). "Today's
   row ... skipped, the reason shown": the row says *skipped*; the reason is on the transition. A reason on the row would
   need a title-free sentence the record does not hold (a new kind or field), which the brief rules out.
3. **"Automatic" can be read from the code without a product choice**, so the stop condition did not apply: an
   activity the composition chose carries the `claim` that chose it; a swap's slot has none. `SessionSlot.claim` is
   documented as *what chose the item*; `keep()` sets it on every composed item slot and the reading slot's offer
   becomes `claim: reader` in the record. The existing 30-day corpus test already asserts every composed slot but the
   reading and free ones has a claim (`firstThirtyDays.test.ts`), and `todayHeldPiece.test.ts` pins that a swap leaves
   none. **Decided by me, and it changes what a learner meets:** a piece swapped in is never withdrawn, including when
   the learner paused it *after* swapping (Question 3).
4. **`TodayScreen.ts` was "unchanged unless the trace shows it must change"; the trace shows it must**, by one line in
   `loadRun`: without it Today's *Continue* opens the piece when the pause landed after it became next. Also changed,
   beyond the brief's list: `session.ts` (the lookup extracted, below), `help.ts` (the one sentence), the guard in
   `projectLifecycle.test.ts`, one line in `sweeps.spec.ts`.

## Mechanism

Fault: nothing between *Start session* and the end of the run read the project store (verified at the base: no
`paused`, `projectStore` or `getProject` in `sessionRunner.ts` or `sessionRun.ts`; of the session's files only Today
read it, at composition; the lesson page, Library, Progress and the sheet read it for their own display), so a pause
after the start could not reach an activity the composition had already fixed.

Hypothesis tested, with its refuting test: *one boundary, readable from the runner.* Refuted as above, by the browser
walk (a stopped activity's transition offered the paused piece with the first build) and by reading the four cursor
moves.

What the change does, by file:

- `app/src/curriculum/session.ts:73` **`heldStateOf(projects, target)`**: the session's one reading of a project
  (`paused` or `retired`, by the piece's material then its id, never another id's row). `buildSession`'s per-card answer
  (`:1623`) now calls it, so the composer and the runner read a project one way (the G1d review's PRUNE/MERGE: "one
  session-level interpretation of automatic eligibility").
- `app/src/data/sessionRun.ts:361` **`isAutomatic`** (the claim) and `:432` the **`withhold`** branch of `apply`:
  addressed by token; refused for an activity not `pending` (opened or tried is underway) and for one with no claim;
  marks it `skipped` with one adaptation; moves the cursor only if the cursor was on it.
- `app/src/ui/sessionRunner.ts:288` **`settleHeld(run, now, offering)`**: while the offered activity is pending,
  automatic and held *now*, it applies `withhold` and offers the next, with the project rows read live and the
  catalogue asked only for the material, and only if the learner has any project. Called by `drawTransition` (`:448`, with
  `offeredAfter`, `:322`, what *Start* would open), by the transition's *Start* (`:523`; if it withheld, the screen is
  drawn again with the one after, never opening what it offered) and by Today's `loadRun` (`TodayScreen.ts:970`).
  `skipsBetween` (`:356`) says the skips between this activity and the one offered, round the card, and only while they
  are skips.
- `app/src/ui/help.ts` `SESSION_TEXT.withheld`; `app/src/ui/screens/LessonScreen.ts:81` the heading `Lesson`.

The alternative considered (the brief's hypothesis, one check in `openActivity`) fails three ways: it would overrule a
tapped row (mutant 13), it would open the next activity under a screen that offered the paused piece, and it would
leave Today's *Continue* line and the transition naming a piece the session would not open.

## Tests

Red = on the base source (the six changed files put back to `HEAD`, the new test files kept: `red-unit-base.txt`;
the browser spec against the dist built from the base: `e2e-red-base.txt`, the spec's first version: its later edits
changed only what it asserts after the transition, at a stopped activity's cursor). Green = the final tree.

| Case | Layer | Base | Final | Mutants that redden it |
| --- | --- | --- | --- | --- |
| `withhold`: a pending composed activity is skipped with its reason, the cursor moves, nothing else moves | unit, pure | red (the event does not exist) | green | M10 |
| `withhold` on the last activity closes the session as finished | unit, pure | red (same) | green | M10 |
| `withhold` refused for an activity opened or attempted | unit, pure | red (same) | green | M2 |
| `withhold` refused for an activity with no claim (a swap's) | unit, pure | red (same) | green | M1 |
| `withhold` on an activity ahead of the cursor leaves the cursor | unit, pure | red (same) | green | none (M7 is the transition's) |
| a stale token and a closed session refuse | unit, pure guard | **green** (the generic refusals) | green | none |
| `heldStateOf`: paused and retired only; material then id; never another id's row | unit | red (absent) | green | M3 |
| one lookup in the session; the runner asks it and does not look up its own | unit, source walk | red | green | M11 |
| the pause lands while the piece is ahead: at its turn the transition offers the one after, says why, the composition (slots, routes, words, tokens, version, the free prompt) stands | unit, real stores | red: offers the piece | green | M4, M10 |
| put away; two in a row; the last one (session finishes) | unit, real stores | red | green | M4, M10 |
| a stopped activity's transition offers the one after: a paused piece is stepped past before it is shown; Start opens the one after | unit, real stores | red | green | M7 |
| the same, the pause landing after the screen was drawn: Start moves on, steps past, shows the one after | unit, real stores | red | green | M5, M12 |
| the one offered after a stopped activity may be behind it on the card: the skip is still said | unit, real stores | red | green | M7 |
| the piece was already next when the learner paused it: Start does not open it, the screen redraws with the one after | unit, real stores | red | green | M5, M12 |
| an activity underway is not interrupted; the next one at its turn is | unit, real stores | red at its second half (the first half cannot fail on a base that vetoes nothing) | green | M2, M4 |
| a swapped-in piece is kept however its project stands; the composer's paused piece is not | unit, real stores | red at its second half (same) | green | M1 |
| only paused and put away: every other state, and no project, leave it offered | unit, real stores | red at its paused half | green | M3 |
| a piece found by its material when another id of the same file holds the project | unit, real stores | red | green | M9, M11 |
| the catalogue unreadable: found by the id it was made under | unit, real stores | red | green | M4 |
| the store of projects unreadable withdraws nothing | unit, real stores guard | **green** (the base withdraws nothing) | green | none (not mutated) |
| a skip is announced only while it is a skip (a tapped-back row is not) | unit, pure over `transitionView` | red (the event does not exist) | green | M8 |
| `settleHeld` reports what it stepped past, writes nothing where nothing is withdrawn, twice is once | unit, real stores | red (absent) | green | M4 |
| Today: the row drawn *skipped*, *Continue* names and opens the one after, never the piece | unit, real Today | red | green | M6 |
| Today: a row the learner taps opens the skipped piece, whatever its project says | unit, real Today | red at its first half | green | M13 |
| Today: the next composition is handed the same projects | unit, real Today | red at its first half | green | M6 |
| every composed item slot reaches the record with its claim; a swap leaves none | unit, real Today guard | **green** (it pins a fact of the base) | green | none |
| heading: the word while the curriculum is held back; while it fails; for an unknown id | unit, jsdom | red (*Lesson classical.3*) | green | the base is the mutant |
| heading: the title arrives | unit, jsdom guard | **green** | green | none |
| the browser walk (paused on Progress's sheet mid-session; the transition, Today and the record agree) | browser | red: the transition offered the piece | green | M4, M7 |
| the browser lesson heading with the curriculum request held (service worker blocked) | browser | red: `Lesson classical.3` | green | the base is the mutant |
| `sweeps.spec.ts`: no lesson heading carries its id, on all 109 lessons of this build | browser guard | green (it reads the final state) | green | none |

Revised, class **replace** (the old assertion encoded the model being replaced): the source walk in
`projectLifecycle.test.ts` (*only the project sheet acts; the session reads a project ...*). Old assumptions: Today and
`session.ts` the only readers of the rows; the one lookup inside `buildSession`; a pause reaching the session only at
composition. Now: the runner is a reader through one lookup, `heldStateOf`, which `buildSession`'s answer also calls,
asserted by binding and by source position. Class **add**: the four new files and the browser spec. No test asserted
the id in the lesson heading: the other lesson fixtures with `title: \`Lesson ${id}\`` are lesson fixtures for other
code; the only heading checks are `sweeps.spec.ts` (`not.toBeEmpty`, kept; the id line added) and mine.

Cases that cannot fail on the base by construction are marked guard; each has a mutant, or says it has none.

## Done

- The live veto at the offer, as ruled, with the snapshot kept; the one lookup shared with the composer.
- The lesson heading without its id in every state without a lesson.
- `04` §2 (the running session), §5 (the transition), §3e (the heading); `08-test-map.md` (the session row, the
  projects row, the per-file lines, `sweeps.spec.ts`).
- Evidence in this folder: `red-unit-base.txt`, `unit-summary.txt`, `e2e-red-base.txt`, `e2e-green.txt`, `mutants.txt`,
  `map-min.txt`, `pictures/`, `scripts/`.

## Not done

- **The reason on Today's row** (premise 2; Question 1).
- **A swapped-in piece paused after the swap is not withdrawn** (premise 3; Question 3).
- **The first activity of a session is not settled at *Start session***: the card was composed moments earlier from the
  same projects. A pause in another tab in that gap reaches the composer's card, not this change.
- **Sideways and 768 × 1024 were not looked at**, and the transition's added line was seen at 342 × 740 only.
- **Of the map's 24 browser specs** (`map-min.txt`), 11 were run (the new one, `session-run`, `projects`, `sweeps`,
  `today`, `transfer-offer`, `empty-states`, `lesson-tools`, `start-and-return`, `first-day`, `lesson-flow`); the other
  thirteen, and the whole browser suite, were not (the brief: own targeted specs only, one worker). The landing chain
  runs the union.
- **The whole unit suite once on the very last tree**: it was run in full before the last two edits (one more case, one
  doc comment); after them the 17 touched files were run (231 tests, green).

## Follow-ups (observations; where each came from)

- **P3, pre-existing at `aac5bb8d`:** `TodayScreen.heldProject` (G94) spells the two held states itself to badge the swap
  sheet. A label on the learner's own menu, not an offer; left, and named in `heldStateOf`'s comment.
- **P3, pre-existing:** the lesson page's unknown-lesson sentence prints the id typed into the address
  (*There is no lesson “9.9”*). Not reachable from any control; the heading no longer prints it.
- **P3, pre-existing:** while the curriculum loads, the lesson page draws six empty section headings under *Lesson*
  (`lesson-heading-while-loading-342x740.png`). A loading state for the lesson page's own owner.
- **P3, introduced by this seam:** the `finished` transition (the withheld piece was the last) prints the last-one line
  with no note; Today's finish line says *skipped*. Fine as it stands; recorded.
- **P3, introduced by this seam:** a vetoed row the learner taps back to life, then leaves before its screen reports
  *opened*, is stepped past again at the next Today load or transition. The window is the time a score takes to open.
- **Environment, pre-existing:** four unit cases fail on the base source and on this tree alike
  (`unit-summary.txt`): `midiParity` and `taughtByAncestry` need `build/` reports a fresh worktree lacks;
  `lessonClaimsAboutApp` blues.3 and 4.7 read `ScoreScreen.ts` and `style.css` through `\n` against this CRLF checkout
  (checked by reading the two files). Two more cases timed out in the full run under load (`expectedNote`,
  `tempoSoundAgainstMark`) and pass alone.

## Learner-facing text, itemised (§12)

| Where | Before | After | Why |
| --- | --- | --- | --- |
| `help.ts` `SESSION_TEXT.withheld`, drawn as a note above *Next:* on the transition after the activity before (`04` §5) | no note; *Next: Ode to Joy (hands together), 5 min — Keeping this piece playable — last played on 12 Sep* | *Ode to Joy (hands together) is skipped — you paused it*, then *Next:* the one after; for a piece put away, *… is skipped — you put it away* | what the learner last said about a piece holds where the session offers it; the verbs are the project sheet's (*Pause*, *Put it away*), the shape *Easier than expected — X is skipped*'s |
| `LessonScreen.ts:81` the lesson page's heading until the curriculum has loaded, failed or lacked the lesson | *Lesson classical.3* (the route's id) | *Lesson* (then the lesson's title, as before) | no internal id on screen (`00` §1; T20); a word, not an empty heading, so the frame keeps its line and its `h1` |

None of it is `content/` or `scores/`; no lesson text changed. Today's row for a skipped piece keeps its existing
line; no other sentence changed.

## Questions (for the reviewer; each one line)

1. **The reason on Today's row.** The row says *skipped* and keeps the composition's words; the reason is the
   transition's note. Showing it on the row needs a sentence without the title (a row's line is cut near thirty
   characters), which the record does not hold, so a new adaptation kind or a field. Worth it, or is the transition's
   note enough?
2. **The label.** The held skip is recorded as `skipped-redundant` (doc widened) to add no enum. If a separate kind is
   wanted it is one union member, one `ADAPTATIONS` entry, one filter in `skipsBetween`, and it would also give Question 1
   its discriminator.
3. **Swap, then pause.** A piece the learner swapped in and then paused is not withdrawn (the swap stores no time to
   compare with the project's `since`). Acceptable, or should a swap record when it was made?

## §11, the five questions

1. **Product** — looked at in the four pictures at 342 × 740; a teacher's read is inferred, not heard; the added
   sentence's wording is unverified as copy beyond that. Sideways and tablet not looked at.
2. **Mechanism** — one: nothing read the project after the snapshot. The alternative (a check in `openActivity`) and the
   falsifier were tested; the browser walk caught the missed stopped-activity offer.
3. **Evidence** — observed: the red and green runs, 13 mutants, the pictures, the stored run read from IndexedDB in the
   walk. Inferred: that no other code path offers an activity (read in `TodayScreen.ts` and `sessionRunner.ts`: every open
   goes through `openActivity`, from Start session, *Continue*, a tapped row and the transition's *Start*). Scope: one
   learner seed in the browser; the unit cases above for the transition and Today; 109 lessons for the final heading
(`public/content/curriculum.json` as copied; no title carries its id or an id-like token); not every state of every
sheet. Unchecked:
   the other thirteen map specs, the other sizes, any device.
4. **Consumers and record** — `04`, the test map, the guard revised with its reason beside it; the composer reads the
   same lookup unchanged (`repertoireRetention.test.ts` green); the brief's `## Record` block is the landing's.
5. **Addressee** — Questions 1 to 3 are product and architecture choices for the reviewer; no one in this process can
   hear the music and none of this needs it.

## Exit codes (every command, in order; numbers here are counts, never timings)

| Command | Exit | Note |
| --- | --- | --- |
| `git log --oneline -1`; `test -e` the brief | 0 | aac5bb8d; present |
| `npm ci` (app) | 0 | |
| copy of the main checkout's built content, audio excluded | 0 | read-only source |
| `npx vitest run` the new unit files, on the base | 1 | first build of the tests: `sessionHeldPiece` 18 of 20 red, `todayHeldPiece` 3 of 4, the lesson heading file (old heading put back) 3 of 4 |
| `node scripts/generate-icons.mjs`; `npx vite build` (base dist) | 0 | |
| `npx playwright test -c app/build/g90/… session-held-piece --workers=1` on the base dist | 1 | both cases red (`e2e-red-base.txt`) |
| `npx tsc -b` | 0 | |
| `npx vitest run` (whole) | 1 | 4 environment failures, the same on the base |
| `npx vite build`; the new spec | 1 | its own expectation of the cursor was wrong at a stopped activity's transition; the spec fixed, not the code |
| the new spec again | 0 | 2 passed |
| 13 mutants, each `npx vitest run` of the new files (+ composer or transition files for two) | 1 each | all caught; files restored and checked by checksum each time |
| `npm run lint` | 1 | three errors in my own test file; fixed |
| `npx tsc -b`; `npm run lint` | 0; 0 | |
| `npx vitest run` (whole) | 1 | 4 environment failures and 2 load timeouts |
| `npx vitest run` the two timed-out files alone | 0 | 18 passed |
| `npx vitest run` the four failing cases' files, on the base | 1 | the same four |
| `npx vite build`; `npx playwright test … session-held-piece session-run projects` | 0 | 15 passed |
| `npx playwright test … sweeps today transfer-offer` | 0 | 32 passed |
| `npx playwright test … empty-states lesson-tools start-and-return first-day lesson-flow` | 0 | 28 passed |
| `python tools/docs/checks_for_paths.py …` | 0 | `map-min.txt` |
| `python tools/docs/record_mirrors.py --check`; `unittest … test_record_mirrors.py` | 0; 0 | fresh; 36 tests |
| the new unit file after one more case; on the base once more | 0; 1 | 25 passed; 29 of 33 red across the three files |
| `npx tsc -b`; `npm run lint`; `npx vitest run` the 17 touched files | 0; 0; 0 | 231 passed |

## Files

- Source: `app/src/curriculum/session.ts`, `app/src/data/sessionRun.ts`, `app/src/ui/sessionRunner.ts`,
  `app/src/ui/help.ts`, `app/src/ui/screens/TodayScreen.ts`, `app/src/ui/screens/LessonScreen.ts`
- Tests: `app/tests/unit/sessionHeldPiece.test.ts`, `todayHeldPiece.test.ts`,
  `lessonHeadingBeforeTheCurriculum.test.ts` (new); `projectLifecycle.test.ts` (revised);
  `app/tests/e2e/session-held-piece.spec.ts` (new), `sweeps.spec.ts` (one line)
- Docs: `docs/04-ui-spec.md`, `docs/08-test-map.md`
- This folder: `docs/prompts/runs/G90/ENTRY.md`, `red-unit-base.txt`, `unit-summary.txt`, `e2e-red-base.txt`,
  `e2e-green.txt`, `mutants.txt`, `map-min.txt`, `pictures/` (four at 342 × 740), `scripts/`
  (`playwright.g90.config.ts`, `make_evidence.py`)
