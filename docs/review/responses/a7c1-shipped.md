# Review response — A7c.1 shipped gate

**Verdict: APPROVE**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

I read the immutable handoff first, then the narrowed latin.6 text, the current A7c.1 record, the A7S acceptance path, the per-step reachability table, the LB1 brief, the current Score loop implementation, and FABLE's shipped definition. Nothing heard.

## 1. Entries 260 and 261 are accepted

The two required latin.6 corrections are applied at the learner-facing source:

- Por Una Cabeza now claims only the verified opening bars 1–14, names bar 15 as the break, and leaves the later recurrence for the learner to find.
- The Crave now claims only verified bars 21–26 and explicitly leaves the rest unclaimed.

A7c.1 is therefore legitimately `reviewed`: the record is internally coherent, every ref resolves, the strict generated control and authentic MODEL are in place, and the later self-checked independence task is actually on latin.6/latin.7.

The A7S path is also the right acceptance boundary. `app/tests/unit/latin4Completion.test.ts` proves the two counted runs and, separately, that the self-checked Hear/Rhythm-only/Wait/later-rung actions do not manufacture cell competence or rung credit. I do not require another browser-driven evidence test.

## 2. LB1 is a real blocker to `shipped`

The A7S table establishes 21/24 record actions as reachable through current controls. Record steps 18, 20 and 23 require a loop of specific printed bars, and the current double-tap path cannot reliably select the tapped bar: `measureAt` has no per-measure DOM target and falls back to the window start. The lessons explicitly instruct the learner to double-tap the first and last bars.

Those are required chain actions, not optional polish. Under FABLE §1, A7c.1 cannot be `shipped` while they are not playable as written.

LB1's bounded contract is the right fix: resolve the actual tapped printed measure, keep the existing window fallback only outside a measure, prove The Crave 21–22, Bizet 7–9 and Por Una Cabeza 1–14, and retest the long-press path that shares the lookup. No lesson rewrite is preferable unless the existing gesture itself proves impossible.

## 3. Final gate

**Yes: after LB1, the only remaining substantive condition is the owner's phone-build walk. Nothing else needs a new seam.**

On the final LB1 head:

1. rerun the already-named A7S acceptance test and chain checker; this is verification of the final build, not another review lane;
2. deploy that head;
3. walk the lesson's 20 numbered steps on the owner's phone, using `docs/prompts/runs/A7S/steps.md` to ensure all **24 record actions** are covered, especially:
   - Bizet whole-piece bars 1–12 looped under the tune;
   - The Crave bars 21–22 looped in Rhythm only;
   - Por Una Cabeza bars 1–14 looped in Rhythm only;
   - the later latin.6/latin.7 unsupported-identification task;
4. if every action is playable and the acceptance path is green, set `status: shipped`, run the checker once in that state, and move the scoreboard to **1 / 28**.

No fresh musical judgement, new generator review, SR3 completion, or other unrelated cleanup is a condition of A7c.1 shipping. SR3 should continue as its own sight-reading truth fix.
