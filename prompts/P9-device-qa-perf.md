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
5. Optional: `bubblewrap` config + docs for a TWA APK (do not build in CI).
6. Owner README: install, connect piano, first session, backup/restore, troubleshooting.

Owner checklist to include in the report: install; rotate; 30-minute session without a
console error (Diagnostics shows errors count); MIDI connect; offline airplane mode; export/
import; battery/thermal note.
