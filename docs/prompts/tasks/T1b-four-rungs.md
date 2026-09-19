# T1 — Build the four rungs that need no new music

**Read `docs/prompts/working-rules.md` first.** §2.4 governs this task: one item per tool
call, with its evidence line, and no bulk script. Every content mistake in this repository
was made inside a batch.

## What

Four rungs whose repertoire is already in the built catalog. No quarry, no archive, no
converter, no browser.

| rung | track | stage | teaches | pieces already in the catalog |
|---|---|---|---|---|
| `jazz.4` | `jazz` | 4 | swung eighths, comping on plain triads, trading fours | 5 |
| `rock.3` | `rock-metal` | 3 | **narrow** the existing overview to reduction; the other four textures now have rungs | 4 |
| `holiday.2` | `holiday` | 2 | carols you can play this year | 5 |
| `holiday.4` | `holiday` | 4 | three cheap devices that sound expensive | 4 |

`rock.3` is not new — `rock.overview` exists and carries twelve concepts. `rock.4`–`rock.7`
now teach eleven of them. This narrows it.

The candidates are in `docs/genre-plans/jazz.md`, `rock.md` and `holiday.md`, each marked
`IN CATALOG` with its level, metre, staves, bars and chord-symbol count already read from
the file. **Those statuses were produced on 2026-09-18 and are a proxy for the catalog
(§1).** Re-check each id against `app/public/content/catalog.json` before using it.

## How

For each rung, in this order:

1. `python3 tools/content/candidates.py --rung <id>` once the rung exists, or
   `--min-level X --max-level Y` with the requirements you intend, to see the field.
2. Choose options **one at a time**. Before writing each id, write its evidence line:
   ```
   <item id> → <rung> | key=… times=… staves=… bars=… chordCount=… | <why those fields mean it fits>
   ```
   If you cannot write that line, you have not checked it. Paste all of them into
   `docs/pending-review.md`.
3. Add the unit and lesson to `content/curriculum/stage-<n>.json`.
4. Give the rung a `requires` block if it teaches something checkable — chord symbols, a
   metre, a mode, two staves. `validate.py` will enforce it. A rung whose concepts include
   `chord-symbols`, `four-part-harmony`, `waltz-bass`, `relative-minor` or `minor-triad`
   **must** have one.
5. Give it `tools` — the modes are listed per rung in `docs/genre-plans/`. A rung that
   names no mode is an INFO finding in `rung_audit.py`.
6. **Write the lesson last, from the rung as built**, never from the plan. Print what the
   rung actually holds, then write the prose against that printout. Add each checkable
   claim to `app/tests/unit/lessonClaimsAboutMusic.test.ts`.

## Constraints that will bite

- `levelBand` must contain every option. Write it **after** the options are chosen.
- `readingTime` = `ceil(words / 200)` exactly; ≤ 600 words.
- No hyphenated track slug in the prose (`rock-metal`, `hymns-gospel`), no camelCase word,
  no `docs/NN`, no `file.ts`.
- A lesson saying "N options" must offer exactly N **songs**.
- Every concept must already be in `content/curriculum/concepts.json`. `latin-feel` was
  invented once and had to be removed — check before writing.

## Done

`npx tsc -b`, `npm run lint`, `python3 tools/content/build.py --offline`,
`python3 tools/content/ladder_report.py`, `python3 tools/content/validate.py`,
`python3 tools/content/rung_audit.py --rung <each>`, `npx vitest run`. One entry in
`docs/pending-review.md` with every evidence line, and **the list of what is unverified**
— which includes whether the lessons teach, since no check can decide that.
