# T2 — Build trading fours

**Read `docs/prompts/working-rules.md` first.** §2.14 governs this one: a change has more
than one consumer, and this touches a drill kind, a schema enum, a screen and the catalog.

## What

The app plays two bars over the drum bed; the learner answers two; round and round. It is
the teaching device for blues and jazz and **five rungs in the genre plans ask for it** —
`blues.5`, `blues.7`, `jazz.4`, `jam.7`, `improv.4`.

## Why it should be cheap

Both halves exist and neither needs writing:

- **`call-response`** is already a `DrillKind` in `app/src/engine/drills/types.ts`, with a
  factory, a prompt loop, and the `playback` field that plays pitches to the learner before
  they answer.
- **`audio/backingLoop.ts`** already keeps a bass-and-drum bed against a bar count; the
  accompaniment lab's *Jam it* and the chord chart both use it.

**That claim is a proxy (§1)** — it is what the files appear to do, read on 2026-09-18.
Open both before planning against it, and say in your report whether it held.

## The design questions, which are the actual work

1. **Whose two bars are they?** A call generated from a scale is a different exercise from
   a call taken out of the tune on the rung. Generated is simpler and is probably right for
   `blues.5`; taken from the piece is better for `jam.7`. Decide, and say why.
2. **What is judged?** `05` §7 says a drill is not a score. The lab judges nothing on
   purpose. Trading fours could judge nothing, judge whether the learner played *in* their
   four bars, or judge pitches. **Nothing-judged is the safe default** and matches the lab;
   anything else needs an argument.
3. **Where does it live?** A new `DrillKind` needs an entry in the closed enum in
   `content/catalog.schema.json` and a `STAFF_POLICY` row in `engine/drills/types.ts`,
   which is typed `Record<DrillKind, StaffPolicy>` so a missing row will not compile. The
   previous generator pass chose to reuse an existing kind rather than widen the enum —
   read `handoff` §5ar before deciding which.
4. **How is it reached?** `tools` on a lesson takes only kinds with a route
   (`04` §3d). If this is a drill it is reachable as `#/drill/<itemId>`; if it is a mode on
   another screen it needs a route parameter and a `LessonTool` kind.

## Constraints

- **Do not add a `tools` kind that cannot open.** `rhythm` and `ladder` were left out of
  that union precisely because they are settings and run state, and a button that looks
  pressable and opens the wrong thing is a bug by `00-invariants` §1.
- The drum bed needs a gesture before audio starts. `audioEngine` handles this; check how
  the lab does it rather than inventing a second path.
- Every test ships proved red: make the change, write the test, revert **just** the source,
  confirm it fails, restore, and say so.

## Done

`npx tsc -b`, `npm run lint`, `npx vitest run`, and the affected Playwright specs one at a
time on port 4173 — **one suite at a time, four workers** (`00-invariants` §3). Add the
kind to `docs/04-ui-spec.md` §5c with the reasoning, and one entry in
`docs/pending-review.md` naming which of the four design questions you decided and on what
grounds.

## T8 — start on the first key, and why trading fours is the exception

T8 latches a run's clock to the learner's first note. **Trading fours must use that only for
the very first trade, and only when the learner trades first.** Every later entry comes after
four bars the app has just played in audible time, and coming in on time there *is* the
skill being practised — latching would quietly remove it. If the app trades first, there is
no latch at all: it is T8's case 2, the app leads.
