# Prompts

Briefs written to be handed to somebody else — a second model, or the owner six
months from now. They live in the repository rather than in a chat window
because a brief nobody can find is a brief that gets written twice.

| File | What it is |
|---|---|
| [`P20-first-run-setup.md`](P20-first-run-setup.md) | **Built** (2026-09-09, `docs/decisions/2026-09-09-setup-tour.md`; the tour is `04` §7d). The brief as written: the first-run setup — prove the piano, the cable and the phone work together, calibrate what can be measured, and let the owner choose the four settings that are a matter of his taste by looking at them. The latency step it asked for was later removed for a MIDI user (`04` §7d). |
| [`design-brief.md`](design-brief.md) | **Not a build task.** Ten questions the screenshots raised that need *decisions* rather than code. Nine are matters of taste; question 9 is a real bug. **Answered** in `docs/decisions/2026-09-07-ux-decisions.md`; the work is `prompts/P21-ux-fixes.md`. |
| [`verifying.md`](verifying.md) | **Read before claiming anything works.** Four ways a check quietly lies, all four met on 2026-09-07, all four caught by CI or a screenshot rather than by reasoning. |
| [`known-problems.md`](known-problems.md) | What is broken and unfixed, so nobody rediscovers it or mistakes it for something they just broke. Read before running the suite. |

Both briefs have since been worked: P21 (in `prompts/`, with the rest of the numbered prompts)
was the design brief's answers turned into work, and P20 followed it. The paragraph that stood
here about their order is history now; `known-problems.md`'s counts are as of its own date, and
the live ones are `docs/generated/ladder.md` and `npm run pwa:audit`.
