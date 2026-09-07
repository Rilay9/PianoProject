# P12a — the generated backbone: one level table, nineteen families, a technique rung per stage

*Written 2026-09-06 during P19, from the merge `36b8b53` and its six commits. Every other phase
left a note and this one did not; its rulings were scattered across `02` Part E's amendments,
`01` §7 and the commit messages. Nothing here is new — it is the record that was missing
(review C7).*

## The problem P12a was given

P11's replan (§3.1) measured the generated library and found it bunched: **225 of 430 exercises
sat at level 4 and none above 5**, while the songs that came out of P10 were stacked at Stages
6–9. The owner is at the bottom of the ladder and the exercises stopped halfway up it.

## What was decided

### The level comes from the parameters, not from a literal

`default_plan()` handed every scale variant the literal `4.1` regardless of key, hands, octaves
or motion. `scale_level()` and `arpeggio_level()` replace the literals, and **no generator takes
a level any more** — `ScaleSpec.level` is a derived property — so no caller can pass a wrong
one. That is the whole reason the bulge existed: a number that can be typed will be typed
wrong, and 225 items proved it.

Reading `02` Part E as parameters rather than as prose turned up one judgement worth stating:
minors hands-together at one octave were all landing on 4.2, but Part E names only A, E and D
minor at Stage 4 and no others until Stage 5. The remote keys now follow the same
accidental-count split the two-octave rule uses — 36 of the items that had been left in the
bulge.

### Nineteen families, including five the upper ladder had nothing for

Scales in parallel thirds and sixths (diatonic, so the interval alternates major and minor — a
scale *in* thirds, not a scale doubled), octave scales, broken octaves, broken sevenths.

**Octave fingering is printed; double-note fingering is not.** The octave rule is safe and it
matters — thumb and fifth on white keys, thumb and fourth on black, both hands. The double-note
fingerings print the outer finger only and carry `fingeringVerified: false`, because a printed
fingering that is wrong teaches a habit, and a habit is harder to remove than a gap.

C and G by default for the double-note scales, all twelve behind `--full`, following Part E2's
argument that exercises nobody reaches are payload rather than breadth.

Distribution, generator only: **430 items became 691**.

```
before  L1 48  L2 70  L3 63  L4 225  L5 24   L6 0    L7 0   L8 0
after   L1 47  L2 52  L3 78  L4 167  L5 145  L6 121  L7 69  L8 12
```

### Four scorers, none of which folds into accuracy

Articulation, voicing, shaping and the half pedal shipped as families with nothing to judge
them. Each answers its own question and **none is folded into `SessionScore.accuracy`**, on
purpose: a staccato phrase played with every right note and no shortness is 100% accurate and
has missed the point of the exercise.

Articulation needed note-off, which the engine had been consuming and throwing away.
`RecordedNote` gained `releasedAtMs`, stamped on the most recent *unreleased* note of that pitch
— backwards, because the same key can be struck several times in a run and the one being let go
is the last one pressed. A note the source never released keeps no timestamp and is **not
judged**: the microphone cannot send note-off, and scoring silence as staccato would be
inventing a measurement.

### A technique rung per stage, and orphans become an error

`02` Part E is a technique syllabus and the curriculum had no track for it. Measured before the
change: **428 of 774 generated exercises were reachable from no lesson and no concept** — `scale`
and `arpeggio` among them, because no lesson had ever named those as concepts.

`technique.4` through `technique.8`, one per stage, each naming twelve exercises chosen
round-robin across families — *a rung offering twelve scales in adjacent keys is not offering a
choice*. The lists are representative rather than exhaustive on purpose; the concepts do the
reaching.

The prompt asked for rungs at 6–8. **Stages 4 and 5 got one too**: articulation, repeated notes,
shaping, syncopation and the odd meters all live there, and the alternative was covering them
with a concept taught three stages away, which would have filed Stage 8 material under a Stage 4
lesson.

**`technique` became a track rather than an `itemLabel`.** P11 had classified it as a label
because it had 434 items and no ladder, and said a Plan screen drawing an empty track would be
a lie. It has a ladder now, so the classification flips — which is the distinction those two
lists exist to draw, working rather than being worked around.

With every family reachable, `validate.py` **fails** on an orphan exercise instead of reporting
one (replan §7.5). Catalog: 790 items became 1,138.

### The Skills screen lists every exercise for a concept

`buildConcepts` kept a single drill per concept — whichever item was found first — so a skill
could only ever be practised at whatever level that item happened to sit at. It now collects
every playable exercise and drill that trains the concept and sorts them by level. Songs are
excluded: *a song is where a skill is used, not practice for it.* Three are shown and the rest
are behind a toggle, because `scale` has over two hundred exercises against it.

## A test bug worth remembering

The Skills e2e passed while asserting about two different rows. A Playwright locator filtered by
text is re-evaluated on every use, so once the button read "Show fewer" the filter stopped
matching and the locator moved silently to the next concept. The test now resolves the concept
to a stable selector before clicking anything.

## What P12a did not do

Sight-reading, harmony and ear families, and the rungs above Stage 5 for jazz, blues, chords-pop
and improv — all of that was P12b. The level *model* fitted on judged songs, which is a
different thing from this table, came in P14.
