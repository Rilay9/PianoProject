# D3b brief review — session-card teaching-use admission

- Brief handoff: `docs/review/handoffs/e0d1a3a.md`
- Brief HEAD: `e0d1a3ae8fe1121c791bbcac5b6f8c6468622a94`
- Reviewed seam: D3b pre-dispatch
- Verdict: **APPROVE**

The brief implements the required D3a fix at the right boundary. It preserves one definition of the generated-music teaching-use admission in `eligibility.ts`, reuses it from `eligibleFor`, applies it to the direct session-card paths through their shared candidate filter, and explicitly covers jam where that shared filter is bypassed. It does not confuse authored rung placement with approval, does not remove authored content, and keeps Library browsing and explicit exploration outside this automatic-offer rule.

The proposed regression matrix is sufficient: each named path must exclude both `teaching: null` and `teaching: false`, restore the same candidate at `teaching: true`, preserve drills and notated items, prove empty-pool fallback or omission, and rerun the whole-card probe that exposed the 23 rows.

## Findings

- **BLOCKS NEXT BRIEF:** none. D3b may dispatch.
- **CONSTRAINS NEXT BRIEF:** the exported predicate is the single admission for automatic teaching offers. Keep its promise/review-bit reading single-sourced. A rung, lesson, requirement, or fallback listing is never evidence of teaching-use approval.
- **LATER WAVE:** none added.
- **PRUNE/MERGE:** no learner-facing “waiting for review” row. That is internal content-pipeline state, not a useful practice activity or learner action. If the only candidate is refused, retain the requirement as unmet in curriculum state and omit the card row or use the next already-valid fallback.

## Answers to the handoff questions

1. If implementation proves that `usable()` also serves a non-offer/display-only path, do not broaden D3b's admission to that path accidentally. Keep the one exported predicate, but invoke it at each automatic-offer filter instead. On the code inspected for this brief, the cited `usable()` calls participate in card candidate selection, so the shared placement is the preferred implementation.
2. Omit the row or fill it through the existing valid fallback. Do not tell the learner “waiting for review.” The underlying `done` requirement remains unmet; the session card must not invent an activity or surface internal review workflow merely to display that fact.
