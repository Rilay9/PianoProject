# Style verification for retained quarry candidates

Branch: `chatgpt/pdmx-dump-2026-10-05`
Date: 2026-10-05

Purpose: close the named-style claims that matter to retained curriculum candidates. This is not a general style taxonomy. A title/genre name is never accepted as proof that a specific written figure is present.

## 1. Bossa nova — Garota de Ipanema `QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8`

### What the score contains
The retained solo-piano edition is 34 bars in 2/4 with two staves and 24 chord symbols. In bars 1-7 and again at the return, the lower staff repeats a syncopated chordal accompaniment pattern while harmony changes. The pattern contains attacks separated by rests/ties rather than four-square block chords.

### External source boundary
Useful pedagogy sources agree on the larger coordination principle, but not one universal immutable rhythm:

- Piano With Jonny, *The Jobim Chord Progression*: the left hand supplies a Brazilian bass line/root-and-fifth function; the right hand uses a syncopated two-measure bossa rhythm and may anticipate chord changes.
  https://pianowithjonny.com/piano-lessons/the-jobim-chord-progression/
- Piano With Jonny, *Play Girl From Ipanema on Piano*: a standard groove is described with a one-measure LH rhythm and a two-measure RH rhythm.
  https://pianowithjonny.com/piano-lessons/play-girl-from-ipanema-on-piano/
- Piano With Jonny, *Girl From Ipanema — Accompaniment*: the teaching sequence explicitly progresses from shells/open voicings to bossa bass, then to a four-note RH bossa rhythm and fills.
  https://pianowithjonny.com/courses/girl-from-ipanema-accompaniment-1/

### Decision
**ADMIT AS BOSSA MODEL / TRANSFER CANDIDATE, not as the sole canonical bossa pattern.**

The score is strong enough to unblock the curriculum's claim that it can show a real written bossa accompaniment in context. The lesson/generator should teach a **small sourced family of bossa coordination patterns**, not assert that this exact rhythm is “the” bossa rhythm.

Curriculum consequence for `ABILITY-MAP.md` A7c.3:
- CONTROL no longer needs to remain globally `SOURCE-NEEDED`; a first sourced control pattern can be built from the published coordination principle and an explicitly chosen pattern.
- MODEL/TRANSFER can use this Garota edition because it actually writes the accompaniment under the melody.
- `Só Danço Samba` and `Corcovado` remain APPLICATION substrates, not acquisition models.
- G14 should be scoped as “one or more sourced bossa accompaniment patterns,” not “the bossa LH pattern.”

Still required before implementation: the build brief must write the exact onset/duration contract for whichever control pattern it chooses. Do not infer that contract from this prose.

## 2. Cuban piano — La Negra Tiene Tumbao `QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd`

### What the score contains
The retained two-staff arrangement has long stretches of repeated syncopated chordal/accompaniment figures coordinated with bass motion and changing harmony.

### External terminology boundary
Reference material supports these distinctions:

- A **guajeo** is a repeated syncopated harmonic/melodic ostinato, often arpeggiated, and piano guajeos are central to Cuban/salsa texture.
  https://en.wikipedia.org/wiki/Guajeo
- **Montuno** has multiple meanings; in one common piano usage it names the repeated syncopated piano guajeo/ostinato accompanying the montuno section.
  https://en.wikipedia.org/wiki/Montuno
- **Tumbao** is historically the bass rhythm; in contemporary Cuban timba, piano guajeos may also be called tumbaos.
  https://en.wikipedia.org/wiki/Tumbao
- **Ponchando** is specifically a non-arpeggiated/block-chord guajeo whose attack points are foregrounded.
  https://en.wikipedia.org/wiki/Guajeo#Ponchando

### Decision
**KEEP AS HIGH-PRIORITY CUBAN MODEL / MUSIC candidate, but do not label the excerpt “tumbao” merely because the title says so.**

Before a named figure is assigned, the selected bars must be classified from their actual note motion:
- arpeggiated/repeating harmonic-melodic ostinato -> guajeo (and possibly montuno in the curricular usage);
- repeated block-chord attacks -> ponchando;
- bass pattern -> tumbao in the bass sense;
- “piano tumbao” only if the lesson explicitly teaches the timba/contemporary usage.

Curriculum consequence for A7c.2/G15:
- do not make `montuno` and `guajeo` synonyms without explanation;
- do not define montuno as necessarily arpeggiated;
- a new G15 generator should reproduce the sourced structural definition of the chosen figure, with a sibling near-miss that proves the checker rejects the wrong family.

## 3. Habanera — Por Una Cabeza `QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs`

The current ability map states that its LH pattern uses onsets `0, 1.5, 2, 3` in 4/4. That is the doubled-duration equivalent of the familiar 2/4 habanera cell `dotted-eighth, sixteenth, eighth, eighth` (attack positions 0, .75, 1, 1.5 in quarter-note units).

### Decision
**KEEP AS HABANERA MODEL candidate.**

This claim is structurally plausible from the exact onset pattern, not from “tango” in the title. The build still needs CK-5 / independent parse verification against the exact selected bars as the current ability map already requires.

Do not collapse this with tresillo: the map is right to require both a positive match and cross-failure between the two cells.

## 4. Ragtime / stop-time — The Ragtime Dance `QmXd7HNnNZodQvrybARoZN8NtcZ2LVpJ1Wxbkc8Gq9YJ36`

The score clearly contains abrupt accented chord attacks and alternation between continuous syncopated texture and more interrupted/space-filled passages.

The Library of Congress describes core ragtime broadly as syncopated treble over a steady bass, normally in contrasting strains; that supports the piece as an authentic ragtime texture/form source, but does **not** by itself certify that every interrupted passage should be taught under the technical label `stop-time`.
https://www.loc.gov/static/programs/teachers/professional-development/online-office-hours/documents/2020-07-21_Ragtime-Collection-and-Digital-Music-Resources.pdf

### Decision
**ADMIT for ragtime texture/contrast MODEL; keep the specific label `stop-time` source-gated unless a direct definition is supplied in the build brief.**

The curriculum does not need the label in order to use the passage pedagogically. If the term is important, source and define it first; otherwise teach the observable contrast.

## 5. Source-use rule for Claude/builders

For named style cells, every build brief must contain four separate statements:
1. **Published definition** — what the figure/style claim means.
2. **Exact score evidence** — what the retained bars actually contain.
3. **Teaching role** — CONTROL, MODEL/TRANSFER, MUSIC, or INDEPENDENCE.
4. **Checker boundary** — what can be independently verified structurally and what remains musical/pedagogical judgement.

A title, metadata tag, detector result, or agreement between two parsers is never a substitute for any of those four.