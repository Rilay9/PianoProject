# P10 (first run) — the `[KERN]` tier: what was decided, and what the ladder could not supply

Date: 2026-09-06 · Branch: `feat/p10-content-1` · Prompt: `prompts/P10-content-expansion.md`

**Track and rung for this run: D5 Ragtime, Stage 6** (`ragtime.6`). The importer that rung
needed serves the whole ragtime tier, so `content/sources/kern.json` carries all eight Joplin
rags the D5 ladder names across Stages 6–8; only the Stage 6 rung got curriculum and lesson
text. Stages 7 and 8 are a follow-up, not a gap in this one.

---

## 1. `--allow-nc` opens five repositories, and exactly five

P4 refused the whole `[KERN]` tier. `00` D10a changed the premise — the app is for one person
— so a personal build may carry CC BY-NC editions. Re-measured on the actual clones rather
than taken from P4's notes:

| Repository | `LICENSE.txt` | Per-file record | Verdict under `--allow-nc` |
|---|---|---|---|
| `bach-370-chorales` | CC BY-NC-SA 4.0 | none | bundle |
| `haydn-piano-sonatas` | CC BY-NC-SA 4.0 | `!!!YEM` | bundle |
| `joplin` | CC BY-NC-SA 4.0 | `!!!YEM` in all 47 | bundle |
| `mozart-piano-sonatas` | CC BY-NC-SA 4.0 | `!!!YEM` | bundle |
| `scarlatti-keyboard-sonatas` | CC BY-NC-SA 4.0 | `!!!YEM` | bundle |
| `beethoven-piano-sonatas` | **none** | none | **reject** |
| `chopin-mazurkas` | **none** | none | **reject** |
| `chopin-preludes` | **none** | bare `!!!YEC` copyright, no `!!!YEM` | **reject** |

The Chopin preludes are the interesting case: each file says *"Copyright 2001 by Craig Stuart
Sapp"* and nothing else. That is a claim of rights, not a grant of them, so it fails the gate
as an unrecognised licence — which is the correct answer and, importantly, an answer with a
reason attached rather than a name on a blocklist.

`import_kern.assert_excluded()` re-runs that check on **every build**, at the most permissive
setting (`allow_nc=True`), and raises rather than importing if one of the three ever passes.
It also refuses a table that names a file inside one of them. A flag this consequential should
not be guarded by a comment.

## 2. One table, two builds

The problem with a `--allow-nc`-only import is the curriculum: `ragtime.6` names three song ids,
and a build without the flag would have none of them, so validation would fail on the public
build and pass on the private one.

So every row produces a catalog item either way. With the flag it is the score; without it, it
is an **import placeholder** — no file, the licence that stopped it, an `importHint` saying how
to get the score, and `alternatives` that resolve. Both shapes were already in the schema for
`02` Part D8's copyrighted songs; this is the same idea applied to an edition rather than a
composition. A public build therefore ships no non-commercial bytes and still has a coherent
Stage 6.

Related, and overdue: `pages.yml` now runs `build.py --strict-license`. `docs/decisions/
2026-09-06-p9-qa-and-packaging.md` says the public deploy "keeps the strict build", and it
did not — neither workflow ever passed the flag. That was harmless while every bundled item
was public-domain, and would have stopped being harmless with this commit.

## 3. Nothing in the table is trusted

`content/sources/kern.json` is data a human edits, so `import_kern.py` re-derives every fact it
could get wrong:

- the repository licence, from `LICENSE*`/`README*`;
- the file's own rights records, `!!!YEM` then `!!!YEC`;
- the publication year, from `!!!ODT` then `!!!PDT` — **never `!!!CDT`**, which is the
  composer's dates and would date every Joplin rag 1868;
- and if the table states a `publishedYear` that the file contradicts, the row is excluded
  rather than believed. (Tested both ways.)

`kern_reference_records()` had to be fixed first: it read only a file's header and stopped at
the first data line, so it returned the title and the composer and missed the licence — the one
record it exists to find. craigsapp puts the rights records *after* the music.

## 4. A conversion bug the listen-check found

Comparing each converted `.mxl` against its `**kern` original note for note — same part, same
bar, same offset within the bar, same MIDI number — four of the eight rags did not match.

A `**kern` spine that splits mid-bar produces a `stream.Voice` sitting at a later offset inside
the measure. music21's MusicXML writer assumes a voice begins where its measure does: it emits
`<backup>` all the way to the barline and writes the voice's notes from there. So a voice that
enters on beat 3 was written on beat 1.

| Rag | Displaced voices | Notes affected |
|---|---|---|
| *Pine Apple Rag* | 14 | 50 |
| *Peacherine Rag* | 8 | 15 |
| *The Entertainer* | 2 | 6 |
| *Bethena* | 2 | 5 |

`convert.py`'s `align_voice_offsets()` pads such a voice with a leading rest and moves it to the
barline, which says the same music in the shape the writer can express. The rest is marked
`print-object="no"`, so the engraving is unchanged. After the fix all eight rags match their
sources exactly.

This was never a Joplin problem. It has been in `convert.py` since P4 and would have silently
corrupted every future `**kern` import — the Mozart and Scarlatti sonatas above all, which are
full of mid-bar voice entries.

## 5. What the ladder asked for and the source does not have

`02` D5 names ten pieces across Stages 6–8. Eight are in `craigsapp/joplin`. The other two, and
one more, are recorded in the table's `absentFromSource` block rather than quietly swapped:

- ***Euphonic Sounds*** (1909), a Stage 8 option — `craigsapp/joplin` holds 47 rags and this is
  not one of them.
- ***Frog Legs Rag*** (James Scott) and ***Ragtime Nightingale*** (Joseph Lamb), both Stage 8 —
  the repository is Joplin only.

Two more, found while checking the D1 classical ladder against the same repositories and left
for the runs that will need them:

- **Scarlatti K.32, K.9 and K.380** (`02` D1 Stages 5 and 7) are not among the 65 sonatas in
  `scarlatti-keyboard-sonatas`. Present K numbers include 001, 025, 049, 052, 055, 060, 075,
  084, 085, 093, 113, 114, 122, 139, 146, 148, 156, 158, 160, 165, 166, 170, 200, 205, 220,
  225, 227, 235, 238, 244, 251, 258, 269, 281, 296, 303, 306, 320, 330, 336, 345, 348, 360,
  369, 372, 384, 406, 408, 425, 434, 442, 450, 461, 470, 476, 478, 491, 492, 498, 502, 512,
  513, 514, 525 and 534 — so the rung can be filled, but not with the numbers the doc names.
- **Mozart K.545, K.331 and K.310** *are* present, as `sonata15-*`, `sonata11-*` and
  `sonata08-*`; the mapping is in each file's `!!!SCT1:` record, not in the filename.

This is the same queue P5 started: a list of things to go and find elsewhere, not a list of
failures.

## 6. Levels follow real difficulty, not the rung number

`02` D5 puts *The Entertainer* at ragtime Stage 6, and the MuseTrainer edition of the same
piece is already in the catalog at level 7.1. Both are right: the D5 numbers are a
within-track order, and `level` is a single global difficulty used for swaps and ordering.
Where they disagree, the kern rows follow the existing catalog's difficulty scale (so the two
editions of one rag do not sit two stages apart) and the *curriculum rung* follows D5. Worth
the owner's eye: it means Stage 6 of the ragtime track offers level-7 songs, which is honest
about the repertoire — the easiest complete Joplin rag is a Grade 6 piece.

## 7. What no one has heard

The "listen-check" in this run is a machine one: note-for-note equality against the source, and
a Chromium render of every item through the app's own loader. **Nobody has played these eight
rags through the app**, and no ear has been near them. They are on the owner checklist.
