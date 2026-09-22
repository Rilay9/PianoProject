# T17 — Every mode driven in the browser, judged for playability

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/04-ui-spec.md` §3c, §5 and §0 R1–R6, `docs/08-test-map.md`, and
`docs/pending-review.md` Entries 24, 28, 29, 30 and 35 first.** A hook puts the checklist
in front of you before your turn can end; answer it honestly.

## Why

The owner does not yet trust the modes added on 2026-09-18 to 2026-09-22: trading fours,
the lab both ways, the ladder route, the unlock field, the chord-chart doors, the
technique measures, the dictation card, the placement start. Each has a spec that proves
one thing. None has been driven end to end the way a learner meets it: from the rung
page, through the button, into the mode, playing something, reading what comes back.

## Do, one mode per spec, one spec at a time

For each of: **trading fours · hold the chords · play the tune · the ladder route · a
lab button with `unlock` · the chord-chart door from a lesson row · the chord-chart door
from the score menu · a technique exercise's measure line · melodic dictation · placement
then the plan · a rung's Simon (blues) · Duet from a rung · Rhythm only · Free play**:

1. Start on the rung page that offers it (find one from the stage files), tap the
   button, and assert the destination the way `lesson-tools.spec.ts` does.
2. Play something through the page's own keyboard strip or the test MIDI source
   (`screenKeyboardSource`; see how `trading-fours.spec.ts` and `lab-both-ways.spec.ts`
   feed notes), and assert what the screen says back — text, not a screenshot.
3. **Judge playability as a learner**, not as a test: is the next thing to do visible
   without scrolling on a 342 px phone (R1); does the read-ahead show what comes next in
   time to play it; is the cue for "your turn" unmistakable; does Stop stop; does Back
   leave the mode off (`05` §6's trap). Write a one-line verdict per mode with what you
   drove; a fault is a `FAULT` line with the element and the expected behaviour.
4. **Fix a fault only when the fix is in the screen or the mode and small**; otherwise
   record it. A fix gets a red-then-green test.
5. Landscape as well as portrait for the score-screen modes (`landscape.spec.ts` is the
   pattern).

Also: **the three engraving faults** from Entry 33 (noteheads below a one-line staff;
pedal marks and a fingering digit piling into a blob; text directions between the staves
with barlines through the words). Find the OSMD option or the writer setting that fixes
each; prove with the picture; if none exists, say so.

## Rules

- Files: `app/tests/e2e/modes-*.spec.ts` (new, one per mode), `app/src/**` only for a
  small fix with its test, `docs/04-ui-spec.md` where a fix changes behaviour, one
  appended entry in `docs/pending-review.md` with the verdict table.
- `npm run build:app` before any spec; Playwright one spec at a time, four workers, port
  4173 (nobody else is using it). `npx tsc -b`, `npm run lint`, `npx vitest run` if you
  changed source.
- Never name an AI model. Commit nothing. Nothing is heard; a mode can be driven and
  still sound wrong, and the entry says so first. Every mode in the list gets a verdict or
  a not-driven line with the reason. Never stop silently.

## Final message

The verdict table (mode, driven from, what came back, verdict); FAULT lines; fixes with
their red tests; the engraving results; what is unverified.
