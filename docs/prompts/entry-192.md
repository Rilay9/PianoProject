### Entry 192 — U105b — the header's refusal line wraps to the lines it needs

Fix-forward under the fast path for CI run 36779781211 on `122a5224`. That run failed U105a's upright case (`score.screen.spec.ts`:1379, "the sentence overflows its line: expected <= 283, received 302"). The fix follows the reviewer's ruling on U105a (`responses/d0e1b01f.md`, choice 3: wrap, do not force one line), extended to the header's line `#score-waiting`. Base: `122a5224` (`git log -1 --format=%h` in the worktree before anything else). The brief was read from the main checkout, because it is not in the base tree.

## Judgement

**Unverified on a device** (no phone; this Chromium with a face forced onto every element, the runner's actual face not known). **Unverified as copy**: the sentence's words are U105's and unchanged. **Pedagogical verdict: not applicable**: nothing taught, judged or recorded changes. This is layout only. Nothing was heard.

What a learner meets, upright at 342 × 740, on a face wider than this machine's (the repo's stand-in for the runner, Verdana or DejaVu Sans), after a refused *Slower* on the summary:

- **Before:** the line under *Keep tempo* reads *Sound did not start — tap Slower a…*. The control to tap again is cut off.
- **After:** the line takes two lines, *Sound did not start — tap Slower* / *again*, and nothing of it is cut. The header grows by that one line. The notation below moves down by the same height and stays at its drawn size (the front sheet's box keeps its width and height, and its top moves down by the line's height: `probe-summary-slower-wider-face-*.json`).
- **The summary sheet** still starts below the line, and nothing is drawn over it. Pictures: `docs/prompts/pictures/u105b/upright-342x740-wider-face-before.png` and `-after.png`.
- **At 115 % text** the sentence also takes two lines, where the committed build cut it.
- **On this machine's own face** the sentence fits one line, and the screen is as it was: the same header height and the same stage, measured before and after.
- **During a run** nothing changes. Every line a run shows stays one line with an ellipsis, as the mid-run fit guard requires (the mutant below that takes the clamp off a run's line is killed).

One state keeps the old cut, because the dispatched scope excludes it: a refusal that stands *during* a run, meaning ▶ tapped to carry on from a pause, a bar held, or ▶ over a demonstration, with the sound suspended. The brief assumed this state could not arise. It can (below). Question 1.

## The mechanism and the discriminating test

**Mechanism.** `.score-head .help-strip__what, .score-head .help-strip__now { white-space: nowrap; overflow: hidden; text-overflow: ellipsis }` (`style.css`, the rule the brief cites at :6127–6132) holds the header's state line to one line. `#score-waiting` carries `help-strip__now` (`helpStrip.ts` adds it to the `nowElement`). On a face whose glyphs are wider, *Slower*'s sentence is wider than the line and is cut. On this machine's face the same sentence fits, which is why U105a's case passed here and failed on the runner.

**The hypothesis and its refuting test, run before any edit** (`probe-*-before.json`, `probe-before-summary.txt`, all upright at 342 × 740 on the committed CSS, with the summary's *Slower* refused):

| Condition | Result (this run's own measurements) |
| --- | --- |
| The wider face | scrollWidth 299 against clientWidth 283, `textInside` false, `text-overflow: ellipsis`. This is CI's shape: the runner read 302 against 283 at the same size. |
| 115 % text | Cut by one pixel (281 against 280). |
| A synthetic sentence written into the line | Cut on the app's own face. |

After the change, under the same three conditions (`probe-*-after.json`): nothing is cut and the line's box is two, two and three lines tall respectively. So nothing else clamps the element: no ancestor overflow and no fixed height. The hypothesis held, and the fix acts on the one rule.

**The fix.** One rule after the clamp, in `style.css`:

```css
body:has([data-sound-refused]) .screen--score:not([data-running='true']) .score-head .help-strip__now {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  overflow-wrap: anywhere;
}
```

The clamp's comment now says it has one exception and points to the new rule, whose own comment gives the ruling, the runner's cut and the scoping. No fixed line count replaces the clamp (G101, `responses/cbdfe6f0.md`).

**How the state is named (the builder's choice, with reasons).** Two conditions, both already in the DOM, so `ScoreScreen.ts` is untouched:

1. **`data-sound-refused`.** `markRefused` puts it on the refused control exactly while `soundOffLine` draws the sentence. Both come from `refusedNow()` in the same render. `withSound` clears the sentence and the mark together, synchronously, when a tap asks again, before that tap's run can start.
2. **`:not([data-running='true'])`.** This is the dispatched "no run on".

`data-running` alone was rejected. It would unclamp every line shown at rest (the mode's standing line, the ready line). On a face where one of those is wider than the line, the header would then change height at every run start, which `score.head-height.spec.ts`'s first case forbids. That is inferred from the rule and the spec; no face was found that shows it. A summary-only scope (`#summary-refusal:not(:empty)`) was rejected too. It would leave the same sentence cut for ▶, *Carry on*, *Start again* and a key refused with no summary up: the same line, the same clamp, the same ruling. The `:has` sits on `body`, not the screen, because a control refused inside the `⋯` sheet sits on `body` (`openStashedSheet`). That case is read in the code and no test exercises it.

## Premises found wrong

1. **Premise 7 and the orchestrator's "code fact"** say the header carries the refusal sentence only while no run is on. That is wrong at the lines, and this lane kept the dispatched scope regardless. The paths:
   - `togglePlay` sends ▶ during a pause through `withSound(playNow)` (`ScoreScreen.ts`:2936).
   - A paused run still reads running: `PracticeEngine.pause` leaves `running` true, and `ScoreSession.running` reads the engine.
   - So a refusal can stand with `data-running='true'`. A bar held is the same, and so is ▶ over `Hear it` (`hearingLine` needs `session.running`).

   Those refusals stay cut. Question 1.
2. **Premise 7 also says** the refusal sentence is shown only while the summary is up. Also wrong: `drawWaitingFor` puts `soundOffLine()` first whatever the sheet (G86a's ▶ case has no summary). The fix covers every refusal while no run is on, which is the brief's decided text ("while it is showing the refusal sentence").
3. **The brief's unverified item** (another spec asserting the header's height in this state) has an answer. `score.head-height.spec.ts` asserts the header's height at rest equals it started, and that a long line mid-run is cut. It is green on the fix, and it is the spec that kills the run-clamp mutant (below).

## Done

- Base confirmed: `122a5224`.
- Red first on the committed CSS, with the repo's own technique (the wider face, `plan.spec.ts`/U90). The 115 % text and synthetic-sentence probes are also red. Quoted under Tests.
- Green: all three refusal cases.
- The sideways case unchanged and green.
- The whole `score.screen.spec.ts` green. `score.fuzz.spec.ts` green (all five seeds), and `score.head-height.spec.ts` green.
- Mutants: the refusal clamp reinstated is killed by the upright cases. The run's clamp removed survives `score.fuzz.spec.ts` on this machine's face and is killed by `score.head-height.spec.ts`.
- The before and after pictures at 342 × 740 under the wider face.
- The CSS comments updated.
- `tsc -b` and eslint on the changed spec, both exit 0.

## Not done

- **No device check.** None available.
- **The new rule's no-run condition is untested.** Mutant 3 dropped it and survived. Within `app/tests/e2e/*.spec.ts` only `score.screen.spec.ts` suspends the context, and every refusal it makes happens with no run on. A test for it depends on Question 1's answer, so none was written.
- **The whole unit suite and the whole browser suite were not run.** Only the targeted files were: the spec files that read this rule's state or `style.css`, and the unit files that read `style.css` or the `data-sound-refused` contract. CI is the full run.

## Deviations

- **The upright case's ellipsis check.** Both upright cases gained `expect.soft(seen.ellipsis, 'the header's line cuts with an ellipsis').toBe(false)`. This makes the upright case on the app's own face discriminate the clamp too, rather than depending on a face to show it (G101's lesson). The sideways case's assertions are unchanged.
- **One kept variant, not two.** The wider face alone is the kept variant, because it reproduces the runner's shape. The 115 % text is recorded from the probe only: it is red on the committed CSS by one pixel here, and two lines after the fix.
- **Scope wider than "summary up"**, for the reason under premise 2.

## Follow-ups (recorded, not fixed)

- **Observation (test robustness, not learner truth).** Two checks in `tests/unit/lessonClaimsAboutApp.test.ts` fail on this Windows (CRLF) checkout: *blues.3* and *4.7*. Each matches `\n`-literal text in a file read raw (`ScoreScreen.ts`, and the `.score-stage--blind` rule). Neither text is touched here. The LF form is absent and the CRLF form present (`unit-crlf-check.txt`). CI's LF checkout is unaffected.

## Questions

1. **For the orchestrator (a learner-behaviour choice, so not settled under the fast path).** A refusal standing during a run keeps the one-line clamp: ▶ to carry on from a pause, a bar held, or ▶ over a demonstration, with the sound suspended. *Sound did not start — hold bar N again* is as long as *Slower*'s sentence, so on the runner's face it would be cut there as *Slower*'s was. That is inferred from the length, not measured. The choice:
   - **Wrap it there too** (drop the rule's no-run condition). A paused run's stage then moves by a line while the sentence stands. The renderer keeps the drawn size when the stage's height changes mid-run (`score.head-height.spec.ts`'s third case), but the clamp's own stated reason is that fit.
   - **Keep the cut there.** The whole sentence is behind the strip's `?`.

## Files

- `app/src/style.css`: the refusal rule after the clamp, and both comments.
- `app/tests/e2e/score.screen.spec.ts`: the upright case on the wider face, the upright ellipsis check, and the case's comment.
- `docs/prompts/runs/U105b/`: this entry, the logs, the probe JSONs and the scripts (`scripts-*`).
- `docs/prompts/pictures/u105b/upright-342x740-wider-face-before.png` and `-after.png`.

## Tests

| Test | Class | Old assumption |
| --- | --- | --- |
| a refused tap on the summary, upright (342 × 740) **on a wider face** | add | The upright case read the header's line on this machine's face only, where the sentence happens to fit. |
| the header's line cuts with no ellipsis (both upright cases) | add | An ellipsis-clamped line passed whenever its text happened to fit. |
| a refused tap on the summary, upright (342 × 740), the app's stack | preserve (now also checks the ellipsis) | — |
| a refused tap on the summary, sideways (740 × 342) | preserve, unchanged | — |
| `score.fuzz.spec.ts`, `score.head-height.spec.ts` | preserve | — |

**Red on the committed CSS** (`browser-red-base.txt`), 2 failed and 1 passed:

- On the wider face: "the sentence overflows its line — Expected: <= 283, Received: 299", "the sentence runs outside its line", "the header's line cuts with an ellipsis", then "the sentence is not seen whole, once".
- On the stack: "the header's line cuts with an ellipsis".
- Sideways passed.

**Green** (`browser-green.txt`): 3 passed.

**Mutants** (`mutants.txt`; each built with `vite build`, `style.css` restored byte for byte after each):

| Mutant | Result |
| --- | --- |
| m1: the one-line clamp reinstated on the header's line in the refusal state | **Killed.** Both upright cases fail, with the same lines as the base red. Sideways passes. |
| m2: the clamp taken off the header's now line in every state, a run's included | **Survived `score.fuzz.spec.ts`** (5/5 green: on this machine's face no run line outgrows its line, so the fuzz walk cannot see it here). **Killed by `score.head-height.spec.ts`**: "starting a run must not change the header's height" at 342 px and "a message longer than the row must be cut, not wrapped" at 390 px (the header one line taller in each). |
| m3: the refusal rule without its no-run condition | **Survived** the six cases of the U69 describe. The fuzz and header-height files were filtered out by the `-g`, and neither suspends the context, so neither can reach a refusal. |

## Exit codes

| Step | Exit | Counts |
| --- | --- | --- |
| `npm ci` | 0 | |
| `npm run build:app` on the base | 0 | |
| `npm run build:app` on the fix | 0 | includes `tsc -b` |
| `npm run build:app` after the mutants | 0 | |
| `npx tsc -b` | 0 | |
| `npx eslint tests/e2e/score.screen.spec.ts --max-warnings=0` | 0 | |
| The refusal cases, red on the base | 1 | 2 failed, 1 passed |
| The refusal cases, green | 0 | 3 passed |
| The whole `score.screen.spec.ts` | 0 | 48 passed |
| `score.fuzz.spec.ts` + `score.head-height.spec.ts` | 0 | 12 passed |
| Probe, before | 0 | 8 passed |
| Probe, after | 0 | 8 passed |
| m1 | 1 | killed |
| m2 | 1 | killed by the header-height spec |
| m3 | 0 | survived |
| `vitest` on `projectSheet`, `lessonClaimsAboutApp`, `scoreSheetsCloseAndPlayStartsSound` | 1 | 365 passed, 2 failed (the two CRLF checks above) |

Every browser run used port 5283 through the config copy.

**Orchestrator's note at the landing (2026-09-30).** U105b's worktree committed by name (6a374f8a) and merged (712bed8b). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U105b/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/U105b/orchestrator-exit.txt`). CI red on run 36779781211 at `122a5224`: U105a's upright case (`score.screen.spec.ts`:1379) failed on the runner's face, the sentence measuring 302 px against a 283 px line (this lane's own before-probe reproduces the shape here, 299 against 283). Fix-forward under the reviewer's own ruling on U105a's third choice (`responses/d0e1b01f.md`): *Wrap, do not force one line. A refusal sentence is state/explanation text, not a density-critical toolbar label. Keeping it whole at larger text/display settings outranks preserving one-line height. The current measurements showing one line at 740 px are a guard, not a reason to encode a clamp.*. Landed: the header's refusal line (`#score-waiting`) wraps to the lines it needs while a refused control's mark stands and no run is on — one CSS rule after the one-line clamp, `ScoreScreen.ts` untouched, the mid-run height guard kept; the runner's cut sentence (CI 36779781211) reproduced locally on the repo's wider stand-in face, red then green; a refusal during a paused run still cuts and is the question for the reviewer; the chain's unit reds are the known CRLF pair; the whole browser suite green.

## Doc rows

Proposed, not applied.

- **`docs/04-ui-spec.md` §5, the summary sheet's bullet.** After "Where the header is drawn (upright, a tablet), its state line says it just above the sheet", add: ", whole: the line wraps to the lines the sentence needs rather than cutting (U105b)".
- **`docs/04-ui-spec.md` §5f, the run's own sentences.** Change "at 342 px the state line holds about forty characters and cuts the rest with an ellipsis:" to "at 342 px the state line holds about forty characters and cuts the rest with an ellipsis — a refused tap's sentence excepted while no run is on, which wraps (U105b):". At the end of the *tap whose sound did not start* bullet, add: "The header's line wraps that sentence to the lines it needs while no run is on, rather than cutting it (U105b; the reviewer's ruling on U105a, `responses/d0e1b01f.md`, choice 3). A refusal standing during a run (▶ from a pause, a bar held) is cut like every other line of a run."
- **`docs/08-test-map.md`, the `score.screen.spec.ts` row.** Append: "U105b: the upright case a second time with every element forced to a wider face (Verdana, or DejaVu Sans where it is absent, as `plan.spec.ts`): the header's line takes the lines the sentence needs, uncut; and upright on either face the header's line has no ellipsis. Red on the committed one-line clamp (on the wider face the sentence was wider than its line and ran outside it, CI's shape on run 36779781211)."
- **Optional: `docs/08-test-map.md`, the `score.head-height.spec.ts` row**, because it is the consumer this lane found. Append: "Since U105b, the spec that kills taking the clamp off a run's line (`score.fuzz.spec.ts` stayed green under that mutant on the builder's face)."

## Content

Nothing under `content/` or `scores/` changes. The §12 itemisation list is empty: no lesson text, table, sentence wording or score bytes change.
