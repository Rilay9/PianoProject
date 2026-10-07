# Review response — A7c.1 ready-for-reviewed handoff

**Verdict: APPROVE WITH ONE REQUIRED CHANGE**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

I read the immutable handoff first, then the complete A7c.1 record, the new generated-id manifest/checker rule, the landed latin.6/latin.7 independence lines, the accepted G13 boundary, and the current verified passage facts. Nothing heard.

## 1. The record/checker architecture is ready

The structural conditions I previously named are closed:

- all refs resolve;
- the four `bass_cell` ids resolve through the build-maintained `generated_ids.json`, rather than a version-bump accident;
- the checker still rejects a missing generated id;
- the strict 2/4 G13 control is in the chain;
- the later independence task is now on latin.6 and latin.7;
- evidence is honest: recognition/naming/hearing remain self-checked and never credited;
- the record separates generated CONTROL from authentic examples and the later independence task.

The generated-id manifest is an acceptable committed source of current built generated ids because the build owns it and validation makes a stale copy fail. I do not require the checker to import the generator.

## 2. Required change before `status: reviewed` — fix the two learner-facing latin.6 overclaims

I cannot mark the chain reviewed while a landed page contradicts or outruns the exact passage facts the chain now depends on.

### Por Una Cabeza

`latin.6.md` currently says:

- “The tango's left hand is a pattern, and it does not change.”
- “bar after bar is the same four events”
- “it never asks you for anything new and it never lets up.”

But the current verified demand fact certifies the habanera only for bars 1–14, and latin.4's own answer says bar 15 breaks it before the pattern later returns. Narrow the prose to the verified opening/recurrent pattern; do not say it never changes.

### The Crave

`latin.6.md` currently calls it “the tresillo under a whole piece” and says “In most of its fifty-three bars the left hand plays three, three, two.”

The accepted curated proof certifies **bars 21–26**. The rejected whole-piece density route does not authorize “most of the piece” as a teaching claim. Either independently establish the wider passage claim with the same current-identity/witness standard, or — preferred for this seam — narrow the prose to the verified bars 21–26 and treat the rest as unclaimed.

These are not cosmetic edits: they are directly about the ability being marked reviewed.

With those two learner-facing statements corrected and the checker still at 0 failures / 0 unresolved refs, A7c.1 may move **draft → reviewed** under the narrow fast path; I do not need another design round.

## 3. A7S / `shipped`

A7S may continue in parallel; this prose correction does not need to block its build.

I do **not** require A7S itself to become browser-driven. The unit acceptance is the right place to prove the evidence/no-credit semantics, while the existing placement browser coverage plus A7S's per-step deployed-app table cover reachability. For `shipped`, still require:

- the acceptance path named in the record and green;
- every self-checked Hear/Rhythm-only/Wait route to award no unsupported cell evidence;
- the two counted runs to meet latin.4 exactly as specified;
- the learner-facing twenty-step path confirmed on the owner phone build.

Only after those hold should the scoreboard move to **1 / 28**.
