### Entry 221 — G90a — the held skip as one lifecycle truth: its own adaptation kind, its reason on Today's row, swap and pause ordered by when each happened (a fix-forward on G90; the reviewer's required change, `responses/1c75de8d.md`)

Base: the worktree cut from **5c10f17a** (`git log --oneline -1` first; it holds G90, `ee62c06c`, and the reviewer's response
`1c75de8d`). The brief `G90a-the-held-skip-as-one-lifecycle-truth.md` was read from the orchestrator's scratchpad (it is not in
the repository). Worktree only; nothing committed, pushed, stashed, reset or checked out; nothing written in the main checkout,
whose built content (`app/public/content`, all but the tracked `audio/`) was copied read-only for the unit and browser runs.
Browser runs on port **5463** from a config copy (`scripts/playwright.g90a.config.ts`), one worker, under the shared lock, only the
specs named below. Shared files: `sessionRun.ts` (the adaptation and swap code only; `scoreOutcome` untouched) and `help.ts`
(`SESSION_TEXT` only; `MODE_HELP.tempo` untouched), both in flight for CL11a.

## Judgement

**What a learner now meets.** They start a session whose second activity is a piece they passed weeks ago, and while the first
activity is under way they pause it on its sheet (or put it away). They finish the first activity; the transition says **Ode to
Joy (hands together) is skipped — you paused it** and offers the one after, as G90 built it. Back on Today the piece's row, which
used to keep *Keeping this piece playable — last played on 12 Sep* under its name, now reads **Skipped — you paused it** (or
**Skipped — you put it away**) with its *skipped* mark, and it reads the same after a reload and after the learner has brought the
piece back, because it is read from what the session did and not from the project as it stands
(`today-skipped-row-paused-phone-upright-360x780.png`, `…-retired-…`). The same holds for a piece they **swapped in**: if they
paused it after choosing it, the later word wins and it is stepped past at its turn with the same words; if they paused it
before they swapped it in, they chose it knowing (the swap sheet marks it *Paused*), and it is offered. A row they tap is theirs
whatever its project says, and an activity they are already in is never taken from them. If they tap a stepped-past row back to
life and then skip it by hand, nothing on it still says they paused the piece.

**What a learner does not get, said first.** Nothing here is heard, and nothing depends on hearing. The row's *skipped* mark and its
sentence both begin with the word (kept: the mark is the state column every row has, and the sentence is the reviewer's wording;
a one-line change would drop the first word of the sentence). Looked at as pictures at 360 × 780, 780 × 360 and 1024 × 768 for both
states, and measured (not looked at) in all eight R7 cells; not looked at on a device. The row's own composition words for a
withdrawn piece are gone from the row on purpose (below), so a learner no longer sees *when they last played it* on that row.

**Technical verdict.** The three answers are one change. The record: the veto's own kind, `withdrawn`, carrying which state the
learner left the piece in; `skipped-redundant` is unchanged and unwidened. The ordering: a swap records when it was made
(`swappedAt`) and the project's own moment (`since`) is compared with it, in one function that both the runner and the state
machine use. The row: read from the record by one function (`withdrawnOf`). Every acceptance case is red on the base source and
green on the final tree where a base could fail it (the cases that cannot are marked guards below, each with a mutant). 22 mutants
in the unit layer and one layout mutant in the browser, one per mechanism, each turned a named test red (`mutants.txt`).
**Pedagogical verdict:** not applicable beyond this: the change honours what the learner last said about a piece and teaches
nothing new; no lesson or score text changed.

**Premises found wrong or short in the brief** (§13):

1. **"Its own adaptation kind" does not carry Today's row.** The row's sentence is title-free (*Skipped — you paused it*; a row's
   line is cut near thirty characters and the title is the row's own), but an adaptation's `why` is the transition's sentence, with
   the piece's title in it, and the kind alone does not say *paused* or *put away*. So the adaptation carries the state beside
   the kind (`{ kind: 'withdrawn', held, why }`), and the row reads it from there. The kind discriminates "withdrawn" from
   "redundant"; the state is what the row says.
2. **"`session.ts`'s `heldStateOf` only" cannot order a swap against a pause:** it returns the state and drops the moment the
   learner said it (`ProjectRow.since`, which the store already keeps). The lookup is now `heldWordOf` (state and `since`), which
   holds the session's one `projectIn(` call; `heldStateOf` is kept as its state for the composer's per-card answer. Same
   lookup, one place; `projectLifecycle.test.ts`'s source walk revised to say so.
3. **The brief did not say what becomes of the composition's words on the row, nor of the record when a withdrawn row is tapped
   back.** Chosen, and said here for the reviewer: the sentence **replaces** the composition's words on a withdrawn row (they
   are the reason the activity was ahead, which the learner has withdrawn the piece for, and *Keeping this piece playable*
   beside *you paused it* contradicts it; the same rule `showsReason` already applies to a row behind the learner), and a
   `choose` on a withdrawn row takes the record of the withdrawal away. Without that second change the new row text would be false:
   tap the row back to life, open it, skip it by hand, and `skipped` plus a leftover `withdrawn` would say *Skipped — you paused it*
   of a skip the learner made (a unit case below; the transition's note reads the same record, so it would have said it again).
4. **"Reload and readback" has a door the brief did not name:** `validateRun` discards a whole stored run it does not recognise.
   Until it takes the new kind (and its state) and the swap's moment, a reload throws away the learner's session (mutant M7: twenty
   cases red). It now does, and an older record with neither field still reads.

## Mechanism

Fault (the reviewer's): the held skip was recorded as `skipped-redundant`, Today's row could not say why, and a swapped piece was
exempt from the veto because it carries no claim, so a pause made *after* a deliberate swap was ignored.

Hypothesis tested, with its refuting test: *one fact, the moment, orders a swap against a pause, and one lookup carries it.*
It would be refuted if a pause from before the swap vetoed the piece, or one from after it did not, or if the order held in the
pure state machine and not through the stored project. The four cases across the layers (pure, transition over real stores, Today
over real stores through its own swap sheet, a browser walk through the real IndexedDB) tell it from the alternative (compare
against the run's start, or against the card's composition) because a swap and a pause made in either order after the start are
both on one side of those.

What the change does, by file:

- `app/src/data/sessionRun.ts`: `Adaptation` is a union: the three kinds as before, and
  `{ kind: 'withdrawn', why, held }`. `RunActivity.swappedAt` (ISO), stamped by `apply`'s `swap` from the clock it is given.
  **`isWithdrawnBy(activity, since)`** replaces `isAutomatic`: a swapped activity (it has `swappedAt`) is withdrawn only by a word
  strictly after the swap; the composition's own offer (it has a claim) by a word from any time; an activity with neither (a swap
  kept by a record from before this change) never, as before. `withhold` is `{ held, since }`, refused for an activity not
  `pending` and for one `isWithdrawnBy` says no to, and records `withdrawn` with the sentence built here from the one text source.
  `choose` on a skipped row takes only its `withdrawn` records away. `withdrawnOf(activity)` is the one reading of why a skipped
  row was withdrawn. `validateRun` takes `withdrawn` (with `held` paused or retired) and `swappedAt` (text).
- `app/src/curriculum/session.ts`: `heldWordOf(projects, target)` (state and `since`), `heldStateOf` its state; `HeldState`.
- `app/src/ui/sessionRunner.ts`: `settleHeld` asks `heldWordOf` and `isWithdrawnBy` and says `withhold` with the project's own
  moment; `skipsBetween` says a `withdrawn` skip as it said the other.
- `app/src/ui/screens/TodayScreen.ts`: the running card's row line is `SESSION_TEXT.withheldRow(withdrawnOf(activity))` where there is
  one, else what it was.
- `app/src/ui/help.ts`: `SESSION_TEXT.withheldRow`; both sentences end on one clause (`youHeld`).

The alternative considered for the ordering (a flag on the swap, "the learner chose this one", never overruled) is the G90
behaviour the reviewer rejected; the alternative for the row (the transition's `why` cut to fit) would have printed the piece's
title on a row that already carries it and cut it at thirty characters.

## Tests

Red = on the base source (`build/g90a/base/app`: the worktree's tree with the five source files put back to `HEAD`, and this lane's
tests copied in; `red-unit-base.txt`; the browser spec against the dist built from it, `e2e-red-base.txt`). Green = the final tree.
A **guard** cannot fail on the base by construction (the base vetoes no swap, or the case pins what must not change); each says
which mutant reddens it.

| Case | Layer | Base | Final | Mutants that redden it |
| --- | --- | --- | --- | --- |
| the veto recorded as `withdrawn` with the state, paused and put away; never `skipped-redundant` | unit, pure | red | green | M1, M11, M16, M18 |
| the easy-success skip is still `skipped-redundant`, said as it was, with no state on it | unit, pure guard | **green** | green | none (nothing mutates it) |
| the runner writes it, said as the transition said it | unit, real stores | red | green | M1, M7, M10, M11, M16, M18 |
| the transition says a withdrawn piece only while the row is still skipped | unit, pure | red | green | M10, M18 |
| `withdrawnOf`: only a skipped row, the latest word, never another skip | unit | red (absent) | green | M17 |
| after a reload the record reads as written and drawing again writes nothing | unit, real stores guard | **green** | green | M7, M10, M18 |
| the swap's moment survives the store | unit, real stores | red | green | M5 |
| `validateRun`: the new kind needs its state, the moment must be text, an older record still reads | unit | red | green | M7, M8, M15, M18 |
| a swap records when it was made; a second swap replaces it and the first's reasons | unit, pure | red | green | M5, M18 |
| a composition's own activity has no swap moment | unit, pure guard | **green** | green | none |
| the order, paused and put away: after the swap withdraws; before it, and at the same moment, does not | unit, pure | red | green | M1, M3, M4, M5, M6, M11, M16 |
| a composition's own activity is withdrawn by a word from any time | unit, pure guard | **green** | green | M18 |
| an activity underway is never withdrawn, swapped or not, whatever the order | unit, pure guard | **green** | green | M13 |
| a swap kept by an older record (no moment) is never withdrawn | unit, pure guard | **green** | green | M19 |
| a withdrawn row tapped back and then skipped by hand carries no word of a pause | unit, pure | red | green | M1, M9, M18 |
| tapping a row skipped for another reason leaves what the runner said of it | unit, pure guard | **green** | green | M20 |
| the transition, both orders, paused and put away: swapped then said, withdrawn at its turn, said, the one after offered | unit, real stores | red | green | M1, M3, M5, M7, M10, M11, M12, M16 |
| the transition, both orders: said then swapped, offered, nothing skipped | unit, real stores guard | **green** | green | M4 (and M12 at G90's revised swap case) |
| the newest word wins (swapped, said, swapped again) | unit, real stores guard | **green** | green | M4 |
| said, then brought back: offered | unit, real stores guard | **green** | green | M21 |
| the swapped piece the learner is in is not interrupted by a later word | unit, real stores guard | **green** | green | none at this layer (the runner's own `pending` test shadows `apply`'s; M13 reddens the pure case above) |
| `settleHeld` says the same | unit, real stores | red | green | M3, M5, M12 |
| Today's row says *Skipped — you paused it* / *… you put it away*, with its mark and the record's kind, the other rows unchanged | unit, real Today | red | green | M1, M2, M7, M11, M16, M18, M22 |
| Today read back from the record: the piece brought back since, the row still says it, *Continue* skips it, nothing rewritten | unit, real Today | red | green | M1, M2, M7, M18 |
| another skip's row keeps the composition's words | unit, real Today guard | **green** | green | M22 |
| an activity underway is not skipped on Today | unit, real Today guard | **green** | green | none at this layer (as above) |
| Today, through its own swap sheet: swapped in then paused, skipped, said on the row, *Continue* opens the one after | unit, real Today | red | green | M1, M2, M3, M5, M7, M11, M16, M22 |
| Today: paused then swapped in, kept, *Continue* opens it | unit, real Today guard | **green** | green | M4, M12 |
| Today: a tapped swapped-then-withdrawn row opens | unit, real Today | red at its set-up (the row is not skipped on the base) | green | M3, M5, M7, M14 |
| Today: the swapped piece the learner is in is not interrupted | unit, real Today guard | **green** | green | none at this layer |
| the browser walk, paused and put away: the record's kind and state; Today's row reloaded at three sizes; the row's parts inside it and none over another, the reason not cut, no sideways scroll, in eight cells | browser | red | green | M1, M2 at their unit layer; the row's geometry: M23, a layout mutant, run in the browser |
| the browser: swapped in then paused: vetoed at its turn, transition, record, row | browser | red | green | M3, M5 at their unit layer |
| the browser: paused then swapped in: offered, nothing skipped | browser guard | **green** | green | M4, M12 at their unit layer |

Revised, class **replace** (the old assertion encoded the model being replaced): `sessionHeldPiece.test.ts`'s swap case
(*stays however its project stands*: G90 said a swapped-in piece is never withdrawn, whenever it was paused; now the swap stays
against a pause from before it, and the later half is `sessionHeldSkip.test.ts`'s), its `withhold` event cases (the event is
`{ held, since }` and the sentence is built by `apply`) and its kind assertion (`withdrawn`, with `held`), its source walk
(`heldWordOf`); `todayHeldPiece.test.ts`'s kind assertion; `projectLifecycle.test.ts`'s source walk (the one lookup is `heldWordOf`;
`heldStateOf` is its state). Old assumptions: a swapped-in piece is withdrawn never; the veto is recorded as the redundancy kind;
the lookup returns a state alone. Class **add**: `sessionHeldSkip.test.ts`, `todayHeldSkip.test.ts`,
`app/tests/e2e/session-held-skip.spec.ts`.

## Done

- The three answers as one change: the kind `withdrawn` with its state, Today's row reason, swap and pause ordered by the
  moment each happened; the readback door; the tap-back clean-up that keeps the row's sentence true.
- Pictures (below) and the row measured in the eight R7 cells, both states; nothing clipped or displaced was exposed, so no layout
  rule changed.
- `04` §2 and §5, `08-test-map.md` (the session row, the projects row, the new per-file lines, the browser spec's line).
- Evidence in this folder: `red-unit-base.txt`, `unit-summary.txt`, `e2e-red-base.txt`, `e2e-green.txt`, `e2e-m23.txt`,
  `e2e-green-restored.txt`, `mutants.txt`, `map-min.txt`, `scripts/`; the pictures in `docs/prompts/pictures/g90a/`.

## Pictures (`docs/prompts/pictures/g90a/`)

Today's running card with the withdrawn piece's row, each state at the three designs (R7):
`today-skipped-row-paused-phone-upright-360x780.png`, `today-skipped-row-paused-phone-sideways-780x360.png`,
`today-skipped-row-paused-tablet-1024x768.png`, and the same three for `retired`. On the phone upright the row is title, the
sentence, the detail line, with the mark above *Swap* and ▶; sideways the card is two columns and the row is the same; on the
tablet the row spans the card. The sentence is shorter than the words it replaces (25 characters at most, against about fifty),
so the row takes no more lines than before: inferred from the lengths and from G90's 342 × 740 picture, where those words took
two lines, not measured against it.

## Not done

1. **A vetoed row the learner taps back to life, then leaves before its screen reports *opened*, is stepped past again** at the next
   Today load or transition (G90's recorded P3). The window is the time a score takes to open; it is the same with a swapped piece.
   The learner's tap is a deliberate choice like a swap and could carry a moment too; not built (not one of the three answers).
2. **Older same-day records are not migrated.** A held skip stored by G90 reads as `skipped-redundant` (its row keeps the composition's
   words, its transition note still says it) and a swap stored by G90 has no moment, so it is never withdrawn, as it never was. A
   run is only ever today's.
3. **A stale `skipped-redundant` record has the same fault the withdrawn one had** (pre-existing, P3): tap the row back, open it,
   skip it by hand, and the transition may say *Easier than expected* of it again. `choose` takes away only the withdrawal now.
4. **Browser suite:** only `session-held-skip`, `session-held-piece`, `session-run` and `today` were run (32 cases). The other
   specs of the map's browser set (`map-min.txt`) and the whole browser suite were not (the brief: targeted specs, one worker).
5. **The row's geometry assertion is shown to catch a cut reason (M23), and nothing more.** Its other checks (every part inside the
   row, no two parts over each other, no sideways scroll) passed in all eight cells in both states on the final tree and were not
   themselves mutated, so they are measured, not shown to fail.
6. **Nothing here was heard**, and no one in this process can hear it; none of it needs hearing.

## Follow-ups (observations; where each came from)

- **P3, pre-existing:** the tap-back-then-leave window of Not done 1, and the stale `skipped-redundant` record of Not done 3.
- **P3, introduced by this seam, said for the reviewer:** a withdrawn row's own line no longer says *when the piece was last played*.
  It is the composition's reason for putting the piece ahead, and the learner has withdrawn it; the detail line still says the slot
  and the level.
- **Environment, pre-existing:** four unit cases fail on this tree as on the base (`unit-summary.txt`): `midiParity` and
  `taughtByAncestry` need `build/` reports a fresh worktree lacks; `lessonClaimsAboutApp` blues.3 and 4.7 read `ScoreScreen.ts` and
  `style.css` through `\n` against this CRLF checkout (G90 recorded the same four). Two more (`expectedNote`, `tempoSoundAgainstMark`)
  time out in the full run under load and pass alone.

## Learner-facing text, itemised (§12)

| Where | Before | After | Why |
| --- | --- | --- | --- |
| `help.ts` `SESSION_TEXT.withheldRow` (new), the subtitle of Today's running-card row for a skipped withdrawn piece (`04` §2) | the composition's words: *Keeping this piece playable — last played on 12 Sep* | *Skipped — you paused it*; for a piece put away, *Skipped — you put it away* | Today is the durable view of what happened and the transition is transient (the reviewer's required change); the verbs are the project sheet's (*Pause*, *Put it away*) and the transition's; title-free because the row carries the title |
| `help.ts` `SESSION_TEXT.withheld`, the transition's note (`04` §5) | *Ode to Joy is skipped — you paused it* | unchanged text; the clause *you paused it* / *you put it away* now comes from one function shared with the row | one fact in one place, so the two sentences cannot drift |

No other sentence changed, none in `content/` or `scores/`, no lesson text.

## Choices made (for the reviewer; each one line, each decided here with its reason)

1. **Replace, not add:** the sentence stands in place of the composition's words on a withdrawn row (reason in premise 3). To keep both,
   the row would take a second reason line; one line in `TodayScreen.activityRow`.
2. **A word at the very same moment as the swap leaves the swap standing** (`>`, not `>=`): the learner chose it. Unreachable by a
   person; fixed so the rule is not a coin toss in a test (mutant M6).

## §11, the five questions

1. **Product** — the six pictures looked at (three designs, both states); the eight cells measured. A teacher's read is inferred, not
   heard. The sentence's wording is the reviewer's, unverified as copy beyond that. Not looked at on a device.
2. **Mechanism** — one: the learner's latest word holds, which needs the moment of each word and one lookup that carries it. The
   alternatives were written out and the cases separate them (Mechanism). The tap-back fault was found by asking what the new row
   text says after a hand skip, and is a unit case.
3. **Evidence** — observed: the red base runs (five unit files, the browser spec on a base dist), the green final runs, 22 unit
   mutants and one browser layout mutant, the pictures, the stored run read from IndexedDB in the walks. Inferred: that no other reader of `adaptations` needs the new
   kind (read in `sessionRunner.ts`, `sessionRun.ts` and `TodayScreen.ts`: the transition's notes, the row; the search of
   `app/src` for `kept-here`, `skipped-redundant` and `adaptations` found those and no others). Scope: one learner seed in the
   browser; the unit cases for the rest; four browser specs of the map's set. Unchecked: the other specs of the set, any device.
4. **Consumers and record** — `04` §2 and §5, the test map, the two guards revised with their reasons beside them; the composer reads
   the same lookup through `heldStateOf` unchanged (`repertoireRetention.test.ts` green); the brief's `## Record` block is the
   landing's, not this entry's.
5. **Addressee** — the choices above are product choices for the reviewer; no one in this process can hear the music and none of
   this needs it.

## Exit codes (every command, in order; numbers here are counts, never timings)

| Command | Exit | Note |
| --- | --- | --- |
| `git log --oneline -1`; `npm ci` (app); copy of the main checkout's built content, audio excluded | 0 | 5c10f17a; read-only source |
| `npx vitest run` the new unit files, on the base source | 1 | before any source edit: 19 of 36 red (`red-unit-base.txt` is the later run on the final tests) |
| `npx tsc -b` | 0 | after the source change; before `sessionHeldPiece.test.ts` was revised its two old `withhold` events were the only errors |
| the five unit files, on a copy of the base source with this lane's tests | 1 | 27 of 106 red (`red-unit-base.txt`) |
| `node scripts/generate-icons.mjs`; `npx vite build` (final dist, and the base copy's) | 0; 0 | the base copy needed `content/` beside it |
| `playwright test … session-held-skip` on the base dist (port 5463) | 1 | 3 red, 1 guard green (`e2e-red-base.txt`); the first run's fourth case was red for a wrong close in the spec, fixed (a sheet closes by its button, not Escape) |
| `playwright test … session-held-skip` on the final dist | 1 | 2 of 4: the spec's own last comparison compared a later write of the opened screen (its `opened`); the spec fixed, not the code |
| the same, twice more (the second with the eight cells) | 0; 0 | 4 passed each |
| `playwright test … session-held-skip session-held-piece session-run today` on the final dist | 0 | 32 passed (`e2e-green.txt`) |
| `npx tsc -b`; `npm run lint` | 0; 1 then 0 | two unnecessary type assertions in the spec, removed |
| `node mutants.cjs` | 0 | 22 mutants, each caught; the five source files identical by checksum afterwards |
| `node css-mutant.cjs apply`; `npx vite build`; `playwright test … session-held-skip` | 0; 0; 1 | M23: 2 red (the reason cut), 2 green (`e2e-m23.txt`) |
| `node css-mutant.cjs restore`; `npx vite build`; `playwright test … session-held-skip session-held-piece` | 0; 0; 0 | `style.css` identical by checksum; 6 passed (`e2e-green-restored.txt`) |
| `npx vitest run` (whole) | 1 | 5 files, 6 cases: 4 environment, 2 load timeouts (`unit-summary.txt`) |
| `npx vitest run` the five files alone | 1 | 4 environment failures; the two timeouts pass |
| `python tools/docs/checks_for_paths.py …` | 0 | `map-min.txt` |
| `npx tsc -b`; `npm run lint`; `npx vitest run` the five files and five neighbours (`sessionAdaptation`, `sessionTransition`, `repertoireRetention`, `sessionRun`, `todaySessionRun`) | 0; 0; 0 | 198 passed, after the last edit |
| `python tools/docs/record_mirrors.py --check` | 2 | *Entry 221 names 'G90a', which no record block declares*: the brief is not in the repository yet, and its `## Record` block comes with the landing; not this lane's to add |

## Files

- Source: `app/src/data/sessionRun.ts`, `app/src/curriculum/session.ts`, `app/src/ui/sessionRunner.ts`, `app/src/ui/help.ts`,
  `app/src/ui/screens/TodayScreen.ts`
- Tests: `app/tests/unit/sessionHeldSkip.test.ts`, `todayHeldSkip.test.ts` (new); `sessionHeldPiece.test.ts`,
  `todayHeldPiece.test.ts`, `projectLifecycle.test.ts` (revised); `app/tests/e2e/session-held-skip.spec.ts` (new)
- Docs: `docs/04-ui-spec.md`, `docs/08-test-map.md`
- This folder: `docs/prompts/runs/G90a/ENTRY.md`, `red-unit-base.txt`, `unit-summary.txt`, `e2e-red-base.txt`, `e2e-green.txt`,
  `e2e-m23.txt`, `e2e-green-restored.txt`, `mutants.txt`, `map-min.txt`, `scripts/` (`playwright.g90a.config.ts`, `mutants.cjs`,
  `mutant-map.cjs`, `css-mutant.cjs`, `run-e2e.sh`, `make-evidence.cjs`)
- Pictures: `docs/prompts/pictures/g90a/` (six: paused and retired at 360 × 780, 780 × 360 and 1024 × 768)

**Orchestrator's note at the landing (2026-10-02).** G90a's worktree committed by name (30849a42) and merged (3c2d9593). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/G90a/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/G90a/orchestrator-exit.txt`). Dispatched at `ee62c06c` as G90's required change, under the accepted contract.. G90a landed: the held skip as one lifecycle truth
