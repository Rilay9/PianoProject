# Tasks

Eight self-contained briefs. Each names the files it touches, the constraints that will
bite, and what "done" means. **Every one of them opens by requiring
`docs/prompts/working-rules.md`**, which is the set of rules written after breaking them.

Dispatch one at a time. They are ordered by dependency, not by size.

| | Task | Needs | Touches | Owner's time |
|---|---|---|---|---|
| **T4** | The findings the last session left against its own work | nothing | curriculum, two lessons, one source table | none |
| ~~T1~~ | ~~A mode on every rung where one fits~~ | — | — | **done 2026-09-18** |
| **T1b** | Build the four rungs that need no new music | T4 first | curriculum, four lessons, one test | none |
| **T3** | Seed Simon from a genre's own scale | nothing | `simon.ts`, catalog rows, two docs | none |
| **T2** | Build trading fours | T3 is a good warm-up for it | a drill kind, a schema enum, a screen | none |
| **T7** | Review the concepts added, and decide four silent genres | nothing | a read, then a content decision | **a musical ear** |
| **T6** | Make the tempo ladder addressable | nothing | a route, two enums, one screen | none |
| ~~T8~~ | ~~Start the run on the first key, not the countdown~~ | — | — | **built 2026-09-18**, Entry 18 |
| **T5** | The quarry for the seventeen rungs that need music | nothing | `build/` only, nothing committed | **ticking one review page** |

## Why this order

**T4 before T1b** so the new rungs are not built beside faults the audit already found —
in particular `rock.4`, whose exercises are duplicated onto core rungs, because T1 adds
`rock.3` beside it.

**T3 before T2** because they are the same shape of work and T3 is smaller: both add a way
of practising to a drill that exists, and T3 needs no new `DrillKind` while T2 probably
does.

**T1 is done.** It was going to be the four rungs; a thinking run against the owner's
stated goal — *every* stage more diverse, where it is a natural fit — found that modes
vanished above Stage 6 (Stage 8 and 9 had none at all) while genre coverage was fine. 52
rungs were given tools and 10 skipped with reasons. 21 → 72 of 96 rungs now name a mode.
`docs/pending-review.md` Entry 16. The four rungs became **T1b**.

**T7's first half is done and changed what the task is.** 18 concepts were added and
attached to 21 rungs — `blue-note`, `power-chord`, `riff`, `tresillo`, `charleston` and the
rest — each only where a lesson already taught the idea in prose. `docs/pending-review.md`
Entry 17. **No test covers any of it**: the suite ran an identical 2,171 tests before and
after, so the attachments are defensible but unread.

What the search exposed is larger than vocabulary. **Jazz reaches no stage below 5, latin
skips Stage 4 and everything above 5, and hymns-gospel and holiday both stop at Stage 3.**
`docs/genre-plans/` §4 argues two of those cells should stay empty; the other two are not
argued anywhere. That is now T7, and it is a content decision rather than a cheap one.

**T6 exists because T1 refused to force one.** Seven technique rungs — scales, arpeggios,
Hanon, octaves — want the tempo ladder and nothing else fits. The ladder has no route, so
they were left with no mode rather than given a worse one.

**An approach is now proposed in the brief rather than left open.** The circle — a ladder
needs a loop, clearing the loop kills the ladder — only binds for repertoire. For a scale
or a Hanon figure **the whole item is the loop**, so `?ladder=1` can set both together and
every control shows its own state, which is what the original rule protected. The brief
says what to read in `PracticeEngine.ts` to confirm it, and **"no, and here is why" remains
an acceptable deliverable.**

**T8 came from the owner playing the app**, which is why it outranks most of this list: a
run is timed from `startedAtMs`, stamped the moment the count-in ends, so a late first note
displaces everything measured after it. The count-in stays — it teaches the tempo — but the
clock should latch to the first note in every mode the learner starts. Listen mode is the
one exception.

**T5 runs whenever**, and is the only one that reaches the owner. Everything before the
review page is machine work; the ticking is not, deliberately —
`review.py`: *"only an ear decides what is worth practising."*

## What is deliberately not here

- **Building the seventeen rungs that need the quarry.** They cannot be built before T5 is
  reviewed and committed. `docs/genre-plans/` holds their candidates.
- **Judging whether the nine existing lessons teach.** No check can decide it and no brief
  can delegate it. `docs/prompts/P23-review-and-continue.md` §2 lists what needs a musician.
- **Playing the generated music.** Nineteen pieces were written on 2026-09-18 and none has
  been heard. Five faults in them were found by looking at pictures, and the pictures are
  crops.
