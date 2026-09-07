# Verifying, and the four ways it goes wrong

The common header on every brief here says *"verify by commands you actually ran
and paste the exact output — do not claim something works because it should."*
That rule is easy to agree with and easy to break without noticing, so this is
the concrete version: four ways a check quietly lies, every one of them met on
2026-09-07, each one caught by CI or by a screenshot rather than by reasoning.

None of this is hypothetical. It is a list of mistakes, written down so the next
person makes different ones.

---

## 1. Reading a command's output before it has finished

The content tests take **four and a half minutes** and print build chatter the
whole way. Their result is the last thing they say.

A run was started, its partial output read, the visible lines looked fine, and
it was reported as passing. It was not passing: a test in it had a `KeyError`
from a made-up argument. CI found it.

> Redirect long runs to a file, wait for them to end, then read the tail.
> `> /tmp/x.log 2>&1` and check afterwards. Do not read a log that is still
> being written and draw a conclusion from it.

## 2. A pipe throwing away the exit code

```bash
some-test-command | tail -5      # $? is tail's. It is 0. It is always 0.
```

This is how a failing suite reported success twice in one afternoon. Both times
the visible output looked unremarkable, because the failure lines were further
up than the pipe showed.

> Capture first, inspect second:
> ```bash
> cmd > /tmp/x.log 2>&1; echo "EXIT=$?"; tail -20 /tmp/x.log
> ```

## 3. Proving it on the easy case

`tests/e2e/engine.spec.ts` was run **four times on its own** and passed four
times, and that was reported as a flake fixed. Running the whole suite — which
puts fourteen browser pages in the background and starves the animation frames
the engine ticks from — it failed immediately.

The easy case is the one that does not reproduce the conditions the bug needs.

> A fix for something that fails under load has to be shown under load. If a
> test is flaky in the full suite, "it passes on its own" is not evidence about
> anything.

## 4. A plausible mechanism mistaken for a measured cause

The worst of the four, because it produces confident writing.

The Score screen used 40% of the width sideways. Three OpenSheetMusicDisplay
settings were tried, none of them moved a pixel, and the conclusion drawn was
"the engraver will not fill a short system" — written up, put in a brief and
handed on as fact.

It was wrong. A screenshot of the same window on a tablet showed three bars
sharing one stretched line, which the theory said was impossible. The cause was
two bugs in this codebase: a fit measuring its own scaled output, and a fit that
divided once where it needed to search. The width went from 41% to 98%.

The same shape happened again the same day with a flaky test: a mechanism was
identified, it explained the symptom, a change was made on it, and the change
was **worse than doing nothing** — it made a note arrive stamped in the past for
a slot the engine had already resolved. Both are recorded in
`known-problems.md` as *not the answer*, so nobody tries them again.

> "I tried three things and none worked, therefore it is impossible" is not a
> measurement, it is three failed attempts. Before writing a limitation down as
> a fact, find the case where it does not hold. There usually is one.
> And when a fix is based on a theory, say which measurement would show the
> theory wrong, then take that measurement.

---

## What actually caught all four

CI, and pictures. Not reasoning about the code.

Which is the argument for the tour existing at all: `npm run tour` puts about
290 screenshots and a seven-check audit in front of you in fifteen minutes, and
`build/tour/index.html` shows them four-up. A wrong belief about layout survives
any amount of thinking and does not survive one look.

## The shape of an honest claim

- **"Fixed"** needs a before and an after, measured the same way. 41% → 98%,
  not "should fill the width now".
- **"Passing"** needs the last line of the run and its exit code.
- **"Flaky, not fixed"** is a perfectly good thing to report, and is what should
  have been said about the engine test two attempts earlier.
- **"I do not know why"** is better than a mechanism that has not been tested.
  `known-problems.md` says it twice and is more useful for it.
