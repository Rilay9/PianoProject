# T12 — Every lesson claim under test, and the 86 open findings decided by two readers

**Read `docs/prompts/working-rules.md` first, then `docs/00-invariants.md`, then
`docs/lesson-audit/README.md`, `BRIEF.md`, `FIX-BRIEF.md`, then the checklist in
`CLAUDE.md` ("Before reporting any piece of work"). A hook puts that checklist in front of
you before your turn can end; answer it honestly and say what it caught.**

**Runs after T10** (which creates `lessonClaimsAboutApp.test.ts` and restores some
lessons) **and after `docs/lesson-audit/second-read.md` exists** (a sample second read of
the fixes). Read both before starting.

## Why

236 lesson corrections were made on 2026-09-19 and only a sample has been second-read.
None of them is under test: `FIX-BRIEF.md` forbade editing tests, so the next edit to a
lesson or a score breaks them silently. And 86 findings were left open as THEORY,
JUDGEMENT, HISTORY or UNVERIFIED "for a musician". The owner's decision (2026-09-21,
`docs/pending-review.md` standing context 5): he is not the gate. Two readers decide.

## Part A — every correction second-read, then made a row

`docs/lesson-audit/second-read.md` (2026-09-21) checked 72 of the 236 ticked findings:
68 held, 0 wrong, **4 overreached** — the fix asserted more than the score or code
supports (0.3's miss pause is true of 14 of 20 drill kinds; Lemoine No. 35 has no broken
triads; *Maple Leaf*'s second strain is bass–chord in six of sixteen bars; technique.7
names one exception that two other exercises also meet). That rate over the 164 unread
predicts about a dozen more. So:

1. **Apply the four overreach corrections** from `second-read.md` §"The four OVERREACH
   items": the smallest true change to each sentence, `readingTime` recounted, a
   `- Second read (2026-09-21): …` line under the finding.
2. **For every ticked finding not in the sample** (the sample's list is in
   `second-read.md`; the 72 are done), re-run its evidence the way the second read did
   (`dump_score.py` bars, the rung file, the code at the symbol), give it a verdict line
   `- Second read (2026-09-21): HOLDS | OVERREACH (<what is true>) | WRONG (<what is true>)`,
   and correct the sentence where it is not HOLDS.
3. **Then the row.** For every ticked finding, in the sample or not, whose sentence rests
   on evidence a test can read, add a row:

- a music claim (key, metre, bars, staves, chord symbols, what a hand plays, which pieces
  the rung offers) → `app/tests/unit/lessonClaimsAboutMusic.test.ts`, in its existing row
  shape. Where the claim is about what a hand plays and `notation` cannot answer it, the
  row reads the built score the way `dump_score.py` does; add a small helper if one is
  needed and say so.
- an app claim (a preset's locks, a drill's params and count, a tool button's target, a
  threshold, a window in milliseconds, a default) → `app/tests/unit/lessonClaimsAboutApp.test.ts`,
  in the shape T10 created. **Note that "never assert a number measured on this machine"
  (`00-invariants`) is about pixels and durations, not about a constant the code declares;
  a row may assert what a constant is, and should read it from the code rather than
  repeat the number.**
- a claim neither can read (history, a sentence about the Library's contents that changes
  with every import) → no row; list it in the entry under "not under test, and why".

One row per finding, one finding per tool call, with the evidence line. Tick nothing;
write `- Row: <test file>:<describe/it name>` under the finding.

## Part B — the 86 open findings, two readers

You are reader one. For each unticked finding:

- **THEORY** and **HISTORY**: decide from what you know and from any source in the
  repository (the catalog's `composer`, `source`, edition notes; the score). Write
  `- Reader 1: RIGHT | WRONG (<what is true>) | UNSURE (<why>)` under the finding.
- **UNVERIFIED**: try to verify it now with the instrument the finding says was missing;
  write what you read and the verdict. If it still cannot be verified, say what would.
- **JUDGEMENT**: a factual-sounding generalisation only a musician can confirm. Do not
  adjudicate it. Write `- Reader 1: REWRITE — "<the sentence as teaching advice that asserts
  nothing checkable>"` or `- Reader 1: KEEP — plain teaching advice, not a claim`.

Do not edit any lesson in Part B. The coordinator applies RIGHT, WRONG, REWRITE and KEEP
from your lines and their evidence; only the UNSURE ones go to a second reader (the
owner asked for token economy on 2026-09-21, so a second reader on all 86 is not
arranged). That rule is why an UNSURE is a fine answer and a guess is not: a guess gets
applied.

## Rules

- Files: the two test files, `content/lessons/*.md` (only the sentence a Part A verdict
  corrects, `readingTime` recounted), `docs/lesson-audit/batch-*.md` (`Second read:`, `Row:`
  and `Reader 1:` lines only), and one appended entry in `docs/pending-review.md` (Entry 26: rows added per
  file, findings not under test and why, the Part B tallies, what is unverified).
- Run `npx vitest run app/tests/unit/lessonClaims*.test.ts` from `app/` as often as you
  like; nothing else. No content build, no Playwright, no port 4173.
- Do not re-serialise any JSON file.
- Your scratch folder: `C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\26d8772b-b51d-4e51-bd51-20002e98bae1\scratchpad\T12\`.
- Never name an AI model anywhere you write. Commit nothing.
- Every ticked finding gets a `Row:` line or a reason; every unticked one gets a
  `Reader 1:` line. Never stop silently; the entry names what was not reached.

## Final message to the coordinator

Rows added per test file; findings with no row and why; Part B tallies (RIGHT / WRONG /
UNSURE / REWRITE / KEEP); every WRONG restated; what is unverified.
