# Review response — SR3 + LB1 landing

**Verdict: APPROVE WITH ONE REQUIRED CHANGE**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

I read the immutable handoff first, then the SR3 credit rule and its callers/tests, the LB1 renderer/Score changes, the loop/long-press path, the current latin.4 instructions, the A7S phone-walk table, and the current A7c.1 record. Nothing heard; I did not run this on a device.

## 1. LB1 is approved and closes A7c.1's app blocker

Entry 263 satisfies the loop-by-tapped-bar ruling.

- The renderer now gives drawn measures a stable bar identifier.
- `measureAt` first reads the tapped measure, then uses the bar geometry for white-space/ledger-area taps, and falls back to the current window start only when the point is not on a measure.
- Double-tap and long-press use that same lookup.
- The named cases cover the actual A7c.1 needs: The Crave 21–22, the Bizet cut 7–9, and Por Una Cabeza 1–14 with its pickup numbering.
- The lesson's instruction to double-tap the first bar and then the last is now an honest description of the control.
- The added instruction for an off-page end bar is appropriate: establish the first anchor, play/hear forward, pause when the later bar is visible, then set the end. This does not change the window model.

So LB1 no longer blocks `A7c.1 -> shipped`.

The existing A7S acceptance test and chain checker were rerun on this head. The **owner's phone walk of the deployed 5aff09f1-or-later build is now the only A7c.1 shipping condition**. If every row in `docs/prompts/runs/A7S/phone-walk.md` is playable as written, the record may move to `status: shipped`, the checker should run once in that state, and the scoreboard may move to **1 / 28**.

SR3 remains separate and does not hold that phone walk or A7c.1 shipping.

## 2. SR3's credit behavior is correct

The substantive evidence rule is approved:

- a held daily read does not meet the judging rung's `runs`, `reads`, `done`, `measure`, or `skill` requirements;
- it is not re-labelled as credit for the lower rung;
- the learner's legitimate global skill evidence remains available elsewhere;
- genuine unheld reads at the judging rung count normally;
- reaching that rung later does not make the earlier held rows retroactive credit;
- the daily card shows the held learner level while the hold is active.

That is the boundary I asked for in `responses/sr2-landing.md`.

## 3. Required change — persist the hold fact; do not infer a historical credit fact from today's curriculum

I do **not** approve `heldBelowItsRung` as the durable source of whether an old run was held.

The stored phrase is good evidence of **what music was generated**. It is not a stable record of **why that narrower phrase was generated**. The current predicate answers the latter by comparing yesterday's stored options with what **today's** catalogue/vocabulary says the judging rung would write.

The handoff already identifies the failure mode: if a demand is later moved to an earlier rung, a run that was genuinely unheld when played can become classified as held afterward. The asymmetric “harder, and nothing less, is not held” guard avoids one class of false positives, but it cannot make a present-day curriculum comparison into historical provenance.

That is exactly the sort of retroactive reinterpretation the run header exists to avoid.

### Required shape

Persist the route's hold at run time, when the app actually knows it.

The smallest coherent shape is an **optional run-header provenance field**, preferably alongside the opening route, e.g. `opened.hold?: string` (or an equivalently narrow optional field if the implementation has a stronger reason). It means only:

> this sight-reading phrase was deliberately generated under this lower learner-rung hold while another rung judged the run.

Then:

- SR3's rung-credit exclusion reads that stored fact directly;
- an unheld run stores no hold;
- legacy rows with no hold keep their old behavior and are **never guessed/reclassified**;
- `material` remains the exact generated phrase identity and is not overloaded into policy provenance;
- no historical row is rewritten.

Because `RunHeader` already uses optional additive provenance fields with absent-as-legacy compatibility, I do not require a DB migration/version bump **unless the actual persistence/backup schema proves an optional field cannot round-trip without one**. Verify that rather than bumping ceremonially.

### Required tests

Keep the existing five behavioral cases and 75-run sweep, and add the adversary the inferred implementation cannot pass:

1. write one unheld run and one held run;
2. then change the in-memory/current vocabulary or row policy so today's `phraseOptions` comparison would classify them differently;
3. their held/unheld status and rung credit remain exactly what was stored at play time.

Also prove backup/restore or the normal SessionRow round-trip preserves the optional hold field if that path has a schema whitelist.

Once this narrow provenance fix lands, SR3 is closed; no broader evidence redesign is requested.

## 4. Scope

Do not reopen SR2's generation policy, sight-reading contracts, A7c.1, LB1, or the global evidence model for this change. It is one missing historical fact at the run boundary.

**A7c.1 may proceed to its phone walk now.**
