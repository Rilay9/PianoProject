# P10 (run 2) — the Chopin first editions, and making the upper rungs wide

Date: 2026-09-06 · Branch: `feat/p10-content-2` · Prompt: `prompts/P10-content-expansion.md`

Run 1 opened the `[KERN]` tier under `--allow-nc` and filled one rung. This run answers a
question the owner asked straight afterwards — *"is there no other source for music?"* — and
then acts on the answer. Two rules held: state what was measured, and never let a rung offer
three options when the source can honestly supply twenty.

---

## 1. There was a much better source, and it needs no flag at all

`humdrum-tools/humdrum-data` indexes 75 Humdrum collections. Working through the
piano-relevant ones:

| Collection | Files | Licence, read from the repository | Verdict |
|---|---|---|---|
| **`pl-wnifc/humdrum-chopin-first-editions`** | 512 | **CC BY 4.0** (Fryderyk Chopin Institute) | **imported** |
| `pl-wnifc/humdrum-polish-scores` | 8,918 | CC BY 4.0 | reachable, opt-in, unused so far |
| `humdrum-tools/bach-wtc` | 96 | *"Rights to all derivative electronic formats reserved."* | refused |
| `humdrum-tools/inventions` | 30 | same reservation | refused |
| `craigsapp/hummel-preludes` | 24 | bare `!!!YEC`, no grant | refused |
| `craigsapp/art-of-the-fugue` | 20 | nothing stated | refused |

Two of those are worth calling out. **The NIFC editions are CC BY**, which is stronger than
anything else in the library: they need no `--allow-nc`, they ship in the public build, and
they cover exactly the Chopin that `craigsapp/chopin-preludes` and `chopin-mazurkas` — the two
repositories that state no licence — could not. The gap run 1 reported is closed.

And `docs/03` §2 had carried a standing note to "search GitHub for `bach-inventions humdrum`
and record what is found". They exist, under `humdrum-tools/` rather than `craigsapp/`, and
they are unusable. That question is now answered in writing so nobody searches again.

All of it is recorded in `content/sources/kern.json` under `checkedAndRefused`, and
`docs/03` §2 has a `[NIFC]` row.

## 2. 183 works from one table of 69 groups

Chopin's first editions hold 191 solo-piano works once songs, trios and concertos are
filtered out — by reading each file's spine header, not its genre tag. Writing 191 rows by
hand would have been 191 chances to mistype a title, so the table gained a second shape:

- **`items`** still names one file each (the 47 Joplin rags).
- **`groups`** describes an opus once — genre, concepts, a title pattern, a level — and the
  importer fills in the pieces. `Prelude No. {n} in {key}, Op. 28` plus the key already
  recorded in every file produces all 24 titles.

Three things the expansion has to get right, and each was got wrong first:

- **One edition per work.** The same prelude appears under Breitkopf and under Catelin, and
  `028-1-BH-001` and `028_1-12-1a-C-001` are the same music. The work key strips the publisher
  and the volume range; the table states the publisher order (German house first, the text
  most modern editions descend from).
- **Major or minor.** Five sharps is B major or G-sharp minor. The `*B:` record in Prelude
  Op. 28 No. 12 encodes the *signature*, not the key, so trusting it printed "Prelude No. 12
  in B major" on a piece in G-sharp minor. The order is now: the `!!!rism-key` catalogue
  record (411 of 512 files), then the lowest note of the last bar, then the mode record. All
  24 preludes come out right, and so do the eight Joplin rags.
- **Ids that do not collide.** The MuseTrainer library already holds transcriptions of five of
  these pieces under the obvious ids. The NIFC items carry `.nifc`, so the scholarly first
  edition sits *beside* the amateur transcription rather than on top of it — which is a
  feature: `00` D21 wants alternatives, and comparing two editions of one prelude is a lesson
  in itself.

**Honesty about levels.** A level that came from the group default rather than from a
judgement about that piece is tagged **`level-banded`** in the catalog: 129 items, 90 of the
182 Chopin works and all 39 Joplin rags added this run. The tag is the difference between
a measurement and a guess, and it is visible in the app rather than implied.

## 3. A licence gate that reads a URL, and a composition test that reads a person

Two changes were forced by the NIFC files and both are general improvements.

**The gate could not read a licence URL.** NIFC's `LICENSE.txt` says
`License: https://creativecommons.org/licenses/by/4.0` and never spells "CC BY" out.
`normalise_license` returned the whole file as an unrecognised string and rejected all 512
scores. It now reads the canonical deed URL, which is the machine-readable form most
repositories use. (An unrecognised licence is also now quoted back in 80 characters rather
than in full, once per rejected file.)

**The files carry no date.** Not one of the 512 states `!!!ODT` or `!!!PDT`; they state a
publisher and a plate number. `composition_verdict` gained a second route, keyed on the
composer's death year — a fact about a person, which is why it may come from a table when a
publication year may not. The importer still has to read `!!!COM` out of the file first, and
the table lists all eleven spellings of Chopin's name that appear across the 512 files,
including the one an encoder typed as "Chopipn".

The bar is 1930, **not** life+70, and that is the point of the test that guards it: Bartók
died in 1945 — inside life+70 — and his 1940 editions are in copyright in the US. A life+70
test alone would have waved them through. There is a second guard for the one case a
long-dead composer's work could still be protected — a modern first publication of a
manuscript — which is that the file must name a publisher, in `!!!PPR` or in the Rink-Grabowski
siglum in its filename.

## 4. The rungs are wide now

| Rung | Song options | Exercise options |
|---|---|---|
| `classical.6` | 21 | 9 |
| `classical.7` | 22 | 8 |
| `classical.8` | 23 | 8 |
| `classical.9` | 17 | 6 |
| `ragtime.6` | 10 (was 3) | 5 |
| `ragtime.7` | 11 | 5 |
| `ragtime.8` | 8 | 5 |
| `beautiful` | 9 (was 5) | 3 |

`00` D21 asks for three. Three is a floor for a rung that cannot do better, not a target. The
ragtime track went from 8 pieces to 47 by tabling the rest of `craigsapp/joplin` — including
*School of Ragtime*, Joplin's own six teaching exercises, which is the best possible Stage 6
entry point and was sitting unused in a repository already on disk.

## 5. What was lost, and why it is not hidden

**Chopin's Étude Op. 25 No. 7 is not in the library.** The cadenza in bar 27 is a 29-in-24
tuplet whose base value is a 2048th note, and MusicXML stops at 1024th, so music21 refuses to
export it. Quantising it would change the music, so the piece is excluded with that reason
written into the table rather than silently rounded. Import your own copy if you want it.

**Thirteen more are excluded because the engraver will not draw them.** They convert cleanly,
music21 round-trips them note for note, and OSMD's VexFlow throws
`Invalid note initialization object: {}` — an empty note struct — so the score does not render
at all. Ruled out, by testing each in the browser: grace notes (removing all fifteen from the
Op. 9 no. 2 nocturne changed nothing) and beams. The cause is still unknown and is the first
thing to pick up next; the reproduction is one `loadUrl` call in `/dev/score`.

The list: Nocturnes Op. 9 nos. 1, 2 and 3, Op. 48 no. 2, Op. 62 no. 2 and Op. 72 no. 1;
Prelude Op. 28 no. 24; Waltz Op. 69 no. 1; Impromptus Op. 29 and Op. 36; the Allegro de
concert; the Grande polonaise; and the Variations on a German National Air. **169 of the 183
Chopin works are in the library**, and the curriculum's Stage 7 and 8 rungs swapped in
neighbours at the same level rather than shrinking.

Two of the original fifteen *were* fixable and are fixed: VexFlow refuses a beam on a note
whose printed value is a quarter or longer, which music21 emits from these sources — including
on notes inside tuplets, where the sounding length is shorter than a quarter but the printed
type is not. `clean_beams()` drops those beams (engraving, not music) and the Op. 15 no. 2
nocturne and the Op. 4 sonata finale render.

Three things this exposed, all fixed:

- Group expansion names sibling pieces as `alternatives` *before* anything is converted, so a
  piece that then fails to convert left its neighbours pointing at nothing. Alternatives are
  now pruned to what actually got in.
- **The render check could not see its own failures.** `DevScoreScreen.loadXml` catches every
  exception into `lastError` and resolves anyway, so a score OSMD could not draw looked like a
  successful load, left the *previous* score in the model, and then timed out waiting for an
  SVG — reporting a 20-second mystery instead of the exception, and risking one item's
  measurements being recorded against another's id. The check now reads `lastError()` straight
  after loading. That is how the thirteen above got names.
- **The check was also running out of memory.** One page for 749 scores: Chromium was killed
  after 586 and every item after that reported "Target crashed". It now reopens the page every
  40 items.
- `build.py` concatenated stderr after stdout, so a build reported a Humdrum parser warning
  where the `[KERN]` import count should have been — which is how a missing étude got as far
  as validation before anyone noticed. stdout goes last now.
- The catalog schema's `tracks` enum had drifted from `content/curriculum/00-tracks.json`:
  `rock-metal`, `jam` and `beautiful` were tracks in the curriculum and not in the schema.
  Adding a Chopin prelude to the Beautiful-pieces module is what surfaced it.

## 6. Still nowhere

Unchanged from run 1 and still open: *Euphonic Sounds*, James Scott's *Frog Legs Rag*, Joseph
Lamb's *Ragtime Nightingale*, and Scarlatti K.32 / K.9 / K.380. Mutopia was checked this run
and has none of them either — but it does hold 18 Joplin rags whose `.ly` headers say
`license = "Public Domain"`, which is a stronger licence than the edition the ragtime tier
currently uses. Re-sourcing ragtime from Mutopia would drop the last `--allow-nc` dependency
in the classical and ragtime tracks. That is the obvious next run.

## 7. What no one has heard

Same as run 1, and now at ten times the scale. The checks are note-for-note equality against
the `**kern` source and a Chromium render of every item through the app's own loader. **No ear
has been near any of these 183 Chopin scores.** The levels on the `level-banded` items are
estimates by genre and opus, not judgements about the individual pieces, and the owner should
expect to move some of them.
