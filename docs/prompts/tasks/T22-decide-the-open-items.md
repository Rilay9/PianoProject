# T22 — The open items decided by evidence and done where the evidence says so

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/prompts/plan-2026-09-21.md` (Status), and the entries each part names.**
The owner (2026-09-22): "find out what's reasonable to add and what's fine as is. I just
want a complete correct app." So: each item below gets a decision with its evidence, and
the reasonable ones are done in the same run.

## Part B — app and generator (run first, disjoint from Part A)

1. **The lab's trade row and pickers below the fold at 342 px** (Entry 42 FAULT 2, measured
   per element). Reasonable: yes. Reorder or collapse so the next control is inside the
   first screenful (`04` §0 R1), with the `lab.spec.ts` R1 assertion that was red.
2. **The chord chart draws no keyboard** (Entry 42 FAULT 6, a feature). Reasonable: yes,
   the screen already subscribes to the keyboard source; add the strip the lab uses, with
   `modes-chart-*.spec.ts` asserting a tapped key marks the sounding cell.
3. **Text directions between the staves with barlines through the words** (Entry 33, Entry
   38). Reasonable: move the text in the generator to above the top staff (the writer's
   `placement`), regenerate, prove with the picture. **The pedal blob**: not reasonable
   (no renderer rule; leave, say so).
4. **The technique measures the on-screen keys cannot take** (Entry 42 FAULT 8, half): the
   sheet already says so; nothing more is reasonable without a velocity keyboard. Leave.

## Part A — content (run after Part B or by a second agent that touches only these files)

5. **The eight quarried pieces and the three unbuilt rungs** (Entry 44). The level model
   put each two to four levels above its stage. Compare each piece's measured features
   (the `difficulty.py` inputs: notes per second at the written tempo, span, hand
   independence, accidentals) against the songs already on the neighbouring rungs of the
   same track; if a piece sits inside the range of what the rung's stage already asks, set
   `level` with `levelSource: judged` and the comparison written on the row; if it does
   not, leave it. Build a rung only if three fit honestly (`00` D21). Never force one.
6. **The ten unhomed carols** (Entry 31). The plan homes seven on `holiday.3`; read each
   against `holiday.3`'s band and requires; home the ones that fit, with evidence lines,
   and say why the rest stay in the Library.
7. **The UNSURE findings** (Entries 39–40). Read each as a second reader with the score or
   the source; decide RIGHT/WRONG with evidence, or rewrite the sentence so it no longer
   asserts the disputed thing. No sentence stays disputed.
8. **The four lessons Entry 45 found out of voice** if it left any unedited, and the
   "Repertoire" paragraphs that read as lists.

## Rules

- Part B files: `app/src/**`, `app/tests/**`, `tools/content/generate_exercises.py` and its
  tests, `docs/04`, one appended entry (47). Part A files: `content/sources/*.json`
  (splice), `content/curriculum/stage-*.json` (splice), the lessons named, the batch files
  (verdict lines), the claim-test files (one appended block each), one appended entry (48).
- Tests seen red first; consumers grepped; `build.py --offline` once at the end of Part A;
  Playwright one spec at a time for Part B. Never name an AI model. Commit nothing. An
  absence needs two searches; a plural is several claims; nothing is heard.
- Every item gets done / not done with the reason. Never stop silently.

## Final message

Per item: decision, evidence, done or not; tests and red lines; counts; what is unverified.
