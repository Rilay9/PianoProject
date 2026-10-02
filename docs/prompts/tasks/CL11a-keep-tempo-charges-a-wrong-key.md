# CL11a — Keep tempo charges a wrong key; a microphone pass counts on Today; Progress keeps the learner's word as theirs (a build, lane 1 of CL11)

Labels: **VERIFIED**, **SETTLED**, **HYPOTHESIS**, **OPEN**, **OUT OF SCOPE**, as in `CL11-what-counts-as-evidence-traced-and-decided.md`.

**SETTLED, the design** (`docs/design/evidence-truth.md`, approved in `responses/1afa30d3.md`): read its section *The build*, the row sections it cites and *Learner-facing text the build changes*. The response's §2 acceptance points for this lane are part of this brief, and they govern where they are more specific than the note. The note's counts came from scratch reproductions that were deleted (`responses/1afa30d3.md` §3): re-derive each count you rely on at this tree.

## Problem

- **In Keep tempo a stray key costs nothing.** A run with a wrong key beside every right note scores 100 % and passes, where the same playing in Wait scores 0 %. A right note played late is charged twice, as a miss and as a wrong key.
- **Today shows a microphone pass as *played*** while the lesson page counts it.
- **Progress counts pieces the learner only said they know as passed.**

## What to build

The note's lane 1 rows: `PracticeEngine.ts`, `Scoring.ts`, `db.ts` with `measurement.ts` (observation definitions 2), `sessionRun.ts` (`scoreOutcome`), `ProgressScreen.ts`, and the spec sentences. Add the Keep tempo help line (`MODE_HELP.tempo.counts`, `help.ts:118`), which the response asks for: before playing, the learner knows extra keys cost credit.

**SETTLED, from the response:**
- the authored threshold is unchanged;
- the late-note exemption refers to an identifiable missed note, once per expected pitch occurrence;
- rhythm-only stays rhythm-only;
- definitions-1 rows keep their old reading;
- observed hit counts stay distinct from the net verdict (audit `measuresOf` and its consumers);
- estimated failures keep caution;
- `scoreOutcome`'s self-report, rhythm-only and repeated-phrase exclusions are kept.

**Acceptance, by layer:**
- **Unit:** every row of the note's table with its fail-now, pass-after case, red first on the base. The response's cases: repeated same-pitch steps, partial chords, a second late strike, the existing early-then-on-time case, and an unrelated extra key never forgiven because its pitch appears elsewhere. One mutant per mechanism.
- **Browser:** the specs the test map names for these files.
- **Pictures:** each changed visible state (the sheet's accuracy and wrong notes, Today's row, Progress's totals) on phone upright, phone sideways and tablet (`04` R7).
- **Tests that assert the old behaviour** are replaced, never deleted silently (the note names `engineTempo.test.ts` :159–174). Search the browser specs as the note asks.
- **Learner-facing text** itemised: where, before, after, why.

## Scope

**Owned:** the note's lane 1 files, `help.ts` (`MODE_HELP.tempo.counts` only), their tests, `docs/02-curriculum.md` Part G, `docs/05-score-follow-engine.md` §2–§3, `docs/08-test-map.md`, `docs/prompts/runs/CL11a/`.

**Not yours, in flight:**
- CL11b (`skills.json`, `evidence.ts`, `ladder.ts`, `transferPolicy.ts`, `demandReadings.ts`, `curriculum/session.ts`, `validate.py`);
- U122c (`ScoreScreen.ts`, `style.css`, `help.ts`'s away note).

**OUT OF SCOPE:** activating drills as skill evidence (L102, kept); microphone detector quality; the threshold's value.

## Stop and hand back if

- the exemption cannot be bounded without forgiving an unrelated key;
- a consumer of the hit count cannot keep raw and net apart without a new stored field.

## Handoff

Judgement first: what a learner now meets. Then:
- each case, red and green;
- the mutants;
- the checks, with exit codes;
- the text itemised;
- where the brief or the note was wrong.

Nothing heard: whether net-of-wrong-keys at the rung's bar teaches well is unverified as teaching. `operating-procedure.md` §14. Port **5513**, from a config copy under `app/build/cl11a/`; `--workers=2`. Never name an AI model in any file.

**Landed 2026-10-02** (Entry 219; 26733bcb, merged 0eca83a1); handoff `handoffs/26733bcb.md`.

## Record

lane: CL11a · closes: L10, U126, U127 · entry: 219
index: Keep tempo charges a wrong key, a microphone pass counts on Today, Progress keeps the learner's word as theirs: CL11's app-code lane (`CL11a-keep-tempo-charges-a-wrong-key.md`) | build | drafted 2026-10-02 (`CL11a-keep-tempo-charges-a-wrong-key.md`); Entry 219
in-flight: drafted 2026-10-02 (`CL11a-keep-tempo-charges-a-wrong-key.md`): CL11's lane 1, the wrong-key rule with a bounded late-note exemption, observation definitions 2, the microphone outcome, Progress, the Keep tempo help line (Entry 219)
state: dispatched 2026-10-02: dispatched at ee62c06c, building here (Entry 219)
- landed 2026-10-02: merged 0eca83a1; handoff `handoffs/26733bcb.md`
