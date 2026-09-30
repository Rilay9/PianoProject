### Entry 186 — U113 — look-ahead against the requested count: 24 cells measured, one trade and no strict gain, and the owner's question

**Base** `36be5a50` (origin's head at dispatch, checked first with `git log -1`), worktree `<worktree>`. The brief is `tasks/U113-look-ahead-against-the-requested-count.md` with the reviewer's required change (`review/responses/questions-fc9f1a8b-correction.md` §U113) folded in: `barsAsked` held fixed, the alternate read from the same pricing pass, the one renderer edit a diagnostic per-candidate `ahead` read-out. `npm ci` in `app/` (exit 0); `app/public/content` copied read-only from the main checkout (every item but the tracked `audio/`), no content build. The app built once from the final code into `build/u113/dist` and once with the base renderer into `build/u113/dist-base` (both `vite build`, exit 0), never rebuilt under a run. Every browser run went through a config copy (`scripts-playwright.u113.config.ts`, run from `app/build/u113/`, the storage state by absolute path re-keyed to `http://localhost:4532`, `vite preview --strictPort` on **port 4532**). One Playwright at a time. Nothing committed, staged, stashed, reset or checked out. At the end the config copy (`app/build/`), `app/test-results`, the copied content, the generated `app/public/icons` and the worktree's `build/` (both builds, the probe's output, the unit inputs) were deleted; `app/node_modules` stays.

**Measured on this machine's renderer only; unverified on a device; nothing heard.** Every px and bar count below is a measurement of the renderer in Chromium at the stated viewport, upright, at rest, with the window at the piece's opening; none is a general figure. No note, sound, lesson, score byte or chooser decision changed.

## Judgement

**The table.** The four corpus pieces × Bars 4, 6, 8 × 342×740 and 360×780, one fresh page a cell, read through the app's own read-only hook (`window.__pianopath.scoreFit()`, which is `debugFit()`), never a copy of the chooser. Held fixed and read back from every cell rather than assumed: Size 100 % (`userZoom` 1); upright slots (`readAhead` `slots`, `priced.arrangement` `slots`); the look-ahead treatment `run-off` (`pianopath.lookAhead` unset, so the default); `pianopath.settings` = `{"barsPerWindow":N}` with every other setting at `DEFAULT_SETTINGS`; the stage 342×531 at 342×740 and 360×571 at 360×780; `data-settled` true, `sheets.pending` 0, `frozen` null, no run started, the window's first row at bar 1. The staff is the five-line staff, top line to bottom line, in CSS px, from the pricing pass's `candidates` (the column the brief names); the floor is `MIN_STAFF_PX` (22). "requested − 1" is the `shown = barsAsked − 1` entry of the **same** pass, `barsAsked` fixed (the ruling's shape 1); its grey-row column is the new read-out. The full account (every count priced, the staff measured on the glass, the free height against the reserved row, the reason, the sheets, the reshape ladder, the engraving zoom) is `table.md`; the data is `probe-grid.jsonl`.

| piece | viewport → stage | barsAsked | barsShown | staff at the requested count (px) | floor margin (px) | floor margin (% of 22) | systemsPerWindow | look-ahead state `ahead` | rows on the glass | requested − 1: shown | requested − 1: systems | requested − 1: staff (px) | requested − 1: margin (px) | requested − 1: grey row | main hypothesis (literal) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| five-finger | 342x740 → 342×531 | 4 | 3 | 43.2 (at 3: the piece's length) | 21.2 | 96.4 | 3 | none | 1 / 2 / 3 | 2 | 2 | 62.1 | 40.1 | no | no |
| five-finger | 342x740 → 342×531 | 6 | 3 | 43.2 (at 3: the piece's length) | 21.2 | 96.4 | 3 | none | 1 / 2 / 3 | 2 | 2 | 62.1 | 40.1 | no | no |
| five-finger | 342x740 → 342×531 | 8 | 3 | 43.2 (at 3: the piece's length) | 21.2 | 96.4 | 3 | none | 1 / 2 / 3 | 2 | 2 | 62.1 | 40.1 | no | no |
| five-finger | 360x780 → 360×571 | 4 | 3 | 46.8 (at 3: the piece's length) | 24.8 | 112.7 | 3 | none | 1 / 2 / 3 | 2 | 2 | 65.4 | 43.4 | no | no |
| five-finger | 360x780 → 360×571 | 6 | 3 | 46.8 (at 3: the piece's length) | 24.8 | 112.7 | 3 | none | 1 / 2 / 3 | 2 | 2 | 65.4 | 43.4 | no | no |
| five-finger | 360x780 → 360×571 | 8 | 3 | 46.8 (at 3: the piece's length) | 24.8 | 112.7 | 3 | none | 1 / 2 / 3 | 2 | 2 | 65.4 | 43.4 | no | no |
| twinkle | 342x740 → 342×531 | 4 | 4 | 42.1 | 20.1 | 91.4 | 2 | none | 1–2 / 3–4 | 3 | 2 | 42.1 | 20.1 | no | no |
| twinkle | 342x740 → 342×531 | 6 | 6 | 32.7 | 10.7 | 48.6 | 3 | none | 1–2 / 3–4 / 5–6 | 5 | 3 | 32.7 | 10.7 | no | no |
| twinkle | 342x740 → 342×531 | 8 | 8 | 30.8 | 8.8 | 40 | 3 | none | 1–3 / 4–6 / 7–8 | 7 | 3 | 30.8 | 8.8 | no | no |
| twinkle | 360x780 → 360×571 | 4 | 4 | 44.4 | 22.4 | 101.8 | 2 | row ¹ | 1–2 / 3–4 / 5–6 grey | 3 | 2 | 44.4 | 22.4 | no | no |
| twinkle | 360x780 → 360×571 | 6 | 6 | 36.3 | 14.3 | 65 | 3 | none | 1–2 / 3–4 / 5–6 | 5 | 3 | 36.3 | 14.3 | no | no |
| twinkle | 360x780 → 360×571 | 8 | 8 | 32.4 | 10.4 | 47.3 | 3 | none | 1–3 / 4–6 / 7–8 | 7 | 3 | 32.4 | 10.4 | no | no |
| nocturne | 342x740 → 342×531 | 4 | 4 | 25.1 | 3.1 | 14.1 | 2 | continues | 1–2 / 3–4 / 5–6 grey | 3 | 2 | 25.1 | 3.1 | yes | no |
| nocturne | 342x740 → 342×531 | 6 | 6 | 23.7 | 1.7 | 7.7 | 3 | none | 1–2 / 3–4 / 5–6 | 5 | 3 | 25.1 | 3.1 | no | no |
| nocturne | 342x740 → 342×531 | 8 | 6 | 16.9 | -5.1 | -23.2 | 3 | none | 1–2 / 3–4 / 5–6 | 7 | 3 | 16.9 | -5.1 | no | no |
| nocturne | 360x780 → 360×571 | 4 | 4 | 26.5 | 4.5 | 20.5 | 2 | continues | 1–2 / 3–4 / 5–6 grey | 3 | 3 | 27.4 | 5.4 | no | **holds** |
| nocturne | 360x780 → 360×571 | 6 | 6 | 25 | 3 | 13.6 | 3 | none | 1–2 / 3–4 / 5–6 | 5 | 3 | 26.5 | 4.5 | no | no |
| nocturne | 360x780 → 360×571 | 8 | 6 | 17.8 | -4.2 | -19.1 | 3 | none | 1–2 / 3–4 / 5–6 | 7 | 3 | 17.8 | -4.2 | no | no |
| scherzo | 342x740 → 342×531 | 4 | 4 | 32 | 10 | 45.5 | 2 | none | 1–2 / 3–4 | 3 | 2 | 32 | 10 | no | no |
| scherzo | 342x740 → 342×531 | 6 | 6 | 28.3 | 6.3 | 28.6 | 3 | none | 1–2 / 3–4 / 5–6 | 5 | 3 | 28.3 | 6.3 | no | no |
| scherzo | 342x740 → 342×531 | 8 | 8 | 26.2 | 4.2 | 19.1 | 3 | none | 1–3 / 4–6 / 7–8 | 7 | 3 | 26.2 | 4.2 | no | no |
| scherzo | 360x780 → 360×571 | 4 | 4 | 33.7 | 11.7 | 53.2 | 2 | none | 1–2 / 3–4 | 3 | 2 | 33.7 | 11.7 | no | no |
| scherzo | 360x780 → 360×571 | 6 | 6 | 31.3 | 9.3 | 42.3 | 3 | none | 1–2 / 3–4 / 5–6 | 5 | 3 | 31.3 | 9.3 | no | no |
| scherzo | 360x780 → 360×571 | 8 | 8 | 27.6 | 5.6 | 25.5 | 3 | none | 1–3 / 4–6 / 7–8 | 7 | 3 | 27.6 | 5.6 | no | no |

The five-finger exercise is three bars long, so the pricing starts from three (`wanted`, `WindowRenderer.ts`:1803) and the whole piece is on the stage at every count asked: look-ahead is not in question there. ¹ Twinkle at 360×780, Bars 4: the glass has a greyed row that the last pricing pass says has no room, because the reshape ladder ended spent (Observation 1).

**What it shows about the open case.**

- **The main hypothesis holds in one cell of 24 under the brief's literal test, and in none as a strict gain.** The cell is the Nocturne op. 48 no. 1 at 360×780, Bars 4: four bars clear the floor at 26.5 px (4.5 px, 20.5 % over); three would draw at 27.4 px on **three** systems instead of two — the literal test's "more systems" — but **without the greyed row** the four have. Rows of music on the stage at rest are three either way, and the next music (bars 5–6, greyed) is in view with four asked and not with three (`pictures/u113/nocturne__360x780__bars-4__settled.png` against `…__bars-3__settled.png`, the page that asked three on the same phone, which draws exactly the candidate: three systems, 27.4 px, no row). Read as dominance (no part of the look-ahead poorer and one part richer), or as more rows in view, no cell in the grid has a one-bar-fewer count with more look-ahead. In the other 23 cells one bar fewer draws the same or fewer systems, gains no greyed row, and draws at the same or a larger staff — or falls under the floor. So at these two sizes and on this corpus the contract's missing rule is real in the abstract, and its only demonstrated instance is a trade of the greyed row for a system.
- **The Nocturne at Bars 8 is the existing floor alone; premise 5 holds.** `staffPx` at `shown = 8` in that cell's own pricing pass is **16.9 px** at 342×740 and **17.8 px** at 360×780, under 22; seven is under it too (the same two figures); six is the largest count that clears it (23.7 and 25.0 px), and it is what is drawn, with *8 would be too small here* (`why` = `floor`). U32a's picture is Rule A's floor, not an instance of the open question (`pictures/u113/nocturne__342x740__bars-8__settled.png`, `…__360x780__bars-8__settled.png`).
- **The three rules' mechanical consequences on this table**, with no recommendation among them:
  - *Rule A, today's:* the table as drawn; changes nothing.
  - *Rule B, look-ahead never regresses above the floor:* what it changes depends on how "poorer look-ahead" is read when its two parts disagree. Read literally (more systems, or a row the other lacks, counts as more), it changes exactly one cell: the Nocturne at 360×780, Bars 4, becomes three bars on three systems at 27.4 px, the greyed row lost, the count said as three of four shown. Read as dominance, or as more rows in view, it changes no cell.
  - *Rule C, margin-gated:* it can change only that same cell, and only if the owner's fraction is above 20.5 % of the floor (a comfortable staff above about 26.5 px on this measure) **and** a system gained counts as a full extra look-ahead system although the greyed row is lost; otherwise it changes nothing. The margins where the requested count is drawn run from 7.7 % (the Nocturne at 342×740, Bars 6, 23.7 px) to 101.8 % (Twinkle at 360×780, Bars 4); one trade cell is too thin to suggest a starting fraction. Cells where one bar fewer buys size and no look-ahead — the Nocturne at Bars 6, five bars on the same three systems at 25.1 px against 23.7 (342×740) and 26.5 against 25.0 (360×780) — are changed by none of the three rules: that is the size-against-count trade of U78, not this question.
- **The product question, for the owner, verbatim from the ruling, with the table above:** *"when both choices are above the hard readability floor, should extra readable look-ahead outrank satisfying the requested bar count, and by what observable rule?"* The one case this corpus offers at these sizes is a third system traded for the greyed next row, so the answer also settles which of the two counts as look-ahead when they disagree.

**Technical verdict:** the read-out is built and guarded — two unit cases red on the base (the field absent), both mutants killed; the chooser's pick identical in all 24 cells against the base build (shown, systems, slots, look-ahead state, reason, and the rows and staff on the glass); `score.window-rule`, `score.slots`, `score.readahead` and `score.fill` green on the final build. **Pedagogical verdict:** none drawn; this lane measures and asks. As observations against the three goods: in the trade cell the four-bar picture keeps the next music in view at rest and the three-bar picture does not, at a staff about 3 % smaller; which serves a learner better is the owner's line to rule, and it is *unverified on a phone*.

## Premises, checked at the line

1. **The ruling** (`responses/questions-26a913fe.md`:19–21): as quoted; this entry asks its question verbatim.
2. **The supersession** of `responses/2f67b047.md` "Question 2": as the brief says; that response is cited here only as the origin of Rule B's wording.
3. **Rule A at the lines**, at the base `36be5a50` (the brief's numbers are `d5c6491f`'s and have moved): `nextInView` :1949–1955, `bestFor` :1956–1966, the count-yields loop :1985–2003, the drawn shape's `ahead` :2018–2030, `candidates` :2033–2039, `debugFit()` :2451 (`priced` :2473, `ahead` :2484). The behaviour is as the brief describes.
4. **Superseded, not wrong:** U32a has landed on `main` (closed in `88681184`), so this lane measured `main` with it and needs no equivalence argument. Where the table meets U32a's own figures they agree: the Nocturne at 342×740, Bars 4, two rows with 5–6 greyed below; Bars 8, six of eight on three rows at 23.7 px.
5. **Tested** (Judgement): it holds.
6. **No comfort constant:** the loop at :1985–2003 reads `MIN_STAFF_PX` and, over 100 % Size only, the Size rule's own tolerances (0.98, 1.005); no second staff threshold.
7. **Right about the accessor, wrong in one field, as the brief foresaw:** `window.__pianopath.scoreFit` is installed read-only by `ScoreScreen.ts`:5143 (typed at `testHooks.ts`:63) and returns `debugFit()`; nothing was added there. `candidates` carried `shown`, `systems` and `staffPx` and no look-ahead; the one renderer edit adds it.
8–9. **The three goods and R2:** as quoted.
10. **The corpus:** the four pieces; the five-finger exercise is three bars, which the table states.
11. **The sizes:** 342×740 and 360×780 upright; the stages they give are recorded above.

## Mechanism: the read-out

`priceWindowShape` reserved the drawn shape's greyed row with one expression over the chosen count's window, systems, scale and slot cap (base :2017–2030). It is now a local function of those four, `aheadFor(shown, systems, drawn, maxSlots)` (final :2026–2040), called once for the chosen shape — `const ahead = aheadFor(choice.shown, choice.systems, choice.drawn, choice.maxSlots)`, the same expression over the same values, so the choice cannot move — and once for every count in `candidates` from that count's own values:

```ts
const maxSlots = Math.max(1, Math.min(mostSlots, this.slotCeilingNow(stage.width, shown)));
const best = bestFor(shown, maxSlots);
...
ahead: aheadFor(shown, best.systems, drawn, maxSlots),
```

`debugFit().priced.candidates[]` now carries `{ shown, systems, staffPx, ahead }`. One function rather than a copy so that "the same computation" holds by construction; the before/after run on the 24 cells is the check that the choice did not move.

**What the read-out can and cannot say, measured.** Inside the one function, the scale actually on the glass (`drawnNow`) and the drawn rows' height (`drawnRowPx`) enter only for the count on the glass: an undrawn candidate's rows and its greyed row are both priced at the reserve (the piece's tallest system), while the drawn shape's greyed row is priced at the rows drawn. So an undrawn candidate's "no row" can become a row once drawn. Seen once in the cross-check: the Scherzo at one bar on 342×740 is priced "no row" at 47.1 px inside the Bars 4, 6 and 8 passes, and drawn with a row when one bar is asked (48.3 px; the reserved row 267 px, the drawn row's ink about 227 px tall, and the greyed row reaching the stage's bottom edge with no free height left). No cell's "requested − 1" entry is affected: each matches, in systems and row, the page that asked that count on the same phone, except Twinkle at 360×780 (Observation 1).

**The cross-check, and why the counterfactual is shape 1.** Every count 1–8 was also asked on its own page at each size (`probe-other.jsonl`: Bars 3, 5, 7, and Bars 1, 2 as cross-check inputs, not table columns). Of 98 candidate entries whose count a page asked and drew, 90 match that page's systems and grey row; the eight that do not are Twinkle at 360×780 (five entries, the spent ladder) and the Scherzo's one bar (three entries, the reserve pricing above). Those pages also answer whether a long piece's loaded sheets (`mostSlots`: three for the Nocturne, two or three for the Scherzo) capped a candidate, since each page priced its own sheets with every sheet a stage can hold (`sheetsNeeded`): no systems or row differed for that reason. The staff matched within 0.1 px in 61 of the 98 and differed by at most 2.5 px (5.0 %) in the rest, because a page prices bars from its own history — the engraving zoom it settled at and the widest bar it has drawn (`barTable`) — so a re-ask is not the same pricing as the same pass. That is the drift the reviewer's required change guards against; shape 1 avoids it.

## Tests

| test | class | what it proves | red line on the base (read-out absent) | mutants |
| --- | --- | --- | --- | --- |
| `windowRendererStage.test.ts` › U113 › *two asked on a stage they fill: the drawn count says no row below, one bar says one, as the chooser draws one bar asked* | add | 342×500, bars of 30: two of two on two rows with nothing below read out `ahead: false`; one bar on one row reads out `true`; the page that asks one bar draws that shape, at that staff, with that row | `the drawn count's read-out is the reservation the chooser made … expected undefined to be false` | M1 red |
| `windowRendererStage.test.ts` › U113 › *four asked on two rows with the next bar below: two bars draw larger and leave no room, as the chooser draws two asked* | add | 342×500, bars of 20: four of four on two rows with the next greyed read out `true`; two bars on the same two rows at a larger staff read out `false`, though at the four's scale two rows would have had the room; the page that asks two draws that | `… expected undefined to be true` | M1 red, M2 red |

- **M1** (`scripts-make-mutants.mjs`): every candidate given the drawn shape's reservation (`ahead,`). Both cases red (`mutant-1-copy-drawn-unit.txt`).
- **M2**: each candidate's own rows priced at the drawn shape's scale (`aheadFor(shown, best.systems, choice.drawn, maxSlots)`). The second case red, the first green: there both counts draw at 36.2 px, so the second case is the one that tells a candidate's own scale from the drawn one (`mutant-2-drawn-scale-unit.txt`).
- **Preserved, green on the final build** (port 4532, four workers): `score.window-rule.spec.ts` (11), `score.slots.spec.ts` (3), `score.readahead.spec.ts` (3), `score.fill.spec.ts` (3) — 20 passed (`e2e-targeted.txt`).
- **The before/after check** (not a test; `base-compare.txt`): the 24 cells on the base build against the final — the pick and the glass identical in 24 of 24; every priced count's shown, systems and staff identical in 20; in the four others the Scherzo's undrawn counts differ, by up to 1.2 px. They follow the engraving zoom each page settled at, not the change: the read-out reads the renderer and writes nothing (`currentScale` and `windowAt` are reads); in each of the four the two builds' pages settled at a different engraving zoom (base against final: 1.27/1, 1.16/1, 1/1.51, 1.24/1.36), the one Scherzo cell where they settled alike (360×780, Bars 6, both 1.24) prices every count alike, and the final build's page that asked seven, which settled at 1.27, prices four and one bar at 31.4 and 45.9 px as the base Bars 8 cell does (`probe-other.jsonl`); and the same build opened twice moves the same counts by up to 0.4 px on either build (`repeat-compare.txt`).

## Counts and exit codes

- `npm ci` 0; `vite build` 0 (final) and 0 (base renderer); `npx tsc -b --noEmit` 0; `npm run lint` 0.
- `windowRendererStage.test.ts` on the final: 29 of 29, exit 0. The two U113 cases on the base renderer: 2 failed, exit 1. M1: 2 failed, exit 1. M2: 1 failed, exit 1.
- The whole unit suite on the final: exit 1, 4 failed of 7470 in 322 files (`vitest-all-summary.txt`; the full log was not kept). Two lacked a fresh worktree's inputs: `midiParity` and `taughtByAncestry` pass once `python tools/midi-cleanup/tests/parity_reference.py` has run (exit 0) and `build/rung-claims.json` is copied read-only from the main checkout (`vitest-env-rerun-final.txt`). Two cases of `lessonClaimsAboutApp.test.ts` (*blues.3 … two tool buttons*; *4.7: blind hides the score …*) fail the same way with the base renderer in place (`vitest-env-rerun-base.txt`): not this change, not diagnosed (Observation 3).
- The probe: the grid 24 passed, Bars 3/5/7 24, Bars 1/2 16, the grid on the base build 24, the Scherzo repeats 6 and 6 — every run exit 0 (`probe-run-*.txt`).
- The targeted browser specs: 20 passed, exit 0.
- `python tools/docs/checks_for_paths.py` on the touched paths: exit 0 (`checks-for-paths.txt`). Its browser list for `app/src/score/**` is 28 specs; the four above were run here as the ones that read the chooser's pick and the greyed row; **the other 24 were not run here** and are the landing chain's and CI's.

## Deviations

1. **The brief's "Nothing under `app/src/**`" and "Mutants: not applicable"** are superseded by the dispatch, which allowed the one diagnostic read-out and asked for its unit case red first and its mutant. Done as asked; the brief's own Rules and files had already named this addition.
2. **Pictures** go under `docs/prompts/pictures/u113/`, as the dispatch names (U32a's convention), not the run folder.
3. **One function, not a copy**, for the drawn shape's reservation and the read-out (Mechanism); the before/after run is its check.
4. **Pages at Bars 1, 2, 3, 5 and 7** were opened for the cross-check (the ruling's shape 2 names this proof for a re-ask) and for the loaded-sheet question; they are not table columns. The brief's optional Bars-2 and Bars-1 table columns were **not added**: the table reads without them.
5. **Rule B is reported under three readings of "poorer"**, since the one cell where anything moves is exactly where the readings part.

## Questions for the reviewer and the owner

1. **For the owner, one line:** *"when both choices are above the hard readability floor, should extra readable look-ahead outrank satisfying the requested bar count, and by what observable rule?"* — with the table, the trade cell (the Nocturne at 360×780, Bars 4: two systems and the greyed next row at 26.5 px, against three systems and no greyed row at 27.4 px), and the part that follows from it: when a system gained and the greyed row lost disagree, which counts as look-ahead.
2. **For the reviewer:** the table suggests no starting fraction for Rule C (one trade cell, at a 20.5 % margin). Is the evidence enough to put question 1 to the owner as it stands, or should the grid first widen to sizes `score.window-rule` already uses (390×844, a tablet upright)? The brief said not to add sizes until something showed; one trade did.

## Follow-ups and observations (recorded and classified, none fixed)

1. **The reshape ladder ends spent on Twinkle at 360×780, Bars 3 and 4** (`shapeChanges.n` 6, the last rung): the glass keeps a greyed row that the last pricing pass says has no room, and in the picture the greyed row's chord symbols sit against the fingering of the row above (`pictures/u113/twinkle__360x780__bars-4__settled.png`). Hypothesis, not tested: the reservation flips between passes because a drawn shape's greyed row is priced at the drawn rows and an undrawn one at the reserve (Mechanism). A learner-visible layout truth; proposed as an observation for CL07 (responsive reading, with U78) rather than a new row, the orchestrator's call.
2. **The read-out prices an undrawn candidate's greyed row at the reserve** (Mechanism). It matters only if a rule that compares candidates is built from the owner's answer; such a build would have to decide it. No action now.
3. **Two `lessonClaimsAboutApp.test.ts` cases are red in this worktree with the base renderer too.** Not investigated; the orchestrator can compare CI's last run on `36be5a50`.

## Not done

- A device, and anything heard: this lane reads pixels and numbers only.
- The other 24 browser specs the path map names for `app/src/score/**` (the landing chain's and CI's).
- The optional Bars-2 and Bars-1 table columns (Deviation 4).
- Other sizes, sideways, and Size other than 100 %: outside the brief.

## Files

- `app/src/score/WindowRenderer.ts` — the per-candidate `ahead` read-out (`aheadFor`), diagnostic only.
- `app/tests/unit/windowRendererStage.test.ts` — the two U113 cases.
- `docs/prompts/runs/U113/` — `ENTRY.md`; `table.md` and `entry-table.md` (generated); `probe-grid.jsonl`, `probe-other.jsonl`, `probe-grid-base.jsonl` (the probe's data); `scripts-u113-probe.spec.ts`, `scripts-playwright.u113.config.ts`, `scripts-u113-table.mjs`, `scripts-u113-base-compare.mjs`, `scripts-make-mutants.mjs`; `base-compare.txt`, `repeat-compare.txt`; the logs `unit-red-on-base.txt`, `unit-stage-final.txt`, `mutant-1-copy-drawn-unit.txt`, `mutant-2-drawn-scale-unit.txt`, `tsc.txt` (empty: no output), `lint.txt`, `build-app.txt`, `checks-for-paths.txt`, `e2e-targeted.txt`, `vitest-all-summary.txt`, `vitest-env-rerun-final.txt`, `vitest-env-rerun-base.txt`, `setup-npm-ci.txt`, `setup-parity-reference.txt`, `probe-run-*.txt` (every kept file under 300 KB, machine paths as `<worktree>` and `<home>`).
- `docs/prompts/pictures/u113/` — `nocturne__360x780__bars-4__settled.png`, `nocturne__360x780__bars-3__settled.png`, `nocturne__342x740__bars-4__settled.png`, `nocturne__342x740__bars-6__settled.png`, `nocturne__342x740__bars-8__settled.png`, `nocturne__360x780__bars-8__settled.png`, `twinkle__360x780__bars-4__settled.png`.

## Doc rows

Proposed, not written (`docs/08-test-map.md` is not this lane's):

- `docs/08-test-map.md`:697, the `windowRendererStage.test.ts` line, append: "; every count the chooser prices carries its own look-ahead read-out (`debugFit().priced.candidates[].ahead`), priced from that count's own window, rows and scale in the same pass — never the drawn shape's answer or scale lent to it — checked both ways round and against the chooser's own reservation when that count is asked on its own at 100 % (U113)."
