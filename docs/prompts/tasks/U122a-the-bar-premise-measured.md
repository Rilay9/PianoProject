# U122a — the landscape Score chrome's premise, measured: one bar against placing items by role (a design addendum to U122: no app code)

**Why.** The owner asked on 2026-10-01: why put everything on one line, and why not put the piece's name and the bar location at the top of the screen? U122's brief took "one row of controls" as a settled invariant, so its design (`docs/design/score-bar-layout.md`) answered how to fit every item in one row, not whether every item belongs there. Its own result points at the premise: at the owner's 780 × 360 sideways the model drops the piece's name entirely to keep the mode label whole. The one-row rule exists to protect the music's height (the project's first rule: the biggest undistorted music with the next music in view), and that cost was never measured against what a second tier buys. This lane measures it, so the owner and the reviewer choose with numbers before any build.

## Read first

`docs/design/score-bar-layout.md` and `docs/prompts/runs/U122/ENTRY.md` (the model, its inventory, its probe and tables; reuse the probe scripts under `docs/prompts/runs/U122/`, copied into this worktree); `docs/prompts/tasks/U122-the-sideways-score-bar-gets-one-layout-model.md`; `docs/review/responses/b47ce498.md` §1; the window rule's sizing and freeze (how the score's size is priced at a run's start and held, and what the bar's fold during a run does and does not give back: `app/src/score/WindowRenderer.ts`, `app/src/ui/screens/ScoreScreen.ts`, `docs/08-score-render-states.md`); `docs/prompts/operating-procedure.md` §11–§14.

## Measure three layouts on the same cells U122 measured

1. **One row**, U122's model as designed.
2. **Two tiers:** a thin line carrying the piece's name and `bar n / m` (and, if it fits, the status line) above a control row that holds only controls.
3. **Corner overlay:** the name and `bar n / m` leave the bar for a small overlay in a corner of the score area (the folded chip's precedent), and the row holds only controls.
4. **Placed by role** (the lead candidate, from the owner and the reviewer, 2026-10-01: the premise under test is "everything belongs in the bottom bar"). Top edge, in a zone the score's layout knowingly reserves, never a float over the notation: Back, a compact or truncated title and `bar n / m`. Bottom row: only what the hands use while playing (▶/pause, ⋯, and any control the code shows acts during a run rather than reconfiguring it). Setup choices (read from the code which of mode, Hands, tempo and Hear it restart or reconfigure a run) move behind ⋯ or the setup sheet. Transient state and the refusal sentence get their own short strip above the bottom row, only while needed.

**The CL07 cells, required** (`responses/questions-90b19bee-correction-1.md`): besides U122's cells, one representative tablet-sideways cell that exposes U5's trade between more notation size and useful next music, and the upright phone cell or cells needed to compare candidate U33/U78 readable-floor and comfortable-size values while each candidate chrome allocation is in force. Each candidate is also judged against CL07's reading objective (staff size against the five-line floor, look-ahead, bars held against the bars option, stability). Not an exhaustive device matrix; if these cells do not distinguish the candidates, keep the simpler model.

For each layout and each cell, in the states U122 used (at rest, paused, the refusal states, upright where it applies): the height the music gets and the drawn size (scale) of the score at rest and during a run, with the fold's effect stated from the code and measured; the systems and bars in view; which items show whole, cut or behind ⋯; whether the refusal sentence and every control it names stay visible and inside the window; and anything the layout puts over the score's ink. Name each cell where a layout costs the music size or a system, and by how much. State plainly which numbers are this machine's Chromium.

## Rules

Allowed: probe the real app in the page (move and restyle the real elements, as U122 did), on this lane's own port **5383** from a config copy under `app/build/u122a/`. Not allowed: any change to app source, styles or committed tests. The harness is `operating-procedure.md` §14.

## Deliverable and stop

An addendum section in `docs/design/score-bar-layout.md` ("§7 The one-row premise, measured") with the comparison table and a recommendation, and the run files under `docs/prompts/runs/U122a/` (ENTRY.md starting "### Entry 209 — U122a"). If a layout wins on readability but costs the music size, that is a product trade: present it with what a learner gains and loses, and do not choose it.

**Landed 2026-10-01** (Entry 209; 911f8c82, merged 02d28d99); handoff `handoffs/911f8c82.md`.

## Record

lane: U122a · closes: — · entry: 209
index: The bar's one-row premise measured against two tiers and a corner overlay, the music's height and size per layout per cell (the owner's question, 2026-10-01) (`U122a-the-bar-premise-measured.md`) | design | drafted 2026-10-01 (`U122a-the-bar-premise-measured.md`); Entry 209
in-flight: drafted 2026-10-01 (`U122a-the-bar-premise-measured.md`): a design addendum, no app code; the one-row premise measured against two alternatives before U122's build (Entry 209)
state: dispatched 2026-10-01: dispatched at 842157ef, measuring, at the owner's question (Entry 209)
- landed 2026-10-01: merged 02d28d99; handoff `handoffs/911f8c82.md`
- verdict 2026-10-02: APPROVE WITH ONE REQUIRED CHANGE (`responses/911f8c82.md`, `911f8c82-correction-1.md`): c6's top-context and bottom-controls decomposition is the base whole-Score model; neither offered transient-text placement is built; before the build brief dispatches, one state-transition probe (rest, count-in, playing, paused, refusal, clear or finished) on U120's 568 × 320, U121's narrow paused case, 780 × 360 and the face pair, and a per-state table in the brief; nothing overlays notation
