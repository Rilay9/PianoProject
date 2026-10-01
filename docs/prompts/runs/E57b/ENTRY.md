### Entry 200 — E57b — rock.7 back within the reading limit by the reviewer's three-word cut: "on this track" removed from its first sentence, its reading time back to three minutes, and E57a's long-lesson exception and its docs note rolled back (2026-10-01)

**Base.** `d3fe19d4`, checked first (`git log -1 --format=%h`). The brief is `docs/prompts/tasks/E57b-rock7-within-the-reading-limit.md`, read from the main checkout (read only; it is not at this base). It is the fast path (`operating-procedure.md` §11) on E57a's verdict `docs/review/responses/1befd3e1.md`, whose required change it quotes verbatim. Nothing committed, staged, stashed, reset or checked out. Every run on 2026-10-01.

**Product layer, first.** I opened no screen. What a learner reads was read in the lesson source, in the built lesson (`app/public/content/lessons/rock.7.md` after the build, since deleted) and through the test's word count. Nothing here is heard, and nothing here asks for listening.

## Judgement

- **What a learner reads.** Before: "Every texture on this track so far has been something to hold steady. This rung is about the opposite: making a passage grow." After: "Every texture so far has been something to hold steady. This rung is about the opposite: making a passage grow." The first sentence is three words shorter. Nothing else in the lesson changed.
- **Reading time.** `readingTime` changes from 4 to 3. No learner surface shows it: it has no reader under `app/src` (grep), and it does not appear in the built `curriculum.json` or `catalog.json` (grep). The only place it appears is the built lesson file's front matter.
- **Length.** By `lessonShape.test.ts`'s own count (front matter stripped, whitespace split), the body is 603 words before the cut and 600 after (`ceil(600 / 200) = 3`). It is back within the three-minute rule with no exception. The rule and its two named exceptions (`ragtime.6`, `classical.6`) are as they were before E57a. `docs/03` §6 says "Two lessons are longer" again, and that matches the test.
- **Pedagogically**, read as text: this is the reviewer's own cut. It sits outside every reviewer-approved sentence and changes no taught claim. One observation, not a fault: without "on this track", the scope of "so far" now comes from where the lesson sits (the rock track, rung 7).
- **Mechanism.** No code fault. E57a's approved tempo sentences took the body to 603 words. This cut brings it back under the existing 600-word line, so rock.7 no longer needs a named exception. The discriminating cases are the two `lessonShape` reading-time cases. They are red with the three words back in and green with them cut (the mutant, below).

## Content (itemised)

| file:line | before | after | why |
| --- | --- | --- | --- |
| `content/lessons/rock.7.md`:9 | `readingTime: 4` | `readingTime: 3` | 600 words is three minutes at 200 a minute (`responses/1befd3e1.md`: "Restore `readingTime: 3`") |
| `content/lessons/rock.7.md`:12 | "Every texture on this track so far has been something to hold steady." | "Every texture so far has been something to hold steady." | the reviewer's required three-word cut, verbatim (`responses/1befd3e1.md`) |

The other two changes are not content. `app/tests/unit/lessonShape.test.ts`:262–264: `'rock.7.md'` and E57a's two comment lines are removed from `KNOWN_LONG`, so the set is `['ragtime.6.md', 'classical.6.md']` again. `docs/03-content-pipeline.md`:1044–1048: E57a's whole italic note is removed, and nothing around it.

## Done

- **Premises verified before any edit.** "on this track " occurs once in `rock.7.md` (line 12). The body is 603 words before and 600 after, counted the way the test counts. Both brief premises hold.
- **Four edits**, as itemised above. `git diff --stat`: 3 files, 3 insertions, 10 deletions.
- **Setup** (`scripts-setup.ps1`, `setup.txt`). E57a's setup was copied. The fetched libraries and the build caches were copied read-only from the main checkout (robocopy exit 1 four times, meaning files were copied). The four files the build rewrites were snapshotted first. `npm ci` exit 0.
- **Content build**: `python tools/content/build.py --offline`, exit 0 (`content-build.txt`). The built `rock.7.md` carries the cut and `readingTime: 3`. The build also rewrote three tracked files for environmental reasons: `content/scores/imported/SOURCES.md` (fetch time, and revision `n/a` because the copied libraries have no `.git`), plus a line-ending-only rewrite of `docs/prompts/inventory.md` and of `docs/prompts/rung-claims.md`. All three were restored byte for byte from the pre-build snapshot. `docs/generated/ladder.md` came out unchanged.
- **Targeted unit**: `npx vitest run tests/unit/lessonShape.test.ts tests/unit/lessonClaimsAboutMusic.test.ts tests/unit/docsConsistency.test.ts` from `app/`, exit 0, 3 files, 210 tests passed (`vitest-targeted.txt`).
- **Mutant** (`scripts-mutant.mjs`, `mutant.txt`). With "on this track " put back in, the body is 603 words and `lessonShape` exits 1 with 2 failed, both on rock.7. One says "rock.7.md says 3 min for 603 words (4)"; the other says "rock.7.md reads in 4 min" and that it is not on the list. The cut file was then restored, bytes identical.
- **Path map**: `python tools/docs/checks_for_paths.py` on the three changed paths, exit 0, 3 matched, 0 unmatched (`checks-for-paths.txt`). The union is: content-build, content-validate, review-check, content-tests, tsc, lint, unit (whole suite, from `content/**`), build-app, and e2e on the five lesson specs (`content/lessons/**`, the owner's 2026-09-27 rule that a lesson edit is covered by the lesson specs).
- **Deviation, said.** The brief's premise was "no browser spec maps to these paths unless the map says otherwise". The map names the five lesson specs, so they were run on the lane's own port per §14. `npm run build:app` exit 0, which includes `tsc -b` (`build-app.txt`). The specs were `lesson-flow`, `lesson-tools`, `plan`, `side-panel-prose` and `start-and-return`, each file confirmed present first. They ran on port 4672 from a config copy (`scripts-playwright.e57b.config.ts`), `--workers=4`, exit 0, 45 passed. Per spec that is 1, 4, 28, 4 and 8, the same counts as E57a's run of these five (`e2e.txt`).
- **Also run, from the map**: `npx vitest run tests/unit/libraryImportWords.test.ts`, the other unit file the map ties to `docs/03`, exit 0, 11 passed (`vitest-libraryImportWords.txt`). `npx eslint tests/unit/lessonShape.test.ts`, exit 0 (`lint.txt`, empty).
- **Cleanup** (`cleanup.txt`). `app/dist`, `app/test-results`, the config copy, the built content, the copied libraries and caches, and the worktree's `build/` were all deleted. `app/node_modules` is kept.

## Not done

- These map checks were not run here and are left to the landing chain: `python tools/content/validate.py`, `python tools/content/review.py --check`, the Python content suite (`unittest discover -s tools/content/tests`), the whole `npx vitest run`, and the whole `npm run lint`.

## Files

- Changed: `content/lessons/rock.7.md`, `app/tests/unit/lessonShape.test.ts`, `docs/03-content-pipeline.md`.
- Kept under `docs/prompts/runs/E57b/`: `ENTRY.md`, `scripts-setup.ps1`, `scripts-mutant.mjs`, `scripts-collect-logs.mjs`, `scripts-playwright.e57b.config.ts`, `setup.txt`, `content-build.txt`, `content-build.stderr.txt` (empty), `vitest-targeted.txt`, `vitest-libraryImportWords.txt`, `mutant.txt`, `checks-for-paths.txt`, `build-app.txt`, `e2e.txt`, `lint.txt` (empty), `cleanup.txt`. The logs had machine paths replaced by `<worktree>` and `<home>` and were then scanned; no machine path remains.

**`git status --short`** at the end:

```
 M app/tests/unit/lessonShape.test.ts
 M content/lessons/rock.7.md
 M docs/03-content-pipeline.md
?? docs/prompts/runs/E57b/
```
