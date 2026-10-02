# CL17 — one level: the scalar becomes a sort key that carries its provenance, generated items stop claiming a judgement, and learners see demands (a trace, then a build; CL17 with R8)

Labels: **VERIFIED**, **SETTLED**, **HYPOTHESIS**, **OPEN**, **OUT OF SCOPE**, as in `CL11-what-counts-as-evidence-traced-and-decided.md`.

## What a learner meets now (VERIFIED at `385c0131`)

- **A computed number is printed as the piece's truth.** `levelLabel` prints `L7.1`, or `≈ L7.1` when estimated (`widgets.ts:375`).
- **A table lookup is labelled as judged.** There are two sources: `LevelSource = 'judged' | 'estimated'` (`curriculum/types.ts:28`). The generator writes `levelSource: "judged"` on levels it derived from a table (`generate_exercises.py:969`). `levelConfidence` ranks judged 1 and estimated 0, and counts an item with no source as judged (`selectors.ts:117–124`).
- **The old fields remain.** `abrsmGradeApprox` (`types.ts:128`, :642) and `levelBand` (`types.ts:626`) are still in the types.
- **Two definitions of a row's level.** Per X37, on 308 of the 542 PDMX rows, the stored level differs from what the committed model gives on that row's own stored features. Re-measuring would move three songs on rungs out of their lesson's stated band.

## SETTLED

From R1's ruling (`responses/questions-e71ef3ad.md`) and from R28 and G6 (`responses/questions-53670d2a.md`):

- **`levelEstimate` is the one surviving item-level scalar.** It is `{ value, provenance: { from: 'model', version } }`, used for sorting and tie-breaking only. A human judgement may replace it for sorting or calibration, with who-and-when provenance. It never stands for a learner's ability or a curriculum address.
- **Generated items write no `judged`.** This resolves G6.
- **`abrsmGradeApprox` is removed.** Stage-level descriptive ABRSM text may stay.
- **`levelBand` stops being authored truth or a build or eligibility gate.** Needs and demands, set against taught material, own eligibility (R8). A derived band may survive only as a report or display artifact.
- **Learner-facing screens show demands or rung context, never the scalar as the piece's truth** (R16). The Python–TypeScript parity tests stay.
- **`level` survives only as a migration or compatibility shim.**
- **R28:** the measured features and demands, under one measurement fingerprint, are the canonical analysis. No new `PieceAnalysis` object unless atomic consumers need one.

## Phase 1: the trace (reviewed before anything is built)

1. **Every reader and writer** of `level`, `levelSource`, `levelBand`, `abrsmGradeApprox` and `levelConfidence`, in TypeScript and Python, in content and in stored data. Class each one: sort or tie-break, eligibility or gate, display, or stored.
2. **The stored learner data** that holds any of them (IndexedDB records, backups), and what a migration must keep.
3. **X37's two definitions:** which one becomes `levelEstimate`, and what happens to the three songs X37 names.
4. **R8:** the band gate's replacement by needs-versus-taught, traced against `validate.level_band_errors`.
5. **The slices, in order,** each with red-first cases and its files.

**From the review** (`responses/385c0131.md` §3): Phase 1 only; the trace returns for review before any build. The inventory's completeness covers indirect readers and writers, not only literal names: destructuring and spread copies, JSON and content keys, generated artifacts, database migrations, backup and import serialisation, Python dictionary access, and UI helpers such as `levelLabel`. The trace states those coverage classes and any path it excludes.

## OPEN: yours to decide

- **What each screen shows in place of `L7.1`** (the Library row, Details, the project sheet), in three designs (`04` §0 R7).
- **How long the `level` shim lives.**
- **R8's gate rule.**

## Done when (phase 1)

- `docs/prompts/runs/CL17/trace.md` holds the classified inventory.
- `docs/design/one-level.md` holds the slices and the screens' replacement words, with three designs for each screen.
- **The falsifier is stated:** a reader the trace missed. Name the search that proves the inventory complete (its patterns and paths), and its scope.

Phase 2 builds the approved slices. Each slice moves a pin only with its reason, and itemises every rung placement it changes.

## OUT OF SCOPE

- **CL10's detector readings** (CL10a).
- **The level model's features** (R3).
- **Re-quarrying PDMX** (X37's build, which follows this lane).

## Stop and hand back if

- **A slice needs a stored-schema change.** State it first, with the migration.
- **The new gate would take a piece off a rung.** Itemise it and stop: that is a curriculum decision.
- **X37's three placements need a decision** on widening the band or moving the piece.

**Scope:** read anywhere. Phase 1 writes only `docs/prompts/runs/CL17/` and `docs/design/one-level.md`.

Never name an AI model in any file.

## Record

lane: CL17 · closes: R1, R16, G6, R28, R8 · entry: 227
index: One level: the scalar a sort key with its provenance, generated items stop claiming judgement, learners see demands; traced, then built (`CL17-one-level-traced-then-built.md`) | design | drafted 2026-10-02 (`CL17-one-level-traced-then-built.md`); Entry 227
in-flight: drafted 2026-10-02 (`CL17-one-level-traced-then-built.md`): every level reader and writer traced and classed, the stored data and X37's two definitions, then slices; the rulings on R1, R16, G6 and R28 settled, R8's gate with it (Entry 227)
state: approved 2026-10-02: approved before dispatch, Phase 1 only, the trace with its coverage classes returns for review (Entry 227)
