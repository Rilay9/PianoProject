### Entry 182 — U105a — a refused summary control says so on the summary, sideways too

U105's required change under the fast path (`operating-procedure.md` §11): the reviewer's verdict on U105 at `f51e8010`, *APPROVE WITH ONE REQUIRED CHANGE* — "refusal must remain visible over the summary" (`docs/review/responses/f51e8010.md`), read with the second read's item B (`docs/review/second-reads/827289d0.md`). App only; a U105 seam although it touches `style.css`. (2026-09-30)

Base: `26a913fe` (origin's head at dispatch; `git log -1` matched). Source changed: `ScoreScreen.ts` and `style.css`. Browser runs on port 4793 through a config copy under the worktree's `app/build/u105a/` (below); nothing ran on 4173. Nothing committed, staged, stashed, reset or checked out. `app/public/content` (all but the tracked `audio/`) was copied read-only from the main checkout, twice (once per build round); nothing was written there.

**Two rounds.** The first build painted the sheet's line in every orientation, so upright and on a tablet the sentence showed twice. The orchestrator's word before landing (2026-09-30): *a learner reads that as a glitch*. Where the header's line is drawn (upright, the tablet), the sheet's line is hidden visually and kept in the accessibility tree; where the header is hidden (sideways), the sheet's line is the visible copy exactly as built; the refusal visible above or within the active summary surface in every orientation, once. This entry describes the second round; the first round's own results are named where they are kept.

## Judgement

**Unverified on a device** (no phone; this Chromium starts and resumes contexts without a gesture) and **unverified with a screen reader** (none run). The sentences are U105's, unchanged, and stay *unverified as copy*. Nothing was heard.

What a learner sees, a Keep tempo run of *Hot Cross Buns* to its summary, the sound suspended by the page and its `resume` stubbed never to answer, then *Again* (`pictures/u105a/`; the probe's measurements beside each picture in `runs/U105a/probe-*.json`):

- **Sideways, 740 × 342, before** (`refused-summary-sideways-before.png`). The summary stays up and nothing starts, rightly, but nothing in view says why. The header is not drawn (`display: none`); the only copy of *Sound did not start — tap Again* is the bar's mirror, which holds the whole sentence, uncut, under the sheet: the element drawn at its middle is `#score-summary`. The tap looks dead.
- **Sideways, after** (`refused-summary-sideways-after.png`). The sheet's first line, in the state line's accent and weight, above *Not measured*: *Sound did not start — tap Again*, whole, with nothing over it — the one copy in view. The buttons move down one line and stay in view. From the sheet scrolled to its foot (the self-report row), the line is held at the sheet's top and stays in view (the browser case).
- **Upright, 342 × 740, before and after** (`refused-summary-before.png`, `refused-summary-after.png`, both retaken in this round). The same picture: the header's state line just above the sheet says the sentence, once. After, the sheet also holds it as its first child, a status in the accessibility tree, not painted (a one-pixel clipped box); the sheet does not grow and *Again* does not move (the sheet's top and *Again*'s box are where they were before).
- **A tablet held sideways, 1024 × 768** (after only, for the record; picture not kept, `probe-refused-summary-tablet-after.json`): as upright, the header's line once, the sheet's copy not painted.

Every summary sentence fits one line of the sheet sideways in this Chromium (`fitsOnTheSheetLine` at 740: *Try again*, *Again*, *Slower*, *Faster*, *Loop*, and *Carry on*'s, the longest `soundOff` sentence at 40 characters, each with scroll width equal to client width and one line's height). Upright the header's line is the one read; it is uncut for *Slower* and *Again* in the browser case, and U105's probe measured all thirteen `soundOff` sentences uncut on it at 342 (`runs/U105/probe-refused-summary-fixed.json`). The upright `fitsOnTheSheetLine` rows measure the one-pixel box and mean nothing.

What a refused summary tap leaves: no run, the tempo, the loop, the hand and the summary exactly as they were (browser, both sizes, *Slower* then *Again*; unit, the five summary taps). Pedagogical: not applicable; nothing taught, judged or recorded changes.

## The mechanism and the discriminating test

**Mechanism.** The refusal was produced sideways and hidden, not missing. Sideways the header is `display: none` (`style.css`, A6's landscape ≤ 500 px rule), so the state line's only drawn copy is the bar's mirror (`#score-status-side`), and the summary sheet (bottom 0, z-index 5, up to 72 % high) is drawn over the bar.

**Alternatives and the test that told them apart** (the before probe, `probe-refused-summary-sideways-before.json`): (a) the refusal is not produced sideways — refuted: the mirror holds the sentence and *Again* carries `data-sound-refused`; (b) the mirror is drawn but cut — refuted: its scroll width equals its client width; it is covered (`elementFromPoint` at its middle returns `#score-summary`).

**The fix acts on where the sentence is drawn, not on the policy.** A `<p id="summary-refusal" role="status">` is the sheet's first child (`showSummary` puts it there). `drawSummaryRefusal` writes it from `drawWaitingFor`, the one place the state line is written, so the two never disagree. It holds `soundOffLine()`'s sentence when the refused control is on the sheet, and nothing otherwise: a tap asking again clears both, a refusal sets both, the sound starting by any path clears both. Whether it is painted is `style.css`'s alone, by layout:

- by default it takes `.visually-hidden`'s declarations: out of the paint, in the accessibility tree;
- inside the same query A6 hides the header with (`orientation: landscape` and `max-height: 500px`), it is painted: sticky at the sheet's top, wrapping rather than cutting;
- empty, it keeps no height and stays in the tree, so the status exists before its text does.

The bar is not lifted over the sheet (the second read's reason), no sound-start rule moved into CSS, and U63's Today rules are untouched.

**The one other way the header goes** is `data-chrome='folded'` (not a tablet). That query is not mirrored, because it does not arise under a refused summary tap. The tap is a `button()`, which unfolds the chrome before its handler runs. The stage, whose tap folds it, is inert under the summary. And the fold timer only runs during a run. This is read in the code, not exercised.

## Done

1. **The refusal for a control on the summary is visible within or above the active summary surface, once, in every orientation** (the verdict's required change and the orchestrator's word). Sideways the sheet's line is the copy read; upright and on a tablet the header's line just above the sheet is, and the sheet's copy is not painted.
2. **Upright, a refused summary control still names the tapped control**: the header's line, visible, uncut, above the sheet (browser at 342 × 740; U105's desktop case); the sheet's copy present and naming it (unit, five taps; browser).
3. **Sideways, the refusal is readable without dismissing the summary, and uncut**: in the window, inside the sheet's box, nothing drawn over its text at either end or the middle, scroll width ≤ client width, the text inside its box, `text-overflow` not `ellipsis`; and still so from the sheet scrolled to its foot.
4. **Once**: of the four places the sentence can be (the header's line, the bar's mirror, the stage's corner, the sheet's line), exactly one is painted where it can be read — sideways the sheet's, upright the header's (browser).
5. **The refused action changes none of run, tempo, loop, hand or summary state** (browser: each fact read as something first, then equal after each refusal; after the stub goes, *Again* runs at the tempo the refusals left).
6. **A screen reader can reach the sheet's line**: a `status` on the summary in Playwright's accessibility query at both sizes, outside every inert subtree (unit). Whether one announces it is unverified.
7. **Only a control on the sheet is named on the sheet**: a refusal standing for *Hear it* (U105's Follow-up 2 case) when the summary comes up is not said on it (unit guard).

*Technical:* 7 unit cases added (6 red on the base), U105's browser case extended, 2 browser cases added (all three red on the base), 5 mutants killed. *Pedagogical:* not applicable.

## Not done

- **The map's whole browser suite and the state gallery** (`checks_for_paths.py` names `npx playwright test --workers=4` and `npm run states` because `style.css` changed): not run. The brief's run list is the U105-named specs and the summary spec. The new rules paint nothing except under a refused summary tap sideways, and no gallery cell shows a refusal. Left to the landing chain and CI.
- **The whole unit suite green here** (run in the first round only, `unit-all-summary.txt`): 5 failed of 7,416.
  - The two `lessonClaimsAboutApp` CRLF claims (blues.3, 4.7). Rechecked in this round: they fail here as before, and both hold on the LF form of the final files (`unit-group.txt`).
  - `midiParity` (no parity reference) and `taughtByAncestry` (no `build/rung-claims.json`): this worktree ran no content build and no `parity_reference.py`, because the harness asked only for the content copy and this seam needs neither.
  - `tempoSoundAgainstMark` timed out in the suite and passed alone: load (`unit-failed-alone.txt`).
  - Since that run, only the two `.summary-refusal` rules, comments and one unit assertion changed.
- **`record_mirrors.py --check` and `test_record_mirrors` green** (named for this entry's path): both refuse for one reason, *entry-without-brief: docs/prompts/runs/U105a/ENTRY.md:1: Entry 182 names 'U105a', which no record block declares* (`record-mirrors-check.txt`, this round; `record-mirrors-test.txt`, the first round: 2 errors of 36 tests, both that). A `U105a` block or alias under a brief's `## Record` clears it. That record is the orchestrator's, not written here, and the generator was never run to write.
- **A screen reader; a real phone; a tablet upright**: none.

## Deviations, with reasons

1. **The sheet's copy is kept in the accessibility tree while empty** (sideways: no margin or padding, rather than `display: none`; upright it is `.visually-hidden`'s one pixel either way). A status that exists before its text changes is the form a screen reader announces most reliably. Unverified with one.
2. **At the sheet's top and held there, not beside the tapped control.** One element that lives with the sheet: the session transition redraws its own block (`drawTransition` empties `#session-next`). Sideways it is in view whichever summary control was tapped (*Try again* sits above the numbers, *Again* below them) and however the sheet is scrolled. The cost is the distance from *Again*: the heading and one paragraph.
3. **It wraps rather than holding one line** sideways, so it is whole at any display size. At 740 every summary sentence is one line in this Chromium.
4. **The second read's premise "`summaryUp` makes the bar inert" holds only until the first tap on the sheet** (Follow-up 1). The decision not to lift the bar stands: the bar's controls are meant to be out of reach behind the summary either way.
5. **Five mutants, not one.** m1 to m3 carry the first round's names, re-aimed at the new rules; m4 is the orchestrator's (hidden sideways too); m5 shows the *once* assertion catches the first round's double copy.
6. **The accessibility query is scoped to the sheet.** The header's line is also a `status`, and Playwright's role query counts it although it is inert under the summary. So "a screen reader reaches the sheet's copy" is asserted on the summary. That the inert header is out of the tree is the platform's definition of `inert`, not measured here.

## Follow-ups (recorded, not fixed)

1. **Observed, accessibility; attaches to U105's Follow-up 3 (the head inert under the summary; G98's lifecycle cluster), no new row.** Every summary button is made by the Score screen's `button()`, whose click runs `showBar()` → `foldChrome(false)` → `bar.inert = false` while the summary is still up. So after any tap on the sheet, the bar's controls are back in the tab order and the accessibility tree under the sheet. The probe reads the bar not inert after the refused *Again* at both phone sizes (`probe-*-after.json`, the bar's `inert: false`).
2. **Observed in the unit layer; attaches to U105's Follow-up 2.** A refusal standing for a control behind the sheet (*Hear it* over a run the platform silenced) is said by the header's line upright, which names a control that is inert behind the summary. The sheet says nothing, by design (item 7 of Done).
3. **Observation, load (first round).** U69's first case (▶ on a suspended context, a path this seam does not touch) failed once in a run: `data-running` still `false` after 5 s, in 10.3 s against about 2 s in its other runs. It passed in the rerun and in every run since (`browser-green-final-run1.txt`).

## Questions

None.

## Files

- `app/src/ui/screens/ScoreScreen.ts`: `summaryRefusal` (the element and its comment); `showSummary` puts it first (`sheet.replaceChildren(summaryRefusal)`) and draws it before `summaryUp(true)`; `drawWaitingFor` calls `drawSummaryRefusal`; `drawSummaryRefusal`.
- `app/src/style.css`: after the summary sheet's rules, `.summary-refusal` (not painted, in the tree) and, under `@media (orientation: landscape) and (max-height: 500px)`, `.screen--score .summary-refusal` (painted) and its `:empty`.
- `app/tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts`: the header paragraph; `SUMMARY_TAPS`, `summaryLine`, `underInert`; the U105a describe.
- `app/tests/e2e/score.screen.spec.ts`: U105's *Again* case reads the sheet's line; the upright and sideways pair in U69's describe.
- `docs/prompts/pictures/u105a/`: `refused-summary-{before,after}.png` (342 × 740, both taken in this round), `refused-summary-sideways-{before,after}.png` (740 × 342; before from the first round, after from this one).
- `docs/prompts/runs/U105a/`: this entry, the run files in the tables, the probe's JSON, and scripts not for `app/`:
  - `scripts-playwright.u105a-4793.config.ts`, run from `app/build/u105a/`;
  - `scripts-pictures.spec.ts`, from `app/build/u105a/probe/`;
  - `scripts-mutants.py`: mutants, base runs and rebuild, one step per call, the edits restored byte for byte in a `finally`;
  - `scripts-lf-claims.py`: the CRLF pair on the LF form;
  - `scripts-keep-logs.py`: the whole-suite summary, the copies, this machine's paths replaced by `<worktree>` and `<home>`.
- **The port.** A copy of `app/playwright.config.ts` at `app/build/u105a/playwright.u105a-4793.config.ts`:
  - `baseURL` `http://localhost:4793/PianoProject/`;
  - `storageState` by absolute path to `app/build/u105a/storageState.4793.json`, the fixture with its origin rewritten from 4173 to 4793;
  - `outputDir` `app/build/u105a/test-results`;
  - `webServer` `npx vite preview --port 4793 --strictPort` with `reuseExistingServer: false`, so it previews the dist built before the run and nothing rebuilds under a suite;
  - two workers, no retries, trace off.
- **Setup and cleanup.** `npm ci` in `app/` (exit 0, each round), and the content copy above. Deleted at the end of each round:
  - `app/node_modules`, `app/dist`, and the copied content (the tracked `audio/` left);
  - `app/build/u105a/`: the config copy, its storage state, the probe and `test-results`;
  - the worktree's `build/` temp, including the tablet picture;
  - the whole-suite log (about 900 KB; its summary kept).

## Tests

| Test | Class | Old assumption |
|---|---|---|
| unit: the five summary taps refused (never answers) — the sheet's line first on the sheet, `role="status"`, outside any inert subtree, naming the control as the state line does; the header's line not hidden; the tap unapplied | add (red on the base) | the header's line alone says it |
| unit: the sheet's line goes when the sound starts some other way and while the next tap asks; it follows the last tap; the refused *Slower* left the tempo | add (red on the base) | — |
| unit: a refusal standing for a control not on the sheet is not said on it | add (a guard; green on both) | — |
| unit: G86, U69, G86a, U105 cases (60) | preserve, unchanged | — |
| browser: U105's desktop *Again* case also reads `#score-summary #summary-refusal` (for a screen reader; not painted there) | extend (red on the base) | the line above the sheet is all there is |
| browser: upright 342 × 740 and sideways 740 × 342 — *Slower* then *Again* refused (the second from the scrolled foot). Both sizes: a status on the summary; one copy painted where it can be read; run, tempo, loop, hand and summary unchanged; the stub removed, *Again* runs. Sideways: the sheet's line seen and whole. Upright: the header's line seen and uncut, the sheet's copy not painted | add (both red on the base) | — |
| browser: U69's and G86a's ▶ cases | preserve, unchanged | — |

What jsdom can say: it loads no CSS and has no layout, so the unit cases hold presence, name, role, reach and the header's line not `hidden`; what is painted where is the browser's.

**Red lines on the base.**
- Unit (`unit-red-base.txt`, the base's `ScoreScreen.ts` swapped in; 6 failed, 61 passed): *AssertionError: summary-refusal: expected null not to be null* (the five taps); *AssertionError: expected '' to be 'Sound did not start — tap Again'* (the clear case).
- Browser (`browser-red-base.txt`, a dist built from the base's `ScoreScreen.ts` and `style.css`, the final spec; 3 failed, 2 passed): *expect(locator).toHaveText(expected) failed … element(s) not found* at `#score-summary #summary-refusal` (the desktop case, and both new cases at *Slower*'s refusal).
- Upright, the base's product fault was only the missing screen-reader copy: it already read the sentence once, in the header.

**Green** (final tree): the unit file 67 passed; the U69 describe 5 passed; the five targeted spec files 84 passed.

**Mutants** (`mutants.txt`, `m*.txt`; each built with `vite build` and run against the two new browser cases on the final spec; the source restored after each):

| Mutant | Upright | Sideways | Killed by |
|---|---|---|---|
| m1 — drawn only upright (painted upright, hidden sideways) | red | red | upright *not read once*, *the sheet's copy is painted upright too*; sideways *no status on the summary says it* |
| m2 — the sideways line cut as the bar's mirror is (one line, 28vw, an ellipsis) | green | red | *overflows its line*, *runs outside its line*, *cuts with an ellipsis*, *something is drawn over*, *not read once* |
| m3 — not held at the sheet's top (sticky removed) | green | red | from the scrolled foot: *outside the summary's box*, *something is drawn over*, *not read once* |
| m4 — hidden sideways too (the sideways rule matches nothing) | green | red | *not read once sideways*, *something is drawn over*, *overflows*, *runs outside* |
| m5 — painted upright too (the first round's double copy) | red | green | *not read once upright*, *the sheet's copy is painted upright too* |

## Exit codes

| Run | Where | Result | Exit |
|---|---|---|---|
| `npm ci` (this round) | `npm-ci.txt` | installed | 0 |
| `npm run build:app`, base (first round) / final | `build-app-base.txt` / `build-app-after-mutants.txt` | built | 0 / 0 |
| `npx tsc -b` (final) | `tsc.txt` | clean | 0 |
| `npm run lint` (final) | `lint.txt` | clean | 0 |
| unit file, base `ScoreScreen.ts` / final | `unit-red-base.txt` / `unit-green.txt` | 6 failed, 61 passed / 67 passed | 1 / 0 |
| unit group (the unit file, `scoreSummaryTruth`, `feedbackFromMeasurements`, `sessionTransition`, `help`, `lessonClaimsAboutApp`), and the CRLF pair on the LF form | `unit-group.txt` | 2 failed (the CRLF pair), 426 passed; both claims hold on LF | 1 |
| `npx vitest run` (first round) | `unit-all-summary.txt` | 5 failed (2 CRLF, 2 no content build or parity reference, 1 load), 7,409 passed, 1 skipped, 1 todo | 1 |
| the CRLF pair and the timed-out file alone (first round) | `unit-failed-alone.txt` | 2 failed (CRLF), 292 passed | 1 |
| U69 describe, base dist / final dist | `browser-red-base.txt` / `browser-green.txt` | 3 failed, 2 passed / 5 passed | 1 / 0 |
| the five spec files named below, 2 workers, port 4793 (final) | `e2e-targeted.txt` | 84 passed | 0 |
| spec files exist | `specs-exist.txt` | all five | 0 |
| pictures: upright before on the base dist / after, both sizes and the tablet | `pictures-before-upright.txt` / `pictures-after.txt` | 1 / 3 passed | 0 / 0 |
| mutants m1–m5 | `mutants.txt`, `m*.txt` | each killed; builds exit 0 | 1 each |
| `python tools/docs/checks_for_paths.py` (6 paths) | `checks-for-paths.txt` | 8 checks named | 0 |
| `python tools/docs/record_mirrors.py --check`; `test_record_mirrors` (first round) | `record-mirrors-check.txt`; `record-mirrors-test.txt` | refused: *entry-without-brief* for this entry (no `U105a` record block yet); 2 errors of 36, the same | 2; 1 |

The five spec files: `score.screen.spec.ts` (U105's named case and this seam's), `score.latch.spec.ts`, `score.hearbar.spec.ts` and `score.states.spec.ts` (the U105 paths its entry names), and `score.run.spec.ts` (a whole run to the summary). First-round files kept for their history: `pictures-before.txt` (the sideways before picture), `probe-*-before.json`, `browser-green-final-run1.txt`.

## Unverified

A real phone (the lock-screen suspend and the gesture rule); a screen reader announcing the `status`, or not reading the inert header; the copy; a tablet upright; the folded-chrome case (read in the code); the whole browser suite and the gallery under this change (the landing chain's).

## Doc rows

Not applied; for the orchestrator.

- **`docs/04-ui-spec.md` §5, the summary sheet bullet** (*End-of-run summary sheet: …*, :2431 at the base): add — *A tap on the sheet whose sound did not start is said once where the learner can read it (U105a). Where the header is drawn (upright, a tablet), its state line says it just above the sheet. Sideways, where the header is not drawn and the bar that mirrors its line is under the sheet, the sheet's first line says it: whole, wrapping rather than cut, held at the sheet's top when the sheet scrolls. The sheet holds the sentence in every orientation as a status a screen reader is told of, painted only sideways. Only for a control on the sheet.*
- **`docs/04-ui-spec.md` §5, U105's paragraph** (its last sentence, :2055–2057 at the base, *Sideways, with the summary up, the sheet covers the bar that carries the state line, so a refused summary tap says nothing there (U105's Question to the reviewer).*): replace with — *Sideways, with the summary up, the sheet covers the bar that carries the state line, so the summary says it itself: a refused tap on the sheet puts the same sentence first on the sheet, painted where the header is not drawn, so the learner reads it once in every orientation (U105a, the reviewer's required change, `responses/f51e8010.md`).*
- **`docs/04-ui-spec.md` §5f, the U105 sentences** (:3212–3223 at the base): add after *The tapped control carries `data-sound-refused` …* — *On the summary the sentence is also the sheet's first line (`#summary-refusal`, U105a): painted sideways, where the header is not drawn and the bar's mirror is under the sheet, and there it wraps rather than cutting; elsewhere kept for a screen reader only, because the header's line says it just above.*
- **`docs/08-test-map.md`, `score.screen.spec.ts`** (:355 at the base): append — *U105a: at 342 × 740 and 740 × 342, the summary's* Slower *then* Again *refused with the same stub: a* `status` *on the summary names each; exactly one copy of the sentence painted where it can be read (sideways the sheet's* `#summary-refusal`*, in the window, nothing drawn over it, uncut, still in view from the sheet scrolled to its foot; upright the header's line above the sheet, uncut, the sheet's copy not painted); the run, the tempo, the loop, the hand and the summary unchanged; the stub removed,* Again *runs at the tempo left. U105's desktop case reads the sheet's line too.*
- **`docs/08-test-map.md`, `scoreSheetsCloseAndPlayStartsSound.test.ts`** (:607 at the base): append — *And (U105a) the five summary taps refused: the sheet's* `#summary-refusal` *first on it, a* `status` *outside anything inert, naming the control as the state line does, with the header's line not hidden; gone when the sound starts or the next tap asks; a refusal standing for a control not on the sheet not said on it. Where it is painted is the browser case's.*
