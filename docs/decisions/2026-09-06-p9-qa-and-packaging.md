# P9 — QA, performance and packaging: what was decided, and what could not be done here

Date: 2026-09-06 · Branch: `feat/p9-qa` · Prompt: `prompts/P9-device-qa-perf.md`

P9 is the phase that ends on a phone, and this session has no phone. What follows separates
what was built and measured from what is waiting on hardware, so the second list is a checklist
rather than a surprise.

---

## 1. The performance budgets are met, and there was nothing to optimise on the Score screen

`01` §6 sets four numbers. Measured under **×4 CPU throttling** (Chrome DevTools' own mid-tier
phone proxy — the S25 is faster, so this errs pessimistic):

| Budget | Limit | Measured at ×4 |
|---|---|---|
| First render of a 2-bar window | < 150 ms | **median 54 ms** |
| Pre-rendered window swap | < 16 ms | **0.5–3.6 ms** |
| MIDI-in to note coloured | < 30 ms | **mean 12–15 ms, max 23 ms** |
| One session frame | (implied by the above) | **mean 0.7 ms** |

Two of those had never been measured at all, because nothing recorded them:

- **`input.toColour`** spans two mechanisms — the input handler and the next animation frame —
  so neither end could measure it alone. `ScoreSession` now stamps the input and the paint
  closes the loop.
- **`window.swap` vs `window.swapCold`** are recorded under separate labels on purpose.
  Averaging them would hide a pre-render that silently stopped happening, which is the exact
  failure the double buffer exists to prevent and the one nobody would notice by eye.

`tests/e2e/perf.spec.ts` asserts all of it under throttling. A green run means "not obviously
too slow"; the number that actually settles it is a debug report pasted from the S25.

## 2. The Score screen was in the entry bundle, and should not have been

Lighthouse put 332 kB of unused JavaScript on the first paint. The cause: `AppShell` imported
`ScoreScreen` statically, `ScoreScreen` imports OpenSheetMusicDisplay, and OSMD is about a
megabyte — so opening **Today** waited for an engraver it does not use.

Loading it on demand, exactly as `PdfScreen` and `DevScoreScreen` already were:

- entry bundle **1,576 kB → 227 kB** (gzip 427 → 78 kB), against the 1.5 MB budget in `01` §6;
- Lighthouse performance **77 → 98**; SEO 90 → 100 (a missing meta description);
- accessibility and best practices were already 100 and stayed there.

OSMD now sits in a shared chunk that Score and the dev route both pull, so it loads the moment
a score is opened and not before. It is precached either way, so "on demand" costs nothing
offline.

## 3. Lighthouse no longer audits PWAs at all

The prompt asks for a "Lighthouse PWA audit". That category was deprecated in v12 and the
individual audits — `installable-manifest`, `service-worker`, `splash-screen`,
`themed-omnibox`, `maskable-icon` — were **removed in v13**. Asking for them returns nothing,
which is worse than a failure because it reads as a pass.

So `scripts/pwa-audit.mjs` (`npm run pwa:audit`) does two things: runs Lighthouse for what it
still measures, and then checks the PWA properties itself by fetching the manifest and the
service worker — every icon the manifest names is actually fetched, because a 404 there is an
install with a blank launcher icon. Eighteen checks, all passing.

Writing it caught one bug in itself worth naming: the first version counted precache entries by
matching `"revision":`, but the worker is minified and the keys are bare, so it reported a
healthy build as having zero entries.

## 4. The error boundary listens to the log, not to `window`

`util/errorLog` has counted errors for Diagnostics since the examination pass; P9 adds the
visible half. It subscribes to the log rather than adding its own `window` listener, so the
banner's count and the debug report's can never disagree — which they would have, the first
time one of them was changed.

It is **not a modal**. The error may be in one screen while the rest of the app is fine, and
blocking the whole UI would turn a broken Library into a broken app. "Copy details" always
leaves the text selectable as well as trying the clipboard: the clipboard API needs a secure
context and can be refused, and a report you cannot get off the phone is worth nothing.

## 5. The update toast is a prompt and never automatic

A service worker that swapped itself in mid-practice would reload the page under a running
session, and the one moment this app must not interrupt is someone playing a piece. So the new
worker waits and the toast says so. It never appears when "offline only" is on — that setting
means *do not check*, and a toast about an update is a check.

## 6. Packaging is host-agnostic, because the origin is not decided

The owner chose this explicitly. `packaging/` holds:

- `twa-manifest.template.json` — the Bubblewrap config with the host, package id, version and
  keystore left as placeholders, including the share target and file handlers so a shared
  `.mxl` reaches the app.
- `build-apk.sh` — fills the template from `PIANOPATH_HOST` / `PIANOPATH_BASE_PATH`, builds the
  web app with a matching `VITE_BASE`, runs Bubblewrap, writes the Digital Asset Links file
  into `app/dist/.well-known/`, and refuses to start without a host and a keystore.
- `assetlinks.sh` — reads the SHA-256 out of the keystore (or takes one directly, for a
  Play-signed build) and prints the JSON. The fingerprint is public — it is in every copy of
  the APK — so its output is safe to commit; the keystore it reads is not, and is gitignored
  along with the filled-in manifest and the built APK.

**A TWA, not Capacitor or a plain WebView**, and the reason is the whole approach: only a TWA
runs the real Chrome, and only the real Chrome has Web MIDI. That is why verifying MIDI inside
the APK is the *first* on-device check and not the last.

**The trap the script warns about:** `assetlinks.json` must be at the **origin root**, never
under the app's base path. Serve the app at `/PianoProject/` and the file still has to be at
`https://host/.well-known/assetlinks.json`. That is the main argument for serving at `/` on
whatever host the APK points at, and why `PIANOPATH_BASE_PATH` defaults to `/`.

## 7. The screenshot "flake" was not a flake at all

Six landscape screenshots started failing after the lazy-chunk change: passing alone, failing
in the full suite, by **exactly 4559 pixels every single run**. That constancy is the tell — a
timing flake does not produce the same number twice.

The first guess was the stability wait, and it was half right: `waitForStableLayout` watched
the SVG's *bounding box*, and OSMD's second pass re-spaces the notes **inside** an SVG whose
outer dimensions never change. That is a real weakness and it is fixed — it now keys on the box
*and* `svg.outerHTML.length`, and waits for `document.fonts.status`. But it was not the cause,
and the tests kept failing identically.

Looking at the diff image settled it. The notation was pixel-identical; what moved was the
**magenta mask Playwright paints over the dev HUD**. The HUD is sized by its own text, its
first line is `load NNN ms`, and the number of digits depends on how busy the machine is — so
the mask box was wider in a full run than in a solo one, and the lazy chunk changed the load
time enough to cross a digit boundary. A mask that changes size is a screenshot test measuring
the test harness.

Fixed by pinning the HUD to `260 × 132`, and the baselines regenerated once so they encode the
stable mask. Worth writing down for two reasons: a "flake" that reproduces exactly is not a
flake, and looking at the diff image took two minutes where re-running the test three times
took twenty.

## 8. The licence flag needs no decision yet

`03` §1 says a public deploy must keep `--strict-license`; `00` D10a says the constraint lifts
once nothing is redistributed. Both are already true at once: the Pages deploy is public and
keeps the strict build, and `build-apk.sh` builds from whatever `content/` holds locally. When
the repo goes private and Pages goes away, `--allow-nc` can become the default in one line —
and not before.

---

## What could not be done here, and is waiting on the phone

None of this is blocked; it is all hardware. `docs/OWNER-GUIDE.md` §1 is the checklist.

1. **Build and sign the APK.** Needs the owner's keystore, which must never leave his machine.
   The toolchain is written and its guard rails are tested; it has never produced an APK.
2. **Web MIDI inside the TWA.** The one thing that would sink the approach. Check it first.
3. **Install, rotate, and a 30-minute session** with Diagnostics showing no errors.
4. **Airplane mode from the second launch.** The Playwright offline test covers the same
   ground — every route, a score, a drill, the soundfont, Diagnostics — but a real service
   worker on a real Android with real storage pressure is not the same thing.
5. **The three carried over from P7**: a real Android share intent, a bought PDF through
   "adjust cuts", and memory on a 20-page score.
6. **Battery and thermals**, which have no proxy at all.

And one thing that is not hardware: **the origin**. The APK needs an HTTPS address, and the
packaging takes it as a variable so choosing one stays a config change.
