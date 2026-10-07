# Placement classifier and verifier: the architecture (the owner, 2026-10-07)

The owner's direction: rules first, then code. Write the rule for every place an item can go (rung, track, stage, ability), the characteristic each rule reads, and how each characteristic is measured; libraries before our code; whatever code cannot decide goes on a research list. This folder is that. **It places nothing yet.** It is the specification the classifier and verifier will be built from, and its counts are proved by a script, not asserted.

## The files

| File | What | Written by |
| --- | --- | --- |
| `characteristics.yaml` | 125 characteristics: how each is measured (existing code, library call, our matcher, research, metadata), its second witness, its source | hand |
| `concepts.yaml` | all 286 concepts the rungs name, each mapped to characteristics, or marked as not an item property with the rule used instead | hand |
| `places.yaml` | the rules for 15 tracks, 10 stages and 28 abilities | hand |
| `generated/rungs.md` | one row per rung (110): what decides it, what is missing | `tools/classifier/build_matrix.py` |
| `generated/research.md` | every task no code can do yet | the same |
| `generated/summary.md` | the counts | the same |
| `generated/matrix.json` | everything above, for the classifier to read | the same |

`build_matrix.py` fails if any rung concept, track, stage or ability is missing or extra against its source list (the stage files, `00-tracks.json`, `ABILITY-MAP.md`), or if any rule names a characteristic that is not defined. `--check` fails if `generated/` is stale. It is not in CI yet.

## The pipeline

**A. Intake.** Two kinds of item, two checks.
- *Generated* (1,216 of 2,100 catalogue items, measured 2026-10-07): the generator's parameters say what the item is. The check is that the file matches its parameters (the family checkers exist).
- *Imported, PDMX above all*: nothing is known in advance and the files are noisy. Integrity checks run first: extra instruments or drums, lead sheets without a left hand, a key signature the notes disagree with (two key finders), broken or overfull bars, notes off the keyboard, chords one hand cannot span, defaulted tempos, duplicate uploads. A failing file is held, not classified.

**B. Extract.** One table, one row per catalogue item; the script asserts the row count equals the catalogue count. Each characteristic is measured by its method in `characteristics.yaml`, with the second witness where one exists. A value is a count or density with bar positions, or `UNKNOWN` with the reason. Where the two witnesses disagree, the value is `UNKNOWN` for that item and the disagreement is listed.

**C. Classify.** For every item and every place, one of three answers, each with the clause that decided it:
- `FITS`: every clause holds;
- `DOES NOT FIT`: the named clause fails;
- `UNKNOWN`: a clause reads an `UNKNOWN` value or an unsourced rule. **An UNKNOWN never becomes FITS.**

A rung rule is per requirement slot, not per item: a rung asks that its exercise options and song options, slot by slot, show the rung's concepts at the stated density, sit inside its difficulty band, and contain nothing its earlier rungs have not taught (`claims.py untaught_on` exists). A track or ability rule is its `places.yaml` entry.

**D. Verify.** Six checks, none of them a person's opinion:
1. **Completeness:** rows equal items; every place has a rule; every clause names a defined characteristic.
2. **Two witnesses agree** wherever two exist.
3. **Matcher fixtures:** each matcher is tested on examples quoted from its source and on near-misses, red before it is green.
4. **Outside oracles:** difficulty against a published graded set (CIPI or PSyllabus if they hold up: research); pattern matchers against published example lists.
5. **Differential:** the classifier's answer against today's placement, every disagreement listed with its clause.
6. **No FITS from UNKNOWN** (a test over the output).

**E. Move.** The differential becomes placement changes, itemised where/what/before/after/why, reviewed, then applied in batches.

## What the matrix shows today

From `generated/summary.md`:
- Of 125 characteristics, 33 are measured by code already, 30 need a library call, 4 come from metadata, 52 need a matcher of ours (each with a quoted definition), and 6 have no reliable method we know.
- Of 286 rung concepts, 211 are in the notes and 5 in metadata; 70 are not item properties (19 played, 30 activities, 13 drills, 8 app modes) and use the rule in `instead_rules`.
- Of 110 rungs, 4 can be decided by code today, 14 need only library calls, 63 need matchers, 19 need research, 10 are not decided by the notes at all.
- Tracks: 5 decided by the notes, 5 where the notes are evidence only, 5 not item properties. Abilities: 15, 4 and 9.
- **No rule has a quoted source yet.** Every rule is today's claim until `research.md` section 5 closes.

## Order of building

1. **The item table with what exists** (existing, library, metadata: 67 characteristics). No new detection, so it can be built and checked now.
2. **One pilot track end to end**: research its sources, write its matchers, classify, verify. The pilot is chosen by measurement: the first track whose items overlap an outside list (a published graded set or a published example list), so check 4 has an oracle. Measuring that overlap is the first task.
3. Then the remaining tracks, each closing its part of `research.md`.

## Who does what

- **Scripts** extract, classify and verify. No agent decides a placement.
- **Research agents** close `research.md` lines: each answer quotes its source, and the reviewer checks the quote against the source.
- **The reviewer** reviews this architecture before any classifier code, and each matcher's definition and fixtures before it is trusted.
- **What no one in this process can decide:** whether an arrangement is faithful to the real song, and anything that needs listening. These stay open, marked.
