# P7 — Today / Plan / Library / Progress / Settings + storage  ·  Intended model: **Sonnet 5**  ·  Branch: `feat/p7-screens`

(Include `_COMMON-HEADER.md`.)

Read: `docs/04-ui-spec.md` §2–§4, §6–§8; `docs/01-architecture.md` §4.5–§4.6; `docs/02-curriculum.md` Part A §8 and Part G.

## Build
1. `data/`: IndexedDB stores via `idb` per `01` §4.5; `SettingsStore` migration from
   localStorage; export/import JSON (File System Access API with download fallback; share-sheet
   on Android when available).
2. `curriculum/` selectors incl. `nextRecommended`, review queue (intervals 1/3/7/21 days),
   weekly-minutes goal (no daily streak), "I already know this" self-pass + quick checks,
   session builder for the four templates in curriculum Part A §8.
3. Screens per `04`: Today (weekly goal header, input chip, session-length picker with 15/30/60/120
   templates, Jump to…, Review a skill, session card, shuffle, start session flow), Skills review
   (§3a), Chord-chart view with form tracker (§3b), tablet breakpoint (§7a), Plan (stages → units →
   lessons, lesson page with options, track toggles/ordering, manual "mark done", placement
   test flow from `02` Stage 0.4 using existing drills/scores), Library (search/filter/sort,
   imports with `.musicxml/.mxl` file picker + PWA share target, edit/delete), Progress
   (heat-map, streak, completion, repertoire, session history, export/import, debug report),
   Settings (every setting in `04` §7 grouped as listed).
4. E2E per screen; data survives reload; import of a fixture `.mxl` appears in Library and opens.

## Acceptance
E2E green; manual: full Stage 1 lesson flow with the on-screen keyboard from Today → Score →
summary → progress recorded → review queue shows it tomorrow (fake the clock in a test).
