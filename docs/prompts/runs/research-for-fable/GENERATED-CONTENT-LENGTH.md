# Generated-content length: direction for Fable

Research/product direction only. Do **not** turn this into a global generator rewrite.

## Decision

Some generated items are intentionally short and should stay short. Others are only technically present and are too short to provide useful practice.

Do **not** regenerate/redesign every generated family. Keep deterministic families that are already correct and useful. Change only families with a demonstrated problem: wrong notes/spelling/fingering, insufficient practice length/opportunities, poor musical shape, inaccurate named style, inadequate variation, or missing curriculum coverage.

When a family really changes, preserve PianoProject's existing generator identity/version semantics so old learner history is not silently attached to different music.

## Replace the generic duration floor with practice-purpose checks

A single minimum number of seconds is too crude. The useful question is whether the item contains enough **practice opportunities for its purpose**.

Classify existing/generated families roughly as:

- **Atomic drills** — a cadence, chord change, short interval/rhythm response, single technical shape. These can legitimately be very short and repeatable.
- **Pattern drills** — Alberti, broken-chord, walking-bass, oom-pah/waltz, boogie, repeated coordination figures. Require enough cycles and harmonic changes to establish the physical pattern.
- **Reading exercises** — require several bars / enough distinct events that the learner is reading rather than recalling a tiny cell.
- **Coordination/technique exercises** — require enough repetitions to establish movement without unnecessary fatigue.
- **Pedal exercises** — require multiple harmony/pedal changes, not one token change.
- **Style/Lab material** — normally needs a meaningful loop or complete form where appropriate (for example, a 12-bar blues should normally expose a full chorus rather than an isolated fragment).

The repo has already caught the failure mode: broken-seventh material was measured around 3.8 seconds even though its own rationale cited a five-second floor. Treat that as evidence that raw elapsed time is a weak proxy, not as a reason to make every item longer.

## First cheap pass

Before changing generators, produce a family inventory from existing output:

`family -> item count -> bars -> sounding duration -> target/practice opportunities -> keys -> meters -> variants -> known defects`

Use this to identify obvious thin families. Do not make Fable listen or manually inspect every item before the inventory tells us where the problem is.

Examples of the decision shape:

- cadence: one complete cadence may be enough -> likely keep;
- scale/arpeggio: full up/down prescribed span -> likely keep;
- walking-bass/accompaniment pattern: only one short I-IV-V-I cycle -> probably add a longer practice-set form;
- pedal drill: only a couple of changes -> likely too thin;
- sight-reading: too few distinct events/bars -> too easy to memorize -> lengthen/variation needed.

## Prefer two useful lengths over one bloated item

For families where both quick daily work and sustained practice are useful, consider two explicit products rather than stretching every item:

- **Quick drill:** roughly 10-20 seconds / a few focused repetitions.
- **Practice set:** roughly 30-90 seconds / several cycles or a meaningful form.

The exact seconds are guidance, not a new universal gate. Count the musical opportunities first.

## Regeneration rule

There are two different operations and they must not be confused:

1. **Re-run an unchanged deterministic generator** -> should reproduce the same content.
2. **Change what a generator means/writes** -> only do this for a demonstrated defect or useful breadth/length improvement, and version the changed family appropriately.

Do not globally rewrite/regenerate generated content just because Fable is touching the pipeline.

## Relationship to the rest of the packet

Keep the existing research direction:

- music21 remains the notation/theory backbone;
- exhaustive key/meter/variant enumeration checks finite families;
- Partitura/musicxml-io provide independent read-back where appropriate;
- OR-Tools is only for genuinely combinatorial hard constraints/retry explosions;
- source-backed cells/patterns are preferred where named musical style matters.

The goal is **more useful practice, not more bars for their own sake**.
