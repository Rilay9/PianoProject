# P17 — Tips for every drill, coaching rules, and the how-to-practise module  ·  Intended model: **Opus 5** (Sonnet 5 acceptable for the prose)  ·  Branch: `feat/p17-tips-practice`

(Include `_COMMON-HEADER.md`. The default branch is `claude/piano-teaching-app-bo19td`; there is no `main`.)

Read: `docs/decisions/2026-09-06-p11-replan.md` §6, §8 (practising efficiently, plateaus,
injury); `docs/03-content-pipeline.md` §6 (lesson conventions); `docs/04-ui-spec.md` §5c;
`app/src/ui/screens/DrillScreen.ts`, `app/src/engine/drills/fromCatalog.ts`
(`RUNTIME_DRILL_KINDS`), `app/src/ui/markdown.ts`, `app/src/data/progressStore.ts`
(`recentSessions`); three existing lessons for the voice (`content/lessons/3.5.md`,
`2.1.md`, `ragtime.6.md`).

## Why

Twelve drill kinds teach by repetition alone. The lesson files already end with the four
sections the owner asked for; this phase gives every drill the same four, static per kind,
varied by parameter where a parameter changes the advice, and one history-aware sentence
from a rule table — plus the practice-method module the comprehensiveness check found
missing.

Runs in the container. Needs no PDMX.

## Build / verify

1. **`content/tips/<kind>.md`** for every kind in `RUNTIME_DRILL_KINDS` (twelve, plus any
   P12b added — read the constant, do not copy the list): front-matter `kind`, optional
   `when:` for variants (`<kind>.<variant>.md`), body = exactly the four headings in order,
   ≤ 250 words, house voice. `validate.py`: every kind has a file, headings exact, length,
   `when:` keys are real `drill.params` keys somewhere in the catalog. Tests.
2. **Drill screen:** fetch the tips file on open (variant chosen by matching `when:` against
   the item's params; most specific wins), a collapsible **Tips** block under the prompt
   (collapsed by default after the first time a kind is seen — a per-kind localStorage flag),
   full text on the result sheet. Offline: covered by the existing `content/**/*.md` glob;
   add the tips directory to `offline.spec.ts`'s manifest assertion. E2E.
3. **`engine/drills/coaching.ts`:** pure `coach(kind, result, recentRuns) → string | null`
   with the rules in §6 (slow-but-accurate, fast-and-wrong, consistently early/late pedal
   lifts, dynamics stuck under target, three runs without improvement → link to the plateau
   lesson). Unit tests per rule and for "no rule fires → null". The result sheet shows the
   sentence when there is one.
4. **The practice-method module:** `content/lessons/practice.1.md`–`practice.5.md` (chunking
   and loops; slow practice and the tempo ladder; interleaving and the session templates;
   when to stop, warm-up, tension and pain; the plateau — what it is and the three things to
   change) as a `practice` mini-module on the core track from Stage 1 (add the track to
   `00-tracks.json`; `optionsExempt` is *not* appropriate — give each lesson three real
   options from existing exercises that demonstrate the method, e.g. a loop on a four-bar
   piece). Reachable from Today's Tools block and from the coaching sentence.
5. **Docs:** `04` §5c gains the tips block and coaching line; `02` Part D8 gains the practice
   module; `03` §6 gains the tips convention.

## Acceptance

- `validate.py --strict-license` green with the tips rules on; paste one tips file.
- `npm run lint && npm run typecheck && npm test && npm run e2e` green; coaching unit tests;
  offline manifest test includes `content/tips/`.
- Report: kinds covered, variants written, rules implemented with their thresholds, the five
  practice lessons' titles.

**Cannot be checked in the container:** whether the advice is right for this learner. Ask
the owner to read the twelve files and mark any sentence he disagrees with.
