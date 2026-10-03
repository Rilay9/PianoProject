# Proof run A (clean): run 36891507016 on proof/t62-ci-shards at e37bf9e2

- Conclusion: success. Whole run 16:22:32 to 17:27:05 UTC, about 64.5 min (the baseline on 13e1b1a8 was 76m6s; another baseline run 93m47s; one run each, the runner's load varies).
- Content and unit tests: 43.5 min, the critical path (Build content 13.7, Content pipeline tests 11.7, Unit tests 10.6, Build 5.1; each longer than the baseline's same step on this run).
- E2E shards, all success, all started 17:06: 1/8 4.2 min, 2/8 3.6, 3/8 4.9, 4/8 11.2, 5/8 5.3, 6/8 7.0, 7/8 10.0, 8/8 19.2 (the heaviest, as the builder's simulation said).
- E2E test-id coverage: success. Each shard given 112 tests. "OK: each of the 896 tests in the collection was given to exactly one shard and reported a result there."
- Render check and validate: success, 1.75 min. "rendered 2013/2013 item(s): 0 fresh, 2013 from the manifest"; validate OK (2092 catalog items).
- content-previews: "No files were found with the provided path: build/previews". The last working-branch success run (36882948290) printed the same line: nothing fresh rendered, so no previews, as today.
- Retried and passed (flaky): wide.spec.ts:505 (shard 8, 1.6 min retry), score.strip-span chopin-scherzo-2 (shard 7), projects.spec.ts:110 and score.fuzz seed 4 (shard 5). Their test-results artifacts uploaded (shards 5, 7, 8).
- score.sheet-rows.spec.ts:170: passed first attempt in 16.1 s (it was 29.1 s on a retry, and timed out at 30 s, on 53147902's single job).
- Concurrency: run B (c969ea7d), pushed while A was in progress, stayed pending until A completed; it did not cancel A.
- Artifacts: app-dist, content-and-render-state, eight e2e-blob-report-i-of-8, e2e-test-results for shards 5, 7, 8.
