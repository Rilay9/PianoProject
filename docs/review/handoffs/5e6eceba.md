# Reviewer handoff — X3d: one tempo map (Entry 133)

Implementation HEAD: 5e6eceba (merged at d71146cb; the entry and this handoff in the record commit at HEAD). Respond in `responses/5e6eceba.md`. Your one required change on X3c (`responses/b71a55ca.md`), dispatched with a for-information line; X24 and X29 close on this review.

## What is asked

Whether the score model's tempo path is now canonical: one pure reader of the file's tempo events (a metronome mark's beat unit and dots normalised to quarter notes a minute; `<sound tempo>` taking precedence where both stand; every event at its position; the opening never displaced by a later mark), placed on the unrolled timeline as the model's tempo map; whether the Score label, the playback clock, the count-in, measurement, the dev screens and the import sheet all consume it and nothing else; whether the six adversaries you set hold red first through the real extraction (half = 60 + sound 120 → 120; dotted quarter = 60 + sound 90 → 90; an opening sound 100 not displaced by a bar-2 mark; E48's stated 100 and 72 through the real path; a genuine later change later; quarter and fractional unchanged) and the two bundled pieces open at 81 and 100; and what the learner sees on the Score screen before and after.

**Two rule questions the builder found on the corpus, kept open for you.** (1) *Where nothing sounds before the file's first tempo, that tempo opens the piece* — an addition to the brief's opening rule the builder made on evidence (eight bundled scores print their only opening tempo after rests only: Beethoven's Fifth's *Allegro con brio* stands on the first note after the opening eighth rest); the orchestrator kept it (a tempo before any sounding note is the opening; it matches the build, music21 and the committed player for those eight). (2) Four bundled scores write their first tempo only after notes have sounded (Bach's WTC I Prelude 2, the *Carol of the Bells* medley, *Le Festin*, the *Fallout 4* trailer): under the brief's rule they open at the app's default and change at their mark, where the build, music21 and the committed player took the mark as the piece's tempo. The orchestrator kept the brief's rule and recorded X32; your word decides whether a first tempo written after sounding notes is a change or the opening.

Also found on the way and recorded: OSMD gives tempo *words* numbers of its own (*The Entertainer*'s "Moderato" opened at 106 where its file says 70, so ragtime.6's lesson sentence was false on the committed code and is true now); the content build's `difficulty.py` reads the same misreading the app dropped (X31, P2, the build's owner).

## Files to inspect

`docs/prompts/entry-133.md` (the adversaries' table; the corpus tables under `runs/X3d/`; the Score pictures under `pictures/x3d/`; the heard tempo unverified as music); the new reader under `app/src/score/`; `app/src/score/extractScoreModel.ts` at the tempo map; `app/src/ui/importSheet.ts` at the readers it now consumes; the tests named in the entry; the map row for the new module.

## Not done, with the reason

See the entry's Not done lines.

## Do not re-review

X3c's accepted words (`responses/b71a55ca.md`); X26 and X27 as ruled; every closed seam.
