# Working in this repository

**Read `docs/00-invariants.md` before starting any substantial piece of work, and
quote its relevant rules into any agent brief you write.** It is short, it is the
owner's rules collected, and every entry is there because breaking it cost real time.

The three that are broken most often, so they are repeated here:

1. **Never assert a number measured on this machine** — not a pixel, not a duration,
   not a count of today's content. Express the relationship instead. Three such
   assertions turned CI red in one week.
2. **Never name an AI model anywhere** — commit message, comment, document, or a
   `Co-Authored-By` trailer.
3. **The specs serve the code.** When the implementation makes more sense than the
   spec, change the spec in the same commit, with the reason beside it.

## Before reporting any piece of work — every time, not when asked

**Read `docs/prompts/working-rules.md` and check the work against it before saying it is
done.** Those rules exist because each one was broken here; §4 of that document records
that they fire when somebody asks rather than on their own, and that is the failure this
section is here to close. It applies to a batch of content, a single concept, a document,
a brief, and to the writing of instructions themselves.

The short form, run it as a checklist:

1. **Did I state an absence?** Say what was searched and what it returned, and run a second
   search shaped differently before an absence means anything.
2. **Did I write a plural?** *and*, *all*, *every*, *both*, or a bare plural means one
   thing was checked. Enumerate per item or say which are unchecked.
3. **What proxy did I use, and am I reporting its output as the thing itself?** A title for
   the music, a grep for the repository, an exit code for the work being good.
4. **Green is not done.** State what is unverified as prominently as what passes. Anything
   about music that has not been heard is unverified.
5. **Did I check the reason, not just the outcome?** A right action with a wrong reason is
   still a fault, and the reason survives into the record.
6. **Did I re-open the artefact I made for this decision** rather than recalling it?
7. **Who else reads the field I changed?** Grep every consumer and say what each does.
8. **Am I reading the letter?** Restate the goal in a sentence using none of the owner's
   words and check the plan against that.

**Before re-serialising any JSON file, compare a round-trip against the raw bytes.** The
hazard is **formatting**, not line endings: Python writes `0.0` where `JSON.stringify`
writes `0` (`stage-0.json` and `stage-1.json` have these; stages 2–9 round-trip cleanly,
measured 2026-09-18), and indentation, key order and escapes can differ too. Measured on
`pdmx.json` (2026-09-18): its 8,186-line diff for a three-row change was **key order** —
`JSON.stringify` puts integer-like keys (`"3"`) first in every object — and **`160.0` written
as `160`**. Rewritten in the committed order with the committed floats, the same change is 17
lines. If the round-trip is not byte-identical, splice text instead.

**Line endings do not matter to git here**: `core.autocrlf=true` normalises text to LF on
commit (six blobs checked, all LF) and `git diff` shows no CRLF/LF changes. Working copies are a mix of both and that is harmless. This was
once written down as the cause of the `pdmx.json` diff; it cannot have been.

`.claude/hooks/diff-growth.js` warns when one step removes 150 or more lines from a tracked
file, which is the signature of an accidental reformat.

## Orientation

| What | Where |
| --- | --- |
| The rules above, in full | `docs/00-invariants.md` |
| What the app is and why | `docs/00-overview.md` |
| Screen contracts, `§0` R1–R6 | `docs/04-ui-spec.md` |
| The curriculum and its tracks | `docs/02-curriculum.md` |
| Which test proves which state machine, and an index of every spec file | `docs/08-test-map.md` |
| The running record of this work | `docs/handoff-2026-09-09.md` |

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
thrash this machine, and thrashing looks exactly like unrelated test failures.
