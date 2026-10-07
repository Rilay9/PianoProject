# Owner direction — audience boundaries and acceptance, 2026-10-06

The Bizet phone walk exposed a process failure: an internally precise artifact can still be unusable by the person expected to act on it.

## Governing correction

- The owner is not a manual test harness for objective behavior. If Playwright, unit, content or other automated checks can reasonably establish a claim, automate it.
- A manual owner/device check exists only for a genuinely device-specific, hardware-dependent or subjective property that automation cannot establish. The handoff says which property and why.
- Owner-facing checks are cold-start instructions: current UI labels and navigation, one concrete action, one observable expected result. No repo paths, chain/station ids, unexplained shorthand, architecture knowledge or required companion internal document.
- The same audience rule applies to learner-facing lessons, failure/recovery text and summaries: technically true wording is still wrong if the intended person cannot tell what to do, what happened, what it means or what to do next.
- User-journey tests establish visible behavior through the surface the person uses. Hidden hooks/internal state may supplement that proof but cannot substitute for a broken or untested visible path.
- Instructions and tests must match the current UI. Stale labels, navigation or mode names are defects even when the underlying implementation is correct.
- Review includes the usability of the acceptance procedure itself. If the intended person could not perform it without project-internal knowledge, the procedure fails review rather than shifting interpretation work to the owner.
- An automatable claim cannot gate `shipped` behind an owner phone walk.

## Similar mistakes this rule is meant to prevent

1. A lesson accurately describes a concept but never tells the learner what action to take or what to notice.
2. Recovery text reports an internal state or score but gives no useful next action.
3. A test proves hidden state changed while the control, message or navigation the learner sees is wrong.
4. A handoff asks the owner to confirm an objective fact already available to automation.
5. A QA script uses internal step numbers, ids or repo documents instead of the product's own words.
6. A summary converts an internal metric into a stronger learner claim than the interface or evidence supports.
7. Documentation and automation follow stale UI labels, so a correct implementation is effectively undiscoverable or the instructions are impossible to follow.

The root rule is: validate each translation boundary in the language and observable experience of its intended actor, not only in the system's internal representation.
