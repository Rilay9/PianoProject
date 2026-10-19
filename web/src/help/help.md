// How the app works: Settings → "How the app works", and each screen's "How this screen works" (src/help/page.ts).
// One section a screen. A section starts with "# Title {#id}"; the ids the app opens are listed in src/help/read.ts
// (HELP_IDS), and `npm run check:content` reads this file and finds each one. The text under a title is the lessons'
// small text format: paragraphs, ## headings, "- " lists, **bold**, *italics*, [links](https://…); never HTML.
// Write what is true of the app now (docs/app-features.md is the reference): plain short sentences, what the screen is
// for, how to use it, and the gestures nothing on screen shows. Change this file in the same commit as the feature.

# Home {#home}
Where the app opens. **Up next** is the lesson you are on and its next step: **Start ▶** opens that step, and when you finish you come back to the lesson page.

Then come the lesson's steps (tap one to start it), and what you practised lately (tap one to carry on; a piece opens as you last played it). With no lesson, **Carry on** reopens the last thing you practised.

- ⚙ at the top opens Settings.
- The tabs (at the bottom, or down the left side sideways and on a tablet) are Home, Music, Practice and Path.
- In a browser tab, a card offers to install the app. ✕ hides it for good.

# Path and lessons {#path}
Path lists the rungs and their lessons. Tap a lesson to open its page.

A lesson page holds text, pictures, videos, little scores (▶ Hear it plays one) and practice steps. Each step has **Start ▶** (**Again ▶** once done); no step is locked. The bar at the bottom starts the first step not done.

Videos to watch for more are listed at the end of a lesson, under **Videos**: tap one to play it there, and **✕ Close** folds it back. Offline, each shows a link to watch it later.

A step opens its screen with the step's task on a line at the top. If you change what the step set (its set, help level, mode, hands, bars…), the line says **Practice now: not counted for the step** until you change it back. When the step's set, game or run ends, **Back to the lesson ▶** takes you to how it went; with a MIDI keyboard, a key does it too.

After a step you see how it went this time and, after earlier tries, your best so far. **Hard**, **OK** or **Easy** and a note are up to you. The bottom bar has Again, Lesson and the way on; once your keyboard's lowest and highest keys are set up (Settings → Keyboard controls), the highest key is Next and the lowest Again.

A step with nothing to judge (Free play, or listening in Watch) counts as visited once you have played a key there, or heard the music to its end.

**Switch…** picks another lesson. Back or ← takes you back the way you came.

# The score {#score}
For reading and playing a piece, with what comes next always in view.

## The bars
- At the top: ← back, ⓘ about this song (where it came from, its licence), **Display** (how the music looks), ⋯ (Memorise, Edit fingering, Export, this help).
- At the bottom: ▶, the mode, **Loop**, the tempo (♩: it opens Tempo and sound), the hands, and the size (A− A+).
- **Hands:** in Watch, *Piano:* L R Both Off are the hands the piano plays. In the other modes, *You:* they are the hands you play, and the piano plays the rest. Off means you play everything and the piano is silent.

## The modes
- **Watch:** the app plays it; follow the marker.
- **Wait for me:** it waits for your notes; no clock. The piano plays the other hand up to your next note.
- **Play along:** at tempo, the piano playing the hand you don't. At the end, a strip at the bottom says how many notes were on time, early, late or missed, with the weak bars to loop, and the slips are marked on the music: grey (ringed) missed, orange early, late or let go early. Round a loop, a line after each pass, and the last pass marked when you stop. A key (or **▶ Again**) starts the next run; ✕ puts the strip away.
- **Ladder:** Play along round a loop (it asks for the bars first). A clean pass goes a little faster, a messy one a little slower, never past the written tempo.
- **Rhythm:** any key counts: play the rhythm only.

## Starting and stopping
- Press ▶, or play a key: your first note starts it and counts; another key starts it as ▶ does.
- While it plays, the bars fade. **A tap on the music stops** and brings them back.
- Play along, Ladder and Rhythm pause by themselves after a few seconds without keys, when you press lots of keys at once, and when the phone turns. Play to carry on, or tap **See how it went**.

## Moving around (stopped)
- A tap on the music shows or hides the bars.
- **Long-press a note** to move the marker there.
- Upright and on a tablet, **swipe up or down** to look further ahead; the marker stays. Sideways, drag the line.
- **Loop:** tap Loop, then tap the first bar and the last bar (or the same bar twice for one bar). Tap Loop again to end it.

## A keyboard or the screen
Play along, Ladder and Rhythm listen to a MIDI keyboard. Wait for me can also be played on the keys under the music. On a phone held sideways those keys are hidden unless you show them in **Display**.

# Memorise {#memorise}
For learning a piece by heart, a few bars at a time. Open it from the score's ⋯ (Memorise this piece) or from a piece's page in Music.

It plays a bar, then covers it, and you play it from memory. Your first note starts your turn. New bars are added one at a time, chunk by chunk.

- **Stuck?** Hold **Peek** to uncover the bars while you hold it. When it waits for you (not in time), after 3 seconds the next note lights up on the keys, or is named if no keys show. Either counts as a slip.
- **Hear it:** a tap plays the bar you are on; held, everything you are learning.
- After a pass with slips, they are marked: grey (ringed) missed, orange off time or let go early, wrong keys red on the keys.
- Tap a covered bar to start your turn there. ‹ › change chunk.
- A learned chunk asks how to join it up. When every bar is learned, **Test** has you play the whole piece from memory.
- **Settings:** hands, tempo, chunk size, playing in time, and more. Opening it during your turn pauses it.

# Simon {#simon}
A memory game. The app gives you a chain (notes, chords, intervals…), and you play the whole chain back. Each round it grows by one, until your misses run out.

- Press **Start**, or play any key.
- A miss names what was due and what you played (the wrong key shows red on the keys and the right one outlined in blue; at help 0 it shows them on the keys only). It costs a try, the game, or nothing, as Level says.
- **Hear it** plays the chain again (it then can't be a best). A mash of keys ends the game, showing how far it got.
- **Level:** how much help (0 keys and sound, with no music … 5 by ear), what must match, what a miss costs, the speed. Opening it pauses the game.
- **0 Keys + sound, no music** is for before you read music: you hear each item and see its keys light up, and no notes are written or named anywhere. Copy what you see and hear. A miss shows the wrong key in red and the right one outlined in blue. From 1 on, the music is shown too.
- You can play on the keys on the screen or on a MIDI keyboard. With *Nothing* under the music (help 2 to 5), play on a MIDI keyboard.
- **By ear (help 5):** a miss plays the note again: try other keys until one matches. Nothing is named or shown, and a miss costs nothing; a chain found by trying is good practice, not a best.
- **Simon ▾** switches to Drills, with the same set.

# Drills {#drills}
Flashcards. Each card is one short thing to play at once: music to read, a name, or something to play back by ear.

- Press **Start**. A card with rhythm starts after a bar of clicks (or on your first note, as Level says; by ear, always on your first note) and is judged in time. One without rhythm is judged on its notes, or in steady beats if its set says so. With On time: *Notes only*, every card is judged on its notes. A card judged on its notes waits for you; after 8 seconds with no key its next notes light up (counted as help), time enough to read it (Memorise's hint, from memory, comes after 3).
- A right card moves on by itself. A card with slips shows them, with a one-line key: grey (ringed) missed, orange early, late or let go early; on the keys, a wrong key red and a missed one outlined in blue. Then **Again** or **Next** (a key goes on too).
- **Hear it** and **Show me** help, but the card then doesn't count as clean.
- At the end: each card's result, the misses again, or a new set.
- Play on a MIDI keyboard, or tap the keys on the screen (Level → Under the music: Keyboard). With neither, Ready says so.
- **Level:** help, how a card starts, the metronome, On time, cards per set, tempo. Opening it pauses the card.
- **Help 0, Keys + sound, no music:** each card is played to you with its keys lit, and no music is written, even after the card: the keys show what was wrong (red) and what was missed (outlined in blue).
- From the second card of a set, a key or a tap while a card is played to you skips to its count-in.
- When your taps get steadily faster or slower through a card, the result says **You sped up** or **You slowed down**.
- **Rhythm cards at help 0** (no music): the result shows your taps on a line of beats, each one where it landed, ahead of or behind its click.
- **Find it** cards name a place on the keys in words ("a group of three, higher up"): play any key of that group. Show me outlines it.
- **Reading cards:** a card of music to read is shown straight away; your first note starts it. Notes you've played turn green and the next is blue. A wrong key is named at once with the note it should be and where it sits ("That's D · This note is F: on the 4th line up of the bass staff"), and that note's letter shows in its head, in orange; a second miss on it outlines its key. After the card every note has its letter. **Hear it** shows the letters (and chord names) while it plays; they go when you start, and a key stops it to play.
- **Single notes** and **Intervals** sets deal one note or two at a time, as long as you like (**Keep going** at the end).
- **📖** opens Look it up: every line and space of both clefs, landmarks, hand positions, intervals, chords, note values, sharps and flats.
- **Drills ▾** switches to Simon, with the same set.

# The accompaniment lab {#lab}
Play with a band: the lead on top, or the chords underneath.

- First choose **Lead** (improvise on top) or **Accompaniment** (the chords). Then a step: the one you were on is chosen, and you can tap another. One sentence says what your part is and what the band plays.
- **▶ Start** (or a key) gives a bar of count-in, then the band plays round after round until ■.
- The keys to use light up. In Accompaniment, the Help choice at the bottom can name the notes instead, or show the chord symbol only.
- **Show me first** (Accompaniment) plays one round with your part played for you.
- After ■: how the last round went, each bar marked with a sign as well as a colour (✓ right, ~ early or late, – a note missing, ✗ a wrong key); the next step once this one has its rounds (two, unless the chart says otherwise: clean ones, or in Lead, played ones); and in Accompaniment, the bars that went wrong to loop. A key does the main button.
- Bars are right when their chord lands within about 150 ms of the beat (a chord is judged more loosely than a single note on the score).
- Stopped, tap bars in the box of chords to loop them.
- **⚙:** which band parts play, the click, and drop-outs. Opening it while the band plays pauses that round; it starts again with a bar of count-in when you close it.

# Free play {#freeplay}
Play anything and see what it is. The keys you play light up and are named, with the chord or interval they make.

Below, what you played lately, newest on top: chords, notes and intervals. **Show** turns those columns on or off, and the black keys' groups (outlined, 2 and 3). ‹ › move the keys an octave; the small piano above the keys shows which part of the whole keyboard you see. A lesson step can show finger numbers on the keys, or turn on a click (its button turns it off). Nothing is judged or kept.

# The metronome {#metronome}
The click on its own, with no score.

- Set the tempo with −5 and +5, the slider, or **Tap tempo**.
- Choose the beats in a bar (the first is accented) and the sound.
- **▶ Start** and **■ Stop**. Your keyboard's highest key starts it and its lowest key stops it, once learned in Settings → Keyboard controls.
- Its volume is the click volume in Settings.

# Practice and Exercises {#practice}
At the top, **This week** lists your lesson's drills: one tap goes straight in (it counts for the lesson), the one you played last first. Below, Practice lists the tools: Look it up, Exercises, Drills, Simon, the accompaniment lab, Free play and the metronome. **Look it up** (also 📖 on the exercise screens) has pictures of every line and space of both clefs, landmarks, hand positions, intervals, chords, note values and sharps and flats; tap a picture to hear it.

**Exercises** lists every exercise by kind; the chips at the top filter them. One tap opens an exercise its usual way: cards in Drills or Simon, music on the score. Inside, ▾ next to Drills or Simon switches the way.

Memorise stays with each piece: Music → a piece → Memorise.

# Music {#music}
Everything you play from: the app's own pieces and chord charts, and files you add.

- **Yours:** search, filter with the chips, sort. Upright, tap a piece to open it, and ⋯ for its page (its facts and tags; Memorise for a score; Rename, Replace file, Export and Delete for a file you added). Sideways and on a tablet, the list is on the left and the page on the right. ♡ marks a favourite.
- **+ Add** takes MusicXML, MXL, MIDI and PDF files. A MIDI file first shows what was read and what was guessed (hands, tempo, key), with Swap hands.
- **Catalogue:** about 1,600 piano pieces and lead sheets from PDMX. + Add keeps one as yours.
- **Full PDMX:** the whole PDMX set, once you copy its zip files to the phone; the tab shows the steps. **Open** plays a piece without adding it; **+ Add** keeps it.
- A PDF opens in the PDF reader; a chord chart in the lab.

# The PDF reader {#pdf}
For reading your own PDF scores at the piano, a line at a time. Nothing is judged.

- Two lines show: the one you are on (marked at its left) and the next.
- **Turn:** tap the **lower half** of the music for the next line, the **upper half** to go back. Or ◀ ▶, a page-turner pedal, or your keyboard's highest key (next) and lowest key (back), once learned in Settings → Keyboard controls.
- A−/A+ set the size.
- **Adjust lines** fixes where the lines and their split points are.
- **⚙:** whole lines or split lines, for this piece, and whether this piece uses the keyboard's lowest or highest key (then they don't turn).

# Settings {#settings}
The app's own settings, from ⚙ on Home.

- **Sound:** where the piano plays (the phone or your MIDI keyboard), the piano and click volumes, the click sound.
- **Keyboard controls:** learn your keyboard's lowest and highest key, so they work as buttons (back and start); a mash of keys stops. The first time a MIDI keyboard connects, the app offers to set them up there and then.
- **Look:** Light, Auto (as the phone is) or Dark.
- **Your data:** export the practice log, back up your settings, progress and library to one file and restore it, and what is saved for offline.
- **Help:** this page, and Show tips again.

A piece's own choices (size, tempo, hands, fingering) stay on its screen.

# Installing and offline {#install}
Install the app (in Chrome: menu ⋮ → Install app, or the card on Home) to keep your progress and the pieces you add safe on this device, and to play offline.

- The installed app saves everything it needs the first time it opens online. After that it works offline.
- In a browser tab nothing extra is saved, and the browser may clear files you added when the phone runs low on space.
- Back up from Settings to keep a copy of your settings, progress and files.
