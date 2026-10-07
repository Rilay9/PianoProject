### Entry 127 — U82: the sideways count never changed — U74 made the renderer say the measured count from the first draw, and `score.slide.spec.ts`'s sideways case, which had read the count said before the piece was measured, now asserts the window rule on the glass; the renderer is untouched

**Judgement.** Nothing a sideways learner sees changed with U74, on the dev piece or on a real one; what changed is a word the renderer said for about half a second. On the dev piece `tempo-change` (three bars, one staff, two bars asked, the dev harness at 880 × 412, stage 714 × 260), the tree before U74 (85bd683) and the committed tree (93210a89) draw the **same picture** at the spec's read: the first bar whole, the second bar's first note on the glass and its second note past the right edge, a five-line staff of 138.3 px (about six times `MIN_STAFF_PX`), note spacing as engraved (`data-stretch="natural"`, 1.13 and 0.79 staff heights between the notes of bars 1 and 2 on both trees). The tree before U74 **said** "window 0–1, 2 shown" over that picture, because the probe had not measured the piece yet (`data-measured` absent) and the chooser's unmeasured default is the count asked; about 0.65 s later the measurement landed and it said "0–0, 1 shown, `across`" without redrawing anything (same scale). The committed tree says "0–0, 1 shown, `across`" from its first frame. The spec read at once, so it saw 2 on the old tree (here; CI's pass at 05c9e01 is the same reading, inferred) and 1 since U74. Pictures: `pictures/u82/old-dev-tempo-change-spec-read-880x412.png` (said 2 bars, one on the glass) and `committed-dev-tempo-change-spec-read-880x412.png` (said 1) are the same image; `*-settled-880x412.png` likewise; the 740 × 342 pair shows the same at a narrower stage (574 wide). On one real piece from Today — the Minuet in G major, BWV Anh. 114, the card's first song row for a learner placed at 3.4, phone sideways 740 × 342 — both trees draw two bars asked as 2 shown with bars 1–4 whole on the glass (the window and the two read-ahead bars) at a 45.7 px staff (about twice the floor), and eight asked as 4 shown, the fifth bar's first note at the right edge, with the row saying *Bars — 8 asked, 4 shown: fits across* (`committed-today-piece-2-bars-740x342.png`, `committed-today-piece-8-bars-740x342.png`, `committed-today-piece-8-bars-sheet-740x342.png`; `old-today-piece-*` identical). So the brief's first branch does not hold (the old tree never drew two bars on the stage) and neither does the second as framed (it did not draw them distorted or small): the pricing is the same code on both trees, and the spec asserted a transitional claim that U74 removed. The expectation was the fault; the case now asserts the rule, and the renderer is unchanged. Nothing heard; both pieces unverified as music.

**Done**
- Item 1, the discriminating measurement, on both trees before any change (table below). Technical: the sideways pricing in `chooseWindowShape` is the same between 85bd683 and 93210a89 except for U74's `measureBeforePricing()` call at its top and the search's early return (`chooser-diff.txt`); the count on the glass, the staff, the scale and the spacing are equal on both trees; only the said window differs, and only before the old tree's idle measurement.
- Item 2, the fix follows the mechanism: no renderer change, since the new count is the rule's and the old tree's 2 was a word about a picture holding one bar. `score.slide.spec.ts`'s sideways case revised to assert `docs/04` §5 on the glass, read at once and once settled: every note of every bar in the window is inside the stage; the next bar's first note is on the glass while the piece goes on; fewer than asked only with `data-window-why="across"` and only when one more bar and the start of the one after it would not reach across; more bars engraved than the window. Red on the tree before U74 (its "0–1" with bar 1 not wholly on the stage) and under a mutant that restores the count by fiat; green on the committed tree. The unrevised case **passes** under that mutant: it would have accepted the wrong repair.
- Unit: two sideways cases in `windowRendererStage.test.ts` on the real renderer with the engraver stood in — bars that do not reach across two at a time at the height's size give fewer shown, said `across`, from the first draw; the same stage and asked count over bars that do reach across give both. Green at birth (the first branch did not hold, so nothing was red on the committed code); the first case red under the mutant.
- Item 3, the rule stays one rule: no special case anywhere; the state gallery run whole (it is one test; no filter reaches the sideways rows alone) on both trees and its sideways and rotation cells compared (below): 16 of 18 identical, the other two Scroll cells differ only in the renderer's debug pricing record, not on the glass.
- Preserved: `score.window-rule.spec.ts` (11 tests), `score-fit-paths.spec.ts` (3), the slide spec's other two cases, green on port 4333; `npx tsc -b` 0; `npm run lint` 0.
- The T38 words: the dev harness has no Bars row; its stage says `across` from the first draw, and the Score screen turns that into *…: fits across* (compact, sideways), seen on the Minuet at eight asked.

**Not done**
- A renderer change and a unit case red on the committed code: not made, because item 1 shows the committed count is the rule's (brief item 2's first branch does not hold).
- `python tools/content/build.py --offline`: not run. The first `npm ci` died with ENOSPC (the disk had no space left; about half a gigabyte came back after the partial install was removed), this worktree has no fetched sources under `build/` (U74 copied 700 MB and more of them from the main checkout before its offline build), and offline without them the build writes a smaller catalog without failing. `app/public/content` and `build/rung-claims.json` (read by `taughtByAncestry.test.ts`) were copied from the main checkout instead. Later the disk had room again and `npm ci` was redone properly (`npm-ci-2.txt`) after the first unit run through a junction to the main checkout's `node_modules` failed 36 import tests on Vite refusing files outside the worktree (`vitest-first-junction.txt`).
- `npx vitest run`: 2 of 6,916 fail, both in `lessonClaimsAboutApp.test.ts`, both matching `\n` in the source text of `ScoreScreen.ts` and `style.css`, which this Windows worktree checked out with CRLF; U82 touches neither file. CI (LF) is the run to trust for them.
- The old tree's eight-bar sheet picture: not taken (that picture was added after the old tree's run); its words read the same (`probe-old.txt`).
- The full default Playwright suite: not run — the renderer is unchanged, so only the named specs and the gallery.
- Nothing heard.

**Follow-ups**
1. (P3, the slide, `WindowRenderer.slideToStep`) On the dev harness at 740 × 342 (stage 574 wide, a 138 px staff) the step-0 slide puts bar 1's first note three tenths across and cuts the clef and half the time signature off the left edge, on both trees (`*-dev-tempo-change-*-740x342.png`): "never past the start" stops a slide right, not a slide left at the first bar. Not seen on the Score screen (the Minuet and the gallery's Hot Cross Buns at 740 × 342 show their openings whole). Recorded, not fixed (not the count).
2. (P2, the gallery, not U82's) On both trees the gallery breaks two checks: `theme--light`'s two contrasts at 4.3:1 (the backlog's U62) and `rotation--bars1-real-phone` at §9.35, the music 39 % of the stage — upright 342 × 740 after a turn at one bar per window, the bar across the width and a greyed next bar below, the lower half empty. The 2026-09-26 checkpoint reported only the contrasts, so the rotation cell's break predates U74 and is newer than that run, or is this machine's; not bisected.
3. (P2, feeds U78) The gallery's phone-sideways cells of one-staff Hot Cross Buns draw one bar shown at a 106–132 px staff (five to six times the floor); at 740 × 342 (the one picture looked at) the second bar is on the glass as read-ahead without the third bar's first note, so the row says one shown; two bars at a smaller size is exactly U78's open question (above what staff size is more size worth less than more music). Not decided here.

**Questions** — none new. Follow-up 3 is more evidence for U78.

**Files** (worktree; nothing committed or staged)
- `app/tests/e2e/score.slide.spec.ts` — the sideways case revised to assert the §5 rule on the glass (at once and once settled), with a helper `windowOnGlass`; the other two cases untouched.
- `app/tests/unit/windowRendererStage.test.ts` — two sideways cases and a header paragraph.
- `app/src/score/WindowRenderer.ts` — unchanged (the mutant was applied and restored byte for byte, `mutant-apply-restore.txt`).
- `docs/prompts/runs/U82/` — this entry, the captures, the probe JSON, the gallery extracts and comparison, and the scripts as they ran (`scripts-zz-u82-probe.spec.ts`, the two port-4333 configs, `scripts-mutant.py`, `scripts-gallery-extract.py`, `scripts-diff-chooser.py`, `scripts-sanitise.py`), the temporary ones moved out of `app/`; paths in captures read `<worktree>`, `<main checkout>`, `<temp>`.
- `docs/prompts/pictures/u82/` — the dev piece at both trees (at once and settled, 880 × 412 and 740 × 342) and the Minuet from Today at both trees (two and eight bars asked, and the eight-bar row's words).
- Temporary, removed: the worktree `build/u82-old` (its `node_modules` junction removed as a link first; `old-tree-worktree-remove.txt`). Left, ignored: `build/states/` (the committed tree's gallery pictures), `build/rung-claims.json`, `build/midi-parity/`.

**The discriminating measurement** (`scripts-zz-u82-probe.spec.ts`; `probe-old.txt`, `probe-committed.txt`, `probe-*-dev-*.json`). The slide spec's steps — dev harness, `tempo-change`, two bars asked, step 0 — read at once and again after `data-settled`, with a page-side trace from before the load. Positions are in stage pixels.

| | tree before U74, at once | tree before U74, settled | committed, at once | committed, settled |
| --- | --- | --- | --- | --- |
| window said (880 × 412) | 0–1 (2 shown), no reason | 0–0 (1 shown), `across` | 0–0 (1 shown), `across` | 0–0 (1 shown), `across` |
| `data-measured` | absent | 2 | 2 | 2 |
| stage | 714 × 260 | same | same | same |
| sheet scale, fit by | 1.7282, height | same | same | same |
| staff (five lines) | 138.3 px | same | same | same |
| bar 1: stave, notes | −4 to 551; 264, 420 | same | same | same |
| bar 2: stave, notes | 551 to 823; 631 (on), 740 (off) | same | same | same |
| spacing, staff heights | 1.13 / 0.79, `natural` | same | same | same |
| at 740 × 342 (stage 574) | 0–1 said; bar 2 notes 548 (on), 657 (off) | 0–0, `across` | 0–0, `across` | 0–0, `across` |

The old tree's trace: "2/2, not measured" through its first draws, then "1/2 across, measured 2" at about 0.65 s after the load began, the scale unchanged. The committed tree's first frame of the piece: "1/2 across, measured 1", then the engraving search's zoom 2 at the same size on the glass. So the orchestrator's hypothesis is half right — the measured pricing finds two bars of `tempo-change` wider than the stage at the height's size and drops to one — but the old tree priced the same once it had measured, and it did not scale two bars down: its refuting test came out as "the same staff height and the same one bar on the glass", so the new pricing lost nothing. The old spec passed on a word said before the piece was measured.

**The gallery comparison** (`states-old.txt`, `states-committed.txt`, `states-sideways-*.json`, `states-compare-old-committed.txt`). 60 cells on each tree; the 18 drawn as one system or turned: every sliding sideways cell identical in count shown, staff, CSS scale, engraving zoom and share of the stage — phone sideways 740 / 780 / 915 one-staff: 1 shown at 106.3 / 112.1 / 131.8 px; grand staff 780: 2 shown at 52.5 px; long-title bars 2 shown at 57.5–58.4 px; the modes, the sheet and mid-run rotation the same. The two Scroll cells draw the same sheet (scale, bars, share) and differ only in the renderer's debug pricing record, empty on the old tree and filled on the committed one (inferred, not traced: the piece is measured before the first window is priced, so a measurement exists when the chooser runs in Scroll). Both trees break the same two checks (Follow-up 2).

**Red lines**
- The committed case on the committed tree: `Expected: 2 Received: 1` at `expect(inWindow).toBe(2)` (`red-e2e-slide-committed.txt`); the same case green on the tree before U74 (`e2e-slide-old.txt`).
- The revised case on the tree before U74: `at once: window 0-1 of 2 asked, stage 714 wide, bars {"0":{"all":true,"first":true},"1":{"all":false,"first":true},…}: bar 1 is in the window and not wholly on the stage` (`red-e2e-slide-revised-old.txt`).
- Under the restore-by-fiat mutant: the revised case red with the same line (`mutant-e2e-slide.txt`); the unit case `fewer than the two asked: {"arrangement":"single","scale":1.305…,"room":558,"shown":2,"staffPx":52.2}: expected 2 to be less than 2` (`mutant-vitest-stage.txt`); the unrevised case green (`mutant-e2e-slide-head.txt`).

**Tests**

| Test | File | Class | Reason | Committed renderer |
| --- | --- | --- | --- | --- |
| sideways: draws more bars than the window, so there is something to read into | `score.slide.spec.ts` | revise | asserted the count asked, which the renderer said only before the piece was measured; now the §5 rule on the glass, at once and settled | the old expectation red; revised green; red on the tree before U74 and under the mutant |
| bars wider than the stage holds two of: one bar, said as `across`, from the first draw | `windowRendererStage.test.ts` | add | the sideways count on the real renderer | green at birth; red under the mutant |
| the same stage over bars that reach across: both shown | same | add | the rule's other side, so the first case is not a renderer that always says one | green |
| sideways: holds the cursor a third across; upright: does not slide | `score.slide.spec.ts` | untouched | preserved | green |
| the window rule's grid (five shapes) and its six other cases | `score.window-rule.spec.ts` | untouched | preserved | green |
| the two paths and their first frames | `score-fit-paths.spec.ts` | untouched | preserved | green |
| U74's twelve stage cases | `windowRendererStage.test.ts` | untouched | preserved | green |

**Exit codes**

| Step | Exit | Capture |
| --- | --- | --- |
| `npm ci`, first (ENOSPC) | 1 | `npm-ci.txt` |
| `node_modules` junction to the main checkout's | 0 | `setup-node-modules-junction.txt` |
| parity reference | 0 | `parity.txt` |
| content copied from the main checkout (robocopy: files copied) | 1 | `copy-content.txt` |
| `git worktree add` for 85bd683 and its setup | 0, 0 | `old-tree-worktree-add.txt`, `old-tree-setup.txt` |
| `npm run build:app`, committed and old trees | 0, 0 | `build-app-committed.txt`, `build-app-old.txt` |
| `chooseWindowShape` diffed, 85bd683 against 93210a89 | 0 | `chooser-diff.txt` |
| red: the committed case, committed tree | 1 | `red-e2e-slide-committed.txt` |
| the slide spec on the tree before U74 | 0 | `e2e-slide-old.txt` |
| probe, both trees | 0, 0 | `probe-old.txt`, `probe-committed.txt` |
| the revised slide spec, committed tree | 0 | `e2e-slide-revised-committed.txt` |
| red: the revised case on the tree before U74 | 1 | `red-e2e-slide-revised-old.txt` |
| mutant: stage unit file, build, revised spec, unrevised spec, restore | 1, 0, 1, 0, 0 | `mutant-*.txt` |
| `npx vitest run` through the junction | 1 | `vitest-first-junction.txt` |
| `npm ci`, second | 0 | `npm-ci-2.txt` |
| `build/rung-claims.json` copied | 0 | `copy-rung-claims.txt` |
| `npx vitest run` (2 CRLF source-text failures, not U82's) | 1 | `vitest.txt` |
| `npm run build:app`, final | 0 | `build-app.txt` |
| Playwright, port 4333, two workers: slide, window rule, fit paths (17 tests) | 0 | `e2e-named.txt` |
| state gallery, committed and old trees (both: U62's contrasts, the rotation cell) | 1, 1 | `states-committed.txt`, `states-old.txt` |
| gallery comparison | 0 | `states-compare-old-committed.txt` |
| `git worktree remove` | 0 | `old-tree-worktree-remove.txt` |
| `npx tsc -b`, final | 0 | `tsc.txt` |
| `npm run lint`, final | 0 | `lint.txt` |

**Orchestrator's note at the landing (2026-09-29).** U82's worktree committed by name (be8802c3) and merged (a36fbfaf). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U82/map-min.txt`: no e2e line), typecheck, lint, the whole unit suite, the app build, the spec names checked, and the slide, window-rule, fit-paths, wide, score and Today specs on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/U82/orchestrator-exit.txt`). The orchestrator's brief and record called this a regression since U74; the builder's discriminating measurement refuted that before any change: U74 changed nothing a sideways learner sees on the dev piece or on a real one — the tree before U74 stated "two shown" for the first half-second because the probe had not measured the piece yet, and said "one, across" once it had, with nothing redrawn; the spec read at once and asserted the pre-measurement claim. The case now asserts `docs/04` §5's rule on the glass, at once and once settled, and is red on both trees' old claims and under a mutant that restores the count by fiat — a mutant the unrevised case would have accepted. The renderer is unchanged; the gallery is the same on the glass on every sideways and rotation cell. The plan's and in-flight's earlier words ("a real regression since U74") are corrected here. Three rows: the gallery's light-theme contrasts (U62) and the rotation cell's §9.35 check break on both trees and predate U74 (U88); the dev harness slides the clef off the left edge at 740 × 342 on both trees, not seen on the Score screen (U89); phone-sideways Hot Cross Buns shows one bar at a staff far above the floor, evidence for U78. Nothing heard.


## Doc rows

`docs/04` §5 (the Score screen), in *Two things this settles*, after "(T38: this said a bar's room, and the row said *1 shown* while two bars and the start of the third were on the glass)", add:

> Since U74 that count is priced from the piece's measurement from the first draw. Before, the window said the count asked until the measurement landed on idle, about half a second later, over the same picture — on the dev piece `tempo-change` at 880 × 412 "two shown" with the second bar past the right edge — and `score.slide.spec`'s sideways case asserted that word; it asserts the rule on the glass now (U82, 2026-09-29).

`docs/08`, the e2e list, replace the `score.slide.spec.ts` line with:

> - `score.slide.spec.ts` — sideways the sheet slides by bar, holding the cursor about a third across; and the window holds as many of the asked bars as reach across at the size the height gives — every note of them inside the stage, at once and once settled, the next bar's first note after them, fewer said as `across` only when one more bar and the start of the one after it would not reach across (U82: it had asserted the count asked, which the renderer said only before the piece was measured).

`docs/08`, the unit list, at the end of the `windowRendererStage.test.ts` line: "; sideways, the count follows what reaches across at the height's size — fewer said as `across` — from the first draw, and over bars that reach across the count asked (U82)."

`docs/08`, the pieces table, in the *The first window at open, on every path in* row's tests column, after `tests/e2e/score-fit-paths.spec.ts (…)`: ", `tests/e2e/score.slide.spec.ts` (sideways: the window said is the window on the glass from the first draw, U82)".
