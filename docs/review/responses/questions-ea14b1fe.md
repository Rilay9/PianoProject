# Reviewer response — questions at ea14b1fe

Scope: the new briefs, orchestrator-only decisions, and in-flight results summarized by the owner after the U92 handoff.

## U92

**Keep the wrap decision.**

The measured failure establishes that a one-line treatment cannot preserve the count under the supported font adversary. The count is learner-facing truth; row height is secondary. U100 owns density if the accumulated height becomes a product problem.

The two observations stay separate:
- `0 to practise`: U101 product/copy decision.
- `Stage N` splitting after “Stage”: U101 presentation cleanup.

Do not reintroduce truncation to solve either.

The landed implementation was not yet reachable when the U92 verdict was first written, so U92 closes when origin exposes the exact code and the mechanical read-back matches the handoff. No second policy review is needed.

## Q82

**The two deviations are accepted.**

### Whole-folder early exit

Removing the early exit is the better contract.

A source clone that is absent should produce a catalogue with explicit fetch placeholders for the rows whose identity is already known, not an empty fragment that turns one network failure into dozens of unrelated cross-reference errors. That makes the failure observable at its actual boundary and lets Q88 decide whether it may deploy.

Keep the Chopin group rows whose identities are derived from files as the stop line. Do not manufacture identities the source table does not own.

### Named-sections validator warning

Also accept the second validator change, narrowly:

A fetch placeholder with no file and therefore no counted bars cannot satisfy a named-section check, but that absence is caused by the same build-owned fetch gap. Warn with the item and fetch reason rather than emitting a content-truth error.

Pin the boundary:
- only a row positively recognized by the one fetch-placeholder mechanism gets this deferral;
- a bundled/measured row with a bad or missing named section still errors;
- a licence/import-only placeholder is not silently reclassified as fetch-unavailable;
- Q88 prevents a fetch-degraded public catalogue from replacing the healthy deployment.

This is epistemic deferral, not acceptance of missing sections.

## G1e

**Change the brief's boundary before treating G1e as complete.**

The proposed exception for “a rung's own ask” is too weak.

A learner's explicit `paused` or `retired` project state should suppress **automatic selection of that piece everywhere in session composition**, including when the piece is present on the current rung's authored option list.

The fact that a rung assigns a piece establishes a teaching relationship. It does not authorize the app to override a later explicit learner choice to pause or put away that piece.

So the one session-owned predicate should apply to:
- repertoire retention;
- repertoire demand-based choice;
- repertoire fallback;
- exposure-based song selection;
- rung-owned automatic piece choice and rung fallback when they would choose that same paused/retired piece.

It should **not** block:
- the learner manually opening the piece;
- the Library/project sheet;
- an explicit learner action to resume/bring back the project;
- historical evidence or encounter truth.

If a rung has other eligible options, choose among those. If every piece option on the rung is paused/retired, do not silently revive one. Surface the rung honestly and let the learner resume a project or choose another available route rather than defeating their pause.

Keep one predicate/ownership rule. Do not scatter slot-specific lifecycle exceptions.

The running-session ruling remains separate: once the session snapshot exists, a later pause is a live veto at the boundary of a not-yet-started automatic activity, recorded as skip/adaptation rather than a full recomposition.

## Q88

**Approve the brief as written and approve the workflow boundary.**

The proposed shape is the right product architecture:

- build/validation may finish with structured fetch-unavailable facts;
- the deploy guard consumes the structured catalogue fact through `validate.unfetched_placeholders`;
- it runs after the build and before Pages configuration/artifact upload;
- any build-owned fetch placeholder blocks publication;
- expected licence/import-only placeholders remain allowed;
- the previous successful deployment therefore stays live.

Do not grep warning text and do not add a second definition of “fetch placeholder.”

The empty-catalogue unit case may pass the deploy guard because emptiness is not this guard's responsibility; the existing build/validation gates must continue to reject an invalid catalogue before upload.

Q82 widening the structured placeholder mechanism to kern/MuseTrainer is exactly why Q88 should consume the shared function rather than hard-code Mutopia.

## Q83 + Q84

**Keep the brief and the current result.**

A dozen-ish routine warning lines in a build log are preferable to a falsely clean `validation OK` that hides material uncertainty. These warnings are actionable state, not debug chatter.

Keep:
- validator wording verbatim;
- warnings attached to the build step;
- the strict failure naming the actual placeholder id and fetch reason.

Do not turn warnings into failures here; Q88 owns the publication decision.

## L120a

**Keep the table-only seam. Do not dispatch L120b from aggregate counts alone.**

The head moving from 387 to 389 is acceptable if the report is still pinned line-for-line to the app's current gate at the same head. The invariant is parity with the current app reading, not preserving an old magic number.

The builder's 19 “mention but not teaching” judgments and 3 reading doubts may remain in L120a **as explicit classified observations with reasons**. They are not yet accepted as curriculum truth merely because they are recorded in the tool.

Before L120b consumes them:
- show the 19 lesson-mention judgments individually;
- show the 3 reading-doubt cases individually;
- preserve the underlying material/lesson evidence beside each;
- do not let the classifier turn a subjective text interpretation into an automatic claim edit or placement move.

The large sixteenth result is consequential: if sixteenths are taught nowhere while core rungs assign material requiring them from 3.5/4.4, L120b must resolve that at the curriculum truth. Do not exempt `rhythm.sixteenths` from coping just because ownership is currently absent.

The prior order still governs:
**material reading -> teaching ownership -> placement**.

## U96

**The unpushed brief is sound.**

- A drill ended before any answer was observed must say **Not measured**, not `Accuracy 0%`.
- `Answered 0 of N` may remain because it is an observation, not a quality judgment.
- Do not print `Not passed yet` where no attempt was measured.
- Reuse T40's established wording instead of inventing a second unknown-state vocabulary.
- In a session, one primary transition action is enough. The placement sheet's own `Start here` should become secondary or be suppressed while the session transition owns the primary `Start`; outside a session it remains primary.

Keep this narrow.

## G87

**The unpushed brief is also sound.**

- Style the performed-date control through the sheet's existing input language rather than introducing a one-off widget.
- On project stages, remove rung-language from the “Opens …” line. `Opens X.` is truthful; “the first thing on this rung” is not.
- Leave non-project stages byte-for-byte unchanged.
- Keeping history-view expansion separate is appropriate.

## Other orchestrator decisions

- **Q81 extra docs/08 file lines:** keep them. The governing brief said every missing reader line; finding four additional real readers is completion of the rule, not scope creep.
- **X31 no refit:** keep. But the “five corpus gaps” decision is superseded by the X31 review: the four late-tempo-after-sounding-note cases are **not accepted gaps** and must be fixed; only information music21 discards at the XML-reading boundary may remain named.
- **Pacing:** the revised push policy is acceptable. Do not hold unrelated work for an entire suite merely to keep a queued run alive. Preserve immutable seam heads and do not cancel a run whose result is required as that seam's acceptance evidence.

## Net effect

- U92: keep and mechanically verify when reachable.
- Q82 deviations: accepted with the narrow fetch-placeholder boundary.
- G1e: **change required before closure** — paused/retired applies to rung-owned automatic piece selection too.
- Q88: approved as the deploy architecture.
- Q83/Q84: keep.
- L120a: table accepted; subjective cases must return individually before L120b acts.
- U96/G87: briefs approved to proceed.
