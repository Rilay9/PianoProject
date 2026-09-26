===== PART 18: THE SESSION IS COMPOSED BUT NOT RUN — THE BOUNDARY BETWEEN C6 AND X (2026-09-26, the reviewer's learner-experience audit in progress, against c1fc7ef) =====

Not a C6 defect and not a reason to delay or widen C6; it defines what X builds around C6's
composition. Verified at the line after C6's commit: `TodayScreen.ts:520`, "Start session" does
`slots.find((slot) => slot.item)` and opens the first populated activity; there is no session
cursor, no active-session id or state, no slot-completed state for today's composed lesson, no
next-activity handoff, no persisted "where I am in today's lesson", no cross-surface
continuation, no reason carried from the finished activity into the next; after a Score
activity, Done follows that screen's normal return and the learner is back on Today navigating
the card. Three scales stay distinct: **L32, the composed session** (why these experiences
belong together today — controlled eighth-note reading → a real excerpt with the same demand →
repertoire → a creative or easy finish); **X19, the practice episode** (what the teacher is doing
about one problem inside or across them); and **the missing execution layer within L32 and X9**
— start session → activity 1 → a concise result → "Next: activity 2, because …" → activity 2 →
… → session finish and reflection. Without it C6 composes a coherent lesson in data that the
learner experiences as several independent app launches, losing exactly the relation L32 is
meant to create: a teacher does not hand over five activities and disappear between them ("Good,
the rhythm held there; now the same pattern in a short piece"; "still unstable, so we're not
moving on"; "easier than expected — skip the second drill and try it in the piece").

**The X requirement**: lightweight execution state, apart from competence evidence and apart
from X19 — today's composed session identity and version; the ordered activities; the current
one; attempted, completed and skipped; why each is here; any adaptation made after an activity;
elapsed and remaining time; whether an X19 episode detoured and where to resume; whether the
learner ended the session on purpose. Session completion is never competence evidence. **The
transition** at the piano: "Rhythm held this time. Next: Minuet excerpt, 4 min — the same
eighth-note pattern, now in real music. [Start] [Skip or change]"; the learner never has to hit
Done, rediscover Today, inspect five rows, remember which was done, infer the next, or work out
why it follows; X15 and X16 later make it lighter with cues and auto-continuation.
**Adaptation**: the runner does not execute the original card blindly — easy success skips
redundant acquisition and moves to transfer; failure opens an X19 episode, then resumes; a long
session keeps the highest-priority project and repertoire work and trims filler; fatigue or
frustration switches to easier fluency or creative work; a diagnostic result can change a later
slot — but never an invisible rebuild after every run; material changes are understood.
**Resume**, two problems: U31 never loses an active run after an interruption; L32 and X9 never
lose where the learner was in today's lesson — after activity 3 of 5, "Continue today's session
· 18 of 30 min · next: …", never as if the session had not started. **Guided versus
exploratory**: the doors (Metronome, Free play, Sight-read, Simon, Accompaniment lab) stay;
X9's rule made explicit — guided practice never requires knowing the doors or the information
architecture, and exploratory access never competes with the teacher's next action; the toolbox
is not the problem, assembling one's own lesson from it is. **Fifteen acceptance cases** →
Q42 extended. **Reconciliation**: L32 from "compose coherent activities" to "compose and execute
a coherent lesson"; X9; X15 between activities as well as between attempts; X16; U31 with
score-run persistence kept distinct; X19 cited only for detours and return, never merged with
session execution. No new row. **Bottom line**: C6 answers what today's lesson contains, X19
what we do about this problem, and L32 with X9 how the learner moves through the lesson without
becoming its session manager.

The reviewer continues with the phone-at-the-piano lifecycle (opening with both hands needed,
starting, switching, interruptions, stopping early, recovering after errors, visual attention
demanded by controls and feedback), then turns to the artefact-first C6 review when its packet
arrives.
