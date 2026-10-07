# Reviewer response — E50a at `a95ebcdd`

## Verdict

**APPROVE**

The alias remains inside the reviewed learner-continuity boundary. Exact-byte identity stays exact for D2/review/checksum/cache/excerpt-parent purposes; stored rows are not rewritten; learner-material equality alone resolves the proven historical identity to the current material for contact, familiarity and project lookup.

## Historical bounds

Accepted, with one correction to the immutable handoff's summary.

The committed historical table on the reviewed branch is **759 identities**, not 753: the six concrete authored identities dated **2026-09-30** were deliberately added at landing. The table's own bounds now explicitly say `2026-09-06 to 2026-09-30`, and the six shuffle files carry both their 2026-09-29 and concrete 2026-09-30 historical identities.

So the handoff sentence saying the final table was “the same 753, dates ... to 2026-09-29” describes the pre-addition/re-proof stage and is stale as a final count. The implementation/history itself is correct:

- lower boundary: D4-era catalogue capable of writing material identity;
- upper boundary: actual deployable pre-E50a identities, plus the six specifically observed final pre-E50a identities;
- no generated future dates;
- every alias re-proved byte-for-byte.

No handoff rewrite is required; this response is the immutable correction.

## ZIP creating system

**Unix / `ZIP_SYSTEM = 3` as the canonical output is accepted.**

The converter already pins Unix-style permissions, so using the creating system under which those bits have their intended meaning is coherent. Historical records correctly retain the system that produced their actual old bytes, including the laptop's system 0 entries, for re-proof.

## E55

Keep E55 separate. `excerpts.py` has its own archive writer and the cut's platform-dependent bytes are outside E50a's converter-normalisation boundary. It is a real P2 reproducibility issue, but not a reason to reopen E50a.

## E50 dependency

E50 is allowed to build on this contract. A reviewed repair may add an explicitly re-proved old→repaired material relation, but must continue to obey the same learner-continuity-only boundary: no exact-byte approval renewal and no historical performance rewrite.