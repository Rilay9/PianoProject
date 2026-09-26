# Tasks

Thirteen self-contained briefs (T9–T13 added 2026-09-21, after the owner said he is not the gate and that promised features are to be built). Each names the files it touches, the constraints that will
bite, and what "done" means. **Every one of them opens by requiring
`docs/prompts/working-rules.md`**, which is the set of rules written after breaking them.

Dispatch one at a time. They are ordered by dependency, not by size.

| | Task | Needs | Touches | Owner's time |
|---|---|---|---|---|
| ~~T4~~ | ~~The findings the last session left against its own work~~ | — | — | **done 2026-09-18**, Entry 20 |
| ~~T1~~ | ~~A mode on every rung where one fits~~ | — | — | **done 2026-09-18** |
| ~~T1b~~ | ~~Build the four rungs that need no new music~~ | — | — | **done 2026-09-19**, Entry 21; trading fours waits on T2 |
| ~~T3~~ | ~~Seed Simon from a genre's own scale~~ | — | — | **done 2026-09-19**, Entry 22; blues scale built, clave/guide tones/walk-up rejected |
| **T2** | Build trading fours | T3 is a good warm-up for it | a drill kind, a schema enum, a screen | none |
| **T7** | Review the concepts added, and decide four silent genres | nothing | a read, then a content decision | **a musical ear** |
| **T6** | Make the tempo ladder addressable | nothing | a route, two enums, one screen | none |
| ~~T8~~ | ~~Start the run on the first key, not the countdown~~ | — | — | **built 2026-09-18**, Entry 18 |
| ~~T5~~ | ~~The quarry for the seventeen rungs that need music~~ | — | — | superseded by T11 on 2026-09-21: the owner is not the gate |
| **T9** | Checks that catch wrong score files, run over every file | nothing | `tools/content/score_checks.py`, a report | none |
| **T10** | Build what the lessons promised, and give the lessons their promises back | nothing | `app/`, the named lessons, `docs/04`, `docs/05` | none |
| **T11** | The quarry for latin and hymns, reviewed by a reader instead of the owner | nothing | `build/pdmx-*`, `content/sources/pdmx.json` | none |
| **T12** | Every lesson claim under test, and the 86 open findings decided by two readers | T10, and the sample second read | two claim-test files, the batch files | none |
| **T13** | Every generated exercise family checked as music, by invariant and by picture | nothing | `generate_exercises.py`, its tests | none |

## The order from 2026-09-21: build everything first, then check everything

**The plan by goal, with the measured state under each, is `docs/prompts/plan-2026-09-21.md`.**
It adds T17 (every mode driven in the browser) and T18 (the lab both ways, documented).

The owner (2026-09-21): *"there's no point in checking for correctness until it's all added.
But we still want everything to be correctly added."* And he does not yet trust the tools
and modes added on 2026-09-18/19. So two phases, each task still proving its own work red
then green as it goes:

**Build.** T2 (trading fours) → T11 (quarry latin and hymns) → T6 (tempo ladder route) →
T14 (the rungs the genre plans still lack: holiday 5–7, hymns 4–6, latin 4 and 6–8, jazz 3,
ragtime 4 and 9, jam 7, from T11's keeps) → T15 (apply the 247 score-check rows: duplicates,
titles, truncations) → T16 (the MIDI converter made honest on a one-track two-hand
recording, and T10's three leftovers: half-pedal depth through the engine, accents extracted
from the score, the duet rule widened for technique.7).

**Check.** T13 (generator invariants and pictures) → T12 (every lesson claim under test, the
86 open findings, the full second read) → T17 (every tool and mode driven in the browser,
one spec each, the way the tour is reviewed) → score checks wired into the build as a gate.

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

## From 2026-09-25: the plan built on the outside audit

**The plan is `docs/prompts/plan-2026-09-25.md`; the procedure every brief points at is
`docs/prompts/operating-procedure.md`.** Wave A is read-only: a window classification and three traces
side by side; the traces feed a diagnosis the owner reads before Wave B is briefed.

| | Task | Kind | Delivers |
|---|---|---|---|
| **T35** | The two red window specs and the un-run one classified (bug, stale spec, test bug, or changed invariant), sheet re-shot; no fix | read-only | `traces/2026-09-25-window-reds.md` |
| **T36a** | One generated exercise traced from generator to next recommendation | read-only | `traces/2026-09-25-generated-exercise.md` |
| **T36b** | One quarried piece traced from archive to progress; every difficulty compared; the excerpt idea tried | read-only | `traces/2026-09-25-repertoire.md` |
| **T36c** | One sight-reading run traced from level request to next assignment | read-only | `traces/2026-09-25-sight-reading.md` |
| **T33** | The five state-machine choices | build | waits for T35 |

### Wave B (go given 2026-09-25 after the diagnosis was read)

| | Task | Kind | Runs |
|---|---|---|---|
| **T38** | The window's demonstrated faults fixed at their mechanism; two look-ahead treatments judged by eye | build, browser | with T39 |
| **T39** | Five-finger patterns levelled by key; catalog rebuilt; no band widened | build, content | with T38 |
| **T37** | Nothing displayed or recorded that was not measured; sight-reading receives what the rungs promise | build, browser | after T38 and T39 |
| **T33** | The five state-machine choices | build, browser | after T37 |

### Between B and C (the reviewer's three decisions) and C0 (design, read-only)

| | Task | Kind | Runs |
|---|---|---|---|
| **T40** | Three evidence rules: no input means not measured; a heard sight-read is not a first attempt; a demonstrated performance is not independent | build, browser | now |
| **C0a** | The vocabulary design: demands, skills, needs, ability, address, observations, evidence, the teaching plan, designed apart for review | design, read-only | on CI's verdict |
| **C0b** | The test inventory (AT-15): every test classified preserve / revise / delete / replace / add | audit, read-only | on CI's verdict |

### Between C0 and C (T41), and Wave C's first four steps (approved 2026-09-26)

| | Task | Kind | Runs |
|---|---|---|---|
| **T41** | A black key named by its key on the status line; a drill sheet that stops claiming an accuracy; the renderer publishes when the fit has settled | build, browser | done 2026-09-25 (Entry 69) |
| **C1** | Observations stored: every run writes what it measured and marks what it did not; T40's drops recorded flagged; the guide off for sight-reading drills and recorded | build, browser | done 2026-09-26 (Entry 70) |
| **C2** | Vocabulary v0 (the reading strand) and the demand detectors; one authoritative definition; the build gate | build, content | done 2026-09-26 (Entry 71) |
| **C3** | The evidence function and the ladder; the property test over the vocabulary; the sheet's "not judged" lines | build | done 2026-09-26 (Entry 72) |
| **C4** | The first reader: sight-reading constraints from the reading skill state; unseen guaranteed; the true reason line; then the learner-facing checkpoint | build, browser | after C3 |
