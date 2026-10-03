### Entry 197 — U105d — the sideways bar's refusal stays whole

Fast-path fix-forward under U105, from the reviewer's direction on U105c (`docs/review/responses/842ea210.md`, *Sideways refusal cut*), with the second read's item 2 (`docs/review/second-reads/cc45b3a8.md`) folded in. Brief: `docs/prompts/tasks/U105d-the-sideways-bar-refusal-stays-whole.md`. Base: `cc45b3a8` (`git log -1 --format=%h` in the worktree before anything else).

## Judgement

**Unverified on a device** (no phone; this Chromium, with a face forced onto every element, Verdana or DejaVu Sans where Verdana is absent; the runner's own face is not known). **Unverified as copy**: the sentences are U105's and unchanged. **Pedagogical verdict: not applicable**: nothing taught, judged or recorded changes; this is layout only. Nothing was heard.

What a learner meets sideways at 740 × 342 (a phone held sideways at a larger Display size), on the wider face, in a Wait run they have paused, after tapping *Hear it* with the sound suspended. Sideways the header is not drawn, so the bar's left end is the only place the sentence can be read:

- **Before:** the bar's left end reads *← Back · H · bar 1 / 4 · Sound did not start — tap Hea…*. The control's name is half gone and *again* is behind the ellipsis; the piece's name is down to its first letter. *tap ▶ again* is cut the same way. On this machine's own face *Hear it*'s sentence was cut too; ▶'s fit. Picture: `docs/prompts/pictures/u105d/paused-hear-740x342-wider-face-before.png`.
- **After:** *Sound did not start* / *— tap Hear it again*, whole, on two lines, beside *Hot Cr…* and *bar 1 / 4*. The bar is the same height and one row; the six controls and `⋯` are where they were and none is under the sentence; the music does not move. At rest with no run, ▶'s and *Hear it*'s refusals read the same way. Picture: `…-after.png`.
- **Every other line is as it was.** The ordinary paused line, read from the same element in the same run before the refusal, is still one line cut with its ellipsis (*Paused — ▶ to carry on, or St…*), and once ▶ carries the run on the mirror is back under its clamp.
- **On a narrower phone this does not hold on the wider face (Question 1).** At 667 × 375 at rest on the wider face the sentence takes three lines and the bar grows by about a line while it stands. The committed CSS there drew the cut sentence over ▶ instead. On the app's own stack at 667 × 375 it is two lines and one row.

## The mechanism and the discriminating test

**Mechanism.** Sideways, `.screen--score .score-head { display: none; }` (`style.css`, the landscape block) removes the header in every state, so `#score-status-side`, a `span.score-bar__status` that `syncBarLeft` fills with the header's own string, is the only copy of a refusal on the screen (unless the summary is up, where U105a's `#summary-refusal` carries it). That span was `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 28vw` whatever it said, and the landscape rule `.screen--score .score-bar__left > :not(.score-bar__title) { flex: none; white-space: nowrap; }` held it there. Nothing keyed on `data-sound-refused` reached it: U105b/c's exception is scoped to `.score-head .help-strip__now`.

**The refuting test, run before any edit, red on the committed CSS** (`browser-red-base.txt`). The new case, sideways at 740 × 342 on the wider face, in two rows: a Wait run frozen (`scoreFit().frozen`) and paused, and at rest with no run. In each, the context is suspended with `resume` stubbed never to answer, ▶ then `Hear it` are refused, and the mirror is read with the bar revealed first (`revealBar`, then the bar's computed opacity polled to `1`: it fades with the bar three seconds after a tap, and `scrollWidth` cannot see opacity). Both rows red, eight soft failures each, the same in both. This run's own measurements, the mirror's `scrollWidth` against its `clientWidth`:

| Sentence | App's stack | Wider face |
| --- | --- | --- |
| *Paused — ▶ to carry on, …* (the ordinary line) | 412 in 207, cut | 471 in 207, cut |
| *Sound did not start — tap ▶ again* | 196 in 196, ellipsis set | **cut**: 222 in 207 |
| *Sound did not start — tap Hear it again* | **cut**: 223 in 207 | **cut**: 254 in 207 |

(`probe-probe-summary.txt`; the committed case runs on the wider face only.)

**H1 first: lift the cap, keep `nowrap`.** Refuted, by the committed case's own checks (`browser-h1-trial.txt`, a `vite build` of `max-width: none; text-overflow: clip` under the refused selector). The sentence is whole, but on the wider face it is longer than everything the row has left beside the six controls and `⋯`, even with the title at 0 px: the mirror's box runs over ▶ (`overControls: ["score-play"]`) and the piece's name is gone (title width 0). Both rows, both sentences. On the app's stack H1 fits (*Hear it*'s sentence one line, the title at 36 px; `probe-probe-summary.txt`), so the wider face is what discriminates.

**H2: a scoped wrap.** Holds. The brief's H2 as written (`white-space: normal; overflow-wrap: anywhere`) does not wrap at all: the landscape rule's `flex: none` keeps the span at its one-line width, so it runs over ▶ exactly as H1 does (`probe-noflex-summary.txt`). It also needs `flex: 0 1 auto; min-width: 0`, so the span gives room with the title in proportion to their widths. Then, at 740 × 342, on both faces, at rest and paused, both sentences:

- whole on two lines, no overflow, no ellipsis, the text inside its box, nothing drawn over either line;
- the bar's height and `scrollHeight` as before the refusal, its children on one row, every control on the screen and none under the sentence;
- the title still drawn, wider than before on the wider face (70 px against 7.56 px; `probe-final-summary.txt`).

**The fix.** One rule and its comment in `app/src/style.css`, after the header's own refusal exception:

```css
body:has([data-sound-refused]) .screen--score .score-bar__status {
  max-width: none;
  flex: 0 1 auto;
  min-width: 0;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
```

- Specificity (0,3,1) beats the landscape rule's (0,3,0) and the base rule's (0,1,0); read, and observed working.
- `text-wrap: balance`: at 780 × 360 on the app's stack the row is only a little short, so the span lost a fraction of a pixel and wrapped *again* alone onto the second line (*… tap ▶* / *again*). Balanced, the second line reads *— tap ▶ again* (`probe-bal780-summary.txt` and its pictures, kept under `build/` only). It changes no width or line count measured here.
- The comment says why it wraps rather than only losing the cap, why `flex` is needed, why the bar stays one row and where that stops holding (Question 1), and that every other line keeps the clamp.
- Keyed on `data-sound-refused` on `body`, as the header's rule is, so a control refused inside the `⋯` sheet counts. It reads no run state: paused, at rest, held and demonstrating are covered by construction. Paused and at rest are observed.
- `ScoreScreen.ts` is untouched.

## Premises found wrong

1. **The brief's H2 alone does not wrap** (above): `flex: none` from the landscape rule holds the span at its max-content width. `flex: 0 1 auto; min-width: 0` is part of the fix.
2. **Premise 7's "markedly more room" sideways.** Sideways at 740 the mode select takes its long labels (the short ones are for windows under `NARROW_BAR_PX`, 440 px, `ScoreScreen.ts`:164) and the tempo label its percentage, so the controls take more than upright's row. On the wider face the left group already ended at 353 px of 740 before any refusal, and the title was already down to its first letter. There was no room for a one-line sentence, which is why H1 failed.
3. **A title-first H2 cannot be made from a rule on the span alone.** Once the title reaches 0 and freezes, flexbox distributes only the fraction of the overflow equal to the remaining items' summed shrink factors when that sum is below one. A span with a small factor therefore leaves most of the overflow, and runs over ▶ (`probe-titlefirst740-summary.txt`: span 253 px wide over ▶, title 0; at 667 the ▶ click was intercepted, `probe-titlefirst667-run.txt`). Making the name yield first needs a refusal-scoped rule on `.score-bar__title`, which this lane does not own (Question 1).
4. **The brief's unverified items, answered.**
   - `#score-bar`'s height is also read by `score.spec.ts`:590 (one row at 780 × 360 and 880 × 412) and `score.layout.spec.ts`:177 and :387. None raises a refusal. Scope: a grep of `app/tests` for `#score-bar` with `boundingBox`, `evaluate` or `scrollHeight`.
   - `Hear it`'s sentence is longer than ▶'s on both faces (table above). Other sentences the mirror can carry (*Carry on*, *Start again*, `L`/`R`/`Both`, *hold bar N*, *Try again*) were not measured on this surface.

## Done

- Base confirmed: `cc45b3a8`.
- **Red first** on the committed CSS: the new sideways case, both rows (quoted under Tests).
- **H1 tried before H2**, judged by the committed case and refuted on the wider face: the sentence over ▶, the title at 0.
- **H2 built**: whole on two lines, the bar's height and `scrollHeight` unchanged, one row, no control covered, the title drawn.
- **Green**: both rows; and sixteen times under `--repeat-each=8`.
- **The density contract**: the ordinary paused line read cut with its ellipsis at the same element before the refusal, and the clamp back once ▶ carries the run on. Both are inside the new case.
- **U105a/b/c's sideways summary case unchanged and green**, inside the whole `score.screen.spec.ts` (51 passed): with the rule in force, the mirror is still not among the painted copies while the summary is up (the case's own `painted` check). Why it is not (the sheet over it, premise 9) was not read separately.
- **The mutant restoring the cut is killed by the two new rows alone.** It removes the new rule whole. 2 failed, 49 passed, over the whole `score.screen.spec.ts`; the failing lines are the base red's. `style.css` was restored byte for byte, checked by hash.
- `score.spec.ts`'s *one row, seven controls at most* (five viewports) green.
- `scoreSheetsCloseAndPlayStartsSound.test.ts` green and unmodified: the mirror's text contract (premise 10). Run with the other three unit files that read `style.css`.
- Before-and-after pictures at 740 × 342 on the wider face.
- `tsc -b` and eslint on the changed spec, both exit 0.
- **The last edit to `style.css` was a comment rewrap, after every browser run.** The rebuilt CSS bundles are byte-identical to the ones every final run used (`built-css-before-comment.txt`, `built-css-after-comment.txt`), so the runs above are of the final tree's CSS.
- Measured beyond the brief, so the result is known where it stops holding:
  - 780 × 360, both faces: two lines, one row (`probe-fix780-summary.txt`);
  - 667 × 375: two lines and one row on the app's stack; three lines and a taller bar on the wider face (`probe-final667-summary.txt`).

## Not done

- **No device check.** None available.
- **One row at 667 × 375 on the wider face.** It is not held there: the bar grows by about a line while a refusal stands (Question 1). Not solved by cutting the sentence again, and nothing outside `.score-bar__status` was touched to solve it.
- **Not exercised on this surface:**
  - the demonstrating and held states (covered by construction: the selector reads no run state; U105c showed a held bar does not reach a refusal during a run);
  - the other refusal sentences;
  - a control refused inside the `⋯` sheet sideways (at 740 every control is on the bar);
  - 115 % text.
- **The whole unit suite and the whole browser suite were not run.** Only the targeted files ran: `score.screen.spec.ts` whole, `score.spec.ts`'s one-row cases, and the four unit files that read `style.css` or the refusal contract. CI is the full run.

## Follow-ups (recorded, not fixed)

- **Sideways at 667 × 375 on the wider face, the ordinary paused line covers ▶, on the committed CSS.** Every retry of the probe's click on ▶ was refused by Playwright with `#score-status-side … intercepts pointer events`, with the mirror saying *Paused — ▶ to carry on, …* (`probe-narrow-run.txt`, case *paused wider-face base*, run on the base build). A learner there could not carry the run on with ▶. The cause: the left group's children other than the title are `flex: none`, the span sits at its `28vw` cap, and the row has less room than they need, so the group overflows into the controls. Not refusal-specific, and outside this lane's density contract. It belongs to the bar's own layout (`08` §7.1). On the app's stack at 667 the line's box stays clear of ▶.
- **Observation, not a row:** `08` §7.1 says the modes shorten *below 400 px*; the code's threshold is `NARROW_BAR_PX = 440` (`ScoreScreen.ts`:164). Not touched.
- **Observation, not a row:** sideways on the wider face the mode select reads *W* (at 780 on the app's stack, *Wa*), visible in the pictures. This lane did not touch it, and it is not new.
- **The two `lessonClaimsAboutApp.test.ts` checks that fail on this Windows (CRLF) checkout**, *blues.3* and *4.7*. These are the same two U105b and U105c recorded. Each matches LF-literal text in a file it reads raw: `style.css`'s `.score-stage--blind` rule for 4.7, which this lane does not change, and `ScoreScreen.ts` for blues.3, which is untouched (`unit-crlf-check.txt`, rerun here on the base copy and on the fix alike).

## Questions

1. **For the reviewer (a geometry choice; the brief puts it with you).** At 667 × 375 on the wider face, at rest, the shipped rule wraps the refusal to three lines, and the bar grows from 52 to 61 px on this machine (▶'s sentence; 60 for *Hear it*'s) while the sentence stands. At 740 × 342 and 780 × 360 on both faces, and at 667 × 375 on the app's stack, it is two lines and one row. On the committed CSS at that size the sentence was cut and its box lay over ▶. The facts, from this run:
   - Two lines of the span fit inside the row the 40 px controls set, and a third does not.
   - A rule on `.score-bar__status` alone cannot make the piece's name give all its room first (premise 3).
   - The name yielding first would probably keep one row at 667 on the wider face: the span would get the group's whole slack, and *Sound did not start —* is about the width of that slack. That was not measured, because it needs a rule on `.score-bar__title`.
   - That rule would cost the name entirely at 740 × 342 on the wider face, where the shipped rule keeps *Hot Cr…*.

   The choices, none built:
   - (a) accept a taller bar during a refusal on rows that narrow (the sentence goes at the next tap or once the sound runs; at rest the stage refits around it);
   - (b) a refusal-scoped rule on `.score-bar__title` so the name yields first and the sentence wraps only after;
   - (c) another surface for the sentence on narrow rows.

   Separately, the ordinary paused line already covers ▶ at that size (Follow-ups).

## Files

- `app/src/style.css`: the refused mirror's rule and its comment, after the header's refusal exception.
- `app/tests/e2e/score.screen.spec.ts`: the sideways case, in two rows (paused, at rest), at the end of the U69 describe.
- `docs/prompts/runs/U105d/`: this entry, the logs, the probe summaries, the probe JSONs of the hypotheses run and of the final CSS, and the scripts (`scripts-*`).
- `docs/prompts/pictures/u105d/`: the paused *Hear it* refusal at 740 × 342 on the wider face, before and after.

## Tests

| Test | Class | Old assumption |
| --- | --- | --- |
| a refusal sideways (740 × 342) on a wider face, paused: the bar's mirror says it whole, the bar one row, the ordinary line still cut | add | The bar's mirror is one line at `28vw` with an ellipsis whatever it says. No test asserted it; no test asserted the mirror's truncation at all. |
| a refusal sideways (740 × 342) on a wider face, at rest: the same | add | the same |
| a refused tap on the summary: upright, upright on a wider face, sideways | preserve, unchanged | — |
| a refusal during a paused run, upright (342 × 740) on a wider face | preserve, unchanged | — |
| the rest of `score.screen.spec.ts` | preserve | — |
| `score.spec.ts` *one row, seven controls at most* | preserve, unchanged | — |
| `scoreSheetsCloseAndPlayStartsSound.test.ts` | preserve, unchanged | — |

No test was added to keep the cut. The reviewer's words settle that the cut is what is being fixed.

**Red on the committed CSS** (`browser-red-base.txt`): 2 failed. The soft failures in each row, in order:

- "#score-play: the sentence overflows the mirror — Expected: <= 207, Received: 222"
- "#score-play: the sentence runs outside the mirror"
- "#score-play: the mirror cuts with an ellipsis"
- "#score-play: something is drawn over the sentence"
- "#score-hear: the sentence overflows the mirror — Expected: <= 207, Received: 254"
- "#score-hear: the sentence runs outside the mirror"
- "#score-hear: the mirror cuts with an ellipsis"
- "#score-hear: something is drawn over the sentence"
- then "the refusal is not whole in the bar, or the bar is not one row — Expected: 0, Received: 8"

**H1 trial** (`browser-h1-trial.txt`): 2 failed. In each row: "#score-play: the sentence is over a control" (`["score-play"]`), "#score-play: the piece's name is gone from the bar" (0), the same two for `#score-hear`, then "Received: 4".

**Green** (`browser-green.txt`): 2 passed. Eight times each (`browser-green-repeat.txt`): 16 passed.

**Mutant** (`mutants.txt`, `m1-*`). Built with `vite build`. `style.css` was restored byte for byte, checked by hash. The fixed dist was rebuilt after, with `npm run build:app`.

| Mutant | Result |
| --- | --- |
| m1: the refused mirror's rule removed whole (the cut restored) | **Killed by the two new rows alone.** The whole `score.screen.spec.ts`: 2 failed, 49 passed. The failing lines are the base red's. |

## Exit codes

| Step | Exit | Counts |
| --- | --- | --- |
| `npm ci` | 0 | "added 610 packages" |
| `npm run build:app` on the base | 0 | |
| `vite build`, the H1 trial | 0 | |
| `npm run build:app` on the fix | 0 | includes `tsc -b` |
| `npm run build:app` after the mutant | 0 | |
| `npm run build:app` after the comment rewrap | 0 | built CSS byte-identical to the tested build |
| `npx tsc -b` | 0 | covers `tests/e2e` |
| `npx eslint tests/e2e/score.screen.spec.ts --max-warnings=0` | 0 | |
| The new case, red on the base | 1 | 2 failed |
| The new case on the H1 trial | 1 | 2 failed |
| The new case, green | 0 | 2 passed |
| The new case, `--repeat-each=8` | 0 | 16 passed |
| The whole `score.screen.spec.ts` | 0 | 51 passed |
| `score.spec.ts -g "one row, seven controls"` | 0 | 5 passed |
| m1, `vite build` | 0 | |
| m1, the whole `score.screen.spec.ts` | 1 | killed: 2 failed, 49 passed |
| `vitest` on `scoreSheetsCloseAndPlayStartsSound`, `projectSheet`, `scoreMidRunSettings`, `lessonClaimsAboutApp` | 1 | 371 passed, 2 failed (the two CRLF checks above) |
| Probe `probe`: 740 × 342; base, H1, H2; both faces; paused and at rest; base build | 0 | 12 passed |
| Probe `noflex`: H2 without `flex`; base build | 0 | 1 passed |
| Probe `narrow667`: 667 × 375, paused; base build | 1 | 2 passed; 2 failed on the wider face: ▶'s click intercepted by the ordinary paused line (Follow-ups) |
| Probe `narrow667rest`: 667 × 375, at rest, the wider face; base build | 0 | 2 passed |
| Probe `titlefirst740`: H2 with a small shrink factor; the fix's build before `balance` | 0 | 4 passed |
| Probe `titlefirst667` | 1 | 3 passed; 1 failed: ▶'s click intercepted (premise 3) |
| Probes `fix780`, `bal780`, `after`; the fix's build before `balance` | 0 | 4 passed each |
| Probes `final` (740 × 342) and `final667` (667 × 375, at rest); the final build | 0 | 4 and 2 passed |

Every browser run used port 5303 through the config copy (`scripts-playwright.u105d-5303.config.ts`). The content was copied read-only from the main checkout's `app/public/content` (the worktree has only the committed audio there), and deleted at the end.

## Doc rows

Proposed, not applied.

- **`docs/08-test-map.md`, the `score.screen.spec.ts` row.** Append: "U105d: sideways at 740 × 342 on the wider face, in a paused Wait run (frozen, paused) and at rest. The context is suspended with `resume` never answering, and ▶ then `Hear it` are refused. Each sentence is read from the bar's mirror `#score-status-side` with the bar revealed first. Each is whole (no overflow, no ellipsis, inside its box, nothing drawn over any of its lines, in the window). No control is under it or off the screen. The bar is one row at its height and `scrollHeight` before the refusal, and the piece's name is still drawn. The paused line, read at the same element before the refusal, is still cut with its ellipsis; once ▶ carries the run on, the mirror is back under its clamp. Red on the committed CSS (both sentences cut at `28vw`). A trial lifting only the cap, `nowrap` kept, ran the sentence over ▶ with the name at nothing. The mutant removing the refused mirror's rule reddens these two cases alone."
- **`docs/04-ui-spec.md` §5f, after the paragraph ending *because the header's line says it just above*.** Add: "Sideways with no summary up, the header is not drawn, and the sentence is read in the bar's mirror of the state line. There it wraps too, beside the piece's name, which gives room with it, rather than cutting at the mirror's `28vw`. Every other line the mirror carries stays one line with an ellipsis (U105d, `responses/842ea210.md`)."
- **`docs/08-score-render-states.md` §7.1** (optional). After "It has broken twice.", add: "A refused tap's sentence in the bar's left end sideways wraps to two lines inside that row (U105d). Two lines of it are shorter than the controls; a row narrow enough to squeeze it to three is open with the reviewer."

## Content

Nothing under `content/` or `scores/` changes. The §12 itemisation list is empty: no lesson text, table, sentence wording or score bytes change. The one learner-facing change is how an unchanged sentence is laid out in the bar, named under Judgement.
