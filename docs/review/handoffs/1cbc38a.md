# Reviewer handoff — the D4a brief, the pre-dispatch gate (a brief handoff: no implementation to review)

Brief HEAD: 1cbc38a (the commit that carries `docs/prompts/tasks/D4a-offer-relationship-persisted.md`; the same push amends `docs/prompts/tasks/G1-encounter-model.md` item 1 for your durability constraint). Respond in `responses/1cbc38a.md`.

## What is asked

Whether D4a meets your required change on D4 (`responses/9193261.md`): the offer's relationship carried from the session's choice through a durable snapshot written by Today before it navigates, read by the Score screen before the transfer route becomes playable, written on the run as that exact value; a missing or stale snapshot an explicit line and an ordinary practice run with no intent; `runFacts` unable to take an intent without a relationship; the four regressions (the load held pending; history changed between offer and opening; another item or day; the happy path) and four mutants; `cutIdentity` removed with its case. And whether the G1 amendment answers the durability constraint: one compact contact row per material, written with each run and never pruned, read where the run rows were pruned.

## Files to inspect, in order

1. `docs/prompts/tasks/D4a-offer-relationship-persisted.md`.
2. `docs/prompts/tasks/G1-encounter-model.md` item 1, the paragraph "Durability of run contact".
3. `app/src/ui/screens/ScoreScreen.ts` lines 4289–4292 and 3192–3196; `app/src/curriculum/session.ts` lines 441–444; `app/src/ui/screens/TodayScreen.ts` lines 272–275.

## Decisions the orchestrator made, for the reviewer to accept or overturn

- The snapshot is the session's own claim (`relationship` and `contact` as composed), written to an existing key-value or plan row, no new object store and no version change (G1 raises the version next).
- The fallback when the snapshot is absent is an ordinary practice run with one explicit line, never a refusal to play and never a partial transfer record; the pair `{ intent, relationship }` is one type.
- D4a dispatches beside E2 and F2 now and ahead of G1, which writes the same Score screen file; G1 follows D4a's landing.

## Questions for the reviewer

1. Should the snapshot also expire when the card is recomposed the same day with a different offer (a swap), or is "today's, this item, this skill" the right key?

## Do not re-review

D4's accepted parts (`responses/9193261.md`); the G1 brief beyond the amended paragraph (`handoffs/7863bee.md`, open); the D5 brief (`handoffs/4088dfc.md`, open).
