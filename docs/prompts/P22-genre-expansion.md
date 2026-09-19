# P22 — The genre expansion, finished

Three parts, in the order the owner asked for them on 2026-09-18: **the outline**, then
**what is wrong with each step of it**, then **the brief** that an agent executes.

Written after a working period that got four song placements wrong before anything checked
them. That is not incidental to this document — Part 2 exists because the plan that
preceded it looked detailed and asserted facts nobody had read, and Part 3 exists so the
next pass cannot do the same thing.

---

# Part 1 — The outline

## Where this starts

| | |
|---|---|
| Rungs today | 87 across 15 tracks and 10 stages |
| Holes at or after a track's own start | 30 |
| Tracks that are a single rung | `latin`, `holiday`, `hymns-gospel`, `rock-metal`, `jam` |
| Core rungs now carrying genre material | 7 of 17 |
| Generated genre families at levels 1–3 | 5 families, 24 items |
| Catalog rows carrying read-from-the-score facts | 1975 of 2053 |
| Genre songs in the library below level 3.5 | **8**, of which 4 are blues and 0 are rock |

## The six steps

**S1 — Make `notation` load-bearing.** The catalog now records each score's key
signatures, time signatures, bars, staves, chord-symbol count and chord spellings. Nothing
reads it. Give a lesson an explicit `requires` block and have `validate.py` enforce it
against `notation`.

**S2 — Turn rung placement into a query.** A tool that takes a rung's band and `requires`
and lists every catalog row that satisfies them, so choosing repertoire starts from a
shortlist the machine built rather than from a memory of titles.

**S3 — Fill the 17 rungs that need no new music.** `rock.4`–`rock.7`, `jam.5`–`jam.6`,
`latin.3`, `latin.6`, the `hymns` split (2, 4, 5), the `holiday` split (3, 5, 7), and the
narrowing of the five list rungs that feed them.

**S4 — Wire the modes into the rungs.** Duet, rhythm-only, blind, the tempo ladder, Simon
and the five lab presets are built and no lesson links to any of them.

**S5 — One quarry run** for `jazz.3`/`jazz.4`, `ragtime.4`/`ragtime.9`, and the thin upper
hymns and latin rungs.

**S6 — One verification pass** over everything: render, open, read, one list, one batch of
fixes.

---

# Part 2 — What is wrong with each step

## S1 — Make `notation` load-bearing

**Consequence if done.** The four placements that got through in Entry 3 stop being
possible: a rung teaching left-hand chords cannot accept a row with `chordCount: 0`, a rung
teaching the waltz bass cannot accept a row whose `times` has no `3/4`, a rung teaching the
minor cannot accept a row with no minor key signature.

**Consequence if skipped.** `notation` rots. A field nothing reads is a field nobody
maintains, and the build pays two minutes to compute it.

**The flaw in the obvious version.** The first instinct is to read the lesson's *prose* —
if the paragraph says "waltz", check for 3/4. That is the version I would have written a
day ago and it is wrong twice over: it is natural-language matching, so it produces false
positives that get silenced by widening exemptions until the check means nothing (this
already happened once today, at eight false positives in `lessonClaims.test.ts`); and it
checks the wrong artefact, because the prose is the *symptom*. `blues.3` promised a minor
blues because the rung had no minor blues — the prose was the place the fault surfaced, not
the place it lived.

**The better approach.** The rung declares what it needs, in data:

```json
"requires": {
  "chordSymbols": true,
  "meter": ["3/4"],
  "mode": "minor",
  "staves": 2
}
```

Every key is optional and every one is checkable against `notation` with no string
matching. `validate.py` then enforces *at least one song option satisfies each requirement*
— not all of them, because a rung offers alternatives and only needs one that demonstrates
the thing.

**The second-order flaw.** `requires` can be written wrong, or left off the rungs that need
it most. Mitigation: it is required on any rung whose `concepts` include one of a named set
(`chord-symbols`, `waltz-bass`, `four-part-harmony`, `minor-triad`, `relative-minor`,
`swing`, `twelve-bar`), so the rungs most likely to make a claim cannot silently opt out.

**What it still cannot catch.** That a piece in 3/4 is a *waltz* rather than a minuet, or
that a 12-bar chord sequence is a *blues*. `notation` narrows the candidate set; it does not
make the judgement. Say so in the brief rather than pretending otherwise.

## S2 — Turn rung placement into a query

**Consequence if done.** Placement becomes reproducible and reviewable: the shortlist is
printed, the choice from it is recorded, and a reviewer can disagree with the choice
without re-deriving the candidates.

**Consequence if skipped.** Placement stays a memory test, which is the failure mode
already measured: four of eight wrong, and one of them a piece that was *already on another
rung* and appeared in this session's own not-on-a-rung list, which was not consulted at the
moment of choosing.

**The flaw.** A query returns rows that satisfy constraints, and constraint-satisfying is
not the same as good. Ranked by level distance alone it will happily put a 48-bar W. C.
Handy chart with diminished chords on a Stage 4 rung because the number fits.

**The better approach.** The tool prints, for each candidate, the facts a human needs to
reject it — bars, staves, distinct chords, key changes, `levelSource` — and refuses to
print more than a shortlist. It is a **narrowing** tool, not a choosing tool, and the brief
must say that the last step is reading the music.

**A cheaper alternative considered and rejected.** Hand-curating a wants list per rung, as
`build/genre-plan.md` did. It is the same act of asserting from memory that this whole
document exists to stop, and it was measurably wrong: that plan's Part A named a song for
most of its rows and four were false.

## S3 — Fill the 17 rungs

**Consequence if done.** Five single-rung tracks become ladders; `rock-metal`'s twelve
concepts stop living on one rung with three songs.

**The flaw, and it is the big one.** Seventeen rungs means seventeen lessons, and lesson
prose is where the last two content faults were: a rung that promised a minor blues it did
not have, and a paragraph that called two tangos bossas. Writing seventeen lessons from
intention will produce more of both.

**The better approach.** **The repertoire paragraph is written last, from the rung as
built, never from the plan.** Concretely: place the options, run the build, print the rung's
actual contents with their `notation`, and write the paragraph against that printout. A
sentence about a piece's key, metre or harmony must be traceable to a field in `notation`
or it does not go in.

**The second flaw.** Splitting `holiday` and `hymns` into ladders loses the "here is
everything, pick one" quality that `02` Part A item 5 names as deliberate for exactly those
two rungs. This is a decision the owner has not made. The plan proposes four holiday rungs
and four hymns rungs; the alternative is to keep both as lists and add to them. **Ask
before building.**

**The third flaw.** `planNoUnobtainableRungs.test.ts` asserts `rock` is exactly one rung —
a deletion the owner asked for on 2026-09-12. The rock expansion rewrites that assertion.
The rule it protects (no option whose licence starts with `copyright`) survives, and the
owner has since clarified that the decision was about *song-specific briefs with no music*,
which this expansion does not create. Rewrite the assertion; keep the docstring and amend it.

## S4 — Wire the modes into the rungs

**Consequence if done.** Duet, rhythm-only, blind, the ladder, Simon and the lab presets
become reachable from the lessons whose material they suit. This is the step that makes
early-stage genre teachable at all: a Stage 2 learner cannot read a stride bass and can
play half of one in duet mode.

**The flaw.** The existing mechanism is a prose paragraph — "Tools for this rung" — added
to sixty lessons in `b4fb15b`. Prose cannot be clicked. `chords-pop.3` currently tells the
learner to *"Pick D, take I–IV–V–I"* in the lab, which is now one preset chip, and the
lesson cannot link to it.

**The better approach, and a decision for the owner.** Give a lesson a `tools` array —
`[{"kind": "lab", "preset": "blues-shuffle"}, {"kind": "duet"}]` — rendered as real
controls on the lesson page. That is a feature, not a content pass, and it is the
difference between a learner reading about a mode and opening one. **It is the single
highest-value item in this document** and it is also the largest; it should be costed and
agreed before S3, because seventeen new lessons written against prose-only tools would all
need revisiting.

**The cheap interim.** Keep writing prose, name the preset by its chip label so the
instruction is at least accurate. Worse, but not wrong.

## S5 — The quarry run

**Consequence if skipped.** `jazz.3`, `jazz.4`, `ragtime.4` and `ragtime.9` cannot be
filled: the library has 1 jazz song and 1 ragtime song below level 3.5.

**The flaw.** It needs the owner's machine, the PDMX archive, and an idle port 4173, and a
previous rerun marked every row `render` because the preview server would not start — which
is what a skipped render looks like and must never be read as a pass.

**The better approach.** One run for every track at the end, not one per track. Run
`index.py` fresh first: the existing index predates two `shortlist` fixes. Assert every
committed row's cursor-step count equals its step count before believing the render gate.

## S6 — One verification pass

**Consequence if done wrong.** The owner has twice asked for batched verification and twice
watched a full content build run for a seven-line change. A build is two minutes and the
render check is longer; per-edit verification is the single largest waste in this project's
history.

**The better approach.** Verify once per coherent chunk — where a chunk is "the thing that
must land together", not "the thing I just typed". `attach_rung_tracks` and its test are one
chunk. Seventeen rungs are one chunk. A single option added to a single rung is not.

**What must be in the final pass and cannot be skipped.** Every newly generated family
rendered and **looked at**. Four of the five faults in the last generator pass were visible
in the first two bars of a picture and invisible to every mechanical guard — including a
left hand that climbed above middle C on an exercise whose subject is a hand that stays
still.

---

# Part 3 — The brief

> An agent executing this reads `docs/00-invariants.md` first and quotes the relevant rules
> into its own working notes. What follows is specific to this work and does not replace it.

## What you are doing

Finishing the genre expansion: the rungs in S3, the mode wiring in S4, and the quarry in
S5, on top of the `requires` mechanism in S1 and the candidate tool in S2.

## The rules that exist because they were broken

**1. Never choose a piece of music by its title, its id or its level number.** Every one of
those is asserted rather than measured. Query `notation` on the catalog row — `keys`,
`times`, `bars`, `staves`, `chordCount`, `chords`, `swungMark` — and if the fact you need
is not in there, read the MusicXML. A "12-bar blues" that is eleven bars, right hand only,
with no chord symbols, went onto the rung teaching left-hand chords because its *name* was
right.

**2. Before writing a sentence about a piece, read that piece's `notation`.** Every claim in
a lesson about a key, a metre, a harmony or a form must be traceable to a field. Two tangos
were called bossas in a paragraph whose previous sentence correctly identified two actual
bossas.

**3. The repertoire paragraph is written from the rung as built.** Place the options, build,
print what the rung actually holds, then write. Never from the plan, and never before the
build.

**4. A docstring is a claim and gets checked like one.** In one pass: a cell named
"minor-hook" that rendered in C major, a docstring promising four bars over music that was
two, and a comment describing tied eighths over a score of dotted quarters. Where the code
is right and the comment is wrong, fix the comment — `00-invariants` §4.

**5. Render every new generated family and open the picture.** Not the MusicXML, the PNG.
`confirm`, `confirm_fingering`, `confirm_playable` and `confirm_not_silent` all pass music
that is obviously wrong to look at.

**6. Every test ships proved red.** Make the change, write the test, revert *just* the
source change, confirm it fails, restore, say so in the report. A lock that is only a CSS
opacity passes a test that only checks the class.

**7. Verify once per chunk.** A chunk is what must land together. Do not run a content build
after adding one option to one rung.

**8. Re-level and rung placement land in the same commit.** `alternativesFor` matches within
0.5 of *the item being swapped*, so moving a family's level without naming it on a rung makes
it unreachable in the app while `validate.py` stays green — orphan-checking goes by concept,
not by level.

## Which of these rules the build enforces, and which it does not

**This table is the answer to "an agent will not have the context".** It does not need to.
A rule in the first column is carried by the repository: an agent that has never been told
it still cannot ship past it. A rule in the second column is carried by whoever is working,
which means it will eventually be broken — every one of them has been, at least once, this
week.

| Rule | Enforced by | Can an agent ignore it? |
|---|---|---|
| A rung's music must be what the rung says it is | `requires` + `notation_requirements` in `validate.py` | **No** — the build fails |
| A lesson may not promise music its rung has not got | `lessonClaims.test.ts` | **No** |
| A lesson may not say a false thing *about* a piece | `lessonClaimsAboutMusic.test.ts` | **No**, for the claims declared there |
| A song on a genre rung must be findable under that genre | `attach_rung_tracks` + `lessonClaims.test.ts` | **No** |
| A tool must open something the rung actually offers | `tool_errors` in `validate.py` | **No** |
| A lab preset must exist | `tool_errors` + `labPresets.test.ts` | **No** |
| The notation reader must not fail silently | the empty-field guard in `attach_notation` | **No** |
| Every rock rung offers a song that is in the build | `planNoUnobtainableRungs.test.ts` | **No** |
| A lesson's reading time must match its text | `lessonShape.test.ts` | **No** |
| **Never choose a piece by its title** | — | **Yes.** Partly covered by `requires`, but only where a rung declares one |
| **Never state an absence from one search** | — | **Yes.** Pure discipline. Broken three times this week |
| **Look at the whole artifact, not a crop** | — | **Yes.** The render preview *is* a crop, which is how a piece that modulates twice was placed on a rung about a figure that never changes |
| **Do not select on `genres` or `tags`** | — | **Yes.** They come from an uploader; a tango is filed as classical |
| Re-level and rung placement land together | — | **Yes** |

**So the useful instruction to an agent is not "be careful".** It is: *make the rule a check
before you rely on it*. Where a correction cannot be made mechanical, say so in
`docs/pending-review.md` rather than promising to remember it — the four rows above with
**Yes** in the last column are the ones a reviewer has to actually read the work for.

## The order

S1 and S2 first, because S3 depends on both. S4's `tools` decision is put to the owner
**before** S3 starts, because seventeen lessons written against prose-only tools would all
need rewriting. S5 last, in one run. S6 once, at the end.

## The four open questions, decided (2026-09-18)

The owner declined to arbitrate these — *"I don't want to get involved"* — so they are
decided here with the reasoning, and each is reversible in one place.

**1. Holiday and hymns: neither a shattered ladder nor an untouched list.** `02` Part A
item 5 names both as deliberate list rungs and the earlier plan proposed splitting them into
nine rungs between them, which would destroy the "here is everything, pick one" quality that
item names on purpose. But the measured distribution shows one real fault underneath the
question: **four of the hymns rung's nineteen songs sit at levels 1.4–2.85 on a Stage 3
rung**, which is a placement error rather than a structural preference, and eleven of
holiday's twenty-nine sit at 3.x on a Stage 2 rung.

So: **two new rungs, not nine.** `hymns.2` takes the four Stage 2 songs and the track starts
a stage earlier; `holiday.3` takes the eleven at 3.x. Both parent rungs stay lists and keep
everything else. This fixes the measurable fault and leaves the stated decision standing.
Reversible by deleting two units.

**2. `tools` becomes real controls, and it goes first.** The prose mechanism is already
broken in a way that is visible today: `chords-pop.3` tells the learner to *"Pick D, take
I–IV–V–I"* in the lab, which is now a single preset chip the lesson cannot link to. Part 2
established that building seventeen lessons against prose-only tools means rewriting all
seventeen afterwards. The cost is paid whenever it is paid; paying it before S3 is strictly
cheaper. **S4 moves ahead of S3.**

**3. `ragtime.9` is built.** Every other complete track runs to Stage 9 and ragtime stops at
8 while the archive holds five more Joplin rags plus Morton and Confrey at 7.7–8.5. The
inconsistency is not a decision anybody made; it is where the last pass ran out of time.

**4. The three date rulings ship, labelled.** *The Crave*, *El Cóndor Pasa* and *Hilarity
Rag* are quarried, pass every machine gate, and are uncommitted only because their
publication dates are unsettled. The owner has already made the governing decision twice —
`00` D23 (the personal build takes every row the dataset marks public domain) and, on
2026-09-17, that the public deploy should carry the personal items too. Holding three rows
back is not a third policy, it is the absence of one. They ship with
`compositionStatus: unknown` and their reason recorded, which is exactly what that field is
for, and one table edit reverses it.

## What "done" looks like

`npx tsc -b`, `npm run lint`, the content build, `validate.py`, `npx vitest run`, the
affected Playwright specs one at a time on port 4173, and `render_check.py` with every new
item rendered and every new family looked at. Report as `00-invariants` §5 asks: the
judgement first, then done / not done or blocked / follow-ups / questions / files touched.

## What to write down as you go

`docs/pending-review.md`, one entry per chunk, in the shape the existing entries use —
including the faults you introduce and catch, not only the ones you fix. The owner reads
that file to decide what to trust.
