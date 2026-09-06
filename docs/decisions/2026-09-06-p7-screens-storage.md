# P7 — screens and storage: what was decided along the way

Date: 2026-09-06 · Branch: `feat/p7-screens` · Prompt: `prompts/P7-app-screens-storage.md`

Every decision here is a place where the docs gave no default, or where following the
letter of the spec would have produced something worse. Each says what was chosen and why,
so a later phase can disagree with the reasoning rather than guess at it.

---

## 1. Settings live in IndexedDB, mirrored to localStorage

`01` §4.5 puts settings in an IndexedDB `settings` store. `getSettings()` is called from
inside a render pass in about a dozen places and IndexedDB is asynchronous, so a literal move
would have meant threading a promise through the Score screen's paint path — the one place in
the app with a 16 ms budget.

**Decided:** `data/persist.ts` is a write-through cache. IndexedDB is the store of record and
therefore what a backup carries; localStorage is the synchronous read path; every write goes
to both; `hydratePersisted()` reconciles them once at boot, with localStorage winning when it
has a value and IndexedDB filling it in when it does not. That last case is what makes a
restored backup, and a device whose localStorage was cleared, both come back.

The four mirrored keys are `pianopath.settings`, `.midi`, `.micCalibration` and `.theme`.
`midiSettings`, `micCalibrationStore` and `ui/theme` now write through the same function, so
the promise each of them made in P1 ("P7 re-points this at IndexedDB without any caller
noticing") is kept.

## 2. Imports are merged into the catalog, not kept beside it

An imported score gets a synthesised `CatalogItem` with `imported: true`,
`source.license: "user-imported"` and an `import.<slug>` id, and `curriculum/load.allItems()`
merges it into the same index as the bundled catalog. Search, the swap sheet, the session
builder and `#/score/<id>` therefore cannot tell a bought score from a bundled one, which is
what "first-class" in the prompt has to mean in practice.

An unlabelled import defaults to **level 5**, not 0. A bought score is far more likely to be
beyond the current lesson than below it, and level 0 would have the session builder offering
Rachmaninoff as a warm-up.

A bundled item always wins an id collision.

## 3. PDF cut lines are stored as fractions, in pairs

`04` §5b requires "adjust cuts" and says why: `pdf/systems.ts` assumes a clean, digitally
typeset page, so one bad detection makes a bought PDF useless.

**Decided:** `imports.cuts` is `Record<pageIndex, number[]>` — a flat, sorted, even-length list
of **fractions of the page height**: `[top0, bottom0, top1, bottom1, …]`.

- *Fractions, not pixels*, because the page renders at whatever width the phone asks for and a
  correction dragged in portrait has to survive a rotation, a reload at a different device
  pixel ratio, and an export onto another phone.
- *Pairs, not single dividing lines*, because the gap between two systems is real. One list of
  boundaries would force every system to start where the last one ended, dragging half the next
  stave into view.

Stored corrections always beat detection: the learner has already said what the page is.
A page the detector finds nothing on falls back to the whole page rather than to an empty
viewer, so "adjust cuts" always has something to correct.

## 4. Timed page-turn is bpm × bars-per-system

`04` §5b asks for "timed auto-advance at a bpm the learner sets". A PDF has no notes, so the
app cannot know how many bars a system holds. Rather than invent a number, the viewer asks:
bpm and **bars per system** (default 4), and advances every `bars × 4 × 60/bpm` seconds. The
metronome can click alongside, which is the owner's standing request that a metronome work
while sheet music is on screen.

## 5. The share target is answered inside the service worker

Android delivers a shared file as a multipart POST to the app's start URL, and there is no
server. `public/share-target.js` is imported at the top of the generated Workbox worker (so it
sees the POST before Workbox's GET-only routes), parks the files in a `pianopath-shared` cache
and redirects to `#/library`; the Library screen drains that cache on load and imports them.
The cache is drained rather than read, or a reload would import the same file twice.

**Untested on a real phone.** There is no way to fire a genuine Android share intent from
Playwright; the code path is written and the manifest declares it, and P9's on-device checklist
is where it gets confirmed.

## 6. `.mjs` had to go into the precache globs

`pdfjs-dist` ships its worker as `pdf.worker.min.mjs`. The globs matched `js` only, so the
worker was built, hashed, and then **silently left out of the precache** — Workbox does not
warn. The app would have worked perfectly until the first time a PDF was opened with no
network. This is the second time this exact failure mode has been hit (the soundfont was the
first), which is why `04` §7b puts "precached n of m files, with the missing ones named" on the
Diagnostics screen; that block now exists and would have caught it.

## 7. Two behaviours the session builder has that `04` §2 does not describe

Both were found by the tests rather than by reading, and both are cases where following the
spec literally produced a worse screen:

- **A row that cannot be filled is dropped, not shown empty.** On a fresh Stage 0 profile the
  120-minute template produced three filled rows and six empty ones. An empty row is a hole the
  learner has to fill by hand, which is what the card exists to avoid. Free play is the
  exception: it never has an item because it is a prompt, not a piece.
- **"Swap this" has a fourth, loosest tier.** `alternativesFor`'s three tiers (the lesson's
  other options, the item's `alternatives[]`, same level plus a shared concept) genuinely come
  up empty at Stage 0 — few drills, few shared tags — and a swap button that offers nothing is
  a dead button. `swapOptions` falls back to anything playable of the same type within one
  level.

The review and repertoire rows also fall back further than `04` §2 implies (to *something at
this level* when nothing is due and nothing is mastered), because "nothing due" is what the
whole first week looks like.

## 8. "I already know this" marks exactly what completes the lesson

The obvious implementation — self-pass the first two options — leaves the lesson showing "in
progress" for a lesson that needs one exercise *and* one song, which makes an honour-system
button feel broken. `selectors.idsToCompleteLesson(lesson)` returns exactly the ids
`lessonComplete` checks for, honouring `songOptional`, and both "I already know this" and "Mark
lesson done" use it.

Self-passes keep their own badge ("you said you know it") and their own `selfPassed` flag. Six
months on, the difference between "the app watched me play this" and "I said I could" is the
only thing that makes the record worth anything.

## 9. Backup: merge by default, base64 for bytes

The app keeps a year of practice on one phone with no server copy, so the backup file is the
whole story.

- **Imports are included.** They are by far the largest thing in the file, and the only thing
  that cannot be re-downloaded.
- **Restore merges by default**, with the device's progress row winning when it is further
  along; `replace` is opt-in, for moving to a new phone. Restoring last week's backup by
  mistake must not delete this week's practice.
- **Merged session rows get fresh keys.** Autoincrement ids collide across devices, and
  overwriting a run that actually happened is data loss.
- **Binary is base64**, inflating it by a third. The alternative — a zip — would mean owning a
  container format for a file nothing else reads.

## 10. A test hook ships in the build

`app/src/app/testHooks.ts` exposes `window.__pianopath` with `recordRun`, `exportAll`,
`importAll` and `wipeForTest`. The e2e acceptance criterion is "a run recorded today comes back
for review tomorrow", which through the UI alone means either waiting a day or threading a
clock-injection seam through five screens; and export-through-the-UI drives a native file
dialog Playwright cannot see.

This follows the precedent `DevScoreScreen` set with `window.__pianopathDevScore`, and it is
harmless in a personal build that ships to one phone (`00` D19). If the repo ever goes public
or multi-user, both hooks should go behind a build flag.

## 11. Small things

- **`content/catalog.schema.json`**: `file` now accepts `.pdf` and carries a pattern; the
  content render check skips `.pdf` items, since OSMD could never render one.
- **`fake-indexeddb`** was added as a dev dependency. The export/import and imports-store
  behaviour cannot be tested without a real IndexedDB, and those are exactly the parts where a
  silent failure loses the owner's data.
- **The router** gained `#/pdf/<id>`, `#/lesson/<id>` and `#/chart/<id>`, all validated the
  same way `#/score/<id>` already was.
- **Action buttons inside a list row stop click propagation.** Without it, "Edit" opened the
  score as well as the editor.
- **A fresh import re-sorts Library to "yours first"**, because you import a score in order to
  play it, not to find it 300 rows down a level-sorted list.

## What is not done

**Two of these were done in P18** (`docs/decisions/2026-09-06-p18-carry-overs.md`):
drag-to-reorder is a pointer-event drag with move buttons as the fallback, and the chord
chart's loop gained bass and drums. The share intent still needs a real phone, and Quick check
is unchanged. The original entries follow.

- The Android **share-target intent and file handler** are declared and implemented but have
  only been tested through the cache-draining code path, not a real intent (see §5).
- The **chord chart's backing loop** is the metronome plus a block-chord comp on each bar. A
  proper backing track (bass and drums) is not built; `04` §3b calls the loop optional.
- **Drag-to-reorder tracks** (`04` §3, "ordering by drag") is a toggle list, not a drag list.
  Order is stored and honoured by the session builder; only the gesture is missing.
- **Quick check** opens the lesson's first drill for a measured run rather than assembling a
  bespoke 2–3 minute test; the drill UI itself is P8.
