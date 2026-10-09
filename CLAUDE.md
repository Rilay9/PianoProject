# Working in this repository

**Start every session with `FABLE.md`**: the one operating contract. It holds the objective, the steps in order, the current step and how work runs. Where any other document disagrees, FABLE.md wins. New instructions are edits to FABLE.md, never new governing documents.

**Preflight, before every action:** name the current step (FABLE section 2), the unit of work and the finish condition. If you cannot, do not act. After finishing, stop: never pick another task by momentum, and nothing moves to a new step without the owner's say-so.

This branch starts minimal (2026-10-09). The old project, with the whole app, is on `claude/piano-teaching-app-bo19td`: a source of candidates, not an authority (FABLE section 3).

## Reuse before reinvention (the owner, 2026-10-03 and 2026-10-09)

Do not reinvent piano pedagogy. Curricula, syllabuses, repertoire lists and teaching materials are published; start from them. For any musical, curriculum, content or app capability, look first for:
1. established method books and graded syllabuses (RCM, ABRSM, Trinity and others) and their repertoire lists, including PSyllabus;
2. a public-domain or openly licensed score or corpus: PDMX, Mutopia, OpenScore, IMSLP;
3. an established library: music21, Tonal, partitura;
4. an annotated dataset or an open-source implementation of the same feature;
5. the old project, as a candidate.

Custom work only where none of these serves, with the reason recorded. Easy-to-write is never a justification. Research is targeted: where sources disagree, where something must be adapted to the app, or where a claim is unsupported. No new frameworks, inventories, taxonomies or literature reviews.

## Never teach anything wrong

No wrong note name, invented concept or false "this teaches X"; correctness outranks everything else.

## Two technical rules

1. **Never present a number measured on this machine (a timing, a size) as general.** Say where it was measured, or express the relationship instead.
2. **Our own code that judges music needs evidence:** its judgments agree with musically defensible ones on real scores, including examples built to fool it. Passing tests alone do not show that.

## Before reporting any piece of work

Eight questions. A correction is owed only
where the answer would change what the owner or the next agent does; wording alone never
earns a turn.

1. **Product.** Did I look at the result the way a learner meets it, and what would a
   piano teacher say about it? If I did not look or cannot judge, that leads the report.
2. **Mechanism.** What caused the fault, which test told that cause from the alternatives,
   and did the change act on the mechanism?
3. **Evidence.** Which claims are observed and which inferred; for every "all", "none" or
   "both", the scope actually examined and what is unchecked; for an absence ("not on this
   machine", "no such file"), the place the record says it lives, looked at, and the item
   tested directly (`test -e`, the exact path), never read off a listing; output cut by
   `head` or a limit is a sample, never grounds for "none" or "all"; what has not been heard.
4. **Consumers and record.** Who else reads what changed; the consumers and records
   actually affected by it updated in the same change, with the reason.
5. **Addressee.** For every request, question or claim: who acts on it, and can they? The
   owner decides and relays and never listens; the reviewer may inspect artifacts and run available checks but must not claim checks it did not run or hearing it did not perform; builders and the orchestrator must not claim to have heard music without actual audio evidence. A capability no actor has is stated
   as *no one in this process can decide this* and the item stays open, never moved to a
   later actor or phase. A paragraph its addressee does nothing with is cut. An owner
   correction is applied and confirmed by the change, in one line, without apology.
6. **Closure.** Is anything I call done, landed, wired or covered actually there? For a claim
   of implemented behaviour: the file and line that implements it, the test or check that pins it,
   checked on the current HEAD, never read off a report. For a curriculum or research claim (a
   level, a sequence, a piece's grade, a teaching point): the published source it comes from (which
   book or syllabus, which level). A claim with neither is said to be absent, and the item stays open.
7. **Sense in context.** Before reporting, inspect the actual current work state: every running task, committed/queued task, and task started this turn. Distinguish parked possibilities from approved work. For everything I started, triggered, dispatched or proposed this
   turn: state the owner's current goal in one line, in the owner's words, not mine. Then
   ask: is it inside the step FABLE names as current? Is it what the owner asked for, or my
   extension of it: a framework, an inventory, a survey, a broader scope? Does it build on
   something not yet checked, or read something still changing? Is it paperwork standing in
   for progress? Is a rule I am following really the owner's, or one I wrote? Would the owner,
   seeing it, call it pointless, out of order or out of scope? If so, stop or undo it and say
   so in one line (the owner, 2026-10-07 and 2026-10-09, after work was built on unchecked
   foundations and after a whole classifier was built that the plan never asked for).
8. **Convergence.** Does this help the app converge towards a polished, finished state, or does it
   leave things open and head down the route to a vibe-coding death loop: another pass, another
   finding, another rule, with no end condition (the owner, 2026-10-08, after check passes on the
   abilities list kept finding more because each checker read new sources)? If it does not converge,
   name the end condition or stop.

## Before sending any brief

The brief-check hook prints this section and the eight questions above before any agent
brief or brief change goes out; the brief carries a line starting "Brief check:" saying what
the pass changed. Each question below is a mistake already made here (the owner, 2026-10-08 and 2026-10-09).

1. **Reuse first.** Does the brief make the agent start from published pedagogy (method books,
   graded syllabuses, repertoire lists), existing libraries and datasets before producing
   anything of its own, and say what it used?
2. **This step only.** Does it do the step FABLE names as current, in the owner's words, and
   nothing from a later step?
3. **Bounded and ending.** Are the sources it may read named, its output sized to the goal,
   and its end stated? No open-ended search, no catalogue dumps, no fixed number of passes.
4. **Pilot before fan-out.** Is one small run tried and looked at before the same brief goes
   to several agents at once?
5. **Sourced, not asserted.** Does every curriculum or repertoire claim it asks for name its
   source (which book or syllabus, which level)? Is each claim labelled measured (by what) or
   reading, is anything said about a score checked on the score itself, and are corrections
   re-checked in the same step?
6. **Inputs fixed.** Is its base commit named, and is nothing running that changes what it
   reads?
7. **Common sense for a learner.** Would a piano learner need what it produces? Does a rule,
   framework or list it adds come from the owner or the task, not from me?
8. **Cost.** Is this the cheapest capable way (the model's strength, how many agents, whether
   they run at once), given the usage the owner has left?

## Verification, proportional to the step

Choose verification by what could actually break. Until the app is integrated (FABLE step 6) there is no build or test suite to run: check a curriculum claim against its source, and a score or excerpt against its intended content. Record what was and was not checked without padding the report.

## Mechanical hazards

- **Before re-serialising any JSON file, compare a round-trip against the raw bytes.** Python and `JSON.stringify` write numbers, key order, indentation and escapes differently; if the round-trip is not byte-identical, splice text. `.claude/hooks/diff-growth.js` warns when one step removes 150 or more lines from a tracked file.
- Agents do not commit, push, stash, reset or checkout; commit named paths only, never `git add -A`.

## Orientation

| What | Where |
| --- | --- |
| The objective, the steps and how work runs | `FABLE.md` |
| The owner's words that set the direction | `docs/inputs/` |
| The curriculum (written in step 1) | `curriculum.md` |
| The old curriculum, reference only | `reference/old-curriculum.md` |
| The old project, whole | branch `claude/piano-teaching-app-bo19td` |
| The process hooks (checklists, brief audit, self-test) | `.claude/hooks/` |
