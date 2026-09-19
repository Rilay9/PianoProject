# T7 — The genre concepts: review what was added, and decide the silent cells

**Read `docs/prompts/working-rules.md` first.**

**Status: the vocabulary half is done and needs checking, not repeating.**
`docs/pending-review.md` Entry 17 is the record. 18 concepts were added and attached to 21
rungs on 2026-09-18. What is left is a review that needs a musical ear, and one content
decision that is not a vocabulary question at all.

## Why a missing concept is not bookkeeping

A concept id does four jobs, so a genre with no word for its own ideas is a genre the app
cannot reason about:

1. A lesson declares what it teaches with it.
2. `orphan_exercises` in `validate.py` clears a generated exercise reachable from **a
   concept a lesson carries** — so an exercise whose idea has no concept can only be
   reached by being named on a rung directly.
3. `alternativesFor` offers a swap only when two items **share a concept** and sit within
   half a level. No shared concept, no swap.
4. Each concept carries a `finder` — the block that tells the owner what to search for. No
   concept, no finder, so the genre cannot ask for more of itself.

## Part A — check the 18, because nothing else will

**Done, 2026-09-18 — `docs/pending-review.md` Entry 19.** An independent review checked all 18
and the lessons around them; the three flagged below were resolved (`crushed-note` removed from
classical.4, `rhythm-changes` moved to jazz.7 with a paragraph that teaches it, `tango` removed
from blues.6), along with a dozen other attachments and several musical errors in the lessons.
Entry 19's "Not done" list is what remains of Part A. Parts B and C still stand.

The table is in Entry 17. Each concept was attached only where a lesson **already teaches
the idea in prose**, and the proving line is recorded beside it. That rule makes the
attachments defensible; it does not make them right.

**The suite ran 163 files and 2,171 tests before and after — an identical count. No test
covers any of this.** The build passing proves the ids resolve.

The three most worth a second opinion, because they are the ones where the prose was
thinnest or the reading was mine:

- **`crushed-note` on `classical.4`.** The blues rungs crush a grace note to imitate a bent
  string; `classical.4` teaches the acciaccatura. Same gesture, two traditions. One word or
  two is a judgement about whether a learner benefits from seeing them linked.
- **`rhythm-changes` on `jazz.8`.** The lesson discusses *Rhythm*'s bridge without ever
  using the term "rhythm changes". The concept was added because the rung teaches the
  thing; check it is not a word the rung would rather introduce itself.
- **`tango` on `blues.6`.** The prose says the habanera figure is "closer to a tango than
  to eight even eighths" — which may be an analogy rather than a claim that the rung
  teaches tango.

## Part B — the silent cells, which is the bigger finding

The same query exposed something larger than vocabulary. Tracks and the stages they reach:

| track | reaches | silent at |
|---|---|---|
| jazz | 5–9 | **0–4** |
| latin | 3, 5 | **4, 6–9** |
| hymns-gospel | 2, 3 | **4–9** |
| holiday | 2, 3 | **4–9** |
| jam | 4–6 | 7–9 |
| rock-metal | 3–7 | 8, 9 |
| ragtime | 5–8 | 9 |

`docs/genre-plans/` §4 already argues that latin above 6.5 and holiday above Stage 7
**should** stay empty, and nothing since has changed that. **Jazz having nothing before
Stage 5, and latin skipping Stage 4, are not argued anywhere.** Those two are the decision.

This is the owner's stated goal — every stage more interesting *where it is a natural
fit* — so the honest answer may be "these stay empty, here is why". §2.13: a skip is a
judgement only when the reason is written down.

## Part C — the rejection list is the shopping list

Entry 17 rejected roughly forty candidates, in four groups, and the fourth group matters
here: **real ideas that nothing in this repository teaches** — `quick-change`, `backbeat`,
`ghost-note`, `bebop-scale`, `enclosure`, `drop-2`, `locked-hands`, `cáscara`, `guajeo`,
`cinquillo`, `gospel-run`, `passing-diminished`, `doo-wop`, `jig`, and about a dozen more.

They were rejected because **a concept nothing carries is vocabulary for its own sake**.
But they cluster almost exactly on the silent cells in Part B: gospel, latin above Stage 5,
and bebop. If Part B adds rungs, this list is what those rungs teach. Do not add the
concepts first.

## Two traps this task already fell into once

- **Volume is not evidence.** `jazz-harmony` sits on **158 catalog items** and no lesson
  teaches it. So do `wide-span` (228) and `hand-crossing` (63). They are importer labels.
  The tempting number was the wrong signal.
- **A word in a lesson may be a song title.** `coda`'s only occurrence is *For the Damaged
  Coda*. `prelude`, `rondo`, `fugue`, `minuet`, `polonaise`, `passacaglia`, `invention` and
  `nocturne` are all piece names in "what to play" lists. Grep with word boundaries and
  **read the surrounding line**, or six false concepts follow — `tag` matched *stage*,
  `lick` matched *click*, `stab` matched *establish*.

## Constraints

- `validate.py` requires every new concept to have a **`finder` or `appFeature: true`**. A
  finder's `constraints` must survive verbatim into the generated chat prompt, the
  copyright sentence must remain, and none of `download`, `free pdf`, `torrent`, `for free`
  may appear.
- `unknown_concepts` fails the build on a lesson naming an undefined concept — define
  before attaching.
- **Do not re-serialise a JSON file unless its round-trip is byte-identical.** `stage-0.json`
  and `stage-1.json` hold numbers Python wrote as `0.0` that `JSON.stringify` writes as `0`
  (stages 2–9 round-trip cleanly), so a rewrite of those two changes lines nobody meant to touch. Splice text instead. (Line endings are
  not the issue: `core.autocrlf=true` hides them from git. An earlier draft of this brief
  said otherwise and was wrong — `pending-review.md` Entry 17.)

## Done

`build.py --offline`, `validate.py`, `rung_audit.py`, `npx vitest run`. One entry in
`docs/pending-review.md`. If Part A changes nothing, **say so explicitly** — a review that
confirms is worth as much as one that corrects, and Entry 17 currently has no second
reader.
