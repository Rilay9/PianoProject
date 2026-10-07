### Entry 169 — U32: a long piece keeps its look-ahead row

Built on base `a7c232c7` (origin's head at dispatch) in the worktree `agent-ae90e835312da8da3`, under `docs/prompts/tasks/U32-long-pieces-keep-a-look-ahead-row.md` and the reviewer's approval and conditions at its foot (`responses/questions-71bd6cee.md`), which govern where the brief's earlier text differs. Every browser run went through config copies under `app/build/u32/` on port **4473**, each serving a build folder kept for it (the base, the throwaway variants, the final; never rebuilt under a run), the storage state by absolute path, re-keyed to 4473. Captures are in `docs/prompts/runs/U32/`; kept pictures in `docs/prompts/pictures/u32/`. Nothing committed, staged, stashed, reset or checked out.

**Unverified on a device.** Every figure below is this machine's, this run's, under Chrome's ×4 throttle where said; the phone's figure is unmeasured. **Nothing here is heard**: no note, sound or timing of music changed; the pedagogical verdict is a reading judgement, *unverified as music* where it would need an ear.

Setup, as U102's: `npm ci`; `python tools/midi-cleanup/tests/parity_reference.py` (exit 0; two references skipped, not fetched); the caches copied read-only from the main checkout, then `python tools/content/build.py --offline` (exit 0, 2,092 items, validation OK; the four generated docs snapshotted and restored, `git status` shows none) (`setup-*.txt`). This build lists 366 of 2,013 rows with a bar count over 48.

## Judgement

- **What a learner opening the Nocturne upright now meets** (`docs/prompts/pictures/u32/`, each picture a before | after pair with the glass measurements under it):
  - **Bars 4, at rest, 342 × 740 and 390 × 844** (`nocturne__phone-upright-342__bars-4__rest.png`, `…-390__bars-4__rest.png`): the window is unchanged — bars 1–4 on two rows, the same staff (25.1 px and 28.8 px) — and **bars 5–6 are now greyed below it**, where the base left 223 px and 288 px empty. The ink spans 84 % and 79 % of the stage's height, against 54 % and 51 %. This is the row U32 is for.
  - **Bars 1 and 2**: unchanged at rest at both shapes (the window's reserve leaves no row's room: window-rule's own note, base and after); mid-run at 342 Bars 1 the after's run drew bar 2 with bar 3 greyed below, where the base's run stayed on one slot (its shot is at bar 49, where the walk found no crossing). One cell reads worse and is shown: **390 × 844, Bars 1, at rest** (`…-390__bars-1__rest.png`): the base's pictures show bar 2 greyed below bar 1; after, bar 1 alone with the lower half empty. The rule's answer for that cell is "no room" (330 px below < a 373 px reserved row, window-rule's note on the base and after), and the base reaches it too everywhere else it was opened — window-rule's base run and four debug opens (`cell-390-bars1-*.txt`); only the pictures probe's flow caught the base keeping its unmeasured first draw's greyed row, twice. So the base's row there was a race, and the after gives the rule's answer every time; the rule prices the next row at the window's reserve, not at the rows drawn, and refuses a bar that would fit on the glass — that is U78's question, not U32's.
  - **Bars 8** (`…-342__bars-8__rest.png`, `…-390__bars-8__*.png`): **a long piece is now priced as a short piece is**, and that shows here: 6 of the 8 asked bars on three rows at 23.7 px (342) and 27.2 px (390), where the base drew 4 of 8 on two rows at 25.1 px and 28.8 px with the lower third empty; mid-run at 390 all 8 on four rows at 26.7 px. More of the asked count, above the floor, at a window about a twentieth smaller; no greyed row at rest in either. By the owner's order (biggest undistorted music first) this cell reads worse by a little, by the reviewer's (no distortion, the frozen run, the look-ahead, the count) it is no worse; it is shown, not fixed: the chooser's rule 4 (the count yields only to the floor) is T34's and holds for every short piece, and capping a long piece below it would contradict unit (c). A Question.
  - **Mid-run** (Wait, three steps past the first crossing): both builds show the next music (the base in the slot the cursor left); after, where the sheets allow it, more of it — two greyed rows on the Scherzo at Bars 4 (`scherzo__phone-upright-342__bars-4__midrun.png`).
  - **The Scherzo at rest** is unchanged at every cell probed (the reserve leaves no row's room at Bars 4 either); **the tablet upright at Bars 8** now draws the same 8 bars on three rows at 38.3 px instead of two at 29.3 px (`nocturne__tablet-upright__bars-8__rest.png`), larger. Every other tablet and sideways cell measured the same before and after.
- **Item 3**: (A) did not hold (a sheet made in `create` costs first-window time, more on the Scherzo); by need matches the base on the first bar; it settles later by the idle loads (clearly on the Nocturne, inside the spread on the Scherzo); (C) held for loads inside a run, so **4h**: no sheet load starts once a run is on. See *Item 3*.
- **Re-plans after the first paint**: one, as on the base, plus one re-engraving of the first picture at the same drawn size when the stage's own late height change lands during the loads (`replan-summary.txt`).
- **The pieces of 48 bars or fewer**: the slot snapshot's 240 cells are identical before and after (and identical between two base runs). **The gallery**: 60 cells opened (the after run's five contact sheets; each changed cell by itself); every record identical outside cells that also differ between two runs of the base itself (6 do), and one after run showed `end-of-piece--grand-staff` with overlapping systems (1 of 2 after runs, 0 of 2 base runs; the renderer's code paths for such pieces are unchanged by reading, and the snapshot is empty) — shown (`gallery-end-of-piece--grand-staff--*.png`) and recorded as a pre-existing race.
- **One cost found by the pictures probe**: pressing Play on a long piece takes longer after (`play-press-debug.txt`): about 2.8× on the Nocturne at 342 Bars 4 (a second long task after the press; the window now has three slots), about 1.4× on the Scherzo at 390 Bars 2, where the window has two slots in both builds and the two later sheets are unused — with them not made, the press returned to the base's. The heap once settled is larger by two whole-document engravers (Nocturne 123 → 167 MB, Scherzo 286 → 410 MB, Chromium's coarse figure). A Question.
- **Technical verdict**: the rule is built and guarded (unit, window-rule at five shapes, arrange-race, the snapshot, perf.spec green, four mutants killed); the Play-press and memory cost is measured and open. **Pedagogical verdict**: at the cells where the stage has room, a greyed next row in the formerly empty half lets a reader's eye run on past the window's last bar without waiting for the turn — the look-ahead the three goods ask for, at no cost to the window's size; at Bars 8 the learner is shown more of what they asked for at a slightly smaller size; *unverified as music*, and unverified on a phone.

## Item 3: the discriminator

Three builds, each kept as a folder: the base; the cap lifted (every sheet in `create`; a throwaway edit restored byte for byte); sheets by need (the final's behaviour). Fresh page each open, 342 × 740, ×4 throttle, one worker. The machine's load drifted between passes (the base's first bar read about half as long in one pass as in the one before), so the decisive pass is the **interleaved** one: three rounds, each round base, cap lifted, by need, both pieces (`timing4-summary.txt`; passes 1–2 in `timing-passes-1-2-summary.txt`).

- **First bar**, from the first sheet `create` makes to the first engraved bar (the renderer's part, without the fetch and the model's own load): Nocturne base 3.5 / 7.4 / 3.3 s, by need 4.4 / 4.7 / 3.5 s, cap lifted 7.9 / 8.9 / 7.0 s; Scherzo base 7.1 / 9.3 / 5.9 s, by need 7.7 / 5.9 / 5.5 s, cap lifted 15.9 / 15.5 / 11.1 s. The cap lifted is later in every round, by about two sheet loads, more on the Scherzo; by need is inside the base's spread in every round.
- **Settled**, after the first bar: Nocturne base +7.1 / +8.9 / +6.5 s, by need +13.3 / +11.4 / +10.7 s; Scherzo base +20.7 / +21.4 / +11.9 s, by need +21.1 / +15.7 / +15.4 s. (B) on the settled picture: the Nocturne's is later by about the two idle loads; the Scherzo's difference is inside its own spread.
- **Longest task after the first bar**: by need no longer than the base's longest (there are two more of them, one sheet load each: about 1.5–4.6 s on the Nocturne, 2.5–6.9 s on the Scherzo, across the passes). A tap on Play in that time is held until the load ends (seen: 2.4 s).
- **(C), a run started as the music appears.** The harness's own tap could not race the loads (it lands only when the page is free, which was after them), so Play was tapped from inside the page at the first ink and the first notes played 300 ms or 2,000 ms later by the page's clock (one round; base, by need with the freeze waiting for the sheets and loading them itself — the brief's 4g — and by need with no load in a run, 4h, the final):
  - the first notes' wait, at 2,000 ms: base 2.4 s (Nocturne) / 3.5 s (Scherzo), **4g 4.5 / 4.6 s**, 4h 2.8 / 2.7 s; at 300 ms: base 4.7 / 5.7 s, 4g 2.7 / 7.0 s, 4h 4.7 / 6.1 s (4g's Nocturne tap was itself held 2.4 s by an idle load, so its note came late into the window);
  - sheets made inside the run: 4g in all four taps, 4h in none;
  - the freeze taken blind (the measurement not in within its bound): base 1 of 4, **4g 3 of 4**, 4h 0 of 4.
  - So a sheet load in a run's freeze window is a long task a key waits behind, and it crowds out the measurement the freeze waits for: **4h**. Unchanged from the base and not U32's: the first notes of a run started at the first ink already wait seconds at ×4 for the base's own work after the first paint (follow-up 4).

## The rule as built (item 4)

- (a) 48 bars or fewer: `create` unchanged (four sheets and the probe). (b) Over 48: `create` makes and loads `FIRST_PAINT_SHEETS` (2), the first window drawn from them as before.
- (c) After the first window, on idle, one whole-document load a callback (`scheduleSheet` → `loadNextSheet` → `sheetLanded`), **every sheet up to `MAX_SLOTS`**, **before** the probe: a stepper press or a turn never waits on a load and a second re-plan, and a long piece ends with what a short one starts with (the brief's "after the probe" rested on pricing only the need; see the Questions for the cost this choice carries).
- (d) The pricing reads `buffers.length` (unchanged); a sheet joins `buffers` only after its load. A new sheet is wired as `create` wires one: its wrapper inserted before the probe's, `.score-buffer`, `data-buffer`, hidden until drawn, its `slotRanges` entry, `updateSlotClasses`, the current zoom. No stylesheet change.
- (e) The idle measurement waits for the sheets (`scheduleMeasure` returns while one is queued or loading): the sheets and the measurement land as the one re-plan.
- (f) `fitSettled` withholds `data-settled` while a sheet is queued or loading; sheets deferred during a run are not fit work (the run's shape cannot change), so a frozen run is settled with sheets owed.
- (g)/(h) **4h**: `scheduleSheet` returns while a run is on, and an idle callback that fires into a run does nothing; the freeze's attempt is byte-for-byte the base's (a comment added); the loads resume at `setRunning(false)`. A run started before they land keeps its two sheets — the reviewer's condition 1.
- (i) `dispose` cancels a queued sheet and disposes an in-flight one; its landing checks `disposed`. A stale idle callback is ignored by handle identity.
- (j) `debugFit().sheets = { made, loaded, pending }`; `slots` has one entry per loaded sheet.
- (k) Callers, all through `create`: the Score screen (any piece; disposes on leaving); `devicePreview` (always Hot Cross Buns, never long; disposes on redraw); `DevScoreScreen` (a file picker, so a long piece; disposes on reload and leaving); `DevExcerptView` (the excerpt's parent, can be long; disposes); `DevMicroscopeScreen` (any catalogue item; disposes).
- (l) Comments rewritten: `MAX_SLOTS`, the new `FIRST_PAINT_SHEETS`, the long piece's probe in `create`, the freeze's attempt, each new method.
- Not in the brief, each with its reason: `scheduleSheet` does nothing before the first `showStep` (the Score screen calls `setRunning(false)` on every render, possibly before the first window); `osmd.sheet.load` recorded in the render timings, as `osmd.probe.trim` is, so Diagnostics on a phone shows what a sheet costs there.

## The re-plans after the first paint (item 4e)

Every frame from the first ink to a second after `data-settled`, the Nocturne at 342 × 740, Bars 4, ×4 (`replan-summary.txt`). Base (two opens alike): the first ink (bars 1–4 on one row, 5–8 greyed, drawn size 0.355), the engraving search re-engraving it at the same drawn size, then the measurement's re-plan (two rows, 1–2 and 3–4, at 0.628). Final (two opens alike): the same first ink and search; the stage's own late 55 px height change lands **during the loads**, so the search runs once more for the shorter stage (zoom 1.23, the same drawn size, the same rows); then the one re-plan: 1–2 and 3–4 at 0.628 — the base's drawn size — **and 5–6 greyed below**. One re-plan, as on the base; one more same-size re-engraving, recorded with its frames. At the default Bars 2 the interleaved pass counted 2 pictures (one re-plan) in every by-need open.

## Done

1. **Row and goal** (item 1): held.
2. **Premises** (item 2) at `a7c232c7` (the brief's lines were at `2da6b8ef`; the code as described): the cap, `MAX_SLOTS` 4, `PROBE_MAX_BARS` 48, `git log -S` → `9474e3a2`; the pricing's `buffers.length`; the look-ahead condition; the unmeasured first draw; the freeze; the screen's three whole-document loads before a long piece's first window; the spec's note; `perf.spec` absent from the score row. All held.
3. **Discriminator** (item 3): run; above.
4. **Rule** (item 4 a–l): above.
5. **Acceptance** (item 5): the pictures and `pictures-table.txt` (48 pictures, measured from the glass): the next row gained at rest in the two Bars-4 phone cells and mid-run where the sheets allow; no window drawn smaller than the base except the Bars-8 cells (shown); every bar at natural spacing (×1 everywhere); the count honoured or said (window-rule (d) green at five shapes).
6. **Red first, unit** (item 6): the new describe (a)–(g). On the base (`red-unit-base.txt`): (b) `expected 2 to be 4`; (c) `{ slotCount: 2 … }` against `{ slotCount: 3 … }`; (d) and (f) no sheet load asked for; (e) `debugFit().sheets` undefined (the frozen arrangement itself matches); (a) and (g) green, guards. After: 21 of 21 (`unit-stage-after.txt`).
7. **Red first, browser** (item 7), on the base with the final specs (`red-e2e-base.txt`): window-rule 342 and 390 red at the Nocturne's Bars 4 and 8 — "(c) no sheet made for the next row: 2 of 2 in use … 223 px free below" and "… 288 px"; Bars 1 and 2 guards ("no room ahead"); the mid-run case red ("… 361 px free below"); arrange-race green (a guard: 2 systems both ways). After: all four green (`e2e-new-cases-after.txt`); window-rule's eleven tests green at all five shapes (`window-rule-after-notes.txt`). No cell reached the reworded `MAX_SLOTS` note, on the base (the two shapes run) or after (all five). No new spec file.
8. **Snapshot** (item 8): `slot-snapshot-before.json`, `slot-snapshot-after.json`, `slot-snapshot-diff.txt`: 240 cells (12 pieces of 48 bars or fewer × 5 shapes × Bars 1, 2, 4, 8), **0 differences**; base against a second base run, 0 (`slot-snapshot-base-repeat-diff.txt`).
9. **Grid** (item 9): the gallery before (two runs) and after (two runs), records compared (`gallery-*.txt`); the long pieces' 48 pictures before and after (`pictures-table.txt`, pairs in `docs/prompts/pictures/u32/` for the phone-upright cells and the changed tablet cells, with three contact sheets); the corpus legs of both long pieces before and after: 10 of 12 green both times, the same two tablet-landscape legs red both times ("bar 2 is not on the screen after ~1 s", `corpus-*.txt`) — unchanged by U32.
10. **Budgets** (item 10): perf.spec green before and after (`perf-before.txt`, `perf-after.txt`), and interleaved base/final twice (`perf-interleaved.txt`): the Scherzo's first window base 29.8 / 21.3 s, final 22.5 / 26.7 s — inside each other's spread; the 2-bar window's median no slower after. (The single after run an hour later read slower on every case, the two screens that never touch the renderer included: the machine.)
11. **Mutants** (item 11): four, each killed.

| Mutant | Edit | Killed by (unit) | Killed by (browser) |
| --- | --- | --- | --- |
| 1, the cap restored | `sheetsOwed()` returns 0 | (b), (c), (d), (e), (f) | window-rule (c) at 342 and 390, Nocturne Bars 4 and 8 (`mutant-1-window-rule.txt`) |
| 2, the idle layout skipped | the idle callback never loads | U74's *a longer piece … keeps the idle load*, (b)–(f) | — |
| 3, the look-ahead dropped | `ahead` false past 48 bars | (b), (c), (d), (e) | window-rule (c) "nothing ahead with room for it" at 342 and 390, Bars 4 (`mutant-3-window-rule.txt`) |
| 4, the order reversed | every sheet in `create` | (a), (b), (d), (e), (f) | — |

12. **Tests encoding the old model** (item 12), scope `app/tests/**`, grep for `sheetsAvailable`, `slots.length`, `PROBE_MAX_BARS`, *two sheets*, *48 bars*, *probe's reach*, `.score-buffer` counts, `toHaveCount(2)`, and slots/slot counts/buffers compared to 2: window-rule's note (*revise*: "a piece past the probe's reach is given two sheets by design"), the mid-run case (*revise*: only (a) mid-run), `arrange-race`'s pieces (*add*); window-rule's `settle` also waits for `data-settled` (*revise*: three still polls meant settled); `fixtures/devScore.ts`:193 names the 48 bars in a true comment. Everything else *preserve*.
13. **Not U32's** (item 13): U36, U37, U5, U33; U77, U78, E30 (the rule stands); U42 beyond the one re-plan; U34's sentence; the same-row look-ahead; `MAX_SLOTS`'s own cap; `arrange-race`'s stale header; loading a long piece's probe before the first paint; a document cut per sheet (a Question). None touched.
14. **Deviations** (item 14): below.

## Not done

- Nothing decided is left undone. Not run: the second round of item 3's taps (stopped after the first round, which was decisive); a pictures run of the throwaway 4g build (only its timing was taken).

## Deviations, each with its reason

1. The sheets load **before** the probe (item 4c said after): every sheet is made, so nothing needs pricing first; 4e allows it; `arrange-race`'s patient wait (`data-measured`) then means everything landed.
2. **4h, not 4g**, on the taps (item 4h provides for it; the reviewer's condition 1 reads the same way).
3. window-rule's `settle` waits, bounded, for `data-settled` (item 7 allows it): added on the mechanism (the shape holds still through the idle loads), not on an observed early read.
4. The timing probe tapped from inside the page (the harness could not race the loads); the interleaved pass stopped after its first round of taps.
5. The pictures probe clicks Play once, waited for: `pressControl`'s retry after 1.5 s landed as a second tap on the after build and paused five mid-run shots at bar 1 (the Play-press cost above); both before and after were re-shot with the single click, and those are the pictures kept. Its mid-run walk counts a crossing as a change of the cursor's sheet, so on single-slot shapes it ran to its bound at bar 49, alike before and after (follow-up 3).
6. perf.spec before and after at one worker (and within the map's two-worker run after), so its throttled budgets did not share the machine with a second browser.

## Follow-ups (recorded, not fixed)

1. P3: `arrange-race`'s stale `fixme` header (:25–53).
2. P2: U34, the help's "You always get the next bar": false for a run started before a long piece's later sheets land (4h's trade), as for the one-system case.
3. P1 (the base, unchanged): a bar past the probe's 48 bars shrinks a frozen run: Bars 1 mid-run the Nocturne's dense bar 49 at a 14.8 px staff at 342 × 740 (the floor is 22) and 33.9 px on the tablet upright (122 px at rest), both builds (`nocturne__phone-upright-342__bars-1__midrun` before).
4. P1 (the base, unchanged): the first notes of a run started at the first ink wait seconds at ×4 behind the base's own post-paint work; the Scherzo's freeze taken blind once in the base's taps. `arrange-race` asks the blind question unthrottled.
5. P2: the gallery's `end-of-piece--grand-staff` drew overlapping systems in one run (1 of 4 runs), and no §9 check flagged it.
6. P2: the next row priced at the window's reserve refuses a bar that fits on the glass (390 × 844, Bars 1): U78's question.

## Questions for the reviewer

1. **Sheets by need, literally?** Making every sheet up to `MAX_SLOTS` costs two whole-document engravers where the shape uses two: the Scherzo's Play press at 390 Bars 2 took about 1.4× the base's (its second long task about doubled), and returned to the base's with them not made; heap +124 MB (Scherzo), +44 MB (Nocturne), coarse. The alternative the brief named — only as many as the priced shape needs — needs a side-effect-free pricing with more sheets than exist (the chooser's pricing is interleaved with its effects), and puts a load and a second re-plan on a later stepper press or turn. Take it as a lane?
2. **Bars 8**: accept that a long piece now gets a short piece's answer (more of the count above the floor, a window about a twentieth smaller), or should the chooser prefer the look-ahead over the count for every piece (04 rule 2/3 read literally), which would change short pieces too?
3. **The 4h trade**: a run started before the later sheets land (on this machine at ×4, up to ~13 s after the Nocturne's first bar, ~21 s after the Scherzo's) plays without the greyed row; the next run has it. Accept?
4. **`arrange-race` at the default two bars** holds the Nocturne to two systems both ways, so it guards the race, not the look-ahead; pin Bars 4 and assert the 4h difference as the trade, or keep it a guard?
5. A document cut for each sheet (item 13): worth a lane for time and memory together?

## Tests and exit codes

- `npx vitest run tests/unit/windowRendererStage.test.ts`: 21 passed. Whole `npx vitest run`: 7,337 passed, 3 failed — the two `lessonClaimsAboutApp` line-ending claims (blues.3, 4.7; Entry 101), and `expectedNote.test.ts` timed out at 5 s under load and passed alone (`vitest-all-summary.txt`, `vitest-alone-expectedNote.txt`).
- `npx tsc -b --noEmit`: exit 0. `npm run lint`: exit 0 (after the lane's build copies under `app/build/` were removed; with them present it linted their bundles). `npm run build:app`: exit 0.
- `test_checks_for_paths.py`: 28 OK; `test_ci_order.py`: 11 OK (with the lane's probes out of `tests/e2e/`; with them in, two failed on the probes' imports, as expected).
- Browser: the map's 28 specs plus `score.strip-span.spec.ts` (the one other spec that opens both long pieces) at two workers on the final build: 233 passed, 1 skipped, 15 failed — all 15 "A snapshot doesn't exist … -win32.png, writing actual" (the gitignored local references a fresh worktree lacks). Those 15 were then run on the base (writing references) and on the final: 15 passed (`screenshots-*.txt`). `e2e-map-after.txt`.

## Not run as the map writes it

Port 4473 through config copies (not 4173), two workers (not four), `vite preview` serving a kept build folder (not `npm run build:app && npm run preview`), the storage state re-keyed to 4473 by absolute path; the gallery on 4473 through its copy (not 4183), serving only; perf.spec also at one worker; `score.strip-span.spec.ts` added by judgement; the gallery run four times.

## Doc rows

- `docs/08-score-render-states.md` §3.2 (the probe's timing: after the later sheets), §4.1 (the slot count: two first, the rest after the first window, none during a run), §9.7 (invariant 7).
- `docs/08-test-map.md`: the systems row, the first-window row, `score.arrange-race`, `score.window-rule` (the (c) fault, the mid-run (c), the `settle`).
- `docs/04-ui-spec.md`: rule 2 (the reviewer's condition 1: before a run the look-ahead is added when the renderer can draw it; once a run starts its arrangement is kept), and the first-draw sentence (the long piece's measurement after its later sheets).
- `docs/prompts/checks.json`:37: `tests/e2e/perf.spec.ts` added to `app/src/score/**`, its reason extended — a test-map change, for the reviewer before the push.
