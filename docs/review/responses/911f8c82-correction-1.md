# Correction 1 to `responses/911f8c82.md`

This correction changes only the framing of the c6 implementation acceptance after the owner's 2026-10-01 direction: **the Score screen is not one static layout that must keep every kind of context/status/control visible in every state. Each state shows what the learner needs for the task in that moment.** The c6 decomposition remains accepted; the no-overlay rule, U124 acceptance, U35 placement, U110 ownership, and the rest of `responses/911f8c82.md` stand.

## The state is part of the layout model

Do not implement c6 as “top context + bottom controls + a status slot” that persists unchanged through rest, count-in, play, pause, refusal and completion. That would recreate the same optimization problem with more surfaces.

The build brief must contain a small **per-state acceptance table**. It is an acceptance description, not a new persistent state taxonomy: map it onto the Score states the app already has wherever possible.

| Moment | Directly shown | One tap away / may return | Hidden or yielding |
| --- | --- | --- | --- |
| **At rest / setting up** | piece name + `bar n / m` on the thin top line; Back; ▶; mode; Hands; tempo; `Hear it`; ⋯ | secondary setup in ⋯/sheet | incidental run status that has no current action |
| **Count-in** | the notation needed for the entrance; pulse/count-in; current position if useful; a direct way to stop/pause | setup controls | piece title and setup choices; count-in must not cover the notes |
| **Playing** | music; current position; a direct pause control | controls/context may be recalled | piece title, mode, Hands, tempo, ordinary status and other setup chrome unless a current action truly requires them |
| **Paused** | piece name + `bar n / m`; direct ▶/resume; the controls needed to change/restart the run | secondary setup | redundant prose such as a generic “Paused” label when the visible state/control already communicates it |
| **Refusal / actionable warning** | the actionable message only while it applies, plus the control/action it names, directly reachable; position if it still fits without harming the action | ordinary context can return when the refusal clears | title yields before the actionable message; no message may cover notation |
| **Finished** | the result/outcome and the next action | score/setup controls if the learner deliberately returns | stale in-run status and controls that no longer serve the completed task |

The table's point is not the exact nouns above; it is the invariant: **information earns screen space from the learner's current task, not because it exists in the Score model.**

## This supersedes the prior “generic top transient surface” requirement

`responses/911f8c82.md` required one c6 probe that reused the top context band as a generic transient message surface. Narrow that requirement:

- The **title may yield** to an actionable refusal/warning while that warning stands.
- Do **not** move every ordinary status line to the top merely because the band exists.
- A paused state does not need a sentence saying “Paused” if the state is otherwise clear and ▶ is directly available.
- During play, the title and setup choices should disappear rather than compete with the score; position and pause remain.
- At rest/paused, the context and controls return.

The remaining discriminating probe should therefore test the **state transitions**, not merely text fit: rest -> count-in -> playing -> paused -> refusal -> clear/finished. On the already-named narrow cells, verify that each state exposes its necessary action/context, hides nonessential chrome, does not move/shrink the music unnecessarily, and never covers the notation required at that moment.

For a refusal, first try the already-paid top band with the title yielding. If its actionable core still cannot fit honestly, reserve/refit space temporarily. **Do not overlay the score's foot.**

## Build acceptance consequences

1. **Playing must have a direct pause action.** The control bar may fold, but the learner must not need to open ⋯ or reveal a hidden bar just to pause.
2. **Paused must have direct resume.** This preserves the later `9e14839e` walk ruling: if the state implies/tells the learner to continue with ▶, ▶ is directly reachable.
3. **Count-in is a transient state, not chrome.** It communicates pulse without obscuring the notes needed for the entrance.
4. **Setup controls are contextual.** Mode, Hands and tempo are useful while setting up/paused; they do not earn persistent space during active playing merely because c6 can fit them at rest.
5. **Refusal/warning is exceptional.** Show it only while true, prioritize its actionable core over the title, and keep its named control/action reachable.
6. **Completion is outcome-oriented.** Do not carry in-run status into the finished surface simply for consistency.
7. U124's 40 px control floor still applies whenever a control is directly shown.

## Session-item consequence

Apply the same common-sense rule to the session-item purpose/outcome contract from `responses/9e14839e.md`: the learner should see the criterion/purpose needed **before** the item, the guidance needed **during** it, and the result/next action **after** it. Do not make every surface repeat every status merely because those truths exist in the model. Consumer consistency means the surfaces agree about the underlying truth; it does **not** mean they display the same information at the same time.

## Fast path

Do not reopen the six-layout comparison. c6 remains the accepted base decomposition. Before the implementation brief dispatches, amend it with the state table above (or a simpler equivalent derived from the existing Score states) and run only the discriminating state-transition probe needed to show the narrow cells obey it. If that passes, proceed to the c6 build; do not start another design campaign.
