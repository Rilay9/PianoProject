# P6 — Score screen  ·  Intended model: **Sonnet 5**, then an **Opus 5** review pass  ·  Branch: `feat/p6-score-screen`

(Include `_COMMON-HEADER.md`.)

Read: `docs/04-ui-spec.md` §5, §7, §8, §9; `docs/05-score-follow-engine.md` §2–§6; `docs/01-architecture.md` §8.

## Build
The full Score screen on top of P1–P3 (+P3b if merged; otherwise stub `MicSource`): control bar
(every control listed in `04` §5 incl. the input selector and the four follow options, auto-hide),
amber mic feedback + level meter, manual tap-to-advance, playback destination toggle,
Window/Scroll layouts, cursor + note colouring driven by engine events, keyboard strip, hand
focus dimming, loop by double-tap and by named sections, tempo % slider with bpm entry,
metronome/count-in, mode switch at runtime, end-of-run summary sheet with the four action
buttons and the no-MIDI self-report, gestures (§5), landscape lock + wake lock on the score
route, settings read/written through a `SettingsStore` (localStorage now; P7 swaps to IndexedDB
behind the same interface).

E2E: every control has a test; a scripted `ReplaySource` run in Wait and in Tempo mode ends on
the summary sheet with the expected numbers; screenshot tests in landscape at bars-per-window
1/2/4.

## Opus review pass (second session, same branch)
Review the diff against `04` §5 and `05`; verify no rendering happens on the input path,
cursor updates are rAF-batched, window pre-render is used, and engine events are consumed
completely. Fix what you find; report.

## Acceptance
E2E green; manual checklist on desktop: all controls; the owner then tests on the phone.
