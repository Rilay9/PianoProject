# The setup tour

2026-09-09. The owner asked for "the comprehensive calibration and user preference/display
options and modes tour on first start, and an option to redo it in settings".

## What was built

A sub-screen at `#/settings/setup` (`ui/screens/SetupScreen.ts`, loaded on demand because it
carries the engraver), nine steps: welcome, which way the phone will sit, the piano, latency,
sound, the screen, the four modes, practice, a summary. The first launch of a fresh install lands on it — a launch only,
never a deep link. Skip and Finish are both remembered (`data/setupStore`, persisted like a
setting); after either, the tour is the first row of Settings with the date.

Three decisions worth writing down:

1. **Every control writes straight through.** There is no "apply" at the end. Leaving at step
   three keeps what steps one and two set, and Settings shows it. A tour with its own draft
   state is a second settings screen that can disagree with the first.
2. **The choices that change the screen are shown on this phone, not described.** The owner's
   words: "they should of course have visual previews so they can see what the options look
   like on their device (they start off by selecting landscape or portrait)". So the second
   step is two miniatures of the score screen in the phone's own proportions, upright and
   sideways, drawn by the real engraver with the arrangement each way up gets, and a tap
   chooses; the screen step is the chosen miniature, redrawn on every change, with a flip to
   see the other. `ui/devicePreview` builds the miniature from the phone's short and long
   sides and the score screen's chrome at its real heights, and `WindowRenderer` gained an
   `orientation` override so the arrangement follows the miniature rather than the window.
   Building it found that **show chord symbols had never reached the engraver**: a stored
   value nothing read, listed in `04` §7c as built. It reaches it now.
3. **The routines are shared, not copied.** The latency test moved out of the Diagnostics
   screen into `audio/latencyTest`, the guided calibration out of the Microphone screen into
   `audio/pitch/calibrationRun`, the track chips into `ui/trackChips`, the MIDI recovery text
   into `midi/errorHelp`. A number measured in the tour is the number measured on the screen
   it came from.

## The builder's review

Read all eighteen pictures and found the one real problem: on a phone held sideways — the very
orientation the second step asks about — Back, Skip and Next were below the 360 px fold on most
steps, and on several upright ones. The footer is pinned to the foot of the screen now and the
step scrolls under it, and sideways the settings rows run in two columns as Settings' own do.
The spec asserts the Next button is inside the viewport on every step, both ways up. The
builder also noted, rightly, that the orientation choice is asymmetric: sideways locks the score
screen to landscape, upright only unlocks it, which is what the landscape-lock setting is.

**Open on the Linux runner.** CI run 57 failed on the tour's own new assertion: sideways on a
360 px fold the Start button's bottom measured 365.2, five pixels under. The same step measures
340 on the builder's Windows box, twenty above — a 45 px swing on the same viewport, because
`position: sticky` pins to whichever ancestor scrolls and that is not the same box on both.
Two fixes were tried and backed out. Keeping a footer's height clear below the step addressed
nothing: the controls it was meant to free — `Connect microphone`, `Quick calibration` — sit in
a fold that is closed, so they were never laid out where anyone could reach them, and with the
folds opened every control on every step is reachable already. Bounding the card to the screen
and scrolling the step inside it does hold the footer on the first screenful at every height
tried, 300 to 780 px, with 31 px to spare sideways — but it leaves step two showing the words
`Upright` and `Sideways` over a sliver of each miniature, which is the one thing that step is
for. The fold is worth less than the previews. It wants a fix that keeps both.

### How the footer was actually pinned

`position: sticky` pinned to whichever ancestor scrolls, which is not the same box on every
platform: `#setup-next`'s bottom measured 365 px on the Linux runner and 340 on Windows for a
360 px fold, and CI went red on the tour alone. Bounding the card alone squeezed the
miniatures, because a flex column shrinks its children before it overflows. The shape that
holds: the tour's card is bounded to the fold, the *step* is the one child allowed to
overflow and scrolls inside the card, and what is in the step keeps its size (`flex: none`
on the miniatures). The footer is then simply the card's last row, inside the card's own
padding, on any platform. Recorded here because two plausible fixes were tried first and
both were wrong in a way the pictures showed.

## The tests

`tests/e2e/setup.spec.ts` starts from an empty origin, which is a first launch, and walks all
nine steps with the spoofed piano — choosing sideways, checking both miniatures carry the
arrangement their way up gets, and the screen step's miniature follows the choice and flips —
then checks Settings shows what the tour set, and photographs every step upright and sideways. Every other
spec starts with the tour already skipped: the Playwright config seeds `pianopath.setup`
through `storageState`, and the three specs that clear localStorage themselves put the flag
back. Without that, every `goto('/')` in the suite would have landed on the tour.

## The keys: the guide, the finger numbers, the flash (later the same day)

The owner, after playing with it: "the keyboard turning all red and staying that way is bad.
Either show the next note(s) to press on the keyboard or show green/red for a brief time after
a miss/hit." Then: "is there also an option to show the right keys on the keyboard ahead of time
(as like a fingering guide) instead of or with the correct/incorrect feedback?" — "add all
those as options and features."

So a verdict on a key is a flash, 900 ms, and then the key goes back to the guide; and the guide
is three settings under Display, in Settings and in the tour's screen step, shown in the
miniature: **Keys guide** (the note it waits for · that and the one after · off — with two ahead
the paler blue shows in Wait mode too, which the gallery's §9.11 now allows), **Finger numbers
on the keys** (the score's finger number on each marked key, and after the name on the ribbon),
**Flash a hit green and a miss red**. Each works alone. The session takes them as
`StripOptions`, spelled out so it owes the settings store nothing; `keys-guide.spec.ts` checks
each on Hot Cross Buns, whose first two notes are fingered 3 and 2.
