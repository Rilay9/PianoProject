# Examination pass after P6 and P7

Date: 2026-09-06 · Branch: `feat/p7-screens`

The owner asked for "an examination of all existing code and spec and structures and docs so
far, to find any issues and make sure it's what I want". This is what it found. Everything
listed as **fixed** is fixed on this branch; everything listed as **open** is a decision for
the owner or a job for a later phase.

---

## 1. Bugs found and fixed

| What | Why it mattered |
|---|---|
| **The Android share target could never have worked.** `public/share-target.js` called `Response.redirect()` with a path. That throws a `TypeError`, and a throw inside `respondWith` puts the WebView on an error page with no back button. | The share target is one of the owner's two named import routes. It would have failed on the first real share, on the phone, with no console open. Now redirects to an absolute URL, verified against the actual `Response.redirect` behaviour. |
| **The PDF viewer rendered every page up front.** A 30-page sonata at display width is roughly 10 MB of canvas per page — 300 MB of bitmap on a phone. | The owner buys real scores; the fixture is two pages, so no test would ever have caught it. Now: detection runs a page at a time and keeps no canvas, display keeps a bounded cache of three pages, and the viewer says which page it is scanning. |
| **`pdf.worker.min.mjs` was silently left out of the precache.** The globs matched `js`, not `mjs`. | A PDF opened offline would have hung on a fetch that never resolved. This is the *second* time this exact failure has happened (the soundfont was the first), so `offline.spec.ts` now asserts that the hashed runtime assets — the worker and the entry chunk — are in the manifest, and `01` §6 records the pattern. |
| **"I already know this" did not complete the lesson.** It self-passed the first two options, which for a lesson needing one exercise *and* one song is two exercises. | The lesson stayed "in progress" immediately after the learner said it was done, which makes an honour-system button feel broken. `idsToCompleteLesson` now returns exactly what `lessonComplete` checks for. |
| **Buttons inside a list row also clicked the row.** "Edit" on an imported score opened the score *and* the editor. | Found by an e2e test; fixed in `widgets.listRow`. |
| **Two phrasings for one number.** Today said "0 of 150 minutes this week", Progress said "0 min of 150 minutes". | Same figure, two wordings, reads as two different figures. Both now use Today's. |
| **The P2 screenshot tests were load-sensitive.** Two of the twelve failed at 3 % pixel difference in a two-worker run and passed alone. OSMD lays a score out, then re-lays it once the music font's real metrics are known, so "the SVG is visible" is not "the SVG is final". | This would have shown up in CI as a red build on P8 that looked exactly like a rendering regression. `waitForStableLayout` now polls the box until it repeats; all twelve pass at four workers, which is more contention than CI applies. The 2 % tolerance is unchanged, so the tests can still catch a real layout change. |
| **Restored settings never reached the screens.** `hydratePersisted()` put the values back in localStorage, but `mountAppShell` had already run — and a screen reads its settings once, when it is built. A device whose localStorage was cleared showed every control at its default and then overwrote the real value on the next change. `persist.ts`'s own comment claimed the shell waited for hydration; it did not. | Caught by a test written *because* the comment made a claim worth checking. `needsHydration()` is a cheap synchronous check, and the shell now waits only on the launch that needs it — a normal launch pays nothing. |
| **The tap-tempo e2e was written against nominal time.** Four `waitForTimeout(500)` calls take 570 ms each on a loaded machine, giving 105 bpm against a `> 105` assertion. | It failed once in a full run and passed alone, which is the worst kind of red: it looks like a metronome bug. It now computes the expected bpm from the time the taps actually took, so the assertion no longer scales with how busy the machine is. |
| **Session length was stored twice** — a private localStorage key on Today, and (once Settings grew the control) `PracticeSettings`. | Two sources of truth that would have drifted. Now one: `weekdaySessionMinutes` / `weekendSessionMinutes`. |

## 2. Gaps found and closed

- **`04` §7 was about 60 % implemented, and nothing said so.** Two of the missing settings had
  real plumbing behind them and are now built: **"require 2 songs per lesson"** (honoured by
  `lessonComplete`, never applied to a `songOptional` unit, four unit tests) and **"show
  US-only PD items"** (nine bundled items are US-only per `00` A4). The rest is written up
  honestly in a new **`04` §7c**, which says what ships and why each missing one is missing.
- **`04` §7a (tablet) and §9 (accessibility) claimed more than shipped.** Both now carry a
  "ships as of P7" paragraph. The tablet breakpoint is two-column lists with tests at
  1024×1000 and 412×915; the bars-per-window default and the side panel are not built. The
  accessibility work that *is* done — labels, `role="button"` rows with Enter/Space, live
  regions, state shown by shape as well as colour — is listed, and the two things that are not
  (measured WCAG contrast, "large cursor") are named and pushed to P9 where they can be checked
  on the real screen.
- **The P7 acceptance criterion had no test.** There were tests for each seam but none for the
  whole loop. `tests/e2e/lesson-flow.spec.ts` now drives it end to end through the real UI:
  Today → Score → play it on the screen keys → summary → progress recorded → the item back in
  the review queue two days later. Nothing is seeded; the only clock trick is moving the
  recorded pass back two days.
- **The README said "P0 built".** Everything through P7 is built. It now carries a phase table
  and points at P8 as the next prompt.
- **Payload figures were four days and three phases stale.** Re-measured: content 6.8 MB, built
  app 9.9 MB, precache 608 entries / 8.7 MB, against the 60 MB budget. `00` D20, `01` §6 and
  `01` §7 all updated.
- **Layering.** `main.ts` and Diagnostics were importing from `SettingsScreen`, which dragged
  the whole Settings screen into the entry bundle. The storage/offline helpers moved to
  `util/storageReport.ts`.
- **Dead code.** `ui/screens/placeholder.ts` had no callers left; removed.

## 3. Checked and found sound

- **Content**: `validate.py --strict-license` passes — 573 items, 55 lessons, 9 song-optional,
  4 exempt from the three-alternative rule (the four Stage 0 orientation lessons, which is
  what the exemption is for). Curriculum covers Stages 0–5; 6–9 are P10, as planned.
- **Every owner request has an implementation.** MusicXML/MXL import · PDF *display* with
  adjust-cuts and no OMR · exercises for every skill with three alternatives per rung and
  "swap this" per row · a metronome that runs while the sheet music is showing (its own e2e
  test) · offline-first with the whole library precached · alternatives suggested at every
  level, including "play this instead" for an un-imported song. The two that are not code —
  the APK and the private repo — are P9, as `00` D19 says.
- **Failure paths degrade.** No IndexedDB (private browsing) → stores fall back to memory and
  the import screen says so rather than losing the file. No catalog → each screen shows the
  error rather than an empty list. No systems detected on a PDF page → the whole page, with
  "adjust cuts" to fix it.
- **CI** runs the Python tests, the content build, lint, typecheck, unit, e2e, build and the
  per-item render check. It has not yet run on P6/P7, because those are branches with no PR.

## 4. Open — for the owner

1. **Merging.** P6 (`feat/p6-score-screen`) and P7 (`feat/p7-screens`) are pushed but not
   merged, and P7 was branched from P6, so merging P7 brings both. Say the word and it goes
   into `claude/piano-teaching-app-bo19td`, which is where CI would first run on it.
2. **The branch the session was told to use.** This session was configured with
   `claude/p1-midi-audio-1yvl14` as its working branch, which contradicts
   `prompts/_COMMON-HEADER.md` rule 1 ("work on the branch named in the prompt") and the
   pattern every earlier phase followed. The prompts won. If the configured branch was
   deliberate, say so and the work can be moved.
3. **`04` §7's "daily goal minutes [30]"** contradicts the weekly-goal decision this project
   makes in three other places. It is recorded in §7c as deliberately dropped; confirm, or say
   you want a daily number after all.
4. **Strict prerequisites** is a listed setting with nothing behind it. Building it means
   deciding what a locked lesson *looks* like — a badge and a warning, or a genuinely disabled
   card. `00` D17 says gating is off by default, so this is opt-in strictness; worth building
   only if you would actually turn it on.

## 5. Open — for a later phase

- **P9** now carries the three things only a phone can check: a real Android share intent, a
  real bought PDF through the viewer and "adjust cuts", and memory on a long PDF.
- **Drag-to-reorder tracks** (`04` §3). Track order is stored and honoured; only the gesture
  is missing.
- **The chord chart's backing loop** is the metronome plus a block-chord comp. A bass-and-drums
  backing is not built; `04` §3b calls the loop optional.
- **Quick check** opens the lesson's first drill rather than assembling a bespoke 2–3 minute
  test. The drill UI is P8, which is where that belongs.
