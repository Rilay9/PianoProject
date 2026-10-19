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
  starts both and the words go. No tap is faked; back on the tabs the words go too. A tap on it over a key or the rhythm pad is passed on to  that key or pad (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): the first tap on a key or the pad is played as well as starting the sound (it had only started
  the sound), and its words sit high, off the screen's own Ready.

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
| The path: rungs, lessons, blocks, media | in (Claude) | `web/public/content/path/` | §8c | `lesson/read.ts`, `text.ts` | check:path; check:browser (how blocks draw: the video offline and unreachable, video rows) |
| The catalogue index | in (built by `web/tools/catalogue/`) | `web/public/catalogue/index.json`, `catalogue/*.mxl` | §5c (Catalogue) | `library/catalogue.ts` | check:content |
| How the app works (the help text) | in (Claude) | `web/src/help/help.md` | §7d | `help/read.ts` | check:content |
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
  (it opens the lesson page at that step's part, as the result's Next does: the text leading to the step at the top, its
  Start below; the page's Start opens the step (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/); it had opened the step's screen at once, past the lesson's teaching). Under it the
  lesson's steps, each in words: *target met*, *played through* (done ✓), *visited* (a step with nothing to judge, once a
  key was played or the music heard to its end: it counts, without a ✓; V18), *tried, target not met yet* / *tried, not
  through yet*, *skipped* (a later step was played), *up next*, *to come*; a tap
  opens the lesson page at that step's part, as Start does (steps never lock). "Switch…" and "All lessons ›". **Up next
  is never a lesson already done** while another has steps to do (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): the lesson you last opened, or, if it is done,
  the next lesson after it with steps to do (from the path's start if none is after it); *Again* and a done lesson's
  first step only when every lesson is done, with "The next lesson is not written yet." Then *Recently practised*: one
  row per set and help level ("Drills · by ear · 3 of 5 cards clean"), so two steps sharing a set are two rows. The order is always Today → the lesson's steps →
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
- **Sizes** (review 2026-10-15): text 13 px and up on these screens; ⚙, ← and the segment buttons 44 px (2026-10-16, after the walk-through: every control on the practice screens and in their panels too, radios and tick boxes 22 px, a panel never taller than the screen); a message (the
  first visit's "Saving for offline…") has its own room above the tabs instead of covering the last rows (V04).
- **Exercises:** every exercise by its `kind` (chips to filter: All, Scales, Five-finger patterns, Arpeggios, Chords,
  Intervals, Cadences, Melodies, Rhythm, Other for a set with none; they wrap), under the one name it has everywhere (the set's
  title, "Test:" kept; V06). **Exercises that are MusicXML are music and open straight on the score** (owner,
  2026-10-15): each item of a set given as a MusicXML file (the melodies set's three) is listed as its own exercise and
  opens on the score screen in a way where you play: **Wait for me**, unless its set's `play` names another (§6; re-check
  V32), the row saying which ("opens on the score in Wait for me (also Play along, Ladder, Rhythm)"); it joins the app's pieces as
  `ex-<set>-<item>` (its choices kept like any piece's) and is not listed in Music; a set whose every item is such a file
  is listed only as these. So is a short score whose `scores/index.json` entry has a `kind` (none yet; an unknown kind is
  listed as a problem). **A set of cards opens with one tap in its kind's default way** (owner, 2026-10-15): Drills for
  scales, five-finger patterns, arpeggios, chords and intervals (flashcards to play on sight, by name or by ear); Simon
  for cadences (a progression built up in order from memory). A **rhythm** set (2026-10-16, §4) opens in Drills only, its
  row saying "rhythm patterns made from its note values · tap them in Drills" (Simon has no rhythm: it is not offered
  there, nor in Practise as…). Inside, **Practise as…** (the "Drills▾" / "Simon▾" button
  on the exercise screen) switches the same set to the other way. ← comes back to Exercises. On a tablet the kinds are
  two columns (V02).
- **Settings** (⚙ on Home; app-wide only): piano plays through (phone / MIDI keyboard; said when there is none to play
  through), piano and click volume, **tap timing** (owner, 2026-10-16: what the timing check kept for screen taps and
  for a MIDI keyboard, *Check* to run it, *Reset* to forget both; §1 "Timing as heard"), click sound, Keyboard controls (§7), theme, export practice log (with its count)
  and "delete entries older than a month", back up, restore, what is saved for offline, and Help (How the app works, Show
  tips again: §7d). The same stores as before
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

**Hands:** L / R / Both / Off, labelled on screen *Piano:* in Watch and *You:* in the other modes (§7d). In Watch these are the hands the piano plays (a change while it plays is heard at
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
| **Play along** | playing at tempo | the piece runs at its tempo with the piano playing the other hand; at the end the run strip (below) and the slips marked on the music | each note on time and held / let go early / early / late / missed, keys not in the score; *On time*: relaxed ±200, normal ±100, strict ±50 ms; the weakest bars offered as a one-tap loop |
| **Ladder** | building speed on a passage | Play along round a loop; a clean pass (every note on time and held, nothing wrong) raises the speed a step (2 / 5 / 10 %), a messy one lowers it; never above the written tempo | as Play along, per pass |
| **Rhythm** | the rhythm alone | Play along where any key counts: one tap per note or chord (keys within 30 ms are one tap) | timing of each tap, held as long as the moment's longest note; extra taps |

**Held notes** (owner, 2026-10-13; `web/src/holds.ts`): wherever rhythm is judged (Play along, Ladder, Rhythm,
timed Drills, Memorise "in time", the lab's chords) a note must sound at least ¾ of its written length at the speed
played, or it is *let go early* (orange, named). The sustain pedal counts as holding (a key let go under the pedal
sounds until it lifts, or until struck again; owner, 2026-10-13: what you hear is judged; pedalling itself is not).
Notes marked staccato, staccatissimo or spiccato are meant short and never asked to be held. A note at a phrase end
(a written rest follows it in its voice, or it ends a slur) needs only half its length. In Rhythm a tap is never asked
to be held past the next tap. Holding longer is not marked (legato overlaps are normal). A note already early or late
is marked for that alone. **Timing as heard** (2026-10-16; `sound.ts` `heardDelayMs`, `calibration.ts`): the app's sound
reaches your ear a little after its clock (the phone's audio output latency, `baseLatency + outputLatency` as the browser
reports it: Chrome on Android gives it from version 102; far more with Bluetooth), and you play with what you hear, so
every timed judge takes that delay off your played times: Play along, Ladder and Rhythm (when the phone's piano or clicks
are playing; nothing when the piano plays on the MIDI keyboard or nothing sounds), Memorise's timed passes (the same
judge), Drills' timed cards (the clicks you play with, count-in or metronome; none when nothing sounds after your first
note) and the lab's chords (its band is always on the phone). A **timing check** kept for the way you play (screen taps
or a MIDI keyboard; §4) is used instead of the browser's figure, which it already holds. What is lit while Drills plays a
card follows the sound as heard too; the score's marker and Simon's lit keys follow the clock (the marker is a reading
aid that moves on its own; Simon's lights say which key, not when). **Grace notes** are played by the piano just before their note, and never judged: playing
one is welcome and never a wrong key (owner, 2026-10-13).

Starting: ▶, or just play your first note (any key on a rest; any key in Rhythm and Wait for me). In Wait for me
(and Memorise) the keys under the music can be played by touch, and count; on a phone upright they then show two
octaves that follow the music (keys wide enough to tap; owner, 2026-10-13); in the timed modes they only show.
Following, every key wanted now is always on the keys (starting on a C when the notes allow, otherwise at the lowest
note wanted, so F3 and F5 together show F3 to F5), the coming notes too where they fit; only notes wanted now further
apart than two octaves widen it (owner, 2026-10-15: F5 was off the keys). A score activity's `keys` (§8b; 2026-10-16)
replace this in Wait for me, on the kinds of screen it names: those keys with every key your hands play in the run's
bars, fixed for the run. Wait for me with the keys showing starts
without a MIDI keyboard (no MIDI in the browser, not allowed, or still being asked) and says to play on the keys below;
the timed modes still need one: with none connected, or MIDI not allowed, ▶ in Play along, Rhythm or Ladder starts
nothing and says "No MIDI keyboard found: this mode listens to one. Plug it in, or choose Wait for me to play on the
keys below." (final review F17; the browser's own permission sentence is never shown; one phrase family with every
screen's: §7e). On a phone held sideways the keys are off, so Wait for me with no keyboard says "No MIDI keyboard found:
turn the phone upright to play on the keys below, or plug one in." and starts nothing (owner, 2026-10-15); with the keys
showing it says "No MIDI keyboard found: play on the keys below." and plays; a run started upright on the screen's keys says the sideways line
when the phone is turned sideways (it waits; upright again, the line goes and the keys are back; §7d). Choosing another mode ends a bar pick under way (Loop's
or Ladder's), as Cancel does. Leaving the piece (← or Back) during a Play along, Rhythm or Ladder run ends it quietly:
it is logged, and no summary shows over where you land (owner, 2026-10-15, F04); Loop tapped during a run stops it with
its summary and log first (F02). **After a run** (owner, 2026-10-16, the consistency pass; §7e): the summary is **a strip**
at the bottom over the music, not a dialog: how it went (the same words as before), the one-line key, the weak bars to
loop, ▶ Again, ✕, and in a lesson step **Back to the lesson ▶** as its main button; the slips are **marked on the music**
(grey and ringed missed, orange early, late or let go early); the marker goes back to where the run started, and **a key
starts the next run** (your note at the marker counts as its first; not in the first 0.8 s; the strip says so with a
keyboard connected). A loop's run (Ladder, a loop in Play along or Rhythm) shows its last whole pass the same way when
it stops; Wait for me played to the piece's end, or stopped after going round its loop at least once ("Played through
bars 1–4, 2 times."), shows a strip too (no marks: nothing is judged), and so does Watch to the end in a lesson step
(visited: §8c; with the step's bars looped, Watch stops after one round there instead of going round). The marks and the strip go when the next run starts, another piece opens, or ✕.
**A key while nothing runs starts** (2026-10-16): your note at the marker (any key in Rhythm) as the first note, played
on time; another key as ▶ does (it used to do nothing, said nowhere); Watch too; Ladder with no loop still asks for its bars.
The warning that a file has more parts or staves than two hands is said only for the
piece opened, and the first message after a piece opens (that warning) stays when the music is laid
out again (a phone's own resize just after opening cleared it before: a relayout now keeps the message line; review
2026-10-15). The rest of a chord pressed while a run starts counts for the first notes, as the key
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
change (F21). **Opened by a lesson step** (owner, 2026-10-16): the step's task on the task line under the header (§7e);
the step's end is **a chunk learned**: Memorise then waits ("✓ Chunk learned: step done") with **Back to the lesson ▶**
as the main button (a key, or the highest key, does it) and *Next chunk* beside it; after that one, later chunks go on
as set. Its *Hear* button is **Hear it** (one name for "play it to me" across the app).

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
   in the app's one set of marks (§7e: missed notes grey and ringed, early, late or let go early orange, wrong keys red on
   the keys), with the one-line key in the message's second line, and stay until you play
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
outlined in blue (the "play this" colour; §7e), names what was due, and replays (the whole chain or from the missed item) after a try is used (3 tries /
game over / keep going). **By ear (help 5) a miss plays the whole pattern again** (owner, 2026-10-17: "it plays back
the whole sequence not just the miss"; it had replayed only the missed note, 2026-10-16): the key you pressed sounds,
nothing is shown (no red, no outline, no name, no staff: "Not that one: listen again"), the whole pattern plays again
after 0.9 s (once the wrong key's note has died away) and you try it again from its start; no try is lost (no hearts at
help 5) and a miss never ends the game (except after a goal, in Keep going, below). With the keys lit (help 0–1) the turn
line says "starting on the lit key (it goes when you start)".
**A goal, and Keep going** (owner, 2026-10-17; `design/2026-10-17-lesson1-owner/spec.md`): an activity's `goal` (5–50,
§8b: at least 5 everywhere). **Before the goal a missed pattern is retried with no limit**: whatever the level's miss
choice (tries, game over) and replay choice (from the miss), a miss costs nothing and the whole pattern plays again
(no hearts are shown in a game with a goal). At the goal, a pattern that long copied whole without help: "You did it: a
pattern of n", the game's entry is logged at once (`ended: "goal"`: the step is done, whatever follows), and two buttons:
**Keep going** and, in a lesson step, **Back to the lesson ▶** (outside a step, Keep going and *Again*). **Any key is Keep
going** (owner, 2026-10-17: "if the user wants more practice it should just let them keep going as long as they like"; a
learner still playing as the goal is reached is never thrown out of the game): a key on the screen's keys, or any MIDI
key but the highest, once the keys are let go; the MIDI keyboard's highest key is Back to the lesson (outside a step,
*Again*), once the edge keys are set up; the lowest is Keep going too. **Keep going** carries on growing; the first miss ends it: "Game over: longest pattern n" (the longest
copied whole in the game), with *Again* and Back to the lesson ▶. The same log entry is then written again: still
`ended: "goal"` (done stays done), with the longest chain, `keptGoing: true` and `afterGoal` (`over`, or `stopped` when
left part way). *Again* starts a new game, the goal before it again. A step's result (and Home's recent list) says what
was reached in the same words: "Longest pattern n" (it said "Longest chain n"; a mash: "Stopped by a mash: longest pattern n").
**No waiting** (owner, 2026-10-17: "if they tap a key to start their try at the sequence it doesn't bother finishing so
they dont have to wait"; every Simon, every level): whenever a pattern is being given (the first time, after a miss
(also in the pause before it plays again), Hear it, and the pause before the next pattern), a key stops it and starts
your try, that key counting as its first note. Only a fresh press: the key that started the game, or the one that just
missed, must be let go first (a chord's other keys, still landing, are not a first note). In a lesson
step, Ready explains the top line: "Chain: how long the pattern is now · Best: your longest copied whole · ♥: tries left". Pools add a random item each round; passages grow in their own order; a completed passage
is drawn whole; an activity's `goal` ends the game, done, at a chain that long played whole without help (§8b). Best chain kept per set and level (help rung, matching, what a miss costs): the whole chain played in
one go without help (a chain finished from the miss on is practice, "not a best"; so is one helped; review, 2026-10-15).
**A mash** during a game ends it with what it reached ("Stopped by a mash: longest chain n", logged as stopped; it used to
go back to Ready, the game's result lost; 2026-10-16, as Drills keeps a set's results). At a game's end (game over, all
played, its goal, a mash) *Again*; after letting go, a key starts again, or in a lesson step goes back to the lesson
(**Back to the lesson ▶** is then the main button; §7e). The lowest edge key is *Hear it* on your turn and *Again* at a
game's end. While the Level panel is
open keys count nothing and start nothing (owner, 2026-10-15; also Drills): your turn has no clock, so it simply waits;
a chain being given when it opens (played, shown, or again after a miss) stops and is given again from its start when
it closes. A level changed there starts afresh.

**Help levels** (shared with Drills): 0 keys + sound, no music; 1 music + sound + keys lit, 2 music + sound, 3 music
only, 4 name only, 5 by ear. **Each level is cohesive across the whole mode** (owner, 2026-10-17: "the whole entire mode at
a certain level is cohesive for that level"; the owner had seen Hear it bring up the staff at a no-music level): the level
decides what every element shows in every state (given, your turn, Hear it / Show me, a miss, the end, Keep going). *Hear
it* gives the pattern again **the level's own way**: 0 keys lit and sound, 1 music, sound and keys lit, 2 music and sound
(no keys lit), 5 sound only; at 3 and 4 the button is *Show me*: the music, to read, not played (it used to give every
level help 1's music, sound and lit keys, so Hear it by ear drew the staff). **At 0 and 5 never a staff and never a note
name** (words, the dots, the keys' octave labels); **at 5 nothing is lit or marked on the keys, ever**. A completed
passage is drawn whole only at levels that read music (1–4). **0, "keys, no music"** (2026-10-16, for lessons before the staff is taught, Faber's
order): the chain is heard and its keys light as it plays, with no staff or notation at any point (given, your turn,
after a miss, Hear it); your turn lights where to start, as at 1. It is numbered 0, before 1, rather than renumbering
the ladder: saved levels, bests (kept per rung) and the practice log's `settings.rung` keep 1–5 meaning what they meant.
With *Nothing* under the music the keyboard still shows at 0 and 1 (the lit keys are the help). **No note names at 0**
(decided 2026-10-16 from lesson 1's plan, which teaches none yet): a miss says "Not that one: the right key is outlined"
(the wrong key red, the right one outlined), carrying on from a miss says "From where you missed", the chain's dots are
plain dots, and the keys have no octave labels (C4, C5); rungs 1–5 name as before, unless the activity says `names:
false` (§8b), which does the same at every rung. The practice log still records the
notes by name (it is for Claude). **Matching:** the same keys, any octave, or any octave and inversion (a chord still needs as many keys as
it has notes: C4 and C5 are two keys). **Speed:** steady, or quickening as
the chain grows. **Playback:** after a miss the whole chain or from the miss; when it grows the whole chain or only
the new item (you always play it all). Display: size A−/A+ (fixed size, building from the left; long chains wrap and
scroll; on a phone sideways one line that scrolls sideways, the dots in the bottom bar), keyboard or nothing under
the music. With no MIDI keyboard and more keys than fit, the keys move along the piano with ‹ › (§4 "Moving the keys"; at help 0 and 1 they move to show the chain before it is given).

**Content:** item sets (§6). Small units only; passages from pieces belong in Memorise. Rhythm sets (§4) are never
offered in Simon (it has no rhythm): its set menu leaves them out, and a link or step naming one in Simon says so.

---

## 4. Drills (exercise screen)

**For:** practising a concept as flashcards: each card is one complete short thing to play (a few bars to read, a
scale or chord by name, something to play back by ear), given at once — not from memory. `web/src/exercise/drill.ts`.

**Reached:** Practice → Drills, an exercise in Exercises (most kinds open here, §0), a lesson's step, a link. The
header's **Drills▾** is *Practise as…*: the same set in Simon (owner, 2026-10-15). ← at the top left goes back where it was opened.
Back from Simon to Drills in a lesson step's set, the step's own level comes back (F22). Cards are played on a MIDI
keyboard or by tapping the keys on the screen. With nothing to play on (no MIDI keyboard connected, or MIDI not allowed,
and no keys on the screen: Nothing under the music, help above 1) the Ready screen says "No MIDI keyboard found: choose
Keyboard under the music (Level) to play on the screen, or plug one in." until a keyboard is seen or the keys are shown
(F17; owner, 2026-10-15: it said "Cards are judged from a MIDI keyboard; none is connected." with the keys showing too,
which was false). Simon says the same in the same case (§7d). **A MIDI prompt not answered** (ChatGPT's live review of lesson 1, 2026-10-16): Simon, Drills, Memorise and the lab
never wait on the browser still asking to allow MIDI (`midi.ts` `startSoon`): after 1.5 s they open as with no keyboard,
and a keyboard allowed later is heard (it was: lesson 1's copying step never opened, and said nothing). A set file that could not be read is read again the next time Drills or Simon opens (F20).

**How it works:** a card appears at the chosen help level (0 keys, no music: it plays the card with its keys lit and
no music is drawn, not even with the result, where the keys show the wrong keys red and the missed ones outlined, and
no note name is shown: a card's slips are counted ("2 notes early"), the set's results are numbered without names, and
the keys have no octave labels; 1–2: it plays the card first; 4: the name only, and any
octave counts, held as written in whichever octave you play; 5: by ear, it plays and you play it back). A timed card starts after a bar of count-in clicks or on
your first note (by ear: always your first note); the metronome can keep clicking. **At music only (3) with a count-in,
the card is shown and waits** (owner, 2026-10-16, after ChatGPT's review of lesson 2: it counted in at once, about 3 s
to read two bars): "Read it", then a key, a pad tap or *Count in* starts the count-in (that key is not a note); *Hear it*
there plays the card (help), then the card **waits to be read again** (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): it had counted in and judged at once.
**A demo can be skipped from a set's second card on** (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): during a card's own demo (help 0–2, starting after a bar
of clicks) a key or a tap goes to the count-in ("a tap skips to the count-in"); not a demo asked for with Hear it, nor
in its first 0.8 s (the key that brought the card). The count-in reads 1 to 4 (it read 0 for a moment). The card counter
stays on the card while Again replays it (it had counted one more: "Card 6 of 5").
**Rushing and dragging named** (`src/drift.ts`) (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): on every timed card, a straight line through the taps' times
against the notes' times; when the tempo played differs from the card's by 5% or more and that line accounts for at least
half of how the taps moved (R² ≥ 0.5; at least 4 notes over 2 beats), the result says "You sped up" or "You slowed down"
(also in the set's list and the log, `drift`). 5%: listeners hear a tempo change in a steady sequence from about 3–4% at
these beat lengths (Drake & Botte 1993; ten Hoopen et al. 2011), so only an audible change is named. Colours unchanged. After a card, missed notes are **grey** (and ringed with a dashed circle: a shape
too, not colour alone) and early, late or let-go-early notes orange, with a one-line key under the card ("grey: missed ·
orange: early, late or let go early", and "red: a wrong key" when one shows red on the keys; owner, 2026-10-16: green
read as right; the app's one set of marks, §7e); on the keys a wrong key is red and a missed one **outlined in blue**
(the "play this" colour; it was green). A set with no clean card is never called a new best. With a MIDI keyboard
connected the lines say a key starts and goes on too ("play a key or press Start", "tap the pad, play a key or press
Start"; owner, 2026-10-16: hands stay on the keys); with none they say Start (and the pad) only. Cards are judged:
- **with written rhythm** (MusicXML items, bars from a piece): in time, as Play along (on time and held / let go
  early / early / late / missed, wrong keys; *On time* relaxed / normal / strict);
- **without** (notes, chords, intervals): as the set says — the right notes in order, or steady beats of a given
  length (steady beats are judged on when, not how long); *On time: notes only* judges every card on notes alone.

A right card moves on by itself; one with slips shows them on the card (missed grey, early/late orange, wrong keys
red, as above) and waits for *Again* or *Next* (a key goes on after 0.8 s). *Again* replays the card and that try replaces its result (a set is always N
cards: a retry never adds one). A pool is dealt like a shuffled deck (owner, 2026-10-15): every item once before any
comes again, then shuffled again, never the same card twice running (across a reshuffle or into the next set either), so
a set of 5 from 3 items holds all 3 and 6 from 3 holds each twice; a passage gives its items in order, and *the misses
again* in the order they were missed. A card got right on Again shows as "right on a retry", not clean, and is not one of the misses.
Help (*Hear it*, *Show me*, or the hint after 8 s without a key on a notes-only card, which names the notes when the keys aren't shown) is
noted and the card doesn't count as clean. Notes-only cards have *Skip*. A set is 10 / 20 cards, or endless with a
*Finish* button; then each card's result, *the misses again* (just those) or a new set; in a lesson step **Back to the
lesson ▶** is the main button there, and a key does it after 0.8 s (outside a step a key at Set done does nothing; §7e). Best kept per set and level
(help rung, On time) and set size, from full sets only (not one stopped early by a mash or Finish, not an endless
one), shown on the Ready screen and at the end; tempo per set. "A new best at this level" only over an earlier full set
(a first set is no best beaten). "The misses again" played through is logged `ended: "set done"` with `missesAgain:
true` (it was "stopped early") and said "The misses again: practice, not a set of its own". When a card was right only on
a retry or with help, Set done adds "clean: right the first time, with no help". **Keep going** (owner, 2026-10-18:
"Always have drills give the option to keep going"): at every Set done, more cards with the same set and level until you
press *Finish* (an endless run: practice, logged as such; the set before is already logged, and a lesson step already
counted it). At Set done the pad (or the keys) gives
up room so every card's line shows. A name to play
is drawn flashcard-size; with the result the music appears and the name sits small above it. On a tablet A+ can
make a card bigger than the score's biggest size, up to filling the room. A card never grows,
so it is drawn on one line, or on two when that comes out bigger (2026-10-17), centred and as big as the room allows
(never past the score's biggest size, 180%);
A−/A+ make it smaller than that (Simon instead keeps one size and builds from the left).
**The Level panel over a card** (owner, 2026-10-15): keys count nothing while it is open, and the card carries on when
it closes: one waiting for your first note, or a notes-only card, waits on (the 8 s hint counts from the close); one
being played to you is played again; a count-in starts again; a card whose clock was running starts its try again
(count-in or first note, as set; what was played before is dropped, and it is not a retry or help); a clean card's move
to the next waits for the close. A level, tempo or set changed there starts afresh.

**The first tap** (owner, 2026-10-16: "Make sure to start on the first tap"): no key or tap is swallowed. At Set done the keyboard's lowest key (once set up) is *New set*, said "lowest key: a new set" in a step (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/).
On Ready a key
(or a pad tap) starts the set (the line says so: "press Start or play a key", "tap the pad or press Start"); on a card's
result it goes on to the next card (a card with slips says "a key goes on to the next card" after its result; a clean
one moves on by itself, or at once with a key; a key in the first 0.8 s of a result is not taken as going on, so a
finger still on the card's last beat never skips what it says). When that card waits for your first note (no demo first, no count-in:
rung 3 or 4 starting on your first note, or a notes-only card) the same key is its first note, on time, the card's clock
running from the moment it was pressed. Where the card is played to you first (rungs 0–2, 5) or a count-in comes first,
the key starts that ("Listen…", "Count-in…"). At the end of a set (*Set done*) keys do nothing: *New set* or *the
misses again*.

**Each help level cohesive** (owner, 2026-10-17; as Simon, §3): **by ear (5) no staff, no name and nothing on the keys,
the result too** (it had drawn the music with an ear card's result, named the notes in it and outlined the missed keys):
the slips are counted in words ("2 notes late · 1 wrong key"), the set's results are numbered without names, and the
keys have no octave labels; a rhythm card by ear shows its taps on the beat line, as at 0. At 0 as before (no staff or
name; the keys show the result). The **8 s hint** on a notes-only card is given only where it adds what the level allows:
at 2–4, with names shown, "Next: E4 (counts as help)"; at 0 and 1 the next keys are lit already (it had marked such a card
"with help" for being slow), by ear nothing is shown (Hear it is there), and it never lights keys at 2–5 any more.

**Finger-number cards** (owner, 2026-10-17: lesson 1's tune by finger numbers; `exercise/fingers.ts`): a set with `"view":
"fingers"` (§6). Each card is drawn as **the finger numbers of its notes, by phrase**, one line a phrase (never broken),
big (as big as the music's room allows: 30 px at 360×780, 27 px at 844×390 for four phrases of up to eight), in the music
area with no staff, the hand said once above them ("Right hand"). On the keys **the hand's five keys are shaded with their
finger numbers on them**, from the activity's `fingers` (the card's own notes, and for a finger the card does not use, the
key the map gives that finger nearest the card's notes; no map: the card's notes only); the activity's other numbers are
off meanwhile, and **no key is ever lit**. Start (or a key on Ready, or Next) plays the card at the set's tempo with **each
number lit as it sounds**; then "Your turn" (a key while it plays stops it and is your first note, as in Simon; not in its
first 0.8 s, the key that brought the card). **Untimed, notes in order:** the number to play next is highlighted, the ones
played paler; the right key moves it on; **a wrong key flashes red (0.6 s) and the right key is outlined**, and it waits
for the right one (no Skip). *Hear it* plays it again (noted as help; the card then ends "✓ Done, with Hear it"). The card
ends **"✓ Clean"** (no wrong keys) or **"✓ Done, n wrong keys"**, then *Next* or *Again* (it does not move on by itself;
a key goes on after 0.8 s). A set is played through when every card is (wrong keys or not). The Level panel shows only
the cards per set; the keys always show (Nothing under the music does not hide them); no note names anywhere; Simon has
none (Practise as… offers Drills only; a step or link naming one in Simon says so). *A line tapped* is heard on its own
(owner's lesson 2 spec, 2026-10-18; noted as help on a finger-number card, as Hear it is).

**Letter-name cards** (owner's lesson 2 spec, 2026-10-18: Ode to Joy by key names; `exercise/fingers.ts`, `drill.ts`): a
set with `"view": "names"` (§6). The same card as a finger-number one, with **each note's letter in place of its finger**
(C, F♯; no octave), by phrase, the hand said once. **Nothing is shaded or numbered on the keys**, and no octave labels.
Start (or Hear it) plays it in the set's rhythm (its `beats`, at the set's tempo) with **each letter and its key lit as
it sounds**; a line tapped plays that line (where you are stays). Your turn as on a finger-number card: untimed, notes in
order, the next letter highlighted. What a miss does and the help offered are the **activity's** (§8b `miss`, `help`;
`PhraseHelp` in drill.ts), for either kind of phrase card:
- `miss: "outline"` (the default; lesson 1's Mary): the wrong key flashes red and the right key is outlined.
- `miss: "quiet"`: the wrong key flashes red and is **named**, "That's G: find E" (a black key: "a black key"), and
  **nothing is outlined**.
- `help: ["show-key"]`: a **Show key** button (under the music, beside Hear it) outlines the right key until you play it.
- `help: ["names"]`: a **Names** button puts every white key's letter on the keys, on or off; it opens off and stays as
  you leave it for the cards after, until the screen closes.

On a letter-name card, hearing it (Hear it, a line) is **not** help: its letters are what you read. A card ends **"✓
Clean"** only with no wrong key, no Show key and the names off throughout; otherwise **"✓ Played through: 1 wrong key,
Show key once, names shown"** (what applies), then *Next* or *Again*. "Key names" on the score line; the Level panel
shows only the cards per set; Simon has none.

**Rhythm sets** (owner, 2026-10-16, decided with options: inside Drills, one big pad, a one-line rhythm staff, echo and
read, patterns generated from the values taught; `exercise/rhythm.ts`, `pad.ts`): cards of rhythm alone, a set of kind
`rhythm` (§6).
- **The pad:** the keys under the music are replaced by one large pad across the width (upright as tall as Free play's
  keys, `min(42vh, 360px)`: 328 px at 360×780, 360 px on a tablet at 820×1180; sideways 30% of the height, 117 px at
  844×390), "Press · hold each note its length" (every note is held ¾ of its length, quarters too: owner, 2026-10-16). A tap is a
  note; keeping the finger down holds it. It lights orange while pressed and blue when the app plays a note (rungs 0 and 1: each note most of
  its length, so two quarters are two flashes and a half a long one). A second finger down while one is held is a new
  tap; letting go, a cancelled pointer or a finger slid off the pad lets go. **A tap sounds** at once (ChatGPT's review of
  lesson 2, passed on by the owner: so a tap on the beat covers the click): a short low knock (noise through a 600 Hz
  band, on the clicks' volume; never the metronome's click); measured in the browser check, the sound is started within
  1 ms of the tap's pointerdown, then reaches the ear after the output latency. A panel open: a tap counts nothing and
  makes no sound. Any MIDI key counts the same as a tap (and sounds as itself); the keyboard's edge keys are taps too while
  a card is yours (not commands). The pad is always shown for a rhythm set (no Keyboard / Nothing choice).
- **The staff:** one line (percussion clef, the time signature, bar lines, unpitched notes on the line with stems up,
  eighth pairs beamed, rests), the result's marks coloured on it as on any card. It sounds on one pitch (C5); no note is
  ever named ("2 notes late", "1 note let go early", "1 extra tap").
- **The beat line** (`exercise/beatline.ts`) (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): at help 0 (no music) a card's result is drawn on a line of
  beats: a tick for each click, the bar lines, the count under each beat, each note's length as a pale band, each tap where
  it landed (ahead of or behind its click) with a bar for how long it was held; on time in ink, early / late / let go early
  orange, a note missed ringed grey, an extra tap red, with the one-line key ("red: an extra tap"). Drawn to scale in real
  time. Help 1–5 draw the music with the result as before.
- **Judging:** any key or tap is the note due, one tap a note (taps within 30 ms are one), timed as written-rhythm cards
  (on time / early / late / missed, *On time* relaxed / normal / strict) and held as everywhere (¾ of the length, a note
  before a rest half; never past the next note); taps with no note are *extra taps*, never "wrong keys". Every card is
  timed ("notes only" is played as normal; not offered). A tap still held when the next tap came was cut by it (on the
  pad a new tap ends the one before): it is not let go early; the next tap is early, and is marked (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/).
- **Help levels:** 0 hear it, the pad lit as it plays, no music (echo with lights; the result without music either);
  1 music + sound + pad lit; 2 music + sound; 3 music only (read it); 5 by ear (echo: hear it, tap it back, the music
  with the result). No rung 4 (a rhythm has no name to give): a rung 4 chosen elsewhere is played as 3. The Level panel
  words them so and hides 4 and "notes only".
- Cards are dealt as any pool (a shuffled deck, never twice running; *the misses again* are those very patterns). The
  results list numbers the cards without names; the practice log names each card by its pattern ("quarter half quarter |
  whole").
- **The timing check** (owner, 2026-10-16, decided with options; `calibration.ts`, `screens/calibrate.ts`): offered once,
  the first time a rhythm set opens (a line above the pad, "A timing check first? You tap along with 8 clicks…" with
  *Timing check* / *Not now*: only an answer stores it, not shown again either way, nor when one is kept), and in Settings.
  Its words (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): "8 clicks", "the tap that starts it is not one of them", and the result "Your taps and this device
  together came n ms after the clicks" (what it measures is the learner's taps and the device together). A panel with its own pad: the tap that starts it starts the clicks (it is not measured:
  no clicks yet), then 8 clicks at 80 a minute; you tap on each (pad or a MIDI key). Each tap belongs to the click it
  follows by −150 to +600 ms (a click's first tap; later ones are extra); the first two clicks are left out; the median
  of the rest is kept, for this device and this way of playing (screen taps / MIDI keyboard, by the run's first tap).
  Refused, with "Try again: tap steadily with the clicks" and why: fewer than 4 of the 6 counted clicks tapped, or taps
  spread more than 120 ms (after leaving out the one farthest from the median), or a median outside −100…+400 ms. Kept
  beyond ±150 ms with "That is large: run it again to be sure". Used instead of the browser's figure wherever timing is
  judged (§1 "Timing as heard"), for that way of playing; the piano on the MIDI keyboard still takes nothing off.

**"Find it" sets** (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): `kind: "find"` (§6): each card names a place on the keys in words ("Find a group of three,
higher up"), and any key of that group counts; untimed, no music, nothing lit, no note names; the key that starts the set
or goes on to the next card is never taken as an answer. A key of the group: clean; another key: "Not quite", it is red
and the group named is outlined in blue ("red: a wrong key"), with Again and Next. *Show me* outlines the group (help);
*Skip*. A card may also name **a white key by letter and a place** (2026-10-17, for the C-D-E lesson: "Find a D, higher
up"): any key of that letter in that part of the keyboard counts. **The places are counted over the set's whole `keys`**
(exactly those keys: they had been rounded out to the next C, so C3–B5 drew a C6 above "a C, higher up", which is C5;
fixed 2026-10-17). With a MIDI keyboard, or when they fit the screen's window, they are drawn end to end. **With no MIDI
keyboard and more keys than the window** (owner, 2026-10-17; "Moving the keys" below): a window of them with ‹ ›, and **each
card starts with the window at a place of its own** (a white key chosen at random among those whose window lies within
the keys, never where the card before started nor where the keys are left), so the answer is never at one spot on the
screen and is found by the black keys' pattern and the small whole piano above the keys, which marks the window and shades
the keys ‹ › reach. The words stay the set's ("Find a D, lower down") and the line under them says what they mean when only
part shows: "Lower down: the lowest D you can reach with ‹ ›" ("Higher up: the highest group of three you can reach with ‹ › ·
any key of it", "In the middle: the middle one of the Cs you can reach with ‹ ›", "Any C you can reach with ‹ ›"). A key is
the answer only by what it is: a lower D on screen when the lowest is off screen is "Not quite", and the D outlined is brought
on screen. C3–B5 (three octaves, the C-D-E test set) at 360×780 is a window of two octaves (white keys 24 px, black 20 px);
at 844×390 and on a tablet all three fit (38 / 37 px white keys), so they show whole. **No key names or octave labels on a
find-it card's keys, whatever the help level or `names`** (they would give the answer away; the window's range is not named
either). Its Level panel shows only the cards per set; Simon has none (Practise as… offers Drills only; a step or link naming one in Simon says so).

**Moving the keys (Simon and Drills; owner, 2026-10-17: "Scrollable keyboard be possible when dragging on it? Or maybe
arrow keys at the ends? Obviously this should only be of there's no midii"; read as arrows at the ends, as Free play has,
not dragging, since a drag on the keys would also play them; `exercise/keys.ts`, `key-shift.ts`).** The exercise screen's
keys **reach** the keys the set's notes need, rounded out to whole octaves (at least two), or an activity's `keys` for the
screen grown to hold every note (§8b), or a find set's `keys` exactly. With a MIDI keyboard connected that reach is drawn
whole, as before, and no arrows show (every key is on the real keyboard). With none, when the reach is wider than the
screen's **window** (two octaves on a phone upright: 15 white keys, 24 px each at 360 px, black keys 20 px; three octaves on
a phone sideways, 38 px at 844, and on a tablet, 37 px at 820), the keys show a window of it with Free play's row: **‹ ›**
an octave at a time (stopping at the reach's ends), the piano's 88 keys drawn small with the window marked and the reach
shaded, and a word for where the window is among the keys reached (the bottom, the top, the middle, lower, higher; the
range's names, C3–C5, only where note names are shown). Upright the row sits above the keys; sideways the arrows stand at
the keys' two ends, as tall as the keys, and the small piano is one thin line above them. A reach that fits shows whole,
with no row (lesson 1's copying game, C4–B4 upright, is unchanged). **The window starts** on the C at or below the set's
lowest note. **A lit or outlined key is never off screen:** at help 0 and 1 the window moves to show the card's (or the
chain's) keys before it is played, and any key lit or outlined (a hint, Show me, the keys you missed, the group named after
a miss) is brought on screen, moving by whole octaves from where it is when it can; keys further apart than the window
widen it. At help 2–5 (music, name, by ear) the window stays where the learner left it: finding the notes is theirs.
**An arrow is never a note**: it only moves the keys; it is not judged, starts no set, card or count-in, and plays no
sound (checked: on Ready, during a card, while a card waits to be read). Moving the keys is the learner's tool and is not
logged. A MIDI keyboard connected part way draws the reach whole at once; unplugged, the window comes back.

**Inside a lesson step the set picker lists only the sets that lesson's Simon and Drills steps use** (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/); opened from
Practice, every set. A step's own number of cards (5) shows ticked in the Level panel.

**A tune before the staff: the letters view** (owner, 2026-10-17: "the one-line rhythm staff with the letter inside or
under each note … played on the keys and judged for keys and timing"; `notation.ts rhythmXml(…, letters)`): a set with
`view: "letters"` (§6) draws each card as a rhythm card is drawn (the one line, the percussion clef, the time signature,
bar lines, quarter / half / whole shapes) with **each note's letter under it**, as a lyric line (C, D, E; F♯ and B♭ with
their signs): OSMD draws lyrics in a line of their own, legible at 360 px (the letters 14 px for a four-bar card, 22 px for
two), while a letter inside a notehead would not fit (heads 6–11 px at 360) and would fill the open heads; under the note a
half note stays open and a whole note open with no stem (check:browser measures the ink inside each head). Played **on the
keys** (the keyboard, not the pad) and judged as any card with written rhythm: which key and when, held ¾ of its length;
the help levels as usual (0 keys lit and sound, no drawing; 1 this view + sound + keys lit; 2 this view + sound; 3 this view
only, the card waiting to be read). The letters show whatever the step's `names` says: the view is the step's choice to
show them. **Size:** a card is drawn on one line, or its bars on two lines when that comes out bigger in the room
(owner, 2026-10-17: a four-bar card is two lines of two on a phone upright, letters about 26 px; one line sideways); no
sideways scrolling at 360×780 and 844×390. Eight bars on a phone upright stay small even on two lines: give a long tune
as four-bar cards.

**Content:** item sets (§6), one item per card; for sight-reading give MusicXML items with real rhythm; for
name or scale cards give `notes`/`chord` items with a `name`, and `rhythm` in the set if timing should count. A rhythm
set gives `generate` (fresh patterns from its note values) or MusicXML patterns.

---

## 5. Free play (Practice → Free play; ← at the top left goes back)

**For:** playing anything and seeing what it is. The keys you play light up and are named, with the chord or
interval they make (two keys named as the Intervals column names them: an octave is "octave", C3 + E5 "major 3rd + 2
octaves"; final review F16); below, three columns of what you played lately (newest on top): chords held together (three
or more notes that make a named chord), notes (keys pressed together on one line), intervals (note to next, with
direction, and two notes held together; wider than an octave it says so: "major 3rd + 2 octaves"). *Show* turns
columns off. Nothing is judged or kept. `web/src/freeplay.ts`. The keys are 42% of the screen's height, at most 360 px
(a phone on its side: 108 px, so the recent columns keep their room); they had been 108 px everywhere, a style
overridden by mistake (fixed 2026-10-16). Opened from a lesson step, its activity can choose the
keys shown (§8b `keys`: e.g. C4–E5 upright, so the black keys are about 30 px wide on a phone); ‹ › then move those
keys an octave at a time. **Opened by a lesson's step** (owner, 2026-10-16, after ChatGPT's live review of lesson 1: the screen said only "Play
something" and named intervals a first lesson hasn't taught): the step's `about` (its task) shows on the task line (§7e),
kept in view while keys are held, and the three columns start hidden; Show turns them on for that visit only (your own
Free play keeps its columns, `piano-web.freeplay.v1`), and it opens in the middle (from C3), not where you last left Free play
(ChatGPT's review, F5: left at the bottom, a step asking for higher and lower opened with ‹ off). An activity's `names:
false` hides note names (§8b). Every screen a step opens shows its task the same way (§7e), so a step's `about` is
written as the task to do on that screen. A Free play step counts as visited once a key is played there (§8c).
**The black keys' groups and where you are** (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): the groups of two and three are outlined on the keys, with 2 or 3
under each (amber and blue, as lesson 1's picture), unless a step says `groups: false`; in your own Free play (not a lesson step) they are off unless you turn them on
(Show → "The black keys' groups", kept; owner, 2026-10-17); above the keys the piano's 88 keys drawn small with the part shown marked, and a word for it:
the middle, higher, lower, or the top / the bottom when › or ‹ can go no further (never a note name). **Finger numbers**
from a step's `fingers` are drawn on the keys (§8b). **A click** a step turns on (`click`, §8b) starts with the screen,
with a "Click ♩72: on / off" button in its head; it stops with the screen. **Show while names are hidden**: Chords, Notes and
Intervals are unticked and not offered, with "Names of notes, chords and intervals come in a later lesson".

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
  the style's rhythm (the chord where the style plays it) → Your own way (any voicing, any rhythm). A bar is green ✓
  when every note of its chord (any voicing or octave; the Roots step: the root) is down together by the beat
  (±150 ms of real time at any speed; a small roll is fine; looser than a note's ±100 on the score: a chord's notes land
  over a moment), orange ~ when a little late (before the next chord), grey – (dashed) with a missing note or the notes
  only ever played one at a time (Your own way allows that), red ✗ with a key not in the chord: the app's one set of
  marks (§7e), each with its sign beside the bar number as well as the tint, and a one-line key under the result; said
  in music words ("Bar 4 C7: you played C E G; it needs B♭ (the 7th) as well"); a key not in the chord is named from
  the chord's key signature (flats for flat-side chords and C: "E♭ isn't in C7", "A♭ isn't in Cm"; 2026-10-14). Chords on the beat are held until the
  chord changes, the style's rhythm as long as the band holds each (¾ of it, pedal counts; orange if let go early);
  Roots and Your own way leave the length to you. Times are the keyboard's own. Help: keys lit, notes named, or the symbol only.
- **Lead steps (over a chart: improvising):** roots in rhythm → chord notes (lit) → the scale (the chart's, lit pale,
  the chord's notes dark; land on a dark one when the chord changes) → call and answer (the band plays the chord's
  notes up in the first two of every four bars played, counted through the rounds; you answer in the next two) →
  free. Not marked: it says how it went ("you played at 7 of 9 chord changes, on a chord note at 5 · 92% of notes from
  the lit keys"; Free, with nothing lit: "% of notes in the chord or the scale"). A round counts as played (toward the
  ✓) when you played in at least half its bars. The keys: two octaves from middle C.
- **After:** how it went, the next step once a step has two clean rounds, loop the bars that went wrong, try the other
  part. The main button is *Step n ▶* when offered, else *Again ▶*; in a lesson step **Back to the lesson ▶** (§7e). A
  key (after 0.8 s) or the highest key does the main button (the highest key always did Again before); stopped on the
  steps, a key starts the count-in as ▶ Start does (not a note), said "or play any key" beside ▶ Start with a keyboard
  connected. ■ in the middle of a round shows that round as far as it went, and it does not count. Tap bars in the box
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

## 5e. Read in time (rhythm and reading, one after another; owner, 2026-10-18; `screens/flow.ts`, `flow/`)

Built the way dedicated rhythm trainers work (owner: "Look up how rhythm practice apps do it and follow good ux
procedure"; Rhythm Sight Reading Trainer, Melodics, CrossBeat; design/2026-10-18-week1/spec.md). It plays a rhythm set
(tapped on one big pad, or any key) or a set of melodies with written rhythm, made-up tunes included (played on the keys
or a MIDI keyboard).
- **Count-in once**, one bar ("1 2 3 4" big on screen), then **it keeps going**: the click never stops, a rhythm
  exercise follows the last with no gap, a melody after one bar's gap. The exercise being played is drawn on its own
  line (a one-line staff for rhythm, a treble or bass staff for a melody, whichever its notes need), with **the next one
  faded under it** to read ahead; a line moves through the notes with the clock. Drawn with VexFlow.
- **A mark on every tap, as it lands**: a dot over its note, green on time (±100 ms), orange early (←) or late (→) up to
  its window (260 ms, never past 45 % of the gap to a neighbour), red a wrong key, a grey ring missed; a grey tick for a
  tap near no note (an extra tap, counted for the exercise whose stretch it fell in). Only *when* is judged unless
  **Judge note lengths** is on (owner, 2026-10-18: "Yes, as an option"; off by default): then a note let go before ¾ of
  its length, and before the next tap, is "let go early" (an orange dash); an exercise's last note is never asked.
- **Scores**: under the music the last exercise's line ("7 of 8 on time · 1 late · 1 extra tap"), scored once its last
  note's window has closed; at the top the exercise's number, the session's share on time and how many in a row.
- **Choices** (kept per phone; an activity can preset them for its visit): **Tap along** (the rhythm sounds with you,
  each note on the piano) or **Read** (the click only); **− / +** tempo by 5 (40–200; while running, from the next
  exercise); **Speed up by itself** (+5 after three exercises in a row at 90 % or better with no extra taps); **Loop this
  one** (while running: the exercise being played again and again until switched off); **Judge note lengths** (changed
  while stopped).
- **Ends**: Stop, a mash, a panel opened, or nothing played for two bars ("Stopped: nothing played for two bars"). The
  summary: exercises, share on time, the best run, the tempo; **Keep going** (a new count-in) and, in a lesson step,
  **Back to the lesson ▶**. A tap on Ready starts it; the keyboard's highest key starts it when stopped.
- **Keys**: a melody's card shows its own notes' octaves only (two octaves on a phone; they change in the bar between
  cards), no names on them; the pad for rhythm. Sideways on a phone: the music on the left, the choices and a tall pad on
  the right, the keys along the bottom.
- **Logged** (§7b) as `screen: "flow"`, the set, `settings` bpm / mode / holds / autoSpeed, `result` exercises, onTime,
  notes, percent, bestStreak, each exercise's line, and `ended` "round played" (8 exercises or more in one go) or
  "stopped early". A lesson step with no target is done with a round played; a target `onTime` (a share) counts too.
  Read counts for a Tap along step, not the other way round.
- Opened from a lesson step (activity `screen: "flow"`, §8b), from Practice (a rhythm set), or `?tool=flow&set=…`.
  Practice lists rhythm sets as "tap them in Read in time".

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
  ("Added “…” to your library (Music)." on the message line); then the step carries on. So
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
                                                        //   arpeggios, chords, intervals, cadences, melodies, rhythm (or none: "Other")
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

**A rhythm set** (owner, 2026-10-16; §4; `exercise/rhythm.ts`): `"kind": "rhythm"` and `generate` instead of `items`
(since 2026-10-18 `generate` may be a **list** of these, their cards together: 3/4 and 4/4 in one set, say; and a card never
has two rests running, nor rests over half a bar, unless a rest is its `feature`). From Practice a rhythm set opens in
**Read in time** (§5e); Drills still plays it:

```json
{ "title": "Quarter and half notes", "kind": "rhythm", "tempo": 72,
  "generate": { "values": ["quarter", "half"], "meter": "4/4", "bars": 2, "feature": "half" } }
```

`values`: the note values taught so far, from `whole`, `half`, `quarter`, `eighths` (a beamed pair on one beat),
`dotted-half`, `quarter-rest`, `half-rest`, `whole-rest`, each once, at least one a note; `meter` `4/4`, `3/4` or `2/4`
(a quarter-note beat); `bars` a whole number 1–4; `feature` (optional) one of `values`, in every card (the value just
taught). Each card is `bars` bars of `meter`: every bar adds up exactly, no value longer than what is left of its bar,
eighth pairs only on a beat, the card starts with a note (not a rest). The set's cards are a pool of up to 24 different
patterns made when the set is read (every pattern the values allow, when there are fewer: quarter and half in two bars
of 4/4 with a half in each card make 24; adding the whole as the feature, 11; quarters alone, the one steady-beat card).
Values are chosen evenly at each place, among those that still let the bar be filled. Refused with the reason: an unknown
value, one listed twice, rests only, a value that cannot fit the metre (a whole in 3/4 or 2/4, a dotted half in 2/4, a
whole rest in 3/4: a whole rest is 4 beats here), values that cannot fill a bar starting with a note (halves alone in
3/4), a feature not in `values` or that no card can hold (a whole rest in a one-bar card, which starts with a note), a
`meter` or `bars` out of range, a misspelt field; `generate` on a set of another kind; `order` with `generate`. A rhythm
set may give MusicXML `items` instead (written patterns, read as any MusicXML item; their pitches are not judged and they
sound on one pitch; named "Pattern n" unless they have a `name`); any other item is refused, and so are `from`, `rhythm`
and `play` on a rhythm set. Its MusicXML files are not listed as music to open on the score. Lesson 2's sets:
`rhythm-steady-beat` (quarters, 4/4, 2 bars, ♩ 72), `rhythm-quarter-half` (quarter, half; feature half),
`rhythm-whole` (quarter, half, whole; feature whole).

**A letters set** (owner, 2026-10-17; §4): any set of MusicXML items (or bars from a piece) with `"view": "letters"`; each
card one note at a time (no chords), with written rhythm:

```json
{ "title": "Merrily We Roll Along, bars 1–2", "kind": "melodies", "view": "letters", "order": "passage", "tempo": 72,
  "items": { "1": { "musicxml": "merrily-1-2.musicxml", "name": "Bars 1–2" } } }
```

Refused: a `view` other than "letters", a view on a rhythm or find set, `play` with it (it is played in Drills, and its
files are not listed in Exercises as music for the score), a card with no written rhythm (a `notes`, `chord` or
`interval` item), a card with a chord. The test set `test-letters` holds the first two bars of Merrily We Roll Along as
Faber's Primer prints them on p. 26 (E D C D | E E E-half, right hand, middle C's octave; as Claude verified from the publisher's PDF, not re-checked by the build) and layout cards (four, eight bars; quarter, half, whole).

**A finger-number set** (owner, 2026-10-17; §4 "Finger-number cards"): `"view": "fingers"`; each card a `notes` item, one
note after another, with `fingers` (a finger 1–5 for each note, `/` between phrases) and `hand` ("right" or "left"); its
name, left out, is "Right hand" / "Left hand". Example (lesson 1's tune as the spec gives it, right hand, middle C's
octave; the real set is lesson content):

```json
{ "title": "Mary Had a Little Lamb, by finger numbers", "kind": "melodies", "view": "fingers", "order": "passage", "tempo": 100,
  "items": {
    "1": { "notes": "E4, D4, C4, D4, E4, E4, E4, D4, D4, D4, E4, G4, G4, E4, D4, C4, D4, E4, E4, E4, E4, D4, D4, E4, D4, C4",
           "fingers": "3 2 1 2 3 3 3 / 2 2 2 3 5 5 / 3 2 1 2 3 3 3 3 / 2 2 3 2 1", "hand": "right", "name": "Right hand" } } }
```

The activity that plays it gives the hand's keys their numbers with `fingers` (§8b), e.g. `{ "C4": 1, "D4": 2, "E4": 3,
"F4": 4, "G4": 5, "C3": 5, "D3": 4, "E3": 3, "F3": 2, "G3": 1 }` for both hands' C positions. Refused (the reader and
check:content): fingers not one a note, a finger outside 1–5, an empty phrase, no `hand` or another word, a chord, a card
that is not `notes` (MusicXML, chord, interval), `rhythm` or `from` on the set, `play`, and `fingers` / `hand` on a set
without the view. check:activity and check:path also refuse a card whose finger differs from the activity's map on any
note, and a finger-number set in Simon. The test set `test-finger-cards` (two cards, right and left hand, four phrases
of 7, 6, 8 and 5) is a placeholder for the checks.

**A letter-name set** (owner's lesson 2 spec, 2026-10-18; §4 "Letter-name cards"): `"view": "names"`; each card a `notes`
item, one note after another, **`/` between phrases** in the notes, and `hand`; no `fingers`. Either kind of phrase set
(this and `"fingers"`) may give **`beats`**: each note's length in quarter notes (`/` allowed between phrases), used only
when the card is played to you. Example (lesson 2's tune, from the score on Wikipedia's "Ode to Joy" page moved to C; the
real set is `ode-to-joy-names`):

```json
{ "title": "Ode to Joy, by key names", "kind": "melodies", "view": "names", "order": "passage", "tempo": 100,
  "items": {
    "1": { "notes": "E4, E4, F4, G4, G4, F4, E4, D4, C4, C4, D4, E4, E4, D4, D4 / E4, E4, F4, G4, …, D4, C4, C4",
           "beats": "1 1 1 1 1 1 1 1 1 1 1 1 1.5 0.5 2 / 1 1 1 1 1 1 1 1 1 1 1 1 1.5 0.5 2", "hand": "right" } } }
```

Refused (the reader and check:content): `fingers` on a card, an empty phrase, no `hand`, a chord, `beats` not one a note
(or not a length 0.25–16), `rhythm` or `from` on the set, and `hand` / `beats` on a set without a phrase view.

**Made-up tunes** (owner, 2026-10-18: the week's lesson, "generate way more than needed"; `exercise/melody.ts`): a
`"kind": "melodies"` set with `generate` instead of `items` (or a list of them, their cards together: both hands):

```json
{ "title": "Made-up tunes: G position, left hand", "kind": "melodies", "tempo": 60,
  "generate": { "position": "G2", "values": ["quarter", "half", "whole"], "meter": "4/4", "bars": 2, "skips": 0.3 } }
```

`position` the lowest key of a five-finger position whose five notes (the major scale's first five) need no black key:
a C or G position (F needs B♭) from C2 to C5 (C3 / G2 the left hand's, C4 / G4 the right's); `values`, `meter`, `bars`,
`feature` as a rhythm set's (the card's rhythm comes from the same generator); `skips` the share of moves by a third
(0–1, default 0.3), the rest steps and now and then a repeated note; never outside the five, the last note the home key.
Up to 200 different cards (split between the specs of a list). Read in Drills (untimed: "music only, notes only") or in
time in Read in time (§5e). Refused: a position that needs a black key or is off C2–C5, `skips` outside 0–1, an unknown
field, `items` / `from` / `rhythm` / `order` / `view` beside it. Practice lists it as "tunes made up fresh every card".

**A "find it" set** (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/); `exercise/find.ts`, §4): `"kind": "find"` and `find` instead of `items`:

```json
{ "title": "Find the groups", "kind": "find", "find": { "keys": "C3-B4", "groups": ["two", "three"], "places": ["lower", "higher"] } }
```

`keys`: the keys the cards count places over (exactly these; with no MIDI keyboard and more of them than the screen's window, a window of them with ‹ ›, §4), from a white key to a higher white key on the piano; the groups of black keys wholly on them are
its groups (two: C♯ D♯, three: F♯ G♯ A♯), each kind ordered low to high. `groups`: `two`, `three` (each once). `letters`
(2026-10-17): white keys by letter, `C` to `B` (each once), each letter's keys on the range ordered low to high, so
`{ "keys": "C3-B5", "letters": ["C", "D", "E"], "places": ["lower", "middle", "higher"] }` makes nine cards ("a C, lower
down" is C3, "a D, higher up" D5). `groups` or `letters`, or both. `places`: `any` (any group of that kind), `lower` (the lowest), `higher` (the highest), `middle` (the one between:
an odd number, three or more); each once. One card for each group at each place (the example: four cards, "a group of two,
lower down" … "a group of three, higher up"), dealt as any pool. Refused with the reason: keys not so written or on a black
key, an unknown group or place, one listed twice, "lower"/"higher" with fewer than two groups of that kind on the keys,
"middle" without an odd number of three or more, a misspelt field, `find` on a set of another kind, and `items`, `from`,
`generate`, `rhythm`, `play` or `order` on a find set. Kind `find` is listed in Exercises as "Finding the keys". The test
set `test-find-groups` is a placeholder for the checks.

Or a passage cut from a score: `{ "title": …, "from": { "score": "mozart-k2", "bars": "1-4", "staff": 1 } }`
(`bars` are the printed bar numbers, default "1-4"; `staff` default 1; an unknown score id is reported, never
replaced by another score). A passage becomes one item per moment with notes (a rest goes with the item before it);
`tempo` may be given, else the score's own at that point.

**How its music opens** (re-check V32): a set whose items include MusicXML files (Exercises lists each as music) may say
`"play": { "mode": "wait", "hands": "right", "tempo": 90 }`: the score's preset choices, as an activity gives them
(§8b), limited to `mode` (watch / wait / along / rhythm; not Ladder, which needs a loop of bars), `hands` (both / right /
left / off) and `tempo` (20–300); for that visit, never saved over yours. None given: Wait for me.

**Checked:** a set gives either `items` or `from` (a rhythm set: `generate` or MusicXML `items`), a `title`, `kind` one of the eight above (an unknown kind is refused), `play` as above (an unknown mode or field is refused), `order` pool / passage, `tempo` 20–300, `rhythm` "notes" or a
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
| `kind` | scales, five-finger, arpeggios, chords, intervals, cadences, melodies, rhythm, find | no | none: listed under Other |
| `find` | `{ keys, groups, letters, places }` (above) | a find set: yes | find sets only |
| `view` | "letters" / "fingers" / "names" | no | letters: MusicXML cards drawn on the one-line staff with their letters (§4); fingers: `notes` cards with `fingers` and `hand`, drawn as finger numbers by phrase; names: `notes` cards ("/" between phrases) with `hand`, drawn as letter names by phrase (above) |
| `generate` | `{ values, meter, bars, feature }` (above) | a rhythm set: this or `items` | rhythm sets only; `feature` optional |
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
  start; Memorise: Hear it; Drills: Again or Hear it; Simon: Hear it, or Again at a game's end; the lab, stopped: back
  to the steps; a step's result page: Again), held in Memorise = Peek (held elsewhere: the same as a tap); highest =
  start / next / carry on (Drills: Start, Next, Skip, New set; the lab: Start, or its result's main button; a lesson
  step's end: Back to the lesson; a step's result page: Next ▶; §7e). Where any octave counts (the lab while the band plays, Drills by name, Simon in
  any octave) the music uses every key, so the edges are notes there; a mash still stops.
- Free play shows two octaves at a time on a phone, three on a tablet (‹ › an octave; a MIDI key outside them moves them), or the keys a lesson step's activity chose (§8b `keys`, 2026-10-16). Simon and Drills with no MIDI keyboard: a window of two octaves upright, three sideways and on a tablet, with the same ‹ › and small piano, when the set reaches more keys (§4, 2026-10-17). A diminished 7th is named from its bass (Cdim7).
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
  lesson you are on; §8c), `piano-web.metronome.v1` (the metronome's tempo and beats), `piano-web.hints.v1` (tips seen or used and the install card, §7d) (all in a backup; not `piano-web.offline.v1`, what this device has saved for offline). The library's own database (§5c) is in the backup too.
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
  | `piano-web.hints.v1` | `hints.ts` | `{ tips: { <tip id>: { since, shown, done } }, install: { dismissed?, installed? } }` (§7d) |
  | `piano-web.offline.v1` | `offline.ts` | `"<files saved>:<fingerprint>"`; this device only, not backed up |
  | IndexedDB `piano-library` (version 1) | `library/store.ts` | store `items` (records, keyed by `id`, as in a backup) and store `files` (the file under `<id>`, a MIDI original under `<id>:midi`) |
  | Cache `piano-shared` | `sw.js`, `screens/library.ts` | files shared to the app, taken out (and deleted) when the library adds them |

## 7d. Teaching the app: hints, the install card, How the app works (owner, 2026-10-15)

The owner's choice (`docs/inputs/2026-10-15.md`; proposal and words in `design/2026-10-15-final-review/onboarding.md`): no
first-run tour; short hints where a feature is met, an install card, and a help page. Lesson tip blocks that teach the app
are content for later (§8c `tip`).

- **The hints** (proposals #1–#4; none blocks a tap: the message line lets taps through to the music under it, all but
  its own button):
  - *No keyboard* (states, said while true; every one "No MIDI keyboard found: <what to do>.", §7e): Play along, Ladder
    and Rhythm, Drills' Ready and Wait for me as §1 and §4 say; Memorise "No MIDI keyboard found: play on the keys
    below." (or "…: show the keyboard in Settings, or plug one in."); **Simon's Ready** says "No MIDI keyboard found: choose Keyboard under the music (Level) to play on the
    screen, or plug one in." only when there is no keyboard and no keys on the screen (Simon counts the screen's keys:
    Nothing under the music, help above 1), and so do Drills' (§4); **Wait for me turned sideways mid-run** with no keyboard says §1's sideways line.
  - *Your keyboard's ends* (stored, once; owner, 2026-10-16): the first time a MIDI keyboard connects and its lowest and
    highest keys are not set up, a card at the top: "Your keyboard is connected. Its lowest and highest keys can start,
    go on and go again, so your hands stay on the keys. Set them up now?" **Set them up** opens Keyboard controls already
    asking for the lowest key; **Not now** puts it away for good (Settings → Keyboard controls keeps the setup; Show tips
    again brings the card back). Tip id `keyboard-ends`.
  - *Tap to stop* (a stored tip): as a score run starts and the bars fade, "Tap the music to stop and get the
    controls back." on the message line (after "…: play on the keys below." when that is said). Shown on the first 3
    runs, or until a run is stopped by a tap on the music; it goes with the run.
  - *The hands label*: "Piano:" in Watch, "You:" in the others, before L R Both Off. Sideways and on a tablet beside the
    buttons (the bar stays one row); on a phone upright a small caption above them (beside them it took a third row of
    the bottom bar, 45 px of music; above them the bar grows 9 px).
  - *What a mode is for*: one line on the message line each time a mode is picked (not stored): "Watch: the app plays
    it; follow the marker." · "Wait for me: it waits for your notes; no clock." · "Play along: at tempo; the piano plays
    the hand you don’t; a summary at the end." · "Rhythm: any key counts: play the rhythm only." · Ladder: with no loop
    "Ladder: tap the first bar to practise. It goes round that loop; each clean pass a little faster, a messy one
    slower.", with one "Ladder: round a loop; each clean pass a little faster, a messy one slower." With a MIDI keyboard
    connected each adds " · a key starts it" (§7e).
- **The hint store** `piano-web.hints.v1` (`web/src/hints.ts`; in the backup and merged on restore like every
  `piano-web.*` key): `{ "tips": { "<tip id>": { "since": "<app version that introduced it>", "shown": n, "done": "<ISO
  time>" } }, "install": { "dismissed"?: "<ISO time>", "installed"?: "<ISO time>" } }`. The app has no version number, so
  a tip's version is the date of the release that brought it (`tap-to-stop`: "2026-10-15"). **After an update only tips
  new in it show** (owner): a record counts only for the version it was written at, so a new tip, or one given a newer
  `since` because it changed, shows by its own rule once; tips already done stay done. **Settings → Show tips again**
  removes `tips` (every tip shows again); the install card's ✕ stays (it is not a tip; the owner chose "never again").
  A check can make a tip look newer with `window.__pianoHintSince = { "<tip id>": "<version>" }`.
- **The install card** (Home, in a browser tab only; `web/src/install.ts`): "Install the app to keep your files and play
  offline." with ✕ and, when the browser has offered to install (`beforeinstallprompt`, its mini-infobar stopped with
  `preventDefault`), **Install**, which calls the browser's prompt (once per offer); otherwise "Chrome menu ⋮ → Install
  app". It goes on `appinstalled` (kept, so a reload in the tab does not bring it back), in the installed app
  (`offline.ts` `installed`), and after ✕ for good. Chrome's rules (web.dev, *What does it take to be installable?* and
  *How to provide your own in-app install experience*, read 2026-10-15): not already installed; HTTPS; a manifest with a
  name, 192 and 512 px icons, `start_url`, `display` standalone (ours has them); the person has tapped the page once and
  spent 30 seconds on it, at any time; `prompt()` once per event; after Cancel, wait for the event again; `appinstalled`
  fires however the app was installed. The menu words are Chrome on Android's; other browsers differ.
- **How the app works** (`web/src/help/`): a page over whatever shows (a full-height dialog: it pauses a run as every
  panel does; Back, ✕ or Done close it and nothing else). Settings → Help → *How the app works* opens it at the top, with
  a row of the sections. Each screen's **How this screen works** opens it at that screen's section, marked: in the
  score's ⋯; where a screen has no ⋯, in its own panel (Memorise's Settings, Simon's and Drills' Level, the lab's ⚙, Free
  play's Show, the PDF reader's ⚙); where it has no panel either, a link at the end of the page (Home, Practice,
  Exercises, Path, a lesson page, Music's list, the metronome). The score's ⓘ stays "about this song".
- **The help file** `web/src/help/help.md` (read by `help/read.ts`, built into the app so it is there offline): plain
  text. A line starting `//` is a note for the editor. `# Title {#id}` starts a section; the lines under it, to the next
  such title, are its text in the lessons' small text format (§8c text: paragraphs, `##` headings, `- ` and `1. ` lists,
  `**bold**`, `*italics*`, `[links](https://…)`; never HTML). Section ids the app opens: home, path, score, memorise,
  simon, drills, lab, freeplay, metronome, practice, music, pdf, settings, install (`HELP_IDS`). Text before the first
  section, a title without its id, an id used twice, HTML or an empty section is refused with the line;
  `npm run check:content` reads the file with this reader and checks every id the app opens and every `data-help` in
  `index.html`. **Keep it true:** whoever changes a screen changes its section in the same commit.

## 7e. Across the screens: result marks, opened from a lesson, keys (owner, 2026-10-16: the consistency pass)

The owner asked that what applies across modes be applied across all of them, not stacked screen by screen
(`docs/inputs/2026-10-15.md`, 2026-10-16), and answered the survey's questions
(`design/2026-10-16-consistency/survey.md`). One shared piece for each:

- **One set of result marks** (`web/src/result-marks.ts`; tokens `--mark-*` in `style.css`, checked equal by
  `check:exercise`): on the music, **missed grey** and ringed with a dashed circle (a shape as well as a colour; the
  notehead's own ring, in a chord the missed note's), **early, late or let go early orange**; on the keys, **a wrong
  key red** and **a key you were to play and didn't outlined in blue** (the lit keys' "play this" blue; it was green,
  which read as right); **one one-line key**, only for the kinds present: "grey: missed · orange: early, late or let go
  early · red: a wrong key" (and on a rhythm card's beat line "red: an extra tap", 2026-10-16). Used by a Drills card, Memorise's passes and test, the score's runs (Play along, Rhythm, a
  loop's last pass), Simon's miss (its keys) and the lab's bar boxes (✓ green right, ~ orange off time, – grey a note
  missing, ✗ red a wrong key, a sign beside each bar number). A key held down is **cyan** (`--key-pressed`, the pad
  pressed too): it was amber, next to the timing orange. Green means right only (a ✓, the lab's right bars, done dots).
  The music's dark theme is the light drawing inverted whole, the marks with it (contrast measured: §7e's check notes).
- **One "opened from an activity"** (`log.ts` `StepContext`, grown from the practice log's tag): `launch` (`main.ts`)
  sets it before the screen opens, with the activity, and for a lesson step the step and its task (`about`); it ends in
  one function (`endStep`) when another screen opens or you come back to the lesson page. Every screen reads it
  (`stepFor`): **the task line** (`lesson/task-line.ts`, `.step-task`, one style): the score and Memorise under their top
  bar, the lab above its steps, Simon and Drills above the music, Free play where "Play something" was: the step's task,
  else the activity's title (it used to be said as a message on four screens). **When you change what the step set**
  (its set, help level, cards, timing, the way: Practise as…; the score's piece, mode, hands, bars, timing; the lab's
  chart, part, step, a loop of bars; Memorise's piece or hands) the line stays and says under it **"Practice now: not
  counted for the step (why)"**, from the same rule the step's result uses (`playedAsSet`, §8c), until it is changed
  back. Another set, chart or piece chosen no longer ends the step: what you play then is kept with it, as practice.
  **`names: false`** on any activity (§8b) hides note names on its screen: the keys' octave labels and the notes under
  the score (score, Memorise), a miss's and a card's words and a set's results (Simon, Drills, at every help level), the
  wrong keys' names (Memorise), the chord tones (the lab: the chord symbol only), Free play as before. Free play's own
  reading of a step (the register from C3, the columns hidden) stays.
- **Ends and keys**: when a lesson step's set or game ends (Drills' Set done, Simon's game end, a Memorise step's chunk
  learned, the lab's result, a score run's strip, Watch to the end), **Back to the lesson ▶** is the main button (the
  step's result: as ← does) and a key does it (after 0.8 s, the last notes' keys). On the score a key starts the next run
  (the owner's answer for runs) and the highest key goes back; Wait for me and Watch end a step's run as §1 says (Watch
  stops after one round of a step's bars; Wait for me goes round until stopped, then the strip). On the step's **result page** the
  highest key is Next ▶ and the lowest Again (the edge keys, once set up); the lesson page itself takes no keys. On
  Ready a key starts wherever it can: the score (any mode), Simon, Drills, Memorise, the lab (its count-in, not a note).
  The lab's highest key does its result's main button (it was always Again). **One helper for the words about keys**
  (`key-words.ts`): said only with a MIDI keyboard connected ("Press Start or play any key", "a key goes on to the next
  card", "a key goes back to the lesson", the lab's "or play any key"), the edge keys only once set up; every "no
  keyboard" sentence is "No MIDI keyboard found: <what to do>.". The one-time offer to set up the keyboard's ends: §7d.
- **One play-it-to-me name**: *Hear it* (Drills, Simon, Memorise, a lesson's little score); *Show me* shows the music;
  Memorise's *Peek* and the lab's *Show me first* are other things and keep their names. **The stuck hint** stays
  as it is on purpose: 8 s on a Drills notes-only card (reading: owner, 2026-10-13), 3 s in Memorise (from memory), said
  in each screen's help.

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
- simon: `rung` (help level 0–5, §3; 0 from 2026-10-16), `match` (same / octave / inversion), `miss` (tries / over / endless), `speed`
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
{ "title": "…", "screen": "freeplay", "keys": "C4-E5" }                                         // keys: below
{ "title": "…", "screen": "simon", "set": "…", "level": { "rung": 0 }, "keys": { "phone-upright": "C4-B4", "phone-sideways": "C3-B5" } }
```

**`keys`: the keys the on-screen keyboard shows** (owner, 2026-10-16: "what keys are visible and how wide they are per
screen to make playing easier"; free play, simon, drills, and score in Wait for me). A range, lowest and highest key
both shown, `"C4-E5"` (a letter, `#` or `b`, an octave digit), for every kind of screen; or per kind of screen,
`{ "phone-upright": …, "phone-sideways": …, "tablet": … }`, any of them, a screen left out keeping its own keys (as
`currentDevice()` tells them apart: a tablet is 600 px or more both ways). The keys fill the width, so fewer keys are
wider; with chosen keys a black key is at least 30 px wide where the white keys allow (up to 0.85 of a white key; the
screen's own keys keep 0.6). **The music always fits:** Simon and Drills grow the range to hold every note of the set,
the score's Wait for me fixes it when the run is set up: the range with every key your hands play in the bars of the
run (the loop, else the whole piece), so it never changes while you play (decided 2026-10-16; K. 2's right hand, bars
1–4, with C5–B5 shows E4–B5 from the start; it changes only when the bars, the hands or the kind of screen change), each end moved out to the next white key: a key the step asks for is never hidden. Free play shows the
range and **‹ ›** move it an octave at a time from there (a MIDI key outside it moves it by octaves until it shows). In Simon and Drills (2026-10-17) the range, grown to hold the set, is what the keys **reach**: with no MIDI keyboard and a range wider than the screen's window (two octaves on a phone upright, three sideways and on a tablet) a window of it shows with ‹ › (§4 "Moving the keys"); so a step that wants every key in view at once on a phone upright gives at most two octaves there. No new field: the window's size comes from the kind of screen.
In force while the activity lasts: your own set chosen, another piece, or ← and the screen's own keys are back (a
score activity's keys only in Wait for me, as its keys are only played there). Refused: a range not so written, off
the piano (A0–C8), not going from lower to higher, starting or ending on a black key; a screen name that is not one of
the three; an empty `{}`; `keys` on Memorise or the lab; on a score whose `settings.mode` is not `wait`.

Every field but `screen` and its content (`piece`, `set`, `chart`) may be left out; a field not listed for its screen
is refused (`keys`: free play, simon, drills, score). **The file** (2026-10-15): its id is its file name without `.json`, letters, digits, `-` and `_` (what
`?activity=` and a step's `activity` name); `index.json` is a list of the file names, used to save them for offline and
by the check (the app opens an activity by its id, so one missing from the index still opens online but is not saved for
offline; check:activity requires every file listed). `title` is text, shown on the screen's task line while the activity lasts (§7e; a lesson step's `about` takes its place there), and in a message when it cannot open;
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
- drills: `rung` 0–5 (0 keys + sound, no music; 1 music + sound + keys lit … 4 name only, 5 by ear: §3); `start` clicks / first; `metronome` true /
  false; `onTime` relaxed / normal / strict / notes; `cards` a whole number 0 (until you stop)–100. A rhythm set (§4) has
  no rung 4 and no `notes` (played as 3 and normal), and is never a simon activity's set: check:activity and check:path
  refuse those.
- simon: `rung` 0–5; `match` same / octave / inversion; `miss` tries / over / endless; `speed` up / steady; `onMiss` all /
  from-miss; `onNew` all / new; `goal` a whole number 5–50 (owner, 2026-10-17: at least 5 everywhere; it was 1–50, lesson
  1's game had stopped at 3): before it a miss is retried with no limit, at it "You did it: a pattern of n", the step done,
  Keep going or Back (§3).
- freeplay: `keys` (above); `groups` false: the black keys' groups not outlined (on by default in a step; off in your own Free play; §5); `click`
  `{ "bpm": 72, "beats": 4 }`: a click from the screen's start, `bpm` a whole number 20–300 (needed), `beats` in a bar 1–7
  (default 4, the first accented), with its on / off button (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/).
- flow (Read in time, §5e; owner, 2026-10-18): `{ "screen": "flow", "set": "rhythm-level-1", "settings": { "tempo": 72,
  "mode": "along" | "read", "autoSpeed": true, "holds": false } }`; `settings` optional, each field optional (tempo
  40–200). The set must be a rhythm set or one whose items have written rhythm (made-up tunes, MusicXML items).
- drills: `miss` and `help`, for finger-number and letter-name cards (owner's lesson 2 spec, 2026-10-18; §4 "Letter-name
  cards"): `miss` "outline" (the default: a wrong key's right key outlined at once) or "quiet" (nothing outlined; the key
  played named); `help` a list of "show-key" (a Show key button) and "names" (a Names button: letters on the keys). Refused:
  any other value. Other cards ignore them.
- freeplay, simon, drills: `fingers`: finger numbers on the keys (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): `{ "C#": 2, "D#": 3, "F#": 2, "G#": 3, "A#": 4 }`,
  each a finger 1–5 for a pitch in every octave ("C#", "Bb", "E") or for one key ("C#4", over its pitch's number). The app
  judges keys, not fingers: the numbers only show which to use. Refused: a finger outside 1–5, a name that is not a pitch
  or a key on the piano, an empty `{}`, `fingers` on the score, Memorise or the lab; `groups` and `click` other than on
  Free play, `click` without `bpm` or with a misspelt field.
- **any screen**: `names` false: no note names on the activity's screen while it lasts, until a lesson has taught them
  (owner, 2026-10-16: lesson 1's and 2's steps; the consistency pass: every screen that names notes, §7e). Free play:
  the keys' octave labels, the range, the notes held, the chord or interval named; the score and Memorise: the keys'
  labels, the notes under the music, Memorise's wrong-key names and hints; Simon and Drills: the keys' labels and every
  word that names a note, at any help level; the lab: the chord tones (the symbol stays). `"names": true` or leaving it
  out shows them; anything else is refused.
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
next lesson with steps to do; a done lesson opened again is not where you are (Home's Up next and Path's Carry on go to the
next lesson with steps to do; (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/)). *Skip ahead* only for a lesson not started with an earlier lesson not done;
otherwise *Open*. **After the path's last lesson**, with no next lesson written: the lesson's bar says "Lesson done: all n
steps. The next lesson is not written yet" with *Practice ›* (the Practice tab), and the step's result says the same.

**Files** (`web/public/content/path/`; a lesson's files are relative to this folder; all saved for offline):

```json
// index.json: the rungs in order, each with its lessons' ids (each id once in the whole path); "test": true for a test rung (below)
{ "rungs": [ { "id": "test-app", "title": "Test: the app's lesson pages", "test": true, "lessons": ["test-minuet-opening", "test-catalogue-piece", "test-chords-and-band"] } ] }

// lessons/<id>.json: a title and its blocks, in the order the page shows them
{ "title": "Test: the Minuet's opening, right hand",
  "blocks": [
    { "kind": "text", "text": "# A heading\nA paragraph with **bold**, *italics* and [a link](https://…).\n\n- a list\n1. a numbered list" },
    { "kind": "image", "src": "media/test-picture.svg", "alt": "what it shows", "caption": "…" },        // png jpg webp svg gif, or an https:// link
    { "kind": "video", "youtube": "https://www.youtube.com/watch?v=ZD_sAWAlWq0", "title": "…", "start": 0, "end": 120, "caption": "…" },
    { "kind": "video", "size": "row", "youtube": "…", "title": "…", "caption": "…" },   // a reference video: a compact row (end of the lesson)
    { "kind": "score", "piece": "mozart-k2", "bars": "1-4", "keys": true, "tempo": 100, "caption": "…" },  // piece: or a catalogue piece, "u-<catalogue id>"; or "set": "chords-c", "item": 1;
                                                                         // or "musicxml": a whole file written out, "<score-partwise …>…</score-partwise>", or "media/x.musicxml"
    { "kind": "keys", "notes": "C4 E4 G4", "fingers": "1 3 5", "names": "letters", "caption": "…" }, // "-": no finger; names false / "letters"
    { "kind": "animation", "src": "media/test-c-major.svg", "alt": "…", "caption": "…" },   // gif webp svg png (animated), mp4 webm
    { "kind": "step", "id": "melody-cards", "title": "Melody cards, music only", "activity": "melodies-drill",
      "doneWhen": "4 of the 5 cards clean in one set", "target": { "clean": 4 }, "about": "…" },   // activity: an id, or written out (§8b)
    { "kind": "tip", "label": "Note", "text": "…" },                                  // label: "Tip" when left out
    { "kind": "read-watch", "text": "# Sitting\n…", "youtube": "https://www.youtube.com/watch?v=BmTcXlfT1OE", "title": "… (14 min)", "start": 0, "caption": "…" },
    { "kind": "keyboard", "keys": "C3-B4", "names": false, "caption": "Try the black keys: …" }   // groups: false hides the groups' outlines
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
  **Rows** (`"size": "row"`; owner, 2026-10-16: "all lessons should have relevant YouTube videos on the bottom. No need to
  show them full size unless they're more than reference"): a reference video is one compact line: YouTube's still
  (`i.ytimg.com/vi/<id>/mqdefault.jpg`) with a ▶ on it, the title, and the caption if any (the title on up to two lines,
  or, with a caption, up to two lines of each (2026-10-16: the title's end, "(Hoffman Academy, 7 min)", had been cut at 360 px); the whole of both in the row's tooltip). The whole row is the tap target. A tap plays it
  in place: the row becomes the same privacy-enhanced player (from `start` to `end`, asked to start at once), with its
  title, caption, "Watch on YouTube" and **✕ Close**, which turns it back into a row; the player is scrolled into view.
  One row plays at a time: opening another closes the first (a full-size player is not stopped by it). Offline, and online
  with YouTube unreachable (the still fails to load or takes over 8 s; the player's own probe as above once opened), the
  row stays one compact row of the same height, without the still: its title, a short note ("Needs the internet to play
  here." or "YouTube can’t be reached from here.") and "Watch on YouTube ↗"; the playable row again when back online. Consecutive rows sit
  together as one list; when the lesson's blocks **end** with rows, that list is under one plain heading, **Videos**.
  The page never reorders blocks: putting reference videos at the end is the lesson's job. Leave `size` out for a video
  that is part of the lesson (the full player).
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
- **keys**: a keyboard diagram (the app's keys) with the notes marked and their fingers (1–5) on them; up to 12 keys;
  drawn over the whole octaves the notes need, C to B (2026-10-17). `names`: left out, the octave labels (C4, C5) as
  on the screen's keys; `false`, none (a lesson before names are taught); `"letters"`, each marked key's letter on it
  (C, D, E: no octave numbers).
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
- **step, optional** (owner's lesson 1 spec, 2026-10-17: "Step (optional): Extra challenge"): `"optional": true` marks an
  extra. Its card says **Optional · title** (no number: the others are numbered among the needed steps, Step 1, Step 2…)
  and "optional" until it is played; it is never needed for "Lesson done: all n steps" (n counts the needed steps; done,
  it shows done as any step); the next step suggested (the lesson bar's Start step, Home's Up next) skips it while a
  needed step is left; once none is, the lesson bar offers **Optional step ▶** beside the way on, and Home's Up next (when
  that lesson is the one shown) offers it before "Again".
- **tip**: a callout (`label`: "Tip" by default, e.g. "Note").
- **read-watch** (owner, 2026-10-17: "here's a video or here's a text description if you want to read"): one box with two
  tabs at its top, **Read** (open first) and **Watch**; only one shows, a tap (or ← →) on the other switches; the page
  remembers nothing of the choice. Read is `text` (the text format above); Watch is `youtube`, `title`, `start`, `end`,
  `caption`, the full player as a video block. The player is put in when Watch is chosen and taken out when Read is, so a
  video playing stops; **offline** the tab shows the video's title, "The video needs the internet: it plays here when you
  are online." and the link (online but YouTube unreachable: the same card, as the video block).
- **keyboard** (owner, 2026-10-17: "an inline keyboard in the page they can press"): a keyboard to play in the page:
  `keys` a range as an activity's (`"C3-B4"`: white keys at both ends), the black keys' groups outlined with 2 and 3
  (`groups: false` turns them off), the octave labels unless `names: false`. **Every key sounds on the app's piano when
  tapped** (held, it sounds until let go; a finger slid off still lets go), black keys at least 30 px where the white keys
  allow (two octaves at 360 px: white keys 25 px); keys pressed on a MIDI keyboard show on it while the lesson page is
  open (the keyboard sounds itself, as everywhere in the app). Nothing is judged or recorded: it is not a step. A caption
  under it (e.g. "Try the black keys…").

**A step counts as done** (shown in words, never one green tick for all: *target met*, *played through*, *visited*; or
*tried, target not met yet* / *tried, not through yet*; *skipped* when a later step was played; review 2026-10-15; the
words on the step list and the result card come from one place, `progress.ts` `stepWords` and `result.ts` `through`):
- with a **target**, when one run played for it meets it, as its screen's result can tell: score `onTime` (0.05–1: a Play
  along or Rhythm run, or a pass round a loop, with that share of its notes on time and held; needs Play along, Rhythm
  or Ladder), score `bpm` (a clean pass round the loop at that tempo or faster; needs `bars`), drills `clean` (that many
  clean cards in one **full** set, as Drills' own best: not "the misses again", nor a set stopped early, left part way
  or endless; owner, 2026-10-15), simon `chain` (a chain that long played whole without help: Simon's own best), lab
  `cleanRounds` (accompaniment rounds with every bar right in one run, over the whole chart: a run that looped bars is
  practice and never counts, as the lab says; final review F07). A target its screen cannot judge (Memorise, Free play)
  is refused. **A run counts toward a target only when played as the step sets it** (owner, 2026-10-16, after ChatGPT's
  review of lessons 1 and 2, F2; `result.ts` `playedAsSet`): Drills and Simon steps need the step's set, its help level or
  a harder one (from 0, also 5; from 1, also 2–3; from 2, also 3; else the same), Drills its number of cards and its
  timing or a stricter one (tempo free), Simon `match: same` when the step says same; **the consistency pass (2026-10-16)
  carried the rule to every screen and to steps with no target**: the way of practising (a Simon game is practice for a
  Drills step, and the other way round); a **score** step's piece, its mode (Play along and Ladder count for each other;
  Rhythm only for Rhythm; Wait for me only for Wait for me), its hands or more (one hand: that hand, both or Off; both:
  both or Off), a loop holding its bars, its timing or stricter, tempo free (a `bpm` target is the tempo); a **lab**
  step's chart, part, and step or a later one in its ladder (the activity's own ladder if it has one), over the whole
  chart (a loop is practice); a **Memorise** step's piece, and its hands or both. Other runs stay in the log as practice;
  the result says "played with another help level: practice, not counted for the step";
- without a target, when a run of it went through **the whole of what the step set** (one table, `result.ts` `ended` and
  `through`; owner, 2026-10-15 and 2026-10-16): Drills its whole set (not left part way); Simon a game to its end (game
  over, all played, its goal; not one left part way: ChatGPT's review, F6, ledger C17); the **score** its bars to the end
  in the step's mode: Wait for me round its loop, or to the piece's end (V10), Play along, Rhythm or Ladder a pass round
  its loop, or the piece's last note reached (`reachedEnd`, §7b); **Memorise a chunk learned** (owner, 2026-10-16: "its
  first chunk learned", its clean passes; Memorise opens at the chunk you were on, so it is the first chunk learned there),
  or a whole-piece test with every bar clean; the **lab** a whole round of the chart (not one stopped part way, nor a
  loop; improvising, a round played in). A run that stops part way, or one not played as the step sets it, is a start:
  the step is *tried* (the card says what counts, in the learner's words: "playing the whole set", "playing a game to its
  end", "playing bars 1–4 to the end", "learning a chunk", "playing a whole round of the chart"); a step played through
  says "Played through: step done. There is no pass mark here: playing the whole set is the practice." (no ✓ on the
  result line: it is not a pass; (owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/));
- for what keeps no runs (the score in Watch, Free play): **visited** (V18: it counts toward the lesson's steps, shown
  without a ✓, since nothing was judged) only once **a key was played** (Free play) or **the music heard to its end**
  (Watch: the piece's end, or once round its loop) while the step was open (owner, 2026-10-16; `log.ts` `stepEvidence`);
  coming back without that: "Opened, nothing played", nothing marked.
After every step the result is a place of its own over the lesson page (V12: ← and Back from it are the lesson page): it
shows **this time**'s result: **the best whole run played as the step sets it** (a full Drills set, not the misses again;
Simon's best chain), "the best of n runs", then how many runs were practice ("and 1 run of practice (the misses again)")
(owner, 2026-10-16, after the beginner walk-through; design/2026-10-17-walkthrough/): it had shown the last run ("Longest chain 0 · 2 runs" beside "Target met"); with no run played as set, the last run
and why it was practice; "Nothing counted yet" when nothing was (a key while Simon plays to you counts nothing). Free play:
"You played in Free play", "Visited: you played here. Nothing is scored on this screen." Where the target counts clean
cards, a line says what clean is ("right the first time, with no help"). whether the target was met, the best so far over every attempt
(kept apart), and the feedback (Hard / OK / Easy and a note, both skippable; both cleared again, the feedback entry
leaves the log: F05). Its fixed bottom bar always holds **Again**,
**Lesson** (back to the lesson page) and the way on, in view at any size (V28): **Next ▶**, the lesson page scrolled to
the part after this step, with the next step's Start below its text (owner, 2026-10-16, after ChatGPT's live review of
lesson 1: it used to open the next step's screen, skipping the explanation before it; after a lesson's last step with an
earlier step left, the part leading to that step); when the step finished the lesson, Next is the rest of this lesson
(Check yourself, If this happens), whose bottom bar then offers **Next lesson ▶**: the next lesson with steps to do,
wrapping round to the start of the path, else the next in order (the review ledger, 2026-10-16, A3).
**Lesson** (and ←) comes back at the step just played, its card in view, not the page's top (A4). Before 2026-10-16, after the lesson's last step **Next lesson ▶**, with the card saying "Lesson done: all n steps. Next: …" (V17). A step's runs are found by the step's tag in the log (§7b),
from when it was started (kept for the tab, so a reload inside the step still counts the runs before it: F15); a step
whose activity could not open marks nothing. Switch… from the result works as from the lesson page: the chosen lesson
takes the lesson page's place (the result goes with it), and the lesson you are on has no Open (F13).

**Every field, exactly** (`lesson/read.ts` `BLOCKS`; 2026-10-15). Ids (a rung's, a lesson's, a step's) are lower-case
letters, digits and `-`, starting with a letter or digit; a rung's id once in the index, a lesson's once in the whole
path, a step's once in its lesson. Text fields are non-empty text.

| File / block | Needed | May have | Values |
|---|---|---|---|
| `index.json` | `rungs`: [{ `id`, `title`, `lessons`: [lesson ids] }] | a rung's `test` | a rung may list no lessons yet; a lesson file listed nowhere is never shown (check:path requires every file listed); `test` true / false (default false) |
| `lessons/<id>.json` | `title`, `blocks` (at least one) | — | |
| `text` | `text` | — | the small text format above; `\n` between lines, a blank line between paragraphs; only `#` and `##` |
| `image` | `src`, `alt` | `caption` | a `.png .jpg .jpeg .webp .svg .gif` file in the folder (no `..`, no leading `/`), or any `https://` link |
| `video` | `youtube`, `title` | `start`, `end`, `caption`, `size` | a watch / youtu.be / embed / shorts / live link or the bare 11-character id; `start`, `end` whole seconds from 0, `end` after `start`; `size` only `"row"` (a compact row; left out, the full player) |
| `score` | one of `piece` (with `bars`), `set` (with `item`), `musicxml` | `tempo`, `keys`, `caption` | `bars` "a-b" or "a", at most 16 bars (needed with a piece); `item` a whole number from 1 (one the set has: check:path); `musicxml` a whole file written out (`<score-partwise>`, a time signature, no bar over-full) or a `.musicxml` / `.xml` file in the folder; `tempo` 20–300 quarter notes a minute; `keys` true / false (default false) |
| `keys` | `notes` | `fingers`, `names`, `caption` | 1–12 pitches like `C4 F#3 Bb4` (capital letter, one-digit octave); `fingers` one per note, 1–5 or `-` |
| `animation` | `src`, `alt` | `caption` | as `image`, also `.mp4 .webm` |
| `step` | `id`, `title`, `activity` | `doneWhen`, `target`, `about`, `optional` | `activity` an activity's id (letters, digits, `-`, `_`) or one written out (§8b, its id `<lesson>.<step>`); `target` below |
| `tip` | `text` | `label` | `label` default "Tip" |
| `read-watch` | `text`, `youtube`, `title` | `start`, `end`, `caption` | `text` as a text block; the video fields as a video block's |
| `keyboard` | `keys` | `groups`, `names`, `fingers`, `hide`, `play`, `tempo`, `find`, `caption` | `keys` a range "C3-B4" (white keys at both ends, on the piano); `groups` true / false (default true); `names` true (octave labels, the default) / false / `"letters"` (every white key's letter); `fingers` a finger map as an activity's (§8b), shown on the keys, and with `"letters"` a **Finger numbers \| Key names** switch opening on the numbers; `hide` true (with `"letters"`): a Hide names / Show names button; `play` up to 32 pitches on its keys ("E4 D4 C4"): a ▶ Hear it, each key lit as it sounds, at `tempo` (default 100); `find` true (all seven letters) or letters ("F A B", two or more, each on its keys): **Find a key** (below) |

**The keyboard block's Find a key** (owner's lesson 2 spec, 2026-10-18; `lesson/blocks.ts`): the names hidden and "Find F"
above the keys, the letters in a random order, each once before any comes again and never one twice running. The right
key (any key of that letter; on a MIDI keyboard any octave) lights green, "✓ That's F", and the next letter comes after a
moment; a wrong key sounds and is named ("That's D. Find F."; a black key "a black key", their names not taught yet) and
the prompt stays. **Show me** outlines every key of that letter until a key is pressed; **Stop** brings the names back.
Endless; nothing judged, saved or ticked: it isn't a step. Hear it on any page keyboard stops a playing mini score, and
the other way round; leaving the page stops it.

`target` by its activity's screen, one or both fields: score `onTime` (0.05–1) and `bpm` (a whole number, 20–300);
drills `clean` (whole, 1–100); simon `chain` (whole, 5–100: owner, 2026-10-17, every Simon at least 5); lab `cleanRounds` (whole, 1–40; not a lead activity).

**Checked** (strictly, as activities are): an unknown kind or field, a missing field, raw HTML, a link that is not https,
a file outside the folder or of the wrong type, a video link that is not YouTube or ends before it starts, a video `size` other than `"row"`, a score with
two sources or more than 16 bars, keys that are not pitches or fingers that are not one a note, a step id used twice in
a lesson, a written-out activity with a mistake, a target its screen cannot judge (or of another screen, or out of range);
a lesson id in two rungs, unknown index fields. A lesson that cannot be read is left out and its reason shown on Path.
`npm run check:path` also finds every piece a score block or a step names (the app's scores, or a catalogue piece by
its `u-` id in `catalogue/index.json`) with its bars inside it (`tests/named-pieces.mjs`), and (2026-10-15) every set and
chart a step names, and a score block's set item in its set: the reader itself takes any item number (one the set lacks
is said only when the page draws the block: "the set … has no item n") and any set or chart name (said only when the
step is started).
Lessons and rungs titled "Test:" are placeholders for checking the app, not teaching. **Test rungs out of the learner's
way** (2026-10-16): a rung marked `"test": true` is left out of the path the learner sees (Path, Home, Switch…, a lesson
page or step opened by its address says there is no such lesson), and its lessons are not fetched; the checks see it
as before, because `tests/browser.mjs` sets `window.__pianoTestContent = true` before the app starts in every context
it makes (`lesson/path.ts` `showTestContent`, `lesson/read.ts` `shownIndex`), and `check:path` reads the files
directly. A learner whose saved lesson (`current` in `piano-web.path.v1`) is a hidden one is placed as with none chosen:
the first lesson with steps to do, so the first real lesson for a new learner; the saved progress is not touched, so
the flag set again shows it as it was. check:path requires every "Test:" rung to be marked. **Promoting** a catalogue piece a
lesson leans on into the app's own scores, with its notes checked, is Claude's procedure in §5c.
The test rung's "Test: a piece from the catalogue" (`test-catalogue-piece`) has one step naming the catalogue's
"Mary Had A Little Lamb" (`u-de5f6a78874c`: CC0, piano on two staves, 8 bars, chosen as a short piano piece): a
placeholder for the checks, saying nothing about the music.
The test lesson "Test: lesson 1's new pieces" (`test-lesson1-caps`, 2026-10-17) holds a Read / Watch block, a keyboard,
Simon at keys-no-music with a goal of 6 on every key of an octave, Simon by ear with a goal of 5, and finger-number cards,
for check:browser `--only lesson1caps`.
The test lesson "Test: the walk-through's new pieces" (`test-walkfix`, 2026-10-16) holds a find-it step, a fingers step, a Free play step with a click, the steady beat at help 0 and Simon by ear, for check:browser `--only walkfix`.
The test lesson "Test: the Minuet's opening" ends with two video rows (the same public video as its full-size video,
from 2:00 and from 4:00): placeholders for the row checks.

**Adding a block kind:** its fields in `read.ts` (`BLOCKS` and `readBlock`), its drawing in `blocks.ts` (`DRAW`: the one
place that maps a kind to its drawing), a case in `tests/path.mjs`, and a line here.

## 9. Not built yet

The library's next parts (§5c): difficulty (on hold: the estimator's check failed, the owner decides), later the phone folder (a few big zip files) and the Shelf; history /
projects (the owner will explain);
the accompaniment lab's lead sheets and several-part files (§5b); sight-reading tools; generated
drill cards of notes (rhythm cards are generated: §4, §6). A setup tour: not wanted (owner, 2026-10-15: hints at the moment and a help page instead, §7d).
