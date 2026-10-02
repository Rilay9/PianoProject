# Timelines: what ran when, in Chromium on this machine, throttled 8× from the run's start

From `scripts-u66-diag.spec.ts` (the U66 case's steps with the page's timers wrapped: each `setInterval` and `requestAnimationFrame` tick and each timer of 50 ms or more logged with its start, its length and the engine events it emitted), printed by `scripts-timeline.mjs`. Times are ms from the replay's connect, which is the run's zero to within a millisecond. C is due at 0 (window to 150) and played at 100; D is due at 769 (window to 919) and played at 869. *gap* is the time since the previous tick began; the engine calls a gap over 25 ms a stall (`TICK_BUDGET_MS`). Only the timers, the stalled ticks, the ticks that emitted something and their neighbours are shown. The JSON was not kept (one file per run, 96 runs a set).

## Head, mechanism 1: a second stall closes the window the first one held (C judged wrong)

`headr8run-FAIL-11`. Long task 87.6 to 487.6.

```
490.5   raf tick, gap 406.6 (stalled), ran 3.8          <- holds C's window until about 515
523.4   iv tick, gap 32.9 (stalled), ran 21.1, emitted missed   <- a stall too, but the hold has run out: C closed
579.1   timer due 100.0 runs (note C), emitted noteJudged        <- stamped 99.8, inside its window; matches nothing
```

The interval tick at 523 fell due long before the note's timer (it was overdue from before the long task), so it ran first; its own gap says the thread had been busy again, and the queue the long task built had not had its turn.

## Head, mechanism 2: a window that ends just after the stalled tick (D judged wrong; the CI signature)

`headr8run-FAIL-22`. C was judged in its window; D was not.

```
916.8   raf tick, gap 191.1 (stalled), ran 16.0, emitted tempoTick,stepAdvanced1   <- D's window (to 919) not yet over: nothing held
935.0   iv tick, gap 18.2, ran 0.6, emitted missed                                  <- no stall, window over: D closed
936.1   timer due 869.0 runs (note D), emitted noteJudged                           <- stamped 868.9, delivered 67 ms late
```

D's note was queued behind the same 191 ms stall that the tick at 917 followed; the hold only covered windows already over at that tick.

## Head, mechanism 3: the tick straight after the stalled one

`headr8run-FAIL-55`.

```
487.3   raf tick, gap 402.9 (stalled), ran 2.3
508.1   iv tick, gap 20.8, ran 20.4, emitted missed
529.7   timer due 100.0 runs (note C), emitted noteJudged
```

The interval callback ran 20 ms under the throttle, and the engine reads its clock inside it, so to the engine this tick came either after a stall of its own once the hold had run out (mechanism 1) or exactly at the hold's end, which is no stall and no longer inside the hold. Either way it is the tick straight after the stalled one, and it ran before the queued note.

## The fix, the one kind of failure left: a delivery more than a second after the stamp

`r3-verbatim-FAIL-26` from `scripts-count-logged.sh` (the verbatim case on the fix, timers logged). The throttle froze the main thread for about a second:

```
725.1   raf  ran 964.2
1711.0  iv   gap 985.9 STALLED  events: tempoTick,tempoTick,stepAdvanced1,stepAdvanced2
1895.0  to869 due 869.0  (note D)  -> noteJudged, wrong: delivered 1026 ms after its stamp
```

A stamp more than a second from the clock is not trusted (`STAMP_TRUST_MS`, `toMusicTime`), so the note is judged at the time it arrived. That is U66's stated limit (`engineTempo.test.ts`, *U4: a stall that carries the note past the stamp-trust bound still loses it*), not this seam's.
