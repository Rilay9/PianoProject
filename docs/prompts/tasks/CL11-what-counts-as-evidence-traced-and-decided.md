# CL11 — what counts as evidence, traced against the current tree and decided per row (a design lane, no code)

Labels: **VERIFIED** (the orchestrator checked it at the source), **SETTLED** (a ruling; do not re-prove), **HYPOTHESIS**, **OPEN** (yours to decide), **OUT OF SCOPE**.

## Problem

A learner should be able to trust that a pass means the same thing in Wait and in Keep tempo, and that every evidence and transfer rule says what it observed. Today the app's consumers do not obviously share one answer to "what does this run count toward". This lane decides that answer, in product terms, as a short design note; the build that follows is briefed from it.

## Current evidence

- **From X46's landed trace** (Entry 213, `docs/design/session-item-story.md`; its review is pending, so treat these as the builder's findings, not yet independently confirmed): a piece's run writes no skill evidence in the shipped build; a self-reported run can never count toward a rung; a Wait run counts only for a rung asking no tempo.
- **SETTLED** (R23, `responses/f860c76e.md`): no repository fact names the claim a rung's song run applies; 41 of 61 song-run rungs name nothing a detector measures. CL11 owns what can honestly count where an application's purpose is unmeasurable; X46 owns whether that purpose must be explicit.
- **SETTLED** (`responses/43045ffb.md`): ownership follows meaning. CL11 owns what observations count as learning evidence and how evidence advances a requirement, skill or rung; session purpose, presentation and routing are not CL11's even when stored beside evidence.
- **VERIFIED** (the orchestrator read the inventory): CL11's rows are L10 and L102 (open) and L23, L57, L58, L105, G80, G71 (ruled; whether each ruling is implemented at this tree was not re-checked). Rulings: `responses/questions-53670d2a.md` section 3, `responses/questions-e71ef3ad.md`. Inventory: `docs/review/surviving-work-2026-10-02.md` item 4; the rows in `docs/prompts/backlog-2026-09-25.md` (or `views/backlog/`).
- **OPEN:** whether each row still reproduces at the base.

## Invariant

One evidence contract: for each kind of run (Wait, Keep tempo, rhythm-only, self-report, a piece, an exercise, sight-reading), what it records and what it can count toward, read the same way by every consumer that reads it.

## Hypothesis and falsifier

**HYPOTHESIS:** as X46 found for the session story, most of CL11's rows are consumers or rules applying a stored truth inconsistently, not a missing model; L10 (two accuracies under one threshold) needs one decision about what accuracy means per mode, and the rest follow from it.

**Falsifier:** a row whose honest decision needs a fact no stored field holds under any read (for example a timing fact Wait mode never records), or two current consumers that cannot both be honest under any one rule. Either is a finding, not a failure: report the missing truth and its natural owner.

## What to produce

`docs/design/evidence-truth.md`:
1. Per row and per input above: still reproduces or not at the base, with file and line; its mechanism; the consumers reading the fact.
2. Per row, a decision in product terms (what a learner meets) and the smallest change that makes it true. Reuse the rulings; reopen one only with new evidence, saying so.
3. The contract the decisions add up to, as short as it can honestly be.
4. The build that follows: the change per file and, per decision, the behaviour that must fail on the current code and pass after; sized for one build lane, or split where the pieces are independent.

**OPEN:** how you organise the note, which consumers you trace, the decision on each row.

## Scope and ownership

Expected ownership, a starting boundary: `app/src/engine/Scoring.ts`, `app/src/evidence/evidence.ts`, `rungState.ts`, `measurement.ts`, `app/src/curriculum/skillActivation.ts`, `transfer.ts`, `eligibilityCore.ts`, `content/curriculum/vocabulary/skills.json`. If the truth lives elsewhere, follow it and say so.

**OUT OF SCOPE:** session purpose and presentation (X46); the Score chrome (the c6 build); whether a song-run item needs an explicit application purpose (X46's; it may become an input here once decided); code changes in this lane.

## Do not solve it by

- adding an enum, persisted field, status category or identity relation that the trace does not show a truth needs (name the truth if one does);
- treating completion as competence, `established` as strong application, or a count as quality;
- deciding a question that needs an ear: it stays open and says *no one in this process can decide this*.

## Stop and hand back if

- most rows no longer reproduce (say which do, and stop there);
- a decision needs an owner's product or pedagogy choice: state the choice and the options a learner would meet under each;
- another active seam owns the defect.

## Handoff

Judgement first: what changes for a learner, which rows close, which stay open and why, the build's shape. Every row and input answered with its evidence line, or a plain reason it cannot be. Where the brief was wrong: brief said X, evidence showed Y, so Z. Count mechanically; state the scope of every "all" or "none". Never name an AI model in any file.

## Record

lane: CL11 · closes: — · entry: 215
index: What counts as evidence, traced against the current tree and decided per row, with the contract and the build that follows (`CL11-what-counts-as-evidence-traced-and-decided.md`) | design | drafted 2026-10-01 (`CL11-what-counts-as-evidence-traced-and-decided.md`); Entry 215
in-flight: drafted 2026-10-01 (`CL11-what-counts-as-evidence-traced-and-decided.md`): a design lane, no code, built by the outside builder on its own branch; the eight CL11 rows, X46's three inputs and R23's question traced and decided (Entry 215)
state: drafted 2026-10-01: a build request to the outside builder (Entry 215)
