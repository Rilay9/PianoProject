# Known problems, as of 2026-09-07

Everything here is real and reproducible, and is written down so that whoever
picks the work up next does not spend an afternoon rediscovering it, and does
not mistake any of it for something they have just broken. Anything headed
FIXED is fixed; it stays on the page because the road to it went through two or
three confident wrong theories, and those are the expensive part.

Both prompts in this directory reference it. Read it before running the suite
for the first time.

---

## 1. The tempo clock stops when the screen is not being drawn — FIXED in P21

**Kept for the record, because two of the theories below were wrong and it
would be easy to arrive at them again.** What ships now (decision 9, `05` §3):
a running Tempo or Listen run pauses on `visibilitychange` and says how long
you were away, and `ScoreSession` ticks the engine from a 25 ms interval as
well as from frames.

**And the flaky test was something else entirely.** `startRun` and `replay` are
two `page.evaluate` round trips, so on a loaded machine the run was already
several hundred milliseconds old by the time the `ReplaySource` connected — and
a script saying "the first note at 100 ms" arrived stamped for a slot the engine
had long closed. Hence `hits: 0`, and hence more often the busier the machine.
`DevScoreScreen.replay` now starts the run at the instant the source connects.
The frames were never the problem; the two clocks disagreeing about zero was.

The original description follows, because the *product* problem it describes was
real and is what decision 9 answers.

`ScoreSession.loop` calls `engine.tick()` once per `requestAnimationFrame`, and
a browser stops issuing animation frames when the page is not being drawn —
another app in front, the screen off, the tab hidden. **There is no
`visibilitychange` handling anywhere in the app.**

So a run in Tempo or Listen mode, interrupted by anything that takes the screen,
stops advancing. What happens on the way back depends on the engine's
arithmetic: it may sit still, or see a large elapsed time and jump several bars,
marking everything in between as missed.

It is masked in ordinary use — `keepScreenAwake` is on by default and a phone on
a stand stays lit — which is why it has never been noticed on the device.

**What it looks like in the suite.** `tests/e2e/engine.spec.ts` has three Tempo
tests that flake, most often *a late run yields the expected timing statistics*.
The symptom is always the same and is worth recognising: `hits: 0`, or a step
that never advanced, and **no `tempoTick` events at all**. The test runner keeps
every page but one in the background, so frames are starved exactly as they
would be on a phone with the screen off.

`DevScoreScreen` ticks from a timer as well as from frames, which helps and is
why the file usually passes on its own. It is not enough under a full parallel
run. The shipped screen is deliberately left alone.

**Two things that were tried and are not the answer:**

- Basing a scripted performance's zero on the run's start rather than on when
  its `ReplaySource` connects. This is *worse*: it makes the timestamps relative
  to the run while leaving delivery on the source's own schedule, so a note
  arrives stamped in the past for a slot Tempo mode has already resolved, and is
  scored a miss. Stamp and delivery have to agree. There is a comment in
  `DevScoreScreen.replay` saying so.
- Ticking the harness from a timer. Necessary but not sufficient, as above.

A third thing that was tried and is **not** the answer: turning off Chromium's
background throttling in `playwright.config.ts`. Worth having — a background
window really does clamp both frames and timers — but a full run with those
flags and nothing else still flaked, which is what pointed at the two clocks.

## 2. Two other tests flake, less interestingly

Neither has been chased to ground, and neither has ever failed twice running.

- **`tests/e2e/offline.spec.ts`** — *the whole app works with the network off*.
  Fails with `net::ERR_CONNECTION_REFUSED` on a reload. It is the longest test
  in the suite (about two and a half minutes) and it reloads against the preview
  server while thirteen other workers are hammering it.
- **`tests/e2e/perf.spec.ts`** — *a played note is coloured within the
  input-to-colour budget*. A timing budget on a contended machine.

A full `CI=1 npx playwright test` typically comes back **exit 0 with one or two
flaky**. Anything more than that is worth looking at rather than retrying.

## 3. Screens where a lot lives below the fold

Not defects. The tour's audit prints a count per screen and these are the
outliers, all of them a version of design-brief question 1:

| Screen | Controls needing a scroll (portrait, P21) |
|---|---|
| Skills | 69 |
| Score folder, seeded | 60 |
| Library | 57 |
| Settings | 45 |
| A lesson page | 11 |

Skills was ~478 before P21 §A5 made it open on what is rusty rather than
rendering all 266 concepts at once; it is now in the same range as the other
long screens. All five are lists of things the owner asked to be able to
browse, so the number is a fact about the screen rather than a fault.

## 4. Dead space the engraver cannot fill

Upright, the Score screen leaves about a third of the height empty below the
second stave, and the PDF viewer draws a system about 170 px tall on a 2,340 px
screen. Both are *correct* — the notation is as large as it can be for that
width — and both look like something is missing. Question 5 of the design brief.

## 5. What the tour has not been used for

The seven mechanical checks — clipped, unreachable, overflow, plural,
light-control, tap-target, clipped-text — report **none** on any of the 325
pictures. The four rules of `04` §0 report plenty, and the biggest number is a
real finding rather than a miscalibration:

| Check | Portrait | Landscape | Tablet | What it is |
|---|---|---|---|---|
| glyph-labelled | 54 | 54 | 54 | a one-glyph button that does carry an `aria-label` |
| R3 one primary | 7 | 7 | 7 | mostly a list where every row has a Practise or an Add |
| below-fold | 10 | 16 | 7 | informational; §3 above |
| R2 density | 5 | 0 | 0 | five **settings** rows, 90-150 px; no list row is over |
| R4 empty state | 1 | 1 | 1 | "no chord symbols" offers two buttons |

**R2 was 112 in portrait and 100 on a tablet, and is now 5 and 0.** Three causes,
each costing a whole second line:

- the text column's flex basis pushed wide action groups onto a line of their
  own — Skills carries "Drill it" and "Find more", the shelf carries "Practise",
  "Edit" and "Remove", 167 px of buttons against a content box of 262;
- a badge whose own words wrapped made a meta line 38 px instead of 22;
- and, tablet only, the two-column `.list` is a grid, where an item stretches to
  its track — so one tall row dragged the row beside it to 211 px while its own
  contents measured 43.

What is left is five **settings** rows — not list rows — at 90 to 150 px against
a hinted budget of 88. "Playback destination" at 150 is genuinely a card. That is
the next density job, and a much smaller one.

The judgement half — is this readable, is this the right thing to show first, is
it good-looking — is still sampled rather than completed: seven scenes were looked at
by eye in portrait (20, 29, 31, 35, 01, 40-drill-five-finger, 53), two of them
again after the fixes they prompted.

`build/tour/index.html` is built for exactly that, and a person will get through
it far faster than a machine will. If a change is made to any screen, reshoot
before believing anything in this file about it — and then tick **Only what
changed since the last tour** at the top of that page, which hides every scene
whose four pictures are byte-for-byte what they were last time. A second tour is
a review of the difference rather than of three hundred pictures again.

Two other things the tour now says at the end of each form factor, both of which
should be empty: the **gaps** (a scene whose predicate did not hold — it was not
photographed rather than photographed wrong) and the **identical pictures** (two
captions over one picture, which is how thirteen scenes had been lying).

---

## How to check any of this yourself

```
cd app
npm run lint
npm run test                    # 1,436 unit tests
CI=1 npx playwright test        # 281 e2e; the CI=1 matters, it changes what runs
npm run tour                    # 325 screenshots + the audit, about 16 minutes
```

and from the repository root:

```
node tools/content/python.cjs -m unittest discover -s tools/content/tests -t tools/content
```

**That last one takes four and a half minutes and prints nothing useful until it
finishes.** Reading its output early is how a broken test reached CI on
2026-09-07: the partial output was content-build chatter, and the exit code seen
was a pipe's rather than Python's. Redirect it to a file, wait, then read.
