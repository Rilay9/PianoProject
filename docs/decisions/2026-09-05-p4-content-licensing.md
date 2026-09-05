# 2026-09-05 — P4: what the content sources turned out to allow

`docs/03-content-pipeline.md` §2 lists the sources to fetch and §1 states the
licensing rules as hard rules. Running the two against each other produced a
result worth writing down, because it changes where the repertoire comes from.

## 1. None of the eight Humdrum repositories can be bundled

`docs/03` §2 names eight `craigsapp/*` `**kern` repositories as the `[KERN]`
source — Mozart and Beethoven sonatas, Chopin preludes and mazurkas, Scarlatti
sonatas, Joplin rags, Bach chorales, Haydn sonatas. All eight exist and all
eight were cloned successfully. Their licences:

| repository | licence as stated | verdict |
|---|---|---|
| `bach-370-chorales` | CC BY-NC-SA 4.0 (LICENSE.txt) | not redistributable |
| `haydn-piano-sonatas` | CC BY-NC-SA 4.0 | not redistributable |
| `joplin` | CC BY-NC-SA 4.0 | not redistributable |
| `mozart-piano-sonatas` | CC BY-NC-SA 4.0 | not redistributable |
| `scarlatti-keyboard-sonatas` | CC BY-NC-SA 4.0 | not redistributable |
| `beethoven-piano-sonatas` | none; files carry `!!!YEC: Copyright 2008 by Craig Stuart Sapp` | no licence granted |
| `chopin-mazurkas` | none; same copyright record | no licence granted |
| `chopin-preludes` | none; same copyright record | no licence granted |

`docs/03` §1 rule 1 excludes CC BY-NC for redistribution, and an edition with a
copyright notice and no licence grants nothing at all. So the whole `[KERN]`
tier is out. `tools/content/licensing.py` encodes this and
`tools/content/tests/test_licensing.py` keeps it encoded; the converter still
handles `**kern` and is tested on it, because the format is fine — it is the
editions that are not.

The compositions are of course public domain. What is licensed is Craig Sapp's
*encoding*, and NC is a real restriction on a project that might be shared.

**What this changes:** the classical repertoire base is `[MT]` (59 pieces),
plus what we author ourselves, plus `[PDMX]` and `[MUTO]`, which are not yet
imported. Mutopia in particular is CC BY-SA and does carry Bach, Mozart,
Beethoven, Clementi, Czerny and Burgmüller — it should be the next import, and
it is already wired into `fetch.py` as an opt-in source.

**One question for the owner** is in the P4 report: if this app is only ever
installed on your own phone and never shared, NC does not bite, and the three
lines of `licensing.py` that refuse it could take a flag. That is your call,
not the pipeline's, and the default stays compliant either way.

## 2. A blanket "public domain" claim answers only half the question

`musetrainer/library` says "Public Domain MusicXML files" once, in its README.
It has no LICENSE file and no per-file terms. That claim can only speak to the
*editions*; it says nothing about whether each **composition** is in the US
public domain, and the library contains several that are not:

- three copies of *Mariage d'Amour* (Paul de Senneville, 1979), two of them
  filed under Chopin as "Spring Waltz";
- a "G Minor Bach" that is Luo Ni's modern arrangement, not BWV 578;
- a Richard Clayderman piece filed as "Hungarian Sonata".

Four more files are excluded on the *edition* side: their `rights` field names
a commercial sheet-music site or is a bare © with no holder.

So each of the 69 files is judged individually in
`content/sources/musetrainer.json`, with the reason recorded for the ten that
are excluded, and `tools/content/import_musetrainer.py` re-runs the
composition test rather than trusting the table. 59 are bundled.

## 3. Mutopia is the source that pays for itself

Fetching Mutopia for Hanon turned up two things worth more than the tunes:

- **Hanon 1–20** as LilyPond with the printed fingering, so the exercises are
  encoded from a published edition rather than from memory.
- **Clementi's Op. 42** (1801), which contains a scale-fingering chart for all
  24 keys — the "published scale book" the P4 prompt asks the generator's
  fingering table to be checked against.

Both are CC BY-SA 4.0, which is redistributable, and both are credited on the
items they produce. The composition in each case is public domain; what was
read from the CC BY-SA files is note data.
