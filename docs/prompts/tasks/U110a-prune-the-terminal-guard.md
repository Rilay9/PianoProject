# U110a — the window renderer's terminal exception pruned unless a residual overlap earns it (a fix-forward on U110)

Labels: **VERIFIED**, **SETTLED**, **HYPOTHESIS**, **OPEN**, **OUT OF SCOPE**, as in `CL11-what-counts-as-evidence-traced-and-decided.md`.

## Problem

U110 fixed upright row overlap at the frozen size: a slot was priced from a zoom the search had only tried, and that is now gated. It also added a terminal exception. Once the reshape ladder is spent, `settleShape` drops a look-ahead slot whenever `aheadMeasured` is true and the requested slot count falls. That flag says the look-ahead row was measured. It does not say the packed rows overflow the stage. So a fitting window, refused only by the conservative admission reserve, can lose read-ahead the learner had room for.

## Current evidence

- **SETTLED** (`responses/bbbdffb0.md`, APPROVE WITH ONE REQUIRED CHANGE): the zoom gate stands (`drawnAtZoom` with `drawnRowPx`; `currentScale()` priced only at a matching zoom). The terminal exception and its `aheadMeasured` plumbing are pruned unless a residual overlap after the zoom gate shows they are needed. If one does, the exception must depend on actual unsafe packing at the unchanged window scale. The conservative admission reserve stays.
- **VERIFIED** (the orchestrator, at this tree): the sites are `app/src/score/WindowRenderer.ts` :1800, :1828, :2091, :2119, :2224–2248.
- **The reviewer's counterexample**, from U110's recorded pricing trace (the first guard; it predates the final narrowing): Twinkle, 342 × 740, Bars 3, a stage 658 tall. The rows pack to 650 and fit; admission prices 660 and refuses the third row.
- **VERIFIED** (U110's handoff): no test uniquely pins the exception. Removing it leaves the current tests green, the extra height probes included.

## What to do

1. **Second read first:** check the reviewer's reading against the code. If the code shows the reviewer wrong, stop and say why, with the lines.
2. **Prune** the exception and its plumbing.
3. **Rerun U110's own instruments** on the pruned build:
   - the fresh and reload sweep (128 loads);
   - the per-bar probes;
   - the named Ode regression;
   - the window-rule file.
4. **Then decide:**
   - **No residual overlap:** the pruning stands. Add one case that fails if a fitting window refused only by admission pricing loses its read-ahead after the ladder (Twinkle 342 × 740 Bars 3, or the case the trace shows).
   - **A residual overlap:** keep a narrowed exception keyed on actual packing at the unchanged scale. Prove both cases: the genuinely overflowing one and the fitting one.

## Scope

**Owned:** `app/src/score/WindowRenderer.ts`, its unit and window-rule tests, `docs/08-test-map.md` if a row changes, `docs/prompts/runs/U110a/`.

**OUT OF SCOPE:** a new fitting policy, a staff shrink, another retry ladder, broader renderer state, the Score chrome (U122c), the Moonlight freeze (U35).

## Stop and hand back if

- the second read shows the reviewer's reading wrong;
- a residual overlap appears whose fix needs more than the narrowed exception.

## Handoff

Judgement first. Then:
- the sweep counts before and after, counted from the logs;
- red first, where a case is new;
- one mutant;
- the scope of every "all" or "none".

Built by the outside builder on `chatgpt/u110a`. The checks it cannot run are run by the orchestrator on its branch head, on request (`docs/review/reviewer-context.md`, Build requests). Never name an AI model in any file.

**Landed 2026-10-02** (Entry 218; eddd5c95, merged 024c5883); handoff `handoffs/eddd5c95.md`.

## Record

lane: U110a · closes: — · entry: 218
index: The window renderer's terminal exception pruned unless a residual overlap earns it, U110's required change (`U110a-prune-the-terminal-guard.md`) | app | drafted 2026-10-02 (`U110a-prune-the-terminal-guard.md`); Entry 218
in-flight: drafted 2026-10-02 (`U110a-prune-the-terminal-guard.md`): a fix-forward on U110, the reviewer's required change; second read, prune, U110's instruments rerun (Entry 218)
state: dispatched 2026-10-02: dispatched at 345ffda4, finishing here from the outside builder's pruning at f11cd7c6 (Entry 218)
- landed 2026-10-02: merged 024c5883; handoff `handoffs/eddd5c95.md`
