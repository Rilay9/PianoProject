# Build brief, wave 1(a): correct what is wrong at HEAD (exact contracts, 2026-10-05)

Written under `briefs/wave1-contracts.md`, for the outside reviewer to read before any dispatch. Base: HEAD `a83a4167`; every builder's worktree is cut from origin's head at dispatch, and the orchestrator states that sha in the dispatch line. Every "before" block below is quoted from the file at `a83a4167` by script; if a block does not match the file byte for byte at the builder's base, that edit stops and is reported (stop condition S1).

## Decision rationale (§10b)

1. **Learner problem.** A learner following a track today meets false statements and misleading tools: crossed hands where core 4.1 promises a mirror, a "modulation" that is not one, finders that reject the rung's own models, a lab count that marks a correct walking bass half wrong, gates that measure less than their wording, rules of thumb stated as laws, technique rungs with no stop condition.
2. **Solution classes considered.** Fix each track as its record listed; fold each correction into its ability's later seam; one correction wave first, cut by independent truth and file ownership (this brief); for the premature eighths, the Joyful edition and the 4.6 gate, the three choices below.
3. **Chosen path, and why.** One correction wave, split into nine seams that each share one meaning and one verification. A wrong statement harms every learner now; none of these needs a new station, a new rung or new code beyond one generator start parameter and one catalog row.
4. **What would reverse it.** A correction that turns out to need a station its ability builds later leaves this wave and moves to that ability's seam (this happened to A1.1 and A1.2 while drafting: see "Moved out of 1(a)"). A "reviewer"-graded fact that fails its re-read at the line drops that edit.
5. **Real problem or proxy.** The proxy is "rows closed". The finish is a learner-facing fact per edit: the statement is true at HEAD or gone, the 16 contrary items start at the unison under CK-1, the modulation item sounds the lesson's pivot under CK-3, and no tool or completion claim says more than `MODE-SHEET.md` allows.
6. **Remaining uncertainty.** Nothing here has been heard; every musical statement below is a notation reading, *unverified as music*. The O Christmas Tree score fix stays gated on its source read (IM-4).

**Learner-facing claim this brief makes true.** Every sentence the edits below touch is true of the shipped material and the app as built, and says which part the app measures and which part the learner checks.

**Read by every builder, cited and not copied:** `docs/prompts/operating-procedure.md` §11, §12, §14 (the harness; the lane adds nothing to it but what each seam names); `docs/prompts/content-mistakes.md` (the entry says which items were checked); `CLAUDE.md` (the JSON round-trip hazard: splice JSON as text, never re-serialise).

## The three choices, made here

**W1, premature eighths: teach the value in one sentence where each tune first prints it (1.1 for *Hot Cross Buns*, 1.2 for *Frère Jacques*).** The lesson text in view: `1.1.md:27-29` introduces *Hot Cross Buns* as "only E, D and C" and says nothing of bar 3's eight eighths; `1.2.md:20-22` already says "an eighth note is half a quarter" but never counts one; `2.2.md` teaches counting "1 and". The tunes were chosen because the learner knows them by ear (`1.3.md:33-35`: "so your ear can tell you when your reading is wrong"), and both bars are the tune's own rhythm ("one a penny, two a penny"; "morning bells are ringing"). *Simplify the bars* loses: it prints a rhythm the learner's ear contradicts, and edits three authored scores (`hot-cross-buns.abc`, `hot-cross-buns-lh.abc`, `frere-jacques.abc`). *Move the tunes to 2.2* loses: it strips 1.1 of its three-note tune, changes 0.3's "How you'll know" (the tour piece) and seven placements (0.3, 1.1, 1.3, practice.1, practice.3, practice.4, 1.2), a larger change to fix two bars. 0.3 and 1.3 are left alone on purpose: 0.3 teaches no notation at all (it is the app tour, played as a known tune), and 1.3 plays "the same tunes you already know", after 1.1's sentence.

**W2, the 4.6 title against its gate: keep the title, reword "How you'll know".** The lesson teaches reading ahead and phrase shaping (`4.6.md:15-33`), so the title describes the lesson; what overreaches is the silence about what the gate counts. Retitling is larger: the title is quoted in `stage-4.json:476,481`, `4.6.md:2`, two code comments (`PlanScreen.ts:450`, `ShelfScreen.ts:475`), two unit tests (`planHierarchy.test.ts:67`, `shelfRanking.test.ts:47,166`) and `docs/02-curriculum.md:399`. A measured read-ahead item was the third option; it needs a station (the daily read is the only unseen reading the app judges) and belongs to A1.2 or A4.1, not to a correction.

**W14, the hymns.2 Joyful edition: replace it with a shipped correct single-line edition, `song.classical.ode-to-joy.rh`.** Checked in `app/public/content/catalog.json`: the tune of *Joyful, Joyful, We Adore Thee* is Beethoven's *Ode to Joy* melody; `song.classical.ode-to-joy.rh` is a right-hand-only edition of its first eight bars (C major, 8 bars, level 1.1), with correct pitches and the cadence bars 4 and 8 simplified to two half notes (`WAVE1-FACTS.md` Part 2 §2). The other Joyful edition, `song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx`, is two-staff at level 5.36, too hard for Stage 2. Labelling the flattened edition loses: the rung's job is putting chords under a tune, and a learner would harmonise a melody with its third lowered. Dropping it loses a fourth option for nothing. IM-5 (a full single-line edition with F sharp) stays a later candidate. The flattened PDMX file stays in the Library; whether it should be retired there is a catalog decision recorded below, not made here.

## Seams, file ownership and dispatch

| Seam | Meaning shared | Files it may touch (and only these) |
| --- | --- | --- |
| 1a.1 Core lessons | W1, W2's lesson half | `content/lessons/0.1.md`, `1.1.md`, `1.2.md`, `4.6.md`, `4.7.md`; `content/curriculum/stage-4.json` (lesson `4.7`, the `unjudged` requirement's `says` only) |
| 1a.2 Practice and technique lessons | W3, W5, A9.1 | `content/lessons/practice.3.md`, `technique.4.md` (not lines 26-30), `technique.5.md`, `technique.6.md`, `technique.7.md` |
| 1a.3 Classical and ragtime lessons | W6, W10 | `content/lessons/classical.3.md`, `classical.5.md`, `classical.6.md`, `classical.8.md`, `ragtime.5.md`, `ragtime.6.md`, `ragtime.7.md` |
| 1a.4 Blues, jazz and jam | W8, W9, W18, C2 (blues.8's Blind target) | `content/lessons/blues.4.md`, `blues.6.md`, `blues.7.md`, `blues.8.md`, `blues.9.md`, `jazz.6.md`, `jazz.7.md`, `jazz.8.md`, `jam.md`, `jam.5.md`, `jam.6.md`, `jam.7.md`; `content/curriculum/stage-8.json` (unit `blues.8.1` title; lesson `blues.8` title, `tools`, `finder.skill`, `finder.levelWords`); `docs/02-curriculum.md:523` |
| 1a.5 Theory and improv | W11's text half, W12, W13 (as CT-1) | `content/lessons/theory.3.md`, `theory.4.md`, `theory.5.md`, `theory.6.md`, `theory.7.md`, `theory.9.md`, `improv.4.md`, `improv.5.md`, `improv.6.md`, `improv.7.md`, `improv.8.md`, `improv.9.md`; `content/catalog.static.json` (row `drill.ear.rhythm-dictation`, `title` only); `content/curriculum/stage-4.json` (lesson `improv.4`, `says`); `stage-6.json` (lesson `improv.6`, `tools` and `requirements`); `stage-7.json`, `stage-8.json`, `stage-9.json` (lessons `improv.7`, `improv.8`, `improv.9`, `requirements` only) |
| 1a.6 Chords-pop, hymns, holiday, latin, rock lessons | W7's text half, W14, W15's text half, W16 (with the three Cuban-term corrections, Edits 26-28), W17's text half | `content/lessons/chords-pop.4.md`, `chords-pop.5.md`, `chords-pop.7.md`, `chords-pop.8.md`, `hymns.md`, `hymns.2.md`, `hymns.5.md`, `holiday.3.md`, `holiday.5.md`, `latin.md`, `latin.3.md`, `latin.7.md`, `rock.4.md`, `rock.5.md`, `rock.7.md`; `content/lessons/latin.6.md` (the montuno-study sentence, Edit 26); `content/curriculum/stage-2.json` (lesson `hymns.2`, `songOptions` only); `content/curriculum/concepts.json` (the `montuno` finder only, Edit 28); `tools/content/generate_exercises.py` (`write_montuno`'s and `make_montuno`'s docstrings, `make_montuno`'s and `make_latin_groove`'s title lines only, Edit 27) and the generated montuno and latin-groove scores and catalogue entries it rewrites (titles only); `docs/02-curriculum.md:1204` |
| 1a.7 Stage data: finders, a prerequisite, track names | W7's data half, W2's data half, W14's rename, W17's count | `content/curriculum/stage-7.json`, `stage-8.json`, `stage-9.json` (lessons `chords-pop.7`, `.8`, `.9`, `finder` only); `stage-4.json` (lesson `4.7`, add `prerequisites`); `stage-3.json` (unit `hymns-gospel.3.1` title); `content/curriculum/00-tracks.json` (rows `hymns-gospel` and `rock-metal`); `docs/02-curriculum.md:705,1203` |
| 1a.8 The modulation row | W11's data half | `content/catalog.static.json` (row `drill.theory.harmonic-dictation-modulation`, `drill.params.progressions[1]` only); one new unit test; its record lines |
| 1a.9 Contrary scales | W4 | `tools/content/generate_exercises.py` (`make_scale` only), `tools/content/family_contracts.json` (the `scale` row's version), `tools/content/generator_continuity.json`, `tools/content/requirements.txt` (one pin), `content/lessons/technique.4.md:26-30`, one new test under `tools/content/tests/`, the CO-1 export |
| Scores | none dispatched | O Christmas Tree bar 32 is gated (IM-4, below). The 12 Bar Blues re-role is carried by 1a.4's blues.4 sentence and its record line; there is no catalog role field to edit (checked: the 425 audit's `REPLACE_FILE` lives only in `docs/prompts/runs/restart-2026-10-05/Curriculum_425_Placement_Audit.csv:225`, a dated record that is superseded, not edited) |

**Files no seam may touch:** the app code under `app/src/`, every authored or imported score, `app/public/` (built), `docs/review/pdmx-dump-2026-10-05/`, the dated audit CSV, other lessons, other stage-JSON lesson blocks.

**Shared files.** `stage-4.json` (1a.1, 1a.5, 1a.7), `stage-8.json` (1a.4, 1a.7), `stage-7.json`, `stage-9.json` (1a.5, 1a.7), `catalog.static.json` (1a.5, 1a.8), `technique.4.md` (1a.2, 1a.9), `docs/02-curriculum.md` (1a.4, 1a.6, 1a.7), `generate_exercises.py` (1a.6 the montuno and latin-groove docstrings and titles; 1a.9 `make_scale` only): every shared file is edited in disjoint blocks. **Dispatch:** seams 1a.1 to 1a.8 go to one narrow ruled builder in one worktree, one seam at a time in the order above, each seam's diff and verification reported separately so the reviewer can read each against its contract; 1a.9 goes to a second builder in its own worktree, cut after 1a.2 has merged (they share `technique.4.md`). No two builders hold one file at once. **Amended 2026-10-05 (reviewer ruling `docs/review/responses/5831d42d.md`):** seam 1a.6 was held until the three Cuban-term corrections were in its exact edits and file list; they are (Edits 26-28), so 1a.6 may dispatch with 1a.1 to 1a.5 in the stated sequence, and 1a.7 and 1a.8 follow once the sequential builder holds this corrected 1a.6 contract.

**Verification common to every lesson and data seam** (by what the seam touches; `CLAUDE.md` commands, from `app/`): `npm run content:build` (it runs `tools/content/validate.py`, which refuses a tool `item` that is not the rung's own option and an `unlock` its preset never locked); `npx vitest run` after the content build (lesson tests read built content); `npx tsc -b`; `npm run build`; `py -3.11 tools/content/lint_absolutes.py --lesson <id>` for every changed lesson, reporting any absolute word an edit introduces (it never fails; a new "always", "never", "only", "every", "all" is justified in the entry or removed). A browser spec only where a screen changes, named per seam. Before editing, grep `app/tests`, `app/src` and `docs/` for every quoted "before" phrase; a test or doc that asserts the old text is updated in the same seam with the reason beside it, or the edit stops (S3).

**Record lines every seam adds:** one `docs/pending-review.md` entry per seam (what changed, each edit's evidence line, the content-mistakes items checked, what was not done), and a `docs/08-test-map.md` row only where a test is added or changed.

**Stop conditions common to every seam.** S1: a "before" block does not match the file at the base. S2: a fact this brief marks *re-read* fails its re-read (the script or the line says otherwise). S3: a test, a validator rule or a doc asserts the old text and the reason to change it is not plain. S4: a change would touch a file outside the seam's list. On any stop: leave that edit undone, finish the others, say which and why.

---

## Seam 1a.1: core lessons (W1, W2)

**Claim made true.** A Stage 0-1 learner is told how to sit and when to stop without a false or unmeasurable test; meets eighth notes in *Hot Cross Buns* and *Frère Jacques* with a sentence that says how to count them; and at 4.6 and 4.7 reads what the app measures and what is theirs to check, with one threshold for the blind run.

**Edit 1 (W1, 0.1 seating; core#11).**

`content/lessons/0.1.md:21-23` at HEAD:

```text
**Sit far enough back.** Roughly a forearm's length from the keys. You should be
able to reach both ends of the keyboard by leaning from the hips, not by
shuffling.
```

After:

```text
**Sit far enough back.** Many teachers start you on the front half of the
bench, both feet flat on the floor (on a box if they do not reach), roughly a
forearm's length from the keys. You should be able to lean towards the high and
low notes from the hips without your arms locking straight.
```

Why: "reach both ends of the keyboard by leaning from the hips" is not true of an 88-key instrument; feet and front-of-bench seating were missing (`core.md` record §5, `0.1.md:21-23`; Faber Primer guide, summary only, hence "many teachers").

**Edit 2 (W1, 0.1 hand shape).**

`content/lessons/0.1.md:25-26` at HEAD:

```text
**Curved fingers.** Let your hand hang by your side and notice its natural
shape — slightly curled, thumb relaxed. That shape is what goes on the keys. The
```

After:

```text
**Curved fingers.** Let your hand hang by your side and notice its natural
shape — slightly curled, thumb relaxed. That shape is the starting point on the keys; it changes as you play, and it should. The
```

(Line 27 continues "usual image is *holding a bubble*" unchanged.)

Why: a fixed shape stated as the rule, against the dossier's flexible hand (`core.md` record §5).

**Edit 3 (W1, 0.1 pain rule).** Insert after line 32 (the end of the "Shoulders down" paragraph), as a new paragraph:

```text
**Pain means stop.** If your hand, wrist, forearm or shoulder hurts while you
play, stop for the day. Pain is never something to play through; *When to stop*
in the practice track says more.
```

Why: no pain rule in Stage 0 (`core.md` record §3 item 7); `practice.4.md` is titled "When to stop — warm-up, tension and pain" and the practice track is on by default (`00-tracks.json`, `defaultActive: true`).

**Edit 4 (W1, 0.1 common mistake).**

`content/lessons/0.1.md:43-45` at HEAD:

```text
**Common mistake.** Flat, straight fingers. They look relaxed, but the curved
shape above often makes it easier to play two notes at different volumes. If your
fingers straighten out, stop and reset the hanging-hand shape.
```

After:

```text
**Common mistake.** Fingers that lock straight, or a hand that collapses at the
knuckles. If that happens, stop, let the hand hang by your side again, and start
from that shape.
```

Why: "often makes it easier to play two notes at different volumes" has no source (`core.md` record §5: "the least supported line in Stage 0").

**Edit 5 (W1, 0.1 self-check).**

`content/lessons/0.1.md:47-49` at HEAD:

```text
**How you'll know you've got it.** You can press a key slowly enough to make no
sound at all, then release it, without your wrist moving. That takes control,
not strength — and it is only possible from a balanced hand.
```

After:

```text
**How you'll know you've got it.** You can sit down, put a hand on the keys and
play a slow five-note walk with your shoulders down, your forearm level and your
wrist neither dropped nor raised — and nothing aches. That is yours to check:
the app cannot see how you sit.
```

Why: the silent key press is unmeasurable and depends on the instrument's action (`core.md` record §5, §7 (a)).

**Edit 6 (W1, 1.1 eighths; core#2).**

`content/lessons/1.1.md:26-30` at HEAD:

```text
**What to do at the piano.** Play the five-finger walk up and down at 60 bpm,
one note per click, saying the letter names. Then play *Hot Cross Buns*, which
uses only E, D and C — three fingers, three notes, and the whole point is that
your hand does not move. Then *Mary Had a Little Lamb*, which
adds G, and *Ode to Joy*, which adds F and G.
```

After:

```text
**What to do at the piano.** Play the five-finger walk up and down at 60 bpm,
one note per click, saying the letter names. Then play *Hot Cross Buns*, which
uses only E, D and C — three fingers, three notes, and the whole point is that
your hand does not move. Its third bar, "one a penny, two a penny", has eight
quicker notes: **eighth notes**, two to a beat, joined in pairs by a beam. Count
"one-and two-and" there; rung 2.2 teaches eighths properly, and your ear
already knows how the bar goes. Then *Mary Had a Little Lamb*, which
adds G, and *Ode to Joy*, which adds F and G.
```

Evidence (observed, music21 over the built files): `song.folk.hot-cross-buns` bar 3 is C4 ×4, D4 ×4 in eighths; the left-hand edition (1.3) is the same; no other 0.3-1.4 core song prints a value under a beat except *Frère Jacques* bars 5-6.

**Edit 7 (W1, 1.2 opening).**

`content/lessons/1.2.md:12-14` at HEAD:

```text
So far you have counted notes that last one beat, though the tunes already
held some longer ones. Now they get names, and the shape of the note head
tells you how long.
```

After:

```text
So far you have counted notes that last one beat, though the tunes already
held some longer ones, and *Hot Cross Buns* some shorter ones. Now they get
names, and the shape of the note head tells you how long.
```

**Edit 8 (W1, 1.2 Frère Jacques).**

`content/lessons/1.2.md:46-50` at HEAD:

```text
Twinkle needs one extra thing: an A, one key above your finger 5. Move the whole
hand up a step for it and come back — the fingering marks both moves. *Frère
Jacques* needs the opposite: its last figure, "ding, dang, dong", drops to the G
*below* middle C. The fingering moves the hand down so the thumb takes that G
and finger 4 comes back to C.
```

After:

```text
Twinkle needs one extra thing: an A, one key above your finger 5. Move the whole
hand up a step for it and come back — the fingering marks both moves. *Frère
Jacques* needs the opposite: its last figure, "ding, dang, dong", drops to the G
*below* middle C. The fingering moves the hand down so the thumb takes that G
and finger 4 comes back to C. Its fifth and sixth bars, "morning bells are
ringing", start with four eighth notes, two to a beat, as in the third bar of
*Hot Cross Buns*: count "one-and two-and" through them.
```

Evidence (observed): `frere-jacques.abc` bars 5-6: `G/F/E/D/ E C`, four eighths then two quarters.

**Edit 9 (W2, 4.6 gate; core#7).**

`content/lessons/4.6.md:62-63` at HEAD:

```text
**How you'll know you've got it.** Both pieces played with **Perform** on at 90 %
accuracy at 90 % of the written tempo.
```

After:

```text
**How you'll know you've got it.** Both pieces played with **Perform** on at 90 %
accuracy at 90 % of the written tempo, and one exercise run: that is what the app
measures, and it is what marks the rung met. Reading ahead and the shape of each
phrase are yours to check — the card over the bar you are playing tests the
first, and a recording of yourself the second.
```

Evidence: `stage-4.json:506-524` (runs from exercises 1; runs from songs 2 with `performance: true`; `reading-ahead` `unjudged`); `rungState.ts:341` (an `unjudged` reading never counts, `MODE-SHEET.md` §31.7).

**Edit 10 (W2, 4.7 one threshold; core#8).**

`content/lessons/4.7.md:42-45` at HEAD:

```text
and everything else about the run is exactly the same. It is
judged the same way too, which is the point — the blind number and the sighted
number are comparable, so aim for 90 % of what you managed with the page. The
app does not make that comparison for you; the rung counts a pass.
```

After:

```text
and everything else about the run is exactly the same. It is
judged the same way too, which is the point — the blind number and the sighted
number are comparable. Aim for a blind accuracy at least nine tenths of your
sighted one: sighted 100 %, blind 90 % or better. The app does not record that a
run was blind and does not make that comparison, so both are yours to check;
the rung counts one run of a piece at 90 % accuracy and 90 % of the tempo.
```

**Edit 11 (W2, 4.7 "How you'll know").**

`content/lessons/4.7.md:56-58` at HEAD:

```text
**How you'll know you've got it.** You can start anywhere, at half tempo,
without the page — and the run scores within a tenth of your sighted one. When
it does, the piece is yours in a way it was not last week.
```

After:

```text
**How you'll know you've got it.** You can start anywhere, at half tempo,
without the page — and the blind run scores at least nine tenths of your sighted
one. When it does, the piece is yours in a way it was not last week. The app
measures each run; that the page was hidden, and the comparison, are yours to
check.
```

**Edit 12 (W2, the requirement's text).**

`content/curriculum/stage-4.json:590` at HEAD:

```text
                  "says": "From memory, starting anywhere, at half tempo, within a tenth of your sighted run.",
```

After (one line, spliced as text; `rule` at :589 is an internal id read by `validate.py` and is left as it is):

```text
                  "says": "From memory, starting anywhere, at half tempo: a blind run at least nine tenths of your sighted run.",
```

Evidence for edits 10-12: three statements of one gate, "90 % of what you managed with the page" (`4.7.md:44`), "within a tenth of your sighted one" (`4.7.md:57`), "blind at >=0.9" (`stage-4.json:589`), read at HEAD; Blind writes no `blind` field (`MODE-SHEET.md` §10). The mastery pair is `stage-4.json:577-580`.

**Verification.** The common list; no screen layout changes, so no browser spec unless the grep in S3 finds one asserting these lines.

**Acceptance for the learner.** At 0.1 nothing asks for a test the instrument decides; at 1.1 and 1.2 the eighth-note bars come with a way to count them; at 4.6 and 4.7 the page says which runs count and which parts are the learner's, and names one threshold.

**Stays self-checked, and the lesson says so:** posture (0.1), reading ahead and phrase shape (4.6), the blind run and its comparison (4.7).

---

## Seam 1a.2: practice and technique lessons (W3, W5, A9.1)

**Claim made true.** practice.3 no longer states a small, mixed research picture as law and says when the loop of practice.1 is the right tool; technique.5 and .6 credit their études only with what the notation holds; technique.7 labels the half-pedal window as the exercise's; every exercise on technique.4 to .7 has a sentence; every technique rung says when to stop and which exercises carry its promise.

**Edit 1 (W3, practice.3; practice#1).**

`content/lessons/practice.3.md:26-28` at HEAD:

```text
Come back to the hard thing twice in the session rather than staying on it. The
second visit, after something else has intervened, is where the learning
happens.
```

After:

```text
Come back to the hard thing twice in the session rather than staying on it. The
second visit, after something else has intervened, is where many players find
more of it sticks; the research on this in music is small and mixed, so treat it
as a habit worth trying, not a law.

That does not make the loop in *Chunking, and the loop* wrong. Repeating one
chunk until it comes out right is how a passage gets right in the first place;
coming back to it after something else is how it stays right. Loop it first,
then spread the repetitions out.
```

Evidence: `practice.3.md:26-28` read at HEAD; SYNTHESIS A17 (text verified; sources reviewer-graded, hence the hedge, not a counter-claim).

**Edit 2 (W5, technique.5 études; technique#4).**

`content/lessons/technique.5.md:58-60` at HEAD:

```text
**An étude to put it in.** Duvernoy's Op. 176 Nos. 4, 5 and 6 are on this
rung, in the order the collection grades them: twenty-one to thirty-one bars
each, the exercise above with a melody on it.
```

After:

```text
**An étude to put it in.** Duvernoy's Op. 176 Nos. 4, 5 and 6 are on this
rung, in the order the collection grades them: twenty-one to thirty-one bars
each, a travelling line with dynamics to shape and two hands moving at different
speeds. They hold almost no repeated notes, so the repeated-note work stays in
its drill here.
```

Evidence (observed, music21 over the built files): immediate same-pitch repeats per hand, No. 4: 2 and 1; No. 5: 0 and 3; No. 6: 4 and 0.

**Edit 3 (W5, technique.6 études; technique#4).**

`content/lessons/technique.6.md:45-48` at HEAD:

```text
**An étude to put it in.** Czerny's *School of Velocity*, Op. 299 — No. 1, No.
3 and No. 4 are here. They are what the chromatic scale and the 3:1
independence exercise are for: a page of sixteenths that stays even only if
the hand does.
```

After:

```text
**An étude to put it in.** Czerny's *School of Velocity*, Op. 299 — No. 1, No.
3 and No. 4 are here: each a page of sixteenths that stays even only if the hand
does. No. 4 carries a chromatic run of nine notes, the chromatic scale above in
a piece; none of the three has the 3:1 rhythm, which stays an exercise on this
rung.
```

Evidence (observed, music21): no tuplets in Nos. 1, 3, 4; longest semitone run 4, 3, 9.

**Edit 4 (W5, technique.7 half-pedal window; technique#5).**

`content/lessons/technique.7.md:40-43` at HEAD:

```text
they catch on your piano. This exercise opens as an ordinary score,
and its summary says what share of your pedal readings, while the pedal was
down, sat between 32 and 96 — 0 is fully up, 127 fully down. Some digital
pianos send only 0 or 127; the app says so instead of marking you down.
```

After:

```text
they catch on your piano. This exercise opens as an ordinary score,
and its summary says what share of your pedal readings, while the pedal was
down, sat between 32 and 96 — a window this exercise uses, not a fact about your
piano, on a scale where 0 is fully up and 127 fully down. Some digital
pianos send only 0 or 127; the app says so instead of marking you down.
```

**Edit 5 (W5, technique.7 "How you'll know").**

`content/lessons/technique.7.md:59-61` at HEAD:

```text
**How you'll know you've got it.** The same fingering for thirds and for
octaves in D flat twice running, without deciding it again. Two against three where you can stop anywhere and say which
hand is on the beat. And a half pedal your piano reports between 0 and 127.
```

After:

```text
**How you'll know you've got it.** The same fingering for thirds and for
octaves in D flat twice running, without deciding it again. Two against three where you can stop anywhere and say which
hand is on the beat. And a half pedal held where your ear hears the dampers
catch, with most of your pedal-down readings inside the exercise's 32–96 window.
```

Evidence: `technique.7.md:41-43,61` read at HEAD ("between 0 and 127" is every reading); the window is the exercise's (`docs/05-score-follow-engine.md:1091-1105`, per `technique.md` record §5 item 2).

**Edit 6 (A9.1, technique.4 pass line; technique#2).**

`content/lessons/technique.4.md:46-47` at HEAD:

```text
Two exercises pass this rung. Take the scales at a tempo where the thumb is
silent.
```

After:

```text
Any two exercises pass this rung; the app does not check which. The scale and
the staccato–legato pair are what the rung is for, so make them two of yours, and
take the scale at a tempo where the thumb is silent.
```

**Edit 7 (A9.1, technique.4 exercises with no sentence).** Insert after line 47 (the paragraph edit 6 rewrites), as a new paragraph:

```text
**Two more on the list.** *Hanon No. 1* is the figure core 4.4 taught — eight
notes up and back, moved up a step each bar — here as an evenness warm-up, hands
separately before together. The *chromatic scale* from C takes every key in
turn, black and white: the printed fingering puts 3 on every black key and the
thumb on most white ones, so the thumb passes on nearly every other note and
has to stay quiet doing it.
```

Evidence (observed): `exercise.hanon.01.both` bar 1 RH C E F G A G F E; `exercise.chromatic.c.1oct.both` RH fingering 1 3 1 3 1 2 3 1 3 1 3 1 2.

**Edit 8 (A9.1, technique.5).** Insert before line 58 ("**An étude to put it in.**"), as a new paragraph:

```text
**The rest of the list.** *Hanon No. 11* puts fingers 4 and 5, the weakest
pair, to work: the right hand's first bar is C E A G A G F G, fingers 1 2 5 4 5 4
3 4. The two-octave arpeggios in A flat and A, and the one-octave contrary scale
in A flat, take the Stage 4 shapes into keys where black keys move the thumb.
```

Evidence (observed): `exercise.hanon.11.both` bar 1 RH notes and fingering as quoted.

**Edit 9 (A9.1, technique.6).** Insert before line 45 ("**An étude to put it in.**"), as a new paragraph:

```text
**The rest of the list.** *7/8* is counted 2 + 2 + 3, as the score prints and
beams it: seven even eighths a bar in the right hand over a held fifth in the
left. The *sixteenth* exercise puts a sixteenth–eighth–sixteenth figure, the
middle note on the half-beat, on beat one of its first bar and again on beat
four, over a held C chord. The *chromatic scale* is two octaves now, hands
together, fingering printed. The *repeated notes* come four to a note in the
left hand, in sixteenths up a C scale: changing finger on the repeats is one way
to keep them even, as technique.5 said.
```

Evidence (observed): `exercise.meter.7-8` beams 2+2+3, text "Count 2 + 2 + 3", LH [C3 G3] held; `exercise.syncopation.sixteenth` bar 1 onsets 0, 0.25, 0.75 and 3.0, 3.25, 3.75 over [C3 E3 G3]; `exercise.repeated-notes.c.4x.left` C2 to C3, four sixteenths each.

**Edit 10 (A9.1, technique.7).** Insert before line 45 ("**An étude to put it in.**"), as a new paragraph:

```text
**The rest of the list.** The *octave tremolo* in the left hand shakes between
the two notes of an octave in sixteenths, two beats on each step of a C scale;
like the broken octaves, it is often helped by a small rotation of the forearm,
and it is the exercise here where the forearm tightens first. The *broken
dominant sevenths*, A and A flat, run each chord's four notes up and back in
sixteenths and then again an octave higher, in both hands at once.
```

Evidence (observed): `exercise.tremolo.c.left` C2-C3 ×4 then D2-D3; `exercise.broken7.a-dominant7.both` A3 C♯4 E4 G4 A4 G4 E4 C♯4, then from A4.

**Edit 11 (A9.1, stop conditions).** Insert one paragraph immediately before the "**How you'll know you've got it.**" paragraph of technique.4 (line 63), technique.5 (line 67) and technique.6 (line 57):

```text
**When to stop.** If your hand, wrist or forearm aches or tightens, stop: rest,
and come back to it slower, or another day. Pain is never something to play
through; *When to stop* in the practice track, and core 4.4, say more.
```

and before technique.7's (line 59):

```text
**When to stop.** Octaves, double notes and the tremolo are where strain gathers
fastest. If your forearm or wrist tightens or aches, stop: rest, and come back to
it slower, or another day. Pain is never something to play through; *When to
stop* in the practice track, and core 4.4, say more.
```

Evidence: a stop condition exists only at `technique.8.md:30-33` (grep scope in `technique.md` record §3 item 1); `4.4.md:32` "Never play through pain"; `practice.4.md` title.

**Edit 12 (A9.1, which exercises carry the promise; CT-1).** Append to the end of the "How you'll know" paragraph of technique.5 (line 70), technique.6 (line 60) and technique.7 (line 61, after edit 5), each one sentence:

- technique.5: `The app passes the rung on any two exercise runs and does not check which; the repeated notes, the 2:1 pair and the crescendo are what it is for.`
- technique.6: `The app passes the rung on any two exercise runs and does not check which; the seventh arpeggios, the rotation figure and the voiced chord are what it is for.`
- technique.7: `The app passes the rung on any two exercise runs and does not check which; the thirds and sixths, the octaves, the half pedal and the two-against-three pair are what it is for.`

Evidence: every technique unit requires `runs from exercises count 2` (`stage-4.json` to `stage-8.json`, read by script); `MODE-SHEET.md` R7 (`measure` 0: the technique measures gate nothing).

**Verification.** The common list. No screen changes.

**Acceptance for the learner.** On every technique rung the learner can find what each listed exercise is for, when to stop, and which exercises carry the rung's promise; no étude is credited with a skill its notes do not hold.

**Stays self-checked, and the lesson says so:** tension and ache (no actor can observe the body), the evenness the ear judges.

---

## Seam 1a.3: classical and ragtime lessons (W6, W10)

**Claim made true.** classical.5's sectioning task fits both of its sonatinas; classical.3, .6 and .8 state one method or one kind where they stated a law; ragtime.5, .6 and .7 state only what the files and sources support.

**Edit 1 (W6, classical.5; classical#1).** Re-read first (S2): `song.classical.beethoven-sonatina-in-g-major-ahn-5.pdmx` bars 17-24 equal bars 1-8 in both staves (observed by script on 2026-10-05: all eight equal).

`content/lessons/classical.5.md:26` at HEAD:

```text
Before you play a note of one, mark the three sections on the page.
```

After:

```text
Before you play a note of one, mark its sections on the page. Clementi's first
movement has all three: exposition bars 1–15, development 16–23, recapitulation
24–38. This edition of the Beethoven is simpler — a tune (bars 1–8), a
contrasting passage (9–16), the tune again note for note (17–24) and a closing
section (25–34) — so it shows that a sonatina need not have a development.
```

Evidence: Clementi bar ranges from `classical.md` record §4 item 1 (high confidence, read from the file); the Beethoven repeat observed as above.

**Edit 2 (W6, classical.6 rubato; classical#9).**

`content/lessons/classical.6.md:30-33` at HEAD:

```text
so the bar comes out the same length. If your bars are getting longer, that is
not rubato, that is hesitation. The test for this kind of rubato: play with the
metronome on. The accompaniment still lands with the click; with hesitation, it
does not.
```

After:

```text
so the bar comes out the same length. If your bars are getting longer without
your choosing it, that is hesitation, not this kind of rubato. (There is another
kind, where the whole bar stretches and the beat itself bends; it is a choice,
not a stumble.) The test for this kind of rubato: play with the
metronome on. The accompaniment still lands with the click; with hesitation, it
does not.
```

**Edit 3 (W6, classical.8 speed; classical#9).**

`content/lessons/classical.8.md:24` at HEAD:

```text
**Speed is built from accuracy, not approached from slowness.** The method that
```

After:

```text
**Speed is built from accuracy, not approached from slowness.** One method that
```

(Line 25 continues "works: play a short figure ..." unchanged.)

**Edit 4 (W6, classical.8 cross-rhythm; classical#9).**

`content/lessons/classical.8.md:39-42` at HEAD:

```text
**Cross-rhythm.** When a piece puts a two-beat melody over a three-beat bass
and keeps it there, do not try to work out where the notes coincide; learn
each hand until it is independent, then put them together and let them
disagree. Counting will not save you, and it is not supposed to.
```

After:

```text
**Cross-rhythm.** When a piece puts a two-beat melody over a three-beat bass
and keeps it there, many players first work out slowly where the notes fall
against each other, then stop counting: learn each hand until it is independent,
then put them together and let them disagree. The counting gets you started;
the independence is what plays it.
```

**Edit 5 (W6, classical.3 K. 331; classical#9).**

`content/lessons/classical.3.md:46` at HEAD:

```text
Then the theme of Mozart's K. 331, set here in C major in 3/4, a minuet-length
```

After:

```text
Then the theme of Mozart's K. 331, set here in C major in 3/4 (Mozart wrote it in A major, in 6/8), a minuet-length
```

**Edit 6 (W10, ragtime.5 oom-pah counting; ragtime#4).**

`content/lessons/ragtime.5.md:14-16` at HEAD:

```text

**The oom-pah left hand.** Bass note on beats 1 and 3, chord on beats 2 and 4,
in 2/4 or 4/4. The bass note is usually the root or the fifth, an octave or a
```

After:

```text
**The oom-pah left hand.** In 4/4 the bass note falls on beats 1 and 3 and the
chord on 2 and 4; in 2/4, the way most rags here are written, the bass falls on
each beat and the chord on each "and", in eighths. The bass note is usually the
root or the fifth, an octave or a tenth below the chord, so the hand leaps back
and forth on every quarter of the bar. Those
```

(Line 17 continues "leaps are the technical problem ..." unchanged.)

Evidence: `ragtime.md` record §5 item 2 (Entertainer bar 5 LH C3, G3+C4, E3, G3+C4 in eighths).

**Edit 7 (W10, "Not fast"; ragtime#4).** The record's premise was narrower than it read: by script over the built files on 2026-10-05, six Joplin editions in the catalog carry "Not fast." (`joplin-breeze-from-alabama`, `-easy-winners`, `-something-doing`, `-sunflower-slow-drag`, `-weeping-willow` in the file's title line; `joplin-entertainer.alt` as a printed direction), and `OsmdView.ts:173` sets `drawTitle: false`, so a title line is not drawn on the Score screen. The record scanned 27 dumps and found it only on Frog Legs. What is false is "print ... at the head of the music" for what the learner sees; what is true is that Joplin wrote it.

`content/lessons/ragtime.5.md:28-30` at HEAD:

```text
**"Not fast."** Several of the Joplin editions bundled here print exactly that
at the head of the music — not the copy of *The Entertainer* on this rung,
which is marked *Moderato*, but the instruction is the same one. It is the
```

After:

```text
**"Not fast."** Joplin wrote that at the head of many of his rags — the copy
of *The Entertainer* on this rung is marked *Moderato* instead, but the
instruction is the same one. It is the
```

**Edit 8 (W10, ragtime.6 "no other cause").**

`content/lessons/ragtime.6.md:55-56` at HEAD:

```text
five clicks at a time. If you are missing leaps at speed, you took it up too
fast; there is no other cause.
```

After:

```text
five clicks at a time. If you are missing leaps at speed, try a slower tempo
first, then check where your eyes are going, as above.
```

**Edit 9 (W10, Bethena keys).** Re-read (observed by script on 2026-10-05): `song.ragtime.joplin-bethena` signatures at bars 1, 29, 53, 77, 102, 141 are 1, -2, 1, -1, 2, 1 (G, B flat, G, F, D, G).

`content/lessons/ragtime.7.md:30-31` at HEAD:

```text
- ***Bethena*** is a concert waltz in 3/4 with five strains, each in a different
  key. The syncopation is gentler; the reading is harder.
```

After:

```text
- ***Bethena*** is a concert waltz in 3/4 with six sections in four keys, G
  coming back between B flat, F and D. The syncopation is gentler; the reading is harder.
```

**Edit 10 (W10, "single most characteristic").**

`content/lessons/ragtime.7.md:39-40` at HEAD:

```text
and learn it as a shape. It is the single most characteristic ragtime
device and it is what makes the style sound like it is falling forwards.
```

After:

```text
and learn it as a shape. It is one of the most characteristic ragtime
devices, and it is what makes the style sound like it is falling forwards.
```

**Verification.** The common list. No screen changes.

**Acceptance for the learner.** A learner marking sections finds what the lesson says is there; no lesson tells them a counting method, a speed method or a cause is the only one; the Bethena and oom-pah facts match the page.

**Stays self-checked, and the lesson says so:** the rubato test (already the learner's), the cross-rhythm work.

---

## Seam 1a.4: blues, jazz and jam (W8, W9, W18, C2)

**Claim made true.** The blues wording says what each figure, turnaround and piece is; blues.8's title, unit title and finder promise the keys the lesson asks for; *Play it blind* on blues.8 opens a twelve-bar form in a flat key and the page says what Blind cannot show; *12 Bar Blues* is named for what it is; jazz and jam state one choice as one choice; the walking-bass lab count is explained where it would mislead.

**Edit 1 (W8, blues.4 extended figure; blues-boogie#5).**

`content/lessons/blues.4.md:33-34` at HEAD:

```text
in eighth notes — for C7 that is C–G–A–G, repeated, and it moves up to F–C–D–C
for the IV chord. Some versions add the flat seventh: root–5–6–♭7–6–5. Learn it
```

After:

```text
in eighth notes — for C7 that is C–G–A–G, repeated, and it moves up to F–C–D–C
for the IV chord. Some versions climb further, through the third and the flat
seventh: root–3–5–6–♭7–6–5–3, eight notes to the bar — the climb Stage 6 uses. Learn it
```

(Line 35 continues "in C first until the hand does it without you." unchanged.)

Evidence: `blues-boogie.md` record §5 item 7 (six notes do not fill eight eighths; `BOOGIE_PATTERNS["pinetop"]` offsets 0,4,7,9,10,9,7,4).

**Edit 2 (W8, the 12 Bar Blues re-role; blues-boogie#2).**

`content/lessons/blues.4.md:48-49` at HEAD:

```text
**What to practise.** The generated twelve-bar shuffles in C, F and G; the shuffle exercise; then the same form with a simple right-hand
riff on top.
```

After:

```text
**What to practise.** The generated twelve-bar shuffles in C, F and G; the shuffle exercise; then the same form with a simple right-hand
riff on top. *12 Bar Blues* among the songs is exactly that: a right-hand riff,
one staff, no left hand and no chord symbols, through a full twelve-bar chorus
once its repeat is taken (bars 1 and 2 twice), then a closing bar.
```

Evidence: the backward repeat at bar 2 and the unrolled 13-bar path (`blues-boogie.md` record §5 item 1, SYNTHESIS A11 verified; `extractScoreModel.ts:12-16` unrolls repeats); `WAVE1-FACTS.md` (chordCount 0).

**Edit 3 (W8, blues.6 repertoire).**

`content/lessons/blues.6.md:45-46` at HEAD:

```text
**Repertoire for this rung.** Two short boogies to play the form on, and the
real thing: Clarence "Pinetop" Smith's own *Pinetop's Boogie Woogie* (1928),
```

After:

```text
**Repertoire for this rung.** One short boogie to play the form on, *Boogie
(easy, for beginners)*; a sheet of octave walking-bass exercises that ends in a
twelve-bar example from bar 19; and the
real thing: Clarence "Pinetop" Smith's own *Pinetop's Boogie Woogie* (1928),
```

Evidence: `blues-boogie.md` record §5 item 8 (the louisf365 file's headings).

**Edit 4 (W8, blues.7 stride).**

`content/lessons/blues.7.md:12-13` at HEAD:

```text
**Stride.** Bass note, chord, tenth, chord. One leap a bar, down to the bass
and back up to the chord, and it cannot be watched — by the time your eye
```

After:

```text
**Stride.** Bass note, chord, tenth, chord: the hand changes position on every
beat, down to the bass and back up to the chord, and it cannot be watched — by the time your eye
```

**Edit 5 (W8, blues.7 turnaround).**

`content/lessons/blues.7.md:17-21` at HEAD:

```text
**The turnaround** is the last two bars, and it is what makes a chorus lead into
the next one instead of stopping. `I–vi–ii–V` is the standard. The variant on
this rung replaces the tonic with the chord a third above and makes the vi a
dominant, which is what you reach for when the tune has already sat on the tonic
for eight bars.
```

After:

```text
**The turnaround** is the last two bars, and it is what makes a chorus lead into
the next one instead of stopping. `I–vi–ii–V`, the one Stage 5 drilled, is one
common choice. The variant on this rung replaces the tonic with the chord a
third above and makes the vi a dominant: more colour where the tonic has gone
on long enough.
```

(Naming the stock blues turnaround beside it is blues-boogie#3, A7a.2, wave 2; not here.)

**Edit 6 (W8, Boogie en Sol).** Re-read (observed by script): `song.blues.boogie-en-sol` LH bars 4-5 G1, [B2 D3 G3], B1, [B2 D3 G3], D2, ... in eighths.

`content/lessons/blues.7.md:37-40` at HEAD:

```text
walk down to G rather than a turnaround. *Boogie-Boogie
en Sol* is short and sits in G, which puts the bass figure under a different set
of fingers — the fastest way to find out whether you learned the pattern or the
key. None of the three is required: the rung is finished on its exercises, and
```

After:

```text
walk down to G rather than a turnaround. *Boogie-Boogie
en Sol* is short and sits in G, and its left hand is this rung's leap: a low bass
note, then a chord above it, in eighths. None of the three is required: the rung is finished on its exercises, and
```

**Edit 7 (W8, blues.8 title; blues-boogie#5).** `content/lessons/blues.8.md:2` and `stage-8.json:351`: `The form in twelve keys, and what the ninth chord adds` → `The form in new keys, and what the ninth chord adds`. `stage-8.json:346`: `Blues: every key, and the chords underneath` → `Blues: new keys, and the chords underneath`. `stage-8.json:404`: `playing the twelve-bar form in any key and colouring it with ninths` → `playing the twelve-bar form in new keys and colouring it with ninths`. `stage-8.json:405`: `twelve bar in all keys` → `twelve bar in new keys`. `docs/02-curriculum.md:523`: `The form in twelve keys` → `The form in new keys`. Evidence: the lesson asks for "two new keys" (`blues.8.md:30`) and "slowly in one new key rather than badly in six" (`:17-18`).

**Edit 8 (C2, blues.8's Blind target; blues-boogie#9 data half).** `stage-8.json:391-393`, the `blind` tool, gains an item that is already on the rung (`exerciseOptions`):

`content/curriculum/stage-8.json:390-398` at HEAD:

```text
              "tools": [
                {
                  "kind": "blind"
                },
                {
                  "kind": "lab",
                  "preset": "blues-shuffle"
                }
              ],
```

After:

```text
              "tools": [
                {
                  "kind": "blind",
                  "item": "exercise.walking-bass.e-flat.blues"
                },
                {
                  "kind": "lab",
                  "preset": "blues-shuffle"
                }
              ],
```

and the lesson's tools paragraph:

`content/lessons/blues.8.md:47-50` at HEAD:

```text
notes, which is the direction this rung is short of. *Play it blind* opens
*Pinetop's Boogie Woogie*, first of the rung's three, with the notation hidden
and the run still followed and marked — which is where "from memory" below gets
tested rather than claimed.
```

After:

```text
notes, which is the direction this rung is short of. *Play it blind* opens the
walking bass in E flat, a twelve-bar form in a flat key, with the notation
hidden and the run still followed and marked — the nearest the app comes to the
"from memory" below. It does not record that the page was hidden, so that part
is yours to check.
```

Evidence (observed): `exercise.walking-bass.e-flat.blues` is 13 bars, symbols E♭7 ×4, A♭7 ×2, E♭7 ×2, B♭7, A♭7, E♭7, B♭7, E♭7 (a twelve-bar form plus a closing bar); Pinetop is 97 bars (`blues-boogie.md` §3.7); a `blind` `item` must be one of the rung's own options (`types.ts:519-530`, `LessonScreen.ts:581-595`, `validate.py` `tool_errors`); Blind writes no `blind` field (`MODE-SHEET.md` §10). Browser spec: `app/tests/e2e/lesson-tools.spec.ts` (the tool's landing is asserted there), run on the lane's own port.

**Edit 9 (W8, blues.9 written choruses).**

`content/lessons/blues.9.md:31-33` at HEAD:

```text
**Repertoire for this rung.** Yours, first — nothing here is required. Then
three written choruses by people who improvised them before they wrote them, so
you can read what the thing you are reaching for looks like on paper. *Stumbling*
```

After:

```text
**Repertoire for this rung.** Yours, first — nothing here is required. Then
three written pieces from the 1920s, none of them a twelve-bar blues, each worth
reading for how a right hand answers its own phrases. *Stumbling*
```

Evidence: Stumbling 105 bars, Black Bottom Stomp 101, Handful of Keys 176 (`blues-boogie.md` §5 item 3); the improvised-first provenance is unsourced.

**Edit 10 (W9, jazz.6 approach note; jazz#5).**

`content/lessons/jazz.6.md:22-23` at HEAD:

```text
**Walking bass.** Four notes to the bar, and the fourth one is the trick: a
semitone below the next bar's root. Root, third, fifth, approach. Play the line
```

After:

```text
**Walking bass.** Four notes to the bar, and the fourth one is the trick: a
semitone above or below the next bar's root. Root, third, fifth, approach. The
exercises here always take the semitone below; the one above works the same way. Play the line
```

Evidence: `generate_exercises.py:4076` (`-m2` every time); `jam.6.md:23-26` ("one step above or below"); published walking-bass sources give either side (`jazz.md` record §5 item 1).

**Edit 11 (W9, "exactly as well").**

`content/lessons/jazz.7.md:27-28` at HEAD:

```text
F and C♭, the same two notes spelled differently. So D♭7 resolves to C exactly as
well as G7 does, and the bass walks down a semitone instead of leaping a fourth.
```

After:

```text
F and C♭, the same two notes spelled differently. So D♭7 resolves to C much as
G7 does, and the bass walks down a semitone instead of leaping a fourth.
```

**Edit 12 (W9, stride).** Observed (`exercise.stride.c` LH bar 1: C2, [E3 G3], E3, [E3 G3]): in the exercise the "tenth" is the third above the bass a tenth up, which is also the chord's bottom note; what is unsupported is the claim about the learner.

`content/lessons/jazz.7.md:32-34` at HEAD:

```text
**Stride** is here because the left hand needs somewhere to go when it is not
walking: bass, chord, tenth, chord, the tenth being the chord's own bottom
note again and not a bass note. Beat one is the leap you will miss.
```

After:

```text
**Stride** is here because the left hand needs somewhere to go when it is not
walking: bass, chord, tenth, chord. In the exercise the tenth is a single note,
the chord's third a tenth above the bass, which is also the chord's own bottom
note.
```

**Edit 13 (W9, the eleventh).**

`content/lessons/jazz.8.md:19-21` at HEAD:

```text
like a mistake unless you meant it. That is why sharp elevenths exist and why
the sus chords do too. Play C13 with and without the eleventh and listen to
which one you meant.
```

After:

```text
like a mistake unless you meant it. Players get round it by raising the eleventh
(the sharp eleventh) or by leaving the third out (a sus chord). Play C13, then
add F, the natural eleventh, on top of it, and listen to it rub against the E.
```

**Edit 14 (W18, jam.6 lab count; jam#3).**

`content/lessons/jam.6.md:46-48` at HEAD:

```text
the chords*, the bar's chord on the backbeat with it. At the end of each time
round it says how many of your notes were in the blues scale, and keeps none of
it.
```

After:

```text
the chords*, the bar's chord on the backbeat with it. At the end of each time
round it says how many of your notes were in the blues scale, and keeps none of
it. That count is meant for a right hand: a walking line leaves the scale on
purpose — the exercise's first bar in E, E G♯ B D♯, has two notes outside it — so
a correct walk can read as half in. Ignore the count here.
```

Evidence: `jam.md` record §5 item 2 (`judgeLabPass`, `tradeScale`; `exercise.walking-bass.e.blues.intro` bar 1 E G♯ B D♯; the E blues scale E G A B♭ B D).

**Edit 15 (W18, the bed's drums; jam#9).**

`content/lessons/jam.md:58-59` at HEAD:

```text
*Accompaniment lab* opens *Blues — twelve bars* on *Bed only*: a bass line and
a kick that do not stop, and no chords, because the chords are the thing you
```

After:

```text
*Accompaniment lab* opens *Blues — twelve bars* on *Bed only*: a bass line and
drums — kick, snare and hi-hat — that do not stop, and no chords, because the chords are the thing you
```

`content/lessons/jam.5.md:35` at HEAD:

```text
*Bed only*: a bass and drums that keep the form without keeping time *for* you,
```

After:

```text
*Bed only*: a bass and drums that keep the beat and the form going for you to play against,
```

Evidence: `backingLoop.ts:119-170` (kick 1 and 3, snare 2 and 4, hat every beat; `jam.md` record §5 item 3).

**Edit 16 (W18, "1920").**

`content/lessons/jam.7.md:32-34` at HEAD:

```text
**The keys are not the guitarist's.** Four of these five sit in flat keys,
because that is where the horns played them in 1920, and the guitarist's keys
are E, A, D and G. One of the five is written with a sharp in the signature and
```

After:

```text
**The keys are not the guitarist's.** Four of these five sit in flat keys, as
much early jazz does, and the guitarist's keys
are E, A, D and G. One of the five is written with a sharp in the signature and
```

**Verification.** The common list, plus `lesson-tools.spec.ts` for edit 8.

**Acceptance for the learner.** On blues.8 the blind button opens a twelve-bar form in a flat key and says what the app cannot see; the titles promise the keys asked for; no blues, jazz or jam sentence states a choice as the only one or a count that misleads on the rung's own task.

**Stays self-checked, and the lesson says so:** that the blues.8 run was from memory; anything the lab counts.

---

## Seam 1a.5: theory and improv (W11 text, W12, W13 as CT-1)

**Claim made true.** Each theory rung says the drills mark what the learner plays back and that naming, singing and writing are the learner's to check; the item called "Rhythm dictation" is named for what it does; Lydian, Phrygian, Locrian, `°` and `V/ii` are defined before the drills ask for them; theory.9 names the forms its finder asks for; improv.4 to .8 drop their laws; improv.6's lab can do what its lesson asks; improv.6 to .9 show their lesson's rule and say what "met" means.

**Edit 1 (W11, theory.3 rhythm item; theory-ear#2).** Observed in `MODE-SHEET.md` §23: the rhythm is drawn on the card, `params.mode` is read by nothing. Re-read first (S2): open `DrillScreen.ts:2040-2056` and `fromCatalog.ts:576-594`; if the drill sounds the rhythm with the card hidden, stop this edit.

`content/lessons/theory.3.md:42-43` at HEAD:

```text
**Rhythm dictation.** The app taps a two-bar rhythm and you tap it back. Count
the beats aloud while listening — do not try to memorise it as a shape.
```

After:

```text
**Rhythm reading.** The card shows a two-bar rhythm and you tap it against the
click. Because the rhythm is written on the card, this trains reading and placing
a rhythm, not hearing one; taking a rhythm down by ear is yours to practise away
from the drill — someone claps two bars, you clap or write them back.
```

and `content/catalog.static.json:1338`: `"title": "Rhythm dictation",` → `"title": "Rhythm — read and tap two bars",`. The id and the concept `rhythm-dictation` stay (ids are not shown; renaming a concept is a vocabulary change outside this seam).

**Edit 2 (W11, theory.3 "How you'll know"; theory-ear#2).**

`content/lessons/theory.3.md:61-64` at HEAD:

```text
**How you'll know you've got it.** Every interval within the octave identified
by ear at 80 % accuracy in the interval drill, a key signature of up to three sharps or
flats named from the two rules above without pausing, and a chain of eight notes
played back in Simon.
```

After:

```text
**How you'll know you've got it.** Every interval within the octave played back
at 80 % accuracy in the interval drill, a key signature of up to three sharps or
flats named from the two rules above without pausing, and a chain of eight notes
played back in Simon. The drill marks the two notes you play back, not their
name: naming each interval aloud before you play it, and the key signatures, are
yours to check.
```

Evidence: `MODE-SHEET.md` §19 (ear drills: play back, nothing named).

**Edit 3 (W11, theory.4 inversions; theory-ear#11).** Insert after line 28, inside the "Inversions by ear" paragraph:

```text
The inversion drill on this rung is a reading drill — it shows a slash name and
marks the chord you play — so hearing the position is yours to check: play one
of the three positions without looking and name the bass note before you look.
```

Evidence: `drill.chord.inversions` kind `inversion` (`catalog.static.json`); `MODE-SHEET.md` §25.

**Edit 4 (W11, theory.4 "How you'll know").**

`content/lessons/theory.4.md:58-60` at HEAD:

```text
**How you'll know you've got it.** Cadences identified at 80 % accuracy by ear, triad
inversions played from their slash-chord names, and an eight-note phrase played
back correctly after two hearings.
```

After:

```text
**How you'll know you've got it.** Cadences played back at 80 % accuracy in the
cadence drill, triad inversions played from their slash-chord names, and an
eight-note phrase played back correctly after two hearings. The cadence drill
marks the chords you play back; naming the cadence — authentic, half, plagal,
deceptive — is yours to check, so say it before you play.
```

Evidence: `MODE-SHEET.md` §20.

**Edit 5 (W11, theory.5 "How you'll know").**

`content/lessons/theory.5.md:64-66` at HEAD:

```text
**How you'll know you've got it.** Four seventh qualities identified by ear at
80 % accuracy, two progressions recognised in unfamiliar music, and one tune transposed
into three keys on the spot.
```

After:

```text
**How you'll know you've got it.** Four seventh qualities played back at 80 %
accuracy in the seventh-chord drill, two progressions recognised in unfamiliar
music, and one tune transposed into three keys on the spot. The drill marks the
chord you play back, not its name: naming maj7, 7, m7 or m7♭5 before you play,
recognising the progressions and the transposing are yours to check.
```

**Edit 6 (W11, Lydian; theory-ear#3).**

`content/lessons/theory.6.md:31-32` at HEAD:

```text
**Modes are on this rung** because the previous theory lesson taught four of
them and nothing let you play them. Now something does.
```

After:

```text
**Modes are on this rung** because the previous theory lesson taught four of
them and nothing let you play them. Now something does. The drill adds a fifth,
**Lydian**: the white keys from F to F, a major scale with its fourth raised — in
F, B natural where F major has B flat.
```

Evidence: `drill.theory.modes` asks dorian, mixolydian, lydian, aeolian, ionian; theory.5 defines four (`theory.5.md:29-34`).

**Edit 7 (W11, Phrygian, Locrian, `°`, `V/ii`).** Insert after line 39 of theory.7, as a new paragraph:

```text
**Two more modes, and two more symbols.** The modes drill on this rung asks for
all seven, from any root. The two not met yet: **Phrygian**, the white keys from
E to E, a natural minor with its second lowered a semitone; and **Locrian**, B to
B, a natural minor with its second and its fifth lowered, the one mode whose
tonic triad is diminished. In the numeral drill, `°` marks a diminished triad:
`vii°/V` in C is F♯–A–C, the leading-tone chord of G. And `V/ii` is the dominant
of the ii chord: in C, ii is D minor, so `V/ii` is A major.
```

Evidence: `drill.theory.modes-all` (seven modes), `drill.theory.roman-numerals-secondary` (`vii°/V`, `V/ii`); a builder re-checks each spelling with `music21.roman.RomanNumeral('viio/V','C')` and `('V/ii','C')` and `music21.scale` before writing (S2).

**Edit 8 (W11, form names; theory-ear#5).** Insert after line 21 of theory.9, as a new paragraph:

```text
Three names cover most of what you will take down or find: **ABA**, a section,
a contrasting one, then the first again; **AABA**, four eight-bar sections where
the third, the *bridge*, differs — the 32-bar form of many popular songs and
standards; and **binary**, AB, two halves, each often repeated.
```

Evidence: the theory.9 finder asks for "ABA or a 32-bar song" (`stage-9.json`, read by script); the lesson names none.

**Edit 9 (W11, theory.9 "How you'll know").**

`content/lessons/theory.9.md:43-44` at HEAD:

```text
**How you'll know you've got it.** You can hear eight bars three times and write
them down.
```

After:

```text
**How you'll know you've got it.** You can hear eight bars three times and write
them down. The tune drill marks what you play back a phrase at a time; the
writing, and the harmony, are yours to check — play back what you wrote and
compare it with the drill's tune.
```

**Edit 10 (W12, improv.4 black keys; improv-compose#5).**

`content/lessons/improv.4.md:15-17` at HEAD:

```text
leading tone that demands resolution), so taking them out leaves a scale with
no note that sounds wrong over most diatonic progressions. It is the reason the black
keys alone (an F sharp pentatonic) sound good over almost anything.
```

After:

```text
leading tone that demands resolution), so taking them out leaves a scale with
no note that sounds wrong over most diatonic progressions in its key. The black
keys alone are a pentatonic too, F sharp major's, which is why they sound good
over F sharp and the chords around it; over a C chord they share no note with it
and clash.
```

Evidence: F♯ pentatonic {6,8,10,1,3} and C major {0,4,7} share no pitch class (`improv-compose.md` record §5 item 2).

**Edit 11 (W12, improv.5).**

`content/lessons/improv.5.md:19-21` at HEAD:

```text
The useful surprise is that the *same* blues scale works over all three chords
of a twelve-bar blues in C. You do not change scale when the chord changes.
That single fact is what makes the blues the best place to learn to improvise.
```

After:

```text
The useful surprise is that the *same* blues scale works over all three chords
of a twelve-bar blues in C. You do not have to change scale when the chord
changes. That is where most players start, and why the blues is a good place to
begin improvising; the chord tones of each bar come later, on improv.6.
```

**Edit 12 (W12, improv.6's lab key; improv-compose#4).** Data: `stage-6.json:750-752`, the `unlock` list gains `"key"`:

`content/curriculum/stage-6.json:746-754` at HEAD:

```text
              "tools": [
                {
                  "kind": "lab",
                  "preset": "minor-vamp",
                  "unlock": [
                    "progression"
                  ]
                }
              ]
```

After:

```text
              "tools": [
                {
                  "kind": "lab",
                  "preset": "minor-vamp",
                  "unlock": [
                    "progression",
                    "key"
                  ]
                }
              ]
```

and the lesson:

`content/lessons/improv.6.md:37-38` at HEAD:

```text
**Tools for this rung.** *Accompaniment lab* opens here on the minor vamp with
its chords left to you, so put `ii7 V7 I` in and run it. The
```

After:

```text
**Tools for this rung.** *Accompaniment lab* opens here on the minor vamp with
its key and its chords left to you: set the key to C major, put `ii7 V7 I` in
and run it, then do the same in two more major keys. The
```

Evidence: preset `minor-vamp` locks `key`, `progression`, `leftHand` (`sightReading.ts:2469-2484`); `labLocksFor` subtracts the rung's `unlock` (`:2356-2363`); in a minor key the lab's ii-V-I is `iiø7 V7 i` (`:2248-2254`), not the lesson's `ii7 V7 I`. Hypothesis to test before the edit (S2): `parseRomanList('ii7 V7 I')` with `romanToLabChord` in C major yields D minor seventh, G seventh and C (`sightReading.ts:2611,2656`); if it does not, stop this edit. Browser spec: `app/tests/e2e/modes-lab-unlock.spec.ts`, run on the lane's own port.

**Edit 13 (W12, improv.4's requirement text; improv-compose#4).** `stage-4.json:1265`: `"says": "Four answers recorded.",` → `"says": "Four answers, recorded on your own phone or recorder.",` (the lab records nothing, `improv.4.md:62-63`).

**Edit 14 (W12, improv.7 fourths; improv-compose#5).**

`content/lessons/improv.7.md:39-40` at HEAD:

```text
so a quartal shape you like can be held and named — and when it names nothing,
that is the answer too, because a stack of fourths is not a chord with a name.
```

After:

```text
so a quartal shape you like can be held and named: a three-note stack of fourths
such as C–F–B♭ comes back as a sus chord, one honest name for it; a four-note
stack may get no name at all, and that is an answer too.
```

Test before the edit (S2): a unit test calls `nameHeldChord` (`app/src/engine/drills/theory.ts:160`) on C4, F4, B♭4 and on C4, F4, B♭4, E♭5; the sentence names what it returns. If the three-note stack returns no name, stop this edit.

**Edit 15 (W12, improv.8).**

`content/lessons/improv.8.md:15-21` at HEAD:

```text
**Start with the substitution you know.** Every dominant chord can become the
dominant a tritone away. That is one decision, it works everywhere, and it
changes the bass line from leaps into a chromatic descent.

**Then the approach chords.** Any chord can be preceded by its own dominant.
Insert `V7/x` before chord `x` and the music suddenly has twice as much harmonic
motion without a single new note in the melody.
```

After:

```text
**Start with the substitution you know.** Every dominant chord can become the
dominant a tritone away. That is one decision, it works for the chord symbols,
and it changes the bass line from leaps into a chromatic descent; whether it
suits the tune depends on the melody note above it, which the last paragraph
comes back to.

**Then the approach chords.** Almost any major or minor chord can be preceded by
its own dominant (a diminished chord cannot).
Insert `V7/x` before chord `x` and the music suddenly has twice as much harmonic
motion without a single new note in the melody.
```

**Edit 16 (W13 as CT-1, improv.6 to .9).** One `unjudged` requirement appended to each lesson's `requirements` array (after the existing `runs` entry), spliced as text:

- `improv.6` (`stage-6.json`): `{"kind": "unjudged", "rule": "guide-tones-three-keys", "says": "A ii–V–I in three keys, landing on a chord tone at the start of each bar.", "why": "Improvised notes are not a run the app judges, and the lab records nothing."}`
- `improv.7` (`stage-7.json`): `{"kind": "unjudged", "rule": "two-improvisations-own-sound", "says": "Two improvisations someone could recognise as yours.", "why": "An improvisation is not a run the app judges, and Free play keeps nothing."}`
- `improv.8` (`stage-8.json`): `{"kind": "unjudged", "rule": "three-reharmonisations", "says": "Three versions of the same eight bars, each with chords you chose.", "why": "A reharmonisation you play is not a run the app judges."}`
- `improv.9` (`stage-9.json`): `{"kind": "unjudged", "rule": "finished-piece", "says": "A piece of your own, written down and playable.", "why": "Writing a piece is not a run the app records."}`

and one sentence appended to each "How you'll know" paragraph (`improv.6.md:51`, `improv.7.md:48`, `improv.8.md:49`, `improv.9.md:42`):

- improv.6: `The app marks this rung met on one run of its exercises; landing on chord tones over the changes is yours to check.`
- improv.7: `The app marks this rung met on one run of its exercises; the improvising, which nothing keeps, is yours to judge.`
- improv.8: `The app marks this rung met on one run of its exercises; the three versions are yours to play and judge.`
- improv.9: `The app marks this rung met on one run of its exercises; the piece, and the judgement of it, are yours.`

Evidence: `rungState.ts:341` filters `unjudged` before "met" (`ABILITY-MAP.md` §8.2 CT-1; W13 superseded). `validate.py:1716-1750` reads `unjudged` rules; the content build must pass with them.

**Verification.** The common list; the two new unit tests (edits 12 and 14) with their test-map rows; `modes-lab-unlock.spec.ts`.

**Acceptance for the learner.** On every theory rung the page says what the drill marks and what is theirs; no drill uses a term the lessons have not defined; improv.6's lab can be set to three major keys as the lesson asks; improv.6 to .9 show the lesson's own rule as theirs and say the rung is met on its exercises.

**Stays self-checked, and the lesson says so:** naming, singing and writing (theory); everything improvised or composed (improv).

---

## Seam 1a.6: chords-pop, hymns, holiday, latin and rock lessons (W7 text, W14, W15 text, W16, W17 text)

**Claim made true.** Each sentence below matches its score or the generator table; hymns.2's fourth option is a correct melody; the holiday learner is warned of the bar-32 misprint until the score fix lands.

**Edit 1 (W7, chords-pop.4 "walking"; chords-pop#9).**

`content/lessons/chords-pop.4.md:31-34` at HEAD:

```text
**Slash chords.** C/E is a C chord with E in the bass, and its use is to create a
walking bass line under static harmony: C, C/E, F, C/G. The bass moves by step
while the chords barely change, and that stepwise bass is what makes an
arrangement sound composed rather than blocked out.
```

After:

```text
**Slash chords.** C/E is a C chord with E in the bass, and one use is a bass
line that moves while the harmony barely does: C, C/E, F, C/G puts C, E, F and G
in the bass, a skip and then steps, under only C and F. That moving bass is what makes an
arrangement sound composed rather than blocked out.
```

**Edit 2 (W7, chords-pop.5).**

`content/lessons/chords-pop.5.md:45-46` at HEAD:

```text
slow tune; and two ballads that live on seventh chords, *Your Song* and
*Before You Go*. And imported lead sheets of your own.
```

After:

```text
slow tune; *Your Song*, full of seventh chords; and *Before You Go*, where
sevenths come and go among open fifths and suspensions. And imported lead sheets of your own.
```

Evidence: `chords-pop.md` record §5.3 (medium confidence: chordify counts include melody notes, hence no numbers).

**Edit 3 (W7, chords-pop.7).**

`content/lessons/chords-pop.7.md:22-23` at HEAD:

```text
a sound you will hear in pop piano, and it is not a ninth chord — a ninth chord has the
seventh in it and sounds like jazz. Play C, Cadd9 and C9 in a row and the
```

After:

```text
a sound you will hear in pop piano, and it is not a ninth chord — a ninth chord has the
seventh in it, a sound common in jazz, soul and funk. Play C, Cadd9 and C9 in a row and the
```

**Edit 4 (W7, chords-pop.8).**

`content/lessons/chords-pop.8.md:42-43` at HEAD:

```text
**Common mistake.** Transposing the shapes rather than the harmony. It works in
the white keys and falls apart in the flat ones.
```

After:

```text
**Common mistake.** Moving your hand shape up by the same number of white keys
instead of transposing the harmony. C major moved up a white key that way lands
on D minor; read the numerals and find the notes.
```

**Edit 5 (W14, Jesus Loves Me; hymns-gospel#1).**

`content/lessons/hymns.md:43-44` at HEAD:

```text
*Abide with Me*, *Jesus Loves Me* and *Rock of Ages* — that one in six-four —
are in four parts with no symbols, while *What a Friend*, *Come
```

After:

```text
*Abide with Me* and *Rock of Ages* — that one in six-four — are in four parts
with no symbols, *Jesus Loves Me* is a tune over a broken-chord left hand, also
without symbols, while *What a Friend*, *Come
```

Evidence: SYNTHESIS A3 (verified).

**Edit 6 (W14, "nearly everywhere"; hymns-gospel#7).**

`content/lessons/hymns.md:35-36` at HEAD:

```text
  the target chord and release it immediately. A half-step approach from below
  works nearly everywhere.
```

After:

```text
  the target chord and release it immediately. A half-step approach from below
  is a good first one to try.
```

**Edit 7 (W14, the Library line).**

`content/lessons/hymns.md:46-48` at HEAD:

```text
tune, which is where a walk-up goes. The easier settings — *Be Thou My Vision*,
*Swing Low*, *Joyful, Joyful* — are on the Stage 2 hymns rung and in the
Library. *Greensleeves* with chords gives you the same job in a minor key. Beyond those, a hymnal is the
```

After:

```text
tune, which is where a walk-up goes. The easier settings — *Be Thou My Vision*,
*Swing Low*, and *Ode to Joy*, the tune of *Joyful, Joyful* — are on the Stage 2 hymns rung and in the
Library. *Greensleeves* with chords gives you the same job in a minor key. Beyond those, a hymnal is the
```

**Edit 8 (W14, chord counts; hymns-gospel#7).**

`content/lessons/hymns.2.md:13-14` at HEAD:

```text
find out whether you can put chords under a melody. Almost all of them use three
or four chords, the tune is singable by design, and the harmony changes at a
```

After:

```text
find out whether you can put chords under a melody. Many of them use three
or four chords, the tune is singable by design, and the harmony changes at a
```

`content/lessons/hymns.2.md:22` at HEAD:

```text
**Three chords will get you through most of a hymnbook.** You met C, F and G on
```

After:

```text
**Three chords will get you through many hymns.** You met C, F and G on
```

Evidence: What a Friend prints seven symbols, Just a Closer Walk seven (`hymns-gospel.md` record §5 item 3).

**Edit 9 (W14, the edition; hymns-gospel#2).** `stage-2.json:587-592`:

`content/curriculum/stage-2.json:587-592` at HEAD:

```text
              "songOptions": [
                "song.folk.when-the-saints.alternating",
                "song.folk.be-thou-my-vision.pdmx",
                "song.classical.beethoven-ludwig-van-beethoven-joyful-joyful-we-adore-thee.pdmx",
                "song.folk.anonymous-swing-low-sweet-chariot.pdmx"
              ],
```

After:

```text
              "songOptions": [
                "song.folk.when-the-saints.alternating",
                "song.classical.ode-to-joy.rh",
                "song.folk.be-thou-my-vision.pdmx",
                "song.folk.anonymous-swing-low-sweet-chariot.pdmx"
              ],
```

and the lesson:

`content/lessons/hymns.2.md:34-40` at HEAD:

```text
**Repertoire.** Four options, from easiest up. *Oh When the Saints* is
hands-alternating and is barely harmony at all, which makes it the one to start
with. *Be Thou My Vision* is in 3/4 and moves slowly enough to think. *Joyful,
Joyful* is Beethoven's tune, but this score writes it on D with every F
natural, a grace note before nearly every note and a tempo of 40, so read what
is written rather than playing it from memory. *Swing Low, Sweet Chariot* is the only one here with its
chord symbols printed, so it is where you stop guessing and start reading them.
```

After:

```text
**Repertoire.** Four options. *Oh When the Saints* is
hands-alternating and is barely harmony at all, which makes it the one to start
with. *Ode to Joy* is the tune the hymn *Joyful, Joyful, We Adore Thee* is sung
to: this is its first eight bars, right hand only, the version you played on the
core path, in C, with the ends of its two phrases simplified to two half notes.
*Be Thou My Vision* is in 3/4 and moves slowly enough to think. *Swing Low, Sweet Chariot* is the only one here with its
chord symbols printed, so it is where you stop guessing and start reading them.
```

Evidence: SYNTHESIS A4 (the PDMX edition on D with every F natural, verified); `song.classical.ode-to-joy.rh` 8 bars, right hand, C (catalog); bars 4 and 8 are two half notes (`WAVE1-FACTS.md` Part 2 §2). The rung's song requirement (`runs from songs count 1`, `stage-2.json:603-607`) is unchanged; `ode-to-joy.rh` is level 1.1, below Saints' 1.4, which is why the "from easiest up" ordering is dropped rather than restated.

**Edit 10 (W14, hymns.5; hymns-gospel#7).**

`content/lessons/hymns.5.md:31` at HEAD:

```text
One trick rather than many: any chord can be preceded by its own five chord,
```

After:

```text
One trick rather than many: a major or minor chord can be preceded by its own five chord,
```

**Edit 11 (W15, holiday.3 range; holiday#2).** Re-read (observed by script): the RH of `song.classical.mendelssohn-felix-mendelssohn-hark-the-herald-angels-sing.pdmx` and of `song.pop.misc-christmas-traditional-music-god-rest-ye-merry-gentlemen-gw.pdmx` reaches E5.

`content/lessons/holiday.3.md:18-20` at HEAD:

```text
often too high to sing. Untrained voices mostly live between about A below
middle C and D above it, and if the tune goes higher than that a room will
quietly stop. Being able to move a tune down a step or two is worth more here
```

After:

```text
often too high to sing. Untrained voices are most comfortable between about the
A below middle C and the D on the fourth line of the treble staff; most can reach
the E above that for a note or two — *Hark!* and *God Rest Ye* here both touch it —
but if a tune sits higher than that for long, a room will quietly stop. Being able to move a tune down a step or two is worth more here
```

Evidence: Reformed Worship (citing Scheer): comfortable B♭3 to D5, most voices reach C5, hymn tunes often reach D5 or E5 (`holiday.md` record §5 item 4).

**Edit 12 (W15, the bar-32 warning; holiday#1).** Until IM-4's source read lands the score fix, the learner is told.

`content/lessons/holiday.3.md:40-41` at HEAD:

```text
lead sheets: tune on top, symbols above. *O Christmas Tree* is the one in F,
which is the third key the cadences drill. *God Rest Ye Merry, Gentlemen* is the
```

After:

```text
lead sheets: tune on top, symbols above. *O Christmas Tree* is the one in F,
which is the third key the cadences drill; one misprint to know about: in bar
32 the second chord symbol reads C♭, which cannot be right under the B♭ and E the
tune plays there — play C7. *God Rest Ye Merry, Gentlemen* is the
```

Evidence (observed by script on 2026-10-05): bar 32 symbols Gm then C♭ (C♭ E♭ G♭), melody G4 A4 B♭4 E4. When the score fix lands (gated), this clause is removed in the same change.

**Edit 13 (W15, O Holy Night).**

`content/lessons/holiday.3.md:44` at HEAD:

```text
an F sharp above the treble staff, which is this whole lesson in one note: move
```

After:

```text
an F sharp on the top line of the treble staff, which is this whole lesson in one note: move
```

**Edit 14 (W15, one singer).**

`content/lessons/holiday.3.md:52-54` at HEAD:

```text
**Common mistake.** Following the singers. Somebody always drags, and if you
follow them the whole room slows down until the carol stops. Keep the pulse and
let them come back to you; they will.
```

After:

```text
**Common mistake.** Following the singers. In a room, somebody always drags, and
if you follow them the whole room slows down until the carol stops. Keep the
pulse and let them come back to you; they will. One singer on their own is the
other case: there you follow, and leave room for their breaths.
```

**Edit 15 (W15, Carol of the Bells).** Re-read (observed by script): the figure C5 B4 C5 A4 in 25 of 40 bars (1-16, 24, 29-36); the shape a third higher, E5 D5 E5 C5, in bars 17-20.

`content/lessons/holiday.5.md:14` at HEAD:

```text
case there is — four notes, over and over, in thirty-three of its forty bars,
```

After:

```text
case there is — four notes, over and over: the same figure in twenty-five of its forty bars, and the same shape a third higher in four more,
```

**Edit 16 (W15, Auld Lang Syne).**

`content/lessons/holiday.5.md:46-47` at HEAD:

```text
- *Auld Lang Syne* is in F and in four, twenty bars, and both hands are in
  thirds and sixths nearly throughout. Nothing here repeats; the work is making
```

After:

```text
- *Auld Lang Syne* is in F and in four, twenty bars, with the right hand often
  in thirds and sixths and the left mostly in octaves and fifths. Nothing here repeats; the work is making
```

Evidence: `holiday.md` record §5 item 3 (dyad census).

**Edit 17 (W16, clave definitions; latin#2).** Insert after line 20 of latin.3, as a new paragraph:

```text
**Two more claves are on the list.** The *rumba clave* is the son with one stroke
moved: the third stroke of the three-side comes half a beat later, on the "and"
of 4 instead of on beat 4. The *bossa clave* keeps the son's three-side and moves
the last stroke of the two-side half a beat later, from beat 3 to the "and" of 3.
```

Evidence (observed): `CLAVE_PATTERNS` (`generate_exercises.py:4870-4876`): son-3-2 0, 1.5, 3.0, 5.0, 6.0; rumba-3-2 0, 1.5, 3.5, 5.0, 6.0; bossa 0, 1.5, 3.0, 5.0, 6.5. The spec's line is stale and is corrected in the same seam: `docs/02-curriculum.md:1204` "the son with its last stroke moved to beat 4 of the second bar" → "the son with its last stroke moved an eighth later, from beat 3 of the second bar to its \"and\"" (the generator comment at `:4860-4864` records the 2026-09-18 correction from 7.0 to 6.5).

**Edit 18 (W16, the montuno; latin#5).**

`content/lessons/latin.md:28-31` at HEAD:

```text
**Montuno** is the right-hand pattern: a repeating syncopated figure built from
the chord's notes, usually in octaves or thirds, locked to the clave and
repeated for as long as the section lasts. Like the rock ostinato, its virtue is
that it does not change.
```

After:

```text
**Montuno** is the right-hand pattern: a repeating syncopated figure built from
the chord's notes, locked to the clave and repeated for as long as the section
lasts. In the music it is often broken into single notes, in octaves; the
exercises here strip it to its rhythm, a chord on each clave stroke. Like the
rock ostinato, its virtue is that it does not change.
```

Evidence: `write_montuno` (`generate_exercises.py:5077-5101`, a chord on each clave stroke); guajeo as an arpeggiated, octave-doubled ostinato (Wikipedia Guajeo, cited in `latin.md` record §5 item 3).

**Edit 19 (W16, "neither is on the beat").**

`content/lessons/latin.md:33-34` at HEAD:

```text
**Putting them together.** Tumbao and montuno are independent and neither is on
the beat, which makes this the hardest coordination in the app. Build it in
```

After:

```text
**Putting them together.** The tumbao leaves each downbeat empty and the montuno
follows the clave, so the two meet on some strokes and not others, which makes this the hardest coordination in the app. Build it in
```

`content/lessons/latin.md:55-56` at HEAD:

```text
right hand over the tumbao in the left — neither part is on the beat, so
hearing the other one arrive is most of the work. The rung's songs are mostly
```

After:

```text
right hand over the tumbao in the left — the tumbao leaves each downbeat empty
and the montuno follows the clave, so
hearing the other one arrive is most of the work. The rung's songs are mostly
```

Evidence: `TUMBAO_OFFSETS = (1.5, 3.0)` (beat 4 struck); the montuno strikes beat 1 of the three-side bar (`latin.md` record §5 item 2).

**Edit 20 (W16, Malagueña).** Re-read (observed by script on 2026-10-05): LH bars 1-8 C♯2+G♯2 in halves and quarters; bars 9-20 a dyad over a C♯2 pedal, even bars six alternating eighths, odd bars dotted quarter, eighth, quarter.

`content/lessons/latin.7.md:30-32` at HEAD:

```text
sharp minor. In its opening pages the left hand is two positions — a two-note
chord, then a lower bass note under it — alternating in eighths, three of each
to the bar, while the right hand plays three- and four-note chords with the
```

After:

```text
sharp minor. Its first twenty bars hold the left hand on a low C sharp: open
fifths in halves and quarters for eight bars, then a two-note chord above that C
sharp, alternating with it — in eighths, three of each to the bar, in every other
bar, and in a dotted rhythm in the bars between — while the right hand plays three- and four-note chords with the
```

**Edit 21 (W17, distorted guitar; rock-metal#2).**

`content/lessons/rock.4.md:19-20` at HEAD:

```text
a chord major or minor, so leaving it out leaves a chord that is neither — which
is exactly why it sits under a distorted guitar without fighting the singer. On
```

After:

```text
a chord major or minor, so leaving it out leaves a chord that is neither — which
is why guitarists use it under distortion, where a full chord turns muddy. On
```

`content/lessons/rock.5.md:12` at HEAD:

```text
The power chord left the third out because a distorted guitar cannot hold one.
```

After:

```text
The power chord left the third out because under heavy distortion a third turns muddy.
```

Evidence: Wikipedia, Power chord (Analysis): distorted thirds produce messy intermodulation, so power chords are preferred (`rock-metal.md` record §5 item 1).

**Edit 22 (W17, the figure's hand).**

`content/lessons/rock.4.md:59-61` at HEAD:

```text
**How you'll know you've got it.** The left hand keeps the figure through a
whole page without speeding up, and the power chord sounds like weight rather
than like fingers.
```

After:

```text
**How you'll know you've got it.** The figure keeps going through a whole page
without speeding up — the right hand in the exercises, the left under
*Greensleeves* — and the power chord sounds like weight rather than like fingers.
```

Evidence: `make_ostinato` gives the figure to the right hand over a held left-hand octave; `rock.4.md:46-48` puts it under Greensleeves (`rock-metal.md` record §5 item 6).

**Edit 23 (W17, Annie's Song).** Re-read (observed by script): two `suspended-fourth` harmony elements, both in measure 0.

`content/lessons/rock.5.md:31-34` at HEAD:

```text
**Repertoire.** Two options, and neither is a rock song — this rung teaches a
sound, and both of these print it in their chord symbols.
*Annie's Song* uses a sus4 as a hinge in a plain folk progression, which is the
clearest possible illustration of the chord not settling. Sakamoto's *andata*
```

After:

```text
**Repertoire.** Two options, and neither is a rock song — this rung teaches a
sound. *Annie's Song* prints one Dsus4, beside D in its opening bar; what it shows
bar after bar is the open fifth in the left hand — root, fifth, octave, no third
— the shape the power chord began. Sakamoto's *andata*
```

**Edit 24 (W17, "eight bars").**

`content/lessons/rock.7.md:22-23` at HEAD:

```text
playing harder. Used alone it runs out after about eight bars, because a hand
has a ceiling and the ear stops hearing an increase as an increase. Used last,
```

After:

```text
playing harder. Used alone it soon runs out, because a hand
has a ceiling and the ear stops hearing an increase as an increase. Used last,
```

**Edit 25 (W17, Rachmaninoff and Moonlight).** Re-read (observed by script): `song.classical.beethoven-moonlight-iii` carries 113 dynamics elements.

`content/lessons/rock.7.md:51-54` at HEAD:

```text
stay small. The *Rachmaninoff* concerto opening is a build made almost entirely
of density: the chords thicken bar by bar and the dynamic follows rather than
leads. *Moonlight*'s finale is the one where the build is inside the writing
rather than marked over it.
```

After:

```text
stay small. The *Rachmaninoff* concerto opening is a build made almost entirely
of density: the chords thicken over its first bars, before the theme arrives over
arpeggios. *Moonlight*'s finale builds in its writing and in its markings both:
its pages carry over a hundred dynamic marks.
```

**Edit 26 (W16, the Cuban terms: the latin.6 study is not "the figure itself"; latin#5; A7c.2 term repair).** Added 2026-10-05 on the reviewer's ruling (`docs/review/responses/5831d42d.md`): the three Cuban-term corrections are absorbed here (Edits 26, 27, 28) before this seam dispatches. The published terms (the quarry's STYLE-VERIFICATION, citing Wikipedia, a secondary source): a guajeo is the broader repeated syncopated ostinato, often arpeggiated; montuno has several meanings, one of them a piano guajeo; ponchando is the block-chord, non-arpeggiated guajeo. The shipped montuno items are a block chord on each clave stroke, which `ABILITY-MAP.md` A7c.2 records as "the clave's rhythm played as chords, not a guajeo". No edit below calls the result an arpeggiated guajeo.

`content/lessons/latin.6.md:35-38` at HEAD:

```text
**The montuno is in the exercises**, because none of these three pieces writes
one out. The three-note study in D minor is the figure itself: every note is a
clave stroke, three strokes in one bar and two in the next, and it repeats
without changing. The tumbao study in G minor is the bass half — nothing on
```

After:

```text
**The montuno's rhythm is in the exercises**, because none of these three pieces
writes a montuno out. The three-note study in D minor is a rhythm-lock drill, not
the montuno figure itself: it plays a chord on every clave stroke, three strokes
in one bar and two in the next, and it repeats without changing, so your hands
learn where the clave falls. The tumbao study in G minor is the bass half — nothing on
```

Evidence: `write_montuno` (`generate_exercises.py:5077-5101`) writes one chord per clave stroke and nothing else; the claim "the figure itself" made it the montuno. The heading changes with the sentence because "The montuno is in the exercises" would otherwise contradict the next sentence. Edit 18's wording for `latin.md` (a chord on each clave stroke as the exercises' stripped-down rhythm) already agrees.

**Edit 27 (W16, the montuno generator: docstrings and titles; retitle without changing the music).** Four spots in `tools/content/generate_exercises.py`, each quoted at HEAD; the notes, rhythm, ids, family name, offsets and tempo do not change, so the music digest (`family_contracts.music_digest`, which reads only onset, length, pitch, tie, tempo and metre) is unchanged and no family version moves.

(a) `write_montuno`'s docstring, `:5080` at HEAD:

```text
    The guajeo on the clave's own strokes, appended to `rh`, two bars at a time.
```

After:

```text
    The clave's own strokes as chords, appended to `rh`, two bars at a time.
```

(b) `make_montuno`'s docstring, `:5153-5156` at HEAD (`:5157` stays as it is):

```text
    The right-hand montuno, locked to the clave.

    A guajeo is chord tones on the clave's own strokes, repeated without
    variation for as long as the section lasts — the lesson's phrase is that
```

After:

```text
    The right-hand clave-stroke study, locked to the clave.

    A chord on each of the clave's own strokes, repeated without variation: the
    clave's rhythm played as block chords, a rhythm-lock study that prepares the
    montuno. It is not itself a guajeo, the broader repeated syncopated ostinato
    that is often arpeggiated. The lesson's phrase for the montuno is that
```

(c) the learner-facing item title, `:5171` at HEAD:

```text
    title = f"Montuno — {voices} notes on {clave.replace('-', ' ')} in {note_name(tonic)} minor"
```

After:

```text
    title = f"Clave chords — {voices} notes on {clave.replace('-', ' ')} in {note_name(tonic)} minor"
```

(d) the groove title inherits the claim, `:5221` at HEAD:

```text
    title = (f"Latin groove — tumbao and montuno on {clave.replace('-', ' ')} "
```

After:

```text
    title = (f"Latin groove — tumbao and clave chords on {clave.replace('-', ' ')} "
```

The on-score direction at `:5174` (`"Every note is a clave stroke. It repeats without changing"`) is true of the item and stays. The groove's direction ("Neither hand is on the beat") is already recorded below as a fault outside this seam. The ids (`exercise.montuno.*`, `exercise.latin-groove.*`) are unchanged, so no learner state moves. Regenerate through the repo's own generate command; the entry lists every file that changed, which are the title text in the 15 `exercise.montuno.*` and the `exercise.latin-groove.*` scores and catalogue entries and nothing else. Confirm each regenerated item's `music_digest` equals the recorded one (`tools/content/tests/fixtures/identity_pins.json`, the `montuno` row, digest `391e7c0e…`, and the groove row), and that no title now wraps to more lines than it did where a spec measures title lines (grep `app/tests` and `docs/prompts/pictures` for the old titles and for the title-fit spec).

**Edit 28 (W16, the montuno finder disagrees with the shipped montuno items).** `content/curriculum/concepts.json:2278-2292` at HEAD (the amendment's `:2289` is the avoid line):

```text
      "id": "montuno",
      "display": "The montuno",
      "finder": {
        "skill": "playing the repeating Latin piano figure",
        "levelWords": "moderate to advancing, Grade 3 to 4",
        "constraints": [
          "a montuno figure",
          "clave underneath"
        ],
        "avoid": [
          "swing feel",
          "block chord accompaniment"
        ],
        "formats": "MusicXML or .mxl preferred; a PDF works but cannot be scored."
      }
```

After:

```text
    {
      "id": "montuno",
      "display": "The montuno",
      "finder": {
        "skill": "playing the repeating Latin piano figure",
        "levelWords": "moderate to advancing, Grade 3 to 4",
        "constraints": [
          "a montuno figure, in block chords on the clave's strokes or broken into single notes",
          "clave underneath"
        ],
        "avoid": [
          "swing feel"
        ],
        "formats": "MusicXML or .mxl preferred; a PDF works but cannot be scored."
      }
    },
```

Evidence: every shipped montuno item is a chord on each clave stroke (`write_montuno`), so a finder that excludes "block chord accompaniment" rejects the rung's own models, the same fault class as W7's finders; a block-chord montuno with its attacks on the strokes is the published ponchando. The tumbao finder (`concepts.json:4031-4045`), `stage-5.json:737-742` and `00-tracks.json:76` already say tumbao is bass and montuno is piano and are not touched. Splice as text (`CLAUDE.md`: the JSON round-trip hazard); grep `app/tests` and `tools/content/tests` for the old avoid string before editing.

**Verification.** The common list. The hymns.2 option change shows a different row on the rung page; the builder greps `app/tests/e2e` for the Joyful id and for `hymns.2` and runs any spec that names them, on the lane's own port. Edits 27-28 also run `py -3.11 -m pytest tools/content/tests` (including `test_family_contracts.py`, `test_generator_invariants.py`, `test_harmony_families.py` and `test_named_by_what_they_are.py`, whose forbidden-phrase list names `make_montuno`'s docstring), then `npm run content:build` and `npx vitest run` (the latin.6 claims tests read the built exercises); any test asserting the old titles is updated with the reason or the edit stops (S3).

**Acceptance for the learner.** A hymns.2 learner harmonises a correct melody; a holiday learner is told about bar 32; no chords-pop, latin or rock sentence contradicts its score or its exercise. A latin.6 learner is told the three-note study is a rhythm-lock drill and not the montuno figure; the exercise lists say "Clave chords" where they said "Montuno"; the montuno finder no longer excludes the block chords the rung's own exercises are; nowhere is the result called an arpeggiated guajeo.

**Stays self-checked, and the lesson says so:** the singing room (holiday), the re-voicing (chords-pop), the groove's feel (latin).

---

## Seam 1a.7: stage data — finders, a prerequisite, track names (W7 data, W2 data, W14 rename, W17 count)

**Claim made true.** "Find more" on chords-pop.7 to .9 no longer rejects the rung's own models; 4.7 comes after 4.6; the hymns track is named for what it teaches; the rock description counts its textures as the lesson does.

**Edit 1 (W7, chords-pop.9 finder).**

`content/curriculum/stage-9.json:325-335` at HEAD:

```text
                "constraints": [
                  "chord chart or lead sheet only",
                  "a song with distinct sections",
                  "room to change texture between sections",
                  "chord symbols printed"
                ],
                "avoid": [
                  "fully written-out arrangements",
                  "one texture throughout",
                  "instrumental etudes"
                ],
```

After:

```text
                "constraints": [
                  "a finished arrangement to work the chords out of, or a bare chord chart to arrange",
                  "a song with distinct sections",
                  "room to change texture between sections"
                ],
                "avoid": [
                  "one texture throughout",
                  "instrumental etudes"
                ],
```

Evidence: `chords-pop.9.md:29-31` (six written-out options, no chord symbols); SYNTHESIS A9 (verified).

**Edit 2 (W7, chords-pop.8 finder).**

`content/curriculum/stage-8.json:495-499` at HEAD:

```text
                "avoid": [
                  "fully written-out arrangements",
                  "one fixed key",
                  "instrumental pieces"
                ],
```

After:

```text
                "avoid": [
                  "one fixed key",
                  "instrumental pieces"
                ],
```

**Edit 3 (W7, chords-pop.7 finder).**

`content/curriculum/stage-7.json:600` at HEAD:

```text
                  "chord symbols printed"
```

After:

```text
                  "chord symbols printed, or a plain arrangement whose chords you can work out"
```

Evidence: `chords-pop.7.md:34-43` (plain substrates, "the colour left for you to add").

**Edit 4 (W2, 4.7 prerequisite; core#7).** In lesson `4.7` of `stage-4.json`, insert after the `requirements` array closes (line 593) and before `"estimatedDays": 21,` (line 594):

```text
              "prerequisites": [
                "4.6"
              ],
```

Evidence: lesson `4.6` carries `prerequisites` at `stage-4.json:525-529`; `4.7` has none; lesson prerequisites are lesson ids (`curriculum/prerequisites.ts:67`).

**Edit 5 (W14, the rename; hymns-gospel#5 row "Rename").**

`content/curriculum/00-tracks.json:61-62` at HEAD:

```text
      "title": "Hymns & gospel",
      "description": "Mini-module: four-part texture, passing chords and walk-ups.",
```

After:

```text
      "title": "Hymns & spirituals",
      "description": "Mini-module: put chords under a hymn tune, read four-part hymns, add walk-ups and passing chords, and play a hymn as a piano arrangement.",
```

`stage-3.json:936`: `"title": "Hymns & gospel",` → `"title": "Hymns & spirituals",`. `docs/02-curriculum.md:705`: `**Hymns & gospel**` → `**Hymns & spirituals**`. The track id `hymns-gospel` stays (an identifier). Evidence: `CURRICULUM-UPGRADE.md` §0.1 (the owner's decision); the wording is the record's proposal (`hymns-gospel.md` §10).

**Edit 6 (W17, the rock count; rock-metal#1).**

`content/curriculum/00-tracks.json:83` at HEAD:

```text
      "description": "Mini-module: the five textures a band arrangement reduces to on one piano, taught on public-domain music you already have.",
```

After:

```text
      "description": "Mini-module: the reduction to melody, bass and one texture, then four textures a band arrangement uses on one piano, taught on public-domain music you already have.",
```

`docs/02-curriculum.md:1203`: `two of \`rock.overview\`'s five textures` → `two of \`rock.overview\`'s four textures`. Evidence: `rock.overview.md:43-49` lists four. The generator comments and a test docstring that say "five" (`generate_exercises.py:5256,5507`, `test_harmony_families.py:1327`) are not learner-facing; recorded, not edited.

**Verification.** The common list. Track titles show on Settings and the plan; the builder greps `app/tests` for "Hymns & gospel" and for the rock description and runs any spec that names them, on the lane's own port.

**Acceptance for the learner.** The finder of a rung accepts the kind of score the rung itself offers; 4.7 opens after 4.6 for a learner with strict prerequisites on; the track names promise what is taught.

---

## Seam 1a.8: the modulation row (W11 data; CK-3)

**Claim made true.** The second progression of *Harmonic dictation — music that changes key* sounds the lesson's pivot modulation, C to G through A minor (`theory.8.md:16-19`), and is labelled the way an analysis labels it.

**Step 1, the run that confirms the present sound.** A unit test feeds `["C:I","C:vi","A:V7/V","D:V","D:I"]` through the drill's builder (`fromCatalog.ts` `dictationChords`, `:546-560`) and records the pitch-class sets it builds. Expected, from `music21.roman.RomanNumeral` in the named keys: C, A minor, B7, A, D (the third chord is V7 of E in A). If the builder sounds something else, stop and report before step 2.

**Step 2, the edit.**

`content/catalog.static.json:3162-3168` at HEAD:

```text
          [
            "C:I",
            "C:vi",
            "A:V7/V",
            "D:V",
            "D:I"
          ],
```

After:

```text
          [
            "C:I",
            "C:vi",
            "G:V7",
            "G:I"
          ],
```

**Step 3, CK-3.** The test asserts the new progression's four pitch-class sets against values computed by `music21.roman.RomanNumeral` (C: I; C: vi; G: V7; G: I → {0,4,7}, {9,0,4}, {2,6,9,0}, {7,11,2}), held as a fixture the script writes, never from the app's own `anyRomanToChord`. The label the card shows is the tokens joined (`fromCatalog.ts:566`): "C:I – C:vi – G:V7 – G:I".

**Files.** `content/catalog.static.json` (that one array), one test under `app/tests/unit/`, the fixture script under the lane's run folder, the records.

**Verification.** `npm run content:build`, `npx vitest run`, `npx tsc -b`, `npm run build`. No screen changes (the card text comes from the tokens).

**Acceptance for the learner.** On theory.8 and theory.9 the second progression plays C, A minor, D7, G, the pivot the lesson describes, with the key changing on the card where the dominant of G arrives.

**Stays unheard.** No one in this process hears the drill; the check is pitch-class sets against an oracle.

---

## Seam 1a.9: contrary-motion scales start at the unison (W4; CK-1, CO-1)

**Claim made true.** Every contrary-motion scale the app ships starts both thumbs on the same key-note and mirrors outwards, as core 4.1 says ("Start both thumbs on the same C and move outwards", `4.1.md:29-31`) and as the ABRSM Grade 1 table states ("contrary motion C major 1 octave hands starting on the tonic", `SOURCE-CHECK-reading.md`, ABRSM 2025-26 p.23).

**Observed defect** (`GENERATOR-ADDENDUM.md` G2, music21 over all 36 `exercise.scale.*contrary*` files): 20 start at the unison; 10 one-octave items start with the left hand an octave below (A♭, A, B♭, B, G♭, G major; A, B♭, B, G harmonic minor); 6 two-octave items start with the left hand an octave above, crossed (C, D♭, D, E♭, E, F). Re-observed on 2026-10-05 for one: `exercise.scale.a-flat-major.1oct.contrary.both.2` RH A♭4, LH A♭3.

**Hypothesis, and its refuting test.** In `make_scale` (`generate_exercises.py:1084-1102`) the left hand's contrary run starts at the top of its own preferred range (`run(lh_start, "down")` begins at `lh_start + 12 × octaves`), so its start depends on `lh_preferred` and the key, not on the right hand's start. Refuting test: if CK-1 run on the unchanged build reports a set other than these 16, the mechanism is something else; stop and report. The mechanism of the fix is the builder's.

**Contract (from G2), for every contrary item:** the first onsets of the two staves have equal letter and octave; the RH ascends `octaves × 7` scale steps and the LH mirrors it step for step; both return to the start; key, rhythm, bar count and the source fingering tables are unchanged; the `scale` family's version bumps under G21, and items whose notes do not change keep learner continuity through `generator_continuity.json`'s digest relation (the CL15 mechanism, `app/tests/unit/generatedIdentityContinuity.test.ts`). Similar-motion items change no note.

**CK-1.** A test under `tools/content/tests/` reads every built `exercise.scale.*contrary*` file and asserts the contract, from partitura events (the addendum's ADOPT: an independent parser; music21 wrote these files and is never their witness). It also enumerates every key and mode `make_scale` accepts in contrary motion, generated to a temporary folder under the worktree's `build/`, so a key no rung lists cannot regress. partitura is not installed on this machine (observed 2026-10-05: `ModuleNotFoundError`); the lane pins `partitura==1.9.0` (Apache-2.0) in `tools/content/requirements.txt`, which every workflow installs from, and installs it: a download the orchestrator approves at dispatch, and a dependency change the reviewer reads in this brief. If wave 1(d) has already added the pin, this lane uses it.

**CO-1, for the outside reviewer.** A Markdown file under the lane's run folder, within the reviewer's fetch limit: for each of the 16 changed items, bar 1 and the bar of the turn, each hand's notes with fingering as text, before and after. The reviewer reads text; no picture is needed. Denominator 16/16.

**The lesson sentence.**

`content/lessons/technique.4.md:26-30` at HEAD:

```text
**Contrary motion** is easier than it sounds and worth doing early: both thumbs
move at the same time, so the hands mirror each other rather than tracking two
different passages. The two-octave C major here is the one to start on: the
left hand begins on the C above the right hand's, so in the first bar they pass
through each other.
```

After:

```text
**Contrary motion** is easier than it sounds and worth doing early: both thumbs
start on the same C and move at the same time, so the hands mirror each other
rather than tracking two different passages. The two-octave C major here is the
one to start on.
```

**Files.** As in the seam table. Not touched: any other generator family, the catalog schema, app code.

**Verification.** `py -3.11 -m pytest tools/content/tests` (or the suite's own runner) including `test_generator.py`, `test_family_contracts.py` and the new CK-1 test; `npm run content:build`; `npx vitest run` (including `generatedIdentityContinuity.test.ts`); `npx tsc -b`; `npm run build`. No screen changes beyond the notes of 16 items.

**Acceptance for the learner.** A learner opening any contrary-motion scale on core 4.1, 4.2 or technique.4/.5 finds both thumbs on the same key-note in bar 1, as the lesson says, with the fingering unchanged.

**Stop conditions, besides S1-S4.** The version bump moves identities in a way `generator_continuity.json` cannot relate (an unchanged item losing its learner continuity); any similar-motion item's notes change; the fingering tables would need to change.

---

## Moved out of 1(a) while drafting, with the evidence

The map's 1(a) seam listed two text stations beside the corrections: A1.1's notation-marks section ("3.1 with 3.4 or 4.5") and A1.2's key-signature sentences ("2.3-2.5"). Both rest on "where the pieces first print them", and the facts read for this brief place the first prints earlier (observed by script over core song and exercise options at HEAD): repeat signs from 1.1 (*Kum Ba Yah*), first and second endings from 2.3 (*Was wollen wir trinken*) and a coda at 2.4 (*Ga je mee*), ties printed at 1.5, 2.2 and 2.3 before 2.4 teaches them, key signatures at 1.5 (*The Water Is Wide*, G) and 2.2 (*Alouette*, F; *Swing Low*, G) before 3.1. A sentence at 2.3-2.5 or a section at 3.4 would leave earlier prints unexplained. Under the map's own reverse condition ("a correction that turns out to need a station its ability builds later moves into that ability's wave"), A1.1 CONTROL and A1.2 MODEL/TRANSFER leave this wave as one seam, *notation at first print*, whose design question is per mark: teach it where it first prints, or move the item that prints it early (several of those items carry the 425 audit's MOVE verdict). That seam is the orchestrator's to schedule; nothing here decides it.

## Not in this wave, recorded

- **O Christmas Tree bar 32, the score fix (W15, holiday#1).** Gated on IM-4: read the PDMX source upload and a second edition of the carol for the harmony at bar 32, then repair through the reviewed-repair route (`tools/content/repaired_identities.json`, E50) with learner continuity. Until then, 1a.6 edit 12 warns the learner. No one may edit the score in this wave.
- **Found while drafting, outside every W row (classified, not fixed):** `frere-jacques.abc` `editionNotes` says the bell figure goes "upwards rather than down to the G below middle C" while its notes go down (C4 G3 C4); no screen reads `editionNotes` (grep of `app/src`: only its type at `curriculum/types.ts:35`), so it is a data fault no learner meets. *The Water Is Wide* (1.5) prints eighths, dotted notes, ties and a G signature before they are taught (425 audit: MOVE). The latin groove exercise's on-score text repeats "neither part is on the beat" (generator text; a regeneration of that family is outside 1a.9). `chords-pop`'s slash-chord exercise title says "a walking bass" (`generate_exercises.py:3873`). `blues.8.md:38-39` calls Black Bottom Stomp's tonal moves "the exact thing this rung is asking"; it is a multi-strain piece, not a transposed twelve-bar form (`blues-boogie.md` §5 item 2). The flattened Joyful PDMX edition stays reachable in the Library after 1a.6. `blues.4`'s song requirement can be met by the right-hand-only *12 Bar Blues*, which does not exercise the rung's boogie bass. A hymns.2 learner playing left-hand chords over a right-hand-only score is charged wrong keys in Keep tempo (`Scoring.ts:238-241`), for the existing options as for the new one.
