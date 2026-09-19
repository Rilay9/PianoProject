# T5 — The quarry, for the seventeen rungs that need music

**Read `docs/prompts/working-rules.md` first.** §2.7 is the one that matters here: the
previous session called this task blocked for hours and it was not.

## What is already done, and must not be redone

- **`build/pdmx-genres/candidates.json` holds the full shortlist** from 2026-09-16 —
  74,769 rows, of which **343 match a named want**. No `index.py` and no `shortlist.py`
  run is needed. The blues run took 27 of those and stopped.
- **All 37,261 scores are unpacked** under `build/pdmx/library/<first two chars>/<cid>.mxl`.
  `tools/content/archive_notation.py` reads any of them directly.
- **41 candidates are already quarried and waiting**, in `build/pdmx-p22b/`: converted,
  round-tripped, structure-checked, deduped and **rendered against a real browser** with
  step counts equal to cursor-step counts on every row. `build/pdmx-p22b/review/index.html`
  is the page; `review.csv` is the sheet.

Every statement above is a proxy for the disk (§1). Check each before relying on it; two of
them were false when the previous session assumed them.

## The gate that is real

`review.py`: *"Nothing is committed that a person has not marked `keep`. The machine gates
decide what is **usable**; only an ear decides what is worth practising."* `commit.py`
refuses a row with no decision. **Do not route around this** — it is a considered rule and
it is the only thing standing between the catalog and 37,261 unvetted transcriptions.

So the agent's job ends at a filled review page. The owner's job is the ticking.

## What still needs quarrying

`docs/genre-plans/*.md` marks every candidate `IN ARCHIVE` with its content id. **136 of
them** across twelve tracks. The concentrations:

| track | waiting | missing entirely |
|---|--:|--:|
| latin | 23 | 4 |
| hymns | 19 | 1 |
| holiday | 15 | 1 |
| jazz | 14 | 15 |
| rock | 12 | 3 |
| classical | 11 | 12 |

**Latin and hymns are the best value**: most waiting, almost nothing missing, and both
tracks currently have holes at four or more stages.

There are also **265 classical candidates in the existing shortlist that have never been
extracted**. Classical is a complete 3→9 ladder already, so that is depth rather than
coverage — lower priority, and `02` Part A item 5 says depth belongs in the Library.

## How

1. Filter `build/pdmx-genres/candidates.json` to the wants you want. Write **both** the
   `candidates` and `rows` keys — the file carries both and `extract.py` reads
   `candidates`; writing only `rows` extracts 793 members instead of 44.
2. `extract.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --candidates … --out …/raw`
3. `quarry.py --candidates … --raw … --out … --catalog app/public/content/catalog.json`
   — **no `--skip-render`**, and nothing else building content or holding port 4173.
4. **Verify the render actually ran.** Check `render_steps` and `render_cursor_steps` on
   every ok row: no zeros, no nulls, and the two equal. An earlier rerun marked every row
   `render` because the preview server would not start, and a skipped render must never be
   read as a pass.
5. `review.py --quarried … --candidates … --out …/review --previews …/previews`
6. Stop. Report the page's path and what is in it, grouped by track and level.

## Done

The review page exists, every ok row has real and equal step counts, and
`docs/pending-review.md` carries one entry with the gate-by-gate numbers, the refusals with
their reasons, and **the rejection rate per band** — the two earlier runs were 89% and, at
band 7–9, 53%, so a rate far from those is itself a finding.
