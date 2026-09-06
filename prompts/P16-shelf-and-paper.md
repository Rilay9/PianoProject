# P16 — The shelf: books he owns, practice against paper, blind mode  ·  Intended model: **Opus 5**  ·  Branch: `feat/p16-shelf-paper`

(Include `_COMMON-HEADER.md`. The default branch is `claude/piano-teaching-app-bo19td`; there is no `main`.)

Read: `docs/decisions/2026-09-06-p11-replan.md` §5 (all), §8 (memorising, performing);
`docs/04-ui-spec.md` §5, §5b; `docs/05-score-follow-engine.md` §3, §5;
`app/src/ui/screens/PdfScreen.ts`, `ScoreScreen.ts`, `app/src/score/ScoreSession.ts`,
`app/src/data/db.ts`, `progressStore.ts`, `backup.ts`, `app/src/audio/Metronome.ts`;
the overlay P15 added in `app/src/curriculum/load.ts`.

## Why

The owner has method books and sheet music on paper and a PDF viewer that has never been
connected to the curriculum. The decision doc designs the honest version: a book is a
registered thing with pieces and page numbers; a rung can ask for "the equivalent in your
book"; practice against paper records what the app can actually hear and nothing it cannot.

Runs in the container. Needs no PDMX. Builds on P15's overlay.

## Build / verify

1. **`books` store** (§5.1 shape; `DB_VERSION` bump with a tested migration; in the backup
   with a round-trip test). `booksStore.ts` with add/update/delete book and piece.
2. **Shelf UI:** Library → **Shelf** (a sub-screen): books, pieces, "Add a piece" (title,
   page, rung picker, concepts, level ≈ with `levelSource`), link a PDF import to a book,
   link a MusicXML twin to a piece by search. Lesson page: **I have this on paper** →
   pre-filled piece form. E2E.
3. **`paperHint`** on lessons (schema, optional) and the overlay: registered pieces appear
   as that rung's `paperOptions`; `lessonComplete` accepts a self-assessed paper pass where
   `mastery.custom` does not demand a measured accuracy (unit tests for both cases). Write
   `paperHint` for every Stage 1–5 core lesson and every classical rung.
4. **`#/paper/<bookId>/<pieceId>`** (§5.3): metronome with count-in, tempo, keyboard strip,
   MIDI and mic capture, timer, tempo steadiness (σ of onset offset to the nearest click when
   the metronome is on; unit test on scripted onsets), the three-button self-report, and a
   summary that states exactly what was and was not measured. Records a `sessions` row with
   mode `paper` and a progress row keyed by the piece id, `selfPassed`. Never an accuracy.
5. **Blind mode:** `hideScore` option on `ScoreSession`/`ScoreScreen` (score hidden,
   keyboard strip and cursor bar visible, everything else unchanged); a piece with a MusicXML
   or generated twin offers "Practise with the score" and "Blind"; the memorisation rung —
   a `memorise` lesson mastery custom "two clean passes, then blind at ≥ 90 %" — added to
   4.6's unit as a lesson with three options from existing pieces. E2E: a blind run reaches
   `finished` with scripted input and the SVG stage is hidden.
6. **Performance runs:** a `performance` flag on a run (no restarts, no loop, recorded as
   such); Progress gains a "Performances" list. Small; tests.
7. **PDF viewer:** `?page=` on the route; `barsPerSystem` read from the book when the import
   is linked to one; OWNER-GUIDE §4 gains the shelf.

## Acceptance

- Unit tests: migration, backup round trip, steadiness, `lessonComplete` with paper, blind
  session; e2e: shelf, add a piece from a lesson, paper screen run and summary, blind run,
  PDF opened at a page.
- `npm run lint && npm run typecheck && npm test && npm run e2e` green; `validate.py` green
  with `paperHint` on the listed lessons.
- Report: what the paper screen measures, verbatim, as the summary shows it.

**Cannot be checked in the container:** steadiness against a real HP-130 with the pedal
down, and whether the self-report feels honest in use. Owner checklist.
