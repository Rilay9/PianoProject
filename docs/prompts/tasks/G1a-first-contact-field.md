# G1a — The first-contact fact given its own name: `firstContact` on every run the Score screen records, `unseen` kept as the generated phrase's sight-reading condition, the four readers that guard through `isPhraseRun` reading the phrase's field only, no consumer of general contact needing `isPhraseRun`, rows from before G1 readable without manufactured contact

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/b48342f.md` in full (the G1 review: the core accepted; the required change and its five acceptance lines; question 2's answer — G2 owns the offer's wiring, X1 consumes that one truth); `docs/prompts/entry-112.md` finding 1 (the four readers that gave the fact sight-reading's consequences, and the alternative this brief chooses) and decision item 4; `app/src/data/db.ts` at `RunHeader.unseen` and `isPhraseRun`; `docs/prompts/views/audit/part-26.md` §1 ("unseen never the universal novelty flag").

## The goal, in the orchestrator's words

Since G1 one boolean on the run header means two things: on a generated phrase it is sight-reading's evidence condition (was this genuinely first sight, by the visit rule), and on a notated piece, an excerpt or an import it is the factual encounter relation (had the learner met this material before). The builder made that work by teaching four readers to ask `isPhraseRun` first, so a piece played again keeps its pass. The reviewer accepts the model and refuses the boundary: every future reader must know which meaning is legal. G1a gives the fact its own name so that a consumer of general contact — G2's offer wiring, X1's session, the later lifecycle — reads `firstContact` and never asks whether the run was a phrase.

## What is decided

1. **The field.** `RunHeader.firstContact?: boolean` — the factual encounter relation of the run's material at the moment of the run, exactly G1's derivation (`encounterStore.firstContactIn`, rechecked before the run is stored): `true` where nothing of this material had been met before — no run of it, no playback or demonstration of it on any visit, no viewing of it on another visit — `false` otherwise. Written by the Score screen on every run it records: notated, excerpt, import, generated phrase. A fact, never a competence or evidence state, never a gate on a pass.
2. **`unseen` is the phrase's.** It stays the generated phrase's sight-reading condition, written on phrase runs only, as C1 wrote it before G1. A phrase run carries both: `firstContact` the relation, `unseen` derived from that relation and the visit rule — today one derivation gives both values; keep it one derivation with two names, so a later change to the visit rule can move `unseen` without touching the fact. Ordinary runs carry `firstContact` and no `unseen`.
3. **The readers.** `recordRun` (`progressStore.ts`), the rung state's `measured` (`rungState.ts`), the evidence job (`evidenceJob.ts`) and the history line (`ProgressScreen.ts`) keep reading `unseen`, the phrase's field; `isPhraseRun` stays the phrase classifier where a legacy phrase row has no recipe, and no consumer of general contact calls it. Every reader of `unseen` on this tree is classified in the entry: a phrase read (stays), or a general-contact read (moves to `firstContact`, with the reason). `session.ts` near 2328 and 2334 (`row.unseen === true` over the day's phrase rows) and `evidence.ts` 571 (the ladder's `firstContact` observation from `unseen`) look like phrase reads; say so at the lines or say otherwise. `progressStore.contact`/`contactIn` read the encounters and the runs' material, not the flag; confirm at the lines.
4. **Rows from before G1a.** No database version, no rewrite. A row from before G1 has `unseen` only where it was a phrase, and neither field otherwise: nothing is manufactured. A row written by G1's app between its landing and this one carries `unseen` on an ordinary run; `isPhraseRun` reads it as before (the material is not a sight-reading generator's), and its `firstContact` is absent — unknown, never inferred from the old flag. Say in the entry that this is the only window where an ordinary row carries `unseen`.
5. **Acceptance, as tests** (the reviewer's five lines): a piece played again passes and meets its rung exactly as now (the G1 cases in `materialLayer`, `rungState`, `recordRun` preserved); phrase evidence still refuses a heard or previously seen phrase (`firstContactOnTheScore`, `evidenceJob` cases preserved); the history line for a phrase not first sight still says so; a general-contact consumer reads `firstContact` over a mixed history — phrase runs, a notated run, a G1-era ordinary row, a pre-G1 row — without `isPhraseRun`, in a new unit case; rows from before G1 read with no manufactured contact.
6. **Not G1a's:** the encounter store's shape and the `contacts` summary (accepted); the visit rule; G1b (the lifecycle); G2 (the offer's wiring, which consumes `firstContact` next); X1; the Progress screen's UTC display (a separate small bug the reviewer named; record it as a G row, do not fix it here); any new evidence state.

## Verification layers

- Unit, red first: a notated run stored with `firstContact` and no `unseen`; a phrase run with both, equal today; the consumer case of item 5; the legacy rows; the existing G1 unit files preserved (`firstContactOnTheScore`, `materialLayer`, `encounterModel`, `observationsFromRun`, `rungState`, `evidenceJob`, `contactNovelty`, the Progress history helper).
- Browser, on port 4273: `sight-reading.spec.ts` and `progress.spec.ts` preserved; G1's browser case (heard, left, returned, read → *not first sight*) preserved.
- The product look: the history line at 342 × 740 for a phrase read on a later visit, as an observation, preserved from G1's picture; nothing heard.

## Rules and files

You own `app/src/data/db.ts` at `RunHeader` (the new field, the two notes) and `isPhraseRun`'s note, `app/src/ui/screens/ScoreScreen.ts` at the run header's write and the recheck before storing (near 3400 and 3462–3485), `app/src/data/progressStore.ts` at `recordRun`, `app/src/evidence/rungState.ts`, `app/src/data/evidenceJob.ts`, `app/src/ui/screens/ProgressScreen.ts` at the history flag, `app/src/curriculum/session.ts` at the two reads only if they are general-contact reads, `app/src/evidence/evidence.ts` at the observation only if it must change, the unit files named, the `docs/04` §5 rows for the run header's facts as doc rows in the entry (not the file). Not: `encounterStore.ts`'s query (say so if a name there must change), X3's import files (`importStore.ts`, the import sheet, `LibraryScreen.ts`), F2a's content and stage files, the E-tail's `validate.py` and lessons, `docs/08` (doc rows in the entry). A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` first (Q24). Never name an AI model. Never assert a number measured on this machine. Every change red first; no commits, pushes, stashes or checkouts — report the files and the orchestrator commits by name.

## Sequencing

G1a starts from the tree at 72015a7 (G1, Q47, E2a, F2, D4a, D5, E2, D4, Q-tooling and U74 landed). G2's brief waits for this landing and consumes `firstContact`; G1b may be briefed alongside where it does not read the run field.

## When to deviate

If a reader of `unseen` is a general-contact read whose move to `firstContact` would change a verdict on any existing case, stop that reader, keep the test red, and say which verdict. If a phrase's `unseen` and `firstContact` would differ on any existing case, say which case and why — they should not today. If the Score screen cannot write `firstContact` on a run without touching X3's import path, say which lines.

## Report

Judgement first: the history line and the rung credit for a piece played again, before and after, as observations; then Done / Not done / Follow-ups / Questions / Files; the readers table (every `unseen` reader: which field now, why); the red lines; the tests table; exit codes; unverified beside what passes.

**Landed 2026-09-29** (Entry 119; 5b14b7a, merged 7002ee5); handoff `handoffs/5b14b7a.md`. G72 recorded.

**Closed 2026-09-29** (`responses/5b14b7a.md`, APPROVE): the boundary the G1 review asked for; G2 released.

## Record

lane: G1a · closes: — · entry: 119
index: The G1 review's required change: `firstContact` on every run the Score screen records, `unseen` kept as the generated phrase's sight-reading condition, the four guarded readers reading the phrase's field only, no consumer of general contact needing `isPhraseRun`, rows from before G1 readable without manufactured contact (`G1a-first-contact-field.md`) | G1 (Entry 112); `responses/b48342f.md` | `db.ts` at `RunHeader`, `ScoreScreen.ts` at the header's write, `progressStore.ts` at `recordRun`, `rungState.ts`, `evidenceJob.ts`, `ProgressScreen.ts`, the G1 unit files; doc rows in the entry | **closed 2026-09-29** (`responses/5b14b7a.md`, APPROVE; Entry 119): the boundary the G1 review asked for; G2 released; G73, G74 recorded |
state: closed 2026-09-29: APPROVE (`responses/5b14b7a.md`)
