# Reviewer handoff — Entry 258 (SR2): the daily read held to the learner's taught set and 3/4 as one vocabulary fact, landed under your SR1 ruling; two open evidence questions

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

Implementation HEAD: `152f6582` (Entry 258 in `docs/pending-review.md`, every change itemised; the lane's `docs/prompts/runs/SR2/README.md` and `differential.md`). Respond in `responses/sr2-landing.md`. Response required for §2; §1 and §3 are the artefact review. Nothing heard; no picture was taken of Today in this lane.

## 1. Your ruling, applied, and two decisions the orchestrator took inside it

§2 (the daily read): the unanchored daily offer is held to the learner's own taught set and still judged at 1.5; where no valid phrase exists the learner gets no daily read and no *Sight-read* door, which is exactly rungs 0.1-0.4 (every generated phrase moves by step; steps are taught at 1.1); at 1.1-1.2 the phrase is steps only. The acceptance case you asked for is `dailyReadHeldToLearner.test.ts`, red on the base. §1 (3/4): `metre.three-four`, scoped to exactly 3/4 (3/8, 3/2 and the compound metres are adversaries in its detector test), taught at 1.4; the "4/4 only before 4.5" promise now reads the vocabulary. §3: `-2-right` was tried with 3/4 and reverted on its own predeclared floor (3.55 and 3.58 notes per bar against 3.78); the 3.4 row untouched; the key signature at 3.4 stays PARTIAL. §4: the golden re-pinned only for intentionally changed rows (none, after the revert): the research differential shows 12 declared, 12 moved, 362 byte-identical.

Two decisions the lane could not take, made by the orchestrator inside your ruling and reported here for your read:
- **The reader's 3/4 move is offered only on the single-hand rows.** On the two-hand rows (3.4-4.7) the generator's broken-chord left hand in bars of three beats read as an untaught walking bass in 170 reachable recipes and 2 recipes lost a promised dotted quarter; your §3 lets 3/4 enter only where the existing contracts still pass, so there it waits for a predeclared contract. The control has no `on` patch under a left-hand part (the one place deciding a move's existence); `UNREALISABLE_AT` declares 3.4-4.7.
- **`metre.three-four` is curated-only** (`opportunity-density.json`, the reason beside it: a density rule chosen so that 1.4's three waltz drills pass would be calibrated on the case it judges, which your threshold rule forbids), and 1.4's concept claim is established through the rhythm family's waltz contract (`metre.three-four` in every bar), with partitura's time-signature read as the witness (2,011 rows agree), the route you approved for the cells.

## 2. Two evidence questions the lane surfaced (response required)

1. **Held daily runs credit rung 1.5.** Five daily runs held at 1.1 (steps only), judged at 1.5 as you ruled, meet 1.5's `reads` requirement, its interval-reading "familiar" and count as one of its two exercise runs, so steps-only phrases satisfy most of the "Steps and skips" rung before the learner reaches it. The judging rung was kept for route and evidence semantics; this is the evidence consequence. Options the orchestrator sees: a held run counts toward the rung whose taught set it was held to (1.1), not the judging rung; or a held run counts toward no rung's `reads` until the learner reaches the judging rung; or it stands. Say which, or another shape; this is an evidence rule, so it is reviewed before building.
2. **The card prints "L1.5"** over a phrase held at 1.1. Wording the learner meets; the orchestrator's lean is to print the hold's rung level when a hold is in force; say if you read it otherwise.

## 3. Findings recorded, not fixed (no response needed)

1.2 lists a 3/4 waltz (`exercise.rhythm.waltz-quarters.4bar`) two rungs before 1.4 teaches 3/4: the probe now refuses it `untaught` there (the one new probe line). The walking-bass control's `off` does not remove the walking bass in bars of three beats. The vocabulary has no demand for half or whole notes or the treble clef, so the hold cannot see them. The rhythm family's `notJudged` text says no skill has an opportunity in the waltz patterns, now untrue.

Also running: lane A7F (A7c.1's step-20 line on latin.6 and latin.7, and the checker resolving built generated ids through a committed manifest the build keeps fresh), the last two conditions you named before `reviewed`; its brief is `briefs/a7c1-finish-step20-and-generated-ids.md`.
