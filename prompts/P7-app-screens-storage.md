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
3. **Own-score import and PDF viewing (owner request, 2026-09-05).** The owner buys
   MusicXML and has PDFs, so both have to be first-class rather than a corner of Library:
   - **MusicXML/MXL import**: file picker, PWA share target, drag-and-drop; the imported item
     gets a catalog entry in the `imports` store with `source.license: "user-imported"`, is
     searchable and playable like any other, and works in every follow mode. Bad files fail
     with a sentence, not a stack trace.
   - **PDF viewing**: a PDF library item (`file` ending `.pdf`) opened in a viewer that renders
     with `pdfjs-dist` and steps **one system at a time**, using `app/src/pdf/systems.ts` — the
     page-cutting spike P4 left, which is written and tested and has no UI. Follow modes are
     timed auto-advance, manual tap and loop-a-system; Wait and mic-follow are *hidden*, not
     disabled, because a PDF has no notes to match. See
     `docs/decisions/2026-09-05-p4-pdf-sheet-music.md`. This needs one schema change — `file`
     currently means `.mxl`/`.musicxml` — so update `content/catalog.schema.json` and
     `docs/03` §4 in the same pass.
   No OMR: scanning a PDF into notes is an offline desktop step (Audiveris/MuseScore), and the
   result comes back in through the MusicXML import above.
4. Screens per `04`: Today (weekly goal header, input chip, session-length picker with 15/30/60/120
   templates, Jump to…, Review a skill, session card, shuffle, start session flow), Skills review
   (§3a), Chord-chart view with form tracker (§3b), tablet breakpoint (§7a), Plan (stages → units →
   lessons, lesson page with options, track toggles/ordering, manual "mark done", placement
   test flow from `02` Stage 0.4 using existing drills/scores), Library (search/filter/sort,
   imports with `.musicxml/.mxl` file picker + PWA share target, edit/delete), Progress
   (heat-map, streak, completion, repertoire, session history, export/import, debug report),
   Settings (every setting in `04` §7 grouped as listed).
5. E2E per screen; data survives reload; import of a fixture `.mxl` appears in Library and
   opens; a fixture PDF opens in the viewer and steps between systems.

## Acceptance
E2E green; manual: full Stage 1 lesson flow with the on-screen keyboard from Today → Score →
summary → progress recorded → review queue shows it tomorrow (fake the clock in a test).
