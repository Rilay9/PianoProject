# 2026-09-05 — P1 decisions: module location, soundfont, settings storage

Three small deviations from / gaps in the normative docs, recorded so the next
session does not re-litigate them.

## 1. Input adapters live in `app/src/midi/`, not `app/src/input/`

`docs/01-architecture.md` §2 and §4.3 place the adapters under `src/input/`.
`docs/05-score-follow-engine.md` §9 and the P1 prompt both say
`src/midi/WebMidiSource.ts`. Two of the three references say `midi/`, so P1
builds there: `src/midi/{types,parseMidiMessage,WebMidiSource,ScreenKeyboardSource,ReplaySource}.ts`.

`types.ts` holds the shared `InputSource` contract, so when P3b adds
`MicSource` it imports the interface from `src/midi/types` (or the directory is
renamed to `src/input/` in one commit — nothing outside these files knows the
path, because everything is re-exported from `src/midi/index.ts`).

## 2. `MidiSourceState` extends `InputSourceState`

The doc declares `MidiSource extends InputSource` while giving `onStateChange`
a narrower payload (`{connected, inputs, outputs}` vs `{connected, detail}`).
Those two signatures are mutually unassignable, so TypeScript rejects the
`extends`. `MidiSourceState` therefore *extends* `InputSourceState`, gaining
`detail` alongside `inputs`/`outputs`. Every doc example still compiles, and
the UI gets one human-readable status string for both source kinds.

## 3. Bundled soundfont: FluidR3_GM acoustic grand, MIDI.js format (2.6 MB)

Requirement: freely licensed, ≤ 20 MB, works offline, loadable by `smplr`.

Chosen: **`acoustic_grand_piano-mp3.js` from `gleitz/midi-js-soundfonts`**,
pre-rendered from **FluidR3_GM.sf2** (Frank Wen), released under
**CC-BY 3.0**. Vendored at `app/public/content/audio/acoustic_grand_piano-mp3.js`
with `LICENSE.md` beside it.

Why this one:

* **2.6 MB**, an order of magnitude under the 20 MB budget and inside the 30 MB
  Workbox precache cap already configured in `vite.config.ts`. The phone
  precaches it once at install and never fetches audio again.
* It is exactly the format `smplr`'s `Soundfont` player parses
  (`MIDI.Soundfont.<name> = { "A0": "data:audio/mp3;base64,…" }`), so pointing
  `instrumentUrl` at a local file is a one-line change from its CDN default —
  no conversion step, no second decoder to maintain.
* mp3 rather than ogg: both are in the source repo, both decode in Chrome;
  mp3 is the smaller of the two here and has no licensing questions left.

Rejected alternatives:

* **`SplendidGrandPiano`** (smplr's nicest piano) — velocity-layered samples
  fetched per note from a CDN; vendoring the whole set is ~100 MB.
* **A raw `.sf2`** via `Soundfont2Sampler` — FluidR3_GM.sf2 is 148 MB, and
  extracting just the grand piano needs a build-time SF2 tool we do not have.
* **MusyngKite / FatBoy** — nicer piano, CC-BY-SA (share-alike), which would
  attach a copyleft obligation to a bundled asset for no functional gain.

Attribution requirement (CC-BY) is met by the committed `LICENSE.md` and by the
credit line on the Diagnostics screen's debug report.

## 4. MIDI settings persist in `localStorage`, not IndexedDB, for now

`docs/01-architecture.md` §4.5 puts settings in an IndexedDB `settings` store,
and `docs/06-build-plan.md` assigns that store to a later phase. P1 needs four
values persisted (pinned input id, input-latency ms, transpose, metronome
volume), so it follows the precedent already set by `src/ui/theme.ts`: a small
module with a get/set API over `localStorage`, which the settings phase can
re-point at IndexedDB without touching a caller.
