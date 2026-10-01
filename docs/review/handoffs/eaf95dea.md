# Reviewer handoff — E57b: rock.7 back within the reading limit by the reviewer's three-word cut: “on this track” removed from its first sentence, its reading time back to three minutes, and E57a's long-lesson exception and its docs note rolled back (2026-10-01) (Entry 200)

Implementation HEAD: eaf95dea (merged at 0aa847ed; the entry and this handoff in the record commit at HEAD). Respond in `responses/eaf95dea.md`. Built under the reviewer's required change on E57a (`responses/1befd3e1.md`, dispatched 2026-10-01 at `d3fe19d4`): cut exactly “on this track” from rock.7's first sentence rather than keep a permanent `KNOWN_LONG`/four-minute exception for three words, restore `readingTime: 3`, remove `rock.7.md` from `KNOWN_LONG` and the E57a docs note, and keep the ordinary 600-word rule intact; the restraint-sentence pronoun's naming and Piano Man's “ballad” label are confirmed in the same ruling and are not this lane's.; a narrow fix-forward under 788427c, dispatched with a for-information line.

## What is asked

The builder's points, in brief:

1. Rock.7's first sentence loses exactly the reviewer's three words (“on this track ”), its only occurrence before the cut; nothing else in the lesson changes.
2. `readingTime` reverts to 3; `KNOWN_LONG` drops `rock.7.md` and E57a's two comment lines, back to its two named exceptions; E57a's docs note is removed outright, nothing around it touched.
3. The body is 603 words before the cut and 600 after, by `lessonShape.test.ts`'s own count — back inside the ordinary 600-word rule, no exception needed.
4. The targeted unit files, the mutant (the three words put back turns `lessonShape` red on rock.7, then restored), the map's five named lesson browser specs, `npm run build:app` and `checks_for_paths.py` are all green on the builder's own tree; the whole suites are left to the landing chain.

No question is asked of the reviewer; one observation, raised for confirmation or dismissal, follows below.

**What a learner reads.** No screen was opened and nothing was heard; what changes is read in the lesson source and through the test's own word count. Before: “Every texture on this track so far has been something to hold steady. This rung is about the opposite: making a passage grow.” After: “Every texture so far has been something to hold steady. This rung is about the opposite: making a passage grow.” The first sentence is three words shorter; nothing else in the lesson changes. `readingTime` moves from 4 to 3, which no learner surface shows (it has no reader under `app/src`, and does not appear in the built `curriculum.json` or `catalog.json`; the only place it appears is the built lesson file's own front matter).

**The mechanism.** No code fault. E57a's approved tempo sentences took the body to 603 words, three past the existing 600-word, three-minute line `lessonShape.test.ts` holds every lesson to (`ceil(words / 200)`); this cut brings it back under that line, so rock.7 no longer needs `KNOWN_LONG`'s exception. The discriminating cases are the two `lessonShape` reading-time assertions on rock.7: red with “on this track ” put back, green with it cut — the mutant, below.

**Pedagogically, read as text.** This is the reviewer's own cut, outside every reviewer-approved sentence, and changes no taught claim.

**The mutant.** With “on this track ” restored, the body is 603 words and `lessonShape` exits 1 with 2 failed, both on rock.7 (one naming 603 words at three minutes against the recorded 4, one naming a 4-minute read absent from `KNOWN_LONG`); the file was then restored, bytes identical to the landed cut.

**Exit codes, in short.** The targeted unit files (`lessonShape.test.ts`, `lessonClaimsAboutMusic.test.ts`, `docsConsistency.test.ts`): 0, 210 passed. The map's other named unit file (`libraryImportWords.test.ts`): 0, 11 passed. `eslint` on the changed test file: 0. `checks_for_paths.py` on the three changed paths: 0, 3 matched, 0 unmatched. `npm run build:app` (includes `tsc -b`): 0. The map's five named lesson specs (`lesson-flow`, `lesson-tools`, `plan`, `side-panel-prose`, `start-and-return`), run because the path map names them, contrary to the brief's own premise that none would: 0, 45 passed (1/4/28/4/8 per spec, the same per-spec counts as E57a's own run of these five). Left to the landing chain, as the brief's own harness names: the whole content suite, the whole unit suite, the whole lint run, `tools/content/validate.py`, `tools/content/review.py --check`.

**What is unverified, beside what passes.** No screen was opened and nothing was heard; this lane is a word count and a wording cut, and asks for neither.

**One observation, raised here for the reviewer to confirm or ignore, not a question this lane needs answered.** Without “on this track”, the reader takes the scope of “so far” from where the lesson sits (the rock track, rung 7). The cut is the reviewer's own, outside every approved sentence, and changes no taught claim.

## Files to inspect

`docs/prompts/entry-200.md` (`runs/E57b/ENTRY.md`; its scripts — `scripts-setup.ps1`, `scripts-mutant.mjs`, `scripts-collect-logs.mjs`, the e2e config copy `scripts-playwright.e57b.config.ts` — and their outputs: `setup.txt`, `content-build.txt`, `content-build.stderr.txt` (empty), `vitest-targeted.txt`, `vitest-libraryImportWords.txt`, `mutant.txt`, `checks-for-paths.txt`, `build-app.txt`, `e2e.txt`, `lint.txt` (empty), `cleanup.txt`, no kept log over 300 KB, machine paths replaced); `content/lessons/rock.7.md` (the first sentence at :12, `readingTime` at :9); `app/tests/unit/lessonShape.test.ts`:262–264 (`KNOWN_LONG` loses `rock.7.md` and E57a's two comment lines); `docs/03-content-pipeline.md` (E57a's italic note at :1044 removed, nothing around it). Sources: the brief `docs/prompts/tasks/E57b-rock7-within-the-reading-limit.md`; the ruling `docs/review/responses/1befd3e1.md` (the required change this lane fixes forward); E57a's own entry `docs/prompts/entry-195.md` and handoff `docs/review/handoffs/1befd3e1.md`; E57's own ruling `docs/review/responses/ca8508ed.md`. Not touched: every other sentence of rock.7, every other lesson, the 600-word rule itself, `tools/content/convert.py`, every importer, `app/src/**`, `former_identities.json`, every catalogue row.

## Not done, with the reason

See the entry's Not done lines.

## Do not re-review

E57a's approved wordings and the restraint pronoun's naming as confirmed (`responses/1befd3e1.md`); E57's converter fix, caller inventory and relations as approved (`responses/ca8508ed.md`); every closed seam.
