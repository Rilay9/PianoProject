# T24 — A perfect performance through every item, and the expected answer through every drill

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/05-score-follow-engine.md`, `docs/08-test-map.md` (the corpus and
sequence specs, which do this for thirteen pieces in a browser), and
`app/tests/unit/swingJudging.test.ts` and `tradingFours.test.ts` (synthetic performances
through the real engine) first.**

## Why

A learner meets a fault the readers cannot see when the engine and the score disagree: a
tie stepped as two notes, a tuplet's onsets off the grid, a repeat that never returns, a
grace note that waits for a key, a pickup counted as a full bar, a drill whose expected
answer is unreachable. The whole-song browser spec covers thirteen pieces; the catalog
holds 2,061 items and 71 drills.

## Build

1. **`app/tests/unit/perfectPerformance.test.ts`** (or a small harness plus a test):
   for every catalog item with a score file, build the score model the app builds
   (`extractScoreModel` on the MusicXML, the way the golden fixtures are made), run
   `prepareSession` and the practice engine in Keep-tempo at the written tempo, feed every
   expected note at exactly its expected time with a nominal velocity and release, and
   assert: the run finishes, accuracy is 100 %, tempo is 100 %, and the pass is `true`
   under the item's rung thresholds where it has a rung. Repeats, endings, pickups and
   tempo changes are part of the run, not skipped. Run it as one test per item so the
   report names the item; keep it under the suite's time budget (measure; shard by id
   prefix if needed, and say the wall time).
2. **The same in Wait mode**: every expected note in order, and the run advances to the
   end.
3. **Every drill**: for each of the 71 `drill.*` catalog rows, build the drill through
   `fromCatalog`, and for each prompt feed exactly its expected answer; assert every prompt
   is judged correct and the drill completes. Simon: play the chain back after the
   answer window opens (Entry 49's rule).
4. **For every item that fails**, the reason at the branch: engine, extraction, or the
   file. Fix the engine or the extraction with a red test if the fault is theirs (say the
   line); record file faults per item in the entry for a follow-up, and add them to
   `content/score-checks.allow.json` only with a reason.

## Rules

- Files: `app/tests/unit/**`, `app/src/engine/**`, `app/src/score/**`, `docs/05`, one
  appended entry in `docs/pending-review.md` (Entry 50). Do not edit `content/` (another
  agent is splicing levels there); record content faults instead.
- `npx tsc -b`, `npm run lint`, `npx vitest run`. No Playwright, no port 4173, no content
  build. Never name an AI model. Commit nothing. An absence needs two searches; a plural
  is several claims; nothing is heard — a perfect synthetic performance proves the engine
  can follow the file, not that the file is music.
- Every item and drill gets a pass line or a named failure. Never stop silently; keep a
  handoff file current in your scratch folder.

## Final message

Items run, passed, failed by cause; drills run, passed, failed; engine fixes with red
lines; wall time; what is unverified.
