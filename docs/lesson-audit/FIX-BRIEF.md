# Fixing the lesson audit — the brief

**The owner's instruction (2026-09-19):** fix the findings that need a **correction, not a
build**, and add a line to the list saying what the fix did and why.

So: change the **lesson prose** (`content/lessons/*.md`) so it says what is true of the app,
the curriculum and the scores **as they are now**. Do not build anything and do not change
anything but lesson prose and your batch file.

## Read first

1. `docs/prompts/working-rules.md` — in full. §1 (a proxy reported as the thing), §2.1
   (never state an absence without a second search), §2.2 (a plural is several claims), §2.3
   (never infer music from a title), §2.10 (green is not done) and §2.17 (prose about code is a
   claim) are the ones this job breaks most easily.
2. `docs/lesson-audit/README.md` and `BRIEF.md` — what the audit is and how each finding was
   checked.
3. Your batch file, `docs/lesson-audit/batch-<N>.md`.

## For each finding, in order

**Fix it** if it is **FALSE, STALE, WRONG-COUNT or UNOFFERED** and a change to the lesson's
words makes it true. **Leave it open** if it is **THEORY, JUDGEMENT, HISTORY or UNVERIFIED**
(a musician or a source decides those), or if it cannot be made true in prose.

1. **Check the finding's evidence yourself before changing anything.** The auditor can be
   wrong. Re-run what the Evidence line names — `python tools/content/dump_score.py <id>`, the
   rung in `content/curriculum/stage-<n>.json`, the code at the `file:line` (the line may have
   moved a few lines). If the finding is wrong, do not edit the lesson: write that on the
   finding (below) and leave the lesson alone.
2. **Make the smallest true change.** Correct the fact; keep the lesson's voice, its
   paragraph structure and its teaching. Prefer correcting a number, a key, a name or a
   description over deleting a sentence; delete only a sentence that cannot be made true
   (e.g. it describes a tool the rung does not have). Do not add new claims you have not
   checked. Never write that a piece sounds a certain way — nothing has been heard.
3. **Where a lesson promises something the app does not do** (a score it does not compute, a
   setting it does not read, a tool control a preset locks): say what the app does now. This
   is the correction; whether to build the feature is the owner's separate decision, so say
   so on the finding.
4. **UNOFFERED**: the usual fix is a pointer to the Library in the same sentence ("…, which is
   under *Classical* in the Library") — `app/tests/unit/lessonClaims.test.ts` accepts a
   sentence naming a piece the rung does not offer only if that sentence matches
   `librar|import|find more|shelf`. Check the piece is actually in the catalog
   (`app/public/content/catalog.json`) before pointing there.
5. **Keep `readingTime` right**: `readingTime` in the front matter must equal
   `ceil(words / 200)` where words are the body's whitespace-separated tokens. Recount after
   editing a lesson.
6. **Keep the blue-note rule**: the blues scale's blue note is spelled as a raised fourth in
   every key (owner, 2026-09-19).
7. **Write on the finding.** Directly under the finding's Evidence line, add one line, and tick
   the box when fixed:

   ```markdown
   - [x] **FALSE** `content/lessons/2.3.md:50` — "changing every two bars"
     - Is: …
     - Evidence: …
     - Fixed: <what the sentence now says, briefly> — <why: which evidence>.
   ```

   For a finding you checked and found wrong, keep the box unticked and add
   `- Not fixed: the finding is wrong — <what you found>.`
   For one left open, add `- Open: <THEORY/JUDGEMENT/… — needs a musician>` only if you have
   something to add; otherwise leave it as it is.

## At the end of your batch file

Add a line under the batch summary:

```markdown
Fix pass: <n> fixed, <n> found wrong and not fixed, <n> left open (THEORY/JUDGEMENT/HISTORY/UNVERIFIED or needs a build). Lessons edited: <ids>.
```

## Rules

- **Only** `content/lessons/*.md` for the lessons in your batch, and your batch file. Not
  another batch's lessons, not the curriculum, not the catalog, not code, not tests, not
  `README.md`.
- **Do not run the content build, the test suites or Playwright** — other work shares the
  machine; the whole set is verified once at the end.
- **Every finding in your batch gets handled** — fixed, marked wrong, or left open. If you stop
  before the end, say which findings you did not reach in the final line. Never stop silently.
- **Never name an AI model** anywhere you write (repository rule).
