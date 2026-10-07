# CI3 — Today's withdrawn row reads its reason whole on any face; CI's render check runs again

The brief is `docs/prompts/runs/curriculum-review-2026-10-05/briefs/ci-held-skip-red.md`. The E2E shard red since G90a's first run (2026-10-02) was a product fault: at 568 × 320 the session row's two-line clamp cut *Skipped — you put it away* on the runner's wider face, which this machine's face hid; told from a runner race by measuring every cell on both faces with and without a wait. Fixed at the mechanism in Today's running card; the spec now measures on a wider face too, as `plan.spec.ts` and `score.screen.spec.ts` do.

The harness is `operating-procedure.md` §13 and §14. Never name an AI model in any file.

## Record

lane: CI3 · closes: — · entry: 245
index: Today's withdrawn row reads *Skipped — you put it away* whole on any face (`data-withdrawn` on the row, the clamp lifted for that sentence); the G90a case green on both faces at the eight cells, twice; CI's render check no longer skipped (`CI3-held-skip-reason-whole.md`) | app | landed 2026-10-06 (`CI3-held-skip-reason-whole.md`); Entry 245
in-flight: landed 2026-10-06 (`CI3-held-skip-reason-whole.md`): a layout fault hidden by this machine's font; the spec measures on Verdana or DejaVu Sans as well (Entry 245)
state: landed 2026-10-06: in Entry 245's record commit; CI's run on that push is the proof (Entry 245)
