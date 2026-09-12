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

## Orientation

| What | Where |
| --- | --- |
| The rules above, in full | `docs/00-invariants.md` |
| What the app is and why | `docs/00-overview.md` |
| Screen contracts, `§0` R1–R6 | `docs/04-ui-spec.md` |
| The curriculum and its tracks | `docs/02-curriculum.md` |
| What each test covers | `docs/08-test-map.md` |
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
