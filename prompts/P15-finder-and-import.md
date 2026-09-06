# P15 — Finders on every rung, and the two-tap import  ·  Intended model: **Opus 5**  ·  Branch: `feat/p15-finder-import`

(Include `_COMMON-HEADER.md`. The default branch is `claude/piano-teaching-app-bo19td`; there is no `main`.)

Read: `docs/decisions/2026-09-06-p11-replan.md` §4 (all), §1.4, §9.3; `docs/00-overview.md`
D10, D18; `docs/04-ui-spec.md` §3, §4; `content/curriculum.schema.json`;
`app/src/ui/screens/LessonScreen.ts`, `LibraryScreen.ts`, `app/src/data/importStore.ts`,
`app/src/curriculum/load.ts`, `selectors.ts`, `app/public/share-target.js`,
`app/src/score/extractScoreModel.ts` (for the difficulty port);
`tools/content/difficulty.py`, `content/sources/level-model.json`.

## Why

The owner will find music himself. Today the app can import it but cannot tell him what a
rung needs, cannot help him ask for it, and buries a found file six taps from the rung it
was found for. This phase makes every rung and every concept carry a finder, generated from
data so it can be validated, and makes the path from a share sheet to a rung two taps.

Runs in the container. Needs no PDMX (P14 may or may not have landed; the finder does not
depend on it).

## Build / verify

1. **Schema and data.** `finder` block on every lesson (required; §4.1 shape) and
   `content/curriculum/concepts.json` with a display name and a finder per concept id used
   anywhere. Write the 66+ lesson finders and the concept finders: specific, in the words a
   search engine and a chatbot understand; `examples` include the "wanted" pieces P14 moved
   here (or the §1.5 list if P14 has not run). `tools/content/finder.py` generates
   `searchQuery` and `chatPrompt` per lesson and concept into the built `curriculum.json`;
   `validate.py` checks: ≤ 900 chars, every constraint present in the prompt, the D18
   sentence present, no prompt names a copyrighted song with "download". Tests.
2. **`needs`** written by `validate.py` into each built lesson (§4.2); `thinLessons` in the
   app reads it rather than recomputing.
3. **Lesson page:** the needs line; a **Find more** sheet (search query with Copy, chat
   prompt with Copy, examples marked bundled/wanted, formats line); **Import for this rung**
   (opens the picker, then the assign sheet pre-filled). Concept finders reachable from the
   Skills screen row. E2E for each.
4. **The assign sheet and the overlay (§4.3).** `ImportRow` gains `lessonIds`, `concepts`,
   `levelSource` (DB migration if P11's `DB_VERSION` 2 is in, else bump now — one migration
   path, tested); `importToCatalogItem` maps them; `curriculum/load.ts` overlays imports onto
   the named lessons' `songOptions` at runtime; `lessonComplete`, `alternativesFor`,
   `buildSession` and the lesson page all see them (unit tests). Library: after any import
   the sheet opens; from a share (`#/library?for=<lessonId>` carried through
   `share-target.js`'s redirect when present) the rung is pre-selected. Count the taps in
   the e2e: share-simulated import → Save must be two user actions.
5. **Runtime levelling (§4.4):** `app/src/score/difficulty.ts` with the same features and
   the model file (copied into `public/content/` by the build); the sheet shows `≈ level`,
   editable; a unit test compares Python and TypeScript estimates on the shared fixtures
   within 0.2.
6. **Docs:** `04` §3 and §4 gain the finder, needs line and assign sheet; `02`'s terminology
   gains "finder"; `03` §2 gains a row for owner-found music; OWNER-GUIDE §4 rewritten around
   the two-tap path.

## Acceptance

- `validate.py --strict-license` green with every lesson carrying a finder; paste three
  generated chat prompts (a Stage 1 core rung, a Stage 7 classical rung, a concept).
- `npm run lint && npm run typecheck && npm test && npm run e2e` green; the two-tap e2e
  passes; the Python/TS levelling agreement test passes.
- Backup round-trip test covers the new import fields.
- Report: number of finders, the validator's rules, and any lesson whose finder you could not
  write specifically (say which and why).

**Cannot be checked in the container:** a real Android share carrying `?for=`; add it to the
owner checklist with the exact expected screen.
