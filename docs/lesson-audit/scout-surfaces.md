# Scout: on-screen surfaces outside the lesson audit

Read-only pass over four surfaces the lesson audit does not cover. Method: grep
and read, one pass per surface, cross-checked against `docs/04-ui-spec.md` §5
(and its §5b–§5e, §5c, §5c-1, §5c-2 subsections — the only doc section this
task allowed) and against the generator/engine source for anything a catalog
row or concept claims. This run was cut short by a usage limit before the
planned second pass over `app/src`; what that means per surface is in the
footer.

## 1. UI strings in `app/src/**/*.ts`

**Suspects: 0.**

Checked against `docs/04-ui-spec.md` §5: the mode selector labels and ids
(`ScoreScreen.ts:76-79` — `wait`/`Wait for me`, `tempo`/`Keep tempo`,
`listen`/`Play it to me`, `free`/`Free play`), the control bar's own items
(`▶`, `Hear it`, mode select, hands, tempo label, `⋯`), and every row named in
the `⋯` sheet (`ScoreScreen.ts:1122-1140` — Input, Section, Loop, Ladder,
Metronome, Bars in window, Size, Layout, Keys, Sound, Duet, Blind, Perform, and
`Rhythm only`/`Ladder`/`Duet` at lines 925/955/986) all match the doc's names
exactly. `LibraryScreen.ts:165-232` (`OPEN_AS`, the "seven ways in" the guide
promises) matches `GuideScreen.ts:156` word for word.

Read `app/src/ui/screens/GuideScreen.ts` in full (382 lines, the highest-risk
file for staleness since it is prose describing the rest of the app) and spot
verified its factual claims against the constants they describe:

- "after 1, 3, 7 and 21 days" (line 266) — matches `REVIEW_INTERVALS_DAYS =
  [1, 3, 7, 21]` in `app/src/data/progressStore.ts:48`.
- "three minutes" of sight-reading (line 88) — matches `{ kind:
  'sightreading', minutes: 3 }` in `app/src/curriculum/session.ts:65,75`.
- "two songs per lesson is a stricter rule you can turn on" (line 169) —
  matches the setting described at `settingsStore.ts:56` and the toggle at
  `SetupScreen.ts:849`.
- "Copy debug report" / "Download everything now" / "Offline only" / "Copy
  details" (lines 279, 277) — all found verbatim as button labels in
  `DiagnosticsScreen.ts:255`, `SettingsScreen.ts:445,582`, `errorBoundary.ts:56`.

Also checked: the tempo-percentage range quoted in Settings copy (30–130) against
`MIN_TEMPO_PCT`/`MAX_TEMPO_PCT` in `app/src/engine/prepareSession.ts:18-19` —
matches everywhere it is quoted (`SettingsScreen.ts`, `SetupScreen.ts`,
`settingsStore.ts`). The dynamics drill's "twice as much" language against
`targetRatio ?? 1.6` in `app/src/engine/drills/special.ts:399` — the tip file
(§ below) states the same 1.6× figure. `KEY_FLASH_MS` (900 ms,
`ScoreSession.ts:184`) is never restated as a number in any UI string, so
nothing to contradict.

No suspects found in the portion of `app/src` actually read. This is **not**
a full read of the 160 `.ts` files under `app/src` — see footer.

### `content/tips/*.md`

**Suspects: 0.**

Read all 27 files (807 lines total) in full. Checked every music-theory claim
against standard definitions: the major-scale formula
(`find-key.build-scale.md`), harmonic/melodic minor (`mode.md` implicitly,
plus the scale-construction claims), the interval mnemonics in
`ear-interval.md` (fourth = *Here Comes the Bride*, fifth = *Twinkle*, minor
third = the cuckoo, major second = *Happy Birthday* — all correct), the
Roman-numeral case rule and "ii is not II" in `roman-numeral.md` (correct: `II`
functions as a secondary dominant), and the 1.6× velocity ratio in
`dynamics.md` against the code constant above. No wrong statements found.

## 2. `content/curriculum/concepts.json`

**Suspects: 0.**

Read the full array (283 entries) — every `id`, `display` and
`finder.skill`. Checked id-to-display agreement (e.g. `harmonic-minor` →
"raised seventh", `melodic-minor` → "raising the sixth and seventh going up
and lowering them coming down", `relative-minor` → "shares a key signature",
`tritone-substitution` → "the one a tritone away", `plagal-cadence` → "IV to
I", `mazurka-rhythm` → "leaning on the second or third beat", the four
`polyrhythm-*` entries) against standard theory: all correct.

Ten entries (`injury`, `motivation`, `performance-mode`, `placement`,
`review-queue`, `self-assessment`, `session-planning`, `tempo-mode`, `tension`,
`wait-mode`) have no `finder` object at all. Checked this is deliberate, not a
hole: each carries `"appFeature": true`, and `app/src/curriculum/types.ts:163`
documents the flag as "a feature of this app rather than a musical skill: no
finder." `finderSheet.ts` only reads `finder.*` for concepts that have one.
Not a suspect.

One near-miss investigated and ruled out: `blue-note`'s finder text says "a
flattened third, fifth or seventh," while `docs/04-ui-spec.md` (in the Simon
blues section, not re-quoted here) calls the same passing tone "the raised
fourth." Both name the same pitch (the tritone above the root is enharmonic
between ♭5 and ♯4); the difference is spelling convention for engraving, not
a factual disagreement. Not reported as a suspect.

## 3. Generated exercise titles vs `notation` — `app/public/content/catalog.json`, `id` starting `exercise.`

Scanned: 1183 exercise items, programmatically (title text vs `hands`,
`keySig`, `notation.keys`, `notation.bars`), then hand-verified every hit
against the generator source in `tools/content/generate_exercises.py`.

**Suspects: 40** (one systematic pattern, two generator functions).

- `exercise.boogie.*` and `exercise.boogie.*.minor-blues` (36 items, e.g.
  `exercise.boogie.a.pinetop`, `exercise.boogie.c.root-fifth.minor-blues`) |
  title `"Boogie left hand — <pattern> in <key>"` | the piece is written for
  both hands and is catalogued that way (`hands: "both"`) | evidence:
  `tools/content/generate_exercises.py:4049-4051` builds the title with
  "left hand" in it, but `4064-4066` appends a real right-hand chord
  (`rh.append(fingered_chord(...))`) on every bar and line 4077 passes
  `"both"` as the `hands` argument to `catalog_entry`. A learner opening one
  from the title alone would expect a left-hand-only exercise; the app expects
  and judges a right-hand chord too.
- `exercise.stride.*` (4 items: `b-flat`, `c`, `e-flat`, `f`) | title
  `"Stride left hand in <key>"` | same shape of contradiction | evidence:
  `generate_exercises.py:3652` ("Stride left hand in …"), `3672-3678` (both
  `lh` and `rh` get notes/chords every bar — bass, chord, tenth, chord in the
  left, a full block chord in the right), `3686` (`"both"` passed to
  `catalog_entry`).

Checked and ruled out as suspects:

- `exercise.arpeggio7.*` (24 items: every major7/minor7 arpeggio transposed
  through 12 keys) | title correctly names each key (e.g. "E♭ minor 7th
  arpeggio") | `notation.keys` is `[{"fifths": 0, "mode": "major"}]`
  identically for *every* one of the 24, regardless of stated key — a
  key-mismatch scan flags all 24, but this is uniform across the whole
  family: the generator writes these with accidentals and no key signature at
  all, so `notation.keys` never describes the intended key for this
  generator function, key-correct or not. Not the kind of contradiction the
  title makes (it never claims a key signature). Not reported.
- `exercise.coordination.*.change` / `.hold` (10 items) | title `"Hands
  together in <key> — left hand changes/holds"` | a naive substring match on
  "left hand" flags these against `hands: "both"`, but the title's own first
  three words are "Hands together," so there is no contradiction — the
  substring match was a false positive. Not reported.
- Four `exercise.walking-bass.*.minor-blues` items | a first pass matched the
  English article "a" in "…over **a minor** 12-bar blues in B♭ minor" as the
  note name A; refining the regex to require a capitalised, non-article token
  removed all four. Not reported.
- `exercise.arpeggio7.c-minor7.2oct.both`, plus the other four C-rooted
  `arpeggio7` items (`c-diminished7`, `c-dominant7`, `c-half-diminished7`,
  `c-major7`) | these are the only `arpeggio7` items whose top-level
  `keySig` field is non-null — it reads `"C major"` for all five, an
  apparent side effect of `fifths: 0` defaulting to a real key name only
  when the root happens to be C. `LibraryScreen.ts:628` would display this
  as a "Key: C major" fact for e.g. the item titled "C minor 7th arpeggio."
  Flagged with low confidence: unlike the boogie/stride finding this is not
  confirmed against generator intent, only against the emitted data, and it
  is unclear whether a "Key" fact is meaningful for an arpeggio at all (a
  dominant/diminished/half-diminished-seventh arpeggio is not "in a key" the
  way a scale is). Listed here rather than under "unchecked" because the
  evidence (the literal field values) was read, but it is the weakest finding
  in this report.
- Bar-count check (title's "`N` bar(s)" vs `notation.bars`): 0 mismatches
  across all 1183 items.

## 4. Catalog song titles vs `notation` — same file, `type: "song"`

Scanned: 800 song items, same programmatic cross-check (title vs `hands`,
`keySig`, `notation.keys`), plus a check of "easy/simple" language in the
title against the `level` field.

**Suspects: 8**, one of them the strongest single finding in this report.

- `song.classical.chopin-mazurka-op59-3.nifc` | title *"Mazurka in C minor,
  Op. 59 No. 3"* | the piece is in F♯ minor, not C minor | evidence: the
  item's own `keySig` field reads `"f# minor"`, and `notation.keys` is
  `[{"fifths": 3, ...}, {"fifths": 6, ...}]` (3 and 6 sharps — consistent
  with F♯ minor and a modulation, and nothing like C minor's 3 *flats*,
  fifths −3). Chopin's Mazurka Op. 59 No. 3 is the F♯ minor mazurka; the
  title itself names the wrong key, not just a display field.
- Seven items where the title's stated minor key is correct but the `keySig`
  field displayed in the Library detail sheet (`LibraryScreen.ts:628`, "Key:
  …") names the *relative major* instead — the same pitch classes, wrong
  mode, because the source MusicXML apparently omits an explicit `<mode>`
  and the extractor (`extractScoreModel.ts:115-129`) defaults an
  unmarked key to major:
  - `song.classical.bach-toccata-fugue-bwv565` — "D minor" / Key shown: F major
  - `song.classical.bach-wtc1-prelude-2` — "C minor" / Key shown: E♭ major
  - `song.classical.brahms-hungarian-dance-5` — "G minor" / Key shown: B♭ major
  - `song.classical.chopin-ballade-1` — "G minor" / Key shown: B♭ major
  - `song.classical.chopin-prelude-op28-4` — "E minor" / Key shown: G major
  - `song.classical.chopin-prelude-op28-4.alt` — same, alternative edition
  - `song.classical.chopin-waltz-a-minor` — "A minor" / Key shown: C major
  One systematic cause, seven items (the `.alt` row is the same piece's
  alternative edition, counted separately since it is a separate catalog row).
- Five items whose title says "easy"/"simplified" while `level` is 6.0–7.0:
  `song.classical.chopin-nocturne-op9-2.easy` (6.1),
  `song.classical.radetzky-march-for-easy-piano.pdmx` (6.45),
  `song.pop.the-weeknd-the-weekend-blinding-lights-easy-piano.pdmx` (6.28),
  `song.pop.toby-fox-fallen-down-reprise-undertale-easy.pdmx` (6.01),
  `song.ragtime.joplin-easy-winners` (7.0). Reported with low confidence:
  I read the `level` field but did not verify what the level scale calls
  "easy" in absolute terms, or whether "easy" in these titles is relative to
  the original (uncut) piece rather than to the app's own ladder — a real
  possibility for "easy piano" arrangements of pieces that are very hard in
  their original form. Flag, do not treat as confirmed.

Checked and found clean: hand-word claims ("left hand" / "right hand" /
"hands together") in song titles against the `hands` field — 0 mismatches
across all 800.

## What was and was not scanned

**Surface 1 — `app/src/**/*.ts` (160 files) and `content/tips/*.md` (27
files).** Scanned in full: `content/tips/*.md` (807 lines, all 27 files, read
end to end). Scanned by targeted grep plus full read of one file:
`app/src/ui/screens/GuideScreen.ts` (382 lines, read in full — chosen as the
single highest-risk file, being hand-written prose describing the rest of the
app) and `docs/04-ui-spec.md` §5/§5b–§5e/§5c/§5c-1/§5c-2 (762 lines, the one
doc section the brief allowed) as the reference for current names. Grepped
and verified: mode names and ids, the `⋯` sheet's row names, the "Open as…"
seven-way list, the tempo-percent range, the review-interval days, the
sight-reading minutes, the two-songs setting, four Settings/Diagnostics
button labels, `KEY_FLASH_MS`, and the dynamics velocity ratio.
**Not scanned:** the remaining ~159 files under `app/src` were not read
end to end — no systematic pass was made over drill prompts, status lines,
empty-state text, or help copy outside what the grep patterns above happened
to surface. This was the planned next step when the run was cut off by a
usage limit. Nothing in this category should be read as "checked and clean"
beyond the specific strings named above.

**Surface 2 — `content/curriculum/concepts.json`.** Scanned in full: all 283
entries' `id`, `display`, and `finder.skill` fields, read end to end and
cross-checked against standard music theory. The `finder.constraints`,
`finder.avoid`, `finder.formats`, `finder.levelWords`, `finder.searchQuery`
and `finder.chatPrompt` sub-fields were not individually read for every
entry — only `finder.skill` was pulled for the full-corpus pass; a handful of
entries' full `finder` blocks were read when investigating a specific
concept (e.g. `blue-note`). Complete for `skill`; partial for the rest of
`finder`.

**Surface 3 — `app/public/content/catalog.json`, `exercise.*` (1183
items).** Scanned programmatically in full for three checks: title-stated
key vs `keySig`/`notation.keys`, title-stated hand vs `hands`, title-stated
bar count vs `notation.bars`. Every flagged item was then hand-verified by
reading the catalog row and, for the boogie/stride family, the generator
source (`tools/content/generate_exercises.py`). Not checked: exercise titles
against `notation.times` (time signature) or `notation.staves` beyond the
boogie/stride case, and no check was made for exercise titles naming a chord
quality, pattern name, or octave count against `drill.params` (e.g. whether
every title saying "2 oct" truly has two-octave range in the notation) —
only key, hand and bar count were checked as the brief specified.

**Surface 4 — same file, `song.*` (800 items).** Scanned programmatically in
full for: title-stated key vs `keySig`/`notation.keys`, title-stated hand vs
`hands`, and title language ("easy"/"simple"/"simplified") vs `level`. Not
checked: arrangement claims other than hand and difficulty words (e.g. "duet
arrangement," "for beginners" phrased without the words "easy/simple," or a
title naming a specific edition/transcriber whose claim I could not verify
against the source metadata) — these would need a wider word list than the
one used here.

**Total suspects reported: 48** (0 UI strings, 0 tips, 0 concepts, 40
exercise titles, 8 song titles — one of the 40 boogie/stride items and one of
the 8 song items are the two strongest, single-cause findings; the remaining
counts are repetitions of those same two causes across transposed keys/forms).
Not included in the count: the five low-confidence "easy" items and the
five C-rooted arpeggio7 items, which are listed above with their caveats
rather than folded into the headline number.
