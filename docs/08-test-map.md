# 08 — Test map: which state machine is proved by what

The tour's pictures show moments. The faults that reached the owner lived *between* moments —
what one event did to the next — and no number of pictures would have shown them. This map
says, for each state machine in the app, which test drives it through its transitions and
checks what must hold, and which pieces are still open. It exists so the pieces are not
forgotten while any one of them is being worked on.

A test named here is the reproduction: every failure prints the seed and the action trace.

## The pieces

| Piece | What can go wrong | Proved by | Status |
| --- | --- | --- | --- |
| **Session** (`ScoreSession`): start, stop, restart, pause, resume, finish, lap | a stop or restart reported as a finish; a lap that moves the engine but not the cursor; a warning mark asked for in Wait mode | `tests/unit/scoreSession.test.ts` — fake renderer, hand-cranked frames | done |
| **Engine** (`PracticeEngine`): Wait, Tempo, Listen, loops, count-in, pedal, mic | judging, advancement, laps, restarts on the grid | `tests/unit/engineWait.test.ts`, `engineTempo.test.ts`, `engineMic.test.ts`, `engineScoring.test.ts` | done (P3) |
| **Slot plan** (`slots.ts`): which bars each slot holds | the wrong next range at a repeat or ending | `tests/unit/slots.test.ts` | done (P21c) |
| **Renderer** (`WindowRenderer`): steps forward, back, jumps; rotation; bars per window; hands | a stale element map; a slot engraved while hidden; no redraw after a rotation; two slots at two scales; the band off the note | `tests/e2e/score.renderer.fuzz.spec.ts` — seeded random walk on the dev harness, invariants after every move | done; extend with zoom and scroll layout |
| **Score screen** (`ScoreScreen`): everything a learner can do during a run | summary over a live run; a recorded half-run; the warning mark after a stop; a Wait run with nothing to wait for; a freeze | `tests/e2e/score.fuzz.spec.ts` — seeded random walk with the spoofed piano, invariants after every action, long-task watch | done; extend with the ⋯ sheet (keys, blind, size, layout), section loops, the summary's Slower/Faster/Loop the weak bars, tablet sizes |
| **A whole song** on every form factor | a stall; a size change mid-run; the next bar not on the screen; the slide losing the cursor | `tests/tour/sequence.spec.ts` — plays what the app asks for, first note to summary; `SEQ_SONG`/`SEQ_FACTORS` choose the song and sizes | done |
| **Pictures**: the first, a middle and the last input, before and after | what a person sees | the sequence's `…-bar01`, `…-after-first`, `…-after-mid`, the last bar and `…z-finished` frames, per form factor | done; read them every round |
| **The corpus**: twelve legs of pieces chosen to differ — one staff and two, 4/4, 3/4, 6/8, a pickup, chord symbols, a key signature, repeats, a long piece, the longest, words under the notes, and one piece in the scroll layout — on all four form factors | a fault that one song never shows: the pickup piece drawn a bar late; nothing coloured on a repeat's first pass; the stave moving on a piece the probe cannot measure; the summary off the screen on a tablet | `tests/tour/corpus.spec.ts` (`npm run corpus`, about half an hour; `CORPUS=` and `CORPUS_FACTORS=` narrow it) — the sequence's invariants plus: the notes coloured current are the notes the run waits for, and the next bar *in playing order* is on the screen; a log and three pictures a leg under `build/corpus/`, tiled by `tools/contact_sheet.py` | done; read the sheets every round |
| **The setup tour** (`SetupScreen`): first launch, skip, finish, run again, the live preview | the tour on a deep link; a setting the tour changed that Settings does not show; a preview that does not redraw | `tests/e2e/setup.spec.ts` — starts from an empty origin, walks all eight steps, checks Settings after | done |
| **The state gallery**: 52 cells, every branch of `08`, measured and photographed | a caption that is not what the picture shows | `tests/states/` (`npm run states`) — each cell records claims and the gallery goes red where the record disagrees; a harness self-check runs first | done; read every cell |
| **Fit and freeze** (`scaleFor`, the probe, `setRunning`) | the size changing during a run; the last window doubling; a frozen scale outliving a rotation | the sequence's one-scale assertion; the screen fuzz's mid-run scale check; `tests/e2e/score.layout.spec.ts` | done |
| **Timing budgets** | a swap or a coloured note over budget; a freeze | `tests/e2e/perf.spec.ts`; the screen fuzz's long-task limit | done; the 780-bar open budget is marginal on this laptop |
| **Keys strip and ribbon** during a run | the wanted key not shown; a wrong key not red; the strip not scrolling to the note; the guide, the finger numbers and the flash not following their settings | `tests/e2e/keyboard-strip.spec.ts`, `score.run.spec.ts`, `keys-guide.spec.ts`; `tests/unit/scoreSession.test.ts` | partial: not under the random walk yet |
| **Tempo and Listen timing**: count-in, beat dot, cursor cadence, pause on hidden | the cursor drifting from the clock; a count-in that does not count; a run that catches up silently after a phone call | `engineTempo.test.ts` (engine only); `score.screen.spec.ts` (count-in) | open: a walk that watches the cursor's cadence against the clock, and the visibility-change pause |
| **Microphone input path** | a guess painted red; a chord counted rolled | `engineMic.test.ts`, `mic.spec.ts` | done (engine); the screen under mic input not walked |
| **Lesson, drill and paper screens' runs** | the same stop/finish confusions in another host | `lesson-flow.spec.ts`, `drills.spec.ts` | open: no random walk; read their `onFinished` paths for the same fault |
| **PDF viewer** (`PdfScreen`): pages, systems, Timed, learn from taps, Adjust cuts | a Timed interval learned from a double-tap; a cut that loses a system | `tests/unit/pdfTiming.test.ts`, `pdf.spec.ts` | partial: the page/system state under a walk is open |
| **Scroll layout** | auto-scroll fighting a manual scroll; the cursor off the target fraction | `score.spec.ts` (target fraction) | open under the walk |
| **Blind and Perform modes** | the score coming back; a performance flag on a loop | `score.screen.spec.ts` | done (P18–P20); not walked |

## How to run the pieces

```bash
# the fast ones (seconds)
npx vitest run tests/unit/scoreSession.test.ts tests/unit/engineWait.test.ts tests/unit/slots.test.ts
# the walks (a few minutes; a failure prints seed and trace)
CI=1 npx playwright test score.fuzz score.renderer.fuzz --retries=0
# one song through, pictures included (about 30 s per form factor)
SEQ_SONG=song.folk.twinkle.rh SEQ_FACTORS=portrait,landscape npx playwright test --config playwright.tour.config.ts sequence.spec.ts
```

## What the corpus found (2026-09-09)

Four faults no single song could show, all found by an assertion rather than a picture: on a
piece with a pickup every window was drawn one bar late and nothing was ever coloured (the
engraver's draw range counts from the pickup's 0); on a piece with repeats nothing was coloured
on the first pass (one element, two ids, the second toggle undid the first); on the 780-bar
piece the stave moved between windows (no measurement, so the placement anchored on the ink);
and on a tablet the summary sheet sat above the screen (a grid with no explicit rows). The
assertion that found the first two — *the notes coloured current are the notes the run waits
for* — had not existed; the pictures had been read with the band over a white note and nobody
noticed the note was white.

## What a walk found, so far (2026-09-08)

Seven faults from reading the code (`decisions/2026-09-08-p21e-round-three.md`, round four), then
five more from the walks in their first hour: the engraver handing out detached elements for bars
it no longer shows; a slot engraved while `display: none`; no redraw after turning the phone; the
warning mark left on the sheet after a stop; a Wait run with a hand that has no notes. And three
from the before-and-after pictures of one song on the phone: a silent staff of rests taking half
of every window; the bar over the lower staff at the start of a run sideways; half the screen
black at the end of a song. The walks and the pictures find different things; both are run.
