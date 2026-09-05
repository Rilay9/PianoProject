# P8 — Drills UI  ·  Intended model: **Sonnet 5** (Opus for ear/rhythm scoring bugs)  ·  Branch: `feat/p8-drills`

(Include `_COMMON-HEADER.md`.)

Read: `docs/05-score-follow-engine.md` §7–§8 (**note the distinction at the top of §7**:
generated *exercises* are notation and open in the Score screen; only *drills* need a screen
here); `docs/04-ui-spec.md` §5 (visual language), §7.

## Build
Screens for every drill kind on top of the P3 framework: staff flash card (uses OSMD or a
mini VexFlow render for a single note), key finder, chord/inversion symbol card, ear drills
with audio prompts and "play again", rhythm drill with a one-line staff and tap input, pedal
drill with a pedal lamp and timing readout, dynamics drill with a velocity meter,
sight-reading (generator → Score screen in Tempo mode, first-attempt-only scoring),
call-and-response, backing-track loop. Result sheets with pass/master. Progress recording via
P7 stores. E2E per drill with scripted input.

## Acceptance
E2E green; manual run of each drill on desktop with the mock and the on-screen keyboard.
