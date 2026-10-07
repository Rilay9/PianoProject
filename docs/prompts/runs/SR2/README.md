# SR2: the daily read held to the learner's taught set; 3/4 one vocabulary fact taught at 1.4

- **Brief:** `docs/prompts/runs/curriculum-review-2026-10-05/briefs/sr2-daily-read-hold-and-three-four.md`.
- **Ruling:** `docs/review/responses/sr1-sightreading-quality.md`.
- **Base:** origin's head `110dc37e`.

Nothing heard; unverified as music.

The lane stopped once on two contract failures. The orchestrator decided both inside the ruling (§3), and the lane continued to the finish condition. Two items are left for landing (below).

## What a learner meets

- **0.1-0.4:** no daily read and no *Sight-read* door. No phrase asks only what the learner has been taught, because steps are taught at 1.1. These are 4 learner positions, as predicted.
- **1.1-1.2:** the easiest row (`drill.reading.sight-reading-1`), held to the learner's own taught set: steps only, in C position, 4/4. It is still judged by 1.5, the row's rung.
- **3/4 (`metre.three-four`, taught at 1.4):**
  - held out before 1.4;
  - offered by the reader as "in 3/4" where it is taught, but only on the single-hand rows (`-1-left`, `-1`, `-2-right`);
  - not offered on the two-hand rows (3.4-4.7, `-2`, `-3`, `-4`), where 3/4 waits for a predeclared contract (the ruling's §3). The reason is in Decision 1 below.
- **`-2-right`'s own metre list is unchanged (4/4).** Finish item 8 was reverted, because H8 was refuted (below).

## The two decisions (the orchestrator's, inside the ruling's §3)

1. **The reader's 3/4 move exists only where the phrase has no left-hand part.** The control's `on` (`readingControls.ts`) returns no patch under a left-hand part. `moveFor` reads the `on` patch first, so this is the one place a move's availability is decided. `UNREALISABLE_AT` then declares the move undoable on those rungs (kind `none`), as the generator contract requires.
   - *Alternative considered:* a special case in `session.moveFor`. Rejected: it would be a second place deciding a move.
   - *Alternative considered:* a false `mayWrite`. Rejected: it would lie to `heldToRung`.
   - *Why the two-hand rows are excluded:* with the move offered everywhere, 172 of the recipes the reader can reach broke their contracts (`composedContract.test.ts`):
     - 170 on 3.6-4.7, `timeSig: 3/4` plus `leftHand: broken`: in 12 of 12 phrases the detector reads a walking bass, untaught there;
     - 2 on `-3` at 4.5-4.7 (seed 8020): the promised dotted quarter appeared in 11 of 12 phrases.
   - *Finding, not fixed:* the walking-bass control's `off` (`leftHand: 'broken'`) does not remove the walking bass in bars of three beats. A broken chord in a bar of three quarters never comes back to its fifth, which the walking-bass detector reads as a walk.
2. **`metre.three-four` is curated-only, and route 2 establishes it** (`content/sources/opportunity-density.json`; the cells' route, `responses/d0762e52.md` §1).
   - *Why no general rule:* no named consumer needs one, and a rule chosen so that 1.4 passes would calibrate on the very case it judges. On the built catalogue (237 items locate 3/4), `metre.compound`'s rule (min 16, perBar 1) establishes 227 items and none of 1.4's three drills; min 4 establishes all three.
   - *The establishing proof:* the rhythm family's contract (`tools/content/family_contracts.json`, the `rhythm` family's `requires`) asks for `metre.three-four` in every bar of the four waltz patterns. The build's contract proof (`build.established_by_contract`, the app's detector through the bridge) establishes it on 1.4's three 4-bar waltz drills, so 1.4's concept claim `3/4` is established.
   - *The independent witness:* partitura's time signatures. It agrees with the app's detector on every catalogue file (H7).
   - *Red first:* `tools/content/tests/test_three_four_by_contract.py` failed before the rule, 4 failures (each drill's `established` was `[]`, and 1.4 raised its concept-claim error). Green after.

## Hypotheses

- **H1 held.**
  - *Red on the base path*, with the judging rung 1.5 also used as the hold:
    - 1.1: a skip in every seed. BC seed 1948132917 has skips in bars 2 and 4; seed 1 in bars 1 and 4.
    - 0.1: offered a phrase with steps on every day (seed 1948132917, bars 1-4).
  - *After:* 0.1-0.4 get no offer. At 1.1 and 1.2, nothing falls outside `taughtForLearner`. The seeds checked are the BC seeds plus seeds 1-30, written by `phraseOptions` and read by the app's detectors. The judging rung is 1.5. `app/tests/unit/dailyReadHeldToLearner.test.ts`.
- **H2 held.**
  - *Prediction*, written first, with partitura: one pair, (1.2, `exercise.rhythm.waltz-quarters.4bar`).
  - *Probe:* added exactly that line, `untaught` [`metre.three-four`], in the refusals file and in the uncoped file. No other line changed against the base probe.
  - *Placement finding (recorded, not fixed):* 1.2 lists a 3/4 waltz two rungs before 1.4 teaches 3/4.
- **H3 held.**
  - 3/4 is written only where taught, over every core rung's reader, every move it offers and seeds 1-30.
  - `-1-left` asked for 3/4 writes 4/4 at 1.3 and 3/4 at 1.4.
  - The unanchored row is 4/4 at 1.1 and 1.2.
  - No 3/4 move is offered on a two-hand row. Red first: `-3` at 4.5 offered it.
  - `heldToRung` applied twice equals once.
  - `threeFourHeldUntilTaught.test.ts`.
- **H4 held.** 12 items declared, 12 moved; the other 362 are byte-identical (`differential.md`).
- **H5 held.**
  - *Red on the base:* the reader gave `forward` instead of `lesson` on day one at 1.5, and the evidence job's first candidate was 1.5's phrase.
  - *After:* step 3 and the evidence job read the stored `material`. No new field was added.
  - `heldDailyRunRoundTrip.test.ts`.
- **H6: every moved expectation is itemised in the entry.**
- **H7 held.** 2,011 rows read by partitura agree (236 in 3/4). The 3 files partitura cannot read agree with music21.
- **H8 refuted; item 8 reverted.** With `["4/4","3/4"]`, `-2-right`'s notes per bar were 3.55 at 2.2 and 3.58 at 2.5, under the 3.78 floor, over the 150 row seeds (`3 + i*6271`). The goldens are byte-identical by sha256. The bound is unchanged.

## OPEN (for the reviewer)

1. Five held daily runs at 1.1, judged at 1.5, meet:
   - 1.5's `reads` requirement (5/5);
   - its `interval-reading` "familiar";
   - one of its two exercise runs.

   That is, steps-only phrases satisfy most of the *Steps and skips* rung before the learner reaches it.
2. The daily card prints `L1.5`, the row's catalogue level, over a phrase held at 1.1.
3. **Answered:** `reached` changes nothing at 0.1-1.2, with the default tracks or with every track. Pinned in a test.

## Landing steps (the orchestrator's)

1. Run `passages.py --verify`. The `detect.ts` edit makes every verified passage fact stale (`passages.definition_version`).
   - Until it runs, `validate.py` fails latin.4 (habanera) and latin.6 (tresillo).
   - So do `test_latin4_placement` d and g, `test_measured_truth`'s placement-reconciled test and `test_cell_proofs`' verified-hands test.
2. Reconcile the probe pin. It is repointed to this folder's `probe-refusals.txt`, against LP1's pin; main has since moved to CUT1.

## Files the build or the suites rewrote

- `docs/prompts/inventory.md`: 1.4's row names `metre.three-four`.
- `docs/prompts/rung-claims.md`:
  - the 1.4 claims, now established by contract;
  - latin.4's and latin.6's cells, unestablished until the re-verify;
  - the generated untaught combinations (58 = the record).
- `tools/content/tests/fixtures/untaught_on_rung.json`: one row (rhythm on 1.2, `metre.three-four`, 1 item).
- `app/tests/e2e/fixtures/excerpt-candidates.json`: `metre.three-four` added where Anh. 113 (3/4) carries it. 45 lines, all additions of that id.
