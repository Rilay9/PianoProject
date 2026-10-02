# CL11b — a Wait read with the names on is practice, not unaided reading; the evidence numbers live with the skill (a build, lane 2 of CL11)

Labels: **VERIFIED**, **SETTLED**, **HYPOTHESIS**, **OPEN**, **OUT OF SCOPE**, as in `CL11-what-counts-as-evidence-traced-and-decided.md`.

**SETTLED, the design** (`docs/design/evidence-truth.md`, approved in `responses/1afa30d3.md`): read its section *The build*, the row sections it cites and *Learner-facing text the build changes*. The response's §2 acceptance points for this lane are part of this brief, and they govern where they are more specific than the note. The note's counts came from scratch reproductions that were deleted (`responses/1afa30d3.md` §3): re-derive each count you rely on at this tree.

## Problem

- **Names-on Wait reads count as unaided.** A Wait read with *Name the note I am waiting for* on, and the guide off, gives full-standard reading evidence, because no condition records the names (L58).
- **The support share and timing precision are code constants,** copied in two places (L57). Their values do not change.

## What to build

The note's lane 2 rows:
- a `names-off` condition on the full standards that list `guide-off`;
- the support share and timing precision as vocabulary data;
- `CONDITION_MET`/`CITES` and `EVIDENCE_DEFINITIONS` 6, with one recompute;
- the readers moved to the vocabulary (`ladder.ts`, `transferPolicy.ts`, `demandReadings.ts`, `curriculum/session.ts` :2399);
- `validate.py` and the docs.

**SETTLED, from the response:**
- names-off requires an explicit recorded `keys.names === false`; absence is not proof of unaided reading;
- values are unchanged;
- verify that each named reader uses the vocabulary;
- the definitions-6 recompute downgrades named Wait readings and preserves independent reads.

**Acceptance, by layer:**
- **Unit and content:** each row's fail-now, pass-after case, red first; the guard that a Keep tempo first reading with the guide off and the names off stays full; one mutant per mechanism.
- **Content changes itemised** (`operating-procedure.md` §12: where, what, before, after, why), with the resulting learner state verified, not only schema acceptance: which learners' readings move, and to what.
- **Pictures:** only if a visible state changes, on the three R7 devices.

## Scope

**Owned:** the note's lane 2 files and their tests, `docs/02-curriculum.md` Part H, `docs/05` §9b, `docs/08-test-map.md`, `docs/prompts/runs/CL11b/`.

**Not yours:**
- CL11a's files (`PracticeEngine.ts`, `Scoring.ts`, `db.ts`, `measurement.ts`, `sessionRun.ts`, `ProgressScreen.ts`, `help.ts`, Part G, `05` §2–§3);
- U122c's (`ScoreScreen.ts`, `style.css`);
- G90's (`sessionRunner.ts`, `sessionRun.ts`, `LessonScreen.ts`).

**OUT OF SCOPE:** activating drills as skill evidence (L102, kept); any value change.

## Stop and hand back if

- the recompute would move a learner's state in a way the note does not predict;
- the names setting is not recorded on the rows the recompute must read.

## Handoff

Judgement first: what a learner's evidence now says. Then:
- each case, red and green;
- the mutants;
- the checks, with exit codes;
- the content items;
- where the brief or the note was wrong.

`operating-procedure.md` §14. Port **5523**, from a config copy under `app/build/cl11b/`; `--workers=2`. Never name an AI model in any file.

**Landed 2026-10-02** (Entry 220; 4a17f576, merged 1c89c359); handoff `handoffs/4a17f576.md`.

## Record

lane: CL11b · closes: L58, L57 · entry: 220
index: A Wait read with the names on is practice, not unaided reading, and the evidence numbers live with the skill: CL11's content lane (`CL11b-names-on-is-practice.md`) | build | drafted 2026-10-02 (`CL11b-names-on-is-practice.md`); Entry 220
in-flight: drafted 2026-10-02 (`CL11b-names-on-is-practice.md`): CL11's lane 2, the names-off condition, the vocabulary's support share and precision, evidence definitions 6 with one recompute (Entry 220)
state: dispatched 2026-10-02: dispatched at 111fcb93, building here (Entry 220)
- landed 2026-10-02: merged 1c89c359; handoff `handoffs/4a17f576.md`
- verdict 2026-10-02: APPROVE (`responses/4a17f576.md`): the precision format accepted; `transfer.ts`'s `establishing` stays on the shipped vocabulary
- closed 2026-10-02: L58 and L57 built
