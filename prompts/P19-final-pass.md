# P19 — The final pass: fix what the once-over found, hunt for the rest, and prove the build before the owner touches it  ·  Intended model: **Opus 5**  ·  Branch: `feat/p19-final-pass`

Work on branch `feat/p19-final-pass`, created from `claude/piano-teaching-app-bo19td` (there is
no `main`). Commit early and often with conventional-commit messages. Never mention AI model
names in commit messages or in code. Verify by commands you actually run and paste the exact
results — do not claim something works because it should. Keep to the scope; list anything
out of scope under "Follow-ups". Where a decision has no obvious default, take the simpler
option and say so. Report as **Done · Not done/blocked · Follow-ups · Questions for the
owner · Files touched**. Any deviation from the docs gets a note in
`docs/decisions/<date>-<topic>.md`.

## What this session is for

This is the last coding session before the owner uses the app. His plan, in order: run this
prompt; test the app himself on the GitHub Pages deploy while the repository is still public;
then make the repository private and install from his laptop as an APK. So this session has
three jobs, and the third is the one that matters most:

1. **Fix** everything the review found (§A).
2. **Hunt** for what the review missed, the same way it hunted (§B).
3. **Prove** the build with the most comprehensive verification that can be done without a
   phone, and leave the owner a short test script for Pages (§C).

Read first, in this order: `docs/decisions/2026-09-06-once-over.md` (the review — short,
and every item below refers to it by its C-numbers), `docs/00-overview.md` (D1–D25),
`docs/OWNER-GUIDE.md` §1 (already rewritten for D25: the laptop is the origin; do not
reintroduce a third-party host). Then `docs/06-build-plan.md` §2 for the shape of the phases
that built this.

The project in one paragraph, because you have not read it: an offline-first piano-teaching
PWA for one person, one Galaxy S25 and one Roland HP-130 over USB MIDI. Vite + TypeScript +
vanilla DOM in `app/`; a Python 3.11 + music21 pipeline in `tools/content/` that builds
`app/public/content/` (1,527 items in the strict build, 93 lessons, 19 drill kinds). Two
builds from one table: `build.py --personal` is the owner's and carries CC BY-NC editions
and 159 scores whose compositions are not public domain; `--strict-license` is what CI and
the Pages deploy run and turns those into placeholders. Suites: 481 Python, 1,310 unit, 236
e2e — all green at the start; keep them so, and grow them.

Environment: Python 3.11 (`py -3.11` on Windows, `python3` on Linux), Node 22 in CI and 24
locally, `pip install -r tools/content/requirements.txt`, `npm ci` in `app/`, and
`npx playwright install chromium`. On Windows set `PYTHONUTF8=1`.

---

## A. Fix what the review found

Each fix arrives with the test that would have caught it. Confirm each at the line cited
before touching it; if the code has moved, say so.

**A1 — One rule for which tracks are active (C2).** `app/src/ui/screens/PlanScreen.ts:258–261`
falls back to the curriculum's `defaultActive` tracks when `plan.trackOrder` has at most one
entry; `app/src/ui/screens/TodayScreen.ts:289` and `:300` pass `plan.trackOrder` (`['core']`
on a fresh phone, `app/src/data/planStore.ts:13`) straight to `nextRecommended`. Add
`activeTracksFor(plan, curriculum): string[]` in `app/src/curriculum/` (pure, exported), use
it everywhere `trackOrder` is read as "active", and test: a fresh plan yields the
`defaultActive` set in curriculum order; an edited order is returned as-is. E2E: a fresh
profile's Today shows a *New* row from a non-core default-active track once the core path is
complete (seed progress through `window.__pianopath.recordRun`).

**A2 — The needs line counts what is on the rung now (C3).** `LessonScreen.ts:137–156`
prints the build-time `needs` block; `curriculum/load.ts` overlays imports and shelf pieces
at runtime and nothing recomputes the shortfall. Compute it at runtime from the overlaid
lesson using `needs.floor` and the same song-optional rule `validate.py`'s `write_needs`
uses; keep `needs` for the floor. Unit test: a rung short by one song plus one assigned
import reports nothing short. E2E through `#/library?for=`.

**A3 — "Added" in the folder screen keys on the file, not the title (C4).**
`FolderScreen.ts` `restore()` builds `alreadyAdded` from folded import titles. Give
`ImportRow` an optional `origin: { folder: string; file: string }` set by `addFromFolder`
(`data/folderLibrary.ts`); match on it; fall back to the title only for imports with no
origin. `DB_VERSION` stays. Unit test with two same-titled rows; backup round-trip keeps
`origin`.

**A4 — `showDirectoryPicker` where it exists, behind a setting (C5).** MDN's compat data
puts it in Chrome for Android from 132; the S25 has not been tried. In `folderLibrary.ts`:
if `'showDirectoryPicker' in window` **and** a new setting `folderHandles` (default off,
Settings → Content, "Remember the score folder") is on, use it, store the handle in the
`folderLibraries` row, and on Add call `queryPermission`/`requestPermission({ mode: 'read' })`
before reading; on any failure fall through to the existing `webkitdirectory` path and
message. The setting goes through `coerceSettings`. Unit tests with a fake handle: grant,
deny, missing API. The docs' platform sentence is reworded in §A12; the owner flips the
setting after trying it.

**A5 — `coerceSettings` round-trip test (§5 of the review).** A unit test that every key of
`DEFAULT_SETTINGS` survives `coerceSettings({ ...DEFAULT_SETTINGS, [key]: <a non-default
valid value> })`, generated from the object rather than a hand list.

**A6 — `compositionStatus` on the item (C9).** `tools/content/import_pdmx.py` `build_item`
writes the status only into `editionNotes`. Emit it as an optional catalog field (schema
enum `pd | unknown | in-copyright`; `CatalogItem` type); the Library detail sheet shows
*in copyright* / *status unknown* on a `personal-build` row. Python test on the fixture; a
unit test for the sheet text.

**A7 — A personal build must validate (C11).** `import_musetrainer.py` *excludes* its six
composition-refused files in a strict build and admits them under `--personal`, so the two
catalogs differ by six ids and the committed `docs/generated/ladder.md` can match only one.
Make those six strict-build placeholders (no file, an `importHint`, the `personal-build`
tag) exactly as `import_pdmx.py` does. Test on the fixture: build both ways, assert equal id
sets. Then `build.py --offline --personal` and `build.py --offline --strict-license` must
both validate against the one committed report; paste both summaries.

**A8 — The shelf block disappears when the shelf is empty (review §3).** On the lesson page
the "From your own books" section renders only when the rung has a `paperOption` or the
owner has at least one book; otherwise the `paperHint` is one muted line under the finder
row. E2E on a fresh profile.

**A9 — The ladder-report check says so when it is off.** `validate.py` `stale_ladder_report`
returns `[]` when the report file is absent, by design. Keep that and print a warning line
every run in that case, the way the estimated-level count is printed. Test.

**A10 — The stray fixture (C8).** Move `content/scores/pdmx/QmFixtureBachMinuet.mxl` to
`tools/content/tests/fixtures/pdmx/`, point `test_pdmx.py` at it, delete
`content/scores/pdmx/.gitkeep`. `offline.spec.ts`'s "a PDMX file is precached" assertion
must still pass on a strict build.

**A11 — The laptop as the origin: script, test, and the APK script (D25).**
`packaging/serve-lan.py` serves `app/dist` over HTTPS with a mkcert certificate from the
gitignored `packaging/lan/`. Give it a test: start it on a free port with a throwaway
self-signed certificate the test makes with `openssl` (skip with a message if `openssl` is
absent), fetch `/index.html`, a `.mxl`, `manifest.webmanifest` and `sw.js`, assert the MIME
types, the `Cache-Control` headers and `Service-Worker-Allowed`, and that two requests reuse
one connection. Then fix `packaging/build-apk.sh`: it runs `npm run build`, whose `prebuild`
rebuilds content through `python3` — the Windows Store stub — and would rebuild *without*
`--personal`. Make it run `npm run build:app`, refuse to start if
`app/public/content/catalog.json` is missing, and say to build content with `--personal`
first. Make `app/package.json`'s `content:build` work on Windows: a tiny
`tools/content/python.cjs` shim that runs `py -3.11` when `python3` is not a real
interpreter.

**A12 — The documents (review §2, every row).** Edits, not rewrites, except where the table
says rewrite. `README.md` status block (P0–P18 built, 1,527 items, 93 lessons, this pass as
the last session); `docs/00-overview.md` §1 replaced by a shortened form of the review's §1,
§6 refreshed, A2 corrected to what `00-tracks.json` and A1 make true, "superseded by"
markers on D9/D10/D10a/A6, D20's numbers re-measured, D23 made true by A6; `docs/01` §6 and
§7 to one measured figure with the command pasted, §4.5 gains `books` and `DB_VERSION` 5, §9
rewritten for D25 (laptop origin, mkcert, port 443 and the assetlinks file for the APK, no
`main`, no Pages after the private move, no third-party host); `docs/02` Part C gains a
paragraph each for 4.7, the technique rungs and the practice module, and Part A §8's
sight-reading line matches `session.ts`; `docs/03` §3 rewritten to the steps `build.py`
actually runs; `docs/04` §5c "twelve" → nineteen; `docs/04` §4b, `00` D24, `01` §4.5 and the
`folderLibrary.ts` header: the `showDirectoryPicker` sentence becomes "MDN lists it from
Chrome for Android 132; until the owner confirms it on the S25 the app re-picks the folder,
and the *Remember the score folder* setting turns the stored handle on"; `docs/06` §1 no
`main`, §2 table gains P19; a short `docs/decisions/2026-09-06-p12a-technique-families.md`
written from `git log 36b8b53^..36b8b53` and its diff (what was decided and why, a page).
`--allow-nc` must not appear outside decision notes: paste `git grep -n -- "--allow-nc" docs
README.md prompts` at the end.

**A13 — `pages.yml` stays.** The owner tests on Pages *before* going private. Do not delete
the workflow. Instead confirm it still does what `03` §1 requires — `build.py
--strict-license` — and note in `docs/01` §9 that the workflow is deleted at the private
move, not before.

---

## B. Hunt for what the review missed

The review found eleven things in a day by reading code against requirement and code against
the rest of the code. Spend real time — at least a third of the session — doing the same,
and report every finding as **confirmed** (you ran or read the exact lines) or **suspected**
(what would settle it), with file and line. Fix what is confirmed and small; list the rest.
A finding that turns out fine is worth a line saying what you checked.

The species, with the review's example of each (do not re-report those):

- a conditional rule implemented unconditionally (the assign sheet opening on every import);
- a check that depends on something not guaranteed (the section bound read from a later
  build step; the ladder report matching one build flavour);
- a control live before its dependency exists (the section picker);
- an allow-list that silently drops what is new (`coerceSettings`);
- a pattern narrower than the data it matches (`LESSON_ID_PATTERN`; the folder screen's
  title match);
- a number quoted from a biased sample (the 499 MB archive);
- a port that agrees in shape but not in detail (the difficulty model);
- a document asserting behaviour the code does not have (`00` A2's default tracks; D23's
  field; D24's platform claim);
- the same rule implemented in two places, one of them wrong (Today versus Plan).

Places to point the torch, none of which is a hint that something is wrong there:

- **Every screen's empty and error states**, on a fresh profile and with storage refused:
  no catalog, a lesson whose every option is an import placeholder, a folder listing whose
  files are gone, a book with no pieces, a PDF with no detectable systems, the mic denied,
  no MIDI, a share that delivers a `.pdf`, a backup file from a newer version.
- **The overlay.** An import assigned to a lesson that no longer exists; a shelf piece whose
  twin was deleted; the same import assigned to two rungs; an id collision between an import
  and a bundled item.
- **The two builds.** After A7, diff the strict and personal `catalog.json` by id and by
  field: the only differences should be `file`, `importHint`, `tags` and `source.checksum`.
  Anything else is a finding.
- **The render manifest and the cache** under a changed converter: bump a comment in
  `convert.py`, rebuild, and confirm every conversion re-runs and every file re-renders.
- **The service worker after A6/A10**: `offline.spec.ts`'s manifest assertion against the
  *built* precache list, plus a check that nothing in `app/dist/content` is *not* in the
  precache manifest (the inverse of the existing test — a file served but never cached).
- **Time and tempo arithmetic**: a 6/8 piece at ♩.=60 through `beatToMs`, the paper screen's
  click-to-onset mapping when the AudioContext clock and `performance.now()` drift, the
  rhythm drill's count-in when the tempo changes mid-drill.
- **The difficulty model's fallback path**: delete `level-model.json` from the built content
  and import a score — the sheet must say "no estimate", not show 5.
- **Numbers in the documents** you have not already re-derived: test counts, byte counts,
  item counts, "N of M" claims. Re-run and correct.
- **`docs/OWNER-GUIDE.md` §8's thresholds**: each named constant must exist at the path the
  guide gives; the guide is the one document the owner follows step by step.

---

## C. Prove the build

Everything here is pasted into the report, verbatim, with the command that produced it.

**C1 — Both builds, both validations, the full render.**
`build.py --offline --strict-license --render --render-limit 0` after deleting
`build/render-manifest.json` (a *full* engrave of every file, not the incremental check);
then `build.py --offline --personal` and `validate.py --personal` on its output. Paste the
render summary, every flagged item (pace, hands, console lines), and the two validation
summaries. Anything the full render fails on is a finding.

**C2 — The three suites, twice.** `python -m unittest discover -s tools/content/tests -t
tools/content`, `npm run lint && npm run typecheck && npm test`, `npm run e2e` — once as
normal, once with `--repeat-each=2` for the e2e suite to shake out the two flaky tests P11
named (`chart.spec` swing toggle, `drills.spec` sight-reading). Fix any flake at its cause,
not with a retry.

**C3 — New sweeps, as e2e tests that stay in the suite:**
- every lesson page opens by URL, renders its options, its needs line, its finder and (where
  set) its lock badge, with no console error — all 93, iterated from the built curriculum;
- every runtime drill kind runs a scripted set to its result sheet, and every drill *item*
  in the catalog builds (extend `drillFromCatalog.test.ts` if it does not already read the
  shipped catalog for all 63);
- one item of every type and every source opens where `ui/openItem` says it should — a
  bundled song, a generated exercise, a PDMX song, a placeholder, an import, a PDF, a shelf
  piece, a blind run, a performance run;
- the folder screen with a synthetic 37,261-row manifest: pick, browse, filter and add,
  with the time to first paint of the list logged; and the same with no manifest;
- the assign flow from a simulated share and from "Import for this rung";
- backup export/import with every store populated, on a database upgraded from version 1
  through 5 (extend the existing upgrade test to start at each old version);
- the offline session from `offline.spec.ts`, widened to open a PDMX song, a tips file, a
  concept finder and the level model with the network off.

**C4 — The PWA audit.** `npm run pwa:audit` on the built app; paste the eighteen checks and
the Lighthouse scores. Anything below the P9 baseline (performance 98) is a finding.

**C5 — Performance under throttling.** `tests/e2e/perf.spec.ts` at ×4 CPU, plus one new
measurement: the longest score in the catalog (the render manifest knows which) opened on
the Score screen in window layout, time to first window painted. Record it in `01` §6.

**C6 — The Pages deploy, end to end.** Push the branch. CI must be green. Then merge (or
have the owner merge) and confirm the Pages workflow succeeds; fetch the Pages URL's
`sw.js` and count its precache entries against `catalog.json`'s file count — they must
match the strict build. Paste the URL and the two numbers.

**C7 — The owner's Pages test script.** Append to `docs/OWNER-GUIDE.md` a section "Testing
on Pages before going private": ten numbered checks, each one screen and one expected
result, in the order that finds the worst failure first — install from Chrome; Diagnostics
shows precached *n of n*; MIDI connects and the strip lights; open a Stage 1 song in Wait
mode and play it on the piano; open a drill; open a lesson and tap Find more; import a
`.mxl` by share; browse the score folder (`library.json` from `build/pdmx/`); airplane mode
from the second launch; export a backup. Say for each what "wrong" looks like and which
Diagnostics line to send back. Say plainly that the Pages build is the strict one, so the
159 personal-build scores show as placeholders there and appear only in the laptop install.

---

## Acceptance

- Every §A item done with its test, or listed under Not done with the reason.
- §B: at least the nine species considered, each with a finding or a "checked, fine"; every
  confirmed finding either fixed here or in Follow-ups with file and line.
- §C1–C6 pasted in full; C7 present in the guide.
- All suites green, including the new sweeps; CI green on the pushed branch; Pages deploy
  succeeded and its precache count matches.
- Report ends with **Questions for the owner** — at most five, each answerable in a
  sentence — and a one-paragraph "what to expect on the phone" that names the things only
  the S25 can decide (Web MIDI in Chrome, the mic in a real room, `showDirectoryPicker`,
  37,261 files through the picker, the five thresholds in the guide's §8).

**Cannot be checked in the container:** anything on the phone; the mkcert certificate
against Chrome on Android; the APK. Those are the owner's, after his Pages test.
