# P5 — what was authored, what was skipped, and why

Date: 2026-09-05 · Phase: P5 (`feat/p5-content`) · Status: accepted

`prompts/P5-content.md` asks for every entry in `docs/02-curriculum.md` Part F
to be authored as ABC, and for anything that cannot be verified to be skipped
with a note. This records which way each judgement went and the two rule
changes the work needed.

## 1. Melodies are only written when they can be checked

The rule applied throughout: **write a melody only if it can be checked against
something, or if it is short and unambiguous enough to be stated with
confidence.** Three sources of verification were available:

1. An edition already in the cloned libraries. `Ode_to_Joy_Easy_variation.mxl`,
   `Happy_Birthday_To_You_C_Major.mxl`, `Happy_Birthday_To_You_Piano.mxl` and
   `Greensleeves_for_Piano_easy_and_beautiful.mxl` were each dumped note by
   note and the authored version compared against them.
2. Internal consistency — a four-note nursery tune whose harmony, phrase
   lengths and range all agree is not in doubt.
3. Nothing. In that case the tune is skipped.

**No network verification was possible.** The environment's egress proxy allows
source repositories and package registries and refuses everything else;
`abcnotation.com` and `en.wikipedia.org` both return 403 through it. That is
the reason the skip list below is as long as it is, and it is the single change
that would shorten it most.

### Skipped, with reasons

| Tune | Part F stage | Reason |
|------|-------------:|--------|
| Amazing Grace | 2.3 / 3.2 / 3.5 / 4.3 | The rhythm of the New Britain tune could not be stated with confidence and no edition of it exists in the cloned libraries. It had been authored in an earlier pass; that file is **removed** rather than left in with notes that may be wrong. |
| Yankee Doodle | 1.5 | The second strain could not be stated with confidence, and the phrase that is certain ("called it macaroni") descends below the five-finger position the unit is about. |
| Go Tell Aunt Rhody, Lavender's Blue, Kum Ba Yah, Alouette, Skip to My Lou, Aura Lee, This Old Man, Camptown Races, Banks of the Ohio, The Ash Grove, Down in the Valley, He's Got the Whole World, Michael Row the Boat, Tom Dooley, Clementine, Oh Susanna, Red River Valley, Home on the Range, Simple Gifts, Beautiful Dreamer, Streets of Laredo, Shenandoah, The Water Is Wide, Scarborough Fair, Auld Lang Syne, Silent Night, Deck the Halls, We Wish You, Joy to the World, Hark the Herald, O Holy Night, God Rest Ye, Ma'oz Tzur, Sevivon | 1.2 – 4.3 | Melody not statable with confidence; no edition available to check against. |
| Frankie and Johnny, Careless Love, C.C. Rider, Hesitation Blues, Memphis Blues, Trouble in Mind, St. Louis Blues, Pinetop's Boogie Woogie | 4 – 6 (blues) | As above. The blues rungs are served instead by the twelve-bar shuffle exercises in C, F and G, which teach the form, the shuffle and the boogie bass without needing a tune. |
| Ja-Da, After You've Gone, Avalon, Some of These Days, Bill Bailey and the rest of the 1902–1930 jazz list | 5 – 7 (jazz) | As above. |
| La Cucaracha, Cielito Lindo, La Paloma, El Choclo, La Cumparsita, Tico-Tico | 5 – 8 (latin) | As above. The latin module's lesson teaches clave, tumbao and montuno on material that is available. |
| Tarantella | 4.5 | As above. |

Every one of these is a *deferral*, not a refusal: each is public domain and
can be authored in a later run from a source edition, or imported by the owner
through the P7 import screen.

## 2. What was authored instead

Where a unit's listed tunes were all skipped, the unit is filled from verified
material rather than left empty:

- **Key variants.** Stage 3.1 and 3.2 are about G major, F major and the
  primary chords in those keys. Ode to Joy in G, Twinkle in F, Jingle Bells in
  G and When the Saints in F are the same verified melodies set in the key the
  unit teaches, with the chords the unit teaches.
- **Texture variants.** Greensleeves — whose melody was checked bar for bar
  against the library edition — appears four times: single-note left hand
  (2.4), block chords (3.3), waltz bass (3.6) and barred in 6/8 (4.5). Each is
  the accompaniment pattern its unit is about.
- **One study written here.** `exercise.reading.steps-and-skips-c`, for unit
  1.5, where all three listed tunes are skipped. Every interval in it is a 2nd
  or a 3rd and the hand never leaves C position, which is exactly what the unit
  asks a learner to read.

## 3. Rule changes this pass needed

- **`validate.py --strict-license` now checks only items that carry a file.**
  An item with no file ships nothing. The rock and metal module's seven songs
  are copyright, are never bundled, and their catalog entries exist to carry an
  `importHint`; their licence line says "not redistributable" precisely because
  that is the truth, and failing the build on it was backwards. Runtime drills
  are the same case.
- **`content/catalog.static.json` is a new, hand-written catalog fragment**,
  merged first by `build.py`. The 46 runtime drills and the 7 import
  placeholders have no generator and no source file, so a file in the
  repository is the right home for them.

## 4. Video links are channel-level, not per-video

`docs/03` §6 asks for `videos[]` with real URLs. Specific video URLs could not
be checked from here (see §1), and a dead link in a lesson is worse than a
link to the teacher's channel or lesson index, so every lesson links the
teacher and names the topic to look for. Replacing them with checked
per-video URLs is a follow-up, not a design decision.

## 5. Two bugs this pass found

- **music21 10.5 ignores `V:1 clef=treble`.** It parses the voice, then
  overrides the declared clef with its own best-clef guess, applied identically
  to every voice in the score. Sixteen authored tunes were printed with two
  treble staves or two bass staves before the render previews were looked at.
  `abc_tools.parse_voice_clefs` / `apply_voice_clefs` now force the
  declaration, and four tests cover it.
- **Transposing by a semitone count lets music21 respell.** B flat 7's seventh
  came out as G sharp instead of A flat in the blues exercises. The builder now
  works from interval names and from the chord symbol's own pitches.
