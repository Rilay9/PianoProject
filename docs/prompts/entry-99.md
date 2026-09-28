### Entry 99 — D2a: the microscope's projection moves out of `content/` to a builder-only `app/public/dev/review/microscope.json`, so the offline invariant P19 stays literal with no exception; the case red on the committed tree in CI's own words and green after, beside an added `dev/` case red first and held by a glob mutant (2026-09-27)

**Judgement.** This is plumbing: no learner screen changed, and there is nothing to hear or judge as music. The builder's screen was checked by `microscope.spec.ts` (four cases: the item drawn and settled, every fact under its hook, Hear it through the app's piano, a decision exported and merged), not looked at by a person.

- **P19 on the committed tree**, rebuilt in this worktree (`red-e2e-committed.txt`): `offline.spec.ts:302 › and nothing under content/ is served without being precached (P19)` red, "1 file(s) are served but never cached", and the received list is `"content/review/microscope.json"`. That is CI run 36361532736's failure word for word (`ci-36361532736-log-failed.txt`).
- **P19 after the move** (`run-e2e-final.txt`): green, and the case's text is unchanged. There is no exception in it. The projection now lives under `dev/`, and the walk over `dist/content` finds nothing uncached.
- **The microscope works as before:** 4 of 4 green at two workers alongside the whole offline spec (12 passed, exit 0). The projection at the new path is byte-identical to the one the committed build wrote at the old path (`compare-builds.txt`).

## The mechanism, and the test that told it apart

**Cause.** D2's reports step wrote the projection into the built content (`out_dir / review/microscope.json`), and `globIgnores: 'content/review/**'` kept it out of the precache. P19 walks every file under `dist/content` and requires each one in the manifest, so that file was the one served and never cached. **Alternative:** some other new file under `content/`. CI's list and the local list each name exactly one file, the projection, so the alternative is ruled out.

**The premise, corrected in one line:** the path was set in `review.py` (`MICROSCOPE_FILE`, `write_microscope(out_dir, …)`), not in `build.py`. So the move is made there: `dev_root(out_dir) = out_dir.parent / "dev"`, which is `app/public/dev` for the default build. The identities are still read from `out_dir`. `step_reports` also deletes the copy D2 left at the old path, because a checkout built before D2a keeps it otherwise. The main checkout has one now (seen with `ls`), and that copy would keep a local P19 red until the next build.

**The fetch:** `devUrl()` is a local helper in `DevMicroscopeScreen.ts`, base-aware in the same way `contentUrl` is. I kept it in the screen because the screen is its only consumer and a builder screen, so `curriculum/load.ts`, the learner's loader, stays untouched.

**The ignore pattern moved:** `globIgnores: ['**/node_modules/**/*', 'dev/**']`, and the learner globs are untouched. No learner glob reaches a `.json` under `dev/` today, so the ignore shows up only under a mutant (below).

## The red lines

- **`red-e2e-committed.txt`** (the committed app and build, with the added case already written; exit 1):
  - P19 red as above.
  - The added `dev/` case red: "the microscope projection is not served under dev/".
  - `offline.spec.ts:53` red. This one is unrelated; see Unverified item 2.
- **`red-record-test-old-path.txt`** (the moved build, `test_review_record.py` not yet revised; exit 1): `test_the_screen_reads_the_same_queue` fails with "…\app\public\content\review\microscope.json is missing".
- **`red-e2e-old-fetch.txt`** (the moved build and the committed screen; exit 1): all four microscope cases red. The screen reads "Could not load: Unexpected token '<', "<!doctype "... is not valid JSON" because vite preview answers the missing old path with the app's index page. P19 and the `dev/` case are green in the same run.
- **The glob mutants** (`scripts/mutate_vite.py`; `vite.config.ts` restored byte for byte after each):
  - **First glob widened to `.json`, `dev/**` dropped** (`mutant-widened-no-ignore.txt`): `dist/sw.js` names `dev/review/microscope.json`, and the `dev/` case goes red with "1 file(s) under dev/ are precached", `+ "dev/review/microscope.json"`.
  - **The same widened glob with `dev/**` kept** (`mutant-widened-ignore.txt`): the manifest does not name the file, and both cases are green. So the ignore is what keeps `dev/` out.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `offline.spec.ts` › *and nothing under content/ is served without being precached (P19)* | preserve, untouched | — | red on the committed tree, green after |
| `offline.spec.ts` › *and the builder-only dev/ root is served and never precached (D2a)* | add (plus `existsSync` in the import line) | — | the projection is served under `dev/` and no manifest URL starts with `dev/`; red first on the committed tree and under the first mutant |
| `test_review_record.py` › `test_the_screen_reads_the_same_queue`, and `built()` gains a `root` | revise | the projection lives in the built content | reads `review.dev_root(BUILT) / review.MICROSCOPE_FILE` |
| `microscope.spec.ts` | preserve, untouched | — | red with the old fetch, green after |
| every other case in the two specs, `reviewRecord.test.ts`, `microscopeRoute.test.ts` | preserve | — | green |

## Checks (unpiped; exit codes read)

**Setup:**
- The main checkout's `kern` and `musetrainer` libraries (without their version-control folders), `build/cache/convert` and `build/demands-cache.json` copied in (`run-copy-setup.txt`): 0.
- `npm ci`: 0. The parity reference: 0.

**Content builds:**
- **`build.py --offline`, committed tree: 0** (`run-build-committed.txt`).
- **`build.py --offline`, final tree: 0** (`run-build.txt`). The reports line and the validation line match the committed build's.
- After each build, `SOURCES.md` was restored, and `docs/prompts/rung-claims.md` and `inventory.md` got their checkout line endings back. Their text was HEAD's both times (`scripts/restore_reports.py`).
- **The build's reviewed facts are unchanged.** `catalog.json` is byte-identical to the committed build's except for the build-time `fetchedAt` stamp on the 227 MuseTrainer items. Putting the committed build's stamp in place of the final build's gives the committed build's sha256 (`compare-catalog-modulo-fetched-at.txt`). `curriculum.json` and the projection are byte-identical.

**Record and app checks:**
- `test_review_record.py`: 0, 16 OK (`run-record-test.txt`).
- `review.py --check`: 0.
- Vitest on `reviewRecord.test.ts` and `microscopeRoute.test.ts`: 0, 21 passed.
- `npx tsc -b`: 0. `npm run lint`: 0.
- `npm run build:app`, with no preview running each time: 0. The manifest has the same entry count as the committed build's, and `dist/sw.js` names nothing under `dev/`.

**Playwright** (port 4193, two workers, `pw/playwright.d2a-4193.config.ts`, copied from D2's):
- **Final run: exit 0, 12 passed** (`run-e2e-final.txt`).
- An earlier run on the same final build had exit 1 (`run-e2e.txt`): the microscope's merge case exceeded its 30 s timeout while the whole machine was slow (every microscope case in that run took several times as long as in the other runs). Rerun alone, it passed: exit 0, 4 passed (`run-e2e-microscope-rerun.txt`). I read that as load. `offline.spec.ts:53` also failed in that run (Unverified item 2).

## Unverified, beside what passes

1. **Nothing looked at or heard by a person.** The screen's working is the spec's four cases.
2. **`offline.spec.ts:53` (*the whole app works with the network off*) is intermittent here, and not this seam's.** It failed on the committed tree at two workers, again alone at one worker (`probe-offline-launch-alone-committed.txt`), and on the final tree once. It passed in the final run. Every failure is Diagnostics still "Checking…" at 30 s. `pending-review.md` records two earlier sightings of the same message. No mechanism is claimed. My hypothesis is that Diagnostics' per-file `caches.match(…, {ignoreSearch: true})` over about 2,000 files can overrun 30 s on a contended machine. It passed in CI on 85b7b2c.
3. **The `--out DIR` placement (`dev/` beside `DIR`) comes from reading the code, not from a run.** No caller passes `--out`, as far as a search of `tools/`, `.github/` and `app/package.json` shows.
4. **CI has not run this tree.**

**Entry 95, a note rather than an edit:** its §"Four things the reviewer should hear first" item 4 says the reports step writes `content/review/microscope.json`. Since D2a it writes `app/public/dev/review/microscope.json`, and the reviewer's constraint (`responses/7e148e0.md`: generated, builder-only in use, excluded from the learner precache) still holds.

## Not done

Nothing in the brief. Items 1–4 are done, and item 5 was left alone.

## Follow-ups

- **P3, the orchestrator's checkout.** The main checkout still holds `app/public/content/review/microscope.json` from D2. The next content build there deletes it. Until then a local P19 there is red for that file alone.
- **P3, the screen's missing-data message.** Under vite preview a missing projection comes back as the app's index page with a 200 status. The builder then reads "Unexpected token '<'…" rather than "run the content build". This was already true at the old path, as the red shows. It is not this seam's.
- **P3, `offline.spec.ts:53` locally** (Unverified item 2).

## Questions

None.

## Files

In the worktree `C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a934668f5f0f08405`, uncommitted:
- `.gitignore`: `app/public/dev/*`.
- `tools/content/review.py`: `dev_root`, `write_microscope`'s path, the comment on `MICROSCOPE_FILE`.
- `tools/content/build.py`: `step_reports`'s docstring and comment, and the removal of the stale old-path copy.
- `app/vite.config.ts`: the `globIgnores` pattern and its comment.
- `app/src/ui/screens/DevMicroscopeScreen.ts`: `devUrl` and the fetch.
- `app/tests/e2e/offline.spec.ts`: the added case and the `existsSync` import.
- `tools/content/tests/test_review_record.py`: `built()`'s `root` and the one revised case.
- `docs/03-content-pipeline.md`: §3 step 8a and §4b.
- `docs/08-test-map.md`: the D2 row, the `offline.spec.ts` line, the `test_review_record.py` line.

**Outside the brief's list, and why:**
- `review.py`, because the path lived there.
- `test_review_record.py`, because its case read the old path. The brief's item 3 asks for the record tests green on the moved path.

**Beside this entry:**
- Captures: `red-*.txt`, `run-*.txt`, `mutant-*.txt`, `probe-offline-launch-alone-committed.txt`, `compare-*.txt`, `ci-36361532736-log-failed.txt`, `d2a.diff`.
- Scripts: `scripts/` (`splice.py`, `copy_setup.py`, `restore_sources.py`, `restore_reports.py`, `make_pw.py`, `mutate_vite.py`, `compare_builds.py`, `catalog_modulo_fetched_at.py`), and the edit files in `edits/`.
- The Playwright config and storage state: `pw/`.
