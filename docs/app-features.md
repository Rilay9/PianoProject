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
progress), so it must not change once used; `file` is the name in `scores/`; `id`, `title`, `composer` and `file`
are needed; `source`, `license`, `licenseUrl` and `status` (free text, e.g. whether the notes were checked against an
edition) are shown in ⓘ when given. A new score is added by putting its file in `scores/` and its entry in the list,
then deploying. The list's order is the
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
| **Play along** | playing at tempo | the piece runs at its tempo with the piano playing the other hand; at the end a summary | each note on time and held / let go early / early / late / missed, keys not in the score; *On time*: relaxed ±200, normal ±100, strict ±50 ms; the weakest bars offered as a one-tap loop |
| **Ladder** | building speed on a passage | Play along round a loop; a clean pass (every note on time and held, nothing wrong) raises the speed a step (2 / 5 / 10 %), a messy one lowers it; never above the written tempo | as Play along, per pass |
| **Rhythm** | the rhythm alone | Play along where any key counts: one tap per note or chord (keys within 30 ms are one tap) | timing of each tap, held as long as the moment's longest note; extra taps |

**Held notes** (owner, 2026-10-13; `web/src/holds.ts`): wherever rhythm is judged (Play along, Ladder, Rhythm,
timed Drills, Memorise "in time", the lab's chords) a note must sound at least ¾ of its written length at the speed
played, or it is *let go early* (amber, named). The sustain pedal counts as holding (a key let go under the pedal
sounds until it lifts, or until struck again; owner, 2026-10-13: what you hear is judged; pedalling itself is not).
Notes marked staccato, staccatissimo or spiccato are meant short and never asked to be held. A note at a phrase end
(a written rest follows it in its voice, or it ends a slur) needs only half its length. In Rhythm a tap is never asked
to be held past the next tap. Holding longer is not marked (legato overlaps are normal). A note already early or late
is marked for that alone. **Grace notes** are played by the piano just before their note, and never judged: playing
one is welcome and never a wrong key (owner, 2026-10-13).

Starting: ▶, or just play your first note (any key on a rest; any key in Rhythm and Wait for me). In Wait for me
(and Memorise) the keys under the music can be played by touch, and count; on a phone upright they then show two
octaves that follow the music (keys wide enough to tap; owner, 2026-10-13); in the timed modes they only show. In the judged
modes it pauses by itself on silence (3 s with two or more of your notes due), on mashing (6+ keys not in the
score within ¼ s) or when the phone turns (the music is laid out again; Watch just pauses), and carries on from your next key, or *See how it went* in the pause message ends the run with
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
kept per piece, hand choice and chunk size (another size has its own place; going back to a size finds it again).
Changing "in time" or "a bar / the whole chunk" mid-turn goes back to the start of the turn and the clean count
restarts. A key that starts a pass where your part has a rest just starts it (it is not a wrong key). Own settings: hands, tempo, size, keyboard strip, metronome and On time (when "in time"), plus the options above.

**The test** (owner, 2026-10-13): each finished chunk marks its bars learned (per piece and hand choice, any chunk
size; skipped chunks are not). Once every bar is learned, *Test* appears (and is offered after the last chunk):
*notes* (it waits for each note) or *notes + rhythm* (in time at Memorise's tempo, each note held its length). The
whole piece **as performed** (its repeats too; owner, 2026-10-13) from bar 1, from memory: no Peek, Hear, hints or choosing a bar; a wrong key is noted (notes: it waits
for the right one; rhythm: it keeps going); *Stuck* shows the bar you are on for the rest of the test and counts it.
Every bar clean marks the piece **Memorized: notes** or **Memorized: notes + rhythm at ♩ n**, with the date (shown in
Memorise and the song list; notes + rhythm is kept over a later notes-only pass). Otherwise the bars to practise are
listed and marked on the music: *Practise* takes them one bar at a time (clean passes as "learned after"), then
offers the test again (practising after a notes + rhythm test is in time). A test or practising never moves your
chunk place; ■ ends it. Chunk practice is each chunk's bars the first time through; joining "everything so far"
plays from bar 1 as performed up to the chunk's end (a repeat before it is played).

**In time** (a timed pass, or the notes + rhythm test): it starts on your first note, or *▶ Count-in* (or the keyboard's
highest key) gives a bar of clicks first (owner, 2026-10-13).

**Layout:** no read-ahead is needed, so the music is drawn as large as the score's largest size (scaled, never
stretched): about one bar across a phone upright, pages turning as you go, spare room showing the following bars
faded; sideways one line fitted to the height, the header and buttons fading over it while it plays or you play
(while faded, a tap only brings them back; they stay up when there is no keyboard to play on, saying so). What it
says takes up to two lines, with the line under it (what next, the mark) shown sideways too. Sideways, a slip and the join question fit the line between the header
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
5 by ear. **Matching:** the same keys, any octave, or any octave and inversion (a chord still needs as many keys as
it has notes: C4 and C5 are two keys). **Speed:** steady, or quickening as
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
- **with written rhythm** (MusicXML items, bars from a piece): in time, as Play along (on time and held / let go
  early / early / late / missed, wrong keys; *On time* relaxed / normal / strict);
- **without** (notes, chords, intervals): as the set says — the right notes in order, or steady beats of a given
  length (steady beats are judged on when, not how long); *On time: notes only* judges every card on notes alone.

A right card moves on by itself; one with slips shows them on the card (missed green, early/late amber, wrong keys
red) and waits for *Again* or *Next*. *Again* replays the card and that try replaces its result (a set is always N
different cards); a card got right on Again shows as "right on a retry", not clean, and is not one of the misses.
Help (*Hear it*, *Show me*, or the hint after 8 s without a key on a notes-only card, which names the notes when the keys aren't shown) is
noted and the card doesn't count as clean. Notes-only cards have *Skip*. A set is 10 / 20 cards, or endless with a
*Finish* button; then each card's result, *the misses again* (just those) or a new set. Best kept per set and level
(help rung, On time) and set size, from full sets only (not one stopped early by a mash or Finish, not an endless
one), shown on the Ready screen and at the end; tempo per set. A name to play
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
direction, and two notes held together; wider than an octave it says so: "major 3rd + 2 octaves"). *Show* turns
columns off. Nothing is judged or kept. `web/src/freeplay.ts`.

**Metronome:** in the score's Tempo panel (⋯ → Metronome… opens it). A metronome usable on its own, without a
score, is planned.

---

## 5b. Accompaniment lab (⋯ → Accompaniment lab)

**For:** playing with a band: the lead over a backing, or the backing (the chords) for the band. Simple, rewarding
things early on, with clear steps. `web/src/screens/lab.ts`, `web/src/lab/music.ts` (charts, styles, the band's notes,
the steps), `web/src/lab/judge.ts`.

**How it works:** one question first, *Lead* or *Accompaniment*; then a step (the next one picked for you; ✓ marks a
step played clean twice, over every bar; the ladder below is the built-in one: a chart or activity can give its own); one sentence says what your part is and what the band plays; the box of
chords shows the form. *▶ Start* (or the keyboard's highest key) gives a bar of count-in, then the band plays round
after round until ■ (or 40 rounds). Changing anything while the band gets ready drops that start. While playing: one instruction, the beat (1 2 3 4), the chord now and the next two, the box of chords with the bar
you are in, and the keys to use, lit and named. *Show me first* plays one round with your part played for you.
- **Accompaniment steps:** Roots (the root on each chord's first beat) → Chords on the beat (the whole chord, held) →
  the style's rhythm (the chord where the style plays it) → Your own way (any voicing, any rhythm). A bar is green
  when every note of its chord (any voicing or octave; the Roots step: the root) is down together by the beat
  (±150 ms of real time at any speed; a small roll is fine), amber when a little late (before the next chord), red with
  a missing note, the notes only ever played one at a time (Your own way allows that), or a key not in the chord; said
  in music words ("Bar 4 C7: you played C E G; it needs B♭ (the 7th) as well"). Chords on the beat are held until the
  chord changes, the style's rhythm as long as the band holds each (¾ of it, pedal counts; amber if let go early);
  Roots and Your own way leave the length to you. Times are the keyboard's own. Help: keys lit, notes named, or the symbol only.
- **Lead steps (over a chart: improvising):** roots in rhythm → chord notes (lit) → the scale (the chart's, lit pale,
  the chord's notes dark; land on a dark one when the chord changes) → call and answer (the band plays the chord's
  notes up in the first two of every four bars played, counted through the rounds; you answer in the next two) →
  free. Not marked: it says how it went ("you played at 7 of 9 chord changes, on a chord note at 5 · 92% of notes from
  the lit keys"; Free, with nothing lit: "% of notes in the chord or the scale"). A round counts as played (toward the
  ✓) when you played in at least half its bars. The keys: two octaves from middle C.
- **After:** how it went, the next step once a step has two clean rounds, loop the bars that went wrong, try the other
  part. ■ in the middle of a round shows that round as far as it went, and it does not count. Tap bars in the box
  (stopped) to loop them: a loop is practice (no ✓ from it). A clean round below the chart's own tempo moves it up 5%
  (as Ladder). A result shows only for the chart, part, step and bars it came from. The style is the chart's (content, not a choice; owner, 2026-10-13). ⚙: which band parts play (drums, bass,
  chords), the click, drop-outs (the drums or the whole band
  quiet in bars 5–6 of every 8 of the form, from the second round; their notes are left out of what the band plays,
  so they stop exactly at the bar). A part whose sound cannot be loaded is named on the band line; the rest play.
- **Layout:** upright, what to do on top and the box of chords below; sideways, the choices (playing: what to do, the
  beat, the chord now and next) down the left at full height, the box of chords with Start and the tempo on the right,
  and the keys across the bottom only while the band plays (stopped, they make room; owner, 2026-10-13); a tablet, the
  box of chords large beside the chord now. The bar you are in has a line filling as the bar goes.
- **The band:** drums (the LM-2 kit), bass and chords on the style's instruments (FluidR3 General MIDI sounds: basses
  and guitars kept in the app for offline; any other General MIDI instrument fetched online), always on the phone.

**Content** (`web/public/content/lab/`, listed in `index.json` as `{ "charts": ["charts/blues-c.json", …], "styles":
["styles/shuffle.json", …] }`, paths from that folder; a chart's or style's id is its file name without `.json`, and a
chart's `style` names a style by that id, not by its `name`). Each file's fields are checked: one not listed below (a
misspelt `tempo`) is refused, and so are a missing `title` (charts) or `name` (styles) and slash chords (`C/E`: the bass
note is not played yet; owner, 2026-10-13).

```json
// a chord chart (charts/*.json)
{ "title": "12-bar blues in C", "meter": "4/4", "tempo": 84, "style": "shuffle",   // tempo: beats a minute (6/8: dotted quarters)
  "bars": ["C7", "C7", "C7", "C7", "F7", "F7", "C7", "C7", "G7", "F7", "C7", "G7"],   // "F7 G7": two chords share a bar
  "improvise": { "scale": "C blues" },                      // a Tonal scale name: what lights for improvising
  "steps": { "accompaniment": ["roots", "beat1"],           // optional: its own ladder, by kind (each once), in order;
             "lead": [{ "kind": "tones", "name": "Chord notes", "doing": "Play any lit key" }] },   // its own words if given
  "cleanForNext": 2 }                                       // optional: clean rounds (lead: rounds played) before the next step

// a style (styles/*.json): how a genre's band plays any chord, per bar of its metre
{ "name": "Shuffle", "meter": "4/4", "grid": 3,             // steps a beat in the drum patterns: 2 eighths, 3 triplets (swung);
                                                            //   6/8, 9/8, 12/8 are counted in dotted-quarter beats (6/8 in two: grid 3 = eighths)
  "drums": { "hihat": "x.x x.x x.x x.x",                    // one character a step: x hit, X loud, o soft, . none
             "snare": "... x.. ... x..", "kick": "x.. ... x.. ..." },   // kick snare rim clap hihat hihat-open ride crash tom-low tom-high tambourine cowbell
  "bass": [[1, "root"], [2, "fifth"], [3, "sixth"], [4, "fifth"]],      // beat (1-based; 2.5 = the "and"), degree:
                                                            //   root third fifth sixth seventh octave approach (a half step below the next root)
  "chords": [[2, 0.5], [4, 0.5]],                           // beat and length in beats of each chord hit (the style step plays these)
  "instruments": { "bass": "acoustic_bass", "chords": "piano" } }        // General MIDI names (FluidR3), or piano
```

A chart's chord symbols, scale and tempo (20–300) and a style's grid (1–8), patterns (x X o . only, one bar long),
beats (inside the bar) and chord lengths (above 0) are checked when the lab opens; one that cannot be read is left
out with the reason, and so is a chart whose style is missing or in another metre (a chart naming no style plays the
first in its metre). Step kinds: accompaniment `roots`, `beat1` (chords on the beat), `style` (the style's rhythm),
`own`; lead `root`, `tones`, `scale`, `answer` (call and answer), `free`. The kinds are what the lab can judge (code);
which, in what order and in what words is content. Melodies are never made up: the band plays only the chords, in the style. Sets marked "Test:"
are placeholders. **Not built yet** (next): songs with their own melody (a lead sheet: "play the melody" judged as Play
along, and the accompaniment under a real tune) and several-part MusicXML files (each part on its instrument, you take
one); examples to copy written into a chart.

---

## 5c. Library (⋯ → Library; owner, 2026-10-13; mockups `web/mockups/library.html`, option A)

**For:** finding anything you play from: the app's own scores (`scores/index.json`) and chord charts
(`content/lab`), and the files you add. Where it sits in the app (start screen) is not decided; for now it opens from
⋯. `web/src/screens/library.ts`, `web/src/library/*`.

- **The list:** search (titles, composers, your tags; accents ignored; each word matches the start of a word, any
  order), one line of chips (♥ Favourites, Kind, Key signature, Time, Bars as printed, and Tags once you have any),
  each opening a small sheet whose choices are the ones the other filters leave; the count line names what is set,
  and nothing matching says so with Clear. Sort: Recently opened (default; never opened after, newest added first),
  Recently added, Title, Composer, Fewest bars. A row: title, then composer · kind · key signature · time · bars;
  ♡ and ⋯ (its page). Phone upright: a row's tap opens it; sideways and tablets: the list on the left and the page
  of the row tapped on the right. Android Back: a page back to the list, the list back to the score.
- **Facts come only from the file** (`library/facts.ts`): kind (piano = one part on two staves, melody = one staff,
  lead sheet = one staff with chord symbols, several parts), key signature (major or minor only where the file says;
  whether it changes; as written when the first part is a transposing instrument), first time signature (and
  whether it changes), bars as printed (an implicit measure after the first, a bar split around a repeat, is not
  counted again), lowest and highest note (not for several parts), chord symbols. The title is the one printed on
  the page first (MuseScore can keep an old work title), the composer its first line. Never a level, genre or other
  catalogue guess. A file that can't be read is listed as "score".
- **A piece's page:** Open (the score screen, or the lab for a chart) and Memorise; the first bars drawn small; the
  facts; your tags (+ tag, ✕); where it came from (the app's own: source and licence of the transcription; yours:
  the file and date); the song list's status line ("notes not verified…"); a warning for several parts (the score
  screen takes the top staff as the right hand; choosing the parts comes later) and for a transposing first part.
  Yours: Rename (library and score), Replace file… (a corrected file: the piece keeps its id, so its Memorise data,
  choices and fingering stay; a score only by a score, a PDF by a PDF; it says to check fingering), Export file (as
  added), Delete (asks; also removes that piece's playing choices, look, fingering and Memorise data:
  `library/forget.ts`, and Memorise reads its store again so it can't write them back). A PDF opens in the PDF
  reader (§5d).
- **Adding** (+ Add; several files at once): MusicXML and MXL (title and composer from inside the file), PDF (kept
  as is). Recognised by contents, not name (UTF-16 MusicXML too); up to 64 MB for a PDF and 16 MB of MusicXML for
  a score; the same file again (by its contents, even one that replaced another's) is "already in your library";
  anything else gets one sentence; a file with several parts is added with the warning. One file: a toast with Open; several: a list of what happened to each. What was just
  added is on top, marked, with search and filters cleared, for this visit (your sort is kept). **Shared from
  another app** (Share → Piano, Android, the installed app only: the manifest's `share_target`): the service worker
  takes the POST to `./share-target`, keeps the files in the cache `piano-shared` and opens the app with
  `?shared=1`; the library opens and adds them as above. (A change to the share target reaches an installed app
  only when Android refreshes it, which can take a day.) **MIDI** (`library/midi/`, the old app's converter,
  ported unchanged; its unit tests: `npm run check:midi`): converted on the phone, then a sheet shows the first bars
  and what was read from the file and what was guessed (hands kept as recorded or split, tempo, key (always estimated
  from the notes), time), with **Swap hands** (exchanges the staves, clefs kept) and a tempo to state; Add keeps the
  MusicXML and the MIDI file beside it (`<id>:midi`, in the backup too), Cancel adds nothing. A file stating no
  tempo is written without one (the score screen's default applies).
- **Catalogue** (tab beside Yours, shown when the build has one; `library/catalogue.ts`, built by
  `web/tools/catalogue/`): about 1,600 PDMX scores (855 piano, 776 lead sheets, within ~25 MB) picked by reading their notes: piano (one part, two staves)
  and lead sheets (one staff with chord symbols). The index holds what the app's own reader (`facts.ts`) reads from
  each file, a composer only when it matches the composer table (`tools/catalogue/composers.json`; a bare surname
  stays a surname), MuseScore's view count (shown as exactly that) and the uploader's licence for the
  transcription. Never PDMX's genre, difficulty, tags or ratings. Uploads of one piece fold into one row ("2
  versions"). Sorted by views first; Title, Composer, Fewest bars. Rows drawn 100 at a time (Show more). + Add (on
  the row or the page) keeps the file as yours (id `u-` + its SHA-256 start, so the same file added by hand is the
  same piece); the files are saved for offline with the app, so adding works offline. Each tab keeps its own search,
  filters and sort.
- **Storage:** IndexedDB `piano-library` (store `items`: one record per item, yours with everything about it, the
  app's own with only your favourite, tags and last opened; store `files`: what you added). The first add asks the
  browser to keep it safe from clean-up (`navigator.storage.persist()`); the foot line says whether it is. Added
  scores join the song list at start (ids `u-` + the start of the file's SHA-256), so every score screen, Memorise
  and activities take them. Recently opened is set when you open something deliberately (the library, the song
  list, the lab's chart), not when the app reopens the last piece. The backup includes the library (§7).

---

## 5d. PDF reader (opened from the library; owner, 2026-10-14)

**For:** reading your own PDF scores at the piano. A PDF is pages, not notes, so it is read a line (system) at a time
and nothing is judged. `web/src/screens/pdf.ts`, `web/src/pdf/*` (pdf.js 5.4.394 renders the pages).

- **Two units in fixed places, alternating** (like the score's Turn): the one you're on (marked at its left) and the
  next; turning replaces the one you finished, so the one you read toward never moves. A unit is a whole line or a
  **part of a line**: each line has split points, one found for you (the emptiest place near its middle, between
  notes: 60 of 71 test lines split with nothing but staff lines cut, the rest through a slur or hairpin) and any you
  add (Adjust lines: a tap on a line adds a split there, at a barline say; drag one sideways; × removes it). **Per
  piece and per kind of screen** (⚙ → Show) you choose whole lines or split lines; split by default on a phone
  upright, where a whole printed line is too small (measured: a dense page's staff space 2.4 px whole, 4.8 px in
  halves; sideways 5.2 px whole, 10.6 px split, but then only a strip of the next part fits). The slots are as tall as
  the tallest unit met so far, one under the other; when two don't fit, the unit you're on shows whole with as much
  of the next as fits under it. A−/A+ choose the size (50–100% of the width); each page's margins are trimmed to
  where its staves start and end. Turning the phone keeps your line (and part, where there is one).
- **Turning** (owner: no timed turning): the keyboard's highest key (next) and lowest key (back), as the keyboard
  remote does elsewhere (they need learning once in Keyboard controls), unless the piece's ⚙ says it uses those keys;
  a tap on the music; a page-turner pedal or keys (→ ↓ PageDown Space Enter next; ← ↑ PageUp back); ◀ ▶.
- **Finding the lines** (`pdf/systems.ts`, reworked from the old app's after it got 0 of 5 real-looking pages right):
  ink against the page's own paper; the page's tilt measured and straightened (on screen too); staff lines as the
  sharpest rows, five evenly spaced a staff (a too-faint fifth filled in); a second look for short systems at the
  page's own staff spacing; staves joined into a system by a brace or barline where they start; bands to halfway
  between systems. 15 of 15 test pages right, including a tilted grey scan and a one-bar ending (one staff missed on
  one page, its band still holding it). **Adjust lines** shows the page with each line's top and bottom handles to
  drag and its split points (green); add or remove a line (that page's lines go back to one found split each), or find
  the lines again. A page where no lines are found shows whole, unsplit, until you mark them.
- **Kept per PDF** (`piano-web.pdf.v1`, in the backup): the line and part you were on, the lines and split points
  found or placed, whole or split per kind of screen, each page's tilt and margins, the size, and the edge-keys switch.
- Not built (owner, 2026-10-14): timed turning (tried and measured: fine on lines of equal length, off by seconds on
  unequal ones; counting bars from the page only reached 34 of 71 lines right); following your playing (a PDF has no
  notes; with a MusicXML copy you'd use the score screen). Repeats are yours to turn back for.

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

**Checked:** a set gives either `items` or `from`, a `title`, `order` pool / passage, `tempo` 20–300, `rhythm` "notes" or a
length; an item gives exactly one of `notes`, `chord`, `interval`, `musicxml` with that kind's options; any other field
is refused with the reason (a typo never reads as something else). A lower-case pitch (`c4`) is read as C4. A passage's
`bars` must be like "5-8" and hold notes on its staff.

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
`<backup>`, `<forward>`), a tied note just lasts longer, and staccato (staccatissimo, spiccato) is kept: drawn with
its dot, and never asked to be held. Music with a second voice or staff (unless the passage
names a staff), several parts, repeats or 1st/2nd endings (in the bars read), tuplets, or lengths shorter than a 32nd
is refused with the reason (shown on the exercise screen), not read wrongly. A fragment without `<divisions>` counts durations in quarter notes. Spell pitches as written (F#5, Bb4) — the app draws and names them as given. Sets marked "Test:" are
placeholders for checking the app, not lesson content.

---

## 7. Throughout

- Every screen is laid out for a phone upright, a phone sideways and a tablet; settings that are about the look are
  kept per kind of screen. On the exercise screen (Simon, Drills) a phone sideways gets one bar above the keys for
  what it says, its buttons and the size/Hear tools, and a keyboard a fifth of the height; elsewhere what it says
  floats frosted over the bottom of the music. Sideways the exercise header and score line are one row, and the
  settings dialogs lay their groups out in two columns. Feedback may take two lines rather than being cut. Every
  dialog has a ✕ in its corner and a Done bar that stays in view while it scrolls (sideways the Done bar alone). The
  piano and click volumes and the click sound (Tempo panel) are the app's, for every screen.
- **The keyboard as a remote** (⋯ → Keyboard controls; `web/src/remote.ts`): every key passes through one filter
  first, so a command never reaches a mode. A mash (six or more keys packed close within ¼ s) stops or pauses what
  is playing (the judged score modes pause as before). Your keyboard's lowest and highest key, learned once, are
  buttons when the music on screen doesn't use them: lowest = back / again (score: to the loop's or the bar's
  start; Memorise: Hear; Drills: Again or Hear it; Simon: Hear again; the lab, stopped: back to the steps), held in
  Memorise = Peek (held elsewhere: the same as a tap); highest = start / next / carry on (Drills: Start, Next, Skip,
  New set; the lab: Start or Again). Where any octave counts (the lab while the band plays, Drills by name, Simon in
  any octave) the music uses every key, so the edges are notes there; a mash still stops.
- Free play shows two octaves at a time on a phone, three on a tablet (‹ › an octave; a MIDI key outside them moves them). A diminished 7th is named from its bass (Cdim7).
- Offline: everything (app, scores, sets and the files they point to, piano samples) is saved on the first visit;
  installable as an app.
- The screen stays awake while playing or in an exercise.
- Back up / restore (⋯; `web/src/backup.ts`): one zip with every setting, mark and progress record (all
  `piano-web.*` storage) and the library (its records and your files); the size of your files is asked about first.
  Files are stored uncompressed and written and read a piece at a time (no copy of the whole library in memory; a
  zip over 4 GB is refused). **Restoring merges** (owner, 2026-10-13): what this phone lacks is added, what it has
  stays (object by object; the practice log keeps every run from both, once); library records merge (favourite if
  either, tags joined, the later last-opened) and missing files are put back. An older .json backup restores the
  same way.
- Saved data: `piano-web.settings.v2` (score look, per screen type and song), `piano-web.songs.v1` (playing
  choices per song), `piano-web.app.v1`
  (app-wide: theme, volumes, click, piano output), `piano-web.marks.v1` (fingering), `piano-web.memorise.v1`,
  `piano-web.simon.v1`, `piano-web.drills.v1`, `piano-web.exercise-display.v1`, `piano-web.freeplay.v1`,
  `piano-web.remote.v1`, `piano-web.lab.v1`, `piano-web.log.v1`, `piano-web.library.v1` (the library's sort), `piano-web.pdf.v1` (the PDF reader, per PDF) (all in a backup; not `piano-web.offline.v1`, what this device has saved for offline). The library's own database (§5c) is in the backup too.

## 7b. The practice log (owner, 2026-10-13; `web/src/log.ts`)

How practice went, for Claude to plan the next lesson from. **One entry per run**: a start to its stop (the score's Play
along, Ladder, Rhythm, Wait for me; a Memorise session from ▶ or a test to ■ or Done; a Simon game; a Drills set,
finished or left part way; a lab run from Start to ■). Watch and Free play are not logged. Kept on the phone (in the
backup too); **⋯ → Export practice log** downloads it as a file; **Delete practice log entries older than a month** (in
⋯, on by default) prunes old ones; never more than 3,000 entries (the oldest go first).

```json
{ "app": "piano-web", "kind": "practice-log", "version": 1, "exported": "2026-10-13T20:00:00.000Z", "entries": [
  { "at": "2026-10-13T19:40:02.120Z", "seconds": 95, "screen": "score", "mode": "along",
    "piece": "mozart-k2", "title": "Minuet in F K. 2", "activity": "k2-wait-right",       // the activity, if opened from one
    "settings": { "mode": "along", "hands": "right", "bpm": 140, "onTime": "normal", "metronome": false, "loop": "5-8" },
    "result": { "notes": 41, "onTime": 33, "early": 1, "late": 2, "missed": 3, "letGoEarly": 2, "wrongKeys": 1,
                "toleranceMs": 100, "weakBars": ["9-12"],
                "slips": [{ "bar": 10, "note": "F♯5", "what": "late" }], "slipCount": 9 } } ] }
```

`slips` are each note not on time and held: the printed bar, the note as written (wrong keys: by key name), and what
(`missed`, `early`, `late`, `let go early`, `wrong key`; Memorise also `helped` for a peek or hint, `stuck` in a test);
at most 40 kept per entry, `slipCount` is all of them. `result` by screen:
- score: Play along / Rhythm the counts above; Ladder and loops `passes` [{ pass, notes, onTime, early, late, missed,
  letGoEarly, wrongKeys, clean, bpm }]; Wait for me `fromBar`, `toBar`.
- memorise: `passes` [{ bars, from, clean, inTime, slips, wrongKeys, peeked, test | practising | joining }], `learned`
  (bars and chunks learned), `tests` [{ kind, clean, toPractise, stuck }], `mark` (if memorized).
- simon: `longestChain`, `ended` (over / all played / stopped), `helpedChains`, `misses` [{ item, wanted, played }].
- drills: `clean`, `of`, `ended` (set done / stopped early / left), `missesAgain`, `cards` [{ item, clean, right,
  retried, helped, result }].
- lab: `rounds` [{ round, step, bars ("1:ok 2:late …", accompaniment) or notes, fromGuide, barsPlayedIn, changes,
  playedAtChanges, landedOnChord (lead), stoppedInBar }], `wholeRounds`, `roundsPlayed` (lead); slips name the chord
  and what was wrong ("C7 needs B♭").

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

## 8b. Activities: a screen opened with its content and choices (owner, 2026-10-13)

An **activity** is how a lesson (or a link) starts a mode: which screen, its content, and preset choices. A file in
`web/public/content/activities/<id>.json` (listed in its `index.json`), opened with `?activity=<id>`
(`web/src/activity.ts` reads it; `main.ts` opens it). The **content** decides what is played (the piece and bars, the
set, the chart and its ladder and style); **presets** are learner choices set for the activity: in force while it
lasts (until another song, chart or screen, or Done), changeable there, and never saved over the learner's own. A
mistake in a file (an unknown screen, a misspelt setting, a value out of range, a piece, set, chart or style that is
not there) is refused with the reason; nothing is guessed. Examples marked "Test:" are placeholders.

```json
{ "title": "Minuet K. 2, right hand, bars 1–4", "screen": "score", "piece": "mozart-k2", "bars": "1-4",   // printed bar numbers: looped
  "settings": { "mode": "wait", "hands": "right", "tempo": 100, "metronome": true, "clickOn": "beats", "onTime": "normal", "ladderStep": 0.05 } }
{ "title": "…", "screen": "memorise", "piece": "mozart-k2",
  "settings": { "hands": "right", "tempo": 90, "chunk": 2, "adds": "bar", "learnedAfter": 2, "timing": false, "before": "new",
                "carryFrom": "bar", "next": "auto", "join": "ask", "metronome": false, "onTime": "normal" } }
{ "title": "…", "screen": "drills", "set": "melodies-c", "level": { "rung": 3, "start": "clicks", "metronome": true, "onTime": "normal", "cards": 5 } }
{ "title": "…", "screen": "simon", "set": "chords-c", "level": { "rung": 2, "match": "octave", "miss": "tries", "speed": "up", "onMiss": "all", "onNew": "all" } }
{ "title": "…", "screen": "lab", "chart": "blues-c",
  "preset": { "role": "accomp", "step": "roots", "style": "shuffle", "dropouts": "off", "parts": { "drums": true, "bass": true, "chords": true, "click": false },
              "steps": { "accompaniment": ["roots", "beat1"] }, "cleanForNext": 2 } }
{ "title": "…", "screen": "freeplay" }
```

Every field but `screen` and its content (`piece`, `set`, `chart`) may be left out; a field not listed for its screen
is refused. Every value (`web/src/activity.ts` checks each):
- score: `bars` "5-8" (printed bar numbers); `mode` watch / wait / along / ladder (needs `bars`) / rhythm; `hands` both /
  right / left / off; `tempo` 20–300; `metronome` true / false; `clickOn` beats / quarters / eighths; `onTime` relaxed /
  normal / strict; `ladderStep` 0.02 / 0.05 / 0.1.
- memorise: `hands` both / right / left; `tempo` 20–300; `chunk` 2 / 4 / 8; `adds` bar / chunk; `learnedAfter` 1 / 2 / 3;
  `carryFrom` bar / start; `before` new / all / nothing; `next` auto / tap; `timing` true / false; `join` ask / previous /
  all / none; `metronome` true / false; `onTime` relaxed / normal / strict. (Not yet: some bars only.)
- drills: `rung` 1–5 (1 music + sound + keys lit … 4 name only, 5 by ear); `start` clicks / first; `metronome` true /
  false; `onTime` relaxed / normal / strict / notes; `cards` a whole number 0 (until you stop)–100.
- simon: `rung` 1–5; `match` same / octave / inversion; `miss` tries / over / endless; `speed` up / steady; `onMiss` all /
  from-miss; `onNew` all / new.
- lab: `role` accomp / lead; `step` roots / beat1 / style / own (accompaniment) or root / tones / scale / answer / free
  (lead), which also sets the role; `style` a style's id; `dropouts` off / drums / band; `parts` drums / bass / chords /
  click, each true / false; `steps` { accompaniment: […], lead: […] } (kinds as above, each once; a `step` must be in it);
  `cleanForNext` a whole number 1–10.

A link opens an activity once: it leaves the address as it opens, so a later reload is the ordinary app.

## 9. Not built yet

The library's next parts (§5c): difficulty (on hold: the estimator's check failed, the owner decides), later the phone folder (a few big zip files) and the Shelf; history /
projects (the owner will explain);
the accompaniment lab's lead sheets and several-part files (§5b); sight-reading tools; a standalone metronome; generated
drill cards; a setup tour and guide (last).
