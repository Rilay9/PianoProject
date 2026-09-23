/**
 * What every mode, drill and tool is, in the learner's words — one table.
 *
 * The owner, 2026-09-22: *"there's not enough context or explanation given in
 * the modes and exercises. There's gotta be a better way to tell the user
 * what's going on, what they're supposed to do, what they can do, and what's
 * available."*
 *
 * Four questions, and every practising screen answers all four:
 *
 *  1. **What is this?**        `what`      — the thing in one line.
 *  2. **What do I do now?**    `now`       — one line, before anything has
 *                                            happened. The run replaces it
 *                                            while it is going, from the same
 *                                            signals the cues use; this is the
 *                                            sentence the screen opens on.
 *  3. **What can I do here?**  `controls`  — the controls that matter, one
 *                                            line each, and what each says back.
 *  4. **What else is there?**  `elsewhere` — where this fits, and what its
 *                                            neighbours are.
 *
 * One table rather than a sentence beside each markup, because a sentence
 * beside markup is copied into the spec and then changed in one of the two
 * places. `LAB_HELP` in `engine/sightReading.ts` is the same shape for the
 * lab's ten controls and is the pattern this follows (Entry 30); `04` §5f
 * prints this table and `help.test.ts` is the join.
 *
 * **Voice**: a teacher at the piano beside you. Short, concrete, second person
 * where it tells the learner to do something, no word a Stage 0 learner has
 * not met, and the one name `04` §5 gives the thing — *Wait for me*, never
 * "Wait mode".
 */
import type { DrillKind } from '../engine/drills/types';

/** One control, and what it says back. */
export interface HelpControl {
  /** Exactly the words on the control, so the line can be read beside it. */
  readonly name: string;
  /** What it does, and what happens when you press it. */
  readonly does: string;
}

export interface HelpEntry {
  /** The one name for this thing, as `04` gives it. */
  readonly title: string;
  /** Question 1. */
  readonly what: string;
  /** Question 2, before the run starts. */
  readonly now: string;
  /**
   * What counts here — the third line of the first-sight card.
   *
   * A learner's first question after "what do I do" is "and does this go on my
   * record?", and it has a different answer on nearly every screen: a Keep
   * tempo run can pass a rung, a lab loop is not recorded at all, Show me
   * costs the card it is pressed on.
   */
  readonly counts: string;
  /** Question 3. */
  readonly controls: readonly HelpControl[];
  /** Question 4. */
  readonly elsewhere: string;
}

/**
 * The ways a piece can be open on the Score screen.
 *
 * The first four are the mode selector at the top of the screen. The last
 * three sit alongside a mode rather than replacing one — a blind run is still
 * a *Wait for me* or *Keep tempo* run — and they are here because each changes
 * what the learner is being asked to do, which is the question this table
 * answers.
 */
export type ScoreMode = 'wait' | 'tempo' | 'listen' | 'free' | 'rhythm' | 'blind' | 'perform';

/** The practising tools that have a route of their own. */
export type ToolKey = 'lab' | 'chart' | 'play' | 'metronome' | 'paper' | 'pdf';

/**
 * The four modes at the top of the Score screen, and the three that sit
 * alongside them.
 *
 * Exhaustive by type: a mode added without a row here does not compile.
 */
export const MODE_HELP: Readonly<Record<ScoreMode, HelpEntry>> = {
  wait: {
    title: 'Wait for me',
    what: 'The page holds still until you play the right note, for as long as you like.',
    now: 'Play the first note. Nothing moves until you do.',
    counts: 'A run in this mode is practice: it is recorded, but a pass for the rung is measured in Keep tempo.',
    controls: [
      { name: 'Hear it', does: 'Plays the piece to you. Nothing is judged while it plays.' },
      { name: 'Hands', does: 'Which hand the app waits for. The phone can play the other one.' },
      { name: '⋯', does: 'The settings you change once: the metronome, the input, how much music is on the screen, the keys underneath.' },
      { name: '← Back', does: 'Leaves the piece. A run you were part way through is offered again when you come back.' },
    ],
    elsewhere: 'The mode for the first time you meet a piece. When the notes are under your fingers, Keep tempo is the one that scores.',
  },
  tempo: {
    title: 'Keep tempo',
    what: 'A click and a moving cursor that carry on whether you keep up or not, and mark what you miss.',
    now: 'The count-in clicks, then play along.',
    counts: 'A pass needs both the accuracy and the share of the written tempo set in Settings, in one run.',
    controls: [
      { name: 'Tempo', does: 'A share of the written speed. Slower is how a hard bar becomes an easy one.' },
      { name: '▶', does: 'Starts the run. With a piano connected your own first note starts it instead, and the clock waits for it.' },
      { name: 'Loop', does: 'Repeats a few bars until they are yours. Double-tap two bars on the sheet to mark them.' },
      { name: 'Metronome', does: 'The click, on or off. Turn it off to play against silence.' },
      { name: '⋯', does: 'Rhythm only, Ladder, Duet, Blind and Perform, and the settings you change once.' },
    ],
    elsewhere: 'This is the mode a pass is measured in. Wait for me is where a piece is learned first; Play it to me is where you hear what you are aiming at.',
  },
  listen: {
    title: 'Play it to me',
    what: 'The app plays the piece while you watch and listen. Nothing you play is judged.',
    now: 'Press Hear it and follow the cursor.',
    counts: 'Nothing is counted here: you are listening, not playing.',
    controls: [
      { name: 'Hear it', does: 'Starts and stops the playing.' },
      { name: 'Tempo', does: 'Slows the playing down so you can see what the hands are doing.' },
      { name: 'Hands', does: 'Plays one hand only, so you can play the other one over it.' },
    ],
    elsewhere: 'Use it before the first read, or when a bar will not come right. Long-pressing one bar on any mode plays that bar alone.',
  },
  free: {
    title: 'Free play',
    what: 'The page turns on your own notes and nothing is judged, counted or recorded.',
    now: 'Play. The page follows you; nothing is marked.',
    counts: 'Nothing is counted, recorded or marked.',
    controls: [
      { name: 'Hands', does: 'Which hand the page follows.' },
      { name: '⋯', does: 'The metronome, the keys under the score, and how much music is on the screen.' },
    ],
    elsewhere: 'For improvising over a piece, or just playing it. Nothing from a free run reaches Progress; Keep tempo is what records a run.',
  },
  rhythm: {
    title: 'Rhythm only',
    what: 'A Keep tempo run judged on your timing alone: the notes are not looked at.',
    now: 'Tap the rhythm on any key at all.',
    counts: 'It is counted as a rhythm run, and never as playing the piece.',
    controls: [
      { name: 'Metronome', does: 'The click to tap against. One tap for each written note or chord; extra keys are wrong.' },
      { name: 'Tempo', does: 'How fast the written rhythm goes past.' },
      { name: '⋯', does: 'Turns Rhythm only off again, and holds the rest of the settings.' },
    ],
    elsewhere: 'Its summary is headed Rhythm run and never counts as playing the piece. Turn it off and the same run judges the notes as well.',
  },
  blind: {
    title: 'Blind',
    what: 'The same run with the notation hidden, so you play from memory.',
    now: 'Play from memory. It is still being marked.',
    counts: 'It counts exactly as the same run would with the notation showing.',
    controls: [
      { name: '⋯', does: 'Shows the score again. Nothing else about the run changes.' },
    ],
    elsewhere: 'It is scored exactly as a sighted run, so a blind pass counts for the rung. It sits alongside Wait for me and Keep tempo rather than replacing either.',
  },
  perform: {
    title: 'Perform',
    what: 'One pass from start to finish: no restarts, no loop, and it is kept on its own list.',
    now: 'One run through. There is no going back.',
    counts: 'It is kept as a performance, on its own list, however it went.',
    controls: [
      { name: '⋯', does: 'Stops performing and goes back to practising.' },
    ],
    elsewhere: 'Performances are listed on their own in Progress, apart from practice runs. Practise the piece in Keep tempo first.',
  },
};

/**
 * Every drill kind, in the learner's words.
 *
 * Exhaustive by type: a `DrillKind` added without a row here does not compile,
 * which is the same guard `STAFF_POLICY` uses one file over.
 *
 * `now` is what the card says before it has asked anything. Once a card is up,
 * the screen's own `howText` says how to answer *this* card — how many notes,
 * in what order — and the strip follows it, because a count that changes per
 * card cannot live in a table.
 */
export const DRILL_HELP: Readonly<Record<DrillKind, HelpEntry>> = {
  'note-flash': {
    title: 'Note flash',
    what: 'A note on the staff, one at a time, for you to play on the piano.',
    now: 'Play the note that is on the staff, in any octave.',
    counts: 'Your score is the share of cards you get right. Asking to be shown the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the answer on the keys. This card then does not count as right.' },
      { name: 'Skip', does: 'Leaves this card unanswered and brings the next one.' },
      { name: 'End drill', does: 'Stops here. Nothing is recorded unless you keep it.' },
    ],
    elsewhere: 'Find the key is the same fact the other way round: a name to find on the keyboard. Both are on the Skills screen under reading.',
  },
  'find-key': {
    title: 'Find the key',
    what: 'A note name, for you to find on the piano without counting up from a landmark.',
    now: 'Press that key, on the piano or on the keys below.',
    counts: 'Your score is the share of cards you get right. Asking to be shown the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the key. This card then does not count as right.' },
      { name: 'Skip', does: 'Leaves this card and brings the next.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Note flash is the same fact read off the staff instead. Both sit on the reading skill in Skills review.',
  },
  chord: {
    title: 'Chord drill',
    what: 'A chord named in words — C major, A minor — for you to play.',
    now: 'Play all the notes of the chord together, in any octave.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the notes on the keys and writes them on a small staff. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays the chord. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The inversion drill asks for the same chord with a different note at the bottom; Chords with more notes add a fourth. Every chord card shows you the chord on a staff once it is judged.',
  },
  inversion: {
    title: 'Inversion drill',
    what: 'The same chord with a different note at the bottom — first, second or root position.',
    now: 'Play the three notes together, with the one it names at the bottom.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the shape on the keys. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays it. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The chord drill is the same chords in root position. Inversions are what let one hand move between chords without jumping.',
  },
  'ear-interval': {
    title: 'Ear drill — intervals',
    what: 'Two notes played to you, for you to play back — the gap between them is what is being trained.',
    now: 'Listen, then play the two notes back.',
    counts: 'Your score is the share of cards you get right. Playing it again costs nothing; being played the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Plays it again, as often as you like. It costs nothing.' },
      { name: 'Hear it', does: 'Plays the answer. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The chord and progression ear drills are the same ear on more notes at once. Simon is the one with nothing to choose between.',
  },
  'ear-chord': {
    title: 'Ear drill — chords',
    what: 'A chord played to you, for you to play back.',
    now: 'Listen, then play the chord back.',
    counts: 'Your score is the share of cards you get right. Playing it again costs nothing; being played the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Plays it again, as often as you like.' },
      { name: 'Hear it', does: 'Plays the answer. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The chord appears on a staff as soon as it is judged, right or wrong, so you can see what you heard. The progression ear drill strings several together.',
  },
  'ear-progression': {
    title: 'Ear drill — progressions',
    what: 'A few chords in a row played to you, for you to play back in order.',
    now: 'Listen, then play the chords back in the order you heard them.',
    counts: 'Your score is the share of cards you get right. Playing it again costs nothing; being played the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Plays the whole progression again.' },
      { name: 'Hear it', does: 'Plays the answer. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'It is written out on a staff once judged, one chord to the bar. Roman numerals is the same progression named rather than played.',
  },
  rhythm: {
    title: 'Rhythm drill',
    what: 'A written rhythm, for you to tap against the click on any key at all.',
    now: 'Tap the rhythm on any key. Your first tap starts it.',
    counts: 'Your score is how close your taps were to the written rhythm. Which key you tap does not matter.',
    controls: [
      { name: 'Done', does: 'Ends this card when you have finished tapping it.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Rhythm only, on the Score screen, is the same idea over a real piece. Nothing here looks at which key you tap.',
  },
  pedal: {
    title: 'Pedal-change drill',
    what: 'Chords to play with the sustain pedal, changing it cleanly between them.',
    now: 'Play the first chord and put the pedal down. Changes are marked from the second chord on.',
    counts: 'Your score is the share of changes that were clean. It needs a pedal on a piano over its cable.',
    controls: [
      { name: 'Next', does: 'Moves to the next change when you are ready.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'It needs a pedal on a piano over its cable: the screen keys cannot send one. Half pedal is measured where the pedal sends more than off and on.',
  },
  dynamics: {
    title: 'Dynamics drill',
    what: 'A phrase to play softly and then loudly, with the difference measured.',
    now: 'Play the phrase at the volume it asks for.',
    counts: 'Your score is how far apart the loud and the soft were, against what the card asked for.',
    controls: [
      { name: 'Next', does: 'Moves on when you have played it.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'It needs a piano over its cable: every note from the screen keys arrives at the same volume, and the card says so rather than marking you down.',
  },
  'call-response': {
    title: 'Play it back',
    what: 'A short phrase played to you, for you to play back by ear.',
    now: 'Listen, then play it back.',
    counts: 'Your score is the share of phrases you play back right. Asking to be shown the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Repeats it, as often as you like.' },
      { name: 'Show me', does: 'Lights the notes on the keys. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The five-finger and accompaniment patterns are built this way too. Simon is the same thing growing a note at a time.',
  },
  'backing-track': {
    title: 'Backing track',
    what: 'A bass-and-drums loop to play over. Nothing you play is marked right or wrong.',
    now: 'Play over the loop. Nothing here is judged.',
    counts: 'Nothing here is counted: it is a loop to play over.',
    controls: [
      { name: 'Done', does: 'Ends the card when you have had enough.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The Accompaniment lab is the same idea with every setting in your hands — key, chords, both hands, tempo.',
  },
  mode: {
    title: 'Modes',
    what: 'A mode named — D dorian, G mixolydian — for you to play up the keyboard.',
    now: 'Play its notes from the bottom up, one at a time, at any speed.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the notes in order. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays it up. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Chord–scale asks for the same scales from a chord instead of by name. Both belong to the improvising tracks.',
  },
  'chord-scale': {
    title: 'Chord–scale',
    what: 'A chord, for you to play the scale that goes over it.',
    now: 'Play the scale that fits the chord, from the bottom up.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the scale. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays it. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Modes is the same scales asked for by name. This is the one you use while somebody else is playing the chord.',
  },
  'extended-chord': {
    title: 'Chords with more notes',
    what: 'Chords of four notes — sevenths and ninths — named for you to play.',
    now: 'Play every note of the chord together, in any octave.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights all four notes. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays the chord. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The chord drill is the three-note version. The chord is written on a staff as soon as it is judged, which is the quickest way to learn how one looks.',
  },
  'harmonic-dictation': {
    title: 'Harmonic dictation',
    what: 'A progression played to you, for you to play back as chords.',
    now: 'Listen, then play the progression back as chords.',
    counts: 'Your score is the share of cards you get right. Playing it again costs nothing; being played the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Plays the progression again.' },
      { name: 'Hear it', does: 'Plays the answer. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'It is written out on a staff once judged, one chord to the bar with its numeral above. Roman numerals asks for the same thing from the page instead of the ear.',
  },
  transposition: {
    title: 'Transposition',
    what: 'A phrase written in one key, for you to play in another.',
    now: 'Play the phrase in the key it names, reading from the notation.',
    counts: 'Your score is the share of cards you get right. Asking to be shown the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the notes in the new key. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'It is the reading drills and the chord drills used together, which is why it comes late in a track.',
  },
  'roman-numeral': {
    title: 'Roman numerals',
    what: 'A chord written as a numeral — I, vi, V7 — for you to play in the key given.',
    now: 'Play the chord the numeral names, in the key at the top of the card.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the chord. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays it. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Numerals are how the Accompaniment lab and the chord charts name chords, so this is the drill that makes both readable.',
  },
  'ear-tune': {
    title: 'Play back a tune',
    what: 'A short tune played to you, for you to find by ear.',
    now: 'Listen, then play the tune back.',
    counts: 'Your score is the share of cards you get right. Playing it again costs nothing; being shown the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Plays it again, as often as you like.' },
      { name: 'Show me', does: 'Lights the notes. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Play it back is the same ear on a phrase with no tune to recognise. Simon is the one that grows until you lose it.',
  },
  simon: {
    title: 'Simon',
    what: 'One note, then that note and one more, then three — a chain that grows until you break it.',
    now: 'Listen to the chain, then play it back in the octave you heard it.',
    counts: 'Your score is the longest chain you echoed. How much help you take does not change it.',
    controls: [
      { name: 'Keys shown / After a miss / Ear only', does: 'How much help the game gives. None of them changes the score.' },
      { name: 'End drill', does: 'Stops here. The score is the longest chain you echoed.' },
    ],
    elsewhere: 'Every other ear drill hands you a small set to choose between. This one asks you to have held what you heard, which is what playing by ear is.',
  },
};

/** The practising tools with a route of their own. */
export const TOOL_HELP: Readonly<Record<ToolKey, HelpEntry>> = {
  lab: {
    title: 'Accompaniment lab',
    what: 'A backing you write yourself: a key, some chords, a shape for each hand, and a tempo.',
    now: 'Pick a style to start from, then Read it or Jam it.',
    counts: 'Nothing in the lab is counted or recorded.',
    controls: [
      { name: 'Read it', does: 'Writes the settings out as a score and opens it on the Score screen.' },
      { name: 'Jam it', does: 'Plays them as a loop you can play over. Nothing is judged.' },
      { name: 'What the app plays', does: 'How much of it the app takes: the bed only, the chords, the tune, or turns with you.' },
    ],
    elsewhere: 'It is in the Library, beside Import a score and Score folder. The Play over the loop drill is the same idea with the settings already chosen.',
  },
  chart: {
    title: 'Chord chart',
    what: 'The same piece as a lead sheet: one big chord symbol a bar, a tracker that moves through the form, and a count-off.',
    now: 'Press Count off and play from the chords.',
    counts: 'Nothing here is counted: there is no right or wrong to mark.',
    controls: [
      { name: 'Count off ▶', does: 'Counts you in and starts the tracker. Pressing it again goes back to bar 1.' },
      { name: 'Bass + drums', does: 'Plays a rhythm section under you, or leaves you the room.' },
    ],
    elsewhere: 'For playing from the chords rather than reading the notes. The same piece opens on the Score screen from its row in the Library.',
  },
  play: {
    title: 'Free play',
    what: 'An empty screen that names what you are holding. Nothing is scored, counted or recorded.',
    now: 'Play anything. It names the chord under your hands.',
    counts: 'Nothing is counted or recorded.',
    controls: [
      { name: 'The keys', does: 'Work with no piano connected, so this is also how to try the app out.' },
    ],
    elsewhere: 'It is one of the doors on Today, beside the Metronome and the Accompaniment lab. Free play on a piece is the same idea with a page to turn.',
  },
  metronome: {
    title: 'Metronome',
    what: 'A click, on its own, with the first beat of each bar accented.',
    now: 'Set a speed and start it, or tap a few beats to set the speed by hand.',
    counts: 'Nothing is counted: it is a click and nothing else.',
    controls: [
      { name: 'Tap tempo', does: 'Takes the speed from four taps rather than a number.' },
      { name: 'Metronome sound', does: 'Use High when the microphone is listening: it sits above every piano note, so the detector can filter it out.' },
    ],
    elsewhere: 'Every practising screen has a click of its own, so this is for playing away from the app — scales, or a piece on paper.',
  },
  paper: {
    title: 'Practise from the book',
    what: 'A timer, a click and a count of what the app hears, for music it cannot see.',
    now: 'Open the book at the page, press play, and play. Nothing here says whether the notes were right.',
    counts: 'Minutes, notes heard and steadiness are recorded; whether the notes were right is your own verdict at the end.',
    controls: [
      { name: 'Play', does: 'Starts the click and the counting.' },
      { name: 'Rough · OK · Clean', does: 'Your own verdict at the end. It is the only judgement of the notes there is.' },
    ],
    elsewhere: 'It comes from a piece on your Shelf. If the same piece is in the app, link it as a twin and it can be played and scored properly.',
  },
  pdf: {
    title: 'PDF viewer',
    what: 'A bought score shown one line at a time, full width, so it is readable on a phone.',
    now: 'Tap the right half of the page for the next line, the left half to go back.',
    counts: 'Nothing here can be counted: a PDF is pages and not notes.',
    controls: [
      { name: 'Timed', does: 'Turns the lines on its own, learning the pace from your last two taps.' },
      { name: 'Adjust cuts', does: 'Drag the lines if the viewer split a page in the wrong place. The correction is kept with the score.' },
    ],
    elsewhere: 'A PDF is pages and not notes, so nothing in it can be listened to or scored. To have the app follow it, turn it into MusicXML on a computer and import that.',
  },
};

/** Every key this table answers. */
export type HelpKey = `mode:${ScoreMode}` | `drill:${DrillKind}` | `tool:${ToolKey}`;

/**
 * The entry for one key, or `undefined`.
 *
 * A lookup rather than a throw: a blank strip is a better failure inside a
 * render than an exception that takes the screen with it, and the keys are
 * typed, so a wrong one does not compile.
 */
export function help(key: HelpKey): HelpEntry | undefined {
  const [family, rest] = splitKey(key);
  if (family === 'mode') return MODE_HELP[rest as ScoreMode];
  if (family === 'drill') return DRILL_HELP[rest as DrillKind];
  if (family === 'tool') return TOOL_HELP[rest as ToolKey];
  return undefined;
}

function splitKey(key: string): [string, string] {
  const at = key.indexOf(':');
  return at === -1 ? [key, ''] : [key.slice(0, at), key.slice(at + 1)];
}

/**
 * What a drill's own extra measurements are called, in words.
 *
 * `DrillResult.detail` is a bag of numbers each kind fills with what it
 * measured, and the summary sheet used to print the field names with the
 * capitals turned into spaces: *boundary ms*, *soft velocity*, *flat
 * velocity*, *count in beats*. That is the code's own word for the thing shown
 * to a learner, which `00-invariants` §1 rules out and which the owner
 * (2026-09-22) called weird and unhelpful. So the names are said here, once.
 *
 * A key with no row falls back to the old spacing rather than disappearing: a
 * new measurement should show up unlabelled and be fixed, not be silently
 * dropped from the sheet.
 */
export const DRILL_DETAIL_LABEL: Readonly<Record<string, string>> = {
  boundaryMs: 'Time allowed per chord',
  chordsHeard: 'Chords you played',
  chordsExpected: 'Chords asked for',
  extraTaps: 'Taps too many',
  meanOffsetMs: 'Average distance from the beat',
  bpm: 'Beats per minute',
  countInBeats: 'Count-in beats',
  cleanChanges: 'Clean pedal changes',
  scoredChanges: 'Pedal changes marked',
  halfPedalLow: 'Softest pedal reading',
  halfPedalHigh: 'Firmest pedal reading',
  pedalMessages: 'Pedal readings in all',
  heldMessages: 'Readings with the pedal down',
  inRange: 'Readings part way down',
  softVelocity: 'How hard the soft notes were played',
  loudVelocity: 'How hard the loud notes were played',
  ratio: 'Loud against soft',
  targetRatio: 'Loud against soft, asked for',
  flatVelocity: 'Every note the same volume',
  partialPedalMessages: 'Readings part way down',
  binaryPedal: 'This pedal only sends down and up',
  longestChain: 'Longest chain',
  notesPlayed: 'Notes played',
};

/** The words for one of a drill's extra measurements. */
export function drillDetailLabel(key: string): string {
  return DRILL_DETAIL_LABEL[key] ?? key.replace(/([A-Z])/g, ' $1').toLowerCase();
}
