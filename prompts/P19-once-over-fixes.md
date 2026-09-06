# P19 — The once-over's fixes: five bugs, one field, and every document told the truth  ·  Intended model: **Opus 5**  ·  Branch: `feat/p19-once-over`

Work on branch `feat/p19-once-over`, created from `claude/piano-teaching-app-bo19td` (there is
no `main`). Commit early and often with conventional-commit messages. Never mention AI model
names in commit messages or in code. Verify by commands you actually run and paste the exact
results — do not claim something works because it should. Keep to the scope; list anything
out of scope under "Follow-ups". Where a decision has no obvious default, take the simpler
option and say so. Report as **Done · Not done/blocked · Follow-ups · Questions for the
owner · Files touched**. Any deviation from the docs gets a note in
`docs/decisions/<date>-<topic>.md`.

## Context you need, because you have not read the review

PianoPath is an offline-first piano-teaching PWA for one person, one Galaxy S25 and one
Roland HP-130 over USB MIDI: Vite + TypeScript + vanilla DOM in `app/`, a Python 3.11 +
music21 content pipeline in `tools/content/` that builds `app/public/content/` (1,527 catalog
items, 93 lessons), delivered as a TWA APK from a private repository. Phases P0–P18 are
built and merged. A review (`docs/decisions/2026-09-06-once-over.md` — read it first, it is
short) found the items below. Each is stated with the file and line it was found at so you
can confirm it before touching it. The house rule for every fix: it arrives with the test
that would have caught it.

Environment: Python 3.11 (`py -3.11` on Windows, `python3` on Linux), Node 22 in CI and
Node 24 locally, `pip install -r tools/content/requirements.txt`, `npm ci` in `app/`, and
`npx playwright install chromium`. All three suites are green at the start (481 Python,
1,310 unit, 236 e2e); keep them so.

## Build / verify

### Code

1. **One rule for which tracks are active.** `app/src/ui/screens/PlanScreen.ts:258–261`
   falls back to the curriculum's `defaultActive` tracks when `plan.trackOrder` has at most
   one entry; `app/src/ui/screens/TodayScreen.ts:289` and `:300` pass `plan.trackOrder`
   (`['core']` on a fresh phone, `app/src/data/planStore.ts:13`) straight to
   `nextRecommended`. Add `activeTracksFor(plan, curriculum): string[]` in
   `app/src/curriculum/` (exported, pure), use it in both screens and anywhere else
   `trackOrder` is read as "active", and test: a fresh plan yields the `defaultActive` set in
   curriculum order; an edited order is returned as-is. E2E: a fresh profile's Today shows a
   *New* row from a non-core default-active track once the core path is complete (seed
   progress through `window.__pianopath.recordRun`).
2. **The needs line counts what is on the rung now.** `app/src/ui/screens/LessonScreen.ts:137–156`
   prints the build-time `needs` block; `app/src/curriculum/load.ts` overlays imports and
   shelf pieces onto `songOptions`/`paperOptions` at runtime. Compute the shortfall at
   runtime from the overlaid lesson using `needs.floor` and the same song-optional rule
   `validate.py`'s `write_needs` uses (both lists together when `songOptional`); keep
   `needs` for the floor. Unit test: a rung short by one song, plus one assigned import,
   reports nothing short. E2E: assign an import to a thin rung via `#/library?for=` and the
   line changes.
3. **"Added" in the folder screen keys on the file, not the title.**
   `app/src/ui/screens/FolderScreen.ts` `restore()` builds `alreadyAdded` from folded import
   titles. Give `ImportRow` an optional `origin: { folder: string; file: string }` set by
   `addFromFolder` (`app/src/data/folderLibrary.ts`), match on it, and fall back to the title
   match only for imports with no origin. `DB_VERSION` stays (optional field). Unit test with
   two same-titled rows where one is added; backup round-trip keeps `origin`.
4. **`showDirectoryPicker` where it exists, behind a flag.** MDN's compat data puts it in
   Chrome for Android from 132; the S25 has not been tried. In `folderLibrary.ts`: if
   `'showDirectoryPicker' in window` **and** a new setting `folderHandles` (default off,
   Settings → Content, "Remember the score folder") is on, use it, store the
   `FileSystemDirectoryHandle` in the `folderLibraries` row (structured-clonable), and on
   Add call `queryPermission`/`requestPermission({ mode: 'read' })` before reading; on any
   failure fall through to the existing `webkitdirectory` path with the existing message.
   The setting goes through `coerceSettings`. Unit tests with a fake handle for the grant,
   the deny and the missing-API cases. Do not change the docs' platform claim yet — item 15
   words it as "to be confirmed on the phone"; the owner turns the flag on after trying it.
5. **`coerceSettings` round-trip test.** `app/src/data/settingsStore.ts:139` copies known
   keys by hand and silently dropped `strictPrerequisites` once. Add a unit test that every
   key of `DEFAULT_SETTINGS` survives `coerceSettings({...DEFAULT_SETTINGS, [key]: <a
   non-default valid value>})` — generated from the object, not a hand list.
6. **`compositionStatus` on the item.** `tools/content/import_pdmx.py` `build_item` knows the
   status and writes it only into `editionNotes`. Emit `compositionStatus` (`pd` /
   `unknown` / `in-copyright`) as an optional catalog field (schema enum; `CatalogItem`
   type); the Library detail sheet shows *in copyright* / *status unknown* on a
   `personal-build` row. Python test on the fixture; a unit test for the sheet text.
7. **The shelf block disappears when there is nothing on the shelf.** On the lesson page, the
   "From your own books" section and its heading render only when the rung has a
   `paperOption` or the owner has at least one book; the `paperHint` becomes one muted line
   under the finder row otherwise. E2E on a fresh profile.
8. **The ladder-report check says so when it is off.** `tools/content/validate.py`
   `stale_ladder_report` returns `[]` when `docs/generated/ladder.md` is absent. Keep that
   behaviour and print a warning line every run in that case ("no ladder report committed —
   the staleness rule is not running"), the way the estimated-level count is printed. Test.
9. **The stray fixture.** Move `content/scores/pdmx/QmFixtureBachMinuet.mxl` to
   `tools/content/tests/fixtures/pdmx/`, point `test_pdmx.py` at it, delete
   `content/scores/pdmx/.gitkeep` (real files live there now). `offline.spec.ts`'s "a PDMX
   file is precached" assertion must still pass on a strict build — it does today with the
   63 public-domain files; confirm.
10. **Delete `.github/workflows/pages.yml`** — but only if the repository is private when you
    run (`gh repo view --json isPrivate` or the API). If it is still public, leave the file
    and say so under Not done: the owner's first step is to make it private.
10a. **The laptop as the origin (`00` D25, added after the review).** `packaging/serve-lan.py`
    serves `app/dist` over HTTPS with a mkcert certificate from the gitignored
    `packaging/lan/`. Give it a test: start it on a free port with a throwaway self-signed
    certificate made by the test (`openssl` is in Git for Windows and on Linux; skip the
    test with a message if it is absent), fetch `/index.html`, a `.mxl`, `.webmanifest` and
    `sw.js`, and assert the MIME types and the `Cache-Control` headers the script promises.
    Then fix `packaging/build-apk.sh`: it runs `npm run build`, whose `prebuild` rebuilds
    the content through `python3` — which on Windows is the Store stub, and which would
    also rebuild *without* `--personal`. Make it run `npm run build:app` and refuse to start
    if `app/public/content/catalog.json` is missing, telling the owner to build content with
    `--personal` first. `app/package.json`'s `content:build` should call `py -3.11` when
    `python3` is not a real interpreter — simplest: a tiny `tools/content/python.cjs`
    shim that picks whichever exists, used by the script.
10b. **A personal build must validate (review C11).** `import_musetrainer.py` excludes its
    six composition-refused files in a strict build and admits them under `--personal`, so
    the two catalogs differ by six ids and the committed `docs/generated/ladder.md` can only
    match one of them. Make those six strict-build *placeholders* (no file, an `importHint`,
    the `personal-build` tag) exactly as `import_pdmx.py` does, so both builds carry the
    same ids. Test on the fixture: build both ways, assert equal id sets. Then
    `build.py --offline --personal` and `build.py --offline --strict-license` must both
    validate against the one committed report; paste both.

### Documents (edits, exactly as the review's §2 table says; quote the review's wording)

11. `README.md`: rewrite the status paragraph and the phase table for P0–P18 built, 1,527
    items, 93 lessons, and "next: nothing is queued — see the once-over".
12. `docs/OWNER-GUIDE.md` §1 was **already rewritten** with D25 (the laptop as the origin,
    mkcert, `--personal`). Read it, keep it true after your changes, and do not reintroduce
    a third-party host anywhere.
13. `docs/00-overview.md`: replace §1 with a shortened form of the review's §1 (ten lines);
    refresh §6; correct A2 to what `00-tracks.json` and item 1 make true; mark D9, D10, D10a
    and A6 "superseded by …" as D22 is; put today's numbers in D20 (12.2 MB, 1,256 files,
    1,527 items); make D23 say the field is on the item (item 6).
14. `docs/01-architecture.md`: §6 and §7 to one measured figure (re-measure after your
    build and paste the command); §4.5 gains the `books` row and says `DB_VERSION` 5; §9
    rewritten for `00` D25 — the laptop over the LAN with `packaging/serve-lan.py` as the
    origin, mkcert for the certificate, port 443 and the assetlinks file for the APK, no
    `main`, no Pages, no third-party host.
15. `docs/04-ui-spec.md` §4b, `docs/00` D24, `docs/01` §4.5 `folderLibraries`,
    `app/src/data/folderLibrary.ts` header, OWNER-GUIDE §4 "A whole folder of scores": the
    `showDirectoryPicker` sentence becomes "MDN lists it from Chrome for Android 132; until
    the owner confirms it on the S25 the app re-picks the folder, and the *Remember the score
    folder* setting turns the stored handle on". `04` §5c: "twelve faces" → nineteen.
16. `docs/02-curriculum.md`: Part C gains a paragraph each for **4.7 Learning it from
    memory**, the **technique rung per stage (4–8)** and the **practice module (five
    lessons)**, in the existing format; Part A §8's "taken from free play" line matches
    `session.ts` (free play removed from the 30, one minute from repertoire).
17. `docs/03-content-pipeline.md` §3: rewrite the step list to what `build.py` runs (fetch,
    import MT, import KERN, import PDMX, generate, author, merge, curriculum + concepts +
    finder generation, lessons, tips + index, schemas, level model, validate, optional render
    via `render_check.py`), and stop saying `validate.py` renders.
18. `docs/06-build-plan.md` §1: no `main`; §2 table gains P19 as done when you finish.
19. **A P12a decision note**, `docs/decisions/2026-09-06-p12a-technique-families.md`, written
    from `git log 36b8b53^..36b8b53` and the diff: the level table, the families added, the
    orphan rule becoming an error, the payload change. A page; what was decided and why, not
    a changelog.

## Acceptance

- `py -3.11 -m unittest discover -s tools/content/tests -t tools/content` (or `python3`)
  green, with the new tests; `python3 tools/content/build.py --offline --personal` and
  `validate.py --strict-license` on the same output both clean; paste both summaries.
- `npm run lint && npm run typecheck && npm test && npm run e2e` green with the new tests.
- Paste `git grep -n -- "--allow-nc" docs README.md` — it must return only decision notes.
- Report the measured payload you wrote into `01`, the Chrome-version question for the owner
  (item 4), and whether item 10 was done.

**Cannot be checked in the container:** `showDirectoryPicker` on the S25 (item 4 — the owner
turns the flag on after trying it), and whether 37,261 files through the picker are fast
enough on the phone. Both are on the owner's list in the review's §7.
