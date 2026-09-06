# Tips for every drill, coaching rules, and the how-to-practise module

2026-09-06, P17. Implements replan §6 and the three §8 rows marked P17.

## The problem

Nineteen drill kinds that taught by repetition alone. A drill that only says "wrong, again"
trains the thing it measures and nothing else; what was missing is the sentence a teacher would
say, which is almost always about *how* to practise rather than about the answer.

## Nineteen kinds, not twelve

The replan says twelve. `RUNTIME_DRILL_KINDS` says nineteen — P12b added seven — and the phase
prompt was explicit about reading the constant rather than copying it. `validate.py` parses the
array out of `fromCatalog.ts` for the same reason: a copy in the validator would have gone
stale in exactly the way the replan's number did.

## Variants, and the rule that catches a dead one

Seven variants, each because a parameter genuinely changes the advice: bass clef (a different
reading problem from treble), shuffle feel, rhythm dictation, building a scale from the
formula, symbol-flash chords, call-and-response dictation, and a left-hand-only backing track.

The quiet failure worth naming: a variant whose `when:` names a parameter no drill carries
never matches, produces no error, and looks like nothing at all. `validate.py` collects every
parameter key in the catalog and refuses a `when:` outside it.

## The front-matter parser had to be taught one thing

`when:` is a nested map, and neither reader handled one. The TypeScript parser treated a key
with an empty value as the start of a `- ` list; the Python side had no front-matter reader at
all and no PyYAML. Both now read one level of indented `key: value` pairs, and they were
extended together on purpose — a real YAML library on the Python side would have accepted
things the TypeScript side then silently misread, which is worse than a parser that refuses
both.

## Five rules, and one silence

`coach(kind, result, recent)` is pure and returns at most one sentence:

| Rule | Fires when | Threshold |
|---|---|---|
| slow-but-accurate | right, but slow | accuracy ≥ 0.9 **and** mean reaction ≥ 2500 ms |
| fast-and-wrong | quick, but guessing | accuracy ≤ 0.7 **and** mean reaction ≤ 1200 ms |
| pedal-timing | lifts consistently early or late | \|mean signed reaction\| ≥ 80 ms **and** every reaction the same sign |
| dynamics-short | contrast stuck under target | ratio < 0.9 × the drill's own target |
| plateau | three runs that have not moved | best − worst < 0.05 over 3 runs → links to `practice.5` |

Order matters and is deliberate. The pedal rule runs before the general ones, because for the
pedal the reaction *is* the measurement and slow-but-accurate would read a deliberate late
change as hesitation. The plateau runs last, because anything more specific is a better thing
to say than "this has not moved".

`null` is the common answer and the design: a screen that says something after every drill is a
screen the learner stops reading. It is the first thing the tests assert.

Every threshold is a named constant and every one is a guess that has never met this learner.
They are in one place so that changing them is a one-line change when he says which are wrong.

## The practice module is rungs, not essays

Five lessons on their own `practice` track, active from Stage 1. `optionsExempt` would have
been the easy way to ship five pieces of prose; each lesson instead carries three real options
from existing material, because the point of the module is that the method gets applied to
something. Reachable from Today's tools row and from the plateau coaching sentence.

## A bug this found

Adding a track whose lesson ids start with a letter exposed that `LESSON_ID_PATTERN` required a
leading digit. `#/lesson/classical.3`, `ragtime.6`, `jam`, `holiday` and every other track
lesson — **61 of the 92** — parsed as "no lesson" and fell back to Today. Nothing had noticed
because the Plan screen navigates through the router object rather than through a link, so the
hash was never parsed. Widened, with a regression test naming every real id shape.

## What could not be checked here

**Whether the advice is right for this learner.** Every sentence in the nineteen files is a
teaching opinion, and some of them are contestable — "answer at the first thing that comes to
you", "exaggerate the contrast", "stop counting once you know the theory". They were written to
be disagreed with specifically rather than vaguely.

The ask for the owner: read the nineteen files (they are about a minute each, and the drill
screen shows each one the first time you meet its kind) and mark any sentence you think is
wrong. A sentence that is wrong for you is worse than no sentence, because it is the one you
will follow.

## Numbers

19 kinds · 7 variants · longest file 228 words · 5 coaching rules with 8 named thresholds ·
5 practice lessons · 468 Python tests · 1263 unit · 220 e2e.
