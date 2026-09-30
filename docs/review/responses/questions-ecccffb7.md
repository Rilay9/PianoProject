# Reviewer response — briefs and decisions at ecccffb7

## G86a brief

**APPROVE FOR DISPATCH, with the Hear-it deadlock folded into this lane.**

The proposed refusal semantics are correct:
- after any bounded start attempt, the musical action proceeds only if `audioEngine.state === 'running'`;
- timeout, rejection, or a resolved start that still leaves the context suspended all refuse the run;
- the Play control returns to its ready state;
- one actionable state-line sentence explains that sound did not start and that another tap retries;
- a late successful resume may clear the sentence but must not surprise-start the run;
- no-Web-Audio behavior remains unchanged.

The state line is the right surface. Do not add a toast or a second transport element.

### Fold in Hear it

**Include the unbounded `toggleHear` start gate in G86a.**

The finding is the same mechanism and the same learner failure: a start attempt that never settles can leave the shared `startingSound` state wedged so Play cannot retry. Leaving that for U105 would ship a known deadlock in the very state machine G86a is repairing.

Apply the same bounded/checked start primitive to Hear it:
- if sound becomes running, Hear it proceeds;
- if the bound expires or start fails while sound is not running, Hear it does not begin and the same actionable sentence appears;
- shared waiting flags clear;
- the next real user tap retries;
- a late answer clears stale messaging but does not auto-start demonstration.

Do not broaden G86a to the six unrelated U105 run-start controls. Fold only the Hear-it path because it shares this exact waiting state and can disable Play.

G86a may dispatch.

## E50a brief

**REVISE BEFORE DISPATCH. Do not accept a one-time learner-history break caused only by metadata cleanup.**

Removing or canonicalising music21's volatile `<encoding-date>` is the right deterministic-conversion fix. The proposed red-first reproducibility proof is also right.

But the current brief's proposed consequence — allowing every build-converted file to change identity once, causing prior runs/projects/contact to appear unmet — is not an acceptable product cost for removing non-musical metadata.

The invariant should be:

> Changing only volatile conversion metadata must not change learner-facing material identity.

Before E50 proceeds, choose a compatibility path that preserves existing learner truth. Acceptable shapes include:

1. **Canonical material identity:** compute identity from canonical score bytes with volatile metadata such as `encoding-date` removed, while keeping raw file bytes available separately where needed; or
2. **Explicit old->new identity compatibility:** preserve the previous converted-file identity as an alias to the new deterministic bytes so existing encounters/projects/runs still resolve to the same material.

Do not silently rewrite/delete old learner rows, and do not declare the history loss a one-time migration cost.

If changing the global material-identity function would be too broad for E50a, make the compatibility layer a tiny prerequisite seam and then let E50a remove the date from converter output.

The seven intended tempo repairs may legitimately change identity if their **musical bytes** change. The unrelated converted corpus must not move merely because a date disappeared.

So:
- deterministic conversion: approved;
- broad one-time identity churn: rejected;
- E50a waits for a history-preserving identity plan before dispatch.

## U102 revised brief

**APPROVE FOR DISPATCH, with one correction to its own listed legacy test.**

The revised compatibility order matches the ruling:
1. explicit `answered` is authoritative;
2. an older direct attempt/answer field may be used if its historical writer proves the meaning;
3. a drill-kind-specific invariant may be used only when proven for every writer version that could have produced those rows;
4. otherwise legacy 0% remains ambiguous and is not reinterpreted.

The durable new-row contract is correct and should proceed.

### Correct the legacy note-flash example in item 7(k)

The brief currently says:

> legacy row: accuracy 0, wrongNotes 0, missed 10, mode note-flash, no answered -> not measured

That conclusion is allowed **only if the builder proves that `missed === total` for every historical note-flash writer can occur only when zero cards were answered**.

Do not predeclare that test as `not measured` in the brief. Make it conditional on the required historical proof. If the proof fails or is incomplete, the expected result is legacy measured/ambiguous 0%, not `Not measured`.

This is the same compatibility rule, not a new requirement.

### Rhythm miss repair

Including the rhythm missed-onset arithmetic is acceptable because it is at the exact same stored-row mapping boundary and has the discriminating adversary:
- `missed = total onsets - correct hits`;
- extra taps remain `wrongNotes`;
- extra taps cannot erase missed onsets.

Keep all other U104 coaching/Simon issues out.

After changing item 7(k) from a fixed expected result to a proof-dependent one, U102 may dispatch.

## Record restoration

Accepted.

Restoring the previously existing status/ruling text and changing record scripts from replacement to append is the correct repair. The important invariant is that processing a new result cannot erase an earlier reviewer ruling.

Keep the structural assertion and add/keep a regression that processing the same row preserves its prior status prefix.

## L120b merge interaction

The revised G1e transfer-offer fixture is acceptable because the eligibility change is intentional and the test's purpose is to pin lifecycle behavior, not incidental candidate ordering.

The isolated Plan-screen timeout passing alone can remain classified as load.
