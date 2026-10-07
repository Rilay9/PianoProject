# Build brief, wave 1(c): the blues right hand over the learner's own left hand (exact contract, 2026-10-05)

Written under `briefs/wave1-contracts.md` for the outside reviewer to read before dispatch. Base: HEAD `a83a4167`; the worktree is cut from origin's head at dispatch and the dispatch line states the sha. "Before" blocks are quoted from the files at `a83a4167` by script; a block that does not match at the base stops that edit (S1).

## Decision rationale (§10b)

1. **Learner problem.** blues.9 asks for "one chorus a day ... over your own left hand" (`blues.9.md:26`) and nothing between blues.5 and blues.9 rehearses it: the lab and Duet supply the app's bass, so whenever the learner improvises, their own left hand is silent.
2. **Solution classes considered.** Code a bass-off lab setting; generate a new "left-hand groove plus right-hand fragment" family; a graded text task on the existing authored shuffles, using the chord chart with its accompaniment off; drop the promise.
3. **Chosen path, and why.** The graded text task, at blues.8, on the three authored twelve-bar shuffles. The chart already does what the middle steps need: both accompaniment layers start off, the learner's hands are the only sound beside a click, and a bar tracker shows the form. No code, no generator, no lab lane: the material and the mode exist.
4. **What would reverse it.** A builder's re-read finding either chip on by default, or the shuffles not opening in the chart, turns those steps into Metronome steps (the reviewer's fallback), saying so. A Berklee primary-source read (the map's D-gate for A7a.1, not yet read: `SOURCE-CHECK-reading.md` row T3 notes Berklee was outside that lane's list) that orders the steps differently changes the order, not the ability.
5. **Real problem or proxy.** The proxy is "the task is in the lesson". The finish: a learner can follow measured steps, then chart steps, to a twelve-bar chorus over their own left hand with every support gone, and the rung says the improvised steps are theirs to judge.
6. **Remaining uncertainty.** No one in this process can hear whether a chorus sounds like the blues: *unverified as music*, and the lesson says the judgement is the learner's.

**Learner-facing claim made true.** "Over your own left hand" (blues.9) is reached by steps a learner can take, from a left hand the app measures to a chorus with nothing on the screen.

**Read first, cited:** `WAVE1-FACTS.md` Part 1; `MODE-SHEET.md` §2 (Keep tempo), §13 (Duet), §15 (Chord chart), §30 (Metronome); `ABILITY-MAP.md` A7a.1 and §8.2; `docs/prompts/operating-procedure.md` §11, §12, §14; `docs/prompts/content-mistakes.md`.

## Facts the contract rests on (`WAVE1-FACTS.md` Part 1, observed at code, with this drafting's additions)

- **Both layers are off by default and both can be silenced.** `let comping = false` and `let backing = false` (`ChordChartScreen.ts:157,159`); chips *Comp* and *Bass + drums* (`:376-397`); pressing *Bass + drums* forces *Comp* on (`:392-395`). Only the both-off state is used here, which is the default.
- **The click runs through the whole run.** *Count off ▶* starts the metronome, which keeps ticking and drives the tracker (`:266-290`); its loudness is the global *Metronome volume* setting read at start (`:274`; Settings, `SettingsScreen.ts:370-373`, minimum 0). There is no chart control for the click.
- **The tracker cannot be hidden** (`drawForm`, `:195-202`; `form.hidden` only in `deadEnd`, `:525`). So "no tracker" is not a chart state: the last step leaves the chart.
- **The three authored shuffles open in the chart.** `exercise.blues.twelve-bar-shuffle.c`, `.f`, `.g`: 12 bars, one dominant-seventh symbol a bar (C: C C C C F F C C G F C G), tempo 88 or 92. Left hand C2 G2 A2 G2 in eighths (root, fifth, sixth, fifth), right hand held sevenths (observed by script). They are song options of blues.4 and blues.5; from the Library, the Score screen's ⋯ controls carry a *Chord chart* row for any item with symbols (`ScoreScreen.ts:2181-2186,5349`).
- **Nothing in the chart is stored or judged for the record** (no run, session or progress import in `ChordChartScreen.ts`); its live bar cell checks whether at least 60 % of the bar chord's pitch classes are held (`:57-58,204-216`), which a single-note left hand or a right-hand fragment mostly fails.
- **blues.8 counts only exercises** (`stage-8.json:379-385`, `runs from exercises count 1`); an `unjudged` requirement is shown and never counted (`rungState.ts:341`).
- **Why the shuffles are not added to blues.8's option list:** a placement is a teaching-use claim under the F2 rule (`ABILITY-MAP.md` §5.1) and the shuffles sit at levels 3.4-4.1 against blues.8's band 6.2-8.7 (`stage-8.json:399-402`); the Library and the ⋯ *Chord chart* row reach them without a new placement.

## Completion treatment, decided

The task's improvised steps complete on the learner's own word (`ABILITY-MAP.md` §8.2 CT-2's treatment, as `briefs/wave1-contracts.md` asks), stated in the lesson. The rung itself is unchanged: blues.8 stays met by its one exercise run, as today (CT-1's structure, which the map gives A7a.1). Turning blues.8 into a CT-2 rung would drop its measured exercise requirement, which nothing here justifies. The task is also shown on the rung page as an `unjudged` requirement, which the page prints as the learner's and never counts.

## Files

May touch: `content/lessons/blues.8.md` (lines 25-31 and 52-53 only), `content/lessons/blues.9.md` (lines 26-29 only), `content/curriculum/stage-8.json` (lesson `blues.8`, `requirements` only). Must not touch: app code, any score, the lab presets, any other lesson or stage block. Wave 1(a) seam 1a.4 also edits `blues.8.md` (lines 2, 47-50), `blues.9.md` (31-33) and `stage-8.json` (titles, `tools`, `finder`): disjoint lines and keys. This lane is cut after 1a.4 has merged, or rebases onto it; no "before" block here is touched by 1a.4.

## Edits

**Edit 1, the graded task.** Insert after line 28 of blues.8 (the end of "Comping over your own bass"), as new paragraphs:

```text
**A chorus of your own, over your own left hand.** The next rung asks for
choruses over your own left hand, and this is the way there, one support taken
away at a time. Use the twelve-bar shuffles from Stage 4, in C, F and G: their
left hand, root–fifth–sixth–fifth, is one you already own. They are in the
Library, and the Score screen's ⋯ controls open each one as a *Chord chart*.

1. **The left hand alone, measured.** Open the shuffle in C, choose L, and play
   it in *Keep tempo* while the app plays the right hand's held sevenths. Then
   both hands, as written.
2. **Over the chart, bars 1 to 4.** Open the same shuffle as a *Chord chart*.
   *Comp* and *Bass + drums* both start off, so all you hear is the click and
   your own hands, and the bar tracker shows where you are; lower the tempo if
   you need to. Keep the left hand going through all twelve bars. In bars 1 to 4
   only, add a right hand of two or three notes from the blues scale — E flat
   sliding onto E, say, or G, B flat, C — then let it rest until bar 1 comes
   round.
3. **Bars 1 to 4 and 9 to 12.** The same, with the right hand answering itself
   in the last four bars too.
4. **The whole form.** A right hand in every bar, still in short pieces with
   space around them. Then in F and in G.
5. **No click.** In Settings, set *Metronome volume* to 0 and play the form in
   the chart with only the tracker; set it back afterwards, because it is the
   same click everywhere in the app.
6. **No chart.** Close the chart — its bar tracker cannot be hidden. Choose the
   key and the left-hand figure yourself (the shuffle, or a boogie from Stage
   6), count yourself in, and play one chorus with nothing on the screen.
   Record it on your phone and listen to it once.

The chart's bar cell lights when you hold the bar's chord, which this task does
not do; ignore it. The chart keeps nothing and marks nothing, so step 1 is the
only one the app measures. Steps 2 to 6 are yours to judge — the steadiness of
the left hand, the ideas in the right, whether it sounds like the blues — and
you move on when you say so.
```

**Edit 2, "What to practise".**

`content/lessons/blues.8.md:30-31` at HEAD:

```text
**What to practise.** The form in two new keys. Then the same form with ninths
throughout, in the key you started in.
```

After:

```text
**What to practise.** The form in two new keys. Then the same form with ninths
throughout, in the key you started in. Alongside, one step of the chorus ladder
above at a time, moving on when the step before feels easy.
```

**Edit 3, "How you'll know".** (1a.4 does not edit these lines.)

`content/lessons/blues.8.md:52-53` at HEAD:

```text
**How you'll know you've got it.** Twelve bars in a flat key, with ninths, from
memory.
```

After:

```text
**How you'll know you've got it.** Twelve bars in a flat key, with ninths, from
memory. And a chorus of your own right hand over your own left, with nothing on
the screen: the app marks the rung on its exercises, and that chorus is yours to
judge.
```

**Edit 4, blues.9's wording (the INDEPENDENCE step).**

`content/lessons/blues.9.md:26-29` at HEAD:

```text
**What to practise.** One chorus a day, recorded, over your own left hand. Listen
to it once and then delete it. The app's **Listen back** is on the backing-track
drills at Stages 4 and 5, and you are past those now — here the left hand is
yours, so record it on whatever is in your pocket.
```

After:

```text
**What to practise.** One chorus a day over your own left hand, with nothing on
the screen — no chart and no click, the last step of the ladder on the rung
before — in a key and with a left-hand figure you choose. Record it on whatever
is in your pocket, listen to it once and then delete it. The app's **Listen
back** is on the backing-track drills at Stages 4 and 5, and you are past those
now: here the left hand is yours.
```

**Edit 5, the rung shows the task as the learner's.** Append to lesson `blues.8`'s `requirements` array in `stage-8.json` (after the `runs` entry ending at line 384), spliced as text:

```text
                {
                  "kind": "unjudged",
                  "rule": "chorus-over-own-left-hand",
                  "says": "A chorus of your own right hand over your own left-hand groove, with no chart and no click.",
                  "why": "Improvised notes are not a run the app judges, and the chord chart stores nothing."
                }
```

## Verification, by what the seam touches

Re-read before editing (S2), at the base: `ChordChartScreen.ts:157,159` (both `false`), `:376-397` (the chip labels *Comp* and *Bass + drums*), `ScoreScreen.ts:2181-2186` (the row label *Chord chart*), `SettingsScreen.ts:370` (the label *Metronome volume*). Then `npm run content:build`; `npx vitest run` after it; `npx tsc -b`; `npm run build`; `py -3.11 tools/content/lint_absolutes.py --lesson blues.8` and `--lesson blues.9`. No screen behaviour changes; the rung page gains one `unjudged` line, which the content build validates. Grep `app/tests` for assertions on blues.8's requirement count; update with the reason or stop (S3).

## Acceptance, for the learner

A blues.8 learner finds six steps from a measured left hand to a chorus with nothing on the screen, each naming the screen and setting it uses, and reads which step the app measures and that the rest are theirs to judge; blues.9's daily chorus is the last of those steps.

## What stays self-checked, and the lesson says so

A steady left hand through the form in the chart steps, the right-hand ideas, the recording and the listening, and whether it sounds like the blues (*unverified as music*; no actor in this process can hear it).

## Stop conditions

S1 a "before" block mismatch; S2 a re-read fact fails (a chip on by default, a label different, the shuffles without a *Chord chart* row): the affected step is rewritten on the Metronome fallback (the Metronome is on *Today*, `TodayScreen.ts:1127`) and the entry says why; S3 a test asserting blues.8's requirements with no plain reason to change; S4 any file outside the list. Every item done or an explicit not-done line.

## Record lines

A `docs/pending-review.md` entry: the four lesson edits and the requirement line, the chart facts each step relies on (with lines), the fallback taken for the last step and why (tracker permanent, click global), the completion treatment, the D-gate left open, the content-mistakes items checked (9 and 15). No test-map row unless a test changes.
