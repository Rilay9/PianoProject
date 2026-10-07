# Reviewer handoff — A7c.1's record is complete: every ref resolves, the step-20 line is on the page; `reviewed` is yours, and the one seam left before `shipped` is building

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

Implementation HEAD: `4f372bf1` (Entry 259 in `docs/pending-review.md`). Respond in `responses/a7c1-reviewed.md`. Response required: the record's `status` moves on your read, never on the orchestrator's. Nothing heard.

## 1. What the record is now, and where to read it

`docs/chains/A7c.1.yaml`: twenty steps on latin.4 (Entries 252, 256, 257), the step-20 task line on latin.6 and latin.7 (Entry 259), two generated families (`tresillo`, `bass_cell`), the failure routes, the independence test, the evidence block. The checker: `A7c.1 (draft); 0 failure(s), 0 unresolved ref(s)`, the four `bass_cell` ids resolving through `tools/content/generated_ids.json`, the manifest the content build writes and fails on when stale (your H7 condition, `responses/g13-habanera-control.md` §3). The step-20 line, quoted whole in Entry 259: before playing *Por Una Cabeza*, *The Crave* or the second part of *La Cumparsita* (latin.6) and *El Choclo* (latin.7), the learner decides from the page whether the left hand uses the habanera, the tresillo or neither and the first bar where it stops, then checks by *Hear it* and by tapping with Rhythm only on a loop; the line names no cell, says the naming is self-checked and earns nothing, and points to latin.4's grid. Two honesty notes the lane recorded: latin.6's own paragraphs already name The Crave's tresillo and describe Por Una Cabeza's pattern (so the line asks for the decision before reading on; El Choclo is the only wholly unnamed left hand with a detected cell), and latin.6 says Por Una Cabeza's left hand is "bar after bar the same" while the record says 56 of 66 bars and latin.4 says bar 15 breaks it (recorded, not fixed).

**Asked:** set `status: reviewed` on your read of the record against the landed pages, or say what stops it. Your 6e7475c1 conditions (the strict G13 control; the step-20 line) are both landed.

## 2. The one seam before `shipped` (lane A7S, building; brief `briefs/a7c1-shipped-acceptance-path.md`)

FABLE §9: a self-checked independence test needs the app to expose and record only the permitted self-check and award no unsupported skill evidence; the checker's R8 reads one top-level `acceptance_test` path. A7S extends `app/tests/unit/latin4Completion.test.ts` into that path: the two counted runs meet latin.4; every self-checked step's Hear it, Rhythm only or Wait for me row, on latin.4's options and on latin.6's and latin.7's pieces, awards no evidence for `habanera-and-tresillo` and stores nothing that names a cell; a mutant that counts a Rhythm only row as a Keep tempo row goes red; a per-step table of the control that reaches each of the twenty steps on the deployed app (the phone-build condition of FABLE §1 is yours and the owner's to confirm on a device; the table says where to tap). Say now if you want a browser-driven acceptance instead; otherwise A7S lands under the fast path and the scoreboard question (1/28) comes to you with it.

## 3. Also landed since your last read, for the record

Entry 257 (the cut decision re-issued as you ruled; the owner's experience-variety direction folded into FABLE §4), Entry 258 (SR2, its own handoff `sr2-landing.md` is open with two evidence questions).
