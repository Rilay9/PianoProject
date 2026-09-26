===== PART 19: THE CROSS-SURFACE INTERRUPTION LIFECYCLE (2026-09-26, the reviewer's phone-at-the-piano audit; onto X15, X16 and E10, not a new item) =====

The reviewer now sends build-ready packets — problem, code and surfaces, required behaviour,
acceptance tests, place in the plan — and interrupts only for a decision.

**Verified at the lines**: `ScoreScreen.ts` handles `visibilitychange` (three references) and
`scoreMidRunSettings.test.ts`, `score.screen.spec.ts` and `score.states.spec.ts` forge
`visibilityState`; `ChordChartScreen.ts`, `LabScreen.ts`, `PdfScreen.ts` and `DrillScreen.ts`
have no visibility handling at all. Chord Chart and Lab clean up on route disposal but do not
suspend when the document is hidden; PDF's timed follow leaves its timeout and metronome to
browser behaviour while hidden; Drill has extensive route-disposal cleanup, with each drill's
timers and playback independent.

**Required**: one practice-surface lifecycle contract used by Score, Chord Chart, Drill, Lab
(Jam, trading), PDF follow and any future orchestrated activity, distinguishing playing,
suspended or interrupted, between attempts, completed, and disposed. On
`document.visibilityState === 'hidden'` an active activity stops or suspends scheduled
progression and any sound that should not continue unattended. Returning visible never
processes a timer or animation-frame backlog, silently skips material, counts hidden wall-clock
time as practice, or pretends an uninterrupted performance; the screen enters a deterministic
resumable state. Route disposal stays terminal and releases listeners, audio and resources.
**PDF**: Timed and Loop follow never advance while hidden and return at a later system; the
timeout is cancelled or disarmed on hide and restored at the same system on visible with an
explicit restart or resume, or the shared lifecycle's defined resume; the metronome follows the
same state. **Chord Chart and Lab**: hiding stops or suspends metronome, accompaniment,
scheduled piano and drum events and form progression; returning never increments chorus, pass
or bar from elapsed hidden time; enough state is kept to resume predictably rather than
treating backgrounding as navigation. **Drill**: every count-in, Simon and listen playback,
delayed feedback, pause, dictation ticker and metronome audited against the contract; a hidden
phone never finishes a prompt, advances a card, scores hidden time or returns halfway through
playback. Not scattered `visibilitychange` handlers when a shared primitive can own the
transition. **Not "pause buttons everywhere"**: lifecycle correctness first; X16's cues and
hands-free continuation then run on a reliable shared state machine.

**Acceptance tests**: forge `visibilityState` and `visibilitychange` as the Score tests do;
for every active surface prove that hiding freezes progression, no scheduled beat, page, card
or pass occurs while hidden, visible returns to the same musical position, hidden duration
does not contaminate measured duration or timing, no stale callback fires after resume, and
stop or back after an interruption still disposes everything; one integration test covers
visible → hidden → visible → hidden → visible, since duplicate listeners and timers are the
obvious regression.

**Into the orchestration work**: L32 owns the session's ordered activities and current
position; X19 owns an episode and its reason; X15 owns the interaction and lifecycle state of
the active activity; backgrounding loses neither the session cursor nor the episode context,
and on return the learner is in the same activity or intervention, never on a Today that
recomputed a recommendation.
