# Reviewer handoff — Entries 254, 255 and 256: the passage-proof staleness fix, the cut identity pin, and G13 landed; the four drills' notation for your read; two questions

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

Implementation HEAD: `f8fb9779`. Respond in `responses/g13-landing.md`. Response required for §1 and §2; §3 and §4 are evidence. Nothing heard by anyone.

## 1. Entry 256 (G13): the artefact review, and the four drills' notation for your read (the whole denominator, not a sample)

Your ruling's §2 is applied: latin.4's exercise requirement names `exercise.bass-cell.tresillo.c`, the counted runs are the 2/4 tresillo control and the whole Bizet left-hand cut, the habanera drills and the 4/4 tresillo items are practice and count toward nothing, and the record, the lesson's "what counts" sentences and the completion tests say the same (Entry 256 itemises the fifteen lesson edits where / what / before / after / why; the opening sentence is narrowed as your LP1 §2 asked). The family `bass_cell` v1: 2/4 at ♩ = 60, eight bars, the root at octave 3 on every left-hand onset, the tonic triad held above; the habanera's onsets 0, 3/8, 1/2, 3/4 of the bar, the control's 0, 3/8, 3/4; established by the family contract with the partitura witness agreeing on all 32 bars, six near-misses red (the sibling both ways; dotted eighth plus three sixteenths; even eighths; one tresillo bar in a habanera item, the witness naming bar 5; a doctored app position, the witness gate naming bar 3); spelling and roles against music21's theory over every major tonic the maker accepts. The chord-tone roles over changing harmony and the feel are UNKNOWN and not claimed.

For your notation read, the four built files, each eight bars (`app/public/content/scores/exercises/` at this HEAD; their pictures at phone upright, phone sideways and tablet under `docs/prompts/runs/G13/pictures/`): `exercise.bass-cell.tresillo.c` (counting line "1 . . a . . & ."), `exercise.bass-cell.habanera.c` ("1 . . a 2 . & ."), `.f` (one flat, F3 under F-A-C) and `.g` (one sharp, G3 under G-B-D). Findings as evidence, as FABLE §5 says; please mark any bar or counting line that is not what the record claims.

**Question 1 (a reviewed rule meeting your §1).** You asked that the four drills' teaching-use bits stay null until their built facts are reviewed. They are null. But the gate (`app/src/curriculum/eligibility.ts`, D3a, reviewed) refuses an undecided item only where the family promises music, or where the item is an excerpt; a family that promises a drill is admitted on its contract. So the four drills are admitted now: latin.4's *Start* and *Quick check* open the 2/4 tresillo control, and Today may offer the drills (inferred from the passing admission sweep and the option order, not driven in a browser). The orchestrator landed under the existing rule, because withholding a contract-proved drill pending a decision would be a new gate rule, which FABLE §10 says is reviewed before building. Say whether the rule stands for drills (then your read of the four files is the review they get) or whether you want drills to wait for a decision too (then it becomes a gate seam with its own brief).

## 2. Entry 255 (CUT1): the cut's identity, and the one decision to re-issue

Amended in `handoffs/cut-identity-machine-dependent.md` §4: the cause was one zip header byte (the creating system), not the compressor; the cutter now pins it to `convert.ZIP_SYSTEM` as the importer does, with a test red on Windows first (`0 != 3`). The six cuts' identities moved once to the values the runner already produced; the Bizet passage fact was re-bound by `--verify` and proved on every bar; the local build reproduced CI's validation failure exactly before the re-bind, which is the mechanism's discriminating test; CI at this HEAD is the end-to-end proof.

**Question 2.** Entry 253's decision on the cut binds to `9ae0d629…` and is stale by the README's rule; the cut's current identity is `a39e7695…` (the deployed one since LP1), with the inner entries byte-identical. May the same decision be re-issued on `a39e7695…` with `supersedes` naming the stale event? Until then the cut is admitted on no build, and Entry 253's "Today may offer the cut" does not hold anywhere.

## 3. Entry 254 (CD1a): your d0762e52 §2 required change, closed

`passages.py`'s own definition list is gone; the proof's version is the build's measurement fingerprint plus the witness side (`cells.py` and the partitura pin line); the declared hand a one-staff file was measured under is recorded in the proof and compared on every stale check; twelve adversary subtests red on the base (the vocabulary byte moved the build fingerprint `0febfadf45cc → 3e7896c8c3b6` while the passage version stayed; both declared-hand moves returned no reason); the four Bizet-path facts re-proved; every other row byte-identical.

## 4. A placement finding the admissions surfaced (Entry 255; for your ranking, no response needed)

Once Entry 253 admitted `exercise.tresillo.c`, the coping question ran on it where before the admission refusal hid the result: it is refused `untaught` at latin.3 (its own rung) for `texture.left-hand-pattern` and at 3.6 for `rhythm.syncopation`. The probe is re-pinned with those two lines itemised. latin.3's learner meets the tresillo exercise only through its option row today. Not fixed; it is latin.3's placement truth, not latin.4's.

Also consumed since your last responses: the PACKET-TRACE status edits of your SR1 §5 (lines 68, 74, 129, 130, 131 MISSING → PARTIAL; six rows' evidence advanced; the denominator line says so), the SR2 brief dispatched on your SR1 §1-§4 (building), and the two pinned-count test fixes CI caught after Entries 249 and 251.
