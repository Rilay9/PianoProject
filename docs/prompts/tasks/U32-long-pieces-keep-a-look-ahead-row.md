# U32 — A long piece keeps its look-ahead row: a piece over 48 bars is no longer held to two sheets, so upright the room it leaves empty below the window carries the next music as a short piece's does; the first window still paints from the two sheets it paints from today, and the rest are made after the first paint, on idle (backlog U32, P1, `backlog-2026-09-25.md`:95, *"fix: sheets by need, not a fixed two"*; Entry 169 at drafting; app only; a P1 the backlog decided, sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first))

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13 (§11 :184–186: a config copy outside `app/` names its storage state by an absolute path).
- **The row and its neighbours.** `docs/prompts/backlog-2026-09-25.md` (the same at HEAD 2da6b8ef): :95, U32, quoted in item 1. The neighbours, none of them this lane's (item 13): :65 U2 and :66 U3 (the greyed row never sizes the window, no wrapped look-ahead; built in T38); :68 U5; :96 U33 (the floor's number); :97 U34 (the help says the next bar is always there); :99 U36 (the shape frozen at Play); :100 U37 (the compact treatment); :105 U42 (the transitional first draw); :138 U77 and :139 U78 (where the look-ahead row fits on a wide stage; what "big enough" is); :636 E30 (the rule stands, `responses/9c9cf86.md`); :729 Q10; :749 Q30 (stability polls in place of `data-settled`); :757 Q38 (the gallery runnable again). `docs/prompts/test-inventory-2026-09-26.md`:787 proposes `score.long-piece-lookahead.spec.ts` for U32 (item 7 says why no new file is planned).
- **The owner's rules.** `docs/04-ui-spec.md` §5: :2252–2289, *What Bars in window means, and the order the three goods are in* (never distort; always look ahead, in every state before and during a run, unless keeping it would break the first; then the count, said in words when it yields); :2291–2295, the layout that follows; :2297–2305, *The next row never sizes the window* (T38). The owner's definition of distortion, quoted in `app/tests/e2e/score.window-rule.spec.ts`:3–9: note spacing wider than engraved, never a uniform scale. `operating-procedure.md`:45–50: *eye over spec* is a tier-1 invariant — what looks best on every size wins over a threshold or a spec sentence.
- **The record.** `docs/pending-review.md` (T38): :14556–14558 (*"A piece over 48 bars has two sheets, so a window filling both has no row for the next bar"*), :14882 (the phone-upright Nocturne cell at four bars: undistorted and small, the bottom half empty), :14933 (the P1 follow-up this row is). U74: :23899 (a piece within the probe's reach loads its probe in `create`; a longer one keeps the idle load) and :23915 (a long piece keeps its pre-measurement first draw, re-planned when the measurement lands on idle). `docs/08-score-render-states.md`: :192–194 (the probe capped at 48 bars, on idle); :403–407 (§4.1 SLOTS, *"a piece longer than the probe's cap keeps two"*); :860–868 (§9.7, *"or when every sheet is in use — a piece past the probe's 48 bars gets two sheets, not four (`WindowRenderer.create`)"*); :1175–1176 (§13: the probe's whole-document load on the Scherzo cost the first window and, during a run, the next bar's arrival, until its document was cut to 48 bars); :1189 (the arrangement once decided by a race). `docs/01-architecture.md` §6, :563–621: the budgets, and the note that the Scherzo's first window waits for the engraver to parse the whole file.
- **The code at HEAD 2da6b8ef,** `app/src/score/WindowRenderer.ts` (last changed with the other files named here at be8802c3):
  - :268–279, `MAX_SLOTS` and its comment; :622, `PROBE_MAX_BARS`; :380, `FREEZE_WAIT_FOR_MEASURE_MS`; :386, `MEASURE_IDLE_TIMEOUT_MS`; :137, `AHEAD_OPACITY`; :140–161, the look-ahead treatments;
  - :971–1048, `create`: :973 the cap, :974–993 the sheets made and loaded, :1010–1018 why a long piece's probe waits for idle, :1032–1041 the probe loaded in `create` within the reach, :1042–1047 the renderer made;
  - :1669–1937, `chooseWindowShape`: :1686–1692 a frozen run keeps its shape, :1696 `mostSlots`, :1713–1728 the unmeasured fallback, :1914–1917 the look-ahead condition, :1937 the shape returned;
  - :2003–2032, `settleShape` and `mayReshape`; :2319–2400, `debugFit` (:2368, `slots` is one entry per sheet made); :2511, `dispose`;
  - :3023–3033, `fitSettled`; :3043–3073, `publishSettled`; :3256–3288, `updateSlotClasses` (:3268–3272, `is-ahead`);
  - :3626–3658, `setRunning`; :3676–3707, `freezeAfterSettle`; :3947–3982, `scheduleMeasure`; :3993–4034, `measurePiece` and `loadProbe`.
- **The screen, read only** (G86a holds `app/src/ui/screens/ScoreScreen.ts`): :4782–4785, the model's own whole-document load before the renderer is made; :4825–4848, `WindowRenderer.create`; :4879–4882, `renderer.showStep(0)`, the first window, after `create` resolves. The other callers of `create`: `app/src/ui/devicePreview.ts`:170, `app/src/ui/screens/DevScoreScreen.ts`:339, `DevExcerptView.ts`:526, `DevMicroscopeScreen.ts`:753.
- **Tests.**
  - `app/tests/e2e/score.window-rule.spec.ts`: :50–56 the five shapes, :63–67 the three pieces (the Nocturne op. 48 no. 1 among them), :70 Bars 1, 2, 4, 8; :144–156 the renderer's shape as the spec reads it (`sheetsAvailable`, :334, is `debugFit().slots.length`); :346–377 `settle` (a stability poll, Q30) and :379–391 `openPiece`; :462 `faultsOf`; :556–620 invariant (c); :584–596 the note this lane turns into a fault; :596–604 the other NOT BUILT note (the same-row look-ahead upright, not this lane's); :622 the per-shape test; :794–834 the mid-run phone-upright Nocturne case.
  - `app/tests/e2e/score.arrange-race.spec.ts`: :64–70 the pieces, the Scherzo as the control; :142–175 the case (a run started as the music appears is arranged as one started after the measurement; `data-slots` compared exactly). Its header, :25–53, still says `fixme` though the case at :142 is live.
  - `app/tests/e2e/perf.spec.ts`: :25 the ×4 throttle; :40–41 the 2-bar first-render budget and its throttled gate; :58–81 the 2-bar window (the dev harness); :151–181 the Scherzo's first window, gated at `60_000` as a regression line (*"What it catches is the first window becoming a function of the whole score's length"*, :176–178).
  - `app/tests/e2e/score.fill.spec.ts`:38–39 (the width floor holds the Scherzo and the Nocturne).
  - `app/tests/unit/windowRendererStage.test.ts`: the engraver stand-in (:35–205; `FakeOsmdView.all` :51, `loads` :66 and :79); the frame and idle queues run by the test (:213–265); `open` (:325); the U74 and U82 describes (:360, :513, :568).
  - The gallery: `app/playwright.states.config.ts` (:45 port 4183, :55 serve only); `app/tests/states/score.states.spec.ts` (:14–20 its four songs; the cells from :133); `app/tests/states/gallery.ts`:9 (`STATES_DIR`, the worktree's `build/states`), :181–183 (one PNG a cell).
  - The corpus: `app/tests/tour/corpus.spec.ts`:41 (the Scherzo), :43–54 (the Nocturne), :100–101 (`CORPUS`, `CORPUS_FACTORS`); `app/playwright.corpus.config.ts`.
- **The map.** `docs/prompts/checks.json`:37, the `app/src/score/**` row (it does not name `perf.spec.ts`); :105, a spec runs itself; :171, the map's own tests. `docs/08-test-map.md`: :77 (timing budgets), :128 (how many systems the stage holds), :129 (the first window at open, U74: *"longer pieces keep the idle re-plan"*), :307 (`perf.spec`), :314 (`arrange-race`), :320–326 (`window-rule`).

## What is decided

1. **The row, verbatim** (`backlog-2026-09-25.md`:95):

   > | U32 | A piece over 48 bars gets two sheets, so upright there is no look-ahead row and half the stage is empty (phone upright Nocturne, seen) | T38 report and picture | P1 | fix: sheets by need, not a fixed two | diagnosed, pending | after B | pending |

   **The owner's order** (`04` §5 :2252–2289): the biggest music without distortion, then the next music visible, then the bars option honoured. Distortion is note spacing wider than engraved, never a uniform scale. What looks best on every size wins over a threshold.

   **The goal, in my words.** A learner who opens a long piece on a phone held upright sees the music that comes next below the bars they are playing, wherever the stage has room for it, exactly as they would on a short piece. The first window arrives no later than it does today. Nothing about a piece of 48 bars or fewer changes.

2. **Premises, checked at the line** (HEAD 2da6b8ef).
   - **The cap.** `create`, :973: `const views = options.model.sourceMeasureCount > PROBE_MAX_BARS ? 2 : MAX_SLOTS;` with :622 `const PROBE_MAX_BARS = 48;` and :279 `const MAX_SLOTS = 4;`. Each sheet is made and loaded in the loop, `await view.load(options.musicXml);` (:990), before `new WindowRenderer(options, buffers)` (:1042). Every sheet made in `create` is a whole-document load that the first window waits for. The reason is written at :274–277: *"a piece longer than the probe's cap keeps two, because loading a 780-bar score four times is seconds a throttled phone does not have."* `git log -S` puts the line in 9474e3a2, the commit that made the slots two to four. The look-ahead row came later (T34), so the cap was written against load time, not against the look-ahead.
   - **Where the cap takes the row.** `chooseWindowShape`, :1696: `const mostSlots = Math.max(1, Math.min(this.buffers.length, arrangement === 'slots' ? MAX_SLOTS : 1));`. The look-ahead row needs one sheet more than the window's systems, :1914–1917: `chosen.toMeasure < pieceBars - 1 && choice.systems + 1 <= choice.maxSlots && …`. The shape is returned at :1937 as `ahead ? choice.systems + 1 : choice.systems`. With two sheets, a window laid over two systems has no third for the next row, whatever room is below it.
   - **What the look-ahead row is.** `updateSlotClasses`, :3268–3272: a drawn slot whose range starts after the window's last bar is `is-ahead`, greyed at `AHEAD_OPACITY` (:137), drawn run-off by default (:140–161).
   - **A long piece's probe and its first draw.** The probe is not loaded in `create` past the reach (:1032, `if (options.model.sourceMeasureCount <= PROBE_MAX_BARS)`). It is loaded on idle from a document cut to 48 bars (`loadProbe`, :4017–4020, `trimMusicXml(this.probeSource, PROBE_MAX_BARS)`). So a long piece's first window is priced unmeasured, :1728: `return { slots: Math.max(1, Math.min(2, mostSlots)), systems: 1, shown: wanted };`. It is then re-planned once the measurement lands. That re-plan is U74's recorded not-done (`pending-review.md`:23915).
   - **The run's freeze.** A frozen run keeps its shape, :1686–1692: `if (this.frozen || (this.freezeHandle !== null && this.currentStep > 0)) { return { slots: Math.max(1, Math.min(this.buffers.length, this.slotCount)), …`. `freezeAfterSettle` (:3676–3707) waits for the measurement up to `FREEZE_WAIT_FOR_MEASURE_MS` (:3689) and asks for it directly. `fitSettled` (:3023–3033) withholds `data-settled` while the probe loads (`!this.probeLoading`) or a measurement is queued.
   - **The screen.** `ScoreScreen.ts`:4782–4785 loads the whole document once more to extract the model, before `create` (:4825). :4882, `renderer.showStep(0)`, draws the first window only after `create` resolves. On a long piece today, the first window waits for three whole-document loads.
   - **The spec's note.** `score.window-rule.spec.ts`:584–596, verbatim: `const sheetsSpent = glass.shape.sheetsAvailable !== null && (glass.shape.slots ?? 0) >= glass.shape.sheetsAvailable; if (roomBelow && sheetsSpent && glass.shape.readAhead === 'slots') {` … `NOT BUILT, no sheet left for the next row: …`. It is a note, not a fault. It fires whenever the sheets are spent, which also covers a short piece using all four of its sheets with room below (the `MAX_SLOTS` cap, not U32's).
   - **The budget test.** `perf.spec.ts` holds the 2-bar first-render budget under ×4 (:40–41, :58–81). For the Scherzo it holds only a regression line, `expect(firstWindowMs).toBeLessThan(60_000)` (:179). No test holds the Nocturne's first window. The map's `app/src/score/**` row (`checks.json`:37) does not name `perf.spec.ts`, so a renderer change does not run it by the map.
   - **The gallery.** Its loops shoot 60 cells (10, 17, 13, 2, 12 and 6 across its six branches), as Q38's first run on the current tree recorded; the "52 cells" in `08` §13 predates the real-phone and long-title cells. Its four songs are 4, 12, 9 and 9 bars (the built catalogue). No gallery cell holds a piece over 48 bars, so for this lane the gallery is the unchanged-piece guard, not the evidence of the fix.
   - **The pieces.** `song.classical.chopin-nocturne-op48-1.nifc` is 81 bars in the built catalogue (`notation.bars`). It is in `window-rule` at all five shapes, in `score.fill`, and in the corpus. The Scherzo (780 bars) is the corpus's other piece past 48 and `arrange-race`'s control. The main checkout's built catalogue lists 366 of its 2,013 rows with a bar count over 48; recount on your own build.

3. **The hypothesis, its mechanism, and the test that would refute it.**
   - **My hypothesis.** The two-sheet cap for long pieces was a first-paint cost guard. Sheets by need keeps the budget and restores the look-ahead row: the first window is laid out first, from the sheets it uses today, and further sheets are made on idle after the first paint.
   - **The mechanism, as read.** Each sheet made in `create` is a whole-document parse on the first window's path (:974–993, :1042, then `ScoreScreen.ts`:4882). The engraver's first window on the Scherzo waits for that parse (`01` §6). A sheet made after the first paint is off that path.
   - **The alternatives.**
     - (A) The cap never bought first-paint time: a second or third load of the same document costs little next to the first. Then lifting the cap in `create` is the whole fix, and idle machinery is complexity for nothing.
     - (B) The idle loads land on or just after the first paint's path (the probe's idle load, the first pre-render, the settled check), so the first window or the first settled picture comes later by what the extra sheets cost.
     - (C) The cost moves into the run. A whole-document load on the main thread while a run is on delays the next bar and the note's colour, as the probe's full load did on the Scherzo (`08` §13 :1176).
   - **The discriminating test, taken before the fix is chosen.** Three builds of your worktree: the base; the cap lifted, with every sheet made in `create`; and sheets by need. Open each several times, each on a fresh page, on the Scherzo and on the Nocturne at 342 × 740 under the ×4 throttle. Measure:
     - the time from navigation to the first engraved bar (`perf.spec`'s measure, :158–172);
     - the time to `data-settled`;
     - the longest main-thread task after the first bar (a `longtask` observer installed before navigation);
     - for a run started as the music appears, whether the first played note's colour waited on a sheet load.

     The hypothesis predicts three things: by need matches the base on the first bar; the eager build is later on the first bar, and more so on the Scherzo; and by need reaches `data-settled` later than the base, by the idle loads. If the eager build's first bar is within the spread of the base's, (A) held: take the simpler fix and say so. If the by-need build's first bar moves with the sheet count, (B) held. If a note's colour waits on a load inside a run, (C) held for that piece (item 4h). Report which held as relationships measured on this machine, never as the phone's figure. The throwaway builds live under `build/u32/`, and none of their edits survive into the diff.

4. **The rule: sheets by need** (decided, subject to item 3; the mechanism under each line is yours, recorded in the entry).
   - (a) **A piece of 48 bars or fewer:** `create` unchanged. Four sheets and the probe are loaded before the renderer exists (U74).
   - (b) **A piece over 48 bars:** `create` makes and loads the two sheets it makes today, and the first window is drawn from them exactly as today.
   - (c) **After the first paint, on idle,** the renderer makes and loads further sheets, one whole-document load per idle callback, up to `MAX_SLOTS`, after the probe's load, because the measurement prices every shape. You decide whether to make all of them or only as many as the priced shape needs, and record the reason. Making them only when needed puts a load on a later stepper press or turn.
   - (d) **The pricing reads the sheets that exist** (`buffers.length`, :1688, :1696), so no shape is chosen that cannot be drawn. A new sheet is wired as the first ones are: `slotRanges`, `updateSlotClasses`, `data-buffer`, the `.score-buffer` class, and hidden until drawn. Nothing in `style.css` changes.
   - (e) **At most one re-plan after the first paint.** A long piece already has one, U74's (`pending-review.md`:23915). The measurement and the new sheets land as that one re-plan. How is yours: the re-plan waits for both, or the sheets load before the measurement is applied. Install a watcher before navigation and count the distinct shapes a learner sees between the first ink and `data-settled` on the Nocturne at 342 × 740, before and after. A second visible re-plan is a deviation, reported with its reason and its frames.
   - (f) **`data-settled` is withheld** while a sheet load is pending or queued (`fitSettled`, :3023–3033), as it is for the probe. So every spec that waits on it reads the settled shape.
   - (g) **A run keeps its arrangement** (:1686–1692; `08` §9.6): no sheet appears in a frozen run. The freeze's existing bounded wait (:3689) also covers pending sheets, so a run started as the music appears is arranged as one started after everything landed (`arrange-race`). The bound is not widened: its reason, better frozen than free to change while played, stands.
   - (h) **No long task inside a run.** Item 3 may show that a sheet load inside a run's freeze window would hold a note's colour past `01` §6's input-to-colour relationship on either piece. If it does, no sheet load starts once a run is on, and the loads resume when the run stops. `arrange-race`'s outcome for that piece is then a Question, with the measurement. It is not forced green.
   - (i) **`dispose`** cancels queued sheet loads and disposes every sheet made. A load that answers after dispose touches nothing.
   - (j) **`debugFit`** reports the sheets: made, loaded and pending. `slots` still has one entry per sheet made, which is what `window-rule`'s `sheetsAvailable` reads (:334).
   - (k) **Every caller of `create`** gets the same behaviour: the Score screen, `devicePreview`, and the three dev screens (the lines under *Read first*). For each, say whether it can open a piece past 48 bars and whether it can dispose before an idle load lands.
   - (l) **The comments** that state the cap are rewritten to say what the code now does: `MAX_SLOTS` (:268–278) and the long piece's probe (:1010–1018).

5. **What a learner meets: the acceptance, by the product.** Take the Nocturne at phone upright, 342 × 740 and 390 × 844, at Bars 1, 2, 4 and 8, at rest and mid-run. In every such cell:
   - the bar after the window is on the glass, as a greyed row below or as the next bars in another system, wherever the renderer's reserve leaves a row's room below;
   - no window row is drawn smaller than the base draws it at the same cell (the look-ahead row never sizes the window, `04` §5 :2297);
   - every bar is at its natural spacing;
   - the count is honoured, or the `⋯` row says why.

   The long pieces' tablet cells change too, and are judged the same way. If any cell of any size looks worse by the three goods, stop and show it. The picture and its measurements decide, not a threshold.

6. **Red first, unit** (a new describe in `windowRendererStage.test.ts`, on its stand-in as it is). The model is over 48 bars, with `FakeOsmdView.bars` long enough to match.
   - **(a) The order.** `create` resolves with two sheets made and loaded for a piece over 48 bars, and with four for a piece of 48 or fewer. This is a guard, green on the base.
   - **(b) The sheets arrive.** After the first window, and after the idle queue and the tasks after it have run, the long piece has the sheets item 4c chose. On a stage with a row's room below a two-system window: `debugFit().slotCount === systemsPerWindow + 1`, and the lowest drawn sheet carries `is-ahead`. Red on the base.
   - **(c) Priced as a short piece.** Take a piece of 48 bars or fewer with the same bar widths on the same stage. Once the long piece's sheets are in, its settled first window has the same `slotCount`, `systemsPerWindow`, `barsShown` and drawn scale as the short piece's. Red on the base.
   - **(d)** `data-settled` is absent while a sheet load is pending, and present once it has landed and the re-plan has run.
   - **(e) A run started before the idle queue runs.** Under item 4g, its frozen arrangement equals that of a run started after settle. Under item 4h, it is the base's arrangement and no sheet is made during the run.
   - **(f) Dispose,** with a sheet load queued and with one in flight: nothing is drawn after, every sheet made is disposed, and nothing throws.
   - **(g) The short piece.** No sheet is made after `create`, and the load count equals the base's. A guard.

   Record which cases are red on the base, with their red lines, and which are guards.

7. **Red first, browser,** on port 4473.
   - **`score.window-rule.spec.ts`, the note becomes a fault.** The branch at :586–595 fails the cell when `sheetsAvailable < MAX_SLOTS`: a sheet the renderer could have made was never made. Class *revise*; the old assumption was *"a piece past the probe's reach is given two sheets by design"*. When a short piece has all four of its sheets in use with room below, the note stays, reworded to name the `MAX_SLOTS` cap. Record whether any cell reaches that note on the base and after. The header's (c) paragraph (:23–25) says the same.
     - First, on the base: `--grep "phone-upright-342|phone-upright-390"`. Record the red lines per Bars value on the Nocturne. A Bars value where the reserve leaves no room is a guard; say so.
     - After the fix, all five shapes pass, the tablets' Nocturne cells included.
   - **The mid-run Nocturne case** (:794–834) also asserts (c), beside (a)'s filter at :832. Record whether it is red or a guard on the base.
   - **`score.arrange-race.spec.ts`:** the Nocturne op. 48 no. 1 joins `PIECES` (:64–70). Class *add*. The Scherzo stays, and the equality holds after.
   - **The settle.** If `window-rule`'s stability poll (:346–377) reads a cell before the idle sheets land, its `settle` also waits for `.score-view[data-settled]`. That is Q30's `window-rule` part, folded in only as far as this file needs it. Q30 stays open.
   - **No new spec file is planned.** The invariant already lives in `window-rule`'s (c), at the two shapes and on the piece, and these cases answer the test inventory's proposed `score.long-piece-lookahead.spec.ts`. If you find a case none of these files can hold and add a spec, the doc rows name the map rows it needs.

8. **Pieces of 48 bars or fewer unchanged: the snapshot.** Use a lane-only probe, kept as `docs/prompts/runs/U32/scripts-slot-snapshot.spec.ts`. Copy it into `app/tests/e2e/` for its run and remove it afterwards. It writes under `test-results/`, and you copy what it wrote into the run folder.
   - **What it records,** at `data-settled`, for every piece of 48 bars or fewer in `window-rule`'s pieces, in the gallery's four songs and in the corpus, at `window-rule`'s five shapes × Bars 1, 2, 4 and 8:
     - from `debugFit()`: `readAhead`, `slotCount`, `systemsPerWindow`, `barsShown`, `zoom` and the sheets made;
     - `data-slots`;
     - the front sheet's transform.
   - **When.** Take it on the base first, before any edit, then after. The diff must be empty. Each difference is a deviation, reported with its cause.
   - **Kept as** `slot-snapshot-before.json`, `slot-snapshot-after.json` and `slot-snapshot-diff.txt`.

9. **The whole grid, judged: the gallery, the long pieces, the corpus.** Green suites are not evidence that the screen is right. Open every PNG and measure ink, not stave lines.
   - **The gallery** (60 cells at drafting, all at 48 bars or fewer), before on the base and after. Run it through a copy of `playwright.states.config.ts` under `build/u32/`, serving on 4473 (serve only; build once before).
     - Open every PNG. Compare every cell's `states.json` record: arrangement, scale, both slots' ranges, bands. The expectation is identical.
     - A cell that changed goes into `docs/prompts/pictures/u32/` with its before, its after and its cause.
     - The before comes from this worktree's base, never from reference pictures written by another tree (stale `-win32.png`).
   - **The long pieces' grid,** through a lane-only picture probe, before and after:
     - the Nocturne at `window-rule`'s five shapes × Bars 1, 2, 4 and 8, at rest after `data-settled` and mid-run (Wait, a few steps past the first crossing);
     - the Scherzo at both phone-upright shapes × Bars 2 and 4, at rest and mid-run.

     For each picture, measured from the glass:
     - the share of the stage's height inked;
     - the window's five-line staff against `MIN_STAFF_PX`;
     - each window bar's spacing against its natural width;
     - whether an `is-ahead` row is on the glass, and which bars it holds;
     - the free height below the ink against the reserve.

     Open every picture. Keep the phone-upright cells, and each tablet cell that changed, in `docs/prompts/pictures/u32/` with a contact sheet (`tools/contact_sheet.py`). The rest's measurements go in the run folder.
   - **The corpus legs of the two long pieces** (`CORPUS=song.classical.chopin-nocturne-op48-1.nifc,song.classical.chopin-scherzo-2.nifc`), through a copy of `playwright.corpus.config.ts` on 4473, before and after. Read their pictures.

10. **The budgets.** Run `perf.spec.ts` whole before and after. The map does not name it, and judgement adds it. It stays green, with the same relationship for the Scherzo's first window and the 2-bar window. Item 3 is the discriminator. **Never assert a number measured on this machine as a fact.** Say which order was slower, and whether the difference exceeds the spread between repeated opens of one order. The phone's figure is unmeasured.

11. **Mutants,** a budget of four, each killed by a named test and recorded:
    - **the cap restored:** `create`'s line back, and nothing made after. Killed by unit (b) and (c), and by `window-rule`'s (c) fault at 342 and 390;
    - **the idle layout skipped:** the sheets never made or never loaded after the first paint. Killed by unit (b);
    - **the look-ahead row dropped:** the sheets arrive, but `ahead` is false for a piece past 48 bars, or the new sheet is left undrawn. Killed by unit (b) and by `window-rule`'s (c) fault;
    - **the order reversed:** every sheet made in `create`. Killed by unit (a).

12. **The tests that encode the old model, revised with the reason (§11).** Search `app/tests` for any assertion that a piece past 48 bars has two sheets: `sheetsAvailable`, `slots.length`, a count of `.score-buffer`, `PROBE_MAX_BARS`, *two sheets*. State the scope, and revise each find with its class and its old assumption. Known at drafting: `window-rule`'s note (*revise*), `window-rule`'s mid-run case (*revise*), `arrange-race`'s pieces (*add*).

13. **Not U32's.** Each is recorded with its line.
    - U36, U37, U5 and U33.
    - U77, U78 and E30: the rule stands.
    - U42's product question beyond the one re-plan.
    - U34: the help's *"You always get the next bar"*.
    - The same-row look-ahead upright (`window-rule`:596–604, not built in T34).
    - `MAX_SLOTS`'s own cap on a short piece.
    - `arrange-race`'s stale `fixme` header (:25–53; the case at :142 is live): P3, recorded.
    - Loading a long piece's probe before the first paint (U74's follow-up).
    - A document cut for each sheet: an architecture choice, a Question if item 3 calls for it.

    **Files not to touch:** `ScoreScreen.ts` (G86a's), `OsmdView.ts`, `trimMusicXml.ts`, `autoFit.ts`, `style.css`, `help.ts`, `app/tests/states/**` (compared, not edited), `perf.spec.ts` (run, not edited), `tools/**` and `content/**`. `slots.ts` only if its plan cannot take a slot count that grows after `create`; say why if so.

14. **When to deviate.**
    - If item 3 finds (A), lift the cap in `create`, drop the idle machinery, and record why.
    - If it finds (B) or (C) and no order keeps both the first window and the run's input path, stop at the measurement and report it. That is the reviewer's architecture choice.
    - If a premise here is wrong at the line, say so at the item and take the better path, with the reason.

## Verification layers

**Unit.**
- Red first (item 6): on the base, then green.
- Then `npx vitest run tests/unit/windowRendererStage.test.ts tests/unit/slots.test.ts tests/unit/slotsFromEvidence.test.ts`.
- Then the whole `npx vitest run`. The two `lessonClaimsAboutApp` line-ending claims fail on a CRLF checkout and pass on the runner (Entry 101); name them if they are the only red.

**The rest of the chain.** `npx tsc -b`; `npm run lint`; `npm run build:app`; the gallery (item 9) through its config copy.

**The map.** Run `python tools/docs/checks_for_paths.py app/src/score/WindowRenderer.ts app/tests/unit/windowRendererStage.test.ts app/tests/e2e/score.window-rule.spec.ts app/tests/e2e/score.arrange-race.spec.ts docs/08-score-render-states.md docs/08-test-map.md docs/prompts/checks.json` over the final set and record what it prints.
- At drafting, without `checks.json`, it named tsc, lint, the whole unit suite, the app build, the state gallery, and these specs: `dark-ink`, `engine`, `excerpts`, `microscope`, `modes-engraving`, `score-fit-paths`, `score.arrange-race`, `score.countin`, `score.density`, `score.fill`, `score.fuzz`, `score.head-height`, `score.hearIt`, `score.hearbar`, `score.latch`, `score.layout`, `score.pickup-numbers`, `score.readahead`, `score.renderer.fuzz`, `score.rotate`, `score.screen`, `score.slide`, `score.slots`, `score.spec`, `score.states`, `score.window-rule`, `today`.
- `checks.json` adds its own tests (`test_checks_for_paths.py`, `test_ci_order.py`).
- Add `perf.spec.ts` by judgement.

**Browser.**
- The new cases first, alone, on the base (red), then after.
- Then every spec the map printed, plus `perf.spec.ts`. Check that each file exists before the run: a path that resolves to no file is dropped silently.
- Run at two workers on port 4473, through a copy of `app/playwright.config.ts` under `build/u32/`, not for the commit:
  - `testDir` absolute;
  - the webServer's cwd `app/`, serving the app built once before the run (never rebuilt while a run is on);
  - baseURL and webServer on 4473;
  - `use.storageState` as an absolute path to `build/u32/storageState-4473.json`, the fixture re-keyed to `http://localhost:4473`.
- Then the gallery and the corpus legs, through their own copies on the same port. One Playwright at a time, and never port 4173.

**The product layer.** The pictures of item 9. Nothing is heard. What a phone does is *unverified on a device*.

## Rules and files

**You own:**
- `WindowRenderer.ts` at:
  - `create`'s sheet count, and the idle making and loading of further sheets;
  - `fitSettled`;
  - the freeze's wait, as far as item 4g needs;
  - `dispose`;
  - `debugFit`'s sheet fields;
  - the `MAX_SLOTS` and probe comments;
  - `chooseWindowShape` only where it must read the sheets that exist;
- the new describe in `windowRendererStage.test.ts`;
- in `score.window-rule.spec.ts`: the note at :584–596, the header's (c), the mid-run case, and `settle` if item 7 needs it;
- `score.arrange-race.spec.ts`'s pieces;
- the lane-only probes and pictures, under `docs/prompts/runs/U32/` and `docs/prompts/pictures/u32/`;
- the doc rows, as direct edits, each listed in `## Doc rows`:
  - `docs/08-score-render-states.md`:403–404 (§4.1) and :866–868 (§9.7), and :192–194 only if the probe's timing sentence changes;
  - `docs/08-test-map.md`: :128, :129 (*"longer pieces keep the idle re-plan"*), :314 (`arrange-race`) and :320–326 (`window-rule`);
  - `docs/04-ui-spec.md`: :1868 only if the long piece's first-draw sentence changes. Read rule 2 (:2273–2275) to confirm it now holds on long pieces; no edit is expected;
  - `docs/prompts/checks.json`:37: `tests/e2e/perf.spec.ts` added to the `app/src/score/**` row. The reason: the first window's regression line is the renderer's. It is a test-map change, flagged in the entry for the reviewer before the push. If a new spec appears, it joins the same row and `docs/08-test-map.md`'s file list; `checks.json`:105 already runs it by itself.

**Not yours:** the files item 13 names.

**Base.** Origin's head at dispatch, stated in the entry. At drafting both HEAD and origin's head were 2da6b8ef. Take every before measurement on your worktree before the first edit: it is the base. No second worktree, no checkout.

**Fresh-worktree setup,** as U102's:
- `npm ci` in `app/`;
- `python tools/midi-cleanup/tests/parity_reference.py`;
- `python tools/content/build.py --offline` (Q24), with the caches it needs copied read-only from `C:\Users\yalir\repos\Piano Stuff\PianoProject`. If it cannot produce `app/public/content`, copy that folder from the main checkout and say so;
- snapshot `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md`, `content/scores/imported/SOURCES.md` and `docs/generated/ladder.md` before the content build, and restore them after. `git status` shows none of them.

**The rules.**
- Never name an AI model. Never assert a number measured on this machine.
- You work in your own worktree, which the orchestrator cut. You never commit, push, stash, reset or check out, and never write in the main checkout.
- One Playwright at a time. Port 4173 belongs to the main checkout, so every browser run of this lane goes through its own config copy on port 4473, with an absolute `use.storageState` path (a copy outside `app/` resolves a relative one against `app/`).
- Temp state goes under the worktree's own gitignored `build/`.
- A committed spec never writes under `docs/`. Lane-only probes write under `test-results/` or `build/`, and you copy what is kept.
- No learner-facing *waiting for review* text, anywhere.
- The disk is nearly full.
  - When the run is over, and after the pictures are copied out, delete the worktree's `app/node_modules`, `app/dist`, `app/test-results`, `build/states`, `build/corpus`, the copied caches (a copied `app/public/content` among them) and the config copies.
  - Keep no log over 300 KB in the run folder: keep the summary and the failing names, and say the full log was not kept.
- Every item done, or an explicit not-done line with its reason.

## Report

**Judgement first:**
- What a learner opening the Nocturne upright now meets, at 342 × 740 and 390 × 844, before and after. Pictures, with the staff against the floor and whether the next music is on the glass. *Unverified on a device* goes in the first lines.
- Which of item 3's outcomes held. What the first window and the first settled picture now cost relative to the base, as relationships.
- The re-plans a learner sees after the first paint, before and after.
- The snapshot of the pieces of 48 bars or fewer: empty or not. The gallery: all 60 opened, and which cells changed.

**Then** Done / Not done / Follow-ups / Questions / Files. Every item gets done or not-done, with where its evidence is.
- **Follow-ups:** the `arrange-race` header, U34's sentence, and whatever the pictures show on the tablet cells.
- **Questions:** item 4h's outcome if it applies, and item 14's architecture choice if it is reached.

**After those:**
- what a learner now meets differently, in a line per size;
- the counts: cells red on the base, cells changed, cells unchanged, mutants killed;
- each deviation with its reason;
- per fix: the mechanism, the discriminating test and its red line;
- the tests table, with each test's class (add, revise, preserve) and the old assumption;
- exit codes;
- what the map named that was not run as the map writes it: the port, the workers, the config copies, the gallery's port;
- what is unverified, beside what passes;
- `## Doc rows`.

State the technical and pedagogical verdicts separately.
- **The pedagogical verdict** is a reading judgement: whether a greyed next row in the formerly empty half helps a learner read ahead at each size. Give it as observations against the three goods.
- **Nothing in this lane is heard.** Where a claim would need an ear, the report says *unverified as music*, in those words.

`operating-procedure.md` §11 and §12 apply.

**Entry 169** (the next free number at drafting; the orchestrator confirms it at dispatch). Every run file goes under `docs/prompts/runs/U32/`. The entry is `docs/prompts/runs/U32/ENTRY.md`, starting `### Entry 169 — U32`.

## Reviewer's approval and conditions (`responses/questions-71bd6cee.md`)

Approved for dispatch 2026-09-30 with three conditions. The reviewer's words below govern wherever the brief's earlier text differs: the run freeze is preserved and `04` is updated to say so; `perf.spec.ts` joins the `app/src/score/**` row as the smallest mapping; the race test stays a guard; the acceptance order is no distortion, then the frozen run, then look-ahead, then the bar count.

## U32 — long pieces keep a look-ahead row

**APPROVE FOR DISPATCH, with three conditions.**

The architectural direction is correct: the fixed two-sheet cap on long scores was a first-paint performance guard, not a pedagogical reason to suppress look-ahead. Create only the sheets required for first paint, then make additional sheets on idle so a long piece can gain the same next-music row as a short piece without delaying initial display.

### 1. Preserve the run freeze

A run that starts before the idle-created look-ahead sheet exists should **keep the arrangement it started with**. Do not reshape the notation under the learner mid-run merely because another sheet finishes loading.

This is the better product boundary even though the old wording in `04` says look-ahead is present in every state. Update that documentation to distinguish:

- before the run: add look-ahead when it becomes available;
- once the run starts: preserve the frozen arrangement until the next run/window lifecycle.

Do not widen `FREEZE_WAIT_FOR_MEASURE_MS` merely to wait for long-score idle work. If a long score routinely cannot acquire the look-ahead sheet before normal run start, report the measured product trade rather than turning Play into a load barrier.

### 2. Add `perf.spec.ts` to the score-path checks map

**Approved.**

A renderer change that can add whole-document score loads directly affects the first-window performance contract. The existing `perf.spec.ts` is therefore a real consumer of `app/src/score/**`, not optional extra coverage.

Add the smallest specific mapping needed. Do not map the entire browser suite merely because this seam is performance-sensitive.

### 3. Race test remains a guard, not an oracle

Keep the immediate-vs-patient run comparison. If the new idle sheet would alter a frozen run, the correct answer is to suppress that in-run load/layout change, not force the race test green by loosening slot equality.

If avoiding an in-run sheet load is necessary to preserve the input-to-colour or rendering-latency relationship, that is correct. Record the deferred look-ahead as the trade for that run.

### Acceptance priority

Use the existing product order:

1. no distortion;
2. preserve stable/frozen play once begun;
3. show look-ahead whenever the stage and lifecycle permit it;
4. honour the requested bars count after those constraints.

U32 may dispatch.

**Landed 2026-09-29** (Entry 169; 2f67b047, merged 57d01fa5); handoff `handoffs/2f67b047.md`.
