# D2a — The microscope's projection moves out of `content/`, so the offline invariant stays literal (a fix-forward on D2 from CI, 2026-09-27)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; the CI run 36361532736 on 85b7b2c (`gh run view 36361532736 --log-failed`): `tests/e2e/offline.spec.ts:302 › and nothing under content/ is served without being precached (P19)` red twice with "1 file(s) are served but never cached"; `app/tests/e2e/offline.spec.ts` lines 302–321 (the case walks every file under `dist/content` and requires each in the service worker's precache manifest — "the one that catches a new kind of file rather than a new file … so the fifth directory does not need to be thought of"); `docs/prompts/entry-95.md` §"Four things to hear first" item 4 and `docs/review/responses/7e148e0.md` (the projection is acceptable and "must remain generated, builder-only in use, and excluded from the learner precache as it is here"); `tools/content/build.py` (`step_reports` writing `app/public/content/review/microscope.json`), `app/vite.config.ts` (the `globIgnores` line), `app/src/ui/screens/DevMicroscopeScreen.ts` line 133 (`fetch(contentUrl('review/microscope.json'))`), `.gitignore` line 12 (`app/public/content/*`), `docs/03-content-pipeline.md` §4b, `docs/08-test-map.md`.

## The goal, in the orchestrator's words

D2 was right to keep the 2.6 MB builder-only projection out of the learner's precache, and the offline invariant is right to refuse any file under `content/` that is served but never cached: P19 exists so that a new kind of content file cannot slip past the offline promise. Both hold at once when the projection does not live under `content/`. After D2a the build writes it to a builder-only path outside `content/`, the screen reads it there, the precache still excludes it, the offline case is green with no exception added to it, and the microscope works as before.

## What is decided

1. **The path:** `app/public/dev/review/microscope.json` (a `dev/` root beside `content/`, for builder-only artefacts), gitignored (`app/public/dev/*`), written by `step_reports`, excluded from the precache by the same `globIgnores` mechanism (the pattern moved), fetched by the screen from that URL (a small helper beside `contentUrl`, or the base-aware equivalent — the builder's call, said in a line). No file under `dist/content` is left uncached.
2. **No exception in P19.** The offline case is untouched; it is the red line (red on the committed tree by CI's own run, green after the move on the builder's build). A second assertion may be added beside it: the `dev/` root is served and not precached, so the invariant's other half is stated too.
3. **The microscope spec and the record tests green** on the moved path; `--check`, `--merge` and the build's reviewed facts unchanged.
4. **Record:** `docs/03` §4b names the path; `docs/08`'s D2 row corrected; Entry 95's path sentence gets a one-line note in this seam's entry, not an edit.
5. **Not D2a's:** anything else about the microscope, the record, the report, or the precache.

## Rules and files

You own `tools/content/build.py` at the projection's path, `app/vite.config.ts` at the ignore pattern, `app/src/ui/screens/DevMicroscopeScreen.ts` at the fetch, `.gitignore`, `app/tests/e2e/offline.spec.ts` only to add the `dev/` assertion, `docs/03`, `docs/08`. Never name an AI model. Never assert a number measured on this machine. Every change red first; every touched test classified. Runs unpiped: the content build (offline; the import libraries, `build/cache/convert` and `build/demands-cache.json` copied from the main checkout as E0b's brief describes; `SOURCES.md` restored), then from `app/` (`npm ci`, the parity reference first) `npx tsc -b`, `npm run lint`, `npm run build:app` (no preview running), and `offline.spec.ts` plus `microscope.spec.ts` on port 4193 with two workers using an override config (H0's Entry 87 §"Port override"; D2's scratch config may still be under `…\scratchpad\D2\pw\`). Ports 4173 and 4183 are other builders'. No commits, no push, no stash, never `git add`. Your entry as `ENTRY.md` in your scratch folder, headed "### Entry 99 — D2a: …", short, in the shape of Entry 91.

## When to deviate

If the service worker's precache cannot be told to skip a `dev/` root without touching the learner paths' globs, say so and keep the ignore pattern narrow to the one file.

## Report

Judgement first: the offline case's red on the committed tree and green after, in its own words; then Done / Not done / Follow-ups / Questions / Files; exit codes; unverified beside what passes.

**Delivered 2026-09-27**, Entry 99, in an isolated worktree: the move, the `dev/` case, the stale copy deleted by the build; the catalogue byte-identical but for the build-time stamp; `review.py` and `test_review_record.py` touched outside the list because the path lived there. Found: `offline.spec.ts:53` intermittent on this machine (Diagnostics' per-file cache check over about 2,000 files past 30 s under load; green in CI) — Q48's shape.

**Accepted by the reviewer 2026-09-27** (`responses/b118750.md`): closed; the builder screen's error text when the projection is absent noted as a later-wave item.

