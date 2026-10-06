# Build brief, wave 1(b): early core transposition (exact contract, 2026-10-05)

Written under `briefs/wave1-contracts.md` for the outside reviewer to read before dispatch. Base: HEAD `a83a4167`; the worktree is cut from origin's head at dispatch and the dispatch line states the sha. "Before" blocks are quoted from the files at `a83a4167` by script; a block that does not match at the base stops that edit (S1).

## Decision rationale (§10b)

1. **Learner problem.** A core learner is told that "a song you know in C becomes a song you can play in any key" (`3.2.md:12-14`) and is never asked to do it; practice.5 tells a Stage 1 learner to "transpose it" with no how-to (`practice.5.md:41`); later tracks assume the skill.
2. **Solution classes considered.** Wait for the transposition drill (level 6.3, far too late); generate transposition items; a text task on existing paired material with an exact check; leave it to chords-pop. Inside the third: which pair is exact (below).
3. **Chosen path, and why.** Two text tasks and one data line, no generator. At 2.5, the learner plays the right hand of *Ode to Joy (full theme)* a fifth higher, in G, then checks it with Blind against the shipped G edition, which is the C theme moved up a fifth event for event. At 3.2, a tune in a key nobody printed, with I-IV-V7 under it, self-checked. Real shipped material beats a generated pair; the map's 1.2 check against the five-finger G exercise is refuted (below).
4. **What would reverse it.** If the hidden check cannot be opened from 2.5 with the page hidden from the start, the 2.5 task becomes self-checked and says so. If a reader shows the Ode's G edition differs from the C theme a fifth up in any event, the check narrows to the bars that match.
5. **Real problem or proxy.** The proxy is "a task sentence exists". The finish: a 2.5 learner transposes a known tune without a printed copy and the app judges every note against an exact target; a 3.2 learner plays a known tune and its chords in an unprinted key, and the page says that one is theirs to check.
6. **Remaining uncertainty.** Placing the G edition on 2.5 also puts it in the pool *Today* draws from (`session.ts:1093-1171` read the reached rungs' options), so a learner may be handed it with the page showing before doing the task; the lesson says what to do, and the lane measures whether it happens (Verification). Blind cannot show that the learner transposed rather than read: the G edition is a tap away in the Library and the run is not recorded as blind (`MODE-SHEET.md` §10). That stays the learner's word, and the lesson says so. Nothing has been heard.

**Learner-facing claim made true.** "A song you know in C becomes a song you can play in another key" is something the core path asks the learner to do, once with an exact check, once on their own.

**Read first, cited:** `WAVE1-FACTS.md` Part 2; `SOURCE-CHECK-reading.md` row C3 (Faber introduces transposition at Level 1, C five-finger to G five-finger; continues at 2A and 2B; ABRSM and RCM do not require it); `MODE-SHEET.md` §10 (Blind), §5 (standalone Free play), §25 (the chord drill); `docs/prompts/operating-procedure.md` §11, §12, §14 (the harness); `docs/prompts/content-mistakes.md`.

## Facts the contract rests on (observed, `WAVE1-FACTS.md` Part 2 and this drafting)

- **The exact target.** `song.classical.ode-to-joy.g` right hand equals `song.classical.ode-to-joy.full` right hand plus a perfect fifth, bars 1-17, 63 of 63 events, pitch with octave, onset and duration (music21 over the built files).
- **No accidental is needed.** The G edition's right hand uses D4, G4, A4, B4, C5, D5 (observed by script on 2026-10-05): the G five-finger position plus the D below, the same shift the C theme makes in bar 12 (`2.5.md:18-19`). So the task fits 2.5, before 3.1 teaches key signatures.
- **What is not exact.** The 8-bar `ode-to-joy.rh` moved up a fifth differs from the G edition in bars 4 and 8 (the `.rh` cadences are two half notes). `exercise.five-finger.g-major.right` differs from the transposed Ode at its first event (G4 against B4). `song.folk.when-the-saints.f` is a different arrangement. So the map's 1.2 task, checked against the five-finger G items, is refuted, and no 1.2 task is checked.
- **Twinkle in F is exact but not usable as this check.** `song.folk.twinkle.f` equals `twinkle.rh` plus a perfect fourth, bars 1-12; but F major needs B flat (taught at 3.1), and the F edition is printed on 3.1's own option list, so by 3.2 the learner may already have read it. It is a second, different task (up a fourth) and is not used here.
- **Where the edition is printed now.** `ode-to-joy.g` is on 3.1 and 4.1, not on 2.5. 2.5's requirements count exercises only (`stage-2.json:416-443`: two `runs from exercises`, a `skill`, an `unjudged`; `songOptional: true`), so a song added to 2.5's `songOptions` changes no gate.
- **Blind opens a rung's own option with the page hidden from the first moment.** A `blind` tool's `item` must be one of the rung's options (`types.ts:519-530`; `LessonScreen.ts:581-595,674-679`, `navigateScore(id, { blind: true, from })`); `validate.py` refuses any other. The keys guide still lights the next key unless it is off: Settings → *Keys guide* → *Off* (`SettingsScreen.ts:328-341`), or *Keys* → nothing in the Score screen's ⋯ controls (`ScoreScreen.ts:2204`).
- **Unprinted keys exist among the taught ones.** No shipped copy prints *Twinkle* in G or the *Ode* in F (catalog search by id, title and `variantOf`, `WAVE1-FACTS.md` Part 2 §1). Twinkle in G needs no sharp (G G D D E E D, C C B B A A G); the Ode in F needs B flat, which 3.1 teaches.

## Files

May touch: `content/lessons/2.5.md`, `content/lessons/3.2.md`, `content/lessons/practice.5.md`, `content/curriculum/stage-2.json` (lesson `2.5`: `songOptions`, `tools` only). Must not touch: any score, the catalog, app code, any other lesson or stage block.

## Edits

**Edit 1, data: the G edition joins 2.5, hidden.** In lesson `2.5` of `stage-2.json`:

`content/curriculum/stage-2.json:408-411` at HEAD:

```text
              "songOptions": [
                "song.classical.ode-to-joy.full",
                "song.classical.beethoven-ode-to-joy.easy"
              ],
```

After:

```text
              "songOptions": [
                "song.classical.ode-to-joy.full",
                "song.classical.beethoven-ode-to-joy.easy",
                "song.classical.ode-to-joy.g"
              ],
```

and lesson `2.5` gains a `tools` array (it has none at HEAD; insert it after `"songOptional": true,` at `stage-2.json:448`, spliced as text):

```text
              "tools": [
                {
                  "kind": "blind",
                  "item": "song.classical.ode-to-joy.g",
                  "label": "Check your G version, page hidden"
                }
              ],
```

**Edit 2, the 2.5 task.** Replace 2.5's pointer to the G edition:

`content/lessons/2.5.md:34-38` at HEAD:

```text
one octave, hands separately, slowly, watching only the thumb. Then *Ode to Joy (full theme)*, the
piece this rung is for: its one move is the bar-12 shift, not a thumb-under,
so the scale is where the thumb gets its practice. Its version in G is on the
next rung, once the key has a sharp in it, and the
*Ode to Joy (easy variation)* on this rung is in G already.
```

After:

```text
one octave, hands separately, slowly, watching only the thumb. Then *Ode to Joy (full theme)*, the
piece this rung is for: its one move is the bar-12 shift, not a thumb-under,
so the scale is where the thumb gets its practice. The *Ode to Joy (easy
variation)* on this rung is in G already.

**The same tune, a fifth higher.** Once the theme goes in C, play its right hand
again with your thumb on G instead of C: every note five letters higher, so E
becomes B, F becomes C and the bar-12 drop to the lower G lands on the lower D.
Most of the tune sits in the G position (G A B C D under your five fingers), and
there is no black key. Where the C version reaches down to its lower G, reach
down, or shift your hand, to the D below the position. Work it out with your ear
and the fingering you already have, and do not look it up.
Then check it: *Check your G version, page hidden* opens *Ode to Joy (in G
major)* with the notation hidden from the start. Choose R, turn the keys guide
off (Settings, *Keys guide*, *Off*; or *Keys* to nothing in the ⋯ controls),
and play your version. That printed edition is the C theme moved up a fifth note
for note, so the app marks your notes against exactly what you were aiming for.
What it cannot know is how you found them: it does not record that the page was
hidden, and it cannot tell transposing from reading, so do not open that edition
with the page showing until you have played it this way. If *Today* offers it to
you before then, leave it for another day.
```

**Edit 3, 2.5 "How you'll know".**

`content/lessons/2.5.md:48-50` at HEAD:

```text
**How you'll know you've got it.** C major scale, hands separately, one octave
up and down in eighth notes at 60 bpm, 95 % accuracy, with no audible bump where the
thumb passes.
```

After:

```text
**How you'll know you've got it.** C major scale, hands separately, one octave
up and down in eighth notes at 60 bpm, 95 % accuracy, with no audible bump where the
thumb passes. And the theme's right hand played in G from your own working-out,
checked with the page hidden; the app marks the notes, and that you worked them
out rather than read them is yours to know.
```

**Edit 4, the 3.2 task in a key nobody printed.** Insert after line 14 of 3.2 (the end of its opening paragraph), as a new paragraph:

```text
**Do it once in a key nobody printed for you.** Take *Twinkle* into G, or the
*Ode* into F — neither is printed in that key anywhere in the app. Play the tune
in the right hand, then put I, IV and V7 of the new key under it in the left,
changing where the tune asks. *Free play* names each chord you hold, so you can
check the shapes; whether the tune and the chords are right together is yours to
hear and judge, and nothing records it.
```

**Edit 5, practice.5's clause.**

`content/lessons/practice.5.md:40-43` at HEAD:

```text
**Three things to change.** When in doubt, change one variable: **the tempo**
(much slower, or briefly much faster), **the key** (transpose it — it forces
you to think rather than recall), or **the order** (start from the middle, or
play it backwards a phrase at a time).
```

After:

```text
**Three things to change.** When in doubt, change one variable: **the tempo**
(much slower, or briefly much faster), **the key** (transpose it: move a tune
from the C position to the G position, every note five letters higher, to
start, and rung 2.5 checks one for you, including the one reach below the
position — it forces you to think rather than recall), or **the order** (start from the middle, or
play it backwards a phrase at a time).
```

## Verification, by what the seam touches

`npm run content:build` (validate refuses a `blind` item that is not the rung's option); `npx vitest run` after it; `npx tsc -b`; `npm run build`; `py -3.11 tools/content/lint_absolutes.py --lesson 2.5` and `--lesson 3.2` and `--lesson practice.5`. A screen changes (2.5 gains a tool button and a song row), so on the lane's own port: `app/tests/e2e/lesson-tools.spec.ts`, and one assertion added there or beside it that the 2.5 button lands on `song.classical.ode-to-joy.g` with the notation hidden. A test-map row for that assertion. A content check that `2.5.md` and `practice.5.md` name the lower D (or the reach below the position) and contain neither "holds all of it" nor "same fingers". One more measurement, reported and not fixed: a unit test over the session's slot choice for a learner at 2.5 (the existing session test helpers) says whether *Today* can hand `song.classical.ode-to-joy.g` to that learner with the page showing, and on which slot; if it can, the entry says so plainly for the orchestrator, because keeping it out of *Today* would be a product decision outside this seam. Before editing, grep `app/tests` for `2.5` option counts or tool lists that the new row and button would break; such a test is updated with the reason, or the lane stops (S3).

## Acceptance, for the learner

At 2.5 the learner finds a task to play the theme in G from their own working-out and a button that opens the exact target with the page already hidden. The task teaches the actual range, D4 to D5: most of the tune sits in the G position, and the learner reaches or shifts to the lower D where the C version drops to its lower G; it does not say that a fixed five-finger position covers the whole tune or that the fingers are the same throughout. The target stays exact (63 of 63 events) and the hidden-page check is unchanged; the page says what the app marks and what it cannot know. At 3.2 the learner is asked to play a known tune with its chords in a key nobody printed, and is told that one is theirs to judge. practice.5's advice says how to transpose and where it is checked.

## What stays self-checked, and the lesson says so

That the 2.5 version was worked out and not read; the 3.2 task entirely (Free play is a readout and stores nothing, `MODE-SHEET.md` §5). The keys guide setting is global: the lesson tells the learner where it is, not that the app changes it.

## Stop conditions

S1 a "before" block mismatch; S2 the button does not open `ode-to-joy.g` with the notation hidden from the first frame (then the task is rewritten as self-checked, saying the check needs the page hidden, and the lane reports it); S3 a test asserting 2.5's old tools or options with no plain reason to change; S4 any file outside the list. Every item done or an explicit not-done line.

## Record lines

A `docs/pending-review.md` entry: the three lesson edits and the data line, the exactness evidence (63/63, `WAVE1-FACTS.md`), the refuted 1.2 check and why Twinkle in F is not used, what stays self-checked, the content-mistakes items checked (9: "contains" is not "the learner can"; 15: nothing heard). A `docs/08-test-map.md` row for the new assertion.

## Correction 2026-10-05 (reviewer item 1, `docs/review/responses/5831d42d.md`)

The exact target spans D4 to D5 (this brief's own fact), and a G five-finger position (G-A-B-C-D) does not contain the lower D, so the learner text may not say the position holds all of it or that the fingers are the same throughout. The 63-of-63 event target and the hidden-page check are unchanged.

Edit 2, the instruction. Before:

```text
again with your thumb on G instead of C: the same fingers, every note five
letters higher, so E becomes B, F becomes C and the bar-12 drop to G lands on D.
The G five-finger position holds all of it, and there is no black key. Work it
out with your ear and the fingering you already have, and do not look it up.
```

After:

```text
again with your thumb on G instead of C: every note five letters higher, so E
becomes B, F becomes C and the bar-12 drop to the lower G lands on the lower D.
Most of the tune sits in the G position (G A B C D under your five fingers), and
there is no black key. Where the C version reaches down to its lower G, reach
down, or shift your hand, to the D below the position. Work it out with your ear
and the fingering you already have, and do not look it up.
```

Edit 5, practice.5's clause (it repeated the same-fingers claim). Before:

```text
(transpose it: a five-finger
tune moved from C position to G position, the same fingers and every note five
letters higher, is enough to start, and rung 2.5 checks one for you — it forces
you to think rather than recall)
```

After:

```text
(transpose it: move a tune
from the C position to the G position, every note five letters higher, to
start, and rung 2.5 checks one for you, including the one reach below the
position — it forces you to think rather than recall)
```

Acceptance. Before: "At 2.5 the learner finds a task to play the theme in G from their own working-out and a button that opens the exact target with the page already hidden; the page says what the app marks and what it cannot know."

After: "At 2.5 the learner finds a task to play the theme in G from their own working-out and a button that opens the exact target with the page already hidden. The task teaches the actual range, D4 to D5: most of the tune sits in the G position, and the learner reaches or shifts to the lower D where the C version drops to its lower G; it does not say that a fixed five-finger position covers the whole tune or that the fingers are the same throughout. The target stays exact (63 of 63 events) and the hidden-page check is unchanged; the page says what the app marks and what it cannot know."

Verification gains one line: a content check that `2.5.md` and `practice.5.md` name the lower D (or the reach below the position) and contain neither "holds all of it" nor "same fingers".
