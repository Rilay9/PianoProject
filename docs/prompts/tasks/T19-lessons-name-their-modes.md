# T19 — Every lesson names the modes its rung has, and the new modes where they fit

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/04-ui-spec.md` §3c, §3d and §5, and `docs/pending-review.md` Entries 28,
29, 30, 35 (item 5), 38 and 40 (its list of six lessons whose tools paragraph names fewer
tools than the rung has) first.** A hook puts the checklist in front of you before your turn
can end; answer it honestly.

## Why

Four modes were built this week — trading fours (a lab setting), the lab holding the chords
or playing the tune (lab settings, preselectable through `mode` on a tool entry), the tempo
ladder (a `ladder` tool), and `unlock` on a lab tool — and the rungs that got them were
written to. The other lessons were not read against them. Entry 40 found six lessons whose
*Tools for this rung* paragraph names fewer tools than the rung carries, one naming none, one
with no such paragraph. The owner's test: a lesson must never say a rung offers something it
does not, and should say what it does.

## Do, one rung per tool call

For every one of the 106 lessons, read its rung's `tools` in the stage file and its *Tools
for this rung* paragraph (or note there is none):

1. **Every tool the rung carries is named in the paragraph**, in one sentence each, with what
   it opens (the item or preset by title) and what it says back. Missing ones are added;
   nothing the rung lacks is described. Where there is no paragraph and the rung has tools,
   add one, after the repertoire paragraph, in the lesson's voice.
2. **Where a new mode fits and the rung's tool entry can carry it**, add it: a lab rung whose
   lesson tells the learner to play the tune over the bed gets `mode: "tune"` or `"hold"`;
   a scale or Hanon rung on the technique or core track that lacks the ladder gets it only
   if every one of its exercise options opens as notation (Entry 29's rule); a blues, jazz
   or improv rung with a lab and a twelve-bar or four-chord loop gets one sentence on trading
   fours. Write the reason per rung; a skip is a judgement only when its reason is written.
3. **A claim row per sentence** that names a tool, its target or what it says back, in
   `lessonClaimsAboutApp.test.ts`, appended in one new `describe` block.
4. `readingTime` recounted for every edited lesson; the three-minute cap holds
   (`lessonShape.test.ts`).

## Rules

- Files: `content/lessons/*.md`, `content/curriculum/stage-*.json` (tool entries only,
  spliced), `lessonClaimsAboutApp.test.ts`, `docs/genre-plans/*.md` where a `NOT BUILT` line
  is now built, one appended entry in `docs/pending-review.md`.
- `validate.py`'s `tool_errors` is the check on every tool entry; run `build.py --offline`
  once at the end, then `npx vitest run app/tests/unit/lessonClaims*.test.ts
  app/tests/unit/lessonShape.test.ts`. No Playwright.
- Never name an AI model. Commit nothing. An absence needs two searches; a plural is several
  claims; nothing is heard. Every lesson gets a line in the entry's table: tools carried,
  tools named before, tools named after, modes added with the reason. Never stop silently.

## Final message

Lessons edited; tool entries added per rung with reasons; rows added; the verification
counts; what is unverified.
