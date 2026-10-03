# The human review record

`decisions.jsonl` is what a person decided about a content item, and on what the decision
rests (D2; R42, G29, Part 15 §18 and §22). One JSON object per line, **append-only**: a line
is never edited, re-serialised or removed. A later decision supersedes an earlier one by
being later, not by rewriting it.

Lines arrive through the builder's microscope (`#/dev/microscope`, or
`#/dev/microscope/<item id>` for one item) and its export, merged here by:

```bash
python tools/content/review.py --merge review-decisions-<time>.jsonl   # idempotent
python tools/content/review.py --check                                 # the queue, what is undecided
```

No server writes this file: the screen keeps its decisions on the device, marks each
unexported, exported or merged, and exports them as a file (the reviewer's decision,
`docs/review/responses/7ab175a.md` finding 3).

## One line: one event, one dimension

A person's decision:

| Field | What it holds |
| --- | --- |
| `v` | `1` |
| `event` | a stable id (`ev-` and a UUID from the screen), the same in every export, so a rerun of `--merge` appends nothing |
| `item` | the catalogue id |
| `identity` | what the item was when the person looked at it (below) |
| `dimension` | `usableScore` (a usable, faithful score: the right notes, readable, the right piece) or `goodTeachingUse` (a good teaching use for the role it is given) — R42's two decisions, never both on one line |
| `value` | `yes`, `no` or `fix` |
| `basis` | `inspected` (the facts only), `notation` (the page read), or `heard` — the item played complete, both hands sounding, at its intended tempo. Hand-alone or partial playback stays `notation`; the note may say what was auditioned. The screen offers `heard` only after a complete both-hands playback at the written tempo in that visit |
| `category` | for `usableScore`: `notation`, `transcription`, `fidelity`, `identity`, `rendering`, `playback`, `other`; for `goodTeachingUse`: `role`, `opportunity`, `demands`, `physical`, `musical-shape`, `style`, `usefulness`, `placement`, `other` |
| `reason` | why, in a sentence |
| `note` | optional free text |
| `by` | the reviewer's name as they gave it (`triage` is reserved) |
| `at` | ISO time in UTC with milliseconds (`2026-09-27T10:00:00.000Z`), so the strings sort as times |
| `supersedes` | optional: the event the reviewer saw as current when deciding again (recorded for the reader; resolution does not depend on it) |

A **triage** line has `by: "triage"`, an `item`, a `reason` and `at`, and may carry
`identity`, `dimension`, `category`, `from` (who or what flagged it) and `note`. It flags an
item for a person and **never counts**: it fills no bit, sets no `heard`, changes no report,
and may not carry a `value` or a `basis`. Any reader may write one — a script, a person
skimming, a model outside this repository; no model is called from here and no key is held.

## Identity, and staleness

| Item | Identity |
| --- | --- |
| generated | `{"kind": "generator", "family", "version", "seed", "recipe", "tempoBpm"}` — the `drill.generator` triple and the recipe that wrote the notes (`drill.params` with the hands, and the tempo). The seed is `null` on every deterministic family, so the triple alone does not name one item; the recipe does (G21) |
| notated | `{"kind": "file", "sha256"}` — the built score file's hash, E0's cache key (`build.attach_demands`) |
| no file (a runtime drill, a placeholder) | `{"kind": "none"}` — cannot go stale, shown as weaker |

A decision binds to the identity it was made on. A family whose version moves, a recipe
that changes, or a file whose bytes change makes every earlier event on the item **stale**:
shown as stale and counted as none. `--merge` refuses a line whose identity the built
catalogue does not have, and a line on an item it does not have.

## Current values

Per item and per dimension: triage lines and stale events never participate; among the
valid human events the latest (`at`, then the later line) is current, the rest superseded.
An event on one dimension never changes the other's value or basis — a `heard`
teaching-use decision leaves a `notation` score review as it was.

`tools/content/review.py` and `app/src/review/record.ts` implement this; both are held to
`tools/content/tests/fixtures/review_cases.json`.

## Who reads it

- **The build** (`build.attach_provenance` → `review.fill_reviewed`): every item's
  `provenance.review` (`score`, `teaching`: `yes` is true, `no` and `fix` false, `null`
  undecided) and, per current decision, a `reviewed` fact (`reviewedScore`,
  `reviewedTeaching`) with the value, the basis, the date and the event id. A PDMX quarry
  `keep` is neither bit.
- **The rung-claims report** (`docs/prompts/rung-claims.md`): the teaching-use decision and
  its basis beside every option of the priority rungs.
- **The family contracts** (`tools/content/family_contracts.json`): `heard` stays a
  hand-maintained declaration, and `test_family_contracts.py` holds that a family marked
  `heard: true` has at least one `heard` decision on a current item of it (never the reverse).
- **The microscope**: every event on the item with its status, beside the facts.
