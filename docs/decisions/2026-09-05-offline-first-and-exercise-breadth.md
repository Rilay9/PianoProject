# Everything runs locally; exercises are first-class

Date: 2026-09-05 · Owner decisions · Status: accepted · `00` D20 and D21

Two owner decisions taken the same day, recorded together because they pull in the same
direction: the app should be self-sufficient, and it should be able to teach a skill without
needing a song to hang it on.

## D20 — offline-first

> "I got plenty of space on my phone so I'm down to just download everything and run locally
> if possible. I'd like to minimize how much is needed online."

This settles the origin question `00` D19 left open, in favour of **full offline precache**.

**The numbers make it easy.** Measured 2026-09-05 on the built output:

| | size |
|---|---|
| scores (366 `.mxl`) | 2.7 MB |
| soundfont | 2.6 MB |
| `catalog.json` | 0.5 MB |
| lessons (55 markdown) | 0.2 MB |
| **content total** | **6.0 MB** |
| `app/dist` | 7.6 MB |

Against the 60 MB precache budget in `01` §6 that is nothing, and it stays nothing after P5b
adds ~150 exercises and P10 expands Stages 5–9. "Download everything" is the cheap option, not
the expensive one.

**What still touches the network, and why that is all of it:**

- **First launch.** A TWA loads its start URL over HTTPS; there is no way around that for a
  TWA, and a WebView wrapper that could load from disk would lose Web MIDI, which is fatal
  (`01` §1). So: one online launch, a progress bar while the library downloads, and never
  again.
- **Update checks**, which fail silently offline and can be switched off entirely in
  Settings → Content.
- **Teaching-video links**, which are external by design (`00` D10 — videos are linked, never
  copied) and are labelled "needs internet" *before* you tap them.

**The failure mode to watch.** Workbox's `maximumFileSizeToCacheInBytes` defaults to 2 MB and
**silently skips** anything larger. The soundfont is 2.6 MB. An app that works perfectly on
Wi-Fi and has no piano sound on a train is exactly what this produces, which is why `01` §7
makes the precache *verifiable*: the service worker reports n-of-m files cached, Diagnostics
shows it with a missing-files list (`04` §7b), and Settings has a "Download everything now"
that re-runs it and reports the total.

**Consequence for P9's acceptance:** airplane mode from the second launch onwards must be a
fully working app, not a degraded one. It is a test, not an aspiration.

## D21 — exercises are first-class, and every rung has alternatives

> "I want to highlight how important it is that it can generate exercises for all different
> skills (I don't think they always need to be songs) … also suggest alternatives at each
> level"

Two measurements from the P5 content, taken before deciding anything:

**The generator is lopsided.** 272 items: 96 scales, 60 Hanon, 24 arpeggios, 24 seventh
arpeggios, 24 inversions, 24 five-finger, 12 chromatic, 8 rhythm. A good conservatoire
technique syllabus, and **nothing at all** for hands-together coordination (unit 2.1),
accompaniment patterns (unit 3.6 is about nothing else), cadences and voice leading (3.2),
pedal timing (3.5), position shifts (2.5), reading by interval (1.5), rhythm in any meter but
4/4 (1.4 needs 3/4, 4.5 needs 6/8), or swing. Those are the units a beginner spends a year in.

One of these was free: `make_five_finger()` already takes a `hands` argument and the build
plan only ever passed `"both"`, so units 1.1 and 1.3 — explicitly right hand alone and left
hand alone — had no matching exercise for want of one line.

**Alternatives were thin.** Across 55 units: 11 offer fewer than three song options, and
exercise options run 1–6 with a median of 2, many of them runtime drills with no notation
behind them.

**What changes:**

1. `02` Part E2 names ten new generator families, one per uncovered skill. Built in P5b.
2. Part G's "1 exercise + 1 **song**" becomes "1 exercise + 1 **item**", with `songOptional`
   on units whose skill no song tests — 1.5, 2.5, 3.6, and the theory and improvisation
   tracks. Forcing a song there was making the rule lie.
3. **≥ 3 alternatives per rung, enforced by `validate.py`**, not by the author's judgement.
   Where three songs do not exist, exercises make up the number and the lesson says which
   skill they stand in for.
4. `alternatives[]` on catalog items, so the app can answer "give me something else" — and so
   an un-imported rock-module song is not a dead row but a pointer at the public-domain
   vehicle its technique brief already names.
5. `04` §2 gains **"Swap this"** per session row with a **"not a song"** filter, which is the
   user-facing half of all of the above.

## Why "prefer the exercise" is now written into `05` §7

A skill can often be expressed as either a generated exercise (real notation, a `.mxl`, works
in every practice mode) or a runtime drill (a prompt-and-answer loop, no notation). The
guidance is to prefer the exercise: it can be practised slowly in Wait mode, it is inspectable,
and it appears in the render previews — so a mistake in it is caught before a learner meets it,
which is not true of anything generated at runtime.
