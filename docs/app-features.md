# What the app can do: modes, tools and the content they take

A reference for planning lessons and preparing content (owner, 2026-10-12): what each mode and tool is for, how it
works for the learner, what it judges, and what content it accepts. **Keep it current:** whoever changes a mode's
behaviour, its settings or a content format updates its section here in the same commit. The code is the final word
when the two disagree (paths are given); the owner's decisions behind each design are in `docs/inputs/` and the
commit history.

How things are reached is temporary: a song list, and a ⋯ menu that opens Memorise, Simon, Drills and Free play.
The library, history and projects that will hold lessons are not built yet. So for now, plan a lesson as
"this piece/set, in this mode or tool, with these settings".

---

## 1. Score screen: songs and exercises

**For:** reading and playing a real piece (a song, or a short exercise piece or loop written as music), with the
music always readable ahead of where you are.

**Content:** MusicXML (`.musicxml`) files in `web/public/scores/`, listed in `scores/index.json` with
`{ id, title, composer, file, source: { dataset, uploadTitle }, license, licenseUrl, status }`. Exercises (scales,
five-finger patterns, cadences as music) are simply short scores. Fingering written in the file shows when Display →
Fingering is on; the learner can add their own (⋯ → Edit fingering).

**What the learner sees:** the music laid out to keep what comes next in view: *Turn* (slots that swap as you
play) or *Rolling* on a phone upright, a scrolling single line (*smooth* or *still then glide*) on a phone sideways,
*Turn* on a tablet. A marker moves through it (a bar, coloured notes, or both; per hand or across hands). Under the
music: a keyboard strip and/or note names. Display settings (size, spacing, layout, slots, bars per line, bar
numbers, tempo marks, fingering, lyrics, marker, what is under the music, "Music while playing", theme) are kept per
kind of screen, with a default plus each song's own (`web/src/settings.ts`, `web/src/follow.ts`).

**Hands:** L / R / Both / Off. In Watch these are the hands the piano plays; in the other modes the hands *you*
play (the piano plays the rest; Off = you play everything, piano silent). Tempo: speed and beats per minute, ±5,
tap tempo; metronome (click sound, beats/quarters/eighths, volume); piano through the phone or out to the MIDI
keyboard. Loop: tap the first and last bar; one bar of count-in clicks each time round (none in Wait for me).

**Modes** (bottom bar; saved per song) — `web/src/main.ts`, `web/src/practice.ts`, `web/src/matching.ts`:

| Mode | For | How it works | Judged |
|---|---|---|---|
| **Watch** | hearing and seeing the piece | the app plays; the marker follows the sound | nothing |
| **Wait for me** | learning the notes without time pressure | the marker waits at each of your notes until all its keys are down (freshly pressed); the piano plays the other hand up to your next note; held piano notes ring on | nothing scored; it simply waits |
| **Play along** | playing at tempo | the piece runs at its tempo with the piano playing the other hand; at the end a summary | each note on time / early / late / missed, keys not in the score; *On time*: relaxed ±200, normal ±100, strict ±50 ms; the weakest bars offered as a one-tap loop |
| **Ladder** | building speed on a passage | Play along round a loop; a clean pass (every note on time, nothing wrong) raises the speed a step (2 / 5 / 10 %), a messy one lowers it; never above the written tempo | as Play along, per pass |
| **Rhythm** | the rhythm alone | Play along where any key counts: one tap per note or chord (keys within 30 ms are one tap) | timing of each tap; extra taps |

Starting: ▶, or just play your first note (any key on a rest; any key in Rhythm and Wait for me). In the judged
modes it pauses by itself on silence (3 s with two or more of your notes due) or on mashing (6+ keys not in the
score within ¼ s), and carries on from your next key; the parts add up to one summary. *Music while playing* off
(Blind): the music hides while you play.

**Fit for lessons:** any piece or short exercise score; choose the mode by goal (notes → Wait for me; tempo → Play
along; speed → Ladder on a loop; rhythm → Rhythm). Judging needs a MIDI keyboard (Web MIDI: Chrome/Android, not
Safari); Watch needs none.

---

## 2. Memorise (its own screen)

**For:** learning a real piece by heart, chunk by chunk, with the app doing the hiding, checking, replaying and
moving on so the learner just plays and takes in the corrections. `web/src/memorise.ts`, `web/src/main.ts`.

**Reached:** on a piece's score, ⋯ → *Memorise this piece*; Done goes back. It uses the score's drawing of the
piece, nothing else of the score screen.

**How it works:**
1. The piece is split into chunks of N bars (2 / 4 / 8). Within a chunk bars are added one at a time (or the whole
   chunk at once).
2. *Listen:* the app plays the new bar (or everything being learned, or nothing; a setting) with the marker.
3. *Your turn:* those bars are covered (grey, numbered). Your first note starts the pass. When timing doesn't
   count it **waits for each note** (no clock); with "in time" on it runs at the tempo. The pass always finishes:
   wrong keys are noted and you carry on; stuck, hold *Peek* (uncovers while held) or wait 3 s and the next note
   lights on the keys — either counts as a slip.
4. After the pass: clean passes count towards "learned" (1 / 2 / 3 in a row); slips show on the uncovered bars
   (missed notes green, early/late amber when timing counts, wrong keys red on the keys) and stay until you play
   again, from the bar of the first slip (or the start).
5. A learned chunk asks how to join it up: with the chunk before, everything so far, or on to the next chunk
   (on the last chunk: finish); "Always do this" remembers the choice. Then the next chunk, by itself or on a tap.

Controls: ▶/■, *Hear* (tap: the bar you are on or slipped in; hold: everything being learned), *Peek*, ◀ Bar n ▶ or
tap a covered bar to start your turn there, ‹ › to change chunk. Progress (chunk, bars learned, clean passes) is
kept per piece and per hand choice. Own settings: hands, tempo, size, keyboard strip, plus the options above.

**Layout:** no read-ahead is needed, so the music is drawn as large as the score's largest size (scaled, never
stretched): about one bar across a phone upright, pages turning as you go, spare room showing the following bars
faded; sideways one line fitted to the height, the header and buttons fading over it while it plays or you play.

**Fit for lessons:** a piece (any score) once its notes are known; chunk size and "learned after" set the load.
Known gap: with repeats, only the first time through is walked.

---

## 3. Simon (exercise screen)

**For:** remembering small units — notes, intervals, chords, scales, arpeggios — as a game: a chain that grows by
one each round until you slip. `web/src/exercise/simon.ts`.

**How it works:** the app gives the chain (as the help level says), it stays shown until your first key, then you
play the whole chain from memory; right → one more item; a miss shows the wrong key red and the wanted keys
outlined, names what was due, and replays (the whole chain or from the missed item) after a try is used (3 tries /
game over / keep going). Pools add a random item each round; passages grow in their own order. Best chain kept per
set.

**Help levels** (shared with Drills): 1 music + sound + keys lit, 2 music + sound, 3 music only, 4 name only,
5 by ear. **Matching:** the same keys, any octave, or any octave and inversion. **Speed:** steady, or quickening as
the chain grows. **Playback:** after a miss the whole chain or from the miss; when it grows the whole chain or only
the new item (you always play it all). Display: size A−/A+ (fixed size, building from the left; long chains wrap and
scroll), keyboard or nothing under the music.

**Content:** item sets (§6). Small units only; passages from pieces belong in Memorise.

---

## 4. Drills (exercise screen)

**For:** practising a concept as flashcards: each card is one complete short thing to play (a few bars to read, a
scale or chord by name, something to play back by ear), given at once — not from memory. `web/src/exercise/drill.ts`.

**How it works:** a card appears at the chosen help level (1–2: it plays the card first; 4: the name only, and any
octave counts; 5: by ear, it plays and you play it back). A timed card starts after a bar of count-in clicks or on
your first note (by ear: always your first note); the metronome can keep clicking. Cards are judged:
- **with written rhythm** (MusicXML items, bars from a piece): in time, as Play along (on time / early / late /
  missed, wrong keys; *On time* relaxed / normal / strict);
- **without** (notes, chords, intervals): as the set says — the right notes in order, or steady beats of a given
  length; *On time: notes only* judges every card on notes alone.

A right card moves on by itself; one with slips shows them on the card (missed green, early/late amber, wrong keys
red) and waits for *Again* or *Next*. Help (*Hear it*, *Show me*, or the 3 s hint on a notes-only card) is noted and
the card doesn't count as clean. Notes-only cards have *Skip*. A set is 10 / 20 cards or until you stop; then each
card's result, *the misses again* (just those) or a new set. Best kept per set; tempo per set. A card never grows,
so it is drawn on one line, centred and as big as the room allows (never past the score's biggest size, 180%);
A−/A+ make it smaller than that (Simon instead keeps one size and builds from the left).

**Content:** item sets (§6), one item per card; for sight-reading give MusicXML items with real rhythm; for
name or scale cards give `notes`/`chord` items with a `name`, and `rhythm` in the set if timing should count.
Fresh generated cards (new music each time) are planned as another source of items, not built.

---

## 5. Free play (⋯ → Free play)

**For:** playing anything and seeing what it is. The keys you play light up and are named, with the chord or
interval they make; below, three columns of what you played lately (newest on top): chords held together (three
or more notes that make a named chord), notes (keys pressed together on one line), intervals (note to next, with
direction, and two notes held together). *Show* turns columns off. Nothing is judged or kept. `web/src/freeplay.ts`.

**Metronome:** in the score's Tempo panel (⋯ → Metronome… opens it). A metronome usable on its own, without a
score, is planned.

---

## 6. Exercise content: item sets (Simon and Drills)

Files in `web/public/content/sets/`, listed in `index.json`; read by `web/src/exercise/items.ts`.

```json
{ "title": "Chords in C", "order": "pool",            // pool: random items; passage: in order
  "tempo": 80,                                          // quarter notes a minute (default 80)
  "rhythm": "notes",                                    // Drills: items without written rhythm judged on notes only,
                                                        //   or a length in quarter notes, e.g. 0.5 = steady quavers
  "items": {
    "1": { "notes": "C4 E4 G4" },                       // together (a chord); "C4, E4, G4" = one after another
    "2": { "chord": "G7", "octave": 4, "arpeggio": false },
    "3": { "interval": "M3", "root": "C4", "together": true },
    "4": { "musicxml": "<note>…</note>" },               // a fragment (one bar), or a file next to the set:
    "5": { "musicxml": "melody-1.musicxml", "name": "Melody 1", "short": "1" }
  } }
```

(The `//` notes are for explanation only: a real set file is plain JSON.)

Or a passage cut from a score: `{ "title": …, "from": { "score": "mozart-k2", "bars": "1-4", "staff": 1 } }`.
Items are numbered; `name` (full, used for name-only prompts and feedback) and `short` (a label) are worked out
when missing. MusicXML items keep their rhythm and rests; a whole MusicXML file also keeps its bars, time signature
and key. Spell pitches as written (F#5, Bb4) — the app draws and names them as given. Sets marked "Test:" are
placeholders for checking the app, not lesson content.

---

## 7. Throughout

- Every screen is laid out for a phone upright, a phone sideways and a tablet; settings that are about the look are
  kept per kind of screen. On the exercise screen (Simon, Drills) a phone sideways gets one bar above the keys for
  what it says, its buttons and the size/Hear tools, and a keyboard a fifth of the height; elsewhere what it says
  floats frosted over the bottom of the music. Sideways the exercise header and score line are one row, and the
  settings dialogs lay their groups out in two columns.
- Offline: everything (app, scores, sets and the files they point to, piano samples) is saved on the first visit;
  installable as an app.
- The screen stays awake while playing or in an exercise.
- Back up / restore (⋯) saves every setting, mark and progress record (all `piano-web.*` storage) to one file.
- Saved data: `piano-web.settings.v2` (score look and modes, per screen type and song), `piano-web.app.v1`
  (app-wide: theme, volumes, click, piano output), `piano-web.marks.v1` (fingering), `piano-web.memorise.v1`,
  `piano-web.simon.v1`, `piano-web.drills.v1`, `piano-web.exercise-display.v1`, `piano-web.freeplay.v1`.

## 8. Not built yet

Library / history / projects (how lessons and pieces are reached and progress is seen: the owner will explain);
accompaniment lab / sight-reading tools (mockups first); a standalone metronome; importing your own music; generated
drill cards; a setup tour and guide (last).
