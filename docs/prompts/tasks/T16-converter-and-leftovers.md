# T16 — The MIDI converter on real recordings, and the app leftovers

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, and `docs/pending-review.md` Entries 24 (items 2, 5, 6, 7), 29 (the bug found
in passing) and 30 (item 5) first.** A hook puts the checklist in front of you before your
turn can end; answer it honestly.

## Part A — the converter

`tools/midi-cleanup/midi_to_musicxml.py` was rebuilt on 2026-09-19 and tested only on
MIDI rendered from catalog scores with timing jitter; its harness was not committed. Three
real recordings are in `build/midi-real/` (MAESTRO, Disklavier performances; read its
`SOURCE.md`): each is format 1 with two tracks. **First evidence lines:** which track holds
the notes in each file, and what the converter produces from each today, unchanged.

Then build, each with a test seen red first:
1. **A hand split** for a one-track two-hand recording: state the rule (a moving pitch
   boundary from voice-leading, not a fixed middle C), test it on the three recordings and
   on a synthetic case where the hands cross, and say where it fails.
2. **A quantisation policy** with its grid stated (and swing-aware where the tempo map
   implies it), with a test that a jittered rendering of a catalog score round-trips to
   the same durations.
3. **The harness committed** under `tools/midi-cleanup/tests/`, running on the three real
   files and on rendered input.
4. **The output opened in the app**: the converted score renders through the import path
   (`docs/03` `[FOUND]`), with the step count equal to the cursor-step count; say how you
   checked it.

## Part B — the app leftovers, each with a red test

5. **`unlock` on a lab tool entry** (`curriculum.schema.json`, `validate.py`'s
   `tool_errors`, `LessonScreen.ts`): a rung names one lab button with the control it
   frees, replacing the two-button shape from Entry 24 item 5 on the six rungs that got it;
   and the T18 mode preselect (`mode`) on the same entry for the rungs Entry 30 lists as
   waiting.
6. **Half-pedal depth**: carry the raw CC64 value through `PracticeEngine.feed` into the
   session so `halfPedalResult` has something to read; technique.7's sentence returns.
7. **Accents**: extract `<accent>` in `extractScoreModel.ts` onto `ScoreNote` (update the
   golden fixtures deliberately, say which) so velocity can be judged against it; the
   lessons that said accents are not judged get their sentence back where it was true.
8. **The duet rule** in `validate.py` widened so technique.7's 2-against-3 exercise can be
   its duet item; then the lesson's paragraph returns.
9. **Sight-reading opens in Wait mode** for a learner who has not changed the setting
   (Entry 29): make it open in the mode `docs/05` §8 says, with the test that was red.

## Rules

- Files: `tools/midi-cleanup/**`, `app/src/**`, `app/tests/**`, `content/curriculum.schema.json`,
  `tools/content/validate.py` and its tests, `content/curriculum/stage-*.json` (splice; only
  the tool entries items 5 and 8 change), the lessons those items name, `docs/03`, `docs/04`,
  `docs/05`, one appended entry in `docs/pending-review.md`. Another agent (T15) is editing
  `content/sources/`, score files, `build.py` and `score_checks.py`; do not touch those.
- Run `npx tsc -b`, `npm run lint`, `npx vitest run`, `python -m unittest` for what you add;
  Playwright for one spec of your own after `npm run build:app`, if port 4173 is free.
- Never name an AI model. Commit nothing. An absence needs two searches; a plural is several
  claims; nothing is heard. Every item built or an explicit not-built line. Never stop silently.

## Final message

Per item built / not built and why; tests and red lines; what the converter makes of the
three recordings; counts; specs for the coordinator; what is unverified.
