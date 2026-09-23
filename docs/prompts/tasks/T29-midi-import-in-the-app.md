# T29 — A MIDI file imports from the app itself

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/03-content-pipeline.md` (`[FOUND]`, the import path), `docs/04-ui-spec.md`
§4 (import and the assign sheet), `tools/midi-cleanup/midi_to_musicxml.py` and its tests
(`tools/midi-cleanup/tests/test_converter.py`: the note-track rule, the hand split, the
quantisation policy, the self-check), and `docs/pending-review.md` Entry 35 first.**

## Why

The owner (2026-09-22): "ideally I could select a file from the app." The converter exists
only as a Python command. Nothing runs on a server, so the conversion has to happen in the
browser.

## Build

1. **`app/src/import/midi/`**: a TypeScript port of the converter's pipeline, function for
   function, with the same names: parse the MIDI (a small reader, no dependency unless one
   is already bundled), find the note track — and, new, **merge several note tracks**
   into one when a downloaded file carries a track per hand or per voice, keeping their
   order —, split hands by the same voice-leading rule, quantise on the same grid with the
   same tuplet policy, write MusicXML with the app's writer (`musicXmlWriter.ts`, which today writes
   drill sheets and exercises; read it first and extend it for ties, tuplets and two staves
   if it lacks them, with tests), and run the same self-check. Every rule is stated where the
   Python states it.
2. **Golden parity**: for each fixture the Python harness uses (the three recordings under
   `build/midi-real/` and the rendered inputs), the port's output must match the Python
   output note for note, duration for duration, hand for hand; a test that diffs them.
   Where the port must differ, the Python changes too, in the same step, and the test
   says why.
3. **The import sheet accepts `.mid` and `.midi`** (`IMPORT_ACCEPT`), converts on the
   device, shows the self-check's result and the hand split on the assign sheet before the
   learner confirms, and stores the MusicXML the way any import is stored. A file with no
   notes, or one the converter refuses, gets a sentence saying what was wrong and what to
   do, never a silent failure.
4. **Level and rung**: the imported result is levelled the way any import is
   (`difficulty.ts`) and appears in the Library at once (see the delayed-row fault in T28).
5. **Tests seen red**: the parser on a hand-built file, the merge on a two-track file, the
   parity test, a `converted-import`-style spec that picks a `.mid` through the sheet and
   opens the result on the Score screen with step counts equal.

## Rules

- Files: `app/src/import/**`, `app/src/data/importStore.ts`, the Library and assign sheet
  screens, `app/tests/**`, `tools/midi-cleanup/**` only for a rule that must change with
  the port, `docs/03`, `docs/04`, `docs/08-test-map.md`, one appended entry in
  `docs/pending-review.md`.
- Bundle size: state the delta against the 20 MB budget in `audio.spec.ts`'s sense and
  the app's own budget in `docs/01`.
- `npm run build:app` before any spec; one spec at a time on 4173; `npx tsc -b`,
  `npm run lint`, `npx vitest run`; the Python harness after any Python change. Never name
  an AI model. Commit nothing. An absence needs two searches; a plural is several claims;
  nothing is heard: parity with the Python proves the port, not the music.
- Every item built or a not-built line with the reason. Keep a handoff file current in
  your scratch folder. Never stop silently.

## Final message

What was ported and what differs; the parity result per fixture; the merge rule; the
sheet's new path; bundle delta; tests and red lines; counts; what is unverified.
