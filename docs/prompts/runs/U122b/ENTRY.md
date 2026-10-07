### Entry 214 — U122b — each Score moment shows what it needs: c6 applied state by state

Lane U122b: a probe, with no app source, style or committed test changed. Brief: `docs/prompts/tasks/U122b-each-score-moment-shows-what-it-needs.md`. Governed by `docs/review/responses/911f8c82.md` and `911f8c82-correction-1.md`. The worktree was cut at `d159f407`; nothing under `app/src` differs from U122a's base `f9322175`. Deliverable: `docs/design/score-bar-layout.md` §9. Port 5443, from `app/build/u122b/playwright.u122b-5443.config.ts`.

The machine crashed and rebooted mid-lane, during an interrupted run on 4 workers. The worktree's ignored `build/` folders survived intact: the probe, the scripts and the completed runs. The lane continued from them rather than restarting. The two runs that are the result were rerun cleanly on 2 workers, the coordinator's new limit.

## Judgement

**Unverified on a device:** this machine's Chromium only, and every pixel and cell count is this machine's. **Nothing was heard; no musical judgement is made.** **Pedagogical verdict:** not applicable, except where a control's or a sentence's place changes what a learner can do: ⏸ missing while playing, ▶ missing while paused, the count over the entrance notes.

**c6 applied per state passes the four checks in every listed cell and state measured,** once its per-state rules include three things c6 as U122a built it does not have:

1. The fold keys on playing, not on a run existing, and leaves ⏸ alone in ▶'s place.
2. The count-in leaves the stage, drawn where the name was.
3. The row's background ends at its controls (no vertical padding).

Two smaller rules: the top line is as tall at rest as the run's band, so ▶ moves nothing; and the finished sheet puts its actions under its heading, with the folded chip not drawn over it. The listed cells are 24: 568 × 320 and 780 × 360, at 90 %, 100 % and 115 %, on both faces, with Hot Cross Buns and Moonlight III. The finished state is measured on the 12 cells whose piece finishes.

**The refusal fits the top band once the title yields, and no refit is needed.** ▶ and `Hear it` refused at rest, and ▶ refused over a paused run, were each drawn whole on one line in 24 of 24 cells. The top line kept its 22-px height and `bar n / m` stayed beside the sentence. Every sound-refusal sentence the glass can carry, priced, fits beside `bar n / m` at the tightest cell.

The refused start (*Nothing for the right hand in this piece — choose L or Both*) is not a sound refusal. It overflows the room beside `bar n / m` at 568 × 320, 115 %, wider face (2 cells), and fits the line once `bar n / m` yields too, which the table allows. **So there is no fallback to report, and the 22-px floor never comes into play.** For the record, U122a's c6 refit was about 22.3 px at the closest cell.

**The per-state table, the centre of the result** (counts are cells passing):

- **B** is c6 applied per state: final run `ff`. In brackets, run `f`, with the row padded as the app pads it.
- **A** is the app's own state machine with c6's elements moved, as U122a installed them.

| State | 1 shown, directly reachable (B) | 2 nonessential hidden (B) | 3 music held (B) | 4 nothing over the ink (B) | A |
| --- | --- | --- | --- | --- | --- |
| At rest | 24 | 24 | 24 | 24 (18) | — |
| ▶ refused at rest (U120) | 24 | 24 | 24 | 24 (18) | — |
| `Hear it` refused at rest | 16: `Hear it` 36 px tall at 90 % text | 24 | 24 | 24 (18) | — |
| Refusal cleared | 24 | 24 | 24 | 24 (18) | — |
| Count-in | 24 | 24 | 24 | 24 | fails 1, 2, 4 everywhere: the row folds 0.7 s in, so there is no direct pause; the wash and the numerals sit over the stage (on 11–14 note heads in Moonlight) |
| Holding for the first note | 24 | 24 | 24 | 24 | no direct pause, 24 |
| Playing | 24 | 24 | 24 | 24 | **no direct pause, 24** |
| Paused, 3 s after ⏸ (U121) | 24 | 24 | 24 | 24 (22) | the row folds: the name, ▶ and setup gone, the paused sentence in the chip, 24 |
| ▶ refused over the paused run | 24 | 24 | 24 | 24 (22) | the sentence in the chip names a ▶ not drawn, 24 |
| Refusal cleared, paused | 24 | 24 | 24 | 24 (22) | as paused |
| Finished | 12 of 12 | 12 | 12 | 12 | an action whole in view in 3 of 12; the chip drawn over the summary in 12 |

**The hypothesis**, against its refuting tests:

- **The refusal's core overflows the top band:** not observed.
- **A playing state has no direct pause under c6's fold:** observed in 24 of 24 for c6 as the app folds it. It is repaired by rule 1, after which ⏸ in its own place covers no ink in any cell.
- **A state's chrome over its notation:** observed for the app's count-in (24) and for c6's padded row at 780 × 360 with Moonlight (6 at rest, 2 paused). They are repaired by rules 2 and 3.

So the hypothesis holds for the refusal and for c6 applied per state with those rules. It does not hold for c6 with the app's own fold and count-in.

## The mechanism, the discriminating measurements

- **The fold** (`showBar`, `ScoreScreen.ts`:3613–3619) arms a timer whose only condition is `session.running`. A paused run keeps that, so a paused run folds three seconds after any tap. The same timer folds a starting run 0.7 s in (:2609), during the count-in. Measured: A folds in every cell, in the count-in, while holding, playing, paused, and three seconds after a refusal over a paused run. The last is walk finding 5's twin: the chip says *tap ▶ again* with no ▶ drawn.
- **The count-in** is an overlay over the stage (`style.css`:2340–2391): a 72 % surface wash and numerals at `clamp(2rem, 12vmin, 5rem)`. Measured over notes, fingerings and stave lines in every cell.
- **The padded row over the ink.** At rest at 780 × 360 with Moonlight, the height-bound window's ink runs 3–5 px past the stage's foot into the row's top padding. Paused, the stage has taken the row and the frozen music's foot lies under the row's padding. The discriminating measurement priced each control alone and the row with no padding: no control reaches the ink deeper than a pixel, and the flush row covers nothing in any cell. Rule 3 (run `ff`) then cleared all 38 affected states. The stave did not change in any cell. In 2 cells the fit's term changed with the same three bars inked, and the pictures show the same music (`window-f-ff.txt`).
- **The top line against the run's band.** At rest the line is 18–22 px; a run keeps a band of at least 22 px. Without the band rule (run `g`), the music's top edge moved 2.7–4.2 px at ▶ in 20 of 24 cells. With the line as tall as the band (`f`, `ff`): 0 of 24.

## Premises found wrong, and the path taken

- **Two app states fit no row cleanly.** *Holding for the first note* (R4) is governed by the count-in row: the task is still the entrance. *Hearing* (R15) is governed by the playing row, with **Stop** as its direct control rather than ⏸ (T31 principle 5). Recorded in design §9.1.
- **U122a's chrome table could not see the at-rest overlap.** Its analysis kept chrome only where the chrome's box overlaps the stage's box (`overStage`), and at rest the row sits below the stage. Its unchanged probe, rerun here, measures the row over 3 ink paths at rest under c6 at 780 × 360, 115 %, Moonlight, and none under c1 (`check-u122a.txt`).
- **The probe's own premises, found and fixed:**
  - The Score's default input here is *none*, and a Keep tempo run with no input never holds for its first note (`ScoreScreen.ts`:2544). The probe chooses the screen keys.
  - Moonlight's count at its default 70 % ended before it could be measured twice. Moonlight runs at 35 %, which changes only the tempo label.
  - The count's second form at first missed the count where pictures came first. All three measures are now taken in one evaluate.

## Done

- **The table mapped onto the Score's states** (design §9.1): the T31 machine's R1–R20 and the sound refusal, each with the code fact that identifies it and the row that governs it.
- **U122a's probe extended, not rebuilt** (`scripts-states.spec.ts`; its `install('c6')` unchanged):
  - one flow per cell walks rest, ▶ and `Hear it` refused at rest, the refusal cleared, the count-in, holding for the first note, playing (the probe strikes the expected keys in time), ⏸, ▶ refused over the paused run, cleared, and played to the end;
  - each state is measured as A and B;
  - `installStates` emulates the per-state table: one stylesheet keyed on `data-u122b`, and a message element in the top line.
- **The four checks per state per cell:** 456 states per run (`states-ff.txt`, `states-f.txt`; `summary.txt`, `summary-f.txt`). Check 4 counts note heads, SVG text, stave lines and other ink separately, with depth.
- **The refusal tried in the top band first.** It fits, with no refit and no overlay. Every refusal sentence was priced, along with the paused notes (`refusal.txt`, `notes.txt`).
- **Where a lone ⏸ can stand, priced** (`pause.txt`). The top band cannot hold it at the tap floor: it covers ink there in 2–12 of 24 cells.
- **The count-in's two forms** (design §9.3).
- **The cells:**
  - U120's 568 × 320 refusal on both faces;
  - U121's paused case;
  - the owner's 780 × 360;
  - both faces throughout;
  - U124's 90 % text, with U124's floor installed for Back, ▶ and ⋯ (all at least 40 × 40 and hit, `sizes.txt`).
- **Pictures of each state** at 568 × 320 (115 %, the app's face, Moonlight) and 780 × 360 (100 %, the app's face, Moonlight), A and B, plus the finished state with Hot Cross Buns and the row padded against flush.
- **Learner-facing wording proposals itemised** (design §9.6).
- **Harness per §14:**
  - `npm ci`;
  - the content copied read-only from the main checkout's `app/public/content`;
  - `npm run build:app`;
  - port 5443 with its own storage state by absolute path;
  - runs `g` and `g2` on 4 workers before the crash; `f` and `ff` on 2.

## Not done

- **No device check.** None available.
- **The existing suites were not run.** No code changed.
- **Moonlight's finished state was not reached.** Its 201 bars do not finish in a probe's time. The summary covers the stage, so the piece's notation does not enter the finished checks.
- **R2, R5 (Wait), R13–R17 and R19 were not walked.** R17's away note, the C1/C2 paused notes and R19's sentence are priced only.
- **The numeral count at a tighter spacing was not measured.**
- **A background-only alternative to rule 3** (keep the row's height, paint nothing in its padding) was not measured.
- **Upright and tablet are out of scope.** c6 is a landscape-phone arrangement.
- **Text above 115 % was not measured.**

## Follow-ups (recorded, not fixed)

1. **The fold keyed on a run existing.** It hides ▶ while paused, and while a refusal names ▶ over a paused run (walk finding 5 and its twin). It belongs to the c6 build as its rule 1. Provenance: pre-existing at `d159f407`: the code is read at its lines, and the behaviour was observed under the probe's c6, with today's layout inferred to do the same.
2. **The tap floor for every control a sentence names.** `Hear it` is 36 px tall at 90 % text; Hands' R and L are 16–24 px wide at every size, and R19 and a Hands refusal name them. This attaches to U124 inside the c6 build's acceptance. Provenance: pre-existing.
3. **The app's summary sheet on short screens.** Its actions sit below the figures, out of view or partly in it in 9 of 12 cells, and the folded chip stays over the sheet. This attaches to the c6 build's finished state, beside walk finding 9. Provenance: pre-existing.
4. **Moonlight's freeze took its smaller outcome** at 780 × 360, 115 %, app face, in 2 of the 7 runs of that cell here: the five grid runs `g`, `g2`, `g3`, `f` and `ff`, and U122a's probe rerun under c1 and under c6. The two were run `g` and the rerun under c6. Every run of the cell is counted, so the count is not selected, but it is small. That is about 26.4 px against about 31.6 px, independent of the chrome. This attaches to U35 (CL07) as an observation. Provenance: pre-existing (§8.6).

## Questions

1. **For the owner: the count-in's form.**
   - *In the top line, the chip's type:* clear of the music in every cell, but small.
   - *The app's own numerals beside ⏸, without the wash:* large and clear of the music at 780 × 360; at 568 × 320 at 100–115 % the app's spacing runs them past the window's edge.
   - The count was drawn so that the first note is not unannounced on a phone on a stand (P21c A6), and the large numerals serve that better. Recommended: the numerals beside ⏸, with spacing the build fits and measures at 568 × 320, 115 %, wider face; the top line if it cannot.
2. **For the reviewer: the paused notes that say more than *Paused*.** These are *you were away N s*, *Restarted at bar 1 with the left hand*, and *Paused at bar N*. Do they take the name's place in the top line while they stand, as the refusal does, or stay off the sideways glass? Every one fits beside `bar n / m` in every listed cell, the away note in its shortened form (design §9.6). The correction both says *do not move every ordinary status line to the top* and says *information earns space from the learner's current task*. These notes answer a question the learner has at that moment (why did the run stop or move), so they read as the latter. That judgement is the reviewer's.

## Files

- `docs/design/score-bar-layout.md`: §9 appended; lines 1–526 unchanged.
- `docs/prompts/runs/U122b/`:
  - this entry;
  - `scripts-states.spec.ts`, the probe;
  - `scripts-playwright.u122b-5443.config.ts`;
  - analysis scripts: `scripts-analyse.py` (the checks, writing the tables), `scripts-compare.py`, `scripts-sizes.py`, `scripts-window.py`, `scripts-chk.py` (reads U122a's probe rerun from `build/u122a/out/`), `scripts-chk2.py`, `scripts-freeze.py`, `scripts-peek.py`. They read `build/u122b/out-*` and `build/u122a/out/`, deleted at the end;
  - tables: `summary.txt` and `states-ff.txt` (B final, and A); `summary-f.txt` and `states-f.txt` (the padded row); `refusal.txt`, `notes.txt`, `pause.txt`, `finished.txt`, `music.txt`, `sizes.txt` (from `ff`); `window-f-ff.txt`; `compare-g2-f.txt` and `compare-f-ff.txt`; `check-u122a.txt`; `freeze.txt` (the frozen stave at 780 × 360, 115 %, Moonlight, in every run of that cell);
  - logs: `run-f.txt`, `run-ff.txt`, `run-g.txt`, `run-g2.txt`, `run-g3-interrupted.txt`, `check-u122a-probe.txt`, `npm-ci.txt`, `build-app.txt`;
  - `pictures/` (37 files):
    - for each of `568x320-t115-stack-moon` and `780x360-t100-stack-moon`, B for rest, both refusals at rest, cleared, count, count2, armed, playing, paused, paused-refused, paused-cleared; and A for count, armed, playing, paused, paused-refused;
    - `*-hcb-B-finished` at both sizes;
    - `row-padded-*` against `row-flush-*`.
- Machine paths are `<worktree>` and `<home>`, and no kept file is over 300 KB.

## Exit codes

| Step | Exit | Counts |
| --- | --- | --- |
| `npm ci` | 0 | |
| `npm run build:app` (at `d159f407`) | 0 | |
| the probe's standalone typecheck (`tsc --ignoreConfig --noEmit … states.spec.ts`), after each edit | 0 | the first attempt failed on type errors in the probe, fixed |
| trials `t1`, `t2`, `t3` | 0 each | 1, 2, 4 passed; outputs superseded |
| run `g` (no band rule) | 0 | 24 passed, 4 workers |
| run `g2` (band rule) | 0 | 24 passed, 4 workers |
| U122a's unchanged probe on 780 × 360, 115 %, Moonlight (c1, c6) | 0 | 2 passed |
| run `g3` (band and flush) | none: the machine crashed before the log ended | 24 JSON files written; not used |
| run `f` (band rule; the result's padded row) | 0 | 24 passed, 2 workers |
| run `ff` (band rule and flush; the result) | 0 | 24 passed, 2 workers |
| analysis scripts (`analyse`, `compare`, `sizes`, `window`, `chk`) | 0 each | |

## Content

Nothing under `content/` or `scores/` changes, and no sentence's wording changes. The §12 content list is empty. The learner-facing wording the build would change is proposed and itemised in design §9.6.

## Doc rows (proposed, not applied; the brief owns none of these files)

- The c6 build brief gains the per-state rules of design §9.1, as acceptance: the fold on playing with ⏸ left alone; the count off the stage; the row flush to its controls; the top line at the band's height; the finished sheet's actions first and the chip hidden.
- U124 inside that build: the 40-px floor for every control a sentence can name (`Hear it`; R, L and Both), not only Back, ▶ and ⋯.
- `docs/prompts/backlog-2026-09-25.md` CL07 / U35: the freeze's smaller outcome seen again at 780 × 360, 115 % (2 of 7 runs there; Entry 214).
