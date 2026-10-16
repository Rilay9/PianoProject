# What the app can do: modes, tools and the content they take

A reference for planning lessons and preparing content (owner, 2026-10-12): what each mode and tool is for, how it
works for the learner, what it judges, and what content it accepts. **Keep it current:** whoever changes a mode's
behaviour, its settings or a content format updates its section here in the same commit. The code is the final word
when the two disagree (paths are given); the owner's decisions behind each design are in `docs/inputs/` and the
commit history.

**How things are reached** (owner, 2026-10-15; mockups `web/mockups/home.html`, `path.html`; `web/src/screens/shell.ts`,
`web/src/nav.ts`): the app opens to **Home**. Four tabs, **Home · Music · Practice · Path**, sit at the bottom on a phone
upright and as a rail on the left on a phone sideways and on a tablet (§0).
- **Home**: the owner's logo and ⚙ (Settings); *Up next* (the lesson you are on, its next step, Start ▶), the lesson's
  steps, and what you practised lately. With no lesson: *Carry on* with the last thing practised, and ways in.
- **Music**: the library (§5c), Yours and Catalogue. A piece opens on the score (§1); its page also offers Memorise (§2);
  a PDF opens in the PDF reader (§5d); a chord chart in the lab (§5b).
- **Practice**: Exercises (every set by kind, §0), Drills (§4), Simon (§3), the accompaniment lab (§5b), Free play (§5),
  the metronome (§5). Memorise stays with each piece.
- **Path**: rungs and lessons (§8c); a lesson's page holds its content and steps; a step opens its activity (§8b).
- Inside a piece or a tool (the score, Memorise, Simon, Drills, the lab, Free play, the metronome, the PDF reader, a
  lesson's step) there are no tabs; **← at the top left** (owner, 2026-10-15: one way out everywhere, as on the score) and
  Android Back go back to where it was opened from (the tab, the page, or the lesson page). A link with `?piece=<id>` or
  `?activity=<id>` opens that over Home (an activity link's choices are for that visit: a reload is the screen with your
  own). The address names where you are (review 2026-10-15, V21): the tab, a page over it, and a screen over that (the
  piece, or `tool=` drill / simon / lab / freeplay / metronome / memorise with its set or chart, or a lesson's `step`), so a
  reload comes back to the same screen with ← still going where it went; a lesson's step is opened again by its lesson
  page, with its activity's choices, however it was started (the lesson page's Start, Home's Start, the result's Again,
  Next and Next lesson: a place with no address of its own, the result or the sheet, carries the one under it; re-check
  V33). A Switch… sheet is a place too: Back closes it and nothing else (V19).
- **Tap to start** (re-check V31): opened straight into a screen (a reload into a step or a tool, a link), nothing has
  been tapped, and the browser starts the sound and the MIDI keyboard only after a tap; keys would be judged with the
  piano silent. So until the first tap the screen says "Tap anywhere to start" (with why), and keys do nothing; the tap
  starts both and the words go. No tap is faked; back on the tabs the words go too.

Plan a lesson as content on the path (§8c): its text, pictures, video, little scores, and steps that each open an
activity (§8b: "this piece/set, in this mode or tool, with these settings").

### Content and data interfaces (2026-10-15)

Everything that comes into the app or goes out of it, with where its format is written down. Each content file is
plain JSON (no comments: the `//` notes in this document's examples are explanation only, and a line break inside a
text value is written `\n`). A content reader refuses a mistake with the reason, said on screen; where a reader is
laxer than its format, the format's own check (`npm run check`) refuses it before it ships (said in each section;
`web/tests/README.md` lists the checks). Ids written by hand are lower-case letters, digits and `-` unless a section says
otherwise.

| Interface | Direction | Where | Section | Read by | Checked by |
|---|---|---|---|---|---|
| The song list and score files | in (Claude) | `web/public/scores/index.json`, `scores/*.musicxml` | §1 | `main.ts` start (no check of its own) | check:content |
| Exercise sets | in (Claude) | `web/public/content/sets/` | §6 | `exercise/items.ts` | check:content, check:path (kinds) |
| Chord charts and styles | in (Claude) | `web/public/content/lab/` | §5b | `lab/music.ts`, `screens/lab.ts` | check:content, check:lab |
| Activities | in (Claude) | `web/public/content/activities/` | §8b | `activity.ts` | check:activity |
| The path: rungs, lessons, blocks, media | in (Claude) | `web/public/content/path/` | §8c | `lesson/read.ts`, `text.ts` | check:path |
| The catalogue index | in (built by `web/tools/catalogue/`) | `web/public/catalogue/index.json`, `catalogue/*.mxl` | §5c (Catalogue) | `library/catalogue.ts` | check:content |
| Addresses (links, reload) | in | `?piece=`, `?activity=`, `tab`, `page`, `lesson`, `step`, `tool`… | §7c | `main.ts` start, `nav.ts`, `screens/shell.ts` | check:browser (routes) |
| Files a learner adds | in (learner) | + Add, Share → Piano | §5c (Adding) | `library/files.ts`, `library/midi/` | check:midi, check:browser |
| The practice log export | out (to Claude) | Settings → Export practice log | §7b | Claude | sample in §7b |
| The backup, and restoring it | out and in | Settings → Back up / Restore | §7 (Back up) | `backup.ts` | check:browser |
| A score exported with fingering | out | the score's ⋯ → Export | §1 | MuseScore, any MusicXML reader | — |
| A file you added, exported | out | Music → a piece's page → Export file | §5c | — | — |
| The `Screen` interface, presets, stores | internal | `app.ts`, `activity.ts`, `localStorage`, IndexedDB | §8, §8b, §7 (Saved data) | the app | — |

---

## 0. Home, Practice, Exercises, Settings (owner, 2026-10-15)

`web/src/screens/shell.ts` (with `index.html`'s `#shell`), mockups `web/mockups/home.html` (A, B, D) and `path.html`
(F, G); ChatGPT's review of the mockups (2026-10-15, `design/2026-10-15-home/chatgpt-ux/UX_review.md`) for sizes,
scrolling and honest states.

- **Layout:** each tab and page has its header fixed and its content scrolling under it; the tabs (or rail) and a
  lesson's bottom bar stay put. Sideways and on a tablet Home is two columns (Up next and recent | the lesson's steps); on a tablet Path,
  Practice and Exercises are two columns too (V02).
  Pages over a tab (Settings, Exercises, a lesson) hide the tabs, as the mockups do.
- **Home A (a lesson to do):** *Up next · Rung n · Lesson n · step n of m*, the step's title, "k of m steps done", Start ▶
  (it opens the lesson page and the step at once, so you come back to the lesson page and its feedback). Under it the
  lesson's steps, each in words: *target met*, *played through* (done ✓), *visited* (a step with nothing to judge: it counts,
  without a ✓; V18), *tried, target not met yet*, *skipped* (a later step was played), *up next*, *to come*; a tap
  starts that step (steps never lock). "Switch…" and "All lessons ›". A lesson you came back to with Revisit (every step
  done) shows *Again* and its first step. Then *Recently practised*. The order is always Today → the lesson's steps →
  recently practised (V16): one under the other on a phone upright; sideways and on a tablet Today and recent on the left,
  the lesson on the right. On a tablet (re-check V02) Home has its own layout: Today across the page and larger, and
  under it the lesson's steps on the left, this week's practice (minutes and days) and recently practised on the right.
- **Home B (no lesson):** *Carry on* with what you practised last (from the practice log, or a piece, PDF or chart
  opened from Music: its title, mode, bars if a loop, how it went, when); the line "No lesson yet: pick something from
  Music or Exercises." with both; the recent list (without the Carry on item again). With nothing practised: Music and
  Exercises as ways in. **Carry on** (and a recent row) reopens a score run as it was played (V27): its loop, mode, tempo
  and hands, for that visit (an activity's preset: never saved over your own). A piece of yours since deleted is not
  offered (F19).
- **Practice:** Exercises, Drills, Simon, Accompaniment lab, Free play, Metronome, each with its icon, one line on what it
  is and the last thing done there (Drills, Simon, the lab); two columns of cards on a tablet (V02).
- **Icons** (owner, 2026-10-15: one consistent line-icon set; `web/src/icons.ts`): simple outline drawings as inline SVG,
  one meaning each wherever they appear: home, music (a piece), practice (the keys), path, settings (the gear), exercises,
  drills (cards), simon (going round), lab (the band's drum), free play, metronome, document (a PDF), sound, look, data.
- **Sizes** (review 2026-10-15): text 13 px and up on these screens; ⚙, ← and the segment buttons 44 px; a message (the
  first visit's "Saving for offline…") has its own room above the tabs instead of covering the last rows (V04).
- **Exercises:** every exercise by its `kind` (chips to filter: All, Scales, Five-finger patterns, Arpeggios, Chords,
  Intervals, Cadences, Melodies, Other for a set with none; they wrap), under the one name it has everywhere (the set's
  title, "Test:" kept; V06). **Exercises that are MusicXML are music and open straight on the score** (owner,
  2026-10-15): each item of a set given as a MusicXML file (the melodies set's three) is listed as its own exercise and
  opens on the score screen in a way where you play: **Wait for me**, unless its set's `play` names another (§6; re-check
  V32), the row saying which ("opens on the score in Wait for me (also Play along, Ladder, Rhythm)"); it joins the app's pieces as
  `ex-<set>-<item>` (its choices kept like any piece's) and is not listed in Music; a set whose every item is such a file
  is listed only as these. So is a short score whose `scores/index.json` entry has a `kind` (none yet; an unknown kind is
  listed as a problem). **A set of cards opens with one tap in its kind's default way** (owner, 2026-10-15): Drills for
  scales, five-finger patterns, arpeggios, chords and intervals (flashcards to play on sight, by name or by ear); Simon
  for cadences (a progression built up in order from memory). Inside, **Practise as…** (the "Drills▾" / "Simon▾" button
  on the exercise screen) switches the same set to the other way. ← comes back to Exercises. On a tablet the kinds are
  two columns (V02).
- **Settings** (⚙ on Home; app-wide only): piano plays through (phone / MIDI keyboard; said when there is none to play
  through), piano and click volume, click sound, Keyboard controls (§7), theme, export practice log (with its count)
  and "delete entries older than a month", back up, restore, and what is saved for offline. The same stores as before
  (`piano-web.app.v1`, the remote, the log, the backup); the Tempo panel inside a piece keeps its piano-out and volume
  controls (the same settings).

---

## 1. Score screen: songs and exercises

**For:** reading and playing a real piece (a song, or a short exercise piece or loop written as music), with the
music always readable ahead of where you are.

**Content:** MusicXML (`.musicxml`) files in `web/public/scores/`, listed in `scores/index.json`, a list of entries:

```json
[ { "id": "mozart-k2", "title": "Minuet in F K. 2", "composer": "W. A. Mozart", "file": "mozart-k2.musicxml",
    "source": { "dataset": "PDMX", "mxl": "./mxl/14/37/QmWPF….mxl", "uploadTitle": "W. A. Mozart Minuet in F Major K2." },
    "license": "cc-zero", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "status": "engine test score; notes not verified against a printed edition" } ]
```

| Field | Type | Needed | What |
|---|---|---|---|
| `id` | text: lower-case letters, digits, `-` | yes | how the piece is named everywhere else (`?piece=<id>`, an activity's or score block's `piece`, a set's `"from": { "score": <id> }`, saved settings, fingering, Memorise and progress), so it never changes once used; unique; never starting `u-` (the library's pieces) or `ex-` (a set's music, §0) |
| `title` | text | yes | as shown everywhere |
| `composer` | text | yes (`""` when unknown) | keeps any doubt the file states ("J. S. Bach?") |
| `file` | a `.musicxml` or `.xml` file name in `scores/` | yes | read as text (an `.mxl` is not unzipped here) |
| `source` | `{ dataset, mxl?, uploadTitle? }`, each text | no | shown in ⓘ and on the piece's page as "dataset, uploaded as “uploadTitle”"; `mxl` is the PDMX path, kept for the record |
| `license`, `licenseUrl` | text; an `https://` link | no | the transcription's licence, shown in ⓘ |
| `status` | text | no | what was verified, shown in ⓘ and on the piece's page |
| `kind` | one of the exercise kinds (§6) | no | also lists the score in Exercises under that kind, opening on the score (§0; it stays in Music); none so far; an unknown kind is listed there as a problem |

The list's order is the library's order (Music). The app reads this list **without checking it** (`main.ts` start: a
typo'd field or a missing `file` loads silently; a reader finding of 2026-10-15); `npm run check:content` checks every
rule above, and that every file in `scores/` is listed. A new score is added by putting its file in `scores/` and its
entry in the list, then deploying. Exercises (scales, five-finger patterns, cadences as music) are simply short scores.
Fingering written in the file shows when Display → Fingering is on; the learner can add their own (⋯ → Edit fingering).

**Exported with fingering** (⋯ → Export score with my fingering; `marks.ts` `addFingerings`): a file named
`<id>-fingering.musicxml`, the score's MusicXML as the app read it (a file you added: unzipped if it was an MXL),
with each finger you placed written into its note as `<notations><technical><fingering placement="above">3</fingering>`
(`above` on the top staff, `below` on the others), replacing a finger the file had on that note; nothing else changes
(not the look, not the app's settings). With no fingering of yours it is the file as read. MuseScore opens it with the
fingering. Your fingering is kept in `piano-web.marks.v1`: per piece, `{ m, rel, midi, staff, finger }` (bar index in
file order from 0, beat in the bar in whole notes, MIDI key, staff from 0 across the score, finger 1-5).
The three scores shipped now are engine test pieces, not checked against printed editions. `composer` keeps any doubt the
file itself states (BWV 514's file credits "Johann Sebastian Bach?", so the list says "J. S. Bach?"). BWV 514, titled a
chorale, is a melody over a single bass line, not four-part harmony: not material for teaching chorale (block-chord)
playing (review 2026-10-15, B8-02/B8-03).

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

**A piece that can't be drawn or read** (review 2026-10-15, P01): whatever way it was opened (Music, Memorise, its
address, a lesson or activity), the drawing of the piece before is cleared and the screen says "“…” could not be drawn:
<reason>" (or "could not be opened" when its file can't be had), with ← Back; it was a toast over the previous piece's
music before. Nothing to start is offered then (re-check P14): the score's bottom bar and Memorise's panel are hidden,
the keys lit from the piece before are cleared, keys played start nothing, and "Tap anywhere to start" does not show.
Bars of rests in a row are drawn bar by bar (OSMD's multi-bar rests are switched off): the page layout
failed on the bars a multi-bar rest swallowed ("reading 'ParentMusicSystem'"), in our code (`follow.ts` chunkRanges),
and the marker follows the music bar by bar anyway. OSMD itself fails on a glissando whose end is on another line
("reading 'HasEndLine'"): that drawing is made without glissando lines, and a note says so (sideways, the one line draws
them). Measured on the real PDMX set, upright at 390 px (the 300 most viewed piano files and 100 lead sheets not hidden
by their flags): 19 and 5 failed before, 0 and 0 after.

**Score files:** solo piano, right hand on the top staff (the app takes the top staff as the right hand and every
other staff as the left). A file with other parts or more than two staves is opened with a note saying the hands may
be wrong. A per-score hand map is to be added when a piece needs one.

**Hands:** L / R / Both / Off. In Watch these are the hands the piano plays (a change while it plays is heard at
once); in the other modes the hands *you* play (the piano plays the rest; Off = you play everything, piano silent), and
a change ends the run there, as a change of mode does: a run going stops with its summary for the hands it was played
with, a run paused by itself is over; the next ▶ or key starts one with the new hands (review, 2026-10-15). Tempo: speed and beats per minute, ±5,
tap tempo; metronome (click sound, beats/quarters/eighths, volume); piano through the phone or out to the MIDI
keyboard. Loop: tap the first and last bar; one bar of count-in clicks each time round (none in Wait for me).
**Band** (owner, 2026-10-15; a piece added from a MIDI file that has other parts than piano): the file's other parts
(bass, guitars, strings, drums …) play with the score on its own timeline, at its speed and round its loops, in
Watch, Play along, Rhythm and Ladder (not Wait for me, which keeps no tempo). On by default; Tempo and sound lists
the parts, switches the band off for the piece, and sets its volume (one for the app). The sounds are the FluidR3
General MIDI set the Lab uses: basses and guitars kept in the app, any other instrument fetched online (offline, a
part that cannot load is left out and said). The band is read from the piece's MIDI file when the piece opens; a ▶
tapped before that read ends waits for it, so the first run has the band too (review 2026-10-15, B7-03).
`web/src/screens/score.ts` (loadBand, songNotes), `library/midi/band.ts`.

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
octaves that follow the music (keys wide enough to tap; owner, 2026-10-13); in the timed modes they only show.
Following, every key wanted now is always on the keys (starting on a C when the notes allow, otherwise at the lowest
note wanted, so F3 and F5 together show F3 to F5), the coming notes too where they fit; only notes wanted now further
apart than two octaves widen it (owner, 2026-10-15: F5 was off the keys). Wait for me with the keys showing starts
without a MIDI keyboard (no MIDI in the browser, not allowed, or still being asked) and says to play on the keys below;
the timed modes still need one: with none connected, or MIDI not allowed, ▶ in Play along, Rhythm or Ladder starts
nothing and says "No MIDI keyboard found. This mode listens to one: plug it in, or choose Wait for me to play on the
screen." (final review F17; the browser's own permission sentence is never shown). On a phone held sideways the keys
are off, so Wait for me with no keyboard says "No MIDI keyboard found. Turn the phone upright to play on the screen’s
keys, or plug one in." and starts nothing (owner, 2026-10-15). Choosing another mode ends a bar pick under way (Loop's
or Ladder's), as Cancel does. Leaving the piece (← or Back) during a Play along, Rhythm or Ladder run ends it quietly:
it is logged, and no summary opens over where you land (owner, 2026-10-15, F04); Loop tapped during a run stops it with
its summary and log first (F02). The warning that a file has more parts or staves than two hands is said only for the
piece opened. The rest of a chord pressed while a run starts counts for the first notes, as the key
that started it does. With the keys showing in Wait for me, the bottom bar sits above them, never over them. In the judged
modes it pauses by itself on silence (3 s with two or more of your notes due), on mashing (6+ keys not in the
score within ¼ s) or when the phone turns (the music is laid out again; Watch just pauses; Wait for me waits at your
next notes again, also when the piano was leading on to them: 2026-10-15), and carries on from your next key, or *See how it went* in the pause message ends the run with
its summary; the parts add up to one summary. **A panel opened over a run** (Tempo and sound, Display, ⋯, ⓘ;
owner, 2026-10-15) pauses it the same way ("Paused while a panel was open. Play to carry on."): keys
played while it is open count nothing, and after it closes your next key carries the run on. Wait for me has no clock:
behind a panel the piano leading on to your next notes stops and your keys don't count; closed, it waits at them
again. A ▶ still getting ready when a panel opens is dropped. Watch plays on behind a panel (nothing is judged, and
adjusting tempo or volume while listening is the point). `web/src/screens/score.ts` (`panel`). *Music while playing* off
(Blind): the music hides while you play.

**Fit for lessons:** any piece or short exercise score; choose the mode by goal (notes → Wait for me; tempo → Play
along; speed → Ladder on a loop; rhythm → Rhythm). Judging needs a MIDI keyboard (Web MIDI: Chrome/Android, not
Safari; every connected keyboard counts, a key held on either is down, and one unplugged lets its keys go); Watch needs none.

---

## 2. Memorise (its own screen)

**For:** learning a real piece by heart, chunk by chunk, with the app doing the hiding, checking, replaying and
moving on so the learner just plays and takes in the corrections. `web/src/memorise.ts`, `web/src/main.ts`.

**Reached:** on a piece's score, ⋯ → *Memorise this piece* (← goes back to the score), or Music → a piece's page →
Memorise (← goes back to Music). It uses the score's drawing of the
piece, nothing else of the score screen. Back while its piece is still loading leaves it shut (F08); an exercise's
music (`ex-…`) opens in it after a reload or Carry on too (F18). Before ▶, its opening line follows its Settings as they
change (F21).

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
Memorise and on the piece's page in Music; notes + rhythm is kept over a later notes-only pass). Otherwise the bars to practise are
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
waited for; listening, or a timed pass, starts that again. **Settings opened during your turn** (owner, 2026-10-15)
pauses it: keys count nothing while it is open; a pass (or the notes test) waiting for your notes gives no hint
meanwhile and, closed, waits at the same note; a timed pass (or the notes + rhythm test) stops, nothing of it kept, and
waits to start again from where it began (its clock cannot carry on: the same rule as turning the phone). Listening and
the moments between passes carry on.

**Fit for lessons:** a piece (any score) once its notes are known; chunk size and "learned after" set the load.
Known gap: with repeats, only the first time through is walked.

---

## 3. Simon (exercise screen)

**For:** remembering small units — notes, intervals, chords, scales, arpeggios — as a game: a chain that grows by
one each round until you slip. `web/src/exercise/simon.ts`.

**Reached:** Practice → Simon, an exercise in Exercises whose kind opens in Simon (§0), a lesson's step, a link. The
header's **Simon▾** is *Practise as…*: the same set in Drills (owner, 2026-10-15). ← at the top left goes back where it was opened.

**How it works:** the app gives the chain (as the help level says), it stays shown until your first key, then you
play the whole chain from memory; right → one more item; a miss shows the wrong key red and the wanted keys
outlined, names what was due, and replays (the whole chain or from the missed item) after a try is used (3 tries /
game over / keep going). Pools add a random item each round; passages grow in their own order; a completed passage
is drawn whole. Best chain kept per set and level (help rung, matching, what a miss costs): the whole chain played in
one go without help (a chain finished from the miss on is practice, "not a best"; so is one helped; review, 2026-10-15). While the Level panel is
open keys count nothing and start nothing (owner, 2026-10-15; also Drills): your turn has no clock, so it simply waits;
a chain being given when it opens (played, shown, or again after a miss) stops and is given again from its start when
it closes. A level changed there starts afresh.

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

**Reached:** Practice → Drills, an exercise in Exercises (most kinds open here, §0), a lesson's step, a link. The
header's **Drills▾** is *Practise as…*: the same set in Simon (owner, 2026-10-15). ← at the top left goes back where it was opened.
Back from Simon to Drills in a lesson step's set, the step's own level comes back (F22). With no MIDI keyboard
connected (or MIDI not allowed) the Ready screen says "Cards are judged from a MIDI keyboard; none is connected." until
one is seen (F17). A set file that could not be read is read again the next time Drills or Simon opens (F20).

**How it works:** a card appears at the chosen help level (1–2: it plays the card first; 4: the name only, and any
octave counts, held as written in whichever octave you play; 5: by ear, it plays and you play it back). A timed card starts after a bar of count-in clicks or on
your first note (by ear: always your first note); the metronome can keep clicking. Cards are judged:
- **with written rhythm** (MusicXML items, bars from a piece): in time, as Play along (on time and held / let go
  early / early / late / missed, wrong keys; *On time* relaxed / normal / strict);
- **without** (notes, chords, intervals): as the set says — the right notes in order, or steady beats of a given
  length (steady beats are judged on when, not how long); *On time: notes only* judges every card on notes alone.

A right card moves on by itself; one with slips shows them on the card (missed green, early/late amber, wrong keys
red) and waits for *Again* or *Next*. *Again* replays the card and that try replaces its result (a set is always N
cards: a retry never adds one). A pool is dealt like a shuffled deck (owner, 2026-10-15): every item once before any
comes again, then shuffled again, never the same card twice running (across a reshuffle or into the next set either), so
a set of 5 from 3 items holds all 3 and 6 from 3 holds each twice; a passage gives its items in order, and *the misses
again* in the order they were missed. A card got right on Again shows as "right on a retry", not clean, and is not one of the misses.
Help (*Hear it*, *Show me*, or the hint after 8 s without a key on a notes-only card, which names the notes when the keys aren't shown) is
noted and the card doesn't count as clean. Notes-only cards have *Skip*. A set is 10 / 20 cards, or endless with a
*Finish* button; then each card's result, *the misses again* (just those) or a new set. Best kept per set and level
(help rung, On time) and set size, from full sets only (not one stopped early by a mash or Finish, not an endless
one), shown on the Ready screen and at the end; tempo per set. A name to play
is drawn flashcard-size; with the result the music appears and the name sits small above it. On a tablet A+ can
make a card bigger than the score's biggest size, up to filling the room. A card never grows,
so it is drawn on one line, centred and as big as the room allows (never past the score's biggest size, 180%);
A−/A+ make it smaller than that (Simon instead keeps one size and builds from the left).
**The Level panel over a card** (owner, 2026-10-15): keys count nothing while it is open, and the card carries on when
it closes: one waiting for your first note, or a notes-only card, waits on (the 8 s hint counts from the close); one
being played to you is played again; a count-in starts again; a card whose clock was running starts its try again
(count-in or first note, as set; what was played before is dropped, and it is not a retry or help); a clean card's move
to the next waits for the close. A level, tempo or set changed there starts afresh.

**Content:** item sets (§6), one item per card; for sight-reading give MusicXML items with real rhythm; for
name or scale cards give `notes`/`chord` items with a `name`, and `rhythm` in the set if timing should count.
Fresh generated cards (new music each time) are planned as another source of items, not built.

---

## 5. Free play (Practice → Free play; ← at the top left goes back)

**For:** playing anything and seeing what it is. The keys you play light up and are named, with the chord or
interval they make (two keys named as the Intervals column names them: an octave is "octave", C3 + E5 "major 3rd + 2
octaves"; final review F16); below, three columns of what you played lately (newest on top): chords held together (three
or more notes that make a named chord), notes (keys pressed together on one line), intervals (note to next, with
direction, and two notes held together; wider than an octave it says so: "major 3rd + 2 octaves"). *Show* turns
columns off. Nothing is judged or kept. `web/src/freeplay.ts`.

**Metronome** (owner, 2026-10-15): on its own, Practice → Metronome (`web/src/screens/metronome.ts`): tempo (−5/+5, a
slider 20–300, tap tempo), beats in a bar (1–7, the first accented), its sound (Wood / Beep / High: the app's click, one
setting for the app), ▶ Start / ■ Stop, a dot per beat. It is the app's own click on the audio clock (Sound.play with
beats only: what the score and the drills use), not a new engine. The keyboard's highest key starts it, the lowest (or
a mash) stops it. Nothing is judged or logged; tempo and beats are kept (`piano-web.metronome.v1`). With a score, the
metronome is still in the Tempo panel.

---

## 5b. Accompaniment lab (Practice → Accompaniment lab, or a chart in Music)

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
  in music words ("Bar 4 C7: you played C E G; it needs B♭ (the 7th) as well"); a key not in the chord is named from
  the chord's key signature (flats for flat-side chords and C: "E♭ isn't in C7", "A♭ isn't in Cm"; 2026-10-14). Chords on the beat are held until the
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
  (as Ladder). A result shows only for the chart, part, step and bars it came from. The style is the chart's (content, not a choice; owner, 2026-10-13). ⚙ while
  the band plays pauses it (owner, 2026-10-15): the round it was in is dropped (not judged or logged; keys played while
  ⚙ is open count nothing), and when ⚙ closes a bar of count-in leads back into the start of that round, the same run
  (the rounds before it stand; parts switched in ⚙ play from there). ⚙ sets which band parts play (drums, bass,
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
which, in what order and in what words is content.

**Every field** (`lab/music.ts` `readChart`, `readStyle`, `readLadder`; 2026-10-15):

| Chart field | Type | Needed | Default, range |
|---|---|---|---|
| `title` | text | yes | shown in the lab, in Music and in the log |
| `bars` | list of text, at least one | yes | each a chord symbol Tonal reads (`C7`, `Am`, `F#m7b5`), or several separated by spaces, splitting the bar evenly; no slash chords |
| `meter` | text like `"4/4"`, `"3/4"`, `"6/8"` | no | `"4/4"`; 6/8, 9/8, 12/8 are counted in dotted quarters |
| `tempo` | number | no | 90; 20–300 quarter notes a minute (6/8, 9/8, 12/8: dotted quarters a minute; `formOf`) |
| `style` | a style's id | no | the first style listed in the chart's metre |
| `improvise` | `{ "scale": "<Tonal scale name>" }` | no | none: no scale is lit pale (Lead's scale step lights the chord notes only) |
| `steps` | `{ "accompaniment": [...], "lead": [...] }` | no | the built-in ladders; each a list of kinds, each kind once, or `{ "kind", "name", "detail", "doing" }` to give a step its own words (`name` the step's name, `detail` its line on the ladder, `doing` the instruction while playing) |
| `cleanForNext` | whole number | no | the lab's 2; 1–10 |

| Style field | Type | Needed | Default, range |
|---|---|---|---|
| `name` | text | yes | shown with the tempo |
| `meter` | as a chart's | no | `"4/4"`; a chart plays only with a style in its own metre |
| `grid` | whole number | no | 2; 1–8 steps a beat in the drum patterns (3 = triplets, swung off-beats) |
| `drums` | `{ <drum>: "<pattern>" }` | no | none; drums: kick snare rim clap hihat hihat-open ride crash tom-low tom-high tambourine cowbell; a pattern has one character a step for one bar (beats × grid; spaces ignored): `x` hit, `X` loud, `o` soft, `.` none |
| `bass` | list of `[beat, degree]` | no | none; beat 1-based, may be fractional (2.5), inside the bar; degree root third fifth sixth seventh octave approach |
| `chords` | list of `[beat, length]` | no | none; length in beats, above 0 (what the style step asks you to play) |
| `instruments` | `{ "bass", "chords" }` | no | `acoustic_bass` and `piano`; any FluidR3 General MIDI sound name (snake case, `electric_bass_finger`) or `piano`. Kept in the app for offline: `acoustic_bass`, `electric_bass_finger`, `acoustic_guitar_nylon`, `acoustic_guitar_steel`, `electric_guitar_clean` (`sound.ts` `BUNDLED_PARTS`); any other is fetched online |

The index is `{ "charts": [<path>…], "styles": [<path>…] }`, paths from `content/lab/`; ids are the file names
without `.json`. A chart's id is what an activity's `chart` and Music's `chart:<id>` name. **The reader is laxer than
this** (reader findings of 2026-10-15): it ignores a misspelt key inside `improvise`, `steps`, `instruments` or a step's
words, takes any instrument name (one that is no sound fails only when the band loads it, said on the band line), and a
bar or drum pattern that is not text gives a JavaScript message. `npm run check:content` reads every chart and style
with the lab's reader and refuses all of these, a style missing or in another metre, and a file not in the index. Melodies are never made up: the band plays only the chords, in the style. Sets marked "Test:"
are placeholders. **Not built yet** (next): songs with their own melody (a lead sheet: "play the melody" judged as Play
along, and the accompaniment under a real tune) and several-part MusicXML files (each part on its instrument, you take
one); examples to copy written into a chart.

---

## 5c. Library: the Music tab (owner, 2026-10-13, 2026-10-15; mockups `web/mockups/library.html`, option A)

**For:** finding anything you play from: the app's own scores (`scores/index.json`) and chord charts
(`content/lab`), and the files you add. It is the Music tab (owner, 2026-10-15): everything below works as before. `web/src/screens/library.ts`, `web/src/library/*`.

- **The list:** search (titles, composers, your tags; accents ignored; each word matches the start of a word, any
  order), one line of chips (♥ Favourites, Kind, Key signature, Time, Bars as printed, and Tags once you have any),
  each opening a small sheet whose choices are the ones the other filters leave; the count line names what is set,
  and nothing matching says so with Clear. Sort: Recently opened (default; never opened after, newest added first),
  Recently added, Title, Composer, Fewest bars. A row: title, then composer · kind · key signature · time · bars;
  ♡ and ⋯ (its page). Phone upright: a row's tap opens it; sideways and tablets: the list on the left and the page
  of the row tapped on the right. Android Back: a page back to the list, the list (the Music tab) back to Home. A piece's row and its page show
  its memorized marks (Memorise's test), per hand, in Memorise's words, as the old song list did (re-check V34).
- **Facts come only from the file** (`library/facts.ts`): kind (piano = one part on two staves, melody = one staff,
  lead sheet = one staff with chord symbols, several parts), key signature (major or minor only where the file says;
  whether it changes; as written when the first part is a transposing instrument), first time signature (and
  whether it changes), bars as printed (an implicit measure after the first, a bar split around a repeat, is not
  counted again), lowest and highest note (not for several parts), chord symbols. The title is the one printed on
  the page first (MuseScore can keep an old work title), the composer its first line. Never a level, genre or other
  catalogue guess. A file that can't be read is listed as "score"; one of the app's own that could not be fetched
  (offline, say) is read again the next time the library opens, and so is a chord chart (2026-10-15).
- **A piece's page:** Open (the score screen, or the lab for a chart) and Memorise; the first bars drawn small; the
  facts; your tags (+ tag, ✕); where it came from (the app's own: source and licence of the transcription; yours:
  the file and date); the scores list's status line ("notes not verified…"); a warning for several parts (the score
  screen takes the top staff as the right hand; choosing the parts comes later) and for a transposing first part.
  Yours: Rename (library and score), Replace file… (a corrected file: the piece keeps its id, so its Memorise data,
  choices and fingering stay; a score only by a score, a PDF by a PDF; it says to check fingering; a MIDI piece's band
  is read again from the new file, F09), Export file (as
  added, under its own name; a piece made from a MIDI file exports the MusicXML the app made, `<name>.musicxml`: the
  MIDI file itself leaves the phone only in a backup), Delete (asks; also removes that piece's playing choices, look, fingering and Memorise data:
  `library/forget.ts`, and Memorise reads its store again so it can't write them back; a PDF's saved place and
  lines go too, 2026-10-15, so the same PDF added again starts fresh; a deleted piece leaves Home's recent list, the
  log keeping its runs, and an old link to it says it is no longer in your library by its title, F19). A PDF opens in
  the PDF reader (§5d), whose address names it (`tool=pdf&piece=…`): a reload comes back to it (F12).
- **Adding** (+ Add; several files at once): MusicXML and MXL (title and composer from inside the file), PDF (kept
  as is). Recognised by contents, not name (UTF-16 MusicXML too); up to 64 MB a file (any kind), and 16 MB of
  MusicXML once an MXL is unzipped; the same file again (by its contents, even one that replaced another's) is "already in your library";
  anything else gets one sentence; a file with several parts is added with the warning. One file: a toast with Open (in two panes it lies over the list only, never over the piece's page: F14); several: a list of what happened to each. What was just
  added is on top, marked, with search and filters cleared, for this visit (your sort is kept). **Shared from
  another app** (Share → Piano, Android, the installed app only: the manifest's `share_target`): the service worker
  takes the POST to `./share-target`, keeps the files in the cache `piano-shared` and opens the app with
  `?shared=1`; the library opens and adds them as above. (A change to the share target reaches an installed app
  only when Android refreshes it, which can take a day.) **MIDI** (`library/midi/`, the old app's converter,
  ported 2026-10-13 and improved 2026-10-14; its unit tests: `npm run check:midi`): converted on the phone, then a
  sheet shows the first bars and what was read from the file and what was guessed (hands kept as recorded or split,
  tempo, key, time), with **Swap hands** (exchanges the staves, clefs kept) and a tempo to state; Add keeps the
  MusicXML and the MIDI file beside it (`<id>:midi`, in the backup too), Cancel adds nothing. A file stating no
  tempo is written without one (the score screen's default applies). Bars follow every time signature the file
  states (a pickup written as its own short bar becomes bar 0; metre changes are written where they fall); the key
  is the file's own, with its changes, and estimated from the notes only when the file states none, or states only
  C major while a quarter or more of the notes fall outside it (a sequencer's default); notes are spelled from the key in force. Grids per bar: sixteenths or triplet
  eighths, and 32nds, sextuplets and 64ths only where a bar's notes sit exactly on them, or where a run of one key
  (a trill, a tremolo) has more strikes than the bar's grid has places: halved until they are apart, never pushed
  later. Two strikes of one key at the same moment or a hair apart (a part doubling another, a near-zero-length
  note before a note) are written as one note, and the sheet says how many; a unison between two kept tracks stays
  on both staves. Triplets are written with their groups marked, so the "3" is drawn. Eighths and shorter are beamed
  within the beat, a half bar of plain eighths in 2/4 and 4/4 as one group of four; a note held from a beat is written
  in the longest whole-beat value that does not hide the bar's middle (a dotted half and a dotted eighth, not tied
  quarters) (2026-10-15, compared with the published arrangement of the owner's Seize the Day). A file played in
  with the sustain pedal (the owner's Warmness on the Soul): a note the pedal holds until the next note of its hand is
  written to it, and a key held a little into the next one is cut there (legato), so a bass struck short under the
  pedal is the whole note the published page has; and (owner's answer A5, 2026-10-15) it is written as the published
  arrangements write it, one voice a hand: a key held past its hand's next note is written to that note (under the
  pedal the sound is the same; a key a finger holds through a change of the pedal is written shorter than it is held,
  the owner's choice of 2026-10-15, "one voice, like the published page"; a file exported from a notation program keeps
  its written lengths, told by its chords being let go at one moment: Seize the Day 578 of 583, Warmness 7 of 343), a note the pedal holds is written as long as it sounds (as far
  as one note-head reaches in its bar), and a silence after the pedal lifts is measured from the lift, one under an
  eighth taken for the pedal changing (Warmness: 124 of its 141 lifts come under 0.44 of a beat before the next note).
  Warmness: extra voices 1.14 → 0.10 a bar, ties 1.52 → 1.05. Rests show the beat (Gould, Behind Bars; 2026-10-15):
  a rest begun off a beat is written to the beat first, and one begun on a later beat of a bar of an even number of
  beats does not run over its middle (in 4/4 a half rest only on beat 1 or 3; Seize bar 3 had one on beat 2½). A notation program's export that plays every note a
  share of its written length (owner's answer A6: Seize the Day, 95%) has that share found (the one at which most
  lengths come out as whole twelfths of a beat, from 100% down to 80%) and undone before the grid, so a half note in a
  bar of sextuplets is a half, not tied triplet pieces (Seize bars 157 and 159); a played file has none (at most 32% of
  its notes fit any share). A release already on the grid is kept; silent bars before the first note (a count-in) are left out; a
  stated C major is taken for a default when the notes fit another key four times better (Warmness: 10% F♯, 1% outside
  G). Checked against MuseScore's own MIDI import on the two songs (2026-10-15): about equal on Seize the Day, far
  worse on Warmness (clef changes, the empty bars, no key), so the app keeps its own converter. Notes are paired by MIDI
  channel as well as key, so two hands on two channels holding one key stay two notes. A file whose notes mostly
  miss the grid (played, not written) is said to have guessed bars and rhythms. Each hand is written in up to three
  voices (owner, 2026-10-14): notes struck together that end together are one chord (and, 2026-10-15, ones the file lets go
  less than a fifth of a quarter apart: a hand's keys come up raggedly, and each difference had made another voice); a melody held over moving notes,
  or a note held under a moving melody, gets a voice of its own, the top of the texture keeping the first; while two
  lines go on, a new note joins the one it is nearer in pitch; stems up for the highest voice in a bar, down for the
  others; a played file keeps one voice a hand. Tidied as a score is written (2026-10-15, `tidy.ts`): in one voice, a
  silence the file has as less than a 16th before the voice's next note is a lifted finger and the note is written to
  it (no "dotted eighth, 16th rest"); a first voice's rest wholly under another voice's note of its staff is not drawn
  (the later voices' silences never were). The sheet says how many notes were given their chord's length or written
  to the next note. `tests/readability.mjs` counts per bar what a reader notices (visible rests, short rests, rests on
  another voice's notes, extra voices, ties, tuplets, 32nds) on six catalogue scores turned into MIDI (as exported and
  as played) and the owner's two songs, against the engraving, and how many notes come out as the engraving writes
  them; a change that makes any count worse fails it. Rests are counted as silences (a rest split at the beat is one),
  and rests that hide the beat are counted as a defect (none in the six engravings); the rest symbols are printed only. A band file (2026-10-15): the score is the file's piano part (every
  note on a channel set to a General MIDI piano, programs 0-7, on any track; a channel the file never sets is a
  piano, as General MIDI says; a channel that changes instrument partway is a part per instrument, each note the
  instrument in force where it starts: review 2026-10-15, B7-01), and the other parts and the drums (MIDI channel 10) are not written but kept to play
  as the band; the sheet's Band row names them, and the bars run as long as the band plays. **Parts** (owner,
  2026-10-15: "Let me pick the parts"): the sheet lists the file's parts (name, instrument, notes, range; a track
  holding several parts, as a one-track file does, names each by its instrument, B7-02), each ticked
  if the score is made of it, and a change converts again; the drums are always the band. A file with no piano part
  gets a guess, said: the highest part (where a tune usually is) and the bass; two parts in the score are the hands,
  the higher on the upper staff. The choice is kept with the piece (`scoreParts`), so the rest play as its band.
  Turning a band's parts into a real piano arrangement (voicing, filling in harmony) is not done. Swing (off-beats written straight with "Swing eighths") is found only in a duple beat with
  late off-beats and nothing at a third of the beat: never in 6/8, 9/8 or 12/8, nor in triplets. Previously converted files keep
  their old conversion; adding the MIDI again converts it anew.
  **How close it comes** (measured 2026-10-14 in a cloud session against ASAP's 235 score MIDI files and their
  published MusicXML, on the 180 the comparison could line up): 98.0% of notes at the right time and pitch (96.1%
  of the notes written are right), every barline (0.4% extra), the opening key on all 180, spelling 94.2%, written
  lengths 89.5%, the staff 96.5%; its own check passes on all 235 (measured before `tidy.ts`, 2026-10-15; not measured again since:
  ASAP is not on the machine that made it). Its own check (the import sheet's "Checked") compares
  the score read back with what the converter decided: every note at its time and pitch, and since 2026-10-15 on its
  staff and at its length (a note moved to the other staff or held for another length is listed and the check fails);
  it proves the score says what was decided, not that the decided lengths or a split's hands are the music's.
  **Not handled yet:** a rolled chord as a cascade of tied short notes; grace notes and ornaments as real short notes
  (looked at 2026-10-14, Beethoven Op. 78 bar 28 drawn by OSMD: the score file states the bar as 65/4 and cuts it
  short after four beats and a 64th to give a trill real time, and it comes out as that metre over a thicket of 64th
  chords, unreadable); groups of 5, 7, …
  moved onto the nearest grid; only the first tempo; a fast trill a hair off the grid comes out as sixteenth-note
  pairs (finer grids are taken only where notes sit exactly on them); a one-track file holding a single line is
  still split between the hands. A played file recorded without a click has no reliable bars.
- **Catalogue** (tab beside Yours, shown when the build has one; a catalogue that could not be read is asked for
  again the next time the library opens; `library/catalogue.ts`, built by
  `web/tools/catalogue/`): about 1,600 PDMX scores (855 piano, 776 lead sheets, within ~25 MB) picked by reading their notes: piano (one part, two staves)
  and lead sheets (one staff with chord symbols). The index holds what the app's own reader (`facts.ts`) reads from
  each file, a composer only when it matches the composer table (`tools/catalogue/composers.json`; a bare surname
  stays a surname), MuseScore's view count (shown as exactly that) and the uploader's licence for the
  transcription. Never PDMX's genre, difficulty, tags or ratings. Uploads of one piece fold into one row ("2
  versions"). Sorted by views first; Title, Composer, Fewest bars. Rows drawn 100 at a time (Show more). + Add (on
  the row or the page) keeps the file as yours (id `u-` + its SHA-256 start, so the same file added by hand is the
  same piece); in the installed app the files are saved for offline with it, so adding works offline. Each tab keeps its own search,
  filters and sort. **Named by lessons and activities** (owner, 2026-10-15): a step, an activity or a lesson's score
  block may name a catalogue piece by the id it gets when added, `u-` + its catalogue id (§8b, §8c). Opened when it is
  not in your library yet, it is added first by the same code as + Add (`addFromCatalogue` in `library/catalogue.ts`:
  the same record, origin "catalogue", PDMX source and the uploader's licence), works offline, and says one line
  ("Added “…” to your library (Music).", after the activity's title on the message line); then the step carries on. So
  a piece added by hand and one a lesson added are the same piece, with the same choices, fingering and Memorise data.
  Two opens at once share one add (the file is fetched and kept once). A file that can't be had is said ("“…” could
  not be added from the catalogue: …"), nothing opens and the step marks nothing; a `u-` id in neither your library
  nor the catalogue gets the usual "there is no piece". Deleted in Music, a lesson-added piece is gone with its data;
  the next step or score block naming it adds it again, fresh (accepted, owner 2026-10-15).
- **The catalogue index's format** (`public/catalogue/index.json`, written by `tools/catalogue/build_index.cjs`, read by
  `library/catalogue.ts` `loadCatalogue`; 2026-10-15): one object, columns named once to keep it small:
  `{ "version": "2026-10-14", "source": "<words>", "fields": ["id", "file", "title", "composer", "kind", "fifths", "mode",
  "keyChanges", "time", "timeChanges", "bars", "low", "high", "chords", "views", "group", "licence", "bytes"], "rows":
  [["a7e57437303b", "a7e57437303b.mxl", "MEGALOVANIA", "Toby Fox", "piano", -1, null, 0, "4/4", 0, 60, 34, 91, 0,
  1706949, 0, "CC0", 21493], …] }`. Each row has a value per field, in the fields' order: `id` the first 12 hex digits of
  the file's SHA-256 (the piece is `u-<id>` once added); `file` its `.mxl` in `catalogue/`; `kind` piano or lead;
  `fifths` sharps + / flats − (null: none read); `mode` major / minor / null; `keyChanges`, `timeChanges`, `chords` 0 or
  1; `time` "3/4" or null; `bars` bars as printed; `low`, `high` MIDI keys; `views` MuseScore's view count; `group` the
  row it folds into (uploads of one piece share it); `licence` the uploader's licence; `bytes` the file's size. Today:
  1,826 files folding into 1,631 rows (1,050 piano files, 776 lead sheets). The reader takes the columns by name, so
  their order may change; a field missing reads as nothing, and an index it cannot read is no catalogue (said nowhere
  but the tab not showing). `npm run check:content` checks every field the reader reads is there, every row's length,
  id, kind and bars, and that every file is in `catalogue/`.
- **Promoting a catalogue piece into the app's own scores** (Claude's procedure, owner 2026-10-15; not done for any
  piece yet): for a piece a lesson leans on, so its notes are checked and it ships as one of the app's own.
  1. Its MusicXML, unzipped from the catalogue's `.mxl`, goes to `web/public/scores/<id>.musicxml`, and an entry in
     `web/public/scores/index.json` with the fields the three there have, and only those: `id` (a readable name like
     `mozart-k2`, never `u-…`: the app reads `u-` ids from the library on the phone), `title`, `composer`, `file`,
     `source` (`dataset` "PDMX", `mxl` the PDMX path of the upload, `uploadTitle` its title there: neither is in the
     shipped index; they come from the catalogue builder's inputs, `chosen.json` and `PDMX.csv`, and what can't be found
     is said in `status`, not guessed), `license` and `licenseUrl` (the index's "CC0" is `cc-zero` with
     https://creativecommons.org/publicdomain/zero/1.0/, "Public Domain Mark" is `publicdomain` with
     https://creativecommons.org/publicdomain/mark/1.0/, as written there), and `status`, which says exactly what was
     verified (the existing ones: "engine test score; notes not verified against a printed edition").
  2. Lessons and activities naming its `u-` id are changed to the new id. (A learner's choices, fingering and Memorise
     data stay with the library copy under the `u-` id: moving them is not built.)
  3. `npm run check:notes` then covers it with the others. What that check proves: the pitches the score screen draws
     in each bar are the file's. What it does **not** prove: that the file is the published music. It compares the
     app's drawing with the file, never the file with a printed edition. The notes have to be read against an
     independent source (a published edition or a scan of one, bar by bar), and `status` says what was compared, with
     what, and how far ("bars 1–16 read against …; the rest not verified"); anything not read is said as not verified.
- **Full PDMX set (PC side; owner, 2026-10-15; mockup `web/mockups/pdmx-full.html`; the phone side is the next bullet).**
  The whole set as a third tab, set up as piano + lead sheets + melodies or everything. Built on the PC by
  `web/tools/catalogue/scan.py` then `full_set.py` (`rows`, `zips`, `index`, `verify`, and `sample`: a small set made the
  same way for the browser checks, 300 files a kind, in `catalogue-work/full-sample/`); outputs stay outside the repo
  (`catalogue-work/full/`). Facts are scan.py's reading of the notes, the same as the app's `facts.ts` (5,990 random
  files read by both: every field agreed). From PDMX.csv only what the catalogue takes (the upload's title when the file
  has none, the uploader's composer if it matches the table, views, licence); never its genre, difficulty, tags,
  ratings or validity columns (those were used only to cross-check). 253,391 readable files (644 that can't be read
  are left out): piano 23,150, lead sheets 23,273, melodies 141,000, several parts 65,968.
  - **Flags** (what was found, in words a learner reads; never a judgment of the music or its difficulty). Each was
    tested on made-up cases (fires, doesn't, near miss), then 12 random flagged files per flag were drawn with OSMD
    and looked at:
    - *most bars empty*: more than half the bars hold no note in any part ("most", by the flag's words). 1,322
      files. Looked: 12/12 right; 9 unfinished uploads, 3 one instrument's part with long rests.
    - *under 4 bars of music*: fewer than 4 bars with notes (a phrase, the smallest whole unit of a tune, is 4 bars),
      unless the bars are over-long (then it is the next flag). 858. Looked: 7 of 8 fragments or tests, 1 a real
      two-bar recitative; 4-5 bar files are mostly fragments too (5/6), not caught.
    - *most bars longer than the time signature*: more than half the bars (of every part) run past the time
      signature in force. Among files with any such bar the share is bimodal (one odd bar, or nearly all); the
      valley is at 0.45-0.5, where "most" falls. 2,930. Looked: 12/12 right: the whole piece in one bar, music under
      the wrong time signature, junk. Files at 0.3-0.5 were mostly broken too (5/6, not caught); at 0.05-0.3 real
      tunes with an odd long bar (a pickup).
    - *notes outside the piano*: a note below A0 or above C8 (not for several parts, whose written pitches may be a
      transposing instrument's). 85. Looked: 12/12 right; 7 junk, 4 real pieces with one stray wrong note, 1 a tuba
      exercise.
    - *one staff has no notes* (piano): 161. Looked: 12/12 right, mostly a melody written on a piano template; a
      staff with 1-3 notes is not caught (3 of 6 such looked one-handed).
    - *no title*: neither the file nor the upload has a title other than a placeholder ("Untitled score", "Title",
      "#"), or the title has no letter or digit in any script ("-", "------------": re-check 2026-10-15, P15; `retitle`
      worked the flags out again: 48 more, 156 in all). Was 108. Looked: 11/12 right (one had its title in an untyped text box scan.py doesn't read). "Gan ainm" and
      "No name" are folk tunes' real names, not flagged.
    - *the title says test, draft or unfinished*: 370. Looked: 11/12 test uploads, 1 an unfinished composition.
    - Tried and dropped: *more than 10 notes at once* (half were Debussy, Ravel and other real pieces with spread
      chords); *exact duplicate files* (PDMX has none: no two files share a SHA-256).
    - 36 random unflagged files looked at: 34 real music, 1 erratic junk, 1 glitchy first bar.
    - Cross-check with PDMX's columns (share of files rated on MuseScore; unflagged 0.056): overfull 0.014, short
      0.023, test 0.035, no title 0.037 agree (rated less); empty 0.080, one staff 0.137, outside the piano 0.200 do
      not (real but unusual files are rated as often or more).
    - Any flag: 5,517 files (piano 528, lead 411, melody 3,212, parts 1,366), 2.2%. Hiding them leaves 173,649 of
      177,631 pieces (piano 21,912, lead 12,887, melody 85,251, parts 53,599). Which flags hide is the owner's call.
  - **Versions fold** into one row: within a kind, files with the same notes (start and pitch of every note, any
    title; 88,393 files have such a twin, re-uploads) and files with the same title (folded with every script's
    letters) and checked composer whose openings agree (the first 4 steps of the first part's top line: at 4 steps
    80% of uploads with one title and checked composer share their group's opening, against 18% under generic titles
    like "Hornpipe"; each further step costs real versions more than it separates generic ones; the 20% stay separate
    rows). 177,631 pieces. Looked: the biggest "Hornpipe" row and a random 6-file row were one tune each.
  - **Piece lists**, one a kind (`index-piano.json`, `index-lead.json`, `index-melody.json`, `index-parts.json`):
    the catalogue index's fields, then `flags` (codes separated by spaces; `flags` in the header gives their words),
    `zip` (number into `zips`) and `offset` (the file's first byte in that zip; its length is `bytes`). Sizes raw /
    gzip: 3.6/1.2, 3.4/1.1, 21.3/6.3, 10.1/3.2 MB. JSON.parse in headless Chromium: melodies 50 ms, 206 ms with the
    CPU slowed 4x (DevTools' mid-tier phone); all four 93 / 373 ms, about 71 MB kept in memory. A column-wise
    encoding (one array a field, repeated strings as numbers) would cut melodies to 12.9 MB and 93 ms at 4x.
  - **Zips** (`pdmx-a1..3.zip` piano, lead sheets and melodies, 0.80 GB; `pdmx-b1..2.zip` several parts, 1.21 GB;
    everything = a + b, so adding the rest later copies only b). Stored, not compressed (.mxl is zipped already), so a
    file's bytes sit whole at its offset and the phone reads one with `File.slice(offset, offset + bytes)` on its
    own copy. No Zip64: at most 65,535 files a zip (the zip format's own limit without that extension), files shared
    evenly, so 3 + 2 zips of 265 MB and 600 MB; a copy that fails restarts one zip. Checked: 50 random files read
    back by offset match their SHA-256 (a shifted offset fails), and every entry's CRC is good.
  - **The piece list travels inside the zips** (owner, 2026-10-15: nothing downloaded, nothing big in the repo). After
    its .mxl files each zip holds `pdmx-zip.json` (which zip it is, its set, the build: the start of rows.jsonl's
    SHA-256, every zip of the build, the kinds and counts (files, pieces, and pieces shown: those with a file not
    hidden), the flags' words and `hide`, the flags the app hides: `HIDE` in full_set.py) and `index-<kind>.json` for each kind it
    holds (its own rows, the same fields as the lists beside the zips). Written after the scores, so no offset moves;
    `index` writes them again in place (the old ones cut off). 9.4-9.5 MB of lists in each pdmx-a zip, 5.0-5.1 MB in
    each pdmx-b. `verify` also checks that the lists inside agree row for row with the lists beside them (a changed
    row fails it), each row sits in the zip that holds it and the lists follow every score file: on the full set
    (2026-10-15) 200 of 200 files read back by offset, 253,391 rows agree, build `226325fa84ee`; Python's CRC test
    found no bad entry in pdmx-a1 and pdmx-b2 after the lists were added.
- **Full PDMX set (phone side; owner, 2026-10-15; `library/full.ts`, `screens/full-setup.ts`, the tab in
  `screens/library.ts`).** The third tab, Full PDMX, is always there (the tabs show now even without a catalogue).
  - **Setup**, offered on the tab while the set isn't on this phone: the steps, one a line (Claude makes the zips on
    the PC, copy them to the phone, pick them here once), two choices (piano, lead sheets and melodies: the pdmx-a zips, about
    0.8 GB; everything, with band and ensemble scores: + the pdmx-b zips, about 2.0 GB), why the app keeps its own copy,
    and Pick the zip files…; in a browser tab only, before copying (owner, 2026-10-15): "Your browser may delete this
    copy when the phone runs low on space. Installing the app keeps it." A picked file is known by its own
    `pdmx-zip.json`, not its name; a file that isn't one of
    the set's zips, is from another making of the set than the zips already copied, isn't part of the choice, was
    picked twice or is already copied is said and not copied. Then `navigator.storage.persist()` is asked and
    `estimate()` checked: if the zips need more than the browser lets the app use, it says so with both sizes ("Not
    enough room on this phone: … Nothing was copied.") and copies nothing. Each zip is streamed into the app's storage
    with its own progress bar; one that fails is not kept and the others carry on ("pick it again to copy just that
    one"); picking again copies only what is missing, also after the page was closed mid-copy (the setup says what is
    copied and what is still to copy). The progress comes first, under the title, so it is in view sideways too; sizes
    are said in GB, MB, KB or bytes. The phone stays awake while copying. The several parts can be added later:
    **Add several parts…** in the Kind sheet (and at the end of the list). A set zip picked with Music's own + Add is
    said: "This is a Full PDMX zip: use Full PDMX → Pick the zip files…".
  - **Storage:** the origin private file system (OPFS), folder `pdmx-full`: each zip as it came, and `state.json` (each
    copied zip's manifest and where its lists are). Why: a picked file can't be opened again later on Chrome for
    Android (caniuse: the File System Access API not supported there; MDN's compatibility data lists
    `showOpenFilePicker` from Chrome Android 132: copying works either way); OPFS `createWritable()` exists on Chrome
    for Android since 109 (MDN browser-compat-data), takes the picked File as a stream (constant memory, progress as it
    goes) and keeps nothing until the copy is closed, so a broken copy leaves nothing half-written; a file is read back
    with `getFile().slice(offset, offset + bytes)`. OPFS shares the origin's quota with IndexedDB and goes when the
    site's data is cleared (MDN, Origin private file system); Chrome lets an origin use up to 60% of the disk and grants
    `persist()` silently by engagement, installation or a bookmark (web.dev, Storage for the web; Persistent storage).
    It is the learner's explicit copy, so it works offline in a browser tab and the installed app alike (§7's saving
    for offline is installed-app only); it is not in the backup (copy the zips again), and pieces added from it are.
    Settings' Full PDMX row says its size and what is on the phone, and, while the browser does not keep the app's
    storage safe (`persisted()`), the same line as the setup's. There is no line under the list (the list has the room).
  - **The list:** each copied zip's own lists, one a kind, read when that kind is first shown (one small object a
    file over the list's array; search words made while the page is idle). Same search, chips and sort as the
    catalogue. Opens on **piano, most viewed first**; the Kind chip offers lead sheets, melodies, several parts (only
    with the pdmx-b zips), and none chosen is every kind. Uploads of one piece fold into one row ("n versions", the
    list's `group`). Flags: *most bars empty*, *under 4 bars of music*, *most bars longer than the time signature* and
    *the title says test, draft or unfinished* are **hidden** (the set's `hide`); the count line says "267 pieces · 24
    hidden files ›" (owner, 2026-10-15: a link, not a chip; files counted among what the other filters and the search
    leave), and the link opens a sheet with each flag and its number of files, to show them ("… · 6 flagged files shown,
    18 hidden ›"). *One staff has no notes* and *notes outside the piano* (and any hidden one shown) are **labelled on
    the row** in those words; a file with no title (or one of punctuation only) is listed as "No title" (not labelled
    again), and comes last in Title A–Z, which sorts a title from its first letter or digit (",,EUGENIE''" under E). The tab's number is the pieces the list shows with every kind and nothing filtered (the set's shown
    counts); every number has its thousands separated. The chips stay on one line (at 320 px too), so at least four
    rows of the list show sideways and at 320×568. The tab shown and its search are kept through a reload (this browser
    tab's session), so ← from a piece opened from it comes back to it. While you type, the search runs a few
    milliseconds at a time, giving way to your keys; a newer search stops an older one.
  - **A piece's page** (as the mockup, with **+ Add** and **Open** under the title as on the other pages, P09): title,
    composer, "from the full PDMX set", the buttons, the first bars drawn small (from the copied zip; in the dark theme
    the drawing is inverted, not its box, so it reads, here and on Yours' pages), the facts from the list (kind, key, time, bars, range, MuseScore views, the licence of the
    transcription), what was found in the file (its flags), "Not picked or checked: this is a MuseScore user's
    upload…", the several-parts warning for several parts, and its versions (most viewed first, each with its labels;
    a tap shows that version). Warnings and labels use one amber that reads in both themes.
  - **Open** plays it on the score screen without adding it: it joins the app's pieces for the visit with where its
    file is in the zip (Music's Yours doesn't list it); its choices are kept by its id `u-<id>`, the id it keeps when
    added; a reload, Home's recent list and Carry on find it again in the set. **+ Add** is the catalogue's
    `addFromCatalogue` with the file read from the zip: the same id, record, origin "catalogue", PDMX source and
    licence. A piece in both the catalogue and the full set is one piece (added from either, both show it added).
  - **Remove:** Settings → Your data → Full PDMX set says how big it is and what is on the phone, and Remove (asked
    first) deletes the folder; pieces added from it stay in your library. (Settings' "Saved for offline" puts its long
    value under its name, so it reads at 320 px.)
  - **Measured** (2026-10-15, headless Chromium on the PC with the real pdmx-a zips, a persistent profile; a phone is
    UNKNOWN): the copy of 0.82 GB took 3.1 s (the PC's disk) and the storage used went from 0 to 825 MB (estimate;
    quota 10.7 GB there); the tab opened on piano (23,150 files) in 152-165 ms, 317-508 ms with the CPU slowed 4×;
    every kind read (187,423 files) 281 ms, 1.1 s at 4×; a search over piano 10-14 ms, 105-153 ms at 4×; over every
    kind 42-63 ms, 174-530 ms at 4× (the first search the slowest), with no
    task over 50 ms while typing at 4× (one of 57 ms when the search is cleared); a page's first bars 0.6 s; JS heap
    111-141 MB with every kind read.
- **Storage:** IndexedDB `piano-library` (store `items`: one record per item, yours with everything about it, the
  app's own with only your favourite, tags and last opened; store `files`: what you added). The first add asks the
  browser to keep it safe from clean-up (`navigator.storage.persist()`); the foot line says whether it is. Added
  scores join the app's pieces at start (ids `u-` + the start of the file's SHA-256), so every score screen, Memorise
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
  the tallest unit met so far that fits two to a screen, one under the other; when two don't fit, the unit you're on
  shows whole with as much of the next as fits under it, and a unit taller than the screen (a cover page, a page with
  no lines found) is drawn smaller to fit whole. A−/A+ choose the size (50–100% of the width); each page's margins are trimmed to
  where its staves start and end. Turning the phone keeps your line (and part, where there is one).
- **Turning** (owner: no timed turning): the keyboard's highest key (next) and lowest key (back), as the keyboard
  remote does elsewhere (they need learning once in Keyboard controls), unless the piece's ⚙ says it uses those keys;
  a tap on the music (lower half next, upper half back; owner, 2026-10-14); a page-turner pedal or keys (→ ↓ PageDown Space Enter next; ← ↑ PageUp back); ◀ ▶. Space or
  Enter on a button you moved to with Tab presses that button. **Back** (Android's, or the browser's) closes Adjust
  lines first, then the reader, back to the library.
- **Finding the lines** (`pdf/systems.ts`, reworked from the old app's after it got 0 of 5 real-looking pages right):
  ink against the page's own paper; the page's tilt measured and straightened (on screen too); staff lines as the
  sharpest rows, five evenly spaced a staff (a too-faint fifth filled in); a second look for short systems at the
  page's own staff spacing; staves joined into a system by a brace or barline where they start; bands to halfway
  between systems. 15 of 15 test pages right, including a tilted grey scan and a one-bar ending (one staff missed on
  one page, its band still holding it). **Adjust lines** shows the page with each line's top and bottom handles to
  drag and its split points (green), each also a slider for the keyboard (Tab to it, arrow keys move it, Shift for
  bigger steps); the blue × on a line removes that line (the others keep their splits); add a line
  or remove the last (the other lines keep their splits, a new line gets one found for it; 2026-10-14, before which
  every line went back to one found split and a split you had placed was lost), or find the lines again. A line can't be
  dragged thinner than 0.6% of the page. Lines may overlap (owner, 2026-10-14): drag a line's bottom down past the next
  line's top to take in low notes reaching into its space; lines keep their order (a line's top can't pass the one
  before's top), so their splits stay with them. Where two lines meet, grab just inside the line you mean: each
  handle's grip reaches into its own line. A tap that adds a split, where lines overlap, goes to the line whose middle is nearest. A page where no lines are found shows whole, unsplit, until you mark them. On
  a tilted page the splits and margins are placed on the straightened page as shown. Pages are read as you reach them
  (and the rest in the background); a page read for the first time brings its lines in at once, and your place keeps
  its line when lines are added or found on an earlier page. Scanned pages stored as JPEG 2000 (most library scans)
  are decoded by pdf.js's own decoders (`pdfjs-wasm/`, served from the installed pdfjs-dist by `vite.config.ts` and
  saved for offline).
- **Kept per PDF** (`piano-web.pdf.v1`, in the backup; deleted with the PDF): the line and part you were on, the
  lines and split points found or placed, whole or split per kind of screen, each page's tilt and margins, the size,
  and the edge-keys switch. While a PDF opens, taps and turning keys do nothing, and page work begun for another PDF
  is dropped, so nothing of one PDF is saved as another's (2026-10-15).
- Not built (owner, 2026-10-14): timed turning (tried and measured: fine on lines of equal length, off by seconds on
  unequal ones; counting bars from the page only reached 34 of 71 lines right); following your playing (a PDF has no
  notes; with a MusicXML copy you'd use the score screen). Repeats are yours to turn back for.

---

## 6. Exercise content: item sets (Simon and Drills)

Files in `web/public/content/sets/`, listed in `index.json`; read by `web/src/exercise/items.ts`.

```json
{ "title": "Chords in C", "kind": "chords",           // kind: Exercises lists it by this (§0); one of scales, five-finger,
                                                        //   arpeggios, chords, intervals, cadences, melodies (or none: "Other")
  "order": "pool",                                      // pool: random items (Drills: a shuffled deck); passage: in order
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

**How its music opens** (re-check V32): a set whose items include MusicXML files (Exercises lists each as music) may say
`"play": { "mode": "wait", "hands": "right", "tempo": 90 }`: the score's preset choices, as an activity gives them
(§8b), limited to `mode` (watch / wait / along / rhythm; not Ladder, which needs a loop of bars), `hands` (both / right /
left / off) and `tempo` (20–300); for that visit, never saved over yours. None given: Wait for me.

**Checked:** a set gives either `items` or `from`, a `title`, `kind` one of the seven above (an unknown kind is refused), `play` as above (an unknown mode or field is refused), `order` pool / passage, `tempo` 20–300, `rhythm` "notes" or a
length; an item gives exactly one of `notes`, `chord`, `interval`, `musicxml`, and a field that is no item field at all
is refused with the reason. A lower-case pitch (`c4`) is read as C4. A passage's `bars` must be like "5-8" and hold
notes on its staff. **The reader is laxer than the format** (reader findings of 2026-10-15, `exercise/items.ts`): it
takes an option of another kind (`octave` on a `notes` item, ignored), options of the wrong type (`"together": "false"`
reads as together, `"arpeggio": "yes"` as true), an empty `items`, items not numbered 1, 2, …, and any field in `from`
(`"bar": "5-8"` is ignored and bars 1–4 are read). A chord's `octave` that is not a whole number 0 to 7 (`"five"`, 4.5,
10, -1) is refused by the reader itself with its reason ("item 1: octave "five" should be a whole number 0 to 7"; it used
to hang the app: interfaces review F1, fixed 2026-10-15), and a chord whose notes would go past the keyboard is refused
too. `npm run check:content` refuses all of these in the shipped sets, and reads
every set without MusicXML with the app's own reader (MusicXML items and passages need the browser's DOMParser: they
are read in the browser, and the check only finds their files).

| Set field | Type | Needed | Default, range |
|---|---|---|---|
| `title` | text | yes | the one name it has everywhere ("Test:" marks a placeholder) |
| `kind` | scales, five-finger, arpeggios, chords, intervals, cadences, melodies | no | none: listed under Other |
| `items` | `{ "1": item, "2": item, … }`: numbered from 1, at least one | this or `from` | |
| `from` | `{ "score": <id in scores/index.json>, "bars": "5-8", "staff": 1 }` | this or `items` | `bars` "1-4" (printed bar numbers; one bar "5" too), `staff` 1 (a whole number) |
| `order` | pool / passage | no | pool; `from` is always a passage |
| `tempo` | number | no | 80 (a passage: the score's own where it starts); 20–300 quarter notes a minute |
| `rhythm` | "notes" or a number above 0 | no | "notes"; Drills only: a length in quarter notes (0.5 = steady quavers) for items without written rhythm |
| `play` | `{ mode, hands, tempo }` | no | how its MusicXML-file items open on the score; above |

| Item | Its options (besides `name` and `short`, both text) |
|---|---|
| `notes`: pitches, spaces = together, commas = one after another | none |
| `chord`: a chord symbol Tonal reads | `octave` a whole number 0–7 (default 4; a piano's octaves for the root; the reader refuses anything else), `arpeggio` true / false (default false) |
| `interval`: a Tonal interval name | `root` a pitch (default C4), `together` true / false (default true) |
| `musicxml`: MusicXML written out (a fragment or a whole file), or a `.musicxml` / `.xml` file beside the set | none; any other text is read as MusicXML (an `.mxl` name has no notes) |

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
starts there, whether the wait is written as a rest or as a `<forward>`); a whole MusicXML file also keeps its bars, time signature and key, and a passage takes the tempo in
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
- **A panel pauses what is running** (owner, 2026-10-15): any dialog opened over the score, Memorise, Simon, Drills
  or the lab pauses what judges your keys, keys played while it is open count nothing (letting go still registers), and it carries
  on when the last panel closes (each screen's way: §1–4, §5b). One watch on every dialog (`app.ts` `onPanel`, `main.ts`,
  `Screen.panel`); Free play, the library and the PDF reader judge nothing and are left as they were.
- **The keyboard as a remote** (Settings → Keyboard controls; `web/src/remote.ts`): every key passes through one filter
  first, so a command never reaches a mode. A mash (six or more keys packed close within ¼ s) stops or pauses what
  is playing (the judged score modes pause as before). Your keyboard's lowest and highest key, learned once, are
  buttons when the music on screen doesn't use them: lowest = back / again (score: to the loop's or the bar's
  start; Memorise: Hear; Drills: Again or Hear it; Simon: Hear again; the lab, stopped: back to the steps), held in
  Memorise = Peek (held elsewhere: the same as a tap); highest = start / next / carry on (Drills: Start, Next, Skip,
  New set; the lab: Start or Again). Where any octave counts (the lab while the band plays, Drills by name, Simon in
  any octave) the music uses every key, so the edges are notes there; a mash still stops.
- Free play shows two octaves at a time on a phone, three on a tablet (‹ › an octave; a MIDI key outside them moves them). A diminished 7th is named from its bass (Cdim7).
- The full PDMX set (§5c) is the learner's own copy in the app's storage: offline in a tab too, not in the backup.
- Offline (owner, 2026-10-15: only for the installed app): installed (Chrome ⋮ → Install app / Add to Home screen),
  the app saves everything (app, scores, sets and the files they point to, lessons and their files, the catalogue,
  piano samples and band sounds) the first time it opens; someone visiting the page in a browser tab downloads nothing
  extra (the service worker keeps only what the page itself fetched), and Settings says to install it to use it
  offline. A tab never deletes what the installed app saved (on Android the two share one store). A file that fails to
  save is tried once more after a pause, and the message names what still failed; the rest is tried again next time.
- The screen stays awake while playing or in an exercise.
- Back up / restore (Settings; `web/src/backup.ts`): one zip with every setting, mark and progress record (all
  `piano-web.*` storage) and the library (its records and your files); the size of your files is asked about first.
  A library that cannot be read is not backed up as empty: the backup is refused with the reason; a piece whose file
  is gone from this phone is left out and named (2026-10-14).
  Files are stored uncompressed and written and read a piece at a time (no copy of the whole library in memory; a
  zip over 4 GB is refused). **Restoring merges** (owner, 2026-10-13): what this phone lacks is added, what it has
  stays (object by object; the practice log keeps every run from both, once); library records merge (favourite if
  either, tags joined, the later last-opened) and missing files are put back: a piece this phone lacks, and a file
  (or a MIDI piece's original) lost from a piece it still lists (2026-10-15; the file goes back with this phone's
  record when it is the same file, else with the backup's). An older .json backup restores the same way.
  **The file** (`piano-backup-<yyyy-mm-dd>.zip`; a real one was made and read on 2026-10-15): a zip whose entries are
  stored, not compressed (no Zip64, so under 4 GB), holding
  - `backup.json`: `{ "app": "piano-web", "version": 2, "saved": "<ISO time>", "data": { "<storage key>": "<its value,
    the JSON text as stored>", … }, "library": [ <record>, … ] }`. `data` holds every `piano-web.*` key of this phone
    but `piano-web.offline.v1` (Saved data, below). Each library record is `{ id, fav?, tags?, opened?, own? }`: `opened`
    an ISO time; `own` only for a file you added or took from the catalogue: `{ origin: "yours" | "catalogue", kind
    ("piano", "melody", "lead", "parts", "score" or "pdf"), title, composer, added (ISO), facts (what §5c reads, or
    null), file: { name, size, type }, hash (the file's SHA-256, hex), source?, licence?, converted? (a MIDI import's
    sentence), midi?: { name, size }, scoreParts?, sameAs? }`. The app's own pieces have a record only once you
    favourite, tag or open them.
  - `files/<id>`: the file you added, byte for byte (a PDF; an MXL or MusicXML as added; for a MIDI file, the MusicXML
    the app made from it), and `files/<id>.midi`: a MIDI piece's original file.
  **Restoring** reads a zip with `backup.json` or an older `.json` backup (the manifest alone); anything else is refused
  ("This is not a backup from this app.", "This zip is not a backup from this app.", "This backup is damaged."). A key
  not starting `piano-web.`, and `piano-web.offline.v1`, are skipped. Merging, key by key: a key this phone lacks is
  added as it is; one it has is merged as JSON, object by object, this phone's value winning wherever both have one; a
  list of entries each with an `at` time (the practice log's runs) keeps every entry from both, once, in time order; any
  other list is this phone's whole, except Memorise's learned bars: the bars of one piece and hands learned on either
  phone are joined, every one of them learned (owner, 2026-10-15); a value that is not JSON stays this phone's. The
  `version` is read first: a backup made by a newer app (version above 2) is refused before anything is merged ("This
  backup was made by a newer version of the app (backup version N; this one reads up to 2). Reload the app online to
  update it, then restore again."); 1, 2 or none (the older `.json` backups) restore as above.
- Saved data: `piano-web.settings.v2` (score look, per screen type and song), `piano-web.songs.v1` (playing
  choices per song), `piano-web.app.v1`
  (app-wide: theme, volumes, click, piano output), `piano-web.marks.v1` (fingering), `piano-web.memorise.v1`,
  `piano-web.simon.v1`, `piano-web.drills.v1`, `piano-web.exercise-display.v1`, `piano-web.freeplay.v1`,
  `piano-web.remote.v1`, `piano-web.lab.v1`, `piano-web.log.v1`, `piano-web.library.v1` (the library's sort), `piano-web.pdf.v1` (the PDF reader, per PDF), `piano-web.path.v1` (the path: steps done and how, steps tried, the
  lesson you are on; §8c), `piano-web.metronome.v1` (the metronome's tempo and beats) (all in a backup; not `piano-web.offline.v1`, what this device has saved for offline). The library's own database (§5c) is in the backup too.
  **The stores as a contract** (for a new screen or mode; 2026-10-15): each key belongs to one module, which reads it
  forgivingly (a missing or broken value is that module's defaults, never an error) and writes the whole value back.
  The `.vN` is the shape's version: a change that an older reader would misread takes a new key, and the module reads
  the old key once and moves it over (as `settings.v1` → `settings.v2`, and the per-song choices out of it into
  `songs.v1`, `settings.ts`); adding an optional field needs no new key. A new store is named `piano-web.<name>.v1`,
  is backed up and merged by restore with no more work (§7 Back up: so a list in it is merged only if its entries
  carry an `at` time), and is removed for a deleted piece in `library/forget.ts` if it is kept per piece.

  | Key | Module | Shape |
  |---|---|---|
  | `piano-web.settings.v2` | `settings.ts` | `{ "phone-upright" \| "phone-sideways" \| "tablet": { defaults: {look…}, pieces: { <piece id>: {look…} } } }` |
  | `piano-web.songs.v1` | `settings.ts` | `{ "*" (every song's default) \| <piece id>: { speed, mode, hands, metronome, band, clickOn, onTime, ladderStep } }` |
  | `piano-web.app.v1` | `settings.ts` | `{ pianoOut, pianoVolume, clickVolume, bandVolume, click, theme }` |
  | `piano-web.marks.v1` | `marks.ts` | `{ <piece id>: { fingerings: [{ m, rel, midi, staff, finger }] } }` (§1) |
  | `piano-web.memorise.v1` | `memorise.ts` | `{ options, progress: { "<piece>\|<hands>\|<chunk>": {…} }, learned: { "<piece>\|<hands>": [bar index…] }, marks, look, pieces }` |
  | `piano-web.simon.v1`, `piano-web.drills.v1` | `exercise/simon.ts`, `drill.ts` | Simon `{ level, best: { "<set>\|<level>": longest }, set }`; Drills `{ level, tempo: { <set>: bpm }, best: { "<set>\|<level>\|<cards>": { clean, of } }, set }` |
  | `piano-web.exercise-display.v1`, `freeplay.v1`, `remote.v1`, `library.v1`, `metronome.v1` | their screens | that screen's choices |
  | `piano-web.lab.v1` | `screens/lab.ts` | `{ chart, role, step, clean, speed, help, parts, dropouts }` |
  | `piano-web.log.v1` | `log.ts` | `{ autoDelete, entries: [entry…] }` (§7b) |
  | `piano-web.pdf.v1` | `screens/pdf.ts` | `{ <piece id>: { line, part, cuts (the lines per page), angles, margins, splits, view (whole/split per screen), spacing, size, edgeMusic } }` |
  | `piano-web.path.v1` | `lesson/progress.ts` | `{ version: 1, current?: <lesson id>, done: { <lesson>: { <step>: { at, how: target \| played \| opened } } }, tried: { <lesson>: { <step>: <ISO time> } } }` |
  | `piano-web.offline.v1` | `offline.ts` | `"<files saved>:<fingerprint>"`; this device only, not backed up |
  | IndexedDB `piano-library` (version 1) | `library/store.ts` | store `items` (records, keyed by `id`, as in a backup) and store `files` (the file under `<id>`, a MIDI original under `<id>:midi`) |
  | Cache `piano-shared` | `sw.js`, `screens/library.ts` | files shared to the app, taken out (and deleted) when the library adds them |

## 7b. The practice log (owner, 2026-10-13; `web/src/log.ts`)

How practice went, for Claude to plan the next lesson from. **One entry per run**: a start to its stop (the score's Play
along, Ladder, Rhythm, Wait for me; a Memorise session from ▶ or a test to ■ or ←; a Simon game; a Drills set,
finished or left part way; a lab run from Start to ■). Watch and Free play are not logged. Kept on the phone (in the
backup too); **Settings → Export practice log** downloads it as a file; **Delete practice log entries older than a month** (in
Settings, on by default) prunes old ones; never more than 3,000 entries (the oldest go first).

**The file** (`practice-log-<yyyy-mm-dd>.json`). The entries below are from a real export (2026-10-15: the built app
driven with a stand-in MIDI keyboard; the runs played by a script, so the timings are a script's, not a person's), one
of each kind, in the order they were played:

```json
{ "app": "piano-web", "kind": "practice-log", "version": 1, "exported": "2026-10-15T23:12:18.814Z", "entries": [
 {"at":"2026-10-15T23:08:50.927Z","seconds":9,"screen":"score","mode":"wait","piece":"mozart-k2","title":"Minuet in F K. 2",
  "settings":{"mode":"wait","hands":"right","bpm":100,"onTime":"normal","metronome":false,"loop":"1-4"},
  "result":{"fromBar":1,"toBar":4,"steps":17,"rounds":1},
  "activity":"k2-wait-right","lesson":{"rung":"test-app","lesson":"test-minuet-opening","step":"wait-rh"}},
 {"at":"2026-10-15T23:08:59.630Z","seconds":0,"screen":"lesson","title":"Right hand, bars 1–4","activity":"k2-wait-right",
  "lesson":{"rung":"test-app","lesson":"test-minuet-opening","step":"wait-rh"},"settings":{},
  "result":{"feedback":{"effort":"hard","note":"bar 3 jump was hard"},"done":true,"runs":1,"line":"Played through bars 1–⁠4"}},
 {"at":"2026-10-15T23:09:04.003Z","seconds":5,"screen":"score","mode":"along","piece":"mozart-k2","title":"Minuet in F K. 2",
  "settings":{"mode":"along","hands":"right","bpm":100,"onTime":"normal","metronome":false},
  "result":{"notes":11,"onTime":8,"early":0,"late":0,"missed":2,"letGoEarly":1,"wrongKeys":1,"toleranceMs":100,"weakBars":["1-2"],
   "slips":[{"bar":1,"note":"C5","what":"let go early"},{"bar":1,"note":"F5","what":"missed"},{"bar":2,"note":"F5","what":"missed"},
            {"bar":2,"note":"F♯1","what":"wrong key"}],"slipCount":4}},
 {"at":"2026-10-15T23:09:12.649Z","seconds":11,"screen":"score","mode":"ladder","piece":"mozart-k2","title":"Minuet in F K. 2",
  "settings":{"mode":"ladder","hands":"right","bpm":83,"onTime":"normal","metronome":false,"loop":"1-2"},
  "result":{"passes":[{"pass":1,"notes":8,"onTime":6,"early":1,"late":0,"missed":0,"letGoEarly":1,"wrongKeys":0,"clean":false,"bpm":90}],
   "slips":[{"bar":1,"note":"C5","what":"let go early"},{"bar":1,"note":"F5","what":"early"}],"slipCount":2}},
 {"at":"2026-10-15T23:09:29.387Z","seconds":33,"screen":"memorise","piece":"mozart-k2","title":"Minuet in F K. 2",
  "settings":{"hands":"right","bpm":140,"chunk":2,"adds":"bar","learnedAfter":2,"inTime":false},
  "result":{"passes":[{"bars":"1","from":1,"clean":true,"inTime":false,"slips":0,"wrongKeys":0,"peeked":false},
                      {"bars":"1","from":1,"clean":true,"inTime":false,"slips":0,"wrongKeys":0,"peeked":false},
                      {"bars":"1–2","from":1,"clean":true,"inTime":false,"slips":0,"wrongKeys":0,"peeked":false},
                      {"bars":"1–2","from":1,"clean":true,"inTime":false,"slips":0,"wrongKeys":0,"peeked":false},
                      {"bars":"3","from":3,"clean":false,"inTime":false,"slips":0,"wrongKeys":1,"peeked":false}],
   "learned":["bar 1","chunk: bars 1–2"],"tests":[],"slips":[{"bar":3,"note":"F♯1","what":"wrong key"}],"slipCount":1},
  "activity":"k2-memorise-right"},
 {"at":"2026-10-15T23:10:07.592Z","seconds":15,"screen":"simon","set":"chords-c","title":"Test: chords in C",
  "settings":{"rung":2,"match":"octave","miss":"tries","speed":"up"},
  "result":{"longestChain":3,"ended":"stopped","helpedChains":0,"misses":[{"item":"G major","wanted":"G4 B4 D5","played":"C♯4"}]},
  "activity":"chords-simon"},
 {"at":"2026-10-15T23:10:30.406Z","seconds":50,"screen":"drills","set":"melodies-c","title":"Test: two-bar melodies in C",
  "settings":{"rung":3,"onTime":"normal","cards":5,"start":"clicks","bpm":80},
  "result":{"clean":4,"of":5,"ended":"set done","missesAgain":false,
   "cards":[{"item":"Melody 3","clean":true,"right":true,"retried":false,"helped":false,"result":"clean"},
            {"item":"Melody 1","clean":false,"right":false,"retried":false,"helped":false,"result":"6 of 7 on time and held · E missed"}, …]},
  "activity":"melodies-drill","lesson":{"rung":"test-app","lesson":"test-minuet-opening","step":"melody-cards"}},
 {"at":"2026-10-15T23:11:23.056Z","seconds":0,"screen":"lesson","title":"Melody cards, music only","activity":"melodies-drill",
  "lesson":{"rung":"test-app","lesson":"test-minuet-opening","step":"melody-cards"},"settings":{},
  "result":{"feedback":{"effort":"easy"},"done":true,"runs":1,"line":"4 of 5 cards clean"}},
 {"at":"2026-10-15T23:11:29.334Z","seconds":41,"screen":"lab","chart":"blues-c","title":"Test: 12-bar blues in C",
  "settings":{"role":"accomp","step":"roots","style":"shuffle","bpm":84,"help":"lit","dropouts":"off"},
  "result":{"rounds":[{"round":1,"step":"roots","bars":"1:ok 2:ok 3:ok 4:ok 5:miss 6:ok 7:ok 8:ok 9:ok 10:ok 11:ok 12:ok"},
                      {"round":2,"step":"roots","stoppedInBar":2,"bars":"1:ok"}],
   "wholeRounds":1,"slips":[{"bar":5,"note":"F7 F♯2","what":"wrong key"}],"slipCount":1},"activity":"blues-roots"} ] }
```

(Three of the Drills set's five cards are left out above, as `…`; the file has all five.)

**Every entry:**

| Field | Type | When absent | What |
|---|---|---|---|
| `at` | ISO time (UTC) | never | when the run started (a lesson entry: when the step's result was shown) |
| `seconds` | whole number | never | from the start to the end of the run, pauses included; 0 for a lesson entry |
| `screen` | score, memorise, simon, drills, lab, lesson | never | the screen it was played on; `lesson` is not a run but the learner's feedback on a step |
| `mode` | wait, along, ladder, rhythm | not the score | the score's mode (Watch is never logged) |
| `piece` | a piece id (§1; `u-…` a library piece; `ex-<set>-<item>` a set's music) | not score or memorise | what was played |
| `set` | a set id (§6) | not simon or drills | |
| `chart` | a chart id (§5b) | not the lab | |
| `title` | text | never | the piece's, set's or chart's title as shown ("Test:" kept); a lesson entry: the step's title |
| `bars` | text "a-b" | not a lab run with bars looped | the lab's looped bars (the score's loop is `settings.loop`) |
| `activity` | an activity id; `<lesson>.<step>` for one written out in a lesson | not opened from an activity | |
| `lesson` | `{ rung, lesson, step }`, ids from `content/path` | not played for a lesson's step | the step it was played for |
| `settings` | object | never (`{}` for a lesson entry) | the choices in force **when the run ended**, by screen (below) |
| `result` | object | never | what happened, by screen (below) |

**`settings` by screen:**
- score: `mode`; `hands` both / right / left / off (the hands *you* played; off = you played both, the piano silent);
  `bpm` the tempo in beats a minute (the piece's opening tempo, else 80, times the speed played; in Ladder the speed it
  ended at, while each pass has its own); `onTime` relaxed / normal / strict; `metronome` true / false; `loop` "a-b" printed bars (absent: no
  loop).
- memorise: `hands`, `bpm`, `chunk` (2 / 4 / 8), `adds` (bar / chunk), `learnedAfter` (1–3 clean passes), `inTime`
  (true: timed passes).
- simon: `rung` (help level 1–5, §3), `match` (same / octave / inversion), `miss` (tries / over / endless), `speed`
  (up / steady).
- drills: `rung`, `onTime` (relaxed / normal / strict / notes), `cards` (the set's size; 0 = until you stop), `start`
  (clicks / first), `bpm` (the set's tempo, quarter notes a minute).
- lab: `role` (accomp / lead), `step` (its kind, §5b), `style` (id), `bpm` (the chart's tempo at the speed played,
  in the chart's units, §5b), `help` (lit / names / symbol), `dropouts` (off / drums / band).

**`result` by screen** (counts are whole numbers; bars are the printed bar numbers; a note is spelled as written,
`F♯5`, or a key by its sharp name, `C♯4`; middle C = C4):
- score, Play along and Rhythm (no loop): `notes` (the notes, or in Rhythm the taps, due in the part played), `onTime`
  (on time and held), `early`, `late`, `missed`, `letGoEarly`, `wrongKeys` (keys the score did not have), `toleranceMs`
  (the on-time window, ± ms of real time: 200 / 100 / 50), `weakBars` (the weakest bars, "a-b", offered as a loop),
  `fromBar`, `toBar` (the bars the run went through: where it started to the furthest the marker reached; interfaces
  review F9, 2026-10-15), `reachedEnd` (true: the marker reached the piece's last note; what a lesson step with no
  target counts, §8c). Entries from before 2026-10-15 have none of the last three.
- score, Ladder and any loop: `passes` [{ `pass` (1, 2, …), `notes`, `onTime`, `early`, `late`, `missed`,
  `letGoEarly`, `wrongKeys`, `clean` (every note on time and held, no wrong key), `bpm` (that pass's tempo) }].
- score, Wait for me: `fromBar`, `toBar` (the bars played through: the loop's when it went round), `steps` (the notes
  the marker moved on from, the piano's lead-ins too), `rounds` (times it went round its loop, or reached the end: 1 or
  more = played through; review 2026-10-15, V10). No slips: nothing is judged.
- memorise: `passes` (at most 300) [{ `bars` ("1", "1–2": the bars being learned), `from` (the bar it started at),
  `clean`, `inTime`, `slips` (how many notes were missed, early, late or let go early, or helped), `wrongKeys`, `peeked`,
  and one of `test` (notes / rhythm), `practising` (true: the test's bars to practise) or `joining` (previous / all) }];
  `learned` (text, in the order learned: "bar 1", "chunk: bars 1–2"); `tests` [{ `kind` (notes / rhythm), `clean`,
  `toPractise` (bars), `stuck` (bars) }]; `mark` (text, when the piece is memorized: "Memorized: notes + rhythm at ♩ 96 ·
  13 Oct 2026").
- simon: `longestChain` (the longest chain played whole without help), `ended` (over / all played / stopped),
  `helpedChains`, `misses` (at most 40) [{ `item` (its name), `n` (its number in the set: items sharing a name told
  apart; from 2026-10-15), `wanted` (its notes), `played` (the key) }]. A game is logged as it was played: its set,
  level and activity are the ones it started with, even when another set or level was chosen to end it.
- drills: `clean`, `of` (cards played), `ended` (set done / stopped early / left), `missesAgain` (true: this set was
  "the misses again"), `cards` [{ `item` (its name), `n` (its number in the set, from 2026-10-15), `clean`, `right`
  (right in the end, a retry too), `retried`, `helped`, `result` (the card's line as shown) }]. A set is logged as it
  was played: its set, level, tempo and activity (a lesson step's tag) are the ones it started with, even when another
  set, level or tempo was chosen part way (final review F06, 2026-10-15).
- lab: `rounds` (at most 200) [{ `round` (1, 2, …), `step`, `stoppedInBar` (when ■ came in it; the round does not
  count), and for accompaniment `bars` ("1:ok 2:late 3:miss …", each bar's mark: ok / late / miss), or for lead `notes`,
  `fromGuide` (of them, from the lit keys), `barsPlayedIn`, `changes` (chord changes), `playedAtChanges`, `landedOnChord`
  }]; `wholeRounds` (accompaniment rounds finished); `roundsPlayed` (lead).
- `slips` and `slipCount` (score Play along, Rhythm, Ladder; memorise; lab): each slip `{ bar, note, what }`, `what`
  one of missed, early, late, let go early, wrong key, and in Memorise helped (a hint or Peek, when timing doesn't
  count) and stuck (the test's Stuck; `note` is ""); in the lab `note` is the chord and what was wrong ("C7 needs C",
  "F7 F♯2" for a key not in it, "(notes apart)"). At most 40 kept; `slipCount` is all of them.
- Text carries the app's own characters: ♯ ♭ ♩, en dashes in bar ranges ("1–2"), and in a lesson entry's `line` a
  word joiner (U+2060) after the dash. Read them as text, not ASCII.

**Lessons** (owner, 2026-10-15): a run played for a lesson's step carries `"lesson": { "rung", "lesson", "step" }` (the
ids in `content/path`) beside its `activity` (an activity written out in the lesson has the id `<lesson>.<step>`). After
the step, the learner's feedback is an entry of its own (`screen` "lesson", above; only when they tap or write
something; it is replaced as they change it, keyed by its `at` and step). `result.feedback.effort` is hard / ok / easy;
both it and `feedback.note` (free text) are optional (owner, 2026-10-15: Hard / OK / Easy and a note, both skippable).
`done` says whether the step counted as done (§8c), `runs` how many runs it had this time, `line` what the learner was
shown as "This time".

**What the next lesson can read from it** (checked on the sample above, 2026-10-15): the piece, set or chart; the bars
(a loop's, Wait for me's, Memorise's, the lab's, and each slip's); the mode and hands; the tempo; the result and each
slip; the lesson step and the learner's feedback; the bars a Play along or Rhythm run without a loop went through, and
whether it reached the end; an item's number in a set (Simon's misses, Drills' cards). All three from 2026-10-15
(interfaces review F9, F10); older entries lack them.

## 7c. Addresses: links and reload (2026-10-15)

The app's address is `…/PianoProject/?<parameters>` (`main.ts` `start`, `nav.ts`, `screens/shell.ts`). The app writes it
as you move (so a reload comes back, §0), and a link may use it. Read once, at start; then the address is the app's own.

| Parameter | Values | Opens |
|---|---|---|
| `tab` | home (the default) / music / practice / path | that tab |
| `page` | settings / exercises / lesson (with `lesson`) | that page over the tab |
| `lesson` | a lesson id (§8c) | with `page=lesson`: its page, and it becomes the lesson you are on |
| `step` | a step id of that lesson | with `page=lesson&lesson=…`: the lesson page starts that step, with its activity's choices |
| `piece` | a piece id (§1; `u-…` a library piece) | the score screen; with `tool=memorise`, Memorise; with `tool=pdf`, that PDF in the reader |
| `bars` | "a-b" (both numbers) | with `piece`: those printed bars looped |
| `mode`, `bpm`, `hands` | as an activity's score settings (§8b): watch / wait / along / ladder (needs `bars`) / rhythm; 20–300; both / right / left / off | with `piece`: for this visit, never saved over yours (Carry on's way back into a run) |
| `tool` | memorise / drill / simon / lab / freeplay / metronome / pdf (with `piece`: the PDF reader, F12) | that tool over the tab; Practise as… changes `tool` (and the set menu `set`) as you switch (F11) |
| `set` | a set id (§6) | with `tool=drill` or `simon`: that set |
| `chart` | a chart id (§5b) | with `tool=lab`: that chart |
| `activity` | an activity id (§8b; letters, digits, `-`, `_`) | that activity, over whatever the rest opened; its choices for that visit |
| `shared` | 1 | (the share target's own) Music adds what was shared |

A value the app doesn't know is ignored rather than refused (an unknown `tab` is Home; a `mode` that isn't one, or a
`bpm` out of range, leaves your own), except a `piece` not there ("There is no piece "…" any more.") and an activity that
cannot open (said, Home stays). A link that should open a lesson's step: `?tab=path&page=lesson&lesson=<lesson>&step=<step>`;
a piece in a mode: `?piece=mozart-k2&bars=1-4&mode=wait&hands=right`; an activity: `?activity=k2-wait-right`.

## 8. How the app is put together (for adding a screen or a mode)

- `web/src/nav.ts`: where you are. Home is the root; a tab other than Home, a page (Settings, Exercises, a lesson) and a
  screen each stand on top of where they were opened from, with one history step each, so ← and Android Back go back
  alike. A place's `leave()` closes what it opened; a screen that closes itself (its own ←) calls
  `nav.closedItself(name)`. The library's page (upright) and the PDF reader keep their own history steps.
- `web/src/screens/shell.ts`: the tabs and pages (§0); `web/src/lesson/`: the path, its reader, the lesson page and its
  blocks (§8c).

- `web/src/app.ts`: what every screen shares (the score's drawing `FollowView`, the keyboard strip, the sound, the MIDI
  keyboard, the practice judge `Practice`, the pieces, the message line) and the **`Screen` interface** every
  screen offers: `key(e)` (a key from the MIDI keyboard or the screen's keys), `command(c)` (a keyboard-remote
  command: mash, low, high, peek-on/off), `musicRange()` (the keys the music on screen uses), `resized()`, `busy`
  (the phone stays awake), and, for a screen that judges keys, `panel(open)` (a dialog opened over it, or the last one
  closed: pause what judges and carry on after, §7; a screen with it gets no key-downs while a panel is open; one
  without it, as Free play, the library and the PDF reader, is left as it is). A screen that logs runs writes one entry
  per run with `addEntry` (`log.ts`) in the shape of §7b, and adds its `result` there and in `lesson/result.ts` if a
  lesson step's target should read it.
- `web/src/screens/`: one module per screen. `score.ts` (the score screen and its modes), `memorise-screen.ts`
  (Memorise: it borrows the score's drawing through the `Borrower` interface in `score.ts`: its own settings,
  layout fit, and the drawing's events), `exercise.ts` (Simon and Drills; their logic is in `web/src/exercise/`).
  Free play is `web/src/freeplay.ts`, offered as a screen in `main.ts`.
- `web/src/main.ts`: builds the screens and routes: every key goes first to the keyboard remote (`remote.ts`), then
  to the screen showing; turning the phone goes to every screen; the open helpers put each screen on the stack
  (`enter()`); Settings holds backup, restore and export.
- **Adding a screen** (e.g. the accompaniment lab): a module in `web/src/screens/` that offers `Screen`, its markup in
  `index.html`, a line in `main.ts`'s `showing()` and `app.screens`, a way to reach it (a row in Practice, say) that
  opens it with `enter({ name, leave })`, its ← calling `nav.closedItself(name)`, and its section here.
  A mode that plays a score belongs in `score.ts` (the modes table above); one that only borrows the score's
  drawing, as Memorise does, can be a `Borrower`.

## 8b. Activities: a screen opened with its content and choices (owner, 2026-10-13)

An **activity** is how a lesson (or a link) starts a mode: which screen, its content, and preset choices. A file in
`web/public/content/activities/<id>.json` (listed in its `index.json`), opened with `?activity=<id>`
(`web/src/activity.ts` reads it; `main.ts` opens it; its runs are logged with its id only once its screen has opened,
not when its piece is missing or another screen was opened while it loaded). The **content** decides what is played (the piece and bars, the
set, the chart and its ladder and style); **presets** are learner choices set for the activity: in force while it
lasts (until another song, chart or screen, or ←), changeable there, and never saved over the learner's own. A
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
is refused. **The file** (2026-10-15): its id is its file name without `.json`, letters, digits, `-` and `_` (what
`?activity=` and a step's `activity` name); `index.json` is a list of the file names, used to save them for offline and
by the check (the app opens an activity by its id, so one missing from the index still opens online but is not saved for
offline; check:activity requires every file listed). `title` is text, shown as the activity opens (and in a message that it cannot);
left out (or not text: the reader quietly uses the id, a reader finding, refused by
check:activity) it is the id. `bars` is "5-8" or one bar "5"; bar 0 (a pickup) reads, though the check counts bars from
1. A lab ladder's step written out is `{ "kind", "name", "detail", "doing" }` as a chart's (§5b); a misspelt word there
is ignored by the reader and refused by check:activity. A score or memorise activity's `piece` is one of the app's scores, a piece in the library, or a catalogue
piece by the id it gets when added, `"u-<catalogue id>"` (owner, 2026-10-15; e.g. `"u-de5f6a78874c"`): opening the
activity adds it to your library first if it is not there (§5c), and a `u-` id that is in neither says "there is no
piece". `npm run check:activity` finds each named piece in `scores/index.json` or `catalogue/index.json` and its `bars`
inside its bar count (a catalogue piece's from the index: bars as printed). Every value (`web/src/activity.ts` checks each):
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

## 8c. The path: rungs, lessons and their blocks (owner, 2026-10-15)

**For:** the lessons Claude writes as the owner learns (no fixed course). A **rung** is one skill on the path; a
**lesson** is one sitting's worth on a rung; a lesson's page is a **skeleton of content blocks**, in any order and any
number (owner: "a skeleton … that takes in content of YouTube videos, animations, mini playable score renders, text, etc
… standard format so you can feed it content later"). Mockup D in `web/mockups/path.html` is one arrangement, not the
template. `web/src/lesson/read.ts` (the reader), `blocks.ts` (the drawings), `page.ts` (the page), `progress.ts`,
`path.ts`, `result.ts`; check `npm run check:path` (`web/tests/path.mjs`).

**Reached:** the Path tab (*You are here* with Carry on; this week's practice: minutes and days from the practice log,
and steps done in the rung, all as plain counts: time is time, not mastery; then the rungs as sections, the one you are
on open, the others folded with a ▸; each lesson one tap away, done or not, with "k of m steps done"); Home's Up next;
**Switch…** (from Path, Home and a lesson page): the rung's lessons (*Revisit* a done one, *Open* the one you are on, one
started or one behind you, *Skip ahead* only to one after the one you are on, not started: V30; none on the lesson's own
page for itself) and the other rungs; Back, Esc, ✕ or Close close it (V19); opening a lesson there makes it the one you are on
(owner, 2026-10-15), and earlier progress is kept. When a lesson's last step is done, the one you are on moves to the
next lesson with steps to do.

**Files** (`web/public/content/path/`; a lesson's files are relative to this folder; all saved for offline):

```json
// index.json: the rungs in order, each with its lessons' ids (each id once in the whole path)
{ "rungs": [ { "id": "test-app", "title": "Test: the app's lesson pages", "lessons": ["test-minuet-opening", "test-catalogue-piece", "test-chords-and-band"] } ] }

// lessons/<id>.json: a title and its blocks, in the order the page shows them
{ "title": "Test: the Minuet's opening, right hand",
  "blocks": [
    { "kind": "text", "text": "# A heading\nA paragraph with **bold**, *italics* and [a link](https://…).\n\n- a list\n1. a numbered list" },
    { "kind": "image", "src": "media/test-picture.svg", "alt": "what it shows", "caption": "…" },        // png jpg webp svg gif, or an https:// link
    { "kind": "video", "youtube": "https://www.youtube.com/watch?v=ZD_sAWAlWq0", "title": "…", "start": 0, "end": 120, "caption": "…" },
    { "kind": "score", "piece": "mozart-k2", "bars": "1-4", "keys": true, "tempo": 100, "caption": "…" },  // piece: or a catalogue piece, "u-<catalogue id>"; or "set": "chords-c", "item": 1;
                                                                         // or "musicxml": a whole file written out, "<score-partwise …>…</score-partwise>", or "media/x.musicxml"
    { "kind": "keys", "notes": "C4 E4 G4", "fingers": "1 3 5", "caption": "…" },     // "-" for a key with no finger
    { "kind": "animation", "src": "media/test-c-major.svg", "alt": "…", "caption": "…" },   // gif webp svg png (animated), mp4 webm
    { "kind": "step", "id": "melody-cards", "title": "Melody cards, music only", "activity": "melodies-drill",
      "doneWhen": "4 of the 5 cards clean in one set", "target": { "clean": 4 }, "about": "…" },   // activity: an id, or written out (§8b)
    { "kind": "tip", "label": "Note", "text": "…" }                                   // label: "Tip" when left out
  ] }
```

**The blocks:**
- **text**: short paragraphs; `#` and `##` headings, `- ` and `1. ` lists, `**bold**`, `*italics*` (or `_…_`), links
  `[words](https://…)`. Never HTML: it is read into a small tree and drawn with text only; raw HTML or a link that is not
  https is refused.
- **image**: a file in the folder or an https link, with `alt` (needed) and a caption. A picture that cannot load says so.
- **video**: a YouTube link (watch, youtu.be, embed or shorts link, or the bare id), played in YouTube's privacy-enhanced
  player (youtube-nocookie.com) from `start` to `end` (seconds) when given, with its title and a "Watch on YouTube"
  link under it. **Offline** (or when the phone says so) it is a card with the title and the link instead of a blank
  box, and becomes the player again when back online. **Online but unreachable** (a network that blocks YouTube, a
  failing connection; V11) the video's picture is asked for beside the player; when that fails or takes over 8 s, the
  same card. When YouTube itself refuses to play it, its own message shows in the frame and the link is still under it.
  A lesson must make sense without its videos.
- **score**: a little playable score: bars of a piece (at most 16; cut out with the clefs, key, time and divisions in
  force where they start, repeats and endings taken out so it plays once; the piece may be a catalogue piece named
  `"u-<catalogue id>"`, added to your library when the page draws it if it is not there yet, as a step adds it), a set's item (drawn as Simon and Drills draw
  it), or MusicXML (notes as a set's item takes them, a whole file inline, or a file). Drawn with the app's own renderer
  (OSMD); **▶ Hear it** plays it on the app's piano at `tempo` (quarter notes a minute; else the score's own, else 80)
  while OSMD's cursor moves over the notes playing and, with `"keys": true`, the keys light on a small keyboard under it.
  The keys **follow the notes** (owner, 2026-10-15): only the range in use now and in the next few moments, in whole
  octaves (two at least), moving when the music moves out of them. The music is drawn to its box: a short line larger
  (up to the score's biggest size), and with its play bar and keys it fits the room between the page's header and
  bottom bar, drawn smaller if need be (a phone sideways), so the marker and the lit keys are seen together (V14, V15).
  MusicXML written in the lesson must be a **whole file** (`<score-partwise>`, with its time signature and bars); a
  fragment is refused, and so is a bar whose notes run past its time signature, or music with no time signature (V13;
  checked by the reader for inline music and when drawing a file). This is the **animation of music** built now: the
  marker moving and the keys lighting as it plays.
- **keys**: a keyboard diagram (the app's keys) with the notes marked and their fingers (1–5) on them; up to 12 keys.
- **animation**: an animated picture (GIF, animated WebP or PNG, an SVG with its own animation) or a short video
  (mp4, webm: muted, looping; with controls instead of moving by itself when the phone asks for less motion). No new
  library; anything bigger is for the owner to ask for.
- **step**: a practice step: its title, its activity (an id in `content/activities`, or written out as §8b), what "done"
  means in words (`doneWhen`), a line `about` it, and where its activity's result can tell, a `target`; Start ▶. The page's
  bottom bar starts the first step not done. **Steps never lock** (owner, 2026-10-15): every step has its Start.
  A step's screen carries the step in the address: a reload opens it again from its lesson page, with its activity's
  choices, and ← still goes to the lesson page (V21). A step whose activity names a catalogue piece (`"u-<catalogue id>"`,
  owner 2026-10-15) adds it to your library on Start if it is not there (§5c: offline too, one line says so; a file that
  can't be had is said and the step marks nothing); its card names the piece by its catalogue title meanwhile. Two
  Starts at once: the later one opens the step, and the step still gets its result.
- **tip**: a callout (`label`: "Tip" by default, e.g. "Note").

**A step counts as done** (shown in words, never one green tick for all: *target met*, *played*, *opened*; or *tried,
target not met yet*; *skipped* when a later step was played; review 2026-10-15):
- with a **target**, when one run played for it meets it, as its screen's result can tell: score `onTime` (0.05–1: a Play
  along or Rhythm run, or a pass round a loop, with that share of its notes on time and held; needs Play along, Rhythm
  or Ladder), score `bpm` (a clean pass round the loop at that tempo or faster; needs `bars`), drills `clean` (that many
  clean cards in one **full** set, as Drills' own best: not "the misses again", nor a set stopped early, left part way
  or endless; owner, 2026-10-15), simon `chain` (a chain that long played whole without help: Simon's own best), lab
  `cleanRounds` (accompaniment rounds with every bar right in one run, over the whole chart: a run that looped bars is
  practice and never counts, as the lab says; final review F07). A target its screen cannot judge (Memorise, Free play)
  is refused;
- without a target, when a run of it ended (one log entry: a set, a game, a Memorise session). A **score** step counts
  only a run in the step's own mode (when its activity names one) that reached the end of its bars (owner, 2026-10-15):
  Wait for me round its loop, or to the piece's end (V10); Play along, Rhythm or Ladder a pass round its loop, or the
  piece's last note reached (`reachedEnd`, §7b). A run that stops part way, or one in another mode (a Play along run
  stopped after two notes, in a Wait for me step), is a start: the step is *tried*;
- for what keeps no runs (the score in Watch, Free play), when you come back from it: **visited** (V18: it counts toward
  the lesson's steps, shown without a ✓, since nothing was judged).
After every step the result is a place of its own over the lesson page (V12: ← and Back from it are the lesson page): it
shows **this time**'s result (as its screen words it), whether the target was met, the best so far over every attempt
(kept apart), and the feedback (Hard / OK / Easy and a note, both skippable; both cleared again, the feedback entry
leaves the log: F05). Its fixed bottom bar always holds **Again**,
**Lesson** (back to the lesson page) and the way on, in view at any size (V28): **Next: step n ▶**, or after the
lesson's last step **Next lesson ▶**, with the card saying "Lesson done: all n steps. Next: …" (V17). A step's runs are found by the step's tag in the log (§7b),
from when it was started (kept for the tab, so a reload inside the step still counts the runs before it: F15); a step
whose activity could not open marks nothing. Switch… from the result works as from the lesson page: the chosen lesson
takes the lesson page's place (the result goes with it), and the lesson you are on has no Open (F13).

**Every field, exactly** (`lesson/read.ts` `BLOCKS`; 2026-10-15). Ids (a rung's, a lesson's, a step's) are lower-case
letters, digits and `-`, starting with a letter or digit; a rung's id once in the index, a lesson's once in the whole
path, a step's once in its lesson. Text fields are non-empty text.

| File / block | Needed | May have | Values |
|---|---|---|---|
| `index.json` | `rungs`: [{ `id`, `title`, `lessons`: [lesson ids] }] | — | a rung may list no lessons yet; a lesson file listed nowhere is never shown (check:path requires every file listed) |
| `lessons/<id>.json` | `title`, `blocks` (at least one) | — | |
| `text` | `text` | — | the small text format above; `\n` between lines, a blank line between paragraphs; only `#` and `##` |
| `image` | `src`, `alt` | `caption` | a `.png .jpg .jpeg .webp .svg .gif` file in the folder (no `..`, no leading `/`), or any `https://` link |
| `video` | `youtube`, `title` | `start`, `end`, `caption` | a watch / youtu.be / embed / shorts / live link or the bare 11-character id; `start`, `end` whole seconds from 0, `end` after `start` |
| `score` | one of `piece` (with `bars`), `set` (with `item`), `musicxml` | `tempo`, `keys`, `caption` | `bars` "a-b" or "a", at most 16 bars (needed with a piece); `item` a whole number from 1 (one the set has: check:path); `musicxml` a whole file written out (`<score-partwise>`, a time signature, no bar over-full) or a `.musicxml` / `.xml` file in the folder; `tempo` 20–300 quarter notes a minute; `keys` true / false (default false) |
| `keys` | `notes` | `fingers`, `caption` | 1–12 pitches like `C4 F#3 Bb4` (capital letter, one-digit octave); `fingers` one per note, 1–5 or `-` |
| `animation` | `src`, `alt` | `caption` | as `image`, also `.mp4 .webm` |
| `step` | `id`, `title`, `activity` | `doneWhen`, `target`, `about` | `activity` an activity's id (letters, digits, `-`, `_`) or one written out (§8b, its id `<lesson>.<step>`); `target` below |
| `tip` | `text` | `label` | `label` default "Tip" |

`target` by its activity's screen, one or both fields: score `onTime` (0.05–1) and `bpm` (a whole number, 20–300);
drills `clean` (whole, 1–100); simon `chain` (whole, 1–100); lab `cleanRounds` (whole, 1–40; not a lead activity).

**Checked** (strictly, as activities are): an unknown kind or field, a missing field, raw HTML, a link that is not https,
a file outside the folder or of the wrong type, a video link that is not YouTube or ends before it starts, a score with
two sources or more than 16 bars, keys that are not pitches or fingers that are not one a note, a step id used twice in
a lesson, a written-out activity with a mistake, a target its screen cannot judge (or of another screen, or out of range);
a lesson id in two rungs, unknown index fields. A lesson that cannot be read is left out and its reason shown on Path.
`npm run check:path` also finds every piece a score block or a step names (the app's scores, or a catalogue piece by
its `u-` id in `catalogue/index.json`) with its bars inside it (`tests/named-pieces.mjs`), and (2026-10-15) every set and
chart a step names, and a score block's set item in its set: the reader itself takes any item number (one the set lacks
is said only when the page draws the block: "the set … has no item n") and any set or chart name (said only when the
step is started).
Lessons and rungs titled "Test:" are placeholders for checking the app, not teaching. **Promoting** a catalogue piece a
lesson leans on into the app's own scores, with its notes checked, is Claude's procedure in §5c.
The test rung's "Test: a piece from the catalogue" (`test-catalogue-piece`) has one step naming the catalogue's
"Mary Had A Little Lamb" (`u-de5f6a78874c`: CC0, piano on two staves, 8 bars, chosen as a short piano piece): a
placeholder for the checks, saying nothing about the music.

**Adding a block kind:** its fields in `read.ts` (`BLOCKS` and `readBlock`), its drawing in `blocks.ts` (`DRAW`: the one
place that maps a kind to its drawing), a case in `tests/path.mjs`, and a line here.

## 9. Not built yet

The library's next parts (§5c): difficulty (on hold: the estimator's check failed, the owner decides), later the phone folder (a few big zip files) and the Shelf; history /
projects (the owner will explain);
the accompaniment lab's lead sheets and several-part files (§5b); sight-reading tools; generated
drill cards; a setup tour and guide (last).
