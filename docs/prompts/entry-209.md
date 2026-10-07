### Entry 209 — U122a — the bar's one-row premise, measured: the landscape Score chrome

Lane U122a, a design addendum to U122 (no app source, style or committed test changed). Brief: `docs/prompts/tasks/U122a-the-bar-premise-measured.md`, read from the main checkout. During the lane the scope was widened by the coordinator: a fourth candidate (placed by role); the reviewer's correction `docs/review/responses/b47ce498-correction-1.md` §1 and `docs/review/holistic-reassessment.md`; CL07's reading objective judged in the same comparison (`docs/review/remaining-work-holistic-review-2026-10-01.md`); and its required cells (`docs/review/responses/questions-90b19bee-correction-1.md`: one tablet-sideways cell for U5, the upright cells for U33/U78). Base: the brief names `842157ef`; the worktree was cut at `f9322175`, which descends from it (T62 landed between them) with nothing under `app/src` changed. Deliverable: `docs/design/score-bar-layout.md` §8, appended to U122's design. The brief named the section §7, but U122's §7 already exists. Port 5383, config copy under `app/build/u122a/`.

## Judgement

**Unverified on a device**: this machine's Chromium only, on U122's two faces; every pixel and cell count is this machine's. **Pedagogical verdict: not applicable**, except where a control's or a sentence's place changes what a learner can do (the selected mode off the screen under c4/c5; Hands' sentences naming a hidden control; the paused line cut or whole). Nothing was heard.

**The screen, in product terms (c6, recommended as a product trade, not chosen).** At the top, one thin line of orientation: the piece's name and `bar n / m`, in the folded chip's type. During a run it lies inside the band the run already keeps at the top for `bar n / m`. At the bottom, one row of what the hands reach for: Back, ▶, `Hear it`, the mode, Hands, the tempo and ⋯, chosen by U122's order, with the ordinary status line in the row's spare width. Only while it stands, a refusal's sentence on its own line above the row. Why: the bar's height costs the music only at rest, because a run gives the bar's row to the music at its start (`style.css`:2972–2974). A run already prices the top band (`sheetShift`, `WindowRenderer.ts`:2133–2139). So orientation at the top costs a run nothing and costs the at-rest stage one line.

**The comparison** (86 sideways cells: U119a's 64 plus U122's wide and 90 % cells; each against c1):

| | c1 one row | c2 two tiers bottom | c3 corner overlay | c4 by role, Back on top | c5 by role, compact | c6 context top |
| --- | --- | --- | --- | --- | --- | --- |
| Stave at rest | — | smaller in 16 cells, ≤ 11 % | same | smaller in 46, ≤ 20 % | smaller in 16, < 10 % | smaller in 16, < 10 % |
| Stave in a run | — | same | same | smaller in 12, up to 17 % | same | same |
| Next music in view | all | all | all | all | all | all |
| Chrome over notation | bar over the foot mid-run, 8 cells | 13 | chip over fingerings, 54 at rest | 69 paused | 36 paused | 10 paused, 36 under a paused refusal |
| Name whole (rest / paused) | 39 / 4 | 85 / 38 | 46 / 46 | 82 / 82 | 86 / 86 | 86 / 86 |
| `bar n / m` and widest whole | 86 | 86 | 86 | 86 | 86 | 86 |
| Selected mode readable | 86 | 86 | 86 | off the screen | off the screen | 86 |
| Refusal whole, one line, in window, named control drawn | 430/430 | 430/430 | 430/430 | 430/430 | 430/430 | 430/430 |
| Moves during a run | music 22 px at fold and reveal | same | same | up to 24 px | nothing | nothing |

The trade c6 puts to the owner:

- *Gains*: the name and location whole everywhere, at the top; the music never moves at the fold or the reveal; Hands on the row in 3 more cells.
- *Losses*: at rest the stave is smaller in 16 of 86 cells (≤ 3 % at 740 × 342 at 115 %, 7–10 % at 880 × 412 and 1200 × 360). All 16 are cells where the stage's height decides the size and the stave stays at least about 29 px (most above 50). A run's size is unchanged, and the next music stays in view everywhere. The refusal's line over a paused run covers the music's foot in 36 cells, against c1's 13.
- *If declined*: c1 is the no-cost candidate. Its learner loses the name while paused and keeps the 22-px jump at the fold.

**CL07**: chrome height costs size only where the height decides. No candidate changes the upright or tablet music (c1 against c4: the same stage, stave and systems at rest in all 52 upright and 4 tablet cells). So U33/U78's floor and U5's tablet look-ahead stay with the window rule. U5 is reproduced at 1024 × 768 and 1366 × 1024: Bars 2, two systems of one bar, no next bar, the stave many times the floor.

## The mechanism, the discriminating measurements

- **Read at the lines** (design §8.2): the stage keeps the bar's room at rest (`style.css`:2901), and a run takes it at the start (`:2972–2974`). The freeze prices the stage it sees after a settle and the piece's measurement (`WindowRenderer.ts`:391–404, :3874–3880, :3927). Sideways the sheet is priced for the chip's 22-px band from the start (:2133–2139, :5025). The fold moves the sheet into that band and gives back room, never size (`style.css`:2421–2423, `scaleFor`'s hold :4091–4100, `fitToStage` :3611–3627). The prediction: the bar's height costs only at rest; anything in the flow above the stage at the freeze costs the run; the music moves at the fold unless the sheet is placed below the band from the start.
- **Measured, the prediction held.** c1, c2, c3, c5 and c6 freeze at the same stave in all 86 sideways cells, apart from two runs that took the freeze's second outcome (below). c4 costs runs only where the run's height decides (12 wide cells). The music moves 22 px at every reveal under c1–c3 and never under c5/c6 (`stability.txt`).
- **Which controls act during play** (design §8.3): the mode, Hands and the tempo restart a run (`restartForOption`, `ScoreScreen.ts`:2932–2960; :1412–1420, :1612–1623, :1700–1708). `Hear it` sets the run aside and returns it (:2835–2870). ▶ and ⋯ act. So the coordinator's role rule is the code's.

## Premises found wrong, and the path taken

- **"The two-tier or top line costs the run"**: wrong. A run gives the bar's row to the music at its start, so any bar height is paid at rest only. A top line inside the band a run already prices costs the run nothing (measured).
- **Candidate 4 as specified is the old header row**: Back's 40-px tap target sets the zone's height (36–46 px), the "full-height header" the correction warns against. Measured, it is the costliest candidate. c5 (text only in the band) and c6 (c5's line with every control kept on the row) were added from that finding. The correction allows another decomposition where the evidence is better.
- **"Setup controls behind ⋯" costs what is read, not pressed**: the selected mode (U121's subject) and the ladder's bpm leave the screen. Measured off-screen in every cell under c4/c5.
- **The first pass ran each run after the at-rest refusals on one page.** Five runs froze smaller than on a clean page. Reruns showed the same smaller outcome on clean pages too (the freeze's own two outcomes, c1 included). The flows were split into two fresh pages per cell, and the first pass kept as history.
- **The probe's own faults, found and fixed**: the shell's clip around the fixed screen read as cutting the refusal (the clip walk stopped at the screen); the row measured before it was allocated (64 at-rest states had a stale stage reserve; fixed and rerun, now 0 of 3,768); c4's Back wrapping in its zone (fixed and rerun); the tempo label widened between two allocations (held at its priced width).

## Done

- The three layouts the brief names (c1, c2, c3), the coordinator's placed-by-role candidate (c4), and two derived from the measurements (c5, c6), each installed in the real page. Measured on U122's grids: U119a's 64 sideways cells, 48 upright, 880 × 412 and 1200 × 360, and the 90 % text cells. Measured in U122's states (at rest; ▶ and `Hear it` refused at rest; a render while the refusal stands, the tempo sheet and a resize; paused; ▶ refused over a paused run) and in a run at its freeze and after the fold. Per state: the stage, the five-line stave on the glass, the fit's term, the frozen scale, the bars inked and the next music, slots and systems, every text, every control hit at five points, the refusal and the control it names, and the chrome's boxes against notes, fingerings and ink. Recorded in `music.txt`, `chrome.txt`, `texts.txt`, `refusal.txt`, `stability.txt` and `summary.txt`.
- The size machine read at the lines and the fold's effect stated, then measured (design §8.2).
- Which bar controls act during play, read at the lines (design §8.3).
- CL07: the floor-relevant upright cells and the tablet-sideways cells (1024 × 768 and 1366 × 1024) measured with the candidates that apply there (design §8.5). The tablet/upright result is stated in one line: no candidate changes them.
- The reviewer's listed measures, per candidate: stage height, readable music and look-ahead; chrome over notation, fingerings and controls; Back and `bar m / m`; the selected mode; ▶ and ⋯ size; whether actionable text names a visible control; U120's 568 × 320 refusal; U121's case; what moves during a run (design §8.0 table).
- The allocation within each surface for c6, and what becomes of U122's rules (design §8.7).
- The trades put and not chosen (design §8.8).
- The freeze's spread and the history checked by reruns (`spread.txt`).
- Harness per §14: `npm ci`; content copied read-only from the main checkout's `app/public/content`, since this worktree holds only the committed audio there; `npm run build:app`; port 5383 from `app/build/u122a/playwright.u122a-5383.config.ts` with its own storage state by absolute path.

## Not done

- **No device check.** None available.
- **The existing suites were not run.** No code changed; CI is the full run.
- **Floor values other than 22 px were not varied** (that would be an app change). That the chrome does not change them upright is inferred from identical stage boxes.
- **c2, c3, c5 and c6 were not measured upright or on the tablet cells.** They are landscape-phone arrangements (`max-height: 500px`); upright and tablet the name and location are already in the header.
- **A Hands refusal and text above 115 % were not measured.** The pieces are three: Hot Cross Buns, Moonlight III, When the Saints.
- **Whether to show the selected mode read-only on the top line** (so that the row could shed setup controls) was not measured; it would be a new element.
- **The ladder's mid-run tempo change and the `Hear it`/*Stop* width change** were not exercised (U122's state-independence row covers them).

## Follow-ups (recorded, not fixed)

1. **The freeze has two outcomes for Moonlight on this machine, whatever the chrome.** The second is about a sixth smaller; on the single-page flow at 568 × 320 it is 19.1 px, under the floor. At the three cells where a clean run showed it, it appeared in 5 of 72 runs; on the single-page flow at the five runs that showed it, in 3 of 15 reruns. Both samples are selected. A related case: at 1024 × 768 the freeze priced the stage after the header's fold under one candidate and before it under the other, giving two systems against one. Provenance: pre-existing at `f9322175` (c1 shows it). Attaches to CL07 (U35).
2. **The tap minimum's height is in rem**: ▶, ⋯ and Back are 36 px tall at 90 % text under every candidate. U122's model priced the floor in width only (S13); S12 wants `max(2.5rem, 40px)` too. Attaches to U122's cluster.
3. **U122's planned refit around a refusal's line at rest (J11)** shrinks the music while the sentence stands; under c4 that goes under the floor in 6–7 cells. Put as a product trade (design §8.8 3), not a fault.

## Questions

1. **For the owner (design §8.0, §8.8 1):** c6 (the name and `bar n / m` on a thin top line, every control in the bottom row, the refusal transient) at the stated at-rest cost, or c1 (U122's one row, no music cost, the name lost while paused)?
2. **For the reviewer (design §8.8 2, 3):** in c6, the ordinary status line in the row's spare width (cut) or on a strip above the row (whole, over the paused music's foot in 36 of 86 cells)? At rest, refit the stage around a refusal's line or overlay it?

## Files

- `docs/design/score-bar-layout.md` (U122's design, copied from the main checkout, §8 appended; lines 1–351 unchanged).
- `docs/prompts/runs/U122a/`:
  - this entry;
  - `scripts-probe.spec.ts` (the probe: six candidates, two flows) and `scripts-probe-firstpass.spec.ts` (the first pass's single-page flow, used for the history reruns);
  - `scripts-playwright.u122a-5383.config.ts`;
  - `scripts-run-chain.ps1`, `scripts-run-reruns.ps1`, `scripts-run-upright-c1.ps1`, `scripts-run-grids.ps1` (the first pass, stopped part-way and kept as history). The tablet cells ran from one command (`U122A_MODE=tablet`, `U122A_SIZES=1024x768,1366x1024`, `U122A_TEXTS=100`, `U122A_FACES=stack`, `U122A_PIECES=hcb,moon`, `U122A_CANDS=c1,c4`, labels `r-tab`/`q-tab`);
  - `scripts-analyse.py` and the checks `scripts-checks.py`, `scripts-spread.py`, `scripts-stale.py`, `scripts-heights.py`, `scripts-upright.py`, `scripts-runspread.py`, `scripts-peek.py`, `scripts-keep.py`. They read `build/u122a/out/`, deleted at the end;
  - tables: `summary.txt`, `music.txt`, `chrome.txt`, `texts.txt`, `refusal.txt`, `stability.txt`, `spread.txt`, `stale.txt`, `heights.txt`, `checks.txt`, `upright.txt`;
  - run logs: `run-*.txt`, `rerun-*.txt`, `npm-ci.txt`, `build-app.txt`;
  - `cells/`: the acceptance cells' JSON, and `cells/history/` with the five first-pass runs;
  - `pictures/`: 18 screenshots — the owner's 780 × 360 under every candidate, U120 and U121 under c1 and c6, the paused refusal over Moonlight, the tablet run, upright.
- Machine paths are `<worktree>`/`<home>`; no kept file is over 300 KB.

## Exit codes

| Step | Exit | Counts |
| --- | --- | --- |
| `npm ci` | 0 | |
| `npm run build:app` (at `f9322175`) | 0 | |
| chain, run flow: side, extra, small, up, smallup | 0 each | 384, 96, 36, 96, 8 passed |
| chain, refusal flow: side, extra, small, up, smallup | 0 each | 384, 96, 36, 96, 8 passed |
| tablet, run and refusal flows | 0 each | 8, 8 passed |
| reruns: c4 (side both flows, extra run), c2 (2 cells), spread v1–v3, history h1–h3, upright c1 (four runs) | 0 each | 64, 64, 16, 2, 18 ×3, 5 ×3, 48, 48, 4, 4 passed |
| first pass (`f-`, before the flows were split) | stopped part-way | 85 cell-and-candidate files, kept as `cells/history` (five) and summarised in `summary.txt`; its log was not kept |
| trial runs (`t1`–`t5`, exploratory) | 0 each | outputs superseded, not kept |

## Content

Nothing under `content/` or `scores/` changes; no sentence's wording changes. The §12 itemisation list is empty.

**Orchestrator's note at the landing (2026-10-01).** U122a's worktree committed by name (911f8c82) and merged (02d28d99). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U122a/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; vitest-timeouts-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; the other failures were load and pass alone (`vitest-timeouts-rerun`); `runs/U122a/orchestrator-exit.txt`). Dispatched under the reviewer's correction to U122 (`responses/b47ce498-correction-1.md` §1: APPROVE WITH ONE REQUIRED CHANGE — U122 redrafted as a landscape Score chrome design lane whose first decision is which information belongs on which surface, compared against the same measured grids and learner-facing invariants, at minimum the three named families — bottom-heavy with a coherent allocator, split context/control, split with a transient state surface — each measured for stage/stave height and look-ahead, chrome over notation/fingerings/controls, Back and `bar m / m` usability, selected-mode readability, ▶ and ⋯ visibility and tap size, whether actionable text names a visible control, U120's 568×320 refusal, U121's narrow case, and what moves during a run; acceptance: a reviewer can explain the landscape Score screen in product terms first — top, bottom, transient, and why — before the allocation mechanism; stop condition: if no candidate preserves the required readable area and the invariants at a measured cell, report the actual product trade rather than add another local rule) and its procedure amendment (§2: challenge the container, not only its contents, before a redesign or another fix-forward in a repeated hotspot). The brief's own rules (`U122a-the-bar-premise-measured.md`): measure the three named layouts plus, from the owner and reviewer's own 2026-10-01 lead candidate, a fourth placed by role, on the same cells U122 measured, in U122's own states; allowed: probe the real app in the page on this lane's own port 5383 from a config copy under `app/build/u122a/`; not allowed: any change to app source, styles or committed tests. During the lane the scope was further widened, neither reopening the brief itself: a fifth and sixth candidate (c5, c4 made compact; c6) were derived from measuring c1–c4 and added; CL07's reading objective was judged in the same comparison, per `docs/review/remaining-work-holistic-review-2026-10-01.md` ('U122 + CL07'); and `responses/questions-90b19bee-correction-1.md`'s required cells were folded into the same comparison before any recommendation, rather than opened as a second design lane — one tablet-sideways cell exposing U5's trade, and the upright cells needed to compare U33/U78's floor and comfortable-size values while each candidate's chrome allocation is in force. Base: the brief names `842157ef`; the worktree was cut at `f9322175`, which descends from it (T62 landed between them) with nothing under `app/src` changed. The brief's own stop condition was exercised: no candidate preserves the stave's at-rest size for free, so the recommendation (c6) is reported as a product trade, with its gains and losses, and not chosen.. a design addendum, docs only: the chain ran the map, typecheck, lint, the whole unit suite (the known blues.3/4.7 pair, and tempoSoundAgainstMark's load timeout, which passed alone) and the build; the map names no browser spec for docs

## Doc rows (proposed, not applied; the brief owns none of these files)

- `docs/prompts/backlog-2026-09-25.md` CL07 / U35: observation, the freeze's two outcomes for Moonlight (the second about a sixth smaller, under the floor at 568 × 320 on the single-page flow), chrome-independent, pre-existing at `f9322175` (Entry 209, `runs/U122a/spread.txt`).
- U122's cluster: S12's tap height in rem (36 px at 90 % text), with U122's S13 change (Entry 209).
- If c6 is chosen: U122's build plan (design §6) gains the top line's rule and the sheet below the band from a run's start; its J5, L4, L8 and the priced widest location are dropped (design §8.7).
