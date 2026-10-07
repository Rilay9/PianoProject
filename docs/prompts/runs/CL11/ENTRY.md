### Entry 215 — CL11 — what counts as evidence, traced and decided: one accuracy, one count, a named note is not unaided reading

Base: the worktree cut from **af18a3ae** (`git log -1` before anything else; the brief
`tasks/CL11-what-counts-as-evidence-traced-and-decided.md` was confirmed present).

- Worktree only. Nothing committed, pushed, stashed, reset or checked out.
- Nothing written in the main checkout. Its built `app/public/content/` (`catalog.json`, `curriculum.json`) was
  read for counts only.
- A design lane: no app code changed. The design note is `docs/design/evidence-truth.md`; this entry cites it and
  does not repeat it.

## Judgement

**What changes for a learner** (all from the build the note specifies; nothing ships from this lane):

- A Keep tempo pass stops letting wrong keys through. A wrong key costs a note, as it costs a step in Wait, and a
  late right note is charged once.
- A Wait reading with the note names on screen stops counting as unaided reading.
- Today's mark and Progress stop disagreeing with the lesson page about what counted: a microphone pass, and a
  piece the learner only said they know.
- Unchanged: Wait stays practice, a self-report stays the learner's word, and a piece's run stays evidence of the
  piece and of no skill.

**Rows (8).**

- **Decided for the build (3):** L10 (lane 1), L58 and L57 (lane 2).
- **Closed without a build (2):** L105 (the gate already as ruled) and G71 (retired under its ruling).
- **Open on a product choice (1):** L102.
- **Parked (2):** G80 (unreachable until a notated item earns evidence) and L23 (a capability, not a defect).

**Inputs (4) plus 2 found here.**

- X46's Wait input: its condition never occurs; the spec sentence is corrected.
- X46's self-report and piece inputs: hold.
- R23's question (2): holds.
- Found here: the microphone pass and Progress's reading of the learner's word.

**The build's shape:** two independent lanes. Lane 1 is app code: engine, `Scoring`, `measurement`, session outcome,
Progress and spec sentences. Lane 2 is the vocabulary: `skills.json` and its readers, with evidence definitions 6
and a recompute.

**Product, as a learner meets it.** No screen was looked at; nothing was run in a browser. The learner-facing
claims are read from the code and its sentences. Where marked *observed* in the note, they come from unit-level
reproductions. Nothing was heard. One item needs an ear and stays open in those words: whether the microphone's
estimate is good enough on a real piano to count.

## What was done

- **Read.** The repository's root instructions, `operating-procedure.md`, the brief; `responses/f860c76e.md`, `43045ffb.md`,
  `questions-53670d2a.md` (whole), `questions-e71ef3ad.md`, `71730e65.md`, `9e14839e.md` §2 and §5; the scheduler
  `product-convergence-current.md`; `surviving-work-2026-10-02.md` item 4; the eight rows in
  `views/backlog/L.md` and `G.md`; X46's trace `docs/design/session-item-story.md` and its approval
  `responses/52363ba7.md`.
- **Traced** the evidence path from the engine to the readers: `PracticeEngine`, `Scoring`, `measurement`,
  `evidence`, `rungState`, `ladder`, `transferPolicy`, `transfer`, `eligibilityCore`, `skillActivation`,
  `progressStore`, `sessionRun`, `sessionRunner`, and the sheet, lesson, Library and Progress readers.
- **Ran** `npm ci` in `app/`. Then eleven scratch reproductions under `app/build/cl11/` with a config copy
  (`npx vitest run --config build/cl11/vitest.config.ts`), all green, meaning every reproduced row reproduces.
  Deleted at the end with the config copy.
- **Counted mechanically** with `node` over `content/curriculum/stage-*.json` (109 rungs),
  `content/curriculum/vocabulary/skills.json` (16 skills) and the main checkout's built catalogue (2,092 items).
- **Scanned** the 3,842 `it`/`test` blocks of `app/tests/unit` (regex) for an accuracy assertion beside a nonzero
  wrong count. One was found (named in the note).

## Evidence: observed and inferred

**Observed** (scratch reproductions, at the base):

- Keep tempo with a stray key beside every right note: accuracy 1, passed, codes `hhhh`. Wait, same playing:
  accuracy 0, codes `wwww`.
- A stored Keep tempo row at accuracy 1 with 4 wrong notes meets a rung's standard. The pitch channel reads all
  four steps right.
- A late D is recorded as a miss and a wrong note (`[1, 62]`).
- 0 of 109 rungs give a tempo floor at or below 0 at either Settings bound (30 and 130); a Wait row meets none.
- A Clean self-report meets no standard.
- A piece and a generated-family item get no skills in force.
- A Wait first reading with names on and the guide off gives full-standard interval-reading evidence.
- The support share equals Part G's pass constant, and no skill has a threshold field.
- A microphone pass meets the rung's standard while `scoreOutcome` calls it `unknown` and `cameTo` calls it
  `played`.

**Counted:**

- 11 rungs state tempo 0.
- 9 full standards list `guide-off`; 5 of them are reachable in Wait.
- 821 composition items, 0 declaring skills; 233 items declaring skills (9 reading rows and 224 generated).
- 8 of 8 skill or reads requirements can be met through an in-force reading row.
- 67 drill kinds, none continuity-like.
- 13 of 15 measurable skills' full standards list `unseen`.

**Inferred** (from code and vocabulary, not run):

- The other four Wait-reachable reading skills behave as interval-reading did.
- The microphone mismatch reaches Today's row through X46's completion path.
- G80's composition branch is unreachable for evidence.
- No current consumer reads a drill or lab playback as an encounter.

**Unchecked:**

- Browser specs for old-behaviour assertions (the builder's).
- Lesson prose for application claims.
- Which tree the main checkout's build came from.

## Premises found wrong

Brief said X, evidence showed Y, so Z (the note's section of the same name, items 1–8):

1. **The brief's L10 premise.** Wait passes nothing, so the decision is what a wrong key costs in Keep tempo, not a
   threshold per mode.
2. **"The rest follow from L10."** Refuted.
3. **X46's input "a rung asking no tempo".** The set is empty. Three spec sentences are corrected in lane 1.
4. **X46's note "the three agree on what counts".** Not for a microphone pass.
5. **A naive "net of wrong notes" rule** would double-charge a late note. The decision covers it.
6. **The brief's ownership list** missed eight files.
7. **G71's wait on CL05.** CL05 has closed.
8. **L102's blocker** (the ladder reading family). Removed by G2; what remains is a product choice.

## Choices

**L102 (owner or reviewer: curriculum and pedagogy).**

- **Keep (recommended):** skills move only from sight-reading, and the rung sentences "from what your reads show"
  stay true.
- **Switch on:** practised drills can meet five skill requirements on four rungs (1.5, 2.2, 2.5, 4.5). Coordination and position-shift drills
  can reach *proficient* in two days. Today may offer drills, and those rung sentences must be rewritten.

## Not done

- **No app code, by design.** The builds are specified, not built.
- **No browser run.** No row's reproduction needed one.
- **The optional Keep tempo card sentence** (the note's text table, last row) is left to the lane's reviewer.

## Post-action gate

The result read back is the note's per-row decisions against the brief's invariant: one evidence contract, read the
same way by every consumer. The contract is nine lines (the note's *The contract*).

- **No ruling is contradicted.** L23, L57, L58, L105, G71 and G80 are applied as ruled; L102's ruling is a question,
  answered with a choice. R23's parking and X46's approvals stand.
- **No new persistent field, enum or status is proposed beyond one vocabulary condition (`names-off`).** That
  condition is the ruling's own named remedy, and its fact is already recorded (`keys.names`). Observation
  definitions 2 is the existing stamp, doing its documented job.
- **New work raised:** lane 1 and lane 2 only. The two findings attach to lane 1, under CL11's own truth. P1
  limitation reported: skills are fed by the reading rows alone.

VERIFIED, NOT YET VERIFIED and HYPOTHESIS are kept apart in the note's *observed*, *counted* and *inferred* labels.

## Files

- `docs/design/evidence-truth.md` (new)
- `docs/prompts/runs/CL11/ENTRY.md` (this entry)
