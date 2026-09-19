# T6 — Make the tempo ladder addressable, so a rung can name it

**Read `docs/prompts/working-rules.md` first.** §2.13 is the one that produced this task:
seven rungs were left with no mode rather than given one that did not fit.

## Why this exists

`4.1`–`4.4` and `technique.4`, `.6`, `.7` are scales, arpeggios, Hanon and octaves. What
they want is **evenness under speed**, and the app's answer to that is the tempo ladder:
each clean pass up a notch, each pass with a mistake down one.

The ladder is **run state scoped to a loop** (`05` §6) and has no address, so `04` §3d
excludes it from the `tools` union — a button in that union must open something, and
`rhythm` and `ladder` were left out for exactly that reason. So those seven rungs name no
mode at all, which is honest and is not what anybody wants.

**Duet was on them and was removed**, because duet is not hands-separately: it plays the
hand you are *not* playing, so you hear both. That suits hands doing different jobs and
masks the thing a scale rung is measuring. `docs/pending-review.md` Entry 16 has the
reasoning.

## The proposed approach

The blocker looked circular: the ladder needs a loop, clearing the loop turns the ladder
off, so "open with the ladder on" seemed to need a loop out of nowhere. **The circle only
exists for repertoire.** For the rungs that want this — scales, arpeggios, Hanon, octaves —
**the whole item *is* the loop.** They are two to eight bars and they repeat by nature;
looping one is not a choice about which bars matter, it is what the exercise already is.

So: **`?ladder=1` sets the loop to the whole item and turns the ladder on, in that order,
as one action.** Both controls then show their state — the Loop control displays the loop,
the Ladder row displays the toggle — which is precisely the invariant §6 was protecting.
The fault it records was a ladder left on with *nothing on screen having asked*; here two
things on screen have asked.

Three constraints make this safe rather than clever:

1. **Restrict the tool to exercises.** A whole-piece loop is sensible for a scale and
   absurd for a prelude. The rung list below is the whole permitted set, and it is
   scales-and-Hanon by construction. If a future rung wants the ladder over repertoire it
   must name bars, and that is a different feature.
2. **`?ladder=1` without a resolvable loop must do nothing** — not turn the ladder on and
   hope. Fail closed, because the failure mode being avoided is a control acting unasked.
3. **Clearing the loop still switches the ladder off.** Do not special-case the route's
   loop to survive; the existing rule is what keeps the two in sync, and an exception
   reintroduces exactly the state §6 describes.

**Check this reasoning before building on it.** It rests on a claim about the code —
that the loop can be set to the whole item at route time and that the ladder reads it the
same way it reads a user-set loop. Read `LADDER_*` in `PracticeEngine.ts` and the loop's
own set path first. If the ladder arms off a *user gesture* rather than off loop state,
this approach is wrong and question 3 below is the answer.

## If the approach does not survive that reading

Say so and close the task. **That is a perfectly good outcome** — the seven rungs keep
nothing and the reason is recorded rather than papered over. Do not invent a worse mode to
fill the column.

## The trap

`05` §6 records that leaving the ladder on with no loop visible caused a real fault: *"the
Ladder row disappeared from the sheet with the toggle still pressed underneath it, and the
next loop set — later that session, on the same piece — started moving the tempo by itself
with nothing on screen having asked."* Any route that turns the ladder on must not
reintroduce that. **The one control that acts without being asked each time has to be off
whenever nothing shows it on.**

## If it is built

- Add `ladder` to the `LessonTool` kind union in `app/src/curriculum/types.ts` **and** the
  enum in `content/curriculum.schema.json`; they are two lists of one fact and
  `validate.py`'s `tool_errors` reads the second.
- The e2e must assert the **destination**, not the button: that the Score screen opens with
  a loop set and the ladder on. `lesson-tools.spec.ts` has the pattern — it compares the
  button's own `data-` attribute against where the tap lands.
- Then put it on the seven rungs, and only those. Scales and Hanon, not repertoire.

## Done

`npx tsc -b`, `npm run lint`, `npx vitest run`, `lesson-tools.spec.ts` and the score specs
one at a time on 4173, `build.py --offline`, `validate.py`, `rung_audit.py`. Update
`docs/04` §3d's list of routable kinds and `docs/05` §6. One entry in
`docs/pending-review.md` — and if the answer to question 1 is no, that entry is the whole
deliverable.
