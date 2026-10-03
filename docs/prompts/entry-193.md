### Entry 193 — U105c — a refusal stays whole while the run object runs

Fix-forward under the fast path for U105b's required change (`docs/review/responses/6a374f8a.md`, APPROVE WITH ONE REQUIRED CHANGE), with the second read's notes folded in. Brief: `docs/prompts/tasks/U105c-a-refusal-stays-whole-while-the-run-object-runs.md`. Base: `fadafbfa` (`git log -1 --format=%h` in the worktree before anything else).

## Judgement

**Unverified on a device** (no phone; this Chromium, with a face forced onto every element; the runner's own face is not known). **Unverified as copy**: the sentences are U105's and unchanged. **Pedagogical verdict: not applicable**: nothing taught, judged or recorded changes; this is layout only. Nothing was heard.

What a learner meets, upright at 342 × 740, on a face wider than this machine's (Verdana, or DejaVu Sans where it is absent: the repo's stand-in for the runner), in a Wait run they have paused, after tapping *Hear it* with the sound suspended:

- **Before:** the line under *Wait for me* reads *Sound did not start — tap Hear it a…*. The word that says what to do, *again*, is behind the ellipsis. The run is paused and nothing moves, and the line that explains the dead tap is cut. Picture: `docs/prompts/pictures/u105c/paused-hear-342x740-wider-face-before.png`.
- **After:** *Sound did not start — tap Hear it* / *again*, whole, on two lines. The header is one line taller, and the sheet below moves down by that line at the same drawn size (the engraving zoom and the cursor slot's transform are the same before and during the refusal). Nothing is drawn over the sentence, and it overlaps neither the stage, the notes nor any control. Picture: `…-after.png`.
- **At 115 % text** the committed build cut the same sentence by a pixel. It now takes two lines, the drawn size unchanged.
- **▶ to carry on, and ▶ over a demonstration:** *Sound did not start — tap ▶ again* fits one line on both faces here. Before, it sat in a box with the ellipsis set, so any face wider than the line would have cut it. Now it wraps if it needs to.
- **▶ tapped again once the sound can start:** within that tap, while ▶ still waits for the sound and the run is still paused, the sentence goes and the header is back to its height before the refusal. Then the run carries on at that height and at the size it kept. The extra line never reaches a moving run.
- **On this machine's own face** *tap Hear it again* fits one line, and the screen is as it was.
- **Three seconds after the tap** the header folds away during a pause as during any run, and the sentence moves to the stage's corner chip. On the wider face the chip, *bar 1 / 4 · Sound did not start — tap Hear it again*, takes two lines, and it covers the first system's fingerings (*3 2 1*) and the top of the clef. **This is not new, and this change does not touch it.** The ordinary paused line does the same in the chip on both faces: *bar 1 / 4 · Paused — ▶ to carry on, …* is two lines on this machine's own face too. Even a one-line chip covers the fingerings' boxes. Pictures: `paused-342x740-wider-face-folded-no-refusal-before.png`, `paused-hear-342x740-wider-face-folded-before.png` and `…-folded-after.png`. Brought to the reviewer as Question 1, not fixed.
- **Sideways** the header is not drawn, and the bar's status mirror still cuts the sentence at `28vw`. Recorded as a follow-up, not touched.

## The mechanism and the discriminating test

**Mechanism.** U105b's exception, `body:has([data-sound-refused]) .screen--score:not([data-running='true']) .score-head .help-strip__now`, stopped at `data-running='true'`. A paused run keeps that attribute:

- `PracticeEngine.pause` sets `paused` and leaves `running` true.
- `ScoreSession.running` reads the engine.
- `render` writes `section.dataset.running = String(session?.running === true)`.

`withSound` gates the refusal on the audio engine alone, and `drawWaitingFor` puts `soundOffLine()` first whatever the run is doing. So in a paused run the header carried the refusal under the one-line clamp, `.score-head .help-strip__now { white-space: nowrap; overflow: hidden; text-overflow: ellipsis }`.

**The hypothesis and its refuting test, run before any edit** (`probe-*-before.json`, `probe-before-summary.txt`). Every case is upright at 342 × 740 on the committed CSS. A Wait run is started with the sound running and frozen (`scoreFit().frozen`), then:

- for the two ▶/*Hear it* rows, the run is paused;
- for the demonstration row, `Hear it` is started instead and frozen;
- then the context is suspended with `resume` stubbed never to answer, and the control is tapped.

This run's own measurements, the line's `scrollWidth` against its `clientWidth`:

| Path | App's stack | Wider face | 115 % text |
| --- | --- | --- | --- |
| ▶ during a pause | 283 in 283, ellipsis set | 283 in 283, ellipsis set | 280 in 280, ellipsis set |
| `Hear it` during a pause | 283 in 283, ellipsis set | **cut**: 298 in 283, the text outside its box | **cut**: 281 in 280, the text outside its box |
| ▶ over a demonstration | 283 in 283, ellipsis set | 283 in 283, ellipsis set | 280 in 280, ellipsis set |
| A bar held 900 ms in a paused run (wider face only) | — | **no refusal**: the line kept *Paused — …*, nothing marked | — |

After removing the clause alone (`probe-*-after.json`, `probe-after-summary.txt`), every sentence is whole: `white-space: normal`, no ellipsis, inside its box, and nothing drawn over it. Where it outgrew the line (`Hear it`, on the wider face and at 115 %), the line took two lines and the header grew by one line, and the stage's top moved down by the same amount. In those cases:

- the engraving zoom and the cursor slot's transform did not move;
- the header overlapped neither the stage, the drawn notes nor the bar.

No overlap and no unsafe geometry, so the hypothesis held. The marker fallback was not needed; the brief had already decided against a marker for the staff-size reason.

**Which path discriminates** (the brief's first unverified item). `Hear it`'s sentence is the longest a paused run shows. ▶'s fits one line on both faces here, and only the ellipsis check discriminates it, which no face can hide. The committed case taps both.

**The fold** (the brief's second unverified item). It fired inside the probe's own timing in every case (the probe waits for `data-chrome='folded'` after each tap). A `revealBar` right before each read is enough. The committed case reads with the chrome open, and its `look()` reveals once more if the header is not drawn.

**The fix.** One selector and two comments in `app/src/style.css`:

```css
body:has([data-sound-refused]) .screen--score .score-head .help-strip__now {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  overflow-wrap: anywhere;
}
```

- **The clamp's comment** now ends: *the rule after this one lets wrap: a refused tap's, whatever the run is doing*.
- **The rule's comment** is rewritten. It says:
  - the exception covers every state the sentence can stand in, with the reviewer's rule and response cited;
  - the paths: ▶ to carry on, *Hear it* or *Start again* during a pause, ▶ over a demonstration;
  - a bar held is not one;
  - why the fit reason above does not forbid it: the frozen fit holds when the stage's height changes mid-run, the line goes within the next tap or at the next redraw once the sound runs, and every other run line is still clamped. The exception is keyed on the refusal, not on the run.
- `ScoreScreen.ts` is untouched, and there is no marker.

## Premises found wrong

1. **Premise 5's "a bar held" path cannot set a refusal during a run.** The stage's `pointerdown` timer returns at `if (session?.running === true) return;` (`ScoreScreen.ts`:3152) before `hearBar` is called, paused runs included, and `hearBar`'s act returns on the same condition. The probe held a bar for 900 ms in a paused run with the sound suspended: no refusal, nothing marked (`probe-bar-held-paused-wider-face-*.json`). U105b's Question 1 and the old comment both named this path. The new comment says it is not one.
2. **Paths the brief did not name reach the same state.**
   - `Hear it` during a pause: `toggleHear` → `withSound(toggleHearNow, HEAR_TAP)`. Observed; it is the discriminating one.
   - *Start again* from `⋯` during a run: `RESTART_TAP`, `ScoreScreen.ts`:1245–1256 and :1912. Read in the code, not exercised.
3. **Premise 16's framing of the chip.**
   - The chip does not receive the header's wrapped sentence. It mirrors the text itself (`syncBarLeft`) and was never clamped, so it wrapped before this change and wraps the same after it. The header rule does not reach it.
   - The 22 px reserve does not apply in the layout this piece is drawn in. The stage's `data-read-ahead` reads `slots`, and in that mode `packSlots` writes each slot's `top` inline from 0 (`WindowRenderer.ts`:3381–3411), over the folded rule's `top: var(--score-corner-h, 22px)`. `sheetShift` gives the reserve only to the single sliding sheet (:2097–2101).
   - Read at runtime (`probe-chip-reserve.json`, this machine's face, paused and folded): the cursor slot's inline and computed `top` are `0px`. Only the unused buffers keep `22px`.
   - So in the stacked layout the chip sits over the first row whatever it says.

## Done

- Base confirmed: `fadafbfa`.
- Red first on the committed CSS: the new paused-run case under the wider face. Quoted under Tests.
- Green: the new case. Also green eight times under four workers (`--repeat-each=8`).
- U105b's upright and sideways cases unchanged and green, inside the whole `score.screen.spec.ts` (49 passed).
- `score.fuzz.spec.ts` (five seeds) and `score.head-height.spec.ts` (seven cases) green.
- The mutant that reinstates the no-run restriction is killed by the paused case alone. The six other cases of the U69 describe stay green, and so do the fuzz and header-height files.
- The comment at the clamp and the rule's comment rewritten.
- The new case raises the refusal only after the freeze (`scoreFit().frozen`), so it measures the rule and not the re-plan allowed before it.
- **The branch CI may take.** `Hear it` forced behind `⋯` at 342 px (`probe-sheet-hear-in-more-after.json`), the overflow forced as `score.head-height.spec.ts`'s last case forces it. Pressed through `pressAnywhere` as the committed case presses it, the refusal was whole and the header one line taller. The drawn size was kept, and the mark stayed on the control in the closed sheet's stash.
- **The corner chip checked**, with no refusal and with one, at three conditions. The overlap is confirmed and reported (Question 1), not fixed.
- **The sideways cut recorded** (Follow-ups).
- Before-and-after pictures at 342 × 740 on the wider face.
- `tsc -b` and eslint on the changed spec, both exit 0.

## Not done

- **No device check.** None available.
- **Not in any committed test:**
  - *Start again* refused during a run (read in the code only);
  - a refusal during a run that is moving rather than paused (`Hear it` tapped mid-run in Keep tempo with the sound suspended). The rule covers it by construction, since its selector no longer reads the run.
- **The corner chip is not fixed, and no committed test asserts it.** It overlaps on the committed build and on the fix alike, with or without a refusal, so an assertion would be red on a change this lane may not make (Question 1).
- **The whole unit suite and the whole browser suite were not run.** Only the targeted files ran: the three browser specs the brief names, and the unit files that read `style.css` or the refusal contract. CI is the full run.

## Deviations

- **The case taps two controls, not one.** ▶ first (the brief's named path, discriminated by the ellipsis check on any face), then `Hear it` (the sentence long enough to wrap on the wider face, and what the drawn-size and header-height checks are held against).
- **The fourth proof is read inside ▶'s tap.** The sentence goes and the header returns while ▶ still waits for the sound and the run is still paused. It is read by a mutation observer on the state line, whose callback runs as the tap's handler returns, ahead of the start's own answer. Then the run is seen carrying on at that height and size.
- **The retap that clears the refusal is ▶, not `Hear it`.** ▶ continues the paused run, which is the run object this change is about. Retapping `Hear it` would start a demonstration, a different run with its own freeze.
- **A precondition, soft:** `Hear it`'s refusal made the header taller than before. Without the extra line the drawn-size check proves nothing (the pattern of `score.head-height.spec.ts`'s *the overflow was not forced* check).

## Follow-ups (recorded, not fixed)

- **Sideways, the bar's status mirror cuts the refusal (under U105, same invariant).** Sideways the header is hidden (`style.css`:961–963). The state line is mirrored into `.score-bar__status` (`ScoreScreen.ts`:1189), which is `nowrap` with an ellipsis at `max-width: 28vw` (`style.css`:2910–2917) whatever the state. So a refusal with no summary up (▶ refused sideways), and one in a paused run, is cut there, before this change and after it. U105a gave the summary its own copy, and this surface has none. Read at the lines; not measured in this lane.
- **The corner chip** (Question 1).
- **The two `lessonClaimsAboutApp.test.ts` checks that fail on this Windows (CRLF) checkout**, *blues.3* and *4.7*. These are the same two U105b recorded, still failing for the same reason (`unit-crlf-check.txt`). Neither text is touched here.

## Questions

1. **For the reviewer (a geometry choice, the reviewer's by the brief): the corner chip covers the first row of notation while folded, refusal or not.** The facts, all from this run:
   - In the stacked read-ahead (`slots`) the slots take `top` 0 inline, so the 22 px reserve the folded rule gives the buffers never reaches them (premise 3 above).
   - The chip itself is unclamped. With the ordinary paused line it takes two lines on both faces. With *Hear it*'s refusal it takes two on the wider face and one on this machine's.
   - Either way it paints over the first system's fingerings and the clef's top, with its background, so they are hidden: on Hot Cross Buns at 342 × 740, paused and folded.
   - The refusal makes it no worse than the paused line already does.

   The review's own instruction holds: not to be solved by cutting the explanation. The choice is whether this goes under U105 (the refusal's visibility), or under the fold and chip (`08` §5.3), since it is not refusal-specific. Possible directions, for the reviewer to rule on, none built:
   - give the slot layout the chip's reserve when folded;
   - keep the chip to `bar n / m` and leave the run's sentence to the header, which a tap brings back;
   - a stable status surface of its own.

## Files

- `app/src/style.css`: the refusal rule's selector without `:not([data-running='true'])`, its comment rewritten, and the clamp's comment.
- `app/tests/e2e/score.screen.spec.ts`: the paused-run case, and `pressAnywhere`, `pressControl` and `revealBar` added to the import from `./scoreControls`.
- `docs/prompts/runs/U105c/`: this entry, the logs, the probe JSONs and summaries, and the scripts (`scripts-*`).
- `docs/prompts/pictures/u105c/`: the paused refusal on the wider face, unfolded and folded, before and after, and the folded paused line with no refusal, before and after.

## Tests

| Test | Class | Old assumption |
| --- | --- | --- |
| a refusal during a paused run, upright (342 × 740) on a wider face: the sentence whole, the drawn size kept, nothing overlapped, the header back to its height before the run carries on | add (replaces the surviving-mutant gap, U105b's m3) | A refusal with `data-running='true'` stays one line with an ellipsis, like every other line of a run. |
| a refused tap on the summary: upright, upright on a wider face, sideways | preserve, unchanged | — |
| the rest of `score.screen.spec.ts` | preserve | — |
| `score.fuzz.spec.ts`, `score.head-height.spec.ts` | preserve, unchanged | — |

No test was added to keep the no-run condition. The reviewer said not to.

**Red on the committed CSS** (`browser-red-base.txt`), 1 failed. Soft failures, in order:

- "#score-play: the header’s line cuts with an ellipsis — Expected: false, Received: true"
- "#score-hear: the sentence overflows its line — Expected: <= 283, Received: 298"
- "#score-hear: the sentence runs outside its line"
- "#score-hear: the header’s line cuts with an ellipsis"
- "#score-hear: something is drawn over the sentence"
- "the sentence took no second line, so the drawn size was not tested against one — Expected: > 84.890625, Received: 84.890625"
- then "the refusal is not whole, or moved the sheet, or covers something — Expected: 0, Received: 6"

**Green** (`browser-green.txt`): 1 passed. Eight times (`browser-green-repeat.txt`): 8 passed.

**Mutant** (`mutants.txt`, `m1-*`). Built with `vite build`. `style.css` was restored byte for byte, checked by hash. The fixed dist was rebuilt after, with `npm run build:app`.

| Mutant | Result |
| --- | --- |
| m1: the refusal rule with U105b's `:not([data-running='true'])` reinstated | **Killed by the paused case alone.** `score.screen.spec.ts -g "U69"`: 1 failed, 6 passed; the failing lines are the base red's. `score.fuzz.spec.ts` + `score.head-height.spec.ts` with no `-g`: 12 passed. |

## Exit codes

| Step | Exit | Counts |
| --- | --- | --- |
| `npm ci` | 0 | "added 610 packages" (the log's trailing `exit` line was written by `cmd` at parse time; read npm's own line) |
| `npm run build:app` on the base | 0 | |
| `npm run build:app` on the fix | 0 | includes `tsc -b` |
| `npm run build:app` after the mutant | 0 | |
| `npx tsc -b` | 0 | covers `tests/e2e` (`tsconfig.node.json`) |
| `npx eslint tests/e2e/score.screen.spec.ts --max-warnings=0` | 0 | |
| The paused case, red on the base | 1 | 1 failed |
| The paused case, green | 0 | 1 passed |
| The paused case, `--repeat-each=8` | 0 | 8 passed |
| The whole `score.screen.spec.ts` | 0 | 49 passed |
| `score.fuzz.spec.ts` + `score.head-height.spec.ts` | 0 | 12 passed |
| Probe, before | 0 | 10 passed |
| Probe, after | 0 | 10 passed |
| Probe, `Hear it` in the `⋯` sheet | 0 | 1 passed |
| Probe, the chip's reserve | 0 | 1 passed |
| m1, U69 describe | 1 | killed: 1 failed, 6 passed |
| m1, fuzz + header height | 0 | 12 passed |
| `vitest` on `projectSheet`, `lessonClaimsAboutApp`, `scoreSheetsCloseAndPlayStartsSound`, `scoreMidRunSettings` | 1 | 371 passed, 2 failed (the two CRLF checks above) |

Every browser run used port 5293 through the config copy (`scripts-playwright.u105c-5293.config.ts`).

**Orchestrator's note at the landing (2026-09-30).** U105c's worktree committed by name (842ea210) and merged (f42973ee). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U105c/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; e2e-targeted 1; vitest-timeouts-rerun 0; e2e-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; the other failures were load and pass alone (`vitest-timeouts-rerun`) — the targeted specs' failures passed alone (`e2e-rerun`); the note names them; `runs/U105c/orchestrator-exit.txt`). U105b's own Question 1, left open at Entry 192: whether a refusal standing during a run — ▶ to carry on from a pause, a bar held, or ▶ over a demonstration, with the sound suspended — should wrap too, or keep the old one-line cut. Fix-forward under the fast path on the reviewer's required change on U105b (`responses/6a374f8a.md`, APPROVE WITH ONE REQUIRED CHANGE): *The newly discovered paused-run path exposes the same product invariant ... The implementation may not keep the actionable refusal sentence cut merely because `PracticeEngine.running` stays true while the run is paused/held/demonstrating ... Wrap the refusal there too ... The simplest implementation may be to remove the `:not([data-running='true'])` restriction from the refusal exception ... whenever `data-sound-refused` is the reason the header is showing this sentence, the sentence must remain whole.* Add a discriminating paused-run case proving the sentence visible, the frozen staff size kept, no overlap, and the ordinary height restored on clearing; no test added to preserve the no-run condition as a boundary, since it should no longer be the product boundary; a marker only if the plain selector change produced an overlap or unsafe geometry — not built here, since the probe found none.. a refusal stays whole during a paused run too; the folded corner chip covering the first system is the reviewer's question

## Doc rows

Proposed, not applied. U105b's proposed rows for `04` §5f say *while no run is on* and *A refusal standing during a run … is cut like every other line of a run*. These replace those two parts. The rest of U105b's rows stand.

- **`docs/04-ui-spec.md` §5f, the run's own sentences.** Change "at 342 px the state line holds about forty characters and cuts the rest with an ellipsis:" to "at 342 px the state line holds about forty characters and cuts the rest with an ellipsis — a refused tap's sentence excepted, which wraps to the lines it needs whatever the run is doing (U105b, U105c):". At the end of the *tap whose sound did not start* bullet, add: "The header's line wraps that sentence rather than cutting it, with no run on and during one alike: in a paused run (▶ to carry on, `Hear it`, *Start again*) and over a demonstration (▶) (U105b; U105c, `responses/6a374f8a.md`). A bar held during a run asks for nothing, so it has no refusal to say."
- **`docs/08-test-map.md`, the `score.screen.spec.ts` row.** Append: "U105c: upright at 342 × 740 on the wider face. A Wait run is started, frozen (`scoreFit().frozen`) and paused, and the context suspended with `resume` never answering. ▶ then `Hear it` are refused. Each sentence is whole (no overflow, no ellipsis, nothing drawn over any of its lines, in the window). The header is clear of the stage, the drawn notes and every control. The engraving zoom and the cursor transform are unchanged while the header carries `Hear it`'s second line. With `resume` answering, ▶: within its tap (▶ busy, the run still paused) the sentence is gone and the header back to its height before the refusal; then the run carries on at that height and size. Red on U105b's no-run condition (▶'s line ellipsis-clamped; `Hear it`'s wider than its line and cut). The mutant reinstating that condition reddens this case alone."
- **`docs/08-test-map.md`, the `score.head-height.spec.ts` row** (optional, as U105b proposed). Append: "Since U105c, the reason a refusal's extra header line is allowed during a run: the frozen size holds through 24–96 px of added header height."

## Content

Nothing under `content/` or `scores/` changes. The §12 itemisation list is empty: no lesson text, table, sentence wording or score bytes change.
