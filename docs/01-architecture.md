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
    data/                – IndexedDB (db.ts) + one store module each: progressStore, planStore, skillsStore, importStore, settingsStore/persist, backup (export/import)
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
- Audio playback jitter: < 5 ms (scheduled on the AudioContext clock, never `setTimeout`).
- Bundle: app JS < 1.5 MB gzipped; content precache < 60 MB total (scores are tiny; the
  soundfont dominates — pick a ≤ 20 MB piano). **Measured 2026-09-05: content 6.0 MB
  (2.7 scores / 2.6 soundfont / 0.5 catalog / 0.2 lessons), `app/dist` 7.6 MB.** Re-measure
  and record it after every content phase; the whole library is precached (`00` D20, §7), so
  this number is what the owner downloads.

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
- **Budget check (measured 2026-09-05):** content 6.0 MB, built app 7.6 MB, against the
  60 MB budget in §6. There is room for the whole of P5b and P10.

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

The delivery artifact is a **TWA APK** (`00` D19). Pages is the testing deploy and only while
the repo is public.

**Now, while the repo is public:**
- `.github/workflows/pages.yml`: on push to `main` — set up Python + Node, run
  `tools/content/build.py` (produces `app/public/content/…`), `npm ci && npm run build`, upload
  `app/dist` with `actions/upload-pages-artifact`, deploy with `actions/deploy-pages`.
- Owner one-time step: repository **Settings → Pages → Source: GitHub Actions**.
- `vite.config.ts` `base` MUST be `/PianoProject/` (repo name) for Pages, overridable by env.
- The Pages build MUST be the default, NC-free content build (`00` D10a). It is a public URL.

**At v1.0, when the repo goes private (P9):**
- The content build may drop the licence gate for the APK; see `03` §1.
- **Offline-first is decided (`00` D20).** The origin exists only so the TWA has a start URL
  to install from and to check for updates against; after the first launch the service worker
  serves everything and the app works with the network off permanently. Any static host will
  do — Cloudflare Pages or Netlify free tier both build a private repo — precisely because it
  is barely used. A laptop serving `app/dist` over HTTPS on the LAN is enough for an install.
- Consequence for P9's acceptance: **airplane mode from the second launch onwards must be a
  fully working app**, not a degraded one. That is a test, not an aspiration.
- Bubblewrap needs a signing keystore and a `assetlinks.json` served from the origin's
  `/.well-known/`. **The keystore is the owner's and is never committed**; P9 documents where
  it lives and how to reproduce a build without it.
- `base` must match wherever the origin serves from; a custom domain or a site root makes the
  TWA config simpler than a `/PianoProject/` subpath.
- Laptop fallback for a quick test without a host: `npx serve app/dist` on the same Wi-Fi with
  a self-signed cert (Web MIDI needs HTTPS; `localhost` only counts on the phone itself).

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
