# Reviewer handoff — the G13 brief before dispatch: a generated 2/4 habanera drill family as A7c.1's strict control

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 91, MISSING 10.**

The brief: `docs/prompts/runs/curriculum-review-2026-10-05/briefs/g13-habanera-control.md` (passes the checker's brief lint; the commit carrying this handoff). Respond in `responses/g13-habanera-control.md`. Response required before dispatch: a new generated family is a design decision (FABLE §10). Nothing heard.

## 1. The design, in five lines

- A new family `bass_cell`, maker `make_bass_cell(tonic, cell)`, four items: `exercise.bass-cell.habanera.c`, `.f`, `.g` and the 2/4 control `exercise.bass-cell.tresillo.c`. NAMED-PATTERN, `presented_as: drill`, deliberately mechanical (FABLE §4).
- The pair holds 2/4, ♩ = 60 (the Bizet cut's tempo, inside your ≤ 100 bound), eight bars, the tonic root on every left-hand onset, the right hand holding the tonic triad; only the onset set varies: {0, 3/8, 1/2, 3/4} against {0, 3/8, 3/4}. Keys C, F, G, major only.
- Proof: the family contract (`requires` and `forbids` per cell, with the cross-failure) measured by the app's detectors and counted only where the partitura witness agrees bar for bar (the gate Entry 249 built); spelling and roles by partitura with music21 as the theory source; the parameter space enumerated, not sampled; five near-miss cases red (the sibling, dotted eighth plus three sixteenths, even eighths, one wrong bar, a witness disagreement). Chord-tone roles over changing harmony and the feel are UNKNOWN and not claimed.
- The record edit is the first finish item (the family entry and the steps 6, 7, 7a, 7b), kept `draft`. The lesson's contrast steps are rewritten to compare the 2/4 pair like for like; the Bizet cut stays the MODEL.
- Rejected classes, with reasons in the brief: extending the tresillo family (its contract forbids notes shorter than a quarter and is proved on shipped items); re-cutting the tresillo items into 2/4; a real pair (none holds everything but the cell fixed); a 4/4 habanera with doubled values at 84 (the sourced definition and the MODEL print the 2/4 figure, and the doubled 4/4 form is what *Por Una Cabeza* prints, the unseen task).

## 2. The one open question (pedagogy; the owner decides if you and I disagree)

Once the four items join latin.4's `exerciseOptions`, the existing requirement `{runs, from: exercises, count: 1}` is met by a passing Keep tempo run of **any** of the seven exercise options (`rungState.poolOf` pools every option when no `items` are named). The brief settles on that and says so in the record: the rung no longer requires the tresillo at pitch, which is latin.3's. The orchestrator's lean is the other way: keep the record's intent that the learner has both cells at pitch on this rung, by naming the four tresillo items (the three 4/4 ones and the 2/4 control) in that requirement's `items`, inside this lane, since the habanera at pitch is already the counted Bizet run. Say which, or a third shape; the brief is edited before dispatch, not after.

## 3. Also for your read

Four new items will carry no teaching-use decision, like the tresillo items (§1 of `handoffs/lp1-latin4-placement.md`); the generator-continuity route may leave the checker listing the new ids as unresolved in the draft (the brief's H7), which blocks `reviewed`, not the build; `make_tresillo`'s latent integer transpose is recorded, not fixed.
