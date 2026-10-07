# BB1: the Blue Bossa probe's Station 4 evidence (Entry 266)

- `chart-backing.json`: the Chord chart cases A-D, one fixed window of playback at 240 bpm per case; bass, kick, snare and hat starts classified by audio-node construction, piano starts from the app's counter, clicks.
- `app-facts.json`: the app-side facts read from the app's own functions: the drill's shells and the Lab's rows per key, Free play's names for held chords, the chart's bar reduction and live-cell scores for both charts.
- `compare_m21.out` (written by `compare_m21.py`): Station 3, the drill's shells and `romanToChord` against music21 for C, G, D, F and A minor; pitch classes print as sorted flat names (Gb is F-sharp).
- `chart-backing.probe.spec.ts`, `facts.probe.ts`: the probes that wrote them, run on the lane's port from its own Playwright and vitest configs (not part of the suites).

The harmony facts are in the intake record's claim checks: `docs/prompts/runs/curriculum-review-2026-10-05/intake/QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.md`.
