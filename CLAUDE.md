# Working in this repository

**Read `docs/prompts/operating-procedure.md` before any substantial piece of work, and
point every agent brief at it.** It is short. It says how work is decided, done and
reported here, and it is the owner's word as of 2026-09-25. `docs/00-invariants.md`
holds the product and technical rules with their stories; `docs/prompts/working-rules.md`
holds the failure stories behind the evidence rules.

## The five rules

1. Solve the actual problem, not the literal request.
2. Understand the existing system before changing it.
3. Form and test a causal model rather than patching a symptom. Hypotheses are allowed:
   name one, name its test, run the test, fix the mechanism.
4. Verify the user-visible result, not the implementation.
5. Be precise about evidence without letting verification replace judgement.

## The hierarchy

Product truth (readable, undistorted music with the next music in view; the intended
skill actually trained; an appropriate next experience; nothing taught wrong) outranks
technical correctness, which outranks evidence discipline, which outranks process
hygiene. A lower tier never interrupts a higher one.

Ask the owner only when a choice changes product behaviour, pedagogy or architecture and
cannot be inferred from what is written down. Otherwise choose, say why in a line, go on.

## The three technical rules broken most often

1. **Never assert a number measured on this machine.** Express the relationship instead.
2. **Never name an AI model anywhere**, including a `Co-Authored-By` trailer.
3. **The specs serve the code.** When the implementation makes more sense, change the
   spec in the same commit, with the reason beside it.

## Before reporting any piece of work

Four questions, in tier order (`operating-procedure.md` §11). A correction is owed only
where the answer would change what the owner or the next agent does; wording alone never
earns a turn.

1. **Product.** Did I look at the result the way a learner meets it, and what would a
   piano teacher say about it? If I did not look or cannot judge, that leads the report.
2. **Mechanism.** What caused the fault, which test told that cause from the alternatives,
   and did the change act on the mechanism?
3. **Evidence.** Which claims are observed and which inferred; for every "all", "none" or
   "both", the scope actually examined and what is unchecked; what has not been heard.
4. **Consumers and record.** Who else reads what changed; the spec, test map and record
   updated in the same change, with the reason.

## Two mechanical hazards

**Before re-serialising any JSON file, compare a round-trip against the raw bytes.** The
hazard is formatting, not line endings: Python writes `0.0` where `JSON.stringify` writes
`0` (`stage-0.json` and `stage-1.json` have these), `JSON.stringify` puts integer-like keys
first in every object, and indentation and escapes can differ. On `pdmx.json` a three-row
change came out as an 8,186-line diff for those reasons and as 17 lines when spliced as
text. If the round-trip is not byte-identical, splice text. Line endings do not matter to
git here: `core.autocrlf=true` normalises to LF on commit.

`.claude/hooks/diff-growth.js` warns when one step removes 150 or more lines from a
tracked file, which is the signature of an accidental reformat.

## Orientation

| What | Where |
| --- | --- |
| How work is decided, done and reported | `docs/prompts/operating-procedure.md` |
| The product and technical rules, with their stories | `docs/00-invariants.md` |
| What the app is and why | `docs/00-overview.md` |
| Screen contracts, `§0` R1–R6 | `docs/04-ui-spec.md` |
| The curriculum and its tracks | `docs/02-curriculum.md` |
| Which test proves which state machine; every spec file | `docs/08-test-map.md` |
| The current plan and its waves | `docs/prompts/plan-2026-09-25.md` |
| The running record, newest entry last | `docs/pending-review.md` |

## Commands

From `app/`:

```bash
npx tsc -b              # typecheck — `tsc --noEmit -p` checks nothing
npm run lint
npx vitest run          # unit tests, no browser, free to run any time
npx playwright test --workers=4
```

One Playwright suite at a time: every config shares port 4173 and `test-results/`.
Local runs are pinned to four workers because ten Chromium instances rendering scores
thrash this machine, and thrashing looks exactly like unrelated test failures. Agents do
not commit, push, stash, reset or checkout; commit named paths only, never `git add -A`.
