===== THE C6 REVIEW (2026-09-26, artefact-first against a5d3d24) =====

**Verdict: approved, with one policy correction before C7.** The mechanisms are real: Today no
longer fills slots from level windows; the rung → skill → demand → prerequisite → exposure ladder
exists; parallel strands are `strandsOf`, not one serial position; `readerPosition` anchors
sight-reading to the spine; review separates skill retention from repertoire retention; the
1-3-7-21 calendar is gone; swap alternatives carry semantic tiers; generated sight-reading stays
apart from repertoire; the red evidence exercises the replaced mechanisms. The closures are
accepted with the packet's qualifications: L35 is not globally closed while its two build-side
Stage-N rules remain; X1 stays partial.

1. **Retention: keep passed and mastered.** A pass is evidence the learner learned enough of the
   piece for it to be worth preserving; requiring mastery would make retention artificially
   late. Interim: when G builds the repertoire lifecycle, `ProgressRow.status` stops serving as
   the definition of repertoire state — learning, practising, performable, maintaining,
   refreshing, paused or retired are the abstraction (R19).
2. **The 14-day window stands as a hypothesis**; C7 is not blocked by it. Eventually cadence is
   contextual — a barely learned piece, a polished performance piece, an easy maintained piece
   and one being retired do not share one recurrence policy.
3. **Change the exposure precedence before C7.** Verified at the lines: the review slot returns
   `exposure(ctx, 'kinds', true)` right after retention (`session.ts:1132`) and the repertoire
   slot `exposure(ctx, 'tracks', true)` right after the demand-ready piece (`:1171`), before the
   second pass's ladder sees the slot; the declared hierarchy and the implementation disagree,
   and it matters now because the semantic tiers are starved of shipped metadata while the
   seven-day heuristic always fires. Required: review — due skill or piece retention → rung,
   skill, demand, prerequisite where applicable → exposure; repertoire — demand-ready piece → a
   semantic repertoire candidate → exposure; a due retention need may outrank ordinary work
   (forgetting, maintenance), generic breadth may not; a reserved breadth share, if the product
   wants one, is L32's composed-session policy, never a selector pre-pass on `EXPOSURE_DAYS`;
   adversarial tests with both candidates present (the semantic one wins) and with exposure the
   only candidate (it wins). Sent to the C6 builder as a fix-forward in the same tree.
4. **No target-skills filler task before C7.** The "fires on nothing shipped" state is the
   cleaner architecture: D0 populates target skills through family contracts and E populates
   demands through measurement; stamping guesses now would encode them right before the wave
   whose job is to establish the facts; C6's constructed tests prove the consumers work once
   trustworthy producers exist.
5. **Parts 18–20 constrain C7** without blocking it. C7 must not make Today recomputation
   equivalent to an active session; assume `buildSession()` output can always be regenerated;
   make evidence records the only definition of activity completion; make an active run the
   top-level resumable object; bake raw wall-clock duration into new evidence semantics; make
   session slot identity depend solely on item id; treat a changed learner state after activity
   1 as permission to rewrite activities 2–5. The hierarchy stays persisted session snapshot →
   optional teaching episode → activity or run; C7 improves long-horizon evidence underneath it.
6. **The truncated reason line is P2, X's, not P3.** The pictures show the decisive clause lost
   on the primary 342 px target ("Keeping this piece playable —…", "Next lesson — this one waits
   f…"); C6 exists to say why, and hiding half the reason undermines it; X solves it in the Today
   redesign, likely two compact lines rather than rewriting every reason around an ellipsis.
   → U63. **L93 stays P1**: the header and Plan can still describe a different serial rung from
   the strands composing Today, and that must not survive into learner-facing X work.

After the exposure-precedence change and its tests, C7 may start. The reviewer then resumes the
independent audit at onboarding, self-explanation and MIDI import.
