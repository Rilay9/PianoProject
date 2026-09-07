# Known problems, as of 2026-09-07

Everything here is real, reproducible, and **not fixed**. It is written down so
that whoever picks the work up next does not spend an afternoon rediscovering
it, and does not mistake any of it for something they have just broken.

Both prompts in this directory reference it. Read it before running the suite
for the first time.

---

## 1. The tempo clock stops when the screen is not being drawn

**The most serious thing on this page.** It is question 9 of `design-brief.md`,
repeated here because a builder will meet it as a flaky test long before anyone
meets it as a design question.

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

The fix is a decision, not a patch — see question 9 of the design brief for the
three candidates.

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

| Screen | Controls needing a scroll |
|---|---|
| Skills | ~478 — every one of 266 concepts is rendered at once |
| Library | ~58 |
| Settings | ~49 |
| A lesson page | ~15 |

Skills is the one to look at first: every other screen in the app is in double
figures, and the Library holds 1,533 items without doing this.

## 4. Dead space the engraver cannot fill

Upright, the Score screen leaves about a third of the height empty below the
second stave, and the PDF viewer draws a system about 170 px tall on a 2,340 px
screen. Both are *correct* — the notation is as large as it can be for that
width — and both look like something is missing. Question 5 of the design brief.

## 5. What the tour has not been used for

The audit covers the mechanical faults on every screen in all four form factors
and currently reports **none**. The judgement half — is this readable, is this
the right thing to show first, is it good-looking — was sampled, not completed:
roughly 25 of about 290 pictures were looked at by eye.

`build/tour/index.html` is built for exactly that, and a person will get through
it far faster than a machine will. If a change is made to any screen, reshoot
before believing anything in this file about it.

---

## How to check any of this yourself

```
cd app
npm run lint
npm run test                    # 1,429 unit tests
CI=1 npx playwright test        # 250 e2e; the CI=1 matters, it changes what runs
npm run tour                    # ~290 screenshots + the audit, about 15 minutes
```

and from the repository root:

```
node tools/content/python.cjs -m unittest discover -s tools/content/tests -t tools/content
```

**That last one takes four and a half minutes and prints nothing useful until it
finishes.** Reading its output early is how a broken test reached CI on
2026-09-07: the partial output was content-build chatter, and the exit code seen
was a pipe's rather than Python's. Redirect it to a file, wait, then read.
