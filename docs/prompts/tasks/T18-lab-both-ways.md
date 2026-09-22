# T18 — The accompaniment lab both ways, and explained on the screen

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/04-ui-spec.md` §3c, and `docs/pending-review.md` Entries 5, 24 (item 5)
and 28 first.** A hook puts the checklist in front of you before your turn can end; answer
it honestly.

## Why

The owner (2026-09-21): the lab "doesn't have enough documentation", and he wants it to
"play chords while the user plays the melody, so it'd go both ways". Measured 2026-09-21:
*Jam it* plays a bass-and-drum bed under the learner and judges nothing; *Read it* writes
the exercise out and opens it as a score; a preset shows one line saying what it is for;
the controls themselves explain nothing (grep of `LabScreen.ts` for help, explain, tip,
hint returned the file comment only). Two steps away, *Read it* then Duet on the score
screen gives the app the hand the learner is not playing, but nothing in the lab says so
and it is not the live bed.

## Build

1. **Hold the chords.** A *Jam it* setting where the bed also voices the progression's
   chords (comping in the pattern the left-hand picker names, or plain sustained triads if
   that is what `backingLoop.ts` can honestly do) and the learner plays the tune over it.
   Read `audio/backingLoop.ts` first: if it has no chord voice, one has to be added and
   that is the real work. Judged only if it can be honest; the trading-fours line from
   Entry 28 (in the bars, in the scale) is the model. Nothing recorded, nothing passed.
2. **Play the tune.** The reverse: the bed plays the generated right-hand melody (the
   generator already writes one when the right hand is set to *melody*) and the learner
   comps the chords underneath. Same judging rule.
3. **Chips, not a new screen.** Both are settings beside the trading-fours chip row, and
   they are exclusive with it. Fail closed: a setting with nothing to play (right hand
   *none* under *Play the tune*) is disabled with the reason shown.
4. **Explained on the screen.** One line under every control and every preset saying what
   it does in the learner's terms, and one line at the top saying what the two buttons do.
   Written once, in one table in the code, so the spec and the screen cannot drift; §3c
   lists the same lines.
5. **Reached from rungs.** Any rung whose lesson already tells the learner to play the tune
   over the lab, or to comp under it, gets the chip preselected through the tool entry;
   read the lessons that name the lab (grep `lab` in `content/lessons/*.md`) and list which
   you changed. If that needs a field on the tool entry, the `unlock`/`mode` change is
   T16's; do the minimum that `curriculum.schema.json` allows today and say what waits.

## Rules

- Files: `app/src/ui/screens/LabScreen.ts` and its CSS, `app/src/audio/backingLoop.ts`,
  `app/src/engine/sightReading.ts`, `app/tests/unit/**`, one new `app/tests/e2e/lab-*.spec.ts`,
  `docs/04-ui-spec.md` §3c, the named lessons, one appended entry in `docs/pending-review.md`.
- A test seen red first for each of items 1, 2 and 3; name the line. Playwright for your
  own spec only, after `npm run build:app` (a stale preview server fooled the last task).
- Never name an AI model. Commit nothing. An absence needs two searches; a plural is several
  claims; nothing is heard, and the entry's first unverified line says so.
- Every item built or an explicit not-built line with the reason. Never stop silently.

## Final message

Per item built / not built and why; tests and red lines; the lessons touched; counts; the
specs the coordinator should run in the wave chain; what is unverified.
