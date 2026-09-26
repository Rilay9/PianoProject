===== PART 20: THE SESSION AS AN OBJECT — FOUR ORCHESTRATION REQUIREMENTS UNDER L32, X14–X16, U31, E10 AND X12 (2026-09-26, the reviewer's audit at c1fc7ef; no competing subsystem) =====

Verified at the lines after C6: `TodayScreen.ts:325` still replaces a swapped slot in the
mounted screen's own array (`slots[slotIndex] = { ...rest, item: choice, reason:
swapChoiceWords(option.tier) }`) and nothing persists the chosen session; once the first
activity opens, that Today is gone and a return or reload rebuilds through `buildSession()`
against the new learner state. `PracticeEngine.elapsedMs` subtracts idle time and is tested;
`DrillScreen.ts` computes duration as `Date.now() - startedAtMs` in four places.

1. **Start session snapshots a real session**, not the first current slot. The prescribed
   session can change underneath the learner after activity 1 changes evidence, and a manual
   swap can disappear. On Start the app materialises a session instance: id, date and template;
   ordered activity instances; the exact item identity of each; generated seed, recipe or
   excerpt identity where applicable; slot, purpose and the readable reason; the opening rung or
   context; learner substitutions; the cursor; activity state (not started, active, completed,
   skipped); enough to resume after navigation, reload or kill. The remaining session is never
   recomputed after every completed activity — new evidence belongs to the next session unless
   an explicit intervention or episode changes this one for a stated reason; replanning is an
   explicit action, never a side effect of remounting Today. Tests: swap slot 2, Start, finish
   slot 1, slot 2 is still the substitute; change evidence during slot 1 so `buildSession()`
   would differ and the running session does not mutate; reload between slots and resume at the
   cursor; kill and reopen during an activity and be offered the active session; a genuinely new
   session uses the new state. L32 with U31 and E10; X19 stays a detour that reintegrates, never
   the day's session.
2. **Activity completion apart from competence evidence.** Score and many drills measure; some
   drills record completion with accuracy unmeasured; Lab records nothing; Free Play records
   nothing; PDF has follow behaviour and no practice history (X12). A session must know that
   five minutes of accompaniment, PDF systems 12–18 or three minutes of improvisation fulfilled
   the activity without manufacturing accuracy, passes, misses or skill evidence. Two independent
   products per activity: the activity outcome (started; completed, skipped or interrupted;
   active practice duration; passage or range where known; reflection or report if asked;
   activity-specific facts) and learning evidence (only what the experience measured).
   Completion advances the cursor without asserting competence; X14's per-surface exit evidence
   made mechanical enough for L32's orchestrator. Tests: a Lab activity completes and advances
   with no accuracy or mastery evidence; PDF records time and system progress and optional
   self-report, no note correctness; Free Play satisfies an assigned creative activity without a
   percentage; a measured Score activity emits both; skipping advances only by the session's
   skip policy and never masquerades as completion or mastery.
3. **U31 widens to the hierarchy**: composed session (L32) → teaching episode (X19, optional) →
   active activity or run (X15, X14). After a kill or reload the app answers which session, which
   activity, whether it was part of an episode, why, where to return when it finishes, which
   earlier activities are complete. Identity and safe resumable state are persisted, not every
   millisecond of engine state: a partly played judged attempt may restart cleanly; the session
   and episode context survives; per activity it is defined whether an interrupted attempt is
   resumable, restartable or discardable; an interrupted partial attempt is never recorded as
   completed.
4. **Duration truth outside Score**: hidden time is not practice time is Score's invariant with
   a unit test; the other activities have no shared active-practice clock, which matters once
   X12 records PDF practice, L32 allocates by minutes and X14 lets unjudged activities satisfy
   session work. Never raw `Date.now() - startedAt` for an orchestrated activity that was hidden
   or suspended. A shared active-time primitive on X15's lifecycle — ready → active → suspended →
   active → completed — where only active intervals count; count-ins under one documented policy;
   background, app-switch and phone-call time never count; a stopped activity freezes; restart
   against resume explicit. A fake-clock test over representative Score, Drill, PDF and Lab
   activities: play 20 s, hide for 5 min, resume 10 s → about 30 s of practice, not 330 s.

**Not overbuilt**: no universal `recordRun()` forcing every experience into Score's evidence
model — the grammars differ (L24); what is missing is the small common orchestration protocol
above them. U30 (safe areas, system UI, keyboard, app switching, calls, Bluetooth and MIDI
reconnect, the device matrix) and U56 (playing-state accessibility) are correctly scheduled;
the interruption finding strengthens U30's acceptance matrix and X15's contract rather than
adding rows. Without these, L32 could be built as a smarter `buildSession()` plus a Next button
and claim composed sessions with no stable session to compose.
