# Review response — SR2 landing

**Verdict: APPROVE WITH ONE REQUIRED CHANGE**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

I read the immutable handoff first, then SR2's README and differential, the daily-read acceptance test, the relevant vocabulary/density rules, and the current evidence/rung semantics. Nothing heard.

## 1. Artefact review

The landed correction is approved.

- Holding the unanchored daily phrase to the learner's actual taught set is the right boundary. No read at 0.1–0.4 is better than an untaught read; 1.1–1.2 steps-only is honest.
- Splitting exact 3/4 from compound metre is correct.
- Offering the 3/4 move only on the single-hand rows is the right response to the predeclared-contract failures. Do not weaken the existing two-hand contracts to make the new dimension fit.
- Keeping `metre.three-four` curated-only is correct. A density threshold chosen from the three 1.4 examples it is meant to certify would be post-hoc calibration. The rhythm-family contract plus the independent time-signature witness is the honest proof route.
- Reverting `-2-right` after it missed the existing notes-per-bar floor is exactly the threshold discipline SR1 required.
- The declared-versus-moved differential (12/12 moved; 362 byte-identical) is an adequate blast-radius proof for this seam.

The findings in §3 stay separate follow-ups; they do not reopen SR2.

## 2. Required change — the hold must govern credit and learner-facing level, not only generation

The current result separates generation from judging only halfway. A phrase held to 1.1 must not be allowed to satisfy 1.5 merely because the underlying catalogue row is judged there.

### Evidence / rung requirements

Keep the learner's **global skill evidence** for what was actually observed. A successful steps-only sight-read is still evidence about the learner's reading; do not delete or relocate that observation merely because it occurred early.

But a run whose stored material says it was **held below the judging rung** must not satisfy that future rung's `reads`, exercise-run, or skill requirement. In particular, the five 1.1-held steps-only runs must not pre-complete 1.5's *Steps and skips* requirements, either immediately or retroactively when the learner later reaches 1.5.

Do not re-label those rows as full 1.1 rung credit unless 1.1 has a requirement that independently asks for them. The clean rule is:

> the judging rung may still define the evidence semantics, but rung-requirement credit is refused when the stored generation hold is below/different from that judging rung.

Once the learner reaches 1.5, new unheld 1.5 reads can satisfy 1.5.

This preserves the earlier evidence-ownership rule: evidence belongs to the learner wherever observed; **requirement credit does not cross the material boundary that made the observation easier/narrower**.

### Card label

Likewise, `L1.5` is false/misleading over a phrase deliberately constrained to 1.1's taught set. When a hold is present, show the hold's learner level/rung (for example `L1.1`), not the catalogue row's judging level. With no hold, keep the existing label.

These are two consequences of one rule: **a hold is part of the learner-facing material identity for this offer, not an invisible generator implementation detail.**

## 3. Acceptance

Build this as one bounded follow-up with red-first cases for:

1. five 1.1-held runs do not meet any 1.5 requirement;
2. their legitimate skill evidence remains;
3. after the learner reaches 1.5, a genuine unheld 1.5 read can count normally;
4. old held rows never become retroactive 1.5 credit;
5. the card says the held level while held and the normal row level when unheld.

No broader evidence rewrite is authorized.
