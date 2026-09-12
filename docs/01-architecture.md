# 01 — Architecture

This document is normative for builders. Where it says MUST, do it that way; where it says
SHOULD, deviate only with a written note in `docs/decisions/` explaining why.

## 1. Platform and runtime

- **Target:** Chrome for Android (stable) on Samsung Galaxy S25, installed as a PWA
  ("Add to Home screen"). Also runs in desktop Chrome/Edge for development.
- **Why Chrome specifically:** Web MIDI API is implemented in Chromium browsers. Since Chrome 124
  (2024) *all* MIDI access, not just SysEx, is behind a permission prompt triggered by
  `navigator.requestMIDIAccess()`. The app MUST call it only from a user gesture (tap on
  "Connect piano") and MUST explain the prompt beforehand.
- **Secure context:** Web MIDI, service workers, Screen Wake Lock, and file pickers require
  HTTPS (or `localhost`). Dev is `localhost`; the Pages deploy is HTTPS. Inside a TWA the
  origin is the one the APK is signed against, and Digital Asset Links make it a secure
  first-party context, so all four keep working (`00` D19).
- **Samsung Internet** also supports Web MIDI; treat as a bonus, test only Chrome.
- **Not supported by design:** iOS Safari (no Web MIDI), Firefox Android.
- **Packaging: a Trusted Web Activity (TWA) APK via Bubblewrap** — decided 2026-09-05
  (`00` D19), no longer optional. A TWA wraps the *real Chrome*, so Web MIDI keeps working.
  A Capacitor/WebView wrap would NOT be guaranteed to expose Web MIDI — do not use it.
- **Offline-first (`00` D20):** a TWA loads its start URL over HTTPS, so an origin has to
  exist — but only at install and update time. The service worker precaches the shell and the
  whole content library on first launch, and every launch after that is served from the cache
  with the network unreachable. See §7 and §9.

## 2. Repository layout (monorepo, npm workspaces not required)

```
app/                     – the PWA (Vite + TypeScript)
  index.html
  public/
    manifest.webmanifest
    icons/
    content/             – BUILD OUTPUT of the content pipeline (scores, catalog.json, curriculum.json, soundfont)
  src/
    main.ts              – bootstrap, router
    ui/                  – screens and components (see 04-ui-spec.md)
    score/               – OSMD wrapper, ScoreModel extraction, windowed renderer, cursor/overlay
    pdf/                 – systems.ts (page → staff systems), systemPlan.ts (fractional cut storage + corrections), PdfDocument.ts (pdfjs wrapper)
    engine/              – practice-mode state machines, matcher, scorer, clock (pure TS, no DOM)
    input/               – InputSource interface + WebMidiSource, ScreenKeyboardSource, ReplaySource, MicSource facade
    audio/               – Web Audio player (smplr piano), metronome scheduler
    audio/pitch/         – AudioWorklet + score-informed note/chord detector + calibration
    data/                – IndexedDB (db.ts) + one store module each: progressStore, planStore, skillsStore, importStore,
                           folderLibrary (a folder of scores on the phone, 04 §4b), settingsStore/persist, backup (export/import)
    curriculum/          – loaders + selectors over curriculum.json/catalog.json, and session.ts (today's session from the Part A §8 templates)
    util/
  tests/
    unit/                – Vitest (engine, ScoreModel, curriculum selectors)
    e2e/                 – Playwright (headless Chromium; mocked Web MIDI)
  vite.config.ts, tsconfig.json, package.json
content/                 – SOURCE content (not the build output)
  catalog.schema.json, curriculum.schema.json
  curriculum/            – stage-*.json (human-editable)
  scores/
    authored/            – our own arrangements: ABC / tinyNotation / MusicXML written by builders
    imported/            – raw files fetched from public-domain sources (+ SOURCES.md with provenance)
    generated/           – nothing committed; produced by tools/content at build time
    pdmx/                – converted scores the PDMX quarry kept, one per row of
                           content/sources/pdmx.json (replan §2.1). Tracked, like authored/:
                           the 4 GB archive they came from is on the owner's machine and
                           never enters the repository or CI, so what is committed is the
                           normalised .mxl and its checksum.
  lessons/               – markdown lesson text (one file per lesson id)
tools/content/           – Python: fetch, convert, generate, validate, build catalog.json
docs/, prompts/
.github/workflows/       – ci.yml (lint, typecheck, unit, e2e), pages.yml (build content + app → Pages)
```

## 3. Core dependencies (pin exact versions in package.json; verified available Sept 2026)

| Package | Version | Role | License |
|---------|---------|------|---------|
| `opensheetmusicdisplay` | 2.1.2 | MusicXML → SVG rendering, cursor, measure-range rendering | BSD-3 |
| `smplr` | 1.x | Sampled piano (Web Audio), loads soundfont from bundled files | MIT |
| `vite` | 8.x | build/dev | MIT |
| `vite-plugin-pwa` | 1.x | manifest + Workbox service worker (precache everything under `public/content`) | MIT |
| `idb` | latest | tiny IndexedDB promise wrapper | ISC |
| `pdfjs-dist` | 5.4.394 | renders an imported PDF page to a canvas for the one-system-at-a-time viewer (P7). Loaded as its own chunk — a learner who imports no PDFs never parses it. Its worker is `pdf.worker.min.mjs`, so the precache globs MUST include `mjs` | Apache-2 |
| `fflate` | 0.8.3 | unzips `.mxl` (compressed MusicXML) with no server | MIT |
| `fake-indexeddb` (dev) | 6.x | a real IndexedDB for the unit tests; the export/import and imports-store tests cannot run without one | Apache-2 |
| `vitest`, `@playwright/test` | latest | tests | MIT/Apache |
| `webmidi` (optional) | 3.x | ergonomic wrapper over Web MIDI; only if the raw API proves annoying | Apache-2 |

Python (tools/content): `music21==10.5.0`, `python-ly`, `jsonschema`, `requests`.

**Bundled soundfont:** `smplr` normally fetches samples from a CDN; for offline use the build
MUST vendor one piano soundfont into `public/content/audio/` (e.g. the "Salamander"-derived
sf2/js instrument that smplr can load from a local URL, or a small FluidR3 acoustic grand subset,
both freely licensed). Verify the license file is committed alongside.

## 4. Module contracts

### 4.1 `score/` — rendering and ScoreModel

```ts
// ScoreModel is the single source of truth for what the learner must play.
export interface ScoreNote {
  id: string;            // stable within a score: `${measureIndex}:${staff}:${voice}:${onsetTicks}:${midi}`
  midi: number;          // 21..108
  staff: 1 | 2;          // 1 = upper staff (usually RH), 2 = lower (usually LH)
  hand: 'R' | 'L';       // derived: staff 1→R, 2→L, unless MusicXML cross-staff/`<staff>` says otherwise
  voice: number;
  measureIndex: number;  // 0-based, in *playback order* after repeats are unrolled
  sourceMeasureIndex: number; // measure as printed (for cursor placement)
  onset: number;         // in quarter-note beats from the start of the unrolled piece
  duration: number;      // beats (tie chains merged into the first note; later tied notes omitted)
  velocityHint?: number; // from dynamics, for playback only
  fingering?: number;    // 1..5 if present in the MusicXML
  graceNote?: boolean;   // grace notes are excluded from matching by default
}
export interface ScoreStep {        // one "cursor position": every note that starts at this onset
  index: number;
  onset: number;                    // beats
  notes: ScoreNote[];               // ≥1
  measureIndex: number;
  isMeasureStart: boolean;
}
export interface ScoreModel {
  id: string; title: string;
  steps: ScoreStep[];
  tempoMap: { atBeat: number; bpm: number }[];   // from <sound tempo> / metronome marks; default 1 entry
  timeSigMap: { atMeasure: number; beats: number; beatType: number }[];
  measureCount: number;             // unrolled
  keySig?: string;
  handsPresent: { R: boolean; L: boolean };
  beatToMs(beat: number, tempoScale: number): number;   // uses tempoMap
}
```

- ScoreModel MUST be built from OSMD's parsed sheet (`osmd.Sheet`) after `osmd.load()`, by
  walking `osmd.cursor`'s iterator (or `osmd.Sheet.SourceMeasures`) so that the step indices
  line up 1:1 with OSMD cursor positions. Repeats: OSMD's iterator already unrolls repeats
  when `osmd.cursor.next()` is used; ScoreModel MUST use the same traversal so
  `step.index === number of cursor.next() calls from reset`.
- The extractor MUST be unit-tested against ≥10 fixture scores covering: ties, chords, two
  voices per staff, grace notes, repeats with endings, pickup measures, cross-staff notes,
  tempo changes, 6/8, triplets.

**Windowed renderer** (`score/WindowRenderer.ts`):
- Input: MusicXML string, `window = { fromMeasure, toMeasure }`, `zoom`, `handsFocus`.
- Uses `osmd.setOptions({ drawFromMeasureNumber, drawUpToMeasureNumber, ... })` + `render()`
  to draw only the requested bars; keeps **two OSMD instances** (visible + off-screen) so the
  next window is pre-rendered and swapped in with no visible delay.
- MUST support `barsPerWindow` 1–8 (setting), `zoom` 0.5–2.0, and page-fit for landscape.
- Alternative "Scroll" layout (whole piece rendered once, auto-scrolled to keep the cursor in
  the top third) MUST also exist; the user chooses between "Window" and "Scroll" in settings.
- Note colouring: after each render, build a map `ScoreNote.id → SVG element` (OSMD exposes
  `GraphicalNote` → `getSVGGElement()`), so the overlay layer can paint notes green/red/grey
  and dim the non-focused hand.

### 4.2 `engine/` — practice modes (pure TypeScript, no DOM)

See `05-score-follow-engine.md` for the full behaviour. Contract:

```ts
export type Mode = 'wait' | 'tempo' | 'listen' | 'free';
export interface EngineInput  { kind: 'noteOn'|'noteOff'; midi: number; velocity: number; tMs: number }
export interface EngineEvent  {
  kind: 'stepAdvanced' | 'noteJudged' | 'finished' | 'missed' | 'tempoTick' | 'paused' | 'resumed';
  // payload varies; see engine spec
}
export class PracticeEngine {
  constructor(model: ScoreModel, opts: EngineOptions, clock: Clock);
  start(fromStep?: number): void; pause(): void; resume(): void; stop(): void;
  feed(input: EngineInput): void;             // MIDI or screen-keyboard input
  on(handler: (e: EngineEvent) => void): () => void;
  readonly state: { step: number; mode: Mode; score: SessionScore; ... };
}
```

`Clock` is injectable (`performance.now` in the browser, a fake in tests).

### 4.3 `input/` — input adapters (MIDI, microphone, screen keyboard, replay)

All note input reaches the engine through one interface. `MidiSource` below is the MIDI
flavour; `MicSource` (see `audio/pitch/`, §4.7) and `ScreenKeyboardSource` implement the same
`InputSource` shape. Every emitted note event carries `source` and `confidence` (MIDI = 1.0).

```ts
export interface InputSource {
  readonly kind: 'midi' | 'mic' | 'screen' | 'replay';
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): void;
  onNote(cb: (e: { kind:'noteOn'|'noteOff'; midi: number; velocity: number; tMs: number; confidence: number; source: InputSource['kind'] }) => void): () => void;
  onStateChange(cb: (s: { connected: boolean; detail: string }) => void): () => void;
}
export interface MidiSource extends InputSource {
  readonly name: string;
  connect(): Promise<void>;         // may trigger the browser permission prompt
  disconnect(): void;
  onMessage(cb: (m: { kind:'noteOn'|'noteOff'|'cc'|'other'; midi?: number; velocity?: number; cc?: number; value?: number; tMs: number; raw: Uint8Array }) => void): () => void;
  onStateChange(cb: (s: { connected: boolean; inputs: string[]; outputs: string[] }) => void): () => void;
  send?(bytes: Uint8Array): void;   // for output (play to the piano) — optional
}
```

- `WebMidiSource` MUST: request `{ sysex: false }` first; list all inputs; auto-select the
  first input whose name doesn't look like a virtual/software port; listen to *every* input
  simultaneously anyway (cheap cables show up with generic names like "USB MIDI Interface");
  treat **Note On with velocity 0 as Note Off** (very common); handle **running status** is
  done by the browser already; log the first 200 raw messages to a ring buffer for the
  diagnostics screen.
- `ScreenKeyboardSource`: an on-screen 2-octave keyboard (scrollable) that emits the same
  events. This is the *no-hardware* input and is always available.
- `ReplaySource`: plays back a recorded JSON list of messages with timing (for tests and demos).

### 4.4 `audio/`

- `Piano` (smplr) with `play({ note, velocity, time, duration })` scheduled on the AudioContext
  clock; `Metronome` implementing the look-ahead scheduler pattern (25 ms timer, 100 ms
  look-ahead) so ticks are sample-accurate; count-in support.
- AudioContext MUST be created/resumed on a user gesture (Android autoplay policy).

### 4.7 `audio/pitch/` — microphone note detection (`MicSource`)

Score-informed detector, fully specified in `05-score-follow-engine.md` §11. Summary of the
contract: `MicSource` opens `getUserMedia` with `{ echoCancellation:false, noiseSuppression:false,
autoGainControl:false, channelCount:1 }`, runs an `AudioWorklet` that frames audio (2048–4096
samples, hop 512), computes a magnitude spectrum, and — given the **expected pitch sets** the
engine publishes for the current and next step (`setExpectations(steps)`) — scores each
expected pitch by harmonic-template energy and reports onsets with a confidence. It also
reports "unexpected salient pitch" events at lower confidence so the engine can mark probable
wrong notes. The worklet must never allocate per frame; analysis budget ≤ 3 ms per hop on the
S25. A `MicCalibration` routine records the learner playing a chromatic scale and stores
per-pitch gain/inharmonicity corrections and the input latency. A wired **USB audio
interface** (line-out of the HP-130 → OTG → phone) appears as just another microphone device
and uses the same code with a "line input" preset (lower thresholds, no room-noise gate).

### 4.5 `data/`

IndexedDB stores (via `idb`):

| Store | Key | Value |
|-------|-----|-------|
| `settings` | `'app'` | all settings (see 04-ui-spec.md §7) |
| `progress` | itemId | `{ itemId, status:'new'|'started'|'passed'|'mastered', bestAccuracy, bestTempoPct, attempts, lastPracticedAt, minutes }` |
| `sessions` | autoincrement | one row per practice run: itemId, mode, tempoPct, accuracy, timing stats, date, durationMs |
| `imports` | id | user-imported score: name, MusicXML text (or mxl bytes) **or PDF bytes**, `kind: 'musicxml' \| 'pdf'`, tags, addedAt, and for a PDF `cuts` — the corrected system boundaries. A PDF item is viewable and followable but not playable or judgeable — it has no notes (`04` §5b). |
| `plan` | `'current'` | current stage/unit, chosen track order, placement-test result |
| `streak` | `'streak'` | weekly-minutes goal progress and practice-day history (no daily-streak punishment) |
| `micCalibration` | deviceId | per-pitch gain/inharmonicity table, latency ms, noise floor |
| `skills` | conceptId | self-assessed / measured skill state for the Skills review screen |
| `levelOverrides` | itemId | the owner's own difficulty number for one item, which wins over the catalog's everywhere (replan §1.4) |
| `folderLibraries` | folder name | the *folder*, not its contents: when it was picked, what its `library.json` said it was, how many listable scores it holds, how the listing was made (`manifest` / `walk` / `partial`), what an interrupted walk still owes, and the handful of paths found missing since the index was last built. May also hold a `handle` — a `FileSystemDirectoryHandle`, when the browser has one and the `folderHandles` setting is on (P19) — which turns "pick the folder again" into an Allow tap. Small on purpose: this is what the browse screen reads on every visit. |
| `folderScores` | `[folder, file]` | one score in one folder, one record each: title, composer, estimated level, bars, rating, plus the folded title the `byTitle` index is built on and a `missingAt` stamp when the file behind it has gone. Indexed `byTitle` on `[folder, sort]`, which is what makes the A-to-Z rail a key-range question rather than a walk of the listing. The *files* are not stored — a picked folder is lent for one visit — so these rows are what make browsing work with nothing plugged in. Fetched by key, for the page about to be drawn. |
| `folderIndexes` | folder name | one compact record per folder holding the parallel arrays the browse screen filters over — path, folded haystack, letter, level, style id, status id, rated flag, and the tally of placeholder titles. About 2 MB for the owner's 37,261 against the 40-odd the full rows cost, and **opening the screen reads this and not the rows**. Rebuilt whole by a scan; deliberately untouched by a one-row change. |
| `books` | id | a book the owner owns on paper: title, and the pieces in it with their page numbers and the rungs they are options of (replan §5.1). Typed in by hand; nothing is scanned. |

**`DB_VERSION` is 6.** Every upgrade is keyed on `oldVersion` and creates only the stores that
version lacked, so a phone that skipped a version arrives correct.

**The folder three, and why the split.** Every score in a folder used to be an element of one
`folderLibraries` record, and IndexedDB can read or write only whole records — so every
operation cost the whole listing. Opening the browse screen deserialized all 37,261 objects to
draw sixty; adding one piece rewrote all of them; a rescan replaced the listing wholesale and
took the app's own knowledge of each row with it. One record per score, plus a small index
record per folder, makes each of those proportional to what is actually wanted. A rescan
**diffs**: known paths keep their identity — which is what `ImportRow.origin` points at, so an
added piece stays added and its `levelOverrides` row stays attached — new paths are inserted,
and rows whose file has gone are *marked* rather than deleted, so a card that was out does not
destroy a listing and a file that comes back comes back as itself.

**Version 6 adds the stores and moves nothing.** A `versionchange` transaction holds every
other connection to the database shut while it runs, and rewriting 37,261 records inside one
at start-up is precisely the blocked open that left the app shell unmounted after an update.
`folderLibrary.ts`'s `folderIndex()` splits a pre-6 row the first time that folder is opened
instead — on the one screen that wants the listing, once, with nothing else waiting on it.

**All three are deliberately out of the backup** (`STORE_NAMES`): between them they are 6 MB
of listing describing files that are on the phone anyway, rebuilt by pointing at the folder
again. Putting them in would multiply the size of the one file that holds a year of practice,
to save a single tap.

**A blocked open is bounded, and both sides are handled.** `blocked` means another copy of the
app holds the database at an older version; the spec fires neither `success` nor `error` while
it does, so the open promise simply never settled and `boot.ts` waited for ever — a launch
with no tab bar at all. Now the page in the way closes its own connection (`blocking`), which
cures it outright whenever both pages run this code, and a page held up by an older build
falls back to memory after `BLOCKED_GIVE_UP_MS` rather than hanging. The real open is left
running, so the database comes back without a reload. `terminated` forgets a connection the
browser closed underneath us.

**`navigator.storage.persist()` is asked on the first open, and the answer is on screen.**
Everything the app holds is local and has no copy anywhere, and IndexedDB starts in
best-effort mode — a device short of space may evict the origin. Chrome grants persistence
silently for an installed PWA, so on the phone this should be a promotion with no prompt.
`persistenceState()` carries the answer into `util/storageReport.ts`, and Settings → Content
prints it under the usage figure (`#settings-durability`) along with the blocked-database
sentence, because that is the screen the owner opens when storage is tight.

**Storage Buckets: considered, no.** The API would let the rebuildable half of the database
(the folder listing) be evicted ahead of the irreplaceable half, which is the one real
asymmetry here. It is still the wrong trade: a bucket is a separate IndexedDB namespace with
its own version ladder and its own `blocked` path, so it doubles what can block in order to
protect 6 MB that a folder pick rebuilds; `STORE_NAMES` already draws the same line for free;
and a persisted origin is not evicted at all, so with `persist()` granted there is nothing to
prioritise. Revisit when `navigator.storageBuckets` exists on the phone *and* the report says
best-effort — a mechanism and a real risk, rather than one without the other. The reasoning is
kept beside the code, in `data/db.ts`.

**`cuts` shape.** `Record<pageIndex, number[]>`, a flat sorted list of an *even* number of
**fractions of the page height**: `[top0, bottom0, top1, bottom1, …]`. Fractions rather than
pixels because the page is rendered at whatever width the phone asks for, and a correction
dragged in portrait has to survive a rotation, a reload at a different device pixel ratio, and
an export onto another phone. Pairs rather than single dividing lines because the gap *between*
two systems is real — one list of boundaries would force each system to start where the last
ended and drag half the next stave into view. See `app/src/pdf/systemPlan.ts`.

**Settings are read synchronously.** `getSettings()` is called from inside a render pass in a
dozen places, and IndexedDB is asynchronous. So `data/persist.ts` is a write-through cache:
IndexedDB is the store of record (and therefore what a backup carries), localStorage is the
synchronous read path, every write goes to both, and `hydratePersisted()` reconciles them once
at boot — localStorage wins when it has a value, IndexedDB fills it in when it does not, which
is what makes a restored backup and a cleared-localStorage device both come back.

**An import row carries the file; almost nothing that reads the store wants it.** `ImportRow.data`
is the whole MusicXML text or the whole PDF, up to 64 MB of it, and IndexedDB has no way to read
part of a record — a `getAll('imports')` deserializes every byte. `allItems()` is what Today,
Plan, Library, Lesson, the drill host and the session builder all load through, and it went
through `importedCatalogItems` → `allImports`, so **every screen the owner opened read their
whole imported collection out of the database to take a title and a level off each row**. Two
imports of forty bytes in a fixture makes that free, which is why it survived.

So there are three read paths and they are not interchangeable:

- `importSummaries()` — the rows **without `data`**, cached until something writes to the store.
  This is what lists, filters, badges and the catalog overlay use. The cache is the promise, not
  the value, so two screens loading at once share one read. `importsChanged()` drops it, and is
  what every writer — including `backup.ts`, which writes the store directly — has to call.
- `getImport(id)` — one row, by key, for the score actually being opened, edited or assigned.
- `allImports()` — everything, bytes and all. Two callers left: the storage report, which adds
  the sizes up, and the backup, which writes them out.

**A write-through cache in front of a store has to be told when the store is written from
outside.** `progressStore` (`memory`, `streakMemory`), `planStore` (`memory`) and `skillsStore`
(`memory`) all answer from memory once populated, and both restoring a backup and *Reset
progress* clear or overwrite the rows underneath them. Left alone that is not a stale display:
the next run reads the cached streak, adds today's minutes and **writes it back over the restored
history**, which is the one number in this app with no second copy. `forgetCachedProgress()`,
`forgetCachedPlan()` and `forgetCachedSkills()` are that other half; `importAll` calls all three
and the reset calls the two whose stores it clears. The listeners are deliberately left
subscribed — a screen that is on the page is the one that has to redraw.

**A day is a local day.** `dayKey()` in `progressStore` is the one rule, and the minutes, the
`passedOn` dates and the Progress heat map all use it. It was `toISOString().slice(0, 10)`, which
is UTC: the owner is in the US, so practice after about 7 pm was filed under *tomorrow* — today's
square read zero, and a Saturday-evening session counted towards next week's goal. The heat map
made it worse by walking days with local arithmetic and naming them in UTC, so around the offset
it could emit one square twice and skip another.

**The `sessions` store is read by its indexes, not whole.** `recentSessions` walks `byDate`
backwards and stops at the limit; `sessionsForItem` uses `byItem`. Reading and sorting the whole
store to hand back fifty rows was 2,200 rows and 2,200 `localeCompare`s at the retention cap, on
the Progress screen's load and again at the end of every drill. And two readers were asking the
wrong question altogether: performances and one drill's own history are both **rare by
construction**, so filtering them out of "the last hundred runs of anything" meant that a few
weeks of ordinary practice made them disappear — the Progress screen said *No performances yet*
over a history that had them. `recentPerformances` asks for performances.

Export/import: one JSON file containing all stores (imports included), via the File System
Access API when available and share-sheet/`<a download>` fallback otherwise. PDF bytes are
base64 in the JSON: that inflates them by a third, and the alternative — a zip — would mean
owning a container format for a file nothing else reads. **Import merges by default** (the
device's row wins when it is further along) and only replaces on request, so restoring last
week's backup never throws away this week's practice.

### 4.6 `curriculum/`

Loads `content/curriculum.json` (built from `content/curriculum/stage-*.json`) and
`content/catalog.json`, and merges the learner's own imports into the same index so that
search, the swap sheet, the session builder and `#/score/<id>` cannot tell a bought score from
a bundled one (`allItems()`).

Selectors: `lessonComplete`, `idsToCompleteLesson`, `alternativesFor`, `findLesson`,
`thinLessons`, and in `session.ts` `nextRecommended(curriculum, records, activeTracks)`,
`buildSession(input)`, `swapOptions(slot, …)`, `playInstead(item, …)`. Prerequisites are
*advisory* by default; the "strict mode" setting enforces them.

Two rules the session builder follows that are not obvious from `04` §2:

- **A row it cannot fill is dropped, not shown empty.** An empty row is a hole the learner has
  to fill by hand, which is the thing the card exists to avoid. Free play is the exception: it
  never has an item because it is a prompt.
- **The swap sheet has a fourth, loosest tier.** `alternativesFor`'s three tiers can genuinely
  come up empty at Stage 0 — a handful of drills, few shared concept tags — and a swap button
  that offers nothing is a dead button, so `swapOptions` falls back to anything playable of the
  same type within one level.

## 5. Data model — content

`content/catalog.json` is an array of **items**. Schema lives at `content/catalog.schema.json`
(authoritative). Summary:

```jsonc
{
  "id": "song.bach.minuet-g-anh114",          // stable, lowercase, dotted
  "type": "song" | "exercise" | "drill",       // drill = generated/algorithmic (scales, ear training)
  "title": "Minuet in G major, BWV Anh. 114",
  "composer": "Christian Petzold (attr. J. S. Bach)",
  "arranger": null,
  "genre": ["classical","baroque"],
  "tracks": ["classical"],                     // which curriculum tracks it belongs to
  "level": 3.2,                                // stage.decimal (see curriculum) — difficulty for placement
  "abrsmGradeApprox": 1,
  "concepts": ["3/4", "hands-together", "G-major", "ornament:trill-optional"],
  "hands": "both" | "right" | "left",
  "durationSec": 95,
  "tempoBpm": 108,
  "file": "scores/classical/bach-minuet-g-anh114.mxl",
  "source": { "name": "MuseTrainer library (MuseScore user arrangement)", "url": "…", "license": "Public Domain", "pd_region": "worldwide" | "US" },
  "teaching": { "lessonIds": ["3.2"], "notes": "Watch the LH crossing in bar 11" },
  "media": [{ "kind":"video", "label":"Bill Hilton — …", "url":"https://youtu.be/…" }]
}
```

`content/curriculum.json`: stages → units → lessons; each lesson lists `exerciseOptions[]` and
`songOptions[]` (item ids), `concepts[]`, `text` (markdown file id), `videos[]`, `mastery`
criteria. Schema at `content/curriculum.schema.json`.

## 6. Performance budget (phone)

- First render of a 2-bar window: < 150 ms on S25 (OSMD 2.x manages ~10× that for a full page).
- Window swap (pre-rendered): < 16 ms (one frame).
- MIDI-in to note-coloured: < 30 ms.
- Audio playback jitter: < 5 ms (scheduled on the AudioContext clock, never `setTimeout`). That rule is about putting *sound* in the future. The engine's `tick()` is not audio and is driven by a 25 ms interval as well as by animation frames, because frames stop in a page that is not being drawn (`05` §3, decision 9).
  That rule is about *scheduling audio*. The engine's `tick()` is not audio — it reads a clock
  and advances a cursor — and it is driven by a timer as well as by animation frames, so a run
  keeps time when the page is not being drawn (`05` §3, `00` D26).
- Bundle: app JS < 1.5 MB gzipped; content precache < 60 MB total (scores are tiny; the
  soundfont dominates — pick a ≤ 20 MB piano).

  **Measured 2026-09-06 at the end of P19**, on a clean build, and this is the one figure —
  §7 used to carry a second, older one:

  ```
  python tools/content/build.py --offline    # 1,533 items
  cd app && npm run build:app
  ```

  **Measured at the end of P19 under a ×4 CPU throttle** (`tests/e2e/perf.spec.ts`, which
  prints every number it takes):

  ```
  2-bar window render        median 36 ms      (S25 budget 150 ms, gate 600 under ×4)
  pre-rendered window swap   median 0.40 ms    (one frame, budget 16.7)
  input to note coloured     mean 8.6 ms, max 15.2 ms   (budget 30 ms)
  the longest score          first window in 11.6 s
  ```

  The swap figure changed meaning on 2026-09-07 and is not comparable with the 4.2 ms
  recorded at P19. That number came from timing `WindowRenderer.showStep` from outside,
  which also runs `positionBand` and so forces a layout the budget was never about — and
  which could not tell a fast swap from a call that swapped nothing. The test now reads the
  renderer's own `window.swap` samples, which exist only when a prepared buffer is actually
  brought forward. Nineteen of them, median 0.40 ms under a ×4 throttle.

  The last one is new and is the one to know about: **Chopin's Scherzo No. 2 — 780 printed
  bars, 3,331 steps — takes about twelve seconds under a ×4 throttle before its first two
  bars are on the screen.** The window renderer means the *rest* of the piece costs nothing
  after that, but the first window still waits for OSMD to parse the whole file. Nothing else
  in the library is close; the median score is a page or two. Whether twelve throttled seconds
  is three real ones on the S25 is a question for the phone.

  content **12.2 MB in 1,383 files** (6.6 MB of scores across 1,256 files, 2.7 MB of catalog
  and curriculum JSON, 2.6 MB soundfont, 0.24 MB of lessons and tips); built app **15.7 MB in
  1,411 files**; service worker precache **1,413 entries, 14.8 MB**. A quarter of the budget.
  The catalog JSON is now the second-largest single thing after the soundfont, which is what
  to watch rather than the notation. Re-measure and record it here after any content phase;
  the whole library is precached (`00` D20, §7), so this number is what the owner downloads.

## 7. Offline

**Everything runs locally (`00` D20).** `vite-plugin-pwa` with Workbox `generateSW`:

- **Precache the app shell and all of `content/**`** — every score, the catalog, the
  curriculum, every lesson markdown file, and the soundfont. Not a runtime cache, not
  lazy: the whole library is on the device after the first launch. Workbox's default
  `maximumFileSizeToCacheInBytes` (2 MB) MUST be raised or the soundfont is silently skipped;
  this is the classic way this goes wrong.
- **Runtime cache nothing external**, because nothing external is fetched. The one exception
  is the teaching-video links, which open the browser and are labelled "needs internet"
  (`04` §8).
- **The precache must be verifiable, not assumed.** The service worker reports how many of
  the catalog's files are cached; Diagnostics shows it (`04` §7b) and a **"Download
  everything now"** action in Settings → Content re-runs it and reports the total size.
  `app/tests/e2e/offline.spec.ts` checks both halves of the claim on every run: that every
  file the catalog names appears in the generated precache manifest, and that with the
  network off the app loads, reads the catalog, curriculum and a lesson, opens an authored
  score and a generated exercise through its own loader, and still has the soundfont.
- **`clientsClaim` is on**, so the *first* visit is offline-capable rather than the second.
  Safe without `skipWaiting`: it only claims clients no worker is controlling yet.
- **Update checks are optional and silent.** An "update available — reload" toast when a new
  service worker is waiting; a setting turns the check off entirely, and a failed check when
  offline is not an error and is never shown.
- **Budget check: §6 has the numbers**, measured once at the end of P19. They used to be
  recorded in both places and the two disagreed, which is how a measurement becomes a
  rumour.
- **The build grew awkwardly, and P11 fixed the half of it that was conversion.** That fix
  was the one predicted here — cache the converted `.mxl` files by source checksum — and it
  is in `build/cache/convert/`, keyed on the source bytes, a digest of `convert.py` +
  `abc_tools.py`, the music21 version and the conversion options (`docs/03` §3a). The render
  check gained the equivalent: `build/render-manifest.json`, keyed on each output file's
  sha256, so only unseen files are engraved. Both are restored in CI by `actions/cache`, and
  `.github/workflows/render-full.yml` re-renders everything on demand so a renderer upgrade
  cannot hide behind the manifest — run it, or `render_check.py --full` locally, whenever
  OSMD or the converter moves.

  **Measured on one Windows laptop, `build.py --offline`, 790 catalog items:** a cold build
  with an empty cache is **27 min**; a warm one is **76 s** on an idle machine, with 169 of
  169 `[KERN]` conversions and 32 of 32 `[AUTH]` conversions served from the cache.
  `build.py --offline --render` — the content build *plus* engraving all 689 playable items
  from an empty manifest — is **300 s**; the same command again is **81 s** and re-engraves
  **0**, because every file's hash is already in the manifest, and the two runs produce a
  byte-identical `catalog.json`. Neither number is CI's — its runner is faster and starts from
  a restored cache — but the ratios are the point.

  Prerequisite, and worth knowing: **a conversion is now byte-reproducible.** music21 mints
  part ids from object identity and zips with the wall clock, so the same music used to
  produce a different sha256 every run and on every machine — which would have made a
  manifest keyed on that sha256 useless. `write_mxl` pins both.

  **What is left is the generator.** `generate_exercises.py` builds 426 exercises with
  music21 on every run and nothing caches that, so it is now most of a no-change build.
  Making it incremental is the next worthwhile move and is out of P11's scope. It was at
  least made *reproducible* — it wrote scores with `sc.write()` rather than `write_mxl`, so
  all 426 changed bytes every build and the render manifest re-engraved every one of them.
- **The globs are the failure point, twice over now.** Workbox skips what a glob misses and
  what exceeds the size limit, and it says nothing either way. `maximumFileSizeToCacheInBytes`
  was raised for the soundfont in P5b; in P7 `.mjs` had to be added because `pdfjs-dist` ships
  its worker as `pdf.worker.min.mjs` and it was being built, hashed and then dropped. Any new
  dependency with a non-`.js` runtime asset needs the same check — Diagnostics' "precached
  n of m" block (`04` §7b) is what makes it visible.

## 8. Screen wake lock, orientation, full-screen

- Request `navigator.wakeLock.request('screen')` when a practice session starts; release on stop.
- `manifest.webmanifest`: `display: "standalone"`, `orientation: "any"`; the score screen
  requests landscape via `screen.orientation.lock('landscape')` if the user's setting says so
  (works in installed PWAs; ignore failures).

## 8a. Tablet / large-screen layout

A responsive breakpoint at ≥ 900 CSS px shortest side switches to the **tablet layout**:
default bars-per-window 4, lesson text or chord chart in a collapsible side panel beside the
score, two-column Plan/Library. No separate build; phone is the primary target and the only
one the owner tests.

## 9. Deployment

**The app is served from the owner's own laptop** (`00` D25), installed on the phone from
there, and after the first launch never needs it again except to update. There is no host, and
that is the decision — not a fallback. The whole payload is 15.7 MB precached on first launch
and the app then works with the network off permanently (§7), so an origin that is switched on
for five minutes a month is not a compromise, it is the right size of thing.

**Installing (`docs/OWNER-GUIDE.md` §1 has the steps).**

1. Build the content **with `--personal`**, then the app:
   `python3 tools/content/build.py --offline --personal` and `cd app && npm run build:app`.
   Not `npm run build`: its prebuild rebuilds the content without `--personal` and would swap
   the owner's library for the public one.
2. `mkcert` once, for this laptop's LAN address, into `packaging/lan/` (gitignored). Chrome
   counts an origin as secure only if it trusts the certificate; a self-signed one leaves a
   URL bar in the TWA and can cost Web MIDI. The mkcert root certificate is installed on the
   phone once.
3. `py -3.11 packaging/serve-lan.py` — HTTPS on port 443 for the APK, any port for "Add to
   Home screen". It sets the MIME types Chrome needs to offer an install, `Service-Worker-
   Allowed: /`, and cache headers that let a rebuilt app be noticed. Tested in
   `tools/content/tests/test_serve_lan.py` over real TLS.
4. `packaging/build-apk.sh` with `PIANOPATH_HOST` set to the laptop's address and
   `PIANOPATH_KEYSTORE` to the owner's signing key. It fills in `twa-manifest.template.json`,
   runs Bubblewrap, and writes Digital Asset Links into `app/dist/.well-known/`.

**The assetlinks trap:** `assetlinks.json` must be at the **origin root**, never under the
app's base path. That is why `PIANOPATH_BASE_PATH` defaults to `/` and why the laptop serves
the app at `/` rather than at a sub-path. The keystore, the certificate and the built APK are
all gitignored; losing the keystore means no upgrade path for an installed APK, so it is
backed up somewhere that will still exist in five years.

**GitHub Pages is the testing deploy, and only until the repository goes private.**
`.github/workflows/pages.yml` runs on push to `claude/piano-teaching-app-bo19td` — there is no
`main` (`docs/decisions/2026-09-05-default-branch.md`) — and builds with `--strict-license`,
so the 159 items whose composition is not public domain are placeholders there (`00` D23).
That is the build the owner tests on the phone before going private. **The workflow is deleted
in the same breath as making the repository private**: Pages cannot deploy from a private
repository without a paid plan, and its only job was that test. `ci.yml` stays — it is where
the Linux screenshot baselines are compared.

**No third-party host.** Cloudflare Pages and Netlify were the alternatives while the origin
was undecided; D25 decided it. Nothing in the packaging hard-codes an origin, so if that ever
changes it is an environment variable rather than a rewrite.

## 10. Development loop the builders MUST use

1. `npm run dev` (Vite) + Playwright e2e in headless Chromium with a **mocked
   `navigator.requestMIDIAccess`** (fixture in `tests/e2e/fixtures/midiMock.ts`) that injects
   scripted note events.
2. Unit tests for engine/ScoreModel on fixtures in `tests/fixtures/scores/*.musicxml`.
3. On-device check (owner does it): open the Pages URL on the S25, open Chrome's
   `chrome://inspect` from a laptop over USB for console logs when something misbehaves.
   The app also has a **Diagnostics** screen (MIDI raw log, render timings, storage size,
   "copy debug report") so the owner can paste a report back into a Claude session.

## 11. Coding standards

TypeScript `strict`; ESLint + Prettier; no `any` in `engine/` and `score/`; every exported
function in `engine/` has a unit test; UI components are plain classes/functions returning
DOM nodes (or Lit if a builder prefers — decide once in P2 and record it in `docs/decisions/`).
Commit messages: conventional commits (`feat(engine): …`). No model names in commits or code.
