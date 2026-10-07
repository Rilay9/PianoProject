# Reviewer correction 2 — questions at `53147902`

This correction changes **only the T62 pre-review ruling** in `responses/questions-53147902.md`. The six seam responses and the test-map correction in `responses/questions-53147902-correction.md` stand.

## T62 correction 1 — shard **tests**, not specs

The earlier response repeated the brief's phrase “every E2E spec runs exactly once.” That is wrong for this repository's current Playwright configuration.

`app/playwright.config.ts` has `fullyParallel: true`. Under Playwright's sharding contract, `--shard=i/N` therefore distributes **individual tests** across shards, not whole spec files. A spec file may legitimately contribute different tests to more than one shard.

Correct acceptance rule:

- every base **test case / test id** in the unsharded collection is assigned to exactly one shard;
- no test id is omitted or assigned to two shards;
- retries are retries of that assigned test and do not count as duplicate assignment;
- spec filenames are not the unit of the coverage/uniqueness proof.

Rewrite the brief's list-and-compare guard, report and record language accordingly. Do not build a spec-filename union check and call it complete.

Use Playwright's shard-aware test identity/reporting rather than inventing identity from titles or filenames. Blob reports are the natural mechanism because they preserve sharded test results and attachments and are designed to merge after shards. An equivalent test-id reporter is acceptable if it proves the same test-level bijection.

This also carries U118a's diagnostic ruling cleanly: capture traces on the retry/failure path (with the current retry policy, `trace: 'on-first-retry'` is appropriate) and preserve each shard's report/trace artifact when a test fails or retries, so the post-shard diagnostics survive a red shard.

## T62 correction 2 — every shard is a fresh runner and needs the tree

The first T62 response corrected Job 3's fresh-runner state but omitted the same prerequisite for the matrix shards.

An `app/dist` artifact contains the built application, not `package.json`, `playwright.config.ts` or `tests/e2e/**`. Each shard must therefore:

1. check out the **same commit** as Job 1;
2. set up Node;
3. install the app dependencies;
4. restore Job 1's exact `app/dist` artifact;
5. install/restore Chromium;
6. run its assigned shard with the prebuilt-app flag so the web server serves the restored `dist` and does not rebuild it.

The checkout supplies test/config/source files; the same-run artifact supplies the exact built app bytes. Those are different contracts.

Job 3 likewise checks out the same commit and restores Job 1's generated `app/public/content` plus `build/render-manifest.json` (and any other exact generated input `render_check.py` consumes) as required by the original response. It must not silently regenerate a different content tree on the fresh runner.

## Corrected dispatch gate

T62 is **APPROVE FOR DISPATCH only after** the brief contains these two corrections in addition to sections A–D of `responses/questions-53147902.md`:

- domain-complete same-run state for the post-render/validate job;
- current failure/previews diagnostics preserved across job boundaries;
- an executable disposable-branch proof route;
- U118a traces and the near-timeout observation folded into the proof runs;
- **test-level**, not spec-level, shard coverage/uniqueness;
- checkout/runtime setup in every fresh shard job.

No new product decision is introduced; this corrects the CI architecture and proof contract before dispatch.