# Pending review

Everything changed in this working period, in one place, so it can be reviewed as a
batch rather than reconstructed from the diff. The owner asked for this on 2026-09-17:
he wants one file listing every code, document, curriculum and content change, to hand
to a reviewing session next week.

**This file is the index, not the record.** The reasoning behind a decision belongs in
`docs/decisions/` and the running narrative in `docs/handoff-2026-09-09.md`, exactly as
before. What this file adds is one place that says *what was touched and what to check*,
so a reviewer can start from a list rather than from `git log`.

**How to read it.** Newest section last. Each entry follows the report shape
`00-invariants.md` §5 asks for — the judgement first, then done / not done / follow-ups /
questions / files touched — because the judgement is the part worth disagreeing with.

**For the reviewer.** Entries marked **UNREVIEWED** have had no second pair of eyes.
Entries marked **NEEDS A MUSICAL EAR** are judgements about music that were made by
argument rather than by listening, and are the ones most likely to be wrong — the
generator shipped a clave that was not a clave and a "12/8 blues" that was a C major
scale, and both passed every mechanical check (`handoff` §5ar).

---

## Working period beginning 2026-09-17

Branch `claude/piano-teaching-app-bo19td`, from `2dd83cd` (the blues track, end to end).

### Standing context for the reviewer

Two corrections the owner made on 2026-09-17, both of which change briefs already
written:

1. **The named rock songs were never the ask.** The seven Avenged Sevenfold / Linkin
   Park / Sleep Token songs in `content/sources/pdmx-wants.json` and the technique
   briefs built around them came from an early conversation where the owner was naming
   *a style he liked*, not repertoire he wanted the curriculum built on. His words:
   *"I didn't mean when I said rock or gave those songs… I just meant that style of
   music. If those songs are in the archive, great, I'll choose them myself or add them
   myself. But you shouldn't cater lessons to them."* So: rock is taught as style and
   texture; archive rock songs are ordinary options judged on level like any other song;
   no song-specific lesson. `build/genre-plan.md`'s `rock.8` should be dropped and its
   rock section rewritten.
2. **Stop treating the archive's licence labels as a gate.** The personal build has been
   the default since 2026-09-12 (`00` D23) and `--strict-license` only affects a public
   deploy that `00` D25 removes. A previous session reported "personal build only" as if
   it were a blocker; it is a label, and the owner asked that it stop being raised.

His actual ask, in his words: *"as I'm building up all these other skills, I was hoping
to have other genres incorporated at different levels… the beginning levels, maybe some
of the easier elements of jazz, or easier elements of rock, easier elements of metal…
and that it's still taught, and I'm still exposed to a large variety of elements on
different stages and different lessons and different rungs."*

3. **The public build should carry the personal items too** (owner, 2026-09-17). This
   amends the practical effect of `00` D10a and D23. His reasoning: the deploy is public
   but unlisted and unindexed, nobody has the link, and he wants a handful of friends to
   be able to beta-test without a second build. *"I'm not distributing it widely or
   anything, it's just a personal thing that I'm doing, uh, and with a couple other
   people."* A reviewer should note what this means rather than re-argue it: the
   in-copyright transcriptions quarried under D23 would become reachable from a public
   URL. The owner has weighed that and decided. Not yet implemented.

4. **The shape of the genre work is a mix, and is not a choice between shapes** (owner,
   2026-09-17, twice, after two sessions of being given either/or plans). Options added
   to existing core rungs where the rung already teaches the skill a genre uses; **and**
   new rungs where a genre carries a concept nothing else covers; **and** the modes
   already built — the accompaniment lab, Simon, duet, free play — used as delivery
   routes that need no score and no grading. His words: *"You can be a mix of both… If
   some genre includes some concepts that weren't covered before, add them into the
   appropriate stages… There's multiple options. There's gray area."* And: *"be
   creative, we should be being creative in all the many modes we made so far, to
   broaden and make the experience more fun and engaging and diverse."*

   He also does not want Stage 0 taken literally — *"of course there's not going to be
   any content there, that's still like figuring out what notes are"*. The target is the
   **earliest honest** point for each element, not the earliest stage.

---

### Entry 1 — The early-stage genre survey (2026-09-17) · read-only

**UNREVIEWED.** **No files were changed.** This entry records a finding, so that the
work it argues for can be judged against it.

**The judgement.** `build/genre-plan.md` diagnoses the genre problem as structural — five
tracks are a single list rung, three are ladders with holes — and prescribes 31 new
rungs. That diagnosis is incomplete, and acting on it first would fail. The binding
constraint is not that the rungs are missing. It is that **there is no early genre
content to put on them**, and the reason is a levelling decision rather than an absence.

**What was measured.**

- Stages 0–2 hold 19 rungs: 14 core, 5 `practice`, and **one** genre rung (`holiday`,
  off by default, a 29-song list spanning levels 1.2–7.3). Jazz, ragtime and latin start
  at Stage 5; rock is one rung at Stage 3.
- Genre items in the catalog below level 3.5, all of them: 9 holiday carols, 12 gospel
  items which are the *same* plagal cadence in twelve keys, 4 blues, 1 jazz, 1 latin,
  1 ragtime, **0 rock**. At level 1.x there is one genre item in 2,034: Jingle Bells,
  right hand.
- Every genre *exercise* family begins at 4.x. Jazz: 65 exercises at 4.x and none below.
  Latin: 15 and none. Rock: 9 and none.
- **The levels are asserted, not measured.** `make_clave` in
  `tools/content/generate_exercises.py` reads `level = 4.4 if with_pulse else 4.2`. A
  clave is five strokes tapped on one note. The core path's own ladder puts quarters and
  rests at 1.1, mixed values 1.2, 3/4 at 1.4, eighths 2.2, dotted rhythms 2.4 and 6/8 at
  4.5. The same pattern holds for the other Phase 1 families: oom-pah 4.2, power chord
  4.1, ostinato 4.4, each a constant in its maker.
- This is what blocks an early rung mechanically: `validate.py` enforces `levelBand`
  containment, so a Stage 2 rung cannot offer a level-4.2 exercise.
- **86 genre items at level ≤ 4.5 are referenced by no lesson**, including every family
  the Phase 1 generator agent produced. They validate because they hang off concepts in
  `concepts.json`, but nothing offers them to a learner. Re-levelling them therefore
  breaks no rung's band — nothing points at them.

**Proposed order, not yet started.** (1) Re-level the Phase 1 genre families against the
core path's own ladder. (2) Generate the genre families that do not exist below level 4 —
swing eighths, a five-finger riff, a two-note power chord, a tapped clave, a simple
oom-pah, a blues-scale fragment. (3) Then the rungs, which become possible. The plan's 31
rungs mostly come after all three.

**Follow-ups noted, not acted on.**

- `song.rock.a7x-dear-god` (4.2), `song.rock.lp-final-masquerade` (4.3) and
  `song.rock.lp-shadow-of-the-day` (4.3) sit in the catalog as `import-only`
  placeholders. They are artifacts of the misunderstanding at the top of this section.
- `tools/midi-cleanup/midi_to_musicxml.py` has been untracked in the working tree since
  2026-09-13. Nobody has claimed it.
- `blues.7` carries three songs rather than the planned six; the archive's other boogies
  at that level are the same two works again (`docs/decisions/2026-09-17-genre-ladders.md`).

**Questions for the owner.** Whether any given re-level is right is a musical judgement;
the proposed numbers should be shown before they are written. Step 2 means new makers,
which is where the Phase 1 agent shipped music that was not what it claimed to be, so
every new family should be rendered and looked at rather than argued from its MusicXML.

**Files touched.** None. `docs/pending-review.md` created (this file).

**Corrected the same day.** Entry 1 was written around a claim that the early-genre
problem is primarily a *levelling* problem and must be fixed first. That over-states it.
The levels are still asserted rather than measured and the numbers above stand, but it
binds only for the specific items that need to sit on an early rung; it is not a gate in
front of the rest of the work, and treating it as one produced a plan with one step in
it where the owner had asked for a mix. See standing context item 4.

**Also corrected: a false gap reported to the owner.** This session twice told him the
app has no automatic tempo ladder, calling it a "verified gap" against `practice.2`. It
has one — `engine/PracticeEngine.ts` §"the tempo ladder on a loop", `docs/05` §6, with
`LADDER_CEILING_PCT`. The error was a grep for `tempoLadder|autoTempo` against a codebase
that spells it `LADDER_*`, reported as a verified absence rather than as a search that
found nothing. Nothing was built on the claim.

---

### Entry 2 — The genre progression, designed across every stage (2026-09-17) · design only

**UNREVIEWED.** One file added: `docs/decisions/2026-09-17-genre-progression.md`. No code,
no curriculum, no content changed.

**The judgement.** The owner asked for the whole ladder designed at once rather than
Stages 1–4 now and the rest later in a vacuum, and for the design to be hierarchical and
exhaustive rather than sampled. So: the full track × stage grid, all fifteen tracks and
ten stages, with a decision recorded for every hole.

The design departs from `build/genre-plan.md` in a way a reviewer should check hardest:
**it proposes 17 new rungs where that plan proposed 31.** The reduction is deliberate and
has three sources — four tracks are stopped where their archive material actually stops
rather than being filled to Stage 9; two thin stages are merged into neighbours rather
than padded to reach `MIN_OPTIONS`; and a new Part A absorbs the early-exposure work as
*options on existing core rungs*, which the earlier plan would have spent new rungs on.
If that reduction is wrong, it is wrong in the direction of too little content, which is
the opposite of what the owner asked for, and is the first thing to argue with.

**What was measured, not assumed.** 87 rungs across the ten stages; 30 holes at or after a
track's declared start; five tracks that are a single rung; `rock.overview` carrying twelve
concepts and three songs; the per-level distribution of the `holiday` (29), `hymns` (19)
and `classical.4.shelf` (50) song lists, which is what the split decisions rest on.

**NEEDS A MUSICAL EAR — the re-level table in §6.** Seven generated families are proposed
to move, some by two stages (`clave` 4.2 → 2.6, `power-chord` 4.1 → 2.4). Every number is
an argument from the core path's own rhythm ladder, not a measurement. They are safe to
change today only because every Phase 1 family is on no rung; that stops being true once
the rungs are built, which is why the design puts the re-level first.

**Also worth a reviewer's disagreement.** The claim that rock textures should be
*generated from chord progressions* rather than quarried as transcriptions — on the
grounds that progressions are not copyrightable and that the archive has zero rows for one
of the three bands named. This is the design's answer to the rock problem and it is a
judgement about both music and law.

**Follow-ups.** None new.

**Questions for the owner**, restated from §9 of the design: the re-level numbers; whether
trading fours is worth building this round; whether `hymns-gospel` should start at Stage 2
(three of its songs are Stage 2 music on a Stage 3 rung); and whether `holiday` at four
rungs rather than seven is the right call, given the alternative is padding two stages.

**Files touched.** `docs/decisions/2026-09-17-genre-progression.md` (new).

---

### Entry 3 — Part A, the song half: genre options on seven core rungs (2026-09-17)

**UNREVIEWED.** Curriculum data only. No code, no lessons, no new music.

**The judgement.** The design's Part A says a genre arrives as an extra option on a core
rung wherever that rung already teaches the skill the genre uses, rather than as a rung of
its own. This is that, for the seven pairs where the song is already in the catalog. The
learner now meets a blues at Stage 2 — on the rung that teaches C, F and G, because a
twelve-bar blues *is* those three chords — and ragtime and samba at Stage 3 on the rung
that teaches the dominant seventh.

**Checked before editing rather than after**, because the design asserted these fits and
two of them were wrong:

- Every pair's level against its rung's `levelBand`, which `validate.py` enforces. Ten of
  twelve fitted untouched; `2.2` needed its band widened 2.5 → 2.85 for *Swing Low* and is
  the only band that moved.
- `CORE_SONG_REACH` — two levels above the stage, core track only. All seven pass.
- `lessonShape.test.ts`'s count rule, which matches the literal phrase "N options". None
  of the seven lessons uses it, so no prose had to change. `4.5` says "One 6/8 piece and
  one syncopated piece", which is a mastery statement and not a count of options.

**Done.** `2.2` *Swing Low* (2.85, swung eighths) · `2.3` *12-Bar Blues* (2.43) · `2.4`
*Careless Love* (2.63) · `3.2` *Alexander's Ragtime Band* (3.36) and *So Danço Samba*
(3.03) · `3.3` *Limehouse Blues* (3.25) · `3.6` *Petit Papa Noël* (3.76, a waltz bass in
use, on a rung that had two songs) · `4.5` *Hesitating Blues* (3.64, the shuffle as
syncopation).

**And the generated half, re-levelled and placed in the same pass.** `exercise.ostinato.a.fifths`
on `2.1` (band widened 2–2.1 → 2–2.6) · `exercise.power-chord.a` on `2.3` ·
`exercise.ostinato.a.arpeggio` on `3.3` · `exercise.clave.rumba-3-2` and
`exercise.clave.son-3-2.pulse` on `4.5`.

**The re-level list is four families, not the design's seven.** Re-deriving each against
the core path before editing dropped three of them, and a reviewer should check the
reasoning rather than the numbers:

| family | was | now | why |
|---|--:|--:|---|
| `ostinato` fifths | 4.4 | 2.6 | a figure in eighths over a bass that does not move *is* core 2.1 plus core 2.2 |
| `ostinato` arpeggio | 4.6 | 3.4 | a broken minor triad across four notes is core 3.3's material |
| `power-chord` | 4.1 | 2.8 | nothing to read after bar one; the difficulty is the octave span and the stamina, not the notes |
| `clave` | 4.2 | 2.8 | five strokes on one note, one hand. Past the dotted rhythms at 2.4 it is harder than; nowhere near 6/8 at 4.5 |
| `clave` with pulse | 4.4 | 3.6 | two parts at once is a different skill and a genuinely later one |
| ~~`oompah`~~ | 4.2 | **unchanged** | 4.2 already sits inside core 3.6's band (3.6–5.1), the rung that teaches its family. Moving it would be churn |
| ~~`comping` / `walking-bass` intro~~ | 4.4 / 4.5 | **unchanged** | they serve Stage 4–5 rungs, which is where they are |

`exercise.clave.son-2-3` and `son-3-2` were already on the `latin` rung; at 2.8 they still
sit inside its 1.9–6.4 band, so nothing there broke.

**NEEDS A MUSICAL EAR.** Every number in that table is an argument from the core path's
own ladder — quarters 1.1, mixed values 1.2, 3/4 at 1.4, eighths 2.2, dotted 2.4, 6/8 at
4.5 — and none of it was heard. The reasoning is written into the generator beside each
constant so it can be argued with there.

**A correction to the design, found in the generator's own docstring.** §6 of
`2026-09-17-genre-progression.md` claimed re-levelling the Phase 1 families is free
because none is on a rung. That is true of `levelBand` containment and false of the app:
`alternativesFor` (`curriculum/selectors.ts`) offers an item only when it shares a concept
with the item being swapped **and** sits within 0.5 of *that item's* level. `make_power_chord`
is reachable today only because 4.1 is within half a level of `rock.overview`'s 3.6
exercises; re-levelled to 2.4 it becomes invisible in the app while `validate.py` stays
green, because orphan-checking goes by concept and not by level. **So a re-level and its
rung placement have to land in the same step.** The design's sequencing (re-level
everything first, rungs later) would have left every moved family unreachable in between.

**Verified.** `build.py --offline` → validation OK, 2034 catalog items. `ladder_report.py`
regenerated (the first build failed on the stale report, which is the check working).
`npx vitest run` → 159 files, 2163 tests, all passed.

**Follow-ups.** `lessonShape.test.ts`'s count rule asserts at least four lessons state a
count (`checked > 3`); six do today, and the design rewrites four of them. If those
rewrites drop the phrase, the test fails for a reason that has nothing to do with the
change.

**Files touched.** `content/curriculum/stage-2.json`, `stage-3.json`, `stage-4.json`,
`stage-5.json`, `content/lessons/jazz.5.md`, `content/lessons/chords-pop.4.md`,
`tools/content/generate_exercises.py` (three level constants and their reasoning),
`docs/generated/ladder.md` (regenerated).

**Verified after the correction.** `build.py --offline` → `validate.py` OK, 2034 items.
`npx vitest run` → 159 files, 2163 tests, all passed.

**CORRECTED THE SAME DAY — four of the eight song placements were wrong, and the check
that found them is the one that should have come first.** The songs above were chosen by
matching *id and title* against what a rung teaches. Nothing was read. Reading the actual
MusicXML — key signature, time signature, staff count, chord symbols, note types — found:

| placement | the claim | what the notation says | outcome |
|---|---|---|---|
| *12 Bar Blues* → `2.3` | "is I–IV–V, left-hand chords" | one staff, right hand only, **zero chord symbols**, **11 bars**, B♭ major | **removed** |
| *Limehouse Blues* → `3.3` | "minor / gypsy jazz" | **F major modulating to A♭ major**; no minor anywhere | **moved** to `jazz.5` |
| *Petit Papa Noël* → `3.6` | "a waltz bass in use" | **4/4** | **removed** |
| *Alexander's Ragtime Band* → `3.2` | "I–IV–V7" | C major with Am, Em, Dm and D7, and 41 sixteenths — past that rung | **moved** to `chords-pop.4` |
| *So Danço Samba* → `3.2` | "I–IV–V7" | **Dm7 G7 Cmaj6 Fmaj7** — ii–V–I with sevenths throughout | **removed; it was already on `latin`** |
| *Hesitating Blues* → `4.5` | "shuffle, 6/8, triplets" | 4/4, **zero triplets**, diminished chords | **moved** to `blues.4` |
| *Careless Love* → `2.4` | "dotted rhythms" | 7 dots, I–V7–IV in D | **kept** |
| *Swing Low* → `2.2` | "swung eighths" | 44 eighths, I–IV–V7, **and the file carries a swing marking** | **kept** |

Two further faults came out of the same pass, neither of which any test would have caught
until the build ran:

- **`jazz.5` promises "standards of the period, all public domain."** *So Danço Samba* is
  Jobim, `compositionStatus: unknown`, personal-build only. Putting it there would have
  made the lesson's own sentence false — the `blues.3` fault exactly, in a new place.
- **`exercise.power-chord.a` is in A minor** and was placed on `2.3`, which teaches C, F
  and G major triads. It moved to `3.3`, the A minor rung, where `exercise.ostinato.a.arpeggio`
  had already gone for the same reason.

**And a process note worth more than the fixes.** *So Danço Samba* was never a candidate:
it was already on the `latin` rung, and the not-on-a-rung list this session generated said
so. It was picked from a level table instead of from that list. The lists were right; they
were not consulted at the moment of choosing.

Three lessons' prose changed with the rungs, counts and all — `jazz.5` and `chords-pop.4`
go from "Six options" to "Seven" and each names its new piece, because both paragraphs
enumerate their repertoire. `readingTime` recomputed and still 3 for both (462 and 506
words against the 200 wpm rule).

---

### Entry 4 — Five generated genre families for levels 1–3 (2026-09-18)

**UNREVIEWED. NEEDS A MUSICAL EAR.** This is the entry to read hardest: it is new music,
and new music is where the last generator pass shipped a clave that struck both downbeats
and a "12/8 blues" that was a C major scale.

**The judgement, and it reverses this design's own Part A.** Reading the notation of all
226 songs at level ≤ 5.0 — key, meter, staves, chord symbols, note types — the verified
genre candidate count for the early core rungs is: `2.2` **0**, `2.3` **0**, `3.1` **0**,
`3.2` **0**, `3.3` **0**, `3.6` **1** (a Mozart minuet). The blues holdings are 1915–1925
lead sheets in E♭ and A♭, 35–56 bars, carrying diminished, augmented and m7♭5 chords.
**The library has no early-stage genre repertoire**, so the early genre content is
generated or it does not exist. The index is the measurement that should have preceded the
design; it is reproducible from the catalog and the score files.

**What was written.** Five families, 24 items, every one in a hand position the target
stage has already taught:

| family | level | on | the music |
|---|--:|---|---|
| `riff` (2 cells × A, C) | 1.3 / 1.6 | `1.1`, `1.5` | a repeated five-finger figure. **A minor and C major are the two five-finger positions with no black key**, so a Stage 1 hand never moves |
| `swing-pair` (C, G, F) | 2.2 | `2.2` | four bars straight then **the same four bars** swung. Notes identical in both halves, asserted; swing is a direction, not a rhythm, and writing it as dotted-eighth-sixteenth is the standard way to get it wrong |
| `modal-vamp` (A, E, D) | 3.0 | `3.3` | i–♭VII–♭VI–♭VII. In A that is **A m, G, F, G — every note white**. The same progression the accompaniment lab writes for a minor key (`04` §3c), deliberately, so two statements of one sound cannot disagree |
| `pentatonic` / `blues` (A, E, D) | 2.6 / 3.2 | `2.5`, `3.1` | the scale blues and rock solo on, one octave, thumb under. **A minor pentatonic is all white keys** |
| `tresillo` (C, F, G) | 3.6 | `3.6` | 3+3+2, the bass under most latin music, on the rung that already teaches Alberti and waltz basses |

**Five faults found before anything shipped, four of them by looking at the page.**

1. `exercise.riff.c.minor-hook` rendered in **C major** — the cell was named for a mode it
   only has in half its keys. Cells are named for what the shape does now (`falling`).
2. `make_swing_pair`'s docstring said four bars per half; it produced **two**. The phrase
   now plays twice a half, which is what the title claims.
3. **`make_modal_vamp`'s left hand climbed above middle C.** ♭VII spelled as *+10*
   semitones leaps up a seventh each change; it is *−2*. Every chord moved the hand, on an
   exercise whose whole subject is a hand that stays still.
4. Text expressions ran off both edges of the page and sat between the staves. Shortened.
5. **The blues scale in D spelled its flat fifth G♯.** The flat fifth of D is A♭; G♯ is a
   raised fourth, a different degree that sounds the same. Transposing by semitones lets
   music21 choose; transposing by the named interval `d5` does not. Checked across seven
   keys: the flat fifth now sits on the same letter as the natural fifth in every one.

The third is the one worth dwelling on — it passed `confirm`, `confirm_fingering`,
`confirm_playable` and `confirm_not_silent`, rendered without a warning, and is obviously
wrong in the first two bars of the picture.

**One docstring lost to the code, per `00-invariants` §4.** `make_tresillo` claimed it
wrote tied eighths to show the 3+3+2 grouping; the render shows dotted quarters, which is
how every published tresillo is written. The code was right and the comment was rewritten
rather than the music.

**Verified.** `build.py --offline` → `validate.py` OK, **2053 catalog items**.
`render_check.py` → **1975/1975 render, 0 failures**. `npx vitest run` → 159 files, 2163
tests. Exercises at the bottom three levels: **219 → 238**.

**Files touched.** `tools/content/generate_exercises.py` (five new makers, two tables, the
plan entries), `content/curriculum/stage-1.json`, `stage-2.json`, `stage-3.json`,
`docs/decisions/2026-09-17-genre-progression.md` (Part A rewritten against the index),
`docs/generated/ladder.md`.

---

---

### Entry 5 — Lab presets (2026-09-18)

**UNREVIEWED.** App code, one spec section, two e2e tests. No content, no curriculum.

**The judgement.** The owner asked for the accompaniment lab to have starting points
rather than six empty pickers — *"we're doing jazz here, this is some jazz backing,
without all the options to start from scratch"*. The question a preset has to answer is
not which settings it chooses (that is one assignment) but **which it takes away**. A
preset that fixed everything would be an exercise wearing the lab's chrome; one that fixed
nothing would be a bookmark. So each carries a `locks` list and fixes only what makes it
that style — progression and left-hand pattern — leaving key, tempo and bar count to the
learner, because transposing it and slowing it down is practising rather than wandering
off. The blues preset also locks the bar count: twelve does not divide into eight and a
twelve-bar blues of eight bars is not one.

**Five presets**, all on progressions the lab already had, so nothing was generated:
pop four-chord, ballad, blues shuffle, jazz ii–V–I, and a minor vamp. The last is
`I–V–vi–IV` in a minor key, which this screen already renders as `i–♭VII–♭VI–♭VII` — **the
same progression the generator writes as `exercise.modal-vamp.*` in Entry 4**. That is
deliberate: one sound should not be stated twice in two places that can drift.

**A route, not a setting.** `#/lab?preset=<id>`, the idiom the Score screen already uses
for `mode`, `loop`, `hands` and `tour`. A chip navigates rather than mutating in place, so
the preset is in the address, the back gesture leaves it, and a lesson linking to one
arrives at exactly the screen the chip produces. An unknown id is dropped rather than drawn
as an empty banner — the rule `?loop=` follows for a bar range a piece does not have.

**A locked control is `disabled`, visible and greyed.** Not hidden: the learner is meant to
*see* what the preset chose. Not dimmed only: that is a control which looks pressable and
is not, which `00-invariants` §1 calls a bug rather than a cosmetic.

**Proved red.** The lock test presses a locked chip and asserts the setting did not move.
Removing the `disabled` assignment and keeping the styling — rebuild, run — fails it;
restored, it passes. Both states were run, not reasoned about.

**Not done.** No rung links to a preset yet. The "Tools for this rung" paragraphs are prose
(commit `b4fb15b`) and several already tell the learner which pickers to set by hand —
`chords-pop.3` says *"Pick D, take I–IV–V–I"*. Those paragraphs are what should name a
preset instead, and that is a lesson-prose pass with `readingTime` recomputed, not a code
change.

**Verified.** `npx tsc -b` and `npm run lint` clean. `npx playwright test lab.spec.ts
--workers=4` → **11 passed**, including the two new ones. `npx vitest run` → 159 files,
2163 tests.

**Files touched.** `app/src/engine/sightReading.ts` (`LabPreset`, `LAB_PRESETS`,
`labPreset`), `app/src/router.ts` (`labPreset` route field, parse, serialise, equality,
`navigateLab(preset?)`), `app/src/ui/screens/LabScreen.ts`,
`app/src/ui/screens/LabScreen.css`, `app/tests/e2e/lab.spec.ts`, `docs/04-ui-spec.md` §3c,
and `.claude/launch.json` (new, a dev-server entry for the browser preview).

---

---

### Entry 6 — The Library's genre filters held no songs (2026-09-18)

**UNREVIEWED.** The largest correctness fault found so far, and it was nobody's recent
change — it has been true since the quarry first ran.

**The fault.** The Library filters by an item's `tracks`, and a quarried song's track came
from its **import bucket**: a tango quarried into the classical bucket was `classical` and
nothing else. Nothing carried the curriculum's own statement — *this song is on the latin
rung* — back to the row the Library reads. Measured across every genre rung:

| filter | songs on its rungs lacking its tag |
|---|---|
| **latin** | 6 of 6 — the filter held **no songs at all** |
| **rock-metal** | 3 of 3 — likewise **none** |
| **jam** | 5 of 5 |
| holiday | 24 of 29 |
| hymns-gospel | 18 of 19 |
| jazz | 11 across its rungs |
| blues-boogie | 8 across its rungs |

So a learner tapping *Latin* or *Rock & metal* in the Library saw generated exercises and
no music — while the latin lesson's own last line says "under Latin in the Library".

**The fix, and why it is not the guessing the importer refuses to do.**
`import_pdmx.py` carries a comment worth keeping: *"guessing tracks from a title is how
the library fills with mislabelled rows."* That is right, and `attach_rung_tracks` in
`build.py` does not do it — **nothing reads a title.** The curriculum has already stated
that a song serves a track by putting it on that track's rung; the merge step carries that
statement to the catalog row. One fact, asserted once, propagated rather than re-entered.

Three details that are decisions rather than mechanics:

- **Added, not replaced.** *Greensleeves (with chords)* is on the hymns rung and is still
  core, classical and chords-pop. Replacing would have traded one missing row for another.
- **`core`, `practice`, `technique` and `theory-ear` are skipped.** They are not genres and
  every item on the core path would have collected `core`, which filters nothing.
- **`jam` still shows no songs, correctly.** Its five "songs" are generated twelve-bar
  shuffles — exercises, not tunes. The module genuinely has no repertoire, which `02` Part D
  already says.

**87 rows gained a track.** Latin went 0 songs → 9, rock-metal 0 → 3.

**And one piece of prose that was wrong about music.** `latin.md` read: *"Its second part,
El Choclo, Malagueña and the other bossas are under Latin in the Library."* **None of the
three is a bossa** — La Cumparsita's second part and *El Choclo* are tangos (the catalog
title is literally "El Choclo (tango)") and Lecuona's *Malagueña* is neither. The same
paragraph correctly calls *Insensatez* and *Só Danço Samba* bossas two sentences earlier,
then sweeps three non-bossas under the word. Rewritten to name each for what it is.

Those two were also still unreachable under the Latin filter after the derivation, because
they are named in prose and are on no rung — so `tracks` was added to their rows in
`content/sources/pdmx.json`, which is where a human states a fact about a quarried row.
*Carioquinha*, a choro nobody had mentioned, went with them.

**How the fault was found.** A sweep over all 87 lessons extracting every italicised piece
name and checking it against its own rung. Most hits were noise — single emphasised words
substring-matching titles — and every genuine "named but not on the rung" case turned out
to be **correct**, because those sentences say "under X in the Library", which is the
pattern `02` Part A item 5 prescribes. The sweep found no `blues.3`-class fault. It found
this instead: the sentences were right and the filter they point at was empty.

**Verified.** `build.py --offline` → `validate.py` OK, 2053 items. `npx vitest run` → 159
files, 2163 tests. `latin.md` still 3 minutes at 483 words.

**Follow-ups.** The sweep script is worth keeping as a test — "no lesson names a piece its
rung does not offer, unless the sentence says Library" — but it needs the noise filter
tightened before it could run in CI without false positives.

**Files touched.** `tools/content/build.py` (`attach_rung_tracks`),
`content/sources/pdmx.json` (3 rows), `content/lessons/latin.md`,
`docs/generated/ladder.md`.

---

---

### Entry 7 — The catalog now carries what the score says (2026-09-18)

**UNREVIEWED.** The last change of this working period, and the only one aimed at a cause
rather than an instance.

**The cause.** Every fault in Entries 3–6 has the same root: **the catalog describes music
by fields nobody derived from the music.** `level` is a constant in a maker or a regression
over features; `tracks` came from the import bucket; `genre` from the id's prefix. So the
only thing available when choosing a song for a rung, or writing a sentence about one, was
its *name* — and choosing by name is exactly how a right-hand-only melody of eleven bars
with no chord symbols came to sit on the rung that teaches left-hand chords, and how two
tangos came to be called bossas.

Worse, the facts were already being computed and discarded. `content/sources/pdmx.json`
carries nineteen measured `features` per quarried row and a `levelDrivers` list naming
which of them set the level. **None of it reached `catalog.json`.** And the three questions
actually asked when placing a piece — *is it minor, is it a waltz, has it got chords* — were
computed nowhere, because `features` measures difficulty rather than identity.

**The change.** `attach_notation` in `build.py` reads every score file once and puts what
it says on the row: bars, staves, every key signature, every time signature, the count and
the distinct spellings of the chord symbols, and whether a direction says swing. Declared
in `catalog.schema.json` rather than smuggled past it. Cached on (size, mtime) in
`build/notation-cache.json`, so only changed scores are re-read.

**1975 of 2053 rows now carry it.** The remainder are drills and import placeholders with
no file.

One detail that is a decision: **bars are counted inside a single part.** Counting
`<measure>` across the document multiplies by the number of parts, which silently doubles
the length of every grand-staff score written as two parts — the scratch script that found
the four bad placements had that bug and reported 33 bars for a 33-bar piece only because
it happened to be one part.

**What this makes possible, and has not yet been done.** Nothing reads `notation` yet. The
placement work in Entries 3–6 was done with a throwaway script; with this in the catalog,
the same questions are a filter over `catalog.json`:

- `validate.py` could refuse a rung that teaches chord symbols and offers a piece with
  `chordCount: 0`.
- A lesson saying "waltz" could be checked against `times`.
- `alternativesFor` could prefer a swap in the same key and metre.
- The level regression could be re-fitted against identity as well as difficulty.

**Verified.** `build.py --offline` → `validate.py` OK, 2053 items. `npx vitest run` → 160
files, 2165 tests.

**Files touched.** `tools/content/build.py`, `content/catalog.schema.json`.

---

### Entry 8 — S1: the rung says what its music must be, and it is checked (2026-09-18)

**UNREVIEWED.** First step of `docs/prompts/P22-genre-expansion.md`, which also records the
four questions the owner declined to arbitrate and how they were decided.

**The judgement.** Entry 7 put what the score says on the catalog row and nothing read it.
A field nothing reads is a field nobody maintains, so S1 makes it load-bearing. A lesson
gains a **`requires`** block — `chordSymbols`, `meter`, `mode`, `staves` — and `validate.py`
checks it against `notation`, which was read from the MusicXML and never from a title.

**The check is on the rung, not on the prose, and that is the whole point.** The obvious
version reads the lesson text: if the paragraph says "waltz", look for 3/4. That is natural-
language matching, it produces false positives that get silenced by widening exemptions
until the check means nothing — which happened today, at eight — and it checks the symptom.
`blues.3` promised a minor blues because the *rung* had no minor blues.

**At least one option, not all.** A rung offers alternatives and needs one that demonstrates
the thing; requiring every option to be minor would empty every rung that teaches the minor.

**A rung that claims cannot opt out.** Any lesson whose `concepts` include one of
`CLAIMING_CONCEPTS` — `chord-symbols`, `four-part-harmony`, `waltz-bass`, `relative-minor`,
`minor-triad` — and which has no `requires` is itself an error. That found seven rungs
making unchecked claims on the first run; all seven now declare and satisfy one.

**A bug that would have made the whole thing worthless.** The first build reported "1975
read from the score" and every row came back with `times: []`, `keys: []`, `chordCount: 0`
and `staves: 1`. **`ElementTree.iter()` does not support the `{*}` namespace wildcard** —
only `find`/`findall` parse it as a path — so `iter("{*}time")` looked for a tag literally
named `{*}time`. `bars` was computed with `findall` and came out right, which made the
output look plausible. Had this shipped, `requires` would have been unsatisfiable
everywhere, or — worse — the checks would have been quietly loosened until they passed.
Fixed by using `findall(".//{*}…")` throughout, and the notation cache was deleted so every
row was re-read rather than trusting the poisoned entries.

**A justification of mine that was wrong, caught by its own red-proof.** *When Johnny Comes
Marching Home* (6/8, 17 bars, 8 chord symbols, pd, 2.42) was added to core `4.5` on the
stated grounds that the rung had nothing in compound time and a clave had been put there
for want of anything better. Removing it to prove the check red did not turn it red —
because `4.5` **already had four things in 6/8**, including *Row, Row, Row Your Boat* and
*Greensleeves in 6/8*. The earlier "no candidates" query had filtered to songs that were
both genre-tagged and on no rung, and these were neither. The addition stands as an extra
option at the right level; the reason given for it was false.

**Proved red properly.** `2.3` given `meter: ["7/8"]` and `mode: "minor"` — both fire with
the rung named; restored, validation passes; `chordSymbols`, which that rung does satisfy,
correctly stays silent throughout.

**What this changes about S2**, on returning to the root: the candidate tool must **not**
filter by genre tag or by "not currently on a rung". Both filters produced the misleading
zeroes above. The honest query is *what satisfies this rung's `requires` inside its band*,
over the whole catalog.

**Verified.** `build.py --offline` → `validate.py` OK, 2053 items. `npx vitest run` → 160
files, 2165 tests.

**Files touched.** `content/curriculum.schema.json` (the `requires` block),
`tools/content/validate.py` (`CLAIMING_CONCEPTS`, `notation_requirements`),
`tools/content/build.py` (the wildcard fix), `content/curriculum/stage-2.json`,
`stage-3.json`, `stage-4.json`, `stage-5.json`, `docs/generated/ladder.md`,
`docs/prompts/P22-genre-expansion.md`.

---

### Entry 9 — S2 and S4: the candidate tool, and a rung's tools as controls (2026-09-18)

**UNREVIEWED.** Two steps of `docs/prompts/P22-genre-expansion.md`, done in that order.
S4 was moved ahead of S3 by the critique in P22 Part 2: seventeen lessons written against
prose-only tools would all need rewriting afterwards, so the cost is paid now.

#### S2 — `tools/content/candidates.py`

Placing repertoire had been done from memory twice and was wrong both times. This prints
the shortlist that should have come first: `--rung 3.6` reads that rung's own `levelBand`
and `requires` out of the built curriculum and lists every catalog row that satisfies them,
each with the facts needed to **reject** it — bars, staves, keys, metres, distinct chord
symbols, whether the level was judged or estimated, and which rungs already carry it.

**It narrows; it does not choose**, and the file says so. A piece in 3/4 is not necessarily
a waltz.

**Two filters it deliberately does not apply**, both of which produced false zeroes during
S1 and cost real work: **genre tag**, because `tracks` and `genre` came from the import
bucket and the id's prefix rather than from the music — that filter is what produced "the
library has no early-stage genre repertoire" and sent a session writing generators; and
**"not already on a rung"**, because a piece may belong on two and the one it sits on may
be the wrong one — that filter is what said core `4.5` had nothing in compound time when it
already held four things in 6/8.

Run against `3.6` it returns 33 candidates, 13 on no rung, and shows the requirement is
honestly satisfied by *Greensleeves (waltz bass)* — genuinely 3/4, two staves, 15 chord
symbols.

#### S4 — `tools` on a lesson

A lesson may now carry `tools`, drawn as a block of controls headed *Ways to play this*,
above the options because a mode is a way of playing what is on the rung.

**Only modes that have an address**: `lab` (with a preset), `duet`, `blind`, `simon`,
`play`. **Rhythm-only and the tempo ladder were in the first draft of the type and were
taken out** — rhythm-only is a remembered setting the Library writes before navigating, and
the ladder is run state scoped to a loop (`05` §6). Neither is reachable by a route, so
either button would have looked pressable and opened the wrong thing, which
`00-invariants` §1 calls a bug rather than a cosmetic. Both keep their prose paragraph.

**Twelve rungs wired**, each to a mode its material actually suits: the four lab presets to
the chord, blues, jazz and rock rungs whose harmony they are; duet to `3.6`, `blues.4`,
`ragtime.5` and `rock.overview`, where taking one hand away is how a two-handed texture is
learned; blind to `4.7`, which is the rung about memorising; Simon to the two theory rungs
the curriculum already places it on; free play to `2.3` and `chords-pop.3`, where naming
the chord under your hands is the lesson.

**Two ways of pointing at nothing are refused** by `tool_errors` in `validate.py`: a preset
the lab does not have, and an `item` not among the rung's own song options — a lesson
sending the learner to a piece it does not offer is the `blues.3` fault wearing a control.
Proved red on both at once: `blues.4` given a bogus preset and an off-rung item produced
exactly two errors naming both.

**And the e2e asserts the destination, not the button.** A test that a button exists proves
nothing; a control that goes to the wrong screen is worse than the paragraph it replaced.
So the lab tool must arrive with `data-preset` set *and* the locked pickers disabled, and
the duet tool must open a piece the rung actually lists. **Proved red** by making the duet
return a fixed off-rung piece — the failure names it: *"the duet opened something the rung
does not offer: #/score/song.folk.hot-cross-buns?mode=tempo&hands=R"*.

**One duplication introduced on purpose.** `validate.py` holds a copy of the preset ids
that live in `engine/sightReading.ts`. Reading them out of the TypeScript with a regex was
the alternative and it is worse — a regex over a source file breaks on formatting and fails
*silently* when it matches nothing, which would have reported "the lists agree" for an empty
match. `labPresets.test.ts` fails loudly instead, and also checks every preset's pickers are
values the lab can resolve and that none of them locks nothing (a preset that locks nothing
is a bookmark).

**Verified.** `npx tsc -b` and `npm run lint` clean. `build.py --offline` → `validate.py`
OK, 2053 items. `npx vitest run` → **161 files, 2167 tests**. `npx playwright test
lesson-tools.spec.ts lab.spec.ts lesson-flow.spec.ts --workers=4` → **15 passed**.

**Follow-ups.** The twelve rungs' prose still tells the learner to set the lab's pickers by
hand; those paragraphs should name the preset instead. That is a lesson-prose pass and
belongs with S3, where the repertoire paragraphs are being rewritten anyway.

**Files touched.** `tools/content/candidates.py` (new), `tools/content/validate.py`
(`LAB_PRESET_IDS`, `tool_errors`), `content/curriculum.schema.json`,
`app/src/curriculum/types.ts`, `app/src/ui/screens/LessonScreen.ts`,
`app/tests/unit/labPresets.test.ts` (new), `app/tests/e2e/lesson-tools.spec.ts` (new),
`docs/04-ui-spec.md` §3d, and `content/curriculum/stage-{2,3,4,5}.json`.

---

### Entry 10 — `finalBass`, and a third false absence caught before it cost anything (2026-09-18)

**UNREVIEWED.** A small addition to `notation` and to the candidate tool, made in the
middle of S3 because S3 could not proceed without it.

**What happened.** Choosing repertoire for the rock ladder needs minor-key pieces.
`candidates.py --mode minor` between levels 2.4 and 5.2 returned **five**, four of them
variants of *Greensleeves*, and the obvious conclusion was that the rock rungs would have
to be exercises with no repertoire at all.

**That conclusion was not drawn**, because `00-invariants` §1a now requires a second search
shaped differently before an absence means anything. The second search asked how often the
`<mode>` tag is present at all: **705 of 792 songs record only `fifths`.** The query was
blind to 89% of the library. Asking the question a different way — a key signature plus
what the music ends on — returns **179 minor-key songs, 31 of them in that band**,
including *Tuyo* (the Narcos theme), *St. James Infirmary*, *Dark Eyes* and *Insensatez*.

This is the third false absence of the working period and **the first one caught before
work was built on it.** The first two cost a generator pass and a wrong placement.

**The fix is factual, not heuristic.** `notation.finalBass` records the pitch class of the
lowest note in the final measure — a fact about the file. Whether that makes a piece minor
is a *judgement*, so it lives in `candidates.py --minorish` and not in `requires`, where
`mode` stays strict and believes only an explicit tag. The judgement is wrong for a piece
that does not end on its tonic; that is rare in this library and the shortlist is read
before anything is placed. Populated on 1952 of 1975 rows.

**Files touched.** `tools/content/build.py`, `content/catalog.schema.json`,
`tools/content/candidates.py`.

---

### Entry 11 — S3 begins: two rock rungs, and the test the owner told us to expect (2026-09-18)

**UNREVIEWED. NEEDS A MUSICAL EAR** on both lessons' claims about their pieces.

**`rock.4` — "The power chord, and the figure that repeats"** (Stage 4, band 2.6–4.2,
song-optional). Exercises: the power chord, both ostinato shapes and the minor vamp, all in
A minor, all white keys. Songs: *Greensleeves (with chords)*, which prints its chord symbols
so power chords can go under the tune, and *Bella Ciao*, which was **looked at** — its left
hand is a repeating root-and-chord figure in E minor, which is the thing the rung is named
for. Requires `mode: minor`, satisfied by the explicit tag on Greensleeves. Tools: the minor-vamp
preset and duet.

**`rock.6` — "Arpeggio over a pedal bass"** (Stage 6, band 3.4–7.4). Songs: Satie's
*Gnossienne No. 1*, Chopin's *Prelude No. 20* and *Moonlight* I — **the three
`rock.overview` already names in its own prose** as the vehicles for this texture, all
bundled, all with files. Exercises: the arpeggio ostinato, the broken-chord accompaniment,
and both pedal families, because this is the one rung where the pedal is a colour rather
than a joiner.

**The band on `rock.6` is 3.4–7.4 and that is deliberate**, not an accident to be tidied.
The exercises are far easier than the pieces because the figure is simple to describe and
the pieces are where it has to hold for pages. The lesson says so in a paragraph rather
than letting the learner discover it.

**`planNoUnobtainableRungs.test.ts` broke, exactly as P22 Part 2 predicted**, and was
amended rather than worked around. It asserted `rock` is *exactly* `['rock.overview']` —
the shape of the owner's 2026-09-12 deletion. That deletion was of seven **song-specific
briefs** each of which could only be started by buying a MusicXML export first; the owner
clarified on 2026-09-17 that the named songs were a style he liked rather than repertoire
he wanted lessons built around. So the count went and **the rule stayed**, restated without
a number: every rock rung offers at least one song, and every song it offers has a file in
this build. The docstring was amended rather than replaced, because it is the record of why
the rule exists.

**Proved red**: `rock.4` given `song.rock.a7x-dear-god` — an import-only placeholder with no
file — fails with *"rock.4 offers song.rock.a7x-dear-god, which has no file"*. That is the
same fault class the original assertion protected, caught without counting rungs.

**Verified.** `build.py --offline` → `validate.py` OK, 2053 items, 89 lessons. `npx vitest
run` → 161 files, 2167 tests. Both lessons checked against the shape rules before building:
499 and 548 words, reading times 3 and 3, no track slug in the prose, and `rock.4` says "Two
options" against exactly two songs.

**`rock.5` — "The chord with the third taken out"** (Stage 5, band 5.3–6.8, song-optional).
Twelve open-voicing exercises exist at 5.3; the repertoire was the hard part. Asking the
catalog which songs actually *print* a suspended or added chord returns **seven**, of which
two are two-stave pieces worth playing: *Annie's Song*, where a sus4 is the hinge of an
otherwise plain progression, and Sakamoto's *andata*, which is the whole texture at once.
Neither is a rock song and the lesson says so — the rung teaches a sound and these are the
two pieces in the library that contain it.

**`rock.7` — "Building it: register, density, and knowing when"** (Stage 7, band 5.2–8.4).
Grieg's *Mountain King*, the *Rachmaninoff* concerto opening and *Moonlight* III, which are
three different kinds of build: register, density, and one written into the notes rather
than marked over them. Tool: blind, and for a reason that is not about memory — with the
page gone you shape what you hear.

**The rock ladder is now complete**: `rock.overview` (3) → `rock.4` → `rock.5` → `rock.6` →
`rock.7`, where it was one rung carrying twelve concepts and three songs.

**And a sentence that had become false.** `rock.overview` said its named vehicles "are there
to be looked at and listened to now and played in a year or two". Three of them are on
`rock.6` as of today. Rewritten — and the rewrite pushed the lesson to **622 words, past the
600-word limit**, which was caught by checking rather than by the suite, and trimmed to 589.

**Every id verified to resolve before the lessons were written**: all five songs on
`rock.5` and `rock.7` exist, carry files, and are at the levels claimed.

**Not done.** `rock.overview` still carries all twelve concepts. Leaving them is defensible
— it *is* an overview of all twelve, and what made it wrong was being the only rung, which
it no longer is — but a reviewer may reasonably want them handed to the rungs that teach
them. The rest of S3 — `jam.5`/`jam.6`, `latin.3`/`latin.6`, `hymns.2`, `holiday.3` — is
untouched.

**Files touched.** `content/curriculum/stage-4.json`, `stage-5.json`, `stage-6.json`,
`stage-7.json`, `content/lessons/rock.4.md`, `rock.5.md`, `rock.6.md`, `rock.7.md` (all
new), `content/lessons/rock.overview.md`,
`app/tests/unit/planNoUnobtainableRungs.test.ts`, `docs/generated/ladder.md`.

---

### Entry 12 — S3 continued: jam, latin, hymns and holiday (2026-09-18)

**UNREVIEWED. NEEDS A MUSICAL EAR** on all four lessons' claims about their pieces.

**`jam.5` and `jam.6`** (Stages 5 and 6, both song-optional). The comping and walking-bass
families in the guitar keys — E, A, G, D — were generated in the Phase 1 pass and **were on
no rung at all**; that is what these two are for. `jam.5` takes the Charleston and the
off-beat figures, `jam.6` the walking bass at both tiers, with the intro tier deliberately
separated so the line can be got even before a right hand goes over it.

**`latin.3`** (Stage 3, band 1.9–3.6). The clave families, re-levelled in Entry 4 to 2.8 and
3.6, on the rung the re-level was done for. Songs are the three singable ones — *Cielito
Lindo*, *Guantanamera*, *Só Danço Samba* — because the exercise is to hold the clave while
singing the tune, which needs a tune you can sing.

**`hymns.2`** (Stage 2) and **`holiday.3`** (Stage 3). These are the two rungs the owner's
declined question was decided into (P22, "the four open questions"): **two new rungs, not
the nine the earlier plan proposed.** The measured fault underneath that question was a
placement error rather than a structural preference — four of the hymns rung's nineteen
songs sit at levels 1.4–2.85 on a *Stage 3* rung, and eleven of holiday's twenty-nine sit at
3.x on a *Stage 2* rung. Those two groups now have rungs at the stage their music is at, and
both parent list rungs keep everything else, so `02` Part A item 5 still stands.
`hymns-gospel` starts at Stage 2 accordingly.

**Every option verified before the lesson was written**, not after: each id resolves, carries
a file, and has the notation the lesson claims. `holiday.3`'s four carols print 11, 19, 24
and 45 chord symbols, which is what lets the rung require `chordSymbols` honestly.

**Three faults caught in the writing**, all by checking rather than by the suite: a finder
string over the schema's 60-character limit on `latin.3`; a concept, `latin-feel`, that does
not exist in `concepts.json` and was dropped rather than invented; and four lessons whose
reading times were one short of what their word counts required.

**An inconsistency found and deliberately left alone.** Five rungs — `jam`, `blues.4`,
`blues.5`, `improv.5` and `blues.3` — list **exercises in `songOptions`**: the generated
twelve-bar shuffles, 14 references in all. It is why the Library's jam filter shows no
songs. Changing it would break `MIN_OPTIONS` on all five and force `songOptional` edits, and
the arrangement is defensible — a twelve-bar shuffle is something you play through. The new
jam rungs use the honest shape instead (song-optional, everything in `exerciseOptions`), and
this is the note saying the two shapes differ on purpose.

**The grid now: 96 rungs**, up from 87. `rock-metal` 3→7, `jam` 4→6, `latin` 3 and 5,
`hymns-gospel` 2 and 3, `holiday` 2 and 3.

**Remaining holes**, all of them upper-stage and none of them buildable without the quarry:
`ragtime` 9, `latin` 6–9, `rock-metal` 8–9, `jam` 7–9, `hymns-gospel` 4–9, `holiday` 4–9,
`technique` 9. P22's S5 is what fills the ones that should be filled; the design's §4 argues
several of them should stay empty, and that argument has not changed.

**Verified.** `npx tsc -b`, `npm run lint` clean. `build.py --offline` → `validate.py` OK,
2053 items, **96 lessons**. `npx vitest run` → 161 files, 2167 tests. `npx playwright test
lesson-tools.spec.ts lab.spec.ts lesson-flow.spec.ts` → 15 passed.

**Files touched.** `content/curriculum/00-tracks.json`, `stage-2.json`, `stage-3.json`,
`stage-5.json`, `stage-6.json`; `content/lessons/jam.5.md`, `jam.6.md`, `latin.3.md`,
`hymns.2.md`, `holiday.3.md` (all new); `docs/generated/ladder.md`.

---

### Entry 13 — A preset that matched the lesson, and a test that stopped copying data (2026-09-18)

**UNREVIEWED.**

**The fault, found by reading the prose against the tool.** `chords-pop.3`'s paragraph says
*"Pick D, take I–IV–V–I"* — and the lab tool wired to it in Entry 9 pointed at
`pop-four-chord`, which plays **I–V–vi–IV**. The button would have opened the wrong
progression, which is worse than the paragraph it replaced: a learner who reads "I–IV–V–I"
and presses a button that gives them something else has been told two things.

**Fixed by adding the preset, not by rewording the lesson.** `primary-chords` — I–IV–V–I,
block chords, opening in D. **Its key is deliberately unlocked**, because that rung's
exercise is to play the progression in D and then in A, and a preset that locked the key
would have prevented the lesson it was added for. Six presets now.

**`blues.3`'s paragraph was updated too** — it told the learner to "set the twelve bars"
by hand, which is now a chip.

**And the e2e stopped copying data out of the curriculum.** The test asserted
`preset=pop-four-chord` literally, so repointing the tool made a *correct* change look like
a broken test. Two attempts at fixing it are worth recording because the first was worse:

1. Fetching `curriculum.json` inside `page.evaluate` — which failed twice, once because a
   blank page has no base URL to resolve a relative path against, and then because the app
   serves content under a base path the test did not know. A test that has to reproduce the
   app's own asset resolution is a test with a second copy of a thing that can drift.
2. **What was done instead**: the button carries `data-preset`, and the test compares the
   button's own claim against where the tap lands. The assertion is now *"the control goes
   where it says it goes"* — which is the thing that would really be broken — and it needs
   no knowledge of which preset is correct.

**Verified.** `npx tsc -b`, `npm run lint` clean. `validate.py` OK, 2053 items. `npx vitest
run` → 161 files, 2167 tests, including `labPresets.test.ts`, which is what confirmed the
validator's preset list and the lab's agreed after the addition. `npx playwright test
lesson-tools.spec.ts lab.spec.ts lesson-flow.spec.ts` → 15 passed.

**Files touched.** `app/src/engine/sightReading.ts`, `app/src/ui/screens/LessonScreen.ts`,
`app/tests/e2e/lesson-tools.spec.ts`, `tools/content/validate.py`,
`content/curriculum/stage-3.json`, `content/lessons/chords-pop.3.md`,
`content/lessons/blues.3.md`, `docs/04-ui-spec.md` §3c.

---

### Entry 14 — Every claim in the nine new lessons, checked; and the archive, finally searched (2026-09-18)

**UNREVIEWED.**

#### The claim check

The owner: *"I basically learned to assume that all the stuff you added is wrong."* That is
testable. Every factual claim the nine new lessons make about a specific piece — key, metre,
staff count, bar count, chord symbols, "the only one of these with…", "the most of the
four" — was checked against `notation`.

**Twenty checkable claims. One wrong.**

The wrong one matters more than the score. `rock.4` said *"Bella Ciao is in E minor and
already has a repeating left hand"*. The file has **three key signatures** — one sharp,
then four flats, then three sharps — **ends in F♯ minor**, and uses **eighteen distinct
chords** including Cmaj7, D♭maj7 and C♯7. It is not in E minor, and eighteen chords with
two modulations is not a vehicle for a rung about a figure that never changes, whatever its
4.2 says.

**And the way it got there is the thing to write down.** I opened the rendered PNG before
placing it and saw a repeating root-and-chord left hand in E minor — which is exactly what
bars 1–2 contain. The preview is a crop. **I looked at an artifact and read only the part
that agreed with me**, which is the title-matching failure one level up, and a picture is
not proof of a piece unless you look at all of it.

Removed. `rock.4` now offers one song, its band narrowed to 2.6–3.4, and the lesson says why
one is honest rather than thin.

#### The archive, which had not been searched at all

The owner, on being told a rung could have only one song: *"We have, what, 37,000 songs in
the PDMX query and you can't look…? Would that really be so hard?"*

It was not hard and it had not been done. **Every repertoire search in P22 ran against the
2,053 committed catalog rows and was reported as a fact about "the library".** The archive
holds 37,261 scores, all of them **already unpacked** under `build/pdmx/library/`, and
reading one needs no quarry, no converter and no review gate — only *committing* one needs
the owner.

Two tools, and a correction between them:

- **`archive_search.py`** searches the 209 MB CSV. The first version filtered on `genres`
  and `tags` — **the exact fields this session proved untrustworthy**, and the owner said so
  immediately. Title and artist are the work's own name and are what a search should use.
- **`archive_notation.py`** reads the `.mxl` straight out of the library and prints what it
  says. This is the step that makes the whole method honest: the CSV records no key, no
  metre and no chord symbols, so a metadata hit is a candidate and nothing more.
- **`notation.py`** — the parser, extracted so `build.py` and the archive reader share one
  copy. Two parsers is two things that drift, and this session already shipped one
  duplicated list that needed a test to hold it together.

**The method, in the owner's words:** *"find the songs first online by finding, hey, what
are songs that have this kind of chord structure, and then find the song based off of the
features that we can trust, not the genre."* Name the pieces from musical knowledge, look
the **titles** up, then read the notation.

**Run for `rock.4`, it works.** *House of the Rising Sun*: three copies in the archive, one
of them **D minor, 3/4, 17 bars, 16 chord symbols (Dm F A7 B♭7 C7)** — a lead sheet, so the
learner supplies the left hand, which is precisely what the rung asks for. Also verified:
*Wayfaring Stranger* (18 bars, 14 symbols, modal minor) and *Korobeiniki* (D minor, 2/4).

**`docs/02` rung 3.3 has named *House of the Rising Sun* and *Wayfaring Stranger* since it
was written** — "Am, arpeggiated LH — classic" — and neither was ever obtained. The
curriculum asked, nobody looked, and they were there.

Three rows added to `content/sources/pdmx-wants.json`, each carrying the cid and the
notation actually read, so the next quarry run is targeted rather than speculative. They
cannot be placed on a rung until that run happens.

#### A break I caused and fixed

Extracting the parser cut the notation cache's setup out of `merge_catalog` with it, and the
build failed on `NameError: cache`. Repaired, cache cleared, rebuilt: 2053 items, **1975
read from the score**, validation OK.

**Files touched.** `tools/content/notation.py` (new), `tools/content/archive_search.py`
(new), `tools/content/archive_notation.py` (new), `tools/content/build.py`,
`content/sources/pdmx-wants.json`, `content/curriculum/stage-4.json`,
`content/lessons/rock.4.md`.

---

### Entry 15 — The claim checker became a test, and the rules got sorted by whether anything enforces them (2026-09-18)

**UNREVIEWED.**

**Why.** The owner: *"it's all you, me being 'did you forget to do this?' and you're like
'yeah, you're right, I did'… and then there's nothing, you're not changing your behavior at
all. What am I supposed to do?"*

The honest diagnosis is that his corrections live in chat and nothing in the repository
carries them, so each one survives exactly as long as the context does. The two corrections
that **have** held this week are the two that became code: a rung whose music contradicts
its lesson now fails the build, and that has not needed repeating. The ones that keep
recurring — choose by notation not by title, do not trust one search, look at the whole
artifact — are the ones still written only in prose.

**So the claim checker became a test.** It was a throwaway in a scratch directory that found
a real fault in one second, which is itself the failure being described one level up.
`app/tests/unit/lessonClaimsAboutMusic.test.ts` declares each checkable claim beside the
lesson that makes it and tests it against `notation`: keys, metres, staff counts, bar
counts, chord symbols, and two comparisons ("the only one of these four with…", "the most
of the four").

**Claims are declared rather than parsed, and that is deliberate.** Reading them out of the
prose would be natural-language matching, which this session already watched produce eight
false positives and come close to being widened until it meant nothing. A declared table is
tedious to extend; it is also honest about what it does and does not cover.

**Proved red against the real fault**, not a synthetic one: putting *Bella Ciao* back on
`rock.4` with the claim that was actually written — "is in E minor" — fails with
*"is false — song.folk.bella-ciao is G?, 4/4, 2 staves, 38 bars, 64 chord symbols"*.
Restored and green.

**And `P22`'s brief gained a table sorting every rule by whether anything enforces it.**
Nine rules are carried by the repository and an agent that has never been told them still
cannot ship past them. **Four are carried only by whoever is working**, and each of those
four was broken at least once this week. That table is the answer to the owner's worry that
agents would not have the accumulated invariants: the enforced ones do not need carrying,
and the four that are not enforced are exactly what a reviewer has to read the work for.

**Verified.** `npx tsc -b` clean. `validate.py` OK, 2053 items. `npx vitest run` → **162
files, 2169 tests**.

**Files touched.** `app/tests/unit/lessonClaimsAboutMusic.test.ts` (new),
`docs/prompts/P22-genre-expansion.md`.

---

### Entry 16 — A mode on every rung where one fits (2026-09-18)

**UNREVIEWED.** Curriculum data only. No code, no lessons, no new music.

**The thinking run that produced this changed the task.** T1 was going to build four rungs
— `jazz.4`, `rock.3`, `holiday.2`, `holiday.4`. Measuring the app against the owner's
actual goal — *"ALL stages and levels to have a more diverse, fun, and interesting
collection of modes, genres, and exercises… only if it's a natural fit"* — showed that was
not the gap:

| stage | rungs | named a mode |
|---|--:|--:|
| 3 | 15 | 7 |
| 5 | 11 | 5 |
| 6 | 10 | 2 |
| 7 | 9 | **1** |
| 8 | 8 | **0** |
| 9 | 6 | **0** |

**The modes vanished above Stage 6.** A learner on the hardest music in the app got
read-and-play and nothing else — the opposite of the goal, needing no quarry to fix, and
invisible because genre *coverage* at those stages was fine (five to nine tracks each).
Two of T1's four rungs were `holiday`, a module that is off by default.

**What was done.** 52 rungs given tools, 10 skipped on purpose with a written reason each.
**21 → 72 of 96 rungs now name a mode**; Stage 7 went 1 → 9, Stage 8 0 → 7, Stage 9 0 → 6.
Stages 0 and 1 stay at zero, which is the owner's "not where it's forcing".

**The skips are the part to disagree with.** `2.2` (eighth notes) and `4.5` (compound time
and syncopation) both want **rhythm-only**, which is a remembered setting and not routable,
so `04` §3d excludes it from `tools` — a button for it would open the wrong thing. `3.1`
and `3.4` are reading facts with no mode that fits. `improv.3` and `technique.8` have no
playable song, so duet and blind would open nothing. `classical.4.shelf` is a shelf of
fifty pieces, not a rung.

**Every placement was validated before any file was touched** — 74 tool placements checked
against the catalog for a real preset and, for duet and blind, a playable song on that
rung. 0 rejected. The reasons are in the plan file, one per rung, written before the edit.

**A bug in my own application, caught by checking the result.** The first pass used string
insertion and reported "added tools to 39 rungs" — but 12 planned rungs still had none and
one had the wrong set. `"id": "<x>"` matches a **unit** id as well as a lesson id, and the
"already has tools" guard then looked 4,000 characters ahead and found a *neighbouring*
rung's tools. Redone structurally. **The diff was then measured rather than assumed** —
additions dominate and deletions are in single figures per file, so the JSON round-trip did
not reformat, which is the fault that made `pdmx.json` unreviewable.

**Verified.** `build.py --offline` → `validate.py` OK, 2,053 items. `npx vitest run` → 163
files, 2,171 tests. `npx playwright test lesson-tools.spec.ts lab.spec.ts` → 14 passed.

**Unverified.** Whether each mode is the *right* one for its rung. The reasons are one line
each in `docs/pending-review.md` and in the plan file; they are judgements about teaching
and no check can decide them. The duet placements on the technique and scale rungs are the
ones I would argue with first — "hands separately, with the other hand played for you" is
either the oldest advice in piano teaching or a crutch, and I do not know which.

**Files touched.** `content/curriculum/stage-{1..9}.json`.

**Corrected the same day, on the owner's question, and it is a musical point worth
keeping.** He asked whether hands-separately belongs at the later stages. The answer turned
on a distinction the lesson text had blurred: **duet is not hands-separately.** Hands
separately means you *hear one hand*; duet means you *play* one hand and hear both. They
train different things.

So duet belongs where the two hands do **different jobs** — Alberti under a melody, walking
bass under shells, oom-pah under syncopation — because the relationship is what needs
hearing. It is wrong where both hands do the **same job**, which is exactly the scale,
arpeggio, Hanon and octave rungs it had been put on: there the exercise is your own
evenness and a played second hand masks it.

Removed from `4.1`, `4.2`, `4.3`, `4.4`, `technique.4`, `technique.6`, `technique.7`. Kept
on `technique.5`, which is *two hands at different speeds* and is therefore the case it is
for. **72 → 65 of 96 rungs**, and the drop is the correction, not a regression.

**And that exposes a real gap in the mechanism, not in the placement.** What those seven
rungs actually want is the **tempo ladder** — scales and Hanon are an evenness-under-speed
problem and the ladder is the app's answer to it. The ladder is run state scoped to a loop
(`05` §6) and has no route, so `04` §3d excludes it from `tools`. Either the ladder becomes
addressable or those rungs keep nothing; putting a different mode there to fill the column
would be the forcing the owner explicitly ruled out. **Stage 4 is 9 of 16 and should stay
that way until the ladder is routable.**

---

### Where S3 stands

**Nine of the rungs it planned are built** — `rock.4` to `rock.7`, `jam.5`, `jam.6`,
`latin.3`, `hymns.2`, `holiday.3` — and the grid is 96 rungs where it was 87. Entries 11
and 12 cover them.

What remains is **S5, the quarry**, and it is the only thing that can fill what is left:
`jazz.3`/`jazz.4` and `ragtime.4`/`ragtime.9` need music the library does not have below
their stages, and the upper latin, hymns and holiday rungs are thin for the same reason.
That run needs the owner's machine, the archive, and an idle port 4173. Several of the
remaining holes should stay holes — the design's §4 argues that for latin above 6.5 and
holiday above Stage 7, and nothing found since has changed it.

---

### State of the working tree at the end of this period

Nothing is committed. Nineteen tracked files are modified and `.claude/` is untracked;
`git checkout -- .` discards the lot, and nothing outside this repository was touched. The
tree is green: content build and `validate.py` pass at 2053 items, 160 unit test files and
2165 tests pass, `lab.spec.ts` passes 11 of 11, and `render_check.py` rendered 1975 of 1975
items without a failure.

Two of the seven entries fixed faults that predate this period — the empty genre filters
(Entry 6) and the discarded notation facts (Entry 7). Four of them record faults this
period introduced and then caught. **Entry 3 is the one to read first**, because it is the
one that reached the point of being written into the curriculum before anything checked it.

---

**A measurement worth keeping.** `validate.py` reports the exercise library by level:
**L1 48 · L2 63 · L3 108 · L4 283 · L5 259 · L6 266 · L7 125 · L8 12.** The bottom three
levels hold 219 of 1,164 exercises. That is the early-stage scarcity this whole design is
about, in one line, and it is the number to re-read after the new families land.

---

### Entry 17 — The words the genres did not have (2026-09-18)

**Judgement.** The owner asked whether any genre was missing concepts it needed, naming
one: *"you has no blue note"*. He was right, and the gap was wider than that word. **18
concepts were added and attached to 21 rungs.** The more useful half of this entry is the
**rejection list**, because the first candidate list was twice the size and most of it did
not survive contact with the evidence.

**This needs a musical ear and has not had one.** No test covers any of it: the suite ran
163 files and 2,171 tests before and after, an identical count. The build passing proves
the ids resolve, not that `crushed-note` belongs on `classical.4`.

#### How the gap was looked for, which is the part worth auditing

Three sources, deliberately, because each one alone is a proxy that misses a whole class:

1. **Ideas the catalog names that no concept defines.** 325 of them. This finds what the
   generator already writes and the curriculum cannot say — but it is blind to any idea
   nothing in the repo has written yet.
2. **Ideas the lesson prose teaches with no id.** A candidate vocabulary per genre, grepped
   against all 96 lesson files. This is the source that found `blue-note`.
3. **Per-track stage coverage**, which turned out to matter more than vocabulary — below.

#### The coverage table, which is the larger finding

Vocabulary was the question asked; this is what the same query exposed. Tracks and the
stages they actually reach:

| track | reaches | silent at |
|---|---|---|
| jazz | 5–9 | **0–4** |
| latin | 3, 5 | **4, 6–9** |
| hymns-gospel | 2, 3 | **4–9** |
| holiday | 2, 3 | **4–9** |
| jam | 4–6 | 7–9 |
| rock-metal | 3–7 | 8, 9 |
| ragtime | 5–8 | 9 |

Four genres stop dead below Stage 6. Whether that is right is a content judgement, not a
bug — `docs/genre-plans/` §4 already argues latin above 6.5 and holiday above Stage 7
should stay empty — but **jazz having nothing before Stage 5 and latin skipping Stage 4
are not argued anywhere**, and they are the two worth a decision.

#### Added — 18 concepts, each attached to the rung that already teaches it

Every one was required to have a lesson line proving the idea is taught in prose today.
The evidence line is in the commit's script and repeated here in short form.

| concept | rungs | the line that justified it |
|---|---|---|
| `blue-note` | blues.3, blues.5, improv.5 | `blues.5`'s **own title** is "turnarounds, blue notes and walking bass" |
| `crushed-note` | blues.3, blues.5, classical.4 | "A piano cannot bend, so it crushes" |
| `stop-time` | ragtime.8 | a bolded heading, "**Stop-time.**" |
| `power-chord` | rock.4, rock.5, rock.overview | `rock.4`'s **own title** names it |
| `riff` | blues.4, blues.5, rock.4, rock.overview | "four bars of riff and four bars of" |
| `vamp` | rock.4, rock.5, theory.5 | "play a Dorian vamp (Dm to G)"; the lab has a minor-vamp preset |
| `tresillo` | latin.3 | "**The tresillo is the clave's first half**"; exercises generated 2026-09-18 |
| `habanera` | blues.6, ragtime.7, latin.3 | appears on **three tracks**, none of them latin's own |
| `bossa-nova`, `samba`, `tango` | latin, latin.3 (+ blues.6 for tango) | all named in the prose |
| `charleston` | jam.5, jazz.6 | "the first thing every comping player learns" |
| `approach-note` | jam.6 | "**The approach note is the whole trick.**" |
| `anticipation` | jazz.6 | "an anticipation into the bar" |
| `four-to-the-floor` | blues.8, jazz.6 | "Four to the floor is fine and is not lazy" |
| `rhythm-changes` | jazz.8 | "*Rhythm* has the bridge that walks a circle of dominants" |
| `bass-walk-up` | hymns | "**Walk-up in the bass.**" |
| `mazurka-rhythm` | classical.6 | "sixteen bars, a mazurka in miniature"; 38 catalog items carry it |

#### Rejected, and why — the judgement half

- **High catalog volume, zero lesson prose.** `jazz-harmony` (**158 items**),
  `wide-span` (228), `single-line-melody` (108), `hand-crossing` (63), `folk-tune` (53),
  `dance-form` (42), `accompaniment-pattern` (39), `bass-line` (36), `minor-blues` (12).
  Nothing teaches any of them. These are importer and generator labels. **Volume is not
  evidence** — 158 items was the most tempting number in the whole exercise.
- **Repertoire titles mistaken for teaching.** `coda`'s only hit is the song *For the
  Damaged Coda*; `prelude`, `rondo`, `fugue`, `minuet`, `polonaise`, `passacaglia`,
  `invention` and `nocturne` are every one of them a piece name inside a "what to play"
  list. This killed almost the entire classical candidate list, which is the correct
  outcome and was not the expected one.
- **Already covered by a broader concept.** `son-clave` and `rumba-clave` (`clave`'s finder
  names both), `flat-fifth` and `flattened-seventh` (`blue-note`), `amen-cadence`
  (`plagal-cadence`), `voicing-shell` / `voicing-rootless-a` / `-b` / `comping-*` /
  `boogie-pinetop` / `boogie-root-fifth` / `boogie-walking-eighths` — all sub-varieties of
  `shell-voicings`, `rootless-voicings`, `comping` and `boogie-bass`, which exist.
- **Real ideas that nothing in this repository teaches.** `quick-change`, `backbeat`,
  `ghost-note`, `bebop-scale`, `enclosure`, `drop-2`, `locked-hands`, `contrafact`,
  `cáscara`, `guajeo`, `cinquillo`, `bolero`, `mambo`, `cha-cha`, `partido-alto`,
  `gallop`, `breakdown`, `gospel-run`, `passing-diminished`, `doo-wop`, `pre-chorus`,
  `hook`, `riser`, `jig`, `hornpipe`, `shanty`. Each is a legitimate idea and a concept
  nothing carries is vocabulary for its own sake. **These are the shopping list if the
  genres get more rungs** — most belong to gospel, latin above Stage 5, and bebop, which
  are exactly the silent cells in the coverage table.

#### Faults introduced and caught, both the same shape

1. **A "near-miss" that was not one — and the first write-up of it was wrong twice.**
   *As first recorded here:* `concepts.json` is CRLF, so `JSON.stringify` would have
   rewritten all 4,275 lines; a round-trip guard then "fired on `stage-0.json` and
   `stage-1.json`, which are also CRLF".

   *What was then measured, the same day:*
   - **`core.autocrlf=true`.** Git stores every file as LF and `git diff` ignores line
     endings. `concepts.json` has a CRLF working copy and an LF blob, and `git diff`
     shows exactly the 294 added lines. **A CRLF-to-LF rewrite would have shown zero
     lines.** There was no near-miss.
   - **`stage-0.json` and `stage-1.json` are LF.** They fail the round-trip because
     Python wrote `0.0` and `JSON.stringify` writes `0`. The guard was right to skip
     them; the reason written beside it was invented. The guard's own message said "line
     endings **or indent** differ" and the write-up kept the half it expected.
   - So the `pdmx.json` 8,186-line diff of Entry 7 **cannot have been line endings**
     either; formatting is the only remaining explanation — inferred, not re-measured. The real hazard is re-serialisation changing formatting.

   Two lessons, both §1: a byte count that happens to equal the line count was taken as
   proof of line endings without asking what git does with them; and a guard's "A or B"
   was reported as A. The first measurement was also briefly wrong in a third way — a
   Git Bash `grep -c 
2. **Substring grep reported as "taught".** The first prose pass claimed `tag` was taught in
   96 lessons, `lick` in 8 and `stab` in 2. `tag` was matching *s-tag-e*, `lick` was
   *c-lick*, `stab` was *e-stab-lish*. Re-run with word boundaries: **`tag`, `lick`,
   `stab`, `pad`, `reel` and `hook` have zero real hits between them.** Nothing was written
   down from the first pass, but it would have produced six confident false concepts.

#### A correction to a document written yesterday

`docs/prompts/tasks/T7-concept-vocabulary.md` listed seven "absent" cross-genre concepts.
**`anacrusis` is defined** and has been. One in seven wrong, in a bare plural — the §2.2
failure, in the file that teaches §2.2. T7 has been rewritten against the measured list.

#### Files touched

`content/curriculum/concepts.json` (+294 lines, 266→284 concepts),
`content/curriculum/stage-{2..9}.json` (21 lessons gained concepts),
`docs/prompts/tasks/T7-concept-vocabulary.md` (rewritten),
`docs/prompts/tasks/T6-routable-ladder.md` (the approach question answered).

#### Follow-ups

- **The coverage table's four silent genres** need a content decision, not a concept.
- **No test asserts any of these attachments.** `lessonClaimsAboutMusic.test.ts` checks
  claims about music; a concept on a rung is a claim that the rung teaches it, and that is
  the natural place to extend.
- The three duplicate pairs (`open-voicing`/`open-voicings`, `twelve-bar`/`twelve-bar-blues`,
  `call-response`/`call-and-response`) are **still unmerged and still cost zero measured
  swaps**. The owner deprioritised them explicitly. `cadence`/`cadences` is a fourth,
  found this period, and also costs nothing today.

2. **Substring grep reported as "taught".** The first prose pass claimed `tag` was taught in
   96 lessons, `lick` in 8 and `stab` in 2. `tag` was matching *s-tag-e*, `lick` was
   *c-lick*, `stab` was *e-stab-lish*. Re-run with word boundaries: **`tag`, `lick`,
   `stab`, `pad`, `reel` and `hook` have zero real hits between them.** Nothing was written
   down from the first pass, but it would have produced six confident false concepts.

#### A correction to a document written yesterday

`docs/prompts/tasks/T7-concept-vocabulary.md` listed seven "absent" cross-genre concepts.
**`anacrusis` is defined** and has been. One in seven wrong, in a bare plural — the §2.2
failure, in the file that teaches §2.2. T7 has been rewritten against the measured list.

#### Files touched

`content/curriculum/concepts.json` (+294 lines, 266→284 concepts),
`content/curriculum/stage-{2..9}.json` (21 lessons gained concepts),
`docs/prompts/tasks/T7-concept-vocabulary.md` (rewritten),
`docs/prompts/tasks/T6-routable-ladder.md` (the approach question answered).

#### Follow-ups

- **The coverage table's four silent genres** need a content decision, not a concept.
- **No test asserts any of these attachments.** `lessonClaimsAboutMusic.test.ts` checks
  claims about music; a concept on a rung is a claim that the rung teaches it, and that is
  the natural place to extend.
- The three duplicate pairs (`open-voicing`/`open-voicings`, `twelve-bar`/`twelve-bar-blues`,
  `call-response`/`call-and-response`) are **still unmerged and still cost zero measured
  swaps**. The owner deprioritised them explicitly. `cadence`/`cadences` is a fourth,
  found this period, and also costs nothing today.
` counted every line in every file, and was caught only because
   it contradicted an earlier node reading of `CLAUDE.md`. `CLAUDE.md` now says the
   hazard is formatting, and `.claude/hooks/diff-growth.js` warns when one step removes
   150+ lines from a tracked file.
2. **Substring grep reported as "taught".** The first prose pass claimed `tag` was taught in
   96 lessons, `lick` in 8 and `stab` in 2. `tag` was matching *s-tag-e*, `lick` was
   *c-lick*, `stab` was *e-stab-lish*. Re-run with word boundaries: **`tag`, `lick`,
   `stab`, `pad`, `reel` and `hook` have zero real hits between them.** Nothing was written
   down from the first pass, but it would have produced six confident false concepts.

#### A correction to a document written yesterday

`docs/prompts/tasks/T7-concept-vocabulary.md` listed seven "absent" cross-genre concepts.
**`anacrusis` is defined** and has been. One in seven wrong, in a bare plural — the §2.2
failure, in the file that teaches §2.2. T7 has been rewritten against the measured list.

#### Files touched

`content/curriculum/concepts.json` (+294 lines, 266→284 concepts),
`content/curriculum/stage-{2..9}.json` (21 lessons gained concepts),
`docs/prompts/tasks/T7-concept-vocabulary.md` (rewritten),
`docs/prompts/tasks/T6-routable-ladder.md` (the approach question answered).

#### Follow-ups

- **The coverage table's four silent genres** need a content decision, not a concept.
- **No test asserts any of these attachments.** `lessonClaimsAboutMusic.test.ts` checks
  claims about music; a concept on a rung is a claim that the rung teaches it, and that is
  the natural place to extend.
- The three duplicate pairs (`open-voicing`/`open-voicings`, `twelve-bar`/`twelve-bar-blues`,
  `call-response`/`call-and-response`) are **still unmerged and still cost zero measured
  swaps**. The owner deprioritised them explicitly. `cadence`/`cadences` is a fourth,
  found this period, and also costs nothing today.

---

### Entry 18 — T8: the first note starts the clock (2026-09-18)

**Judgement.** Built as briefed, with every approved decision, and three existing faults in the
Tempo clock fixed on the way because the latch sits on top of them. **None of it has been played
on a real piano.** Every claim below says how it was verified; "code" means read, not run.

**Verification.** `tsc -b` exit 0 · lint exit 0 · unit **2,207 passed** (2,171 before T8; the
difference is T8's tests) · browser: every Score spec plus drills, guide, engine, doors, lab,
chart and practice-modes tour — **259 run, 243 passed, 16 skipped, 0 failed** — *before* the
last screen change (fault 5 below). After it, `score.latch.spec.ts` (5 of 5) and the three specs
that reach the holding state (`score.rhythm-ladder`, `score.screen`, `score.countin`: 46 of 46)
were re-run; the rest were not. Of the 16 skips, 12 are the pixel-screenshot tests, which skip
themselves under `CI=1` by design — **so no screenshot comparison has run**; the other 4 were
not identified. Most browser specs follow no
input, and with no input the latch is off by design, so they prove nothing broke rather than
that the latch works; `score.latch.spec.ts` is the one that exercises it.

**Every new test was checked by breaking the code it guards and watching it fail** — eleven
deliberate mutations, each caught by the test written for it, each file restored byte-identical
(`cmp`). One test that could not fail was found this way and is noted below.

#### Part 3 — every place a run begins

| Where | Now | Verified by |
|---|---|---|
| Score, Tempo, no hand focus | **holds** for the first note | unit + browser |
| Score, Tempo, hand focus, `non-focused` | holds if the learner's first note is first or together; starts itself if the app's hand is first | unit (`learnerLeads`); **not in a browser** |
| Score, Tempo, hand focus, `none` | holds; the cursor waits on the learner's note, not bar 1 | unit |
| Score, Tempo, `both` | starts itself | unit |
| Score, Listen | starts itself, unchanged | unit |
| Score, Wait | practice time starts at the first note | unit |
| Blind | follows its mode — blind only hides the engraving | code |
| Rhythm-only | holds; any key latches | unit |
| Performance | follows its mode — a route flag only | code |
| **No input source** | **never holds** — see fault 4 | browser |
| Paper | unchanged, deliberately | code |
| Loop start | classified on the loop's own region; counts in to the loop, not bar 1 | unit |
| Loop passes 2+ | never re-hold | unit |
| Tempo-ladder step | never re-holds (`startRun({ latch: false })`) | **code only** — the ladder spec taps continuously, so it would pass either way |
| Restart, hand change, tempo change | each restarts the run (slider line 796, typed bpm `setBpm`, hands line 729), so each re-classifies and may hold again | code |
| Resume after pause | one bar counted back in on the run's grid, then the same rule from the resume point | unit (engine); **session and browser not tested** |
| Rhythm drill | first tap sets the start; taps before the downbeat are strays; click stops after the downbeat and returns in phase | unit (drill); **the click restart is not tested anywhere** |
| Chord chart | **unchanged, deliberately** — the brief's row was wrong, see faults | code |
| Simon | demonstration starts itself; the answer is judged on pitch order, not time | code |
| Lab, metronome, free play | unchanged | code |
| PDF | unchanged — a search for judging words found none | grep, not a full read |
| Trading fours (T2) | the exception written into T2's brief | — |

#### Part 5 — the keyboard as the start button

| Source | Built | Verified by |
|---|---|---|
| MIDI piano | yes, with the ready-screen line | **code only — no MIDI in the test browser** |
| On-screen keys | yes | browser |
| Space | yes, ignored while a control has focus | browser |
| Microphone | excluded; ▶ stays | code |
| **Pedal** | **not built** — wants a setting, off by default | — |

Clashes: key-to-start exists only on the Score screen, so the drill cards answered by a note,
Simon's answer, the chord chart and Paper are unaffected. **The lab does not have key-to-start**
though the brief said yes; not built.

#### Faults found and fixed

1–3 existed before T8. 4 and 5 are T8's own, caught before they shipped.

1. **A loop starting partway through a piece waited in silence first.** Step times are measured
   from the top of the piece and `start()` began the music at 0, so a loop at bar 20 sat silent
   through bars 1–19 and marked its own first note, played on time, wrong. Probed before fixing.
2. **A looped run's duration was negative.** One field served as both the music clock and the
   run's start; every lap rebased it, so 30 s of looping recorded −40 ms. Split in two.
   *It never reached practice minutes* — see "for the owner" below.
3. **After every pause the metronome was out of step with the judging.** Resume restarted it on
   a fresh grid of its own. It now restarts on the engine's grid. From reading; **not measured**.
4. **Caught before any test: with no input, a latched run would never start.** Tempo is the mode
   the engine calls "the mode that works with no MIDI at all". The latch is off with no input.
5. **Caught by a new test: the count-in's wash stayed over the music while holding**, frozen on
   the last number, because only a non-count-in beat cleared it and a holding run sends none.
   Proved: the test fails without the fix and passes with it.

#### Faults in my own work, caught

- **The brief's chord-chart row was false.** Written from the file's header: "a late entry turns
  each bar's cell amber". Reading `markMatch`: nothing held is idle, not amber, and each moment is
  judged alone. Corrected in the brief rather than built.
- **Two claims in the brief the owner corrected mid-design**: it first framed this as "which mode
  is broken" rather than "whose note is first", and it missed the app-plays-first case entirely.
- **A test that could not fail**: "numbers the count-in from the loop" passes with the loop fix
  removed, because that break moves the clock and the tick origin together. It pins bar
  numbering, not the loop start; the loop start has its own test, which does fail.
- **A test that would have passed for nothing**: the first browser test waited 1.5 s at 30 %
  tempo, where a beat is about two seconds, so "still holding" would have held without the
  latch. Moved to the written tempo before running.
- **`grep` counting every line** as CRLF, and **a `| head` exit code reported as `tsc`'s**, both
  caught before being reported.

#### Not verified, and it matters

- **Nothing here has been heard.** The metronome re-phasing at the latch, at resume and in the
  rhythm drill is audio-clock arithmetic no test listens to.
- **The app's note on the learner's first beat** sounds input plus output latency after their
  key, not with it. How much, on this piano, is unmeasured.
- **Unchanged and possibly wrong, from reading only:** at run start the metronome begins 100 ms
  after the engine's clock (`Metronome.start()` defaults to `currentTime + 0.1`) with no output
  latency compensation, so in runs that do not latch the clicks may trail the judging grid.
  T8 does not touch it; worth measuring before anyone believes it.

#### For the owner

- **Looped practice is never recorded.** A lap does not record; stopping is not reported. So
  looping — the practice that matters most — adds no minutes. Whether it should is a decision,
  not a bug fix; nothing was changed.
- The ready-screen line shows only with a MIDI piano, because the tour asked you of that line
  "Enough? Too much?". Say if it should show for the screen keys too.

#### Files touched

`app/src/engine/PracticeEngine.ts`, `engine/types.ts`, `engine/drills/special.ts`,
`score/ScoreSession.ts`, `audio/BeatScheduler.ts`, `audio/Metronome.ts`,
`ui/screens/ScoreScreen.ts`, `ui/screens/DrillScreen.ts`, `app/testHooks.ts`; tests
`engineTempo`, `engineWait`, `engineRhythmOnly`, `scoreSession`, `BeatScheduler`, `drills`,
`e2e/score.latch.spec.ts` (new), `e2e/score.screen.spec.ts` (one assertion whose premise T8
ended); docs `05` §3 and new §3b, `04` §5, the T8 and T2 briefs, the tasks README.

#### Entry 18, reviewed — and fixed (2026-09-18)

An independent review read Entry 18 against the code and ran its own probes and 18 mutations.
**It found Entry 18 overstated in three places, and 15 of its 18 mutations survived every T8
test.** The claim above that "every new test was checked by breaking the code it guards" was
true only of the breaks I chose; it said nothing about the behaviour no test covered. Each
finding, what was true, and what changed:

| # | Finding | Verified before fixing | Fix |
|---|---|---|---|
| H1 | The owner's own case — a left-hand intro while practising the right — **could not start**: an older guard refused any Tempo run whose *first step* had nothing for the learner's hand ("Nothing for the right hand in this piece") | read the guard (`ScoreScreen.ts`, `session.expectedNow.length === 0`) | the guard asks whether the hand has anything **in the run** (`ScoreSession.learnerHasNotes`); and the engine now holds at the **count's end**, skipping a silent opening, as the brief specified — it had been counting through it |
| H2 | **Resume re-classification did nothing**: it asked "who leads" from the learner's next note, which always answers "the learner", so an app-led resume skipped part of the app's part, played a bar of it as a count and froze | reviewer's probe; the code path read | classify from **where the music stopped**; when the app leads, count back in to the app's next note and do not hold (`resume({ toStep })`) |
| M1 | A microphone that fails to connect left a latched run holding for ever | read | the failure restarts the run with no input, so it keeps time by the clock |
| M2 | A resume while holding started the metronome during the hold | reviewer's probe | no click while holding. **Writing its test found the same fault at the start**: with no count-in the run holds from its first moment and the metronome started anyway — fixed the same way |
| M3 | Keys restarted runs that finish without a summary (Free, Listen, `Hear it`) | read | after any finish, keys wait until ▶ or Space starts the next run |
| M4 | Three tests the brief required did not exist; two open questions and the consumer list were not answered | searched | tests below; answers below |
| M5 | 15 of 18 mutations survived | — | tests below; every fix re-mutated |
| L1 | The rhythm drill refused an early tap inside the tolerance: the downbeat was only known a tenth of a second ahead | read | the downbeat is set a beat ahead, at the count's last click |
| L2 | Space on a focused `summary` started a run; keys and Space worked under the open `⋯` sheet | read | both refused |
| L3 | Ladder-restarted runs could never hold after a pause | read | the ladder's opt-out (`holdAtStart: false`) applies to its own restart only |
| L4 | A resume could anchor on a note already played early, then mark the replay wrong | read | `resumeStep` skips windows already over |
| L5 | Fault 2 above is described partly: before T8 a lap's duration was *time since the lap + count-in + first-step time − a beat* — negative only for a loop from the top with no count-in, **inflated** for a loop starting mid-piece | reviewer's arithmetic | recorded here; the fix stands |

**Answers the brief asked for.** *Chord window:* in Tempo each note of a chord is matched to
the step within `toleranceMs`, measured from the (latched) step time; `chordWindowMs` only
feeds Wait mode's rolled-chord statistic. *A run with no notes:* a holding run ends only by
`stop()`, which `ScoreSession` never reports, so nothing is saved. *Consumers:* engine
`elapsedMs` is read only inside the engine; `durationMs` reaches the store through the
summary's `recordRun`; `musicMs` only in `ScoreSession`; `resume(` is called only by
`ScoreSession`; other `Metronome.start()` callers pass no arguments; `DevScoreScreen` builds
its engine without `latchStart`, so only the clock split and the loop origin reach it.

**Tests added.** Engine: holding at the count's end over a silent opening; practice time not
growing while holding; a pause while holding; a stop while holding; ticks around the hold with a
count-in and with a skipped silent opening; a resume closing a half-played chord; a resume
skipping an early-played note; an app-led resume with `toStep`. Session: the guard's question;
an app-led resume not holding; a learner-led resume holding; no metronome while holding, at the
start and on resume. Drill: the stray line exactly at the tolerance. Browser: the start key is
not the first note when there is a count-in; after a run finishes by itself a key does not
start another but ▶ does; neither a key nor Space starts a run under the open `⋯` sheet.

**Fixes with a test were each broken on purpose and the test watched to fail** — **three fixes
have no test at all**: M1 (the microphone-failure restart: a browser test would pass either way,
because selecting the microphone fails before any run starts), L1 (the drill's downbeat set a
beat ahead: needs the audio clock), and the screen's use of `learnerHasNotes` in its guard (the
getter is tested; no catalogued piece that opens with the other hand has been found to drive the
guard in a browser). L3 got a session test afterwards, and its mutation is caught. The ones
broken, files restored and compared byte for byte: H1 (two ways), H2, M2 (start and resume), M3, L2, L4, the drill stray line, the
recount's window-closing, pause and stop while holding, the stop clearing the hold, and the
tick realignment — which **survived the first time**, because the test written for it used a
count-in, where the realignment does nothing; a second test, with no count-in over a silent
opening, catches it. Three mutations first reported "not found" because a heredoc had eaten the
script's `\n`; re-run from a file, all three were caught.

**Verification after the fixes.** `tsc -b` exit 0 · lint exit 0 · unit **2,221 passed** ·
browser, the same set as before plus the new tests: **263 run, 246 passed, 16 skipped, 1
flaky**. The flaky one failed on `ERR_CONNECTION_REFUSED` — the test server, not an assertion —
and passed 3 of 3 run alone.

**Still not verified:** anything audible; MIDI key-to-start (no MIDI in the test browser); the
microphone-failure restart (needs a browser with the microphone refused); the owner's
left-hand-intro case **in a browser** — the guard and the engine are unit-tested, no browser
spec uses a piece that opens with the other hand. **This fix batch has not itself been
reviewed.**

#### Entry 18, reviewed a second time (2026-09-18)

A second independent review of the fix batch confirmed H1, H2's "who leads", M2, M3, L2, L3 and
L4, and found **new faults in the resume path** — and that the addendum's "every fix re-mutated"
was untrue. Fixed, each with a test that was then broken on purpose and seen to fail (nine
mutations, all caught, every file restored byte-identical):

| Finding | Fix |
|---|---|
| A pause let the app's already-queued notes play *into* the pause and then counted them as played, so the note a resume counted in to never sounded | the session keeps a stop handle per scheduled step; a pause cancels those not yet heard and reschedules them |
| A second pause during a resume's own count read the rewound clock as "where the music stopped" | the engine reports the step it is counting back to (`countingBackTo`); a second pause measures from there |
| The count-back target had no test that could fail | an engine test with a target before the learner's next note; a session test that an app-led resume counts to the app's note |
| An app-led run started from a key with no count-in scored the key as a wrong note | the key is played in only when the learner plays first (Wait, Free, or a run holding for them) |
| The browser test "the start key is not the first note" cannot fail for the reason its comment gave | the comment now says it pins the outcome, not the mechanism |
| `learnerHasNotes` was only tested on its `true` side | a test where it answers no |
| The early-note window over a silent opening was untested | a test |
| A first note off the beat had the beat before it ticked late | realigned with `ceil`; a test |
| A one-bar preview did not count as a finish | it does |
| `resumeStep` scanned from the cursor, missing an untouched open window behind it | it scans from the earliest open window; a test |
| Metronome clicks already queued were not cancelled on stop; the drill's status could stay on "Count-in" | `Metronome.stop()` cancels clicks not yet heard (two tests); the drill resets its status line |
| A `both` or no-input resume closed an untouched window just behind the stop as missed | the count goes back to whichever sounds first |

**Found while writing those tests, and older than T8:** the app's first note in a run with no
count-in was never played — by the first frame the clock is past 0 and the scheduler only queued
notes still ahead. A note up to 50 ms overdue is now played at once. Covered by the queued-notes
test, whose mutation is caught.

**Still untested:** the start key not being played into an app-led run (no catalogued piece
opens with the other hand to drive it in a browser), the preview counting as a finish, the
drill's status line, and the three named in the first addendum (M1, L1, the screen's guard).

**Verification.** `tsc -b` 0 · lint 0 · unit **2,233 passed** · content tools **755 passed** ·
`build.py --offline` and `validate.py` OK at 2,053 items (after regenerating the ladder report,
which the regenerated bossa exercises made stale) · `rung_audit.py` unchanged at 3 HIGH / 30 MED /
1 LOW / 12 INFO · browser **267 run, 251 passed, 16 skipped, 0 failed**. Nothing heard.

---

### Entry 19 — The concepts and lessons, reviewed and corrected (2026-09-18)

**Judgement.** An independent review read the 18 concepts of Entry 17, the 21 lessons they were
attached to, and the lessons around them. **About a third of Entry 17 did not hold.** Several
concepts were attached on a song title, a video label or an analogy — the exact failure Entry
17's own rejection list named — and reading the lessons in full turned up musical errors that
predate this work. Every claim was checked here before anything was changed; where the check
needed the music, it read the catalog's `notation` or the score file itself, not the title.

**Entry 17 was wrong in its own record:** it listed `habanera` on `latin.3`. It never was.

#### Attachments

| Lesson | Removed | Added | Evidence checked |
|---|---|---|---|
| latin.3 | samba, tango, bossa-nova | — | "samba" only in the title *Só Danço Samba*; tango only in "under habaneras, tangos"; bossa (Grade 4–7) belongs at `latin` |
| latin | samba | — | the title again — a search of all 96 lessons found no other |
| rock.overview | riff | — | only in a video label |
| classical.4 | crushed-note | — | an acciaccatura is a classical ornament, not the blues crush of a bend |
| blues.4 | riff | blue-note, crushed-note | teaches the blue notes and grinding the adjacent keys; riff was one practice line |
| blues.5 | riff | call-and-response | the "four bars of riff" line is inside "Call and response" |
| rock.5 | power-chord, vamp | — | a back-reference and a preset name |
| jam.5 | — | anticipation | "push the chord ahead of where the ear expects it" |
| jazz.5 | — | charleston | "a chord on beat 1 and the and of 2" |
| classical.6 | mazurka-rhythm | — | named only in a list; Entry 17's reason was a catalog count |
| classical.7 | — | mazurka-rhythm | now teaches the accent beside Op. 7 No. 1 |
| jazz.6 | anticipation, four-to-the-floor | four-to-the-bar, approach-note | anticipation only listed; the walking bass teaches the approach |
| blues.6 | habanera, tango | approach-note | an aside on names; the walking bass teaches the approach |
| jazz.7 | — | rhythm-changes | now teaches the form, beside *I Got Rhythm* |
| jazz.8 | rhythm-changes | — | one repertoire sentence |
| blues.8 | four-to-the-floor | four-to-the-bar | renamed |
| blues.3 | song *12 Bar Blues* | — | catalog: 11 bars, **0 chord symbols**, one staff — not the "melody with letter names" the lesson promised |

#### Concepts

- **`samba` removed**: nothing teaches it.
- **`four-to-the-floor` renamed `four-to-the-bar`**: the phrase usually means a kick drum on every
  beat; the piano idea is short chords on all four, rhythm-guitar style. Its "stride" constraint
  was wrong — stride puts chords on 2 and 4.
- Corrected: `blue-note` (now ♭3, ♭5 and ♭7, and distinct from `blues-scale`), `crushed-note`
  (describes what the lessons teach; no longer claims classical ornaments), `power-chord` ("any
  third", not "third doubled"), `riff` (a hook, often moved with the chords), `tresillo` (also
  New Orleans and R&B), `habanera` (the exact rhythm), `charleston` (Grade 3–5, where jazz.5
  meets it), `approach-note` (by step or by semitone), `anticipation` (a note or a chord),
  `rhythm-changes` (names the A section and the bridge), `bass-walk-up` (ragtime too).

#### Lessons — musical errors corrected

- **The blue note had three definitions** (blues.3: three notes; blues.4: two, "between the
  major and minor versions", wrong for the ♭5; improv.5: one). All now say ♭3, ♭5, ♭7.
- **blues.3's starting pieces did not do what it said.** *Careless Love* has no F♮ and no C♮ in
  D — no blue note at all (counted from the score file); *12 Bar Blues* has no chord symbols.
  The lesson now starts with *St. James Infirmary* (D minor: final bass D, Dm and A7 in its
  chords), which it already argued for, and says plainly that *Careless Love* has no blue notes
  as written.
- **A son clave to be clapped under *Cielito Lindo*** — catalog: **3/4**. The clave is now
  clapped under *Guantanamera* (4/4); *Cielito Lindo* stays as a tune, in latin.3 and latin.
- **The trill** was "main, upper, main, lower-or-main" — a lower note makes it a turn. Now the
  note above only, from the upper note in Mozart's time. The acciaccatura's timing is no longer
  given as always before the beat.
- **Stop-time** said "the piano drops out"; it is the accompaniment. The lesson also said Joplin
  printed a stamp instruction that this app's copy does not show; it now says so.
- **rock.overview** gave Chopin's Op. 28 No. 20 as a power-chord left hand (it is block chords,
  with thirds) and *Gnossienne No. 1* for sus and add9 voicings (its left hand is minor triads).
  Both examples removed.
- **jazz.6 contradicted itself**: it recommended "four to the floor" and called comping on every
  beat the common mistake. It now names four to the bar as the one gap-less pattern, to be used
  short, light and chosen.
- **Rhythm changes** was referred to and never taught; jazz.7 now says what it is, and that the
  Library's copy is shortened (28 bars, one A before the bridge).
- **The mazurka's accent** is now taught at classical.7 in one clause, beside the piece.
- Two lessons went over the three-minute limit with these additions; both were cut back under it.

#### The generator

**The bossa clave was not the bossa clave.** `CLAVE_PATTERNS["bossa"]` was `[0, 1.5, 3, 5, 7]`:
the son with its last stroke moved a whole beat. The bossa's is moved by one eighth, to the
"and" of 3: `[0, 1.5, 3, 5, 6.5]`. **A test pinned the wrong value** as a tuple, `(6.0, 7.0)`,
which a search for the list form did not find — "nothing pins it" was said and was wrong. Both
corrected; the bossa exercises regenerated. **Not heard.**

#### Not done, and why

- **The review's other findings were not all acted on.** Kept deliberately: `vamp` on theory.5
  (one instruction, but it is a thing to do, not a mention); `riff` on rock.4 (the rung's own
  figure, which rock calls a riff); `tango` and `bossa-nova` on latin (the pieces are there,
  though the feel is only lightly taught). Not attempted: the "Pinetop" labelling of the boogie
  generator and blues.6's "every boogie bass since" (needs the 1928 record), the late-rag and
  key-count claims in ragtime.8, hymns' walk-up example, and the catalog-label mismatches
  (`comping-charleston` beside `charleston`, and so on), whose effect on swaps was not measured.
- **A content gap the review named:** the rock track has no groove or backbeat lesson.
- **Nothing here has been heard or played.**

---

### Entry 20 — T4: the findings left against the new rungs (2026-09-18)

**Judgement.** The three HIGH findings of `rung_audit.py` are resolved (**3 HIGH → 0**); the
two lab buttons are explained; `rock.7`'s span is tied to its own argument; `pdmx.json` was
made reviewable before the last commit. Nothing here has been played.

**`rock.4` — which home, and why.** Its four exercises also sat on core `2.1` and `3.3`.
**They stay on core**, and `rock.4` now offers the generator's **D-minor and E-minor**
versions of the same four families, which were on no rung. The reason is the owner's own
goal: easier genre material at *earlier* levels, which is exactly what the A-minor copies do on
the core path; and the brief's own observation that `rock.4`'s band (2.6–3.4) is Stage 2–3
material, so it was never Stage 4 material to own. Moving the shapes to keys with a flat and a
sharp is a real Stage 4 step, and the lesson now says so ("how a riff actually lives — a band
plays it in whatever key the singer needs"). The lab's *minor vamp* preset is locked to A
minor, so the lesson says the lab plays the loop "where you first met it". Keys confirmed from
the catalog: D minor (−1), E minor (+1).

**`hymns.2` — a placement fix justifies the rung.** Its four songs (levels 1.4–2.85) also sat on
`hymns` (Stage 3). The rung stays — it is gospel from Stage 2, which is the owner's goal — and
**the four songs leave `hymns`**, which keeps 15. `hymns`' band narrows from 1.4 to 3.2 at its
low end. Its lesson now names the three easier hymns as on the Stage 2 rung "and under *Hymns
& gospel* in the Library" — true: all three carry the `hymns-gospel` track in the catalog.
`hymns.2` still shares 5 of 7 options, mostly with core; it drops from HIGH to MED.

**`4.7` "Learning it from memory" offered three reading drills.** Now: a 12-bar shuffle in D
and an 8-bar oom-pah in C, **both on no rung before**, and a 12-bar walking bass in D (also on
`jam.6`) — levels 4.1–4.5, inside the band. The reason is the lesson itself: it teaches
memorising *in four-bar pieces* and *from several starting points*, and a twelve-bar is three
four-bar pieces with natural entries at bars 5 and 9. The lesson now says that in one
paragraph. The only memory-tagged items in the catalog are the two Simon drills; Simon trains
holding a chain in the ear, which is adjacent but not this skill, so it was not used.

**Two lab buttons explained.** `rock.6`: the minor-vamp preset gives the arpeggio "a floor".
`jam.6`: the blues preset **walks a bass line itself** (its left hand is locked to `walking`,
its key is not), so the lesson says to set it to E, A or D, hear a chorus of its line, then
play your own — which is what the button was for and nothing said.

**`rock.7`'s span.** The brief said the lesson did not argue for it. **It did** — "The exercises
are small and the pieces are not" (line 32). What was missing was the link to the band; one
clause adds it. `rung_audit.py` still reports the span, because it cannot read prose.

**`pdmx.json`.** Done before the commit of this period: the 8,186-line diff was key order and
`160.0` rewritten as `160`; rewritten in the committed order and number format it is 17
lines, values checked identical. `CLAUDE.md` records the cause.

**Faults caught by tests, both mine.** `hymns` named three pieces its rung no longer offers —
`lessonClaims.test.ts` accepts a pointer to the Library, not to another rung, and the fix was
to add the (true) Library pointer. `4.7` and `jam.6` grew past 400 words and their stated
reading time was wrong.

**Verification.** `build.py --offline` (its one failure the ladder report, stale because the
curriculum changed; regenerated) · `validate.py` OK at 2,053 items · `rung_audit.py` **0 HIGH,
31 MED, 1 LOW, 12 INFO** · unit **2,233 passed** · `tsc -b` 0 · lint 0. Browser tests not run
for this chunk — it changed content and lesson prose, no code.

**Files.** `content/curriculum/stage-3.json`, `stage-4.json`; lessons `rock.4`, `4.7`, `hymns`,
`rock.6`, `jam.6`, `rock.7`; `docs/generated/ladder.md`.

---

### Entry 21 — T1b: jazz.4, rock.3, holiday.2 and holiday.4 (2026-09-19)

**Judgement.** Four rungs from music already in the catalog. `jazz.4` is new; `rock.3` is
`rock.overview` narrowed; `holiday.2` is the existing `holiday` rung re-scoped from 29 songs
to six; `holiday.4` is new. Ids of the two existing rungs are **kept** (`rock.overview`,
`holiday`), as `build/genre-plan.md` specifies, so saved progress and `rock.4`'s prerequisite
do not move. **Nothing here has been played or heard.**

**Evidence lines.** `<id> → <rung> | fields read from the built catalog | why`

*jazz.4* (Stage 4, after `blues-boogie.4.1`; band 2.74–4.5; `requires.chordSymbols`)
- `exercise.comping.f.charleston.intro` → jazz.4 | key −1 (F), 4/4, 2 staves, 4 bars, symbols C F Gminor | triads only, the Charleston rhythm; on no rung before
- `exercise.comping.f.off-beats.intro` → jazz.4 | same fields | the off-beat rhythm on the same three chords; on no rung before
- `exercise.comping.f.four-on-the-floor.intro` → jazz.4 | same fields | four to the bar; on no rung before
- `exercise.rhythm.shuffle-eighths.4bar` → jazz.4 | 4/4, 1 staff, 4 bars, swung mark, no symbols | swung eighths alone; moved down from jazz.5
- `song.pop.avalon.pdmx` → jazz.4 | −1, 2/2, 1 staff, 33 bars, 22 symbols (C7, B♭m6 …), ends F | a lead sheet in the exercises' key; moved from jazz.5
- `song.pop.whispering.pdmx` → jazz.4 | −3, 4/4, 1 staff, 48 bars, 37 symbols (Cm7 …), ends E♭ | lead sheet, level 3.34; moved from jazz.5
- `song.pop.margie.pdmx` → jazz.4 | −1, 4/4, 1 staff, 48 bars, 50 symbols, **ends on C** | lead sheet, level 3.51; moved from jazz.5. The key is **not confirmed** (one flat, ends on the dominant), so the lesson claims only "the same one flat"

`jazz.5` keeps four songs and five exercises; its band narrows to 3.25–5.2 at the low end and
its lesson points the three 1920 tunes to the Stage 4 rung and the Library. **Trading fours,
the third thing the brief lists for jazz.4, is not taught**: it needs T2's mode, which does
not exist. The lesson does not mention it.

*rock.3 = `rock.overview`* (Stage 3; band unchanged 2.5–5.1)
- concepts **13 → 1** (`reduction`). The other twelve are taught on `rock.4`–`rock.7`, checked per concept; the only consumers of a rung's concepts are `validate.py`'s orphan check (every dropped concept is still taught elsewhere) and the Skills screen's stage list, where Stage 3 correctly disappears from those twelve
- `song.folk.scarborough-fair.pdmx` → rock.overview | +2, 3/4, 1 staff, 19 bars, 13 symbols (Em D G A B), ends on E, C♯ in the tune | a lead sheet: the learner supplies bass and texture, which is the reduction itself. **E Dorian**, read from the notes
- kept `song.classical.ode-to-joy.full` | 2 staves, symbols C and G only; left hand read bar by bar — **plain roots, one or two per bar** | melody and bass given, the texture is the learner's
- kept `song.folk.greensleeves.chords` | 2 staves, 15 symbols; left hand read — **block triads in half notes** | all three layers given, one too full
- kept `song.classical.pachelbel-canon-d.easy` (5.1) and the three exercises

The old lesson said *Ode to Joy* "is a melody with nothing under it"; **false** — it has a
bass. Its five stage numbers were stale (ostinato "Stage 6", now `rock.4` at 4; arpeggio
"Stage 7", now `rock.6` at 6; building "Stage 8, classical track", now `rock.7` at 7). All
corrected. `rock.4`'s opening line ("named five textures and showed you what they sound
like") now says what the rung before it does. MED remains: **6 of 7 options shared** — the
point of the rung is doing a different thing to familiar material, so the sharing is kept.

*holiday.2 = `holiday`* (Stage 2; band **1.2–7.3 → 1.2–3.2**; concepts carols, hands-together, chord-symbols)
- `song.holiday.jingle-bells.rh` → holiday | C, 4/4, 1 staff, 8 bars, judged 1.2 | the first carol
- `song.holiday.jingle-bells.ht` → holiday | C, 4/4, 2 staves, symbols C F G; left hand read — **single roots**, not chords | the lesson says roots
- `song.classical.1818-franz-xaver-gruber-silent-night.pdmx` → holiday | C, **6/8**, 1 staff, 12 bars, C F G G7 | primary chords; the 6/8 is explained in one sentence
- `song.pop.misc-christmas-traditional-music-jolly-old-saint-nicholas.pdmx` → holiday | B♭ (−2), 2/4, 1 staff, 16 bars, no symbols | a tune alone, with flats
- `song.pop.misc-christmas-good-king-wenceslas.pdmx` → holiday | G, 4/4, 1 staff, 13 bars, 30 symbols incl. Em D7 B7 | easy tune; the lesson says to play only the chords you know
- `song.classical.1863-rev-john-henry-hopkins-we-three-kings-of-orient-are.pdmx` → holiday | E minor, 6/8, 1 staff, 17 bars | the minor carol
- **rejected** `song.pop.misc-christmas-traditional-music-up-on-the-housetop-gw.pdmx` | symbols Am7 Bm7 C♯dim | beyond the three chords the rung teaches
- exercises `exercise.coordination.c.hold` (2.1, left hand holds), `drill.chord.c-f-g` (2.3), `exercise.cadence.c.root` (3.2) — the band's top is the cadence
- dropped exercises: `drill.chord.symbol-flash` (still on six rungs), `exercise.loop4.c.root` and `.f.root` (level 4.4; on no rung now, still reachable by `four-chord-loop`, taught on `hymns.2`, `chords-pop.6`, `chords-pop.8`)

*holiday.4* (Stage 4, new, after `jazz.4.1`; band 3.6–4.94; `requires.staves: 2`)
- `song.pop.misc-christmas-silent-night.pdmx` → holiday.4 | C, 3/4, 2 staves, 24 bars; left hand read — **a broken triad in nearly every bar** | block it the second time: device three
- `song.folk.we-wish-you-a-merry-christmas.pdmx` → holiday.4 | F, 3/4, 2 staves, 17 bars; left hand — **held two-note chords** most of the way | break them: device three
- `song.folk.deck-the-halls.pdmx` → holiday.4 | C, 4/4, 2 staves, 16 bars; left hand — **a bass line**, chords only in bars 4 and 8 | device two
- `song.classical.away-in-a-manger.pdmx` → holiday.4 | F, 3/4, 2 staves, 17 bars; **four voices, two per staff** | the chorale the plan asked for; the lesson says leave the parts and add only the low octave
- **rejected** `song.folk.petit-papa-noeil.pdmx` | C, but the last bass note is **G** | ends off the tonic; not safe without hearing it
- exercises `exercise.accompaniment.broken.c-major.both`, `…broken.f-major.both` (3.6, the carols' two keys), `exercise.oompah.f.octave` (4.2). The oom-pah is a low bass then the chord an octave up — **not** an octave in the bass, and the lesson says it is the jump that device needs, not the device. The plan's ids `broken.c.left` and `alberti.g.both` **do not exist**; the real ids are `…c-major…`, `…g-major…`
- tools: lab `ballad` (key unlocked, left hand broken, no tune) and Free play. Two lab buttons on one rung would share the DOM id `lesson-tool-lab`, so only one; Duet was not used because it would score an added octave as a wrong note

**A fault I made and caught.** Re-scoping `holiday` took 14 carols off every rung, and I told
the lesson they were "under *Holiday* in the Library" having checked the catalog **before**
the rebuild. `build.py`'s `attach_rung_tracks` gives a song its genre track **from the rung
it sits on**; after the rebuild 13 of the 14 had lost `holiday`. Fixed at the source: each of
the 13 rows in `content/sources/pdmx.json` now states `tracks: [<its bucket track>, "holiday"]`,
the field `import_pdmx.py` already honours (five rows used it). Text splice, 65 lines added,
13 `}` → `},`. After the rebuild **all 29 former holiday songs carry `holiday`**, and the
Library filter reads `item.tracks` (`LibraryScreen.ts:105`). This was the checklist's item 7:
I grepped the readers of `concepts` and not of `songOptions`.

**Carols on no rung now** (Library, *Holiday* filter): O Holy Night (3.4), God Rest Ye (2.87),
O Christmas Tree (3.38), Angels We Have Heard on High (3.49), Up on the Housetop (2.87), Let It
Snow (3.24), Petit Papa Noël (3.76), Hark! jazz lead sheet (5.4), Mary Did You Know? (5.81),
Carol of the Bells (Shchedryk, 6.1), O Holy Night solo (6.85), Happy Xmas (7.05), We Wish You
solo (7.06), Joy to the World solo (7.3). The plan homes God Rest Ye and Let It Snow on
`holiday.3` and the level-5-and-up carols on `holiday.5`/`holiday.6`, which do not exist.
`holiday.3` was **not** changed: it is outside T1b. *Carol of the Bells (easy)* is still on core
`4.6`.

**Specs changed with the code.** `docs/02` §A said the holiday songs are one of three list
rungs "by nature" that "stay so"; it now says two, with the reason. The Plan screen groups a
track by its unit count, so holiday moves from *Mini-modules* to *Style ladders* on its own.

**Claims under test.** 16 rows and 2 comparisons for jazz.4, 4 for rock.overview, 18 rows
and 2 comparisons for holiday and holiday.4. They run inside existing tests, so the count
stayed 2,233; **four mutations were run** (a jazz.4 key, a holiday key, a holiday.4
comparison, a rock.overview staves claim) and each failed naming its own claim.

**Verification.** `build.py --offline` · `ladder_report.py` · `validate.py` OK at 2,053 items ·
`rung_audit.py` per rung: jazz.4, holiday, holiday.4, holiday.3 no findings; rock.overview 1
MED (above) · whole audit **0 HIGH**, 29 MED, 1 LOW, 12 INFO · unit **2,233 passed** · `tsc -b`
0 · lint 0 · `lesson-tools.spec.ts` 3 passed (it opens `chords-pop.3`, not these rungs).

**For the reviewer: what re-reading the lessons against the scores caught.** Sixteen false or
stale statements, all corrected before this entry: jazz.4 "Margie is the longest" (it ties
Whispering at 48 bars); rock.overview Ode to Joy "has nothing under it" (it has a bass), five
stale stage numbers, a Dorian/Aeolian conflation, "bar 7" (file numbering, pickup unknown),
"one root per bar", "a triad under every bar", "three things, not five"; rock.4's opening
line; holiday Jingle Bells "chords" (single roots); holiday.4 Silent Night "every bar", We
Wish You's held chords, Deck the Halls "bass line rather than chords", "the last verse" (each
arrangement is one verse), device two's beat, and the oom-pah "jump device two needs". The
session's report also miscounted these as eight and the claims as 40 (42). **Worth a second
reader on every lesson in this entry**, since that many first-draft faults means more may remain.

**Saved progress.** A rung's completion is recomputed from pass records against its *current*
options (`selectors.ts` `lessonComplete`), and prerequisites gate on it (`prerequisites.ts:75`).
So a rung completed only with an option that has since left it shows incomplete again, and what
it gates locks: `holiday` (23 songs and 3 exercises left), `jazz.5` (three songs and an
exercise), and — from Entry 20, not noted there — `hymns` (four songs), `rock.4` and `4.7` (all
exercises replaced). Not changed: keeping a pass that no longer names a current option is a
feature decision, and the owner's records were not inspected.

**Unverified.**
- **Whether any of the four lessons teaches.** No check can decide it.
- **Every piece, unheard.** In particular: *Silent Night*'s arrangement puts A minor under bars 7–8 and 19–20 where the tune usually has the tonic; *Margie*'s key; *Away in a Manger*'s four voices read as a setting of Kirkpatrick's *Cradle Song* from the first bars only.
- **6/8 at Stage 2.** Two of the six carols are in 6/8, which core does not teach until 4.5. One sentence of the lesson handles it; whether that is enough is a judgement.
- **The holiday.4 lab button** has not been seen on that rung's page; the code path is the one five other rungs use and one spec covers.
- **The level estimates**: all the carols but the two *Jingle Bells* are estimated, not judged.

**Files.** `content/curriculum/stage-2.json`, `stage-3.json`, `stage-4.json`, `stage-5.json`;
lessons `jazz.4` (new), `jazz.5`, `rock.overview`, `rock.4`, `holiday`, `holiday.4` (new);
`content/sources/pdmx.json`; `app/tests/unit/lessonClaimsAboutMusic.test.ts`;
`docs/02-curriculum.md`; `docs/generated/ladder.md`.

---

### Entry 22 — T3: Simon seeded from the blues scale, and the blue note's spelling (2026-09-19)

**Built.** `drill.ear.simon-blues-c` (static catalog, level 3.5 `estimated`, opens on *keys
after a miss*): Simon's chain drawn from the C blues scale, C4–C5. Offered on `blues.3` and
`improv.5` as an exercise and named on their Simon button (`tools[].item`). Catalog `steps`
may now be interval names (`P1 m3 P4 A4 P5 m7`), no schema change (the schema constrains
only `help`). The card names notes from the scale's spelling (`SimonDrill.nameOf`); the staff
is written in the tonic's minor key with each black key spelled as the scale spells it
(`answerSheet` `spelling`, writer `blackKeys`). Today's door still chooses by stage.
`validate.py` `tool_errors` now checks a Simon tool's item against the rung's **exercises**
(it checked songs only).

**Rejected seeds, and why.** The **clave** is a rhythm with no pitches; Simon's chain is
judged by pitch and cannot hold it — the rhythm tap-back is the drill that fits, so the clave
**does not fit the chain model** and was not forced into it. **Guide tones over a
two-five-one** mean something only with the chords sounding under them; Simon plays single
notes. A **gospel walk-up** is a fixed figure; a chain drawn at random from its notes is not a
walk-up. `improv.5` asked for the blues scale, which is what was built.

**The blue note's spelling — owner's decision.** Two decisions in the repository
contradicted each other: `make_blues_scale` and the lessons `blues.4` and `improv.5` (from
2026-09-13) wrote a **raised fourth** in every key; `BLUES_SCALE_FORMS` (2026-09-18) said
`d5`, so `exercise.pentatonic.{a,d,e}.blues` wrote E flat, A flat and B flat. The owner chose
**raised fourth in every key** (2026-09-19). Now: `BLUES_SCALE_FORMS` says `A4`;
`make_blues_scale` spells from that table (its output in the eight shipped keys is unchanged —
F♯ C♯ B D♯ G♯ A♯ E A — but by this file's choice rather than music21's); the three pentatonic
blues exercises change to **D♯, G♯, A♯**; Simon names the note F♯. `blues.3`'s lesson says F
sharp, as it did. During the session I first built a hybrid (flat fifth except in F, B♭, E♭)
before finding the lessons that explain the other rule — that version never shipped.

**Tests, each proven red.** Python: the blue note is a raised fourth in all twelve keys of
`make_blues_scale` and in the three pentatonic blues (red with `d5`); `tool_errors` accepts a
Simon item among exercises and refuses one that is not (2 of 3 red against the old rule; the
third guards Duet and passes both ways). Unit (`simonDrill.test.ts`, 7 new): pool, names
(F♯4 in C, D♯5 in A, B♯4 in F♯), staff with E♭ F♯ B♭ on one line, agreement with the built
`exercise.blues-scale.c` score, rung wiring — mutations of `nameOf`, the pool, the staff's
signature, its per-key spelling, the catalog parser and the rung tool each fail a test.
Browser: `lesson-tools.spec.ts` — `blues.3`'s Simon opens the blues Simon (red without the
LessonScreen change); `drills-review.spec.ts` — the card names F♯4, E♭4, B♭4 over their keys.
**That browser test cannot catch a naming break in C**, where the plain labels happen to
agree; the A-key unit test carries it. Not proven red: `spellInterval`'s general test.

**Verification.** `build.py --offline`, `ladder_report.py`, `validate.py` OK at 2,054 items;
harmony-family tests 129 OK; unit 2,239; `tsc -b` 0; lint 0; Playwright one at a time:
`drills-review` 44 then its Simon subset 11, `drills` 27, `drills-harmony` 7, `doors` 22,
`lesson-tools` 4. A screenshot of the staff at the eighth note was read (C minor signature,
the blue note with its accidental); it was taken before the spelling decision and showed G♭,
and **was not retaken after** — the staff's F♯ is proven in the MusicXML only.

**Unverified.** The chain heard as music; whether level 3.5 is right (`estimated`); whether
opening ear-first is the right default for a Stage 3 learner; the F♯ on the rendered staff
(see above). `blues.3` is 590 words (the lesson-test count), `readingTime` 3. **Correction (same day):** this
entry first said a 600-word limit was "enforced nowhere I could find". That was false. I
searched for the number 600 and not for the limit in the unit it is written in:
`app/tests/unit/lessonShape.test.ts:224` caps every lesson at three minutes at 200 words a
minute — 600 words — with a list of known-long exceptions. Found by the lesson-fix pass,
not by me. The owner has said not to worry about the limit; the test still enforces it.

**Files.** `app/src/engine/drills/simon.ts`, `fromCatalog.ts`, `answerSheet.ts`,
`app/src/engine/musicXmlWriter.ts`, `app/src/ui/screens/DrillScreen.ts`, `LessonScreen.ts`;
`content/catalog.static.json`; `content/curriculum/stage-3.json`, `stage-5.json`;
`content/lessons/blues.3.md`; `tools/content/generate_exercises.py`, `validate.py`; tests
`test_harmony_families.py`, `test_validate_tools.py` (new), `simonDrill.test.ts`,
`lesson-tools.spec.ts`, `drills-review.spec.ts`; `docs/02`, `docs/04`, `docs/generated/ladder.md`.
