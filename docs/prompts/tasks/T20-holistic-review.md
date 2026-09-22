# T20 — The whole thing read as one: cohesive, documented, clear to the learner

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, then `docs/00-overview.md`, `02-curriculum.md`, `04-ui-spec.md`,
`OWNER-GUIDE.md`, `docs/prompts/plan-2026-09-21.md`, and `docs/pending-review.md` Entries
23–44 in order.** A hook puts the checklist in front of you before your turn can end;
answer it honestly.

## Why

This week eleven rungs, four modes, a build gate, a converter and hundreds of lesson edits
landed from a dozen separate agents, each right about its own piece. Nobody has read the
result as one thing. The owner's ask: cohesive, well documented, clear for the person
learning from it.

## Read it as the learner, then as the maintainer

**As the learner**, walk every track top to bottom in the built app (`npm run build:app`,
preview on 4173, one spec-style drive per track or a manual walk with `read_page`), and
judge:
1. **Continuity**: does each lesson pick up where the one before left off, name the rung
   before and after correctly, and use the same words for the same thing (the mode names
   from `docs/04` §5, the tool labels from `LessonScreen.ts`, the concept display names)?
   List every place two names are used for one thing, and every stale reference.
2. **Voice**: are the 109 lessons in one voice? Name the ones that read as written by
   someone else (length, register, the "Tools for this rung" shape) and the smallest edit
   that brings each into line.
3. **Clarity on screen**: on a 342 px phone, from Today, can a learner find the next thing
   to do, open it, know what it wants, play, and read what came back, without a manual?
   Where a screen needs a sentence it does not have, say which sentence.
4. **The genre story**: does a learner meet each style at the stage the plan says, and does
   the Library's filter for that style hold what the rung promises? One line per track.

**As the maintainer**, check the documents against the code as it is now:
5. `docs/00-overview.md`, `02-curriculum.md`, `03-content-pipeline.md`, `04-ui-spec.md`,
   `05-score-follow-engine.md`, `08-test-map.md`, `OWNER-GUIDE.md`, `tools/content/README.md`:
   every sentence that names a screen, mode, field, step or test must be true of the tree.
   `docsConsistency.test.ts` pins some; find what it does not. Fix stale sentences in the
   same step, citing the code line, per `00-invariants` §4.
6. `docs/08-test-map.md` names every spec and what state it proves: add this week's specs
   (the fifteen `modes-*`, `trading-fours`, `lab-both-ways`, `score.ladder-route`,
   `converted-import`, and the new unit files) with one line each.
7. The owner's guide: can the owner, reading it cold, run the build, the checks, the
   converter and the quarry? Fix what he could not.

## Rules

- Files: `docs/**` (not `pending-review.md` except one appended entry, number 45),
  `content/lessons/*.md` for voice and continuity edits only (facts are under claim rows;
  `readingTime` recounted), `app/src/**` only for a sentence on a screen, with a test.
- No content build unless a lesson changed; then once at the end, with `npx vitest run
  app/tests/unit/lessonClaims*.test.ts app/tests/unit/lessonShape.test.ts app/tests/unit/docsConsistency.test.ts`.
- Never name an AI model. Commit nothing. An absence needs two searches; a plural is several
  claims; nothing is heard. Every track and every document gets a line. Never stop silently.

## Final message

The continuity list, the voice list, the on-screen sentences missing, the genre story per
track, the stale document sentences fixed, the test-map lines added, what is unverified.
