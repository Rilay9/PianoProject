# Working in this repository

**Start every session with `FABLE.md`**: the one operating contract. It holds the objective, the weekly loop, the rules, the current job and how work runs. Where any other document disagrees, FABLE.md wins. New instructions are edits to FABLE.md, never new governing documents.

**Preflight, before every action:** name the current job (FABLE section 6), the unit of work and the finish condition. If you cannot, do not act. After finishing, stop: never pick another task by momentum, and nothing new starts without the owner's say-so.

This branch started empty (2026-10-11); files are ported from the older branches only when a job needs them (FABLE section 7).

## Reuse before reinvention

The owner decides what to learn next; there is no fixed curriculum (FABLE section 1). When making content or code, look first for what exists:
1. for app features: the old app on `claude/piano-teaching-app-bo19td`, ported with tweaks;
2. for content: published method books, syllabuses and teaching material, and the reference files on `claude/piano-rebuild` (sources to draw on, not an order to follow);
3. scores: PDMX and other public-domain or openly licensed corpora;
4. an established library: music21, Verovio, Tonal, partitura;
5. an annotated dataset or an open-source implementation of the same feature.

Custom work only where none of these serves, with the reason recorded. Easy-to-write is never a justification. No new frameworks, inventories, taxonomies or literature reviews.

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
   ask: is it inside the job FABLE names as current? Is it what the owner asked for, or my
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

1. **Reuse first.** Does the brief make the agent start from what exists (the old app's code,
   published teaching material, existing libraries and datasets) before producing anything of
   its own, and say what it used?
2. **This job only.** Does it do the job FABLE names as current, in the owner's words, and
   nothing from a later job?
3. **Bounded and ending.** Are the sources it may read named, its output sized to the goal,
   and its end stated? No open-ended search, no catalogue dumps, no fixed number of passes.
4. **Pilot before fan-out.** Is one small run tried and looked at before the same brief goes
   to several agents at once?
5. **Sourced, not asserted.** Does every teaching or repertoire claim it asks for name its
   source? Is each claim labelled measured (by what) or
   reading, is anything said about a score checked on the score itself, and are corrections
   re-checked in the same job?
6. **Inputs fixed.** Is its base commit named, and is nothing running that changes what it
   reads?
7. **Common sense for a learner.** Would a piano learner need what it produces? Does a rule,
   framework or list it adds come from the owner or the task, not from me?
8. **Cost.** Is this the cheapest capable way (the model's strength, how many agents, whether
   they run at once), given the usage the owner has left?

## Verification, proportional to the job

Choose verification by what could actually break: content against the content contract's validator and the code checks, app changes against the app's own tests and a run on the device, a teaching claim against its source. Record what was and was not checked without padding the report.

## Mechanical hazards

- **Before re-serialising any JSON file, compare a round-trip against the raw bytes.** Python and `JSON.stringify` write numbers, key order, indentation and escapes differently; if the round-trip is not byte-identical, splice text. `.claude/hooks/diff-growth.js` warns when one step removes 150 or more lines from a tracked file.
- Agents do not commit, push, stash, reset or checkout; commit named paths only, never `git add -A`.

## Orientation

| What | Where |
| --- | --- |
| The objective, the loop, the rules and the current job | `FABLE.md` |
| The owner's words that set the direction | `docs/inputs/` |
| Reference: curriculum, rungs, chosen pieces, score characteristic rows | branch `claude/piano-rebuild` |
| The old app, whole | branch `claude/piano-teaching-app-bo19td` |
| The process hooks (checklists, brief audit, self-test) | `.claude/hooks/` |
