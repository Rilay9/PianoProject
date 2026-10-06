# Direction check, 2026-10-06 (for the outside reviewer, then Fable)

Written by the owner's local Claude session from the repo at `66abc46e`. It is a holistic check of whether the work is heading where the packet and FABLE.md point. It is not a ruling: Fable decides. Everything below is read from the tree or the git log, and the scope of each count is stated. Nothing was heard.

## 1. Bottom line

The direction is right, and the pace is better than the scoreboard suggests. The main risk is no longer the rules. It is sequencing: some real fixes sit on the critical path to the first shipped chain without being needed there, and the big generator lanes have not started.

## 2. Facts

**Pace:**
- The Bizet probe brief (`b8b96730`) is dated 2026-10-06 01:08. HEAD (`66abc46e`) is 08:54 the same day.
- In those ~8 hours the slice produced:
  - the chain checker and the first record (`docs/chains/A7c.1.yaml`, draft);
  - PACKET-TRACE;
  - three real fixes found by the slice (DF2, the tempo mark lost by a one-hand cut; HD1, the one-staff hand; CI3);
  - two stopped seams with sound rulings (CD1 cells; HD2 hands).
- Scoreboard: **0 / 28**.

**Where the effort went:** since the FABLE.md merge (`096de784`), 62 commits. 33 of their subjects start with Review, Response, Handoff or Brief. Lines added: docs 4,609; tools 2,112; app tests 618; app source 223; content 16.

**PACKET-TRACE (117 status rows counted):**

| SATISFIED | PARTIAL | MISSING | DEFERRED BY PACKET |
|---|---|---|---|
| 8 | 91 | 10 | 8 |

Seven of the 10 MISSING rows are generator work: the sight-reading lane (four rows); music-family property records; G14 bossa bass; G6 minor shells. The other three are A7c.4 modern tango, the rock endpoint, and the reference-method row. **The sight-reading lane is not dispatched.**

**Chain records:** one (A7c.1, draft). The checker lists `content/lessons/latin.4.md` as unresolved. The file does not exist (`git cat-file -e` false).

## 3. What is going well

- **FABLE.md is being followed.** The order of work was kept (checker → slice → trace), and every brief carries its decision rationale and its reversal condition.
- **The vertical slice is doing its job.** It found bugs no planning document found:
  - a one-staff left hand read as right;
  - a tempo mark dropped with a staff;
  - inner right-hand voices assigned to the left in two-staff scores.

  The last one is learner-facing: `ScoreSession.ts:73-74` filters hands-separate practice and Duet by `note.hand`.
- **The decisions are reasoned, not arbitrary.** HD2's whole-corpus diff before landing (2,014 files) falsified a principled-looking global rule (it breaks Moonlight I/III and Clair de Lune) and led to narrow verified overrides. CD1 dropped the density rule once its calibration falsified it, and moved both cells to one proof route.
- **The reviewer refuses to rule on claims the artifact does not carry** (hd2-corpus-diff §6).

## 4. Risks and suggested corrections, in order of impact

**R1. HD2 is in front of CD1, but A7c.1 does not need it.** The A7c.1 chain uses:
- the Bizet cut (one staff, covered by HD1);
- Por Una Cabeza bars 1–14;
- The Crave bars 21–26.

HD2's corpus diff (`docs/prompts/runs/HD2/corpus-diff.txt`) has **zero** lines for Bizet or Por Una Cabeza. For The Crave it lists 20 changed notes. It does not list their bars, and the established defect is at bar 40. **Unchecked:** whether any of those 20 notes fall in bars 21–26. Check that before the chain's Crave tap step ships.

*Suggestion:*
- run CD1's route-2 passage facts for the Bizet cut, Por Una Cabeza 1–14 and The Crave 21–26 **in parallel** with the HD2 override seam, not after it;
- then write `latin.4.md`, place the cut on latin.4, and add the acceptance test.

That is the whole remaining path to the first SHIPPED chain.

*Caveat:* La Cumparsita (18 notes in the diff) appears in A7c.1's later independence line on latin.6/7. Verify that passage before that line ships.

**R2. Ceremony per seam.** Half the commits since the merge are process commits. Narrow seams that change no unrelated behaviour by construction (the override layer, a lesson file, a passage fact) could land and be reviewed after. Keep pre-dispatch review for design decisions. That would roughly halve the round trips without lowering the bar.

**R3. Truth records are multiplying.** There are now:
- HD1's one-staff hand declaration;
- HD2's hand overrides;
- CD1's verified passage facts;
- the intake record.

All four have the same shape: file identity, bars, staff or voice, fact kind, proof, staleness. *Suggestion:* one record type with fact kinds (`hand`, `demand`, …), built once in the HD2/CD1 seams, not four stores.

**R4. "Named consumer" read too narrowly for library-wide defects.** Duet and hands-separate practice apply to every library piece. The HD2 diff already identifies reused-voice files where today's rule is wrong (the NIFC Chopin files, Prelude 17, Étude Op. 25 No. 4). Those are live learner-facing defects now. A bounded verify-and-override pass over the files the diff names as reused-voice repairs is not the 325-file migration the reviewer rightly refused.

**R5. The generator lanes have not started, and many chains' CONTROL steps depend on them.**
- Sight-reading is the packet's highest-value generator experiment, and every one of its rows is MISSING.
- G13 (habanera cell with key variation), G14 (bossa bass) and G6 (minor shells) are named CONTROLs of A7c.1, A7c.3 and A7b.1.

The sight-reading lane touches `sightReading.ts` and research tooling, disjoint from the Bizet files. *Suggestion:* dispatch it now, in parallel, under FABLE §5. Install `musicxml-io` and `hypothesis` as its first step; the trace notes neither is present.

**R6. Product capability gaps found by the first chain will recur in every chain.** Decide each once, at the app level, rather than chain by chain:
- a lesson cannot open Rhythm only (the chain says the learner must switch it on);
- spoken or self-checked answers are not stored;
- "any one of three keys counts" cannot require key variation.

**R7. Rung completion versus ability.** In A7c.1 the counted evidence is Keep tempo on the Bizet left-hand cut. The independence test (naming the cell before hearing it) is self-checked, so the rung can complete without the target ability ever being observed. That is honest under FABLE §6, but the summary and Progress screens must say so. Otherwise a green rung reads as "can tell habanera from tresillo".

**R8. Cost per chain.** A7c.1's record is long and careful (21 steps, 7 failure routes). At that depth, 28 MUST chains are a large authoring job. *Suggestion:* after A7c.1 ships, extract a per-cluster skeleton (the step pattern, the usual tools and fades, the usual failure routes), so later records fill a template rather than starting blank.

## 5. Questions for the reviewer

1. Does R1 hold? Is anything on A7c.1's path actually waiting on HD2?
2. Is one shared verified-fact record (R3) sound, or do the four kinds differ in a way that matters?
3. Should library-wide defects (R4) count as named consumers under FABLE §2?
4. Is it right to start the sight-reading lane now, in parallel (R5)?
5. Which of R6's capability gaps should be app work now, and which should stay self-checked?
