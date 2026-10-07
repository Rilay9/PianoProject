# U110 review — bbbdffb0

Verdict: **APPROVE WITH ONE REQUIRED CHANGE**

Seam: U110, portrait score-row overlap at the frozen staff size.
Implementation reviewed: `bbbdffb0` (merged implementation `407d58e1`).
Immutable packet: `docs/review/handoffs/bbbdffb0.md`; evidence clarification: `docs/review/handoffs/06af14cd.md`.
Current-branch check: `28c7347a0d45a3fec92d84a8e271d901f6829724`; the reviewed renderer and window-rule test have no intervening changes, and this response filename was absent.

## Accepted correction

The zoom mismatch is a concrete cause, rather than the original stale-load premise. A fitting search can retain another engraving zoom while the transform still describes the tried zoom. Pricing that transform against the retained engraving height understates a row, grants an extra row, and can exhaust the reshape ladder while that grant is retained. Recording `drawnAtZoom` with `drawnRowPx`, and admitting `currentScale()` into pricing only when that zoom matches, closes that mismatch without shrinking the staff or changing the learner's requested window.

The Ode fresh/reload evidence, the guard-only red run, and the zoom-gate-only comparison support this mechanism. The added overlap observations and the named Ode fresh/reload/run regression are useful. The MutationObserver catches Ode's grants subsequently withdrawn; it is not a general proof of transient geometric safety during changing stage layout.

## One required change

**BLOCKS NEXT BRIEF — close U110's terminal-guard decision before treating this seam as approved.** This does not block the independent U122/CL07 chrome work.

In `app/src/score/WindowRenderer.ts`, `priceWindowShape` sets `aheadMeasured` from matching zoom/shape, a positive transform, and a positive `drawnRowPx`. However, `aheadFor` still prices each window row with the piece's tallest-system reserve. Only the ahead price is capped by the drawn-row measurement. Therefore this flag does not establish that the actual packed rows exceed the available stage.

After the ladder is spent, `settleShape` bypasses it whenever that flag is true and the requested slot count decreases. This treats a conservative admission refusal as proof that existing drawn read-ahead has no room. Its comment explicitly promises to distinguish those cases, but its predicate does not.

The recorded Twinkle 342×740 Bars 3 pricing trace provides a concrete counterexample to that distinction: at stage height 658, actual row packing totals 650 and fits; the conservative admission calculation is 660 and refuses the third row. The first-guard trace removes it. That trace predates the final narrowed guard, so I am not claiming a reviewer reproduction of the final build. The final narrowing nevertheless checks matching zoom/shape and positive measurements, which do not exclude this same fitting-versus-reserve-refusal mechanism. The subsequent smaller stage can genuinely need removal; those two states must not be conflated.

Resolve this narrowly: **prune the terminal exception and its `aheadMeasured` plumbing unless a residual post-zoom-gate overlap demonstrates its necessity.** If such a residual earns the exception, make it depend on actual unsafe packing at the unchanged window scale, and verify both the genuinely overflowing case and the fitting case rejected only by conservative admission pricing. Preserve the accepted conservative admission reserve; this finding does not ask for a new general fitting policy, staff shrink, another retry ladder, or broader renderer state.

The packet candidly reports that no test uniquely pins this guard and that removing it leaves the current tests green, including the additional height probes. That is evidence for pruning an unearned exception, not for keeping it because it is narrow.

## Evidence and limits

I inspected the immutable packet's implementation/test changes, Entry 212 and U110 run entry, the pricing and counterfactual logs, fresh/reload sweep and per-bar probe records, named screenshot artifacts, measurement scripts, final window-rule results, and the clarified chain record. This review uses their recorded execution evidence; I did not rerun the browser or unit suites.

The recorded sweep reports six overlapping loads before and zero after across 128 loads, with 120 geometries unchanged. Per-bar probes preserve the window scale and retain read-ahead where it fits. Those results support the zoom correction; they do not independently earn the terminal exception. The final window-rule file reports 20/20. The mapped browser lane reports 291 passed, one skipped; its observer draft and subsequent corrected file run must remain distinguishable. The unit lane reports 7,638 passes and four failures: two CRLF-sensitive assertions and two timeout failures which passed in the isolated run. Do not relabel that lane entirely green.

**LATER WAVE:** the recorded light contrast and rotated one-bar music-area red cells remain baseline issues with their existing owners. No fresh regression or universal fresh/reload identity claim is established here. Device and listening verification were not performed.

U110 owns row geometry at the frozen size. The next chrome brief should consume the accepted zoom correction and keep its own learner-facing responsibilities independent; it should not duplicate this overlap repair or imply approval of the terminal exception.
