# U110b — the state that earns U110a's packing exception, reproduced in a real browser, or the exception removed (a fix-forward)

**SETTLED** (`responses/eddd5c95.md`): the packing predicate stands, and so do the pruning, the docs and the tests. The one open fact is whether the real renderer reaches the state the exception exists for.

## What to do

Write the smallest browser probe that holds all of these at once:
- a look-ahead row is drawn and the ladder is spent;
- the stage height shrinks while the width, the asked bars and the engraving zoom stay fixed;
- the rows fit before the shrink;
- after it, the real drawn rows fail the same packing test;
- the look-ahead row drops, the two window rows remain, and their ink neither overlaps nor leaves the stage.

Keep before and after pictures and the measured row boxes. Phone upright is enough.

**If the real renderer cannot reach the state, remove the exception** (keep the pruning) and say so: a stand-in-only exposure does not earn production branching. Never widen the renderer.

## Scope

**Owned:** `app/src/score/WindowRenderer.ts` (only if removing), a probe spec under `docs/prompts/runs/U110b/` or a committed browser case if the state is reached, `docs/08-score-render-states.md` invariant 40 if removing, `docs/08-test-map.md`, `docs/prompts/runs/U110b/`.

`operating-procedure.md` §14. Port **5473**, from a config copy under `app/build/u110b/`; `--workers=1`. Never name an AI model in any file.

## Record

lane: U110b · closes: — · entry: 222
index: The state that earns U110a's packing exception, reproduced in a real browser, or the exception removed (`U110b-the-earning-state-in-a-browser.md`) | app | drafted 2026-10-02 (`U110b-the-earning-state-in-a-browser.md`); Entry 222
in-flight: drafted 2026-10-02 (`U110b-the-earning-state-in-a-browser.md`): a fix-forward on U110a, the reviewer's required change; a browser probe of a height-only shrink after a spent ladder, or the exception removed (Entry 222)
state: drafted 2026-10-02: the reviewer's required change, dispatch under the accepted contract (Entry 222)
