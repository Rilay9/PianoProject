# P9 — On-device QA, performance, offline, packaging  ·  Intended model: **Opus 5**  ·  Branch: `feat/p9-qa`

(Include `_COMMON-HEADER.md`.)

Read: `docs/01-architecture.md` §6–§9; `docs/06-build-plan.md` P9 and §3.

## Build / verify
1. Performance: profile the Score screen (window swap, cursor update, note colouring, MIDI
   → colour latency) in desktop Chromium with CPU throttling ×4 as a phone proxy; fix
   hot spots; expose timings in Diagnostics; ask the owner for a debug report from the S25 and
   iterate until `01` §6 budgets are met.
2. Offline: verify with Playwright `context.setOffline(true)` after a first load that all
   routes, one score, one drill, and the soundfont work; "update available" toast.
3. Error boundary with "copy report"; unhandled-rejection logging into Diagnostics.
4. Lighthouse PWA audit passes (installable, offline, icons, theme).
5. **Packaging (required — `00` D19, not optional any more).** `bubblewrap` config for a TWA
   APK, a documented local build, and a signed APK the owner installs on the S25. Verify **Web
   MIDI works inside the TWA**, not just in Chrome — this is the one thing that would sink the
   approach, so test it before anything else in this item. The signing keystore is the owner's
   and MUST NOT be committed; document where it lives and how a build is reproduced without it.
   Do not build the APK in CI (it needs the key).
6. **The private-repo move (`00` D19, `01` §9).** A TWA still loads its start URL over HTTPS,
   so decide and implement the origin: recommended is a free static host (Cloudflare Pages /
   Netlify) fed by the same build, which works from a private repo; the alternative is full
   offline precache with one online first launch. Whichever you pick: serve
   `/.well-known/assetlinks.json`, set `base` to match, and delete or repoint `pages.yml`.
   In the same pass, decide the content-build licence flag with the owner: once nothing is
   published, `--allow-nc` can become the default (`03` §1) — but if any public deploy
   survives, it must keep `--strict-license`.
7. Owner README: install the APK, connect piano, first session, backup/restore, troubleshooting.

Owner checklist to include in the report: install the APK; rotate; 30-minute session without a
console error (Diagnostics shows errors count); MIDI connect; offline airplane mode; export/
import; battery/thermal note.

**Carried over from P7 — three things that can only be checked on the phone** (see
`docs/decisions/2026-09-06-p7-screens-storage.md` §5 and "What is not done"):

- **Share a score into the app from Android.** Long-press a `.mxl` or a `.pdf` in Files or
  Drive, choose PianoPath, and check it lands in Library. The manifest declares the share
  target and the service worker answers the POST, but a real intent has never been fired at
  it — Playwright cannot. The same tap also exercises `file_handlers` (opening a `.pdf`
  straight from Downloads).
- **A real bought PDF in the viewer.** The fixture is a synthetic two-system page. Open an
  actual purchased score, check the system detection on several pages, and correct one with
  "adjust cuts" — that is the feature the owner asked for by name, and a typeset page from a
  real publisher is the only honest test of it.
- **Memory on a long PDF.** The viewer keeps three rendered pages at a time (P7 changed this
  after the first draft held all of them); check a 20+ page score does not make the app die.
