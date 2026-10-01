# E57b — rock.7 back within the reading limit by the reviewer's three-word cut (fix-forward under the fast path; E57a's required change)

**A fast-path lane** (`operating-procedure.md` §11, `responses/questions-70656183.md`). E57a landed at Entry 195 (`1befd3e1`, merged `b0a350e8`, handoff `handoffs/1befd3e1.md`) with verdict **APPROVE WITH ONE REQUIRED CHANGE** (`docs/review/responses/1befd3e1.md`). The required change, verbatim:

> **do not create a permanent `KNOWN_LONG`/four-minute exception for three words.** Remove exactly **“on this track”** from the first sentence:
>
> > Every texture so far has been something to hold steady.
>
> That is the clean three-word cut outside every reviewer-approved sentence; it changes no teaching proposition. Restore `readingTime: 3`, remove `rock.7.md` from `KNOWN_LONG`, and remove the E57a docs note that records it as a long-lesson exception. Keep the ordinary 600-word rule intact.
>
> This is a fast-path correction. No new content, architecture or pedagogy decision is open.

## Premises at the lines (read at `33c927c6`)

1. `content/lessons/rock.7.md`:12 reads "Every texture on this track so far has been something to hold steady." — "on this track" occurs once in the file. Its front matter has `readingTime: 4` (:9).
2. The body counts 603 words by whitespace split; `lessonShape.test.ts`:234 computes `ceil(words / 200)`, so 600 words is three minutes, within the limit.
3. `app/tests/unit/lessonShape.test.ts`:264 reads `const KNOWN_LONG = new Set(['ragtime.6.md', 'classical.6.md', 'rock.7.md']);` with two comment lines above it naming E57a.
4. `docs/03-content-pipeline.md`:1044 carries E57a's italic note naming rock.7 as a third long lesson.

## What to do

- Remove exactly "on this track " so the sentence reads "Every texture so far has been something to hold steady." Nothing else in the lesson changes.
- `readingTime: 4` → `readingTime: 3`.
- Remove `'rock.7.md'` from `KNOWN_LONG` and the two E57a comment lines above it; the set returns to its two named exceptions.
- Remove E57a's note at `docs/03-content-pipeline.md`:1044 (the whole italic note, nothing around it).
- Rebuild content (`python tools/content/build.py --offline`), then run `npx vitest run tests/unit/lessonShape.test.ts tests/unit/lessonClaimsAboutMusic.test.ts tests/unit/docsConsistency.test.ts` from `app/`; all green. A mutant: restore the three words and confirm `lessonShape` goes red on rock.7, then put them back.
- Itemise the lesson edit (where, before, after, why) in the entry's content section.

## Not yours

Every other sentence of rock.7, every other lesson, the 600-word rule itself.

## Report, entry, harness

Per `operating-procedure.md` §11–§12, briefly: what a learner reads before and after (one sentence shorter by three words, reading time shown as three minutes if any surface shows it), the exit codes, the mutant, `git status --short`. The entry is `docs/prompts/runs/E57b/ENTRY.md`, starting `### Entry 200 — E57b`. Harness as §14: the builder's own worktree; `npm ci` in `app/`; no commits, pushes, stashes, resets or checkouts; nothing written in the main checkout; no Playwright (no browser spec maps to these paths unless `tools/docs/checks_for_paths.py` says otherwise — run it and report the line); never name an AI model; no machine paths in kept files.

**Landed 2026-10-01** (Entry 200; eaf95dea, merged 0aa847ed); handoff `handoffs/eaf95dea.md`.

## Record

lane: E57b · closes: E57 · entry: 200
index: E57a's required change (`responses/1befd3e1.md`): rock.7 back within the 600-word reading limit by the reviewer's three-word cut, the long-lesson exception rolled back | content | drafted 2026-10-01 (`E57b-rock7-within-the-reading-limit.md`); Entry 200
in-flight: drafted 2026-10-01 (`E57b-rock7-within-the-reading-limit.md`): rock.7 loses "on this track", its reading time back to three minutes, the long-lesson exception and its docs note removed (Entry 200)
state: dispatched 2026-10-01: dispatched at d3fe19d4, building (Entry 200)
- landed 2026-10-01: merged 0aa847ed; handoff `handoffs/eaf95dea.md`
