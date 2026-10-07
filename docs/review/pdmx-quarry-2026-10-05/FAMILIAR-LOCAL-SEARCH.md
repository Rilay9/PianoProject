# Full-PDMX familiar-song search packet

Date: 2026-10-05
Purpose: run on the owner's machine against the local full PDMX archive while product builders work elsewhere. This is discovery only; it changes no curriculum or app file.

The repository's supported whole-archive path is `tools/content/pdmx/index.py`; the archive is intentionally local-only. Use the existing index/search/extract/quarry/review tooling rather than writing a parallel parser.

## Goal

Find familiar songs that are musically useful even when they are not required to close a Fable gap. Prefer recognizable titles because an already-known tune gives the learner an internal timing/phrase/ear reference.

Do not make familiarity itself an admission criterion. Every surviving score still needs notation reading and a concrete teaching or optional-repertoire role.

## Search groups

### Mainstream piano/pop/rock

Search exact title first, then artist where useful:

- Let It Be — Beatles
- Yesterday — Beatles
- Something — Beatles
- Imagine — John Lennon
- Stand By Me — Ben E. King
- Lean on Me — Bill Withers
- Bridge Over Troubled Water — Simon & Garfunkel
- Piano Man — Billy Joel
- Vienna — Billy Joel
- Your Song — Elton John
- Rocket Man — Elton John
- A Thousand Miles — Vanessa Carlton
- Mad World — Tears for Fears / Gary Jules
- Someone Like You — Adele
- When We Were Young — Adele
- The Scientist — Coldplay
- Clocks — Coldplay
- Fix You — Coldplay
- Viva La Vida — Coldplay
- Chasing Cars — Snow Patrol
- Iris — Goo Goo Dolls
- Creep — Radiohead
- No Surprises — Radiohead
- Karma Police — Radiohead
- Hallelujah — Leonard Cohen
- Don't Stop Believin' — Journey
- Sweet Home Alabama — Lynyrd Skynyrd
- Dream On — Aerosmith
- Wish You Were Here — Pink Floyd
- Hotel California — Eagles
- Landslide — Fleetwood Mac
- Dreams — Fleetwood Mac

### Country / country-adjacent

There is no need to create a country curriculum track. Search these as possible accompaniment, ear, chord-chart, arranging, groove or optional-project material:

- Take Me Home, Country Roads — John Denver
- Jolene — Dolly Parton
- Ring of Fire — Johnny Cash
- I Walk the Line — Johnny Cash
- Folsom Prison Blues — Johnny Cash
- Tennessee Whiskey — Chris Stapleton
- The Gambler — Kenny Rogers
- Wagon Wheel — Old Crow Medicine Show / Darius Rucker
- On the Road Again — Willie Nelson
- Friends in Low Places — Garth Brooks
- Always on My Mind — Willie Nelson
- The Dance — Garth Brooks
- Blue Eyes Crying in the Rain — Willie Nelson
- Coat of Many Colors — Dolly Parton
- Amarillo by Morning — George Strait

### Owner-likely / rock-metal

- For Whom the Bell Tolls — Metallica
- Nothing Else Matters — Metallica
- Enter Sandman — Metallica
- One — Metallica (existing quarry edition is drums only; search specifically for another pitched/piano edition)
- Almost Easy — Avenged Sevenfold (existing quarry edition is drums only; search for another pitched edition)
- Seize the Day — Avenged Sevenfold
- So Far Away — Avenged Sevenfold
- Nightmare — Avenged Sevenfold
- Hysteria — Muse
- Starlight — Muse
- New Born — Muse
- Numb — Linkin Park
- In the End — Linkin Park

## Selection rule

For each title, keep at most a few materially different editions by job, not every duplicate:

1. open lead sheet / melody + chord symbols;
2. simple two-staff piano arrangement;
3. fuller arrangement/reduction if it adds an advanced job;
4. band score only when it enables a useful reduction/orchestration task.

Reject drum-only/guitar-tab-only editions for piano use unless rhythm analysis itself is the intended job.

## Output columns

Write a small result table with:

- title / artist;
- CID;
- shape and instrument parts;
- bars / meter / chord-symbol count;
- estimated level from index (discovery only);
- whether already in curriculum;
- likely job: CONTROL / MODEL-TRANSFER / MUSIC / INDEPENDENCE / OPTIONAL;
- exact reason it may be worth reading;
- `READ`, `PENDING READ`, or `REJECT EDITION`.

Then extract/read only the strongest candidates. Do not turn this into another general corpus audit.

## First recovered/manual exceptions to remember

- `A Thousand Miles` was rejected by the strict identity classifier because the creator field was literally `Words & Music by:`. That is not sufficient evidence that the composition is wrong. Manually inspect/recover that row.
- `One` and `Almost Easy` in the existing quarry are drum-only; search explicitly for alternate pitched editions rather than treating the title as exhausted.
- `Vienna` already demonstrates why multiple editions can be useful: one open chart plus one fuller piano realization supports an independence-before-comparison task.
