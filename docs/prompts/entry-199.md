### Entry 199 — U119 — the sideways bar's left group never covers its controls

Lane U119 under the bar's one-row contract (`08` §7.1). Brief: `docs/prompts/tasks/U119-the-sideways-bar-never-covers-its-controls.md`. Ruling: `docs/review/responses/questions-e9aa51ae.md`, *U119 — sideways bar text must never cover controls* ("approved for dispatch; the builder chooses H1 or H2 by measurement"). Base: `dd3fffec` (`git log -1 --format=%h` in the worktree before anything else).

## Judgement

**Unverified on a device** (no phone; this Chromium, with a face forced onto every element, Verdana or DejaVu Sans where Verdana is absent; the runner's face and a phone's own face were not seen). **Pedagogical verdict: not applicable**: nothing taught, judged or recorded changes; this is layout only, and no sentence's wording changes. Nothing was heard.

What a learner meets sideways in a Wait run they have paused, with the bar shown:

- **Before, at 667 × 375 on the wider face:** the bar's left end reads *← Back · bar 1 / 4 · Paused — ▶ to carry on, or…*, and the end of that line is drawn across ▶. A tap on ▶ lands on the line, and the run does not carry on. Picture: `docs/prompts/pictures/u119/paused-667x375-wider-face-before.png`.
- **After, at 667 × 375 on the wider face:** the line stops at ▶'s edge, reading *Paused — ▶ to carry c*. It is cut flush, part-way through a letter, with no ellipsis (Question 2). *← Back* and *bar 1 / 4* are whole. ▶, ⏸, *Hear it*, the mode, `R`, `L`, `Both`, the tempo label, `⋯` and Back each take a real tap and do what they say. The bar is one row and the music does not move. Picture: `…-after.png`; the bar alone: `bar-667x375-wider-face-before.png` and `bar-667x375-wider-face-h1-clip.png`.
- **On the app's own face at 667 × 375** the line already stopped short of ▶ before the change ("Paused — ▶ to carry on, or Sta…"). The before and after pictures are byte-identical.
- **The fault reached further than 667.** Before the change, the line was drawn over ▶ on these cells (U119's grid, this machine's faces):
  - 640 × 360 on both faces;
  - at 115 % text, every sideways width measured from 640 to 780 on the wider face, and from 640 to 740 on the app's face.

  That includes 780 × 360, a phone of the owner's shape held sideways, at 115 % text on the wider face (`paused-780x360-wider-face-115-before.png`). There, too, the line now stops at ▶ (*Paused — ▶ to carry on,*) and every control takes its tap (`…-after.png`).
- **Where it does not hold (Question 1).** At 568 × 320 with 115 % text on the wider face, Back and `bar n / m` together are wider than the room the controls leave. *bar 1 / 4* now reads *bar 1*, the rest of it cut flush (`paused-568x320-wider-face-115-after.png`). Before the change, the line was drawn over ▶, *Hear it*, the mode and `R` there, and *bar 1 / 4* itself reached ▶ (`…-before.png`). A three-digit bar of a 201-bar piece (the bar count set by hand in the probe) is cut the same way:
  - at 568 × 320 at 115 % on both faces;
  - at 640 × 360 at 115 % on the wider face, by about the width of the last digit's edge.

  A number cut flush can read as a smaller one (*bar 12* as *bar 1*).

## The mechanism and the discriminating test

**Mechanism** (read at the lines, unchanged from the brief's premises 2–5). Sideways (`style.css`, the landscape block) the bar does not wrap. Its left group `#score-bar-left` is the one item allowed to shrink (`flex: 0 1 auto; min-width: 0`). Inside the group only the piece's name shrinks: Back, `bar n / m` and the status mirror are `flex: none; white-space: nowrap`, and the mirror holds its own width at `28vw`. Where those three are wider than the room the fixed controls leave, the group's box is narrower than its content. The group had no clip of its own, so its last child painted on past the box into the controls laid out after it. The mirror's `opacity: 0.75` puts it above the plain buttons in paint order (brief premise 10, inferred, not tested), so it took the hit there.

**The refuting test, red first on the committed CSS** (`browser-red-base.txt`, digest `browser-red-base-failures.txt`). The new case runs sideways at 640 × 360, 667 × 375, 740 × 342 and 780 × 360. Each size runs on the app's stack and on the wider face, at 100 % and 115 % text (the root font scaled, as `doors.spec.ts` does for an Android Display size): 16 rows. In each row:

- A Wait run is frozen, then paused. The pause is dispatched to ▶ itself, because it is setup, not what is measured, and ⏸ is tapped for real later in the row.
- With the bar shown, the geometry is read. Nothing the left group draws may meet a control (each child's box, cut to the group's box only where the group clips). Five points inside every control must hit that control. Back must be whole at the bar's left end, `bar n / m` whole, and the bar one row.
- Then every control on the bar gets a real, unforced tap (`pressControl`: reveal, then `click()`, no `force`), each checked by what it does.

A 17th row is a refusal at rest at 667 × 375 on the wider face (brief layer 4).

On the committed CSS, 10 of the 16 rows failed. At **667 × 375 on the wider face** the real tap on ▶ to carry the run on timed out, `<span id="score-status-side">Paused — ▶ to carry on, or Start again in ⋯ to go…</span> … intercepts pointer events`, at the step at `score.screen.spec.ts`:2170. That is the brief's red, matching `runs/U105d/probe-narrow-run.txt`. The geometry named it first: `score-status-side over score-play`, and ▶'s middle and both side points hit the mirror. The other nine are in the acceptance table below. The refusal row and six paused rows passed.

**H1 tried first: the group clips its own overflow.** One declaration on the landscape `.screen--score .score-bar__left`: `overflow-x: clip`. It holds on every cell measured, injected over the committed build and then built (`probe-grid-table.txt`, `probe-final-table.txt`, `probe-long-table.txt`, `probe-finallong-table.txt`):

- 568 × 320 to 844 × 390, both faces, 100 % and 115 %: eight sizes for Hot Cross Buns (*bar 1 / 4*), five for Moonlight III (*bar 1 / 201*, and *bar 188 / 201* set by hand);
- no control covered, every control passing Playwright's actionability check (hit-testing included), and a real tap on ▶ carrying the run on;
- the clip moves nothing: on all 32 Hot Cross Buns cells no box moved and the bar's height and rows are unchanged; on the 11 cells whose group fitted, every number is the same as before (`same-where-fits.txt`);
- Back whole on every cell;
- `bar n / m` whole on every cell except the residual named in the Judgement (Question 1).

**H2 measured: the narrow labels.** The probe simulated it by telling the app the window is under `NARROW_BAR_PX`. Short mode labels, no percentage on the tempo label, no clip (`h2sim` rows in `probe-long-table.txt`). ▶ was still under the line:

- at 667 × 375 on the wider face itself;
- at 780 × 360 at 115 % on the wider face;
- at 568, 640 and 740 at 115 %.

The short labels free only the tempo label's percentage. The mode select already sits at its 2.75 rem floor sideways wherever the group overflows, because `#score-mode`'s own `flex: 1 1 3rem` outranks the landscape `flex: none`. So no threshold can make H2 alone hold the invariant. Added to H1 (`h1h2sim`), it rescues part of the residual: the three-digit bar at 640 on the wider face at 115 %, and at 568 on the app's face at 115 %. It does not rescue 568 × 320 at 115 % on the wider face for the 201-bar piece: *bar 1 / 201* is still cut there.

**Which mechanism, and why: H1.**

- It is the only one of the two that satisfies the invariant: no left-group text covers or intercepts a control, and the bar is one row.
- It holds by construction, because a group that draws only inside its own box cannot reach the controls laid out after it.
- On the ruling's grid — the 667 × 375 wider-face case, the app's face, the neighbouring widths 640 to 780, and 115 % text — it keeps Back whole everywhere and `bar n / m` whole for the text both pieces show at their first bar. The one cell of that grid where `bar n / m` is cut is a three-digit bar at 640 × 360 at 115 % on the wider face (Question 1).
- It changes nothing where nothing overflowed.

H2 was not built:

- it cannot hold the invariant;
- where it would help, it is only a partial rescue of an edge outside that grid;
- a viewport threshold derived on this machine's wider face at 115 % (about 640 for a three-digit bar) would shorten the labels for every face and text size at 568 and 640.

That is the different trade, put to the reviewer in Question 1 rather than taken.

**The fix.** In `app/src/style.css`, inside `@media (orientation: landscape) and (max-height: 500px)`, the existing `.screen--score .score-bar__left` rule gains `overflow-x: clip;` and a comment:

- why the group overflowed;
- that the controls are laid out after its box;
- what is cut, in what order: the status line, then `bar n / m`, Back last;
- where Back and `bar n / m` themselves do not fit (Question 1);
- why `clip` across and not `hidden`: Back's focus ring above and below stays drawn, and the group is no scroll container.

It reads no run state, face or refusal. `ScoreScreen.ts` is untouched.

## Acceptance grid (the committed case)

"Covered" is the geometry check (what the left group draws against each control's box, and five points inside each control); "▶ tap" is the first real tap of the row.

| Size | Face | Text | Committed CSS: covered, ▶ tap | After: covered, every control tapped, Back and `bar n / m` |
| --- | --- | --- | --- | --- |
| 640 × 360 | app | 100 % | mirror over ▶ (▶'s left quarter hits it); ▶ tap lands | none; every control tapped; whole |
| 640 × 360 | app | 115 % | over ▶, *Hear it*; **▶ tap intercepted** | none; every control tapped; whole |
| 640 × 360 | wider | 100 % | over ▶, *Hear it*; **▶ tap intercepted** | none; every control tapped; whole |
| 640 × 360 | wider | 115 % | over ▶, *Hear it*, mode; **▶ tap intercepted** | none; every control tapped; whole |
| 667 × 375 | app | 100 % | none; lands | none; every control tapped; whole |
| 667 × 375 | app | 115 % | over ▶, *Hear it*; **▶ tap intercepted** | none; every control tapped; whole |
| **667 × 375** | **wider** | **100 %** | **over ▶; ▶ tap intercepted** (the brief's red) | **none; every control tapped; whole** |
| 667 × 375 | wider | 115 % | over ▶, *Hear it*, mode; **▶ tap intercepted** | none; every control tapped; whole |
| 740 × 342 | app | 100 % | none; lands | none; every control tapped; whole |
| 740 × 342 | app | 115 % | mirror over ▶ (left quarter); lands | none; every control tapped; whole |
| 740 × 342 | wider | 100 % | none; lands | none; every control tapped; whole |
| 740 × 342 | wider | 115 % | over ▶, *Hear it*; **▶ tap intercepted** | none; every control tapped; whole |
| 780 × 360 | app | 100 % | none; lands | none; every control tapped; whole |
| 780 × 360 | app | 115 % | none; lands | none; every control tapped; whole |
| 780 × 360 | wider | 100 % | none; lands | none; every control tapped; whole |
| 780 × 360 | wider | 115 % | over ▶; **▶ tap intercepted** | none; every control tapped; whole |
| 667 × 375 refusal at rest | wider | 100 % | none under either sentence; ▶ starts the run | the same |

The ten taps: ▶ (carries on), ⏸ (pauses), *Hear it* twice (plays, stops), the mode select (takes focus; Escape), `R`, `L`, `Both` (each chosen), the tempo label (its sheet), `⋯` (its sheet), Back (leaves the screen). The row taps *Hear it* and the hands only where they are on the bar, and asserts ▶, the mode, the tempo label and `⋯` are. That all ten were tapped in every row is inferred: no probe cell at these sizes (or any other probed) had a control off the bar. Green, `browser-green.txt` (17 passed); three times each, `browser-green-repeat.txt` (51 passed); again after the mutants and the rebuild, with U105d's two 740 × 342 rows, `browser-green-after-mutants.txt` (19 passed).

**Probe-only cells**, the same state and checks short of the real taps (Playwright's trial click on every control, then one real tap on ▶; `probe-grid-table.txt`, `probe-final-table.txt`). Before the fix, the line covered controls at:

- 568 × 320, every face and size; there the trial or real click on ▶ or *Hear it* was intercepted;
- 700 × 350 and 720 × 360 on the wider face (geometry only at 100 %, the ▶ click intercepted at 115 %) and at 115 % on the app's face.

At 844 × 390 nothing was covered. After the fix, nothing is covered and every click lands on every one of those cells. Back is whole on every one, and `bar n / m` on every one except 568 × 320 at 115 % on the wider face.

## Premises found wrong

1. **The brief's mutant 2 was expected to "fail the new case differently".** It fails it the same way: the same 10 rows, the same `score-status-side over score-play` and intercepted taps (`m2-failures.txt`). `overflow: hidden` on a control clips only what the control draws, and the text over it is the group's. That confirms the fix belongs on the group, not on the controls.
2. **Premise 6's "the controls' absolute width should be materially the same at 667 as at 740" holds for five of them, not the mode select.** `#score-mode`'s ID rule (`flex: 1 1 3rem; min-width: 2.75rem; max-width: 8rem`) outranks the landscape `flex: none`, so the select shrinks with the group towards its floor wherever the row is tight (at its floor on every cell whose group overflowed), and grows towards `8rem` where there is room (844 on the app's face). This is why H2's short mode labels buy nothing sideways (above).
3. **The brief's unverified items, answered.**
   - The overlap reaches controls at widths between 440 and 740 other than 667: it does, at 640, 700 and 720 (above).
   - The clip never cuts Back at 640 to 844, and cuts `bar n / m` only in the residual (Question 1).
   - The real-click check at 780 × 360: clean at 100 % on both faces, and intercepted on the committed CSS at 115 % on the wider face. Now clean. 880 × 412 was not run; 844 × 390 was the widest probed.

## Done

- Base confirmed: `dd3fffec`.
- **Red first** on the committed CSS: 10 of 16 paused rows, the 667 × 375 wider-face row at the real ▶ tap (`browser-red-base.txt`).
- **H1 tried first and measured** across 52 probe cells: no control covered on any, Back whole on every one, `bar n / m` whole except the residual.
- **H2 measured** (simulated short labels, with and without the clip): it cannot hold the invariant alone, and it only partly rescues the residual with H1.
- **H1 built**: one declaration and its comment.
- **The acceptance grid green**: the ruling's widths around 667, both faces, 115 % text, every control on the bar tapped for real (`browser-green.txt`, `browser-green-repeat.txt`).
- **The whole `score.screen.spec.ts` green**: 68 passed (`score-screen-whole.txt`). That includes U105d's two sideways refusal rows at 740 × 342, unmodified, and every other existing case.
- **`score.spec.ts`'s *one row, seven controls at most*** green at all five viewports, unmodified (`score-one-row.txt`).
- **Refusal at rest at 667 × 375 on the wider face** (brief layer 4): no control under either sentence, and a real ▶ then starts the run. Asserted as reachable only, not by line count or bar height.
- **Mutants**, both killed (`mutants.txt`):
  - m1 removes the clip, which is the committed CSS: over the whole `score.screen.spec.ts`, 10 failed and 58 passed, and the failing rows are exactly the base red's;
  - m2 moves the clip onto the controls: the same 10 fail, the same way.

  `style.css` was restored byte for byte, checked by hash, and the fixed tree rebuilt with `npm run build:app`.
- **`08` §7.1's threshold sentence corrected**: "Below 400 px" → "Below 440 px", confirmed at `ScoreScreen.ts`:164 (`NARROW_BAR_PX = 440`).
- Before-and-after pictures at 667 × 375 (both faces), 780 × 360 at 115 % on the wider face, and 568 × 320 at 115 % on the wider face.
- `npx tsc -b` and `npx eslint tests/e2e/score.screen.spec.ts --max-warnings=0`, both exit 0 on the final tree.
- **The last edit to `style.css` was a comment rewrap, after every browser run.** The rebuilt CSS bundles are byte-identical to the ones the post-mutant runs used (`built-css-before-comment.txt`, `built-css-after-comment.txt`, and the hashes in `build-app-after-mutants.txt`). The earlier runs (`browser-green*.txt`, `score-screen-whole.txt`, the `final` probes, the after pictures) used a build whose source differed from the final one only in comment wording. That their CSS was identical is inferred: the bundle drops comments, and that build's hash was not kept.
- **The last edit to the spec changed only one failure message's wording** (what a missed point reports hitting). The new cases and U105d's two 740 × 342 rows reran green on the final tree: 19 passed (`browser-green-final.txt`).

## Not done

- **No device check.** None available.
- **`bar n / m` whole at 568 × 320 with 115 % text, and for a three-digit bar at 640 × 360 at 115 % on the wider face.** H1 alone does not keep it whole there. H1 with H2's short labels would keep it whole at the two three-digit cells on the probe's measure, but not at 568 × 320 at 115 % on the wider face (Question 1). Neither H2 nor a third mechanism was built; nothing outside `.score-bar__left`'s rule was touched.
- **The committed case reads `bar n / m` at one digit only** (Hot Cross Buns). Three-digit counts were measured by the probe alone, with the text set by hand.
- **880 × 412 and 844 × 390 are not in the committed case.** 844 × 390 was probed and is clean before and after; 880 × 412 was not run here, and its one-row case in `score.spec.ts` is green.
- **The other states the mirror carries** (running, demonstrating, restarted, away) were not put through the geometry. The clip reads no state and so covers them by construction. The paused line stands for every ordinary line longer than the mirror's `28vw` cap, which all take the same box; that is inferred from the CSS. The *Hear it* line and the restarted lines passed through the row's real taps, but were not measured.
- **The whole unit suite and the whole browser suite were not run.** Only the targeted files ran: the four unit files that read `style.css`, `score.screen.spec.ts` whole, and `score.spec.ts`'s one-row cases. CI is the full run.

## Follow-ups (recorded, not fixed)

- **Observation, not a row:** `ScoreScreen.ts` still says "below 400 px" in two comments, the tempo label's (about :4729) and `SHORT_MODES`'s, where the code's threshold is 440. That file is not owned under H1.
- **Observation, not a row:** sideways, `fitBarControls` cannot fire. Its test is a second row or ▶/`⋯` under forty pixels, and sideways the bar never wraps and those two never shrink. So no control ever leaves for `⋯` sideways, however narrow the row. This is read from the code, not exercised. It bears on Question 1 (c).
- **Observation, not a row:** sideways on the wider face the mode select reads *W* (U105d's observation, unchanged).
- **The two `lessonClaimsAboutApp.test.ts` checks that fail on this Windows (CRLF) checkout**, *blues.3* and *4.7*, are the same two U105b/c/d recorded. Each matches LF-literal text in a file it reads raw: `.score-stage--blind {\n  visibility: hidden;\n}` for 4.7, a rule this lane does not touch (`unit-targeted.txt`).

## Questions

1. **For the reviewer (a geometry and product choice; neither ruled mechanism settles it).** Where Back and `bar n / m` are themselves wider than the room the fixed controls leave, the clip cuts `bar n / m` flush from its right end. On this machine's faces that happens at:
   - 568 × 320 with 115 % text on the wider face, for both pieces measured (*bar 1 / 4* reads *bar 1*);
   - 568 × 320 at 115 % on the app's face, for a three-digit bar;
   - 640 × 360 at 115 % on the wider face, for a three-digit bar, by the last digit's edge.

   Before the fix, the same cells had the line over ▶ (at 568 also *Hear it*, the mode and `R`, and `L` for the 201-bar piece), so the clip is strictly better there for the controls. But the ruling says location may not disappear merely to protect them, and a flush cut can turn *bar 12* into *bar 1*. The facts:
   - H2 alone cannot hold the invariant at any threshold (above).
   - H1 with H2's short labels keeps the location whole at the 640 cell and at 568 on the app's face. It does not at 568 × 320 at 115 % on the wider face for a 201-bar piece (*bar 1 / 201* still cut).
   - The threshold that would follow the ruling's derivation is where the controls plus Back plus `bar n / m` cease to coexist. On this machine's wider face at 115 % that is about 640 for a three-digit bar. It would shorten the labels at 568 and 640 for every face and every text size, including the app's face at 100 %, where nothing needs it. The runner's and a phone's faces would give other numbers.

   The choices, none built:
   - (a) accept the clip on those cells;
   - (b) add a sideways-only narrow threshold derived as above: a partial rescue at a cost at two common widths;
   - (c) a different mechanism outside H1/H2: let the bar's overflow rule (`fitBarControls`) count the left group's required minimum sideways, so that Hands, first in `OVERFLOW_ORDER`, goes behind `⋯` where Back and `bar n / m` would not fit.
2. **For the reviewer (a presentation choice inside H1).** Where the clip bites, the status line is cut flush at the group's edge, part-way through a letter and with no ellipsis. At 667 on the wider face it reads *Paused — ▶ to carry c*; at 640 × 360 at 115 % on the wider face, *Pause*, which reads as a verb. Its own ellipsis sits at its `28vw` edge, past the clip. An ellipsis at the group's edge would need the mirror to shrink inside the group. The probe tried the simplest form, the mirror `flex: 0 1 auto; min-width: 0` (picture `bar-667x375-wider-face-not-built-ellipsis.png`). It shares the shrink with the piece's name, which changes widths where nothing was wrong: at 740 × 342 on the wider face the name grows from its first letter to *Hot C…* and the paused line shortens. Keeping the name first to yield needs a large shrink weight on `.score-bar__title`, scoped away from the refusal so U105d's approved refusal layout does not change. That is a rule on an element this lane does not own. Not built. Is the flush cut acceptable as the status line yielding "under its existing density rules", or do you want the ellipsis?

## Files

- `app/src/style.css`: `overflow-x: clip` and its comment on the landscape `.screen--score .score-bar__left`.
- `app/tests/e2e/score.screen.spec.ts`:
  - the U119 helper `barLeftAgainstControls`;
  - the 16 sideways paused rows;
  - the refusal row at 667 × 375, at the end of the U69 `describe`;
  - `closeTempoSheet` added to the import list.
- `docs/08-score-render-states.md`: §7.1, "400 px" → "440 px".
- `docs/prompts/runs/U119/`: this entry, the logs and failure digests, the probe tables and selected probe JSONs, `same-where-fits.txt`, and the scripts (`scripts-*`).
- `docs/prompts/pictures/u119/`: four sizes before and after, and three bar strips at 667 × 375 on the wider face (before, the clip, the ellipsis not built).

## Tests

| Test | Class | Old assumption |
| --- | --- | --- |
| sideways 640 / 667 / 740 / 780, app's face and wider face, 100 % and 115 % text, paused: the left end covers no control, Back and `bar n / m` whole, a real tap reaches every control (16 rows) | add | No test asserted that the bar's left end stays off its controls, and none tapped a control sideways at these sizes or at 115 % text. `score.spec.ts` checks Back's position and one row at 780 × 360 and 880 × 412, on the app's face at 100 %. |
| a refusal sideways (667 × 375) on a wider face, at rest: no control under the sentence, a real ▶ still starts the run | add | U105d's refusal rows run at 740 × 342 only; 667 × 375 was its open Question 1, now ruled (`responses/bb271f4a.md`). |
| a refusal sideways (740 × 342) on a wider face, paused and at rest (U105d) | preserve, unchanged | — |
| the rest of `score.screen.spec.ts` | preserve | — |
| `score.spec.ts` *one row, seven controls at most* | preserve, unchanged | — |
| `lessonClaimsAboutApp`, `projectSheet`, `scoreMidRunSettings`, `scoreSheetsCloseAndPlayStartsSound` (read `style.css`) | preserve, unchanged | — |

**Red on the committed CSS** (`browser-red-base.txt`): 10 failed, 7 passed. The 667 × 375 wider-face row: "the bar's left end draws over a control" (`score-status-side over score-play`), then "a point inside a control hits something else" (▶ at its middle and both sides hit `score-status-side`), then the real tap: `TimeoutError: locator.click: Timeout 3000ms exceeded` … `<span id="score-status-side" …>Paused — ▶ to carry on, or Start again in ⋯ to go…</span> … intercepts pointer events`.

**Green** (`browser-green.txt`): 17 passed. Three times each (`browser-green-repeat.txt`): 51 passed.

**Mutants** (`mutants.txt`; built with `vite build`; `style.css` restored byte for byte, checked by hash; the fixed dist rebuilt with `npm run build:app`):

| Mutant | Result |
| --- | --- |
| m1: the clip removed whole (the committed CSS) | **Killed by the new rows alone.** The whole `score.screen.spec.ts`: 10 failed, 58 passed. The failing rows are exactly the base red's (`m1-failures.txt`). |
| m2: the clip moved onto the controls (`overflow: hidden` on the bar's other items) | **Killed**, the same 10 rows the same way: the mirror still over ▶ (`m2-failures.txt`). |

## Exit codes

| Step | Exit | Counts |
| --- | --- | --- |
| `npm ci` | 0 | |
| `npm run build:app` on the base | 0 | |
| Probe `smoke` (667 × 375, base and H1), base build | 0 | 4 passed (the probe records failed clicks rather than failing) |
| Probe `grid` (8 sizes × 2 faces × 2 text sizes × base/H1/H1+ellipsis), base build | 0 | 96 passed |
| Probe `long` (Moonlight III, 5 sizes × 2 × 2 × base/H1/H2-sim/H1+H2-sim, a three-digit bar set by hand), base build | 0 | 80 passed |
| The new cases on the committed CSS (red) | 1 | 10 failed, 7 passed |
| `npm run build:app` on the fix | 0 | includes `tsc -b` |
| The new cases, green | 0 | 17 passed |
| The new cases, `--repeat-each=3` | 0 | 51 passed |
| The whole `score.screen.spec.ts` | 0 | 68 passed |
| `score.spec.ts -g "one row, seven controls"` | 0 | 5 passed |
| Probes `final` and `finallong` on the fixed build | 0 | 32 and 20 passed |
| Pictures, after (fixed build) and before (m1 build) | 0 | 4 and 4 passed |
| m1, `vite build` | 0 | |
| m1, the whole `score.screen.spec.ts` | 1 | killed: 10 failed, 58 passed |
| m2, `vite build` | 0 | |
| m2, the new cases | 1 | killed: 10 failed, 7 passed |
| `npm run build:app` after the mutants | 0 | the built CSS carries the clip |
| The new cases and U105d's 740 rows after the rebuild | 0 | 19 passed |
| `vitest` on the four unit files that read `style.css` | 1 | 371 passed, 2 failed (the two CRLF checks above) |
| `npm run build:app` after the comment rewrap | 0 | built CSS byte-identical to the post-mutant build |
| The new cases and U105d's 740 rows, final tree | 0 | 19 passed |
| `npx tsc -b`, final tree | 0 | covers `tests/e2e` |
| `npx eslint tests/e2e/score.screen.spec.ts --max-warnings=0`, final tree | 0 | |

Every browser run used port 5323 through the config copy (`scripts-playwright.u119-5323.config.ts`). The content was copied read-only from the main checkout's `app/public/content`, because the worktree holds only the committed audio there; it was deleted at the end.

**Orchestrator's note at the landing (2026-10-01).** U119's worktree committed by name (fa4563d1) and merged (cc404dc4). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U119/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; e2e-targeted 1; e2e-rerun 0; vitest-timeouts-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; the other failures were load and pass alone (`vitest-timeouts-rerun`) — the targeted specs' failures passed alone (`e2e-rerun`); the note names them; `runs/U119/orchestrator-exit.txt`). Approved for dispatch on the U119 brief, with the reviewer before dispatch under `operating-procedure.md` section 11's entailed-decision rule, since H1 and H2 change what a learner sees differently (`responses/questions-e9aa51ae.md`, section U119 — sideways bar text must never cover controls): *APPROVE FOR DISPATCH. The builder may choose H1 or H2 by measurement, with H1 preferred only if it preserves the bar's other required information.* The invariant is fixed: no left-group text may cover or intercept a control, and the bar remains one row. H1 is acceptable only if the measured grid leaves Back usable and identifiable and `bar n / m` legible enough to keep its location meaning, the title/status free to yield under their existing density rules but navigation/location never disappearing merely to protect the controls; if H1 cannot satisfy those together, H2 with a threshold derived from the measured width at which the controls plus the left group's required minimum cease to coexist, never another arbitrary breakpoint; test the wider face producing the real 667 × 375 failed click, the app face, the neighbouring sideways widths and 115% text, a real unforced click on every visible control the acceptance condition. Dispatched at `dd3fffec` (`git log -1 --format=%h` in the worktree before anything else).. the sideways bar never covers its controls; the narrowest phone at 115 % and the flush cut with the reviewer

## Doc rows

`docs/08-score-render-states.md` §7.1's "Below 400 px" → "Below 440 px" is **applied** (the spec serves the code; `NARROW_BAR_PX = 440` at `ScoreScreen.ts`:164). The rest are proposed, not applied.

- **`docs/08-test-map.md`, the `score.screen.spec.ts` row (:358).** Append: "U119: sideways at 640 × 360, 667 × 375, 740 × 342 and 780 × 360, on the app's stack and on the wider face, at 100 % and 115 % text (the root font scaled). Each runs in a paused Wait run (frozen; the pause dispatched to ▶). Nothing the bar's left group (Back, the name, `bar n / m`, the mirror) draws meets a control, and five points inside every control hit it. Back is whole at the bar's left end, `bar n / m` whole, the bar one row. Then a real, unforced tap on every control on the bar, each checked by what it does: ▶ carries on, ⏸ pauses, `Hear it` plays and stops, the mode select takes focus, `R`/`L`/`Both` choose, the tempo label and `⋯` open their sheets, Back leaves. At 667 × 375 on the wider face at rest, ▶ and `Hear it` are refused: no control under the sentence, and a real ▶ then starts the run. Red on the committed CSS wherever the mirror ran over a control; at 667 × 375 on the wider face the real tap on ▶ was intercepted by `#score-status-side`. The mutant removing the group's clip reddens those rows alone."
- **`docs/08-score-render-states.md` §7.1** (optional). After "It has broken twice.", add: "Sideways the bar's left group (Back, the name, `bar n / m`, the status mirror) draws only inside the room the controls leave (U119): the status line is cut first, then `bar n / m`; a control is never under it."

## Content

Nothing under `content/` or `scores/` changes. The §12 itemisation list is empty: no lesson text, table, sentence wording or score bytes change. The one learner-facing change is layout: sideways, the bar's left-end text now stops at the controls instead of being drawn over them. It is named under Judgement.
