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

After a step you see how it went this time and, after earlier tries, your best so far. **Hard**, **OK** or **Easy** and a note are up to you. The bottom bar has Again, Lesson and the way on.

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
- **Play along:** at tempo, the piano playing the hand you don't. At the end, a summary: how many notes were on time, early, late or missed, and the weak bars to loop. Round a loop, a line after each pass instead.
- **Ladder:** Play along round a loop (it asks for the bars first). A clean pass goes a little faster, a messy one a little slower, never past the written tempo.
- **Rhythm:** any key counts: play the rhythm only.

## Starting and stopping
- Press ▶, or (not in Watch) just play your first note.
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
- **Hear:** a tap plays the bar you are on; held, everything you are learning.
- Tap a covered bar to start your turn there. ‹ › change chunk.
- A learned chunk asks how to join it up. When every bar is learned, **Test** has you play the whole piece from memory.
- **Settings:** hands, tempo, chunk size, playing in time, and more. Opening it during your turn pauses it.

# Simon {#simon}
A memory game. The app gives you a chain (notes, chords, intervals…), and you play the whole chain back. Each round it grows by one, until your misses run out.

- Press **Start**, or play any key.
- A miss names what was due and what you played (the wrong key shows red on the keys). It costs a try, the game, or nothing, as Level says.
- **Level:** how much help (1 music, sound and keys lit … 5 by ear), what must match, what a miss costs, the speed. Opening it pauses the game.
- You can play on the keys on the screen or on a MIDI keyboard. With *Nothing* under the music (help 2 to 5), play on a MIDI keyboard.
- **Simon ▾** switches to Drills, with the same set.

# Drills {#drills}
Flashcards. Each card is one short thing to play at once: music to read, a name, or something to play back by ear.

- Press **Start**. A card with rhythm starts after a bar of clicks (or on your first note, as Level says; by ear, always on your first note) and is judged in time. One without rhythm is judged on its notes, or in steady beats if its set says so. With On time: *Notes only*, every card is judged on its notes.
- A right card moves on by itself. A card with slips shows them; then **Again** or **Next**.
- **Hear it** and **Show me** help, but the card then doesn't count as clean.
- At the end: each card's result, the misses again, or a new set.
- Play on a MIDI keyboard, or tap the keys on the screen (Level → Under the music: Keyboard). With neither, Ready says so.
- **Level:** help, how a card starts, the metronome, On time, cards per set, tempo. Opening it pauses the card.
- **Drills ▾** switches to Simon, with the same set.

# The accompaniment lab {#lab}
Play with a band: the lead on top, or the chords underneath.

- First choose **Lead** (improvise on top) or **Accompaniment** (the chords). Then a step: the one you were on is chosen, and you can tap another. One sentence says what your part is and what the band plays.
- **▶ Start** gives a bar of count-in, then the band plays round after round until ■.
- The keys to use light up. In Accompaniment, the Help choice at the bottom can name the notes instead, or show the chord symbol only.
- **Show me first** (Accompaniment) plays one round with your part played for you.
- After ■: how the last round went; the next step once this one has its rounds (two, unless the chart says otherwise: clean ones, or in Lead, played ones); and in Accompaniment, the bars that went wrong to loop.
- Stopped, tap bars in the box of chords to loop them.
- **⚙:** which band parts play, the click, and drop-outs. Opening it while the band plays pauses that round; it starts again with a bar of count-in when you close it.

# Free play {#freeplay}
Play anything and see what it is. The keys you play light up and are named, with the chord or interval they make.

Below, what you played lately, newest on top: chords, notes and intervals. **Show** turns those columns on or off. ‹ › move the keys an octave. Nothing is judged or kept.

# The metronome {#metronome}
The click on its own, with no score.

- Set the tempo with −5 and +5, the slider, or **Tap tempo**.
- Choose the beats in a bar (the first is accented) and the sound.
- **▶ Start** and **■ Stop**. Your keyboard's highest key starts it and its lowest key stops it, once learned in Settings → Keyboard controls.
- Its volume is the click volume in Settings.

# Practice and Exercises {#practice}
Practice lists the tools: Exercises, Drills, Simon, the accompaniment lab, Free play and the metronome.

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
- **Keyboard controls:** learn your keyboard's lowest and highest key, so they work as buttons (back and start); a mash of keys stops.
- **Look:** Light, Auto (as the phone is) or Dark.
- **Your data:** export the practice log, back up your settings, progress and library to one file and restore it, and what is saved for offline.
- **Help:** this page, and Show tips again.

A piece's own choices (size, tempo, hands, fingering) stay on its screen.

# Installing and offline {#install}
Install the app (in Chrome: menu ⋮ → Install app, or the card on Home) to keep your files and play offline.

- The installed app saves everything it needs the first time it opens online. After that it works offline.
- In a browser tab nothing extra is saved, and the browser may clear files you added when the phone runs low on space.
- Back up from Settings to keep a copy of your settings, progress and files.
