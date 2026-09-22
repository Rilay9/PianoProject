# Scout: accidental-spelling mismatches in lessons

Method: grepped `content/lessons/*.md` for `[A-G] ?(sharp|flat|♯|♭|#|b)`. That
pattern's trailing `\b` fails to match an ASCII flat letter directly against a
following digit (`Bb7` — `b` and `7` are both word characters, so no boundary
sits between them), which could have hidden ASCII chord symbols like `Bb7` or
`Db9`. Two follow-up greps closed that gap rather than assuming it didn't
matter: `grep -RnoE '[A-G]b[0-9]'` and `grep -RnoE '[A-G][#b][0-9]'` against
the same files, both returning zero hits — this corpus writes such chords with
the unicode ♭/♯ glyphs (`B♭m6`, `D♭7`) or the spelled-out word, both of which
the original pattern does catch, so the gap was real in principle but empty in
this corpus, not just unexamined. Also tried a chord-symbol-only pattern,
`[A-G](#|b)[^a-zA-Z0-9]`, which returned zero hits for the same reason.
Read every matched line in its paragraph, identified the key/scale/piece the
sentence is about, and checked the spelling: by scale-degree arithmetic for a
named key or scale, or against `notation.keys` in
`app/public/content/catalog.json` plus
`python tools/content/dump_score.py <item-id>` for a named piece.

## Suspects

None found.

## Notes on borderline cases (checked, not suspects)

- `content/lessons/3.1.md:36-37` — "Twinkle lands on its B flat over and over,
  while Ode to Joy never plays an F sharp at all." Dumped both scores:
  `song.folk.twinkle.f` has Bb in bars 2,3,5,6,7,8,10,11 (RH and LH) — confirmed.
  `song.classical.ode-to-joy.g` never has an F# in any bar (dump shows only
  G/A/B/C/D throughout) — confirmed, even though that item's own catalog
  `editionNotes` claims bar 12 "touches" the F# in a run to low D, which the
  dumped bar (`G4/qua A4/qua D4/hal`) does not bear out. That mismatch is
  between the catalog note and the score, not in the lesson text, so it is out
  of scope for this pass (lesson-vs-key/score), but flagging it here in case
  it's useful.
- `content/lessons/rock.overview.md:37` — "in E minor with a C sharp in it —
  the A major chord" (Scarborough Fair). Dumped `song.folk.scarborough-fair.pdmx`:
  bar 7 is `B4/qua C#5/qua A4/qua` under an `[A major]` chord — confirmed.
- `content/lessons/ragtime.6.md:28-30,79-82` — trio key changes for the three
  named rags. Dumped all three: `song.ragtime.joplin-entertainer` key-signature
  sequence 0,-1,0 (C→F→C); `song.ragtime.joplin-peacherine-rag` -3,-2,-3,-4
  (E♭→B♭→E♭→A♭); `song.ragtime.joplin-easy-winners` -4,-5 (A♭→D♭). All match
  the lesson's claims, including the "newly flattened" notes (D♭ into A♭, G♭
  into D♭).
- `content/lessons/3.3.md:25-34` and `content/lessons/holiday.md:34` (Good King
  Wenceslas/We Three Kings not separately dumped, low risk) — the G♯ claims for
  A-harmonic-minor / E7 were checked against `song.folk.greensleeves.chords`:
  G# appears in bars 6, 7, 14 under `[E dominant]` — confirmed.
- `content/lessons/jazz.4.md:35` and `Margie` mention — dumped
  `song.pop.avalon.pdmx` (fifths -1, F), `song.pop.whispering.pdmx` (fifths -3,
  E♭) and `song.pop.margie.pdmx` (fifths -1, F) — all match the lesson's key
  claims.
- `content/lessons/blues.3.md`, `blues.4.md`, `improv.5.md` — all blue-note
  spellings (F♯ in C, the "raised fourth in every key" explanation, and the
  flat-fifth-runs-out-of-flat-names passage in `blues.4.md:45`) were checked by
  scale-degree arithmetic against the owner's stated rule and are consistent
  with it; not treated as faults per that rule.
- All other hits (circle-of-fifths accidentals in `4.1.md`/`4.2.md`, harmonic/
  melodic minor in `4.2.md`, primary chords and V7 spelling in `3.2.md`,
  `theory.6.md`, `theory.7.md`, ii–V–I and tritone-substitution note spellings
  in `jazz.5.md`/`jazz.7.md`, the chord-tone scan in `improv.8.md`, the
  black-key/F♯-pentatonic claim in `improv.4.md`) were verified by direct
  scale/chord-tone arithmetic (e.g. G7 = G-B-D-F, Dm7's 7th = C, E7 = E-G♯-B-D,
  D♭7 shares F/C♭ with G7's F/B, etc.) and all resolved correctly with no
  mismatched letter-plus-accidental found.

## Footer

- Hits read: 76 regex matches (`grep -o`) across 56 distinct lesson lines in
  27 files (full `grep -n` listing captured before review).
- Suspects: 0.
- Unchecked / not independently verified against a score: `blues.6.md:30`
  (Jimmy Yancey ending "almost everything in E flat" — historical-performer
  trivia, not tied to any catalog item in this app, so there is no score to
  dump); `technique.7.md:26,56` and `technique.8.md:27` (generic fingering/
  practice illustrations — "D flat", "the F sharp you have been playing... is
  actually an F" — that name a key or note only as a hypothetical example, not
  a specific piece or scale degree, so there is nothing concrete to check them
  against). None of these assert a checkable key-vs-spelling fact, so none are
  listed as suspects or unchecked-pending-work; they are simply outside what
  the method can verify.
