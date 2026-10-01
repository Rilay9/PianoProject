# Proof run B (a deliberately failing test): run 36891546409 on proof/t62-ci-shards at c969ea7d

- Pushed while run A was in progress: it stayed pending until A completed (A completed 17:27:05; B's first job started 17:27:09) and did not cancel A. The queue rule holds on the new graph.
- Conclusion: failure, as intended. Content and unit tests success (41.6 min); shards 1-7 success; shard 8 failure.
- The planted test, t62-proof-failure.spec.ts:9, failed on its first attempt and on its retry, in shard 8.
- Render check and validate: skipped (an ordinary needs on the shards), as today's single job skips Render and Validate after a browser failure. No content-previews: none exist at that point, as today.
- E2E test-id coverage: success, it ran on the red run. "OK: each of the 897 tests in the collection was given to exactly one shard and reported a result there." Shard 1 was given 113 tests (the planted test shifted the split), the others 112.
- Diagnostics kept: e2e-blob-report-8-of-8 and e2e-test-results-8-of-8 uploaded from the red shard (also 5 and 7, which retried).
- A second, real failure in shard 8: wide.spec.ts:428 "every screen is centred and capped" failed on both attempts for tablet-portrait and tablet-landscape (laptop-1536 failed, then passed on retry). The error: the skills screen never mounted within the test's own 60 s wait (wide.spec.ts:146). Run A passed this test on the same code. It has been red before on the single job and was written off as load (the T58 note). Shard 8 carries the heaviest specs (wide, sweeps, window-rule), by Playwright's count-based split. The retry's trace is in e2e-test-results-8-of-8. Unread here: whether the heavier shard is what tipped it.
- score.sheet-rows.spec.ts:170: passed first attempt in 16.1 s (shard 6 in this run).
