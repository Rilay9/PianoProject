# T26 — Three checks before the owner's first real use

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md` (never assert a number
measured on this machine; express the relationship), the checklist in `CLAUDE.md`,
`docs/04-ui-spec.md` §3 and §0, `docs/01-architecture.md` §6 (budgets), and the specs
`tests/e2e/setup.spec.ts`, `perf.spec.ts`, `modes-placement.spec.ts`, `offline.spec.ts`
and the unit tests `dbUpgrades.test.ts`, `boot.test.ts` first.**

1. **A first day, as one chain, across reloads** (`tests/e2e/first-day.spec.ts`, new).
   Empty storage → the setup tour finished → placement test taken and passed through to
   a unit → *Start here* → the rung it names → its lesson → a piece opened → a run in Wait
   fed the expected notes through the MIDI mock → the pass recorded → reload → Today, Plan
   and Skills agree about the placed unit, the passed item and what is next. Assert the
   destination at every step the way `lesson-tools.spec.ts` does. Portrait at 342 px, then
   the same once sideways.
2. **Progress from before this week survives** (`dbUpgrades.test.ts` extended, or a
   sibling). Read what `dbUpgrades.test.ts` already covers. Build a storage snapshot in
   the shape the app wrote at `2e08a0a` (read that commit's `progressStore.ts`, `SessionRow`
   and `ProgressRow`; a pass record, a session with the old zero step count, a placement,
   settings, the track order, a folder entry), load it through the current boot path, and
   assert: every stored pass is still a pass, every screen that reads the rows draws, no
   field the new code requires is missing or defaulted wrongly, and the corrected step
   count does not re-judge history (Entry 24 item 1 and Entry 50).
3. **Speed of the two screens the catalog grew** (`perf.spec.ts` extended). The Library
   with each genre filter and with the search box used, and a lesson page with the most
   options, at the phone viewport: time to the first row on screen, measured the way the
   existing budgets are and stated as a relationship to the existing budget, not a raw
   number. If either is over, find the cause (a filter that re-reads the catalog, a page
   that renders every option before the first) and fix it with the test red first.

## Rules

- Files: the specs and tests named, `app/src/**` only for a fix with its red test,
  `docs/04` or `docs/01` where a budget or behaviour is stated, `docs/08-test-map.md` (one
  line per new spec), one appended entry in `docs/pending-review.md` (Entry 52).
- `npm run build:app` before any spec; one spec at a time on port 4173 (check it is free);
  `npx tsc -b`, `npm run lint`, `npx vitest run`. Never name an AI model. Commit nothing.
  An absence needs two searches; a plural is several claims; nothing is heard.
- Every one of the three done or a not-done line with the reason. Never stop silently;
  keep a handoff file current in your scratch folder.

## Final message

Per item: what the spec chains or measures, what it found, fixes with red lines; counts;
what is unverified.
