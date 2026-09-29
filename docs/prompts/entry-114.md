### Entry 114 — U74: the first window is the measured one on every path in; the two paths never differed once settled (with E30: the window rule left, the trade recorded)

**Judgement.** The brief's premise does not hold on this tree, and the fault it pointed at is real but different. The two-bar blues scale (`exercise.pentatonic.a.blues`, D4's seeded learner, 342 × 740) opened **from Today** and **by a link after a fresh load of the same route** settles to the same layout: stage box 342 × 531.1 at 84.9 on both, two systems (one bar each), bars 0 and 1 (2 shown of 2 asked), staff 43.2 px on both — before U74 and after (the new two-paths case is green on the committed code). What D4's and D4a's pictures show is the **first draw**, which both paths made before the fit settled: one system holding both bars at the top of an empty stage, its staff about three fifths of the settled one (26.9 against 43.2 px), for about half a second on this machine, then a jump to two systems (`pictures/u74/before-today-first-draw-342x740.png` is D4's picture again; `before-link-first-draw-342x740.png` is the same frame by the link path; both settled pictures show two systems). After U74 the first frame that draws the scale is the settled layout on both paths (`after-*-first-draw` = `after-*-settled`): two systems filling the width, the bottom fifth of the stage below the second system empty because the width binds, and `data-settled` is said once, after the stage's last box. The route itself can change the room: opened by a link without Today's offer token, the "no longer on today's card" note takes two lines of height off the stage (497 against 531 px) — genuinely different space, which is why the case compares the same route. Nothing heard; the scale is unverified as music. The renderer is shared machinery: the suites that lean on `data-settled` and on the first-window shape beyond the three named ones were not run here (the orchestrator's chain and CI).

**The mechanism, and what told it from the three alternatives.** `chooseWindowShape` has nothing to price with until the probe has measured the piece at the zoom the sheet is engraved at, and then answers one system for the whole window; the probe was loaded and drawn on idle (a 600 ms idle timeout plus its load and render) after the first paint, so every piece's first window was that default, re-planned when the measurement landed (the matrix's U42, whose product question this answers for pieces within the probe's reach); and every engraving search re-created it, because a new zoom is a measurement nobody has taken. Told apart two ways, both installed before the action: the page's own frame and stage-box trace on both paths (`trace-after.txt`; the committed code's frames are the red lines below), and the real renderer against a controlled stage with the engraver stood in (`windowRendererStage.test.ts`). On the committed code **(a)** a stage change delivered inside a fit, **(b)** an off-run height change, **(c)** a width change off and during a run, and **(d)** a taller stage met first then shrunk to the final one all come out as a renderer made on the final stage; only the first draw differs (`['0-1']` against the settled `['0-0', '1-1']`). (a) cannot happen in a browser at all: resize observations are delivered in the rendering step after the frame's callbacks, and `fitting` is set and cleared inside one of those callbacks, so the observer's `fitting` return is never taken; the unit case delivers inside the search as a worst case and the window drawn is still the final stage's, because the fit after the search reads the live stage. No pending-resize retry was built: there is no lost resize to retry.

**The change, inside the renderer only** (`WindowRenderer.ts`; `ScoreScreen.ts` and its line 4354 untouched; `autoFit.ts` untouched, `refitEngraving` and the run-size contract as they were):
1. A piece within the probe's reach (48 bars, the pieces that already get four slot views) loads its probe in `create`, before the renderer exists, so no observation can arrive mid-load; a longer piece keeps the idle load.
2. `measureBeforePricing`: before the learner has played anything, outside the engraving search, a loaded probe measures now when the measurement at the current zoom is missing — at the top of `chooseWindowShape` (after a run's held shape returns) and of `fitSlots`. So the first window, and the fit after each search, are priced from the piece; the search's trial zooms are never measured.
3. Inside the engraving search, a zoom with no measurement keeps the shape the search started from instead of the default, so the search sizes the sheet on the glass (without it the search sized the default's sheet and left the scale engraved at zoom 1 where the committed code settles at 1.65; the size on the glass was the same).
4. `data-settled` is said a frame later, after that frame's resize observations, and any stage observation takes it back: the fit can now finish in the task that drew the first window, and the Score screen's bar and keyboard strip take their height after it. The idle measurement used to cover that frame by accident.

**E30 — the rule left, the trade recorded.** Measured on the four four-bar cuts at five sizes (`runs/U74/e30/glass-*.json`, pictures `e30-*`): at 1280 × 800 (stage 1040 × 591) and 1024 × 768 the default two bars are one row across the width for the Ode and I Got Rhythm (staffs 85–113 px, the ink a quarter to a third short of the stage's height) and two one-bar rows for Wabash and Hark (a fifth to three tenths of the width spare), with no look-ahead row in any of the four; on the phone upright the Ode and I Got Rhythm fill the height with two rows (no room for a third), Wabash and Hark carry the greyed next row. No rule change found is better or equal on every cell: a rule that always prices the next row into the window's size shrinks the window wherever there is no room for that row now — the Ode and I Got Rhythm at 342 × 740 among them, the owner's own phone, where "too small" is one of his four complaints — and showing more bars than asked breaks the third good and the steppers' (f). What a better rule needs: a size above which more size is worth less than the next music, applied only where the window alone would draw above it (the desktop cells draw 85–113 px staffs, the phone cells 36–57), judged on the states gallery and the corpus before and after. That size is a product value nothing written down sets (Questions). The gallery and corpus were not run: no rule changed.

**Done**
- The mechanism named and told from (a)–(c) and the (d) timing case, in the browser and on the real renderer (technical). The first frame of the two-bar scale is its settled layout on both paths, at the owner's width (observed); pedagogically the scale reads as two systems of one bar each with fingering legible — unverified as music.
- The two paths compared at `data-settled` and ten stable frames: box, systems, bars shown and staff equal within a pixel (they were before U74 too).
- The run-size contract held by cases: a height-only change during a run keeps the drawn size and the shape and re-engraves nothing; a width change during a run releases the held size, takes a new one and keeps the step and the bar being played on the glass.
- E30 judged on 20 cells plus `score.window-rule.spec`'s grid (green); the rule left.
- Doc rows below (`docs/04` is G1's this week per the dispatch, `docs/08` E2a's). The brief's "`docs/04` §4" is §5 in the file (§4 is the Library); the rows say §5.

**Not done**
- Brief item 2's pending-resize retry with convergence and disposal cases: not built, because the proven fault is not a resize lost while fitting (above). The disposal case that exists covers the deferred word; it passes for two reasons (the cancel and `fitSettled` refusing a disposed renderer), so no single mutant turns it red — unverified as a discriminator.
- Pieces past the probe's reach (48 bars) keep the pre-measurement first draw: the Nocturne op. 48/1 at 342 × 740 first draws at about seven tenths of its settled staff (25.1 against 35.7 px) for about a second here. Not changed: loading their trimmed probe before the first paint delays that paint, a trade to measure on a throttled phone first (Follow-ups).
- The states gallery and the corpus: not run — the brief's E30 condition for running them is a rule change, and none met it; the dispatch limits the suites to the named ones.
- The first-paint cost of the change is not measured on a phone: for a short piece, one more engraver load in `create` and one probe render before the first window (the idle path paid the render later, followed by a redraw of every slot). `perf.spec` was not run.

**Follow-ups**
1. (P2, U42's remainder) Long pieces keep the idle re-plan; a trimmed probe load in `create` for every piece would remove it at the cost of a later first paint — measure under `perf.spec`'s throttle before choosing.
2. (P2, the screen's; G1's file) The Score screen draws the first window before its bar and keyboard strip have taken their height: `ScoreScreen.ts` 4411 `renderer.showStep(0)` precedes 4419 `mountKeys()`, the offer read at 4512, and 4570 `showBar()` (the bar measures itself into `--score-bar-h` at 2922–2924). A height-bound piece is therefore first drawn larger and shrinks as the stage reaches its final box: Twinkle at 342 × 740 showed three staffs over a few frames (60.9, 54.3, 53.0 px) before settling. The renderer refits correctly; the fix is the screen reserving that height before the first draw.
3. (P3, E30) The better window rule above, once the size is set.
4. (P3, render) The Wabash cut at desktop sizes: its rehearsal-mark box sits a hair above the stage's top edge and is cut, and the tempo mark reads "= 120" without its note (`pictures/u74/e30-wabash-b1-4-1280x800.png`).
5. The observer's `fitting` return is unreachable in a browser (above); harmless, recorded.
6. Consumers not exercised here: every host of `WindowRenderer.create` now preloads a short piece's probe, measures before pricing and says `data-settled` a frame later — `DevScoreScreen`, `DevExcerptView` and `DevMicroscopeScreen` (whose `excerpts.spec` and `microscope.spec` wait on `data-settled`), and the setup tour's miniature (`devicePreview.ts`); a red there after this lands is the first place to look. The deferred word needs an animation frame, which the e2e config keeps running in background windows.

**Questions**
1. There are two definitions of the look-ahead's place in the window rule. `docs/04` §5 says the layout is "at the largest size where every asked bar and the next bar are on the stage"; the code (T34 rule 2, `chooseWindowShape`) sizes the window first and grants the next row only from the height left over, and `score.window-rule.spec` records "no room ahead" as a note, not a fault. Recommend the code's as the source of truth (it is what the gallery was judged on) with §5's sentence corrected — unless the owner wants E30's trade, which needs the size in Question 2.
2. Above what staff size is more size worth less than seeing the next music? Only `MIN_STAFF_PX` (22 px, provisional) is set.

**Files** (worktree; nothing committed, nothing staged): `app/src/score/WindowRenderer.ts` (changed); `app/tests/unit/windowRendererStage.test.ts`, `app/tests/e2e/score-fit-paths.spec.ts` (new); `docs/prompts/runs/U74/` (this entry, captures, `scripts/` — the probes, the pictures spec and the port-4233 override config as they ran, removed from `app/`, the mutant and path-sanitising scripts; paths in captures read `<worktree>`, `<main checkout>`, `<temp>`); `docs/prompts/pictures/u74/` (before and after, first draw and settled, both paths; four E30 cells). The content build rewrote `docs/prompts/inventory.md` and `rung-claims.md`; both restored from HEAD byte for byte (`SOURCES.md` untouched).

**Red lines** (each on the committed renderer; the unit file's also under a mutant per change, `mutants/summary.txt`, 7 of 7 red):
- `score-fit-paths.spec.ts` from Today: `1 system(s), staff 26.9 px: 28 frame(s), 577 ms` before the settled `2 system(s) … staff 43.2 px`.
- by the link after a fresh load: `1 system(s), staff 26.9 px: 30 frame(s), 506 ms`.
- `windowRendererStage.test.ts` (d) first draw: `expected [ '0-1' ] to deeply equal [ '0-0', '1-1' ]`; the search case: `expected [ '0-0', '0-1', '1-1' ] to deeply equal [ '0-1' ]`; the settled-word case: `the window this case is about: expected [ '0-1' ] …`.
- Mutants, each part of the change undone alone: every one turns its case red (`mutants/summary.txt`, the Tests table).

**Tests**

| Test | File | Class | Reason | Committed renderer |
| --- | --- | --- | --- | --- |
| the first window drawn is the one the fit settles on | `windowRendererStage.test.ts` | add | the mechanism | red |
| (d) a taller stage met first settles as one made on the final stage | same | add | cause (d) as timing to an equal box | green (not the cause) |
| (b) an off-run height change is refit to the new stage's shape and size | same | add | cause (b) | green (not the cause) |
| (a) a change delivered inside a fit: the final stage's window | same | add | cause (a), worst case | green (not the cause) |
| (c) a width change off a run re-plans | same | add | cause (c) | green (not the cause) |
| (c) a width change during a run: new held size, same step | same | add | run-size contract | green |
| a height-only change during a run: same size and shape, no re-engraving | same | add | run-size contract | green |
| measured once per settled zoom, never at a search's trial zoom | same | add | no measurement storm | green; red under its mutant |
| the search re-engraves the window it sizes | same | add | change 3 | red |
| a piece past the probe's reach keeps the idle load | same | add | change 1's bound | green; red under its mutant |
| settled only a frame after the fit; a stage change takes it back | same | add | change 4 | red |
| a disposed renderer says nothing, draws nothing more | same | add | disposal | green; unverified as a discriminator |
| the two paths settle the same (box, systems, bars, staff) | `score-fit-paths.spec.ts` | add | the brief's learner-facing proof | green at birth: the settled paths never differed |
| from Today, the first frame draws the settled layout | same | add | the mechanism on the glass | red |
| by a link after a fresh load, the same | same | add | the mechanism on the glass | red |
| `autoFit.test.ts` (`worthRefitting`, `refitEngraving`), `fitDetail.test.ts`, `readAheadScale.test.ts`, `pieceExtent.test.ts` | — | untouched | preserved | green |
| `score.window-rule.spec.ts`, `today.spec.ts` | — | untouched | preserved | green |

**Exit codes**

| Step | Exit | Capture |
| --- | --- | --- |
| `npm ci` | 0 | `npm-ci.log` |
| parity reference | 0 | `parity.log` |
| copies from the main checkout (robocopy: files copied) | 1 | `copy.txt` |
| content build, offline | 0 | `content-build.log` |
| `npx tsc -b` | 0 | `tsc.txt` |
| `npm run lint` (first run 1: two type assertions in the new unit file, removed) | 0 | `lint.txt` |
| vitest: the stage, autoFit, fitDetail, readAheadScale, pieceExtent files (45 tests) | 0 | `vitest-named.txt` |
| `npm run build:app` | 0 | `build-app.txt` |
| Playwright, port 4233, four workers: `score.window-rule`, `score-fit-paths`, `today` (31 tests) | 0 | `e2e-named.txt` |
| red: the stage file on the committed renderer (3 of 12) | 1 | `red-vitest-stage-committed.txt` |
| red: `score-fit-paths` on the committed build (2 of 3) | 1 | `red-e2e-fit-paths-base.txt` |
| mutants (7 of 7 red, source restored) | 0 | `mutants-run.txt`, `mutants/` |
| pictures, committed build then changed | 0, 0 | `pictures-before.txt`, `pictures-after.txt` |
| probes (paths, ordinary routes, E30) | 0 | `probe-base*.txt`, `probe-and-e30-after.txt`, `trace-after.txt` |

**Doc rows**

`docs/04` §5 (the Score screen), in the *One size for the run* paragraph, replace "(one frame after the first draw)" with "(before the first draw, for a piece within the probe's reach of 48 bars; on idle after it for a longer one)", and add after that paragraph:

> **The first window is the measured one (U74, 2026-09-29).** A piece within the probe's reach has its probe loaded with the slots and measured before the first window is priced, so the first frame that draws the music draws the shape and size it settles on. Before, the chooser had nothing to price with, drew the whole window as one system, and re-planned when the measurement landed on idle half a second or more later — the one small system at the top of an empty stage in D4's pictures of the two-bar scale, on every path in (the two paths settled alike; the pictures were taken before they settled). Before the first note, the piece is measured again at each engraving zoom the fit settles on, never at a zoom the engraving search only tries, and the search re-engraves the shape on the glass. A longer piece keeps the idle load and its first-window re-plan. `data-settled` is said a frame after the fit, once the stage has held still through that frame; any stage change takes it back. The observer refits every stage change (a height alone off a run; a width always, releasing and retaking a run's size), as it did.

`docs/08`, the pieces table, a row after *How many systems the stage holds*:

> | **The first window at open, on every path in** (U74; U42's product part) | the window priced before the piece was measured: one system for the whole window at a smaller staff, re-planned half a second or more later, on every open and after every engraving search; D4's and D4a's pictures of the two-bar scale from Today caught it and were read as a path difference | `tests/unit/windowRendererStage.test.ts` (the real renderer against a controlled stage: the four causes, the first draw, the measurement per settled zoom, the search's shape, the deferred word), `tests/e2e/score-fit-paths.spec.ts` (the two paths settled alike; the first frame is the settled layout on both) — the first-draw cases red on the committed code | done for pieces within the probe's reach (U74, 2026-09-29); longer pieces keep the idle re-plan; the screen's own height change after the first draw (the bar and the keyboard strip) not covered |

`docs/08`, the e2e list, after `score.window-rule.spec.ts`:

> - `score-fit-paths.spec.ts` — the score fills the stage on every path in (U74): the two-bar blues scale at 342 × 740 with D4's seeded learner settles to the same stage box, systems, bars and staff from Today and by a link after a fresh load of the same route, and from the first frame that draws it the stage shows the settled layout on both paths — every frame recorded by the page from before the tap.

`docs/08`, the unit list:

> - `windowRendererStage.test.ts` — the real `WindowRenderer` against a stage the test controls, the engraver stood in (U74): a change delivered inside a fit, an off-run height change, a width change off and during a run, and a taller stage met first all come out as a renderer made on the final stage; the first window drawn is the settled one; the probe is measured once per settled zoom and never at a search's trial zoom; the search re-engraves the window it sizes; a piece past the probe's reach keeps the idle load; `data-settled` is said a frame after the fit and taken back by a stage change.

`docs/08`, the `score.screen.spec.ts` line, after "the fit publishes `data-settled`, checked frame by frame …": "(since U74 said a frame after the fit, once the stage has held still, and taken back by any stage change)".

**Orchestrator's note at the landing (2026-09-29).** U74's worktree committed by name (9c9cf86) and merged clean (b2b5dd5). The chain on the merged main checkout (renderer only): typecheck, lint, the new unit file with the fit, window, first-contact and transfer-run files, the app build, the window-rule, fit-paths, Today and sight-reading specs on the default port (tsc 0; lint 0; vitest-targeted 0; build-app 0; e2e-fit 0; `runs/U74/orchestrator-exit.txt`). The brief's premise — a path difference — was wrong, and the builder proved it before fixing anything: both paths settle to the same two systems, and D4's picture was the first frame, priced as one system until the probe measured the piece; the fix makes the first frame the settled layout for pieces within the probe's reach. E30's rule stays with the trade recorded on twenty cells; two questions for the owner recorded (U77: where the look-ahead fits, the spec and the code disagree; U78: what staff size counts as big enough), and the over-48-bar first draw (U79) and the screen-side height shift after the first draw (G1's lines) as follow-ups. Nothing heard.

