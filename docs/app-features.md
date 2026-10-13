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
`{ id, title, composer, file, source: { dataset, uploadTitle }, license, licenseUrl, status }`: `id` is how the piece
is named everywhere else (the address `?piece=<id>`, a set's `"from": { "score": <id> }`, saved settings and
progress), so it must not change once used; `file` is the name in `scores/`; `source`, `license`, `licenseUrl` and
`status` (free text, e.g. whether the notes were checked against an edition) are shown in ⓘ. The list's order is the
song list's order. Exercises (scales,
five-finger patterns, cadences as music) are simply short scores. Fingering written in the file shows when Display →
Fingering is on; the learner can add their own (⋯ → Edit fingering).

**What the learner sees:** the music laid out to keep what comes next in view: *Turn* (slots that swap as you
play) or *Rolling* on a phone upright, a scrolling single line (*smooth* or *still then glide*) on a phone sideways,
*Turn* on a tablet. Upright and on a tablet the music starts below the top bar, so the bars never cover it; sideways
the line has the whole height, and its size is a share of the size that fills the height (100% = fills it). Messages
show as a strip just above the bottom bar. A marker moves through it (a bar, coloured notes, or both; per hand or across hands). Under the
music: a keyboard strip and/or note names. Display settings (size, spacing, layout, slots, bars per line, bar
numbers, tempo marks, fingering, lyrics, marker, what is under the music, "Music while playing") are kept per
kind of screen, with a default plus each song's own (`web/src/settings.ts`, `web/src/follow.ts`); Make default and
Reset this song touch only these. The playing choices (tempo, mode, hands, metronome and what it clicks on, On time,
Ladder step) are one per song whichever way the phone is held; theme, volumes, click sound and piano output are
app-wide.

**Score files:** solo piano, right hand on the top staff (the app takes the top staff as the right hand and every
other staff as the left). A file with other parts or more than two staves is opened with a note saying the hands may
be wrong. A per-score hand map is to be added when a piece needs one.

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

Starting: ▶, or just play your first note (any key on a rest; any key in Rhythm and Wait for me). In Wait for me
(and Memorise) the keys under the music can be played by touch, and count; in the timed modes they only show. In the judged
modes it pauses by itself on silence (3 s with two or more of your notes due) or on mashing (6+ keys not in the
score within ¼ s), and carries on from your next key, or *See how it went* in the pause message ends the run with
its summary; the parts add up to one summary. *Music while playing* off
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
   lights on the keys (named in the message when no keys are shown) — either counts as a slip. A key that isn't the
   first note doesn't start the pass: it says so and waits (also when going again after a slip).
4. After the pass: clean passes count towards "learned" (1 / 2 / 3 in a row), but only passes from the first bar
   being learned (one started at a later bar is practice, then it asks for the whole); slips show on the uncovered bars
   (missed notes green, early/late amber when timing counts, wrong keys red on the keys) and stay until you play
   again, from the bar of the first slip (or the start).
5. A learned chunk asks how to join it up: with the chunk before, everything so far, or on to the next chunk
   (on the last chunk: finish); "Always do this" remembers the choice. Then the next chunk, by itself or on a tap.

Controls: ▶/■, *Hear* (tap: the bar you are on or slipped in; hold: everything being learned), *Peek*, ◀ Bar n ▶ or
tap a covered bar to start your turn there, ‹ › to change chunk. Progress (chunk, bars learned, clean passes) is
kept per piece and per hand choice, with the chunk size it was made with (another size starts that piece afresh).
Changing "in time" or "a bar / the whole chunk" mid-turn goes back to the start of the turn and the clean count
restarts. A key that starts a pass where your part has a rest just starts it (it is not a wrong key). Own settings: hands, tempo, size, keyboard strip, metronome and On time (when "in time"), plus the options above.

**Layout:** no read-ahead is needed, so the music is drawn as large as the score's largest size (scaled, never
stretched): about one bar across a phone upright, pages turning as you go, spare room showing the following bars
faded; sideways one line fitted to the height, the header and buttons fading over it while it plays or you play
(while faded, a tap only brings them back). Sideways, a slip and the join question fit the line between the header
and the buttons, the bars being learned from the left edge. Upright, the join question floats frosted over the music.
Turning the phone or changing the size mid-pass carries on: a pass waiting for your notes goes on at the note it
waited for; listening, or a timed pass, starts that again.

**Fit for lessons:** a piece (any score) once its notes are known; chunk size and "learned after" set the load.
Known gap: with repeats, only the first time through is walked.

---

## 3. Simon (exercise screen)

**For:** remembering small units — notes, intervals, chords, scales, arpeggios — as a game: a chain that grows by
one each round until you slip. `web/src/exercise/simon.ts`.

**How it works:** the app gives the chain (as the help level says), it stays shown until your first key, then you
play the whole chain from memory; right → one more item; a miss shows the wrong key red and the wanted keys
outlined, names what was due, and replays (the whole chain or from the missed item) after a try is used (3 tries /
game over / keep going). Pools add a random item each round; passages grow in their own order; a completed passage
is drawn whole. Best chain kept per set and level (help rung, matching, what a miss costs).

**Help levels** (shared with Drills): 1 music + sound + keys lit, 2 music + sound, 3 music only, 4 name only,
5 by ear. **Matching:** the same keys, any octave, or any octave and inversion. **Speed:** steady, or quickening as
the chain grows. **Playback:** after a miss the whole chain or from the miss; when it grows the whole chain or only
the new item (you always play it all). Display: size A−/A+ (fixed size, building from the left; long chains wrap and
scroll; on a phone sideways one line that scrolls sideways, the dots in the bottom bar), keyboard or nothing under
the music.

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
red) and waits for *Again* or *Next*. *Again* replays the card and that try replaces its result (a set is always N
different cards); a card got right on Again shows as "right on a retry", not clean, and is not one of the misses.
Help (*Hear it*, *Show me*, or the 3 s hint on a notes-only card, which names the notes when the keys aren't shown) is
noted and the card doesn't count as clean. Notes-only cards have *Skip*. A set is 10 / 20 cards, or endless with a
*Finish* button; then each card's result, *the misses again* (just those) or a new set. Best kept per set and level
(help rung, On time), from full sets only, shown on the Ready screen and at the end; tempo per set. A name to play
is drawn flashcard-size; with the result the music appears and the name sits small above it. On a tablet A+ can
make a card bigger than the score's biggest size, up to filling the room. A card never grows,
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

## 5b. Accompaniment lab (⋯ → Accompaniment lab)

**For:** playing with a band: the lead over a backing, or the backing (the chords) for the band. Simple, rewarding
things early on, with clear steps. `web/src/screens/lab.ts`, `web/src/lab/music.ts` (charts, styles, the band's notes,
the steps), `web/src/lab/judge.ts`.

**How it works:** one question first, *Lead* or *Accompaniment*; then a step (the next one picked for you; ✓ marks a
step played clean twice); one sentence says what your part is and what the band plays; the box of chords shows the
form. *▶ Start* (or the keyboard's highest key) gives a bar of count-in, then the band plays round after round until
■. While playing: one instruction, the beat (1 2 3 4), the chord now and the next two, the box of chords with the bar
you are in, and the keys to use, lit and named. *Show me first* plays one round with your part played for you.
- **Accompaniment steps:** Roots (the root on each chord's first beat) → Chords on the beat (the whole chord, held) →
  the style's rhythm (the chord where the style plays it) → Your own way (any voicing, any rhythm). A bar is green
  when every note of its chord (any voicing or octave; the Roots step: the root) is down by the beat (±150 ms), amber
  when a little late (before the next chord), red with a missing note or a key not in the chord; said in music words
  ("Bar 4 C7: you played C E G; it needs B♭ (the 7th) as well"). Help: keys lit, notes named, or the symbol only.
- **Lead steps (over a chart: improvising):** roots in rhythm → chord notes (lit) → the scale (the chart's, lit pale,
  the chord's notes dark; land on a dark one when the chord changes) → call and answer (the band plays the chord's
  notes up in the first two bars of every four; you answer in the next two) → free. Not marked: it says how it went
  ("landed on the chord 7 of 8 changes · 92% of notes from the lit keys").
- **After:** how it went, the next step once a step has two clean rounds, loop the bars that went wrong, try the other
  part. Tap bars in the box (stopped) to loop them. A clean round below the chart's own tempo moves it up 5% (as
  Ladder). ⚙: which band parts play (drums, bass, chords), the click, the style, drop-outs (the drums or the whole band
  quiet in bars 5–6 of every 8, from the second round).
- **The band:** drums (the LM-2 kit), bass and chords on the style's instruments (FluidR3 General MIDI sounds: basses
  and guitars kept in the app for offline; any other General MIDI instrument fetched online), always on the phone.

**Content** (`web/public/content/lab/`, listed in `index.json` as `{ "charts": [...], "styles": [...] }`):

```json
// a chord chart (charts/*.json)
{ "title": "12-bar blues in C", "meter": "4/4", "tempo": 84, "style": "shuffle",
  "bars": ["C7", "C7", "C7", "C7", "F7", "F7", "C7", "C7", "G7", "F7", "C7", "G7"],   // "F7 G7": two chords share a bar
  "improvise": { "scale": "C blues" } }                     // a Tonal scale name: what lights for improvising

// a style (styles/*.json): how a genre's band plays any chord, per bar of its metre
{ "name": "Shuffle", "meter": "4/4", "grid": 3,             // steps a beat in the drum patterns: 2 eighths, 3 triplets (swung)
  "drums": { "hihat": "x.x x.x x.x x.x",                    // one character a step: x hit, X loud, o soft, . none
             "snare": "... x.. ... x..", "kick": "x.. ... x.. ..." },   // kick snare rim clap hihat hihat-open ride crash tom-low tom-high tambourine cowbell
  "bass": [[1, "root"], [2, "fifth"], [3, "sixth"], [4, "fifth"]],      // beat (1-based; 2.5 = the "and"), degree:
                                                            //   root third fifth sixth seventh octave approach (a half step below the next root)
  "chords": [[2, 0.5], [4, 0.5]],                           // beat and length in beats of each chord hit (the style step plays these)
  "instruments": { "bass": "acoustic_bass", "chords": "piano" } }        // General MIDI names (FluidR3), or piano
```

A chart's chord symbols, scale and a style's patterns are checked when the lab opens; one that cannot be read is left
out with the reason. Melodies are never made up: the band plays only the chords, in the style. Sets marked "Test:"
are placeholders. **Not built yet** (next): songs with their own melody (a lead sheet: "play the melody" judged as Play
along, and the accompaniment under a real tune) and several-part MusicXML files (each part on its instrument, you take
one); examples to copy written into a chart.

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

Or a passage cut from a score: `{ "title": …, "from": { "score": "mozart-k2", "bars": "1-4", "staff": 1 } }`
(`bars` are the printed bar numbers, default "1-4"; `staff` default 1; an unknown score id is reported, never
replaced by another score). A passage becomes one item per moment with notes (a rest goes with the item before it);
`tempo` may be given, else the score's own at that point.

**The set as a whole:** its id is the file name without `.json`; `index.json` lists the files in the order they appear
in the set menu, which Simon and Drills share. `order` defaults to `pool`. `tempo` is quarter notes a minute.
`rhythm` is for Drills only: Simon gives items without written rhythm as even quarter notes.

**Item fields and defaults:** pitches in scientific pitch, middle C = C4, spelled as written (`F#5`, `Bb4`, `Cbb3`);
`notes` with spaces = together, with commas = one after another (a group per comma); `chord` is a chord symbol as
Tonal reads it (`C`, `Dm`, `G7`, `Cmaj7`, `F#m7b5`, `Bdim`, `Csus4`…), stacked upwards from its root in `octave`
(default 4), `arpeggio` default false; `interval` is a Tonal interval name (`m2`, `M3`, `P4`, `A4`, `P5`, `m7`,
`P8`…) up from `root` (default C4), `together` default true. Every item may give `name` and `short`.
Items are numbered; `name` (full, used for name-only prompts and feedback) and `short` (a label) are worked out
when missing. MusicXML items keep their rhythm and rests (at the start and end too: a melody that starts on beat 2
starts there); a whole MusicXML file also keeps its bars, time signature and key, and a passage takes the tempo in
force where it starts. MusicXML is read as **one line of music**: notes are placed where they really fall (chords,
`<backup>`, `<forward>`), and a tied note just lasts longer. Music with a second voice or staff (unless the passage
names a staff), tuplets, or lengths shorter than a 32nd is refused with the reason (shown on the exercise screen),
not read wrongly. A fragment without `<divisions>` counts durations in quarter notes. Spell pitches as written (F#5, Bb4) — the app draws and names them as given. Sets marked "Test:" are
placeholders for checking the app, not lesson content.

---

## 7. Throughout

- Every screen is laid out for a phone upright, a phone sideways and a tablet; settings that are about the look are
  kept per kind of screen. On the exercise screen (Simon, Drills) a phone sideways gets one bar above the keys for
  what it says, its buttons and the size/Hear tools, and a keyboard a fifth of the height; elsewhere what it says
  floats frosted over the bottom of the music. Sideways the exercise header and score line are one row, and the
  settings dialogs lay their groups out in two columns. Feedback may take two lines rather than being cut. Every
  dialog has a ✕ in its corner and a Done bar that stays in view while it scrolls.
- **The keyboard as a remote** (⋯ → Keyboard controls; `web/src/remote.ts`): every key passes through one filter
  first, so a command never reaches a mode. A mash (six or more keys packed close within ¼ s) stops or pauses what
  is playing (the judged score modes pause as before). Your keyboard's lowest and highest key, learned once, are
  buttons when the music on screen doesn't use them: lowest = back / again (score: to the loop's or the bar's
  start; Memorise: Hear; Drills: Again or Hear it; Simon: Hear again), held in Memorise = Peek; highest = start /
  next / carry on (Drills: Start, Next, Skip, New set).
- Free play on a phone shows two octaves at a time (‹ › an octave; a MIDI key outside them moves them).
- Offline: everything (app, scores, sets and the files they point to, piano samples) is saved on the first visit;
  installable as an app.
- The screen stays awake while playing or in an exercise.
- Back up / restore (⋯) saves every setting, mark and progress record (all `piano-web.*` storage) to one file.
- Saved data: `piano-web.settings.v2` (score look, per screen type and song), `piano-web.songs.v1` (playing
  choices per song), `piano-web.app.v1`
  (app-wide: theme, volumes, click, piano output), `piano-web.marks.v1` (fingering), `piano-web.memorise.v1`,
  `piano-web.simon.v1`, `piano-web.drills.v1`, `piano-web.exercise-display.v1`, `piano-web.freeplay.v1`,
  `piano-web.remote.v1`, `piano-web.lab.v1`.

## 8. How the app is put together (for adding a screen or a mode)

- `web/src/app.ts`: what every screen shares (the score's drawing `FollowView`, the keyboard strip, the sound, the MIDI
  keyboard, the practice judge `Practice`, the song list, the message line) and the **`Screen` interface** every
  screen offers: `key(e)` (a key from the MIDI keyboard or the screen's keys), `command(c)` (a keyboard-remote
  command: mash, low, high, peek-on/off), `musicRange()` (the keys the music on screen uses), `resized()`, `busy`
  (the phone stays awake).
- `web/src/screens/`: one module per screen. `score.ts` (the score screen and its modes), `memorise-screen.ts`
  (Memorise: it borrows the score's drawing through the `Borrower` interface in `score.ts`: its own settings,
  layout fit, and the drawing's events), `exercise.ts` (Simon and Drills; their logic is in `web/src/exercise/`).
  Free play is `web/src/freeplay.ts`, offered as a screen in `main.ts`.
- `web/src/main.ts`: builds the screens and routes: every key goes first to the keyboard remote (`remote.ts`), then
  to the screen showing; turning the phone goes to every screen; the ⋯ menu opens screens and holds backup, restore
  and export.
- **Adding a screen** (e.g. the accompaniment lab): a module in `web/src/screens/` that offers `Screen`, its markup in
  `index.html`, a line in `main.ts`'s `showing()` and `app.screens`, a way to reach it, and its section here.
  A mode that plays a score belongs in `score.ts` (the modes table above); one that only borrows the score's
  drawing, as Memorise does, can be a `Borrower`.

## 9. Not built yet

Library / history / projects (how lessons and pieces are reached and progress is seen: the owner will explain);
the accompaniment lab's lead sheets and several-part files (§5b); sight-reading tools; a standalone metronome; importing your own music; generated
drill cards; a setup tour and guide (last).
