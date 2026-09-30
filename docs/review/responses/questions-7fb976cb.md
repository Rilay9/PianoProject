# Reviewer response — briefs and decisions at 7fb976cb

## L120b brief

**APPROVE.**

The brief follows the L120a ruling in the correct order: fix material-reading semantics first, then the coping gate, and only then let ownership/placement work consume a repinned table.

Specific rulings:

- **3/8:** the detector should stop treating 3/8 as compound merely because it is /8 and divisible by three. With no explicit beaming/grouping fact in the score model, the proposed simple-triple reading is the better current semantic contract. The brief is right to change the shared detector fact rather than make `compoundMetre`, syncopation and dotted-quarter readers disagree about what the beat is.
- **Evidence version:** bumping the evidence definitions version is correct because stored opportunity/location semantics change.
- **Key signature with zero affected sounding notes:** keep the notation fact, but do not ask it as a coping requirement. Keep this exception narrow to `key.signature`.
- **Sixteenths in 3/8:** remove the doubt. They remain sixteenths.
- **Fixed-position skip support:** the contextual support predicate is preferable to widening `copedWithBy`. It lets the gate acknowledge an already-taught note-name/fixed-position route without awarding or implying `interval-reading` evidence.
- **Range data:** writing the sounding hand span into the measurement is an appropriate input to that predicate. It is a measured material fact, not a new skill inference.
- **Fail closed:** callers that do not have the range/position support must keep refusing rather than infer support.

One caution for the builder: the 15/8/18/8 consequence of the shared compound rule should be reported explicitly if such metres exist in the corpus. Do not claim a musically grouped compound interpretation where the representation contains no grouping evidence; the current fallback is only a notation-level heuristic.

L120b may proceed.

## L120c

**NOT YET VERIFIED.**

No L120c task file is reachable on origin at this review point. Do not treat silence as approval. It can dispatch only after its actual brief is pushed/read and it preserves the L120a ownership rulings, especially:
- 4.4 as the honest core sixteenth owner with real instruction;
- ragtime.5 and technique.6 as explicit owners where their lesson text genuinely teaches it;
- no fake ownership on latin.7/holiday.7 merely because they contain sixteenths;
- re-run the L120 table after L120b before deciding placements.

## F3a brief

**APPROVE.**

This is the right shape for the lesson-truth cleanup: remove unsupported certainty, rankings, universals and invented causes while preserving useful instruction, and pin app-dependent prose to app/catalog facts.

The lane is correct to keep score-tempo repair out of a lesson-copy seam.

### Maple Leaf Rag / X40

Record X40 as a real score/import truth issue.

If the app plays the file at 120 because the MusicXML contains `<sound tempo="120">` while the printed metronome mark and catalogue expectation are 100, F3a should remove any prose that asserts the disputed pace and leave the file/import semantics to X40.

X40 should determine which fact is authoritative for playback/import and why. Do not “fix” the lesson to match 120 merely because the current tempo reader gives `sound` precedence, and do not alter the tempo reader globally merely to make this one file say 100.

The source/file inconsistency needs its own evidence.

## G86 + U69 brief

**APPROVE.**

The two mechanisms are appropriately paired because they share `ScoreScreen.ts` but remain independently testable:

- a sheet owned by the Score screen must be closed/disposed when the screen leaves, so the next screen is never inert beneath stale modal state;
- a user tapping Play/Resume is a real user activation and is the correct place to call the audio engine's start/resume path before resuming the session.

The proposed bound is acceptable only as a fail-open UI bound, not as evidence that audio resumed. Keep the report explicit about that.

The device-lock behavior remains genuinely **unverified on device** until H2 or a device pass observes it. Chromium's permissive AudioContext behavior is not proof of Android lock-screen behavior.

Direct edits to `docs/01`, `docs/04`, and `docs/08` are acceptable if they are the exact documentation rows this seam owns and the merged diff is inspected. The “Doc rows in the entry” convention exists to prevent conflicting doc edits, not to forbid direct updates when the lane owns those sections and no concurrent seam does.

## E51 brief

**APPROVE THE ARCHITECTURE.**

The stale-approval renewal model is correct: explicit new event, current parent bytes, current cut version, old event preserved, no automatic carry-over.

The post-build review in `responses/dffa9c34.md` adds two closure requirements:
1. the checks map must include the existing `excerpts.spec.ts` behavioral consumer for the merge path;
2. the committed format comment must describe `superseded` now, rather than waiting for a future renewal to rewrite the file.

Reject is a valid explicit re-decision for a stale approval. If downstream curriculum still references the now-unapproved excerpt, validation should expose that contradiction rather than silently keeping the old approval alive.

## U96a brief

**APPROVE, including the Simon/rhythm deviation.**

The governing semantic is not “always print `result.answered`.” It is: **if the UI says Answered N of M, N and M must count the same kind of thing and describe how much of the set the learner actually answered.**

Therefore:
- prompt/card drills: use the model's actual answered count, including skips where the drill models a skip as an answered wrong card;
- correctness stays in Accuracy;
- zero answered remains `Answered 0 of N` with no Accuracy;
- **RhythmDrill:** omit the Answered row because its numerator is taps while the denominator is written onsets and can exceed the denominator;
- **Simon:** omit the Answered row because its numerator is attempts/retries while the denominator is the chain/cap; the chain line already owns the useful fact.

Do not invent a new denominator merely to preserve the row.

Correcting the U103 placebo assertion rather than deleting it is also right because it guards a different screen state than U96's session-end assertion.

U102 remains separate and required: persisted zero-answer results must eventually preserve “not measured” truth downstream.

## Other decisions at this review point

- **Batching:** continue under the existing conditions. The three-seam F3a + U96a + G86 chain is acceptable because the map escalates the shared app paths to the whole browser suite and each seam still keeps its own immutable head/handoff.
- **Task-index repair:** accepted. Repairing malformed status cells and missing in-flight rows is record maintenance, provided assertions keep every row structurally valid and no historical decision text is discarded.
- **Pending/queued vocabulary:** matching both GitHub states is the correct operational fix. A superseding push is acceptable when it contains the previous tree plus new work and no required unique run result is lost.
