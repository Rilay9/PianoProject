# P12b — harmony, ear, reading, and the rungs that stopped at Stage 5

Date: 2026-09-06 · Branch: `feat/p12b-harmony-ear` · Supersedes nothing; completes the
"What is not done" list in `2026-09-06-p8-drills-ui.md`.

## What this phase was for

Five tracks ended at Stage 5. Jazz had one unit in the whole curriculum and three items in
the whole catalog; blues, chords-pop, theory and improvisation each stopped at the same
place. The skills their lessons already described — the four-chord loop in every key, shell
voicings, walking bass, modes, transposition, harmonic dictation — had no exercise and no
drill anywhere. This phase built the material and then the rungs to hang it on.

## Decisions

### 1. Chord symbols are spelled by interval, not by pitch class

`Pitch.transpose(4)` is not a major third. It is *some* pitch four semitones up, spelled by
whatever music21 thinks that pitch class is usually called, and in A flat major that turned
the tonic itself into G sharp — so a chart in A flat printed `G#m7` where A flat's ii
belongs. Every chord tone in the harmony families now transposes by a *named* interval,
which keeps the letter.

Three follow-on rules, each of which cost a wrong-looking exercise to find:

- **Double accidentals are respelled.** The flat keys produce them freely: the tritone
  substitute in B flat is spelled B double flat by interval, and the quartal stack in G flat
  reaches both B double flat and E double flat. A single flat in a flat key is left alone.
- **A chromatic chord root is simplified, a diatonic one is not.** The flat II is borrowed
  from outside the key, so spelling it by the key signature gives C flat in B flat and F flat
  in E flat, and no lead sheet has ever printed either. Diatonic degrees keep their key
  spelling, which is why E sharp survives as the seventh degree of F sharp major.
- **The harmony families use F sharp where the scale families use G flat.** A chart in G flat
  prints its IV chord as C flat. The same music in F sharp prints B. Scales are about the key
  signature and the fingering, so `MAJOR_KEYS` keeps G flat; charts are about letters, so
  `HARMONY_KEYS` uses F sharp. Two lists, because they answer different questions.

### 2. The chord-boundary rule is 120 ms *and* the next expected chord

P8 left this open. The rule implemented is: a chord is complete when no new note has arrived
for 120 ms, **or** when a note arrives that belongs to the next expected chord and not to this
one.

The second half is what makes it work. A progression played in time leaves no 120 ms gap
anywhere — a quarter note at ♩=120 is 500 ms, but a player moving between chords leaves
nothing like that — so a silence rule alone would read a whole ii–V–I as one twelve-note
chord. The silence half is what closes the *last* chord, which is followed by nothing at all;
that is why `ChordDictationDrill` has a `tick()` and the screen drives it on a timer.

120 ms is chosen as roughly four times the spread of a rolled chord and roughly a quarter of
the shortest gap a progression is played with. It is a threshold, not a fact, and it is one of
the four numbers in the owner guide's section 8 that only the owner's own piano can settle.

### 3. Sight-reading levels 5–7 are rules, not a trained model

`05` §8 wrote levels 5+ as "melodic contours from a Markov table trained on the `[AUTH]` folk
corpus (build-time)". Dropped, per the P11 replan §3.2. A trained table needs a corpus at
build time, ships a model with the app, and buys nothing that a chord-tone rule does not —
while putting the one property that matters at risk, which is that a failed sight-read can be
retried on exactly the same music. `05` §8 now carries the three rows that replaced it.

### 4. Two bugs found by the new tests, fixed here

- **Chord degrees were counted from index 0 of the scale array.** That array starts at the
  level's lowest playable note — F2 at level 4, A1 at level 7 — so "degree 0" built the tonic
  chord on whatever note that happened to be, and the left hand played a different harmony
  from the one the right hand was written over. This is a fix to level 4 as well as to the new
  levels; the chord-tone test is what made it visible.
- **The drill screen settled an answer whenever `answered` grew.** For a rhythm row that count
  grows on every tap, so the drill ended 450 ms after the first one. Nothing caught it because
  the rhythm e2e never tapped. The four kinds whose answer is one long gesture — rhythm,
  backing-track, pedal, dynamics — now wait for "Done", and harmonic dictation joins them.
- **The error log ordered by `lastAt`.** Two errors in the same millisecond compared equal, so
  "most recent" was whichever was inserted first, which is the older one. Failing three runs in
  five before this phase touched anything; ordered by a counter now.

### 5. The 30-minute template loses free play

`02` Part A §8 asks for a three-minute sight-reading slot in the 30- and 60-minute templates,
with the minutes "taken from free play in the 30". Free play was two minutes, so the third
comes from repertoire. The 60 takes all three from repertoire as the doc says.

### 6. Jazz and blues rungs are `songOptional`, and say why

There is no public-domain jazz or blues repertoire in the catalog: the 1918–1920 standards
that are free in the US are not imported yet. Marking those rungs `songOptional` and naming
what to import in the lesson text is honest; inventing three song options so a counter passes
would not be. P14's quarry is where the repertoire is expected to come from.

## What is not done

- **Ragtime stops at Stage 8, technique at 8, rock-metal at 5, core at 4.** Out of this
  phase's scope, which named five tracks. Core stopping at 4 is by design (`02` Part B); the
  other three are gaps somebody should look at.
- **Hymns, holiday and latin remain mini-modules**, as the prompt asks. They have five
  exercise options each now rather than three.
- **The chord boundary has never met a real piano with the pedal down.** A sustained chord
  under pedal may hold notes into the next one, and no test here can tell. It is in the owner
  guide.
