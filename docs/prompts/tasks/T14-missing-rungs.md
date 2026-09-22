# T14 — The rungs the genre plans still lack, built from what T11 kept

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/02-curriculum.md` Part A and D, `docs/pending-review.md` Entry 21
(the last rung-building entry, with its evidence-line format and the sixteen first-draft
faults a re-read caught) and Entry 25 (T11's keeps) first.** A hook puts the checklist in
front of you before your turn can end; answer it honestly.

## The rungs

From `docs/genre-plans/*.md` against `docs/generated/ladder.md` (2026-09-21): **holiday 5,
6, 7 · hymns 4, 5, 6 · latin 4, 6, 7, 8 · jazz 3 · ragtime 4, 9 · jam 7**. Build each for
which the catalog now holds enough music (three songs or three exercises, `00` D21; a
song-optional rung counts them together). For each rung the plan's stage section says
what it teaches and which modes fit; the ladder report says what already exists.

**A rung with too little music is not built and not padded.** Say which, with the count
that fell short. The owner said (2026-09-17) never to force a song onto a rung.

## How, per rung, in this order

1. Read the plan section and the neighbouring rungs' lessons so the new one continues
   them (Entry 21 lists stale stage numbers that crept in from not doing this).
2. **One item per tool call**, with the evidence line
   `<id> → <rung> | <fields read from the built catalog and the score> | <why it fits>`.
   Read `notation` and `dump_score.py`; a title is not the music.
3. `requires` and `levelBand` set from the items placed, not the reverse.
4. `tools`: the modes the plan marks `BUILT` for that stage, each opening something that
   exists (`validate.py`'s `tool_errors` is the check; trading fours is a lab setting, not
   a tool kind — Entry 28).
5. Concepts: only ids that exist and that the lesson's prose teaches. **No new concept
   without a `finder` and a paragraph teaching it.** The owner's rule: he must never meet
   a concept the app invented.
6. The lesson: written against the scores you read, under the three-minute cap
   (`lessonShape.test.ts`), naming its pieces and the mode. Every factual sentence about
   a piece becomes a row in `lessonClaimsAboutMusic.test.ts` **as you write it**; every
   sentence about a tool or preset, a row in `lessonClaimsAboutApp.test.ts`.
7. Prerequisites and the track's order; the Plan screen groups by unit count, so check
   what moves.
8. `holiday` carols now on no rung (Entry 21 lists fourteen): home the ones the plan
   names on holiday 5–7 and say which remain unhomed.

## Rules

- Files: `content/curriculum/stage-*.json` (splice text; never re-serialise — `CLAUDE.md`
  says why), `content/lessons/<new>.md`, the two claim-test files, `docs/02-curriculum.md`
  where a track's description changes, `docs/generated/ladder.md` (regenerated), one
  appended entry in `docs/pending-review.md`.
- Run `build.py --offline`, `ladder_report.py`, `validate.py`, `rung_audit.py`, and
  `npx vitest run` once at the end, not per rung (`working-rules` §2.11). No Playwright.
- Never name an AI model. Commit nothing. An absence needs two searches; a plural is
  several claims; nothing is heard, and the entry says so first.
- Every rung in the list is built or has a not-built line with the count. Never stop
  silently.

## Final message

Rungs built with their option counts; rungs not built and why; claim rows added; the
verification counts; what is unverified.
