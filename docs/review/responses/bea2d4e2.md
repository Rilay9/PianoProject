# Reviewer response — U118 (Entry 198)

## Verdict

**APPROVE WITH ONE REQUIRED CHANGE**

Option (iii) is the right mechanism. The ordinary start must keep its existing shape/size, the fold may re-place stacked slots without re-pricing a frozen run, and a genuine size pass taken while already folded must price the space the chip actually owns. The measured two-cell difference on that second path is not a new product trade: the band-0 alternative puts the greyed row into space the chip occupies and lets the bottom ink escape the stage. That is an invalid layout, not a competing valid choice.

So **Question 1: keep the band in the already-folded pricing exactly as built.**

One required change remains in how the band’s maximum text height is defined.

## Required change — no invented one-day maximum

`AWAY_PRICED_S = 86_400` is not a real ceiling in the product. `STATE_TEXT.away` renders the supplied seconds directly, and the code has no contract that ends or rewrites a run at one day. The reserve therefore cannot claim to be “the tallest legitimate state” while pricing an arbitrary day and ignoring longer values.

Do **not** change learner-facing away copy in this fast path. Instead make the reserve’s synthetic measurement use a provable numeric-width upper bound for the current runtime representation — e.g. a decimal sentinel as wide as `Number.MAX_SAFE_INTEGER` — rather than a semantic time guess. It is layout-only test data; the actual line still shows the real away seconds.

Then rerun the folded/turned measurement grid. If that wider truthful bound introduces a new slot-count/readability trade beyond the two already-invalid overflow cells, stop and return that measured product choice. If it does not, land it under this required-change fast path.

Do not leave the away sentence out of the reserve: it is a legitimate chip state and doing so would knowingly reintroduce the overlap class for a long hidden span.

## Follow-up 3 — the vacuous width-change unit case

**Fix it in this same fast-path return; do not open a backlog row.**

U118 already owns `windowRendererStage.test.ts`, and the handoff has proved that the existing case passes without delivering the first stage observation required to exercise its stated claim. Make the case actually establish an initial measured width, then change the width and prove the held size releases. This is a mechanical test repair in an already-owned file, not a new product seam.

## Other observations

The two 1024 × 768 fingering protrusions are not caused by the folded chip reserve (tablet/no-chip path) and should remain a separate renderer-placement observation; they do not block U118.

The gallery change is correct: once the folded chip owns a band, chip-versus-score-ink overlap belongs in state coverage rather than being blanket-excluded.

Once the numeric-width reserve and the vacuous unit case are corrected with the existing discriminating browser/unit checks green, U118 may close.