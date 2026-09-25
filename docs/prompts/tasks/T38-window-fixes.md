# T38 — The window's demonstrated faults fixed at their mechanism, and the two look-ahead treatments judged by eye

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13;
`docs/prompts/audit-2026-09-25-outside.md` Part 4, boundary 5; `docs/prompts/diagnosis-
2026-09-25.md` §"The window baseline" and D6–D7; then the classification you are building
on, `docs/prompts/traces/2026-09-25-window-reds.md`, whole (its mechanism section, R1–R3, the
faults A–E, the sheet table, and "What to change, in the order that serves the owner's
goods"). The T34 brief `T34-window-fit.md` holds the owner's six rules in his words. Code:
`app/src/score/WindowRenderer.ts` (`chooseWindowShape`, `scaleFor`, `fitSlots` and the
`naturalBar` loop near 2371–2377, `setZoom`, `drawInto`, `debugFit`, the sideways branch
near 1577–1600), `app/src/score/slots.ts`; specs `score.window-rule`, `score.layout`,
`score.screen`, `score.rotate`, `score.fill`, `score.fuzz`, `score.head-height`,
`score.stepper-limits`, `score.states`; `app/tests/tour/t34-sheet.spec.ts`; docs `08` §4.1
and §9 (invariants 3 and 7, §9.7), `04` §5, the decision document
`2026-09-23-score-window-strategy.md`.

## The goal, in the orchestrator's words

The window draws the bars asked at the largest uniform scale the glass allows, prices
them from what is actually drawn, never shrinks for the greyed next row, never justifies a
bar across a row, grows when Size grows, and measures "staff" as the five lines. The tests
see what the learner sees. Two ways of showing a next row that does not fit across are
built and photographed, and the better one is chosen by the pictures, not by the rule.

## The owner's words

"Maximizing individual bar's readability given the screen size and orientation without
distortion, and being able to see the next bar when possible, are the most important
things." "By stretch I mean making the notes per bar too far apart from regular sheet
music, not that it shouldn't get proportionally bigger if it has the space." "The user
should still be able to size up/down and choose the number of bars if possible still, and
everything should resize based on the selection."

## What is decided (each is a classified fault with its measurement in the trace)

1. **A, the `naturalBar` ratchet (R2's cause, R1's price).** Price bars from what is drawn:
   the per-bar width used by `chooseWindowShape` must not include a row's opening (clef,
   key, time) and must not be a running maximum that only a zoom change resets. Hold the
   Size target fixed per step; over 100 %, refuse any shape whose scale is not larger than
   the 100 % scale. Red first: the trace's probe, as a spec: at the default viewport on Hot
   Cross Buns, 100 % → 110 % → 120 % → 110 % must give a monotone, path-independent scale;
   and tablet sideways Twinkle 4 bars at rest must not be two third-width rows after a
   pass through 1 bar.
2. **B, the look-ahead row priced into the width.** The window's scale comes from the
   window's rows only. Red first: at 390 × 844 and 360 × 780 on Hot Cross Buns the window's
   scale equals its own fit, not (stage − margin) ÷ the greyed row's width.
3. **B's remainder, the two treatments, built and judged.** When the granted next row does
   not fit across at the window's scale: (i) draw it greyed, running off the right edge,
   its opening visible, with the row saying the next bar continues; (ii) a compact
   treatment: the next bar's first beat or first system only, greyed, inside the stage,
   with the row saying so. Build both behind one switch, shoot both on the sheet's cells
   plus a viewport swept across the breakpoint (the width at which the row stops fitting),
   open every picture, and choose by what a learner would see: no hole, nothing that reads
   as a rendering failure, no oscillation across the breakpoint (assert the window's scale
   is monotone across the sweep). Say which you chose and why in the pictures' terms; keep
   the other behind the switch for one wave so the owner can see both, and name the switch.
4. **C, the justified look-ahead slot.** Size a look-ahead slot's natural page from the
   widest natural bar at the engraving zoom, not from the stage; write `data-stretch` from
   the outcome (one system or several); add a check that reads outcome, drawn bar width
   against engraved bar width per bar, on every cell of the 60-cell spec. Red first on the
   phone upright Nocturne 4-bar mid-run cell.
5. **D, "staff" means the five lines.** One measurement of the staff's height (four staff
   spaces at the engraving zoom × the scale, or the five lines' box) used by the renderer's
   floor and by every spec and the tour camera; re-derive `MIN_STAFF_PX` from screens the
   owner has called readable (Entry 63's re-shot cells and T34's brief say which), measured
   on more than two pieces, and state the relationship, not a machine number. Two
   definitions become one; no conversion.
6. **R1 and R3, the stale specs.** `score.layout` asserts that the drawn count rises with
   the asked count *or* the row states the yield with the drawn count; the sideways row's
   sentence is corrected (never "would be too small" when room is the reason); the row is
   not history-dependent (the same stage and settings give the same words). `score.rotate`
   is re-pointed at T34's promises (an upright page is at most stage width × the slot's
   bars; only the widest window row is held to the width; look-ahead rows are exempt) with
   the reason beside each change.
7. **E is not in this task.** Tablet sideways at 2 bars with no next bar is intentional
   behaviour under T34's rule 2 and changing it is the owner's decision (D7), not yet
   taken. Do not change rule 2's precedence. If your B/C fixes change those two cells, say
   how in the sheet table.

## What is the agent's judgement

The order of 1–6 (1 and 2 first, since 3–6 are measured on top of them); the shape of the
switch in 3; the exact floor relationship in 5; which existing spec each red line goes
in. Where a fix you make worsens any cell of the sheet, the sheet wins and you go back to
the mechanism.

## Hypotheses you inherit as questions

The trace's mechanisms are supported by its probe measurements, not proven by a fix. For
each of 1, 2 and 4, before changing code, reproduce the trace's measurement with the
probe pattern (the trace's scratch probe is described in `T35/HANDOFF.md` under
`...\scratchpad\T35\`; re-create it as `app/tests/e2e/t38-probe.spec.ts` and delete it at
the end), then change the mechanism, then measure again the same way. If a measurement
contradicts the trace, say so and act on what you measured.

## Rules and files

You own: `app/src/score/WindowRenderer.ts`, `app/src/score/slots.ts`,
`app/src/score/autoFit.ts`, `app/tests/e2e/score.*.spec.ts`, `app/tests/tour/t34-sheet.spec.ts`
and `t30.ts`, `docs/08-score-render-states.md` §4.1 and §9, `docs/04-ui-spec.md` §5 (the
window paragraphs and the row's sentence), the decision document (a dated section),
`docs/08-test-map.md`, and a new entry in `docs/pending-review.md` (next free number after
the tail; another task may append before you, so read the tail when you write). The
row's sentence lives in `app/src/ui/screens/ScoreScreen.ts`: **you may edit that one
function only**, and nothing else in that file. **Not** `ScoreSession.ts`, the engine, the
stores, or any content. Never `git add -A`; no commits, no push, no stash. Never name an
AI model. Never assert a number measured on this machine in a test; express the
relationship.

Playwright: you are the only user of port 4173 while you run (a content task runs beside
you in `tools/` and `content/` and never starts a browser); one config at a time; stop the
preview server before `npm run build:app`; never build during a run; two workers for the
score specs; unpiped runs so the exit code is real. A locator with no timeout hung the
previous probe: give every probe wait a timeout.

## When to deviate

If pricing from what is drawn turns out to need the prediction for the first fit (before
anything is drawn), keep the prediction only until the first measurement and say so. If
5's re-derivation moves the floor enough to change the count on many cells, stop at the
measurement, report the relationship, and leave the floor's number as a question rather
than choosing one. If an item cannot be finished, an explicit not-done line and the
reason; never silently.

## Report

Judgement first: does the window now hold the owner's rules on every cell you shot, and
which look-ahead treatment did the pictures choose and why. Then Done / Not done /
Follow-ups / Questions / Files; per fault the mechanism, the reproduction before, the red
line, the measurement after (same method); the sheet table as in the trace, with your
reading of each cell; the nine specs' exit codes from unpiped runs; unverified beside what
passes (nothing seen on the owner's device; no teacher judged the pictures). Append the
same as the entry.
